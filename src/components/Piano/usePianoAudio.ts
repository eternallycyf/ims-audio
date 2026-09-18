import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KEY_BY_ID,
  KEY_BY_KEYCODE,
  KEY_BY_MIDI,
  PIANO_KEYBOARD,
  midiToFreq,
  noteAdvanceMs,
  noteSoundMs,
  scorePitches,
  trackDurationMs,
  type LyricLine,
  type ScoreNote,
  type SongTrack,
} from './constants';
import { createPianoSampler, type PianoSampler } from './soundfont';

export type PlayHandler = (keyId: string) => void;

/** @deprecated 谱面改为静态展示，不再实时推送歌词高亮 */
export type LyricUpdate = {
  index: number;
  charIndex: number;
  current: LyricLine | null;
  prev: LyricLine | null;
  next: LyricLine | null;
  track: SongTrack | null;
};

export type ProgressUpdate = {
  elapsedMs: number;
  totalMs: number;
  playing: boolean;
  paused: boolean;
  track: SongTrack | null;
};

type ActiveVoice = {
  master: GainNode;
};

type Session = {
  track: SongTrack;
  notes: ScoreNote[];
  totalMs: number;
  /** AudioContext 时间原点：elapsed = (now - origin) * 1000 + baseElapsed */
  origin: number;
  baseElapsed: number;
  paused: boolean;
  gen: number;
};

/** UI 音量 0–1 映射到实际 master gain；满档略高于 1，补偿采样偏安静 */
const VOLUME_OUTPUT_MAX = 1.85;

export function usePianoAudio(onPress?: (keyId: string) => void, defaultVolume = 1) {
  const context = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new AudioContext();
  }, []);

  const masterGain = useMemo(() => {
    if (!context) return null;
    const g = context.createGain();
    const v = Math.max(0, Math.min(1, defaultVolume));
    g.gain.value = v * VOLUME_OUTPUT_MAX;
    g.connect(context.destination);
    return g;
  }, [context]); // eslint-disable-line react-hooks/exhaustive-deps -- 仅绑定 AudioContext

  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number>(0);
  const voicesRef = useRef<ActiveVoice[]>([]);
  const lyricCbRef = useRef<((u: LyricUpdate) => void) | undefined>();
  const progressCbRef = useRef<((u: ProgressUpdate) => void) | undefined>();
  const sessionRef = useRef<Session | null>(null);
  const playGenRef = useRef(0);
  const samplerRef = useRef<PianoSampler | null>(null);
  const masterGainRef = useRef(masterGain);
  masterGainRef.current = masterGain;
  /** 全音域采样升级后重排正在播放的曲目（见下方 load effect） */
  const scheduleFromRef = useRef<(fromMs: number, opts?: { skipActiveNotes?: boolean }) => void>(
    () => {},
  );
  /** 升级全音域前的中音域采样器；保留其已排程声源，避免 stopAll 后重触发开头音 */
  const legacySamplerRef = useRef<PianoSampler | null>(null);

  const [ready, setReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [volume, setVolumeState] = useState(() => Math.max(0, Math.min(1, defaultVolume)));
  const [playback, setPlayback] = useState<ProgressUpdate>({
    elapsedMs: 0,
    totalMs: 0,
    playing: false,
    paused: false,
    track: null,
  });

  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const applyMasterVolume = useCallback(
    (v = volumeRef.current) => {
      const g = masterGainRef.current;
      if (!g || !context) return;
      const next = Math.max(0, Math.min(1, v)) * VOLUME_OUTPUT_MAX;
      const now = context.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(next, now);
    },
    [context],
  );

  const setVolume = useCallback(
    (v: number) => {
      const next = Math.max(0, Math.min(1, v));
      setVolumeState(next);
      volumeRef.current = next;
      applyMasterVolume(next);
    },
    [applyMasterVolume],
  );

  useEffect(() => {
    if (!context || !masterGain) return;
    let cancelled = false;
    legacySamplerRef.current?.stopAll();
    legacySamplerRef.current = null;
    samplerRef.current = null;
    setReady(false);
    setLoadProgress(0);

    void (async () => {
      const shared = new Map<number, AudioBuffer>();
      const mid = await createPianoSampler(
        context,
        48,
        84,
        (loaded, total) => {
          if (!cancelled) setLoadProgress(Math.round((loaded / total) * 50));
        },
        shared,
        masterGain,
      );
      if (cancelled) {
        mid.dispose();
        return;
      }
      samplerRef.current = mid;
      setReady(true);

      const full = await createPianoSampler(
        context,
        21,
        108,
        (loaded, total) => {
          if (!cancelled) setLoadProgress(50 + Math.round((loaded / total) * 50));
        },
        shared,
        masterGain,
      );
      if (cancelled) {
        full.dispose();
        return;
      }
      // 升级全音域：中音域可能已把整曲预排进 BufferSource。
      // 不要 stopAll + 重排——否则前奏正在响的音（如富士山下开头 c¹）会再起键一次。
      // 保留 mid 声源继续播完；新键位走 full；停/seek 时一并 silence。
      // 注意：勿 dispose(mid)，会清掉与 full 共享的 buffers。
      if (samplerRef.current === mid) {
        legacySamplerRef.current = mid;
      }
      samplerRef.current = full;
      setLoadProgress(100);
    })().catch(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      legacySamplerRef.current?.stopAll();
      legacySamplerRef.current = null;
      samplerRef.current?.dispose();
      samplerRef.current = null;
    };
  }, [context, masterGain]);

  const silenceVoices = useCallback(() => {
    if (!context) return;
    const now = context.currentTime;
    voicesRef.current.forEach(({ master }) => {
      try {
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(0, now);
      } catch {
        // ignore
      }
    });
    voicesRef.current = [];
    samplerRef.current?.stopAll();
    legacySamplerRef.current?.stopAll();
    legacySamplerRef.current = null;
  }, [context]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const emitProgress = useCallback((u: ProgressUpdate) => {
    progressCbRef.current?.(u);
    setPlayback(u);
  }, []);

  const getElapsedMs = useCallback(() => {
    const s = sessionRef.current;
    if (!s || !context) return 0;
    if (s.paused) return s.baseElapsed;
    return Math.min(s.totalMs, s.baseElapsed + (context.currentTime - s.origin) * 1000);
  }, [context]);

  const stopMusic = useCallback(() => {
    playGenRef.current += 1;
    sessionRef.current = null;
    clearTimers();
    silenceVoices();
    emitProgress({
      elapsedMs: 0,
      totalMs: 0,
      playing: false,
      paused: false,
      track: null,
    });
  }, [clearTimers, emitProgress, silenceVoices]);

  const playOscAt = useCallback(
    (midi: number, when: number, durationSec: number, gainScale = 1) => {
      if (!context || midi <= 0) return;
      const freq = midiToFreq(midi);
      const press = Math.max(0.08, durationSec);
      const release = Math.min(2.4, Math.max(0.9, 1.5 + (60 - midi) * 0.02));
      const master = context.createGain();
      master.connect(masterGainRef.current ?? context.destination);
      const peak = 1.05 * gainScale;
      master.gain.setValueAtTime(0.0001, when);
      master.gain.exponentialRampToValueAtTime(peak, when + 0.008);
      master.gain.exponentialRampToValueAtTime(peak * 0.5, when + Math.min(0.3, press * 0.5));
      master.gain.setValueAtTime(peak * 0.5, when + press);
      master.gain.exponentialRampToValueAtTime(0.0001, when + press + release);

      (
        [
          [1, 'triangle', 1],
          [2, 'sine', 0.14],
          [3, 'sine', 0.05],
        ] as const
      ).forEach(([mul, type, amp]) => {
        const osc = context.createOscillator();
        const g = context.createGain();
        osc.type = type;
        osc.frequency.value = freq * mul;
        g.gain.value = amp;
        osc.connect(g);
        g.connect(master);
        osc.start(when);
        osc.stop(when + press + release + 0.02);
      });

      voicesRef.current.push({ master });
      if (voicesRef.current.length > 40) {
        voicesRef.current = voicesRef.current.slice(-28);
      }
    },
    [context],
  );

  const playMidiAt = useCallback(
    (midi: number, when?: number, durationMs = 480, gainScale = 1) => {
      if (!context || midi <= 0) return;

      const t = when ?? context.currentTime;
      const delayMs = Math.max(0, (t - context.currentTime) * 1000);
      const durationSec = Math.max(0.12, durationMs / 1000);

      const sampler = samplerRef.current;
      if (sampler?.ready && sampler.has(midi)) {
        sampler.play(midi, t, durationSec, gainScale);
      } else {
        playOscAt(midi, t, durationSec, gainScale);
      }

      const key = KEY_BY_MIDI[midi];
      if (key) {
        const flash = () => {
          const s = sessionRef.current;
          if (!s || s.paused) return;
          onPressRef.current?.(key.id);
        };
        if (delayMs < 8) flash();
        else {
          const timer = setTimeout(flash, delayMs);
          timersRef.current.push(timer);
        }
      }
    },
    [context, playOscAt],
  );

  const playMidi = useCallback(
    (midi: number) => {
      if (!context || midi <= 0) return;
      if (context.state === 'suspended') {
        void context.resume();
      }
      applyMasterVolume();
      playMidiAt(midi, context.currentTime, 900);
    },
    [applyMasterVolume, context, playMidiAt],
  );

  const play = useCallback<PlayHandler>(
    (keyId: string) => {
      const key = KEY_BY_ID[keyId];
      if (key) playMidi(key.midi);
    },
    [playMidi],
  );

  const scheduleFrom = useCallback(
    (fromMs: number, opts?: { skipActiveNotes?: boolean }) => {
      const s = sessionRef.current;
      if (!s || !context || s.paused) return;

      clearTimers();
      silenceVoices();

      const origin = context.currentTime + 0.04;
      s.origin = origin;
      s.baseElapsed = fromMs;

      let t = 0;
      s.notes.forEach((note) => {
        const [pitch] = note;
        const advance = noteAdvanceMs(note);
        const sound = noteSoundMs(note);
        const start = t;
        const soundEnd = start + sound;
        t += advance;
        if (soundEnd <= fromMs) return;
        // 采样器热切换等场景：已起键的音不再重触发，避免开头连按两下
        if (opts?.skipActiveNotes && start < fromMs) return;
        const midis = scorePitches(pitch);
        if (!midis.length) return;
        const playStart = Math.max(start, fromMs);
        const when = origin + (playStart - fromMs) / 1000;
        const playDur = soundEnd - playStart;
        const gainScale = midis.length > 1 ? 0.85 / Math.sqrt(midis.length) : 1;
        midis.forEach((midi) => playMidiAt(midi, when, playDur, gainScale));
      });

      const gen = s.gen;
      const tick = () => {
        const cur = sessionRef.current;
        if (!cur || cur.gen !== gen || cur.paused) return;
        const elapsed = Math.min(
          cur.totalMs,
          cur.baseElapsed + (context.currentTime - cur.origin) * 1000,
        );
        emitProgress({
          elapsedMs: elapsed,
          totalMs: cur.totalMs,
          playing: true,
          paused: false,
          track: cur.track,
        });
        if (elapsed >= cur.totalMs) {
          playGenRef.current += 1;
          sessionRef.current = null;
          clearTimers();
          emitProgress({
            elapsedMs: cur.totalMs,
            totalMs: cur.totalMs,
            playing: false,
            paused: false,
            track: cur.track,
          });
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      emitProgress({
        elapsedMs: fromMs,
        totalMs: s.totalMs,
        playing: true,
        paused: false,
        track: s.track,
      });
    },
    [clearTimers, context, emitProgress, playMidiAt, silenceVoices],
  );
  scheduleFromRef.current = scheduleFrom;

  const playMusic = useCallback(
    (
      track: SongTrack | ScoreNote[],
      onLyric?: (u: LyricUpdate) => void,
      onProgress?: (u: ProgressUpdate) => void,
      fromMs = 0,
    ) => {
      stopMusic();
      lyricCbRef.current = onLyric;
      progressCbRef.current = onProgress;
      if (!context) return;

      const gen = playGenRef.current;
      const start = async () => {
        if (context.state === 'suspended') await context.resume();
        if (playGenRef.current !== gen) return;
        // Strict Mode 卸载可能把 master 置 0，开播前按当前音量恢复
        applyMasterVolume();

        const isTrack = !Array.isArray(track);
        const notes = isTrack ? track.notes : track;
        if (!isTrack) {
          // 无元数据的纯音符：包一层临时 track
          const temp: SongTrack = {
            id: '_temp',
            title: '',
            artist: '',
            source: '',
            notes,
            lyrics: [],
          };
          sessionRef.current = {
            track: temp,
            notes,
            totalMs: trackDurationMs(notes),
            origin: 0,
            baseElapsed: Math.max(0, fromMs),
            paused: false,
            gen,
          };
        } else {
          sessionRef.current = {
            track,
            notes: track.notes,
            totalMs: trackDurationMs(track),
            origin: 0,
            baseElapsed: Math.max(0, fromMs),
            paused: false,
            gen,
          };
        }
        scheduleFrom(Math.max(0, fromMs));
      };
      void start();
    },
    [applyMasterVolume, context, scheduleFrom, stopMusic],
  );

  const pauseMusic = useCallback(() => {
    const s = sessionRef.current;
    if (!s || !context || s.paused) return;
    const elapsed = Math.min(s.totalMs, s.baseElapsed + (context.currentTime - s.origin) * 1000);
    s.paused = true;
    s.baseElapsed = elapsed;
    clearTimers();
    silenceVoices();
    emitProgress({
      elapsedMs: elapsed,
      totalMs: s.totalMs,
      playing: true,
      paused: true,
      track: s.track,
    });
  }, [clearTimers, context, emitProgress, silenceVoices]);

  const resumeMusic = useCallback(() => {
    const s = sessionRef.current;
    if (!s || !context || !s.paused) return;
    void context.resume().then(() => {
      if (!sessionRef.current || sessionRef.current !== s) return;
      applyMasterVolume();
      s.paused = false;
      s.gen = playGenRef.current;
      scheduleFrom(s.baseElapsed);
    });
  }, [applyMasterVolume, context, scheduleFrom]);

  const seekMusic = useCallback(
    (ms: number) => {
      const s = sessionRef.current;
      if (!s || !context) return;
      const clamped = Math.max(0, Math.min(s.totalMs, ms));
      s.paused = false;
      s.gen = playGenRef.current;
      void context.resume().then(() => {
        if (!sessionRef.current) return;
        scheduleFrom(clamped);
      });
    },
    [context, scheduleFrom],
  );

  const seekToLyric = useCallback(
    (lineIndex: number) => {
      const s = sessionRef.current;
      if (!s) return;
      const line = s.track.lyrics[lineIndex];
      if (!line) return;
      seekMusic(line.time);
    },
    [seekMusic],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const which = e.which || e.keyCode;
      const key = KEY_BY_KEYCODE[which];
      if (key) {
        e.preventDefault();
        play(key.id);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [play]);

  // 卸载时停掉调度与声源；不要把 masterGain 置 0（Strict Mode 会复用该节点导致再次进入没声）
  useEffect(() => {
    return () => {
      playGenRef.current += 1;
      sessionRef.current = null;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      const ctx = context;
      const now = ctx?.currentTime ?? 0;
      voicesRef.current.forEach(({ master }) => {
        try {
          master.gain.cancelScheduledValues(now);
          master.gain.setValueAtTime(0, now);
        } catch {
          // ignore
        }
      });
      voicesRef.current = [];
      samplerRef.current?.stopAll();
    };
  }, [context]);

  // 挂载 / 采样就绪后恢复主音量
  useEffect(() => {
    if (!masterGain) return;
    applyMasterVolume();
  }, [applyMasterVolume, masterGain, ready]);

  return {
    play,
    playMidi,
    playMusic,
    pauseMusic,
    resumeMusic,
    seekMusic,
    seekToLyric,
    stopMusic,
    getElapsedMs,
    playback,
    volume,
    setVolume,
    ready,
    loadProgress,
    keys: PIANO_KEYBOARD,
    whiteKeys: PIANO_KEYBOARD.filter((k) => k.type === 'white'),
    blackKeys: PIANO_KEYBOARD.filter((k) => k.type === 'black'),
  };
}

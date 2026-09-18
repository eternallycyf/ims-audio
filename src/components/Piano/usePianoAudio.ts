import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KEY_BY_ID,
  KEY_BY_KEYCODE,
  KEY_BY_MIDI,
  PIANO_KEYBOARD,
  midiToFreq,
  resolveLyricAt,
  scorePitches,
  type LyricLine,
  type ScoreNote,
  type SongTrack,
} from './constants';
import { createPianoSampler, type PianoSampler } from './soundfont';

export type PlayHandler = (keyId: string) => void;

export type LyricUpdate = {
  index: number;
  /** 当前行内高亮字下标；-1 表示整行/无字（如 ♪） */
  charIndex: number;
  current: LyricLine | null;
  prev: LyricLine | null;
  next: LyricLine | null;
  track: SongTrack | null;
};

type ActiveVoice = {
  master: GainNode;
};

export function usePianoAudio(onPress?: (keyId: string) => void) {
  const context = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new AudioContext();
  }, []);

  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number>(0);
  const voicesRef = useRef<ActiveVoice[]>([]);
  const lyricCbRef = useRef<((u: LyricUpdate) => void) | undefined>();
  const lyricIndexRef = useRef(-1);
  const lyricCharRef = useRef(-2);
  const playingRef = useRef(false);
  const playGenRef = useRef(0);
  const samplerRef = useRef<PianoSampler | null>(null);

  const [ready, setReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    if (!context) return;
    let cancelled = false;
    samplerRef.current = null;
    setReady(false);
    setLoadProgress(0);

    // 先中音可播，再补全 88 键 A0–C8（MIDI 21–108）
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
      );
      if (cancelled) {
        full.dispose();
        return;
      }
      samplerRef.current = full;
      setLoadProgress(100);
    })().catch(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      samplerRef.current?.dispose();
      samplerRef.current = null;
    };
  }, [context]);

  const silenceVoices = useCallback(() => {
    if (!context) return;
    const now = context.currentTime;
    voicesRef.current.forEach(({ master }) => {
      try {
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
        master.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      } catch {
        // ignore
      }
    });
    voicesRef.current = [];
    samplerRef.current?.stopAll();
  }, [context]);

  const emitLyric = useCallback(
    (track: SongTrack | null, index: number, charIndex = -1) => {
      lyricIndexRef.current = index;
      lyricCharRef.current = charIndex;
      if (!track) {
        lyricCbRef.current?.({
          index: -1,
          charIndex: -1,
          current: null,
          prev: null,
          next: null,
          track: null,
        });
        return;
      }
      const lines = track.lyrics;
      lyricCbRef.current?.({
        index,
        charIndex,
        current: lines[index] ?? null,
        prev: index > 0 ? lines[index - 1] : null,
        next: index < lines.length - 1 ? lines[index + 1] : null,
        track,
      });
    },
    [],
  );

  const stopMusic = useCallback(() => {
    playGenRef.current += 1;
    playingRef.current = false;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    silenceVoices();
    emitLyric(null, -1, -1);
  }, [emitLyric, silenceVoices]);

  const playOscAt = useCallback(
    (midi: number, when: number, durationSec: number, gainScale = 1) => {
      if (!context || midi <= 0) return;
      const freq = midiToFreq(midi);
      const press = Math.max(0.08, durationSec);
      const release = Math.min(2.4, Math.max(0.9, 1.5 + (60 - midi) * 0.02));
      const master = context.createGain();
      master.connect(context.destination);
      const peak = 0.42 * gainScale;
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
          if (!playingRef.current && delayMs > 0) return;
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
      playMidiAt(midi, context.currentTime, 900);
    },
    [context, playMidiAt],
  );

  const play = useCallback<PlayHandler>(
    (keyId: string) => {
      const key = KEY_BY_ID[keyId];
      if (key) playMidi(key.midi);
    },
    [playMidi],
  );

  const playMusic = useCallback(
    (track: SongTrack | ScoreNote[], onLyric?: (u: LyricUpdate) => void) => {
      stopMusic();
      lyricCbRef.current = onLyric;

      if (!context) return;

      const gen = playGenRef.current;

      const start = async () => {
        if (context.state === 'suspended') {
          await context.resume();
        }
        if (playGenRef.current !== gen) return;

        const isTrack = !Array.isArray(track);
        const notes = isTrack ? track.notes : track;
        const song = isTrack ? track : null;

        playingRef.current = true;
        const origin = context.currentTime + 0.05;

        let offsetMs = 0;
        notes.forEach(([pitch, duration]) => {
          const midis = scorePitches(pitch);
          const gainScale = midis.length > 1 ? 0.72 / Math.sqrt(midis.length) : 1;
          midis.forEach((midi) => {
            playMidiAt(midi, origin + offsetMs / 1000, duration, gainScale);
          });
          offsetMs += duration;
        });

        const totalMs = offsetMs;

        if (song && song.lyrics.length) {
          const first = resolveLyricAt(song, 0);
          emitLyric(song, first.lineIndex, first.charIndex);
          const tick = () => {
            if (!playingRef.current || playGenRef.current !== gen) return;
            const elapsed = (context.currentTime - origin) * 1000;
            if (elapsed >= totalMs + 250) {
              playingRef.current = false;
              emitLyric(null, -1, -1);
              return;
            }
            const { lineIndex, charIndex } = resolveLyricAt(song, elapsed);
            if (lineIndex !== lyricIndexRef.current || charIndex !== lyricCharRef.current) {
              emitLyric(song, lineIndex, charIndex);
            }
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        } else {
          const endTimer = setTimeout(() => {
            if (playGenRef.current !== gen) return;
            playingRef.current = false;
            emitLyric(null, -1, -1);
          }, totalMs + 250);
          timersRef.current.push(endTimer);
        }
      };

      void start();
    },
    [context, emitLyric, playMidiAt, stopMusic],
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
      stopMusic();
    };
  }, [play, stopMusic]);

  return {
    play,
    playMidi,
    playMusic,
    stopMusic,
    ready,
    loadProgress,
    keys: PIANO_KEYBOARD,
    whiteKeys: PIANO_KEYBOARD.filter((k) => k.type === 'white'),
    blackKeys: PIANO_KEYBOARD.filter((k) => k.type === 'black'),
  };
}

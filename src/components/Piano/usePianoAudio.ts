import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  KEY_BY_CODE,
  KEY_BY_ID,
  KEY_BY_MIDI,
  PIANO_KEYBOARD,
  midiToFreq,
  type LyricLine,
  type ScoreNote,
  type SongTrack,
} from './constants';

export type PlayHandler = (keyId: string) => void;

export type LyricUpdate = {
  index: number;
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
  const playingRef = useRef(false);
  const playGenRef = useRef(0);

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
  }, [context]);

  const emitLyric = useCallback((track: SongTrack | null, index: number) => {
    lyricIndexRef.current = index;
    if (!track) {
      lyricCbRef.current?.({
        index: -1,
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
      current: lines[index] ?? null,
      prev: index > 0 ? lines[index - 1] : null,
      next: index < lines.length - 1 ? lines[index + 1] : null,
      track,
    });
  }, []);

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
    emitLyric(null, -1);
  }, [emitLyric, silenceVoices]);

  /** 在 AudioContext 绝对时间 when 处发声；when≈now 时立即播 */
  const playMidiAt = useCallback(
    (midi: number, when?: number) => {
      if (!context || midi <= 0) return;

      const t = when ?? context.currentTime;
      const delayMs = Math.max(0, (t - context.currentTime) * 1000);
      const freq = midiToFreq(midi);
      const decay = Math.min(1.35, Math.max(0.55, 1.15 - (midi - 48) * 0.012));

      const master = context.createGain();
      master.connect(context.destination);
      master.gain.setValueAtTime(0, t);
      master.gain.linearRampToValueAtTime(0.55, t + 0.008);
      master.gain.exponentialRampToValueAtTime(0.0001, t + decay);

      const partials: Array<[number, OscillatorType, number]> = [
        [1, 'triangle', 1],
        [2, 'sine', 0.18],
        [3, 'sine', 0.06],
      ];

      partials.forEach(([mul, type, amp]) => {
        const osc = context.createOscillator();
        const g = context.createGain();
        osc.type = type;
        osc.frequency.value = freq * mul;
        g.gain.value = amp;
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + decay + 0.02);
      });

      voicesRef.current.push({ master });
      if (voicesRef.current.length > 32) {
        voicesRef.current = voicesRef.current.slice(-20);
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
    [context],
  );

  const playMidi = useCallback(
    (midi: number) => {
      if (!context || midi <= 0) return;
      if (context.state === 'suspended') {
        void context.resume();
      }
      playMidiAt(midi, context.currentTime);
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
        notes.forEach(([midi, duration]) => {
          if (midi > 0) {
            playMidiAt(midi, origin + offsetMs / 1000);
          }
          offsetMs += duration;
        });

        const totalMs = offsetMs;

        if (song && song.lyrics.length) {
          emitLyric(song, 0);
          const tick = () => {
            if (!playingRef.current || playGenRef.current !== gen) return;
            const elapsed = (context.currentTime - origin) * 1000;
            if (elapsed >= totalMs + 250) {
              playingRef.current = false;
              emitLyric(null, -1);
              return;
            }
            const lines = song.lyrics;
            let idx = 0;
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].time <= elapsed) idx = i;
              else break;
            }
            if (idx !== lyricIndexRef.current) {
              emitLyric(song, idx);
            }
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        } else {
          const endTimer = setTimeout(() => {
            if (playGenRef.current !== gen) return;
            playingRef.current = false;
            emitLyric(null, -1);
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
      const key = KEY_BY_CODE[e.key.toLowerCase()];
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
    keys: PIANO_KEYBOARD,
    whiteKeys: PIANO_KEYBOARD.filter((k) => k.type === 'white'),
    blackKeys: PIANO_KEYBOARD.filter((k) => k.type === 'black'),
  };
}

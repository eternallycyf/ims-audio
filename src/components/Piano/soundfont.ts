/**
 * 三角钢琴采样（MIDI.js Soundfonts / MusyngKite）
 * https://github.com/gleitz/midi-js-soundfonts
 *
 * 包络贴近真钢琴：快起、自然衰减、松键长余韵；允许多音叠奏慢慢淡出。
 */

const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

const SOUNDFONT_BASE =
  'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/MusyngKite/acoustic_grand_piano-mp3';

export function midiToNoteName(midi: number): string {
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

type ActiveVoice = {
  source: AudioBufferSourceNode;
  gain: GainNode;
};

export type PianoSampler = {
  ready: boolean;
  play: (midi: number, when?: number, durationSec?: number, gainScale?: number) => void;
  stopAll: () => void;
  dispose: () => void;
  has: (midi: number) => boolean;
};

async function loadOne(ctx: AudioContext, midi: number): Promise<[number, AudioBuffer] | null> {
  try {
    const url = `${SOUNDFONT_BASE}/${midiToNoteName(midi)}.mp3`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const raw = await res.arrayBuffer();
    const buffer = await ctx.decodeAudioData(raw.slice(0));
    return [midi, buffer];
  } catch {
    return null;
  }
}

/** 低音余韵更长、高音稍短（真钢琴物理特性） */
function releaseForMidi(midi: number): number {
  const t = 1.55 + ((60 - midi) / 12) * 0.35;
  return Math.min(2.6, Math.max(0.85, t));
}

export async function createPianoSampler(
  ctx: AudioContext,
  midiFrom: number,
  midiTo: number,
  onProgress?: (loaded: number, total: number) => void,
  existing?: Map<number, AudioBuffer>,
  /** 主输出（用于全局音量）；默认 ctx.destination */
  destination?: AudioNode,
): Promise<PianoSampler> {
  const out = destination ?? ctx.destination;
  const buffers = existing ?? new Map<number, AudioBuffer>();
  const active: ActiveVoice[] = [];
  const midis: number[] = [];
  for (let m = midiFrom; m <= midiTo; m++) {
    if (!buffers.has(m)) midis.push(m);
  }

  let loaded = 0;
  const total = Math.max(1, midis.length);
  if (midis.length === 0) {
    onProgress?.(1, 1);
  } else {
    await Promise.all(
      midis.map(async (midi) => {
        const pair = await loadOne(ctx, midi);
        if (pair) buffers.set(pair[0], pair[1]);
        loaded += 1;
        onProgress?.(loaded, total);
      }),
    );
  }

  const stopAll = () => {
    const now = ctx.currentTime;
    active.splice(0).forEach(({ source, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0, now);
        source.stop(now);
      } catch {
        // already stopped
      }
    });
  };

  /**
   * @param durationSec 谱面音长（按键按住时间）；松键后仍会自然衰减
   */
  const play = (midi: number, when = ctx.currentTime, durationSec = 0.45, gainScale = 1) => {
    const buffer = buffers.get(midi);
    if (!buffer) return;

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(out);

    const t0 = Math.max(when, ctx.currentTime);
    const press = Math.max(0.06, durationSec);
    const release = releaseForMidi(midi);
    // 峰值略超满幅，配合 master boost 补偿采样偏安静
    const peak = 1.15 * Math.max(0.25, gainScale);
    const sustain = peak * 0.62;

    // 快起 → 轻触衰减 → 按住 → 松键长余韵（像钢琴）
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
    gain.gain.exponentialRampToValueAtTime(sustain, t0 + Math.min(0.28, press * 0.45));

    const releaseAt = t0 + press;
    gain.gain.setValueAtTime(sustain, releaseAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, releaseAt + release);

    const voice: ActiveVoice = { source, gain };
    active.push(voice);
    source.onended = () => {
      const i = active.indexOf(voice);
      if (i >= 0) active.splice(i, 1);
    };

    try {
      // 让采样自身的钢琴衰减与 gain 余韵一起走，不要提前掐断
      const stopAt = Math.min(buffer.duration, press + release + 0.08);
      source.start(t0);
      source.stop(t0 + stopAt);
    } catch {
      // ignore
    }
  };

  return {
    ready: buffers.size > 0,
    play,
    stopAll,
    has: (midi) => buffers.has(midi),
    dispose: () => {
      stopAll();
      buffers.clear();
    },
  };
}

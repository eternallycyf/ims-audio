/** 十二平均律：MIDI → Hz */
export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** C 调简谱度数 → MIDI（1=C4=60；octave: -1 低八度，+1 高八度） */
export function jianpuToMidi(degree: number, octave = 0): number {
  if (degree === 0) return 0;
  const scale = [0, 2, 4, 5, 7, 9, 11]; // 1..7
  const d = Math.abs(degree);
  if (d < 1 || d > 7) return 60;
  const baseOctave = degree < 0 ? octave - 1 : octave;
  return 60 + baseOctave * 12 + scale[d - 1];
}

export type KeyType = 'white' | 'black';

export interface PianoKeyDef {
  id: string;
  midi: number;
  type: KeyType;
  /** 电脑键盘映射（小写） */
  code: string;
  label: string;
  /** 白键序号 0..n，黑键相对左侧白键 */
  whiteIndex: number;
}

const WHITE_CODES = ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];
const BLACK_CODES = ['2', '3', '5', '6', '7', 'w', 'e', 't', 'y', 'u'];

/** C3–C5：15 白键 + 10 黑键 */
function buildKeyboard(): PianoKeyDef[] {
  const keys: PianoKeyDef[] = [];
  let whiteIndex = 0;
  let whiteCodeI = 0;
  let blackCodeI = 0;

  for (let midi = 48; midi <= 72; midi++) {
    const pc = midi % 12;
    const isBlack = [1, 3, 6, 8, 10].includes(pc);
    if (isBlack) {
      const code = BLACK_CODES[blackCodeI++] ?? `b${midi}`;
      keys.push({
        id: `m${midi}`,
        midi,
        type: 'black',
        code,
        label: code.toUpperCase(),
        whiteIndex: whiteIndex - 1,
      });
    } else {
      const code = WHITE_CODES[whiteCodeI++] ?? `w${midi}`;
      keys.push({
        id: `m${midi}`,
        midi,
        type: 'white',
        code,
        label: code.toUpperCase(),
        whiteIndex,
      });
      whiteIndex += 1;
    }
  }
  return keys;
}

export const PIANO_KEYBOARD = buildKeyboard();
export const WHITE_KEYS = PIANO_KEYBOARD.filter((k) => k.type === 'white');
export const BLACK_KEYS = PIANO_KEYBOARD.filter((k) => k.type === 'black');
export const WHITE_KEY_COUNT = WHITE_KEYS.length;

export const KEY_BY_ID: Record<string, PianoKeyDef> = Object.fromEntries(
  PIANO_KEYBOARD.map((k) => [k.id, k]),
);

export const KEY_BY_CODE: Record<string, PianoKeyDef> = Object.fromEntries(
  PIANO_KEYBOARD.map((k) => [k.code, k]),
);

export const KEY_BY_MIDI: Record<number, PianoKeyDef> = Object.fromEntries(
  PIANO_KEYBOARD.map((k) => [k.midi, k]),
);

/** @deprecated 兼容旧 API：id → 频率 */
export const PIANO_KEYS: Record<string, { frequency: number }> = Object.fromEntries(
  PIANO_KEYBOARD.map((k) => [k.id, { frequency: midiToFreq(k.midi) }]),
);

/** @deprecated 简谱度数 → key id（仅中音 1–7 / 8=+1） */
export const NOTE_MAP: Record<number, string> = {
  1: KEY_BY_MIDI[60]?.id ?? 'm60',
  2: KEY_BY_MIDI[62]?.id ?? 'm62',
  3: KEY_BY_MIDI[64]?.id ?? 'm64',
  4: KEY_BY_MIDI[65]?.id ?? 'm65',
  5: KEY_BY_MIDI[67]?.id ?? 'm67',
  6: KEY_BY_MIDI[69]?.id ?? 'm69',
  7: KEY_BY_MIDI[71]?.id ?? 'm71',
  8: KEY_BY_MIDI[72]?.id ?? 'm72',
};

/** 兼容旧 foldNote：现改为正确 MIDI，不再挤压八度 */
export function foldNote(n: number): number {
  if (n === 0) return 0;
  if (n >= 1 && n <= 7) return jianpuToMidi(n, 0);
  if (n === 8) return jianpuToMidi(1, 1);
  if (n > 8) return jianpuToMidi(((n - 1) % 7) + 1, 1);
  return jianpuToMidi(Math.abs(n), -1);
}

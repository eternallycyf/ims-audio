/**
 * 88 键三角钢琴键位（A0–C8，MIDI 21–108）
 * 键序/标注规则对齐 webpage-piano：
 * https://github.com/yicheng-irun/webpage-piano
 * （参考其 keyboard.js / midi.js 逻辑，非复制源码）
 */

/** 十二平均律：MIDI → Hz */
export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** C 调简谱度数 → MIDI（1=C4=60；octave: -1 低八度，+1 高八度） */
export function jianpuToMidi(degree: number, octave = 0): number {
  if (degree === 0) return 0;
  const scale = [0, 2, 4, 5, 7, 9, 11];
  const d = Math.abs(degree);
  if (d < 1 || d > 7) return 60;
  const baseOctave = degree < 0 ? octave - 1 : octave;
  return 60 + baseOctave * 12 + scale[d - 1];
}

export type KeyType = 'white' | 'black';

export interface PianoKeyDef {
  id: string;
  /** MIDI 21–108 */
  midi: number;
  /** 钢琴键序 1–88（与 webpage-piano 一致） */
  pianoIndex: number;
  type: KeyType;
  /** 电脑键盘映射（仅中音区）；无映射为空串 */
  code: string;
  /** 白键谱号标注，如 A₂ / c¹ */
  label: string;
  /** 是否中央 C（MIDI 60 / 键 40） */
  isMiddleC: boolean;
  /** 白键序号 0..51，黑键相对左侧白键 */
  whiteIndex: number;
}

/** 标准 88 键：键 1 = A0 = MIDI 21；键 88 = C8 = MIDI 108 */
export const PIANO_MIDI_MIN = 21;
export const PIANO_MIDI_MAX = 108;
export const MIDDLE_C_MIDI = 60;
export const MIDDLE_C_INDEX = 40; // 1-based piano index

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const SUB = '₀₁₂₃₄₅₆₇₈₉';

function toSup(n: number): string {
  return String(n)
    .split('')
    .map((d) => SUP[Number(d)] ?? d)
    .join('');
}

function toSub(n: number): string {
  return String(n)
    .split('')
    .map((d) => SUB[Number(d)] ?? d)
    .join('');
}

/**
 * webpage-piano 白键标注：
 * 低音大写+下标，中音小写，高音小写+上标
 */
export function pianoWhiteLabel(pianoIndex: number): string {
  // j = 0..87，以 A 起算的十二律循环（与 webpage-piano demo12/code12 一致）
  const j = pianoIndex - 1;
  const yu = j % 12;
  const code12 = ['A', '', 'B', 'C', '', 'D', '', 'E', 'F', '', 'G', ''] as const;
  const letter = code12[yu];
  if (!letter) return '';

  let sbp = '';
  if (pianoIndex <= 15) {
    sbp = toSub(Math.floor((-pianoIndex + 27) / 12));
  } else if (pianoIndex >= 40) {
    sbp = toSup(Math.floor((pianoIndex - 28) / 12));
  }

  const base = pianoIndex < 28 ? letter : letter.toLowerCase();
  return `${base}${sbp}`;
}

/**
 * 电脑键盘映射（keyCode → 钢琴键序 1–88）
 * 对齐 webpage-piano 默认表：
 * https://github.com/yicheng-irun/webpage-piano/blob/master/src/pages/piano/index/pckey-key.js
 * MIDI = pianoIndex + 20
 */
export const PC_KEYCODE_TO_PIANO: Record<number, number> = {
  8: 73,
  32: 40,
  37: 44,
  38: 42,
  39: 47,
  40: 45,
  48: 68,
  49: 52,
  50: 54,
  51: 56,
  52: 57,
  53: 59,
  54: 61,
  55: 63,
  56: 64,
  57: 66,
  65: 28,
  66: 23,
  67: 20,
  68: 32,
  69: 44,
  70: 33,
  71: 35,
  72: 37,
  73: 52,
  74: 39,
  75: 40,
  76: 42,
  77: 27,
  78: 25,
  79: 54,
  80: 56,
  81: 40,
  82: 45,
  83: 30,
  84: 47,
  85: 51,
  86: 21,
  87: 42,
  88: 18,
  89: 49,
  90: 16,
  96: 49,
  97: 52,
  98: 54,
  99: 56,
  100: 57,
  101: 59,
  102: 61,
  103: 63,
  104: 64,
  105: 66,
  106: 71,
  107: 68,
  109: 73,
  110: 51,
  111: 69,
  186: 44,
  187: 71,
  188: 28,
  189: 69,
  190: 30,
  191: 32,
  192: 51,
  219: 57,
  220: 61,
  221: 59,
  222: 45,
};

/** keyCode → 可读标签（用于调试/提示） */
const KEYCODE_LABEL: Record<number, string> = {
  8: '⌫',
  32: '␣',
  37: '←',
  38: '↑',
  39: '→',
  40: '↓',
  48: '0',
  49: '1',
  50: '2',
  51: '3',
  52: '4',
  53: '5',
  54: '6',
  55: '7',
  56: '8',
  57: '9',
  65: 'A',
  66: 'B',
  67: 'C',
  68: 'D',
  69: 'E',
  70: 'F',
  71: 'G',
  72: 'H',
  73: 'I',
  74: 'J',
  75: 'K',
  76: 'L',
  77: 'M',
  78: 'N',
  79: 'O',
  80: 'P',
  81: 'Q',
  82: 'R',
  83: 'S',
  84: 'T',
  85: 'U',
  86: 'V',
  87: 'W',
  88: 'X',
  89: 'Y',
  90: 'Z',
  186: ';',
  187: '=',
  188: ',',
  189: '-',
  190: '.',
  191: '/',
  192: '`',
  219: '[',
  220: '\\',
  221: ']',
  222: "'",
};

export function pianoIndexToMidi(pianoIndex: number): number {
  return pianoIndex + 20;
}

/** 每个钢琴键对应的电脑键 keyCode 列表 */
const PIANO_TO_KEYCODES: Record<number, number[]> = {};
Object.entries(PC_KEYCODE_TO_PIANO).forEach(([kc, pianoIndex]) => {
  const code = Number(kc);
  if (!PIANO_TO_KEYCODES[pianoIndex]) PIANO_TO_KEYCODES[pianoIndex] = [];
  PIANO_TO_KEYCODES[pianoIndex].push(code);
});

function buildKeyboard(): PianoKeyDef[] {
  const keys: PianoKeyDef[] = [];
  let whiteIndex = 0;

  for (let pianoIndex = 1; pianoIndex <= 88; pianoIndex++) {
    const midi = pianoIndexToMidi(pianoIndex);
    const pc = midi % 12;
    const isBlack = [1, 3, 6, 8, 10].includes(pc);
    const keyCodes = PIANO_TO_KEYCODES[pianoIndex] ?? [];
    const primaryKc = keyCodes[0];
    const code = primaryKc != null ? (KEYCODE_LABEL[primaryKc] ?? '').toLowerCase() : '';

    if (isBlack) {
      keys.push({
        id: `m${midi}`,
        midi,
        pianoIndex,
        type: 'black',
        code,
        label: '',
        isMiddleC: false,
        whiteIndex: whiteIndex - 1,
      });
    } else {
      keys.push({
        id: `m${midi}`,
        midi,
        pianoIndex,
        type: 'white',
        code,
        label: pianoWhiteLabel(pianoIndex),
        isMiddleC: midi === MIDDLE_C_MIDI,
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
export const WHITE_KEY_COUNT = WHITE_KEYS.length; // 52

export const KEY_BY_ID: Record<string, PianoKeyDef> = Object.fromEntries(
  PIANO_KEYBOARD.map((k) => [k.id, k]),
);

/** @deprecated 请优先用 KEY_BY_KEYCODE（webpage-piano 键位表） */
export const KEY_BY_CODE: Record<string, PianoKeyDef> = Object.fromEntries(
  PIANO_KEYBOARD.filter((k) => k.code).map((k) => [k.code, k]),
);

export const KEY_BY_MIDI: Record<number, PianoKeyDef> = Object.fromEntries(
  PIANO_KEYBOARD.map((k) => [k.midi, k]),
);

/** keyCode → 琴键（webpage-piano 默认映射） */
export const KEY_BY_KEYCODE: Record<number, PianoKeyDef> = {};
Object.entries(PC_KEYCODE_TO_PIANO).forEach(([kc, pianoIndex]) => {
  const def = KEY_BY_MIDI[pianoIndexToMidi(pianoIndex)];
  if (def) KEY_BY_KEYCODE[Number(kc)] = def;
});

/** @deprecated 兼容旧 API：id → 频率 */
export const PIANO_KEYS: Record<string, { frequency: number }> = Object.fromEntries(
  PIANO_KEYBOARD.map((k) => [k.id, { frequency: midiToFreq(k.midi) }]),
);

/** @deprecated 简谱度数 → key id */
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

/** 兼容旧 foldNote */
export function foldNote(n: number): number {
  if (n === 0) return 0;
  if (n >= 1 && n <= 7) return jianpuToMidi(n, 0);
  if (n === 8) return jianpuToMidi(1, 1);
  if (n > 8) return jianpuToMidi(((n - 1) % 7) + 1, 1);
  return jianpuToMidi(Math.abs(n), -1);
}

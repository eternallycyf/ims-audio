/** 敲键后上浮的彩色音符 */

const NOTE_SYMBOLS = ['♪', '♫', '♬', '♩'] as const;

export type FloatHeight = 'normal' | 'tall';

export type FloatParticle = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  symbol: string;
  dx: number;
  dy: number;
  rotate: number;
  duration: number;
};

let seq = 0;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomNoteSymbol(): string {
  return NOTE_SYMBOLS[Math.floor(Math.random() * NOTE_SYMBOLS.length)];
}

/** 有谱子 / 无谱子时的上浮高度与时长 */
const FLOAT_RANGE: Record<
  FloatHeight,
  { dyMin: number; dyMax: number; durMin: number; durMax: number }
> = {
  normal: { dyMin: -170, dyMax: -230, durMin: 0.9, durMax: 1.3 },
  tall: { dyMin: -260, dyMax: -360, durMin: 1.05, durMax: 1.55 },
};

/** 柔和系统色，贴近 Apple 产品页 */
export function randomFloatColor(): string {
  const palette = [
    [211, 72, 58], // apple blue
    [280, 45, 62], // soft purple
    [350, 55, 58], // soft rose
    [160, 40, 48], // soft teal
    [30, 70, 58], // soft coral
    [200, 35, 55], // cool gray-blue
  ] as const;
  const [h, s, l] = palette[Math.floor(Math.random() * palette.length)];
  return `hsl(${h + rand(-8, 8)} ${s + rand(-6, 6)}% ${l + rand(-4, 4)}%)`;
}

export function createFloatParticles(
  originX: number,
  originY: number,
  count = 2,
  height: FloatHeight = 'normal',
): FloatParticle[] {
  const n = Math.max(1, Math.min(4, count));
  const range = FLOAT_RANGE[height];
  const out: FloatParticle[] = [];
  for (let i = 0; i < n; i++) {
    const size = rand(14, 26);
    out.push({
      id: ++seq,
      x: originX + rand(-10, 10) - size / 2,
      y: originY + rand(-6, 8) - size / 2,
      size,
      color: randomFloatColor(),
      symbol: randomNoteSymbol(),
      dx: rand(-36, 36),
      dy: rand(range.dyMin, range.dyMax),
      rotate: rand(-40, 40),
      duration: rand(range.durMin, range.durMax),
    });
  }
  return out;
}

/** 根据琴键 DOM 相对漂浮层坐标生成粒子 */
export function spawnFloatsFromKey(
  keyEl: HTMLElement,
  layerEl: HTMLElement,
  height: FloatHeight = 'normal',
): FloatParticle[] {
  const key = keyEl.getBoundingClientRect();
  const layer = layerEl.getBoundingClientRect();
  const x = key.left - layer.left + key.width / 2;
  const y = key.top - layer.top + key.height * 0.15;
  return createFloatParticles(x, y, Math.random() > 0.55 ? 3 : 2, height);
}

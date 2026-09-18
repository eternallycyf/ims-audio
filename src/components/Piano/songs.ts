/**
 * 谱源说明（公开社区曲谱，仅供学习演示）
 *
 * 富士山下：https://www.bilibili.com/opus/858320570973945872
 * 遇见：https://www.miyoushe.com/ys/article/27963303
 *
 * 节奏规则：
 * - `/` 或空格分隔的「音组」各占一拍（或 N 拍）
 * - 组内字母均分该拍时值 → 连写快、单音慢
 * - 空拍（连续 `/`）= 整拍休止；逗号 = 半拍短语气口
 */

import { jianpuToMidi } from './notes';

/** [MIDI, 时值ms]，0 为休止 */
export type ScoreNote = [number, number];

export type LyricLine = {
  time: number;
  text: string;
};

export type SongTrack = {
  id: string;
  title: string;
  artist: string;
  source: string;
  notes: ScoreNote[];
  lyrics: LyricLine[];
};

/** 原神键盘 → 简谱度数 */
const KEYBOARD_DEGREE: Record<string, { degree: number; oct: number }> = {
  z: { degree: 1, oct: -1 },
  x: { degree: 2, oct: -1 },
  c: { degree: 3, oct: -1 },
  v: { degree: 4, oct: -1 },
  b: { degree: 5, oct: -1 },
  n: { degree: 6, oct: -1 },
  m: { degree: 7, oct: -1 },
  a: { degree: 1, oct: 0 },
  s: { degree: 2, oct: 0 },
  d: { degree: 3, oct: 0 },
  f: { degree: 4, oct: 0 },
  g: { degree: 5, oct: 0 },
  h: { degree: 6, oct: 0 },
  j: { degree: 7, oct: 0 },
  q: { degree: 1, oct: 1 },
  w: { degree: 2, oct: 1 },
  e: { degree: 3, oct: 1 },
  r: { degree: 4, oct: 1 },
  t: { degree: 5, oct: 1 },
  y: { degree: 6, oct: 1 },
  u: { degree: 7, oct: 1 },
};

function fitMidi(midi: number): number {
  if (midi <= 0) return 0;
  let m = midi;
  while (m > 72) m -= 12;
  while (m < 48) m += 12;
  return m;
}

function midiOf(ch: string): number {
  const key = KEYBOARD_DEGREE[ch.toLowerCase()];
  if (!key) return 0;
  return fitMidi(jianpuToMidi(key.degree, key.oct));
}

export type ParseOptions = {
  /** 一拍时长 ms（≈ 60000/BPM） */
  beatMs?: number;
  /** 每个音组占几拍（遇见类空格谱常用 2） */
  groupBeats?: number;
  /** 逗号气口占几拍 */
  commaBeats?: number;
};

/**
 * 按拍解析键盘谱：组内均分、组间按拍走。
 */
export function parseKeyboardSheet(
  sheet: string,
  options: ParseOptions = {},
): { notes: ScoreNote[]; lyrics: LyricLine[] } {
  const beatMs = options.beatMs ?? 720;
  const groupBeats = options.groupBeats ?? 1;
  const commaBeats = options.commaBeats ?? 0.5;
  const groupMs = Math.floor(beatMs * groupBeats);

  const notes: ScoreNote[] = [];
  const lyrics: LyricLine[] = [];
  let time = 0;

  const pushRest = (dur: number) => {
    const d = Math.max(0, Math.floor(dur));
    if (!d) return;
    notes.push([0, d]);
    time += d;
  };

  const pushGroup = (chars: string, durationMs: number) => {
    const keys = chars.replace(/[^a-zA-Z]/g, '');
    if (!keys) {
      pushRest(durationMs);
      return;
    }
    const each = Math.max(40, Math.floor(durationMs / keys.length));
    let used = 0;
    for (let i = 0; i < keys.length; i++) {
      const dur = i === keys.length - 1 ? durationMs - used : each;
      used += dur;
      const midi = midiOf(keys[i]);
      if (midi > 0) notes.push([midi, dur]);
      else notes.push([0, dur]);
      time += dur;
    }
  };

  for (const rawLine of sheet
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)) {
    if (rawLine.startsWith('L:')) {
      lyrics.push({ time, text: rawLine.slice(2).trim() });
      continue;
    }
    if (rawLine.startsWith('#') || rawLine.startsWith('//')) continue;

    const cleaned = rawLine
      .replace(/[\u4e00-\u9fff：:]/g, '')
      .replace(/\(([^)]*)\)/g, (_, inner: string) => {
        const first = inner.match(/[a-zA-Z]/);
        return first ? first[0] : '';
      })
      .replace(/\[[^\]]*]/g, '');

    // 统一：逗号 → 标记，/ 与空白都是组分隔
    // 保留空组（连续 /）以产生休止
    const hasSlash = cleaned.includes('/');
    if (hasSlash) {
      // B站拍线谱：以 / 分拍；拍内空格忽略
      const beats = cleaned.split('/');
      for (let bi = 0; bi < beats.length; bi++) {
        const beat = beats[bi];
        if (/^\s*,\s*$/.test(beat) || beat.includes(',')) {
          const parts = beat.split(',');
          for (let pi = 0; pi < parts.length; pi++) {
            const p = parts[pi].replace(/\s+/g, '');
            if (p) pushGroup(p, beatMs);
            if (pi < parts.length - 1) pushRest(beatMs * commaBeats);
          }
          continue;
        }
        const compact = beat.replace(/\s+/g, '');
        // 首尾因 split 产生的空串：开头空=前休止，结尾空忽略
        if (!compact) {
          if (bi > 0 && bi < beats.length - 1) pushRest(beatMs);
          else if (bi === 0 && beats.length > 1) pushRest(beatMs);
          continue;
        }
        pushGroup(compact, beatMs);
      }
    } else {
      // 米游社空格谱：空格分音组，逗号=气口
      const tokens = cleaned.split(/(\s+|,)/).filter((t) => t.length);
      for (const token of tokens) {
        if (token === ',') {
          pushRest(beatMs * commaBeats);
          continue;
        }
        if (/^\s+$/.test(token)) continue;
        pushGroup(token.replace(/\s+/g, ''), groupMs);
      }
    }
  }

  return { notes, lyrics };
}

function buildTrack(
  meta: Omit<SongTrack, 'notes' | 'lyrics'>,
  parsed: { notes: ScoreNote[]; lyrics: LyricLine[] },
): SongTrack {
  return { ...meta, notes: parsed.notes, lyrics: parsed.lyrics };
}

/**
 * 富士山下 · B站入门单音版（保留 / 拍线）
 * BPM ≈ 72 → beat ≈ 830ms
 */
const FUJI_SHEET = `
# 前奏
L:♪
A / /Q / /J / / Q J /H G /H G /D S / D S /A M /A M /N B / N /M A /S /D H / G / /D G /S A / EQHD/EQHD/EQHD/EQHD/ WJGD/WJGD/WJGD/WJGD/ QHFA/HFAN/GSMB/SMB / A / / / /

# 主歌一
L:拦路雨偏似雪花
/ B /N A /S A / S D / D / D /S A / S D /
L:饮泣的你冻吗
D / D /S A / S A/ N /A S/ D / D /
L:这风褛我给你磨到有襟花
B /N A /S A / S A / H / G /D S / S A / D / D /S A / S S/ S /S A/ N / S /
L:连调了职也不怕
B /N A /S A / S D / G / D /S A / S D /
L:怎么始终牵挂
H / D /S A / S A/ N /A S/ D / G /
L:苦心选中今天想车你回家
B /N A /S A / S A / H / G /D S / S A / D / D /S A / S S/ S /S A/ N /

# 副歌一
L:谁都只得那双手
A / A /Q J /J H / J H / G /H G /D S /
L:靠拥抱亦难任你拥有
D G /H G / G /H G / H H/ H /H G/ H / G D / / A /S D /
L:要拥有必先懂失去怎接受
G D /S A / A /S D / H D /S A / A /A A / Q Q/ Q /Q H/ Q / H / G / /Q J /
L:曾沿着雪路浪游
Q J /H G /H G /D S / D G /H G / G /H G /
L:为何为好事泪流
H H/ H /H G/ H / G D / / A /S D /
L:谁能凭爱意要富士山私有
G D /S A / A /S D / H D /S A /Q / / / /
L:何不把悲哀感觉 假设是来自你虚构
Q /H Q / H G / G /H G /D S / D S / A /N A/ S / A / / / /

# 主歌二
L:情人节不要说穿
/ B /N A /S A / S D / D / D /S A / S D /
L:只敢抚你发端
D / D /S A / S A/ N /A S/ D / D /
L:这种姿态可会令你更心酸
B /N A /S A / S A / G / D /S D / S A / D / D /S A / S S/ S /S A/ N / S /
L:留在汽车里取暖
B /N A /S A / S D / G / D /S A / S D /
L:应该怎么规劝
H / D /S A / S A/ N /A S/ D / G /
L:怎么可以把手腕忍痛划损
B /N A /S A / S A / H / G /D S / S A / D / D /S A / S S/ S /S A/ N /
A / A /Q J /J H /

# 副歌二
L:谁都只得那双手
J H / G /H G /D S / D G /H G / G /H G /
L:靠拥抱亦难任你拥有
H H/ H /H G/ H / G D / / A /S D / G D /S A / A /S D /
L:要拥有必先懂失去怎接受
H D /S A / A /A A / Q Q/ Q /Q H/ Q / H / G / /Q J /
L:曾沿着雪路浪游
Q J /H G /H G /D S / D G /H G / G /H G /
L:为何为好事泪流
H H/ H /H G/ H / G D / / A /S D /
L:谁能凭爱意要富士山私有
G D /S A / A /S D / H D /S A /Q / / / /
L:你还嫌不够 我把这陈年风褛 送赠你解咒
Q /H Q / H G / G /H G /D S / D S / A /N A/ S / A / / / /

# 结尾
L:♪
/ / A /N A / H G / G /H G /D G / E W/ Q /H Q/ W / Q / / / /
`;

/**
 * 遇见 · 米游社空格音组谱
 * 每组约占 2 拍（贴原曲句幅）；组内均分 → GDD 快、单音相对慢
 */
const MEET_SHEET = `
L:♪
GGSSDFG HJJQWE EEQQG

L:听见冬天的离开
GDD GSS DSSA
L:我在某年某月醒过来
AMNMAMASDD

L:我想我等我期待
GDD GSS DSSA
L:未来却不能因此安排
AMNMAMMAASA

L:♪
GHJQJQ JHHGF GMGASD FDSAM

L:阴天傍晚车窗外
GDD GSS DSSA
L:未来有一个人在等待
AMNMAMMAASD

L:向左向右向前看
GDD GWW QJJQQ
L:爱要拐几个弯才来
AM NM AMMAASA

L:我遇见谁会有怎样的对白
GHJQ JQJHGHHG
L:我等的人他在多远的未来
ASDF DDGASDD

L:我听见风来自地铁和人海
GHJQ JQWQWEEG
L:我排着队拿着爱的号码牌
ASDF DF DS AMAA

L:阴天傍晚车窗外
GDD GSS DSSA
L:未来有一个人在等待
AMNMAMMAASD

L:向左向右向前看
GDD GWW QJJQQ
L:爱要拐几个弯才来
AM NM AMMAASA

L:我遇见谁会有怎样的对白
GHJQ JQJHGHHG
L:我等的人他在多远的未来
ASDF DDGASDD

L:我听见风来自地铁和人海
GHJQ JQWQWEEG
L:我排着队拿着爱的号码牌
ASDF DF DS AMAA

L:♪
EWGEWWT EWGEWWT EWHEWWG EWEHW

L:我往前飞飞过一片时间海
GHJQ JQWQJHHG
L:我们也曾在爱情里受伤害
ASDF DFGA AHHG

L:我看着路梦的入口有点窄
GHJQ JQWQWEG
L:我遇见你是最美丽的意外
ASDF DFGAA SDSAA

L:总有一天我的谜底会揭开
GHJQ JQJHGFFG FDSAMMA
L:♪
`;

export const TRACK_FUJI = buildTrack(
  {
    id: 'fuji',
    title: '富士山下',
    artist: '陈奕迅',
    source: 'https://www.bilibili.com/opus/858320570973945872',
  },
  parseKeyboardSheet(FUJI_SHEET, { beatMs: 780, groupBeats: 1, commaBeats: 0.5 }),
);

export const TRACK_MEET = buildTrack(
  {
    id: 'meet',
    title: '遇见',
    artist: '吖毛',
    source: 'https://www.miyoushe.com/ys/article/27963303',
  },
  // BPM≈66，每组 2 拍 ≈ 1.8s，对齐「听见冬天的离开」约 5.5s / 3 组
  parseKeyboardSheet(MEET_SHEET, { beatMs: 900, groupBeats: 2, commaBeats: 1 }),
);

/** @deprecated 已替换为 TRACK_MEET */
export const TRACK_GRAPE = TRACK_MEET;

export const SONG_TRACKS = [TRACK_FUJI, TRACK_MEET] as const;

export { parseKeyboardSheet as parseSheet };

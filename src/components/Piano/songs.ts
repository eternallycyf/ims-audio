/**
 * 谱源说明（公开社区曲谱原样录入，仅供学习演示）
 *
 * 富士山下：https://www.bilibili.com/opus/858320570973945872（精编键盘谱；苍强装饰谱不适用）
 * 晴天 / 青花瓷 / 兰亭序：苍强有声视唱简谱（见 qingtianCangqiang / cangqiang/*）
 * 孤勇者 / 可惜没如果 / 她说：简谱空间主旋律（cangqiang/* 同目录模块）
 * 富士山下：B站精编字母谱；夜曲 / 蒲公英：EOP 原神琴学习谱
 * 米游社无 `/` 字母谱：按「每字母 ≈ 八分音符」计时
 *
 * 字母谱：风物琴键位（Z–M / A–J / Q–U）；`/` 分拍；`(ABC)` 同时弹。
 * melodyOnly：仅去掉括号和弦里的较低音（不改写八度）。
 */

import { QINGTIAN_CANGQIANG_LYRICS, QINGTIAN_CANGQIANG_NOTES } from './qingtianCangqiang';

/**
 * [MIDI | 同时发音的 MIDI[], 推进时值 ms]
 * 可选第三项 soundMs：发音时长（连音/延音常 > 推进时值）；省略则与推进相同。
 * pitch 为 0 表示休止（不发音，仍推进时间）。
 */
export type ScoreNote = [number | number[], number] | [number | number[], number, number];

/** 时间轴推进时长 */
export function noteAdvanceMs(note: ScoreNote): number {
  return note[1];
}

/** 实际发音时长（延音可超过推进） */
export function noteSoundMs(note: ScoreNote): number {
  return note[2] ?? note[1];
}

export type LyricLine = {
  time: number;
  text: string;
};

/** 曲目元信息：可由外界注入，再经 createTrack 解析成可播放谱 */
export type SongMeta = {
  id: string;
  title: string;
  artist: string;
  source: string;
  /** 专辑封面（CSS 渐变或图片 URL），瀑布流可选 */
  cover?: string;
  /** 副标题 / 来源简述 */
  blurb?: string;
  /** 瀑布流卡片高度提示 */
  height?: number;
  /**
   * 苍强式 SVG 简谱（public 相对路径，如 sheets/qingtian.svg）。
   * 有则优先展示 SVG，不再用字母/音名文本谱。
   */
  sheetSvg?: string;
};

export type SongTrack = SongMeta & {
  notes: ScoreNote[];
  /** @deprecated 保留字段兼容旧曲目；UI 改为展示 sheet */
  lyrics: LyricLine[];
  /** 展示用谱面（字母谱原文或音名行），静态展示、不高亮 */
  sheet?: string;
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/** MIDI → 音名（如 C4、F#5） */
export function midiToNoteName(midi: number): string {
  if (midi <= 0) return '-';
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

export function scorePitches(pitch: number | number[]): number[] {
  if (Array.isArray(pitch)) return pitch.filter((m) => m > 0);
  return pitch > 0 ? [pitch] : [];
}

/** 从原始字母谱抽出可展示行（去掉 L: 歌词与注释） */
export function sheetDisplayText(sheet: string): string {
  return sheet
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('L:') && !l.startsWith('#') && !l.startsWith('//'))
    .join('\n');
}

/** 把已解析音符排成音名谱（无字母谱原文时用） */
export function notesToSheet(notes: ScoreNote[], perLine = 8): string {
  const tokens: string[] = [];
  for (const note of notes) {
    const midis = scorePitches(note[0]);
    if (!midis.length) {
      tokens.push('-');
      continue;
    }
    tokens.push(
      midis.length === 1 ? midiToNoteName(midis[0]) : `(${midis.map(midiToNoteName).join(' ')})`,
    );
  }
  const lines: string[] = [];
  for (let i = 0; i < tokens.length; i += perLine) {
    lines.push(tokens.slice(i, i + perLine).join('  '));
  }
  return lines.join('\n');
}

/** 曲目用于面板展示的谱面文本 */
export function trackSheetText(track: SongTrack | null | undefined): string {
  if (!track) return '';
  if (track.sheet?.trim()) return track.sheet.trim();
  if (track.notes.length) return notesToSheet(track.notes);
  return '';
}

/**
 * 风物之诗琴键 → MIDI（C 大调白键）
 * 低：Z–M = C3–B3；中：A–J = C4–B4；高：Q–U = C5–B5
 */
const KEY_MIDI: Record<string, number> = {
  z: 48,
  x: 50,
  c: 52,
  v: 53,
  b: 55,
  n: 57,
  m: 59,
  a: 60,
  s: 62,
  d: 64,
  f: 65,
  g: 67,
  h: 69,
  j: 71,
  q: 72,
  w: 74,
  e: 76,
  r: 77,
  t: 79,
  y: 81,
  u: 83,
};

function midiOf(ch: string): number {
  return KEY_MIDI[ch.toLowerCase()] ?? 0;
}

export type ParseOptions = {
  /** 一拍时长 ms（≈ 60000/BPM） */
  beatMs?: number;
  /** 每个音组占几拍（空格谱常用） */
  groupBeats?: number;
  /** 逗号气口占几拍 */
  commaBeats?: number;
  /**
   * 只保留括号和弦中的最高音（不抬八度、不改顺序音）。
   * 默认 false：原样弹谱，避免把整曲音高拧偏。
   */
  melodyOnly?: boolean;
};

type BeatToken =
  | { kind: 'chord'; keys: string }
  | { kind: 'arp'; keys: string }
  | { kind: 'seq'; keys: string };

/** 拍内词法：`(和弦)` / `[琶音]` / 连续字母 */
function tokenizeBeat(raw: string): BeatToken[] {
  const tokens: BeatToken[] = [];
  const re = /\(([^)]*)\)|\[([^\]]*)\]|([a-zA-Z]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    if (m[1] !== undefined) {
      tokens.push({ kind: 'chord', keys: m[1].replace(/[^a-zA-Z]/g, '') });
    } else if (m[2] !== undefined) {
      tokens.push({ kind: 'arp', keys: m[2].replace(/[^a-zA-Z]/g, '') });
    } else {
      tokens.push({ kind: 'seq', keys: m[3] });
    }
  }
  return tokens;
}

/**
 * 按拍解析键盘谱：`( )` 同时弹，组内顺序音均分拍时值。
 */
export function parseKeyboardSheet(
  sheet: string,
  options: ParseOptions = {},
): { notes: ScoreNote[]; lyrics: LyricLine[] } {
  const beatMs = options.beatMs ?? 720;
  const groupBeats = options.groupBeats ?? 1;
  const commaBeats = options.commaBeats ?? 0.5;
  const melodyOnly = options.melodyOnly ?? false;
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

  const pushEvents = (events: { midis: number[]; weight: number }[], durationMs: number) => {
    if (!events.length) {
      pushRest(durationMs);
      return;
    }
    const totalW = events.reduce((s, e) => s + e.weight, 0);
    let used = 0;
    events.forEach((ev, i) => {
      const dur =
        i === events.length - 1
          ? durationMs - used
          : Math.max(30, Math.floor((durationMs * ev.weight) / totalW));
      used += dur;
      const pitch: number | number[] = ev.midis.length > 1 ? ev.midis : ev.midis[0] ?? 0;
      notes.push([pitch, dur]);
      time += dur;
    });
  };

  const tokensToEvents = (tokens: BeatToken[]) => {
    const events: { midis: number[]; weight: number }[] = [];
    for (const token of tokens) {
      if (token.kind === 'chord') {
        const midis = [...token.keys].map(midiOf).filter((m) => m > 0);
        if (!midis.length) {
          events.push({ midis: [0], weight: 1 });
        } else if (melodyOnly) {
          events.push({ midis: [Math.max(...midis)], weight: 1 });
        } else {
          events.push({ midis, weight: 1 });
        }
      } else {
        // seq / arp：顺序弹；琶音权重要略轻以更快
        const w = token.kind === 'arp' ? 0.55 : 1;
        for (const ch of token.keys) {
          const midi = midiOf(ch);
          events.push({ midis: midi > 0 ? [midi] : [0], weight: w });
        }
      }
    }
    return events;
  };

  const pushBeatRaw = (raw: string, durationMs: number) => {
    const compact = raw.replace(/\s+/g, '');
    if (!compact) {
      pushRest(durationMs);
      return;
    }
    pushEvents(tokensToEvents(tokenizeBeat(compact)), durationMs);
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
      .replace(/（/g, '(')
      .replace(/）/g, ')')
      .replace(/，/g, ',')
      .replace(/；/g, ' ')
      .replace(/[～~]+/g, '')
      .replace(/-+/g, '')
      .replace(/[\u4e00-\u9fff：:]/g, '');
    const hasSlash = cleaned.includes('/');

    if (hasSlash) {
      const beats = cleaned.split('/');
      for (let bi = 0; bi < beats.length; bi++) {
        const beat = beats[bi];
        if (beat.includes(',')) {
          const parts = beat.split(',');
          for (let pi = 0; pi < parts.length; pi++) {
            if (parts[pi].replace(/\s+/g, '')) pushBeatRaw(parts[pi], groupMs);
            if (pi < parts.length - 1) pushRest(groupMs * commaBeats);
          }
          continue;
        }
        const compact = beat.replace(/\s+/g, '');
        if (!compact) {
          if (bi > 0 && bi < beats.length - 1) pushRest(groupMs);
          else if (bi === 0 && beats.length > 1) pushRest(groupMs);
          continue;
        }
        pushBeatRaw(beat, groupMs);
      }
    } else {
      // 无 / 的空格谱（米游社常见）：逗号/空格分段；每字母按一拍（更接近原曲时长）
      const letterMs = Math.max(160, groupMs);
      const chunks = cleaned.split(/(\s+|,)/).filter((t) => t.length);
      for (const chunk of chunks) {
        if (chunk === ',') {
          pushRest(Math.floor(groupMs * commaBeats));
          continue;
        }
        if (/^\s+$/.test(chunk)) continue;
        const letterCount = (chunk.match(/[a-zA-Z]/g) || []).length || 1;
        pushBeatRaw(chunk, letterCount * letterMs);
      }
    }
  }

  return { notes, lyrics };
}

/**
 * 按歌词时间戳定位行；行内按「发声音符」顺序逐字高亮（更接近网易云逐字感）。
 */
export function resolveLyricAt(
  track: SongTrack,
  elapsedMs: number,
): { lineIndex: number; charIndex: number } {
  const { notes, lyrics } = track;
  if (!lyrics.length) return { lineIndex: -1, charIndex: -1 };

  let lineIndex = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time <= elapsedMs) lineIndex = i;
    else break;
  }

  const line = lyrics[lineIndex];
  const lineEnd =
    lineIndex + 1 < lyrics.length ? lyrics[lineIndex + 1].time : Number.POSITIVE_INFINITY;
  const chars = Array.from(line.text).filter((c) => c !== '♪' && !/\s/.test(c));
  if (!chars.length) return { lineIndex, charIndex: -1 };

  let t = 0;
  const segs: { start: number; end: number }[] = [];
  for (const [pitch, dur] of notes) {
    const sounding = scorePitches(pitch).length > 0;
    if (sounding && t >= line.time && t < lineEnd) {
      segs.push({ start: t, end: t + dur });
    }
    t += dur;
    if (t >= lineEnd && segs.length) break;
  }

  if (!segs.length) return { lineIndex, charIndex: 0 };
  if (elapsedMs < segs[0].start) return { lineIndex, charIndex: 0 };

  for (let i = 0; i < segs.length; i++) {
    if (elapsedMs < segs[i].end) {
      // 第 i 个发声音对应第 i 个字（超出则落在最后一字）
      return { lineIndex, charIndex: Math.min(chars.length - 1, i) };
    }
  }
  return { lineIndex, charIndex: chars.length - 1 };
}

/** 曲目总时长 */
export function trackDurationMs(track: SongTrack | ScoreNote[]): number {
  const notes = Array.isArray(track) ? track : track.notes;
  return notes.reduce((s, [, d]) => s + d, 0);
}

/**
 * 把字母键盘谱解析成可播放曲目（供包外注入）。
 * @example
 * createTrack({ id, title, artist, source }, sheet, { beatMs: 720, melodyOnly: true })
 */
export function createTrack(meta: SongMeta, sheet: string, options: ParseOptions = {}): SongTrack {
  const parsed = parseKeyboardSheet(sheet, options);
  return {
    ...meta,
    notes: parsed.notes,
    lyrics: parsed.lyrics,
    sheet: sheetDisplayText(sheet),
  };
}

/** 直接注入已解析的 MIDI 音符（如从苍强简谱导出） */
export function createTrackFromNotes(
  meta: SongMeta,
  notes: ScoreNote[],
  lyrics: LyricLine[] = [],
): SongTrack {
  return { ...meta, notes, lyrics, sheet: notesToSheet(notes) };
}

/**
 * 富士山下 · B站精编完整版（含 `( )` 和弦）
 * BPM ≈ 72 → beat ≈ 780ms
 */
const FUJI_SHEET = `
# 前奏
L:♪
A / /Q / /J / / (NQ) (CJ) /(NH) (AG) /(DH) G /D S / (CD) (MS) /(CA) (BM) /(CA) M /N B / (VN) Z /(VM) A /(BS) X /(MD) H / (ZG) B /A S /(CD) G /(BMS) A / (NE)Q(CH)D/(NE)Q(MH)D/(AE)QHD/EQHD/ (CW)J(MG)D/(CW)J(BG)D/(MW)JGD/WJGD/ (VQ)H(ZF)A/(NH)FAN/(BG)S(XM)B/(MS)MB / (ZA) B /A S /D / /

# 主歌一
L:拦路雨偏似雪花
Z B /A (SG) /(DH) Q /W Q / (ZW) (BE) /A (SE) /D E /W Q /
L:饮泣的你冻吗
(MW) (BE) /M (SE) /G E /W Q / (NW) CQ/N (MH) /(AQ) W/ E /
L:这风褛我给你磨到有襟花
(BE) C /B (MG) /(DH) Q /W Q / (VW) (AQ) /F (GY) /H T /E W / (CW) (AQ) /D (GE) /Q E /W Q / (XW) NW/S (DW) /(FW) Q/ H /
L:连调了职也不怕
(BW) S /F G /H Q /W Q / (ZW) (BE) /A (ST) /D E /W Q /
L:怎么始终牵挂
(MW) (BE) /M (SY) /G E /W Q / (NW) CQ/N (MH) /(AQ) W/ E /
L:苦心选中今天想车你回家
(BT) C /B (MG) /(DH) Q /W Q / (VW) (AQ) /F (GY) /H T /E W / (CW) (AQ) /D (GE) /Q E /W Q / (XW) NW/G W /(BW) SQ/F H /

# 副歌一
L:谁都只得那双手
(ZQ) B /A (XA) /(CQ) J /J H / (NJ) (CH) /N (AG) /(DH) G /D S /
L:靠拥抱亦难任你拥有
(CD) (MG) /(SH) (BG) /M G /H G / (VH) ZH/N H /(BH) XG/M H /
L:要拥有必先懂失去怎接受
(ZG) (BD) /A S /D A /S D / (NG) (CD) /(NS) (CA) /Z A /S D / (XH) (ND) /(XS) (CA) /V A /A A / (BQ) XQ/B (NQ) /(AQ) H/ Q /
L:曾沿着雪路浪游
(BH) X /B (NG) /M A /Q J / (NQ) (CJ) /(NH) (AG) /(DH) G /D S /
L:为何为好事泪流
(CD) (MG) /(SH) (BG) /M G /H G / (VH) ZH/N H /(BH) XG/M H /
L:谁能凭爱意要富士山私有
(ZG) (BD) /X C /B A /(MS) D / (NG) (CD) /(NS) (CA) /Z A /(CS) D / (XH) (ND) /(CS) (VA) /(BQ) / / / /
L:何不把悲哀感觉 假设是来自你虚构
Q /H Q / (VH) (ZG) /B (NG) /H G /D S / (BD) (XS) /V A /N A/ S / (ZA) B /A F /G /S / D / G /H Q /W Q /

# 主歌二
L:情人节不要说穿
(ZW) (BE) /A (SE) /D E /W Q / (MW) (BE) /M (SE) /G E /W Q /
L:只敢抚你发端
(NW) CQ/N (MH) /(AQ) W/ E / (BE) C /B (MG) /(DH) Q /W Q /
L:这种姿态可会令你更心酸
(VW) (AQ) /F (GT) /H E /W E / (CW) (AQ) /D (GE) /Q E /W Q / (XW) NW/S (DW) /(FW) Q/ H /
L:留在汽车里取暖
(BW) S /F G /H Q /W Q / (ZW) (BE) /A (ST) /D E /W Q /
L:应该怎么规劝
(MW) (BE) /M (SY) /G E /W Q / (NW) CQ/N (MH) /(AQ) W/ E /
L:怎么可以把手腕忍痛划损
(BT) C /B (MG) /(DH) Q /W Q / (VW) (AQ) /F (GY) /H T /E W / (CW) (AQ) /D (GE) /Q E /W Q / (XW) NW/G W /(BW) SQ/F H / (ZQ) B /A (XA) /(CQ) J /J H /

# 副歌二
L:谁都只得那双手
(NJ) (CH) /N (AG) /(DH) G /D S / (CD) (MG) /(SH) (BG) /M G /H G /
L:靠拥抱亦难任你拥有
(VH) ZH/N H /(BH) XG/M H / (ZG) (BD) /A S /D A /S D /
L:要拥有必先懂失去怎接受
(NG) (CD) /(NS) (CA) /Z A /S D / (XH) (ND) /(XS) (CA) /V A /A A / (BQ) XQ/B (NQ) /(AQ) H/ Q /
L:曾沿着雪路浪游
(BH) X /B (NG) /M A /Q J / (NQ) (CJ) /(NH) (AG) /(DH) G /D S /
L:为何为好事泪流
(CD) (MG) /(SH) (BG) /M G /H G / (VH) ZH/N H /(BH) XG/M H /
L:谁能凭爱意要富士山私有
(ZG) (BD) /X C /B A /(MS) D / (NG) (CD) /(NS) (CA) /Z A /(CS) D / (XH) (ND) /(CS) (VA) /(BQ) / / / /
L:你还嫌不够 我把这陈年风褛 送赠你解咒
Q /H Q / (VH) (ZG) /B (NG) /H G /D S / (BD) (XS) /V A /N A/ S / (ZA) B /A F /G /S / D / / A /N A /

# 结尾
L:♪
(VAFH) G / G /H G /D G / (BSGE) W/ Q /H Q/ W / (ZQ) B /A S /D / / Z / / / /
`;

export const TRACK_FUJI = createTrack(
  {
    id: 'fuji',
    title: '富士山下',
    artist: '陈奕迅',
    source: 'https://www.bilibili.com/opus/858320570973945872',
    cover: 'covers/fuji.jpg',
    blurb: '陈奕迅 · B站精编',
    height: 320,
  },
  FUJI_SHEET,
  { beatMs: 780, groupBeats: 1, commaBeats: 0.5, melodyOnly: false },
);

export const TRACK_QINGTIAN = createTrackFromNotes(
  {
    id: 'qingtian',
    title: '晴天',
    artist: '周杰伦',
    source: 'https://www.cangqiang.com.cn/bofang/5925.html',
    cover: 'covers/qingtian.jpg',
    blurb: '周杰伦 · 苍强有声简谱',
    height: 210,
    sheetSvg: 'sheets/qingtian.svg',
  },
  QINGTIAN_CANGQIANG_NOTES,
  QINGTIAN_CANGQIANG_LYRICS,
);

/** @deprecated 已替换为 TRACK_QINGTIAN */
export const TRACK_MEET = TRACK_QINGTIAN;
/** @deprecated 已替换为 TRACK_QINGTIAN */
export const TRACK_GRAPE = TRACK_QINGTIAN;

export { parseKeyboardSheet as parseSheet };

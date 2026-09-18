/**
 * 谱源说明（公开社区曲谱原样录入，仅供学习演示）
 *
 * 富士山下：https://www.bilibili.com/opus/858320570973945872（精编键盘谱，含和弦）
 * 晴天：https://www.everyonepiano.cn/zimupu-192.html（EOP 风物之诗琴字母谱）
 *
 * 字母 = 风物琴键位（Z–M / A–J / Q–U），直接对应 MIDI，不做简谱改编。
 * `/` 分拍；`(ABC)` 同时弹；空格分音组；`,` / `，` 气口。
 */

/** [MIDI | 同时发音的 MIDI[], 时值ms]，0 为休止 */
export type ScoreNote = [number | number[], number];

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

export function scorePitches(pitch: number | number[]): number[] {
  if (Array.isArray(pitch)) return pitch.filter((m) => m > 0);
  return pitch > 0 ? [pitch] : [];
}

export type ParseOptions = {
  /** 一拍时长 ms（≈ 60000/BPM） */
  beatMs?: number;
  /** 每个音组占几拍（空格谱常用） */
  groupBeats?: number;
  /** 逗号气口占几拍 */
  commaBeats?: number;
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
    if (m[1] != null) {
      tokens.push({ kind: 'chord', keys: m[1].replace(/[^a-zA-Z]/g, '') });
    } else if (m[2] != null) {
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

  const pushEvents = (
    events: { midis: number[]; weight: number }[],
    durationMs: number,
  ) => {
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
      const pitch: number | number[] =
        ev.midis.length > 1 ? ev.midis : ev.midis[0] ?? 0;
      notes.push([pitch, dur]);
      time += dur;
    });
  };

  const tokensToEvents = (tokens: BeatToken[]) => {
    const events: { midis: number[]; weight: number }[] = [];
    for (const token of tokens) {
      if (token.kind === 'chord') {
        const midis = [...token.keys].map(midiOf).filter((m) => m > 0);
        events.push({ midis: midis.length ? midis : [0], weight: 1 });
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
      .replace(/[\u4e00-\u9fff：:]/g, '')
      .replace(/，/g, ',');
    const hasSlash = cleaned.includes('/');

    if (hasSlash) {
      const beats = cleaned.split('/');
      for (let bi = 0; bi < beats.length; bi++) {
        const beat = beats[bi];
        if (beat.includes(',')) {
          const parts = beat.split(',');
          for (let pi = 0; pi < parts.length; pi++) {
            if (parts[pi].replace(/\s+/g, '')) pushBeatRaw(parts[pi], beatMs);
            if (pi < parts.length - 1) pushRest(beatMs * commaBeats);
          }
          continue;
        }
        const compact = beat.replace(/\s+/g, '');
        if (!compact) {
          if (bi > 0 && bi < beats.length - 1) pushRest(beatMs);
          else if (bi === 0 && beats.length > 1) pushRest(beatMs);
          continue;
        }
        pushBeatRaw(beat, beatMs);
      }
    } else {
      // 无 / 的空格谱：空格分音组；括号仍作和弦
      const chunks = cleaned.split(/(\s+|,)/).filter((t) => t.length);
      for (const chunk of chunks) {
        if (chunk === ',') {
          pushRest(beatMs * commaBeats);
          continue;
        }
        if (/^\s+$/.test(chunk)) continue;
        pushBeatRaw(chunk, groupMs);
      }
    }
  }

  return { notes, lyrics };
}

/** 按「发声音符时值」推进歌词字，而不是整句匀速切分 */
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
  const segs: { start: number; dur: number }[] = [];
  for (const [pitch, dur] of notes) {
    const sounding = scorePitches(pitch).length > 0;
    if (sounding && t >= line.time && t < lineEnd) {
      segs.push({ start: t, dur });
    }
    t += dur;
    if (t >= lineEnd && segs.length) break;
  }

  if (!segs.length) return { lineIndex, charIndex: 0 };
  if (elapsedMs < segs[0].start) return { lineIndex, charIndex: 0 };

  const total = segs.reduce((s, e) => s + e.dur, 0) || 1;
  let acc = 0;
  let charIndex = 0;
  for (const seg of segs) {
    if (elapsedMs < seg.start + seg.dur) {
      charIndex = Math.min(chars.length - 1, Math.floor((acc / total) * chars.length));
      return { lineIndex, charIndex };
    }
    acc += seg.dur;
    charIndex = Math.min(chars.length - 1, Math.floor((acc / total) * chars.length));
  }
  return { lineIndex, charIndex: chars.length - 1 };
}

function buildTrack(
  meta: Omit<SongTrack, 'notes' | 'lyrics'>,
  parsed: { notes: ScoreNote[]; lyrics: LyricLine[] },
): SongTrack {
  return { ...meta, notes: parsed.notes, lyrics: parsed.lyrics };
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

/**
 * 晴天 · EOP 原神风物之诗琴字母谱（周杰伦）
 * https://www.everyonepiano.cn/zimupu-192.html
 * 拍线 `/` + `( )` 和弦，与富士山下同格式；非米游社简谱改编
 * 原谱标注 四分音符≈68 → beatMs≈880
 */
const QINGTIAN_SHEET = `
# 前奏
L:♪
N A /G A /V B N /G A /
Z B /G A /A G /M G /
N A /G A /V B N /G A /
Z B /G A /A G /M G /
N (AT) /(GT) (AQ) /(VQ) B N /(GW) (AE) /
Z (BT) /(GT) (AQ) /(AQ) (GW) E /(MW) Q G /
N (AT) /(GT) (AQ) /(VQ) B N /(GW) (AE) /
Z (BE) /G (AE) /(AR) E (GW) R /(ME) W (GQ) /
(NG) (AQ) /(GQ) (AE) /(VR) (BE) N /(GW) (AQ) W /
(ZE) (BE) /(GE) (AE) /(AW) E (GW) Q /(MQ) G /
(NG) (AQ) /(GQ) (AE) /(VR) (BE) N /(GW) (AQ) W /
(ZE) (BE) /(GE) (AE) /(AW) E (GW) Q /(MQ) G Q /
N Q (AQ) Q /(GJ) Q A Q /V Q (AQ) Q /(GJ) Q A Q /
Z Q (BQ) Q /(GJ) Q A Q /A Q (GQ) Q /(MT) T G T /
N T (AT) T /(GT) T A T /V T (AT) T /(GT) R (AE) W E /
Z B /G A /A G /(MW) Q (GJ) Q /
(NH) (AJ) /(GQ) (AT) /(VR) (AE) /(GQ) (AQ) /
Z B /G A /(AQ) Q (GQ) Q /(ME) (GQ) /
(NH) (AJ) /(GQ) (AT) /(VR) (AE) /(GQ) A W /
B S /G S /(BSGJ) /

# 主歌一
L:故事的小黄花从出生那年就飘着
(ZD) (BS) /(AF) (BD) /C (BA) /(AG) (BJ) /
L:童年的荡秋千随记忆一直晃到现在
(NQ) (CJ) /(AG) (CA) /N (CA) /(BH) (MH) /
L:Re so so si do si la
V (NH) /(AG) (NG) /B (MG) /(SF) (MD) /
L:So la si si si si la si la so
(ZS) (BD) /(AF) (BD) /S B /D B /
L:吹着前奏望着天空我想起花瓣试着掉落
(CD) B /(MG) B G /M (BG) /(MH) (BJ) /
(NW) (CJ) /(AQ) (DQ) /B C /A (DQ) /

# 预副歌一
L:为你翘课的那一天花落的那一天
(VQ) (AG) /(DG) (AH) /(VG) (ZF) /(NS) (ZD) /
L:教室的那一间我怎么看不见
(BF) (XG) /(MH) (XA) /(BH) X J /(MJ) X /
L:消失的下雨天我好想再淋一遍
(ZD) (BS) /(AF) (BD) /C (BA) /(AG) (BJ) /
L:没想到失去的勇气我还留着
(NQ) (CJ) /(AG) (CA) /N (CA) /(BH) (MH) /
L:好想再问一遍你会等待还是离开
V (NH) /(AG) (NG) /B (MG) /(SF) (MD) /
(ZS) (BD) /(AF) (BD) /S B /D B /
(CD) B /(MG) B G /M (BG) /(MH) (BJ) /
(NW) (CJ) /(AQ) (DQ) /B C /A (DQ) /
(VQ) (AG) /(DG) (AH) /(VG) (ZF) /(VN) (ZM) /
(BA) (XS) /(MD) X S /(XB) /D A /

# 间奏
L:♪
Z B /(AS) B (AS) /(AS) B /(AS) B (AS) /
V N /(AD) N (AD) /(AD) N /(AD) N (AD) /
X N /(AF) N (AF) /(AF) N /(AF) N (AF) /
V N /(AD) N (BS) /S B /S B Q /
N Q (AQ) Q /(GJ) Q A Q /V Q (AQ) Q /(GJ) Q A Q /
Z Q (BQ) Q /(GJ) Q A Q /A Q (GQ) Q /(MT) T G T /
N T (AT) T /(GT) T A T /V T (AT) T /(GT) R (AE) W E /
Z B /G A /A G /(MW) Q (GJ) Q /
(NH) (AJ) /(GQ) (AT) /(VR) (AE) /(GQ) A Q /
Z B /G A /(AQ) Q (GQ) Q /(ME) (GQ) /
(NH) (AJ) /(GQ) (AT) /(VR) (AE) /(GQ) A W /
B S /(GJ) B /J S /G B /

# 副歌一
L:刮风这天我试过握着你手
(ZD) (BS) /(AF) (BD) /C (BA) /(AG) (BJ) /
L:但偏偏雨渐渐大到我看你不见
(NQ) (CJ) /(AG) (CA) /N (CA) /(BH) (MH) /
L:还要多久我才能在你身边
V (NH) /(AG) (NG) /B (MG) /(SF) (MD) /
L:等到放晴的那天也许我会比较好一点
(ZS) (BD) /(AF) (BD) /S B /D B /
(CD) B /(MG) B G /M (BG) /(MH) (BJ) /
(NW) (CJ) /(AQ) (DQ) /B C /A (DQ) /

L:从前从前有个人爱你很久
(VQ) (AG) /(DG) (AH) /(VG) (ZF) /(NS) (ZD) /
L:但偏偏风渐渐把距离吹得好远
(BF) (XG) /(MH) (XA) /(BH) X J /(MJ) X /
L:好不容易又能再多爱一天
(ZD) (BS) /(AF) (BD) /C (BA) /(AG) (BJ) /
L:但故事的最后你好像还是说了拜拜
(NQ) (CJ) /(AG) (CA) /N (CA) /(BH) (MH) /
V (NH) /(AG) (NG) /B (MG) /(SF) (MD) /
(ZS) (BD) /(AF) (BD) /S B /D B /
(CD) B /(MG) B G /M (BG) /(MH) (BJ) /
(NW) (CJ) /(AQ) (DQ) /B C /A (DQ) /
(VQ) (AG) /(DG) (AH) /(VG) (ZF) /(VN) (ZM) /
(BA) (XS) /(MD) X S /(XB) /D A Q /

# 结尾
L:♪
(ZQ) Q (BQ) /(AQ) Q B /(SQ) Q (BQ) Q /D Q (BQ) Q /
V Q (AQ) Q /S Q (AQ) Q /(DQ) Q (AQ) Q /G (AQ) Q /
(XQ) (NQ) /(SQ) Q (NQ) Q /(DQ) Q (NQ) Q /G (NQ) Q /
(VQ) Q (AQ) Q /G Q (AQ) Q /(BQ) Q (SQ) Q /(GQ) Q S Q /
(ZQ) Q (BQ) /(AQ) Q (BQ) /(SQ) Q (BQ) Q /D Q (BQ) Q /
V Q (AQ) Q /S Q (AQ) Q /(DQ) Q (AQ) Q /G Q (AQ) Q /
(XQ) (NQ) /(SQ) Q N /(DQ) Q (NQ) Q /G Q (NQ) Q /
(VQ) Q (AQ) Q /(GQ) Q (AQ) Q /(BQ) Q (SQ) /G S /
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

export const TRACK_QINGTIAN = buildTrack(
  {
    id: 'qingtian',
    title: '晴天',
    artist: '周杰伦',
    source: 'https://www.everyonepiano.cn/zimupu-192.html',
  },
  parseKeyboardSheet(QINGTIAN_SHEET, { beatMs: 880, groupBeats: 1, commaBeats: 0.5 }),
);

/** @deprecated 已替换为 TRACK_QINGTIAN */
export const TRACK_MEET = TRACK_QINGTIAN;
/** @deprecated 已替换为 TRACK_QINGTIAN */
export const TRACK_GRAPE = TRACK_QINGTIAN;

export const SONG_TRACKS = [TRACK_FUJI, TRACK_QINGTIAN] as const;

export { parseKeyboardSheet as parseSheet };

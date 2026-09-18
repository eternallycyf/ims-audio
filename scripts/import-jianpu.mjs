/**
 * Convert jianpu.space text → ScoreNote module.
 * Usage: node scripts/import-jianpu.mjs <id> <trackId> [tonicMidi] [bpm]
 * Or with raw file: node scripts/import-jianpu.mjs --file path.txt trackId tonic bpm
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const KEY_TONIC = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 10, // jianpu.space B ≈ Bb for pop CN scores (孤勇者)
  Bb: 10,
  Ab: 8,
  Eb: 3,
  Db: 1,
  Gb: 6,
};

function parseKey(token) {
  // /key(C4) /key(B2) /key(Ab3)
  const m = String(token).match(/([A-Ga-g][b#]?)(\d)?/);
  if (!m) return { tonic: 60, name: 'C4' };
  const letter = m[1][0].toUpperCase() + (m[1].slice(1) || '');
  const oct = m[2] != null ? Number(m[2]) : 4;
  const pc = KEY_TONIC[letter] ?? KEY_TONIC[letter[0]] ?? 0;
  // MIDI: C4=60 → tonic = 12*(oct+1) + pc  (C4 = 12*5+0=60)
  const tonic = 12 * (oct + 1) + pc;
  return { tonic, name: `${letter}${oct}` };
}

const scale = [0, 2, 4, 5, 7, 9, 11];

function degToMidi(deg, oct, accidental, tonic) {
  if (deg <= 0) return 0;
  let midi = tonic + scale[deg - 1] + oct * 12;
  if (accidental === '#') midi += 1;
  if (accidental === 'b') midi -= 1;
  return midi;
}

function parseDuration(dur) {
  // empty → 1 beat; _ → half; = or __ → quarter; trailing - → longer; . → dotted
  if (!dur) return { beats: 1 };
  const us = (dur.match(/_/g) || []).length;
  const eqs = (dur.match(/=/g) || []).length;
  const dashes = (dur.match(/-/g) || []).length;
  const dots = (dur.match(/\./g) || []).length;
  let beats = 1;
  if (eqs >= 1) beats = 0.25;
  else if (us === 1) beats = 0.5;
  else if (us >= 2) beats = 0.25;
  // `6---` → 4 beats; `6_-` → 0.5+1
  if (dashes && us === 0 && eqs === 0) beats = 1 + dashes;
  else if (dashes) beats += dashes;
  if (dots) beats *= 1 + 0.5 * dots;
  return { beats };
}

function parseMusic(s) {
  s = s
    .replace(/\/key\([^)]*\)/gi, '')
    .replace(/[ｂb]ｐｍ[\d.]+/gi, '')
    .replace(/bpm[\d.]+/gi, '')
    .replace(/[|｜\s]/g, '');
  // accidental + degree + octave marks + duration marks
  const re = /(0+)|(-+)|([#b]?)([1-7])([,']*)([._=\-]*)/g;
  const out = [];
  let m;
  while ((m = re.exec(s))) {
    if (m[1]) {
      out.push({ midi: 0, beats: m[1].length * 0.25 });
      continue;
    }
    if (m[2]) {
      if (out.length) out[out.length - 1].beats += m[2].length;
      continue;
    }
    const accidental = m[3] || '';
    const deg = Number(m[4]);
    let oct = 0;
    for (const c of m[5] || '') {
      if (c === "'") oct += 1;
      if (c === ',') oct -= 1;
    }
    const { beats } = parseDuration(m[6] || '');
    out.push({ midi: degToMidi(deg, oct, accidental, parseMusic.tonic), beats });
  }
  return out;
}

function convert(raw, { tonic, bpm, title }) {
  parseMusic.tonic = tonic;
  const beatMs = Math.round(60000 / bpm);
  const lyrics = [{ time: 0, text: '♪' }];
  const notes = [];
  let t = 0;

  const parts = raw.split(/(?=L:)/);
  for (const part of parts) {
    if (part.startsWith('L:')) {
      let body = part.slice(2);
      const cut = body.search(/[0-9#b\-]/);
      let ly = (cut >= 0 ? body.slice(0, cut) : body).replace(/["'*?！!？]/g, ' ').trim();
      ly = ly.replace(/^[\s(（]+|[)）\s]+$/g, '').trim();
      if (ly && !/^(前奏|间奏|間奏)/.test(ly)) {
        lyrics.push({ time: t, text: ly.slice(0, 48) });
      }
      const music = cut >= 0 ? body.slice(cut) : '';
      for (const ev of parseMusic(music)) {
        const dur = Math.max(40, Math.round(ev.beats * beatMs));
        notes.push(ev.midi > 0 ? [ev.midi, dur] : [0, dur]);
        t += dur;
      }
    } else {
      for (const ev of parseMusic(part)) {
        const dur = Math.max(40, Math.round(ev.beats * beatMs));
        notes.push(ev.midi > 0 ? [ev.midi, dur] : [0, dur]);
        t += dur;
      }
    }
  }

  const merged = [];
  for (const n of notes) {
    const last = merged[merged.length - 1];
    if (last && last[0] === 0 && n[0] === 0) last[1] += n[1];
    else merged.push([...n]);
  }
  return { notes: merged, lyrics, totalMs: t, title };
}

function writeModule(trackId, exportPrefix, sourceUrl, data, comment) {
  const dest = path.join(root, `src/components/Piano/cangqiang/${trackId}.ts`);
  const out = `/** ${comment} */
export type ${exportPrefix}Note = [number, number] | [number, number, number];
export type ${exportPrefix}Lyric = { time: number; text: string };

export const ${exportPrefix}_NOTES: ${exportPrefix}Note[] = ${JSON.stringify(data.notes)};

export const ${exportPrefix}_LYRICS: ${exportPrefix}Lyric[] = ${JSON.stringify(data.lyrics, null, 2)};
`;
  fs.writeFileSync(dest, out);
  return dest;
}

const args = process.argv.slice(2);
if (args[0] === '--batch') {
  const batch = [
    {
      trackId: 'keximeiruguo',
      prefix: 'KEXIMEIRUGUO',
      txt: '/tmp/jp-kexi.txt',
      url: 'https://jianpu.space/zh-tw/songList/65199ac390e1087b5a0c2c59',
      bpmFallback: 80,
    },
    {
      trackId: 'tashuo',
      prefix: 'TASHUO',
      txt: '/tmp/jp-tashuo.txt',
      url: 'https://jianpu.space/zh-tw/songList/636bbb355f5c0ffe94aec4dc',
      bpmFallback: 76,
      keyFallback: 'C4',
    },
    {
      trackId: 'guyongzhe',
      prefix: 'GUYONGZHE',
      txt: '/tmp/jp-guyongzhe.txt',
      url: 'https://jianpu.space/zh-tw/songList/6666bf5f1e85a6493d60e8b8',
      bpmFallback: 130,
      // B2 on jianpu is written an octave low vs popular hook; use Bb3 so 1'≈Bb4
      tonicOverride: 58,
      keyNameOverride: 'Bb3',
    },
  ];

  for (const job of batch) {
    let raw = job.rawInline;
    if (!raw && job.txt && fs.existsSync(job.txt)) raw = fs.readFileSync(job.txt, 'utf8');
    if (!raw) {
      console.error('missing raw for', job.trackId);
      continue;
    }
    const keyM = raw.match(/\/key\(([^)]+)\)/i);
    const bpmM = raw.match(/[ｂb]?ｐ?ｍ\s*([\d.]+)|bpm\s*([\d.]+)/i);
    const key = keyM ? keyM[1] : job.keyFallback || 'C4';
    const bpm = bpmM ? Number(bpmM[1] || bpmM[2]) : job.bpmFallback;
    const parsed = parseKey(key);
    const tonic = job.tonicOverride ?? parsed.tonic;
    const name = job.keyNameOverride ?? parsed.name;
    const data = convert(raw, { tonic, bpm, title: job.trackId });
    const dest = writeModule(
      job.trackId,
      job.prefix,
      job.url,
      data,
      `Auto-generated from ${job.url} (${job.trackId}, 1=${name}, bpm=${bpm})`,
    );
    console.log({
      trackId: job.trackId,
      key: name,
      tonic,
      bpm,
      events: data.notes.length,
      sounding: data.notes.filter((n) => n[0] > 0).length,
      sec: +(data.totalMs / 1000).toFixed(1),
      lyrics: data.lyrics.length,
      dest,
      first: data.notes.filter((n) => n[0] > 0).slice(0, 8),
    });
  }
  process.exit(0);
}

console.error('Use: node scripts/import-jianpu.mjs --batch');
process.exit(1);

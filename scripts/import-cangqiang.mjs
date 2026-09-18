/**
 * Import cangqiang 有声简谱 → ScoreNote[] with sustain (textDuration / midiDuration).
 *
 * Usage:
 *   node scripts/import-cangqiang.mjs .sheet-cache/cangqiang-import/captured-partial.json
 *
 * Input JSON: { [key]: { id, title, artist, trackId, keynote, bpm, source, notation, lyric } }
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

function loadParser() {
  global.window = {
    location: {
      host: 'www.cangqiang.com.cn',
      hostname: 'www.cangqiang.com.cn',
      href: 'https://www.cangqiang.com.cn/',
      protocol: 'https:',
    },
    document: {
      createElement: () => ({
        style: {},
        setAttribute() {},
        appendChild() {},
        getContext: () => null,
      }),
    },
  };
  global.document = global.window.document;
  try {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'node' },
      configurable: true,
    });
  } catch {
    /* ignore */
  }
  return require(path.join(root, '.sheet-cache/hc.js'));
}

function buildParam(r, e) {
  e = String(e);
  if (r === 'keynote' || r === 'key_signature') {
    r = 'key_signature';
    e = e.replace(/1=/, '');
  }
  e = e.replace(/[:{}]/g, '');
  if (/^\s*$/.test(e)) return '';
  return `{${r}:${e}}\n`;
}

function walkLeaves(node, out = []) {
  if (Array.isArray(node)) {
    node.forEach((x) => walkLeaves(x, out));
    return out;
  }
  if (node && typeof node === 'object') {
    if (Array.isArray(node.notes)) walkLeaves(node.notes, out);
    else if ('textDuration' in node) out.push(node);
  }
  return out;
}

function toScoreNotes(parsedNotes) {
  const leaves = walkLeaves(parsedNotes).filter(
    (n) => n && typeof n.textDuration === 'number' && !n.notes && n.textDuration > 0,
  );
  const score = [];
  for (const n of leaves) {
    const advance = Math.round(n.textDuration * 1000);
    if (advance < 1) continue;
    const scale = Number(n.scale);
    const midi = n.midiNumber;
    if (scale > 0 && n.midiDuration > 0 && midi >= 21) {
      const sound = Math.round(n.midiDuration * 1000);
      if (sound !== advance) score.push([midi, advance, sound]);
      else score.push([midi, advance]);
    } else {
      // 休止 / 连音续写；丢弃解析器对复杂反复记号产生的超长空档
      const restAdv = Math.min(advance, 4000);
      score.push([0, restAdv]);
    }
  }
  const merged = [];
  for (const note of score) {
    const last = merged[merged.length - 1];
    if (last && last[0] === 0 && note[0] === 0 && last.length === 2 && note.length === 2) {
      last[1] += note[1];
    } else {
      merged.push(note);
    }
  }
  return merged;
}

function lyricLines(lyricText, notes) {
  const total = notes.reduce((s, n) => s + n[1], 0);
  const raw = String(lyricText || '')
    .split(/[/／]+/)
    .map((s) => s.replace(/[;；]+/g, '').replace(/\s+/g, '').trim())
    .filter((s) => s && !/^\/+$/.test(s));
  const lines = [{ time: 0, text: '♪' }];
  if (!raw.length) return lines;
  // skip leading instrumental-ish; distribute remaining lines across song
  const body = raw.filter((s) => s.length >= 2);
  if (!body.length) return lines;
  const step = total / (body.length + 0.5);
  body.forEach((text, i) => {
    lines.push({ time: Math.round(step * (i + 0.35)), text: text.slice(0, 40) });
  });
  return lines;
}

function emitModule(meta, notes, lyrics) {
  const noteLit = notes.map((n) => JSON.stringify(n)).join(',');
  const lyricsLit = JSON.stringify(lyrics, null, 2);
  const varBase = meta.trackId.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  return `/** Auto-generated from ${meta.source} (${meta.keynote}, bpm=${meta.bpm}) */
/** 苍强：推进用 textDuration；发音用 midiDuration；midiDuration=0 不重触发 */
export type CangqiangNote = [number, number] | [number, number, number];
export type CangqiangLyric = { time: number; text: string };

export const ${varBase}_NOTES: CangqiangNote[] = [${noteLit}];

export const ${varBase}_LYRICS: CangqiangLyric[] = ${lyricsLit};
`;
}

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node scripts/import-cangqiang.mjs <captured.json>');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(path.resolve(input), 'utf8'));
  const parser = loadParser();
  const outDir = path.join(root, 'src/components/Piano/cangqiang');
  fs.mkdirSync(outDir, { recursive: true });

  const index = [];
  for (const [key, meta] of Object.entries(data)) {
    if (!meta?.notation) {
      console.warn('skip', key, meta?.err || 'no notation');
      continue;
    }
    let src = '';
    src += buildParam('reset', 'screen');
    src += buildParam('output_svg', '0');
    src += buildParam('output_midi', 'true');
    src += buildParam('output_fingerings', 'true');
    src += buildParam('time_signature', '4/4');
    src += buildParam('key_signature', String(meta.keynote || 'C').replace(/^1=/, ''));
    src += meta.notation;

    let parsed;
    try {
      parsed = parser.parse(src);
    } catch (e) {
      console.error('parse fail', key, e.message);
      continue;
    }
    const notesTree = parsed.notes;
    const score = toScoreNotes(notesTree);
    const lyrics = lyricLines(meta.lyric, score);
    const fileBase = meta.trackId || key;
    const file = path.join(outDir, `${fileBase}.ts`);
    fs.writeFileSync(file, emitModule({ ...meta, trackId: fileBase }, score, lyrics));
    const total = score.reduce((s, n) => s + n[1], 0);
    const sustains = score.filter((n) => n[2]).length;
    console.log(
      `✓ ${fileBase}: events=${score.length} sustains=${sustains} totalMs=${total} → ${path.relative(root, file)}`,
    );
    index.push({
      trackId: fileBase,
      title: meta.title,
      artist: meta.artist,
      source: meta.source,
      file: `./cangqiang/${fileBase}`,
      notesExport: `${fileBase.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_NOTES`,
      lyricsExport: `${fileBase.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_LYRICS`,
    });
  }
  fs.writeFileSync(
    path.join(outDir, 'index.meta.json'),
    JSON.stringify(index, null, 2),
  );
}

main();

import {
  MIDDLE_C_MIDI,
  PIANO_KEYBOARD,
  PIANO_MIDI_MAX,
  PIANO_MIDI_MIN,
  SONG_TRACKS,
  TRACK_FUJI,
  TRACK_QINGTIAN,
  TRACK_SHANHUHAI,
  TRACK_YEQU,
  TRACK_ZUIJIASUNYOU,
  WHITE_KEYS,
  createTrack,
  jianpuToMidi,
  midiToFreq,
} from 'ims-audio';

test('createTrack builds injectable scores', () => {
  const track = createTrack(
    { id: 'demo', title: 'Demo', artist: 'Test', source: 'unit' },
    'L:测试\nA /S /D /',
    { beatMs: 500, melodyOnly: true },
  );
  expect(track.notes.length).toBeGreaterThan(0);
  expect(track.lyrics[0].text).toBe('测试');
  expect(track.id).toBe('demo');
});

test('catalog has many albums for masonry', () => {
  expect(SONG_TRACKS.length).toBeGreaterThanOrEqual(12);
  const ids = new Set(SONG_TRACKS.map((t) => t.id));
  expect(ids.has('fuji')).toBe(true);
  expect(ids.has('qingtian')).toBe(true);
  expect(ids.has('yequ')).toBe(true);
  expect(ids.has('lantingxu')).toBe(true);
  expect(ids.has('shanhuhai')).toBe(true);
  expect(ids.has('keximeiruguo')).toBe(true);
  expect(ids.has('xiulianaqing')).toBe(true);
  expect(ids.has('tashuo')).toBe(true);
  expect(ids.has('beiduibei')).toBe(true);
  expect(ids.has('zuijiasunyou')).toBe(true);
});

test('every catalog track has real lyrics', () => {
  for (const track of SONG_TRACKS) {
    const real = track.lyrics.filter((l) => l.text && l.text !== '♪');
    expect(real.length).toBeGreaterThan(0);
  }
});

test('tracks have dense notes and lyrics', () => {
  expect(TRACK_FUJI.notes.length).toBeGreaterThan(120);
  expect(TRACK_QINGTIAN.notes.length).toBeGreaterThan(80);
  expect(TRACK_YEQU.notes.length).toBeGreaterThan(20);
  expect(TRACK_SHANHUHAI.lyrics.length).toBeGreaterThan(5);
  expect(TRACK_FUJI.lyrics.length).toBeGreaterThan(10);
  expect(TRACK_QINGTIAN.lyrics[0].time).toBe(0);
  expect(TRACK_FUJI.title).toBe('富士山下');
  expect(TRACK_QINGTIAN.title).toBe('晴天');
  expect(TRACK_ZUIJIASUNYOU.artist).toBe('陈奕迅');
  expect(TRACK_FUJI.source).toContain('bilibili');
  expect(TRACK_QINGTIAN.source).toContain('cangqiang');
  // 苍强 1=G 视唱：前几个发音含 D5，且含升号 F#（非纯白键字母谱）
  const qtFirst = TRACK_QINGTIAN.notes
    .map(([p]) => (Array.isArray(p) ? p[0] : p))
    .filter((m) => m > 0);
  expect(qtFirst[0]).toBe(74);
  expect(
    TRACK_QINGTIAN.notes.some(([p]) => {
      const ms = Array.isArray(p) ? p : [p];
      return ms.some((m) => m > 0 && m % 12 === 6);
    }),
  ).toBe(true);
  // 富士山下字母谱含和弦多音
  expect(TRACK_FUJI.notes.some(([p]) => Array.isArray(p) && p.length > 1)).toBe(true);
});

test('lyric timestamps stay within song duration', () => {
  for (const track of SONG_TRACKS) {
    const total = track.notes.reduce((s, [, d]) => s + d, 0);
    expect(total).toBeGreaterThan(0);
    track.lyrics.forEach((line) => {
      expect(line.time).toBeGreaterThanOrEqual(0);
      expect(line.time).toBeLessThanOrEqual(total + 1);
    });
    for (let i = 1; i < track.lyrics.length; i++) {
      expect(track.lyrics[i].time).toBeGreaterThanOrEqual(track.lyrics[i - 1].time);
    }
  }
});

test('pitch helpers', () => {
  expect(midiToFreq(69)).toBeCloseTo(440, 5);
  expect(jianpuToMidi(1, 0)).toBe(60);
  expect(WHITE_KEYS.length).toBe(52);
});

test('full 88-key range A0–C8', () => {
  expect(PIANO_MIDI_MIN).toBe(21);
  expect(PIANO_MIDI_MAX).toBe(108);
  expect(PIANO_KEYBOARD.length).toBe(88);
  expect(PIANO_KEYBOARD[0].midi).toBe(21);
  expect(PIANO_KEYBOARD[87].midi).toBe(108);
  expect(PIANO_KEYBOARD.find((k) => k.midi === MIDDLE_C_MIDI)?.isMiddleC).toBe(true);
});

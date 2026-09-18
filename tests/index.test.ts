import {
  TRACK_FUJI,
  TRACK_QINGTIAN,
  WHITE_KEYS,
  PIANO_KEYBOARD,
  PIANO_MIDI_MIN,
  PIANO_MIDI_MAX,
  MIDDLE_C_MIDI,
  jianpuToMidi,
  midiToFreq,
} from 'ims-audio';

test('tracks have dense notes and lyrics', () => {
  expect(TRACK_FUJI.notes.length).toBeGreaterThan(120);
  expect(TRACK_QINGTIAN.notes.length).toBeGreaterThan(80);
  expect(TRACK_FUJI.lyrics.length).toBeGreaterThan(10);
  expect(TRACK_QINGTIAN.lyrics[0].time).toBe(0);
  expect(TRACK_FUJI.title).toBe('富士山下');
  expect(TRACK_QINGTIAN.title).toBe('晴天');
  expect(TRACK_QINGTIAN.artist).toBe('周杰伦');
  expect(TRACK_FUJI.notes.some(([p]) => Array.isArray(p) && p.length > 1)).toBe(true);
  expect(TRACK_QINGTIAN.source).toContain('everyonepiano');
  expect(TRACK_QINGTIAN.notes.some(([p]) => Array.isArray(p) && p.length > 1)).toBe(true);
});

test('lyric timestamps stay within song duration', () => {
  for (const track of [TRACK_FUJI, TRACK_QINGTIAN]) {
    const total = track.notes.reduce((s, [, d]) => s + d, 0);
    track.lyrics.forEach((line) => {
      expect(line.time).toBeGreaterThanOrEqual(0);
      expect(line.time).toBeLessThanOrEqual(total);
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

import {
  TRACK_FUJI,
  TRACK_MEET,
  WHITE_KEYS,
  jianpuToMidi,
  midiToFreq,
} from 'ims-audio';

test('tracks have dense notes and lyrics', () => {
  expect(TRACK_FUJI.notes.length).toBeGreaterThan(120);
  expect(TRACK_MEET.notes.length).toBeGreaterThan(80);
  expect(TRACK_FUJI.lyrics.length).toBeGreaterThan(10);
  expect(TRACK_MEET.lyrics[0].time).toBe(0);
  expect(TRACK_FUJI.title).toBe('富士山下');
  expect(TRACK_MEET.title).toContain('遇见');
});

test('lyric timestamps stay within song duration', () => {
  for (const track of [TRACK_FUJI, TRACK_MEET]) {
    const total = track.notes.reduce((s, [, d]) => s + d, 0);
    track.lyrics.forEach((line) => {
      expect(line.time).toBeGreaterThanOrEqual(0);
      expect(line.time).toBeLessThanOrEqual(total);
    });
    // 相邻歌词时间单调不减
    for (let i = 1; i < track.lyrics.length; i++) {
      expect(track.lyrics[i].time).toBeGreaterThanOrEqual(track.lyrics[i - 1].time);
    }
  }
});

test('pitch helpers', () => {
  expect(midiToFreq(69)).toBeCloseTo(440, 5);
  expect(jianpuToMidi(1, 0)).toBe(60);
  expect(WHITE_KEYS.length).toBe(15);
});

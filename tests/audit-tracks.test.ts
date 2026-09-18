import { SONG_TRACKS, scorePitches } from 'ims-audio';

test('audit every catalog track has playable notes', () => {
  for (const t of SONG_TRACKS) {
    const sounding = t.notes.filter(([p]) => scorePitches(p).length > 0).length;
    const total = t.notes.reduce((s, [, d]) => s + d, 0);
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        id: t.id,
        notes: t.notes.length,
        sounding,
        sec: +(total / 1000).toFixed(1),
        lyrics: t.lyrics.length,
        source: t.source.slice(0, 48),
      }),
    );
    expect(sounding).toBeGreaterThan(10);
    expect(total).toBeGreaterThan(10_000);
  }
});

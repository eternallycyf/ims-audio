import { Masonry } from 'antd';
import { Piano, SONG_TRACKS, type SongTrack } from 'ims-audio';
import { useMemo, useState } from 'react';

function coverSrc(cover?: string) {
  if (!cover) return undefined;
  if (
    cover.startsWith('http') ||
    cover.startsWith('data:') ||
    cover.startsWith('linear-gradient') ||
    cover.startsWith('/')
  ) {
    return cover;
  }
  const isProd = process.env.NODE_ENV === 'production';
  const base = isProd ? '/' : '/ims-audio/';
  return `${base}${cover}`.replace(/([^:]\/)\/+/g, '$1');
}

/** 首页：注入曲库瀑布流 → 点击专辑进入钢琴 */
export default () => {
  const [active, setActive] = useState<SongTrack | null>(null);

  const items = useMemo(
    () =>
      SONG_TRACKS.map((track) => ({
        key: track.id,
        height: track.height ?? 280,
        data: track,
      })),
    [],
  );

  if (active) {
    return (
      <div className="ims-piano-home ims-piano-home--play">
        <Piano
          autoPlay
          autoStart
          defaultTrack={active}
          tracks={SONG_TRACKS}
          showSongs={false}
          showTrackMeta
          onBack={() => setActive(null)}
          onTrackChange={setActive}
        />
      </div>
    );
  }

  return (
    <div className="ims-piano-home ims-piano-home--albums">
      <Masonry
        className="ims-piano-home__masonry"
        columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }}
        gutter={{ xs: 10, sm: 12, md: 14, lg: 16 }}
        items={items}
        itemRender={({ data }) => {
          const track = data as SongTrack;
          const src = coverSrc(track.cover);
          const cardH = track.height ?? 280;
          return (
            <button
              type="button"
              className="ims-album"
              style={{ height: cardH }}
              onClick={() => setActive(track)}
            >
              {src ? (
                <img className="ims-album__cover" src={src} alt={track.title} loading="lazy" />
              ) : (
                <span className="ims-album__cover ims-album__cover--fallback" aria-hidden />
              )}
              <span className="ims-album__meta">
                <span className="ims-album__title">{track.title}</span>
                <span className="ims-album__artist">{track.blurb ?? track.artist}</span>
              </span>
            </button>
          );
        }}
      />
    </div>
  );
};

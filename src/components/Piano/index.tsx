import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { TRACK_FUJI, TRACK_MEET, WHITE_KEY_COUNT } from './constants';
import {
  createEbonyTexture,
  createFeltTexture,
  createIvoryTexture,
  createLacquerTexture,
} from './textures';
import { usePianoAudio, type LyricUpdate } from './usePianoAudio';
import './index.less';

export interface PianoProps {
  className?: string;
  style?: CSSProperties;
  showSongs?: boolean;
}

const EMPTY_LYRIC: LyricUpdate = {
  index: -1,
  current: null,
  prev: null,
  next: null,
  track: null,
};

const Piano = ({ className, style, showSongs = true }: PianoProps) => {
  const [pressed, setPressed] = useState<Record<string, boolean>>({});
  const [lyric, setLyric] = useState<LyricUpdate>(EMPTY_LYRIC);
  const [textures, setTextures] = useState<{
    lacquer: string;
    ivory: string;
    ebony: string;
    felt: string;
  } | null>(null);

  useEffect(() => {
    setTextures({
      lacquer: createLacquerTexture(),
      ivory: createIvoryTexture(),
      ebony: createEbonyTexture(),
      felt: createFeltTexture(),
    });
  }, []);

  const handlePress = useCallback((keyId: string) => {
    setPressed((prev) => ({ ...prev, [keyId]: true }));
    window.setTimeout(() => {
      setPressed((prev) => ({ ...prev, [keyId]: false }));
    }, 120);
  }, []);

  const { play, playMusic, stopMusic, whiteKeys, blackKeys } = usePianoAudio(handlePress);

  const lacquerStyle = useMemo(
    () => (textures ? { backgroundImage: `url(${textures.lacquer})` } : undefined),
    [textures],
  );
  const ivoryStyle = useMemo(
    () => (textures ? { backgroundImage: `url(${textures.ivory})` } : undefined),
    [textures],
  );
  const ebonyStyle = useMemo(
    () => (textures ? { backgroundImage: `url(${textures.ebony})` } : undefined),
    [textures],
  );
  const feltStyle = useMemo(
    () => (textures ? { backgroundImage: `url(${textures.felt})` } : undefined),
    [textures],
  );

  const startTrack = (track: typeof TRACK_FUJI) => {
    playMusic(track, setLyric);
  };

  const handleStop = () => {
    stopMusic();
    setLyric(EMPTY_LYRIC);
  };

  const showLyricBar = Boolean(lyric.track);
  const title = lyric.track ? `${lyric.track.title} · ${lyric.track.artist}` : '';

  return (
    <div className={['ims-piano', className].filter(Boolean).join(' ')} style={style}>
      <div className="ims-piano__glow" aria-hidden />

      <div
        className={['ims-piano__lyric', showLyricBar ? 'ims-piano__lyric--active' : '']
          .filter(Boolean)
          .join(' ')}
      >
        <div className="ims-piano__lyric-meta">{title || '选择曲目开始演奏'}</div>
        <div className="ims-piano__lyric-lines">
          <p className="ims-piano__lyric-prev">{lyric.prev?.text || '\u00a0'}</p>
          <p className="ims-piano__lyric-current" key={lyric.index}>
            {lyric.current?.text || (showLyricBar ? '♪' : '♪ Online Piano')}
          </p>
          <p className="ims-piano__lyric-next">{lyric.next?.text || '\u00a0'}</p>
        </div>
      </div>

      <div className="ims-piano__stage">
        <div className="ims-piano__body" style={lacquerStyle}>
          <div className="ims-piano__rim" aria-hidden />
          <div className="ims-piano__lid" style={lacquerStyle}>
            <div className="ims-piano__lid-edge" />
          </div>

          <div className="ims-piano__badge">
            <span className="ims-piano__badge-mark">◆</span>
            <span className="ims-piano__badge-name">CONCERT</span>
            <span className="ims-piano__badge-mark">◆</span>
          </div>

          <div className="ims-piano__rack" style={lacquerStyle}>
            <div className="ims-piano__rack-lip" />
          </div>

          <div className="ims-piano__cheek ims-piano__cheek--left" style={lacquerStyle} />
          <div className="ims-piano__cheek ims-piano__cheek--right" style={lacquerStyle} />

          <div className="ims-piano__felt" style={feltStyle} />

          <div className="ims-piano__keyboard">
            <div className="ims-piano__keys">
              {whiteKeys.map((key) => (
                <button
                  key={key.id}
                  type="button"
                  id={`key-${key.id}`}
                  className={[
                    'ims-piano__key',
                    pressed[key.id] ? 'ims-piano__key--pressed' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={ivoryStyle}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    play(key.id);
                  }}
                >
                  <span className="ims-piano__key-sheen" />
                  <span className="ims-piano__key-label">{key.label}</span>
                  <span className="ims-piano__key-side" style={ivoryStyle} />
                  <span className="ims-piano__key-front" style={ivoryStyle} />
                </button>
              ))}
            </div>

            <div className="ims-piano__blacks">
              {blackKeys.map((key) => (
                <button
                  key={key.id}
                  type="button"
                  id={`key-${key.id}`}
                  className={[
                    'ims-piano__black',
                    pressed[key.id] ? 'ims-piano__black--pressed' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{
                    ...ebonyStyle,
                    left: `calc((100% / ${WHITE_KEY_COUNT}) * ${key.whiteIndex + 1} - (100% / ${WHITE_KEY_COUNT}) * 0.32)`,
                    width: `calc(100% / ${WHITE_KEY_COUNT} * 0.58)`,
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    play(key.id);
                  }}
                >
                  <span className="ims-piano__black-label">{key.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="ims-piano__pedals" aria-hidden>
            <span />
            <span className="ims-piano__pedals-main" />
            <span />
          </div>

          <div className="ims-piano__shadow" />
        </div>
      </div>

      {showSongs ? (
        <div className="ims-piano__songs">
          <button type="button" onClick={() => startTrack(TRACK_FUJI)}>
            富士山下
          </button>
          <button type="button" onClick={() => startTrack(TRACK_MEET)}>
            遇见
          </button>
          <button type="button" className="ims-piano__songs-stop" onClick={handleStop}>
            停止
          </button>
        </div>
      ) : null}

      <p className="ims-piano__hint">
        C3–C5 · Whites Z–M / A–K · Blacks 2 3 5 6 7 W E T Y U
        <br />
        曲谱来自公开社区数字/键盘谱（学习演示）
      </p>
    </div>
  );
};

export default Piano;

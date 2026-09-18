import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { TRACK_FUJI, TRACK_QINGTIAN, WHITE_KEY_COUNT, type SongTrack } from './constants';
import { usePianoAudio, type LyricUpdate } from './usePianoAudio';
import './index.less';

export interface PianoProps {
  className?: string;
  style?: CSSProperties;
  showSongs?: boolean;
  autoPlay?: boolean;
  defaultTrack?: SongTrack;
}

const EMPTY_LYRIC: LyricUpdate = {
  index: -1,
  charIndex: -1,
  current: null,
  prev: null,
  next: null,
  track: null,
};

function renderLyricLine(text: string, charIndex: number, active: boolean) {
  if (!active || charIndex < 0) return text || '\u00a0';
  let meaningful = -1;
  return Array.from(text).map((ch, i) => {
    const countable = ch !== '♪' && !/\s/.test(ch);
    if (countable) meaningful += 1;
    const on = countable && meaningful === charIndex;
    return (
      <span
        key={`${i}-${ch}`}
        className={on ? 'ims-piano__lyric-char ims-piano__lyric-char--on' : 'ims-piano__lyric-char'}
      >
        {ch}
      </span>
    );
  });
}

const Piano = ({
  className,
  style,
  showSongs = true,
  autoPlay = true,
  defaultTrack = TRACK_FUJI,
}: PianoProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const autoStartedRef = useRef(false);
  const [pressed, setPressed] = useState<Record<string, boolean>>({});
  const [lyric, setLyric] = useState<LyricUpdate>(EMPTY_LYRIC);
  const [activeId, setActiveId] = useState<string | null>(null);

  const handlePress = useCallback((keyId: string) => {
    setPressed((prev) => ({ ...prev, [keyId]: true }));
    window.setTimeout(() => {
      setPressed((prev) => ({ ...prev, [keyId]: false }));
    }, 140);
  }, []);

  const { play, playMusic, stopMusic, ready, loadProgress, whiteKeys, blackKeys } =
    usePianoAudio(handlePress);

  useEffect(() => {
    const scroller = keyboardRef.current;
    if (!scroller) return;
    const middle = scroller.querySelector('.ims-piano__key--middle-c') as HTMLElement | null;
    if (!middle) return;
    const left = middle.offsetLeft - scroller.clientWidth / 2 + middle.offsetWidth / 2;
    scroller.scrollLeft = Math.max(0, left);
  }, [whiteKeys.length]);

  const startTrack = useCallback(
    (track: SongTrack) => {
      autoStartedRef.current = true;
      setActiveId(track.id);
      playMusic(track, setLyric);
    },
    [playMusic],
  );

  const handleStop = useCallback(() => {
    stopMusic();
    setActiveId(null);
    setLyric(EMPTY_LYRIC);
  }, [stopMusic]);

  useEffect(() => {
    if (!autoPlay || !ready) return;
    const root = rootRef.current;
    if (!root) return;

    const onFirstInteract = (e: PointerEvent) => {
      if (autoStartedRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('.ims-piano__songs')) return;
      startTrack(defaultTrack);
      root.removeEventListener('pointerdown', onFirstInteract);
    };

    root.addEventListener('pointerdown', onFirstInteract);
    return () => root.removeEventListener('pointerdown', onFirstInteract);
  }, [autoPlay, defaultTrack, ready, startTrack]);

  const showLyricBar = Boolean(lyric.track);
  const title = lyric.track ? `${lyric.track.title} · ${lyric.track.artist}` : '';

  return (
    <div
      ref={rootRef}
      className={['ims-piano', className].filter(Boolean).join(' ')}
      style={style}
    >
      <div
        className={['ims-piano__lyric', showLyricBar ? 'ims-piano__lyric--active' : '']
          .filter(Boolean)
          .join(' ')}
      >
        <div className="ims-piano__lyric-meta">
          {title ||
            (ready
              ? autoPlay
                ? '点击键盘开始自动演奏'
                : '选择曲目开始演奏'
              : `加载琴声采样 ${loadProgress}%`)}
        </div>
        <div className="ims-piano__lyric-lines">
          <p className="ims-piano__lyric-prev">{lyric.prev?.text || '\u00a0'}</p>
          <p className="ims-piano__lyric-current">
            {renderLyricLine(
              lyric.current?.text || (showLyricBar ? '♪' : '♪'),
              lyric.charIndex,
              showLyricBar,
            )}
          </p>
          <p className="ims-piano__lyric-next">{lyric.next?.text || '\u00a0'}</p>
        </div>
      </div>

      {showSongs ? (
        <div className="ims-piano__songs">
          <button
            type="button"
            className={activeId === TRACK_FUJI.id ? 'ims-piano__songs-active' : undefined}
            onClick={() => startTrack(TRACK_FUJI)}
          >
            富士山下
          </button>
          <button
            type="button"
            className={activeId === TRACK_QINGTIAN.id ? 'ims-piano__songs-active' : undefined}
            onClick={() => startTrack(TRACK_QINGTIAN)}
          >
            晴天
          </button>
          <button type="button" className="ims-piano__songs-stop" onClick={handleStop}>
            停止
          </button>
        </div>
      ) : null}

      <div className="ims-piano__stage">
        <div className="ims-piano__wood" aria-hidden />
        <div className="ims-piano__keyboard" ref={keyboardRef}>
          <div
            className="ims-piano__board"
            style={{ ['--white-count' as string]: WHITE_KEY_COUNT }}
          >
            <div className="ims-piano__keys">
              {whiteKeys.map((key) => (
                <button
                  key={key.id}
                  type="button"
                  id={`key-${key.id}`}
                  className={[
                    'ims-piano__key',
                    pressed[key.id] ? 'ims-piano__key--pressed' : '',
                    key.isMiddleC ? 'ims-piano__key--middle-c' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    play(key.id);
                  }}
                >
                  {key.isMiddleC ? <span className="ims-piano__middle-c">中央C</span> : null}
                  <span className="ims-piano__key-label">{key.label}</span>
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
                    left: `calc((100% / ${WHITE_KEY_COUNT}) * ${key.whiteIndex + 1} - (100% / ${WHITE_KEY_COUNT}) * 0.35)`,
                    width: `calc(100% / ${WHITE_KEY_COUNT} * 0.62)`,
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    play(key.id);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Piano;

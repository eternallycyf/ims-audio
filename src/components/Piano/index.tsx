import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from 'react';
import { SONG_TRACKS, TRACK_FUJI, WHITE_KEY_COUNT, type SongTrack } from './constants';
import { spawnFloatsFromKey, type FloatParticle } from './floats';
import './index.less';
import PianoPlayer from './PianoPlayer';
import {
  createDeskTexture,
  createEbonyTexture,
  createFeltTexture,
  createIvoryTexture,
  createLacquerTexture,
} from './textures';
import { usePianoAudio, type ProgressUpdate } from './usePianoAudio';

export { default as PianoPlayer } from './PianoPlayer';
export type { PianoPlayerProps } from './PianoPlayer';

export interface PianoProps {
  className?: string;
  style?: CSSProperties;
  showSongs?: boolean;
  autoPlay?: boolean;
  /** 敲键后上浮彩色音符 */
  showFloats?: boolean;
  /** 显示音量控制（hover 展开滑条） */
  showVolume?: boolean;
  /** 初始音量 0–1，默认 1（跟随系统音量，应用内不再额外压低） */
  defaultVolume?: number;
  /** 采样就绪后立即自动开播（进入专辑页时用） */
  autoStart?: boolean;
  /** 当前默认曲目（autoPlay 首次交互 / autoStart） */
  defaultTrack?: SongTrack;
  /**
   * 外界注入的曲目列表。不传则用内置 SONG_TRACKS。
   * 也可用 createTrack(meta, sheet, options) 自行解析字母谱后传入。
   */
  tracks?: SongTrack[];
  /** 上一首 / 下一首切换时回调 */
  onTrackChange?: (track: SongTrack) => void;
  /** 返回回调；传入后在歌曲信息容器内显示返回 */
  onBack?: () => void;
  /** 是否悬浮展示封面/歌名/作者，默认 true */
  showTrackMeta?: boolean;
  /** 写入 stop()，离开页面前调用可立刻停播 */
  stopRef?: MutableRefObject<(() => void) | null>;
}

const Piano = ({
  className,
  style,
  showSongs = true,
  autoPlay = true,
  showFloats = true,
  showVolume = true,
  defaultVolume = 1,
  autoStart = false,
  defaultTrack = TRACK_FUJI,
  tracks,
  onTrackChange,
  onBack,
  showTrackMeta = true,
  stopRef,
}: PianoProps) => {
  const songList = useMemo(() => (tracks?.length ? tracks : SONG_TRACKS), [tracks]);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const floatsRef = useRef<HTMLDivElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const autoStartedRef = useRef(false);
  const [pressed, setPressed] = useState<Record<string, boolean>>({});
  const [floats, setFloats] = useState<FloatParticle[]>([]);
  const [progress, setProgress] = useState<ProgressUpdate>({
    elapsedMs: 0,
    totalMs: 0,
    playing: false,
    paused: false,
    track: null,
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTrack, setActiveTrack] = useState<SongTrack | null>(null);
  const [sheetVisible, setSheetVisible] = useState(true);
  const [textures, setTextures] = useState<{
    lacquer: string;
    ivory: string;
    ebony: string;
    felt: string;
    desk: string;
  } | null>(null);

  useEffect(() => {
    setTextures({
      lacquer: createLacquerTexture(),
      ivory: createIvoryTexture(),
      ebony: createEbonyTexture(),
      felt: createFeltTexture(),
      desk: createDeskTexture(),
    });
  }, []);

  const woodStyle = useMemo(
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
  const sceneStyle = useMemo(() => {
    if (!textures) return undefined;
    return {
      backgroundImage: `url(${textures.desk})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    } as CSSProperties;
  }, [textures]);

  const displayTrack = activeTrack || progress.track || defaultTrack;
  const floatTall =
    !sheetVisible ||
    !Boolean(displayTrack?.sheetSvg || displayTrack?.sheet || displayTrack?.notes?.length);
  const floatTallRef = useRef(floatTall);
  floatTallRef.current = floatTall;

  const burstFloat = useCallback(
    (keyId: string) => {
      if (!showFloats) return;
      const keyEl = document.getElementById(`key-${keyId}`);
      const layer = floatsRef.current;
      if (!keyEl || !layer) return;
      const next = spawnFloatsFromKey(keyEl, layer, floatTallRef.current ? 'tall' : 'normal');
      setFloats((prev) => {
        const merged = [...prev, ...next];
        // 防止自动演奏时粒子堆积
        return merged.length > 80 ? merged.slice(-60) : merged;
      });
    },
    [showFloats],
  );

  const handlePress = useCallback(
    (keyId: string) => {
      setPressed((prev) => ({ ...prev, [keyId]: true }));
      window.setTimeout(() => {
        setPressed((prev) => ({ ...prev, [keyId]: false }));
      }, 140);
      burstFloat(keyId);
    },
    [burstFloat],
  );

  const removeFloat = useCallback((id: number) => {
    setFloats((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const {
    play,
    playMusic,
    pauseMusic,
    resumeMusic,
    seekMusic,
    stopMusic,
    ready,
    loadProgress,
    volume,
    setVolume,
    whiteKeys,
    blackKeys,
  } = usePianoAudio(handlePress, defaultVolume);

  useEffect(() => {
    const scroller = keyboardRef.current;
    if (!scroller) return;
    const middle = scroller.querySelector('.ims-piano__key--middle-c') as HTMLElement | null;
    if (!middle) return;
    const left = middle.offsetLeft - scroller.clientWidth / 2 + middle.offsetWidth / 2;
    scroller.scrollLeft = Math.max(0, left);
  }, [whiteKeys.length]);

  /** 复位到关闭态（曲目取消选中、进度清零、播放按钮回「播放」） */
  const resetToClosed = useCallback(() => {
    setActiveId(null);
    setActiveTrack(null);
    setProgress({
      elapsedMs: 0,
      totalMs: 0,
      playing: false,
      paused: false,
      track: null,
    });
  }, []);

  const handleProgress = useCallback(
    (u: ProgressUpdate) => {
      // 自然播完：切到关闭态（与手动停止一致，但不掐断末音余韵）
      if (!u.playing && !u.paused && u.totalMs > 0 && u.elapsedMs >= u.totalMs) {
        resetToClosed();
        return;
      }
      setProgress(u);
    },
    [resetToClosed],
  );

  const startTrack = useCallback(
    (track: SongTrack, fromMs = 0) => {
      autoStartedRef.current = true;
      setActiveId(track.id);
      setActiveTrack(track);
      // playMusic 内部会先 stop 当前会话，避免切歌叠音
      playMusic(track, undefined, handleProgress, fromMs);
      onTrackChange?.(track);
    },
    [handleProgress, onTrackChange, playMusic],
  );

  const handleStop = useCallback(() => {
    stopMusic();
    resetToClosed();
  }, [resetToClosed, stopMusic]);

  const handleBack = useCallback(() => {
    handleStop();
    onBack?.();
  }, [handleStop, onBack]);

  useEffect(() => {
    if (!stopRef) return;
    stopRef.current = handleStop;
    return () => {
      stopRef.current = null;
    };
  }, [handleStop, stopRef]);

  const stopMusicRef = useRef(stopMusic);
  stopMusicRef.current = stopMusic;
  // 卸载（返回专辑首页）时立刻停播
  useEffect(() => {
    return () => {
      stopMusicRef.current();
    };
  }, []);

  const handleTogglePause = useCallback(() => {
    if (progress.playing && !progress.paused) {
      pauseMusic();
      return;
    }
    if (progress.playing && progress.paused) {
      resumeMusic();
      return;
    }
    startTrack(activeTrack || defaultTrack, progress.elapsedMs || 0);
  }, [activeTrack, defaultTrack, pauseMusic, progress, resumeMusic, startTrack]);

  const currentTrack = activeTrack || defaultTrack;
  const trackIndex = useMemo(
    () =>
      Math.max(
        0,
        songList.findIndex((t) => t.id === currentTrack.id),
      ),
    [currentTrack.id, songList],
  );

  const handlePrev = useCallback(() => {
    if (songList.length < 2) return;
    const prev = songList[(trackIndex - 1 + songList.length) % songList.length];
    startTrack(prev);
  }, [songList, startTrack, trackIndex]);

  const handleNext = useCallback(() => {
    if (songList.length < 2) return;
    const next = songList[(trackIndex + 1) % songList.length];
    startTrack(next);
  }, [songList, startTrack, trackIndex]);

  // 进入专辑：就绪后立刻开播
  useEffect(() => {
    if (!autoStart || !ready || autoStartedRef.current) return;
    startTrack(defaultTrack);
  }, [autoStart, ready, defaultTrack, startTrack]);

  useEffect(() => {
    if (!autoPlay || autoStart || !ready) return;
    const root = rootRef.current;
    if (!root) return;

    const onFirstInteract = (e: PointerEvent) => {
      if (autoStartedRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('.ims-piano__songs')) return;
      if (target?.closest?.('.ims-piano__fab')) return;
      if (target?.closest?.('.ims-piano__score-panel')) return;
      if (target?.closest?.('.ims-piano-player')) return;
      if (target?.closest?.('.ant-float-btn')) return;
      if (target?.closest?.('.ant-popover')) return;
      startTrack(defaultTrack);
      root.removeEventListener('pointerdown', onFirstInteract);
    };

    root.addEventListener('pointerdown', onFirstInteract);
    return () => root.removeEventListener('pointerdown', onFirstInteract);
  }, [autoPlay, autoStart, defaultTrack, ready, startTrack]);

  const title = displayTrack ? `${displayTrack.title} · ${displayTrack.artist}` : '';

  const handleSeek = useCallback(
    (ms: number) => {
      if (!activeTrack && displayTrack) {
        startTrack(displayTrack, ms);
      } else {
        seekMusic(ms);
      }
    },
    [activeTrack, displayTrack, seekMusic, startTrack],
  );

  const playerHint = ready ? undefined : `加载琴声采样 ${loadProgress}%`;

  return (
    <div
      ref={rootRef}
      className={['ims-piano', floatTall ? 'ims-piano--float-tall' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={{ ...sceneStyle, ...style }}
    >
      <div className="ims-piano__lamp-wash" aria-hidden />
      <div className="ims-piano__lamp" aria-hidden>
        <span className="ims-piano__lamp-stem" />
        <span className="ims-piano__lamp-head" />
        <span className="ims-piano__lamp-beam" />
        <span className="ims-piano__lamp-pool" />
      </div>

      <PianoPlayer
        track={displayTrack}
        progress={progress}
        ready={ready}
        loadProgress={loadProgress}
        volume={volume}
        onVolumeChange={setVolume}
        showVolume={showVolume}
        showTrackMeta={showTrackMeta}
        showPrevNext={songList.length > 1}
        sheetVisible={sheetVisible}
        onSheetVisibleChange={setSheetVisible}
        onBack={onBack ? handleBack : undefined}
        hint={playerHint}
        onPrev={handlePrev}
        onNext={handleNext}
        onTogglePlay={handleTogglePause}
        onSeek={handleSeek}
      />

      {showSongs ? (
        <div className="ims-piano__songs">
          {songList.map((track) => (
            <button
              key={track.id}
              type="button"
              className={activeId === track.id ? 'ims-piano__songs-active' : undefined}
              onClick={() => startTrack(track)}
            >
              {track.title}
            </button>
          ))}
        </div>
      ) : null}

      <div className="ims-piano__stage" ref={stageRef} aria-label={title}>
        {showFloats ? (
          <div className="ims-piano__floats" ref={floatsRef} aria-hidden>
            {floats.map((p) => (
              <span
                key={p.id}
                className="ims-piano__float"
                style={{
                  left: p.x,
                  top: p.y,
                  fontSize: p.size,
                  color: p.color,
                  ['--fx' as string]: `${p.dx}px`,
                  ['--fy' as string]: `${p.dy}px`,
                  ['--fr' as string]: `${p.rotate}deg`,
                  animationDuration: `${p.duration}s`,
                }}
                onAnimationEnd={() => removeFloat(p.id)}
              >
                {p.symbol}
              </span>
            ))}
          </div>
        ) : null}
        <div className="ims-piano__floor" aria-hidden />
        <div className="ims-piano__body">
          <div className="ims-piano__wood" style={woodStyle} aria-hidden>
            <span className="ims-piano__brand">
              <span className="ims-piano__brand-first">M</span>ay there be years to look back
              on,&nbsp;&nbsp;and deep love to grow old together
            </span>
            <span className="ims-piano__wood-gloss" />
            <span className="ims-piano__wood-lip" />
            <span className="ims-piano__wood-bevel" />
          </div>
          <div className="ims-piano__felt" style={feltStyle} aria-hidden />
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
                    style={ivoryStyle}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      play(key.id);
                    }}
                  >
                    <span className="ims-piano__key-sheen" aria-hidden />
                    <span className="ims-piano__key-side ims-piano__key-side--l" aria-hidden />
                    <span className="ims-piano__key-side ims-piano__key-side--r" aria-hidden />
                    {key.isMiddleC ? <span className="ims-piano__middle-c">中央C</span> : null}
                    <span className="ims-piano__key-label">
                      {key.label}
                      {key.octaveMark ? (
                        <span
                          className={`ims-piano__key-octave ims-piano__key-octave--${key.octaveMarkKind}`}
                        >
                          {key.octaveMark}
                        </span>
                      ) : null}
                    </span>
                    <span className="ims-piano__key-front" style={ivoryStyle} aria-hidden />
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
                      left: `calc((100% / ${WHITE_KEY_COUNT}) * ${
                        key.whiteIndex + 1
                      } - (100% / ${WHITE_KEY_COUNT}) * 0.35)`,
                      width: `calc(100% / ${WHITE_KEY_COUNT} * 0.62)`,
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      play(key.id);
                    }}
                  >
                    <span className="ims-piano__black-sheen" aria-hidden />
                    <span className="ims-piano__black-side ims-piano__black-side--l" aria-hidden />
                    <span className="ims-piano__black-side ims-piano__black-side--r" aria-hidden />
                    <span className="ims-piano__black-front" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Piano;

import {
  AlignLeftOutlined,
  ArrowLeftOutlined,
  AudioMutedOutlined,
  EyeInvisibleOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  SoundOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { FloatButton, Popover, Slider } from 'antd';
import { useState, type CSSProperties } from 'react';
import { formatTime, isCssBackground, resolveCoverUrl } from './cover';
import './index.less';
import { trackSheetText, type SongTrack } from './songs';
import type { ProgressUpdate } from './usePianoAudio';

export interface PianoPlayerProps {
  className?: string;
  style?: CSSProperties;
  /** 当前展示曲目（谱面 / 封面信息） */
  track: SongTrack | null;
  progress: ProgressUpdate;
  ready?: boolean;
  loadProgress?: number;
  volume?: number;
  onVolumeChange?: (v: number) => void;
  showVolume?: boolean;
  /** 是否悬浮展示封面/歌名/作者 */
  showTrackMeta?: boolean;
  /** 显示上一首 / 下一首 */
  showPrevNext?: boolean;
  /** 是否显示「隐藏/显示谱子」按钮，默认 true */
  showSheetToggle?: boolean;
  /** 受控：谱面是否可见 */
  sheetVisible?: boolean;
  /** 非受控初始值，默认 true */
  defaultSheetVisible?: boolean;
  onSheetVisibleChange?: (visible: boolean) => void;
  /** 返回回调；传入后在歌曲信息容器内显示返回 */
  onBack?: () => void;
  /** 未就绪 / 未播放时的副文案 */
  hint?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onTogglePlay?: () => void;
  onSeek?: (ms: number) => void;
}

/** 谱面 + 悬浮操作按钮 + 进度条（可独立使用） */
const PianoPlayer = ({
  className,
  style,
  track,
  progress,
  ready = true,
  loadProgress = 100,
  volume = 1,
  onVolumeChange,
  showVolume = true,
  showTrackMeta = true,
  showPrevNext = false,
  showSheetToggle = true,
  sheetVisible: sheetVisibleProp,
  defaultSheetVisible = true,
  onSheetVisibleChange,
  onBack,
  hint,
  onPrev,
  onNext,
  onTogglePlay,
  onSeek,
}: PianoPlayerProps) => {
  const [sheetVisibleInner, setSheetVisibleInner] = useState(defaultSheetVisible);
  const sheetVisible = sheetVisibleProp ?? sheetVisibleInner;

  const setSheetVisible = (visible: boolean) => {
    if (sheetVisibleProp === undefined) setSheetVisibleInner(visible);
    onSheetVisibleChange?.(visible);
  };

  const showPlayer = Boolean(track || progress.track);
  const displayTrack = track || progress.track;
  const sheetSvgUrl = resolveCoverUrl(displayTrack?.sheetSvg);
  const sheetText = trackSheetText(displayTrack);
  const sheetLines = sheetText ? sheetText.split('\n').filter(Boolean) : ['♪'];
  const cover = resolveCoverUrl(displayTrack?.cover);
  const coverIsCss = isCssBackground(displayTrack?.cover);
  const ratio = progress.totalMs > 0 ? Math.min(1, progress.elapsedMs / progress.totalMs) : 0;
  const isPlaying = progress.playing && !progress.paused;
  const playIcon = isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />;
  const playTip = !ready ? '加载中' : isPlaying ? '暂停' : '播放';
  const showMeta = showTrackMeta || Boolean(onBack);

  const subtitle = hint ?? (displayTrack?.artist || (ready ? '' : `加载琴声采样 ${loadProgress}%`));

  const volumeBtn = showVolume ? (
    <Popover
      trigger="hover"
      placement="left"
      arrow={false}
      content={
        <div className="ims-piano__fab-volume">
          <Slider
            vertical
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(v) => onVolumeChange?.(Number(v) / 100)}
            tooltip={{ formatter: (v) => `${v}%` }}
          />
        </div>
      }
    >
      <FloatButton
        className="ims-piano__fab-btn"
        icon={volume < 0.01 ? <AudioMutedOutlined /> : <SoundOutlined />}
        tooltip={`音量 ${Math.round(volume * 100)}%`}
      />
    </Popover>
  ) : null;

  return (
    <div className={['ims-piano-player', className].filter(Boolean).join(' ')} style={style}>
      {showMeta ? (
        <div className="ims-piano__fab ims-piano__fab-meta-wrap">
          <div className="ims-piano__fab-meta">
            {showTrackMeta ? (
              <>
                <div className="ims-piano__fab-meta-row">
                  {onBack ? (
                    <button
                      type="button"
                      className="ims-piano__fab-back"
                      aria-label="返回专辑"
                      title="返回专辑"
                      onClick={onBack}
                    >
                      <ArrowLeftOutlined />
                    </button>
                  ) : null}
                  <div className="ims-piano__fab-meta-text">
                    <strong>{displayTrack?.title || 'ims-audio'}</strong>
                    {subtitle ? <span>{subtitle}</span> : null}
                  </div>
                  {cover ? (
                    coverIsCss ? (
                      <span className="ims-piano__fab-cover" style={{ background: cover }} />
                    ) : (
                      <img className="ims-piano__fab-cover" src={cover} alt="" />
                    )
                  ) : (
                    <span
                      className="ims-piano__fab-cover ims-piano__fab-cover--fallback"
                      aria-hidden
                    />
                  )}
                </div>
                <div className="ims-piano__fab-seek">
                  <span className="ims-piano__time">{formatTime(progress.elapsedMs)}</span>
                  <input
                    className="ims-piano__seek"
                    type="range"
                    min={0}
                    max={Math.max(1, progress.totalMs)}
                    step={50}
                    value={Math.min(progress.elapsedMs, progress.totalMs || 0)}
                    aria-label="播放进度"
                    onChange={(e) => onSeek?.(Number(e.target.value))}
                    style={{ ['--seek' as string]: `${ratio * 100}%` }}
                  />
                  <span className="ims-piano__time">{formatTime(progress.totalMs)}</span>
                </div>
              </>
            ) : onBack ? (
              <div className="ims-piano__fab-meta-row">
                <button
                  type="button"
                  className="ims-piano__fab-back"
                  aria-label="返回专辑"
                  title="返回专辑"
                  onClick={onBack}
                >
                  <ArrowLeftOutlined />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="ims-piano__fab ims-piano__fab-controls">
        <div className="ims-piano__fab-actions" role="group" aria-label="播放控制">
          {volumeBtn}
          {showPrevNext ? (
            <FloatButton
              className="ims-piano__fab-btn"
              icon={<StepBackwardOutlined />}
              tooltip={{ title: '上一首', placement: 'left' }}
              onClick={() => ready && onPrev?.()}
            />
          ) : null}
          <FloatButton
            className="ims-piano__fab-btn"
            type="primary"
            icon={playIcon}
            tooltip={{ title: playTip, placement: 'left' }}
            onClick={() => ready && onTogglePlay?.()}
          />
          {showPrevNext ? (
            <FloatButton
              className="ims-piano__fab-btn"
              icon={<StepForwardOutlined />}
              tooltip={{ title: '下一首', placement: 'left' }}
              onClick={() => ready && onNext?.()}
            />
          ) : null}
          {showSheetToggle ? (
            <FloatButton
              className="ims-piano__fab-btn"
              icon={sheetVisible ? <AlignLeftOutlined /> : <EyeInvisibleOutlined />}
              tooltip={{
                title: sheetVisible ? '隐藏谱子' : '显示谱子',
                placement: 'left',
              }}
              onClick={() => setSheetVisible(!sheetVisible)}
            />
          ) : null}
        </div>
        <FloatButton
          className="ims-piano__fab-btn ims-piano__fab-tool"
          icon={<ToolOutlined />}
          aria-label="工具"
        />
      </div>

      <div
        className={[
          'ims-piano__score-panel',
          showPlayer ? 'ims-piano__score-panel--active' : '',
          sheetVisible ? '' : 'ims-piano__score-panel--hidden',
          sheetSvgUrl ? 'ims-piano__score-panel--svg' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden={!sheetVisible}
        aria-label="曲谱"
      >
        <div className="ims-piano__score-scroll">
          {sheetSvgUrl ? (
            <img
              className="ims-piano__score-svg"
              src={sheetSvgUrl}
              alt={`${displayTrack?.title || ''} 简谱`}
              draggable={false}
            />
          ) : (
            sheetLines.map((line, i) => (
              <div key={`${i}-${line.slice(0, 24)}`} className="ims-piano__score-row">
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PianoPlayer;

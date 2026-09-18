---
title: Piano
description: 在线钢琴
toc: content
group:
  title: 组件
  order: 0
demo:
  cols: 1
---

## Piano

88 键平面黑白钢琴。内置多首社区字母谱演示曲；**乐谱可由外界注入**。

> 键位较多，**完整演示（瀑布流专辑）请看 [首页](/)**。

- 音域：A0–C8（MIDI 21–108），含「中央 C」标注
- `autoStart` 进入后自动开播；可点曲目 / 上一首下一首切换（切歌会停掉当前播放）
- `PianoPlayer`：苍强式 SVG 简谱（或字母谱文本）+ 进度条 + 播放操作栏
- `tracks` / `createTrack`：注入自己的字母键盘谱；曲目可带 `sheetSvg` 指向 `public/sheets/*.svg`
- `stopRef`：离开页面前调用可立刻停播

```tsx | pure
import { Piano, PianoPlayer, createTrack, SONG_TRACKS } from 'ims-audio';

const myTrack = createTrack(
  { id: 'my', title: '我的歌', artist: 'Me', source: 'local' },
  `A /S /D /F /\nG /H /J /`,
  { beatMs: 720, melodyOnly: true },
);

export default () => <Piano autoPlay defaultTrack={myTrack} tracks={[myTrack, ...SONG_TRACKS]} />;
```

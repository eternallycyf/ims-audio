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

88 键平面黑白钢琴（观感对齐 webpage-piano），内置《富士山下》《晴天》。

> 键位较多，**完整演示请看 [首页](/)**。

- 音域：A0–C8（MIDI 21–108），含「中央C」标注
- 点击键盘可自动播放；可点曲目切换 / 停止
- 电脑键位对齐 [webpage-piano](https://github.com/yicheng-irun/webpage-piano) 默认映射（A/S/D…、空格=中央C 等）

```tsx
import { Piano } from 'ims-audio';

export default () => <Piano autoPlay />;
```

<code src='./demo/index.tsx'></code>

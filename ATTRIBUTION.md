# 第三方致谢 / Attribution

本仓库 `ims-audio` 的网页钢琴为**原创实现**（React + 3D 贴图琴身 UI + 自有曲谱播放），源码以 **MIT** 许可发布。

## 产品灵感参考

实现时参考了下列开源网页钢琴的产品形态（钢琴交互、采样发声思路），**未复制其源码**：

| 项目 | 地址 | 许可 |
|------|------|------|
| **webpage-piano** | https://github.com/yicheng-irun/webpage-piano | GPL-3.0 |

- 作者仓库说明：A web page piano / Html5 piano / 网页钢琴
- 在线演示见该仓库 README

本项目仅保留：**可弹奏钢琴** + **内置两首曲目自动演奏**；录音、MIDI 外设、在线房间等 webpage-piano 的其它功能未纳入。

底部琴身为原创 **3D 贴图** UI，并非 webpage-piano 的平面键位界面。

## 钢琴采样

发声采样来自公开的 MIDI.js Soundfonts（MusyngKite / acoustic_grand_piano），经 CDN 加载：

- https://github.com/gleitz/midi-js-soundfonts

若采样加载失败，会回退到 Web Audio 振荡器发声。

## 曲谱说明

内置《富士山下》《晴天》为公开社区数字/键盘谱编排的学习演示，非官方授权原谱，请勿商用。

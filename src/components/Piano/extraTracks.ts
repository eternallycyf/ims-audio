/** Built-in community letter scores (learning demos). Prefer createTrack() for app-injected sheets. */
import {
  GUYONGZHE_LYRICS as GUYONGZHE_JIANPU_LYRICS,
  GUYONGZHE_NOTES as GUYONGZHE_JIANPU_NOTES,
} from './cangqiang/guyongzhe';
import {
  KEXIMEIRUGUO_LYRICS as KEXIMEIRUGUO_JIANPU_LYRICS,
  KEXIMEIRUGUO_NOTES as KEXIMEIRUGUO_JIANPU_NOTES,
} from './cangqiang/keximeiruguo';
import {
  LANTINGXU_LYRICS as LANTINGXU_CANGQIANG_LYRICS,
  LANTINGXU_NOTES as LANTINGXU_CANGQIANG_NOTES,
} from './cangqiang/lantingxu';
import {
  QINGHUACI_LYRICS as QINGHUACI_CANGQIANG_LYRICS,
  QINGHUACI_NOTES as QINGHUACI_CANGQIANG_NOTES,
} from './cangqiang/qinghuaci';
import {
  TASHUO_LYRICS as TASHUO_JIANPU_LYRICS,
  TASHUO_NOTES as TASHUO_JIANPU_NOTES,
} from './cangqiang/tashuo';
import { createTrack, createTrackFromNotes } from './songs';

const SHEET_YEQU = `L:♪
HJ
QQQ/Q/JEE/
L:一群嗜血的蚂蚁被腐肉所吸引
YYY/TR/TQQ/
RRR/R/EJ/EW
WQJ/Q/Q/DHJ
L:我面无表情看孤独的风景
QQQ/Q/JEE/
YYY/TR/TQQ/
RRR/R/EW/QJ
L:放荡不羁的情绪在角落里自卑
JQH//
HJ
QQQ/Q/JEE/
L:隐藏着的威力有时假装脱离
YYY/TR/TQQ/
RRR/T/EJE/W
WQJ/Q/Q/J
L:世界安静得像一片空地
QQQ/Q/JEE/
YYY/TR/TQQ/
RRR/R/EWJ/Q
L:你说你有点叛逆有点不甘心
H//
H/J
QQQ/Q/JEE/
L:嘲笑别人的轻视
YYY/TR/TQQ/
RRR/T/EJE/W
WQJ/Q/Q/J
L:夜的第七幕是你想逃往何处去
QQQ/Q/JEE/
YYY/TR/TQQ/
RRR/R/EWJ/Q
H///`;

export const TRACK_YEQU = createTrack(
  {
    id: 'yequ',
    title: '夜曲',
    artist: '周杰伦',
    source: 'https://www.everyonepiano.cn/zimupu-24.html',
    cover: 'covers/yequ.jpg',
    blurb: '周杰伦 · EOP 原神琴学习谱',
    height: 470,
  },
  SHEET_YEQU,
  { beatMs: 682, groupBeats: 1, commaBeats: 0.5, melodyOnly: true },
);

export const TRACK_LANTINGXU = createTrackFromNotes(
  {
    id: 'lantingxu',
    title: '兰亭序',
    artist: '周杰伦',
    source: 'https://www.cangqiang.com.cn/bofang/167116.html',
    cover: 'covers/lantingxu.jpg',
    blurb: '周杰伦 · 苍强有声简谱',
    height: 360,
  },
  LANTINGXU_CANGQIANG_NOTES,
  LANTINGXU_CANGQIANG_LYRICS,
);

export const TRACK_KEXIMEIRUGUO = createTrackFromNotes(
  {
    id: 'keximeiruguo',
    title: '可惜没如果',
    artist: '林俊杰',
    source: 'https://jianpu.space/zh-tw/songList/65199ac390e1087b5a0c2c59',
    cover: 'covers/keximeiruguo.jpg',
    blurb: '林俊杰 · 简谱空间主旋律',
    height: 200,
  },
  KEXIMEIRUGUO_JIANPU_NOTES,
  KEXIMEIRUGUO_JIANPU_LYRICS,
);

export const TRACK_QINGHUACI = createTrackFromNotes(
  {
    id: 'qinghuaci',
    title: '青花瓷',
    artist: '周杰伦',
    source: 'https://www.cangqiang.com.cn/bofang/3714.html',
    cover: 'covers/qinghuaci.jpg',
    blurb: '周杰伦 · 苍强有声简谱',
    height: 420,
  },
  QINGHUACI_CANGQIANG_NOTES,
  QINGHUACI_CANGQIANG_LYRICS,
);

const SHEET_PUGONGYING = `L:♪
//D/FG
G/GG/H/JQ
L:小学篱笆旁的蒲公英
//QJ/WH
G/GW/Q/EE
L:是记忆里有味道的风景
//QW/EE
E/RE/W/EQ
L:午餐的食堂里喧闹的风景
//HJ/QW
Q/QH/E/EW
L:只有你安静的帮我凑近
//D/FG
G/GG/H/JGW
L:我的耳朵旁你说要去远方
Q//QJ/WH
G/GW/Q/EE
L:我的回答是那很好啊
//QW/EE
E/RE/W/EW
L:长大后世界像一张网
Q//HJ/QW
Q/QH/E/EW
L:过滤了梦想剩下了幻想
//DG/QE
E/R/W/
L:我还是喜欢看你认真的模样
W/TJ/Q/
ER/TQ/Q/WEE
L:那约定在心上不会遗忘
//DG/QE
E/R/W/
W/TJ/Q/
ER/TQ/Q/W
Q///`;

export const TRACK_PUGONGYING = createTrack(
  {
    id: 'pugongying',
    title: '蒲公英的约定',
    artist: '周杰伦',
    source: 'https://www.everyonepiano.cn/zimupu-13.html',
    cover: 'covers/pugongying.jpg',
    blurb: '周杰伦 · EOP 原神琴学习谱',
    height: 270,
  },
  SHEET_PUGONGYING,
  { beatMs: 882, groupBeats: 1, commaBeats: 0.5, melodyOnly: true },
);

export const TRACK_GUYONGZHE = createTrackFromNotes(
  {
    id: 'guyongzhe',
    title: '孤勇者',
    artist: '陈奕迅',
    source: 'https://jianpu.space/zh-tw/songList/6666bf5f1e85a6493d60e8b8',
    cover: 'covers/guyongzhe.jpg',
    blurb: '陈奕迅 · 简谱空间主旋律',
    height: 480,
  },
  GUYONGZHE_JIANPU_NOTES,
  GUYONGZHE_JIANPU_LYRICS,
);

const SHEET_SHANHUHAI = `L:海平面远方开始阴霾，悲伤要怎么平静纯白
AAAAMNMNBB,AAAASSBFDD
L:我的脸上，始终挟带，一抹浅浅的无奈
DGGA,ADDN,NASDFDS
L:你用唇语说你要离开，那难过无声慢了下来
AAAAMNMNBB,AAAAMNMMAA
L:汹涌潮水，你听明白，不是浪而是泪海
AMMAA,BAMMAA,BAA,SDAS
L:转身离开 分手说不出来
BSSDD,DFDAHGG
L:海鸟跟鱼相爱，只是一场意外
GHJWWQQ,QJHJHGG
L:我们的爱，差异一直存在
GJJQQ,QJHJHGG
L:风中尘埃 ，（等待）竟累积成伤害
DHHAA,HGDHHGG
L:转身离开，分手说不出来
BSSDD,DFDAHGG
L:蔚蓝的珊瑚海，错过瞬间苍白
GHJWWQQ,QJHJHGG
L:当初彼此，不够成熟坦白
GJJQQ,QJHJHGG
L:热情不再 ，你的笑容勉强不来，爱深埋珊瑚海
DHHA,AHGFDDSS,DSASSAA
L:毁坏的沙雕如何重来，有裂痕的爱怎么重盖
AAAAMNMNBB,AAAASSBFDD
L:只是一切，结束太快，你说你无法释怀
DGGA,ADDN,NASDFDS
L:贝壳里隐藏什么期待（等花儿开），我们也已经无心再猜
AAAAMNMNBB,AAAAMNMMAA
L:面向海风，咸咸的爱，尝不出，还有未来
AMMAA,BAMMAA,BAA,SDAS
L:转身离开 分手说不出来
BSSDD,DFDAHGG
L:海鸟跟鱼相爱，只是一场意外
GHJWWQQ,QJHJHGG
L:我们的爱，差异一直存在
GJJQQ,QJHJHGG
L:风中尘埃 ，等待竟累积成伤害
DHHAA,HGDHHGG
L:转身离开，分手说不出来
BSSDD,DFDAHGG
L:蔚蓝的珊瑚海，错过瞬间苍白
GHJWWQQ,QJHJHGG
L:当初彼此，不够成熟坦白
GJJQQ,QJHJHGG
L:热情不再，你的笑容勉强不来，爱深埋珊瑚海
DHHA,AHGFDDSS,DSASSAA`;

export const TRACK_SHANHUHAI = createTrack(
  {
    id: 'shanhuhai',
    title: '珊瑚海',
    artist: '周杰伦 / 梁心颐',
    source: 'https://www.miyoushe.com/ys/article/39360865',
    cover: 'covers/shanhuhai.jpg',
    blurb: '周杰伦 · 米游社字母谱',
    height: 200,
  },
  SHEET_SHANHUHAI,
  { beatMs: 720, groupBeats: 1, commaBeats: 0.5, melodyOnly: true },
);

const SHEET_XIULIANAQING = `L:♪
EREWE,FEREWEE Q
L:凭什么要失望，藏眼泪到心脏
DDDGHH,DDDGHHF
L:往事不会说谎，别跟它为难
HJJQQD JHHGF
L:我们两人之间不需要这样，我想
HJJQQW QJHHGF,DS
L:修炼爱情的心酸，学会放好以前的渴望
WEWQHWW,WEWQGWWJQ
L:我们那些信仰，要忘记多难
QWERRH,QJHJG
L:远距离的欣赏，近距离的迷惘
WEWQQH,WEWQQH
L:谁说太阳会找到月亮
WEWQQGWJQQ
L:别人有的爱，我们不可能模仿
GDFQQ,HJQJQWW
L:修炼爱情的悲欢，我们这些努力不简单
WEWQHWW,WEWQGWWJQ
L:快乐炼成泪水，是一种勇敢
QWERRH,QJHJJHG
L:几年前的幻想，几年后的原谅
WEWQQH,WEWQQH
L:为一张脸去养一身伤
WEWQQGTJQQ
L:别讲想念我，我会受不了这样
GDFQQ,EREWQJQ
L:记忆它真嚣张，路灯把痛点亮
DDDGHH,DDDGHHF
L:情人一起看过多少次月亮
HJJQQD JHHGF
L:它在天空看过多少次遗忘，多少心慌！
HJJQQWJHHGE,HJQW
L:修炼爱情的心酸，学会放好以前的渴望
WEWQHWW,WEWQGWWJQ
L:我们那些信仰，要忘记多难
QWERRH,QJHJG
L:远距离的欣赏，近距离的迷惘
WEWQQH,WEWQQH
L:谁说太阳会找到月亮
WEWQQGWJQQ
L:别人有的爱，我们不可能模仿
GDFQQ,HJQJQWW
L:修炼爱情的悲欢，我们这些努力不简单
WEWQHWW,WEWQGWWJQ
L:快乐炼成泪水，是一种勇敢
QWERRH,QJHJJHG
L:几年前的幻想，几年后的原谅
WEWQQH,WEWQQH
L:为一张脸去养一身伤
WEWQQGTJQQ
L:别讲想念我，我会受不了这样～
GDFQQ,EREWQJWQ
L:笑着说爱让人疯狂，哭着说爱让人紧张
HQQ QHJQW,JQW WJQWE
L:忘不了那个人就投降
REQ REQ REWWW
L:修炼爱情的心酸，学会放好以前的渴望
WEWQHWW,WEWQGWWJQ
L:我们那些信仰，要忘记多难
QWERRH,QJHJG
L:远距离的欣赏，近距离的迷惘
WEWQQH,WEWQQH
L:谁说太阳会找到月亮
WEWQQGWJQQ
L:别人有的爱，我们不可能模仿
GDFQQ,HJQJQWW
L:修炼爱情的悲欢，我们这些努力不简单
WEWQHWW,WEWQGWWJQ
L:快乐炼成泪水，是一种勇敢
QWERRH,QJHJJHG
L:几年前的幻想，几年后的原谅
WEWQQH,WEWQQH
L:为一张脸去养一身伤
WEWQQGTJQQ
L:别讲想念我，我会受不了这样
GDFQQ,EREWQJQQ`;

export const TRACK_XIULIANAQING = createTrack(
  {
    id: 'xiulianaqing',
    title: '修炼爱情',
    artist: '林俊杰',
    source: 'https://www.miyoushe.com/ys/article/45468812',
    cover: 'covers/xiulianaqing.jpg',
    blurb: '林俊杰 · 米游社字母谱',
    height: 300,
  },
  SHEET_XIULIANAQING,
  { beatMs: 700, groupBeats: 1, commaBeats: 0.5, melodyOnly: true },
);

export const TRACK_TASHUO = createTrackFromNotes(
  {
    id: 'tashuo',
    title: '她说',
    artist: '林俊杰',
    source: 'https://jianpu.space/zh-tw/songList/636bbb355f5c0ffe94aec4dc',
    cover: 'covers/tashuo.jpg',
    blurb: '林俊杰 · 简谱空间主旋律',
    height: 210,
  },
  TASHUO_JIANPU_NOTES,
  TASHUO_JIANPU_LYRICS,
);

const SHEET_BEIDUIBEI = `L:♪
QQQQJG HGFDS QQQQJG D
L:话总说不清楚，该怎么明了
AQQQJG,HHGFG
L:一字一句像圈套
AQQQJ GH
L:旧账总翻不完，谁无理取闹
AQQQJ(GG),HHGFG
L:你的双手甩开刚好的微妙，然后战火在燃烧
DSAQQEWQJGQ,HJQJQGW
L:我们背对背拥抱，滥用沉默在咆哮
EEWQWHQ,E(EE)WQWQG
L:爱情来不及变老，葬送在烽火的玩笑
EEWQWHQ,QQJJ JH HHGG
L:我们背对背拥抱，真话兜着圈子乱乱绕
EEWQWHQ,JJQWGDGGWQQ
L:只是想让我知道，只是想让你知道，爱的警告
GGFDFQQ,GGFDFQQ,QQJQ
L:我不要，一直逃，形同陌路变成自找
QJQ,QJW,QQWEWQQGH
L:既然可以拥抱，就不要轻易放掉
GFDGQQ FDFQEQW
L:我们背对背拥抱，滥用沉默在咆哮
EEWQWHQ,E(EE)WQWQG
L:爱情来不及变老，葬送在烽火的玩笑
EEWQWHQ,QQJJ JH HHGG
L:我们背对背拥抱，真话兜着圈子乱乱绕
EEWQWHQ,JJQWGDGGWQQ
L:只是想让我知道，只是想让你知道，这警告
GGFDFQQ,GGFDFQQ,QJQ
L:只是想让我知道，只是想让你知道，爱的警告
GGFDFQQ,GGFDFQQ,QQJQ`;

export const TRACK_BEIDUIBEI = createTrack(
  {
    id: 'beiduibei',
    title: '背对背拥抱',
    artist: '林俊杰',
    source: 'https://www.miyoushe.com/ys/article/14547943',
    cover: 'covers/beiduibei.jpg',
    blurb: '林俊杰 · 米游社字母谱',
    height: 400,
  },
  SHEET_BEIDUIBEI,
  { beatMs: 680, groupBeats: 1, commaBeats: 0.5, melodyOnly: true },
);

const SHEET_DAODAI = `L:我受够了等待，你所谓的安排
BDSSDS,BDSSDA
L:说的未来到底多久才来
ASDAASDAFD
L:总是要来不及，才知道我可爱
BDSSDS,BDSSDA
L:我想依赖而你却都不在
ASDAASDASA
L:应该开心的地带，你给的全是空白
AAMBAMB,AAMBAMB
L:一个人假日发呆，找不到人陪我看海
AMABAMA,SSSSSADS
L:我在幸福的门外，却一直都进不来
FFDFGDS,DDSDSANA
L:你累积给的伤害，我是真的很难释怀
FFDFDSA,SSSSSAHG
L:终于看开爱回不来，而你总是太晚明白
GFFDDSFD,GFFDDSSA
L:最后才把话说开，哭着求我留下来
FFFGGFDF,HHHJJHH HG
L:终于看开爱回不来，我们面前太多阻碍
GFFDDSFD,GFFDDSSA
L:你的手却放不开，宁愿没出息，求我别离开
FFFGGFDF,DFDFFG,FDASA`;

export const TRACK_DAODAI = createTrack(
  {
    id: 'daodai',
    title: '倒带',
    artist: '蔡依林',
    source: 'https://www.miyoushe.com/ys/article/68992838',
    cover: 'covers/daodai.jpg',
    blurb: '蔡依林 · 米游社字母谱',
    height: 250,
  },
  SHEET_DAODAI,
  { beatMs: 700, groupBeats: 1, commaBeats: 0.5, melodyOnly: true },
);

const SHEET_ZUIJIASUNYOU = `L:♪
G A /Q Q /A G /D G /
L:朋友我当你一秒朋友
G A /Q Q /A G /E G /
L:朋友我当你一世朋友
A Q /E E /W Q /Q E /
L:奇怪过去再不堪回首
W E /Q Q /H Q /G H /
L:怀缅时时其实还有
G A /Q Q /A G /D G /
L:朋友你试过将我营救
G A /Q Q /A G /E G /
L:朋友你试过把我批斗
A Q /E E /W Q /Q E /
L:无法再与你交心联手
Q W /E W /Q H /G /
L:毕竟难得有过最佳损友
A S /D F /G H /Q /
L:从前共你促膝把酒倾通宵都不够
H G /E G /D /
L:我有痛快过你有没有
A S /D F /G H /J Q /
L:很多东西今生只可给你保守至到永久
H G /E /
L:别人如何明白透
A S /D F /G H /Q /
L:实实在在踏入过我宇宙
H G /E G /W /
L:即使相处到有个裂口
A Q /G A /Q /
L:命运决定了以后再没法聚头
W Q /H Q /G H /Q /
L:但说过去却那样厚
E W /Q H /G /
L:问我有没有确实也没有
G H /Q W /E /
L:一直躲避的借口非什么大仇
W E /Q H /G A /Q /
L:为何旧知己在最后变不到老友
G H /Q W /E Q /H /`;

export const TRACK_ZUIJIASUNYOU = createTrack(
  {
    id: 'zuijiasunyou',
    title: '最佳损友',
    artist: '陈奕迅',
    source: 'simplified-learning-demo',
    cover: 'covers/zuijiasunyou.jpg',
    blurb: '陈奕迅 · 学习简化谱（演示用）',
    height: 450,
  },
  SHEET_ZUIJIASUNYOU,
  { beatMs: 780, groupBeats: 1, commaBeats: 0.5, melodyOnly: true },
);

export const EXTRA_TRACKS = [
  TRACK_YEQU,
  TRACK_LANTINGXU,
  TRACK_KEXIMEIRUGUO,
  TRACK_QINGHUACI,
  TRACK_PUGONGYING,
  TRACK_GUYONGZHE,
  TRACK_SHANHUHAI,
  TRACK_XIULIANAQING,
  TRACK_TASHUO,
  TRACK_BEIDUIBEI,
  TRACK_DAODAI,
  TRACK_ZUIJIASUNYOU,
] as const;

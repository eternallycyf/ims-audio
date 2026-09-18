import { EXTRA_TRACKS } from './extraTracks';
import { TRACK_FUJI, TRACK_QINGTIAN, type SongTrack } from './songs';

/** 内置演示曲库（可被 Piano `tracks` / 外界 createTrack 完全替换） */
export const SONG_TRACKS: SongTrack[] = [TRACK_FUJI, TRACK_QINGTIAN, ...EXTRA_TRACKS];

export {
  EXTRA_TRACKS,
  TRACK_BEIDUIBEI,
  TRACK_DAODAI,
  TRACK_GUYONGZHE,
  TRACK_KEXIMEIRUGUO,
  TRACK_LANTINGXU,
  TRACK_PUGONGYING,
  TRACK_QINGHUACI,
  TRACK_SHANHUHAI,
  TRACK_TASHUO,
  TRACK_XIULIANAQING,
  TRACK_YEQU,
  TRACK_ZUIJIASUNYOU,
} from './extraTracks';

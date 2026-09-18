export {
  BLACK_KEYS,
  KEY_BY_CODE,
  KEY_BY_ID,
  KEY_BY_MIDI,
  NOTE_MAP,
  PIANO_KEYBOARD,
  PIANO_KEYS,
  WHITE_KEY_COUNT,
  WHITE_KEYS,
  foldNote,
  jianpuToMidi,
  midiToFreq,
} from './notes';
export type { KeyType, PianoKeyDef } from './notes';

export {
  SONG_TRACKS,
  TRACK_FUJI,
  TRACK_MEET,
  TRACK_GRAPE,
} from './songs';
export type { LyricLine, ScoreNote, SongTrack } from './songs';

/** 兼容旧导出名 */
export {
  TRACK_FUJI as SONG_FUJI,
  TRACK_MEET as SONG_MEET,
  TRACK_GRAPE as SONG_GRAPE,
} from './songs';

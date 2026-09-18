export {
  BLACK_KEYS,
  KEY_BY_CODE,
  KEY_BY_ID,
  KEY_BY_KEYCODE,
  KEY_BY_MIDI,
  MIDDLE_C_MIDI,
  NOTE_MAP,
  PC_KEYCODE_TO_PIANO,
  PIANO_KEYBOARD,
  PIANO_KEYS,
  PIANO_MIDI_MAX,
  PIANO_MIDI_MIN,
  WHITE_KEY_COUNT,
  WHITE_KEYS,
  foldNote,
  jianpuToMidi,
  midiToFreq,
  pianoIndexToMidi,
  pianoWhiteLabel,
} from './notes';
export type { KeyType, PianoKeyDef } from './notes';

export {
  SONG_TRACKS,
  TRACK_FUJI,
  TRACK_QINGTIAN,
  TRACK_MEET,
  TRACK_GRAPE,
  resolveLyricAt,
  scorePitches,
} from './songs';
export type { LyricLine, ScoreNote, SongTrack } from './songs';

/** 兼容旧导出名 */
export {
  TRACK_FUJI as SONG_FUJI,
  TRACK_QINGTIAN as SONG_QINGTIAN,
  TRACK_MEET as SONG_MEET,
  TRACK_GRAPE as SONG_GRAPE,
} from './songs';

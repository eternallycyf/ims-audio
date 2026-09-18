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
  WHITE_KEYS,
  WHITE_KEY_COUNT,
  foldNote,
  jianpuToMidi,
  midiToFreq,
  pianoIndexToMidi,
  pianoWhiteLabel,
  pianoWhiteLabelParts,
} from './notes';
export type { KeyType, PianoKeyDef, WhiteKeyLabelParts } from './notes';

export {
  TRACK_FUJI,
  TRACK_GRAPE,
  TRACK_MEET,
  TRACK_QINGTIAN,
  createTrack,
  createTrackFromNotes,
  midiToNoteName,
  noteAdvanceMs,
  noteSoundMs,
  notesToSheet,
  parseKeyboardSheet,
  parseSheet,
  resolveLyricAt,
  scorePitches,
  sheetDisplayText,
  trackDurationMs,
  trackSheetText,
} from './songs';
export type { LyricLine, ParseOptions, ScoreNote, SongMeta, SongTrack } from './songs';

export {
  EXTRA_TRACKS,
  SONG_TRACKS,
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
} from './catalog';

/** 兼容旧导出名 */
export {
  TRACK_FUJI as SONG_FUJI,
  TRACK_GRAPE as SONG_GRAPE,
  TRACK_MEET as SONG_MEET,
  TRACK_QINGTIAN as SONG_QINGTIAN,
} from './songs';

export { default as Piano } from './components/Piano';
export type { PianoProps } from './components/Piano';
export {
  NOTE_MAP,
  PIANO_KEYS,
  PIANO_KEYBOARD,
  WHITE_KEYS,
  BLACK_KEYS,
  SONG_FUJI,
  SONG_GRAPE,
  SONG_MEET,
  TRACK_FUJI,
  TRACK_GRAPE,
  TRACK_MEET,
  SONG_TRACKS,
  foldNote,
  jianpuToMidi,
  midiToFreq,
} from './components/Piano/constants';
export type {
  ScoreNote,
  PianoKeyDef,
  LyricLine,
  SongTrack,
} from './components/Piano/constants';
export { usePianoAudio } from './components/Piano/usePianoAudio';
export type { LyricUpdate } from './components/Piano/usePianoAudio';

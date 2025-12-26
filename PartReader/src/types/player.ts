export type PlaybackState = 'stopped' | 'playing' | 'paused';

export interface PlayerState {
  playbackState: PlaybackState;
  currentTime: number;
  currentMeasure: number;
  tempo: number;
  volume: number;
  isMetronomeOn: boolean;
  loop: {
    enabled: boolean;
    startMeasure: number;
    endMeasure: number;
  };
}

export interface PlayerControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  seekToMeasure: (measure: number) => void;
  setTempo: (bpm: number) => void;
  setVolume: (volume: number) => void;
  toggleMetronome: () => void;
  setLoop: (start: number, end: number) => void;
}
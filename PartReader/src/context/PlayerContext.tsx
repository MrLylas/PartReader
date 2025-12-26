import { create } from 'zustand';

interface PlayerStore {
  isPlaying: boolean;
  tempo: number;
  volume: number;
  play: () => void;
  pause: () => void;
  setTempo: (tempo: number) => void;
  setVolume: (volume: number) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  isPlaying: false,
  tempo: 120,
  volume: 0.8,
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setTempo: (tempo) => set({ tempo }),
  setVolume: (volume) => set({ volume }),
}));
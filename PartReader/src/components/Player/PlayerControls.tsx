import React from 'react';
import type { PlaybackState } from '@/types/player';

interface PlayerControlsProps {
  playbackState: PlaybackState;
  currentTime: number;
  totalDuration: number;
  tempo: number;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onTempoChange: (tempo: number) => void;
  onVolumeChange: (volume: number) => void;
  disabled?: boolean;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  playbackState,
  currentTime,
  totalDuration,
  tempo,
  volume,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onTempoChange,
  onVolumeChange,
  disabled = false,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Barre de progression */}
      <div className="mb-6">
        <div
          className="h-2 bg-gray-200 rounded-full cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            onSeek(percent * totalDuration);
          }}
        >
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Boutons de contrôle */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {/* Stop */}
        <button
          onClick={onStop}
          disabled={disabled}
          className={`p-3 rounded-full transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          title="Stop"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={playbackState === 'playing' ? onPause : onPlay}
          disabled={disabled}
          className={`p-4 bg-primary-500 text-white rounded-full transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-600'}`}
          title={playbackState === 'playing' ? 'Pause' : 'Play'}
        >
          {playbackState === 'playing' ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Placeholder pour bouton suivant */}
        <div className="w-12" />
      </div>

      {/* Tempo et Volume */}
      <div className="grid grid-cols-2 gap-6">
        {/* Tempo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tempo: {tempo} BPM
          </label>
          <input
            type="range"
            min="40"
            max="240"
            value={tempo}
            onChange={(e) => onTempoChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Volume */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Volume: {Math.round(volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
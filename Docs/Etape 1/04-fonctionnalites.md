# 04 - Guide des fonctionnalités

Ce guide détaille l'implémentation des fonctionnalités principales de PartReader.

## 1. Types de base

### `src/types/music.ts`

```typescript
export interface Note {
  pitch: string;        // Ex: "C4", "D#5"
  duration: number;     // En secondes
  startTime: number;    // Position dans la partition
  velocity: number;     // Volume (0-127)
  measure: number;      // Numéro de mesure
  voice: number;        // Voix (pour polyphonie)
}

export interface Measure {
  number: number;
  startTime: number;
  duration: number;
  notes: Note[];
  timeSignature?: TimeSignature;
  keySignature?: KeySignature;
}

export interface TimeSignature {
  beats: number;        // Numérateur (ex: 4)
  beatType: number;     // Dénominateur (ex: 4)
}

export interface KeySignature {
  fifths: number;       // -7 à +7 (bémols/dièses)
  mode: 'major' | 'minor';
}

export interface MusicScore {
  title: string;
  composer?: string;
  tempo: number;        // BPM
  measures: Measure[];
  parts: Part[];
  totalDuration: number;
}

export interface Part {
  id: string;
  name: string;         // Ex: "Piano", "Violin"
  instrument: string;
  notes: Note[];
}
```

### `src/types/player.ts`

```typescript
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
```

## 2. Service Audio

### `src/services/audioService.ts`

```typescript
import * as Tone from 'tone';
import Soundfont, { Player } from 'soundfont-player';
import type { Note, MusicScore } from '@/types/music';

class AudioService {
  private audioContext: AudioContext | null = null;
  private instruments: Map<string, Player> = new Map();
  private isInitialized = false;
  private scheduledEvents: number[] = [];

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Initialiser le contexte audio (nécessite une interaction utilisateur)
    this.audioContext = new AudioContext();
    await Tone.start();
    
    this.isInitialized = true;
  }

  async loadInstrument(instrumentName: string): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    if (this.instruments.has(instrumentName)) return;

    const instrument = await Soundfont.instrument(
      this.audioContext,
      instrumentName as any,
      {
        soundfont: 'MusyngKite',
        format: 'mp3',
      }
    );

    this.instruments.set(instrumentName, instrument);
  }

  playNote(
    instrumentName: string,
    pitch: string,
    duration: number,
    time?: number,
    velocity: number = 0.8
  ): void {
    const instrument = this.instruments.get(instrumentName);
    if (!instrument || !this.audioContext) return;

    const startTime = time ?? this.audioContext.currentTime;
    
    instrument.play(pitch, startTime, {
      duration,
      gain: velocity,
    });
  }

  scheduleScore(
    score: MusicScore,
    onNotePlay?: (note: Note) => void
  ): void {
    if (!this.audioContext) return;

    const startTime = this.audioContext.currentTime + 0.1;
    const tempoRatio = 120 / score.tempo; // Normaliser par rapport à 120 BPM

    score.parts.forEach((part) => {
      part.notes.forEach((note) => {
        const noteTime = startTime + note.startTime * tempoRatio;
        const noteDuration = note.duration * tempoRatio;

        // Programmer la note
        this.playNote(
          part.instrument,
          note.pitch,
          noteDuration,
          noteTime,
          note.velocity / 127
        );

        // Callback pour le surlignage
        if (onNotePlay) {
          const timeoutId = window.setTimeout(() => {
            onNotePlay(note);
          }, (noteTime - this.audioContext!.currentTime) * 1000);
          
          this.scheduledEvents.push(timeoutId);
        }
      });
    });
  }

  stop(): void {
    // Annuler tous les événements programmés
    this.scheduledEvents.forEach((id) => clearTimeout(id));
    this.scheduledEvents = [];

    // Arrêter tous les sons
    this.instruments.forEach((instrument) => {
      instrument.stop();
    });
  }

  setVolume(volume: number): void {
    if (this.audioContext) {
      // Volume entre 0 et 1
      Tone.Destination.volume.value = Tone.gainToDb(volume);
    }
  }

  getCurrentTime(): number {
    return this.audioContext?.currentTime ?? 0;
  }

  dispose(): void {
    this.stop();
    this.instruments.clear();
    this.audioContext?.close();
    this.isInitialized = false;
  }
}

export const audioService = new AudioService();
```

## 3. Service OSMD (Rendu de partition)

### `src/services/osmdService.ts`

```typescript
import { OpenSheetMusicDisplay, Cursor } from 'opensheetmusicdisplay';

class OSMDService {
  private osmd: OpenSheetMusicDisplay | null = null;
  private cursor: Cursor | null = null;
  private container: HTMLElement | null = null;

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container;

    this.osmd = new OpenSheetMusicDisplay(container, {
      autoResize: true,
      drawTitle: true,
      drawSubtitle: true,
      drawComposer: true,
      drawCredits: true,
      drawPartNames: true,
      drawMeasureNumbers: true,
      drawTimeSignatures: true,
      drawingParameters: 'default',
    });
  }

  async loadMusicXML(xmlContent: string): Promise<void> {
    if (!this.osmd) {
      throw new Error('OSMD not initialized');
    }

    await this.osmd.load(xmlContent);
    this.osmd.render();
    
    // Initialiser le curseur
    this.cursor = this.osmd.cursor;
    this.cursor.show();
  }

  async loadFromUrl(url: string): Promise<void> {
    if (!this.osmd) {
      throw new Error('OSMD not initialized');
    }

    await this.osmd.load(url);
    this.osmd.render();
    
    this.cursor = this.osmd.cursor;
    this.cursor.show();
  }

  // Navigation du curseur
  cursorNext(): void {
    this.cursor?.next();
  }

  cursorPrevious(): void {
    this.cursor?.previous();
  }

  cursorReset(): void {
    this.cursor?.reset();
  }

  cursorHide(): void {
    this.cursor?.hide();
  }

  cursorShow(): void {
    this.cursor?.show();
  }

  // Obtenir les informations de la note courante
  getCurrentNotes(): any[] {
    if (!this.cursor) return [];
    
    const iterator = this.cursor.iterator;
    if (!iterator.currentVoiceEntries) return [];

    const notes: any[] = [];
    
    iterator.currentVoiceEntries.forEach((voiceEntry) => {
      voiceEntry.notes.forEach((note) => {
        if (!note.isRest()) {
          notes.push({
            pitch: note.pitch?.toString() ?? '',
            duration: note.length.realValue,
            // Autres propriétés...
          });
        }
      });
    });

    return notes;
  }

  // Zoom
  setZoom(zoomLevel: number): void {
    if (this.osmd) {
      this.osmd.zoom = zoomLevel;
      this.osmd.render();
    }
  }

  getZoom(): number {
    return this.osmd?.zoom ?? 1;
  }

  // Obtenir les métadonnées
  getTitle(): string {
    return this.osmd?.sheet?.title?.text ?? 'Sans titre';
  }

  getComposer(): string {
    return this.osmd?.sheet?.composer?.text ?? 'Compositeur inconnu';
  }

  getMeasureCount(): number {
    return this.osmd?.sheet?.sourceMeasures?.length ?? 0;
  }

  // Nettoyage
  dispose(): void {
    this.cursor?.hide();
    this.osmd?.clear();
    this.osmd = null;
    this.cursor = null;
  }
}

export const osmdService = new OSMDService();
```

## 4. Composant Upload

### `src/components/Upload/FileUploader.tsx`

```tsx
import React, { useCallback, useState } from 'react';

interface FileUploaderProps {
  onFileLoad: (content: string, fileName: string) => void;
  acceptedFormats?: string[];
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileLoad,
  acceptedFormats = ['.xml', '.musicxml', '.mxl'],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Vérifier l'extension
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFormats.includes(extension)) {
        setError(`Format non supporté. Formats acceptés: ${acceptedFormats.join(', ')}`);
        return;
      }

      try {
        const content = await file.text();
        onFileLoad(content, file.name);
      } catch (err) {
        setError('Erreur lors de la lecture du fichier');
        console.error(err);
      }
    },
    [acceptedFormats, onFileLoad]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
        `}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Icône */}
          <svg
            className={`w-16 h-16 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>

          <div>
            <p className="text-lg font-medium text-gray-700">
              Glissez votre partition ici
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ou cliquez pour sélectionner un fichier
            </p>
          </div>

          <input
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <p className="text-xs text-gray-400">
            Formats supportés: MusicXML (.xml, .musicxml)
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};
```

## 5. Composant Affichage Partition

### `src/components/SheetMusic/SheetMusicViewer.tsx`

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { osmdService } from '@/services/osmdService';

interface SheetMusicViewerProps {
  musicXml: string | null;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const SheetMusicViewer: React.FC<SheetMusicViewerProps> = ({
  musicXml,
  onLoad,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;

    osmdService.initialize(containerRef.current);

    return () => {
      osmdService.dispose();
    };
  }, []);

  useEffect(() => {
    if (!musicXml) return;

    const loadScore = async () => {
      setIsLoading(true);
      try {
        await osmdService.loadMusicXML(musicXml);
        onLoad?.();
      } catch (error) {
        onError?.(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScore();
  }, [musicXml, onLoad, onError]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.1, 2);
    setZoom(newZoom);
    osmdService.setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.1, 0.5);
    setZoom(newZoom);
    osmdService.setZoom(newZoom);
  };

  return (
    <div className="relative w-full h-full bg-white rounded-lg shadow-sm">
      {/* Contrôles de zoom */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
          title="Zoom arrière"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="px-3 py-2 bg-white rounded-lg shadow text-sm">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
          title="Zoom avant"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Chargement de la partition...</p>
          </div>
        </div>
      )}

      {/* Conteneur OSMD */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-auto p-4"
      />
    </div>
  );
};
```

## 6. Composant Contrôles de lecture

### `src/components/Player/PlayerControls.tsx`

```tsx
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
          className="p-3 rounded-full hover:bg-gray-100 transition-colors"
          title="Stop"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={playbackState === 'playing' ? onPause : onPlay}
          className="p-4 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
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
```

## 7. Hook principal

### `src/hooks/usePlayer.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { audioService } from '@/services/audioService';
import { osmdService } from '@/services/osmdService';
import type { PlaybackState, PlayerState } from '@/types/player';
import type { MusicScore } from '@/types/music';

export function usePlayer(score: MusicScore | null) {
  const [state, setState] = useState<PlayerState>({
    playbackState: 'stopped',
    currentTime: 0,
    currentMeasure: 0,
    tempo: 120,
    volume: 0.8,
    isMetronomeOn: false,
    loop: {
      enabled: false,
      startMeasure: 0,
      endMeasure: 0,
    },
  });

  // Initialiser l'audio au premier clic
  const initAudio = useCallback(async () => {
    await audioService.initialize();
    await audioService.loadInstrument('acoustic_grand_piano');
  }, []);

  const play = useCallback(async () => {
    if (!score) return;

    await initAudio();
    
    setState((prev) => ({ ...prev, playbackState: 'playing' }));
    
    audioService.scheduleScore(score, (note) => {
      setState((prev) => ({
        ...prev,
        currentTime: note.startTime,
        currentMeasure: note.measure,
      }));
      osmdService.cursorNext();
    });
  }, [score, initAudio]);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, playbackState: 'paused' }));
    audioService.stop();
  }, []);

  const stop = useCallback(() => {
    setState((prev) => ({
      ...prev,
      playbackState: 'stopped',
      currentTime: 0,
      currentMeasure: 0,
    }));
    audioService.stop();
    osmdService.cursorReset();
  }, []);

  const seekTo = useCallback((time: number) => {
    setState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const setTempo = useCallback((tempo: number) => {
    setState((prev) => ({ ...prev, tempo }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState((prev) => ({ ...prev, volume }));
    audioService.setVolume(volume);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      audioService.dispose();
    };
  }, []);

  return {
    state,
    play,
    pause,
    stop,
    seekTo,
    setTempo,
    setVolume,
  };
}
```

## Prochaine étape

Consultez le guide [05 - API et intégrations](./05-api-integrations.md) pour les fonctionnalités avancées.

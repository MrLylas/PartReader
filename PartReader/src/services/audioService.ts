import * as Tone from 'tone';
import Soundfont, { type Player } from 'soundfont-player';
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
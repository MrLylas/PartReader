import * as Tone from 'tone';
import type { MusicScore } from '@/types/music';

class AudioService {
  private synth: Tone.PolySynth | null = null;
  private isInitialized = false;
  private scheduledIds: number[] = [];
  private animationFrameId: number | null = null;
  private isPlaying = false;
  private startTimestamp: number = 0;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Initialiser Tone.js (nécessite une interaction utilisateur)
    await Tone.start();
    
    // Créer un synthétiseur polyphonique avec un son de piano
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.4,
        release: 0.8,
      },
    }).toDestination();
    
    // Limiter la polyphonie pour éviter la surcharge
    this.synth.maxPolyphony = 32;
    
    this.isInitialized = true;
  }

  async preloadScore(_score: MusicScore): Promise<void> {
    // Avec Tone.js PolySynth, pas besoin de précharger
    // Le synthétiseur génère les sons en temps réel
    await this.initialize();
  }

  scheduleScore(
    score: MusicScore,
    onTimeUpdate?: (currentTime: number) => void,
    onComplete?: () => void
  ): void {
    if (!this.synth || !this.isInitialized) return;

    this.isPlaying = true;
    this.startTimestamp = Tone.now();
    const tempoRatio = 60 / score.tempo; // Secondes par beat

    // Calculer la durée totale
    let totalDuration = 0;

    // Programmer toutes les notes avec Tone.js
    score.parts.forEach((part) => {
      part.notes.forEach((note) => {
        const noteTime = note.startTime * tempoRatio;
        const noteDuration = Math.max(0.1, note.duration * tempoRatio);
        const velocity = note.velocity / 127;

        // Programmer la note avec Tone.js (très précis)
        this.synth!.triggerAttackRelease(
          note.pitch,
          noteDuration,
          Tone.now() + noteTime + 0.1,
          velocity
        );

        const noteEndTime = note.startTime + note.duration;
        if (noteEndTime > totalDuration) {
          totalDuration = noteEndTime;
        }
      });
    });

    const totalDurationSeconds = totalDuration * tempoRatio;

    // Utiliser requestAnimationFrame pour les mises à jour visuelles
    if (onTimeUpdate) {
      const updateLoop = () => {
        if (!this.isPlaying) return;

        const elapsed = Tone.now() - this.startTimestamp - 0.1;
        const currentTime = Math.max(0, elapsed / tempoRatio);
        onTimeUpdate(currentTime);

        if (elapsed < totalDurationSeconds) {
          this.animationFrameId = requestAnimationFrame(updateLoop);
        } else {
          this.isPlaying = false;
          onComplete?.();
        }
      };
      this.animationFrameId = requestAnimationFrame(updateLoop);
    }

    // Programmer la fin de lecture
    const endTimeoutId = window.setTimeout(() => {
      this.isPlaying = false;
      onComplete?.();
    }, totalDurationSeconds * 1000 + 500);
    this.scheduledIds.push(endTimeoutId);
  }

  stop(): void {
    this.isPlaying = false;

    // Annuler l'animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Annuler tous les timeouts
    this.scheduledIds.forEach((id) => clearTimeout(id));
    this.scheduledIds = [];

    // Arrêter tous les sons du synthétiseur
    if (this.synth) {
      this.synth.releaseAll();
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  setVolume(volume: number): void {
    // Volume entre 0 et 1
    Tone.Destination.volume.value = Tone.gainToDb(Math.max(0.01, volume));
  }

  getCurrentTime(): number {
    return Tone.now();
  }

  dispose(): void {
    this.stop();
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
    this.isInitialized = false;
  }
}

export const audioService = new AudioService();

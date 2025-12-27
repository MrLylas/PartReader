import { useState, useCallback, useEffect, useRef } from 'react';
import { audioService } from '@/services/audioService';
import { osmdService } from '@/services/osmdService';
import type { PlayerState } from '@/types/player';
import type { MusicScore } from '@/types/music';

export function useAudioPlayer(score: MusicScore | null) {
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

  // Ref pour éviter les re-renders excessifs
  const lastMeasureRef = useRef(0);
  const [isPreloading, setIsPreloading] = useState(false);

  // Ref pour savoir si on a déjà préchargé cette partition
  const preloadedScoreRef = useRef<MusicScore | null>(null);

  // Initialiser et précharger l'audio (appelé après interaction utilisateur)
  const initAndPreload = useCallback(async () => {
    if (!score) return;
    
    // Si déjà préchargé pour cette partition, ne pas refaire
    if (preloadedScoreRef.current === score) return;

    setIsPreloading(true);
    try {
      await audioService.initialize();
      await audioService.preloadScore(score);
      preloadedScoreRef.current = score;
    } catch (error) {
      console.error('Erreur préchargement audio:', error);
    } finally {
      setIsPreloading(false);
    }
  }, [score]);

  const play = useCallback(async () => {
    if (!score || isPreloading) return;

    // Précharger si pas encore fait (premier clic)
    if (preloadedScoreRef.current !== score) {
      await initAndPreload();
      // Après le préchargement, attendre un peu pour que tout soit prêt
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setState((prev) => ({ ...prev, playbackState: 'playing' }));
    osmdService.cursorReset();
    lastMeasureRef.current = 0;
    
    audioService.scheduleScore(
      score,
      // onTimeUpdate - appelé à chaque frame pour mise à jour fluide
      (currentTime) => {
        // Calculer la mesure actuelle basée sur le temps
        const currentMeasure = Math.floor(currentTime / 4) + 1; // Approximation: 4 beats par mesure
        
        // Mettre à jour le state seulement si nécessaire (throttle)
        setState((prev) => {
          if (Math.abs(prev.currentTime - currentTime) < 0.1) return prev;
          return {
            ...prev,
            currentTime,
            currentMeasure,
          };
        });

        // Avancer le curseur seulement quand on change de mesure
        if (currentMeasure > lastMeasureRef.current) {
          osmdService.cursorNext();
          lastMeasureRef.current = currentMeasure;
        }
      },
      // onComplete - appelé à la fin de la lecture
      () => {
        setState((prev) => ({
          ...prev,
          playbackState: 'stopped',
          currentTime: 0,
          currentMeasure: 0,
        }));
        osmdService.cursorReset();
      }
    );
  }, [score, initAndPreload, isPreloading]);

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
    isPreloading,
    play,
    pause,
    stop,
    seekTo,
    setTempo,
    setVolume,
  };
}
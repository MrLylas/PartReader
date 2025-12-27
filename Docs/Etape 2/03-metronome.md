# Étape 2.3 - Implémentation du Métronome

## Objectif
Ajouter un métronome synchronisé avec la lecture de la partition.

## Tâches

### 1. Créer le service métronome

```typescript
// src/services/metronomeService.ts
import * as Tone from 'tone';

class MetronomeService {
  private synth: Tone.MembraneSynth | null = null;
  private loop: Tone.Loop | null = null;
  private isPlaying = false;
  private beatsPerMeasure = 4;

  initialize(): void {
    if (this.synth) return;

    this.synth = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0,
        release: 0.1,
      },
    }).toDestination();
  }

  start(bpm: number, beatsPerMeasure: number = 4): void {
    if (this.isPlaying) this.stop();

    this.initialize();
    this.beatsPerMeasure = beatsPerMeasure;
    Tone.Transport.bpm.value = bpm;

    let beat = 0;
    this.loop = new Tone.Loop((time) => {
      // Premier temps plus aigu (accent)
      const pitch = beat === 0 ? 'C5' : 'C4';
      const velocity = beat === 0 ? 0.8 : 0.5;
      this.synth?.triggerAttackRelease(pitch, '16n', time, velocity);
      beat = (beat + 1) % this.beatsPerMeasure;
    }, '4n');

    this.loop.start(0);
    Tone.Transport.start();
    this.isPlaying = true;
  }

  stop(): void {
    this.loop?.stop();
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    this.isPlaying = false;
  }

  setTempo(bpm: number): void {
    Tone.Transport.bpm.value = bpm;
  }

  setTimeSignature(beatsPerMeasure: number): void {
    this.beatsPerMeasure = beatsPerMeasure;
  }

  setVolume(volume: number): void {
    if (this.synth) {
      // Volume entre 0 et 1
      this.synth.volume.value = Tone.gainToDb(Math.max(0.01, volume));
    }
  }

  isActive(): boolean {
    return this.isPlaying;
  }

  dispose(): void {
    this.stop();
    this.synth?.dispose();
    this.loop?.dispose();
    this.synth = null;
    this.loop = null;
  }
}

export const metronomeService = new MetronomeService();
```

### 2. Intégrer dans useAudioPlayer

```typescript
// Ajouter dans useAudioPlayer.tsx
import { metronomeService } from '@/services/metronomeService';

// Dans le hook useAudioPlayer
const toggleMetronome = useCallback(() => {
  setState((prev) => {
    const newMetronomeState = !prev.isMetronomeOn;
    
    if (newMetronomeState) {
      metronomeService.start(prev.tempo);
    } else {
      metronomeService.stop();
    }
    
    return { ...prev, isMetronomeOn: newMetronomeState };
  });
}, []);

// Synchroniser le tempo du métronome quand il change
useEffect(() => {
  if (state.isMetronomeOn) {
    metronomeService.setTempo(state.tempo);
  }
}, [state.tempo, state.isMetronomeOn]);

// Arrêter le métronome quand la lecture s'arrête
useEffect(() => {
  if (state.playbackState === 'stopped' && state.isMetronomeOn) {
    metronomeService.stop();
  }
}, [state.playbackState, state.isMetronomeOn]);

// Cleanup
useEffect(() => {
  return () => {
    metronomeService.dispose();
  };
}, []);

// Retourner toggleMetronome dans le hook
return {
  state,
  play,
  pause,
  stop,
  seekTo,
  setTempo,
  setVolume,
  toggleMetronome, // Ajouter cette ligne
};
```

### 3. Ajouter le bouton dans PlayerControls

```tsx
// Ajouter dans les props de PlayerControls
interface PlayerControlsProps {
  // ... props existantes
  isMetronomeOn: boolean;
  onToggleMetronome: () => void;
}

// Dans le composant, ajouter le bouton
<button
  onClick={onToggleMetronome}
  className={`p-3 rounded-full transition-colors ${
    isMetronomeOn 
      ? 'bg-primary-500 text-white' 
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  }`}
  title={isMetronomeOn ? 'Désactiver le métronome' : 'Activer le métronome'}
>
  {/* Icône métronome */}
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
  </svg>
</button>
```

### 4. Icône métronome personnalisée (optionnel)

```tsx
// src/components/common/MetronomeIcon.tsx
export const MetronomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2}
      d="M12 3L8 21h8L12 3z"
    />
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2}
      d="M12 8l4-2"
    />
    <circle cx="12" cy="16" r="2" fill="currentColor" />
  </svg>
);
```

## Améliorations possibles

### Son de métronome personnalisable
```typescript
type MetronomeSound = 'click' | 'woodblock' | 'beep';

setSoundType(type: MetronomeSound): void {
  // Changer le type de synthétiseur selon le son choisi
}
```

### Subdivision des temps
```typescript
// Pour jouer des croches ou des triolets
setSubdivision(subdivision: 1 | 2 | 3 | 4): void {
  // 1 = noire, 2 = croches, 3 = triolets, 4 = doubles croches
}
```

### Compte à rebours avant lecture
```typescript
async countIn(measures: number = 1): Promise<void> {
  // Jouer X mesures de métronome avant de lancer la partition
}
```

## Critères de validation
- [ ] Le métronome se lance/arrête avec le bouton
- [ ] Le tempo du métronome suit le slider de tempo
- [ ] Le premier temps de chaque mesure est accentué
- [ ] Le métronome s'arrête quand on arrête la lecture
- [ ] Le volume du métronome est ajustable
- [ ] Pas de décalage audible après plusieurs mesures

## Problèmes connus et solutions

### Latence audio
Si le métronome a du retard, ajuster le `lookAhead` de Tone.js :
```typescript
Tone.context.lookAhead = 0.1; // Réduire pour moins de latence
```

### Synchronisation avec la partition
Le métronome doit démarrer en même temps que la lecture audio. Utiliser le même `Transport` pour les deux.

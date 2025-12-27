# Étape 2.4 - Fonction de Boucle (Loop)

## Objectif
Permettre à l'utilisateur de répéter une section de la partition en boucle pour s'entraîner.

## Tâches

### 1. Interface utilisateur pour sélectionner la boucle

```tsx
// src/components/Player/LoopSelector.tsx
import React from 'react';

interface LoopSelectorProps {
  totalMeasures: number;
  loop: { 
    enabled: boolean; 
    startMeasure: number; 
    endMeasure: number; 
  };
  onLoopChange: (start: number, end: number) => void;
  onToggleLoop: () => void;
}

export const LoopSelector: React.FC<LoopSelectorProps> = ({
  totalMeasures,
  loop,
  onLoopChange,
  onToggleLoop,
}) => {
  const handleStartChange = (value: number) => {
    const newStart = Math.max(1, Math.min(value, loop.endMeasure));
    onLoopChange(newStart, loop.endMeasure);
  };

  const handleEndChange = (value: number) => {
    const newEnd = Math.max(loop.startMeasure, Math.min(value, totalMeasures));
    onLoopChange(loop.startMeasure, newEnd);
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      {/* Bouton toggle */}
      <button
        onClick={onToggleLoop}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          loop.enabled 
            ? 'bg-primary-500 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
        Boucle
      </button>

      {/* Sélecteurs de mesures */}
      {loop.enabled && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Mesures :</span>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={loop.endMeasure}
              value={loop.startMeasure}
              onChange={(e) => handleStartChange(Number(e.target.value))}
              className="w-16 px-3 py-1.5 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <span className="text-gray-500">→</span>
            <input
              type="number"
              min={loop.startMeasure}
              max={totalMeasures}
              value={loop.endMeasure}
              onChange={(e) => handleEndChange(Number(e.target.value))}
              className="w-16 px-3 py-1.5 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <span className="text-xs text-gray-400">
            / {totalMeasures} mesures
          </span>
        </div>
      )}
    </div>
  );
};
```

### 2. Logique de boucle dans useAudioPlayer

```typescript
// Ajouter dans useAudioPlayer.tsx

const setLoop = useCallback((startMeasure: number, endMeasure: number) => {
  setState((prev) => ({
    ...prev,
    loop: {
      ...prev.loop,
      startMeasure,
      endMeasure,
    },
  }));
}, []);

const toggleLoop = useCallback(() => {
  setState((prev) => ({
    ...prev,
    loop: {
      ...prev.loop,
      enabled: !prev.loop.enabled,
    },
  }));
}, []);

// Modifier la fonction play pour gérer la boucle
const play = useCallback(async () => {
  if (!score) return;

  await initAudio();
  setState((prev) => ({ ...prev, playbackState: 'playing' }));

  const notesToPlay = state.loop.enabled
    ? filterNotesByMeasures(score, state.loop.startMeasure, state.loop.endMeasure)
    : score;

  audioService.scheduleScore(notesToPlay, (note) => {
    setState((prev) => ({
      ...prev,
      currentTime: note.startTime,
      currentMeasure: note.measure,
    }));
    osmdService.cursorNext();
  });
}, [score, initAudio, state.loop]);

// Fonction utilitaire pour filtrer les notes
function filterNotesByMeasures(
  score: MusicScore, 
  startMeasure: number, 
  endMeasure: number
): MusicScore {
  return {
    ...score,
    parts: score.parts.map((part) => ({
      ...part,
      notes: part.notes.filter(
        (note) => note.measure >= startMeasure && note.measure <= endMeasure
      ),
    })),
  };
}
```

### 3. Gestion de la répétition automatique

```typescript
// Dans audioService.ts, ajouter un callback de fin
scheduleScoreWithLoop(
  score: MusicScore,
  onNotePlay?: (note: Note) => void,
  onLoopEnd?: () => void
): void {
  // ... code existant ...

  // Calculer la durée totale
  const totalDuration = this.calculateDuration(score);
  
  // Programmer le callback de fin
  if (onLoopEnd) {
    const loopEndTimeout = window.setTimeout(() => {
      onLoopEnd();
    }, totalDuration * 1000);
    
    this.scheduledEvents.push(loopEndTimeout);
  }
}

// Dans useAudioPlayer, relancer la lecture à la fin de la boucle
const handleLoopEnd = useCallback(() => {
  if (state.loop.enabled && state.playbackState === 'playing') {
    // Remettre le curseur au début de la boucle
    osmdService.cursorReset();
    // TODO: Positionner le curseur à la mesure de début
    
    // Relancer la lecture
    play();
  }
}, [state.loop.enabled, state.playbackState, play]);
```

### 4. Surlignage visuel de la zone de boucle

```typescript
// Dans osmdService.ts, ajouter une méthode pour surligner les mesures
highlightMeasures(startMeasure: number, endMeasure: number, color: string = '#e0f2fe'): void {
  if (!this.osmd) return;

  // Réinitialiser les couleurs
  this.clearHighlights();

  // Parcourir les mesures et appliquer la couleur
  const measures = this.osmd.GraphicSheet.MeasureList;
  
  for (let i = startMeasure - 1; i < endMeasure && i < measures.length; i++) {
    measures[i].forEach((staffMeasure) => {
      if (staffMeasure) {
        // Appliquer un style de fond
        const element = staffMeasure.PositionAndShape?.BoundingRectangle;
        // Note: OSMD n'a pas de méthode native pour le surlignage
        // Il faudra peut-être utiliser un overlay SVG
      }
    });
  }
}

clearHighlights(): void {
  // Réinitialiser tous les surlignages
}
```

### 5. Alternative : Overlay SVG pour le surlignage

```tsx
// src/components/SheetMusic/LoopOverlay.tsx
import React from 'react';

interface LoopOverlayProps {
  startX: number;
  endX: number;
  height: number;
  visible: boolean;
}

export const LoopOverlay: React.FC<LoopOverlayProps> = ({
  startX,
  endX,
  height,
  visible,
}) => {
  if (!visible) return null;

  return (
    <div
      className="absolute top-0 pointer-events-none"
      style={{
        left: startX,
        width: endX - startX,
        height,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderLeft: '2px solid rgb(59, 130, 246)',
        borderRight: '2px solid rgb(59, 130, 246)',
      }}
    />
  );
};
```

## Intégration dans l'interface

```tsx
// Dans App.tsx ou le composant parent
<LoopSelector
  totalMeasures={score?.measures.length ?? 0}
  loop={state.loop}
  onLoopChange={setLoop}
  onToggleLoop={toggleLoop}
/>
```

## Fonctionnalités avancées (optionnel)

### Sélection par clic sur la partition
```typescript
// Permettre à l'utilisateur de cliquer sur une mesure pour définir le début/fin
osmd.cursor.CursorOptions = {
  // ...
  follow: false,
};

// Ajouter un event listener sur le conteneur
container.addEventListener('click', (e) => {
  const measure = getMeasureAtPosition(e.clientX, e.clientY);
  if (measure) {
    // Définir comme début ou fin selon le contexte
  }
});
```

### Raccourcis clavier
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'l' || e.key === 'L') {
      toggleLoop();
    }
    if (e.key === '[') {
      setLoop(state.currentMeasure, state.loop.endMeasure);
    }
    if (e.key === ']') {
      setLoop(state.loop.startMeasure, state.currentMeasure);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [toggleLoop, setLoop, state.currentMeasure, state.loop]);
```

## Critères de validation
- [ ] L'utilisateur peut activer/désactiver la boucle
- [ ] La sélection des mesures de début/fin fonctionne
- [ ] La lecture boucle correctement sans interruption
- [ ] La zone de boucle est visible sur la partition
- [ ] Le curseur revient au début de la boucle automatiquement
- [ ] Les raccourcis clavier fonctionnent (si implémentés)

## Cas limites à gérer
- Boucle sur une seule mesure
- Changement de boucle pendant la lecture
- Mesures avec des signatures rythmiques différentes
- Fin de boucle au milieu d'une note tenue

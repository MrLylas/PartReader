# 02 - Architecture technique

## Stack technologique détaillée

### Frontend Framework : React 18 + TypeScript

**Pourquoi React ?**
- Écosystème riche et mature
- Composants réutilisables
- Gestion d'état efficace avec hooks
- Large communauté

**Pourquoi TypeScript ?**
- Typage statique pour éviter les erreurs
- Meilleure autocomplétion IDE
- Documentation intégrée au code
- Refactoring sécurisé

### Rendu de partitions : OpenSheetMusicDisplay (OSMD)

OSMD est une bibliothèque JavaScript open-source pour le rendu de partitions MusicXML.

**Caractéristiques** :
- Basé sur VexFlow pour le rendu graphique
- Support complet de MusicXML
- Rendu SVG haute qualité
- API de curseur pour le suivi de lecture
- Personnalisation du style

**Installation** :
```bash
npm install opensheetmusicdisplay
```

**Utilisation basique** :
```typescript
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

const osmd = new OpenSheetMusicDisplay(containerElement, {
  autoResize: true,
  drawTitle: true,
});

await osmd.load(musicXmlString);
osmd.render();
```

### Audio : Tone.js + Soundfont-player

#### Tone.js
Framework audio de haut niveau basé sur Web Audio API.

**Caractéristiques** :
- Scheduling précis des événements
- Synthétiseurs intégrés
- Effets audio
- Transport global (play, pause, tempo)

**Installation** :
```bash
npm install tone
```

#### Soundfont-player
Lecture de fichiers SoundFont pour des sons d'instruments réalistes.

**Installation** :
```bash
npm install soundfont-player
```

**Utilisation** :
```typescript
import Soundfont from 'soundfont-player';

const audioContext = new AudioContext();
const piano = await Soundfont.instrument(audioContext, 'acoustic_grand_piano');
piano.play('C4', audioContext.currentTime, { duration: 1 });
```

### Styling : TailwindCSS

Framework CSS utility-first pour un développement rapide.

**Installation** :
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Build : Vite

Bundler moderne ultra-rapide.

**Avantages** :
- Démarrage instantané en dev
- Hot Module Replacement (HMR)
- Build optimisé pour la production
- Support natif TypeScript

## Structure des composants

```
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Slider.tsx
│   │   ├── Modal.tsx
│   │   └── Icon.tsx
│   │
│   ├── SheetMusic/
│   │   ├── SheetMusicViewer.tsx    # Conteneur principal
│   │   ├── SheetMusicCanvas.tsx    # Canvas OSMD
│   │   ├── Cursor.tsx              # Curseur de lecture
│   │   └── ZoomControls.tsx        # Contrôles de zoom
│   │
│   ├── Player/
│   │   ├── PlayerControls.tsx      # Boutons play/pause/stop
│   │   ├── TempoControl.tsx        # Contrôle du tempo
│   │   ├── VolumeControl.tsx       # Contrôle du volume
│   │   ├── ProgressBar.tsx         # Barre de progression
│   │   └── Metronome.tsx           # Métronome
│   │
│   └── Upload/
│       ├── FileUploader.tsx        # Zone de drop
│       ├── FileList.tsx            # Liste des fichiers
│       └── FormatSelector.tsx      # Sélection du format
│
├── hooks/
│   ├── useAudioPlayer.ts           # Logique de lecture audio
│   ├── useSheetMusic.ts            # Gestion de la partition
│   ├── useCursor.ts                # Synchronisation curseur
│   └── useFileUpload.ts            # Gestion upload
│
├── services/
│   ├── audioService.ts             # Service audio Tone.js
│   ├── parserService.ts            # Parsing MusicXML/MIDI
│   ├── osmdService.ts              # Wrapper OSMD
│   └── storageService.ts           # Stockage local
│
├── types/
│   ├── music.ts                    # Types musicaux
│   ├── player.ts                   # Types lecteur
│   └── file.ts                     # Types fichiers
│
└── utils/
    ├── midiUtils.ts                # Utilitaires MIDI
    ├── noteUtils.ts                # Conversion notes
    └── timeUtils.ts                # Gestion du temps
```

## Gestion d'état

### Option 1 : React Context + useReducer (Recommandé pour débuter)

```typescript
// src/context/PlayerContext.tsx
interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  tempo: number;
  volume: number;
  currentMeasure: number;
}

type PlayerAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'SET_TEMPO'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_TIME'; payload: number };

const PlayerContext = createContext<{
  state: PlayerState;
  dispatch: Dispatch<PlayerAction>;
} | null>(null);
```

### Option 2 : Zustand (Pour projets plus complexes)

```typescript
// src/store/playerStore.ts
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
```

## Diagramme de séquence : Lecture d'une partition

```
┌──────┐     ┌────────┐     ┌──────┐     ┌───────┐     ┌───────┐
│ User │     │ Upload │     │Parser│     │ OSMD  │     │ Audio │
└──┬───┘     └───┬────┘     └──┬───┘     └───┬───┘     └───┬───┘
   │             │             │             │             │
   │ Drop file   │             │             │             │
   │────────────>│             │             │             │
   │             │ Parse XML   │             │             │
   │             │────────────>│             │             │
   │             │             │             │             │
   │             │  MusicData  │             │             │
   │             │<────────────│             │             │
   │             │             │             │             │
   │             │      Load & Render        │             │
   │             │──────────────────────────>│             │
   │             │             │             │             │
   │             │      Partition affichée   │             │
   │<────────────────────────────────────────│             │
   │             │             │             │             │
   │ Click Play  │             │             │             │
   │────────────────────────────────────────────────────-->│
   │             │             │             │             │
   │             │             │             │  Schedule   │
   │             │             │             │    notes    │
   │             │             │             │<────────────│
   │             │             │             │             │
   │             │             │   Update    │             │
   │             │             │   cursor    │             │
   │             │             │<────────────────────────────
   │             │             │             │             │
```

## Considérations de performance

### Lazy Loading
- Charger OSMD uniquement quand nécessaire
- Utiliser `React.lazy()` pour les composants lourds

### Memoization
- `useMemo` pour les calculs coûteux
- `React.memo` pour éviter les re-renders inutiles

### Web Workers
- Parser les gros fichiers MusicXML dans un Worker
- Éviter de bloquer le thread principal

### Audio Buffering
- Précharger les samples audio
- Utiliser des buffers pour la lecture fluide

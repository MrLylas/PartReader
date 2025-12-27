# Étape 2.1 - Assemblage de l'Application

## Objectif
Intégrer tous les composants créés dans l'Étape 1 pour avoir une application fonctionnelle.

## Tâches

### 1. Refactoriser `App.tsx`
Remplacer le template Vite par défaut par l'architecture de l'application.

```tsx
import { useState } from 'react';
import { FileUploader } from '@/components/Upload/FileUploader';
import { SheetMusicViewer } from '@/components/SheetMusic/SheetMusicViewer';
import { PlayerControls } from '@/components/Player/PlayerControls';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { MusicScore } from '@/types/music';

function App() {
  const [musicXml, setMusicXml] = useState<string | null>(null);
  const [score, setScore] = useState<MusicScore | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const { state, play, pause, stop, seekTo, setTempo, setVolume } = useAudioPlayer(score);

  const handleFileLoad = (content: string, name: string) => {
    setMusicXml(content);
    setFileName(name);
    // TODO: Parser le MusicXML en MusicScore
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-2xl font-bold text-gray-800">PartReader</h1>
        {fileName && <p className="text-gray-600">{fileName}</p>}
      </header>

      <main className="container mx-auto p-6 space-y-6">
        {!musicXml ? (
          <FileUploader onFileLoad={handleFileLoad} />
        ) : (
          <>
            <SheetMusicViewer musicXml={musicXml} />
            <PlayerControls
              playbackState={state.playbackState}
              currentTime={state.currentTime}
              totalDuration={score?.totalDuration ?? 0}
              tempo={state.tempo}
              volume={state.volume}
              onPlay={play}
              onPause={pause}
              onStop={stop}
              onSeek={seekTo}
              onTempoChange={setTempo}
              onVolumeChange={setVolume}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
```

### 2. Layout responsive
- Zone partition : 60-70% de l'écran
- Contrôles : Barre fixe en bas
- Mobile : Stack vertical

### 3. Ajouter un bouton pour charger une nouvelle partition

```tsx
{musicXml && (
  <button
    onClick={() => {
      setMusicXml(null);
      setScore(null);
      setFileName('');
    }}
    className="text-sm text-gray-500 hover:text-gray-700"
  >
    ← Charger une autre partition
  </button>
)}
```

## Critères de validation
- [ ] L'application affiche le FileUploader au démarrage
- [ ] Après upload, la partition s'affiche
- [ ] Les contrôles du player sont visibles
- [ ] Le layout est responsive
- [ ] On peut revenir à l'écran d'upload

# 05 - API et intégrations

Ce guide couvre les intégrations avancées et les API utilisées dans PartReader.

## 1. Web Audio API

### Concepts fondamentaux

La Web Audio API est l'API native du navigateur pour le traitement audio.

```typescript
// Création du contexte audio
const audioContext = new AudioContext();

// États possibles
// - 'suspended' : En pause (avant interaction utilisateur)
// - 'running' : En cours d'exécution
// - 'closed' : Fermé

// Reprendre le contexte après interaction utilisateur
document.addEventListener('click', async () => {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
});
```

### Graphe audio

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Source    │────>│   Effects   │────>│ Destination │
│ (Oscillator,│     │ (Gain, etc) │     │  (Speakers) │
│  Buffer)    │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Exemple : Jouer un son simple

```typescript
async function playTone(frequency: number, duration: number) {
  const ctx = new AudioContext();
  
  // Créer un oscillateur
  const oscillator = ctx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  
  // Créer un gain pour le volume
  const gainNode = ctx.createGain();
  gainNode.gain.value = 0.5;
  
  // Connecter le graphe
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  // Jouer
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

// Jouer un La 440Hz pendant 1 seconde
playTone(440, 1);
```

## 2. OpenSheetMusicDisplay (OSMD) - API détaillée

### Options de configuration

```typescript
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';

const options: IOSMDOptions = {
  // Redimensionnement automatique
  autoResize: true,
  
  // Éléments à afficher
  drawTitle: true,
  drawSubtitle: true,
  drawComposer: true,
  drawLyricist: true,
  drawCredits: true,
  drawPartNames: true,
  drawPartAbbreviations: true,
  drawMeasureNumbers: true,
  drawMeasureNumbersOnlyAtSystemStart: false,
  drawTimeSignatures: true,
  drawMetronomeMarks: true,
  
  // Style de rendu
  drawingParameters: 'default', // 'default', 'compact', 'preview'
  
  // Backend de rendu
  backend: 'svg', // 'svg' ou 'canvas'
  
  // Curseur
  followCursor: true,
  
  // Callback de rendu
  onXMLRead: (xml) => console.log('XML loaded'),
};

const osmd = new OpenSheetMusicDisplay(container, options);
```

### Manipulation du curseur

```typescript
// Accéder au curseur
const cursor = osmd.cursor;

// Afficher/masquer
cursor.show();
cursor.hide();

// Navigation
cursor.next();      // Note suivante
cursor.previous();  // Note précédente (si supporté)
cursor.reset();     // Retour au début

// Position actuelle
const iterator = cursor.iterator;
const currentMeasure = iterator.currentMeasureIndex;
const currentVoiceEntries = iterator.currentVoiceEntries;

// Vérifier si on est à la fin
const isAtEnd = iterator.endReached;
```

### Accéder aux données de la partition

```typescript
// Après chargement
await osmd.load(musicXml);
osmd.render();

// Métadonnées
const title = osmd.sheet.title?.text;
const composer = osmd.sheet.composer?.text;

// Mesures
const measures = osmd.sheet.sourceMeasures;
const measureCount = measures.length;

// Première mesure
const firstMeasure = measures[0];
const timeSignature = firstMeasure.activeTimeSignature;
const tempo = firstMeasure.tempoInBPM;

// Parcourir les notes
measures.forEach((measure, measureIndex) => {
  measure.verticalSourceStaffEntryContainers.forEach((container) => {
    container.staffEntries.forEach((staffEntry) => {
      staffEntry.voiceEntries.forEach((voiceEntry) => {
        voiceEntry.notes.forEach((note) => {
          if (!note.isRest()) {
            console.log(`Measure ${measureIndex}: ${note.pitch}`);
          }
        });
      });
    });
  });
});
```

### Personnalisation du style

```typescript
// Couleur du curseur
osmd.cursor.cursorElement.style.backgroundColor = 'rgba(59, 130, 246, 0.5)';

// Règles de rendu
osmd.EngravingRules.TitleTopDistance = 5;
osmd.EngravingRules.SheetTitleHeight = 4;
osmd.EngravingRules.CompactMode = true;

// Appliquer les changements
osmd.render();
```

## 3. Tone.js - API détaillée

### Transport (Horloge globale)

```typescript
import * as Tone from 'tone';

// Démarrer le transport
await Tone.start(); // Nécessite une interaction utilisateur
Tone.Transport.start();

// Contrôles
Tone.Transport.pause();
Tone.Transport.stop();

// Tempo
Tone.Transport.bpm.value = 120;

// Position
Tone.Transport.position = '0:0:0'; // bars:beats:sixteenths
Tone.Transport.seconds = 0;

// Programmer des événements
Tone.Transport.schedule((time) => {
  console.log('Event at', time);
}, '1:0:0'); // À la mesure 1

// Boucle
Tone.Transport.loop = true;
Tone.Transport.loopStart = '0:0:0';
Tone.Transport.loopEnd = '4:0:0';
```

### Synthétiseurs

```typescript
// Synthétiseur simple
const synth = new Tone.Synth().toDestination();
synth.triggerAttackRelease('C4', '8n');

// Polyphonique
const polySynth = new Tone.PolySynth(Tone.Synth).toDestination();
polySynth.triggerAttackRelease(['C4', 'E4', 'G4'], '4n');

// Sampler (avec samples audio)
const sampler = new Tone.Sampler({
  urls: {
    C4: 'C4.mp3',
    'D#4': 'Ds4.mp3',
    'F#4': 'Fs4.mp3',
    A4: 'A4.mp3',
  },
  baseUrl: '/samples/piano/',
  onload: () => {
    sampler.triggerAttackRelease('C4', '2n');
  },
}).toDestination();
```

### Programmer des notes

```typescript
// Part : séquence de notes
const part = new Tone.Part(
  (time, note) => {
    synth.triggerAttackRelease(note.pitch, note.duration, time);
  },
  [
    { time: '0:0:0', pitch: 'C4', duration: '4n' },
    { time: '0:1:0', pitch: 'E4', duration: '4n' },
    { time: '0:2:0', pitch: 'G4', duration: '4n' },
    { time: '0:3:0', pitch: 'B4', duration: '4n' },
  ]
);

part.start(0);
Tone.Transport.start();

// Arrêter
part.stop();
part.dispose();
```

### Effets

```typescript
// Reverb
const reverb = new Tone.Reverb({
  decay: 2,
  wet: 0.5,
}).toDestination();

// Delay
const delay = new Tone.FeedbackDelay('8n', 0.5).toDestination();

// Chaîner les effets
synth.chain(reverb, delay, Tone.Destination);
```

## 4. Soundfont-player

### Chargement d'instruments

```typescript
import Soundfont from 'soundfont-player';

const audioContext = new AudioContext();

// Charger un instrument
const piano = await Soundfont.instrument(audioContext, 'acoustic_grand_piano');

// Options de chargement
const violin = await Soundfont.instrument(audioContext, 'violin', {
  soundfont: 'MusyngKite', // ou 'FluidR3_GM'
  format: 'mp3',           // ou 'ogg'
  destination: audioContext.destination,
});
```

### Liste des instruments disponibles

```typescript
const instruments = [
  'acoustic_grand_piano',
  'bright_acoustic_piano',
  'electric_grand_piano',
  'honky_tonk_piano',
  'electric_piano_1',
  'electric_piano_2',
  'harpsichord',
  'clavinet',
  'celesta',
  'glockenspiel',
  'music_box',
  'vibraphone',
  'marimba',
  'xylophone',
  'tubular_bells',
  'dulcimer',
  'drawbar_organ',
  'percussive_organ',
  'rock_organ',
  'church_organ',
  'reed_organ',
  'accordion',
  'harmonica',
  'tango_accordion',
  'acoustic_guitar_nylon',
  'acoustic_guitar_steel',
  'electric_guitar_jazz',
  'electric_guitar_clean',
  'electric_guitar_muted',
  'overdriven_guitar',
  'distortion_guitar',
  'guitar_harmonics',
  'acoustic_bass',
  'electric_bass_finger',
  'electric_bass_pick',
  'fretless_bass',
  'slap_bass_1',
  'slap_bass_2',
  'synth_bass_1',
  'synth_bass_2',
  'violin',
  'viola',
  'cello',
  'contrabass',
  'tremolo_strings',
  'pizzicato_strings',
  'orchestral_harp',
  'timpani',
  'string_ensemble_1',
  'string_ensemble_2',
  'synth_strings_1',
  'synth_strings_2',
  'choir_aahs',
  'voice_oohs',
  'synth_choir',
  'orchestra_hit',
  'trumpet',
  'trombone',
  'tuba',
  'muted_trumpet',
  'french_horn',
  'brass_section',
  'synth_brass_1',
  'synth_brass_2',
  'soprano_sax',
  'alto_sax',
  'tenor_sax',
  'baritone_sax',
  'oboe',
  'english_horn',
  'bassoon',
  'clarinet',
  'piccolo',
  'flute',
  'recorder',
  'pan_flute',
  'blown_bottle',
  'shakuhachi',
  'whistle',
  'ocarina',
];
```

### Jouer des notes

```typescript
// Note simple
piano.play('C4');

// Avec options
piano.play('C4', audioContext.currentTime, {
  duration: 1,      // Durée en secondes
  gain: 0.8,        // Volume (0-1)
  attack: 0.01,     // Temps d'attaque
  decay: 0.1,       // Temps de decay
  sustain: 0.9,     // Niveau de sustain
  release: 0.3,     // Temps de release
});

// Programmer dans le futur
piano.play('C4', audioContext.currentTime + 1); // Dans 1 seconde

// Jouer un accord
['C4', 'E4', 'G4'].forEach((note) => {
  piano.play(note, audioContext.currentTime, { duration: 2 });
});

// Arrêter toutes les notes
piano.stop();
```

## 5. Parsing MusicXML

### Structure d'un fichier MusicXML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" 
  "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Ma Partition</work-title>
  </work>
  <identification>
    <creator type="composer">Compositeur</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>
```

### Parser personnalisé

```typescript
// src/services/parserService.ts

import type { MusicScore, Note, Measure, Part } from '@/types/music';

export function parseMusicXML(xmlString: string): MusicScore {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  
  // Vérifier les erreurs de parsing
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid MusicXML: ' + parseError.textContent);
  }
  
  // Extraire les métadonnées
  const title = doc.querySelector('work-title')?.textContent ?? 'Sans titre';
  const composer = doc.querySelector('creator[type="composer"]')?.textContent;
  
  // Extraire les parties
  const parts: Part[] = [];
  const partElements = doc.querySelectorAll('part');
  
  partElements.forEach((partElement) => {
    const partId = partElement.getAttribute('id') ?? '';
    const partName = doc.querySelector(`score-part[id="${partId}"] part-name`)?.textContent ?? 'Unknown';
    
    const notes: Note[] = [];
    let currentTime = 0;
    let divisions = 1;
    
    const measureElements = partElement.querySelectorAll('measure');
    
    measureElements.forEach((measureElement, measureIndex) => {
      // Mise à jour des divisions
      const divisionsEl = measureElement.querySelector('divisions');
      if (divisionsEl) {
        divisions = parseInt(divisionsEl.textContent ?? '1', 10);
      }
      
      // Extraire les notes
      const noteElements = measureElement.querySelectorAll('note');
      
      noteElements.forEach((noteElement) => {
        // Ignorer les silences
        if (noteElement.querySelector('rest')) {
          const duration = parseInt(
            noteElement.querySelector('duration')?.textContent ?? '1',
            10
          );
          currentTime += duration / divisions;
          return;
        }
        
        // Extraire le pitch
        const step = noteElement.querySelector('pitch > step')?.textContent ?? 'C';
        const octave = noteElement.querySelector('pitch > octave')?.textContent ?? '4';
        const alter = noteElement.querySelector('pitch > alter')?.textContent;
        
        let pitch = step;
        if (alter === '1') pitch += '#';
        if (alter === '-1') pitch += 'b';
        pitch += octave;
        
        // Durée
        const durationDivisions = parseInt(
          noteElement.querySelector('duration')?.textContent ?? '1',
          10
        );
        const duration = durationDivisions / divisions; // En temps de noire
        
        // Accord (note simultanée)
        const isChord = noteElement.querySelector('chord') !== null;
        
        notes.push({
          pitch,
          duration,
          startTime: isChord ? currentTime - duration : currentTime,
          velocity: 80,
          measure: measureIndex + 1,
          voice: 1,
        });
        
        if (!isChord) {
          currentTime += duration;
        }
      });
    });
    
    parts.push({
      id: partId,
      name: partName,
      instrument: 'acoustic_grand_piano', // Par défaut
      notes,
    });
  });
  
  // Calculer la durée totale
  const totalDuration = Math.max(
    ...parts.flatMap((p) => p.notes.map((n) => n.startTime + n.duration))
  );
  
  return {
    title,
    composer,
    tempo: 120, // Par défaut, à extraire du MusicXML si présent
    measures: [], // À implémenter si nécessaire
    parts,
    totalDuration,
  };
}
```

## 6. Intégration avec des services externes

### Stockage local (IndexedDB)

```typescript
// src/services/storageService.ts

const DB_NAME = 'PartReaderDB';
const STORE_NAME = 'scores';

export async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveScore(id: string, xmlContent: string): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  store.put({ id, xmlContent, savedAt: new Date().toISOString() });
}

export async function loadScore(id: string): Promise<string | null> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result?.xmlContent ?? null);
  });
}

export async function listScores(): Promise<Array<{ id: string; savedAt: string }>> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve(request.result.map((r) => ({ id: r.id, savedAt: r.savedAt })));
    };
  });
}
```

## Prochaine étape

Consultez le guide [06 - Dépannage](./06-depannage.md) pour résoudre les problèmes courants.

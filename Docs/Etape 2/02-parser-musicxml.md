# Étape 2.2 - Implémentation du Parser MusicXML

## Objectif
Convertir les fichiers MusicXML en objets `MusicScore` utilisables par l'application.

## Contexte
MusicXML est un format XML standard pour les partitions. Il contient :
- Métadonnées (titre, compositeur)
- Parties/instruments
- Mesures avec notes, silences, dynamiques

## Tâches

### 1. Compléter `parserService.ts`

```typescript
// src/services/parserService.ts
import type { MusicScore, Part, Note, Measure, TimeSignature, KeySignature } from '@/types/music';
import { v4 as uuidv4 } from 'uuid';

class ParserService {
  /**
   * Parse un document MusicXML et retourne un MusicScore
   */
  parseMusicXML(xmlContent: string): MusicScore {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'application/xml');

    // Vérifier les erreurs de parsing
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Invalid MusicXML file');
    }

    const title = this.extractTitle(doc);
    const composer = this.extractComposer(doc);
    const parts = this.extractParts(doc);
    const tempo = this.extractTempo(doc);

    const totalDuration = this.calculateTotalDuration(parts);

    return {
      title,
      composer,
      tempo,
      measures: [], // Optionnel, peut être dérivé des parts
      parts,
      totalDuration,
    };
  }

  private extractTitle(doc: Document): string {
    return doc.querySelector('work-title')?.textContent 
        ?? doc.querySelector('movement-title')?.textContent 
        ?? 'Sans titre';
  }

  private extractComposer(doc: Document): string {
    return doc.querySelector('creator[type="composer"]')?.textContent 
        ?? 'Compositeur inconnu';
  }

  private extractTempo(doc: Document): number {
    const tempoEl = doc.querySelector('sound[tempo]');
    return tempoEl ? parseInt(tempoEl.getAttribute('tempo') ?? '120') : 120;
  }

  private extractParts(doc: Document): Part[] {
    const parts: Part[] = [];
    const partList = doc.querySelectorAll('part-list score-part');
    const partElements = doc.querySelectorAll('part');

    partList.forEach((partInfo, index) => {
      const partId = partInfo.getAttribute('id') ?? uuidv4();
      const partName = partInfo.querySelector('part-name')?.textContent ?? `Part ${index + 1}`;
      const instrument = partInfo.querySelector('instrument-name')?.textContent ?? 'acoustic_grand_piano';

      const partElement = doc.querySelector(`part[id="${partId}"]`) ?? partElements[index];
      const notes = partElement ? this.extractNotes(partElement) : [];

      parts.push({
        id: partId,
        name: partName,
        instrument: this.mapInstrumentName(instrument),
        notes,
      });
    });

    return parts;
  }

  private extractNotes(partElement: Element): Note[] {
    const notes: Note[] = [];
    let currentTime = 0;
    let currentMeasure = 0;
    let divisions = 1;

    partElement.querySelectorAll('measure').forEach((measure) => {
      currentMeasure++;
      
      // Divisions définit les unités de durée
      const divisionsEl = measure.querySelector('attributes divisions');
      if (divisionsEl) {
        divisions = parseInt(divisionsEl.textContent ?? '1');
      }

      measure.querySelectorAll('note').forEach((noteEl) => {
        // Ignorer les notes en accord (sauf la première)
        const isChord = noteEl.querySelector('chord') !== null;
        
        const duration = parseInt(noteEl.querySelector('duration')?.textContent ?? '0');
        const durationInBeats = duration / divisions;
        const durationInSeconds = (durationInBeats / 2); // À ajuster selon tempo

        // Note ou silence ?
        const isRest = noteEl.querySelector('rest') !== null;
        
        if (!isRest) {
          const pitch = this.extractPitch(noteEl);
          const velocity = this.extractVelocity(noteEl);

          notes.push({
            pitch,
            duration: durationInSeconds,
            startTime: isChord ? notes[notes.length - 1]?.startTime ?? currentTime : currentTime,
            velocity,
            measure: currentMeasure,
            voice: parseInt(noteEl.querySelector('voice')?.textContent ?? '1'),
          });
        }

        if (!isChord) {
          currentTime += durationInSeconds;
        }
      });
    });

    return notes;
  }

  private extractPitch(noteEl: Element): string {
    const step = noteEl.querySelector('pitch step')?.textContent ?? 'C';
    const octave = noteEl.querySelector('pitch octave')?.textContent ?? '4';
    const alter = noteEl.querySelector('pitch alter')?.textContent;

    let accidental = '';
    if (alter === '1') accidental = '#';
    else if (alter === '-1') accidental = 'b';

    return `${step}${accidental}${octave}`;
  }

  private extractVelocity(noteEl: Element): number {
    const dynamics = noteEl.querySelector('dynamics');
    // Mapping simplifié des dynamiques
    if (dynamics?.querySelector('ff')) return 110;
    if (dynamics?.querySelector('f')) return 95;
    if (dynamics?.querySelector('mf')) return 80;
    if (dynamics?.querySelector('mp')) return 65;
    if (dynamics?.querySelector('p')) return 50;
    if (dynamics?.querySelector('pp')) return 35;
    return 80; // mf par défaut
  }

  private mapInstrumentName(name: string): string {
    // Mapper vers les noms soundfont-player
    const mapping: Record<string, string> = {
      'Piano': 'acoustic_grand_piano',
      'Violin': 'violin',
      'Flute': 'flute',
      'Guitar': 'acoustic_guitar_nylon',
      'Cello': 'cello',
      'Trumpet': 'trumpet',
      'Clarinet': 'clarinet',
      'Oboe': 'oboe',
      'Bassoon': 'bassoon',
      'Horn': 'french_horn',
      'Trombone': 'trombone',
      'Tuba': 'tuba',
      'Timpani': 'timpani',
      'Harp': 'orchestral_harp',
      'Organ': 'church_organ',
    };
    return mapping[name] ?? 'acoustic_grand_piano';
  }

  private calculateTotalDuration(parts: Part[]): number {
    let maxDuration = 0;
    parts.forEach((part) => {
      part.notes.forEach((note) => {
        const endTime = note.startTime + note.duration;
        if (endTime > maxDuration) maxDuration = endTime;
      });
    });
    return maxDuration;
  }
}

export const parserService = new ParserService();
```

### 2. Intégrer le parser dans App.tsx

```typescript
import { parserService } from '@/services/parserService';

const handleFileLoad = (content: string, name: string) => {
  setMusicXml(content);
  setFileName(name);
  
  try {
    const parsedScore = parserService.parseMusicXML(content);
    setScore(parsedScore);
  } catch (error) {
    console.error('Erreur de parsing:', error);
    // Afficher une erreur à l'utilisateur
  }
};
```

### 3. Gestion des erreurs

```tsx
const [parseError, setParseError] = useState<string | null>(null);

const handleFileLoad = (content: string, name: string) => {
  setParseError(null);
  setMusicXml(content);
  setFileName(name);
  
  try {
    const parsedScore = parserService.parseMusicXML(content);
    setScore(parsedScore);
  } catch (error) {
    setParseError('Impossible de lire ce fichier MusicXML');
    console.error('Erreur de parsing:', error);
  }
};

// Dans le JSX
{parseError && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <p className="text-red-600">{parseError}</p>
  </div>
)}
```

## Tests à effectuer
- [ ] Parser un fichier MusicXML simple (une seule partie)
- [ ] Parser un fichier avec plusieurs parties
- [ ] Vérifier l'extraction du tempo
- [ ] Vérifier les durées des notes
- [ ] Tester avec des fichiers invalides

## Ressources
- [MusicXML Documentation](https://www.musicxml.com/for-developers/)
- [MusicXML Examples](https://www.musicxml.com/music-in-musicxml/)
- [MusicXML Tutorial](https://www.musicxml.com/tutorial/)

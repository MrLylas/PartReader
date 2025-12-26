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
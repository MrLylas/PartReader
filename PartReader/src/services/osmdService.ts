import { OpenSheetMusicDisplay, Cursor } from 'opensheetmusicdisplay';

class OSMDService {
  private osmd: OpenSheetMusicDisplay | null = null;
  private cursor: Cursor | null = null;
  private container: HTMLElement | null = null;

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container;

    this.osmd = new OpenSheetMusicDisplay(container, {
      autoResize: true,
      drawTitle: true,
      drawSubtitle: true,
      drawComposer: true,
      drawCredits: true,
      drawPartNames: true,
      drawMeasureNumbers: true,
      drawTimeSignatures: true,
      drawingParameters: 'default',
    });
  }

  async loadMusicXML(xmlContent: string): Promise<void> {
    if (!this.osmd) {
      throw new Error('OSMD not initialized');
    }

    await this.osmd.load(xmlContent);
    this.osmd.render();
    
    // Initialiser le curseur
    this.cursor = this.osmd.cursor;
    this.cursor.show();
  }

  async loadFromUrl(url: string): Promise<void> {
    if (!this.osmd) {
      throw new Error('OSMD not initialized');
    }

    await this.osmd.load(url);
    this.osmd.render();
    
    this.cursor = this.osmd.cursor;
    this.cursor.show();
  }

  // Navigation du curseur
  cursorNext(): void {
    this.cursor?.next();
  }

  cursorPrevious(): void {
    this.cursor?.previous();
  }

  cursorReset(): void {
    this.cursor?.reset();
  }

  cursorHide(): void {
    this.cursor?.hide();
  }

  cursorShow(): void {
    this.cursor?.show();
  }

  // Obtenir les informations de la note courante
  getCurrentNotes(): any[] {
    if (!this.cursor) return [];
    
    const iterator = this.cursor.iterator;
    if (!iterator.CurrentVoiceEntries) return [];

    const notes: any[] = [];
    
    iterator.CurrentVoiceEntries.forEach((voiceEntry) => {
      voiceEntry.Notes.forEach((note) => {
        if (!note.isRest()) {
          notes.push({
            pitch: note.Pitch?.toString() ?? '',
            duration: note.Length.RealValue,
            // Autres propriétés...
          });
        }
      });
    });

    return notes;
  }

  // Zoom
  setZoom(zoomLevel: number): void {
    if (this.osmd) {
      this.osmd.zoom = zoomLevel;
      this.osmd.render();
    }
  }

  getZoom(): number {
    return this.osmd?.zoom ?? 1;
  }

  // Obtenir les métadonnées
  getTitle(): string {
    return this.osmd?.Sheet?.Title?.text ?? 'Sans titre';
  }

  getComposer(): string {
    return this.osmd?.Sheet?.Composer?.text ?? 'Compositeur inconnu';
  }

  getMeasureCount(): number {
    return this.osmd?.Sheet?.SourceMeasures?.length ?? 0;
  }

  // Nettoyage
  dispose(): void {
    this.cursor?.hide();
    this.osmd?.clear();
    this.osmd = null;
    this.cursor = null;
  }
}

export const osmdService = new OSMDService();
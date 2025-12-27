import { OpenSheetMusicDisplay, Cursor } from 'opensheetmusicdisplay';

class OSMDService {
  private osmd: OpenSheetMusicDisplay | null = null;
  private cursor: Cursor | null = null;
  private resizeTimeout: number | null = null;
  private isRendering = false;

  async initialize(container: HTMLElement): Promise<void> {
    this.osmd = new OpenSheetMusicDisplay(container, {
      autoResize: false,
      drawTitle: true,
      drawSubtitle: true,
      drawComposer: true,
      drawCredits: false,
      drawPartNames: true,
      drawMeasureNumbers: true,
      drawTimeSignatures: true,
      drawingParameters: 'compacttight',
    });

    // Gestion manuelle du resize avec debounce
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    // Debounce le resize pour éviter trop de re-renders
    if (this.resizeTimeout) {
      window.clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = window.setTimeout(() => {
      this.safeRender();
    }, 250);
  };

  private safeRender(): void {
    if (!this.osmd || this.isRendering) return;
    
    try {
      // Vérifier que OSMD est prêt avant de render
      if (this.osmd.IsReadyToRender()) {
        this.isRendering = true;
        this.osmd.render();
        this.isRendering = false;
      }
    } catch (error) {
      console.warn('OSMD render error (ignored):', error);
      this.isRendering = false;
    }
  }

  async loadMusicXML(xmlContent: string): Promise<void> {
    if (!this.osmd) {
      throw new Error('OSMD not initialized');
    }

    try {
      await this.osmd.load(xmlContent);
      this.osmd.render();
      
      // Initialiser le curseur
      this.cursor = this.osmd.cursor;
      this.cursor.show();
    } catch (error) {
      console.warn('OSMD first render failed, retrying with compact mode:', error);
      
      // Retry avec options minimales
      try {
        this.osmd.setOptions({
          drawingParameters: 'compacttight',
          drawCredits: false,
          drawPartNames: false,
        });
        this.osmd.render();
        
        this.cursor = this.osmd.cursor;
        this.cursor.show();
      } catch (retryError) {
        console.error('OSMD render failed even with minimal options:', retryError);
        throw retryError;
      }
    }
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
    // Supprimer le listener de resize
    window.removeEventListener('resize', this.handleResize);
    
    if (this.resizeTimeout) {
      window.clearTimeout(this.resizeTimeout);
    }
    
    this.cursor?.hide();
    this.osmd?.clear();
    this.osmd = null;
    this.cursor = null;
  }
}

export const osmdService = new OSMDService();
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { osmdService } from '@/services/osmdService';

interface SheetMusicViewerProps {
  musicXml: string | null;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const SheetMusicViewer: React.FC<SheetMusicViewerProps> = ({
  musicXml,
  onLoad,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const initAttemptRef = useRef(0);

  // Fonction pour vérifier si le conteneur a des dimensions valides
  const waitForContainerDimensions = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const checkDimensions = () => {
        if (containerRef.current) {
          const { offsetWidth, offsetHeight } = containerRef.current;
          if (offsetWidth > 0 && offsetHeight > 0) {
            resolve();
            return;
          }
        }
        // Réessayer après un court délai
        if (initAttemptRef.current < 20) {
          initAttemptRef.current++;
          requestAnimationFrame(checkDimensions);
        } else {
          // Timeout - résoudre quand même après 20 tentatives
          resolve();
        }
      };
      checkDimensions();
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const initializeOSMD = async () => {
      await waitForContainerDimensions();
      osmdService.initialize(containerRef.current!);
      setIsInitialized(true);
    };

    initializeOSMD();

    return () => {
      osmdService.dispose();
      setIsInitialized(false);
      initAttemptRef.current = 0;
    };
  }, [waitForContainerDimensions]);

  useEffect(() => {
    if (!musicXml || !isInitialized) return;

    const loadScore = async () => {
      setIsLoading(true);
      try {
        // Petit délai pour s'assurer que le DOM est stable
        await new Promise(resolve => setTimeout(resolve, 100));
        await osmdService.loadMusicXML(musicXml);
        onLoad?.();
      } catch (error) {
        console.error('Erreur chargement partition:', error);
        onError?.(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScore();
  }, [musicXml, isInitialized, onLoad, onError]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.1, 2);
    setZoom(newZoom);
    osmdService.setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.1, 0.5);
    setZoom(newZoom);
    osmdService.setZoom(newZoom);
  };

  return (
    <div className="relative w-full min-h-[60vh] bg-white rounded-lg shadow-sm">
      {/* Contrôles de zoom */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
          title="Zoom arrière"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="px-3 py-2 bg-white rounded-lg shadow text-sm">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
          title="Zoom avant"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Chargement de la partition...</p>
          </div>
        </div>
      )}

      {/* Conteneur OSMD */}
      <div
        ref={containerRef}
        className="w-full min-h-[60vh] overflow-auto p-4"
      />
    </div>
  );
};
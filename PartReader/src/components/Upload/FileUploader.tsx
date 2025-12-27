import React, { useCallback, useState } from 'react';
import extractMxl from '@/utils/mxlExtractor';

interface FileUploaderProps {
  onFileLoad: (content: string, fileName: string) => void;
  acceptedFormats?: string[];
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileLoad,
  acceptedFormats = ['.xml', '.musicxml', '.mxl'],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dans FileUploader.tsx - modifier handleFile

const handleFile = useCallback(
  async (file: File) => {
    setError(null);

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(extension)) {
      setError(`Format non supporté. Formats acceptés: ${acceptedFormats.join(', ')}`);
      return;
    }

    try {
      let content: string;
      
      // Si c'est un fichier .mxl, le décompresser
      if (extension === '.mxl') {
        content = await extractMxl(file);
      } else {
        content = await file.text();
      }
      
      onFileLoad(content, file.name);
    } catch (err) {
      setError('Erreur lors de la lecture du fichier');
      console.error(err);
    }
  },
  [acceptedFormats, onFileLoad]
);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
        `}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Icône */}
          <svg
            className={`w-16 h-16 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>

          <div>
            <p className="text-lg font-medium text-gray-700">
              Glissez votre partition ici
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ou cliquez pour sélectionner un fichier
            </p>
          </div>

          <input
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <p className="text-xs text-gray-400">
            Formats supportés: MusicXML (.xml, .musicxml)
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};
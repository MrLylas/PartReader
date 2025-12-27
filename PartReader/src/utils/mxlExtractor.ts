// Ajouter en haut de FileUploader.tsx ou dans un fichier utils/mxlExtractor.ts
import JSZip from 'jszip';

async function extractMxl(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  
  // Les fichiers .mxl contiennent généralement :
  // - META-INF/container.xml (indique le fichier principal)
  // - Un fichier .xml avec la partition
  
  // Chercher le fichier container.xml pour trouver le rootfile
  const containerFile = zip.file('META-INF/container.xml');
  
  if (containerFile) {
    const containerXml = await containerFile.async('string');
    const parser = new DOMParser();
    const containerDoc = parser.parseFromString(containerXml, 'application/xml');
    const rootfile = containerDoc.querySelector('rootfile');
    const mainFilePath = rootfile?.getAttribute('full-path');
    
    if (mainFilePath) {
      const mainFile = zip.file(mainFilePath);
      if (mainFile) {
        return await mainFile.async('string');
      }
    }
  }
  
  // Fallback : chercher n'importe quel fichier .xml dans l'archive
  const xmlFiles = zip.file(/\.xml$/i);
  const musicXmlFile = xmlFiles.find(f => !f.name.includes('META-INF'));
  
  if (musicXmlFile) {
    return await musicXmlFile.async('string');
  }
  
  throw new Error('Aucun fichier MusicXML trouvé dans l\'archive .mxl');
}

export default extractMxl;
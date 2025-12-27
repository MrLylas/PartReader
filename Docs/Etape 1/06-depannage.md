# 06 - Dépannage

Ce guide répertorie les problèmes courants et leurs solutions.

## Problèmes audio

### L'audio ne démarre pas

**Symptôme** : Aucun son n'est produit lors de la lecture.

**Cause** : Les navigateurs modernes bloquent la lecture audio automatique. Un contexte audio doit être démarré après une interaction utilisateur (clic, touche).

**Solution** :

```typescript
// Initialiser l'audio après un clic
document.addEventListener('click', async () => {
  const audioContext = new AudioContext();
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  await Tone.start();
}, { once: true });
```

**Bonnes pratiques** :
- Afficher un bouton "Démarrer" avant la première lecture
- Initialiser l'audio dans le gestionnaire `onClick` du bouton Play

---

### Latence audio importante

**Symptôme** : Décalage entre l'affichage et le son.

**Causes possibles** :
1. Taille du buffer audio trop grande
2. Trop de traitement sur le thread principal

**Solutions** :

```typescript
// Réduire la latence du contexte audio
const audioContext = new AudioContext({
  latencyHint: 'interactive', // ou 'playback' pour moins de glitches
});

// Utiliser Tone.js avec latence réduite
Tone.context.lookAhead = 0.01; // 10ms au lieu de 100ms par défaut
```

---

### Glitches / craquements audio

**Symptôme** : Craquements ou interruptions pendant la lecture.

**Causes** :
1. Thread principal surchargé
2. Garbage collection
3. Buffer underrun

**Solutions** :

```typescript
// Augmenter le buffer si nécessaire
const audioContext = new AudioContext({
  latencyHint: 'playback',
  sampleRate: 44100,
});

// Éviter les allocations pendant la lecture
// Pré-allouer les objets avant de jouer

// Utiliser requestAnimationFrame pour les mises à jour visuelles
function updateCursor() {
  // Mise à jour du curseur
  requestAnimationFrame(updateCursor);
}
```

---

## Problèmes d'affichage (OSMD)

### La partition ne s'affiche pas

**Symptôme** : Le conteneur reste vide après le chargement.

**Vérifications** :

1. **Le conteneur a-t-il des dimensions ?**
```css
#sheet-container {
  width: 100%;
  height: 600px; /* Hauteur explicite nécessaire */
}
```

2. **Le MusicXML est-il valide ?**
```typescript
try {
  await osmd.load(musicXml);
  osmd.render();
} catch (error) {
  console.error('Erreur de chargement:', error);
}
```

3. **OSMD est-il correctement initialisé ?**
```typescript
// S'assurer que le conteneur existe
const container = document.getElementById('sheet-container');
if (!container) {
  throw new Error('Container not found');
}
```

---

### Partition tronquée ou mal rendue

**Symptôme** : Certaines mesures sont coupées ou mal positionnées.

**Solutions** :

```typescript
// Forcer le re-rendu après redimensionnement
window.addEventListener('resize', () => {
  osmd.render();
});

// Utiliser autoResize
const osmd = new OpenSheetMusicDisplay(container, {
  autoResize: true,
});

// Ajuster le zoom si nécessaire
osmd.zoom = 0.8; // Réduire pour tout afficher
osmd.render();
```

---

### Curseur invisible ou mal positionné

**Symptôme** : Le curseur ne suit pas la lecture.

**Solutions** :

```typescript
// S'assurer que le curseur est affiché
osmd.cursor.show();

// Réinitialiser le curseur
osmd.cursor.reset();

// Vérifier le style CSS du curseur
osmd.cursor.cursorElement.style.zIndex = '100';
osmd.cursor.cursorElement.style.opacity = '1';
```

---

## Problèmes de parsing

### Erreur "Invalid MusicXML"

**Symptôme** : Le fichier ne peut pas être chargé.

**Vérifications** :

1. **Le fichier est-il bien du XML ?**
```typescript
const parser = new DOMParser();
const doc = parser.parseFromString(content, 'text/xml');
const error = doc.querySelector('parsererror');
if (error) {
  console.error('XML invalide:', error.textContent);
}
```

2. **Le fichier est-il compressé (.mxl) ?**
```typescript
// Les fichiers .mxl sont des archives ZIP
// Utiliser JSZip pour les décompresser
import JSZip from 'jszip';

async function loadMXL(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const xmlFile = Object.keys(zip.files).find(
    (name) => name.endsWith('.xml') && !name.startsWith('META-INF')
  );
  if (!xmlFile) throw new Error('No XML found in MXL');
  return await zip.files[xmlFile].async('string');
}
```

3. **L'encodage est-il correct ?**
```typescript
// Forcer l'encodage UTF-8
const reader = new FileReader();
reader.readAsText(file, 'UTF-8');
```

---

### Notes manquantes après parsing

**Symptôme** : Certaines notes ne sont pas jouées.

**Causes possibles** :
- Notes dans des voix secondaires non parsées
- Accords mal gérés
- Liaisons (ties) non prises en compte

**Solution** : Vérifier le parsing des voix multiples

```typescript
// Parcourir toutes les voix
noteElements.forEach((noteElement) => {
  const voice = noteElement.querySelector('voice')?.textContent ?? '1';
  const staff = noteElement.querySelector('staff')?.textContent ?? '1';
  
  // Traiter chaque voix séparément
  // ...
});
```

---

## Problèmes de performance

### L'application est lente avec de grandes partitions

**Symptômes** :
- Temps de chargement long
- Interface qui freeze
- Scrolling saccadé

**Solutions** :

1. **Lazy loading des mesures**
```typescript
// Ne rendre que les mesures visibles
const visibleMeasures = getVisibleMeasures(scrollPosition);
renderMeasures(visibleMeasures);
```

2. **Web Worker pour le parsing**
```typescript
// parser.worker.ts
self.onmessage = (e) => {
  const result = parseMusicXML(e.data);
  self.postMessage(result);
};

// main.ts
const worker = new Worker(new URL('./parser.worker.ts', import.meta.url));
worker.postMessage(xmlContent);
worker.onmessage = (e) => {
  const score = e.data;
  // Utiliser le score
};
```

3. **Virtualisation du rendu**
```typescript
// Utiliser react-window ou react-virtualized
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={measureCount}
  itemSize={200}
>
  {({ index, style }) => (
    <MeasureRenderer measure={measures[index]} style={style} />
  )}
</FixedSizeList>
```

---

## Problèmes de compatibilité navigateur

### Safari : Audio qui ne fonctionne pas

**Cause** : Safari a des restrictions plus strictes sur l'audio.

**Solution** :

```typescript
// Créer le contexte audio dans un gestionnaire d'événement utilisateur
button.addEventListener('touchend', async () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  await audioContext.resume();
});
```

---

### Firefox : Problèmes de rendu SVG

**Cause** : Différences dans le rendu SVG.

**Solution** :

```typescript
// Forcer le backend canvas si nécessaire
const osmd = new OpenSheetMusicDisplay(container, {
  backend: 'canvas', // Au lieu de 'svg'
});
```

---

### Mobile : Touch events

**Symptôme** : Les contrôles ne répondent pas sur mobile.

**Solution** :

```typescript
// Ajouter les événements touch
element.addEventListener('touchstart', handleStart, { passive: true });
element.addEventListener('touchmove', handleMove, { passive: true });
element.addEventListener('touchend', handleEnd);

// Ou utiliser une bibliothèque comme Hammer.js
import Hammer from 'hammerjs';
const hammer = new Hammer(element);
hammer.on('tap', handleTap);
hammer.on('pan', handlePan);
```

---

## Messages d'erreur courants

| Erreur | Cause | Solution |
|--------|-------|----------|
| `AudioContext was not allowed to start` | Pas d'interaction utilisateur | Démarrer l'audio après un clic |
| `Failed to decode audio data` | Fichier audio corrompu | Vérifier le format du fichier |
| `OSMD: Container has no width` | Conteneur sans dimensions | Définir width/height en CSS |
| `Cannot read property 'x' of undefined` | Partition mal formée | Valider le MusicXML |
| `Maximum call stack size exceeded` | Boucle infinie | Vérifier les conditions de boucle |

---

## Outils de débogage

### Console du navigateur

```typescript
// Activer les logs détaillés
localStorage.setItem('debug', 'partreader:*');

// Logger les événements audio
Tone.Transport.on('start', () => console.log('Transport started'));
Tone.Transport.on('stop', () => console.log('Transport stopped'));
```

### Visualisation audio

```typescript
// Analyser le signal audio
const analyser = Tone.context.createAnalyser();
Tone.Destination.connect(analyser);

const dataArray = new Uint8Array(analyser.frequencyBinCount);
function draw() {
  analyser.getByteFrequencyData(dataArray);
  // Dessiner le spectre
  requestAnimationFrame(draw);
}
draw();
```

### Performance

```typescript
// Mesurer le temps de rendu
console.time('render');
osmd.render();
console.timeEnd('render');

// Profiler avec Performance API
performance.mark('start-parse');
const score = parseMusicXML(xml);
performance.mark('end-parse');
performance.measure('parse', 'start-parse', 'end-parse');
```

---

## Ressources supplémentaires

- [OSMD GitHub Issues](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/issues)
- [Tone.js Documentation](https://tonejs.github.io/docs/)
- [Web Audio API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MusicXML Tutorial](https://www.musicxml.com/tutorial/)

---

## Obtenir de l'aide

Si vous rencontrez un problème non documenté :

1. Vérifiez la console du navigateur pour les erreurs
2. Reproduisez le problème avec un fichier MusicXML minimal
3. Consultez les issues GitHub des bibliothèques utilisées
4. Créez un exemple reproductible minimal (CodeSandbox, StackBlitz)

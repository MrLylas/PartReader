# Étape 2.5 - Tests et Intégration

## Objectif
Valider le flux complet de l'application et corriger les bugs identifiés.

## Scénarios de test

### Test 1 : Flux basique (Upload → Affichage → Lecture)

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Lancer l'application | FileUploader affiché |
| 2 | Glisser un fichier MusicXML | Zone de drop réactive |
| 3 | Déposer le fichier | Chargement, puis partition affichée |
| 4 | Vérifier les métadonnées | Titre et compositeur corrects |
| 5 | Cliquer sur Play | Audio démarre, curseur avance |
| 6 | Cliquer sur Pause | Audio et curseur s'arrêtent |
| 7 | Cliquer sur Stop | Retour au début |

### Test 2 : Contrôles du lecteur

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Modifier le tempo (slider) | Tempo affiché change |
| 2 | Relancer la lecture | Vitesse de lecture adaptée |
| 3 | Modifier le volume | Son plus fort/faible |
| 4 | Cliquer sur la barre de progression | Lecture saute à la position |
| 5 | Utiliser le zoom (+/-) | Partition agrandie/réduite |

### Test 3 : Métronome

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Activer le métronome | Son de clic régulier |
| 2 | Vérifier l'accent | Premier temps plus fort |
| 3 | Changer le tempo | Métronome s'adapte |
| 4 | Désactiver | Son s'arrête |
| 5 | Activer pendant lecture | Synchronisé avec la partition |

### Test 4 : Boucle de lecture

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Activer la boucle | Sélecteurs de mesures apparaissent |
| 2 | Définir mesures 5-10 | Valeurs acceptées |
| 3 | Lancer la lecture | Joue uniquement mesures 5-10 |
| 4 | Attendre la fin | Recommence automatiquement |
| 5 | Désactiver la boucle | Lecture normale reprend |

### Test 5 : Gestion des erreurs

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Uploader un fichier invalide | Message d'erreur clair |
| 2 | Uploader un fichier trop gros | Gestion appropriée |
| 3 | Couper le son système | App ne crash pas |
| 4 | Redimensionner la fenêtre | Layout s'adapte |

## Fichiers de test MusicXML

### Sources recommandées
1. **MusicXML.com** : https://www.musicxml.com/music-in-musicxml/
   - Exemples officiels, bien formés
   
2. **MuseScore** : https://musescore.com
   - Exporter en MusicXML depuis des partitions existantes
   
3. **IMSLP** : https://imslp.org
   - Partitions du domaine public (certaines en MusicXML)

### Fichiers de test suggérés

```
tests/
├── simple/
│   ├── single-part-c-major.xml      # Une partie, Do majeur, 4/4
│   ├── single-part-with-rests.xml   # Avec silences
│   └── single-part-accidentals.xml  # Avec altérations
├── complex/
│   ├── multi-part-quartet.xml       # Quatuor à cordes
│   ├── piano-two-hands.xml          # Piano main gauche/droite
│   └── time-signature-changes.xml   # Changements de mesure
└── edge-cases/
    ├── empty-measures.xml           # Mesures vides
    ├── very-long.xml                # Partition longue (100+ mesures)
    └── complex-rhythms.xml          # Triolets, syncopes
```

### Créer un fichier de test minimal

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" 
  "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Test Simple</work-title>
  </work>
  <identification>
    <creator type="composer">Test Composer</creator>
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
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>F</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>
```

## Bugs connus et solutions

### Bug 1 : Désynchronisation curseur/audio
**Symptôme** : Le curseur avance trop vite ou trop lentement par rapport à l'audio.

**Cause probable** : Le calcul des durées ne prend pas en compte le tempo correctement.

**Solution** :
```typescript
// Dans audioService.ts
const durationInSeconds = (durationInBeats * 60) / tempo;
```

### Bug 2 : Fichiers .mxl non supportés
**Symptôme** : Erreur lors de l'upload d'un fichier .mxl (MusicXML compressé).

**Solution** : Utiliser JSZip pour décompresser
```typescript
import JSZip from 'jszip';

async function extractMxl(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const xmlFile = zip.file(/\.xml$/i)[0];
  if (!xmlFile) throw new Error('No XML file found in MXL');
  return await xmlFile.async('string');
}
```

### Bug 3 : Performance avec grandes partitions
**Symptôme** : L'application ralentit avec des partitions de 100+ mesures.

**Solutions** :
1. Virtualiser le rendu (afficher seulement les mesures visibles)
2. Utiliser `useMemo` pour les calculs coûteux
3. Débouncer les mises à jour du curseur

### Bug 4 : Audio ne démarre pas
**Symptôme** : Clic sur Play mais pas de son.

**Cause** : AudioContext bloqué par le navigateur (autoplay policy).

**Solution** : S'assurer que `audioService.initialize()` est appelé après une interaction utilisateur.

## Métriques de performance

| Métrique | Objectif | Comment mesurer |
|----------|----------|-----------------|
| Temps de chargement partition | < 2s | `performance.now()` avant/après |
| Latence audio | < 50ms | Test subjectif |
| FPS pendant lecture | > 30fps | DevTools Performance |
| Mémoire utilisée | < 200MB | DevTools Memory |

### Script de mesure

```typescript
// utils/performance.ts
export function measureLoadTime(fn: () => Promise<void>): Promise<number> {
  const start = performance.now();
  return fn().then(() => performance.now() - start);
}

// Usage
const loadTime = await measureLoadTime(async () => {
  await osmdService.loadMusicXML(xmlContent);
});
console.log(`Partition chargée en ${loadTime.toFixed(0)}ms`);
```

## Checklist finale avant release

### Fonctionnalités
- [ ] Upload de fichiers MusicXML fonctionne
- [ ] Affichage de la partition correct
- [ ] Lecture audio synchronisée
- [ ] Contrôles (play/pause/stop) fonctionnels
- [ ] Tempo ajustable
- [ ] Volume ajustable
- [ ] Zoom fonctionne
- [ ] Métronome fonctionne
- [ ] Boucle de lecture fonctionne

### Qualité
- [ ] Pas d'erreurs dans la console
- [ ] Messages d'erreur clairs pour l'utilisateur
- [ ] Interface responsive (mobile/desktop)
- [ ] Accessibilité basique (navigation clavier)

### Performance
- [ ] Chargement < 2s pour partitions standard
- [ ] Pas de freeze pendant la lecture
- [ ] Mémoire stable (pas de fuite)

## Rapport de test

```markdown
## Rapport de test - [DATE]

### Environnement
- Navigateur : Chrome 120
- OS : Windows 11
- Résolution : 1920x1080

### Résultats

| Test | Statut | Notes |
|------|--------|-------|
| Flux basique | ✅ | OK |
| Contrôles | ✅ | OK |
| Métronome | ⚠️ | Léger décalage après 2min |
| Boucle | ❌ | Bug sur mesure unique |
| Erreurs | ✅ | OK |

### Bugs à corriger
1. [P1] Boucle sur mesure unique crash
2. [P2] Métronome se décale après longue lecture

### Améliorations suggérées
- Ajouter indicateur de chargement pour gros fichiers
- Améliorer le feedback visuel du curseur
```

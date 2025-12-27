# 01 - Vue d'ensemble

## Introduction

PartReader est une application web permettant de visualiser et jouer des partitions musicales directement dans le navigateur. Cette documentation vous guidera à travers toutes les étapes nécessaires pour mettre en place le projet.

## Fonctionnalités principales

### 1. Import de partitions
- Support des formats **MusicXML** (.xml, .musicxml)
- Support des fichiers **MIDI** (.mid, .midi)
- Glisser-déposer ou sélection de fichiers
- Validation et parsing automatique

### 2. Affichage des partitions
- Rendu vectoriel haute qualité (SVG)
- Zoom et navigation
- Affichage multi-portées
- Support des clés, armures, mesures

### 3. Lecture audio
- Synthèse sonore réaliste avec SoundFonts
- Synchronisation partition/audio
- Surlignage des notes en cours
- Défilement automatique

### 4. Contrôles de lecture
- Play / Pause / Stop
- Contrôle du tempo
- Contrôle du volume
- Métronome optionnel
- Navigation par mesure

## Formats supportés

### MusicXML
Format standard de l'industrie musicale, supporté par :
- MuseScore
- Finale
- Sibelius
- Dorico
- Noteflight

**Avantages** :
- Préserve toute la notation musicale
- Interopérable entre logiciels
- Format texte (XML) lisible

### MIDI
Format audio/événements musicaux.

**Avantages** :
- Compact
- Timing précis
- Largement supporté

**Limitations** :
- Pas d'information de notation (clés, liaisons visuelles)

## Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│                      NAVIGATEUR                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Upload    │  │  SheetMusic │  │   Player    │     │
│  │  Component  │  │  Component  │  │  Component  │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│         ▼                ▼                ▼             │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Services Layer                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │   │
│  │  │  Parser  │  │   OSMD   │  │  Audio   │      │   │
│  │  │ Service  │  │ Renderer │  │ Service  │      │   │
│  │  └──────────┘  └──────────┘  └──────────┘      │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Web Audio API                       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Flux de données

1. **Import** : L'utilisateur charge un fichier MusicXML/MIDI
2. **Parsing** : Le fichier est parsé et converti en structure interne
3. **Rendu** : OSMD génère le rendu SVG de la partition
4. **Préparation audio** : Les notes sont mappées aux sons
5. **Lecture** : Tone.js orchestre la lecture synchronisée
6. **Feedback visuel** : Les notes jouées sont surlignées en temps réel

## Prérequis techniques

- **Node.js** 18+ 
- **npm** 9+ ou **pnpm** 8+
- Navigateur moderne (Chrome, Firefox, Edge, Safari)
- Connaissances de base en React et TypeScript

## Ressources utiles

- [OpenSheetMusicDisplay](https://opensheetmusicdisplay.org/)
- [Tone.js](https://tonejs.github.io/)
- [MusicXML Specification](https://www.musicxml.com/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

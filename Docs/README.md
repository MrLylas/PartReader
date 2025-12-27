# PartReader - Documentation

Bienvenue dans la documentation du projet **PartReader**, une application web permettant de lire et jouer des partitions musicales.

## 📚 Table des matières

1. [Vue d'ensemble](./01-vue-ensemble.md)
2. [Architecture technique](./02-architecture.md)
3. [Installation et configuration](./03-installation.md)
4. [Guide des fonctionnalités](./04-fonctionnalites.md)
5. [API et intégrations](./05-api-integrations.md)
6. [Dépannage](./06-depannage.md)

## 🎯 Objectif du projet

PartReader est une application web moderne permettant de :
- **Importer** des partitions musicales (MusicXML, MIDI)
- **Afficher** les partitions avec un rendu professionnel
- **Jouer** les partitions avec des sons réalistes
- **Suivre** la lecture en temps réel avec surlignage des notes

## 🛠️ Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18 + TypeScript |
| Rendu partition | OpenSheetMusicDisplay (OSMD) |
| Audio | Tone.js + Soundfont-player |
| Styling | TailwindCSS |
| Build | Vite |
| Format principal | MusicXML |

## 🚀 Démarrage rapide

```bash
# Cloner le projet
git clone <url-du-repo>
cd PartReader

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

## 📁 Structure du projet

```
PartReader/
├── Docs/                    # Documentation
├── public/                  # Assets statiques
├── src/
│   ├── components/          # Composants React
│   │   ├── SheetMusic/      # Affichage partition
│   │   ├── Player/          # Contrôles de lecture
│   │   └── Upload/          # Import de fichiers
│   ├── hooks/               # Hooks personnalisés
│   ├── services/            # Services (audio, parsing)
│   ├── types/               # Types TypeScript
│   ├── utils/               # Utilitaires
│   ├── App.tsx              # Composant principal
│   └── main.tsx             # Point d'entrée
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 📖 Prochaines étapes

Consultez les guides détaillés dans l'ordre pour une mise en place complète du projet.

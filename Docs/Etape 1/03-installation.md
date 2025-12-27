# 03 - Installation et configuration

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** version 18 ou supérieure
  ```bash
  node --version  # Doit afficher v18.x.x ou plus
  ```

- **npm** version 9 ou supérieure (inclus avec Node.js)
  ```bash
  npm --version
  ```

## Étape 1 : Création du projet

### Initialisation avec Vite

```bash
# Créer le projet React + TypeScript
npm create vite@latest partreader -- --template react-ts

# Accéder au dossier
cd partreader

# Installer les dépendances de base
npm install
```

## Étape 2 : Installation des dépendances

### Dépendances principales

```bash
# Rendu de partitions
npm install opensheetmusicdisplay

# Audio
npm install tone soundfont-player

# Utilitaires
npm install uuid
```

### Dépendances de développement

```bash
# TailwindCSS
npm install -D tailwindcss postcss autoprefixer

# Types TypeScript
npm install -D @types/uuid

# ESLint & Prettier (optionnel mais recommandé)
npm install -D eslint prettier eslint-config-prettier
```

## Étape 3 : Configuration de TailwindCSS

### Initialisation

```bash
npx tailwindcss init -p
```

### Configuration `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        accent: {
          500: '#8b5cf6',
          600: '#7c3aed',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
```

### Mise à jour de `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Inter', system-ui, sans-serif;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 text-white px-4 py-2 rounded-lg 
           hover:bg-primary-700 transition-colors duration-200
           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-800 px-4 py-2 rounded-lg
           hover:bg-gray-300 transition-colors duration-200;
  }
}
```

## Étape 4 : Configuration TypeScript

### Mise à jour de `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@services/*": ["src/services/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Configuration des alias dans Vite

Mettre à jour `vite.config.ts` :

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
})
```

## Étape 5 : Structure des dossiers

Créer la structure de dossiers :

```bash
# Sous Windows (PowerShell)
mkdir src/components/common
mkdir src/components/SheetMusic
mkdir src/components/Player
mkdir src/components/Upload
mkdir src/hooks
mkdir src/services
mkdir src/types
mkdir src/utils
mkdir src/context
mkdir public/soundfonts
```

## Étape 6 : Fichiers de configuration supplémentaires

### `.env` (variables d'environnement)

```env
VITE_APP_TITLE=PartReader
VITE_SOUNDFONT_URL=https://gleitz.github.io/midi-js-soundfonts/MusyngKite/
```

### `.gitignore`

```gitignore
# Dependencies
node_modules/

# Build
dist/
build/

# Environment
.env.local
.env.*.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Cache
.cache/
```

## Étape 7 : Scripts npm

Mettre à jour `package.json` :

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\""
  }
}
```

## Étape 8 : Vérification de l'installation

```bash
# Lancer le serveur de développement
npm run dev
```

Ouvrez votre navigateur à l'adresse `http://localhost:5173`. Vous devriez voir la page d'accueil Vite + React.

## Résumé des dépendances

### `package.json` final

```json
{
  "name": "partreader",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\""
  },
  "dependencies": {
    "opensheetmusicdisplay": "^1.8.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "soundfont-player": "^0.12.0",
    "tone": "^14.7.77",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/uuid": "^9.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.2",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

## Prochaine étape

Passez au guide [04 - Fonctionnalités](./04-fonctionnalites.md) pour implémenter les composants de l'application.

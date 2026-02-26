# Rubis

Outil d'audit métier (cybersécurité et audits alignés ISO 19011), offline-first.

## Stack MVP

- Monorepo npm workspaces
- API: Node.js + Fastify + lowdb (JSON local offline)
- Web: React + Vite + TypeScript
- Shared: package de types communs

## Démarrage

### 🐧 WSL2 / Linux (nouveau)

```bash
cd ~/Rubis

# Première fois (installe Ollama + télécharge Mistral)
./install-ollama.sh

# Fois suivantes (lance Ollama + Rubis)
./start-rubis.sh

# Ouvrir navigateur
http://localhost:5173
```

### 🚀 Rapide (Recommandé - Ollama Offline)

```powershell
cd c:\VS_Code\Rubis

# Première fois (30 min) - Installe Ollama + Mistral
.\install-ollama.ps1

# Fois suivantes (30 sec) - Lance Ollama + Rubis
.\start-rubis.ps1

# Ouvrir navigateur
http://localhost:5173
```

**Avantages** :
- ✅ 100% offline après setup
- ✅ Zéro coût operational
- ✅ Vitesse: 5-10s par question
- ✅ Confidentiel (audit data local)

---

### Manuel (contrôle fin)

1. Installer les dépendances:
   ```powershell
   npm install
   ```

2. **Configurer IA** (choisis une option):

   **Option A : OpenAI (rapide, online)**
   - Créer `apps/api/.env` (copier depuis `.env.example`)
   - Ajouter clé API: `OPENAI_API_KEY=sk-...`
   - Obtenir sur https://platform.openai.com/api-keys

   **Option B : Ollama (gratuit, offline)**
   - Installer Ollama: https://ollama.ai/download
   - Télécharger modèle: `ollama pull mistral:7b-q4_0`
   - Lancer dans nouveau terminal: `ollama serve`

3. Lancer Rubis:
   ```powershell
   npm run dev
   # Ouvrir http://localhost:5173
   ```

---

### 📖 Guides complets

- [GETTING_STARTED.md](./GETTING_STARTED.md) - Guide de démarrage détaillé (recommandé pour première fois)
- [SETUP_OLLAMA.md](./SETUP_OLLAMA.md) - Configuration Ollama avancée
- [SETUP_OPENAI.md](./SETUP_OPENAI.md) - Configuration OpenAI + tarifs
- [MIGRATION_WSL2.md](./MIGRATION_WSL2.md) - Migration complète Windows → WSL2
- [RPI_SETUP.md](./RPI_SETUP.md) - Déploiement Raspberry Pi (RPi 4/5)

### Scripts disponibles

- **Windows PowerShell**: `install-ollama.ps1`, `setup-ollama.ps1`, `start-rubis.ps1`
- **WSL2 / Linux (bash)**: `install-ollama.sh`, `setup-ollama.sh`, `start-rubis.sh`
- **Migration WSL2**: `migrate-to-wsl2.sh` (copie vers `~/Rubis` + `npm install`)
- **Bootstrap WSL2 (PowerShell)**: `bootstrap-wsl2.ps1` (installe WSL + setup post-install)
- **Bootstrap Raspberry Pi**: `bootstrap-rpi.sh` (Node + deps + Ollama)

## Base locale (reset + seed)

- Réinitialiser la base locale:
   npm run db:reset
- Injecter un jeu de données de démonstration:
   npm run db:seed:demo

Le fichier de base est stocké dans `apps/api/data/rubis.json`.

## Checklist tests manuels rapides

1. Lancer l'app avec `npm run dev` (avec Ollama running ou OpenAI configuré).
2. Ouvrir `http://localhost:5173`.
3. Vérifier qu'une campagne démo est visible via les formulaires (ou créer une campagne).
4. **[Nouveau]** Tester la génération de questions via IA:
   - Section "Générer des questions via IA (référentiel)"
   - Uploader un fichier PDF ou Excel contenant des exigences
   - Vérifier que les questions sont générées automatiquement
   - (Requiert OpenAI_API_KEY configurée OU Ollama running)
   - **Timing** : OpenAI ~2-5s | Ollama ~10-30s
5. Générer un rapport (section Phase 1.5) puis ouvrir le rapport.
6. Exporter le rapport en `.md` et vérifier le fichier téléchargé.
7. Tester une saisie de note d'entretien (Phase 1.4) + score conformité.
8. Vérifier que la conformité pondérée d'un critère se calcule.

## Démo guidée (5 min)

Préparation (30s)

1. Exécuter `npm run db:reset` puis `npm run db:seed:demo`.
2. Lancer `npm run dev`.
3. Ouvrir `http://localhost:5173`.

Scénario (4 min)

1. **Phase 1.1**: Générer des questions d'entretien sur un critère.
2. **Phase 1.2**: Montrer la saisie documentaire + convention d'audit.
3. **Phase 1.3**: Ajouter un créneau d'entretien et afficher les suggestions par thème.
4. **Phase 1.4**: Créer une note d'entretien et saisir un score de conformité.
5. **Phase 1.5**: Générer un rapport, l'ouvrir, puis l'exporter en `.md`.

Message de clôture (30s)

- Rubis couvre le flux audit de bout en bout en mode offline-first.
- Les données sont locales (`apps/api/data/rubis.json`) et réinitialisables.
- Le socle est prêt pour industrialiser (workflow, contrôle qualité, IA avancée, génération de livrables).

## Workspaces

- apps/api
- apps/web
- packages/shared

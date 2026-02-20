# Rubis - Quick Start Guide

## ⚡ Démarrage 5 minutes

### Mode 1: Online (OpenAI - Rapide)

```powershell
# 1. Configurer clé OpenAI
# Créer apps/api/.env:
OPENAI_API_KEY=sk-proj-YOUR_KEY

# 2. Lancer
npm run dev

# 3. Ouvrir http://localhost:5173
```

**Vitesse** : 2-5s par question
**Coût** : ~€0.005/question
**Besoin** : Internet

---

### Mode 2: Offline (Ollama - Gratuit)

```powershell
# 1. Setup Ollama (automatisé)
.\setup-ollama.ps1
# Attend ~20min (télécharge 2.3GB Mistral)

# 2. Terminal 1 - Lancer Ollama
ollama serve

# 3. Terminal 2 - Lancer Rubis
npm run dev

# 4. Ouvrir http://localhost:5173
```

**Vitesse** : 5-10s par question
**Coût** : Gratuit
**Besoin** : Aucun (100% local)

---

## 🎯 Workflow de Base

1. **Créer campagne audit** ("ISO 19011 2026")
2. **Ajouter critère** ("C1 - Gouvernance")
3. **Uploader référentiel** (PDF ou Excel)
4. **Générer questions** (Ollama ou OpenAI)
5. **Ajouter interviewés** (RSSI, etc.)
6. **Créer créneau entretien**
7. **Saisir notes + scores**
8. **Générer rapport** (Markdown)
9. **Exporter** (CSV logs, matrice, docx report)

---

## 📊 Dashboard

Vue synthétique une fois campagne chargée:
- KPIs (docs, interviewés, questions, notes, rapports)
- Matrice de conformité par critère
- Dernières actions (audit log)
- **Exports** : CSV, DOCX, Markdown

---

## 🔧 Configuration Avancée

**Fichier `.env`** (`apps/api/`):
```env
# IA Provider
OPENAI_API_KEY=sk-...           # Optional: OpenAI
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b-q4_0

# API
API_PORT=4000
```

**Fallback automatique** :
- Si OpenAI dispo → utilise OpenAI
- Sinon → utilise Ollama local
- Erreur → affiche message clair

---

## 📁 Structure

```
apps/api/               (Node.js/Fastify)
  ├─ src/
  │   ├─ server.ts     (Endpoints REST)
  │   ├─ db.ts         (lowdb JSON)
  │   └─ services/
  │       ├─ openai.ts    (OpenAI + Ollama)
  │       └─ ...
  └─ data/rubis.json   (Base locale)

apps/web/               (React/Vite)
  └─ src/App.tsx       (UI monolithe)

.env                    (Config)
SETUP_OLLAMA.md         (Guide Ollama)
SETUP_OPENAI.md         (Guide OpenAI)
```

---

## 🚀 Prochains pas

- UI améliorée (thème audit pro)
- Auth (roles auditeur/admin)
- Multi-campaigns Dashboard
- PDF export (reports détaillés)
- Sync Outlook calendrier

---

## ❓ Questions?

- `SETUP_OLLAMA.md` - Guide Ollama complet
- `SETUP_OPENAI.md` - Guide OpenAI + tarifs
- `README.md` - Architecture globale
- Code: `apps/api/src/services/openai.ts` - Logique dual AI

**Enjoy Rubis! 🎯**

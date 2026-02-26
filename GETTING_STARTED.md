# Guide de Démarrage Rubis

## 🐧 WSL2 / Linux (équivalent)

```bash
# Terminal WSL2 dans le dossier du projet
cd ~/Rubis

# Première fois
./install-ollama.sh

# Fois suivantes
./start-rubis.sh

# Browser
http://localhost:5173
```

Notes WSL2 :
- Utiliser de préférence un dossier Linux (`~/Rubis`) plutôt que `/mnt/c/...` pour de meilleures performances.
- Si besoin d'exécution : `chmod +x *.sh`

### Troubleshooting WSL2

**Port déjà utilisé (11434 ou 5173)**
- Vérifier les processus dans WSL: `ss -ltnp | grep -E '11434|5173|4000'`
- Stopper un process: `kill <PID>`
- Si Ollama tourne déjà côté Windows, ne pas relancer `ollama serve` dans WSL.

**Accès navigateur à l'app**
- Ouvrir `http://localhost:5173` depuis Windows (WSL2 expose localhost automatiquement).
- Si inaccessible, vérifier que le serveur Vite est bien lancé et sans erreur.

**Performance lente sous `/mnt/c/...`**
- Symptômes: hot-reload lent, `npm install` plus long.
- Solution recommandée: cloner/déplacer le repo dans le home Linux (`~/Rubis`).

**Scripts `.sh` non exécutables**
- Rendre exécutables: `chmod +x install-ollama.sh setup-ollama.sh start-rubis.sh`
- Lancer explicitement avec bash si besoin: `bash ./start-rubis.sh`

**Fin de ligne CRLF (erreur `^M`)**
- Convertir en LF: `sed -i 's/\r$//' *.sh`
- Config Git recommandée dans WSL: `git config --global core.autocrlf input`

**Ollama installé sur Windows seulement**
- Option A (simple): utiliser les scripts PowerShell côté Windows.
- Option B (WSL natif): installer Ollama dans WSL via `./install-ollama.sh`.

## 🚀 Démarrage Ultra-Rapide (2 scripts)

### Étape 1 : Installer Ollama + Mistral (une seule fois)

```powershell
# PowerShell dans c:\VS_Code\Rubis
.\install-ollama.ps1
```

**Ce que fait ce script** :
1. Vérifie Ollama installé (sinon demande confirmation d'installation)
2. Demande les privileges admin (si nécessaire)
3. Télécharge l'installer Ollama (~150MB)
4. Lance l'installation (wizard automatique)
5. Lance `setup-ollama.ps1` pour télécharger Mistral
6. Attends ~20-30 minutes (2.3GB download)

**Résultat** : Ollama + Mistral 7B Q4 prêt

---

### Étape 2 : Démarrer Rubis

```powershell
# PowerShell dans c:\VS_Code\Rubis
.\start-rubis.ps1
```

**Ce que fait ce script** :
1. Vérifie Ollama installé
2. Lance Ollama en arrière-plan (nouveau terminal)
3. Attend 5-10s qu'Ollama démarre
4. Installe npm deps si manquantes
5. Lance `npm run dev`
6. Ouvre Rubis sur http://localhost:5173

**Résultat** : Rubis accessible immédiatement ✅

---

## 📋 Étapes en détail

### Première fois (Setup = 30 min)

```powershell
# 1. Ouvrir PowerShell
# 2. Naviguer vers Rubis
cd c:\VS_Code\Rubis

# 3. Installer Ollama + Mistral
.\install-ollama.ps1
# → Vai automatiquement télécharger et configurer

# 4. Attendre la fin (voir messages "OK" finaux)
```

**Après**, tu verras :
```
[OK] Mistral 7B downloaded successfully!
[OK] Setup Ollama Complete!
```

### Fois suivantes (Démarrage = 30 sec)

```powershell
# 1. PowerShell dans c:\VS_Code\Rubis
.\start-rubis.ps1

# 2. Attendre "Rubis is starting on http://localhost:5173"
# 3. Ouvrir navigateur → http://localhost:5173
```

---

## 🔧 Alternative : Démarrage Manuel

Si tu préfères contrôler chaque étape :

```powershell
# Terminal 1 - Lancer Ollama
ollama serve

# Terminal 2 - Lancer Rubis
npm run dev

# Browser
http://localhost:5173
```

---

## 📊 Workflow Audit

Une fois Rubis ouvert :

1. **Créer campagne** (ex: "ISO 19011 Audit 2026")
2. **Ajouter critères** (ex: "C1 - Gouvernance")
3. **Uploader référentiel** (PDF ou Excel)
4. **Générer questions** ← Ollama/OpenAI travaille ici
5. **Ajouter interviewés**
6. **Créer créneaux entretien**
7. **Saisir notes + scores**
8. **Exporter (CSV, DOCX, MD)**

---

## ❓ Troubleshooting

### Script `install-ollama.ps1` échoue

```powershell
# Option 1 : Installation manuelle
# 1. Ouvrir https://ollama.ai/download
# 2. Télécharger OllamaSetup.exe
# 3. Installer manuellement
# 4. Relancer install-ollama.ps1
```

### Ollama très lent (> 30s/question)

**Normal** pour CPU seul. Solutions :

```powershell
# Essayer modèle plus rapide (moins bon mais 2x plus rapide)
ollama pull phi:2.7b-chat-q4_0

# Puis modifier apps/api/.env :
OLLAMA_MODEL=phi:2.7b-chat-q4_0
```

### "Ollama not found" même après installation

```powershell
# Redémarrer PowerShell
exit

# Ou ajouter Ollama au PATH manuellement
$env:Path += ";C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama"
```

---

## 💡 Tips Productivité

**Faire tourner Ollama en background** :
```powershell
# Lancer Ollama une fois au démarrage du PC
ollama serve &
```

**Garder Rubis ouvert** pour audits multiples :
- Une campagne = une URL
- Données persistantes (base JSON locale)

**Changer modèle IA** :
```powershell
# Pour tester d'autres modèles
ollama pull neural-chat:7b-q4_0

# Modifier .env :
OLLAMA_MODEL=neural-chat:7b-q4_0
```

---

## 📚 Documentation

- `README.md` - Architecture générale
- `SETUP_OLLAMA.md` - Guide Ollama détaillé
- `SETUP_OPENAI.md` - Guide OpenAI (alternative cloud)
- `QUICKSTART.md` - Workflow de base

---

## 🎯 Démarrage en 3 commandes

```powershell
cd c:\VS_Code\Rubis
.\install-ollama.ps1              # Première fois (30 min)
.\start-rubis.ps1                 # Fois suivantes (30 sec)
```

**C'est tout !** 🚀

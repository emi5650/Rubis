# Rubis - Manuel Git Commit & Push Instructions

## Situation
Git n'est pas installé sur ce système de build. Voici comment faire le commit et push manuellement sur ton PC.

## Étape 1 : Installer Git (si pas encore fait)

1. Télécharger Git pour Windows : https://git-scm.com/download/win
2. Installer avec les options par défaut
3. Redémarrer PowerShell

## Étape 2 : Exécuter les commandes Git

Ouvrir PowerShell dans `c:\VS_Code\Rubis` et lancer :

```powershell
# Configuration initiale
git config user.name "Rubis Audit Tool"
git config user.email "rubis@audit.local"

# Initialiser repo
git init

# Ajouter tous les fichiers
git add .

# Créer le commit
git commit -m "Initial commit: Rubis offline-first audit tool

Features:
- Dual AI strategy (OpenAI + Ollama local)
- Automated setup (install-ollama.ps1, start-rubis.ps1)  
- 100% offline operation after setup
- Complete audit workflow (5 phases + sprint 1)
- Dashboard with KPIs and conformity matrix
- Export capabilities (CSV, DOCX, Markdown)
- Audit logging and tracking
- Question generation from referential (PDF/Excel)

Tech Stack:
- API: Node.js + Fastify + lowdb
- Frontend: React + Vite + TypeScript
- Local persistence: JSON database
- AI: OpenAI API or local Ollama (Mistral 7B Q4)

Documentation:
- GETTING_STARTED.md - Quick start guide
- SETUP_OLLAMA.md - Local AI setup
- SETUP_OPENAI.md - Cloud AI setup
- README.md - Architecture overview"

# Ajouter le remote GitHub
git remote add origin git@github.com:emi5650/Rubis.git

# Changer le nom de la branche en "main"
git branch -M main

# Pousser vers GitHub
git push -u origin main
```

## Si le push échoue avec "Permission denied"

Cela signifie que la clé SSH n'est pas configurée. Alternatives :

### Option A : Configurer SSH Key
```powershell
ssh-keygen -t ed25519 -C "rubis@audit.local"
# Ajouter la clé publique sur GitHub : https://github.com/settings/keys
```

### Option B : Utiliser HTTPS à la place
```powershell
# Remplacer le remote
git remote set-url origin https://github.com/emi5650/Rubis.git

# Puis pousser (demandra token)
git push -u origin main
```

## Génération du Token GitHub (pour HTTPS)

1. Aller sur https://github.com/settings/tokens
2. Créer un nouveau token avec `repo` scope
3. Copier le token
4. Lors de `git push`, utiliser :
   - Username : `emi5650`
   - Password : `(coller le token)`

## Verifier le push

Une fois complété, vérifier sur :
https://github.com/emi5650/Rubis

---

**Besoin d'aide ?**
```powershell
git status                  # Voir les fichiers en attente
git log                     # Voir les commits
git remote -v              # Voir les remotes configurés
```

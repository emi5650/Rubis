# Migration vers WSL2 (Rubis)

## Objectif

Migrer un environnement de dev Rubis depuis Windows vers WSL2 pour de meilleures performances (npm, hot reload, filesystem).

## Option rapide (recommandée)

Depuis PowerShell (admin), à la racine du repo:

```powershell
.\bootstrap-wsl2.ps1
```

Le script:
- installe/répare WSL2 + Ubuntu si nécessaire
- redémarre Windows si requis
- installe Node.js 20 dans WSL
- exécute `migrate-to-wsl2.sh`

Après redémarrage, relancer si besoin:

```powershell
.\bootstrap-wsl2.ps1 -PostInstallOnly
```

## Pré-requis

- Windows 11
- WSL2 installé avec une distribution Linux (Ubuntu recommandé)
- Node.js et npm installés dans WSL

## 1) Vérifier WSL2 côté Windows

Dans PowerShell:

```powershell
wsl --status
wsl -l -v
```

Si ces commandes affichent seulement l'aide (cas de certaines installations), forcer l'installation puis redémarrer:

```powershell
wsl --install -d Ubuntu
shutdown /r /t 0
```

Après redémarrage, ouvrir Ubuntu une première fois pour finaliser l'utilisateur Linux, puis relancer:

```powershell
wsl --status
wsl --list --online
```

Si aucune distribution n'est installée:

```powershell
wsl --install -d Ubuntu
```

## 2) Préparer Node.js dans WSL

Dans Ubuntu/WSL:

```bash
sudo apt-get update
sudo apt-get install -y curl ca-certificates
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential
node -v
npm -v
```

## 3) Copier le repo vers le filesystem Linux

Option recommandée (automatisée), depuis WSL:

```bash
cd /mnt/c/VS_Code/Rubis
bash ./migrate-to-wsl2.sh
```

Ce script:
- copie le projet vers `~/Rubis`
- exclut `node_modules` et artefacts
- corrige les fins de ligne des scripts `.sh`
- installe les dépendances npm

Option manuelle:

```bash
mkdir -p ~/Rubis
tar --exclude=node_modules --exclude=.git -C /mnt/c/VS_Code/Rubis -cf - . | tar -C ~/Rubis -xf -
cd ~/Rubis
npm install
```

## 4) Démarrer Rubis dans WSL

```bash
cd ~/Rubis
chmod +x *.sh
./install-ollama.sh
./start-rubis.sh
```

App web: http://localhost:5173
API health: http://localhost:4000/health

## 5) Ouvrir le projet dans VS Code (mode WSL)

Dans WSL:

```bash
cd ~/Rubis
code .
```

Vérifier en bas à gauche que VS Code est connecté en « WSL ». 

## 6) Vérifications post-migration

Dans WSL:

```bash
npm run typecheck
npm run dev
```

Tu dois voir:
- API sur `0.0.0.0:4000`
- Web sur `localhost:5173`

## Troubles fréquents

- Script non exécutable: `chmod +x *.sh`
- Erreur `^M`: `sed -i 's/\r$//' *.sh`
- Ports occupés: `ss -ltnp | grep -E '11434|5173|4000'`
- Lenteur: vérifier que le repo est bien dans `~/Rubis` et pas sous `/mnt/c/...`

## Retour arrière rapide

Si besoin, tu peux continuer à utiliser les scripts PowerShell Windows:
- `install-ollama.ps1`
- `setup-ollama.ps1`
- `start-rubis.ps1`

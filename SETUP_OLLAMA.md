# Configuration Ollama pour Rubis (Offline Mode)

## Vue d'ensemble

Ollama permet de faire tourner un modèle LLM (Mistral 7B) **100% en local** sur ton PC sans connexion Internet. C'est parfait pour les audits offline sur site client.

**Avantage** : Zéro coût opérationnel une fois Mistral téléchargé.

---

## 1. Installation Ollama

### Windows 11 (Ryzen 5 8540U)

1. Télécharger Ollama depuis https://ollama.ai/download (chercher Windows)
2. Double-cliquer l'installer `.exe`
3. Suivre le wizard (accepter les emplacements par défaut)
4. Ollama sera ajouté au système et accessible via terminal

### Vérifier l'installation

```powershell
ollama --version
# Output: ollama version X.X.X
```

---

## 2. Télécharger le modèle Mistral Q4

Ouvrir PowerShell et lancer :

```powershell
ollama pull mistral:7b-q4_0
```

**Détails** :
- Taille : 2.3 GB
- Temps : ~15-30 minutes (dépend connexion)
- Destination : `C:\Users\[user]\.ollama\models`

**Téléchargement rapide ?** Vérifier tu as au moins 5 GB disponible sur C:

```powershell
Get-PSDrive C | Select-Object @{Name="Libre (GB)"; Expression={[math]::Round($_.Free / 1GB, 2)}}
```

---

## 3. Lancer Ollama en local

```powershell
ollama serve
```

**Output attendu** :
```
pulling manifest
pulling 7e2a...
...
 100% ████████████████████████ 4.3 GB
Listening on 127.0.0.1:11434
```

**Laisser ouvert** - Ollama tourne now en arrière-plan sur `localhost:11434`

---

## 4. Configurer Rubis pour Ollama

### Fichier `.env` (apps/api)

1. Créer/modifier `apps/api/.env`:

```env
# Ollama offline mode
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b-q4_0

# OpenAI (optionnel, sera ignoré si Ollama dispo)
# OPENAI_API_KEY=

# API
API_PORT=4000
```

2. **Ne pas** fournir `OPENAI_API_KEY` (Rubis utilisera Ollama)

### Lancer Rubis avec Ollama

```powershell
# Terminal 1: Démarrer Ollama
ollama serve

# Terminal 2: Démarrer Rubis
npm run dev
```

Rubis détectera Ollama automatiquement et l'utilisera pour générer les questions.

---

## 5. Test Ollagma directement

Avant de tester Rubis, vérifier que Ollama fonctionne :

```powershell
# PowerShell
$body = @{
    model = "mistral:7b-q4_0"
    prompt = "Explain ISO 19011 in 100 words"
    stream = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:11434/api/generate" `
    -Method Post `
    -Body $body `
    -ContentType "application/json" | Select -ExpandProperty response
```

**Temps attendu** : 5-15 secondes pour première réponse.

---

## 6. Test Rubis avec Ollama

1. Ouvrir http://localhost:5173
2. Naviguer vers section "Générer des questions via IA"
3. Uploader un référentiel PDF/Excel
4. Cliquer "Générer via IA"
5. Attendre 10-30s (Ollama travaille)
6. Questions doivent apparaître

**Performance attendue** :
- Première question: 15-30s (model loading)
- Questions suivantes: 5-10s chacune

---

## 7. Troubleshooting

### "Connection refused at localhost:11434"
→ Vérifier que Ollama est bien lancé (`ollama serve` dans terminal)

### "Model not found: mistral:7b-q4_0"
→ Relancer `ollama pull mistral:7b-q4_0`

### Très lents (> 30s/question)
→ Normal sur CPU. Vérifier CPU pas surchargé (Task Manager).
→ Sinon, essayer modèle plus petit: `ollama pull phi:2.7b-chat-q4_0`

### "CUDA out of memory"
→ GPU insuffisant. Passer à CPU seulement :
```env
OLLAMA_GPU=0
```

### Fichier `.env` ignoré
→ Vérifier chemin: doit être dans `apps/api/.env` exactement

---

## 8. Fallback OpenAI

Si tu configures **les deux** `OPENAI_API_KEY` ET Ollama :
1. Rubis essaie OpenAI en premier
2. Si OpenAI échoue → fallback à Ollama

Utile si tu veux online-first (rapide) avec offline (fallback).

```env
OPENAI_API_KEY=sk-...
OLLAMA_URL=http://localhost:11434
```

---

## 9. Performances estimées

| Modèle | Taille | Vitesse | Qualité |
|--------|--------|---------|---------|
| Mistral Q4 | 2.3GB | 5-10s | ⭐⭐⭐⭐ |
| Mistral Q5 | 3.3GB | 8-15s | ⭐⭐⭐⭐ |
| Phi 2.7B Q4 | 1.4GB | 3-5s | ⭐⭐⭐ |

**Recommandation** : Mistral Q4 = meilleur rapport vitesse/qualité

---

## 10. Références

- Ollama docs: https://github.com/ollama/ollama
- Mistral 7B: https://mistral.ai/
- Models disponibles: `ollama list`

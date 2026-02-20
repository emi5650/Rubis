# Configuration OpenAI pour Rubis

## Obtenir une clé API OpenAI

1. Aller sur https://platform.openai.com/api-keys
2. S'authentifier (créer un compte si nécessaire)
3. Cliquer sur "Create new secret key"
4. Copier la clé (elle ne sera plus visible après)

## Configurer Rubis

1. Créer le fichier `apps/api/.env`:
   ```
   OPENAI_API_KEY=sk-proj-VOTRE_CLE_OPENAI
   API_PORT=4000
   ```

2. Vérifier que la clé est bien définie:
   - Windows PowerShell: `$env:OPENAI_API_KEY` (doit afficher votre clé)
   - macOS/Linux: `echo $OPENAI_API_KEY` (doit afficher votre clé)

## Utiliser la génération de questions via IA

1. Démarrer l'application: `npm run dev`
2. Ouvrir http://localhost:5173
3. Créer une campagne (ex: "Audit PASSI")
4. Créer un critère (ex: "C1 - Gouvernance")
5. Section "Générer des questions via IA (référentiel)":
   - Choisir un fichier PDF ou Excel comme référentiel
   - Indiquer le nombre de questions à générer (1-10)
   - Cliquer "Générer via IA"
   - Attendre 5-10 secondes
   - Les questions apparaissent avec texte, guidance, et thème

## Tarification OpenAI

- Modèle utilisé: `gpt-4o` (~$0.005 par question générique)
- Coût estimé: $0.05 pour 10 questions

## Fichiers de référentiel supportés

- **PDF**: Tout PDF contenant des exigences, normes, standards
- **Excel**: Feuilles avec colonnes d'exigences (A1, A2.1, etc.)
- **Limites**: 50KB max de contenu extrait (limitation pour API)

## Dépannage

### "OPENAI_API_KEY not configured"
→ Vérifier que le fichier `.env` existe et contient votre clé

### "Failed to parse PDF"
→ Le PDF peut être sécurisé ou corrompu, tester avec un autre fichier

### "No text response from OpenAI"
→ Erreur API, vérifier la clé est valide sur https://platform.openai.com/account/billing/overview

### Timeout après 10s
→ Augmenter le timeout ou tester avec mois de questions à générer

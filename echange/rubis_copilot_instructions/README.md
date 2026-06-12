# Rubis — POC Audit ISO19011 (RAG + OpenAI) — Instructions Copilot

Ce pack est destiné à être **copié/collé** dans VS Code / GitHub Copilot pour implémenter rapidement un POC
dans le repo `emi5650/Rubis` (monorepo TS : `apps/api`, `apps/web`, `packages/shared`).

Objectif POC :
- Revue documentaire (RAG) **par contrôle** avec **citations obligatoires**
- Génération de questions complémentaires
- Scoring **déterministe** (matrice fournie)
- Génération d’un draft de rapport (ISO 19011 + structure Annexe C RGS)
- Dataset “École” pour tests et démo

Important :
- L’IA **propose**, l’auditeur **valide**
- **Aucune conclusion sans citations**
- Si preuve insuffisante : `INDETERMINE` + questions complémentaires

Contenu :
- `COPILOT_PROMPT.md` : prompt “one-shot” à passer à Copilot
- `FILES_TO_CREATE.md` : fichiers à créer/modifier (checklist)
- `ARCHITECTURE.md` : architecture logique (modules)
- `DATA_SCHOOL_GUIDE.md` : structure des données “École”
- `SECURITY_AND_GOVERNANCE.md` : garde-fous (usage OpenAI, traçabilité)
- `MIGRATION_OPENAI_TO_AWS.md` : comment passer de OpenAI (web/API) à un modèle sur AWS

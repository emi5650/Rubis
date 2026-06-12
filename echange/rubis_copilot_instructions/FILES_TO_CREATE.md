# Checklist fichiers (création/modification)

## À créer
apps/api/src/services/embeddings.ts
apps/api/src/services/vectorStore.ts
apps/api/src/services/retrieval.ts
apps/api/src/services/chunking.ts
apps/api/src/services/documentIngest.ts
apps/api/src/services/auditEvaluator.ts
apps/api/src/services/scoring.ts
apps/api/src/services/attackPaths.ts
apps/api/src/services/reportGenerator.ts

apps/api/src/routes/audit.ts
apps/api/tests/school_regression.test.ts

packages/shared/src/audit.types.ts

data_school/
  audited_org_profile.md
  docs/README.md
  referentials/README.md
  matrices/scoring_matrix.yaml
  expected/README.md

## À modifier
apps/api/src/services/openai.ts
- ajouter `generateAuditFindingStrictJSON(...)`
- ajouter schémas Zod : CitationSchema, ControlFindingSchema

apps/api/src/index.ts (ou route registration)
- enregistrer la route `audit.ts`

apps/web (optionnel pour POC)
- un écran minimal qui appelle /api/audits/:id/run puis affiche findings

## À ne pas faire maintenant
- Contenu des contrôles (référentiels) : sera ajouté ensuite.
- DOCX/PDF final : rester sur Markdown pour le POC.

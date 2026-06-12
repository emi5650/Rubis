# Architecture logique (POC)

## Flux principal
1) Ingest
- parse texte -> chunking -> embeddings -> vectorStore
- registre de documents : docId, title, sha256, mimeType, timestamps

2) Retrieval (RAG)
- query (exigence/contrôle) -> embed -> topK chunks
- génère `contextText` borné + `citations[]` (docId, docTitle, page, section, excerpt, chunkId)

3) Évaluation contrôle (IA encadrée)
- fournir à l’IA : control metadata + contextText + citations list
- sortie JSON strict `ControlFinding`
- interdiction d’inventer citations : l’IA ne peut citer que `chunkId` présents

4) Scoring (déterministe)
- mapping statut -> score (YAML)
- pondération par domaine + contrôle
- globalScore + byDomain + byControl

5) Attack paths (audit-friendly)
- templates haut niveau selon familles de non-conformités

6) Rapport (Markdown)
- plan ISO19011 : objectif/périmètre/méthodo/constats/conclusions
- annexes : tableaux constats et questions (CSV)

## Principes “audit-grade”
- Toute conclusion doit être traçable à une preuve (citation).
- En cas d’absence de preuve -> INDETERMINE + questions.
- L’auditeur valide / modifie les statuts.

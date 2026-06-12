# Prompt unique à donner à Copilot (copier-coller)

You are working inside the existing monorepo `Rubis` (TypeScript) with `apps/api` (Fastify) and `apps/web` (React/Vite),
and `packages/shared` for shared types. Implement a complete RAG-based audit POC for ISO19011-style documentary review.

## Requirements (non-negotiable)
- The AI may propose findings, questions, and report drafts, but **final audit decision is human**.
- **No conclusion without citations**. Citations must come only from retrieved document chunks; never invent.
- If evidence is missing or ambiguous: set status to `INDETERMINE`, list evidence gaps, and generate follow-up questions.
- Keep **deterministic scoring** (no AI) using a YAML scoring matrix and control weights.
- Provide a "school" dataset folder layout for regression tests (documents can be placeholders).
- Validate all AI outputs with Zod schemas. If schema validation fails, retry once with stricter instruction; if still fails, return an error.

## New services to add under apps/api/src/services
1) embeddings.ts
- Use OpenAI embeddings model via OpenAI SDK.
- Export: embedTexts(texts), embedQuery(query).
2) vectorStore.ts
- Implement a simple local vector store for POC (cosine similarity in-memory + persisted in lowdb OR JSON files).
- Types include chunkId, docId, page, section, text, embedding.
3) retrieval.ts
- query -> embed -> topK chunks -> return RetrievedContext with citations + bounded contextText.
4) chunking.ts
- Chunk by pages/paragraphs, keep page/section metadata when possible.
5) documentIngest.ts
- Ingest documents from a folder; compute sha256; parse text; chunk; embed; store chunks; register docs.
6) auditEvaluator.ts
- evaluateControl(controlId, referentialId, auditId) -> ControlFinding JSON with citations, confidence, gaps, follow-up questions.
- Must call retrieval.ts and then the AI with contextText and citations list, forcing the model to reference only those citations.
7) scoring.ts
- Deterministic scoring: compute byControl, byDomain, globalScore from findings using YAML weights and control weights.
8) attackPaths.ts
- Derive HIGH-LEVEL attack paths from NON_CONFORME / PARTIEL findings (non-exploitable, audit-friendly).
9) reportGenerator.ts
- Generate a Markdown report draft following ISO19011 structure; include annexes tables (CSV strings).

## Extend existing apps/api/src/services/openai.ts
- Add a function generateAuditFindingStrictJSON(...) that:
  - Takes (control metadata, retrieved contextText, citations list, output schema)
  - Enforces "citations must match provided chunkIds/docIds/pages"
  - Returns parsed output validated by Zod
- Keep existing provider switch (OpenAI/Ollama) but POC should work with OpenAI.

## API routes (Fastify)
Create apps/api/src/routes/audit.ts with:
- POST /api/audits               (create audit)
- POST /api/audits/:id/ingest    (ingest school docs folder path)
- POST /api/audits/:id/run       (run evaluation for selected referential controls)
- GET  /api/audits/:id/findings
- GET  /api/audits/:id/score
- GET  /api/audits/:id/report

## Shared types
Create packages/shared/src/audit.types.ts exporting:
- ControlStatus, Citation, ControlFinding, ScoreResult, AttackPath, AuditMeta

## Data school folder
Create data_school/ with:
- audited_org_profile.md
- docs/ (placeholders)
- referentials/ (empty placeholders for now)
- matrices/scoring_matrix.yaml
- expected/ (placeholders)
Do NOT implement controls content now, only the structure and parsers.

## Tests
Add apps/api/tests/school_regression.test.ts:
- Ingest docs, run a small subset of controls (if any exist), assert:
  - findings array exists
  - each finding has >=1 citation OR status INDETERMINE with non-empty gaps
  - scoring returns numeric globalScore
  - report markdown is non-empty

## Config
Add config loader:
- OPENAI_API_KEY
- OPENAI_MODEL
- OPENAI_EMBEDDINGS_MODEL
- TOP_K
- MAX_CONTEXT_CHARS

Implement everything with clear TypeScript types, Zod validation, and good error messages.

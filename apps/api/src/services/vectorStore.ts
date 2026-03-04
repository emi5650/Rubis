import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface StoredChunk {
  chunkId: string;
  docId: string;
  docTitle: string;
  page: number | null;
  section: string;
  text: string;
  embedding: number[];
}

interface VectorState {
  auditId: string;
  chunks: StoredChunk[];
  updatedAt: string;
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const vectorRoot = resolve(currentDir, "../../data/audit-vectors");
mkdirSync(vectorRoot, { recursive: true });

function vectorFilePath(auditId: string) {
  return resolve(vectorRoot, `${auditId}.json`);
}

export function loadVectorState(auditId: string): VectorState {
  const filePath = vectorFilePath(auditId);
  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as VectorState;
    return {
      auditId,
      chunks: Array.isArray(parsed.chunks) ? parsed.chunks : [],
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString()
    };
  } catch {
    return { auditId, chunks: [], updatedAt: new Date().toISOString() };
  }
}

export function saveVectorState(state: VectorState) {
  const filePath = vectorFilePath(state.auditId);
  const payload: VectorState = {
    auditId: state.auditId,
    chunks: state.chunks,
    updatedAt: new Date().toISOString()
  };
  writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
}

export function replaceChunks(auditId: string, chunks: StoredChunk[]) {
  saveVectorState({ auditId, chunks, updatedAt: new Date().toISOString() });
}

function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  if (length === 0) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function searchTopK(auditId: string, queryEmbedding: number[], topK: number) {
  const state = loadVectorState(auditId);
  return state.chunks
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, topK);
}

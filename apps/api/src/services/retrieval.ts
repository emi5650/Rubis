import { embedQuery } from "./embeddings.js";
import { searchTopK } from "./vectorStore.js";

export interface RetrievedCitation {
  chunkId: string;
  docId: string;
  docTitle: string;
  page: number | null;
  section: string;
  excerpt: string;
}

export interface RetrievedContext {
  contextText: string;
  citations: RetrievedCitation[];
}

export async function retrieveContext(input: {
  auditId: string;
  query: string;
  topK?: number;
  maxContextChars?: number;
}): Promise<RetrievedContext> {
  const topK = input.topK ?? Number(process.env.TOP_K || 5);
  const maxContextChars = input.maxContextChars ?? Number(process.env.MAX_CONTEXT_CHARS || 5000);

  const queryEmbedding = await embedQuery(input.query);
  const hits = searchTopK(input.auditId, queryEmbedding, topK);

  const citations = hits.map((hit) => ({
    chunkId: hit.chunk.chunkId,
    docId: hit.chunk.docId,
    docTitle: hit.chunk.docTitle,
    page: hit.chunk.page,
    section: hit.chunk.section,
    excerpt: hit.chunk.text.slice(0, 320)
  }));

  let contextText = "";
  for (const hit of hits) {
    const block = `[${hit.chunk.chunkId}] ${hit.chunk.docTitle}${hit.chunk.section ? ` / ${hit.chunk.section}` : ""}\n${hit.chunk.text}\n\n`;
    if ((contextText + block).length > maxContextChars) {
      break;
    }
    contextText += block;
  }

  return { contextText: contextText.trim(), citations };
}

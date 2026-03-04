import OpenAI from "openai";
import { createHash } from "node:crypto";

const EMBEDDING_DIMENSION = 64;

function getEmbeddingClient() {
  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

function localDeterministicEmbedding(text: string): number[] {
  const hash = createHash("sha256").update(text, "utf8").digest();
  const vector = new Array<number>(EMBEDDING_DIMENSION).fill(0);
  for (let index = 0; index < EMBEDDING_DIMENSION; index += 1) {
    const source = hash[index % hash.length] ?? 0;
    vector[index] = source / 255;
  }
  return vector;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const client = getEmbeddingClient();
  if (!client) {
    return texts.map((text) => localDeterministicEmbedding(text));
  }

  const model = process.env.OPENAI_EMBEDDINGS_MODEL || "text-embedding-3-small";
  const response = await client.embeddings.create({
    model,
    input: texts
  });

  return response.data.map((item) => item.embedding);
}

export async function embedQuery(query: string): Promise<number[]> {
  const [vector] = await embedTexts([query]);
  return vector ?? localDeterministicEmbedding(query);
}

import { randomUUID } from "node:crypto";

export interface TextChunk {
  chunkId: string;
  docId: string;
  docTitle: string;
  page: number | null;
  section: string;
  text: string;
}

export function chunkText(input: {
  docId: string;
  docTitle: string;
  text: string;
  maxCharsPerChunk?: number;
}): TextChunk[] {
  const maxCharsPerChunk = input.maxCharsPerChunk ?? 1000;
  const lines = input.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const chunks: TextChunk[] = [];
  let current = "";
  let currentSection = "intro";

  for (const line of lines) {
    if (/^#{1,6}\s/.test(line)) {
      currentSection = line.replace(/^#{1,6}\s*/, "").slice(0, 120) || "section";
      continue;
    }

    if ((current + "\n" + line).length > maxCharsPerChunk && current.length > 0) {
      chunks.push({
        chunkId: randomUUID(),
        docId: input.docId,
        docTitle: input.docTitle,
        page: null,
        section: currentSection,
        text: current.trim()
      });
      current = line;
    } else {
      current = current.length > 0 ? `${current}\n${line}` : line;
    }
  }

  if (current.length > 0) {
    chunks.push({
      chunkId: randomUUID(),
      docId: input.docId,
      docTitle: input.docTitle,
      page: null,
      section: currentSection,
      text: current.trim()
    });
  }

  return chunks;
}

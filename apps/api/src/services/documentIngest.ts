import { createHash, randomUUID } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { chunkText } from "./chunking.js";
import { embedTexts } from "./embeddings.js";
import { replaceChunks, type StoredChunk } from "./vectorStore.js";

export interface IngestSummary {
  auditId: string;
  ingestedDocuments: number;
  ingestedChunks: number;
  skippedFiles: string[];
}

function walkFiles(folderPath: string): string[] {
  const entries = readdirSync(folderPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolute = join(folderPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(absolute));
      continue;
    }

    if (entry.isFile()) {
      files.push(absolute);
    }
  }

  return files;
}

function readTextFile(filePath: string) {
  return readFileSync(filePath, "utf8");
}

export async function ingestDocumentsFromFolder(input: {
  auditId: string;
  folderPath: string;
}): Promise<IngestSummary> {
  const absoluteFolder = resolve(input.folderPath);
  const files = walkFiles(absoluteFolder);
  const acceptedExtensions = new Set([".md", ".txt"]);

  const storedChunks: StoredChunk[] = [];
  const skippedFiles: string[] = [];
  let ingestedDocuments = 0;

  for (const filePath of files) {
    const extension = extname(filePath).toLowerCase();
    if (!acceptedExtensions.has(extension)) {
      skippedFiles.push(filePath);
      continue;
    }

    const stats = statSync(filePath);
    if (stats.size === 0) {
      skippedFiles.push(filePath);
      continue;
    }

    const text = readTextFile(filePath);
    const docId = createHash("sha256").update(filePath).digest("hex").slice(0, 16);
    const title = filePath.split("/").pop() || filePath;

    const chunks = chunkText({
      docId,
      docTitle: title,
      text
    });

    if (chunks.length === 0) {
      skippedFiles.push(filePath);
      continue;
    }

    const embeddings = await embedTexts(chunks.map((chunk) => chunk.text));

    chunks.forEach((chunk, index) => {
      storedChunks.push({
        chunkId: chunk.chunkId || randomUUID(),
        docId: chunk.docId,
        docTitle: chunk.docTitle,
        page: chunk.page,
        section: chunk.section,
        text: chunk.text,
        embedding: embeddings[index] || []
      });
    });

    ingestedDocuments += 1;
  }

  replaceChunks(input.auditId, storedChunks);

  return {
    auditId: input.auditId,
    ingestedDocuments,
    ingestedChunks: storedChunks.length,
    skippedFiles
  };
}

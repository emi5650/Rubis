import { extname } from "node:path";
import { parseReferentialFile } from "./referentialParser.js";

type RegistryField = {
  value?: string;
  confidence: "high" | "medium" | "low";
  source: "content" | "metadata" | "filename" | "user";
  evidence?: {
    snippet: string;
    matchedText?: string;
    locator?: { kind: "page" | "slide" | "sheet" | "line"; index?: number; name?: string };
  };
};

type ExtractionResult = {
  provider: "none";
  fields: {
    title: RegistryField;
    version: RegistryField;
    publishedAt: RegistryField;
    author: RegistryField;
    sensitivity: RegistryField;
  };
};

function normalizeDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function fallbackTitle(filename: string) {
  const ext = extname(filename);
  return filename.replace(ext, "").replace(/[_-]+/g, " ").trim();
}

function extractVersion(content: string) {
  const match = content.match(/\b(?:version|v(?:er)?\.?)[\s:=_-]*([0-9]+(?:\.[0-9]+){0,3})\b/i);
  return match?.[1]?.trim() || "";
}

function extractPublishedAt(content: string) {
  const iso = content.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso?.[1]) {
    return iso[1];
  }

  const fr = content.match(/\b(\d{2})[\/-](\d{2})[\/-](\d{4})\b/);
  if (fr) {
    return normalizeDate(`${fr[3]}-${fr[2]}-${fr[1]}`);
  }

  return "";
}

function extractAuthor(content: string) {
  const match = content.match(/\b(?:auteur|authors?)\s*[:\-]\s*([^\n\r]+)/i);
  return match?.[1]?.trim() || "";
}

function extractSensitivity(content: string) {
  const lower = content.toLowerCase();
  if (lower.includes("secret")) return "secret";
  if (lower.includes("confidentiel")) return "confidentiel";
  if (lower.includes("public")) return "public";
  return "interne";
}

export async function extractRegistryFields(input: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<ExtractionResult> {
  let contentExcerpt = "";
  let pageCountHint: number | null = null;

  if (!input.mimeType.startsWith("image/")) {
    try {
      const parsed = await parseReferentialFile(input.buffer, input.mimeType || input.filename);
      contentExcerpt = parsed.content.slice(0, 12000);
      pageCountHint = parsed.pageCount ?? null;
    } catch {
      contentExcerpt = "";
      pageCountHint = null;
    }
  } else {
    pageCountHint = 1;
  }

  const snippet = contentExcerpt.slice(0, 300) || `Document: ${input.filename}`;

  const normalizedExcerpt = contentExcerpt || "";
  const version = extractVersion(normalizedExcerpt);
  const publishedAt = extractPublishedAt(normalizedExcerpt);
  const author = extractAuthor(normalizedExcerpt);
  const sensitivity = extractSensitivity(normalizedExcerpt);

  return {
    provider: "none",
    fields: {
      title: {
        value: fallbackTitle(input.filename),
        confidence: "low",
        source: "filename",
        evidence: { snippet }
      },
      version: {
        value: version,
        confidence: version ? "medium" : "low",
        source: version ? "content" : "metadata",
        evidence: { snippet, matchedText: version || undefined }
      },
      publishedAt: {
        value: publishedAt,
        confidence: publishedAt ? "medium" : "low",
        source: publishedAt ? "content" : "metadata",
        evidence: { snippet, matchedText: publishedAt || undefined }
      },
      author: {
        value: author,
        confidence: author ? "medium" : "low",
        source: author ? "content" : "metadata",
        evidence: { snippet, matchedText: author || undefined }
      },
      sensitivity: {
        value: sensitivity,
        confidence: "low",
        source: "content",
        evidence: { snippet, matchedText: sensitivity }
      }
    }
  };
}

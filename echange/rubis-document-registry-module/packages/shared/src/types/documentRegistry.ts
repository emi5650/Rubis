
/**
 * Document Registry Shared Types
 * TODO: Extend if needed
 */

export type Confidence = "high" | "medium" | "low";
export type FieldSource = "content" | "metadata" | "filename" | "user";

export interface Evidence {
  snippet: string;
  locator?: {
    kind: "page" | "slide" | "sheet" | "line";
    index?: number;
    name?: string;
  };
  matchedText?: string;
}

export interface ExtractedField {
  value?: string;
  confidence: Confidence;
  source: FieldSource;
  evidence?: Evidence;
}

export interface DocumentRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  currentFileId: string;

  title: ExtractedField;
  version: ExtractedField;
  publishedAt: ExtractedField;
  author: ExtractedField;
  sensitivity: ExtractedField;

  status: "imported" | "extracted" | "needs_review" | "validated" | "archived";
}

export type ControlStatus = "CONFORME" | "PARTIEL" | "NON_CONFORME" | "INDETERMINE";

export interface Citation {
  chunkId: string;
  docId: string;
  docTitle: string;
  page?: number | null;
  section?: string;
  excerpt: string;
}

export interface ControlFinding {
  controlId: string;
  referentialId: string;
  status: ControlStatus;
  rationale: string;
  citations: Citation[];
  confidence: number;
  evidenceGaps: string[];
  followUpQuestions: string[];
  updatedAt: string;
}

export interface ScoreResult {
  globalScore: number;
  byDomain: Array<{ domain: string; score: number }>;
  byControl: Array<{ controlId: string; score: number }>;
}

export interface AttackPath {
  id: string;
  title: string;
  relatedControlIds: string[];
  riskLevel: "low" | "medium" | "high";
  summary: string;
}

export interface AuditMeta {
  id: string;
  name: string;
  referentialId: string;
  createdAt: string;
  updatedAt: string;
}

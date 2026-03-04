const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body !== undefined && init?.body !== null;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: hasBody
      ? {
          "Content-Type": "application/json",
          ...(init?.headers || {})
        }
      : { ...(init?.headers || {}) },
    ...init
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = payload && typeof payload === "object" ? String((payload as { message?: string }).message || "") : "";
    throw new Error(message || `HTTP ${response.status}`);
  }

  return payload as T;
}

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = payload && typeof payload === "object" ? String((payload as { message?: string }).message || "") : "";
    throw new Error(message || `HTTP ${response.status}`);
  }

  return payload as T;
}

export type Campaign = {
  id: string;
  name: string;
  projectCode: string;
  framework: string;
  language: "fr" | "en";
  createdAt: string;
};

export function getCampaigns() {
  return request<Campaign[]>("/campaigns");
}

export function createCampaign(input: { name: string; projectCode: string }) {
  return request<Campaign>("/campaigns", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function createCriterion(input: { campaignId: string; code: string; title: string; theme: string }) {
  return request("/criteria", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getCriteria(campaignId: string) {
  return request<Array<{ id: string; code: string; title: string; theme: string }>>(`/criteria/${campaignId}`);
}

export function saveConvention(input: {
  campaignId: string;
  auditedOrganization: string;
  sponsorOrganization: string;
  auditType: "interne" | "externe" | "mixte";
  perimeter: string;
  constraints: string;
  mode: "sur-site" | "distance" | "hybride";
}) {
  return request("/conventions", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function saveScopingNote(input: {
  campaignId: string;
  objectives: string;
  assumptions: string;
  exclusions: string;
  stakeholders: string;
  planningConstraints: string;
}) {
  return request("/scoping-notes", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function saveAuditPlan(input: {
  campaignId: string;
  objectives: string;
  scope: string;
  methods: string;
  samplingStrategy: string;
  logistics: string;
  communicationRules: string;
}) {
  return request("/audit-plans", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function createDocument(input: {
  campaignId: string;
  name: string;
  theme: string;
  version: string;
  date: string;
  sensitivity: string;
  summary: string;
}) {
  return request("/documents", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export type AnalyzedDocumentMetadata = {
  title: string;
  version: string;
  publicationDate: string;
  authors: string[];
  history: string;
  pageCount: number | null;
  sensitivity: string;
  summary: string;
};

export type DocumentUploadAnalysis = {
  success: boolean;
  tempUploadId: string;
  metadata: AnalyzedDocumentMetadata;
  extractedBy: "ollama" | "openai" | "fallback";
  file: {
    filename: string;
    mimeType: string;
    size: number;
  };
};

export function analyzeDocumentUpload(campaignId: string, file: File) {
  const formData = new FormData();
  formData.append("campaignId", campaignId);
  formData.append("file", file);
  return requestForm<DocumentUploadAnalysis>("/documents/analyze-upload", formData);
}

export function confirmAnalyzedDocument(input: {
  campaignId: string;
  tempUploadId: string;
  title: string;
  version: string;
  publicationDate: string;
  authors: string[];
  history: string;
  pageCount: number | null;
  sensitivity: string;
  summary: string;
  theme?: string;
}) {
  return request("/documents/confirm-upload", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getDocuments(campaignId: string) {
  return request<Array<{
    id: string;
    internalId?: string;
    name: string;
    theme: string;
    version: string;
    date: string;
    sensitivity: string;
    summary: string;
    authors?: string;
    history?: string;
    pageCount?: number | null;
  }>>(`/documents/${campaignId}`);
}

export function updateDocument(
  documentId: string,
  input: {
    campaignId: string;
    name: string;
    version: string;
    date: string;
    sensitivity: string;
    summary: string;
    authors: string;
    history: string;
    pageCount: number | null;
    theme?: string;
  }
) {
  return request(`/documents/item/${documentId}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function deleteDocument(documentId: string, campaignId: string) {
  return request<{ success: boolean }>(`/documents/item/${documentId}`, {
    method: "DELETE",
    body: JSON.stringify({ campaignId })
  });
}

export type RegistryExtractedField = {
  value?: string;
  confidence: "high" | "medium" | "low";
  source: "content" | "metadata" | "filename" | "user";
  evidence?: {
    snippet: string;
    matchedText?: string;
  };
};

export type RegistryDocument = {
  id: string;
  campaignId: string;
  createdAt: string;
  updatedAt: string;
  currentFileId: string;
  filename: string;
  mimeType: string;
  size: number;
  storagePath: string;
  title: RegistryExtractedField;
  version: RegistryExtractedField;
  publishedAt: RegistryExtractedField;
  author: RegistryExtractedField;
  sensitivity: RegistryExtractedField;
  status: "imported" | "extracted" | "needs_review" | "validated" | "archived";
};

export type RegistryEvent = {
  id: string;
  campaignId: string;
  documentId: string;
  action: "uploaded" | "extracted" | "updated" | "validated" | "archived" | "deleted";
  actor: "system" | "user";
  timestamp: string;
  details: string;
};

export function uploadRegistryDocument(campaignId: string, file: File) {
  const formData = new FormData();
  formData.append("campaignId", campaignId);
  formData.append("file", file);
  return requestForm<{ document: RegistryDocument; provider: "none" }>("/api/documents/upload", formData);
}

export function listRegistryDocuments(campaignId: string) {
  return request<{ items: RegistryDocument[] }>(`/api/documents?campaignId=${encodeURIComponent(campaignId)}`);
}

export function getRegistryDocument(id: string) {
  return request<{ record: RegistryDocument; events: RegistryEvent[] }>(`/api/documents/${id}`);
}

export function patchRegistryDocument(
  id: string,
  input: {
    campaignId: string;
    title?: string;
    version?: string;
    publishedAt?: string;
    author?: string;
    sensitivity?: string;
    status?: "imported" | "extracted" | "needs_review" | "validated" | "archived";
  }
) {
  return request<{ record: RegistryDocument }>(`/api/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteRegistryDocument(id: string, campaignId: string) {
  return request<{ success: boolean }>(`/api/documents/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ campaignId })
  });
}

export type AuditFinding = {
  controlId: string;
  referentialId: string;
  status: "CONFORME" | "PARTIEL" | "NON_CONFORME" | "INDETERMINE";
  rationale: string;
  citations: Array<{
    chunkId: string;
    docId: string;
    docTitle: string;
    page?: number | null;
    section?: string;
    excerpt: string;
  }>;
  confidence: number;
  evidenceGaps: string[];
  followUpQuestions: string[];
  updatedAt: string;
};

export function createAudit(input: { name: string; referentialId: string }) {
  return request<{ id: string; name: string; referentialId: string }>("/api/audits", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function ingestAudit(auditId: string, input: { folderPath: string }) {
  return request<{
    auditId: string;
    ingest: {
      auditId: string;
      ingestedDocuments: number;
      ingestedChunks: number;
      skippedFiles: string[];
    };
  }>(`/api/audits/${auditId}/ingest`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function runAudit(
  auditId: string,
  input?: {
    referentialId?: string;
    controls?: Array<{ id: string; text: string; domain?: string }>;
  }
) {
  return request<{ auditId: string; findingsCount: number; globalScore: number }>(`/api/audits/${auditId}/run`, {
    method: "POST",
    body: JSON.stringify(input || {})
  });
}

export function getAuditFindings(auditId: string) {
  return request<{ auditId: string; findings: AuditFinding[] }>(`/api/audits/${auditId}/findings`);
}

export function getAuditScore(auditId: string) {
  return request<{ auditId: string; score: { globalScore: number } | null }>(`/api/audits/${auditId}/score`);
}

export function getAuditReport(auditId: string) {
  return request<{
    auditId: string;
    report: string;
    attackPaths: Array<{
      id: string;
      title: string;
      relatedControlIds: string[];
      riskLevel: "low" | "medium" | "high";
      summary: string;
    }>;
  }>(`/api/audits/${auditId}/report`);
}

export async function exportRegistryDocumentsCsv(campaignId: string) {
  const response = await fetch(`${API_BASE}/api/documents/export?campaignId=${encodeURIComponent(campaignId)}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

export function saveDocumentReview(input: {
  campaignId: string;
  documentId: string;
  maturityLevel: string;
  complianceLevel: string;
  pointsToInvestigate: string;
  preliminaryVerdict: string;
}) {
  return request("/document-reviews", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function createInterviewee(input: {
  campaignId: string;
  fullName: string;
  role: string;
  email: string;
  entity: string;
}) {
  return request("/interviewees", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getInterviewees(campaignId: string) {
  return request<Array<{ id: string; fullName: string; role: string; email: string }>>(`/interviewees/${campaignId}`);
}

export function createInterviewSlot(input: {
  campaignId: string;
  title: string;
  startAt: string;
  endAt: string;
  mode: "sur-site" | "distance" | "hybride";
  room: string;
  teamsLink: string;
  theme: string;
  criterionCode: string;
}) {
  return request("/interview-slots", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      participantIds: [],
      associatedDocumentIds: [],
      outlookSyncEnabled: false,
      outlookEventId: ""
    })
  });
}

export function getInterviewSlots(campaignId: string) {
  return request<Array<{ id: string; title: string; startAt: string; endAt: string; mode: string; theme: string }>>(`/interview-slots/${campaignId}`);
}

export function generateReport(campaignId: string) {
  return request(`/audit-reports/generate/${campaignId}`, { method: "POST" });
}

export function getReports(campaignId: string) {
  return request<Array<{ id: string; title: string; generatedAt: string; version: string }>>(`/audit-reports/${campaignId}`);
}

export function getAuditLog(campaignId: string) {
  return request<Array<{ id: string; action: string; timestamp: string; details: string }>>(`/audit-log/${campaignId}?period=all&action=all`);
}

export function getConfig() {
  return request<{ ollamaModel: string }>("/config");
}

export function setConfig(ollamaModel: string) {
  return request<{ ollamaModel: string }>("/config", {
    method: "POST",
    body: JSON.stringify({ ollamaModel })
  });
}

export type ReferentialSummary = {
  id: string;
  name: string;
  version: string;
  documentName: string;
  documentVersion: string;
  documentDate: string;
  importedAt: string;
  sourceDocumentId: string;
  requirementCount: number;
};

export type ReferentialRequirement = {
  id: string;
  referentialId: string;
  requirementId: string;
  requirementTitle: string;
  themeLevel1: string;
  themeLevel1Title: string;
  themeLevel2: string;
  themeLevel2Title: string;
  themeLevel3: string;
  themeLevel3Title: string;
  themeLevel4: string;
  themeLevel4Title: string;
  requirementText: string;
  scopes: string[];
};

export function getReferentials() {
  return request<ReferentialSummary[]>("/referentials");
}

export function getReferentialRequirements(referentialId: string) {
  return request<ReferentialRequirement[]>(`/referentials/${referentialId}/requirements`);
}

export function importReferential(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return requestForm<{ success: boolean; referentialId: string; requirementCount: number }>(
    "/referentials/import",
    formData
  );
}

export function getOpenAiKeyStatus() {
  return request<{ configured: boolean; updatedAt: string | null }>("/admin/openai-key/status");
}

export function deleteReferential(referentialId: string) {
  return request<{ success: boolean; message: string }>(`/referentials/${referentialId}`, {
    method: "DELETE"
  });
}

export type ImportPreview = {
  referentialName: string;
  referentialVersion: string;
  documentName: string;
  documentVersion: string;
  documentDate: string;
  requirementCount: number;
  requirements: any[];
  hasMore: boolean;
};

export function previewRubisImport(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return requestForm<{ success: boolean; preview: ImportPreview }>(
    "/referentials/import/preview/rubis",
    formData
  );
}

export function confirmRubisImport(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return requestForm<{ success: boolean; referentialId: string; requirementCount: number }>(
    "/referentials/import/confirm/rubis",
    formData
  );
}

export function importReferentialFromRubisFormat(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return requestForm<{ success: boolean; referentialId: string; requirementCount: number }>(
    "/referentials/import/rubis",
    formData
  );
}

export function importReferentialFromList(
  file: File,
  requirementIdColumn: string,
  requirementTitleColumn: string,
  requirementTextColumn: string,
  scopesColumn: string,
  themeLevel1Column: string,
  themeLevel1TitleColumn: string,
  themeLevel2Column: string,
  themeLevel2TitleColumn: string,
  themeLevel3Column: string,
  themeLevel3TitleColumn: string,
  themeLevel4Column: string,
  themeLevel4TitleColumn: string
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("requirementIdColumn", requirementIdColumn);
  formData.append("requirementTitleColumn", requirementTitleColumn);
  formData.append("requirementTextColumn", requirementTextColumn);
  formData.append("scopesColumn", scopesColumn);
  formData.append("themeLevel1Column", themeLevel1Column);
  formData.append("themeLevel1TitleColumn", themeLevel1TitleColumn);
  formData.append("themeLevel2Column", themeLevel2Column);
  formData.append("themeLevel2TitleColumn", themeLevel2TitleColumn);
  formData.append("themeLevel3Column", themeLevel3Column);
  formData.append("themeLevel3TitleColumn", themeLevel3TitleColumn);
  formData.append("themeLevel4Column", themeLevel4Column);
  formData.append("themeLevel4TitleColumn", themeLevel4TitleColumn);
  return requestForm<{ success: boolean; referentialId: string; requirementCount: number }>(
    "/referentials/import/list",
    formData
  );
}

export type ListImportPreview = {
  headers: string[];
  sampleRows: Array<Record<string, string>>;
  sheets?: string[];
  currentSheet?: string;
  totalRows?: number;
};

export function previewListImport(file: File, sheet?: string) {
  const formData = new FormData();
  formData.append("file", file);
  const url = sheet ? `/referentials/import/list/preview?sheet=${encodeURIComponent(sheet)}` : "/referentials/import/list/preview";
  return requestForm<{ success: boolean; preview: ListImportPreview }>(
    url,
    formData
  );
}

export function importReferentialFromFreeText(name: string, text: string) {
  return request<{ success: boolean; referentialId: string; requirementCount: number }>(
    "/referentials/import/freetext",
    {
      method: "POST",
      body: JSON.stringify({ name, text })
    }
  );
}

export function exportReferential(referentialId: string) {
  return request<{ success: boolean; data: any }>(
    `/referentials/${referentialId}/export`,
    { method: "GET" }
  );
}

export function setOpenAiKey(apiKey: string) {
  return request<{ configured: boolean }>("/admin/openai-key", {
    method: "POST",
    body: JSON.stringify({ apiKey })
  });
}

export type AuditDirectoryMember = {
  id: string;
  fullName: string;
  profile: "auditeur" | "expert";
  email: string;
};

export type AuditTeam = {
  id: string;
  campaignId: string;
  memberIds: string[];
};

export function getAuditDirectory() {
  return request<AuditDirectoryMember[]>("/admin/audit-directory");
}

export function createAuditDirectoryMember(input: {
  fullName: string;
  profile: "auditeur" | "expert";
  email: string;
}) {
  return request<AuditDirectoryMember>("/admin/audit-directory", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function deleteAuditDirectoryMember(id: string) {
  return request<{ success: boolean }>(`/admin/audit-directory/${id}`, {
    method: "DELETE"
  });
}

export function getAuditTeam(campaignId: string) {
  return request<AuditTeam>(`/audit-teams/${campaignId}`);
}

export function saveAuditTeam(input: { campaignId: string; memberIds: string[] }) {
  return request<AuditTeam>("/audit-teams", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

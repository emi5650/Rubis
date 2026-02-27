import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSONFilePreset } from "lowdb/node";

interface Campaign {
  id: string;
  name: string;
  projectCode: string;
  language: "fr" | "en";
  framework: string;
  createdAt: string;
}

interface Criterion {
  id: string;
  campaignId: string;
  code: string;
  title: string;
  theme: string;
}

interface Question {
  id: string;
  campaignId: string;
  criterionId: string;
  audienceRole: string;
  language: "fr" | "en";
  text: string;
  weight: number;
}

interface DocumentRecord {
  id: string;
  campaignId: string;
  name: string;
  theme: string;
  version: string;
  date: string;
  sensitivity: string;
  summary: string;
  internalId?: string;
  authors?: string;
  history?: string;
  pageCount?: number | null;
  sourceFilename?: string;
  sourceMimeType?: string;
  sourceSize?: number;
  sourceStoragePath?: string;
}

interface MetricScale {
  id: string;
  campaignId: string;
  confidentiality: string;
  integrity: string;
  availability: string;
  evidence: string;
}

interface ConventionRecord {
  id: string;
  campaignId: string;
  auditedOrganization: string;
  sponsorOrganization: string;
  auditType: string;
  perimeter: string;
  constraints: string;
  mode: string;
}

interface ScopingNoteRecord {
  id: string;
  campaignId: string;
  objectives: string;
  assumptions: string;
  exclusions: string;
  stakeholders: string;
  planningConstraints: string;
}

interface IntervieweeRecord {
  id: string;
  campaignId: string;
  fullName: string;
  role: string;
  email: string;
  entity: string;
}

interface DocumentReviewRecord {
  id: string;
  campaignId: string;
  documentId: string;
  maturityLevel: string;
  complianceLevel: string;
  pointsToInvestigate: string;
  preliminaryVerdict: string;
}

interface AuditPlanRecord {
  id: string;
  campaignId: string;
  objectives: string;
  scope: string;
  methods: string;
  samplingStrategy: string;
  logistics: string;
  communicationRules: string;
}

interface InterviewSlotRecord {
  id: string;
  campaignId: string;
  title: string;
  startAt: string;
  endAt: string;
  mode: "sur-site" | "distance" | "hybride";
  room: string;
  teamsLink: string;
  theme: string;
  criterionCode: string;
  participantIds: string[];
  associatedDocumentIds: string[];
  outlookSyncEnabled: boolean;
  outlookEventId: string;
}

interface PauseRecord {
  startAt: string;
  endAt: string;
}

interface InterviewNoteRecord {
  id: string;
  campaignId: string;
  slotId: string;
  startedAt: string;
  endedAt: string;
  pauses: PauseRecord[];
  freeNotes: string;
}

interface AttendanceRecord {
  id: string;
  interviewNoteId: string;
  intervieweeId: string;
  intervieweeName: string;
  planned: boolean;
  present: boolean;
}

interface PendingDocumentRecord {
  id: string;
  campaignId: string;
  interviewNoteId: string;
  name: string;
  requestedFrom: string;
  dueDate: string;
  transmittedDate: string;
  status: "requested" | "received";
}

interface InterviewDocumentReference {
  id: string;
  interviewNoteId: string;
  documentId: string;
  pendingDocumentId: string;
  reference: string;
}

interface InterviewAnswerRecord {
  id: string;
  campaignId: string;
  interviewNoteId: string;
  questionId: string;
  conformityScore: number;
  comment: string;
}

interface AuditReportRecord {
  id: string;
  campaignId: string;
  title: string;
  generatedAt: string;
  version: string;
  content: string;
}

interface AuditLogRecord {
  id: string;
  campaignId: string;
  action: string;
  timestamp: string;
  details: string;
}

interface OpenAiKeyRecord {
  encrypted: string;
  iv: string;
  tag: string;
  updatedAt: string;
}

interface AdminConfigRecord {
  openAiKey?: OpenAiKeyRecord;
  auditDirectory?: AuditDirectoryEntry[];
}

interface AuditDirectoryEntry {
  id: string;
  fullName: string;
  profile: "auditeur" | "expert";
  email: string;
}

interface AuditTeamRecord {
  id: string;
  campaignId: string;
  memberIds: string[];
}

interface ReferentialDocumentRecord {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  storagePath: string;
  uploadedAt: string;
  extractedName: string;
  extractedVersion: string;
  extractedDate: string;
}

interface ReferentialRecord {
  id: string;
  name: string;
  version: string;
  documentName: string;
  documentVersion: string;
  documentDate: string;
  importedAt: string;
  sourceDocumentId: string;
}

interface ReferentialRequirementRecord {
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
}

interface RegistryEvidenceRecord {
  snippet: string;
  locator?: {
    kind: "page" | "slide" | "sheet" | "line";
    index?: number;
    name?: string;
  };
  matchedText?: string;
}

interface RegistryExtractedFieldRecord {
  value?: string;
  confidence: "high" | "medium" | "low";
  source: "content" | "metadata" | "filename" | "user";
  evidence?: RegistryEvidenceRecord;
}

interface DocumentRegistryRecord {
  id: string;
  campaignId: string;
  createdAt: string;
  updatedAt: string;
  currentFileId: string;
  filename: string;
  mimeType: string;
  size: number;
  storagePath: string;
  title: RegistryExtractedFieldRecord;
  version: RegistryExtractedFieldRecord;
  publishedAt: RegistryExtractedFieldRecord;
  author: RegistryExtractedFieldRecord;
  sensitivity: RegistryExtractedFieldRecord;
  status: "imported" | "extracted" | "needs_review" | "validated" | "archived";
}

interface DocumentRegistryEventRecord {
  id: string;
  campaignId: string;
  documentId: string;
  action: "uploaded" | "extracted" | "updated" | "validated" | "archived" | "deleted";
  actor: "system" | "user";
  timestamp: string;
  details: string;
}

export interface RubisDb {
  campaigns: Campaign[];
  criteria: Criterion[];
  questions: Question[];
  documents: DocumentRecord[];
  metricScales: MetricScale[];
  conventions: ConventionRecord[];
  scopingNotes: ScopingNoteRecord[];
  interviewees: IntervieweeRecord[];
  documentReviews: DocumentReviewRecord[];
  auditPlans: AuditPlanRecord[];
  interviewSlots: InterviewSlotRecord[];
  interviewNotes: InterviewNoteRecord[];
  attendances: AttendanceRecord[];
  pendingDocuments: PendingDocumentRecord[];
  interviewDocumentReferences: InterviewDocumentReference[];
  interviewAnswers: InterviewAnswerRecord[];
  auditReports: AuditReportRecord[];
  auditLogs: AuditLogRecord[];
  referentialDocuments: ReferentialDocumentRecord[];
  referentials: ReferentialRecord[];
  referentialRequirements: ReferentialRequirementRecord[];
  auditTeams: AuditTeamRecord[];
  documentRegistry: DocumentRegistryRecord[];
  documentRegistryEvents: DocumentRegistryEventRecord[];
  adminConfig: AdminConfigRecord;
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(currentDir, "../data/rubis.json");
mkdirSync(dirname(dbPath), { recursive: true });

export const db = await JSONFilePreset<RubisDb>(dbPath, {
  campaigns: [],
  criteria: [],
  questions: [],
  documents: [],
  metricScales: [],
  conventions: [],
  scopingNotes: [],
  interviewees: [],
  documentReviews: [],
  auditPlans: [],
  interviewSlots: [],
  interviewNotes: [],
  attendances: [],
  pendingDocuments: [],
  interviewDocumentReferences: [],
  interviewAnswers: [],
  auditReports: [],
  auditLogs: [],
  referentialDocuments: [],
  referentials: [],
  referentialRequirements: [],
  auditTeams: [],
  documentRegistry: [],
  documentRegistryEvents: [],
  adminConfig: {}
});

if (!Array.isArray(db.data.documents)) {
  db.data.documents = [];
}

if (!Array.isArray(db.data.campaigns)) {
  db.data.campaigns = [];
}

db.data.campaigns = db.data.campaigns.map((campaign) => ({
  ...campaign,
  projectCode: typeof campaign.projectCode === "string" ? campaign.projectCode : "",
  language: campaign.language === "en" ? "en" : "fr",
  framework: typeof campaign.framework === "string" && campaign.framework.trim().length > 0 ? campaign.framework : "À définir"
}));

if (!Array.isArray(db.data.metricScales)) {
  db.data.metricScales = [];
}

if (!Array.isArray(db.data.conventions)) {
  db.data.conventions = [];
}

if (!Array.isArray(db.data.scopingNotes)) {
  db.data.scopingNotes = [];
}

if (!Array.isArray(db.data.interviewees)) {
  db.data.interviewees = [];
}

if (!Array.isArray(db.data.documentReviews)) {
  db.data.documentReviews = [];
}

if (!Array.isArray(db.data.auditPlans)) {
  db.data.auditPlans = [];
}

if (!Array.isArray(db.data.interviewSlots)) {
  db.data.interviewSlots = [];
}

if (!Array.isArray(db.data.interviewNotes)) {
  db.data.interviewNotes = [];
}

if (!Array.isArray(db.data.attendances)) {
  db.data.attendances = [];
}

if (!Array.isArray(db.data.pendingDocuments)) {
  db.data.pendingDocuments = [];
}

if (!Array.isArray(db.data.interviewDocumentReferences)) {
  db.data.interviewDocumentReferences = [];
}

if (!Array.isArray(db.data.interviewAnswers)) {
  db.data.interviewAnswers = [];
}

if (!Array.isArray(db.data.auditReports)) {
  db.data.auditReports = [];
}

if (!Array.isArray(db.data.auditTeams)) {
  db.data.auditTeams = [];
}

db.data.auditTeams = db.data.auditTeams
  .filter((item) => item && typeof item === "object")
  .map((item) => ({
    id: typeof item.id === "string" ? item.id : "",
    campaignId: typeof item.campaignId === "string" ? item.campaignId : "",
    memberIds: Array.isArray(item.memberIds) ? item.memberIds.filter((memberId) => typeof memberId === "string") : []
  }))
  .filter((item) => item.id.length > 0 && item.campaignId.length > 0);

if (!Array.isArray(db.data.auditLogs)) {
  db.data.auditLogs = [];
}

if (!Array.isArray(db.data.referentialDocuments)) {
  db.data.referentialDocuments = [];
}

if (!Array.isArray(db.data.referentials)) {
  db.data.referentials = [];
}

if (!Array.isArray(db.data.referentialRequirements)) {
  db.data.referentialRequirements = [];
}

if (!Array.isArray(db.data.documentRegistry)) {
  db.data.documentRegistry = [];
}

if (!Array.isArray(db.data.documentRegistryEvents)) {
  db.data.documentRegistryEvents = [];
}

if (!db.data.adminConfig) {
  db.data.adminConfig = {};
}

if (!Array.isArray(db.data.adminConfig.auditDirectory)) {
  db.data.adminConfig.auditDirectory = [];
}

db.data.adminConfig.auditDirectory = db.data.adminConfig.auditDirectory
  .filter((item) => item && typeof item === "object")
  .map((item): AuditDirectoryEntry => ({
    id: typeof item.id === "string" ? item.id : "",
    fullName: typeof item.fullName === "string" ? item.fullName : "",
    profile: item.profile === "expert" ? "expert" : "auditeur",
    email: typeof item.email === "string" ? item.email : ""
  }))
  .filter((item) => item.id.length > 0 && item.fullName.trim().length > 0);

await db.write();

import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSONFilePreset } from "lowdb/node";

interface Campaign {
  id: string;
  name: string;
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
  auditLogs: []
});

if (!Array.isArray(db.data.documents)) {
  db.data.documents = [];
}

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

if (!Array.isArray(db.data.auditLogs)) {
  db.data.auditLogs = [];
}

await db.write();

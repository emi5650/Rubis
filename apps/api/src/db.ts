import { mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSONFilePreset } from "lowdb/node";

function hashPassword(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

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
  actor: string;
  timestamp: string;
  details: string;
}

interface AuthUserRecord {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: "admin" | "auditeur" | "lecteur";
  active: boolean;
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
  users?: AuthUserRecord[];
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

<<<<<<< Updated upstream
=======
type PeopleStatus = "active" | "disabled" | "unknown";

interface PeopleRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  organisationId: string;
  campaignId?: string;
  source: "AD" | "user";
  fetchedFromAdAt?: string;
  personalTitle?: string;
  mail?: string;
  givenName?: string;
  sn?: string;
  displayName?: string;
  department?: string;
  company?: string;
  title?: string;
  physicalDeliveryOfficeName?: string;
  telephoneNumber?: string;
  mobile?: string;
  streetAddress?: string;
  l?: string;
  postalCode?: string;
  st?: string;
  co?: string;
  samAccountName?: string;
  userPrincipalName?: string;
  distinguishedName?: string;
  employeeId?: string;
  managerDn?: string;
  managerDisplayName?: string;
  memberOfDns?: string[];
  memberOfCns?: string[];
  passiScopes?: string[];
  isAuditManager?: boolean;
  passiAttestationValidUntil?: string;
  purpose?: string;
  lawfulBasis?: string;
  tags?: string[];
  notes?: string;
  retentionDays?: number;
  retentionUntil?: string;
  status?: PeopleStatus;
  deletedAt?: string;
}

type PeopleEventType =
  | "ad_search"
  | "ad_import"
  | "ad_refresh"
  | "user_edit"
  | "export_csv"
  | "purge_soft"
  | "delete";

interface PeopleEventRecord {
  id: string;
  personId?: string;
  jobId?: string;
  at: string;
  type: PeopleEventType;
  actor: "system" | "user";
  message: string;
  diff?: Record<string, { from?: unknown; to?: unknown }>;
}

type ImportJobStatus = "queued" | "running" | "done" | "failed";

interface ADImportJobRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: ImportJobStatus;
  organisationId: string;
  campaignId?: string;
  identifierType: "email" | "login" | "upn" | "auto";
  identifiers: string[];
  processed: number;
  success: number;
  failed: number;
  errors?: string[];
  resultPersonIds: string[];
}

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
  peopleDirectory: PeopleRecord[];
  peopleEvents: PeopleEventRecord[];
  adImportJobs: ADImportJobRecord[];
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
  peopleDirectory: [],
  peopleEvents: [],
  adImportJobs: [],
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
db.data.auditLogs = db.data.auditLogs
  .filter((item) => item && typeof item === "object")
  .map((item) => ({
    id: typeof item.id === "string" ? item.id : "",
    campaignId: typeof item.campaignId === "string" ? item.campaignId : "",
    action: typeof item.action === "string" ? item.action : "",
    actor: typeof (item as { actor?: unknown }).actor === "string" ? String((item as { actor?: unknown }).actor) : "system",
    timestamp: typeof item.timestamp === "string" ? item.timestamp : new Date().toISOString(),
    details: typeof item.details === "string" ? item.details : ""
  }))
  .filter((item) => item.id.length > 0 && item.campaignId.length > 0 && item.action.length > 0);

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
if (!Array.isArray(db.data.peopleDirectory)) {
  db.data.peopleDirectory = [];
}

db.data.peopleDirectory = db.data.peopleDirectory
  .filter((item) => item && typeof item === "object")
  .map((item): PeopleRecord => ({
    id: typeof item.id === "string" ? item.id : "",
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString(),
    organisationId: typeof item.organisationId === "string" && item.organisationId.trim().length > 0 ? item.organisationId : "default",
    campaignId: typeof item.campaignId === "string" ? item.campaignId : undefined,
    source: item.source === "AD" ? "AD" : "user",
    fetchedFromAdAt: typeof item.fetchedFromAdAt === "string" ? item.fetchedFromAdAt : undefined,
    personalTitle: typeof item.personalTitle === "string" ? item.personalTitle : undefined,
    mail: typeof item.mail === "string" ? item.mail : undefined,
    givenName: typeof item.givenName === "string" ? item.givenName : undefined,
    sn: typeof item.sn === "string" ? item.sn : undefined,
    displayName: typeof item.displayName === "string" ? item.displayName : undefined,
    department: typeof item.department === "string" ? item.department : undefined,
    company: typeof item.company === "string" ? item.company : undefined,
    title: typeof item.title === "string" ? item.title : undefined,
    physicalDeliveryOfficeName:
      typeof item.physicalDeliveryOfficeName === "string" ? item.physicalDeliveryOfficeName : undefined,
    telephoneNumber: typeof item.telephoneNumber === "string" ? item.telephoneNumber : undefined,
    mobile: typeof item.mobile === "string" ? item.mobile : undefined,
    streetAddress: typeof item.streetAddress === "string" ? item.streetAddress : undefined,
    l: typeof item.l === "string" ? item.l : undefined,
    postalCode: typeof item.postalCode === "string" ? item.postalCode : undefined,
    st: typeof item.st === "string" ? item.st : undefined,
    co: typeof item.co === "string" ? item.co : undefined,
    samAccountName: typeof item.samAccountName === "string" ? item.samAccountName : undefined,
    userPrincipalName: typeof item.userPrincipalName === "string" ? item.userPrincipalName : undefined,
    distinguishedName: typeof item.distinguishedName === "string" ? item.distinguishedName : undefined,
    employeeId: typeof item.employeeId === "string" ? item.employeeId : undefined,
    managerDn: typeof item.managerDn === "string" ? item.managerDn : undefined,
    managerDisplayName: typeof item.managerDisplayName === "string" ? item.managerDisplayName : undefined,
    memberOfDns: Array.isArray(item.memberOfDns) ? item.memberOfDns.filter((x) => typeof x === "string") : undefined,
    memberOfCns: Array.isArray(item.memberOfCns) ? item.memberOfCns.filter((x) => typeof x === "string") : undefined,
    purpose: typeof item.purpose === "string" ? item.purpose : undefined,
    lawfulBasis: typeof item.lawfulBasis === "string" ? item.lawfulBasis : undefined,
    tags: Array.isArray(item.tags) ? item.tags.filter((x) => typeof x === "string") : undefined,
    notes: typeof item.notes === "string" ? item.notes : undefined,
    retentionDays: typeof item.retentionDays === "number" && Number.isFinite(item.retentionDays) ? item.retentionDays : undefined,
    retentionUntil: typeof item.retentionUntil === "string" ? item.retentionUntil : undefined,
    status: item.status === "active" || item.status === "disabled" ? item.status : "unknown",
    deletedAt: typeof item.deletedAt === "string" ? item.deletedAt : undefined
  }))
  .filter((item) => item.id.length > 0);

if (!Array.isArray(db.data.peopleEvents)) {
  db.data.peopleEvents = [];
}

db.data.peopleEvents = db.data.peopleEvents
  .filter((item) => item && typeof item === "object")
  .map((item): PeopleEventRecord => ({
    id: typeof item.id === "string" ? item.id : "",
    personId: typeof item.personId === "string" ? item.personId : undefined,
    jobId: typeof item.jobId === "string" ? item.jobId : undefined,
    at: typeof item.at === "string" ? item.at : new Date().toISOString(),
    type:
      item.type === "ad_search" ||
      item.type === "ad_import" ||
      item.type === "ad_refresh" ||
      item.type === "user_edit" ||
      item.type === "export_csv" ||
      item.type === "purge_soft" ||
      item.type === "delete"
        ? item.type
        : "user_edit",
    actor: item.actor === "system" ? "system" : "user",
    message: typeof item.message === "string" ? item.message : "",
    diff: item.diff && typeof item.diff === "object" ? item.diff : undefined
  }))
  .filter((item) => item.id.length > 0);

if (!Array.isArray(db.data.adImportJobs)) {
  db.data.adImportJobs = [];
}

>>>>>>> Stashed changes
if (!db.data.adminConfig) {
  db.data.adminConfig = {};
}

if (!Array.isArray(db.data.adminConfig.auditDirectory)) {
  db.data.adminConfig.auditDirectory = [];
}

<<<<<<< Updated upstream
=======
if (!Array.isArray(db.data.adminConfig.users)) {
  db.data.adminConfig.users = [];
}

db.data.adminConfig.users = db.data.adminConfig.users
  .filter((item) => item && typeof item === "object")
  .map((item): AuthUserRecord => ({
    id: typeof item.id === "string" ? item.id : "",
    username: typeof item.username === "string" ? item.username.trim().toLowerCase() : "",
    displayName: typeof item.displayName === "string" && item.displayName.trim().length > 0 ? item.displayName.trim() : "Utilisateur",
    passwordHash: typeof item.passwordHash === "string" ? item.passwordHash : "",
    role: item.role === "admin" ? "admin" : item.role === "lecteur" ? "lecteur" : "auditeur",
    active: item.active !== false
  }))
  .filter((item) => item.id.length > 0 && item.username.length > 0 && item.passwordHash.length > 0);

if (db.data.adminConfig.users.length === 0) {
  db.data.adminConfig.users = [
    {
      id: "default-admin",
      username: "admin",
      displayName: "Administrateur",
      passwordHash: hashPassword("admin"),
      role: "admin",
      active: true
    }
  ];
}

>>>>>>> Stashed changes
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

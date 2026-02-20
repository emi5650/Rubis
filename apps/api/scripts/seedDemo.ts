import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type DbShape = Record<string, unknown> & {
  campaigns: Array<Record<string, unknown>>;
  criteria: Array<Record<string, unknown>>;
  questions: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  metricScales: Array<Record<string, unknown>>;
  conventions: Array<Record<string, unknown>>;
  scopingNotes: Array<Record<string, unknown>>;
  interviewees: Array<Record<string, unknown>>;
  documentReviews: Array<Record<string, unknown>>;
  auditPlans: Array<Record<string, unknown>>;
  interviewSlots: Array<Record<string, unknown>>;
  interviewNotes: Array<Record<string, unknown>>;
  attendances: Array<Record<string, unknown>>;
  pendingDocuments: Array<Record<string, unknown>>;
  interviewDocumentReferences: Array<Record<string, unknown>>;
  interviewAnswers: Array<Record<string, unknown>>;
  auditReports: Array<Record<string, unknown>>;
};

const currentDir = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(currentDir, "../data/rubis.json");

mkdirSync(dirname(dbPath), { recursive: true });

function ensureDbShape(raw: string): DbShape {
  const parsed = raw ? (JSON.parse(raw) as Partial<DbShape>) : {};
  return {
    campaigns: parsed.campaigns ?? [],
    criteria: parsed.criteria ?? [],
    questions: parsed.questions ?? [],
    documents: parsed.documents ?? [],
    metricScales: parsed.metricScales ?? [],
    conventions: parsed.conventions ?? [],
    scopingNotes: parsed.scopingNotes ?? [],
    interviewees: parsed.interviewees ?? [],
    documentReviews: parsed.documentReviews ?? [],
    auditPlans: parsed.auditPlans ?? [],
    interviewSlots: parsed.interviewSlots ?? [],
    interviewNotes: parsed.interviewNotes ?? [],
    attendances: parsed.attendances ?? [],
    pendingDocuments: parsed.pendingDocuments ?? [],
    interviewDocumentReferences: parsed.interviewDocumentReferences ?? [],
    interviewAnswers: parsed.interviewAnswers ?? [],
    auditReports: parsed.auditReports ?? []
  };
}

const existingRaw = (() => {
  try {
    return readFileSync(dbPath, "utf-8");
  } catch {
    return "";
  }
})();

const db = ensureDbShape(existingRaw);

const campaignId = randomUUID();
const criterionId = randomUUID();
const questionId = randomUUID();
const documentId = randomUUID();
const intervieweeId = randomUUID();
const slotId = randomUUID();
const noteId = randomUUID();

const now = new Date().toISOString();

db.campaigns.unshift({
  id: campaignId,
  name: "Campagne Démo Rubis",
  language: "fr",
  framework: "PASSI v2.2",
  createdAt: now
});

db.criteria.push({
  id: criterionId,
  campaignId,
  code: "A.5.1",
  title: "Politique de sécurité",
  theme: "Gouvernance"
});

db.questions.push({
  id: questionId,
  campaignId,
  criterionId,
  audienceRole: "RSSI",
  language: "fr",
  text: "Comment la politique de sécurité est-elle déclinée en procédures opérationnelles ?",
  weight: 1
});

db.documents.push({
  id: documentId,
  campaignId,
  name: "PSSI",
  theme: "Gouvernance",
  version: "1.0",
  date: "2026-02-20",
  sensitivity: "Interne",
  summary: "Politique de sécurité du SI"
});

db.metricScales.push({
  id: randomUUID(),
  campaignId,
  confidentiality: "1-5",
  integrity: "1-5",
  availability: "1-5",
  evidence: "0-3"
});

db.conventions.push({
  id: randomUUID(),
  campaignId,
  auditedOrganization: "Entité auditée démo",
  sponsorOrganization: "Commanditaire démo",
  auditType: "interne",
  perimeter: "SI central",
  constraints: "Aucune",
  mode: "hybride"
});

db.scopingNotes.push({
  id: randomUUID(),
  campaignId,
  objectives: "Evaluer la maturité cyber",
  assumptions: "Contexte stable",
  exclusions: "Aucune",
  stakeholders: "DSI,RSSI",
  planningConstraints: "2 semaines"
});

db.interviewees.push({
  id: intervieweeId,
  campaignId,
  fullName: "Alice Martin",
  role: "RSSI",
  email: "alice.martin@example.com",
  entity: "DSI"
});

db.documentReviews.push({
  id: randomUUID(),
  campaignId,
  documentId,
  maturityLevel: "Intermédiaire",
  complianceLevel: "Partielle",
  pointsToInvestigate: "Validation formelle annuelle",
  preliminaryVerdict: "À approfondir en entretien"
});

db.auditPlans.push({
  id: randomUUID(),
  campaignId,
  objectives: "Vérifier la conformité des contrôles",
  scope: "Périmètre infrastructure et gouvernance",
  methods: "Analyse doc + entretiens",
  samplingStrategy: "Basée sur les risques",
  logistics: "2 jours sur site",
  communicationRules: "Point quotidien"
});

db.interviewSlots.push({
  id: slotId,
  campaignId,
  title: "Entretien RSSI",
  startAt: "2026-03-01T09:00:00Z",
  endAt: "2026-03-01T10:00:00Z",
  mode: "hybride",
  room: "Salle 3",
  teamsLink: "",
  theme: "Gouvernance",
  criterionCode: "A.5.1",
  participantIds: [intervieweeId],
  associatedDocumentIds: [documentId],
  outlookSyncEnabled: false,
  outlookEventId: ""
});

db.interviewNotes.push({
  id: noteId,
  campaignId,
  slotId,
  startedAt: "2026-03-01T09:00:00Z",
  endedAt: "2026-03-01T10:00:00Z",
  pauses: [],
  freeNotes: "Entretien démo"
});

db.attendances.push({
  id: randomUUID(),
  interviewNoteId: noteId,
  intervieweeId,
  intervieweeName: "Alice Martin",
  planned: true,
  present: true
});

db.pendingDocuments.push({
  id: randomUUID(),
  campaignId,
  interviewNoteId: noteId,
  name: "Procédure de gestion des incidents",
  requestedFrom: "RSSI",
  dueDate: "2026-03-05",
  transmittedDate: "",
  status: "requested"
});

db.interviewAnswers.push({
  id: randomUUID(),
  campaignId,
  interviewNoteId: noteId,
  questionId,
  conformityScore: 3,
  comment: "Maturité moyenne"
});

writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
console.log(`Demo seed inserted for campaign: ${campaignId}`);

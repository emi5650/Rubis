import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(currentDir, "../data/rubis.json");

mkdirSync(dirname(dbPath), { recursive: true });

const emptyDb = {
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
  auditReports: []
};

writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2), "utf-8");
console.log(`Database reset: ${dbPath}`);

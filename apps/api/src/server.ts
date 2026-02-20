import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { z } from "zod";
import { db } from "./db.js";
import { generateFallbackQuestions } from "./services/questionGenerator.js";
import { generateQuestionsFromReferential } from "./services/openai.js";
import { parseReferentialFile } from "./services/referentialParser.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(multipart, { limits: { fileSize: 52428800 } }); // 50MB limit

async function logAction(campaignId: string, action: string, details: string) {
  if (!campaignId) {
    return;
  }

  db.data.auditLogs.unshift({
    id: randomUUID(),
    campaignId,
    action,
    timestamp: new Date().toISOString(),
    details
  });

  if (db.data.auditLogs.length > 2000) {
    db.data.auditLogs = db.data.auditLogs.slice(0, 2000);
  }

  await db.write();
}

app.get("/health", async () => ({ status: "ok" }));

app.post("/campaigns", async (request, reply) => {
  const bodySchema = z.object({
    name: z.string().min(3),
    language: z.enum(["fr", "en"]),
    framework: z.string().min(2)
  });

  const body = bodySchema.parse(request.body);
  const campaign = {
    id: randomUUID(),
    ...body,
    createdAt: new Date().toISOString()
  };

  db.data.campaigns.unshift(campaign);
  await db.write();
  await logAction(campaign.id, "campaign.created", campaign.name);

  return reply.code(201).send(campaign);
});

app.get("/campaigns", async () => db.data.campaigns);

app.post("/criteria", async (request, reply) => {
  const bodySchema = z.object({
    campaignId: z.string().uuid(),
    code: z.string().min(2),
    title: z.string().min(2),
    theme: z.string().min(2)
  });

  const body = bodySchema.parse(request.body);
  const criterion = {
    id: randomUUID(),
    ...body
  };

  db.data.criteria.push(criterion);
  await db.write();
  await logAction(criterion.campaignId, "criterion.created", `${criterion.code} - ${criterion.title}`);

  return reply.code(201).send(criterion);
});

app.get("/criteria/:campaignId", async (request) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  return db.data.criteria.filter((item) => item.campaignId === campaignId);
});

app.post("/questions/generate", async (request) => {
  const bodySchema = z.object({
    criterionId: z.string().uuid(),
    audienceRole: z.string().min(2),
    language: z.enum(["fr", "en"])
  });

  const body = bodySchema.parse(request.body);
  const criterion = db.data.criteria.find((item) => item.id === body.criterionId);

  if (!criterion) {
    return { questions: [] };
  }

  const questions = generateFallbackQuestions({
    criterionCode: criterion.code,
    criterionTitle: criterion.title,
    audienceRole: body.audienceRole,
    language: body.language
  });

  return {
    campaignId: criterion.campaignId,
    criterionId: criterion.id,
    questions
  };
});

app.post("/questions", async (request, reply) => {
  const bodySchema = z.object({
    campaignId: z.string().uuid(),
    criterionId: z.string().uuid(),
    audienceRole: z.string().min(2),
    language: z.enum(["fr", "en"]),
    text: z.string().min(10),
    weight: z.number().min(0.1).default(1)
  });

  const body = bodySchema.parse(request.body);
  const question = {
    id: randomUUID(),
    ...body
  };

  db.data.questions.push(question);
  await db.write();
  await logAction(question.campaignId, "question.created", question.id);

  return reply.code(201).send(question);
});

app.get("/questions/:campaignId", async (request) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  return db.data.questions.filter((item) => item.campaignId === campaignId);
});

app.post("/documents", async (request, reply) => {
  const bodySchema = z.object({
    campaignId: z.string().uuid(),
    name: z.string().min(2),
    theme: z.string().min(2),
    version: z.string().min(1),
    date: z.string().min(4),
    sensitivity: z.string().min(2),
    summary: z.string().max(2000).default("")
  });

  const body = bodySchema.parse(request.body);
  const document = {
    id: randomUUID(),
    ...body
  };

  db.data.documents.push(document);
  await db.write();
  await logAction(document.campaignId, "document.created", document.name);

  return reply.code(201).send(document);
});

app.get("/documents/:campaignId", async (request) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  return db.data.documents.filter((item) => item.campaignId === campaignId);
});

app.post("/metric-scales", async (request, reply) => {
  const bodySchema = z.object({
    campaignId: z.string().uuid(),
    confidentiality: z.string().min(2),
    integrity: z.string().min(2),
    availability: z.string().min(2),
    evidence: z.string().min(2)
  });

  const body = bodySchema.parse(request.body);
  const existingIndex = db.data.metricScales.findIndex((item) => item.campaignId === body.campaignId);
  const metricScale = {
    id: existingIndex >= 0 ? db.data.metricScales[existingIndex].id : randomUUID(),
    ...body
  };

  if (existingIndex >= 0) {
    db.data.metricScales[existingIndex] = metricScale;
  } else {
    db.data.metricScales.push(metricScale);
  }

  await db.write();
  return reply.code(201).send(metricScale);
});

app.get("/metric-scales/:campaignId", async (request) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  const existing = db.data.metricScales.find((item) => item.campaignId === campaignId);
  if (existing) {
    return existing;
  }

  return {
    id: "default",
    campaignId,
    confidentiality: "1-5",
    integrity: "1-5",
    availability: "1-5",
    evidence: "0-3"
  };
});

app.post("/conventions", async (request, reply) => {
  const bodySchema = z.object({
    campaignId: z.string().uuid(),
    auditedOrganization: z.string().min(2),
    sponsorOrganization: z.string().min(2),
    auditType: z.enum(["interne", "externe", "mixte"]),
    perimeter: z.string().min(2),
    constraints: z.string().max(4000).default(""),
    mode: z.enum(["sur-site", "distance", "hybride"])
  });

  const body = bodySchema.parse(request.body);
  const existingIndex = db.data.conventions.findIndex((item) => item.campaignId === body.campaignId);
  const convention = {
    id: existingIndex >= 0 ? db.data.conventions[existingIndex].id : randomUUID(),
    ...body
  };

  if (existingIndex >= 0) {
    db.data.conventions[existingIndex] = convention;
  } else {
    db.data.conventions.push(convention);
  }

  await db.write();
  return reply.code(201).send(convention);
});

app.get("/conventions/:campaignId", async (request) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  return db.data.conventions.find((item) => item.campaignId === campaignId) ?? null;
});

app.post("/scoping-notes", async (request, reply) => {
  const bodySchema = z.object({
    campaignId: z.string().uuid(),
    objectives: z.string().min(2),
    assumptions: z.string().max(4000).default(""),
    exclusions: z.string().max(4000).default(""),
    stakeholders: z.string().max(4000).default(""),
    planningConstraints: z.string().max(4000).default("")
  });

  const body = bodySchema.parse(request.body);
  const existingIndex = db.data.scopingNotes.findIndex((item) => item.campaignId === body.campaignId);
  const scopingNote = {
    id: existingIndex >= 0 ? db.data.scopingNotes[existingIndex].id : randomUUID(),
    ...body
  };

  if (existingIndex >= 0) {
    db.data.scopingNotes[existingIndex] = scopingNote;
  } else {
    db.data.scopingNotes.push(scopingNote);
  }

  await db.write();
  return reply.code(201).send(scopingNote);
});

app.get("/scoping-notes/:campaignId", async (request) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  return db.data.scopingNotes.find((item) => item.campaignId === campaignId) ?? null;
});

app.post("/interviewees", async (request, reply) => {
  const bodySchema = z.object({
    campaignId: z.string().uuid(),
    fullName: z.string().min(2),
    role: z.string().min(2),
    email: z.string().email(),
    entity: z.string().min(2)
  });

  const body = bodySchema.parse(request.body);
  const interviewee = {
    id: randomUUID(),
    ...body
  };

  db.data.interviewees.push(interviewee);
  await db.write();

  return reply.code(201).send(interviewee);
});

app.get("/interviewees/:campaignId", async (request) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  return db.data.interviewees.filter((item) => item.campaignId === campaignId);
});

app.post("/document-reviews", async (request, reply) => {
  const bodySchema = z.object({
    campaignId: z.string().uuid(),
    documentId: z.string().uuid(),
    maturityLevel: z.string().min(1),
    complianceLevel: z.string().min(1),
    pointsToInvestigate: z.string().max(4000).default(""),
    preliminaryVerdict: z.string().max(4000).default("")
  });

  const body = bodySchema.parse(request.body);
  const existingIndex = db.data.documentReviews.findIndex(
    (item) => item.campaignId === body.campaignId && item.documentId === body.documentId
  );

  const review = {
    id: existingIndex >= 0 ? db.data.documentReviews[existingIndex].id : randomUUID(),
    ...body
  };

  if (existingIndex >= 0) {
    db.data.documentReviews[existingIndex] = review;
  } else {
    db.data.documentReviews.push(review);
  }

  await db.write();
  return reply.code(201).send(review);
});

app.get("/document-reviews/:campaignId", async (request) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  return db.data.documentReviews.filter((item) => item.campaignId === campaignId);
});

app.post("/audit-plans", async (request, reply) => {
  const bodySchema = z.object({
    campaignId: z.string().uuid(),
    objectives: z.string().min(2),
    scope: z.string().min(2),
    methods: z.string().min(2),
    samplingStrategy: z.string().max(4000).default(""),
    logistics: z.string().max(4000).default(""),
    communicationRules: z.string().max(4000).default("")
  });

  const body = bodySchema.parse(request.body);
  const existingIndex = db.data.auditPlans.findIndex((item) => item.campaignId === body.campaignId);
  const plan = {
    id: existingIndex >= 0 ? db.data.auditPlans[existingIndex].id : randomUUID(),
    ...body
  };

  if (existingIndex >= 0) {
    db.data.auditPlans[existingIndex] = plan;
  } else {
    db.data.auditPlans.push(plan);
  }

  await db.write();
  return reply.code(201).send(plan);
});

app.get("/audit-plans/:campaignId", async (request) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  return db.data.auditPlans.find((item) => item.campaignId === campaignId) ?? null;
});

app.post("/interview-slots", async (request, reply) => {
  const bodySchema = z.object({
    campaignId: z.string().uuid(),
    title: z.string().min(2),
    startAt: z.string().min(10),
    endAt: z.string().min(10),
    mode: z.enum(["sur-site", "distance", "hybride"]),
    room: z.string().default(""),
    teamsLink: z.string().default(""),
    theme: z.string().min(2),
    criterionCode: z.string().default(""),
    participantIds: z.array(z.string().uuid()).default([]),
    associatedDocumentIds: z.array(z.string().uuid()).default([]),
    outlookSyncEnabled: z.boolean().default(false),
    outlookEventId: z.string().default("")
  });

  const body = bodySchema.parse(request.body);
  const slot = {
    id: randomUUID(),
    ...body
  };

  db.data.interviewSlots.push(slot);
  await db.write();

  return reply.code(201).send(slot);
});

app.get("/interview-slots/:campaignId", async (request) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  return db.data.interviewSlots.filter((item) => item.campaignId === campaignId);
});

app.get("/interview-slots/suggestions/:campaignId/:theme", async (request) => {
  const paramsSchema = z.object({
    campaignId: z.string().uuid(),
    theme: z.string().min(2)
  });
  const { campaignId, theme } = paramsSchema.parse(request.params);
  const normalizedTheme = theme.trim().toLowerCase();

  const documents = db.data.documents.filter(
    (item) =>
      item.campaignId === campaignId &&
      item.theme.trim().toLowerCase().includes(normalizedTheme)
  );

  const criteria = db.data.criteria.filter(
    (item) =>
      item.campaignId === campaignId &&
      item.theme.trim().toLowerCase().includes(normalizedTheme)
  );

  return {
    documents,
    criteria
  };
});

app.post("/interview-notes", async (request, reply) => {
  const pauseSchema = z.object({
    startAt: z.string().min(10),
    endAt: z.string().min(10)
  });

  const bodySchema = z.object({
    campaignId: z.string().uuid(),
    slotId: z.string().uuid(),
    startedAt: z.string().min(10),
    endedAt: z.string().min(10),
    pauses: z.array(pauseSchema).default([]),
    freeNotes: z.string().max(10000).default("")
  });

  const body = bodySchema.parse(request.body);
  const note = {
    id: randomUUID(),
    ...body
  };

  db.data.interviewNotes.push(note);
  await db.write();
  await logAction(note.campaignId, "interview-note.created", note.id);

  return reply.code(201).send(note);
});

app.get("/interview-notes/:campaignId", async (request) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  return db.data.interviewNotes.filter((item) => item.campaignId === campaignId);
});

app.post("/interview-notes/:noteId/attendances", async (request, reply) => {
  const paramsSchema = z.object({ noteId: z.string().uuid() });
  const { noteId } = paramsSchema.parse(request.params);

  const bodySchema = z.object({
    intervieweeId: z.string().default(""),
    intervieweeName: z.string().min(2),
    planned: z.boolean().default(true),
    present: z.boolean().default(true)
  });

  const body = bodySchema.parse(request.body);
  const attendance = {
    id: randomUUID(),
    interviewNoteId: noteId,
    intervieweeId: body.intervieweeId,
    intervieweeName: body.intervieweeName,
    planned: body.planned,
    present: body.present
  };

  db.data.attendances.push(attendance);
  await db.write();

  return reply.code(201).send(attendance);
});

app.get("/interview-notes/:noteId/attendances", async (request) => {
  const paramsSchema = z.object({ noteId: z.string().uuid() });
  const { noteId } = paramsSchema.parse(request.params);

  return db.data.attendances.filter((item) => item.interviewNoteId === noteId);
});

app.post("/pending-documents", async (request, reply) => {
  const bodySchema = z.object({
    campaignId: z.string().uuid(),
    interviewNoteId: z.string().uuid(),
    name: z.string().min(2),
    requestedFrom: z.string().min(2),
    dueDate: z.string().min(8)
  });

  const body = bodySchema.parse(request.body);
  const pendingDocument = {
    id: randomUUID(),
    ...body,
    transmittedDate: "",
    status: "requested" as const
  };

  db.data.pendingDocuments.push(pendingDocument);
  await db.write();

  return reply.code(201).send(pendingDocument);
});

app.patch("/pending-documents/:pendingDocumentId/transmitted", async (request, reply) => {
  const paramsSchema = z.object({ pendingDocumentId: z.string().uuid() });
  const { pendingDocumentId } = paramsSchema.parse(request.params);

  const bodySchema = z.object({
    transmittedDate: z.string().min(8)
  });

  const body = bodySchema.parse(request.body);
  const index = db.data.pendingDocuments.findIndex((item) => item.id === pendingDocumentId);
  if (index < 0) {
    return reply.code(404).send({ message: "Pending document not found" });
  }

  db.data.pendingDocuments[index] = {
    ...db.data.pendingDocuments[index],
    transmittedDate: body.transmittedDate,
    status: "received"
  };

  await db.write();
  return db.data.pendingDocuments[index];
});

app.get("/pending-documents/:campaignId", async (request) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  return db.data.pendingDocuments.filter((item) => item.campaignId === campaignId);
});

app.post("/interview-notes/:noteId/document-references", async (request, reply) => {
  const paramsSchema = z.object({ noteId: z.string().uuid() });
  const { noteId } = paramsSchema.parse(request.params);

  const bodySchema = z.object({
    documentId: z.string().default(""),
    pendingDocumentId: z.string().default(""),
    reference: z.string().min(2)
  });

  const body = bodySchema.parse(request.body);
  const reference = {
    id: randomUUID(),
    interviewNoteId: noteId,
    documentId: body.documentId,
    pendingDocumentId: body.pendingDocumentId,
    reference: body.reference
  };

  db.data.interviewDocumentReferences.push(reference);
  await db.write();

  return reply.code(201).send(reference);
});

app.get("/interview-notes/:noteId/document-references", async (request) => {
  const paramsSchema = z.object({ noteId: z.string().uuid() });
  const { noteId } = paramsSchema.parse(request.params);

  return db.data.interviewDocumentReferences.filter((item) => item.interviewNoteId === noteId);
});

app.post("/interview-answers", async (request, reply) => {
  const bodySchema = z.object({
    campaignId: z.string().uuid(),
    interviewNoteId: z.string().uuid(),
    questionId: z.string().uuid(),
    conformityScore: z.number().min(0).max(5),
    comment: z.string().max(4000).default("")
  });

  const body = bodySchema.parse(request.body);
  const existingIndex = db.data.interviewAnswers.findIndex(
    (item) => item.interviewNoteId === body.interviewNoteId && item.questionId === body.questionId
  );

  const answer = {
    id: existingIndex >= 0 ? db.data.interviewAnswers[existingIndex].id : randomUUID(),
    ...body
  };

  if (existingIndex >= 0) {
    db.data.interviewAnswers[existingIndex] = answer;
  } else {
    db.data.interviewAnswers.push(answer);
  }

  await db.write();
  await logAction(answer.campaignId, "interview-answer.saved", answer.questionId);
  return reply.code(201).send(answer);
});

app.get("/interview-answers/:noteId", async (request) => {
  const paramsSchema = z.object({ noteId: z.string().uuid() });
  const { noteId } = paramsSchema.parse(request.params);

  return db.data.interviewAnswers.filter((item) => item.interviewNoteId === noteId);
});

app.get("/criteria-score/:campaignId/:criterionId", async (request) => {
  const paramsSchema = z.object({
    campaignId: z.string().uuid(),
    criterionId: z.string().uuid()
  });
  const { campaignId, criterionId } = paramsSchema.parse(request.params);

  const criterionQuestions = db.data.questions.filter(
    (item) => item.campaignId === campaignId && item.criterionId === criterionId
  );

  const scored = criterionQuestions
    .map((question) => {
      const answer = db.data.interviewAnswers
        .filter((item) => item.questionId === question.id && item.campaignId === campaignId)
        .at(-1);

      return {
        questionId: question.id,
        text: question.text,
        weight: question.weight,
        score: answer?.conformityScore ?? null
      };
    })
    .filter((item) => item.score !== null) as Array<{
    questionId: string;
    text: string;
    weight: number;
    score: number;
  }>;

  const weightedScoreSum = scored.reduce((sum, item) => sum + item.score * item.weight, 0);
  const weightSum = scored.reduce((sum, item) => sum + item.weight, 0);
  const weightedAverage = weightSum > 0 ? weightedScoreSum / weightSum : null;

  return {
    campaignId,
    criterionId,
    answeredQuestions: scored.length,
    weightedAverage,
    details: scored
  };
});

app.get("/conformity-matrix/:campaignId", async (request) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  const criteria = db.data.criteria.filter((item) => item.campaignId === campaignId);
  const questions = db.data.questions.filter((item) => item.campaignId === campaignId);

  const matrix = criteria.map((criterion) => {
    const criterionQuestions = questions.filter((item) => item.criterionId === criterion.id);

    const scored = criterionQuestions
      .map((question) => {
        const latestAnswer = db.data.interviewAnswers
          .filter((item) => item.campaignId === campaignId && item.questionId === question.id)
          .at(-1);

        if (!latestAnswer) {
          return null;
        }

        return {
          score: latestAnswer.conformityScore,
          weight: question.weight
        };
      })
      .filter((item) => item !== null) as Array<{ score: number; weight: number }>;

    const weightedScoreSum = scored.reduce((sum, item) => sum + item.score * item.weight, 0);
    const weightSum = scored.reduce((sum, item) => sum + item.weight, 0);

    return {
      criterionId: criterion.id,
      code: criterion.code,
      title: criterion.title,
      theme: criterion.theme,
      answeredQuestions: scored.length,
      totalQuestions: criterionQuestions.length,
      weightedAverage: weightSum > 0 ? weightedScoreSum / weightSum : null
    };
  });

  const overallEntries = matrix.filter((item) => item.weightedAverage !== null) as Array<{
    weightedAverage: number;
  }>;

  const overallAverage = overallEntries.length > 0
    ? overallEntries.reduce((sum, item) => sum + item.weightedAverage, 0) / overallEntries.length
    : null;

  return {
    campaignId,
    criteriaCount: criteria.length,
    overallAverage,
    matrix
  };
});

app.post("/audit-reports/generate/:campaignId", async (request, reply) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  const campaign = db.data.campaigns.find((item) => item.id === campaignId);
  if (!campaign) {
    return reply.code(404).send({ message: "Campaign not found" });
  }

  const criteria = db.data.criteria.filter((item) => item.campaignId === campaignId);
  const questions = db.data.questions.filter((item) => item.campaignId === campaignId);
  const documents = db.data.documents.filter((item) => item.campaignId === campaignId);
  const documentReviews = db.data.documentReviews.filter((item) => item.campaignId === campaignId);
  const interviewNotes = db.data.interviewNotes.filter((item) => item.campaignId === campaignId);
  const pendingDocuments = db.data.pendingDocuments.filter((item) => item.campaignId === campaignId);
  const convention = db.data.conventions.find((item) => item.campaignId === campaignId);
  const scopingNote = db.data.scopingNotes.find((item) => item.campaignId === campaignId);

  const perCriterionScores = criteria.map((criterion) => {
    const criterionQuestions = questions.filter((question) => question.criterionId === criterion.id);

    const scoredAnswers = criterionQuestions
      .map((question) => {
        const answer = db.data.interviewAnswers
          .filter((item) => item.questionId === question.id && item.campaignId === campaignId)
          .at(-1);

        if (!answer) {
          return null;
        }

        return {
          score: answer.conformityScore,
          weight: question.weight
        };
      })
      .filter((item) => item !== null) as Array<{ score: number; weight: number }>;

    const weightedScoreSum = scoredAnswers.reduce((sum, item) => sum + item.score * item.weight, 0);
    const weightSum = scoredAnswers.reduce((sum, item) => sum + item.weight, 0);

    return {
      code: criterion.code,
      title: criterion.title,
      theme: criterion.theme,
      answeredQuestions: scoredAnswers.length,
      weightedAverage: weightSum > 0 ? weightedScoreSum / weightSum : null
    };
  });

  const reportLines: string[] = [];
  reportLines.push(`# Rapport d'audit - ${campaign.name}`);
  reportLines.push("");
  reportLines.push(`- Référentiel: ${campaign.framework}`);
  reportLines.push(`- Langue: ${campaign.language}`);
  reportLines.push(`- Généré le: ${new Date().toISOString()}`);
  reportLines.push("");

  reportLines.push("## 1. Contexte");
  reportLines.push(`- Objectif campagne: ${campaign.name}`);
  reportLines.push(`- Convention auditée/commanditaire: ${convention?.auditedOrganization ?? "N/A"} / ${convention?.sponsorOrganization ?? "N/A"}`);
  reportLines.push(`- Périmètre: ${convention?.perimeter ?? "N/A"}`);
  reportLines.push(`- Objectifs note de cadrage: ${scopingNote?.objectives ?? "N/A"}`);
  reportLines.push("");

  reportLines.push("## 2. Analyse documentaire");
  reportLines.push(`- Nombre de documents référencés: ${documents.length}`);
  reportLines.push(`- Nombre de revues documentaires: ${documentReviews.length}`);
  reportLines.push(`- Documents en attente: ${pendingDocuments.filter((item) => item.status === "requested").length}`);
  reportLines.push("");

  reportLines.push("## 3. Synthèse des entretiens");
  reportLines.push(`- Nombre de notes d'entretien: ${interviewNotes.length}`);
  reportLines.push("");

  reportLines.push("## 4. Conformité par critère");
  perCriterionScores.forEach((item) => {
    const scoreLabel = item.weightedAverage === null ? "N/A" : item.weightedAverage.toFixed(2);
    reportLines.push(`- ${item.code} (${item.theme}) - ${item.title}: score pondéré ${scoreLabel} (${item.answeredQuestions} questions notées)`);
  });
  reportLines.push("");

  reportLines.push("## 5. Limites et actions" );
  reportLines.push("- Ce rapport est une génération initiale MVP.");
  reportLines.push("- Les sections finales de recommandation et conclusion sont à compléter par l'auditeur.");

  const report = {
    id: randomUUID(),
    campaignId,
    title: `Rapport - ${campaign.name}`,
    generatedAt: new Date().toISOString(),
    version: "0.1",
    content: reportLines.join("\n")
  };

  db.data.auditReports.unshift(report);
  await db.write();
  await logAction(campaignId, "audit-report.generated", report.id);

  return reply.code(201).send(report);
});

app.get("/audit-log/:campaignId", async (request) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  const querySchema = z.object({
    period: z.enum(["7d", "30d", "all"]).optional(),
    action: z.string().optional()
  });
  const { period, action } = querySchema.parse(request.query);

  const now = Date.now();
  const periodMs = period === "7d" ? 7 * 24 * 60 * 60 * 1000 : period === "30d" ? 30 * 24 * 60 * 60 * 1000 : null;

  const filtered = db.data.auditLogs.filter((item) => {
    if (item.campaignId !== campaignId) {
      return false;
    }

    if (action && action !== "all" && item.action !== action) {
      return false;
    }

    if (periodMs === null) {
      return true;
    }

    const timestamp = new Date(item.timestamp).getTime();
    return Number.isFinite(timestamp) && now - timestamp <= periodMs;
  });

  return filtered.slice(0, 200);
});

app.get("/audit-reports/:campaignId", async (request) => {
  const paramsSchema = z.object({ campaignId: z.string().uuid() });
  const { campaignId } = paramsSchema.parse(request.params);

  return db.data.auditReports
    .filter((item) => item.campaignId === campaignId)
    .map((item) => ({
      id: item.id,
      title: item.title,
      generatedAt: item.generatedAt,
      version: item.version
    }));
});

app.get("/audit-report/:reportId", async (request, reply) => {
  const paramsSchema = z.object({ reportId: z.string().uuid() });
  const { reportId } = paramsSchema.parse(request.params);

  const report = db.data.auditReports.find((item) => item.id === reportId);
  if (!report) {
    return reply.code(404).send({ message: "Report not found" });
  }

  return report;
});

app.get("/audit-report/:reportId/docx", async (request, reply) => {
  const paramsSchema = z.object({ reportId: z.string().uuid() });
  const { reportId } = paramsSchema.parse(request.params);

  const report = db.data.auditReports.find((item) => item.id === reportId);
  if (!report) {
    return reply.code(404).send({ message: "Report not found" });
  }

  const paragraphs = report.content
    .split("\n")
    .map((line) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line.length > 0 ? line : " "
          })
        ]
      })
    );

  const document = new Document({
    sections: [
      {
        children: paragraphs
      }
    ]
  });

  const buffer = await Packer.toBuffer(document);
  const safeName = report.title
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  reply.header(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  reply.header("Content-Disposition", `attachment; filename=\"${safeName || "rapport-audit"}.docx\"`);
  return reply.send(Buffer.from(buffer));
});

app.post("/generate-questions-from-referential", async (request, reply) => {
  try {
    const data = await request.file();
    if (!data) {
      reply.code(400);
      return { message: "No file provided" };
    }

    const buffer = await data.toBuffer();
    const mimeType = data.mimetype;
    const fieldsData = data.fields as Record<string, Array<{ value: string }>>;

    // Extract form fields
    const campaignIdValue = fieldsData.campaignId?.[0]?.value;
    const criterionCodeValue = fieldsData.criterionCode?.[0]?.value;
    const criterionTitleValue = fieldsData.criterionTitle?.[0]?.value;
    const languageValue = fieldsData.language?.[0]?.value;
    const countValue = fieldsData.count?.[0]?.value;

    if (!campaignIdValue || !criterionCodeValue || !criterionTitleValue) {
      reply.code(400);
      return { message: "Missing required fields: campaignId, criterionCode, criterionTitle" };
    }

    const campaignId = campaignIdValue;
    const criterionCode = criterionCodeValue;
    const criterionTitle = criterionTitleValue;
    const language = languageValue || "fr";
    const count = Math.min(parseInt(countValue || "5") || 5, 10);

    // Parse referential file
    const parsed = await parseReferentialFile(buffer, mimeType);

    // Generate questions using OpenAI
    const questions = await generateQuestionsFromReferential({
      referentialContent: parsed.content,
      referentialTitle: parsed.title,
      criterionCode,
      criterionTitle,
      language,
      count
    });

    // Log the action
    await logAction(
      campaignId,
      "generate_questions_from_referential",
      `Generated ${questions.length} questions from ${parsed.fileType.toUpperCase()} - ${parsed.title}`
    );

    return {
      success: true,
      referential: parsed.title,
      questions
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    app.log.error(error);
    reply.code(400);
    return { message };
  }
});

const port = Number(process.env.API_PORT || 4000);

app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});

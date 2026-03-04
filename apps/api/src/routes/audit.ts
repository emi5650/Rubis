import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db.js";
import { evaluateControl, type ControlFinding } from "../services/auditEvaluator.js";
import { ingestDocumentsFromFolder } from "../services/documentIngest.js";
import { computeScore, type ScoreResult } from "../services/scoring.js";
import { deriveAttackPaths, type AttackPath } from "../services/attackPaths.js";
import { generateAuditReportMarkdown } from "../services/reportGenerator.js";

interface AuditRecord {
  id: string;
  name: string;
  referentialId: string;
  createdAt: string;
  updatedAt: string;
  findings: ControlFinding[];
  score: ScoreResult | null;
  attackPaths: AttackPath[];
  reportMarkdown: string;
}

interface AuditStore {
  audits: AuditRecord[];
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const storePath = resolve(currentDir, "../../data/audits.json");
mkdirSync(dirname(storePath), { recursive: true });

function loadStore(): AuditStore {
  try {
    const raw = readFileSync(storePath, "utf8");
    const parsed = JSON.parse(raw) as AuditStore;
    return {
      audits: Array.isArray(parsed.audits) ? parsed.audits : []
    };
  } catch {
    return { audits: [] };
  }
}

function saveStore(store: AuditStore) {
  writeFileSync(storePath, JSON.stringify(store, null, 2), "utf8");
}

function resolveControls(referentialId: string, controlsFromBody?: Array<{ id: string; text: string; domain?: string }>) {
  if (controlsFromBody && controlsFromBody.length > 0) {
    return controlsFromBody.map((item) => ({
      id: item.id,
      text: item.text,
      domain: item.domain || "general",
      weight: 1
    }));
  }

  const fromDb = db.data.referentialRequirements
    .filter((item) => item.referentialId === referentialId)
    .slice(0, 30)
    .map((item) => ({
      id: item.requirementId,
      text: item.requirementText,
      domain: item.themeLevel1 || "general",
      weight: 1
    }));

  if (fromDb.length > 0) {
    return fromDb;
  }

  return [
    {
      id: "CTRL-DOC-01",
      text: "La politique de sécurité est formalisée, à jour et validée.",
      domain: "gouvernance",
      weight: 1
    },
    {
      id: "CTRL-DOC-02",
      text: "Les preuves de revue des accès sont documentées et périodiques.",
      domain: "acces",
      weight: 1
    }
  ];
}

export async function auditRoutes(app: FastifyInstance) {
  app.post("/api/audits", async (request, reply) => {
    const body = z
      .object({
        name: z.string().min(2).default("Audit documentaire"),
        referentialId: z.string().min(1).default("POC-SCHOOL")
      })
      .parse(request.body ?? {});

    const store = loadStore();
    const now = new Date().toISOString();
    const audit: AuditRecord = {
      id: randomUUID(),
      name: body.name,
      referentialId: body.referentialId,
      createdAt: now,
      updatedAt: now,
      findings: [],
      score: null,
      attackPaths: [],
      reportMarkdown: ""
    };

    store.audits.unshift(audit);
    saveStore(store);
    return reply.code(201).send(audit);
  });

  app.post("/api/audits/:id/ingest", async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        folderPath: z.string().min(1).default("data_school/docs")
      })
      .parse(request.body ?? {});

    const store = loadStore();
    const audit = store.audits.find((item) => item.id === params.id);
    if (!audit) {
      return reply.code(404).send({ message: "Audit introuvable" });
    }

    const ingest = await ingestDocumentsFromFolder({
      auditId: audit.id,
      folderPath: body.folderPath
    });

    audit.updatedAt = new Date().toISOString();
    saveStore(store);
    return { auditId: audit.id, ingest };
  });

  app.post("/api/audits/:id/run", async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        referentialId: z.string().min(1).optional(),
        controls: z
          .array(
            z.object({
              id: z.string().min(1),
              text: z.string().min(1),
              domain: z.string().optional()
            })
          )
          .optional()
      })
      .parse(request.body ?? {});

    const store = loadStore();
    const audit = store.audits.find((item) => item.id === params.id);
    if (!audit) {
      return reply.code(404).send({ message: "Audit introuvable" });
    }

    const referentialId = body.referentialId || audit.referentialId;
    const controls = resolveControls(referentialId, body.controls);

    const findings: ControlFinding[] = [];
    for (const control of controls) {
      const finding = await evaluateControl({
        auditId: audit.id,
        referentialId,
        controlId: control.id,
        controlText: control.text
      });
      findings.push(finding);
    }

    const score = computeScore(
      findings.map((finding) => {
        const control = controls.find((item) => item.id === finding.controlId);
        return {
          controlId: finding.controlId,
          domain: control?.domain || "general",
          status: finding.status,
          weight: control?.weight || 1
        };
      })
    );

    const attackPaths = deriveAttackPaths(findings);
    const report = generateAuditReportMarkdown({
      auditName: audit.name,
      referentialId,
      findings,
      score,
      attackPaths
    });

    audit.findings = findings;
    audit.score = score;
    audit.attackPaths = attackPaths;
    audit.reportMarkdown = report.markdown;
    audit.referentialId = referentialId;
    audit.updatedAt = new Date().toISOString();

    saveStore(store);

    return {
      auditId: audit.id,
      findingsCount: findings.length,
      globalScore: score.globalScore
    };
  });

  app.get("/api/audits/:id/findings", async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const store = loadStore();
    const audit = store.audits.find((item) => item.id === params.id);

    if (!audit) {
      return reply.code(404).send({ message: "Audit introuvable" });
    }

    return { auditId: audit.id, findings: audit.findings };
  });

  app.get("/api/audits/:id/score", async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const store = loadStore();
    const audit = store.audits.find((item) => item.id === params.id);

    if (!audit) {
      return reply.code(404).send({ message: "Audit introuvable" });
    }

    return { auditId: audit.id, score: audit.score };
  });

  app.get("/api/audits/:id/report", async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const store = loadStore();
    const audit = store.audits.find((item) => item.id === params.id);

    if (!audit) {
      return reply.code(404).send({ message: "Audit introuvable" });
    }

    return {
      auditId: audit.id,
      report: audit.reportMarkdown,
      attackPaths: audit.attackPaths
    };
  });
}

import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { ingestDocumentsFromFolder } from "../src/services/documentIngest.js";
import { evaluateControl } from "../src/services/auditEvaluator.js";
import { computeScore } from "../src/services/scoring.js";
import { deriveAttackPaths } from "../src/services/attackPaths.js";
import { generateAuditReportMarkdown } from "../src/services/reportGenerator.js";

test("school regression: ingest -> evaluate -> score -> report", async () => {
  const auditId = randomUUID();
  const docsPath = resolve(process.cwd(), "../../data_school/docs");
  const ingest = await ingestDocumentsFromFolder({
    auditId,
    folderPath: docsPath
  });

  assert.equal(typeof ingest.ingestedDocuments, "number");

  const finding = await evaluateControl({
    auditId,
    referentialId: "POC-SCHOOL",
    controlId: "CTRL-TEST-01",
    controlText: "Le contrôle est documenté et justifié par des preuves."
  });

  assert.equal(typeof finding.status, "string");
  assert.ok(
    finding.citations.length >= 1 ||
      (finding.status === "INDETERMINE" && finding.evidenceGaps.length > 0)
  );

  const score = computeScore([
    { controlId: finding.controlId, domain: "general", status: finding.status, weight: 1 }
  ]);
  assert.equal(typeof score.globalScore, "number");

  const report = generateAuditReportMarkdown({
    auditName: "POC",
    referentialId: "POC-SCHOOL",
    findings: [finding],
    score,
    attackPaths: deriveAttackPaths([finding])
  });

  assert.ok(report.markdown.length > 0);
});

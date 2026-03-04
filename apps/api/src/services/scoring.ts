import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ControlStatus } from "./auditEvaluator.js";

interface ScoringMatrix {
  statusScores: Record<ControlStatus, number>;
  defaultControlWeight: number;
  domainWeights: Record<string, number>;
}

interface ScoredFinding {
  controlId: string;
  domain: string;
  status: ControlStatus;
  weight?: number;
}

export interface ScoreResult {
  globalScore: number;
  byDomain: Array<{ domain: string; score: number }>;
  byControl: Array<{ controlId: string; score: number }>;
}

function parseSimpleYamlMatrix(raw: string): ScoringMatrix {
  const statusScores: Record<ControlStatus, number> = {
    CONFORME: 100,
    PARTIEL: 50,
    NON_CONFORME: 0,
    INDETERMINE: 25
  };
  const domainWeights: Record<string, number> = {};
  let defaultControlWeight = 1;

  let section: "statusScores" | "domainWeights" | "other" = "other";

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.replace(/\t/g, "  ");
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    if (trimmed === "statusScores:") {
      section = "statusScores";
      continue;
    }

    if (trimmed === "domainWeights:") {
      section = "domainWeights";
      continue;
    }

    if (trimmed.startsWith("defaultControlWeight:")) {
      const value = Number(trimmed.split(":").slice(1).join(":").trim());
      if (Number.isFinite(value) && value > 0) {
        defaultControlWeight = value;
      }
      continue;
    }

    const match = trimmed.match(/^([A-Za-z0-9_\-]+)\s*:\s*([0-9.]+)$/);
    if (!match) {
      continue;
    }

    const key = match[1];
    const value = Number(match[2]);
    if (!Number.isFinite(value)) {
      continue;
    }

    if (section === "statusScores") {
      if (key === "CONFORME" || key === "PARTIEL" || key === "NON_CONFORME" || key === "INDETERMINE") {
        statusScores[key] = value;
      }
    } else if (section === "domainWeights") {
      domainWeights[key] = value;
    }
  }

  return { statusScores, defaultControlWeight, domainWeights };
}

function loadScoringMatrix() {
  const filePath = resolve(process.cwd(), "data_school/matrices/scoring_matrix.yaml");
  try {
    const raw = readFileSync(filePath, "utf8");
    return parseSimpleYamlMatrix(raw);
  } catch {
    return parseSimpleYamlMatrix("");
  }
}

function roundTwo(value: number) {
  return Math.round(value * 100) / 100;
}

export function computeScore(findings: ScoredFinding[]): ScoreResult {
  const matrix = loadScoringMatrix();

  const byControl = findings.map((finding) => {
    const base = matrix.statusScores[finding.status] ?? 0;
    const weight = finding.weight ?? matrix.defaultControlWeight;
    return {
      controlId: finding.controlId,
      domain: finding.domain,
      weightedScore: base * weight,
      weight
    };
  });

  const byDomainMap = new Map<string, { scoreSum: number; weightSum: number }>();
  for (const item of byControl) {
    const domainWeight = matrix.domainWeights[item.domain] ?? 1;
    const current = byDomainMap.get(item.domain) || { scoreSum: 0, weightSum: 0 };
    current.scoreSum += item.weightedScore * domainWeight;
    current.weightSum += item.weight * domainWeight;
    byDomainMap.set(item.domain, current);
  }

  const byDomain = [...byDomainMap.entries()].map(([domain, value]) => ({
    domain,
    score: value.weightSum > 0 ? roundTwo(value.scoreSum / value.weightSum) : 0
  }));

  const totalWeightedScore = byControl.reduce((sum, item) => sum + item.weightedScore, 0);
  const totalWeight = byControl.reduce((sum, item) => sum + item.weight, 0);

  return {
    globalScore: totalWeight > 0 ? roundTwo(totalWeightedScore / totalWeight) : 0,
    byDomain,
    byControl: byControl.map((item) => ({
      controlId: item.controlId,
      score: item.weight > 0 ? roundTwo(item.weightedScore / item.weight) : 0
    }))
  };
}

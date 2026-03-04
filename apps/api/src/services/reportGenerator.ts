import type { ControlFinding } from "./auditEvaluator.js";
import type { ScoreResult } from "./scoring.js";
import type { AttackPath } from "./attackPaths.js";

function toCsvRows(headers: string[], rows: string[][]) {
  const escaped = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const all = [headers, ...rows];
  return all.map((row) => row.map((cell) => escaped(cell)).join(",")).join("\n");
}

export function generateAuditReportMarkdown(input: {
  auditName: string;
  referentialId: string;
  findings: ControlFinding[];
  score: ScoreResult;
  attackPaths: AttackPath[];
}) {
  const findingsTable = toCsvRows(
    ["controlId", "status", "confidence", "citations", "gaps"],
    input.findings.map((finding) => [
      finding.controlId,
      finding.status,
      String(finding.confidence),
      String(finding.citations.length),
      finding.evidenceGaps.join(" | ")
    ])
  );

  const questionsTable = toCsvRows(
    ["controlId", "question"],
    input.findings.flatMap((finding) =>
      finding.followUpQuestions.map((question) => [finding.controlId, question])
    )
  );

  const markdown = [
    `# Rapport d'audit documentaire — ${input.auditName}`,
    "",
    "## 1. Objectif",
    "Évaluer la conformité documentaire et la maturité des contrôles selon une approche ISO 19011.",
    "",
    "## 2. Périmètre",
    `Référentiel: ${input.referentialId}`,
    `Nombre de contrôles évalués: ${input.findings.length}`,
    "",
    "## 3. Méthodologie",
    "- Revue documentaire (RAG) par contrôle",
    "- Traçabilité par citations obligatoires",
    "- Scoring déterministe basé matrice YAML",
    "- Validation finale réservée à l'auditeur",
    "",
    "## 4. Constats",
    ...input.findings.map((finding) =>
      `- ${finding.controlId} — ${finding.status} (confiance ${Math.round(finding.confidence * 100)}%)`
    ),
    "",
    "## 5. Scoring",
    `Score global: ${input.score.globalScore}`,
    ...input.score.byDomain.map((item) => `- ${item.domain}: ${item.score}`),
    "",
    "## 6. Attack paths (haut niveau)",
    ...(input.attackPaths.length > 0
      ? input.attackPaths.map((path) => `- ${path.title} [${path.riskLevel}]`)
      : ["- Aucun chemin d'attaque significatif identifié sur ce lot."]),
    "",
    "## 7. Conclusion",
    "Les résultats sont proposés par IA et doivent être validés/ajustés par l’auditeur.",
    "Aucune conclusion n’est retenue sans preuve citée.",
    "",
    "## Annexe A — Constats (CSV)",
    "```csv",
    findingsTable,
    "```",
    "",
    "## Annexe B — Questions complémentaires (CSV)",
    "```csv",
    questionsTable,
    "```",
    ""
  ].join("\n");

  return {
    markdown,
    annexes: {
      findingsCsv: findingsTable,
      followUpQuestionsCsv: questionsTable
    }
  };
}

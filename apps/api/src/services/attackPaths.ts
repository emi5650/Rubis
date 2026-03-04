import type { ControlFinding } from "./auditEvaluator.js";

export interface AttackPath {
  id: string;
  title: string;
  relatedControlIds: string[];
  riskLevel: "low" | "medium" | "high";
  summary: string;
}

export function deriveAttackPaths(findings: ControlFinding[]): AttackPath[] {
  const nonConforming = findings.filter(
    (finding) => finding.status === "NON_CONFORME" || finding.status === "PARTIEL"
  );

  if (nonConforming.length === 0) {
    return [];
  }

  return [
    {
      id: "ap-1",
      title: "Escalade via faiblesses de contrôle documentaire",
      relatedControlIds: nonConforming.map((finding) => finding.controlId),
      riskLevel: nonConforming.some((finding) => finding.status === "NON_CONFORME") ? "high" : "medium",
      summary:
        "Des lacunes documentaires ou de mise en oeuvre peuvent permettre une progression d’attaque (accès initial, mouvement latéral, persistance)."
    }
  ];
}

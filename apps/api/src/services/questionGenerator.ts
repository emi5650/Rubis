import type { Language } from "../types.js";

export interface GenerateQuestionInput {
  criterionCode: string;
  criterionTitle: string;
  audienceRole: string;
  language: Language;
}

export function generateFallbackQuestions(input: GenerateQuestionInput): string[] {
  const { criterionCode, criterionTitle, audienceRole, language } = input;

  if (language === "en") {
    return [
      `How is ${criterionCode} (${criterionTitle}) operationalized for ${audienceRole}?`,
      `Which evidence proves implementation maturity for ${criterionTitle}?`,
      `What controls remain partially implemented and what is the remediation plan?`
    ];
  }

  return [
    `Comment ${criterionCode} (${criterionTitle}) est-il décliné opérationnellement pour ${audienceRole} ?`,
    `Quels éléments de preuve démontrent le niveau de maturité pour ${criterionTitle} ?`,
    `Quelles mesures restent partiellement mises en œuvre et selon quel plan de remédiation ?`
  ];
}

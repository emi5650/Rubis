export type Language = "fr" | "en";

export interface CampaignPayload {
  name: string;
  projectCode: string;
  language?: Language;
  framework?: string;
}

export interface CriterionPayload {
  campaignId: string;
  code: string;
  title: string;
  theme: string;
}

export interface QuestionGenerationPayload {
  criterionId: string;
  audienceRole: string;
  language: Language;
}

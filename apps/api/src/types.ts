export type Language = "fr" | "en";

export interface AuditCampaign {
  id: string;
  name: string;
  projectCode: string;
  language: Language;
  framework: string;
  createdAt: string;
}

export interface AuditCriterion {
  id: string;
  campaignId: string;
  code: string;
  title: string;
  theme: string;
}

export interface InterviewQuestion {
  id: string;
  campaignId: string;
  criterionId: string;
  audienceRole: string;
  language: Language;
  text: string;
  weight: number;
}

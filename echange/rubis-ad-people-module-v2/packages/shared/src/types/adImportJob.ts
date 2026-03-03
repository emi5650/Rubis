
export type ImportJobStatus = "queued" | "running" | "done" | "failed";

export interface ADImportJob {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: ImportJobStatus;

  organisationId: string;
  campaignId?: string;

  identifierType: "email" | "login" | "upn" | "auto";
  identifiers: string[];

  processed: number;
  success: number;
  failed: number;
  errors?: string[];

  resultPersonIds: string[];
}

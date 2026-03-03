
export type PeopleEventType =
  | "ad_search"
  | "ad_import"
  | "ad_refresh"
  | "user_edit"
  | "export_csv"
  | "purge_soft"
  | "delete";

export interface PeopleEvent {
  id: string;
  personId?: string;
  jobId?: string;
  at: string;
  type: PeopleEventType;
  actor: "system" | "user";
  message: string;
  diff?: Record<string, { from?: any; to?: any }>;
}

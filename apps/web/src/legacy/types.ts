export type Language = "fr" | "en";

export type InterviewSlot = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  mode: string;
  room: string;
  teamsLink: string;
  theme: string;
  criterionCode: string;
  outlookSyncEnabled?: boolean;
  outlookEventId?: string;
};

export type CampaignSummary = {
  id: string;
  name: string;
  framework: string;
  language: Language;
  createdAt: string;
};

export type CampaignTab = {
  id: string;
  name: string;
};

export type NavItem = {
  id: string;
  label: string;
  sectionIds: string[];
};

export type NavGroup = {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
};

export type RouteState = {
  view: "workspace" | "dashboard" | "roadmap";
  groupId: string;
  itemId: string;
};

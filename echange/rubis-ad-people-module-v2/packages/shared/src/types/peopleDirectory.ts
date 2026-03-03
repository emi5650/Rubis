
export type PeopleStatus = "active" | "disabled" | "unknown";

export interface PeopleRecord {
  id: string;
  createdAt: string;
  updatedAt: string;

  organisationId: string;
  campaignId?: string;

  source: "AD" | "user";
  fetchedFromAdAt?: string;

  // Minimal identity fields
  mail?: string;
  givenName?: string;
  sn?: string;
  displayName?: string;

  // Org fields
  department?: string;
  company?: string;
  title?: string;
  physicalDeliveryOfficeName?: string;

  // Contact
  telephoneNumber?: string;
  mobile?: string;

  // Address
  streetAddress?: string;
  l?: string;
  postalCode?: string;
  st?: string;
  co?: string;

  // Ids
  samAccountName?: string;
  userPrincipalName?: string;
  distinguishedName?: string;
  employeeId?: string;

  // Relations
  managerDn?: string;
  managerDisplayName?: string;
  memberOfDns?: string[];
  memberOfCns?: string[];

  // Local audit fields
  purpose?: string;
  lawfulBasis?: string;
  tags?: string[];
  notes?: string;

  // RGPD retention
  retentionDays?: number;
  retentionUntil?: string;

  status?: PeopleStatus;

  deletedAt?: string;
}

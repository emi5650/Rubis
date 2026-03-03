import { randomUUID } from "node:crypto";
import { db } from "../db.js";

export type PeopleStatus = "active" | "disabled" | "unknown";

export type PeopleRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  organisationId: string;
  campaignId?: string;
  source: "AD" | "user";
  fetchedFromAdAt?: string;
  personalTitle?: string;
  mail?: string;
  givenName?: string;
  sn?: string;
  displayName?: string;
  department?: string;
  company?: string;
  title?: string;
  physicalDeliveryOfficeName?: string;
  telephoneNumber?: string;
  mobile?: string;
  streetAddress?: string;
  l?: string;
  postalCode?: string;
  st?: string;
  co?: string;
  samAccountName?: string;
  userPrincipalName?: string;
  distinguishedName?: string;
  employeeId?: string;
  managerDn?: string;
  managerDisplayName?: string;
  memberOfDns?: string[];
  memberOfCns?: string[];
  passiScopes?: string[];
  isAuditManager?: boolean;
  passiAttestationValidUntil?: string;
  purpose?: string;
  lawfulBasis?: string;
  tags?: string[];
  notes?: string;
  retentionDays?: number;
  retentionUntil?: string;
  status?: PeopleStatus;
  deletedAt?: string;
};

type ListFilters = {
  q?: string;
  campaignId?: string;
  status?: PeopleStatus;
  includeDeleted?: boolean;
  limit?: number;
};

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function keepRawString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function computeRetentionUntil(baseIso: string, retentionDays: number) {
  const date = new Date(baseIso);
  date.setDate(date.getDate() + retentionDays);
  return date.toISOString();
}

export function addPeopleEvent(input: {
  personId?: string;
  type: "ad_search" | "ad_import" | "ad_refresh" | "user_edit" | "export_csv" | "purge_soft" | "delete";
  actor: "system" | "user";
  message: string;
  jobId?: string;
  diff?: Record<string, { from?: unknown; to?: unknown }>;
}) {
  db.data.peopleEvents.unshift({
    id: randomUUID(),
    personId: input.personId,
    jobId: input.jobId,
    at: new Date().toISOString(),
    type: input.type,
    actor: input.actor,
    message: input.message,
    diff: input.diff
  });

  if (db.data.peopleEvents.length > 5000) {
    db.data.peopleEvents = db.data.peopleEvents.slice(0, 5000);
  }
}

export function listPeople(filters: ListFilters = {}) {
  const q = normalize(filters.q).toLowerCase();
  const includeDeleted = filters.includeDeleted === true;

  let items = db.data.peopleDirectory.filter((item) => includeDeleted || !item.deletedAt);

  if (filters.campaignId) {
    items = items.filter((item) => item.campaignId === filters.campaignId);
  }

  if (filters.status) {
    items = items.filter((item) => (item.status || "unknown") === filters.status);
  }

  if (q) {
    items = items.filter((item) => {
      const searchable = [
        item.displayName,
        item.mail,
        item.samAccountName,
        item.userPrincipalName,
        item.department,
        item.company,
        item.employeeId
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }

  items = items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  if (filters.limit && filters.limit > 0) {
    items = items.slice(0, filters.limit);
  }

  return items;
}

export function getPersonById(id: string) {
  return db.data.peopleDirectory.find((item) => item.id === id) || null;
}

export function createPerson(input: {
  organisationId: string;
  campaignId?: string;
  source?: "AD" | "user";
  displayName?: string;
  mail?: string;
  status?: PeopleStatus;
}) {
  const now = new Date().toISOString();
  const retentionDays = 365;
  const person: PeopleRecord = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    organisationId: normalize(input.organisationId) || "default",
    campaignId: normalize(input.campaignId) || undefined,
    source: input.source || "user",
    displayName: normalize(input.displayName) || undefined,
    mail: normalize(input.mail).toLowerCase() || undefined,
    status: input.status || "unknown",
    retentionDays,
    retentionUntil: computeRetentionUntil(now, retentionDays)
  };

  db.data.peopleDirectory.unshift(person);
  return person;
}

export function updatePerson(id: string, patch: Partial<PeopleRecord>) {
  const index = db.data.peopleDirectory.findIndex((item) => item.id === id);
  if (index < 0) {
    return null;
  }

  const current = db.data.peopleDirectory[index];
  const retentionDays =
    typeof patch.retentionDays === "number" && Number.isFinite(patch.retentionDays)
      ? Math.max(1, Math.floor(patch.retentionDays))
      : current.retentionDays;

  const normalizedPassiScopes = Array.isArray(patch.passiScopes)
    ? patch.passiScopes
        .map((value) => normalize(value))
        .filter(Boolean)
        .slice(0, 20)
    : current.passiScopes;

  const normalizedPassiAttestationValidUntil =
    typeof patch.passiAttestationValidUntil === "string"
      ? normalize(patch.passiAttestationValidUntil) || undefined
      : current.passiAttestationValidUntil;

  const next: PeopleRecord = {
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
    passiScopes: normalizedPassiScopes,
    passiAttestationValidUntil: normalizedPassiAttestationValidUntil,
    retentionDays,
    retentionUntil: retentionDays ? computeRetentionUntil(new Date().toISOString(), retentionDays) : current.retentionUntil
  };

  db.data.peopleDirectory[index] = next;
  return next;
}

export function upsertPersonFromAd(input: {
  organisationId: string;
  campaignId?: string;
  personalTitle?: string;
  mail?: string;
  displayName?: string;
  givenName?: string;
  sn?: string;
  department?: string;
  company?: string;
  title?: string;
  physicalDeliveryOfficeName?: string;
  telephoneNumber?: string;
  mobile?: string;
  streetAddress?: string;
  l?: string;
  postalCode?: string;
  st?: string;
  co?: string;
  samAccountName?: string;
  userPrincipalName?: string;
  distinguishedName?: string;
  employeeId?: string;
  managerDn?: string;
  managerDisplayName?: string;
  memberOfDns?: string[];
  memberOfCns?: string[];
}) {
  const now = new Date().toISOString();
  const normalizedMail = normalize(input.mail).toLowerCase();
  const normalizedUpn = normalize(input.userPrincipalName).toLowerCase();
  const normalizedSam = normalize(input.samAccountName).toLowerCase();
  const normalizedDn = normalize(input.distinguishedName).toLowerCase();

  const index = db.data.peopleDirectory.findIndex((item) => {
    const itemMail = normalize(item.mail).toLowerCase();
    const itemUpn = normalize(item.userPrincipalName).toLowerCase();
    const itemSam = normalize(item.samAccountName).toLowerCase();
    const itemDn = normalize(item.distinguishedName).toLowerCase();

    return (
      (normalizedMail && itemMail && normalizedMail === itemMail) ||
      (normalizedUpn && itemUpn && normalizedUpn === itemUpn) ||
      (normalizedSam && itemSam && normalizedSam === itemSam) ||
      (normalizedDn && itemDn && normalizedDn === itemDn)
    );
  });

  const basePatch: Partial<PeopleRecord> = {
    organisationId: normalize(input.organisationId) || "default",
    campaignId: normalize(input.campaignId) || undefined,
    source: "AD",
    fetchedFromAdAt: now,
    personalTitle: keepRawString(input.personalTitle),
    mail: normalizedMail || undefined,
    displayName: normalize(input.displayName) || undefined,
    givenName: normalize(input.givenName) || undefined,
    sn: normalize(input.sn) || undefined,
    department: normalize(input.department) || undefined,
    company: normalize(input.company) || undefined,
    title: normalize(input.title) || undefined,
    physicalDeliveryOfficeName: normalize(input.physicalDeliveryOfficeName) || undefined,
    telephoneNumber: normalize(input.telephoneNumber) || undefined,
    mobile: normalize(input.mobile) || undefined,
    streetAddress: normalize(input.streetAddress) || undefined,
    l: normalize(input.l) || undefined,
    postalCode: normalize(input.postalCode) || undefined,
    st: normalize(input.st) || undefined,
    co: normalize(input.co) || undefined,
    samAccountName: normalizedSam || undefined,
    userPrincipalName: normalizedUpn || undefined,
    distinguishedName: normalizedDn || undefined,
    employeeId: normalize(input.employeeId) || undefined,
    managerDn: normalize(input.managerDn) || undefined,
    managerDisplayName: normalize(input.managerDisplayName) || undefined,
    memberOfDns: Array.isArray(input.memberOfDns) ? input.memberOfDns.filter((x) => typeof x === "string") : undefined,
    memberOfCns: Array.isArray(input.memberOfCns) ? input.memberOfCns.filter((x) => typeof x === "string") : undefined,
    status: "active"
  };

  if (index >= 0) {
    const updated = {
      ...db.data.peopleDirectory[index],
      ...basePatch,
      id: db.data.peopleDirectory[index].id,
      createdAt: db.data.peopleDirectory[index].createdAt,
      updatedAt: now
    };

    db.data.peopleDirectory[index] = updated;
    return { person: updated, created: false };
  }

  const retentionDays = 365;
  const created: PeopleRecord = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    organisationId: basePatch.organisationId || "default",
    campaignId: basePatch.campaignId,
    source: "AD",
    fetchedFromAdAt: now,
    personalTitle: basePatch.personalTitle,
    displayName: basePatch.displayName,
    givenName: basePatch.givenName,
    sn: basePatch.sn,
    mail: basePatch.mail,
    department: basePatch.department,
    company: basePatch.company,
    title: basePatch.title,
    physicalDeliveryOfficeName: basePatch.physicalDeliveryOfficeName,
    telephoneNumber: basePatch.telephoneNumber,
    mobile: basePatch.mobile,
    streetAddress: basePatch.streetAddress,
    l: basePatch.l,
    postalCode: basePatch.postalCode,
    st: basePatch.st,
    co: basePatch.co,
    samAccountName: basePatch.samAccountName,
    userPrincipalName: basePatch.userPrincipalName,
    distinguishedName: basePatch.distinguishedName,
    employeeId: basePatch.employeeId,
    managerDn: basePatch.managerDn,
    managerDisplayName: basePatch.managerDisplayName,
    memberOfDns: basePatch.memberOfDns,
    memberOfCns: basePatch.memberOfCns,
    retentionDays,
    retentionUntil: computeRetentionUntil(now, retentionDays),
    status: "active"
  };

  db.data.peopleDirectory.unshift(created);
  return { person: created, created: true };
}

export function refreshPersonFromAd(id: string) {
  const index = db.data.peopleDirectory.findIndex((item) => item.id === id);
  if (index < 0) {
    return null;
  }

  db.data.peopleDirectory[index] = {
    ...db.data.peopleDirectory[index],
    fetchedFromAdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return db.data.peopleDirectory[index];
}

export function softDeletePerson(id: string) {
  const index = db.data.peopleDirectory.findIndex((item) => item.id === id);
  if (index < 0) {
    return null;
  }

  const now = new Date().toISOString();
  const current = db.data.peopleDirectory[index];
  const next: PeopleRecord = {
    ...current,
    deletedAt: current.deletedAt || now,
    status: current.status === "unknown" ? "unknown" : "disabled",
    updatedAt: now
  };

  db.data.peopleDirectory[index] = next;
  return next;
}

export function getExpiredPeople(nowIso = new Date().toISOString()) {
  const now = new Date(nowIso).getTime();
  return db.data.peopleDirectory.filter((item) => {
    if (item.deletedAt || !item.retentionUntil) {
      return false;
    }

    const retentionTime = new Date(item.retentionUntil).getTime();
    return Number.isFinite(retentionTime) && retentionTime <= now;
  });
}

export function purgeExpiredPeople(options: { dryRun?: boolean; limit?: number }) {
  const expired = getExpiredPeople();
  const limit = options.limit && options.limit > 0 ? options.limit : expired.length;
  const selected = expired.slice(0, limit);

  if (!options.dryRun) {
    const now = new Date().toISOString();
    const ids = new Set(selected.map((item) => item.id));
    db.data.peopleDirectory = db.data.peopleDirectory.map((item) =>
      ids.has(item.id)
        ? {
            ...item,
            deletedAt: item.deletedAt || now,
            updatedAt: now
          }
        : item
    );
  }

  return {
    totalExpired: expired.length,
    selectedCount: selected.length,
    selected
  };
}

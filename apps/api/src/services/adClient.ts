import { Client, type SearchOptions } from "ldapts";

export type AdUser = {
  personalTitle?: string;
  mail?: string;
  givenName?: string;
  sn?: string;
  displayName?: string;
  telephoneNumber?: string;
  mobile?: string;
  streetAddress?: string;
  l?: string;
  postalCode?: string;
  st?: string;
  co?: string;
  department?: string;
  company?: string;
  physicalDeliveryOfficeName?: string;
  title?: string;
  managerDn?: string;
  managerDisplayName?: string;
  samAccountName?: string;
  userPrincipalName?: string;
  distinguishedName?: string;
  employeeId?: string;
  memberOfDns?: string[];
  memberOfCns?: string[];
};

type IdentifierMode = "auto" | "email" | "login" | "upn" | "name";

type AdConfig = {
  url: string;
  baseDn: string;
  bindDn: string;
  bindPassword: string;
  timeoutMs: number;
  strictLdaps: boolean;
  tlsRejectUnauthorized: boolean;
};

export type AdAuthOverride = {
  bindLogin?: string;
  bindPassword?: string;
};

function getEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function getAdConfig(): AdConfig {
  const url = getEnv("RUBIS_AD_URL");
  const baseDn = getEnv("RUBIS_AD_BASE_DN");
  const bindDn = getEnv("RUBIS_AD_BIND_DN");
  const bindPassword = process.env.RUBIS_AD_BIND_PASSWORD || "";
  const timeoutMs = Number(process.env.RUBIS_AD_TIMEOUT_MS || 8000);
  const strictLdaps = (process.env.RUBIS_AD_STRICT_LDAPS || "true").toLowerCase() !== "false";
  const tlsRejectUnauthorized = (process.env.RUBIS_AD_TLS_REJECT_UNAUTHORIZED || "true").toLowerCase() !== "false";

  return {
    url,
    baseDn,
    bindDn,
    bindPassword,
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 8000,
    strictLdaps,
    tlsRejectUnauthorized
  };
}

export function isAdConfigured() {
  const cfg = getAdConfig();
  return Boolean(cfg.url && cfg.baseDn);
}

function assertAdConfigured() {
  if (!isAdConfigured()) {
    throw new Error("AD non configuré (RUBIS_AD_URL, RUBIS_AD_BASE_DN)");
  }
}

function resolveBindCredentials(cfg: AdConfig, authOverride?: AdAuthOverride) {
  const overrideLogin = typeof authOverride?.bindLogin === "string" ? authOverride.bindLogin.trim() : "";
  const overridePassword = typeof authOverride?.bindPassword === "string" ? authOverride.bindPassword : "";

  if (overrideLogin && overridePassword) {
    return { bindDn: overrideLogin, bindPassword: overridePassword };
  }

  if (cfg.bindDn && cfg.bindPassword) {
    return { bindDn: cfg.bindDn, bindPassword: cfg.bindPassword };
  }

  throw new Error(
    "Identifiants AD manquants: utilisez le login AD dans l'application ou configurez RUBIS_AD_BIND_DN/RUBIS_AD_BIND_PASSWORD"
  );
}

function escapeLdapValue(value: string) {
  return value
    .replace(/\\/g, "\\5c")
    .replace(/\*/g, "\\2a")
    .replace(/\(/g, "\\28")
    .replace(/\)/g, "\\29")
    .replace(/\u0000/g, "\\00");
}

function mapEntryToAdUser(entry: Record<string, unknown>): AdUser {
  const toString = (value: unknown) => (typeof value === "string" ? value : undefined);
  const toStringArray = (value: unknown) => {
    if (!Array.isArray(value)) {
      return undefined;
    }
    return value.filter((item): item is string => typeof item === "string");
  };

  const memberOfDns = toStringArray(entry.memberOf);
  const memberOfCns = memberOfDns?.map((dn) => {
    const firstPart = dn.split(",")[0] || "";
    if (firstPart.startsWith("CN=")) {
      return firstPart.slice(3);
    }
    return dn;
  });

  return {
    personalTitle: toString(entry.personalTitle),
    mail: toString(entry.mail),
    givenName: toString(entry.givenName),
    sn: toString(entry.sn),
    displayName: toString(entry.displayName),
    telephoneNumber: toString(entry.telephoneNumber),
    mobile: toString(entry.mobile),
    streetAddress: toString(entry.streetAddress),
    l: toString(entry.l),
    postalCode: toString(entry.postalCode),
    st: toString(entry.st),
    co: toString(entry.co),
    department: toString(entry.department),
    company: toString(entry.company),
    physicalDeliveryOfficeName: toString(entry.physicalDeliveryOfficeName),
    title: toString(entry.title),
    managerDn: toString(entry.manager),
    samAccountName: toString(entry.sAMAccountName),
    userPrincipalName: toString(entry.userPrincipalName),
    distinguishedName: toString(entry.distinguishedName),
    employeeId: toString(entry.employeeID),
    memberOfDns,
    memberOfCns
  };
}

async function withAdClient<T>(handler: (client: Client, cfg: AdConfig) => Promise<T>, authOverride?: AdAuthOverride) {
  assertAdConfigured();
  const cfg = getAdConfig();
  const bind = resolveBindCredentials(cfg, authOverride);

  if (cfg.strictLdaps && !cfg.url.toLowerCase().startsWith("ldaps://")) {
    throw new Error("RUBIS_AD_STRICT_LDAPS=true exige une URL ldaps://");
  }

  const client = new Client({
    url: cfg.url,
    timeout: cfg.timeoutMs,
    connectTimeout: cfg.timeoutMs,
    tlsOptions: cfg.url.toLowerCase().startsWith("ldaps://") ? { rejectUnauthorized: cfg.tlsRejectUnauthorized } : undefined
  });

  try {
    await client.bind(bind.bindDn, bind.bindPassword);
    return await handler(client, cfg);
  } finally {
    await client.unbind().catch(() => undefined);
  }
}

export async function testAdConnection(authOverride?: AdAuthOverride) {
  return withAdClient(async (client, cfg) => {
    const options: SearchOptions = {
      scope: "base",
      filter: "(objectClass=*)",
      attributes: ["distinguishedName"],
      sizeLimit: 1
    };

    await client.search(cfg.baseDn, options);
    return { ok: true, message: "AD connection successful" };
  }, authOverride);
}

export async function searchAdUsers(query: string, mode: IdentifierMode = "auto", authOverride?: AdAuthOverride) {
  const normalized = query.trim();
  if (!normalized) {
    return [] as AdUser[];
  }

  const escaped = escapeLdapValue(normalized);
  let filter = "";

  if (mode === "email" || (mode === "auto" && normalized.includes("@"))) {
    filter = `(mail=${escaped})`;
  } else if (mode === "upn") {
    filter = `(userPrincipalName=${escaped})`;
  } else if (mode === "login") {
    filter = `(sAMAccountName=${escaped})`;
  } else if (mode === "name") {
    filter = `(|(displayName=*${escaped}*)(givenName=*${escaped}*)(sn=*${escaped}*))`;
  } else {
    filter = `(|(mail=${escaped})(userPrincipalName=${escaped})(sAMAccountName=${escaped})(displayName=*${escaped}*))`;
  }

  const baseFilter = "(&(objectCategory=person)(objectClass=user)(!(objectClass=computer)))";
  const finalFilter = `(&${baseFilter}${filter})`;

  return withAdClient(async (client, cfg) => {
    const options: SearchOptions = {
      scope: "sub",
      filter: finalFilter,
      sizeLimit: 100,
      paged: true,
      attributes: [
        "personalTitle",
        "mail",
        "givenName",
        "sn",
        "displayName",
        "telephoneNumber",
        "mobile",
        "streetAddress",
        "l",
        "postalCode",
        "st",
        "co",
        "department",
        "company",
        "physicalDeliveryOfficeName",
        "title",
        "manager",
        "sAMAccountName",
        "userPrincipalName",
        "distinguishedName",
        "employeeID",
        "memberOf"
      ]
    };

    const result = await client.search(cfg.baseDn, options);
    const users = (result.searchEntries || [])
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => mapEntryToAdUser(entry as Record<string, unknown>));

    return users;
  }, authOverride);
}


/**
 * AD Client (ldapts)
 * TODO:
 * - Implement LDAP/LDAPS connection using ldapts
 * - Bind using env credentials
 * - Implement search with safe filter construction + escaping
 * - Optional: resolve manager displayName, resolve group CNs
 */
export async function testAdConnection() {
  return { ok: false, message: "Not implemented" };
}

export async function searchAdUsers(query: string, mode: "auto"|"email"|"login"|"upn"|"name" = "auto") {
  return [];
}

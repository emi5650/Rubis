
/**
 * RGPD retention engine
 * TODO:
 * - Load config/rgpd.yml
 * - Compute retentionUntil
 * - Find expired records
 * - Purge soft (dryRun supported)
 * - Optional scheduled purge job (cron)
 */
export function computeRetentionUntil(baseIso: string, retentionDays: number): string {
  const d = new Date(baseIso);
  d.setDate(d.getDate() + retentionDays);
  return d.toISOString();
}

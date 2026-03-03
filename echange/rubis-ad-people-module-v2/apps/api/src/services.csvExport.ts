
/**
 * CSV export helper
 * TODO:
 * - Streaming CSV response
 * - delimiter ; default, BOM optional
 * - selectable columns
 * - proper escaping for CSV
 */
export function csvEscape(value: any, delimiter: string): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  const mustQuote = s.includes('"') || s.includes("\n") || s.includes("\r") || s.includes(delimiter);
  const escaped = s.replace(/"/g, '""');
  return mustQuote ? `"${escaped}"` : escaped;
}

export function csvEscape(value: unknown, delimiter = ";"): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  const mustQuote =
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r") ||
    text.includes(delimiter);

  const escaped = text.replace(/"/g, '""');
  return mustQuote ? `"${escaped}"` : escaped;
}

export function buildCsv(headers: string[], rows: Array<Array<unknown>>, delimiter = ";", includeBom = true): string {
  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(row.map((cell) => csvEscape(cell, delimiter)).join(delimiter));
  }

  const body = `${lines.join("\n")}\n`;
  return includeBom ? `\uFEFF${body}` : body;
}

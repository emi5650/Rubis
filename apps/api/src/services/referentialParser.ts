import pdfParse from "pdf-parse/index.js";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

export interface ParsedReferential {
  title: string;
  content: string;
  fileType: "pdf" | "xlsx" | "csv" | "txt" | "docx";
  pageCount?: number;
}

export interface ParsedTabularFile {
  headers: string[];
  rows: Array<Record<string, string>>;
  sheets?: string[];
  currentSheet?: string;
}

export async function parsePdfFile(buffer: Buffer): Promise<ParsedReferential> {
  try {
    const pdfData = await pdfParse(buffer);
    const content = pdfData.text;
    const title = `PDF Document (${pdfData.numpages} pages)`;

    return {
      title,
      content: content.slice(0, 50000), // Limit to 50k chars for API
      fileType: "pdf",
      pageCount: pdfData.numpages
    };
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function parseDocxFile(buffer: Buffer): Promise<ParsedReferential> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const content = result.value || "";
    return {
      title: "Word Document",
      content: content.slice(0, 50000),
      fileType: "docx"
    };
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export function parseExcelFile(buffer: Buffer): ParsedReferential {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("No sheets found in Excel file");
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    // Convert rows to structured text
    const content = rows
      .map((row, idx) =>
        `Row ${idx + 1}: ${Object.entries(row)
          .map(([key, value]) => `${key}: ${value}`)
          .join(" | ")}`
      )
      .join("\n");

    const title = `Excel Sheet: ${sheetName} (${rows.length} rows)`;

    return {
      title,
      content: content.slice(0, 50000), // Limit to 50k chars for API
      fileType: "xlsx"
    };
  } catch (error) {
    throw new Error(
      `Failed to parse Excel: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

function sheetToTabular(sheet: XLSX.WorkSheet): ParsedTabularFile {
  const rawRows = XLSX.utils.sheet_to_json<Array<unknown>>(sheet, { header: 1, defval: "" });
  if (rawRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headerRow = rawRows[0].map((cell) => String(cell ?? "").trim());
  const hasHeader = headerRow.some((cell) => cell.length > 0);
  const dataStart = hasHeader ? 1 : 0;

  const maxLen = rawRows.reduce((max, row) => Math.max(max, row.length), 0);
  const headers = hasHeader
    ? headerRow.map((cell, idx) => (cell ? cell : `Column${idx + 1}`))
    : Array.from({ length: maxLen }, (_, idx) => `Column${idx + 1}`);

  const rows = rawRows.slice(dataStart).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      const value = row[idx];
      record[header] = value === undefined || value === null ? "" : String(value);
    });
    return record;
  });

  return { headers, rows };
}

export function parseTabularFile(buffer: Buffer, mimeType: string, sheetName?: string): ParsedTabularFile {
  if (mimeType === "text/plain" || mimeType.endsWith(".txt")) {
    const lines = buffer.toString("utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    return {
      headers: ["Text"],
      rows: lines.map((line) => ({ Text: line })),
      sheets: ["Text"],
      currentSheet: "Text"
    };
  }

  if (
    mimeType === "text/csv" ||
    mimeType.endsWith(".csv") ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType.endsWith(".xlsx") ||
    mimeType.endsWith(".xls")
  ) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheets = workbook.SheetNames;
    const selectedSheet = sheetName && sheets.includes(sheetName) ? sheetName : sheets[0];
    
    if (!selectedSheet) {
      return { headers: [], rows: [], sheets: [], currentSheet: undefined };
    }
    
    const sheet = workbook.Sheets[selectedSheet];
    const tabularData = sheetToTabular(sheet);
    
    return {
      ...tabularData,
      sheets,
      currentSheet: selectedSheet
    };
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

export async function parseReferentialFile(
  buffer: Buffer,
  mimeType: string
): Promise<ParsedReferential> {
  if (mimeType === "application/pdf" || mimeType.endsWith(".pdf")) {
    return parsePdfFile(buffer);
  } else if (mimeType === "text/plain" || mimeType.endsWith(".txt")) {
    const content = buffer.toString("utf8");
    return {
      title: "Text Document",
      content: content.slice(0, 50000),
      fileType: "txt"
    };
  } else if (mimeType === "text/csv" || mimeType.endsWith(".csv")) {
    const content = buffer.toString("utf8");
    return {
      title: "CSV Document",
      content: content.slice(0, 50000),
      fileType: "csv"
    };
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType.endsWith(".xlsx") ||
    mimeType.endsWith(".xls")
  ) {
    return parseExcelFile(buffer);
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType.endsWith(".docx")
  ) {
    return parseDocxFile(buffer);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

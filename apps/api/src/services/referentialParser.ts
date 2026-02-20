import pdfParse from "pdf-parse/index.js";
import * as XLSX from "xlsx";

export interface ParsedReferential {
  title: string;
  content: string;
  fileType: "pdf" | "xlsx";
}

export async function parsePdfFile(buffer: Buffer): Promise<ParsedReferential> {
  try {
    const pdfData = await pdfParse(buffer);
    const content = pdfData.text;
    const title = `PDF Document (${pdfData.numpages} pages)`;

    return {
      title,
      content: content.slice(0, 50000), // Limit to 50k chars for API
      fileType: "pdf"
    };
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
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

export async function parseReferentialFile(
  buffer: Buffer,
  mimeType: string
): Promise<ParsedReferential> {
  if (mimeType === "application/pdf" || mimeType.endsWith(".pdf")) {
    return parsePdfFile(buffer);
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType.endsWith(".xlsx") ||
    mimeType.endsWith(".xls")
  ) {
    return parseExcelFile(buffer);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

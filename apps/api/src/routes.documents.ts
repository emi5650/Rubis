import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "./db.js";
import { extractRegistryFields } from "./services/documentRegistry.extractor.js";

const envDir = dirname(fileURLToPath(import.meta.url));
const uploadsDir = resolve(envDir, "../data/uploads");
mkdirSync(uploadsDir, { recursive: true });

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp"
]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt", ".csv", ".xlsx", ".xls", ".docx", ".png", ".jpg", ".jpeg", ".webp"]);

function sanitizeField(input: string, max = 400) {
  return input.trim().replace(/\s+/g, " ").slice(0, max);
}

function assertCampaignExists(campaignId: string) {
  const exists = db.data.campaigns.some((item) => item.id === campaignId);
  if (!exists) {
    throw new Error("Campaign not found");
  }
}

function csvCell(value: string | number | undefined | null) {
  const raw = value === undefined || value === null ? "" : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

function addRegistryEvent(input: {
  campaignId: string;
  documentId: string;
  action: "uploaded" | "extracted" | "updated" | "validated" | "archived" | "deleted";
  actor: "system" | "user";
  details: string;
}) {
  db.data.documentRegistryEvents.unshift({
    id: randomUUID(),
    campaignId: input.campaignId,
    documentId: input.documentId,
    action: input.action,
    actor: input.actor,
    details: input.details,
    timestamp: new Date().toISOString()
  });
}

function addAuditLog(campaignId: string, action: string, details: string) {
  db.data.auditLogs.unshift({
    id: randomUUID(),
    campaignId,
    action,
    timestamp: new Date().toISOString(),
    details
  });
}

export async function documentRegistryRoutes(app: FastifyInstance) {
  app.post("/api/documents/upload", async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        reply.code(400);
        return { message: "No file provided" };
      }

      const fields = (data as any).fields as Record<string, { value?: string } | Array<{ value?: string }>>;
      const rawCampaignField = fields?.campaignId;
      const campaignId = Array.isArray(rawCampaignField)
        ? String(rawCampaignField[0]?.value || "")
        : String(rawCampaignField?.value || "");

      z.string().uuid().parse(campaignId);
      assertCampaignExists(campaignId);

      const buffer = await data.toBuffer();
      const filename = data.filename || `document-${Date.now()}`;
      const mimeType = data.mimetype || "application/octet-stream";
      const extension = extname(filename).toLowerCase();

      if (buffer.length === 0) {
        reply.code(400);
        return { message: "Empty file" };
      }

      if (buffer.length > MAX_UPLOAD_SIZE_BYTES) {
        reply.code(413);
        return { message: `File too large (max ${MAX_UPLOAD_SIZE_BYTES} bytes)` };
      }

      if (!ALLOWED_MIME_TYPES.has(mimeType) && !ALLOWED_EXTENSIONS.has(extension)) {
        reply.code(400);
        return { message: `Unsupported file type: ${mimeType}` };
      }

      const safeBase = filename
        .replace(extension, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 80);
      const fileId = randomUUID();
      const storageName = `${Date.now()}-${fileId}-${safeBase}${extension}`;
      const storagePath = resolve(uploadsDir, storageName);
      writeFileSync(storagePath, buffer);

      const extracted = await extractRegistryFields({ filename, mimeType, buffer });
      const now = new Date().toISOString();
      const documentId = randomUUID();
      const status = "imported";

      const record = {
        id: documentId,
        campaignId,
        createdAt: now,
        updatedAt: now,
        currentFileId: fileId,
        filename,
        mimeType,
        size: buffer.length,
        storagePath,
        title: extracted.fields.title,
        version: extracted.fields.version,
        publishedAt: extracted.fields.publishedAt,
        author: extracted.fields.author,
        sensitivity: extracted.fields.sensitivity,
        status
      } as const;

      db.data.documentRegistry.unshift(record);
      addRegistryEvent({
        campaignId,
        documentId,
        action: "uploaded",
        actor: "user",
        details: `Uploaded ${filename}`
      });
      addRegistryEvent({
        campaignId,
        documentId,
        action: "extracted",
        actor: "system",
        details: `Metadata extraction mode: ${extracted.provider}`
      });
      addAuditLog(campaignId, "document_registry.uploaded", `${documentId} - ${filename}`);

      await db.write();
      return reply.code(201).send({
        document: record,
        provider: extracted.provider
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      reply.code(400);
      return { message };
    }
  });

  app.get("/api/documents", async (request, reply) => {
    try {
      const querySchema = z.object({ campaignId: z.string().uuid() });
      const { campaignId } = querySchema.parse(request.query);
      const items = db.data.documentRegistry.filter((item) => item.campaignId === campaignId);
      return { items };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      reply.code(400);
      return { message };
    }
  });

  app.get("/api/documents/:id", async (request, reply) => {
    try {
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      const record = db.data.documentRegistry.find((item) => item.id === params.id);
      if (!record) {
        reply.code(404);
        return { message: "Document not found" };
      }

      const events = db.data.documentRegistryEvents
        .filter((event) => event.documentId === params.id)
        .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

      return { record, events };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      reply.code(400);
      return { message };
    }
  });

  app.patch("/api/documents/:id", async (request, reply) => {
    try {
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = z
        .object({
          campaignId: z.string().uuid(),
          title: z.string().max(300).optional(),
          version: z.string().max(80).optional(),
          publishedAt: z.string().max(20).optional(),
          author: z.string().max(300).optional(),
          sensitivity: z.string().max(80).optional(),
          status: z.enum(["imported", "extracted", "needs_review", "validated", "archived"]).optional()
        })
        .parse(request.body);
      assertCampaignExists(body.campaignId);

      const index = db.data.documentRegistry.findIndex((item) => item.id === params.id);
      if (index < 0) {
        reply.code(404);
        return { message: "Document not found" };
      }

      const existing = db.data.documentRegistry[index];
      if (existing.campaignId !== body.campaignId) {
        reply.code(400);
        return { message: "Campaign mismatch" };
      }

      const toUserField = (field: typeof existing.title, value: string) => ({
        ...field,
        value,
        source: "user" as const,
        confidence: "medium" as const
      });

      const updated = {
        ...existing,
        updatedAt: new Date().toISOString(),
        title: body.title !== undefined ? toUserField(existing.title, sanitizeField(body.title, 300)) : existing.title,
        version:
          body.version !== undefined ? toUserField(existing.version, sanitizeField(body.version, 80)) : existing.version,
        publishedAt:
          body.publishedAt !== undefined
            ? toUserField(existing.publishedAt, sanitizeField(body.publishedAt, 20))
            : existing.publishedAt,
        author: body.author !== undefined ? toUserField(existing.author, sanitizeField(body.author, 300)) : existing.author,
        sensitivity:
          body.sensitivity !== undefined
            ? toUserField(existing.sensitivity, sanitizeField(body.sensitivity, 80))
            : existing.sensitivity,
        status: body.status || existing.status
      };

      db.data.documentRegistry[index] = updated;
      addRegistryEvent({
        campaignId: body.campaignId,
        documentId: params.id,
        action: body.status === "validated" ? "validated" : "updated",
        actor: "user",
        details: body.status === "validated" ? "Document validated" : "Document fields updated"
      });
      addAuditLog(body.campaignId, "document_registry.updated", `${params.id} status=${updated.status}`);

      await db.write();
      return { record: updated };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      reply.code(400);
      return { message };
    }
  });

  app.delete("/api/documents/:id", async (request, reply) => {
    try {
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = z.object({ campaignId: z.string().uuid() }).parse(request.body);
      assertCampaignExists(body.campaignId);

      const index = db.data.documentRegistry.findIndex((item) => item.id === params.id);
      if (index < 0) {
        reply.code(404);
        return { message: "Document not found" };
      }

      const existing = db.data.documentRegistry[index];
      if (existing.campaignId !== body.campaignId) {
        reply.code(400);
        return { message: "Campaign mismatch" };
      }

      addRegistryEvent({
        campaignId: body.campaignId,
        documentId: params.id,
        action: "deleted",
        actor: "user",
        details: `Document deleted: ${existing.filename}`
      });
      addAuditLog(body.campaignId, "document_registry.deleted", `${params.id} - ${existing.filename}`);

      db.data.documentRegistry.splice(index, 1);

      await db.write();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      reply.code(400);
      return { message };
    }
  });

  app.get("/api/documents/export", async (request, reply) => {
    try {
      const querySchema = z.object({ campaignId: z.string().uuid() });
      const { campaignId } = querySchema.parse(request.query);
      assertCampaignExists(campaignId);

      const rows = db.data.documentRegistry
        .filter((item) => item.campaignId === campaignId)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

      const headers = [
        "id",
        "filename",
        "mimeType",
        "status",
        "title",
        "version",
        "publishedAt",
        "author",
        "sensitivity",
        "createdAt",
        "updatedAt"
      ];

      const lines = [headers.map((h) => csvCell(h)).join(",")];
      rows.forEach((row) => {
        lines.push(
          [
            row.id,
            row.filename,
            row.mimeType,
            row.status,
            row.title.value || "",
            row.version.value || "",
            row.publishedAt.value || "",
            row.author.value || "",
            row.sensitivity.value || "",
            row.createdAt,
            row.updatedAt
          ]
            .map(csvCell)
            .join(",")
        );
      });

      const csv = `${lines.join("\n")}\n`;
      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", `attachment; filename=\"document-registry-${campaignId}.csv\"`);
      return reply.send(csv);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      reply.code(400);
      return { message };
    }
  });
}

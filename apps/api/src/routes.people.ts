import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { buildCsv } from "./services/csvExport.js";
import {
  addPeopleEvent,
  createPerson,
  getExpiredPeople,
  getPersonById,
  listPeople,
  purgeExpiredPeople,
  refreshPersonFromAd,
  softDeletePerson,
  updatePerson
} from "./services/peopleStore.js";

function getRequestActorHeader(rawHeader: unknown) {
  const value = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized.length > 0 ? normalized.slice(0, 80) : "system";
}

export async function peopleRoutes(app: FastifyInstance) {
  app.get("/api/people", async (request, reply) => {
    try {
      const query = z
        .object({
          q: z.string().optional(),
          campaignId: z.string().uuid().optional(),
          status: z.enum(["active", "disabled", "unknown"]).optional(),
          includeDeleted: z.enum(["0", "1"]).optional(),
          limit: z.coerce.number().int().min(1).max(1000).optional()
        })
        .parse(request.query);

      const items = listPeople({
        q: query.q,
        campaignId: query.campaignId,
        status: query.status,
        includeDeleted: query.includeDeleted === "1",
        limit: query.limit
      });

      return { items, count: items.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return reply.code(400).send({ message });
    }
  });

  app.get("/api/people/export.csv", async (request, reply) => {
    try {
      const query = z
        .object({
          q: z.string().optional(),
          campaignId: z.string().uuid().optional(),
          status: z.enum(["active", "disabled", "unknown"]).optional(),
          includeDeleted: z.enum(["0", "1"]).optional(),
          delimiter: z.enum([";", ","]).optional(),
          bom: z.enum(["0", "1"]).optional()
        })
        .parse(request.query);

      const actor = getRequestActorHeader(request.headers["x-rubis-user"]);
      const items = listPeople({
        q: query.q,
        campaignId: query.campaignId,
        status: query.status,
        includeDeleted: query.includeDeleted === "1"
      });

      const delimiter = query.delimiter || ";";
      const includeBom = query.bom !== "0";

      const headers = [
        "id",
        "displayName",
        "mail",
        "status",
        "isAuditManager",
        "passiScopes",
        "passiAttestationValidUntil",
        "department",
        "company",
        "campaignId",
        "purpose",
        "lawfulBasis",
        "retentionUntil",
        "deletedAt",
        "updatedAt"
      ];

      const rows = items.map((item) => [
        item.id,
        item.displayName || "",
        item.mail || "",
        item.status || "unknown",
        item.isAuditManager ? "1" : "0",
        (item.passiScopes || []).join(" | "),
        item.passiAttestationValidUntil || "",
        item.department || "",
        item.company || "",
        item.campaignId || "",
        item.purpose || "",
        item.lawfulBasis || "",
        item.retentionUntil || "",
        item.deletedAt || "",
        item.updatedAt
      ]);

      addPeopleEvent({
        type: "export_csv",
        actor: actor === "system" ? "system" : "user",
        message: `CSV export (${rows.length} lines)`
      });

      const csv = buildCsv(headers, rows, delimiter, includeBom);
      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", `attachment; filename=people-directory-${new Date().toISOString().slice(0, 10)}.csv`);
      return csv;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return reply.code(400).send({ message });
    }
  });

  app.get("/api/people/retention/expired", async (request, reply) => {
    try {
      const query = z
        .object({
          limit: z.coerce.number().int().min(1).max(1000).optional()
        })
        .parse(request.query);

      const items = getExpiredPeople().slice(0, query.limit || 200);
      return { items, count: items.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return reply.code(400).send({ message });
    }
  });

  app.post("/api/people/purge", async (request, reply) => {
    try {
      const body = z
        .object({
          dryRun: z.boolean().default(true),
          limit: z.number().int().min(1).max(5000).optional()
        })
        .parse(request.body);

      const actor = getRequestActorHeader(request.headers["x-rubis-user"]);
      const result = purgeExpiredPeople({ dryRun: body.dryRun, limit: body.limit });

      addPeopleEvent({
        type: "purge_soft",
        actor: actor === "system" ? "system" : "user",
        message: body.dryRun
          ? `Purge dry-run on ${result.selectedCount} people`
          : `Purge soft applied on ${result.selectedCount} people`
      });

      return {
        dryRun: body.dryRun,
        totalExpired: result.totalExpired,
        selectedCount: result.selectedCount,
        selected: result.selected
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return reply.code(400).send({ message });
    }
  });

  app.get("/api/people/:id", async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const person = getPersonById(id);
      if (!person) {
        return reply.code(404).send({ message: "Person not found" });
      }

      return person;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return reply.code(400).send({ message });
    }
  });

  app.post("/api/people", async (request, reply) => {
    try {
      const body = z
        .object({
          organisationId: z.string().min(1).default("default"),
          campaignId: z.string().uuid().optional(),
          source: z.enum(["AD", "user"]).default("user"),
          displayName: z.string().max(200).optional(),
          mail: z.string().email().optional(),
          status: z.enum(["active", "disabled", "unknown"]).default("unknown")
        })
        .parse(request.body);

      const actor = getRequestActorHeader(request.headers["x-rubis-user"]);
      const person = createPerson(body);

      addPeopleEvent({
        personId: person.id,
        type: "user_edit",
        actor: actor === "system" ? "system" : "user",
        message: `Person created: ${person.displayName || person.mail || person.id}`
      });

      return reply.code(201).send(person);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return reply.code(400).send({ message });
    }
  });

  app.post("/api/people/:id/refresh", async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const actor = getRequestActorHeader(request.headers["x-rubis-user"]);
      const person = refreshPersonFromAd(id);

      if (!person) {
        return reply.code(404).send({ message: "Person not found" });
      }

      addPeopleEvent({
        personId: id,
        type: "ad_refresh",
        actor: actor === "system" ? "system" : "user",
        message: `AD refresh requested for ${person.displayName || person.mail || id}`
      });

      return person;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return reply.code(400).send({ message });
    }
  });

  app.patch("/api/people/:id", async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = z
        .object({
          campaignId: z.string().uuid().optional(),
          displayName: z.string().max(200).optional(),
          mail: z.string().email().optional(),
          department: z.string().max(120).optional(),
          company: z.string().max(120).optional(),
          title: z.string().max(120).optional(),
          passiScopes: z.array(z.string().max(120)).max(20).optional(),
          isAuditManager: z.boolean().optional(),
          passiAttestationValidUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          purpose: z.string().max(300).optional(),
          lawfulBasis: z.string().max(200).optional(),
          tags: z.array(z.string().max(60)).max(30).optional(),
          notes: z.string().max(5000).optional(),
          retentionDays: z.number().int().min(1).max(3650).optional(),
          status: z.enum(["active", "disabled", "unknown"]).optional()
        })
        .parse(request.body);

      const actor = getRequestActorHeader(request.headers["x-rubis-user"]);
      const updated = updatePerson(id, body);
      if (!updated) {
        return reply.code(404).send({ message: "Person not found" });
      }

      addPeopleEvent({
        personId: id,
        type: "user_edit",
        actor: actor === "system" ? "system" : "user",
        message: `Person updated: ${updated.displayName || updated.mail || id}`
      });

      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return reply.code(400).send({ message });
    }
  });

  app.delete("/api/people/:id", async (request, reply) => {
    try {
      const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
      const actor = getRequestActorHeader(request.headers["x-rubis-user"]);
      const deleted = softDeletePerson(id);
      if (!deleted) {
        return reply.code(404).send({ message: "Person not found" });
      }

      addPeopleEvent({
        personId: id,
        type: "delete",
        actor: actor === "system" ? "system" : "user",
        message: `Person deleted: ${deleted.displayName || deleted.mail || id}`
      });

      return { success: true, person: deleted };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return reply.code(400).send({ message });
    }
  });
}

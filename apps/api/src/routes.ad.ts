import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "./db.js";
import { type AdAuthOverride, isAdConfigured, searchAdUsers, testAdConnection } from "./services/adClient.js";
import { addPeopleEvent, upsertPersonFromAd } from "./services/peopleStore.js";

function getRequestActorHeader(rawHeader: unknown) {
  const value = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized.length > 0 ? normalized.slice(0, 80) : "system";
}

function getRequestAdAuth(headers: Record<string, unknown>): AdAuthOverride {
  const rawLogin = headers["x-rubis-ad-login"];
  const rawPassword = headers["x-rubis-ad-password"];
  const login = (Array.isArray(rawLogin) ? rawLogin[0] : rawLogin) as string | undefined;
  const password = (Array.isArray(rawPassword) ? rawPassword[0] : rawPassword) as string | undefined;

  return {
    bindLogin: typeof login === "string" ? login.trim() : "",
    bindPassword: typeof password === "string" ? password : ""
  };
}

export async function adRoutes(app: FastifyInstance) {
  app.get("/api/ad/health", async (request, reply) => {
    try {
      if (!isAdConfigured()) {
        return { configured: false, ok: false, message: "AD non configuré" };
      }

      const adAuth = getRequestAdAuth(request.headers as Record<string, unknown>);
      const result = await testAdConnection(adAuth);
      return { configured: true, ...result };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return reply.code(502).send({ configured: true, ok: false, message });
    }
  });

  app.get("/api/ad/search", async (request, reply) => {
    try {
      const query = z
        .object({
          q: z.string().min(1),
          mode: z.enum(["auto", "email", "login", "upn", "name"]).default("auto")
        })
        .parse(request.query);

      const actor = getRequestActorHeader(request.headers["x-rubis-user"]);
      const adAuth = getRequestAdAuth(request.headers as Record<string, unknown>);
      const users = await searchAdUsers(query.q, query.mode, adAuth);

      addPeopleEvent({
        type: "ad_search",
        actor: actor === "system" ? "system" : "user",
        message: `AD search '${query.q}' (${users.length} résultat(s))`
      });

      return { items: users, count: users.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return reply.code(400).send({ message });
    }
  });

  app.post("/api/ad/import", async (request, reply) => {
    try {
      const body = z
        .object({
          organisationId: z.string().min(1).default("default"),
          campaignId: z.string().uuid().optional(),
          mode: z.enum(["auto", "email", "login", "upn", "name"]).default("auto"),
          identifiers: z.array(z.string().min(1)).min(1).max(500)
        })
        .parse(request.body);

      const actor = getRequestActorHeader(request.headers["x-rubis-user"]);
      const adAuth = getRequestAdAuth(request.headers as Record<string, unknown>);
      const now = new Date().toISOString();
      const jobId = randomUUID();

      const job: {
        id: string;
        createdAt: string;
        updatedAt: string;
        status: "queued" | "running" | "done" | "failed";
        organisationId: string;
        campaignId?: string;
        identifierType: "email" | "login" | "upn" | "auto";
        identifiers: string[];
        processed: number;
        success: number;
        failed: number;
        errors: string[];
        resultPersonIds: string[];
      } = {
        id: jobId,
        createdAt: now,
        updatedAt: now,
        status: "running",
        organisationId: body.organisationId,
        campaignId: body.campaignId,
        identifierType: body.mode === "name" ? "auto" : body.mode,
        identifiers: body.identifiers,
        processed: 0,
        success: 0,
        failed: 0,
        errors: [],
        resultPersonIds: []
      };

      db.data.adImportJobs.unshift(job);

      for (const identifier of body.identifiers) {
        job.processed += 1;
        try {
          const found = await searchAdUsers(identifier, body.mode, adAuth);
          if (found.length === 0) {
            job.failed += 1;
            job.errors?.push(`No AD result for '${identifier}'`);
            continue;
          }

          const user = found[0];
          const upsert = upsertPersonFromAd({
            organisationId: body.organisationId,
            campaignId: body.campaignId,
            ...user
          });

          job.success += 1;
          job.resultPersonIds.push(upsert.person.id);

          addPeopleEvent({
            personId: upsert.person.id,
            jobId,
            type: "ad_import",
            actor: actor === "system" ? "system" : "user",
            message: upsert.created
              ? `AD import created ${upsert.person.displayName || upsert.person.mail || upsert.person.id}`
              : `AD import updated ${upsert.person.displayName || upsert.person.mail || upsert.person.id}`
          });
        } catch (searchError) {
          job.failed += 1;
          const detail = searchError instanceof Error ? searchError.message : "Unknown error";
          const needsTlsHint = detail.includes("00002028") || detail.toLowerCase().includes("integrity checking");
          const help = needsTlsHint ? " (AD exige TLS/signing: utilisez ldaps://...:636)" : "";
          job.errors?.push(`'${identifier}': ${detail}${help}`);
        }
      }

      job.status = job.failed > 0 && job.success === 0 ? "failed" : "done";
      job.updatedAt = new Date().toISOString();

      await db.write();

      return reply.code(201).send({
        job,
        summary: {
          processed: job.processed,
          success: job.success,
          failed: job.failed
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return reply.code(400).send({ message });
    }
  });
}

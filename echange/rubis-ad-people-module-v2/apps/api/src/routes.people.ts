
import { FastifyInstance } from "fastify";

/**
 * People directory routes:
 * - list/get/update/refresh
 * - CSV export
 * - retention expired
 * - purge (soft) with dryRun
 */
export async function peopleRoutes(app: FastifyInstance) {
  app.get("/api/people", async () => {
    return { message: "List people placeholder" };
  });

  app.get("/api/people/:id", async () => {
    return { message: "Get person placeholder" };
  });

  app.post("/api/people/:id/refresh", async () => {
    return { message: "Refresh person placeholder" };
  });

  app.patch("/api/people/:id", async () => {
    return { message: "Update person placeholder" };
  });

  // CSV export (streaming)
  app.get("/api/people/export.csv", async (req, reply) => {
    reply.header("Content-Type", "text/csv; charset=utf-8");
    return "TODO: stream CSV";
  });

  // Retention expired list
  app.get("/api/people/retention/expired", async () => {
    return { message: "Expired retention placeholder" };
  });

  // Purge soft with dryRun support
  app.post("/api/people/purge", async () => {
    return { message: "Purge placeholder" };
  });
}

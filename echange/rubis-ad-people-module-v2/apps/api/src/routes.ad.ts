
import { FastifyInstance } from "fastify";

export async function adRoutes(app: FastifyInstance) {
  app.get("/api/ad/health", async () => {
    return { status: "placeholder" };
  });

  app.get("/api/ad/search", async () => {
    return { message: "Search AD placeholder" };
  });

  app.post("/api/ad/import", async () => {
    return { message: "Import AD users placeholder" };
  });
}

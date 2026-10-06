import "dotenv/config";
import { app } from "./app.js";
import { prisma } from "./db.js";

const port = Number(process.env.PORT ?? 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}

const server = app.listen(port, "0.0.0.0", () => {
  console.info(`[api] Vision Pro API listening on port ${port}.`);
});

async function shutdown(signal: string) {
  console.info(`[api] Received ${signal}; closing server.`);
  server.close(async (error) => {
    await prisma.$disconnect();
    if (error) {
      console.error("[api] Server shutdown failed:", error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

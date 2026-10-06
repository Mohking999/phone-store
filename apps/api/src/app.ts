import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { router } from "./routes.js";

const app = express();
const allowedOrigins = (
  process.env.FRONTEND_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'", ...allowedOrigins],
        fontSrc: ["'self'", "data:"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "64kb" }));
app.get("/health", (_request, response) => response.json({ status: "ok" }));
app.use("/api", router);
app.use("/api", (_request, response) =>
  response.status(404).json({ error: "API endpoint not found." }),
);
app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof SyntaxError && "body" in error) {
      response.status(400).json({ error: "Request body must be valid JSON." });
      return;
    }
    console.error("[api] Middleware failed:", error);
    response.status(500).json({ error: "An unexpected server error occurred." });
  },
);

export { app };

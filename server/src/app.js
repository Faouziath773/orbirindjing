import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import candidateRoutes from "./routes/candidateRoutes.js";
import webhookRoutes from "./routes/webhook.js";
import { healthCheck } from "./services/candidateService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  process.env.APP_BASE_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
  })
);

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.get("/api/health", async (_req, res) => {
  try {
    await healthCheck();
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({ status: "error" });
  }
});

app.use("/api", candidateRoutes);
app.use("/api", webhookRoutes);

export default app;

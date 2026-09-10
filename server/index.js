import 'dotenv/config';
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readdirSync } from "node:fs";
import { z } from "zod";
import { backfillImportedNewsMetadata } from "./newsIngest.js";
import { splitTrimmedValues } from "./services/schemas.js";
import { logger } from "./services/logger.js";
import { seedIfEmpty } from "./services/seed.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { entitiesRouter } from "./routes/entities.js";
import { healthRouter } from "./routes/health.js";
import { homeRouter } from "./routes/home.js";
import { newsRouter } from "./routes/news.js";
import { pagesRouter } from "./routes/pages.js";
import { searchRouter } from "./routes/search.js";
import { siteRouter } from "./routes/site.js";
import { tournamentsRouter } from "./routes/tournaments.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "..", "dist");
const indexHtmlPath = path.join(distDir, "index.html");

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  try {
    if (existsSync(distDir)) {
      const assets = existsSync(path.join(distDir, "assets")) ? readdirSync(path.join(distDir, "assets")).length : 0;
      logger.info(`dist OK: ${readdirSync(distDir).length} entries, ${assets} assets`);
    } else {
      logger.error(`dist directory NOT FOUND at ${distDir}`);
    }
  } catch (e) {
    logger.error("dist check failed", { error: String(e) });
  }
}

seedIfEmpty();

app.set("trust proxy", isProduction ? 1 : false);

app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com"],
      frameSrc: ["https://accounts.google.com"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

const CONFIGURED_CORS_ORIGINS = [
  ...splitTrimmedValues(process.env.FRONTEND_ORIGIN || ""),
  ...splitTrimmedValues(process.env.CORS_ORIGIN || ""),
];
const ALLOWED_CORS_ORIGINS = new Set([
  ...CONFIGURED_CORS_ORIGINS,
  ...(!isProduction ? [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://localhost:5173",
    "https://127.0.0.1:5173",
    "http://localhost:4000",
    "http://127.0.0.1:4000",
    "https://localhost:4000",
    "https://127.0.0.1:4000",
  ] : []),
]);

if (process.env.CORE_BACKFILL_NEWS_ON_STARTUP === "1") {
  backfillImportedNewsMetadata();
}

app.use("/api", (req, res, next) => {
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (ALLOWED_CORS_ORIGINS.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
  })(req, res, next);
});
app.use("/api", express.json({ limit: "2mb" }));

const searchLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many search requests, please try again later" },
});

const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth requests, please try again later" },
});

const adminLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin requests, please try again later" },
});

const entityBulkLimiter = rateLimit({
  windowMs: 60_000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many bulk requests, please try again later" },
});

const publicLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

app.use("/api", healthRouter);
app.use("/api", authLimiter, authRouter);
app.use("/api", publicLimiter, homeRouter);
app.use("/api", publicLimiter, newsRouter);
app.use("/api", searchLimiter, searchRouter);
app.use("/api", publicLimiter, siteRouter);
app.use("/api", publicLimiter, tournamentsRouter);
app.use("/api", adminLimiter, adminRouter);
app.use("/api", entityBulkLimiter, entitiesRouter);
app.use("/api/pages", publicLimiter, pagesRouter);

app.use(
  express.static(distDir, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  if (/\.[a-z0-9]{1,8}$/i.test(req.path)) {
    return res.status(404).send("Not found");
  }
  res.setHeader("Cache-Control", "no-cache");
  return res.sendFile(indexHtmlPath, (error) => {
    if (error) {
      next(error);
    }
  });
});

app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: "Invalid payload",
      issues: error.issues,
    });
  }
  return res.status(500).json({ error: "Internal server error" });
});

const httpServer = createServer(app);

if (process.env.NODE_ENV !== "test") {
  httpServer.listen(PORT, () => {});
}

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason: String(reason) });
});

export { app, httpServer };

import 'dotenv/config';
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "node:http";
import { randomBytes, createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { requestContext, requestErrorHandler } from "./services/requestErrors.js";
import { backfillImportedNewsMetadata } from "./newsIngest.js";
import { splitTrimmedValues } from "./services/schemas.js";
import { buildAllowedOrigins, corsOriginCallback } from "./services/corsOrigins.js";
import { logger } from "./services/logger.js";
import { seedIfEmpty, ensureLegacyTournaments } from "./services/seed.js";
import { assertDatabaseUsable } from "./services/dbIntegrity.js";
import { repairTournamentDataIntegrity } from "./services/tournamentDataRepair.js";
import { repairPlayerReferences } from "./services/playerReferenceRepair.js";
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
import { enforceCsrfProtection } from "./services/auth.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "..", "dist");
const indexHtmlPath = path.join(distDir, "index.html");
const indexHtmlTemplate = existsSync(indexHtmlPath)
  ? readFileSync(indexHtmlPath, "utf8")
  : "";

const INLINE_SCRIPT_HASHES = indexHtmlTemplate
  ? [...indexHtmlTemplate.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
      (match) =>
        `'sha256-${createHash("sha256").update(match[1], "utf8").digest("base64")}'`,
    )
  : [];

const SCRIPT_CSP_SOURCES = [
  "'self'",
  "https://accounts.google.com",
  "https://apis.google.com",
  "https://cdn.jsdelivr.net",
  ...INLINE_SCRIPT_HASHES,
];

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

// The database is the primary source of truth on the persistent disk. Verify it
// before any write path runs so a corrupt file can never be silently reset to
// seed data or overwritten by a backup.
if (!assertDatabaseUsable()) {
  process.exit(1);
}
seedIfEmpty();
ensureLegacyTournaments();
repairTournamentDataIntegrity();
repairPlayerReferences();

app.set("trust proxy", isProduction ? 1 : false);
app.use("/api", requestContext);

app.use((req, res, next) => {
  res.locals.cspNonce = randomBytes(16).toString("base64");
  next();
});

app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [...SCRIPT_CSP_SOURCES, (req, res) => `'nonce-${res.locals.cspNonce}'`],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://accounts.google.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com"],
      frameSrc: ["https://accounts.google.com"],
    },
  } : false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

const CONFIGURED_CORS_ORIGINS = [
  ...splitTrimmedValues(process.env.FRONTEND_ORIGIN || ""),
  ...splitTrimmedValues(process.env.CORS_ORIGIN || ""),
];
const ALLOWED_CORS_ORIGINS = buildAllowedOrigins(process.env, { isProduction });

if (CONFIGURED_CORS_ORIGINS.length === 0) {
  logger.warn(
    "No FRONTEND_ORIGIN/CORS_ORIGIN configured. Only local development origins " +
      "are allowed; a cross-origin production frontend will be rejected.",
  );
}

if (process.env.CORE_BACKFILL_NEWS_ON_STARTUP === "1") {
  backfillImportedNewsMetadata();
}

app.use("/api", (req, res, next) => {
  cors({
    // Required so the cross-origin frontend (e.g. Vercel preview) can send and
    // receive the HttpOnly session cookie. Safe because the origin is an
    // explicit allowlist, never a wildcard.
    credentials: true,
    origin: corsOriginCallback(ALLOWED_CORS_ORIGINS),
  })(req, res, next);
});
app.use("/api", express.json({ limit: "2mb" }));
app.use("/api", enforceCsrfProtection);

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

// Scope each limiter to its own path prefix. Mounting them all on the shared
// "/api" path would run every limiter for every API request, making the
// strictest one (auth, 20/min) the effective cap for the whole API. Limiters
// are mounted separately from routers so router-relative paths stay intact.
app.use("/api", healthRouter);
app.use("/api/auth", authLimiter);
app.use("/api/admin", adminLimiter);
app.use("/api/search", searchLimiter);
app.use("/api/home", publicLimiter);
app.use("/api/news", publicLimiter);
app.use("/api/site", publicLimiter);
app.use("/api/tournaments", publicLimiter);
app.use("/api/entities", publicLimiter, entityBulkLimiter);
app.use("/api/pages", publicLimiter);

app.use("/api", authRouter);
app.use("/api", homeRouter);
app.use("/api", newsRouter);
app.use("/api", searchRouter);
app.use("/api", siteRouter);
app.use("/api", tournamentsRouter);
app.use("/api", adminRouter);
app.use("/api", entitiesRouter);
app.use("/api/pages", pagesRouter);
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

function renderIndexHtml(nonce) {
  if (!indexHtmlTemplate) return "";
  return indexHtmlTemplate.replace(/<script>/g, `<script nonce="${nonce}">`);
}

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
  if (!indexHtmlTemplate) {
    return next();
  }
  return res.type("html").send(renderIndexHtml(res.locals.cspNonce));
});

app.use(requestErrorHandler);

const httpServer = createServer(app);

if (process.env.NODE_ENV !== "test") {
  httpServer.listen(PORT, () => {});
}

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason: String(reason) });
});

export { app, httpServer };

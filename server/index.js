import 'dotenv/config';
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { createServer } from "node:http";
import { Server } from "socket.io";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { backfillImportedNewsMetadata } from "./newsIngest.js";
import { splitTrimmedValues } from "./services/schemas.js";
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

const CONFIGURED_CORS_ORIGINS = [
  ...splitTrimmedValues(process.env.FRONTEND_ORIGIN || ""),
  ...splitTrimmedValues(process.env.CORS_ORIGIN || ""),
];
const ALLOWED_CORS_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://localhost:5173",
  "https://127.0.0.1:5173",
  "http://localhost:4000",
  "http://127.0.0.1:4000",
  "https://localhost:4000",
  "https://127.0.0.1:4000",
  ...CONFIGURED_CORS_ORIGINS,
]);

if (process.env.CORE_BACKFILL_NEWS_ON_STARTUP === "1") {
  backfillImportedNewsMetadata();
}

app.use((req, res, next) => {
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (ALLOWED_CORS_ORIGINS.has(origin)) {
        return callback(null, true);
      }
      try {
        if (new URL(origin).host === req.headers.host) {
          return callback(null, true);
        }
      } catch {
        // fall through to reject
      }
      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
  })(req, res, next);
});
app.use(express.json({ limit: "2mb" }));

const searchLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many search requests, please try again later" },
});

const newsImportLimiter = rateLimit({
  windowMs: 300_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many import requests, please try again later" },
});

const entityBulkLimiter = rateLimit({
  windowMs: 60_000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many bulk requests, please try again later" },
});

app.use("/api", healthRouter);
app.use("/api", authRouter);
app.use("/api", homeRouter);
app.use("/api", newsRouter);
app.use("/api", searchLimiter, searchRouter);
app.use("/api", siteRouter);
app.use("/api", tournamentsRouter);
app.use("/api/admin/news/import", newsImportLimiter, adminRouter);
app.use("/api/admin/news/backfill", newsImportLimiter, adminRouter);
app.use("/api", adminRouter);
app.use("/api", entityBulkLimiter, entitiesRouter);
app.use("/api/pages", pagesRouter);

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
    return res.status(404).json({ error: "Not found" });
  }
  res.setHeader("Cache-Control", "no-cache");
  return res.sendFile(indexHtmlPath, (error) => {
    if (error) {
      next(error);
    }
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: "Invalid payload",
      issues: error.issues,
    });
  }
  return res.status(500).json({ error: "Internal server error" });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (ALLOWED_CORS_ORIGINS.has(origin)) return callback(null, true);
      try {
        if (new URL(origin).host === `localhost:${PORT}` || new URL(origin).host === `127.0.0.1:${PORT}`) {
          return callback(null, true);
        }
      } catch {}
      return callback(new Error("Socket.IO CORS origin not allowed"));
    },
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Client connected via socket:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.set("io", io);

httpServer.listen(PORT, () => {
  console.log(`StageCore API running at http://localhost:${PORT}`);
});

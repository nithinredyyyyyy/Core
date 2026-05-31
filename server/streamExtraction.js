import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { z } from "zod";
import { db } from "./db.js";

const sessionStatusSchema = z.enum([
  "draft",
  "queued",
  "capturing",
  "processing",
  "paused",
  "completed",
  "failed",
]);

const frameStatusSchema = z.enum([
  "queued",
  "sampled",
  "ocr_pending",
  "ocr_complete",
  "skipped",
  "failed",
]);

const matchStatStatusSchema = z.enum(["draft", "verified", "rejected"]);

const sessionCreateSchema = z.object({
  youtube_url: z.string().url(),
  title: z.string().trim().min(1).optional(),
  status: sessionStatusSchema.optional(),
  capture_mode: z.enum(["live", "vod"]).optional(),
  provider: z.string().trim().min(1).optional(),
  cloud_target: z.string().trim().min(1).optional(),
  started_at: z.string().datetime().optional(),
  ended_at: z.string().datetime().optional(),
  last_heartbeat_at: z.string().datetime().optional(),
  last_frame_at: z.string().datetime().optional(),
  sampling_interval_seconds: z.number().int().min(1).max(300).optional(),
  hud_profile: z.string().trim().min(1).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const sessionUpdateSchema = sessionCreateSchema
  .omit({ youtube_url: true })
  .extend({
    youtube_url: z.string().url().optional(),
  })
  .partial();

const frameJobCreateSchema = z.object({
  stream_session_id: z.string().trim().min(1),
  frame_timestamp_ms: z.number().int().min(0).optional(),
  stream_timestamp_seconds: z.number().min(0).optional(),
  frame_url: z.string().url().optional(),
  crop_url: z.string().url().optional(),
  status: frameStatusSchema.optional(),
  scoreboard_visible: z.number().int().min(0).max(1).optional(),
  ocr_provider: z.string().trim().min(1).optional(),
  ocr_requested_at: z.string().datetime().optional(),
  ocr_completed_at: z.string().datetime().optional(),
  error_message: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const frameJobUpdateSchema = frameJobCreateSchema.partial();

const ocrResultCreateSchema = z.object({
  frame_job_id: z.string().trim().min(1),
  stream_session_id: z.string().trim().min(1),
  player_name: z.string().trim().min(1),
  team_name: z.string().trim().min(1).optional(),
  finishes: z.number().int().min(0).optional(),
  knocks: z.number().int().min(0).optional(),
  survival_time: z.string().trim().min(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  raw_text: z.string().optional(),
  normalized_payload: z.record(z.any()).optional(),
});

const matchStatUpsertSchema = z.object({
  stream_session_id: z.string().trim().min(1),
  match_key: z.string().trim().min(1),
  player_name: z.string().trim().min(1),
  team_name: z.string().trim().min(1).optional(),
  finishes: z.number().int().min(0).optional(),
  knocks: z.number().int().min(0).optional(),
  survival_time: z.string().trim().min(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  source_frame_job_id: z.string().trim().min(1).optional(),
  source_result_id: z.string().trim().min(1).optional(),
  status: matchStatStatusSchema.optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const aggregationSchema = z.object({
  stream_session_id: z.string().trim().min(1),
  match_key: z.string().trim().min(1),
  min_confidence: z.number().min(0).max(1).optional(),
});

function serializeJson(value, fallback = {}) {
  if (value === undefined) return JSON.stringify(fallback);
  return JSON.stringify(value);
}

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function getSessionRow(id) {
  return db.prepare("SELECT * FROM stream_sessions WHERE id = ?").get(id);
}

function getFrameRow(id) {
  return db.prepare("SELECT * FROM stream_frame_jobs WHERE id = ?").get(id);
}

function normalizeSession(row) {
  if (!row) return null;
  return {
    ...row,
    sampling_interval_seconds: Number(row.sampling_interval_seconds || 0),
    metadata: parseJson(row.metadata, {}),
  };
}

function normalizeFrameJob(row) {
  if (!row) return null;
  return {
    ...row,
    frame_timestamp_ms:
      row.frame_timestamp_ms === null ? null : Number(row.frame_timestamp_ms),
    stream_timestamp_seconds:
      row.stream_timestamp_seconds === null
        ? null
        : Number(row.stream_timestamp_seconds),
    scoreboard_visible: Number(row.scoreboard_visible || 0),
    metadata: parseJson(row.metadata, {}),
  };
}

function normalizeOcrResult(row) {
  if (!row) return null;
  return {
    ...row,
    finishes: row.finishes === null ? null : Number(row.finishes),
    knocks: row.knocks === null ? null : Number(row.knocks),
    confidence: Number(row.confidence || 0),
    normalized_payload: parseJson(row.normalized_payload, {}),
  };
}

function normalizeMatchStat(row) {
  if (!row) return null;
  return {
    ...row,
    finishes: row.finishes === null ? null : Number(row.finishes),
    knocks: row.knocks === null ? null : Number(row.knocks),
    confidence: Number(row.confidence || 0),
    metadata: parseJson(row.metadata, {}),
  };
}

function ensureSessionExists(sessionId) {
  const session = getSessionRow(sessionId);
  if (!session) {
    throw new Error("Stream session not found");
  }
  return session;
}

function majorityValue(values) {
  const counts = new Map();
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  let best = null;
  let bestCount = -1;
  for (const [value, count] of counts.entries()) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

function bestNumeric(rows, field) {
  const valid = rows.filter((row) => Number.isFinite(Number(row[field])));
  if (!valid.length) return null;
  return valid.toSorted(
    (a, b) => Number(b.confidence || 0) - Number(a.confidence || 0),
  )[0][field];
}

function compactKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function ocrEventType(rowOrPayload) {
  return compactKey(rowOrPayload?.normalized_payload?.event_type || rowOrPayload?.event_type || "player_row");
}

function buildOcrEventKey(rowOrPayload) {
  const payload = rowOrPayload?.normalized_payload || rowOrPayload || {};
  const eventType = ocrEventType(payload);
  if (eventType === "kill_feed") {
    return [
      eventType,
      compactKey(payload.killer_player),
      compactKey(payload.victim_player || payload.player_name),
      compactKey(payload.weapon),
      compactKey(payload.survival_time || rowOrPayload?.survival_time),
    ].join("|");
  }
  if (eventType === "match_info") {
    return [
      eventType,
      compactKey(payload.match_number),
      compactKey(payload.group),
      compactKey(payload.map),
      compactKey(payload.game_time),
    ].join("|");
  }
  return [
    eventType,
    compactKey(rowOrPayload?.player_name || payload.player_name),
    compactKey(rowOrPayload?.team_name || payload.team_name),
    compactKey(payload.crop_preset),
  ].join("|");
}

function findDuplicateOcrResult(payload) {
  const eventKey = buildOcrEventKey(payload);
  if (!eventKey.replace(/[|]/g, "")) return null;
  const candidates = db
    .prepare(
      "SELECT * FROM stream_ocr_results WHERE stream_session_id = ? ORDER BY created_date DESC LIMIT 500",
    )
    .all(payload.stream_session_id)
    .map(normalizeOcrResult);
  return candidates.find((row) => buildOcrEventKey(row) === eventKey) || null;
}

function shouldAggregateOcrResult(row) {
  const type = ocrEventType(row);
  return ["center_player_stats", "left_roster", "player_row"].includes(type);
}

export function registerStreamExtractionRoutes({ app, requireAdmin }) {
  app.get("/api/stream-extraction/health", (_req, res) => {
    return res.json({
      ok: true,
      service: "stream-extraction",
      timestamp: nowIso(),
    });
  });

  app.post("/api/stream-extraction/worker/run-once", (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (process.env.STREAM_ENABLE_LOCAL_WORKER_RUN !== "1") {
      return res.status(409).json({
        error: "Local stream worker launch is disabled",
        code: "local_stream_worker_disabled",
        message:
          "Run the stream worker on a cloud VM/container, or set STREAM_ENABLE_LOCAL_WORKER_RUN=1 to allow local launches.",
      });
    }
    const child = spawn(process.execPath, ["server/streamWorker.js", "--once"], {
      cwd: process.cwd(),
      detached: true,
      env: process.env,
      stdio: "ignore",
      windowsHide: true,
    });
    child.unref();
    return res.status(202).json({
      ok: true,
      pid: child.pid,
      mode: "once",
    });
  });

  app.get("/api/stream-extraction/sessions", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const status = String(req.query.status || "").trim();
    const rows = status
      ? db
          .prepare(
            "SELECT * FROM stream_sessions WHERE status = ? ORDER BY created_date DESC",
          )
          .all(status)
      : db
          .prepare("SELECT * FROM stream_sessions ORDER BY created_date DESC")
          .all();
    return res.json(rows.map(normalizeSession));
  });

  app.post("/api/stream-extraction/sessions", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const payload = sessionCreateSchema.parse(req.body || {});
    const id = randomUUID();
    const createdAt = nowIso();
    db.prepare(
      `INSERT INTO stream_sessions (
        id, youtube_url, title, status, capture_mode, provider, cloud_target,
        started_at, ended_at, last_heartbeat_at, last_frame_at,
        sampling_interval_seconds, hud_profile, notes, metadata,
        created_date, updated_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      payload.youtube_url,
      payload.title || null,
      payload.status || "draft",
      payload.capture_mode || "live",
      payload.provider || "youtube",
      payload.cloud_target || null,
      payload.started_at || null,
      payload.ended_at || null,
      payload.last_heartbeat_at || null,
      payload.last_frame_at || null,
      payload.sampling_interval_seconds ?? 5,
      payload.hud_profile || null,
      payload.notes || null,
      serializeJson(payload.metadata, {}),
      createdAt,
      createdAt,
      req.coreAuth?.user?.email || "admin",
    );
    return res.status(201).json(normalizeSession(getSessionRow(id)));
  });

  app.get("/api/stream-extraction/sessions/:id", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const row = getSessionRow(req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json(normalizeSession(row));
  });

  app.patch("/api/stream-extraction/sessions/:id", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const row = getSessionRow(req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    const payload = sessionUpdateSchema.parse(req.body || {});
    const merged = {
      ...normalizeSession(row),
      ...payload,
      metadata:
        payload.metadata === undefined
          ? parseJson(row.metadata, {})
          : payload.metadata,
    };
    const updatedAt = nowIso();
    db.prepare(
      `UPDATE stream_sessions SET
        youtube_url = ?, title = ?, status = ?, capture_mode = ?, provider = ?,
        cloud_target = ?, started_at = ?, ended_at = ?, last_heartbeat_at = ?,
        last_frame_at = ?, sampling_interval_seconds = ?, hud_profile = ?,
        notes = ?, metadata = ?, updated_date = ?
      WHERE id = ?`,
    ).run(
      merged.youtube_url,
      merged.title || null,
      merged.status || "draft",
      merged.capture_mode || "live",
      merged.provider || "youtube",
      merged.cloud_target || null,
      merged.started_at || null,
      merged.ended_at || null,
      merged.last_heartbeat_at || null,
      merged.last_frame_at || null,
      merged.sampling_interval_seconds ?? 5,
      merged.hud_profile || null,
      merged.notes || null,
      serializeJson(merged.metadata, {}),
      updatedAt,
      req.params.id,
    );
    return res.json(normalizeSession(getSessionRow(req.params.id)));
  });

  app.get("/api/stream-extraction/sessions/:id/frame-jobs", (req, res) => {
    if (!requireAdmin(req, res)) return;
    ensureSessionExists(req.params.id);
    const rows = db
      .prepare(
        "SELECT * FROM stream_frame_jobs WHERE stream_session_id = ? ORDER BY created_date DESC",
      )
      .all(req.params.id);
    return res.json(rows.map(normalizeFrameJob));
  });

  app.post("/api/stream-extraction/frame-jobs", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const payload = frameJobCreateSchema.parse(req.body || {});
    ensureSessionExists(payload.stream_session_id);
    const id = randomUUID();
    const createdAt = nowIso();
    db.prepare(
      `INSERT INTO stream_frame_jobs (
        id, stream_session_id, frame_timestamp_ms, stream_timestamp_seconds,
        frame_url, crop_url, status, scoreboard_visible, ocr_provider,
        ocr_requested_at, ocr_completed_at, error_message, metadata,
        created_date, updated_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      payload.stream_session_id,
      payload.frame_timestamp_ms ?? null,
      payload.stream_timestamp_seconds ?? null,
      payload.frame_url || null,
      payload.crop_url || null,
      payload.status || "queued",
      payload.scoreboard_visible ?? 0,
      payload.ocr_provider || null,
      payload.ocr_requested_at || null,
      payload.ocr_completed_at || null,
      payload.error_message || null,
      serializeJson(payload.metadata, {}),
      createdAt,
      createdAt,
      req.coreAuth?.user?.email || "admin",
    );
    return res.status(201).json(normalizeFrameJob(getFrameRow(id)));
  });

  app.patch("/api/stream-extraction/frame-jobs/:id", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const row = getFrameRow(req.params.id);
    if (!row) return res.status(404).json({ error: "Not found" });
    const payload = frameJobUpdateSchema.parse(req.body || {});
    const merged = {
      ...normalizeFrameJob(row),
      ...payload,
      metadata:
        payload.metadata === undefined
          ? parseJson(row.metadata, {})
          : payload.metadata,
    };
    db.prepare(
      `UPDATE stream_frame_jobs SET
        stream_session_id = ?, frame_timestamp_ms = ?, stream_timestamp_seconds = ?,
        frame_url = ?, crop_url = ?, status = ?, scoreboard_visible = ?,
        ocr_provider = ?, ocr_requested_at = ?, ocr_completed_at = ?,
        error_message = ?, metadata = ?, updated_date = ?
      WHERE id = ?`,
    ).run(
      merged.stream_session_id,
      merged.frame_timestamp_ms ?? null,
      merged.stream_timestamp_seconds ?? null,
      merged.frame_url || null,
      merged.crop_url || null,
      merged.status || "queued",
      merged.scoreboard_visible ?? 0,
      merged.ocr_provider || null,
      merged.ocr_requested_at || null,
      merged.ocr_completed_at || null,
      merged.error_message || null,
      serializeJson(merged.metadata, {}),
      nowIso(),
      req.params.id,
    );
    return res.json(normalizeFrameJob(getFrameRow(req.params.id)));
  });

  app.post("/api/stream-extraction/ocr-results", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const payload = ocrResultCreateSchema.parse(req.body || {});
    ensureSessionExists(payload.stream_session_id);
    const frame = getFrameRow(payload.frame_job_id);
    if (!frame) return res.status(404).json({ error: "Frame job not found" });
    const duplicate = findDuplicateOcrResult(payload);
    if (duplicate) {
      const existingPayload = duplicate.normalized_payload || {};
      const sampleCount = Number(existingPayload.sample_count || 1) + 1;
      const mergedPayload = {
        ...existingPayload,
        ...(payload.normalized_payload || {}),
        event_key: buildOcrEventKey(payload),
        sample_count: sampleCount,
        first_result_id: existingPayload.first_result_id || duplicate.id,
        latest_frame_job_id: payload.frame_job_id,
        last_seen_at: nowIso(),
      };
      const mergedConfidence = Math.min(
        1,
        Math.max(Number(duplicate.confidence || 0), Number(payload.confidence || 0)) +
          Math.min(0.15, sampleCount * 0.02),
      );
      db.prepare(
        `UPDATE stream_ocr_results SET
          team_name = COALESCE(?, team_name),
          finishes = COALESCE(?, finishes),
          knocks = COALESCE(?, knocks),
          survival_time = COALESCE(?, survival_time),
          confidence = ?,
          raw_text = COALESCE(?, raw_text),
          normalized_payload = ?,
          updated_date = ?
        WHERE id = ?`,
      ).run(
        payload.team_name || null,
        payload.finishes ?? null,
        payload.knocks ?? null,
        payload.survival_time || null,
        mergedConfidence,
        payload.raw_text || null,
        serializeJson(mergedPayload, {}),
        nowIso(),
        duplicate.id,
      );
      const row = db
        .prepare("SELECT * FROM stream_ocr_results WHERE id = ?")
        .get(duplicate.id);
      return res.json(normalizeOcrResult(row));
    }
    const id = randomUUID();
    const createdAt = nowIso();
    const normalizedPayload = {
      ...(payload.normalized_payload || {}),
      event_key: buildOcrEventKey(payload),
      sample_count: 1,
      first_result_id: id,
      last_seen_at: createdAt,
    };
    db.prepare(
      `INSERT INTO stream_ocr_results (
        id, frame_job_id, stream_session_id, player_name, team_name, finishes,
        knocks, survival_time, confidence, raw_text, normalized_payload,
        created_date, updated_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      payload.frame_job_id,
      payload.stream_session_id,
      payload.player_name,
      payload.team_name || null,
      payload.finishes ?? null,
      payload.knocks ?? null,
      payload.survival_time || null,
      payload.confidence ?? 0,
      payload.raw_text || null,
      serializeJson(normalizedPayload, {}),
      createdAt,
      createdAt,
      req.coreAuth?.user?.email || "admin",
    );
    db.prepare(
      "UPDATE stream_frame_jobs SET status = ?, ocr_completed_at = ?, updated_date = ? WHERE id = ?",
    ).run("ocr_complete", createdAt, createdAt, payload.frame_job_id);
    const row = db
      .prepare("SELECT * FROM stream_ocr_results WHERE id = ?")
      .get(id);
    return res.status(201).json(normalizeOcrResult(row));
  });

  app.get("/api/stream-extraction/sessions/:id/results", (req, res) => {
    if (!requireAdmin(req, res)) return;
    ensureSessionExists(req.params.id);
    const rows = db
      .prepare(
        "SELECT * FROM stream_ocr_results WHERE stream_session_id = ? ORDER BY created_date DESC",
      )
      .all(req.params.id);
    return res.json(rows.map(normalizeOcrResult));
  });

  app.post("/api/stream-extraction/match-stats/upsert", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const payload = matchStatUpsertSchema.parse(req.body || {});
    ensureSessionExists(payload.stream_session_id);
    const existing = db
      .prepare(
        "SELECT * FROM stream_match_stats WHERE stream_session_id = ? AND match_key = ? AND player_name = ?",
      )
      .get(payload.stream_session_id, payload.match_key, payload.player_name);
    const now = nowIso();
    if (existing) {
      db.prepare(
        `UPDATE stream_match_stats SET
          team_name = ?, finishes = ?, knocks = ?, survival_time = ?,
          confidence = ?, source_frame_job_id = ?, source_result_id = ?,
          status = ?, notes = ?, metadata = ?, updated_date = ?
        WHERE id = ?`,
      ).run(
        payload.team_name || existing.team_name,
        payload.finishes ?? existing.finishes,
        payload.knocks ?? existing.knocks,
        payload.survival_time || existing.survival_time,
        payload.confidence ?? existing.confidence ?? 0,
        payload.source_frame_job_id || existing.source_frame_job_id,
        payload.source_result_id || existing.source_result_id,
        payload.status || existing.status || "draft",
        payload.notes || existing.notes,
        serializeJson(payload.metadata ?? parseJson(existing.metadata, {}), {}),
        now,
        existing.id,
      );
      const row = db
        .prepare("SELECT * FROM stream_match_stats WHERE id = ?")
        .get(existing.id);
      return res.json(normalizeMatchStat(row));
    }

    const id = randomUUID();
    db.prepare(
      `INSERT INTO stream_match_stats (
        id, stream_session_id, match_key, player_name, team_name, finishes,
        knocks, survival_time, confidence, source_frame_job_id, source_result_id,
        status, notes, metadata, created_date, updated_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      payload.stream_session_id,
      payload.match_key,
      payload.player_name,
      payload.team_name || null,
      payload.finishes ?? null,
      payload.knocks ?? null,
      payload.survival_time || null,
      payload.confidence ?? 0,
      payload.source_frame_job_id || null,
      payload.source_result_id || null,
      payload.status || "draft",
      payload.notes || null,
      serializeJson(payload.metadata, {}),
      now,
      now,
      req.coreAuth?.user?.email || "admin",
    );
    const row = db
      .prepare("SELECT * FROM stream_match_stats WHERE id = ?")
      .get(id);
    return res.status(201).json(normalizeMatchStat(row));
  });

  app.post("/api/stream-extraction/match-stats/aggregate", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const payload = aggregationSchema.parse(req.body || {});
    ensureSessionExists(payload.stream_session_id);
    const minConfidence = payload.min_confidence ?? 0;
    const rows = db
      .prepare(
        "SELECT * FROM stream_ocr_results WHERE stream_session_id = ? AND confidence >= ? ORDER BY created_date DESC",
      )
      .all(payload.stream_session_id, minConfidence)
      .map(normalizeOcrResult)
      .filter(shouldAggregateOcrResult);

    const grouped = new Map();
    for (const row of rows) {
      const key = `${row.player_name.toLowerCase()}::${(row.team_name || "").toLowerCase()}`;
      const list = grouped.get(key) || [];
      list.push(row);
      grouped.set(key, list);
    }

    const aggregated = [];
    for (const groupRows of grouped.values()) {
      const playerName = majorityValue(groupRows.map((row) => row.player_name));
      const teamName = majorityValue(groupRows.map((row) => row.team_name));
      const finishes = bestNumeric(groupRows, "finishes");
      const knocks = bestNumeric(groupRows, "knocks");
      const survivalTime = majorityValue(
        groupRows.map((row) => row.survival_time),
      );
      const confidence =
        groupRows.reduce(
          (sum, row) => sum + Number(row.confidence || 0),
          0,
        ) / Math.max(groupRows.length, 1);
      const topSource = groupRows.toSorted(
        (a, b) => Number(b.confidence || 0) - Number(a.confidence || 0),
      )[0];

      const stat = matchStatUpsertSchema.parse({
        stream_session_id: payload.stream_session_id,
        match_key: payload.match_key,
        player_name: playerName,
        team_name: teamName,
        finishes,
        knocks,
        survival_time: survivalTime,
        confidence,
        source_frame_job_id: topSource?.frame_job_id,
        source_result_id: topSource?.id,
        status: "draft",
        metadata: {
          aggregated_from_results: groupRows.map((row) => row.id),
          sample_count: groupRows.length,
        },
      });

      const existing = db
        .prepare(
          "SELECT * FROM stream_match_stats WHERE stream_session_id = ? AND match_key = ? AND player_name = ?",
        )
        .get(stat.stream_session_id, stat.match_key, stat.player_name);
      const now = nowIso();
      if (existing) {
        db.prepare(
          `UPDATE stream_match_stats SET
            team_name = ?, finishes = ?, knocks = ?, survival_time = ?,
            confidence = ?, source_frame_job_id = ?, source_result_id = ?,
            status = ?, metadata = ?, updated_date = ?
          WHERE id = ?`,
        ).run(
          stat.team_name || existing.team_name,
          stat.finishes ?? existing.finishes,
          stat.knocks ?? existing.knocks,
          stat.survival_time || existing.survival_time,
          stat.confidence ?? existing.confidence,
          stat.source_frame_job_id || existing.source_frame_job_id,
          stat.source_result_id || existing.source_result_id,
          existing.status || "draft",
          serializeJson(stat.metadata, {}),
          now,
          existing.id,
        );
        aggregated.push(
          normalizeMatchStat(
            db.prepare("SELECT * FROM stream_match_stats WHERE id = ?").get(existing.id),
          ),
        );
      } else {
        const id = randomUUID();
        db.prepare(
          `INSERT INTO stream_match_stats (
            id, stream_session_id, match_key, player_name, team_name, finishes,
            knocks, survival_time, confidence, source_frame_job_id, source_result_id,
            status, notes, metadata, created_date, updated_date, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          id,
          stat.stream_session_id,
          stat.match_key,
          stat.player_name,
          stat.team_name || null,
          stat.finishes ?? null,
          stat.knocks ?? null,
          stat.survival_time || null,
          stat.confidence ?? 0,
          stat.source_frame_job_id || null,
          stat.source_result_id || null,
          stat.status || "draft",
          null,
          serializeJson(stat.metadata, {}),
          now,
          now,
          req.coreAuth?.user?.email || "admin",
        );
        aggregated.push(
          normalizeMatchStat(
            db.prepare("SELECT * FROM stream_match_stats WHERE id = ?").get(id),
          ),
        );
      }
    }

    return res.json({
      ok: true,
      count: aggregated.length,
      items: aggregated,
    });
  });

  app.get("/api/stream-extraction/sessions/:id/match-stats", (req, res) => {
    if (!requireAdmin(req, res)) return;
    ensureSessionExists(req.params.id);
    const matchKey = String(req.query.match_key || "").trim();
    const rows = matchKey
      ? db
          .prepare(
            "SELECT * FROM stream_match_stats WHERE stream_session_id = ? AND match_key = ? ORDER BY player_name COLLATE NOCASE ASC",
          )
          .all(req.params.id, matchKey)
      : db
          .prepare(
            "SELECT * FROM stream_match_stats WHERE stream_session_id = ? ORDER BY match_key ASC, player_name COLLATE NOCASE ASC",
          )
          .all(req.params.id);
    return res.json(rows.map(normalizeMatchStat));
  });
}

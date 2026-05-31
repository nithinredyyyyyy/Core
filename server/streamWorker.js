import { spawn } from "node:child_process";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputDir = path.resolve(
  process.env.STREAM_WORKER_OUTPUT_DIR || path.join(repoRoot, "tmp", "stream-worker"),
);

const apiBaseUrl = String(
  process.env.STREAM_API_BASE_URL ||
    `http://127.0.0.1:${process.env.PORT || "4000"}`,
).replace(/\/+$/, "");
const adminKey = String(process.env.CORE_ADMIN_KEY || "").trim();
const loopIntervalMs = Math.max(
  5_000,
  Number(process.env.STREAM_WORKER_LOOP_MS || 15_000),
);
const sampleIntervalSeconds = Math.max(
  1,
  Number(process.env.STREAM_FRAME_SAMPLE_INTERVAL_SECONDS || 5),
);
const ytdlpBin = String(process.env.STREAM_YTDLP_BIN || "yt-dlp").trim();
const ffmpegBin = String(process.env.STREAM_FFMPEG_BIN || "ffmpeg").trim();
const tesseractBin = String(
  process.env.STREAM_TESSERACT_BIN || "tesseract",
).trim();
const ocrWebhookUrl = String(process.env.STREAM_OCR_WEBHOOK_URL || "").trim();
const ocrWebhookToken = String(process.env.STREAM_OCR_WEBHOOK_TOKEN || "").trim();
const ocrMode = String(process.env.STREAM_OCR_MODE || "").trim().toLowerCase();
const preferredOcrMode = ocrMode || (ocrWebhookUrl ? "webhook" : "tesseract");
const workerName = String(process.env.STREAM_WORKER_NAME || "cloud-stream-worker");
const isOnce = process.argv.includes("--once");

const cropPresets = {
  full_frame: [
    {
      key: "full_frame",
      label: "Full frame",
      filter: null,
    },
  ],
  bmps_left_feed: [
    {
      key: "bmps_left_feed",
      label: "BMPS left feed",
      filter: "crop=trunc(iw*0.24/2)*2:trunc(ih*0.82/2)*2:0:0",
    },
  ],
  bmps_center_player_stats: [
    {
      key: "bmps_center_player_stats",
      label: "BMPS center player stats",
      filter: "crop=trunc(iw*0.38/2)*2:trunc(ih*0.26/2)*2:trunc(iw*0.32/2)*2:trunc(ih*0.74/2)*2",
    },
  ],
  bmps_marked_feed_stats: [
    {
      key: "bmps_left_feed",
      label: "BMPS left feed",
      filter: "crop=trunc(iw*0.24/2)*2:trunc(ih*0.82/2)*2:0:0",
    },
    {
      key: "bmps_center_player_stats",
      label: "BMPS center player stats",
      filter: "crop=trunc(iw*0.38/2)*2:trunc(ih*0.26/2)*2:trunc(iw*0.32/2)*2:trunc(ih*0.74/2)*2",
    },
  ],
};

const baseOcrPrompt = [
  "You are reading a BGMI esports stream frame.",
  "Return strict JSON only. Do not include markdown or explanation.",
  "Use null for text that is not visible. Keep numbers as numbers.",
  "Include confidence from 0 to 1 for every extracted row or event.",
].join(" ");

const cropPrompts = {
  full_frame: [
    baseOcrPrompt,
    "Detect any visible esports HUD, scoreboard, kill feed, or player stats overlay.",
    "Extract rows with player_name, team_name, finishes, knocks, survival_time, damage, assists, confidence.",
    "Return {scoreboardVisible, match_key, rows:[...]} only.",
  ].join(" "),
  bmps_left_feed: [
    baseOcrPrompt,
    "This crop is the LEFT HUD/feed area of a BMPS stream.",
    "Extract match_info with remaining, teams_alive, game_time, match_number, group, and map.",
    "Extract team_roster rows with team_name, player_name, and individual_finishes from the left team panel.",
    "Extract kill_feed_events with killer_team, killer_player, victim_team, victim_player, weapon, action, survival_time, raw_text, confidence.",
    "For kill feed eliminations, use the visible HUD game_time as the victim survival_time if the feed row does not show its own time.",
    "Return {scoreboardVisible, match_key, match_info:{...}, team_roster:[...], kill_feed_events:[...], rows:[...]} only.",
  ].join(" "),
  bmps_center_player_stats: [
    baseOcrPrompt,
    "This crop is the CENTER player stat overlay of a BMPS stream.",
    "Extract player_stats rows with team_name, player_name, weapons, utility, finishes, damage, assists, raw_text, confidence.",
    "weapons and utility may be arrays of item names or counts if the overlay shows icons.",
    "Return {scoreboardVisible, match_key, player_stats:[...], rows:[...]} only.",
  ].join(" "),
};

async function ensureOutputDir() {
  await fsp.mkdir(outputDir, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso() {
  return new Date().toISOString();
}

function parseJsonSafe(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function log(...parts) {
  console.log(`[stream-worker:${workerName}]`, ...parts);
}

async function apiRequest(route, options = {}) {
  const headers = {
    "content-type": "application/json",
    ...(options.headers || {}),
  };
  if (adminKey) {
    headers["x-core-admin-key"] = adminKey;
  }

  const response = await fetch(`${apiBaseUrl}${route}`, {
    method: options.method || "GET",
    headers,
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `API ${options.method || "GET"} ${route} failed: ${response.status} ${text}`,
    );
  }

  const text = await response.text();
  return text ? parseJsonSafe(text, text) : null;
}

function runCommand(command, args, { timeoutMs = 60_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(
          new Error(
            `${command} exited with code ${code}: ${stderr.trim() || stdout.trim()}`,
          ),
        );
        return;
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

async function resolveYoutubeStreamUrl(youtubeUrl) {
  const { stdout } = await runCommand(
    ytdlpBin,
    ["--no-warnings", "-g", youtubeUrl],
    { timeoutMs: 90_000 },
  );
  const firstLine = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) {
    throw new Error("yt-dlp did not return a media URL");
  }
  return firstLine;
}

async function captureFrame(mediaUrl, destinationPath) {
  await runCommand(
    ffmpegBin,
    [
      "-y",
      "-loglevel",
      "error",
      "-i",
      mediaUrl,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      destinationPath,
    ],
    { timeoutMs: 120_000 },
  );
  return destinationPath;
}

async function cropFrame(sourcePath, destinationPath, cropFilter) {
  if (!cropFilter) return sourcePath;
  await runCommand(
    ffmpegBin,
    [
      "-y",
      "-loglevel",
      "error",
      "-i",
      sourcePath,
      "-vf",
      cropFilter,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      destinationPath,
    ],
    { timeoutMs: 60_000 },
  );
  return destinationPath;
}

async function readImageAsBase64(filePath) {
  const bytes = await fsp.readFile(filePath);
  return bytes.toString("base64");
}

function deriveMatchKey(session, ocrResponse = null) {
  return (
    ocrResponse?.match_key ||
    session?.metadata?.match_key ||
    session?.hud_profile ||
    session?.title ||
    "live-stream"
  );
}

function getSessionCropPresets(session) {
  const rawPreset = String(
    session?.metadata?.crop_preset ||
      process.env.STREAM_CROP_PRESET ||
      "full_frame",
  )
    .trim()
    .toLowerCase();
  return cropPresets[rawPreset] || cropPresets.full_frame;
}

function getOcrPrompt(cropPresetKey) {
  return cropPrompts[cropPresetKey] || cropPrompts.full_frame;
}

function firstNonEmpty(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function coerceNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : normalizeOcrNumber(value);
}

function normalizeGenericOcrRow(row, cropPreset, eventType = "player_row") {
  const isKillFeed = eventType === "kill_feed";
  const playerName = isKillFeed
    ? firstNonEmpty(row.victim_player, row.player_name, row.player, row.name)
    : firstNonEmpty(
        row.player_name,
        row.player,
        row.name,
        row.killer_player,
        row.victim_player,
        eventType,
      );
  const teamName = isKillFeed
    ? firstNonEmpty(row.victim_team, row.team_name, row.team)
    : firstNonEmpty(row.team_name, row.team, row.killer_team, row.victim_team);
  const payload = {
    ...(row.normalized_payload || row),
    event_type: row.event_type || eventType,
    crop_preset: cropPreset.key,
    crop_label: cropPreset.label,
    player_name: playerName,
    team_name: teamName,
  };

  return {
    player_name: playerName,
    team_name: teamName,
    finishes: coerceNumber(
      firstNonEmpty(row.finishes, row.finish, row.individual_finishes, row.kills),
    ),
    knocks: coerceNumber(firstNonEmpty(row.knocks, row.knockdowns)),
    survival_time: firstNonEmpty(row.survival_time, row.avg_survival),
    confidence: Number(firstNonEmpty(row.confidence, 0.5)),
    raw_text: firstNonEmpty(row.raw_text, row.text, null),
    normalized_payload: payload,
  };
}

function flattenOcrRows(ocr, cropPreset) {
  const rows = [];
  const matchGameTime = firstNonEmpty(
    ocr?.match_info?.game_time,
    ocr?.match_info?.time,
    ocr?.game_time,
    ocr?.time,
  );
  const addRow = (row, eventType) => {
    if (!row || typeof row !== "object") return;
    const sourceRow =
      eventType === "kill_feed"
        ? {
            ...row,
            player_name: firstNonEmpty(row.victim_player, row.player_name, row.player),
            team_name: firstNonEmpty(row.victim_team, row.team_name, row.team),
            survival_time: firstNonEmpty(row.survival_time, row.game_time, matchGameTime),
            normalized_payload: {
              ...(row.normalized_payload || row),
              killer_player: row.killer_player,
              killer_team: row.killer_team,
              victim_player: row.victim_player,
              victim_team: row.victim_team,
              weapon: row.weapon,
              survival_time: firstNonEmpty(
                row.survival_time,
                row.game_time,
                matchGameTime,
              ),
            },
          }
        : row;
    const normalized = normalizeGenericOcrRow(sourceRow, cropPreset, eventType);
    if (normalized.player_name) rows.push(normalized);
  };

  if (ocr?.match_info && typeof ocr.match_info === "object") {
    addRow(
      {
        player_name: "match_info",
        team_name: firstNonEmpty(ocr.match_info.group, ocr.match_info.map),
        confidence: firstNonEmpty(ocr.match_info.confidence, 0.6),
        normalized_payload: {
          event_type: "match_info",
          remaining: coerceNumber(ocr.match_info.remaining),
          teams_alive: coerceNumber(
            firstNonEmpty(ocr.match_info.teams_alive, ocr.match_info.team),
          ),
          game_time: firstNonEmpty(ocr.match_info.game_time, ocr.match_info.time),
          match_number: firstNonEmpty(
            ocr.match_info.match_number,
            ocr.match_info.match,
          ),
          group: ocr.match_info.group,
          map: ocr.match_info.map,
        },
      },
      "match_info",
    );
  }

  for (const row of ocr?.team_roster || ocr?.players || []) {
    addRow(row, "left_roster");
  }
  for (const row of ocr?.kill_feed_events || ocr?.kill_feed || []) {
    addRow(row, "kill_feed");
  }
  for (const row of ocr?.player_stats || ocr?.center_player_stats || []) {
    addRow(row, "center_player_stats");
  }
  for (const row of ocr?.rows || []) {
    addRow(row, row.event_type || "player_row");
  }

  return rows;
}

function normalizeOcrNumber(value) {
  const cleaned = String(value || "")
    .replace(/[Oo]/g, "0")
    .replace(/[Il|]/g, "1")
    .replace(/[Ss]/g, "5")
    .replace(/[^0-9]/g, "");
  return cleaned ? Number(cleaned) : null;
}

function normalizeSurvivalTime(value) {
  const cleaned = String(value || "")
    .replace(/[Oo]/g, "0")
    .replace(/[Il|]/g, "1")
    .replace(/[^0-9:]/g, "")
    .trim();
  const match = cleaned.match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : null;
}

function parseScoreboardRowsFromText(rawText) {
  const rows = [];
  const lines = String(rawText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const normalizedLine = line.replace(/\s+/g, " ").trim();
    const timeMatch = normalizedLine.match(/(\d{1,2}[:;][0-9OIl|]{2})/i);
    const numberTokens = normalizedLine.match(/[0-9OIl|]{1,3}/g) || [];
    if (!timeMatch || numberTokens.length < 2) {
      continue;
    }

    const survivalTime = normalizeSurvivalTime(timeMatch[1].replace(";", ":"));
    const timeIndex = normalizedLine.indexOf(timeMatch[1]);
    const leftPart =
      timeIndex >= 0 ? normalizedLine.slice(0, timeIndex).trim() : normalizedLine;
    const leftTokens = leftPart.split(/\s+/).filter(Boolean);
    if (leftTokens.length < 3) {
      continue;
    }

    const knocks = normalizeOcrNumber(leftTokens[leftTokens.length - 1]);
    const finishes = normalizeOcrNumber(leftTokens[leftTokens.length - 2]);
    const playerName = leftTokens.slice(0, -2).join(" ").trim();

    if (!playerName || finishes === null || knocks === null || !survivalTime) {
      continue;
    }

    rows.push({
      player_name: playerName,
      team_name: null,
      finishes,
      knocks,
      survival_time: survivalTime,
      confidence: 0.45,
      raw_text: normalizedLine,
      normalized_payload: {
        player_name: playerName,
        finishes,
        knocks,
        survival_time: survivalTime,
      },
    });
  }

  return rows;
}

async function callTesseractOcr(framePath) {
  const { stdout } = await runCommand(
    tesseractBin,
    [
      framePath,
      "stdout",
      "--psm",
      "6",
      "-l",
      "eng",
    ],
    { timeoutMs: 120_000 },
  );

  const rows = parseScoreboardRowsFromText(stdout);
  return {
    scoreboardVisible: rows.length > 0,
    match_key: null,
    rows,
    raw_text: stdout,
    provider: "tesseract",
  };
}

async function callOcrWebhook({ session, frameJob, framePath }) {
  if (!ocrWebhookUrl) {
    return null;
  }

  const imageBase64 = await readImageAsBase64(framePath);
  const response = await fetch(ocrWebhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(ocrWebhookToken
        ? { authorization: `Bearer ${ocrWebhookToken}` }
        : {}),
    },
    body: JSON.stringify({
      prompt: getOcrPrompt(frameJob?.metadata?.crop_preset),
      session,
      frame_job: frameJob,
      image: {
        mime_type: "image/jpeg",
        base64: imageBase64,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OCR webhook failed: ${response.status} ${text}`);
  }

  return parseJsonSafe(await response.text(), {});
}

async function executeOcr({ session, frameJob, framePath }) {
  if (preferredOcrMode === "webhook") {
    return callOcrWebhook({ session, frameJob, framePath });
  }
  if (preferredOcrMode === "tesseract") {
    return callTesseractOcr(framePath);
  }
  throw new Error(`Unsupported STREAM_OCR_MODE: ${preferredOcrMode}`);
}

async function patchSession(id, patch) {
  return apiRequest(`/api/stream-extraction/sessions/${id}`, {
    method: "PATCH",
    body: patch,
  });
}

async function patchFrameJob(id, patch) {
  return apiRequest(`/api/stream-extraction/frame-jobs/${id}`, {
    method: "PATCH",
    body: patch,
  });
}

async function createFrameJob(payload) {
  return apiRequest("/api/stream-extraction/frame-jobs", {
    method: "POST",
    body: payload,
  });
}

async function createOcrResult(payload) {
  return apiRequest("/api/stream-extraction/ocr-results", {
    method: "POST",
    body: payload,
  });
}

async function aggregateMatchStats(payload) {
  return apiRequest("/api/stream-extraction/match-stats/aggregate", {
    method: "POST",
    body: payload,
  });
}

async function markSessionFailure(session, error) {
  await patchSession(session.id, {
    status: "failed",
    notes: String(error?.message || error || "Unknown worker failure"),
    last_heartbeat_at: nowIso(),
  });
}

async function sampleSession(session) {
  const sessionDir = path.join(outputDir, session.id);
  await fsp.mkdir(sessionDir, { recursive: true });

  const captureAt = Date.now();
  const frameName = `frame-${captureAt}.jpg`;
  const framePath = path.join(sessionDir, frameName);

  const directMediaUrl = await resolveYoutubeStreamUrl(session.youtube_url);
  await captureFrame(directMediaUrl, framePath);
  const sessionCropPresets = getSessionCropPresets(session);

  await patchSession(session.id, {
    status: preferredOcrMode ? "processing" : "capturing",
    started_at: session.started_at || nowIso(),
    last_heartbeat_at: nowIso(),
    last_frame_at: nowIso(),
    sampling_interval_seconds:
      session.sampling_interval_seconds || sampleIntervalSeconds,
  });

  const processed = [];
  for (const cropPreset of sessionCropPresets) {
    const cropPath = cropPreset.filter
      ? path.join(sessionDir, `frame-${captureAt}-${cropPreset.key}.jpg`)
      : framePath;
    await cropFrame(framePath, cropPath, cropPreset.filter);

    const frameJob = await createFrameJob({
      stream_session_id: session.id,
      frame_timestamp_ms: captureAt,
      stream_timestamp_seconds: Math.floor(captureAt / 1000),
      frame_url: pathToFileURL(framePath).href,
      crop_url: pathToFileURL(cropPath).href,
      status: preferredOcrMode ? "ocr_pending" : "sampled",
      scoreboard_visible: 0,
      ocr_provider: preferredOcrMode || undefined,
      ocr_requested_at: preferredOcrMode ? nowIso() : undefined,
      metadata: {
        worker: workerName,
        source_media_url: directMediaUrl,
        crop_preset: cropPreset.key,
        crop_label: cropPreset.label,
        crop_filter: cropPreset.filter,
      },
    });

    if (!preferredOcrMode) {
      processed.push({ frameJob, ocr: null });
      continue;
    }

    const ocr = await executeOcr({
      session,
      frameJob,
      framePath: cropPath,
    });
    const extractedRows = flattenOcrRows(ocr, cropPreset);
    const ocrWithRows = { ...(ocr || {}), rows: extractedRows };

    const scoreboardVisible =
      ocr?.scoreboardVisible || extractedRows.length > 0 ? 1 : 0;
    if (!scoreboardVisible || !extractedRows.length) {
      await patchFrameJob(frameJob.id, {
        status: scoreboardVisible ? "ocr_complete" : "skipped",
        scoreboard_visible: scoreboardVisible,
        ocr_completed_at: nowIso(),
        metadata: {
          ...(frameJob.metadata || {}),
          ocr,
        },
      });
      processed.push({ frameJob, ocr: ocrWithRows });
      continue;
    }

    for (const row of extractedRows) {
      await createOcrResult({
        frame_job_id: frameJob.id,
        stream_session_id: session.id,
        player_name: row.player_name,
        team_name: row.team_name,
        finishes: row.finishes,
        knocks: row.knocks,
        survival_time: row.survival_time,
        confidence: row.confidence ?? 0,
        raw_text: row.raw_text,
        normalized_payload: row.normalized_payload || row,
      });
    }

    await patchFrameJob(frameJob.id, {
      status: "ocr_complete",
      scoreboard_visible: 1,
      ocr_completed_at: nowIso(),
      metadata: {
        ...(frameJob.metadata || {}),
        ocr_summary: {
          row_count: extractedRows.length,
          match_key: deriveMatchKey(session, ocr),
          crop_preset: cropPreset.key,
        },
      },
    });
    processed.push({ frameJob, ocr: ocrWithRows });
  }

  await aggregateMatchStats({
    stream_session_id: session.id,
    match_key: deriveMatchKey(session, processed.find((item) => item.ocr)?.ocr),
    min_confidence: 0,
  });

  return {
    frameJob: processed[0]?.frameJob || null,
    ocr: {
      rows: processed.flatMap((item) => item.ocr?.rows || []),
      crops: processed.map((item) => ({
        frame_job_id: item.frameJob?.id,
        crop_preset: item.frameJob?.metadata?.crop_preset,
        row_count: item.ocr?.rows?.length || 0,
      })),
    },
  };
}

function shouldSampleSession(session) {
  const intervalSeconds =
    Number(session.sampling_interval_seconds || sampleIntervalSeconds) ||
    sampleIntervalSeconds;
  if (!session.last_frame_at) return true;
  const lastFrameMs = new Date(session.last_frame_at).getTime();
  return Date.now() - lastFrameMs >= intervalSeconds * 1000;
}

async function promoteQueuedSessions() {
  const queued = await apiRequest("/api/stream-extraction/sessions?status=queued");
  for (const session of queued || []) {
    await patchSession(session.id, {
      status: "capturing",
      started_at: session.started_at || nowIso(),
      last_heartbeat_at: nowIso(),
      sampling_interval_seconds:
        session.sampling_interval_seconds || sampleIntervalSeconds,
      notes: session.notes || "Worker accepted queued capture session.",
    });
  }
}

async function processActiveSessions() {
  const capturing = await apiRequest(
    "/api/stream-extraction/sessions?status=capturing",
  );
  const processing = await apiRequest(
    "/api/stream-extraction/sessions?status=processing",
  );
  const sessions = [...(capturing || []), ...(processing || [])];

  for (const session of sessions) {
    try {
      await patchSession(session.id, {
        last_heartbeat_at: nowIso(),
      });
      if (!shouldSampleSession(session)) {
        continue;
      }
      const result = await sampleSession(session);
      log(
        "sampled",
        session.id,
        result.frameJob?.id || "no-frame-job",
        result.ocr?.rows?.length ? `${result.ocr.rows.length} rows` : "no rows",
      );
    } catch (error) {
      log("failed", session.id, String(error?.message || error));
      await markSessionFailure(session, error);
    }
  }
}

async function runCycle() {
  await ensureOutputDir();
  if (!adminKey) {
    throw new Error("CORE_ADMIN_KEY is required for stream worker access");
  }
  await promoteQueuedSessions();
  await processActiveSessions();
}

async function main() {
  log("starting", isOnce ? "once" : "loop", "api", apiBaseUrl);
  do {
    try {
      await runCycle();
    } catch (error) {
      log("cycle-error", String(error?.message || error));
    }
    if (!isOnce) {
      await sleep(loopIntervalMs);
    }
  } while (!isOnce);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

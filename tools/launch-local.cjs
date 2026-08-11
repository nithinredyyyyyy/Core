const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const logsDir = path.join(rootDir, "logs");
const pidFile = path.join(logsDir, "local-pids.json");
const backendPort = Number(process.env.BACKEND_PORT || 4000);
const frontendPort = Number(process.env.FRONTEND_PORT || 5173);
const backendUrl = `http://127.0.0.1:${backendPort}`;
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const shouldRestart = process.argv.includes("--restart");
const useLocalSqlite = process.argv.includes("--sqlite");

fs.mkdirSync(logsDir, { recursive: true });

function loadEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filepath, "utf8")
      .split(/\r?\n/)
      .flatMap((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
          return [];
        }
        const index = trimmed.indexOf("=");
        const key = trimmed.slice(0, index).trim();
        const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
        return key ? [[key, value]] : [];
      }),
  );
}

function requestText(url, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        if ((res.statusCode || 500) >= 400) {
          reject(new Error(`${url} returned ${res.statusCode}: ${body.slice(0, 200)}`));
          return;
        }
        resolve(body);
      });
    });
    req.on("timeout", () => {
      req.destroy(new Error(`${url} timed out`));
    });
    req.on("error", reject);
  });
}

async function waitFor(label, url, validate = () => true) {
  const deadline = Date.now() + 20000;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const body = await requestText(url);
      if (validate(body)) return body;
      lastError = new Error(`${label} responded but did not pass validation`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${label} did not become ready: ${lastError?.message || "unknown error"}`);
}

function openLog(name, stream) {
  return fs.openSync(path.join(logsDir, `local-${name}.${stream}.log`), "a");
}

function spawnService(name, args, env) {
  const stdout = openLog(name, "out");
  const stderr = openLog(name, "err");
  const child = spawn(process.execPath, args, {
    cwd: rootDir,
    detached: true,
    env,
    stdio: ["ignore", stdout, stderr],
    windowsHide: true,
  });
  child.unref();
  fs.closeSync(stdout);
  fs.closeSync(stderr);
  return child.pid;
}

async function stopRecordedServices() {
  if (!fs.existsSync(pidFile)) return;
  let pids = [];
  try {
    const payload = JSON.parse(fs.readFileSync(pidFile, "utf8"));
    pids = [payload.backendPid, payload.frontendPid].filter((pid) =>
      Number.isInteger(Number(pid)),
    );
  } catch {
    return;
  }

  for (const pid of pids) {
    try {
      process.kill(Number(pid));
    } catch {
      // The process may already be gone or owned by a different shell.
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 800));
}

async function main() {
  const fileEnv = loadEnvFile(path.join(rootDir, ".env"));
  const baseEnv = {
    ...process.env,
    ...fileEnv,
    PORT: String(backendPort),
    FRONTEND_ORIGIN: `http://127.0.0.1:${frontendPort},http://localhost:${frontendPort}`,
  };

  if (useLocalSqlite) {
    baseEnv.TURSO_DATABASE_URL = "";
    baseEnv.TURSO_AUTH_TOKEN = "";
  }

  if (!fs.existsSync(path.join(rootDir, "dist", "index.html"))) {
    throw new Error("Missing dist/index.html. Run npm run build first.");
  }

  if (shouldRestart) {
    await stopRecordedServices();
  }

  let backendPid = null;
  let frontendPid = null;

  try {
    await requestText(`${backendUrl}/api/health`, 1000);
  } catch {
    backendPid = spawnService("backend", ["server/index.js"], baseEnv);
  }

  try {
    await requestText(frontendUrl, 1000);
  } catch {
    frontendPid = spawnService("frontend", ["tools/serve-dist.cjs"], {
      ...baseEnv,
      PORT: String(frontendPort),
      API_TARGET: backendUrl,
    });
  }

  fs.writeFileSync(
    pidFile,
    JSON.stringify(
      {
        backendPid,
        frontendPid,
        backendUrl,
        frontendUrl,
        startedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  await waitFor("Backend", `${backendUrl}/api/health`, (body) => body.includes('"ok":true'));
  await waitFor("Frontend", frontendUrl, (body) => body.includes("<!doctype html") || body.includes("<!DOCTYPE html"));
  await waitFor("Tournament API", `${backendUrl}/api/entities/Tournament`, (body) =>
    body.includes("Battlegrounds Mobile India Pro Series 2026"),
  );
  await waitFor("Frontend API proxy", `${frontendUrl}/api/entities/Tournament`, (body) =>
    body.includes("Battlegrounds Mobile India Pro Series 2026"),
  );

  console.log(`Backend ready: ${backendUrl}`);
  console.log(`Frontend ready: ${frontendUrl}`);
  console.log("Tournament data is visible through backend and frontend proxy.");
  console.log(`Logs: ${path.join(logsDir, "local-backend.out.log")} and ${path.join(logsDir, "local-frontend.out.log")}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const port = Number(process.env.PORT || 5173);
const apiTarget = process.env.API_TARGET || "http://127.0.0.1:4000";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp",
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  });

  if (ext === ".html") {
    const assetVersion = String(Date.now());
    const html = fs
      .readFileSync(filePath, "utf8")
      .replace(/(\/assets\/index\.js)(["'])/g, `$1?v=${assetVersion}$2`)
      .replace(/(\/assets\/index\.css)(["'])/g, `$1?v=${assetVersion}$2`);
    res.end(html);
    return;
  }

  fs.createReadStream(filePath).pipe(res);
}

function proxyApi(req, res) {
  const targetUrl = new URL(req.url, apiTarget);
  const proxyReq = http.request(
    targetUrl,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: targetUrl.host,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("error", (error) => {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message || "API proxy failed" }));
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    proxyApi(req, res);
    return;
  }

  const urlPath = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${port}`).pathname);
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = path.join(distDir, safePath);
  const filePath =
    fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()
      ? requestedPath
      : path.join(distDir, "index.html");

  if (!filePath.startsWith(distDir) || !fs.existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  sendFile(res, filePath);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Core frontend running at http://127.0.0.1:${port}`);
});

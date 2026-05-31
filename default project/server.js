const fs = require("fs");
const path = require("path");
const http = require("http");
const { URL } = require("url");

const rootDir = __dirname;
const port = 3001;
const excelPath = "C:/Users/surak/OneDrive/Documents/ES.xlsx";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || "application/octet-stream";

  const stream = fs.createReadStream(filePath);
  stream.on("open", () => {
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });
  });
  stream.on("error", () => {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Unable to read file.");
  });
  stream.pipe(res);
}

function tryReadExcelData() {
  try {
    const XLSX = require("xlsx");
    if (!fs.existsSync(excelPath)) {
      return { error: `Excel file not found at ${excelPath}` };
    }

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    return { sheetName, data };
  } catch (error) {
    return { error: error.message };
  }
}

function resolvePath(urlPath) {
  const requestPath = urlPath === "/" ? "/ind.html" : urlPath;
  const decodedPath = decodeURIComponent(requestPath);
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const absolutePath = path.join(rootDir, normalizedPath);

  if (!absolutePath.startsWith(rootDir)) {
    return null;
  }

  return absolutePath;
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === "/data") {
    const result = tryReadExcelData();
    if (result.error) {
      return sendJson(res, 500, result);
    }
    return sendJson(res, 200, result.data);
  }

  const absolutePath = resolvePath(requestUrl.pathname);
  if (!absolutePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.stat(absolutePath, (error, stats) => {
    if (error || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("File not found");
      return;
    }

    sendFile(res, absolutePath);
  });
});

server.listen(port, () => {
  console.log(`Local server running at http://localhost:${port}/ind.html`);
});

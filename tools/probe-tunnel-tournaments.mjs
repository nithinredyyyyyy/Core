import { chromium } from "playwright";

const URL = "https://fully-combining-hello-pictures.trycloudflare.com";
const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
let mimeErrors = 0;
page.on("console", (m) => {
  if (m.type() === "error" && /MIME type|Failed to fetch dynamically|errorboundary/i.test(m.text())) {
    mimeErrors++;
    console.log("CONSOLE ERR:", m.text().slice(0, 160));
  }
});
page.on("response", (res) => {
  if (res.status() >= 400) console.log("HTTP", res.status(), res.url().slice(0, 130));
});
await page.goto(`${URL}/tournaments`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2500);

const r = await page.evaluate(() => ({
  title: document.title,
  hasList: document.body.innerText.includes("PUBG Mobile World Cup 2026"),
  errorBoundary: document.body.innerText.includes("Something went wrong") || document.body.innerText.includes("ErrorBoundary"),
}));
console.log("TITLE:", r.title);
console.log("hasPMWC list:", r.hasList);
console.log("errorBoundary:", r.errorBoundary);
console.log("MIME/dynamic-import errors:", mimeErrors);

const sw = await page.evaluate(() =>
  fetch("/sw.js").then((res) => res.headers.get("cache-control"))
);
console.log("sw.js cache-control:", sw);

await browser.close();

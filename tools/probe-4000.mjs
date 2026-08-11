import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message.slice(0, 300)));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE ERROR:", m.text().slice(0, 300));
});
await page.goto("http://localhost:4000/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9", {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(2500);
const data = await page.evaluate(() => {
  const txt = (document.body.innerText || "").replace(/\n+/g, " | ");
  const apiCalls = performance
    .getEntriesByType("resource")
    .filter((r) => r.name.includes("/api/"))
    .map((r) => r.name.replace("http://localhost:4000", ""));
  return { len: txt.length, sample: txt.slice(0, 500), apiCalls: apiCalls.slice(0, 12) };
});
console.log("textLen:", data.len);
console.log("text:", data.sample);
console.log("apiCalls:", JSON.stringify(data.apiCalls));
await browser.close();

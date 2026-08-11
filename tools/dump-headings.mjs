import { chromium } from "playwright";

const url = "http://localhost:5173/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);

const dump = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button")];
  const idx = btns.findIndex((b) => (b.textContent || "").trim() === "Group A");
  const probe = btns[idx];
  let html = "";
  if (probe) {
    const board = probe.closest("div[class*='rounded']") || probe.parentElement?.parentElement?.parentElement;
    html = board ? board.outerHTML.slice(0, 4000) : "";
  }
  const headings = [...document.querySelectorAll("h1,h2,h3,h4")]
    .map((h) => `${h.tagName}: ${(h.textContent || "").trim().slice(0, 60)}`);
  return { headings, html };
});

console.log("HEADINGS:");
console.log(dump.headings.join("\n"));
console.log("\nBOARD SNIPPET (HTML):");
console.log(dump.html);

await browser.close();

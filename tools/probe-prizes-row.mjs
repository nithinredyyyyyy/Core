import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1600 } });
await page.goto(
  "http://127.0.0.1:5173/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9",
  { waitUntil: "networkidle", timeout: 60000 }
);
await page.waitForTimeout(1500);

const trigger = page.locator("button", { hasText: /Prize Pool Distribution/i }).first();
await trigger.click();
await page.waitForTimeout(600);

const dump = await page.evaluate(() => {
  const tables = [...document.querySelectorAll("table")];
  const prizeTables = tables.slice(0, 3);
  const sectionBoxes = prizeTables.map((t) => {
    const rect = t.getBoundingClientRect();
    const box = t.parentElement?.getBoundingClientRect();
    return { x: Math.round(rect.x), width: Math.round(rect.width), header: t.previousElementSibling?.textContent?.trim() || "" };
  });
  return sectionBoxes;
});

for (const s of dump) console.log(`x=${s.x} width=${s.width}`);
const sameRow = dump.every((s) => s.width > 350) && new Set(dump.map((s) => s.x)).size === 3;
console.log("three side-by-side:", sameRow);

await browser.close();

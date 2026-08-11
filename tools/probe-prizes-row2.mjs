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

const boxes = await page.evaluate(() => {
  const tables = [...document.querySelectorAll("table")].slice(0, 3);
  return tables.map((t) => {
    const b = t.getBoundingClientRect();
    return { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width) };
  });
});
console.log(JSON.stringify(boxes, null, 1));
const ys = boxes.map((b) => b.y);
console.log("same row:", boxes.length === 3 && new Set(ys).size === 1);

await browser.close();

import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
await page.goto(
  "http://127.0.0.1:5173/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9",
  { waitUntil: "networkidle", timeout: 60000 }
);
await page.waitForTimeout(1500);

const trigger = page.locator("button", { hasText: /Prize Pool Distribution/i }).first();
await trigger.click();
await page.waitForTimeout(500);

const showMore = page.locator("button", { hasText: /^Show more$/ }).first();
console.log("Show more buttons:", await showMore.count());
await showMore.first().click();
await page.waitForTimeout(500);

const dump = await page.evaluate(() => {
  const firstTable = document.querySelectorAll("table")[0];
  const rows = [...firstTable.querySelectorAll("tr")].map((tr) =>
    [...tr.querySelectorAll("th,td")].map((c) => c.textContent?.trim() || "").join(" | ")
  );
  const buttons = [...document.querySelectorAll("button")].map((b) => b.textContent?.trim()).filter((t) => /^Show (more|less)$/i.test(t || ""));
  return { rowCount: rows.length, rows: rows.slice(0, 20), buttons };
});

console.log("Grand Final rows after expand:", dump.rowCount);
console.log(dump.rows.join("\n"));
console.log("toggle buttons:", JSON.stringify(dump.buttons));

await browser.close();

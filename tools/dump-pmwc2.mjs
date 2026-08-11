import { chromium } from "playwright";

const url = "http://localhost:5173/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 2000 } });
page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE ERROR:", m.text().slice(0, 200)); });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2000);

async function dumpView(label) {
  const info = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")]
      .map((b) => b.textContent?.trim())
      .filter((t) => t && t.length < 40);
    const tables = [...document.querySelectorAll("table")].map((t) => {
      const rows = [...t.querySelectorAll("tr")].map((tr) =>
        [...tr.querySelectorAll("th,td")].map((c) => c.textContent?.trim() || "").join(" | ")
      );
      return rows.slice(0, 25);
    });
    const pending = [...document.querySelectorAll("p")].map((p) => p.textContent?.trim()).filter((t) => /pending|will appear|not been attached/i.test(t || ""));
    return { buttons: btns, tables, pending };
  });
  console.log(`\n===== ${label} =====`);
  console.log("buttons:", JSON.stringify(info.buttons));
  if (info.pending.length) console.log("PENDING:", JSON.stringify(info.pending));
  info.tables.forEach((t, i) => {
    console.log(`--- table ${i} ---`);
    console.log(t.join("\n"));
  });
}

await dumpView("INITIAL (groups draw)");

// Click Group A chip
const chipA = page.locator("button", { hasText: /^Group A$/ }).first();
if (await chipA.count()) { await chipA.click(); await page.waitForTimeout(1200); await dumpView("GROUP A"); }
const chipB = page.locator("button", { hasText: /^Group B$/ }).first();
if (await chipB.count()) { await chipB.click(); await page.waitForTimeout(1200); await dumpView("GROUP B"); }

// Survival stage
const survBtn = page.locator("button", { hasText: /^Survival Stage/ }).first();
if (await survBtn.count()) { await survBtn.click(); await page.waitForTimeout(1200); await dumpView("SURVIVAL STAGE"); }

// Grand finals
const gfBtn = page.locator("button", { hasText: /^Grand Finals/ }).first();
if (await gfBtn.count()) { await gfBtn.click(); await page.waitForTimeout(1200); await dumpView("GRAND FINALS"); }

await browser.close();

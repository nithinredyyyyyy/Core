import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});

async function check(width, label) {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  await page.goto("http://127.0.0.1:4000/rankings", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1200);

  const report = { label, width, tabs: {} };
  for (const tab of ["Teams", "Players", "EWC Club Ranking"]) {
    await page.keyboard.press("Escape").catch(() => {});
    const btn = page.locator("button", { hasText: tab }).first();
    if (await btn.count()) {
      await btn.click({ force: true });
      await page.waitForTimeout(500);
    }
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const sw = document.documentElement.scrollWidth;
      const cards = document.querySelectorAll(".md\\:hidden .rounded-2xl").length;
      const tableVisible = getComputedStyle(
        document.querySelector("table")?.closest(".md\\:block") || document.querySelector("table"),
      ).display;
      return { vw, sw, hScroll: sw > vw, cards, tableVisible };
    });
    report.tabs[tab] = r;
  }
  await page.close();
  return report;
}

console.log(JSON.stringify(await check(320, "mobile"), null, 1));
console.log(JSON.stringify(await check(900, "desktop"), null, 1));
await browser.close();

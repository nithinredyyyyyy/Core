import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", headless: true });
const page = await browser.newPage({ viewport: { width: 320, height: 700 } });
await page.goto("http://127.0.0.1:4000/rankings", { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1800);
const r = await page.evaluate(() => {
  const overlays = [...document.querySelectorAll("[aria-label*='Close global search']")].map((el) => {
    const rect = el.getBoundingClientRect();
    return { visible: rect.width > 0 && getComputedStyle(el).visibility !== "hidden", rect: [Math.round(rect.width), Math.round(rect.height)] };
  });
  return { searchOverlayCount: overlays.length, visible: overlays.some((o) => o.visible) };
});
console.log("global-search overlay open on load:", JSON.stringify(r));
await browser.close();

import { chromium } from "playwright";

const url = "http://localhost:5173/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);

await page.locator("button", { hasText: /^Group A$/ }).first().click();
await page.waitForTimeout(1200);

await page.screenshot({ path: "tools/shot-tabs.png", fullPage: false });
await browser.close();
console.log("saved");

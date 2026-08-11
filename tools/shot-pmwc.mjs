import { chromium } from "playwright";

const url = "http://localhost:5173/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text());
});
page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: "C:\\Users\\surak\\AppData\\Local\\Temp\\opencode\\pmwc-detail.png", fullPage: true });
console.log("screenshot saved");
await browser.close();

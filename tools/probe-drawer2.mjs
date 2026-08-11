import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 320, height: 700 } });
await page.goto("http://127.0.0.1:4000/", { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1500);
const r = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("*").forEach((el) => {
    if (el.className && typeof el.className === "string" && el.className.includes("flex-col-reverse")) {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      out.push({
        cls: el.className.slice(0, 100),
        transform: cs.transform,
        opacity: cs.opacity,
        visibility: cs.visibility,
        rect: [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)],
        text: (el.textContent || "").trim().slice(0, 60),
      });
    }
  });
  return out;
});
console.log(JSON.stringify(r, null, 1));
await browser.close();

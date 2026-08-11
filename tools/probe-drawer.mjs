import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 320, height: 700 } });
await page.goto("http://127.0.0.1:4000/", { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1500);

const r = await page.evaluate(() => {
  const el = document.querySelector(".fixed.top-0.z-\\[100\\]");
  if (!el) return { found: false };
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const role = el.getAttribute("role");
  const ariaHidden = el.getAttribute("aria-hidden");
  return {
    found: true,
    transform: cs.transform,
    opacity: cs.opacity,
    visibility: cs.visibility,
    display: cs.display,
    rect: [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)],
    role,
    ariaHidden,
    childText: el.textContent.trim().slice(0, 80),
  };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();

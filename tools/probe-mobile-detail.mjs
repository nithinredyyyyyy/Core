import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4000";
const vw = 320;
const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: vw, height: 700 } });

for (const p of [
  { name: "home", url: "/" },
  { name: "tournaments", url: "/tournaments" },
  { name: "rankings", url: "/rankings" },
]) {
  await page.goto(BASE + p.url, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1200);
  const m = await page.evaluate((vw) => {
    const out = [];
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > vw + 2 || r.left < -2)) {
        const tag = el.tagName.toLowerCase();
        const text = (el.childElementCount === 0 ? el.textContent : "").trim().slice(0, 40);
        const pos = getComputedStyle(el).position;
        const pe = getComputedStyle(el).pointerEvents;
        const href = el.getAttribute && (el.getAttribute("href") || el.getAttribute("data-state") || "");
        out.push({
          tag,
          text,
          href,
          pos,
          pe,
          left: Math.round(r.left),
          right: Math.round(r.right),
          top: Math.round(r.top),
          w: Math.round(r.width),
          cls: (el.className && typeof el.className === "string" ? el.className : "").slice(0, 70),
        });
      }
    });
    return out.slice(0, 20);
  }, vw);
  console.log(`\n=== ${p.name} @${vw}px ===`);
  m.forEach((e) =>
    console.log(
      `[${e.pos}/${e.pe}] ${e.tag} ${e.text ? JSON.stringify(e.text) : ""} ${e.href ? "data=" + e.href : ""} L=${e.left} R=${e.right} W=${e.w} cls="${e.cls}"`
    )
  );
}
await browser.close();

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
  document.querySelectorAll("a,button").forEach((el) => {
    const rect = el.getBoundingClientRect();
    const href = el.getAttribute("href") || "";
    if (rect.right > 318 && rect.width > 0) {
      out.push({
        tag: el.tagName,
        href,
        text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 50),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        w: Math.round(rect.width),
        cls: (el.className || "").toString().slice(0, 80),
      });
    }
  });
  return out;
});
r.forEach((e) => console.log(`${e.tag} "${e.text}" ${e.href} L=${e.left} R=${e.right} W=${e.w} cls="${e.cls}"`));
console.log("\n--- all hero-area CTA candidates ---");
const ctas = await page.evaluate(() => {
  return [...document.querySelectorAll("a[href*='tournaments'],a[href*='matches'],a[href*='watch'],a[href*='news']")]
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return { href: el.getAttribute("href"), text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40), left: Math.round(rect.left), right: Math.round(rect.right), top: Math.round(rect.top), w: Math.round(rect.width) };
    })
    .filter((e) => e.top < 800);
});
ctas.forEach((e) => console.log(`  "${e.text}" ${e.href} L=${e.left} R=${e.right} W=${e.w} top=${e.top}`));
await browser.close();

import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 320, height: 700 } });
await page.goto("http://127.0.0.1:4000/rankings", { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1500);

const r = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  const overflow = [];
  document.querySelectorAll("body *").forEach((el) => {
    const b = el.getBoundingClientRect();
    if (b.width > 0 && (b.right > vw + 2 || b.left < -2)) {
      const text = (el.childElementCount === 0 ? el.textContent : "").trim().slice(0, 30);
      overflow.push({
        cls: (el.className && typeof el.className === "string" ? el.className : "").slice(0, 50),
        text,
        right: Math.round(b.right),
        ox: getComputedStyle(el).overflowX,
        inScrollable: false,
      });
    }
  });
  const cards = [...document.querySelectorAll(".md\\:hidden .rounded-2xl")].slice(0, 3).map((c) => ({
    w: Math.round(c.getBoundingClientRect().width),
    text: c.textContent.replace(/\s+/g, " ").trim().slice(0, 90),
  }));
  const tableVisible = !!document.querySelector("table");
  return { vw, sw, hScroll: sw > vw, overflow, cards, tableVisible };
});

console.log("vw", r.vw, "scrollW", r.sw, "hScroll", r.hScroll);
console.log("desktop table on mobile:", r.tableVisible);
console.log("card count sample:", r.cards.length);
r.cards.forEach((c) => console.log("  card w=" + c.w + " :: " + c.text));
console.log("remaining overflow:");
r.overflow.slice(0, 8).forEach((o) => console.log("  ", o.cls, JSON.stringify(o.text), "right=" + o.right));

await browser.close();

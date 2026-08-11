import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4000";
const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 320, height: 700 } });

async function probe(name, url, selText) {
  await page.goto(BASE + url, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1200);
  const r = await page.evaluate((selText) => {
    const walk = (el) => {
      const chain = [];
      let n = el;
      while (n && n !== document.body) {
        const cs = getComputedStyle(n);
        chain.unshift({
          tag: n.tagName.toLowerCase(),
          cls: (n.className && typeof n.className === "string" ? n.className : "").slice(0, 60),
          ox: cs.overflowX,
          pos: cs.position,
          w: Math.round(n.getBoundingClientRect().width),
        });
        n = n.parentElement;
      }
      return chain;
    };
    const out = [];
    document.querySelectorAll("button,a,table").forEach((el) => {
      const t = (el.textContent || "").trim();
      if (!selText || t === selText || (selText === "HEROBTN" && t.includes("Schedule"))) {
        const r = el.getBoundingClientRect();
        if (r.right > 318) {
          out.push({ tag: el.tagName, text: t.slice(0, 30), rect: [Math.round(r.left), Math.round(r.right), Math.round(r.width)], chain: walk(el) });
        }
      }
    });
    return out;
  }, selText);
  console.log(`\n=== ${name} ===`);
  r.forEach((e) => {
    console.log(`${e.tag} "${e.text}" rect L/R/W=${e.rect}`);
    e.chain.forEach((c, i) => console.log(`  ${i > 0 ? "  └" : "  ├"}${" ".repeat(i)}<${c.tag}> ${c.pos} ox=${c.ox} w=${c.w} ${c.cls}`));
  });
}

await probe("home hero CTA", "/", "HEROBTN");
await probe("tournaments filter chips", "/tournaments", "");
await probe("rankings table", "/rankings", "");
await browser.close();

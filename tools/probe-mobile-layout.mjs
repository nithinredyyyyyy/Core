import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4000";
const PAGES = [
  { name: "home", url: "/" },
  { name: "tournaments", url: "/tournaments" },
  { name: "tournament-detail", url: "/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9" },
  { name: "teams", url: "/teams" },
  { name: "rankings", url: "/rankings" },
  { name: "news", url: "/news" },
];
const VIEWPORTS = [
  { name: "iphone-390", width: 390, height: 844 },
  { name: "android-360", width: 360, height: 800 },
  { name: "small-320", width: 320, height: 700 },
];

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  for (const p of PAGES) {
    try {
      await page.goto(BASE + p.url, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(1200);
      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const sw = document.documentElement.scrollWidth;
        const overflow = [];
        document.querySelectorAll("*").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (r.right > vw + 2 || r.left < -2)) {
            const tag = el.tagName.toLowerCase();
            const cls = (el.className && typeof el.className === "string" ? el.className : "").slice(0, 60);
            overflow.push(`${tag}${cls ? "." + cls.replace(/\s+/g, ".") : ""} right=${Math.round(r.right)} left=${Math.round(r.left)}`);
          }
        });
        return {
          vw,
          sw,
          hOverflow: sw > vw,
          overflowCount: overflow.length,
          samples: overflow.slice(0, 12),
        };
      });
      console.log(`[${vp.name}] ${p.name}: vw=${m.vw} scrollW=${m.sw} hScroll=${m.hOverflow} overflowEls=${m.overflowCount}`);
      if (m.samples.length) {
        m.samples.slice(0, 6).forEach((s) => console.log("    ", s));
      }
    } catch (e) {
      console.log(`[${vp.name}] ${p.name}: FAIL ${e.message.slice(0, 80)}`);
    }
  }
  await page.close();
}

await browser.close();

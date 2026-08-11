import { chromium } from "playwright";

const BASE = process.env.PROBE_BASE || "http://127.0.0.1:5173";
const VIEWPORTS = [
  { name: "iphone-390", width: 390, height: 844 },
  { name: "android-360", width: 360, height: 800 },
  { name: "small-320", width: 320, height: 700 },
];

const home = await fetch(`${BASE}/api/home/view?mode=mobile`).then((r) => r.json());
const tournaments = await fetch(`${BASE}/api/entities/Tournament?sort_by=-created_date&limit=50`).then((r) => r.json());
const matches = await fetch(`${BASE}/api/entities/Match?sort_by=-scheduled_time&limit=500`).then((r) => r.json());
const news = await fetch(`${BASE}/api/news/public?sort_by=-created_date&limit=10`).then((r) => r.json());

const tournamentId = tournaments?.[0]?.id || home?.featuredTournament?.id;
const matchId = matches?.find((m) => m?.map)?.id;
const newsId = news?.[0]?.id;

const PAGES = [
  { name: "home", url: "/" },
  { name: "tournaments", url: "/tournaments" },
  { name: "tournament-detail", url: tournamentId ? `/tournaments/${tournamentId}` : null },
  { name: "teams", url: "/teams" },
  { name: "rankings", url: "/rankings" },
  { name: "news", url: "/news" },
  { name: "news-article", url: newsId ? `/news/${newsId}` : null },
  { name: "match-detail", url: matchId ? `/matches/${matchId}` : null },
].filter((p) => p.url);

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});

let failed = 0;
for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") pageErrors.push(`console: ${msg.text()}`);
  });
  for (const p of PAGES) {
    try {
      await page.goto(BASE + p.url, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(1500);
      const m = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const sw = document.documentElement.scrollWidth;
        const real = [];
        document.querySelectorAll("*").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width <= 0) return;
          if (r.right <= vw + 2 && r.left >= -2) return;
          if (el.closest("nav")) return;
          const clipped = el.closest("[class*='overflow-hidden']");
          if (clipped && clipped !== el) return;
          const scroller = el.parentElement
            ? el.parentElement.closest("[class*='overflow-x-auto'],[class*='overflow-x-scroll'],[class*='overflow-auto']")
            : null;
          if (scroller) return;
          const cs = getComputedStyle(el);
          if (cs.position === "fixed" || cs.position === "absolute") {
            if (clipped) return;
            if (cs.overflowX === "hidden") return;
            if (r.left >= vw || r.right <= 0) return;
          }
          const tag = el.tagName.toLowerCase();
          const cls = (el.className && typeof el.className === "string" ? el.className : "").slice(0, 60);
          real.push(`${tag}${cls ? "." + cls.replace(/\s+/g, ".") : ""} right=${Math.round(r.right)} left=${Math.round(r.left)}`);
        });
        return {
          vw,
          sw,
          hScroll: sw > vw,
          realOverflow: real.length,
          samples: real.slice(0, 8),
          hasBottomNav: Boolean(document.querySelector("nav")),
        };
      });
      const errors = pageErrors.splice(0, pageErrors.length);
      const clean = !m.hScroll && m.realOverflow === 0 && errors.length === 0;
      if (!clean) failed++;
      console.log(`[${vp.name}] ${p.name}: ${clean ? "ok" : "ISSUE"} vw=${m.vw} scrollW=${m.sw} hScroll=${m.hScroll} realOverflow=${m.realOverflow} nav=${m.hasBottomNav}`);
      m.samples.slice(0, 5).forEach((s) => console.log("    ", s));
      errors.slice(0, 5).forEach((e) => console.log("    ", e));
    } catch (e) {
      failed++;
      console.log(`[${vp.name}] ${p.name}: FAIL ${e.message.slice(0, 100)}`);
    }
  }
  await page.close();
}

await browser.close();
console.log(failed === 0 ? "ALL CLEAN" : `${failed} issues detected`);

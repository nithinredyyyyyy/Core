import { chromium } from "file:///C:/Users/surak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const url = process.argv[2] || "http://127.0.0.1:4173/teams";
const shotPath = process.argv[3] || "C:/Users/surak/core/logs/teams-dark-check.png";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });

await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.setItem("theme", "dark");
  document.documentElement.classList.add("dark");
});
await page.reload({ waitUntil: "networkidle" });

const teamNames = await page.locator("img[alt]").evaluateAll((nodes) =>
  nodes.map((node) => ({
    alt: node.getAttribute("alt"),
    src: node.getAttribute("src"),
  }))
);

await page.screenshot({ path: shotPath, fullPage: true });
await browser.close();

console.log(JSON.stringify({ shotPath, teamNames }, null, 2));

import { chromium } from "playwright";

const url = "http://localhost:5173/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);

const dump = await page.evaluate(() => {
  const results = [];
  const btns = [...document.querySelectorAll("button")];
  btns.forEach((b, i) => {
    const t = b.textContent?.trim() || "";
    if (!t) return;
    const cls = (b.className || "").toString();
    results.push({
      i,
      text: t.replace(/\s+/g, " ").slice(0, 60),
      ariaPressed: b.getAttribute("aria-pressed"),
      ariaSelected: b.getAttribute("aria-selected"),
      bg: /bg-primary/.test(cls) ? "PRIMARY" : /bg-foreground/.test(cls) ? "FG" : /bg-card/.test(cls) ? "CARD" : "",
    });
  });
  return results;
});

for (const r of dump) {
  const mark = r.bg ? ` <${r.bg}>` : "";
  console.log(`${String(r.i).padStart(3)} ${r.text}${mark}`);
}

await browser.close();

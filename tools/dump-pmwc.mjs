import { chromium } from "playwright";

const url = "http://localhost:5173/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 2000 } });
page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2500);

const board = await page.evaluate(() => {
  const headings = [...document.querySelectorAll("p,th,h1,h2,h3,button,span")]
    .map((el) => el.textContent?.trim())
    .filter(Boolean);
  const tables = [...document.querySelectorAll("table")].map((t) => {
    const rows = [...t.querySelectorAll("tr")].map((tr) =>
      [...tr.querySelectorAll("th,td")].map((c) => c.textContent?.trim() || "").join(" | ")
    );
    return rows.slice(0, 40);
  });
  const imgs = [...document.querySelectorAll("img")]
    .map((i) => i.getAttribute("src"))
    .filter((s) => s && s.includes("/images/"));
  return {
    textSnippet: headings.filter((h) => /group|stage|survival|finals/i.test(h)).slice(0, 60),
    tables,
    images: [...new Set(imgs)].slice(0, 40),
  };
});

console.log("=== HEADINGS/STAGE TEXT ===");
console.log(JSON.stringify(board.textSnippet, null, 2));
console.log("=== TABLES ===");
board.tables.forEach((t, i) => {
  console.log(`--- table ${i} ---`);
  console.log(t.join("\n"));
});
console.log("=== IMAGES ===");
console.log(JSON.stringify(board.images, null, 2));
await browser.close();

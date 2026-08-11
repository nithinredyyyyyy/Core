import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(
  "http://192.168.29.183:4000/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9",
  { waitUntil: "networkidle", timeout: 60000 }
);
await page.waitForTimeout(2000);

const trigger = page.locator("button", { hasText: /Prize Pool Distribution/i }).first();
if (await trigger.count()) {
  await trigger.click();
  await page.waitForTimeout(600);
}

const dump = await page.evaluate(() => {
  const text = document.body.innerText;
  const idx = text.indexOf("Prize Pool Distribution");
  const headers = [...document.querySelectorAll("p")]
    .map((n) => n.textContent?.trim() || "")
    .filter((t) => /^Total: \$/.test(t));
  const tables = [...document.querySelectorAll("table")].slice(0, 3).map((t) => {
    const b = t.getBoundingClientRect();
    return { w: Math.round(b.width), x: Math.round(b.x) };
  });
  return { section: text.slice(idx, idx + 260), totals: headers, tables };
});

console.log("=== section text ===");
console.log(dump.section);
console.log("totals found:", JSON.stringify(dump.totals));
console.log("table layout (mobile, should stack):", JSON.stringify(dump.tables));

await browser.close();

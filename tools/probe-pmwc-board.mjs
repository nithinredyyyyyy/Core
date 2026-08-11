import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
page.on("response", (res) => {
  const url = res.url();
  if (url.includes("/api/") && res.status() >= 400) {
    console.log(`API ${res.status()}: ${url.replace("http://localhost:5173", "")}`);
  }
});
await page.goto(
  "http://localhost:5173/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9",
  { waitUntil: "networkidle", timeout: 60000 }
);
await page.waitForTimeout(2000);

const full = await page.evaluate(() => document.body.innerText);
console.log("FULL TEXT LENGTH:", full.length);
console.log("----- FULL TEXT -----");
console.log(full);

// click Group A and dump table
const chipA = page.locator("button", { hasText: /^Group A$/ }).first();
if (await chipA.count()) {
  await chipA.click();
  await page.waitForTimeout(1200);
  const boardText = await page.evaluate(() => {
    const tables = [...document.querySelectorAll("table")].map((t) =>
      [...t.querySelectorAll("tr")]
        .map((tr) => [...tr.querySelectorAll("th,td")].map((c) => c.textContent?.trim() || "").join(" | "))
        .join("\n")
    );
    const btns = [...document.querySelectorAll("button")].map((b) => b.textContent?.trim()).filter(Boolean);
    return { tables, btns };
  });
  console.log("\n===== AFTER CLICKING GROUP A =====");
  console.log("buttons:", JSON.stringify(boardText.btns.slice(0, 20)));
  boardText.tables.forEach((t, i) => {
    console.log(`--- table ${i} (${t.split("\n").length} rows) ---`);
    console.log(t.slice(0, 2500));
  });
}

await browser.close();

import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
await page.goto(
  "http://127.0.0.1:5173/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9",
  { waitUntil: "networkidle", timeout: 60000 }
);
await page.waitForTimeout(1500);

const trigger = page.locator("button", { hasText: /Prize Pool Distribution/i }).first();
if (await trigger.count()) {
  await trigger.click();
  await page.waitForTimeout(800);
} else {
  console.log("NO PRIZE TRIGGER FOUND");
}

const dump = await page.evaluate(() => {
  const headers = [...document.querySelectorAll("h3, p")].map((n) => n.textContent?.trim() || "").filter((t) => /Prize Pool Distribution|Total:|Grand Final|Survival Stage|Group Stage \(per group\)|^Show (more|less)$/i.test(t));
  const tables = [...document.querySelectorAll("table")].map((t) =>
    [...t.querySelectorAll("tr")]
      .slice(0, 22)
      .map((tr) => [...tr.querySelectorAll("th,td")].map((c) => c.textContent?.trim() || "").join(" | "))
      .join("\n")
  );
  const allText = document.body.innerText;
  const prizeSection = allText.slice(allText.indexOf("Prize Pool Distribution"));
  return { headers, tables, prizeSection: prizeSection.slice(0, 1800) };
});

console.log("=== headers ===");
console.log(dump.headers.join("\n"));
console.log("=== tables ===");
dump.tables.forEach((t, i) => {
  console.log(`--- table ${i} ---`);
  console.log(t);
});

await browser.close();

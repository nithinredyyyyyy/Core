import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});

async function probe(path, label) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  page.on("pageerror", (e) => console.log(`[${label}] PAGE ERROR:`, e.message.slice(0, 200)));
  page.on("console", (m) => {
    if (m.type() === "error") console.log(`[${label}] CONSOLE ERROR:`, m.text().slice(0, 250));
  });
  await page.goto("http://localhost:5173" + path, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);
  const data = await page.evaluate(() => {
    const txt = (document.body.innerText || "").replace(/\n+/g, " | ");
    const apiCalls = performance.getEntriesByType("resource").filter((r) => r.name.includes("/api/")).map((r) => r.name.replace("http://localhost:5173", ""));
    const imgs = [...document.images].map((i) => i.currentSrc || i.src).slice(0, 8);
    return { len: txt.length, sample: txt.slice(0, 400), apiCalls: apiCalls.slice(0, 10), imgs };
  });
  console.log(`\n===== ${label} ${path} =====`);
  console.log("textLen:", data.len);
  console.log("text:", data.sample);
  console.log("apiCalls:", JSON.stringify(data.apiCalls));
  console.log("imgs:", JSON.stringify(data.imgs));
  await page.close();
}

await probe("/", "HOME");
await probe("/tournaments", "TOURNAMENTS");
await probe("/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9", "PMWC DETAIL");

await browser.close();

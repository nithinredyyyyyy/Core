import { chromium } from "playwright";

const URL = "https://fully-combining-hello-pictures.trycloudflare.com";
const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("response", (res) => {
  if (res.status() >= 400) console.log("HTTP", res.status(), res.url().slice(0, 140));
});
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message.slice(0, 200)));
await page.goto(`${URL}/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9`, {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(2500);

const dump = await page.evaluate(() => ({
  title: document.title,
  hasText: document.body.innerText.includes("PUBG Mobile World Cup 2026"),
  textStart: document.body.innerText.slice(0, 160).replace(/\n+/g, " | "),
}));
console.log("TITLE:", dump.title);
console.log("hasPMWC:", dump.hasText);
console.log("textStart:", dump.textStart);

await browser.close();

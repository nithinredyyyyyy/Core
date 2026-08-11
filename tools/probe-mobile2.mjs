import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message.slice(0, 300)));
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") console.log("CONSOLE:", m.type(), m.text().slice(0, 300));
});
page.on("response", (res) => {
  if (res.status() >= 400) console.log("HTTP", res.status(), res.url().slice(0, 150));
});
await page.goto(
  "http://192.168.29.183:4000/tournaments?id=b7224eb0-f9c3-40fd-b568-0cceda3a6fe9",
  { waitUntil: "networkidle", timeout: 60000 }
);
await page.waitForTimeout(2500);

const dump = await page.evaluate(() => ({
  url: location.href,
  title: document.title,
  textLen: document.body.innerText.length,
  textStart: document.body.innerText.slice(0, 300),
  hasPrize: document.body.innerText.includes("Prize Pool Distribution"),
}));
console.log("URL:", dump.url);
console.log("TITLE:", dump.title);
console.log("textLen:", dump.textLen);
console.log("textStart:", dump.textStart.replace(/\n+/g, " | "));
console.log("hasPrize:", dump.hasPrize);

await browser.close();

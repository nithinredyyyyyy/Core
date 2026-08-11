import { randomUUID } from "node:crypto";
const { db } = await import("file:///C:/Users/surak/core/server/db.js");

const TID = "b7224eb0-f9c3-40fd-b568-0cceda3a6fe9";
const byId = db.prepare("SELECT id, name, participants FROM tournaments WHERE id = ?").get(TID);
const byName = db
  .prepare("SELECT id, name, participants FROM tournaments WHERE name = ?")
  .get("PUBG Mobile World Cup 2026");
const t = byId || byName;
if (!t) {
  console.error("PMWC 2026 not found");
  process.exit(1);
}

const TAGS = {
  "AG.AL International": "AGAL",
  "ThunderTalk Gaming": "TT",
  "XForce Rejects": "XF",
  "FURIA Esports": "FUR",
  "Aurora Gaming": "AUR",
  "GOAT Team": "GOAT",
  "Kiwoom DRX": "DRX",
  "AlUla Club Esports": "ALC",
  "Geekay Esports": "GK",
  "Nigma Galaxy": "NGX",
  "4thrives Esports": "4TH",
  "RRQ RYU": "RRQ",
  "Team Flash": "FLASH",
  "Gaming Stars Esports": "GSE",
  "ULF Esports": "ULF",
  "Yangon Galacticos": "YG",
  "Tianba": "TBA",
  "Alpha7 Esports": "A7",
  "Wolves Esports": "WOL",
  "TT Project": "TTP",
  "DOPENESS": "DOPE",
  "721 Esports": "721",
  "ETSH Esports": "ETSH",
  "Horaa Esports": "HOR",
  "Bigetron by Vitality": "BTR",
  "eArena": "EA",
  "IDA Esports": "IDA",
  "S2G Esports": "S2G",
  "Hustler Crew": "HC",
};

function regionFor(qualification = "") {
  const q = String(qualification || "");
  if (q.includes("PEL")) return "China";
  if (q.includes("KIE")) return "India";
  if (q.includes("BMPS")) return "India";
  if (q.includes("Africa")) return "Africa";
  if (q.includes("Americas")) return "Americas";
  if (q.includes("EECA")) return "EECA";
  if (q.includes("MENA")) return "MENA";
  if (q.includes("South Asia")) return "South Asia";
  if (q.includes("Southeast Asia")) return "Southeast Asia";
  if (q.includes("Türkiye")) return "Türkiye";
  if (q.includes("Japan")) return "Japan";
  if (q.includes("Korea")) return "South Korea";
  if (q.includes("Europe")) return "Western Europe";
  if (q.includes("Champion")) return "Myanmar";
  return null;
}

const existing = new Set(
  db.prepare("SELECT name FROM teams").all().map((r) => String(r.name).toLowerCase().trim()),
);
const participants = JSON.parse(t.participants || "[]");

const now = new Date().toISOString();
const insertTeam = db.prepare(`
  INSERT INTO teams (
    id, name, tag, logo_url, game, region, total_kills, total_points, matches_played, wins, created_date, updated_date, created_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let created = 0;
let skipped = 0;
for (const p of participants) {
  const name = String(p.team || "").trim();
  if (!name) continue;
  if (existing.has(name.toLowerCase())) {
    skipped += 1;
    continue;
  }
  insertTeam.run(
    randomUUID(),
    name,
    TAGS[name] || name.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase() || "TBD",
    null,
    "PUBG Mobile",
    regionFor(p.qualification),
    0,
    0,
    0,
    0,
    now,
    now,
    "admin@stagecore.local",
  );
  existing.add(name.toLowerCase());
  created += 1;
}

console.log(`participants: ${participants.length}`);
console.log(`teams created: ${created}`);
console.log(`teams skipped (already present): ${skipped}`);
console.log("Done.");

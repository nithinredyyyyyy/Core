import { randomUUID } from "node:crypto";
import { db } from "../server/db.js";

const TEAMS = [
  { name: "Action Culture Tech.", tag: "ACT" },
  { name: "All Gamers", tag: "AG" },
  { name: "Four Angry Men", tag: "4AM" },
  { name: "Hao Han Gaming", tag: "HHG" },
  { name: "JD Gaming", tag: "JDG" },
  { name: "KONE ESPORT", tag: "KONE" },
  { name: "KuaiShou Gaming", tag: "KSG" },
  { name: "LGD Gaming", tag: "LGD" },
  { name: "Nova Esports", tag: "NV" },
  { name: "Regans Gaming", tag: "RSG" },
  { name: "Rogue Warriors", tag: "RW" },
  { name: "Six Two Eight", tag: "STE" },
  { name: "The Chosen", tag: "TC" },
  { name: "ThunderTalk Gaming", tag: "TT" },
  { name: "Tianba", tag: "TIAN" },
  { name: "Titan Esports Club", tag: "TEC" },
  { name: "Tong Jia Bao Esports", tag: "TJB" },
  { name: "Weibo Gaming", tag: "WBG" },
  { name: "Vision Esports", tag: "VS" },
  { name: "Crab Esports", tag: "CRAB" },
  { name: "Etk E-sports", tag: "ETK" },
  { name: "LT Gaming", tag: "LTG" }
];

const PEL_NAME = "Peacekeeper Elite League 2026 Summer";
const t = db.prepare("SELECT id FROM tournaments WHERE name = ?").get(PEL_NAME);
if (!t) {
  console.error("PEL 2026 Summer not found");
  process.exit(1);
}

const now = new Date().toISOString();
const existingTeams = new Set(
  db.prepare("SELECT name FROM teams").all().map((r) => String(r.name).toLowerCase().trim())
);

const insertTeam = db.prepare(`
  INSERT INTO teams (
    id, name, tag, game, region, total_kills, total_points, matches_played, wins, created_date, updated_date, created_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let created = 0;
const participants = [];

for (const team of TEAMS) {
  participants.push({
    team: team.name,
    qualification: "Invited"
  });

  if (existingTeams.has(team.name.toLowerCase())) {
    continue;
  }
  
  insertTeam.run(
    randomUUID(),
    team.name,
    team.tag,
    "PUBG Mobile",
    "China",
    0,
    0,
    0,
    0,
    now,
    now,
    "admin@stagecore.local"
  );
  existingTeams.add(team.name.toLowerCase());
  created += 1;
}

// Update the tournament with participants
db.prepare("UPDATE tournaments SET participants = ? WHERE id = ?").run(JSON.stringify(participants), t.id);

console.log(`Teams created: ${created}`);
console.log("Updated participants for PEL 2026 Summer.");

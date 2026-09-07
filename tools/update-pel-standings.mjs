import { randomUUID } from "node:crypto";
import { db } from "../server/db.js";

const PEL_NAME = "Peacekeeper Elite League 2026 Summer";
const t = db.prepare("SELECT id FROM tournaments WHERE name = ?").get(PEL_NAME);

if (!t) {
  console.error("PEL 2026 Summer not found");
  process.exit(1);
}

const now = new Date().toISOString();
// Check if a match already exists
const existingMatch = db.prepare("SELECT id FROM matches WHERE tournament_id = ?").get(t.id);
let matchId;
if (!existingMatch) {
  matchId = randomUUID();
  db.prepare(`
    INSERT INTO matches (id, tournament_id, stage, map, scheduled_time, status, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(matchId, t.id, "Finals", "Erangel", now, "completed", now, now);
} else {
  matchId = existingMatch.id;
}

const standings = [
  { name: "Weibo Gaming", points: 83, place: 1 },
  { name: "Regans Gaming", points: 67, place: 2 },
  { name: "LGD Gaming", points: 60, place: 3 },
  { name: "JD Gaming", points: 58, place: 4 },
  { name: "Tianba", points: 58, place: 5 },
  { name: "Four Angry Men", points: 56, place: 6 },
  { name: "Crab Esports", points: 54, place: 7 },
  { name: "Hao Han Gaming", points: 52, place: 8 },
  { name: "All Gamers", points: 49, place: 9 },
  { name: "ThunderTalk Gaming", points: 44, place: 10 },
  { name: "LT Gaming", points: 37, place: 11 },
  { name: "Six Two Eight", points: 35, place: 12 },
  { name: "The Chosen", points: 35, place: 13 },
  { name: "Tong Jia Bao Esports", points: 34, place: 14 },
  { name: "Titan Esports Club", points: 28, place: 15 },
  { name: "Nova Esports", points: 21, place: 16 }
];

const insertResult = db.prepare(`
  INSERT INTO match_results (
    id, match_id, tournament_id, team_id,
    placement, placement_points, kill_points, total_points, publication_status, stage, created_date, updated_date, matches_count
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', 'Finals', ?, ?, 1)
`);

// Delete old results for this dummy match
db.prepare("DELETE FROM match_results WHERE match_id = ?").run(matchId);

for (const s of standings) {
  const team = db.prepare("SELECT id FROM teams WHERE name = ? COLLATE NOCASE").get(s.name);
  if (!team) {
    console.warn("Team not found:", s.name);
    continue;
  }
  
  insertResult.run(
    randomUUID(),
    matchId,
    t.id,
    team.id,
    s.place,
    s.points,
    0, // placeholder
    s.points,
    now,
    now
  );
}

console.log("Updated dummy match with standings for PEL");

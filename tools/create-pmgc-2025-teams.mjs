import { db } from "../server/db.js";
import { v4 as uuidv4 } from "uuid";

const t = db.prepare("SELECT id FROM tournaments WHERE name='PUBG Mobile Global Championship 2025'").get();
const now = new Date().toISOString();

// All 40 teams
const allTeams = [
  // Gauntlet qualified teams
  "R8 Esports", "ThunderTalk Gaming", "Kara Esports", "MadBulls", "Alpha7 Esports", "ULF Esports", "D'Xavier",
  "DRX", "Wolves Esports", "Regnum Carya Esports", "Orangutan", "Virtus.pro", "Alpha Gaming", "eArena", "GS Team", "Geekay Esports",
  // Group Stage teams
  "Alter Ego Ares", "Alliance", "Team Flash", "Team Secret", "Inner Circle Esports", "ARCRED",
  "GOAT Team", "Papara SuperMassive", "Team Falcons", "Boars Gaming", "Twisted Minds", "Nuclear Zone",
  "Gen.G Esports MENA", "9z Team", "INFLUENCE RAGE", "Loops Esports", "ETSH Esports", "Burmese Ghouls",
  "Weibo Gaming", "Tianba", "Dplus", "REJECT", "True Rippers", "Vampire Esports",
];

const teamIdMap = {};
const insertTeam = db.prepare("INSERT OR IGNORE INTO teams (id, name, tag, game, region, created_date, updated_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

for (const name of allTeams) {
  const id = uuidv4();
  const tag = name.split(" ").map(w => w[0]).join("").substring(0, 5).toUpperCase();
  insertTeam.run(id, name, tag, "PUBG Mobile", "", now, now, "system");
  teamIdMap[name] = id;
}

console.log(`Inserted ${allTeams.length} teams`);

// ── Gauntlet Results ──
const gauntletResults = [
  { team: "R8 Esports", placement: 1, total: 154, wwcd: 2, pos: 49, elim: 105 },
  { team: "ThunderTalk Gaming", placement: 2, total: 147, wwcd: 3, pos: 50, elim: 97 },
  { team: "Kara Esports", placement: 3, total: 141, wwcd: 1, pos: 42, elim: 99 },
  { team: "MadBulls", placement: 4, total: 140, wwcd: 2, pos: 40, elim: 100 },
  { team: "Alpha7 Esports", placement: 5, total: 123, wwcd: 3, pos: 47, elim: 76 },
  { team: "ULF Esports", placement: 6, total: 116, wwcd: 0, pos: 41, elim: 75 },
  { team: "D'Xavier", placement: 7, total: 112, wwcd: 1, pos: 46, elim: 66 },
  { team: "DRX", placement: 8, total: 110, wwcd: 1, pos: 41, elim: 69 },
  { team: "Wolves Esports", placement: 9, total: 98, wwcd: 1, pos: 35, elim: 63 },
  { team: "Regnum Carya Esports", placement: 10, total: 97, wwcd: 2, pos: 34, elim: 63 },
  { team: "Orangutan", placement: 11, total: 96, wwcd: 0, pos: 39, elim: 57 },
  { team: "Virtus.pro", placement: 12, total: 88, wwcd: 1, pos: 29, elim: 59 },
  { team: "Alpha Gaming", placement: 13, total: 83, wwcd: 0, pos: 23, elim: 60 },
  { team: "eArena", placement: 14, total: 74, wwcd: 0, pos: 29, elim: 45 },
  { team: "GS Team", placement: 15, total: 69, wwcd: 0, pos: 16, elim: 53 },
  { team: "Geekay Esports", placement: 16, total: 49, wwcd: 1, pos: 15, elim: 34 },
];

// ── Group Stage Green Results ──
const groupGreen = [
  { team: "Alpha Gaming", placement: 1, total: 174 },
  { team: "Dplus", placement: 2, total: 149 },
  { team: "GOAT Team", placement: 3, total: 133 },
  { team: "Wolves Esports", placement: 4, total: 115 },
  { team: "Inner Circle Esports", placement: 5, total: 114 },
  { team: "Gen.G Esports MENA", placement: 6, total: 108 },
  { team: "Loops Esports", placement: 7, total: 106 },
  { team: "Alter Ego Ares", placement: 8, total: 105 },
  { team: "Team Falcons", placement: 9, total: 104 },
  { team: "Papara SuperMassive", placement: 10, total: 104 },
  { team: "9z Team", placement: 11, total: 98 },
  { team: "Tianba", placement: 12, total: 98 },
  { team: "GS Team", placement: 13, total: 98 },
  { team: "Orangutan", placement: 14, total: 91 },
  { team: "REJECT", placement: 15, total: 78 },
  { team: "Team Secret", placement: 16, total: 32 },
];

// ── Group Stage Red Results ──
const groupRed = [
  { team: "DRX", placement: 1, total: 179 },
  { team: "Regnum Carya Esports", placement: 2, total: 161 },
  { team: "eArena", placement: 3, total: 137 },
  { team: "Team Flash", placement: 4, total: 136 },
  { team: "Weibo Gaming", placement: 5, total: 136 },
  { team: "INFLUENCE RAGE", placement: 6, total: 128 },
  { team: "ARCRED", placement: 7, total: 127 },
  { team: "Burmese Ghouls", placement: 8, total: 108 },
  { team: "Alliance", placement: 9, total: 101 },
  { team: "Geekay Esports", placement: 10, total: 93 },
  { team: "Boars Gaming", placement: 11, total: 84 },
  { team: "Virtus.pro", placement: 12, total: 78 },
  { team: "Twisted Minds", placement: 13, total: 75 },
  { team: "True Rippers", placement: 14, total: 62 },
  { team: "ETSH Esports", placement: 15, total: 39 },
  { team: "Nuclear Zone", placement: 16, total: 39 },
];

// ── Last Chance Results ──
const lastChance = [
  { team: "Team Flash", placement: 1, total: 99, wwcd: 1, pos: 30, elim: 69 },
  { team: "Alter Ego Ares", placement: 2, total: 93, wwcd: 2, pos: 30, elim: 63 },
  { team: "Weibo Gaming", placement: 3, total: 93, wwcd: 0, pos: 29, elim: 64 },
  { team: "INFLUENCE RAGE", placement: 4, total: 91, wwcd: 2, pos: 43, elim: 48 },
  { team: "Inner Circle Esports", placement: 5, total: 83, wwcd: 1, pos: 22, elim: 61 },
  { team: "9z Team", placement: 6, total: 82, wwcd: 2, pos: 40, elim: 42 },
  { team: "Loops Esports", placement: 7, total: 78, wwcd: 0, pos: 22, elim: 56 },
  { team: "Alliance", placement: 8, total: 77, wwcd: 0, pos: 32, elim: 45 },
  { team: "ARCRED", placement: 9, total: 75, wwcd: 1, pos: 22, elim: 53 },
  { team: "Wolves Esports", placement: 10, total: 68, wwcd: 1, pos: 23, elim: 45 },
  { team: "Geekay Esports", placement: 11, total: 66, wwcd: 1, pos: 21, elim: 45 },
  { team: "Team Falcons", placement: 12, total: 62, wwcd: 0, pos: 16, elim: 46 },
  { team: "Boars Gaming", placement: 13, total: 59, wwcd: 0, pos: 15, elim: 44 },
  { team: "Burmese Ghouls", placement: 14, total: 57, wwcd: 1, pos: 22, elim: 35 },
  { team: "Gen.G Esports MENA", placement: 15, total: 40, wwcd: 0, pos: 12, elim: 28 },
  { team: "Papara SuperMassive", placement: 16, total: 32, wwcd: 0, pos: 5, elim: 27 },
];

// ── Grand Finals Results ──
const grandFinals = [
  { team: "Alpha7 Esports", placement: 1, total: 142, wwcd: 2, pos: 66, elim: 76 },
  { team: "ULF Esports", placement: 2, total: 133, wwcd: 4, pos: 60, elim: 73 },
  { team: "Alpha Gaming", placement: 3, total: 130, wwcd: 2, pos: 30, elim: 100 },
  { team: "ThunderTalk Gaming", placement: 4, total: 124, wwcd: 1, pos: 41, elim: 83 },
  { team: "Dplus", placement: 5, total: 115, wwcd: 3, pos: 40, elim: 75 },
  { team: "DRX", placement: 6, total: 115, wwcd: 2, pos: 45, elim: 70 },
  { team: "D'Xavier", placement: 7, total: 112, wwcd: 2, pos: 57, elim: 55 },
  { team: "Alter Ego Ares", placement: 8, total: 101, wwcd: 0, pos: 33, elim: 68 },
  { team: "GOAT Team", placement: 9, total: 101, wwcd: 0, pos: 28, elim: 73 },
  { team: "Regnum Carya Esports", placement: 10, total: 99, wwcd: 0, pos: 22, elim: 77 },
  { team: "MadBulls", placement: 11, total: 98, wwcd: 1, pos: 31, elim: 67 },
  { team: "eArena", placement: 12, total: 95, wwcd: 0, pos: 34, elim: 61 },
  { team: "R8 Esports", placement: 13, total: 95, wwcd: 0, pos: 19, elim: 76 },
  { team: "Kara Esports", placement: 14, total: 90, wwcd: 1, pos: 25, elim: 65 },
  { team: "Vampire Esports", placement: 15, total: 80, wwcd: 0, pos: 24, elim: 56 },
  { team: "Team Flash", placement: 16, total: 76, wwcd: 0, pos: 21, elim: 55 },
];

// Insert matches and results for a stage
function insertStageResults(stageName, mapName, results, numMatches) {
  const insertMatch = db.prepare("INSERT INTO matches (id, tournament_id, stage, map, scheduled_time, status, created_date, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const insertResult = db.prepare("INSERT INTO match_results (id, match_id, tournament_id, team_id, placement, kill_points, placement_points, total_points, stage, created_date, updated_date, created_by, matches_count, wins_count, publication_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'system', 1, ?, 'published')");

  // Create a single aggregate match for this stage
  const matchId = uuidv4();
  insertMatch.run(matchId, t.id, stageName, mapName, now, "completed", now, now);

  for (const r of results) {
    const tId = teamIdMap[r.team];
    if (!tId) { console.log("Missing team:", r.team); continue; }
    const pPts = r.pos || 0;
    const ePts = r.elim || 0;
    const total = r.total || (pPts + ePts);
    const isWin = r.wwcd ? 1 : 0;
    insertResult.run(uuidv4(), matchId, t.id, tId, r.placement, ePts, pPts, total, stageName, now, now, isWin);
  }
}

insertStageResults("The Gauntlet", "Erangel", gauntletResults, 18);
insertStageResults("Group Stage - Green", "Erangel", groupGreen, 18);
insertStageResults("Group Stage - Red", "Erangel", groupRed, 18);
insertStageResults("Last Chance", "Erangel", lastChance, 12);
insertStageResults("Grand Finals", "Erangel", grandFinals, 18);

console.log("All stage results inserted.");
console.log("PMGC 2025 setup complete!");

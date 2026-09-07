import { db } from "../server/db.js";
import { v4 as uuidv4 } from "uuid";

const t = db.prepare("SELECT id FROM tournaments WHERE name LIKE '%Peacekeeper Elite League%'").get();

// Game 17 results
const game17 = [
  { team: "The Chosen", placement: 1, kills: 6 },
  { team: "All Gamers", placement: 2, kills: 6 },
  { team: "Regans Gaming", placement: 3, kills: 8 },
  { team: "Hao Han Gaming", placement: 3, kills: 5 },
  { team: "Nova Esports", placement: 5, kills: 10 },
  { team: "LGD Gaming", placement: 7, kills: 1 },
  { team: "ThunderTalk Gaming", placement: 8, kills: 6 },
  { team: "Titan Esports Club", placement: 8, kills: 2 },
  { team: "LT Gaming", placement: 9, kills: 1 },
  { team: "JD Gaming", placement: 10, kills: 0 },
  { team: "Six Two Eight", placement: 10, kills: 6 },
  { team: "Tong Jia Bao Esports", placement: 12, kills: 2 },
  { team: "Tianba", placement: 13, kills: 0 },
  { team: "Four Angry Men", placement: 14, kills: 1 },
  { team: "Crab Esports", placement: 15, kills: 1 },
  { team: "Weibo Gaming", placement: 16, kills: 1 },
];

const getPoints = (p) => {
  if (p === 1) return 10;
  if (p === 2) return 6;
  if (p === 3) return 5;
  if (p === 4) return 4;
  if (p === 5) return 3;
  if (p === 6) return 2;
  if (p === 7 || p === 8) return 1;
  return 0;
};

const teams = db.prepare("SELECT id, name FROM teams").all();
const teamIdMap = {};
for (const tm of teams) { teamIdMap[tm.name] = tm.id; }

// Insert Game 17 match
const matchId = uuidv4();
db.prepare("INSERT INTO matches (id, tournament_id, stage, map, scheduled_time, status, created_date, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
  .run(matchId, t.id, "Grand Finals", "Miramar", new Date().toISOString(), "completed", new Date().toISOString(), new Date().toISOString());

// Insert Game 17 results
const insertResult = db.prepare("INSERT INTO match_results (id, match_id, tournament_id, team_id, placement, kill_points, placement_points, total_points, stage, created_date, updated_date, created_by, matches_count, wins_count, publication_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'system', 1, ?, 'published')");

for (const r of game17) {
  const tId = teamIdMap[r.team];
  if (!tId) { console.log("Missing team:", r.team); continue; }
  const pPts = getPoints(r.placement);
  const totalPts = pPts + r.kills;
  const isWin = r.placement === 1 ? 1 : 0;
  insertResult.run(uuidv4(), matchId, t.id, tId, r.placement, r.kills, pPts, totalPts, "Grand Finals", new Date().toISOString(), new Date().toISOString(), isWin);
}

// Update stages JSON
let stages = JSON.parse(db.prepare("SELECT stages FROM tournaments WHERE id = ?").get(t.id).stages);
const finalsStage = stages.find(s => s.name === "Grand Finals");
finalsStage.summary = "Aug 28–30, 2026 at Qingdao Citizen Fitness Center Gymnasium. 16 teams (6 direct + 10 via Playoffs) compete over 3 matchdays. Smash Rule applied. Through Game 17 of 19.";

// Rebuild standings from DB
const rows = db.prepare("SELECT t.name as team, SUM(mr.total_points) as points, SUM(mr.placement_points) as placePts, SUM(mr.kill_points) as elimPts, SUM(mr.wins_count) as wwcd, SUM(mr.matches_count) as matches FROM match_results mr JOIN teams t ON mr.team_id = t.id WHERE mr.tournament_id = ? AND mr.stage = 'Grand Finals' GROUP BY t.id ORDER BY points DESC, wwcd DESC").all(t.id);

finalsStage.standings = rows.map((r, i) => ({
  placement: i + 1,
  team: r.team,
  points: r.points,
  matches: r.matches,
  wwcd: r.wwcd,
  pos: r.placePts,
  elimins: r.elimPts,
}));

db.prepare("UPDATE tournaments SET stages = ? WHERE id = ?").run(JSON.stringify(stages), t.id);
console.log("Game 17 added. Updated standings through Game 17.");

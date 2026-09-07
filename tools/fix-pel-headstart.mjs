import { db } from "../server/db.js";

const t = db.prepare("SELECT id FROM tournaments WHERE name LIKE '%Peacekeeper Elite League%'").get();

const headstart = {
  "Weibo Gaming": 10, "ThunderTalk Gaming": 8, "Tianba": 7, "All Gamers": 6, "Hao Han Gaming": 5,
  "LGD Gaming": 4, "Regans Gaming": 3, "LT Gaming": 3, "Four Angry Men": 2, "Tong Jia Bao Esports": 2,
  "The Chosen": 1, "Nova Esports": 1, "JD Gaming": 0, "Crab Esports": 0, "Titan Esports Club": 0, "Six Two Eight": 0
};

const getPoints = (p) => {
  if (p === 1) return 10; if (p === 2) return 6; if (p === 3) return 5; if (p === 4) return 4;
  if (p === 5) return 3; if (p === 6) return 2; if (p === 7 || p === 8) return 1; return 0;
};

// Get all Grand Finals matches ordered by time
const matches = db.prepare("SELECT id, scheduled_time FROM matches WHERE tournament_id=? AND stage='Grand Finals' ORDER BY scheduled_time").all(t.id);
console.log(`Found ${matches.length} matches`);

// For each match, fix total_points = placement_points + kill_points (no headstart)
const fixStmt = db.prepare("UPDATE match_results SET total_points = placement_points + kill_points WHERE id=?");
let fixed = 0;
for (const m of matches) {
  const results = db.prepare("SELECT id, placement_points, kill_points, total_points FROM match_results WHERE match_id=?").all(m.id);
  for (const r of results) {
    const correct = r.placement_points + r.kill_points;
    if (r.total_points !== correct) {
      fixStmt.run(r.id);
      fixed++;
    }
  }
}
console.log(`Fixed ${fixed} result records`);

// Rebuild standings with headstart applied at standings level
let stages = JSON.parse(db.prepare("SELECT stages FROM tournaments WHERE id = ?").get(t.id).stages);
const finalsStage = stages.find(s => s.name === "Grand Finals");
finalsStage.summary = "Aug 28–30, 2026 at Qingdao Citizen Fitness Center Gymnasium. 16 teams compete over 3 matchdays. Smash Rule applied. All 19 games completed.";

const rows = db.prepare("SELECT t.name as team, SUM(mr.total_points) as rawPts, SUM(mr.kill_points) as elimPts, SUM(mr.placement_points) as placePts, SUM(mr.wins_count) as wwcd, SUM(mr.matches_count) as matches FROM match_results mr JOIN teams t ON mr.team_id = t.id WHERE mr.tournament_id = ? AND mr.stage = 'Grand Finals' GROUP BY t.id").all(t.id);

const standings = rows.map(r => ({
  placement: 0, team: r.team,
  points: r.rawPts + (headstart[r.team] || 0),
  matches: r.matches, wwcd: r.wwcd, pos: r.placePts, elimins: r.elimPts,
}));
standings.sort((a, b) => b.points - a.points || b.wwcd - a.wwcd);
standings.forEach((s, i) => s.placement = i + 1);

finalsStage.standings = standings;
db.prepare("UPDATE tournaments SET stages = ? WHERE id = ?").run(JSON.stringify(stages), t.id);

console.log("\nFinal standings:");
standings.forEach((r, i) => console.log(`${i+1}. ${r.team}: ${r.points}`));

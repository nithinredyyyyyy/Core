import { db } from "../server/db.js";

const t = db.prepare("SELECT id FROM tournaments WHERE name LIKE '%Peacekeeper Elite League%'").get();

let stages = JSON.parse(db.prepare("SELECT stages FROM tournaments WHERE id = ?").get(t.id).stages);
const finalsStage = stages.find(s => s.name === "Grand Finals");
finalsStage.summary = "Aug 28–30, 2026 at Qingdao Citizen Fitness Center Gymnasium. 16 teams compete over 3 matchdays. Smash Rule applied. All 19 games completed.";

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
console.log("Final standings:");
rows.forEach((r, i) => console.log(`${i+1}. ${r.team}: ${r.points}`));

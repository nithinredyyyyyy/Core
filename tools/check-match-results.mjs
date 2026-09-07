import { db } from "../server/db.js";

const rows = db.prepare(`
  SELECT t.name, mr.placement_points, mr.kill_points, mr.total_points, mr.matches_count, mr.wins_count 
  FROM match_results mr 
  JOIN matches m ON mr.match_id = m.id 
  JOIN teams t ON mr.team_id = t.id
  JOIN tournaments tour ON m.tournament_id = tour.id 
  WHERE tour.name = 'Peacekeeper Elite League 2026 Summer'
`).all();

console.log(rows);

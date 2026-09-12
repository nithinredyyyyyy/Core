import { db } from './server/db.js';

// Check for NULL team_ids
const nulls = db.prepare("SELECT count(*) as c FROM match_results WHERE team_id IS NULL").get();
console.log("match_results with NULL team_id:", nulls.c);

const emptyTeams = db.prepare("SELECT count(*) as c FROM teams WHERE name IS NULL OR name = ''").get();
console.log("teams with NULL/empty name:", emptyTeams.c);

// Show which tournaments are affected
const tournaments = ["PUBG Mobile World Cup 2024", "PUBG Mobile World Cup 2025", "Battlegrounds Mobile India Series 2023", "PUBG Mobile Global Championship 2025"];
for (const name of tournaments) {
  const t = db.prepare("SELECT id, name FROM tournaments WHERE name = ?").get(name);
  if (!t) { console.log(`\n${name}: NOT FOUND`); continue; }
  console.log(`\n${t.name} (${t.id}):`);
  
  const mr = db.prepare("SELECT count(*) as c FROM match_results WHERE tournament_id = ?").get(t.id);
  const ss = db.prepare("SELECT count(*) as c FROM stage_standings WHERE tournament_id = ?").get(t.id);
  console.log(`  match_results: ${mr.c}, stage_standings: ${ss.c}`);
  
  // Check stages
  const stages = db.prepare("SELECT name, status FROM tournament_stages WHERE tournament_id = ? ORDER BY stage_order").all(t.id);
  console.log(`  stages: ${stages.map(s => s.name).join(', ')}`);
  
  // Check GF standings in stages JSON
  const raw = db.prepare("SELECT stages FROM tournaments WHERE id = ?").get(t.id);
  if (raw && raw.stages) {
    try {
      const stageData = JSON.parse(raw.stages);
      const gf = stageData.find(s => s.name === "Grand Finals");
      if (gf && gf.standings) {
        console.log(`  Grand Finals standings in JSON: ${gf.standings.length} entries`);
        console.log(`  Top 3: ${gf.standings.slice(0, 3).map(s => s.team || s.teamName || 'unknown').join(', ')}`);
      } else {
        console.log(`  Grand Finals: no standings in JSON`);
      }
    } catch (e) {
      console.log(`  stages JSON parse error`);
    }
  }
}

db.close();

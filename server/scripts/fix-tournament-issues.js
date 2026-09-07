import { db } from '../../server/db.js';
import { backfillNormalizedData } from '../../server/db/normalize.js';

// Team name corrections: key = what's in standings JSON, value = actual DB name
const TEAM_NAME_FIXES = {
  // PMGC 2025
  'Wolves': 'Wolves Esports',
  'Regnum Carya': 'Regnum Carya Esports',
  'Geekay': 'Geekay Esports',
  'Gen.G MENA': 'Gen.G Esports MENA',
  'Alliance MY': 'Alliance',
  // PMWC 2024 survival stage wildcard
  'Bushido Wildcats Next Ruya': 'Bushido Wildcats Next Ruya',  // exists, just needs group
  // PMWC 2025 - normalize any discrepancies
};

function fixStandings(standings) {
  return standings.map(entry => {
    const fixed = { ...entry };
    if (TEAM_NAME_FIXES[fixed.team] && TEAM_NAME_FIXES[fixed.team] !== fixed.team) {
      fixed.team = TEAM_NAME_FIXES[fixed.team];
    }
    return fixed;
  });
}

// Fix PMGC 2025 - correct all team names in all stages
const pmgc = db.prepare('SELECT id, stages FROM tournaments WHERE name = ?').get('PUBG Mobile Global Championship 2025');
const stagesPmgc = JSON.parse(pmgc.stages);
for (const stage of stagesPmgc) {
  if (Array.isArray(stage.standings)) {
    stage.standings = fixStandings(stage.standings);
  }
}
db.prepare('UPDATE tournaments SET stages = ? WHERE id = ?').run(JSON.stringify(stagesPmgc), pmgc.id);
console.log('Fixed PMGC 2025 team names');

// Fix PMWC 2024 - rename Main Tournament -> Grand Finals
// Also assign Bushido Wildcats Next Ruya to group (it's a wildcard, appeared in Survival, not Group Stage)
// The undefined group entry needs to be removed from Group Stage standings - Bushido was NOT in Group Stage
const t24 = db.prepare('SELECT id, stages FROM tournaments WHERE name = ?').get('PUBG Mobile World Cup 2024');
const stages24 = JSON.parse(t24.stages);
for (const stage of stages24) {
  if (stage.name === 'Main Tournament') {
    stage.name = 'Grand Finals';
  }
  if (stage.name === 'Group Stage' && Array.isArray(stage.standings)) {
    // Bushido Wildcats Next Ruya was a PMSL wildcard in Survival Stage, NOT in Group Stage
    // Remove it from Group Stage standings
    stage.standings = stage.standings.filter(s => s.team !== 'Bushido Wildcats Next Ruya');
    console.log('Group Stage after fix:', stage.standings.length, 'teams');
  }
}
db.prepare('UPDATE tournaments SET stages = ? WHERE id = ?').run(JSON.stringify(stages24), t24.id);
console.log('Fixed PMWC 2024 (renamed Main Tournament -> Grand Finals, removed Bushido from Group Stage)');

// Fix PMWC 2025 Group Stage - check if overall is broken because of group name format
const t25 = db.prepare('SELECT id, stages FROM tournaments WHERE name = ?').get('PUBG Mobile World Cup 2025');
const stages25 = JSON.parse(t25.stages);
const gs25 = stages25.find(s => s.name === 'Group Stage');
console.log('\nPMWC 2025 Group Stage groups:', [...new Set(gs25.standings.map(s => s.group))]);
// Looks correct already - no fix needed for the JSON, the overall tab issue is likely UI
db.prepare('UPDATE tournaments SET stages = ? WHERE id = ?').run(JSON.stringify(stages25), t25.id);

// Run backfill
backfillNormalizedData();
console.log('\nBackfill done!');

// Verify
const pmgcId = pmgc.id;
const t24Id = t24.id;
const t25Id = t25.id;

const pmgcRows = db.prepare('SELECT COUNT(*) as c FROM stage_standings WHERE tournament_id = ?').get(pmgcId).c;
const t24Rows = db.prepare('SELECT COUNT(*) as c FROM stage_standings WHERE tournament_id = ?').get(t24Id).c;
const t25Rows = db.prepare('SELECT COUNT(*) as c FROM stage_standings WHERE tournament_id = ?').get(t25Id).c;

console.log('PMGC 2025 stage_standings rows:', pmgcRows);
console.log('PMWC 2024 stage_standings rows:', t24Rows);
console.log('PMWC 2025 stage_standings rows:', t25Rows);

// Check stage names for PMWC 2024
const t24Stages = db.prepare('SELECT name FROM tournament_stages WHERE tournament_id = ? ORDER BY stage_order').all(t24Id);
console.log('PMWC 2024 stages:', t24Stages.map(s => s.name));

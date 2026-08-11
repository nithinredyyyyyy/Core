process.env.CORE_BACKFILL_NORMALIZED_ON_STARTUP = "1";
const { db } = await import("file:///C:/Users/surak/core/server/db.js");

const target = process.argv[2] || "PUBG Mobile World Cup 2026";
const row = db.prepare("SELECT id FROM tournaments WHERE name = ?").get(target);
if (!row) {
  console.error(`tournament "${target}" not found`);
  process.exit(1);
}
const PMWC_ID = row.id;

const tableCounts = {
  tournament_participants: `SELECT COUNT(*) c FROM tournament_participants WHERE tournament_id = ?`,
  tournament_stages: `SELECT COUNT(*) c FROM tournament_stages WHERE tournament_id = ?`,
  tournament_stage_groups: `SELECT COUNT(*) c FROM tournament_stage_groups g JOIN tournament_stages s ON s.id = g.stage_id WHERE s.tournament_id = ?`,
  tournament_participant_players: `SELECT COUNT(*) c FROM tournament_participant_players pp JOIN tournament_participants p ON p.id = pp.participant_id WHERE p.tournament_id = ?`,
  tournament_participant_stage_entries: `SELECT COUNT(*) c FROM tournament_participant_stage_entries pe JOIN tournament_participants p ON p.id = pe.participant_id WHERE p.tournament_id = ?`,
};

console.log(`PMWC relational counts after backfill (id=${PMWC_ID}):`);
for (const [table, sql] of Object.entries(tableCounts)) {
  const row = db.prepare(sql).get(PMWC_ID);
  console.log(`  ${table}: ${row.c}`);
}

const teams = db.prepare("SELECT COUNT(*) c FROM teams").get();
console.log("teams total:", teams.c);

const groupA = db
  .prepare(
    `SELECT DISTINCT t.name FROM tournament_participant_stage_entries pe
     JOIN tournament_participants p ON p.id = pe.participant_id
     JOIN tournament_stage_groups g ON g.id = pe.group_id
     JOIN teams t ON t.id = p.team_id
     JOIN tournament_stages s ON s.id = pe.stage_id
     WHERE s.tournament_id = ? AND g.group_name = 'Group A'
     ORDER BY t.name`,
  )
  .all(PMWC_ID);
console.log("Group A relational teams:", groupA.map((r) => r.name).join(", "));

const { db } = await import("file:///C:/Users/surak/core/server/db.js");

const junk = db
  .prepare("SELECT COUNT(*) c FROM teams WHERE created_by = 'system:participant-sync' AND name LIKE 'Survival #%'")
  .get().c;
console.log("survival junk teams:", junk);
console.log("teams total:", db.prepare("SELECT COUNT(*) c FROM teams").get().c);

const pmwc = db.prepare("SELECT id FROM tournaments WHERE name = 'PUBG Mobile World Cup 2026'").get();
for (const group of ["Group A", "Group B"]) {
  const teams = db
    .prepare(
      `SELECT DISTINCT t.name FROM tournament_participant_stage_entries pe
       JOIN tournament_participants p ON p.id = pe.participant_id
       JOIN tournament_stage_groups g ON g.id = pe.group_id
       JOIN teams t ON t.id = p.team_id
       JOIN tournament_stages s ON s.id = pe.stage_id
       WHERE s.tournament_id = ? AND g.group_name = ? ORDER BY t.name`,
    )
    .all(pmwc.id, group)
    .map((r) => r.name);
  console.log(`${group} (${teams.length}):`, teams.join(", "));
}

const stageNames = db
  .prepare("SELECT name FROM tournament_stages WHERE tournament_id = ? ORDER BY stage_order")
  .all(pmwc.id)
  .map((r) => r.name);
console.log("PMWC stages:", stageNames.join(", "));

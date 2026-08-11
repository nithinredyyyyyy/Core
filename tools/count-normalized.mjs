import { db } from "../server/db.js";

for (const t of [
  "tournament_stages",
  "tournament_stage_groups",
  "tournament_participants",
  "tournament_participant_stage_entries",
  "stage_standings",
  "stage_match_breakdown",
  "team_aliases",
]) {
  const c = db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c;
  console.log(t, c);
}

process.exit(0);

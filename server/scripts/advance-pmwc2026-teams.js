import { db } from "../db.js";
import { randomUUID } from "node:crypto";

const TOURNAMENT_NAME = "PUBG Mobile World Cup 2026";
const tournament = db.prepare("SELECT id FROM tournaments WHERE name = ?").get(TOURNAMENT_NAME);
if (!tournament) { console.log("Tournament not found"); process.exit(1); }
const tournamentId = tournament.id;

const now = new Date().toISOString();

// Get team IDs
const allTeams = db.prepare("SELECT id, name FROM teams").all();
const teamIdByName = Object.fromEntries(allTeams.map((t) => [t.name, t.id]));

// Get stage IDs
const stages = db.prepare("SELECT id, name FROM tournament_stages WHERE tournament_id = ?").all(tournamentId);
const stageIdByName = Object.fromEntries(stages.map((s) => [s.name, s.id]));

// Get group IDs
const stageGroups = db.prepare("SELECT id, group_name FROM tournament_stage_groups WHERE stage_id = ?").all(stageIdByName["Group Stage"]);
const groupIdByName = Object.fromEntries(stageGroups.map((g) => [g.group_name, g.id]));

// === REAL GROUP A STANDINGS ===
const groupAStandings = [
  { placement: 1, team: "4thrives Esports", matches: 12, wwcd: 0, place_points: 27, elimins: 80, points: 107, outcome: "Advances to Grand Finals" },
  { placement: 2, team: "Orangutan", matches: 12, wwcd: 2, place_points: 41, elimins: 50, points: 91, outcome: "Advances to Grand Finals" },
  { placement: 3, team: "Aurora Gaming", matches: 12, wwcd: 1, place_points: 30, elimins: 60, points: 90, outcome: "Advances to Grand Finals" },
  { placement: 4, team: "Team Flash", matches: 12, wwcd: 1, place_points: 31, elimins: 58, points: 89, outcome: "Advances to Grand Finals" },
  { placement: 5, team: "Nigma Galaxy", matches: 12, wwcd: 0, place_points: 30, elimins: 58, points: 88, outcome: "Advances to Grand Finals" },
  { placement: 6, team: "ULF Esports", matches: 12, wwcd: 1, place_points: 35, elimins: 48, points: 83, outcome: "Advances to Survival Stage" },
  { placement: 7, team: "AG.AL International", matches: 12, wwcd: 1, place_points: 26, elimins: 53, points: 79, outcome: "Advances to Survival Stage" },
  { placement: 8, team: "GOAT Team", matches: 12, wwcd: 2, place_points: 24, elimins: 49, points: 73, outcome: "Advances to Survival Stage" },
  { placement: 9, team: "FURIA Esports", matches: 12, wwcd: 1, place_points: 26, elimins: 47, points: 73, outcome: "Advances to Survival Stage" },
  { placement: 10, team: "AlUla Club Esports", matches: 12, wwcd: 1, place_points: 21, elimins: 51, points: 72, outcome: "Advances to Survival Stage" },
  { placement: 11, team: "Kiwoom DRX", matches: 12, wwcd: 0, place_points: 20, elimins: 50, points: 70, outcome: "Advances to Survival Stage" },
  { placement: 12, team: "RRQ RYU", matches: 12, wwcd: 1, place_points: 19, elimins: 43, points: 62, outcome: "Advances to Survival Stage" },
  { placement: 13, team: "Geekay Esports", matches: 12, wwcd: 1, place_points: 25, elimins: 32, points: 57, outcome: "Advances to Survival Stage" },
  { placement: 14, team: "XForce Rejects", matches: 12, wwcd: 0, place_points: 12, elimins: 34, points: 46, outcome: "Eliminated" },
  { placement: 15, team: "ThunderTalk Gaming", matches: 12, wwcd: 0, place_points: 16, elimins: 18, points: 34, outcome: "Eliminated" },
  { placement: 16, team: "Gaming Stars Esports", matches: 12, wwcd: 0, place_points: 1, elimins: 28, points: 29, outcome: "Eliminated" },
];

// === REAL GROUP B STANDINGS ===
const groupBStandings = [
  { placement: 1, team: "Bigetron by Vitality", matches: 12, wwcd: 2, place_points: 45, elimins: 103, points: 148, outcome: "Advances to Grand Finals" },
  { placement: 2, team: "IDA Esports", matches: 12, wwcd: 3, place_points: 55, elimins: 53, points: 108, outcome: "Advances to Grand Finals" },
  { placement: 3, team: "GodLike Esports", matches: 12, wwcd: 1, place_points: 32, elimins: 73, points: 105, outcome: "Advances to Grand Finals" },
  { placement: 4, team: "Horaa Esports", matches: 12, wwcd: 1, place_points: 37, elimins: 61, points: 98, outcome: "Advances to Grand Finals" },
  { placement: 5, team: "S2G Esports", matches: 12, wwcd: 0, place_points: 30, elimins: 67, points: 97, outcome: "Advances to Grand Finals" },
  { placement: 6, team: "eArena", matches: 12, wwcd: 1, place_points: 31, elimins: 64, points: 95, outcome: "Advances to Survival Stage" },
  { placement: 7, team: "Nongshim RedForce", matches: 12, wwcd: 2, place_points: 37, elimins: 51, points: 88, outcome: "Advances to Survival Stage" },
  { placement: 8, team: "Alpha7 Esports", matches: 12, wwcd: 1, place_points: 19, elimins: 45, points: 64, outcome: "Advances to Survival Stage" },
  { placement: 9, team: "Yangon Galacticos", matches: 12, wwcd: 0, place_points: 27, elimins: 34, points: 61, outcome: "Advances to Survival Stage" },
  { placement: 10, team: "721 Esports", matches: 12, wwcd: 0, place_points: 12, elimins: 48, points: 60, outcome: "Advances to Survival Stage" },
  { placement: 11, team: "Tianba", matches: 12, wwcd: 1, place_points: 19, elimins: 30, points: 49, outcome: "Advances to Survival Stage" },
  { placement: 12, team: "Wolves Esports", matches: 12, wwcd: 0, place_points: 13, elimins: 36, points: 49, outcome: "Advances to Survival Stage" },
  { placement: 13, team: "DOPENESS", matches: 12, wwcd: 0, place_points: 17, elimins: 28, points: 45, outcome: "Advances to Survival Stage" },
  { placement: 14, team: "ETSH Esports", matches: 12, wwcd: 0, place_points: 5, elimins: 31, points: 36, outcome: "Eliminated" },
  { placement: 15, team: "TT Project", matches: 12, wwcd: 0, place_points: 1, elimins: 35, points: 36, outcome: "Eliminated" },
  { placement: 16, team: "Hustler Crew", matches: 12, wwcd: 0, place_points: 4, elimins: 21, points: 25, outcome: "Eliminated" },
];

function makeStanding(s) {
  return {
    placement: s.placement,
    rank: s.placement,
    team: s.team,
    fullTeam: s.team,
    matches: s.matches,
    wwcd: String(s.wwcd),
    pos: String(s.place_points),
    place: String(s.place_points),
    elimins: String(s.elimins),
    elims: String(s.elimins),
    points: s.points,
    pts: s.points,
    outcome: s.outcome,
    progression_status: s.outcome,
    grp: s.placement <= 16 ? "A" : "B",
  };
}

const groupAWithGroup = groupAStandings.map(s => ({ ...makeStanding(s), grp: "A" }));
const groupBWithGroup = groupBStandings.map(s => ({ ...makeStanding(s), grp: "B" }));
const allGroupStageStandings = [...groupAWithGroup, ...groupBWithGroup];

// Read current tournament JSON
const tournamentRow = db.prepare("SELECT stages FROM tournaments WHERE id = ?").get(tournamentId);
const jsonStages = JSON.parse(tournamentRow.stages);

// Update Group Stage standings
const updatedStages = jsonStages.map((stage) => {
  if (stage.name === "Group Stage") {
    return { ...stage, status: "completed", standings: allGroupStageStandings };
  }
  return stage;
});

// Classify advancement
const gfTeams = [...groupAStandings.slice(0, 5), ...groupBStandings.slice(0, 5)];
const ssTeams = [...groupAStandings.slice(5, 13), ...groupBStandings.slice(5, 13)];
const elimTeams = [...groupAStandings.slice(13), ...groupBStandings.slice(13)];

const tx = db.transaction(() => {
  // 1. Update JSON stages
  db.prepare("UPDATE tournaments SET stages = ?, updated_date = ? WHERE id = ?")
    .run(JSON.stringify(updatedStages), now, tournamentId);
  console.log("Updated JSON stages with real Group Stage standings");

  // 2. Clear ALL old stage entries for this tournament
  db.prepare(`
    DELETE FROM tournament_participant_stage_entries 
    WHERE participant_id IN (
      SELECT tp.id FROM tournament_participants tp WHERE tp.tournament_id = ?
    )
  `).run(tournamentId);
  console.log("Cleared old stage entries");

  // 3. Get participant IDs
  const participants = db.prepare("SELECT tp.id, tm.name FROM tournament_participants tp JOIN teams tm ON tm.id = tp.team_id WHERE tp.tournament_id = ?").all(tournamentId);
  const participantIdByTeam = Object.fromEntries(participants.map((p) => [p.name, p.id]));

  // 4. Helper to insert a stage entry
  const insertEntry = db.prepare(`
    INSERT INTO tournament_participant_stage_entries
    (id, participant_id, stage_id, group_id, phase_label, placement, qualified, eliminated, notes, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 5. Recreate Group Stage entries with real placements
  let gsA = 1;
  for (const s of groupAStandings) {
    const pid = participantIdByTeam[s.team];
    if (!pid) { console.log("WARN: no participant for", s.team); continue; }
    insertEntry.run(
      randomUUID(), pid, stageIdByName["Group Stage"], groupIdByName["Group Stage - Group A"],
      "Group Stage - Group A", s.placement,
      s.placement <= 13 ? 1 : 0,
      s.placement >= 14 ? 1 : 0,
      `Pts: ${s.points}, WWCD: ${s.wwcd}, Elims: ${s.elimins}`,
      now, now
    );
    gsA++;
  }

  let gsB = 1;
  for (const s of groupBStandings) {
    const pid = participantIdByTeam[s.team];
    if (!pid) { console.log("WARN: no participant for", s.team); continue; }
    insertEntry.run(
      randomUUID(), pid, stageIdByName["Group Stage"], groupIdByName["Group Stage - Group B"],
      "Group Stage - Group B", s.placement,
      s.placement <= 13 ? 1 : 0,
      s.placement >= 14 ? 1 : 0,
      `Pts: ${s.points}, WWCD: ${s.wwcd}, Elims: ${s.elimins}`,
      now, now
    );
    gsB++;
  }
  console.log("Recreated Group Stage entries with real placements");

  // 6. Create Grand Finals entries (top 5 from each group = 10 teams)
  gfTeams.sort((a, b) => b.points - a.points);
  let gfPlacement = 1;
  for (const s of gfTeams) {
    const pid = participantIdByTeam[s.team];
    if (!pid) continue;
    insertEntry.run(
      randomUUID(), pid, stageIdByName["Grand Finals"], null,
      "Grand Finals", gfPlacement, 0, 0,
      `Advanced from Group Stage (${s.placement <= 5 ? "Group A" : "Group B"} #${s.placement <= 5 ? s.placement : s.placement}), Pts: ${s.points}`,
      now, now
    );
    gfPlacement++;
  }
  console.log("Created Grand Finals entries:", gfTeams.length, "teams");

  // 7. Create Survival Stage entries (6th-13th from each group = 16 teams)
  ssTeams.sort((a, b) => b.points - a.points);
  let ssPlacement = 1;
  for (const s of ssTeams) {
    const pid = participantIdByTeam[s.team];
    if (!pid) continue;
    insertEntry.run(
      randomUUID(), pid, stageIdByName["Survival Stage"], null,
      "Survival Stage", ssPlacement, 0, 0,
      `Advanced from Group Stage (${s.placement <= 16 ? "Group A" : "Group B"} #${s.placement}), Pts: ${s.points}`,
      now, now
    );
    ssPlacement++;
  }
  console.log("Created Survival Stage entries:", ssTeams.length, "teams");

  // 8. Update participant final_rank based on overall points
  const allTeamsRanked = [...groupAStandings, ...groupBStandings].sort((a, b) => b.points - a.points);
  let overallRank = 1;
  for (const s of allTeamsRanked) {
    const pid = participantIdByTeam[s.team];
    if (!pid) continue;
    db.prepare("UPDATE tournament_participants SET final_rank = ?, updated_date = ? WHERE id = ?")
      .run(overallRank, now, pid);
    overallRank++;
  }
  console.log("Updated participant final_ranks");
});

tx();

// Verify
console.log("\n=== VERIFICATION ===");
const verifyEntries = db.prepare(`
  SELECT tse.*, ts.name as stage_name, tsg.group_name, tm.name as team_name
  FROM tournament_participant_stage_entries tse
  JOIN tournament_stages ts ON ts.id = tse.stage_id
  LEFT JOIN tournament_stage_groups tsg ON tsg.id = tse.group_id
  JOIN tournament_participants tp ON tp.id = tse.participant_id
  JOIN teams tm ON tm.id = tp.team_id
  WHERE ts.tournament_id = ?
  ORDER BY ts.name, tse.placement
`).all(tournamentId);

const byStage = {};
verifyEntries.forEach(e => {
  if (!byStage[e.stage_name]) byStage[e.stage_name] = [];
  byStage[e.stage_name].push(e);
});

for (const [stage, entries] of Object.entries(byStage)) {
  console.log(`\n${stage} (${entries.length} teams):`);
  entries.forEach(e => {
    const extra = e.group_name ? ` [${e.group_name}]` : "";
    console.log(`  #${e.placement} ${e.team_name}${extra} (q:${e.qualified} e:${e.eliminated})`);
  });
}

const verifyTournament = db.prepare("SELECT stages FROM tournaments WHERE id = ?").get(tournamentId);
const vStages = JSON.parse(verifyTournament.stages);
const gsStage = vStages.find(s => s.name === "Group Stage");
console.log(`\nJSON Group Stage standings: ${gsStage.standings.length} entries`);
console.log("First 3:", gsStage.standings.slice(0, 3).map(s => `${s.team} (${s.points}pts)`).join(", "));

import 'dotenv/config';
import Database from "libsql";
import { randomUUID } from "node:crypto";

const db = new Database(process.env.TURSO_DATABASE_URL, { authToken: process.env.TURSO_AUTH_TOKEN });

const TOURNAMENT_NAME = "PUBG Mobile World Cup 2026";
const tournament = db.prepare("SELECT id FROM tournaments WHERE name = ?").get(TOURNAMENT_NAME);
const tournamentId = tournament.id;
console.log("Tournament ID:", tournamentId);

const now = new Date().toISOString();

const stages = db.prepare("SELECT id, name FROM tournament_stages WHERE tournament_id = ?").all(tournamentId);
const stageIdByName = Object.fromEntries(stages.map((s) => [s.name, s.id]));

const stageGroups = db.prepare("SELECT id, group_name FROM tournament_stage_groups WHERE stage_id = ?").all(stageIdByName["Group Stage"]);
const groupIdByName = Object.fromEntries(stageGroups.map((g) => [g.group_name, g.id]));

const groupAStandings = [
  { placement: 1, team: "4thrives Esports", matches: 12, wwcd: 0, place_points: 27, elimins: 80, points: 107 },
  { placement: 2, team: "Orangutan", matches: 12, wwcd: 2, place_points: 41, elimins: 50, points: 91 },
  { placement: 3, team: "Aurora Gaming", matches: 12, wwcd: 1, place_points: 30, elimins: 60, points: 90 },
  { placement: 4, team: "Team Flash", matches: 12, wwcd: 1, place_points: 31, elimins: 58, points: 89 },
  { placement: 5, team: "Nigma Galaxy", matches: 12, wwcd: 0, place_points: 30, elimins: 58, points: 88 },
  { placement: 6, team: "ULF Esports", matches: 12, wwcd: 1, place_points: 35, elimins: 48, points: 83 },
  { placement: 7, team: "AG.AL International", matches: 12, wwcd: 1, place_points: 26, elimins: 53, points: 79 },
  { placement: 8, team: "GOAT Team", matches: 12, wwcd: 2, place_points: 24, elimins: 49, points: 73 },
  { placement: 9, team: "FURIA Esports", matches: 12, wwcd: 1, place_points: 26, elimins: 47, points: 73 },
  { placement: 10, team: "AlUla Club Esports", matches: 12, wwcd: 1, place_points: 21, elimins: 51, points: 72 },
  { placement: 11, team: "Kiwoom DRX", matches: 12, wwcd: 0, place_points: 20, elimins: 50, points: 70 },
  { placement: 12, team: "RRQ RYU", matches: 12, wwcd: 1, place_points: 19, elimins: 43, points: 62 },
  { placement: 13, team: "Geekay Esports", matches: 12, wwcd: 1, place_points: 25, elimins: 32, points: 57 },
  { placement: 14, team: "XForce Rejects", matches: 12, wwcd: 0, place_points: 12, elimins: 34, points: 46 },
  { placement: 15, team: "ThunderTalk Gaming", matches: 12, wwcd: 0, place_points: 16, elimins: 18, points: 34 },
  { placement: 16, team: "Gaming Stars Esports", matches: 12, wwcd: 0, place_points: 1, elimins: 28, points: 29 },
];

const groupBStandings = [
  { placement: 1, team: "Bigetron by Vitality", matches: 12, wwcd: 2, place_points: 45, elimins: 103, points: 148 },
  { placement: 2, team: "IDA Esports", matches: 12, wwcd: 3, place_points: 55, elimins: 53, points: 108 },
  { placement: 3, team: "GodLike Esports", matches: 12, wwcd: 1, place_points: 32, elimins: 73, points: 105 },
  { placement: 4, team: "Horaa Esports", matches: 12, wwcd: 1, place_points: 37, elimins: 61, points: 98 },
  { placement: 5, team: "S2G Esports", matches: 12, wwcd: 0, place_points: 30, elimins: 67, points: 97 },
  { placement: 6, team: "eArena", matches: 12, wwcd: 1, place_points: 31, elimins: 64, points: 95 },
  { placement: 7, team: "Nongshim RedForce", matches: 12, wwcd: 2, place_points: 37, elimins: 51, points: 88 },
  { placement: 8, team: "Alpha7 Esports", matches: 12, wwcd: 1, place_points: 19, elimins: 45, points: 64 },
  { placement: 9, team: "Yangon Galacticos", matches: 12, wwcd: 0, place_points: 27, elimins: 34, points: 61 },
  { placement: 10, team: "721 Esports", matches: 12, wwcd: 0, place_points: 12, elimins: 48, points: 60 },
  { placement: 11, team: "Tianba", matches: 12, wwcd: 1, place_points: 19, elimins: 30, points: 49 },
  { placement: 12, team: "Wolves Esports", matches: 12, wwcd: 0, place_points: 13, elimins: 36, points: 49 },
  { placement: 13, team: "DOPENESS", matches: 12, wwcd: 0, place_points: 17, elimins: 28, points: 45 },
  { placement: 14, team: "ETSH Esports", matches: 12, wwcd: 0, place_points: 5, elimins: 31, points: 36 },
  { placement: 15, team: "TT Project", matches: 12, wwcd: 0, place_points: 1, elimins: 35, points: 36 },
  { placement: 16, team: "Hustler Crew", matches: 12, wwcd: 0, place_points: 4, elimins: 21, points: 25 },
];

function makeStanding(s, grp) {
  return {
    placement: s.placement, rank: s.placement, team: s.team, fullTeam: s.team,
    matches: s.matches, wwcd: String(s.wwcd), pos: String(s.place_points),
    place: String(s.place_points), elimins: String(s.elimins), elims: String(s.elimins),
    points: s.points, pts: s.points, grp,
  };
}

// 1. Update JSON stages
const tournamentRow = db.prepare("SELECT stages FROM tournaments WHERE id = ?").get(tournamentId);
const jsonStages = JSON.parse(tournamentRow.stages);
const allStandings = [
  ...groupAStandings.map(s => makeStanding(s, "A")),
  ...groupBStandings.map(s => makeStanding(s, "B")),
];
const updatedStages = jsonStages.map((stage) => {
  if (stage.name === "Group Stage") return { ...stage, status: "completed", standings: allStandings };
  return stage;
});
db.prepare("UPDATE tournaments SET stages = ?, updated_date = ? WHERE id = ?")
  .run(JSON.stringify(updatedStages), now, tournamentId);

// Verify
const check = db.prepare("SELECT stages FROM tournaments WHERE id = ?").get(tournamentId);
const checkStages = JSON.parse(check.stages);
const checkGs = checkStages.find(s => s.name === "Group Stage");
console.log("1. JSON updated - Group Stage standings:", checkGs.standings.length, "entries");

// 2. Get participants
const participants = db.prepare("SELECT tp.id, tm.name FROM tournament_participants tp JOIN teams tm ON tm.id = tp.team_id WHERE tp.tournament_id = ?").all(tournamentId);
const pidByTeam = Object.fromEntries(participants.map((p) => [p.name, p.id]));

// 3. Clear old stage entries
const pids = participants.map(p => p.id);
if (pids.length > 0) {
  const ph = pids.map(() => "?").join(",");
  db.prepare(`DELETE FROM tournament_participant_stage_entries WHERE participant_id IN (${ph})`).run(...pids);
}
console.log("2. Cleared old stage entries");

// 4. Create Group Stage entries
const insertEntry = db.prepare(`INSERT INTO tournament_participant_stage_entries (id, participant_id, stage_id, group_id, phase_label, placement, qualified, eliminated, notes, created_date, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

let gsCount = 0;
for (const s of [...groupAStandings]) {
  const pid = pidByTeam[s.team];
  if (!pid) { console.log("WARN:", s.team); continue; }
  insertEntry.run(randomUUID(), pid, stageIdByName["Group Stage"], groupIdByName["Group Stage - Group A"], "Group Stage - Group A", s.placement, s.placement <= 13 ? 1 : 0, s.placement >= 14 ? 1 : 0, `Pts:${s.points}`, now, now);
  gsCount++;
}
for (const s of [...groupBStandings]) {
  const pid = pidByTeam[s.team];
  if (!pid) { console.log("WARN:", s.team); continue; }
  insertEntry.run(randomUUID(), pid, stageIdByName["Group Stage"], groupIdByName["Group Stage - Group B"], "Group Stage - Group B", s.placement, s.placement <= 13 ? 1 : 0, s.placement >= 14 ? 1 : 0, `Pts:${s.points}`, now, now);
  gsCount++;
}
console.log("3. Created", gsCount, "Group Stage entries");

// 5. Grand Finals (top 5 each group, sorted by points)
const gfTeams = [...groupAStandings.slice(0, 5), ...groupBStandings.slice(0, 5)].sort((a, b) => b.points - a.points);
let gfCount = 0;
gfTeams.forEach((s, i) => {
  const pid = pidByTeam[s.team];
  if (!pid) return;
  insertEntry.run(randomUUID(), pid, stageIdByName["Grand Finals"], null, "Grand Finals", i + 1, 0, 0, `From GS Pts:${s.points}`, now, now);
  gfCount++;
});
console.log("4. Created", gfCount, "Grand Finals entries");

// 6. Survival Stage (6th-13th each group, sorted by points)
const ssTeams = [...groupAStandings.slice(5, 13), ...groupBStandings.slice(5, 13)].sort((a, b) => b.points - a.points);
let ssCount = 0;
ssTeams.forEach((s, i) => {
  const pid = pidByTeam[s.team];
  if (!pid) return;
  insertEntry.run(randomUUID(), pid, stageIdByName["Survival Stage"], null, "Survival Stage", i + 1, 0, 0, `From GS Pts:${s.points}`, now, now);
  ssCount++;
});
console.log("5. Created", ssCount, "Survival Stage entries");

// 7. Update final_rank
const allRanked = [...groupAStandings, ...groupBStandings].sort((a, b) => b.points - a.points);
allRanked.forEach((s, i) => {
  const pid = pidByTeam[s.team];
  if (!pid) return;
  db.prepare("UPDATE tournament_participants SET final_rank = ?, updated_date = ? WHERE id = ?").run(i + 1, now, pid);
});
console.log("6. Updated final_ranks");

// Final verification
console.log("\n=== VERIFICATION ===");
const entryCounts = db.prepare("SELECT ts.name, COUNT(*) as cnt FROM tournament_participant_stage_entries tse JOIN tournament_stages ts ON ts.id = tse.stage_id WHERE ts.tournament_id = ? GROUP BY ts.name").all(tournamentId);
entryCounts.forEach(e => console.log(`  ${e.name}: ${e.cnt} entries`));

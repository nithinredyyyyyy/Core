import 'dotenv/config';
import Database from "libsql";

const db = new Database(process.env.TURSO_DATABASE_URL, { authToken: process.env.TURSO_AUTH_TOKEN });
const t = db.prepare("SELECT id, participants, stages FROM tournaments WHERE name = ?").get("PUBG Mobile World Cup 2026");
const tournamentId = t.id;

const jsonParticipants = JSON.parse(t.participants);
const jsonStages = JSON.parse(t.stages);
const gsStage = jsonStages.find((s) => s.name === "Group Stage");
const standings = gsStage?.standings || [];

// Fix participant names
const nameFixes = { "Godlike Esports": "GodLike Esports", "Nongshim Redforce": "Nongshim RedForce" };
for (const p of jsonParticipants) {
  if (nameFixes[p.team]) p.team = nameFixes[p.team];
}

// Keep ONLY Group Stage entries (deduplicate first)
const groupStageOnly = [];
const seen = new Set();
for (const p of jsonParticipants) {
  if (p.phase && p.phase.startsWith("Group Stage") && !seen.has(p.team)) {
    groupStageOnly.push(p);
    seen.add(p.team);
  }
}
console.log("Base Group Stage participants:", groupStageOnly.length);

// Build placement lookup
const teamPlacement = {};
for (const s of standings) {
  teamPlacement[s.team.toLowerCase()] = {
    placement: s.placement,
    points: s.points,
  };
}

// Expand
const expanded = [];
for (const p of groupStageOnly) {
  expanded.push({ ...p });
  const info = teamPlacement[p.team.toLowerCase()];
  if (!info) { console.log("WARN: no standings for", p.team); continue; }
  if (info.placement <= 5) {
    expanded.push({ ...p, phase: "Grand Finals" });
  } else if (info.placement <= 13) {
    expanded.push({ ...p, phase: "Survival Stage" });
  }
}

// Save
const now = new Date().toISOString();
db.prepare("UPDATE tournaments SET participants = ?, updated_date = ? WHERE id = ?")
  .run(JSON.stringify(expanded), now, tournamentId);

// Verify
const verify = db.prepare("SELECT participants FROM tournaments WHERE id = ?").get(tournamentId);
const v = JSON.parse(verify.participants);
console.log("Total:", v.length);
const phaseCounts = {};
for (const p of v) phaseCounts[p.phase] = (phaseCounts[p.phase] || 0) + 1;
console.log("Phases:", phaseCounts);
console.log("GF:", v.filter((x) => x.phase === "Grand Finals").map((x) => x.team));
console.log("SS:", v.filter((x) => x.phase === "Survival Stage").map((x) => x.team));

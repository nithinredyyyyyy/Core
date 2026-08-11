import { readFileSync } from "node:fs";

const { db: local } = await import("file:///C:/Users/surak/core/server/db.js");
const env = readFileSync(".env", "utf8");
const tursoUrl = env.match(/TURSO_DATABASE_URL=(\S+)/)?.[1] || "";
const tursoToken = env.match(/TURSO_AUTH_TOKEN=(\S+)/)?.[1] || "";
const { default: Database } = await import("libsql");
const remote = tursoUrl ? new Database(tursoUrl, tursoToken ? { authToken: tursoToken } : {}) : null;

const norm = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");

async function investigate(db, label) {
  console.log(`\n############ ${label} ############`);

  // 1. duplicate match_results
  console.log("\n-- duplicate match_results (match+team) --");
  const dups = db
    .prepare(
      `SELECT r.match_id, r.team_id, COUNT(*) c, MIN(m.tournament_id) tid, MIN(m.stage) stage, MIN(m.match_number) mn
       FROM match_results r JOIN matches m ON m.id = r.match_id
       GROUP BY r.match_id, r.team_id HAVING c > 1`,
    )
    .all();
  for (const d of dups) {
    const tname = db.prepare("SELECT name FROM tournaments WHERE id = ?").get(d.tid)?.name || "?";
    const team = db.prepare("SELECT name FROM teams WHERE id = ?").get(d.team_id)?.name || "?";
    const rows = db
      .prepare(
        `SELECT id, placement, kill_points, placement_points, total_points, created_by FROM match_results WHERE match_id = ? AND team_id = ?`,
      )
      .all(d.match_id, d.team_id);
    console.log(`  ${tname} | ${d.stage} #${d.mn} | ${team} (${d.c} rows)`);
    rows.forEach((r) =>
      console.log(
        `    id=${r.id.slice(0, 8)} place=${r.placement} kills=${r.kill_points} placePts=${r.placement_points} total=${r.total_points} by=${r.created_by}`,
      ),
    );
  }

  // 2. duplicate placement within a match
  console.log("\n-- duplicate placement in a match --");
  const dupPl = db
    .prepare(
      `SELECT match_id, placement, COUNT(*) c FROM match_results WHERE placement IS NOT NULL GROUP BY match_id, placement HAVING c > 1`,
    )
    .all();
  for (const d of dupPl) {
    const m = db.prepare("SELECT tournament_id, stage, match_number FROM matches WHERE id = ?").get(d.match_id);
    const tname = db.prepare("SELECT name FROM tournaments WHERE id = ?").get(m.tournament_id)?.name || "?";
    const teams = db
      .prepare(
        `SELECT r.id, t.name team, r.kill_points, r.placement_points, r.total_points FROM match_results r JOIN teams t ON t.id = r.team_id WHERE r.match_id = ? AND r.placement = ?`,
      )
      .all(d.match_id, d.placement);
    console.log(`  ${tname} | ${m.stage} #${m.match_number} | placement ${d.placement} x${d.c}`);
    teams.forEach((t) => console.log(`    ${t.team}: kills=${t.kill_points} placePts=${t.placement_points} total=${t.total_points} (${t.id.slice(0, 8)})`));
  }

  // 3. duplicate player IGNs
  console.log("\n-- duplicate player IGNs --");
  const dupIgn = db.prepare("SELECT ign, COUNT(*) c FROM players GROUP BY lower(ign) HAVING c > 1").all();
  for (const d of dupIgn) {
    const players = db
      .prepare("SELECT p.id, p.ign, p.real_name, p.role, p.team_id, t.name team FROM players p LEFT JOIN teams t ON t.id = p.team_id WHERE lower(p.ign) = lower(?)")
      .all(d.ign);
    console.log(`  "${d.ign}" x${d.c}`);
    players.forEach((p) => console.log(`    ${p.id.slice(0, 8)} real=${p.real_name || "?"} role=${p.role || "?"} team=${p.team || "?"}`));
  }

  // 4. placement out of range
  console.log("\n-- match_results placement out of range --");
  const bad = db
    .prepare(
      `SELECT r.id, r.match_id, r.team_id, r.placement, m.tournament_id, m.stage, m.match_number,
              (SELECT COUNT(*) FROM match_results WHERE match_id = r.match_id) results_in_match,
              (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = m.tournament_id) participants
       FROM match_results r JOIN matches m ON m.id = r.match_id
       WHERE r.placement IS NULL OR r.placement < 1 OR r.placement > (SELECT COUNT(*) FROM match_results WHERE match_id = r.match_id)`,
    )
    .all();
  for (const b of bad) {
    const tname = db.prepare("SELECT name FROM tournaments WHERE id = ?").get(b.tournament_id)?.name || "?";
    const team = db.prepare("SELECT name FROM teams WHERE id = ?").get(b.team_id)?.name || "?";
    console.log(`  ${tname} | ${b.stage} #${b.match_number} | ${team} placed #${b.placement} | results_in_match=${b.results_in_match} tournament_participants=${b.participants}`);
  }

  // 5. alias over-merge: distinct JSON names -> same team
  console.log("\n-- alias over-merge (distinct JSON names -> one team) --");
  const trows = db.prepare("SELECT id, name, participants FROM tournaments").all();
  const aliasToTeam = new Map();
  for (const a of db.prepare("SELECT normalized_alias, team_id FROM team_aliases").all()) {
    aliasToTeam.set(a.normalized_alias, a.team_id);
  }
  const teamName = new Map(db.prepare("SELECT id, name FROM teams").all().map((t) => [t.id, t.name]));
  for (const t of trows) {
    const participants = (() => {
      try {
        const p = JSON.parse(t.participants || "[]");
        return Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    })();
    const map = new Map();
    for (const p of participants) {
      const name = String(p?.team || "").trim();
      if (!name) continue;
      const key = norm(name);
      const teamId = aliasToTeam.get(key) || key;
      if (!map.has(teamId)) map.set(teamId, []);
      if (!map.get(teamId).includes(name)) map.get(teamId).push(name);
    }
    for (const [teamId, names] of map) {
      if (names.length > 1 && teamName.has(teamId)) {
        console.log(`  ${t.name}: "${teamName.get(teamId)}" <- ${names.join(" | ")}`);
      }
    }
  }
}

await investigate(local, "LOCAL");
if (remote) await investigate(remote, "REMOTE");

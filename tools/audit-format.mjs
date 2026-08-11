import { readFileSync } from "node:fs";

const { db: local } = await import("file:///C:/Users/surak/core/server/db.js");
const env = readFileSync(".env", "utf8");
const tursoUrl = env.match(/TURSO_DATABASE_URL=(\S+)/)?.[1] || "";
const tursoToken = env.match(/TURSO_AUTH_TOKEN=(\S+)/)?.[1] || "";
const { default: Database } = await import("libsql");
const remote = tursoUrl ? new Database(tursoUrl, tursoToken ? { authToken: tursoToken } : {}) : null;

function audit(db, label) {
  console.log(`\n############ ${label} ############`);
  const q = (sql, ...a) => db.prepare(sql).all(...a);

  const distinct = (sql) => q(sql).map((r) => Object.values(r)[0]);

  console.log("\n-- matches.status values --");
  console.log("  ", distinct("SELECT DISTINCT status FROM matches").join(", "));
  console.log("\n-- tournaments.status values --");
  console.log("  ", distinct("SELECT DISTINCT status FROM tournaments").join(", "));
  console.log("\n-- matches with match_number null/0 --");
  const badMn = q("SELECT id, tournament_id, stage FROM matches WHERE match_number IS NULL OR match_number = 0");
  console.log(`  count=${badMn.length}`);
  for (const m of badMn.slice(0, 10)) {
    const t = db.prepare("SELECT name FROM tournaments WHERE id = ?").get(m.tournament_id)?.name;
    console.log(`    ${t} | ${m.stage} (${m.id.slice(0, 8)})`);
  }

  console.log("\n-- match_results.stage != matches.stage --");
  const stageMismatch = q(
    "SELECT COUNT(*) c FROM match_results r JOIN matches m ON m.id = r.match_id WHERE r.stage IS NOT NULL AND r.stage != m.stage",
  );
  console.log(`  count=${stageMismatch[0].c}`);

  console.log("\n-- matches with 0 results --");
  const noResults = q(
    "SELECT COUNT(*) c FROM matches m WHERE NOT EXISTS (SELECT 1 FROM match_results r WHERE r.match_id = m.id)",
  );
  console.log(`  count=${noResults[0].c}`);
  const byTourn = q(
    `SELECT t.name, COUNT(*) c FROM matches m JOIN tournaments t ON t.id = m.tournament_id
     WHERE NOT EXISTS (SELECT 1 FROM match_results r WHERE r.match_id = m.id) GROUP BY t.name ORDER BY c DESC`,
  );
  byTourn.forEach((r) => console.log(`    ${r.name}: ${r.c}`));

  console.log("\n-- teams with empty/generated tags --");
  const badTags = q("SELECT name, tag FROM teams WHERE tag IS NULL OR tag = '' OR tag = 'TBD'");
  console.log(`  count=${badTags.length}`);
  badTags.slice(0, 10).forEach((t) => console.log(`    "${t.name}" tag="${t.tag}"`));

  console.log("\n-- JSON stage names missing from relational stages --");
  const trows = q("SELECT id, name, stages, participants FROM tournaments");
  for (const t of trows) {
    let stages = [];
    try {
      stages = JSON.parse(t.stages || "[]");
    } catch {}
    const relStages = new Set(q("SELECT name FROM tournament_stages WHERE tournament_id = ?", t.id).map((r) => r.name));
    const missing = [];
    for (const s of stages) {
      const n = s?.name || "";
      if (n && !relStages.has(n)) missing.push(n);
    }
    if (missing.length) console.log(`  ${t.name}: missing ${missing.join(", ")}`);
  }

  console.log("\n-- participants without phase --");
  for (const t of trows) {
    const participants = (() => {
      try {
        const p = JSON.parse(t.participants || "[]");
        return Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    })();
    const noPhase = participants.filter((p) => !String(p?.phase || "").trim()).length;
    if (noPhase) console.log(`  ${t.name}: ${noPhase} without phase`);
  }

  console.log("\n-- tournaments with empty participants JSON --");
  const empty = q("SELECT name FROM tournaments WHERE participants IS NULL OR participants = '[]' OR participants = ''");
  empty.forEach((r) => console.log(`    ${r.name}`));
  console.log(`  count=${empty.length}`);

  console.log("\n-- match_results teams vs match participants overlap --");
  const matches = q(
    `SELECT m.id, m.tournament_id, m.stage, m.group_name,
            (SELECT COUNT(*) FROM match_results r WHERE r.match_id = m.id) result_teams,
            (SELECT COUNT(*) FROM tournament_participants p WHERE p.tournament_id = m.tournament_id) participants
     FROM matches m ORDER BY m.created_date DESC`,
  );
  const odd = matches.filter((m) => m.result_teams > 0 && m.result_teams < 6);
  console.log(`  matches with 1-5 results (suspicious partial): ${odd.length}`);
  odd.slice(0, 12).forEach((m) => {
    const t = db.prepare("SELECT name FROM tournaments WHERE id = ?").get(m.tournament_id)?.name;
    console.log(`    ${t} | ${m.stage} ${m.group_name || ""} | results=${m.result_teams}`);
  });
}

audit(local, "LOCAL");
if (remote) audit(remote, "REMOTE");

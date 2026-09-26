import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(repoRoot, "public");

// Import the real DB module (env-aware) so the audit runs against the same
// connection the server uses rather than a hand-built path.
const { db: local } = await import(new URL("../server/db.js", import.meta.url));

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const norm = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function buildAudit(db, label) {
  const report = { label, checks: [] };
  const add = (name, rows, extra = "") => {
    report.checks.push({ name, count: rows.length, sample: rows.slice(0, 8), extra });
  };
  const q = (sql, ...args) => db.prepare(sql).all(...args);
  const g = (sql, ...args) => db.prepare(sql).get(...args);

  // ---- 1. required columns / UUID / dates ----
  const badUuid = q(
    "SELECT 'tournaments' t, id FROM tournaments WHERE id NOT LIKE '________-____-____-____-____________'",
  );
  if (badUuid.length) add("non-UUID primary keys", badUuid);

  const badDates = q(
    `SELECT 'tournaments' t, id FROM tournaments WHERE created_date NOT LIKE '____-__-__T%' OR updated_date NOT LIKE '____-__-__T%'
     UNION ALL SELECT 'teams', id FROM teams WHERE created_date NOT LIKE '____-__-__T%' OR updated_date NOT LIKE '____-__-__T%'
     UNION ALL SELECT 'players', id FROM players WHERE created_date NOT LIKE '____-__-__T%' OR updated_date NOT LIKE '____-__-__T%'
     UNION ALL SELECT 'matches', id FROM matches WHERE created_date NOT LIKE '____-__-__T%' OR updated_date NOT LIKE '____-__-__T%'`,
  );
  if (badDates.length) add("rows with non-ISO created/updated dates", badDates);

  const nullRequired = q(
    `SELECT 'teams' t, id FROM teams WHERE name IS NULL OR tag IS NULL OR tag = ''
     UNION ALL SELECT 'players', id FROM players WHERE ign IS NULL OR ign = ''
     UNION ALL SELECT 'matches', id FROM matches WHERE tournament_id IS NULL OR stage IS NULL OR stage = ''`,
  );
  if (nullRequired.length) add("rows violating NOT-NULL business rules", nullRequired);

  // ---- 2. duplicates ----
  const dupTeams = q("SELECT name, COUNT(*) c FROM teams GROUP BY lower(name) HAVING c > 1");
  if (dupTeams.length) add("duplicate team names", dupTeams, "grouped by name");

  const dupPlayers = q("SELECT ign, COUNT(*) c FROM players GROUP BY lower(ign) HAVING c > 1");
  if (dupPlayers.length) add("duplicate player IGNs", dupPlayers, "grouped by ign");

  const dupResults = q(
    "SELECT match_id, team_id, COUNT(*) c FROM match_results GROUP BY match_id, team_id HAVING c > 1",
  );
  if (dupResults.length) add("duplicate match_results (match+team)", dupResults, "grouped");

  const dupStandings = q(
    "SELECT stage_id, group_id, team_id, COUNT(*) c FROM stage_standings GROUP BY stage_id, group_id, team_id HAVING c > 1",
  );
  if (dupStandings.length) add("duplicate stage_standings rows", dupStandings, "grouped");

  const dupTeamAliases = q(
    "SELECT team_id, normalized_alias, COUNT(*) c FROM team_aliases GROUP BY team_id, normalized_alias HAVING c > 1",
  );
  if (dupTeamAliases.length) add("duplicate team_aliases", dupTeamAliases, "grouped");

  // ---- 3. referential integrity ----
  const orphans = [];
  const o = (name, sql) => {
    const rows = q(sql);
    if (rows.length) orphans.push({ name, count: rows.length, sample: rows.slice(0, 6) });
  };
  o("matches → tournaments", `SELECT m.id FROM matches m LEFT JOIN tournaments t ON t.id = m.tournament_id WHERE t.id IS NULL`);
  o("match_results → matches", `SELECT r.id FROM match_results r LEFT JOIN matches m ON m.id = r.match_id WHERE m.id IS NULL`);
  o("match_results → teams", `SELECT r.id FROM match_results r LEFT JOIN teams t ON t.id = r.team_id WHERE t.id IS NULL`);
  o("tournament_participants → teams", `SELECT p.id FROM tournament_participants p LEFT JOIN teams t ON t.id = p.team_id WHERE t.id IS NULL`);
  o("tournament_participants → tournaments", `SELECT p.id FROM tournament_participants p LEFT JOIN tournaments t ON t.id = p.tournament_id WHERE t.id IS NULL`);
  o("tournament_stages → tournaments", `SELECT s.id FROM tournament_stages s LEFT JOIN tournaments t ON t.id = s.tournament_id WHERE t.id IS NULL`);
  o("tournament_stage_groups → stages", `SELECT g.id FROM tournament_stage_groups g LEFT JOIN tournament_stages s ON s.id = g.stage_id WHERE s.id IS NULL`);
  o("stage_entries → participants", `SELECT e.id FROM tournament_participant_stage_entries e LEFT JOIN tournament_participants p ON p.id = e.participant_id WHERE p.id IS NULL`);
  o("stage_entries → stages", `SELECT e.id FROM tournament_participant_stage_entries e LEFT JOIN tournament_stages s ON s.id = e.stage_id WHERE s.id IS NULL`);
  o("stage_entries → groups", `SELECT e.id FROM tournament_participant_stage_entries e LEFT JOIN tournament_stage_groups g ON g.id = e.group_id WHERE e.group_id IS NOT NULL AND g.id IS NULL`);
  o("participant_players → participants", `SELECT p.id FROM tournament_participant_players p LEFT JOIN tournament_participants t ON t.id = p.participant_id WHERE t.id IS NULL`);
  o("participant_players → players", `SELECT p.id FROM tournament_participant_players p LEFT JOIN players pl ON pl.id = p.player_id WHERE p.player_id IS NOT NULL AND pl.id IS NULL`);
  o("stage_standings → stages", `SELECT s.id FROM stage_standings s LEFT JOIN tournament_stages ts ON ts.id = s.stage_id WHERE ts.id IS NULL`);
  o("stage_standings → teams", `SELECT s.id FROM stage_standings s LEFT JOIN teams t ON t.id = s.team_id WHERE t.id IS NULL`);
  o("stage_standings → groups", `SELECT s.id FROM stage_standings s LEFT JOIN tournament_stage_groups g ON g.id = s.group_id WHERE s.group_id IS NOT NULL AND g.id IS NULL`);
  o("player_aliases → players", `SELECT a.id FROM player_aliases a LEFT JOIN players p ON p.id = a.player_id WHERE p.id IS NULL`);
  o("team_aliases → teams", `SELECT a.id FROM team_aliases a LEFT JOIN teams t ON t.id = a.team_id WHERE t.id IS NULL`);
  o("player_team_history → players", `SELECT h.id FROM player_team_history h LEFT JOIN players p ON p.id = h.player_id WHERE p.id IS NULL`);
  o("player_team_history → teams", `SELECT h.id FROM player_team_history h LEFT JOIN teams t ON t.id = h.team_id WHERE t.id IS NULL`);
  o("stage_match_breakdown → standings", `SELECT b.id FROM stage_match_breakdown b LEFT JOIN stage_standings s ON s.id = b.standing_id WHERE s.id IS NULL`);
  o("stage_match_breakdown → matches", `SELECT b.id FROM stage_match_breakdown b LEFT JOIN matches m ON m.id = b.match_id WHERE m.id IS NULL`);
  if (orphans.length) add("orphaned references", orphans.map((x) => `${x.name} (${x.count}): ${x.sample.map((s) => s.id).join(", ")}`), "by table");

  // cross-scope: entry group must belong to entry stage
  const groupStageMismatch = q(
    `SELECT e.id FROM tournament_participant_stage_entries e
     JOIN tournament_stage_groups g ON g.id = e.group_id
     WHERE e.group_id IS NOT NULL AND g.stage_id != e.stage_id`,
  );
  if (groupStageMismatch.length) add("stage entries group belongs to a different stage", groupStageMismatch);

  // ---- 4. tournament JSON format ----
  const trows = q("SELECT id, name, stages, participants, rankings, status, tier FROM tournaments");
  for (const t of trows) {
    const problems = [];
    for (const [field, arr] of [
      ["stages", t.stages],
      ["participants", t.participants],
      ["rankings", t.rankings],
    ]) {
      if (arr == null || arr === "") continue;
      let parsed;
      try {
        parsed = JSON.parse(arr);
      } catch {
        problems.push(`${field}: invalid JSON`);
        continue;
      }
      if (!Array.isArray(parsed)) problems.push(`${field}: not an array`);
    }
    const participants = (() => {
      try {
        const p = JSON.parse(t.participants || "[]");
        return Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    })();
    const teamless = participants.filter((p) => !String(p?.team || "").trim());
    if (teamless.length) problems.push(`participants: ${teamless.length} without team`);
    const badPlayers = participants.filter((p) =>
      Array.isArray(p?.players) && p.players.some((pl) => {
        const n = typeof pl === "string" ? pl : pl?.name || pl?.ign || pl?.player_name;
        return !n;
      }),
    );
    if (badPlayers.length) problems.push(`participants: ${badPlayers.length} with nameless player entries`);
    if (problems.length) add(`tournament JSON issues: ${t.name}`, problems, "id=" + t.id);
  }

  // participants with team names that are placeholders (Survival #N style)
  const placeholderHits = [];
  const teams = q("SELECT id, name, tag FROM teams");
  const teamSet = new Set();
  for (const t of teams) {
    if (norm(t.name)) teamSet.add(norm(t.name));
    if (norm(t.tag)) teamSet.add(norm(t.tag));
  }
  for (const a of q("SELECT alias, normalized_alias FROM team_aliases")) {
    if (norm(a.alias)) teamSet.add(norm(a.alias));
    if (a.normalized_alias) teamSet.add(a.normalized_alias);
  }
  for (const t of trows) {
    const participants = (() => {
      try {
        const p = JSON.parse(t.participants || "[]");
        return Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    })();
    for (const p of participants) {
      const name = String(p?.team || "").trim();
      if (!name) continue;
      const n = norm(name);
      if (/^(survival|round|semi|final|grand|qualifier|knockout|open|closed|winner|champion|pending|team|group|stage|participant|tbd|tba|bye|slot|seed)[0-9]*$/.test(n)) {
        placeholderHits.push(`${t.name} :: ${p?.phase || "?"} :: ${name}`);
      } else if (!teamSet.has(n)) {
        placeholderHits.push(`${t.name} :: ${p?.phase || "?"} :: UNRESOLVED "${name}"`);
      }
    }
  }
  if (placeholderHits.length) add("unresolved/placeholder participant teams", placeholderHits);

  // ---- 5. derived consistency: JSON participants vs relational ----
  for (const t of trows) {
    const participants = (() => {
      try {
        const p = JSON.parse(t.participants || "[]");
        return Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    })();
    const relCount = g("SELECT COUNT(*) c FROM tournament_participants WHERE tournament_id = ?", t.id).c;
    const jResolvable = participants.filter((p) => teamSet.has(norm(p?.team))).length;
    const jUnresolved = participants.length - jResolvable;
    if (jResolvable !== relCount) {
      add(
        `derived mismatch: ${t.name}`,
        [`JSON resolvable teams=${jResolvable} (unresolved=${jUnresolved}), relational participants=${relCount}`],
      );
    }
  }

  // ---- 6. points consistency ----
  const pointMismatch = q(
    `SELECT COUNT(*) c FROM match_results WHERE total_points != (kill_points + placement_points)`,
  ).c;
  if (pointMismatch) add("match_results total_points != kills+placement", [{ count: pointMismatch }]);

  const standingMismatch = q(
    `SELECT COUNT(*) c FROM stage_standings WHERE total_points != (place_points + elim_points)`,
  ).c;
  if (standingMismatch) add("stage_standings total_points != place+elim", [{ count: standingMismatch }]);

  // placement bounds + duplicates per match
  const badPlacement = q(
    `SELECT r.id FROM match_results r
     JOIN (SELECT match_id, COUNT(*) c FROM match_results GROUP BY match_id) m ON m.match_id = r.match_id
     WHERE r.placement IS NULL OR r.placement < 1 OR r.placement > m.c`,
  );
  if (badPlacement.length) add("match_results placement out of range", badPlacement);

  const dupPlacement = q(
    `SELECT match_id, placement, COUNT(*) c FROM match_results
     WHERE placement IS NOT NULL GROUP BY match_id, placement HAVING c > 1`,
  );
  if (dupPlacement.length) add("match_results duplicate placement in a match", dupPlacement, "grouped");

  // duplicate stage names within a tournament
  const dupStageNames = q(
    `SELECT tournament_id, name, COUNT(*) c FROM tournament_stages GROUP BY tournament_id, name HAVING c > 1`,
  );
  if (dupStageNames.length) add("duplicate stage names per tournament", dupStageNames, "grouped");

  // ---- 7. match / tournament state consistency ----
  // Aggregate rows (match_number = 0) summarise a stage; they legitimately have
  // no schedule. Real matches must be numbered 1..N.
  const badMatchNumbers = q(
    `SELECT m.id, t.name, m.stage, m.match_number FROM matches m
     JOIN tournaments t ON t.id = m.tournament_id
     WHERE m.match_number IS NULL OR m.match_number < 0`,
  );
  if (badMatchNumbers.length) add("matches with NULL or negative match_number", badMatchNumbers);

  const aggregateRows = q(
    `SELECT m.id, t.name, m.stage FROM matches m
     JOIN tournaments t ON t.id = m.tournament_id WHERE m.match_number = 0`,
  );
  if (aggregateRows.length) add("aggregate stage-summary match rows (match_number=0)", aggregateRows, "by design? verify consumers");

  const completedUpcoming = q(
    `SELECT m.id, t.name, m.status FROM matches m
     JOIN tournaments t ON t.id = m.tournament_id
     WHERE t.status = 'upcoming' AND m.status IN ('completed','live')`,
  );
  if (completedUpcoming.length) add("completed/live matches inside an 'upcoming' tournament", completedUpcoming);

  const tournamentStatusDrift = q(
    `SELECT t.id, t.name, t.status,
            SUM(CASE WHEN m.status='completed' THEN 1 ELSE 0 END) completed,
            COUNT(m.id) total
     FROM tournaments t JOIN matches m ON m.tournament_id = t.id
     GROUP BY t.id
     HAVING (t.status = 'completed' AND completed < total)
         OR (t.status = 'upcoming' AND completed > 0)`,
  );
  if (tournamentStatusDrift.length) add("tournament status disagrees with its matches", tournamentStatusDrift, "grouped");

  const scheduledCompleted = q(
    `SELECT m.id, m.scheduled_time FROM matches m
     WHERE m.match_number > 0 AND m.status = 'completed' AND m.scheduled_time IS NULL`,
  );
  if (scheduledCompleted.length) add("completed matches with no scheduled_time", scheduledCompleted);

  // ---- 8. asset / URL integrity ----
  const localAsset = (v) => typeof v === "string" && v.startsWith("/");
  const missingImages = [];
  for (const row of q("SELECT id, name, logo_url FROM teams WHERE logo_url IS NOT NULL AND logo_url != ''")) {
    if (localAsset(row.logo_url) && !existsSync(join(publicDir, row.logo_url.replace(/^\//, "")))) {
      missingImages.push(`team ${row.name} -> ${row.logo_url}`);
    }
  }
  for (const row of q("SELECT id, name, banner_url FROM tournaments WHERE banner_url IS NOT NULL AND banner_url != ''")) {
    if (localAsset(row.banner_url) && !existsSync(join(publicDir, row.banner_url.replace(/^\//, "")))) {
      missingImages.push(`tournament ${row.name} -> ${row.banner_url}`);
    }
  }
  for (const row of q("SELECT id, title, thumbnail_url FROM news_articles WHERE thumbnail_url IS NOT NULL AND thumbnail_url != ''")) {
    if (localAsset(row.thumbnail_url) && !existsSync(join(publicDir, row.thumbnail_url.replace(/^\//, "")))) {
      missingImages.push(`news ${row.title} -> ${row.thumbnail_url}`);
    }
  }
  if (missingImages.length) add("local image URLs that do not resolve to a file", missingImages);

  const badSourceUrls = q(
    `SELECT id, title, source_url FROM news_articles
     WHERE source_url IS NOT NULL AND source_url != '' AND source_url NOT LIKE 'http%'`,
  );
  if (badSourceUrls.length) add("news source_url is not an absolute http(s) URL", badSourceUrls);

  const attributionGaps = q(
    `SELECT id, title FROM news_articles
     WHERE (source_name IS NULL OR source_name = '') <> (source_url IS NULL OR source_url = '')`,
  );
  if (attributionGaps.length) add("news articles with only one of source_name/source_url", attributionGaps);

  const nonPublishedWithoutFlag = q(
    `SELECT id, title FROM news_articles
     WHERE verification_status = 'verified' AND source_name IS NULL AND is_auto_ingested = 1`,
  );
  if (nonPublishedWithoutFlag.length) add("auto-ingested articles marked verified without attribution", nonPublishedWithoutFlag);

  // ---- 9. provenance coverage (informational) ----
  report.provenance = {
    teamsMissingLogo: g("SELECT COUNT(*) c FROM teams WHERE logo_url IS NULL OR logo_url = ''").c,
    teamsMissingRegion: g("SELECT COUNT(*) c FROM teams WHERE region IS NULL OR region = ''").c,
    playersMissingPhoto: g("SELECT COUNT(*) c FROM players WHERE photo_url IS NULL OR photo_url = ''").c,
    playersMissingRealName: g("SELECT COUNT(*) c FROM players WHERE real_name IS NULL OR real_name = ''").c,
    newsMissingSource: g("SELECT COUNT(*) c FROM news_articles WHERE source_name IS NULL OR source_url IS NULL OR source_url = ''").c,
    matchesMissingStream: g("SELECT COUNT(*) c FROM matches WHERE stream_url IS NULL OR stream_url = ''").c,
  };

  report.checkCount = report.checks.reduce((n, c) => n + c.count, 0);
  return report;
}

function printReport(report) {
  console.log(`\n=== AUDIT: ${report.label} (${report.checkCount} violations) ===`);
  if (report.checks.length === 0) {
    console.log("  CLEAN");
    return;
  }
  for (const c of report.checks) {
    console.log(`\n[${c.count}] ${c.name}${c.extra ? `  (${c.extra})` : ""}`);
    for (const row of c.sample) console.log("    -", Array.isArray(row) ? row.join(" :: ") : row);
    if (c.count > c.sample.length) console.log(`    ... and ${c.count - c.sample.length} more`);
  }
}

const localReport = buildAudit(local, "LOCAL (server/data/stagecore.sqlite)");
printReport(localReport);

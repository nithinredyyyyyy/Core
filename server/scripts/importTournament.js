import { randomUUID } from "node:crypto";
import { db, recomputeTeamStats } from "../db.js";

const now = new Date().toISOString();

/**
 * Generic tournament import function.
 *
 * Two execution paths:
 *   - config.teams provided  → full DB insert (teams + players + match_results)
 *   - config.teams omitted   → tournament-only insert (JSON embedded stages)
 *
 * SAFETY:
 *   1. Throws on unresolved team names — never silently skips
 *   2. Post-import verification counts expected vs inserted rows
 *   3. All DB operations inside db.transaction()
 *
 * @param {Object} config
 * @param {Object} config.tournament — tournament metadata object
 * @param {Array}  [config.teams] — [{name, tag, players: string[]}]
 * @param {string} [config.game='BGMI']
 * @param {string} [config.region='India']
 * @param {Function} [config.resolveTeamName] — (rawAlias) => canonicalName | null
 * @param {Function} [config.getStandingsForStage] — (stageName) => Array<{
 *   placement: number, team: string, killPoints: number,
 *   placementPoints: number, totalPoints: number,
 *   matches: number, wins: number
 * }>
 * @param {Function} [config.insertMatchSchedule] — (tournamentId) => void
 *   Called inside the transaction after teams are inserted. Use this to insert
 *   individual match records (scheduled matches with timestamps/maps) that the
 *   standings-only path does not create. The callback receives the new
 *   tournamentId and has access to the db object via closure.
 * @param {Array} [config.articles] — [{title, content, category, featured, game}]
 */
export function importTournament(config) {
  const {
    tournament,
    teams,
    game = "BGMI",
    region = "India",
    resolveTeamName,
    getStandingsForStage,
    insertMatchSchedule,
    articles = [],
  } = config;

  const tx = db.transaction(() => {
    // ── Upsert tournament ──────────────────────────────────────────
    const existing = db
      .prepare("SELECT id FROM tournaments WHERE name = ?")
      .get(tournament.name);

    if (existing) {
      db.prepare("DELETE FROM match_results WHERE tournament_id = ?").run(
        existing.id,
      );
      db.prepare("DELETE FROM matches WHERE tournament_id = ?").run(
        existing.id,
      );
      db.prepare("DELETE FROM tournaments WHERE id = ?").run(existing.id);
    }

    const tournamentId = randomUUID();
    db.prepare(
      `INSERT INTO tournaments (
        id, name, game, tier, status, prize_pool, start_date, end_date, stages,
        description, banner_url, rules, max_teams, format_overview, calendar,
        prize_breakdown, awards, participants, rankings,
        created_date, updated_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      tournamentId,
      tournament.name,
      tournament.game,
      tournament.tier,
      tournament.status,
      tournament.prize_pool,
      tournament.start_date,
      tournament.end_date,
      JSON.stringify(tournament.stages),
      tournament.description,
      tournament.banner_url,
      tournament.rules,
      tournament.max_teams,
      tournament.format_overview,
      JSON.stringify(tournament.calendar),
      JSON.stringify(tournament.prize_breakdown),
      JSON.stringify(tournament.awards ?? []),
      JSON.stringify(tournament.participants ?? []),
      JSON.stringify(tournament.rankings ?? []),
      now,
      now,
      "admin@stagecore.local",
    );

    // ── Teams + Players (Group A path) ─────────────────────────────
    let teamIds = new Map();

    if (teams?.length) {
      const findTeamByName = db.prepare("SELECT id FROM teams WHERE name = ?");
      const upsertTeam = db.prepare(`
        INSERT INTO teams (
          id, name, tag, logo_url, game, region, total_kills, total_points,
          matches_played, wins, created_date, updated_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name, tag=excluded.tag, game=excluded.game,
          region=excluded.region, updated_date=excluded.updated_date
      `);
      const findPlayerOnTeam = db.prepare(
        "SELECT id FROM players WHERE ign = ? AND team_id = ?",
      );
      const findDepartedPlayer = db.prepare(
        "SELECT id FROM players WHERE ign = ? AND team_id IS NULL",
      );
      const updatePlayerTeam = db.prepare(
        "UPDATE players SET team_id = ?, updated_date = ? WHERE id = ?",
      );
      const insertPlayer = db.prepare(`
        INSERT INTO players (
          id, ign, real_name, team_id, role, photo_url, total_kills,
          matches_played, avg_damage, created_date, updated_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const updatePlayerFull = db.prepare(`
        UPDATE players SET team_id = ?, role = ?, updated_date = ? WHERE id = ?
      `);

      for (const team of teams) {
        const existingTeam = findTeamByName.get(team.name);
        const teamId = existingTeam?.id || randomUUID();
        upsertTeam.run(
          teamId,
          team.name,
          team.tag,
          null,
          game,
          region,
          0,
          0,
          0,
          0,
          now,
          now,
          "admin@stagecore.local",
        );

        // Mark departed players (no longer on this roster) as unassigned
        const currentPlayers = db.prepare(
          "SELECT id, ign FROM players WHERE team_id = ?",
        ).all(teamId);
        const newIGNs = new Set(team.players);
        for (const p of currentPlayers) {
          if (!newIGNs.has(p.ign)) {
            updatePlayerTeam.run(null, now, p.id);
          }
        }

        // Deduplicate: if multiple rows share the same ign on this team,
        // keep only the most recently updated one, mark the rest as departed
        const dupes = db.prepare(`
          SELECT id, ign, updated_date FROM players
          WHERE team_id = ? AND ign IN (SELECT ign FROM players WHERE team_id = ? GROUP BY ign HAVING COUNT(*) > 1)
          ORDER BY ign, updated_date DESC
        `).all(teamId, teamId);
        const seenIGNs = new Set();
        for (const d of dupes) {
          if (seenIGNs.has(d.ign)) {
            updatePlayerTeam.run(null, now, d.id);
          } else {
            seenIGNs.add(d.ign);
          }
        }

        // Upsert each player
        for (const ign of team.players) {
          // First: is this player already on THIS team?
          const onThisTeam = findPlayerOnTeam.get(ign, teamId);
          if (onThisTeam) {
            // UPDATE — same UUID, FK references intact
            updatePlayerFull.run(teamId, "Assaulter", now, onThisTeam.id);
            continue;
          }

          // Second: does this ign exist with team_id = NULL? (departed player returning)
          const departed = findDepartedPlayer.get(ign);
          if (departed) {
            // Reactivate — move to this team, preserve UUID and FK references
            updatePlayerTeam.run(teamId, now, departed.id);
            continue;
          }

          // Third: brand new player
          insertPlayer.run(
            randomUUID(),
            ign,
            null,
            teamId,
            "Assaulter",
            null,
            0,
            0,
            0,
            now,
            now,
            "admin@stagecore.local",
          );
        }
        teamIds.set(team.name, teamId);
      }
      recomputeTeamStats();
      if (insertMatchSchedule) insertMatchSchedule(tournamentId);
    }

    // ── Standings → match_results ──────────────────────────────────
    if (getStandingsForStage) {
      const insertMatch = db.prepare(`
        INSERT INTO matches (
          id, tournament_id, stage, match_number, map, status,
          scheduled_time, stream_url, day, created_date, updated_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertResult = db.prepare(`
        INSERT INTO match_results (
          id, match_id, tournament_id, team_id, placement, kill_points,
          placement_points, total_points, matches_count, wins_count, stage,
          created_date, updated_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const stages = tournament.stages || [];
      let totalExpected = 0;
      let totalInserted = 0;
      const unresolvedTeams = [];

      for (const stage of stages) {
        const stageName = stage.name || stage.label;
        if (!stageName) continue;

        const standings = getStandingsForStage(stageName);
        if (!standings?.length) continue;

        totalExpected += standings.length;

        const matchId = randomUUID();
        insertMatch.run(
          matchId,
          tournamentId,
          stageName,
          0,
          "Other",
          "completed",
          null,
          null,
          0,
          now,
          now,
          "admin@stagecore.local",
        );

        for (const row of standings) {
          const resolvedName = resolveTeamName
            ? resolveTeamName(row.team)
            : row.team;
          const teamId = resolvedName ? teamIds.get(resolvedName) : null;

          if (!teamId) {
            unresolvedTeams.push({
              stage: stageName,
              raw: row.team,
              resolved: resolvedName,
            });
            continue;
          }

          insertResult.run(
            randomUUID(),
            matchId,
            tournamentId,
            teamId,
            row.placement,
            row.killPoints,
            row.placementPoints,
            row.totalPoints,
            row.matches,
            row.wins,
            stageName,
            now,
            now,
            "admin@stagecore.local",
          );
          totalInserted++;
        }
      }

      if (unresolvedTeams.length > 0) {
        const detail = unresolvedTeams
          .map((u) => `  stage="${u.stage}" raw="${u.raw}" resolved="${u.resolved}"`)
          .join("\n");
        throw new Error(
          `Unresolved team names in ${tournament.name}:\n${detail}`,
        );
      }

      if (totalInserted !== totalExpected) {
        throw new Error(
          `Standings count mismatch for ${tournament.name}: expected ${totalExpected}, inserted ${totalInserted}`,
        );
      }
    }

    // ── Articles ───────────────────────────────────────────────────
    if (articles.length) {
      const deleteArticle = db.prepare(
        "DELETE FROM news_articles WHERE title = ?",
      );
      const insertArticle = db.prepare(`
        INSERT INTO news_articles (
          id, title, content, category, thumbnail_url, featured, game,
          created_date, updated_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const article of articles) {
        deleteArticle.run(article.title);
        insertArticle.run(
          randomUUID(),
          article.title,
          article.content,
          article.category,
          null,
          article.featured ?? 0,
          article.game,
          now,
          now,
          "admin@stagecore.local",
        );
      }
    }

    // ── Post-import verification ───────────────────────────────────
    if (teams?.length) {
      const findTeamByName = db.prepare("SELECT id FROM teams WHERE name = ?");
      const missingTeams = [];
      for (const team of teams) {
        if (!findTeamByName.get(team.name)) {
          missingTeams.push(team.name);
        }
      }
      if (missingTeams.length > 0) {
        throw new Error(
          `Teams not found in DB after import for ${tournament.name}: ${missingTeams.join(", ")}`,
        );
      }
    }

    if (getStandingsForStage) {
      const insertedResults = db
        .prepare("SELECT COUNT(*) AS n FROM match_results WHERE tournament_id = ?")
        .get(tournamentId).n;
      const stages = tournament.stages || [];
      let expectedResults = 0;
      for (const stage of stages) {
        const stageName = stage.name || stage.label;
        if (!stageName) continue;
        const standings = getStandingsForStage(stageName);
        if (standings?.length) expectedResults += standings.length;
      }
      if (insertedResults !== expectedResults) {
        throw new Error(
          `match_results count mismatch for ${tournament.name}: expected ${expectedResults}, inserted ${insertedResults}`,
        );
      }
    }
  });

  tx();
}

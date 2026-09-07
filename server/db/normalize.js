import { randomUUID } from "node:crypto";
import { db, runInTransaction } from "./schema.js";
import { normalizeLookupValue, canonicalizeTeamLookupValue, TEAM_ALIAS_VARIANTS } from "./teamAliases.js";

export const parseJsonField = (value, fallback = []) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error(`[db] Failed to parse JSON field:`, error.message);
    return fallback;
  }
};

export const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "stage";

export const getPhaseStageName = (phase) =>
  String(phase || "")
    .split(/\s+-\s+Group\s+/i)[0]
    ?.trim() || null;

export const getPhaseGroupName = (phase) => {
  let last = null;
  for (const match of String(phase || "").matchAll(/group\s+([a-z0-9]+)/gi)) {
    last = match[1];
  }
  return last ? `Group ${String(last).toUpperCase()}` : null;
};

export const inferStageType = (stageName) => {
  const normalized = String(stageName || "").toLowerCase();
  if (normalized.includes("grand finals")) return "grand_finals";
  if (normalized.includes("semi")) return "semi_finals";
  if (normalized.includes("quarter")) return "quarter_finals";
  if (normalized.includes("wildcard")) return "wildcards";
  if (normalized.includes("last chance")) return "last_chance";
  if (normalized.includes("survival")) return "survival";
  if (normalized.includes("round")) return "round";
  if (normalized.includes("league")) return "league";
  return "stage";
};

export const buildTeamLookup = () => {
  const teams = db.prepare("SELECT id, name, tag FROM teams").all();
  const map = new Map();

  const register = (key, team) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, team);
  };

  for (const team of teams) {
    register(normalizeLookupValue(team.name), team);
    register(normalizeLookupValue(team.tag), team);
    register(canonicalizeTeamLookupValue(team.name), team);
    register(canonicalizeTeamLookupValue(team.tag), team);
  }

  return map;
};

export const buildPlayerLookup = () => {
  const players = db
    .prepare("SELECT id, ign, team_id, role FROM players")
    .all();
  const exactMap = new Map();
  const anyTeamMap = new Map();

  for (const player of players) {
    const ignKey = normalizeLookupValue(player.ign);
    if (!ignKey) continue;
    if (player.team_id) exactMap.set(`${ignKey}:${player.team_id}`, player);
    if (!anyTeamMap.has(ignKey)) anyTeamMap.set(ignKey, player);
  }

  return { exactMap, anyTeamMap, rows: players };
};

export const resolveTeamRecord = (teamLookup, rawName) => {
  const normalized = normalizeLookupValue(rawName);
  return (
    teamLookup.get(normalized) ||
    teamLookup.get(canonicalizeTeamLookupValue(rawName)) ||
    null
  );
};

export const resolvePlayerRecord = (playerLookup, rawName, teamId) => {
  const normalized = normalizeLookupValue(rawName);
  if (!normalized) return null;
  if (teamId) {
    const exact = playerLookup.exactMap.get(`${normalized}:${teamId}`);
    if (exact) return exact;
  }
  return playerLookup.anyTeamMap.get(normalized) || null;
};

const PLACEHOLDER_TEAM_NAME = /^(tbd|tba|winner|champions?|pending|by\s*e?e|to\s*be\s*decided|team\s*[0-9]+|group\s*[a-z0-9]+|participants?)$/i;
const PLACEHOLDER_TEAM_NAME_NORMALIZED =
  /^(survival|round|semi|final|grand|qualifier|knockout|open|closed|winner|champion|pending|team|group|stage|participant|tbd|tba|bye|slot|seed)[0-9]*$/i;

export function isPlaceholderTeamName(name) {
  const trimmed = String(name || "").trim();
  if (trimmed.length < 2) return true;
  const normalized = normalizeLookupValue(trimmed);
  if (normalized.length < 2) return true;
  if (PLACEHOLDER_TEAM_NAME.test(trimmed)) return true;
  return PLACEHOLDER_TEAM_NAME_NORMALIZED.test(normalized);
}

export function ensureParticipantTeams() {
  const tournaments = db.prepare("SELECT id, name, game, participants FROM tournaments").all();
  const teamLookup = buildTeamLookup();
  const createdNames = new Set();
  const now = new Date().toISOString();

  const insertTeam = db.prepare(`
    INSERT INTO teams (
      id, name, tag, logo_url, game, region, total_kills, total_points, matches_played, wins, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const tournament of tournaments) {
    const participants = parseJsonField(tournament.participants);
    for (const participant of participants) {
      const name = String(participant?.team || "").trim();
      if (!name) continue;
      const normalized = normalizeLookupValue(name);
      if (createdNames.has(normalized)) continue;
      if (isPlaceholderTeamName(name)) continue;
      if (resolveTeamRecord(teamLookup, name)) continue;

      insertTeam.run(
        randomUUID(),
        name,
        name.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase() || "TBD",
        null,
        tournament.game || "PUBG Mobile",
        null,
        0, 0, 0, 0,
        now, now,
        "system:participant-sync",
      );
      createdNames.add(normalized);
    }
  }

  if (createdNames.size > 0) {
    console.log(`[participant-sync] created ${createdNames.size} missing team(s): ${[...createdNames].join(", ")}`);
  }
}

export function backfillNormalizedData() {
  const tournaments = db
    .prepare(
      "SELECT id, name, tier, start_date, end_date, stages, participants, rankings, created_date, updated_date FROM tournaments",
    )
    .all();
  const teamLookup = buildTeamLookup();
  const playerLookup = buildPlayerLookup();
  const now = new Date().toISOString();

  const clearTables = [
    "stage_match_breakdown",
    "stage_standings",
    "tournament_participant_players",
    "tournament_participant_stage_entries",
    "tournament_participants",
    "tournament_stage_groups",
    "tournament_stages",
    "player_team_history",
    "player_aliases",
    "team_aliases",
  ];

  const insertTeamAlias = db.prepare(`
    INSERT INTO team_aliases (id, team_id, alias, normalized_alias, alias_type, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPlayerAlias = db.prepare(`
    INSERT INTO player_aliases (id, player_id, alias, normalized_alias, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertPlayerTeamHistory = db.prepare(`
    INSERT INTO player_team_history (id, player_id, team_id, joined_date, left_date, role, source, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertStage = db.prepare(`
    INSERT INTO tournament_stages (id, tournament_id, name, slug, stage_order, stage_type, status, summary, rules, map_rotation, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertGroup = db.prepare(`
    INSERT INTO tournament_stage_groups (id, stage_id, group_name, group_order, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertParticipant = db.prepare(`
    INSERT INTO tournament_participants (id, tournament_id, team_id, seed, invite_status, start_stage_id, final_stage_id, final_rank, prize_amount, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertParticipantStageEntry = db.prepare(`
    INSERT INTO tournament_participant_stage_entries (id, participant_id, stage_id, group_id, phase_label, placement, qualified, eliminated, notes, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertParticipantPlayer = db.prepare(`
    INSERT INTO tournament_participant_players (id, participant_id, player_id, player_name, country, role, is_captain, is_substitute, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertStageStanding = db.prepare(`
    INSERT INTO stage_standings (id, tournament_id, stage_id, group_id, team_id, rank, matches_played, wins, place_points, elim_points, total_points, progression_status, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  runInTransaction(() => {
    const seenTeamAliases = new Set();
    const seenPlayerAliases = new Set();
    const seenPlayerTeamHistory = new Set();

    for (const table of clearTables) {
      db.prepare(`DELETE FROM ${table}`).run();
    }

    const teams = db
      .prepare("SELECT id, name, tag, created_date, updated_date FROM teams")
      .all();
    for (const team of teams) {
      const canonicalKey = canonicalizeTeamLookupValue(team.name || team.tag);
      const entries = new Map([
        [
          normalizeLookupValue(team.name),
          { alias: team.name, type: "canonical_name" },
        ],
        [
          normalizeLookupValue(team.tag),
          { alias: team.tag, type: "canonical_tag" },
        ],
      ]);
      const variantAliases = TEAM_ALIAS_VARIANTS.get(canonicalKey) || new Set();
      for (const variant of variantAliases) {
        if (!variant) continue;
        entries.set(normalizeLookupValue(variant), {
          alias: variant,
          type: "canonical_variant",
        });
      }
      for (const [normalizedAlias, value] of entries.entries()) {
        if (!normalizedAlias || !value.alias) continue;
        const aliasKey = `${team.id}:${normalizedAlias}`;
        if (seenTeamAliases.has(aliasKey)) continue;
        seenTeamAliases.add(aliasKey);
        insertTeamAlias.run(
          randomUUID(),
          team.id,
          value.alias,
          normalizedAlias,
          value.type,
          team.created_date || now,
          team.updated_date || now,
        );
      }
    }

    for (const player of playerLookup.rows) {
      const normalizedIgn = normalizeLookupValue(player.ign);
      if (normalizedIgn) {
        const aliasKey = `${player.id}:${normalizedIgn}`;
        if (!seenPlayerAliases.has(aliasKey)) {
          seenPlayerAliases.add(aliasKey);
          insertPlayerAlias.run(
            randomUUID(),
            player.id,
            player.ign,
            normalizedIgn,
            now,
            now,
          );
        }
      }
      if (player.team_id) {
        const historyKey = `${player.id}:${player.team_id}:current_player_record`;
        if (!seenPlayerTeamHistory.has(historyKey)) {
          seenPlayerTeamHistory.add(historyKey);
          insertPlayerTeamHistory.run(
            randomUUID(),
            player.id,
            player.team_id,
            null,
            null,
            player.role || null,
            "current_player_record",
            now,
            now,
          );
        }
      }
    }

    for (const tournament of tournaments) {
      const stages = parseJsonField(tournament.stages);
      const participants = parseJsonField(tournament.participants);
      const rankings = parseJsonField(tournament.rankings);

      const stageRows = [];
      const stageMetaByName = new Map();
      const knownStageNames = new Set();

      stages.forEach((stage, index) => {
        const stageName = stage?.name || `Stage ${index + 1}`;
        knownStageNames.add(stageName);
        stageRows.push({
          name: stageName,
          order: Number(stage?.order || index + 1),
          status: stage?.status || null,
          summary: stage?.summary || null,
          rules: stage?.rules || null,
          mapRotation: Array.isArray(stage?.mapRotation)
            ? stage.mapRotation
            : [],
          standings: Array.isArray(stage?.standings) ? stage.standings : [],
        });
      });

      participants.forEach((participant) => {
        const phaseStageName = getPhaseStageName(participant?.phase);
        if (phaseStageName && !knownStageNames.has(phaseStageName)) {
          knownStageNames.add(phaseStageName);
          stageRows.push({
            name: phaseStageName,
            order: stageRows.length + 1,
            status: null,
            summary: null,
            rules: null,
            mapRotation: [],
            standings: [],
          });
        }
      });

      stageRows.sort((a, b) => a.order - b.order);

      for (const stage of stageRows) {
        const stageId = randomUUID();
        stageMetaByName.set(stage.name, { id: stageId, name: stage.name });
        insertStage.run(
          stageId,
          tournament.id,
          stage.name,
          slugify(stage.name),
          stage.order,
          inferStageType(stage.name),
          stage.status,
          stage.summary,
          stage.rules,
          JSON.stringify(stage.mapRotation || []),
          tournament.created_date || now,
          tournament.updated_date || now,
        );

        const groupNames = new Set();
        participants.forEach((participant) => {
          if (getPhaseStageName(participant?.phase) === stage.name) {
            const phaseGroup = getPhaseGroupName(participant?.phase);
            if (phaseGroup) groupNames.add(phaseGroup);
          }
        });
        (stage.mapRotation || []).forEach((rotationRow) => {
          ["day1", "day2", "day3", "day4"].forEach((dayKey) => {
            const value = rotationRow?.[dayKey];
            if (value) groupNames.add(`Group ${String(value).toUpperCase()}`);
          });
        });
        (stage.standings || []).forEach((entry) => {
          if (entry?.grp)
            groupNames.add(`Group ${String(entry.grp).toUpperCase()}`);
          if (entry?.group)
            groupNames.add(
              String(entry.group).startsWith("Group ")
                ? entry.group
                : `Group ${String(entry.group).toUpperCase()}`,
            );
        });

        [...groupNames]
          .toSorted((a, b) => a.localeCompare(b))
          .forEach((groupName, groupIndex) => {
            const groupId = randomUUID();
            insertGroup.run(
              groupId,
              stageId,
              groupName,
              groupIndex + 1,
              tournament.created_date || now,
              tournament.updated_date || now,
            );
          });
      }

      const stageGroups = db
        .prepare(
          `
        SELECT g.id, g.group_name, g.stage_id, s.name AS stage_name
        FROM tournament_stage_groups g
        JOIN tournament_stages s ON s.id = g.stage_id
        WHERE s.tournament_id = ?
      `,
        )
        .all(tournament.id);
      const groupIdByStageAndName = new Map(
        stageGroups.map((group) => [
          `${group.stage_name}::${group.group_name}`,
          group.id,
        ]),
      );

      const rankingMap = new Map();
      rankings.forEach((entry, index) => {
        const key = normalizeLookupValue(entry?.team || entry?.name);
        if (!key) return;
        rankingMap.set(key, {
          rank: Number(entry?.placement || entry?.rank || index + 1),
          prize: entry?.prize || entry?.prize_amount || null,
          stageName: entry?.stage || entry?.phase || null,
        });
      });

      const participantIdByTeamKey = new Map();
      const participantStageSeen = new Set();
      const participantPlayerSeen = new Set();

      participants.forEach((participant, participantIndex) => {
        const teamRecord = resolveTeamRecord(teamLookup, participant?.team);
        if (!teamRecord) return;

        const participantKey = normalizeLookupValue(participant.team);
        const canonicalParticipantKey = `team:${teamRecord.id}`;
        let participantId = participantIdByTeamKey.get(canonicalParticipantKey);
        if (!participantId) {
          const phaseStageName = getPhaseStageName(participant?.phase);
          const ranking = rankingMap.get(participantKey);
          participantId = randomUUID();
          participantIdByTeamKey.set(canonicalParticipantKey, participantId);
          insertParticipant.run(
            participantId,
            tournament.id,
            teamRecord.id,
            Number.isFinite(Number(participant?.placement))
              ? Number(participant.placement)
              : participantIndex + 1,
            participant?.invite_status || participant?.status || null,
            phaseStageName
              ? stageMetaByName.get(phaseStageName)?.id || null
              : null,
            ranking?.stageName
              ? stageMetaByName.get(ranking.stageName)?.id || null
              : null,
            ranking?.rank ||
              (Number.isFinite(Number(participant?.placement))
                ? Number(participant.placement)
                : null),
            ranking?.prize || null,
            tournament.created_date || now,
            tournament.updated_date || now,
          );
        }

        if (participantKey) {
          const aliasKey = `${teamRecord.id}:${participantKey}`;
          if (!seenTeamAliases.has(aliasKey)) {
            seenTeamAliases.add(aliasKey);
            insertTeamAlias.run(
              randomUUID(),
              teamRecord.id,
              participant.team,
              participantKey,
              "tournament_participant",
              tournament.created_date || now,
              tournament.updated_date || now,
            );
          }
        }

        const phaseStageName = getPhaseStageName(participant?.phase);
        const phaseGroupName = getPhaseGroupName(participant?.phase);
        const stageId = phaseStageName
          ? stageMetaByName.get(phaseStageName)?.id || null
          : null;
        const groupId =
          phaseStageName && phaseGroupName
            ? groupIdByStageAndName.get(
                `${phaseStageName}::${phaseGroupName}`,
              ) || null
            : null;
        const stageEntryKey = `${participantId}:${stageId || "none"}:${groupId || "none"}`;
        if (stageId && !participantStageSeen.has(stageEntryKey)) {
          participantStageSeen.add(stageEntryKey);
          insertParticipantStageEntry.run(
            randomUUID(),
            participantId,
            stageId,
            groupId,
            participant?.phase || null,
            Number.isFinite(Number(participant?.placement))
              ? Number(participant.placement)
              : null,
            0,
            0,
            null,
            tournament.created_date || now,
            tournament.updated_date || now,
          );
        }

        (Array.isArray(participant?.players)
          ? participant.players
          : []
        ).forEach((playerEntry) => {
          const playerName =
            typeof playerEntry === "string"
              ? playerEntry
              : playerEntry?.name ||
                playerEntry?.ign ||
                playerEntry?.player_name ||
                null;
          if (!playerName) return;
          const playerKey = `${participantId}:${normalizeLookupValue(playerName)}`;
          if (participantPlayerSeen.has(playerKey)) return;
          participantPlayerSeen.add(playerKey);

          const playerRecord = resolvePlayerRecord(
            playerLookup,
            playerName,
            teamRecord.id,
          );
          const normalizedPlayerName = normalizeLookupValue(playerName);
          if (playerRecord?.id && normalizedPlayerName) {
            const aliasKey = `${playerRecord.id}:${normalizedPlayerName}`;
            if (!seenPlayerAliases.has(aliasKey)) {
              seenPlayerAliases.add(aliasKey);
              insertPlayerAlias.run(
                randomUUID(),
                playerRecord.id,
                playerName,
                normalizedPlayerName,
                tournament.created_date || now,
                tournament.updated_date || now,
              );
            }
            const historyKey = `${playerRecord.id}:${teamRecord.id}:tournament_participant:${tournament.id}`;
            if (!seenPlayerTeamHistory.has(historyKey)) {
              seenPlayerTeamHistory.add(historyKey);
              insertPlayerTeamHistory.run(
                randomUUID(),
                playerRecord.id,
                teamRecord.id,
                tournament.start_date || null,
                tournament.end_date || null,
                typeof playerEntry === "object"
                  ? playerEntry?.role || playerRecord?.role || null
                  : playerRecord?.role || null,
                `tournament_participant:${tournament.id}`,
                tournament.created_date || now,
                tournament.updated_date || now,
              );
            }
          }
          insertParticipantPlayer.run(
            randomUUID(),
            participantId,
            playerRecord?.id || null,
            playerName,
            typeof playerEntry === "object"
              ? playerEntry?.country || null
              : null,
            typeof playerEntry === "object" ? playerEntry?.role || null : null,
            typeof playerEntry === "object" && playerEntry?.is_captain ? 1 : 0,
            typeof playerEntry === "object" && playerEntry?.is_substitute
              ? 1
              : 0,
            tournament.created_date || now,
            tournament.updated_date || now,
          );
        });
      });

      stageRows.forEach((stage) => {
        const stageId = stageMetaByName.get(stage.name)?.id;
        if (!stageId || !Array.isArray(stage.standings)) return;
        const seenStageStandingKeys = new Set();

        stage.standings.forEach((entry) => {
          const teamRecord = resolveTeamRecord(teamLookup, entry?.team);
          if (!teamRecord) return;
          const groupName = entry?.grp
            ? `Group ${String(entry.grp).toUpperCase()}`
            : entry?.group
              ? String(entry.group).startsWith("Group ")
                ? entry.group
                : `Group ${String(entry.group).toUpperCase()}`
              : null;
          const groupId = groupName
            ? groupIdByStageAndName.get(`${stage.name}::${groupName}`) || null
            : null;
          const standingKey = `${stageId}::${groupId || "overall"}::${teamRecord.id}`;
          if (seenStageStandingKeys.has(standingKey)) return;
          seenStageStandingKeys.add(standingKey);
          insertStageStanding.run(
            randomUUID(),
            tournament.id,
            stageId,
            groupId,
            teamRecord.id,
            Number.isFinite(Number(entry?.placement))
              ? Number(entry.placement)
              : null,
            Number(entry?.matches || entry?.m || 0),
            Number(entry?.wwcd || entry?.wins || 0),
            Number(entry?.pos || entry?.place || entry?.place_points || 0),
            Number(
              entry?.elimins ||
                entry?.elims ||
                entry?.kills ||
                entry?.elim_points ||
                0,
            ),
            Number(entry?.points || entry?.pts || entry?.total_points || 0),
            entry?.outcome || null,
            tournament.created_date || now,
            tournament.updated_date || now,
          );
        });
      });
    }
  });
}

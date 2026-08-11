import { randomUUID } from "node:crypto";
import { db, entityConfigs, normalizeRecord } from "../db.js";
import { applyTournamentReadOverrides } from "../tournamentOverrides.js";

export function normalizeTournamentPayload(row) {
  return applyTournamentReadOverrides(normalizeRecord(entityConfigs.Tournament, row));
}

function deriveStandingsFromMatchResults(tournamentId, stages, stageGroups) {
  if (!stages.length) return [];

  const rows = db
    .prepare(
      `
      SELECT
        mr.team_id,
        mr.placement,
        mr.kill_points,
        mr.placement_points,
        mr.total_points,
        mr.matches_count,
        mr.wins_count,
        mr.stage,
        m.group_name,
        tm.name AS team_name,
        tm.tag AS team_tag,
        tm.logo_url AS team_logo_url
      FROM match_results mr
      LEFT JOIN matches m ON m.id = mr.match_id
      JOIN teams tm ON tm.id = mr.team_id
      WHERE mr.tournament_id = ?
        AND COALESCE(NULLIF(mr.publication_status, ''), 'published') = 'published'
    `,
    )
    .all(tournamentId);

  if (!rows.length) return [];

  const stageIdByName = new Map(stages.map((stage) => [stage.name, stage.id]));
  const groupIdByStageAndName = new Map(
    stageGroups.map((group) => [
      `${group.stage_id}::${group.group_name}`,
      group.id,
    ]),
  );
  const grouped = new Map();

  rows.forEach((row) => {
    const stageId = stageIdByName.get(row.stage);
    if (!stageId) return;

    const stage = stages.find((entry) => entry.id === stageId);
    const stageType = String(stage?.stage_type || "").toLowerCase();
    const normalizedGroupName =
      row.group_name && stageType !== "grand_finals"
        ? String(row.group_name).startsWith("Group ")
          ? row.group_name
          : `Group ${String(row.group_name)
              .replace(/^group\s+/i, "")
              .toUpperCase()}`
        : null;
    const groupId = normalizedGroupName
      ? groupIdByStageAndName.get(`${stageId}::${normalizedGroupName}`) || null
      : null;
    const aggregateKey = `${stageId}::${groupId || "overall"}::${row.team_id}`;

    const existing = grouped.get(aggregateKey) || {
      id: randomUUID(),
      tournament_id: tournamentId,
      stage_id: stageId,
      group_id: groupId,
      team_id: row.team_id,
      matches_played: 0,
      wins: 0,
      place_points: 0,
      elim_points: 0,
      total_points: 0,
      placement_sum: 0,
      team: {
        id: row.team_id,
        name: row.team_name,
        tag: row.team_tag,
        logo_url: row.team_logo_url,
      },
      stage_name: row.stage,
      group_name: normalizedGroupName,
      progression_status: null,
    };

    const wins =
      Number.isFinite(Number(row.wins_count)) && Number(row.wins_count) > 0
        ? Number(row.wins_count)
        : Number(row.placement) === 1
          ? 1
          : 0;

    existing.matches_played += Number(row.matches_count) || 1;
    existing.wins += wins;
    existing.place_points += Number(row.placement_points) || 0;
    existing.elim_points += Number(row.kill_points) || 0;
    existing.total_points += Number(row.total_points) || 0;
    existing.placement_sum += Number(row.placement) || 0;
    grouped.set(aggregateKey, existing);
  });

  const listsByBoard = new Map();
  [...grouped.values()].forEach((entry) => {
    const boardKey = `${entry.stage_id}::${entry.group_id || "overall"}`;
    const list = listsByBoard.get(boardKey) || [];
    list.push(entry);
    listsByBoard.set(boardKey, list);
  });

  const derived = [];
  listsByBoard.forEach((list) => {
    list
      .map((entry) => ({
        ...entry,
        average_elimination_position:
          (entry.matches_played || 0) > 0
            ? entry.placement_sum / entry.matches_played
            : null,
      }))
      .sort((a, b) => {
        if ((b.total_points || 0) !== (a.total_points || 0))
          return (b.total_points || 0) - (a.total_points || 0);
        if ((b.wins || 0) !== (a.wins || 0))
          return (b.wins || 0) - (a.wins || 0);
        if ((b.place_points || 0) !== (a.place_points || 0))
          return (b.place_points || 0) - (a.place_points || 0);
        const aAverage = Number.isFinite(a.average_elimination_position)
          ? a.average_elimination_position
          : Number.POSITIVE_INFINITY;
        const bAverage = Number.isFinite(b.average_elimination_position)
          ? b.average_elimination_position
          : Number.POSITIVE_INFINITY;
        if (aAverage !== bAverage) return aAverage - bAverage;
        if ((b.elim_points || 0) !== (a.elim_points || 0))
          return (b.elim_points || 0) - (a.elim_points || 0);
        return String(a.team?.name || "").localeCompare(
          String(b.team?.name || ""),
        );
      })
      .forEach((entry, index) => {
        derived.push({
          ...entry,
          rank: index + 1,
        });
      });
  });

  return derived;
}

export function getNormalizedTournament(id) {
  const tournamentRow = db
    .prepare("SELECT * FROM tournaments WHERE id = ?")
    .get(id);
  if (!tournamentRow) return null;

  const tournament = normalizeTournamentPayload(tournamentRow);
  const stages = db
    .prepare(
      "SELECT * FROM tournament_stages WHERE tournament_id = ? ORDER BY stage_order ASC, name ASC",
    )
    .all(id)
    .map((row) => normalizeRecord(entityConfigs.TournamentStage, row));

  const stageIds = stages.map((stage) => stage.id);
  const stageGroups = stageIds.length
    ? db
        .prepare(
          `SELECT * FROM tournament_stage_groups WHERE stage_id IN (${stageIds.map(() => "?").join(", ")}) ORDER BY group_order ASC, group_name ASC`,
        )
        .all(...stageIds)
        .map((row) => normalizeRecord(entityConfigs.TournamentStageGroup, row))
    : [];

  const participants = db
    .prepare(
      `
      SELECT tp.*, tm.name AS team_name, tm.tag AS team_tag, tm.logo_url AS team_logo_url
      FROM tournament_participants tp
      JOIN teams tm ON tm.id = tp.team_id
      WHERE tp.tournament_id = ?
      ORDER BY COALESCE(tp.final_rank, 9999), tm.name ASC
    `,
    )
    .all(id)
    .map((row) => ({
      ...normalizeRecord(entityConfigs.TournamentParticipant, row),
      team: {
        id: row.team_id,
        name: row.team_name,
        tag: row.team_tag,
        logo_url: row.team_logo_url,
      },
    }));

  const participantIds = participants.map((participant) => participant.id);
  const participantStageEntries = participantIds.length
    ? db
        .prepare(
          `
          SELECT tse.*, ts.name AS stage_name, tsg.group_name
          FROM tournament_participant_stage_entries tse
          JOIN tournament_stages ts ON ts.id = tse.stage_id
          LEFT JOIN tournament_stage_groups tsg ON tsg.id = tse.group_id
          WHERE tse.participant_id IN (${participantIds.map(() => "?").join(", ")})
          ORDER BY ts.stage_order ASC, COALESCE(tsg.group_order, 999), tse.placement ASC
        `,
        )
        .all(...participantIds)
        .map((row) =>
          normalizeRecord(entityConfigs.TournamentParticipantStageEntry, row),
        )
    : [];

  const participantPlayers = participantIds.length
    ? db
        .prepare(
          `
          SELECT tpp.*, p.ign AS player_ign, p.role AS player_role, p.photo_url AS player_photo_url
          FROM tournament_participant_players tpp
          LEFT JOIN players p ON p.id = tpp.player_id
          WHERE tpp.participant_id IN (${participantIds.map(() => "?").join(", ")})
          ORDER BY tpp.player_name ASC
        `,
        )
        .all(...participantIds)
        .map((row) =>
          normalizeRecord(entityConfigs.TournamentParticipantPlayer, row),
        )
    : [];

  const standings = stageIds.length
    ? db
        .prepare(
          `
          SELECT ss.*, ts.name AS stage_name, tsg.group_name, tm.name AS team_name, tm.tag AS team_tag, tm.logo_url AS team_logo_url
          FROM stage_standings ss
          JOIN tournament_stages ts ON ts.id = ss.stage_id
          LEFT JOIN tournament_stage_groups tsg ON tsg.id = ss.group_id
          JOIN teams tm ON tm.id = ss.team_id
          WHERE ss.tournament_id = ?
          ORDER BY ts.stage_order ASC, COALESCE(tsg.group_order, 999), COALESCE(ss.rank, 9999), tm.name ASC
        `,
        )
        .all(id)
        .map((row) => ({
          ...normalizeRecord(entityConfigs.StageStanding, row),
          stage_name: row.stage_name,
          group_name: row.group_name,
          team: {
            id: row.team_id,
            name: row.team_name,
            tag: row.team_tag,
            logo_url: row.team_logo_url,
          },
        }))
    : [];

  const derivedStandings = deriveStandingsFromMatchResults(
    id,
    stages,
    stageGroups,
  );
  const persistedByBoard = new Map();
  standings.forEach((entry) => {
    const boardKey = `${entry.stage_id}::${entry.group_id || "overall"}`;
    const list = persistedByBoard.get(boardKey) || [];
    list.push(entry);
    persistedByBoard.set(boardKey, list);
  });

  const derivedByBoard = new Map();
  derivedStandings.forEach((entry) => {
    const boardKey = `${entry.stage_id}::${entry.group_id || "overall"}`;
    const list = derivedByBoard.get(boardKey) || [];
    list.push(entry);
    derivedByBoard.set(boardKey, list);
  });

  const selectedBoards = new Set();
  derivedByBoard.forEach((derivedList, boardKey) => {
    const persistedList = persistedByBoard.get(boardKey) || [];
    if (
      persistedList.length === 0 ||
      derivedList.length > persistedList.length
    ) {
      selectedBoards.add(boardKey);
    }
  });

  const mergedStandings = standings.filter((entry) => {
    const boardKey = `${entry.stage_id}::${entry.group_id || "overall"}`;
    return !selectedBoards.has(boardKey);
  });
  derivedStandings.forEach((entry) => {
    const boardKey = `${entry.stage_id}::${entry.group_id || "overall"}`;
    if (selectedBoards.has(boardKey)) {
      mergedStandings.push(entry);
    }
  });

  const groupedEntries = new Map();
  participantStageEntries.forEach((entry) => {
    const list = groupedEntries.get(entry.participant_id) || [];
    list.push(entry);
    groupedEntries.set(entry.participant_id, list);
  });

  const groupedPlayers = new Map();
  participantPlayers.forEach((player) => {
    const list = groupedPlayers.get(player.participant_id) || [];
    list.push(player);
    groupedPlayers.set(player.participant_id, list);
  });

  const groupedGroups = new Map();
  stageGroups.forEach((group) => {
    const list = groupedGroups.get(group.stage_id) || [];
    list.push(group);
    groupedGroups.set(group.stage_id, list);
  });

  const groupedStandings = new Map();
  mergedStandings.forEach((standing) => {
    const key = `${standing.stage_id}::${standing.group_id || "overall"}`;
    const list = groupedStandings.get(key) || [];
    list.push(standing);
    groupedStandings.set(key, list);
  });

  return {
    tournament,
    stages: stages.map((stage) => ({
      ...stage,
      groups: groupedGroups.get(stage.id) || [],
      standings: {
        overall: groupedStandings.get(`${stage.id}::overall`) || [],
        by_group: Object.fromEntries(
          (groupedGroups.get(stage.id) || []).map((group) => [
            group.group_name,
            groupedStandings.get(`${stage.id}::${group.id}`) || [],
          ]),
        ),
      },
    })),
    participants: participants.map((participant) => ({
      ...participant,
      stage_entries: groupedEntries.get(participant.id) || [],
      players: groupedPlayers.get(participant.id) || [],
    })),
  };
}

const PMWC_OVERRIDE_TOURNAMENTS = new Set(["PUBG Mobile World Cup 2026"]);

export function getNormalizedTournamentSafe(tournamentId) {
  if (!tournamentId) return null;
  try {
    const data = getNormalizedTournament(tournamentId);
    if (data?.tournament && PMWC_OVERRIDE_TOURNAMENTS.has(data.tournament.name)) {
      return { ...data, participants: [] };
    }
    return data;
  } catch {
    return null;
  }
}

import { entityConfigs, normalizeRecord } from "../db.js";
import { PMGC_2025_RANKINGS } from "./data/pmgc2025Stats.js";
import { PMWC_2026_RANKINGS } from "./data/pmwc2026Stats.js";
import {
  PMGC_2025_AWARDS,
  PMGC_2025_PARTICIPANTS,
  PMGC_2025_PRIZE_BREAKDOWN,
} from "./data/pmgc2025.js";
import {
  PMWC_2026_AWARDS,
  PMWC_2026_PARTICIPANTS,
  PMWC_2026_PRIZE_BREAKDOWN,
} from "./data/pmwc2026.js";

const JSON_FIELDS = [
  "stages",
  "participants",
  "awards",
  "rankings",
  "prize_breakdown",
  "calendar",
];

function normalizePlacement(value) {
  const number = Number.parseInt(String(value || "").replace(/\D/g, ""), 10);
  return Number.isFinite(number) ? number : 999;
}

function buildPlayerToTeam(participants, fallbackAliases = {}) {
  const playerToTeam = {};
  for (const participant of participants) {
    for (const player of participant.players || []) {
      playerToTeam[player.toLowerCase()] = participant.team;
    }
  }
  for (const [alias, team] of Object.entries(fallbackAliases)) {
    if (!playerToTeam[alias]) playerToTeam[alias] = team;
  }
  return playerToTeam;
}

function fillRankingTeams(rankings, playerToTeam) {
  return rankings.map((ranking) => ({
    ...ranking,
    entries: ranking.entries.map((entry) => ({
      ...entry,
      team:
        entry.team && entry.team !== "-"
          ? entry.team
          : playerToTeam[entry.player?.toLowerCase()] || "-",
    })),
  }));
}

const PMWC_2026_GRAND_FINALS_STANDINGS = [
  { placement: 1, team: "S2G Esports", fullTeam: "S2G Esports", matches: 18, wwcd: 3, pos: 65, place: 89, elimins: 89, elims: 89, points: 154, pts: 154 },
  { placement: 2, team: "Nongshim RedForce", fullTeam: "Nongshim RedForce", matches: 18, wwcd: 3, pos: 47, place: 102, elimins: 102, elims: 102, points: 149, pts: 149 },
  { placement: 3, team: "Aurora Gaming", fullTeam: "Aurora Gaming", matches: 18, wwcd: 2, pos: 53, place: 93, elimins: 93, elims: 93, points: 146, pts: 146 },
  { placement: 4, team: "eArena", fullTeam: "eArena", matches: 18, wwcd: 2, pos: 42, place: 98, elimins: 98, elims: 98, points: 140, pts: 140 },
  { placement: 5, team: "Tianba", fullTeam: "Tianba", matches: 18, wwcd: 2, pos: 37, place: 88, elimins: 88, elims: 88, points: 125, pts: 125 },
  { placement: 6, team: "4thrives Esports", fullTeam: "4thrives Esports", matches: 18, wwcd: 0, pos: 24, place: 88, elimins: 88, elims: 88, points: 112, pts: 112 },
  { placement: 7, team: "Team Flash", fullTeam: "Team Flash", matches: 18, wwcd: 1, pos: 41, place: 70, elimins: 70, elims: 70, points: 111, pts: 111 },
  { placement: 8, team: "Horaa Esports", fullTeam: "Horaa Esports", matches: 18, wwcd: 0, pos: 36, place: 73, elimins: 73, elims: 73, points: 109, pts: 109 },
  { placement: 9, team: "Nigma Galaxy", fullTeam: "Nigma Galaxy", matches: 18, wwcd: 1, pos: 35, place: 71, elimins: 71, elims: 71, points: 106, pts: 106 },
  { placement: 10, team: "FURIA", fullTeam: "FURIA", matches: 18, wwcd: 1, pos: 47, place: 58, elimins: 58, elims: 58, points: 105, pts: 105 },
  { placement: 11, team: "ULF Esports", fullTeam: "ULF Esports", matches: 18, wwcd: 1, pos: 26, place: 73, elimins: 73, elims: 73, points: 99, pts: 99 },
  { placement: 12, team: "Team Vitality", fullTeam: "Team Vitality", matches: 18, wwcd: 0, pos: 32, place: 67, elimins: 67, elims: 67, points: 99, pts: 99 },
  { placement: 13, team: "GodLike Esports", fullTeam: "GodLike Esports", matches: 18, wwcd: 1, pos: 18, place: 66, elimins: 66, elims: 66, points: 84, pts: 84 },
  { placement: 14, team: "AlUla Club", fullTeam: "AlUla Club", matches: 18, wwcd: 1, pos: 32, place: 51, elimins: 51, elims: 51, points: 83, pts: 83 },
  { placement: 15, team: "Orangutan", fullTeam: "Orangutan", matches: 18, wwcd: 0, pos: 16, place: 60, elimins: 60, elims: 60, points: 76, pts: 76 },
  { placement: 16, team: "IDA Esports", fullTeam: "IDA Esports", matches: 18, wwcd: 0, pos: 25, place: 44, elimins: 44, elims: 44, points: 69, pts: 69 },
];

function transformPmwStages(tournament, survivalTop, finalsStageName) {
  return Array.isArray(tournament.stages)
    ? tournament.stages.map((stage) => {
        if (!Array.isArray(stage.standings)) return stage;

        return {
          ...stage,
          standings: stage.standings.map((entry) => {
            const pos = normalizePlacement(entry.placement);
            let outcome = entry.outcome || entry.progression_status || null;

            if (stage.name === "Group Stage") {
              const participant = tournament.participants.find(
                (p) => p.team === entry.team || p.team === entry.fullTeam,
              );
              const group = participant ? participant.phase : entry.grp || "Unknown";
              if (pos >= 1 && pos <= 12) outcome = "Advances to Grand Finals";
              else if (pos >= 13 && pos <= 24) outcome = "Advances to Survival Stage";
              return {
                ...entry,
                outcome,
                progression_status: outcome,
                group: group.replace("Group Stage - ", ""),
                grp: group.replace("Group Stage - ", ""),
              };
            }

            if (stage.name === "Survival Stage") {
              if (pos >= 1 && pos <= survivalTop) outcome = "Advances to Grand Finals";
              else if (pos > survivalTop) outcome = "Eliminated";
            } else if (stage.name === finalsStageName) {
              if (pos === 1) outcome = "Champion";
              else if (pos === 2) outcome = "Runner-up";
              else if (pos === 3) outcome = "3rd Place";
            }

            return { ...entry, outcome, progression_status: outcome };
          }),
        };
      })
    : tournament.stages;
}

function transformPmw2026Stages(tournament) {
  return Array.isArray(tournament.stages)
    ? tournament.stages.map((stage) => {
        let sourceStage = stage;
        if (
          stage.name === "Grand Finals" &&
          (!Array.isArray(stage.standings) || stage.standings.length === 0)
        ) {
          sourceStage = {
            ...stage,
            status: "completed",
            standings: PMWC_2026_GRAND_FINALS_STANDINGS,
          };
        }

        if (!Array.isArray(sourceStage.standings)) return sourceStage;

        const groupCounters = {};

        return {
          ...sourceStage,
          standings: sourceStage.standings.map((entry) => {
            let pos = normalizePlacement(entry.placement);
            let outcome = entry.outcome || entry.progression_status || null;

            if (sourceStage.name === "Group Stage") {
              const participant = PMWC_2026_PARTICIPANTS.find(
                (p) => p.team === entry.team || p.team === entry.fullTeam,
              );
              const group = participant ? participant.phase : "Unknown";
              groupCounters[group] = (groupCounters[group] || 0) + 1;
              pos = groupCounters[group];

              if (pos >= 1 && pos <= 5) outcome = "Advances to Grand Finals";
              else if (pos >= 6 && pos <= 13) outcome = "Advances to Survival Stage";
              else if (pos >= 14) outcome = "Eliminated";

              return {
                ...entry,
                outcome,
                progression_status: outcome,
                group: group.replace("Group Stage - ", ""),
                grp: group.replace("Group Stage - ", ""),
              };
            }

            if (sourceStage.name === "Survival Stage") {
              if (pos >= 1 && pos <= 6) outcome = "Advances to Grand Finals";
              else if (pos >= 7) outcome = "Eliminated";
            } else if (sourceStage.name === "Grand Finals") {
              if (pos === 1) outcome = "Champion";
              else if (pos === 2) outcome = "Runner-up";
              else if (pos === 3) outcome = "3rd Place";
            }

            return { ...entry, outcome, progression_status: outcome };
          }),
        };
      })
    : tournament.stages;
}

function transformPmgc2025Stages(tournament) {
  return Array.isArray(tournament.stages)
    ? tournament.stages.map((stage) => {
        if (!Array.isArray(stage.standings)) return stage;

        const groupCounters = {};

        return {
          ...stage,
          standings: stage.standings.map((entry) => {
            let pos = normalizePlacement(entry.placement);
            let outcome = entry.outcome || entry.progression_status || null;

            if (stage.name === "Group Stage") {
              const participant = PMGC_2025_PARTICIPANTS.find(
                (p) => p.team === entry.team || p.team === entry.fullTeam,
              );
              const group = participant ? participant.phase : entry.grp || "Unknown";
              groupCounters[group] = (groupCounters[group] || 0) + 1;
              pos = groupCounters[group];

              if (pos >= 1 && pos <= 3) outcome = "Advances to Grand Finals";
              else if (pos >= 4 && pos <= 11) outcome = "Advances to Last Chance";
              else if (pos >= 12) outcome = "Eliminated";

              return {
                ...entry,
                outcome,
                progression_status: outcome,
                group: group.replace("Group Stage - ", ""),
                grp: group.replace("Group Stage - ", ""),
              };
            }

            if (stage.name === "The Gauntlet") {
              if (pos >= 1 && pos <= 7) outcome = "Advances to Grand Finals";
              else if (pos >= 8) outcome = "Advances to Group Stage";
            } else if (stage.name === "Last Chance") {
              if (pos >= 1 && pos <= 2) outcome = "Advances to Grand Finals";
              else if (pos >= 3) outcome = "Eliminated";
            } else if (stage.name === "Grand Finals") {
              if (pos === 1) outcome = "Champion";
              else if (pos === 2) outcome = "Runner-up";
              else if (pos === 3) outcome = "3rd Place";
            }

            return { ...entry, outcome, progression_status: outcome };
          }),
        };
      })
    : tournament.stages;
}

export function applyTournamentImportTransforms(tournament) {
  if (!tournament?.name) return tournament;

  if (tournament.name === "PUBG Mobile World Cup 2026") {
    const playerToTeam = buildPlayerToTeam(PMWC_2026_PARTICIPANTS, {
      qx: "DRX",
      silenceee: "FURIA",
      jimmy: "ThunderTalk Gaming",
      v3xxy: "Team Vitality",
      shallow: "Aurora",
      haitdami: "Aurora",
      mitraleius: "Wolves",
    });

    return {
      ...tournament,
      tier: tournament.tier || "S-Tier",
      prize_pool: "$3,025,000",
      banner_url: "/images/pubg-mobile-world-cup-2026.webp",
      participants: PMWC_2026_PARTICIPANTS,
      awards: PMWC_2026_AWARDS,
      rankings: fillRankingTeams(PMWC_2026_RANKINGS, playerToTeam),
      prize_breakdown: PMWC_2026_PRIZE_BREAKDOWN,
      max_teams: 32,
      stages: transformPmw2026Stages(tournament),
    };
  }

  if (tournament.name === "PUBG Mobile Global Championship 2025") {
    const playerToTeam = buildPlayerToTeam(PMGC_2025_PARTICIPANTS, {
      qx: "DRX",
      "3more": "R8 Esports",
    });

    return {
      ...tournament,
      tier: tournament.tier || "S-Tier",
      prize_pool: "$3,000,000",
      participants: PMGC_2025_PARTICIPANTS,
      awards: PMGC_2025_AWARDS,
      rankings: fillRankingTeams(PMGC_2025_RANKINGS, playerToTeam),
      prize_breakdown: PMGC_2025_PRIZE_BREAKDOWN,
      max_teams: 32,
      stages: transformPmgc2025Stages(tournament),
    };
  }

  if (tournament.name === "PUBG Mobile World Cup 2024") {
    return {
      ...tournament,
      prize_pool: "$3,000,000",
      max_teams: 24,
      stages: transformPmwStages(tournament, 4, "Main Tournament"),
    };
  }

  if (tournament.name === "PUBG Mobile World Cup 2025") {
    return {
      ...tournament,
      stages: transformPmwStages(tournament, 4, "Grand Finals"),
    };
  }

  return tournament;
}

function normalizeTournamentSource(tournament, db) {
  if (!tournament?.id || !db) return tournament;
  const row = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(tournament.id);
  return row ? normalizeRecord(entityConfigs.Tournament, row) : tournament;
}

export function postImportTournamentTransforms(tournament, db) {
  const source = normalizeTournamentSource(tournament, db);
  const transformed = applyTournamentImportTransforms(source);
  if (!transformed?.id || transformed === source) return;

  const assignments = [
    "tier = ?",
    "prize_pool = ?",
    "banner_url = ?",
    "max_teams = ?",
    ...JSON_FIELDS.map((field) => `${field} = ?`),
    "updated_date = ?",
  ];
  const values = [
    transformed.tier,
    transformed.prize_pool,
    transformed.banner_url,
    transformed.max_teams,
    ...JSON_FIELDS.map((field) => JSON.stringify(transformed[field] ?? [])),
    new Date().toISOString(),
    transformed.id,
  ];

  db.prepare(
    `UPDATE tournaments SET ${assignments.join(", ")} WHERE id = ?`,
  ).run(...values);
}

import { CalendarDays, Layers3, Swords, Trophy } from "lucide-react";

export const GAMES = [
  "BGMI",
  "PUBG Mobile",
  "Valorant",
  "CSGO",
  "Free Fire",
  "PUBG PC",
  "Apex Legends",
];

export const DEFAULT_STAGES = [
  {
    name: "Quarter Finals",
    order: 1,
    status: "upcoming",
    teamCount: 64,
    summary: "",
  },
  {
    name: "Wildcard",
    order: 2,
    status: "upcoming",
    teamCount: 32,
    summary: "",
  },
  {
    name: "Semi Finals",
    order: 3,
    status: "upcoming",
    teamCount: 24,
    summary: "",
  },
  {
    name: "Survival",
    order: 4,
    status: "upcoming",
    teamCount: 16,
    summary: "",
  },
  {
    name: "Grand Finals",
    order: 5,
    status: "upcoming",
    teamCount: 16,
    summary: "",
  },
];

export const EMPTY_FORM = {
  name: "",
  game: "",
  status: "upcoming",
  prize_pool: "",
  start_date: "",
  end_date: "",
  max_teams: 16,
  banner_url: "",
  description: "",
  format_overview: "",
  rules: "",
  calendarText: "",
  prizeBreakdownText: "",
  awardsText: "",
  participantsRows: [],
  rankingsText: "[]",
  stages: DEFAULT_STAGES,
};

const BULK_IMPORT_EXAMPLE = {
  standings:
    "#\tTeam\tGRP\tM\tWWCD\tPlace\tElims\tPts\n1\tTeam Soul\tC\t16\t3\t56\t116\t172\n2\tOrangutan\tB\t16\t2\t48\t102\t150",
  rankings:
    "Rank\tPlayer\tTeam\tMVP Rating\tFinishes\tDamage\tAvg. Survival\tKnocks\n#1\tDhruvG\tRapid Chaos Esports\t0.74\t53\t10056\t20:28\t45",
  participants:
    "Seed\tTeam\tStage\tGroup\tPlayers\n1\tTeam Soul\tRound 4\tC\tLEGIT, Joker, Goblin, Nakul",
};

export function normalizeImportKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[#()./%+]/g, "")
    .replace(/&/g, "and")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function numberFromImport(value) {
  const cleaned = String(value ?? "").replace(/[#,%]/g, "").trim();
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBulkTable(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .reduce((items, line) => {
      const trimmed = line.trim();
      if (trimmed && !/^\|?\s*:?-{2,}/.test(trimmed)) items.push(trimmed);
      return items;
    }, []);
  if (lines.length < 2) return [];

  const splitLine = (line) => {
    const cleaned = line.replace(/^\|/, "").replace(/\|$/, "");
    if (cleaned.includes("\t")) return cleaned.split("\t");
    if (cleaned.includes("|")) return cleaned.split("|");
    return cleaned.split(/\s{2,}/);
  };

  const headers = splitLine(lines[0]).map((header) => normalizeImportKey(header));
  return lines.slice(1).reduce((rows, line) => {
    const values = splitLine(line).map((value) => value.trim());
    if (values.length < 2) return rows;
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    rows.push(row);
    return rows;
  }, []);
}

function pickImportValue(row, keys) {
  for (const key of keys) {
    const normalized = normalizeImportKey(key);
    if (row[normalized] !== undefined && row[normalized] !== "") {
      return row[normalized];
    }
  }
  return "";
}

export function findStageIndex(stages, stageName) {
  const target = normalizeImportKey(stageName);
  return stages.findIndex((stage) => normalizeImportKey(stage.name) === target);
}

export function parseStandingRows(text) {
  return parseBulkTable(text).reduce((rows, row, index) => {
    const team = pickImportValue(row, ["team", "team_name", "name"]);
    if (!team) return rows;
    const placement = numberFromImport(pickImportValue(row, ["rank", "#", "placement"])) ?? index + 1;
    rows.push({
      placement,
      rank: placement,
      team,
      fullTeam: team,
      grp: pickImportValue(row, ["grp", "group", "group_name"]),
      matches: numberFromImport(pickImportValue(row, ["m", "matches", "matches_played"])),
      m: numberFromImport(pickImportValue(row, ["m", "matches", "matches_played"])),
      wwcd: numberFromImport(pickImportValue(row, ["wwcd", "wins"])),
      pos: numberFromImport(pickImportValue(row, ["place", "pos", "place_points", "placement_points"])),
      place: numberFromImport(pickImportValue(row, ["place", "pos", "place_points", "placement_points"])),
      elimins: numberFromImport(pickImportValue(row, ["elims", "elim", "elim_points", "eliminations", "finishes"])),
      elims: numberFromImport(pickImportValue(row, ["elims", "elim", "elim_points", "eliminations", "finishes"])),
      points: numberFromImport(pickImportValue(row, ["pts", "points", "total", "total_points"])),
      pts: numberFromImport(pickImportValue(row, ["pts", "points", "total", "total_points"])),
      outcome: pickImportValue(row, ["outcome", "status", "progression_status"]),
    });
    return rows;
  }, []);
}

function toRankingKey(label) {
  const normalized = normalizeImportKey(label);
  const aliases = {
    rank: "placement",
    player_name: "player",
    team_name: "team",
    mvp_rating: "rating",
    igl_rating: "rating",
    avg_survival: "avgSurvival",
    average_survival: "avgSurvival",
    team_avg_pts: "avgPoints",
    team_avg_points: "avgPoints",
    wwcd: "wwcd",
    top_5s: "top5s",
    top5s: "top5s",
    team_avg_survival: "teamSurvival",
    team_avg_sur: "teamSurvival",
    matches_played: "matches",
    total_dmg: "damage",
    total_damage: "damage",
    finishes: "finishes",
    elims: "finishes",
    knocks: "knocks",
  };
  return aliases[normalized] || normalized.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

export function parseRankingTable(text, title) {
  const rawLines = String(text || "")
    .split(/\r?\n/)
    .reduce((items, line) => {
      const trimmed = line.trim();
      if (trimmed && !/^\|?\s*:?-{2,}/.test(trimmed)) items.push(trimmed);
      return items;
    }, []);
  if (rawLines.length < 2) return null;
  const splitLine = (line) => {
    const cleaned = line.replace(/^\|/, "").replace(/\|$/, "");
    if (cleaned.includes("\t")) return cleaned.split("\t");
    if (cleaned.includes("|")) return cleaned.split("|");
    return cleaned.split(/\s{2,}/);
  };
  const headers = splitLine(rawLines[0]).map((header) => header.trim());
  const keys = headers.map(toRankingKey);
  const entries = rawLines.slice(1).reduce((rows, line, index) => {
    const values = splitLine(line).map((value) => value.trim());
    const entry = {};
    keys.forEach((key, valueIndex) => {
      const rawValue = values[valueIndex] ?? "";
      entry[key] = ["placement", "finishes", "damage", "knocks", "wwcd", "top5s", "matches"].includes(key)
        ? numberFromImport(rawValue) ?? rawValue
        : rawValue;
    });
    entry.placement = numberFromImport(entry.placement) ?? index + 1;
    if (entry.player) rows.push(entry);
    return rows;
  }, []);
  const columns = headers.reduce((items, label, index) => {
    const key = keys[index];
    if (!["placement", "player", "team"].includes(key)) {
      items.push({ label, key });
    }
    return items;
  }, []);
  return entries.length ? { title: title || "Imported Ranking", columns, entries } : null;
}

export function parseParticipantRows(text) {
  return parseBulkTable(text).reduce((rows, row, index) => {
    const team = pickImportValue(row, ["team", "team_name", "name"]);
    if (!team) return rows;
    const stage = pickImportValue(row, ["stage", "phase"]);
    const group = pickImportValue(row, ["group", "grp", "group_name"]);
    rows.push({
      placement: numberFromImport(pickImportValue(row, ["seed", "rank", "#"])) ?? index + 1,
      team,
      phase: group && stage ? `${stage} - ${group}` : stage,
      players: String(pickImportValue(row, ["players", "roster"]))
        .split(",")
        .flatMap((player) => {
          const trimmed = player.trim();
          return trimmed ? [trimmed] : [];
        }),
    });
    return rows;
  }, []);
}

export function getTournamentBackupPayload(tournament) {
  if (!tournament) return null;
  const {
    id,
    created_date,
    updated_date,
    created_by,
    ...payload
  } = tournament;
  return payload;
}

export function downloadTournamentBackup(tournament) {
  const payload = getTournamentBackupPayload(tournament);
  if (!payload || typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  const slug = String(tournament.name || "tournament")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  anchor.href = url;
  anchor.download = `${slug || "tournament"}-backup.json`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export function serializeRows(items = [], fields = [], lastFieldFormatter) {
  return items
    .map((item) =>
      fields
        .map((field, index) => {
          if (lastFieldFormatter && index === fields.length - 1) {
            return lastFieldFormatter(item[field], item);
          }
          return item[field] ?? "";
        })
        .join(" | "),
    )
    .join("\n");
}

export function parseRows(text, fields = [], lastFieldParser) {
  return text
    .split("\n")
    .reduce((rows, line) => {
      const trimmed = line.trim();
      if (!trimmed) return rows;
      const parts = trimmed.split("|").map((part) => part.trim());
      const entry = {};
      fields.forEach((field, index) => {
        const value = parts[index] ?? "";
        entry[field] =
          lastFieldParser && index === fields.length - 1
            ? lastFieldParser(value)
            : value;
      });
      rows.push(entry);
      return rows;
    }, []);
}

function splitParticipantPhase(phase = "") {
  const match = String(phase).match(/^(.+?)\s+-\s+(Group\s+.*)$/i);
  return match
    ? { stage: match[1].trim(), group: match[2].trim() }
    : { stage: String(phase || "").trim(), group: "" };
}

export function serializeParticipants(items = []) {
  return (items || []).map((item) => {
    const split = splitParticipantPhase(item.phase);
    return {
      placement: item.placement ?? "",
      team: item.team ?? "",
      stage: item.stage || split.stage || "",
      group_name: item.group_name || split.group || "",
      playersText: Array.isArray(item.players) ? item.players.join(", ") : "",
    };
  });
}

export function normalizeParticipantRows(items = []) {
  return items.reduce((rows, item) => {
      const stage = String(item.stage || "").trim();
      const groupName = String(item.group_name || "").trim();
      const phase = groupName && stage ? `${stage} - ${groupName}` : stage;

      const entry = {
        placement: item.placement ? Number(item.placement) : undefined,
        team: String(item.team || "").trim(),
        phase,
        players: String(item.playersText || "")
          .split(",")
          .flatMap((player) => {
            const trimmed = player.trim();
            return trimmed ? [trimmed] : [];
          }),
      };
      if (entry.team) rows.push(entry);
      return rows;
    }, []);
}

export function normalizeStages(stages = []) {
  return stages.reduce((items, stage, index) => {
    if (!stage.name?.trim()) return items;
    const { mapRotationText, ...rest } = stage;
    items.push({ ...rest,
      name: stage.name.trim(),
      order: index + 1,
      teamCount: stage.teamCount ? Number(stage.teamCount) : undefined,
      mapRotation: parseRows(stage.mapRotationText || "", [
        "match",
        "map",
        "day1",
        "day2",
        "day3",
        "day4Map",
        "day4",
      ]).reduce((rows, row) => {
        const normalizedRow = {
          match: row.match ? Number(row.match) : undefined,
          map: row.map || "",
          day1: row.day1 || "",
          day2: row.day2 || "",
          day3: row.day3 || "",
          day4Map: row.day4Map || "",
          day4: row.day4 || "",
        };
        if (
          normalizedRow.match ||
          normalizedRow.map ||
          normalizedRow.day1 ||
          normalizedRow.day2 ||
          normalizedRow.day3 ||
          normalizedRow.day4Map ||
          normalizedRow.day4
        ) {
          rows.push(normalizedRow);
        }
        return rows;
      }, []),
      summary: stage.summary || "",
    });
    return items;
  }, []);
}

export const BULK_IMPORT_INITIAL_STATE = {
  mode: "standings",
  tournamentId: "",
  stageName: "",
  rankingTitle: "MVP",
  pasteText: BULK_IMPORT_EXAMPLE.standings,
  restoreText: "",
};

export function bulkImportReducer(state, action) {
  if (action.type === "setMode") {
    return {
      ...state,
      mode: action.mode,
      pasteText: BULK_IMPORT_EXAMPLE[action.mode] || "",
    };
  }
  if (action.type === "setField") {
    return { ...state, [action.field]: action.value };
  }
  return state;
}

export function formatAdminDateRange(startDate, endDate) {
  const formatDate = (value) => {
    if (!value) return "";
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  if (start && end) return `${start} - ${end}`;
  return start || end || "Dates not set";
}

export function getTournamentStatCards(tournaments) {
  const active = tournaments.filter((tournament) => tournament.status !== "completed");
  const ongoing = tournaments.filter((tournament) => tournament.status === "ongoing");
  const upcoming = tournaments.filter((tournament) => tournament.status === "upcoming");
  const totalStages = active.reduce(
    (sum, tournament) => sum + (tournament.stages?.length || 0),
    0,
  );

  return [
    { label: "Active events", value: active.length, icon: Trophy },
    { label: "Ongoing", value: ongoing.length, icon: Swords },
    { label: "Upcoming", value: upcoming.length, icon: CalendarDays },
    { label: "Stage blocks", value: totalStages, icon: Layers3 },
  ];
}

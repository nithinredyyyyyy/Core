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

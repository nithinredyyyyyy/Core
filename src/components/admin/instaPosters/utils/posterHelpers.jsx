import { Award, Medal, Newspaper, ShieldCheck, Table2, Trophy, Users } from "lucide-react";
import { BMPS_2026_ROSTERS } from "@/lib/bmps2026Rosters";

export const POSTER_MODES = [
  { id: "standings", label: "Standings", icon: Table2 },
  { id: "roster", label: "Roster Update", icon: Users },
  { id: "transfer", label: "Transfer", icon: Users },
  { id: "news", label: "News", icon: Newspaper },
  { id: "bestIgl", label: "Best IGL", icon: ShieldCheck },
  { id: "fmvp", label: "FMVP", icon: Award },
  { id: "mvp", label: "MVP", icon: Medal },
  { id: "qualified", label: "Qualified Teams", icon: ShieldCheck },
  { id: "champion", label: "Champion", icon: Trophy },
  { id: "runnerUp", label: "Runner-up", icon: Medal },
  { id: "secondRunnerUp", label: "2nd Runner-up", icon: Medal },
];

export const MANUAL_FORM = {
  kicker: "",
  headline: "",
  subhead: "",
  teamName: "",
  playerName: "",
  rosterText: "",
  statOneLabel: "",
  statOneValue: "",
  statTwoLabel: "",
  statTwoValue: "",
  brandLogo: "",
  brandText: "",
};

export const POSTER_COLORS = {
  paper: "#fbfcff",
  paperWarm: "#fff8ec",
  ink: "#101827",
  muted: "#657289",
  faint: "#e8edf5",
  navy: "#101827",
  orange: "#ff7a1a",
  red: "#e6113f",
  blue: "#2563eb",
};

export function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function getTeamName(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.teamName || value.team || value.name || value.team_name || "";
}

export function getParticipantPlayers(participant) {
  const players = Array.isArray(participant?.players)
    ? participant.players
    : Array.isArray(participant?.player_names)
      ? participant.player_names
      : [];
  return players
    .map((player) =>
      typeof player === "string"
        ? player
        : player?.ign || player?.name || player?.player || "",
    )
    .filter(Boolean);
}

export function resolveRosterFromSources(teamName, participantRows) {
  const normalized = normalizeName(teamName);
  if (!normalized) return [];

  const rosterKey = Object.keys(BMPS_2026_ROSTERS || {}).find(
    (key) => key === normalized || key.includes(normalized) || normalized.includes(key),
  );
  if (rosterKey) return BMPS_2026_ROSTERS[rosterKey] || [];

  const participant = participantRows.find((row) => {
    const participantName = normalizeName(row.name);
    return (
      participantName === normalized ||
      participantName.includes(normalized) ||
      normalized.includes(participantName)
    );
  });
  return participant?.roster || [];
}

export function getStandingPoints(row) {
  return (
    row?.totalPoints ??
    row?.total_points ??
    row?.points ??
    row?.total ??
    row?.score ??
    0
  );
}







export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function makeInitials(name) {
  const words = String(name || "SC").trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function slugify(value) {
  return String(value || "insta-poster")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   POSTER COMPONENTS â€” matched to q1/q2/q3 reference designs
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export const CF = "'Oswald', 'Impact', 'Arial Narrow', sans-serif";

export const SF = "'Inter', system-ui, sans-serif";

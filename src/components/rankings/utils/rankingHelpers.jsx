import React from "react";
import { TrendingUp, Users, Building2, User, Activity, Flame } from "lucide-react";

const CLUB_SHORT_CODES = {
  "AG.AL International": "AGAL",
  "Team Falcons": "FLCN",
  "Team Vitality": "VIT",
  "Natus Vincere": "NAVI",
  "Team Liquid": "TL",
  "Team Spirit": "TS",
  "Virtus.pro": "VP",
  "Aurora Gaming": "AUR",
  "Twisted Minds": "TM",
  T1: "T1",
  "Team Vision": "VIS",
  "100 Thieves": "100T",
  "ZETA DIVISION": "ZETA",
  "Nongshim RedForce": "NS",
  "G2 Esports": "G2",
  "FaZe Clan": "FAZE",
  BIG: "BIG",
  "Weibo Gaming": "WBG",
  "Karmine Corp": "KC",
  FURIA: "FURIA",
  REJECT: "RJT",
  "Team Heretics": "TH",
  DRX: "DRX",
  "Spacestation Gaming": "SSG",
};

export const INSIGHT_ICONS = {
  green: TrendingUp,
  amber: Flame,
  blue: Activity,
};

export const LazyPerformanceChart = React.lazy(() => import("@/components/rankings/PerformanceChart"));

export const HEADER_COPY = {
  teams: {
    title: "Team Rankings",
    description: "Global power rankings derived from official circuit results.",
  },
  players: {
    title: "Player Rankings",
    description: "Top performers across the current competitive season.",
  },
  organizations: {
    title: "EWC Club Ranking",
    description: "Esports World Cup club standings by ccPoints, medals, and prize.",
  },
};

export const RANKING_TABS = [
  { id: "teams", label: "Teams", icon: Users },
  { id: "players", label: "Players", icon: User },
  { id: "organizations", label: "EWC Club Ranking", icon: Building2 },
];

export function getClubShortCode(name) {
  return CLUB_SHORT_CODES[name] || name.substring(0, 2).toUpperCase();
}

export function filterRankings(rows, query, fields) {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    fields.some((field) => String(row[field] || "").toLowerCase().includes(needle)),
  );
}

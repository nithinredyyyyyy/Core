import {
  FAN_BADGE_ORDER,
  FAN_BADGE_META,
  getBadgeForPoints as resolveBadgeForPoints,
} from "@/lib/fanBadges";

export const BADGE_RULES = FAN_BADGE_ORDER.map((label) => ({
  label,
  min: FAN_BADGE_META[label].pointsMin,
}));

export const SEEDED_LEADERBOARD = [
  {
    display_name: "CircuitScout",
    total_points: 128,
    accuracy_percent: 74,
    badge: "Grandmaster",
  },
  {
    display_name: "LobbyWatch",
    total_points: 116,
    accuracy_percent: 71,
    badge: "Grandmaster",
  },
  {
    display_name: "DropCaller",
    total_points: 110,
    accuracy_percent: 69,
    badge: "Grandmaster",
  },
  {
    display_name: "ZoneRead",
    total_points: 101,
    accuracy_percent: 66,
    badge: "Grandmaster",
  },
  {
    display_name: "HotDropOG",
    total_points: 89,
    accuracy_percent: 64,
    badge: "Master",
  },
  {
    display_name: "ClutchFeed",
    total_points: 82,
    accuracy_percent: 61,
    badge: "Master",
  },
  {
    display_name: "MapCaller",
    total_points: 71,
    accuracy_percent: 58,
    badge: "Master",
  },
  {
    display_name: "SignalBoost",
    total_points: 65,
    accuracy_percent: 57,
    badge: "Master",
  },
];

export function getBadgeForPoints(points) {
  return resolveBadgeForPoints(points);
}

export function getNextBadge(points) {
  const ordered = BADGE_RULES.toSorted((a, b) => a.min - b.min);
  return ordered.find((rule) => points < rule.min) || null;
}

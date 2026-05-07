export const BADGE_RULES = [
  { label: "Conqueror", min: 220 },
  { label: "Ace", min: 150 },
  { label: "Crown", min: 95 },
  { label: "Diamond", min: 60 },
  { label: "Platinum", min: 35 },
  { label: "Gold", min: 20 },
  { label: "Silver", min: 10 },
  { label: "Bronze", min: 0 },
];

export const SEEDED_LEADERBOARD = [
  { display_name: "CircuitScout", total_points: 128, accuracy_percent: 74, badge: "Crown" },
  { display_name: "LobbyWatch", total_points: 116, accuracy_percent: 71, badge: "Crown" },
  { display_name: "DropCaller", total_points: 110, accuracy_percent: 69, badge: "Diamond" },
  { display_name: "ZoneRead", total_points: 101, accuracy_percent: 66, badge: "Diamond" },
  { display_name: "HotDropOG", total_points: 89, accuracy_percent: 64, badge: "Platinum" },
  { display_name: "ClutchFeed", total_points: 82, accuracy_percent: 61, badge: "Platinum" },
  { display_name: "MapCaller", total_points: 71, accuracy_percent: 58, badge: "Gold" },
  { display_name: "SignalBoost", total_points: 65, accuracy_percent: 57, badge: "Gold" },
];

export function getBadgeForPoints(points) {
  return BADGE_RULES.find((rule) => points >= rule.min)?.label || "Bronze";
}

export function getNextBadge(points) {
  const ordered = [...BADGE_RULES].sort((a, b) => a.min - b.min);
  return ordered.find((rule) => points < rule.min) || null;
}

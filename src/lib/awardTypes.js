const AWARD_TYPES = {
  FMVP: {
    label: "FMVP",
    color: "#D4AF37",
    colorLight: "rgba(212,175,55,0.15)",
    colorMid: "rgba(212,175,55,0.25)",
    gradient: "linear-gradient(135deg, #D4AF37, #b8960c)",
    icon: "trophy",
    stats: [
      { key: "mvpRating", label: "RATING" },
      { key: "finishes", label: "KILLS" },
      { key: "fpm", label: "F/M" },
    ],
    bgmsStats: [
      { key: "finishes", label: "Fin." },
      { key: "fpm", label: "FPM" },
      { key: "best", label: "Best" },
      { key: "contribution", label: "Contri." },
      { key: "fivePlus", label: "5+" },
      { key: "matches", label: "Matches" },
    ],
  },
  MVP: {
    label: "MVP",
    color: "#ef4444",
    colorLight: "rgba(239,68,68,0.15)",
    colorMid: "rgba(239,68,68,0.25)",
    gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
    icon: "trophy",
    stats: [
      { key: "mvpRating", label: "RATING" },
      { key: "finishes", label: "KILLS" },
      { key: "damage", label: "DAMAGE" },
      { key: "fpm", label: "F/M" },
    ],
    bgmsStats: [
      { key: "mvpRating", label: "RATING" },
      { key: "finishes", label: "KILLS" },
      { key: "best", label: "BEST" },
      { key: "fpm", label: "F/M" },
    ],
    pmgcStats: [
      { key: "elimins", label: "ELIMS" },
      { key: "avg_dmg", label: "AVG DMG" },
      { key: "knocks", label: "KNOCKS" },
      { key: "kd", label: "K/D" },
    ],
  },
  IGL: {
    label: "BEST IGL",
    color: "#2563eb",
    colorLight: "rgba(37,99,235,0.15)",
    colorMid: "rgba(37,99,235,0.25)",
    gradient: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    icon: "compass",
    stats: [
      { key: "iglRating", label: "IGL RATING" },
      { key: "top5s", label: "TOP 5s" },
      { key: "wwcd", label: "WWCD" },
    ],
  },
  SUPPORT: {
    label: "BEST SUPPORT",
    color: "#22c55e",
    colorLight: "rgba(34,197,94,0.15)",
    colorMid: "rgba(34,197,94,0.25)",
    gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
    icon: "shield",
    stats: [
      { key: "assistsPerRd", label: "ASSISTS/RD" },
      { key: "utilityDmg", label: "UTILITY DMG" },
    ],
  },
  ROOKIE: {
    label: "ROOKIE OF THE YEAR",
    color: "#8b5cf6",
    colorLight: "rgba(139,92,246,0.15)",
    colorMid: "rgba(139,92,246,0.25)",
    gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    icon: "risingStar",
    stats: [
      { key: "age", label: "AGE" },
      { key: "debut", label: "DEBUT" },
    ],
  },
  GRENADE_MASTER: {
    label: "GRENADE MASTER",
    color: "#f97316",
    colorLight: "rgba(249,115,22,0.15)",
    colorMid: "rgba(249,115,22,0.25)",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
    icon: "grenade",
    stats: [
      { key: "grenadeKills", label: "GRENADE KILLS" },
      { key: "grenadeDmg", label: "GRENADE DMG" },
    ],
  },
  FIELD_MEDIC: {
    label: "FIELD MEDIC",
    color: "#0891b2",
    colorLight: "rgba(8,145,178,0.15)",
    colorMid: "rgba(8,145,178,0.25)",
    gradient: "linear-gradient(135deg, #0891b2, #0e7490)",
    icon: "medical",
    stats: [
      { key: "revives", label: "REVIVES" },
      { key: "healingSupport", label: "HEALING SUPPORT" },
    ],
  },
  EAGLE_EYE: {
    label: "EAGLE EYE",
    color: "#eab308",
    colorLight: "rgba(234,179,8,0.15)",
    colorMid: "rgba(234,179,8,0.25)",
    gradient: "linear-gradient(135deg, #eab308, #ca8a04)",
    icon: "eye",
    stats: [
      { key: "headshotPct", label: "HEADSHOT %" },
      { key: "longRangeElims", label: "LONG-RANGE ELIMS" },
    ],
  },
  BEST_CLUTCH: {
    label: "BEST CLUTCH",
    color: "#dc2626",
    colorLight: "rgba(220,38,38,0.15)",
    colorMid: "rgba(220,38,38,0.25)",
    gradient: "linear-gradient(135deg, #dc2626, #b91c1c)",
    icon: "lightning",
    stats: [
      { key: "clutchWins", label: "CLUTCH WINS" },
      { key: "clutchRate", label: "CLUTCH RATE" },
    ],
  },
  ELIMINATOR: {
    label: "THE ELIMINATOR",
    color: "#7f1d1d",
    colorLight: "rgba(127,29,29,0.15)",
    colorMid: "rgba(127,29,29,0.25)",
    gradient: "linear-gradient(135deg, #7f1d1d, #6b1a1a)",
    icon: "skull",
    stats: [
      { key: "totalElims", label: "TOTAL ELIMS" },
      { key: "avgElims", label: "AVG ELIMS" },
    ],
  },
};

export function getAwardType(awardName) {
  if (!awardName) return AWARD_TYPES.MVP;
  const upper = awardName.toUpperCase();
  if (upper.includes("FMVP") || upper.includes("FINALS MVP")) return AWARD_TYPES.FMVP;
  if (upper.includes("MVP")) return AWARD_TYPES.MVP;
  if (upper.includes("IGL")) return AWARD_TYPES.IGL;
  if (upper.includes("SUPPORT")) return AWARD_TYPES.SUPPORT;
  if (upper.includes("ROOKIE")) return AWARD_TYPES.ROOKIE;
  if (upper.includes("GRENADE")) return AWARD_TYPES.GRENADE_MASTER;
  if (upper.includes("MEDIC") || upper.includes("FIELD")) return AWARD_TYPES.FIELD_MEDIC;
  if (upper.includes("EAGLE")) return AWARD_TYPES.EAGLE_EYE;
  if (upper.includes("CLUTCH")) return AWARD_TYPES.BEST_CLUTCH;
  if (upper.includes("ELIMINATOR")) return AWARD_TYPES.ELIMINATOR;
  return AWARD_TYPES.MVP;
}

export default AWARD_TYPES;

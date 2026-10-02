const AWARD_TYPES = {
  FMVP: {
    label: "FMVP",
    color: "var(--art-d4af37)",
    colorLight: "rgba(var(--rgb-212-175-55),0.15)",
    colorMid: "rgba(var(--rgb-212-175-55),0.25)",
    gradient: "linear-gradient(135deg, var(--art-d4af37), var(--art-b8960c))",
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
    color: "var(--art-ef4444)",
    colorLight: "rgba(var(--rgb-239-68-68),0.15)",
    colorMid: "rgba(var(--rgb-239-68-68),0.25)",
    gradient: "linear-gradient(135deg, var(--art-ef4444), var(--art-dc2626))",
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
    color: "var(--art-2563eb)",
    colorLight: "rgba(var(--rgb-37-99-235),0.15)",
    colorMid: "rgba(var(--rgb-37-99-235),0.25)",
    gradient: "linear-gradient(135deg, var(--art-2563eb), var(--art-1d4ed8))",
    icon: "compass",
    stats: [
      { key: "iglRating", label: "IGL RATING" },
      { key: "top5s", label: "TOP 5s" },
      { key: "wwcd", label: "WWCD" },
    ],
  },
  SUPPORT: {
    label: "BEST SUPPORT",
    color: "var(--art-22c55e)",
    colorLight: "rgba(var(--rgb-34-197-94),0.15)",
    colorMid: "rgba(var(--rgb-34-197-94),0.25)",
    gradient: "linear-gradient(135deg, var(--art-22c55e), var(--art-16a34a))",
    icon: "shield",
    stats: [
      { key: "assistsPerRd", label: "ASSISTS/RD" },
      { key: "utilityDmg", label: "UTILITY DMG" },
    ],
  },
  ROOKIE: {
    label: "ROOKIE OF THE YEAR",
    color: "var(--art-8b5cf6)",
    colorLight: "rgba(var(--rgb-139-92-246),0.15)",
    colorMid: "rgba(var(--rgb-139-92-246),0.25)",
    gradient: "linear-gradient(135deg, var(--art-8b5cf6), var(--art-7c3aed))",
    icon: "risingStar",
    stats: [
      { key: "age", label: "AGE" },
      { key: "debut", label: "DEBUT" },
    ],
  },
  GRENADE_MASTER: {
    label: "GRENADE MASTER",
    color: "var(--brand-orange)",
    colorLight: "rgba(var(--rgb-249-115-22),0.15)",
    colorMid: "rgba(var(--rgb-249-115-22),0.25)",
    gradient: "linear-gradient(135deg, var(--brand-orange), var(--art-ea580c))",
    icon: "grenade",
    stats: [
      { key: "grenadeKills", label: "GRENADE KILLS" },
      { key: "grenadeDmg", label: "GRENADE DMG" },
    ],
  },
  FIELD_MEDIC: {
    label: "FIELD MEDIC",
    color: "var(--art-0891b2)",
    colorLight: "rgba(var(--rgb-8-145-178),0.15)",
    colorMid: "rgba(var(--rgb-8-145-178),0.25)",
    gradient: "linear-gradient(135deg, var(--art-0891b2), var(--art-0e7490))",
    icon: "medical",
    stats: [
      { key: "revives", label: "REVIVES" },
      { key: "healingSupport", label: "HEALING SUPPORT" },
    ],
  },
  EAGLE_EYE: {
    label: "EAGLE EYE",
    color: "var(--art-eab308)",
    colorLight: "rgba(var(--rgb-234-179-8),0.15)",
    colorMid: "rgba(var(--rgb-234-179-8),0.25)",
    gradient: "linear-gradient(135deg, var(--art-eab308), var(--art-ca8a04))",
    icon: "eye",
    stats: [
      { key: "headshotPct", label: "HEADSHOT %" },
      { key: "longRangeElims", label: "LONG-RANGE ELIMS" },
    ],
  },
  BEST_CLUTCH: {
    label: "BEST CLUTCH",
    color: "var(--art-dc2626)",
    colorLight: "rgba(var(--rgb-220-38-38),0.15)",
    colorMid: "rgba(var(--rgb-220-38-38),0.25)",
    gradient: "linear-gradient(135deg, var(--art-dc2626), var(--art-b91c1c))",
    icon: "lightning",
    stats: [
      { key: "clutchWins", label: "CLUTCH WINS" },
      { key: "clutchRate", label: "CLUTCH RATE" },
    ],
  },
  ELIMINATOR: {
    label: "THE ELIMINATOR",
    color: "var(--art-7f1d1d)",
    colorLight: "rgba(var(--rgb-127-29-29),0.15)",
    colorMid: "rgba(var(--rgb-127-29-29),0.25)",
    gradient: "linear-gradient(135deg, var(--art-7f1d1d), var(--art-6b1a1a))",
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

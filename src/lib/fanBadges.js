import {
  Crown,
  Gem,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
} from "lucide-react";

export const FAN_BADGE_ORDER = [
  "Rookie",
  "Veteran",
  "Elite",
  "Pro",
  "Master",
  "Grandmaster",
  "Legendary",
];

const BADGE_ALIASES = {
  bronze: "Rookie",
  silver: "Veteran",
  gold: "Elite",
  platinum: "Pro",
  diamond: "Master",
  ace: "Grandmaster",
  conqueror: "Legendary",
  rookie: "Rookie",
  veteran: "Veteran",
  elite: "Elite",
  pro: "Pro",
  master: "Master",
  grandmaster: "Grandmaster",
  legendary: "Legendary",
};

export const FAN_BADGE_META = {
  Rookie: {
    label: "Rookie",
    icon: Shield,
    xpMin: 0,
    pointsMin: 0,
    shellClassName:
      "border-[#cc9a68] bg-[radial-gradient(circle_at_top,#fff4e7_0%,#cf9660_34%,#26160f_76%,#0f0a08_100%)] text-[#f9d7af]",
    crestClassName:
      "border-[#f7e4ce]/80 bg-[linear-gradient(180deg,#f6d6aa,#a86837)] text-[#fff2df]",
    auraClassName: "shadow-[0_18px_34px_rgba(180,112,57,0.28)]",
  },
  Veteran: {
    label: "Veteran",
    icon: ShieldCheck,
    xpMin: 80,
    pointsMin: 10,
    shellClassName:
      "border-[#aeb3bf] bg-[radial-gradient(circle_at_top,#fbfdff_0%,#98a0ae_30%,#30343c_74%,#121418_100%)] text-[#edf2f7]",
    crestClassName:
      "border-[#f5f7fa]/80 bg-[linear-gradient(180deg,#dde3eb,#707987)] text-white",
    auraClassName: "shadow-[0_18px_34px_rgba(86,95,112,0.24)]",
  },
  Elite: {
    label: "Elite",
    icon: Star,
    xpMin: 180,
    pointsMin: 20,
    shellClassName:
      "border-[#e9d29b] bg-[radial-gradient(circle_at_top,#fffdf0_0%,#f0dc9c_36%,#b08f4a_76%,#5f4825_100%)] text-[#fff7cf]",
    crestClassName:
      "border-[#fff6d9]/80 bg-[linear-gradient(180deg,#fff1b8,#cfad54)] text-[#fffdf1]",
    auraClassName: "shadow-[0_18px_34px_rgba(207,173,84,0.28)]",
  },
  Pro: {
    label: "Pro",
    icon: Gem,
    xpMin: 350,
    pointsMin: 35,
    shellClassName:
      "border-[#79b7b2] bg-[radial-gradient(circle_at_top,#eefefd_0%,#7bb5b1_28%,#1f6f71_72%,#12323a_100%)] text-[#dcffff]",
    crestClassName:
      "border-[#d9fbf5]/80 bg-[linear-gradient(180deg,#cef6ef,#2d8f8d)] text-[#f5fffe]",
    auraClassName: "shadow-[0_18px_34px_rgba(43,142,140,0.28)]",
  },
  Master: {
    label: "Master",
    icon: Crown,
    xpMin: 600,
    pointsMin: 60,
    shellClassName:
      "border-[#a573ff] bg-[radial-gradient(circle_at_top,#f7f0ff_0%,#8f58f3_28%,#45256d_72%,#160d27_100%)] text-[#f3e6ff]",
    crestClassName:
      "border-[#f2e3ff]/80 bg-[linear-gradient(180deg,#d8b8ff,#6936dd)] text-white",
    auraClassName: "shadow-[0_18px_34px_rgba(118,67,227,0.3)]",
  },
  Grandmaster: {
    label: "Grandmaster",
    icon: Sparkles,
    xpMin: 900,
    pointsMin: 95,
    shellClassName:
      "border-[#cfb77a] bg-[radial-gradient(circle_at_top,#fff9ea_0%,#c4b0ff_22%,#5b3ab2_56%,#c4a452_100%)] text-[#fff7dc]",
    crestClassName:
      "border-[#fff4d2]/80 bg-[linear-gradient(180deg,#f6e8a7,#6c49d1)] text-white",
    auraClassName: "shadow-[0_18px_34px_rgba(125,92,215,0.32)]",
  },
  Legendary: {
    label: "Legendary",
    icon: Swords,
    xpMin: 1300,
    pointsMin: 150,
    shellClassName:
      "border-[#f3a06f] bg-[radial-gradient(circle_at_top,#fff1ea_0%,#ff7f78_22%,#9d1725_62%,#591012_100%)] text-[#ffe4ca]",
    crestClassName:
      "border-[#ffe2c7]/80 bg-[linear-gradient(180deg,#ffd177,#d32035)] text-white",
    auraClassName: "shadow-[0_18px_34px_rgba(203,42,57,0.32)]",
  },
};

export function normalizeBadgeName(value) {
  const key = String(value || "").trim().toLowerCase();
  return BADGE_ALIASES[key] || "Rookie";
}

export function getBadgeMeta(value) {
  return FAN_BADGE_META[normalizeBadgeName(value)] || FAN_BADGE_META.Rookie;
}

export function getBadgeForXp(xp) {
  return (
    [...FAN_BADGE_ORDER]
      .reverse()
      .find((label) => Number(xp || 0) >= FAN_BADGE_META[label].xpMin) || "Rookie"
  );
}

export function getBadgeForPoints(points) {
  return (
    [...FAN_BADGE_ORDER]
      .reverse()
      .find((label) => Number(points || 0) >= FAN_BADGE_META[label].pointsMin) ||
    "Rookie"
  );
}

export function getNextBadgeByPoints(points) {
  return FAN_BADGE_ORDER.map((label) => FAN_BADGE_META[label]).find(
    (badge) => Number(points || 0) < badge.pointsMin,
  ) || null;
}

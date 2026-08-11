import { getOrganizationMeta, normalizeOrganizationName } from "@/lib/organizationIdentity";
import { isBmps2026PromotionStage } from "@/lib/tournamentProgression";
import { getPmwc2026MovementRule } from "@/lib/pmwc2026Progression";
import { getCleanStageLabel } from "@/features/tournaments/utils/stageHelpers";

export { buildPhaseLabelFromEntry } from "@/features/tournaments/utils/stageHelpers";

export function buildTeamLink(teamName) {
  return `/teams?team=${encodeURIComponent(normalizeTeamName(teamName))}`;
}

export function getDisplayTeamName(teamName) {
  return getOrganizationMeta(teamName).name;
}

export function getOutcomeTone(outcome) {
  const value = String(outcome || "").toLowerCase();
  if (value.includes("champion")) {
    return { border: "border-l-amber-400", dot: "bg-amber-400", label: "Champion" };
  }
  if (value.includes("runner")) {
    return { border: "border-l-slate-400", dot: "bg-slate-400", label: "Runner-up" };
  }
  if (value.includes("3rd")) {
    return { border: "border-l-orange-500", dot: "bg-orange-500", label: "3rd Place" };
  }
  if (value.includes("grand finals")) {
    return { border: "border-l-emerald-500", dot: "bg-emerald-500", label: "Advance to Grand Finals" };
  }
  if (value.includes("semi") || value.includes("qualif")) {
    return { border: "border-l-emerald-500", dot: "bg-emerald-500", label: "Qualify for next stage" };
  }
  if (value.includes("survival stage")) {
    return { border: "border-l-blue-500", dot: "bg-blue-500", label: "Move to Survival Stage" };
  }
  if (value.includes("wildcard")) {
    return { border: "border-l-blue-500", dot: "bg-blue-500", label: "Move to wildcards" };
  }
  if (value.includes("elimin")) {
    return { border: "border-l-red-500", dot: "bg-red-500", label: "Eliminated" };
  }
  return { border: "border-l-border", dot: "bg-muted-foreground/40", label: "Stage result" };
}

export function getGrandFinalsPlacementTone(stageName, placement) {
  if (stageName !== "Grand Finals") return null;
  if (placement === 1) {
    return {
      border: "border-l-amber-400",
      row: "bg-amber-500/8 hover:bg-amber-500/14",
      rank: "text-amber-500",
      points: "text-amber-500",
    };
  }
  if (placement === 2) {
    return {
      border: "border-l-slate-400",
      row: "bg-slate-400/10 hover:bg-slate-400/16",
      rank: "text-slate-500 dark:text-slate-300",
      points: "text-slate-600 dark:text-slate-200",
    };
  }
  if (placement === 3) {
    return {
      border: "border-l-orange-500",
      row: "bg-orange-500/8 hover:bg-orange-500/14",
      rank: "text-orange-600 dark:text-orange-300",
      points: "text-orange-600 dark:text-orange-300",
    };
  }
  return null;
}

export function getGroupMovementRule(tournamentName, stageName, group, position, totalTeams) {
  const normalizedStage = String(stageName || "").trim().toLowerCase();

  if (tournamentName === "PUBG Mobile World Cup 2026") {
    return getPmwc2026MovementRule(stageName, group, position);
  }

  if (normalizedStage === "round 4") {
    if (group === "A") {
      return position <= 8
        ? {
            label: "Advance to Grand Finals",
            tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
          }
        : {
            label: "Advance to Semi Finals",
            tone: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300",
          };
    }

    if (group === "B") {
      return position <= 8
        ? {
            label: "Advance to Semi Finals",
            tone: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300",
          }
        : {
            label: "Move to Survival Stage",
            tone: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
          };
    }

    if (group === "C") {
      return {
        label: "Move to Survival Stage",
        tone: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
      };
    }

    if (group === "D") {
      return position <= 8
        ? {
            label: "Move to Survival Stage",
            tone: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
          }
        : {
            label: "Eliminated",
            tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
          };
    }
  }

  if (normalizedStage === "survival stage") {
    return position <= 8
      ? {
          label: "Advance to Semi Finals",
          tone: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300",
        }
      : {
          label: "Eliminated from BMPS 2026",
          tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
        };
  }

  if (normalizedStage === "semi finals") {
    if (position <= 6) {
      return {
        label: "Advance to Grand Finals",
        tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
      };
    }
    if (position <= 22) {
      return {
        label: "Move to Last Chance",
        tone: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
      };
    }
    return {
      label: "Eliminated from BMPS 2026",
      tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
    };
  }

  if (normalizedStage === "last chance stage") {
    return position <= 2
      ? {
          label: "Advance to Grand Finals",
          tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
        }
      : {
          label: "Eliminated",
          tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
        };
  }

  const bottomCutoff = Math.max(totalTeams - 3, 1);

  if (group === "A") {
    if (position >= bottomCutoff) {
      return {
        label: "Relegation to Group B",
        tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
      };
    }
    return null;
  }

  if (group === "B") {
    if (position <= 4) {
      return {
        label: "Promotion to Group A",
        tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
      };
    }
    if (position >= bottomCutoff) {
      return {
        label: "Relegation to Group C",
        tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
      };
    }
    return null;
  }

  if (group === "C") {
    if (position <= 4) {
      return {
        label: "Promotion to Group B",
        tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
      };
    }
    if (position >= bottomCutoff) {
      return {
        label: "Relegation to Group D",
        tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
      };
    }
    return null;
  }

  if (group === "D" && position <= 4) {
    return {
      label: "Promotion to Group C",
      tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    };
  }

  return null;
}

export function getGroupMovementAccent(tournamentName, stageName, group, position, totalTeams) {
  const movement = getGroupMovementRule(tournamentName, stageName, group, position, totalTeams);
  if (!movement) {
    return {
      cell: "border-l-slate-300 dark:border-l-slate-700",
      rank: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
      dot: "bg-slate-400",
    };
  }

  if (movement.label.includes("Promotion")) {
    return {
      cell: "border-l-emerald-500",
      rank: "bg-emerald-500 text-white",
      dot: "bg-emerald-500",
    };
  }

  if (movement.label.includes("Grand Finals")) {
    return {
      cell: "border-l-emerald-500",
      rank: "bg-emerald-500 text-white",
      dot: "bg-emerald-500",
    };
  }

  if (movement.label.includes("Survival Stage")) {
    return {
      cell: "border-l-amber-500",
      rank: "bg-amber-500 text-white",
      dot: "bg-amber-500",
    };
  }

  if (movement.label.includes("Semi Finals")) {
    return {
      cell: "border-l-violet-500",
      rank: "bg-violet-500 text-white",
      dot: "bg-violet-500",
    };
  }

  if (movement.label.includes("Survival Stage") || movement.label.includes("Last Chance") || movement.label.includes("wildcards")) {
    return {
      cell: "border-l-blue-500",
      rank: "bg-blue-500 text-white",
      dot: "bg-blue-500",
    };
  }

  return {
    cell: "border-l-red-500",
    rank: "bg-red-500 text-white",
    dot: "bg-red-500",
  };
}

export function getParticipantEntryPhases(entry) {
  const phases = new Set();
  if (entry?.phase) {
    phases.add(String(entry.phase));
  }
  for (const stageEntry of entry?.stageEntries || []) {
    if (stageEntry?.phase) {
      phases.add(String(stageEntry.phase));
    } else if (stageEntry?.stageName && stageEntry?.groupName) {
      phases.add(`${stageEntry.stageName} - ${stageEntry.groupName}`);
    } else if (stageEntry?.stageName) {
      phases.add(String(stageEntry.stageName));
    }
  }
  return [...phases].map(getCleanStageLabel);
}

export function getParticipantStageGroup(entry, stageName) {
  const stageKey = String(stageName || "").trim().toLowerCase();
  for (const phase of getParticipantEntryPhases(entry)) {
    const match = String(phase || "").match(/^(.+?)\s*-\s*Group\s+([A-Z])$/i);
    if (match && match[1].trim().toLowerCase() === stageKey) {
      return match[2].toUpperCase();
    }
  }
  return null;
}

export function getStrictParticipantStageGroup(entry, stageName) {
  const phase = String(entry?.phase || "");
  const stageKey = String(stageName || "").trim().toLowerCase();
  const match = phase.match(/^(.+?)\s*-\s*Group\s+([A-D])$/i);
  if (match && match[1].trim().toLowerCase() === stageKey) {
    return match[2].toUpperCase();
  }
  return null;
}

export function getPreferredParticipantEntry(left, right) {
  if (!left) return right;
  if (!right) return left;

  const leftDisplayName = getDisplayTeamName(left.team);
  const rightDisplayName = getDisplayTeamName(right.team);
  if (right.team === rightDisplayName && left.team !== leftDisplayName) return right;
  if (left.team === leftDisplayName && right.team !== rightDisplayName) return left;

  const leftHasRoster = (left.players || []).length + (left.roster || []).length;
  const rightHasRoster = (right.players || []).length + (right.roster || []).length;
  if (rightHasRoster > leftHasRoster) return right;

  return left;
}

export function dedupeParticipantEntriesByOrganization(entries) {
  const byOrganization = new Map();
  for (const entry of entries || []) {
    const key = normalizeOrganizationName(entry?.team);
    if (!key) continue;
    byOrganization.set(
      key,
      getPreferredParticipantEntry(byOrganization.get(key), entry),
    );
  }
  return [...byOrganization.values()];
}

export function isBmps2026KnockoutStage(stageName) {
  return ["survival stage", "semi finals", "last chance stage"].includes(
    String(stageName || "").trim().toLowerCase(),
  );
}

export function isBmps2026SurvivalStage(stageName) {
  return String(stageName || "").trim().toLowerCase() === "survival stage";
}

export function isBmps2026SemiFinalsStage(stageName) {
  return String(stageName || "").trim().toLowerCase() === "semi finals";
}

export function shouldOpenBmps2026GroupsByDefault(stageName) {
  return (
    isBmps2026PromotionStage(stageName) ||
    String(stageName || "").trim() === "Round 4" ||
    isBmps2026SurvivalStage(stageName) ||
    isBmps2026SemiFinalsStage(stageName)
  );
}

export const BMPS_2026_SURVIVAL_GROUP_BY_TEAM = {
  madkingsesports: "A",
  teamaryan: "A",
  hadxesports: "A",
  nonxesports: "A",
  rapidchaosesports: "A",
  teamversatile: "A",
  vxt: "A",
  aresesport: "A",
  likithaesports: "A",

  jaguaresports: "B",
  k9esports: "B",
  esportsocial: "B",
  santaesports: "B",
  truerippers: "B",
  quantumsparks: "B",
  risingesports: "B",
  teamdoxy: "B",

  naqshesports: "C",
  learnfrompast: "C",
  teamredxross: "C",
  thundergodsxtortugagaming: "C",
  godsentesports: "C",
  teamapexgaming: "C",
  dcxscresports: "C",
  dcxscr: "C",
  genxfmesports: "C",

  phoenixesports: "D",
  lastadeesports: "D",
  teamh4k: "D",
  riotnationz: "D",
  t7xorionesports: "D",
  t7: "D",
  troytamilianesports: "D",
  auraxesports: "D",
  mythofficial: "D",
};

export const BMPS_2026_SEMI_BASE_GROUP_BY_TEAM = {
  wyldfangs: "A",
  godsreign: "A",
  genesisesports: "A",
  zeroarkofficial: "A",
  reckoningesports: "A",
  revenantxspark: "A",
  weltesports: "A",

  metaninza: "B",
  "4trofficial": "B",
  autobotzesports: "B",
  higgbosonesports: "B",
  teamtamilas: "B",
  mysterious4: "B",

  windgodesports: "C",
  whitewalkers: "C",
  nebulaesports: "C",
};

export const BMPS_2026_SEMI_SURVIVAL_RANK_GROUP = {
  1: "C",
  2: "C",
  3: "B",
  4: "C",
  5: "A",
  6: "C",
  7: "B",
  8: "C",
};

export function getBmps2026FallbackGroupForTeam(teamName, stageName, survivalRankByTeam = new Map()) {
  const teamKey = normalizeOrganizationName(teamName);
  if (!teamKey) return null;

  if (isBmps2026SurvivalStage(stageName)) {
    return BMPS_2026_SURVIVAL_GROUP_BY_TEAM[teamKey] || null;
  }

  if (isBmps2026SemiFinalsStage(stageName)) {
    const survivalRank = survivalRankByTeam.get(teamKey);
    if (survivalRank) {
      return BMPS_2026_SEMI_SURVIVAL_RANK_GROUP[survivalRank] || null;
    }
    return BMPS_2026_SEMI_BASE_GROUP_BY_TEAM[teamKey] || null;
  }

  return null;
}

export function normalizeTeamName(teamName) {
  const compact = (teamName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return compact
    .replace(/gladiators/g, "gladiator")
    .replace(/dpluskia/g, "dplus")
    .replace(/iqoorevenantxspark/g, "teamxspark")
    .replace(/iqoosoul/g, "teamsoul")
    .replace(/iqoo8bit/g, "8bit")
    .replace(/teamforever/g, "numenesports")
    .replace(/heroxtremegodlike/g, "godlikeesports")
    .replace(/iqooorangutan/g, "orangutan")
    .replace(/loshermanos/g, "loshermanosesports")
    .replace(/iqoo8bit/g, "8bit")
    .replace(/infinixtruerippers/g, "truerippers")
    .replace(/oneplusgodsreign/g, "godsreign")
    .replace(/mysterious4esports/g, "mysterious4")
    .replace(/madkings/g, "madkingsesports")
    .replace(/fsesports/g, "fsesports")
    .replace(/heroxtremegodlike/g, "godlikeesports")
    .replace(/onepluscincinnatikids/g, "cincinnatikids")
    .replace(/oneplusgodsreign/g, "godsreign")
    .replace(/oneplusk9esports/g, "k9esports")
    .replace(/teaminsaneesports/g, "teaminsane")
    .replace(/truerippersxinfinix/g, "truerippers")
    .replace(/onepluscincinnatikids/g, "cincinnatikids")
    .replace(/16scorexbotarmy/g, "botarmy")
    .replace(/4everesports/g, "4everxredxross")
    .replace(/rivalryxnri/g, "rivalrynri")
    .replace(/teamh4k/g, "hadesh4k")
    .replace(/phoenixesports/g, "phoenixesports")
    .replace(/pheonixesports/g, "phoenixesports")
    .replace(/iqooteamtamilas/g, "teamtamilas")
    .replace(/iqooreckoningesports/g, "reckoningesports")
    .replace(/risinginfernoesports/g, "infernosquad")
    .replace(/teaminsane/g, "teaminsane")
    .replace(/blindesports/g, "blindesports");
}

export function getChampionDisplayName(teamName) {
  const normalized = normalizeTeamName(teamName);

  if (normalized === "teamxspark") return "Team XSpark";
  if (normalized === "teamsoul") return "Team SouL";
  if (normalized === "8bit") return "8Bit";
  if (normalized === "teamtamilas") return "Team Tamilas";
  if (normalized === "reckoningesports") return "Reckoning Esports";
  if (normalized === "infernosquad") return "Inferno Squad";

  return teamName;
}

export function getChampionLogoOverride(teamName) {
  const normalized = normalizeTeamName(teamName);

  if (normalized === "orangutan") return "/images/champion-iqoo-orangutan.webp";
  if (normalized === "teamsoul") return "/images/champion-iqoo-soul.webp";

  return null;
}

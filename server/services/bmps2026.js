import { normalizeOrganizationName } from "../../src/lib/organizationIdentity.js";

function isBmps2026PromotionStage(stageName) {
  return /^round\s+[123]$/i.test(String(stageName || "").trim());
}

function getBmps2026NextStageName(stageName) {
  const normalized = String(stageName || "")
    .trim()
    .toLowerCase();
  if (normalized === "round 1") return "Round 2";
  if (normalized === "round 2") return "Round 3";
  if (normalized === "round 3") return "Round 4";
  return null;
}

function getBmps2026StageDestination({ stageName, group, placement }) {
  const normalizedStage = String(stageName || "")
    .trim()
    .toLowerCase();
  const normalizedGroup = String(group || "")
    .trim()
    .toUpperCase();

  if (normalizedStage === "round 4") {
    if (normalizedGroup === "A") return placement <= 8 ? "Grand Finals" : "Semi Finals";
    if (normalizedGroup === "B") return placement <= 8 ? "Semi Finals" : "Survival Stage";
    if (normalizedGroup === "C") return "Survival Stage";
    if (normalizedGroup === "D") return placement <= 8 ? "Survival Stage" : null;
  }

  if (normalizedStage === "survival stage") {
    return placement <= 8 ? "Semi Finals" : null;
  }

  if (normalizedStage === "semi finals") {
    if (placement <= 6) return "Grand Finals";
    if (placement <= 22) return "Last Chance Stage";
    return null;
  }

  if (normalizedStage === "last chance stage") {
    return placement <= 2 ? "Grand Finals" : null;
  }

  return null;
}

function getBmps2026MovementGroup(group, placement, totalTeams) {
  const label = String(group || "")
    .trim()
    .toUpperCase();
  const total = Math.max(Number(totalTeams) || 0, 0);
  const bottomCutoff = Math.max(total - 3, 13);

  if (label === "A") {
    if (placement >= bottomCutoff) return "B";
    return "A";
  }
  if (label === "B") {
    if (placement <= 4) return "A";
    if (placement >= bottomCutoff) return "C";
    return "B";
  }
  if (label === "C") {
    if (placement <= 4) return "B";
    if (placement >= bottomCutoff) return "D";
    return "C";
  }
  if (label === "D") {
    if (placement <= 4) return "C";
    return "D";
  }
  return label || "A";
}

const BMPS_2026_SURVIVAL_STAGE_GROUPS = {
  madkingsesports: "A",
  madkings: "A",
  teamaryan: "A",
  aryan: "A",
  hadxesports: "A",
  hadx: "A",
  nonxesports: "A",
  nonx: "A",
  rapidchaosesports: "A",
  rapidchaos: "A",
  vxt: "A",
  aresesport: "A",
  ares: "A",
  likithaesports: "A",
  likitha: "A",

  jaguaresports: "B",
  jaguar: "B",
  k9esports: "B",
  k9: "B",
  esportsocial: "B",
  santaesports: "B",
  santa: "B",
  truerippers: "B",
  quantumsparks: "B",
  quantumspark: "B",
  qunatumspark: "B",
  risingesports: "B",
  rising: "B",
  teamdoxy: "B",
  doxy: "B",

  naqshesports: "C",
  naqsh: "C",
  learnfrompast: "C",
  lefp: "C",
  teamredxross: "C",
  redxross: "C",
  thundergodsxtortugagaming: "C",
  tdr: "C",
  godsentesports: "C",
  godsent: "C",
  teamapexgaming: "C",
  apexgaming: "C",
  dcxscr: "C",
  dcxscresports: "C",
  dcxscoresports: "C",
  genxfmesports: "C",
  genxfm: "C",

  phoenixesports: "D",
  phoenix: "D",
  phoneix: "D",
  lastadeesports: "D",
  lastade: "D",
  teamh4k: "D",
  h4k: "D",
  riotnationz: "D",
  riotnations: "D",
  t7xorionesports: "D",
  t7: "D",
  troytamilianesports: "D",
  troytamilian: "D",
  auraxesports: "D",
  aurax: "D",
  mythofficial: "D",
  myth: "D",
};

function getBmps2026SurvivalStageGroup(teamName, index) {
  const mappedGroup =
    BMPS_2026_SURVIVAL_STAGE_GROUPS[normalizeOrganizationName(teamName)] ||
    BMPS_2026_SURVIVAL_STAGE_GROUPS[
      String(teamName || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
    ];
  if (mappedGroup) return mappedGroup;

  const groupIndex = Math.floor((Number(index) || 0) / 8);
  return ["A", "B", "C", "D"][groupIndex] || "D";
}

const BMPS_2026_SEMI_FINALS_TEAM_GROUPS = {
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

const BMPS_2026_SEMI_FINALS_SURVIVAL_GROUPS = {
  1: "C",
  2: "C",
  3: "B",
  4: "C",
  5: "A",
  6: "C",
  7: "B",
  8: "C",
};

function getBmps2026SemiFinalsGroup(teamName, sourceStageName, index) {
  if (String(sourceStageName || "").trim().toLowerCase() === "survival stage") {
    return BMPS_2026_SEMI_FINALS_SURVIVAL_GROUPS[(Number(index) || 0) + 1] || null;
  }

  return (
    BMPS_2026_SEMI_FINALS_TEAM_GROUPS[normalizeOrganizationName(teamName)] ||
    BMPS_2026_SEMI_FINALS_TEAM_GROUPS[
      String(teamName || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
    ] ||
    null
  );
}

export function deriveBmps2026OverviewEntries(normalizedTournament) {
  const baseEntries = (normalizedTournament?.participants || []).map(
    (participant) => ({
      team: participant?.team?.name || "Unknown Team",
      phase:
        participant?.stage_entries?.[0]?.stage_name &&
        participant?.stage_entries?.[0]?.group_name
          ? `${participant.stage_entries[0].stage_name} - ${participant.stage_entries[0].group_name}`
          : participant?.stage_entries?.[0]?.stage_name || "Participants",
    }),
  );
  const derivedEntries = [...baseEntries];
  const knownPhaseKeys = new Set(
    derivedEntries.map(
      (entry) =>
        `${normalizeOrganizationName(entry.team)}::${String(entry.phase || "").toLowerCase()}`,
    ),
  );

  for (const stage of normalizedTournament?.stages || []) {
    const nextStageName = getBmps2026NextStageName(stage?.name);
    const isRound4 = String(stage?.name || "").trim().toLowerCase() === "round 4";
    if (!isBmps2026PromotionStage(stage?.name) && !isRound4) continue;
    if (!isRound4 && !nextStageName) continue;

    const rowsByGroup = new Map();
    const groupedStandings = stage?.standings?.by_group || {};
    Object.entries(groupedStandings).forEach(([groupName, rows]) => {
      const groupLabel = String(groupName || "")
        .replace(/^Group\s+/i, "")
        .trim()
        .toUpperCase();
      const filteredRows = [];
      for (const row of rows || []) {
        const team = row?.team;
        const teamName = team?.name;
        if (teamName) filteredRows.push(row);
      }
      if (groupLabel && filteredRows.length > 0) {
        rowsByGroup.set(groupLabel, filteredRows);
      }
    });

    const sortRound4Rows = (rows) =>
      rows.toSorted((left, right) => {
        if ((right.total_points || 0) !== (left.total_points || 0)) {
          return (right.total_points || 0) - (left.total_points || 0);
        }
        if ((right.wins || 0) !== (left.wins || 0)) {
          return (right.wins || 0) - (left.wins || 0);
        }
        if ((right.place_points || 0) !== (left.place_points || 0)) {
          return (right.place_points || 0) - (left.place_points || 0);
        }
        return String(left.team?.name || "").localeCompare(
          String(right.team?.name || ""),
        );
      });

    if (isRound4) {
      const rowsByDestination = new Map();
      for (const [group, rows] of rowsByGroup.entries()) {
        sortRound4Rows(rows).forEach((row, index) => {
          const destinationStage = getBmps2026StageDestination({
            stageName: stage?.name,
            group,
            placement: index + 1,
          });
          if (!destinationStage) return;
          const current = rowsByDestination.get(destinationStage) || [];
          current.push(row);
          rowsByDestination.set(destinationStage, current);
        });
      }

      for (const [destinationStage, destinationRows] of rowsByDestination.entries()) {
        sortRound4Rows(destinationRows).forEach((row, index) => {
          const teamName = row?.team?.name || "Unknown Team";
          const destinationGroup =
            String(destinationStage || "").trim().toLowerCase() ===
            "survival stage"
              ? getBmps2026SurvivalStageGroup(teamName, index)
              : String(destinationStage || "").trim().toLowerCase() ===
                "semi finals"
                ? getBmps2026SemiFinalsGroup(teamName, stage?.name, index)
              : null;
          const phase = destinationGroup
            ? `${destinationStage} - Group ${destinationGroup}`
            : destinationStage;
          const phaseKey = `${normalizeOrganizationName(teamName)}::${phase.toLowerCase()}`;
          if (knownPhaseKeys.has(phaseKey)) return;
          knownPhaseKeys.add(phaseKey);
          derivedEntries.push({
            team: teamName,
            phase,
            placement: index + 1,
          });
        });
      }
      continue;
    }

    for (const [group, rows] of rowsByGroup.entries()) {
      const orderedRows = rows.toSorted((left, right) => {
        if ((right.total_points || 0) !== (left.total_points || 0)) {
          return (right.total_points || 0) - (left.total_points || 0);
        }
        if ((right.wins || 0) !== (left.wins || 0)) {
          return (right.wins || 0) - (left.wins || 0);
        }
        if ((right.place_points || 0) !== (left.place_points || 0)) {
          return (right.place_points || 0) - (left.place_points || 0);
        }
        return String(left.team?.name || "").localeCompare(
          String(right.team?.name || ""),
        );
      });

      orderedRows.forEach((row, index) => {
        const teamName = row?.team?.name || "Unknown Team";
        const destinationStage = nextStageName;
        if (!destinationStage) return;
        const destinationGroup = getBmps2026MovementGroup(group, index + 1, orderedRows.length);
        const phase = destinationGroup
          ? `${destinationStage} - Group ${destinationGroup}`
          : destinationStage;
        const phaseKey = `${normalizeOrganizationName(teamName)}::${phase.toLowerCase()}`;
        if (knownPhaseKeys.has(phaseKey)) return;
        knownPhaseKeys.add(phaseKey);
        derivedEntries.push({ team: teamName, phase });
      });
    }
  }

  return derivedEntries;
}

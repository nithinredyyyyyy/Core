const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "src/components/tournaments/TournamentDetail.jsx");
const lines = fs.readFileSync(sourcePath, "utf8").split(/\r?\n/);

function extract(start, end) {
  return lines.slice(start - 1, end).join("\n");
}

function writeFile(relPath, content) {
  const fullPath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + "\n");
  console.log("Wrote", relPath);
}

function exportify(block) {
  return block.replace(/^function /gm, "export function ").replace(/^const /gm, "export const ");
}

writeFile(
  "src/features/tournaments/constants.js",
  `import { normalizeOrganizationName } from "@/lib/organizationIdentity";

${exportify(extract(137, 214))}`,
);

writeFile(
  "src/features/tournaments/utils/tournamentAllocations.js",
  `import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { HIDDEN_PARTICIPANT_PHASE_LABELS } from "@/features/tournaments/constants";

${exportify(extract(66, 135))}`,
);

writeFile(
  "src/features/tournaments/utils/stageHelpers.js",
  `import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { HIDDEN_PARTICIPANT_PHASE_LABELS } from "@/features/tournaments/constants";

${exportify(extract(163, 214))}
${exportify(extract(504, 613))}`,
);

writeFile(
  "src/features/tournaments/utils/participantHelpers.js",
  `import { getOrganizationMeta, normalizeOrganizationName } from "@/lib/organizationIdentity";

${exportify(extract(216, 503))}
${exportify(extract(652, 833))}
${exportify(extract(2791, 2852))}`,
);

writeFile(
  "src/features/tournaments/components/ParticipantRosterCard.jsx",
  `import React from "react";
import { Link } from "react-router-dom";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { buildTeamLink, getDisplayTeamName } from "@/features/tournaments/utils/participantHelpers";

${extract(615, 650).replace("function ParticipantRosterCard", "export default function ParticipantRosterCard")}`,
);

const standingsImports = `import React, { useEffect, useMemo, useReducer } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SortableColumnHeader from "@/components/tournaments/SortableColumnHeader";
import NavTabs from "@/components/tournaments/detail/NavTabs";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { getOrganizationMeta, normalizeOrganizationName } from "@/lib/organizationIdentity";
import { compareStageBoardStandings, getFeaturedTournamentStage } from "@/lib/stageBoard";
import {
  deriveBmps2026ParticipantEntries,
  isBmps2026PromotionStage,
} from "@/lib/bmps2026Progression";
import {
  BMPS_2026_FMVP_STATS,
  BMPS_2026_GRAND_FINALS_PLAYER_STATS,
  BMPS_2026_IGL_STATS,
  BMPS_2026_LCQ_PLAYER_STATS,
  BMPS_2026_MVP_STATS,
  BMPS_2026_OVERALL_PLAYER_STATS,
  BMPS_2026_PLAYER_ROW_TEAM_OVERRIDES,
  BMPS_2026_PLAYER_TEAM_OVERRIDES,
  BMPS_2026_QUALIFIER_PLAYER_STATS,
  BMPS_2026_SEMI_FINALS_PLAYER_STATS,
  BMPS_2026_SURVIVAL_PLAYER_STATS,
  buildBmps2026OverallPlayerStats,
  parseBmps2026EliminatorStats,
  bmps2026PlayerTeams,
} from "@/lib/bmps2026PlayerStats";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  createStageBoardUiState,
  stageBoardUiReducer,
} from "@/features/tournaments/hooks/stageBoardUiReducer";
import { sortTableRows } from "@/features/tournaments/utils/tableSort";
import {
  EMPTY_STAGE_MATCH_RESULTS,
  EMPTY_STAGE_MATCHES,
  EMPTY_STAGE_PARTICIPANT_ENTRIES,
  EMPTY_STAGE_PLAYERS,
  EMPTY_STAGE_RANKINGS,
  EMPTY_STAGE_TEAMS,
} from "@/features/tournaments/constants";
import {
  buildTeamLink,
  dedupeParticipantEntriesByOrganization,
  getBmps2026FallbackGroupForTeam,
  getBmps2026PreviousStageName,
  getDisplayTeamName,
  getGrandFinalsPlacementTone,
  getGroupMovementAccent,
  getGroupMovementRule,
  getOutcomeTone,
  getParticipantEntryPhases,
  getParticipantStageGroup,
  getPreferredParticipantEntry,
  getStrictParticipantStageGroup,
  isBmps2026KnockoutStage,
  isBmps2026SemiFinalsStage,
  isBmps2026SurvivalStage,
  shouldOpenBmps2026GroupsByDefault,
} from "@/features/tournaments/utils/participantHelpers";
import BmpsSemiFinalsPendingPanel from "@/features/tournaments/components/BmpsSemiFinalsPendingPanel";
import RankingTable from "@/features/tournaments/components/RankingTable";
`;

writeFile(
  "src/features/tournaments/components/StageStandingsBoard.jsx",
  `${standingsImports}
${extract(971, 2681).replace("// eslint-disable-next-line\nfunction StageStandingsBoard", "export default function StageStandingsBoard")}`,
);

writeFile(
  "src/features/tournaments/components/RankingTable.jsx",
  `import React from "react";
import { Link } from "react-router-dom";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { buildTeamLink } from "@/features/tournaments/utils/participantHelpers";

${extract(2683, 2789).replace("function RankingTable", "export default function RankingTable")}`,
);

writeFile(
  "src/features/tournaments/components/BmpsSemiFinalsPendingPanel.jsx",
  `import React from "react";
import { Link } from "react-router-dom";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { buildTeamLink, getDisplayTeamName } from "@/features/tournaments/utils/participantHelpers";

${extract(834, 968).replace("function BmpsSemiFinalsPendingPanel", "export default function BmpsSemiFinalsPendingPanel")}`,
);

console.log("Done.");

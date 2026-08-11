const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "src/components/tournaments/TournamentDetail.jsx");
const lines = fs.readFileSync(sourcePath, "utf8").split(/\r?\n/);

const hookBody = lines.slice(3050, 3451).join("\n");

const hookFile = `import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Calendar, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { applyCurrentRosterOverride } from "@/lib/currentRosterOverrides";
import { buildLiveRoster } from "@/lib/rosterUtils";
import { getStageBoardData } from "@/lib/stageBoard";
import { resolveTournamentParticipantState } from "@/lib/bmps2026Progression";
import { decorateMatchesWithLiveStatus } from "@/lib/liveCalendar";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import {
  getOfficialParticipantEntries,
  getOfficialParticipantCount,
  isBmps2026Tournament,
} from "@/lib/tournamentParticipants";
import { getTournamentLogo } from "@/features/tournaments/utils/tournamentBranding";
import { getTournamentAllocations } from "@/features/tournaments/utils/tournamentAllocations";
import {
  BMPS_2026_STYLE_STAGE_TOURNAMENTS,
  EMPTY_NORMALIZED_STAGES,
  EMPTY_STAGE_MATCH_RESULTS,
  EMPTY_STAGE_MATCHES,
  EMPTY_STAGE_PARTICIPANT_ENTRIES,
  EMPTY_STAGE_PLAYERS,
  EMPTY_STAGE_TEAMS,
} from "@/features/tournaments/constants";
import {
  buildNormalizedParticipantEntries,
  buildNormalizedStageBoardStages,
  getCleanStageLabel,
  mergeDisplayStages,
} from "@/features/tournaments/utils/stageHelpers";
import {
  getChampionDisplayName,
  getChampionLogoOverride,
  normalizeTeamName,
} from "@/features/tournaments/utils/participantHelpers";
import { isBmps2026SurvivalStage } from "@/features/tournaments/utils/participantHelpers";

export function useTournamentDetail(tournament, requestedStage = "") {
${hookBody.replace(/^  /gm, "  ").replace(/^export default function TournamentDetail[\s\S]*?const \{ data: tournamentPage/, "  const { data: tournamentPage")}
`;

fs.writeFileSync(
  path.join(root, "src/features/tournaments/hooks/useTournamentDetail.js"),
  hookFile.replace(
    /export default function TournamentDetail\(\{ tournament, onBack, requestedStage = "" \}\) \{\n/,
    "",
  ).replace(/\n  const \{ data: tournamentPage/, "\n  const { data: tournamentPage"),
);

console.log("Wrote useTournamentDetail.js");

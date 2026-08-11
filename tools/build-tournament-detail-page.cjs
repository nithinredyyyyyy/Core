const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "src/components/tournaments/TournamentDetail.jsx");
const lines = fs.readFileSync(sourcePath, "utf8").split(/\r?\n/);

const header = `import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  Trophy,
  LayoutList,
  Gift,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TeamIdentity from "@/components/shared/TeamIdentity";
import LogoBlock from "@/components/shared/LogoBlock";
import StatusBadge from "@/components/shared/StatusBadge";
import FactCard from "@/components/tournaments/FactCard";
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
  buildTeamLink,
  getChampionDisplayName,
  getChampionLogoOverride,
  getDisplayTeamName,
  isBmps2026SurvivalStage,
  normalizeTeamName,
} from "@/features/tournaments/utils/participantHelpers";
import StageStandingsBoard from "@/features/tournaments/components/StageStandingsBoard";
import ParticipantRosterCard from "@/features/tournaments/components/ParticipantRosterCard";
import RankingTable from "@/features/tournaments/components/RankingTable";
`;

const mainComponent = lines.slice(3049).join("\n");

const output = `${header}\n${mainComponent}`;

const outPath = path.join(root, "src/features/tournaments/TournamentDetailPage.jsx");
fs.writeFileSync(outPath, output);
console.log("Wrote TournamentDetailPage.jsx", output.split("\n").length, "lines");

fs.writeFileSync(
  path.join(root, "src/components/tournaments/TournamentDetail.jsx"),
  `export { default } from "@/features/tournaments/TournamentDetailPage";\n`,
);

console.log("Replaced TournamentDetail.jsx with re-export");

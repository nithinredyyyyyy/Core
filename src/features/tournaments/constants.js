import { normalizeOrganizationName } from "@/lib/organizationIdentity";

export const BMPS_2026_STYLE_STAGE_TOURNAMENTS = new Set([
  "Battlegrounds Mobile India Series 2026",
  "Battlegrounds Mobile India International Cup 2025",
  "Battlegrounds Mobile India Showdown 2025",
  "Battlegrounds Mobile India Pro Series 2025",
  "Battlegrounds Mobile India Series 2025",
  "Battlegrounds Mobile India Pro Series 2024",
  "Battlegrounds Mobile India Series 2024",
  "Battlegrounds Mobile India Pro Series 2023",
  "India - Korea Invitational",
  "Battlegrounds Mobile India Series 2023",
]);

export const HIDDEN_PARTICIPANT_PHASE_LABELS = new Set(
  [
    "BMIC - India Showdown",
    "Pro Series Korea",
    "Japan League",
    "BMSD - Upper Bracket Invited",
    "Lower Bracket Invited",
    "Grand Finals",
    "Semi Finals 1",
    "Semi Finals 2",
  ].map((label) => normalizeOrganizationName(label)),
);

export const EMPTY_STAGE_PARTICIPANT_ENTRIES = [];
export const EMPTY_STAGE_TEAMS = [];
export const EMPTY_STAGE_PLAYERS = [];
export const EMPTY_STAGE_MATCHES = [];
export const EMPTY_STAGE_MATCH_RESULTS = [];
export const EMPTY_STAGE_RANKINGS = [];
export const EMPTY_NORMALIZED_STAGES = [];

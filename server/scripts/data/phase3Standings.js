// Phase 3 stage-standings fixation payload.
//
// Every row here is supplied by the operator. Nothing is inferred from a rank,
// and no missing value is filled from a neighbouring column.

export const SOURCE_USER_SUPPLIED = "USER_SUPPLIED_SOURCE";
export const SOURCE_PUBLISHED = "PUBLISHED_STANDINGS";

export const ABSENCE_SOURCE_UNAVAILABLE = "SOURCE_NOT_AVAILABLE";

/**
 * Supplied display name -> canonical CORE team name.
 *
 * Strictly case/spelling variants (verified: the normalised forms are identical)
 * or names CORE already uses for the same organisation elsewhere in the same
 * tournament. Resolution reuses an existing team id and never creates a team.
 *
 * Each of these has exactly one CORE team whose name normalises to the same key.
 * Where a canonical name is one CORE holds more than once, TEAM_ID_PINS below
 * names the row to use; `resolveTeamId` then resolves through the pin instead of
 * trusting whichever duplicate the name index happened to keep.
 */
export const TEAM_ALIASES = {
  // PMWC 2025 Group Stage / Grand Finals. The Grand Finals board spells these out
  // in full, and CORE's own rows use the full names, so both spellings name the
  // same existing teams.
  "4Thrives": "4Thrives Esports",
  "Regnum Carya": "Regnum Carya Esports",
  "Fire Flux": "Fire Flux Esports",
  // PMWC 2025 Group Stage rank 7 "TT Global" is CORE's "ThunderTalk Gaming": the
  // source's own Grand Finals board lists the same team at rank 16 with the
  // identical 18/0/14/40/54 line CORE stores for ThunderTalk Gaming.
  "TT Global": "ThunderTalk Gaming",
  // PMGC 2025 Group Green/Red.
  "Gen.G MENA": "Gen.G Esports MENA",
  "9z": "9z Team",
  "Gs Team": "GS Team",
  "Arcred": "ARCRED",
  // PMGC 2025 Group Red rank 9 "Alliance My" is CORE's "Alliance": the stored
  // values match exactly (18/0/39/62/101) and CORE's PMGC 2025 record uses
  // Alliance. (CORE also holds "Yoodo Alliance", so the disambiguation is by
  // stored-value equality, recorded in the AGENTS.md note.)
  "Alliance My": "Alliance",
  // BMPS 2026 Survival Stage.
  "MYTH OFFICIAL": "Myth Official",
  "TEAM AX": "Team AX",
  "VERSATILE ESPORTS": "Versatile Esports",
  "RISING ESPORTS": "Rising Esports",
  "RAPID CHAOS ESPORTS": "Rapid Chaos Esports",
  "MADKINGS": "Madkings Esports",
  "GENxFM ESPORTS": "GENxFM Esports",
  "Learn from past": "Learn From Past",
  "TROY TAMILAN ESPORTS": "Troy Tamilan Esports",
  "TEAM H4K": "Team H4K",
  "Santa Esp": "Santa Esports",
  "TeamRedXross": "Team RedXRoss",
  "ARES ESPORT": "Ares Esport",
  "QUANTUM SPARKS": "Quantum Sparks",
  "AURA x ESPORTS": "Aura X Esports",
  "T7xORION ESPORTS": "T7xOrion Esports",
  "GODSENT ESPORTS": "Godsent Esports",
  "HADX ESPORTS": "HADX Esports",
  "ThunderGods x Tortuga Gaming": "ThunderGods X Tortuga Gaming",
  "JAGUAR ESPORTS": "Jaguar Esports",
  "TEAM DOXY": "Team Doxy",
  "RIOTNATIONz": "RiotNations",
  "PHOENIX ESPORTS": "Phoenix Esports",
};

/**
 * Canonical name -> the exact team id to use, for names CORE holds more than once.
 *
 * CORE carries duplicate team rows (a pre-existing data-integrity issue, reported
 * but not fixed here). Resolving by name alone would be a coin flip. Each pin
 * names the row that is a BMPS 2026 participant with existing standings; the
 * other row is an orphan duplicate with no participation and no standings.
 */
export const TEAM_ID_PINS = {
  "Rising Esports": "27fc2f1f-d869-4362-9d13-ae9725e9d047",
  "RiotNations": "04780409-05d9-4c6b-a8e2-a10e6fa5e12c",
};

function row(rank, team, matches_played, wins, place_points, elim_points, total_points, progression_status = null) {
  return { team, rank, matches_played, wins, place_points, elim_points, total_points, progression_status };
}

// ── PMWC 2025 Group Stage ─────────────────────────────────────────────────────
// Supplied order: Matches / WWCD / Plc / Elims / Total. Complete 24-row board.
const PMWC_2025_GROUP_STAGE = [
  row(1, "Alter Ego Ares", 12, 2, 35, 86, 121),
  row(2, "4Thrives", 12, 2, 46, 65, 111),
  row(3, "Weibo Gaming", 12, 0, 31, 58, 89),
  row(4, "DRX", 12, 2, 38, 51, 89),
  row(5, "Team Secret", 12, 0, 40, 46, 86),
  row(6, "Alpha Gaming", 12, 1, 26, 60, 86),
  row(7, "TT Global", 12, 1, 21, 62, 83),
  row(8, "IDA Esports", 12, 0, 29, 54, 83),
  row(9, "Regnum Carya", 12, 2, 31, 50, 81),
  row(10, "Nongshim RedForce", 12, 2, 30, 46, 76),
  row(11, "Yangon Galacticos", 12, 1, 26, 49, 75),
  row(12, "Horaa Esports", 12, 0, 21, 49, 70),
  row(13, "Alpha7 Esports", 12, 2, 26, 44, 70),
  row(14, "POWR eSports", 12, 2, 23, 40, 63),
  row(15, "Team AxTMG", 12, 1, 29, 33, 62),
  row(16, "Team Vision", 12, 0, 18, 41, 59),
  row(17, "eArena", 12, 0, 20, 38, 58),
  row(18, "INFLUENCE RAGE", 12, 0, 13, 41, 54),
  row(19, "R8 Esports", 12, 0, 11, 39, 50),
  row(20, "INTENSE GAME", 12, 0, 18, 27, 45),
  row(21, "Fire Flux", 12, 0, 19, 19, 38),
  row(22, "Team Falcons", 12, 0, 11, 26, 37),
  row(23, "KINOTROPE", 12, 0, 5, 31, 36),
  row(24, "Team GAMAX", 12, 0, 9, 17, 26),
];

// ── PMWC 2025 Survival Stage ──────────────────────────────────────────────────
const PMWC_2025_SURVIVAL_STAGE = [
  row(1, "Horaa Esports", 12, 2, 36, 72, 108),
  row(2, "Fire Flux", 12, 2, 40, 64, 104),
  row(3, "POWR eSports", 12, 2, 31, 73, 104),
  row(4, "Regnum Carya", 12, 1, 36, 64, 100),
  row(5, "eArena", 12, 2, 36, 56, 92),
  row(6, "Nongshim RedForce", 12, 1, 28, 64, 92),
  row(7, "Team Falcons", 12, 0, 29, 42, 71),
  row(8, "Yangon Galacticos", 12, 1, 31, 39, 70),
  row(9, "INFLUENCE RAGE", 12, 0, 22, 47, 69),
  row(10, "R8 Esports", 12, 1, 20, 35, 55),
  row(11, "Team Vision", 12, 0, 14, 36, 50),
  row(12, "INTENSE GAME", 12, 0, 10, 38, 48),
  row(13, "Alpha7 Esports", 12, 0, 19, 26, 45),
  row(14, "Team AxTMG", 12, 0, 9, 28, 37),
  row(15, "KINOTROPE", 12, 0, 12, 18, 30),
  row(16, "Team GAMAX", 12, 0, 11, 16, 27),
];

// ── PMWC 2025 Grand Finals ────────────────────────────────────────────────────
const PMWC_2025_GRAND_FINALS = [
  row(1, "Yangon Galacticos", 18, 4, 62, 95, 157),
  row(2, "Weibo Gaming", 18, 2, 58, 84, 142),
  row(3, "Alpha Gaming", 18, 1, 44, 97, 141),
  row(4, "DRX", 18, 1, 50, 67, 117),
  row(5, "Regnum Carya", 18, 2, 50, 62, 112),
  row(6, "Nongshim RedForce", 18, 1, 36, 74, 110),
  row(7, "4Thrives", 18, 1, 31, 78, 109),
  row(8, "Alter Ego Ares", 18, 2, 28, 76, 104),
  row(9, "Horaa Esports", 18, 1, 31, 69, 100),
  row(10, "Team Falcons", 18, 2, 31, 64, 95),
  row(11, "IDA Esports", 18, 0, 41, 51, 92),
  row(12, "POWR eSports", 18, 1, 28, 61, 89),
  row(13, "Team Secret", 18, 0, 34, 49, 83),
  row(14, "Fire Flux", 18, 0, 15, 67, 82),
  row(15, "eArena", 18, 0, 23, 34, 57),
  row(16, "TT Global", 18, 0, 14, 40, 54),
];

// ── PMGC 2025 Group Green ─────────────────────────────────────────────────────
// Progression is supplied explicitly, not derived from rank.
const PMGC_2025_GROUP_GREEN = [
  row(1, "Alpha Gaming", 18, 4, 66, 108, 174, "Advances to Grand Finals"),
  row(2, "Dplus", 18, 2, 52, 97, 149, "Advances to Grand Finals"),
  row(3, "GOAT Team", 18, 3, 43, 90, 133, "Advances to Grand Finals"),
  row(4, "Wolves Esports", 18, 0, 33, 82, 115, "Advances to Last Chance"),
  row(5, "Inner Circle Esports", 18, 1, 27, 87, 114, "Advances to Last Chance"),
  row(6, "Gen.G MENA", 18, 2, 34, 74, 108, "Advances to Last Chance"),
  row(7, "Loops Esports", 18, 0, 22, 84, 106, "Advances to Last Chance"),
  row(8, "Alter Ego Ares", 18, 1, 30, 75, 105, "Advances to Last Chance"),
  row(9, "Team Falcons", 18, 1, 25, 79, 104, "Advances to Last Chance"),
  row(10, "Papara Supermassive", 18, 0, 26, 78, 104, "Advances to Last Chance"),
  row(11, "9z", 18, 2, 27, 71, 98, "Advances to Last Chance"),
  row(12, "Tianba", 18, 1, 20, 78, 98, "Eliminated"),
  row(13, "Gs Team", 18, 0, 18, 80, 98, "Eliminated"),
  row(14, "Orangutan", 18, 1, 21, 70, 91, "Eliminated"),
  row(15, "REJECT", 18, 0, 15, 63, 78, "Eliminated"),
  row(16, "Team Secret", 18, 0, 7, 25, 32, "Eliminated"),
];

// ── PMGC 2025 Group Red ───────────────────────────────────────────────────────
const PMGC_2025_GROUP_RED = [
  row(1, "DRX", 18, 5, 68, 111, 179, "Advances to Grand Finals"),
  row(2, "Regnum Carya Esports", 18, 2, 60, 101, 161, "Advances to Grand Finals"),
  row(3, "eArena", 18, 1, 47, 90, 137, "Advances to Grand Finals"),
  row(4, "Team Flash", 18, 2, 52, 84, 136, "Advances to Last Chance"),
  row(5, "Weibo Gaming", 18, 2, 48, 88, 136, "Advances to Last Chance"),
  row(6, "INFLUENCE RAGE", 18, 1, 49, 79, 128, "Advances to Last Chance"),
  row(7, "Arcred", 18, 2, 39, 88, 127, "Advances to Last Chance"),
  row(8, "Burmese Ghouls", 18, 2, 45, 63, 108, "Advances to Last Chance"),
  row(9, "Alliance My", 18, 0, 39, 62, 101, "Advances to Last Chance"),
  row(10, "Geekay Esports", 18, 0, 29, 64, 93, "Advances to Last Chance"),
  row(11, "Boars Gaming", 18, 0, 24, 60, 84, "Advances to Last Chance"),
  row(12, "Virtus.Pro", 18, 0, 26, 52, 78, "Eliminated"),
  row(13, "Twisted Minds", 18, 1, 25, 50, 75, "Eliminated"),
  row(14, "True Rippers", 18, 0, 25, 37, 62, "Eliminated"),
  row(15, "ETSH Esports", 18, 0, 17, 22, 39, "Eliminated"),
  row(16, "Nuclear Zone", 18, 0, 13, 26, 39, "Eliminated"),
];

// ── BMPS 2026 Survival Stage ──────────────────────────────────────────────────
// The instruction labels this "BMPS 2025 Survival", but the board is BMPS 2026:
// CORE's BMPS 2025 defines no Survival stage, the 32-team composition matches
// BMPS 2026's Survival Stage, and BMPS 2026's Survival Stage is empty. Applied to
// BMPS 2026 / Survival Stage; no BMPS 2025 Survival stage is created.
//
// Supplied order: Total / Finishes / Pos Pts / WWCD / Matches.
const BMPS_2026_SURVIVAL_STAGE = [
  row(1, "Team Apex Gaming", 12, 2, 49, 88, 137, "Semi Finals"),
  row(2, "MYTH OFFICIAL", 12, 2, 40, 82, 122, "Semi Finals"),
  row(3, "TEAM AX", 12, 2, 45, 75, 120, "Semi Finals"),
  row(4, "True Rippers", 12, 2, 34, 83, 117, "Semi Finals"),
  row(5, "VERSATILE ESPORTS", 12, 2, 33, 73, 106, "Semi Finals"),
  row(6, "Lastade Esports", 12, 1, 38, 60, 98, "Semi Finals"),
  row(7, "RISING ESPORTS", 12, 2, 42, 53, 95, "Semi Finals"),
  row(8, "RAPID CHAOS ESPORTS", 12, 1, 35, 59, 94, "Semi Finals"),
  row(9, "MADKINGS", 12, 1, 29, 64, 93, "Eliminated"),
  row(10, "GENxFM ESPORTS", 12, 1, 33, 59, 92, "Eliminated"),
  row(11, "K9 Esports", 12, 0, 29, 59, 88, "Eliminated"),
  row(12, "Esport Social", 12, 2, 32, 52, 84, "Eliminated"),
  row(13, "Learn from past", 12, 1, 29, 52, 81, "Eliminated"),
  row(14, "TROY TAMILAN ESPORTS", 12, 1, 31, 46, 77, "Eliminated"),
  row(15, "DCxSCR Esports", 12, 0, 27, 50, 77, "Eliminated"),
  row(16, "TEAM H4K", 12, 0, 17, 57, 74, "Eliminated"),
  row(17, "Santa Esp", 12, 0, 20, 52, 72, "Eliminated"),
  row(18, "TeamRedXross", 12, 1, 24, 47, 71, "Eliminated"),
  row(19, "ARES ESPORT", 12, 0, 26, 45, 71, "Eliminated"),
  row(20, "QUANTUM SPARKS", 12, 0, 22, 46, 68, "Eliminated"),
  row(21, "AURA x ESPORTS", 12, 0, 24, 41, 65, "Eliminated"),
  row(22, "T7xORION ESPORTS", 12, 1, 14, 42, 56, "Eliminated"),
  row(23, "NoNx Esports", 12, 0, 17, 37, 54, "Eliminated"),
  row(24, "GODSENT ESPORTS", 12, 0, 12, 38, 50, "Eliminated"),
  row(25, "HADX ESPORTS", 12, 0, 13, 31, 44, "Eliminated"),
  row(26, "ThunderGods x Tortuga Gaming", 12, 0, 6, 37, 43, "Eliminated"),
  row(27, "Naqsh Esports", 12, 1, 18, 23, 41, "Eliminated"),
  row(28, "JAGUAR ESPORTS", 12, 1, 13, 26, 39, "Eliminated"),
  row(29, "TEAM DOXY", 12, 0, 6, 30, 36, "Eliminated"),
  row(30, "RIOTNATIONz", 12, 0, 1, 33, 34, "Eliminated"),
  row(31, "PHOENIX ESPORTS", 12, 0, 4, 27, 31, "Eliminated"),
  row(32, "Likitha Esports", 12, 0, 5, 15, 20, "Eliminated"),
];

// ── PMWC 2026 Survival Stage ──────────────────────────────────────────────────
// Supplied order: Matches / Wins / Placement / Finishes / Total.
const PMWC_2026_SURVIVAL_STAGE = [
  row(1, "Tianba", 12, 2, 39, 70, 109, "Grand Finals"),
  row(2, "AlUla Club Esports", 12, 1, 29, 62, 91, "Grand Finals"),
  row(3, "Nongshim Redforce", 12, 1, 30, 59, 89, "Grand Finals"),
  row(4, "FURIA Esports", 12, 0, 24, 61, 85, "Grand Finals"),
  row(5, "ULF Esports", 12, 2, 36, 48, 84, "Grand Finals"),
  row(6, "eArena", 12, 1, 33, 46, 79, "Grand Finals"),
  row(7, "Wolves Esports", 12, 0, 24, 55, 79, "Eliminated"),
  row(8, "GOAT Team", 12, 1, 18, 60, 78, "Eliminated"),
  row(9, "Alpha7 Esports", 12, 0, 23, 49, 72, "Eliminated"),
  row(10, "AG.AL International", 12, 1, 23, 47, 70, "Eliminated"),
  row(11, "DOPENESS", 12, 1, 23, 43, 66, "Eliminated"),
  row(12, "Geekay Esports", 12, 1, 20, 45, 65, "Eliminated"),
  row(13, "RRQ RYU", 12, 0, 16, 47, 63, "Eliminated"),
  row(14, "Yangon Galacticos", 12, 0, 19, 34, 53, "Eliminated"),
  row(15, "Kiwoom DRX", 12, 1, 16, 31, 47, "Eliminated"),
  row(16, "721 Esports", 12, 0, 11, 34, 45, "Eliminated"),
];

/**
 * The stages this fixation writes, in apply order.
 *
 * `scope` says where the board lives inside its stage:
 *   - "overall": one stage-wide board, written with group_id NULL.
 *   - "group":   one board inside a named group of the stage.
 *   - "existing-rows": the stage's ranking is already partitioned across named
 *     groups. Each supplied team is matched to the group row it already occupies
 *     and updated in place; a team with no stored row is reported, not placed,
 *     because the source does not say which group it belongs to and a stage-wide
 *     board would duplicate every grouped team.
 *
 * `expectRows` is the board size after the apply, checked as a post-condition.
 * For "existing-rows" it is the stage total, which the apply must not change.
 */
export const STANDINGS_TARGETS = [
  {
    tournament: "PUBG Mobile World Cup 2025",
    stage: "Group Stage",
    scope: "existing-rows",
    group: null,
    source: {
      name: SOURCE_USER_SUPPLIED,
      ref: "PMWC 2025 Group Stage standings, order Matches/WWCD/Plc/Elims/Total",
      url: null,
    },
    expectRows: 21,
    rows: PMWC_2025_GROUP_STAGE,
  },
  {
    tournament: "PUBG Mobile World Cup 2025",
    stage: "Survival Stage",
    scope: "overall",
    group: null,
    source: {
      name: SOURCE_USER_SUPPLIED,
      ref: "PMWC 2025 Survival Stage standings, order Matches/Wins/Placement/Finishes/Total",
      url: null,
    },
    expectRows: 16,
    rows: PMWC_2025_SURVIVAL_STAGE,
  },
  {
    tournament: "PUBG Mobile World Cup 2025",
    stage: "Grand Finals",
    scope: "overall",
    group: null,
    source: {
      name: SOURCE_USER_SUPPLIED,
      ref: "PMWC 2025 Grand Finals standings, order Matches/Wins/Placement/Finishes/Total",
      url: null,
    },
    expectRows: 16,
    rows: PMWC_2025_GRAND_FINALS,
  },
  {
    tournament: "PUBG Mobile Global Championship 2025",
    stage: "Group Stage",
    scope: "group",
    group: "Group Green",
    source: {
      name: SOURCE_PUBLISHED,
      ref: "PMGC 2025 Group Green standings, order Matches/Wins/Placement/Finishes/Total",
      url: null,
    },
    expectRows: 16,
    rows: PMGC_2025_GROUP_GREEN,
  },
  {
    tournament: "PUBG Mobile Global Championship 2025",
    stage: "Group Stage",
    scope: "group",
    group: "Group Red",
    source: {
      name: SOURCE_PUBLISHED,
      ref: "PMGC 2025 Group Red standings, order Matches/Wins/Placement/Finishes/Total",
      url: null,
    },
    expectRows: 16,
    rows: PMGC_2025_GROUP_RED,
  },
  {
    tournament: "Battlegrounds Mobile India Pro Series 2026",
    stage: "Survival Stage",
    scope: "overall",
    group: null,
    source: {
      name: SOURCE_USER_SUPPLIED,
      ref: "BMPS 2026 Survival Stage standings, order Total/Finishes/Pos Pts/WWCD/Matches",
      url: null,
    },
    expectRows: 32,
    rows: BMPS_2026_SURVIVAL_STAGE,
  },
  {
    tournament: "PUBG Mobile World Cup 2026",
    stage: "Survival Stage",
    scope: "overall",
    group: null,
    source: {
      name: SOURCE_USER_SUPPLIED,
      ref: "PMWC 2026 Survival Stage standings, order Matches/Wins/Placement/Finishes/Total",
      url: null,
    },
    expectRows: 16,
    rows: PMWC_2026_SURVIVAL_STAGE,
  },
];

/**
 * Requested stages that are deliberately NOT written, with the reason and the
 * precise blocker.
 */
export const DEFERRED_TARGETS = [
  {
    tournament: "Battlegrounds Mobile India Pro Series 2024",
    stage: "Semi Finals",
    reason: ABSENCE_SOURCE_UNAVAILABLE,
    unresolvedTeams: [],
    detail:
      "The instruction says the supplied source contains a per-round P/K board for this stage (24 teams x 16 matches). No such board exists in the repository, in CORE, or in the task text; only the aggregate rank/total narrative was insufficient to rebuild it. The 24-team Semi Finals field is not the 16-team Finalist list in import-bmps-2024.js, and that list carries no per-round placements or kills.",
    requiredToProceed:
      "Provide the 24-team x 16-match P/K board (or any per-round placement/kill table) for BMPS 2024 Semi Finals. Reconstructing the agreed place/elim/total invariants without it would invent roughly 768 cells.",
  },
];

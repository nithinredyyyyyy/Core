// Phase 3 stage-standings fixation payload.
//
// Every row here is supplied by the operator. Nothing is inferred from a rank,
// and no missing value is filled from a neighbouring column. Where the source
// does not exist or a team identity cannot be established, the stage is reported
// rather than filled.
//
// The supplied column order genuinely differs between events (PMWC orders
// Matches/Wins/Placement/Finishes/Total; BMPS orders Total/Finishes/Pos
// Pts/WWCD/Matches). Mapping is always by the supplied order stated per board,
// never by guessing from magnitudes.
//
// Provenance: source_name is a classification, not a fabricated citation.
// source_url stays null — these are hand-supplied boards with no single canonical
// URL, and inventing one would be a false provenance claim.

export const SOURCE_USER_SUPPLIED = "USER_SUPPLIED_SOURCE";
export const SOURCE_PUBLISHED = "PUBLISHED_STANDINGS";

export const ABSENCE_SOURCE_UNAVAILABLE = "SOURCE_NOT_AVAILABLE";
export const ABSENCE_IDENTITY_UNRESOLVED = "TEAM_IDENTITY_UNRESOLVED";
export const ABSENCE_YEAR_UNCERTAIN = "TOURNAMENT_YEAR_UNCERTAIN";

/**
 * Supplied display name -> canonical CORE team name, for cases where the source
 * label differs from CORE's row but is unambiguously the same organisation.
 *
 * Only spelling/variant differences belong here. Every entry names an
 * organisation CORE already holds and uses elsewhere in the same tournament, so
 * resolution reuses an existing team id and never creates a team.
 *
 * Deliberately absent: "TT Global", "Alliance My", "Santa Esp". Those cannot be
 * established as variants of an existing CORE team without guessing, so the
 * stages needing them are deferred (see DEFERRED_TARGETS).
 */
export const TEAM_ALIASES = {
  "4Thrives": "4Thrives Esports",
  "Regnum Carya": "Regnum Carya Esports",
  "Fire Flux": "Fire Flux Esports",
  "Gen.G MENA": "Gen.G Esports MENA",
  "9z": "9z Team",
  "Gs Team": "GS Team",
  "Arcred": "ARCRED",
};

function row(rank, team, matches_played, wins, place_points, elim_points, total_points, progression_status = null) {
  return {
    team,
    rank,
    matches_played,
    wins,
    place_points,
    elim_points,
    total_points,
    progression_status,
  };
}

// ── PMWC 2025 Group Stage ─────────────────────────────────────────────────────
// Supplied order: Matches / Wins(WWCD) / Placement / Finishes / Total.
// The board carries no rank 2, 9 or 12 row; CORE has no rows at those ranks
// either, so nothing is preserved or invented to fill them. 21 rows total.
const PMWC_2025_GROUP_STAGE = [
  row(1, "Alter Ego Ares", 12, 2, 35, 86, 121),
  row(3, "Weibo Gaming", 12, 0, 31, 58, 89),
  row(4, "DRX", 12, 2, 38, 51, 89),
  row(5, "Team Secret", 12, 0, 40, 46, 86),
  row(6, "Alpha Gaming", 12, 1, 26, 60, 86),
  row(7, "ThunderTalk Gaming", 12, 1, 21, 62, 83),
  row(8, "IDA Esports", 12, 0, 29, 54, 83),
  row(10, "Nongshim RedForce", 12, 2, 30, 46, 76),
  row(11, "Yangon Galacticos", 12, 1, 26, 49, 75),
  row(13, "Horaa Esports", 12, 0, 21, 49, 70),
  row(14, "POWR Esports", 12, 2, 23, 40, 63),
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
// Supplied order: Matches / Wins / Placement / Finishes / Total. Complete board.
const PMWC_2025_SURVIVAL_STAGE = [
  row(1, "Horaa Esports", 12, 2, 36, 72, 108),
  row(2, "Fire Flux", 12, 2, 40, 64, 104),
  row(3, "POWR Esports", 12, 2, 31, 73, 104),
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

// ── PMGC 2025 Group Green ─────────────────────────────────────────────────────
// Supplied order: Matches / Wins(WWCD) / Placement / Finishes / Total.
// Progression is supplied explicitly, not derived from rank.
const PMGC_2025_GROUP_GREEN = [
  row(1, "Alpha Gaming", 18, 4, 66, 108, 174, "Qualified for Grand Finals"),
  row(2, "Dplus", 18, 2, 52, 97, 149, "Qualified for Grand Finals"),
  row(3, "GOAT Team", 18, 3, 43, 90, 133, "Qualified for Grand Finals"),
  row(4, "Wolves Esports", 18, 0, 33, 82, 115, "Qualified for Last Chance"),
  row(5, "Inner Circle Esports", 18, 1, 27, 87, 114, "Qualified for Last Chance"),
  row(6, "Gen.G MENA", 18, 2, 34, 74, 108, "Qualified for Last Chance"),
  row(7, "Loops Esports", 18, 0, 22, 84, 106, "Qualified for Last Chance"),
  row(8, "Alter Ego Ares", 18, 1, 30, 75, 105, "Qualified for Last Chance"),
  row(9, "Team Falcons", 18, 1, 25, 79, 104, "Qualified for Last Chance"),
  row(10, "Papara Supermassive", 18, 0, 26, 78, 104, "Qualified for Last Chance"),
  row(11, "9z", 18, 2, 27, 71, 98, "Qualified for Last Chance"),
  row(12, "Tianba", 18, 1, 20, 78, 98, "Eliminated"),
  row(13, "Gs Team", 18, 0, 18, 80, 98, "Eliminated"),
  row(14, "Orangutan", 18, 1, 21, 70, 91, "Eliminated"),
  row(15, "REJECT", 18, 0, 15, 63, 78, "Eliminated"),
  row(16, "Team Secret", 18, 0, 7, 25, 32, "Eliminated"),
];

// ── PMWC 2026 Survival Stage ──────────────────────────────────────────────────
// Supplied order: Matches / Wins / Placement / Finishes / Total.
const PMWC_2026_SURVIVAL_STAGE = [
  row(1, "Tianba", 12, 2, 39, 70, 109, "Qualified to Grand Finals"),
  row(2, "AlUla Club Esports", 12, 1, 29, 62, 91, "Qualified to Grand Finals"),
  row(3, "Nongshim Redforce", 12, 1, 30, 59, 89, "Qualified to Grand Finals"),
  row(4, "FURIA Esports", 12, 0, 24, 61, 85, "Qualified to Grand Finals"),
  row(5, "ULF Esports", 12, 2, 36, 48, 84, "Qualified to Grand Finals"),
  row(6, "eArena", 12, 1, 33, 46, 79, "Qualified to Grand Finals"),
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
 *   - "overall": one stage-wide board, stored with group_id NULL;
 *   - "group":   one board inside a named group of the stage;
 *   - "existing-rows": update the stage's existing rows in place, matching each
 *     supplied team to the row already present. Used when the board is already
 *     stored but partitioned (PMWC 2025 Group Stage keeps Green/Red/Yellow
 *     boards); writing a second stage-wide copy would put the same team in the
 *     same stage twice, so this path asserts the stored values and adds
 *     provenance instead. A team with no existing row is a hard error, never an
 *     insert.
 *
 * `expectRows` is the board size after the apply, checked as a post-condition.
 */
export const STANDINGS_TARGETS = [
  {
    tournament: "PUBG Mobile World Cup 2025",
    stage: "Group Stage",
    scope: "existing-rows",
    group: null,
    source: {
      name: SOURCE_USER_SUPPLIED,
      ref: "PMWC 2025 Group Stage standings, order Matches/Wins/Placement/Finishes/Total",
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
 * precise blocker. Reported, never faked. The task rule is explicit: an
 * unresolved team stops that stage rather than being guessed into a duplicate.
 */
export const DEFERRED_TARGETS = [
  {
    tournament: "Battlegrounds Mobile India Pro Series 2024",
    stage: "Semi Finals",
    reason: ABSENCE_SOURCE_UNAVAILABLE,
    unresolvedTeams: [],
    detail:
      "The instruction assumes a supplied per-round P/K board (24 teams x 16 matches). No such board exists in the repository, in CORE, or in the task text. The 24-team Semi Finals field is not the 16-team Finalist list in import-bmps-2024.js, and that list carries no per-round placements or kills.",
    requiredToProceed:
      "Provide the 24-team x 16-match P/K board (or any per-round placement/kill table) for BMPS 2024 Semi Finals. Reconstructing the agreed place/elim/total invariants without it would invent roughly 768 cells.",
  },
  {
    tournament: "PUBG Mobile World Cup 2025",
    stage: "Grand Finals",
    reason: ABSENCE_IDENTITY_UNRESOLVED,
    unresolvedTeams: ["TT Global"],
    detail:
      "Rank 16 of the supplied 16-team board is 'TT Global'. No CORE team or alias matches it, and it is not an unambiguous variant of an existing team. CORE's own Grand Finals row at rank 16 is 'ThunderTalk Gaming' with identical supplied values (18/0/14/40/54), but CORE also holds a separate 'TT Global'-shaped ambiguity risk, so the identity is not asserted here.",
    requiredToProceed:
      "Confirm the canonical identity for 'TT Global' (or supply its CORE team id). Confirm whether it is CORE's rank-16 'ThunderTalk Gaming' row.",
  },
  {
    tournament: "PUBG Mobile Global Championship 2025",
    stage: "Group Stage",
    group: "Group Red",
    reason: ABSENCE_IDENTITY_UNRESOLVED,
    unresolvedTeams: ["Alliance My"],
    detail:
      "Rank 9 of the supplied Group Red board is 'Alliance My'. CORE holds both 'Alliance' and 'Yoodo Alliance', so the intended organisation cannot be chosen without guessing.",
    requiredToProceed:
      "Confirm whether 'Alliance My' is CORE's 'Alliance' or 'Yoodo Alliance' (or another team). CORE's existing Group Red rank 9 is 'Alliance' with identical supplied values (18/0/39/62/101).",
  },
  {
    tournament: "Battlegrounds Mobile India Pro Series 2025",
    stage: "Survival Stage",
    reason: ABSENCE_YEAR_UNCERTAIN,
    unresolvedTeams: ["Santa Esp"],
    detail:
      "Two independent problems. (1) CORE's BMPS 2025 defines no Survival stage at all; its stages are League Stage, Rounds 1-3, Semi Finals Week 1, Semi Finals Week 2 and Grand Finals. (2) The supplied 32-team board's composition, including its 32-team group split, matches the BMPS 2026 Survival Stage, but BMPS 2026's Survival Stage is empty in CORE and 3 resolvable supplied teams (DCxSCR Esports, Esport Social, Likitha Esports) are not BMPS 2026 participants. Writing it under either year would attach correct-looking rows to the wrong event.",
    requiredToProceed:
      "Confirm which edition this Survival Stage belongs to (2025 or 2026), the correct stage name, and the canonical identity of 'Santa Esp' (CORE holds 'Santa Esports').",
  },
];

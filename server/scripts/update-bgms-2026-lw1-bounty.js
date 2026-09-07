import { db } from "../db.js";

const TOURNAMENT_NAME = "BGMI Masters Series Season 5";
const now = new Date().toISOString();

const tournament = db.prepare("SELECT * FROM tournaments WHERE name = ?").get(TOURNAMENT_NAME);
if (!tournament) { console.error(`"${TOURNAMENT_NAME}" not found`); process.exit(1); }

const stages = JSON.parse(tournament.stages);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// g(p, k) = {placement, kills}  |  null = team not in this game
const g = (p, k) => ({ placement: p, kills: k });
const _ = null; // not played

// ---------------------------------------------------------------------------
// League Week 1 — 24 teams, 24 games (16 per team)
// Game schedule by group pairing:
//  G1-3:   A+C play,  B sits  |  G4-6:   A+B play,  C sits
//  G7-9:   B+C play,  A sits  |  G10-12: A+C play,  B sits
//  G13-15: A+B play,  C sits  |  G16-18: B+C play,  A sits
//  G19-20: A+C play,  B sits  |  G21-22: A+B play,  C sits
//  G23-24: B+C play,  A sits
// ---------------------------------------------------------------------------
// Each entry: [rank, team, group, total, qualifiesTo, [g1..g24]]
const LW1_TEAMS = [
  // ── Group A ──────────────────────────────────────────────────────────────
  // skips G7-9, G16-18, G23-24
  [1,  "Genesis Esports",   "A", 230, "Bounty Weekend",
    [g(9,7),g(13,9),g(14,1),g(15,7),g(7,0),g(7,1),_,_,_,g(1,19),g(4,9),g(15,2),g(15,10),g(5,1),g(5,11),_,_,_,g(10,8),g(5,4),g(1,19),g(15,2),_,_]],
  [7,  "Revenant XSpark",   "A", 180, "Bounty Weekend",
    [g(7,10),g(3,11),g(7,6),g(1,12),g(16,0),g(1,8),_,_,_,g(13,3),g(11,3),g(5,4),g(2,11),g(15,0),g(13,4),_,_,_,g(3,4),g(1,10),g(8,6),g(8,2),_,_]],
  [9,  "Zero Ark",          "A", 173, "Bounty Weekend",
    [g(6,9),g(10,0),g(10,2),g(6,13),g(11,0),g(5,6),_,_,_,g(12,9),g(1,11),g(11,1),g(12,3),g(16,1),g(2,4),_,_,_,g(7,6),g(6,8),g(5,5),g(7,5),_,_]],
  [14, "Rapid Chaos",       "A", 161, "Bounty Weekend",
    [g(8,8),g(14,1),g(9,6),g(4,7),g(15,1),g(12,1),_,_,_,g(4,3),g(2,3),g(4,7),g(3,11),g(3,6),g(3,5),_,_,_,g(11,6),g(16,0),g(4,7),g(16,1),_,_]],
  [15, "Vasista Esports",   "A", 160, "Bounty Weekend",
    [g(12,4),g(8,10),g(16,1),g(3,11),g(9,7),g(6,6),_,_,_,g(8,9),g(16,1),g(1,5),g(14,3),g(14,0),g(16,1),_,_,_,g(1,11),g(10,0),g(3,12),g(9,2),_,_]],
  [17, "Myth Official",     "A", 152, "League Week 2",
    [g(13,6),g(11,1),g(6,4),g(16,2),g(4,12),g(8,1),_,_,_,g(2,2),g(5,3),g(16,4),g(4,3),g(6,0),g(15,0),_,_,_,g(9,6),g(11,3),g(7,9),g(1,11),_,_]],
  [18, "K9 Esports",        "A", 150, "League Week 2",
    [g(11,7),g(1,4),g(12,3),g(2,8),g(8,6),g(15,2),_,_,_,g(9,6),g(7,6),g(2,12),g(11,4),g(11,2),g(9,4),_,_,_,g(13,3),g(12,0),g(12,2),g(10,2),_,_]],
  [20, "Nebula Esports",    "A", 141, "League Week 2",
    [g(5,10),g(6,11),g(11,0),g(13,7),g(14,0),g(13,0),_,_,_,g(6,5),g(13,0),g(10,5),g(7,10),g(13,2),g(8,3),_,_,_,g(8,11),g(7,5),g(16,4),g(5,7),_,_]],

  // ── Group B ──────────────────────────────────────────────────────────────
  // skips G1-3, G10-12, G19-20
  [2,  "Team Outrage",      "B", 211, "Bounty Weekend",
    [_,_,_,g(5,9),g(12,2),g(14,6),g(4,9),g(7,3),g(1,11),_,_,_,g(13,1),g(10,3),g(1,10),g(5,18),g(6,3),g(4,9),_,_,g(11,3),g(14,3),g(13,8),g(8,3)]],
  [4,  "8Bit",              "B", 193, "Bounty Weekend",
    [_,_,_,g(12,2),g(5,3),g(16,0),g(1,10),g(10,0),g(4,0),_,_,_,g(9,11),g(12,8),g(14,3),g(7,5),g(11,5),g(14,3),_,_,g(9,8),g(3,6),g(12,6),g(12,7)]],
  [5,  "Gladiators Esports","B", 185, "Bounty Weekend",
    [_,_,_,g(8,4),g(6,2),g(3,9),g(12,9),g(1,13),g(6,5),_,_,_,g(5,8),g(4,4),g(12,1),g(1,11),g(3,7),g(10,2),_,_,g(10,8),g(2,2),g(8,5),g(16,2)]],
  [6,  "Team SouL",         "B", 184, "Bounty Weekend",
    [_,_,_,g(10,11),g(2,7),g(9,6),g(16,4),g(13,7),g(10,4),_,_,_,g(16,3),g(9,7),g(4,2),g(4,11),g(12,2),g(13,0),_,_,g(15,4),g(11,6),g(16,0),g(4,3)]],
  [10, "Elite Nova",        "B", 171, "Bounty Weekend",
    [_,_,_,g(9,3),g(3,10),g(11,2),g(8,1),g(12,1),g(5,4),_,_,_,g(1,14),g(1,9),g(6,2),g(14,1),g(15,0),g(9,2),_,_,g(2,13),g(6,3),g(11,7),g(10,6)]],
  [21, "Wyld Fangs",        "B", 135, "League Week 2",
    [_,_,_,g(11,3),g(13,0),g(4,2),g(5,3),g(14,3),g(11,2),_,_,_,g(6,4),g(2,7),g(11,0),g(12,3),g(4,3),g(3,9),_,_,g(6,3),g(4,6),g(3,6),g(3,3)]],
  [22, "HyperCatz",         "B", 126, "League Week 2",
    [_,_,_,g(7,3),g(1,9),g(10,7),g(9,9),g(8,2),g(16,0),_,_,_,g(10,8),g(7,4),g(10,3),g(16,3),g(14,1),g(2,5),_,_,g(13,0),g(13,0),g(4,4),g(6,3)]],
  [23, "Santa Esports",     "B", 115, "Eliminated",
    [_,_,_,g(14,7),g(10,2),g(2,5),g(7,4),g(16,0),g(14,4),_,_,_,g(8,5),g(8,6),g(7,5),g(2,10),g(16,0),g(11,1),_,_,g(14,1),g(12,0),g(2,9),g(9,0)]],

  // ── Group C ──────────────────────────────────────────────────────────────
  // skips G4-6, G13-15, G21-22
  [3,  "Apex Gaming",       "C", 205, "Bounty Weekend",
    [g(14,2),g(9,3),g(3,4),_,_,_,g(2,19),g(4,4),g(13,7),g(11,9),g(10,9),g(13,4),_,_,_,g(15,5),g(10,5),g(7,6),g(4,8),g(8,4),_,_,g(14,2),g(13,2)]],
  [8,  "Epigrotive Gaming", "C", 180, "Bounty Weekend",
    [g(10,4),g(15,1),g(2,11),_,_,_,g(15,2),g(3,7),g(8,6),g(10,3),g(9,2),g(6,8),_,_,_,g(3,6),g(9,6),g(16,1),g(12,9),g(15,3),_,_,g(1,22),g(11,2)]],
  [11, "Team Tamilas",      "C", 171, "Bounty Weekend",
    [g(2,6),g(12,1),g(5,5),_,_,_,g(3,8),g(15,6),g(15,1),g(3,13),g(15,1),g(7,4),_,_,_,g(11,4),g(2,10),g(8,1),g(14,2),g(14,0),_,_,g(7,11),g(14,0)]],
  [12, "Quantum Sparks",    "C", 162, "Bounty Weekend",
    [g(15,2),g(5,2),g(8,1),_,_,_,g(6,6),g(6,0),g(3,3),g(16,2),g(3,4),g(12,4),_,_,_,g(8,7),g(1,8),g(6,4),g(2,6),g(3,11),_,_,g(9,6),g(5,1)]],
  [13, "Reckoning Esports", "C", 161, "Bounty Weekend",
    [g(3,4),g(2,3),g(13,3),_,_,_,g(10,4),g(5,5),g(9,0),g(15,0),g(8,6),g(14,2),_,_,_,g(6,6),g(7,3),g(1,11),g(15,6),g(9,0),_,_,g(6,4),g(1,9)]],
  [16, "White Walkers",     "C", 157, "Bounty Weekend",
    [g(1,17),g(16,0),g(1,8),_,_,_,g(11,5),g(11,1),g(12,3),g(5,5),g(14,0),g(8,0),_,_,_,g(13,3),g(13,5),g(12,0),g(5,4),g(4,6),_,_,g(10,8),g(7,10)]],
  [19, "7Gods Esports",     "C", 144, "League Week 2",
    [g(4,3),g(7,1),g(4,5),_,_,_,g(14,2),g(2,7),g(2,1),g(14,9),g(6,0),g(3,0),_,_,_,g(10,2),g(8,0),g(15,3),g(6,11),g(2,4),_,_,g(5,5),g(2,9)]],
  [24, "Aura x Esports",    "C",  87, "Eliminated",
    [g(16,8),g(4,1),g(15,0),_,_,_,g(13,7),g(9,1),g(7,7),g(7,6),g(12,0),g(9,0),_,_,_,g(9,9),g(5,2),g(5,2),g(16,1),g(13,2),_,_,g(15,0),g(15,0)]],
];

// ---------------------------------------------------------------------------
// Bounty Weekend — 16 teams, 18 games (all teams play all games)
// ---------------------------------------------------------------------------
// [rank, team, total, qualifiesTo, [g1..g18]]
const BW_TEAMS = [
  [1,  "Team Tamilas",     206, "Super Weekend 1",
    [g(8,13),g(9,1),g(2,10),g(1,18),g(5,4),g(7,4),g(4,6),g(1,6),g(1,12),g(4,8),g(16,0),g(14,0),g(7,6),g(14,1),g(15,0),g(1,7),g(12,4),g(7,7)]],
  [2,  "Genesis Esports",  203, "Super Weekend 1",
    [g(14,3),g(2,16),g(9,0),g(5,9),g(7,2),g(1,10),g(8,11),g(5,6),g(8,4),g(8,10),g(14,3),g(6,3),g(3,18),g(1,15),g(9,3),g(4,6),g(11,0),g(3,11)]],
  [3,  "Elite Nova",       200, "Super Weekend 1",
    [g(10,11),g(10,5),g(1,9),g(4,7),g(2,1),g(15,0),g(1,18),g(12,0),g(2,5),g(1,12),g(11,1),g(12,1),g(8,6),g(4,8),g(1,6),g(2,19),g(5,1),g(14,1)]],
  [4,  "Team Outrage",     187, "Super Weekend 1",
    [g(12,10),g(11,1),g(10,2),g(7,11),g(3,8),g(13,2),g(13,9),g(2,13),g(9,3),g(11,3),g(1,9),g(10,4),g(1,11),g(11,5),g(16,1),g(13,1),g(3,5),g(1,11)]],
  [5,  "Reckoning Esports",162, "Super Weekend 1",
    [g(4,10),g(13,0),g(6,4),g(9,4),g(1,13),g(4,4),g(6,8),g(6,3),g(4,3),g(2,4),g(4,4),g(2,4),g(16,5),g(6,4),g(2,4),g(3,7),g(7,1),g(4,1)]],
  [6,  "Zero Ark",         162, "Super Weekend 1",
    [g(5,1),g(14,0),g(8,0),g(13,4),g(4,3),g(6,7),g(10,1),g(9,6),g(12,4),g(9,11),g(8,1),g(3,11),g(2,5),g(12,4),g(4,11),g(9,9),g(1,8),g(6,0)]],
  [7,  "Team SouL",        153, "League Week 2",
    [g(2,11),g(4,7),g(7,1),g(8,5),g(8,1),g(16,2),g(2,4),g(15,1),g(5,7),g(6,9),g(3,6),g(1,12),g(5,6),g(15,1),g(5,7),g(7,3),g(4,4),g(10,0)]],
  [8,  "Apex Gaming",      143, "League Week 2",
    [g(6,3),g(5,7),g(12,2),g(16,5),g(16,0),g(8,4),g(5,8),g(3,6),g(15,3),g(10,3),g(6,2),g(4,5),g(9,4),g(10,1),g(6,4),g(11,6),g(6,9),g(13,4)]],
  [9,  "Revenant XSpark",  142, "League Week 2",
    [g(3,10),g(16,2),g(4,10),g(15,1),g(13,1),g(9,5),g(14,8),g(4,9),g(10,4),g(7,11),g(9,3),g(7,1),g(6,2),g(5,6),g(11,1),g(10,12),g(10,0),g(2,0)]],
  [10, "Epigrotive Gaming",140, "League Week 2",
    [g(15,3),g(1,4),g(14,2),g(6,12),g(6,4),g(14,3),g(12,7),g(8,2),g(7,1),g(5,4),g(2,10),g(16,0),g(10,12),g(7,2),g(13,3),g(16,5),g(15,3),g(11,0)]],
  [11, "Rapid Chaos",      138, "League Week 2",
    [g(1,10),g(15,2),g(11,4),g(3,7),g(9,6),g(10,4),g(11,3),g(11,5),g(14,3),g(16,3),g(7,4),g(11,4),g(4,4),g(8,6),g(10,1),g(5,7),g(16,1),g(15,1)]],
  [12, "White Walkers",    123, "League Week 2",
    [g(11,1),g(3,4),g(3,8),g(2,7),g(15,0),g(11,1),g(16,1),g(10,0),g(6,4),g(12,8),g(5,3),g(9,8),g(12,5),g(13,3),g(14,4),g(6,6),g(8,4),g(12,6)]],
  [13, "Quantum Sparks",   119, "League Week 2",
    [g(13,6),g(12,5),g(13,4),g(10,5),g(14,3),g(2,4),g(15,3),g(14,0),g(13,1),g(14,5),g(10,5),g(5,6),g(13,3),g(3,2),g(12,4),g(8,2),g(14,2),g(5,5)]],
  [14, "8Bit",             115, "League Week 2",
    [g(7,12),g(6,4),g(15,0),g(11,3),g(12,2),g(3,6),g(7,4),g(7,2),g(16,0),g(13,5),g(15,4),g(8,1),g(11,9),g(9,0),g(3,9),g(12,5),g(13,1),g(16,2)]],
  [15, "Vasista Esports",   97, "League Week 2",
    [g(9,0),g(8,3),g(16,0),g(14,3),g(11,5),g(5,2),g(3,3),g(13,0),g(11,1),g(15,9),g(13,1),g(15,0),g(15,5),g(2,2),g(7,3),g(14,9),g(2,9),g(8,2)]],
  [16, "Gladiators Esports", 92, "League Week 2",
    [g(16,1),g(7,2),g(5,5),g(12,9),g(10,2),g(12,2),g(9,13),g(16,1),g(3,3),g(3,2),g(12,2),g(13,0),g(14,3),g(16,1),g(8,0),g(15,1),g(9,3),g(9,8)]],
];

// ---------------------------------------------------------------------------
// Build stage standings
// ---------------------------------------------------------------------------
function buildLW1Standings() {
  return LW1_TEAMS.sort((a, b) => a[0] - b[0]).map(([rank, team, group, total, qualifiesTo, games]) => ({
    rank, team, group, total, qualifiesTo,
    games: games.map((entry, i) =>
      entry === null ? null : { game: i + 1, placement: entry.placement, kills: entry.kills }
    ),
  }));
}

function buildBWStandings() {
  return BW_TEAMS.sort((a, b) => a[0] - b[0]).map(([rank, team, total, qualifiesTo, games]) => ({
    rank, team, total, qualifiesTo,
    games: games.map((entry, i) => ({ game: i + 1, placement: entry.placement, kills: entry.kills })),
  }));
}

// ---------------------------------------------------------------------------
// Patch tournament
// ---------------------------------------------------------------------------
const lw1Idx = stages.findIndex(s => s.name === "League Week 1");
const bwIdx  = stages.findIndex(s => s.name === "Bounty Weekend");

if (lw1Idx === -1) { console.error("League Week 1 stage not found"); process.exit(1); }
if (bwIdx  === -1) { console.error("Bounty Weekend stage not found"); process.exit(1); }

stages[lw1Idx].groups = {
  A: ["Genesis Esports", "Revenant XSpark", "Zero Ark", "Rapid Chaos", "Vasista Esports", "Myth Official", "K9 Esports", "Nebula Esports"],
  B: ["Team Outrage", "8Bit", "Gladiators Esports", "Team SouL", "Elite Nova", "Wyld Fangs", "HyperCatz", "Santa Esports"],
  C: ["Apex Gaming", "Epigrotive Gaming", "Team Tamilas", "Quantum Sparks", "Reckoning Esports", "White Walkers", "7Gods Esports", "Aura x Esports"],
};
stages[lw1Idx].standings = buildLW1Standings();
stages[lw1Idx].gamePairings = {
  "G1-3": "A+C", "G4-6": "A+B", "G7-9": "B+C",
  "G10-12": "A+C", "G13-15": "A+B", "G16-18": "B+C",
  "G19-20": "A+C", "G21-22": "A+B", "G23-24": "B+C",
};

stages[bwIdx].standings = buildBWStandings();

// Fix banner URL
db.prepare("UPDATE tournaments SET banner_url = ?, stages = ?, updated_date = ? WHERE id = ?")
  .run("/images/BGMS.png", JSON.stringify(stages), now, tournament.id);

console.log("✅ Updated BGMS S5: banner URL, League Week 1 group standings (24 teams × 24 games), Bounty Weekend standings (16 teams × 18 games).");

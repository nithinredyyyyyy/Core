import { PMWC_2026_RANKINGS } from "./data/pmwc2026Stats.js";
import { PMWC_2026_AWARDS, PMWC_2026_PARTICIPANTS, PMWC_2026_PRIZE_BREAKDOWN } from "./data/pmwc2026.js";
import { importTournament } from "./importTournament.js";
import { postImportTournamentTransforms } from "./postImportTransforms.js";

const mapRotation = [
  { match: 1, map: "Rondo" },
  { match: 2, map: "Erangel" },
  { match: 3, map: "Erangel" },
  { match: 4, map: "Erangel" },
  { match: 5, map: "Miramar" },
  { match: 6, map: "Miramar" },
];

const groupAStandings = [
  { placement: 1, matches: 12, wwcd: "0", pos: "27", elimins: "80", points: 107, outcome: "Advances to Grand Finals", grp: "A", team: "4thrives Esports" },
  { placement: 2, matches: 12, wwcd: "2", pos: "41", elimins: "50", points: 91, outcome: "Advances to Grand Finals", grp: "A", team: "Orangutan" },
  { placement: 3, matches: 12, wwcd: "1", pos: "30", elimins: "60", points: 90, outcome: "Advances to Grand Finals", grp: "A", team: "Aurora Gaming" },
  { placement: 4, matches: 12, wwcd: "1", pos: "31", elimins: "58", points: 89, outcome: "Advances to Grand Finals", grp: "A", team: "Team Flash" },
  { placement: 5, matches: 12, wwcd: "0", pos: "30", elimins: "58", points: 88, outcome: "Advances to Grand Finals", grp: "A", team: "Nigma Galaxy" },
  { placement: 6, matches: 12, wwcd: "1", pos: "35", elimins: "48", points: 83, outcome: "Advances to Survival Stage", grp: "A", team: "ULF Esports" },
  { placement: 7, matches: 12, wwcd: "1", pos: "26", elimins: "53", points: 79, outcome: "Advances to Survival Stage", grp: "A", team: "AG.AL International" },
  { placement: 8, matches: 12, wwcd: "2", pos: "24", elimins: "49", points: 73, outcome: "Advances to Survival Stage", grp: "A", team: "GOAT Team" },
  { placement: 9, matches: 12, wwcd: "1", pos: "26", elimins: "47", points: 73, outcome: "Advances to Survival Stage", grp: "A", team: "FURIA Esports" },
  { placement: 10, matches: 12, wwcd: "1", pos: "21", elimins: "51", points: 72, outcome: "Advances to Survival Stage", grp: "A", team: "AlUla Club Esports" },
  { placement: 11, matches: 12, wwcd: "0", pos: "20", elimins: "50", points: 70, outcome: "Advances to Survival Stage", grp: "A", team: "Kiwoom DRX" },
  { placement: 12, matches: 12, wwcd: "1", pos: "19", elimins: "43", points: 62, outcome: "Advances to Survival Stage", grp: "A", team: "RRQ RYU" },
  { placement: 13, matches: 12, wwcd: "1", pos: "25", elimins: "32", points: 57, outcome: "Advances to Survival Stage", grp: "A", team: "Geekay Esports" },
  { placement: 14, matches: 12, wwcd: "0", pos: "12", elimins: "34", points: 46, outcome: "Eliminated", grp: "A", team: "XForce Rejects" },
  { placement: 15, matches: 12, wwcd: "0", pos: "16", elimins: "18", points: 34, outcome: "Eliminated", grp: "A", team: "ThunderTalk Gaming" },
  { placement: 16, matches: 12, wwcd: "0", pos: "1", elimins: "28", points: 29, outcome: "Eliminated", grp: "A", team: "Gaming Stars Esports" },
];

const groupBStandings = [
  { placement: 1, matches: 12, wwcd: "2", pos: "45", elimins: "103", points: 148, outcome: "Advances to Grand Finals", grp: "B", team: "Bigetron by Vitality" },
  { placement: 2, matches: 12, wwcd: "3", pos: "55", elimins: "53", points: 108, outcome: "Advances to Grand Finals", grp: "B", team: "IDA Esports" },
  { placement: 3, matches: 12, wwcd: "1", pos: "32", elimins: "73", points: 105, outcome: "Advances to Grand Finals", grp: "B", team: "GodLike Esports" },
  { placement: 4, matches: 12, wwcd: "1", pos: "37", elimins: "61", points: 98, outcome: "Advances to Grand Finals", grp: "B", team: "Horaa Esports" },
  { placement: 5, matches: 12, wwcd: "0", pos: "30", elimins: "67", points: 97, outcome: "Advances to Grand Finals", grp: "B", team: "S2G Esports" },
  { placement: 6, matches: 12, wwcd: "1", pos: "31", elimins: "64", points: 95, outcome: "Advances to Survival Stage", grp: "B", team: "eArena" },
  { placement: 7, matches: 12, wwcd: "2", pos: "37", elimins: "51", points: 88, outcome: "Advances to Survival Stage", grp: "B", team: "Nongshim RedForce" },
  { placement: 8, matches: 12, wwcd: "1", pos: "19", elimins: "45", points: 64, outcome: "Advances to Survival Stage", grp: "B", team: "Alpha7 Esports" },
  { placement: 9, matches: 12, wwcd: "0", pos: "27", elimins: "34", points: 61, outcome: "Advances to Survival Stage", grp: "B", team: "Yangon Galacticos" },
  { placement: 10, matches: 12, wwcd: "0", pos: "12", elimins: "48", points: 60, outcome: "Advances to Survival Stage", grp: "B", team: "721 Esports" },
  { placement: 11, matches: 12, wwcd: "1", pos: "19", elimins: "30", points: 49, outcome: "Advances to Survival Stage", grp: "B", team: "Tianba" },
  { placement: 12, matches: 12, wwcd: "0", pos: "13", elimins: "36", points: 49, outcome: "Advances to Survival Stage", grp: "B", team: "Wolves Esports" },
  { placement: 13, matches: 12, wwcd: "0", pos: "17", elimins: "28", points: 45, outcome: "Advances to Survival Stage", grp: "B", team: "DOPENESS" },
  { placement: 14, matches: 12, wwcd: "0", pos: "5", elimins: "31", points: 36, outcome: "Eliminated", grp: "B", team: "ETSH Esports" },
  { placement: 15, matches: 12, wwcd: "0", pos: "1", elimins: "35", points: 36, outcome: "Eliminated", grp: "B", team: "TT Project" },
  { placement: 16, matches: 12, wwcd: "0", pos: "4", elimins: "21", points: 25, outcome: "Eliminated", grp: "B", team: "Hustler Crew" },
];

const grandFinalsStandings = [
  { placement: 1, matches: 18, wwcd: "", pos: "", elimins: "", points: 154, outcome: "Champion", team: "S2G Esports" },
  { placement: 2, matches: 18, wwcd: "", pos: "", elimins: "", points: 149, outcome: "Runner-up", team: "Nongshim RedForce" },
  { placement: 3, matches: 18, wwcd: "", pos: "", elimins: "", points: 146, outcome: "3rd Place", team: "Aurora Gaming" },
  { placement: 4, matches: 18, wwcd: "", pos: "", elimins: "", points: 140, outcome: "Finalist", team: "eArena" },
  { placement: 5, matches: 18, wwcd: "", pos: "", elimins: "", points: 125, outcome: "Finalist", team: "Tianba" },
  { placement: 6, matches: 18, wwcd: "", pos: "", elimins: "", points: 112, outcome: "Finalist", team: "4thrives Esports" },
  { placement: 7, matches: 18, wwcd: "", pos: "", elimins: "", points: 111, outcome: "Finalist", team: "Team Flash" },
  { placement: 8, matches: 18, wwcd: "", pos: "", elimins: "", points: 109, outcome: "Finalist", team: "Horaa Esports" },
  { placement: 9, matches: 18, wwcd: "", pos: "", elimins: "", points: 106, outcome: "Finalist", team: "Nigma Galaxy" },
  { placement: 10, matches: 18, wwcd: "", pos: "", elimins: "", points: 105, outcome: "Finalist", team: "FURIA" },
  { placement: 11, matches: 18, wwcd: "", pos: "", elimins: "", points: 99, outcome: "Finalist", team: "ULF Esports" },
  { placement: 12, matches: 18, wwcd: "", pos: "", elimins: "", points: 99, outcome: "Finalist", team: "BTR Vitality" },
  { placement: 13, matches: 18, wwcd: "", pos: "", elimins: "", points: 84, outcome: "Finalist", team: "GodLike Esports" },
  { placement: 14, matches: 18, wwcd: "", pos: "", elimins: "", points: 83, outcome: "Finalist", team: "AlUla Club" },
  { placement: 15, matches: 18, wwcd: "", pos: "", elimins: "", points: 76, outcome: "Finalist", team: "Orangutan" },
  { placement: 16, matches: 18, wwcd: "", pos: "", elimins: "", points: 69, outcome: "Finalist", team: "IDA Esports" },
];

const tournament = {
  name: "PUBG Mobile World Cup 2026",
  game: "PUBG Mobile",
  tier: "S-Tier",
  status: "completed",
  prize_pool: "$3,025,000",
  start_date: "2026-08-06",
  end_date: "2026-08-16",
  max_teams: 32,
  banner_url: "/images/pubg-mobile-world-cup-2026.webp",
  description:
    "PUBG Mobile World Cup 2026 is the mid-season international event of the 2026 PUBG Mobile competitive season. Originally planned for Riyadh, Saudi Arabia, the event was moved to Paris, France on May 20, 2026.",
  format_overview:
    "32 teams compete across three stages: Group Stage (August 6-9), Survival Stage (August 11-12), and Grand Finals (August 14-16). The Group Stage features 2 groups of 16 teams playing 12 matches each. Top 5 from each group advance to Grand Finals, while 6th-13th advance to Survival Stage. Survival Stage features 16 teams in 12 matches, with top 6 advancing to Grand Finals. Grand Finals features 16 teams in up to 18 matches with Smash Rule on Day 3.",
  rules:
    "Squads TPP on PUBG Mobile. Group Stage and Survival Stage use 12-match progression. Grand Finals uses up to 18 matches (6 per day) with Smash Rule applied on Day 3.",
  calendar: [
    { week: "Aug 6 - Aug 9", label: "Group Stage" },
    { week: "Aug 11 - Aug 12", label: "Survival Stage" },
    { week: "Aug 14 - Aug 16", label: "Grand Finals" },
  ],
  prize_breakdown: PMWC_2026_PRIZE_BREAKDOWN,
  awards: PMWC_2026_AWARDS,
  participants: PMWC_2026_PARTICIPANTS,
  rankings: PMWC_2026_RANKINGS,
  stages: [
    {
      name: "Group Stage",
      order: 1,
      status: "completed",
      teamCount: 32,
      summary:
        "August 6th - 9th, 2026. 32 teams divided into 2 groups of 16. Each group plays 12 matches. Top 5 teams from each group advance to Grand Finals. Teams placed 6th-13th advance to Survival Stage. Bottom 3 teams from each group are eliminated.",
      mapRotation,
      standings: [...groupAStandings, ...groupBStandings],
    },
    {
      name: "Survival Stage",
      order: 2,
      status: "upcoming",
      teamCount: 16,
      summary:
        "August 11th - 12th, 2026. 16 teams play 12 matches. Top 6 teams advance to Grand Finals. Bottom 10 teams are eliminated.",
      mapRotation,
      standings: [],
    },
    {
      name: "Grand Finals",
      order: 3,
      status: "completed",
      teamCount: 16,
      summary:
        "August 14th - 16th, 2026. 16 teams compete across up to 18 matches (6 each day). Smash Rule is applied on Day 3. The champion receives $500,000 from the $1.7M Grand Finals prize pool.",
      mapRotation,
      standings: grandFinalsStandings,
    },
  ],
};

const articles = [
  {
    title: "PUBG Mobile World Cup 2026 moved to Paris",
    content:
      "PUBG Mobile World Cup 2026, originally planned to be hosted in Riyadh, Saudi Arabia, has been moved to Paris, France on May 20, 2026. The mid-season international event will feature 32 teams competing for a $3.025 million prize pool from August 6-16.",
    category: "tournament",
    game: "PUBG Mobile",
    featured: 0,
  },
];

function getStandingsForStage(stageName) {
  if (stageName === "Group Stage") return [...groupAStandings, ...groupBStandings];
  if (stageName === "Survival Stage") return [];
  if (stageName === "Grand Finals") return grandFinalsStandings;
  return [];
}

importTournament({ tournament, articles, postImport: postImportTournamentTransforms });

console.log("Imported PUBG Mobile World Cup 2026 tournament.");



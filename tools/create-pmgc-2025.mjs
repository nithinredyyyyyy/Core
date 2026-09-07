import { db } from "../server/db.js";
import { v4 as uuidv4 } from "uuid";

const tournamentId = uuidv4();
const now = new Date().toISOString();

const stages = [
  {
    name: "Group Stage / League",
    type: "groups",
    startDate: "2026-11-29",
    endDate: "2026-12-06",
    venue: "Turkey (venue TBA)",
    summary: "39 teams compete. Exact format TBA. Based on 2025 format, expected multi-stage structure.",
    format: "TBA",
    status: "upcoming",
  },
  {
    name: "Grand Finals",
    type: "finals",
    startDate: "2026-12-12",
    endDate: "2026-12-14",
    venue: "Turkey (venue TBA)",
    summary: "Top teams from previous stages. Smash Rule expected. Exact format TBA.",
    format: "TBA",
    status: "upcoming",
  },
];

const calendar = [
  { date: "2026-11-29", event: "Matchday(s) (stage TBA)" },
  { date: "2026-12-06", event: "Matchday(s) (stage TBA)" },
  { date: "2026-12-13", event: "Matchday(s) (stage TBA)" },
];

const description = "PUBG Mobile Global Championship 2026 (PMGC 2026) is the 7th edition and final event of the 2026 PUBG Mobile competitive season. 39 teams (38 regional qualifiers + 1 Turkey host invite) compete for $3,000,000. Event runs November 24 - December 14, 2026 in Turkey.";

const formatOverview = "39 teams compete across multiple stages. Regional qualification via PMGC Points accumulated from PMGO S1, PMWC 2026, and PMGO S2. Exact match format, scoring, and stage structure TBA. Based on 2025 format: placement points (1st=10, 2nd=6, 3rd=5, 4th=4, 5th=3, 6th=2, 7th-8th=1, 9th-16th=0), 1 elim = 1 point, Smash Rule on final day.";

const prizeBreakdown = {
  note: "Placement-by-placement breakdown not yet announced. Total prize pool: $3,000,000 USD.",
  "Projected (based on 2025)": [
    { place: 1, prize: "$500,000+" },
    { place: 2, prize: "$250,000+" },
    { place: 3, prize: "$150,000+" },
  ],
};

const regionalSlots = [
  { region: "MENA", slots: 6 },
  { region: "Southeast Asia", slots: 5 },
  { region: "Turkey", slots: 5 },
  { region: "Americas", slots: 4 },
  { region: "EECA", slots: 4 },
  { region: "South Asia", slots: 3 },
  { region: "China (invited)", slots: 3 },
  { region: "Western Europe", slots: 2 },
  { region: "Korea (invited)", slots: 1 },
  { region: "Japan (invited)", slots: 1 },
  { region: "India (invited)", slots: 1 },
  { region: "Korea/Japan/India cross-region", slots: 2 },
  { region: "Africa", slots: 1 },
];

db.prepare(`INSERT INTO tournaments (id, name, game, tier, status, prize_pool, start_date, end_date, stages, description, banner_url, rules, max_teams, format_overview, calendar, prize_breakdown, awards, participants, rankings, created_date, updated_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
  tournamentId,
  "PUBG Mobile Global Championship 2026",
  "PUBG Mobile",
  "S-Tier",
  "upcoming",
  "$3,000,000",
  "2026-11-24",
  "2026-12-14",
  JSON.stringify(stages),
  description,
  "",
  "TBA - Expected: 1st=10, 2nd=6, 3rd=5, 4th=4, 5th=3, 6th=2, 7th-8th=1, 9th-16th=0. 1 elim = 1pt. Smash Rule on final day.",
  39,
  formatOverview,
  JSON.stringify(calendar),
  JSON.stringify(prizeBreakdown),
  "{}",
  "[]",
  "[]",
  now,
  now,
  "system"
);

console.log(`PMGC 2026 created: ${tournamentId}`);
console.log("Status: upcoming | 39 teams | $3,000,000 | Turkey | Nov 24 - Dec 14, 2026");

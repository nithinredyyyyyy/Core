import { importTournament } from "./importTournament.js";
import { BMSD_2026_GROUP_A, BMSD_2026_GROUP_B, BMSD_2026_GROUP_C, BMSD_2026_PRIZE_BREAKDOWN } from "./data/bmsd2026.js";

const now = new Date().toISOString();

const participants = [
  ...BMSD_2026_GROUP_A.map((t) => ({
    ...t,
    phase: "Qualifiers - Group A",
  })),
  ...BMSD_2026_GROUP_B.map((t) => ({
    ...t,
    phase: "Qualifiers - Group B",
  })),
  ...BMSD_2026_GROUP_C.map((t) => ({
    ...t,
    phase: "Qualifiers - Group C",
  })),
];

const tournament = {
  name: "Battlegrounds Mobile India Showdown 2026",
  game: "BGMI",
  tier: "S-Tier",
  status: "upcoming",
  prize_pool: "\u20b910,000,000 INR (\u2248 $104,345 USD)",
  start_date: "2026-09-22",
  end_date: "2026-10-18",
  max_teams: 48,
  banner_url: "/images/bmsd-2025.png",
  prize_breakdown: BMSD_2026_PRIZE_BREAKDOWN,
  awards: [],
  format_overview:
    "BMSD 2026 features 48 invited teams competing across six stages over four weeks. The Qualifiers use a three-group promotion/relegation system. Seeding after Week 3 determines progression: Qual-A top 4 advance directly to Grand Finals, while other teams route through Upper Bracket Survival, Lower Bracket Survival, Semi Finals, and Last Chance. Grand Finals apply the Smash Rule on Day 3.",
  calendar: [
    { week: "Sep 22 - Sep 27", label: "Qualifiers Week 1" },
    { week: "Sep 28 - Oct 4", label: "Qualifiers Week 2 & Week 3" },
    { week: "Oct 1 - Oct 3", label: "Upper Bracket Survival" },
    { week: "Oct 4 - Oct 6", label: "Lower Bracket Survival" },
    { week: "Oct 8 - Oct 11", label: "Semi Finals" },
    { week: "Oct 12 - Oct 13", label: "Last Chance" },
    { week: "Oct 16 - Oct 18", label: "Grand Finals" },
  ],
  description:
    "Battlegrounds Mobile India Showdown 2026 is an S-Tier BGMI tournament featuring 48 invited teams competing from September 22 to October 18, 2026, with a Grand Finals LAN at Savaaya Convention Center in Hyderabad, India. The champion qualifies for PMGC 2026 and the top 6 qualify for BMIC.",
  rules:
    "Placement points: 1st=10, 2nd=6, 3rd=5, 4th=4, 5th=3, 6th=2, 7th-8th=1, 9th-16th=0. Elimination points: 1 per kill. Grand Finals Day 3 uses the Smash Rule: Match Point = leader's points after Match 12 + 10; first Match Point Eligible team to win a match (WWCD) is crowned Champion; max 6 matches on Day 3. Tiebreakers: total WWCDs, total placement points, total elimination points, best placement in most recent match.",
  participants,
  stages: [
    {
      name: "Qualifiers",
      order: 1,
      status: "upcoming",
      teamCount: 48,
      summary:
        "Sep 22 - Oct 4, 2026. 48 invited teams split into Groups A, B, C (16 each). 3 weeks, 9 matchdays, 6 matches/week per group, 18 matches per team. Promotion/relegation after first 2 weeks: top 8 from Group B promote to A, top 8 from Group C promote to B, bottom 8 from Group A relegate to B, bottom 8 from Group B relegate to C. Seeding after Week 3 determines next stage.",
    },
    {
      name: "Upper Bracket Survival",
      order: 2,
      status: "upcoming",
      teamCount: 16,
      summary:
        "Oct 1-3, 2026. 16 teams (4 from Qual-A 5th-12th, 8 from Qual-B 1st-4th/5th-12th, 4 from Qual-C 1st-4th). 3 matchdays, 18 matches per team. Top 8 advance to Semi Finals; bottom 8 drop to Lower Bracket Survival.",
    },
    {
      name: "Lower Bracket Survival",
      order: 3,
      status: "upcoming",
      teamCount: 16,
      summary:
        "Oct 4-6, 2026. 16 teams (4 from Qual-B, 4 from Qual-C, 8 from Upper Bracket Survival). 3 matchdays, 18 matches per team. Top 4 advance to Semi Finals; bottom 12 eliminated.",
    },
    {
      name: "Semi Finals",
      order: 4,
      status: "upcoming",
      teamCount: 24,
      summary:
        "Oct 8-11, 2026. 24 teams (8 Qual-A, 4 Qual-B, 8 Upper Bracket Survival, 4 Lower Bracket Survival). Split into 3 groups of 8, double round-robin, 4 matchdays, 16 matches per team. Top 8 overall advance to Grand Finals; bottom 16 drop to Last Chance.",
    },
    {
      name: "Last Chance",
      order: 5,
      status: "upcoming",
      teamCount: 16,
      summary:
        "Oct 12-13, 2026. 16 teams, 2 matchdays, 12 matches total (6/day). Top 4 advance to Grand Finals; bottom 12 eliminated.",
    },
    {
      name: "Grand Finals",
      order: 6,
      status: "upcoming",
      teamCount: 16,
      summary:
        "Oct 16-18, 2026 at Savaaya Convention Center, Hyderabad, India. 16 teams (4 Qual-A direct qualifiers, 8 Semi Finals qualifiers, 4 Last Chance qualifiers). 3 matchdays, 18 matches (6/day). Smash Rule applies on Day 3.",
    },
  ],
};

const articles = [
  {
    title: "BMSD 2026 announced with Hyderabad Grand Finals",
    content:
      "Battlegrounds Mobile India Showdown 2026 will run from September 22 through October 18, 2026. The Grand Finals are scheduled for October 16 to October 18 at Savaaya Convention Center in Hyderabad, with the champion qualifying for PMGC 2026 and top 6 qualifying for BMIC.",
    category: "announcement",
    game: "BGMI",
    featured: 0,
  },
];

importTournament({
  tournament,
  articles,
});

console.log("Imported BMSD 2026 tournament and announcement.");

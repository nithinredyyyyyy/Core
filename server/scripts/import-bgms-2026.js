import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { BGMS_2026_PRIZE_BREAKDOWN } from "../tournamentOverrides.js";

const now = new Date().toISOString();

// ---------------------------------------------------------------------------
// Rosters
// ---------------------------------------------------------------------------
const BGMS_2026_ROSTERS = {
  // Super Weekend 1 Invited
  "GodLike Esports": ["Manya", "ADMINO", "Saumay", "Spower", "Godz"],
  "Orangutan": ["Aaru", "AK", "WizzGOD", "Attanki", "Prem"],

  // League Week 1 Invited
  "Team Outrage": ["Omega", "Slug", "NinjaBoi", "Knight", "Amit"],
  "Elite Nova": ["Owais", "VeNoM", "ScaryJod", "Mafia36", "Paritosh"],
  "Gladiators Esports": ["Neyo", "Justin", "DeltaPG", "AquaNox"],
  "Team Apex Gaming": ["Jelly", "JONATHAN", "Harsh", "Hydro", "KioLmao"],
  "Team Tamilas": ["MrIGL", "Reaper", "AIMGOD", "JustyOp", "MantyOP"],
  "Vasista Esports": ["Hector", "Beast", "A1mbot", "Rony", "Dionysus"],
  "Reckoning Esports": ["Roman", "Lovish", "Levi", "SahilOPAF", "ProBGMI"],
  "Nebula Esports": ["Aadi", "KnowMe", "Phoenix", "KRATOS", "Arjun"],
  "8Bit": ["Juicy", "Sarang", "Skipz", "Shubh", "Shorty"],
  "Genesis Esports": ["GravityJOD", "ViPER", "HunterZ", "FurY", "Zap"],
  "Team SouL": ["NakuL", "Goblin", "LEGIT", "Jokerr", "Thunder"],
  "7Gods Esports": ["Moksh", "Noir99", "Ninjuu", "Rexboy", "NinjA"],
  "Revenant XSpark": ["NinjaJOD", "Proton", "Tracegod", "Pain09", "Sukuna"],
  "Myth Official": ["Detrox", "Lucifer", "Daddy", "Harshil", "Aryton"],
  "Rapid Chaos": ["FLASH", "Psycho", "Toxic", "DhruvOG", "fragger"],
  "Epigrotive Gaming": ["Areeb", "EGGY", "Lobster", "Ralphie", "FanOP"],
  "Zero Ark": ["Morty", "PainIsLive", "JatinOG", "ChandanOP", "SarwarOG"],
  "K9 Esports": ["Saumraj", "SnowJOD", "Taurus06", "Stranger"],
  "Wyld Fangs": ["SENSEI", "SPRAYGOD", "Goten", "Kanha", "Sam999"],
  "Quantum Sparks": ["Sc0utOP", "MasTer", "Archit", "Yashu", "Daksh"],

  // Qualified
  "Santa Esports": ["Alpha05", "ADONIS", "PUNISHER11", "CoFFIN", "BanditGod"],
  "White Walkers": ["DreamS", "Veyron", "AnujTooOP", "Beast04"],
  "HyperCatz": ["Hexe", "SKETCH", "xHiTMAN", "BeasT", "Spiriit"],
  "Aura x Esports": ["Wanted", "KrisOp", "FraggerNub", "KALYUG", "Dope"],
};

// ---------------------------------------------------------------------------
// Tournament definition
// ---------------------------------------------------------------------------
const tournament = {
  name: "BGMI Masters Series Season 5",
  game: "BGMI",
  tier: "A-Tier",
  status: "completed",
  prize_pool: "₹10,100,000 INR (≃ $106,954 USD)",
  start_date: "2026-08-10",
  end_date: "2026-09-06",
  max_teams: 26,
  banner_url: "/images/bgms-2026.png",
  organizer: "NODWIN Gaming",
  prize_breakdown: BGMS_2026_PRIZE_BREAKDOWN,

  format_overview:
    "BGMI Masters Series Season 5 is an offline tournament organised by NODWIN Gaming featuring 26 teams (22 invited, 4 qualified) competing in Squads TPP format. The event runs from August 10 to September 6, 2026, across a League phase (League Weeks 1–3, Bounty Weekend, Super Weekends 1–2), followed by Playoffs and a 16-team Grand Finals.",

  description:
    "BGMI Masters Series Season 5 is an offline BGMI tournament hosted by NODWIN Gaming with a prize pool of ₹1,01,00,000 INR. The tournament runs from August 10 to September 6, 2026, featuring 26 teams across a complex League + Super Weekend + Playoffs + Grand Finals format. The Smash Rule is applied on Grand Finals Day 3, where the first Match Point–eligible team to secure a Chicken Dinner is crowned champion.",

  rules:
    "Points system: 1st 10 pts, 2nd 6 pts, 3rd 5 pts, 4th 4 pts, 5th 3 pts, 6th 2 pts, 7th–8th 1 pt, 9th–16th 0 pts. Each elimination gives 1 point. Tiebreakers: total WWCDs → total placement points → total elimination points → best placement in most recent match. Map rotation: Match 1 Rondo, Match 2 Erangel, Match 3 Miramar, Match 4 Rondo, Match 5 Miramar, Match 6 Erangel. Bonus Points — Powerplay (all stages): double elimination points in first phase/zone. Finish Cards (League Weeks): 2× multiplier on elimination points, 5 cards/week, not usable on Rondo. Impact Player (Super Weekends): double points for finishes by the IGL-designated player. Bounty (Super Weekends): 10 points for eliminating the Bounty team. Placement Cards (Playoffs): 2× multiplier on placement points, 4 cards total. Smash Rule (Grand Finals Day 3): teams accumulate points normally until a team reaches Match Point (Top 1's point after Match #12 + 20). Match Point–eligible teams must win a Chicken Dinner to clinch the championship. Maximum 6 matches on Day 3.",

  calendar: [
    { week: "Aug 10 – Aug 13", label: "League Week 1" },
    { week: "Aug 14 – Aug 16", label: "Bounty Weekend" },
    { week: "Aug 17 – Aug 20", label: "League Week 2" },
    { week: "Aug 21 – Aug 23", label: "Super Weekend 1" },
    { week: "Aug 24 – Aug 27", label: "League Week 3" },
    { week: "Aug 28 – Aug 30", label: "Super Weekend 2" },
    { week: "Aug 31 – Sep 2",  label: "Playoffs" },
    { week: "Sep 4 – Sep 6",   label: "Grand Finals" },
  ],

  stages: [
    {
      name: "League Week 1",
      order: 1,
      status: "completed",
      teamCount: 24,
      mapRotation: [
        { match: 1, map: "Rondo" },
        { match: 2, map: "Erangel" },
        { match: 3, map: "Miramar" },
        { match: 4, map: "Rondo" },
        { match: 5, map: "Miramar" },
        { match: 6, map: "Erangel" },
      ],
      bonusPoints: ["Powerplay", "Finish Cards"],
      summary:
        "August 10–13, 2026. 24 teams (excluding GodLike Esports and Orangutan who are Super Weekend 1 invites) compete across 4 matchdays with 6 matches per day (24 matches total). Teams are split equally into 3 groups of 8 and play a double round-robin format (16 matches each). Points count toward the League Leaderboard. Top 16 teams advance to Bounty Weekend; 17th–22nd proceed to League Week 2; bottom 2 are eliminated.",
    },
    {
      name: "Bounty Weekend",
      order: 2,
      status: "completed",
      teamCount: 16,
      mapRotation: [
        { match: 1, map: "Rondo" },
        { match: 2, map: "Erangel" },
        { match: 3, map: "Miramar" },
        { match: 4, map: "Rondo" },
        { match: 5, map: "Miramar" },
        { match: 6, map: "Erangel" },
      ],
      bonusPoints: ["Powerplay"],
      summary:
        "August 14–16, 2026. 16 teams (top 16 from League Week 1) compete across 3 matchdays with 6 matches per day (18 matches total). Top 6 teams qualify for Super Weekend 1; bottom 10 teams proceed to League Week 2.",
    },
    {
      name: "League Week 2",
      order: 3,
      status: "completed",
      teamCount: 16,
      mapRotation: [
        { match: 1, map: "Rondo" },
        { match: 2, map: "Erangel" },
        { match: 3, map: "Miramar" },
        { match: 4, map: "Rondo" },
        { match: 5, map: "Miramar" },
        { match: 6, map: "Erangel" },
      ],
      bonusPoints: ["Powerplay", "Finish Cards"],
      summary:
        "August 17–20, 2026. 16 teams (17th–22nd from League Week 1 + bottom 10 from Bounty Weekend) compete across 4 matchdays with 6 matches per day (24 matches total). Points add to the League Leaderboard. Top 8 qualify for Super Weekend 1; bottom 8 proceed to League Week 3.",
    },
    {
      name: "Super Weekend 1",
      order: 4,
      status: "completed",
      teamCount: 16,
      mapRotation: [
        { match: 1, map: "Rondo" },
        { match: 2, map: "Erangel" },
        { match: 3, map: "Miramar" },
        { match: 4, map: "Rondo" },
        { match: 5, map: "Miramar" },
        { match: 6, map: "Erangel" },
      ],
      bonusPoints: ["Powerplay", "Impact Player", "Bounty"],
      summary:
        "August 21–23, 2026. 16 teams compete: GodLike Esports and Orangutan (special invites), 6 teams from Bounty Weekend, and 8 teams from League Week 2. Three matchdays with 6 matches per day (18 matches total). Points count toward the Super Weekend Leaderboard. Top 8 qualify for Super Weekend 2; bottom 8 proceed to League Week 3.",
    },
    {
      name: "League Week 3",
      order: 5,
      status: "completed",
      teamCount: 16,
      mapRotation: [
        { match: 1, map: "Rondo" },
        { match: 2, map: "Erangel" },
        { match: 3, map: "Miramar" },
        { match: 4, map: "Rondo" },
        { match: 5, map: "Miramar" },
        { match: 6, map: "Erangel" },
      ],
      bonusPoints: ["Powerplay", "Finish Cards"],
      summary:
        "August 24–27, 2026. 16 teams (bottom 8 from Super Weekend 1 + bottom 8 from League Week 2) compete across 4 matchdays with 6 matches per day (24 matches total). Points add to the League Leaderboard. All top 8 qualify for Super Weekend 2.",
    },
    {
      name: "Super Weekend 2",
      order: 6,
      status: "completed",
      teamCount: 16,
      mapRotation: [
        { match: 1, map: "Rondo" },
        { match: 2, map: "Erangel" },
        { match: 3, map: "Miramar" },
        { match: 4, map: "Rondo" },
        { match: 5, map: "Miramar" },
        { match: 6, map: "Erangel" },
      ],
      bonusPoints: ["Powerplay", "Impact Player", "Bounty"],
      summary:
        "August 28–30, 2026. 16 teams (top 8 from Super Weekend 1 + top 8 from League Week 3) compete across 3 matchdays with 6 matches per day (18 matches total). Points add to the Super Weekend Leaderboard. Top 6 from Super Weekend Leaderboard qualify for Grand Finals; 7th–16th proceed to Playoffs. Top 6 from League Leaderboard (not already in Grand Finals) also proceed to Playoffs. Bottom 2 from League Leaderboard are eliminated.",
    },
    {
      name: "Playoffs",
      order: 7,
      status: "completed",
      teamCount: 16,
      mapRotation: [
        { match: 1, map: "Rondo" },
        { match: 2, map: "Erangel" },
        { match: 3, map: "Miramar" },
        { match: 4, map: "Rondo" },
        { match: 5, map: "Miramar" },
        { match: 6, map: "Erangel" },
      ],
      bonusPoints: ["Powerplay", "Placement Cards"],
      summary:
        "August 31 – September 2, 2026. 16 teams compete: 10 from Super Weekend Leaderboard + 6 from League Leaderboard. Three matchdays with 6 matches per day (18 matches total). Top 10 qualify for Grand Finals; bottom 6 are eliminated.",
    },
    {
      name: "Grand Finals",
      order: 8,
      status: "completed",
      teamCount: 16,
      mapRotation: [
        { match: 1, map: "Rondo" },
        { match: 2, map: "Erangel" },
        { match: 3, map: "Miramar" },
        { match: 4, map: "Rondo" },
        { match: 5, map: "Miramar" },
        { match: 6, map: "Erangel" },
      ],
      bonusPoints: ["Powerplay"],
      smashRule: {
        enabled: true,
        appliesOnDay: 3,
        matchPoint:
          "Top 1's point after Match #12 + 20 points. Once a team reaches Match Point, they become 'Match Point Eligible'. The first Match Point Eligible team to secure a WWCD is crowned Champion. Maximum 6 matches on Day 3.",
      },
      summary:
        "September 4–6, 2026. 16 teams compete: 6 from Super Weekend Leaderboard + 10 from Playoffs. Three matchdays with 6 matches per day (18 matches total). Smash Rule is applied on Day 3.",
    },
  ],

  // ---------------------------------------------------------------------------
  // Participants (26 unique teams, with per-stage phase labels)
  // ---------------------------------------------------------------------------
  participants: [
    // Super Weekend 1 Invited
    { placement: 1,  team: "GodLike Esports",   phase: "Super Weekend 1 - Invited",   qualification: "Invited" },
    { placement: 2,  team: "Orangutan",           phase: "Super Weekend 1 - Invited",   qualification: "Invited" },
    // League Week 1 Invited
    { placement: 3,  team: "Team Outrage",        phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 4,  team: "Elite Nova",          phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 5,  team: "Gladiators Esports",  phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 6,  team: "Apex Gaming",         phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 7,  team: "Team Tamilas",        phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 8,  team: "Vasista Esports",     phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 9,  team: "Reckoning Esports",   phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 10, team: "Nebula Esports",      phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 11, team: "8Bit",                phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 12, team: "Genesis Esports",     phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 13, team: "Team SouL",           phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 14, team: "7Gods Esports",       phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 15, team: "Revenant XSpark",     phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 16, team: "Myth Official",       phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 17, team: "Rapid Chaos",         phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 18, team: "Epigrotive Gaming",   phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 19, team: "Zero Ark",            phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 20, team: "K9 Esports",          phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 21, team: "Wyld Fangs",          phase: "League Week 1 - Invited",     qualification: "Invited" },
    { placement: 22, team: "Quantum Sparks",      phase: "League Week 1 - Invited",     qualification: "Invited" },
    // Qualified via TVS Wicked Battles
    { placement: 23, team: "Santa Esports",       phase: "Qualified",                   qualification: "TVS Wicked Battles - 1st" },
    { placement: 24, team: "White Walkers",       phase: "Qualified",                   qualification: "TVS Wicked Battles - 2nd" },
    { placement: 25, team: "HyperCatz",           phase: "Qualified",                   qualification: "TVS Wicked Battles - 3rd" },
    { placement: 26, team: "Aura x Esports",      phase: "Qualified",                   qualification: "TVS Wicked Battles - 4th" },
  ],
};

// Attach rosters to participants
tournament.participants = tournament.participants.map((entry) => ({
  ...entry,
  players: BGMS_2026_ROSTERS[entry.team] || [],
}));

// ---------------------------------------------------------------------------
// Awards
// ---------------------------------------------------------------------------
tournament.awards = [
  { title: "MVP", player: "HUNTERZ", team: "Genesis Esports" },
  { title: "FMVP", player: "KNOWME", team: "Nebula Esports" },
];

// ---------------------------------------------------------------------------
// Rankings
// ---------------------------------------------------------------------------
tournament.rankings = [
  {
    title: "BGMS MVP",
    columns: [
      { key: "finishes", label: "Fin." },
      { key: "fpm", label: "FPM" },
      { key: "contribution", label: "Contri." },
      { key: "best", label: "Best" },
      { key: "fivePlusFinishes", label: "5+ Fin." },
      { key: "matches", label: "Matches" },
    ],
    entries: [
      { placement: 1, player: "HUNTERZ", team: "Genesis Esports", finishes: 249, fpm: 1.92, contribution: "32%", best: 11, fivePlusFinishes: 12, matches: 130 },
      { placement: 2, player: "HYDRO", team: "Apex Gaming", finishes: 238, fpm: 1.55, contribution: "30%", best: 9, fivePlusFinishes: 12, matches: 154 },
      { placement: 3, player: "VIPER", team: "Genesis Esports", finishes: 226, fpm: 1.74, contribution: "29%", best: 9, fivePlusFinishes: 10, matches: 130 },
      { placement: 4, player: "JONATHAN", team: "Apex Gaming", finishes: 226, fpm: 1.49, contribution: "29%", best: 9, fivePlusFinishes: 6, matches: 152 },
      { placement: 5, player: "TRACEGOD", team: "Revenant XSpark", finishes: 214, fpm: 1.57, contribution: "31%", best: 8, fivePlusFinishes: 9, matches: 136 },
      { placement: 6, player: "PAIN", team: "Revenant XSpark", finishes: 209, fpm: 1.58, contribution: "30%", best: 8, fivePlusFinishes: 11, matches: 132 },
      { placement: 7, player: "JUSTIN", team: "Gladiators Esports", finishes: 207, fpm: 1.52, contribution: "30%", best: 7, fivePlusFinishes: 10, matches: 136 },
      { placement: 8, player: "DHRUV", team: "Rapid Chaos", finishes: 204, fpm: 1.50, contribution: "32%", best: 6, fivePlusFinishes: 9, matches: 136 },
      { placement: 9, player: "FRAGER", team: "Rapid Chaos", finishes: 201, fpm: 1.48, contribution: "32%", best: 9, fivePlusFinishes: 9, matches: 136 },
      { placement: 10, player: "HARSH", team: "Apex Gaming", finishes: 201, fpm: 1.31, contribution: "25%", best: 9, fivePlusFinishes: 5, matches: 154 },
      { placement: 11, player: "NINJABOI", team: "Team Outrage", finishes: 194, fpm: 1.83, contribution: "33%", best: 9, fivePlusFinishes: 10, matches: 106 },
      { placement: 12, player: "SHUBH", team: "8Bit", finishes: 184, fpm: 1.56, contribution: "35%", best: 10, fivePlusFinishes: 10, matches: 118 },
      { placement: 13, player: "FURY", team: "Genesis Esports", finishes: 180, fpm: 1.57, contribution: "23%", best: 7, fivePlusFinishes: 14, matches: 115 },
      { placement: 14, player: "GOBLIN", team: "Team SouL", finishes: 170, fpm: 1.53, contribution: "29%", best: 6, fivePlusFinishes: 5, matches: 111 },
      { placement: 15, player: "AKOP", team: "Orangutan", finishes: 169, fpm: 1.76, contribution: "35%", best: 11, fivePlusFinishes: 7, matches: 96 },
      { placement: 16, player: "LEGIT", team: "Team SouL", finishes: 167, fpm: 1.49, contribution: "28%", best: 8, fivePlusFinishes: 7, matches: 112 },
      { placement: 17, player: "AIMBOT", team: "Vasista Esports", finishes: 167, fpm: 1.42, contribution: "32%", best: 6, fivePlusFinishes: 8, matches: 118 },
      { placement: 18, player: "MAFIA", team: "Elite Nova Esports", finishes: 162, fpm: 1.84, contribution: "35%", best: 9, fivePlusFinishes: 10, matches: 88 },
      { placement: 19, player: "SLUG", team: "Team Outrage", finishes: 162, fpm: 1.53, contribution: "28%", best: 9, fivePlusFinishes: 7, matches: 106 },
      { placement: 20, player: "AQUANOX", team: "Gladiators Esports", finishes: 159, fpm: 1.21, contribution: "23%", best: 7, fivePlusFinishes: 10, matches: 131 },
      { placement: 21, player: "DELTAPG", team: "Gladiators Esports", finishes: 157, fpm: 1.31, contribution: "23%", best: 7, fivePlusFinishes: 6, matches: 120 },
      { placement: 22, player: "KNIGHT", team: "Team Outrage", finishes: 153, fpm: 1.44, contribution: "26%", best: 7, fivePlusFinishes: 9, matches: 106 },
      { placement: 23, player: "TAURUS", team: "K9 Esports", finishes: 151, fpm: 1.51, contribution: "32%", best: 8, fivePlusFinishes: 7, matches: 100 },
      { placement: 24, player: "NEYO", team: "Gladiators Esports", finishes: 151, fpm: 1.11, contribution: "22%", best: 6, fivePlusFinishes: 4, matches: 136 },
      { placement: 25, player: "SARANG", team: "8Bit", finishes: 147, fpm: 1.25, contribution: "28%", best: 11, fivePlusFinishes: 5, matches: 118 },
      { placement: 26, player: "KNOWME", team: "Nebula Esports", finishes: 146, fpm: 1.72, contribution: "29%", best: 6, fivePlusFinishes: 10, matches: 85 },
      { placement: 27, player: "SCARYJOD", team: "Elite Nova Esports", finishes: 146, fpm: 1.66, contribution: "32%", best: 8, fivePlusFinishes: 7, matches: 88 },
      { placement: 28, player: "CHANDANOP", team: "Zero Ark Official", finishes: 146, fpm: 1.30, contribution: "31%", best: 7, fivePlusFinishes: 6, matches: 112 },
      { placement: 29, player: "PRO", team: "Reckoning Esports", finishes: 143, fpm: 1.30, contribution: "30%", best: 6, fivePlusFinishes: 4, matches: 110 },
      { placement: 30, player: "DETROX", team: "Myth Official", finishes: 141, fpm: 1.50, contribution: "36%", best: 8, fivePlusFinishes: 7, matches: 94 },
      { placement: 31, player: "RALPHIE", team: "Epigrotive Gaming", finishes: 141, fpm: 1.19, contribution: "28%", best: 8, fivePlusFinishes: 4, matches: 118 },
      { placement: 32, player: "GOTEN", team: "Wyld Fangs", finishes: 139, fpm: 1.28, contribution: "29%", best: 10, fivePlusFinishes: 3, matches: 109 },
      { placement: 33, player: "KAANHA", team: "Wyld Fangs", finishes: 139, fpm: 1.24, contribution: "29%", best: 7, fivePlusFinishes: 1, matches: 112 },
      { placement: 34, player: "RONY", team: "Vasista Esports", finishes: 138, fpm: 1.17, contribution: "26%", best: 6, fivePlusFinishes: 3, matches: 118 },
      { placement: 35, player: "PROTON", team: "Revenant XSpark", finishes: 135, fpm: 1.00, contribution: "19%", best: 4, fivePlusFinishes: 0, matches: 135 },
      { placement: 36, player: "JOKER", team: "Team SouL", finishes: 134, fpm: 1.37, contribution: "23%", best: 6, fivePlusFinishes: 6, matches: 98 },
      { placement: 37, player: "AREEB", team: "Epigrotive Gaming", finishes: 134, fpm: 1.14, contribution: "27%", best: 8, fivePlusFinishes: 2, matches: 118 },
      { placement: 38, player: "NINJAJOD", team: "Revenant XSpark", finishes: 134, fpm: 1.07, contribution: "19%", best: 6, fivePlusFinishes: 4, matches: 125 },
      { placement: 39, player: "KRATOS", team: "Nebula Esports", finishes: 133, fpm: 1.41, contribution: "26%", best: 8, fivePlusFinishes: 5, matches: 94 },
      { placement: 40, player: "JUSTY06", team: "Team Tamilas", finishes: 127, fpm: 1.44, contribution: "28%", best: 7, fivePlusFinishes: 5, matches: 88 },
      { placement: 41, player: "LEVII", team: "Reckoning Esports", finishes: 127, fpm: 1.27, contribution: "27%", best: 5, fivePlusFinishes: 3, matches: 100 },
      { placement: 42, player: "AIMGODD", team: "Team Tamilas", finishes: 123, fpm: 1.58, contribution: "27%", best: 10, fivePlusFinishes: 5, matches: 78 },
      { placement: 43, player: "SARWAROG", team: "Zero Ark Official", finishes: 123, fpm: 1.10, contribution: "26%", best: 6, fivePlusFinishes: 5, matches: 112 },
      { placement: 44, player: "WIZZGOD", team: "Orangutan", finishes: 120, fpm: 1.25, contribution: "25%", best: 6, fivePlusFinishes: 5, matches: 96 },
      { placement: 45, player: "GRAVITY", team: "Genesis Esports", finishes: 120, fpm: 0.92, contribution: "15%", best: 8, fivePlusFinishes: 6, matches: 130 },
      { placement: 46, player: "REAPER", team: "Team Tamilas", finishes: 119, fpm: 1.35, contribution: "27%", best: 5, fivePlusFinishes: 3, matches: 88 },
      { placement: 47, player: "SAUMRAJ", team: "K9 Esports", finishes: 118, fpm: 1.18, contribution: "25%", best: 8, fivePlusFinishes: 4, matches: 100 },
      { placement: 48, player: "PAINISLIVE", team: "Zero Ark Official", finishes: 118, fpm: 1.18, contribution: "25%", best: 6, fivePlusFinishes: 7, matches: 100 },
      { placement: 49, player: "JELLY", team: "Apex Gaming", finishes: 116, fpm: 0.81, contribution: "15%", best: 4, fivePlusFinishes: 0, matches: 144 },
      { placement: 50, player: "BEAST", team: "Vasista Esports", finishes: 115, fpm: 0.97, contribution: "22%", best: 6, fivePlusFinishes: 3, matches: 118 },
    ],
  },
  {
    title: "BGMS FMVP",
    columns: [
      { key: "finishes", label: "Fin." },
      { key: "fpm", label: "FPM" },
      { key: "contribution", label: "Contri." },
      { key: "best", label: "Best" },
      { key: "fivePlusFinishes", label: "5+ Fin." },
      { key: "matches", label: "Matches" },
    ],
    entries: [
      { placement: 1, player: "KNOWME", team: "Nebula Esports", finishes: 37, fpm: 2.06, contribution: "32%", best: 6, fivePlusFinishes: 2, matches: 18 },
      { placement: 2, player: "JUSTIN", team: "Gladiators Esports", finishes: 34, fpm: 1.89, contribution: "30%", best: 6, fivePlusFinishes: 3, matches: 18 },
      { placement: 3, player: "ATTANKI", team: "Orangutan", finishes: 33, fpm: 1.83, contribution: "28%", best: 6, fivePlusFinishes: 3, matches: 18 },
      { placement: 4, player: "KRATOS", team: "Nebula Esports", finishes: 32, fpm: 1.78, contribution: "28%", best: 8, fivePlusFinishes: 1, matches: 18 },
      { placement: 5, player: "AARU", team: "Orangutan", finishes: 32, fpm: 1.78, contribution: "27%", best: 7, fivePlusFinishes: 2, matches: 18 },
      { placement: 6, player: "DELTAPG", team: "Gladiators Esports", finishes: 31, fpm: 1.72, contribution: "27%", best: 7, fivePlusFinishes: 2, matches: 18 },
      { placement: 7, player: "FRAGER", team: "Rapid Chaos", finishes: 31, fpm: 1.72, contribution: "33%", best: 5, fivePlusFinishes: 1, matches: 18 },
      { placement: 8, player: "AKOP", team: "Orangutan", finishes: 29, fpm: 1.61, contribution: "24%", best: 4, fivePlusFinishes: 0, matches: 18 },
      { placement: 9, player: "PRO", team: "Reckoning Esports", finishes: 28, fpm: 1.56, contribution: "34%", best: 6, fivePlusFinishes: 1, matches: 18 },
      { placement: 10, player: "FURY", team: "Genesis Esports", finishes: 28, fpm: 1.56, contribution: "30%", best: 6, fivePlusFinishes: 2, matches: 18 },
      { placement: 11, player: "HUNTERZ", team: "Genesis Esports", finishes: 28, fpm: 1.56, contribution: "30%", best: 4, fivePlusFinishes: 0, matches: 18 },
      { placement: 12, player: "AQUANOX", team: "Gladiators Esports", finishes: 27, fpm: 1.50, contribution: "24%", best: 7, fivePlusFinishes: 2, matches: 18 },
      { placement: 13, player: "NINJAJOD", team: "Revenant XSpark", finishes: 27, fpm: 1.50, contribution: "26%", best: 6, fivePlusFinishes: 2, matches: 18 },
      { placement: 14, player: "REAPER", team: "Team Tamilas", finishes: 27, fpm: 1.50, contribution: "36%", best: 5, fivePlusFinishes: 1, matches: 18 },
      { placement: 15, player: "DHRUV", team: "Rapid Chaos", finishes: 27, fpm: 1.50, contribution: "29%", best: 5, fivePlusFinishes: 1, matches: 18 },
      { placement: 16, player: "NINJABOI", team: "Team Outrage", finishes: 27, fpm: 1.50, contribution: "41%", best: 4, fivePlusFinishes: 0, matches: 18 },
      { placement: 17, player: "SCARYJOD", team: "Elite Nova Esports", finishes: 26, fpm: 1.44, contribution: "33%", best: 7, fivePlusFinishes: 1, matches: 18 },
      { placement: 18, player: "JONATHAN", team: "Apex Gaming", finishes: 26, fpm: 1.44, contribution: "29%", best: 6, fivePlusFinishes: 1, matches: 18 },
      { placement: 19, player: "MAFIA", team: "Elite Nova Esports", finishes: 26, fpm: 1.44, contribution: "33%", best: 5, fivePlusFinishes: 1, matches: 18 },
      { placement: 20, player: "TRACEGOD", team: "Revenant XSpark", finishes: 26, fpm: 1.44, contribution: "25%", best: 5, fivePlusFinishes: 1, matches: 18 },
      { placement: 21, player: "WIZZGOD", team: "Orangutan", finishes: 26, fpm: 1.44, contribution: "22%", best: 5, fivePlusFinishes: 1, matches: 18 },
      { placement: 22, player: "SKIPZ", team: "8Bit", finishes: 26, fpm: 1.44, contribution: "35%", best: 4, fivePlusFinishes: 0, matches: 18 },
      { placement: 23, player: "GOBLIN", team: "Team SouL", finishes: 25, fpm: 1.47, contribution: "32%", best: 4, fivePlusFinishes: 0, matches: 17 },
      { placement: 24, player: "PHOENIX", team: "Nebula Esports", finishes: 25, fpm: 1.39, contribution: "22%", best: 8, fivePlusFinishes: 1, matches: 18 },
      { placement: 25, player: "HARSH", team: "Apex Gaming", finishes: 25, fpm: 1.39, contribution: "28%", best: 3, fivePlusFinishes: 0, matches: 18 },
      { placement: 26, player: "JOKER", team: "Team SouL", finishes: 24, fpm: 1.33, contribution: "30%", best: 6, fivePlusFinishes: 1, matches: 18 },
      { placement: 27, player: "HYDRO", team: "Apex Gaming", finishes: 24, fpm: 1.33, contribution: "27%", best: 5, fivePlusFinishes: 1, matches: 18 },
      { placement: 28, player: "LEVII", team: "Reckoning Esports", finishes: 23, fpm: 1.53, contribution: "28%", best: 5, fivePlusFinishes: 1, matches: 15 },
      { placement: 29, player: "REXBOY", team: "7Gods Esports", finishes: 22, fpm: 1.22, contribution: "34%", best: 7, fivePlusFinishes: 1, matches: 18 },
      { placement: 30, player: "VIPER", team: "Genesis Esports", finishes: 22, fpm: 1.22, contribution: "24%", best: 5, fivePlusFinishes: 1, matches: 18 },
      { placement: 31, player: "NEYO", team: "Gladiators Esports", finishes: 22, fpm: 1.22, contribution: "19%", best: 5, fivePlusFinishes: 1, matches: 18 },
      { placement: 32, player: "AADII", team: "Nebula Esports", finishes: 22, fpm: 1.22, contribution: "19%", best: 5, fivePlusFinishes: 1, matches: 18 },
      { placement: 33, player: "KAANHA", team: "Wyld Fangs", finishes: 22, fpm: 1.22, contribution: "33%", best: 4, fivePlusFinishes: 0, matches: 18 },
      { placement: 34, player: "SHUBH", team: "8Bit", finishes: 21, fpm: 1.17, contribution: "28%", best: 7, fivePlusFinishes: 1, matches: 18 },
      { placement: 35, player: "TOXIC", team: "Rapid Chaos", finishes: 21, fpm: 1.17, contribution: "23%", best: 4, fivePlusFinishes: 0, matches: 18 },
      { placement: 36, player: "GOTEN", team: "Wyld Fangs", finishes: 19, fpm: 1.06, contribution: "28%", best: 4, fivePlusFinishes: 0, matches: 18 },
      { placement: 37, player: "PAIN", team: "Revenant XSpark", finishes: 19, fpm: 1.06, contribution: "18%", best: 4, fivePlusFinishes: 0, matches: 18 },
      { placement: 38, player: "MOKSH", team: "7Gods Esports", finishes: 18, fpm: 1.00, contribution: "28%", best: 7, fivePlusFinishes: 1, matches: 18 },
      { placement: 39, player: "JUSTY06", team: "Team Tamilas", finishes: 18, fpm: 1.00, contribution: "24%", best: 4, fivePlusFinishes: 0, matches: 18 },
      { placement: 40, player: "DETROX", team: "Myth Official", finishes: 17, fpm: 0.94, contribution: "35%", best: 4, fivePlusFinishes: 0, matches: 18 },
      { placement: 41, player: "AIMGODD", team: "Team Tamilas", finishes: 17, fpm: 0.94, contribution: "22%", best: 4, fivePlusFinishes: 0, matches: 18 },
      { placement: 42, player: "SLUG", team: "Team Outrage", finishes: 17, fpm: 0.94, contribution: "26%", best: 3, fivePlusFinishes: 0, matches: 18 },
      { placement: 43, player: "LEGIT", team: "Team SouL", finishes: 17, fpm: 0.94, contribution: "22%", best: 3, fivePlusFinishes: 0, matches: 18 },
      { placement: 44, player: "VENOM", team: "Elite Nova Esports", finishes: 16, fpm: 0.89, contribution: "21%", best: 3, fivePlusFinishes: 0, matches: 18 },
      { placement: 45, player: "NINJA", team: "7Gods Esports", finishes: 15, fpm: 0.83, contribution: "23%", best: 5, fivePlusFinishes: 1, matches: 18 },
      { placement: 46, player: "SENSEI", team: "Wyld Fangs", finishes: 15, fpm: 0.83, contribution: "22%", best: 4, fivePlusFinishes: 0, matches: 18 },
      { placement: 47, player: "JELLY", team: "Apex Gaming", finishes: 15, fpm: 0.83, contribution: "17%", best: 4, fivePlusFinishes: 0, matches: 18 },
      { placement: 48, player: "SARANG", team: "8Bit", finishes: 15, fpm: 0.83, contribution: "20%", best: 3, fivePlusFinishes: 0, matches: 18 },
      { placement: 49, player: "GRAVITY", team: "Genesis Esports", finishes: 14, fpm: 0.78, contribution: "15%", best: 4, fivePlusFinishes: 0, matches: 18 },
      { placement: 50, player: "KNIGHT", team: "Team Outrage", finishes: 14, fpm: 0.78, contribution: "21%", best: 3, fivePlusFinishes: 0, matches: 18 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Stage-level leaderboard results
// ---------------------------------------------------------------------------
const SUPER_WEEKEND_LEADERBOARD = [
  { rank: 1,  team: "Team Tamilas",     total: 460, sw1: 267, sw2: 193, qualifiesTo: "Grand Finals" },
  { rank: 2,  team: "Elite Nova",       total: 456, sw1: 200, sw2: 256, qualifiesTo: "Grand Finals" },
  { rank: 3,  team: "Team SouL",        total: 434, sw1: 227, sw2: 207, qualifiesTo: "Grand Finals" },
  { rank: 4,  team: "Nebula Esports",   total: 402, sw1: 218, sw2: 184, qualifiesTo: "Grand Finals" },
  { rank: 5,  team: "Gladiators Esports", total: 396, sw1: 176, sw2: 220, qualifiesTo: "Grand Finals" },
  { rank: 6,  team: "Myth Official",    total: 391, sw1: 197, sw2: 194, qualifiesTo: "Grand Finals" },
  { rank: 7,  team: "Genesis Esports",  total: 391, sw1: 166, sw2: 225, qualifiesTo: "Playoffs" },
  { rank: 8,  team: "Team Outrage",     total: 388, sw1: 189, sw2: 199, qualifiesTo: "Playoffs" },
  { rank: 9,  team: "GodLike Esports",  total: 358, sw1: 185, sw2: 173, qualifiesTo: "Playoffs" },
  { rank: 10, team: "Orangutan",        total: 351, sw1: 174, sw2: 177, qualifiesTo: "Playoffs" },
  { rank: 11, team: "Apex Gaming",      total: 343, sw1: 181, sw2: 162, qualifiesTo: "Playoffs" },
  { rank: 12, team: "Wyld Fangs",       total: 334, sw1: 229, sw2: 105, qualifiesTo: "Playoffs" },
  { rank: 13, team: "Zero Ark",         total: 331, sw1: 150, sw2: 181, qualifiesTo: "Playoffs" },
  { rank: 14, team: "Revenant XSpark",  total: 276, sw1: null, sw2: 276, qualifiesTo: "Playoffs" },
  { rank: 15, team: "Vasista Esports",  total: 207, sw1: null, sw2: 207, qualifiesTo: "Playoffs" },
  { rank: 16, team: "Reckoning Esports", total: 173, sw1: 173, sw2: null, qualifiesTo: "Playoffs" },
  { rank: 17, team: "Rapid Chaos",      total: 156, sw1: 156, sw2: null, qualifiesTo: "Eliminated (after Playoffs)" },
  { rank: 18, team: "K9 Esports",       total: 155, sw1: null, sw2: 155, qualifiesTo: "Eliminated (after Playoffs)" },
  { rank: 19, team: "Epigrotive Gaming", total: 124, sw1: 124, sw2: null, qualifiesTo: "Eliminated (after Playoffs)" },
];

const LEAGUE_LEADERBOARD = [
  { rank: 1,  team: "Apex Gaming",      total: 786, lw1: 205, lw2: 281, lw3: 300, qualifiesTo: "Playoffs" },
  { rank: 2,  team: "Gladiators Esports", total: 668, lw1: 185, lw2: 250, lw3: 233, qualifiesTo: "Playoffs (already via SW)" },
  { rank: 3,  team: "K9 Esports",       total: 655, lw1: 150, lw2: 219, lw3: 286, qualifiesTo: "Playoffs" },
  { rank: 4,  team: "Vasista Esports",  total: 628, lw1: 160, lw2: 219, lw3: 249, qualifiesTo: "Playoffs (already via SW)" },
  { rank: 5,  team: "Epigrotive Gaming", total: 613, lw1: 180, lw2: 225, lw3: 208, qualifiesTo: "Playoffs" },
  { rank: 6,  team: "Revenant XSpark",  total: 602, lw1: 180, lw2: 204, lw3: 218, qualifiesTo: "Playoffs (already via SW)" },
  { rank: 7,  team: "8Bit",             total: 585, lw1: 193, lw2: 189, lw3: 203, qualifiesTo: "Playoffs" },
  { rank: 8,  team: "Rapid Chaos",      total: 570, lw1: 161, lw2: 223, lw3: 186, qualifiesTo: "Playoffs (already via SW)" },
  { rank: 9,  team: "Genesis Esports",  total: 547, lw1: 230, lw2: null, lw3: 317, qualifiesTo: "Playoffs (already via SW)" },
  { rank: 10, team: "Quantum Sparks",   total: 541, lw1: 162, lw2: 222, lw3: 157, qualifiesTo: "Eliminated" },
  { rank: 11, team: "7Gods Esports",    total: 494, lw1: 144, lw2: 202, lw3: 148, qualifiesTo: "Eliminated" },
  { rank: 12, team: "White Walkers",    total: 488, lw1: 157, lw2: 171, lw3: 160, qualifiesTo: "Eliminated" },
  { rank: 13, team: "HyperCatz",        total: 484, lw1: 126, lw2: 201, lw3: 157, qualifiesTo: "Eliminated" },
  { rank: 14, team: "Team SouL",        total: 431, lw1: 184, lw2: 247, lw3: null, qualifiesTo: "Playoffs (already via SW)" },
  { rank: 15, team: "Myth Official",    total: 413, lw1: 152, lw2: 261, lw3: null, qualifiesTo: "Grand Finals (already via SW)" },
  { rank: 16, team: "Zero Ark",         total: 397, lw1: 173, lw2: null, lw3: 224, qualifiesTo: "Playoffs (already via SW)" },
  { rank: 17, team: "Nebula Esports",   total: 393, lw1: 141, lw2: 252, lw3: null, qualifiesTo: "Grand Finals (already via SW)" },
  { rank: 18, team: "Wyld Fangs",       total: 387, lw1: 135, lw2: 252, lw3: null, qualifiesTo: "Playoffs (already via SW)" },
  { rank: 19, team: "Reckoning Esports", total: 356, lw1: 161, lw2: null, lw3: 195, qualifiesTo: "Playoffs (already via SW)" },
  { rank: 20, team: "Orangutan",        total: 230, lw1: null, lw2: null, lw3: 230, qualifiesTo: "Playoffs (already via SW)" },
  { rank: 21, team: "Team Outrage",     total: 211, lw1: 211, lw2: null, lw3: null, qualifiesTo: "Playoffs (already via SW)" },
  { rank: 22, team: "Team Tamilas",     total: 171, lw1: 171, lw2: null, lw3: null, qualifiesTo: "Grand Finals (already via SW)" },
  { rank: 22, team: "Elite Nova",       total: 171, lw1: 171, lw2: null, lw3: null, qualifiesTo: "Grand Finals (already via SW)" },
];

// Playoffs results � flat format
const PLAYOFFS_STANDINGS = [
  { rank: 1,  team: "Team Outrage",        matches: 18, wwcd: 4, placementPoints: 107, elims: 119, totalPoints: 226 },
  { rank: 2,  team: "Rapid Chaos",         matches: 18, wwcd: 2, placementPoints: 104, elims: 104, totalPoints: 208 },
  { rank: 3,  team: "8Bit",                matches: 18, wwcd: 3, placementPoints: 95,  elims: 103, totalPoints: 198 },
  { rank: 4,  team: "Revenant XSpark",     matches: 18, wwcd: 0, placementPoints: 73,  elims: 108, totalPoints: 181 },
  { rank: 5,  team: "Genesis Esports",     matches: 18, wwcd: 0, placementPoints: 51,  elims: 116, totalPoints: 167 },
  { rank: 6,  team: "Wyld Fangs",          matches: 18, wwcd: 1, placementPoints: 83,  elims: 81,  totalPoints: 164 },
  { rank: 7,  team: "7Gods Esports",       matches: 18, wwcd: 2, placementPoints: 82,  elims: 75,  totalPoints: 157 },
  { rank: 8,  team: "Orangutan",           matches: 18, wwcd: 1, placementPoints: 61,  elims: 83,  totalPoints: 144 },
  { rank: 9,  team: "Apex Gaming",         matches: 18, wwcd: 2, placementPoints: 68,  elims: 74,  totalPoints: 142 },
  { rank: 10, team: "Reckoning Esports",   matches: 18, wwcd: 1, placementPoints: 59,  elims: 73,  totalPoints: 132 },
  { rank: 11, team: "Vasista Esports",     matches: 18, wwcd: 0, placementPoints: 57,  elims: 68,  totalPoints: 125 },
  { rank: 12, team: "K9 Esports",          matches: 18, wwcd: 0, placementPoints: 44,  elims: 79,  totalPoints: 123 },
  { rank: 13, team: "GodLike Esports",     matches: 18, wwcd: 1, placementPoints: 39,  elims: 83,  totalPoints: 122 },
  { rank: 14, team: "Quantum Sparks",      matches: 18, wwcd: 0, placementPoints: 55,  elims: 63,  totalPoints: 118 },
  { rank: 15, team: "Epigrotive Gaming",   matches: 18, wwcd: 1, placementPoints: 41,  elims: 51,  totalPoints: 92 },
  { rank: 16, team: "Zero Ark",            matches: 18, wwcd: 0, placementPoints: 38,  elims: 48,  totalPoints: 86 },
];

// Grand Finals FINAL standings — all 17 matches played
const GRAND_FINAL_STANDINGS = [
  {
    rank: 1, team: "Nebula Esports", totalPoints: 210,
    games: [
      { game: 1, placement: 1, kills: 20 }, { game: 2, placement: 2, kills: 6 },
      { game: 3, placement: 1, kills: 12 }, { game: 4, placement: 16, kills: 4 },
      { game: 5, placement: 3, kills: 12 }, { game: 6, placement: 3, kills: 2 },
      { game: 7, placement: 13, kills: 4 }, { game: 8, placement: 1, kills: 11 },
      { game: 9, placement: 1, kills: 12 }, { game: 10, placement: 5, kills: 5 },
      { game: 11, placement: 14, kills: 4 }, { game: 12, placement: 7, kills: 9 },
      { game: 13, placement: 9, kills: 5 }, { game: 14, placement: 8, kills: 0 },
      { game: 15, placement: 10, kills: 1 }, { game: 16, placement: 11, kills: 4 },
      { game: 17, placement: 3, kills: 5 }, { game: 18, placement: 11, kills: 0 },
    ],
  },
  {
    rank: 2, team: "Gladiators Esports", totalPoints: 189,
    games: [
      { game: 1, placement: 7, kills: 16 }, { game: 2, placement: 8, kills: 4 },
      { game: 3, placement: 9, kills: 2 }, { game: 4, placement: 6, kills: 3 },
      { game: 5, placement: 6, kills: 4 }, { game: 6, placement: 6, kills: 5 },
      { game: 7, placement: 1, kills: 17 }, { game: 8, placement: 4, kills: 1 },
      { game: 9, placement: 4, kills: 8 }, { game: 10, placement: 7, kills: 3 },
      { game: 11, placement: 5, kills: 6 }, { game: 12, placement: 1, kills: 12 },
      { game: 13, placement: 1, kills: 15 }, { game: 14, placement: 7, kills: 2 },
      { game: 15, placement: 16, kills: 0 }, { game: 16, placement: 14, kills: 2 },
      { game: 17, placement: 7, kills: 7 }, { game: 18, placement: 1, kills: 7 },
    ],
  },
  {
    rank: 3, team: "Orangutan", totalPoints: 187,
    games: [
      { game: 1, placement: 13, kills: 5 }, { game: 2, placement: 16, kills: 0 },
      { game: 3, placement: 11, kills: 4 }, { game: 4, placement: 15, kills: 8 },
      { game: 5, placement: 1, kills: 13 }, { game: 6, placement: 15, kills: 4 },
      { game: 7, placement: 6, kills: 15 }, { game: 8, placement: 8, kills: 2 },
      { game: 9, placement: 8, kills: 5 }, { game: 10, placement: 3, kills: 14 },
      { game: 11, placement: 13, kills: 0 }, { game: 12, placement: 6, kills: 6 },
      { game: 13, placement: 15, kills: 6 }, { game: 14, placement: 14, kills: 2 },
      { game: 15, placement: 1, kills: 14 }, { game: 16, placement: 9, kills: 5 },
      { game: 17, placement: 1, kills: 14 }, { game: 18, placement: 3, kills: 3 },
    ],
  },
  {
    rank: 4, team: "Rapid Chaos", totalPoints: 170,
    games: [
      { game: 1, placement: 3, kills: 8 }, { game: 2, placement: 11, kills: 5 },
      { game: 3, placement: 3, kills: 3 }, { game: 4, placement: 2, kills: 9 },
      { game: 5, placement: 15, kills: 0 }, { game: 6, placement: 11, kills: 3 },
      { game: 7, placement: 3, kills: 9 }, { game: 8, placement: 7, kills: 2 },
      { game: 9, placement: 3, kills: 4 }, { game: 10, placement: 6, kills: 5 },
      { game: 11, placement: 11, kills: 1 }, { game: 12, placement: 2, kills: 8 },
      { game: 13, placement: 6, kills: 7 }, { game: 14, placement: 4, kills: 4 },
      { game: 15, placement: 6, kills: 1 }, { game: 16, placement: 1, kills: 10 },
      { game: 17, placement: 13, kills: 1 }, { game: 18, placement: 4, kills: 13 },
    ],
  },
  {
    rank: 5, team: "Apex Gaming", totalPoints: 163,
    games: [
      { game: 1, placement: 16, kills: 6 }, { game: 2, placement: 12, kills: 2 },
      { game: 3, placement: 7, kills: 4 }, { game: 4, placement: 12, kills: 7 },
      { game: 5, placement: 2, kills: 2 }, { game: 6, placement: 5, kills: 5 },
      { game: 7, placement: 10, kills: 3 }, { game: 8, placement: 3, kills: 7 },
      { game: 9, placement: 15, kills: 0 }, { game: 10, placement: 1, kills: 13 },
      { game: 11, placement: 12, kills: 5 }, { game: 12, placement: 15, kills: 0 },
      { game: 13, placement: 8, kills: 9 }, { game: 14, placement: 3, kills: 9 },
      { game: 15, placement: 2, kills: 4 }, { game: 16, placement: 12, kills: 9 },
      { game: 17, placement: 5, kills: 2 }, { game: 18, placement: 5, kills: 3 },
    ],
  },
  {
    rank: 6, team: "Reckoning Esports", totalPoints: 153,
    games: [
      { game: 1, placement: 9, kills: 11 }, { game: 2, placement: 6, kills: 4 },
      { game: 3, placement: 5, kills: 0 }, { game: 4, placement: 1, kills: 9 },
      { game: 5, placement: 4, kills: 5 }, { game: 6, placement: 9, kills: 4 },
      { game: 7, placement: 2, kills: 7 }, { game: 8, placement: 6, kills: 3 },
      { game: 9, placement: 5, kills: 0 }, { game: 10, placement: 9, kills: 4 },
      { game: 11, placement: 2, kills: 2 }, { game: 12, placement: 10, kills: 1 },
      { game: 13, placement: 5, kills: 3 }, { game: 14, placement: 10, kills: 5 },
      { game: 15, placement: 7, kills: 4 }, { game: 16, placement: 2, kills: 10 },
      { game: 17, placement: 2, kills: 6 }, { game: 18, placement: 2, kills: 4 },
    ],
  },
  {
    rank: 7, team: "Team Tamilas", totalPoints: 136,
    games: [
      { game: 1, placement: 5, kills: 6 }, { game: 2, placement: 10, kills: 8 },
      { game: 3, placement: 14, kills: 4 }, { game: 4, placement: 13, kills: 2 },
      { game: 5, placement: 16, kills: 0 }, { game: 6, placement: 1, kills: 6 },
      { game: 7, placement: 4, kills: 14 }, { game: 8, placement: 13, kills: 3 },
      { game: 9, placement: 6, kills: 1 }, { game: 10, placement: 11, kills: 5 },
      { game: 11, placement: 10, kills: 3 }, { game: 12, placement: 4, kills: 2 },
      { game: 13, placement: 4, kills: 5 }, { game: 14, placement: 2, kills: 5 },
      { game: 15, placement: 11, kills: 2 }, { game: 16, placement: 5, kills: 4 },
      { game: 17, placement: 6, kills: 0 }, { game: 18, placement: 12, kills: 6 },
    ],
  },
  {
    rank: 8, team: "Team SouL", totalPoints: 136,
    games: [
      { game: 1, placement: 10, kills: 3 }, { game: 2, placement: 15, kills: 4 },
      { game: 3, placement: 10, kills: 3 }, { game: 4, placement: 4, kills: 5 },
      { game: 5, placement: 7, kills: 5 }, { game: 6, placement: 16, kills: 0 },
      { game: 7, placement: 9, kills: 4 }, { game: 8, placement: 5, kills: 8 },
      { game: 9, placement: 12, kills: 2 }, { game: 10, placement: 14, kills: 2 },
      { game: 11, placement: 1, kills: 11 }, { game: 12, placement: 3, kills: 2 },
      { game: 13, placement: 11, kills: 7 }, { game: 14, placement: 13, kills: 4 },
      { game: 15, placement: 3, kills: 7 }, { game: 16, placement: 8, kills: 10 },
      { game: 17, placement: 12, kills: 2 }, { game: 18, placement: 15, kills: 0 },
    ],
  },
  {
    rank: 9, team: "Genesis Esports", totalPoints: 135,
    games: [
      { game: 1, placement: 14, kills: 6 }, { game: 2, placement: 3, kills: 2 },
      { game: 3, placement: 2, kills: 12 }, { game: 4, placement: 10, kills: 7 },
      { game: 5, placement: 14, kills: 1 }, { game: 6, placement: 8, kills: 1 },
      { game: 7, placement: 14, kills: 2 }, { game: 8, placement: 16, kills: 1 },
      { game: 9, placement: 14, kills: 4 }, { game: 10, placement: 10, kills: 5 },
      { game: 11, placement: 3, kills: 10 }, { game: 12, placement: 5, kills: 5 },
      { game: 13, placement: 12, kills: 13 }, { game: 14, placement: 11, kills: 3 },
      { game: 15, placement: 12, kills: 2 }, { game: 16, placement: 6, kills: 10 },
      { game: 17, placement: 10, kills: 5 }, { game: 18, placement: 7, kills: 3 },
    ],
  },
  {
    rank: 10, team: "Revenant XSpark", totalPoints: 131,
    games: [
      { game: 1, placement: 12, kills: 1 }, { game: 2, placement: 1, kills: 10 },
      { game: 3, placement: 8, kills: 4 }, { game: 4, placement: 9, kills: 11 },
      { game: 5, placement: 9, kills: 5 }, { game: 6, placement: 10, kills: 5 },
      { game: 7, placement: 7, kills: 10 }, { game: 8, placement: 10, kills: 1 },
      { game: 9, placement: 9, kills: 6 }, { game: 10, placement: 15, kills: 11 },
      { game: 11, placement: 16, kills: 0 }, { game: 12, placement: 14, kills: 0 },
      { game: 13, placement: 16, kills: 1 }, { game: 14, placement: 5, kills: 4 },
      { game: 15, placement: 14, kills: 2 }, { game: 16, placement: 4, kills: 6 },
      { game: 17, placement: 9, kills: 4 }, { game: 18, placement: 13, kills: 4 },
    ],
  },
  {
    rank: 11, team: "8Bit", totalPoints: 126,
    games: [
      { game: 1, placement: 15, kills: 2 }, { game: 2, placement: 14, kills: 0 },
      { game: 3, placement: 16, kills: 0 }, { game: 4, placement: 14, kills: 9 },
      { game: 5, placement: 10, kills: 1 }, { game: 6, placement: 13, kills: 5 },
      { game: 7, placement: 16, kills: 0 }, { game: 8, placement: 12, kills: 4 },
      { game: 9, placement: 2, kills: 6 }, { game: 10, placement: 13, kills: 7 },
      { game: 11, placement: 6, kills: 2 }, { game: 12, placement: 9, kills: 5 },
      { game: 13, placement: 10, kills: 6 }, { game: 14, placement: 1, kills: 12 },
      { game: 15, placement: 13, kills: 4 }, { game: 16, placement: 16, kills: 8 },
      { game: 17, placement: 14, kills: 2 }, { game: 18, placement: 16, kills: 1 },
    ],
  },
  {
    rank: 12, team: "Elite Nova", totalPoints: 120,
    games: [
      { game: 1, placement: 11, kills: 9 }, { game: 2, placement: 4, kills: 4 },
      { game: 3, placement: 4, kills: 3 }, { game: 4, placement: 5, kills: 9 },
      { game: 5, placement: 5, kills: 0 }, { game: 6, placement: 4, kills: 8 },
      { game: 7, placement: 11, kills: 4 }, { game: 8, placement: 2, kills: 7 },
      { game: 9, placement: 10, kills: 2 }, { game: 10, placement: 12, kills: 6 },
      { game: 11, placement: 7, kills: 2 }, { game: 12, placement: 12, kills: 3 },
      { game: 13, placement: 13, kills: 5 }, { game: 14, placement: 6, kills: 3 },
      { game: 15, placement: 9, kills: 4 }, { game: 16, placement: 15, kills: 5 },
      { game: 17, placement: 16, kills: 0 }, { game: 18, placement: 8, kills: 4 },
    ],
  },
  {
    rank: 13, team: "7Gods Esports", totalPoints: 116,
    games: [
      { game: 1, placement: 2, kills: 6 }, { game: 2, placement: 5, kills: 8 },
      { game: 3, placement: 6, kills: 0 }, { game: 4, placement: 3, kills: 5 },
      { game: 5, placement: 11, kills: 2 }, { game: 6, placement: 14, kills: 0 },
      { game: 7, placement: 8, kills: 4 }, { game: 8, placement: 15, kills: 1 },
      { game: 9, placement: 7, kills: 4 }, { game: 10, placement: 8, kills: 2 },
      { game: 11, placement: 15, kills: 5 }, { game: 12, placement: 16, kills: 0 },
      { game: 13, placement: 7, kills: 3 }, { game: 14, placement: 16, kills: 0 },
      { game: 15, placement: 4, kills: 9 }, { game: 16, placement: 10, kills: 10 },
      { game: 17, placement: 8, kills: 2 }, { game: 18, placement: 10, kills: 4 },
    ],
  },
  {
    rank: 14, team: "Team Outrage", totalPoints: 102,
    games: [
      { game: 1, placement: 4, kills: 5 }, { game: 2, placement: 7, kills: 2 },
      { game: 3, placement: 12, kills: 2 }, { game: 4, placement: 8, kills: 5 },
      { game: 5, placement: 13, kills: 5 }, { game: 6, placement: 7, kills: 6 },
      { game: 7, placement: 12, kills: 5 }, { game: 8, placement: 9, kills: 5 },
      { game: 9, placement: 11, kills: 2 }, { game: 10, placement: 16, kills: 2 },
      { game: 11, placement: 4, kills: 3 }, { game: 12, placement: 8, kills: 1 },
      { game: 13, placement: 2, kills: 6 }, { game: 14, placement: 12, kills: 4 },
      { game: 15, placement: 15, kills: 1 }, { game: 16, placement: 13, kills: 5 },
      { game: 17, placement: 4, kills: 5 }, { game: 18, placement: 14, kills: 2 },
    ],
  },
  {
    rank: 15, team: "Wyld Fangs", totalPoints: 93,
    games: [
      { game: 1, placement: 8, kills: 6 }, { game: 2, placement: 9, kills: 0 },
      { game: 3, placement: 15, kills: 0 }, { game: 4, placement: 11, kills: 8 },
      { game: 5, placement: 8, kills: 4 }, { game: 6, placement: 2, kills: 6 },
      { game: 7, placement: 15, kills: 1 }, { game: 8, placement: 14, kills: 1 },
      { game: 9, placement: 16, kills: 1 }, { game: 10, placement: 4, kills: 12 },
      { game: 11, placement: 9, kills: 1 }, { game: 12, placement: 11, kills: 4 },
      { game: 13, placement: 14, kills: 3 }, { game: 14, placement: 9, kills: 1 },
      { game: 15, placement: 8, kills: 2 }, { game: 16, placement: 3, kills: 9 },
      { game: 17, placement: 15, kills: 4 }, { game: 18, placement: 9, kills: 4 },
    ],
  },
  {
    rank: 16, team: "Myth Official", totalPoints: 84,
    games: [
      { game: 1, placement: 6, kills: 0 }, { game: 2, placement: 13, kills: 0 },
      { game: 3, placement: 13, kills: 2 }, { game: 4, placement: 7, kills: 4 },
      { game: 5, placement: 12, kills: 0 }, { game: 6, placement: 12, kills: 1 },
      { game: 7, placement: 5, kills: 6 }, { game: 8, placement: 11, kills: 2 },
      { game: 9, placement: 13, kills: 2 }, { game: 10, placement: 2, kills: 8 },
      { game: 11, placement: 8, kills: 2 }, { game: 12, placement: 13, kills: 1 },
      { game: 13, placement: 3, kills: 10 }, { game: 14, placement: 15, kills: 3 },
      { game: 15, placement: 5, kills: 3 }, { game: 16, placement: 7, kills: 4 },
      { game: 17, placement: 11, kills: 1 }, { game: 18, placement: 6, kills: 0 },
    ],
  },
];

const GRAND_FINALS_STANDINGS = [
  {
    rank: 1,  team: "Nebula Esports",    totalPoints: 210,
    matches: 18, wwcd: 4, placementPoints: 81, elims: 125,
  },
  {
    rank: 2,  team: "Gladiators Esports", totalPoints: 189,
    matches: 18, wwcd: 3, placementPoints: 81, elims: 105,
  },
  {
    rank: 3,  team: "Orangutan",         totalPoints: 187,
    matches: 18, wwcd: 3, placementPoints: 99, elims: 85,
  },
  {
    rank: 4,  team: "Rapid Chaos",       totalPoints: 170,
    matches: 18, wwcd: 2, placementPoints: 73, elims: 95,
  },
  {
    rank: 5,  team: "Apex Gaming",       totalPoints: 163,
    matches: 18, wwcd: 3, placementPoints: 63, elims: 97,
  },
  {
    rank: 6,  team: "Reckoning Esports", totalPoints: 153,
    matches: 18, wwcd: 2, placementPoints: 69, elims: 81,
  },
  {
    rank: 7,  team: "Team Tamilas",      totalPoints: 136,
    matches: 18, wwcd: 1, placementPoints: 75, elims: 61,
  },
  {
    rank: 8,  team: "Team SouL",         totalPoints: 136,
    matches: 18, wwcd: 1, placementPoints: 57, elims: 77,
  },
  {
    rank: 9,  team: "Genesis Esports",   totalPoints: 135,
    matches: 18, wwcd: 1, placementPoints: 63, elims: 71,
  },
  {
    rank: 10, team: "Revenant XSpark",   totalPoints: 131,
    matches: 18, wwcd: 1, placementPoints: 63, elims: 67,
  },
  {
    rank: 11, team: "8Bit",              totalPoints: 126,
    matches: 18, wwcd: 0, placementPoints: 75, elims: 51,
  },
  {
    rank: 12, team: "Elite Nova Esports", totalPoints: 120,
    matches: 18, wwcd: 1, placementPoints: 57, elims: 62,
  },
  {
    rank: 13, team: "7Gods Esports",     totalPoints: 116,
    matches: 18, wwcd: 1, placementPoints: 45, elims: 71,
  },
  {
    rank: 14, team: "Team Outrage",      totalPoints: 102,
    matches: 18, wwcd: 0, placementPoints: 54, elims: 48,
  },
  {
    rank: 15, team: "Wyld Fangs",        totalPoints: 93,
    matches: 18, wwcd: 0, placementPoints: 45, elims: 48,
  },
  {
    rank: 16, team: "Myth Official",     totalPoints: 84,
    matches: 18, wwcd: 0, placementPoints: 48, elims: 36,
  },
];

const LW1_STANDINGS = [
  { rank: 1,  team: "Genesis Esports",     matches: 16, wwcd: 2, placementPoints: 120, elims: 110, totalPoints: 230 },
  { rank: 2,  team: "Team Outrage",        matches: 16, wwcd: 2, placementPoints: 110, elims: 101, totalPoints: 211 },
  { rank: 3,  team: "Apex Gaming",         matches: 16, wwcd: 0, placementPoints: 112, elims: 93,  totalPoints: 205 },
  { rank: 4,  team: "8Bit",                matches: 16, wwcd: 1, placementPoints: 116, elims: 77,  totalPoints: 193 },
  { rank: 5,  team: "Gladiators Esports",  matches: 16, wwcd: 2, placementPoints: 93,  elims: 92,  totalPoints: 185 },
  { rank: 6,  team: "Team SouL",           matches: 16, wwcd: 0, placementPoints: 107, elims: 77,  totalPoints: 184 },
  { rank: 7,  team: "Revenant XSpark",     matches: 16, wwcd: 3, placementPoints: 86,  elims: 94,  totalPoints: 180 },
  { rank: 8,  team: "Epigrotive Gaming",   matches: 16, wwcd: 1, placementPoints: 87,  elims: 93,  totalPoints: 180 },
  { rank: 9,  team: "Zero Ark",            matches: 16, wwcd: 1, placementPoints: 90,  elims: 83,  totalPoints: 173 },
  { rank: 10, team: "Elite Nova",          matches: 16, wwcd: 2, placementPoints: 93,  elims: 78,  totalPoints: 171 },
  { rank: 11, team: "Team Tamilas",        matches: 16, wwcd: 0, placementPoints: 98,  elims: 73,  totalPoints: 171 },
  { rank: 12, team: "Quantum Sparks",      matches: 16, wwcd: 1, placementPoints: 95,  elims: 67,  totalPoints: 162 },
  { rank: 13, team: "Reckoning Esports",   matches: 16, wwcd: 2, placementPoints: 95,  elims: 66,  totalPoints: 161 },
  { rank: 14, team: "Rapid Chaos",         matches: 16, wwcd: 0, placementPoints: 88,  elims: 73,  totalPoints: 161 },
  { rank: 15, team: "Vasista Esports",     matches: 16, wwcd: 2, placementPoints: 77,  elims: 83,  totalPoints: 160 },
  { rank: 16, team: "White Walkers",       matches: 16, wwcd: 2, placementPoints: 82,  elims: 75,  totalPoints: 157 },
  { rank: 17, team: "Myth Official",       matches: 16, wwcd: 1, placementPoints: 85,  elims: 67,  totalPoints: 152 },
  { rank: 18, team: "K9 Esports",          matches: 16, wwcd: 1, placementPoints: 79,  elims: 71,  totalPoints: 150 },
  { rank: 19, team: "7Gods Esports",       matches: 16, wwcd: 0, placementPoints: 82,  elims: 62,  totalPoints: 144 },
  { rank: 20, team: "Nebula Esports",      matches: 16, wwcd: 0, placementPoints: 61,  elims: 80,  totalPoints: 141 },
  { rank: 21, team: "Wyld Fangs",          matches: 16, wwcd: 0, placementPoints: 78,  elims: 57,  totalPoints: 135 },
  { rank: 22, team: "HyperCatz",           matches: 16, wwcd: 1, placementPoints: 65,  elims: 61,  totalPoints: 126 },
  { rank: 23, team: "Santa Esports",       matches: 16, wwcd: 0, placementPoints: 56,  elims: 59,  totalPoints: 115 },
  { rank: 24, team: "Aura x Esports",      matches: 16, wwcd: 0, placementPoints: 41,  elims: 46,  totalPoints: 87 },
];

const BW_STANDINGS = [
  { rank: 1,  team: "Team Tamilas",        matches: 18, wwcd: 4, placementPoints: 99,  elims: 107, totalPoints: 206 },
  { rank: 2,  team: "Genesis Esports",     matches: 18, wwcd: 2, placementPoints: 73,  elims: 130, totalPoints: 203 },
  { rank: 3,  team: "Elite Nova",          matches: 18, wwcd: 4, placementPoints: 89,  elims: 111, totalPoints: 200 },
  { rank: 4,  team: "Team Outrage",        matches: 18, wwcd: 3, placementPoints: 78,  elims: 109, totalPoints: 187 },
  { rank: 5,  team: "Reckoning Esports",   matches: 18, wwcd: 1, placementPoints: 79,  elims: 83,  totalPoints: 162 },
  { rank: 6,  team: "Zero Ark",            matches: 18, wwcd: 1, placementPoints: 76,  elims: 86,  totalPoints: 162 },
  { rank: 7,  team: "Team SouL",           matches: 18, wwcd: 1, placementPoints: 66,  elims: 87,  totalPoints: 153 },
  { rank: 8,  team: "Apex Gaming",         matches: 18, wwcd: 0, placementPoints: 67,  elims: 76,  totalPoints: 143 },
  { rank: 9,  team: "Revenant XSpark",     matches: 18, wwcd: 0, placementPoints: 56,  elims: 86,  totalPoints: 142 },
  { rank: 10, team: "Epigrotive Gaming",   matches: 18, wwcd: 1, placementPoints: 63,  elims: 77,  totalPoints: 140 },
  { rank: 11, team: "Rapid Chaos",         matches: 18, wwcd: 1, placementPoints: 63,  elims: 75,  totalPoints: 138 },
  { rank: 12, team: "White Walkers",       matches: 18, wwcd: 0, placementPoints: 50,  elims: 73,  totalPoints: 123 },
  { rank: 13, team: "Quantum Sparks",      matches: 18, wwcd: 0, placementPoints: 54,  elims: 65,  totalPoints: 119 },
  { rank: 14, team: "8Bit",                matches: 18, wwcd: 0, placementPoints: 46,  elims: 69,  totalPoints: 115 },
  { rank: 15, team: "Vasista Esports",     matches: 18, wwcd: 0, placementPoints: 40,  elims: 57,  totalPoints: 97 },
  { rank: 16, team: "Gladiators Esports",  matches: 18, wwcd: 0, placementPoints: 34,  elims: 58,  totalPoints: 92 },
];

const LW2_STANDINGS = [
  { rank: 1,  team: "Apex Gaming",         matches: 24, wwcd: 1, placementPoints: 129, elims: 152, totalPoints: 281 },
  { rank: 2,  team: "Myth Official",       matches: 24, wwcd: 1, placementPoints: 144, elims: 117, totalPoints: 261 },
  { rank: 3,  team: "Wyld Fangs",          matches: 24, wwcd: 2, placementPoints: 129, elims: 123, totalPoints: 252 },
  { rank: 4,  team: "Nebula Esports",      matches: 24, wwcd: 2, placementPoints: 123, elims: 129, totalPoints: 252 },
  { rank: 5,  team: "Gladiators Esports",  matches: 24, wwcd: 2, placementPoints: 122, elims: 128, totalPoints: 250 },
  { rank: 6,  team: "Team SouL",           matches: 24, wwcd: 3, placementPoints: 105, elims: 142, totalPoints: 247 },
  { rank: 7,  team: "Epigrotive Gaming",   matches: 24, wwcd: 2, placementPoints: 113, elims: 112, totalPoints: 225 },
  { rank: 8,  team: "Rapid Chaos",         matches: 24, wwcd: 1, placementPoints: 113, elims: 110, totalPoints: 223 },
  { rank: 9,  team: "Quantum Sparks",      matches: 24, wwcd: 3, placementPoints: 120, elims: 102, totalPoints: 222 },
  { rank: 10, team: "Vasista Esports",     matches: 24, wwcd: 2, placementPoints: 117, elims: 102, totalPoints: 219 },
  { rank: 11, team: "K9 Esports",          matches: 24, wwcd: 1, placementPoints: 105, elims: 114, totalPoints: 219 },
  { rank: 12, team: "Revenant XSpark",     matches: 24, wwcd: 0, placementPoints: 102, elims: 102, totalPoints: 204 },
  { rank: 13, team: "7Gods Esports",       matches: 24, wwcd: 1, placementPoints: 99,  elims: 103, totalPoints: 202 },
  { rank: 14, team: "HyperCatz",           matches: 24, wwcd: 2, placementPoints: 114, elims: 87,  totalPoints: 201 },
  { rank: 15, team: "8Bit",                matches: 24, wwcd: 0, placementPoints: 102, elims: 87,  totalPoints: 189 },
  { rank: 16, team: "White Walkers",       matches: 24, wwcd: 1, placementPoints: 89,  elims: 82,  totalPoints: 171 },
];

const SW1_STANDINGS = [
  { rank: 1,  team: "Team Tamilas",        matches: 18, wwcd: 2, placementPoints: 156, elims: 111, totalPoints: 267 },
  { rank: 2,  team: "Wyld Fangs",          matches: 18, wwcd: 1, placementPoints: 124, elims: 105, totalPoints: 229 },
  { rank: 3,  team: "Team SouL",           matches: 18, wwcd: 0, placementPoints: 114, elims: 113, totalPoints: 227 },
  { rank: 4,  team: "Nebula Esports",      matches: 18, wwcd: 0, placementPoints: 129, elims: 89,  totalPoints: 218 },
  { rank: 5,  team: "Elite Nova",          matches: 18, wwcd: 2, placementPoints: 119, elims: 81,  totalPoints: 200 },
  { rank: 6,  team: "Myth Official",       matches: 18, wwcd: 4, placementPoints: 124, elims: 73,  totalPoints: 197 },
  { rank: 7,  team: "Team Outrage",        matches: 18, wwcd: 0, placementPoints: 91,  elims: 98,  totalPoints: 189 },
  { rank: 8,  team: "GodLike Esports",     matches: 18, wwcd: 0, placementPoints: 89,  elims: 96,  totalPoints: 185 },
  { rank: 9,  team: "Apex Gaming",         matches: 18, wwcd: 2, placementPoints: 96,  elims: 85,  totalPoints: 181 },
  { rank: 10, team: "Gladiators Esports",  matches: 18, wwcd: 3, placementPoints: 95,  elims: 81,  totalPoints: 176 },
  { rank: 11, team: "Orangutan",           matches: 18, wwcd: 0, placementPoints: 87,  elims: 87,  totalPoints: 174 },
  { rank: 12, team: "Reckoning Esports",   matches: 18, wwcd: 1, placementPoints: 100, elims: 73,  totalPoints: 173 },
  { rank: 13, team: "Genesis Esports",     matches: 18, wwcd: 1, placementPoints: 93,  elims: 73,  totalPoints: 166 },
  { rank: 14, team: "Rapid Chaos",         matches: 18, wwcd: 1, placementPoints: 83,  elims: 73,  totalPoints: 156 },
  { rank: 15, team: "Zero Ark",            matches: 18, wwcd: 1, placementPoints: 88,  elims: 62,  totalPoints: 150 },
  { rank: 16, team: "Epigrotive Gaming",   matches: 18, wwcd: 0, placementPoints: 60,  elims: 64,  totalPoints: 124 },
];

const LW3_STANDINGS = [
  { rank: 1,  team: "Genesis Esports",     matches: 24, wwcd: 1, placementPoints: 148, elims: 169, totalPoints: 317 },
  { rank: 2,  team: "Apex Gaming",         matches: 24, wwcd: 2, placementPoints: 143, elims: 157, totalPoints: 300 },
  { rank: 3,  team: "K9 Esports",          matches: 24, wwcd: 3, placementPoints: 138, elims: 148, totalPoints: 286 },
  { rank: 4,  team: "Vasista Esports",     matches: 24, wwcd: 4, placementPoints: 129, elims: 120, totalPoints: 249 },
  { rank: 5,  team: "Gladiators Esports",  matches: 24, wwcd: 2, placementPoints: 117, elims: 116, totalPoints: 233 },
  { rank: 6,  team: "Orangutan",           matches: 24, wwcd: 1, placementPoints: 109, elims: 121, totalPoints: 230 },
  { rank: 7,  team: "Zero Ark",            matches: 24, wwcd: 0, placementPoints: 118, elims: 106, totalPoints: 224 },
  { rank: 8,  team: "Revenant XSpark",     matches: 24, wwcd: 3, placementPoints: 109, elims: 109, totalPoints: 218 },
  { rank: 9,  team: "Epigrotive Gaming",   matches: 24, wwcd: 2, placementPoints: 102, elims: 106, totalPoints: 208 },
  { rank: 10, team: "8Bit",                matches: 24, wwcd: 0, placementPoints: 91,  elims: 112, totalPoints: 203 },
  { rank: 11, team: "Reckoning Esports",   matches: 24, wwcd: 0, placementPoints: 102, elims: 93,  totalPoints: 195 },
  { rank: 12, team: "Rapid Chaos",         matches: 24, wwcd: 2, placementPoints: 84,  elims: 102, totalPoints: 186 },
  { rank: 13, team: "White Walkers",       matches: 24, wwcd: 1, placementPoints: 73,  elims: 87,  totalPoints: 160 },
  { rank: 14, team: "HyperCatz",           matches: 24, wwcd: 1, placementPoints: 71,  elims: 86,  totalPoints: 157 },
  { rank: 15, team: "Quantum Sparks",      matches: 24, wwcd: 0, placementPoints: 67,  elims: 90,  totalPoints: 157 },
  { rank: 16, team: "7Gods Esports",       matches: 24, wwcd: 2, placementPoints: 83,  elims: 65,  totalPoints: 148 },
];

const SW2_STANDINGS = [
  { rank: 1,  team: "Revenant XSpark",     matches: 18, wwcd: 3, placementPoints: 157, elims: 119, totalPoints: 276 },
  { rank: 2,  team: "Elite Nova",          matches: 18, wwcd: 3, placementPoints: 142, elims: 114, totalPoints: 256 },
  { rank: 3,  team: "Genesis Esports",     matches: 18, wwcd: 2, placementPoints: 128, elims: 97,  totalPoints: 225 },
  { rank: 4,  team: "Gladiators Esports",  matches: 18, wwcd: 2, placementPoints: 125, elims: 95,  totalPoints: 220 },
  { rank: 5,  team: "Vasista Esports",     matches: 18, wwcd: 3, placementPoints: 115, elims: 92,  totalPoints: 207 },
  { rank: 6,  team: "Team SouL",           matches: 18, wwcd: 1, placementPoints: 116, elims: 91,  totalPoints: 207 },
  { rank: 7,  team: "Team Outrage",        matches: 18, wwcd: 0, placementPoints: 107, elims: 92,  totalPoints: 199 },
  { rank: 8,  team: "Myth Official",       matches: 18, wwcd: 0, placementPoints: 111, elims: 83,  totalPoints: 194 },
  { rank: 9,  team: "Team Tamilas",        matches: 18, wwcd: 2, placementPoints: 112, elims: 81,  totalPoints: 193 },
  { rank: 10, team: "Nebula Esports",      matches: 18, wwcd: 0, placementPoints: 96,  elims: 88,  totalPoints: 184 },
  { rank: 11, team: "Zero Ark",            matches: 18, wwcd: 0, placementPoints: 89,  elims: 92,  totalPoints: 181 },
  { rank: 12, team: "Orangutan",           matches: 18, wwcd: 0, placementPoints: 108, elims: 69,  totalPoints: 177 },
  { rank: 13, team: "GodLike Esports",     matches: 18, wwcd: 1, placementPoints: 94,  elims: 79,  totalPoints: 173 },
  { rank: 14, team: "Apex Gaming",         matches: 18, wwcd: 1, placementPoints: 97,  elims: 65,  totalPoints: 162 },
  { rank: 15, team: "K9 Esports",          matches: 18, wwcd: 0, placementPoints: 88,  elims: 67,  totalPoints: 155 },
  { rank: 16, team: "Wyld Fangs",          matches: 18, wwcd: 0, placementPoints: 58,  elims: 47,  totalPoints: 105 },
];

// Attach detailed results to tournament metadata
tournament.stageResults = {
  lw1Standings: LW1_STANDINGS,
  bwStandings: BW_STANDINGS,
  lw2Standings: LW2_STANDINGS,
  sw1Standings: SW1_STANDINGS,
  lw3Standings: LW3_STANDINGS,
  sw2Standings: SW2_STANDINGS,
  superWeekendLeaderboard: SUPER_WEEKEND_LEADERBOARD,
  leagueLeaderboard: LEAGUE_LEADERBOARD,
  playoffsStandings: PLAYOFFS_STANDINGS,
  grandFinalsStandings: GRAND_FINALS_STANDINGS,
};

// ---------------------------------------------------------------------------
// News articles
// ---------------------------------------------------------------------------
const articles = [
  {
    title: "BGMI Masters Series Season 5 announced with ₹1 Crore prize pool",
    content:
      "NODWIN Gaming has announced the BGMI Masters Series Season 5 with a prize pool of ₹1,01,00,000 INR. The offline tournament features 26 teams (22 invited, 4 qualified) competing from August 10 to September 6, 2026, across League Weeks, Super Weekends, Playoffs, and a 16-team Grand Finals.",
    category: "announcement",
    game: "BGMI",
    featured: 0,
  },
  {
    title: "Nebula Esports lead BGMS S5 Grand Finals after 15 matches",
    content:
      "Nebula Esports top the Grand Finals standings with 195 total points after 15 matches, followed by Gladiators Esports and Orangutan.",
    category: "results",
    game: "BGMI",
    featured: 1,
  },
];

// ---------------------------------------------------------------------------
// Database transaction
// ---------------------------------------------------------------------------
const tx = db.transaction(() => {
  const existingTournament = db
    .prepare("SELECT id FROM tournaments WHERE name = ?")
    .get(tournament.name);

  if (existingTournament) {
    db.prepare("DELETE FROM matches WHERE tournament_id = ?").run(
      existingTournament.id,
    );
    db.prepare("DELETE FROM match_results WHERE tournament_id = ?").run(
      existingTournament.id,
    );
    db.prepare("DELETE FROM tournaments WHERE id = ?").run(
      existingTournament.id,
    );
  }

  const tournamentId = randomUUID();
  db.prepare(
    `
    INSERT INTO tournaments (
      id, name, game, tier, status, prize_pool, start_date, end_date, stages,
      description, banner_url, rules, max_teams, format_overview, calendar,
      prize_breakdown, awards, participants, rankings, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    tournamentId,
    tournament.name,
    tournament.game,
    tournament.tier,
    tournament.status,
    tournament.prize_pool,
    tournament.start_date,
    tournament.end_date,
    JSON.stringify(tournament.stages),
    tournament.description,
    tournament.banner_url,
    tournament.rules,
    tournament.max_teams,
    tournament.format_overview,
    JSON.stringify(tournament.calendar),
    JSON.stringify(tournament.prize_breakdown),
    JSON.stringify(tournament.awards),
    JSON.stringify(tournament.participants),
    JSON.stringify(tournament.rankings),
    now,
    now,
    "admin@stagecore.local",
  );

  // ---------------------------------------------------------------------------
  // Teams & Players
  // ---------------------------------------------------------------------------
  const findTeamByName = db.prepare("SELECT id FROM teams WHERE name = ?");
  const upsertTeam = db.prepare(`
    INSERT INTO teams (
      id, name, tag, logo_url, game, region, total_kills, total_points, matches_played, wins, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, tag=excluded.tag, game=excluded.game, region=excluded.region, updated_date=excluded.updated_date
  `);
  const deletePlayersByTeam = db.prepare("DELETE FROM players WHERE team_id = ?");
  const insertPlayer = db.prepare(`
    INSERT INTO players (
      id, ign, real_name, team_id, role, photo_url, total_kills, matches_played, avg_damage,
      created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const TEAM_TAGS = {
    "GodLike Esports": "GLT", Orangutan: "ORG", "Team Outrage": "TOR", "Elite Nova": "ENV",
    "Gladiators Esports": "GLD", "Apex Gaming": "APX", "Team Tamilas": "TML", "Vasista Esports": "VAS",
    "Reckoning Esports": "RCK", "Nebula Esports": "NBL", "8Bit": "8BT", "Genesis Esports": "GEN",
    "Team SouL": "TSL", "7Gods Esports": "7GD", "Revenant XSpark": "RVS", "Myth Official": "MYT",
    "Rapid Chaos": "RCH", "Epigrotive Gaming": "EPG", "Zero Ark": "ZRO", "K9 Esports": "K9",
    "Wyld Fangs": "WLF", "Quantum Sparks": "QSK", "Santa Esports": "STR", "White Walkers": "WHW",
    "HyperCatz": "HCZ", "Aura x Esports": "AUX",
  };

  const teamIds = new Map();
  for (const teamName of Object.keys(BGMS_2026_ROSTERS)) {
    const existing = findTeamByName.get(teamName);
    const teamId = existing?.id || randomUUID();
    upsertTeam.run(teamId, teamName, TEAM_TAGS[teamName] || teamName.slice(0, 3).toUpperCase(), null, "BGMI", "India", 0, 0, 0, 0, now, now, "admin@stagecore.local");
    deletePlayersByTeam.run(teamId);
    for (const ign of BGMS_2026_ROSTERS[teamName]) {
      insertPlayer.run(randomUUID(), ign, null, teamId, "Player", null, 0, 0, 0, now, now, "admin@stagecore.local");
    }
    teamIds.set(teamName, teamId);
  }

  // ---------------------------------------------------------------------------
  // Tournament Stages (required for normalize / deriveStandingsFromMatchResults)
  // ---------------------------------------------------------------------------
  const insertStage = db.prepare(`
    INSERT INTO tournament_stages (id, tournament_id, name, slug, stage_order, stage_type, status, summary, rules, map_rotation, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const stageDefs = [
    { name: "League Week 1",  slug: "lw1",  order: 1, type: "league",     status: "completed" },
    { name: "Bounty Weekend", slug: "bw",   order: 2, type: "league",     status: "completed" },
    { name: "League Week 2",  slug: "lw2",  order: 3, type: "league",     status: "completed" },
    { name: "Super Weekend 1",slug: "sw1",  order: 4, type: "super_weekend", status: "completed" },
    { name: "League Week 3",  slug: "lw3",  order: 5, type: "league",     status: "completed" },
    { name: "Super Weekend 2",slug: "sw2",  order: 6, type: "super_weekend", status: "completed" },
    { name: "Playoffs",       slug: "play", order: 7, type: "playoffs",   status: "completed" },
    { name: "Grand Finals",   slug: "gf",   order: 8, type: "grand_finals", status: "completed" },
  ];
  const stageIds = {};
  for (const def of stageDefs) {
    const stageId = randomUUID();
    stageIds[def.name] = stageId;
    insertStage.run(stageId, tournamentId, def.name, def.slug, def.order, def.type, def.status, null, null, null, now, now);
  }

  // ---------------------------------------------------------------------------
  // Matches & Results
  // ---------------------------------------------------------------------------
  const insertMatch = db.prepare(`
    INSERT INTO matches (
      id, tournament_id, stage, match_number, map, status, scheduled_time, stream_url, day, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertResult = db.prepare(`
    INSERT INTO match_results (
      id, match_id, tournament_id, team_id, placement, kill_points, placement_points, total_points, matches_count, wins_count, stage,
      created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // BGMI standard placement points
  const placementTable = {
    1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 5, 7: 4, 8: 3,
    9: 2, 10: 1, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0,
  };

  const TEAM_NAME_ALIASES = {
    "Apex Gaming": "Team Apex Gaming",
    "Elite Nova Esports": "Elite Nova",
  };
  function resolveTeamId(name) {
    return teamIds.get(TEAM_NAME_ALIASES[name] || name);
  }
  function deriveStandingFields(standing) {
    if (standing.matches != null && standing.elims != null && standing.placementPoints != null && standing.wwcd != null) {
      return { matches: standing.matches, wwcd: standing.wwcd, placementPoints: standing.placementPoints, elims: standing.elims };
    }
    const games = standing.games || [];
    const elims = games.reduce((sum, g) => sum + (g.kills || 0), 0);
    const placementPoints = games.reduce((sum, g) => sum + placementTable[g.placement] || 0, 0);
    const wwcd = games.filter((g) => g.placement === 1).length;
    return { matches: games.length, wwcd, placementPoints, elims };
  }

  // Generate League Week 1 stage match
  const lw1Id = randomUUID();
  insertMatch.run(lw1Id, tournamentId, "League Week 1", 0, "Other", "completed", null, null, 0, now, now, "admin@stagecore.local");
  for (const standing of LW1_STANDINGS) {
    const teamId = resolveTeamId(standing.team);
    if (!teamId) continue;
    insertResult.run(randomUUID(), lw1Id, tournamentId, teamId, standing.rank, standing.elims || 0, standing.placementPoints || 0, standing.totalPoints, standing.matches, standing.wwcd || 0, "League Week 1", now, now, "admin@stagecore.local");
  }

  // Generate Bounty Weekend stage match
  const bwId = randomUUID();
  insertMatch.run(bwId, tournamentId, "Bounty Weekend", 0, "Other", "completed", null, null, 0, now, now, "admin@stagecore.local");
  for (const standing of BW_STANDINGS) {
    const teamId = resolveTeamId(standing.team);
    if (!teamId) continue;
    insertResult.run(randomUUID(), bwId, tournamentId, teamId, standing.rank, standing.elims || 0, standing.placementPoints || 0, standing.totalPoints, standing.matches, standing.wwcd || 0, "Bounty Weekend", now, now, "admin@stagecore.local");
  }

  // Generate League Week 2 stage match
  const lw2Id = randomUUID();
  insertMatch.run(lw2Id, tournamentId, "League Week 2", 0, "Other", "completed", null, null, 0, now, now, "admin@stagecore.local");
  for (const standing of LW2_STANDINGS) {
    const teamId = resolveTeamId(standing.team);
    if (!teamId) continue;
    insertResult.run(randomUUID(), lw2Id, tournamentId, teamId, standing.rank, standing.elims || 0, standing.placementPoints || 0, standing.totalPoints, standing.matches, standing.wwcd || 0, "League Week 2", now, now, "admin@stagecore.local");
  }

  // Generate Super Weekend 1 stage match
  const sw1Id = randomUUID();
  insertMatch.run(sw1Id, tournamentId, "Super Weekend 1", 0, "Other", "completed", null, null, 0, now, now, "admin@stagecore.local");
  for (const standing of SW1_STANDINGS) {
    const teamId = resolveTeamId(standing.team);
    if (!teamId) continue;
    insertResult.run(randomUUID(), sw1Id, tournamentId, teamId, standing.rank, standing.elims || 0, standing.placementPoints || 0, standing.totalPoints, standing.matches, standing.wwcd || 0, "Super Weekend 1", now, now, "admin@stagecore.local");
  }

  // Generate League Week 3 stage match
  const lw3Id = randomUUID();
  insertMatch.run(lw3Id, tournamentId, "League Week 3", 0, "Other", "completed", null, null, 0, now, now, "admin@stagecore.local");
  for (const standing of LW3_STANDINGS) {
    const teamId = resolveTeamId(standing.team);
    if (!teamId) continue;
    insertResult.run(randomUUID(), lw3Id, tournamentId, teamId, standing.rank, standing.elims || 0, standing.placementPoints || 0, standing.totalPoints, standing.matches, standing.wwcd || 0, "League Week 3", now, now, "admin@stagecore.local");
  }

  // Generate Super Weekend 2 stage match
  const sw2Id = randomUUID();
  insertMatch.run(sw2Id, tournamentId, "Super Weekend 2", 0, "Other", "completed", null, null, 0, now, now, "admin@stagecore.local");
  for (const standing of SW2_STANDINGS) {
    const teamId = resolveTeamId(standing.team);
    if (!teamId) continue;
    insertResult.run(randomUUID(), sw2Id, tournamentId, teamId, standing.rank, standing.elims || 0, standing.placementPoints || 0, standing.totalPoints, standing.matches, standing.wwcd || 0, "Super Weekend 2", now, now, "admin@stagecore.local");
  }

  // Generate Playoffs stage matches
  const playoffsId = randomUUID();
  insertMatch.run(playoffsId, tournamentId, "Playoffs", 0, "Other", "completed", null, null, 0, now, now, "admin@stagecore.local");

  for (const standing of PLAYOFFS_STANDINGS) {
    const teamId = resolveTeamId(standing.team);
    if (!teamId) continue;
    const d = deriveStandingFields(standing);
    insertResult.run(randomUUID(), playoffsId, tournamentId, teamId, standing.rank, d.elims, d.placementPoints, standing.totalPoints, d.matches, d.wwcd, "Playoffs", now, now, "admin@stagecore.local");
  }

  // Generate Grand Finals stage matches
  const gfId = randomUUID();
  insertMatch.run(gfId, tournamentId, "Grand Finals", 0, "Other", "completed", null, null, 0, now, now, "admin@stagecore.local");

  for (const standing of GRAND_FINALS_STANDINGS) {
    const teamId = resolveTeamId(standing.team);
    if (!teamId) continue;
    const d = deriveStandingFields(standing);
    insertResult.run(randomUUID(), gfId, tournamentId, teamId, standing.rank, d.elims, d.placementPoints, standing.totalPoints, d.matches, d.wwcd, "Grand Finals", now, now, "admin@stagecore.local");
  }

  const deleteArticle = db.prepare("DELETE FROM news_articles WHERE title = ?");
  const insertArticle = db.prepare(`
    INSERT INTO news_articles (
      id, title, content, category, thumbnail_url, featured, game, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const article of articles) {
    deleteArticle.run(article.title);
    insertArticle.run(
      randomUUID(),
      article.title,
      article.content,
      article.category,
      null,
      article.featured,
      article.game,
      now,
      now,
      "admin@stagecore.local",
    );
  }
});

tx();

console.log(
  "✅ Imported BGMI Masters Series Season 5 tournament with all 26 teams, 8 stages, league/SW/playoffs/grand finals results, and 2 news articles.",
);

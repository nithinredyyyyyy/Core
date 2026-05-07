import { randomUUID } from "node:crypto";
import { db, recomputeTeamStats } from "../db.js";

const now = new Date().toISOString();

function normalizeRole(role) {
  if (role === "IGL" || role === "Assaulter" || role === "Filter" || role === "Support") return role;
  return "Assaulter";
}

const tournament = {
  name: "Battlegrounds Mobile India Series 2026",
  game: "BGMI",
  tier: "A-Tier",
  status: "completed",
  prize_pool: "₹4,00,00,000",
  start_date: "2026-01-26",
  end_date: "2026-03-29",
  max_teams: 1024,
  banner_url: "/images/bgis2026-banner-1920.png",
  description:
    "Battlegrounds Mobile India Series 2026 is the fifth edition of BGIS, organized by KRAFTON with a total prize pool of ₹4,00,00,000 INR. The event ran from January 26 to March 29, 2026, beginning with a 1024-team League Stage and concluding with the Chennai Grand Finals won by IQOO SouL.",
  rules:
    "Match scoring points distribution: 1st 10, 2nd 6, 3rd 5, 4th 4, 5th 3, 6th 2, 7th-8th 1, 9th-16th 0. Elimination points: 1 point per elimination. Tiebreaker order: total WWCDs, total placement points, total elimination points, then the best placement ranking in the most recent match.",
  format_overview:
    "League Stage: Jan 26th - Mar 8th, 2026. The tournament flowed from Round 1 to Round 4, then Quarter Finals, Wildcard, Semi Finals, Survival Stage, and Grand Finals.",
  calendar: [
    { week: "Jan 26 - Feb 1", label: "Round 1" },
    { week: "Feb 5 - Feb 8", label: "Round 2" },
    { week: "Feb 12 - Feb 15", label: "Round 3" },
    { week: "Feb 19 - Feb 22", label: "Round 4" },
    { week: "Feb 26 - Mar 1", label: "Quarter Finals" },
    { week: "Mar 5 - Mar 8", label: "Wildcard" },
    { week: "Mar 12 - Mar 15", label: "Semi Finals" },
    { week: "Mar 16 - Mar 17", label: "Survival Stage" },
    { week: "Mar 27 - Mar 29", label: "Grand Finals" },
  ],
  prize_breakdown: [
    { placement: "1st", team: "IQOO SouL", inr: "10,000,000", usd: "105,504.70" },
    { placement: "2nd", team: "Genesis Esports", inr: "5,000,000", usd: "52,752.35" },
    { placement: "3rd", team: "IQOO Orangutan", inr: "3,500,000", usd: "36,926.65" },
    { placement: "4th", team: "Victores Sumus", inr: "2,500,000", usd: "26,376.18" },
    { placement: "5th", team: "Hero Xtreme GodLike", inr: "2,050,000", usd: "21,628.46" },
    { placement: "6th", team: "K9 Esports", inr: "1,600,000", usd: "16,880.75" },
    { placement: "7th", team: "IQOO Revenant XSpark", inr: "1,400,000", usd: "14,770.66" },
    { placement: "8th", team: "Wyld Fangs", inr: "1,400,000", usd: "14,770.66" },
    { placement: "9th", team: "Vasista Esports", inr: "1,150,000", usd: "12,133.04" },
    { placement: "10th", team: "Nebula Esports", inr: "1,150,000", usd: "12,133.04" },
    { placement: "11th", team: "Learn From Past", inr: "1,000,000", usd: "10,550.47" },
    { placement: "12th", team: "Meta Ninza", inr: "1,000,000", usd: "10,550.47" },
    { placement: "13th", team: "Myth Official", inr: "900,000", usd: "9,495.42" },
    { placement: "14th", team: "IQOO Reckoning Esports", inr: "900,000", usd: "9,495.42" },
    { placement: "15th", team: "IQOO Team Tamilas", inr: "800,000", usd: "8,440.38" },
    { placement: "16th", team: "Welt Esports", inr: "800,000", usd: "8,440.38" },
    { placement: "17th", team: "EvoX Esports", inr: "550,000", usd: "5,802.76" },
    { placement: "18th", team: "NONx Esports", inr: "550,000", usd: "5,802.76" },
    { placement: "19th", team: "Sinewy Esports", inr: "500,000", usd: "5,275.24" },
    { placement: "20th", team: "Phoenix Esports", inr: "500,000", usd: "5,275.24" },
    { placement: "21st", team: "Troy Tamilan Esports", inr: "500,000", usd: "5,275.24" },
    { placement: "22nd", team: "4 Wolf x DOD", inr: "500,000", usd: "5,275.24" },
    { placement: "23rd", team: "MadKings", inr: "400,000", usd: "4,220.19" },
    { placement: "24th", team: "Team Vanguard", inr: "400,000", usd: "4,220.19" },
  ],
  awards: [
    { title: "MVP", player: "HunterZ", team: "Genesis Esports", country: "India", inr: "300,000", usd: "3,165.14" },
    { title: "Finals MVP", player: "LEGIT", team: "IQOO SouL", country: "India", inr: "150,000", usd: "1,582.57" },
    { title: "Best IGL", player: "NakuL", team: "IQOO SouL", country: "India", inr: "200,000", usd: "2,110.09" },
    { title: "Emerging Star", player: "Detrox", team: "Myth Official", country: "India", inr: "100,000", usd: "1,055.05" },
    { title: "Best Clutch", player: "Termi", team: "Learn From Past", country: "India", inr: "100,000", usd: "1,055.05" },
    { title: "Fan Favorite Team", player: "Team Award", team: "IQOO SouL", country: "", inr: "100,000", usd: "1,055.05" },
  ],
  participants: [
    { placement: 1, team: "EvoX Esports", phase: "Quarter Finals", players: ["Kaalan", "Evil", "ShaDow", "SpyOp", "Tonyy"] },
    { placement: 2, team: "IQOO SouL", phase: "Quarter Finals", players: ["NakuL", "Goblin", "LEGIT", "Jokerr", "Thunder"] },
    { placement: 3, team: "Meta Ninza", phase: "Quarter Finals", players: ["Shadow7", "Fierce", "Apollo", "WhiteTiger", "Javin"] },
    { placement: 4, team: "IQOO Orangutan", phase: "Quarter Finals", players: ["AK", "Aaru", "Attanki", "WizzGOD"] },
    { placement: 5, team: "4 Wolf x DOD", phase: "Quarter Finals", players: ["IMMORTAL", "AVNISHOP", "BHAALU", "NooB", "PIXIEOP"] },
    { placement: 6, team: "MadKings", phase: "Quarter Finals", players: ["SHADOW", "ClutchGod", "Syrax", "PRO"] },
    { placement: 7, team: "Sinewy Esports", phase: "Quarter Finals", players: ["Moksh", "Vishu99", "Ninjuu", "Rexboy", "NinjA"] },
    { placement: 8, team: "Genesis Esports", phase: "Quarter Finals", players: ["ViPER", "GravityJOD", "HunterZ", "FurY", "Zap"] },
    { placement: 9, team: "IQOO Team Tamilas", phase: "Quarter Finals", players: ["AIMGOD", "FoxOP", "MrIGL", "Reaper"] },
    { placement: 10, team: "Troy Tamilan Esports", phase: "Quarter Finals", players: ["Auxin", "Ayden", "Lens77", "Hesperos", "Jazzy"] },
    { placement: 11, team: "Vasista Esports", phase: "Quarter Finals", players: ["Beast", "FusionOP", "Hector", "Saumay", "Shayaan"] },
    { placement: 12, team: "Hero Xtreme GodLike", phase: "Quarter Finals", players: ["Spower", "ADMINO", "Godz", "JONATHAN", "Manya"] },
    { placement: 13, team: "Wyld Fangs", phase: "Quarter Finals", players: ["SPRAYGOD", "Goten", "Kanha", "SENSEI", "Sam999"] },
    { placement: 14, team: "IQOO Revenant XSpark", phase: "Quarter Finals", players: ["NinjaJOD", "JDGamingYT", "Pain09", "Punkk", "Tracegod"] },
    { placement: 15, team: "Welt Esports", phase: "Quarter Finals", players: ["GokulWNL", "Proton", "Maxioso", "Shyam", "JustyOp"] },
    { placement: 16, team: "Learn From Past", phase: "Quarter Finals", players: ["Termi", "RushBoy", "MAX", "Honey", "SHADOWW"] },
    { placement: 17, team: "Nebula Esports", phase: "Wildcard", players: ["Aadi", "KnowMe", "KRATOS", "Phoenix", "Ryu"] },
    { placement: 18, team: "Team Vanguard", phase: "Wildcard", players: ["DreamS", "Insidious", "Dionysus", "Crypto", "AnujTooOP"] },
    { placement: 19, team: "NONx Esports", phase: "Wildcard", players: ["AimGoD", "Anonymous", "Arther", "FAMEeeeee", "Rapido"] },
    { placement: 20, team: "K9 Esports", phase: "Wildcard", players: ["Knight", "NinjaBoi", "Omega", "RyzenBOTX", "Slug"] },
    { placement: 21, team: "Victores Sumus", phase: "Wildcard", players: ["Owais", "Mafia36", "VeNoM", "ScaryJod", "Sarang"] },
    { placement: 22, team: "Phoenix Esports", phase: "Wildcard", players: ["Saumraj", "SIMP", "Smoker46", "Stranger", "VipeR"] },
    { placement: 23, team: "IQOO Reckoning Esports", phase: "Wildcard", players: ["Godx", "Levi", "Lovish", "Roman", "SahilOPAF"] },
    { placement: 24, team: "Myth Official", phase: "Wildcard", players: ["Harshil", "Lucifer", "Daddy", "Detrox", "Aryton"] },
  ],
  rankings: [
    {
      title: "BGIS MVP",
      entries: [
        { placement: 1, player: "HunterZ", team: "Genesis Esports", rating: 1.61, finishes: 94, damage: 17382, avgSurvival: "21:39", knocks: 75 },
        { placement: 2, player: "LEGIT", team: "IQOO SouL", rating: 1.57, finishes: 86, damage: 18006, avgSurvival: "21:30", knocks: 82 },
        { placement: 3, player: "Jokerr", team: "IQOO SouL", rating: 1.49, finishes: 76, damage: 17875, avgSurvival: "21:56", knocks: 86 },
        { placement: 4, player: "Goblin", team: "IQOO SouL", rating: 1.42, finishes: 76, damage: 15825, avgSurvival: "20:51", knocks: 84 },
        { placement: 5, player: "AKop", team: "IQOO Orangutan", rating: 1.36, finishes: 73, damage: 15701, avgSurvival: "20:56", knocks: 72 },
      ],
    },
    {
      title: "BGIS FMVP",
      entries: [
        { placement: 1, player: "LEGIT", team: "IQOO SouL", rating: 2.69, finishes: 38, damage: 7346, avgSurvival: "21:38", knocks: 34 },
        { placement: 2, player: "HunterZ", team: "Genesis Esports", rating: 2.66, finishes: 40, damage: 6895, avgSurvival: "21:01", knocks: 29 },
        { placement: 3, player: "Pain09", team: "IQOO Revenant XSpark", rating: 2.59, finishes: 34, damage: 7435, avgSurvival: "20:17", knocks: 40 },
        { placement: 4, player: "Goblin", team: "IQOO SouL", rating: 2.51, finishes: 35, damage: 6427, avgSurvival: "21:10", knocks: 38 },
        { placement: 5, player: "Mafia36", team: "Victores Sumus", rating: 2.37, finishes: 33, damage: 6472, avgSurvival: "21:53", knocks: 27 },
      ],
    },
    {
      title: "Best IGL",
      entries: [
        { placement: 1, player: "NakuL", team: "IQOO SouL", rating: 1.78, avgPoints: 10.3, wwcd: 6, top5s: 18, teamSurvival: "21:26" },
        { placement: 2, player: "GravityJOD", team: "Genesis Esports", rating: 1.57, avgPoints: 9.3, wwcd: 5, top5s: 16, teamSurvival: "20:43" },
        { placement: 3, player: "Honey", team: "Learn From Past", rating: 1.50, avgPoints: 7.0, wwcd: 3, top5s: 17, teamSurvival: "20:21" },
        { placement: 4, player: "Aaru", team: "IQOO Orangutan", rating: 1.46, avgPoints: 8.6, wwcd: 5, top5s: 15, teamSurvival: "20:46" },
        { placement: 5, player: "ShaDow", team: "EvoX Esports", rating: 1.46, avgPoints: 7.8, wwcd: 1, top5s: 10, teamSurvival: "20:22" },
      ],
    },
  ],
  stages: [
    {
      name: "Round 1",
      order: 1,
      status: "completed",
      teamCount: 1024,
      summary:
        "Round 1: Jan 26th - Feb 1st, 2026. 1024 teams played across 8 matchdays, with 1016 teams from in-game qualifiers and the bottom 8 teams from The Grind Group D. Teams were split into 64 groups of 16, each team played 6 matches, and 496 teams advanced to Round 2.",
    },
    {
      name: "Round 2",
      order: 2,
      status: "completed",
      teamCount: 512,
      summary:
        "Round 2: Feb 5th - 8th, 2026. 512 teams played across 4 matchdays: 496 teams from Round 1, the top 8 from The Grind Group D, and the bottom 8 from The Grind Group C. Teams were split into 32 groups of 16, each team played 6 matches, and 240 teams advanced to Round 3.",
    },
    {
      name: "Round 3",
      order: 3,
      status: "completed",
      teamCount: 256,
      summary:
        "Round 3: Feb 12th - 15th, 2026. 256 teams played across 4 matchdays: 240 teams from Round 2, the top 8 from The Grind Group C, and the bottom 8 from The Grind Group B. Teams were split into 16 groups of 16, each team played 6 matches, and 112 teams advanced to Round 4.",
    },
    {
      name: "Round 4",
      order: 4,
      status: "completed",
      teamCount: 128,
      summary:
        "Round 4: Feb 19th - 22nd, 2026. 128 teams played across 4 matchdays: 112 teams from Round 3, the top 8 from The Grind Group B, and the bottom 8 from The Grind Group A. Teams were split into 8 groups of 16, each team played 6 matches, 56 teams reached Quarter Finals, and the top 8 remaining teams advanced to Wildcard.",
    },
      {
        name: "Quarter Finals",
        order: 5,
        status: "completed",
        teamCount: 64,
        summary: "Quarter Finals: Feb 26th - Mar 1st, 2026. 64 teams, 4 matchdays. 56 teams from Round 4 and the top 8 teams from The Grind Group A were divided into 4 groups of 16. Each team played 6 matches. The top 16 teams in the cumulative standings advanced to Semi Finals, while 17th-40th moved to Wildcard.",
      standings: [
        { placement: 1, team: "EvoX Esports", grp: "C", matches: 6, wwcd: 0, pos: 22, elimins: 48, points: 70, outcome: "Semi Finals" },
        { placement: 2, team: "IQOO SouL", grp: "C", matches: 6, wwcd: 1, pos: 15, elimins: 50, points: 65, outcome: "Semi Finals" },
        { placement: 3, team: "Meta Ninza", grp: "D", matches: 6, wwcd: 2, pos: 26, elimins: 38, points: 64, outcome: "Semi Finals" },
        { placement: 4, team: "IQOO Orangutan", grp: "C", matches: 6, wwcd: 1, pos: 25, elimins: 38, points: 63, outcome: "Semi Finals" },
        { placement: 5, team: "4 Wolf x DOD", grp: "B", matches: 6, wwcd: 0, pos: 24, elimins: 39, points: 63, outcome: "Semi Finals" },
        { placement: 6, team: "MadKings", grp: "D", matches: 6, wwcd: 1, pos: 22, elimins: 38, points: 60, outcome: "Semi Finals" },
        { placement: 7, team: "Sinewy Esports", grp: "A", matches: 6, wwcd: 0, pos: 24, elimins: 36, points: 60, outcome: "Semi Finals" },
        { placement: 8, team: "Genesis Esports", grp: "B", matches: 6, wwcd: 1, pos: 15, elimins: 44, points: 59, outcome: "Semi Finals" },
        { placement: 9, team: "IQOO Team Tamilas", grp: "A", matches: 6, wwcd: 1, pos: 24, elimins: 34, points: 58, outcome: "Semi Finals" },
        { placement: 10, team: "Troy Tamilan Esports", grp: "C", matches: 6, wwcd: 1, pos: 20, elimins: 37, points: 57, outcome: "Semi Finals" },
        { placement: 11, team: "Vasista Esports", grp: "C", matches: 6, wwcd: 2, pos: 28, elimins: 28, points: 56, outcome: "Semi Finals" },
        { placement: 12, team: "Hero Xtreme GodLike", grp: "D", matches: 6, wwcd: 1, pos: 15, elimins: 41, points: 56, outcome: "Semi Finals" },
        { placement: 13, team: "Wyld Fangs", grp: "A", matches: 6, wwcd: 1, pos: 15, elimins: 37, points: 52, outcome: "Semi Finals" },
        { placement: 14, team: "IQOO Revenant XSpark", grp: "B", matches: 6, wwcd: 1, pos: 14, elimins: 37, points: 51, outcome: "Semi Finals" },
        { placement: 15, team: "Welt Esports", grp: "B", matches: 6, wwcd: 1, pos: 13, elimins: 36, points: 49, outcome: "Semi Finals" },
        { placement: 16, team: "Learn From Past", grp: "C", matches: 6, wwcd: 1, pos: 17, elimins: 27, points: 44, outcome: "Semi Finals" },
        { placement: 17, team: "Inimicals Esports", grp: "B", matches: 6, wwcd: 1, pos: 13, elimins: 30, points: 43, outcome: "Wildcard" },
        { placement: 18, team: "Kalinga Esports", grp: "C", matches: 6, wwcd: 0, pos: 19, elimins: 24, points: 43, outcome: "Wildcard" },
        { placement: 19, team: "Victores Sumus", grp: "A", matches: 6, wwcd: 1, pos: 10, elimins: 32, points: 42, outcome: "Wildcard" },
        { placement: 20, team: "ORB Esports", grp: "B", matches: 6, wwcd: 0, pos: 16, elimins: 26, points: 42, outcome: "Wildcard" },
        { placement: 21, team: "RedForce Esports", grp: "A", matches: 6, wwcd: 0, pos: 10, elimins: 32, points: 42, outcome: "Wildcard" },
        { placement: 22, team: "Frostrex Esports", grp: "D", matches: 6, wwcd: 0, pos: 17, elimins: 24, points: 41, outcome: "Wildcard" },
        { placement: 23, team: "Infinix True Rippers", grp: "A", matches: 6, wwcd: 1, pos: 16, elimins: 24, points: 40, outcome: "Wildcard" },
        { placement: 24, team: "Nebula Esports", grp: "D", matches: 6, wwcd: 0, pos: 7, elimins: 33, points: 40, outcome: "Wildcard" },
          { placement: 25, team: "Blind Rippers", grp: "A", matches: 6, wwcd: 1, pos: 19, elimins: 20, points: 39, outcome: "Wildcard" },
          { placement: 26, team: "K9 Esports", grp: "D", matches: 6, wwcd: 1, pos: 12, elimins: 26, points: 38, outcome: "Wildcard" },
          { placement: 27, team: "Phoenix Esports", grp: "A", matches: 6, wwcd: 0, pos: 13, elimins: 25, points: 38, outcome: "Wildcard" },
          { placement: 28, team: "Windgod Esports", grp: "B", matches: 6, wwcd: 1, pos: 11, elimins: 26, points: 37, outcome: "Wildcard" },
          { placement: 29, team: "Riotnationz", grp: "D", matches: 6, wwcd: 0, pos: 18, elimins: 18, points: 36, outcome: "Wildcard" },
          { placement: 30, team: "Gods For Reason", grp: "B", matches: 6, wwcd: 0, pos: 12, elimins: 24, points: 36, outcome: "Wildcard" },
          { placement: 31, team: "M4 x Naqsh Esports", grp: "A", matches: 6, wwcd: 1, pos: 15, elimins: 20, points: 35, outcome: "Wildcard" },
          { placement: 32, team: "Tenzen Esports", grp: "B", matches: 6, wwcd: 1, pos: 14, elimins: 21, points: 35, outcome: "Wildcard" },
          { placement: 33, team: "Higg Boson Esports", grp: "D", matches: 6, wwcd: 0, pos: 4, elimins: 30, points: 34, outcome: "Wildcard" },
          { placement: 34, team: "GENxFM Esports", grp: "D", matches: 6, wwcd: 0, pos: 11, elimins: 22, points: 33, outcome: "Wildcard" },
          { placement: 35, team: "T7 Esports", grp: "B", matches: 6, wwcd: 0, pos: 12, elimins: 20, points: 32, outcome: "Wildcard" },
          { placement: 36, team: "7AcesxTRB Esports", grp: "A", matches: 6, wwcd: 0, pos: 10, elimins: 22, points: 32, outcome: "Wildcard" },
          { placement: 37, team: "IQOO Reckoning Esports", grp: "A", matches: 6, wwcd: 0, pos: 11, elimins: 20, points: 31, outcome: "Wildcard" },
          { placement: 38, team: "Team H4K", grp: "D", matches: 6, wwcd: 1, pos: 13, elimins: 17, points: 30, outcome: "Wildcard" },
          { placement: 39, team: "Lastade Esports", grp: "C", matches: 6, wwcd: 0, pos: 14, elimins: 16, points: 30, outcome: "Wildcard" },
          { placement: 40, team: "Myth Official", grp: "B", matches: 6, wwcd: 0, pos: 12, elimins: 18, points: 30, outcome: "Wildcard" },
        { placement: 41, team: "Team Alpha", grp: "A", matches: 6, wwcd: 0, pos: 3, elimins: 26, points: 29, outcome: "Eliminated" },
        { placement: 42, team: "Rising Esports", grp: "D", matches: 6, wwcd: 0, pos: 13, elimins: 15, points: 28, outcome: "Eliminated" },
        { placement: 43, team: "Godz Official", grp: "D", matches: 6, wwcd: 0, pos: 11, elimins: 17, points: 28, outcome: "Eliminated" },
        { placement: 44, team: "Rapid Chaos Esports", grp: "C", matches: 6, wwcd: 0, pos: 8, elimins: 20, points: 28, outcome: "Eliminated" },
        { placement: 45, team: "Sovereign Esports", grp: "D", matches: 6, wwcd: 0, pos: 4, elimins: 24, points: 28, outcome: "Eliminated" },
        { placement: 46, team: "4TR Official", grp: "B", matches: 6, wwcd: 0, pos: 9, elimins: 18, points: 27, outcome: "Eliminated" },
        { placement: 47, team: "Esport Social", grp: "D", matches: 6, wwcd: 0, pos: 4, elimins: 22, points: 26, outcome: "Eliminated" },
        { placement: 48, team: "Team AX", grp: "C", matches: 6, wwcd: 0, pos: 8, elimins: 17, points: 25, outcome: "Eliminated" },
        { placement: 49, team: "Team Altitude", grp: "B", matches: 6, wwcd: 0, pos: 7, elimins: 18, points: 25, outcome: "Eliminated" },
        { placement: 50, team: "Aura Esports", grp: "A", matches: 6, wwcd: 0, pos: 5, elimins: 20, points: 25, outcome: "Eliminated" },
        { placement: 51, team: "Ruffians", grp: "B", matches: 6, wwcd: 0, pos: 12, elimins: 12, points: 24, outcome: "Eliminated" },
        { placement: 52, team: "Oishani Esports", grp: "D", matches: 6, wwcd: 0, pos: 9, elimins: 15, points: 24, outcome: "Eliminated" },
        { placement: 53, team: "Team Doxy", grp: "B", matches: 6, wwcd: 0, pos: 6, elimins: 17, points: 23, outcome: "Eliminated" },
        { placement: 54, team: "Team Sungodnika Esports", grp: "A", matches: 6, wwcd: 0, pos: 11, elimins: 10, points: 21, outcome: "Eliminated" },
        { placement: 55, team: "Oops Official", grp: "C", matches: 6, wwcd: 0, pos: 6, elimins: 14, points: 20, outcome: "Eliminated" },
        { placement: 56, team: "Vajra Esports", grp: "A", matches: 6, wwcd: 0, pos: 1, elimins: 19, points: 20, outcome: "Eliminated" },
        { placement: 57, team: "Autobotz Esports", grp: "A", matches: 6, wwcd: 0, pos: 5, elimins: 14, points: 19, outcome: "Eliminated" },
        { placement: 58, team: "Crescent Wolf Esports", grp: "C", matches: 6, wwcd: 0, pos: 5, elimins: 13, points: 18, outcome: "Eliminated" },
        { placement: 59, team: "VST", grp: "C", matches: 6, wwcd: 0, pos: 3, elimins: 15, points: 18, outcome: "Eliminated" },
        { placement: 60, team: "5 Comets", grp: "C", matches: 6, wwcd: 0, pos: 1, elimins: 16, points: 17, outcome: "Eliminated" },
        { placement: 61, team: "Empire Originals", grp: "D", matches: 6, wwcd: 0, pos: 6, elimins: 10, points: 16, outcome: "Eliminated" },
        { placement: 62, team: "OnePlus Gods Reign", grp: "C", matches: 6, wwcd: 0, pos: 1, elimins: 14, points: 15, outcome: "Eliminated" },
        { placement: 63, team: "4EC Esports", grp: "C", matches: 6, wwcd: 0, pos: 0, elimins: 14, points: 14, outcome: "Eliminated" },
        { placement: 64, team: "Born from Ashes", grp: "B", matches: 6, wwcd: 0, pos: 2, elimins: 8, points: 10, outcome: "Eliminated" },
      ],
    },
      {
        name: "Wildcard",
        order: 6,
        status: "completed",
        teamCount: 32,
        summary: "Wildcard: Mar 5th - 8th, 2026. 32 teams, 4 matchdays. 24 teams came from Quarter Finals and 8 teams from Round 4. Teams were divided into 4 groups with 8 teams each and played a 12-match round-robin. The top 8 in the cumulative standings advanced to Semi Finals.",
      standings: [
        { placement: 1, team: "Nebula Esports", grp: "A", matches: 12, wwcd: 3, pos: 47, elimins: 102, points: 149, outcome: "Semi Finals" },
        { placement: 2, team: "Team Vanguard", grp: "B", matches: 12, wwcd: 3, pos: 47, elimins: 65, points: 112, outcome: "Semi Finals" },
        { placement: 3, team: "NONx Esports", grp: "A", matches: 12, wwcd: 0, pos: 38, elimins: 70, points: 108, outcome: "Semi Finals" },
        { placement: 4, team: "K9 Esports", grp: "B", matches: 12, wwcd: 2, pos: 36, elimins: 71, points: 107, outcome: "Semi Finals" },
        { placement: 5, team: "Victores Sumus", grp: "C", matches: 12, wwcd: 1, pos: 35, elimins: 72, points: 107, outcome: "Semi Finals" },
        { placement: 6, team: "Phoenix Esports", grp: "C", matches: 12, wwcd: 2, pos: 38, elimins: 68, points: 106, outcome: "Semi Finals" },
        { placement: 7, team: "IQOO Reckoning Esports", grp: "D", matches: 12, wwcd: 2, pos: 40, elimins: 65, points: 105, outcome: "Semi Finals" },
        { placement: 8, team: "Myth Official", grp: "A", matches: 12, wwcd: 2, pos: 35, elimins: 70, points: 105, outcome: "Semi Finals" },
        { placement: 9, team: "Infinix True Rippers", grp: "B", matches: 12, wwcd: 2, pos: 30, elimins: 72, points: 102, outcome: "Eliminated" },
        { placement: 10, team: "IQOO 8Bit", grp: "D", matches: 12, wwcd: 1, pos: 36, elimins: 62, points: 98, outcome: "Eliminated" },
        { placement: 11, team: "Riotnationz", grp: "D", matches: 12, wwcd: 1, pos: 26, elimins: 72, points: 98, outcome: "Eliminated" },
        { placement: 12, team: "Kalinga Esports", grp: "B", matches: 12, wwcd: 0, pos: 38, elimins: 53, points: 91, outcome: "Eliminated" },
        { placement: 13, team: "Gods For Reason", grp: "C", matches: 12, wwcd: 1, pos: 20, elimins: 65, points: 85, outcome: "Eliminated" },
        { placement: 14, team: "Lastade Esports", grp: "B", matches: 12, wwcd: 0, pos: 33, elimins: 50, points: 83, outcome: "Eliminated" },
        { placement: 15, team: "Team H4K", grp: "C", matches: 12, wwcd: 1, pos: 27, elimins: 55, points: 82, outcome: "Eliminated" },
        { placement: 16, team: "RedForce Esports", grp: "D", matches: 12, wwcd: 1, pos: 26, elimins: 56, points: 82, outcome: "Eliminated" },
        { placement: 17, team: "Higg Boson Esports", grp: "A", matches: 12, wwcd: 1, pos: 28, elimins: 43, points: 71, outcome: "Eliminated" },
        { placement: 18, team: "Tenzen Esports", grp: "A", matches: 12, wwcd: 0, pos: 24, elimins: 47, points: 71, outcome: "Eliminated" },
        { placement: 19, team: "Windgod Esports", grp: "D", matches: 12, wwcd: 1, pos: 23, elimins: 44, points: 67, outcome: "Eliminated" },
        { placement: 20, team: "Inimicals Esports", grp: "A", matches: 12, wwcd: 0, pos: 5, elimins: 47, points: 52, outcome: "Eliminated" },
        { placement: 21, team: "T7 Esports", grp: "C", matches: 12, wwcd: 0, pos: 23, elimins: 28, points: 51, outcome: "Eliminated" },
        { placement: 22, team: "Frostrex Esports", grp: "C", matches: 12, wwcd: 0, pos: 22, elimins: 22, points: 44, outcome: "Eliminated" },
        { placement: 23, team: "ORB Esports", grp: "D", matches: 12, wwcd: 0, pos: 3, elimins: 41, points: 44, outcome: "Eliminated" },
        { placement: 24, team: "Blink Esports", grp: "C", matches: 12, wwcd: 0, pos: 14, elimins: 28, points: 42, outcome: "Eliminated" },
        { placement: 25, team: "Blind Rippers", grp: "A", matches: 12, wwcd: 0, pos: 12, elimins: 30, points: 42, outcome: "Eliminated" },
        { placement: 26, team: "7AcesxTRB Esports", grp: "D", matches: 12, wwcd: 0, pos: 9, elimins: 33, points: 42, outcome: "Eliminated" },
        { placement: 27, team: "GENxFM Esports", grp: "B", matches: 12, wwcd: 0, pos: 15, elimins: 25, points: 40, outcome: "Eliminated" },
        { placement: 28, team: "Team Aesthetic", grp: "A", matches: 12, wwcd: 0, pos: 7, elimins: 33, points: 40, outcome: "Eliminated" },
        { placement: 29, team: "M4 x Naqsh Esports", grp: "B", matches: 12, wwcd: 0, pos: 3, elimins: 37, points: 40, outcome: "Eliminated" },
        { placement: 30, team: "Thundergods Esports", grp: "D", matches: 12, wwcd: 0, pos: 15, elimins: 23, points: 38, outcome: "Eliminated" },
        { placement: 31, team: "PCUP Esports", grp: "B", matches: 12, wwcd: 0, pos: 8, elimins: 21, points: 29, outcome: "Eliminated" },
        { placement: 32, team: "TRX Esports", grp: "C", matches: 12, wwcd: 0, pos: 5, elimins: 24, points: 29, outcome: "Eliminated" },
      ],
    },
      {
        name: "Semi Finals",
        order: 7,
        status: "completed",
        teamCount: 24,
        summary: "Semi Finals: Mar 12th - 15th, 2026 at Sandhya Convention Center, Hyderabad. 24 teams, 4 matchdays. 16 teams came from Quarter Finals and 8 from Wildcard. Teams were divided into 3 groups of 8 and played a 16-match double round-robin. The top 8 advanced to Grand Finals and the remaining 16 moved to Survival Stage.",
        standings: [
          { placement: 1, team: "IQOO SouL", grp: "C", matches: 16, wwcd: 3, pos: 56, elimins: 116, points: 172, outcome: "Grand Finals" },
          { placement: 2, team: "IQOO Orangutan", grp: "B", matches: 16, wwcd: 2, pos: 48, elimins: 102, points: 150, outcome: "Grand Finals" },
          { placement: 3, team: "Genesis Esports", grp: "B", matches: 16, wwcd: 2, pos: 41, elimins: 102, points: 143, outcome: "Grand Finals" },
          { placement: 4, team: "Learn From Past", grp: "B", matches: 16, wwcd: 2, pos: 52, elimins: 85, points: 137, outcome: "Grand Finals" },
          { placement: 5, team: "IQOO Reckoning Esports", grp: "A", matches: 16, wwcd: 2, pos: 33, elimins: 96, points: 129, outcome: "Grand Finals" },
          { placement: 6, team: "IQOO Revenant XSpark", grp: "C", matches: 16, wwcd: 3, pos: 42, elimins: 74, points: 116, outcome: "Grand Finals" },
          { placement: 7, team: "Victores Sumus", grp: "C", matches: 16, wwcd: 1, pos: 47, elimins: 65, points: 112, outcome: "Grand Finals" },
          { placement: 8, team: "Meta Ninza", grp: "B", matches: 16, wwcd: 1, pos: 38, elimins: 74, points: 112, outcome: "Grand Finals" },
          { placement: 9, team: "Vasista Esports", grp: "C", matches: 16, wwcd: 1, pos: 39, elimins: 69, points: 108, outcome: "Survival Stage" },
          { placement: 10, team: "NONx Esports", grp: "C", matches: 16, wwcd: 0, pos: 28, elimins: 80, points: 108, outcome: "Survival Stage" },
          { placement: 11, team: "Hero Xtreme GodLike", grp: "A", matches: 16, wwcd: 0, pos: 34, elimins: 71, points: 105, outcome: "Survival Stage" },
          { placement: 12, team: "Troy Tamilan Esports", grp: "A", matches: 16, wwcd: 3, pos: 46, elimins: 58, points: 104, outcome: "Survival Stage" },
          { placement: 13, team: "Myth Official", grp: "A", matches: 16, wwcd: 1, pos: 35, elimins: 68, points: 103, outcome: "Survival Stage" },
          { placement: 14, team: "EvoX Esports", grp: "A", matches: 16, wwcd: 1, pos: 28, elimins: 73, points: 101, outcome: "Survival Stage" },
          { placement: 15, team: "Nebula Esports", grp: "A", matches: 16, wwcd: 1, pos: 22, elimins: 67, points: 89, outcome: "Survival Stage" },
          { placement: 16, team: "IQOO Team Tamilas", grp: "C", matches: 16, wwcd: 1, pos: 26, elimins: 62, points: 88, outcome: "Survival Stage" },
          { placement: 17, team: "Wyld Fangs", grp: "A", matches: 16, wwcd: 0, pos: 22, elimins: 64, points: 86, outcome: "Survival Stage" },
          { placement: 18, team: "Team Vanguard", grp: "C", matches: 16, wwcd: 0, pos: 21, elimins: 63, points: 84, outcome: "Survival Stage" },
          { placement: 19, team: "Phoenix Esports", grp: "B", matches: 16, wwcd: 0, pos: 24, elimins: 53, points: 77, outcome: "Survival Stage" },
          { placement: 20, team: "Sinewy Esports", grp: "B", matches: 16, wwcd: 0, pos: 23, elimins: 44, points: 67, outcome: "Survival Stage" },
          { placement: 21, team: "K9 Esports", grp: "B", matches: 16, wwcd: 0, pos: 17, elimins: 48, points: 65, outcome: "Survival Stage" },
          { placement: 22, team: "Welt Esports", grp: "C", matches: 16, wwcd: 0, pos: 10, elimins: 51, points: 61, outcome: "Survival Stage" },
          { placement: 23, team: "MadKings", grp: "A", matches: 16, wwcd: 0, pos: 20, elimins: 40, points: 60, outcome: "Survival Stage" },
          { placement: 24, team: "4 Wolf x DOD", grp: "B", matches: 16, wwcd: 0, pos: 16, elimins: 26, points: 42, outcome: "Survival Stage" },
        ],
      },
      {
        name: "Survival Stage",
        order: 8,
        status: "completed",
        teamCount: 16,
        summary: "Survival Stage: Mar 16th - 17th, 2026 at Sandhya Convention Center, Hyderabad. 16 teams, 2 matchdays, 12 matches total with 6 each day. The top 8 teams advanced to Grand Finals.",
        standings: [
          { placement: 1, team: "Hero Xtreme GodLike", matches: 12, wwcd: 0, pos: 37, elimins: 71, points: 108, outcome: "Grand Finals" },
          { placement: 2, team: "Welt Esports", matches: 12, wwcd: 2, pos: 36, elimins: 59, points: 95, outcome: "Grand Finals" },
          { placement: 3, team: "Nebula Esports", matches: 12, wwcd: 1, pos: 23, elimins: 69, points: 92, outcome: "Grand Finals" },
          { placement: 4, team: "Myth Official", matches: 12, wwcd: 2, pos: 34, elimins: 55, points: 89, outcome: "Grand Finals" },
          { placement: 5, team: "Wyld Fangs", matches: 12, wwcd: 1, pos: 25, elimins: 61, points: 86, outcome: "Grand Finals" },
          { placement: 6, team: "K9 Esports", matches: 12, wwcd: 0, pos: 18, elimins: 67, points: 85, outcome: "Grand Finals" },
          { placement: 7, team: "IQOO Team Tamilas", matches: 12, wwcd: 1, pos: 26, elimins: 53, points: 79, outcome: "Grand Finals" },
          { placement: 8, team: "Vasista Esports", matches: 12, wwcd: 2, pos: 30, elimins: 47, points: 77, outcome: "Grand Finals" },
          { placement: 9, team: "EvoX Esports", matches: 12, wwcd: 2, pos: 33, elimins: 43, points: 76, outcome: "Eliminated" },
          { placement: 10, team: "NONx Esports", matches: 12, wwcd: 1, pos: 27, elimins: 47, points: 74, outcome: "Eliminated" },
          { placement: 11, team: "Sinewy Esports", matches: 12, wwcd: 0, pos: 22, elimins: 42, points: 64, outcome: "Eliminated" },
          { placement: 12, team: "Phoenix Esports", matches: 12, wwcd: 0, pos: 17, elimins: 46, points: 63, outcome: "Eliminated" },
          { placement: 13, team: "Troy Tamilan Esports", matches: 12, wwcd: 0, pos: 16, elimins: 40, points: 56, outcome: "Eliminated" },
          { placement: 14, team: "4 Wolf x DOD", matches: 12, wwcd: 0, pos: 20, elimins: 30, points: 50, outcome: "Eliminated" },
          { placement: 15, team: "MadKings", matches: 12, wwcd: 0, pos: 13, elimins: 36, points: 49, outcome: "Eliminated" },
          { placement: 16, team: "Team Vanguard", matches: 12, wwcd: 0, pos: 7, elimins: 39, points: 46, outcome: "Eliminated" },
        ],
      },
      {
        name: "Grand Finals",
        order: 9,
        status: "completed",
        teamCount: 16,
        summary: "Grand Finals: Mar 27th - 29th, 2026 at Chennai Trade Centre, Chennai. 16 teams, 3 matchdays, and 18 matches with 6 each day. 8 teams qualified from Semi Finals and 8 from Survival Stage, with IQOO SouL winning the title on 173 points.",
      standings: [
        { placement: 1, team: "SOUL", fullTeam: "IQOO SouL", matches: 18, wwcd: 2, pos: 54, elimins: 119, points: 173, outcome: "Champion" },
        { placement: 2, team: "GENS", fullTeam: "Genesis Esports", matches: 18, wwcd: 2, pos: 49, elimins: 120, points: 169, outcome: "Runner-up" },
        { placement: 3, team: "OG", fullTeam: "IQOO Orangutan", matches: 18, wwcd: 2, pos: 40, elimins: 92, points: 132, outcome: "3rd Place" },
        { placement: 4, team: "VS", fullTeam: "Victores Sumus", matches: 18, wwcd: 2, pos: 49, elimins: 79, points: 128, outcome: "Top 4" },
        { placement: 5, team: "GODL", fullTeam: "Hero Xtreme GodLike", matches: 18, wwcd: 2, pos: 28, elimins: 90, points: 118, outcome: "Top 8" },
        { placement: 6, team: "K9", fullTeam: "K9 Esports", matches: 18, wwcd: 2, pos: 41, elimins: 76, points: 117, outcome: "Top 8" },
        { placement: 7, team: "RNTX", fullTeam: "IQOO Revenant XSpark", matches: 18, wwcd: 0, pos: 30, elimins: 84, points: 114, outcome: "Top 8" },
        { placement: 8, team: "WF", fullTeam: "Wyld Fangs", matches: 18, wwcd: 2, pos: 48, elimins: 64, points: 112, outcome: "Top 8" },
        { placement: 9, team: "VE", fullTeam: "Vasista Esports", matches: 18, wwcd: 1, pos: 35, elimins: 68, points: 103, outcome: "Finalist" },
        { placement: 10, team: "NEBULA", fullTeam: "Nebula Esports", matches: 18, wwcd: 1, pos: 40, elimins: 60, points: 100, outcome: "Finalist" },
        { placement: 11, team: "LEFP", fullTeam: "Learn From Past", matches: 18, wwcd: 0, pos: 38, elimins: 59, points: 97, outcome: "Finalist" },
        { placement: 12, team: "META-N", fullTeam: "Meta Ninza", matches: 18, wwcd: 1, pos: 31, elimins: 64, points: 95, outcome: "Finalist" },
        { placement: 13, team: "MYTH", fullTeam: "Myth Official", matches: 18, wwcd: 0, pos: 27, elimins: 63, points: 90, outcome: "Finalist" },
        { placement: 14, team: "RGE", fullTeam: "IQOO Reckoning Esports", matches: 18, wwcd: 1, pos: 32, elimins: 57, points: 89, outcome: "Finalist" },
        { placement: 15, team: "TT", fullTeam: "IQOO Team Tamilas", matches: 18, wwcd: 0, pos: 20, elimins: 61, points: 81, outcome: "Finalist" },
        { placement: 16, team: "WELT", fullTeam: "Welt Esports", matches: 18, wwcd: 0, pos: 14, elimins: 48, points: 62, outcome: "Finalist" },
      ],
    },
  ],
};

const mapRotation = ["Rondo", "Erangel", "Erangel", "Erangel", "Miramar", "Miramar"];

const withRotation = (stage, schedule) =>
  schedule.map((item, index) => ({
    stage,
    match_number: index + 1,
    map: mapRotation[index % 6],
    scheduled_time: item.scheduled_time,
    day: item.day,
    status: "completed",
  }));

const stageMatches = [
  ...withRotation("Semi Finals", [
    { scheduled_time: "2026-03-12T15:30:00+05:30", day: 1 },
    { scheduled_time: "2026-03-12T16:25:00+05:30", day: 1 },
    { scheduled_time: "2026-03-12T17:15:00+05:30", day: 1 },
    { scheduled_time: "2026-03-12T18:05:00+05:30", day: 1 },
    { scheduled_time: "2026-03-12T18:50:00+05:30", day: 1 },
    { scheduled_time: "2026-03-12T19:35:00+05:30", day: 1 },
    { scheduled_time: "2026-03-13T14:35:00+05:30", day: 2 },
    { scheduled_time: "2026-03-13T15:20:00+05:30", day: 2 },
    { scheduled_time: "2026-03-13T16:10:00+05:30", day: 2 },
    { scheduled_time: "2026-03-13T17:00:00+05:30", day: 2 },
    { scheduled_time: "2026-03-13T17:50:00+05:30", day: 2 },
    { scheduled_time: "2026-03-13T18:40:00+05:30", day: 2 },
    { scheduled_time: "2026-03-14T14:30:00+05:30", day: 3 },
    { scheduled_time: "2026-03-14T15:15:00+05:30", day: 3 },
    { scheduled_time: "2026-03-14T15:50:00+05:30", day: 3 },
    { scheduled_time: "2026-03-14T16:30:00+05:30", day: 3 },
    { scheduled_time: "2026-03-14T17:10:00+05:30", day: 3 },
    { scheduled_time: "2026-03-14T17:50:00+05:30", day: 3 },
    { scheduled_time: "2026-03-15T14:40:00+05:30", day: 4 },
    { scheduled_time: "2026-03-15T15:20:00+05:30", day: 4 },
    { scheduled_time: "2026-03-15T16:00:00+05:30", day: 4 },
    { scheduled_time: "2026-03-15T16:45:00+05:30", day: 4 },
    { scheduled_time: "2026-03-15T17:25:00+05:30", day: 4 },
    { scheduled_time: "2026-03-15T18:05:00+05:30", day: 4 },
  ]),
  ...withRotation("Survival Stage", [
    { scheduled_time: "2026-03-16T14:33:00+05:30", day: 1 },
    { scheduled_time: "2026-03-16T15:10:00+05:30", day: 1 },
    { scheduled_time: "2026-03-16T15:50:00+05:30", day: 1 },
    { scheduled_time: "2026-03-16T16:30:00+05:30", day: 1 },
    { scheduled_time: "2026-03-16T17:10:00+05:30", day: 1 },
    { scheduled_time: "2026-03-16T17:50:00+05:30", day: 1 },
    { scheduled_time: "2026-03-17T14:30:00+05:30", day: 2 },
    { scheduled_time: "2026-03-17T15:10:00+05:30", day: 2 },
    { scheduled_time: "2026-03-17T15:50:00+05:30", day: 2 },
    { scheduled_time: "2026-03-17T16:30:00+05:30", day: 2 },
    { scheduled_time: "2026-03-17T17:15:00+05:30", day: 2 },
    { scheduled_time: "2026-03-17T17:50:00+05:30", day: 2 },
  ]),
  ...withRotation("Grand Finals", [
    { scheduled_time: "2026-03-27T13:55:00+05:30", day: 1 },
    { scheduled_time: "2026-03-27T14:35:00+05:30", day: 1 },
    { scheduled_time: "2026-03-27T15:15:00+05:30", day: 1 },
    { scheduled_time: "2026-03-27T16:00:00+05:30", day: 1 },
    { scheduled_time: "2026-03-27T16:40:00+05:30", day: 1 },
    { scheduled_time: "2026-03-27T17:23:00+05:30", day: 1 },
    { scheduled_time: "2026-03-28T13:09:00+05:30", day: 2 },
    { scheduled_time: "2026-03-28T13:47:00+05:30", day: 2 },
    { scheduled_time: "2026-03-28T14:30:00+05:30", day: 2 },
    { scheduled_time: "2026-03-28T15:10:00+05:30", day: 2 },
    { scheduled_time: "2026-03-28T15:50:00+05:30", day: 2 },
    { scheduled_time: "2026-03-28T16:35:00+05:30", day: 2 },
    { scheduled_time: "2026-03-29T13:20:00+05:30", day: 3 },
    { scheduled_time: "2026-03-29T14:00:00+05:30", day: 3 },
    { scheduled_time: "2026-03-29T14:45:00+05:30", day: 3 },
    { scheduled_time: "2026-03-29T15:25:00+05:30", day: 3 },
    { scheduled_time: "2026-03-29T16:05:00+05:30", day: 3 },
    { scheduled_time: "2026-03-29T16:45:00+05:30", day: 3 },
  ]),
];

const teams = [
  { name: "EvoX Esports", tag: "EVOX", players: [{ ign: "Kaalan" }, { ign: "Evil" }, { ign: "ShaDow" }, { ign: "SpyOp" }, { ign: "Tonyy" }] },
  { name: "iQOO SouL", tag: "SOUL", players: [{ ign: "NakuL", role: "IGL" }, { ign: "Goblin" }, { ign: "LEGIT" }, { ign: "Jokerr" }, { ign: "Thunder" }] },
  { name: "Meta Ninza", tag: "META", players: [{ ign: "Shadow7", role: "IGL" }, { ign: "Fierce" }, { ign: "Apollo" }, { ign: "WhiteTiger" }, { ign: "Javin" }] },
  { name: "iQOO Orangutan", tag: "OG", players: [{ ign: "AK" }, { ign: "Aaru", role: "IGL" }, { ign: "Attanki" }, { ign: "WizzGOD" }] },
  { name: "4Wolf x DoD", tag: "4WXD", players: [{ ign: "IMMORTAL" }, { ign: "AVNISHOP" }, { ign: "BHAALU", role: "IGL" }, { ign: "NooB" }, { ign: "PIXIEOP" }] },
  { name: "Madkings Esports", tag: "MKE", players: [{ ign: "SHADOW", role: "IGL" }, { ign: "ClutchGod" }, { ign: "Syrax" }, { ign: "PRO" }] },
  { name: "Sinewy Esports", tag: "SNWY", players: [{ ign: "Moksh", role: "IGL" }, { ign: "Vishu99" }, { ign: "Ninjuu" }, { ign: "Rexboy" }, { ign: "NinjA" }] },
  { name: "Genesis Esports", tag: "GEN", players: [{ ign: "ViPER" }, { ign: "GravityJOD", role: "IGL" }, { ign: "HunterZ" }, { ign: "FurY" }, { ign: "Zap" }] },
  { name: "iQOO Team Tamilas", tag: "TT", players: [{ ign: "AIMGOD" }, { ign: "FoxOP" }, { ign: "MrIGL", role: "IGL" }, { ign: "Reaper" }] },
  { name: "Troy Tamilans", tag: "TROY", players: [{ ign: "Auxin" }, { ign: "Ayden" }, { ign: "Lens77" }, { ign: "Hesperos" }, { ign: "Jazzy" }] },
  { name: "Vasista Esports", tag: "VST", players: [{ ign: "Beast" }, { ign: "FusionOP" }, { ign: "Hector", role: "IGL" }, { ign: "Saumay" }, { ign: "Shayaan" }] },
  { name: "Hero Xtreme GodLike", tag: "GODL", players: [{ ign: "Spower" }, { ign: "ADMINO" }, { ign: "Godz" }, { ign: "JONATHAN" }, { ign: "Manya", role: "IGL" }] },
  { name: "Wyld Fangs", tag: "WYLD", players: [{ ign: "SPRAYGOD" }, { ign: "Goten" }, { ign: "Kanha" }, { ign: "SENSEI", role: "IGL" }, { ign: "Sam999" }] },
  { name: "iQOO Revenant XSpark", tag: "RNTX", players: [{ ign: "NinjaJOD" }, { ign: "JDGamingYT" }, { ign: "Pain09" }, { ign: "Punkk" }, { ign: "Tracegod" }] },
  { name: "Welt Esports", tag: "WELT", players: [{ ign: "GokulWNL", role: "IGL" }, { ign: "Proton" }, { ign: "Maxioso" }, { ign: "Shyam" }, { ign: "JustyOp" }] },
  { name: "Learn From Past", tag: "LFP", players: [{ ign: "Termi" }, { ign: "RushBoy" }, { ign: "MAX" }, { ign: "Honey", role: "IGL" }, { ign: "SHADOWW" }] },
  { name: "Nebula Esports", tag: "NEB", players: [{ ign: "Aadi", role: "IGL" }, { ign: "KnowMe" }, { ign: "KRATOS" }, { ign: "Phoenix" }, { ign: "Ryu" }] },
  { name: "Vanguard Esports", tag: "VNG", players: [{ ign: "DreamS", role: "IGL" }, { ign: "Insidious" }, { ign: "Dionysus" }, { ign: "Crypto" }, { ign: "AnujTooOP" }] },
  { name: "NoNx Esports", tag: "NONX", players: [{ ign: "AimGoD" }, { ign: "Anonymous" }, { ign: "Arther" }, { ign: "FAMEeeeee" }, { ign: "Rapido" }] },
  { name: "K9 Esports", tag: "K9", players: [{ ign: "Knight" }, { ign: "NinjaBoi" }, { ign: "Omega" }, { ign: "RyzenBOTX" }, { ign: "Slug" }] },
  { name: "Victores Sumus", tag: "VS", players: [{ ign: "Owais", role: "IGL" }, { ign: "Mafia36" }, { ign: "VeNoM" }, { ign: "ScaryJod" }, { ign: "Sarang" }] },
  { name: "Phoenix Esports", tag: "PHX", players: [{ ign: "Saumraj" }, { ign: "SIMP" }, { ign: "Smoker46" }, { ign: "Stranger" }, { ign: "VipeR" }] },
  { name: "Reckoning Esports", tag: "RGE", players: [{ ign: "Godx" }, { ign: "Levi" }, { ign: "Lovish" }, { ign: "Roman", role: "IGL" }, { ign: "SahilOPAF" }] },
  { name: "Myth Official", tag: "MYTH", players: [{ ign: "Harshil" }, { ign: "Lucifer" }, { ign: "Daddy" }, { ign: "Detrox", role: "IGL" }, { ign: "Aryton" }] },
];

const finalsStandings = [
  { teamName: "iQOO SouL", placement: 1, matches: 18, wwcd: 2, placementPoints: 54, killPoints: 119, totalPoints: 173 },
  { teamName: "Genesis Esports", placement: 2, matches: 18, wwcd: 2, placementPoints: 49, killPoints: 120, totalPoints: 169 },
  { teamName: "iQOO Orangutan", placement: 3, matches: 18, wwcd: 2, placementPoints: 40, killPoints: 92, totalPoints: 132 },
  { teamName: "Victores Sumus", placement: 4, matches: 18, wwcd: 2, placementPoints: 49, killPoints: 79, totalPoints: 128 },
  { teamName: "Hero Xtreme GodLike", placement: 5, matches: 18, wwcd: 2, placementPoints: 28, killPoints: 90, totalPoints: 118 },
  { teamName: "K9 Esports", placement: 6, matches: 18, wwcd: 2, placementPoints: 41, killPoints: 76, totalPoints: 117 },
  { teamName: "iQOO Revenant XSpark", placement: 7, matches: 18, wwcd: 0, placementPoints: 30, killPoints: 84, totalPoints: 114 },
  { teamName: "Wyld Fangs", placement: 8, matches: 18, wwcd: 2, placementPoints: 48, killPoints: 64, totalPoints: 112 },
  { teamName: "Vasista Esports", placement: 9, matches: 18, wwcd: 1, placementPoints: 35, killPoints: 68, totalPoints: 103 },
  { teamName: "Nebula Esports", placement: 10, matches: 18, wwcd: 1, placementPoints: 40, killPoints: 60, totalPoints: 100 },
  { teamName: "Learn From Past", placement: 11, matches: 18, wwcd: 0, placementPoints: 38, killPoints: 59, totalPoints: 97 },
  { teamName: "Meta Ninza", placement: 12, matches: 18, wwcd: 1, placementPoints: 31, killPoints: 64, totalPoints: 95 },
  { teamName: "Myth Official", placement: 13, matches: 18, wwcd: 0, placementPoints: 27, killPoints: 63, totalPoints: 90 },
  { teamName: "Reckoning Esports", placement: 14, matches: 18, wwcd: 1, placementPoints: 32, killPoints: 57, totalPoints: 89 },
  { teamName: "iQOO Team Tamilas", placement: 15, matches: 18, wwcd: 0, placementPoints: 20, killPoints: 61, totalPoints: 81 },
  { teamName: "Welt Esports", placement: 16, matches: 18, wwcd: 0, placementPoints: 14, killPoints: 48, totalPoints: 62 },
];

const articles = [
  {
    title: "Team SouL win BGIS 2026 after dominant Grand Finals run",
    content:
      "Team SouL claimed the BGIS 2026 championship with 173 total points in the Grand Finals, finishing ahead of Genesis Esports and Orangutan. KRAFTON's flagship BGMI event featured a ₹4 crore prize pool and concluded in Chennai after a season that started with 1024 teams.",
    category: "tournament",
    game: "BGMI",
    featured: 1,
  },
  {
    title: "BGIS 2026 prize pool and final placements confirmed",
    content:
      "BGIS 2026 offered a total prize pool of ₹4,00,00,000. Team SouL earned ₹1,00,00,000 for first place, Genesis Esports took ₹50,00,000 for second, and Orangutan secured ₹35,00,000 for third. The finals payout extended through 24th place, making it one of the largest BGMI prize distributions of the year.",
    category: "announcement",
    game: "BGMI",
    featured: 0,
  },
  {
    title: "HunterZ, LEGIT and NakuL headline BGIS 2026 award winners",
    content:
      "Genesis Esports player HunterZ was named tournament MVP, Team SouL's LEGIT won Finals MVP, and NakuL was recognized as Best IGL. Myth Official's Detrox received Emerging Star, Learn From Past's Termi claimed Best Clutch, and Team SouL also took the Fan Favourite Team award.",
    category: "announcement",
    game: "BGMI",
    featured: 0,
  },
];

const tx = db.transaction(() => {
  const existingTournament = db.prepare("SELECT id FROM tournaments WHERE name = ?").get(tournament.name);
  if (existingTournament) {
    db.prepare("DELETE FROM match_results WHERE tournament_id = ?").run(existingTournament.id);
    db.prepare("DELETE FROM matches WHERE tournament_id = ?").run(existingTournament.id);
    db.prepare("DELETE FROM tournaments WHERE id = ?").run(existingTournament.id);
  }

  const tournamentId = randomUUID();
  db.prepare(`
    INSERT INTO tournaments (
      id, name, game, tier, status, prize_pool, start_date, end_date, stages,
      description, banner_url, rules, max_teams, format_overview, calendar, prize_breakdown, awards, participants, rankings,
      created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
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
      tournament.banner_url ?? null,
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
      "admin@stagecore.local"
    );

  const upsertTeam = db.prepare(`
    INSERT INTO teams (
      id, name, tag, logo_url, game, region, total_kills, total_points, matches_played, wins, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      tag=excluded.tag,
      logo_url=excluded.logo_url,
      game=excluded.game,
      region=excluded.region,
      updated_date=excluded.updated_date
  `);

  const findTeamByName = db.prepare("SELECT id FROM teams WHERE name = ?");
  const deletePlayersByTeam = db.prepare("DELETE FROM players WHERE team_id = ?");
  const insertPlayer = db.prepare(`
    INSERT INTO players (
      id, ign, real_name, team_id, role, photo_url, total_kills, matches_played, avg_damage,
      created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const teamIds = new Map();
  for (const team of teams) {
    const existing = findTeamByName.get(team.name);
    const teamId = existing?.id || randomUUID();
    upsertTeam.run(
      teamId,
      team.name,
      team.tag,
      null,
      "BGMI",
      "India",
      0,
      0,
      0,
      0,
      now,
      now,
      "admin@stagecore.local"
    );
    deletePlayersByTeam.run(teamId);
    for (const player of team.players) {
      insertPlayer.run(
        randomUUID(),
        player.ign,
        null,
        teamId,
        normalizeRole(player.role),
        null,
        0,
        0,
        0,
        now,
        now,
        "admin@stagecore.local"
      );
    }
    teamIds.set(team.name, teamId);
  }

  const insertMatch = db.prepare(`
    INSERT INTO matches (
      id, tournament_id, stage, match_number, map, status, scheduled_time, stream_url, day, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const match of stageMatches) {
    insertMatch.run(
      randomUUID(),
      tournamentId,
      match.stage,
      match.match_number,
      match.map,
      match.status,
      match.scheduled_time,
      null,
      match.day,
      now,
      now,
      "admin@stagecore.local"
    );
  }

  const matchId = randomUUID();
  insertMatch.run(
    matchId,
    tournamentId,
    "Grand Finals Standings",
    0,
    "Other",
    "completed",
    "2026-03-29T16:45:00+05:30",
    null,
    3,
    now,
    now,
    "admin@stagecore.local"
  );

  const insertResult = db.prepare(`
    INSERT INTO match_results (
      id, match_id, tournament_id, team_id, placement, kill_points, placement_points, total_points, matches_count, wins_count, stage,
      created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const standing of finalsStandings) {
    const teamId = teamIds.get(standing.teamName);
    if (!teamId) continue;
    insertResult.run(
      randomUUID(),
      matchId,
      tournamentId,
      teamId,
      standing.placement,
      standing.killPoints,
      standing.placementPoints,
      standing.totalPoints,
      standing.matches,
      standing.wwcd,
      "Grand Finals",
      now,
      now,
      "admin@stagecore.local"
    );
  }

  recomputeTeamStats();

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
      "admin@stagecore.local"
    );
  }
});

tx();

console.log("Imported BGIS 2026 tournament, schedule, teams, players, standings, and news.");

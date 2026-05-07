import { randomUUID } from "node:crypto";
import { db, recomputeTeamStats } from "../db.js";

const now = new Date().toISOString();

const tournament = {
  name: "Battlegrounds Mobile India Pro Series 2025",
  game: "BGMI",
  tier: "A-Tier",
  status: "completed",
  prize_pool: "₹4,00,00,000",
  start_date: "2025-05-22",
  end_date: "2025-07-06",
  max_teams: 96,
  banner_url: "/images/bmps-2025.png",
  description:
    "Battlegrounds Mobile India Pro Series 2025 was the fourth edition of BMPS. The prize pool grew from ₹2,00,00,000 to ₹4,00,00,000 through the in-game Discovery Island event, and the season concluded with Aryan x TMG Gaming winning the Delhi Grand Finals.",
  format_overview:
    "BMPS 2025 featured a 96-team League Stage that progressed through Round 1, Round 2, Round 3, Semi Finals Week 1, Semi Finals Week 2, and an 18-match Grand Finals at Yashobhoomi Convention Centre in Delhi.",
  rules:
    "Match scoring: 1st 10, 2nd 6, 3rd 5, 4th 4, 5th 3, 6th 2, 7th-8th 1, 9th-16th 0. Each elimination gives 1 point. Tiebreakers: total WWCDs, then placement points, then elimination points, then the best placement in the most recent match. The champion qualified for PUBG Mobile World Cup 2025.",
  calendar: [
    { week: "May 22 - Jun 3", label: "Round 1" },
    { week: "Jun 5 - Jun 8", label: "Round 2" },
    { week: "Jun 9 - Jun 12", label: "Round 3" },
    { week: "Jun 14 - Jun 17", label: "Semi Finals Week 1" },
    { week: "Jun 19 - Jun 22", label: "Semi Finals Week 2" },
    { week: "Jul 4 - Jul 6", label: "Grand Finals" },
  ],
  prize_breakdown: [
    { placement: "1st", team: "Aryan x TMG Gaming", inr: "12,500,000", usd: "145,684.67" },
    { placement: "2nd", team: "NoNx Esports", inr: "5,500,000", usd: "64,101.26" },
    { placement: "3rd", team: "Los Hermanos Esports", inr: "3,500,000", usd: "40,791.71" },
    { placement: "4th", team: "4Merical Esports", inr: "2,250,000", usd: "26,223.24" },
    { placement: "5th", team: "8Bit", inr: "1,800,000", usd: "20,978.59" },
    { placement: "6th", team: "Gods Omen", inr: "1,500,000", usd: "17,482.16" },
    { placement: "7th", team: "4TR Official", inr: "1,400,000", usd: "16,316.68" },
    { placement: "8th", team: "TWOB", inr: "1,300,000", usd: "15,151.21" },
    { placement: "9th", team: "Gods Reign", inr: "1,200,000", usd: "13,985.73" },
    { placement: "10th", team: "K9 Esports", inr: "1,200,000", usd: "13,985.73" },
    { placement: "11th", team: "Team Forever", inr: "800,000", usd: "9,323.82" },
    { placement: "12th", team: "Inferno Squad", inr: "800,000", usd: "9,323.82" },
    { placement: "13th", team: "Genesis Esports", inr: "700,000", usd: "8,158.34" },
    { placement: "14th", team: "Team Eggy", inr: "700,000", usd: "8,158.34" },
    { placement: "15th", team: "TEAM iNSANE", inr: "700,000", usd: "8,158.34" },
    { placement: "16th", team: "2OP Official", inr: "500,000", usd: "5,827.39" },
    { placement: "17th", team: "Alibaba Raiders", inr: "300,000", usd: "3,496.43" },
    { placement: "18th", team: "Hyderabad Hydras", inr: "300,000", usd: "3,496.43" },
    { placement: "19th", team: "Reckoning Esports", inr: "300,000", usd: "3,496.43" },
    { placement: "20th", team: "Orangutan", inr: "300,000", usd: "3,496.43" },
    { placement: "21st", team: "True Rippers", inr: "200,000", usd: "2,330.95" },
    { placement: "22nd", team: "MYSTERIOUS 4", inr: "200,000", usd: "2,330.95" },
    { placement: "23rd", team: "Troy Tamilans Esports", inr: "200,000", usd: "2,330.95" },
    { placement: "24th", team: "GodLike Esports", inr: "200,000", usd: "2,330.95" },
    { placement: "25th", team: "Volcano Esports", inr: "200,000", usd: "2,330.95" },
    { placement: "26th", team: "Learn From Past", inr: "100,000", usd: "1,165.48" },
    { placement: "27th", team: "Wyld Fangs", inr: "100,000", usd: "1,165.48" },
    { placement: "28th", team: "BO7S", inr: "100,000", usd: "1,165.48" },
    { placement: "29th", team: "Team SouL", inr: "100,000", usd: "1,165.48" },
    { placement: "30th", team: "Jux Esports", inr: "100,000", usd: "1,165.48" },
    { placement: "31st", team: "Do Or Die", inr: "100,000", usd: "1,165.48" },
    { placement: "32nd", team: "Team Shockwave", inr: "100,000", usd: "1,165.48" },
  ],
  awards: [
    { title: "MVP", player: "Levi", team: "NoNx Esports", country: "India", inr: "300,000", usd: "3,496.43" },
    { title: "Finals MVP", player: "Levi", team: "NoNx Esports", country: "India", inr: "100,000", usd: "1,165.48" },
    { title: "Best IGL", player: "DragonOP", team: "4Merical Esports", country: "India", inr: "150,000", usd: "1,748.22" },
    { title: "Best Clutch", player: "NinjaBoi", team: "K9 Esports", country: "India", inr: "50,000", usd: "582.74" },
  ],
  participants: [
    { placement: 1, team: "Orangutan", phase: "Round 1", players: ["Aaru", "AKop", "WizzGOD", "Attanki", "Veyron", "RonaK"] },
    { placement: 2, team: "Team SouL", phase: "Round 1", players: ["Manya", "Goblin", "NakuL", "LEGIT", "Rony"] },
    { placement: 3, team: "Hyderabad Hydras", phase: "Round 1", players: ["Sarvit", "Moksh", "Ninjuu", "NinjA", "Rexboy", "Karthik"] },
    { placement: 4, team: "TWOB", phase: "Round 1", players: ["Anonymous", "Rapido", "Kanha", "Kalyug", "Dashh05", "Pompy05"] },
    { placement: 5, team: "Learn From Past", phase: "Round 1", players: ["iYash", "SahilOPAF", "HONEY", "Dope", "Armxn"] },
    { placement: 6, team: "K9 Esports", phase: "Round 1", players: ["Omega", "NinjaBoi", "Slug", "Beast", "Arclyn", "Ravan"] },
    { placement: 7, team: "Wyld Fangs", phase: "Round 1", players: ["SENSEI", "Saif", "Tracegod", "Fierce", "AnujTooOP"] },
    { placement: 8, team: "True Rippers", phase: "Round 1", players: ["Jelly", "KioLmao", "SAM", "Ninzae", "Rudd"] },
    { placement: 9, team: "8Bit", phase: "Round 3", players: ["Saumraj", "Troye", "GamlaBoy", "AquaNox", "Raiden", "Sheek"] },
    { placement: 10, team: "GodLike Esports", phase: "Round 3", players: ["Punkk", "JONATHAN", "ADMINO", "Spower", "SIMP", "ZGOD"] },
    { placement: 11, team: "Genesis Esports", phase: "Round 3", players: ["SHADOW", "Apollo", "Sam", "HunterZ", "Zap", "TOM"] },
    { placement: 12, team: "4Merical Esports", phase: "Round 3", players: ["DragonOP", "PokoWNL", "BeardBaba", "Reaper", "VPIX"] },
    { placement: 13, team: "NoNx Esports", phase: "Round 3", players: ["Roman", "RushBoy", "Lovish", "Levi", "Godx"] },
    { placement: 14, team: "BO7S", phase: "Round 3", players: ["Doroki", "Ghostfxce", "Dusty", "Dizzy", "Topzzz"] },
    { placement: 15, team: "Team Eggy", phase: "Round 3", players: ["EGGY", "Mernox", "DREAMS03", "JDGamingYT", "ProBGMI"] },
    { placement: 16, team: "Jux Esports", phase: "Round 3", players: ["Niku", "Ribu", "Amazing", "Jax", "Suki", "Vardaan"] },
    { placement: 17, team: "TEAM iNSANE", phase: "Round 3", players: ["Aadi", "Lazyy", "Atomm", "Cloudz", "Godz", "Yash"] },
    { placement: 18, team: "Inferno Squad", phase: "Round 3", players: ["PmwiIGL", "OwenOG", "JatinOG", "Goten", "Executor", "OmegaOG"] },
    { placement: 19, team: "2OP Official", phase: "Round 3", players: ["Aimhaxx", "Liability", "Botfire", "Shootpagalu", "Shady", "Hypnotized"] },
    { placement: 20, team: "Gods Omen", phase: "Round 3", players: ["StoneBGMI", "GyroGod", "BadOP", "GOKU", "Suriya", "Superman"] },
    { placement: 21, team: "Team Forever", phase: "Round 3", players: ["Owais", "Ash", "Thunder", "Shayaan", "Mafia36", "STORM"] },
    { placement: 22, team: "Do Or Die", phase: "Round 3", players: ["Bhaalu", "AvnishOP", "ReapeR", "Ryzen", "Omega", "PixieOP"] },
    { placement: 23, team: "Gods Reign", phase: "Round 3", players: ["DeltaPG", "Justin", "Destro", "Neyo", "Robin"] },
    { placement: 24, team: "Reckoning Esports", phase: "Round 3", players: ["GravityJOD", "ViPER", "Dionysus", "Saumay", "MAX", "Ahu"] },
    { placement: 25, team: "Aryan x TMG Gaming", phase: "Round 3", players: ["Aryan", "Syrax", "Devotee", "Hitler", "Vishu", "Manas4u"] },
    { placement: 26, team: "Team Shockwave", phase: "Round 3", players: ["Shockwave", "Extrovert", "Shroud", "MadmanGod", "KrishOP"] },
    { placement: 27, team: "Volcano Esports", phase: "Round 3", players: ["FLASH", "Arjun", "VEGITO", "PSYCHO", "REFLEXXX", "GIN"] },
    { placement: 28, team: "Troy Tamilans Esports", phase: "Round 3", players: ["RanveerOG", "Hydro", "INFERNO", "Auxin", "Mac", "Ralphie"] },
    { placement: 29, team: "Alibaba Raiders", phase: "Round 3", players: ["Wanted", "Kris", "Mj", "AryanOG", "WhiteT1ger", "FraggerNUB"] },
    { placement: 30, team: "4TR Official", phase: "Round 3", players: ["Morty", "PainIsLive", "AKOP", "InfGod", "Utkarsh", "Action18"] },
    { placement: 31, team: "MYSTERIOUS 4", phase: "Round 3", players: ["SKETCH", "Fragger", "SnowJOD", "HEROO", "JAXXX", "Danav"] },
    { placement: 32, team: "Los Hermanos Esports", phase: "Round 3", players: ["ShaDow", "Kaalan", "SpyOp", "Evil", "AFU", "SayiP"] },
  ],
  rankings: [
    {
      title: "BMPS MVP",
      columns: [
        { key: "points", label: "Points" },
        { key: "finishes", label: "Finishes" },
        { key: "damage", label: "Damage" },
        { key: "survivalTime", label: "Survival Time" },
        { key: "knocks", label: "Knocks" },
      ],
      entries: [
        { placement: 1, player: "Levi", team: "NoNx Esports", points: 114, finishes: 92, damage: 16662, survivalTime: "20:40", knocks: 61 },
        { placement: 2, player: "Devotee", team: "Aryan x TMG Gaming", points: 91, finishes: 68, damage: 14279, survivalTime: "18:52", knocks: 62 },
        { placement: 3, player: "Hitler", team: "Aryan x TMG Gaming", points: 79, finishes: 57, damage: 12438, survivalTime: "18:46", knocks: 59 },
        { placement: 4, player: "Beast", team: "K9 Esports", points: 79, finishes: 56, damage: 12862, survivalTime: "18:21", knocks: 53 },
        { placement: 5, player: "PainIsLive", team: "4TR Official", points: 79, finishes: 59, damage: 11693, survivalTime: "18:19", knocks: 47 },
      ],
    },
    {
      title: "BMPS FMVP",
      columns: [
        { key: "points", label: "Points" },
        { key: "finishes", label: "Finishes" },
        { key: "damage", label: "Damage" },
        { key: "survivalTime", label: "Survival Time" },
        { key: "knocks", label: "Knocks" },
      ],
      entries: [
        { placement: 1, player: "Levi", team: "NoNx Esports", points: 267, finishes: 35, damage: 5805, survivalTime: "19:12", knocks: 17 },
        { placement: 2, player: "Devotee", team: "Aryan x TMG Gaming", points: 252, finishes: 31, damage: 6249, survivalTime: "18:23", knocks: 32 },
        { placement: 3, player: "Kalyug", team: "TWOB", points: 213, finishes: 23, damage: 5891, survivalTime: "19:47", knocks: 29 },
        { placement: 4, player: "Thunder", team: "Team Forever", points: 208, finishes: 27, damage: 4203, survivalTime: "17:53", knocks: 16 },
        { placement: 5, player: "Godx", team: "NoNx Esports", points: 206, finishes: 22, damage: 5641, survivalTime: "20:16", knocks: 23 },
      ],
    },
  ],
  stages: [
    {
      name: "League Stage",
      order: 1,
      status: "completed",
      teamCount: 96,
      summary:
        "May 22nd - June 22nd, 2025. BMPS 2025 began with 96 teams and progressed through Round 1, Round 2, Round 3, and two Semi Finals weeks before locking the Grand Finalists.",
    },
    {
      name: "Round 1",
      order: 2,
      status: "completed",
      teamCount: 96,
      summary:
        "May 22nd - June 3rd, 2025. 96 teams were split into 6 groups of 16 with reshuffles every three days. The top 8 advanced directly to Semi Finals Week 1, 9th-16th moved to Round 3, and the next best 64 advanced to Round 2.",
    },
    {
      name: "Round 2",
      order: 3,
      status: "completed",
      teamCount: 64,
      summary:
        "June 5th - June 8th, 2025. 64 teams were divided into 4 groups of 16 and each team played 6 matches. The top 40 teams overall reached Round 3.",
    },
    {
      name: "Round 3",
      order: 4,
      status: "completed",
      teamCount: 48,
      summary:
        "June 9th - June 12th, 2025. 8 teams from Round 1 joined 40 teams from Round 2. After reshuffles across 4 matchdays, the top 24 advanced to Semi Finals Week 1.",
    },
    {
      name: "Semi Finals Week 1",
      order: 5,
      status: "completed",
      teamCount: 32,
      summary:
        "June 14th - June 17th, 2025. 32 teams played a round-robin format across 4 groups of 8. Each team played 12 matches and the top 8 reached the Grand Finals.",
    },
    {
      name: "Semi Finals Week 2",
      order: 6,
      status: "completed",
      teamCount: 24,
      summary:
        "June 19th - June 22nd, 2025. 24 teams were divided into 3 groups of 8 in a double round-robin format. Each team played 16 matches and the top 8 advanced to the Grand Finals.",
    },
    {
      name: "Grand Finals",
      order: 7,
      status: "completed",
      teamCount: 16,
      summary:
        "July 4th - July 6th, 2025 at Yashobhoomi Convention Centre, Delhi. 16 teams played 18 matches, with Aryan x TMG Gaming winning the championship on 136 total points.",
      standings: [
        { placement: 1, team: "AXTMG", fullTeam: "Aryan x TMG Gaming", matches: 18, wwcd: 3, pos: 57, elimins: 79, points: 136, outcome: "Champion" },
        { placement: 2, team: "NONX", fullTeam: "NoNx Esports", matches: 18, wwcd: 2, pos: 48, elimins: 84, points: 132, outcome: "Runner-up" },
        { placement: 3, team: "LH", fullTeam: "Los hermanos", matches: 18, wwcd: 1, pos: 48, elimins: 78, points: 126, outcome: "3rd Place" },
        { placement: 4, team: "4M", fullTeam: "4Merical Esports", matches: 18, wwcd: 3, pos: 54, elimins: 71, points: 125, outcome: "Top 4" },
        { placement: 5, team: "8BIT", fullTeam: "iQOO8BIT", matches: 18, wwcd: 1, pos: 38, elimins: 78, points: 116, outcome: "Top 8" },
        { placement: 6, team: "GOM", fullTeam: "Gods Omen", matches: 18, wwcd: 1, pos: 40, elimins: 74, points: 114, outcome: "Top 8" },
        { placement: 7, team: "4TR", fullTeam: "4TR Official", matches: 18, wwcd: 2, pos: 45, elimins: 64, points: 109, outcome: "Top 8" },
        { placement: 8, team: "TWOB", fullTeam: "TWOB", matches: 18, wwcd: 0, pos: 42, elimins: 67, points: 109, outcome: "Top 8" },
        { placement: 9, team: "GDR", fullTeam: "OnePlus Gods Reign", matches: 18, wwcd: 0, pos: 32, elimins: 72, points: 104, outcome: "Finalist" },
        { placement: 10, team: "K9", fullTeam: "OnePlus K9 Esports", matches: 18, wwcd: 1, pos: 34, elimins: 68, points: 102, outcome: "Finalist" },
        { placement: 11, team: "TF", fullTeam: "Team Forever", matches: 18, wwcd: 1, pos: 30, elimins: 71, points: 101, outcome: "Finalist" },
        { placement: 12, team: "INF", fullTeam: "Rising Inferno Esports", matches: 18, wwcd: 1, pos: 29, elimins: 65, points: 94, outcome: "Finalist" },
        { placement: 13, team: "GEN", fullTeam: "GENESIS ESPORTS", matches: 18, wwcd: 1, pos: 23, elimins: 68, points: 91, outcome: "Finalist" },
        { placement: 14, team: "EGGY", fullTeam: "Team Eggy", matches: 18, wwcd: 0, pos: 24, elimins: 64, points: 88, outcome: "Finalist" },
        { placement: 15, team: "INSANE", fullTeam: "Team Insane Esports", matches: 18, wwcd: 0, pos: 18, elimins: 40, points: 58, outcome: "Finalist" },
        { placement: 16, team: "2OP", fullTeam: "2oP Official", matches: 18, wwcd: 1, pos: 14, elimins: 26, points: 40, outcome: "Finalist" },
      ],
    },
  ],
};

const teams = [
  { name: "Orangutan", tag: "OG", players: ["Aaru", "AKop", "WizzGOD", "Attanki", "Veyron", "RonaK"] },
  { name: "Team SouL", tag: "SOUL", players: ["Manya", "Goblin", "NakuL", "LEGIT", "Rony"] },
  { name: "Hyderabad Hydras", tag: "HH", players: ["Sarvit", "Moksh", "Ninjuu", "NinjA", "Rexboy", "Karthik"] },
  { name: "TWOB", tag: "TWOB", players: ["Anonymous", "Rapido", "Kanha", "Kalyug", "Dashh05", "Pompy05"] },
  { name: "Learn From Past", tag: "LFP", players: ["iYash", "SahilOPAF", "HONEY", "Dope", "Armxn"] },
  { name: "K9 Esports", tag: "K9", players: ["Omega", "NinjaBoi", "Slug", "Beast", "Arclyn", "Ravan"] },
  { name: "Wyld Fangs", tag: "WF", players: ["SENSEI", "Saif", "Tracegod", "Fierce", "AnujTooOP"] },
  { name: "True Rippers", tag: "TR", players: ["Jelly", "KioLmao", "SAM", "Ninzae", "Rudd"] },
  { name: "8Bit", tag: "8BIT", players: ["Saumraj", "Troye", "GamlaBoy", "AquaNox", "Raiden", "Sheek"] },
  { name: "GodLike Esports", tag: "GODL", players: ["Punkk", "JONATHAN", "ADMINO", "Spower", "SIMP", "ZGOD"] },
  { name: "Genesis Esports", tag: "GEN", players: ["SHADOW", "Apollo", "Sam", "HunterZ", "Zap", "TOM"] },
  { name: "4Merical Esports", tag: "4M", players: ["DragonOP", "PokoWNL", "BeardBaba", "Reaper", "VPIX"] },
  { name: "NoNx Esports", tag: "NONX", players: ["Roman", "RushBoy", "Lovish", "Levi", "Godx"] },
  { name: "BO7S", tag: "BO7S", players: ["Doroki", "Ghostfxce", "Dusty", "Dizzy", "Topzzz"] },
  { name: "Team Eggy", tag: "EGGY", players: ["EGGY", "Mernox", "DREAMS03", "JDGamingYT", "ProBGMI"] },
  { name: "Jux Esports", tag: "JUX", players: ["Niku", "Ribu", "Amazing", "Jax", "Suki", "Vardaan"] },
  { name: "TEAM iNSANE", tag: "INSANE", players: ["Aadi", "Lazyy", "Atomm", "Cloudz", "Godz", "Yash"] },
  { name: "Inferno Squad", tag: "INF", players: ["PmwiIGL", "OwenOG", "JatinOG", "Goten", "Executor", "OmegaOG"] },
  { name: "2OP Official", tag: "2OP", players: ["Aimhaxx", "Liability", "Botfire", "Shootpagalu", "Shady", "Hypnotized"] },
  { name: "Gods Omen", tag: "GOM", players: ["StoneBGMI", "GyroGod", "BadOP", "GOKU", "Suriya", "Superman"] },
  { name: "Team Forever", tag: "TF", players: ["Owais", "Ash", "Thunder", "Shayaan", "Mafia36", "STORM"] },
  { name: "Do Or Die", tag: "DOD", players: ["Bhaalu", "AvnishOP", "ReapeR", "Ryzen", "Omega", "PixieOP"] },
  { name: "Gods Reign", tag: "GDR", players: ["DeltaPG", "Justin", "Destro", "Neyo", "Robin"] },
  { name: "Reckoning Esports", tag: "RGE", players: ["GravityJOD", "ViPER", "Dionysus", "Saumay", "MAX", "Ahu"] },
  { name: "Aryan x TMG Gaming", tag: "AXTMG", players: ["Aryan", "Syrax", "Devotee", "Hitler", "Vishu", "Manas4u"] },
  { name: "Team Shockwave", tag: "SHOCK", players: ["Shockwave", "Extrovert", "Shroud", "MadmanGod", "KrishOP"] },
  { name: "Volcano Esports", tag: "VOL", players: ["FLASH", "Arjun", "VEGITO", "PSYCHO", "REFLEXXX", "GIN"] },
  { name: "Troy Tamilans Esports", tag: "TROY", players: ["RanveerOG", "Hydro", "INFERNO", "Auxin", "Mac", "Ralphie"] },
  { name: "Alibaba Raiders", tag: "AR", players: ["Wanted", "Kris", "Mj", "AryanOG", "WhiteT1ger", "FraggerNUB"] },
  { name: "4TR Official", tag: "4TR", players: ["Morty", "PainIsLive", "AKOP", "InfGod", "Utkarsh", "Action18"] },
  { name: "MYSTERIOUS 4", tag: "M4", players: ["SKETCH", "Fragger", "SnowJOD", "HEROO", "JAXXX", "Danav"] },
  { name: "Los Hermanos Esports", tag: "LH", players: ["ShaDow", "Kaalan", "SpyOp", "Evil", "AFU", "SayiP"] },
];

const finalsStandings = tournament.stages.find((stage) => stage.name === "Grand Finals").standings.map((entry) => ({
  teamName: entry.fullTeam,
  placement: entry.placement,
  matches: entry.matches,
  wwcd: entry.wwcd,
  placementPoints: entry.pos,
  killPoints: entry.elimins,
  totalPoints: entry.points,
}));

const grandFinalSchedule = [
  "2025-07-04T15:30:00+05:30",
  "2025-07-04T16:15:00+05:30",
  "2025-07-04T17:00:00+05:30",
  "2025-07-04T17:40:00+05:30",
  "2025-07-04T18:20:00+05:30",
  "2025-07-04T19:05:00+05:30",
  "2025-07-05T15:30:00+05:30",
  "2025-07-05T16:15:00+05:30",
  "2025-07-05T17:00:00+05:30",
  "2025-07-05T17:40:00+05:30",
  "2025-07-05T18:20:00+05:30",
  "2025-07-05T19:05:00+05:30",
  "2025-07-06T15:30:00+05:30",
  "2025-07-06T16:15:00+05:30",
  "2025-07-06T17:00:00+05:30",
  "2025-07-06T17:40:00+05:30",
  "2025-07-06T18:20:00+05:30",
  "2025-07-06T19:05:00+05:30",
];

const mapRotation = ["Erangel", "Miramar", "Sanhok", "Erangel", "Miramar", "Erangel"];

const articles = [
  {
    title: "Aryan x TMG Gaming win BMPS 2025 in Delhi",
    content:
      "Aryan x TMG Gaming won BMPS 2025 with 136 total points in the Grand Finals, finishing ahead of NoNx Esports and Los Hermanos Esports. The event featured a ₹4 crore prize pool and sent the champions to the PUBG Mobile World Cup 2025.",
    category: "tournament",
    game: "BGMI",
    featured: 1,
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
    "admin@stagecore.local"
  );

  const findTeamByName = db.prepare("SELECT id FROM teams WHERE name = ?");
  const upsertTeam = db.prepare(`
    INSERT INTO teams (
      id, name, tag, logo_url, game, region, total_kills, total_points, matches_played, wins, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      tag=excluded.tag,
      game=excluded.game,
      region=excluded.region,
      updated_date=excluded.updated_date
  `);
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
    upsertTeam.run(teamId, team.name, team.tag, null, "BGMI", "India", 0, 0, 0, 0, now, now, "admin@stagecore.local");
    deletePlayersByTeam.run(teamId);
    for (const ign of team.players) {
      insertPlayer.run(randomUUID(), ign, null, teamId, "Assaulter", null, 0, 0, 0, now, now, "admin@stagecore.local");
    }
    teamIds.set(team.name, teamId);
  }

  const aliasToTeamName = new Map([
    ["Aryan x TMG Gaming", "Aryan x TMG Gaming"],
    ["NoNx Esports", "NoNx Esports"],
    ["Los hermanos", "Los Hermanos Esports"],
    ["4Merical Esports", "4Merical Esports"],
    ["iQOO8BIT", "8Bit"],
    ["Gods Omen", "Gods Omen"],
    ["4TR Official", "4TR Official"],
    ["TWOB", "TWOB"],
    ["OnePlus Gods Reign", "Gods Reign"],
    ["OnePlus K9 Esports", "K9 Esports"],
    ["Team Forever", "Team Forever"],
    ["Rising Inferno Esports", "Inferno Squad"],
    ["GENESIS ESPORTS", "Genesis Esports"],
    ["Team Eggy", "Team Eggy"],
    ["Team Insane Esports", "TEAM iNSANE"],
    ["2oP Official", "2OP Official"],
  ]);

  const insertMatch = db.prepare(`
    INSERT INTO matches (
      id, tournament_id, stage, match_number, map, status, scheduled_time, stream_url, day, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  grandFinalSchedule.forEach((scheduledTime, index) => {
    insertMatch.run(
      randomUUID(),
      tournamentId,
      "Grand Finals",
      index + 1,
      mapRotation[index % mapRotation.length],
      "completed",
      scheduledTime,
      null,
      Math.floor(index / 6) + 1,
      now,
      now,
      "admin@stagecore.local"
    );
  });

  const standingsMatchId = randomUUID();
  insertMatch.run(
    standingsMatchId,
    tournamentId,
    "Grand Finals Standings",
    0,
    "Other",
    "completed",
    "2025-07-06T19:05:00+05:30",
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
    const canonicalName = aliasToTeamName.get(standing.teamName);
    const teamId = canonicalName ? teamIds.get(canonicalName) : null;
    if (!teamId) continue;
    insertResult.run(
      randomUUID(),
      standingsMatchId,
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

  const deleteArticle = db.prepare("DELETE FROM news_articles WHERE title = ?");
  const insertArticle = db.prepare(`
    INSERT INTO news_articles (
      id, title, content, category, thumbnail_url, featured, game, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const article of articles) {
    deleteArticle.run(article.title);
    insertArticle.run(randomUUID(), article.title, article.content, article.category, null, article.featured, article.game, now, now, "admin@stagecore.local");
  }

  recomputeTeamStats();
});

tx();

console.log("Imported BMPS 2025 tournament, participants, schedule, standings, rankings, and article.");

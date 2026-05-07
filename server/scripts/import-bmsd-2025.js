import { randomUUID } from "node:crypto";
import { db, recomputeTeamStats } from "../db.js";

const now = new Date().toISOString();

const tournament = {
  name: "Battlegrounds Mobile India Showdown 2025",
  game: "BGMI",
  tier: "A-Tier",
  status: "completed",
  prize_pool: "₹1,00,00,000",
  start_date: "2025-09-18",
  end_date: "2025-10-12",
  max_teams: 48,
  banner_url: "/images/bmsd-2025.png",
  description:
    "Battlegrounds Mobile India Showdown 2025 was the second edition of BMSD, organized by KRAFTON with a ₹1,00,00,000 prize pool. The event ran from September 18 to October 12, 2025 and concluded with Orangutan winning the Grand Finals.",
  format_overview:
    "BMSD 2025 featured 48 invited teams split across Lower Bracket, Upper Bracket, Quarter Finals, Semi Finals, Survival Stage, and an 18-match Grand Finals. The champion qualified for PUBG Mobile Global Championship 2025: The Gauntlet, while the top 8 qualified for Battlegrounds Mobile International Cup 2025.",
  rules:
    "Match scoring: 1st 10, 2nd 6, 3rd 5, 4th 4, 5th 3, 6th 2, 7th-8th 1, 9th-16th 0. Each elimination gives 1 point. Tiebreakers: total WWCDs, then placement points, then elimination points, then the best placement in the most recent match.",
  calendar: [
    { week: "Sep 18 - Sep 21", label: "Lower Bracket" },
    { week: "Sep 22 - Sep 25", label: "Upper Bracket" },
    { week: "Sep 26 - Sep 29", label: "Quarter Finals" },
    { week: "Oct 4 - Oct 7", label: "Semi Finals" },
    { week: "Oct 8 - Oct 9", label: "Survival Stage" },
    { week: "Oct 10 - Oct 12", label: "Grand Finals" },
  ],
  prize_breakdown: [
    { placement: "1st", team: "Orangutan", inr: "3,000,000", usd: "33,802.32" },
    { placement: "2nd", team: "K9 Esports", inr: "1,500,000", usd: "16,901.16" },
    { placement: "3rd", team: "Team SouL", inr: "1,000,000", usd: "11,267.44" },
    { placement: "4th", team: "True Rippers", inr: "750,000", usd: "8,450.58" },
    { placement: "5th", team: "Nebula Esports", inr: "625,000", usd: "7,042.15" },
    { placement: "6th", team: "Gods Reign", inr: "450,000", usd: "5,070.35" },
    { placement: "7th", team: "MYSTERIOUS 4", inr: "375,000", usd: "4,225.29" },
    { placement: "8th", team: "Madkings Esports", inr: "375,000", usd: "4,225.29" },
    { placement: "9th", team: "FS Esports", inr: "250,000", usd: "2,816.86" },
    { placement: "10th", team: "8Bit", inr: "250,000", usd: "2,816.86" },
    { placement: "11th", team: "Team Aryan", inr: "200,000", usd: "2,253.49" },
    { placement: "12th", team: "Victores Sumus", inr: "200,000", usd: "2,253.49" },
    { placement: "13th", team: "GodLike Esports", inr: "150,000", usd: "1,690.12" },
    { placement: "14th", team: "Cincinnati Kids", inr: "150,000", usd: "1,690.12" },
    { placement: "15th", team: "White Walkers", inr: "125,000", usd: "1,408.43" },
    { placement: "16th", team: "Vasista Esports", inr: "125,000", usd: "1,408.43" },
    { placement: "17th", team: "Blitz Esports", inr: "-", usd: "-" },
    { placement: "18th", team: "Autobotz Esports", inr: "-", usd: "-" },
    { placement: "19th", team: "Genesis Esports", inr: "-", usd: "-" },
    { placement: "20th", team: "First Curiosity", inr: "-", usd: "-" },
    { placement: "21st", team: "Meta Ninza", inr: "-", usd: "-" },
    { placement: "22nd", team: "Likitha Esports", inr: "-", usd: "-" },
    { placement: "23rd", team: "Los Hermanos Esports", inr: "-", usd: "-" },
    { placement: "24th", team: "Phoenix Esports", inr: "-", usd: "-" },
    { placement: "25th", team: "Revenant XSpark", inr: "-", usd: "-" },
    { placement: "26th", team: "Sinewy Esports", inr: "-", usd: "-" },
    { placement: "27th", team: "Wyld Fangs", inr: "-", usd: "-" },
    { placement: "28th", team: "4TR Official", inr: "-", usd: "-" },
    { placement: "29th", team: "Medal Esports", inr: "-", usd: "-" },
    { placement: "30th", team: "Troy Tamilans Esports", inr: "-", usd: "-" },
    { placement: "31st", team: "NoNx Esports", inr: "-", usd: "-" },
    { placement: "32nd", team: "Bot Army", inr: "-", usd: "-" },
    { placement: "33rd", team: "Marcos Gaming", inr: "-", usd: "-" },
    { placement: "34th", team: "Reckoning Esports", inr: "-", usd: "-" },
    { placement: "35th", team: "Gods Omen", inr: "-", usd: "-" },
    { placement: "36th", team: "EvoX Esports", inr: "-", usd: "-" },
    { placement: "37th", team: "Team Tamilas", inr: "-", usd: "-" },
    { placement: "38th", team: "Gravity Esports", inr: "-", usd: "-" },
    { placement: "39th", team: "GENxFM Esports", inr: "-", usd: "-" },
    { placement: "40th", team: "Team Versatile", inr: "-", usd: "-" },
    { placement: "41st", team: "Rider Esports", inr: "-", usd: "-" },
    { placement: "42nd", team: "2OP Official", inr: "-", usd: "-" },
    { placement: "43rd", team: "GlitchXReborn", inr: "-", usd: "-" },
    { placement: "44th", team: "StreamO", inr: "-", usd: "-" },
    { placement: "45th", team: "Altitude", inr: "-", usd: "-" },
    { placement: "46th", team: "TEAM iNSANE", inr: "-", usd: "-" },
    { placement: "47th", team: "Alibaba Raiders", inr: "-", usd: "-" },
    { placement: "48th", team: "TWOB", inr: "-", usd: "-" },
  ],
  awards: [
    { title: "MVP", player: "NinjaBoi", team: "K9 Esports", country: "India", inr: "200,000", usd: "2,253.49" },
    { title: "Finals MVP", player: "SnowJOD", team: "MYSTERIOUS 4", country: "India", inr: "100,000", usd: "1,126.74" },
    { title: "Best IGL", player: "Aaru", team: "Orangutan", country: "India", inr: "75,000", usd: "845.06" },
    { title: "Best Clutch", player: "SnowJOD", team: "MYSTERIOUS 4", country: "India", inr: "50,000", usd: "563.37" },
    { title: "Fan Fav. Player", player: "JONATHAN", team: "GodLike Esports", country: "India", inr: "50,000", usd: "563.37" },
  ],
  participants: [
    { placement: 1, team: "GodLike Esports", phase: "Upper Bracket Invited", players: ["Punkk", "ADMINO", "JONATHAN", "Godz", "SIMP"] },
    { placement: 2, team: "8Bit", phase: "Upper Bracket Invited", players: ["Saumraj", "Spower", "AquaNox", "Raiden", "BeastOG"] },
    { placement: 3, team: "True Rippers", phase: "Upper Bracket Invited", players: ["Jelly", "KioLmao", "Harsh", "Hydro"] },
    { placement: 4, team: "Likitha Esports", phase: "Upper Bracket Invited", players: ["Smoker46", "XoXo45", "Starboyy", "Inferno", "Magic"] },
    { placement: 5, team: "Gods Omen", phase: "Upper Bracket Invited", players: ["LUCIFER", "BEAST04", "ARTO", "SHOGUN", "MAX"] },
    { placement: 6, team: "Team Aryan", phase: "Upper Bracket Invited", players: ["Aryan", "Devotee", "Syrax", "Henry"] },
    { placement: 7, team: "Los Hermanos Esports", phase: "Upper Bracket Invited", players: ["ShaDow", "Kaalan", "Zhyrx", "SpyOp", "Evil"] },
    { placement: 8, team: "Orangutan", phase: "Upper Bracket Invited", players: ["Aaru", "AKop", "WizzGOD", "Attanki"] },
    { placement: 9, team: "Marcos Gaming", phase: "Upper Bracket Invited", players: ["StoneBGMI", "Nodii", "W1ZARD", "BadOP", "GyroGod"] },
    { placement: 10, team: "4TR Official", phase: "Upper Bracket Invited", players: ["Morty", "PainIsLive", "ZGOD", "InfGod", "AKOP", "Utkarsh"] },
    { placement: 11, team: "Gods Reign", phase: "Upper Bracket Invited", players: ["Destro", "Justin", "DeltaPG", "Neyo"] },
    { placement: 12, team: "K9 Esports", phase: "Upper Bracket Invited", players: ["Omega", "NinjaBoi", "Slug", "Beast"] },
    { placement: 13, team: "Team SouL", phase: "Upper Bracket Invited", players: ["NakuL", "Goblin", "LEGIT", "Jokerr", "Thunder"] },
    { placement: 14, team: "EvoX Esports", phase: "Upper Bracket Invited", players: ["PmwiIGL", "OwenOG", "Archit", "Aadi07", "Executor"] },
    { placement: 15, team: "Reckoning Esports", phase: "Upper Bracket Invited", players: ["Dionysus", "Javin", "Flawk", "Ninjuu", "Shubh"] },
    { placement: 16, team: "Cincinnati Kids", phase: "Upper Bracket Invited", players: ["Juicy", "Saumay", "Skipz", "Zeref", "Zin"] },
    { placement: 17, team: "Medal Esports", phase: "Upper Bracket Invited", players: ["VeNoM", "ALTU", "A1mbot", "Termi"] },
    { placement: 18, team: "Genesis Esports", phase: "Upper Bracket Invited", players: ["GravityJOD", "HunterZ", "ViPER", "Zap", "Yash"] },
    { placement: 19, team: "Victores Sumus", phase: "Upper Bracket Invited", players: ["Owais", "Mafia36", "Shayaan", "SAM", "Ninzae"] },
    { placement: 20, team: "FS Esports", phase: "Upper Bracket Invited", players: ["Roman", "Levi", "Lovish", "Godx", "Sarvit"] },
    { placement: 21, team: "NoNx Esports", phase: "Upper Bracket Invited", players: ["Kanha", "Rapido", "Anonymous", "Kalyug", "VipeR"] },
    { placement: 22, team: "First Curiosity", phase: "Upper Bracket Invited", players: ["DreamS", "GamlaBoy", "AnujTooOP", "Crypto", "Insidious"] },
    { placement: 23, team: "Meta Ninza", phase: "Upper Bracket Invited", players: ["DragonOP", "PokoWNL", "BeardBaba", "Reaper", "Rico"] },
    { placement: 24, team: "Bot Army", phase: "Upper Bracket Invited", players: ["Lionn", "Pratik", "Wanted", "Monty", "FraggerNUB"] },
    { placement: 25, team: "Blitz Esports", phase: "Lower Bracket Invited", players: ["SarwarOG", "ChandanOP", "SOHAM", "Nova21", "Sourav"] },
    { placement: 26, team: "Phoenix Esports", phase: "Lower Bracket Invited", players: ["Ash", "Veyron", "PHANTOM", "Shirajj"] },
    { placement: 27, team: "Gravity Esports", phase: "Lower Bracket Invited", players: ["Draxxy", "Knight", "Devil03", "Sujal", "OSIRIS"] },
    { placement: 28, team: "Vasista Esports", phase: "Lower Bracket Invited", players: ["Hector", "ScaryJod", "SahilOPAF", "ProBGMI", "Jasleen"] },
    { placement: 29, team: "Rider Esports", phase: "Lower Bracket Invited", players: ["FRAGGER16", "FAMEeeee", "XzisT", "SyedOP", "Kyllo"] },
    { placement: 30, team: "StreamO", phase: "Lower Bracket Invited", players: ["Sporta", "Ragnar", "Vampi", "GautamFL", "SpiritOP"] },
    { placement: 31, team: "GENxFM Esports", phase: "Lower Bracket Invited", players: ["GOKU", "HONEY", "Dope1", "DhruvOG", "Sheek"] },
    { placement: 32, team: "Altitude", phase: "Lower Bracket Invited", players: ["Godz", "Cloudz", "Lazyy", "PrimeOG", "BunnY"] },
    { placement: 33, team: "Revenant XSpark", phase: "Lower Bracket Invited", players: ["SENSEI", "Tracegod", "FurY", "Fierce", "Goten"] },
    { placement: 34, team: "Team Tamilas", phase: "Lower Bracket Invited", players: ["MrIGL", "FoxOP", "Lens77", "AIMGOD"] },
    { placement: 35, team: "GlitchXReborn", phase: "Lower Bracket Invited", players: ["Avii", "Ralph", "Jimjam", "Utkarsh", "Fanta"] },
    { placement: 36, team: "TWOB", phase: "Lower Bracket Invited", players: ["Aditya", "Pukar", "Mac", "JatinOG", "RageGod"] },
    { placement: 37, team: "Team Versatile", phase: "Lower Bracket Invited", players: ["Shadow7", "Sarang", "NinjaJOD", "Rony"] },
    { placement: 38, team: "TEAM iNSANE", phase: "Lower Bracket Invited", players: ["EGGY", "DREAMS03", "JDGamingYT", "SpiderJOD"] },
    { placement: 39, team: "2OP Official", phase: "Lower Bracket Invited", players: ["Topdawg", "Botfire", "Liability", "Shorty", "Lucky2Nub"] },
    { placement: 40, team: "Alibaba Raiders", phase: "Lower Bracket Invited", players: ["Kris", "Tiger", "Joyesh", "Scuba"] },
    { placement: 41, team: "Sinewy Esports", phase: "Lower Bracket Invited", players: ["Moksh", "Vishu9", "Turbo", "NinjA", "RexBoy13"] },
    { placement: 42, team: "MYSTERIOUS 4", phase: "Lower Bracket Invited", players: ["Omega", "Bunny", "HEROO", "SnowJOD", "NAMAN"] },
    { placement: 43, team: "Troy Tamilans Esports", phase: "Lower Bracket Invited", players: ["RanveerOG", "Pekka", "Auxin", "Akshu", "Dazzle"] },
    { placement: 44, team: "White Walkers", phase: "Lower Bracket Invited", players: ["FLASH", "Arjun", "VEGITO", "PSYCHO", "Arther"] },
    { placement: 45, team: "Madkings Esports", phase: "Lower Bracket Invited", players: ["SHADOW", "ClutchGod", "Apollo", "PRO", "FRAGGER"] },
    { placement: 46, team: "Nebula Esports", phase: "Lower Bracket Invited", players: ["Aadi", "KRATOS", "Phoenix", "KnowMe", "Ryu"] },
    { placement: 47, team: "Autobotz Esports", phase: "Lower Bracket Invited", players: ["Areeb", "Toxic", "Ralphie", "RushBoy", "Lobster"] },
    { placement: 48, team: "Wyld Fangs", phase: "Lower Bracket Invited", players: ["Manya", "SPRAYGOD", "Saif", "WhiteTiger", "Troye"] },
  ],
  rankings: [
    {
      title: "BMSD MVP",
      columns: [
        { key: "points", label: "Points" },
        { key: "finishes", label: "Finishes" },
        { key: "damage", label: "Damage" },
        { key: "survivalTime", label: "Survival Time" },
        { key: "knocks", label: "Knocks" },
      ],
      entries: [
        { placement: 1, player: "NinjaBoi", team: "K9 Esports", points: 137, finishes: 95, damage: 17089, survivalTime: "17:45", knocks: 82 },
        { placement: 2, player: "AKop", team: "Orangutan", points: 127, finishes: 83, damage: 16864, survivalTime: "18:29", knocks: 74 },
        { placement: 3, player: "Goblin", team: "Team SouL", points: 120, finishes: 77, damage: 16479, survivalTime: "16:42", knocks: 73 },
        { placement: 4, player: "WizzGOD", team: "Orangutan", points: 119, finishes: 79, damage: 14371, survivalTime: "18:59", knocks: 80 },
        { placement: 5, player: "Beast", team: "K9 Esports", points: 117, finishes: 77, damage: 15360, survivalTime: "16:09", knocks: 75 },
      ],
    },
    {
      title: "BMSD FMVP",
      columns: [
        { key: "points", label: "Points" },
        { key: "finishes", label: "Finishes" },
        { key: "damage", label: "Damage" },
        { key: "survivalTime", label: "Survival Time" },
        { key: "knocks", label: "Knocks" },
      ],
      entries: [
        { placement: 1, player: "SnowJOD", team: "MYSTERIOUS 4", points: 251, finishes: 34, damage: 6486, survivalTime: "17:23", knocks: 34 },
        { placement: 2, player: "KRATOS", team: "Nebula Esports", points: 247, finishes: 34, damage: 6261, survivalTime: "20:08", knocks: 27 },
        { placement: 3, player: "AKop", team: "Orangutan", points: 238, finishes: 33, damage: 5943, survivalTime: "16:52", knocks: 31 },
        { placement: 4, player: "Hydro", team: "True Rippers", points: 233, finishes: 30, damage: 6239, survivalTime: "19:09", knocks: 29 },
        { placement: 5, player: "NinjaBoi", team: "K9 Esports", points: 221, finishes: 29, damage: 5412, survivalTime: "21:17", knocks: 26 },
      ],
    },
    {
      title: "Best IGL",
      entries: [
        { placement: 1, player: "Aaru", team: "Orangutan", rating: 1.29, avgPoints: 8.4, wwcd: 7, top5s: 22, teamSurvival: "18:21" },
        { placement: 2, player: "Jelly", team: "True Rippers", rating: 1.28, avgPoints: 7.64, wwcd: 6, top5s: 19, teamSurvival: "17:37" },
        { placement: 3, player: "Omega", team: "K9 Esports", rating: 1.28, avgPoints: 8.54, wwcd: 7, top5s: 20, teamSurvival: "16:55" },
        { placement: 4, player: "NakuL", team: "Team SouL", rating: 1.2, avgPoints: 7.54, wwcd: 4, top5s: 15, teamSurvival: "17:05" },
        { placement: 5, player: "Bunny", team: "MYSTERIOUS 4", rating: 1.14, avgPoints: 6.74, wwcd: 4, top5s: 17, teamSurvival: "17:40" },
      ],
    },
  ],
  stages: [
    {
      name: "Lower Bracket",
      order: 1,
      status: "completed",
      teamCount: 24,
      summary:
        "September 18th - 21st, 2025. 24 invited teams were divided into 3 groups of 8 in a double round-robin format. Each team played 16 matches, with the top 12 advancing to Quarter Finals.",
    },
    {
      name: "Upper Bracket",
      order: 2,
      status: "completed",
      teamCount: 24,
      summary:
        "September 22nd - 25th, 2025. 24 invited teams played 16 matches each in 3 groups of 8. The top 12 advanced to Semi Finals and the other 12 dropped to Quarter Finals.",
    },
    {
      name: "Quarter Finals",
      order: 3,
      status: "completed",
      teamCount: 24,
      summary:
        "September 26th - 29th, 2025. 12 Lower Bracket teams joined 12 Upper Bracket teams in another 16-match double round-robin stage. The top 12 advanced to Semi Finals.",
    },
    {
      name: "Semi Finals",
      order: 4,
      status: "completed",
      teamCount: 24,
      summary:
        "October 4th - 7th, 2025. 24 teams played 16 matches each. The top 8 advanced to Grand Finals and the remaining 16 dropped to Survival Stage.",
    },
    {
      name: "Survival Stage",
      order: 5,
      status: "completed",
      teamCount: 16,
      summary:
        "October 8th - 9th, 2025. 16 teams played 12 matches over two days, with the top 8 taking the final Grand Finals spots.",
    },
    {
      name: "Grand Finals",
      order: 6,
      status: "completed",
      teamCount: 16,
      summary:
        "October 10th - 12th, 2025. 16 teams played 18 matches, with Orangutan winning the title on 147 total points.",
      standings: [
        { placement: 1, team: "OG", fullTeam: "iQOO ORANGUTAN", matches: 18, wwcd: 4, pos: 55, elimins: 92, points: 147, outcome: "Champion" },
        { placement: 2, team: "K9", fullTeam: "K9 Esports", matches: 18, wwcd: 3, pos: 62, elimins: 80, points: 142, outcome: "Runner-up" },
        { placement: 3, team: "SOUL", fullTeam: "iQOO SOUL", matches: 18, wwcd: 1, pos: 40, elimins: 94, points: 134, outcome: "3rd Place" },
        { placement: 4, team: "TR", fullTeam: "Infinix TrueRippers", matches: 18, wwcd: 2, pos: 46, elimins: 77, points: 123, outcome: "Top 4" },
        { placement: 5, team: "NBLA", fullTeam: "NEBULA ESPORTS", matches: 18, wwcd: 2, pos: 46, elimins: 74, points: 120, outcome: "Top 8" },
        { placement: 6, team: "GDR", fullTeam: "OnePlus Gods Reign", matches: 18, wwcd: 2, pos: 45, elimins: 75, points: 120, outcome: "Top 8" },
        { placement: 7, team: "M4", fullTeam: "mysterious4 Esports", matches: 18, wwcd: 1, pos: 23, elimins: 96, points: 119, outcome: "Top 8" },
        { placement: 8, team: "MAD", fullTeam: "Madkings", matches: 18, wwcd: 1, pos: 35, elimins: 77, points: 112, outcome: "Top 8" },
        { placement: 9, team: "FS", fullTeam: "FS eSports", matches: 18, wwcd: 0, pos: 34, elimins: 70, points: 104, outcome: "Finalist" },
        { placement: 10, team: "8BIT", fullTeam: "iQOO8BIT", matches: 18, wwcd: 1, pos: 33, elimins: 66, points: 99, outcome: "Finalist" },
        { placement: 11, team: "AX", fullTeam: "Team AX", matches: 18, wwcd: 1, pos: 34, elimins: 61, points: 95, outcome: "Finalist" },
        { placement: 12, team: "VS", fullTeam: "Victores Sumus", matches: 18, wwcd: 0, pos: 32, elimins: 61, points: 93, outcome: "Finalist" },
        { placement: 13, team: "GODL", fullTeam: "Hero Xtreme Godlike", matches: 18, wwcd: 0, pos: 28, elimins: 59, points: 87, outcome: "Finalist" },
        { placement: 14, team: "CK", fullTeam: "OnePlus Cincinnati Kids", matches: 18, wwcd: 0, pos: 27, elimins: 60, points: 87, outcome: "Finalist" },
        { placement: 15, team: "WW", fullTeam: "White Walkers", matches: 18, wwcd: 0, pos: 19, elimins: 67, points: 86, outcome: "Finalist" },
        { placement: 16, team: "VST", fullTeam: "Vasista Esports", matches: 18, wwcd: 0, pos: 17, elimins: 49, points: 66, outcome: "Finalist" },
      ],
    },
  ],
};

const teams = [
  { name: "GodLike Esports", tag: "GODL", players: ["Punkk", "ADMINO", "JONATHAN", "Godz", "SIMP"] },
  { name: "8Bit", tag: "8BIT", players: ["Saumraj", "Spower", "AquaNox", "Raiden", "BeastOG"] },
  { name: "True Rippers", tag: "TR", players: ["Jelly", "KioLmao", "Harsh", "Hydro"] },
  { name: "Likitha Esports", tag: "LE", players: ["Smoker46", "XoXo45", "Starboyy", "Inferno", "Magic"] },
  { name: "Gods Omen", tag: "GOM", players: ["LUCIFER", "BEAST04", "ARTO", "SHOGUN", "MAX"] },
  { name: "Team Aryan", tag: "AX", players: ["Aryan", "Devotee", "Syrax", "Henry"] },
  { name: "Los Hermanos Esports", tag: "LH", players: ["ShaDow", "Kaalan", "Zhyrx", "SpyOp", "Evil"] },
  { name: "Orangutan", tag: "OG", players: ["Aaru", "AKop", "WizzGOD", "Attanki"] },
  { name: "Marcos Gaming", tag: "MG", players: ["StoneBGMI", "Nodii", "W1ZARD", "BadOP", "GyroGod"] },
  { name: "4TR Official", tag: "4TR", players: ["Morty", "PainIsLive", "ZGOD", "InfGod", "AKOP", "Utkarsh"] },
  { name: "Gods Reign", tag: "GDR", players: ["Destro", "Justin", "DeltaPG", "Neyo"] },
  { name: "K9 Esports", tag: "K9", players: ["Omega", "NinjaBoi", "Slug", "Beast"] },
  { name: "Team SouL", tag: "SOUL", players: ["NakuL", "Goblin", "LEGIT", "Jokerr", "Thunder"] },
  { name: "EvoX Esports", tag: "EVOX", players: ["PmwiIGL", "OwenOG", "Archit", "Aadi07", "Executor"] },
  { name: "Reckoning Esports", tag: "RGE", players: ["Dionysus", "Javin", "Flawk", "Ninjuu", "Shubh"] },
  { name: "Cincinnati Kids", tag: "CK", players: ["Juicy", "Saumay", "Skipz", "Zeref", "Zin"] },
  { name: "Medal Esports", tag: "MDL", players: ["VeNoM", "ALTU", "A1mbot", "Termi"] },
  { name: "Genesis Esports", tag: "GEN", players: ["GravityJOD", "HunterZ", "ViPER", "Zap", "Yash"] },
  { name: "Victores Sumus", tag: "VS", players: ["Owais", "Mafia36", "Shayaan", "SAM", "Ninzae"] },
  { name: "FS Esports", tag: "FS", players: ["Roman", "Levi", "Lovish", "Godx", "Sarvit"] },
  { name: "NoNx Esports", tag: "NONX", players: ["Kanha", "Rapido", "Anonymous", "Kalyug", "VipeR"] },
  { name: "First Curiosity", tag: "FC", players: ["DreamS", "GamlaBoy", "AnujTooOP", "Crypto", "Insidious"] },
  { name: "Meta Ninza", tag: "MZ", players: ["DragonOP", "PokoWNL", "BeardBaba", "Reaper", "Rico"] },
  { name: "Bot Army", tag: "BAE", players: ["Lionn", "Pratik", "Wanted", "Monty", "FraggerNUB"] },
  { name: "Blitz Esports", tag: "BLITZ", players: ["SarwarOG", "ChandanOP", "SOHAM", "Nova21", "Sourav"] },
  { name: "Phoenix Esports", tag: "PNX", players: ["Ash", "Veyron", "PHANTOM", "Shirajj"] },
  { name: "Gravity Esports", tag: "GRAV", players: ["Draxxy", "Knight", "Devil03", "Sujal", "OSIRIS"] },
  { name: "Vasista Esports", tag: "VE", players: ["Hector", "ScaryJod", "SahilOPAF", "ProBGMI", "Jasleen"] },
  { name: "Rider Esports", tag: "RID", players: ["FRAGGER16", "FAMEeeee", "XzisT", "SyedOP", "Kyllo"] },
  { name: "StreamO", tag: "STMO", players: ["Sporta", "Ragnar", "Vampi", "GautamFL", "SpiritOP"] },
  { name: "GENxFM Esports", tag: "GFM", players: ["GOKU", "HONEY", "Dope1", "DhruvOG", "Sheek"] },
  { name: "Altitude", tag: "ALT", players: ["Godz", "Cloudz", "Lazyy", "PrimeOG", "BunnY"] },
  { name: "Revenant XSpark", tag: "RNTX", players: ["SENSEI", "Tracegod", "FurY", "Fierce", "Goten"] },
  { name: "Team Tamilas", tag: "TT", players: ["MrIGL", "FoxOP", "Lens77", "AIMGOD"] },
  { name: "GlitchXReborn", tag: "GXR", players: ["Avii", "Ralph", "Jimjam", "Utkarsh", "Fanta"] },
  { name: "TWOB", tag: "TWOB", players: ["Aditya", "Pukar", "Mac", "JatinOG", "RageGod"] },
  { name: "Team Versatile", tag: "VXT", players: ["Shadow7", "Sarang", "NinjaJOD", "Rony"] },
  { name: "TEAM iNSANE", tag: "TIE", players: ["EGGY", "DREAMS03", "JDGamingYT", "SpiderJOD"] },
  { name: "2OP Official", tag: "2OP", players: ["Topdawg", "Botfire", "Liability", "Shorty", "Lucky2Nub"] },
  { name: "Alibaba Raiders", tag: "AR", players: ["Kris", "Tiger", "Joyesh", "Scuba"] },
  { name: "Sinewy Esports", tag: "SNWY", players: ["Moksh", "Vishu9", "Turbo", "NinjA", "RexBoy13"] },
  { name: "MYSTERIOUS 4", tag: "M4", players: ["Omega", "Bunny", "HEROO", "SnowJOD", "NAMAN"] },
  { name: "Troy Tamilans Esports", tag: "TROY", players: ["RanveerOG", "Pekka", "Auxin", "Akshu", "Dazzle"] },
  { name: "White Walkers", tag: "WW", players: ["FLASH", "Arjun", "VEGITO", "PSYCHO", "Arther"] },
  { name: "Madkings Esports", tag: "MAD", players: ["SHADOW", "ClutchGod", "Apollo", "PRO", "FRAGGER"] },
  { name: "Nebula Esports", tag: "NBLA", players: ["Aadi", "KRATOS", "Phoenix", "KnowMe", "Ryu"] },
  { name: "Autobotz Esports", tag: "ABZ", players: ["Areeb", "Toxic", "Ralphie", "RushBoy", "Lobster"] },
  { name: "Wyld Fangs", tag: "WF", players: ["Manya", "SPRAYGOD", "Saif", "WhiteTiger", "Troye"] },
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
  "2025-10-10T15:30:00+05:30",
  "2025-10-10T16:15:00+05:30",
  "2025-10-10T17:00:00+05:30",
  "2025-10-10T17:40:00+05:30",
  "2025-10-10T18:20:00+05:30",
  "2025-10-10T19:05:00+05:30",
  "2025-10-11T15:30:00+05:30",
  "2025-10-11T16:15:00+05:30",
  "2025-10-11T17:00:00+05:30",
  "2025-10-11T17:40:00+05:30",
  "2025-10-11T18:20:00+05:30",
  "2025-10-11T19:05:00+05:30",
  "2025-10-12T15:30:00+05:30",
  "2025-10-12T16:15:00+05:30",
  "2025-10-12T17:00:00+05:30",
  "2025-10-12T17:40:00+05:30",
  "2025-10-12T18:20:00+05:30",
  "2025-10-12T19:05:00+05:30",
];

const mapRotation = ["Rondo", "Erangel", "Erangel", "Erangel", "Miramar", "Miramar"];

const articles = [
  {
    title: "Orangutan win BMSD 2025 and book PMGC spot",
    content:
      "Orangutan won BMSD 2025 with 147 total points in the Grand Finals, finishing ahead of K9 Esports and Team SouL. The victory secured a PMGC 2025: The Gauntlet spot, while the top 8 teams qualified for BMIC 2025.",
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
    ["iQOO ORANGUTAN", "Orangutan"],
    ["K9 Esports", "K9 Esports"],
    ["iQOO SOUL", "Team SouL"],
    ["Infinix TrueRippers", "True Rippers"],
    ["NEBULA ESPORTS", "Nebula Esports"],
    ["OnePlus Gods Reign", "Gods Reign"],
    ["mysterious4 Esports", "MYSTERIOUS 4"],
    ["Madkings", "Madkings Esports"],
    ["FS eSports", "FS Esports"],
    ["iQOO8BIT", "8Bit"],
    ["Team AX", "Team Aryan"],
    ["Victores Sumus", "Victores Sumus"],
    ["Hero Xtreme Godlike", "GodLike Esports"],
    ["OnePlus Cincinnati Kids", "Cincinnati Kids"],
    ["White Walkers", "White Walkers"],
    ["Vasista Esports", "Vasista Esports"],
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
    "2025-10-12T19:05:00+05:30",
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

console.log("Imported BMSD 2025 tournament, participants, schedule, standings, rankings, and article.");

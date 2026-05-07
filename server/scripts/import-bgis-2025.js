import { randomUUID } from "node:crypto";
import { db, recomputeTeamStats } from "../db.js";

const now = new Date().toISOString();

const tournament = {
  name: "Battlegrounds Mobile India Series 2025",
  game: "BGMI",
  tier: "A-Tier",
  status: "completed",
  prize_pool: "₹3,21,00,000",
  start_date: "2025-02-16",
  end_date: "2025-04-27",
  max_teams: 1024,
  banner_url: "/images/bgis-2025.png",
  description:
    "Battlegrounds Mobile India Series 2025 was the fourth edition of BGIS, organized by KRAFTON with the prize pool growing from ₹2,00,00,000 to ₹3,21,00,000 through the in-game BGIS crate. The event ran from February 16 to April 27, 2025 and concluded with Team Versatile winning the Kolkata Grand Finals.",
  format_overview:
    "BGIS 2025 started with 1024 teams and progressed through Round 1, Round 2, Round 3, Round 4, Quarter Finals, Wildcard, Semi Finals Week 1, Semi Finals Week 2, and an 18-match Grand Finals in Kolkata.",
  rules:
    "Match scoring: 1st 10, 2nd 6, 3rd 5, 4th 4, 5th 3, 6th 2, 7th-8th 1, 9th-16th 0. Each elimination gives 1 point. Tiebreakers: total WWCDs, then placement points, then elimination points, then the best placement in the most recent match.",
  calendar: [
    { week: "Feb 16 - Feb 23", label: "Round 1" },
    { week: "Feb 27 - Mar 2", label: "Round 2" },
    { week: "Mar 6 - Mar 9", label: "Round 3" },
    { week: "Mar 11 - Mar 16", label: "Round 4" },
    { week: "Mar 20 - Mar 23", label: "Quarter Finals" },
    { week: "Mar 24 - Mar 27", label: "Wildcard" },
    { week: "Mar 29 - Apr 2", label: "Semi Finals Week 1" },
    { week: "Apr 3 - Apr 6", label: "Semi Finals Week 2" },
    { week: "Apr 25 - Apr 27", label: "Grand Finals" },
  ],
  prize_breakdown: [
    { placement: "1st", team: "Team Versatile", inr: "6,960,000", usd: "81,513.29" },
    { placement: "2nd", team: "GodLike Esports", inr: "3,720,000", usd: "43,567.45" },
    { placement: "3rd", team: "Orangutan", inr: "2,600,000", usd: "30,450.37" },
    { placement: "4th", team: "Reckoning Esports", inr: "1,980,000", usd: "23,189.13" },
    { placement: "5th", team: "True Rippers", inr: "1,670,000", usd: "19,558.50" },
    { placement: "6th", team: "SOA Esports", inr: "1,320,000", usd: "15,459.42" },
    { placement: "7th", team: "Cincinnati Kids", inr: "1,110,000", usd: "12,999.96" },
    { placement: "8th", team: "Medal Esports", inr: "1,110,000", usd: "12,999.96" },
    { placement: "9th", team: "FS Esports", inr: "860,000", usd: "10,072.04" },
    { placement: "10th", team: "Bot Army", inr: "860,000", usd: "10,072.04" },
    { placement: "11th", team: "Team RedXRoss", inr: "760,000", usd: "8,900.88" },
    { placement: "12th", team: "Genesis Esports", inr: "760,000", usd: "8,900.88" },
    { placement: "13th", team: "Rivalry NRI", inr: "660,000", usd: "7,729.71" },
    { placement: "14th", team: "THWxNonx Esports", inr: "660,000", usd: "7,729.71" },
    { placement: "15th", team: "Team SouL", inr: "610,000", usd: "7,144.12" },
    { placement: "16th", team: "Hades H4K", inr: "610,000", usd: "7,144.12" },
    { placement: "17th", team: "Phoenix Esports", inr: "300,000", usd: "3,513.50" },
    { placement: "18th", team: "Vasista Esports", inr: "300,000", usd: "3,513.50" },
    { placement: "19th", team: "Rider Esports", inr: "300,000", usd: "3,513.50" },
    { placement: "20th", team: "Wobble Gaming", inr: "300,000", usd: "3,513.50" },
    { placement: "21st", team: "Hail Inferno Squad", inr: "300,000", usd: "3,513.50" },
    { placement: "22nd", team: "Altitude", inr: "300,000", usd: "3,513.50" },
    { placement: "23rd", team: "Likitha Esports", inr: "300,000", usd: "3,513.50" },
    { placement: "24th", team: "Revenant XSpark", inr: "300,000", usd: "3,513.50" },
    { placement: "25th", team: "8Bit", inr: "300,000", usd: "3,513.50" },
    { placement: "26th", team: "Hyderabad Hydras", inr: "300,000", usd: "3,513.50" },
    { placement: "27th", team: "Team Tamilas", inr: "300,000", usd: "3,513.50" },
    { placement: "28th", team: "GlitchXReborn", inr: "300,000", usd: "3,513.50" },
    { placement: "29th", team: "TWOB", inr: "300,000", usd: "3,513.50" },
    { placement: "30th", team: "Diesel Esports", inr: "300,000", usd: "3,513.50" },
    { placement: "31st", team: "Troy Tamilans Esports", inr: "300,000", usd: "3,513.50" },
    { placement: "32nd", team: "Mastermind Mavericks", inr: "300,000", usd: "3,513.50" },
  ],
  awards: [
    { title: "MVP", player: "ADMINO", team: "GodLike Esports", country: "India", inr: "300,000", usd: "3,513.50" },
    { title: "Finals MVP", player: "JONATHAN", team: "GodLike Esports", country: "India", inr: "150,000", usd: "1,756.75" },
    { title: "Best IGL", player: "Saumraj", team: "Team Versatile", country: "India", inr: "200,000", usd: "2,342.34" },
    { title: "Emerging Star", player: "ScaryJod", team: "Bot Army", country: "India", inr: "100,000", usd: "1,171.17" },
    { title: "Best Clutch", player: "Spower", team: "Team Versatile", country: "India", inr: "100,000", usd: "1,171.17" },
    { title: "Fan Fav. Player", player: "JONATHAN", team: "GodLike Esports", country: "India", inr: "100,000", usd: "1,171.17" },
    { title: "Fan Fav. Team", player: "GodLike Esports", team: "GodLike Esports", country: "", inr: "100,000", usd: "1,171.17" },
  ],
  participants: [
    { placement: 1, team: "Mastermind Mavericks", phase: "Quarter Finals", players: ["FilterOP", "Aadi07", "RixenIGL", "Maxmer", "Marcoo"] },
    { placement: 2, team: "Rivalry NRI", phase: "Quarter Finals", players: ["ChandanOP", "Gojo", "HITMAN", "SarwarOG", "Soham"] },
    { placement: 3, team: "Phoenix Esports", phase: "Quarter Finals", players: ["ALTU", "FurY", "A1mbot", "VeNoM", "PHANTOM"] },
    { placement: 4, team: "SOA Esports", phase: "Quarter Finals", players: ["Magic", "XoXo45", "Starboyy", "Smoker46"] },
    { placement: 5, team: "Team Tamilas", phase: "Quarter Finals", players: ["Rico", "FoxOP", "Maxy", "MrIGL", "MantyOP"] },
    { placement: 6, team: "True Rippers", phase: "Quarter Finals", players: ["Jelly", "Ninzae", "SAM", "KioLmao"] },
    { placement: 7, team: "8Bit", phase: "Quarter Finals", players: ["Owais", "Mafia36", "Ash", "Termi", "Omega"] },
    { placement: 8, team: "Hyderabad Hydras", phase: "Quarter Finals", players: ["Moksh", "Aj", "Turbo", "Ninjaa", "Dazzle"] },
    { placement: 9, team: "Team Versatile", phase: "Quarter Finals", players: ["Saumraj", "Spower", "Raiden", "AquaNox", "Troye", "Sheek"] },
    { placement: 10, team: "Genesis Esports", phase: "Quarter Finals", players: ["SHADOW", "Mac", "Apollo", "Sam", "Syrax"] },
    { placement: 11, team: "Revenant XSpark", phase: "Quarter Finals", players: ["Shadow7", "SPRAYGOD", "Sarang", "Jokerr", "SyedOP"] },
    { placement: 12, team: "Team RedXRoss", phase: "Quarter Finals", players: ["Phoenix", "Lucifer", "Arto", "Beast04"] },
    { placement: 13, team: "GlitchXReborn", phase: "Quarter Finals", players: ["Avii", "REXX", "Ralph", "AkshaT", "Clutcher"] },
    { placement: 14, team: "Medal Esports", phase: "Quarter Finals", players: ["Prince", "Sarvit", "LEGIT", "Thunder", "Amit"] },
    { placement: 15, team: "Hades H4K", phase: "Quarter Finals", players: ["Knight", "Sujal", "Devil03", "Draxxy"] },
    { placement: 16, team: "TWOB", phase: "Quarter Finals", players: ["ANONYMOUS", "Kanha", "Yashuu", "Superman"] },
    { placement: 17, team: "GodLike Esports", phase: "Wildcard", players: ["JONATHAN", "Punkk", "ADMINO", "SIMP", "Zap"] },
    { placement: 18, team: "Vasista Esports", phase: "Wildcard", players: ["Pukar", "Fierce", "GamlaBoy", "RageGod", "Tapatap"] },
    { placement: 19, team: "Cincinnati Kids", phase: "Wildcard", players: ["Mighty", "Flawk", "Juicy", "Aditya", "Ninjuu"] },
    { placement: 20, team: "Diesel Esports", phase: "Wildcard", players: ["SHYAM", "ALBY", "GokulWNL", "Paari", "Orlo"] },
    { placement: 21, team: "Likitha Esports", phase: "Wildcard", players: ["Hector", "Neyo", "Goblin", "VipeR", "Zhyrx"] },
    { placement: 22, team: "THWxNonx Esports", phase: "Wildcard", players: ["Roman", "Lovish", "RushBoy", "Levi"] },
    { placement: 23, team: "Team SouL", phase: "Wildcard", players: ["Manya", "Rony", "NakuL", "Saumay", "HunterZ"] },
    { placement: 24, team: "Reckoning Esports", phase: "Quarter Finals", players: ["ViPER", "GravityJOD", "Dionysus", "KyOya", "Shubh"] },
    { placement: 25, team: "Altitude", phase: "Wildcard", players: ["Godz", "Atomm", "Lazyy", "Cloudz"] },
    { placement: 26, team: "Bot Army", phase: "Wildcard", players: ["ScaryJod", "Hitler", "Devotee", "Monty"] },
    { placement: 27, team: "Wobble Gaming", phase: "Wildcard", players: ["Sporta", "Ragnar", "Jinzz", "Vampi"] },
    { placement: 28, team: "Hail Inferno Squad", phase: "Wildcard", players: ["JatinOG", "PmwiIGL", "Goten", "OwenOG", "OmegaOG"] },
    { placement: 29, team: "FS Esports", phase: "Wildcard", players: ["MAX", "Secrett", "Crypto", "Insidious", "DreamS"] },
    { placement: 30, team: "Rider Esports", phase: "Wildcard", players: ["DEVANSHOp", "XzisT", "FAMEeeee", "FRAGGER16"] },
    { placement: 31, team: "Orangutan", phase: "Wildcard", players: ["Aaru", "Attanki", "AK", "WizzGOD", "Veyron"] },
    { placement: 32, team: "Troy Tamilans Esports", phase: "Wildcard", players: ["RanveerOG", "INFERNO", "Hydro", "Pekka", "Shraudy"] },
  ],
  rankings: [
    {
      title: "BGIS MVP",
      columns: [
        { key: "points", label: "Points" },
        { key: "finishes", label: "Finishes" },
        { key: "damage", label: "Damage" },
        { key: "survivalTime", label: "Survival Time" },
        { key: "knocks", label: "Knocks" },
      ],
      entries: [
        { placement: 1, player: "ADMINO", team: "GodLike Esports", points: 154, finishes: 68, damage: 14304, survivalTime: "19:09", knocks: 66 },
        { placement: 2, player: "JONATHAN", team: "GodLike Esports", points: 146, finishes: 68, damage: 12209, survivalTime: "18:27", knocks: 60 },
        { placement: 3, player: "Spower", team: "Team Versatile", points: 144, finishes: 64, damage: 12828, survivalTime: "19:16", knocks: 54 },
        { placement: 4, player: "AK", team: "Orangutan", points: 141, finishes: 63, damage: 12463, survivalTime: "18:51", knocks: 54 },
        { placement: 5, player: "ViPER", team: "Reckoning Esports", points: 138, finishes: 60, damage: 12579, survivalTime: "19:06", knocks: 60 },
      ],
    },
    {
      title: "BGIS FMVP",
      columns: [
        { key: "finishes", label: "Finishes" },
        { key: "damage", label: "Damage" },
        { key: "survivalTime", label: "Survival Time" },
        { key: "knocks", label: "Knocks" },
      ],
      entries: [
        { placement: 1, player: "JONATHAN", team: "GodLike Esports", finishes: 38, damage: 6044, survivalTime: "18:50", knocks: 34 },
        { placement: 2, player: "ADMINO", team: "GodLike Esports", finishes: 37, damage: 7565, survivalTime: "18:55", knocks: 35 },
        { placement: 3, player: "Spower", team: "Team Versatile", finishes: 34, damage: 7133, survivalTime: "19:44", knocks: 28 },
        { placement: 4, player: "AK", team: "Orangutan", finishes: 34, damage: 6544, survivalTime: "19:46", knocks: 30 },
        { placement: 5, player: "ViPER", team: "Reckoning Esports", finishes: 31, damage: 5988, survivalTime: "20:11", knocks: 29 },
      ],
    },
  ],
  stages: [
    {
      name: "League Stage",
      order: 1,
      status: "completed",
      teamCount: 1024,
      summary:
        "Feb 16th - Apr 6th, 2025. BGIS 2025 began with 1024 teams and moved through Round 1, Round 2, Round 3, Round 4, Quarter Finals, Wildcard, and two Semi Finals weeks before the Grand Finals.",
    },
    {
      name: "Round 1",
      order: 2,
      status: "completed",
      teamCount: 1024,
      summary:
        "Feb 16th - 23rd, 2025. 1016 teams from in-game qualifiers plus the bottom 8 teams from The Grind Week 1 were split into 64 groups of 16. The top 7 from each group plus the top 48 remaining teams advanced.",
    },
    {
      name: "Round 2",
      order: 3,
      status: "completed",
      teamCount: 512,
      summary:
        "Feb 27th - Mar 2nd, 2025. 496 Round 1 teams were joined by the top 8 teams from The Grind Week 1 and the bottom 8 teams from The Grind Week 2. The top 240 teams advanced.",
    },
    {
      name: "Round 3",
      order: 4,
      status: "completed",
      teamCount: 256,
      summary:
        "Mar 6th - 9th, 2025. 240 Round 2 teams, the top 8 from The Grind Week 2, and the bottom 8 from The Grind Week 3 played for 112 Round 4 spots.",
    },
    {
      name: "Round 4",
      order: 5,
      status: "completed",
      teamCount: 128,
      summary:
        "Mar 11th, 12th, 15th and 16th, 2025. 112 Round 3 teams plus 16 The Grind teams competed for 56 Quarter Finals spots and 16 Wildcard berths.",
    },
    {
      name: "Quarter Finals",
      order: 6,
      status: "completed",
      teamCount: 64,
      summary:
        "Mar 20th - 23rd, 2025. 56 Round 4 qualifiers and 8 The Grind teams were split into 4 groups of 16. The top 16 overall advanced to Semi Finals Week 1 and the remaining 48 moved to Wildcard.",
    },
    {
      name: "Wildcard",
      order: 7,
      status: "completed",
      teamCount: 64,
      summary:
        "Mar 24th - 27th, 2025. 48 Quarter Finals teams and 16 Round 4 teams played a reshuffled 4-day Wildcard stage. The top 16 overall advanced to Semi Finals Week 1.",
    },
    {
      name: "Semi Finals Week 1",
      order: 8,
      status: "completed",
      teamCount: 32,
      summary:
        "Mar 29th - 30th and Apr 1st - 2nd, 2025. 32 teams were split into 4 groups of 8 in a round-robin format. Each team played 12 matches, with the top 8 advancing to the Grand Finals.",
    },
    {
      name: "Semi Finals Week 2",
      order: 9,
      status: "completed",
      teamCount: 24,
      summary:
        "Apr 3rd - 6th, 2025. 24 teams were divided into 3 groups of 8 in a double round-robin format. Each team played 16 matches, and the top 8 advanced to the Grand Finals.",
    },
    {
      name: "Grand Finals",
      order: 10,
      status: "completed",
      teamCount: 16,
      summary:
        "Apr 25th - 27th, 2025 at Biswa Bangla Mela Prangan, Kolkata. 16 teams played 18 matches, with Team Versatile winning the title on 169 total points.",
      standings: [
        { placement: 1, team: "VXT", fullTeam: "Team Versatile", matches: 18, wwcd: 3, pos: 68, elimins: 101, points: 169, outcome: "Champion" },
        { placement: 2, team: "GXG", fullTeam: "Hero Xtreme Godlike", matches: 18, wwcd: 1, pos: 35, elimins: 116, points: 152, outcome: "Runner-up" },
        { placement: 3, team: "OG", fullTeam: "iQOO ORANGUTAN", matches: 18, wwcd: 3, pos: 50, elimins: 93, points: 143, outcome: "3rd Place" },
        { placement: 4, team: "RGE", fullTeam: "iQOO RECKONING ESPORTS", matches: 18, wwcd: 1, pos: 52, elimins: 78, points: 132, outcome: "Top 4" },
        { placement: 5, team: "TR", fullTeam: "True Rippers x Infinix", matches: 18, wwcd: 0, pos: 45, elimins: 73, points: 118, outcome: "Top 8" },
        { placement: 6, team: "SOA", fullTeam: "SOA ESPORTS", matches: 18, wwcd: 1, pos: 48, elimins: 62, points: 110, outcome: "Top 8" },
        { placement: 7, team: "CK", fullTeam: "OnePlus Cincinnati Kids", matches: 18, wwcd: 2, pos: 46, elimins: 54, points: 100, outcome: "Top 8" },
        { placement: 8, team: "MDL", fullTeam: "Medal Esports", matches: 18, wwcd: 0, pos: 33, elimins: 65, points: 98, outcome: "Top 8" },
        { placement: 9, team: "FS", fullTeam: "FS eSports", matches: 18, wwcd: 1, pos: 37, elimins: 60, points: 97, outcome: "Finalist" },
        { placement: 10, team: "BA", fullTeam: "16Score x BotArmy", matches: 18, wwcd: 0, pos: 16, elimins: 76, points: 92, outcome: "Finalist" },
        { placement: 11, team: "4R", fullTeam: "Team RedXRoss", matches: 18, wwcd: 1, pos: 39, elimins: 48, points: 87, outcome: "Finalist" },
        { placement: 12, team: "GEN", fullTeam: "GENESIS ESPORTS", matches: 18, wwcd: 2, pos: 32, elimins: 54, points: 86, outcome: "Finalist" },
        { placement: 13, team: "RNRI", fullTeam: "RIVALRY x NRI", matches: 18, wwcd: 1, pos: 25, elimins: 53, points: 78, outcome: "Finalist" },
        { placement: 14, team: "NONX", fullTeam: "NoNx Esports", matches: 18, wwcd: 1, pos: 24, elimins: 49, points: 73, outcome: "Finalist" },
        { placement: 15, team: "SOUL", fullTeam: "iQOO Soul", matches: 18, wwcd: 1, pos: 16, elimins: 56, points: 72, outcome: "Finalist" },
        { placement: 16, team: "H4K", fullTeam: "TEAM H4K", matches: 18, wwcd: 0, pos: 10, elimins: 31, points: 41, outcome: "Finalist" },
      ],
    },
  ],
};

const teams = [
  { name: "Mastermind Mavericks", tag: "MMM", players: ["FilterOP", "Aadi07", "RixenIGL", "Maxmer", "Marcoo"] },
  { name: "Rivalry NRI", tag: "RNRI", players: ["ChandanOP", "Gojo", "HITMAN", "SarwarOG", "Soham"] },
  { name: "Phoenix Esports", tag: "PHX", players: ["ALTU", "FurY", "A1mbot", "VeNoM", "PHANTOM"] },
  { name: "SOA Esports", tag: "SOA", players: ["Magic", "XoXo45", "Starboyy", "Smoker46"] },
  { name: "Team Tamilas", tag: "TT", players: ["Rico", "FoxOP", "Maxy", "MrIGL", "MantyOP"] },
  { name: "True Rippers", tag: "TR", players: ["Jelly", "Ninzae", "SAM", "KioLmao"] },
  { name: "8Bit", tag: "8BIT", players: ["Owais", "Mafia36", "Ash", "Termi", "Omega"] },
  { name: "Hyderabad Hydras", tag: "HH", players: ["Moksh", "Aj", "Turbo", "Ninjaa", "Dazzle"] },
  { name: "Team Versatile", tag: "VXT", players: ["Saumraj", "Spower", "Raiden", "AquaNox", "Troye", "Sheek"] },
  { name: "Genesis Esports", tag: "GEN", players: ["SHADOW", "Mac", "Apollo", "Sam", "Syrax"] },
  { name: "Revenant XSpark", tag: "RXS", players: ["Shadow7", "SPRAYGOD", "Sarang", "Jokerr", "SyedOP"] },
  { name: "Team RedXRoss", tag: "4R", players: ["Phoenix", "Lucifer", "Arto", "Beast04"] },
  { name: "GlitchXReborn", tag: "GXR", players: ["Avii", "REXX", "Ralph", "AkshaT", "Clutcher"] },
  { name: "Medal Esports", tag: "MDL", players: ["Prince", "Sarvit", "LEGIT", "Thunder", "Amit"] },
  { name: "Hades H4K", tag: "H4K", players: ["Knight", "Sujal", "Devil03", "Draxxy"] },
  { name: "TWOB", tag: "TWOB", players: ["ANONYMOUS", "Kanha", "Yashuu", "Superman"] },
  { name: "GodLike Esports", tag: "GXG", players: ["JONATHAN", "Punkk", "ADMINO", "SIMP", "Zap"] },
  { name: "Vasista Esports", tag: "VST", players: ["Pukar", "Fierce", "GamlaBoy", "RageGod", "Tapatap"] },
  { name: "Cincinnati Kids", tag: "CK", players: ["Mighty", "Flawk", "Juicy", "Aditya", "Ninjuu"] },
  { name: "Diesel Esports", tag: "DSL", players: ["SHYAM", "ALBY", "GokulWNL", "Paari", "Orlo"] },
  { name: "Likitha Esports", tag: "LKT", players: ["Hector", "Neyo", "Goblin", "VipeR", "Zhyrx"] },
  { name: "THWxNonx Esports", tag: "NONX", players: ["Roman", "Lovish", "RushBoy", "Levi"] },
  { name: "Team SouL", tag: "SOUL", players: ["Manya", "Rony", "NakuL", "Saumay", "HunterZ"] },
  { name: "Reckoning Esports", tag: "RGE", players: ["ViPER", "GravityJOD", "Dionysus", "KyOya", "Shubh"] },
  { name: "Altitude", tag: "ALT", players: ["Godz", "Atomm", "Lazyy", "Cloudz"] },
  { name: "Bot Army", tag: "BA", players: ["ScaryJod", "Hitler", "Devotee", "Monty"] },
  { name: "Wobble Gaming", tag: "WOB", players: ["Sporta", "Ragnar", "Jinzz", "Vampi"] },
  { name: "Hail Inferno Squad", tag: "HIS", players: ["JatinOG", "PmwiIGL", "Goten", "OwenOG", "OmegaOG"] },
  { name: "FS Esports", tag: "FS", players: ["MAX", "Secrett", "Crypto", "Insidious", "DreamS"] },
  { name: "Rider Esports", tag: "RID", players: ["DEVANSHOp", "XzisT", "FAMEeeee", "FRAGGER16"] },
  { name: "Orangutan", tag: "OG", players: ["Aaru", "Attanki", "AK", "WizzGOD", "Veyron"] },
  { name: "Troy Tamilans Esports", tag: "TROY", players: ["RanveerOG", "INFERNO", "Hydro", "Pekka", "Shraudy"] },
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
  "2025-04-25T15:30:00+05:30",
  "2025-04-25T16:15:00+05:30",
  "2025-04-25T17:00:00+05:30",
  "2025-04-25T17:40:00+05:30",
  "2025-04-25T18:20:00+05:30",
  "2025-04-25T19:05:00+05:30",
  "2025-04-26T15:30:00+05:30",
  "2025-04-26T16:15:00+05:30",
  "2025-04-26T17:00:00+05:30",
  "2025-04-26T17:40:00+05:30",
  "2025-04-26T18:20:00+05:30",
  "2025-04-26T19:05:00+05:30",
  "2025-04-27T15:30:00+05:30",
  "2025-04-27T16:15:00+05:30",
  "2025-04-27T17:00:00+05:30",
  "2025-04-27T17:40:00+05:30",
  "2025-04-27T18:20:00+05:30",
  "2025-04-27T19:05:00+05:30",
];

const mapRotation = ["Erangel", "Miramar", "Sanhok", "Erangel", "Miramar", "Erangel"];

const articles = [
  {
    title: "Team Versatile win BGIS 2025 in Kolkata",
    content:
      "Team Versatile won BGIS 2025 with 169 total points in the Grand Finals, finishing ahead of GodLike Esports and Orangutan. The event featured a ₹3.21 crore prize pool after additional in-game crate contributions and concluded on April 27, 2025 in Kolkata.",
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
    ["Team Versatile", "Team Versatile"],
    ["Hero Xtreme Godlike", "GodLike Esports"],
    ["iQOO ORANGUTAN", "Orangutan"],
    ["iQOO RECKONING ESPORTS", "Reckoning Esports"],
    ["True Rippers x Infinix", "True Rippers"],
    ["SOA ESPORTS", "SOA Esports"],
    ["OnePlus Cincinnati Kids", "Cincinnati Kids"],
    ["Medal Esports", "Medal Esports"],
    ["FS eSports", "FS Esports"],
    ["16Score x BotArmy", "Bot Army"],
    ["4ever Esports", "Team RedXRoss"],
    ["GENESIS ESPORTS", "Genesis Esports"],
    ["RIVALRY x NRI", "Rivalry NRI"],
    ["NoNx Esports", "THWxNonx Esports"],
    ["iQOO Soul", "Team SouL"],
    ["TEAM H4K", "Hades H4K"],
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
    "2025-04-27T19:05:00+05:30",
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

console.log("Imported BGIS 2025 tournament, participants, schedule, standings, rankings, and article.");

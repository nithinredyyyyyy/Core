import { db } from "../server/db.js";

const t = db.prepare("SELECT id FROM tournaments WHERE name='PUBG Mobile Global Championship 2025'").get();
const now = new Date().toISOString();

// ── Awards ──
const awards = {
  mvp: { player: "TOP", country: "Mongolia", team: "Alpha Gaming", prize: "Porsche Cayenne" },
  best_igl: { player: "Rosemary", country: "Indonesia", team: "Alter Ego Ares" },
  eagle_eye: { player: "Kecth", country: "Turkey", team: "ULF Esports" },
  grenade_master: { player: "AMOORI", country: "Saudi Arabia", team: "R8 Esports" },
  field_medic: { player: "CEOLATER", country: "Turkey", team: "Kara Esports" },
};

// ── Prize Breakdown ──
const prize_breakdown = {
  "Final Prize Pool": [
    { place: 1, team: "Alpha7 Esports", prize: "$555,000" },
    { place: 2, team: "ULF Esports", prize: "$304,000" },
    { place: 3, team: "Alpha Gaming", prize: "$199,500" },
    { place: 4, team: "ThunderTalk Gaming", prize: "$163,000" },
    { place: 5, team: "Dplus", prize: "$130,000" },
    { place: 6, team: "DRX", prize: "$127,000" },
    { place: 7, team: "D'Xavier", prize: "$120,500" },
    { place: 8, team: "Alter Ego Ares", prize: "$94,000" },
    { place: 9, team: "GOAT Team", prize: "$99,000" },
    { place: 10, team: "Regnum Carya Esports", prize: "$100,000" },
    { place: 11, team: "MadBulls", prize: "$101,500" },
    { place: 12, team: "eArena", prize: "$87,000" },
    { place: 13, team: "R8 Esports", prize: "$95,000" },
    { place: 14, team: "Kara Esports", prize: "$87,000" },
    { place: 15, team: "Vampire Esports", prize: "$27,500" },
    { place: 16, team: "Team Flash", prize: "$61,500" },
    { place: 17, team: "Weibo Gaming", prize: "$34,500" },
    { place: 18, team: "INFLUENCE RAGE", prize: "$33,500" },
    { place: 19, team: "Inner Circle Esports", prize: "$33,500" },
    { place: 20, team: "9z Team", prize: "$30,000" },
    { place: 21, team: "Loops Esports", prize: "$31,500" },
    { place: 22, team: "Alliance", prize: "$30,000" },
    { place: 23, team: "ARCRED", prize: "$30,500" },
    { place: 24, team: "Wolves Esports", prize: "$37,000" },
    { place: 25, team: "Geekay Esports", prize: "$30,000" },
    { place: 26, team: "Team Falcons", prize: "$28,000" },
    { place: 27, team: "Boars Gaming", prize: "$26,500" },
    { place: 28, team: "Burmese Ghouls", prize: "$27,500" },
    { place: 29, team: "Gen.G Esports MENA", prize: "$28,000" },
    { place: 30, team: "Papara SuperMassive", prize: "$25,500" },
    { place: 31, team: "Tianba", prize: "$22,500" },
    { place: 32, team: "Virtus.pro", prize: "$26,500" },
  ],
  "The Gauntlet": [
    { place: 1, prize: "$60,000" }, { place: 2, prize: "$58,000" }, { place: 3, prize: "$57,000" },
    { place: 4, prize: "$56,000" }, { place: 5, prize: "$55,000" }, { place: 6, prize: "$54,000" },
    { place: 7, prize: "$53,000" }, { place: 8, prize: "$6,000" }, { place: 9, prize: "$5,500" },
    { place: 10, prize: "$5,000" }, { place: 11, prize: "$4,500" }, { place: 12, prize: "$4,000" },
    { place: 13, prize: "$3,500" }, { place: 14, prize: "$3,000" }, { place: 15, prize: "$2,500" },
    { place: 16, prize: "$2,000" },
  ],
  "Group Stage (per group)": [
    { place: 1, prize: "$46,000" }, { place: 2, prize: "$45,000" }, { place: 3, prize: "$44,000" },
    { place: 4, prize: "$26,500" }, { place: 5, prize: "$26,000" }, { place: 6, prize: "$25,500" },
    { place: 7, prize: "$25,000" }, { place: 8, prize: "$24,500" }, { place: 9, prize: "$24,000" },
    { place: 10, prize: "$23,500" }, { place: 11, prize: "$23,000" }, { place: 12, prize: "$22,500" },
    { place: 13, prize: "$22,000" }, { place: 14, prize: "$21,000" }, { place: 15, prize: "$20,500" },
    { place: 16, prize: "$20,000" },
  ],
  "Last Chance": [
    { place: 1, prize: "$10,000" }, { place: 2, prize: "$9,500" }, { place: 3, prize: "$8,500" },
    { place: 4, prize: "$8,000" }, { place: 5, prize: "$7,500" }, { place: 6, prize: "$7,000" },
    { place: 7, prize: "$6,500" }, { place: 8, prize: "$6,000" }, { place: 9, prize: "$5,500" },
    { place: 10, prize: "$5,000" }, { place: 11, prize: "$4,500" }, { place: 12, prize: "$4,000" },
    { place: 13, prize: "$3,500" }, { place: 14, prize: "$3,000" }, { place: 15, prize: "$2,500" },
    { place: 16, prize: "$2,000" },
  ],
  "Grand Finals": [
    { place: 1, prize: "$500,000" }, { place: 2, prize: "$250,000" }, { place: 3, prize: "$150,000" },
    { place: 4, prize: "$105,000" }, { place: 5, prize: "$85,000" }, { place: 6, prize: "$75,000" },
    { place: 7, prize: "$67,500" }, { place: 8, prize: "$60,000" }, { place: 9, prize: "$55,000" },
    { place: 10, prize: "$50,000" }, { place: 11, prize: "$45,000" }, { place: 12, prize: "$40,000" },
    { place: 13, prize: "$35,000" }, { place: 14, prize: "$30,000" }, { place: 15, prize: "$27,500" },
    { place: 16, prize: "$25,000" },
  ],
};

// ── Participants with rosters ──
const participants = [
  // The Gauntlet Qualified
  { team: "R8 Esports", qualifier: "The Gauntlet Qualified - PMSL MENA", players: ["PrEStlGe", "AMOORI", "iD7", "Marth"], staff: ["Damar", "SKTON"] },
  { team: "ThunderTalk Gaming", qualifier: "The Gauntlet Qualified - Peacekeeper Elite League", players: ["King", "Ajay", "Xing", "SiTing"], staff: ["TianYu"] },
  { team: "Kara Esports", qualifier: "The Gauntlet Qualified - PMSL Europe", players: ["CEOLATER", "Lewis", "Marso"], staff: ["Poser"] },
  { team: "MadBulls", qualifier: "The Gauntlet Qualified - PMSL CSA", players: ["TULIKA", "LEMON", "FLIP", "PUSHER"], staff: [] },
  { team: "Alpha7 Esports", qualifier: "The Gauntlet Qualified - PMSL Americas", players: ["Carrilho", "Revo", "Guizão", "Obscure"], staff: ["Mafioso"] },
  { team: "ULF Esports", qualifier: "The Gauntlet Qualified - PMSL Europe", players: ["Kecth", "Eren7", "Scarface"], staff: ["Soulless"] },
  { team: "D'Xavier", qualifier: "The Gauntlet Qualified - PMSL Southeast Asia", players: ["LeVis", "Lamborghini", "ParaJin", "NadeTii"], staff: ["Shin"] },
  { team: "DRX", qualifier: "The Gauntlet Qualified - International Cup", players: ["Cyxae", "HYUNBIN", "Qx", "SOEZ"], staff: [] },
  { team: "Wolves Esports", qualifier: "The Gauntlet Qualified - PMSL Americas", players: ["Koops", "Baton", "Dorin", "Higor"], staff: ["Juancho"] },
  { team: "Regnum Carya Esports", qualifier: "The Gauntlet Qualified - PMSL Europe", players: ["Sylas", "Loxy", "Wild"], staff: ["Zwolf"] },
  { team: "Orangutan", qualifier: "The Gauntlet Qualified - India Showdown", players: ["Aaru", "AKop", "WizzGOD"], staff: ["Attanki"] },
  { team: "Virtus.pro", qualifier: "The Gauntlet Qualified - PMSL CSA", players: ["MALOYYY", "Voston", "MilkyWay", "ERAGON"], staff: ["FURIA"] },
  { team: "Alpha Gaming", qualifier: "The Gauntlet Qualified - PMSL CSA", players: ["DOK", "Zyol", "TOP", "REFUS"], staff: ["EAST"] },
  { team: "eArena", qualifier: "The Gauntlet Qualified - PMSL Southeast Asia", players: ["Jowker", "MORMAN", "SAKURA", "TernyK"], staff: ["Nc2"] },
  { team: "GS Team", qualifier: "The Gauntlet Qualified - PMSL MENA", players: ["J3far", "D3S", "ICON77"], staff: ["AMIR", "Esport"] },
  { team: "Geekay Esports", qualifier: "The Gauntlet Qualified - PMSL MENA", players: ["NIRZED", "KEVIN", "RAGNARoK", "SAFG"], staff: ["BERLIN", "SSS"] },
  // Group Stage Qualified
  { team: "Alter Ego Ares", qualifier: "Indonesia Points", players: ["Alva", "Rosemary", "Krypton", "Snape"], staff: ["Moana"] },
  { team: "Alliance", qualifier: "Malaysia Points", players: ["KLUQ", "Oliyo", "JimmyOP", "Iftar"], staff: ["Xynboy", "LeonDZ"] },
  { team: "Team Flash", qualifier: "PMSL Southeast Asia", players: ["Win", "Zhius", "Bowz", "Topz"], staff: ["HaDe"] },
  { team: "Team Secret", qualifier: "PMSL Southeast Asia", players: ["Franky", "Jikey", "Jukay", "Doki"], staff: ["Zerus"] },
  { team: "Inner Circle Esports", qualifier: "Pakistan Points", players: ["FALAK", "IQ", "T24OP", "Nocki"], staff: ["CAIRO", "Shaheen"] },
  { team: "ARCRED", qualifier: "Uzbekistan Points", players: ["EZ4BADBOY", "HARDBOY", "RAMZES", "GLORY"], staff: [] },
  { team: "GOAT Team", qualifier: "PMSL CSA", players: ["TW1X", "KillerJoe", "V1C", "KRAKKEN", "VARENIK"], staff: [] },
  { team: "Papara SuperMassive", qualifier: "PMSL Europe", players: ["Kamikaze", "Lost", "Nyko", "Tron"], staff: [] },
  { team: "Team Falcons", qualifier: "Western Europe Points", players: ["RAOUF", "Narvalow", "Coa77", "REDOX"], staff: ["MAKSA"] },
  { team: "Boars Gaming", qualifier: "Eastern Europe Points", players: ["Havlik", "Snowix", "EXO", "Cáus"], staff: ["KviQQ"] },
  { team: "Twisted Minds", qualifier: "Iraq Points", players: ["4YDO", "FREAK", "LORD", "Wa7sh"], staff: [] },
  { team: "Nuclear Zone", qualifier: "Egypt Points", players: ["FAHiTA", "ARTHUR", "Apkrino", "CRONA9"], staff: ["ABUDY"] },
  { team: "Gen.G Esports MENA", qualifier: "PMSL MENA", players: ["SaTaN", "Damii", "KLAWS", "Quick"], staff: ["ArtFul"] },
  { team: "9z Team", qualifier: "LATAM Points", players: ["Colega", "Milos", "Remix", "Reyes"], staff: [] },
  { team: "INFLUENCE RAGE", qualifier: "PMSL Americas", players: ["Law", "Federal", "Diego", "LiLBOY"], staff: ["Lorranzin"] },
  { team: "Loops Esports", qualifier: "PMSL Americas", players: ["Nielzada", "Ninho", "Rafinha", "Ratoboy"], staff: ["Vitinn"] },
  { team: "ETSH Esports", qualifier: "Africa Cup", players: ["NASSER", "Reverb", "Shiva", "Kuza"], staff: ["Baby", "Sneax"] },
  { team: "Burmese Ghouls", qualifier: "PMCL Southeast Asia", players: ["Unknown", "ICHI", "Yatkha", "Godspeed"], staff: [] },
  { team: "Weibo Gaming", qualifier: "PEL Points", players: ["Suk", "Order", "33z", "HeRo"], staff: ["HECC", "Huai"] },
  { team: "Tianba", qualifier: "PEL Points", players: ["Qz", "GGbond", "Aching", "MiLu"], staff: ["YuYang"] },
  { team: "Dplus", qualifier: "Korea Points", players: ["chpz", "OSAL", "FAVIAN", "Nolbu"], staff: ["FOREST"] },
  { team: "REJECT", qualifier: "Japan League", players: ["Apollo", "ReijiOcO", "Duelo", "Devine"], staff: ["SaRa"] },
  { team: "True Rippers", qualifier: "International Cup", players: ["Jelly", "KioLmao", "Harsh", "Hydro"], staff: [] },
  { team: "Vampire Esports", qualifier: "Host Country Invite (Turkey)", players: ["MEOWLA", "TonyK", "2ed3ull", "lazarus"], staff: ["Gewwy", "nOOzy"] },
];

// ── Grand Finals Player Stats ──
const rankings = [
  { rank: 1, player: "TOP", country: "Mongolia", team: "Alpha Gaming", elimins: 32, avg_dmg: 461, assists: 24, knocks: 35, kd: 1.78 },
  { rank: 2, player: "Rosemary", country: "Indonesia", team: "Alter Ego Ares", elimins: 32, avg_dmg: 403, assists: 6, knocks: 31, kd: 1.78 },
  { rank: 3, player: "Nolbu", country: "South Korea", team: "Dplus", elimins: 32, avg_dmg: 374, assists: 14, knocks: 31, kd: 1.78 },
  { rank: 4, player: "3More", country: "Saudi Arabia", team: "R8 Esports", elimins: 32, avg_dmg: 322, assists: 11, knocks: 31, kd: 1.78 },
  { rank: 5, player: "Loxy", country: "Turkey", team: "Regnum Carya Esports", elimins: 31, avg_dmg: 366, assists: 16, knocks: 28, kd: 1.72 },
  { rank: 6, player: "Ajay", country: "China", team: "ThunderTalk Gaming", elimins: 29, avg_dmg: 298, assists: 12, knocks: 26, kd: 1.61 },
  { rank: 7, player: "REFUS", country: "Mongolia", team: "Alpha Gaming", elimins: 26, avg_dmg: 380, assists: 19, knocks: 30, kd: 1.44 },
  { rank: 8, player: "PUSHER", country: "Armenia", team: "MadBulls", elimins: 26, avg_dmg: 310, assists: 11, knocks: 24, kd: 1.44 },
  { rank: 9, player: "Marso", country: "Turkey", team: "Kara Esports", elimins: 24, avg_dmg: 351, assists: 11, knocks: 21, kd: 1.33 },
  { rank: 10, player: "OSAL", country: "South Korea", team: "Dplus", elimins: 24, avg_dmg: 214, assists: 12, knocks: 15, kd: 1.33 },
  { rank: 11, player: "Revo", country: "Brazil", team: "Alpha7 Esports", elimins: 23, avg_dmg: 330, assists: 11, knocks: 32, kd: 1.28 },
  { rank: 12, player: "DOK", country: "Mongolia", team: "Alpha Gaming", elimins: 22, avg_dmg: 317, assists: 17, knocks: 25, kd: 1.22 },
  { rank: 13, player: "Xing", country: "China", team: "ThunderTalk Gaming", elimins: 22, avg_dmg: 280, assists: 17, knocks: 22, kd: 1.22 },
  { rank: 14, player: "CEOLATER", country: "Turkey", team: "Kara Esports", elimins: 22, avg_dmg: 241, assists: 7, knocks: 20, kd: 1.22 },
  { rank: 15, player: "TernyK", country: "Thailand", team: "eArena", elimins: 21, avg_dmg: 275, assists: 10, knocks: 26, kd: 1.17 },
  { rank: 16, player: "TW1X", country: "Ukraine", team: "GOAT Team", elimins: 21, avg_dmg: 239, assists: 12, knocks: 20, kd: 1.17 },
  { rank: 17, player: "Obscure", country: "Brazil", team: "Alpha7 Esports", elimins: 21, avg_dmg: 236, assists: 5, knocks: 20, kd: 1.24 },
  { rank: 18, player: "Eren7", country: "Turkey", team: "ULF Esports", elimins: 20, avg_dmg: 307, assists: 9, knocks: 17, kd: 1.11 },
  { rank: 19, player: "Cyxae", country: "South Korea", team: "DRX", elimins: 20, avg_dmg: 287, assists: 9, knocks: 20, kd: 1.11 },
  { rank: 20, player: "KillerJoe", country: "Ukraine", team: "GOAT Team", elimins: 20, avg_dmg: 282, assists: 12, knocks: 20, kd: 1.11 },
];

// ── Update tournament ──
db.prepare("UPDATE tournaments SET awards=?, prize_breakdown=?, participants=?, rankings=?, updated_date=? WHERE id=?").run(
  JSON.stringify(awards),
  JSON.stringify(prize_breakdown),
  JSON.stringify(participants),
  JSON.stringify(rankings),
  now,
  t.id
);

console.log("PMGC 2025 updated with:");
console.log(`  - Awards: ${Object.keys(awards).length} categories`);
console.log(`  - Prize breakdown: ${Object.keys(prize_breakdown).length} stages`);
console.log(`  - Participants: ${participants.length} teams with rosters`);
console.log(`  - Rankings: ${rankings.length} player stats`);

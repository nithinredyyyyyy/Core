import { PMWC_2026_RANKINGS } from "./pmwc2026Stats.js";
import { PMGC_2025_RANKINGS } from "./pmgc2025Stats.js";
const PMWC_2026_GROUP_A = "Group Stage - Group A";
const PMWC_2026_GROUP_B = "Group Stage - Group B";
const PMGC_2025_GROUP_GREEN = "Group Stage - Green";
const PMGC_2025_GROUP_RED = "Group Stage - Red";

// PMWC 2024 Groups
const PMWC_2024_GROUP_RED = "Group Stage - Group Red";
const PMWC_2024_GROUP_GREEN = "Group Stage - Group Green";
const PMWC_2024_GROUP_YELLOW = "Group Stage - Group Yellow";

// PMWC 2025 Groups
const PMWC_2025_GROUP_RED = "Group Stage - Group Red";
const PMWC_2025_GROUP_GREEN = "Group Stage - Group Green";
const PMWC_2025_GROUP_YELLOW = "Group Stage - Group Yellow";

export const BGMS_2026_PRIZE_BREAKDOWN = [
  { placement: "1st",  team: "Nebula Esports",       inr: "4,000,000" },
  { placement: "2nd",  team: "Gladiators Esports",   inr: "1,500,000" },
  { placement: "3rd",  team: "Orangutan",            inr: "600,000" },
  { placement: "4th",  team: "Rapid Chaos Esports",  inr: "450,000" },
  { placement: "5th",  team: "Apex Gaming",          inr: "350,000" },
  { placement: "6th",  team: "Reckoning Esports",    inr: "300,000" },
  { placement: "7th",  team: "Team Tamilas",         inr: "250,000" },
  { placement: "8th",  team: "Team SouL",            inr: "230,000" },
  { placement: "9th",  team: "Genesis Esports",      inr: "200,000" },
  { placement: "10th", team: "Revenant XSpark",      inr: "180,000" },
  { placement: "11th", team: "8Bit",                 inr: "160,000" },
  { placement: "12th", team: "Elite Nova Esports",   inr: "140,000" },
  { placement: "13th", team: "7Gods Esports",        inr: "130,000" },
  { placement: "14th", team: "Team Outrage",         inr: "120,000" },
  { placement: "15th", team: "Wyld Fangs",           inr: "110,000" },
  { placement: "16th", team: "Myth Official",        inr: "100,000" },
  { placement: "17th", team: "Vasista Esports",      inr: "80,000" },
  { placement: "18th", team: "K9 Esports",           inr: "80,000" },
  { placement: "19th", team: "GodLike Esports",      inr: "80,000" },
  { placement: "20th", team: "Quantum Sparks",       inr: "80,000" },
  { placement: "21st", team: "Epigrotive Gaming",    inr: "60,000" },
  { placement: "22nd", team: "Zero Ark Official",    inr: "60,000" },
  { placement: "23rd", team: "White Walkers",        inr: "40,000" },
  { placement: "24th", team: "HyperCatz",            inr: "40,000" },
  { placement: "25th", team: "Santa Esports",        inr: "20,000" },
  { placement: "26th", team: "Aura x Esports",       inr: "20,000" },
];

export const BMPS_2026_PRIZE_BREAKDOWN = [
  ["1st", "GodLike Esports", "10,000,000", "PMWC"],
  ["2nd", "Divine Gaming", "6,000,000", "-"],
  ["3rd", "Victores Sumus", "4,000,000", "-"],
  ["4th", "Gods Reign", "3,000,000", "-"],
  ["5th", "Team Apex Gaming", "2,500,000", "-"],
  ["6th", "Orangutan", "1,800,000", "-"],
  ["7th", "Team Tamilas", "1,500,000", "-"],
  ["8th", "Vasista Esports", "1,450,000", "-"],
  ["9th", "Reckoning Esports", "1,000,000", "-"],
  ["10th", "Nebula Esports", "1,000,000", "-"],
  ["11th", "8Bit", "800,000", "-"],
  ["12th", "Genesis Esports", "800,000", "-"],
  ["13th", "Team SouL", "600,000", "-"],
  ["14th", "7Gods Esports", "600,000", "-"],
  ["15th", "Revenant XSpark", "500,000", "-"],
  ["16th", "Myth Official", "500,000", "-"],
  ["17th", "Autobotz Esports", "250,000", "-"],
  ["18th", "Rapid Chaos Esports", "250,000", "-"],
  ["19th", "Zero Ark Official", "250,000", "-"],
  ["20th", "WindGod Esports", "250,000", "-"],
  ["21st", "Lastade Esports", "200,000", "-"],
  ["22nd", "4TR Official", "200,000", "-"],
  ["23rd", "Higgboson Esports", "200,000", "-"],
  ["24th", "Meta Ninza", "200,000", "-"],
  ["25th", "True Rippers", "150,000", "-"],
  ["26th", "Welt Esports", "150,000", "-"],
  ["27th", "Wyld Fangs", "150,000", "-"],
  ["28th", "Team Aryan", "150,000", "-"],
  ["29th", "MYSTERIOUS 4", "150,000", "-"],
  ["30th", "Rising Esports", "150,000", "-"],
  ["31st", "Team Versatile", "150,000", "-"],
  ["32nd", "White Walkers", "150,000", "-"],
].map(([placement, team, inr, qualifiesTo]) => ({
  placement,
  team,
  inr,
  qualifiesTo,
}));

export const PMWC_2026_PRIZE_BREAKDOWN = [
  { placement: "1st",   team: "S2G Esports",           usd: "555,000" },
  { placement: "2nd",   team: "NS RedForce",            usd: "293,000" },
  { placement: "3rd",   team: "Aurora",                usd: "210,000" },
  { placement: "4th",   team: "eArena",                usd: "161,000" },
  { placement: "5th",   team: "Tianba",                usd: "141,000" },
  { placement: "6th",   team: "4Thrives",              usd: "161,000" },
  { placement: "7th",   team: "Team Flash",            usd: "137,500" },
  { placement: "8th",   team: "Horaa Esports",         usd: "127,500" },
  { placement: "9th",   team: "Nigma Galaxy",          usd: "115,000" },
  { placement: "10th",  team: "FURIA",                 usd: "95,000" },
  { placement: "11th",  team: "ULF Esports",           usd: "92,000" },
  { placement: "12th",  team: "Team Vitality",         usd: "116,000" },
  { placement: "13th",  team: "GodLike Esports",       usd: "100,000" },
  { placement: "14th",  team: "AlUla Club",            usd: "76,000" },
  { placement: "15th",  team: "Orangutan",             usd: "95,000" },
  { placement: "16th",  team: "IDA Esports",           usd: "90,000" },
  { placement: "17th",  team: "Wolves",                usd: "34,000" },
  { placement: "18th",  team: "GOAT Team",             usd: "37,000" },
  { placement: "19th",  team: "Alpha7",                usd: "36,000" },
  { placement: "20th",  team: "AG.AL",                 usd: "36,000" },
  { placement: "21st",  team: "DOPENESS",              usd: "29,000" },
  { placement: "22nd",  team: "Geekay",                usd: "28,000" },
  { placement: "23rd",  team: "RRQ",                   usd: "28,000" },
  { placement: "24th",  team: "Yangon Galacticos",     usd: "30,000" },
  { placement: "25th",  team: "DRX",                   usd: "27,000" },
  { placement: "26th",  team: "GS 721",                usd: "27,000" },
  { placement: "27-28", team: "XForce Rejects",        usd: "21,000" },
  { placement: "27-28", team: "ETSH Esports",          usd: "21,000" },
  { placement: "29-30", team: "ThunderTalk Gaming",    usd: "20,500" },
  { placement: "29-30", team: "TT Project",            usd: "20,500" },
  { placement: "31-32", team: "Gaming Stars",          usd: "20,000" },
  { placement: "31-32", team: "Hustler Crew",          usd: "20,000" },
];

export const PMWC_2026_PARTICIPANTS = [
  // Group A
  [PMWC_2026_GROUP_A, "AG.AL", "PEL Points", "1st", ["Lyu", "FlowerH", "XZZ", "Maple"]],
  [PMWC_2026_GROUP_A, "ThunderTalk Gaming", "PEL Points", "3rd", ["Ajay", "Xing", "SiTing", "awake"]],
  [PMWC_2026_GROUP_A, "XForce Rejects", "Africa Points", "1st", ["Reverb", "Shiva", "Baby", "Devil"]],
  [PMWC_2026_GROUP_A, "FURIA", "Americas Points", "1st", ["Higor", "Ayala", "Chieff", "Silence"]],
  [PMWC_2026_GROUP_A, "Aurora", "EECA Points", "1st", ["DOK", "TOP", "Zyol", "REFUS"]],
  [PMWC_2026_GROUP_A, "GOAT Team", "EECA Points", "2nd", ["MOXXXYY", "FORCE", "FOOPSMAN", "KillerJoe"]],
  [PMWC_2026_GROUP_A, "DRX", "Rivals Cup", "1st", ["Qxzzz", "BINI", "Hoxy", "TRE"]],
  [PMWC_2026_GROUP_A, "Orangutan", "India Points", "1st", ["Aaru", "AK", "WizzGOD", "Attanki"]],
  [PMWC_2026_GROUP_A, "AlUla Club", "MENA Points", "1st", ["Quick", "Y4SR", "R3B", "KŁAWSINHO"]],
  [PMWC_2026_GROUP_A, "Geekay", "MENA Points", "4th", ["RAGNARoK", "EZ4BADBOY", "KEVIN", "SAFG"]],
  [PMWC_2026_GROUP_A, "Nigma Galaxy", "MENA Points", "2nd", ["RAOUF", "Koops", "LORD", "SaTaN"]],
  [PMWC_2026_GROUP_A, "4Thrives", "South Asia Points", "1st", ["IQ", "FALAK", "HUZAIFA", "T24OP"]],
  [PMWC_2026_GROUP_A, "RRQ", "Southeast Asia Points", "3rd", ["GenFos", "Lapar", "Firen", "Nerpehko"]],
  [PMWC_2026_GROUP_A, "Team Flash", "Southeast Asia Points", "1st", ["Zhius", "Bowz", "Topz", "win"]],
  [PMWC_2026_GROUP_A, "Gaming Stars", "Turkiye Points", "2nd", ["Mani4c", "Rolex20", "Yuseph", "Swash"]],
  [PMWC_2026_GROUP_A, "ULF Esports", "Turkiye Points", "1st", ["Kecth", "Eren7", "Scarface", "Calse", "Soulless"]],
  // Group B
  [PMWC_2026_GROUP_B, "Yangon Galacticos", "PMWC 2025 Champion", "1st", ["Smile", "Marnett", "Romeo", "SAYCLOUD"]],
  [PMWC_2026_GROUP_B, "Tianba", "PEL Points", "2nd", ["Eagle", "Qzz", "Aching", "MiLu"]],
  [PMWC_2026_GROUP_B, "Alpha7", "Americas Points", "3rd", ["Carrilho", "Revo", "Guizão", "Obscure", "Nouthz"]],
  [PMWC_2026_GROUP_B, "Wolves", "Americas Points", "2nd", ["SLONIK", "Baton", "Lmntrixxx", "NCSSRY"]],
  [PMWC_2026_GROUP_B, "GodLike Esports", "India Pro Series", "1st", ["Manya", "Spower", "Saumay", "ADMINO"]],
  [PMWC_2026_GROUP_B, "TT Project", "EECA Points", "3rd", ["NEOZ", "EFFYIS", "EFFECT", "ZERYCH"]],
  [PMWC_2026_GROUP_B, "DOPENESS", "Japan", "1st", ["KenG", "SpiCa", "MIT1KA", "Lufa"]],
  [PMWC_2026_GROUP_B, "GS 721", "MENA Points", "3rd", ["ALEKO", "MALIK", "Masko", "Rehan"]],
  [PMWC_2026_GROUP_B, "ETSH Esports", "MENA Points", "5th", ["Apkrino", "NASSER", "FAHiTA", "SPEED32"]],
  [PMWC_2026_GROUP_B, "NS RedForce", "Pro Series Korea", "1st", ["SOEZ", "XZY", "TIZ1", "HYUNBIN"]],
  [PMWC_2026_GROUP_B, "Horaa Esports", "South Asia Points", "2nd", ["JiGGL3", "SkY", "NoFear", "SleepY"]],
  [PMWC_2026_GROUP_B, "Team Vitality", "Southeast Asia Points", "4th", ["Axel", "Reizy", "FEDERALES", "Reyzak"]],
  [PMWC_2026_GROUP_B, "eArena", "Southeast Asia Points", "2nd", ["Jowker", "MORMAN", "SchwepXz", "TernyK"]],
  [PMWC_2026_GROUP_B, "IDA Esports", "Turkiye Points", "4th", ["Rita", "Darkin", "Emre7", "Swajn"]],
  [PMWC_2026_GROUP_B, "S2G Esports", "Turkiye Points", "3rd", ["Solkay", "Lost", "Kamikaze", "HamsiG"]],
  [PMWC_2026_GROUP_B, "Hustler Crew", "Western Europe Points", "1st", ["Loco", "AaZzMmm", "KAL3Y", "VINNIE", "JMSON"]],
].map(([phase, team, qualification, seed, players], index) => ({
  placement: index + 1,
  team,
  phase,
  qualification,
  seed,
  players,
}));

function normalizePlacement(value) {
  const number = Number.parseInt(String(value || "").replace(/\D/g, ""), 10);
  return Number.isFinite(number) ? number : 999;
}

export const PMWC_2026_AWARDS = [
  { title: "FMVP", player: "Qzz", team: "Tianba", usd: "25,000" },
  { title: "Best IGL", player: "DOK", team: "Aurora Gaming", usd: "-" },
  { title: "Grenade Master", player: "Spower", team: "GodLike Esports", usd: "-" },
  { title: "Field Medic", player: "MORMAN", team: "eArena", usd: "-" },
  { title: "Eagle Eye", player: "TernyK", team: "eArena", usd: "-" },
];

export const PMWC_2024_PARTICIPANTS = [
  // Group Red
  [PMWC_2024_GROUP_RED, "Brute Force", "PMSL EMEA", "1st", ["PREPOD", "NEOZ", "4YDO", "FR1Z3R", "NALSON"]],
  [PMWC_2024_GROUP_RED, "Tianba", "PEL Spring", "1st", ["Lyu", "Qzz", "GGbond", "Long", "Tianyu"]],
  [PMWC_2024_GROUP_RED, "4Merical Vibes", "PMSL CSA", "1st", ["DOK", "REFUS", "AERO", "APEX", "B4RON"]],
  [PMWC_2024_GROUP_RED, "REJECT", "PMGO Champion", "1st", ["ReijiOcO", "Duelo", "SaRa", "Devine"]],
  [PMWC_2024_GROUP_RED, "Dplus", "Rivals Cup", "1st", ["chpz", "Kay", "Nolbu", "OSAL", "Porico"]],
  [PMWC_2024_GROUP_RED, "D'Xavier", "PMSL Southeast Asia", "2nd", ["Lamborghini", "CHUA", "ShaDows", "ParaJin", "NadeTii"]],
  [PMWC_2024_GROUP_RED, "Besiktas Black", "PMSL EMEA", "3rd", ["Kircali", "Tospik", "Poser", "Lewis"]],
  [PMWC_2024_GROUP_RED, "Yoodo Alliance", "PMSL Southeast Asia", "3rd", ["KLuq", "Oliyo", "Jimmy99", "Flax", "LeonDZ"]],
  // Group Green
  [PMWC_2024_GROUP_GREEN, "Team Liquid", "PMSL Americas", "1st", ["CARDOZIN", "MYTHIC", "AYALAu", "CH1EFF"]],
  [PMWC_2024_GROUP_GREEN, "Harame Bro", "Challengers League", "1st", ["RANGE", "Jappy", "FEDERALES", "EMAS", "PHEW"]],
  [PMWC_2024_GROUP_GREEN, "Vampire Esports", "Special Invite", "1st", ["Stoned66", "Schwepds39", "TonyK", "Noozy639", "Fluketh", "Rvenclaw"]],
  [PMWC_2024_GROUP_GREEN, "Tong Jia Bao Esports", "PEL Points", "2nd", ["Loongz", "Gk1st", "Onlys", "Flowerh", "SSS"]],
  [PMWC_2024_GROUP_GREEN, "Falcons Force", "PMSL CSA", "2nd", ["TOP", "NIRZED", "Action", "ICY", "EAST"]],
  [PMWC_2024_GROUP_GREEN, "MadBulls", "PMSL CSA", "3rd", ["ZERYCH", "FLYQE", "TUL1KA", "INGUSH"]],
  [PMWC_2024_GROUP_GREEN, "Al Ula x IHC", "PMSL CSA", "4th", ["Godless", "Zyol", "DEMO", "ALEX", "ROGUE"]],
  [PMWC_2024_GROUP_GREEN, "Talon Esports", "PMSL Southeast Asia", "4th", ["Miseryy", "Redface", "Linixx", "Yoruu", "AXEL"]],
  // Group Yellow
  [PMWC_2024_GROUP_YELLOW, "BOOM Esports", "PMSL Southeast Asia", "1st", ["FrenTzy", "Flyboy", "YummyMEI", "Ponbit56", "Reizyyy", "Rapshody"]],
  [PMWC_2024_GROUP_YELLOW, "CAG OSAKA", "Japan League", "1st", ["Apollo", "Naoto", "Garnet", "Mattun"]],
  [PMWC_2024_GROUP_YELLOW, "DRX", "Pro Series Korea", "1st", ["Cyxae", "Qx", "HYUNBIN", "SOEZ"]],
  [PMWC_2024_GROUP_YELLOW, "IW NRX", "PMSL EMEA", "2nd", ["FROZENNX", "ZWOLF", "KEIN", "SWAIN"]],
  [PMWC_2024_GROUP_YELLOW, "Alpha7 Esports", "PMSL Americas", "2nd", ["REVO77K", "MAFIOSO", "CARRILHO", "MAGRELIN"]],
  [PMWC_2024_GROUP_YELLOW, "iNCO Gaming", "PMSL Americas", "3rd", ["Garryx", "NENEBETE", "Nunes", "Sev7n", "Vitali"]],
  [PMWC_2024_GROUP_YELLOW, "Money Makers", "PMSL EMEA", "4th", ["OldBoy", "Icy", "Coa77", "BISKE", "Havlik", "A7MED"]],
  [PMWC_2024_GROUP_YELLOW, "POWR eSports", "Host Country Invite", "1st", ["ALHAJE", "EASY", "FHIDAN", "KANTE", "SAAD", "SaTaN"]],
].map(([phase, team, qualification, seed, players], index) => ({
  placement: index + 1,
  team,
  phase,
  qualification,
  seed,
  players,
}));

export const PMWC_2025_PARTICIPANTS = [
  // Group Red
  [PMWC_2025_GROUP_RED, "R8 Esports", "Host Country Invite", "1st", ["iD7", "PrEStlGe", "Marth", "SKTON", "Damar"]],
  [PMWC_2025_GROUP_RED, "eArena", "PMSL Southeast Asia", "2nd", ["Jowker", "MORMAN", "SAKURA", "TernyK", "Nc2"]],
  [PMWC_2025_GROUP_RED, "Alter Ego Ares", "PMSL Southeast Asia", "3rd", ["Alva", "Rosemary", "Moana", "Krypton", "DayboT"]],
  [PMWC_2025_GROUP_RED, "Team Secret", "PMSL Southeast Asia", "4th", ["Franky", "Jikey", "TrangXIX", "Zerus"]],
  [PMWC_2025_GROUP_RED, "Alpha Gaming", "PMSL CSA", "1st", ["Zyol", "DOK", "REFUS", "TOP", "B4RON"]],
  [PMWC_2025_GROUP_RED, "Horaa Esports", "PMSL CSA", "2nd", ["JiGGL3", "SkY", "NoFear", "SleepY", "HaitDami", "MafiaNinja"]],
  [PMWC_2025_GROUP_RED, "4Thrives Esports", "PMSL CSA", "3rd", ["IQQ", "FALAK", "T24OP", "Nocki", "CAIRO", "Shaheen"]],
  [PMWC_2025_GROUP_RED, "Team Falcons", "PMSL Europe", "1st", ["Narvalow", "RAOUF", "REDOX", "Coa77", "Snowix"]],
  // Group Green
  [PMWC_2025_GROUP_GREEN, "Fire Flux Esports", "PMSL Europe", "2nd", ["Kecth", "Matkap", "Scarface", "Soulless"]],
  [PMWC_2025_GROUP_GREEN, "IDA Esports", "PMSL Europe", "3rd", ["Darkin", "Emre7", "Eren7", "Rita"]],
  [PMWC_2025_GROUP_GREEN, "Regnum Carya Esports", "PMGO Champ's Region", "1st", ["Loxy", "Sylas", "Tospik", "Wild"]],
  [PMWC_2025_GROUP_GREEN, "Team Vision", "PMSL MENA", "1st", ["Marcelo", "Nawaf", "NvrAlone", "VOLT", "SPARK", "Bommpa"]],
  [PMWC_2025_GROUP_GREEN, "POWR eSports", "PMSL MENA", "2nd", ["RAGNAR", "ALHAJE", "Fhidan", "Easy", "KANTE"]],
  [PMWC_2025_GROUP_GREEN, "Team GAMAX", "PMSL MENA", "3rd", ["FAHiTA", "Apkrino", "ARTHUR", "CRONA9", "4YDO"]],
  [PMWC_2025_GROUP_GREEN, "INTENSE GAME", "PMSL Americas", "1st", ["AdriaN", "Pedrinho", "Rafa", "Silenceee"]],
  [PMWC_2025_GROUP_GREEN, "INFLUENCE RAGE", "PMSL Americas", "2nd", ["Diego", "Felipinho", "law", "LiLBOY", "Lorranzin"]],
  // Group Yellow
  [PMWC_2025_GROUP_YELLOW, "Alpha7 Esports", "PMSL Americas", "3rd", ["Carrilho", "Mafioso", "Revo", "Squash", "Senab"]],
  [PMWC_2025_GROUP_YELLOW, "Yangon Galacticos", "PMCL Southeast Asia", "1st", ["Smile", "Marnett", "Romeo", "SAYCLOUD"]],
  [PMWC_2025_GROUP_YELLOW, "Weibo Gaming", "PEL Points", "1st", ["Suk", "Order", "33z", "HECC", "HeRo", "Huai"]],
  [PMWC_2025_GROUP_YELLOW, "ThunderTalk Gaming", "PEL Points", "2nd", ["King", "Ajay", "Xing", "SiTing", "TianYu"]],
  [PMWC_2025_GROUP_YELLOW, "DRX", "Pro Series Korea", "1st", ["Cyxae", "HYUNBIN", "Qx", "SOEZ"]],
  [PMWC_2025_GROUP_YELLOW, "KINOTROPE gaming", "Japan League", "1st", ["Mark", "FINALE", "OZISAN", "TAMR4", "p1r"]],
  [PMWC_2025_GROUP_YELLOW, "Nongshim RedForce", "Rivals Cup", "1st", ["BINI", "DokC", "XZY", "TIZ1"]],
  [PMWC_2025_GROUP_YELLOW, "Team Aryan", "Special Invite: BMPS", "1st", ["Aryan", "Syrax", "Devotee", "Henry", "Vishu"]],
].map(([phase, team, qualification, seed, players], index) => ({
  placement: index + 1,
  team,
  phase,
  qualification,
  seed,
  players,
}));

export const PMGC_2025_PARTICIPANTS = [
  [PMGC_2025_GROUP_GREEN, "Alpha Gaming", "PMSL CSA", "1st", ["DOK", "Zyol", "TOP", "REFUS"]],
  [PMGC_2025_GROUP_GREEN, "Dplus", "Korea Points", "1st", ["chpz", "OSAL", "FAVIAN", "Nolbu"]],
  [PMGC_2025_GROUP_GREEN, "GOAT Team", "PMSL CSA", "2nd", ["TW1X", "KillerJoe", "V1C", "KRAKKEN", "VARENIK"]],
  [PMGC_2025_GROUP_GREEN, "Wolves Esports", "PMSL Americas", "2nd", ["Koops", "Baton", "Dorin", "Higor"]],
  [PMGC_2025_GROUP_GREEN, "Inner Circle Esports", "Pakistan Points", "1st", ["FALAK", "IQ", "T24OP", "Nocki"]],
  [PMGC_2025_GROUP_GREEN, "Gen.G Esports MENA", "PMSL MENA", "3rd", ["SaTaN", "Damii", "KLAWS", "Quick"]],
  [PMGC_2025_GROUP_GREEN, "Loops Esports", "PMSL Americas", "3rd", ["Nielzada", "Ninho", "Rafinha", "Ratoboy"]],
  [PMGC_2025_GROUP_GREEN, "Alter Ego Ares", "Indonesia Points", "1st", ["Alva", "Rosemary", "Krypton", "Snape"]],
  [PMGC_2025_GROUP_GREEN, "Team Falcons", "Western Europe Points", "1st", ["RAOUF", "Narvalow", "Coa77", "REDOX"]],
  [PMGC_2025_GROUP_GREEN, "Papara SuperMassive", "PMSL Europe", "2nd", ["Kamikaze", "Lost", "Nyko", "Tron"]],
  [PMGC_2025_GROUP_GREEN, "9z Team", "LATAM Points", "1st", ["Colega", "Milos", "Remix", "Reyes"]],
  [PMGC_2025_GROUP_GREEN, "Tianba", "PEL Points", "2nd", ["Qz", "GGbond", "Aching", "MiLu"]],
  [PMGC_2025_GROUP_GREEN, "GS Team", "PMSL MENA", "4th", ["J3far", "D3S", "ICON77"]],
  [PMGC_2025_GROUP_GREEN, "Orangutan", "India Showdown", "1st", ["Aaru", "AKop", "WizzGOD"]],
  [PMGC_2025_GROUP_GREEN, "REJECT", "Japan League", "1st", ["Apollo", "ReijiOcO", "Duelo", "Devine"]],
  [PMGC_2025_GROUP_GREEN, "Team Secret", "PMSL Southeast Asia", "2nd", ["Franky", "Jikey", "Jukay", "Doki"]],
  [PMGC_2025_GROUP_RED, "DRX", "International Cup", "1st", ["Cyxae", "HYUNBIN", "Qx", "SOEZ"]],
  [PMGC_2025_GROUP_RED, "Regnum Carya Esports", "PMSL Europe", "3rd", ["Sylas", "Loxy", "Wild"]],
  [PMGC_2025_GROUP_RED, "eArena", "PMSL Southeast Asia", "3rd", ["Jowker", "MORMAN", "SAKURA", "TernyK"]],
  [PMGC_2025_GROUP_RED, "Team Flash", "PMSL Southeast Asia", "1st", ["Win", "Zhius", "Bowz", "Topz"]],
  [PMGC_2025_GROUP_RED, "Weibo Gaming", "PEL Points", "1st", ["Suk", "Order", "33z", "HeRo"]],
  [PMGC_2025_GROUP_RED, "INFLUENCE RAGE", "PMSL Americas", "1st", ["Law", "Federal", "Diego", "LiLBOY"]],
  [PMGC_2025_GROUP_RED, "ARCRED", "Uzbekistan Points", "1st", ["EZ4BADBOY", "HARDBOY", "RAMZES", "GLORY"]],
  [PMGC_2025_GROUP_RED, "Burmese Ghouls", "PMCL Southeast Asia", "1st", ["Unknown", "ICHI", "Yatkha", "Godspeed"]],
  [PMGC_2025_GROUP_RED, "Alliance", "Malaysia Points", "1st", ["KLUQ", "Oliyo", "JimmyOP", "Iftar"]],
  [PMGC_2025_GROUP_RED, "Geekay Esports", "PMSL MENA", "5th", ["NIRZED", "KEVIN", "RAGNARoK", "SAFG"]],
  [PMGC_2025_GROUP_RED, "Boars Gaming", "Eastern Europe Points", "1st", ["Havlik", "Snowix", "EXO", "Cáus"]],
  [PMGC_2025_GROUP_RED, "Virtus.pro", "PMSL CSA", "4th", ["MALOYYY", "Voston", "MilkyWay", "ERAGON"]],
  [PMGC_2025_GROUP_RED, "Twisted Minds", "Iraq Points", "1st", ["4YDO", "FREAK", "LORD", "Wa7sh"]],
  [PMGC_2025_GROUP_RED, "True Rippers", "International Cup", "2nd", ["Jelly", "KioLmao", "Harsh", "Hydro"]],
  [PMGC_2025_GROUP_RED, "ETSH Esports", "Africa Cup", "1st", ["NASSER", "Reverb", "Shiva", "Kuza"]],
  [PMGC_2025_GROUP_RED, "Nuclear Zone", "Egypt Points", "1st", ["FAHiTA", "ARTHUR", "Apkrino", "CRONA9"]],
].map(([phase, team, qualification, seed, players], index) => ({
  placement: index + 1,
  team,
  phase,
  qualification,
  seed,
  players,
}));

export const PMGC_2025_AWARDS = [
  { title: "Grand Finals MVP", player: "TOP", team: "Alpha Gaming", prize: "Porsche Cayenne" },
  { title: "Best IGL", player: "Rosemary", team: "Alter Ego Ares", prize: "-" },
  { title: "Eagle Eye", player: "Kecth", team: "ULF Esports", prize: "-" },
  { title: "Grenade Master", player: "3More", team: "R8 Esports", prize: "-" },
  { title: "Field Medic", player: "CEOLATER", team: "Kara Esports", prize: "-" },
  { title: "Best Clutch", player: "Nolbu", team: "Dplus", prize: "-" },
  { title: "The Eliminator", player: "Loxy", team: "Regnum Carya Esports", prize: "-" },
];

export const PMGC_2025_PRIZE_BREAKDOWN = [
  { placement: "1st", team: "Alpha7 Esports", usd: "555,000" },
  { placement: "2nd", team: "ULF Esports", usd: "304,000" },
  { placement: "3rd", team: "Alpha Gaming", usd: "199,500" },
  { placement: "4th", team: "ThunderTalk Gaming", usd: "163,000" },
  { placement: "5th", team: "Dplus", usd: "130,000" },
  { placement: "6th", team: "DRX", usd: "127,000" },
  { placement: "7th", team: "D'Xavier", usd: "120,500" },
  { placement: "8th", team: "Alter Ego Ares", usd: "94,000" },
  { placement: "9th", team: "GOAT Team", usd: "99,000" },
  { placement: "10th", team: "Regnum Carya Esports", usd: "100,000" },
  { placement: "11th", team: "MadBulls", usd: "101,500" },
  { placement: "12th", team: "eArena", usd: "87,000" },
  { placement: "13th", team: "R8 Esports", usd: "95,000" },
  { placement: "14th", team: "Kara Esports", usd: "87,000" },
  { placement: "15th", team: "Vampire Esports", usd: "27,500" },
  { placement: "16th", team: "Team Flash", usd: "61,500" },
  { placement: "17th", team: "Weibo Gaming", usd: "34,500" },
  { placement: "18th", team: "INFLUENCE RAGE", usd: "33,500" },
  { placement: "19th", team: "Inner Circle Esports", usd: "33,500" },
  { placement: "20th", team: "9z Team", usd: "30,000" },
  { placement: "21st", team: "Loops Esports", usd: "31,500" },
  { placement: "22nd", team: "Alliance", usd: "30,000" },
  { placement: "23rd", team: "ARCRED", usd: "30,500" },
  { placement: "24th", team: "Wolves Esports", usd: "37,000" },
  { placement: "25th", team: "Geekay Esports", usd: "30,000" },
  { placement: "26th", team: "Team Falcons", usd: "28,000" },
  { placement: "27th", team: "Boars Gaming", usd: "26,500" },
  { placement: "28th", team: "Burmese Ghouls", usd: "27,500" },
  { placement: "29th", team: "Gen.G Esports MENA", usd: "28,000" },
  { placement: "30th", team: "Papara SuperMassive", usd: "25,500" },
  { placement: "31-32", team: "Tianba", usd: "22,500" },
  { placement: "31-32", team: "Virtus.pro", usd: "26,500" },
  { placement: "33-34", team: "GS Team", usd: "24,500" },
  { placement: "33-34", team: "Twisted Minds", usd: "22,000" },
  { placement: "35-36", team: "Orangutan", usd: "25,500" },
  { placement: "35-36", team: "True Rippers", usd: "21,000" },
  { placement: "37-38", team: "REJECT", usd: "20,500" },
  { placement: "37-38", team: "ETSH Esports", usd: "-" },
  { placement: "39-40", team: "Team Secret", usd: "20,000" },
  { placement: "39-40", team: "Nuclear Zone", usd: "-" },
];

export function applyTournamentReadOverrides(tournament) {
  if (!tournament?.name) return tournament;

  if (tournament.name === "PUBG Mobile World Cup 2026") {
    const pmwcPlayerToTeam = {};
    for (const participant of PMWC_2026_PARTICIPANTS) {
      const teamName = participant.team;
      const players = participant.players || [];
      for (const player of players) {
        pmwcPlayerToTeam[player.toLowerCase()] = teamName;
      }
    }
    const pmwcFallbackAliases = {
      "qx": "DRX",
      "silenceee": "FURIA",
      "jimmy": "ThunderTalk Gaming",
      "v3xxy": "Team Vitality",
      "shallow": "Aurora",
      "haitdami": "Aurora",
      "mitraleius": "Wolves",
    };
    for (const [alias, team] of Object.entries(pmwcFallbackAliases)) {
      if (!pmwcPlayerToTeam[alias]) pmwcPlayerToTeam[alias] = team;
    }

    const PMWC_2026_GRAND_FINALS_STANDINGS = [
      { placement: 1, team: "S2G Esports", fullTeam: "S2G Esports", matches: 18, wwcd: 3, pos: 65, place: 89, elimins: 89, elims: 89, points: 154, pts: 154 },
      { placement: 2, team: "Nongshim RedForce", fullTeam: "Nongshim RedForce", matches: 18, wwcd: 3, pos: 47, place: 102, elimins: 102, elims: 102, points: 149, pts: 149 },
      { placement: 3, team: "Aurora Gaming", fullTeam: "Aurora Gaming", matches: 18, wwcd: 2, pos: 53, place: 93, elimins: 93, elims: 93, points: 146, pts: 146 },
      { placement: 4, team: "eArena", fullTeam: "eArena", matches: 18, wwcd: 2, pos: 42, place: 98, elimins: 98, elims: 98, points: 140, pts: 140 },
      { placement: 5, team: "Tianba", fullTeam: "Tianba", matches: 18, wwcd: 2, pos: 37, place: 88, elimins: 88, elims: 88, points: 125, pts: 125 },
      { placement: 6, team: "4thrives Esports", fullTeam: "4thrives Esports", matches: 18, wwcd: 0, pos: 24, place: 88, elimins: 88, elims: 88, points: 112, pts: 112 },
      { placement: 7, team: "Team Flash", fullTeam: "Team Flash", matches: 18, wwcd: 1, pos: 41, place: 70, elimins: 70, elims: 70, points: 111, pts: 111 },
      { placement: 8, team: "Horaa Esports", fullTeam: "Horaa Esports", matches: 18, wwcd: 0, pos: 36, place: 73, elimins: 73, elims: 73, points: 109, pts: 109 },
      { placement: 9, team: "Nigma Galaxy", fullTeam: "Nigma Galaxy", matches: 18, wwcd: 1, pos: 35, place: 71, elimins: 71, elims: 71, points: 106, pts: 106 },
      { placement: 10, team: "FURIA", fullTeam: "FURIA", matches: 18, wwcd: 1, pos: 47, place: 58, elimins: 58, elims: 58, points: 105, pts: 105 },
      { placement: 11, team: "ULF Esports", fullTeam: "ULF Esports", matches: 18, wwcd: 1, pos: 26, place: 73, elimins: 73, elims: 73, points: 99, pts: 99 },
      { placement: 12, team: "Team Vitality", fullTeam: "Team Vitality", matches: 18, wwcd: 0, pos: 32, place: 67, elimins: 67, elims: 67, points: 99, pts: 99 },
      { placement: 13, team: "GodLike Esports", fullTeam: "GodLike Esports", matches: 18, wwcd: 1, pos: 18, place: 66, elimins: 66, elims: 66, points: 84, pts: 84 },
      { placement: 14, team: "AlUla Club", fullTeam: "AlUla Club", matches: 18, wwcd: 1, pos: 32, place: 51, elimins: 51, elims: 51, points: 83, pts: 83 },
      { placement: 15, team: "Orangutan", fullTeam: "Orangutan", matches: 18, wwcd: 0, pos: 16, place: 60, elimins: 60, elims: 60, points: 76, pts: 76 },
      { placement: 16, team: "IDA Esports", fullTeam: "IDA Esports", matches: 18, wwcd: 0, pos: 25, place: 44, elimins: 44, elims: 44, points: 69, pts: 69 },
    ];

    const pmwcStages = Array.isArray(tournament.stages)
      ? tournament.stages.map((stage) => {
          // Inject Grand Finals standings if stage is Grand Finals and has no standings
          if (stage.name === "Grand Finals" && (!Array.isArray(stage.standings) || stage.standings.length === 0)) {
            stage = { ...stage, status: "completed", standings: PMWC_2026_GRAND_FINALS_STANDINGS };
          }

          if (!Array.isArray(stage.standings)) return stage;
          
          let groupCounters = {};
          
          return {
            ...stage,
            standings: stage.standings.map((entry) => {
              let pos = normalizePlacement(entry.placement);
              let outcome = entry.outcome || entry.progression_status || null;
              
              if (stage.name === "Group Stage") {
                const participant = PMWC_2026_PARTICIPANTS.find(p => p.team === entry.team || p.team === entry.fullTeam);
                const group = participant ? participant.phase : "Unknown";
                groupCounters[group] = (groupCounters[group] || 0) + 1;
                pos = groupCounters[group];
                
                if (pos >= 1 && pos <= 5) outcome = "Advances to Grand Finals";
                else if (pos >= 6 && pos <= 13) outcome = "Advances to Survival Stage";
                else if (pos >= 14) outcome = "Eliminated";

                return { ...entry, outcome, progression_status: outcome, group: group.replace("Group Stage - ", ""), grp: group.replace("Group Stage - ", "") };
              } else if (stage.name === "Survival Stage") {
                if (pos >= 1 && pos <= 6) outcome = "Advances to Grand Finals";
                else if (pos >= 7) outcome = "Eliminated";
              } else if (stage.name === "Grand Finals") {
                if (pos === 1) outcome = "Champion";
                else if (pos === 2) outcome = "Runner-up";
                else if (pos === 3) outcome = "3rd Place";
              }
              
              return { ...entry, outcome, progression_status: outcome };
            }),
          };
        })
      : tournament.stages;

    return {
      ...tournament,
      tier: tournament.tier || "S-Tier",
      prize_pool: "$3,025,000",
      banner_url: "/images/pubg-mobile-world-cup-2026.webp",
      participants: PMWC_2026_PARTICIPANTS,
      awards: PMWC_2026_AWARDS,
      rankings: PMWC_2026_RANKINGS.map((ranking) => ({
        ...ranking,
        entries: ranking.entries.map((entry) => ({
          ...entry,
          team: entry.team && entry.team !== "-" ? entry.team : pmwcPlayerToTeam[entry.player?.toLowerCase()] || "-",
        })),
      })),
      prize_breakdown: PMWC_2026_PRIZE_BREAKDOWN,
      max_teams: 32,
      stages: pmwcStages,
    };
  }

  if (tournament.name === "Battlegrounds Mobile India Pro Series 2026") {
    const stages = Array.isArray(tournament.stages)
      ? tournament.stages.map((stage) => {
          return {
            ...stage,
            status: "completed",
            standings:
              stage?.name === "Grand Finals" && Array.isArray(stage.standings)
                ? stage.standings.map((entry) =>
                    normalizePlacement(entry?.placement) === 1
                      ? { ...entry, team: "GodLike Esports", fullTeam: "GodLike Esports" }
                      : entry,
                  )
                : stage.standings,
          };
        })
      : tournament.stages;

    return {
      ...tournament,
      status: "completed",
      prize_pool: "₹40,000,000 INR (≃ $424,041 USD)",
      prize_breakdown: BMPS_2026_PRIZE_BREAKDOWN,
      awards: [
        { title: "MVP", player: "ScaryJod", team: "Victores Sumus" },
        { title: "FMVP", player: "Slug", team: "Divine Gaming" },
        { title: "Best IGL", player: "Aadi", team: "Nebula Esports" },
        { title: "Best Support", player: "Saumay", team: "Godlike Esports" },
        { title: "Rookie of the Year", player: "Aimgodd", team: "iQOO Team Tamilas" },
      ],
      stages,
    };
  }

  if (tournament.name === "PUBG Mobile Global Championship 2025") {
    const pmgcPlayerToTeam = {};
    for (const participant of PMGC_2025_PARTICIPANTS) {
      const teamName = participant.team;
      const players = participant.players || [];
      for (const player of players) {
        pmgcPlayerToTeam[player.toLowerCase()] = teamName;
      }
    }
    const pmgcFallbackAliases = {
      "qx": "DRX",
      "3more": "R8 Esports",
    };
    for (const [alias, team] of Object.entries(pmgcFallbackAliases)) {
      if (!pmgcPlayerToTeam[alias]) pmgcPlayerToTeam[alias] = team;
    }

    const pmgcStages = Array.isArray(tournament.stages)
      ? tournament.stages.map((stage) => {
          if (!Array.isArray(stage.standings)) return stage;

          let groupCounters = {};

          return {
            ...stage,
            standings: stage.standings.map((entry) => {
              let pos = normalizePlacement(entry.placement);
              let outcome = entry.outcome || entry.progression_status || null;

              if (stage.name === "Group Stage") {
                const participant = PMGC_2025_PARTICIPANTS.find(p => p.team === entry.team || p.team === entry.fullTeam);
                const group = participant ? participant.phase : (entry.grp || "Unknown");
                groupCounters[group] = (groupCounters[group] || 0) + 1;
                pos = groupCounters[group];

                if (pos >= 1 && pos <= 3) outcome = "Advances to Grand Finals";
                else if (pos >= 4 && pos <= 11) outcome = "Advances to Last Chance";
                else if (pos >= 12) outcome = "Eliminated";

                return { ...entry, outcome, progression_status: outcome, group: group.replace("Group Stage - ", ""), grp: group.replace("Group Stage - ", "") };
              } else if (stage.name === "The Gauntlet") {
                if (pos >= 1 && pos <= 7) outcome = "Advances to Grand Finals";
                else if (pos >= 8) outcome = "Advances to Group Stage";
              } else if (stage.name === "Last Chance") {
                if (pos >= 1 && pos <= 2) outcome = "Advances to Grand Finals";
                else if (pos >= 3) outcome = "Eliminated";
              } else if (stage.name === "Grand Finals") {
                if (pos === 1) outcome = "Champion";
                else if (pos === 2) outcome = "Runner-up";
                else if (pos === 3) outcome = "3rd Place";
              }

              return { ...entry, outcome, progression_status: outcome };
            }),
          };
        })
      : tournament.stages;

    return {
      ...tournament,
      tier: tournament.tier || "S-Tier",
      prize_pool: "$3,000,000",
      participants: PMGC_2025_PARTICIPANTS,
      awards: PMGC_2025_AWARDS,
      rankings: PMGC_2025_RANKINGS.map((ranking) => ({
        ...ranking,
        entries: ranking.entries.map((entry) => ({
          ...entry,
          team: entry.team && entry.team !== "-" ? entry.team : pmgcPlayerToTeam[entry.player?.toLowerCase()] || "-",
        })),
      })),
      prize_breakdown: PMGC_2025_PRIZE_BREAKDOWN,
      max_teams: 32,
      stages: pmgcStages,
    };
  }

  // PMWC 2024 overrides
  if (tournament.name === "PUBG Mobile World Cup 2024") {
    const pmwc2024Stages = Array.isArray(tournament.stages)
      ? tournament.stages.map((stage) => {
          if (!Array.isArray(stage.standings)) return stage;

          return {
            ...stage,
            standings: stage.standings.map((entry) => {
              let pos = normalizePlacement(entry.placement);
              let outcome = entry.outcome || entry.progression_status || null;

              if (stage.name === "Group Stage") {
                const participant = PMWC_2024_PARTICIPANTS.find(p => p.team === entry.team || p.team === entry.fullTeam);
                const group = participant ? participant.phase : (entry.grp || "Unknown");

                // PMWC 2024: Combined standings, top 12 advance to Grand Finals, 13-24 to Survival Stage
                if (pos >= 1 && pos <= 12) outcome = "Advances to Grand Finals";
                else if (pos >= 13 && pos <= 24) outcome = "Advances to Survival Stage";

                return { ...entry, outcome, progression_status: outcome, group: group.replace("Group Stage - ", ""), grp: group.replace("Group Stage - ", "") };
              } else if (stage.name === "Survival Stage") {
                // PMWC 2024: Top 4 advance to Main Tournament
                if (pos >= 1 && pos <= 4) outcome = "Advances to Grand Finals";
                else if (pos >= 5) outcome = "Eliminated";
              } else if (stage.name === "Main Tournament") {
                if (pos === 1) outcome = "Champion";
                else if (pos === 2) outcome = "Runner-up";
                else if (pos === 3) outcome = "3rd Place";
              }

              return { ...entry, outcome, progression_status: outcome };
            }),
          };
        })
      : tournament.stages;

    return {
      ...tournament,
      tier: tournament.tier || "S-Tier",
      prize_pool: "$3,000,000",
      participants: PMWC_2024_PARTICIPANTS,
      awards: [
        { title: "FMVP", player: "MAFIOSO", team: "Alpha7 Esports" },
        { title: "Grand Finals MVP", player: "ReijiOcO", team: "REJECT" },
      ],
      rankings: tournament.rankings ?? [],
      max_teams: 24,
      stages: pmwc2024Stages,
    };
  }

  // PMWC 2025 overrides
  if (tournament.name === "PUBG Mobile World Cup 2025") {
    const pmwc2025Stages = Array.isArray(tournament.stages)
      ? tournament.stages.map((stage) => {
          if (!Array.isArray(stage.standings)) return stage;

          return {
            ...stage,
            standings: stage.standings.map((entry) => {
              let pos = normalizePlacement(entry.placement);
              let outcome = entry.outcome || entry.progression_status || null;

              if (stage.name === "Group Stage") {
                const participant = PMWC_2025_PARTICIPANTS.find(p => p.team === entry.team || p.team === entry.fullTeam);
                const group = participant ? participant.phase : (entry.grp || "Unknown");

                // PMWC 2025: Combined standings, top 12 advance to Grand Finals, 13-24 to Survival Stage
                if (pos >= 1 && pos <= 12) outcome = "Advances to Grand Finals";
                else if (pos >= 13 && pos <= 24) outcome = "Advances to Survival Stage";

                return { ...entry, outcome, progression_status: outcome, group: group.replace("Group Stage - ", ""), grp: group.replace("Group Stage - ", "") };
              } else if (stage.name === "Survival Stage") {
                // PMWC 2025: Top 4 advance to Grand Finals
                if (pos >= 1 && pos <= 4) outcome = "Advances to Grand Finals";
                else if (pos >= 5) outcome = "Eliminated";
              } else if (stage.name === "Grand Finals") {
                if (pos === 1) outcome = "Champion";
                else if (pos === 2) outcome = "Runner-up";
                else if (pos === 3) outcome = "3rd Place";
              }

              return { ...entry, outcome, progression_status: outcome };
            }),
          };
        })
      : tournament.stages;

    return {
      ...tournament,
      tier: tournament.tier || "S-Tier",
      prize_pool: "$3,000,000",
      participants: PMWC_2025_PARTICIPANTS,
      awards: [
        { title: "Grand Finals MVP", player: "DOK", team: "Alpha Gaming" },
        { title: "FMVP", player: "Smile", team: "Yangon Galacticos" },
      ],
      rankings: tournament.rankings ?? [],
      max_teams: 24,
      stages: pmwc2025Stages,
    };
  }

  return tournament;
}

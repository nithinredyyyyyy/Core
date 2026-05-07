import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { normalizeOrganizationName } from "../../SRC/LIB/organizationIdentity.js";
import { BMPS_2026_ROSTERS } from "./bmps-2026-rosters.js";

const now = new Date().toISOString();
const ROUND_ONE_GROUP_B_TEAMS = new Set(
  [
    "Lastade Esports",
    "4TR Official",
    "7Gods Esports",
    "K9 Esports",
    "Troy Tamilian Esports",
    "Jaguar Esports",
    "MadKings",
    "Madkings Esports",
    "White Walkers",
    "Team Apex Gaming",
    "iQOO 8Bit",
    "RiotNationz",
    "RiotNations",
    "Naqsh Esports",
    "Team H4K",
    "Higgboson Esports",
    "HADX Esports",
    "WindGod Esports",
  ].map((name) => normalizeTeam(name))
);

function normalizeTeam(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const tournament = {
  name: "Battlegrounds Mobile India Pro Series 2026",
  game: "BGMI",
  tier: "A-Tier",
  status: "upcoming",
  prize_pool: "2,00,00,000+",
  start_date: "2026-05-06",
  end_date: "2026-06-21",
  max_teams: 64,
  banner_url: "/images/bmps-2026.png",
  format_overview:
    "BMPS 2026 is the fifth edition of the Battlegrounds Mobile India Pro Series. The tournament begins with a 64-team Qualifiers Stage using a four-group promotion and relegation system, followed by Survival Stage, Semi Finals, Last Chance, and the Grand Finals at Jaipur Convention Center from June 19 to June 21, 2026.",
  calendar: [
    { week: "May 6 - May 9", label: "Round 1" },
    { week: "May 11 - May 14", label: "Round 2" },
    { week: "May 18 - May 19", label: "Round 3" },
    { week: "May 28 - May 31", label: "Round 4" },
    { week: "Jun 2 - Jun 5", label: "Survival Stage" },
    { week: "Jun 9 - Jun 12", label: "Semi Finals" },
    { week: "Jun 13 - Jun 14", label: "Last Chance Stage" },
    { week: "Jun 19 - Jun 21", label: "Grand Finals" },
  ],
  description:
    "Battlegrounds Mobile India Pro Series 2026 is the fifth edition of BMPS. The event features 64 invited teams, runs from May 6 to June 21, 2026, and ends with a 16-team LAN Grand Finals at Jaipur Convention Center in Jaipur, India. The champion qualifies for the PUBG Mobile World Cup 2026.",
  rules:
    "Points system: 1st place 10, 2nd 6, 3rd 5, 4th 4, 5th 3, 6th 2, 7th-8th 1, 9th-16th 0. Each elimination gives 1 point. Tiebreakers are resolved by total WWCDs, then total placement points, then total elimination points, then the best placement rank in the most recent match. Allocation: the champion qualifies for the PUBG Mobile World Cup 2026.",
  participants: [
    { placement: 1, team: "Team Versatile", phase: "Round 1 - Group D", players: ["DeadPlayer", "Nobi"] },
    { placement: 2, team: "Godsent Legions", phase: "Round 1 - Group C", players: [] },
    { placement: 3, team: "NONX Esports", phase: "Round 1 - Group C", players: [] },
    { placement: 4, team: "Rising Esports", phase: "Round 1 - Group C", players: ["Yuva", "BeardBaba", "Shrey"] },
    { placement: 5, team: "Phoenix Esports", phase: "Round 1 - Group D", players: [] },
    { placement: 6, team: "Gods Reign", phase: "Round 1 - Group D", players: ["Destro", "DeltaPG", "Justin", "Neyo", "AquaNox"] },
    { placement: 7, team: "True Rippers", phase: "Round 1 - Group D", players: [] },
    { placement: 8, team: "iQOO SouL", phase: "BMPS 2026", players: [] },
    { placement: 9, team: "White Walkers", phase: "BMPS 2026", players: ["Aditya", "Vegito", "Mernox", "Guru", "Sheek"] },
    { placement: 10, team: "7Gods Esports", phase: "BMPS 2026", players: [] },
    { placement: 11, team: "Team Apex Gaming", phase: "BMPS 2026", players: [] },
    { placement: 12, team: "Likitha Esports", phase: "Round 1 - Group C", players: ["Smoker46", "XoXo45", "Starboyy", "Inferno", "Magic"] },
    { placement: 13, team: "K9 Esports", phase: "BMPS 2026", players: ["Stranger", "Saumraj", "Smoker46", "Taurus", "SnowJOD"] },
    { placement: 14, team: "Divine Gaming", phase: "BMPS 2026", players: [] },
    { placement: 15, team: "GodLike Esports", phase: "BMPS 2026", players: ["Spower", "ADMINO", "Godz", "Manya", "Saumay"] },
    { placement: 16, team: "Vasista Esports", phase: "BMPS 2026", players: ["Beast", "Hector", "Rony", "Aimbot", "Dionysus"] },
    { placement: 17, team: "Aura X Esports", phase: "Round 1 - Group C", players: [] },
    { placement: 18, team: "Lastade Esports", phase: "BMPS 2026", players: [] },
    { placement: 19, team: "Myth Official", phase: "BMPS 2026", players: ["Harshil", "Lucifer", "Daddy", "Detrox", "Aryton"] },
    { placement: 20, team: "DCxSCR Esports", phase: "Round 1 - Group D", players: [] },
    { placement: 21, team: "Learn From Past", phase: "BMPS 2026", players: ["Termi", "RushBoy", "MAX", "Honey", "SHADOWW"] },
    { placement: 22, team: "Esport Social", phase: "Round 1 - Group D", players: [] },
    { placement: 23, team: "Autobotz Esports", phase: "Round 1 - Group D", players: ["Areeb", "Lobster", "Ralphie", "FanOP", "Eggy666"] },
    { placement: 24, team: "Mysterious4", phase: "Round 1 - Group C", players: ["Sketch", "Naman", "Fragger", "Goku"] },
    { placement: 25, team: "HADX Esports", phase: "BMPS 2026", players: [] },
    { placement: 26, team: "iQOO Reckoning Esports", phase: "BMPS 2026", players: ["Levi", "Lovish", "Roman", "SahilOPAF", "Pro"] },
    { placement: 27, team: "iQOO Revenant XSpark", phase: "BMPS 2026", players: ["NinjaJOD", "Pain09", "Tracegod", "Sukuna", "Proton"] },
    { placement: 28, team: "4TR Official", phase: "BMPS 2026", players: ["Anonymous", "Arther", "Viper", "Rapido", "Flexjod"] },
    { placement: 29, team: "Wyld Fangs", phase: "BMPS 2026", players: ["SPRAYGOD", "Goten", "Kanha", "SENSEI", "Sam999"] },
    { placement: 30, team: "Genesis Esports", phase: "BMPS 2026", players: ["ViPER", "GravityJOD", "HunterZ", "FurY", "Zap"] },
    { placement: 31, team: "iQOO 8Bit", phase: "BMPS 2026", players: ["Juicy", "Sarang", "Skipz", "Hexy", "Radien", "Shubh"] },
    { placement: 32, team: "Victores Sumus", phase: "BMPS 2026", players: ["Owais", "Mafia36", "VeNoM", "ScaryJod", "Paritosh"] },
    { placement: 33, team: "MadKings", phase: "BMPS 2026", players: ["SHADOW", "ClutchGod"] },
    { placement: 34, team: "Rapid Chaos Esports", phase: "Round 1 - Group C", players: [] },
    { placement: 35, team: "Futurise Esports Empire Originals", phase: "Round 1 - Group D", players: [] },
    { placement: 36, team: "Team H4K", phase: "BMPS 2026", players: [] },
    { placement: 37, team: "Godsent Esports", phase: "Round 1 - Group D", players: [] },
    { placement: 38, team: "Team Doxy", phase: "Round 1 - Group D", players: [] },
    { placement: 39, team: "GENxFM Esports", phase: "Round 1 - Group C", players: [] },
    { placement: 40, team: "RiotNationz", phase: "BMPS 2026", players: [] },
    { placement: 41, team: "T7xOrion Esports", phase: "Round 1 - Group C", players: [] },
    { placement: 42, team: "Jaguar Esports", phase: "BMPS 2026", players: [] },
    { placement: 43, team: "Oops Official", phase: "Round 1 - Group D", players: [] },
    { placement: 44, team: "Blink Esports", phase: "Round 1 - Group C", players: [] },
    { placement: 45, team: "Nebula Esports", phase: "BMPS 2026", players: ["Aadi", "KnowMe", "KRATOS", "Phoenix", "Arjun"] },
    { placement: 46, team: "Quantum Sparks", phase: "Round 1 - Group D", players: [] },
    { placement: 47, team: "iQOO Team Tamillas", phase: "BMPS 2026", players: [] },
    { placement: 48, team: "Ares Esport", phase: "Round 1 - Group C", players: [] },
    { placement: 49, team: "Santa Esports", phase: "Round 1 - Group C", players: [] },
    { placement: 50, team: "iQOO Orangutan", phase: "BMPS 2026", players: ["AK", "Aaru", "Attanki", "WizzGOD"] },
    { placement: 51, team: "SomeOnes Dream", phase: "Round 1 - Group D", players: [] },
    { placement: 52, team: "WindGod Esports", phase: "BMPS 2026", players: [] },
    { placement: 53, team: "Higgboson Esports", phase: "BMPS 2026", players: [] },
    { placement: 54, team: "Team Flying Esports", phase: "Round 1 - Group C", players: [] },
    { placement: 55, team: "Naqsh Esports", phase: "BMPS 2026", players: [] },
    { placement: 56, team: "Team Aryan", phase: "Round 1 - Group D", players: ["Aryan", "Devotee", "Syrax", "Pro", "Raiden"] },
    { placement: 57, team: "Troy Tamilian Esports", phase: "BMPS 2026", players: [] },
    { placement: 58, team: "Jaapi Esports", phase: "Round 1 - Group D", players: [] },
    { placement: 59, team: "ThunderGods X Tortuga Gaming", phase: "Round 1 - Group C", players: [] },
    { placement: 60, team: "Zero Ark Official", phase: "Round 1 - Group C", players: [] },
    { placement: 61, team: "7AcesXTRB Esports", phase: "Round 1 - Group C", players: [] },
    { placement: 62, team: "Team RedXRoss", phase: "Round 1 - Group D", players: ["Phoenix", "Lucifer", "Arto", "Beast04"] },
    { placement: 63, team: "Welt Esports", phase: "BMPS 2026", players: ["GokulWNL", "Shyam", "DragonOP", "Rico", "PokoWNL"] },
    { placement: 64, team: "Meta Ninza", phase: "BMPS 2026", players: ["Shadow7", "Fierce", "Apollo"] },
  ],
  stages: [
    {
      name: "Round 1",
      order: 1,
      status: "upcoming",
      teamCount: 64,
      mapRotation: [
        { match: 1, map: "Rondo", day1: "C", day2: "B", day3: "D", day4: "A" },
        { match: 2, map: "Erangel", day1: "C", day2: "B", day3: "D", day4: "A" },
        { match: 3, map: "Erangel", day1: "C", day2: "B", day3: "D", day4: "A" },
        { match: 4, map: "Erangel", day1: "B", day2: "C", day3: "A", day4: "D" },
        { match: 5, map: "Miramar", day1: "B", day2: "C", day3: "A", day4: "D" },
        { match: 6, map: "Miramar", day1: "B", day2: "C", day3: "A", day4: "D" },
      ],
      summary:
        "May 6th - 9th, 2026. 64 invited teams begin the league phase. Teams are split into Groups A-D with 16 teams each. The round runs for 4 matchdays with 6 matches per day, for 24 matches total. After Round 1, promotion and relegation apply: the top 4 teams from Groups B/C/D move up one group, the 5th-12th placed teams remain in the same group, and the bottom 4 teams from Groups A/B/C move down one group.",
    },
    {
      name: "Round 2",
      order: 2,
      status: "upcoming",
      teamCount: 64,
      summary:
        "May 11th - 14th, 2026. The reshuffled Groups A-D continue the league phase. Teams again play 4 matchdays with 6 matches per day for 24 matches total. After Round 2, promotion and relegation apply with the same system: top 4 from Groups B/C/D move up, 5th-12th stay, and bottom 4 from Groups A/B/C move down.",
    },
    {
      name: "Round 3",
      order: 3,
      status: "upcoming",
      teamCount: 64,
      summary:
        "May 18th - 19th, 2026. The third league round continues with the updated group order. Promotion and relegation are applied once more after this round: top 4 from Groups B/C/D move up, 5th-12th remain in place, and bottom 4 from Groups A/B/C move down.",
    },
    {
      name: "Round 4",
      order: 4,
      status: "upcoming",
      teamCount: 64,
      summary:
        "May 28th - 31st, 2026. The final league round decides qualification. There is no reshuffling after Round 4. At the end of this round, the top 8 teams of Group A qualify for Grand Finals, the bottom 8 of Group A plus the top 8 of Group B advance to Semi Finals, the bottom 8 of Group B plus all 16 teams of Group C plus the top 8 of Group D move to Survival Stage, and the bottom 8 of Group D are eliminated.",
    },
    {
      name: "Survival Stage",
      order: 5,
      status: "upcoming",
      teamCount: 32,
      summary:
        "June 2nd - 5th, 2026. 32 teams compete across 4 matchdays: 8 from Qualifiers Group B, 16 from Qualifiers Group C, and 8 from Qualifiers Group D. Teams are divided into 4 groups of 8, play a round-robin format for 12 matches each, and the top 8 overall advance to Semi Finals.",
    },
    {
      name: "Semi Finals",
      order: 6,
      status: "upcoming",
      teamCount: 24,
      summary:
        "June 9th - 12th, 2026. 24 teams play across 4 matchdays: 8 from Qualifiers Group A, 8 from Qualifiers Group B, and 8 from Survival Stage. Teams are divided into 3 groups of 8, use a double round-robin format, and play 16 matches each. The top 6 reach Grand Finals, teams placed 7th-22nd move to Last Chance, and the bottom 2 are eliminated.",
    },
    {
      name: "Last Chance Stage",
      order: 7,
      status: "upcoming",
      teamCount: 16,
      summary: "June 13th - 14th, 2026. 16 teams play 12 matches across 2 matchdays, with the top 2 teams advancing to the Grand Finals.",
    },
    {
      name: "Grand Finals",
      order: 8,
      status: "upcoming",
      teamCount: 16,
      summary:
        "June 19th - 21st, 2026 at Jaipur Convention Center, Jaipur, India. 16 teams compete across 3 matchdays and 18 matches: 8 from Group A after Round 4, 6 from Semi Finals, and 2 from Last Chance Stage.",
    },
  ],
};

tournament.participants = tournament.participants.map((entry) => {
  const rosterOverride = BMPS_2026_ROSTERS[normalizeOrganizationName(entry.team)];

  return {
    ...entry,
    phase:
      entry.phase !== "BMPS 2026"
        ? entry.phase
        : ROUND_ONE_GROUP_B_TEAMS.has(normalizeTeam(entry.team))
          ? "Round 1 - Group B"
          : "Round 1 - Group A",
    players: rosterOverride || entry.players || [],
  };
});

const articles = [
  {
    title: "BMPS 2026 announced with Jaipur Grand Finals in June",
    content:
      "Battlegrounds Mobile India Pro Series 2026 will run from May 6 through June 21, 2026. The Grand Finals are scheduled for June 19 to June 21 at Jaipur Convention Center in Jaipur, with the champion qualifying for the PUBG Mobile World Cup 2026.",
    category: "announcement",
    game: "BGMI",
    featured: 0,
  },
];

const tx = db.transaction(() => {
  const existingTournament = db.prepare("SELECT id FROM tournaments WHERE name = ?").get(tournament.name);

  if (existingTournament) {
    db.prepare("DELETE FROM matches WHERE tournament_id = ?").run(existingTournament.id);
    db.prepare("DELETE FROM match_results WHERE tournament_id = ?").run(existingTournament.id);
    db.prepare("DELETE FROM tournaments WHERE id = ?").run(existingTournament.id);
  }

  const tournamentId = randomUUID();
  db.prepare(`
    INSERT INTO tournaments (
      id, name, game, tier, status, prize_pool, start_date, end_date, stages,
      description, banner_url, rules, max_teams, format_overview, calendar,
      participants, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    JSON.stringify(tournament.participants),
    now,
    now,
    "admin@stagecore.local"
  );

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

console.log("Imported BMPS 2026 tournament, key schedule, and announcement.");

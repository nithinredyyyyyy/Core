import { db } from "../server/db.js";

const PEL_NAME = "Peacekeeper Elite League 2026 Summer";
const t = db.prepare("SELECT id FROM tournaments WHERE name = ?").get(PEL_NAME);
if (!t) { console.error("Not found"); process.exit(1); }

// Stages with standings
const stages = JSON.stringify([
  {
    name: "Regular Season",
    order: 1,
    status: "completed",
    teamCount: 22,
    summary: "7 weeks (May 28 – June 21, July 9 – 26, 2026). Each week features a Breakout day for 16 teams and 3-day Weekly Finals. Top 6 advance to Finals, bottom 16 proceed to Playoffs.",
    standings: [
      { placement: 1, team: "Weibo Gaming", points: 969 },
      { placement: 2, team: "ThunderTalk Gaming", points: 968 },
      { placement: 3, team: "Tianba", points: 960 },
      { placement: 4, team: "All Gamers", points: 870 },
      { placement: 5, team: "Hao Han Gaming", points: 869 },
      { placement: 6, team: "LGD Gaming", points: 774 },
      { placement: 7, team: "Four Angry Men", points: 758 },
      { placement: 8, team: "Regans Gaming", points: 749 },
      { placement: 9, team: "The Chosen", points: 735 },
      { placement: 10, team: "Crab Esports", points: 619 },
      { placement: 11, team: "JD Gaming", points: 567 },
      { placement: 12, team: "Six Two Eight", points: 557 },
      { placement: 13, team: "Tong Jia Bao Esports", points: 528 },
      { placement: 14, team: "Nova Esports", points: 515 },
      { placement: 15, team: "LT Gaming", points: 457 },
      { placement: 16, team: "KONE ESPORT", points: 432 },
      { placement: 17, team: "Titan Esports Club", points: 396 },
      { placement: 18, team: "Rogue Warriors", points: 341 },
      { placement: 19, team: "KuaiShou Gaming", points: 240 },
      { placement: 20, team: "Vision Esports", points: 169 },
      { placement: 21, team: "Etk E-sports", points: 55 },
      { placement: 22, team: "Action Culture Tech.", points: 0 }
    ]
  },
  {
    name: "Playoffs",
    order: 2,
    status: "completed",
    teamCount: 16,
    summary: "July 30 – August 2, 2026. 16 teams from Regular Season. Top 10 advance to Finals, bottom 6 are eliminated.",
    standings: [
      { placement: 1, team: "Regans Gaming", points: 238 },
      { placement: 2, team: "LT Gaming", points: 208 },
      { placement: 3, team: "Tong Jia Bao Esports", points: 198 },
      { placement: 4, team: "Four Angry Men", points: 183 },
      { placement: 5, team: "Nova Esports", points: 168 },
      { placement: 6, team: "The Chosen", points: 163 },
      { placement: 7, team: "JD Gaming", points: 159 },
      { placement: 8, team: "Crab Esports", points: 155 },
      { placement: 9, team: "Titan Esports Club", points: 146 },
      { placement: 10, team: "Six Two Eight", points: 133 },
      { placement: 11, team: "KONE ESPORT", points: 127 },
      { placement: 12, team: "Action Culture Tech.", points: 122 },
      { placement: 13, team: "Rogue Warriors", points: 120 },
      { placement: 14, team: "KuaiShou Gaming", points: 110 },
      { placement: 15, team: "Vision Esports", points: 110 },
      { placement: 16, team: "Etk E-sports", points: 81 }
    ]
  },
  {
    name: "Finals",
    order: 3,
    status: "ongoing",
    teamCount: 16,
    summary: "August 28–30, 2026. 16 teams (6 direct from Regular Season + 10 from Playoffs). 3 matchdays with Smash Rule.",
    standings: [
      { placement: 1, team: "Weibo Gaming", points: 83 },
      { placement: 2, team: "Regans Gaming", points: 67 },
      { placement: 3, team: "LGD Gaming", points: 60 },
      { placement: 4, team: "JD Gaming", points: 58 },
      { placement: 5, team: "Tianba", points: 58 },
      { placement: 6, team: "Four Angry Men", points: 56 },
      { placement: 7, team: "Crab Esports", points: 54 },
      { placement: 8, team: "Hao Han Gaming", points: 52 },
      { placement: 9, team: "All Gamers", points: 49 },
      { placement: 10, team: "ThunderTalk Gaming", points: 44 },
      { placement: 11, team: "LT Gaming", points: 37 },
      { placement: 12, team: "Six Two Eight", points: 35 },
      { placement: 13, team: "The Chosen", points: 35 },
      { placement: 14, team: "Tong Jia Bao Esports", points: 34 },
      { placement: 15, team: "Titan Esports Club", points: 28 },
      { placement: 16, team: "Nova Esports", points: 21 }
    ]
  }
]);

const prize_breakdown = JSON.stringify([
  { placement: "1st", team: "TBD", usd: "445,981", inr: "3,000,000 CNY" },
  { placement: "2nd", team: "TBD", usd: "222,990", inr: "1,500,000 CNY" },
  { placement: "3rd", team: "TBD", usd: "148,660", inr: "1,000,000 CNY" },
  { placement: "4th", team: "TBD", usd: "118,928", inr: "800,000 CNY" },
  { placement: "5th", team: "TBD", usd: "89,196", inr: "600,000 CNY" },
  { placement: "6th", team: "TBD", usd: "59,464", inr: "400,000 CNY" },
  { placement: "7th", team: "TBD", usd: "29,732", inr: "200,000 CNY" },
  { placement: "8th", team: "TBD", usd: "22,299", inr: "150,000 CNY" },
  { placement: "9th", team: "TBD", usd: "11,893", inr: "80,000 CNY" },
  { placement: "10th", team: "TBD", usd: "8,920", inr: "60,000 CNY" }
]);

const calendar = JSON.stringify([
  { week: "Week 1", label: "Regular Season – May 28–31", dates: "May 28–31, 2026" },
  { week: "Week 2", label: "Regular Season – June 4–7", dates: "June 4–7, 2026" },
  { week: "Week 3", label: "Regular Season – June 11–14", dates: "June 11–14, 2026" },
  { week: "Week 4", label: "Regular Season – June 18–21", dates: "June 18–21, 2026" },
  { week: "Week 5", label: "Regular Season – July 9–12", dates: "July 9–12, 2026" },
  { week: "Week 6", label: "Regular Season – July 16–19", dates: "July 16–19, 2026" },
  { week: "Week 7", label: "Regular Season – July 23–26", dates: "July 23–26, 2026" },
  { week: "Playoffs", label: "Playoffs – July 30–Aug 2", dates: "July 30 – August 2, 2026" },
  { week: "Finals", label: "Finals – August 28–30", dates: "August 28–30, 2026" }
]);

db.prepare(`
  UPDATE tournaments 
  SET stages = ?, prize_breakdown = ?, calendar = ?
  WHERE id = ?
`).run(stages, prize_breakdown, calendar, t.id);

console.log("Updated PEL stages, standings, and calendar.");

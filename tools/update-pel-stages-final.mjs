import { db } from "../server/db.js";

const PEL_NAME = "Peacekeeper Elite League 2026 Summer";
const t = db.prepare("SELECT id FROM tournaments WHERE name = ?").get(PEL_NAME);
if (!t) { console.error("Not found"); process.exit(1); }

const stages = JSON.stringify([
  {
    name: "Regular Season",
    order: 1,
    status: "completed",
    teamCount: 22,
    summary: "7 weeks (May 28 – Jun 21 & Jul 9 – 26, 2026). Breakout (Day 1) + Weekly Finals (Day 2–4) each week. Top 6 teams qualify directly for Grand Finals; bottom 16 proceed to Playoffs.",
    standings: [
      { placement: 1,  team: "Weibo Gaming",        points: 969, week1: 132, week2: 138, week3: 112, week4: 228, week5: 94,  week6: 160, week7: 105 },
      { placement: 2,  team: "ThunderTalk Gaming",  points: 968, week1: 79,  week2: 152, week3: 156, week4: 190, week5: 150, week6: 97,  week7: 144 },
      { placement: 3,  team: "Tianba",              points: 960, week1: 121, week2: 150, week3: 146, week4: 116, week5: 158, week6: 158, week7: 111 },
      { placement: 4,  team: "All Gamers",          points: 870, week1: 164, week2: 170, week3: 164, week4: 148, week5: 83,  week6: 63,  week7: 78  },
      { placement: 5,  team: "Hao Han Gaming",      points: 869, week1: 115, week2: 141, week3: 108, week4: 92,  week5: 153, week6: 133, week7: 127 },
      { placement: 6,  team: "LGD Gaming",          points: 774, week1: 101, week2: 154, week3: 166, week4: 93,  week5: 151, week6: 109, week7: null },
      { placement: 7,  team: "Four Angry Men",      points: 758, week1: 135, week2: 103, week3: null, week4: 113, week5: 115, week6: 137, week7: 155 },
      { placement: 8,  team: "Regans Gaming",       points: 749, week1: 128, week2: 83,  week3: 111, week4: 135, week5: 111, week6: 78,  week7: 103 },
      { placement: 9,  team: "The Chosen",          points: 735, week1: 120, week2: null, week3: 149, week4: 100, week5: 109, week6: 112, week7: 145 },
      { placement: 10, team: "Crab Esports",        points: 619, week1: null, week2: 69,  week3: 93,  week4: 54,  week5: 132, week6: 128, week7: 143 },
      { placement: 11, team: "JD Gaming",           points: 567, week1: 126, week2: 121, week3: 130, week4: 101, week5: 89,  week6: null, week7: null },
      { placement: 12, team: "Six Two Eight",       points: 557, week1: null, week2: 93,  week3: 96,  week4: null, week5: 159, week6: 109, week7: 100 },
      { placement: 13, team: "Tong Jia Bao Esports",points: 528, week1: null, week2: 97,  week3: 112, week4: 66,  week5: 73,  week6: 75,  week7: 105 },
      { placement: 14, team: "Nova Esports",        points: 515, week1: 117, week2: null, week3: null, week4: 74,  week5: 136, week6: 76,  week7: 112 },
      { placement: 15, team: "LT Gaming",           points: 457, week1: 86,  week2: null, week3: 89,  week4: 76,  week5: 102, week6: null, week7: 104 },
      { placement: 16, team: "KONE ESPORT",         points: 432, week1: 116, week2: 103, week3: 78,  week4: null, week5: null, week6: 70,  week7: 65  },
      { placement: 17, team: "Titan Esports Club",  points: 396, week1: null, week2: 93,  week3: null, week4: 94,  week5: null, week6: 98,  week7: 111 },
      { placement: 18, team: "Rogue Warriors",      points: 341, week1: 60,  week2: 41,  week3: 96,  week4: null, week5: null, week6: 75,  week7: 69  },
      { placement: 19, team: "KuaiShou Gaming",     points: 240, week1: 61,  week2: null, week3: 76,  week4: null, week5: 103, week6: null, week7: null },
      { placement: 20, team: "Vision Esports",      points: 169, week1: 108, week2: 61,  week3: null, week4: null, week5: null, week6: null, week7: null },
      { placement: 21, team: "Etk E-sports",        points: 55,  week1: null, week2: null, week3: null, week4: 55,  week5: null, week6: null, week7: null },
      { placement: 22, team: "Action Culture Tech.", points: 0,  week1: null, week2: null, week3: null, week4: null, week5: null, week6: null, week7: null }
    ]
  },
  {
    name: "Playoffs",
    order: 2,
    status: "completed",
    teamCount: 16,
    summary: "Jul 30 – Aug 2, 2026 at Quantum Hero E-sports Center, Chengdu. 16 teams (ranks 7–22 from Regular Season) competed with Headstart Points seeding. Top 10 qualified for Grand Finals; bottom 6 eliminated.",
    headstartPoints: [
      { team: "Four Angry Men", points: 10 },
      { team: "Regans Gaming", points: 8 },
      { team: "The Chosen", points: 7 },
      { team: "Crab Esports", points: 6 },
      { team: "JD Gaming", points: 5 },
      { team: "Six Two Eight", points: 4 },
      { team: "Tong Jia Bao Esports", points: 3 },
      { team: "Nova Esports", points: 3 },
      { team: "LT Gaming", points: 2 },
      { team: "KONE ESPORT", points: 2 },
      { team: "Titan Esports Club", points: 1 },
      { team: "Rogue Warriors", points: 1 },
      { team: "KuaiShou Gaming", points: 0 },
      { team: "Vision Esports", points: 0 },
      { team: "Etk E-sports", points: 0 },
      { team: "Action Culture Tech.", points: 0 }
    ],
    standings: [
      { placement: 1,  team: "Regans Gaming",        points: 238, placePts: 2, elimPts: 66, headstart: 8  },
      { placement: 2,  team: "LT Gaming",            points: 208, placePts: 4, elimPts: 71, headstart: 2  },
      { placement: 3,  team: "Tong Jia Bao Esports", points: 198, placePts: 2, elimPts: 60, headstart: 3  },
      { placement: 4,  team: "Four Angry Men",       points: 183, placePts: 1, elimPts: 56, headstart: 10 },
      { placement: 5,  team: "Nova Esports",         points: 168, placePts: 4, elimPts: 52, headstart: 3  },
      { placement: 6,  team: "The Chosen",           points: 163, placePts: 3, elimPts: 59, headstart: 7  },
      { placement: 7,  team: "JD Gaming",            points: 159, placePts: 1, elimPts: 56, headstart: 5  },
      { placement: 8,  team: "Crab Esports",         points: 155, placePts: 2, elimPts: 46, headstart: 6  },
      { placement: 9,  team: "Titan Esports Club",   points: 146, placePts: 3, elimPts: 51, headstart: 1  },
      { placement: 10, team: "Six Two Eight",        points: 133, placePts: 1, elimPts: 42, headstart: 4  },
      { placement: 11, team: "KONE ESPORT",          points: 127, placePts: 0, elimPts: 43, headstart: 2  },
      { placement: 12, team: "Action Culture Tech.", points: 122, placePts: 1, elimPts: 52, headstart: 0  },
      { placement: 13, team: "Rogue Warriors",       points: 120, placePts: 0, elimPts: 31, headstart: 1  },
      { placement: 14, team: "KuaiShou Gaming",      points: 110, placePts: 0, elimPts: 18, headstart: 0  },
      { placement: 15, team: "Vision Esports",       points: 110, placePts: 0, elimPts: 42, headstart: 0  },
      { placement: 16, team: "Etk E-sports",         points: 81,  placePts: 0, elimPts: 23, headstart: 0  }
    ]
  },
  {
    name: "Grand Finals",
    order: 3,
    status: "ongoing",
    teamCount: 16,
    summary: "Aug 28–30, 2026 at Qingdao Citizen Fitness Center Gymnasium. 16 teams (6 direct + 10 via Playoffs) compete over 3 matchdays. Smash Rule applied. Through Game 7 completed.",
    headstartPoints: [
      { team: "Weibo Gaming", points: 10 },
      { team: "ThunderTalk Gaming", points: 8 },
      { team: "Tianba", points: 7 },
      { team: "All Gamers", points: 6 },
      { team: "Hao Han Gaming", points: 5 },
      { team: "LGD Gaming", points: 4 },
      { team: "Regans Gaming", points: 3 },
      { team: "LT Gaming", points: 3 },
      { team: "Tong Jia Bao Esports", points: 2 },
      { team: "Four Angry Men", points: 2 },
      { team: "Nova Esports", points: 1 },
      { team: "The Chosen", points: 1 },
      { team: "JD Gaming", points: 0 },
      { team: "Crab Esports", points: 0 },
      { team: "Titan Esports Club", points: 0 },
      { team: "Six Two Eight", points: 0 }
    ],
    standings: [
      { placement: 1,  team: "Weibo Gaming",        points: 83, matches: 7, wwcd: 0 },
      { placement: 2,  team: "Regans Gaming",       points: 67, matches: 7, wwcd: 1 },
      { placement: 3,  team: "LGD Gaming",          points: 60, matches: 7, wwcd: 2 },
      { placement: 4,  team: "JD Gaming",           points: 58, matches: 7, wwcd: 1 },
      { placement: 5,  team: "Tianba",              points: 58, matches: 7, wwcd: 1 },
      { placement: 6,  team: "Four Angry Men",      points: 56, matches: 7, wwcd: 2 },
      { placement: 7,  team: "Crab Esports",        points: 54, matches: 7, wwcd: 0 },
      { placement: 8,  team: "Hao Han Gaming",      points: 52, matches: 7, wwcd: 0 },
      { placement: 9,  team: "All Gamers",          points: 49, matches: 7, wwcd: 0 },
      { placement: 10, team: "ThunderTalk Gaming",  points: 44, matches: 7, wwcd: 0 },
      { placement: 11, team: "LT Gaming",           points: 37, matches: 7, wwcd: 0 },
      { placement: 12, team: "Six Two Eight",       points: 35, matches: 7, wwcd: 0 },
      { placement: 13, team: "The Chosen",          points: 35, matches: 7, wwcd: 0 },
      { placement: 14, team: "Tong Jia Bao Esports",points: 34, matches: 7, wwcd: 0 },
      { placement: 15, team: "Titan Esports Club",  points: 28, matches: 7, wwcd: 0 },
      { placement: 16, team: "Nova Esports",        points: 21, matches: 7, wwcd: 0 }
    ]
  }
]);

db.prepare(`
  UPDATE tournaments
  SET stages = ?
  WHERE id = ?
`).run(stages, t.id);

// Update match results for dummy match to reflect WWCD
const matchId = db.prepare("SELECT id FROM matches WHERE tournament_id = ?").get(t.id).id;
const updateResult = db.prepare(`
  UPDATE match_results SET wins_count = ?, matches_count = ? WHERE match_id = ? AND team_id = (SELECT id FROM teams WHERE name = ? COLLATE NOCASE)
`);

const finalStandings = [
  { team: "Weibo Gaming",        wwcd: 0 },
  { team: "Regans Gaming",       wwcd: 1 },
  { team: "LGD Gaming",          wwcd: 2 },
  { team: "JD Gaming",           wwcd: 1 },
  { team: "Tianba",              wwcd: 1 },
  { team: "Four Angry Men",      wwcd: 2 },
  { team: "Crab Esports",        wwcd: 0 },
  { team: "Hao Han Gaming",      wwcd: 0 },
  { team: "All Gamers",          wwcd: 0 },
  { team: "ThunderTalk Gaming",  wwcd: 0 },
  { team: "LT Gaming",           wwcd: 0 },
  { team: "Six Two Eight",       wwcd: 0 },
  { team: "The Chosen",          wwcd: 0 },
  { team: "Tong Jia Bao Esports",wwcd: 0 },
  { team: "Titan Esports Club",  wwcd: 0 },
  { team: "Nova Esports",        wwcd: 0 }
];

for (const s of finalStandings) {
  updateResult.run(s.wwcd, 7, matchId, s.team);
}

console.log("Updated PEL stages with full standings data");

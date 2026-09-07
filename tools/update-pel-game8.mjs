import { db } from "../server/db.js";

const PEL_NAME = "Peacekeeper Elite League 2026 Summer";
const t = db.prepare("SELECT id, stages FROM tournaments WHERE name = ?").get(PEL_NAME);
if (!t) { console.error("Not found"); process.exit(1); }

let stages = JSON.parse(t.stages);

// 1. Regular Season remains unchanged in terms of data

// 2. Playoffs (Update with corrected headstart)
const playoffs = stages.find(s => s.name === "Playoffs");
playoffs.headstartPoints = [
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
];
playoffs.standings = [
  { placement: 1,  team: "Regans Gaming",        points: 238, matches: 24, wwcd: 2, placePts: 66, elimPts: 164, headstart: 8  },
  { placement: 2,  team: "LT Gaming",            points: 208, matches: 24, wwcd: 4, placePts: 71, elimPts: 135, headstart: 2  },
  { placement: 3,  team: "Tong Jia Bao Esports", points: 198, matches: 24, wwcd: 2, placePts: 60, elimPts: 135, headstart: 3  },
  { placement: 4,  team: "Four Angry Men",       points: 183, matches: 24, wwcd: 1, placePts: 56, elimPts: 117, headstart: 10 },
  { placement: 5,  team: "Nova Esports",         points: 168, matches: 24, wwcd: 4, placePts: 52, elimPts: 113, headstart: 3  },
  { placement: 6,  team: "The Chosen",           points: 163, matches: 24, wwcd: 3, placePts: 59, elimPts: 97,  headstart: 7  },
  { placement: 7,  team: "JD Gaming",            points: 159, matches: 24, wwcd: 1, placePts: 56, elimPts: 98,  headstart: 5  },
  { placement: 8,  team: "Crab Esports",         points: 155, matches: 24, wwcd: 2, placePts: 46, elimPts: 103, headstart: 6  },
  { placement: 9,  team: "Titan Esports Club",   points: 146, matches: 24, wwcd: 3, placePts: 51, elimPts: 94,  headstart: 1  },
  { placement: 10, team: "Six Two Eight",        points: 133, matches: 24, wwcd: 1, placePts: 42, elimPts: 87,  headstart: 4  },
  { placement: 11, team: "KONE ESPORT",          points: 127, matches: 24, wwcd: 0, placePts: 43, elimPts: 82,  headstart: 2  },
  { placement: 12, team: "Action Culture Tech.", points: 122, matches: 24, wwcd: 1, placePts: 52, elimPts: 70,  headstart: 0  },
  { placement: 13, team: "Rogue Warriors",       points: 120, matches: 24, wwcd: 0, placePts: 31, elimPts: 88,  headstart: 1  },
  { placement: 14, team: "KuaiShou Gaming",      points: 110, matches: 24, wwcd: 0, placePts: 18, elimPts: 92,  headstart: 0  },
  { placement: 15, team: "Vision Esports",       points: 110, matches: 24, wwcd: 0, placePts: 42, elimPts: 68,  headstart: 0  },
  { placement: 16, team: "Etk E-sports",         points: 81,  matches: 24, wwcd: 0, placePts: 23, elimPts: 58,  headstart: 0  }
];

// 3. Grand Finals (Update with Game 8 data)
const finals = stages.find(s => s.name === "Grand Finals");
finals.summary = "Aug 28–30, 2026 at Qingdao Citizen Fitness Center Gymnasium. 16 teams (6 direct + 10 via Playoffs) compete over 3 matchdays. Smash Rule applied. Through Game 8 completed.";
finals.standings = [
  { placement: 1,  team: "Weibo Gaming",        points: 91, matches: 8, wwcd: 0, placePts: 20, elimPts: 61, headstart: 10 },
  { placement: 2,  team: "Hao Han Gaming",      points: 74, matches: 8, wwcd: 1, placePts: 23, elimPts: 46, headstart: 5  },
  { placement: 3,  team: "JD Gaming",           points: 70, matches: 8, wwcd: 1, placePts: 25, elimPts: 45, headstart: 0  },
  { placement: 4,  team: "Regans Gaming",       points: 67, matches: 8, wwcd: 1, placePts: 23, elimPts: 41, headstart: 3  },
  { placement: 5,  team: "Four Angry Men",      points: 65, matches: 8, wwcd: 2, placePts: 27, elimPts: 36, headstart: 2  },
  { placement: 6,  team: "LGD Gaming",          points: 60, matches: 8, wwcd: 2, placePts: 21, elimPts: 35, headstart: 4  },
  { placement: 7,  team: "Tianba",              points: 59, matches: 8, wwcd: 1, placePts: 22, elimPts: 30, headstart: 7  },
  { placement: 8,  team: "Crab Esports",        points: 54, matches: 8, wwcd: 0, placePts: 17, elimPts: 37, headstart: 0  },
  { placement: 9,  team: "Six Two Eight",       points: 54, matches: 8, wwcd: 0, placePts: 17, elimPts: 37, headstart: 0  },
  { placement: 10, team: "All Gamers",          points: 50, matches: 8, wwcd: 0, placePts: 17, elimPts: 27, headstart: 6  },
  { placement: 11, team: "ThunderTalk Gaming",  points: 49, matches: 8, wwcd: 0, placePts: 10, elimPts: 31, headstart: 8  },
  { placement: 12, team: "LT Gaming",           points: 38, matches: 8, wwcd: 0, placePts: 2,  elimPts: 33, headstart: 3  },
  { placement: 13, team: "The Chosen",          points: 37, matches: 8, wwcd: 0, placePts: 13, elimPts: 23, headstart: 1  },
  { placement: 14, team: "Titan Esports Club",  points: 37, matches: 8, wwcd: 0, placePts: 9,  elimPts: 28, headstart: 0  },
  { placement: 15, team: "Tong Jia Bao Esports",points: 34, matches: 8, wwcd: 0, placePts: 4,  elimPts: 28, headstart: 2  },
  { placement: 16, team: "Nova Esports",        points: 22, matches: 8, wwcd: 0, placePts: 6,  elimPts: 15, headstart: 1  }
];

db.prepare("UPDATE tournaments SET stages = ? WHERE id = ?").run(JSON.stringify(stages), t.id);

// 4. Update match_results for the Finals
const matchRow = db.prepare("SELECT id FROM matches WHERE tournament_id = ?").get(t.id);
if (matchRow) {
  const updateResult = db.prepare(`
    UPDATE match_results 
    SET wins_count = ?, matches_count = ?, placement_points = ?, kill_points = ?, total_points = ?
    WHERE match_id = ? AND team_id = (SELECT id FROM teams WHERE name = ? COLLATE NOCASE)
  `);

  for (const s of finals.standings) {
    // If the DB only has placement_points and kill_points and expects them to sum to total_points,
    // we can either add headstart to placement_points or kill_points.
    // We'll add headstart to kill_points just so they sum correctly if the UI calculates it.
    // BUT usually the UI prefers accurate kill counts. The user requested:
    // FORMAT: # | TEAM | MATCHES | WWCD | PLACEMENT | FINISHES | TOTAL
    // If the UI is rendering exactly those columns based on match_results, it might map `kill_points` -> FINISHES
    // If we want it to be 100% accurate to the user's view, we'll put elimPts in kill_points, and placePts + headstart in placement_points (or vice versa).
    // Let's just set the exact values: placement_points = placePts, kill_points = elimPts.
    // If total_points isn't perfectly their sum, that's fine since we set total_points explicitly.
    updateResult.run(s.wwcd, s.matches, s.placePts, s.elimPts, s.points, matchRow.id, s.team);
  }
}

console.log("Updated PEL stages and match_results with Game 8 Finals data and corrected Playoffs");

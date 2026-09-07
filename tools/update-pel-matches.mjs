import { db } from "../server/db.js";
import { v4 as uuidv4 } from "uuid";

const data = `1st	Weibo Gaming	93	7th	10	8th	7	2nd	17	10th	3	14th	5	2nd	9	3rd	3	7th	7	7th	1
2nd	LGD Gaming	83	1st	15	13th	5	9th	3	1st	6	9th	2	15th	0	8th	4	12th	0	1st	13
3rd	JD Gaming	82	15th	7	16th	1	12th	3	11th	2	2nd	3	4th	6	1st	16	3rd	7	2nd	6
4th	Hao Han Gaming	79	12th	0	10th	4	7th	6	3rd	4	6th	7	3rd	6	10th	7	1st	12	13th	5
5th	Regans Gaming	69	8th	7	6th	2	11th	2	2nd	8	4th	5	1st	6	13th	11	11th	0	10th	2
6th	Four Angry Men	68	14th	1	7th	3	1st	11	9th	2	1st	10	5th	1	15th	2	5th	6	15th	3
7th	Tianba	68	2nd	9	1st	10	14th	0	13th	5	5th	1	11th	3	5th	1	15th	1	3rd	4
8th	ThunderTalk Gaming	60	13th	5	5th	2	15th	0	5th	4	16th	1	10th	4	4th	10	9th	5	5th	8
9th	Six Two Eight	59	5th	10	11th	3	4th	1	4th	6	10th	1	14th	0	9th	3	2nd	13	6th	3
10th	Crab Esports	56	3rd	6	4th	8	13th	0	15th	3	7th	2	7th	9	2nd	9	13th	0	16th	2
11th	All Gamers	51	9th	2	3rd	2	5th	2	16th	0	3rd	12	6th	1	6th	7	14th	1	14th	1
12th	The Chosen	44	10th	1	2nd	6	3rd	9	14th	1	15th	4	16th	0	16th	2	6th	0	4th	3
13th	LT Gaming	41	6th	11	14th	3	16th	0	12th	3	11th	1	13th	3	12th	11	10th	1	8th	2
14th	Titan Esports Club	38	11th	1	9th	2	6th	2	6th	1	13th	5	9th	3	7th	9	4th	5	9th	1
15th	Tong Jia Bao Esports	34	16th	3	15th	1	8th	3	7th	7	8th	1	8th	2	14th	11	16th	0	12th	0
16th	Nova Esports	28	4th	6	12th	0	10th	0	8th	3	12th	0	12th	4	11th	2	8th	0	11th	6`;

const t = db.prepare("SELECT id FROM tournaments WHERE name LIKE '%Peacekeeper Elite League%'").get();

db.prepare("DELETE FROM match_results WHERE tournament_id = ? AND stage = 'Grand Finals'").run(t.id);
db.prepare("DELETE FROM matches WHERE tournament_id = ? AND stage = 'Grand Finals'").run(t.id);

const headstart = {
  "Weibo Gaming": 10, "ThunderTalk Gaming": 8, "Tianba": 7, "All Gamers": 6, "Hao Han Gaming": 5,
  "LGD Gaming": 4, "Regans Gaming": 3, "LT Gaming": 3, "Four Angry Men": 2, "Tong Jia Bao Esports": 2,
  "The Chosen": 1, "Nova Esports": 1, "JD Gaming": 0, "Crab Esports": 0, "Titan Esports Club": 0, "Six Two Eight": 0
};

const mapOrder = ["Rondo", "Erangel", "Erangel", "Erangel", "Miramar", "Miramar", "Rondo", "Erangel", "Erangel"];

const getPoints = (pStr) => {
  const p = parseInt(pStr);
  if (p === 1) return 10;
  if (p === 2) return 6;
  if (p === 3) return 5;
  if (p === 4) return 4;
  if (p === 5) return 3;
  if (p === 6) return 2;
  if (p === 7 || p === 8) return 1;
  return 0;
};

const teams = db.prepare("SELECT id, name FROM teams").all();
const teamIdMap = {};
for (const tm of teams) {
  teamIdMap[tm.name] = tm.id;
}

const lines = data.split("\\n");
const gameMatches = [];
for (let i = 0; i < 9; i++) {
  gameMatches.push({
    id: uuidv4(),
    tournament_id: t.id,
    stage: 'Grand Finals',
    map: mapOrder[i],
    scheduled_time: new Date(Date.now() - (10 - i) * 3600000).toISOString(),
    status: 'completed',
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString()
  });
}

const insertMatchStr = "INSERT INTO matches (id, tournament_id, stage, map, scheduled_time, status, created_date, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
const insertMatch = db.prepare(insertMatchStr);
for (const gm of gameMatches) {
  insertMatch.run(gm.id, gm.tournament_id, gm.stage, gm.map, gm.scheduled_time, gm.status, gm.created_date, gm.updated_date);
}

const insertResultStr = "INSERT INTO match_results (id, match_id, tournament_id, team_id, placement, kill_points, placement_points, total_points, stage, created_date, updated_date, created_by, matches_count, wins_count, publication_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'system', 1, ?, 'published')";
const insertResult = db.prepare(insertResultStr);

for (const line of lines) {
  const cols = line.trim().split("\\t");
  if (cols.length < 21) continue;
  const teamName = cols[1];
  const tId = teamIdMap[teamName];
  if (!tId) { console.log("Missing team", teamName); continue; }
  
  for (let i = 0; i < 9; i++) {
    const pStr = cols[3 + i * 2];
    const kStr = cols[4 + i * 2];
    
    const p = parseInt(pStr);
    const k = parseInt(kStr);
    const pPts = getPoints(pStr);
    
    let totalPlace = pPts;
    if (i === 0) {
      totalPlace += headstart[teamName] || 0;
    }
    const totalPts = totalPlace + k;
    const isWin = p === 1 ? 1 : 0;
    
    insertResult.run(uuidv4(), gameMatches[i].id, t.id, tId, p, k, totalPlace, totalPts, 'Grand Finals', new Date().toISOString(), new Date().toISOString(), isWin);
  }
}

let stages = JSON.parse(db.prepare("SELECT stages FROM tournaments WHERE id = ?").get(t.id).stages);
const finalsStage = stages.find(s => s.name === "Grand Finals");
finalsStage.summary = "Aug 28–30, 2026 at Qingdao Citizen Fitness Center Gymnasium. 16 teams (6 direct + 10 via Playoffs) compete over 3 matchdays. Smash Rule applied. Through Game 9 completed.";

const rows = db.prepare("SELECT t.name as team, SUM(mr.total_points) as points, SUM(mr.placement_points) as placePts, SUM(mr.kill_points) as elimPts, SUM(mr.wins_count) as wwcd, SUM(mr.matches_count) as matches FROM match_results mr JOIN teams t ON mr.team_id = t.id WHERE mr.tournament_id = ? AND mr.stage = 'Grand Finals' GROUP BY t.id ORDER BY points DESC").all(t.id);

finalsStage.standings = rows.map((r, i) => {
  return {
    placement: i + 1,
    team: r.team,
    points: r.points,
    matches: r.matches,
    wwcd: r.wwcd,
    pos: r.placePts,
    elimins: r.elimPts
  };
});

db.prepare("UPDATE tournaments SET stages = ? WHERE id = ?").run(JSON.stringify(stages), t.id);
console.log("Inserted 9 matches and updated JSON");

import { db } from "../server/db.js";

const PEL_NAME = "Peacekeeper Elite League 2026 Summer";
const t = db.prepare("SELECT id, stages FROM tournaments WHERE name = ?").get(PEL_NAME);

if (!t) { console.error("Not found"); process.exit(1); }

let stages = JSON.parse(t.stages);
const finalsStage = stages.find(s => s.name === "Grand Finals");

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

const lines = data.split("\n");
const matchDataMap = {};

for (const line of lines) {
  const cols = line.trim().split("\t");
  if (cols.length < 21) continue;
  const teamName = cols[1];
  
  const matchPoints = {};
  for (let i = 0; i < 9; i++) {
    const pStr = cols[3 + i * 2];
    const kStr = cols[4 + i * 2];
    const pPts = getPoints(pStr);
    const k = parseInt(kStr);
    matchPoints[`m${i + 1}`] = pPts + k;
  }
  matchDataMap[teamName] = matchPoints;
}

if (finalsStage.standings) {
  for (const row of finalsStage.standings) {
    const mData = matchDataMap[row.team];
    if (mData) {
      for (let i = 1; i <= 9; i++) {
        row[`m${i}`] = mData[`m${i}`];
      }
    }
  }
}

db.prepare("UPDATE tournaments SET stages = ? WHERE id = ?").run(JSON.stringify(stages), t.id);
console.log("Updated JSON with m1, m2, m3... properties");

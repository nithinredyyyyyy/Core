import { db } from "../server/db.js";

const PEL_NAME = "Peacekeeper Elite League 2026 Summer";
const t = db.prepare("SELECT id FROM tournaments WHERE name = ?").get(PEL_NAME);
if (!t) { console.error("Not found"); process.exit(1); }

const description = `Peacekeeper Elite League (PEL) Summer 2026 is China's highest level professional league for Peacekeeper Elite (the Chinese rebranded version of PUBG Mobile / "Game for Peace"). Organized by Tencent Games and Hero Esports, the tournament features 22 top Chinese organizations competing for ¥16,400,000 CNY (≈ $2,438,027 USD). Defending champion: All Gamers (Spring 2026). Regular Season and Playoffs were held at Quantum Hero E-sports Center, Chengdu; the Grand Finals at Qingdao Citizen Fitness Center Gymnasium, Qingdao.`;

const format_overview = `**Format**

**Regular Season** (May 28 – Jun 21 & Jul 9 – 26, 2026 | 7 weeks)
Each week consists of two phases:
- **Breakout (Day 1):** 16 teams compete. Top 10 qualify for Weekly Finals; bottom 6 go to next week's Breakout. Ties are broken via 4v4 Team Deathmatch.
- **Weekly Finals (Day 2–4):** 16 teams (Top 6 from previous Weekly Finals + Top 10 from Breakout). Weeks 1–2 use the Points System; from Week 3 onwards the **Smash Rule** applies (Weekly Finals Winner + Top 5 in Points advance to next Weekly Finals). Points earned cumulate into the Overall Regular Season standings.

At the end of the Regular Season: **Top 6 → Grand Finals** (direct); **Bottom 16 → Playoffs**.

**Playoffs** (Jul 30 – Aug 2, 2026 | Chengdu)
16 teams seeded with Headstart Points based on Regular Season rank. Top 10 qualify for Grand Finals; bottom 6 are eliminated.

**Grand Finals** (Aug 28–30, 2026 | Qingdao)
16 teams (6 direct + 10 via Playoffs), each receiving Headstart Points. 3 matchdays. Smash Rule applied — the first "Match Point Eligible" team to win a WWCD is crowned champion. Match Point threshold = 2nd place total after Match 15 + 5 points.

**Game Details**
- Mode: Squads TPP | 6 matches per day
- Regular Map Order: Rondo → Erangel → Erangel → Erangel → Miramar → Miramar
- Smash Rule Final Day: Circle → Erangel → Look → Erangel → Erangel → Look → Circle`;

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
      { placement: 22, team: "Action Culture Tech.", points: 0,   week1: null, week2: null, week3: null, week4: null, week5: null, week6: null, week7: null }
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
      { placement: 1,  team: "Regans Gaming",       points: 238, placePts: 2, elimPts: 66,  headstart: 164 },
      { placement: 2,  team: "LT Gaming",           points: 208, placePts: 4, elimPts: 71,  headstart: 135 },
      { placement: 3,  team: "Tong Jia Bao Esports",points: 198, placePts: 2, elimPts: 60,  headstart: 135 },
      { placement: 4,  team: "Four Angry Men",      points: 183, placePts: 1, elimPts: 56,  headstart: 117 },
      { placement: 5,  team: "Nova Esports",        points: 168, placePts: 4, elimPts: 52,  headstart: 113 },
      { placement: 6,  team: "The Chosen",          points: 163, placePts: 3, elimPts: 59,  headstart: 97  },
      { placement: 7,  team: "JD Gaming",           points: 159, placePts: 1, elimPts: 56,  headstart: 98  },
      { placement: 8,  team: "Crab Esports",        points: 155, placePts: 2, elimPts: 46,  headstart: 103 },
      { placement: 9,  team: "Titan Esports Club",  points: 146, placePts: 3, elimPts: 51,  headstart: 94  },
      { placement: 10, team: "Six Two Eight",       points: 133, placePts: 1, elimPts: 42,  headstart: 87  },
      { placement: 11, team: "KONE ESPORT",         points: 127, placePts: 0, elimPts: 43,  headstart: 82  },
      { placement: 12, team: "Action Culture Tech.", points: 122, placePts: 1, elimPts: 52, headstart: 70  },
      { placement: 13, team: "Rogue Warriors",      points: 120, placePts: 0, elimPts: 31,  headstart: 88  },
      { placement: 14, team: "KuaiShou Gaming",     points: 110, placePts: 0, elimPts: 18,  headstart: 92  },
      { placement: 15, team: "Vision Esports",      points: 110, placePts: 0, elimPts: 42,  headstart: 68  },
      { placement: 16, team: "Etk E-sports",        points: 81,  placePts: 0, elimPts: 23,  headstart: 58  }
    ]
  },
  {
    name: "Grand Finals",
    order: 3,
    status: "ongoing",
    teamCount: 16,
    summary: "Aug 28–30, 2026 at Qingdao Citizen Fitness Center Gymnasium, Qingdao. 16 teams (6 direct + 10 via Playoffs) compete over 3 matchdays. Smash Rule applied — first Match Point Eligible team to win a WWCD is crowned champion. Match Point threshold = 2nd place total after Match 15 + 5 pts.",
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
      { placement: 1,  team: "Weibo Gaming",        points: 83 },
      { placement: 2,  team: "Regans Gaming",       points: 67 },
      { placement: 3,  team: "LGD Gaming",          points: 60 },
      { placement: 4,  team: "JD Gaming",           points: 58 },
      { placement: 5,  team: "Tianba",              points: 58 },
      { placement: 6,  team: "Four Angry Men",      points: 56 },
      { placement: 7,  team: "Crab Esports",        points: 54 },
      { placement: 8,  team: "Hao Han Gaming",      points: 52 },
      { placement: 9,  team: "All Gamers",          points: 49 },
      { placement: 10, team: "ThunderTalk Gaming",  points: 44 },
      { placement: 11, team: "LT Gaming",           points: 37 },
      { placement: 12, team: "Six Two Eight",       points: 35 },
      { placement: 13, team: "The Chosen",          points: 35 },
      { placement: 14, team: "Tong Jia Bao Esports",points: 34 },
      { placement: 15, team: "Titan Esports Club",  points: 28 },
      { placement: 16, team: "Nova Esports",        points: 21 }
    ]
  }
]);

// Full prize breakdown — Finals prizes
const prize_breakdown = JSON.stringify([
  { placement: "1st",  team: "TBD", usd: "445,981",  inr: "¥3,000,000" },
  { placement: "2nd",  team: "TBD", usd: "222,990",  inr: "¥1,500,000" },
  { placement: "3rd",  team: "TBD", usd: "148,660",  inr: "¥1,000,000" },
  { placement: "4th",  team: "TBD", usd: "118,928",  inr: "¥800,000"   },
  { placement: "5th",  team: "TBD", usd: "89,196",   inr: "¥600,000"   },
  { placement: "6th",  team: "TBD", usd: "59,464",   inr: "¥400,000"   },
  { placement: "7th",  team: "TBD", usd: "29,732",   inr: "¥200,000"   },
  { placement: "8th",  team: "TBD", usd: "22,299",   inr: "¥150,000"   },
  { placement: "9th",  team: "TBD", usd: "11,893",   inr: "¥80,000"    },
  { placement: "10th", team: "TBD", usd: "8,920",    inr: "¥60,000"    }
]);

// Awards
const awards = JSON.stringify([
  { title: "MVP Finals",                   player: "TBD",                    prize: "¥500,000" },
  { title: "Regular Season MVP",           player: "Flower (All Gamers)",    prize: "¥50,000"  },
  { title: "Regular Season Elimination King", player: "Flower (All Gamers)", prize: "¥30,000"  },
  { title: "Best Rookie",                  player: "TBD",                    prize: "¥20,000"  },
  { title: "Most Improved Player",         player: "Shan Zhi (Weibo Gaming)",prize: "¥20,000"  },
  { title: "Best Regular Season Team",     player: "Elk, Flower, Suk, Pai Daxing", prize: "¥20,000/player" }
]);

// Participants with rosters
const participants = JSON.stringify([
  { team: "Action Culture Tech.", qualification: "Invited", roster: ["Shangli", "Stardust", "DGZ", "Ye Qi", "Heart"] },
  { team: "All Gamers",           qualification: "Invited", roster: ["Field", "Fairy cub", "Flower", "Zifeng", "Sima Guang", "Banguin", "Airstrike", "Three Seven", "WuGod"] },
  { team: "Four Angry Men",       qualification: "Invited", roster: ["mingskr", "Ren", "Shen Sensen", "Nomomo", "Small lock"] },
  { team: "Hao Han Gaming",       qualification: "Invited", roster: ["Chengc", "Wolf Shadow", "Plaid", "Smile", "mist"] },
  { team: "JD Gaming",            qualification: "Invited", roster: ["Paraboy", "tutor", "Dragon Cub", "Jiang Xiaoren", "Meng Yang"] },
  { team: "KONE ESPORT",          qualification: "Invited", roster: ["Su Nan", "passion", "Tetsuz", "luck", "Xin6", "Xiaozhi Xz1", "Xinyang"] },
  { team: "KuaiShou Gaming",      qualification: "Invited", roster: ["Zhabao", "Northern Kite", "Tianyu", "Mozhu", "Gun God", "Challenge"] },
  { team: "LGD Gaming",           qualification: "Invited", roster: ["cat", "Ling Kill", "Afu", "Day", "For song", "Hua Aotian", "Long Bixia"] },
  { team: "Nova Esports",         qualification: "Invited", roster: ["Box Sauce", "Odd", "Ruoxu", "77H", "summer"] },
  { team: "Regans Gaming",        qualification: "Invited", roster: ["Order", "No trace", "Lightning", "Wind", "Dust", "RRR"] },
  { team: "Rogue Warriors",       qualification: "Invited", roster: ["Zixi", "Jiubao", "Dark Horse", "Chaos", "Old Love"] },
  { team: "Six Two Eight",        qualification: "Invited", roster: ["Natural Splendor", "Zhitian", "wild cat", "Feng Xu", "Half", "86"] },
  { team: "The Chosen",           qualification: "Invited", roster: ["wyy", "Tian", "ZXiaoWen", "Area", "Muyang"] },
  { team: "ThunderTalk Gaming",   qualification: "Invited", roster: ["Ajie", "Pai Daxing", "Siting", "Beimo", "sober", "Jimmy", "Autumn Water"] },
  { team: "Tianba",               qualification: "Invited", roster: ["Aojiku", "Steady carving", "Aching", "Elk", "shallow singing"] },
  { team: "Titan Esports Club",   qualification: "Invited", roster: ["33Svan", "King", "Dongdong", "Luffy", "qc"] },
  { team: "Tong Jia Bao Esports", qualification: "Invited", roster: ["OnlyS", "Bai Xiaochun", "Star y", "Levi", "Koi"] },
  { team: "Weibo Gaming",         qualification: "Invited", roster: ["Suk", "Shan Zhi", "SuKi", "GIVE", "Xinnan"] },
  { team: "Vision Esports",       qualification: "Invited", roster: ["LoongSkr", "Star Sauce", "Ah Qing", "Wooden Gen", "Haohao"] },
  { team: "Crab Esports",         qualification: "Invited (Temporary Seat)", roster: ["Hokusai", "98k", "676", "Princess", "Divine Word"] },
  { team: "Etk E-sports",         qualification: "Invited (Temporary Seat)", roster: ["Xinxin", "Li Xingyun", "small C", "With Yang", "Justin"] },
  { team: "LT Gaming",            qualification: "Invited (Temporary Seat)", roster: ["Lei Zai", "Ling'er", "Remember", "Anyan", "Wei Wuxian"] }
]);

const calendar = JSON.stringify([
  { week: "Week 1", label: "Regular Season – May 28–31, 2026" },
  { week: "Week 2", label: "Regular Season – Jun 4–7, 2026" },
  { week: "Week 3", label: "Regular Season – Jun 11–14, 2026" },
  { week: "Week 4", label: "Regular Season – Jun 18–21, 2026" },
  { week: "Week 5", label: "Regular Season – Jul 9–12, 2026" },
  { week: "Week 6", label: "Regular Season – Jul 16–19, 2026" },
  { week: "Week 7", label: "Regular Season – Jul 23–26, 2026" },
  { week: "Playoffs", label: "Playoffs – Jul 30 – Aug 2, 2026 (Chengdu)" },
  { week: "Grand Finals", label: "Grand Finals – Aug 28–30, 2026 (Qingdao)" }
]);

db.prepare(`
  UPDATE tournaments
  SET description = ?, format_overview = ?, stages = ?, prize_breakdown = ?,
      awards = ?, participants = ?, calendar = ?, tier = ?
  WHERE id = ?
`).run(description, format_overview, stages, prize_breakdown, awards, participants, calendar, "S-Tier", t.id);

console.log("PEL 2026 Summer fully updated.");

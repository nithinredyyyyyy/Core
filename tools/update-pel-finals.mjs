import { db } from "../server/db.js";

const PEL_NAME = "Peacekeeper Elite League 2026 Summer";
const t = db.prepare("SELECT id FROM tournaments WHERE name = ?").get(PEL_NAME);
if (!t) { console.error("Not found"); process.exit(1); }

// Prize Breakdown
const prize_breakdown = JSON.stringify([
  // Finals Prize
  { stage: "Finals Prize", placement: "1st",  team: "TBD", usd: "445,981", cny: "¥3,000,000" },
  { stage: "Finals Prize", placement: "2nd",  team: "TBD", usd: "222,990", cny: "¥1,500,000" },
  { stage: "Finals Prize", placement: "3rd",  team: "TBD", usd: "148,660", cny: "¥1,000,000" },
  { stage: "Finals Prize", placement: "4th",  team: "TBD", usd: "118,928", cny: "¥800,000" },
  { stage: "Finals Prize", placement: "5th",  team: "TBD", usd: "89,196",  cny: "¥600,000" },
  { stage: "Finals Prize", placement: "6th",  team: "TBD", usd: "59,464",  cny: "¥400,000" },
  { stage: "Finals Prize", placement: "7th",  team: "TBD", usd: "29,732",  cny: "¥200,000" },
  { stage: "Finals Prize", placement: "8th",  team: "TBD", usd: "22,299",  cny: "¥150,000" },
  { stage: "Finals Prize", placement: "9th",  team: "TBD", usd: "11,893",  cny: "¥80,000" },
  { stage: "Finals Prize", placement: "10th", team: "TBD", usd: "8,920",   cny: "¥60,000" },

  // Regular Season Prize (Weekly)
  { stage: "Regular Season Prize (Weekly)", placement: "1st",  team: "-", usd: "74,330", cny: "¥500,000" },
  { stage: "Regular Season Prize (Weekly)", placement: "2nd",  team: "-", usd: "37,165", cny: "¥250,000" },
  { stage: "Regular Season Prize (Weekly)", placement: "3rd",  team: "-", usd: "22,299", cny: "¥150,000" },
  { stage: "Regular Season Prize (Weekly)", placement: "4th",  team: "-", usd: "10,406", cny: "¥70,000" },
  { stage: "Regular Season Prize (Weekly)", placement: "5th",  team: "-", usd: "5,946",  cny: "¥40,000" },
  { stage: "Regular Season Prize (Weekly)", placement: "6th",  team: "-", usd: "4,460",  cny: "¥30,000" },
  { stage: "Regular Season Prize (Weekly)", placement: "7th",  team: "-", usd: "4,460",  cny: "¥30,000" },
  { stage: "Regular Season Prize (Weekly)", placement: "8th",  team: "-", usd: "2,973",  cny: "¥20,000" },
  { stage: "Regular Season Prize (Weekly)", placement: "9th",  team: "-", usd: "2,973",  cny: "¥20,000" },
  { stage: "Regular Season Prize (Weekly)", placement: "10th", team: "-", usd: "2,973",  cny: "¥20,000" }
]);

// Awards
const awards = JSON.stringify([
  { title: "MVP Finals",                   player: "TBD",                    prize: "¥500,000" },
  { title: "Regular Season MVP",           player: "Flower",                 prize: "¥50,000"  },
  { title: "Best Rookie",                  player: "TBD",                    prize: "¥20,000"  },
  { title: "Most Improved Player",         player: "Shan Zhi",               prize: "¥20,000"  },
  { title: "Regular Season Elimination King", player: "Flower",              prize: "¥30,000"  },
  { title: "Best Regular Season Team",     player: "Elk, Flower, Suk, Pai Daxing", prize: "¥20,000" }
]);

// Participants
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
  { team: "Crab Esports",         qualification: "Invited - Temporary Seat", roster: ["Hokusai", "98k", "676", "Princess", "Divine Word"] },
  { team: "Etk E-sports",         qualification: "Invited - Temporary Seat", roster: ["Xinxin", "Li Xingyun", "small C", "With Yang", "Justin"] },
  { team: "LT Gaming",            qualification: "Invited - Temporary Seat", roster: ["Lei Zai", "Ling'er", "Remember", "Anyan", "Wei Wuxian"] }
]);

db.prepare(`
  UPDATE tournaments
  SET prize_breakdown = ?, awards = ?, participants = ?
  WHERE id = ?
`).run(prize_breakdown, awards, participants, t.id);

console.log("Updated prize pool, participants, and awards");

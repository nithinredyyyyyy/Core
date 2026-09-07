import { db } from "../server/db.js";

const format_overview = `
**Peacekeeper Elite League 2026 Summer** : May 28th - August 30th, 2026

* 22 teams.
* Squads TPP
* 6 matches each day.
* Map Order: Rondo >> Erangel >> Erangel >> Erangel >> Miramar >> Miramar

### Regular Season: May 28th - June 21st, July 9th - 26th, 2026
**Breakout (Day 1)**
* 16 teams (Bottom 6 from previous Breakout, Bottom 10 from Weekly Finals).
* Top 10 teams qualify for Weekly Finals, Bottom 6 proceed to following week's Breakout.

**Weekly Finals (Day 2-4)**
* 16 teams (Top 6 from previous Weekly Finals, Top 10 from Breakout).
* Smash Rule applied from Week 3 onwards.
* Top 6 teams advance to Finals.
* Bottom 16 teams proceed to Playoffs.

### Playoffs : July 30th - Aug 2nd
* 16 teams from Regular Season.
* Top 10 teams qualify for Finals.
* Bottom 6 teams are eliminated.

### Finals: : August 28th - 30th, 2026
* 16 teams (6 from Regular Season and 10 from Playoffs).
* 3 matchdays, Smash Rule applied.
`;

const prize_breakdown = JSON.stringify([
  { placement: "1st", team: "TBD", usd: "445,981", inr: "3,000,000 CNY" },
  { placement: "2nd", team: "TBD", usd: "222,990", inr: "1,500,000 CNY" },
  { placement: "3rd", team: "TBD", usd: "148,660", inr: "1,000,000 CNY" },
  { placement: "4th", team: "TBD", usd: "118,928", inr: "800,000 CNY" },
  { placement: "5th", team: "TBD", usd: "89,196", inr: "600,000 CNY" },
  { placement: "6th", team: "TBD", usd: "59,464", inr: "400,000 CNY" }
]);

const awards = JSON.stringify([
  { title: "MVP Finals", player: "TBD", prize: "¥500,000" },
  { title: "Regular Season MVP", player: "Flower", prize: "¥50,000" },
  { title: "Best Rookie", player: "TBD", prize: "¥20,000" },
  { title: "Most Improved Player", player: "Shan Zhi", prize: "¥20,000" }
]);

db.prepare(`
  UPDATE tournaments 
  SET format_overview = ?, prize_breakdown = ?, awards = ?
  WHERE name = 'Peacekeeper Elite League 2026 Summer'
`).run(format_overview, prize_breakdown, awards);

console.log("Updated tournament data mapping.");

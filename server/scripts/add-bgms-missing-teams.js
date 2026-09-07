import { randomUUID } from "node:crypto";
import { db } from "../db.js";

const now = new Date().toISOString();

// Teams that participate in BGMS 2026 but don't exist in the DB yet
const MISSING_TEAMS = [
  { name: "Team Outrage",      tag: "OUTRAGE",   region: "IN", game: "BGMI" },
  { name: "Apex Gaming",       tag: "APEX",      region: "IN", game: "BGMI" },
  { name: "Epigrotive Gaming", tag: "EG",        region: "IN", game: "BGMI" },
  { name: "Zero Ark",          tag: "ZARK",      region: "IN", game: "BGMI" },
  { name: "Elite Nova",        tag: "ENOVA",     region: "IN", game: "BGMI" },
  { name: "Rapid Chaos",       tag: "RC",        region: "IN", game: "BGMI" },
  { name: "HyperCatz",         tag: "HCAT",      region: "IN", game: "BGMI" },
  { name: "Aura x Esports",    tag: "AXE",       region: "IN", game: "BGMI" },
  { name: "Santa Esports",     tag: "SANTA",     region: "IN", game: "BGMI" },
];

const insertTeam = db.prepare(`
  INSERT INTO teams (id, name, tag, region, game, created_date, updated_date)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const tx = db.transaction(() => {
  for (const team of MISSING_TEAMS) {
    const existing = db.prepare("SELECT id FROM teams WHERE name = ?").get(team.name);
    if (existing) {
      console.log(`Already exists: ${team.name}`);
      continue;
    }
    insertTeam.run(randomUUID(), team.name, team.tag, team.region, team.game, now, now);
    console.log(`Added: ${team.name}`);
  }
});

tx();
console.log("Done adding missing teams.");

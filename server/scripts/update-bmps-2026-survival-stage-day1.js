import { randomUUID } from "node:crypto";
import { db } from "../db.js";

const TOURNAMENT_NAME = "Battlegrounds Mobile India Pro Series 2026";
const STAGE_NAME = "Survival Stage";

const mapRotation = ["Rondo", "Erangel", "Erangel", "Erangel", "Miramar", "Miramar"];

const dayGroupRotations = [
  ["AB", "BC", "CD", "AD", "AC", "BD"],
  ["CD", "AD", "AC", "BD", "AB", "BC"],
  ["AC", "BD", "AB", "BC", "CD", "AD"],
  ["BD", "AC", "CD", "AB", "BC", "AD"],
];

const survivalSchedule = dayGroupRotations.flatMap((groups, dayIndex) =>
  groups.map((group, matchIndex) => ({
    day: dayIndex + 1,
    match: matchIndex + 1,
    map: mapRotation[matchIndex],
    group,
  })),
);

const existing = db
  .prepare("SELECT id, stages FROM tournaments WHERE name = ?")
  .get(TOURNAMENT_NAME);

if (!existing) {
  throw new Error(`${TOURNAMENT_NAME} was not found.`);
}

const now = new Date().toISOString();
const stages = JSON.parse(existing.stages || "[]").map((stage) =>
  String(stage?.name || "").trim().toLowerCase() === "survival stage"
    ? {
        ...stage,
        mapRotation: mapRotation.map((map, index) => ({
          match: index + 1,
          map,
          day1: dayGroupRotations[0][index],
          day2: dayGroupRotations[1][index],
          day3: dayGroupRotations[2][index],
          day4: dayGroupRotations[3][index],
        })),
      }
    : stage,
);

const updateTournament = db.prepare(
  "UPDATE tournaments SET stages = ?, updated_date = ? WHERE id = ?",
);
const deleteSurvivalStageMatches = db.prepare(
  "DELETE FROM matches WHERE tournament_id = ? AND stage = ? AND day BETWEEN 1 AND 4",
);
const insertMatch = db.prepare(`
  INSERT INTO matches (
    id, tournament_id, stage, group_name, match_number, map, status,
    scheduled_time, stream_url, day, created_date, updated_date, created_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

updateTournament.run(JSON.stringify(stages), now, existing.id);
deleteSurvivalStageMatches.run(existing.id, STAGE_NAME);

survivalSchedule.forEach((entry) => {
  insertMatch.run(
    randomUUID(),
    existing.id,
    STAGE_NAME,
    `Group ${entry.group}`,
    entry.match,
    entry.map,
    "scheduled",
    `2026-06-${String(entry.day + 1).padStart(2, "0")}T00:00:00+05:30`,
    null,
    entry.day,
    now,
    now,
    "admin@stagecore.local",
  );
});

console.log(
  `Updated ${TOURNAMENT_NAME} ${STAGE_NAME} with ${survivalSchedule.length} matches across 4 days.`,
);

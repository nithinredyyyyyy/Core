import { randomUUID } from "node:crypto";
import { db } from "../db.js";

const TOURNAMENT_NAME = "Battlegrounds Mobile India Pro Series 2026";
const STAGE = "Semi Finals";

const schedule = [
  {
    day: 1,
    date: "2026-06-09",
    matches: [
      ["16:00:00", "Rondo", "Group AB"],
      ["16:40:00", "Erangel", "Group AB"],
      ["17:20:00", "Erangel", "Group AB"],
      ["18:00:00", "Erangel", "Group BC"],
      ["18:40:00", "Miramar", "Group BC"],
      ["19:20:00", "Miramar", "Group BC"],
    ],
  },
  {
    day: 2,
    date: "2026-06-10",
    matches: [
      ["16:00:00", "Rondo", "Group AC"],
      ["16:40:00", "Erangel", "Group AC"],
      ["17:20:00", "Erangel", "Group AC"],
      ["18:00:00", "Erangel", "Group AB"],
      ["18:40:00", "Miramar", "Group AB"],
      ["19:20:00", "Miramar", "Group AB"],
    ],
  },
  {
    day: 3,
    date: "2026-06-11",
    matches: [
      ["16:00:00", "Rondo", "Group BC"],
      ["16:40:00", "Erangel", "Group BC"],
      ["17:20:00", "Erangel", "Group BC"],
      ["18:00:00", "Erangel", "Group AC"],
      ["18:40:00", "Miramar", "Group AC"],
      ["19:20:00", "Miramar", "Group AC"],
    ],
  },
  {
    day: 4,
    date: "2026-06-12",
    matches: [
      ["16:00:00", "Rondo", "Group AB"],
      ["16:40:00", "Miramar", "Group AB"],
      ["17:20:00", "Rondo", "Group BC"],
      ["18:00:00", "Miramar", "Group BC"],
      ["18:40:00", "Rondo", "Group AC"],
      ["19:20:00", "Miramar", "Group AC"],
    ],
  },
];

const tournament = db
  .prepare("SELECT id FROM tournaments WHERE name = ?")
  .get(TOURNAMENT_NAME);

if (!tournament) {
  throw new Error(`${TOURNAMENT_NAME} was not found.`);
}

const now = new Date().toISOString();
const existingMatches = db
  .prepare(
    "SELECT id, day, match_number FROM matches WHERE tournament_id = ? AND stage = ?",
  )
  .all(tournament.id, STAGE);
const existingByDayMatch = new Map(
  existingMatches.map((match) => [`${match.day}:${match.match_number}`, match]),
);

const updateMatch = db.prepare(`
  UPDATE matches
  SET map = ?, group_name = ?, status = ?, scheduled_time = ?, updated_date = ?
  WHERE id = ?
`);

const insertMatch = db.prepare(`
  INSERT INTO matches (
    id, tournament_id, stage, group_name, match_number, map, status,
    scheduled_time, stream_url, day, created_date, updated_date, created_by
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let updated = 0;
let inserted = 0;

for (const daySchedule of schedule) {
  daySchedule.matches.forEach(([time, map, groupName], index) => {
    const matchNumber = index + 1;
    const scheduledTime = `${daySchedule.date}T${time}+05:30`;
    const existing = existingByDayMatch.get(`${daySchedule.day}:${matchNumber}`);

    if (existing) {
      updateMatch.run(map, groupName, "scheduled", scheduledTime, now, existing.id);
      updated += 1;
      return;
    }

    insertMatch.run(
      randomUUID(),
      tournament.id,
      STAGE,
      groupName,
      matchNumber,
      map,
      "scheduled",
      scheduledTime,
      "",
      daySchedule.day,
      now,
      now,
      null,
    );
    inserted += 1;
  });
}

console.log(
  `Updated ${updated} and inserted ${inserted} ${TOURNAMENT_NAME} Semi Finals matches.`,
);

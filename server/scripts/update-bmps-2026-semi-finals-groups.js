import { db } from "../db.js";

const TOURNAMENT_NAME = "Battlegrounds Mobile India Pro Series 2026";

const SEMI_FINALS_GROUPS = {
  A: [
    "Wyld Fangs",
    "Gods Reign",
    "Genesis Esports",
    "Zero Ark Official",
    "iQOO Reckoning Esports",
    "iQOO Revenant XSpark",
    "Welt Esports",
    "Survival #5",
  ],
  B: [
    "Meta Ninza",
    "4TR Official",
    "Autobotz Esports",
    "Survival #7",
    "Higgboson Esports",
    "Survival #3",
    "iQOO Team Tamillas",
    "Mysterious4",
  ],
  C: [
    "Survival #1",
    "WindGod Esports",
    "Survival #8",
    "Survival #2",
    "Survival #6",
    "White Walkers",
    "Survival #4",
    "Nebula Esports",
  ],
};

const existing = db
  .prepare("SELECT id, participants FROM tournaments WHERE name = ?")
  .get(TOURNAMENT_NAME);

if (!existing) {
  throw new Error(`${TOURNAMENT_NAME} was not found.`);
}

const currentParticipants = JSON.parse(existing.participants || "[]");
const withoutSemiFinals = currentParticipants.filter(
  (entry) => !/^semi finals\b/i.test(String(entry?.phase || "").trim()),
);

const semiFinalParticipants = Object.entries(SEMI_FINALS_GROUPS).flatMap(
  ([group, teams]) =>
    teams.map((team, index) => ({
      placement: index + 1,
      team,
      phase: `Semi Finals - Group ${group}`,
      players: [],
    })),
);

db.prepare(
  "UPDATE tournaments SET participants = ?, updated_date = ? WHERE id = ?",
).run(
  JSON.stringify([...withoutSemiFinals, ...semiFinalParticipants]),
  new Date().toISOString(),
  existing.id,
);

console.log(
  `Updated ${TOURNAMENT_NAME} Semi Finals groups with ${semiFinalParticipants.length} entries.`,
);

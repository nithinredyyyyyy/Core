import { db } from "../db.js";

const TOURNAMENT_NAME = "Battlegrounds Mobile India Pro Series 2026";

const SURVIVAL_STAGE_GROUPS = {
  A: [
    "Madkings Esports",
    "Team Aryan",
    "HADX Esports",
    "NONX Esports",
    "Rapid Chaos Esports",
    "VXT",
    "Ares Esport",
    "Likitha Esports",
  ],
  B: [
    "Jaguar Esports",
    "K9 Esports",
    "Esport Social",
    "Santa Esports",
    "True Rippers",
    "Quantum Spark",
    "Rising Esports",
    "Team Doxy",
  ],
  C: [
    "Naqsh Esports",
    "Learn From Past",
    "Team RedXross",
    "TDR",
    "GodSent Esports",
    "Team Apex Gaming",
    "DCxSCR",
    "GENxFM Esports",
  ],
  D: [
    "Phoenix Esports",
    "Lastade Esports",
    "Team H4K",
    "Riot Nationz",
    "T7",
    "Troy Tamilian Esports",
    "Aurax Esports",
    "Myth Official",
  ],
};

const existing = db
  .prepare("SELECT id, participants FROM tournaments WHERE name = ?")
  .get(TOURNAMENT_NAME);

if (!existing) {
  throw new Error(`${TOURNAMENT_NAME} was not found.`);
}

const currentParticipants = JSON.parse(existing.participants || "[]");
const baseParticipants = currentParticipants.filter(
  (entry) => !/^survival stage\s*-\s*group\s+[a-d]$/i.test(String(entry?.phase || "").trim()),
);
const baseByTeam = new Map(
  currentParticipants.map((entry) => [String(entry?.team || "").trim().toLowerCase(), entry]),
);

const survivalParticipants = Object.entries(SURVIVAL_STAGE_GROUPS).flatMap(
  ([group, teams]) =>
    teams.map((team, index) => {
      const existingTeam = baseByTeam.get(team.trim().toLowerCase()) || {};
      return {
        ...existingTeam,
        placement: index + 1,
        team,
        phase: `Survival Stage - Group ${group}`,
        players: existingTeam.players || [],
      };
    }),
);

const now = new Date().toISOString();
db.prepare("UPDATE tournaments SET participants = ?, updated_date = ? WHERE id = ?").run(
  JSON.stringify([...baseParticipants, ...survivalParticipants]),
  now,
  existing.id,
);

console.log(
  `Updated ${TOURNAMENT_NAME} Survival Stage groups with ${survivalParticipants.length} teams.`,
);

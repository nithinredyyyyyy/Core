import { db } from "../server/db.js";
import { PMWC_2026_PARTICIPANTS } from "../server/tournamentOverrides.js";

const row = db
  .prepare("SELECT id, participants FROM tournaments WHERE name = ?")
  .get("PUBG Mobile World Cup 2026");

if (!row) {
  console.error("PMWC 2026 tournament not found");
  process.exit(1);
}

const before = JSON.parse(row.participants);
console.log("before:", before.length, "participants");
console.log(
  "before Group A:",
  before
    .filter((p) => p.phase === "Group Stage - Group A")
    .map((p) => p.team)
    .join(", "),
);

db.prepare("UPDATE tournaments SET participants = ?, updated_date = ? WHERE id = ?").run(
  JSON.stringify(PMWC_2026_PARTICIPANTS),
  new Date().toISOString(),
  row.id,
);

const after = JSON.parse(
  db.prepare("SELECT participants FROM tournaments WHERE id = ?").get(row.id).participants,
);
console.log("after:", after.length, "participants");
console.log(
  "after Group A:",
  after
    .filter((p) => p.phase === "Group Stage - Group A")
    .map((p) => p.team)
    .join(", "),
);
console.log("stored participants updated OK");

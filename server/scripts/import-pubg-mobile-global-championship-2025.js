import { db } from "../db.js";
import {
  PMGC_2025_AWARDS,
  PMGC_2025_PARTICIPANTS,
  PMGC_2025_PRIZE_BREAKDOWN,
} from "./data/pmgc2025.js";
import { postImportTournamentTransforms } from "./postImportTransforms.js";

const tournamentName = "PUBG Mobile Global Championship 2025";
const row = db.prepare("SELECT id FROM tournaments WHERE name = ?").get(tournamentName);

if (!row) {
  throw new Error(`${tournamentName} not found. Run the base PMGC 2025 rebuild before this static-data import.`);
}

db.prepare(`
  UPDATE tournaments
  SET participants = ?,
      awards = ?,
      prize_breakdown = ?,
      updated_date = ?
  WHERE id = ?
`).run(
  JSON.stringify(PMGC_2025_PARTICIPANTS),
  JSON.stringify(PMGC_2025_AWARDS),
  JSON.stringify(PMGC_2025_PRIZE_BREAKDOWN),
  new Date().toISOString(),
  row.id,
);

postImportTournamentTransforms({ id: row.id }, db);

console.log(`Imported static data for ${tournamentName}.`);

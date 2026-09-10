import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "../db.js";
import { logger } from "./logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_PATH = join(__dirname, "seed", "seed.json");

const SEED_TABLES = [
  "tournaments", "teams", "players", "matches", "match_results",
  "tournament_stages", "tournament_stage_groups", "tournament_participants",
  "tournament_participant_players", "tournament_participant_stage_entries",
  "stage_standings", "player_team_history", "transfer_windows",
  "team_aliases", "player_aliases", "news_articles",
];

export function seedIfEmpty() {
  const total = db.prepare("SELECT count(*) as c FROM tournaments").get().c;
  if (total > 0) {
    logger.info(`Database has ${total} tournaments — skipping seed.`);
    return;
  }

  let seedData;
  try {
    seedData = JSON.parse(readFileSync(SEED_PATH, "utf-8"));
  } catch (e) {
    logger.warn("No seed file found — database will be empty.", { path: SEED_PATH });
    return;
  }

  logger.info("Database is empty — seeding from seed.json...");
  const insert = db.transaction(() => {
    for (const table of SEED_TABLES) {
      const rows = seedData[table];
      if (!rows || rows.length === 0) continue;
      const cols = Object.keys(rows[0]);
      const placeholders = cols.map((c) => `"${c}"`).join(", ");
      const stmt = db.prepare(`INSERT OR IGNORE INTO "${table}" (${placeholders}) VALUES (${cols.map(() => "?").join(", ")})`);
      for (const row of rows) {
        stmt.run(...cols.map((c) => {
          const v = row[c];
          return typeof v === "object" && v !== null ? JSON.stringify(v) : v;
        }));
      }
      logger.info(`  Seeded ${rows.length} rows into ${table}`);
    }
  });
  insert();
  logger.info("Seeding complete.");
}

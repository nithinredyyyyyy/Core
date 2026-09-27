import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "../db.js";
import { logger } from "./logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// The canonical export is the intentional, reproducible bootstrap baseline: it is
// byte-for-byte equivalent to the verified dataset. CORE_SEED_PATH can still point
// at an alternative dataset for validation/export runs, but the safe default is
// canonical, so no deploy step has to remember to set and then unset a variable.
const CANONICAL_SEED_PATH = join(__dirname, "..", "seed", "canonical.export.json");
const SEED_PATH = process.env.CORE_SEED_PATH
  ? join(process.cwd(), process.env.CORE_SEED_PATH)
  : CANONICAL_SEED_PATH;

const SEED_TABLES = [
  "tournaments", "teams", "players", "matches", "match_results",
  "tournament_stages", "tournament_stage_groups", "tournament_participants",
  "tournament_participant_players", "tournament_participant_stage_entries",
  "stage_standings", "player_team_history", "transfer_windows",
  "team_aliases", "player_aliases", "news_articles",
  "team_season_ratings", "player_season_ratings",
];

// A database is considered populated if it holds at least one tournament. Seed
// data must never overwrite a populated persistent DB, so this is the single
// gate used by every write path.
export function databaseHasData() {
  return db.prepare("SELECT count(*) as c FROM tournaments").get().c > 0;
}

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

  logger.info(`Database is empty — bootstrapping from ${SEED_PATH}...`);
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

export function ensureLegacyTournaments() {
  const existing = db.prepare("SELECT id FROM tournaments WHERE name = ?").get("Battlegrounds Mobile India Series 2023");
  if (existing) return;

  logger.info("Inserting BGIS 2023 tournament...");
  const now = new Date().toISOString();
  const tournamentId = "bgis-2023-standalone";
  const stageId = "bgis-2023-grand-finals";

  db.transaction(() => {
    db.prepare(`INSERT OR IGNORE INTO tournaments (id, name, game, status, prize_pool, start_date, end_date, stages, description, banner_url, max_teams, created_date, updated_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      tournamentId,
      "Battlegrounds Mobile India Series 2023",
      "BGMI",
      "completed",
      "₹2,00,00,000",
      "2023-09-01",
      "2023-10-15",
      JSON.stringify([{ name: "Grand Finals", order: 1, status: "completed", teamCount: 16 }]),
      "Battlegrounds Mobile India Series 2023 — the premier BGMI tournament featuring 16 top teams competing for the championship.",
      "/images/bgis-2023-banner.webp",
      16,
      now,
      now,
    );

    db.prepare(`INSERT OR IGNORE INTO tournament_stages (id, tournament_id, name, stage_order, status, summary)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      stageId,
      tournamentId,
      "Grand Finals",
      1,
      "completed",
      "Grand Finals: Oct 2023. 16 teams, 18 matches.",
    );
  })();

  logger.info("BGIS 2023 tournament inserted.");
}

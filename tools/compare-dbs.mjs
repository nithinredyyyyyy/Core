import { readFileSync } from "node:fs";

const { db: local } = await import("file:///C:/Users/surak/core/server/db.js");
const env = readFileSync(".env", "utf8");
const tursoUrl = env.match(/TURSO_DATABASE_URL=(\S+)/)?.[1] || "";
const tursoToken = env.match(/TURSO_AUTH_TOKEN=(\S+)/)?.[1] || "";
const { default: Database } = await import("libsql");
const remote = new Database(tursoUrl, tursoToken ? { authToken: tursoToken } : {});

const tables = [
  "tournaments",
  "teams",
  "players",
  "matches",
  "match_results",
  "news_articles",
  "stage_standings",
  "tournament_participants",
  "tournament_stages",
  "player_aliases",
  "team_aliases",
  "player_team_history",
];

for (const table of tables) {
  const lc = local.prepare(`SELECT COUNT(*) c FROM ${table}`).get().c;
  const rc = remote.prepare(`SELECT COUNT(*) c FROM ${table}`).get().c;
  const flag = lc === rc ? "  ok" : " DIFF";
  console.log(`${flag} ${table.padEnd(28)} local=${String(lc).padStart(6)} remote=${String(rc).padStart(6)}`);
}

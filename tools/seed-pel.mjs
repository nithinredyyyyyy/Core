import { randomUUID } from "node:crypto";
import { db } from "../server/db.js";

const tournament = {
  id: randomUUID(),
  name: "Peacekeeper Elite League 2026 Summer",
  game: "PUBG Mobile",
  status: "ongoing",
  prize_pool: "¥16,400,000 CNY",
  start_date: "2026-05-28",
  end_date: "2026-08-30",
  description: "Peacekeeper Elite League (PEL) is China's highest level professional league for Peacekeeper Elite.",
  max_teams: 22,
  created_date: new Date().toISOString(),
  updated_date: new Date().toISOString(),
  created_by: "admin@stagecore.local",
  tier: "A-Tier"
};

const insert = db.prepare(`
  INSERT INTO tournaments (
    id, name, game, status, prize_pool, start_date, end_date, description, max_teams, created_date, updated_date, created_by, tier
  ) VALUES (
    @id, @name, @game, @status, @prize_pool, @start_date, @end_date, @description, @max_teams, @created_date, @updated_date, @created_by, @tier
  )
`);

try {
  insert.run(tournament);
  console.log("Inserted PEL 2026 Summer");
} catch (e) {
  console.error("Failed to insert", e);
}

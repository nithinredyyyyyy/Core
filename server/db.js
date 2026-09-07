export { db, runInTransaction, entityConfigs, normalizeRecord, serializePayload, recomputeTeamStats } from "./db/schema.js";

if (process.env.CORE_BACKFILL_NORMALIZED_ON_STARTUP === "1") {
  const { ensureParticipantTeams, backfillNormalizedData } = await import("./db/normalize.js");
  ensureParticipantTeams();
  backfillNormalizedData();
}

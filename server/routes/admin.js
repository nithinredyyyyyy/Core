import { Router } from "express";
import { db, entityConfigs } from "../db.js";
import { getTeamLogoByName } from "../../src/lib/teamLogos.js";
import { normalizeOrganizationName } from "../../src/lib/organizationIdentity.js";
import { NEWS_SOURCES } from "../newsSources.js";
import {
  backfillImportedNewsMetadata,
  importNewsFromSources,
} from "../newsIngest.js";
import { requireAdminAccess } from "../services/auth.js";
import { deriveBmps2026OverviewEntries } from "../services/bmps2026.js";
import {
  BMPS_2026_PLAYER_STATS_SETTINGS_KEY,
  normalizeBmps2026PlayerStatsPayload,
  setSiteSetting,
} from "../services/settings.js";
import { getNormalizedTournament } from "../services/tournaments.js";

export const adminRouter = Router();

adminRouter.get("/admin/overview", (req, res) => {
  if (!requireAdminAccess(req, res)) {
    return;
  }

  try {
    const countForEntity = (entityName) => {
      const config = entityConfigs[entityName];
      if (!config?.table) return 0;
      const row = db
        .prepare(`SELECT COUNT(*) AS count FROM ${config.table}`)
        .get();
      return Number(row?.count || 0);
    };

    const teams = db.prepare("SELECT name, logo_url FROM teams").all();
    const activeTournaments = db
      .prepare(
        "SELECT id, name, participants, status FROM tournaments WHERE status != 'completed'",
      )
      .all();

    const duplicateBuckets = new Map();
    teams.forEach((team) => {
      const key = normalizeOrganizationName(team?.name || "");
      if (!key) return;
      duplicateBuckets.set(key, (duplicateBuckets.get(key) || 0) + 1);
    });
    const duplicateOrgCount = [...duplicateBuckets.values()].filter(
      (count) => count > 1,
    ).length;

    const teamKeys = new Set(
      teams.flatMap((team) => {
        const normalized = normalizeOrganizationName(team?.name || "");
        return normalized ? [normalized] : [];
      }),
    );
    const participantNames = new Set();
    let unresolvedParticipantCount = 0;

    activeTournaments.forEach((tournament) => {
      let participants = [];
      if (tournament?.name === "Battlegrounds Mobile India Pro Series 2026") {
        const normalizedTournament = getNormalizedTournament(tournament.id);
        participants = deriveBmps2026OverviewEntries(normalizedTournament);
      } else {
        try {
          participants = JSON.parse(tournament?.participants || "[]");
        } catch {
          participants = [];
        }
      }

      participants.forEach((entry) => {
        const name = entry?.team;
        if (!name) return;
        participantNames.add(name);
        const key = normalizeOrganizationName(name);
        if (key && !teamKeys.has(key)) {
          unresolvedParticipantCount += 1;
        }
      });
    });

    const missingLogoCount = [...participantNames].filter((name) => {
      const team = teams.find(
        (row) =>
          normalizeOrganizationName(row?.name || "") ===
          normalizeOrganizationName(name),
      );
      return !(team?.logo_url || getTeamLogoByName(name));
    }).length;

    return res.json({
      counts: {
        tournaments: countForEntity("Tournament"),
        teams: countForEntity("Team"),
        matches: countForEntity("Match"),
        news: countForEntity("NewsArticle"),
        transfers: countForEntity("TransferWindow"),
        activeTournaments: activeTournaments.length,
      },
      health: {
        duplicateOrgCount,
        unresolvedParticipantCount,
        missingLogoCount,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Failed to load admin overview data" });
  }
});

adminRouter.get("/admin/news/sources", (req, res) => {
  if (!requireAdminAccess(req, res)) {
    return;
  }

  return res.json(
    NEWS_SOURCES.map((source) => ({
      id: source.id,
      name: source.name,
      type: source.type,
      url: source.url,
      category: source.category,
      game: source.game,
      enabled: Boolean(source.enabled),
      priority: source.priority || "routine",
    })),
  );
});

adminRouter.post("/admin/news/import", async (req, res) => {
  if (!requireAdminAccess(req, res)) {
    return;
  }

  try {
    const result = await importNewsFromSources({
      sourceIds: Array.isArray(req.body?.source_ids) ? req.body.source_ids : [],
      limitPerSource: Number.isFinite(Number(req.body?.limit_per_source))
        ? Number(req.body.limit_per_source)
        : 8,
      manualUrl: req.body?.manual_url,
      manualSourceName: req.body?.manual_source_name,
      manualSourceType: req.body?.manual_source_type,
      manualCategory: req.body?.manual_category,
      manualGame: req.body?.manual_game,
      manualPriority: req.body?.manual_priority,
    });
    return res.status(201).json(result);
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "News import failed" });
  }
});

adminRouter.post("/admin/news/backfill", (req, res) => {
  if (!requireAdminAccess(req, res)) {
    return;
  }

  try {
    return res.status(200).json(backfillImportedNewsMetadata());
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "News metadata refresh failed" });
  }
});

adminRouter.put("/admin/bmps-2026-player-stats", (req, res) => {
  if (!requireAdminAccess(req, res)) {
    return;
  }

  try {
    const payload = normalizeBmps2026PlayerStatsPayload(req.body || {});
    const saved = setSiteSetting(
      BMPS_2026_PLAYER_STATS_SETTINGS_KEY,
      payload,
      req.coreAuth?.user?.email || req.coreAuth?.user?.id || null,
    );
    return res.json(saved);
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Failed to update BMPS 2026 stats" });
  }
});

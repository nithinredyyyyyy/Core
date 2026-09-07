import { BMPS_2026_MVP_STATS, BMPS_2026_FMVP_STATS, PMGC_2025_MVP_STATS } from "@/lib/bmps2026PlayerStats";

function isPmgc(tournament) {
  return /pmgc|global\s*championship/i.test(tournament?.name);
}

function isPmwc(tournament) {
  return /pmwc|world\s*cup/i.test(tournament?.name);
}

export function computeMvpScores(entries) {
  if (!entries || entries.length === 0) return entries;
  const maxFinishes = Math.max(...entries.map((e) => e.finishes || 0), 1);
  const maxDamage = Math.max(...entries.map((e) => e.damage || 0), 1);
  const maxKnocks = Math.max(...entries.map((e) => e.knocks || 0), 1);
  const fpms = entries.map((e) => {
    if (e.fpm != null) {
      const val = parseFloat(e.fpm);
      return Number.isFinite(val) ? val : 0;
    }
    const finishes = e.finishes || 0;
    const matches = e.matches || 1;
    return matches > 0 ? finishes / matches : 0;
  });
  const maxFpm = Math.max(...fpms, 1);
  return entries.map((e, i) => {
    const elimScore = ((e.finishes || 0) / maxFinishes) * 0.4;
    const dmgScore = ((e.damage || 0) / maxDamage) * 0.3;
    const fpmScore = (fpms[i] / maxFpm) * 0.2;
    const knockScore = ((e.knocks || 0) / maxKnocks) * 0.1;
    const mvpRating = (elimScore + dmgScore + fpmScore + knockScore).toFixed(2);
    const fpm = fpms[i] > 0 ? fpms[i].toFixed(2) : "—";
    const matches = e.matches || 1;
    const avgKills = (matches > 0 ? ((e.finishes || 0) / matches).toFixed(2) : "—");
    const kd = e.kd ?? (e.deaths > 0 ? ((e.finishes || 0) / e.deaths).toFixed(2) : "—");
    const headshotPct = e.headshotPct || e.headshot_pct || "—";
    const winRate = e.winRate || e.win_rate || "—";
    const assistsPerRd = e.assistsPerRd || (matches > 0 ? ((e.assists || 0) / matches).toFixed(1) : "—");
    const utilityDmg = e.utilityDmg ?? e.utility_dmg ?? "—";
    return {
      ...e,
      teamName: e.team || e.teamName,
      mvpRating, fpm, avgKills, kd, headshotPct,
      winRate, assistsPerRd, utilityDmg,
      rank: e.placement ?? i + 1,
    };
  });
}

function findGfEntries(tournament) {
  const rankings = tournament?.rankings || [];
  const gf = rankings.find(
    (r) => /grand\s*finals?/i.test(r.title) || /gf/i.test(r.title)
  );
  if (gf?.entries?.length > 0) return gf.entries;
  const mvpRanking = rankings.find(
    (r) => /mvp/i.test(r.title) && !/fmvp/i.test(r.title)
  );
  return mvpRanking?.entries || [];
}

function findTopPlayersFromStages(tournament, playerTeamMap = {}) {
  const stages = tournament?.stages || [];
  for (let i = stages.length - 1; i >= 0; i--) {
    const stage = stages[i];
    const overall = stage?.standings?.overall || [];
    if (overall.length >= 5) {
      return overall.slice(0, 10).map((s) => {
        const teamName = s.team?.name || s.team_name || s.teamName || playerTeamMap[s.player?.toLowerCase()] || "";
        return {
          player: s.player || s.player_name || "",
          teamName,
          finishes: s.finishes ?? s.kills ?? 0,
          damage: s.damage ?? s.total_damage ?? 0,
          knocks: s.knocks ?? 0,
          matches: s.matches ?? s.matches_played ?? 0,
          kd: s.kd ?? null,
          fpm: s.fpm ?? null,
        };
      }).filter((e) => e.player);
    }
  }
  return [];
}

function findAwardPlayerFromGf(tournament, awardEntry) {
  const allGf = findGfEntries(tournament);
  if (allGf.length === 0) return {};
  const scored = computeMvpScores(allGf);
  const gfEntry = scored.find((e) => e.player === awardEntry.player) ||
    allGf.find((e) => e.player === awardEntry.player);
  return gfEntry || {};
}

function mergeFromHardcodedStats(computed, hardcoded) {
  if (!computed || !hardcoded) return computed;
  return computed.map((entry) => {
    const match = hardcoded.find((h) => h.player === entry.player);
    if (!match) return entry;
    return {
      ...entry,
      damage: entry.damage || match.damage || 0,
      knocks: entry.knocks || match.knocks || 0,
      avgSurvival: entry.avgSurvival || match.avgSurvival || null,
      fpm: entry.fpm || match.fpm || "—",
      matches: entry.matches || match.matches || 0,
    };
  });
}

export function getMvpDataFromTournament(tournament, playerTeamMap = {}) {
  if (isPmgc(tournament)) {
    return PMGC_2025_MVP_STATS;
  }
  if (isPmwc(tournament)) {
    const awards = tournament?.awards || [];
    const mvpAward = awards.find(
      (a) => /mvp/i.test(a.title) && !/fmvp|finals?\s*mvp/i.test(a.title)
    );
    const fmvpAward = awards.find(
      (a) => /finals?\s*mvp/i.test(a.title) || /fmvp/i.test(a.title)
    );
    const award = mvpAward || fmvpAward;
    if (award) {
      return [{
        player: award.player,
        teamName: award.team || playerTeamMap[award.player?.toLowerCase()] || "",
        award: award.title,
        mvpRating: "—",
        finishes: "—",
        fpm: "—",
        damage: 0,
      }];
    }
  }
  const allGf = findGfEntries(tournament);
  if (allGf.length > 0 && allGf[0]?.player) {
    const withTeams = allGf.slice(0, 5).map((e) => ({
      ...e,
      teamName: e.team || e.teamName || playerTeamMap[e.player?.toLowerCase()] || "",
    }));
    const scored = computeMvpScores(withTeams);
    return mergeFromHardcodedStats(scored, BMPS_2026_MVP_STATS);
  }
  const topPlayers = findTopPlayersFromStages(tournament, playerTeamMap);
  if (topPlayers.length > 0) {
    return computeMvpScores(topPlayers.slice(0, 5));
  }
  const awards = tournament?.awards || [];
  const mvpAward = awards.find(
    (a) => /mvp/i.test(a.title) && !/fmvp|finals?\s*mvp/i.test(a.title)
  );
  if (mvpAward) {
    const gfEntry = findAwardPlayerFromGf(tournament, mvpAward);
    const resolvedTeam = mvpAward.team || playerTeamMap[mvpAward.player?.toLowerCase()] || "";
    const hardcoded = BMPS_2026_MVP_STATS.find((h) => h.player === mvpAward.player);
    return [{
      player: mvpAward.player,
      teamName: resolvedTeam,
      award: mvpAward.title,
      mvpRating: gfEntry.mvpRating ?? hardcoded?.mvpRating ?? "—",
      avgKills: gfEntry.avgKills ?? "—",
      kd: gfEntry.kd ?? "—",
      headshotPct: gfEntry.headshotPct ?? "—",
      finishes: gfEntry.finishes ?? hardcoded?.finishes ?? 0,
      fpm: gfEntry.fpm ?? hardcoded?.fpm ?? "—",
      best: gfEntry.best ?? hardcoded?.best ?? "—",
      damage: gfEntry.damage ?? hardcoded?.damage ?? 0,
      knocks: gfEntry.knocks ?? hardcoded?.knocks ?? 0,
    }];
  }
  return null;
}

export function getFmvpDataFromTournament(tournament, playerTeamMap = {}) {
  const awards = tournament?.awards || [];
  const fmvp = awards.find(
    (a) => /finals?\s*mvp/i.test(a.title) || /fmvp/i.test(a.title)
  );
  if (fmvp) {
    const resolvedTeam = fmvp.team || playerTeamMap[fmvp.player?.toLowerCase()] || "";
    const isBgms = /bgms|masters\s*series/i.test(tournament?.name);
    if (isBgms) {
      const rankings = tournament?.rankings || [];
      const fmvpRanking = rankings.find((r) => /fmvp/i.test(r.title));
      const entry = fmvpRanking?.entries?.find((e) => e.player === fmvp.player);
      return [{
        player: fmvp.player,
        teamName: resolvedTeam,
        award: fmvp.title,
        finishes: entry?.finishes ?? 0,
        fpm: entry?.fpm ?? "—",
        best: entry?.best ?? "—",
        contribution: entry?.contribution ?? "—",
        fivePlus: entry?.fivePlus ?? 0,
        matches: entry?.matches ?? 0,
        mvpRating: "—",
      }];
    }
    const gfEntry = findAwardPlayerFromGf(tournament, fmvp);
    const hardcoded = BMPS_2026_FMVP_STATS.find((h) => h.player === fmvp.player);
    return [{
      player: fmvp.player,
      teamName: resolvedTeam,
      award: fmvp.title,
      mvpRating: gfEntry.mvpRating ?? hardcoded?.mvpRating ?? "—",
      avgKills: gfEntry.avgKills ?? "—",
      kd: gfEntry.kd ?? "—",
      headshotPct: gfEntry.headshotPct ?? "—",
      finishes: gfEntry.finishes ?? hardcoded?.finishes ?? 0,
      fpm: gfEntry.fpm ?? hardcoded?.fpm ?? "—",
      best: gfEntry.best ?? hardcoded?.best ?? "—",
      damage: gfEntry.damage ?? hardcoded?.damage ?? 0,
      knocks: gfEntry.knocks ?? hardcoded?.knocks ?? 0,
    }];
  }
  return null;
}

export function getIglDataFromTournament(tournament, playerTeamMap = {}) {
  const awards = tournament?.awards || [];
  const igl = awards.find(
    (a) => /best\s*igl/i.test(a.title) || /igl/i.test(a.title)
  );
  if (igl) {
    return {
      player: igl.player,
      teamName: igl.team || playerTeamMap[igl.player?.toLowerCase()] || "",
      award: igl.title,
    };
  }
  return null;
}

export function getSupportDataFromTournament(tournament, playerTeamMap = {}) {
  const awards = tournament?.awards || [];
  const support = awards.find(
    (a) => /best\s*support/i.test(a.title) || /support/i.test(a.title)
  );
  if (support) {
    const gfEntry = findAwardPlayerFromGf(tournament, support);
    const resolvedTeam = support.team || playerTeamMap[support.player?.toLowerCase()] || "";
    return [{
      player: support.player,
      teamName: resolvedTeam,
      award: support.title,
      assistsPerRd: gfEntry.assistsPerRd ?? "—",
      utilityDmg: gfEntry.utilityDmg ?? "—",
      kd: gfEntry.kd ?? "—",
      mvpRating: gfEntry.mvpRating ?? "—",
    }];
  }
  return null;
}

export function getRookieDataFromTournament(tournament, playerTeamMap = {}) {
  const awards = tournament?.awards || [];
  const rookie = awards.find(
    (a) => /rookie/i.test(a.title)
  );
  if (rookie) {
    return [{
      player: rookie.player,
      teamName: rookie.team || playerTeamMap[rookie.player?.toLowerCase()] || "",
      award: rookie.title,
      age: rookie.age ?? "—",
      debut: rookie.debut ?? "—",
    }];
  }
  return null;
}

export function getSpecialAwardDataFromTournament(tournament, awardTitle, playerTeamMap = {}) {
  const awards = tournament?.awards || [];
  const award = awards.find(
    (a) => a.title === awardTitle
  );
  if (award) {
    const rankings = tournament?.rankings || [];
    const allEntries = rankings.flatMap((r) => r.entries || []);
    const playerEntry = allEntries.find((e) => e.player === award.player);
    return {
      player: award.player,
      teamName: award.team || playerTeamMap[award.player?.toLowerCase()] || "",
      award: award.title,
      elimins: playerEntry?.elimins ?? 0,
      avg_dmg: playerEntry?.avg_dmg ?? 0,
      assists: playerEntry?.assists ?? 0,
      knocks: playerEntry?.knocks ?? 0,
      kd: playerEntry?.kd ?? "—",
    };
  }
  return null;
}

export function getTournamentMvpData(tournament, playerTeamMap = {}) {
  return getMvpDataFromTournament(tournament, playerTeamMap) || [];
}

export function getTop5MvpData(tournament, playerTeamMap = {}) {
  if (isPmgc(tournament)) {
    return PMGC_2025_MVP_STATS;
  }
  if (isPmwc(tournament)) {
    const awards = tournament?.awards || [];
    const gfData = findGfEntries(tournament);
    if (gfData.length >= 5) {
      const scored = computeMvpScores(gfData.slice(0, 5).map((e) => ({
        ...e,
        teamName: e.team || e.teamName || playerTeamMap[e.player?.toLowerCase()] || "",
      })));
      return scored;
    }
    const fmvp = awards.find((a) => /fmvp/i.test(a.title));
    if (fmvp) {
      return [{
        rank: 1,
        player: fmvp.player,
        teamName: fmvp.team || playerTeamMap[fmvp.player?.toLowerCase()] || "",
        elimins: "—",
        avg_dmg: 0,
        knocks: 0,
        kd: "—",
      }];
    }
    return [];
  }
  const gfEntries = findGfEntries(tournament);
  if (gfEntries.length > 0 && gfEntries[0]?.player) {
    const withTeams = gfEntries.slice(0, 5).map((e) => ({
      ...e,
      teamName: e.team || e.teamName || playerTeamMap[e.player?.toLowerCase()] || "",
    }));
    return computeMvpScores(withTeams);
  }
  const topPlayers = findTopPlayersFromStages(tournament, playerTeamMap);
  if (topPlayers.length >= 5) {
    return computeMvpScores(topPlayers.slice(0, 5));
  }
  const awards = tournament?.awards || [];
  const awardPlayers = awards
    .filter((a) => a.player)
    .slice(0, 5)
    .map((a, i) => ({
      rank: i + 1,
      player: a.player,
      teamName: a.team || playerTeamMap[a.player?.toLowerCase()] || "",
      award: a.title,
      elimins: "—",
      avg_dmg: 0,
      knocks: 0,
      kd: "—",
    }));
  if (awardPlayers.length > 0) return awardPlayers;
  return [];
}

export function getTournamentFmvpData(tournament, playerTeamMap = {}) {
  return getFmvpDataFromTournament(tournament, playerTeamMap) || [];
}

export const TEAM_NAME_ALIASES = {
  "nongshimredforce": ["nsredforce", "nongshim"],
  "bigetronbyvitality": ["teamvitality", "bigetron"],
  "ag.alinternational": ["agal", "ag"],
  "721esports": ["gs721"],
  "alulaclubesports": ["alulaclub"],
  "kiwoomdrx": ["drx"],
  "rrqryu": ["rrq"],
  "geekayesports": ["geekay"],
  "gamingstarssports": ["gamingstars"],
  "wolvesesports": ["wolves"],
  "alpha7esports": ["alpha7"],
  "4thrivesesports": ["4thrives"],
};

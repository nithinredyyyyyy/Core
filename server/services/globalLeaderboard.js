import { db } from "../db.js";
import { canonicalizeTeamLookupValue } from "../db/teamAliases.js";

export function getTeamLeaderboard(season = '2024') {
  const rows = db.prepare(`
    SELECT t.name as teamName, sr.rating, sr.tournament_points, sr.status
    FROM team_season_ratings sr
    JOIN teams t ON sr.team_id = t.id
    WHERE sr.season = ?
    ORDER BY sr.rating DESC, t.name
  `).all(season);

  return rows.map((r, i) => {
    const pts = JSON.parse(r.tournament_points);
    return {
      rank: i + 1,
      teamName: r.teamName,
      status: r.status || 'Active',
      pts24BGIS: season === '2024' ? (pts.BGIS || 0) : 0,
      pts24BMPS: season === '2024' ? (pts.BMPS || 0) : 0,
      pts25BGIS: season === '2025' ? (pts.BGIS || 0) : 0,
      pts25BMPS: season === '2025' ? (pts.BMPS || 0) : 0,
      pts25BMSD: season === '2025' ? (pts.BMSD || 0) : 0,
      pts26BGIS: season === '2026' ? (pts.BGIS || 0) : 0,
      pts26BMPS: season === '2026' ? (pts.BMPS || 0) : 0,
      rating: r.rating
    };
  });
}

export function getPlayerLeaderboard(season = '2024') {
  const rows = db.prepare(`
    SELECT p.ign as playerName, t.name as teamName, sr.rating as pts, sr.finishes
    FROM player_season_ratings sr
    JOIN players p ON sr.player_id = p.id
    JOIN teams t ON sr.team_id = t.id
    WHERE sr.season = ?
    ORDER BY sr.rating DESC, p.ign
  `).all(season);

  return rows.map((r, i) => ({
    rank: i + 1,
    playerName: r.playerName,
    teamName: r.teamName,
    pts: r.pts,
    finishes: r.finishes,
    photo: `/images/players/${r.playerName.toUpperCase()}.png`
  }));
}

export function recomputeGlobalLeaderboard() {
  const now = new Date().toISOString();
  
  // Recompute cumulative ratings from season points
  const teamSeasons = db.prepare(`
    SELECT team_id, season, tournament_points
    FROM team_season_ratings
  `).all();

  const byTeam = new Map();
  for (const s of teamSeasons) {
    if (!byTeam.has(s.team_id)) byTeam.set(s.team_id, []);
    byTeam.get(s.team_id).push(s);
  }

  for (const [teamId, seasons] of byTeam) {
    let totalRating = 0;
    for (const s of seasons) {
      const pts = JSON.parse(s.tournament_points);
      for (const val of Object.values(pts)) {
        totalRating += val;
      }
    }
    db.prepare(`
      UPDATE team_season_ratings 
      SET rating = ?, updated_date = ?
      WHERE team_id = ?
    `).run(totalRating, new Date().toISOString(), teamId);
  }

  return { teamsUpdated: byTeam.size };
}
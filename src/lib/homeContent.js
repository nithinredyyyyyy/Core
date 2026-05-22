import {
  getOrganizationMeta,
  isOrganizationHidden,
} from "./organizationIdentity.js";

export const HOME_STAGE_STATUS_STYLES = {
  completed:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  current:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  live: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
  upcoming:
    "border-slate-300/80 bg-background/90 text-muted-foreground dark:border-slate-700 dark:bg-slate-900/50",
};

export function aggregateTournamentStandings(
  results,
  teamsMap,
  { includeHidden = false } = {},
) {
  const standings = {};

  results.forEach((result) => {
    const team = teamsMap[result.team_id];
    if (!team) return;

    const meta = getOrganizationMeta(team);
    if (!includeHidden && isOrganizationHidden(meta.name)) return;

    if (!standings[meta.key]) {
      standings[meta.key] = {
        teamKey: meta.key,
        rawTeamName: team.name,
        teamName: meta.name,
        totalPoints: 0,
        wins: 0,
      };
    }

    standings[meta.key].totalPoints += result.total_points || 0;
    standings[meta.key].wins +=
      result.wins_count || (result.placement === 1 ? 1 : 0);
  });

  return Object.values(standings).sort(
    (a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins,
  );
}

export function getTournamentChampionFromStages(tournament) {
  const stages = Array.isArray(tournament?.stages) ? tournament.stages : [];
  const finalsStage =
    stages.find(
      (stage) =>
        stage?.name === "Grand Finals" &&
        Array.isArray(stage?.standings) &&
        stage.standings.length > 0,
    ) ||
    [...stages]
      .reverse()
      .find(
        (stage) =>
          Array.isArray(stage?.standings) && stage.standings.length > 0,
      );

  if (!finalsStage) return null;

  const championEntry =
    [...finalsStage.standings].sort(
      (a, b) => (a?.placement ?? 999) - (b?.placement ?? 999),
    )[0] || null;

  if (!championEntry) return null;

  const rawName = championEntry.fullTeam || championEntry.team || "";
  const meta = getOrganizationMeta(rawName);

  return {
    teamKey: meta.key,
    rawTeamName: rawName,
    teamName: meta.name,
    totalPoints: championEntry.points || 0,
    wins: championEntry.wwcd || 0,
  };
}

export function buildTournamentStageLink(tournamentId, stageName) {
  if (!tournamentId) return "/tournaments";
  const base = `/tournaments?id=${encodeURIComponent(tournamentId)}`;
  return stageName ? `${base}&stage=${encodeURIComponent(stageName)}` : base;
}

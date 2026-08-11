import { normalizeOrganizationName } from "@/lib/organizationIdentity";

export function buildTeamMapStats({
  featuredTournament,
  stageBoard,
  matches,
  matchResults,
}) {
  const tournamentMatches = matches.filter(
    (match) => match.tournament_id === featuredTournament?.id,
  );
  const tournamentMatchIds = new Set(
    tournamentMatches.map((match) => match.id),
  );
  const matchMap = new Map(tournamentMatches.map((match) => [match.id, match]));
  const teamStats = new Map();

  for (const row of stageBoard.standings) {
    teamStats.set(row.teamId || normalizeOrganizationName(row.teamName), {
      teamId: row.teamId,
      teamName: row.teamName,
      logoName: row.logoName || row.teamName,
      maps: new Map(),
    });
  }

  for (const result of matchResults) {
    if (!tournamentMatchIds.has(result.match_id)) continue;

    const match = matchMap.get(result.match_id);
    const mapName = String(match?.map || "Map pending").trim();
    const teamKey =
      result.team_id || normalizeOrganizationName(result.team_name);
    const displayName =
      result.team_name || teamStats.get(teamKey)?.teamName || "Unknown Team";
    const teamEntry = teamStats.get(teamKey) || {
      teamId: result.team_id,
      teamName: displayName,
      logoName: displayName,
      maps: new Map(),
    };

    const mapEntry = teamEntry.maps.get(mapName) || {
      map: mapName,
      matches: 0,
      wwcd: 0,
      placementPoints: 0,
      elims: 0,
      points: 0,
      placementSum: 0,
      topFiveCount: 0,
      topEightCount: 0,
      overEightCount: 0,
      placementBuckets: {
        wins: 0,
        secondToFive: 0,
        sixToTen: 0,
        elevenPlus: 0,
      },
      pointsBuckets: {
        zero: 0,
        underFive: 0,
        fivePlus: 0,
        tenPlus: 0,
        seventeenPlus: 0,
        twentyFourPlus: 0,
      },
    };

    const wins =
      result.wins_count && result.wins_count > 0
        ? result.wins_count
        : result.placement === 1
          ? 1
          : 0;

    mapEntry.matches += result.matches_count || 1;
    mapEntry.wwcd += wins;
    mapEntry.placementPoints += result.placement_points || 0;
    mapEntry.elims += result.kill_points || 0;
    mapEntry.points += result.total_points || 0;
    mapEntry.placementSum += Number(result.placement) || 0;
    const placement = Number(result.placement) || 0;
    const totalPoints = Number(result.total_points) || 0;

    if (placement > 0 && placement <= 5) {
      mapEntry.topFiveCount += 1;
    }
    if (placement > 0 && placement <= 8) {
      mapEntry.topEightCount += 1;
    }
    if (placement > 8) {
      mapEntry.overEightCount += 1;
    }
    if (placement === 1) {
      mapEntry.placementBuckets.wins += 1;
    } else if (placement >= 2 && placement <= 5) {
      mapEntry.placementBuckets.secondToFive += 1;
    } else if (placement >= 6 && placement <= 10) {
      mapEntry.placementBuckets.sixToTen += 1;
    } else if (placement >= 11) {
      mapEntry.placementBuckets.elevenPlus += 1;
    }

    if (totalPoints === 0) {
      mapEntry.pointsBuckets.zero += 1;
    } else if (totalPoints < 5) {
      mapEntry.pointsBuckets.underFive += 1;
    }
    if (totalPoints >= 5) {
      mapEntry.pointsBuckets.fivePlus += 1;
    }
    if (totalPoints >= 10) {
      mapEntry.pointsBuckets.tenPlus += 1;
    }
    if (totalPoints >= 17) {
      mapEntry.pointsBuckets.seventeenPlus += 1;
    }
    if (totalPoints >= 24) {
      mapEntry.pointsBuckets.twentyFourPlus += 1;
    }

    teamEntry.maps.set(mapName, mapEntry);
    teamStats.set(teamKey, teamEntry);
  }

  return stageBoard.standings
    .map((row) => {
      const entry = teamStats.get(
        row.teamId || normalizeOrganizationName(row.teamName),
      ) || {
        teamId: row.teamId,
        teamName: row.teamName,
        logoName: row.logoName || row.teamName,
        maps: new Map(),
      };

      const maps = [...entry.maps.values()]
        .map((mapRow) => ({
          ...mapRow,
          avgPlacement:
            mapRow.matches > 0 ? mapRow.placementSum / mapRow.matches : null,
          avgPlacePoints:
            mapRow.matches > 0 ? mapRow.placementPoints / mapRow.matches : 0,
          avgElims: mapRow.matches > 0 ? mapRow.elims / mapRow.matches : 0,
        }))
        .sort((left, right) => {
          if (right.points !== left.points) return right.points - left.points;
          if (right.wwcd !== left.wwcd) return right.wwcd - left.wwcd;
          return left.map.localeCompare(right.map);
        });

      const bestMap = maps[0] || null;
      const weakestMap =
        maps.toSorted((left, right) => {
          if (left.points !== right.points) return left.points - right.points;
          if (left.wwcd !== right.wwcd) return left.wwcd - right.wwcd;
          return left.map.localeCompare(right.map);
        })[0] || null;

      const totals = maps.reduce(
        (accumulator, mapRow) => {
          accumulator.points += mapRow.points;
          accumulator.matches += mapRow.matches;
          accumulator.placementPoints += mapRow.placementPoints;
          accumulator.elims += mapRow.elims;
          accumulator.placementSum += mapRow.placementSum;
          accumulator.topFiveCount += mapRow.topFiveCount;
          accumulator.topEightCount += mapRow.topEightCount;
          accumulator.overEightCount += mapRow.overEightCount;
          accumulator.placementBuckets.wins += mapRow.placementBuckets.wins;
          accumulator.placementBuckets.secondToFive +=
            mapRow.placementBuckets.secondToFive;
          accumulator.placementBuckets.sixToTen +=
            mapRow.placementBuckets.sixToTen;
          accumulator.placementBuckets.elevenPlus +=
            mapRow.placementBuckets.elevenPlus;
          accumulator.pointsBuckets.zero += mapRow.pointsBuckets.zero;
          accumulator.pointsBuckets.underFive += mapRow.pointsBuckets.underFive;
          accumulator.pointsBuckets.fivePlus += mapRow.pointsBuckets.fivePlus;
          accumulator.pointsBuckets.tenPlus += mapRow.pointsBuckets.tenPlus;
          accumulator.pointsBuckets.seventeenPlus +=
            mapRow.pointsBuckets.seventeenPlus;
          accumulator.pointsBuckets.twentyFourPlus +=
            mapRow.pointsBuckets.twentyFourPlus;
          return accumulator;
        },
        {
          points: 0,
          matches: 0,
          placementPoints: 0,
          elims: 0,
          placementSum: 0,
          topFiveCount: 0,
          topEightCount: 0,
          overEightCount: 0,
          placementBuckets: {
            wins: 0,
            secondToFive: 0,
            sixToTen: 0,
            elevenPlus: 0,
          },
          pointsBuckets: {
            zero: 0,
            underFive: 0,
            fivePlus: 0,
            tenPlus: 0,
            seventeenPlus: 0,
            twentyFourPlus: 0,
          },
        },
      );

      const formatPercent = (value) =>
        totals.matches > 0 ? `${Math.round((value / totals.matches) * 100)}%` : "-";
      const getMapAverages = (mapName) => {
        const mapRow = maps.find((entry) => entry.map.toLowerCase() === mapName);
        if (!mapRow?.matches) return null;
        return {
          elims: mapRow.elims / mapRow.matches,
          placePoints: mapRow.placementPoints / mapRow.matches,
        };
      };

      return {
        teamId: row.teamId,
        teamName: row.teamName,
        logoName: row.logoName || row.teamName,
        rank: row.rank,
        totalPoints: totals.points,
        matchesPlayed: totals.matches,
        totalPlacePoints: totals.placementPoints,
        totalElims: totals.elims,
        avgPlacePoints:
          totals.matches > 0 ? totals.placementPoints / totals.matches : 0,
        avgPlacement:
          totals.matches > 0 ? totals.placementSum / totals.matches : null,
        avgElims: totals.matches > 0 ? totals.elims / totals.matches : 0,
        avgTotalPoints: totals.matches > 0 ? totals.points / totals.matches : 0,
        topFiveCount: totals.topFiveCount,
        topEightCount: totals.topEightCount,
        overEightCount: totals.overEightCount,
        winPercent: formatPercent(totals.placementBuckets.wins),
        secondToFivePercent: formatPercent(totals.placementBuckets.secondToFive),
        sixToTenPercent: formatPercent(totals.placementBuckets.sixToTen),
        elevenPlusPercent: formatPercent(totals.placementBuckets.elevenPlus),
        pointsBuckets: totals.pointsBuckets,
        avgMapStats: {
          erangel: getMapAverages("erangel"),
          miramar: getMapAverages("miramar"),
          rondo: getMapAverages("rondo"),
        },
        maps,
      };
    })
    .sort((left, right) => {
      if (right.totalPoints !== left.totalPoints)
        return right.totalPoints - left.totalPoints;
      if (right.totalElims !== left.totalElims)
        return right.totalElims - left.totalElims;
      return left.teamName.localeCompare(right.teamName);
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
}

import { db } from "../db.js";

const TOURNAMENT_NAME = "BGMI Masters Series Season 5";

const getPlacementPoints = (placement) => {
  if (placement === 1) return 10;
  if (placement === 2) return 6;
  if (placement === 3) return 5;
  if (placement === 4) return 4;
  if (placement === 5) return 3;
  if (placement === 6) return 2;
  if (placement === 7) return 1;
  if (placement === 8) return 1;
  return 0;
};

const tournament = db.prepare("SELECT * FROM tournaments WHERE name = ?").get(TOURNAMENT_NAME);
if (!tournament) {
  console.error("Tournament not found");
  process.exit(1);
}

const stages = JSON.parse(tournament.stages);

for (const stage of stages) {
  if (stage.standings && stage.standings.length > 0) {
    const fixedStandings = [];
    for (const team of stage.standings) {
      if (!team.games) {
        // Assume already fixed or manual entry
        fixedStandings.push(team);
        continue;
      }
      
      let matches = 0;
      let wwcd = 0;
      let pos = 0;
      let elimins = 0;
      
      const newTeam = {
        placement: team.rank,
        team: team.team,
        fullTeam: team.team,
        points: team.total,
        outcome: team.qualifiesTo || "Stage result",
        grp: team.grp ? `Group ${team.grp}` : undefined
      };
      
      team.games.forEach((game, idx) => {
        if (game) {
          matches++;
          if (game.placement === 1) wwcd++;
          
          const pPoints = getPlacementPoints(game.placement);
          pos += pPoints;
          elimins += game.kills;
          
          newTeam[`m${game.game || (idx + 1)}`] = pPoints + game.kills;
        }
      });
      
      newTeam.matches = matches;
      newTeam.wwcd = wwcd;
      newTeam.pos = pos;
      newTeam.elimins = elimins;
      
      fixedStandings.push(newTeam);
    }
    stage.standings = fixedStandings;
  }
}

db.prepare("UPDATE tournaments SET stages = ? WHERE id = ?").run(JSON.stringify(stages), tournament.id);
console.log("Successfully fixed standings schema for UI rendering!");

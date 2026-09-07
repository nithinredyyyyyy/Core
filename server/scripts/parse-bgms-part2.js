import fs from "fs";
import { db } from "../db.js";

const TOURNAMENT_NAME = "BGMI Masters Series Season 5";

function parseTeamBlocks(lines, startIndex, numGames) {
  let i = startIndex;
  const teams = [];
  
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    
    // Look for rank, e.g., "1st", "2nd", "16th"
    if (/^\d+(st|nd|rd|th)$/.test(line)) {
      const rank = parseInt(line.replace(/\D/g, ""), 10);
      i++;
      
      let teamLine = lines[i].trim();
      let teamMatch = teamLine.match(/\[([^\]]+)\]/);
      let teamName = teamMatch ? teamMatch[1] : teamLine;
      
      // Some team names have HTML entity or extra junk, keep it simple
      if (teamName.includes("Team_Apex_Gaming")) teamName = "Apex Gaming"; // fallback if name parsing fails but link doesn't

      i++;
      const totalPoints = parseInt(lines[i].trim(), 10);
      i++;
      
      const games = [];
      let gamesParsed = 0;
      
      while (i < lines.length && gamesParsed < numGames) {
        let pLine = lines[i].trim();
        if (!pLine) { i++; continue; }
        
        // Peek to see if this is a team rank (e.g., next line is NOT a number, or it matches a bracket)
        if (/^\d+(st|nd|rd|th)$/.test(pLine)) {
          let nextLine = "";
          for(let k=1; k<5; k++) {
             if (lines[i+k] && lines[i+k].trim()) {
                 nextLine = lines[i+k].trim();
                 break;
             }
          }
          // If the next line is NOT just digits (or just "-"), it's likely a team name
          if (nextLine !== "-" && !/^\d+$/.test(nextLine)) {
            break; // This is a team rank, so break out of games loop
          }
        }
        
        if (pLine === "-") {
          games.push(null);
          i++;
          // skip the associated kills if it's also "-"
          let lookahead = i;
          while (lookahead < lines.length && !lines[lookahead].trim()) lookahead++;
          if (lookahead < lines.length && lines[lookahead].trim() === "-") {
            i = lookahead + 1;
          }
          gamesParsed++;
          continue;
        }

        const placementMatch = pLine.match(/^(\d+)(st|nd|rd|th)?$/);
        if (placementMatch) {
          const placement = parseInt(placementMatch[1], 10);
          i++;
          while (i < lines.length && !lines[i].trim()) i++; // skip empty
          const kLine = lines[i].trim();
          const kills = kLine === "-" ? 0 : parseInt(kLine, 10);
          games.push({ game: gamesParsed + 1, placement, kills });
          i++;
          gamesParsed++;
        } else {
          break; // unexpected
        }
      }
      
      teams.push({
        rank,
        team: teamName,
        total: totalPoints,
        games
      });
      
      // Don't auto-increment i here, the inner loop left it at the right spot
    } else {
      i++;
    }
    
    if (teams.length === 16) break;
  }
  return teams;
}

function processAll() {
  const text = fs.readFileSync(new URL("../../tmp/bgms-raw-all-full.txt", import.meta.url), "utf8");
  const lines = text.split("\n");
  
  const results = {};
  
  const stagesToFind = [
    { name: "League Week 2", games: 24 },
    { name: "League Week 3", games: 24 },
    { name: "Super Weekend 1", games: 18 },
    { name: "Super Weekend 2", games: 18 },
    { name: "Playoffs", games: 18 },
    { name: "Grand Finals", games: 18 }
  ];
  
  for (const stage of stagesToFind) {
    // Find the marker
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === stage.name) {
        // Confirm it's the standings block by looking ahead a few lines for "Overall standings" or "Rank"
        let foundStandings = false;
        for (let j = 1; j < 50 && i + j < lines.length; j++) {
          if (lines[i + j].trim().startsWith("Game 1")) {
             foundStandings = true;
             idx = i + j;
             break;
          }
        }
        if (foundStandings) break;
      }
    }
    
    if (idx !== -1) {
      // Find where "1st" starts after "Rank Participant Total Points"
      let startIdx = idx;
      while (startIdx < lines.length && lines[startIdx].trim() !== "1st") {
        startIdx++;
      }
      if (startIdx < lines.length) {
        results[stage.name] = parseTeamBlocks(lines, startIdx, stage.games);
      }
    }
  }

  // Debug results
  for (const [sName, teams] of Object.entries(results)) {
    console.log(`Parsed ${sName}: ${teams.length} teams`);
    if (teams.length > 0) {
      console.log(`  1st: ${teams[0].team} - ${teams[0].total} pts`);
    }
  }
  
  // Now apply to DB
  const tournament = db.prepare("SELECT * FROM tournaments WHERE name = ?").get(TOURNAMENT_NAME);
  if (!tournament) {
    console.error("Tournament not found");
    return;
  }
  
  const stages = JSON.parse(tournament.stages);
  
  for (const stageName of Object.keys(results)) {
    const stageIdx = stages.findIndex(s => s.name === stageName);
    if (stageIdx !== -1) {
      stages[stageIdx].standings = results[stageName];
    }
  }
  
  db.prepare("UPDATE tournaments SET stages = ? WHERE id = ?").run(JSON.stringify(stages), tournament.id);
  console.log("Successfully updated tournament stages in DB!");
}

processAll();

import fs from 'fs';
import path from 'path';
import { db } from '../../server/db.js';
import { backfillNormalizedData } from '../../server/db/normalize.js';

const raw = fs.readFileSync('C:\\Users\\surak\\.gemini\\antigravity\\brain\\5aa611d6-fcfb-4b17-8f91-ba63f4e2c637\\scratch\\raw_standings.txt', 'utf8');

function parseTable(text, headerRegex) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let inTable = false;
  const standings = [];
  
  for (const line of lines) {
    if (headerRegex.test(line)) {
      inTable = true;
      continue;
    }
    if (inTable) {
      // e.g. "1 Alpha7 Esports 18 5 71 82 153" or "1\tAlter Ego Ares\t12\t2\t35\t86\t121"
      const match = line.match(/^(\d+)\s+(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/);
      if (match) {
        standings.push({
          placement: parseInt(match[1], 10),
          teamName: match[2].trim(),
          matches: parseInt(match[3], 10),
          wwcd: parseInt(match[4], 10),
          pos: parseInt(match[5], 10),
          elimins: parseInt(match[6], 10),
          points: parseInt(match[7], 10),
        });
      } else {
        // if we hit something that doesn't match, maybe end of table
        if (standings.length > 0 && !line.match(/^\d/)) {
          break;
        }
      }
    }
  }
  return standings;
}

function updateTournament(name, stagesData) {
  const t = db.prepare('SELECT id, stages FROM tournaments WHERE name = ?').get(name);
  if (!t) {
    console.log(`Tournament ${name} not found!`);
    return;
  }
  
  let stages = JSON.parse(t.stages || '[]');
  
  for (const [stageName, data] of Object.entries(stagesData)) {
    let stage = stages.find(s => s.name === stageName);
    if (!stage) {
      stage = { name: stageName, standings: [] };
      stages.push(stage);
    }
    
    // Process groups if provided
    if (data.groups) {
      // data.groups is { 'Group Red': ['TeamA', ...], ... }
      stage.groups = Object.keys(data.groups).map(k => ({
        name: k.replace('Group ', ''),
        teams: data.groups[k]
      }));
      
      // Map teams to groups in standings
      data.standings.forEach(row => {
        for (const g of stage.groups) {
          if (g.teams.includes(row.teamName)) {
            row.group = g.name;
          }
        }
      });
    }
    
    stage.standings = data.standings;
  }
  
  db.prepare('UPDATE tournaments SET stages = ? WHERE id = ?').run(JSON.stringify(stages), t.id);
  console.log(`Updated ${name} with ${Object.keys(stagesData).length} stages.`);
}

// PMWC 2024
const pmwc2024 = {
  'Group Stage': {
    groups: {
      'Group Red': ['Brute Force', 'Tianba', '4Merical Vibes', 'REJECT', 'Dplus', "D'Xavier", 'Beşiktaş Black', 'Yoodo Alliance', 'Alliance', 'Beşiktaş Esports'],
      'Group Green': ['Team Liquid', 'Harame Bro', 'Vampire Esports', 'Tong Jia Bao Esports', 'Falcons Force', 'MadBulls', 'Al Ula x IHC', 'IHC ESPORTS', 'Talon Esports'],
      'Group Yellow': ['BOOM Esports', 'CAG OSAKA', 'DRX', 'IW NRX', 'Alpha7 Esports', 'iNCO Gaming', 'Money Makers', 'POWR eSports']
    },
    standings: parseTable(raw.substring(raw.indexOf('PMWC 2024'), raw.indexOf('Survival Stage — Standings (Jul 23–24, 2024)')), /# Team Matches WWCD/)
  },
  'Survival Stage': {
    standings: parseTable(raw.substring(raw.indexOf('Survival Stage — Standings (Jul 23–24, 2024)'), raw.indexOf('Grand Finals — Standings (Jul 26–28, 2024)')), /# Team Matches WWCD/)
  },
  'Main Tournament': {
    standings: parseTable(raw.substring(raw.indexOf('Grand Finals — Standings (Jul 26–28, 2024)'), raw.indexOf('PMWC 2025')), /# Team Matches WWCD/)
  }
};
updateTournament('PUBG Mobile World Cup 2024', pmwc2024);

// PMWC 2025
const pmwc2025 = {
  'Group Stage': {
    groups: {
      'Group Red': ['Alpha7', 'Weibo Gaming', 'Horaa Esports', 'Team AxTMG', 'Team Falcons', 'POWR eSports', 'eArena', 'NS RedForce'],
      'Group Green': ['Alter Ego Ares', 'IDA Esports', 'ThunderTalk Gaming', 'Alpha Gaming', 'R8 Esports', 'INTENSE GAME', 'KINOTROPE', 'Team GAMAX'],
      'Group Yellow': ['4Thrives', 'Regnum Carya', 'Team Secret', 'DRX', 'Team Vision', 'Yangon Galacticos', 'INFLUENCE RAGE', 'Fire Flux Esports']
    },
    standings: parseTable(raw.substring(raw.indexOf('PMWC 2025'), raw.indexOf('Survival Stage — Standings (Jul 29–30, 2025)')), /#\s+Team\s+Matches\s+WWCD/)
  },
  'Survival Stage': {
    standings: parseTable(raw.substring(raw.indexOf('Survival Stage — Standings (Jul 29–30, 2025)'), raw.indexOf('Grand Finals — Standings (Aug 1–3, 2025)')), /#\s+Team\s+Matches\s+WWCD/)
  },
  'Grand Finals': {
    standings: parseTable(raw.substring(raw.indexOf('Grand Finals — Standings (Aug 1–3, 2025)'), raw.indexOf('PMGC 2025')), /#\s+Team\s+Matches\s+WWCD/)
  }
};
updateTournament('PUBG Mobile World Cup 2025', pmwc2025);

// PMGC 2025
const pmgc2025 = {
  'The Gauntlet': {
    standings: parseTable(raw.substring(raw.indexOf('Gauntlet Stage'), raw.indexOf('Group Stage — Group Green')), /#\s+Team\s+Matches/)
  },
  'Group Stage': {
    // PMGC 2025 has Group Green and Group Red
    standings: [
      ...parseTable(raw.substring(raw.indexOf('Group Stage — Group Green'), raw.indexOf('Group Stage — Group Red')), /#\s+Team\s+Matches/).map(r => ({...r, group: 'Green'})),
      ...parseTable(raw.substring(raw.indexOf('Group Stage — Group Red'), raw.indexOf('Last Chance')), /#\s+Team\s+Matches/).map(r => ({...r, group: 'Red'}))
    ]
  },
  'Last Chance': {
    standings: parseTable(raw.substring(raw.indexOf('Last Chance'), raw.indexOf('Grand Finals\n#')), /#\s+Team\s+Matches/)
  },
  'Grand Finals': {
    standings: parseTable(raw.substring(raw.indexOf('Grand Finals\n#'), raw.indexOf('Overall Grand Finals Elimination Rankings')), /#\s+Team\s+Matches/)
  }
};
updateTournament('PUBG Mobile Global Championship 2025', pmgc2025);

console.log('Running backfillNormalizedData()...');
backfillNormalizedData().then(() => console.log('Done!'));

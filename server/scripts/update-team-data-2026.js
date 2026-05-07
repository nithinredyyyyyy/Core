import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { normalizeOrganizationName } from "../../SRC/LIB/organizationIdentity.js";

const now = new Date().toISOString();

const rosterUpdates = [
  {
    canonicalName: "8Bit",
    tag: "8BIT",
    aliases: ["8Bit", "8BIT", "8Bit x CS Esports"],
    players: ["Juicy", "Sarang", "Skipz", "Hexy", "Radien"],
  },
  {
    canonicalName: "Gods Reign",
    tag: "GDR",
    aliases: ["Gods Reign", "OnePlus Gods Reign"],
    players: ["Destro", "DeltaPG", "Justin", "Neyo", "Aquanox"],
  },
  {
    canonicalName: "True Rippers",
    tag: "TR",
    aliases: ["True Rippers", "Infinix True Rippers"],
    players: ["Jelly", "KioLmao", "Hydro", "Harsh", "Rony"],
  },
  {
    canonicalName: "Team Insane",
    tag: "INSANE",
    aliases: ["Team Insane", "Team iNSANE", "TEAM iNSANE"],
    players: ["AryanOG", "Clutcher", "Maxus", "Neooo", "NinjaOP"],
  },
  {
    canonicalName: "Team Versatile",
    tag: "VXT",
    aliases: ["Team Versatile"],
    players: ["DeadPlayer", "Nobi", "Sreyam", "Nadegod", "Wixxy"],
  },
  {
    canonicalName: "Mysterious 4",
    tag: "M4",
    aliases: ["Mysterious 4", "MYSTERIOUS 4"],
    players: ["Sketch", "Naman", "Fragger", "Goku"],
  },
  {
    canonicalName: "Team Aryan",
    tag: "AX",
    aliases: ["Team Aryan", "Aryan x TMG Gaming"],
    players: ["Aryan", "Devotee", "Henry", "Aimbot"],
  },
  {
    canonicalName: "Madkings Esports",
    tag: "MAD",
    aliases: ["Madkings Esports", "MadKings", "Madkings"],
    players: ["Shadow", "ClutchGood", "Pro", "Syrax"],
  },
  {
    canonicalName: "Rising Esports",
    tag: "RSE",
    aliases: ["Rising Esports", "Inferno Squad", "Hail Inferno Squad"],
    players: ["DragonOP", "PokoWNL", "Yuva", "BeardBaba", "Shray", "Rico"],
  },
  {
    canonicalName: "Los Hermanos Esports",
    tag: "LH",
    aliases: ["Los Hermanos Esports"],
    players: ["Zhyrx", "Altu", "Dope", "Phantom", "Shogun"],
  },
  {
    canonicalName: "SOA Esports",
    tag: "SOA",
    aliases: ["SOA Esports"],
    players: ["Mohit", "Dizzy", "Xzist", "XoXo", "Magic"],
  },
  {
    canonicalName: "GENxFM Esports",
    tag: "GFM",
    aliases: ["GENxFM Esports"],
    players: ["Damuuu", "Dhiraj", "Dipop", "Zeref", "Ghost"],
  },
  {
    canonicalName: "Bot Army",
    tag: "BAE",
    aliases: ["Bot Army"],
    players: ["Yashu", "Harry", "ViperBolte", "Earny", "Zod"],
  },
  {
    canonicalName: "GodLike Esports",
    tag: "GODL",
    aliases: ["GodLike Esports", "Hero Xtreme GodLike"],
    players: ["Saumay"],
  },
  {
    canonicalName: "Learn From Past",
    tag: "LEFP",
    aliases: ["Learn From Past"],
    players: null,
  },
];

const bgisRosterEntries = [
  ["8Bit", ["Juicy", "Sarang", "Skipz", "Hexy", "Radien"]],
  ["Gods Reign", ["Destro", "DeltaPG", "Justin", "Neyo", "Aquanox"]],
  ["True Rippers", ["Jelly", "KioLmao", "Hydro", "Harsh", "Rony"]],
  ["Team Insane", ["AryanOG", "Clutcher", "Maxus", "Neooo", "NinjaOP"]],
  ["Team Versatile", ["DeadPlayer", "Nobi", "Sreyam", "Nadegod", "Wixxy"]],
  ["Mysterious 4", ["Sketch", "Naman", "Fragger", "Goku"]],
  ["Team Aryan", ["Aryan", "Devotee", "Henry", "Aimbot"]],
  ["Madkings Esports", ["Shadow", "ClutchGood", "Pro", "Syrax"]],
  ["Rising Esports", ["DragonOP", "PokoWNL", "Yuva", "BeardBaba", "Shray", "Rico"]],
  ["Los Hermanos Esports", ["Zhyrx", "Altu", "Dope", "Phantom", "Shogun"]],
  ["SOA Esports", ["Mohit", "Dizzy", "Xzist", "XoXo", "Magic"]],
  ["GENxFM Esports", ["Damuuu", "Dhiraj", "Dipop", "Zeref", "Ghost"]],
  ["Bot Army", ["Yashu", "Harry", "ViperBolte", "Earny", "Zod"]],
];

const findTeamByAliases = db.prepare(`
  SELECT id, name, tag, created_date
  FROM teams
  WHERE name = ?
  ORDER BY datetime(created_date) DESC
`);

const updateTeamStmt = db.prepare(`
  UPDATE teams
  SET name = ?, tag = ?, game = 'BGMI', region = 'India', updated_date = ?
  WHERE id = ?
`);

const deletePlayersStmt = db.prepare(`DELETE FROM players WHERE team_id = ?`);

const insertPlayerStmt = db.prepare(`
  INSERT INTO players (
    id, ign, real_name, team_id, role, photo_url, total_kills, matches_played, avg_damage,
    created_date, updated_date, created_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getTournamentStmt = db.prepare(`SELECT id, participants FROM tournaments WHERE name = ?`);
const updateTournamentParticipantsStmt = db.prepare(`
  UPDATE tournaments
  SET participants = ?, updated_date = ?
  WHERE id = ?
`);

function pickPrimaryTeam(aliases) {
  const matches = aliases.flatMap((alias) => findTeamByAliases.all(alias));
  if (matches.length === 0) return null;

  return matches.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))[0];
}

function replacePlayers(teamId, players) {
  deletePlayersStmt.run(teamId);
  if (!players) return;

  for (const ign of players) {
    insertPlayerStmt.run(
      randomUUID(),
      ign,
      null,
      teamId,
      "Assaulter",
      null,
      0,
      0,
      0,
      now,
      now,
      "admin@stagecore.local"
    );
  }
}

const tx = db.transaction(() => {
  for (const update of rosterUpdates) {
    const primaryTeam = pickPrimaryTeam(update.aliases);
    if (!primaryTeam) continue;

    updateTeamStmt.run(update.canonicalName, update.tag, now, primaryTeam.id);
    if (update.players) {
      replacePlayers(primaryTeam.id, update.players);
    }
  }

  const tournament = getTournamentStmt.get("Battlegrounds Mobile India Series 2026");
  if (tournament) {
    const participants = JSON.parse(tournament.participants || "[]");
    const desiredKeys = new Set(bgisRosterEntries.map(([name]) => normalizeOrganizationName(name)));
    const existingByKey = new Map(
      participants.map((entry) => [normalizeOrganizationName(entry.team), entry])
    );

    const preserved = participants.filter(
      (entry) => !desiredKeys.has(normalizeOrganizationName(entry.team))
    );

    const patchedEntries = bgisRosterEntries.map(([team, players], index) => {
      const key = normalizeOrganizationName(team);
      const existing = existingByKey.get(key);
      return {
        placement: existing?.placement ?? index + 1,
        team,
        phase: existing?.phase ?? "BGIS 2026",
        players,
      };
    });

    updateTournamentParticipantsStmt.run(
      JSON.stringify([...preserved, ...patchedEntries]),
      now,
      tournament.id
    );
  }
});

tx();

console.log("Updated team records, rosters, tags, and BGIS 2026 participants.");

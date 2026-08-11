import { readFileSync } from "node:fs";

const { db: local } = await import("file:///C:/Users/surak/core/server/db.js");
const env = readFileSync(".env", "utf8");
const tursoUrl = env.match(/TURSO_DATABASE_URL=(\S+)/)?.[1] || "";
const tursoToken = env.match(/TURSO_AUTH_TOKEN=(\S+)/)?.[1] || "";
const { default: Database } = await import("libsql");
const remote = new Database(tursoUrl, tursoToken ? { authToken: tursoToken } : {});

const name = "Battlegrounds Mobile India Pro Series 2026";
const l = JSON.parse(local.prepare("SELECT participants FROM tournaments WHERE name = ?").get(name).participants);
const r = JSON.parse(remote.prepare("SELECT participants FROM tournaments WHERE name = ?").get(name).participants);

const groupByPhase = (list) => {
  const map = new Map();
  for (const p of list) {
    const phase = p?.phase || "(none)";
    if (!map.has(phase)) map.set(phase, []);
    map.get(phase).push({ team: String(p?.team || "").trim(), players: (p?.players || []).length });
  }
  return map;
};

const lMap = groupByPhase(l);
const rMap = groupByPhase(r);
const allPhases = [...new Set([...lMap.keys(), ...rMap.keys()])].sort();

for (const phase of allPhases) {
  const lTeams = lMap.get(phase) || [];
  const rTeams = rMap.get(phase) || [];
  console.log(`\n### ${phase}  (local ${lTeams.length} / remote ${rTeams.length})`);
  const maxLen = Math.max(lTeams.length, rTeams.length);
  for (let i = 0; i < maxLen; i++) {
    const lc = lTeams[i] ? `${lTeams[i].team}${lTeams[i].players ? ` [${lTeams[i].players}]` : ""}` : "";
    const rc = rTeams[i] ? `${rTeams[i].team}${rTeams[i].players ? ` [${rTeams[i].players}]` : ""}` : "";
    const mark = lc === rc ? " " : lTeams[i] && rTeams[i] ? "!" : lTeams[i] ? "<" : ">";
    console.log(`  ${mark} ${lc.padEnd(34)} | ${rc}`);
  }
}

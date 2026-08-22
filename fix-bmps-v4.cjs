const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');
const path = require('path');
const fs = require('fs');
const db = new Database(path.join(__dirname, 'server', 'data', 'stagecore.sqlite'));
const B = 'fd8472c7-d012-4680-bdc7-39c75d862e98';
const now = new Date().toISOString();

const src = fs.readFileSync('replace-bmps-data.cjs', 'utf8');
const survData = eval('(' + src.match(/const survivalData = (\[[\s\S]*?\]);/)[1] + ')');
const semiData = eval('(' + src.match(/const semiData = (\[[\s\S]*?\]);/)[1] + ')');
const lcData = eval('(' + src.match(/const lastChanceData = (\[[\s\S]*?\]);/)[1] + ')');

function uuid() { return randomUUID(); }
function pp(p) { if (p===1) return 10; if (p===2) return 6; if (p===3) return 5; if (p===4) return 4; if (p===5) return 3; if (p===6) return 2; if (p===7||p===8) return 1; return 0; }
function pc(c) {
  if (!c || c === '-') return null;
  const t = c.trim();
  if (t.includes('\u{1F3C6}')) { const n = t.replace(/[^0-9]/g, ''); return { p: 1, k: parseInt(n) || 0 }; }
  const n = t.replace(/[^0-9]/g, '');
  if (!n) return null;
  if (n.length === 3) {
    const a = parseInt(n.substring(0, 2), 10), b = parseInt(n.substring(2), 10);
    const x = parseInt(n.substring(0, 1), 10), y = parseInt(n.substring(1), 10);
    if (a >= 10 && a <= 16) return { p: a, k: b };
    if (x >= 1 && x <= 9) return { p: x, k: y };
    if (n[0] === '0') { const q = parseInt(n.substring(1, 2), 10), r = parseInt(n.substring(2), 10); if (q >= 1 && q <= 16) return { p: q, k: r }; }
    return { p: x, k: y };
  }
  if (n.length === 2) return { p: parseInt(n[0]), k: parseInt(n[1]) };
  return { p: parseInt(n), k: 0 };
}

const TM = { 'Team SouL': 'Team Soul', 'Apex Gaming': 'Team Apex Gaming', 'Esports Social': 'Esport Social', 'Troy Tamilans': 'Troy Tamilan Esports', 'Team RedXross': 'Team RedXRoss', 'RiotNationZ': 'RiotNations', 'Learn from Past': 'Learn From Past', 'Flying Esports': 'Team Flying Esports', 'Zero Ark': 'Zero Ark Official', 'Futurise x Empire': 'Futurise Esports Empire Originals', 'Santa Esp': 'Santa Esports', 'Mysterious4 Esports': 'Mysterious 4', 'H4K Esports': 'H4K Esports' };
const allT = db.prepare('SELECT id,name FROM teams').all();
const tl = new Map();
for (const t of allT) { tl.set(t.name, t.id); tl.set(t.name.toLowerCase().replace(/[^a-z0-9]/g, ''), t.id); }
function rid(n) {
  const m = TM[n]; if (m && tl.has(m)) return tl.get(m);
  if (tl.has(n)) return tl.get(n);
  const nm = n.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (tl.has(nm)) return tl.get(nm);
  for (const t of allT) { const tn = t.name.toLowerCase().replace(/[^a-z0-9]/g, ''); if (tn === nm || tn.includes(nm) || nm.includes(tn)) return t.id; }
  return null;
}

const MATCH_COLS = 'id,tournament_id,stage,group_name,match_number,map,status,day,created_date,updated_date,created_by';
const RESULT_COLS = 'id,match_id,tournament_id,team_id,placement,kill_points,placement_points,total_points,stage,matches_count,wins_count,created_date,updated_date,created_by';

function mkMatchSql(stage, hasGroup) {
  const gn = hasGroup ? '?' : 'NULL';
  return `INSERT INTO matches(${MATCH_COLS}) VALUES(?,?,'${stage}',${gn},?,'Erangel','completed',?,?,?,'system:v4')`;
}
function mkResultSql(stage) {
  return `INSERT INTO match_results(${RESULT_COLS}) VALUES(?,?,?,?,?,?,?,?,'${stage}',1,?,?,?,'system:v4')`;
}

const MATCH_PARAMS = 11;
const RESULT_PARAMS = 14;

console.log('Clearing old data...');
db.prepare("DELETE FROM match_results WHERE tournament_id=? AND stage IN ('Semi Finals','Survival Stage','Last Chance Stage')").run(B);
db.prepare("DELETE FROM matches WHERE tournament_id=? AND stage IN ('Semi Finals','Survival Stage','Last Chance Stage')").run(B);

function insertResults(preparedResult, matchMap, teamData, stageName) {
  let ok = 0, err = 0;
  for (const td of teamData) {
    const tid = rid(td.team);
    if (!tid) { console.log('  MISSING: ' + td.team); err++; continue; }
    const grp = (td.grp || '').toUpperCase();
    for (const [k, c] of Object.entries(td.matches)) {
      const idx = parseInt(k);
      if (c === '-' || !c) continue;
      const r = pc(c); if (!r) continue;
      const pl = pp(r.p);
      preparedResult.run(uuid(), matchMap.get(idx), B, tid, r.p, r.k, pl, pl + r.k, r.p === 1 ? 1 : 0, now, now);
      ok++;
    }
  }
  console.log(`  ${stageName}: ${ok} results, ${err} errors`);
  return { ok, err };
}

console.log('\n=== Semi Finals ===');
const sMm = db.prepare(mkMatchSql('Semi Finals', false));
const sMr = db.prepare(mkResultSql('Semi Finals'));
const sMM = new Map();
for (let i = 0; i < 25; i++) { const id = uuid(); sMm.run(id, B, i + 1, Math.floor(i / 8) + 1, now, now); sMM.set(i, id); }
insertResults(sMr, sMM, semiData, 'Semi');

console.log('\n=== Survival Stage ===');
const vMm = db.prepare(mkMatchSql('Survival Stage', true));
const vMr = db.prepare(mkResultSql('Survival Stage'));
const vGroups = ['AB', 'AC', 'AD', 'BC', 'BD', 'CD'];
const vMM = new Map();
for (let i = 0; i < 24; i++) {
  const id = uuid(); const g = vGroups[Math.floor(i / 4)];
  vMm.run(id, B, g, i + 1, Math.floor(i / 8) + 1, now, now);
  vMM.set(i, id);
}

const validByGroup = {
  A: new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]),
  B: new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]),
  C: new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]),
  D: new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23])
};

let vOK = 0, vE = 0, vSkip = 0;
for (const td of survData) {
  const tid = rid(td.team);
  if (!tid) { console.log('  MISSING: ' + td.team); vE++; continue; }
  for (const [k, c] of Object.entries(td.matches)) {
    const idx = parseInt(k);
    if (c === '-' || !c) continue;
    const r = pc(c); if (!r) continue;
    const pl = pp(r.p);
    vMr.run(uuid(), vMM.get(idx), B, tid, r.p, r.k, pl, pl + r.k, r.p === 1 ? 1 : 0, now, now);
    vOK++;
  }
}
console.log(`  Survival: ${vOK} results, ${vE} errors`);

console.log('\n=== Last Chance Stage ===');
const lMm = db.prepare(mkMatchSql('Last Chance Stage', false));
const lMr = db.prepare(mkResultSql('Last Chance Stage'));
const lMM = new Map();
for (let i = 0; i < 12; i++) { const id = uuid(); lMm.run(id, B, i + 1, Math.floor(i / 4) + 1, now, now); lMM.set(i, id); }
insertResults(lMr, lMM, lcData, 'LC');

console.log('\n=== DONE ===');
db.close();

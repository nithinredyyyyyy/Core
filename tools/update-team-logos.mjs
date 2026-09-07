import { db } from "../server/db.js";

const logoMap = {
  "ThunderTalk Gaming": "/images/team-logos/thundertalk.png",
  "Alpha7 Esports": "/images/team-logos/alpha 7.png",
  "ULF Esports": "/images/team-logos/ulf.png",
  "DRX": "/images/team-logos/drx.png",
  "Wolves Esports": "/images/team-logos/wolves.png",
  "Orangutan": "/images/team-logos/orangutan.png",
  "Virtus.pro": "/images/team-logos/vp.png",
  "Alpha Gaming": "/images/team-logos/ag.png",
  "eArena": "/images/team-logos/ea.png",
  "Geekay Esports": "/images/team-logos/geekay.png",
  "Alter Ego Ares": "/images/team-logos/ares-esport.png",
  "Team Flash": "/images/team-logos/team flash.png",
  "GOAT Team": "/images/team-logos/goat.png",
  "INFLUENCE RAGE": "/images/team-logos/furia.png",
  "Boars Gaming": "/images/team-logos/boars.png",
  "Twisted Minds": "/images/team-logos/Twisted Minds.png",
  "ETSH Esports": "/images/team-logos/etsh.png",
  "Team Falcons": "/images/team-logos/falcons.png",
  "Burmese Ghouls": "/images/team-logos/burmese-ghouls.png",
  "Nuclear Zone": "/images/team-logos/nuclear-zone.png",
  "Dplus": "/images/team-logos/dplus-kia.png",
  "REJECT": "/images/team-logos/reject.png",
  "True Rippers": "/images/team-logos/true-rippers.png",
  "Vampire Esports": "/images/team-logos/vampire-esports.png",
  "Weibo Gaming": "/images/team-logos/Weibo Gaming.png",
  "Tianba": "/images/team-logos/Tianba.png",
  "ARCRED": "/images/team-logos/arcred.png",
  "9z Team": "/images/team-logos/9z-team.png",
  "Loops Esports": "/images/team-logos/loops-esports.png",
  "Inner Circle Esports": "/images/team-logos/inner-circle.png",
  "Papara SuperMassive": "/images/team-logos/papara-supermassive.png",
  "Gen.G Esports MENA": "/images/team-logos/gen-g-mena.png",
  "Alliance": "/images/team-logos/alliance.png",
  "Regnum Carya Esports": "/images/team-logos/regnum-carya.png",
  "MadBulls": "/images/team-logos/madbulls.png",
  "Kara Esports": "/images/team-logos/kara-esports.png",
  "R8 Esports": "/images/team-logos/r8-esports.png",
  "Team Secret": "/images/team-logos/team-secret.png",
  "GS Team": "/images/team-logos/gs-team.png",
  "D'Xavier": "/images/team-logos/dxavier.png",
};

const stmt = db.prepare("UPDATE teams SET logo_url = ? WHERE name = ?");
let updated = 0;
for (const [team, logo] of Object.entries(logoMap)) {
  const result = stmt.run(logo, team);
  if (result.changes > 0) updated++;
}
console.log(`Updated ${updated} team logos out of ${Object.keys(logoMap).length} mapped`);

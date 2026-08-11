const { db } = await import("file:///C:/Users/surak/core/server/db.js");

const GROUP_A = "Group Stage - Group A";
const GROUP_B = "Group Stage - Group B";

const officialOrder = [
  [GROUP_A, "AG.AL International"],
  [GROUP_A, "Yangon Galacticos"],
  [GROUP_A, "ThunderTalk Gaming"],
  [GROUP_A, "Tianba"],
  [GROUP_A, "XForce Rejects"],
  [GROUP_A, "Alpha7 Esports"],
  [GROUP_A, "FURIA Esports"],
  [GROUP_A, "Wolves Esports"],
  [GROUP_A, "Aurora Gaming"],
  [GROUP_A, "Godlike Esports"],
  [GROUP_A, "GOAT Team"],
  [GROUP_A, "TT Project"],
  [GROUP_A, "Kiwoom DRX"],
  [GROUP_A, "DOPENESS"],
  [GROUP_A, "Orangutan"],
  [GROUP_A, "721 Esports"],
  [GROUP_B, "AlUla Club Esports"],
  [GROUP_B, "ETSH Esports"],
  [GROUP_B, "Geekay Esports"],
  [GROUP_B, "Nongshim Redforce"],
  [GROUP_B, "Nigma Galaxy"],
  [GROUP_B, "Horaa Esports"],
  [GROUP_B, "4thrives Esports"],
  [GROUP_B, "Bigetron by Vitality"],
  [GROUP_B, "RRQ RYU"],
  [GROUP_B, "eArena"],
  [GROUP_B, "Team Flash"],
  [GROUP_B, "IDA Esports"],
  [GROUP_B, "Gaming Stars Esports"],
  [GROUP_B, "S2G Esports"],
  [GROUP_B, "ULF Esports"],
  [GROUP_B, "Hustler Crew"],
];

function norm(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

const byName = db.prepare("SELECT id, name, participants FROM tournaments WHERE name = ?").get("PUBG Mobile World Cup 2026");
if (!byName) {
  console.error("PMWC 2026 not found");
  process.exit(1);
}
const current = JSON.parse(byName.participants || "[]");
const byKey = new Map(current.map((p) => [norm(p.team), p]));

const missing = officialOrder.filter(([, team]) => !byKey.has(norm(team)));
if (missing.length) {
  console.error("missing in DB participants:", missing.map(([, t]) => t).join(", "));
  process.exit(1);
}

const rebuilt = officialOrder.map(([phase, team], index) => {
  const original = byKey.get(norm(team));
  return { ...original, phase, placement: index + 1 };
});

db.prepare("UPDATE tournaments SET participants = ?, updated_date = ? WHERE id = ?").run(
  JSON.stringify(rebuilt),
  new Date().toISOString(),
  byName.id,
);

const groupA = rebuilt.filter((p) => p.phase === GROUP_A).map((p) => p.team);
const groupB = rebuilt.filter((p) => p.phase === GROUP_B).map((p) => p.team);
console.log(`updated ${rebuilt.length} participants (${byName.id})`);
console.log("Group A:", groupA.join(" | "));
console.log("Group B:", groupB.join(" | "));

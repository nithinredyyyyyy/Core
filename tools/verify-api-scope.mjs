const { scopeMatchParticipants } = await import("file:///C:/Users/surak/core/src/lib/teamScope.js");

const base = "http://localhost:4000/api/tournaments/b7224eb0-f9c3-40fd-b568-0cceda3a6fe9";
const data = await (await fetch(`${base}/normalized`)).json();

const participants = (data.participants || []).map((p) => {
  const entry = p.stage_entries?.[0] || {};
  return {
    ...p,
    phase: entry.phase_label || p.phase || "",
    team: p.team_name || p.team?.name || "",
    group_name: entry.group_name || p.group_name || "",
  };
});
const teams = participants.map((p) => ({ name: p.team })).filter((t) => t.name);

console.log(`participants=${participants.length} teams=${teams.length}`);

const seen = new Map();
for (const m of (data.stages || []).flatMap((s) => s.matches || data.matches || [])) {
  const key = `${m.stage || ""}::${m.group_name || ""}`;
  if (key !== "::") seen.set(key, m);
}

const checks = [
  { stage: "Group Stage", groupName: "Group A" },
  { stage: "Group Stage", groupName: "Group B" },
  { stage: "Group Stage", groupName: "" },
  { stage: "Survival Stage", groupName: "" },
  { stage: "Grand Finals", groupName: "" },
];
for (const c of checks) {
  const result = scopeMatchParticipants({ participants, teams, stage: c.stage, groupName: c.groupName });
  console.log(
    `${String(c.stage).padEnd(16)} ${String(c.groupName).padEnd(10)} scoped=${result.scopedParticipants.length} resolved=${result.resolvedTeams.length}`,
  );
}

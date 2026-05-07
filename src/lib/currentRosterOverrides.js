import { dedupeRosterCaseInsensitive } from "@/lib/rosterUtils";

export const CURRENT_ROSTER_OVERRIDES = {
  "8Bit": {
    remove: ["Raiden", "Radien"],
    add: ["Shubh"],
  },
  "Mysterious 4": {
    replace: [],
  },
  "NoNx Esports": {
    replace: [],
  },
  "Rising Esports": {
    rename: {
      Shray: "Shrey",
    },
  },
  "4TR Official": {
    remove: ["InfGod"],
  },
  "Phoenix Esports": {
    replace: [],
  },
  "Meta Ninza": {
    remove: ["WhiteTiger", "Whitetiger"],
  },
  "Autobotz Esports": {
    remove: ["Skillfull", "SkillFull"],
    add: ["FanOP", "Eggy666"],
  },
  "Welt Esports": {
    remove: ["Proton", "Maxioso"],
  },
};

export function applyCurrentRosterOverride(teamName, roster) {
  const override = CURRENT_ROSTER_OVERRIDES[teamName];
  if (!override) return dedupeRosterCaseInsensitive(roster);

  if (override.replace) {
    return dedupeRosterCaseInsensitive(override.replace);
  }

  let nextRoster = dedupeRosterCaseInsensitive(roster);

  if (override.rename) {
    nextRoster = nextRoster.map((player) => override.rename[player] || player);
  }

  if (override.remove?.length) {
    const removed = new Set(override.remove.map((player) => String(player).toLowerCase()));
    nextRoster = nextRoster.filter((player) => !removed.has(String(player).toLowerCase()));
  }

  if (override.add?.length) {
    nextRoster = dedupeRosterCaseInsensitive([...nextRoster, ...override.add]);
  }

  return dedupeRosterCaseInsensitive(nextRoster);
}

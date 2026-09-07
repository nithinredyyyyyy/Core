export function getPhaseParts(phase) {
  const str = String(phase || "").trim();
  const groupMatch = str.match(/^(.+?)\s*-\s*Group\s+([A-Z0-9]+)$/i);
  if (groupMatch) {
    return { stage: groupMatch[1].trim(), group: groupMatch[2].trim().toUpperCase() };
  }
  if (/grand\s*finals/i.test(str)) return { stage: "Grand Finals", group: "ALL" };
  if (/last\s*chance/i.test(str)) return { stage: "Last Chance Stage", group: "ALL" };
  if (/regular\s*season/i.test(str)) return { stage: "Regular Season", group: "ALL" };
  if (/playoffs?/i.test(str)) return { stage: "Playoffs", group: "ALL" };
  if (/semifinals?|semi\s*finals?/i.test(str)) return { stage: "Semi Finals", group: "ALL" };
  if (/survival/i.test(str)) return { stage: "Survival Stage", group: "ALL" };
  if (/^round\s+\d+$/i.test(str)) return { stage: str, group: "ALL" };
  if (/^participants$/i.test(str)) return { stage: "Participants", group: "ALL" };
  return null;
}

export function buildPosterOptions(participantEntries) {
  const map = new Map();
  for (const entry of participantEntries || []) {
    const parts = getPhaseParts(entry.phase);
    if (!parts) continue;
    const key = `${parts.stage}::${parts.group}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        stage: parts.stage,
        group: parts.group,
        label: parts.group === "ALL" ? parts.stage : `${parts.stage} - Group ${parts.group}`,
      });
    }
  }
  return [...map.values()].toSorted((left, right) => {
    const stageOrder = ["Round 1","Round 2","Round 3","Round 4","Survival Stage","Semi Finals","Last Chance Stage","Grand Finals"];
    const leftIdx = stageOrder.indexOf(left.stage);
    const rightIdx = stageOrder.indexOf(right.stage);
    const stageDelta = (leftIdx === -1 ? 99 : leftIdx) - (rightIdx === -1 ? 99 : rightIdx);
    if (stageDelta !== 0) return stageDelta;
    return left.group.localeCompare(right.group, undefined, { numeric: true });
  });
}

export function getEntrySortValue(entry) {
  const value = Number(entry?.placement ?? entry?.seed ?? 9999);
  return Number.isFinite(value) ? value : 9999;
}

export function getCellClass(option, index) {
  if (String(option?.stage || "").toLowerCase() !== "round 4") return "";
  if (option.group === "A") return index >= 12 ? "promo" : "";
  if (option.group === "D") return index < 4 ? "releg" : "";
  if (index < 4) return "releg";
  if (index >= 12) return "promo";
  return "";
}

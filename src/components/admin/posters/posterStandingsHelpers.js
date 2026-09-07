export function getStageScenario(stage, group) {
  const s = String(stage || "").toLowerCase();
  const g = String(group || "").toUpperCase();
  if (s === "round 1" || s === "round 2" || s === "round 3") {
    return { tags: [
      { label: "Top 8 Promote", tone: "advance" },
      { label: "Bottom 4 Relegate", tone: "eliminate" },
    ]};
  }
  if (s === "round 4") {
    if (g === "A") return { tags: [
      { label: "#1-8 → Grand Finals", tone: "podium" },
      { label: "#9-16 → Semi Finals", tone: "advance" },
    ]};
    if (g === "B") return { tags: [
      { label: "#1-8 → Semi Finals", tone: "advance" },
      { label: "#9-16 → Survival", tone: "eliminate" },
    ]};
    if (g === "C") return { tags: [
      { label: "All 16 → Survival Stage", tone: "advance" },
    ]};
    if (g === "D") return { tags: [
      { label: "#1-8 → Survival", tone: "advance" },
      { label: "#9-16 Eliminated", tone: "eliminate" },
    ]};
  }
  if (s === "survival stage") {
    return { tags: [
      { label: "Top 8 → Semi Finals", tone: "advance" },
      { label: "Bottom Eliminated", tone: "eliminate" },
    ]};
  }
  if (s === "semi finals") {
    return { tags: [
      { label: "#1-6 → Grand Finals", tone: "podium" },
      { label: "#7-22 → Last Chance", tone: "advance" },
      { label: "#23+ Eliminated", tone: "eliminate" },
    ]};
  }
  if (s === "last chance stage") {
    return { tags: [
      { label: "Top 2 → Grand Finals", tone: "podium" },
      { label: "Rest Eliminated", tone: "eliminate" },
    ]};
  }
  if (s === "grand finals") {
    return { tags: [] };
  }
  return { tags: [] };
}

export function getRowDestinationClass(stage, group, index, total) {
  const s = String(stage || "").toLowerCase();
  const g = String(group || "").toUpperCase();
  if (s === "grand finals") {
    if (index === 0) return "podium-1";
    if (index === 1) return "podium-2";
    if (index === 2) return "podium-3";
    return "";
  }
  if (s === "round 1" || s === "round 2" || s === "round 3") {
    if (index < 8) return "row-advance";
    if (index >= total - 4) return "row-eliminate";
    return "";
  }
  if (s === "round 4") {
    if (g === "A") return index < 8 ? "row-advance" : "";
    if (g === "B") return index < 8 ? "row-advance" : "row-eliminate";
    if (g === "D") return index < 8 ? "row-advance" : "row-eliminate";
    return "";
  }
  if (s === "survival stage") return index < 8 ? "row-advance" : "row-eliminate";
  if (s === "semi finals") {
    if (index < 6) return "row-advance";
    if (index < 22) return "";
    return "row-eliminate";
  }
  if (s === "last chance stage") return index < 2 ? "row-advance" : "row-eliminate";
  return "";
}

export function getRowRankColor(stage, group, index, total) {
  const s = String(stage || "").toLowerCase();
  const g = String(group || "").toUpperCase();
  if (s === "grand finals") {
    if (index === 0) return "#b45309";
    if (index === 1) return "#64748b";
    if (index === 2) return "#c2410c";
    return "#334155";
  }
  if (s === "round 1" || s === "round 2" || s === "round 3") {
    if (index < 8) return "#16a34a";
    if (index >= total - 4) return "#dc2626";
    return "#64748b";
  }
  if (s === "round 4") {
    if (g === "A") return index < 8 ? "#b45309" : "#16a34a";
    if (g === "B") return index < 8 ? "#16a34a" : "#dc2626";
    if (g === "D") return index < 8 ? "#16a34a" : "#dc2626";
    return "#64748b";
  }
  if (s === "survival stage") return index < 8 ? "#16a34a" : "#dc2626";
  if (s === "semi finals") {
    if (index < 6) return "#b45309";
    if (index < 22) return "#16a34a";
    return "#dc2626";
  }
  if (s === "last chance stage") return index < 2 ? "#b45309" : "#dc2626";
  if (index === 0) return "#f97316";
  return "#64748b";
}

export function getMedalIcon(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return null;
}

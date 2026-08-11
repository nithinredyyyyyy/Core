import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { HIDDEN_PARTICIPANT_PHASE_LABELS } from "@/features/tournaments/constants";

export function getTournamentAllocations(tournament) {
  const cleanAllocations = (allocations) =>
    (allocations || []).filter((allocation) => {
      const label = normalizeOrganizationName(
        `${allocation?.title || ""} ${allocation?.event || ""}`,
      );
      return ![...HIDDEN_PARTICIPANT_PHASE_LABELS].some((hidden) =>
        label.includes(hidden),
      );
    });

  if (tournament.name === "Battlegrounds Mobile India Pro Series 2025") {
    return cleanAllocations([
      {
        title: "Champion Slot",
        event: "PUBG Mobile World Cup 2025",
        detail: "Champion qualifies for PMWC 2025.",
      },
    ]);
  }

  if (tournament.name === "Battlegrounds Mobile India Pro Series 2026") {
    return cleanAllocations([
      {
        title: "Champion Slot",
        event: "PUBG Mobile World Cup 2026",
        detail: "Champion qualifies for PMWC 2026.",
        qualifiedTeam: "GodLike Esports",
      },
      {
        title: "KIE Rankings",
        event: "PUBG Mobile World Cup 2026",
        detail: "Orangutan qualifies via KIE Rankings criteria.",
        qualifiedTeam: "Orangutan",
      },
    ]);
  }

  if (tournament.name === "Battlegrounds Mobile India Showdown 2025") {
    return cleanAllocations([
      {
        title: "Champion Slot",
        event: "PUBG Mobile Global Championship 2025 - The Gauntlet",
        detail: "Champion qualifies for PMGC 2025: The Gauntlet.",
      },
      {
        title: "Top 8 Slots",
        event: "Battlegrounds Mobile International Cup 2025",
        detail: "Top 8 teams qualify for BMIC 2025.",
      },
    ]);
  }

  if (tournament.name === "Battlegrounds Mobile India International Cup 2025") {
    return cleanAllocations([
      {
        title: "Champion Slot",
        event: "PUBG Mobile Global Championship 2025 - The Gauntlet",
        detail: "Champion qualifies for PMGC 2025: The Gauntlet.",
      },
      {
        title: "Runner-up Slot",
        event: "PUBG Mobile Global Championship 2025 - Group Stage",
        detail: "Runner-up qualifies for PMGC 2025 Group Stage.",
      },
    ]);
  }

  return cleanAllocations(tournament.allocations);
}

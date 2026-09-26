import React from "react";
import { Swords } from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";
import MatchCard from "@/components/shared/MatchCard";
import EmptyState from "@/components/shared/EmptyState";

/** Most recent completed matches, rendered with the canonical match card. */
export default function RecentResults({ matches = [] }) {
  return (
    <section>
      <SectionHeader
        title="Recent results"
        description="Latest completed matches with published scores."
        actionLabel="All matches"
        actionTo="/matches?view=recent"
      />

      {matches.length === 0 ? (
        <EmptyState
          icon={Swords}
          className="mt-4"
          title="No recent results"
          description="Completed matches with published scores will appear here."
          actionLabel="View all matches"
          actionTo="/matches"
        />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </section>
  );
}

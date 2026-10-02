import React from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import ProfilePanel from "@/components/shared/ProfilePanel";
import ResultsByYearTable from "@/components/shared/ResultsByYearTable";
import { getPlayerDisplayName } from "@/lib/playerDisplayName";

export function TeamDetailMainColumn({ participant, team, achievementHistory, achievementYears }) {
  return (
    <div className="space-y-4">
      <ProfilePanel
        title="BGIS 2026 Roster"
        panelClassName="rounded-xl border border-border bg-card"
        titleClassName="font-heading text-sm font-bold uppercase tracking-wider p-5 border-b border-border"
      >
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {(participant?.roster || []).map((player) => (
            <Link
              key={player.name}
              to={`/players/${encodeURIComponent(player.name)}?team=${encodeURIComponent(team.name)}`}
              className="block rounded-xl border border-border bg-secondary/20 p-4 transition-colors hover:border-primary/30"
            >
              <p className="font-semibold text-foreground">
                {getPlayerDisplayName(player.name)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {player.country}
              </p>
              {player.captain ? (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                  <Star className="size-3" /> Captain
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </ProfilePanel>

      <ProfilePanel
        title="Achievements"
        panelClassName="rounded-xl border border-border bg-card"
        titleClassName="font-heading text-sm font-bold uppercase tracking-wider p-5 border-b border-border"
      >
        {achievementHistory.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No S/A/B-Tier result rows are available for this organization yet.
          </p>
        ) : (
          <ResultsByYearTable
            buckets={achievementYears}
            title="Results by Year"
            wrapperClassName="space-y-5 border-t border-border p-5"
            headingClassName="text-[11px] font-bold uppercase tracking-[0.18em] text-primary"
            yearClassName="text-[11px] font-bold uppercase tracking-[0.18em] text-primary"
            tableClassName="w-full text-sm"
            headerRowClassName="border-b border-border bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground"
            cellClassName="p-4 text-left"
            bodyRowClassName="border-b border-border last:border-b-0"
            hoverRowClassName="hover:bg-secondary/20 transition-colors"
          />
        )}
      </ProfilePanel>
    </div>
  );
}

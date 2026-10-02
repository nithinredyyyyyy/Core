import React from "react";
import { Pencil, Trash2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { getOfficialParticipantCount } from "@/lib/tournamentParticipants";
import { formatAdminDateRange } from "@/features/tournaments/admin/utils/tournamentEditorHelpers";

export function TournamentList({
  visibleTournaments,
  isMutating,
  openEdit,
  deleteTournament,
}) {
  if (visibleTournaments.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-border bg-card p-8 text-center shadow-sm">
        <Trophy className="mx-auto size-8 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          No tournaments match this view
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Adjust the search or status filter to bring events back into view.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {visibleTournaments.map((t) => (
        <div
          key={t.id}
          className="group rounded-[24px] border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
        >
          <button
            type="button"
            onClick={() => openEdit(t)}
            className="flex-1 text-left"
            disabled={isMutating}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{t.name}</span>
              <StatusBadge status={t.status} />
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {t.game} • {t.prize_pool || "No prize"} • Full setup on edit
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
              <span className="rounded-lg border border-border bg-secondary/25 px-3 py-2 text-xs font-semibold text-foreground">
                {t.game || "-"}
              </span>
              <span className="rounded-lg border border-border bg-secondary/25 px-3 py-2 text-xs font-semibold text-foreground">
                {formatAdminDateRange(t.start_date, t.end_date)}
              </span>
              <span className="rounded-lg border border-border bg-secondary/25 px-3 py-2 text-xs font-semibold text-foreground">
                Full setup on edit
              </span>
              <span className="rounded-lg border border-border bg-secondary/25 px-3 py-2 text-xs font-semibold text-foreground">
                {t.max_teams || getOfficialParticipantCount(t) || "-"} teams
              </span>
            </div>
          </button>
          <div className="mt-4 flex gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => openEdit(t)} disabled={isMutating}>
              Edit
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(t)} disabled={isMutating}>
              <Pencil className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => { if (window.confirm("Delete this tournament?")) deleteTournament(t.id); }} disabled={isMutating}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

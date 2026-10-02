import React, { useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTournamentStatCards } from "@/features/tournaments/admin/utils/tournamentEditorHelpers";

export function TournamentAdminHero({
  filteredCount,
  isMutating,
  openCreate,
  searchTerm,
  setSearchTerm,
  setStatusFilter,
  statusFilter,
  tournaments,
}) {
  const statCards = useMemo(() => getTournamentStatCards(tournaments), [tournaments]);

  return (
    <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-secondary/35 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Tournament ops
            </p>
            <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em] text-foreground">
              Event control desk
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Create event shells, maintain stage flows, import standings, and keep participant data aligned before it reaches public tournament pages.
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreate}
            className="gap-2 self-start"
            disabled={isMutating}
          >
            <Plus className="size-4" />
            New Tournament
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-border bg-background/80 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {card.label}
                </p>
                <card.icon className="size-4 text-primary" />
              </div>
              <p className="mt-3 text-2xl font-black text-foreground">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search tournaments by name, game, prize pool, or stage"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["active", "ongoing", "upcoming", "completed", "all"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                statusFilter === status
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground lg:col-span-2">
          Showing {filteredCount} of {tournaments.length} tournaments.
        </p>
      </div>
    </div>
  );
}

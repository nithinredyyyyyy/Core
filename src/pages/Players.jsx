import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { UserCircle2 } from "lucide-react";
import { usePlayers } from "@/hooks/usePlayers";
import { usePageMeta } from "@/hooks/usePageMeta";
import PageHeader from "@/components/shared/PageHeader";
import PageSkeleton from "@/components/shared/PageSkeleton";
import QueryError from "@/components/shared/QueryError";
import EmptyState from "@/components/shared/EmptyState";
import SearchInput from "@/components/shared/SearchInput";
import PlayerAvatar from "@/components/shared/PlayerAvatar";
import TeamLogo from "@/components/shared/TeamLogo";
import { cn } from "@/lib/utils";

const MAX_RESULTS = 120;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

/** Player directory with search across IGN, real name, and team. */
export default function Players() {
  const { players, isLoading, isError, refetch } = usePlayers();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  usePageMeta({
    title: "Players",
    description:
      "BGMI player directory. Search by IGN, real name, or team to open a full career profile.",
    path: "/players",
  });

  const filtered = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return players;
    return players.filter((player) =>
      [player.displayIgn, player.ign, player.real_name, player.teamName]
        .filter(Boolean)
        .some((value) => normalize(value).includes(needle)),
    );
  }, [players, query]);

  const visible = filtered.slice(0, MAX_RESULTS);

  if (isLoading) {
    return <PageSkeleton label="Loading players" rows={6} />;
  }

  if (isError) {
    return <QueryError onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Player directory"
        title="Players"
        description="Search every tracked BGMI player by IGN, real name, or team."
      />

      <SearchInput
        value={query}
        onChange={(value) => {
          setQuery(value);
          const next = new URLSearchParams(searchParams);
          if (value) next.set("q", value);
          else next.delete("q");
          setSearchParams(next, { replace: true });
        }}
        placeholder="Search players, real names, teams"
        ariaLabel="Search players"
        className="max-w-xl"
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={UserCircle2}
          title="No players found"
          description={
            query
              ? `No player matches "${query}". Try a different IGN, real name, or team.`
              : "Player profiles will appear here once the roster data is published."
          }
          actionLabel={query ? "Clear search" : null}
          onAction={query ? () => setQuery("") : null}
        />
      ) : (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {filtered.length} player{filtered.length === 1 ? "" : "s"}
            {filtered.length > MAX_RESULTS
              ? ` · showing first ${MAX_RESULTS}`
              : ""}
          </p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((player) => (
              <li key={player.id}>
                <Link
                  to={`/players/${encodeURIComponent(player.displayIgn)}`}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors",
                    "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <PlayerAvatar ign={player.displayIgn} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-base font-semibold text-foreground">
                      {player.displayIgn}
                    </p>
                    {player.real_name ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {player.real_name}
                      </p>
                    ) : null}
                    {player.teamName ? (
                      <span className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <TeamLogo name={player.teamName} size="xs" />
                        <span className="truncate">{player.teamName}</span>
                      </span>
                    ) : null}
                  </div>
                  {player.role ? (
                    <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {player.role}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

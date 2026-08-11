import { ChevronDown, ChevronsUpDown, ChevronUp, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { buildTeamLink } from "@/features/leaderboard/utils/leaderboardHelpers";

export function MatchCell({ cell }) {
  if (!cell) {
    return <span className="text-muted-foreground/70">-</span>;
  }

  return (
    <div className="flex flex-col items-center justify-center leading-none">
      <div className="flex items-center gap-1">
        {cell.won ? <Trophy className="size-3.5 text-amber-500" /> : null}
        <span className="text-base font-black text-foreground">
          {cell.points}
        </span>
      </div>
      <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {cell.placement ? `P${cell.placement}` : "-"}
      </span>
    </div>
  );
}

export function LeaderboardTeamLink({ teamName, logoName, className = "block" }) {
  return (
    <Link to={buildTeamLink(logoName || teamName)} className={className}>
      <TeamIdentity
        name={logoName || teamName}
        className="font-semibold text-foreground"
        contained
        logoClassName="h-7 w-auto object-contain"
      />
    </Link>
  );
}

export function RankBadge({ rank }) {
  return (
    <span className="inline-flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-black text-emerald-600 dark:text-emerald-300">
      {rank}
    </span>
  );
}

export function MapAverageCell({ stats }) {
  if (!stats || !Number.isFinite(stats.elims) || !Number.isFinite(stats.placePoints)) {
    return <span>-</span>;
  }

  return (
    <span>{stats.elims.toFixed(2)}/{stats.placePoints.toFixed(2)}</span>
  );
}

export function SortableOverallHeader({ label, field, sortConfig, onSort, className = "" }) {
  const isActive = sortConfig?.field === field;
  const SortIcon = isActive
    ? sortConfig.direction === "asc"
      ? ChevronUp
      : ChevronDown
    : ChevronsUpDown;

  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex w-full items-center justify-center gap-1 rounded-md text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground"
      >
        <span>{label}</span>
        <SortIcon className={`size-3.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
      </button>
    </th>
  );
}

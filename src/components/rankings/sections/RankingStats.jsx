import React from "react";

export function RankingStats({ stats }) {
  if (!stats) return null;

  const formatTotal = (value) => {
    if (value >= 1000) return `${Math.round(value / 1000)}k`;
    return String(value);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-[24px] border border-border bg-card p-5">
        <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Ranked Teams</p>
        <p className="text-3xl font-black">{stats.rankedTeams}</p>
      </div>
      <div className="rounded-[24px] border border-border bg-card p-5">
        <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Ranked Players</p>
        <p className="text-3xl font-black">{stats.rankedPlayers}</p>
      </div>
      <div className="rounded-[24px] border border-border bg-card p-5">
        <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Avg Rating</p>
        <p className="text-3xl font-black text-primary">{stats.avgRating}</p>
      </div>
      <div className="rounded-[24px] border border-border bg-card p-5">
        <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Total Points</p>
        <p className="text-3xl font-black">{formatTotal(stats.totalPoints)}</p>
      </div>
    </div>
  );
}

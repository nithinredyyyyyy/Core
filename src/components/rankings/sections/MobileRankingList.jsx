import React from "react";
import { Medal } from "lucide-react";
import TeamIdentity from "@/components/shared/TeamIdentity";
import RankingMovement from "@/components/shared/RankingMovement";

export function MobileRankingList({ data, type }) {
  const isPlayer = type === "players";

  return (
    <div className="space-y-3 md:hidden">
      {data.map((row) => (
        <div
          key={row.id}
          className="rounded-2xl border border-border bg-card p-3 shadow-sm"
        >
          {type === "teams" ? (
            <>
              <div className="flex items-center gap-3">
                <span className="w-9 shrink-0 text-sm font-black text-foreground">
                  #{row.rank}
                </span>
                <TeamIdentity
                  name={row.teamName}
                  compact
                  className="truncate font-medium text-foreground"
                  containerClassName="min-w-0 flex-1"
                />
                <div className="shrink-0 text-right">
                  <p className="text-lg font-black leading-none text-primary">
                    {row.rating}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Points
                  </p>
                  <RankingMovement value={row.trend} className="mt-1 justify-end" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
                <span>
                  26 BGIS{" "}
                  <span className="font-bold text-foreground">{row.pts26BGIS || 0}</span>
                </span>
                <span>
                  26 BMPS{" "}
                  <span className="font-bold text-foreground">{row.pts26BMPS || 0}</span>
                </span>
              </div>
            </>
          ) : isPlayer ? (
            <>
              <div className="flex items-center gap-3">
                <span className="w-9 shrink-0 text-sm font-black text-foreground">
                  #{row.rank}
                </span>
                {row.photo ? (
                  <img
                    src={row.photo}
                    alt={row.playerName}
                    className="size-9 shrink-0 rounded-full object-cover ring-2 ring-border"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <TeamIdentity
                    name={row.teamName}
                    hideText
                    contained
                    compact
                    logoBlockClassName="size-9 shrink-0"
                    logoClassName="h-7 w-7 object-contain"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">
                    {row.playerName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{row.teamName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-black leading-none text-primary">
                    {row.rating}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {row.eliminations} finishes
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="w-9 shrink-0 text-sm font-black text-foreground">
                  #{row.rank}
                </span>
                <TeamIdentity
                  name={row.clubName}
                  compact
                  className="truncate font-bold text-foreground"
                  containerClassName="min-w-0 flex-1"
                />
                <div className="shrink-0 text-right">
                  <p className="text-lg font-black leading-none text-primary">
                    {row.ccPoints}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    ccPoints
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-amber-500">
                    <Medal className="mr-0.5 inline size-3" />
                    {row.goldMedals}
                  </span>
                  <span className="font-semibold text-slate-400">
                    <Medal className="mr-0.5 inline size-3" />
                    {row.silverMedals}
                  </span>
                  <span className="font-semibold text-orange-600">
                    <Medal className="mr-0.5 inline size-3" />
                    {row.bronzeMedals}
                  </span>
                </span>
                <span>
                  Place <span className="font-bold text-foreground">{row.place}</span>
                </span>
                <span>
                  Prize <span className="font-bold text-green-500">{row.prize}</span>
                </span>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

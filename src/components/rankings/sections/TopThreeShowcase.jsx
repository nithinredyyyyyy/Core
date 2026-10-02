import React from "react";
import { m } from "framer-motion";
import PlayerCard3D from "@/components/rankings/PlayerCard3D";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { LogoOrInitials } from "@/components/rankings/sections/LogoOrInitials";

export function TopThreeShowcase({ data, type }) {
  if (!data || data.length < 3) return null;
  const top3 = data.slice(0, 3);
  const podium = [top3[1], top3[0], top3[2]];

  if (type === "players") {
    return (
      <div className="mb-16 flex flex-col items-center gap-8 md:flex-row md:items-end md:justify-center md:gap-6">
        {podium.map((item, idx) => (
          <m.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.15, duration: 0.5 }}
            className={
              item.rank === 1
                ? "md:order-2 md:z-10 md:-translate-y-4 md:scale-[1.08]"
                : item.rank === 2
                  ? "md:order-1 md:translate-y-2"
                  : "md:order-3 md:translate-y-2"
            }
          >
            <PlayerCard3D player={item} rank={item.rank} isFirst={item.rank === 1} />
          </m.div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
      {podium.map((item, idx) => {
        const isFirst = item.rank === 1;
        const name =
          type === "players"
            ? item.playerName
            : type === "organizations"
              ? item.clubName
              : item.teamName;

        return (
          <m.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative flex flex-col items-center rounded-[32px] border p-6 text-center md:p-8 ${
              isFirst
                ? "z-10 border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-background shadow-xl md:scale-105"
                : "border-border bg-card"
            }`}
          >
            <div
              className="absolute -top-5 z-20 flex size-10 items-center justify-center rounded-full font-black text-white shadow-lg"
              style={{
                backgroundColor: isFirst ? "var(--brand-amber)" : item.rank === 2 ? "var(--brand-slate-400)" : "var(--brand-amber-deep)",
              }}
            >
              #{item.rank}
            </div>

            <div className="mb-6 mt-6 flex items-center justify-center">
              {type === "teams" || type === "organizations" ? (
                <div className={isFirst ? "scale-[1.3] md:scale-[1.5]" : "scale-110"}>
                  <LogoOrInitials name={name} />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  {item.photo ? (
                    <div className={isFirst ? "scale-[1.3] md:scale-[1.5]" : "scale-110"}>
                      <img
                        src={item.photo}
                        alt={item.playerName}
                        className="size-16 rounded-xl object-cover ring-2 ring-border shadow-md"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    </div>
                  ) : (
                    <TeamIdentity
                      name={item.teamName}
                      hideText
                      contained
                      logoBlockClassName="size-16 rounded-xl"
                      logoClassName="h-12 w-12 object-contain"
                    />
                  )}
                  <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-bold text-muted-foreground">
                    {item.teamName}
                  </span>
                </div>
              )}
            </div>

            <h3 className="relative z-20 mt-4 text-xl font-black text-foreground">{name}</h3>
            {type === "players" ? (
              <p className="mt-1 text-xs text-muted-foreground">{item.teamName}</p>
            ) : null}

            <div className="mt-6 flex w-full items-center justify-between rounded-xl border border-border/50 bg-background/50 p-4">
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {type === "organizations" ? "ccPoints" : "Rating"}
                </p>
                <p className="text-xl font-black text-primary">
                  {type === "organizations" ? item.ccPoints : item.rating}
                </p>
              </div>
              <div className="text-right">
                {type === "organizations" && (
                  <>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Prize</p>
                    <span className="text-lg font-black text-green-500">{item.prize}</span>
                  </>
                )}
              </div>
            </div>
          </m.div>
        );
      })}
    </div>
  );
}

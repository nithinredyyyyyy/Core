import React from "react";
import { Heart } from "lucide-react";
import FansPanel from "./FansPanel";

const EMPTY_ITEMS = [];

export default function TeamSupportMeter({
  supportOptions = EMPTY_ITEMS,
  favoriteTeam,
  onSelectFavorite,
  supportBoard = EMPTY_ITEMS,
}) {
  return (
    <FansPanel className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3.5">
        <Heart className="size-3.5 text-rose-400" />
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
          Team support meter
        </p>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Your team
          </p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            Choose the team you want your fan identity to back across the live
            support board.
          </p>
          <select
            value={favoriteTeam}
            onChange={(event) => onSelectFavorite(event.target.value)}
            className="mt-2.5 h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-700 outline-none transition-colors focus:border-primary/40"
          >
            <option value="">Choose your team…</option>
            {supportOptions.map((team) => (
              <option key={team.id} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Fan support ranking
          </p>
          <div className="mt-2.5 max-h-[240px] space-y-2.5 overflow-y-auto pr-1">
            {supportBoard.slice(0, 8).map((entry) => (
              <div
                key={entry.team.id}
                className={`rounded-[14px] p-3 ${favoriteTeam === entry.team.name ? "border border-primary/20 bg-primary/10" : "border border-transparent bg-transparent"}`}
              >
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <p className="font-black uppercase text-slate-900">
                    {entry.team.name}
                    {favoriteTeam === entry.team.name ? (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] tracking-[0.14em] text-primary">
                        Your pick
                      </span>
                    ) : null}
                  </p>
                  <p className="text-slate-500">
                    {entry.supporters} fans • {entry.percent}%
                  </p>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${entry.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FansPanel>
  );
}

import React from "react";
import { Heart } from "lucide-react";
import FansPanel from "./FansPanel";

export default function TeamSupportMeter({
  supportOptions = [],
  favoriteTeam,
  onSelectFavorite,
  supportBoard = [],
}) {
  return (
    <FansPanel className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#d9e1ef] px-4 py-3.5">
        <Heart className="h-3.5 w-3.5 text-rose-400" />
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7b8dab]">Team support meter</p>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b8dab]">Your team</p>
          <select
            value={favoriteTeam}
            onChange={(event) => onSelectFavorite(event.target.value)}
            className="mt-2.5 h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-500 outline-none transition-colors focus:border-primary/40"
          >
            <option value="">Choose your team...</option>
            {supportOptions.map((team) => (
              <option key={team.id} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b8dab]">Fan support ranking</p>
          <div className="mt-2.5 max-h-[240px] space-y-2.5 overflow-y-auto pr-1">
            {supportBoard.slice(0, 8).map((entry) => (
              <div key={entry.team.id}>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <p className="font-black uppercase text-slate-900">{entry.team.name}</p>
                  <p className="text-slate-500">{entry.supporters} fans • {entry.percent}%</p>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-violet-400" style={{ width: `${entry.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FansPanel>
  );
}

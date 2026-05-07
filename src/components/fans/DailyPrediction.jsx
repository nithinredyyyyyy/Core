import React from "react";
import { format } from "date-fns";
import { Clock3, Crosshair, Crown, Target, Trophy } from "lucide-react";
import FansPanel from "./FansPanel";

export default function DailyPrediction({
  isPredictionLocked,
  featuredTournament,
  predictionOptions = [],
  predictionWinner,
  setPredictionWinner,
  predictionTopFragger,
  setPredictionTopFragger,
  predictionTopThree = [],
  toggleTopThree,
  onSubmit,
  isSubmitting,
}) {
  return (
    <FansPanel className="overflow-hidden">
      <div className="border-b border-[#d9e1ef] px-5 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7b8dab]">Daily prediction</p>
            <p className="mt-0.5 text-sm text-[#7b8dab]">
              {featuredTournament?.start_date ? format(new Date(featuredTournament.start_date), "EEEE, MMM d") : "Today"}
            </p>
          </div>
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${isPredictionLocked ? "border-red-200 bg-red-50 text-red-500" : "border-emerald-200 bg-emerald-50 text-emerald-600"}`}>
            <Clock3 className="h-3 w-3" />
            {isPredictionLocked ? "Locked" : "Open"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-[#d9e1ef] px-5 py-3 text-[12px] font-semibold text-[#7b8dab]">
        <span className="inline-flex items-center gap-2"><Trophy className="h-3.5 w-3.5 text-amber-500" /> Winner = <strong className="text-slate-900">+10 pts</strong></span>
        <span className="inline-flex items-center gap-2"><Target className="h-3.5 w-3.5 text-rose-400" /> Top Fragger = <strong className="text-slate-900">+8 pts</strong></span>
        <span className="inline-flex items-center gap-2"><Crown className="h-3.5 w-3.5 text-indigo-500" /> Top 3 each = <strong className="text-slate-900">+4 pts</strong></span>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b8dab]">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            Predict winner
          </p>
          <select
            disabled={isPredictionLocked}
            value={predictionWinner}
            onChange={(event) => setPredictionWinner(event.target.value)}
            className="mt-2.5 h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-500 outline-none transition-colors focus:border-primary/40"
          >
            <option value="">Select a team...</option>
            {predictionOptions.map((team) => (
              <option key={team.id} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b8dab]">
            <Crosshair className="h-3.5 w-3.5 text-rose-400" />
            Top fragger (player IGN)
          </p>
          <input
            disabled={isPredictionLocked}
            value={predictionTopFragger}
            onChange={(event) => setPredictionTopFragger(event.target.value)}
            placeholder="Enter player IGN..."
            className="mt-2.5 h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-500 outline-none transition-colors placeholder:text-slate-300 focus:border-primary/40"
          />
        </div>

        <div>
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b8dab]">
            <Crown className="h-3.5 w-3.5 text-indigo-500" />
            Top 3 teams ({predictionTopThree.length}/3 selected)
          </p>
          <div className="mt-2.5 max-h-[228px] overflow-y-auto pr-1">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {predictionOptions.map((team) => {
                const active = predictionTopThree.includes(team.name);
                return (
                  <button
                    key={team.id}
                    type="button"
                    disabled={isPredictionLocked}
                    onClick={() => toggleTopThree(team.name)}
                    className={`rounded-[12px] border px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.04em] transition-all ${
                      active ? "border-primary bg-primary/10 text-primary" : "border-slate-200 bg-white text-slate-300 hover:border-primary/30"
                    } ${isPredictionLocked ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    {team.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPredictionLocked || !predictionWinner || predictionTopThree.length !== 3 || isSubmitting}
            className="rounded-full bg-primary px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-[0_14px_28px_rgba(251,146,60,0.22)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit prediction"}
          </button>
        </div>
      </div>
    </FansPanel>
  );
}

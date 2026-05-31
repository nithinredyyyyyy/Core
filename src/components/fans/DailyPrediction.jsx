import React from "react";
import { format } from "date-fns";
import { Clock3, Crosshair, Crown, Target, Trophy } from "lucide-react";
import FansPanel from "./FansPanel";

const EMPTY_PREDICTION_OPTIONS = [];
const EMPTY_TOP_THREE = [];

export default function DailyPrediction({
  isPredictionLocked,
  featuredTournament,
  predictionContext,
  predictionOptions = EMPTY_PREDICTION_OPTIONS,
  predictionWinner,
  setPredictionWinner,
  predictionTopFragger,
  setPredictionTopFragger,
  predictionTopThree = EMPTY_TOP_THREE,
  toggleTopThree,
  onSubmit,
  isSubmitting,
}) {
  const winnerSelected = predictionOptions.find(
    (team) => team.name === predictionWinner,
  );

  return (
    <FansPanel className="overflow-hidden">
      <div className="border-b border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0.08))] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="type-kicker text-primary">
              Prediction board
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              <span suppressHydrationWarning>
                {predictionContext?.scheduled
                  ? format(predictionContext.scheduled, "EEEE, MMM d")
                  : featuredTournament?.start_date
                    ? format(
                        new Date(featuredTournament.start_date),
                        "EEEE, MMM d",
                      )
                    : "Today"}
              </span>
            </p>
            {predictionContext ? (
              <p className="type-kicker mt-1 text-slate-500">
                {predictionContext.stage} | {predictionContext.group}
                {predictionContext.matchNumber
                  ? ` | M${predictionContext.matchNumber}`
                  : ""}
                {predictionContext.day ? ` | Day ${predictionContext.day}` : ""}
                {predictionContext.map ? ` | ${predictionContext.map}` : ""}
              </p>
            ) : null}
            {predictionContext?.slateMatches ||
            predictionContext?.activeTeamCount ? (
              <p className="type-caption mt-1 text-slate-500">
                {predictionContext?.slateMatches
                  ? `${predictionContext.slateMatches} upcoming match${predictionContext.slateMatches === 1 ? "" : "es"}`
                  : "Upcoming slate"}
                {predictionContext?.activeTeamCount
                  ? ` | ${predictionContext.activeTeamCount} teams playing`
                  : ""}
              </p>
            ) : null}
            <p className="type-body-sm mt-3 max-w-[44ch] text-slate-500">
              Build one winner call, one fragger call, and a three-team podium
              before the lock hits.
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${isPredictionLocked ? "border-red-200 bg-red-50 text-red-500" : "border-emerald-200 bg-emerald-50 text-emerald-600"}`}
          >
            <Clock3 className="size-3" />
            {isPredictionLocked
              ? predictionContext?.status === "live"
                ? "Live"
                : "Locked"
              : "Open"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-border/70 px-5 py-3 text-[12px] font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Trophy className="size-3.5 text-amber-500" /> Winner ={" "}
          <strong className="text-slate-900">+10 pts</strong>
        </span>
        <span className="inline-flex items-center gap-2">
          <Target className="size-3.5 text-rose-400" /> Top Fragger ={" "}
          <strong className="text-slate-900">+8 pts</strong>
        </span>
        <span className="inline-flex items-center gap-2">
          <Crown className="size-3.5 text-indigo-500" /> Top 3 each ={" "}
          <strong className="text-slate-900">+4 pts</strong>
        </span>
      </div>

      <div className="space-y-5 p-5">
        <div className="rounded-[18px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.58),rgba(255,255,255,0.18))] px-4 py-3 dark:bg-white/[0.05]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              {predictionOptions.length} teams in pool
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${predictionTopThree.length === 3 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
            >
              Top 3: {predictionTopThree.length}/3
            </span>
            {winnerSelected ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                Winner locked: {winnerSelected.name}
              </span>
            ) : null}
          </div>
        </div>

        <div>
          <p className="type-kicker inline-flex items-center gap-2 text-muted-foreground">
            <Trophy className="size-3.5 text-amber-500" />
            Predict winner
          </p>
          <select
            disabled={isPredictionLocked}
            value={predictionWinner}
            onChange={(event) => setPredictionWinner(event.target.value)}
            aria-label="Predict winner"
            className="mt-2.5 h-12 w-full rounded-[16px] border border-slate-200 bg-white px-4 text-[15px] text-slate-700 outline-none transition-colors focus:border-primary/40"
          >
            <option value="">Select a team…</option>
            {predictionOptions.map((team) => (
              <option key={team.id} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="type-kicker inline-flex items-center gap-2 text-muted-foreground">
            <Crosshair className="size-3.5 text-rose-400" />
            Top fragger (player IGN)
          </p>
          <input
            disabled={isPredictionLocked}
            value={predictionTopFragger}
            onChange={(event) => setPredictionTopFragger(event.target.value)}
            placeholder="Enter player IGN…"
            aria-label="Top fragger player IGN"
            className="mt-2.5 h-12 w-full rounded-[16px] border border-slate-200 bg-white px-4 text-[15px] text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-primary/40"
          />
        </div>

        <div>
          <p className="type-kicker inline-flex items-center gap-2 text-muted-foreground">
            <Crown className="size-3.5 text-indigo-500" />
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
                    className={`rounded-[14px] border px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] transition-all ${
                      active
                        ? "border-primary bg-primary/10 text-primary shadow-[0_8px_18px_rgba(251,146,60,0.12)]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-primary/30"
                    } ${isPredictionLocked ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    {team.name}
                  </button>
                );
              })}
            </div>
          </div>
          {predictionTopThree.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {predictionTopThree.map((teamName) => (
                <span
                  key={teamName}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-indigo-600"
                >
                  {teamName}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="type-caption max-w-[38ch] text-slate-500">
            {isPredictionLocked
              ? "This slate is locked. Your next chance opens with the next active match window."
              : "Strong picks come from locking a winner first, then narrowing the top-three field."}
          </p>
          <button
            type="button"
            onClick={onSubmit}
            disabled={
              isPredictionLocked ||
              !predictionWinner ||
              predictionTopThree.length !== 3 ||
              isSubmitting
            }
            className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-foreground shadow-[0_14px_28px_rgba(251,146,60,0.22)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting…" : "Submit prediction"}
          </button>
        </div>
      </div>
    </FansPanel>
  );
}

import React from "react";
import { format } from "date-fns";
import { CheckCircle2, Clock3, History, XCircle } from "lucide-react";
import FansPanel from "./FansPanel";

function formatPredictionDate(value) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? format(parsed, "MMM d, yyyy") : "Date pending";
}

function PredictionStatusIcon({ status, points }) {
  if (status === "settled" && Number(points || 0) > 0) {
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  }
  if (status === "settled") {
    return <XCircle className="h-3.5 w-3.5 text-rose-400" />;
  }
  return <Clock3 className="h-3.5 w-3.5 text-amber-500" />;
}

export default function FanPredictionHistory({ predictions = [] }) {
  return (
    <FansPanel className="overflow-hidden">
      <div className="border-b border-[#d9e1ef] px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-violet-500" />
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7b8dab]">Prediction history</p>
        </div>
      </div>

      {predictions.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-slate-400">Your saved predictions will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#eef2f8]">
          {predictions.map((prediction) => (
            <div key={prediction.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{prediction.tournament_name || "Tournament prediction"}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                    {formatPredictionDate(prediction.prediction_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                  <PredictionStatusIcon status={prediction.status} points={prediction.awarded_points} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {prediction.status === "settled" ? `${prediction.awarded_points || 0} pts` : "Pending"}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-[12px] text-slate-500">
                <p>
                  Winner: <span className="font-semibold text-slate-800">{prediction.winner_team || "Not selected"}</span>
                </p>
                <p>
                  Fragger: <span className="font-semibold text-slate-800">{prediction.top_fragger || "Not selected"}</span>
                </p>
                <p>
                  Top 3:{" "}
                  <span className="font-semibold text-slate-800">
                    {Array.isArray(prediction.top_three) && prediction.top_three.length > 0
                      ? prediction.top_three.join(", ")
                      : "Not selected"}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </FansPanel>
  );
}

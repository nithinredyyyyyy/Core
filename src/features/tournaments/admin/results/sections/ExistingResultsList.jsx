import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMatchResultPublicationStatus } from "@/lib/matchResultPublication";

export function ExistingResultsList({ matchResults, teamsMap, onEdit, isMutating, onDelete }) {
  return (
    <div className="space-y-1">
      {matchResults.map((result) => (
        <div key={result.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="font-bold w-6 text-center">#{result.placement}</span>
            <span>{teamsMap[result.team_id]?.name || "Unknown"}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${
              getMatchResultPublicationStatus(result) === "published"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}>
              {getMatchResultPublicationStatus(result)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">{result.kill_points} kills</span>
            <span className="text-xs text-muted-foreground">{result.placement_points} place</span>
            <span className="font-bold text-primary">{result.total_points} pts</span>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(result)} disabled={isMutating}><Pencil className="w-3 h-3" /></Button>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(result.id)} disabled={isMutating}><Trash2 className="w-3 h-3 text-destructive" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
}

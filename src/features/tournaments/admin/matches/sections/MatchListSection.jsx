import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function MatchListSection({
  matches,
  tournamentMap,
  updateStatus,
  isScheduleMutating,
  openEdit,
  isFormMutating,
  deleteMatch,
}) {
  return (
    <div className="space-y-2">
      {matches.map((match) => (
        <div
          key={match.id}
          className="bg-card border border-border rounded-lg p-3 flex items-center justify-between"
        >
          <div>
            <span className="text-sm font-medium">
              Match #{match.match_number || "-"} - {match.stage}
              {match.group_name ? ` (${match.group_name})` : ""}
            </span>
            <p className="text-xs text-muted-foreground">
              {tournamentMap[match.tournament_id]?.name || "Unknown"}
              {match.map ? ` - ${match.map}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={match.status}
              onValueChange={(value) => updateStatus.mutate({ id: match.id, status: value })}
              disabled={isScheduleMutating}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => openEdit(match)}
              disabled={isFormMutating || isScheduleMutating}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => { if (window.confirm("Delete this match?")) deleteMatch.mutate(match.id); }}
              disabled={isFormMutating || isScheduleMutating}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

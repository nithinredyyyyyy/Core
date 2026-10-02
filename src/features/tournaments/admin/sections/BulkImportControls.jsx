import React from "react";
import { ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BulkImportControls({
  dispatch,
  importMutation,
  isMutating,
  mode,
  previewRows,
  rankingTitle,
  selectedTournament,
  stageName,
  stageOptions,
  tournamentId,
  tournaments,
}) {
  return (
    <>
      <div>
        <Label>Tournament</Label>
        <Select
          value={tournamentId || selectedTournament?.id || ""}
          onValueChange={(value) =>
            dispatch({ type: "setField", field: "tournamentId", value })
          }
          disabled={isMutating || importMutation.isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select tournament" />
          </SelectTrigger>
          <SelectContent>
            {tournaments.map((tournament) => (
              <SelectItem key={tournament.id} value={tournament.id}>
                {tournament.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Import type</Label>
        <Select
          value={mode}
          onValueChange={(nextMode) => dispatch({ type: "setMode", mode: nextMode })}
          disabled={isMutating || importMutation.isPending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standings">Stage standings</SelectItem>
            <SelectItem value="rankings">MVP / IGL / rankings</SelectItem>
            <SelectItem value="participants">Stage participants</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === "standings" ? (
        <div>
          <Label>Stage</Label>
          <Input
            value={stageName}
            onChange={(event) =>
              dispatch({
                type: "setField",
                field: "stageName",
                value: event.target.value,
              })
            }
            placeholder="Round 4"
            disabled={isMutating || importMutation.isPending}
          />
          {stageOptions.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {stageOptions.map((stage) => (
                <button
                  key={stage.name}
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: "setField",
                      field: "stageName",
                      value: stage.name,
                    })
                  }
                  className="rounded-full border border-border bg-background px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  {stage.name}
                </button>
              ))}
            </div>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            Existing stage standings are replaced with the pasted rows.
          </p>
        </div>
      ) : null}

      {mode === "rankings" ? (
        <div>
          <Label>Ranking title</Label>
          <Input
            value={rankingTitle}
            onChange={(event) =>
              dispatch({
                type: "setField",
                field: "rankingTitle",
                value: event.target.value,
              })
            }
            placeholder="MVP, IGL, Eliminator"
            disabled={isMutating || importMutation.isPending}
          />
        </div>
      ) : null}

      <Button
        type="button"
        onClick={() => importMutation.mutate()}
        disabled={!selectedTournament || previewRows.length === 0 || isMutating || importMutation.isPending}
        className="w-full gap-2"
      >
        <ClipboardPaste className="size-4" />
        {importMutation.isPending ? "Importing..." : "Import table"}
      </Button>
    </>
  );
}

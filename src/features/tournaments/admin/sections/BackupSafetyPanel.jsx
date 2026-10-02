import React from "react";
import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { downloadTournamentBackup } from "@/features/tournaments/admin/utils/tournamentEditorHelpers";

export function BackupSafetyPanel({
  dispatch,
  importMutation,
  isMutating,
  restoreMutation,
  restoreText,
  selectedTournament,
}) {
  return (
    <div className="rounded-xl border border-border bg-background/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Backup safety
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadTournamentBackup(selectedTournament)}
          disabled={!selectedTournament || isMutating || importMutation.isPending || restoreMutation.isPending}
          className="gap-2"
        >
          <Download className="size-4" />
          Export JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => restoreMutation.mutate()}
          disabled={!selectedTournament || !restoreText.trim() || isMutating || restoreMutation.isPending}
          className="gap-2"
        >
          <RotateCcw className="size-4" />
          {restoreMutation.isPending ? "Restoring..." : "Restore"}
        </Button>
      </div>
      <Textarea
        value={restoreText}
        onChange={(event) =>
          dispatch({
            type: "setField",
            field: "restoreText",
            value: event.target.value,
          })
        }
        placeholder="Paste exported tournament backup JSON here to restore it."
        aria-label="Paste tournament backup JSON"
        className="mt-3 min-h-[120px] font-mono text-xs"
        disabled={isMutating || restoreMutation.isPending}
      />
    </div>
  );
}

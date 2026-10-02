import React from "react";
import { ExistingResultsList } from "@/features/tournaments/admin/results/sections/ExistingResultsList";
import { EditResultForm } from "@/features/tournaments/admin/results/sections/EditResultForm";

export function ExistingResultsPanel({ matchResults, teamsMap, isMutating, editingResult, resultForm, onEditResult, onDeleteResult, onResultFormChange, onCloseEdit, updateResult, onUpdateResult }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Existing Results</h3>
      </div>

      <ExistingResultsList
        matchResults={matchResults}
        teamsMap={teamsMap}
        onEdit={onEditResult}
        isMutating={isMutating}
        onDelete={onDeleteResult}
      />

      {editingResult ? (
        <EditResultForm
          resultForm={resultForm}
          onResultFormChange={onResultFormChange}
          onClose={onCloseEdit}
          updateResult={updateResult}
          onUpdateResult={onUpdateResult}
        />
      ) : null}

      {!editingResult ? (
        <p className="text-xs text-muted-foreground">
          Existing results already exist for this match. Use the pencil icons above to revise each team row instead of creating duplicate results.
        </p>
      ) : null}
    </div>
  );
}

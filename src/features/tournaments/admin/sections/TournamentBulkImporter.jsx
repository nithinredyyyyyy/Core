import React, { useReducer } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { bulkImportReducer, BULK_IMPORT_INITIAL_STATE, parseStandingRows, parseParticipantRows, parseRankingTable, findStageIndex, normalizeImportKey, getTournamentBackupPayload } from "@/features/tournaments/admin/utils/tournamentEditorHelpers";
import { BulkImporterHeader } from "@/features/tournaments/admin/sections/BulkImporterHeader";
import { BulkImportControls } from "@/features/tournaments/admin/sections/BulkImportControls";
import { BackupSafetyPanel } from "@/features/tournaments/admin/sections/BackupSafetyPanel";
import { BulkPastePanel } from "@/features/tournaments/admin/sections/BulkPastePanel";

function TournamentBulkImporter({ tournaments, isMutating }) {
  const [state, dispatch] = useReducer(
    bulkImportReducer,
    BULK_IMPORT_INITIAL_STATE,
  );
  const { mode, tournamentId, stageName, rankingTitle, pasteText, restoreText } = state;
  const qc = useQueryClient();
  const { toast } = useToast();

  const selectedTournament =
    tournaments.find((tournament) => tournament.id === tournamentId) ||
    tournaments.find((tournament) => tournament.status === "ongoing") ||
    tournaments[0] ||
    null;
  const stageOptions = selectedTournament?.stages || [];

  const previewRows =
    mode === "standings"
      ? parseStandingRows(pasteText)
      : mode === "participants"
      ? parseParticipantRows(pasteText)
      : parseRankingTable(pasteText, rankingTitle)?.entries || [];

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTournament) throw new Error("Select a tournament first.");
      if (mode === "standings") {
        const standings = parseStandingRows(pasteText);
        if (!stageName.trim()) throw new Error("Select or enter a stage name.");
        if (standings.length === 0) throw new Error("No standings rows found.");
        const stages = [...(selectedTournament.stages || [])];
        let stageIndex = findStageIndex(stages, stageName);
        if (stageIndex === -1) {
          stages.push({
            name: stageName.trim(),
            order: stages.length + 1,
            status: "ongoing",
            teamCount: standings.length,
            summary: "",
            standings,
          });
          stageIndex = stages.length - 1;
        } else {
          stages[stageIndex] = {
            ...stages[stageIndex],
            teamCount: stages[stageIndex].teamCount || standings.length,
            standings,
          };
        }
        return base44.entities.Tournament.update(selectedTournament.id, { stages });
      }

      if (mode === "rankings") {
        const ranking = parseRankingTable(pasteText, rankingTitle);
        if (!ranking) throw new Error("No ranking rows found.");
        const rankings = [...(selectedTournament.rankings || [])];
        const rankingIndex = rankings.findIndex(
          (entry) => normalizeImportKey(entry.title) === normalizeImportKey(ranking.title),
        );
        if (rankingIndex >= 0) {
          rankings[rankingIndex] = ranking;
        } else {
          rankings.push(ranking);
        }
        return base44.entities.Tournament.update(selectedTournament.id, { rankings });
      }

      const participants = parseParticipantRows(pasteText);
      if (participants.length === 0) throw new Error("No participant rows found.");
      return base44.entities.Tournament.update(selectedTournament.id, {
        participants,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      qc.invalidateQueries({ queryKey: ["home-view"] });
      qc.invalidateQueries({ queryKey: ["home-summary"] });
      toast({
        title: "Bulk import complete",
        description: `${previewRows.length} row${previewRows.length === 1 ? "" : "s"} saved to ${selectedTournament?.name || "tournament"}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Bulk import failed",
        description: error?.message || "Check the pasted table and try again.",
        variant: "destructive",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTournament) throw new Error("Select a tournament first.");
      let parsed = null;
      try {
        parsed = JSON.parse(restoreText);
      } catch {
        throw new Error("Backup JSON is invalid.");
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Backup must be one tournament JSON object.");
      }
      return base44.entities.Tournament.update(
        selectedTournament.id,
        getTournamentBackupPayload(parsed),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      qc.invalidateQueries({ queryKey: ["home-view"] });
      qc.invalidateQueries({ queryKey: ["home-summary"] });
      dispatch({ type: "setField", field: "restoreText", value: "" });
      toast({
        title: "Tournament restored",
        description: `${selectedTournament?.name || "Tournament"} was restored from backup JSON.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Restore failed",
        description: error?.message || "Check the pasted backup JSON.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <BulkImporterHeader previewCount={previewRows.length} />

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <BulkImportControls
            dispatch={dispatch}
            importMutation={importMutation}
            isMutating={isMutating}
            mode={mode}
            previewRows={previewRows}
            rankingTitle={rankingTitle}
            selectedTournament={selectedTournament}
            stageName={stageName}
            stageOptions={stageOptions}
            tournamentId={tournamentId}
            tournaments={tournaments}
          />
          <BackupSafetyPanel
            dispatch={dispatch}
            importMutation={importMutation}
            isMutating={isMutating}
            restoreMutation={restoreMutation}
            restoreText={restoreText}
            selectedTournament={selectedTournament}
          />
        </div>

        <BulkPastePanel
          dispatch={dispatch}
          importMutation={importMutation}
          isMutating={isMutating}
          pasteText={pasteText}
        />
      </div>
    </div>
  );
}

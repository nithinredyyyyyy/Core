import React from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScorecardSection } from "@/features/tournaments/admin/results/sections/ScorecardSection";
import { ResultEntryTable } from "@/features/tournaments/admin/results/sections/ResultEntryTable";

export function EnterResultsPanel({ selectedMatchData, getMatchTeams, tournamentMap, scorecardTotals, entryScorecard, entries, onEntryChange, onSave, isSaving }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center gap-3">
        <div>
          <h3 className="text-sm font-semibold">Enter Results</h3>
          <p className="text-[10px] text-muted-foreground mt-1">Kill = 1pt | 1st=10, 2nd=6, 3rd=5, 4th=4, 5th=3, 6th=2, 7th-8th=1</p>
        </div>
      </div>
      <div className="px-4 py-2 text-xs text-muted-foreground">
        {selectedMatchData ? `Result entry scope: ${getMatchTeams(selectedMatchData).length} teams from ${tournamentMap[selectedMatchData.tournament_id]?.name || "selected tournament"}${selectedMatchData.stage ? ` - ${selectedMatchData.stage}` : ""}${selectedMatchData.group_name ? ` (${selectedMatchData.group_name})` : ""}` : null}
      </div>
      <div className="px-4 pb-2 text-[11px] text-muted-foreground">
        Save drafts while building the scorecard, then publish when the full match sheet is ready for the live standings board.
      </div>
      <ScorecardSection
        scorecardTotals={scorecardTotals}
        entryScorecard={entryScorecard}
      />
      <ResultEntryTable
        entries={entries}
        onEntryChange={onEntryChange}
      />
      <div className="p-4 border-t border-border flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => onSave("draft")} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" /> Save Draft
        </Button>
        <Button type="button" onClick={() => onSave("published")} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" /> Publish Results
        </Button>
      </div>
    </div>
  );
}

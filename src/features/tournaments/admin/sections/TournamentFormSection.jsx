import React from "react";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TournamentBasicsFields } from "@/features/tournaments/admin/sections/TournamentBasicsFields";
import { TournamentStructuredFields } from "@/features/tournaments/admin/sections/TournamentStructuredFields";
import { TournamentStagesEditor } from "@/features/tournaments/admin/sections/TournamentStagesEditor";

export function TournamentFormSection({
  showForm,
  editing,
  form,
  teams,
  isMutating,
  setForm,
  attemptCloseForm,
  addParticipant,
  updateParticipant,
  removeParticipant,
  addStage,
  updateStage,
  removeStage,
  handleSubmit,
}) {
  if (!showForm) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{editing ? "Edit" : "Create"} Tournament</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={attemptCloseForm}
          disabled={isMutating}
        >
          <X className="size-4" />
        </Button>
      </div>
      <TournamentBasicsFields form={form} setForm={setForm} />
      <TournamentStructuredFields
        form={form}
        setForm={setForm}
        teams={teams}
        isMutating={isMutating}
        addParticipant={addParticipant}
        updateParticipant={updateParticipant}
        removeParticipant={removeParticipant}
      />
      <div>
        <Label>Rankings JSON</Label>
        <Textarea
          value={form.rankingsText || "[]"}
          onChange={(e) => setForm((prev) => ({ ...prev, rankingsText: e.target.value }))}
          className="min-h-[180px] font-mono text-xs"
          placeholder='[{"title":"MVP","entries":[{"placement":1,"player":"Player","team":"Team","rating":"1.50","finishes":70,"damage":15000,"avgSurvival":"20:30","knocks":60}]}]'
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Use JSON for advanced ranking tables like MVP, FMVP, and Best IGL.
        </p>
      </div>
      <TournamentStagesEditor
        form={form}
        isMutating={isMutating}
        addStage={addStage}
        updateStage={updateStage}
        removeStage={removeStage}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={attemptCloseForm} disabled={isMutating}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isMutating}>
          <Save className="size-4 mr-2" /> {editing ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

import React from "react";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAPS } from "@/features/tournaments/admin/matches/utils/matchEditorHelpers";

export function MatchFormSection({
  showForm,
  editing,
  form,
  setForm,
  attemptCloseForm,
  isFormMutating,
  availableTournaments,
  stages,
  showGroupField,
  stageGroupOptions,
  handleSubmit,
  submitPending,
}) {
  if (!showForm) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex justify-between">
        <h3 className="font-semibold">{editing ? "Edit" : "Create"} Match</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={attemptCloseForm}
          disabled={isFormMutating}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label>Tournament *</Label>
          <Select
            value={form.tournament_id || ""}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, tournament_id: value, stage: "", group_name: "" }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {availableTournaments.map((tournament) => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Stage *</Label>
          <Select
            value={form.stage || ""}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, stage: value, group_name: "" }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {stages.length > 0 ? (
                stages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="default">Default</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        {showGroupField ? (
          <div>
            <Label>Group *</Label>
            <Select
              value={form.group_name || ""}
              onValueChange={(value) => setForm((prev) => ({ ...prev, group_name: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {stageGroupOptions.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div>
          <Label>Match #</Label>
          <Input
            type="number"
            value={form.match_number ?? ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, match_number: e.target.value === "" ? "" : Number(e.target.value) }))
            }
          />
        </div>
        <div>
          <Label>Map</Label>
          <Select
            value={form.map || ""}
            onValueChange={(value) => setForm((prev) => ({ ...prev, map: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Map" />
            </SelectTrigger>
            <SelectContent>
              {MAPS.map((map) => (
                <SelectItem key={map} value={map}>
                  {map}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Scheduled Time</Label>
          <Input
            type="datetime-local"
            value={form.scheduled_time || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, scheduled_time: e.target.value }))}
          />
        </div>
        <div>
          <Label>Day #</Label>
          <Input
            type="number"
            value={form.day ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, day: e.target.value === "" ? "" : Number(e.target.value) }))}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={form.status || "scheduled"}
            onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 lg:col-span-2">
          <Label>Stream URL</Label>
          <Input
            value={form.stream_url || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, stream_url: e.target.value }))}
            placeholder="https://youtube.com/live/..."
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={attemptCloseForm} disabled={isFormMutating}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={submitPending}>
          <Save className="size-4 mr-2" /> {editing ? "Update" : "Create"}
        </Button>
      </div>
    </div>
  );
}

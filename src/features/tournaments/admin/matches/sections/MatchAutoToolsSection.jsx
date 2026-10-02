import React from "react";
import { Sparkles, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildMatchKey, formatAdminMatchDateTime } from "@/features/tournaments/admin/matches/utils/matchEditorHelpers";

export function MatchAutoToolsSection({
  autoForm,
  setAutoForm,
  availableTournaments,
  autoStages,
  autoStageGroupOptions,
  inferredRotationGroup,
  autoSchedulePreview,
  previewWithStatus,
  createMatchesBulk,
  handleGenerateSchedule,
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="size-4 text-primary" />
            <h3 className="font-semibold">Auto tools</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate a full stage/day schedule from stored rotation data or a custom map list.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          <CalendarRange className="size-3.5" />
          Preview before create
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div>
          <Label>Tournament</Label>
          <Select
            value={autoForm.tournament_id || ""}
            onValueChange={(value) =>
              setAutoForm((prev) => ({ ...prev, tournament_id: value, stage: "", group_name: "" }))
            }
          >
            <SelectTrigger><SelectValue placeholder="Select tournament" /></SelectTrigger>
            <SelectContent>
              {availableTournaments.map((tournament) => (
                <SelectItem key={tournament.id} value={tournament.id}>{tournament.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Stage</Label>
          <Select
            value={autoForm.stage || ""}
            onValueChange={(value) =>
              setAutoForm((prev) => ({ ...prev, stage: value, group_name: "" }))
            }
          >
            <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
            <SelectContent>
              {autoStages.map((stage) => (
                <SelectItem key={stage} value={stage}>{stage}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Source</Label>
          <Select
            value={autoForm.source}
            onValueChange={(value) =>
              setAutoForm((prev) => ({
                ...prev,
                source: value,
                group_name: value === "rotation" ? "" : prev.group_name,
              }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rotation">Stage rotation</SelectItem>
              <SelectItem value="custom">Custom map list</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Day #</Label>
          <Input type="number" min="1" value={autoForm.day} onChange={(e) => setAutoForm((prev) => ({ ...prev, day: e.target.value }))} />
        </div>
        <div>
          <Label>Group</Label>
          <Select
            value={autoForm.group_name || "__auto__"}
            onValueChange={(value) =>
              setAutoForm((prev) => ({ ...prev, group_name: value === "__auto__" ? "" : value }))
            }
          >
            <SelectTrigger><SelectValue placeholder={inferredRotationGroup || "Auto / none"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__auto__">{inferredRotationGroup || "Auto / none"}</SelectItem>
              {autoStageGroupOptions.map((group) => (
                <SelectItem key={group} value={group}>{group}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Start time</Label>
          <Input type="datetime-local" value={autoForm.start_time} onChange={(e) => setAutoForm((prev) => ({ ...prev, start_time: e.target.value }))} />
        </div>
        <div>
          <Label>Interval (mins)</Label>
          <Input type="number" min="1" value={autoForm.interval_minutes} onChange={(e) => setAutoForm((prev) => ({ ...prev, interval_minutes: e.target.value }))} />
        </div>
        <div>
          <Label>Starting match #</Label>
          <Input type="number" min="1" value={autoForm.starting_match_number} onChange={(e) => setAutoForm((prev) => ({ ...prev, starting_match_number: e.target.value }))} placeholder="Use rotation defaults" />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={autoForm.status} onValueChange={(value) => setAutoForm((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Stream URL</Label>
          <Input value={autoForm.stream_url} onChange={(e) => setAutoForm((prev) => ({ ...prev, stream_url: e.target.value }))} placeholder="https://youtube.com/live/..." />
        </div>
        {autoForm.source === "custom" ? (
          <div className="md:col-span-2 xl:col-span-4">
            <Label>Custom map list</Label>
            <Input value={autoForm.custom_maps} onChange={(e) => setAutoForm((prev) => ({ ...prev, custom_maps: e.target.value }))} placeholder="Erangel, Miramar, Miramar, Sanhok" />
            <p className="mt-1 text-xs text-muted-foreground">Separate maps with commas or line breaks.</p>
          </div>
        ) : null}
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 bg-muted/30">
          <div>
            <p className="text-sm font-medium">Schedule preview</p>
            <p className="text-xs text-muted-foreground">
              {autoSchedulePreview.error
                ? autoSchedulePreview.error
                : `${previewWithStatus.length} matches ready${autoSchedulePreview.inferredGroup ? ` · ${autoSchedulePreview.inferredGroup}` : ""}`}
            </p>
          </div>
          <Button type="button" onClick={handleGenerateSchedule} disabled={createMatchesBulk.isPending || !!autoSchedulePreview.error || previewWithStatus.length === 0}>
            <Sparkles className="size-4 mr-2" />
            Create schedule
          </Button>
        </div>
        <div className="divide-y divide-border">
          {previewWithStatus.length === 0 ? (
            <div className="px-4 py-5 text-sm text-muted-foreground">
              Choose a tournament and stage to preview generated matches.
            </div>
          ) : (
            previewWithStatus.map((entry) => (
              <div key={buildMatchKey(entry)} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    Match #{entry.match_number} · {entry.stage}
                    {entry.group_name ? ` (${entry.group_name})` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                    Day {entry.day} · {entry.map}
                    {entry.scheduled_time ? ` · ${formatAdminMatchDateTime(entry.scheduled_time)}` : ""}
                  </p>
                </div>
                <span className={`text-xs font-medium ${entry.alreadyExists ? "text-amber-500" : "text-emerald-500"}`}>
                  {entry.alreadyExists ? "Already exists" : "New"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

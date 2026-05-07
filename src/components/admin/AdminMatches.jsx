import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Save, Sparkles, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const MAPS = ["Erangel", "Miramar", "Rondo", "Haven", "Bind", "Split", "Ascent", "Icebox", "Breeze", "Fracture", "Pearl", "Lotus", "Sunset", "Other"];

function getStageConfig(tournament, stageName) {
  return (tournament?.stages || []).find((stage) => stage.name === stageName) || null;
}

function getStageGroupOptions(stage) {
  const summary = String(stage?.summary || "");
  const rangeMatch = summary.match(/Groups?\s+([A-Z])\s*-\s*([A-Z])/i);
  if (rangeMatch) {
    const start = rangeMatch[1].toUpperCase().charCodeAt(0);
    const end = rangeMatch[2].toUpperCase().charCodeAt(0);
    return Array.from({ length: end - start + 1 }, (_, index) => `Group ${String.fromCharCode(start + index)}`);
  }

  const countMatch = summary.match(/(\d+)\s+groups?/i);
  if (countMatch) {
    const count = Number(countMatch[1]);
    if (Number.isFinite(count) && count > 1 && count <= 8) {
      return Array.from({ length: count }, (_, index) => `Group ${String.fromCharCode(65 + index)}`);
    }
  }

  return [];
}

function buildMatchKey(match) {
  return [match.tournament_id, match.stage, match.group_name || "", String(match.day || 0), String(match.match_number || 0)].join("::");
}

function getRotationGroup(stage, day) {
  const rows = Array.isArray(stage?.mapRotation) ? stage.mapRotation : [];
  const key = `day${day}`;
  const value = rows[0]?.[key];
  return value ? `Group ${String(value).toUpperCase()}` : "";
}

function getRotationRowsForDay(stage, day, requestedGroupName) {
  const rows = Array.isArray(stage?.mapRotation) ? stage.mapRotation : [];
  const key = `day${day}`;
  const normalizedRequestedGroup = String(requestedGroupName || "")
    .trim()
    .toLowerCase()
    .replace(/^group\s+/i, "");

  if (!rows.length) return [];

  return rows.filter((row) => {
    const cellValue = String(row?.[key] || "").trim().toLowerCase();
    if (!cellValue) return false;
    if (!normalizedRequestedGroup) return true;
    return cellValue === normalizedRequestedGroup;
  });
}

function buildAutoSchedulePreview(autoForm, tournament, stageConfig) {
  if (!tournament || !stageConfig || !autoForm.stage) {
    return { entries: [], error: "Choose a tournament and stage first." };
  }

  const day = Number(autoForm.day);
  if (!Number.isFinite(day) || day <= 0) {
    return { entries: [], error: "Enter a valid day number." };
  }

  const intervalMinutes = Math.max(1, Number(autoForm.interval_minutes) || 45);
  const startMatch = Number(autoForm.starting_match_number);
  const source = autoForm.source || "rotation";
  const base = {
    tournament_id: tournament.id,
    stage: autoForm.stage,
    status: autoForm.status || "scheduled",
    stream_url: autoForm.stream_url || "",
    day,
  };

  if (source === "rotation") {
    const rotationRows = Array.isArray(stageConfig.mapRotation) ? stageConfig.mapRotation : [];
    if (!rotationRows.length) {
      return { entries: [], error: "This stage does not have stored map rotation data yet." };
    }

    const inferredGroup = autoForm.group_name || getRotationGroup(stageConfig, day);
    if (!inferredGroup) {
      return { entries: [], error: `No rotation group is mapped for Day ${day}.` };
    }

    const dayRows = getRotationRowsForDay(stageConfig, day, inferredGroup);
    if (!dayRows.length) {
      return { entries: [], error: `No rotation rows found for ${inferredGroup} on Day ${day}.` };
    }

    const entries = dayRows.map((row, index) => {
      const scheduledTime = autoForm.start_time
        ? new Date(new Date(autoForm.start_time).getTime() + index * intervalMinutes * 60 * 1000).toISOString()
        : "";
      return {
        ...base,
        group_name: inferredGroup,
        match_number: Number.isFinite(startMatch) && startMatch > 0 ? startMatch + index : Number(row.match) || index + 1,
        map: row.map || "Other",
        scheduled_time: scheduledTime,
      };
    });

    return { entries, error: "", inferredGroup };
  }

  const maps = String(autoForm.custom_maps || "")
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (!maps.length) {
    return { entries: [], error: "Enter one or more maps for custom generation." };
  }

  const entries = maps.map((map, index) => {
    const scheduledTime = autoForm.start_time
      ? new Date(new Date(autoForm.start_time).getTime() + index * intervalMinutes * 60 * 1000).toISOString()
      : "";
    return {
      ...base,
      group_name: autoForm.group_name || "",
      match_number: Number.isFinite(startMatch) && startMatch > 0 ? startMatch + index : index + 1,
      map,
      scheduled_time: scheduledTime,
    };
  });

  return { entries, error: "", inferredGroup: "" };
}

export default function AdminMatches() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [autoForm, setAutoForm] = useState({
    tournament_id: "",
    stage: "",
    day: "1",
    group_name: "",
    source: "rotation",
    custom_maps: "Erangel, Miramar, Miramar, Sanhok, Erangel, Miramar",
    start_time: "",
    interval_minutes: "45",
    starting_match_number: "",
    status: "scheduled",
    stream_url: "",
  });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: matches = [] } = useQuery({ queryKey: ["matches"], queryFn: () => base44.entities.Match.list("-created_date", 300) });
  const { data: tournaments = [] } = useQuery({ queryKey: ["tournaments"], queryFn: () => base44.entities.Tournament.list("-created_date", 50) });
  const availableTournaments = tournaments.filter((tournament) => tournament.status !== "completed");

  const tournamentMap = {};
  tournaments.forEach((tournament) => {
    tournamentMap[tournament.id] = tournament;
  });

  const createMatch = useMutation({
    mutationFn: (data) => base44.entities.Match.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      resetForm();
      toast({ title: "Match created" });
    },
  });

  const updateMatch = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Match.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      resetForm();
      toast({ title: "Match updated" });
    },
  });

  const deleteMatch = useMutation({
    mutationFn: (id) => base44.entities.Match.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      toast({ title: "Match deleted" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Match.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      toast({ title: "Status updated" });
    },
  });

  const createMatchesBulk = useMutation({
    mutationFn: (records) => base44.entities.Match.bulkCreate(records),
    onSuccess: (_, records) => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      toast({ title: "Schedule created", description: `${records.length} matches added.` });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({});
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ status: "scheduled", stream_url: "" });
    setShowForm(true);
  };

  const openEdit = (match) => {
    setEditing(match.id);
    setForm({
      ...match,
      scheduled_time: match.scheduled_time ? String(match.scheduled_time).slice(0, 16) : "",
    });
    setShowForm(true);
  };

  const selectedTournament = availableTournaments.find((tournament) => tournament.id === form.tournament_id);
  const stages = selectedTournament?.stages?.map((stage) => stage.name) || [];
  const selectedStageConfig = getStageConfig(selectedTournament, form.stage);
  const stageGroupOptions = getStageGroupOptions(selectedStageConfig);
  const showGroupField = stageGroupOptions.length > 0;

  const autoTournament = availableTournaments.find((tournament) => tournament.id === autoForm.tournament_id);
  const autoStages = autoTournament?.stages?.map((stage) => stage.name) || [];
  const autoStageConfig = getStageConfig(autoTournament, autoForm.stage);
  const autoStageGroupOptions = getStageGroupOptions(autoStageConfig);
  const inferredRotationGroup = autoForm.source === "rotation" ? getRotationGroup(autoStageConfig, Number(autoForm.day)) : "";
  const autoSchedulePreview = useMemo(
    () => buildAutoSchedulePreview(autoForm, autoTournament, autoStageConfig),
    [autoForm, autoTournament, autoStageConfig]
  );
  const existingMatchKeys = useMemo(() => new Set(matches.map((match) => buildMatchKey(match))), [matches]);
  const previewWithStatus = autoSchedulePreview.entries.map((entry) => ({
    ...entry,
    alreadyExists: existingMatchKeys.has(buildMatchKey(entry)),
  }));

  const handleSubmit = () => {
    if (!form.tournament_id || !form.stage) {
      toast({ title: "Tournament and stage required", variant: "destructive" });
      return;
    }

    if (showGroupField && !form.group_name) {
      toast({ title: "Group is required for this stage", variant: "destructive" });
      return;
    }

    if (editing) {
      updateMatch.mutate({ id: editing, data: form });
    } else {
      createMatch.mutate(form);
    }
  };

  const handleGenerateSchedule = () => {
    if (autoSchedulePreview.error) {
      toast({ title: autoSchedulePreview.error, variant: "destructive" });
      return;
    }

    const freshEntries = previewWithStatus
      .filter((entry) => !entry.alreadyExists)
      .map(({ alreadyExists, ...entry }) => entry);

    if (!freshEntries.length) {
      toast({ title: "Nothing to create", description: "All previewed matches already exist for that stage/day/group." });
      return;
    }

    createMatchesBulk.mutate(freshEntries);
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Auto tools</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Generate a full stage/day schedule from stored rotation data or a custom map list.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            <CalendarRange className="w-3.5 h-3.5" />
            Preview before create
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <Label>Tournament</Label>
            <Select
              value={autoForm.tournament_id || ""}
              onValueChange={(value) => setAutoForm({ ...autoForm, tournament_id: value, stage: "", group_name: "" })}
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
            <Select value={autoForm.stage || ""} onValueChange={(value) => setAutoForm({ ...autoForm, stage: value, group_name: "" })}>
              <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
              <SelectContent>
                {autoStages.map((stage) => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Source</Label>
            <Select value={autoForm.source} onValueChange={(value) => setAutoForm({ ...autoForm, source: value, group_name: value === "rotation" ? "" : autoForm.group_name })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rotation">Stage rotation</SelectItem>
                <SelectItem value="custom">Custom map list</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Day #</Label>
            <Input type="number" min="1" value={autoForm.day} onChange={(e) => setAutoForm({ ...autoForm, day: e.target.value })} />
          </div>
          <div>
            <Label>Group</Label>
            <Select value={autoForm.group_name || "__auto__"} onValueChange={(value) => setAutoForm({ ...autoForm, group_name: value === "__auto__" ? "" : value })}>
              <SelectTrigger>
                <SelectValue placeholder={inferredRotationGroup || "Auto / none"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__auto__">{inferredRotationGroup || "Auto / none"}</SelectItem>
                {autoStageGroupOptions.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Start time</Label>
            <Input type="datetime-local" value={autoForm.start_time} onChange={(e) => setAutoForm({ ...autoForm, start_time: e.target.value })} />
          </div>
          <div>
            <Label>Interval (mins)</Label>
            <Input type="number" min="1" value={autoForm.interval_minutes} onChange={(e) => setAutoForm({ ...autoForm, interval_minutes: e.target.value })} />
          </div>
          <div>
            <Label>Starting match #</Label>
            <Input type="number" min="1" value={autoForm.starting_match_number} onChange={(e) => setAutoForm({ ...autoForm, starting_match_number: e.target.value })} placeholder="Use rotation defaults" />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={autoForm.status} onValueChange={(value) => setAutoForm({ ...autoForm, status: value })}>
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
            <Input value={autoForm.stream_url} onChange={(e) => setAutoForm({ ...autoForm, stream_url: e.target.value })} placeholder="https://youtube.com/live/..." />
          </div>
          {autoForm.source === "custom" ? (
            <div className="md:col-span-2 xl:col-span-4">
              <Label>Custom map list</Label>
              <Input
                value={autoForm.custom_maps}
                onChange={(e) => setAutoForm({ ...autoForm, custom_maps: e.target.value })}
                placeholder="Erangel, Miramar, Miramar, Sanhok"
              />
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
            <Button onClick={handleGenerateSchedule} disabled={createMatchesBulk.isPending || !!autoSchedulePreview.error || previewWithStatus.length === 0}>
              <Sparkles className="w-4 h-4 mr-2" />
              Create schedule
            </Button>
          </div>

          <div className="divide-y divide-border">
            {previewWithStatus.length === 0 ? (
              <div className="px-4 py-5 text-sm text-muted-foreground">Choose a tournament and stage to preview generated matches.</div>
            ) : (
              previewWithStatus.map((entry) => (
                <div key={buildMatchKey(entry)} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      Match #{entry.match_number} · {entry.stage}{entry.group_name ? ` (${entry.group_name})` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Day {entry.day} · {entry.map}{entry.scheduled_time ? ` · ${new Date(entry.scheduled_time).toLocaleString()}` : ""}
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

      <div className="flex justify-between items-center">
        <h2 className="font-semibold">Matches ({matches.length})</h2>
        <Button onClick={openCreate} size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Match</Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex justify-between">
            <h3 className="font-semibold">{editing ? "Edit" : "Create"} Match</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Tournament *</Label>
              <Select value={form.tournament_id || ""} onValueChange={(value) => setForm({ ...form, tournament_id: value, stage: "", group_name: "" })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{availableTournaments.map((tournament) => <SelectItem key={tournament.id} value={tournament.id}>{tournament.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stage *</Label>
              <Select value={form.stage || ""} onValueChange={(value) => setForm({ ...form, stage: value, group_name: "" })}>
                <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>
                  {stages.length > 0 ? stages.map((stage) => <SelectItem key={stage} value={stage}>{stage}</SelectItem>) : <SelectItem value="default">Default</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            {showGroupField ? (
              <div>
                <Label>Group *</Label>
                <Select value={form.group_name || ""} onValueChange={(value) => setForm({ ...form, group_name: value })}>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>{stageGroupOptions.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : null}
            <div><Label>Match #</Label><Input type="number" value={form.match_number || ""} onChange={(e) => setForm({ ...form, match_number: parseInt(e.target.value) || 0 })} /></div>
            <div>
              <Label>Map</Label>
              <Select value={form.map || ""} onValueChange={(value) => setForm({ ...form, map: value })}>
                <SelectTrigger><SelectValue placeholder="Map" /></SelectTrigger>
                <SelectContent>{MAPS.map((map) => <SelectItem key={map} value={map}>{map}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Scheduled Time</Label><Input type="datetime-local" value={form.scheduled_time || ""} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} /></div>
            <div><Label>Day #</Label><Input type="number" value={form.day || ""} onChange={(e) => setForm({ ...form, day: parseInt(e.target.value) || 0 })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status || "scheduled"} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 lg:col-span-2">
              <Label>Stream URL</Label>
              <Input value={form.stream_url || ""} onChange={(e) => setForm({ ...form, stream_url: e.target.value })} placeholder="https://youtube.com/live/..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMatch.isPending || updateMatch.isPending}>
              <Save className="w-4 h-4 mr-2" /> {editing ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {matches.map((match) => (
          <div key={match.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">
                Match #{match.match_number || "-"} - {match.stage}{match.group_name ? ` (${match.group_name})` : ""}
              </span>
              <p className="text-xs text-muted-foreground">
                {tournamentMap[match.tournament_id]?.name || "Unknown"}{match.map ? ` - ${match.map}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={match.status} onValueChange={(value) => updateStatus.mutate({ id: match.id, status: value })}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => openEdit(match)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMatch.mutate(match.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

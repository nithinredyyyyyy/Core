import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import StatusBadge from "../shared/StatusBadge";

const GAMES = ["BGMI", "Valorant", "CSGO", "Free Fire", "PUBG PC", "Apex Legends"];
const DEFAULT_STAGES = [
  { name: "Quarter Finals", order: 1, status: "upcoming", teamCount: 64, summary: "" },
  { name: "Wildcard", order: 2, status: "upcoming", teamCount: 32, summary: "" },
  { name: "Semi Finals", order: 3, status: "upcoming", teamCount: 24, summary: "" },
  { name: "Survival", order: 4, status: "upcoming", teamCount: 16, summary: "" },
  { name: "Grand Finals", order: 5, status: "upcoming", teamCount: 16, summary: "" },
];

const EMPTY_FORM = {
  name: "",
  game: "",
  status: "upcoming",
  prize_pool: "",
  start_date: "",
  end_date: "",
  max_teams: 16,
  banner_url: "",
  description: "",
  format_overview: "",
  rules: "",
  calendarText: "",
  prizeBreakdownText: "",
  awardsText: "",
  participantsRows: [],
  rankingsText: "[]",
  stages: DEFAULT_STAGES,
};

function serializeRows(items = [], fields = [], lastFieldFormatter) {
  return items
    .map((item) =>
      fields
        .map((field, index) => {
          if (lastFieldFormatter && index === fields.length - 1) {
            return lastFieldFormatter(item[field], item);
          }
          return item[field] ?? "";
        })
        .join(" | ")
    )
    .join("\n");
}

function parseRows(text, fields = [], lastFieldParser) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      const entry = {};
      fields.forEach((field, index) => {
        const value = parts[index] ?? "";
        entry[field] = lastFieldParser && index === fields.length - 1 ? lastFieldParser(value) : value;
      });
      return entry;
    });
}

function serializeParticipants(items = []) {
  return (items || []).map((item) => ({
    placement: item.placement ?? "",
    team: item.team ?? "",
    stage: item.group_name && item.stage ? item.stage : item.phase || item.stage || "",
    group_name: item.group_name || "",
    playersText: Array.isArray(item.players) ? item.players.join(", ") : "",
  }));
}

function normalizeParticipantRows(items = []) {
  return items
    .map((item) => {
      const stage = String(item.stage || "").trim();
      const groupName = String(item.group_name || "").trim();
      const phase = groupName && stage ? `${stage} - ${groupName}` : stage;

      return {
        placement: item.placement ? Number(item.placement) : undefined,
        team: String(item.team || "").trim(),
        phase,
        players: String(item.playersText || "")
          .split(",")
          .map((player) => player.trim())
          .filter(Boolean),
      };
    })
    .filter((item) => item.team);
}

function normalizeStages(stages = []) {
  return stages
    .filter((stage) => stage.name?.trim())
    .map((stage, index) => ({
      ...stage,
      name: stage.name.trim(),
      order: index + 1,
      teamCount: stage.teamCount ? Number(stage.teamCount) : undefined,
      mapRotation: parseRows(stage.mapRotationText || "", ["match", "map", "day1", "day2", "day3", "day4"])
        .map((row) => ({
          match: row.match ? Number(row.match) : undefined,
          map: row.map || "",
          day1: row.day1 || "",
          day2: row.day2 || "",
          day3: row.day3 || "",
          day4: row.day4 || "",
        }))
        .filter((row) => row.match || row.map || row.day1 || row.day2 || row.day3 || row.day4),
      summary: stage.summary || "",
    }));
}

export default function AdminTournaments() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tournaments = [] } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 50),
  });
  const visibleTournaments = tournaments.filter((tournament) => tournament.status !== "completed");
  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list("-created_date", 500),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Tournament.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tournaments"] }); resetForm(); toast({ title: "Tournament created" }); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tournament.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tournaments"] }); resetForm(); toast({ title: "Tournament updated" }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Tournament.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tournaments"] }); toast({ title: "Tournament deleted" }); },
  });

  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ ...EMPTY_FORM, stages: DEFAULT_STAGES.map((stage) => ({ ...stage })) }); };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, stages: DEFAULT_STAGES.map((stage) => ({ ...stage })) });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (t) => {
    setForm({
      ...EMPTY_FORM,
      ...t,
      stages: (t.stages || DEFAULT_STAGES).map((stage, index) => ({
        ...stage,
        order: stage.order || index + 1,
        teamCount: stage.teamCount ?? "",
        summary: stage.summary || "",
        mapRotationText: serializeRows(stage.mapRotation || [], ["match", "map", "day1", "day2", "day3", "day4"]),
      })),
      calendarText: serializeRows(t.calendar, ["week", "label"]),
      prizeBreakdownText: serializeRows(t.prize_breakdown, ["placement", "team", "inr", "usd"]),
      awardsText: serializeRows(t.awards, ["title", "player", "team", "country", "inr", "usd"]),
      participantsRows: serializeParticipants(t.participants),
      rankingsText: JSON.stringify(t.rankings || [], null, 2),
    });
    setEditing(t.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.game) { toast({ title: "Name and game are required", variant: "destructive" }); return; }
    let rankings = [];
    try {
      rankings = form.rankingsText?.trim() ? JSON.parse(form.rankingsText) : [];
    } catch {
      toast({ title: "Rankings JSON is invalid", variant: "destructive" });
      return;
    }

    const payload = {
      ...form,
      stages: normalizeStages(form.stages),
      calendar: parseRows(form.calendarText || "", ["week", "label"]),
      prize_breakdown: parseRows(form.prizeBreakdownText || "", ["placement", "team", "inr", "usd"]),
      awards: parseRows(form.awardsText || "", ["title", "player", "team", "country", "inr", "usd"]),
      participants: normalizeParticipantRows(form.participantsRows || []),
      rankings,
    };

    delete payload.calendarText;
    delete payload.prizeBreakdownText;
    delete payload.awardsText;
    delete payload.participantsRows;
    delete payload.rankingsText;

    if (editing) {
      updateMut.mutate({ id: editing, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const addStage = () => {
    const stages = form.stages || [];
    setForm({
      ...form,
      stages: [...stages, { name: "", order: stages.length + 1, status: "upcoming", teamCount: "", summary: "", mapRotationText: "" }],
    });
  };

  const removeStage = (idx) => {
    const stages = [...(form.stages || [])];
    stages.splice(idx, 1);
    setForm({ ...form, stages });
  };

  const updateStage = (idx, field, value) => {
    const stages = [...(form.stages || [])];
    stages[idx] = { ...stages[idx], [field]: value };
    setForm({ ...form, stages });
  };

  const addParticipant = () => {
    const rows = form.participantsRows || [];
    setForm({
      ...form,
      participantsRows: [...rows, { placement: rows.length + 1, team: "", stage: "", group_name: "", playersText: "" }],
    });
  };

  const updateParticipant = (idx, field, value) => {
    const rows = [...(form.participantsRows || [])];
    rows[idx] = { ...rows[idx], [field]: value };
    setForm({ ...form, participantsRows: rows });
  };

  const removeParticipant = (idx) => {
    const rows = [...(form.participantsRows || [])];
    rows.splice(idx, 1);
    setForm({ ...form, participantsRows: rows });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">Tournaments ({tournaments.length})</h2>
        <Button onClick={openCreate} size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Tournament</Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">{editing ? "Edit" : "Create"} Tournament</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Name *</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Game *</Label>
              <Select value={form.game || ""} onValueChange={(v) => setForm({ ...form, game: v })}>
                <SelectTrigger><SelectValue placeholder="Select game" /></SelectTrigger>
                <SelectContent>{GAMES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status || "upcoming"} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Prize Pool</Label><Input value={form.prize_pool || ""} onChange={(e) => setForm({ ...form, prize_pool: e.target.value })} placeholder="e.g. ₹2,00,000" /></div>
            <div><Label>Start Date</Label><Input type="date" value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label>End Date</Label><Input type="date" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            <div><Label>Max Teams</Label><Input type="number" value={form.max_teams || 16} onChange={(e) => setForm({ ...form, max_teams: parseInt(e.target.value) })} /></div>
            <div><Label>Banner URL</Label><Input value={form.banner_url || ""} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Format Overview</Label><Textarea value={form.format_overview || ""} onChange={(e) => setForm({ ...form, format_overview: e.target.value })} placeholder="High-level tournament overview shown at the top of Tournament Details." /></div>
          <div><Label>Rules</Label><Textarea value={form.rules || ""} onChange={(e) => setForm({ ...form, rules: e.target.value })} placeholder="Points system, tiebreakers, or special notes." /></div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <Label>Calendar</Label>
              <Textarea
                value={form.calendarText || ""}
                onChange={(e) => setForm({ ...form, calendarText: e.target.value })}
                placeholder={"May 6 - May 10 | Qualifiers R1\nMay 11 - May 17 | Qualifiers R2 / Qualifiers R3"}
                className="min-h-[120px]"
              />
              <p className="mt-1 text-xs text-muted-foreground">One row per line: <code>week | label</code></p>
            </div>
            <div>
              <Label>Prize Breakdown</Label>
              <Textarea
                value={form.prizeBreakdownText || ""}
                onChange={(e) => setForm({ ...form, prizeBreakdownText: e.target.value })}
                placeholder={"1st | Team Name | 10,000,000 | 105,504.70\n2nd | Team Name | 5,000,000 | 52,752.35"}
                className="min-h-[120px]"
              />
              <p className="mt-1 text-xs text-muted-foreground">One row per line: <code>placement | team | inr | usd</code></p>
            </div>
            <div>
              <Label>Awards</Label>
              <Textarea
                value={form.awardsText || ""}
                onChange={(e) => setForm({ ...form, awardsText: e.target.value })}
                placeholder={"MVP | Player | Team | India | 300,000 | 3,165.14\nBest IGL | Player | Team | India | 200,000 | 2,110.09"}
                className="min-h-[120px]"
              />
              <p className="mt-1 text-xs text-muted-foreground">One row per line: <code>title | player | team | country | inr | usd</code></p>
            </div>
            <div>
              <Label>Participants</Label>
              <div className="space-y-2 rounded-xl border border-border bg-secondary/10 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Use structured participant rows so team identity, stage, and group stay consistent.</p>
                  <Button type="button" variant="outline" size="sm" onClick={addParticipant}>
                    <Plus className="mr-1 h-3 w-3" /> Add Participant
                  </Button>
                </div>
                <div className="space-y-2">
                  {(form.participantsRows || []).map((entry, idx) => (
                    <div key={`${idx}-${entry.team || "participant"}`} className="grid gap-2 rounded-lg border border-border bg-card p-3 md:grid-cols-[90px_1.6fr_1fr_0.9fr_1.6fr_auto]">
                      <Input
                        type="number"
                        placeholder="Place"
                        value={entry.placement ?? ""}
                        onChange={(e) => updateParticipant(idx, "placement", e.target.value)}
                      />
                      <Select value={entry.team || ""} onValueChange={(value) => updateParticipant(idx, "team", value)}>
                        <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Stage"
                        value={entry.stage || ""}
                        onChange={(e) => updateParticipant(idx, "stage", e.target.value)}
                      />
                      <Input
                        placeholder="Group"
                        value={entry.group_name || ""}
                        onChange={(e) => updateParticipant(idx, "group_name", e.target.value)}
                      />
                      <Input
                        placeholder="Player1, Player2"
                        value={entry.playersText || ""}
                        onChange={(e) => updateParticipant(idx, "playersText", e.target.value)}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeParticipant(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div>
            <Label>Rankings JSON</Label>
            <Textarea
              value={form.rankingsText || "[]"}
              onChange={(e) => setForm({ ...form, rankingsText: e.target.value })}
              className="min-h-[180px] font-mono text-xs"
              placeholder='[{"title":"MVP","entries":[{"placement":1,"player":"Player","team":"Team","rating":"1.50","finishes":70,"damage":15000,"avgSurvival":"20:30","knocks":60}]}]'
            />
            <p className="mt-1 text-xs text-muted-foreground">Use JSON for advanced ranking tables like MVP, FMVP, and Best IGL.</p>
          </div>

          {/* Stages */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Stages</Label>
              <Button variant="outline" size="sm" onClick={addStage}><Plus className="w-3 h-3 mr-1" /> Add Stage</Button>
            </div>
            <div className="space-y-2">
              {(form.stages || []).map((stage, idx) => (
                <div key={idx} className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex gap-2 items-center">
                    <Input placeholder="Stage name" value={stage.name} onChange={(e) => updateStage(idx, "name", e.target.value)} className="flex-1" />
                    <Input
                      type="number"
                      placeholder="Teams"
                      value={stage.teamCount ?? ""}
                      onChange={(e) => updateStage(idx, "teamCount", e.target.value)}
                      className="w-24"
                    />
                    <Select value={stage.status} onValueChange={(v) => updateStage(idx, "status", v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => removeStage(idx)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                  <Textarea
                    placeholder="Stage summary shown in Stage Progression"
                    value={stage.summary || ""}
                    onChange={(e) => updateStage(idx, "summary", e.target.value)}
                  />
                  <div>
                    <Label className="text-xs">Group & Map Rotation</Label>
                    <Textarea
                      placeholder={"1 | Rondo | C | B | D | A\n2 | Erangel | C | B | D | A"}
                      value={stage.mapRotationText || ""}
                      onChange={(e) => updateStage(idx, "mapRotationText", e.target.value)}
                      className="min-h-[110px] font-mono text-xs"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      One row per line: <code>match | map | day1 | day2 | day3 | day4</code>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
              <Save className="w-4 h-4 mr-2" /> {editing ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {visibleTournaments.map((t) => (
          <div key={t.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
            <button type="button" onClick={() => openEdit(t)} className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{t.name}</span>
                <StatusBadge status={t.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t.game} • {t.prize_pool || "No prize"} • {t.stages?.length || 0} stages</p>
            </button>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => openEdit(t)}>Edit</Button>
              <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useMemo, useReducer, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardPaste,
  CalendarDays,
  Download,
  Layers3,
  Plus,
  Pencil,
  RotateCcw,
  Search,
  Swords,
  Trash2,
  X,
  Save,
  Trophy,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import StatusBadge from "../shared/StatusBadge";
import { confirmDiscardIfDirty, createFormSnapshot } from "./formState";
import { getOfficialParticipantCount } from "@/lib/tournamentParticipants";

const GAMES = [
  "BGMI",
  "PUBG Mobile",
  "Valorant",
  "CSGO",
  "Free Fire",
  "PUBG PC",
  "Apex Legends",
];

const DEFAULT_STAGES = [
  {
    name: "Quarter Finals",
    order: 1,
    status: "upcoming",
    teamCount: 64,
    summary: "",
  },
  {
    name: "Wildcard",
    order: 2,
    status: "upcoming",
    teamCount: 32,
    summary: "",
  },
  {
    name: "Semi Finals",
    order: 3,
    status: "upcoming",
    teamCount: 24,
    summary: "",
  },
  {
    name: "Survival",
    order: 4,
    status: "upcoming",
    teamCount: 16,
    summary: "",
  },
  {
    name: "Grand Finals",
    order: 5,
    status: "upcoming",
    teamCount: 16,
    summary: "",
  },
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

const BULK_IMPORT_EXAMPLE = {
  standings:
    "#\tTeam\tGRP\tM\tWWCD\tPlace\tElims\tPts\n1\tTeam Soul\tC\t16\t3\t56\t116\t172\n2\tOrangutan\tB\t16\t2\t48\t102\t150",
  rankings:
    "Rank\tPlayer\tTeam\tMVP Rating\tFinishes\tDamage\tAvg. Survival\tKnocks\n#1\tDhruvG\tRapid Chaos Esports\t0.74\t53\t10056\t20:28\t45",
  participants:
    "Seed\tTeam\tStage\tGroup\tPlayers\n1\tTeam Soul\tRound 4\tC\tLEGIT, Joker, Goblin, Nakul",
};

function normalizeImportKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[#()./%+]/g, "")
    .replace(/&/g, "and")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function numberFromImport(value) {
  const cleaned = String(value ?? "").replace(/[#,%]/g, "").trim();
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBulkTable(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .reduce((items, line) => {
      const trimmed = line.trim();
      if (trimmed && !/^\|?\s*:?-{2,}/.test(trimmed)) items.push(trimmed);
      return items;
    }, []);
  if (lines.length < 2) return [];

  const splitLine = (line) => {
    const cleaned = line.replace(/^\|/, "").replace(/\|$/, "");
    if (cleaned.includes("\t")) return cleaned.split("\t");
    if (cleaned.includes("|")) return cleaned.split("|");
    return cleaned.split(/\s{2,}/);
  };

  const headers = splitLine(lines[0]).map((header) => normalizeImportKey(header));
  return lines.slice(1).reduce((rows, line) => {
    const values = splitLine(line).map((value) => value.trim());
    if (values.length < 2) return rows;
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    rows.push(row);
    return rows;
  }, []);
}

function pickImportValue(row, keys) {
  for (const key of keys) {
    const normalized = normalizeImportKey(key);
    if (row[normalized] !== undefined && row[normalized] !== "") {
      return row[normalized];
    }
  }
  return "";
}

function findStageIndex(stages, stageName) {
  const target = normalizeImportKey(stageName);
  return stages.findIndex((stage) => normalizeImportKey(stage.name) === target);
}

function parseStandingRows(text) {
  return parseBulkTable(text).reduce((rows, row, index) => {
    const team = pickImportValue(row, ["team", "team_name", "name"]);
    if (!team) return rows;
    const placement = numberFromImport(pickImportValue(row, ["rank", "#", "placement"])) ?? index + 1;
    rows.push({
      placement,
      rank: placement,
      team,
      fullTeam: team,
      grp: pickImportValue(row, ["grp", "group", "group_name"]),
      matches: numberFromImport(pickImportValue(row, ["m", "matches", "matches_played"])),
      m: numberFromImport(pickImportValue(row, ["m", "matches", "matches_played"])),
      wwcd: numberFromImport(pickImportValue(row, ["wwcd", "wins"])),
      pos: numberFromImport(pickImportValue(row, ["place", "pos", "place_points", "placement_points"])),
      place: numberFromImport(pickImportValue(row, ["place", "pos", "place_points", "placement_points"])),
      elimins: numberFromImport(pickImportValue(row, ["elims", "elim", "elim_points", "eliminations", "finishes"])),
      elims: numberFromImport(pickImportValue(row, ["elims", "elim", "elim_points", "eliminations", "finishes"])),
      points: numberFromImport(pickImportValue(row, ["pts", "points", "total", "total_points"])),
      pts: numberFromImport(pickImportValue(row, ["pts", "points", "total", "total_points"])),
      outcome: pickImportValue(row, ["outcome", "status", "progression_status"]),
    });
    return rows;
  }, []);
}

function toRankingKey(label) {
  const normalized = normalizeImportKey(label);
  const aliases = {
    rank: "placement",
    player_name: "player",
    team_name: "team",
    mvp_rating: "rating",
    igl_rating: "rating",
    avg_survival: "avgSurvival",
    average_survival: "avgSurvival",
    team_avg_pts: "avgPoints",
    team_avg_points: "avgPoints",
    wwcd: "wwcd",
    top_5s: "top5s",
    top5s: "top5s",
    team_avg_survival: "teamSurvival",
    team_avg_sur: "teamSurvival",
    matches_played: "matches",
    total_dmg: "damage",
    total_damage: "damage",
    finishes: "finishes",
    elims: "finishes",
    knocks: "knocks",
  };
  return aliases[normalized] || normalized.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function parseRankingTable(text, title) {
  const rawLines = String(text || "")
    .split(/\r?\n/)
    .reduce((items, line) => {
      const trimmed = line.trim();
      if (trimmed && !/^\|?\s*:?-{2,}/.test(trimmed)) items.push(trimmed);
      return items;
    }, []);
  if (rawLines.length < 2) return null;
  const splitLine = (line) => {
    const cleaned = line.replace(/^\|/, "").replace(/\|$/, "");
    if (cleaned.includes("\t")) return cleaned.split("\t");
    if (cleaned.includes("|")) return cleaned.split("|");
    return cleaned.split(/\s{2,}/);
  };
  const headers = splitLine(rawLines[0]).map((header) => header.trim());
  const keys = headers.map(toRankingKey);
  const entries = rawLines.slice(1).reduce((rows, line, index) => {
    const values = splitLine(line).map((value) => value.trim());
    const entry = {};
    keys.forEach((key, valueIndex) => {
      const rawValue = values[valueIndex] ?? "";
      entry[key] = ["placement", "finishes", "damage", "knocks", "wwcd", "top5s", "matches"].includes(key)
        ? numberFromImport(rawValue) ?? rawValue
        : rawValue;
    });
    entry.placement = numberFromImport(entry.placement) ?? index + 1;
    if (entry.player) rows.push(entry);
    return rows;
  }, []);
  const columns = headers.reduce((items, label, index) => {
    const key = keys[index];
    if (!["placement", "player", "team"].includes(key)) {
      items.push({ label, key });
    }
    return items;
  }, []);
  return entries.length ? { title: title || "Imported Ranking", columns, entries } : null;
}

function parseParticipantRows(text) {
  return parseBulkTable(text).reduce((rows, row, index) => {
    const team = pickImportValue(row, ["team", "team_name", "name"]);
    if (!team) return rows;
    const stage = pickImportValue(row, ["stage", "phase"]);
    const group = pickImportValue(row, ["group", "grp", "group_name"]);
    rows.push({
      placement: numberFromImport(pickImportValue(row, ["seed", "rank", "#"])) ?? index + 1,
      team,
      phase: group && stage ? `${stage} - ${group}` : stage,
      players: String(pickImportValue(row, ["players", "roster"]))
        .split(",")
        .flatMap((player) => {
          const trimmed = player.trim();
          return trimmed ? [trimmed] : [];
        }),
    });
    return rows;
  }, []);
}

function getTournamentBackupPayload(tournament) {
  if (!tournament) return null;
  const {
    id,
    created_date,
    updated_date,
    created_by,
    ...payload
  } = tournament;
  return payload;
}

function downloadTournamentBackup(tournament) {
  const payload = getTournamentBackupPayload(tournament);
  if (!payload || typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  const slug = String(tournament.name || "tournament")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  anchor.href = url;
  anchor.download = `${slug || "tournament"}-backup.json`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

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
        .join(" | "),
    )
    .join("\n");
}

function parseRows(text, fields = [], lastFieldParser) {
  return text
    .split("\n")
    .reduce((rows, line) => {
      const trimmed = line.trim();
      if (!trimmed) return rows;
      const parts = trimmed.split("|").map((part) => part.trim());
      const entry = {};
      fields.forEach((field, index) => {
        const value = parts[index] ?? "";
        entry[field] =
          lastFieldParser && index === fields.length - 1
            ? lastFieldParser(value)
            : value;
      });
      rows.push(entry);
      return rows;
    }, []);
}

function splitParticipantPhase(phase = "") {
  const match = String(phase).match(/^(.+?)\s+-\s+(Group\s+.*)$/i);
  return match
    ? { stage: match[1].trim(), group: match[2].trim() }
    : { stage: String(phase || "").trim(), group: "" };
}

function serializeParticipants(items = []) {
  return (items || []).map((item) => {
    const split = splitParticipantPhase(item.phase);
    return {
      placement: item.placement ?? "",
      team: item.team ?? "",
      stage: item.stage || split.stage || "",
      group_name: item.group_name || split.group || "",
      playersText: Array.isArray(item.players) ? item.players.join(", ") : "",
    };
  });
}

function normalizeParticipantRows(items = []) {
  return items.reduce((rows, item) => {
      const stage = String(item.stage || "").trim();
      const groupName = String(item.group_name || "").trim();
      const phase = groupName && stage ? `${stage} - ${groupName}` : stage;

      const entry = {
        placement: item.placement ? Number(item.placement) : undefined,
        team: String(item.team || "").trim(),
        phase,
        players: String(item.playersText || "")
          .split(",")
          .flatMap((player) => {
            const trimmed = player.trim();
            return trimmed ? [trimmed] : [];
          }),
      };
      if (entry.team) rows.push(entry);
      return rows;
    }, []);
}

function normalizeStages(stages = []) {
  return stages.reduce((items, stage, index) => {
    if (!stage.name?.trim()) return items;
    const { mapRotationText, ...rest } = stage;
    items.push({ ...rest,
      name: stage.name.trim(),
      order: index + 1,
      teamCount: stage.teamCount ? Number(stage.teamCount) : undefined,
      mapRotation: parseRows(stage.mapRotationText || "", [
        "match",
        "map",
        "day1",
        "day2",
        "day3",
        "day4Map",
        "day4",
      ]).reduce((rows, row) => {
        const normalizedRow = {
          match: row.match ? Number(row.match) : undefined,
          map: row.map || "",
          day1: row.day1 || "",
          day2: row.day2 || "",
          day3: row.day3 || "",
          day4Map: row.day4Map || "",
          day4: row.day4 || "",
        };
        if (
          normalizedRow.match ||
          normalizedRow.map ||
          normalizedRow.day1 ||
          normalizedRow.day2 ||
          normalizedRow.day3 ||
          normalizedRow.day4Map ||
          normalizedRow.day4
        ) {
          rows.push(normalizedRow);
        }
        return rows;
      }, []),
      summary: stage.summary || "",
    });
    return items;
  }, []);
}

function TournamentFormSection({
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

function TournamentBasicsFields({ form, setForm }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Name *</Label>
          <Input value={form.name || ""} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
        </div>
        <div>
          <Label>Game *</Label>
          <Select value={form.game || ""} onValueChange={(v) => setForm((prev) => ({ ...prev, game: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select game" />
            </SelectTrigger>
            <SelectContent>
              {GAMES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status || "upcoming"} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Prize Pool</Label>
          <Input value={form.prize_pool || ""} onChange={(e) => setForm((prev) => ({ ...prev, prize_pool: e.target.value }))} placeholder="e.g. Rs 2,00,000" />
        </div>
        <div>
          <Label>Start Date</Label>
          <Input type="date" value={form.start_date || ""} onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" value={form.end_date || ""} onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))} />
        </div>
        <div>
          <Label>Max Teams</Label>
          <Input type="number" value={form.max_teams ?? 16} onChange={(e) => setForm((prev) => ({ ...prev, max_teams: e.target.value === "" ? 16 : (parseInt(e.target.value, 10) || 16) }))} />
        </div>
        <div>
          <Label>Banner URL</Label>
          <Input value={form.banner_url || ""} onChange={(e) => setForm((prev) => ({ ...prev, banner_url: e.target.value }))} />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={form.description || ""} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
      </div>
      <div>
        <Label>Format Overview</Label>
        <Textarea value={form.format_overview || ""} onChange={(e) => setForm((prev) => ({ ...prev, format_overview: e.target.value }))} placeholder="High-level tournament overview shown at the top of Tournament Details." />
      </div>
      <div>
        <Label>Rules</Label>
        <Textarea value={form.rules || ""} onChange={(e) => setForm((prev) => ({ ...prev, rules: e.target.value }))} placeholder="Points system, tiebreakers, or special notes." />
      </div>
    </>
  );
}

function TournamentStructuredFields({
  form,
  setForm,
  teams,
  isMutating,
  addParticipant,
  updateParticipant,
  removeParticipant,
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div>
        <Label>Calendar</Label>
        <Textarea value={form.calendarText || ""} onChange={(e) => setForm((prev) => ({ ...prev, calendarText: e.target.value }))} placeholder={"May 6 - May 10 | Qualifiers R1\nMay 11 - May 17 | Qualifiers R2 / Qualifiers R3"} className="min-h-[120px]" />
        <p className="mt-1 text-xs text-muted-foreground">One row per line: <code>week | label</code></p>
      </div>
      <div>
        <Label>Prize Breakdown</Label>
        <Textarea value={form.prizeBreakdownText || ""} onChange={(e) => setForm((prev) => ({ ...prev, prizeBreakdownText: e.target.value }))} placeholder={"1st | Team Name | 10000000 | 105504.70\n2nd | Team Name | 5000000 | 52752.35"} className="min-h-[120px]" />
        <p className="mt-1 text-xs text-muted-foreground">One row per line: <code>placement | team | inr | usd</code></p>
      </div>
      <div>
        <Label>Awards</Label>
        <Textarea value={form.awardsText || ""} onChange={(e) => setForm((prev) => ({ ...prev, awardsText: e.target.value }))} placeholder={"MVP | Player | Team | India | 300000 | 3165.14\nBest IGL | Player | Team | India | 200000 | 2110.09"} className="min-h-[120px]" />
        <p className="mt-1 text-xs text-muted-foreground">One row per line: <code>title | player | team | country | inr | usd</code></p>
      </div>
      <div>
        <Label>Participants</Label>
        <div className="space-y-2 rounded-xl border border-border bg-secondary/10 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Use structured participant rows so team identity, stage, and group stay consistent.</p>
            <Button type="button" variant="outline" size="sm" onClick={addParticipant}>
              <Plus className="mr-1 size-3" /> Add Participant
            </Button>
          </div>
          <div className="space-y-2">
            {(form.participantsRows || []).map((entry, idx) => (
              <div key={idx} className="grid gap-2 rounded-lg border border-border bg-card p-3 md:grid-cols-[90px_1.6fr_1fr_0.9fr_1.6fr_auto]">
                <Input type="number" placeholder="Place" value={entry.placement ?? ""} onChange={(e) => updateParticipant(idx, "placement", e.target.value)} />
                <Select value={entry.team || ""} onValueChange={(value) => updateParticipant(idx, "team", value)}>
                  <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Stage" value={entry.stage || ""} onChange={(e) => updateParticipant(idx, "stage", e.target.value)} />
                <Input placeholder="Group" value={entry.group_name || ""} onChange={(e) => updateParticipant(idx, "group_name", e.target.value)} />
                <Input placeholder="Player1, Player2" value={entry.playersText || ""} onChange={(e) => updateParticipant(idx, "playersText", e.target.value)} />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeParticipant(idx)} disabled={isMutating}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TournamentStagesEditor({ form, isMutating, addStage, updateStage, removeStage }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label>Stages</Label>
        <Button type="button" variant="outline" size="sm" onClick={addStage}>
          <Plus className="size-3 mr-1" /> Add Stage
        </Button>
      </div>
      <div className="space-y-2">
        {(form.stages || []).map((stage, idx) => (
          <div key={idx} className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex gap-2 items-center">
              <Input placeholder="Stage name" value={stage.name} onChange={(e) => updateStage(idx, "name", e.target.value)} className="flex-1" />
              <Input type="number" placeholder="Teams" value={stage.teamCount ?? ""} onChange={(e) => updateStage(idx, "teamCount", e.target.value)} className="w-24" />
              <Select value={stage.status} onValueChange={(v) => updateStage(idx, "status", v)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeStage(idx)} disabled={isMutating}>
                <Trash2 className="size-3 text-destructive" />
              </Button>
            </div>
            <Textarea placeholder="Stage summary shown in Stage Progression" value={stage.summary || ""} onChange={(e) => updateStage(idx, "summary", e.target.value)} />
            <div>
              <Label className="text-xs">Group & Map Rotation</Label>
              <Textarea placeholder={"1 | Rondo | C | B | D | Miramar | A\n2 | Erangel | C | B | D | Erangel | A"} value={stage.mapRotationText || ""} onChange={(e) => updateStage(idx, "mapRotationText", e.target.value)} className="min-h-[110px] font-mono text-xs" />
              <p className="mt-1 text-xs text-muted-foreground">One row per line: <code>match | map | day1 | day2 | day3 | day4</code></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const BULK_IMPORT_INITIAL_STATE = {
  mode: "standings",
  tournamentId: "",
  stageName: "",
  rankingTitle: "MVP",
  pasteText: BULK_IMPORT_EXAMPLE.standings,
  restoreText: "",
};

function bulkImportReducer(state, action) {
  if (action.type === "setMode") {
    return {
      ...state,
      mode: action.mode,
      pasteText: BULK_IMPORT_EXAMPLE[action.mode] || "",
    };
  }
  if (action.type === "setField") {
    return { ...state, [action.field]: action.value };
  }
  return state;
}

function BulkImporterHeader({ previewCount }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          Bulk paste/import
        </p>
        <h3 className="mt-2 text-lg font-semibold">Update tournament data from a table</h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Paste from Sheets, Excel, Liquipedia-style tables, or your generated rows. Headers are required so the importer can map columns safely.
        </p>
      </div>
      <div className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
        {previewCount} parsed rows
      </div>
    </div>
  );
}

function BulkImportControls({
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

function BackupSafetyPanel({
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

function BulkPastePanel({ dispatch, importMutation, isMutating, pasteText }) {
  return (
    <div>
      <Label>Pasted table</Label>
      <Textarea
        value={pasteText}
        onChange={(event) =>
          dispatch({
            type: "setField",
            field: "pasteText",
            value: event.target.value,
          })
        }
        className="mt-2 min-h-[260px] font-mono text-xs"
        disabled={isMutating || importMutation.isPending}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Standings headers: <code># Team GRP M WWCD Place Elims Pts</code>. Rankings can include custom headers; participant rows use <code>Seed Team Stage Group Players</code>.
      </p>
    </div>
  );
}

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

function formatAdminDateRange(startDate, endDate) {
  const formatDate = (value) => {
    if (!value) return "";
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  if (start && end) return `${start} - ${end}`;
  return start || end || "Dates not set";
}

function getTournamentStatCards(tournaments) {
  const active = tournaments.filter((tournament) => tournament.status !== "completed");
  const ongoing = tournaments.filter((tournament) => tournament.status === "ongoing");
  const upcoming = tournaments.filter((tournament) => tournament.status === "upcoming");
  const totalStages = active.reduce(
    (sum, tournament) => sum + (tournament.stages?.length || 0),
    0,
  );

  return [
    { label: "Active events", value: active.length, icon: Trophy },
    { label: "Ongoing", value: ongoing.length, icon: Swords },
    { label: "Upcoming", value: upcoming.length, icon: CalendarDays },
    { label: "Stage blocks", value: totalStages, icon: Layers3 },
  ];
}

function TournamentAdminHero({
  filteredCount,
  isMutating,
  openCreate,
  searchTerm,
  setSearchTerm,
  setStatusFilter,
  statusFilter,
  tournaments,
}) {
  const statCards = useMemo(() => getTournamentStatCards(tournaments), [tournaments]);

  return (
    <div className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-secondary/35 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Tournament ops
            </p>
            <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em] text-foreground">
              Event control desk
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Create event shells, maintain stage flows, import standings, and keep participant data aligned before it reaches public tournament pages.
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreate}
            className="gap-2 self-start"
            disabled={isMutating}
          >
            <Plus className="size-4" />
            New Tournament
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-border bg-background/80 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {card.label}
                </p>
                <card.icon className="size-4 text-primary" />
              </div>
              <p className="mt-3 text-2xl font-black text-foreground">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search tournaments by name, game, prize pool, or stage"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["active", "ongoing", "upcoming", "completed", "all"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                statusFilter === status
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground lg:col-span-2">
          Showing {filteredCount} of {tournaments.length} tournaments.
        </p>
      </div>
    </div>
  );
}

function TournamentList({
  visibleTournaments,
  isMutating,
  openEdit,
  deleteTournament,
}) {
  if (visibleTournaments.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-border bg-card p-8 text-center shadow-sm">
        <Trophy className="mx-auto size-8 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          No tournaments match this view
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Adjust the search or status filter to bring events back into view.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {visibleTournaments.map((t) => (
        <div
          key={t.id}
          className="group rounded-[24px] border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
        >
          <button
            type="button"
            onClick={() => openEdit(t)}
            className="flex-1 text-left"
            disabled={isMutating}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{t.name}</span>
              <StatusBadge status={t.status} />
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {t.game} • {t.prize_pool || "No prize"} • Full setup on edit
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              <span className="rounded-lg border border-border bg-secondary/25 px-3 py-2 text-xs font-semibold text-foreground">
                {t.game || "-"}
              </span>
              <span className="rounded-lg border border-border bg-secondary/25 px-3 py-2 text-xs font-semibold text-foreground">
                {formatAdminDateRange(t.start_date, t.end_date)}
              </span>
              <span className="rounded-lg border border-border bg-secondary/25 px-3 py-2 text-xs font-semibold text-foreground">
                Full setup on edit
              </span>
              <span className="rounded-lg border border-border bg-secondary/25 px-3 py-2 text-xs font-semibold text-foreground">
                {t.max_teams || getOfficialParticipantCount(t) || "-"} teams
              </span>
            </div>
          </button>
          <div className="mt-4 flex gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => openEdit(t)} disabled={isMutating}>
              Edit
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(t)} disabled={isMutating}>
              <Pencil className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => { if (window.confirm("Delete this tournament?")) deleteTournament(t.id); }} disabled={isMutating}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function useAdminTournamentsState() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const initialFormSnapshotRef = useRef(null);
  if (initialFormSnapshotRef.current === null) {
    initialFormSnapshotRef.current = createFormSnapshot({
      ...EMPTY_FORM,
      stages: DEFAULT_STAGES.map((stage) => ({ ...stage })),
    });
  }
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tournaments = [] } = useQuery({
    queryKey: ["admin-tournaments"],
    queryFn: () =>
      base44.entities.Tournament.list("-created_date", 50, undefined, {
        fields:
          "id,name,game,tier,status,prize_pool,start_date,end_date,max_teams,banner_url,created_date,updated_date,description,format_overview,stages",
      }),
    staleTime: 60_000,
  });
  const visibleTournaments = tournaments.filter((tournament) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active"
        ? tournament.status !== "completed"
        : tournament.status === statusFilter);
    if (!matchesStatus) return false;

    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    const searchable = [
      tournament.name,
      tournament.game,
      tournament.status,
      tournament.prize_pool,
      tournament.description,
      tournament.format_overview,
      ...(tournament.stages || []).map((stage) => stage.name),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return searchable.includes(query);
  });
  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list("-created_date", 500),
    enabled: showForm,
    staleTime: 60_000,
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Tournament.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      resetForm();
      toast({ title: "Tournament created" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create tournament",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tournament.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      resetForm();
      toast({ title: "Tournament updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update tournament",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Tournament.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      toast({ title: "Tournament deleted" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete tournament",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const isMutating =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const resetForm = () => {
    const nextForm = {
      ...EMPTY_FORM,
      stages: DEFAULT_STAGES.map((stage) => ({ ...stage })),
    };
    setShowForm(false);
    setEditing(null);
    setForm(nextForm);
    initialFormSnapshotRef.current = createFormSnapshot(nextForm);
  };

  const isFormDirty = createFormSnapshot(form) !== initialFormSnapshotRef.current;

  const attemptCloseForm = () => {
    if (!confirmDiscardIfDirty(isFormDirty)) return;
    resetForm();
  };

  const openCreate = () => {
    if (showForm && !confirmDiscardIfDirty(isFormDirty)) return;
    const nextForm = {
      ...EMPTY_FORM,
      stages: DEFAULT_STAGES.map((stage) => ({ ...stage })),
    };
    setForm(nextForm);
    setEditing(null);
    initialFormSnapshotRef.current = createFormSnapshot(nextForm);
    setShowForm(true);
  };

  const openEdit = async (t) => {
    if (showForm && editing !== t.id && !confirmDiscardIfDirty(isFormDirty))
      return;
    let fullTournament = t;
    try {
      fullTournament = await base44.entities.Tournament.get(t.id);
    } catch (error) {
      toast({
        title: "Could not load tournament",
        description: error?.message || "Try opening it again.",
        variant: "destructive",
      });
      return;
    }
    const nextForm = {
      ...EMPTY_FORM,
      ...fullTournament,
      stages: (fullTournament.stages || DEFAULT_STAGES).map((stage, index) => ({
        ...stage,
        order: stage.order || index + 1,
        teamCount: stage.teamCount ?? "",
        summary: stage.summary || "",
        mapRotationText: serializeRows(stage.mapRotation || [], [
          "match",
          "map",
          "day1",
          "day2",
          "day3",
          "day4Map",
          "day4",
        ]),
      })),
      calendarText: serializeRows(fullTournament.calendar, ["week", "label"]),
      prizeBreakdownText: serializeRows(fullTournament.prize_breakdown, [
        "placement",
        "team",
        "inr",
        "usd",
        "stage",
      ]),
      awardsText: serializeRows(fullTournament.awards, [
        "title",
        "player",
        "team",
        "country",
        "inr",
        "usd",
      ]),
      participantsRows: serializeParticipants(fullTournament.participants),
      rankingsText: JSON.stringify(fullTournament.rankings || [], null, 2),
    };
    setForm(nextForm);
    setEditing(t.id);
    initialFormSnapshotRef.current = createFormSnapshot(nextForm);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.game) {
      toast({ title: "Name and game are required", variant: "destructive" });
      return;
    }
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
      prize_breakdown: parseRows(form.prizeBreakdownText || "", [
        "placement",
        "team",
        "inr",
        "usd",
        "stage",
      ]),
      awards: parseRows(form.awardsText || "", [
        "title",
        "player",
        "team",
        "country",
        "inr",
        "usd",
      ]),
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
    setForm((prev) => ({
      ...prev,
      stages: [
        ...(prev.stages || []),
        {
          name: "",
          order: (prev.stages || []).length + 1,
          status: "upcoming",
          teamCount: "",
          summary: "",
          mapRotationText: "",
        },
      ],
    }));
  };

  const removeStage = (idx) => {
    setForm((prev) => {
      const stages = [...(prev.stages || [])];
      stages.splice(idx, 1);
      return { ...prev, stages };
    });
  };

  const updateStage = (idx, field, value) => {
    setForm((prev) => {
      const stages = [...(prev.stages || [])];
      stages[idx] = { ...stages[idx], [field]: value };
      return { ...prev, stages };
    });
  };

  const addParticipant = () => {
    setForm((prev) => {
      const rows = prev.participantsRows || [];
      return {
        ...prev,
        participantsRows: [
          ...rows,
          {
            placement: rows.length + 1,
            team: "",
            stage: "",
            group_name: "",
            playersText: "",
          },
        ],
      };
    });
  };

  const updateParticipant = (idx, field, value) => {
    setForm((prev) => {
      const rows = [...(prev.participantsRows || [])];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, participantsRows: rows };
    });
  };

  const removeParticipant = (idx) => {
    setForm((prev) => {
      const rows = [...(prev.participantsRows || [])];
      rows.splice(idx, 1);
      return { ...prev, participantsRows: rows };
    });
  };


  return {
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
    tournaments,
    visibleTournaments,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    openCreate,
    openEdit,
    deleteMut,
  };
}

export default function AdminTournaments() {
  const {
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
    tournaments,
    visibleTournaments,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    openCreate,
    openEdit,
    deleteMut,
  } = useAdminTournamentsState();

  return (
    <div className="space-y-4">
      <TournamentAdminHero
        filteredCount={visibleTournaments.length}
        isMutating={isMutating}
        openCreate={openCreate}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        tournaments={tournaments}
      />

      <TournamentFormSection
        showForm={showForm}
        editing={editing}
        form={form}
        teams={teams}
        isMutating={isMutating}
        setForm={setForm}
        attemptCloseForm={attemptCloseForm}
        addParticipant={addParticipant}
        updateParticipant={updateParticipant}
        removeParticipant={removeParticipant}
        addStage={addStage}
        updateStage={updateStage}
        removeStage={removeStage}
        handleSubmit={handleSubmit}
      />
      <TournamentList
        visibleTournaments={visibleTournaments}
        isMutating={isMutating}
        openEdit={openEdit}
        deleteTournament={(id) => deleteMut.mutate(id)}
      />
    </div>
  );
}

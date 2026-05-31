import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, RefreshCcw, Radio, Rows3 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const INITIAL_FORM = {
  youtubeUrl: "",
  title: "BMPS 2026 Match Data Fetch",
  matchKey: "BMPS 2026 Round 4",
  samplingInterval: 2,
  cropPreset: "bmps_marked_feed_stats",
  notes: "",
};

const CROP_PRESETS = [
  {
    value: "bmps_marked_feed_stats",
    label: "BMPS marked: left feed + center stats",
  },
  { value: "bmps_left_feed", label: "BMPS left feed only" },
  { value: "bmps_center_player_stats", label: "BMPS center player stats only" },
  { value: "full_frame", label: "Full frame test" },
];

function statusTone(status) {
  const normalized = String(status || "").toLowerCase();
  if (["capturing", "processing", "queued"].includes(normalized)) {
    return "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300";
  }
  if (normalized === "completed") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
  }
  if (normalized === "failed") {
    return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300";
  }
  return "border-border bg-secondary/50 text-muted-foreground";
}

function payloadSummary(payload) {
  if (!payload || typeof payload !== "object") return "-";
  const keys = [
    "remaining",
    "teams_alive",
    "game_time",
    "match_number",
    "group",
    "map",
    "killer_player",
    "victim_player",
    "weapon",
    "weapons",
    "utility",
    "damage",
    "assists",
    "individual_finishes",
    "survival_time",
    "sample_count",
  ];
  return keys
    .filter((key) => payload[key] !== undefined && payload[key] !== null)
    .map((key) => {
      const value = Array.isArray(payload[key])
        ? payload[key].join(", ")
        : String(payload[key]);
      return `${key}: ${value}`;
    })
    .join(" | ") || "-";
}

export default function AdminStreamFetch() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sessionsQuery = useQuery({
    queryKey: ["stream-extraction-sessions"],
    queryFn: () => base44.streamExtraction.listSessions(),
    refetchInterval: 8000,
  });

  const sessions = sessionsQuery.data || [];
  const selectedSession = useMemo(
    () =>
      sessions.find((session) => session.id === selectedSessionId) ||
      sessions[0] ||
      null,
    [selectedSessionId, sessions],
  );

  const frameJobsQuery = useQuery({
    queryKey: ["stream-extraction-frame-jobs", selectedSession?.id],
    queryFn: () => base44.streamExtraction.listFrameJobs(selectedSession.id),
    enabled: Boolean(selectedSession?.id),
    refetchInterval: 8000,
  });

  const ocrResultsQuery = useQuery({
    queryKey: ["stream-extraction-ocr-results", selectedSession?.id],
    queryFn: () => base44.streamExtraction.listOcrResults(selectedSession.id),
    enabled: Boolean(selectedSession?.id),
    refetchInterval: 8000,
  });

  const matchStatsQuery = useQuery({
    queryKey: ["stream-extraction-match-stats", selectedSession?.id],
    queryFn: () => base44.streamExtraction.listMatchStats(selectedSession.id),
    enabled: Boolean(selectedSession?.id),
    refetchInterval: 8000,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["stream-extraction-sessions"] });
    queryClient.invalidateQueries({ queryKey: ["stream-extraction-frame-jobs"] });
    queryClient.invalidateQueries({ queryKey: ["stream-extraction-ocr-results"] });
    queryClient.invalidateQueries({ queryKey: ["stream-extraction-match-stats"] });
  };

  const createSession = useMutation({
    mutationFn: () =>
      base44.streamExtraction.createSession({
        youtube_url: form.youtubeUrl,
        title: form.title,
        status: "queued",
        capture_mode: "live",
        provider: "youtube",
        sampling_interval_seconds: Number(form.samplingInterval) || 5,
        notes: form.notes,
        metadata: {
          match_key: form.matchKey,
          crop_preset: form.cropPreset,
        },
      }),
    onSuccess: (session) => {
      setSelectedSessionId(session.id);
      setForm((prev) => ({ ...prev, youtubeUrl: "" }));
      refreshAll();
      toast({
        title: "Fetch queued",
        description: "The stream worker can now sample frames for this match.",
      });
    },
    onError: (error) => {
      toast({
        title: "Queue failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const runWorker = useMutation({
    mutationFn: () => base44.streamExtraction.runWorkerOnce(),
    onSuccess: () => {
      refreshAll();
      toast({
        title: "Worker started",
        description: "One capture/OCR pass is running in the background.",
      });
    },
    onError: (error) => {
      toast({
        title: "Worker not started",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const aggregateStats = useMutation({
    mutationFn: () =>
      base44.streamExtraction.aggregateMatchStats({
        stream_session_id: selectedSession.id,
        match_key: selectedSession.metadata?.match_key || selectedSession.title,
        min_confidence: 0,
      }),
    onSuccess: () => {
      refreshAll();
      toast({
        title: "Stats aggregated",
        description: "OCR rows were merged into draft match stats.",
      });
    },
    onError: (error) => {
      toast({
        title: "Aggregation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const frameJobs = frameJobsQuery.data || [];
  const ocrResults = ocrResultsQuery.data || [];
  const matchStats = matchStatsQuery.data || [];

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Complete Match Data Fetch
            </p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">
              Stream OCR capture
            </h3>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Queue a YouTube stream/VOD, run one worker pass, review OCR rows,
              then aggregate player match stats. Use this for hard-to-read feed
              screenshots instead of typing every player by hand.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={refreshAll}
              disabled={sessionsQuery.isFetching}
            >
              <RefreshCcw className="mr-2 size-4" />
              Refresh
            </Button>
            <Button
              type="button"
              onClick={() => runWorker.mutate()}
              disabled={runWorker.isPending}
            >
              <Play className="mr-2 size-4" />
              Run Local Worker Once
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.8fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>YouTube URL</Label>
              <Input
                value={form.youtubeUrl}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, youtubeUrl: event.target.value }))
                }
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div className="space-y-2">
              <Label>Session title</Label>
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Match key</Label>
              <Input
                value={form.matchKey}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, matchKey: event.target.value }))
                }
                placeholder="BMPS 2026 R4 Day 3 Match 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Sampling interval seconds</Label>
              <Input
                type="number"
                min="1"
                max="300"
                value={form.samplingInterval}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    samplingInterval: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Crop preset</Label>
              <select
                value={form.cropPreset}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    cropPreset: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CROP_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder="Feed quality, crop notes, match detail, or correction hints."
              />
            </div>
            <div className="md:col-span-2">
              <Button
                type="button"
                onClick={() => createSession.mutate()}
                disabled={!form.youtubeUrl || createSession.isPending}
              >
                <Radio className="mr-2 size-4" />
                Queue Fetch Session
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/30 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Selected session
            </p>
            {selectedSession ? (
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">
                    {selectedSession.title || selectedSession.youtube_url}
                  </p>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${statusTone(selectedSession.status)}`}
                  >
                    {selectedSession.status}
                  </span>
                </div>
                <p className="break-all text-muted-foreground">
                  {selectedSession.youtube_url}
                </p>
                <p className="text-muted-foreground">
                  Match key:{" "}
                  <span className="font-medium text-foreground">
                    {selectedSession.metadata?.match_key || "-"}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Crop preset:{" "}
                  <span className="font-medium text-foreground">
                    {selectedSession.metadata?.crop_preset || "full_frame"}
                  </span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <p className="text-[10px] uppercase text-muted-foreground">
                      Frames
                    </p>
                    <p className="text-xl font-black">{frameJobs.length}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <p className="text-[10px] uppercase text-muted-foreground">
                      OCR rows
                    </p>
                    <p className="text-xl font-black">{ocrResults.length}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <p className="text-[10px] uppercase text-muted-foreground">
                      Stats
                    </p>
                    <p className="text-xl font-black">{matchStats.length}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => aggregateStats.mutate()}
                  disabled={!ocrResults.length || aggregateStats.isPending}
                  className="w-full"
                >
                  <Rows3 className="mr-2 size-4" />
                  Aggregate OCR Rows
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Queue a session to begin.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
            Sessions
          </p>
          <div className="mt-4 space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setSelectedSessionId(session.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selectedSession?.id === session.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background/70 hover:bg-secondary/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {session.title || "Untitled fetch"}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusTone(session.status)}`}
                  >
                    {session.status}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {session.metadata?.match_key || session.youtube_url}
                </p>
              </button>
            ))}
            {!sessions.length ? (
              <p className="text-sm text-muted-foreground">
                No stream fetch sessions yet.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                Draft match stats
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Review these before pushing into official match/player stats.
              </p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="border-r border-border p-3 text-left">Player</th>
                  <th className="border-r border-border p-3 text-left">Team</th>
                  <th className="border-r border-border p-3 text-center">Fin</th>
                  <th className="border-r border-border p-3 text-center">Knocks</th>
                  <th className="border-r border-border p-3 text-center">Survival</th>
                  <th className="p-3 text-center">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {matchStats.slice(0, 80).map((row) => (
                  <tr key={row.id} className="bg-background/70">
                    <td className="border-r border-border/60 p-3 font-semibold text-foreground">
                      {row.player_name}
                    </td>
                    <td className="border-r border-border/60 p-3 text-muted-foreground">
                      {row.team_name || "-"}
                    </td>
                    <td className="border-r border-border/60 p-3 text-center">
                      {row.finishes ?? "-"}
                    </td>
                    <td className="border-r border-border/60 p-3 text-center">
                      {row.knocks ?? "-"}
                    </td>
                    <td className="border-r border-border/60 p-3 text-center">
                      {row.survival_time || "-"}
                    </td>
                    <td className="p-3 text-center">
                      {Math.round(Number(row.confidence || 0) * 100)}%
                    </td>
                  </tr>
                ))}
                {!matchStats.length ? (
                  <tr>
                    <td colSpan={6} className="p-5 text-center text-muted-foreground">
                      No draft match stats yet. Run a worker pass, then aggregate OCR rows.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
            OCR capture rows
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Raw left-feed and center-stat rows stored from the selected stream
            session.
          </p>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="border-r border-border p-3 text-left">Type</th>
                <th className="border-r border-border p-3 text-left">Player/Event</th>
                <th className="border-r border-border p-3 text-left">Team</th>
                <th className="border-r border-border p-3 text-center">Fin</th>
                <th className="border-r border-border p-3 text-center">Seen</th>
                <th className="border-r border-border p-3 text-center">Crop</th>
                <th className="p-3 text-left">Extracted fields</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ocrResults.slice(0, 120).map((row) => {
                const payload = row.normalized_payload || {};
                return (
                  <tr key={row.id} className="bg-background/70">
                    <td className="border-r border-border/60 p-3 font-semibold text-foreground">
                      {payload.event_type || "player_row"}
                    </td>
                    <td className="border-r border-border/60 p-3 text-foreground">
                      {row.player_name || "-"}
                    </td>
                    <td className="border-r border-border/60 p-3 text-muted-foreground">
                      {row.team_name || "-"}
                    </td>
                    <td className="border-r border-border/60 p-3 text-center">
                      {row.finishes ?? payload.individual_finishes ?? "-"}
                    </td>
                    <td className="border-r border-border/60 p-3 text-center">
                      {payload.sample_count || 1}x
                    </td>
                    <td className="border-r border-border/60 p-3 text-center text-xs text-muted-foreground">
                      {payload.crop_preset || "-"}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {payloadSummary(payload)}
                    </td>
                  </tr>
                );
              })}
              {!ocrResults.length ? (
                <tr>
                  <td colSpan={7} className="p-5 text-center text-muted-foreground">
                    No OCR rows yet. Queue a stream and run one worker pass.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

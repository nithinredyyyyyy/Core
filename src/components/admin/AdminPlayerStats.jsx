import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, Save, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  BMPS_2026_QUALIFIER_PLAYER_STATS,
  BMPS_2026_SEMI_FINALS_PLAYER_STATS,
  BMPS_2026_SURVIVAL_PLAYER_STATS,
  buildBmps2026OverallPlayerStats,
  parseBmps2026EliminatorStats,
} from "@/lib/bmps2026PlayerStats";

const EMPTY_FORM = {
  qualifierRaw: "",
  survivalRaw: "",
  semiFinalsRaw: "",
};

function countRows(raw, fallbackRows) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return { count: fallbackRows.length, mode: "default", error: "" };
  try {
    return {
      count: parseBmps2026EliminatorStats(trimmed).length,
      mode: "manual",
      error: "",
    };
  } catch (error) {
    return { count: 0, mode: "invalid", error: error?.message || "Invalid rows" };
  }
}

function extractTemplateBlock(source, name) {
  const pattern = new RegExp("const\\s+" + name + "\\s*=\\s*`([\\s\\S]*?)`;");
  return source.match(pattern)?.[1]?.trim() || "";
}

function StatTextarea({ id, label, value, onChange, rows, preview }) {
  return (
    <div className="rounded-2xl border border-border bg-background/80 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Label htmlFor={id} className="text-sm font-semibold">
            {label}
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Format: rank|team|player|finishes|fpm|contribution|best|5+|matches|erangel|miramar|rondo
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
            preview.mode === "invalid"
              ? "border-red-300 bg-red-50 text-red-700"
              : preview.mode === "manual"
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-border bg-secondary text-muted-foreground"
          }`}
        >
          {preview.mode === "default" ? "Default" : preview.mode} · {preview.count} rows
        </span>
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        spellCheck={false}
        className="font-mono text-xs"
        placeholder="Paste pipe-separated stat rows here..."
      />
      {preview.error ? (
        <p className="mt-2 text-xs font-medium text-red-600">{preview.error}</p>
      ) : null}
    </div>
  );
}

export default function AdminPlayerStats() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [fullFilePaste, setFullFilePaste] = useState("");

  const { data: savedStats = {}, isLoading } = useQuery({
    queryKey: ["admin-bmps-2026-player-stats"],
    queryFn: () => base44.site.bmps2026PlayerStats(),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setForm({
      qualifierRaw: savedStats.qualifierRaw || "",
      survivalRaw: savedStats.survivalRaw || "",
      semiFinalsRaw: savedStats.semiFinalsRaw || "",
    });
  }, [savedStats]);

  const previews = useMemo(
    () => ({
      qualifier: countRows(form.qualifierRaw, BMPS_2026_QUALIFIER_PLAYER_STATS),
      survival: countRows(form.survivalRaw, BMPS_2026_SURVIVAL_PLAYER_STATS),
      semiFinals: countRows(form.semiFinalsRaw, BMPS_2026_SEMI_FINALS_PLAYER_STATS),
    }),
    [form],
  );

  const overallCount = useMemo(() => {
    const qualifier = form.qualifierRaw.trim()
      ? parseBmps2026EliminatorStats(form.qualifierRaw)
      : BMPS_2026_QUALIFIER_PLAYER_STATS;
    const survival = form.survivalRaw.trim()
      ? parseBmps2026EliminatorStats(form.survivalRaw)
      : BMPS_2026_SURVIVAL_PLAYER_STATS;
    const semiFinals = form.semiFinalsRaw.trim()
      ? parseBmps2026EliminatorStats(form.semiFinalsRaw)
      : BMPS_2026_SEMI_FINALS_PLAYER_STATS;
    return buildBmps2026OverallPlayerStats([qualifier, survival, semiFinals]).length;
  }, [form]);

  const saveMutation = useMutation({
    mutationFn: () => base44.admin.saveBmps2026PlayerStats(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bmps-2026-player-stats"] });
      qc.invalidateQueries({ queryKey: ["bmps-2026-player-stats"] });
      toast({ title: "BMPS player stats saved" });
    },
    onError: (error) => {
      toast({
        title: "Stats save failed",
        description: error?.message || "Check the rows and try again.",
        variant: "destructive",
      });
    },
  });

  const hasInvalidRows = Object.values(previews).some(
    (preview) => preview.mode === "invalid",
  );

  const extractFullFile = () => {
    const nextForm = {
      qualifierRaw:
        extractTemplateBlock(fullFilePaste, "BMPS_2026_QUALIFIER_PLAYER_STATS_RAW") ||
        form.qualifierRaw,
      survivalRaw:
        extractTemplateBlock(fullFilePaste, "BMPS_2026_ELIMINATOR_PLAYER_STATS_RAW") ||
        form.survivalRaw,
      semiFinalsRaw:
        extractTemplateBlock(fullFilePaste, "BMPS_2026_SEMI_FINALS_PLAYER_STATS_RAW") ||
        form.semiFinalsRaw,
    };
    setForm(nextForm);
    toast({ title: "Stats blocks extracted" });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              BMPS 2026 control
            </p>
            <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em]">
              Player Statistics
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Paste official pipe-table rows here. Saved rows override the built-in stats on the public tournament Statistics tab.
            </p>
          </div>
          <div className="grid min-w-[260px] grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-border bg-secondary/35 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Overall rows
              </p>
              <p className="mt-1 text-xl font-black text-foreground">{overallCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/35 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Source
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {isLoading ? "Loading" : savedStats.updatedAt ? "Manual" : "Default"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Database className="size-4 text-primary" />
          <h3 className="font-semibold">Full File Paste Helper</h3>
        </div>
        <Textarea
          value={fullFilePaste}
          onChange={(event) => setFullFilePaste(event.target.value)}
          rows={5}
          spellCheck={false}
          className="font-mono text-xs"
          placeholder="Optional: paste the full bmps2026PlayerStats.js text here, then extract the three raw stat blocks."
        />
        <Button
          type="button"
          className="mt-3 gap-2"
          variant="secondary"
          onClick={extractFullFile}
          disabled={!fullFilePaste.trim()}
        >
          <Wand2 className="size-4" />
          Extract from full file
        </Button>
      </div>

      <StatTextarea
        id="bmps-qualifier-stats"
        label="Qualifier Stage"
        value={form.qualifierRaw}
        onChange={(value) => setForm((current) => ({ ...current, qualifierRaw: value }))}
        rows={10}
        preview={previews.qualifier}
      />
      <StatTextarea
        id="bmps-survival-stats"
        label="Survival Stage"
        value={form.survivalRaw}
        onChange={(value) => setForm((current) => ({ ...current, survivalRaw: value }))}
        rows={10}
        preview={previews.survival}
      />
      <StatTextarea
        id="bmps-semi-stats"
        label="Semi Finals"
        value={form.semiFinalsRaw}
        onChange={(value) => setForm((current) => ({ ...current, semiFinalsRaw: value }))}
        rows={10}
        preview={previews.semiFinals}
      />

      <div className="sticky bottom-4 z-20 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Save publishes the manual stats override immediately. Leave a box empty to use its built-in default data.
          </p>
          <Button
            type="button"
            className="gap-2"
            onClick={() => saveMutation.mutate()}
            disabled={hasInvalidRows || saveMutation.isPending}
          >
            <Save className="size-4" />
            {saveMutation.isPending ? "Saving..." : "Save Player Stats"}
          </Button>
        </div>
      </div>
    </div>
  );
}

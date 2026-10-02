import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TournamentStagesEditor({ form, isMutating, addStage, updateStage, removeStage }) {
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

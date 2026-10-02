import React from "react";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditResultForm({ resultForm, onResultFormChange, onClose, updateResult, onUpdateResult }) {
  return (
    <div className="rounded-xl border border-border bg-background/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">Edit Result</h4>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} disabled={updateResult.isPending}><X className="w-4 h-4" /></Button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <div>
          <Label>Placement</Label>
          <Input
            type="number"
            min={1}
            max={16}
            value={resultForm.placement > 0 ? resultForm.placement : ""}
            onChange={(e) => onResultFormChange("placement", e.target.value)}
          />
        </div>
        <div>
          <Label>Kills</Label>
          <Input type="number" min={0} value={resultForm.kill_points ?? 0} onChange={(e) => onResultFormChange("kill_points", e.target.value)} />
        </div>
        <div>
          <Label>Place Pts</Label>
          <Input value={resultForm.placement_points || 0} disabled />
        </div>
        <div>
          <Label>Total</Label>
          <Input value={resultForm.total_points || 0} disabled />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={updateResult.isPending}>Cancel</Button>
        <Button type="button" variant="outline" onClick={() => onUpdateResult("draft")} disabled={updateResult.isPending}><Save className="w-4 h-4 mr-2" /> Save Draft</Button>
        <Button type="button" onClick={() => onUpdateResult("published")} disabled={updateResult.isPending}><Save className="w-4 h-4 mr-2" /> Publish Result</Button>
      </div>
    </div>
  );
}

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TournamentStructuredFields({
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
              <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-card p-3 md:grid-cols-[90px_1.6fr_1fr_0.9fr_1.6fr_auto]">
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

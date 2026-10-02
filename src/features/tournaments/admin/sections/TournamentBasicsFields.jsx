import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GAMES } from "@/features/tournaments/admin/utils/tournamentEditorHelpers";

export function TournamentBasicsFields({ form, setForm }) {
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

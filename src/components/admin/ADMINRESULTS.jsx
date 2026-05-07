import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";

const PLACEMENT_POINTS = { 1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1 };

export default function AdminResults() {
  const [selectedMatch, setSelectedMatch] = useState("");
  const [entries, setEntries] = useState([]);
  const [editingResult, setEditingResult] = useState(null);
  const [resultForm, setResultForm] = useState({ placement: 0, kill_points: 0, placement_points: 0, total_points: 0 });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: matches = [] } = useQuery({ queryKey: ["matches"], queryFn: () => base44.entities.Match.list("-created_date", 300) });
  const { data: teams = [] } = useQuery({ queryKey: ["teams"], queryFn: () => base44.entities.Team.list("-created_date", 500) });
  const { data: tournaments = [] } = useQuery({ queryKey: ["tournaments"], queryFn: () => base44.entities.Tournament.list("-created_date", 50) });
  const { data: existingResults = [] } = useQuery({ queryKey: ["results"], queryFn: () => base44.entities.MatchResult.list("-created_date", 500) });
  const availableTournaments = tournaments.filter((tournament) => tournament.status !== "completed");

  const tournamentMap = {};
  tournaments.forEach((tournament) => {
    tournamentMap[tournament.id] = tournament;
  });

  const teamsMap = {};
  teams.forEach((team) => {
    teamsMap[team.id] = team;
  });

  const activeTournamentIds = new Set(availableTournaments.map((tournament) => tournament.id));
  const availableMatches = matches.filter((match) => activeTournamentIds.has(match.tournament_id));

  const getMatchTeams = (match) => {
    if (!match) {
      return teams;
    }

    const tournament = tournamentMap[match.tournament_id];
    const participants = Array.isArray(tournament?.participants) ? tournament.participants : [];
    if (participants.length === 0) {
      return teams;
    }

    const normalizedStage = normalizeOrganizationName(match.stage || "");
    const normalizedStageLabel = String(match.stage || "").trim().toLowerCase();
    const normalizedGroupLabel = String(match.group_name || "").trim().toLowerCase();
    const normalizedPhaseWithGroup = `${normalizedStageLabel}${normalizedGroupLabel ? ` - ${normalizedGroupLabel}` : ""}`;

    const scopedParticipants = participants.filter((participant) => {
      const phase = String(participant.phase || "").trim();
      if (!phase) return false;
      const normalizedPhaseLabel = phase.toLowerCase();

      if (normalizedGroupLabel && normalizedPhaseLabel === normalizedPhaseWithGroup) {
        return true;
      }

      return normalizeOrganizationName(phase) === normalizedStage || normalizedPhaseLabel === normalizedStageLabel;
    });

    const effectiveParticipants = scopedParticipants.length > 0 ? scopedParticipants : participants;
    const teamsByKey = new Map(teams.map((team) => [normalizeOrganizationName(team.name), team]));

    const resolvedTeams = Array.from(
      new Map(
        effectiveParticipants.map((participant) => [
          normalizeOrganizationName(participant.team),
          participant,
        ])
      ).values()
    )
      .map((participant) => teamsByKey.get(normalizeOrganizationName(participant.team)))
      .filter(Boolean);

    return resolvedTeams.length > 0 ? resolvedTeams : teams;
  };

  const createResults = useMutation({
    mutationFn: (data) => base44.entities.MatchResult.bulkCreate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["results"] });
      toast({ title: "Results saved!" });
      setEntries([]);
      setSelectedMatch("");
    },
  });

  const updateResult = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MatchResult.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["results"] });
      resetEditResult();
      toast({ title: "Result updated" });
    },
  });

  const deleteResult = useMutation({
    mutationFn: (id) => base44.entities.MatchResult.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["results"] });
      toast({ title: "Result deleted" });
    },
  });

  const resetEditResult = () => {
    setEditingResult(null);
    setResultForm({ placement: 0, kill_points: 0, placement_points: 0, total_points: 0 });
  };

  const handleSelectMatch = (matchId) => {
    setSelectedMatch(matchId);
    resetEditResult();
    const match = availableMatches.find((item) => item.id === matchId);
    const matchTeams = getMatchTeams(match);
    setEntries(matchTeams.map((team) => ({
      team_id: team.id,
      team_name: team.name,
      placement: 0,
      kill_points: 0,
      placement_points: 0,
      total_points: 0,
      match_id: matchId,
      tournament_id: match?.tournament_id || "",
      stage: match?.stage || "",
    })));
  };

  const updateEntry = (idx, field, value) => {
    const newEntries = [...entries];
    const numVal = value === "" ? 0 : parseInt(value, 10) || 0;
    newEntries[idx] = { ...newEntries[idx], [field]: numVal };

    if (field === "placement") {
      newEntries[idx].placement_points = PLACEMENT_POINTS[numVal] || 0;
    }

    newEntries[idx].total_points = newEntries[idx].kill_points + newEntries[idx].placement_points;
    setEntries(newEntries);
  };

  const openEditResult = (result) => {
    setEditingResult(result.id);
    setResultForm({
      placement: result.placement || 0,
      kill_points: result.kill_points || 0,
      placement_points: result.placement_points || 0,
      total_points: result.total_points || 0,
    });
  };

  const updateResultForm = (field, value) => {
    const numVal = value === "" ? 0 : parseInt(value, 10) || 0;
    const next = { ...resultForm, [field]: numVal };
    if (field === "placement") {
      next.placement_points = PLACEMENT_POINTS[numVal] || 0;
    }
    next.total_points = (next.kill_points || 0) + (next.placement_points || 0);
    setResultForm(next);
  };

  const handleUpdateResult = () => {
    if (!editingResult) return;
    updateResult.mutate({ id: editingResult, data: resultForm });
  };

  const handleSave = () => {
    const validEntries = entries
      .filter((entry) => entry.placement > 0 || entry.kill_points > 0)
      .map(({ team_name, ...rest }) => rest);

    if (validEntries.length === 0) {
      toast({ title: "No results to save", variant: "destructive" });
      return;
    }
    createResults.mutate(validEntries);
  };

  const matchResults = existingResults.filter((result) => result.match_id === selectedMatch);
  const selectedMatchData = availableMatches.find((match) => match.id === selectedMatch);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Match Results</h2>

      <div>
        <Label>Select Match</Label>
        <Select value={selectedMatch} onValueChange={handleSelectMatch}>
          <SelectTrigger className="max-w-md"><SelectValue placeholder="Choose a match" /></SelectTrigger>
          <SelectContent>
            {availableMatches.map((match) => (
              <SelectItem key={match.id} value={match.id}>
                {tournamentMap[match.tournament_id]?.name || "?"} - {match.stage}{match.group_name ? ` (${match.group_name})` : ""} - Match #{match.match_number || "?"} {match.map ? `(${match.map})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMatch && matchResults.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Existing Results</h3>
          </div>

          <div className="space-y-1">
            {matchResults.sort((a, b) => (a.placement || 99) - (b.placement || 99)).map((result) => (
              <div key={result.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-bold w-6 text-center">#{result.placement}</span>
                  <span>{teamsMap[result.team_id]?.name || "Unknown"}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">{result.kill_points} kills</span>
                  <span className="text-xs text-muted-foreground">{result.placement_points} place</span>
                  <span className="font-bold text-primary">{result.total_points} pts</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditResult(result)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteResult.mutate(result.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>

          {editingResult ? (
            <div className="rounded-xl border border-border bg-background/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold">Edit Result</h4>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetEditResult}><X className="w-4 h-4" /></Button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <div>
                  <Label>Placement</Label>
                  <Input type="number" min={0} max={16} value={resultForm.placement ?? 0} onChange={(e) => updateResultForm("placement", e.target.value)} />
                </div>
                <div>
                  <Label>Kills</Label>
                  <Input type="number" min={0} value={resultForm.kill_points ?? 0} onChange={(e) => updateResultForm("kill_points", e.target.value)} />
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
                <Button variant="outline" onClick={resetEditResult}>Cancel</Button>
                <Button onClick={handleUpdateResult} disabled={updateResult.isPending}><Save className="w-4 h-4 mr-2" /> Update Result</Button>
              </div>
            </div>
          ) : null}

          {!editingResult ? (
            <p className="text-xs text-muted-foreground">
              Existing results already exist for this match. Use the pencil icons above to revise each team row instead of creating duplicate results.
            </p>
          ) : null}
        </div>
      )}

      {selectedMatch && matchResults.length === 0 && entries.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center gap-3">
            <div>
              <h3 className="text-sm font-semibold">Enter Results</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Kill = 1pt | 1st=10, 2nd=6, 3rd=5, 4th=4, 5th=3, 6th=2, 7th-8th=1</p>
            </div>
          </div>
          <div className="px-4 py-2 text-xs text-muted-foreground">
            {selectedMatchData ? `Result entry scope: ${getMatchTeams(selectedMatchData).length} teams from ${tournamentMap[selectedMatchData.tournament_id]?.name || "selected tournament"}${selectedMatchData.stage ? ` - ${selectedMatchData.stage}` : ""}${selectedMatchData.group_name ? ` (${selectedMatchData.group_name})` : ""}` : null}
          </div>
          <div className="px-4 pb-2 text-[11px] text-muted-foreground">
            Save the match results to update the live standings board.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground bg-secondary/20">
                  <th className="text-left p-3">Team</th>
                  <th className="text-center p-3 w-24">Placement</th>
                  <th className="text-center p-3 w-24">Kills</th>
                  <th className="text-center p-3 w-20">Place Pts</th>
                  <th className="text-center p-3 w-20">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((entry, idx) => (
                  <tr key={entry.team_id}>
                    <td className="p-3 font-medium">{entry.team_name}</td>
                    <td className="p-3"><Input type="number" min={0} max={16} value={entry.placement ?? 0} onChange={(e) => updateEntry(idx, "placement", e.target.value)} className="h-8 text-center" /></td>
                    <td className="p-3"><Input type="number" min={0} value={entry.kill_points ?? 0} onChange={(e) => updateEntry(idx, "kill_points", e.target.value)} className="h-8 text-center" /></td>
                    <td className="p-3 text-center text-muted-foreground">{entry.placement_points}</td>
                    <td className="p-3 text-center font-bold text-primary">{entry.total_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border flex justify-end">
            <Button onClick={handleSave} disabled={createResults.isPending}>
              <Save className="w-4 h-4 mr-2" /> Save Results
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

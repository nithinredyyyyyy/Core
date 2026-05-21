import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { getMatchResultPublicationStatus, isPublishedMatchResult } from "@/lib/matchResultPublication";
import { confirmDiscardIfDirty, createFormSnapshot } from "./formState";
import {
  buildParticipantEntries,
  resolveTournamentParticipantState,
} from "@/lib/bmps2026Progression";

const PLACEMENT_POINTS = { 1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1 };
const VALID_PLACEMENTS = Array.from({ length: 16 }, (_, index) => index + 1);

function extractGroupToken(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const explicit = text.match(/group\s+([a-z0-9]+)/i);
  if (explicit) return explicit[1].toLowerCase();
  const simple = text.match(/\b([a-d])\b/i);
  if (simple) return simple[1].toLowerCase();
  return text.toLowerCase();
}

function parsePlacementValue(value) {
  if (value === "" || value === null || typeof value === "undefined") return 0;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(16, Math.max(0, parsed));
}

export default function AdminResults() {
  const [selectedMatch, setSelectedMatch] = useState("");
  const [entries, setEntries] = useState([]);
  const [editingResult, setEditingResult] = useState(null);
  const [resultForm, setResultForm] = useState({ placement: 0, kill_points: 0, placement_points: 0, total_points: 0, publication_status: "draft" });
  const [initialResultFormSnapshot, setInitialResultFormSnapshot] = useState(
    createFormSnapshot({ placement: 0, kill_points: 0, placement_points: 0, total_points: 0, publication_status: "draft" })
  );
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: matches = [] } = useQuery({ queryKey: ["matches"], queryFn: () => base44.entities.Match.list("-created_date", 300) });
  const { data: teams = [] } = useQuery({ queryKey: ["teams"], queryFn: () => base44.entities.Team.list("-created_date", 500) });
  const { data: tournaments = [] } = useQuery({ queryKey: ["tournaments"], queryFn: () => base44.entities.Tournament.list("-created_date", 50) });
  const { data: allMatchResults = [] } = useQuery({
    queryKey: ["match-results-all"],
    queryFn: () => base44.entities.MatchResult.list("-created_date", 5000),
  });
  const { data: existingResults = [] } = useQuery({
    queryKey: ["results", selectedMatch],
    enabled: Boolean(selectedMatch),
    queryFn: () => base44.entities.MatchResult.filter({ match_id: selectedMatch }, "-created_date", 32),
  });
  const availableTournaments = useMemo(
    () => tournaments.filter((tournament) => tournament.status !== "completed"),
    [tournaments]
  );

  const tournamentMap = useMemo(
    () => Object.fromEntries(tournaments.map((tournament) => [tournament.id, tournament])),
    [tournaments]
  );

  const teamsMap = useMemo(
    () => Object.fromEntries(teams.map((team) => [team.id, team])),
    [teams]
  );
  const matchMap = useMemo(
    () => Object.fromEntries(matches.map((match) => [match.id, match])),
    [matches]
  );

  const availableMatches = useMemo(() => {
    const activeTournamentIds = new Set(availableTournaments.map((tournament) => tournament.id));
    return matches
      .filter((match) => activeTournamentIds.has(match.tournament_id))
      .sort(
        (a, b) =>
          new Date(a.scheduled_time || 0).getTime() - new Date(b.scheduled_time || 0).getTime() ||
          (a.day || 0) - (b.day || 0) ||
          (a.match_number || 0) - (b.match_number || 0) ||
          String(a.id || "").localeCompare(String(b.id || ""))
      );
  }, [availableTournaments, matches]);

  const resolvedParticipantsByTournamentId = useMemo(() => {
    const result = {};

    for (const tournament of tournaments) {
      const participantEntries = buildParticipantEntries(tournament);
      result[tournament.id] = resolveTournamentParticipantState({
        tournament,
        teams,
        matches,
        matchResults: allMatchResults,
        participantEntries,
      }).participantEntries;
    }

    return result;
  }, [allMatchResults, matches, teams, tournaments]);

  const getMatchTeams = (match) => {
    if (!match) {
      return [];
    }

    const tournament = tournamentMap[match.tournament_id];
    const resolvedParticipants = resolvedParticipantsByTournamentId[match.tournament_id] || [];
    const participants = resolvedParticipants.length
      ? resolvedParticipants
      : Array.isArray(tournament?.participants)
        ? tournament.participants
        : [];
    if (participants.length === 0) {
      return [];
    }

    const normalizedStage = normalizeOrganizationName(match.stage || "");
    const normalizedStageLabel = String(match.stage || "").trim().toLowerCase();
    const matchGroupToken = extractGroupToken(match.group_name);

    const scopedParticipants = participants.filter((participant) => {
      const phase = String(participant.phase || "").trim();
      if (!phase) return false;
      const normalizedPhaseLabel = phase.toLowerCase();
      const participantGroupToken = extractGroupToken(
        participant.group_name || participant.group || participant.phase || ""
      );

      if (
        matchGroupToken &&
        normalizeOrganizationName(phase).startsWith(normalizedStage) &&
        participantGroupToken === matchGroupToken
      ) {
        return true;
      }

      return normalizeOrganizationName(phase) === normalizedStage || normalizedPhaseLabel === normalizedStageLabel;
    });

    const effectiveParticipants =
      scopedParticipants.length > 0
        ? scopedParticipants
        : normalizedStage || normalizedStageLabel
          ? []
          : participants;
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

    return resolvedTeams;
  };

  const invalidateResultQueries = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["results"] }),
      qc.invalidateQueries({ queryKey: ["match-results"] }),
      qc.invalidateQueries({ queryKey: ["match-results-all"] }),
    ]);

  const getNextMatchId = (matchId) => {
    const currentIndex = availableMatches.findIndex((match) => match.id === matchId);
    if (currentIndex === -1) return "";
    return availableMatches[currentIndex + 1]?.id || "";
  };

  const createResults = useMutation({
    mutationFn: (data) => base44.entities.MatchResult.bulkCreate(data),
    onSuccess: async (_response, variables) => {
      await invalidateResultQueries();
      const publicationStatus = variables?.[0]?.publication_status || "draft";
      if (publicationStatus === "published") {
        const currentMatchId = variables?.[0]?.match_id || selectedMatch;
        const nextMatchId = getNextMatchId(currentMatchId);
        toast({
          title: nextMatchId ? "Results published" : "Results published",
          description: nextMatchId
            ? "This match is stored. Moving you to the next match entry now."
            : "This match is stored. No next match is available right now.",
        });
        if (nextMatchId) {
          handleSelectMatch(nextMatchId);
          return;
        }
      } else {
        setEntries([]);
        toast({ title: "Draft saved" });
        return;
      }
      setEntries([]);
    },
  });

  const updateResult = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MatchResult.update(id, data),
    onSuccess: async () => {
      await invalidateResultQueries();
      resetEditResult();
      toast({ title: "Result updated" });
    },
  });

  const deleteResult = useMutation({
    mutationFn: (id) => base44.entities.MatchResult.delete(id),
    onSuccess: async () => {
      await invalidateResultQueries();
      toast({ title: "Result deleted" });
    },
  });

  const isExistingResultsMutating = updateResult.isPending || deleteResult.isPending;

  const resetEditResult = () => {
    setEditingResult(null);
    setResultForm({ placement: 0, kill_points: 0, placement_points: 0, total_points: 0, publication_status: "draft" });
    setInitialResultFormSnapshot(
      createFormSnapshot({ placement: 0, kill_points: 0, placement_points: 0, total_points: 0, publication_status: "draft" })
    );
  };

  const isEditResultDirty = createFormSnapshot(resultForm) !== initialResultFormSnapshot;

  const attemptCloseEditResult = () => {
    if (!confirmDiscardIfDirty(isEditResultDirty)) return;
    resetEditResult();
  };

  const handleSelectMatch = (matchId) => {
    setSelectedMatch(matchId);
    resetEditResult();
    const match = availableMatches.find((item) => item.id === matchId);
    const matchTeams = getMatchTeams(match);
    if (match && matchTeams.length === 0) {
      setEntries([]);
      toast({
        title: "Could not resolve teams",
        description: "This match has no safe participant scope yet. Add or fix the tournament participant entries first.",
        variant: "destructive",
      });
      return;
    }
    setEntries(matchTeams.map((team) => ({
      team_id: team.id,
      team_name: team.name,
      placement: 0,
      kill_points: 0,
      placement_points: 0,
      total_points: 0,
      publication_status: "draft",
      match_id: matchId,
      tournament_id: match?.tournament_id || "",
      stage: match?.stage || "",
    })));
  };

  const updateEntry = (idx, field, value) => {
    const newEntries = [...entries];
    const numVal =
      field === "placement"
        ? parsePlacementValue(value)
        : value === "" ? 0 : parseInt(value, 10) || 0;

    if (
      field === "placement" &&
      numVal > 0 &&
      newEntries.some((entry, entryIdx) => entryIdx !== idx && entry.placement === numVal)
    ) {
      toast({
        title: "Duplicate placement",
        description: `Placement #${numVal} is already used for another team in this match.`,
        variant: "destructive",
      });
      return;
    }

    newEntries[idx] = { ...newEntries[idx], [field]: numVal };

    if (field === "placement") {
      newEntries[idx].placement_points = PLACEMENT_POINTS[numVal] || 0;
    }

    newEntries[idx].total_points = newEntries[idx].kill_points + newEntries[idx].placement_points;
    setEntries(newEntries);
  };

  const openEditResult = (result) => {
    if (editingResult && !confirmDiscardIfDirty(isEditResultDirty)) {
      return;
    }
    const nextForm = {
      placement: result.placement || 0,
      kill_points: result.kill_points || 0,
      placement_points: result.placement_points || 0,
      total_points: result.total_points || 0,
      publication_status: getMatchResultPublicationStatus(result),
    };
    setEditingResult(result.id);
    setResultForm(nextForm);
    setInitialResultFormSnapshot(createFormSnapshot(nextForm));
  };

  const updateResultForm = (field, value) => {
    const numVal =
      field === "placement"
        ? parsePlacementValue(value)
        : value === "" ? 0 : parseInt(value, 10) || 0;

    if (
      field === "placement" &&
      numVal > 0 &&
      matchResults.some(
        (result) => result.id !== editingResult && Number(result.placement || 0) === numVal
      )
    ) {
      toast({
        title: "Duplicate placement",
        description: `Placement #${numVal} is already assigned in this match.`,
        variant: "destructive",
      });
      return;
    }

    const next = { ...resultForm, [field]: numVal };
    if (field === "placement") {
      next.placement_points = PLACEMENT_POINTS[numVal] || 0;
    }
    next.total_points = (next.kill_points || 0) + (next.placement_points || 0);
    setResultForm(next);
  };

  const handleUpdateResult = (nextPublicationStatus = resultForm.publication_status || "draft") => {
    if (!editingResult) return;
    if (!VALID_PLACEMENTS.includes(Number(resultForm.placement || 0))) {
      toast({
        title: "Invalid placement",
        description: "Placement must be between 1 and 16.",
        variant: "destructive",
      });
      return;
    }
    updateResult.mutate({
      id: editingResult,
      data: {
        ...resultForm,
        publication_status: nextPublicationStatus,
      },
    });
  };

  const handleSave = (publicationStatus = "draft") => {
    const hasMeaningfulData = entries.some(
      (entry) => entry.placement > 0 || entry.kill_points > 0 || entry.placement_points > 0 || entry.total_points > 0
    );

    if (!hasMeaningfulData) {
      toast({ title: "No results to save", variant: "destructive" });
      return;
    }

    const duplicatePlacements = entries.reduce((acc, entry) => {
      const placement = Number(entry.placement || 0);
      if (!placement) return acc;
      acc[placement] = (acc[placement] || 0) + 1;
      return acc;
    }, {});
    const duplicatePlacement = Object.entries(duplicatePlacements).find(([, count]) => count > 1);
    if (duplicatePlacement) {
      toast({
        title: "Duplicate placements",
        description: `Placement #${duplicatePlacement[0]} is assigned more than once.`,
        variant: "destructive",
      });
      return;
    }

    if (publicationStatus === "published") {
      const invalidPlacementEntry = entries.find(
        (entry) => !VALID_PLACEMENTS.includes(Number(entry.placement || 0))
      );
      if (invalidPlacementEntry) {
        toast({
          title: "Invalid placements",
          description: "Every team must have a unique placement between 1 and 16 before publishing.",
          variant: "destructive",
        });
        return;
      }
    }

    const validEntries = entries
      .map(({ team_name, publication_status, ...rest }) => ({
        ...rest,
        publication_status: publicationStatus,
      }));
    createResults.mutate(validEntries);
  };

  const matchResults = useMemo(
    () => [...existingResults].sort((a, b) => (a.placement || 99) - (b.placement || 99)),
    [existingResults]
  );
  const selectedMatchData = useMemo(
    () => availableMatches.find((match) => match.id === selectedMatch),
    [availableMatches, selectedMatch]
  );
  const selectedMatchTeams = useMemo(
    () => (selectedMatchData ? getMatchTeams(selectedMatchData) : []),
    [selectedMatchData, resolvedParticipantsByTournamentId, teams, tournamentMap]
  );
  const baselineStandingsByTeamId = useMemo(() => {
    if (!selectedMatchData) return new Map();

    const selectedGroupToken = extractGroupToken(selectedMatchData.group_name);
    const selectedMatchTime = new Date(selectedMatchData.scheduled_time || 0).getTime();
    const standingsMap = new Map();

    for (const result of allMatchResults) {
      if (!isPublishedMatchResult(result)) continue;
      if (result.match_id === selectedMatchData.id) continue;
      if (result.tournament_id !== selectedMatchData.tournament_id) continue;
      if (String(result.stage || "").trim() !== String(selectedMatchData.stage || "").trim()) continue;

      const resultMatch = matchMap[result.match_id];
      if (!resultMatch) continue;
      const resultGroupToken = extractGroupToken(resultMatch.group_name);
      if (selectedGroupToken && resultGroupToken && resultGroupToken !== selectedGroupToken) continue;

      const resultMatchTime = new Date(resultMatch.scheduled_time || 0).getTime();
      const resultDay = Number(resultMatch.day || 0);
      const selectedDay = Number(selectedMatchData.day || 0);
      const resultMatchNumber = Number(resultMatch.match_number || 0);
      const selectedMatchNumber = Number(selectedMatchData.match_number || 0);

      const isEarlier =
        (Number.isFinite(resultMatchTime) && Number.isFinite(selectedMatchTime) && resultMatchTime < selectedMatchTime) ||
        resultDay < selectedDay ||
        (resultDay === selectedDay && resultMatchNumber < selectedMatchNumber);

      if (!isEarlier) continue;

      const current = standingsMap.get(result.team_id) || {
        team_id: result.team_id,
        team_name: teamsMap[result.team_id]?.name || result.team_name || "Unknown",
        placement: 0,
        kill_points: 0,
        placement_points: 0,
        total_points: 0,
      };
      current.kill_points += Number(result.kill_points || 0);
      current.placement_points += Number(result.placement_points || 0);
      current.total_points += Number(result.total_points || 0);
      standingsMap.set(result.team_id, current);
    }

    return standingsMap;
  }, [allMatchResults, matchMap, selectedMatchData, teamsMap]);
  const entryScorecard = useMemo(
    () =>
      entries
        .map((entry) => {
          const baseline = baselineStandingsByTeamId.get(entry.team_id);
          return {
            ...entry,
            baseline_total_points: Number(baseline?.total_points || 0),
            baseline_kill_points: Number(baseline?.kill_points || 0),
            baseline_placement_points: Number(baseline?.placement_points || 0),
            total_points_combined: Number(baseline?.total_points || 0) + Number(entry.total_points || 0),
            kill_points_combined: Number(baseline?.kill_points || 0) + Number(entry.kill_points || 0),
            placement_points_combined: Number(baseline?.placement_points || 0) + Number(entry.placement_points || 0),
          };
        })
        .sort((a, b) => {
          const totalDiff = Number(b.total_points_combined || 0) - Number(a.total_points_combined || 0);
          if (totalDiff !== 0) return totalDiff;
          const killDiff = Number(b.kill_points_combined || 0) - Number(a.kill_points_combined || 0);
          if (killDiff !== 0) return killDiff;
          const placementA = Number(a.placement || 999);
          const placementB = Number(b.placement || 999);
          if (placementA !== placementB) return placementA - placementB;
          return String(a.team_name || "").localeCompare(String(b.team_name || ""));
        })
        .map((entry, index) => ({
          ...entry,
          scorecardRank: index + 1,
        })),
    [baselineStandingsByTeamId, entries]
  );
  const scorecardTotals = useMemo(
    () =>
      entryScorecard.reduce(
        (acc, entry) => {
          acc.kills += Number(entry.kill_points_combined || 0);
          acc.placementPoints += Number(entry.placement_points_combined || 0);
          acc.totalPoints += Number(entry.total_points_combined || 0);
          acc.placedTeams += VALID_PLACEMENTS.includes(Number(entry.placement || 0)) ? 1 : 0;
          return acc;
        },
        { kills: 0, placementPoints: 0, totalPoints: 0, placedTeams: 0 }
      ),
    [entryScorecard]
  );

  useEffect(() => {
    if (!selectedMatchData || matchResults.length > 0) {
      return;
    }

    const nextEntries = selectedMatchTeams.map((team) => ({
      team_id: team.id,
      team_name: team.name,
      placement: 0,
      kill_points: 0,
      placement_points: 0,
      total_points: 0,
      publication_status: "draft",
      match_id: selectedMatchData.id,
      tournament_id: selectedMatchData.tournament_id || "",
      stage: selectedMatchData.stage || "",
    }));

    const currentKey = entries.map((entry) => entry.team_id).join("|");
    const nextKey = nextEntries.map((entry) => entry.team_id).join("|");
    if (currentKey !== nextKey) {
      setEntries(nextEntries);
    }
  }, [entries, matchResults.length, selectedMatchData, selectedMatchTeams]);

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
            {matchResults.map((result) => (
              <div key={result.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-bold w-6 text-center">#{result.placement}</span>
                  <span>{teamsMap[result.team_id]?.name || "Unknown"}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${
                    getMatchResultPublicationStatus(result) === "published"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {getMatchResultPublicationStatus(result)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">{result.kill_points} kills</span>
                  <span className="text-xs text-muted-foreground">{result.placement_points} place</span>
                  <span className="font-bold text-primary">{result.total_points} pts</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditResult(result)} disabled={isExistingResultsMutating}><Pencil className="w-3 h-3" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteResult.mutate(result.id)} disabled={isExistingResultsMutating}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>

          {editingResult ? (
            <div className="rounded-xl border border-border bg-background/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold">Edit Result</h4>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={attemptCloseEditResult} disabled={updateResult.isPending}><X className="w-4 h-4" /></Button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <div>
                  <Label>Placement</Label>
                  <Input
                    type="number"
                    min={1}
                    max={16}
                    value={resultForm.placement > 0 ? resultForm.placement : ""}
                    onChange={(e) => updateResultForm("placement", e.target.value)}
                  />
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
                <Button type="button" variant="outline" onClick={attemptCloseEditResult} disabled={updateResult.isPending}>Cancel</Button>
                <Button type="button" variant="outline" onClick={() => handleUpdateResult("draft")} disabled={updateResult.isPending}><Save className="w-4 h-4 mr-2" /> Save Draft</Button>
                <Button type="button" onClick={() => handleUpdateResult("published")} disabled={updateResult.isPending}><Save className="w-4 h-4 mr-2" /> Publish Result</Button>
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
            Save drafts while building the scorecard, then publish when the full match sheet is ready for the live standings board.
          </div>
          <div className="mx-4 mb-4 rounded-xl border border-border bg-secondary/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold">Live standings</h4>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Published match points stay in this table, and the next match entry adds on top instantly.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full border border-border bg-background px-3 py-1">
                  {scorecardTotals.placedTeams}/16 teams placed
                </span>
                <span className="rounded-full border border-border bg-background px-3 py-1">
                  {scorecardTotals.kills} kills
                </span>
                <span className="rounded-full border border-border bg-background px-3 py-1">
                  {scorecardTotals.totalPoints} standings pts
                </span>
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {entryScorecard.map((entry) => (
                <div
                  key={`scorecard-${entry.team_id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {entry.scorecardRank}
                      </span>
                      <p className="truncate font-medium">{entry.team_name}</p>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Published {entry.baseline_total_points || 0} pts • Current #{entry.placement || "-"} • {entry.kill_points || 0} kills
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{entry.total_points_combined || 0}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Standings total</p>
                  </div>
                </div>
              ))}
            </div>
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
                    <td className="p-3">
                      <Input
                        type="number"
                        min={1}
                        max={16}
                        value={entry.placement > 0 ? entry.placement : ""}
                        onChange={(e) => updateEntry(idx, "placement", e.target.value)}
                        className="h-8 text-center"
                      />
                    </td>
                    <td className="p-3"><Input type="number" min={0} value={entry.kill_points ?? 0} onChange={(e) => updateEntry(idx, "kill_points", e.target.value)} className="h-8 text-center" /></td>
                    <td className="p-3 text-center text-muted-foreground">{entry.placement_points}</td>
                    <td className="p-3 text-center font-bold text-primary">{entry.total_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleSave("draft")} disabled={createResults.isPending}>
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </Button>
            <Button type="button" onClick={() => handleSave("published")} disabled={createResults.isPending}>
              <Save className="w-4 h-4 mr-2" /> Publish Results
            </Button>
          </div>
        </div>
      )}

      {selectedMatch && matchResults.length === 0 && entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          This match does not have a resolved team scope yet. Fix the tournament participants or BMPS stage mapping before entering results.
        </div>
      ) : null}
    </div>
  );
}

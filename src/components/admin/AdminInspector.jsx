import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getOrganizationMeta, normalizeOrganizationName } from "@/lib/organizationIdentity";
import { getTeamLogoByName } from "@/lib/teamLogos";

function groupBy(items, getKey) {
  return items.reduce((map, item) => {
    const key = getKey(item);
    const current = map.get(key) || [];
    current.push(item);
    map.set(key, current);
    return map;
  }, new Map());
}

export default function AdminInspector() {
  const [selectedTournamentId, setSelectedTournamentId] = useState("");

  const { data: tournaments = [] } = useQuery({
    queryKey: ["inspector-tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 100),
  });
  const visibleTournaments = tournaments.filter((tournament) => tournament.status !== "completed");
  const { data: matches = [] } = useQuery({
    queryKey: ["inspector-matches"],
    queryFn: () => base44.entities.Match.list("-created_date", 500),
  });
  const { data: results = [] } = useQuery({
    queryKey: ["inspector-results"],
    queryFn: () => base44.entities.MatchResult.list("-created_date", 5000),
  });
  const { data: teams = [] } = useQuery({
    queryKey: ["inspector-teams"],
    queryFn: () => base44.entities.Team.list("-created_date", 300),
  });

  const selectedTournament =
    tournaments.find((tournament) => tournament.id === selectedTournamentId) || tournaments[0] || null;

  const teamKeys = useMemo(
    () => new Set(teams.map((team) => normalizeOrganizationName(team.name))),
    [teams]
  );

  const tournamentMatches = useMemo(
    () => matches.filter((match) => match.tournament_id === selectedTournament?.id),
    [matches, selectedTournament]
  );

  const tournamentResults = useMemo(
    () => results.filter((result) => result.tournament_id === selectedTournament?.id),
    [results, selectedTournament]
  );

  const participantPhaseGroups = useMemo(() => {
    const participants = selectedTournament?.participants || [];
    return [...groupBy(participants, (entry) => entry.phase || "Unlabeled phase").entries()];
  }, [selectedTournament]);

  const matchesByStage = useMemo(() => {
    return [...groupBy(tournamentMatches, (match) => `${match.stage || "Unknown stage"}${match.group_name ? ` / ${match.group_name}` : ""}`).entries()];
  }, [tournamentMatches]);

  const resultCoverage = useMemo(() => {
    return tournamentMatches.map((match) => {
      const rows = tournamentResults.filter((result) => result.match_id === match.id);
      return {
        id: match.id,
        label: `${match.stage || "Unknown"}${match.group_name ? ` / ${match.group_name}` : ""} / Match ${match.match_number || "-"}`,
        count: rows.length,
        status: match.status,
      };
    });
  }, [tournamentMatches, tournamentResults]);

  const unresolvedParticipants = useMemo(() => {
    return (selectedTournament?.participants || []).filter(
      (entry) => !teamKeys.has(normalizeOrganizationName(entry.team))
    );
  }, [selectedTournament, teamKeys]);

  const duplicateOrganizations = useMemo(() => {
    const grouped = [...groupBy(teams, (team) => getOrganizationMeta(team).key).entries()];
    return grouped
      .filter(([, entries]) => entries.length > 1)
      .map(([key, entries]) => ({
        key,
        label: getOrganizationMeta(entries[0]).name,
        entries,
      }))
      .sort((a, b) => b.entries.length - a.entries.length || a.label.localeCompare(b.label));
  }, [teams]);

  const missingLogos = useMemo(() => {
    const participantNames = (selectedTournament?.participants || []).map((entry) => entry.team);
    const uniqueNames = [...new Set(participantNames)];
    return uniqueNames.filter((name) => !getTeamLogoByName(name));
  }, [selectedTournament]);

  const phaseWithoutMatches = useMemo(() => {
    return participantPhaseGroups
      .filter(([phase]) => {
        const normalizedPhase = String(phase || "").toLowerCase();
        return !tournamentMatches.some((match) => {
          const combined = `${match.stage || ""}${match.group_name ? ` - ${match.group_name}` : ""}`.toLowerCase();
          return combined === normalizedPhase || (match.stage || "").toLowerCase() === normalizedPhase;
        });
      })
      .map(([phase, entries]) => ({ phase, count: entries.length }));
  }, [participantPhaseGroups, tournamentMatches]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold">Data Inspector</h2>
        <p className="text-sm text-muted-foreground">
          Inspect live tournament payloads, group phases, match wiring, and result coverage from the backend.
        </p>
      </div>

      <div className="max-w-md">
        <Label>Tournament</Label>
        <Select value={selectedTournament?.id || ""} onValueChange={setSelectedTournamentId}>
          <SelectTrigger>
            <SelectValue placeholder="Select tournament" />
          </SelectTrigger>
          <SelectContent>
            {visibleTournaments.map((tournament) => (
              <SelectItem key={tournament.id} value={tournament.id}>
                {tournament.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTournament ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Participants</p>
              <p className="mt-2 text-2xl font-black">{selectedTournament.participants?.length || 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Match Rows</p>
              <p className="mt-2 text-2xl font-black">{tournamentMatches.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Result Rows</p>
              <p className="mt-2 text-2xl font-black">{tournamentResults.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Unresolved Teams</p>
              <p className="mt-2 text-2xl font-black">{unresolvedParticipants.length}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Duplicate Orgs</p>
              <p className="mt-2 text-2xl font-black">{duplicateOrganizations.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Multiple team rows resolving to one organization key.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Missing Logos</p>
              <p className="mt-2 text-2xl font-black">{missingLogos.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Participant teams without a resolved shared logo.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Phase Gaps</p>
              <p className="mt-2 text-2xl font-black">{phaseWithoutMatches.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Participant phases that do not yet map to any stored match rows.</p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold">Participant Phases</h3>
              <div className="mt-4 space-y-3">
                {participantPhaseGroups.map(([phase, entries]) => (
                  <div key={phase} className="rounded-lg border border-border bg-secondary/20 p-3">
                    <p className="text-sm font-semibold text-foreground">{phase}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{entries.length} teams</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {entries.map((entry) => entry.team).join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold">Matches By Stage / Group</h3>
              <div className="mt-4 space-y-3">
                {matchesByStage.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No matches stored for this tournament yet.</p>
                ) : (
                  matchesByStage.map(([label, entries]) => (
                    <div key={label} className="rounded-lg border border-border bg-secondary/20 p-3">
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{entries.length} matches</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {entries.map((entry) => `#${entry.match_number || "-"} ${entry.map || "Unknown map"} (${entry.status})`).join(" / ")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold">Result Coverage By Match</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {resultCoverage.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matches available yet.</p>
              ) : (
                resultCoverage.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-border bg-secondary/20 p-3">
                    <p className="text-sm font-semibold text-foreground">{entry.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.count} result rows / status {entry.status}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold">Unresolved Participant Names</h3>
            {unresolvedParticipants.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">All participant names resolve to a known team identity.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {unresolvedParticipants.map((entry) => (
                  <div key={`${entry.team}-${entry.placement}`} className="rounded-lg border border-border bg-secondary/20 p-3 text-sm">
                    <span className="font-medium text-foreground">{entry.team}</span>
                    <span className="ml-2 text-muted-foreground">{entry.phase || "No phase"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold">Duplicate Organization Rows</h3>
              {duplicateOrganizations.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No duplicate organization rows found in the live teams table.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {duplicateOrganizations.slice(0, 12).map((organization) => (
                    <div key={organization.key} className="rounded-lg border border-border bg-secondary/20 p-3 text-sm">
                      <p className="font-medium text-foreground">{organization.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {organization.entries.map((entry) => `${entry.name} (${entry.tag})`).join(" / ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold">Missing Participant Logos</h3>
              {missingLogos.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Every participant team in this tournament resolves to a shared logo.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {missingLogos.map((name) => (
                    <div key={name} className="rounded-lg border border-border bg-secondary/20 p-3 text-sm">
                      <span className="font-medium text-foreground">{name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold">Participant Phases Without Match Wiring</h3>
              {phaseWithoutMatches.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Every stored participant phase connects to at least one match stage/group label.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {phaseWithoutMatches.map((entry) => (
                    <div key={entry.phase} className="rounded-lg border border-border bg-secondary/20 p-3 text-sm">
                      <p className="font-medium text-foreground">{entry.phase}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{entry.count} teams in this phase</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

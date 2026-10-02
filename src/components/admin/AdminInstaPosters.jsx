import React, { useCallback, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { buildParticipantEntries } from "@/lib/bmps2026Progression";
import { decorateMatchesWithLiveStatus } from "@/lib/liveCalendar";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import { resolveTournamentParticipantState } from "@/lib/tournamentProgression";
import { BMPS_2026_FMVP_STATS, BMPS_2026_IGL_STATS, BMPS_2026_MVP_STATS, BMPS_2026_OVERALL_PLAYER_STATS } from "@/lib/bmps2026PlayerStats";
import { MANUAL_FORM, getTeamName, normalizeName, getParticipantPlayers, resolveRosterFromSources, POSTER_COLORS, slugify, POSTER_MODES } from "@/components/admin/instaPosters/utils/posterHelpers";
import { StandingsPoster } from "@/components/admin/instaPosters/sections/StandingsPoster";
import { RosterPoster } from "@/components/admin/instaPosters/sections/RosterPoster";
import { TransferPoster } from "@/components/admin/instaPosters/sections/TransferPoster";
import { NewsPoster } from "@/components/admin/instaPosters/sections/NewsPoster";
import { PlayerAwardPoster } from "@/components/admin/instaPosters/sections/PlayerAwardPoster";
import { QualifiedPoster } from "@/components/admin/instaPosters/sections/QualifiedPoster";
import { PlacementPoster } from "@/components/admin/instaPosters/sections/PlacementPoster";

export default function AdminInstaPosters() {
  const [mode, setMode] = useState("standings");
  const [manual, setManual] = useState(MANUAL_FORM);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [selectedStageName, setSelectedStageName] = useState("");
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [selectedPlayerKey, setSelectedPlayerKey] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const posterRef = useRef(null);
  const { toast } = useToast();

  const { data: tournaments = [] } = useQuery({
    queryKey: ["admin-insta-tournaments"],
    queryFn: () => base44.entities.Tournament.list("-start_date", 50),
  });

  const activeTournament = useMemo(
    () =>
      tournaments.find((t) => t.id === selectedTournamentId) ||
      tournaments[0] ||
      null,
    [tournaments, selectedTournamentId],
  );

  const { data: normalizedData } = useQuery({
    queryKey: ["admin-insta-normalized", activeTournament?.id],
    queryFn: () => base44.entities.Tournament.get(activeTournament.id),
    enabled: Boolean(activeTournament?.id),
  });

  const normalizedTournament = useMemo(() => {
    const ntd = normalizedData || activeTournament;
    if (!ntd) return null;
    return {
      ...ntd,
      name: ntd.name || ntd.tournament?.name || "Tournament",
      stages: ntd.tournament?.stages || activeTournament?.stages || [],
    };
  }, [activeTournament, normalizedData]);

  const { data: teams = [] } = useQuery({
    queryKey: ["admin-insta-teams"],
    queryFn: () => base44.entities.Team.list("-total_points", 500),
  });

  const { data: newsArticles = [] } = useQuery({
    queryKey: ["admin-insta-news"],
    queryFn: () => base44.entities.NewsArticle.list("-created_date", 30),
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["admin-insta-matches", activeTournament?.id],
    queryFn: () =>
      base44.entities.Match.filter({ tournament_id: activeTournament.id }, "-scheduled_time", 500),
    enabled: Boolean(activeTournament?.id),
  });

  const { data: rawMatchResults = [] } = useQuery({
    queryKey: ["admin-insta-results", activeTournament?.id],
    queryFn: () =>
      base44.entities.MatchResult.filter({ tournament_id: activeTournament.id }, "-created_date", 5000),
    enabled: Boolean(activeTournament?.id),
  });

  const matchResults = useMemo(
    () => filterPublishedMatchResults(rawMatchResults),
    [rawMatchResults],
  );

  const participantState = useMemo(() => {
    if (!normalizedTournament) return { participantEntries: [], stageBoards: [] };
    const calendarMatches = decorateMatchesWithLiveStatus(matches, matchResults);
    return resolveTournamentParticipantState({
      tournament: normalizedTournament,
      teams,
      matches: calendarMatches,
      matchResults,
      participantEntries: buildParticipantEntries(normalizedTournament),
      stageNames: (normalizedTournament.stages || []).flatMap((stage) =>
        stage?.name ? [stage.name] : [],
      ),
    });
  }, [matchResults, matches, normalizedTournament, teams]);

  const stageBoards = participantState.stageBoards || [];
  const activeStage = useMemo(() => {
    if (selectedStageName) {
      return stageBoards.find((stage) => stage.name === selectedStageName) || null;
    }
    return stageBoards[stageBoards.length - 1] || stageBoards[0] || null;
  }, [selectedStageName, stageBoards]);

  const standingsRows = useMemo(
    () =>
      (activeStage?.standings || [])
        .toSorted((left, right) => (left.rank || 999) - (right.rank || 999)),
    [activeStage],
  );

  const participantRows = useMemo(() => {
    const map = new Map();
    for (const participant of normalizedTournament?.participants || []) {
      const name = getTeamName(participant);
      if (name) map.set(normalizeName(name), { name, roster: getParticipantPlayers(participant) });
    }
    for (const entry of participantState.participantEntries || []) {
      const name = getTeamName(entry);
      if (!name || map.has(normalizeName(name))) continue;
      map.set(normalizeName(name), { name, roster: getParticipantPlayers(entry) });
    }
    for (const team of teams) {
      const name = team?.name || team?.team || "";
      if (!name || map.has(normalizeName(name))) continue;
      map.set(normalizeName(name), { name, roster: [] });
    }
    return [...map.values()].sort((left, right) => left.name.localeCompare(right.name));
  }, [normalizedTournament?.participants, participantState.participantEntries, teams]);

  const activeTeamName = manual.teamName || selectedTeamName || standingsRows[0]?.teamName || participantRows[0]?.name || "";

  const activeRoster = useMemo(() => {
    const manualRoster = manual.rosterText
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (manualRoster.length) return manualRoster;
    const resolvedRoster = resolveRosterFromSources(activeTeamName, participantRows);
    return resolvedRoster.length
      ? resolvedRoster
      : ["Player One", "Player Two", "Player Three", "Player Four", "Player Five"];
  }, [activeTeamName, manual.rosterText, participantRows]);

  const playerOptions = useMemo(() => {
    if (mode === "bestIgl") return BMPS_2026_IGL_STATS;
    if (mode === "fmvp") return BMPS_2026_FMVP_STATS;
    if (mode === "mvp") return BMPS_2026_MVP_STATS;
    return BMPS_2026_OVERALL_PLAYER_STATS.slice(0, 30);
  }, [mode]);

  const activePlayer = useMemo(() => {
    if (selectedPlayerKey) {
      const [playerName, teamName] = selectedPlayerKey.split("::");
      return (
        playerOptions.find(
          (player) =>
            normalizeName(player.player) === playerName &&
            normalizeName(player.teamName) === teamName,
        ) || playerOptions[0]
      );
    }
    return playerOptions[0] || null;
  }, [playerOptions, selectedPlayerKey]);

  const activeArticle = useMemo(() => {
    if (selectedArticleId) {
      return newsArticles.find((article) => article.id === selectedArticleId) || newsArticles[0] || null;
    }
    return newsArticles[0] || null;
  }, [newsArticles, selectedArticleId]);

  const podiumTeam = useMemo(() => {
    const indexByMode = { champion: 0, runnerUp: 1, secondRunnerUp: 2 };
    const podiumIndex = indexByMode[mode] ?? 0;
    return manual.teamName || selectedTeamName || standingsRows[podiumIndex]?.teamName || standingsRows[0]?.teamName || activeTeamName;
  }, [activeTeamName, manual.teamName, mode, selectedTeamName, standingsRows]);

  const renderPoster = () => {
    const brandProps = { brandLogo: manual.brandLogo, brandText: manual.brandText };
    if (mode === "standings") {
      return (
        <StandingsPoster
          tournament={normalizedTournament}
          stageName={activeStage?.name}
          rows={standingsRows}
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "roster") {
      return (
        <RosterPoster
          tournament={normalizedTournament}
          teamName={activeTeamName}
          roster={activeRoster}
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "transfer") {
      return (
        <TransferPoster
          tournament={normalizedTournament}
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "news") {
      return <NewsPoster tournament={normalizedTournament} article={activeArticle} manual={manual} {...brandProps} />;
    }
    if (mode === "bestIgl") {
      return (
        <PlayerAwardPoster
          tournament={normalizedTournament}
          awardLabel="Best IGL"
          player={activePlayer}
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "fmvp") {
      return (
        <PlayerAwardPoster
          tournament={normalizedTournament}
          awardLabel="FMVP"
          player={activePlayer}
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "mvp") {
      return (
        <PlayerAwardPoster
          tournament={normalizedTournament}
          awardLabel="MVP"
          player={activePlayer}
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "qualified") {
      return (
        <QualifiedPoster
          tournament={normalizedTournament}
          stageName={activeStage?.name}
          rows={standingsRows}
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "runnerUp") {
      return (
        <PlacementPoster
          tournament={normalizedTournament}
          teamName={podiumTeam}
          placeLabel="2nd Place"
          headline="RUNNER-UP"
          accent="#cbd5e1"
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "secondRunnerUp") {
      return (
        <PlacementPoster
          tournament={normalizedTournament}
          teamName={podiumTeam}
          placeLabel="3rd Place"
          headline="2ND RUNNER-UP"
          accent="#f59e0b"
          manual={manual}
          {...brandProps}
        />
      );
    }
    return (
      <PlacementPoster
        tournament={normalizedTournament}
        teamName={podiumTeam}
        placeLabel="Champions"
        headline="CHAMPIONS"
        accent="#facc15"
        manual={manual}
        {...brandProps}
      />
    );
  };

  const handleDownload = useCallback(async () => {
    const el = posterRef.current?.querySelector(".insta-poster-export");
    if (!el || isDownloading) return;
    setIsDownloading(true);
    try {
      await document.fonts.ready;

      const clone = el.cloneNode(true);
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = "1080px";
      clone.style.height = "1350px";
      clone.style.zIndex = "-1";
      clone.style.margin = "0";
      document.body.appendChild(clone);

      const originalElements = [el, ...el.querySelectorAll("*")];
      const cloneElements = [clone, ...clone.querySelectorAll("*")];
      for (let i = 0; i < originalElements.length && i < cloneElements.length; i += 1) {
        try {
          const computed = window.getComputedStyle(originalElements[i]);
          for (let j = 0; j < computed.length; j += 1) {
            const prop = computed[j];
            const value = computed.getPropertyValue(prop);
            if (value) cloneElements[i].style.setProperty(prop, value);
          }
        } catch {
          // Some browser-generated nodes can be skipped safely during export.
        }
      }

      let dataUrl;
      try {
        dataUrl = await toPng(clone, {
          width: 1080,
          height: 1350,
          pixelRatio: 1,
          backgroundColor: POSTER_COLORS.paper,
          cacheBust: true,
        });
      } finally {
        document.body.removeChild(clone);
      }

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${slugify(mode)}-${slugify(activeStage?.name || podiumTeam || activePlayer?.player || activeArticle?.title)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Insta poster export failed:", error);
      toast({
        title: "Poster export failed",
        description: error?.message || "Try again after images finish loading.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [activeArticle?.title, activePlayer?.player, activeStage?.name, isDownloading, mode, podiumTeam, toast]);

  const activeMode = POSTER_MODES.find((item) => item.id === mode) || POSTER_MODES[0];
  const ActiveModeIcon = activeMode.icon;

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Insta module
            </p>
            <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em]">
              Individual Stage Posters
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Generate 4:5 social posters for standings, roster changes, news,
              player awards, qualified teams, and podium placements.
            </p>
          </div>
          <Button type="button" onClick={handleDownload} disabled={isDownloading} className="gap-2">
            <Download className="size-4" />
            {isDownloading ? "Exporting..." : "Download PNG"}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4 rounded-[24px] border border-border bg-card p-5 shadow-sm">
          <div>
            <Label>Poster Type</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSTER_MODES.map((posterMode) => (
                  <SelectItem key={posterMode.id} value={posterMode.id}>
                    {posterMode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label>Tournament</Label>
              <Select value={activeTournament?.id || ""} onValueChange={setSelectedTournamentId}>
                <SelectTrigger className="mt-1">
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
              <Label>Stage / Board</Label>
              <Select value={activeStage?.name || ""} onValueChange={setSelectedStageName}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stageBoards.map((stage) => (
                    <SelectItem key={stage.name} value={stage.name}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {["roster", "champion", "runnerUp", "secondRunnerUp", "transfer"].includes(mode) ? (
            <div>
              <Label>Team</Label>
              <Select value={selectedTeamName} onValueChange={setSelectedTeamName}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Auto from standings" />
                </SelectTrigger>
                <SelectContent>
                  {participantRows.map((team) => (
                    <SelectItem key={team.name} value={team.name}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">Brand Logo (Top Left)</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Logo</Label>
                <Select value={manual.brandLogo || "core-default"} onValueChange={(v) => setManual((prev) => ({ ...prev, brandLogo: v === "core-default" ? "" : v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Core Esports" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core-default">Core Esports</SelectItem>
                    <SelectItem value="/images/Krafton.png">Krafton</SelectItem>
                    <SelectItem value="/images/pubg-mobile-world-cup-2026.webp">PUBG Mobile</SelectItem>
                    <SelectItem value="/images/Tencent Games.png">Tencent Games</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Brand Text Override</Label>
                <Input
                  value={manual.brandText}
                  onChange={(event) => setManual((prev) => ({ ...prev, brandText: event.target.value }))}
                  placeholder="Leave empty for default"
                />
              </div>
            </div>
          </div>

          {["bestIgl", "fmvp", "mvp"].includes(mode) ? (
            <div>
              <Label>Player</Label>
              <Select value={selectedPlayerKey} onValueChange={setSelectedPlayerKey}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Top ranked player" />
                </SelectTrigger>
                <SelectContent>
                  {playerOptions.map((player) => (
                    <SelectItem
                      key={`${player.player}-${player.teamName}`}
                      value={`${normalizeName(player.player)}::${normalizeName(player.teamName)}`}
                    >
                      {player.player} / {player.teamName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {mode === "news" ? (
            <div>
              <Label>Article</Label>
              <Select value={activeArticle?.id || ""} onValueChange={setSelectedArticleId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select article" />
                </SelectTrigger>
                <SelectContent>
                  {newsArticles.map((article) => (
                    <SelectItem key={article.id} value={article.id}>
                      {article.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ActiveModeIcon className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">{activeMode.label} Overrides</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Kicker</Label>
                <Input
                  value={manual.kicker}
                  onChange={(event) => setManual((prev) => ({ ...prev, kicker: event.target.value }))}
                  placeholder="Optional top label"
                />
              </div>
              <div>
                <Label>Headline</Label>
                <Input
                  value={manual.headline}
                  onChange={(event) => setManual((prev) => ({ ...prev, headline: event.target.value }))}
                  placeholder="Optional main headline"
                />
              </div>
              <div>
                <Label>Subhead</Label>
                <Input
                  value={manual.subhead}
                  onChange={(event) => setManual((prev) => ({ ...prev, subhead: event.target.value }))}
                  placeholder="Optional supporting line"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Stat Label</Label>
                  <Input
                    value={manual.statOneLabel}
                    onChange={(event) => setManual((prev) => ({ ...prev, statOneLabel: event.target.value }))}
                    placeholder="Finishes"
                  />
                </div>
                <div>
                  <Label>Stat Value</Label>
                  <Input
                    value={manual.statOneValue}
                    onChange={(event) => setManual((prev) => ({ ...prev, statOneValue: event.target.value }))}
                    placeholder="Auto"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Stat Label</Label>
                  <Input
                    value={manual.statTwoLabel}
                    onChange={(event) => setManual((prev) => ({ ...prev, statTwoLabel: event.target.value }))}
                    placeholder="Damage"
                  />
                </div>
                <div>
                  <Label>Stat Value</Label>
                  <Input
                    value={manual.statTwoValue}
                    onChange={(event) => setManual((prev) => ({ ...prev, statTwoValue: event.target.value }))}
                    placeholder="Auto"
                  />
                </div>
              </div>
              <div>
                <Label>Manual Team</Label>
                <Input
                  value={manual.teamName}
                  onChange={(event) => setManual((prev) => ({ ...prev, teamName: event.target.value }))}
                  placeholder="Overrides selected team"
                />
              </div>
              <div>
                <Label>Manual Player</Label>
                <Input
                  value={manual.playerName}
                  onChange={(event) => setManual((prev) => ({ ...prev, playerName: event.target.value }))}
                  placeholder="Overrides selected player"
                />
              </div>
              <div>
                <Label>Roster Override</Label>
                <Textarea
                  rows={4}
                  value={manual.rosterText}
                  onChange={(event) => setManual((prev) => ({ ...prev, rosterText: event.target.value }))}
                  placeholder="One player per line, or comma-separated"
                />
              </div>
              <Button type="button" variant="outline" className="w-full gap-2" onClick={() => setManual(MANUAL_FORM)}>
                <FileText className="size-4" />
                Clear Overrides
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">4:5 Preview</h3>
              <p className="text-xs text-muted-foreground">
                Export target is 1080 x 1350 PNG.
              </p>
            </div>
            <div className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
              {activeMode.label}
            </div>
          </div>
          <div ref={posterRef} className="overflow-auto rounded-2xl bg-secondary/40 p-4">
            <div style={{ width: 432, height: 540, transform: "scale(0.4)", transformOrigin: "top left" }}>
              {renderPoster()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

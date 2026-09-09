import React, { useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clipboard } from "lucide-react";
import { toPng } from "html-to-image";
import { base44 } from "@/api/base44Client";
import { getTournamentLogo } from "@/lib/tournamentBranding";
import {
  buildParticipantEntries,
  resolveTournamentParticipantState,
} from "@/lib/tournamentProgression";
import { decorateMatchesWithLiveStatus } from "@/lib/liveCalendar";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";

import { POSTER_CSS } from "./posters/posterStyles";
import { getPhaseParts, buildPosterOptions, getEntrySortValue } from "./posters/posterStageUtils";
import GroupGridPoster from "./posters/GroupGridPoster";
import StandingsPoster from "./posters/StandingsPoster";
import MvpCardPoster from "./posters/MvpCardPoster";
import FmvpCardPoster from "./posters/FmvpCardPoster";
import PodiumPoster from "./posters/PodiumPoster";
import SpecialAwardCardPoster from "./posters/SpecialAwardCardPoster";
import NewsPoster from "./posters/NewsPoster";
import Top5MvpPoster from "./posters/Top5MvpPoster";
import IgLCardPoster from "./posters/IgLCardPoster";
import SupportCardPoster from "./posters/SupportCardPoster";
import RookieCardPoster from "./posters/RookieCardPoster";
import PosterControls from "./posters/PosterControls";
import CustomTemplate from "./posters/CustomTemplate";
import { DEFAULT_CUSTOM_CONFIG } from "./posters/posterDefaultConfig";

export default function AdminStagePosters() {
  const [selectedOptionKey, setSelectedOptionKey] = useState("");
  const [posterMode, setPosterMode] = useState("grid");
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [customConfig, setCustomConfig] = useState(DEFAULT_CUSTOM_CONFIG);
  const posterRef = useRef(null);

  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ["admin-stage-posters-tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 100),
  });

  const posterTournaments = tournaments;

  const activeTournament = useMemo(() => {
    if (selectedTournamentId) {
      return posterTournaments.find((t) => t.id === selectedTournamentId) || null;
    }
    return posterTournaments[0] || tournaments[0] || null;
  }, [posterTournaments, selectedTournamentId, tournaments]);

  const { data: normalizedData } = useQuery({
    queryKey: ["admin-poster-normalized", activeTournament?.id],
    queryFn: () =>
      fetch(`/api/pages/tournament/${activeTournament.id}/core`).then((r) => r.json()),
    enabled: Boolean(activeTournament?.id),
  });

  const normalizedTournament = useMemo(() => {
    if (!normalizedData?.normalizedTournamentData) return activeTournament;
    const ntd = normalizedData.normalizedTournamentData;
    return {
      ...activeTournament,
      ...ntd.tournament,
      participants: ntd.participants || activeTournament.participants,
      stages: ntd.tournament?.stages || activeTournament.stages,
    };
  }, [activeTournament, normalizedData]);

  const { data: teams = [] } = useQuery({
    queryKey: ["admin-stage-posters-teams"],
    queryFn: () => base44.entities.Team.list("-total_points", 500),
  });

  const { data: newsArticles = [] } = useQuery({
    queryKey: ["admin-stage-posters-news"],
    queryFn: () => base44.entities.NewsArticle.list("-created_date", 10),
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["admin-stage-posters-matches", activeTournament?.id],
    queryFn: () => base44.entities.Match.filter({ tournament_id: activeTournament.id }, "-scheduled_time", 500),
    enabled: Boolean(activeTournament?.id),
  });

  const { data: rawMatchResults = [] } = useQuery({
    queryKey: ["admin-stage-posters-results", activeTournament?.id],
    queryFn: () => base44.entities.MatchResult.filter({ tournament_id: activeTournament.id }, "-created_date", 5000),
    enabled: Boolean(activeTournament?.id),
  });

  const matchResults = useMemo(() => filterPublishedMatchResults(rawMatchResults), [rawMatchResults]);

  const stageStandings = useMemo(() => {
    const ntd = normalizedData?.normalizedTournamentData;
    if (!ntd?.stages) return [];
    const result = [];
    for (const stage of ntd.stages) {
      const overall = stage?.standings?.overall || [];
      for (const entry of overall) {
        result.push({ ...entry, stage_name: stage.name || stage.stage_name || "" });
      }
    }
    return result;
  }, [normalizedData]);

  const participantState = useMemo(() => {
    if (!activeTournament) return { participantEntries: [], stageBoards: [] };
    const calendarMatches = decorateMatchesWithLiveStatus(matches, matchResults);
    return resolveTournamentParticipantState({
      tournament: activeTournament,
      teams,
      matches: calendarMatches,
      matchResults,
      participantEntries: buildParticipantEntries(activeTournament),
      stageNames: (activeTournament.stages || []).flatMap((s) => s?.name ? [s.name] : []),
      stageStandings,
    });
  }, [activeTournament, matchResults, matches, teams, stageStandings]);

  const posterOptions = useMemo(() => {
    const fromEntries = buildPosterOptions(participantState.participantEntries);
    const existingKeys = new Set(fromEntries.map(o => o.key));
    const fromBoards = (participantState.stageBoards || [])
      .filter(b => !existingKeys.has(`${b.name}::ALL`))
      .map(b => ({
        key: `${b.name}::ALL`,
        stage: b.name,
        group: "ALL",
        label: b.name,
      }));
    return [...fromEntries, ...fromBoards];
  }, [participantState.participantEntries, participantState.stageBoards]);

  const handlePosterModeChange = useCallback((mode) => {
    setPosterMode(mode);
    if (mode === "podium") {
      const gfOption = posterOptions.find(o => /grand\s*finals|main\s*tournament/i.test(o.stage) && o.group === "ALL");
      if (gfOption) setSelectedOptionKey(gfOption.key);
    }
  }, [posterOptions]);

  const activeOption = useMemo(() => {
    if (selectedOptionKey) {
      const selected = posterOptions.find((o) => o.key === selectedOptionKey);
      if (selected) return selected;
    }
    return posterOptions[posterOptions.length - 1] || posterOptions[0] || null;
  }, [posterOptions, selectedOptionKey]);

  const posterTeams = useMemo(() => {
    if (!activeOption) return [];
    if (activeOption.group === "ALL") {
      const board = participantState.stageBoards.find((b) => b.name === activeOption.stage);
      return (board?.standings || [])
        .toSorted((left, right) => (left.rank || 999) - (right.rank || 999))
        .map((row) => ({ team: row.teamName || row.team, phase: activeOption.stage }));
    }
    return participantState.participantEntries
      .filter((entry) => {
        const parts = getPhaseParts(entry.phase);
        return parts?.stage === activeOption.stage && parts?.group === activeOption.group;
      })
      .toSorted((left, right) => getEntrySortValue(left) - getEntrySortValue(right));
  }, [activeOption, participantState.participantEntries, participantState.stageBoards]);

  const standingsRows = useMemo(() => {
    if (!activeOption) return [];
    const board = participantState.stageBoards.find((b) => b.name === activeOption.stage);
    if (activeOption.group === "ALL") {
      return (board?.standings || [])
        .toSorted((left, right) => (left.rank || 999) - (right.rank || 999));
    }
    return (board?.standings || [])
      .filter((row) => String(row.group || "").toUpperCase() === activeOption.group)
      .toSorted((left, right) => (left.rank || 999) - (right.rank || 999));
  }, [activeOption, participantState.stageBoards]);

  const playerTeamMap = useMemo(() => {
    const map = {};
    const participants = normalizedTournament?.participants || [];
    participants.forEach((p) => {
      const teamName = typeof p === "string" ? p : p.team || p.name || "";
      const playerNames = Array.isArray(p.players)
        ? p.players
        : Array.isArray(p.player_names)
        ? p.player_names
        : [];
      playerNames.forEach((pl) => {
        const name = typeof pl === "string" ? pl : pl?.name || pl?.ign || "";
        if (name && !map[name.toLowerCase()]) {
          map[name.toLowerCase()] = teamName;
        }
      });
    });
    return map;
  }, [normalizedTournament?.participants]);

  const tournamentLogo = getTournamentLogo(activeTournament);
  const isPmgc = /pmgc|global\s*championship/i.test(activeTournament?.name);
  const nftTournamentLogo = isPmgc ? "/images/Global C.png" : tournamentLogo;

  const handleDownload = useCallback(async () => {
    if (!posterRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const el = posterRef.current.querySelector(".poster-custom") || posterRef.current.querySelector(".poster-root") || posterRef.current;

      await document.fonts.ready;

      const rect = el.getBoundingClientRect();
      const clone = el.cloneNode(true);
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = rect.width + "px";
      clone.style.height = rect.height + "px";
      clone.style.zIndex = "-1";
      clone.style.margin = "0";
      document.body.appendChild(clone);

      const origEls = [el, ...el.querySelectorAll("*")];
      const cloneEls = [clone, ...clone.querySelectorAll("*")];
      for (let i = 0; i < origEls.length && i < cloneEls.length; i++) {
        try {
          const computed = window.getComputedStyle(origEls[i]);
          for (let j = 0; j < computed.length; j++) {
            const prop = computed[j];
            const val = computed.getPropertyValue(prop);
            if (val) cloneEls[i].style.setProperty(prop, val);
          }
        } catch {}
      }

      let dataUrl;
      try {
        dataUrl = await toPng(clone, {
          width: Math.ceil(rect.width),
          height: Math.ceil(rect.height),
          pixelRatio: 3,
          backgroundColor: "#ffffff",
          cacheBust: true,
        });
      } finally {
        document.body.removeChild(clone);
      }

      const link = document.createElement("a");
      const slug = posterMode === "mvp"
        ? "mvp-card"
        : posterMode === "fmvp"
        ? "fmvp-card"
        : posterMode === "podium"
        ? "podium"
        : posterMode === "custom"
        ? "custom-poster"
        : (activeOption?.label || "poster").replace(/\s+/g, "-").toLowerCase();
      link.download = `${slug}-poster.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Poster export failed:", err);
      alert("Export failed: " + (err.message || err.toString()));
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, activeOption, posterMode]);

  const [selectedNewsIndex, setSelectedNewsIndex] = useState(0);

  const handleSelectTournament = (id) => {
    setSelectedTournamentId(id);
    setSelectedOptionKey("");
  };

  const handleCopyTeams = async () => {
    if (!navigator.clipboard || posterTeams.length === 0) return;
    try {
      await navigator.clipboard.writeText(
        posterTeams.map((entry, i) => `${i + 1}. ${entry.team}`).join("\n"),
      );
    } catch (err) {
      console.error("Clipboard write failed:", err);
    }
  };

  if (tournamentsLoading) {
    return (
      <div className="rounded-[24px] border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading poster data from tournament stages.
      </div>
    );
  }

  return (
    <div className="space-y-5 poster-root">
      <style>{POSTER_CSS}</style>

      <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">Poster generator</p>
            <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em] text-foreground">
              {activeTournament?.name || "Tournament"} posters
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Generate shareable standings, group-grid, and MVP posters from live stage data.
              Download as high-res PNG for social media.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopyTeams}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              <Clipboard className="size-3.5" />
              Copy teams
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[18rem_1fr]">
          <PosterControls
            activeOption={activeOption}
            posterOptions={posterOptions}
            onSelectOption={setSelectedOptionKey}
            posterMode={posterMode}
            onPosterModeChange={handlePosterModeChange}
            posterTeams={posterTeams}
            standingsRows={standingsRows}
            onDownload={handleDownload}
            isDownloading={isDownloading}
            posterTournaments={posterTournaments}
            selectedTournamentId={selectedTournamentId || activeTournament?.id}
            onSelectTournament={handleSelectTournament}
            teams={teams}
            newsArticles={newsArticles}
            selectedNewsIndex={selectedNewsIndex}
            onSelectNews={setSelectedNewsIndex}
            normalizedTournament={normalizedTournament}
            playerTeamMap={playerTeamMap}
            customConfig={customConfig}
            onCustomConfigChange={setCustomConfig}
          />

          <div className="overflow-x-auto rounded-[28px] border border-border bg-white p-5 flex justify-center">
            <div ref={posterRef}>
              {posterMode === "standings" ? (
                <StandingsPoster
                  activeOption={activeOption}
                  standingsRows={standingsRows}
                  tournament={normalizedTournament}
                  tournamentLogo={tournamentLogo}
                />
              ) : posterMode === "podium" ? (
                <PodiumPoster
                  standingsRows={standingsRows}
                  tournament={normalizedTournament}
                  tournamentLogo={tournamentLogo}
                  teams={teams}
                  playerTeamMap={playerTeamMap}
                />
              ) : posterMode === "mvp" ? (
                <MvpCardPoster
                  tournament={normalizedTournament}
                  tournamentLogo={nftTournamentLogo}
                  playerTeamMap={playerTeamMap}
                />
              ) : posterMode === "fmvp" ? (
                <FmvpCardPoster
                  tournament={normalizedTournament}
                  tournamentLogo={nftTournamentLogo}
                  playerTeamMap={playerTeamMap}
                />
              ) : posterMode === "top5mvp" ? (
                <Top5MvpPoster
                  tournament={normalizedTournament}
                  tournamentLogo={tournamentLogo}
                  playerTeamMap={playerTeamMap}
                />
              ) : posterMode === "igl" ? (
                <IgLCardPoster
                  tournament={normalizedTournament}
                  tournamentLogo={nftTournamentLogo}
                  playerTeamMap={playerTeamMap}
                />
              ) : posterMode === "support" ? (
                <SupportCardPoster
                  tournament={normalizedTournament}
                  tournamentLogo={nftTournamentLogo}
                  playerTeamMap={playerTeamMap}
                />
              ) : posterMode === "rookie" ? (
                <RookieCardPoster
                  tournament={normalizedTournament}
                  tournamentLogo={nftTournamentLogo}
                  playerTeamMap={playerTeamMap}
                />
              ) : posterMode === "eagle_eye" ? (
                <SpecialAwardCardPoster
                  tournament={normalizedTournament}
                  tournamentLogo={nftTournamentLogo}
                  playerTeamMap={playerTeamMap}
                  awardTitle="Eagle Eye"
                />
              ) : posterMode === "grenade_master" ? (
                <SpecialAwardCardPoster
                  tournament={normalizedTournament}
                  tournamentLogo={nftTournamentLogo}
                  playerTeamMap={playerTeamMap}
                  awardTitle="Grenade Master"
                />
              ) : posterMode === "field_medic" ? (
                <SpecialAwardCardPoster
                  tournament={normalizedTournament}
                  tournamentLogo={nftTournamentLogo}
                  playerTeamMap={playerTeamMap}
                  awardTitle="Field Medic"
                />
              ) : posterMode === "best_clutch" ? (
                <SpecialAwardCardPoster
                  tournament={normalizedTournament}
                  tournamentLogo={nftTournamentLogo}
                  playerTeamMap={playerTeamMap}
                  awardTitle="Best Clutch"
                />
              ) : posterMode === "eliminator" ? (
                <SpecialAwardCardPoster
                  tournament={normalizedTournament}
                  tournamentLogo={nftTournamentLogo}
                  playerTeamMap={playerTeamMap}
                  awardTitle="The Eliminator"
                />
              ) : posterMode === "news" ? (
                <NewsPoster
                  article={newsArticles[selectedNewsIndex] || null}
                  tournamentLogo={tournamentLogo}
                />
              ) : posterMode === "custom" ? (
                <CustomTemplate
                  tournament={normalizedTournament}
                  tournamentLogo={tournamentLogo}
                  playerTeamMap={playerTeamMap}
                  config={customConfig}
                  standingsRows={standingsRows}
                />
              ) : (
                <GroupGridPoster
                  activeOption={activeOption}
                  posterTeams={posterTeams}
                  tournament={activeTournament}
                  tournamentLogo={tournamentLogo}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

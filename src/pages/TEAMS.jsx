import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import EmptyState from "../components/shared/EmptyState";
import LogoBlock from "../components/shared/LogoBlock";
import TeamDetail from "../components/teams/TeamDetail";
import { base44 } from "@/api/base44Client";
import { getTeamLogoByName } from "@/lib/teamLogos";
import { buildLiveRoster } from "@/lib/rosterUtils";
import {
  normalizeOrganizationName,
} from "@/lib/organizationIdentity";
import {
  buildTeamAliasIndex,
  getOrganizationMetaFromAliases,
  resolveTeamByAlias,
} from "@/lib/normalizedIdentity";

function LightPanel({ className = "", children }) {
  return (
    <div
      className={`rounded-[28px] border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

const BMPS_TOURNAMENT_NAME = "Battlegrounds Mobile India Pro Series 2026";

function getTeamCardLogo(name, fallbackLogo) {
  return getTeamLogoByName(name) || fallbackLogo || null;
}

export default function Teams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list("-total_points", 400),
  });

  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list("-created_date", 500),
  });

  const { data: transferWindows = [], isLoading: transfersLoading } = useQuery({
    queryKey: ["transfer-windows"],
    queryFn: () => base44.entities.TransferWindow.list("-date", 500),
  });

  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 100),
  });
  const { data: teamAliases = [], isLoading: teamAliasesLoading } = useQuery({
    queryKey: ["team-aliases"],
    queryFn: () => base44.entities.TeamAlias.list("-created_date", 2000),
  });

  const isLoading =
    teamsLoading || playersLoading || transfersLoading || tournamentsLoading || teamAliasesLoading;

  const teamAliasIndex = useMemo(
    () => buildTeamAliasIndex(teams, teamAliases),
    [teamAliases, teams]
  );

  useEffect(() => {
    const nextSearch =
      searchParams.get("team") ||
      searchParams.get("player") ||
      searchParams.get("q") ||
      "";
    setSearch(nextSearch);
  }, [searchParams]);

  const bmpsTournament = useMemo(
    () => tournaments.find((tournament) => tournament.name === BMPS_TOURNAMENT_NAME) || null,
    [tournaments]
  );

  const teamCards = useMemo(() => {
    const participants = Array.isArray(bmpsTournament?.participants)
      ? bmpsTournament.participants
      : [];

    const mergedTransfers = transferWindows.flatMap((window) =>
      Array.isArray(window?.entries) ? window.entries : []
    );

    const byKey = new Map();

    participants.forEach((participant, index) => {
      const resolvedTeam = resolveTeamByAlias(participant.team, teamAliasIndex);
      const meta = getOrganizationMetaFromAliases(participant.team, teamAliasIndex);
      const matchingTeams = resolvedTeam
        ? teams.filter((team) => team.id === resolvedTeam.id)
        : teams.filter(
            (team) => getOrganizationMetaFromAliases(team, teamAliasIndex).key === meta.key
          );
      const representative = resolvedTeam || matchingTeams[0] || null;
      const representativeIds = matchingTeams.length > 0
        ? matchingTeams.map((entry) => entry.id)
        : representative?.id
          ? [representative.id]
          : [];
      const dbAliases = teamAliases
        .filter((alias) => representativeIds.includes(alias.team_id))
        .map((alias) => alias.alias);

      const liveRoster = buildLiveRoster({
        teamName: meta.name,
        normalizedTeam: normalizeOrganizationName,
        teamIds: representativeIds,
        players,
        transferEntries: mergedTransfers,
      });

      const participantRoster = Array.isArray(participant.players)
        ? participant.players.map((player) =>
            typeof player === "string" ? player : player?.name
          )
        : [];

      const totalMatches = matchingTeams.reduce(
        (sum, team) => sum + (Number(team.matches_played) || 0),
        0
      );

      byKey.set(meta.key, {
        key: meta.key,
        order: index,
        id: representative?.id || meta.key,
        name: meta.name,
        tag: meta.tag,
        logoUrl: getTeamCardLogo(meta.name, representative?.logo_url),
        representativeIds,
        aliases: [...new Set([...matchingTeams.flatMap((entry) => entry.aliases || []), ...dbAliases])],
        matches_played: totalMatches,
        roster:
          liveRoster.length > 0
            ? liveRoster
            : participantRoster.filter(Boolean),
        participant,
      });
    });

    return [...byKey.values()].sort((a, b) => a.order - b.order);
  }, [bmpsTournament, players, teamAliasIndex, teamAliases, teams, transferWindows]);

  const selectedTeam = useMemo(() => {
    const requestedTeam = searchParams.get("team");
    if (!requestedTeam) return null;
    const targetKey = getOrganizationMetaFromAliases(requestedTeam, teamAliasIndex).key;
    return teamCards.find((card) => card.key === targetKey) || null;
  }, [searchParams, teamAliasIndex, teamCards]);

  const selectedParticipant = useMemo(() => {
    if (!selectedTeam?.participant) return null;
    return {
      ...selectedTeam.participant,
      seed: "Invited",
      badges: ["Main", "Staff"],
      roster: (selectedTeam.roster || []).map((player, index) => ({
        name: player,
        country: "India",
        captain: index === 0,
      })),
    };
  }, [selectedTeam]);

  const handleBackFromTeam = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("team");
    setSearchParams(next);
  };

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();

    return teamCards.filter((card) => {
      if (!query) return true;

      return (
        card.name.toLowerCase().includes(query) ||
        (card.tag || "").toLowerCase().includes(query) ||
        (card.aliases || []).some((alias) => String(alias || "").toLowerCase().includes(query)) ||
        card.roster.some((player) => player.toLowerCase().includes(query))
      );
    });
  }, [search, teamCards]);

  const rosterCount = useMemo(
    () =>
      teamCards.reduce((sum, card) => sum + (Array.isArray(card.roster) ? card.roster.length : 0), 0),
    [teamCards]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Loading teams
        </p>
      </div>
    );
  }

  if (selectedTeam) {
    return (
      <TeamDetail
        team={{
          id: selectedTeam.id,
          name: selectedTeam.name,
          tag: selectedTeam.tag,
          logo_url: selectedTeam.logoUrl,
          representativeIds: selectedTeam.representativeIds,
          aliases: selectedTeam.aliases,
          matches_played: selectedTeam.matches_played,
        }}
        participant={selectedParticipant}
        onBack={handleBackFromTeam}
      />
    );
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="overflow-hidden rounded-[34px] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,243,235,0.96))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.16),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(17,24,39,0.98))]"
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
              BMPS 2026
            </p>
            <h1 className="mt-2 text-3xl font-heading font-black tracking-[-0.04em] text-foreground md:text-4xl">
              TEAMS
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              The complete BMPS 2026 lineup in one directory, with live team names,
              updated logos, and active roster visibility pulled into the page flow.
            </p>
          </div>

          <LightPanel className="p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Shield,
                  label: "Teams",
                  value: teamCards.length,
                },
                {
                  icon: Users,
                  label: "Roster spots",
                  value: rosterCount,
                },
                {
                  icon: Search,
                  label: "Search ready",
                  value: "Live",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[22px] border border-border/70 bg-background/75 p-4"
                >
                  <stat.icon className="h-4 w-4 text-primary" />
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-foreground">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </LightPanel>
        </div>
      </motion.section>

      <LightPanel className="p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Team directory
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-foreground">
              BMPS 2026 cards
            </h2>
          </div>

          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by team, tag, or player"
              className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </div>
      </LightPanel>

      {filteredCards.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams found"
          description="Try a different search and the BMPS 2026 roster list will update."
        />
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCards.map((card, index) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="overflow-hidden rounded-[24px] border border-border/70 bg-card p-5 shadow-[0_16px_42px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center gap-3">
                {card.logoUrl ? (
                  <LogoBlock
                    src={card.logoUrl}
                    alt={card.name}
                    sizeClass="h-14 w-14"
                    roundedClass="rounded-2xl"
                    paddingClass="p-2.5"
                    className="bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.14),rgba(255,255,255,0.98)_72%,rgba(248,243,235,0.98)_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.18),rgba(27,27,31,0.98)_72%,rgba(17,24,39,1)_100%)]"
                  />
                ) : (
                  <LogoBlock
                    sizeClass="h-14 w-14"
                    roundedClass="rounded-2xl"
                    paddingClass="p-2.5"
                    className="bg-primary/10 border-primary/10"
                  >
                    <span className="text-base font-black uppercase text-primary">
                      {card.name.slice(0, 3)}
                    </span>
                  </LogoBlock>
                )}

                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-lg font-bold text-foreground">
                    <button
                      type="button"
                      onClick={() => setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.set("team", card.name);
                        return next;
                      })}
                      className="text-left transition-colors hover:text-primary"
                    >
                      {card.name}
                    </button>
                  </h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {card.tag || "BMPS"} | India
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[18px] border border-border/70 bg-background/75 px-3 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                  Active roster
                </p>
                <div className="mt-3 space-y-2">
                  {card.roster.map((player) => (
                    <Link
                      key={`${card.key}-${player}`}
                      to={`/players/${encodeURIComponent(player)}?team=${encodeURIComponent(card.name)}`}
                      className="block rounded-[14px] border border-border/70 bg-card/80 px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                    >
                      {player}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </section>
      )}
    </div>
  );
}

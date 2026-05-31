import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Shield, Users } from "lucide-react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import EmptyState from "../components/shared/EmptyState";
import LogoBlock from "../components/shared/LogoBlock";
import TeamDetail from "../components/teams/TeamDetail";
import { base44 } from "@/api/base44Client";
import {
  getTeamLogoByName,
  getTeamLogoSurfaceTone,
  isWideTeamLogo,
} from "@/lib/teamLogos";
import { buildLiveRoster } from "@/lib/rosterUtils";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import {
  buildTeamAliasIndex,
  getOrganizationMetaFromAliases,
  resolveTeamByAlias,
} from "@/lib/normalizedIdentity";
import { getPlayerDisplayName } from "@/lib/playerDisplayName";

function LightPanel({ className = "", children }) {
  return (
    <div
      className={`rounded-lg border border-border/70 bg-card shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

const BMPS_TOURNAMENT_NAME = "Battlegrounds Mobile India Pro Series 2026";

function getTeamCardLogo(name, fallbackLogo) {
  return getTeamLogoByName(name) || fallbackLogo || null;
}

function getTeamsPageLogoPresentation(name) {
  if (isWideTeamLogo(name)) {
    return {
      paddingClass: "p-1.5",
      imgClassName: "scale-[1.18]",
    };
  }

  return {
    paddingClass: "p-2.5",
    imgClassName: "",
  };
}

function TeamsHero({ teamCount, rosterCount }) {
  const stats = [
    { icon: Shield, label: "Teams", value: teamCount },
    { icon: Users, label: "Roster spots", value: rosterCount },
    { icon: Search, label: "Search ready", value: "Live" },
  ];

  return (
    <m.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
            BMPS 2026
          </p>
          <h1 className="mt-1 text-2xl font-heading font-semibold text-foreground md:text-3xl">
            TEAMS
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Complete BMPS 2026 team directory with active roster visibility.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[440px]">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5"
            >
              <stat.icon className="size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-lg font-black uppercase text-foreground">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </m.section>
  );
}

function TeamDirectoryHeader({ search, setSearch }) {
  return (
    <LightPanel className="p-3 md:p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_minmax(280px,420px)] md:items-center">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
            Team directory
          </p>
          <h2 className="mt-1 text-xl font-semibold uppercase text-foreground">
            BMPS 2026 roster list
          </h2>
        </div>

        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by team, tag, or player"
            aria-label="Search teams"
            className="h-10 w-full rounded-md border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
      </div>
    </LightPanel>
  );
}

function TeamCard({ card, index, onOpenTeam }) {
  const logoPresentation = getTeamsPageLogoPresentation(card.name);

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="overflow-hidden rounded-lg border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/35 md:grid md:grid-cols-[180px_1fr] md:items-center md:gap-3"
    >
      <div className="flex min-w-0 items-center gap-3">
        {card.logoUrl ? (
          <LogoBlock
            src={card.logoUrl}
            alt={card.name}
            sizeClass="size-12"
            roundedClass="rounded-md"
            paddingClass={logoPresentation.paddingClass}
            imgClassName={logoPresentation.imgClassName}
            surfaceTone={getTeamLogoSurfaceTone(card.name)}
            className="bg-background"
          />
        ) : (
          <LogoBlock
            sizeClass="size-12"
            roundedClass="rounded-md"
            paddingClass="p-2.5"
            className="bg-primary/10 border-primary/10"
          >
            <span className="text-base font-black uppercase text-primary">
              {card.name.slice(0, 3)}
            </span>
          </LogoBlock>
        )}

        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold leading-snug text-foreground">
            <button
              type="button"
              onClick={() => onOpenTeam(card.name)}
              title={card.name}
              className="block max-w-full truncate text-left transition-colors hover:text-primary"
            >
              {card.name}
            </button>
          </h2>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {card.tag || "BMPS"} | India
          </p>
        </div>
      </div>

      <div className="mt-3 border-t border-border pt-3 md:mt-0 md:flex md:min-w-0 md:items-center md:gap-3 md:border-t-0 md:pt-0">
        <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          Active roster
        </p>
        <div className="mt-2 flex min-w-0 flex-wrap gap-x-4 gap-y-1.5 md:mt-0">
          {card.roster.map((player) => (
            <Link
              key={`${card.key}-${player}`}
              to={`/players/${encodeURIComponent(player)}?team=${encodeURIComponent(card.name)}`}
              className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
            >
              <span className="size-1 rounded-full bg-primary/60" />
              <span className="truncate">{getPlayerDisplayName(player)}</span>
            </Link>
          ))}
        </div>
      </div>
    </m.div>
  );
}

function TeamCardGrid({ cards, onOpenTeam }) {
  if (cards.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No teams found"
        description="Try a different search and the BMPS 2026 roster list will update."
      />
    );
  }

  return (
    <section className="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
      {cards.map((card, index) => (
        <TeamCard
          key={card.key}
          card={card}
          index={index}
          onOpenTeam={onOpenTeam}
        />
      ))}
    </section>
  );
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
    teamsLoading ||
    playersLoading ||
    transfersLoading ||
    tournamentsLoading ||
    teamAliasesLoading;

  const teamAliasIndex = useMemo(
    () => buildTeamAliasIndex(teams, teamAliases),
    [teamAliases, teams],
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
    () =>
      tournaments.find(
        (tournament) => tournament.name === BMPS_TOURNAMENT_NAME,
      ) || null,
    [tournaments],
  );

  const teamCards = useMemo(() => {
    const participants = Array.isArray(bmpsTournament?.participants)
      ? bmpsTournament.participants
      : [];

    const mergedTransfers = transferWindows.flatMap((window) =>
      Array.isArray(window?.entries) ? window.entries : [],
    );

    const participantMetaByKey = new Map();
    const byKey = new Map();

    participants.forEach((participant, index) => {
      const meta = getOrganizationMetaFromAliases(
        participant.team,
        teamAliasIndex,
      );
      participantMetaByKey.set(meta.key, {
        participant,
        participantOrder: index,
        participantRoster: Array.isArray(participant.players)
          ? participant.players
              .flatMap((player) => {
                const name =
                  typeof player === "string" ? player : player?.name;
                return name ? [name] : [];
              })
          : [],
      });
    });

    const candidateTeams = teams.filter((team) =>
      participantMetaByKey.has(team.id),
    );
    const shouldUseParticipantFallback = candidateTeams.length === 0;

    const buildCard = (teamLike, fallbackOrder = Number.MAX_SAFE_INTEGER) => {
      const resolvedTeam =
        typeof teamLike === "string"
          ? resolveTeamByAlias(teamLike, teamAliasIndex)
          : teamLike;
      const meta = getOrganizationMetaFromAliases(teamLike, teamAliasIndex);
      const participantMeta = participantMetaByKey.get(meta.key) || null;
      const matchingTeams = resolvedTeam
        ? teams.filter((team) => team.id === resolvedTeam.id)
        : teams.filter(
            (team) =>
              getOrganizationMetaFromAliases(team, teamAliasIndex).key ===
              meta.key,
          );
      const representative = resolvedTeam || matchingTeams[0] || null;
      const representativeIds =
        matchingTeams.length > 0
          ? matchingTeams.map((entry) => entry.id)
          : representative?.id
            ? [representative.id]
            : [];
      const dbAliases = teamAliases.flatMap((alias) =>
        representativeIds.includes(alias.team_id) && alias.alias
          ? [alias.alias]
          : [],
      );

      const liveRoster = buildLiveRoster({
        teamName: meta.name,
        normalizedTeam: normalizeOrganizationName,
        teamIds: representativeIds,
        players,
        transferEntries: mergedTransfers,
        applyOverride: undefined,
      });

      const totalMatches = matchingTeams.reduce(
        (sum, team) => sum + (Number(team.matches_played) || 0),
        0,
      );

      byKey.set(meta.key, {
        key: meta.key,
        order: participantMeta?.participantOrder ?? fallbackOrder,
        id: representative?.id || meta.key,
        name: meta.name,
        tag: meta.tag,
        logoUrl: getTeamCardLogo(meta.name, representative?.logo_url),
        representativeIds,
        aliases: [
          ...new Set([
            ...matchingTeams.flatMap((entry) => entry.aliases || []),
            ...dbAliases,
          ]),
        ],
        matches_played: totalMatches,
        roster:
          liveRoster.length > 0
            ? liveRoster
            : participantMeta?.participantRoster || [],
        participant: participantMeta?.participant || null,
      });
    };

    if (shouldUseParticipantFallback) {
      participants.forEach((participant, index) => {
        buildCard(participant.team, index);
      });
    } else {
      candidateTeams.forEach((team) => {
        buildCard(team);
      });
    }

    return Array.from(byKey.values()).toSorted((a, b) => {
      const nameCompare = a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
      });
      if (nameCompare !== 0) return nameCompare;
      return a.order - b.order;
    });
  }, [
    bmpsTournament,
    players,
    teamAliasIndex,
    teamAliases,
    teams,
    transferWindows,
  ]);

  const selectedTeam = useMemo(() => {
    const requestedTeam = searchParams.get("team");
    if (!requestedTeam) return null;
    const targetKey = getOrganizationMetaFromAliases(
      requestedTeam,
      teamAliasIndex,
    ).key;
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
  const openTeam = (teamName) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("team", teamName);
      return next;
    });
  };

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();

    return teamCards.filter((card) => {
      if (!query) return true;

      return (
        card.name.toLowerCase().includes(query) ||
        (card.tag || "").toLowerCase().includes(query) ||
        (card.aliases || []).some((alias) =>
          String(alias || "")
            .toLowerCase()
            .includes(query),
        ) ||
        card.roster.some((player) => player.toLowerCase().includes(query))
      );
    });
  }, [search, teamCards]);

  const rosterCount = useMemo(
    () =>
      teamCards.reduce(
        (sum, card) =>
          sum + (Array.isArray(card.roster) ? card.roster.length : 0),
        0,
      ),
    [teamCards],
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
    <LazyMotion features={domAnimation}>
      <div className="mx-auto w-full max-w-[1680px] space-y-4">
        <TeamsHero teamCount={teamCards.length} rosterCount={rosterCount} />
        <TeamDirectoryHeader search={search} setSearch={setSearch} />
        <TeamCardGrid cards={filteredCards} onOpenTeam={openTeam} />
      </div>
    </LazyMotion>
  );
}

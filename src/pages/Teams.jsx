import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Shield, Users } from "lucide-react";
import { m } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import EmptyState from "../components/shared/EmptyState";
import LogoBlock from "../components/shared/LogoBlock";
import TeamDetail from "../components/teams/TeamDetail";
import PageHeader from "@/components/shared/PageHeader";
import PageSkeleton from "@/components/shared/PageSkeleton";
import SearchInput from "@/components/shared/SearchInput";
import StatCard from "@/components/shared/StatCard";
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
import { getOfficialParticipantEntries } from "@/lib/tournamentParticipants";

const BMPS_TOURNAMENT_NAME = "Battlegrounds Mobile India Pro Series 2026";
const EMPTY_TEAMS_PAGE_ARRAY = [];

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

function TeamsHero({ teamCount, rosterCount, matchesPlayed, eventName }) {
  return (
    <PageHeader
      kicker={eventName}
      title="Teams"
      description={`Team directory for ${eventName}, with active rosters and career records.`}
      className="rounded-xl border border-border bg-card p-4 md:p-5"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-[560px]">
        <StatCard icon={Shield} label="Teams" value={teamCount} />
        <StatCard icon={Users} label="Roster spots" value={rosterCount} tone="neutral" />
        <StatCard
          icon={Search}
          label="Matches played"
          value={matchesPlayed}
          tone="neutral"
          className="col-span-2 sm:col-span-1"
        />
      </div>
    </PageHeader>
  );
}

function TeamDirectoryHeader({ search, setSearch }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 md:p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_minmax(280px,420px)] md:items-center">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
            Team directory
          </p>
          <h2 className="mt-1 text-xl font-semibold uppercase text-foreground">
            Full roster list
          </h2>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by team, tag, or player"
          ariaLabel="Search teams"
        />
      </div>
    </div>
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
              className="flex min-h-11 max-w-full items-center truncate text-left transition-colors hover:text-primary"
            >
              {card.name}
            </button>
          </h2>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {[card.tag, card.region].filter(Boolean).join(" · ") || "BGMI"}
          </p>
        </div>
      </div>

      <div className="mt-3 border-t border-border pt-3 md:mt-0 md:min-w-0 md:border-t-0 md:pt-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          {card.matches_played ? (
            <span>
              Matches <span className="font-semibold text-foreground">{card.matches_played}</span>
            </span>
          ) : null}
          {card.total_points ? (
            <span>
              Points <span className="font-semibold text-foreground">{card.total_points}</span>
            </span>
          ) : null}
          {card.total_kills ? (
            <span>
              Kills <span className="font-semibold text-foreground">{card.total_kills}</span>
            </span>
          ) : null}
        </div>

        <p className="mt-3 shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          Active roster
        </p>
        <div className="mt-2 flex min-w-0 flex-wrap gap-x-4 gap-y-1.5">
          {card.roster.length > 0 ? (
            card.roster.map((player) => (
              <Link
                key={`${card.key}-${player}`}
                to={`/players/${encodeURIComponent(player)}?team=${encodeURIComponent(card.name)}`}
                className="inline-flex min-h-11 min-w-0 items-center gap-1.5 text-xs font-medium text-foreground transition-colors hover:text-primary"
              >
                <span className="size-1 rounded-full bg-primary/60" />
                <span className="truncate">{getPlayerDisplayName(player)}</span>
              </Link>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">Roster not published</span>
          )}
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

  const { data: teamsPage = {}, isLoading } = useQuery({
    queryKey: ["teams-page"],
    queryFn: () => base44.pages.teams(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const teams = teamsPage.teams || EMPTY_TEAMS_PAGE_ARRAY;
  const players = teamsPage.players || EMPTY_TEAMS_PAGE_ARRAY;
  const transferWindows = teamsPage.transferWindows || EMPTY_TEAMS_PAGE_ARRAY;
  const tournaments = teamsPage.tournaments || EMPTY_TEAMS_PAGE_ARRAY;
  const teamAliases = teamsPage.teamAliases || EMPTY_TEAMS_PAGE_ARRAY;

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
    const participants = bmpsTournament
      ? getOfficialParticipantEntries(bmpsTournament)
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
      const totalPoints = matchingTeams.reduce(
        (sum, team) => sum + (Number(team.total_points) || 0),
        0,
      );
      const totalKills = matchingTeams.reduce(
        (sum, team) => sum + (Number(team.total_kills) || 0),
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
        total_points: totalPoints,
        total_kills: totalKills,
        region: representative?.region || null,
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
    const card = teamCards.find((entry) => entry.key === targetKey);
    if (card) return card;
    // Deep links also address historical/international seed teams that are not
    // entrants in the directory's featured tournament. Do not drop their detail.
    const team = resolveTeamByAlias(requestedTeam, teamAliasIndex);
    if (!team) return null;
    const meta = getOrganizationMetaFromAliases(team, teamAliasIndex);
    return {
      ...team,
      name: meta.name,
      tag: meta.tag,
      logoUrl: getTeamCardLogo(meta.name, team.logo_url),
      representativeIds: [team.id],
      aliases: team.aliases || [],
    };
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

  const matchesPlayed = useMemo(
    () => teamCards.reduce((sum, card) => sum + (Number(card.matches_played) || 0), 0),
    [teamCards],
  );

  if (isLoading) {
    return <PageSkeleton label="Loading teams" rows={6} />;
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
    <div className="mx-auto w-full max-w-[1680px] space-y-4">
      <TeamsHero
        teamCount={teamCards.length}
        rosterCount={rosterCount}
        matchesPlayed={matchesPlayed}
        eventName={bmpsTournament?.name || "BGMI Circuit"}
      />
      <TeamDirectoryHeader search={search} setSearch={setSearch} />
      <TeamCardGrid cards={filteredCards} onOpenTeam={openTeam} />
    </div>
  );
}

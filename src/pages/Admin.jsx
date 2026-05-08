import React, { useState } from "react";
import { Shield, Trophy, Users, Swords, FileText, Newspaper, ArrowRightLeft, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AdminTournaments from "../components/admin/AdminTournaments";
import AdminTeams from "../components/admin/AdminTeams";
import AdminMatches from "../components/admin/AdminMatches";
import AdminResults from "../components/admin/ADMINRESULTS";
import AdminNews from "../components/admin/AdminNews";
import AdminTransfers from "../components/admin/AdminTransfers";
import AdminInspector from "../components/admin/AdminInspector";
import { getOrganizationMeta } from "@/lib/organizationIdentity";
import { getTeamLogoByName } from "@/lib/teamLogos";

const tabs = [
  { id: "tournaments", label: "Tournaments", icon: Trophy },
  { id: "teams", label: "Teams", icon: Users },
  { id: "matches", label: "Matches", icon: Swords },
  { id: "results", label: "Results", icon: FileText },
  { id: "transfers", label: "Transfers", icon: ArrowRightLeft },
  { id: "news", label: "News", icon: Newspaper },
  { id: "inspector", label: "Inspector", icon: Database },
];

const TAB_DESCRIPTIONS = {
  tournaments: "Create tournament shells, stage structures, prize pools, and event metadata.",
  teams: "Manage organizations, player links, roster identity, and logo coverage.",
  matches: "Control scheduled lobbies, maps, groups, and stage-by-stage match setup.",
  results: "Enter and revise match outcomes so standings and team stats stay accurate.",
  transfers: "Track roster windows, IN / OUT moves, and active lineup adjustments.",
  news: "Publish announcements, tournament stories, and update notes for the frontend feed.",
  inspector: "Inspect live backend tournament payloads, match wiring, and result coverage without guessing from frontend views.",
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState("tournaments");
  const { data: tournaments = [] } = useQuery({
    queryKey: ["admin-tournaments-count"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 100),
  });
  const { data: teams = [] } = useQuery({
    queryKey: ["admin-teams-count"],
    queryFn: () => base44.entities.Team.list("-created_date", 200),
  });
  const { data: matches = [] } = useQuery({
    queryKey: ["admin-matches-count"],
    queryFn: () => base44.entities.Match.list("-created_date", 500),
  });
  const { data: news = [] } = useQuery({
    queryKey: ["admin-news-count"],
    queryFn: () => base44.entities.NewsArticle.list("-created_date", 200),
  });
  const { data: transfers = [] } = useQuery({
    queryKey: ["admin-transfers-count"],
    queryFn: () => base44.entities.TransferWindow.list("-date", 300),
  });
  const activeTournaments = tournaments.filter((tournament) => tournament.status !== "completed");
  const duplicateOrgCount = (() => {
    const buckets = new Map();
    teams.forEach((team) => {
      const key = getOrganizationMeta(team).key;
      const current = buckets.get(key) || 0;
      buckets.set(key, current + 1);
    });
    return [...buckets.values()].filter((count) => count > 1).length;
  })();
  const activeParticipants = activeTournaments.flatMap((tournament) =>
    Array.isArray(tournament.participants) ? tournament.participants : []
  );
  const missingLogoCount = [...new Set(activeParticipants.map((entry) => entry?.team).filter(Boolean))].filter(
    (name) => !getTeamLogoByName(name)
  ).length;
  const unresolvedParticipantCount = activeParticipants.filter((entry) => {
    const targetKey = getOrganizationMeta(entry?.team).key;
    return !teams.some((team) => getOrganizationMeta(team).key === targetKey);
  }).length;

  const overviewCards = [
    { label: "Tournaments", value: activeTournaments.length, icon: Trophy },
    { label: "Teams", value: teams.length, icon: Users },
    { label: "Matches", value: matches.length, icon: Swords },
    { label: "Stories", value: news.length, icon: Newspaper },
    { label: "Transfers", value: transfers.length, icon: ArrowRightLeft },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
            Control room
          </p>
          <h1 className="text-2xl font-heading font-bold tracking-wide">ADMIN PANEL</h1>
          <p className="text-sm text-muted-foreground">Manage tournaments, teams, matches, transfers, and editorial content.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {overviewCards.map((card) => (
          <div key={card.label} className="rounded-[20px] border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{card.label}</p>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-black text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Data health
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-foreground">
              Live integrity checks
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Quick visibility into duplicate orgs, unresolved participant links, and missing logos before those issues show up in public pages.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-[20px] border border-border bg-secondary/35 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Duplicate org rows</p>
            <p className="mt-3 text-2xl font-black text-foreground">{duplicateOrgCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Multiple team records collapsing to the same organization.</p>
          </div>
          <div className="rounded-[20px] border border-border bg-secondary/35 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Unresolved participants</p>
            <p className="mt-3 text-2xl font-black text-foreground">{unresolvedParticipantCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Active tournament participant names that do not map to a live team row.</p>
          </div>
          <div className="rounded-[20px] border border-border bg-secondary/35 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Missing logos</p>
            <p className="mt-3 text-2xl font-black text-foreground">{missingLogoCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Active participant teams that still do not resolve to a shared logo asset.</p>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Active section
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-foreground">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {TAB_DESCRIPTIONS[activeTab]}
            </p>
          </div>

          <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-secondary/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
          </div>
        </div>
      </div>

      {activeTab === "tournaments" && <AdminTournaments />}
      {activeTab === "teams" && <AdminTeams />}
      {activeTab === "matches" && <AdminMatches />}
      {activeTab === "results" && <AdminResults />}
      {activeTab === "transfers" && <AdminTransfers />}
      {activeTab === "news" && <AdminNews />}
      {activeTab === "inspector" && <AdminInspector />}
    </div>
  );
}

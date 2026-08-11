import React, { useState, Suspense, lazy } from "react";
import {
  Shield,
  LayoutDashboard,
  Trophy,
  Users,
  Swords,
  FileText,
  BarChart3,
  Newspaper,
  ArrowRightLeft,
  Database,
  Image,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PageLoader from "@/components/shared/PageLoader";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const AdminTournaments = lazy(() => import("../components/admin/AdminTournaments"));
const AdminTeams = lazy(() => import("../components/admin/AdminTeams"));
const AdminMatches = lazy(() => import("../components/admin/AdminMatches"));
const AdminResults = lazy(() => import("../components/admin/ADMINRESULTS"));
const AdminNews = lazy(() => import("../components/admin/AdminNews"));
const AdminTransfers = lazy(() => import("../components/admin/AdminTransfers"));
const AdminInspector = lazy(() => import("../components/admin/AdminInspector"));
const AdminStagePosters = lazy(() => import("../components/admin/AdminStagePosters"));
const AdminPlayerStats = lazy(() => import("../components/admin/AdminPlayerStats"));
const AdminOperations = lazy(() => import("../components/admin/AdminOperations"));

const tabs = [
  { id: "operations", label: "Operations", icon: LayoutDashboard },
  { id: "tournaments", label: "Tournaments", icon: Trophy },
  { id: "teams", label: "Teams", icon: Users },
  { id: "matches", label: "Matches", icon: Swords },
  { id: "results", label: "Results", icon: FileText },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "transfers", label: "Transfers", icon: ArrowRightLeft },
  { id: "news", label: "News", icon: Newspaper },
  { id: "posters", label: "Posters", icon: Image },
  { id: "inspector", label: "Inspector", icon: Database },
];

const TAB_DESCRIPTIONS = {
  operations:
    "Your no-code control map for daily site operations and matchday updates.",
  tournaments:
    "Create tournament shells, stage structures, prize pools, and event metadata.",
  teams:
    "Manage organizations, player links, roster identity, and logo coverage.",
  matches:
    "Control scheduled lobbies, maps, groups, and stage-by-stage match setup.",
  results:
    "Enter and revise match outcomes so standings and team stats stay accurate.",
  stats:
    "Manually publish BMPS player statistics for qualifier, survival, semi finals, and overall views.",
  transfers:
    "Track roster windows, IN / OUT moves, and active lineup adjustments.",
  news: "Publish announcements, tournament stories, and update notes for the frontend feed.",
  posters:
    "Generate stage-group poster previews from live tournament stages and results data.",
  inspector:
    "Inspect live backend tournament payloads, match wiring, and result coverage without guessing from frontend views.",
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState("operations");
  const { data: overview = null, isError: overviewError } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const AUTH_TOKEN_KEY = "stagecore_auth_token";
      const stored = localStorage.getItem(AUTH_TOKEN_KEY);
      const authSession = (() => {
        try { return JSON.parse(stored || "{}"); } catch { return {}; }
      })();
      const response = await fetch("/api/admin/overview", {
        headers: {
          "Content-Type": "application/json",
          ...(authSession.token ? { "X-StageCore-Auth-Token": authSession.token } : {}),
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to load admin overview: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const activeTournaments = overview?.counts?.activeTournaments || 0;
  const duplicateOrgCount = overview?.health?.duplicateOrgCount || 0;
  const missingLogoCount = overview?.health?.missingLogoCount || 0;
  const unresolvedParticipantCount =
    overview?.health?.unresolvedParticipantCount || 0;

  const overviewCards = [
    { label: "Tournaments", value: activeTournaments, icon: Trophy },
    { label: "Teams", value: overview?.counts?.teams || 0, icon: Users },
    { label: "Matches", value: overview?.counts?.matches || 0, icon: Swords },
    { label: "Stories", value: overview?.counts?.news || 0, icon: Newspaper },
    {
      label: "Transfers",
      value: overview?.counts?.transfers || 0,
      icon: ArrowRightLeft,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Shield className="size-6 text-primary" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
            Control room
          </p>
          <h1 className="text-2xl font-heading font-semibold tracking-wide">
            ADMIN PANEL
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage tournaments, teams, matches, transfers, and editorial
            content.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {overviewCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[20px] border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                {card.label}
              </p>
              <card.icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-black text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Data health
            </p>
            <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em] text-foreground">
              Live integrity checks
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Quick visibility into duplicate orgs, unresolved participant
              links, and missing logos before those issues show up in public
              pages.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-[20px] border border-border bg-secondary/35 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Duplicate org rows
            </p>
            <p className="mt-3 text-2xl font-black text-foreground">
              {duplicateOrgCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Multiple team records collapsing to the same organization.
            </p>
          </div>
          <div className="rounded-[20px] border border-border bg-secondary/35 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Unresolved participants
            </p>
            <p className="mt-3 text-2xl font-black text-foreground">
              {unresolvedParticipantCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Active tournament participant names that do not map to a live team
              row.
            </p>
          </div>
          <div className="rounded-[20px] border border-border bg-secondary/35 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Missing logos
            </p>
            <p className="mt-3 text-2xl font-black text-foreground">
              {missingLogoCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Active participant teams that still do not resolve to a shared
              logo asset.
            </p>
          </div>
        </div>
        {overviewError ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Admin overview is temporarily unavailable. The editing tabs still work, but run Inspector before publishing major tournament changes.
          </div>
        ) : null}
      </div>

      <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Active section
            </p>
            <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em] text-foreground">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {TAB_DESCRIPTIONS[activeTab]}
            </p>
          </div>

          <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-secondary/50 p-1">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Suspense fallback={<PageLoader label="Loading section" className="min-h-[40vh]" />}>
        <ErrorBoundary>
          {activeTab === "operations" && <AdminOperations onSelectTab={setActiveTab} />}
          {activeTab === "tournaments" && <AdminTournaments />}
          {activeTab === "teams" && <AdminTeams />}
          {activeTab === "matches" && <AdminMatches />}
          {activeTab === "results" && <AdminResults />}
          {activeTab === "stats" && <AdminPlayerStats />}
          {activeTab === "transfers" && <AdminTransfers />}
          {activeTab === "news" && <AdminNews />}
          {activeTab === "posters" && <AdminStagePosters />}
          {activeTab === "inspector" && <AdminInspector />}
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}

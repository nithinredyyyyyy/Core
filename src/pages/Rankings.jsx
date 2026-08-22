import React, { Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LazyMotion, domAnimation, m } from "framer-motion";
import {
  Medal,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  Users,
  Building2,
  User,
  Activity,
  Flame,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import TeamIdentity from "@/components/shared/TeamIdentity";
import PageLoader from "@/components/shared/PageLoader";
import QueryError from "@/components/shared/QueryError";
import { getTeamLogoByName } from "@/lib/teamLogos";

const CLUB_SHORT_CODES = {
  "Team Falcons": "FLCN",
  "Natus Vincere": "NAVI",
  "Virtus.Pro": "VP",
  "Team Vision": "VIS",
  "ZETA DIVISION": "ZETA",
  "Twisted Minds": "TM",
  "Team Spirit": "TS",
  "Weibo Gaming": "WBG",
  "JD Gaming": "JDG",
  ONIC: "ONIC",
  "Saishunkan Sol Kumamoto": "SSK",
  "Gen.G Esports": "GEN",
  "Gentle Mates": "M8",
  "MIBR.LOS": "MIBR",
};

const INSIGHT_ICONS = {
  green: TrendingUp,
  amber: Flame,
  blue: Activity,
};

const LazyPerformanceChart = React.lazy(() => import("@/components/rankings/PerformanceChart"));

const HEADER_COPY = {
  teams: {
    title: "Team Rankings",
    description: "Global power rankings derived from official circuit results.",
  },
  players: {
    title: "Player Rankings",
    description: "Top performers across the current competitive season.",
  },
  organizations: {
    title: "EWC Club Ranking",
    description: "Esports World Cup club standings by ccPoints, medals, and prize.",
  },
};

const RANKING_TABS = [
  { id: "teams", label: "Teams", icon: Users },
  { id: "players", label: "Players", icon: User },
  { id: "organizations", label: "EWC Club Ranking", icon: Building2 },
];

function getClubShortCode(name) {
  return CLUB_SHORT_CODES[name] || name.substring(0, 2).toUpperCase();
}

function TrendIndicator({ trend }) {
  if (trend > 0) {
    return (
      <span className="flex items-center font-bold text-green-500">
        <TrendingUp className="mr-1 size-4" />
        {trend}
      </span>
    );
  }
  if (trend < 0) {
    return (
      <span className="flex items-center font-bold text-red-500">
        <TrendingDown className="mr-1 size-4" />
        {Math.abs(trend)}
      </span>
    );
  }
  return (
    <span className="flex items-center font-bold text-muted-foreground">
      <Minus className="mr-1 size-4" />
    </span>
  );
}

function LogoOrInitials({ name, className = "" }) {
  if (getTeamLogoByName(name)) {
    return <TeamIdentity name={name} hideText contained={true} />;
  }

  return (
    <div
      className={`flex size-20 items-center justify-center rounded-2xl bg-secondary/50 px-2 text-2xl font-black text-muted-foreground ${className}`}
    >
      {getClubShortCode(name)}
    </div>
  );
}

function ClubIdentity({ name }) {
  if (getTeamLogoByName(name)) {
    return <TeamIdentity name={name} className="font-bold text-foreground" />;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary/70 px-1 text-xs font-black text-muted-foreground">
        {getClubShortCode(name)}
      </span>
      <span className="font-bold text-foreground">{name}</span>
    </div>
  );
}

function RankingHeader({ activeTab, searchQuery, onSearchChange }) {
  const copy = HEADER_COPY[activeTab] ?? HEADER_COPY.teams;

  return (
    <div className="mb-10 mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{copy.description}</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search rankings..."
            className="h-10 w-full rounded-full border border-border bg-background/50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary sm:w-64"
          />
        </div>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-full border border-border bg-background/50 px-4 text-sm hover:bg-secondary"
        >
          <Filter className="size-4" /> Filters
        </button>
      </div>
    </div>
  );
}

function RankingTabs({ activeTab, setActiveTab }) {
  return (
    <div className="mb-8 flex space-x-2 overflow-x-auto pb-2">
      {RANKING_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Icon className="size-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function TopThreeShowcase({ data, type }) {
  if (!data || data.length < 3) return null;
  const top3 = data.slice(0, 3);
  const podium = [top3[1], top3[0], top3[2]];

  return (
    <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
      {podium.map((item, idx) => {
        const isFirst = item.rank === 1;
        const name =
          type === "players"
            ? item.playerName
            : type === "organizations"
              ? item.clubName
              : item.teamName;

        return (
          <m.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative flex flex-col items-center rounded-[32px] border p-6 text-center md:p-8 ${
              isFirst
                ? "z-10 border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-background shadow-xl md:scale-105"
                : "border-border bg-card"
            }`}
          >
            <div
              className="absolute -top-5 z-20 flex size-10 items-center justify-center rounded-full font-black text-white shadow-lg"
              style={{
                backgroundColor: isFirst ? "var(--brand-amber)" : item.rank === 2 ? "var(--brand-slate-400)" : "var(--brand-amber-deep)",
              }}
            >
              #{item.rank}
            </div>

            <div className="mb-6 mt-6 flex items-center justify-center">
              {type === "teams" || type === "organizations" ? (
                <div className={isFirst ? "scale-[1.3] md:scale-[1.5]" : "scale-110"}>
                  <LogoOrInitials name={name} />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <TeamIdentity
                    name={item.teamName}
                    hideText
                    contained
                    logoBlockClassName="size-16 rounded-xl"
                    logoClassName="h-12 w-12 object-contain"
                  />
                  <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-bold text-muted-foreground">
                    {item.teamName}
                  </span>
                </div>
              )}
            </div>

            <h3 className="relative z-20 mt-4 text-xl font-black text-foreground">{name}</h3>
            {type === "players" ? (
              <p className="mt-1 text-xs text-muted-foreground">{item.teamName}</p>
            ) : null}

            <div className="mt-6 flex w-full items-center justify-between rounded-xl border border-border/50 bg-background/50 p-4">
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {type === "organizations" ? "ccPoints" : "Rating"}
                </p>
                <p className="text-xl font-black text-primary">
                  {type === "organizations" ? item.ccPoints : item.rating}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {type === "organizations" ? "Prize" : "Trend"}
                </p>
                {type === "organizations" ? (
                  <span className="text-lg font-black text-green-500">{item.prize}</span>
                ) : (
                  <TrendIndicator trend={item.trend} />
                )}
              </div>
            </div>
          </m.div>
        );
      })}
    </div>
  );
}

function MobileRankingList({ data, type }) {
  const isPlayer = type === "players";

  return (
    <div className="space-y-3 md:hidden">
      {data.map((row) => (
        <div
          key={row.id}
          className="rounded-2xl border border-border bg-card p-3 shadow-sm"
        >
          {type === "teams" ? (
            <>
              <div className="flex items-center gap-3">
                <span className="w-9 shrink-0 text-sm font-black text-foreground">
                  #{row.rank}
                </span>
                <TeamIdentity
                  name={row.teamName}
                  compact
                  className="truncate font-medium text-foreground"
                  containerClassName="min-w-0 flex-1"
                />
                <div className="shrink-0 text-right">
                  <p className="text-lg font-black leading-none text-primary">
                    {row.rating}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Points
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
                <span>
                  26 BGIS{" "}
                  <span className="font-bold text-foreground">{row.pts26BGIS || 0}</span>
                </span>
                <span>
                  26 BMPS{" "}
                  <span className="font-bold text-foreground">{row.pts26BMPS || 0}</span>
                </span>
                <TrendIndicator trend={row.trend} />
              </div>
            </>
          ) : isPlayer ? (
            <>
              <div className="flex items-center gap-3">
                <span className="w-9 shrink-0 text-sm font-black text-foreground">
                  #{row.rank}
                </span>
                <TeamIdentity
                  name={row.teamName}
                  hideText
                  contained
                  compact
                  logoBlockClassName="size-9 shrink-0"
                  logoClassName="h-7 w-7 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">
                    {row.playerName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{row.teamName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-black leading-none text-primary">
                    {row.rating}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Total Points
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end border-t border-border/50 pt-2 text-xs text-muted-foreground">
                <TrendIndicator trend={row.trend} />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="w-9 shrink-0 text-sm font-black text-foreground">
                  #{row.rank}
                </span>
                <TeamIdentity
                  name={row.clubName}
                  compact
                  className="truncate font-bold text-foreground"
                  containerClassName="min-w-0 flex-1"
                />
                <div className="shrink-0 text-right">
                  <p className="text-lg font-black leading-none text-primary">
                    {row.ccPoints}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    ccPoints
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-amber-500">
                    <Medal className="mr-0.5 inline size-3" />
                    {row.goldMedals}
                  </span>
                  <span className="font-semibold text-slate-400">
                    <Medal className="mr-0.5 inline size-3" />
                    {row.silverMedals}
                  </span>
                  <span className="font-semibold text-orange-600">
                    <Medal className="mr-0.5 inline size-3" />
                    {row.bronzeMedals}
                  </span>
                </span>
                <span>
                  Place <span className="font-bold text-foreground">{row.place}</span>
                </span>
                <span>
                  Prize <span className="font-bold text-green-500">{row.prize}</span>
                </span>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function RankingTable({ data, type }) {
  const isTeam = type === "teams";
  const isPlayer = type === "players";

  return (
    <div className="hidden overflow-hidden rounded-[24px] border border-border bg-card shadow-sm md:block">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-semibold">Rank</th>
              <th className="px-6 py-4 font-semibold">
                {isTeam ? "Team Name" : isPlayer ? "Player" : "Club"}
              </th>
              {isTeam ? (
                <>
                  <th className="hidden px-3 py-4 text-center font-semibold xl:table-cell">24 BGIS</th>
                  <th className="hidden px-3 py-4 text-center font-semibold xl:table-cell">24 BMPS</th>
                  <th className="hidden px-3 py-4 text-center font-semibold lg:table-cell">25 BGIS</th>
                  <th className="hidden px-3 py-4 text-center font-semibold lg:table-cell">25 BMPS</th>
                  <th className="hidden px-3 py-4 text-center font-semibold md:table-cell">25 BMSD</th>
                  <th className="px-3 py-4 text-center font-semibold">26 BGIS</th>
                  <th className="px-3 py-4 text-center font-semibold">26 BMPS</th>
                  <th className="px-6 py-4 font-bold text-primary">Points</th>
                </>
              ) : isPlayer ? (
                <>
                  <th className="px-6 py-4 font-semibold">Total Points</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4 font-semibold">ccPoints</th>
                  <th className="px-4 py-4 text-center font-semibold" colSpan={3}>
                    Medals
                  </th>
                  <th className="px-6 py-4 font-semibold">Place</th>
                  <th className="px-6 py-4 font-semibold">Prize</th>
                </>
              )}
              <th className="px-6 py-4 text-right font-semibold">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-secondary/20">
                <td className="px-6 py-4 font-black text-foreground">#{row.rank}</td>
                <td className="px-6 py-4">
                  {isTeam ? (
                    <TeamIdentity name={row.teamName} />
                  ) : isPlayer ? (
                    <div className="flex items-center gap-3 font-bold text-foreground">
                      <TeamIdentity
                        name={row.teamName}
                        hideText
                        contained
                        logoBlockClassName="size-9"
                        logoClassName="h-7 w-7 object-contain"
                      />
                      <div>
                        <div>{row.playerName}</div>
                        <div className="text-xs font-medium text-muted-foreground">
                          {row.teamName}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ClubIdentity name={row.clubName} />
                  )}
                </td>
                {isTeam ? (
                  <>
                    <td className="hidden px-3 py-4 text-center text-muted-foreground xl:table-cell">
                      {row.pts24BGIS || 0}
                    </td>
                    <td className="hidden px-3 py-4 text-center text-muted-foreground xl:table-cell">
                      {row.pts24BMPS || 0}
                    </td>
                    <td className="hidden px-3 py-4 text-center text-muted-foreground lg:table-cell">
                      {row.pts25BGIS || 0}
                    </td>
                    <td className="hidden px-3 py-4 text-center text-muted-foreground lg:table-cell">
                      {row.pts25BMPS || 0}
                    </td>
                    <td className="hidden px-3 py-4 text-center text-muted-foreground md:table-cell">
                      {row.pts25BMSD || 0}
                    </td>
                    <td className="px-3 py-4 text-center font-medium text-foreground">
                      {row.pts26BGIS || 0}
                    </td>
                    <td className="px-3 py-4 text-center font-medium text-foreground">
                      {row.pts26BMPS || 0}
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">{row.rating}</td>
                  </>
                ) : isPlayer ? (
                  <>
                    <td className="px-6 py-4 font-bold text-primary">{row.rating}</td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 font-bold text-primary">{row.ccPoints}</td>
                    <td className="px-4 py-4 text-center font-semibold text-amber-500">
                      <span className="inline-flex items-center gap-1">
                        <Medal className="size-4" />
                        {row.goldMedals}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Medal className="size-4" />
                        {row.silverMedals}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-orange-600">
                      <span className="inline-flex items-center gap-1">
                        <Medal className="size-4" />
                        {row.bronzeMedals}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{row.place}</td>
                    <td className="px-6 py-4 font-semibold text-green-500">{row.prize}</td>
                  </>
                )}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end">
                    <TrendIndicator trend={row.trend} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RankingInsights({ insights = [] }) {
  return (
    <div className="mb-12 mt-16">
      <h2 className="mb-6 text-2xl font-black">Ranking Insights</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {insights.map((insight) => {
          const Icon = INSIGHT_ICONS[insight.tone] || Activity;
          const colorClass =
            insight.tone === "green"
              ? "text-green-500"
              : insight.tone === "amber"
                ? "text-amber-500"
                : "text-blue-500";
          return (
            <div
              key={insight.title}
              className="flex items-start gap-4 rounded-[24px] border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`rounded-2xl bg-secondary p-3 ${colorClass}`}>
                <Icon className="size-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {insight.title}
                </p>
                <p className="mt-1 text-xl font-black text-foreground">{insight.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{insight.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankingRules() {
  return (
    <div className="mb-12 mt-12 rounded-[24px] border border-border bg-brand-ink-char p-6 shadow-sm md:p-8">
      <h3 className="mb-2 text-xl font-bold text-amber-500">How the Rankings Work</h3>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground md:text-base">
        The KIE Global Leaderboard highlights the most consistent teams and players based on
        their performance in Grand Finals, with points earned through placement, finishes, and
        special awards.
      </p>
      <h3 className="mb-2 text-xl font-bold text-amber-500">Decay System</h3>
      <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
        Points remain at full value for six months, then decay gradually so current form matters
        more than legacy results.
      </p>
    </div>
  );
}

function RecentUpdates({ updates = [] }) {
  return (
    <div className="rounded-[24px] border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-black">
        <Activity className="size-5 text-primary" /> Live Updates
      </h3>
      <div className="space-y-4">
        {updates.map((update) => (
          <div
            key={update.id}
            className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-secondary">
                {update.type === "up" && <TrendingUp className="size-4 text-green-500" />}
                {update.type === "down" && <TrendingDown className="size-4 text-red-500" />}
                {update.type === "neutral" && <Minus className="size-4 text-muted-foreground" />}
              </div>
              <p className="text-sm font-medium">{update.text}</p>
            </div>
            <span className="text-xs text-muted-foreground">{update.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingStats({ stats }) {
  if (!stats) return null;

  const formatTotal = (value) => {
    if (value >= 1000) return `${Math.round(value / 1000)}k`;
    return String(value);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-[24px] border border-border bg-card p-5">
        <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Ranked Teams</p>
        <p className="text-3xl font-black">{stats.rankedTeams}</p>
      </div>
      <div className="rounded-[24px] border border-border bg-card p-5">
        <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Ranked Players</p>
        <p className="text-3xl font-black">{stats.rankedPlayers}</p>
      </div>
      <div className="rounded-[24px] border border-border bg-card p-5">
        <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Avg Rating</p>
        <p className="text-3xl font-black text-primary">{stats.avgRating}</p>
      </div>
      <div className="rounded-[24px] border border-border bg-card p-5">
        <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Total Points</p>
        <p className="text-3xl font-black">{formatTotal(stats.totalPoints)}</p>
      </div>
    </div>
  );
}

function filterRankings(rows, query, fields) {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) =>
    fields.some((field) => String(row[field] || "").toLowerCase().includes(needle)),
  );
}

export default function Rankings() {
  const [activeTab, setActiveTab] = useState("teams");
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["rankings-page"],
    queryFn: () => base44.pages.rankings(),
    staleTime: 60_000,
  });

  const tabData = useMemo(() => {
    if (!data) return [];
    if (activeTab === "teams") {
      return filterRankings(data.teams, searchQuery, ["teamName"]);
    }
    if (activeTab === "players") {
      return filterRankings(data.players, searchQuery, ["playerName", "teamName"]);
    }
    return filterRankings(data.organizations, searchQuery, ["clubName"]);
  }, [activeTab, data, searchQuery]);

  const chartTeamNames = useMemo(
    () => (data?.teams || []).slice(0, 3).map((entry) => entry.teamName),
    [data],
  );

  if (isLoading && !data) {
    return <PageLoader label="Loading rankings" />;
  }

  if (isError || !data) {
    return (
      <QueryError
        title="Rankings unavailable"
        message="We couldn't load the latest rankings board."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-background pb-20">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <RankingHeader
            activeTab={activeTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <RankingTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          <m.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TopThreeShowcase data={tabData} type={activeTab} />
            <MobileRankingList data={tabData} type={activeTab} />
            <RankingTable data={tabData} type={activeTab} />
          </m.div>

          <RankingInsights insights={data.insights} />

          <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="flex flex-col justify-end lg:col-span-2">
              <Suspense fallback={null}>
                <LazyPerformanceChart chartData={data.chartData} teamNames={chartTeamNames} />
              </Suspense>
              <RankingRules />
            </div>
            <div className="flex flex-col justify-start gap-6">
              <RankingStats stats={data.stats} />
              <RecentUpdates updates={data.recentUpdates} />
            </div>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}

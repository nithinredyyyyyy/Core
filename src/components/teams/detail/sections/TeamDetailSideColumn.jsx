import React from "react";
import { Link } from "react-router-dom";
import ProfilePanel from "@/components/shared/ProfilePanel";
import { formatTeamDetailDate } from "@/components/teams/detail/utils/teamDetailHelpers";

export function TeamDetailSideColumn({
  team,
  activeYearsLabel,
  organizationAliases,
  recentMatches,
  relatedArticles,
}) {
  return (
    <div className="space-y-4">
      <ProfilePanel
        title="Organization Profile"
        panelClassName="rounded-xl border border-border bg-card"
        titleClassName="font-heading text-sm font-bold uppercase tracking-wider p-5 border-b border-border"
      >
        <div className="grid gap-4 p-5 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-[10px] uppercase tracking-wider text-primary">
              Short Tag
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {team.tag || "---"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-[10px] uppercase tracking-wider text-primary">
              Active Years
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {activeYearsLabel}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-[10px] uppercase tracking-wider text-primary">
              Known Aliases
            </p>
            <p className="mt-2 text-sm text-foreground">
              {organizationAliases.slice(0, 3).join(" / ") || "No aliases mapped"}
            </p>
          </div>
        </div>
      </ProfilePanel>

      <ProfilePanel
        title="Recent Matches"
        panelClassName="rounded-xl border border-border bg-card"
        titleClassName="font-heading text-sm font-bold uppercase tracking-wider p-5 border-b border-border"
      >
        {recentMatches.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No recent match records are attached to this team yet.
          </p>
        ) : (
          <div className="space-y-3 p-5">
            {recentMatches.map((match) => (
              <Link
                key={match.id}
                to={`/matches/${match.id}`}
                className="block rounded-xl border border-border bg-secondary/20 p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{match.stage}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Match #{match.match_number || "-"} | {match.map || "Map TBA"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-primary">
                      {match.status}
                    </p>
                    <p
                      className="mt-1 text-xs text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {formatTeamDetailDate(
                        match.scheduled_time,
                        "MMM d, h:mm a",
                        "TBA",
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </ProfilePanel>

      {relatedArticles.length > 0 ? (
        <ProfilePanel
          title="Related Coverage"
          panelClassName="rounded-xl border border-border bg-card"
          titleClassName="font-heading text-sm font-bold uppercase tracking-wider p-5 border-b border-border"
        >
          <div className="space-y-3 p-5">
            {relatedArticles.map((article) => (
              <Link
                key={article.id}
                to={`/news/${article.id}`}
                className="rounded-xl border border-border bg-secondary/20 p-4"
              >
                <p className="font-semibold text-foreground">{article.title}</p>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {article.content}
                </p>
              </Link>
            ))}
          </div>
        </ProfilePanel>
      ) : null}
    </div>
  );
}

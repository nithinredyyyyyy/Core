import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function BackToTeamsLink({ teamName }) {
  return (
    <Link
      to={teamName ? `/teams?team=${encodeURIComponent(teamName)}` : "/teams"}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" />
      Back to teams
    </Link>
  );
}

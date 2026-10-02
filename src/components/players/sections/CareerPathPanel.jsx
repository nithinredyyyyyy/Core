import React from "react";
import ProfilePanel from "@/components/shared/ProfilePanel";
import { formatProfileDate } from "@/components/players/utils/playerProfileHelpers";

export function CareerPathPanel({ teams }) {
  return (
    <ProfilePanel title="Career path">
      {teams.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No mapped team history is available for this player yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {teams.map((entry) => (
            <div
              key={entry.id}
              className="rounded-[18px] border border-border bg-background/75 p-4"
            >
              <p className="font-semibold text-foreground">
                {entry.team}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {entry.role || "Player"}
              </p>
              <p
                className="mt-2 text-xs text-muted-foreground"
                suppressHydrationWarning
              >
                {formatProfileDate(
                  entry.joined,
                  "MMM yyyy",
                  "Start unknown",
                )}
                {" · "}
                {formatProfileDate(entry.left, "MMM yyyy", "Present")}
              </p>
            </div>
          ))}
        </div>
      )}
    </ProfilePanel>
  );
}

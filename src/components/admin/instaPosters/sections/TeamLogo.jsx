import React from "react";
import { getTeamLogoByName, isWideTeamLogo } from "@/lib/teamLogos";
import { makeInitials, POSTER_COLORS } from "@/components/admin/instaPosters/utils/posterHelpers";

export function TeamLogo({ teamName, size = 190, muted = false, framed = true }) {
  const logo = getTeamLogoByName(teamName);
  const wide = isWideTeamLogo(teamName);
  const initials = makeInitials(teamName);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(12, size * 0.14),
        display: "grid",
        placeItems: "center",
        background: framed
          ? muted
            ? "#f0f3f8"
            : "#ffffff"
          : "transparent",
        border: framed ? `1px solid ${POSTER_COLORS.faint}` : "0",
        boxShadow: framed ? "0 16px 32px rgba(16,24,39,0.08)" : "none",
        overflow: "hidden",
      }}
    >
      {logo ? (
        <img
          src={logo}
          alt=""
          crossOrigin="anonymous"
          style={{
            width: wide ? "88%" : "74%",
            height: wide ? "58%" : "74%",
            objectFit: "contain",
            filter: muted ? "grayscale(0.85) opacity(0.72)" : "none",
          }}
        />
      ) : (
        <span
          style={{
            color: muted ? "#94a3b8" : POSTER_COLORS.ink,
            fontSize: size * 0.28,
            fontWeight: 950,
            letterSpacing: 0,
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

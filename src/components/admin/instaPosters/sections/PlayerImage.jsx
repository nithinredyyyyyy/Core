import React from "react";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { POSTER_COLORS, makeInitials } from "@/components/admin/instaPosters/utils/posterHelpers";

function PlayerImage({ playerName, teamName }) {
  const photo = getPlayerPhotoByIgn(playerName);
  return (
    <div
      style={{
        position: "relative",
        width: 440,
        height: 520,
        display: "grid",
        placeItems: "end center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "86px 32px 24px",
          borderRadius: 34,
          background:
            "linear-gradient(140deg, rgba(255,122,26,0.14), rgba(37,99,235,0.08))",
          border: `1px solid ${POSTER_COLORS.faint}`,
          transform: "skew(-4deg)",
        }}
      />
      {photo ? (
        <img
          src={photo}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 30px 34px rgba(16,24,39,0.24))",
          }}
        />
      ) : (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: 330,
            height: 430,
            borderRadius: "160px 160px 38px 38px",
            background:
              "linear-gradient(180deg, #ffffff, #eef2f7)",
            border: `1px solid ${POSTER_COLORS.faint}`,
            display: "grid",
            placeItems: "center",
            color: POSTER_COLORS.ink,
            fontSize: 92,
            fontWeight: 950,
          }}
        >
          {makeInitials(playerName || teamName)}
        </div>
      )}
    </div>
  );
}

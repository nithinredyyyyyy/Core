import React from "react";
import { getTeamLogoForDark } from "@/lib/teamLogos";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { getIglDataFromTournament } from "./posterMvpHelpers";
import { getAwardType } from "@/lib/awardTypes";
import { BMPS_2026_IGL_STATS } from "@/lib/bmps2026PlayerStats";
import NftCardPoster from "./NftCardPoster";

export default function IgLCardPoster({ tournament, tournamentLogo, playerTeamMap = {} }) {
  const igl = getIglDataFromTournament(tournament, playerTeamMap);
  const photo = getPlayerPhotoByIgn(igl?.player);
  const teamLogo = getTeamLogoForDark(igl?.teamName);
  const award = getAwardType(igl?.award);
  const hardcoded = BMPS_2026_IGL_STATS.find((h) => h.player === igl?.player);

  return (
    <NftCardPoster
      award={award}
      player={igl?.player}
      teamName={igl?.teamName}
      teamLogo={teamLogo}
      photo={photo}
      tournament={tournament}
      tournamentLogo={tournamentLogo}
      statValues={{
        iglRating: hardcoded?.iglRating || "—",
        top5s: hardcoded?.top5s ?? "—",
        wwcd: hardcoded?.wwcd ?? "—",
      }}
    />
  );
}

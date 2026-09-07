import React from "react";
import { getTeamLogoForDark } from "@/lib/teamLogos";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { getRookieDataFromTournament } from "./posterMvpHelpers";
import { getAwardType } from "@/lib/awardTypes";
import NftCardPoster from "./NftCardPoster";

export default function RookieCardPoster({ tournament, tournamentLogo, playerTeamMap = {} }) {
  const rookie = getRookieDataFromTournament(tournament, playerTeamMap);
  const p = rookie?.[0];
  const photo = getPlayerPhotoByIgn(p?.player);
  const teamLogo = getTeamLogoForDark(p?.teamName);
  const award = getAwardType(p?.award || "ROOKIE");

  return (
    <NftCardPoster
      award={award}
      player={p?.player}
      teamName={p?.teamName}
      teamLogo={teamLogo}
      photo={photo}
      tournament={tournament}
      statValues={{
        age: p?.age || "—",
        debut: p?.debut || "—",
      }}
    />
  );
}

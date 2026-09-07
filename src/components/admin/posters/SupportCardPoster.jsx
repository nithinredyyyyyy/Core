import React from "react";
import { getTeamLogoForDark } from "@/lib/teamLogos";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { getSupportDataFromTournament } from "./posterMvpHelpers";
import { getAwardType } from "@/lib/awardTypes";
import NftCardPoster from "./NftCardPoster";

export default function SupportCardPoster({ tournament, tournamentLogo, playerTeamMap = {} }) {
  const support = getSupportDataFromTournament(tournament, playerTeamMap);
  const p = support?.[0];
  const photo = getPlayerPhotoByIgn(p?.player);
  const teamLogo = getTeamLogoForDark(p?.teamName);
  const award = getAwardType(p?.award || "SUPPORT");

  return (
    <NftCardPoster
      award={award}
      player={p?.player}
      teamName={p?.teamName}
      teamLogo={teamLogo}
      photo={photo}
      tournament={tournament}
      statValues={{
        assistsPerRd: p?.assistsPerRd || "—",
        utilityDmg: p?.utilityDmg || "—",
      }}
    />
  );
}

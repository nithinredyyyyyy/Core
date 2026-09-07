import React from "react";
import { getTeamLogoForDark } from "@/lib/teamLogos";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { getTournamentFmvpData } from "./posterMvpHelpers";
import { getAwardType } from "@/lib/awardTypes";
import NftCardPoster from "./NftCardPoster";

export default function FmvpCardPoster({ tournament, tournamentLogo, playerTeamMap = {} }) {
  const mvpData = getTournamentFmvpData(tournament, playerTeamMap);
  const mvp = mvpData[0];
  const photo = getPlayerPhotoByIgn(mvp?.player);
  const teamLogo = getTeamLogoForDark(mvp?.teamName);
  const award = getAwardType(mvp?.award || "FMVP");
  const isBgms = /bgms|masters\s*series/i.test(tournament?.name);

  return (
    <NftCardPoster
      award={award}
      player={mvp?.player}
      teamName={mvp?.teamName}
      teamLogo={teamLogo}
      photo={photo}
      tournament={tournament}
      tournamentLogo={tournamentLogo}
      statValues={
        isBgms
          ? { finishes: mvp?.finishes ?? "—", fpm: mvp?.fpm || "—", best: mvp?.best ?? "—", contribution: mvp?.contribution ?? "—" }
          : { mvpRating: mvp?.mvpRating || "—", finishes: mvp?.finishes ?? "—", fpm: mvp?.fpm || "—" }
      }
    />
  );
}

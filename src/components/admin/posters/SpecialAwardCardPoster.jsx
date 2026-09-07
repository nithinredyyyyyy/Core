import React from "react";
import { getTeamLogoForDark } from "@/lib/teamLogos";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { getSpecialAwardDataFromTournament } from "./posterMvpHelpers";
import { getAwardType } from "@/lib/awardTypes";
import NftCardPoster from "./NftCardPoster";

export default function SpecialAwardCardPoster({ tournament, tournamentLogo, playerTeamMap = {}, awardTitle }) {
  const data = getSpecialAwardDataFromTournament(tournament, awardTitle, playerTeamMap);
  const photo = getPlayerPhotoByIgn(data?.player);
  const teamLogo = getTeamLogoForDark(data?.teamName);
  const award = getAwardType(data?.award || awardTitle);

  return (
    <NftCardPoster
      award={award}
      player={data?.player}
      teamName={data?.teamName}
      teamLogo={teamLogo}
      photo={photo}
      tournament={tournament}
      tournamentLogo={tournamentLogo}
      statValues={{
        elimins: data?.elimins ?? "—",
        avg_dmg: data?.avg_dmg ?? "—",
        knocks: data?.knocks ?? "—",
        kd: data?.kd ?? "—",
        assists: data?.assists ?? "—",
      }}
    />
  );
}

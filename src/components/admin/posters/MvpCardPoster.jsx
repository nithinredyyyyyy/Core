import React from "react";
import { getTeamLogoForDark } from "@/lib/teamLogos";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { getTournamentMvpData } from "./posterMvpHelpers";
import { getAwardType } from "@/lib/awardTypes";
import NftCardPoster from "./NftCardPoster";

export default function MvpCardPoster({ tournament, tournamentLogo, playerTeamMap = {} }) {
  const mvpData = getTournamentMvpData(tournament, playerTeamMap);
  const mvp = mvpData[0];
  const photo = getPlayerPhotoByIgn(mvp?.player);
  const teamLogo = getTeamLogoForDark(mvp?.teamName);
  const award = getAwardType(mvp?.award || "MVP");

  const isPmgc = /pmgc|global\s*championship/i.test(tournament?.name);
  const isBgms = /bgms|masters\s*series/i.test(tournament?.name);
  const kills = mvp?.finishes ?? mvp?.elimins ?? "—";
  const damage = mvp?.damage ?? mvp?.avg_dmg ?? 0;
  const formattedDamage = damage > 0 ? damage.toLocaleString() : "—";

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
        isPmgc
          ? { elimins: mvp?.elimins ?? "—", avg_dmg: formattedDamage, knocks: mvp?.knocks ?? "—", kd: mvp?.kd || "—" }
          : isBgms
            ? { finishes: kills, mvpRating: mvp?.mvpRating || "—", fpm: mvp?.fpm || "—", best: mvp?.best ?? "—" }
            : { finishes: kills, mvpRating: mvp?.mvpRating || "—", fpm: mvp?.fpm || "—", damage: formattedDamage }
      }
    />
  );
}

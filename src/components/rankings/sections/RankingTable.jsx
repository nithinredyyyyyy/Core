import React from "react";
import { Medal } from "lucide-react";
import TeamIdentity from "@/components/shared/TeamIdentity";
import RankingMovement from "@/components/shared/RankingMovement";
import { ClubIdentity } from "@/components/rankings/sections/ClubIdentity";

export function RankingTable({ data, type }) {
  const isTeam = type === "teams";
  const isPlayer = type === "players";

  return (
    <div className="hidden overflow-hidden rounded-[24px] border border-border bg-card shadow-sm md:block">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-semibold">Rank</th>
              <th className="px-6 py-4 font-semibold">
                {isTeam ? "Team Name" : isPlayer ? "Player" : "Club"}
              </th>
              {isTeam ? (
                <>
                  <th className="hidden px-3 py-4 text-center font-semibold xl:table-cell">24 BGIS</th>
                  <th className="hidden px-3 py-4 text-center font-semibold xl:table-cell">24 BMPS</th>
                  <th className="hidden px-3 py-4 text-center font-semibold lg:table-cell">25 BGIS</th>
                  <th className="hidden px-3 py-4 text-center font-semibold lg:table-cell">25 BMPS</th>
                  <th className="hidden px-3 py-4 text-center font-semibold md:table-cell">25 BMSD</th>
                  <th className="px-3 py-4 text-center font-semibold">26 BGIS</th>
                  <th className="px-3 py-4 text-center font-semibold">26 BMPS</th>
                  <th className="px-6 py-4 font-bold text-primary">Points</th>
                </>
              ) : isPlayer ? (
                <>
                  <th className="px-6 py-4 font-semibold">Finishes</th>
                  <th className="px-6 py-4 font-semibold">Total Points</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4 font-semibold">ccPoints</th>
                  <th className="px-4 py-4 text-center font-semibold" colSpan={3}>
                    Medals
                  </th>
                  <th className="px-6 py-4 font-semibold">Place</th>
                  <th className="px-6 py-4 font-semibold">Prize</th>
                </>
              )}
              <th className="px-6 py-4 text-center font-semibold">Movement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-secondary/20">
                <td className="px-6 py-4 font-black text-foreground">#{row.rank}</td>
                <td className="px-6 py-4">
                  {isTeam ? (
                    <TeamIdentity name={row.teamName} />
                  ) : isPlayer ? (
                    <div className="flex items-center gap-3 font-bold text-foreground">
                      {row.photo ? (
                        <img
                          src={row.photo}
                          alt={row.playerName}
                          className="size-9 shrink-0 rounded-full object-cover ring-2 ring-border"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <TeamIdentity
                          name={row.teamName}
                          hideText
                          contained
                          logoBlockClassName="size-9"
                          logoClassName="h-7 w-7 object-contain"
                        />
                      )}
                      <div>
                        <div>{row.playerName}</div>
                        <div className="text-xs font-medium text-muted-foreground">
                          {row.teamName}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ClubIdentity name={row.clubName} />
                  )}
                </td>
                {isTeam ? (
                  <>
                    <td className="hidden px-3 py-4 text-center text-muted-foreground xl:table-cell">
                      {row.pts24BGIS || 0}
                    </td>
                    <td className="hidden px-3 py-4 text-center text-muted-foreground xl:table-cell">
                      {row.pts24BMPS || 0}
                    </td>
                    <td className="hidden px-3 py-4 text-center text-muted-foreground lg:table-cell">
                      {row.pts25BGIS || 0}
                    </td>
                    <td className="hidden px-3 py-4 text-center text-muted-foreground lg:table-cell">
                      {row.pts25BMPS || 0}
                    </td>
                    <td className="hidden px-3 py-4 text-center text-muted-foreground md:table-cell">
                      {row.pts25BMSD || 0}
                    </td>
                    <td className="px-3 py-4 text-center font-medium text-foreground">
                      {row.pts26BGIS || 0}
                    </td>
                    <td className="px-3 py-4 text-center font-medium text-foreground">
                      {row.pts26BMPS || 0}
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">{row.rating}</td>
                  </>
                ) : isPlayer ? (
                  <>
                    <td className="px-6 py-4 text-muted-foreground">{row.eliminations}</td>
                    <td className="px-6 py-4 font-bold text-primary">{row.rating}</td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 font-bold text-primary">{row.ccPoints}</td>
                    <td className="px-4 py-4 text-center font-semibold text-amber-500">
                      <span className="inline-flex items-center gap-1">
                        <Medal className="size-4" />
                        {row.goldMedals}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Medal className="size-4" />
                        {row.silverMedals}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-orange-600">
                      <span className="inline-flex items-center gap-1">
                        <Medal className="size-4" />
                        {row.bronzeMedals}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{row.place}</td>
                    <td className="px-6 py-4 font-semibold text-green-500">{row.prize}</td>
                  </>
                )}
                <td className="px-6 py-4 text-center">
                  <RankingMovement value={row.trend} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

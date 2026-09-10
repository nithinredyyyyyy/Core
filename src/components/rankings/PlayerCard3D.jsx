import { useState } from "react";
import { motion } from "framer-motion";
import TeamIdentity from "@/components/shared/TeamIdentity";

const TOURNAMENT_HISTORY = {
  LEGIT: [
    { tournament: "BMPS 2024", team: "TWOB", finishes: 23, position: "4th" },
    { tournament: "BGIS 2025", team: "Medal Esports", finishes: 23, position: "8th" },
    { tournament: "BMSD 2025", team: "iQOO SOUL", finishes: 23, position: "2nd Runner Up" },
    { tournament: "BGIS 2026", team: "iQOO SOUL", finishes: 38, position: "Winner" },
    { tournament: "BMPS 2026", team: "iQOO SOUL", finishes: 25, position: "13th" },
  ],
  JONATHAN: [
    { tournament: "BMPS 2024", team: "Hero Xtreme Godlike", finishes: 27, position: "2nd Runner Up" },
    { tournament: "BGIS 2025", team: "Hero Xtreme Godlike", finishes: 38, position: "Runner Up" },
    { tournament: "BMSD 2025", team: "Hero Xtreme Godlike", finishes: 23, position: "13th" },
    { tournament: "BGIS 2026", team: "Hero Xtreme Godlike", finishes: 33, position: "5th" },
    { tournament: "BMPS 2026", team: "Team Apex Gaming", finishes: 31, position: "5th" },
  ],
  MAFIAA: [
    { tournament: "BMPS 2024", team: "Team Forever", finishes: 31, position: "Runner Up" },
    { tournament: "BMPS 2025", team: "Team Forever", finishes: 23, position: "11th" },
    { tournament: "BMSD 2025", team: "Victores Sumus", finishes: 24, position: "12th" },
    { tournament: "BGIS 2026", team: "Victores Sumus", finishes: 33, position: "4th" },
    { tournament: "BMPS 2026", team: "Victores Sumus", finishes: 31, position: "2nd Runner Up" },
  ],
};

function getHistory(name) {
  if (!name) return [];
  return TOURNAMENT_HISTORY[name.toUpperCase()] || [];
}

export default function PlayerCard3D({ player, rank }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const rankLabel = rank === 1 ? "1ST" : rank === 2 ? "2ND" : rank === 3 ? "3RD" : `${rank}TH`;
  const lastName = player.playerName?.split(" ").pop();
  const history = getHistory(lastName);

  return (
    <div
      className="group relative cursor-pointer"
      style={{ perspective: "1200px" }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative mx-auto"
        style={{
          width: 300,
          height: 420,
          transformStyle: "preserve-3d",
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* ====== FRONT FACE ====== */}
        <div
          className="absolute inset-0 overflow-visible rounded-[16px]"
          style={{
            backfaceVisibility: "hidden",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <div className="absolute inset-0 rounded-[16px] bg-[#0c0c0c]" />
          <div className="absolute inset-[5px] rounded-[12px] overflow-hidden">
            <div className="absolute inset-0" style={{ background: "linear-gradient(140deg, #e879f9 0%, #818cf8 12%, #38bdf8 24%, #a78bfa 36%, #34d399 48%, #f472b6 60%, #818cf8 72%, #c084fc 84%, #38bdf8 100%)" }} />
            <div className="absolute inset-0 opacity-60" style={{ background: "linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.4) 38%, rgba(255,255,255,0.15) 50%, transparent 62%)" }} />
            <div className="absolute inset-0 overflow-hidden opacity-15">
              <div className="absolute -left-20 top-1/4 h-[200px] w-[140px] rotate-[-25deg] rounded-[20px] bg-white/20" />
              <div className="absolute -right-16 top-1/3 h-[180px] w-[120px] rotate-[20deg] rounded-[16px] bg-white/15" />
            </div>
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "repeating-linear-gradient(135deg, white 0 2px, transparent 2px 12px)" }} />
            <div className="absolute inset-0" style={{ opacity: 0.18, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

            {/* Photo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-full w-full">
                {player.photo ? (
                  <img src={player.photo} alt={player.playerName} className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.01]" style={{ filter: "drop-shadow(0 -8px 24px rgba(0,0,0,0.5))" }} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex size-28 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 font-['Archivo_Black',sans-serif] text-4xl font-black text-white">{lastName?.[0]}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Rank number */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2">
              <p className="font-['Archivo_Black',sans-serif] font-black leading-none text-white/[0.12]" style={{ fontSize: 100, writingMode: "vertical-lr", letterSpacing: "-5px" }}>
                {String(rank).padStart(2, "0")}
              </p>
            </div>

            {/* Vertical text */}
            <div className="absolute left-[7px] top-1/2 -translate-y-1/2">
              <p className="font-['Archivo_Black',sans-serif] text-[7px] font-bold uppercase tracking-[4px] text-white/30" style={{ writingMode: "vertical-lr" }}>
                GLOBAL RANKINGS
              </p>
            </div>

            {/* Top badges */}
            <div className="absolute left-3 top-3 z-20">
              <div className="rounded-[6px] border border-white/10 bg-black/40 px-2 py-1 backdrop-blur-md">
                <p className="font-['Archivo_Black',sans-serif] text-[9px] font-black tracking-wider text-white/80">#{rank}</p>
              </div>
            </div>
            <div className="absolute right-3 top-3 z-20">
              <img src="/images/core-logo.png" alt="" className="size-5 rounded-full opacity-50" />
            </div>

            {/* Bottom overlay */}
            <div className="absolute inset-x-0 bottom-0 z-20" style={{ height: "38%", background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.88) 55%, transparent 100%)" }} />

            <div className="absolute inset-x-0 bottom-0 z-30 p-3.5">
              <div className="mb-2.5">
                <p className="text-[9px] font-semibold tracking-[3px] text-white/50">
                  {player.playerName?.split(" ").slice(0, -1).join(" ")}
                </p>
                <h3 className="font-['Archivo_Black',sans-serif] font-black uppercase leading-[0.82] text-white" style={{ fontSize: 36, letterSpacing: "-1.5px" }}>
                  {lastName}
                </h3>
              </div>
              <div className="flex items-center gap-0 rounded-[10px] border border-white/[0.08] bg-[#12121a]/70 backdrop-blur-xl">
                <div className="flex items-center gap-2 border-r border-white/[0.08] px-3 py-2.5">
                  <TeamIdentity name={player.teamName} hideText contained logoBlockClassName="size-5" logoClassName="h-4 w-4 object-contain" />
                  <span className="text-[8px] font-bold tracking-wider text-white/55">{player.teamName?.slice(0, 14)}</span>
                </div>
                <div className="flex flex-col items-center border-r border-white/[0.08] px-3 py-2">
                  <p className="text-[6px] font-bold uppercase tracking-[1.5px] text-white/35">Rating</p>
                  <p className="font-['Archivo_Black',sans-serif] text-[12px] font-black text-white">{player.rating}</p>
                </div>
                <div className="flex flex-col items-center border-r border-white/[0.08] px-3 py-2">
                  <p className="text-[6px] font-bold uppercase tracking-[1.5px] text-white/35">Finishes</p>
                  <p className="font-['Archivo_Black',sans-serif] text-[12px] font-black text-white">{player.eliminations}</p>
                </div>
                <div className="flex items-center justify-center px-3 py-2">
                  <p className="font-['Archivo_Black',sans-serif] text-[11px] font-black text-white/70">{rankLabel}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 rounded-[16px] pointer-events-none" style={{ border: "1px solid rgba(255,255,255,0.1)", boxShadow: "inset 0 0 30px rgba(255,255,255,0.03)" }} />
        </div>

        {/* ====== BACK FACE ====== */}
        <div
          className="absolute inset-0 overflow-visible rounded-[16px]"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <div className="absolute inset-0 rounded-[16px] bg-[#0c0c0c]" />
          <div className="absolute inset-[5px] rounded-[12px] overflow-hidden">
            {/* Holographic base — matches front */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(140deg, #e879f9 0%, #818cf8 12%, #38bdf8 24%, #a78bfa 36%, #34d399 48%, #f472b6 60%, #818cf8 72%, #c084fc 84%, #38bdf8 100%)" }} />

            {/* Shimmer */}
            <div className="absolute inset-0 opacity-50" style={{ background: "linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.35) 40%, transparent 60%)" }} />

            {/* Geometric shapes */}
            <div className="absolute inset-0 overflow-hidden opacity-15">
              <div className="absolute -right-20 top-1/4 h-[200px] w-[140px] rotate-[-25deg] rounded-[20px] bg-white/20" />
              <div className="absolute -left-16 bottom-1/3 h-[180px] w-[120px] rotate-[20deg] rounded-[16px] bg-white/15" />
            </div>

            {/* Diagonal stripes */}
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "repeating-linear-gradient(135deg, white 0 2px, transparent 2px 12px)" }} />

            {/* Grain */}
            <div className="absolute inset-0" style={{ opacity: 0.18, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n2)'/%3E%3C/svg%3E")` }} />

            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/40" />

            <div className="relative z-10 flex h-full flex-col p-4">
              {/* Top: Avatar + name + rank */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute -inset-1.5 rounded-full border border-white/[0.12]" />
                    <div className="flex size-14 items-center justify-center rounded-full border-2 border-white/20 bg-white/[0.08]">
                      {player.photo ? (
                        <img src={player.photo} alt="" className="size-12 rounded-full object-cover" />
                      ) : (
                        <span className="font-['Archivo_Black',sans-serif] text-base font-black text-white/40">{lastName?.[0]}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[7px] font-bold uppercase tracking-[2px] text-white/50">Player</p>
                    <p className="font-['Archivo_Black',sans-serif] text-[15px] font-black uppercase leading-tight text-white drop-shadow-sm">{lastName}</p>
                  </div>
                </div>
                <div className="rounded-[8px] border border-white/20 bg-white/[0.08] px-3 py-2 text-center shadow-[0_0_12px_rgba(255,255,255,0.08)]">
                  <p className="text-[6px] font-bold uppercase tracking-[1.5px] text-white/50">Rank</p>
                  <p className="font-['Archivo_Black',sans-serif] text-[18px] font-black text-white drop-shadow-sm">#{rank}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="mb-2.5 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              {/* Header */}
              <div className="mb-2.5 flex items-center justify-between px-1">
                <p className="font-['Archivo_Black',sans-serif] text-[8px] font-bold uppercase tracking-[3px] text-white/65">Tournament History</p>
                <p className="text-[8px] font-bold uppercase tracking-[2px] text-white/50">{history.length} Events</p>
              </div>

              {/* Tournament list */}
              <div className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
                {history.map((t, i) => {
                  const isWinner = t.position === "Winner";
                  return (
                    <div key={i} className={`flex items-center h-[44px] rounded-[6px] px-2.5 ${isWinner ? "border border-amber-500/20 bg-amber-500/[0.06]" : "border border-white/[0.05] bg-white/[0.03]"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-['Archivo_Black',sans-serif] text-[9px] font-bold uppercase tracking-wider text-white/80 truncate">{t.tournament}</p>
                          {isWinner && <span className="shrink-0 rounded bg-amber-500/20 px-1 py-0.5 text-[5px] font-bold uppercase tracking-wider text-amber-400">WIN</span>}
                        </div>
                        <p className="text-[6px] font-medium tracking-wider text-white/35 truncate">{t.team}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="font-['Archivo_Black',sans-serif] text-[11px] font-black text-white text-center w-[28px]">{t.finishes}</p>
                        <div className="w-px h-4 bg-white/[0.08]" />
                        <p className={`font-['Archivo_Black',sans-serif] text-[7px] font-bold uppercase tracking-wider w-[55px] text-right ${isWinner ? "text-amber-400" : "text-white/60"}`}>
                          {t.position}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="mt-2 flex items-center justify-between rounded-[6px] border border-white/[0.08] bg-white/[0.05] px-3 py-2">
                <p className="font-['Archivo_Black',sans-serif] text-[8px] font-bold uppercase tracking-[2px] text-white/50">Total Finishes</p>
                <p className="font-['Archivo_Black',sans-serif] text-[16px] font-black text-white drop-shadow-sm">
                  {history.reduce((sum, t) => sum + t.finishes, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 rounded-[16px] pointer-events-none" style={{ border: "1px solid rgba(255,255,255,0.06)" }} />
        </div>
      </motion.div>
    </div>
  );
}

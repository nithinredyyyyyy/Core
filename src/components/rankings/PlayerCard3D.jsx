import { useState } from "react";
import { motion } from "framer-motion";
import TeamIdentity from "@/components/shared/TeamIdentity";

export default function PlayerCard3D({ player, rank, isFirst }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="group relative cursor-pointer"
      style={{ perspective: "1200px" }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative h-[460px] w-[280px] mx-auto"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* ====== FRONT FACE ====== */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[16px] bg-[#0a0a0a] shadow-2xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Inner card border */}
          <div className="absolute inset-[3px] rounded-[14px] overflow-hidden">
            {/* Holographic background */}
            <div className="absolute inset-0" style={{
              background: "linear-gradient(135deg, #c084fc 0%, #38bdf8 20%, #a78bfa 40%, #818cf8 60%, #34d399 80%, #f472b6 100%)",
              opacity: 0.35,
            }} />

            {/* Shimmer */}
            <div className="absolute inset-0" style={{
              background: "linear-gradient(160deg, transparent 30%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.1) 55%, transparent 70%)",
            }} />

            {/* Grain */}
            <div className="absolute inset-0 opacity-[0.18]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }} />

            {/* Player photo — hero element */}
            <div className="absolute inset-0 flex items-end justify-center">
              {player.photo ? (
                <img
                  src={player.photo}
                  alt={player.playerName}
                  className="h-[85%] w-auto object-contain object-bottom drop-shadow-[0_-4px_16px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex size-28 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 font-['Archivo_Black',sans-serif] text-4xl font-black text-white">
                  {player.playerName?.[0]}
                </div>
              )}
            </div>

            {/* Large rank number — right side */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <p className="font-['Archivo_Black',sans-serif] text-[80px] font-black leading-none text-white/15 [writing-mode:vertical-lr]">
                {String(rank).padStart(2, "0")}
              </p>
            </div>

            {/* Vertical side text — left */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <p className="font-['Archivo_Black',sans-serif] text-[8px] font-bold uppercase tracking-[3px] text-white/40 [writing-mode:vertical-lr]">
                Global Rankings
              </p>
            </div>

            {/* Top right logo */}
            <div className="absolute right-3 top-3">
              <img src="/images/core-logo.png" alt="" className="size-6 rounded-full opacity-60" />
            </div>

            {/* Bottom overlay gradient */}
            <div className="absolute inset-x-0 bottom-0 h-[45%]" style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, transparent 100%)",
            }} />

            {/* Bottom content */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-4">
              {/* Name */}
              <div className="mb-3">
                <p className="text-[10px] font-semibold tracking-[2px] text-white/50">
                  {player.playerName?.split(" ").slice(0, -1).join(" ")}
                </p>
                <h3 className="font-['Archivo_Black',sans-serif] text-[32px] font-black uppercase leading-[0.85] tracking-tight text-white">
                  {player.playerName?.split(" ").pop()}
                </h3>
              </div>

              {/* Stats bar */}
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-md">
                <TeamIdentity
                  name={player.teamName}
                  hideText
                  contained
                  logoBlockClassName="size-5"
                  logoClassName="h-4 w-4 object-contain"
                />
                <div className="h-3 w-px bg-white/20" />
                <div className="flex flex-col">
                  <p className="text-[7px] font-bold uppercase tracking-[1.5px] text-white/40">Rating</p>
                  <p className="font-['Archivo_Black',sans-serif] text-xs font-black text-white">{player.rating}</p>
                </div>
                <div className="h-3 w-px bg-white/20" />
                <div className="flex flex-col">
                  <p className="text-[7px] font-bold uppercase tracking-[1.5px] text-white/40">Finishes</p>
                  <p className="font-['Archivo_Black',sans-serif] text-xs font-black text-white">{player.eliminations}</p>
                </div>
                <div className="ml-auto rounded-md border border-white/10 bg-white/[0.06] px-2 py-1">
                  <p className="font-['Archivo_Black',sans-serif] text-[9px] font-bold text-white/70">#{rank}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====== BACK FACE ====== */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[16px] bg-[#0a0a0a] shadow-2xl"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="absolute inset-[3px] rounded-[14px] overflow-hidden">
            {/* Holographic background (shifted) */}
            <div className="absolute inset-0" style={{
              background: "linear-gradient(225deg, #f472b6 0%, #818cf8 20%, #34d399 40%, #c084fc 60%, #38bdf8 80%, #a78bfa 100%)",
              opacity: 0.3,
            }} />

            {/* Shimmer */}
            <div className="absolute inset-0" style={{
              background: "linear-gradient(200deg, transparent 25%, rgba(255,255,255,0.2) 45%, transparent 65%)",
            }} />

            {/* Grain */}
            <div className="absolute inset-0 opacity-[0.15]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n2)'/%3E%3C/svg%3E")`,
            }} />

            {/* Diagonal pattern overlay */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: "repeating-linear-gradient(45deg, white 0 1px, transparent 1px 8px)",
            }} />

            <div className="relative z-10 flex h-full flex-col justify-between p-5">
              {/* Top: Team logo + rank */}
              <div className="flex items-start justify-between">
                <TeamIdentity
                  name={player.teamName}
                  hideText
                  contained
                  logoBlockClassName="size-12"
                  logoClassName="h-10 w-10 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                />
                <div className="rounded-lg border border-white/10 bg-[#0a0a0a]/70 px-3 py-2 text-center backdrop-blur-md">
                  <p className="text-[7px] font-bold uppercase tracking-[1.5px] text-white/40">Rank</p>
                  <p className="font-['Archivo_Black',sans-serif] text-xl font-black text-white">#{rank}</p>
                </div>
              </div>

              {/* Center: Player info */}
              <div className="flex flex-1 flex-col items-center justify-center gap-5">
                {/* Player name */}
                <div className="text-center">
                  <p className="text-[10px] font-semibold tracking-[2px] text-white/50">
                    {player.playerName?.split(" ").slice(0, -1).join(" ")}
                  </p>
                  <p className="font-['Archivo_Black',sans-serif] text-[28px] font-black uppercase leading-[0.85] text-white">
                    {player.playerName?.split(" ").pop()}
                  </p>
                </div>

                {/* Stats grid */}
                <div className="grid w-full grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/10 bg-[#0a0a0a]/60 px-3 py-3 text-center backdrop-blur-md">
                    <p className="text-[7px] font-bold uppercase tracking-[1.5px] text-white/40">Rating</p>
                    <p className="mt-1 font-['Archivo_Black',sans-serif] text-xl font-black text-white">
                      {player.rating}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-[#0a0a0a]/60 px-3 py-3 text-center backdrop-blur-md">
                    <p className="text-[7px] font-bold uppercase tracking-[1.5px] text-white/40">Finishes</p>
                    <p className="mt-1 font-['Archivo_Black',sans-serif] text-xl font-black text-white">
                      {player.eliminations}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom: Team + season */}
              <div className="space-y-2">
                <div className="rounded-lg border border-white/10 bg-[#0a0a0a]/60 px-4 py-3 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <p className="font-['Archivo_Black',sans-serif] text-[11px] font-bold uppercase tracking-[2px] text-white/80">
                      {player.teamName}
                    </p>
                    <p className="text-[8px] tracking-wider text-white/35">BGMI 2026</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

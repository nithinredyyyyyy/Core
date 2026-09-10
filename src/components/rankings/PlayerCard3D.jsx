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
          className="absolute inset-0 overflow-hidden rounded-[24px] shadow-2xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Holographic gradient background */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(135deg, #c084fc 0%, #38bdf8 25%, #a78bfa 50%, #818cf8 75%, #34d399 100%)",
          }} />

          {/* Animated shimmer overlay */}
          <div className="absolute inset-0 opacity-60" style={{
            background: "linear-gradient(160deg, transparent 20%, rgba(255,255,255,0.3) 40%, rgba(255,182,255,0.2) 50%, transparent 70%)",
          }} />

          {/* Grain texture */}
          <div className="absolute inset-0 opacity-[0.15]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }} />

          {/* Glow border */}
          <div className="absolute inset-0 rounded-[24px] border border-white/30" />

          <div className="relative z-10 flex h-full flex-col justify-between p-4">
            {/* Top: Rank badge */}
            <div className="flex items-start justify-between">
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 backdrop-blur-md">
                <p className="font-['Archivo_Black',sans-serif] text-[10px] font-bold uppercase tracking-[1.5px] text-white/80">
                  #{rank}
                </p>
              </div>
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 backdrop-blur-md">
                <p className="font-['Archivo_Black',sans-serif] text-[10px] font-bold uppercase tracking-[1.5px] text-white/80">
                  {player.rating}
                </p>
              </div>
            </div>

            {/* Center: Player photo with 3D shape */}
            <div className="flex flex-1 items-center justify-center">
              <div className="relative">
                {/* 3D star shape behind player */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="size-[180px] opacity-40">
                    <path
                      d="M100 10 L120 70 L190 80 L140 130 L150 190 L100 155 L50 190 L60 130 L10 80 L80 70 Z"
                      fill="white"
                      filter="url(#glow)"
                    />
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                  </svg>
                </div>

                {/* Player photo */}
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt={player.playerName}
                    className="relative z-10 h-[200px] w-auto object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="relative z-10 flex size-28 items-center justify-center rounded-full border-2 border-white/30 bg-white/20 font-['Archivo_Black',sans-serif] text-4xl font-black text-white">
                    {player.playerName?.[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: Dark metadata bar */}
            <div className="space-y-2">
              {/* Player name */}
              <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/80 px-4 py-3 backdrop-blur-md">
                <h3 className="font-['Archivo_Black',sans-serif] text-[22px] font-black uppercase leading-tight tracking-tight text-white">
                  {player.playerName}
                </h3>
                <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-white/50">
                  {player.teamName}
                </p>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-white/10 bg-[#1a1a2e]/80 px-3 py-2 text-center backdrop-blur-md">
                  <p className="text-[7px] font-bold uppercase tracking-[1.5px] text-white/40">Finishes</p>
                  <p className="font-['Archivo_Black',sans-serif] text-sm font-black text-white">{player.eliminations}</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a2e]/80 px-3 py-2 backdrop-blur-md">
                  <TeamIdentity
                    name={player.teamName}
                    hideText
                    contained
                    logoBlockClassName="size-5"
                    logoClassName="h-4 w-4 object-contain"
                  />
                  <span className="text-[8px] font-semibold tracking-wider text-white/60">BGMI 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====== BACK FACE ====== */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[24px] shadow-2xl"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Holographic gradient (shifted) */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(225deg, #a78bfa 0%, #34d399 25%, #818cf8 50%, #c084fc 75%, #38bdf8 100%)",
          }} />

          {/* Shimmer */}
          <div className="absolute inset-0 opacity-50" style={{
            background: "linear-gradient(200deg, transparent 25%, rgba(255,255,255,0.25) 45%, rgba(167,139,250,0.2) 55%, transparent 75%)",
          }} />

          {/* Grain */}
          <div className="absolute inset-0 opacity-[0.12]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise2)'/%3E%3C/svg%3E")`,
          }} />

          {/* Glow border */}
          <div className="absolute inset-0 rounded-[24px] border border-white/25" />

          <div className="relative z-10 flex h-full flex-col justify-between p-4">
            {/* Top: Team logo + rank */}
            <div className="flex items-start justify-between">
              <TeamIdentity
                name={player.teamName}
                hideText
                contained
                logoBlockClassName="size-12"
                logoClassName="h-10 w-10 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
              />
              <div className="rounded-xl border border-white/15 bg-[#1a1a2e]/70 px-3 py-2 text-center backdrop-blur-md">
                <p className="text-[7px] font-bold uppercase tracking-[1.5px] text-white/50">Rank</p>
                <p className="font-['Archivo_Black',sans-serif] text-xl font-black text-white">#{rank}</p>
              </div>
            </div>

            {/* Center: Stats in holographic containers */}
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-center backdrop-blur-md">
                <p className="text-[9px] font-bold uppercase tracking-[2px] text-white/60">Team</p>
                <p className="mt-1 font-['Archivo_Black',sans-serif] text-lg font-black text-white">
                  {player.teamName}
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-center backdrop-blur-md">
                  <p className="text-[8px] font-bold uppercase tracking-[1.5px] text-white/50">Rating</p>
                  <p className="mt-1 font-['Archivo_Black',sans-serif] text-xl font-black text-white">
                    {player.rating}
                  </p>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-center backdrop-blur-md">
                  <p className="text-[8px] font-bold uppercase tracking-[1.5px] text-white/50">Finishes</p>
                  <p className="mt-1 font-['Archivo_Black',sans-serif] text-xl font-black text-white">
                    {player.eliminations}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom: Player name + team */}
            <div className="space-y-2">
              <div className="rounded-xl border border-white/10 bg-[#1a1a2e]/80 px-4 py-3 backdrop-blur-md">
                <p className="font-['Archivo_Black',sans-serif] text-[11px] font-bold uppercase tracking-[2px] text-white/70">
                  {player.playerName}
                </p>
                <p className="text-[8px] tracking-wider text-white/40">
                  {player.teamName} &middot; Global Rankings
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

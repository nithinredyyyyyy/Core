import { useState } from "react";
import { motion } from "framer-motion";
import TeamIdentity from "@/components/shared/TeamIdentity";

export default function PlayerCard3D({ player, rank, isFirst }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const rankLabel = rank === 1 ? "1ST" : rank === 2 ? "2ND" : rank === 3 ? "3RD" : `${rank}TH`;

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
          {/* Black outer frame */}
          <div className="absolute inset-0 rounded-[16px] bg-[#0c0c0c]" />

          {/* Inner card */}
          <div className="absolute inset-[5px] rounded-[12px] overflow-hidden">
            {/* Holographic gradient base */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(140deg, #e879f9 0%, #818cf8 12%, #38bdf8 24%, #a78bfa 36%, #34d399 48%, #f472b6 60%, #818cf8 72%, #c084fc 84%, #38bdf8 100%)",
              }}
            />

            {/* Animated shimmer band */}
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  "linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.4) 38%, rgba(255,255,255,0.15) 50%, transparent 62%)",
              }}
            />

            {/* Geometric shapes (university card style) */}
            <div className="absolute inset-0 overflow-hidden opacity-15">
              <div className="absolute -left-20 top-1/4 h-[200px] w-[140px] rotate-[-25deg] rounded-[20px] bg-white/20" />
              <div className="absolute -right-16 top-1/3 h-[180px] w-[120px] rotate-[20deg] rounded-[16px] bg-white/15" />
              <div className="absolute left-1/3 -top-10 h-[100px] w-[250px] rotate-[-15deg] rounded-[24px] bg-white/10" />
              <div className="absolute right-1/4 bottom-1/4 h-[80px] w-[180px] rotate-[30deg] rounded-[14px] bg-white/12" />
            </div>

            {/* Diagonal stripes (university card style) */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, white 0 2px, transparent 2px 12px)",
              }}
            />

            {/* Noise/grain texture */}
            <div
              className="absolute inset-0"
              style={{
                opacity: 0.18,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* ====== PLAYER PHOTO — POP OUT EFFECT ====== */}
            <div className="absolute inset-0 flex items-end justify-center">
              {player.photo ? (
                <img
                  src={player.photo}
                  alt={player.playerName}
                  className="relative h-[92%] w-auto object-contain object-bottom drop-shadow-[0_-4px_20px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-[1.02]"
                  style={{ marginBottom: -8 }}
                />
              ) : (
                <div className="relative flex size-28 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 font-['Archivo_Black',sans-serif] text-4xl font-black text-white">
                  {player.playerName?.[0]}
                </div>
              )}
            </div>

            {/* ====== LARGE RANK NUMBER — RIGHT SIDE ====== */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2">
              <p
                className="font-['Archivo_Black',sans-serif] font-black leading-none text-white/[0.12]"
                style={{ fontSize: 100, writingMode: "vertical-lr", letterSpacing: "-5px" }}
              >
                {String(rank).padStart(2, "0")}
              </p>
            </div>

            {/* ====== VERTICAL TEXT — LEFT EDGE ====== */}
            <div className="absolute left-[7px] top-1/2 -translate-y-1/2">
              <p
                className="font-['Archivo_Black',sans-serif] text-[7px] font-bold uppercase tracking-[4px] text-white/30"
                style={{ writingMode: "vertical-lr" }}
              >
                GLOBAL RANKINGS
              </p>
            </div>

            {/* ====== TOP-RANK BADGE ====== */}
            <div className="absolute left-3 top-3">
              <div className="rounded-[6px] border border-white/10 bg-black/40 px-2 py-1 backdrop-blur-md">
                <p className="font-['Archivo_Black',sans-serif] text-[9px] font-black tracking-wider text-white/80">
                  #{rank}
                </p>
              </div>
            </div>

            {/* ====== TOP-RIGHT ICON ====== */}
            <div className="absolute right-3 top-3">
              <img src="/images/core-logo.png" alt="" className="size-5 rounded-full opacity-50" />
            </div>

            {/* ====== BOTTOM GRADIENT ====== */}
            <div
              className="absolute inset-x-0 bottom-0"
              style={{
                height: "52%",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.75) 45%, transparent 100%)",
              }}
            />

            {/* ====== BOTTOM CONTENT ====== */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-3.5">
              {/* Player name — split style */}
              <div className="mb-3">
                <p className="text-[9px] font-semibold tracking-[3px] text-white/50">
                  {player.playerName?.split(" ").slice(0, -1).join(" ")}
                </p>
                <h3
                  className="font-['Archivo_Black',sans-serif] font-black uppercase leading-[0.8] text-white"
                  style={{ fontSize: 38, letterSpacing: "-1.5px" }}
                >
                  {player.playerName?.split(" ").pop()}
                </h3>
              </div>

              {/* Stats bar — dark glass */}
              <div className="flex items-center gap-0 rounded-[10px] border border-white/[0.08] bg-[#12121a]/70 backdrop-blur-xl">
                {/* Team */}
                <div className="flex items-center gap-2 border-r border-white/[0.08] px-3 py-2.5">
                  <TeamIdentity
                    name={player.teamName}
                    hideText
                    contained
                    logoBlockClassName="size-5"
                    logoClassName="h-4 w-4 object-contain"
                  />
                  <span className="text-[8px] font-bold tracking-wider text-white/55">
                    {player.teamName?.slice(0, 14)}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex flex-col items-center border-r border-white/[0.08] px-3 py-2">
                  <p className="text-[6px] font-bold uppercase tracking-[1.5px] text-white/35">Rating</p>
                  <p className="font-['Archivo_Black',sans-serif] text-[12px] font-black text-white">
                    {player.rating}
                  </p>
                </div>

                {/* Finishes */}
                <div className="flex flex-col items-center border-r border-white/[0.08] px-3 py-2">
                  <p className="text-[6px] font-bold uppercase tracking-[1.5px] text-white/35">Finishes</p>
                  <p className="font-['Archivo_Black',sans-serif] text-[12px] font-black text-white">
                    {player.eliminations}
                  </p>
                </div>

                {/* Rank label */}
                <div className="flex items-center justify-center px-3 py-2">
                  <p className="font-['Archivo_Black',sans-serif] text-[11px] font-black text-white/70">
                    {rankLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ====== GLOW BORDER EFFECT ====== */}
          <div
            className="absolute inset-0 rounded-[16px] pointer-events-none"
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "inset 0 0 30px rgba(255,255,255,0.03)",
            }}
          />
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
          {/* Black outer frame */}
          <div className="absolute inset-0 rounded-[16px] bg-[#0c0c0c]" />

          {/* Inner card */}
          <div className="absolute inset-[5px] rounded-[12px] overflow-hidden">
            {/* Holographic gradient (shifted) */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(200deg, #c084fc 0%, #f472b6 12%, #34d399 24%, #818cf8 36%, #38bdf8 48%, #a78bfa 60%, #e879f9 72%, #818cf8 84%, #34d399 100%)",
              }}
            />

            {/* Shimmer */}
            <div
              className="absolute inset-0 opacity-45"
              style={{
                background:
                  "linear-gradient(165deg, transparent 30%, rgba(255,255,255,0.3) 48%, transparent 65%)",
              }}
            />

            {/* Geometric shapes */}
            <div className="absolute inset-0 overflow-hidden opacity-12">
              <div className="absolute -right-20 top-1/4 h-[180px] w-[150px] rotate-[-20deg] rounded-[18px] bg-white/20" />
              <div className="absolute -left-14 bottom-1/3 h-[140px] w-[120px] rotate-[25deg] rounded-[14px] bg-white/15" />
            </div>

            {/* Diagonal stripes */}
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, white 0 2px, transparent 2px 10px)",
              }}
            />

            {/* Grain */}
            <div
              className="absolute inset-0"
              style={{
                opacity: 0.15,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n2)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Bottom gradient */}
            <div
              className="absolute inset-x-0 bottom-0"
              style={{
                height: "55%",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
              }}
            />

            <div className="relative z-10 flex h-full flex-col justify-between p-4">
              {/* Top: Team logo + rank */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-[8px] border border-white/10 bg-black/40 p-1.5 backdrop-blur-md">
                    <TeamIdentity
                      name={player.teamName}
                      hideText
                      contained
                      logoBlockClassName="size-8"
                      logoClassName="h-7 w-7 object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-['Archivo_Black',sans-serif] text-[11px] font-bold uppercase tracking-[1.5px] text-white/75">
                      {player.teamName}
                    </p>
                  </div>
                </div>
                <div className="rounded-[8px] border border-white/10 bg-black/50 px-3 py-2 text-center backdrop-blur-md">
                  <p className="text-[6px] font-bold uppercase tracking-[1.5px] text-white/35">Rank</p>
                  <p className="font-['Archivo_Black',sans-serif] text-xl font-black text-white">
                    #{rank}
                  </p>
                </div>
              </div>

              {/* Center: Player name + stats */}
              <div className="flex flex-1 flex-col items-center justify-center gap-5">
                <div className="text-center">
                  <p className="text-[9px] font-semibold tracking-[3px] text-white/50">
                    {player.playerName?.split(" ").slice(0, -1).join(" ")}
                  </p>
                  <p
                    className="font-['Archivo_Black',sans-serif] font-black uppercase leading-[0.8] text-white"
                    style={{ fontSize: 34, letterSpacing: "-1.5px" }}
                  >
                    {player.playerName?.split(" ").pop()}
                  </p>
                </div>

                {/* Stats grid */}
                <div className="grid w-full grid-cols-2 gap-3">
                  <div className="rounded-[10px] border border-white/[0.08] bg-[#12121a]/60 px-3 py-3 text-center backdrop-blur-md">
                    <p className="text-[6px] font-bold uppercase tracking-[1.5px] text-white/35">Rating</p>
                    <p className="mt-1 font-['Archivo_Black',sans-serif] text-xl font-black text-white">
                      {player.rating}
                    </p>
                  </div>
                  <div className="rounded-[10px] border border-white/[0.08] bg-[#12121a]/60 px-3 py-3 text-center backdrop-blur-md">
                    <p className="text-[6px] font-bold uppercase tracking-[1.5px] text-white/35">Finishes</p>
                    <p className="mt-1 font-['Archivo_Black',sans-serif] text-xl font-black text-white">
                      {player.eliminations}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom: Season */}
              <div className="rounded-[8px] border border-white/[0.08] bg-[#12121a]/70 px-4 py-2.5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <p className="font-['Archivo_Black',sans-serif] text-[9px] font-bold uppercase tracking-[2px] text-white/65">
                    {player.teamName}
                  </p>
                  <p className="text-[7px] tracking-wider text-white/30">BGMI 2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* Glow border */}
          <div
            className="absolute inset-0 rounded-[16px] pointer-events-none"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "inset 0 0 30px rgba(255,255,255,0.02)",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

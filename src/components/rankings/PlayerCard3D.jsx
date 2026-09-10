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
        className="relative mx-auto"
        style={{
          width: 280,
          height: 400,
          transformStyle: "preserve-3d",
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* ====== FRONT FACE ====== */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[14px]"
          style={{
            backfaceVisibility: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          {/* Black outer frame */}
          <div className="absolute inset-0 rounded-[14px] bg-[#0c0c0c]" />

          {/* Inner card area */}
          <div className="absolute inset-[4px] rounded-[11px] overflow-hidden">
            {/* Holographic gradient */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(145deg, #e879f9 0%, #818cf8 15%, #38bdf8 30%, #a78bfa 45%, #34d399 55%, #f472b6 70%, #818cf8 85%, #c084fc 100%)",
              }}
            />

            {/* Secondary shimmer */}
            <div
              className="absolute inset-0 opacity-50"
              style={{
                background:
                  "linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.35) 35%, rgba(255,255,255,0.15) 50%, transparent 65%)",
              }}
            />

            {/* Noise/grain texture */}
            <div
              className="absolute inset-0"
              style={{
                opacity: 0.2,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Player photo — positioned to fill card */}
            <div className="absolute inset-0 flex items-end justify-center">
              {player.photo ? (
                <img
                  src={player.photo}
                  alt={player.playerName}
                  className="h-[88%] w-auto object-contain object-bottom drop-shadow-[0_-2px_12px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:scale-[1.01]"
                  style={{ maxHeight: 350 }}
                />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 font-['Archivo_Black',sans-serif] text-3xl font-black text-white">
                  {player.playerName?.[0]}
                </div>
              )}
            </div>

            {/* Large rank number — right side */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <p
                className="font-['Archivo_Black',sans-serif] font-black leading-none text-white/20"
                style={{
                  fontSize: 90,
                  writingMode: "vertical-lr",
                  letterSpacing: "-4px",
                }}
              >
                {String(rank).padStart(2, "0")}
              </p>
            </div>

            {/* Vertical text — left edge */}
            <div className="absolute left-[6px] top-1/2 -translate-y-1/2">
              <p
                className="font-['Archivo_Black',sans-serif] text-[7px] font-bold uppercase tracking-[3px] text-white/35"
                style={{ writingMode: "vertical-lr" }}
              >
                GLOBAL RANKINGS
              </p>
            </div>

            {/* Top-right icon */}
            <div className="absolute right-3 top-3">
              <img
                src="/images/core-logo.png"
                alt=""
                className="size-5 rounded-full opacity-50"
              />
            </div>

            {/* Bottom gradient overlay */}
            <div
              className="absolute inset-x-0 bottom-0"
              style={{
                height: "50%",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
              }}
            />

            {/* ====== BOTTOM CONTENT ====== */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-3 pb-3">
              {/* Player name */}
              <div className="mb-2.5">
                <p className="text-[9px] font-semibold tracking-[2.5px] text-white/55">
                  {player.playerName?.split(" ").slice(0, -1).join(" ")}
                </p>
                <h3
                  className="font-['Archivo_Black',sans-serif] font-black uppercase leading-[0.82] text-white"
                  style={{ fontSize: 36, letterSpacing: "-1px" }}
                >
                  {player.playerName?.split(" ").pop()}
                </h3>
              </div>

              {/* Stats bar */}
              <div className="flex items-center gap-0 rounded-[8px] border border-white/[0.08] bg-black/50 backdrop-blur-md">
                {/* Team logo */}
                <div className="flex items-center gap-1.5 border-r border-white/[0.08] px-2.5 py-2">
                  <TeamIdentity
                    name={player.teamName}
                    hideText
                    contained
                    logoBlockClassName="size-4"
                    logoClassName="h-3.5 w-3.5 object-contain"
                  />
                  <span className="text-[7px] font-bold tracking-wider text-white/50">
                    {player.teamName?.slice(0, 12)}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex flex-col items-center border-r border-white/[0.08] px-2.5 py-1.5">
                  <p className="text-[6px] font-bold uppercase tracking-[1px] text-white/35">
                    Rating
                  </p>
                  <p className="font-['Archivo_Black',sans-serif] text-[11px] font-black text-white">
                    {player.rating}
                  </p>
                </div>

                {/* Finishes */}
                <div className="flex flex-col items-center border-r border-white/[0.08] px-2.5 py-1.5">
                  <p className="text-[6px] font-bold uppercase tracking-[1px] text-white/35">
                    Finishes
                  </p>
                  <p className="font-['Archivo_Black',sans-serif] text-[11px] font-black text-white">
                    {player.eliminations}
                  </p>
                </div>

                {/* Rank badge */}
                <div className="flex items-center justify-center px-2.5 py-1.5">
                  <p className="font-['Archivo_Black',sans-serif] text-[11px] font-black text-white/70">
                    #{rank}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====== BACK FACE ====== */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[14px]"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
          }}
        >
          {/* Black outer frame */}
          <div className="absolute inset-0 rounded-[14px] bg-[#0c0c0c]" />

          {/* Inner card */}
          <div className="absolute inset-[4px] rounded-[11px] overflow-hidden">
            {/* Holographic gradient (shifted) */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(200deg, #c084fc 0%, #f472b6 15%, #34d399 30%, #818cf8 45%, #38bdf8 60%, #a78bfa 75%, #e879f9 100%)",
              }}
            />

            {/* Shimmer */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  "linear-gradient(180deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
              }}
            />

            {/* Grain */}
            <div
              className="absolute inset-0"
              style={{
                opacity: 0.18,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g2)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Diagonal pattern */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, white 0 1px, transparent 1px 10px)",
              }}
            />

            {/* Bottom gradient */}
            <div
              className="absolute inset-x-0 bottom-0"
              style={{
                height: "55%",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
              }}
            />

            <div className="relative z-10 flex h-full flex-col justify-between p-4">
              {/* Top: Team logo + rank */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <TeamIdentity
                    name={player.teamName}
                    hideText
                    contained
                    logoBlockClassName="size-10"
                    logoClassName="h-8 w-8 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
                  />
                  <div>
                    <p className="font-['Archivo_Black',sans-serif] text-[10px] font-bold uppercase tracking-[1.5px] text-white/70">
                      {player.teamName}
                    </p>
                  </div>
                </div>
                <div className="rounded-[8px] border border-white/[0.08] bg-black/50 px-3 py-1.5 text-center backdrop-blur-md">
                  <p className="text-[6px] font-bold uppercase tracking-[1.5px] text-white/35">
                    Rank
                  </p>
                  <p className="font-['Archivo_Black',sans-serif] text-lg font-black text-white">
                    #{rank}
                  </p>
                </div>
              </div>

              {/* Center: Player info */}
              <div className="flex flex-1 flex-col items-center justify-center gap-4">
                {/* Player name */}
                <div className="text-center">
                  <p className="text-[9px] font-semibold tracking-[2.5px] text-white/50">
                    {player.playerName?.split(" ").slice(0, -1).join(" ")}
                  </p>
                  <p
                    className="font-['Archivo_Black',sans-serif] font-black uppercase leading-[0.82] text-white"
                    style={{ fontSize: 32, letterSpacing: "-1px" }}
                  >
                    {player.playerName?.split(" ").pop()}
                  </p>
                </div>

                {/* Stats grid */}
                <div className="grid w-full grid-cols-2 gap-2.5">
                  <div className="rounded-[8px] border border-white/[0.08] bg-black/50 px-3 py-2.5 text-center backdrop-blur-md">
                    <p className="text-[6px] font-bold uppercase tracking-[1.5px] text-white/35">
                      Rating
                    </p>
                    <p className="mt-0.5 font-['Archivo_Black',sans-serif] text-lg font-black text-white">
                      {player.rating}
                    </p>
                  </div>
                  <div className="rounded-[8px] border border-white/[0.08] bg-black/50 px-3 py-2.5 text-center backdrop-blur-md">
                    <p className="text-[6px] font-bold uppercase tracking-[1.5px] text-white/35">
                      Finishes
                    </p>
                    <p className="mt-0.5 font-['Archivo_Black',sans-serif] text-lg font-black text-white">
                      {player.eliminations}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom: Season info */}
              <div className="rounded-[8px] border border-white/[0.08] bg-black/50 px-4 py-2.5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <p className="font-['Archivo_Black',sans-serif] text-[9px] font-bold uppercase tracking-[2px] text-white/60">
                    {player.teamName}
                  </p>
                  <p className="text-[7px] tracking-wider text-white/30">BGMI 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

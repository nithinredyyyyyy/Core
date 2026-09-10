import { useState } from "react";
import { motion } from "framer-motion";
import TeamIdentity from "@/components/shared/TeamIdentity";

const CARD_STYLES = [
  { bg: "#f59e0b", nameColor: "#ffffff", tagColor: "rgba(255,255,255,0.75)" },
  { bg: "#64748b", nameColor: "#ffffff", tagColor: "rgba(255,255,255,0.75)" },
  { bg: "#92400e", nameColor: "#ffffff", tagColor: "rgba(255,255,255,0.75)" },
];

export default function PlayerCard3D({ player, rank, isFirst }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const colorIdx = isFirst ? 0 : rank === 2 ? 1 : 2;
  const card = CARD_STYLES[colorIdx];

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
          className="absolute inset-0 overflow-hidden rounded-[24px]"
          style={{
            backfaceVisibility: "hidden",
            background: card.bg,
          }}
        >
          {/* Card border highlight */}
          <div className="absolute inset-0 rounded-[24px] border-2 border-white/[0.08]" />

          {/* Inner frame line */}
          <div className="absolute inset-3 rounded-[18px] border border-white/[0.1]" />

          <div className="relative z-10 flex h-full flex-col justify-between p-5">
            {/* Top: Player Name + Team */}
            <div className="relative z-20">
              <h3
                className="font-['Archivo_Black',sans-serif] text-[28px] font-black uppercase leading-[0.9] tracking-tight"
                style={{ color: card.nameColor }}
              >
                {player.playerName?.split(" ").map((w, i) => (
                  <span key={i} className="block">{w}</span>
                ))}
              </h3>
              <p className="mt-2 text-[11px] font-semibold tracking-wide" style={{ color: card.tagColor }}>
                {player.teamName}
              </p>
            </div>

            {/* Center: Player Photo — pops out above card */}
            <div className="absolute inset-x-0 top-0 z-30 flex justify-center pt-[70px]">
              <div className="relative">
                {/* Shadow behind player */}
                <div className="absolute -inset-4 rounded-full bg-black/20 blur-xl" />
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt={player.playerName}
                    className="relative h-[260px] w-auto object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div
                    className="relative flex size-32 items-center justify-center rounded-full border-2 bg-white/20 font-['Archivo_Black',sans-serif] text-4xl font-black"
                    style={{ color: card.nameColor }}
                  >
                    {player.playerName?.[0]}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="relative z-20 flex items-end justify-between">
              <div className="flex items-center gap-2">
                <TeamIdentity
                  name={player.teamName}
                  hideText
                  contained
                  logoBlockClassName="size-8"
                  logoClassName="h-6 w-6 object-contain"
                />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: card.tagColor }}>
                    Rating {player.rating}
                  </p>
                  <p className="text-[8px] font-medium" style={{ color: card.tagColor, opacity: 0.7 }}>
                    {player.eliminations} finishes
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className="font-['Archivo_Black',sans-serif] text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: card.tagColor }}
                >
                  #{rank}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ====== BACK FACE ====== */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[24px]"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "#1a1a2e",
          }}
        >
          {/* Border highlight */}
          <div className="absolute inset-0 rounded-[24px] border-2 border-white/[0.06]" />

          {/* Inner frame */}
          <div className="absolute inset-3 rounded-[18px] border border-white/[0.06]" />

          {/* Abstract background shape */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div
              className="absolute -left-16 top-1/4 h-[300px] w-[300px] rotate-45 rounded-[40px]"
              style={{ background: card.bg }}
            />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between p-5">
            {/* Top: Team logo large */}
            <div className="flex items-start justify-between">
              <TeamIdentity
                name={player.teamName}
                hideText
                contained
                logoBlockClassName="size-14"
                logoClassName="h-12 w-12 object-contain"
              />
              <div className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-center">
                <p className="text-[7px] font-bold uppercase tracking-[1.5px] text-white/40">Rank</p>
                <p className="font-['Archivo_Black',sans-serif] text-lg font-black" style={{ color: card.bg }}>
                  #{rank}
                </p>
              </div>
            </div>

            {/* Center: Stats */}
            <div className="flex flex-col items-center">
              <p className="font-['Archivo_Black',sans-serif] text-[11px] font-bold uppercase tracking-[4px] text-white/70">
                {player.teamName}
              </p>

              <div className="mt-6 grid w-full grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-center">
                  <p className="text-[8px] font-bold uppercase tracking-[1.5px] text-white/40">Rating</p>
                  <p className="mt-1 font-['Archivo_Black',sans-serif] text-lg font-black text-white">
                    {player.rating}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-center">
                  <p className="text-[8px] font-bold uppercase tracking-[1.5px] text-white/40">Finishes</p>
                  <p className="mt-1 font-['Archivo_Black',sans-serif] text-lg font-black text-white">
                    {player.eliminations}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom */}
            <div className="flex items-end justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-[2px] text-white/25">
                BGMI 2026
              </p>
              <p className="text-[8px] text-white/20">
                Global Rankings
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

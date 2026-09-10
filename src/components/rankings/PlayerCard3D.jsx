import { useState } from "react";
import { motion } from "framer-motion";
import TeamIdentity from "@/components/shared/TeamIdentity";

const ACCENT_COLORS = [
  { bg: "#f59e0b", dark: "#b45309", ring: "ring-amber-500/40" },
  { bg: "#94a3b8", dark: "#475569", ring: "ring-slate-400/40" },
  { bg: "#b45309", dark: "#78350f", ring: "ring-amber-700/40" },
];

export default function PlayerCard3D({ player, rank, isFirst }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const colorIdx = isFirst ? 0 : rank === 2 ? 1 : 2;
  const accent = ACCENT_COLORS[colorIdx];

  return (
    <div
      className="group relative cursor-pointer"
      style={{ perspective: "1200px" }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      {/* Rank badge */}
      <div
        className="absolute -top-3 left-1/2 z-30 flex size-9 -translate-x-1/2 items-center justify-center rounded-full font-black text-white shadow-lg"
        style={{ background: accent.bg }}
      >
        #{rank}
      </div>

      <motion.div
        className="relative h-[440px] w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* ====== FRONT FACE ====== */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[22px] shadow-2xl"
          style={{
            backfaceVisibility: "hidden",
            background: `linear-gradient(160deg, ${accent.bg} 0%, ${accent.dark} 100%)`,
          }}
        >
          {/* Light overlay */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%, rgba(0,0,0,0.2) 100%)",
          }} />

          {/* Abstract diagonal shapes */}
          <div className="absolute inset-0 overflow-hidden opacity-15">
            <div className="absolute -left-10 top-14 h-[70px] w-[320px] rotate-[-32deg] rounded bg-white/10" />
            <div className="absolute -left-4 top-32 h-[50px] w-[280px] rotate-[-32deg] rounded bg-white/[0.07]" />
            <div className="absolute -right-16 top-20 h-[60px] w-[260px] rotate-[32deg] rounded bg-white/[0.06]" />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between p-6">
            {/* Top: Rank + Team logo */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <TeamIdentity
                  name={player.teamName}
                  hideText
                  contained
                  logoBlockClassName="size-10"
                  logoClassName="h-8 w-8 object-contain"
                />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-white/70">
                    {player.teamName}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-center backdrop-blur-sm">
                <p className="text-[8px] font-semibold uppercase tracking-wider text-white/60">Rating</p>
                <p className="font-['Archivo_Black',sans-serif] text-base font-black text-white">
                  {player.rating}
                </p>
              </div>
            </div>

            {/* Center: Player Photo */}
            <div className="flex flex-1 items-center justify-center py-2">
              {player.photo ? (
                <img
                  src={player.photo}
                  alt={player.playerName}
                  className="max-h-[210px] w-auto object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex size-28 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 font-['Archivo_Black',sans-serif] text-4xl font-black text-white/40">
                  {player.playerName?.[0]}
                </div>
              )}
            </div>

            {/* Bottom: Name + Finishes */}
            <div className="flex items-end justify-between">
              <div>
                <h3 className="font-['Archivo_Black',sans-serif] text-[26px] font-black uppercase leading-none tracking-wide text-white drop-shadow-md">
                  {player.playerName}
                </h3>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-right backdrop-blur-sm">
                <p className="text-[8px] font-semibold uppercase tracking-wider text-white/60">Finishes</p>
                <p className="font-['Archivo_Black',sans-serif] text-base font-black text-white">
                  {player.eliminations}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ====== BACK FACE ====== */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[22px] shadow-2xl"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: `linear-gradient(160deg, ${accent.dark} 0%, #0f0f18 100%)`,
          }}
        >
          {/* Subtle texture */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)",
          }} />

          <div className="relative z-10 flex h-full flex-col p-6">
            {/* Back top: Team logo + Rank */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <TeamIdentity
                  name={player.teamName}
                  hideText
                  contained
                  logoBlockClassName="size-12"
                  logoClassName="h-10 w-10 object-contain"
                />
                <div>
                  <p className="font-['Archivo_Black',sans-serif] text-xs font-bold uppercase tracking-[2px] text-white/90">
                    {player.teamName}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.07] px-3 py-1.5 text-center backdrop-blur-sm">
                <p className="text-[7px] font-semibold uppercase tracking-[1.5px] text-white/50">Rank</p>
                <p className="font-['Archivo_Black',sans-serif] text-xl font-black" style={{ color: accent.bg }}>
                  #{rank}
                </p>
              </div>
            </div>

            {/* Center: Player emblem + stats */}
            <div className="flex flex-1 flex-col items-center justify-center">
              {/* Player avatar ring */}
              <div className="relative mb-4">
                <div
                  className="flex size-[100px] items-center justify-center rounded-full border-2 shadow-xl backdrop-blur-sm"
                  style={{ borderColor: `${accent.bg}40`, background: `${accent.bg}10` }}
                >
                  <div
                    className="absolute -inset-2.5 rounded-full border opacity-40"
                    style={{ borderColor: `${accent.bg}30` }}
                  />
                  {player.photo ? (
                    <img src={player.photo} alt="" className="size-14 rounded-full object-cover" />
                  ) : (
                    <span className="font-['Archivo_Black',sans-serif] text-2xl font-black text-white/30">
                      {player.playerName?.[0]}
                    </span>
                  )}
                </div>
              </div>

              <p className="font-['Archivo_Black',sans-serif] text-base font-black uppercase tracking-[4px] text-white drop-shadow-md">
                {player.playerName}
              </p>

              {/* Stats grid */}
              <div className="mt-5 grid w-full grid-cols-3 gap-3">
                {[
                  { label: "Rating", value: player.rating },
                  { label: "Finishes", value: player.eliminations },
                  { label: "Rank", value: `#${rank}` },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/[0.08] bg-white/[0.05] px-3 py-2.5 text-center backdrop-blur-sm">
                    <p className="text-[8px] font-semibold uppercase tracking-[1.5px] text-white/45">{stat.label}</p>
                    <p className="mt-0.5 font-['Archivo_Black',sans-serif] text-sm font-black text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom: Season tag */}
            <div className="flex items-end justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-[2px] text-white/30">
                BGMI Season 2026
              </p>
              <p className="text-[8px] tracking-[1px] text-white/25">
                Global Rankings
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Flip hint */}
      <p className="mt-3 text-center text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        Click to flip
      </p>
    </div>
  );
}

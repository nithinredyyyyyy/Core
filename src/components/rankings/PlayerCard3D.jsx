import { useState } from "react";
import { motion } from "framer-motion";

const ACCENT_COLORS = [
  { bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", glow: "rgba(245,158,11,0.3)" },
  { bg: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)", glow: "rgba(148,163,184,0.3)" },
  { bg: "linear-gradient(135deg, #b45309 0%, #92400e 100%)", glow: "rgba(180,83,9,0.3)" },
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
        className="relative h-[420px] w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* ====== FRONT FACE ====== */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[22px] shadow-2xl"
          style={{
            backfaceVisibility: "hidden",
            background: accent.bg,
          }}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 rounded-[22px]" style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)",
          }} />

          {/* Abstract shapes */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <div className="absolute -left-10 top-16 h-[60px] w-[300px] rotate-[-35deg] rounded bg-white/10" />
            <div className="absolute -left-5 top-28 h-[45px] w-[350px] rotate-[-35deg] rounded bg-white/[0.07]" />
            <div className="absolute -right-14 top-20 h-[50px] w-[260px] rotate-[35deg] rounded bg-white/[0.06]" />
            <div className="absolute left-1/2 top-1/2 size-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.06]" />
          </div>

          <div className="relative z-10 flex h-full flex-col p-6">
            {/* Top: Name */}
            <div>
              <h3 className="font-['Archivo_Black',sans-serif] text-[28px] font-black uppercase leading-none tracking-wide text-white drop-shadow-md">
                {player.playerName}
              </h3>
              <p className="mt-1.5 text-xs font-medium tracking-wide text-white/70">
                {player.teamName}
              </p>
            </div>

            {/* Center: Player Photo */}
            <div className="flex flex-1 items-center justify-center py-4">
              {player.photo ? (
                <img
                  src={player.photo}
                  alt={player.playerName}
                  className="max-h-[220px] w-auto object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 font-['Archivo_Black',sans-serif] text-3xl font-black text-white/50">
                  {player.playerName?.[0]}
                </div>
              )}
            </div>

            {/* Bottom: Brand + Stats */}
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-2">
                <img src="/images/core-logo.png" alt="CORE" className="size-5 rounded-full" />
                <span className="text-[9px] font-semibold uppercase tracking-[1.5px] text-white/60">CORE</span>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm">
                <p className="text-[8px] font-semibold uppercase tracking-[1.5px] text-white/50">Rating</p>
                <p className="font-['Archivo_Black',sans-serif] text-lg font-black text-white">
                  {player.rating}
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
            background: accent.bg,
          }}
        >
          {/* Back gradient */}
          <div className="absolute inset-0 rounded-[22px]" style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.15) 0%, transparent 60%, rgba(0,0,0,0.1) 100%)",
          }} />

          {/* Abstract shapes */}
          <div className="absolute inset-0 overflow-hidden opacity-15">
            <div className="absolute -left-10 top-20 h-[80px] w-[280px] rotate-[-35deg] rounded bg-white/10" />
            <div className="absolute -right-10 top-40 h-[40px] w-[300px] rotate-[35deg] rounded bg-white/[0.08]" />
            <div className="absolute left-1/2 top-1/2 size-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.06]" />
          </div>

          <div className="relative z-10 flex h-full flex-col p-5">
            {/* Back top */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <img src="/images/core-logo.png" alt="CORE" className="size-8 rounded-full drop-shadow-md" />
                <span className="font-['Archivo_Black',sans-serif] text-[8px] font-bold uppercase tracking-[1.5px] text-white/85">CORE Esports</span>
              </div>
              <div className="rounded-md border border-white/[0.06] bg-white/10 px-2 py-1 text-center backdrop-blur-sm">
                <p className="text-[5px] uppercase tracking-[1.5px] text-white/50">Set</p>
                <p className="font-['Archivo_Black',sans-serif] text-xs font-bold text-white/80">
                  {String(rank).padStart(2, "0")}
                </p>
              </div>
            </div>

            {/* Center emblem */}
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="relative mb-3 flex size-[90px] items-center justify-center rounded-full border-2 border-white/[0.18] bg-white/[0.07] shadow-lg backdrop-blur-sm">
                <div className="absolute -inset-2 rounded-full border border-white/[0.07]" />
                {player.photo ? (
                  <img src={player.photo} alt="" className="size-11 rounded-full object-cover" />
                ) : (
                  <img src="/images/core-logo.png" alt="" className="size-11 object-contain" />
                )}
              </div>
              <p className="font-['Archivo_Black',sans-serif] text-sm font-bold uppercase tracking-[5px] text-white drop-shadow-md">
                CORE ESPORTS
              </p>
              <p className="mt-1 text-[7px] uppercase tracking-[2.5px] text-white/60">Player Card Series</p>
            </div>

            {/* Bottom */}
            <div className="flex items-end justify-between">
              <div className="h-3 w-[60px] rounded-sm opacity-40" style={{
                background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0 2px, transparent 2px 3px, rgba(255,255,255,0.25) 3px 5px, transparent 5px 7px)",
              }} />
              <div className="flex flex-col items-end gap-0.5">
                <p className="text-[6px] uppercase tracking-[1.5px] text-white/50">NO. 0X0{rank + 6}A9</p>
                <p className="text-[5px] tracking-[1px] text-white/40">CORE ESPORTS &copy; 2026</p>
              </div>
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

import React from "react";
import { cn } from "@/lib/utils";
import { getBadgeMeta } from "@/lib/fanBadges";

export default function FanBadgeEmblem({
  badge,
  className,
  compact = false,
  showLabel = true,
}) {
  const meta = getBadgeMeta(badge);
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-start text-center",
        compact ? "gap-1.5" : "gap-2.5",
        className,
      )}
    >
      <div className={cn("relative", compact ? "size-16" : "size-24")}>
        <div
          className={cn(
            "absolute inset-0 rounded-full border",
            meta.shellClassName,
            meta.auraClassName,
          )}
        />
        <div className="absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.36),transparent_52%)]" />
        <div className="absolute left-1/2 top-[18%] h-[30%] w-[78%] -translate-x-1/2 rounded-[999px] bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0.06))]" />
        <div
          className={cn(
            "absolute left-1/2 top-[50%] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[1.4rem] border shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
            compact ? "size-9" : "size-12",
            meta.crestClassName,
          )}
          style={{
            clipPath:
              "polygon(50% 0%, 88% 18%, 100% 50%, 82% 86%, 50% 100%, 18% 86%, 0% 50%, 12% 18%)",
          }}
        >
          <Icon className={compact ? "size-4.5" : "size-6"} strokeWidth={2.2} />
        </div>
        <div className="absolute bottom-[12%] left-1/2 h-[10%] w-[18%] -translate-x-1/2 rounded-full bg-white/80" />
      </div>
      {showLabel ? (
        <div className="space-y-0.5">
          <p className={cn("font-black uppercase tracking-[0.12em] text-[#11131a]", compact ? "text-[9px]" : "text-[11px]")}>
            {meta.label}
          </p>
        </div>
      ) : null}
    </div>
  );
}

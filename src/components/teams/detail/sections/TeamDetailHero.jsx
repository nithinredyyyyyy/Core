import React from "react";
import LogoBlock from "@/components/shared/LogoBlock";
import ProfileStatGrid from "@/components/shared/ProfileStatGrid";

export function TeamDetailHero({
  team,
  participant,
  status,
  displayLogo,
  displayLogoSurfaceTone,
  primaryStats,
  secondaryStats,
}) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-brand-gold-olive bg-[radial-gradient(circle_at_top_left,_rgba(184,140,40,0.24),_rgba(18,15,11,0.98)_50%,_rgba(10,10,12,1)_100%)]">
      <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.28em] text-brand-gold">
                BGIS 2026 participant
              </p>
              <h1 className="text-3xl font-heading font-semibold text-white">
                {team.name}
              </h1>
              <p className="text-sm text-brand-border-stone">
                {participant?.seed || "Qualifier"} |{" "}
                {participant?.phase || "Participant"} | #
                {participant?.placement || "-"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${status.className}`}
              >
                {status.label}
              </span>
            </div>
          </div>

          <ProfileStatGrid
            primary={primaryStats}
            secondary={secondaryStats}
            variant="dark"
          />
        </div>

        <div className="flex items-center justify-center">
          {displayLogo ? (
            <LogoBlock
              src={displayLogo}
              alt={team.name}
              sizeClass="size-56"
              roundedClass="rounded-[30px]"
              paddingClass="p-7"
              surfaceTone={displayLogoSurfaceTone}
              className="border-brand-gold-earth bg-[linear-gradient(180deg,_rgba(24,20,15,0.95),_rgba(12,11,10,1))] shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
            />
          ) : (
            <LogoBlock
              sizeClass="size-56"
              roundedClass="rounded-[30px]"
              paddingClass="p-7"
              className="border-brand-gold-earth bg-[linear-gradient(180deg,_rgba(24,20,15,0.95),_rgba(12,11,10,1))]"
            >
              <span className="font-heading text-6xl font-bold text-brand-gold">
                {team.tag?.slice(0, 3)}
              </span>
            </LogoBlock>
          )}
        </div>
      </div>
    </div>
  );
}

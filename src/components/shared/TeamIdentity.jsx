import React from "react";
import { getTeamLogoByName } from "@/lib/teamLogos";
import LogoBlock from "@/components/shared/LogoBlock";

export default function TeamIdentity({
  name,
  className = "font-medium text-foreground",
  compact = false,
  framed = false,
  contained = false,
  glowed = false,
  plain = false,
  logoClassName,
  containerClassName = "",
  hideText = false,
}) {
  const teamLogo = getTeamLogoByName(name);
  const defaultBlockSize = compact ? "h-8 w-8" : "h-10 w-10";
  const championLogoClass = compact ? "h-10 w-auto object-contain" : "h-11 w-auto object-contain";
  const plainChipSize = compact ? "h-6 w-6" : "h-7 w-7";
  const plainImgSize = compact ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className={`flex items-center gap-2 ${compact ? "justify-center" : ""} ${containerClassName}`}>
      {teamLogo ? (
        framed ? (
          <LogoBlock
            src={teamLogo}
            alt={`${name} logo`}
            sizeClass="h-9 w-9"
            roundedClass="rounded-lg"
            paddingClass="p-1.5"
            className="border-[#3a2e18] bg-[linear-gradient(180deg,_rgba(73,52,18,0.95),_rgba(28,21,12,0.98))] shadow-sm"
          />
        ) : (
          contained ? (
            <LogoBlock
              src={teamLogo}
              alt={`${name} logo`}
              sizeClass="h-10 w-10"
              roundedClass="rounded-xl"
              paddingClass="p-1.5"
            />
          ) : (
          glowed ? (
            <div className="relative flex items-center justify-center rounded-2xl border border-[#3b3022] bg-[radial-gradient(circle_at_top,_rgba(255,201,107,0.22),_rgba(44,30,14,0.96)_58%,_rgba(18,12,8,0.98)_100%)] px-4 py-3 shadow-[0_12px_30px_rgba(255,184,77,0.2)]">
              <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle,_rgba(255,220,160,0.16)_0%,_rgba(255,179,71,0.12)_42%,_rgba(255,179,71,0)_76%)] blur-md" />
              <div className="relative z-10">
                <LogoBlock
                  src={teamLogo}
                  alt={`${name} logo`}
                  sizeClass="h-20 w-20"
                  roundedClass="rounded-2xl"
                  paddingClass="p-3"
                  className="border-white/10 bg-[linear-gradient(180deg,_rgba(15,23,42,0.68),_rgba(2,6,23,0.76))] shadow-[0_8px_22px_rgba(15,23,42,0.14)]"
                  imgClassName={logoClassName || championLogoClass}
                />
              </div>
            </div>
          ) : (
            plain ? (
              <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-800/45 bg-[linear-gradient(180deg,_rgba(15,23,42,0.68),_rgba(2,6,23,0.76))] p-1 shadow-[0_2px_8px_rgba(15,23,42,0.08)] ${plainChipSize}`}>
                <img
                  src={teamLogo}
                  alt={`${name} logo`}
                  className={logoClassName || `${plainImgSize} shrink-0 object-contain`}
                />
              </span>
            ) : (
              <LogoBlock
                src={teamLogo}
                alt={`${name} logo`}
                sizeClass={defaultBlockSize}
                roundedClass="rounded-xl"
                paddingClass="p-1.5"
                imgClassName={logoClassName || ""}
              />
            )
          )
          )
        )
      ) : null}
      {!hideText ? <span className={className}>{name}</span> : null}
    </div>
  );
}

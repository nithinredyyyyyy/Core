import React from "react";
import { getTeamLogoByName, getTeamLogoSurfaceTone } from "@/lib/teamLogos";
import LogoBlock from "@/components/shared/LogoBlock";
import { useTheme } from "@/lib/ThemeContext";

export default function TeamIdentity({
  name,
  className = "font-medium text-foreground",
  compact = false,
  framed = false,
  contained = false,
  glowed = false,
  plain = false,
  logoClassName,
  logoBlockClassName = "",
  containerClassName = "",
  hideText = false,
  surfaceToneOverride = null,
}) {
  const { theme } = useTheme();
  const teamLogo = getTeamLogoByName(name);
  const logoSurfaceTone = surfaceToneOverride || getTeamLogoSurfaceTone(name);
  const defaultBlockSize = compact ? "size-8" : "size-10";
  const championLogoClass = compact
    ? "h-10 w-auto object-contain"
    : "h-11 w-auto object-contain";
  const plainChipSize = compact ? "size-6" : "size-7";
  const plainImgSize = compact ? "size-4" : "size-5";

  return (
    <div
      className={`flex items-center gap-2 ${compact ? "justify-center" : ""} ${containerClassName}`}
    >
      {teamLogo ? (
        framed ? (
          <LogoBlock
            src={teamLogo}
            alt={`${name} logo`}
            sizeClass="size-9"
            roundedClass="rounded-md"
            paddingClass="p-1.5"
            surfaceTone={logoSurfaceTone}
            className={`border-slate-200/90 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white ${logoBlockClassName}`}
          />
        ) : contained ? (
          <LogoBlock
            src={teamLogo}
            alt={`${name} logo`}
            sizeClass={compact ? "size-9" : "size-10"}
            roundedClass="rounded-md"
            paddingClass="p-1.5"
            surfaceTone={logoSurfaceTone}
            className={logoBlockClassName}
          />
        ) : glowed ? (
          <div className="relative flex items-center justify-center rounded-2xl border border-[#3b3022] bg-[radial-gradient(circle_at_top,_rgba(255,201,107,0.22),_rgba(44,30,14,0.96)_58%,_rgba(18,12,8,0.98)_100%)] px-4 py-3 shadow-[0_12px_30px_rgba(255,184,77,0.2)]">
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle,_rgba(255,220,160,0.16)_0%,_rgba(255,179,71,0.12)_42%,_rgba(255,179,71,0)_76%)] blur-md" />
            <div className="relative z-10">
              <LogoBlock
                src={teamLogo}
                alt={`${name} logo`}
                sizeClass="size-20"
                roundedClass="rounded-2xl"
                paddingClass="p-3"
                surfaceTone={logoSurfaceTone}
                className="border-white/10 bg-[linear-gradient(180deg,_rgba(15,23,42,0.68),_rgba(2,6,23,0.76))] shadow-[0_8px_22px_rgba(15,23,42,0.14)]"
                imgClassName={logoClassName || championLogoClass}
              />
            </div>
          </div>
        ) : plain ? (
          theme === "dark" ? (
            <span
              className={`inline-flex shrink-0 items-center justify-center overflow-visible ${plainChipSize}`}
            >
              <img
                src={teamLogo}
                alt={`${name} logo`}
                className={
                  logoClassName || `${plainImgSize} shrink-0 object-contain`
                }
                style={{
                  filter:
                    "drop-shadow(0 1px 1px rgba(11,31,61,0.16)) drop-shadow(0 0 1px rgba(11,31,61,0.08))",
                }}
              />
            </span>
          ) : (
            <span
              className={`inline-flex shrink-0 items-center justify-center overflow-visible ${plainChipSize}`}
            >
              <img
                src={teamLogo}
                alt={`${name} logo`}
                className={
                  logoClassName || `${plainImgSize} shrink-0 object-contain`
                }
                style={{
                  filter:
                    "drop-shadow(0 1px 1px rgba(11,31,61,0.16)) drop-shadow(0 0 1px rgba(11,31,61,0.08))",
                }}
              />
            </span>
          )
        ) : (
          <LogoBlock
            src={teamLogo}
            alt={`${name} logo`}
            sizeClass={defaultBlockSize}
            roundedClass="rounded-md"
            paddingClass="p-1.5"
            surfaceTone={logoSurfaceTone}
            imgClassName={logoClassName || ""}
            className={logoBlockClassName}
          />
        )
      ) : null}
      {!hideText ? <span className={className}>{name}</span> : null}
    </div>
  );
}

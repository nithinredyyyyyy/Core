import React from "react";
import {
  getTeamLogoByName,
  getTeamLogoSurfaceTone,
  isWideTeamLogo,
} from "@/lib/teamLogos";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  xs: "size-6",
  sm: "size-8",
  md: "size-10",
  lg: "size-14",
  xl: "size-20",
};

const PADDING_CLASSES = {
  xs: "p-0.5",
  sm: "p-1",
  md: "p-1.5",
  lg: "p-2",
  xl: "p-3",
};

/**
 * Canonical team logo tile. Reuses the shared team-logo registry so every
 * surface resolves the same asset and surface tone.
 */
export default function TeamLogo({
  name,
  src = null,
  size = "md",
  className = "",
  imgClassName = "",
  rounded = "rounded-lg",
  alt,
}) {
  const resolvedSrc = src || getTeamLogoByName(name);
  const surfaceTone = getTeamLogoSurfaceTone(name);
  const wide = isWideTeamLogo(name);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border border-border bg-white dark:border-white/10 dark:bg-white",
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        PADDING_CLASSES[size] || PADDING_CLASSES.md,
        rounded,
        className,
      )}
      data-surface-tone={surfaceTone}
    >
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={alt || `${name} logo`}
          loading="lazy"
          decoding="async"
          className={cn(
            "size-full object-contain",
            wide && "scale-[1.15]",
            imgClassName,
          )}
        />
      ) : (
        <span
          aria-hidden="true"
          className="text-[0.6em] font-black uppercase leading-none text-muted-foreground"
        >
          {String(name || "?")
            .replace(/[^a-z0-9]/gi, "")
            .slice(0, 3) || "?"}
        </span>
      )}
    </span>
  );
}

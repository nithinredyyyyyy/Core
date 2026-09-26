import React, { useState } from "react";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { getPlayerDisplayName } from "@/lib/playerDisplayName";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "size-9 text-xs",
  md: "size-12 text-sm",
  lg: "size-16 text-base",
  xl: "size-24 text-xl",
};

function initialsFor(name) {
  const cleaned = String(name || "")
    .replace(/[^a-z0-9 ]/gi, " ")
    .trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * Player avatar. Uses the shared player-photo registry when a photo exists and
 * falls back to IGN initials otherwise.
 */
export default function PlayerAvatar({
  ign,
  photo = null,
  size = "md",
  className = "",
  alt,
}) {
  const [failed, setFailed] = useState(false);
  const resolvedPhoto = photo || getPlayerPhotoByIgn(ign);
  const displayName = getPlayerDisplayName(ign);
  const showPhoto = resolvedPhoto && !failed;

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted font-black uppercase text-muted-foreground",
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        className,
      )}
    >
      {showPhoto ? (
        <img
          src={resolvedPhoto}
          alt={alt || `${displayName} photo`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initialsFor(displayName)}</span>
      )}
    </span>
  );
}

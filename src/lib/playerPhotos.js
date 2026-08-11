function normalizePlayerPhotoKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const PLAYER_PHOTO_OVERRIDES = {
  admino: "/images/players/admino.webp",
  aaru: "/images/players/aaru.webp",
  ak: "/images/players/akop.webp",
  akop: "/images/players/akop.webp",
  attanki: "/images/players/attanki.webp",
  godz: "/images/players/godz.webp",
  spower: "/images/players/spower.webp",
  manya: "/images/players/manya.webp",
  wizzgod: "/images/players/wizzgod.webp",
};

export function getPlayerPhotoByIgn(ign) {
  return PLAYER_PHOTO_OVERRIDES[normalizePlayerPhotoKey(ign)] || null;
}

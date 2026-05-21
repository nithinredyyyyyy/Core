function normalizePlayerPhotoKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const PLAYER_PHOTO_OVERRIDES = {
  admino: "/images/players/admino.png",
  aaru: "/images/players/aaru.png",
  ak: "/images/players/akop.png",
  akop: "/images/players/akop.png",
  attanki: "/images/players/attanki.png",
  godz: "/images/players/godz.png",
  spower: "/images/players/spower.png",
  manya: "/images/players/manya.png",
  wizzgod: "/images/players/wizzgod.png",
};

export function getPlayerPhotoByIgn(ign) {
  return PLAYER_PHOTO_OVERRIDES[normalizePlayerPhotoKey(ign)] || null;
}

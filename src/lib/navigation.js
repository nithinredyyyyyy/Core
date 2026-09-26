/**
 * Global navigation configuration.
 *
 * The desktop header and the mobile bottom bar both read from this file so the
 * two surfaces can never drift apart. Mobile shows five primary items and
 * folds the rest into the "More" sheet.
 */

export const NAV_ITEMS = [
  { key: "home", label: "Home", path: "/", mobileLabel: "Home" },
  { key: "tournaments", label: "Tournaments", path: "/tournaments", mobileLabel: "Events" },
  { key: "matches", label: "Matches", path: "/matches", mobileLabel: "Matches" },
  { key: "teams", label: "Teams", path: "/teams" },
  { key: "players", label: "Players", path: "/players" },
  { key: "rankings", label: "Rankings", path: "/rankings" },
  { key: "news", label: "News", path: "/news", mobileLabel: "News" },
];

const MOBILE_PRIMARY_KEYS = ["home", "tournaments", "matches", "news"];

export const MOBILE_PRIMARY_ITEMS = NAV_ITEMS.filter((item) =>
  MOBILE_PRIMARY_KEYS.includes(item.key),
);

export const MOBILE_MORE_ITEMS = [
  ...NAV_ITEMS.filter((item) => !MOBILE_PRIMARY_KEYS.includes(item.key)),
  { key: "leaderboard", label: "Leaderboard", path: "/leaderboard" },
];

/** True when `pathname` belongs to the nav item, ignoring query strings. */
export function isNavItemActive(item, pathname) {
  const base = item.path.split("?")[0];
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(`${base}/`);
}

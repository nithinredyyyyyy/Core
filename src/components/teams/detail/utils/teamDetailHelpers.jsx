import { getTeamLogoByName } from "@/lib/teamLogos";
import { format } from "date-fns";
import { isOrganizationInactive } from "@/lib/organizationIdentity";

export const EMPTY_TEAM_DETAIL_PAGE_ARRAY = [];

export function getDisplayedTeamLogo(team) {
  return getTeamLogoByName(team?.name) || team?.logo_url || null;
}

export function getTeamStatus(team) {
  if (isOrganizationInactive(team)) {
    return {
      label: "Inactive",
      className: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    };
  }

  return {
    label: "Active",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };
}

export function isMajorTier(tier) {
  return ["S-Tier", "A-Tier", "B-Tier"].includes(String(tier || "").trim());
}

export function getHistoryYear(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Undated";
  return String(date.getFullYear());
}

export function formatTeamDetailDate(value, pattern, fallback) {
  if (!value) return fallback;
  return format(new Date(value), pattern);
}

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Moon, Search, Shield, Sun, UserCircle2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import NotificationBellDropdown from "@/components/layout/topbar/NotificationBellDropdown";
import { BrandMark } from "@/components/shared/BrandMark";
import { useAdminAccess } from "@/lib/adminAccess";

export default function DesktopTopBar({ setSearchOpen, theme, toggle }) {
  const routerLocation = useLocation();
  const { hasAdminAccess } = useAdminAccess();
  const [fanSession, setFanSession] = useState(() => base44.fan.getStoredSession());
  const [authSession, setAuthSession] = useState(() => base44.auth.getStoredSession());
  const isDark = theme === "dark";
  const navItems = [
    { label: "Home", path: "/app" },
    { label: "Tournaments", path: "/tournaments" },
    { label: "Teams", path: "/teams" },
    { label: "Standings", path: "/leaderboard" },
    { label: "Fans", path: "/fans" },
    { label: "News", path: "/news" },
    ...(hasAdminAccess ? [{ label: "Admin", path: "/admin", icon: Shield }] : []),
  ];
  const hasProfile = Boolean(fanSession.userId && fanSession.token);
  const { data: fanProfiles = [] } = useQuery({
    queryKey: ["topbar-profile-image", fanSession.userId],
    queryFn: () =>
      base44.entities.FanProfile.filter(
        { user_id: fanSession.userId },
        "-updated_date",
        1,
      ),
    enabled: hasProfile,
    staleTime: 30 * 1000,
  });
  const savedFanProfile = fanProfiles[0] || null;
  const profileImage = savedFanProfile?.profile_image || "";
  const profileName =
    savedFanProfile?.display_name ||
    fanSession.displayName ||
    authSession.user?.full_name ||
    authSession.user?.email?.split("@")[0] ||
    "Sign in";
  const initials = useMemo(() => {
    const cleaned = String(profileName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
    return cleaned || "SC";
  }, [profileName]);

  useEffect(() => {
    const syncSession = () => {
      setFanSession(base44.fan.getStoredSession());
      setAuthSession(base44.auth.getStoredSession());
    };

    syncSession();
    window.addEventListener("focus", syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener("focus", syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, [routerLocation.pathname]);

  return (
    <div className="mx-auto flex min-h-[5.4rem] w-full max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
      <Link
        to="/app"
        className={`flex shrink-0 items-center gap-3 pr-2 transition-opacity hover:opacity-90 ${
          isDark ? "text-white" : "text-[#11131a]"
        }`}
      >
        <div
          data-core-logo-target="primary"
          className={`flex size-10 items-center justify-center rounded-full border p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${
            isDark
              ? "border-white/8 bg-[#101b2d] shadow-[0_16px_34px_rgba(2,8,23,0.34)]"
              : "border-[#dfe6ee] bg-white"
          }`}
        >
          <BrandMark concept="site" className="size-full object-contain" />
        </div>
        <span
          className={`type-title-lg ${
            isDark ? "text-white" : "text-[#11131a]"
          }`}
        >
          Core
        </span>
      </Link>

      <nav className="hidden flex-1 items-center justify-center lg:flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = routerLocation.pathname === item.path.split("?")[0];
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`type-nav relative mx-1.5 inline-flex items-center gap-2 rounded-full px-4 py-2.5 transition-all duration-200 ${
                isActive
                  ? isDark
                    ? "bg-white text-[#08111e] shadow-[0_16px_30px_rgba(2,8,23,0.3)]"
                    : "bg-[#11131a] text-white shadow-[0_12px_28px_rgba(17,19,26,0.16)]"
                  : isDark
                    ? "text-slate-400 hover:bg-white/7 hover:text-white"
                    : "text-[#49505b] hover:bg-white/70 hover:text-[#11131a]"
              }`}
            >
              {Icon ? <Icon className="size-4" /> : null}
              <span>{item.label}</span>
              {isActive ? (
                <span className="absolute inset-x-4 -bottom-[0.38rem] h-px rounded-full bg-primary/90" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div
        className={`flex items-center gap-3 rounded-full border px-2.5 py-2 shadow-[0_14px_34px_rgba(15,23,42,0.08)] backdrop-blur transition-colors ${
          isDark
            ? "border-white/8 bg-[#0d1727]/88 shadow-[0_18px_38px_rgba(2,8,23,0.36)]"
            : "border-[#dde5ee] bg-white/85"
        }`}
      >
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={`inline-flex size-11 items-center justify-center rounded-full border transition-colors ${
            isDark
              ? "border-white/8 bg-[#121f33] text-white hover:bg-[#16263d]"
              : "border-[#e3e8ef] bg-[#f8fbff] text-[#11131a] hover:bg-white"
          }`}
          aria-label="Open search"
        >
          <Search
            className={`size-4 ${isDark ? "text-white" : "text-[#11131a]"}`}
            strokeWidth={2.2}
          />
        </button>

        <NotificationBellDropdown
          buttonClassName={`inline-flex size-11 items-center justify-center rounded-full border transition-colors ${
            isDark
              ? "border-white/8 bg-[#121f33] text-white hover:bg-[#16263d]"
              : "border-[#e3e8ef] bg-[#f8fbff] text-[#11131a] hover:bg-white"
          }`}
          iconClassName={`size-4 ${isDark ? "text-white" : "text-[#11131a]"}`}
        />

        <button
          type="button"
          onClick={toggle}
          className={`inline-flex size-11 items-center justify-center rounded-full border transition-colors ${
            isDark
              ? "border-white/8 bg-[#121f33] text-white hover:bg-[#16263d]"
              : "border-[#e3e8ef] bg-[#f8fbff] text-[#11131a] hover:bg-white"
          }`}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? (
            <Moon
              className={`size-4 ${isDark ? "text-white" : "text-[#11131a]"}`}
              strokeWidth={2.2}
            />
          ) : (
            <Sun
              className={`size-4 ${isDark ? "text-white" : "text-[#11131a]"}`}
              strokeWidth={2.2}
            />
          )}
        </button>

        <Link
          to="/profile"
          className={`inline-flex items-center gap-3 rounded-full border px-3 py-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all ${
            isDark
              ? "border-white/8 bg-[#121f33] text-white hover:border-white/12 hover:bg-[#172740]"
              : "border-[#dce4ec] bg-white text-[#11131a] hover:border-[#cdd7e1] hover:bg-[#fcfdff]"
          }`}
        >
          <div
            className={`relative flex size-9 items-center justify-center overflow-hidden rounded-full border text-xs font-bold tracking-[0.08em] ${
              isDark
                ? "border-white/8 bg-[#1a2940] text-white"
                : "border-[#dce4ec] bg-[#f7fbff] text-[#11131a]"
            }`}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt={`${profileName} profile`}
                className="size-full object-cover"
              />
            ) : hasProfile ? (
              <span>{initials}</span>
            ) : (
              <UserCircle2
                className={`size-4.5 ${isDark ? "text-white" : "text-[#11131a]"}`}
              />
            )}
            <span
              className={`absolute bottom-0.5 right-0.5 size-2 rounded-full ${
                isDark ? "border-[#08111e]" : "border-white"
              } ${
                hasProfile ? "bg-emerald-400" : "bg-amber-300"
              }`}
            />
          </div>
          <span className="flex flex-col items-start leading-none">
            <span
              className={`type-kicker ${
                isDark ? "text-slate-500" : "text-[#8b919a]"
              }`}
            >
              {hasProfile ? "Profile" : "Join"}
            </span>
            <span
              className={`type-nav max-w-[7.5rem] truncate pt-1 ${
                isDark ? "text-white" : "text-[#11131a]"
              }`}
            >
              {profileName}
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}

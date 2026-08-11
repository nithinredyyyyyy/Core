import { useEffect, useState } from "react";
import { Moon, Search, Shield, Sun } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { BrandMark } from "@/components/shared/BrandMark";
import { useAdminAccess } from "@/lib/adminAccess";

export default function DesktopTopBar({ setSearchOpen, theme, toggle }) {
  const routerLocation = useLocation();
  const { hasAdminAccess } = useAdminAccess();
  const [authSession, setAuthSession] = useState(() => base44.auth.getStoredSession());
  const isDark = theme === "dark";
  const navItems = [
    { label: "Home", path: "/" },
    { label: "Tournaments", path: "/tournaments" },
    { label: "Teams", path: "/teams" },
    { label: "Standings", path: "/leaderboard" },
    { label: "Rankings", path: "/rankings" },
    { label: "News", path: "/news" },
    ...(hasAdminAccess ? [{ label: "Admin", path: "/admin", icon: Shield }] : []),
  ];
  const isAdminSignedIn = Boolean(authSession.token && authSession.user?.email);

  useEffect(() => {
    const syncSession = () => {
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
    <div className={`mx-auto flex min-h-[4rem] w-full items-center justify-between gap-6 px-6 py-2 rounded-[32px] backdrop-blur-xl border shadow-sm transition-colors ${
      isDark ? "bg-brand-ink-mid/80 border-white/10" : "bg-white/80 border-border"
    }`}>
      <Link
        to="/"
        className={`flex shrink-0 items-center gap-3 pr-2 transition-opacity hover:opacity-90 ${
          isDark ? "text-white" : "text-brand-ink"
        }`}
      >
        <div
          data-core-logo-target="primary"
          className={`flex size-10 items-center justify-center rounded-full border p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${
            isDark
              ? "border-white/8 bg-brand-navy-void shadow-[0_16px_34px_rgba(2,8,23,0.34)]"
              : "border-brand-sky-soft bg-white"
          }`}
        >
          <BrandMark concept="site" className="size-full object-contain" />
        </div>
        <span
          className={`type-title-lg ${
            isDark ? "text-white" : "text-brand-ink"
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
              className={`type-nav relative mx-1 inline-flex items-center gap-2 rounded-full px-4 py-2.5 transition-all duration-200 ${
                isActive
                  ? isDark
                    ? "bg-white text-brand-navy-black shadow-[0_16px_30px_rgba(2,8,23,0.3)]"
                    : "bg-brand-ink text-white shadow-[0_12px_28px_rgba(17,19,26,0.16)]"
                  : isDark
                    ? "text-slate-400 hover:bg-white/7 hover:text-white"
                    : "text-brand-slate-dim hover:bg-white/70 hover:text-brand-ink"
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
        className={`flex items-center gap-2.5 rounded-full border px-2.5 py-2 shadow-[0_14px_34px_rgba(15,23,42,0.08)] backdrop-blur transition-colors ${
          isDark
              ? "border-white/8 bg-brand-navy-abyss/90 shadow-[0_18px_38px_rgba(2,8,23,0.36)]"
              : "border-brand-sky-haze bg-white/90"
        }`}
      >
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={`inline-flex size-11 items-center justify-center rounded-full border transition-colors ${
            isDark
              ? "border-white/8 bg-brand-navy-storm text-white hover:bg-brand-navy-midnight"
              : "border-brand-sky-pale bg-brand-cream-frost text-brand-ink hover:border-brand-sky-dusk hover:bg-white"
          }`}
          aria-label="Open search"
        >
          <Search
            className={`size-4 ${isDark ? "text-white" : "text-brand-ink"}`}
            strokeWidth={2.2}
          />
        </button>

        <button
          type="button"
          onClick={toggle}
          className={`inline-flex size-11 items-center justify-center rounded-full border transition-colors ${
            isDark
              ? "border-white/8 bg-brand-navy-storm text-white hover:bg-brand-navy-midnight"
              : "border-brand-sky-pale bg-brand-cream-frost text-brand-ink hover:border-brand-sky-dusk hover:bg-white"
          }`}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? (
            <Moon
              className={`size-4 ${isDark ? "text-white" : "text-brand-ink"}`}
              strokeWidth={2.2}
            />
          ) : (
            <Sun
              className={`size-4 ${isDark ? "text-white" : "text-brand-ink"}`}
              strokeWidth={2.2}
            />
          )}
        </button>

        {isAdminSignedIn ? (
          <Link
            to="/admin"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] transition-all ${
              isDark
                ? "border-white/8 bg-brand-navy-storm text-white hover:border-white/12 hover:bg-brand-navy-dusk"
                : "border-brand-sky-wash bg-white text-brand-ink hover:border-brand-sky-cloud hover:bg-brand-cream-porcelain"
            }`}
          >
            <Shield className="size-4" />
            Admin
          </Link>
        ) : null}
      </div>
    </div>
  );
}

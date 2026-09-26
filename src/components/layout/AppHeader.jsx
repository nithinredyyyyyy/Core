import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn, LogOut, Moon, Search, Shield, Sun } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { BrandMark } from "@/components/shared/BrandMark";
import { useAdminAccess } from "@/lib/adminAccess";
import { NAV_ITEMS, isNavItemActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const ICON_BUTTON =
  "inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Application header. Desktop exposes the full primary navigation; mobile keeps
 * only brand, search, and account so the bottom bar can own primary navigation.
 */
export default function AppHeader({ onOpenSearch, theme, onToggleTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasAdminAccess } = useAdminAccess();
  const [session, setSession] = useState(() => base44.auth.getStoredSession());

  const isSignedIn = Boolean(session?.token);
  const isAdminSignedIn = isSignedIn && session.user?.role === "admin";
  const showAdminLink = hasAdminAccess || isAdminSignedIn;

  useEffect(() => {
    const syncSession = () => setSession(base44.auth.getStoredSession());
    syncSession();
    window.addEventListener("focus", syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener("focus", syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, [location.pathname]);

  function handleSignOut() {
    base44.auth.logout();
    setSession({ user: null, token: "" });
    navigate("/", { replace: true });
  }

  const accountLabel = isAdminSignedIn
    ? "Admin"
    : session.user?.full_name?.split(" ")[0] ||
      session.user?.email?.split("@")[0] ||
      "Account";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-[var(--shell-max-width)] items-center gap-4 px-4 sm:px-6">
        <Link
          to="/"
          aria-label="CORE home"
          className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-card p-1.5">
            <BrandMark concept="site" className="size-full object-contain" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-heading text-base font-black uppercase tracking-[0.14em] text-foreground">
              Core
            </span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              BGMI Esports Hub
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
        >
          {NAV_ITEMS.map((item) => {
            const active = isNavItemActive(item, location.pathname);
            return (
              <Link
                key={item.key}
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className={cn(ICON_BUTTON, "gap-2 px-3 sm:w-56 sm:justify-start")}
            aria-label="Search CORE"
          >
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Search
            </span>
            <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground lg:inline">
              Ctrl K
            </kbd>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className={cn(ICON_BUTTON, "hidden sm:inline-flex")}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <Moon className="size-4" aria-hidden="true" />
            ) : (
              <Sun className="size-4" aria-hidden="true" />
            )}
          </button>

          {showAdminLink ? (
            <Link
              to="/admin"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-xs font-bold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Shield className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          ) : isSignedIn ? (
            <button
              type="button"
              onClick={handleSignOut}
              title={`Signed in as ${session.user?.email || ""}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-xs font-bold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{accountLabel}</span>
            </button>
          ) : (
            <Link
              to="/signin"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-xs font-bold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogIn className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

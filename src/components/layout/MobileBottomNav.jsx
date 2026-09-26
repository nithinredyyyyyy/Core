import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  MoreHorizontal,
  Newspaper,
  Search,
  Shield,
  Star,
  Swords,
  Trophy,
  UserCircle2,
  Users,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAdminAccess } from "@/lib/adminAccess";
import { MOBILE_MORE_ITEMS, MOBILE_PRIMARY_ITEMS, isNavItemActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const ITEM_ICONS = {
  home: Home,
  tournaments: Trophy,
  matches: Swords,
  news: Newspaper,
  teams: Users,
  players: UserCircle2,
  rankings: Star,
  leaderboard: Star,
};

const ITEM_CLASS =
  "flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 text-[10px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Mobile bottom navigation: four primary destinations plus a "More" sheet that
 * folds in Teams, Players, Rankings, Leaderboard, Search, and Admin.
 */
export default function MobileBottomNav({ onOpenSearch }) {
  const location = useLocation();
  const { hasAdminAccess } = useAdminAccess();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex h-16 w-full max-w-[var(--shell-max-width)] items-stretch gap-0.5 px-1">
          {MOBILE_PRIMARY_ITEMS.map((item) => {
            const Icon = ITEM_ICONS[item.key] || Home;
            const active = isNavItemActive(item, location.pathname);
            return (
              <Link
                key={item.key}
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={cn(
                  ITEM_CLASS,
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon
                  className="size-5"
                  strokeWidth={active ? 2.4 : 1.8}
                  aria-hidden="true"
                />
                {item.mobileLabel || item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={cn(ITEM_CLASS, "text-muted-foreground")}
          >
            <MoreHorizontal className="size-5" strokeWidth={1.8} aria-hidden="true" />
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="text-left">
            <SheetTitle className="font-heading uppercase tracking-[0.14em]">
              More
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                onOpenSearch?.();
              }}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Search className="size-4 text-muted-foreground" aria-hidden="true" />
              Search
            </button>
            {MOBILE_MORE_ITEMS.map((item) => {
              const Icon = ITEM_ICONS[item.key] || Users;
              const active = isNavItemActive(item, location.pathname);
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  onClick={() => setMoreOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-xl border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40",
                  )}
                >
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
            {hasAdminAccess ? (
              <Link
                to="/admin"
                onClick={() => setMoreOpen(false)}
                className="col-span-2 flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Shield className="size-4 text-muted-foreground" aria-hidden="true" />
                Admin
              </Link>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

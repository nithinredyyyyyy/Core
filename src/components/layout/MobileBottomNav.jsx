import { MagnifyingDock } from "@/components/bencho/MagnifyingDock";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

/**
 * Mobile bottom navigation: four primary destinations plus a "More" sheet that
 * folds in Teams, Players, Rankings, Leaderboard, Search, and Admin.
 */
export default function MobileBottomNav({ onOpenSearch }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasAdminAccess } = useAdminAccess();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <MagnifyingDock
          activeKey={moreOpen ? "more" : MOBILE_PRIMARY_ITEMS.find((item) => isNavItemActive(item, location.pathname))?.key || ""}
          items={[...MOBILE_PRIMARY_ITEMS.map((item) => ({ ...item, Icon: ITEM_ICONS[item.key] })), { key: "more", label: "More", Icon: MoreHorizontal }]}
          onSelect={(key) => {
            if (key === "more") setMoreOpen(true);
            else { const item = MOBILE_PRIMARY_ITEMS.find((entry) => entry.key === key); if (item) navigate(item.path); }
          }}
        />
      </div>

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

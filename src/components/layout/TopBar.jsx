import React, { useState } from "react";
import {
  Bell,
  Settings,
  Search,
  Sun,
  Moon,
  Radio,
  User,
  Sparkles,
  ShieldCheck,
  Download,
  Smartphone,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/lib/ThemeContext";
import GlobalSearch from "@/components/search/GlobalSearch";
import { AnimatePresence } from "framer-motion";
import { BrandMark } from "../shared/BrandMark";
import { buildContextualFanHubLink } from "@/lib/fanNavigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminAccess } from "@/lib/adminAccess";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useIsMobile } from "@/hooks/use-mobile";

export default function TopBar() {
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { hasAdminAccess } = useAdminAccess();
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const fansPath = buildContextualFanHubLink(location);
  const patchNotes = [
    "Patch watch: BMPS 2026 prize pool updated.",
    "Roster desk: 8Bit added Shubh to the active roster.",
    "Circuit note: Tournament hubs now carry the live standings flow.",
  ];

  return (
    <>
      <AnimatePresence>
        {searchOpen && (
          <GlobalSearch
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
          />
        )}
      </AnimatePresence>

      <header
        className={
          isMobile
            ? "sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(180deg,rgba(7,13,31,0.82),rgba(10,18,42,0.72))] backdrop-blur"
            : "sticky top-0 z-40 border-b border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(249,246,241,0.92))] backdrop-blur dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.86),rgba(17,24,39,0.92))]"
        }
      >
        <div className="flex min-h-[4.5rem] items-center gap-2.5 px-3 sm:px-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:hidden">
            <div
              data-core-logo-target="primary"
              className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/95 shadow-[0_10px_30px_rgba(59,130,246,0.18)] md:hidden"
            >
              <BrandMark concept="site" className="size-8 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.28em] text-sky-300">
                Core
              </p>
              <p className="truncate text-xs font-semibold text-white sm:text-sm">
                Esports command center
              </p>
            </div>
          </div>

          <button
            onClick={() => setSearchOpen(true)}
            className="relative ml-auto hidden w-full max-w-[38rem] md:flex"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <div className="flex h-11 w-full items-center rounded-xl border border-border/80 bg-background/95 pl-11 pr-4 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/35">
              Search tournaments, teams, matches, news…
            </div>
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-4">
            <button
              type="button"
              onClick={toggle}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              className="hidden select-none items-center gap-1 rounded-2xl border border-border/80 bg-card p-1 text-xs font-medium shadow-sm sm:flex"
            >
              <span
                className={`flex items-center gap-1 rounded-xl px-2 py-1 transition-all ${theme === "light" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <Sun className="size-3" /> Light
              </span>
              <span
                className={`flex items-center gap-1 rounded-xl px-2 py-1 transition-all ${theme === "dark" ? "bg-secondary text-foreground shadow-sm dark:bg-slate-800 dark:text-white" : "text-muted-foreground"}`}
              >
                <Moon className="size-3" /> Dark
              </span>
            </button>

            <div className="hidden items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary lg:flex">
              <span className="size-2 rounded-full bg-primary" />
              Live
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative flex size-8 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:size-9">
                  <Bell className="size-4" />
                  <span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 rounded-2xl border-border/80 p-2"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
                    Notifications
                  </p>
                  <p className="mt-1 text-xs font-normal text-muted-foreground">
                    Patch updates and circuit notes
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {patchNotes.map((note) => (
                  <DropdownMenuItem
                    key={note}
                    className="items-start rounded-xl p-3"
                  >
                    <Sparkles className="mt-0.5 size-4 text-primary" />
                    <span className="text-sm leading-5">{note}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex size-8 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:size-9">
                  <Settings className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 rounded-2xl border-border/80 p-2"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
                    Settings
                  </p>
                  <p className="mt-1 text-xs font-normal text-muted-foreground">
                    Quick interface controls
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={toggle}
                  className="rounded-xl px-3 py-2.5"
                >
                  {theme === "light" ? (
                    <Moon className="size-4" />
                  ) : (
                    <Sun className="size-4" />
                  )}
                  <span>
                    Switch to {theme === "light" ? "dark" : "light"} theme
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setSearchOpen(true)}
                  className="rounded-xl px-3 py-2.5"
                >
                  <Search className="size-4" />
                  <span>Open global search</span>
                </DropdownMenuItem>
                {isInstallable && (
                  <DropdownMenuItem
                    onSelect={promptInstall}
                    className="rounded-xl px-3 py-2.5"
                  >
                    <Download className="size-4" />
                    <span>Install mobile app</span>
                  </DropdownMenuItem>
                )}
                {isInstalled && (
                  <DropdownMenuItem className="rounded-xl px-3 py-2.5">
                    <Smartphone className="size-4" />
                    <span>App already installed</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="rounded-xl px-3 py-2.5">
                  <ShieldCheck className="size-4" />
                  <span>Coverage mode: competitive</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex size-8 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-white p-1 transition-colors hover:border-primary/40 sm:h-9 sm:w-9">
                  <BrandMark concept="site" className="size-full object-contain" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 rounded-2xl border-border/80 p-2"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-white p-1">
                      <BrandMark
                        concept="site"
                        className="size-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Core
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Esports command center
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5">
                  <Link to="/teams">
                    <User className="size-4" />
                    <span>Open team directory</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5">
                  <Link to="/tournaments">
                    <Radio className="size-4" />
                    <span>Browse tournaments</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5">
                  <Link to="/tournaments">
                    <Sparkles className="size-4" />
                    <span>Open tournament hubs</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5">
                  <Link to="/leaderboard">
                    <Sparkles className="size-4" />
                    <span>Open standings board</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5">
                  <Link to={fansPath}>
                    <Radio className="size-4" />
                    <span>Open fan engagement</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-3 pb-3 md:hidden">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-left text-xs font-medium text-white/70 shadow-[0_10px_28px_rgba(0,0,0,0.16)] backdrop-blur"
          >
            <Search className="size-3.5 shrink-0" />
            <span className="truncate">Search teams, matches, storiesâ€¦</span>
          </button>
          {isInstallable && (
            <button
              onClick={promptInstall}
              className="flex shrink-0 items-center gap-1 rounded-full border border-sky-300/20 bg-sky-400/15 px-3 py-2 text-xs font-semibold text-sky-100"
            >
              <Download className="size-3.5" />
              Install
            </button>
          )}
        </div>
      </header>
    </>
  );
}

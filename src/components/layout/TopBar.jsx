import React, { useState } from "react";
import { Bell, Settings, Search, Sun, Moon, Radio, User, Sparkles, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/lib/ThemeContext";
import GlobalSearch from "@/components/search/GlobalSearch";
import { AnimatePresence } from "framer-motion";
import { BrandMark } from "../shared/BrandMark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOCAL_ADMIN_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export default function TopBar() {
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocalAdmin = LOCAL_ADMIN_HOSTS.has(hostname);
  const mobileNavItems = [
    { label: "Home", path: "/" },
    { label: "Events", path: "/tournaments" },
    ...(isLocalAdmin ? [{ label: "Standings", path: "/leaderboard" }] : []),
    { label: "Fans", path: "/fans" },
    { label: "News", path: "/news" },
  ];
  const patchNotes = [
    "Patch watch: BMPS 2026 prize pool updated.",
    "Roster desk: 8Bit added Shubh to the active roster.",
    "Circuit note: Tournament hubs now carry the live standings flow.",
  ];

  return (
    <>
      <AnimatePresence>
        {searchOpen && <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(249,246,241,0.92))] backdrop-blur dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.86),rgba(17,24,39,0.92))]">
        <div className="flex min-h-[4.5rem] items-center gap-2.5 px-3 sm:px-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:hidden">
            <div
              data-core-logo-target="primary"
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm md:hidden"
            >
              <BrandMark concept="site" className="h-8 w-8 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.28em] text-primary">Core</p>
              <p className="truncate text-xs font-semibold text-foreground sm:text-sm">Esports command center</p>
            </div>
          </div>

          <button
            onClick={() => setSearchOpen(true)}
            className="relative ml-auto hidden w-full max-w-[38rem] md:flex"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <div className="flex h-11 w-full items-center rounded-xl border border-border/80 bg-background/95 pl-11 pr-4 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/35">
              Search tournaments, teams, matches, news...
            </div>
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-4">
            <div
              onClick={toggle}
              className="hidden cursor-pointer select-none items-center gap-1 rounded-2xl border border-border/80 bg-card px-1 py-1 text-xs font-medium shadow-sm sm:flex"
            >
              <span className={`flex items-center gap-1 rounded-xl px-2 py-1 transition-all ${theme === "light" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
                <Sun className="h-3 w-3" /> Light
              </span>
              <span className={`flex items-center gap-1 rounded-xl px-2 py-1 transition-all ${theme === "dark" ? "bg-secondary text-foreground shadow-sm dark:bg-slate-800 dark:text-white" : "text-muted-foreground"}`}>
                <Moon className="h-3 w-3" /> Dark
              </span>
            </div>

            <div className="hidden items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary lg:flex">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Live
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative flex h-8 w-8 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:h-9 sm:w-9">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-2xl border-border/80 p-2">
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Notifications</p>
                  <p className="mt-1 text-xs font-normal text-muted-foreground">Patch updates and circuit notes</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {patchNotes.map((note) => (
                  <DropdownMenuItem key={note} className="items-start rounded-xl px-3 py-3">
                    <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                    <span className="text-sm leading-5">{note}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:h-9 sm:w-9">
                  <Settings className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl border-border/80 p-2">
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Settings</p>
                  <p className="mt-1 text-xs font-normal text-muted-foreground">Quick interface controls</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={toggle} className="rounded-xl px-3 py-2.5">
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>Switch to {theme === "light" ? "dark" : "light"} theme</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSearchOpen(true)} className="rounded-xl px-3 py-2.5">
                  <Search className="h-4 w-4" />
                  <span>Open global search</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl px-3 py-2.5">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Coverage mode: competitive</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-white p-1 transition-colors hover:border-primary/40 sm:h-9 sm:w-9">
                  <BrandMark concept="site" className="h-full w-full object-contain" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl border-border/80 p-2">
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-white p-1">
                      <BrandMark concept="site" className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Core</p>
                      <p className="text-xs text-muted-foreground">Esports command center</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5">
                  <Link to="/teams">
                    <User className="h-4 w-4" />
                    <span>Open team directory</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5">
                  <Link to="/tournaments">
                    <Radio className="h-4 w-4" />
                    <span>Browse tournaments</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5">
                  <Link to="/tournaments">
                    <Sparkles className="h-4 w-4" />
                    <span>Open tournament hubs</span>
                  </Link>
                </DropdownMenuItem>
                {isLocalAdmin ? (
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5">
                    <Link to="/leaderboard">
                      <Sparkles className="h-4 w-4" />
                      <span>Open standings board</span>
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5">
                  <Link to="/fans">
                    <Radio className="h-4 w-4" />
                    <span>Open fan engagement</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto px-3 pb-3 md:hidden">
          {mobileNavItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>
    </>
  );
}

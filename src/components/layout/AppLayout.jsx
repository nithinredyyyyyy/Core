import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTheme } from "@/lib/ThemeContext";
import GlobalSearch from "@/components/search/GlobalSearch";
import AppHeader from "./AppHeader";
import MobileBottomNav from "./MobileBottomNav";

function useGlobalSearchShortcut(onOpen) {
  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);
}

/** Consistent application shell shared by every public route. */
export default function AppLayout() {
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  useGlobalSearchShortcut(() => setSearchOpen(true));

  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <AppHeader
        onOpenSearch={() => setSearchOpen(true)}
        theme={theme}
        onToggleTheme={toggle}
      />

      <main
        id="main-content"
        className="mx-auto w-full max-w-[var(--shell-max-width)] flex-1 px-4 pb-[calc(var(--bottom-nav-height)+1.5rem)] pt-6 sm:px-6 lg:pb-12"
      >
        <Outlet />
      </main>

      <footer className="hidden border-t border-border px-6 py-6 lg:block">
        <div className="mx-auto flex w-full max-w-[var(--shell-max-width)] items-center justify-between text-xs text-muted-foreground">
          <p className="font-semibold uppercase tracking-[0.18em]">
            Core · BGMI Esports Hub
          </p>
          <p>Stats, schedules and standings from official tournament data.</p>
        </div>
      </footer>

      <MobileBottomNav onOpenSearch={() => setSearchOpen(true)} />

      {searchOpen ? (
        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      ) : null}
    </div>
  );
}

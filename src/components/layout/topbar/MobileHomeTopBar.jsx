import React from "react";
import { Download, Moon, Search, Settings, Smartphone, Sun } from "lucide-react";
import NotificationBellDropdown from "@/components/layout/topbar/NotificationBellDropdown";
import { BrandMark } from "@/components/shared/BrandMark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MobileHomeTopBar({
  theme,
  toggle,
  setSearchOpen,
  isInstallable,
  isInstalled,
  promptInstall,
}) {
  return (
    <div className="mx-auto flex min-h-[4rem] max-w-[440px] items-center justify-between gap-3 px-4 pb-2 pt-[calc(0.9rem+env(safe-area-inset-top))]">
      <div className="flex min-w-0 items-center gap-3">
        <div
          data-core-logo-target="primary"
          className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/35 bg-white/20 shadow-[0_8px_20px_rgba(79,26,32,0.18)] backdrop-blur"
        >
          <BrandMark concept="site" className="size-7 object-contain" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b3842]">
            Esports
          </p>
          <p className="truncate text-sm font-semibold text-[#29141a]">
            StageCore
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
          className="flex size-9 items-center justify-center rounded-full bg-[rgba(24,10,18,0.92)] text-white shadow-[0_10px_22px_rgba(79,26,32,0.18)]"
        >
          <Search className="size-4" />
        </button>

        <NotificationBellDropdown
          buttonClassName="flex size-9 items-center justify-center rounded-full bg-[rgba(24,10,18,0.92)] text-white shadow-[0_10px_22px_rgba(79,26,32,0.18)]"
          iconClassName="size-4 text-white"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="flex size-9 items-center justify-center rounded-full bg-[rgba(24,10,18,0.92)] text-white shadow-[0_10px_22px_rgba(79,26,32,0.18)]"
            >
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

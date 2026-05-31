import React from "react";
import { Moon, Search, Sun } from "lucide-react";
import NotificationBellDropdown from "@/components/layout/topbar/NotificationBellDropdown";
import { BrandMark } from "@/components/shared/BrandMark";

export default function MobilePageTopBar({ setSearchOpen, theme, toggle }) {
  return (
    <div className="mx-auto flex max-w-[440px] items-center gap-3 px-4 pb-3 pt-[calc(0.8rem+env(safe-area-inset-top))]">
      <div
        data-core-logo-target="primary"
        className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-[rgba(24,10,18,0.18)] shadow-[0_8px_18px_rgba(79,26,32,0.14)]"
      >
        <BrandMark concept="site" className="size-7 object-contain" />
      </div>
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-[1.05rem] border border-white/18 bg-[rgba(24,10,18,0.18)] px-3.5 py-3 text-left text-sm font-medium text-[#2d1419] backdrop-blur"
      >
        <Search className="size-3.5 shrink-0 text-[#2d1419]/65" />
        <span className="truncate">Search teams, matches, stories...</span>
      </button>
      <NotificationBellDropdown
        buttonClassName="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[rgba(24,10,18,0.18)] text-[#2d1419] shadow-[0_8px_18px_rgba(79,26,32,0.14)]"
        iconClassName="size-4 text-[#2d1419]"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[rgba(24,10,18,0.18)] text-[#2d1419] shadow-[0_8px_18px_rgba(79,26,32,0.14)]"
      >
        {theme === "light" ? (
          <Moon className="size-4" />
        ) : (
          <Sun className="size-4" />
        )}
      </button>
    </div>
  );
}

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useTheme } from "@/lib/ThemeContext";
import GlobalSearch from "@/components/search/GlobalSearch";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useIsMobile } from "@/hooks/use-mobile";
import DesktopTopBar from "./topbar/DesktopTopBar";
import MobileHomeTopBar from "./topbar/MobileHomeTopBar";
import MobilePageTopBar from "./topbar/MobilePageTopBar";

export default function TopBar() {
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const isHome = location.pathname === "/app";
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
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
            ? "sticky top-0 z-40 bg-transparent"
            : `sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${
                theme === "dark"
                  ? "border-white/8 bg-[#07111d]/92 shadow-[0_18px_44px_rgba(2,8,23,0.28)]"
                  : "border-[#dce4ec]/80 bg-white/80"
              }`
        }
      >
        {isMobile ? (
          isHome ? (
            <MobileHomeTopBar
              theme={theme}
              toggle={toggle}
              setSearchOpen={setSearchOpen}
              isInstallable={isInstallable}
              isInstalled={isInstalled}
              promptInstall={promptInstall}
            />
          ) : (
            <MobilePageTopBar
              setSearchOpen={setSearchOpen}
              theme={theme}
              toggle={toggle}
            />
          )
        ) : (
          <DesktopTopBar
            setSearchOpen={setSearchOpen}
            theme={theme}
            toggle={toggle}
          />
        )}
      </header>
    </>
  );
}

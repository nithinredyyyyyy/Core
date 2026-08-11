import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useTheme } from "@/lib/ThemeContext";
import GlobalSearch from "@/components/search/GlobalSearch";
import DesktopTopBar from "./topbar/DesktopTopBar";

export default function TopBar() {
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
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

      <header className="sticky top-4 z-40 transition-colors mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <DesktopTopBar
          setSearchOpen={setSearchOpen}
          theme={theme}
          toggle={toggle}
        />
      </header>
    </>
  );
}

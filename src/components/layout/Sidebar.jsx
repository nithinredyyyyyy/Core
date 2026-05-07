import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, Trophy, Users, BarChart3,
  Newspaper, Shield, Megaphone
} from "lucide-react";
import { motion } from "framer-motion";
import { BrandMark, BrandWordmark } from "../shared/BrandMark";

const LOCAL_ADMIN_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export default function Sidebar() {
  const location = useLocation();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocalAdmin = LOCAL_ADMIN_HOSTS.has(hostname);
  const navItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Trophy, label: "Tournaments", path: "/tournaments" },
    { icon: Users, label: "Teams", path: "/teams" },
    ...(isLocalAdmin ? [{ icon: BarChart3, label: "Standings", path: "/leaderboard" }] : []),
    { icon: Megaphone, label: "Fans", path: "/fans" },
    { icon: Newspaper, label: "News", path: "/news" },
    ...(isLocalAdmin ? [{ icon: Shield, label: "Admin", path: "/admin" }] : []),
  ];

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[96px] border-r border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(249,246,241,0.94))] shadow-[16px_0_40px_rgba(15,23,42,0.05)] backdrop-blur md:flex md:flex-col md:items-center md:gap-3 md:py-5 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(17,24,39,0.96))] dark:shadow-[16px_0_40px_rgba(0,0,0,0.18)]">
      <Link
        to="/"
        className="mb-4 flex flex-col items-center gap-2 text-center transition-transform hover:-translate-y-0.5"
      >
        <div
          data-core-logo-target="primary"
          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-primary/15 bg-white p-1.5 shadow-[0_10px_26px_rgba(251,146,60,0.12)]"
        >
          <BrandMark concept="site" className="h-full w-full object-contain" />
        </div>
        <BrandWordmark className="text-[11px] tracking-[0.28em] text-foreground/88" />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-150 ${
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary/75 hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-300 shadow-[0_12px_24px_rgba(251,146,60,0.28)]"
                  transition={{ duration: 0.2 }}
                />
              )}
              <item.icon className="relative z-10 h-[18px] w-[18px]" />

              <span className="pointer-events-none absolute left-[3.8rem] whitespace-nowrap rounded-xl border border-border/80 bg-card px-2.5 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}

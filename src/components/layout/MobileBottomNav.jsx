import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Trophy,
  BarChart3,
  Megaphone,
  Newspaper,
  Shield,
} from "lucide-react";
import { buildContextualFanHubLink } from "@/lib/fanNavigation";
import { useAdminAccess } from "@/lib/adminAccess";

export default function MobileBottomNav() {
  const location = useLocation();
  const { hasAdminAccess } = useAdminAccess();
  const fansPath = buildContextualFanHubLink(location);

  const navItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Events", path: "/tournaments", icon: Trophy },
    { label: "Board", path: "/leaderboard", icon: BarChart3 },
    { label: "Fans", path: fansPath, icon: Megaphone },
    { label: "News", path: "/news", icon: Newspaper },
    ...(hasAdminAccess
      ? [{ label: "Admin", path: "/admin", icon: Shield }]
      : []),
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(0.8rem+env(safe-area-inset-bottom))] pt-2 md:hidden">
      <div
        className={`mx-auto grid max-w-xl gap-1 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,14,34,0.92),rgba(10,18,42,0.96))] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.32)] backdrop-blur ${hasAdminAccess ? "grid-cols-6" : "grid-cols-5"}`}
      >
        {navItems.map((item) => {
          const active = location.pathname === item.path.split("?")[0];
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.1rem] px-1 py-2 text-center transition-all ${
                active
                  ? "bg-[linear-gradient(180deg,#3b82f6,#2563eb)] text-white shadow-[0_12px_24px_rgba(37,99,235,0.3)]"
                  : "text-white/54"
              }`}
            >
              <item.icon className="size-[18px] shrink-0" />
              <span className="truncate text-[10px] font-bold uppercase tracking-[0.12em]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

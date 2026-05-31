import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Newspaper,
  Trophy,
  Users,
  UserCircle2,
  Waves,
} from "lucide-react";

export default function MobileBottomNav() {
  const location = useLocation();

  const navItems = [
    { label: "Home", path: "/app", icon: Home },
    { label: "Events", path: "/tournaments", icon: Trophy },
    { label: "Teams", path: "/teams", icon: Users },
    { label: "Fans", path: "/fans", icon: Waves },
    { label: "News", path: "/news", icon: Newspaper },
    { label: "Profile", path: "/profile", icon: UserCircle2 },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-1.5 md:hidden">
      <div
        className="mx-auto grid max-w-[420px] grid-cols-6 gap-1 rounded-[1.5rem] border border-black/10 bg-[rgba(24,10,18,0.92)] p-1.5 shadow-[0_18px_36px_rgba(45,10,20,0.28)] backdrop-blur-xl"
      >
        {navItems.map((item) => {
          const active = location.pathname === item.path.split("?")[0];
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[0.95rem] px-1 py-1.5 text-center transition-all ${
                active
                  ? "bg-[linear-gradient(180deg,#ff8c73,#ff6a63)] text-white shadow-[0_10px_20px_rgba(255,106,99,0.28)]"
                  : "text-white/55"
              }`}
            >
              <item.icon className="size-[1.05rem] shrink-0" />
              <span className="truncate text-[9px] font-bold uppercase tracking-[0.12em]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

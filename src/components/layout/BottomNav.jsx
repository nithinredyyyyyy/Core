import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Trophy, BarChart3, Star, Newspaper } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", path: "/", icon: Home },
  { label: "Tournaments", path: "/tournaments", icon: Trophy },
  { label: "Standings", path: "/leaderboard", icon: BarChart3 },
  { label: "Rankings", path: "/rankings", icon: Star },
  { label: "News", path: "/news", icon: Newspaper },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom lg:hidden">
      <div className="flex items-center justify-around px-1 py-1">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
          const active = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 1.8}
                className="transition-all"
              />
              <span className={`text-[10px] leading-tight ${active ? "font-bold" : "font-medium"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

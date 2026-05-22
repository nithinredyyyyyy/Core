import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileBottomNav from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div
      className={
        isMobile
          ? "min-h-screen bg-[linear-gradient(180deg,#0c1530_0%,#101c3e_22%,hsl(var(--background))_42%)] text-foreground"
          : "min-h-screen bg-background text-foreground"
      }
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className={
            isMobile
              ? "absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_32%),radial-gradient(circle_at_18%_20%,rgba(99,102,241,0.18),transparent_22%),radial-gradient(circle_at_82%_16%,rgba(251,146,60,0.16),transparent_18%),linear-gradient(180deg,rgba(15,23,42,0.18),transparent_60%)]"
              : "absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(255,95,31,0.16),transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.08),transparent_60%)]"
          }
        />
        <div className="absolute right-[-10rem] top-24 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-8rem] top-72 size-72 rounded-full bg-orange-400/10 blur-3xl" />
      </div>
      <Sidebar />
      <div className="flex min-h-screen flex-col md:pl-[96px]">
        <TopBar />
        <main className="flex-1 px-3 pb-28 pt-4 sm:px-4 sm:pt-5 md:px-8 md:pb-10 md:pt-6">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}

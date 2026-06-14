import React from "react";
import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import MobileBottomNav from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div
      className={
        isMobile
          ? "min-h-screen bg-[#f4a08d] text-foreground"
          : "min-h-screen bg-[#f4f7fb] text-foreground transition-colors dark:bg-[#07111f]"
      }
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className={
            isMobile
              ? "absolute inset-0 bg-[linear-gradient(180deg,#ffb29d_0%,#f49889_38%,#e95363_100%)]"
              : "absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(255,106,26,0.09),transparent_30%),radial-gradient(circle_at_86%_8%,rgba(56,189,248,0.12),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#f3f6fa_44%,#eef3f8_100%)] dark:bg-[radial-gradient(circle_at_12%_0%,rgba(255,106,26,0.12),transparent_30%),radial-gradient(circle_at_86%_8%,rgba(56,189,248,0.11),transparent_28%),linear-gradient(180deg,#07111f_0%,#0a1422_48%,#07111f_100%)]"
          }
        />
      </div>
      <div
        className={
          isMobile
            ? "mx-auto flex min-h-screen w-full max-w-[440px] flex-col"
            : "flex min-h-screen flex-col"
        }
      >
        <TopBar />
        <main
          className={
            isMobile
              ? "flex-1 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-2"
              : "flex-1 px-4 pb-10 pt-5 sm:px-6 md:px-8"
          }
        >
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}

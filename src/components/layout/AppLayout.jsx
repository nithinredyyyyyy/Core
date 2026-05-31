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
          : "min-h-screen bg-[#f6f8fb] text-foreground transition-colors dark:bg-[#07111f]"
      }
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className={
            isMobile
              ? "absolute inset-0 bg-[linear-gradient(180deg,#ffb29d_0%,#f49889_38%,#e95363_100%)]"
              : "absolute inset-0 bg-[#f6f8fb] dark:bg-[#07111f]"
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
              ? "flex-1 px-4 pb-24 pt-2"
              : "flex-1 px-4 pb-8 pt-4 sm:px-6 md:px-8"
          }
        >
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}

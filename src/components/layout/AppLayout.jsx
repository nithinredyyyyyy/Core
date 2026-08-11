import React from "react";
import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-transparent text-foreground transition-colors selection:bg-primary/20">
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <main className="flex-1 w-full mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 md:px-8 md:pb-10">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

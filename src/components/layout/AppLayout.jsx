import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(255,95,31,0.16),transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.08),transparent_60%)]" />
        <div className="absolute right-[-10rem] top-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-8rem] top-72 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />
      </div>
      <Sidebar />
      <div className="flex min-h-screen flex-col md:pl-[96px]">
        <TopBar />
        <main className="flex-1 px-3 pb-8 pt-4 sm:px-4 sm:pt-5 md:px-8 md:pb-10 md:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

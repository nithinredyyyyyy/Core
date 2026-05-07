import React from "react";
import { Bell, CheckCircle2, Megaphone, Sparkles, Trophy } from "lucide-react";
import FansPanel from "./FansPanel";

const ICONS = {
  prediction: Trophy,
  poll: Sparkles,
  team: CheckCircle2,
  rank: Trophy,
  chat: Megaphone,
  general: Bell,
};

export default function FanNotificationCenter({ notifications = [] }) {
  return (
    <FansPanel className="overflow-hidden">
      <div className="border-b border-[#d9e1ef] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-violet-500" />
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7b8dab]">Notification center</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-slate-400">Fan activity alerts will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#eef2f8]">
          {notifications.map((item) => {
            const Icon = ICONS[item.type] || ICONS.general;
            return (
              <div key={item.id} className="flex gap-3 px-4 py-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">{item.body}</p>
                  {item.meta ? <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">{item.meta}</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </FansPanel>
  );
}

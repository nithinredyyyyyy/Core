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
      <div className="border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Notification center</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">Fan activity alerts will appear here.</p>
          <p className="mt-2 text-[12px] leading-5 text-slate-400">
            Once you vote, post, or settle predictions, this stream turns into your quick activity recap.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {notifications.map((item) => {
            const Icon = ICONS[item.type] || ICONS.general;
            return (
              <div key={item.id} className="flex gap-3 px-4 py-3.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
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

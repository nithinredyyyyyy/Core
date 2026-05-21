import React from "react";
import { MessageSquare, Send, Sparkles } from "lucide-react";
import FansPanel from "./FansPanel";

export default function FanChat({
  draft,
  onDraftChange,
  onSubmit,
  messages = [],
  isSubmitting = false,
  selectedTopic = "General",
  onTopicChange,
  topicOptions = [],
}) {
  const remaining = Math.max(0, 220 - (draft?.length || 0));

  return (
    <FansPanel className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Community chat</p>
        </div>
        <div className="flex items-center gap-2">
          {topicOptions.length > 0 ? (
            <select
              value={selectedTopic}
              onChange={(event) => onTopicChange?.(event.target.value)}
              className="h-8 rounded-full border border-slate-200 bg-slate-50 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground outline-none"
            >
              {topicOptions.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          ) : null}
          <p className="text-[10px] text-muted-foreground">live • updates every 5s</p>
        </div>
      </div>

      <div className="flex min-h-[320px] flex-col">
        <div className="flex-1 px-5 py-6">
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((entry) => (
                <div key={entry.id} className="rounded-[16px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.06em] text-slate-900">{entry.author}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-primary">{entry.topic}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{entry.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-500">Be the first to send a message!</p>
              <p className="mt-2 max-w-[240px] text-sm leading-6 text-slate-400">
                Drop a quick take, prediction reaction, or matchday thought to get the conversation started.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border/70 px-5 py-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em] text-slate-400">
            <span>Keep it quick, readable, and match-focused</span>
            <span>{remaining} characters left</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              maxLength={220}
              placeholder="Say something..."
              className="h-11 flex-1 rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-primary/40"
            />
            <button
              type="button"
              onClick={onSubmit}
              disabled={!draft.trim() || isSubmitting}
              className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary text-white shadow-[0_10px_22px_rgba(251,146,60,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </FansPanel>
  );
}

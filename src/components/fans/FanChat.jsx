import React from "react";
import { MessageSquare, Send, Sparkles } from "lucide-react";
import FansPanel from "./FansPanel";

const EMPTY_MESSAGES = [];
const EMPTY_TOPICS = [];

export default function FanChat({
  draft,
  onDraftChange,
  onSubmit,
  messages = EMPTY_MESSAGES,
  isSubmitting = false,
  selectedTopic = "General",
  onTopicChange,
  topicOptions = EMPTY_TOPICS,
}) {
  const remaining = Math.max(0, 220 - (draft?.length || 0));

  return (
    <FansPanel className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0.08))] px-5 py-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-3.5 text-primary" />
          <p className="type-kicker text-primary">
            Community floor
          </p>
        </div>
        <div className="flex items-center gap-2">
          {topicOptions.length > 0 ? (
            <select
              value={selectedTopic}
              onChange={(event) => onTopicChange?.(event.target.value)}
              className="h-8 rounded-full border border-slate-200 bg-white px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground outline-none dark:bg-white/[0.05]"
            >
              {topicOptions.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          ) : null}
          <p className="type-kicker text-muted-foreground">
            live | updates every 5s
          </p>
        </div>
      </div>

      <div className="flex min-h-[320px] flex-col">
        <div className="flex-1 px-5 py-6">
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="type-title-md uppercase text-slate-900 dark:text-white">
                        {entry.author}
                      </p>
                      <p className="type-kicker mt-1 text-primary">
                        {entry.topic}
                      </p>
                    </div>
                  </div>
                  <p className="type-body-sm mt-3 text-slate-500 dark:text-slate-300">
                    {entry.body}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="size-6" />
              </div>
              <p className="type-title-md mt-4 text-slate-500 dark:text-slate-200">
                Open the floor
              </p>
              <p className="type-body-sm mt-2 max-w-[260px] text-slate-400">
                Drop a quick take, prediction reaction, or matchday thought to
                get the conversation started.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border/70 px-5 py-4">
          <div className="type-kicker mb-2 flex items-center justify-between gap-3 text-slate-400">
            <span>Keep it quick, readable, and match-focused</span>
            <span>{remaining} characters left</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              maxLength={220}
              placeholder="Say something…"
              aria-label="Chat message"
              className="h-12 flex-1 rounded-[16px] border border-slate-200 bg-white px-4 text-[15px] text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-primary/40 dark:bg-white/[0.05] dark:text-white"
            />
            <button
              type="button"
              onClick={onSubmit}
              disabled={!draft.trim() || isSubmitting}
              aria-label="Send message"
              className="flex size-12 items-center justify-center rounded-[16px] bg-primary text-white shadow-[0_12px_24px_rgba(251,146,60,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </FansPanel>
  );
}

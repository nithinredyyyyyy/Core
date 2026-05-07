import React from "react";
import { MessageSquare, Send, Sparkles } from "lucide-react";
import FansPanel from "./FansPanel";

export default function FanChat({
  draft,
  onDraftChange,
  onSubmit,
  messages = [],
  selectedTopic = "Open Floor",
  onTopicChange,
  topicOptions = [],
}) {
  return (
    <FansPanel className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[#d9e1ef] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-violet-500" />
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7b8dab]">Community chat</p>
        </div>
        <div className="flex items-center gap-2">
          {topicOptions.length > 0 ? (
            <select
              value={selectedTopic}
              onChange={(event) => onTopicChange?.(event.target.value)}
              className="h-8 rounded-full border border-slate-200 bg-slate-50 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7b8dab] outline-none"
            >
              {topicOptions.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          ) : null}
          <p className="text-[10px] text-[#7b8dab]">live • updates every 5s</p>
        </div>
      </div>

      <div className="flex min-h-[320px] flex-col">
        <div className="flex-1 px-5 py-6">
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((entry) => (
                <div key={entry.id} className="rounded-[16px] border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.06em] text-slate-900">{entry.author}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-violet-600">{entry.topic}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{entry.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-violet-500">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-500">Be the first to send a message!</p>
              <p className="mt-2 max-w-[240px] text-sm leading-6 text-slate-400">
                Drop a quick take, prediction reaction, or matchday thought to get the conversation started.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-[#d9e1ef] px-5 py-4">
          <div className="flex items-center gap-3">
            <input
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              maxLength={220}
              placeholder="Say something..."
              className="h-11 flex-1 rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-500 outline-none transition-colors placeholder:text-slate-300 focus:border-primary/40"
            />
            <button
              type="button"
              onClick={onSubmit}
              disabled={!draft.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-300 text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </FansPanel>
  );
}

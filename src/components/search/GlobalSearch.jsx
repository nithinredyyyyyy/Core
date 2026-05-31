import React, { useEffect, useRef, useState } from "react";
import {
  Newspaper,
  Search,
  Trophy,
  Users,
  X,
  UserCircle,
  Waves,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { base44 } from "@/api/base44Client";

const RESULT_ICONS = {
  tournament: Trophy,
  team: Users,
  player: UserCircle,
  match: Trophy,
};

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(timeoutId);
    }
  }, [open]);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const q = query.toLowerCase().trim();

  const { data: rawResults = [] } = useQuery({
    queryKey: ["global-search", q],
    queryFn: () => base44.search.global(q, 10),
    enabled: open && q.length >= 2,
    staleTime: 15_000,
  });

  const results = rawResults.filter(
    (result) => typeof result?.path === "string",
  );

  const suggestions = [
    { icon: Trophy, label: "Tournaments", path: "/tournaments" },
    { icon: Users, label: "Teams", path: "/teams" },
    { icon: Waves, label: "Fans", path: "/fans" },
    { icon: Newspaper, label: "News", path: "/news" },
    { icon: UserCircle, label: "Profile", path: "/profile" },
  ];

  const go = (path) => {
    navigate(path);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20">
      <button
        type="button"
        aria-label="Close global search"
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <LazyMotion features={domAnimation}>
        <m.div
          initial={{ opacity: 0, scale: 0.97, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="size-4 flex-shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tournaments, teams, players, matches?"
            aria-label="Search StageCore"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {results.length > 0 ? (
            results.map((result) => {
              const Icon = RESULT_ICONS[result.type] || Search;
              return (
                <button
                  type="button"
                  key={`${result.type}-${result.path ?? result.label}-${result.sub ?? ""}`}
                  onClick={() => go(result.path)}
                  className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {result.label}
                      </p>
                      <p className="text-[11px] capitalize text-muted-foreground">
                        {result.sub}
                      </p>
                    </div>
                    <span className="rounded bg-secondary px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                      {result.type}
                    </span>
                  </div>
                </button>
              );
            })
          ) : query.length >= 2 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              No results for "{query}"
            </p>
          ) : (
            <div>
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Links
              </p>
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion.path}
                  onClick={() => go(suggestion.path)}
                  className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <suggestion.icon className="size-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {suggestion.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        </m.div>
      </LazyMotion>
    </div>
  );
}

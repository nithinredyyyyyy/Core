import React, { useEffect, useRef, useState } from "react";
import { Search, Trophy, Users, Swords, Newspaper, X, UserCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

const RESULT_ICONS = {
  tournament: Trophy,
  team: Users,
  player: UserCircle,
  match: Swords,
  news: Newspaper,
};

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
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

  const { data: results = [] } = useQuery({
    queryKey: ["global-search", q],
    queryFn: () => base44.search.global(q, 10),
    enabled: open && q.length >= 2,
    staleTime: 15_000,
  });

  const suggestions = [
    { icon: Trophy, label: "Tournaments", path: "/tournaments" },
    { icon: Users, label: "Teams", path: "/teams" },
    { icon: Swords, label: "Fans", path: "/fans" },
    { icon: Newspaper, label: "News", path: "/news" },
  ];

  const go = (path) => {
    navigate(path);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tournaments, teams, players, matches, news..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">ESC</kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {results.length > 0 ? (
            results.map((result, index) => {
              const Icon = RESULT_ICONS[result.type] || Search;
              return (
                <button
                  key={`${result.type}-${result.label}-${index}`}
                  onClick={() => go(result.path)}
                  className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{result.label}</p>
                      <p className="text-[11px] capitalize text-muted-foreground">{result.sub}</p>
                    </div>
                    <span className="rounded bg-secondary px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                      {result.type}
                    </span>
                  </div>
                </button>
              );
            })
          ) : query.length >= 2 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No results for "{query}"</p>
          ) : (
            <div>
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Links
              </p>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.path}
                  onClick={() => go(suggestion.path)}
                  className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <suggestion.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{suggestion.label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

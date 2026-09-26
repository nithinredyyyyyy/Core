import React, { useEffect, useRef, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SHARE_TARGETS = [
  {
    label: "WhatsApp",
    href: (url, title) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    label: "X",
    href: (url, title) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
];

/**
 * Share control for public detail pages. Uses the canonical URL for the
 * current route, so shared links point at the same page search engines index.
 * `navigator.share` is used when available (mobile), with explicit WhatsApp /
 * X / copy-link fallbacks everywhere else.
 */
export default function ShareMenu({ title, url, className = "" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);
  const shareUrl =
    url || (typeof window === "undefined" ? "" : window.location.href);
  const shareTitle = title || "CORE — BGMI Esports Hub";

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      } catch {
        // User dismissed the native sheet — fall through to the menu.
      }
    }
    setOpen((value) => !value);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setOpen(false);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={handleShare}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Share ${shareTitle}`}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Share2 className="size-3.5" aria-hidden="true" />
        Share
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg"
        >
          {SHARE_TARGETS.map((target) => (
            <a
              key={target.label}
              role="menuitem"
              href={target.href(shareUrl, shareTitle)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {target.label}
            </a>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={handleCopy}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" aria-hidden="true" />
            ) : (
              <Link2 className="size-3.5" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

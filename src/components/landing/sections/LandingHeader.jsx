import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, Moon, Sun } from "lucide-react";
import { BrandMark } from "@/components/shared/BrandMark";

export function LandingHeader({ theme, toggle, isInstallable, promptInstall }) {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-cream-edge/90 bg-[rgba(247,247,245,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[5rem] w-full max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div
            data-core-logo-target="primary"
            className="flex size-10 items-center justify-center rounded-full border border-brand-cream-edge-soft bg-white p-1.5 shadow-[0_10px_24px_rgba(17,17,17,0.05)]"
          >
            <BrandMark concept="site" className="size-full object-contain" />
          </div>
          <div>
            <p className="type-title-lg text-brand-ink-pure">
              Core
            </p>
            <p className="type-kicker text-brand-slate-gray">
              Core
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {[
            ["Why Core", "#why"],
            ["Platform", "#platform"],
            ["Circuit", "#circuit"],
            ["Sign in", "#signin"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="type-nav rounded-full px-4 py-2 text-brand-ink-faint transition hover:bg-white hover:text-brand-ink-pure"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            className="inline-flex size-11 items-center justify-center rounded-full border border-brand-cream-line bg-white text-brand-ink-pure shadow-[0_8px_20px_rgba(17,17,17,0.04)]"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <Moon className="size-4" strokeWidth={2.2} />
            ) : (
              <Sun className="size-4" strokeWidth={2.2} />
            )}
          </button>
          <Link
            to="/app"
            className="hidden rounded-full border border-brand-cream-line bg-white px-5 py-2.5 text-sm font-semibold text-brand-ink-pure shadow-[0_8px_20px_rgba(17,17,17,0.04)] sm:inline-flex"
          >
            Open desktop app
          </Link>
          {isInstallable && (
            <button
              type="button"
              onClick={promptInstall}
              className="inline-flex items-center gap-2 rounded-full bg-brand-ink-pure px-5 py-2.5 text-sm font-semibold text-white"
            >
              Get the app <Download className="size-4" />
            </button>
          )}
          <Link
            to="/signin"
            className="inline-flex items-center gap-2 rounded-full bg-brand-ink-pure px-5 py-2.5 text-sm font-semibold text-white"
          >
            Admin sign in <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

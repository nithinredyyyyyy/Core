import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Waves } from "lucide-react";
import { SoftCard } from "@/components/landing/sections/SoftCard";

export function LandingFinalCta() {
  return (
    <section className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
      <SoftCard className="p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-mint">
              Final call
            </p>
            <h2 className="mt-4 text-[2.1rem] font-semibold leading-[0.94] tracking-[-0.06em] text-brand-ink-pure sm:text-[3rem]">
              Enter Core with the right surface for the job.
            </h2>
            <p className="mt-4 text-sm leading-7 text-brand-slate-stone sm:text-[15px]">
              Use the landing page to discover the brand, the desktop app
              for deep control, and the mobile layer for fast matchday use.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-ink-pure px-6 py-3 text-sm font-semibold text-white"
            >
              Open desktop app <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/signin"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-cream-line bg-white px-6 py-3 text-sm font-semibold text-brand-ink-pure"
            >
              Admin sign in <Waves className="size-4" />
            </Link>
          </div>
        </div>
      </SoftCard>
    </section>
  );
}

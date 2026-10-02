import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Shell } from "@/components/landing/sections/Shell";
import { SoftCard } from "@/components/landing/sections/SoftCard";

export function SigninSection() {
  return (
    <Shell
      id="signin"
      eyebrow="Admin sign in"
      title="Operator access behind the season."
      body="Google admin sign-in keeps the operational product focused on tournaments, teams, and standings."
    >
      <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
        <SoftCard className="overflow-hidden bg-[linear-gradient(180deg,var(--brand-ink-soft)_0%,var(--brand-ink-soft-2)_100%)] p-5 text-white sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/72">Admin access</p>
          <h3 className="mt-3 text-[2rem] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
            Sign in with your Google admin account to run the season.
          </h3>
          <p className="mt-4 text-sm leading-7 text-white/86">
            Tournament, team, standings, and editorial controls stay in one clean admin route.
          </p>
          <div className="mt-6">
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-ink-pure"
            >
              Open sign in <ArrowRight className="size-4" />
            </Link>
          </div>
        </SoftCard>

        <div className="grid gap-4">
          {[
            {
              label: "Admin route",
              title: "Manage tournaments, teams, standings, and editorial from one console.",
            },
            {
              label: "Desktop route",
              title: "Jump straight into tournaments, teams, and standings.",
            },
            {
              label: "Mobile route",
              title: "Install the faster matchday layer when you need it.",
            },
          ].map((item) => (
            <SoftCard key={item.label} className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-mint">
                {item.label}
              </p>
              <p className="mt-3 text-[1.1rem] font-semibold leading-[1.08] tracking-[-0.03em] text-brand-ink-pure">
                {item.title}
              </p>
            </SoftCard>
          ))}
        </div>
      </div>
    </Shell>
  );
}

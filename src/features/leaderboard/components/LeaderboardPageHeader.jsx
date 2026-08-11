export function LeaderboardPageHeader({ boardIntro, featuredTournament }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
          Tournament center
        </p>
        <h1 className="mt-2 text-[2rem] font-heading font-semibold tracking-[-0.04em] text-foreground md:text-4xl">
          STANDINGS
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {boardIntro}
        </p>
      </div>
      <div className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm sm:w-auto sm:text-right">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Featured board
        </p>
        <p className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-primary">
          {featuredTournament?.status === "upcoming" ? "Armed" : "Active"}
        </p>
      </div>
    </div>
  );
}

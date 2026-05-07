import React from "react";

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

const VARIANTS = {
  light: {
    primaryGrid: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
    secondaryGrid: "grid gap-3 md:grid-cols-3",
    card: "rounded-[20px] border border-border bg-background/75 p-4",
    label: "mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground",
    valueStrong: "mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-foreground",
    value: "mt-2 text-lg font-semibold text-foreground",
    accentLabel: "text-[10px] font-bold uppercase tracking-[0.18em] text-primary",
    icon: "h-4 w-4 text-primary",
  },
  dark: {
    primaryGrid: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
    secondaryGrid: "grid gap-3 md:grid-cols-3",
    card: "rounded-2xl border border-white/10 bg-white/5 p-4",
    label: "text-[10px] uppercase tracking-wider text-[#d0ad63]",
    valueStrong: "mt-2 text-2xl font-heading font-bold text-white",
    value: "mt-2 text-lg font-semibold text-white",
    accentLabel: "text-[10px] uppercase tracking-wider text-[#d0ad63]",
    icon: "h-4 w-4 text-[#d0ad63]",
  },
};

function StatTile({ item, styles, strong = true }) {
  const Icon = item.icon;
  return (
    <div className={styles.card}>
      {Icon ? <Icon className={styles.icon} /> : null}
      <p className={Icon ? styles.label : styles.accentLabel}>{item.label}</p>
      <p className={strong ? styles.valueStrong : styles.value}>{item.value}</p>
    </div>
  );
}

export default function ProfileStatGrid({
  primary = [],
  secondary = [],
  variant = "light",
  className = "",
}) {
  const styles = VARIANTS[variant] || VARIANTS.light;

  return (
    <div className={joinClassNames("space-y-3", className)}>
      {primary.length ? (
        <div className={styles.primaryGrid}>
          {primary.map((item) => (
            <StatTile key={item.label} item={item} styles={styles} strong />
          ))}
        </div>
      ) : null}
      {secondary.length ? (
        <div className={styles.secondaryGrid}>
          {secondary.map((item) => (
            <StatTile key={item.label} item={item} styles={styles} strong={false} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

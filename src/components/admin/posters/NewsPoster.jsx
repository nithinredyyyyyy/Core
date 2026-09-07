import React from "react";

export default function NewsPoster({ article, tournamentLogo }) {
  if (!article) {
    return (
      <div style={{ width: "540px", height: "300px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: "20px", color: "#94a3b8", fontFamily: "'Inter', sans-serif", fontSize: "14px" }}>
        No news article selected.
      </div>
    );
  }

  const categoryColors = {
    tournament: { bg: "#fff7ed", border: "#fed7aa", text: "#ea580c", label: "Tournament" },
    roster_change: { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a", label: "Roster Change" },
    patch_update: { bg: "#eff6ff", border: "#bfdbfe", text: "#2563eb", label: "Patch Update" },
    announcement: { bg: "#fdf4ff", border: "#e9d5ff", text: "#9333ea", label: "Announcement" },
    general: { bg: "#f8fafc", border: "#e2e8f0", text: "#475569", label: "General" },
  };
  const cat = categoryColors[article.category] || categoryColors.general;

  const priorityAccent = {
    breaking: "#ef4444",
    important: "#f97316",
    routine: "#64748b",
  }[article.priority] || "#f97316";

  const formattedDate = article.created_date
    ? new Date(article.created_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <div className="poster-root">
      <div style={{ width: "540px", background: "#FAFAFA", borderRadius: "20px", overflow: "hidden", position: "relative", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.08)", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", inset: "-50%", opacity: 0.05, display: "flex", flexDirection: "column", gap: "4px", transform: "rotate(-8deg)", transformOrigin: "center" }}>
            {Array.from({ length: 60 }).map((_, i) => (
              <div key={i} style={{ fontSize: "18px", fontWeight: 900, fontFamily: "sans-serif", color: priorityAccent, padding: "2px 0", whiteSpace: "nowrap", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                {Array.from({ length: 12 }).map(() => "NEWS").join(" ★ ")}
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "320px", height: "320px", background: `radial-gradient(ellipse, ${priorityAccent}18, transparent 60%)` }} />
          <div style={{ position: "absolute", bottom: "-60px", right: "-60px", width: "260px", height: "260px", background: `radial-gradient(ellipse, ${priorityAccent}10, transparent 60%)` }} />
          <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: `radial-gradient(circle, ${priorityAccent} 1.5px, transparent 1.5px)`, backgroundSize: "20px 20px" }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: "70px", height: "70px", borderLeft: `2px solid ${priorityAccent}25`, borderTop: `2px solid ${priorityAccent}25`, borderRadius: "20px 0 0 0" }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: "70px", height: "70px", borderRight: `2px solid ${priorityAccent}20`, borderBottom: `2px solid ${priorityAccent}20`, borderRadius: "0 0 20px 0" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(90deg, transparent, ${priorityAccent}, transparent)`, zIndex: 2 }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, padding: "28px 28px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
            <img src="/images/Krafton.png" alt="Krafton" style={{ height: "22px", width: "auto", objectFit: "contain" }} />
            <img src="/images/core-logo.png" alt="Core Esports" style={{ height: "22px", width: "auto", objectFit: "contain" }} />
          </div>

          {article.thumbnail_url && (
            <div style={{ width: "100%", height: "200px", borderRadius: "14px", overflow: "hidden", marginBottom: "20px" }}>
              <img src={article.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            {article.priority === "breaking" && (
              <div style={{ background: "#ef4444", color: "#fff", fontSize: "9px", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", padding: "3px 10px", borderRadius: "6px" }}>
                Breaking
              </div>
            )}
            <div style={{ background: cat.bg, border: `1px solid ${cat.border}`, color: cat.text, fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", padding: "3px 10px", borderRadius: "6px" }}>
              {cat.label}
            </div>
            {article.game && article.game !== "General" && (
              <div style={{ background: "#f1f5f9", color: "#475569", fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 10px", borderRadius: "6px" }}>
                {article.game}
              </div>
            )}
            <div style={{ flex: 1 }} />
            {formattedDate && (
              <span style={{ fontSize: "9px", fontWeight: 600, color: "#94a3b8" }}>{formattedDate}</span>
            )}
          </div>

          <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "12px" }}>
            {article.title}
          </h1>

          {article.summary && (
            <p style={{ fontSize: "13px", fontWeight: 400, color: "#475569", lineHeight: 1.65, marginBottom: "20px", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {article.summary}
            </p>
          )}

          <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #e2e8f0, transparent)", marginBottom: "14px" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              {article.source_name && (
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8" }}>
                  Source: {article.source_name}
                </div>
              )}
              <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#64748b", marginTop: "2px" }}>
                CORE ESPORTS
              </div>
            </div>
            {tournamentLogo && (
              <img src={tournamentLogo} alt="" style={{ height: "36px", width: "auto", objectFit: "contain", opacity: 0.8 }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

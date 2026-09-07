import React from "react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";
import { getTeamLogoByName } from "@/lib/teamLogos";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { BMPS_2026_ROSTERS } from "@/lib/bmps2026Rosters";
import { TEAM_NAME_ALIASES } from "./posterMvpHelpers";

const PUBLISHER_LOGOS = {
  BGMI: "/images/Krafton.png",
  PUBG: "/images/PUBG Mobile.png",
  GAME_FOR_PEACE: "/images/Tencent Games.png",
};

function getPublisherLogo(game, tournamentName) {
  if (/bgms|masters\s*series/i.test(tournamentName)) return "/images/NODWIN.png";
  if (!game) return "/images/Krafton.png";
  const upper = game.toUpperCase().replace(/\s+/g, "_");
  if (upper.includes("PEACE") || upper.includes("TENCENT")) return PUBLISHER_LOGOS.GAME_FOR_PEACE;
  if (upper.includes("PUBG")) return PUBLISHER_LOGOS.PUBG;
  return PUBLISHER_LOGOS.BGMI;
}

export default function PodiumPoster({ standingsRows, tournament, tournamentLogo, teams, playerTeamMap = {} }) {
  const top3 = standingsRows.slice(0, 3);
  const placements = [
    { label: "CHAMPIONS", color: "#D4AF37", slug: "champions" },
    { label: "RUNNERS-UP", color: "#8A8D91", slug: "runners-up" },
    { label: "2ND RUNNERS-UP", color: "#CD7F32", slug: "2nd-runners-up" },
  ];

  const getTeamRoster = (teamName) => {
    const normalized = teamName?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
    const rosterKey = Object.keys(BMPS_2026_ROSTERS).find(k =>
      k === normalized || normalized.includes(k) || k.includes(normalized)
    );
    if (rosterKey) return BMPS_2026_ROSTERS[rosterKey];
    if (Array.isArray(tournament?.participants)) {
      const aliases = TEAM_NAME_ALIASES[normalized] || [];
      const participant = tournament.participants.find(p => {
        const pName = typeof p === "string" ? p : p.team || p.name || "";
        const pNorm = pName.toLowerCase().replace(/[^a-z0-9]/g, "");
        return pNorm === normalized || pNorm.includes(normalized) || normalized.includes(pNorm) ||
          aliases.some(a => pNorm === a || pNorm.includes(a) || a.includes(pNorm));
      });
      if (participant?.players?.length) return participant.players;
      if (Array.isArray(participant?.player_names)) return participant.player_names;
    }
    const team = teams.find(t => t.name?.toLowerCase() === teamName?.toLowerCase());
    if (team?.players && team.players.length > 0) return team.players;
    if (team?.roster && team.roster.length > 0) return team.roster;
    const reversePlayers = Object.entries(playerTeamMap)
      .filter(([, tn]) => tn?.toLowerCase() === teamName?.toLowerCase())
      .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));
    if (reversePlayers.length > 0) return reversePlayers;
    return [];
  };

  const handleDownloadSingle = async (posterEl, teamName, slug) => {
    if (!posterEl) return;
    try {
      await document.fonts.ready;
      const rect = posterEl.getBoundingClientRect();
      const clone = posterEl.cloneNode(true);
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = rect.width + "px";
      clone.style.height = rect.height + "px";
      clone.style.zIndex = "-1";
      document.body.appendChild(clone);

      const origEls = [posterEl, ...posterEl.querySelectorAll("*")];
      const cloneEls = [clone, ...clone.querySelectorAll("*")];
      for (let i = 0; i < origEls.length && i < cloneEls.length; i++) {
        try {
          const computed = window.getComputedStyle(origEls[i]);
          for (let j = 0; j < computed.length; j++) {
            const prop = computed[j];
            const val = computed.getPropertyValue(prop);
            if (val) cloneEls[i].style.setProperty(prop, val);
          }
        } catch {}
      }

      let dataUrl;
      try {
        dataUrl = await toPng(clone, {
          width: Math.ceil(rect.width),
          height: Math.ceil(rect.height),
          pixelRatio: 3,
          backgroundColor: "#ffffff",
          cacheBust: true,
        });
      } finally {
        document.body.removeChild(clone);
      }

      const link = document.createElement("a");
      link.download = `${teamName.replace(/\s+/g, "-").toLowerCase()}-${slug}-poster.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Poster export failed:", err);
    }
  };

  return (
    <div className="poster-root" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {top3.map((team, i) => {
        const p = placements[i];
        const roster = getTeamRoster(team.teamName);
        const players = roster.slice(0, 5);
        const teamLogo = getTeamLogoByName(team.teamName);
        const sliceCount = players.length || 1;

        return (
          <div key={team.teamId || team.teamName} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div className="poster-podium-item" data-team={team.teamName} data-poster-index={i} style={{ width: "480px", height: "640px", position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif", borderRadius: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.08)" }}>
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(180deg, ${p.color} 0%, ${p.color}cc 15%, ${p.color}66 30%, ${p.color}22 45%, #f0ece8 65%, #f2eeeb 85%, #f5f2ef 100%)`,
                }} />
                <div style={{
                  position: "absolute", top: "-120px", left: "50%", transform: "translateX(-50%)",
                  width: "400px", height: "400px",
                  background: `radial-gradient(ellipse, ${p.color}40, transparent 65%)`,
                }} />
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                  opacity: 1,
                }} />
              </div>

              <div style={{ position: "absolute", top: "16px", left: "18px", zIndex: 10 }}>
                <img src={getPublisherLogo(tournament?.game, tournament?.name)} alt="Publisher" style={{ height: "32px", width: "auto", objectFit: "contain" }} />
              </div>
              <div style={{ position: "absolute", top: "16px", right: "18px", zIndex: 10 }}>
                <img src="/images/core-logo.png" alt="Core Esports" style={{ height: "32px", width: "auto", objectFit: "contain" }} />
              </div>

              {/* ===== Player photo slices ===== */}
              <div style={{ position: "absolute", top: "60px", left: "16px", right: "16px", bottom: "200px", display: "flex", zIndex: 2, overflow: "hidden", borderRadius: "8px" }}>
                {players.map((player, pi) => {
                  const name = typeof player === "string" ? player : player.name || player.ign || player.id || "";
                  const photo = getPlayerPhotoByIgn(name);
                  return (
                    <React.Fragment key={pi}>
                      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                        {photo ? (
                          <img 
                            src={photo} 
                            alt={name} 
                            style={{ 
                              width: "100%", 
                              height: "100%", 
                              objectFit: "cover", 
                              objectPosition: "center top", 
                              filter: `contrast(1.15) brightness(0.95) saturate(0.85) sepia(0.15) hue-rotate(-5deg)` 
                            }} 
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: `linear-gradient(180deg, ${p.color}30, #111)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 900, color: `${p.color}60` }}>
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        {/* Name bar at bottom of strip */}
                        <div style={{
                          position: "absolute", bottom: 0, left: 0, right: 0, height: "24px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)",
                          fontFamily: "'Inter', sans-serif", fontSize: "8px", fontWeight: 800,
                          color: "#fff", letterSpacing: "0.15em", textTransform: "uppercase",
                          zIndex: 10
                        }}>
                          {name}
                        </div>
                      </div>
                      {pi < sliceCount - 1 && (
                        <div style={{ width: "2px", background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* ===== Team logo + name ===== */}
              <div style={{ position: "absolute", bottom: "100px", left: 0, right: 0, height: "100px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "6px", zIndex: 3 }}>
                {teamLogo && (
                  <img src={teamLogo} alt={team.teamName} style={{ width: "52px", height: "52px", objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))" }} />
                )}
                <h1 style={{ fontSize: "18px", fontWeight: 800, color: "#111", letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center", maxWidth: "420px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {team.teamName}
                </h1>
              </div>

              {/* ===== Placement + tournament info ===== */}

              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "100px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 3, padding: "0 24px" }}>
                <h2 style={{ fontSize: p.label.length > 12 ? "36px" : "46px", fontWeight: 900, color: "#111", letterSpacing: "-0.02em", lineHeight: 0.9, textTransform: "uppercase", textAlign: "center", maxWidth: "420px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.label}
                </h2>
                <div style={{ marginTop: "6px" }}>
                  <span style={{ fontSize: "8px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    {tournament?.name || "Tournament"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.querySelector(`.poster-podium-item[data-team="${CSS.escape(team.teamName)}"]`);
                handleDownloadSingle(el, team.teamName, p.slug);
              }}
              style={{ padding: "8px 20px", background: p.color, color: "#000", border: "none", borderRadius: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", letterSpacing: "0.05em" }}
            >
              <Download size={13} />
              Download {p.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}

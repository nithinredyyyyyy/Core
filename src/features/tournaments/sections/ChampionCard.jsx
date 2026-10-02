import React from "react";
import TeamIdentity from "@/components/shared/TeamIdentity";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";

export function ChampionCard({
  championImageSrc,
  championRoster,
  championTeamName,
  championLogoOverride,
  tournament,
}) {
  const isBgms = /bgms|masters\s*series/i.test(tournament?.name);
  const publisherLogo = isBgms ? "/images/NODWIN.png" : "/images/Krafton.png";
  const players = (championRoster || []).slice(0, 5);

  return (
    <div className="poster-root">
      <div style={{
        width: "min(100%, 480px)", height: "640px", position: "relative", overflow: "hidden",
        fontFamily: "'Inter', sans-serif", borderRadius: "20px",
        boxShadow: "0 1px 3px rgba(var(--rgb-0-0-0),0.04), 0 12px 40px rgba(var(--rgb-0-0-0),0.08)",
      }}>
        {/* BG: Gold gradient + grid grid-cols-1 */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, var(--art-d4af37) 0%, var(--art-d4af37cc) 15%, var(--art-d4af3766) 30%, var(--art-d4af3722) 45%, var(--art-f0ece8) 65%, var(--art-f2eeeb) 85%, var(--art-f5f2ef) 100%)",
          }} />
          <div style={{
            position: "absolute", top: "-120px", left: "50%", transform: "translateX(-50%)",
            width: "400px", height: "400px",
            background: "radial-gradient(ellipse, rgba(var(--rgb-212-175-55),0.25), transparent 65%)",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(rgba(var(--rgb-255-255-255),0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--rgb-255-255-255),0.35) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
        </div>

        {/* Publisher + Core logos */}
        <div style={{ position: "absolute", top: "16px", left: "18px", zIndex: 10 }}>
          <img src={publisherLogo} alt="Publisher" style={{ height: "32px", width: "auto", objectFit: "contain" }} />
        </div>
        <div style={{ position: "absolute", top: "16px", right: "18px", zIndex: 10 }}>
          <img src="/images/core-logo.png" alt="Core Esports" style={{ height: "32px", width: "auto", objectFit: "contain" }} />
        </div>

        {/* Champion image or player slices */}
        {championImageSrc ? (
          <div style={{ position: "absolute", top: "60px", left: "16px", right: "16px", bottom: "200px", zIndex: 2, overflow: "hidden", borderRadius: "8px" }}>
            <img
              src={championImageSrc}
              alt={`${championTeamName} champion`}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
            />
          </div>
        ) : players.length > 0 ? (
          <div style={{ position: "absolute", top: "60px", left: "16px", right: "16px", bottom: "200px", display: "flex", zIndex: 2, overflow: "hidden", borderRadius: "8px" }}>
            {players.map((player, pi) => {
              const name = typeof player === "string" ? player : player.name || player.ign || "";
              const photo = getPlayerPhotoByIgn(name);
              return (
                <React.Fragment key={pi}>
                  <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                    {photo ? (
                      <img
                        src={photo}
                        alt={name}
                        style={{
                          width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top",
                          filter: "contrast(1.15) brightness(0.95) saturate(0.85) sepia(0.15) hue-rotate(-5deg)",
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%",
                        background: "linear-gradient(180deg, rgba(var(--rgb-212-175-55),0.3), var(--brand-ink-pure))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "28px", fontWeight: 900, color: "rgba(var(--rgb-212-175-55),0.6)",
                      }}>
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0, height: "24px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(var(--rgb-0-0-0),0.85)", backdropFilter: "blur(4px)",
                      fontFamily: "'Inter', sans-serif", fontSize: "8px", fontWeight: 800,
                      color: "var(--brand-white)", letterSpacing: "0.15em", textTransform: "uppercase", zIndex: 10,
                    }}>
                      {name}
                    </div>
                  </div>
                  {pi < players.length - 1 && (
                    <div style={{ width: "2px", background: "rgba(var(--rgb-255-255-255),0.2)", flexShrink: 0 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ) : null}

        {/* Team logo + name */}
        <div style={{ position: "absolute", bottom: "100px", left: 0, right: 0, height: "100px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "6px", zIndex: 3 }}>
          {championLogoOverride ? (
            <img src={championLogoOverride} alt={championTeamName} style={{ width: "52px", height: "52px", objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(var(--rgb-0-0-0),0.25))" }} />
          ) : (
            <TeamIdentity name={championTeamName} compact plain hideText containerClassName="!size-[52px]" logoClassName="!w-[52px] !h-[52px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]" />
          )}
          <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--brand-ink-pure)", letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center", maxWidth: "420px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {championTeamName}
          </p>
        </div>

        {/* CHAMPIONS label + tournament */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "100px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 3, padding: "0 24px" }}>
          <h2 style={{ fontSize: "46px", fontWeight: 900, color: "var(--brand-ink-pure)", letterSpacing: "-0.02em", lineHeight: 0.9, textTransform: "uppercase", textAlign: "center" }}>
            CHAMPIONS
          </h2>
          <div style={{ marginTop: "6px" }}>
            <span style={{ fontSize: "8px", fontWeight: 700, color: "var(--brand-slate-400)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              {tournament?.name || "Tournament"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useCallback, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Download,
  FileText,
  Image as ImageIcon,
  Medal,
  Newspaper,
  ShieldCheck,
  Table2,
  Trophy,
  Users,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { getTournamentLogo } from "@/lib/tournamentBranding";
import { buildParticipantEntries } from "@/lib/bmps2026Progression";
import { decorateMatchesWithLiveStatus } from "@/lib/liveCalendar";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import { resolveTournamentParticipantState } from "@/lib/tournamentProgression";
import { getTeamLogoByName, isWideTeamLogo } from "@/lib/teamLogos";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import {
  BMPS_2026_FMVP_STATS,
  BMPS_2026_IGL_STATS,
  BMPS_2026_MVP_STATS,
  BMPS_2026_OVERALL_PLAYER_STATS,
} from "@/lib/bmps2026PlayerStats";
import { BMPS_2026_ROSTERS } from "@/lib/bmps2026Rosters";

const POSTER_MODES = [
  { id: "standings", label: "Standings", icon: Table2 },
  { id: "roster", label: "Roster Update", icon: Users },
  { id: "transfer", label: "Transfer", icon: Users },
  { id: "news", label: "News", icon: Newspaper },
  { id: "bestIgl", label: "Best IGL", icon: ShieldCheck },
  { id: "fmvp", label: "FMVP", icon: Award },
  { id: "mvp", label: "MVP", icon: Medal },
  { id: "qualified", label: "Qualified Teams", icon: ShieldCheck },
  { id: "champion", label: "Champion", icon: Trophy },
  { id: "runnerUp", label: "Runner-up", icon: Medal },
  { id: "secondRunnerUp", label: "2nd Runner-up", icon: Medal },
];

const MANUAL_FORM = {
  kicker: "",
  headline: "",
  subhead: "",
  teamName: "",
  playerName: "",
  rosterText: "",
  statOneLabel: "",
  statOneValue: "",
  statTwoLabel: "",
  statTwoValue: "",
  brandLogo: "",
  brandText: "",
};

const POSTER_COLORS = {
  paper: "#fbfcff",
  paperWarm: "#fff8ec",
  ink: "#101827",
  muted: "#657289",
  faint: "#e8edf5",
  navy: "#101827",
  orange: "#ff7a1a",
  red: "#e6113f",
  blue: "#2563eb",
};

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getTeamName(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.teamName || value.team || value.name || value.team_name || "";
}

function getParticipantPlayers(participant) {
  const players = Array.isArray(participant?.players)
    ? participant.players
    : Array.isArray(participant?.player_names)
      ? participant.player_names
      : [];
  return players
    .map((player) =>
      typeof player === "string"
        ? player
        : player?.ign || player?.name || player?.player || "",
    )
    .filter(Boolean);
}

function resolveRosterFromSources(teamName, participantRows) {
  const normalized = normalizeName(teamName);
  if (!normalized) return [];

  const rosterKey = Object.keys(BMPS_2026_ROSTERS || {}).find(
    (key) => key === normalized || key.includes(normalized) || normalized.includes(key),
  );
  if (rosterKey) return BMPS_2026_ROSTERS[rosterKey] || [];

  const participant = participantRows.find((row) => {
    const participantName = normalizeName(row.name);
    return (
      participantName === normalized ||
      participantName.includes(normalized) ||
      normalized.includes(participantName)
    );
  });
  return participant?.roster || [];
}

function getStandingPoints(row) {
  return (
    row?.totalPoints ??
    row?.total_points ??
    row?.points ??
    row?.total ??
    row?.score ??
    0
  );
}

function getStandingFinishes(row) {
  return row?.finishes ?? row?.kills ?? row?.kill_points ?? row?.totalKills ?? 0;
}

function getStandingWins(row) {
  return row?.wins ?? row?.wwcd ?? row?.wins_count ?? 0;
}

function getStandingMatches(row) {
  return row?.matches ?? row?.matchesPlayed ?? row?.matches_played ?? row?.played ?? 0;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function makeInitials(name) {
  const words = String(name || "SC").trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function slugify(value) {
  return String(value || "insta-poster")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function TeamLogo({ teamName, size = 190, muted = false, framed = true }) {
  const logo = getTeamLogoByName(teamName);
  const wide = isWideTeamLogo(teamName);
  const initials = makeInitials(teamName);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(12, size * 0.14),
        display: "grid",
        placeItems: "center",
        background: framed
          ? muted
            ? "#f0f3f8"
            : "#ffffff"
          : "transparent",
        border: framed ? `1px solid ${POSTER_COLORS.faint}` : "0",
        boxShadow: framed ? "0 16px 32px rgba(16,24,39,0.08)" : "none",
        overflow: "hidden",
      }}
    >
      {logo ? (
        <img
          src={logo}
          alt=""
          crossOrigin="anonymous"
          style={{
            width: wide ? "88%" : "74%",
            height: wide ? "58%" : "74%",
            objectFit: "contain",
            filter: muted ? "grayscale(0.85) opacity(0.72)" : "none",
          }}
        />
      ) : (
        <span
          style={{
            color: muted ? "#94a3b8" : POSTER_COLORS.ink,
            fontSize: size * 0.28,
            fontWeight: 950,
            letterSpacing: 0,
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

function PlayerImage({ playerName, teamName }) {
  const photo = getPlayerPhotoByIgn(playerName);
  return (
    <div
      style={{
        position: "relative",
        width: 440,
        height: 520,
        display: "grid",
        placeItems: "end center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "86px 32px 24px",
          borderRadius: 34,
          background:
            "linear-gradient(140deg, rgba(255,122,26,0.14), rgba(37,99,235,0.08))",
          border: `1px solid ${POSTER_COLORS.faint}`,
          transform: "skew(-4deg)",
        }}
      />
      {photo ? (
        <img
          src={photo}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 30px 34px rgba(16,24,39,0.24))",
          }}
        />
      ) : (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: 330,
            height: 430,
            borderRadius: "160px 160px 38px 38px",
            background:
              "linear-gradient(180deg, #ffffff, #eef2f7)",
            border: `1px solid ${POSTER_COLORS.faint}`,
            display: "grid",
            placeItems: "center",
            color: POSTER_COLORS.ink,
            fontSize: 92,
            fontWeight: 950,
          }}
        >
          {makeInitials(playerName || teamName)}
        </div>
      )}
    </div>
  );
}
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   POSTER COMPONENTS â€” matched to q1/q2/q3 reference designs
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const CF = "'Oswald', 'Impact', 'Arial Narrow', sans-serif";
const SF = "'Inter', system-ui, sans-serif";

/* â”€â”€â”€ STANDINGS â€” q2 clean white card + q3 massive headline â”€â”€â”€ */
function StandingsPoster({ tournament, stageName, rows, manual, brandLogo, brandText }) {
  const shown = rows.slice(0, 16);
  const title = manual.headline || stageName || "STANDINGS";
  const isBgms = /bgms|masters\s*series/i.test(tournament?.name);
  const seriesLabel = isBgms ? "MASTERS SERIES" : tournament?.name?.includes("Pro Series") ? "PRO SERIES" : tournament?.name || "TOURNAMENT";
  const callout = manual.subhead || "Finals Recap";
  const ink = "#1a1207";
  const inkDim = "#6b6358";
  const line = "#e8e2da";
  const orange = "#e85d1f";
  const gold = "#c98a1f";
  const silver = "#8a90a0";
  const bronze = "#b06a34";

  return (
    <div className="insta-poster-export" style={{ width: 1080, height: 1350, borderRadius: 22, overflow: "hidden", position: "relative", background: "#fdf8f2", fontFamily: SF, boxShadow: "0 40px 80px -30px rgba(40,20,0,.25)", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(150deg, #e85d1f 0%, #f59e42 100%)", padding: "40px 48px 34px", color: "#fff", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(255,255,255,0.12), transparent)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/images/core-logo.png" alt="Core Esports" style={{ height: 36, width: "auto", objectFit: "contain" }} />
            <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>CORE ESPORTS</span>
          </div>
          <img src={isBgms ? "/images/NODWIN.png" : tournament?.logo || "/images/BGMS.png"} alt={seriesLabel} style={{ height: 40, width: "auto", objectFit: "contain", mixBlendMode: "multiply" }} />
        </div>
        <h1 style={{ margin: "0 0 14px", fontFamily: CF, fontSize: 72, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.015em", textTransform: "uppercase", position: "relative", zIndex: 1, textShadow: "0 2px 12px rgba(0,0,0,.12)" }}>{title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
          <span style={{ display: "inline-flex", alignItems: "center", padding: "8px 16px", borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: orange, background: "#fff" }}>{callout}</span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "rgba(255,255,255,.88)", background: "rgba(255,255,255,.22)", padding: "8px 14px", borderRadius: 999 }}>{shown.length} TEAMS</span>
        </div>
      </div>
      <div style={{ padding: "0 48px", flex: 1, display: "flex", flexDirection: "column" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ width: 52, padding: "18px 0 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: inkDim, textAlign: "center", borderBottom: `1px solid ${line}`, background: "#fdf8f2" }}>#</th>
              <th style={{ textAlign: "left", padding: "18px 0 14px 4px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: inkDim, borderBottom: `1px solid ${line}`, background: "#fdf8f2" }}>TEAM</th>
              <th style={{ width: 90, padding: "18px 4px 14px 0", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: inkDim, textAlign: "right", borderBottom: `1px solid ${line}`, background: "#fdf8f2" }}>PTS</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => {
              const tn = getTeamName(row);
              const rank = row.rank || i + 1;
              const pts = getStandingPoints(row);
              const isTop3 = i < 3;
              const isAlt = i % 2 === 1;
              const podiumColors = [gold, silver, bronze];
              const podiumBgs = [
                "linear-gradient(90deg, #fff3d9, #fff3d9 20%, transparent 80%)",
                "linear-gradient(90deg, #f0f1f5, #f0f1f5 20%, transparent 80%)",
                "linear-gradient(90deg, #fbe9dc, #fbe9dc 20%, transparent 80%)",
              ];
              const chipBgs = [
                "linear-gradient(135deg, #fef3c7, #fde68a)",
                "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
                "linear-gradient(135deg, #fed7aa, #fdba74)",
              ];
              const chipColors = ["#92400e", "#475569", "#9a3412"];
              return (
                <tr key={`${tn}-${i}`} style={{ borderBottom: `1px solid ${line}`, background: isTop3 ? podiumBgs[i] : isAlt ? "#f8f2e9" : "transparent", borderLeft: isTop3 ? `4px solid ${podiumColors[i]}` : "4px solid transparent" }}>
                  <td style={{ padding: "14px 0", textAlign: "center", fontSize: isTop3 ? 26 : 20, fontWeight: 700, color: isTop3 ? ink : inkDim, fontVariantNumeric: "tabular-nums", width: 52 }}>{rank}</td>
                  <td style={{ padding: "14px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: isTop3 ? 56 : 52, height: isTop3 ? 56 : 52, borderRadius: 12, background: "#fff", border: isTop3 ? `2px solid ${podiumColors[i]}` : `1px solid ${line}`, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,.06)", padding: 6 }}>
                        <TeamLogo teamName={tn} size={isTop3 ? 44 : 40} framed={false} />
                      </div>
                      <span style={{ fontSize: isTop3 ? 22 : 20, fontWeight: isTop3 ? 800 : 700, color: ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: isTop3 ? "0.01em" : "-0.01em" }}>{tn}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 4px 14px 0", textAlign: "right" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 56, padding: "8px 16px", borderRadius: 8, fontSize: 20, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em", background: isTop3 ? chipBgs[i] : "#fdece0", color: isTop3 ? chipColors[i] : orange, boxShadow: isTop3 ? `0 2px 6px ${i === 0 ? "rgba(212,175,55,0.25)" : i === 1 ? "rgba(0,0,0,0.06)" : "rgba(205,127,50,0.15)"}` : "none" }}>{pts}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "20px 48px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: inkDim, letterSpacing: "0.06em" }}>{title} — Core Arena</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: inkDim, letterSpacing: "0.06em" }}>CORE ESPORTS © 2026</span>
      </div>
    </div>
  );
}

/* â”€â”€â”€ ROSTER â€” q1-style: team logo hero + player strip on dark bg â”€â”€â”€ */
function RosterPoster({ tournament, teamName, roster, manual, brandLogo, brandText }) {
  return (
    <div className="insta-poster-export" style={{ width: 1080, height: 1350, borderRadius: 28, overflow: "hidden", position: "relative", background: "linear-gradient(170deg, #0d1117 0%, #161b22 100%)", color: "#fff", fontFamily: SF }}>
      <div style={{ position: "absolute", top: -80, right: -80, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,0,0.08), transparent 70%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg, #ff6b00, #ff6b00 50%, transparent)" }} />
      <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "40px 48px 36px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={brandLogo || "/images/core-logo.svg"} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", fontFamily: CF, textTransform: "uppercase" }}>{brandText || (brandLogo ? "" : "CORE")}</span>
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 90, height: 90, borderRadius: 22, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "grid", placeItems: "center", overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.3)" }}>
            <TeamLogo teamName={teamName} size={72} framed={false} />
          </div>
          <div>
            <p style={{ margin: 0, fontFamily: CF, color: "#ff6b00", fontSize: 14, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>{manual.subhead || "ROSTER"}</p>
            <h1 style={{ margin: "2px 0 0", fontFamily: CF, fontSize: 72, fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.01em" }}>{manual.headline || teamName || "TEAM"}</h1>
          </div>
        </div>
        <div style={{ flex: 1, marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignContent: "start" }}>
          {roster.slice(0, 6).map((player, i) => {
            const photo = getPlayerPhotoByIgn(player);
            return (
              <div key={`${player}-${i}`} style={{ height: 140, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 12, position: "relative" }}>
                <div style={{ position: "absolute", top: 8, left: 8, width: 26, height: 26, borderRadius: "50%", background: i === 0 ? "#ff6b00" : "rgba(255,255,255,0.06)", display: "grid", placeItems: "center" }}>
                  <span style={{ color: i === 0 ? "#fff" : "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 700, fontFamily: CF }}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                {photo ? (
                  <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,0.08)" }}>
                    <img src={photo} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,107,0,0.15), rgba(255,107,0,0.03))", border: "1px solid rgba(255,107,0,0.1)", display: "grid", placeItems: "center" }}>
                    <span style={{ color: "#ff6b00", fontSize: 20, fontWeight: 700, fontFamily: CF }}>{makeInitials(player)}</span>
                  </div>
                )}
                <span style={{ marginTop: 6, fontSize: 14, fontWeight: 800, textTransform: "uppercase", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%", letterSpacing: "0.02em" }}>{player}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ NEWS â€” q1-style full-bleed image + gradient + overlaid headline â”€â”€â”€ */
function NewsPoster({ tournament, article, manual, brandLogo, brandText }) {
  const hasImg = !!article?.thumbnail_url;
  return (
    <div className="insta-poster-export" style={{ width: 1080, height: 1350, borderRadius: 28, overflow: "hidden", position: "relative", background: "#111", color: "#fff", fontFamily: SF }}>
      {hasImg ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <img src={article.thumbnail_url} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #111, #1a2744)" }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.88) 100%)" }} />
      <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "40px 48px 36px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={brandLogo || "/images/core-logo.svg"} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain", background: "rgba(0,0,0,0.3)", padding: 4 }} />
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", fontFamily: CF, textTransform: "uppercase" }}>{brandText || (brandLogo ? "" : "CORE")}</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <span style={{ display: "inline-block", alignSelf: "flex-start", padding: "5px 14px", borderRadius: 6, background: "#ff6b00", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", fontFamily: CF, textTransform: "uppercase", marginBottom: 10 }}>{manual.kicker || article?.category || "BREAKING"}</span>
          <h1 style={{ margin: 0, fontFamily: CF, fontSize: 76, fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.01em", textTransform: "uppercase", textShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>{manual.headline || article?.title || "BREAKING STORY"}</h1>
          <p style={{ margin: "10px 0 0", color: "rgba(255,255,255,0.6)", fontSize: 20, lineHeight: 1.3, fontWeight: 500, maxWidth: 680 }}>{manual.subhead || article?.summary || article?.ai_summary || ""}</p>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 3, borderRadius: 2, background: "#ff6b00" }} />
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>{article?.source_name || "StageCore"}{article?.created_date ? ` \u00B7 ${formatDate(article.created_date)}` : ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ PLAYER AWARD (IGL/FMVP/MVP) â€” q1-style full-bleed player photo + massive name â”€â”€â”€ */
function PlayerAwardPoster({ tournament, awardLabel, player, manual, brandLogo, brandText }) {
  const pn = manual.playerName || player?.player || "";
  const tn = manual.teamName || player?.teamName || "";
  const s1l = manual.statOneLabel || (awardLabel === "Best IGL" ? "IGL RATING" : "FINISHES");
  const s1v = manual.statOneValue || player?.iglRating || player?.finishes || "0";
  const s2l = manual.statTwoLabel || (awardLabel === "Best IGL" ? "TOP 5s" : "DAMAGE");
  const s2v = manual.statTwoValue || player?.top5s || player?.damage || "0";
  const isIGL = awardLabel === "Best IGL";
  const accent = isIGL ? "#06b6d4" : "#ff6b00";
  const photo = getPlayerPhotoByIgn(pn);
  return (
    <div className="insta-poster-export" style={{ width: 1080, height: 1350, borderRadius: 28, overflow: "hidden", position: "relative", background: "#111", color: "#fff", fontFamily: SF }}>
      {photo ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <img src={photo} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${accent}30, #111)` }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${accent}20, transparent 35%)` }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.92) 100%)" }} />
      <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "40px 48px 36px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={brandLogo || "/images/core-logo.svg"} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain", background: "rgba(0,0,0,0.3)", padding: 4 }} />
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", fontFamily: CF, textTransform: "uppercase" }}>{brandText || (brandLogo ? "" : "CORE")}</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <span style={{ display: "inline-block", alignSelf: "flex-start", padding: "6px 16px", borderRadius: 8, background: accent, boxShadow: `0 6px 20px ${accent}50`, marginBottom: 10, fontFamily: CF, fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>{manual.kicker || awardLabel}</span>
          <h1 style={{ margin: 0, fontFamily: CF, fontSize: 100, fontWeight: 700, lineHeight: 0.88, letterSpacing: "-0.01em", textTransform: "uppercase", textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}>{manual.headline || pn || "PLAYER"}</h1>
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <TeamLogo teamName={tn} size={24} />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{tn}</span>
          </div>
          <p style={{ margin: "4px 0 0", fontFamily: CF, color: accent, fontSize: 14, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>{manual.subhead || `${awardLabel} OF THE TOURNAMENT`}</p>
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[[s1l, s1v], [s2l, s2v]].map(([l, v]) => (
              <div key={l} style={{ padding: "12px 16px", borderRadius: 14, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", fontFamily: CF, textTransform: "uppercase" }}>{l}</span>
                <span style={{ fontFamily: CF, fontSize: 32, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ QUALIFIED â€” q2 floating cards + q3 massive headline â”€â”€â”€ */
function QualifiedPoster({ tournament, stageName, rows, manual, brandLogo, brandText }) {
  const shown = rows.slice(0, 16);
  return (
    <div className="insta-poster-export" style={{ width: 1080, height: 1350, borderRadius: 28, overflow: "hidden", position: "relative", background: "#f5f5f7", color: "#111", fontFamily: SF }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 28px, rgba(0,0,0,0.018) 28px, rgba(0,0,0,0.018) 29px)" }} />
      <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "40px 48px 36px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={brandLogo || "/images/core-logo.svg"} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
            <span style={{ color: "#999", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", fontFamily: CF, textTransform: "uppercase" }}>{brandText || (brandLogo ? "" : "CORE")}</span>
          </div>
        </div>
        <h1 style={{ margin: "16px 0 0", fontFamily: CF, fontSize: 120, fontWeight: 700, lineHeight: 0.88, letterSpacing: "-0.02em", textTransform: "uppercase" }}>{manual.headline || "QUALIFIED"}</h1>
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#16a34a" }} />
          <span style={{ color: "#999", fontSize: 13, fontWeight: 600, letterSpacing: "0.16em", fontFamily: CF, textTransform: "uppercase" }}>{manual.subhead || `${stageName || "NEXT STAGE"} CONTENDERS`}</span>
        </div>
        <div style={{ flex: 1, marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, alignContent: "start" }}>
          {shown.map((row, i) => {
            const tn = getTeamName(row);
            const top = i < 4;
            return (
              <div key={`${tn}-${i}`} style={{ height: 140, borderRadius: 18, background: "#fff", boxShadow: top ? "0 12px 32px rgba(22,163,74,0.1), 0 0 0 2px rgba(22,163,74,0.12)" : "0 4px 16px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 10, position: "relative" }}>
                {top && <div style={{ position: "absolute", top: -5, right: -5, width: 22, height: 22, borderRadius: "50%", background: "#16a34a", display: "grid", placeItems: "center" }}><span style={{ color: "#fff", fontSize: 10, fontWeight: 700, fontFamily: CF }}>{i + 1}</span></div>}
                <TeamLogo teamName={tn} size={48} framed={false} />
                <div style={{ marginTop: 5, fontFamily: CF, fontSize: 13, fontWeight: 700, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tn}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ PLACEMENT (Champion/RunnerUp/2ndRunnerUp) â€” q3-style MASSIVE type filling width + centered logo â”€â”€â”€ */
function PlacementPoster({ tournament, teamName, placeLabel, headline, accent, manual, brandLogo, brandText }) {
  const isChamp = placeLabel === "Champions";
  return (
    <div className="insta-poster-export" style={{ width: 1080, height: 1350, borderRadius: 28, overflow: "hidden", position: "relative", background: "#fff", fontFamily: SF }}>
      {/* Accent bar top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: accent }} />
      {/* Subtle texture */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 28px, rgba(0,0,0,0.012) 28px, rgba(0,0,0,0.012) 29px)" }} />
      {/* Giant faded rank number */}
      <div style={{ position: "absolute", top: 80, right: 40, fontFamily: CF, fontSize: 400, fontWeight: 700, color: `${accent}08`, lineHeight: 0.8, letterSpacing: "-0.04em" }}>
        {isChamp ? "1" : placeLabel === "2nd Place" ? "2" : "3"}
      </div>
      <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "40px 48px 36px", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={brandLogo || "/images/core-logo.svg"} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
            <span style={{ color: "#999", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", fontFamily: CF, textTransform: "uppercase" }}>{brandText || (brandLogo ? "" : "CORE")}</span>
          </div>
          <span style={{ display: "inline-block", padding: "8px 20px", borderRadius: 10, background: accent, fontFamily: CF, fontSize: 14, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#fff", boxShadow: `0 8px 24px ${accent}30` }}>{manual.kicker || placeLabel}</span>
        </div>
        {/* Center content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          {/* Team logo in diamond frame */}
          <div style={{ position: "relative", marginBottom: 32 }}>
            <div style={{ width: 280, height: 280, borderRadius: 40, background: `${accent}06`, border: `3px solid ${accent}15`, display: "grid", placeItems: "center", boxShadow: `0 32px 64px ${accent}10`, transform: "rotate(45deg)" }}>
              <div style={{ transform: "rotate(-45deg)" }}>
                <TeamLogo teamName={teamName} size={180} framed={false} />
              </div>
            </div>
            {/* Crown icon for champion */}
            {isChamp && (
              <div style={{ position: "absolute", top: -28, left: "50%", transform: "translateX(-50%)", width: 56, height: 56, borderRadius: "50%", background: accent, display: "grid", placeItems: "center", boxShadow: `0 8px 24px ${accent}40` }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/></svg>
              </div>
            )}
          </div>
          {/* Headline */}
          <h1 style={{ margin: 0, fontFamily: CF, fontSize: isChamp ? 140 : 110, fontWeight: 700, lineHeight: 0.85, letterSpacing: "-0.03em", textTransform: "uppercase", color: accent }}>{manual.headline || headline}</h1>
          {/* Team name */}
          <div style={{ marginTop: 16, padding: "10px 32px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{manual.teamName || teamName || "SELECT A TEAM"}</span>
          </div>
        </div>
        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", fontFamily: CF, textTransform: "uppercase" }}>Grand Finals · {tournament?.name || "PEL 2026"}</span>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ TRANSFER â€” q1-style player photo bg + fromâ†’to with team logos â”€â”€â”€ */
function TransferPoster({ tournament, manual, brandLogo, brandText }) {
  const pn = manual.playerName || "PLAYER NAME";
  const from = manual.teamName || "FORMER TEAM";
  const to = manual.subhead || "NEW TEAM";
  const photo = getPlayerPhotoByIgn(pn);
  return (
    <div className="insta-poster-export" style={{ width: 1080, height: 1350, borderRadius: 28, overflow: "hidden", position: "relative", background: "#0d1117", color: "#fff", fontFamily: SF }}>
      {photo ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <img src={photo} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #1a2744, #0d1117, #2a1a0d)" }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.92) 100%)" }} />
      <div style={{ position: "relative", zIndex: 1, height: "100%", padding: "40px 48px 36px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={brandLogo || "/images/core-logo.svg"} alt="" crossOrigin="anonymous" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain", background: "rgba(0,0,0,0.3)", padding: 4 }} />
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", fontFamily: CF, textTransform: "uppercase" }}>{brandText || (brandLogo ? "" : "CORE")}</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <span style={{ display: "inline-block", alignSelf: "flex-start", padding: "6px 16px", borderRadius: 8, background: "#ff6b00", boxShadow: "0 6px 20px rgba(255,107,0,0.35)", marginBottom: 10, fontFamily: CF, fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>{manual.kicker || "TRANSFER"}</span>
          <h1 style={{ margin: 0, fontFamily: CF, fontSize: 80, fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.01em", textTransform: "uppercase", textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}>{manual.headline || "PLAYER TRANSFER"}</h1>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 44px 1fr", alignItems: "center", gap: 8 }}>
            <div style={{ padding: "16px 12px", borderRadius: 18, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", fontFamily: CF, textTransform: "uppercase" }}>FROM</p>
              <div style={{ margin: "8px auto", width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,0.04)", display: "grid", placeItems: "center", overflow: "hidden" }}>
                <TeamLogo teamName={from} size={50} framed={false} />
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em" }}>{from}</p>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #ff6b00)", display: "grid", placeItems: "center", boxShadow: "0 6px 20px rgba(255,107,0,0.25)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
            <div style={{ padding: "16px 12px", borderRadius: 18, background: "rgba(255,107,0,0.1)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,107,0,0.12)", textAlign: "center" }}>
              <p style={{ margin: 0, color: "#ff6b00", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", fontFamily: CF, textTransform: "uppercase" }}>TO</p>
              <div style={{ margin: "8px auto", width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,0.06)", display: "grid", placeItems: "center", overflow: "hidden" }}>
                <TeamLogo teamName={to} size={50} framed={false} />
              </div>
              <p style={{ margin: "4px 0 0", color: "#ff6b00", fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em" }}>{to}</p>
            </div>
          </div>
          <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
            <div style={{ padding: "10px 32px", borderRadius: 14, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontFamily: CF, fontSize: 44, fontWeight: 700, letterSpacing: "-0.01em", textTransform: "uppercase" }}>{pn}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminInstaPosters() {
  const [mode, setMode] = useState("standings");
  const [manual, setManual] = useState(MANUAL_FORM);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [selectedStageName, setSelectedStageName] = useState("");
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [selectedPlayerKey, setSelectedPlayerKey] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const posterRef = useRef(null);
  const { toast } = useToast();

  const { data: tournaments = [] } = useQuery({
    queryKey: ["admin-insta-tournaments"],
    queryFn: () => base44.entities.Tournament.list("-start_date", 50),
  });

  const activeTournament = useMemo(
    () =>
      tournaments.find((t) => t.id === selectedTournamentId) ||
      tournaments[0] ||
      null,
    [tournaments, selectedTournamentId],
  );

  const { data: normalizedData } = useQuery({
    queryKey: ["admin-insta-normalized", activeTournament?.id],
    queryFn: () => base44.entities.Tournament.get(activeTournament.id),
    enabled: Boolean(activeTournament?.id),
  });

  const normalizedTournament = useMemo(() => {
    const ntd = normalizedData || activeTournament;
    if (!ntd) return null;
    return {
      ...ntd,
      name: ntd.name || ntd.tournament?.name || "Tournament",
      stages: ntd.tournament?.stages || activeTournament?.stages || [],
    };
  }, [activeTournament, normalizedData]);

  const { data: teams = [] } = useQuery({
    queryKey: ["admin-insta-teams"],
    queryFn: () => base44.entities.Team.list("-total_points", 500),
  });

  const { data: newsArticles = [] } = useQuery({
    queryKey: ["admin-insta-news"],
    queryFn: () => base44.entities.NewsArticle.list("-created_date", 30),
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["admin-insta-matches", activeTournament?.id],
    queryFn: () =>
      base44.entities.Match.filter({ tournament_id: activeTournament.id }, "-scheduled_time", 500),
    enabled: Boolean(activeTournament?.id),
  });

  const { data: rawMatchResults = [] } = useQuery({
    queryKey: ["admin-insta-results", activeTournament?.id],
    queryFn: () =>
      base44.entities.MatchResult.filter({ tournament_id: activeTournament.id }, "-created_date", 5000),
    enabled: Boolean(activeTournament?.id),
  });

  const matchResults = useMemo(
    () => filterPublishedMatchResults(rawMatchResults),
    [rawMatchResults],
  );

  const participantState = useMemo(() => {
    if (!normalizedTournament) return { participantEntries: [], stageBoards: [] };
    const calendarMatches = decorateMatchesWithLiveStatus(matches, matchResults);
    return resolveTournamentParticipantState({
      tournament: normalizedTournament,
      teams,
      matches: calendarMatches,
      matchResults,
      participantEntries: buildParticipantEntries(normalizedTournament),
      stageNames: (normalizedTournament.stages || []).flatMap((stage) =>
        stage?.name ? [stage.name] : [],
      ),
    });
  }, [matchResults, matches, normalizedTournament, teams]);

  const stageBoards = participantState.stageBoards || [];
  const activeStage = useMemo(() => {
    if (selectedStageName) {
      return stageBoards.find((stage) => stage.name === selectedStageName) || null;
    }
    return stageBoards[stageBoards.length - 1] || stageBoards[0] || null;
  }, [selectedStageName, stageBoards]);

  const standingsRows = useMemo(
    () =>
      (activeStage?.standings || [])
        .toSorted((left, right) => (left.rank || 999) - (right.rank || 999)),
    [activeStage],
  );

  const participantRows = useMemo(() => {
    const map = new Map();
    for (const participant of normalizedTournament?.participants || []) {
      const name = getTeamName(participant);
      if (name) map.set(normalizeName(name), { name, roster: getParticipantPlayers(participant) });
    }
    for (const entry of participantState.participantEntries || []) {
      const name = getTeamName(entry);
      if (!name || map.has(normalizeName(name))) continue;
      map.set(normalizeName(name), { name, roster: getParticipantPlayers(entry) });
    }
    for (const team of teams) {
      const name = team?.name || team?.team || "";
      if (!name || map.has(normalizeName(name))) continue;
      map.set(normalizeName(name), { name, roster: [] });
    }
    return [...map.values()].sort((left, right) => left.name.localeCompare(right.name));
  }, [normalizedTournament?.participants, participantState.participantEntries, teams]);

  const activeTeamName = manual.teamName || selectedTeamName || standingsRows[0]?.teamName || participantRows[0]?.name || "";

  const activeRoster = useMemo(() => {
    const manualRoster = manual.rosterText
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (manualRoster.length) return manualRoster;
    const resolvedRoster = resolveRosterFromSources(activeTeamName, participantRows);
    return resolvedRoster.length
      ? resolvedRoster
      : ["Player One", "Player Two", "Player Three", "Player Four", "Player Five"];
  }, [activeTeamName, manual.rosterText, participantRows]);

  const playerOptions = useMemo(() => {
    if (mode === "bestIgl") return BMPS_2026_IGL_STATS;
    if (mode === "fmvp") return BMPS_2026_FMVP_STATS;
    if (mode === "mvp") return BMPS_2026_MVP_STATS;
    return BMPS_2026_OVERALL_PLAYER_STATS.slice(0, 30);
  }, [mode]);

  const activePlayer = useMemo(() => {
    if (selectedPlayerKey) {
      const [playerName, teamName] = selectedPlayerKey.split("::");
      return (
        playerOptions.find(
          (player) =>
            normalizeName(player.player) === playerName &&
            normalizeName(player.teamName) === teamName,
        ) || playerOptions[0]
      );
    }
    return playerOptions[0] || null;
  }, [playerOptions, selectedPlayerKey]);

  const activeArticle = useMemo(() => {
    if (selectedArticleId) {
      return newsArticles.find((article) => article.id === selectedArticleId) || newsArticles[0] || null;
    }
    return newsArticles[0] || null;
  }, [newsArticles, selectedArticleId]);

  const podiumTeam = useMemo(() => {
    const indexByMode = { champion: 0, runnerUp: 1, secondRunnerUp: 2 };
    const podiumIndex = indexByMode[mode] ?? 0;
    return manual.teamName || selectedTeamName || standingsRows[podiumIndex]?.teamName || standingsRows[0]?.teamName || activeTeamName;
  }, [activeTeamName, manual.teamName, mode, selectedTeamName, standingsRows]);

  const renderPoster = () => {
    const brandProps = { brandLogo: manual.brandLogo, brandText: manual.brandText };
    if (mode === "standings") {
      return (
        <StandingsPoster
          tournament={normalizedTournament}
          stageName={activeStage?.name}
          rows={standingsRows}
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "roster") {
      return (
        <RosterPoster
          tournament={normalizedTournament}
          teamName={activeTeamName}
          roster={activeRoster}
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "transfer") {
      return (
        <TransferPoster
          tournament={normalizedTournament}
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "news") {
      return <NewsPoster tournament={normalizedTournament} article={activeArticle} manual={manual} {...brandProps} />;
    }
    if (mode === "bestIgl") {
      return (
        <PlayerAwardPoster
          tournament={normalizedTournament}
          awardLabel="Best IGL"
          player={activePlayer}
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "fmvp") {
      return (
        <PlayerAwardPoster
          tournament={normalizedTournament}
          awardLabel="FMVP"
          player={activePlayer}
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "mvp") {
      return (
        <PlayerAwardPoster
          tournament={normalizedTournament}
          awardLabel="MVP"
          player={activePlayer}
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "qualified") {
      return (
        <QualifiedPoster
          tournament={normalizedTournament}
          stageName={activeStage?.name}
          rows={standingsRows}
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "runnerUp") {
      return (
        <PlacementPoster
          tournament={normalizedTournament}
          teamName={podiumTeam}
          placeLabel="2nd Place"
          headline="RUNNER-UP"
          accent="#cbd5e1"
          manual={manual}
          {...brandProps}
        />
      );
    }
    if (mode === "secondRunnerUp") {
      return (
        <PlacementPoster
          tournament={normalizedTournament}
          teamName={podiumTeam}
          placeLabel="3rd Place"
          headline="2ND RUNNER-UP"
          accent="#f59e0b"
          manual={manual}
          {...brandProps}
        />
      );
    }
    return (
      <PlacementPoster
        tournament={normalizedTournament}
        teamName={podiumTeam}
        placeLabel="Champions"
        headline="CHAMPIONS"
        accent="#facc15"
        manual={manual}
        {...brandProps}
      />
    );
  };

  const handleDownload = useCallback(async () => {
    const el = posterRef.current?.querySelector(".insta-poster-export");
    if (!el || isDownloading) return;
    setIsDownloading(true);
    try {
      await document.fonts.ready;

      const clone = el.cloneNode(true);
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = "1080px";
      clone.style.height = "1350px";
      clone.style.zIndex = "-1";
      clone.style.margin = "0";
      document.body.appendChild(clone);

      const originalElements = [el, ...el.querySelectorAll("*")];
      const cloneElements = [clone, ...clone.querySelectorAll("*")];
      for (let i = 0; i < originalElements.length && i < cloneElements.length; i += 1) {
        try {
          const computed = window.getComputedStyle(originalElements[i]);
          for (let j = 0; j < computed.length; j += 1) {
            const prop = computed[j];
            const value = computed.getPropertyValue(prop);
            if (value) cloneElements[i].style.setProperty(prop, value);
          }
        } catch {
          // Some browser-generated nodes can be skipped safely during export.
        }
      }

      let dataUrl;
      try {
        dataUrl = await toPng(clone, {
          width: 1080,
          height: 1350,
          pixelRatio: 1,
          backgroundColor: POSTER_COLORS.paper,
          cacheBust: true,
        });
      } finally {
        document.body.removeChild(clone);
      }

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${slugify(mode)}-${slugify(activeStage?.name || podiumTeam || activePlayer?.player || activeArticle?.title)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Insta poster export failed:", error);
      toast({
        title: "Poster export failed",
        description: error?.message || "Try again after images finish loading.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [activeArticle?.title, activePlayer?.player, activeStage?.name, isDownloading, mode, podiumTeam, toast]);

  const activeMode = POSTER_MODES.find((item) => item.id === mode) || POSTER_MODES[0];
  const ActiveModeIcon = activeMode.icon;

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Insta module
            </p>
            <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em]">
              Individual Stage Posters
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Generate 4:5 social posters for standings, roster changes, news,
              player awards, qualified teams, and podium placements.
            </p>
          </div>
          <Button type="button" onClick={handleDownload} disabled={isDownloading} className="gap-2">
            <Download className="size-4" />
            {isDownloading ? "Exporting..." : "Download PNG"}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4 rounded-[24px] border border-border bg-card p-5 shadow-sm">
          <div>
            <Label>Poster Type</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSTER_MODES.map((posterMode) => (
                  <SelectItem key={posterMode.id} value={posterMode.id}>
                    {posterMode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label>Tournament</Label>
              <Select value={activeTournament?.id || ""} onValueChange={setSelectedTournamentId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select tournament" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Stage / Board</Label>
              <Select value={activeStage?.name || ""} onValueChange={setSelectedStageName}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stageBoards.map((stage) => (
                    <SelectItem key={stage.name} value={stage.name}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {["roster", "champion", "runnerUp", "secondRunnerUp", "transfer"].includes(mode) ? (
            <div>
              <Label>Team</Label>
              <Select value={selectedTeamName} onValueChange={setSelectedTeamName}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Auto from standings" />
                </SelectTrigger>
                <SelectContent>
                  {participantRows.map((team) => (
                    <SelectItem key={team.name} value={team.name}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">Brand Logo (Top Left)</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Logo</Label>
                <Select value={manual.brandLogo || "core-default"} onValueChange={(v) => setManual((prev) => ({ ...prev, brandLogo: v === "core-default" ? "" : v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Core Esports" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core-default">Core Esports</SelectItem>
                    <SelectItem value="/images/Krafton.png">Krafton</SelectItem>
                    <SelectItem value="/images/pubg-mobile-world-cup-2026.webp">PUBG Mobile</SelectItem>
                    <SelectItem value="/images/Tencent Games.png">Tencent Games</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Brand Text Override</Label>
                <Input
                  value={manual.brandText}
                  onChange={(event) => setManual((prev) => ({ ...prev, brandText: event.target.value }))}
                  placeholder="Leave empty for default"
                />
              </div>
            </div>
          </div>

          {["bestIgl", "fmvp", "mvp"].includes(mode) ? (
            <div>
              <Label>Player</Label>
              <Select value={selectedPlayerKey} onValueChange={setSelectedPlayerKey}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Top ranked player" />
                </SelectTrigger>
                <SelectContent>
                  {playerOptions.map((player) => (
                    <SelectItem
                      key={`${player.player}-${player.teamName}`}
                      value={`${normalizeName(player.player)}::${normalizeName(player.teamName)}`}
                    >
                      {player.player} / {player.teamName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {mode === "news" ? (
            <div>
              <Label>Article</Label>
              <Select value={activeArticle?.id || ""} onValueChange={setSelectedArticleId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select article" />
                </SelectTrigger>
                <SelectContent>
                  {newsArticles.map((article) => (
                    <SelectItem key={article.id} value={article.id}>
                      {article.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ActiveModeIcon className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">{activeMode.label} Overrides</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Kicker</Label>
                <Input
                  value={manual.kicker}
                  onChange={(event) => setManual((prev) => ({ ...prev, kicker: event.target.value }))}
                  placeholder="Optional top label"
                />
              </div>
              <div>
                <Label>Headline</Label>
                <Input
                  value={manual.headline}
                  onChange={(event) => setManual((prev) => ({ ...prev, headline: event.target.value }))}
                  placeholder="Optional main headline"
                />
              </div>
              <div>
                <Label>Subhead</Label>
                <Input
                  value={manual.subhead}
                  onChange={(event) => setManual((prev) => ({ ...prev, subhead: event.target.value }))}
                  placeholder="Optional supporting line"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Stat Label</Label>
                  <Input
                    value={manual.statOneLabel}
                    onChange={(event) => setManual((prev) => ({ ...prev, statOneLabel: event.target.value }))}
                    placeholder="Finishes"
                  />
                </div>
                <div>
                  <Label>Stat Value</Label>
                  <Input
                    value={manual.statOneValue}
                    onChange={(event) => setManual((prev) => ({ ...prev, statOneValue: event.target.value }))}
                    placeholder="Auto"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Stat Label</Label>
                  <Input
                    value={manual.statTwoLabel}
                    onChange={(event) => setManual((prev) => ({ ...prev, statTwoLabel: event.target.value }))}
                    placeholder="Damage"
                  />
                </div>
                <div>
                  <Label>Stat Value</Label>
                  <Input
                    value={manual.statTwoValue}
                    onChange={(event) => setManual((prev) => ({ ...prev, statTwoValue: event.target.value }))}
                    placeholder="Auto"
                  />
                </div>
              </div>
              <div>
                <Label>Manual Team</Label>
                <Input
                  value={manual.teamName}
                  onChange={(event) => setManual((prev) => ({ ...prev, teamName: event.target.value }))}
                  placeholder="Overrides selected team"
                />
              </div>
              <div>
                <Label>Manual Player</Label>
                <Input
                  value={manual.playerName}
                  onChange={(event) => setManual((prev) => ({ ...prev, playerName: event.target.value }))}
                  placeholder="Overrides selected player"
                />
              </div>
              <div>
                <Label>Roster Override</Label>
                <Textarea
                  rows={4}
                  value={manual.rosterText}
                  onChange={(event) => setManual((prev) => ({ ...prev, rosterText: event.target.value }))}
                  placeholder="One player per line, or comma-separated"
                />
              </div>
              <Button type="button" variant="outline" className="w-full gap-2" onClick={() => setManual(MANUAL_FORM)}>
                <FileText className="size-4" />
                Clear Overrides
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">4:5 Preview</h3>
              <p className="text-xs text-muted-foreground">
                Export target is 1080 x 1350 PNG.
              </p>
            </div>
            <div className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
              {activeMode.label}
            </div>
          </div>
          <div ref={posterRef} className="overflow-auto rounded-2xl bg-secondary/40 p-4">
            <div style={{ width: 432, height: 540, transform: "scale(0.4)", transformOrigin: "top left" }}>
              {renderPoster()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

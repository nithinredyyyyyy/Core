import React from "react";
import { Download, ChevronDown } from "lucide-react";
import { getTournamentMvpData, getTournamentFmvpData } from "./posterMvpHelpers";

export default function PosterControls({
  activeOption, posterOptions, onSelectOption,
  posterMode, onPosterModeChange,
  posterTeams, standingsRows, onDownload, isDownloading,
  posterTournaments, selectedTournamentId, onSelectTournament, teams,
  newsArticles = [], selectedNewsIndex, onSelectNews,
  normalizedTournament, playerTeamMap = {},
  customConfig, onCustomConfigChange,
}) {
  return (
    <div className="space-y-4">
      {posterTournaments.length > 1 && (
        <div className="rounded-[20px] border border-border bg-secondary/35 p-4">
          <label htmlFor="poster-tournament-select" className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Tournament
          </label>
          <div className="relative mt-2">
            <select
              id="poster-tournament-select"
              value={selectedTournamentId || ""}
              onChange={(e) => onSelectTournament(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-10 text-sm text-foreground outline-none focus:border-primary/40"
            >
              {posterTournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      )}

      {!["mvp", "fmvp", "igl", "support", "rookie", "eagle_eye", "grenade_master", "field_medic", "best_clutch", "eliminator", "podium", "top5mvp", "news", "custom"].includes(posterMode) && (
        <div className="rounded-[20px] border border-border bg-secondary/35 p-4">
          <label htmlFor="poster-stage-select" className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Stage group
          </label>
          <div className="relative mt-2">
            <select
              id="poster-stage-select"
              value={activeOption?.key || ""}
              onChange={(e) => onSelectOption(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-10 text-sm text-foreground outline-none focus:border-primary/40"
            >
              {posterOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      )}

      {posterMode === "news" && (
        <div className="rounded-[20px] border border-border bg-secondary/35 p-4">
          <label htmlFor="poster-news-select" className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            News Article
          </label>
          <div className="relative mt-2">
            <select
              id="poster-news-select"
              value={selectedNewsIndex}
              onChange={(e) => onSelectNews(Number(e.target.value))}
              className="h-11 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-10 text-sm text-foreground outline-none focus:border-primary/40"
            >
              {newsArticles.map((article, i) => (
                <option key={article.id || i} value={i}>
                  {article.title || `Article ${i + 1}`}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      )}

      <div className="rounded-[20px] border border-border bg-secondary/35 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Output</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["grid", "Grid"],
            ["standings", "Standings"],
            ["podium", "Podium"],
            ["mvp", "MVP"],
            ["fmvp", "FMVP"],
            ["top5mvp", "Top 5 MVP"],
            ["igl", "Best IGL"],
            ["support", "Best Support"],
            ["rookie", "Rookie"],
            ["eagle_eye", "Eagle Eye"],
            ["grenade_master", "Grenade Master"],
            ["field_medic", "Field Medic"],
            ["best_clutch", "Best Clutch"],
            ["eliminator", "The Eliminator"],
            ["news", "News"],
            ["custom", "Custom"],
          ].map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onPosterModeChange(mode)}
              className={`rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-[0.12em] transition-all ${
                posterMode === mode
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "border border-border bg-background text-muted-foreground hover:border-primary/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {posterMode !== "mvp" && posterMode !== "fmvp" && posterMode !== "igl" && posterMode !== "support" && posterMode !== "rookie" && posterMode !== "eagle_eye" && posterMode !== "grenade_master" && posterMode !== "field_medic" && posterMode !== "best_clutch" && posterMode !== "eliminator" && posterMode !== "podium" && posterMode !== "custom" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[20px] border border-border bg-secondary/35 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Teams</p>
            <p className="mt-1 text-2xl font-black text-foreground">{posterTeams.length}</p>
          </div>
          <div className="rounded-[20px] border border-border bg-secondary/35 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Rows</p>
            <p className="mt-1 text-2xl font-black text-foreground">{standingsRows.length}</p>
          </div>
        </div>
      )}

      {posterMode === "mvp" && (() => {
        const mvpData = getTournamentMvpData(normalizedTournament, playerTeamMap)[0];
        return (
          <div className="rounded-[20px] border border-border bg-secondary/35 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Player</p>
            <p className="mt-1 text-lg font-black text-foreground">{mvpData?.player}</p>
            <p className="text-xs text-muted-foreground">{mvpData?.teamName}</p>
          </div>
        );
      })()}

      {posterMode === "fmvp" && (() => {
        const fmvpData = getTournamentFmvpData(normalizedTournament, playerTeamMap)?.[0];
        return (
          <div className="rounded-[20px] border border-border bg-secondary/35 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Finals MVP</p>
            <p className="mt-1 text-lg font-black text-foreground">{fmvpData?.player}</p>
            <p className="text-xs text-muted-foreground">{fmvpData?.teamName}</p>
          </div>
        );
      })()}

      {posterMode === "podium" && (
        <div className="rounded-[20px] border border-border bg-secondary/35 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary text-center">Top 3 Teams</p>
          <div className="mt-2 space-y-2">
            {standingsRows.slice(0, 3).map((row, i) => {
              const team = teams.find(t => t.name?.toLowerCase() === row.teamName?.toLowerCase());
              const roster = team?.players || team?.roster || [];
              return (
                <div key={row.teamId || row.teamName} className="rounded-lg border border-border bg-background p-2">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <span className="font-bold">{["🥇","🥈","🥉"][i]}</span>
                    <span className="font-bold truncate">{row.teamName}</span>
                    <span className="ml-auto font-black text-primary">{row.points || 0}</span>
                  </div>
                  {roster.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {roster.slice(0, 5).map((p, pi) => {
                        const name = typeof p === "string" ? p : p.name || p.ign || p.id;
                        return <span key={pi} className="text-[9px] text-muted-foreground">{name}{pi < Math.min(roster.length, 5) - 1 ? "," : ""}</span>;
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {posterMode === "custom" && (
        <div className="rounded-[20px] border border-border bg-secondary/35 p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Custom Poster</p>

          {[
            ["title", "Headline", "text"],
            ["tag", "Tag", "text"],
            ["subtitle", "Subline", "text"],
            ["playerName", "Player Name", "text"],
            ["teamName", "Team Name", "text"],
          ].map(([key, label, type]) => (
            <div key={key} className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground">{label}</label>
              <input
                type={type}
                value={customConfig?.[key] || ""}
                onChange={(e) => onCustomConfigChange({ ...customConfig, [key]: e.target.value })}
                placeholder={label}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40 placeholder:text-muted-foreground/40"
              />
            </div>
          ))}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Brand Logo (Top Left)</p>
            <div className="space-y-2">
              <select
                value={customConfig?.brandLogo || ""}
                onChange={(e) => onCustomConfigChange({ ...customConfig, brandLogo: e.target.value })}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40"
              >
                <option value="">Core Esports</option>
                <option value="/images/Krafton.png">Krafton</option>
                <option value="/images/pubg-mobile-world-cup-2026.webp">PUBG Mobile</option>
                <option value="/images/Tencent Games.png">Tencent Games</option>
              </select>
              {customConfig?.brandLogo && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-2">
                  <img src={customConfig.brandLogo} alt="Preview" className="h-8 w-auto object-contain" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Brand Text Override</label>
                <input
                  type="text"
                  value={customConfig?.brandText || ""}
                  onChange={(e) => onCustomConfigChange({ ...customConfig, brandText: e.target.value })}
                  placeholder="Leave empty for default"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40 placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Tournament</p>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Tournament Name</label>
                <input
                  type="text"
                  value={customConfig?.tournamentName || ""}
                  onChange={(e) => onCustomConfigChange({ ...customConfig, tournamentName: e.target.value })}
                  placeholder="e.g. BGMS Season 5"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40 placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Tournament Logo</label>
                <select
                  value={customConfig?.tournamentLogoUrl || ""}
                  onChange={(e) => onCustomConfigChange({ ...customConfig, tournamentLogoUrl: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40"
                >
                  <option value="">None</option>
                  <option value="/images/bgis-logo.webp">BGIS 2026</option>
                  <option value="/images/bmps-2026.webp">BMPS 2026</option>
                  <option value="/images/bmsd-2025.png">BMSD 2026</option>
                  <option value="/images/bmic-2025.png">BMIC 2026</option>
                  <option value="/images/pubg-mobile-world-cup-2026.webp">PMWC 2026</option>
                  <option value="/images/bgis-2025.webp">BGIS 2025</option>
                  <option value="/images/bmps-2025.webp">BMPS 2025</option>
                  <option value="/images/bmsd-2025.webp">BMSD 2025</option>
                  <option value="/images/bmic-2025.webp">BMIC 2025</option>
                  <option value="/images/pubg-mobile-world-cup-2024.webp">PMWC 2024</option>
                  <option value="custom">Custom URL...</option>
                </select>
              </div>
              {customConfig?.tournamentLogoUrl === "custom" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">Custom Logo URL</label>
                  <input
                    type="text"
                    value={customConfig?.tournamentLogoCustom || ""}
                    onChange={(e) => onCustomConfigChange({ ...customConfig, tournamentLogoCustom: e.target.value, tournamentLogoUrl: e.target.value })}
                    placeholder="/images/my-tournament.png"
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40 placeholder:text-muted-foreground/40"
                  />
                </div>
              )}
              {customConfig?.tournamentLogoUrl && customConfig.tournamentLogoUrl !== "custom" && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-2">
                  <img src={customConfig.tournamentLogoUrl} alt="Preview" className="h-8 w-auto object-contain" />
                  <span className="text-[10px] text-muted-foreground truncate">{customConfig.tournamentLogoUrl}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground">Body Text</label>
            <textarea
              value={customConfig?.bodyText || ""}
              onChange={(e) => onCustomConfigChange({ ...customConfig, bodyText: e.target.value })}
              rows={2}
              placeholder="Write your message..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40 resize-none placeholder:text-muted-foreground/40"
            />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Colors</p>
            <div className="grid grid-cols-3 gap-2">
              {[["accent", "Accent"], ["titleColor", "Title"], ["bgColor", "Background"],
                ["cardBg", "Card"], ["muted", "Muted"], ["bodyColor", "Body"],
              ].map(([key, label]) => (
                <div key={key} className="flex flex-col items-center gap-1">
                  <input type="color" value={customConfig?.[key] || "#000000"}
                    onChange={(e) => onCustomConfigChange({ ...customConfig, [key]: e.target.value })}
                    className="size-8 rounded-lg border border-border cursor-pointer" />
                  <span className="text-[9px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-muted-foreground">Title Size</label>
              <span className="text-[10px] text-muted-foreground">{customConfig?.titleSize}</span>
            </div>
            <input type="range" min="20" max="56" value={parseInt(customConfig?.titleSize) || 38}
              onChange={(e) => onCustomConfigChange({ ...customConfig, titleSize: `${e.target.value}px` })}
              className="w-full" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-muted-foreground">Stats Columns</label>
              <span className="text-[10px] text-muted-foreground">{customConfig?.statsCols}</span>
            </div>
            <input type="range" min="2" max="6" value={customConfig?.statsCols || 4}
              onChange={(e) => onCustomConfigChange({ ...customConfig, statsCols: parseInt(e.target.value) })}
              className="w-full" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-muted-foreground">Accent Bar</label>
              <span className="text-[10px] text-muted-foreground">{customConfig?.accentBarHeight}</span>
            </div>
            <input type="range" min="0" max="12" value={parseInt(customConfig?.accentBarHeight) || 4}
              onChange={(e) => onCustomConfigChange({ ...customConfig, accentBarHeight: `${e.target.value}px` })}
              className="w-full" />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Standings Table</p>
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Column Headers (comma-separated)</label>
                <input type="text" value={customConfig?.colHeaders || ""}
                  onChange={(e) => onCustomConfigChange({ ...customConfig, colHeaders: e.target.value })}
                  placeholder="Matches,Placements,Finishes,Total"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40 placeholder:text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Column Fields (comma-separated)</label>
                <input type="text" value={customConfig?.colFields || ""}
                  onChange={(e) => onCustomConfigChange({ ...customConfig, colFields: e.target.value })}
                  placeholder="matches,placement,finishes,points"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40 placeholder:text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Top N highlight (0 = off)</label>
                <input type="number" min="0" max="20" value={customConfig?.topN || 0}
                  onChange={(e) => onCustomConfigChange({ ...customConfig, topN: parseInt(e.target.value) || 0 })}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Standings JSON (paste rows)</label>
                <textarea
                  value={customConfig?._standingsJson || ""}
                  onChange={(e) => onCustomConfigChange({ ...customConfig, _standingsJson: e.target.value })}
                  onBlur={(e) => {
                    let rows = [];
                    try { rows = JSON.parse(e.target.value); } catch {}
                    onCustomConfigChange({ ...customConfig, _standingsJson: e.target.value, standingsRows: rows });
                  }}
                  rows={4}
                  placeholder='[{"team":"Soul","matches":24,"placement":82,"finishes":130,"points":320}]'
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary/40 resize-none placeholder:text-muted-foreground/40" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Side Labels</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Left Label</label>
                <input type="text" value={customConfig?.leftLabel || ""}
                  onChange={(e) => onCustomConfigChange({ ...customConfig, leftLabel: e.target.value })}
                  placeholder="Top 6"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40 placeholder:text-muted-foreground/40" />
                <div className="flex items-center gap-1 mt-1">
                  <input type="color" value={customConfig?.leftBg || "#16a34a"}
                    onChange={(e) => onCustomConfigChange({ ...customConfig, leftBg: e.target.value })}
                    className="size-6 rounded border border-border cursor-pointer" />
                  <span className="text-[9px] text-muted-foreground">BG</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Right Label</label>
                <input type="text" value={customConfig?.rightLabel || ""}
                  onChange={(e) => onCustomConfigChange({ ...customConfig, rightLabel: e.target.value })}
                  placeholder="Playoffs"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40 placeholder:text-muted-foreground/40" />
                <div className="flex items-center gap-1 mt-1">
                  <input type="color" value={customConfig?.rightBg || "#7c3aed"}
                    onChange={(e) => onCustomConfigChange({ ...customConfig, rightBg: e.target.value })}
                    className="size-6 rounded border border-border cursor-pointer" />
                  <span className="text-[9px] text-muted-foreground">BG</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Social Links (one per line)</p>
            <textarea
              value={customConfig?._socialText || ""}
              onChange={(e) => {
                const links = e.target.value.split("\n").filter((l) => l.trim());
                onCustomConfigChange({ ...customConfig, _socialText: e.target.value, socialLinks: links });
              }}
              rows={3}
              placeholder="@esportsamaze&#10;/esportsamaze&#10;www.esports.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary/40 resize-none placeholder:text-muted-foreground/40" />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-2">Sections</p>
            <div className="flex flex-wrap gap-1.5">
              {[["showHeader", "Header"], ["showTag", "Tag"], ["showTitle", "Title"],
                ["showPlayer", "Player"], ["showStats", "Stats"], ["showTable", "Table"],
                ["showBody", "Body"], ["showSocial", "Social"], ["showFooter", "Footer"],
                ["showBgArt", "BG Art"],
              ].map(([key, label]) => (
                <button key={key} type="button"
                  onClick={() => onCustomConfigChange({ ...customConfig, [key]: !customConfig[key] })}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    customConfig[key] ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            {customConfig?.showBgArt && (
              <div className="mt-2 space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">BG Art Text</label>
                <input type="text" value={customConfig?.bgArtText || ""}
                  onChange={(e) => onCustomConfigChange({ ...customConfig, bgArtText: e.target.value })}
                  placeholder="Leave empty to use headline"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40 placeholder:text-muted-foreground/40" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50"
        >
          <Download className="size-4" />
          {isDownloading ? "Exporting..." : "Download PNG"}
        </button>
      </div>
    </div>
  );
}

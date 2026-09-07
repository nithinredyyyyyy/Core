export const POSTER_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Oswald:wght@500;600;700;800&display=swap');

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.poster-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ==================== GRID POSTER ==================== */
.poster-grid {
  width: min(90vw, 540px);
  aspect-ratio: 4 / 5;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(180deg, #e8600a 0%, #f28c5e 18%, #f9b89a 30%, #fde4d4 42%, #f0ece8 60%, #f2eeeb 80%, #f5f2ef 100%);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08);
}
.poster-grid::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background-image: linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.6;
  pointer-events: none;
  z-index: 0;
}
.poster-grid::after {
  content: '';
  position: absolute; top: -120px; left: 50%; transform: translateX(-50%);
  width: 400px; height: 400px;
  background: radial-gradient(ellipse, rgba(255,160,100,0.35), transparent 65%);
  pointer-events: none;
  z-index: 0;
}
.poster-grid-inner {
  position: relative; z-index: 1;
  height: 100%;
  display: flex; flex-direction: column;
  padding: 28px 28px 18px;
}

/* Grid Header */
.poster-grid-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.poster-grid-brand {
  display: flex; align-items: center; gap: 6px;
}
.poster-grid-brand img { width: 22px; height: 22px; object-fit: contain; }
.poster-grid-brand-text {
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase; color: rgba(255,255,255,0.8);
}
.poster-grid-tournament {
  display: flex; align-items: center; gap: 8px;
}
.poster-grid-tournament img { height: 30px; width: auto; object-fit: contain; }
.poster-grid-tournament-name {
  font-size: 11px; font-weight: 600; color: rgba(15,23,42,0.7);
  text-align: right; line-height: 1.3;
}

/* Grid Title Block */
.poster-grid-title {
  margin-bottom: 20px;
}
.poster-grid-title-stage {
  font-size: 28px; font-weight: 900; color: #0f172a;
  letter-spacing: -0.04em; line-height: 1;
}
.poster-grid-title-group {
  display: inline-flex; align-items: center;
  background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px;
  padding: 4px 12px; font-size: 12px; font-weight: 900; color: #ea580c;
  margin-top: 6px;
}
.poster-grid-title-sub {
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.25em; text-transform: uppercase; color: rgba(15,23,42,0.4);
  margin-top: 8px;
}

/* Grid Teams */
.poster-grid-teams {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; flex: 1;
}
.poster-grid-cell {
  position: relative;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0;
  padding: 12px 4px 10px; gap: 6px;
}
.poster-grid-cell img { width: 44px; height: 44px; object-fit: contain; }
.poster-grid-cell-name {
  font-size: 7.5px; font-weight: 800; color: #1e293b; text-align: center;
  line-height: 1.2; max-width: 100%; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap;
}
.poster-grid-cell-rank {
  position: absolute; top: 5px; left: 7px;
  font-size: 8px; font-weight: 900; color: #cbd5e1;
}
.poster-grid-cell.promo { background: #f0fdf4; border-color: #bbf7d0; }
.poster-grid-cell.promo .poster-grid-cell-rank { color: #22c55e; }
.poster-grid-cell.releg { background: #fef2f2; border-color: #fecaca; }
.poster-grid-cell.releg .poster-grid-cell-rank { color: #ef4444; }

/* Grid Footer */
.poster-grid-footer {
  margin-top: auto; padding-top: 16px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.poster-grid-footer-line { flex: 1; height: 1px; background: rgba(15,23,42,0.12); }
.poster-grid-footer-text {
  font-size: 7px; font-weight: 800;
  letter-spacing: 0.3em; text-transform: uppercase; color: rgba(15,23,42,0.35);
}

/* ==================== STANDINGS POSTER V2 ==================== */
.poster-root {
  --dark: #12121a;
  --blue: #1d3ec2;
  --cream: #f2efe6;
  --fold: #e9e5da;
  --top-row: #101013;
  --rest-row: #33343d;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Instagram format (unchanged) */
.ig-standings {
  width: 1080px;
  height: 1350px;
  border-radius: 22px;
  overflow: hidden;
  position: relative;
  background: var(--cream);
  box-shadow: 0 40px 80px -30px rgba(40,20,0,.25);
  display: flex;
  flex-direction: column;
}
.ig-head {
  background: linear-gradient(150deg, #e85d1f 0%, #f59e42 100%);
  padding: 40px 48px 34px;
  color: #ffffff;
  position: relative;
}
.ig-head::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 60% at 20% 0%, rgba(255,255,255,0.12), transparent);
  pointer-events: none;
}
.ig-top-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
  position: relative; z-index: 1;
}
.ig-brand {
  display: flex; align-items: center; gap: 12px;
}
.ig-brand-logo {
  height: 36px; width: auto; object-fit: contain;
}
.ig-brand-text {
  font-size: 14px; font-weight: 800;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: #ffffff;
}
.ig-series-logo {
  height: 40px; width: auto; object-fit: contain;
  mix-blend-mode: multiply;
}
.ig-title {
  font-size: 72px; font-weight: 800; color: #ffffff;
  letter-spacing: -0.015em; line-height: 1;
  margin: 0 0 14px 0;
  font-family: 'Oswald', 'Inter', sans-serif;
  text-transform: uppercase;
  position: relative; z-index: 1;
  text-shadow: 0 2px 12px rgba(0,0,0,.12);
}
.ig-sub-row {
  display: flex; align-items: center; gap: 12px;
  position: relative; z-index: 1;
}
.ig-callout {
  display: inline-flex; align-items: center;
  padding: 8px 16px; border-radius: 999px;
  font-size: 12px; font-weight: 700;
  letter-spacing: 0.04em; text-transform: uppercase;
  color: #e85d1f;
  background: #ffffff;
}
.ig-team-count {
  font-size: 12px; font-weight: 700;
  letter-spacing: 0.04em; text-transform: uppercase;
  color: rgba(255,255,255,.88);
  background: rgba(255,255,255,.22);
  padding: 8px 14px; border-radius: 999px;
}
.ig-table-area {
  flex: 1;
  padding: 0 48px;
  display: flex; flex-direction: column;
}
.ig-table {
  width: 100%; border-collapse: collapse;
}
.ig-table thead th {
  padding: 18px 0 14px;
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: #6b6358; text-align: center;
  border-bottom: 1px solid #e8e2da;
  background: var(--cream);
}
.ig-th-rank { width: 52px; text-align: center !important; }
.ig-th-team { text-align: left !important; padding-left: 4px !important; }
.ig-th-pts { width: 90px; text-align: right !important; padding-right: 4px !important; }
.ig-row {
  border-bottom: 1px solid #e8e2da;
}
.ig-row:last-child { border-bottom: none; }
.ig-row.ig-alt { background: #f8f2e9; }
.ig-row-podium { border-left: 4px solid transparent; }
.ig-row-podium.ig-p1 { background: linear-gradient(90deg, #fff3d9, #fff3d9 20%, transparent 80%); border-left-color: #c98a1f; }
.ig-row-podium.ig-p2 { background: linear-gradient(90deg, #f0f1f5, #f0f1f5 20%, transparent 80%); border-left-color: #8a90a0; }
.ig-row-podium.ig-p3 { background: linear-gradient(90deg, #fbe9dc, #fbe9dc 20%, transparent 80%); border-left-color: #b06a34; }
.ig-rank {
  padding: 14px 0; text-align: center;
  font-size: 20px; font-weight: 700; color: #6b6358;
  font-variant-numeric: tabular-nums;
  width: 52px;
}
.ig-row-podium .ig-rank { font-size: 26px; color: #1a1207; }
.ig-team-cell {
  display: flex; align-items: center; gap: 16px;
  padding: 14px 0;
}
.ig-badge {
  width: 52px; height: 52px; border-radius: 12px;
  background: #ffffff; border: 1px solid #e8e2da;
  overflow: hidden; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,.06);
  padding: 6px;
}
.ig-row-podium .ig-badge {
  width: 56px; height: 56px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.1);
  border: 2px solid #c98a1f;
}
.ig-row-podium.ig-p2 .ig-badge { border-color: #8a90a0; }
.ig-row-podium.ig-p3 .ig-badge { border-color: #b06a34; }
.ig-badge img { width: 100%; height: 100%; object-fit: contain; }
.ig-badge span {
  font-size: 13px; font-weight: 900; color: #94a3b8;
  letter-spacing: 0.02em;
}
.ig-team-name {
  font-size: 20px; font-weight: 700; color: #1a1207;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  letter-spacing: -0.01em;
}
.ig-row-podium .ig-team-name {
  font-size: 22px; font-weight: 800;
  letter-spacing: 0.01em;
}
.ig-pts {
  padding: 14px 4px 14px 0; text-align: right;
}
.ig-foot {
  padding: 20px 48px 28px;
  display: flex; align-items: center; justify-content: space-between;
}
.ig-venue {
  font-size: 11px; font-weight: 600; color: #6b6358;
  letter-spacing: 0.06em;
}
.ig-dots {
  display: flex; align-items: center; gap: 8px;
}
.ig-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #e8e2da;
}
.ig-dot-active {
  width: 24px; border-radius: 4px;
  background: #e85d1f;
}
.ig-copyright {
  font-size: 11px; font-weight: 700; color: #6b6358;
  letter-spacing: 0.06em;
}

/* ==================== STANDINGS POSTER V2 — Exact Reference Match ==================== */
.poster-standings-v2 {
  width: 736px;
  height: 920px;
  position: relative;
  background:
    radial-gradient(ellipse 500px 400px at 8% 12%, #2b52d6 0%, transparent 55%),
    radial-gradient(ellipse 400px 500px at 95% 8%, #17265e 0%, transparent 50%),
    radial-gradient(ellipse 600px 500px at 100% 70%, #3159e8 0%, transparent 45%),
    radial-gradient(ellipse 400px 400px at 0% 95%, #101a3d 0%, transparent 45%),
    radial-gradient(ellipse 300px 800px at 50% 50%, #0c1330 0%, transparent 60%),
    linear-gradient(165deg, #050813 0%, #0a1230 45%, #060a1a 100%);
  overflow: hidden;
  border-radius: 2px;
}

/* Fold corners */
.poster-standings-v2-fold {
  position: absolute;
  width: 90px; height: 90px;
  background: var(--fold);
  transform: rotate(45deg);
  z-index: 2;
}
.poster-standings-v2-fold-tl { top: -45px; left: -45px; }
.poster-standings-v2-fold-br { bottom: -45px; right: -45px; }

/* Stars */
.poster-standings-v2-stars {
  position: absolute; inset: 0;
  z-index: 4; pointer-events: none;
}
.poster-standings-v2-star {
  position: absolute;
  color: #3d6cf5;
}

/* Watermarks */
.poster-standings-v2-watermark-top,
.poster-standings-v2-watermark-bottom {
  position: absolute;
  z-index: 3;
  display: flex;
  justify-content: space-around;
  padding: 13px 10px;
  color: rgba(255,255,255,0.58);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2.5px;
  left: 0; right: 0;
}
.poster-standings-v2-watermark-top { top: 0; }
.poster-standings-v2-watermark-bottom { bottom: 0; }

.poster-standings-v2-watermark-left,
.poster-standings-v2-watermark-right {
  position: absolute;
  top: 42px; bottom: 42px;
  width: 26px;
  writing-mode: vertical-rl;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  color: rgba(255,255,255,0.52);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2.5px;
  z-index: 3;
}
.poster-standings-v2-watermark-left { left: 4px; }
.poster-standings-v2-watermark-right { right: 4px; }

/* Inner card */
.poster-standings-v2-card {
  position: absolute;
  top: 42px; left: 42px; right: 42px; bottom: 42px;
  background: var(--cream);
  z-index: 5;
  padding: 34px 38px 30px;
  display: flex;
  flex-direction: column;
}

/* Brand row */
.poster-standings-v2-brand-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}
.poster-standings-v2-brand-mark {
  width: 26px; height: 26px;
  background: var(--dark);
  display: flex; align-items: center; justify-content: center;
}
.poster-standings-v2-brand-mark svg { width: 15px; height: 15px; }
.poster-standings-v2-brand-name {
  font-size: 18px;
  font-weight: 800;
  color: var(--dark);
  letter-spacing: 0.2px;
}
.poster-standings-v2-brand-divider {
  width: 2px;
  height: 22px;
  background: var(--dark);
  opacity: 0.7;
}
.poster-standings-v2-brand-secondary {
  font-size: 18px;
  font-weight: 700;
  color: var(--blue);
}

/* Title */
.poster-standings-v2-title {
  font-size: 96px;
  font-weight: 900;
  letter-spacing: -2px;
  color: var(--blue);
  line-height: 0.9;
  margin-bottom: 6px;
}

/* Event line */
.poster-standings-v2-event-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 22px;
}
.poster-standings-v2-event-pill {
  background: var(--dark);
  color: var(--cream);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 5px 12px;
  border-radius: 3px;
}
.poster-standings-v2-event-date {
  color: #5a5f6e;
  font-size: 13px;
  font-weight: 600;
}

/* Table */
.poster-standings-v2-table {
  flex: 1;
  border-top: 3px solid var(--dark);
}
.poster-standings-v2-col-head {
  display: grid;
  grid-template-columns: 28px 2fr 0.55fr 0.6fr 0.6fr 0.65fr;
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 800;
  color: var(--dark);
  letter-spacing: 0.6px;
  border-bottom: 2px solid var(--dark);
}
.poster-standings-v2-col-head span:not(:first-child):not(:nth-child(2)) {
  text-align: center;
}

/* Rows */
.poster-standings-v2-row {
  display: grid;
  grid-template-columns: 28px 2fr 0.55fr 0.6fr 0.6fr 0.65fr;
  align-items: center;
  padding: 7px 16px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
  border-bottom: 1px solid rgba(255,255,255,0.09);
}
.poster-standings-v2-row-top {
  background: var(--top-row);
  color: var(--cream);
}
.poster-standings-v2-row-rest {
  background: var(--rest-row);
  color: var(--cream);
}

/* Rank */
.poster-standings-v2-rank {
  font-weight: 700;
}

/* Team cell */
.poster-standings-v2-team-cell {
  display: flex;
  align-items: center;
  gap: 9px;
}
.poster-standings-v2-badge {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: var(--cream);
  display: flex; align-items: center; justify-content: center;
  font-size: 7px; font-weight: 800; color: var(--dark);
  flex-shrink: 0;
  overflow: hidden;
}
.poster-standings-v2-badge img { width: 100%; height: 100%; object-fit: contain; }
.poster-standings-v2-team-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Stats */
.poster-standings-v2-stat {
  display: flex;
  justify-content: center;
}
.poster-standings-v2-stat-circle {
  width: 20px; height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.4);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: var(--cream);
}

/* Points */
.poster-standings-v2-pts {
  color: var(--cream);
  font-weight: 800;
  text-align: center;
}

/* ==================== MVP CARD (White 4:5) ==================== */
.poster-mvp {
  width: min(90vw, 540px);
  aspect-ratio: 4 / 5;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08);
}
.poster-mvp::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a855f7, #f97316, #a855f7);
}
.poster-mvp-inner {
  position: relative; z-index: 1;
  height: 100%;
  display: flex; flex-direction: column;
  padding: 24px 24px 18px;
}
.poster-mvp-top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.poster-mvp-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg, #faf5ff, #fff7ed);
  border: 1px solid #e9d5ff;
  border-radius: 8px; padding: 6px 14px;
}
.poster-mvp-badge-text {
  font-size: 11px; font-weight: 900;
  letter-spacing: 0.15em; text-transform: uppercase;
  background: linear-gradient(135deg, #9333ea, #f97316);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.poster-mvp-tournament-info {
  display: flex; align-items: center; gap: 8px;
}
.poster-mvp-tournament-info img { height: 24px; width: auto; object-fit: contain; }
.poster-mvp-tournament-name {
  font-size: 10px; font-weight: 700; color: #94a3b8;
  text-align: right; line-height: 1.3;
}

.poster-mvp-card-area {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.poster-mvp-card {
  position: relative;
  width: 320px; height: 460px;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(160deg, #faf5ff 0%, #f3e8ff 40%, #fff7ed 100%);
  border: 1px solid #e9d5ff;
  box-shadow:
    0 20px 60px rgba(0,0,0,0.1),
    0 0 0 1px rgba(168,85,247,0.1);
  transform: rotate(-2deg);
}
.poster-mvp-card::before {
  content: '';
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 50% 20%, rgba(168,85,247,0.08), transparent),
    radial-gradient(ellipse 50% 50% at 50% 80%, rgba(249,115,22,0.05), transparent);
  pointer-events: none;
}
.poster-mvp-card-inner {
  position: relative; z-index: 1;
  height: 100%;
  display: flex; flex-direction: column;
  padding: 0;
}
.poster-mvp-card-photo {
  position: relative;
  width: 100%;
  height: 300px;
  flex-shrink: 0;
  overflow: hidden;
}
.poster-mvp-card-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}
.poster-mvp-card-photo-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #f3e8ff, #fff7ed);
  border-bottom: 1px dashed #d8b4fe;
  display: flex; align-items: center; justify-content: center;
  font-size: 48px; font-weight: 900;
  color: #d8b4fe;
}
.poster-mvp-card-logo-overlay {
  position: absolute;
  top: 12px; left: 12px;
  z-index: 2;
}
.poster-mvp-card-bottom {
  flex: 1;
  display: flex; flex-direction: column;
  padding: 14px 20px 16px;
  justify-content: center;
}
.poster-mvp-player-info { margin-top: auto; }
.poster-mvp-player-team {
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 4px;
}
.poster-mvp-player-name {
  font-size: 32px; font-weight: 900; color: #0f172a;
  letter-spacing: -0.03em; line-height: 1;
}
.poster-mvp-player-stats {
  display: flex; gap: 16px; margin-top: 12px;
}
.poster-mvp-stat {
  display: flex; flex-direction: column; gap: 1px;
}
.poster-mvp-stat-value {
  font-size: 16px; font-weight: 900; color: #1e293b;
}
.poster-mvp-stat-label {
  font-size: 7px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: #94a3b8;
}

.poster-mvp-footer {
  margin-top: 16px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.poster-mvp-footer-line {
  flex: 1; height: 1px; background: #e2e8f0;
}
.poster-mvp-footer-text {
  font-size: 8px; font-weight: 800;
  letter-spacing: 0.3em; text-transform: uppercase;
  color: #cbd5e1;
}

/* No-logo fallback */
.poster-no-logo {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px; border-radius: 12px;
  background: #f1f5f9; border: 1px solid #e2e8f0;
  font-size: 11px; font-weight: 900; color: #94a3b8;
}
.poster-standings .poster-no-logo,
.poster-mvp .poster-no-logo {
  width: 22px; height: 22px; border-radius: 4px; font-size: 8px;
}

/* ==================== CUSTOM TEMPLATE ==================== */
.poster-custom {
  width: min(90vw, 540px);
  aspect-ratio: 4 / 5;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  background: var(--c-bg);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08);
}
.poster-custom-bg-art {
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
}
.poster-custom-bg-art-text {
  position: absolute; inset: "-50%";
  opacity: var(--c-bg-art-opacity, 0.04);
  display: flex; flex-direction: column; gap: 4px;
  transform: rotate(var(--c-bg-art-angle, 45deg));
  transform-origin: center;
}
.poster-custom-bg-art-text span {
  font-size: 16px; font-weight: 900; font-family: sans-serif;
  color: var(--c-accent); padding: 2px 0; white-space: nowrap;
  letter-spacing: 0.2em; text-transform: uppercase;
}
.poster-custom-bg-glow {
  position: absolute; border-radius: 50%; filter: blur(80px);
  opacity: var(--c-bg-glow-opacity, 0.08);
  background: var(--c-accent);
}
.poster-custom-bg-dots {
  position: absolute; inset: 0;
  opacity: var(--c-bg-dots-opacity, 0.03);
  background-image: radial-gradient(circle, var(--c-accent) 1px, transparent 1px);
  background-size: 24px 24px;
}
.poster-custom-accent {
  position: absolute; top: 0; left: 0; right: 0;
  height: var(--c-accent-h, 4px);
  background: var(--c-accent);
}
.poster-custom-inner {
  position: relative; z-index: 1;
  height: 100%;
  display: flex; flex-direction: column;
  padding: 16px 20px;
}
.poster-custom-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 6px;
}
.poster-custom-brand { display: flex; align-items: center; gap: 6px; }
.poster-custom-brand img { width: 20px; height: 20px; object-fit: contain; }
.poster-custom-brand-text {
  font-size: 8px; font-weight: 800;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--c-muted);
}
.poster-custom-tournament { display: flex; align-items: center; gap: 8px; }
.poster-custom-tournament-name {
  font-size: 9px; font-weight: 700; color: var(--c-muted);
  text-align: right; line-height: 1.3;
}
.poster-custom-tournament img { height: 26px; width: auto; object-fit: contain; }
.poster-custom-title-zone { margin-bottom: 6px; }
.poster-custom-tag {
  display: inline-flex; align-items: center; gap: 5px;
  background: var(--c-tag-bg); border: 1px solid var(--c-tag-border);
  border-radius: 6px; padding: 3px 10px; margin-bottom: 4px;
}
.poster-custom-tag-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--c-accent);
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.poster-custom-tag-text {
  font-size: 8px; font-weight: 800;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--c-accent);
}
.poster-custom-headline {
  font-size: var(--c-title-size, 32px);
  font-weight: var(--c-title-weight, 900);
  color: var(--c-title-color);
  letter-spacing: -0.04em; line-height: 1.05;
}
.poster-custom-subline {
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--c-muted); margin-top: 4px;
}
.poster-custom-divider {
  height: 1px; background: var(--c-border); margin: 0 0 8px 0;
}
.poster-custom-player { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }
.poster-custom-avatar {
  width: 64px; height: 64px; border-radius: 12px; overflow: hidden;
  background: var(--c-card); border: 2px solid var(--c-border);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.poster-custom-avatar img { width: 100%; height: 100%; object-fit: cover; object-position: center 15%; }
.poster-custom-avatar-fb { font-size: 24px; font-weight: 900; color: var(--c-muted); }
.poster-custom-player-info { flex: 1; min-width: 0; }
.poster-custom-player-team {
  font-size: 9px; font-weight: 800; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--c-accent);
  margin-bottom: 2px; display: flex; align-items: center; gap: 5px;
}
.poster-custom-player-team img { width: 14px; height: 14px; object-fit: contain; }
.poster-custom-player-name {
  font-size: 24px; font-weight: 900; color: var(--c-title-color);
  letter-spacing: -0.02em; line-height: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.poster-custom-stats {
  display: grid; grid-template-columns: repeat(var(--c-stats-cols, 4), 1fr);
  gap: 6px; margin-bottom: 10px;
}
.poster-custom-stat-card {
  background: var(--c-card); border: 1px solid var(--c-border);
  border-radius: 8px; padding: 6px 4px; text-align: center;
}
.poster-custom-stat-val { font-size: 14px; font-weight: 900; color: var(--c-title-color); line-height: 1; }
.poster-custom-stat-lbl {
  font-size: 6px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--c-muted); margin-top: 2px;
}
.poster-custom-standings { flex: 1; display: flex; flex-direction: column; margin-bottom: 4px; overflow: hidden; }
.poster-custom-table-header {
  display: grid;
  grid-template-columns: 20px 1.8fr repeat(var(--c-col-count, 4), 1fr);
  gap: 0; padding: 2px 0; border-bottom: 2px solid var(--c-border); margin-bottom: 0;
}
.poster-custom-th {
  font-size: 5.5px; font-weight: 800; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--c-muted); text-align: center;
  padding: 0 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.poster-custom-th:nth-child(1) { text-align: left; padding-left: 2px; }
.poster-custom-th:nth-child(2) { text-align: left; padding-left: 3px; }
.poster-custom-rows { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.poster-custom-row {
  display: grid;
  grid-template-columns: 20px 1.8fr repeat(var(--c-col-count, 4), 1fr);
  gap: 0; padding: 2px 0; border-bottom: 1px solid var(--c-border); align-items: center;
}
.poster-custom-row:last-child { border-bottom: none; }
.poster-custom-row.top6 { background: var(--c-accent); }
.poster-custom-row.top6 .poster-custom-rank,
.poster-custom-row.top6 .poster-custom-team-name,
.poster-custom-row.top6 .poster-custom-td { color: #ffffff; }
.poster-custom-rank {
  font-size: 8px; font-weight: 900; color: var(--c-title-color);
  text-align: left; padding-left: 2px;
}
.poster-custom-team-cell { display: flex; align-items: center; gap: 3px; min-width: 0; padding-left: 3px; }
.poster-custom-team-logo {
  width: 12px; height: 12px; border-radius: 2px; overflow: hidden;
  background: var(--c-card); border: 1px solid var(--c-border);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.poster-custom-team-logo img { width: 100%; height: 100%; object-fit: contain; }
.poster-custom-team-logo-fb { font-size: 4px; font-weight: 900; color: var(--c-muted); }
.poster-custom-team-name {
  font-size: 7.5px; font-weight: 700; color: var(--c-title-color);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.poster-custom-td {
  font-size: 8px; font-weight: 700; color: var(--c-title-color); text-align: center;
  padding: 0 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.poster-custom-td.total { font-weight: 900; color: var(--c-accent); font-size: 8.5px; }
.poster-custom-left-label,
.poster-custom-right-label {
  position: absolute; z-index: 5;
  writing-mode: vertical-rl; text-orientation: mixed;
  font-size: 9px; font-weight: 900;
  letter-spacing: 0.15em; text-transform: uppercase;
  padding: 10px 6px; border-radius: 0 4px 4px 0;
}
.poster-custom-left-label {
  left: 0; top: 50%; transform: translateY(-50%) rotate(180deg);
  background: var(--c-left-bg, #16a34a); color: var(--c-left-color, #ffffff);
}
.poster-custom-right-label {
  right: 0; top: 50%; transform: translateY(-50%);
  background: var(--c-right-bg, #7c3aed); color: var(--c-right-color, #ffffff);
}
.poster-custom-textblock {
  background: var(--c-card); border: 1px solid var(--c-border);
  border-radius: 8px; padding: 10px 12px; margin-bottom: 8px;
}
.poster-custom-textblock-content {
  font-size: var(--c-body-size, 11px); font-weight: var(--c-body-weight, 600);
  color: var(--c-body-color); line-height: 1.6;
}
.poster-custom-social {
  margin-top: auto; padding-top: 6px;
  border-top: 1px solid var(--c-border);
  display: flex; align-items: center; justify-content: center;
  gap: 12px; flex-wrap: wrap;
}
.poster-custom-social-item {
  display: flex; align-items: center; gap: 3px;
  font-size: 6.5px; font-weight: 700; color: var(--c-muted); letter-spacing: 0.05em;
}
.poster-custom-social-item svg { width: 8px; height: 8px; }
.poster-custom-footer {
  padding-top: 6px; display: flex; align-items: center;
  justify-content: center; gap: 6px;
}
.poster-custom-footer-line { flex: 1; height: 1px; background: var(--c-border); }
.poster-custom-footer-text {
  font-size: 6.5px; font-weight: 800; letter-spacing: 0.35em;
  text-transform: uppercase; color: var(--c-muted);
}
`;

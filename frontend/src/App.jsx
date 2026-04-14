import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import logo from './assets/ecklogo.png';
import logo1 from './assets/logo.png';

// DESIGN TOKENS
const css = String.raw;
const STYLES = css`
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=IBM+Plex+Mono:wght@400;500&display=swap');

  :root {
    --bg-base:       #07090c;
    --bg-surface:    #0c0f14;
    --bg-elevated:   #111620;
    --bg-hover:      #161d2a;
    --border:        rgba(255,255,255,0.06);
    --border-glow:   rgba(193,147,56,0.35);
    --gold:          #c19338;
    --gold-light:    #ddb96a;
    --gold-dim:      rgba(193,147,56,0.12);
    --gold-glow:     rgba(193,147,56,0.08);
    --green:         #26c87a;
    --green-dim:     rgba(38,200,122,0.10);
    --red:           #e04f5f;
    --red-dim:       rgba(224,79,95,0.10);
    --blue:          #4a8fd4;
    --blue-dim:      rgba(74,143,212,0.10);
    --amber:         #e8a020;
    --amber-dim:     rgba(232,160,32,0.10);
    --purple:        #9b6dff;
    --text-primary:  #dde3ec;
    --text-secondary:#6e7d92;
    --text-muted:    #38475a;
    --sidebar-w:     248px;
    --navbar-h:      60px;
    --radius:        10px;
    --radius-sm:     7px;
    --radius-lg:     16px;
    --shadow:        0 8px 32px rgba(0,0,0,0.5);
    --shadow-gold:   0 0 40px rgba(193,147,56,0.10);
    font-size: 14px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'IBM Plex Sans', sans-serif;
    background: var(--bg-base);
    color: var(--text-primary);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  h1,h2,h3,h4,h5 { font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--bg-hover); border-radius: 4px; }

  /* ── Layout ── */
  .layout { display: flex; min-height: 100vh; }

  .logo {
    display: flex; align-items: center;
  }
  
  .logo1 img {
  width: 40px; height: 40px;
  margin-right: -7px;
  }

  .logo img{
    width: 120px; height: 38px;
    padding-bottom: 4px;
  }

  .sidebar {
    width: var(--sidebar-w);
    min-height: 100vh;
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    position: fixed; top: 0; left: 0; z-index: 200;
    display: flex; flex-direction: column;
    transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
  }
  .sidebar-overlay {
    display: none;
    position: fixed; inset: 0; z-index: 190;
    background: rgba(0,0,0,0.6);
    animation: fadeIn 0.2s ease;
  }
  .sidebar-logo {
    height: var(--navbar-h);
    display: flex; align-items: center; gap: 10px;
    padding: 0 18px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .logo-mark {
    width: 30px; height: 30px;
    background: linear-gradient(145deg, var(--gold), #8a6018);
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif;
    font-weight: 900; font-size: 14px; color: #07090c; flex-shrink: 0;
  }
  .logo-text { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 13px; line-height: 1.25; }
  .logo-text span { display: block; color: var(--text-secondary); font-family: 'IBM Plex Sans', sans-serif; font-weight: 400; font-size: 10px; letter-spacing: 0.07em; text-transform: uppercase; }

  .sidebar-nav { flex: 1; padding: 10px 0; overflow-y: auto; }
  .nav-section-label { font-size: 9.5px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted); padding: 14px 18px 5px; }

  .nav-item {
    display: flex; align-items: center; gap: 9px;
    padding: 8.5px 18px;
    cursor: pointer; border: none; background: none;
    width: 100%; text-align: left;
    color: var(--text-secondary); font-family: 'IBM Plex Sans', sans-serif;
    font-size: 13px; font-weight: 400;
    transition: all 0.12s ease; position: relative;
  }
  .nav-item:hover { color: var(--text-primary); background: var(--bg-elevated); }
  .nav-item.active { color: var(--gold-light); background: var(--gold-glow); }
  .nav-item.active::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 2.5px; background: var(--gold); border-radius: 0 2px 2px 0;
  }
  .nav-icon { width: 15px; height: 15px; flex-shrink: 0; }
  .nav-badge {
    margin-left: auto; background: var(--red); color: white;
    font-size: 9.5px; font-weight: 600; padding: 1px 5px; border-radius: 10px;
  }
  .sidebar-footer { padding: 14px; border-top: 1px solid var(--border); flex-shrink: 0; }
  .user-chip {
    display: flex; align-items: center; gap: 9px; padding: 8px 10px;
    background: var(--bg-elevated); border-radius: var(--radius-sm);
    cursor: pointer; transition: background 0.12s;
  }
  .user-chip:hover { background: var(--bg-hover); }
  .avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: linear-gradient(135deg, var(--gold), #7a4f10);
    display: flex; align-items: center; justify-content: center;
    font-family: 'IBM Plex Sans', sans-serif; font-weight: 600; font-size: 11.5px;
    color: var(--bg-base); flex-shrink: 0;
  }
  .avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
  .user-info { flex: 1; min-width: 0; }
  .user-name { font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-role { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }

  /* ── Main ── */
  .main-wrap { margin-left: var(--sidebar-w); flex: 1; display: flex; flex-direction: column; min-height: 100vh; }
  .topbar {
    height: var(--navbar-h); background: var(--bg-surface); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; padding: 0 24px;
    position: sticky; top: 0; z-index: 100; gap: 14px;
  }
  .topbar-title { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 16px; flex: 1; }
  .topbar-subtitle { font-size: 11.5px; color: var(--text-secondary); font-weight: 400; font-family: 'IBM Plex Sans', sans-serif; }
  .topbar-actions { display: flex; align-items: center; gap: 8px; }
  .icon-btn {
    width: 34px; height: 34px; background: var(--bg-elevated); border: 1px solid var(--border);
    border-radius: var(--radius-sm); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-secondary); transition: all 0.12s; position: relative;
  }
  .icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-glow); }
  .notif-dot {
    position: absolute; top: 5px; right: 5px; width: 6px; height: 6px;
    background: var(--gold); border-radius: 50%; border: 1.5px solid var(--bg-surface);
  }
  .page-content { flex: 1; padding: 24px; max-width: 1440px; width: 100%; }

  /* ── Stats ── */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; margin-bottom: 24px; }
  .stat-card {
    background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 18px; position: relative; overflow: hidden; transition: border-color 0.2s, transform 0.2s;
  }
  .stat-card:hover { border-color: var(--border-glow); transform: translateY(-1px); }
  .stat-card::after {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
  }
  .stat-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
  .stat-label { font-size: 10.5px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; font-family: 'IBM Plex Sans', sans-serif; }
  .stat-value { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; line-height: 1; }
  .stat-change { font-size: 10.5px; margin-top: 5px; display: flex; align-items: center; gap: 3px; }
  .stat-change.up { color: var(--green); } .stat-change.down { color: var(--red); } .stat-change.neutral { color: var(--text-secondary); }

  /* ── Cards ── */
  .card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
  .card-title { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 600; }
  .card-subtitle { font-size: 11.5px; color: var(--text-secondary); margin-top: 2px; font-family: 'IBM Plex Sans', sans-serif; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px;
    border-radius: var(--radius-sm); font-family: 'IBM Plex Sans', sans-serif;
    font-size: 12.5px; font-weight: 500; cursor: pointer; border: none;
    transition: all 0.13s; white-space: nowrap;
  }
  .btn-primary { background: linear-gradient(135deg, var(--gold), #8a6018); color: #07090c; font-weight: 600; }
  .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(193,147,56,0.3); }
  .btn-ghost { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-primary); }
  .btn-ghost:hover { background: var(--bg-hover); border-color: var(--border-glow); }
  .btn-danger { background: var(--red-dim); border: 1px solid var(--red); color: var(--red); }
  .btn-danger:hover { background: var(--red); color: white; }
  .btn-success { background: var(--green-dim); border: 1px solid var(--green); color: var(--green); }
  .btn-success:hover { background: var(--green); color: var(--bg-base); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-xs { padding: 4px 9px; font-size: 11px; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

  /* ── Tables ── */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); padding: 9px 14px; text-align: left; border-bottom: 1px solid var(--border); white-space: nowrap; font-family: 'IBM Plex Sans', sans-serif; }
  td { padding: 12px 14px; font-size: 12.5px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--bg-hover); }

  /* ── Badges ── */
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 20px; font-size: 10.5px; font-weight: 600; text-transform: capitalize; font-family: 'IBM Plex Sans', sans-serif; }
  .badge-dot { width: 4px; height: 4px; border-radius: 50%; }
  .badge.active,.badge.approved,.badge.completed { background: var(--green-dim); color: var(--green); }
  .badge.pending { background: var(--amber-dim); color: var(--amber); }
  .badge.rejected,.badge.cancelled,.badge.banned { background: var(--red-dim); color: var(--red); }
  .badge.in_progress { background: var(--blue-dim); color: var(--blue); }
  .badge.closed,.badge.resolved { background: rgba(110,125,146,0.1); color: var(--text-secondary); }
  .badge.open { background: var(--gold-dim); color: var(--gold); }
  .badge.low { background: var(--green-dim); color: var(--green); }
  .badge.medium { background: var(--amber-dim); color: var(--amber); }
  .badge.high { background: var(--red-dim); color: var(--red); }
  .badge.urgent { background: rgba(155,109,255,0.12); color: var(--purple); }

  /* ── Forms ── */
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 11.5px; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px; letter-spacing: 0.02em; font-family: 'IBM Plex Sans', sans-serif; }
  .form-input,.form-select,.form-textarea {
    width: 100%; background: var(--bg-elevated); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 9px 13px;
    color: var(--text-primary); font-family: 'IBM Plex Sans', sans-serif; font-size: 12.5px;
    transition: border-color 0.13s, box-shadow 0.13s; outline: none;
  }
  .form-input:focus,.form-select:focus,.form-textarea:focus { border-color: var(--gold); box-shadow: 0 0 0 3px var(--gold-dim); }
  .form-select { appearance: none; cursor: pointer; }
  .form-textarea { resize: vertical; min-height: 88px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .amount-input-wrap { position: relative; }
  .amount-prefix { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-weight: 500; font-size: 13px; pointer-events: none; }
  .amount-input { padding-left: 26px !important; font-size: 17px !important; font-weight: 600 !important; font-family: 'IBM Plex Mono', monospace !important; }

  /* ── Modal ── */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: rgba(0,0,0,0.72); display: flex; align-items: center; justify-content: center;
    padding: 16px; animation: fadeIn 0.15s ease;
  }
  .modal {
    background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
    width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto;
    animation: slideUp 0.18s ease; box-shadow: 0 32px 96px rgba(0,0,0,0.7);
  }
  .modal-lg { max-width: 700px; }
  .modal-header { padding: 18px 22px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .modal-title { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 600; }
  .modal-body { padding: 22px; }
  .modal-footer { padding: 14px 22px; border-top: 1px solid var(--border); display: flex; gap: 9px; justify-content: flex-end; }

  /* ── Plans ── */
  .plans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(268px, 1fr)); gap: 18px; }
  .plan-card {
    background: var(--bg-surface); border: 1px solid var(--border); border-radius: 14px;
    padding: 22px; position: relative; overflow: hidden; cursor: pointer;
    transition: all 0.2s ease;
  }
  .plan-card:hover { border-color: var(--gold); transform: translateY(-2px); box-shadow: var(--shadow-gold); }
  .plan-card.featured { border-color: rgba(193,147,56,0.35); }
  .plan-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2.5px; background: linear-gradient(90deg, var(--gold), var(--gold-light)); }
  .plan-tier { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.13em; color: var(--gold); margin-bottom: 6px; font-family: 'IBM Plex Sans', sans-serif; }
  .plan-name { font-family: 'Playfair Display', serif; font-size: 19px; font-weight: 700; margin-bottom: 4px; }
  .plan-range { font-size: 12px; color: var(--text-secondary); margin-bottom: 14px; font-family: 'IBM Plex Mono', monospace; }
  .plan-roi { font-family: 'Playfair Display', serif; font-size: 34px; font-weight: 900; color: var(--gold-light); line-height: 1; margin-bottom: 3px; }
  .plan-roi span { font-size: 13px; color: var(--text-secondary); font-weight: 400; font-family: 'IBM Plex Sans', sans-serif; }
  .plan-duration { font-size: 11.5px; color: var(--text-secondary); margin-bottom: 18px; }
  .plan-features { list-style: none; margin-bottom: 18px; }
  .plan-features li { font-size: 12px; padding: 4px 0; color: var(--text-secondary); display: flex; align-items: center; gap: 7px; }
  .plan-features li::before { content: '◆'; color: var(--gold); font-size: 7px; flex-shrink: 0; }

  /* ── Balance Card ── */
  .balance-card {
    background: linear-gradient(135deg, #0c1824 0%, #101a14 100%);
    border: 1px solid rgba(193,147,56,0.22); border-radius: 14px; padding: 24px;
    position: relative; overflow: hidden;
  }
  .balance-card::after {
    content: 'ECKARD'; position: absolute; right: -8px; bottom: -16px;
    font-family: 'Playfair Display', serif; font-size: 56px; font-weight: 900;
    color: rgba(255,255,255,0.018); letter-spacing: -1px; pointer-events: none;
  }
  .balance-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-secondary); margin-bottom: 6px; font-family: 'IBM Plex Sans', sans-serif; }
  .balance-amount {
    font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 900;
    background: linear-gradient(135deg, var(--gold-light), var(--gold));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    line-height: 1; margin-bottom: 5px;
  }
  .balance-sub { font-size: 11.5px; color: var(--text-secondary); font-family: 'IBM Plex Sans', sans-serif; }

  /* ── Chart ── */
  .bar-chart { display: flex; align-items: flex-end; gap: 6px; height: 78px; }
  .bar { flex: 1; background: var(--gold-dim); border-radius: 3px 3px 0 0; position: relative; transition: background 0.13s; cursor: pointer; }
  .bar:hover { background: rgba(193,147,56,0.45); }
  .bar-tooltip { position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%); background: var(--bg-elevated); border: 1px solid var(--border); padding: 3px 7px; border-radius: 4px; font-size: 10px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.1s; font-family: 'IBM Plex Mono', monospace; }
  .bar:hover .bar-tooltip { opacity: 1; }

  /* ── Empty State ── */
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 56px 20px; color: var(--text-muted); text-align: center; }
  .empty-icon { font-size: 36px; margin-bottom: 10px; opacity: 0.4; }
  .empty-state h3 { font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 5px; font-family: 'Playfair Display', serif; }
  .empty-state p { font-size: 12.5px; }

  /* ── Tabs ── */
  .tabs { display: flex; gap: 2px; background: var(--bg-elevated); padding: 3px; border-radius: var(--radius-sm); border: 1px solid var(--border); width: fit-content; }
  .tab { padding: 6px 14px; border-radius: 5px; font-size: 12px; font-weight: 500; cursor: pointer; border: none; background: none; color: var(--text-secondary); transition: all 0.13s; font-family: 'IBM Plex Sans', sans-serif; }
  .tab.active { background: var(--bg-surface); color: var(--text-primary); box-shadow: 0 1px 4px rgba(0,0,0,0.35); }

  /* ── Filter Bar ── */
  .filter-bar { display: flex; gap: 9px; align-items: center; margin-bottom: 18px; flex-wrap: wrap; }
  .search-input-wrap { position: relative; flex: 1; min-width: 180px; }
  .search-input-wrap svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
  .search-input { padding-left: 34px !important; }

  /* ── Progress ── */
  .progress-bar { height: 3px; background: var(--bg-hover); border-radius: 2px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, var(--gold), var(--gold-light)); border-radius: 2px; transition: width 0.5s ease; }

  /* ── Notification Panel ── */
  .notif-panel {
    position: absolute; top: calc(100% + 7px); right: 0; width: 306px;
    background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius);
    box-shadow: var(--shadow); z-index: 300; overflow: hidden; animation: slideDown 0.13s ease;
  }
  .notif-header { padding: 12px 14px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .notif-item { padding: 11px 14px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.1s; }
  .notif-item:hover { background: var(--bg-hover); }
  .notif-item:last-child { border-bottom: none; }
  .notif-item.unread { background: rgba(193,147,56,0.03); }
  .notif-text { font-size: 12px; line-height: 1.45; }
  .notif-time { font-size: 10.5px; color: var(--text-muted); margin-top: 2px; }

  /* ── Loading Spinner ── */
  .spinner { width: 18px; height: 18px; border: 2px solid var(--border); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.7s linear infinite; }
  .loading-overlay { display: flex; align-items: center; justify-content: center; padding: 48px; }

  /* ── Animations ── */
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-7px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes slideIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }

  /* ── Toast ── */
  .toast-container { position: fixed; top: 72px; right: 20px; z-index: 600; display: flex; flex-direction: column; gap: 7px; pointer-events: none; }
  .toast {
    background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm);
    padding: 11px 14px; min-width: 260px; max-width: 360px;
    display: flex; align-items: flex-start; gap: 9px;
    box-shadow: var(--shadow); animation: slideIn 0.2s ease; pointer-events: all;
  }
  .toast.success { border-left: 3px solid var(--green); }
  .toast.error { border-left: 3px solid var(--red); }
  .toast.info { border-left: 3px solid var(--blue); }
  .toast-msg { font-size: 12.5px; flex: 1; }

  /* ── Auth Page ── */
  .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-base); position: relative; overflow: hidden; }
  .auth-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 65% 0%, rgba(193,147,56,0.07) 0%, transparent 55%), radial-gradient(ellipse at 10% 100%, rgba(38,200,122,0.03) 0%, transparent 50%); pointer-events: none; }
  .auth-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
    background-size: 44px 44px; mask-image: radial-gradient(ellipse at center, black 0%, transparent 68%);
  }
  .auth-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 18px; padding: 44px 38px; width: 100%; max-width: 410px; position: relative; z-index: 1; box-shadow: 0 40px 96px rgba(0,0,0,0.65); }
  .auth-logo { display: flex; align-items: center; margin-bottom: 28px; margin: auto; width: fit-content; gap: 10px; padding-bottom: 30px}
  .auth-logo .logo-mark { width: 38px; height: 38px; font-size: 15px; }
  .auth-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; margin-bottom: 5px; }
  .auth-sub { color: var(--text-secondary); font-size: 12.5px; margin-bottom: 24px; }
  .divider { height: 1px; background: var(--border); margin: 18px 0; position: relative; }
  .divider span { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); background: var(--bg-surface); padding: 0 10px; font-size: 10.5px; color: var(--text-muted); }
  .role-switch { display: flex; gap: 7px; margin-bottom: 22px; }
  .role-btn { flex: 1; padding: 9px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; font-size: 12px; font-weight: 500; color: var(--text-secondary); transition: all 0.13s; text-align: center; }
  .role-btn.active { background: var(--gold-dim); border-color: var(--gold); color: var(--gold-light); }

  /* ── Admin badge & action menu ── */
  .admin-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; background: rgba(193,147,56,0.12); color: var(--gold); border: 1px solid rgba(193,147,56,0.28); font-family: 'IBM Plex Sans', sans-serif; }
  .action-menu { position: relative; }
  .action-dropdown { position: absolute; right: 0; top: calc(100% + 3px); background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 3px; min-width: 155px; z-index: 200; box-shadow: var(--shadow); animation: slideDown 0.1s ease; }
  .action-dropdown button { display: flex; align-items: center; gap: 7px; width: 100%; padding: 7px 11px; background: none; border: none; cursor: pointer; color: var(--text-secondary); font-family: 'IBM Plex Sans', sans-serif; font-size: 12.5px; border-radius: 5px; text-align: left; transition: all 0.1s; }
  .action-dropdown button:hover { background: var(--bg-hover); color: var(--text-primary); }
  .action-dropdown button.danger:hover { background: var(--red-dim); color: var(--red); }

  /* ── Payment Method Cards ── */
  .payment-method-card {
    border: 2px solid var(--border); border-radius: var(--radius); padding: 14px 16px;
    cursor: pointer; transition: all 0.15s; background: var(--bg-elevated);
    display: flex; align-items: center; gap: 12px;
  }
  .payment-method-card:hover { border-color: var(--border-glow); background: var(--bg-hover); }
  .payment-method-card.selected { border-color: var(--gold); background: var(--gold-glow); }
  .payment-method-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .payment-details-box {
    background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 16px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; line-height: 1.9;
    animation: slideDown 0.15s ease;
  }
  .payment-detail-row { display: flex; justify-content: space-between; align-items: center; }
  .payment-detail-label { color: var(--text-secondary); font-family: 'IBM Plex Sans', sans-serif; font-size: 11.5px; }
  .payment-detail-value { color: var(--text-primary); font-weight: 500; }
  .copy-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 2px 4px; border-radius: 4px; transition: color 0.1s; font-size: 11px; }
  .copy-btn:hover { color: var(--gold); }

  /* ── Misc ── */
  .flex { display: flex; } .flex-col { flex-direction: column; } .items-center { align-items: center; }
  .justify-between { justify-content: space-between; } .gap-2 { gap: 8px; } .gap-3 { gap: 12px; }
  .mt-2 { margin-top: 8px; } .mt-3 { margin-top: 12px; } .mt-4 { margin-top: 16px; }
  .mb-4 { margin-bottom: 16px; } .mb-5 { margin-bottom: 20px; }
  .text-muted { color: var(--text-secondary); } .text-gold { color: var(--gold); } .text-green { color: var(--green); } .text-red { color: var(--red); }
  .font-mono { font-family: 'IBM Plex Mono', monospace; } .w-full { width: 100%; } .relative { position: relative; }
  .section-gap { margin-bottom: 18px; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .sidebar { transform: translateX(-100%); box-shadow: none; }
    .sidebar.open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.5); }
    .sidebar-overlay { display: block; }
    .main-wrap { margin-left: 0; }
    .grid-2 { grid-template-columns: 1fr; }
    .grid-3 { grid-template-columns: 1fr 1fr; }
    .form-row { grid-template-columns: 1fr; }
    .stats-grid { grid-template-columns: 1fr 1fr; }
    .icon-btn[data-mobile="show"] { display: flex !important; }
  }
  @media (max-width: 600px) {
    .stats-grid { grid-template-columns: 1fr; }
    .page-content { padding: 14px; }
    .grid-3 { grid-template-columns: 1fr; }
    .auth-card { padding: 28px 20px; }
    .plans-grid { grid-template-columns: 1fr; }
    .modal { max-height: 95vh; }
  }
  @media (max-width: 480px) {
    .filter-bar { flex-direction: column; align-items: stretch; }
    .tabs { width: 100%; overflow-x: auto; }
  }
    /* ── Mobile table scroll fixes ── */
.card {
  min-width: 0;
  overflow: hidden;
}

.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
}

table {
  min-width: 600px;
}

.modal .table-wrap table {
  min-width: 500px;
}

@media (max-width: 900px) {
  .page-content {
    overflow-x: hidden;
  }
  
  .main-wrap {
    min-width: 0;
    overflow-x: hidden;
  }
}

`;

// API SERVICE
const BASE_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || "http://localhost:5000/api";

const api = {
  _fetch: async (path, opts = {}) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...opts.headers },
      ...opts,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Request failed");
    return json;
  },
  get:    (p)      => api._fetch(p),
  post:   (p, b)   => api._fetch(p, { method: "POST",   body: JSON.stringify(b) }),
  put:    (p, b)   => api._fetch(p, { method: "PUT",    body: JSON.stringify(b) }),
  delete: (p)      => api._fetch(p, { method: "DELETE" }),
  upload: async (path, formData) => {
    const res = await fetch(`${BASE_URL}${path}`, { method: "POST", credentials: "include", body: formData });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Upload failed");
    return json;
  },
};

// CONTEXT
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// UTILS
const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtTime = (d) => d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const initials = (fn = "", ln = "") => `${fn[0] || ""}${ln[0] || ""}`.toUpperCase();
const daysLeft = (end) => {
  const diff = new Date(end) - new Date();
  return diff > 0 ? Math.ceil(diff / 86400000) : 0;
};

// ICONS
const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const icons = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    invest: <><path d="M3 17L9 11L13 15L21 7"/><path d="M21 7H15M21 7V13"/></>,
    deposit: <><path d="M12 5v14M5 12l7 7 7-7"/></>,
    withdraw: <><path d="M12 19V5M5 12l7-7 7 7"/></>,
    transactions: <><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></>,
    support: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
    profile: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    plans: <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></>,
    analytics: <><path d="M18 20V10M12 20V4M6 20v-6"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></>,
    close: <><path d="M18 6L6 18M6 6l12 12"/></>,
    check: <><path d="M20 6L9 17l-5-5"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>,
    dots: <><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    chevron_right: <><polyline points="9 18 15 12 9 6"/></>,
    arrow_up: <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
    arrow_down: <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    broadcast: <><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></>,
    logs: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    menu: <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    warning: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    payment: <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    refresh: <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || null}
    </svg>
  );
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Badge({ status }) {
  return (
    <span className={`badge ${status || ""}`}>
      <span className="badge-dot" style={{ background: "currentColor" }} />
      {status?.replace(/_/g, " ") || "—"}
    </span>
  );
}

function StatCard({ icon, label, value, change, changeType = "up", color = "gold", loading }) {
  const colors = { gold: "#c19338", green: "#26c87a", red: "#e04f5f", blue: "#4a8fd4", amber: "#e8a020" };
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${colors[color]}14` }}>
        {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <Icon name={icon} size={17} color={colors[color]} />}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ animation: loading ? "pulse 1.2s infinite" : "none" }}>{loading ? "···" : value}</div>
      {change && <div className={`stat-change ${changeType}`}><Icon name={changeType === "up" ? "arrow_up" : changeType === "down" ? "arrow_down" : "refresh"} size={10} />{change}</div>}
    </div>
  );
}

function Modal({ title, onClose, children, footer, large }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${large ? " modal-lg" : ""}`}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={14} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function BarChart({ data = [], color = "var(--gold)" }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div key={i} className="bar" style={{ height: `${(d.value / max) * 100}%`, background: color + "28" }}>
          <div className="bar-tooltip">{d.label}: {fmt(d.value)}</div>
        </div>
      ))}
    </div>
  );
}

function ToastContainer({ toasts }) {
  const colors = { success: "var(--green)", error: "var(--red)", info: "var(--blue)" };
  const icons  = { success: "check", error: "close", info: "bell" };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <Icon name={icons[t.type] || "bell"} size={14} color={colors[t.type]} />
          <span className="toast-msg">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─── AUTH PAGE ─────────────────────────────────────────────────────────────────
function AuthPage() {
  const { login, showToast } = useApp();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await api.post("/auth/register", form);
        login(res.data.user);
        showToast("success", "Welcome to Eckard Oil Capital!");
      } else {
        const res = await api.post("/auth/login", { email: form.email, password: form.password });
        login(res.data.user);
        showToast("success", `Welcome back, ${res.data.user.first_name}!`);
      }
    } catch (err) {
      showToast("error", err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth-page">
      <div className="auth-bg" /><div className="auth-grid" />
      <div className="auth-card">
        <div className="auth-logo">
          {/* <div className="logo-mark">E</div> */}
          <div>
            {/* <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 14 }}>Eckard Oil Capital</div> */}
            <div className="logo"><img src={logo} alt="Logo"/></div>
            <div style={{ fontSize: 9.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'IBM Plex Sans',sans-serif" }}>Investment Platform</div>
          </div>
        </div>

        <div className="role-switch">
          <button className={`role-btn ${role === "user" ? "active" : ""}`} onClick={() => setRole("user")}>Investor Login</button>
          <button className={`role-btn ${role === "admin" ? "active" : ""}`} onClick={() => setRole("admin")}>Admin Portal</button>
        </div>

        <h2 className="auth-title">{mode === "login" ? "Welcome back" : "Create account"}</h2>
        <p className="auth-sub">{mode === "login" ? "Sign in to your investment account" : "Start your oil investment journey"}</p>

        {mode === "register" && (
          <div className="form-row">
            <div className="form-group"><label className="form-label">First Name</label><input className="form-input" placeholder="John" value={form.first_name} onChange={f("first_name")} /></div>
            <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" placeholder="Doe" value={form.last_name} onChange={f("last_name")} /></div>
          </div>
        )}
        <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" type="email" placeholder="investor@example.com" value={form.email} onChange={f("email")} /></div>
        <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={f("password")} /></div>

        <button className="btn btn-primary w-full" style={{ justifyContent: "center", padding: "11px" }} onClick={handleSubmit} disabled={loading}>
          {loading ? <div className="spinner" /> : (mode === "login" ? "Sign In" : "Create Account")}
        </button>
        <div className="divider"><span>or</span></div>
        <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-secondary)" }}>
          {mode === "login" ? "New investor? " : "Already have an account? "}
          <span style={{ color: "var(--gold)", cursor: "pointer" }} onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Create account" : "Sign in"}
          </span>
        </div>
        <div style={{ marginTop: 20, padding: "11px 14px", background: "rgba(193,147,56,0.05)", borderRadius: 8, border: "1px solid rgba(193,147,56,0.14)", fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.55, display: "flex", gap: 7 }}>
          <Icon name="warning" size={12} color="var(--gold)" />
          <span><strong style={{ color: "var(--gold)" }}>Risk Disclaimer:</strong> Oil market investments carry risk. Returns are estimated, not guaranteed. Past performance does not indicate future results.</span>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, user, sidebarOpen, setSidebarOpen, pendingCounts = {} }) {
  const { logout } = useApp();
  const isAdmin = user?.role === "admin";

  const userNav = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "investments", label: "Investments", icon: "invest" },
    { id: "deposit", label: "Deposit Funds", icon: "deposit" },
    { id: "withdraw", label: "Withdraw", icon: "withdraw" },
    { id: "transactions", label: "Transactions", icon: "transactions" },
    { id: "support", label: "Support", icon: "support" },
    { id: "profile", label: "Profile", icon: "profile" },
  ];
  const adminNav = [
    { id: "admin-dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "admin-users", label: "Users", icon: "users" },
    { id: "admin-investments", label: "Investments", icon: "invest" },
    { id: "admin-deposits", label: "Deposits", icon: "deposit", badge: pendingCounts.deposits },
    { id: "admin-withdrawals", label: "Withdrawals", icon: "withdraw", badge: pendingCounts.withdrawals },
    { id: "admin-plans", label: "Plans", icon: "plans" },
    { id: "admin-payments", label: "Payment Methods", icon: "payment" },
    { id: "admin-support", label: "Support", icon: "support", badge: pendingCounts.tickets },
    { id: "admin-analytics", label: "Analytics", icon: "analytics" },
    { id: "admin-broadcast", label: "Broadcast", icon: "broadcast" },
    { id: "admin-logs", label: "Admin Logs", icon: "logs" },
  ];
  const nav = isAdmin ? adminNav : userNav;

  const navigate = (id) => { setPage(id); if (sidebarOpen) setSidebarOpen(false); };

  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <nav className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <div className="logo1"><img src={logo1} alt="favicon" /></div>
          <div className="logo-text">Eckard Oil<span>Capital Investment</span></div>
        </div>
        <div className="sidebar-nav">
          {isAdmin && <div className="nav-section-label">Administration</div>}
          {nav.map(item => (
            <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}>
              <span className="nav-icon"><Icon name={item.icon} size={14} /></span>
              {item.label}
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          {isAdmin && <div className="admin-badge" style={{ marginBottom: 9, display: "flex" }}><Icon name="shield" size={10} /> Administrator</div>}
          <div className="user-chip" onClick={logout}>
            <div className="avatar">{user?.avatar ? <img src={`http://localhost:5000${user.avatar}`} alt="" /> : initials(user?.first_name, user?.last_name)}</div>
            <div className="user-info">
              <div className="user-name">{user?.first_name} {user?.last_name}</div>
              <div className="user-role">{user?.role} | INVESTOR</div>
            </div>
            <Icon name="logout" size={12} color="var(--text-muted)" />
          </div>
        </div>
      </nav>
    </>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ title, subtitle, setSidebarOpen, userId }) {
  const { showToast } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!userId) return;
    api.get("/user/notifications?limit=8").then(r => {
      setNotifs(r.data || []);
    }).catch(() => {});
    api.get("/user/notifications/unread").then(r => { setUnread(r.data?.count || 0); }).catch(() => {});
  }, [userId]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const markAllRead = async () => {
    try { await api.put("/user/notifications/read-all"); setUnread(0); setNotifs(n => n.map(x => ({ ...x, is_read: true }))); } catch {}
  };

  return (
    <div className="topbar">
      <button className="icon-btn" data-mobile="show" style={{ display: "none" }} onClick={() => setSidebarOpen(p => !p)}>
        <Icon name="menu" size={15} />
      </button>
      <div style={{ flex: 1 }}>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
      </div>
      <div className="topbar-actions">
        <div className="relative" ref={ref}>
          <button className="icon-btn" onClick={() => setNotifOpen(p => !p)}>
            <Icon name="bell" size={14} />
            {unread > 0 && <div className="notif-dot" />}
          </button>
          {notifOpen && (
            <div className="notif-panel">
              <div className="notif-header">
                <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 600, fontSize: 13 }}>Notifications</span>
                {unread > 0 && <span style={{ fontSize: 11, color: "var(--gold)", cursor: "pointer" }} onClick={markAllRead}>Mark all read</span>}
              </div>
              {notifs.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>No notifications</div>
              ) : notifs.map(n => (
                <div key={n.id} className={`notif-item ${!n.is_read ? "unread" : ""}`}>
                  <div className="notif-text"><strong>{n.title}</strong> — {n.message}</div>
                  <div className="notif-time">{fmtTime(n.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  USER PAGES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── USER DASHBOARD ───────────────────────────────────────────────────────────
function UserDashboard({ setPage }) {
  const { user } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/user/dashboard").then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const s = data?.stats || {};

  return (
    <div>
      <div className="stats-grid">
        <StatCard icon="payment" label="Portfolio Balance" value={fmt(data?.balance)} change="Available to invest" changeType="neutral" color="gold" loading={loading} />
        <StatCard icon="invest" label="Total Invested" value={fmt(s.total_invested)} change={`${s.total_investments || 0} investments`} changeType="neutral" color="blue" loading={loading} />
        <StatCard icon="analytics" label="Total Returns" value={fmt(s.total_profit)} change="Profit earned" changeType="up" color="green" loading={loading} />
        <StatCard icon="deposit" label="Pending Requests" value={(s.pending_deposits || 0) + (s.pending_withdrawals || 0)} change={`${s.pending_deposits || 0} deposits · ${s.pending_withdrawals || 0} withdrawals`} changeType="neutral" color="amber" loading={loading} />
      </div>

      <div className="grid-2 section-gap">
        <div className="balance-card">
          <div className="balance-label">Available Balance</div>
          <div className="balance-amount">{loading ? "···" : fmt(data?.balance)}</div>
          <div className="balance-sub">Last updated just now</div>
          <div style={{ display: "flex", gap: 9, marginTop: 18 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setPage("deposit")}><Icon name="deposit" size={12} /> Deposit</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage("withdraw")}><Icon name="withdraw" size={12} /> Withdraw</button>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">Investment Activity</div><div className="card-subtitle">Active positions overview</div></div>
          </div>
          {loading ? <div className="loading-overlay"><div className="spinner" /></div> :
            (data?.active_investments || []).length === 0 ? (
              <div className="empty-state" style={{ padding: "30px 0" }}>
                <div className="empty-icon">📊</div>
                <h3>No active investments</h3>
                <p>Browse plans to get started</p>
              </div>
            ) : data.active_investments.map(inv => (
              <div key={inv.uuid} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{inv.plan_name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Matures in {daysLeft(inv.end_date)} days</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gold-light)", fontFamily: "'IBM Plex Mono',monospace" }}>{fmt(inv.amount)}</div>
                    <div style={{ fontSize: 11, color: "var(--green)" }}>+{fmt(inv.profit)} est.</div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(((inv.duration_days - daysLeft(inv.end_date)) / inv.duration_days) * 100, 100)}%` }} />
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Transactions</div>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage("transactions")}>View All</button>
        </div>
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> :
          (data?.recent_transactions || []).slice(0, 5).map((tx, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: ["deposit","profit"].includes(tx.type) ? "var(--green-dim)" : "var(--red-dim)" }}>
                <Icon name={["deposit","profit"].includes(tx.type) ? "arrow_down" : "arrow_up"} size={13} color={["deposit","profit"].includes(tx.type) ? "var(--green)" : "var(--red)"} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5 }}>{tx.description}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{fmtDate(tx.created_at)}</div>
              </div>
              <div style={{ color: ["deposit","profit"].includes(tx.type) ? "var(--green)" : "var(--red)", fontWeight: 600, fontSize: 13, fontFamily: "'IBM Plex Mono',monospace" }}>
                {["deposit","profit"].includes(tx.type) ? "+" : "-"}{fmt(tx.amount)}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── INVEST PAGE ──────────────────────────────────────────────────────────────
function InvestPage() {
  const { user, showToast } = useApp();
  const [tab, setTab] = useState("plans");
  const [plans, setPlans] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(user?.balance || 0);

  useEffect(() => {
    Promise.all([
      api.get("/user/plans"),
      api.get("/user/investments?limit=50"),
      api.get("/user/dashboard"),
    ]).then(([p, i, d]) => {
      setPlans(p.data || []);
      setInvestments(i.data || []);
      setBalance(d.data?.balance || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const invest = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < selectedPlan.min_amount || amt > selectedPlan.max_amount) {
      return showToast("error", `Amount must be between ${fmt(selectedPlan.min_amount)} and ${fmt(selectedPlan.max_amount)}`);
    }
    if (amt > balance) return showToast("error", "Insufficient balance. Please deposit funds first.");
    setSubmitting(true);
    try {
      await api.post("/user/investments", { plan_id: selectedPlan.id, amount: amt });
      showToast("success", `Investment of ${fmt(amt)} in ${selectedPlan.name} activated!`);
      setSelectedPlan(null); setAmount("");
      const [i, d] = await Promise.all([api.get("/user/investments?limit=50"), api.get("/user/dashboard")]);
      setInvestments(i.data || []); setBalance(d.data?.balance || 0);
    } catch (err) { showToast("error", err.message); }
    finally { setSubmitting(false); }
  };

  const active = investments.filter(i => i.status === "active");
  const history = investments;

  return (
    <div>
      <div className="tabs mb-4">
        {[["plans","Browse Plans"],["active","Active"],["history","History"]].map(([t, l]) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {tab === "plans" && (
        <>
          <div style={{ marginBottom: 18, padding: "13px 15px", background: "rgba(193,147,56,0.05)", borderRadius: 9, border: "1px solid rgba(193,147,56,0.14)", fontSize: 12, color: "var(--text-secondary)", display: "flex", gap: 8 }}>
            <Icon name="warning" size={13} color="var(--amber)" />
            <span>Investment returns are estimates based on current market conditions. Oil & gas investments carry inherent market risk. Past performance does not guarantee future results.</span>
          </div>
          {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
            <div className="plans-grid">
              {plans.map(plan => (
                <div key={plan.id} className={`plan-card ${plan.featured ? "featured" : ""}`} onClick={() => setSelectedPlan(plan)}>
                  <div className="plan-tier">{plan.name}</div>
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-range" style={{ fontFamily: "'IBM Plex Mono',monospace" }}>{fmt(plan.min_amount)} – {fmt(plan.max_amount)}</div>
                  <div className="plan-roi">{plan.roi_min === plan.roi_max ? `${plan.roi_max}%` : `${plan.roi_min}–${plan.roi_max}%`}<span> ROI</span></div>
                  <div className="plan-duration">{plan.duration_days} day{plan.duration_days > 1 ? "s" : ""} duration</div>
                  <ul className="plan-features">
                    {(typeof plan.features === "string" ? JSON.parse(plan.features) : plan.features || []).map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                  <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan); }}>
                    Invest Now <Icon name="chevron_right" size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "active" && (
        <div className="card">
          {loading ? <div className="loading-overlay"><div className="spinner" /></div> : active.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📈</div><h3>No active investments</h3><p>Choose a plan to invest</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Plan</th><th>Amount</th><th>Est. Profit</th><th>Return</th><th>End Date</th><th>Progress</th><th>Status</th></tr></thead>
                <tbody>
                  {active.map(inv => (
                    <tr key={inv.uuid}>
                      <td><strong>{inv.plan_name}</strong></td>
                      <td className="font-mono">{fmt(inv.amount)}</td>
                      <td style={{ color: "var(--green)" }} className="font-mono">+{fmt(inv.profit)}</td>
                      <td style={{ fontWeight: 600, color: "var(--gold-light)" }} className="font-mono">{fmt(inv.total_return)}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{fmtDate(inv.end_date)}</td>
                      <td style={{ width: 100 }}>
                        <div className="progress-bar" style={{ marginBottom: 3 }}>
                          <div className="progress-fill" style={{ width: `${Math.min(((inv.duration_days - daysLeft(inv.end_date)) / inv.duration_days) * 100, 100)}%` }} />
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{daysLeft(inv.end_date)}d left</div>
                      </td>
                      <td><Badge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="card">
          {loading ? <div className="loading-overlay"><div className="spinner" /></div> : history.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📋</div><h3>No investment history</h3></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Plan</th><th>Amount</th><th>Profit</th><th>Total Return</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
                <tbody>
                  {history.map(inv => (
                    <tr key={inv.uuid}>
                      <td><strong>{inv.plan_name}</strong></td>
                      <td className="font-mono">{fmt(inv.amount)}</td>
                      <td style={{ color: "var(--green)" }} className="font-mono">+{fmt(inv.profit)}</td>
                      <td style={{ fontWeight: 600 }} className="font-mono">{fmt(inv.total_return)}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{fmtDate(inv.start_date)}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{fmtDate(inv.end_date)}</td>
                      <td><Badge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedPlan && (
        <Modal title={`Invest — ${selectedPlan.name}`} onClose={() => { setSelectedPlan(null); setAmount(""); }}
          footer={<><button className="btn btn-ghost" onClick={() => setSelectedPlan(null)}>Cancel</button><button className="btn btn-primary" onClick={invest} disabled={submitting}>{submitting ? <div className="spinner" /> : "Confirm Investment"}</button></>}>
          <div style={{ marginBottom: 18, padding: 14, background: "var(--bg-elevated)", borderRadius: 9 }}>
            {[["Plan", selectedPlan.name], ["Expected ROI", `${selectedPlan.roi_min}–${selectedPlan.roi_max}%`], ["Duration", `${selectedPlan.duration_days} days`], ["Available Balance", fmt(balance)]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ color: "var(--text-secondary)", fontSize: 11.5 }}>{k}</span>
                <strong style={{ fontSize: 12.5, color: k === "Available Balance" ? "var(--green)" : k === "Expected ROI" ? "var(--gold)" : "var(--text-primary)" }}>{v}</strong>
              </div>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">Investment Amount (USD)</label>
            <div className="amount-input-wrap"><span className="amount-prefix">$</span><input className="form-input amount-input" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} min={selectedPlan.min_amount} max={selectedPlan.max_amount} /></div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 5 }}>Range: {fmt(selectedPlan.min_amount)} – {fmt(selectedPlan.max_amount)}</div>
          </div>
          {amount && parseFloat(amount) > 0 && (
            <div style={{ padding: 13, background: "var(--green-dim)", borderRadius: 8, border: "1px solid var(--green)", fontSize: 12 }}>
              <div style={{ color: "var(--green)", fontWeight: 600, marginBottom: 3 }}>Estimated Return</div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace" }}>
                {fmt(parseFloat(amount))} + {fmt(parseFloat(amount) * selectedPlan.roi_min / 100)} profit = <strong>{fmt(parseFloat(amount) * (1 + selectedPlan.roi_min / 100))}</strong>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── DEPOSIT PAGE ─────────────────────────────────────────────────────────────
function DepositPage() {
  const { showToast } = useApp();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [form, setForm] = useState({ amount: "", reference: "", notes: "" });
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    api.get("/payment-methods").then(r => {
      const methods = r.data || [];
      setPaymentMethods(methods);
      if (methods.length > 0) setSelectedMethod(methods[0]);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, []);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key); setTimeout(() => setCopied(""), 2000);
    showToast("info", "Copied to clipboard!");
  };

  const submit = async () => {
    if (!form.amount || parseFloat(form.amount) < 1) return showToast("error", "Enter a valid deposit amount");
    if (!selectedMethod) return showToast("error", "Please select a payment method");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("amount", form.amount);
      fd.append("method", selectedMethod.type || selectedMethod.name);
      fd.append("reference", form.reference || "");
      fd.append("notes", form.notes || "");
      if (file) fd.append("proof_image", file);
      await api.upload("/user/deposits", fd);
      setSubmitted(true);
      showToast("success", "Deposit request submitted successfully!");
    } catch (err) { showToast("error", err.message); }
    finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div style={{ maxWidth: 560 }}>
      <div className="card" style={{ textAlign: "center", padding: 48 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--green-dim)", border: "2px solid var(--green)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="check" size={26} color="var(--green)" />
        </div>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, marginBottom: 7 }}>Deposit Submitted</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: 22, fontSize: 13 }}>Your deposit of <strong style={{ color: "var(--gold)" }}>{fmt(parseFloat(form.amount))}</strong> via <strong>{selectedMethod?.name}</strong> is under review. You'll be notified once approved.</p>
        <button className="btn btn-ghost" onClick={() => { setSubmitted(false); setForm({ amount: "", reference: "", notes: "" }); setFile(null); }}>Make Another Deposit</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 660 }}>
      <div style={{ marginBottom: 18, padding: "13px 15px", background: "var(--blue-dim)", borderRadius: 9, border: "1px solid rgba(74,143,212,0.28)", fontSize: 12 }}>
        <strong style={{ color: "var(--blue)" }}>Deposit Instructions</strong>
        <div style={{ color: "var(--text-secondary)", marginTop: 4 }}>Select a payment method, transfer funds using the provided details, then submit your proof of payment. Deposits are reviewed within 1–4 business hours.</div>
      </div>

      {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
        <>
          {/* Payment Method Selection */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 14 }}>Select Payment Method</div>
            {paymentMethods.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No payment methods configured. Please contact support.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {paymentMethods.filter(m => m.is_active).map(method => (
                  <div key={method.id} className={`payment-method-card ${selectedMethod?.id === method.id ? "selected" : ""}`} onClick={() => setSelectedMethod(method)}>
                    <div className="payment-method-icon" style={{ background: "var(--gold-dim)" }}>{method.icon || "💳"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{method.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>{method.description || method.type}</div>
                    </div>
                    {selectedMethod?.id === method.id && <Icon name="check" size={15} color="var(--gold)" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Details */}
          {selectedMethod && selectedMethod.details && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title" style={{ marginBottom: 14 }}>
                {selectedMethod.icon} {selectedMethod.name} — Payment Details
              </div>
              <div className="payment-details-box">
                {Object.entries(
                  typeof selectedMethod.details === "string"
                    ? JSON.parse(selectedMethod.details)
                    : selectedMethod.details
                ).map(([k, v]) => (
                  <div key={k} className="payment-detail-row" style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <span className="payment-detail-label">{k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span className="payment-detail-value">{v}</span>
                      <button className="copy-btn" onClick={() => copy(v, k)} title="Copy">
                        {copied === k ? <Icon name="check" size={12} color="var(--green)" /> : <Icon name="copy" size={12} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {selectedMethod.instructions && (
                <div style={{ marginTop: 12, padding: "11px 14px", background: "var(--amber-dim)", borderRadius: 8, border: "1px solid rgba(232,160,32,0.2)", fontSize: 12, color: "var(--text-secondary)" }}>
                  <Icon name="warning" size={12} color="var(--amber)" /> <strong style={{ color: "var(--amber)" }}>Note: </strong>{selectedMethod.instructions}
                </div>
              )}
            </div>
          )}

          {/* Deposit Form */}
          {selectedMethod && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>Confirm Your Transfer</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount (USD)</label>
                  <div className="amount-input-wrap"><span className="amount-prefix">$</span><input className="form-input amount-input" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                </div>
                <div className="form-group">
                  <label className="form-label">Transaction Reference</label>
                  <input className="form-input" placeholder="Bank ref / TxID / Hash" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Proof of Payment <span style={{ color: "var(--text-muted)" }}>(optional but recommended)</span></label>
                <div style={{ border: "2px dashed var(--border)", borderRadius: 9, padding: "22px", textAlign: "center", cursor: "pointer", transition: "border-color 0.15s", background: file ? "var(--green-dim)" : "transparent" }}
                  onClick={() => fileRef.current?.click()}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                  <input ref={fileRef} type="file" style={{ display: "none" }} accept=".jpg,.jpeg,.png,.pdf,.webp" onChange={e => setFile(e.target.files?.[0] || null)} />
                  {file ? (
                    <div style={{ color: "var(--green)", fontSize: 13 }}><Icon name="check" size={16} color="var(--green)" /> {file.name}</div>
                  ) : (
                    <>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>Click to upload receipt</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>JPG, PNG, PDF, WEBP · Max 5MB</div>
                    </>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
                <textarea className="form-textarea" rows={2} placeholder="Any additional info..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} onClick={submit} disabled={submitting}>
                {submitting ? <div className="spinner" /> : <><Icon name="deposit" size={13} /> Submit Deposit Request</>}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── WITHDRAW PAGE ────────────────────────────────────────────────────────────
function WithdrawPage() {
  const { user, showToast } = useApp();
  const [balance, setBalance] = useState(user?.balance || 0);
  const [form, setForm] = useState({ amount: "", method: "bank_transfer", bank_name: "", account_number: "", account_name: "", routing_number: "", wallet_address: "", wallet_network: "ERC-20", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/user/dashboard").then(r => setBalance(r.data?.balance || 0)).catch(() => {});
  }, []);

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return showToast("error", "Enter a valid amount");
    if (parseFloat(form.amount) > balance) return showToast("error", "Insufficient balance");
    setSubmitting(true);
    try {
      const account_details = form.method === "bank_transfer"
        ? { bank_name: form.bank_name, account_number: form.account_number, account_name: form.account_name, routing_number: form.routing_number }
        : { wallet_address: form.wallet_address, wallet_network: form.wallet_network };
      await api.post("/user/withdrawals", { amount: parseFloat(form.amount), method: form.method, account_details, notes: form.notes });
      setSubmitted(true);
    } catch (err) { showToast("error", err.message); }
    finally { setSubmitting(false); }
  };

  if (submitted) return (
    <div style={{ maxWidth: 560 }}>
      <div className="card" style={{ textAlign: "center", padding: 48 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--green-dim)", border: "2px solid var(--green)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="check" size={26} color="var(--green)" />
        </div>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, marginBottom: 7 }}>Request Submitted</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: 22, fontSize: 13 }}>Your withdrawal of <strong style={{ color: "var(--gold)" }}>{fmt(parseFloat(form.amount))}</strong> is pending admin approval.</p>
        <button className="btn btn-ghost" onClick={() => { setSubmitted(false); setForm({ ...form, amount: "" }); }}>New Request</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 580 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, padding: "11px 14px", background: "var(--bg-elevated)", borderRadius: 9 }}>
          <div style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>Available Balance</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 20, color: "var(--gold-light)" }}>{fmt(balance)}</div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Withdrawal Amount</label>
            <div className="amount-input-wrap"><span className="amount-prefix">$</span><input className="form-input amount-input" type="number" value={form.amount} onChange={f("amount")} placeholder="0.00" /></div>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-select" value={form.method} onChange={f("method")}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="crypto">Cryptocurrency</option>
              <option value="wire">International Wire</option>
            </select>
          </div>
        </div>

        {form.method === "bank_transfer" || form.method === "wire" ? (
          <>
            <div className="form-group"><label className="form-label">Bank Name</label><input className="form-input" placeholder="e.g. Chase Bank" value={form.bank_name} onChange={f("bank_name")} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Account Number</label><input className="form-input" placeholder="Account number" value={form.account_number} onChange={f("account_number")} /></div>
              <div className="form-group"><label className="form-label">Account Name</label><input className="form-input" placeholder="Name on account" value={form.account_name} onChange={f("account_name")} /></div>
            </div>
            <div className="form-group"><label className="form-label">Routing / SWIFT / IBAN</label><input className="form-input" placeholder="Routing number or SWIFT code" value={form.routing_number} onChange={f("routing_number")} /></div>
          </>
        ) : (
          <div className="form-row">
            <div className="form-group"><label className="form-label">Wallet Address</label><input className="form-input" placeholder="0x... or wallet address" value={form.wallet_address} onChange={f("wallet_address")} /></div>
            <div className="form-group"><label className="form-label">Network</label>
              <select className="form-select" value={form.wallet_network} onChange={f("wallet_network")}>
                <option value="ERC-20">ERC-20 (Ethereum)</option>
                <option value="TRC-20">TRC-20 (Tron)</option>
                <option value="BEP-20">BEP-20 (BSC)</option>
                <option value="BTC">Bitcoin</option>
              </select>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Notes <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
          <textarea className="form-textarea" rows={2} value={form.notes} onChange={f("notes")} placeholder="Additional instructions..." />
        </div>

        <div style={{ padding: "9px 13px", background: "var(--amber-dim)", borderRadius: 7, border: "1px solid rgba(232,160,32,0.2)", fontSize: 11.5, color: "var(--text-secondary)", marginBottom: 14, display: "flex", gap: 7 }}>
          <Icon name="warning" size={13} color="var(--amber)" />
          <span>Only one pending withdrawal allowed at a time. Funds are deducted only after admin approval.</span>
        </div>

        <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} onClick={submit} disabled={submitting}>
          {submitting ? <div className="spinner" /> : <><Icon name="withdraw" size={13} /> Submit Withdrawal Request</>}
        </button>
      </div>
    </div>
  );
}

// ─── TRANSACTIONS PAGE ────────────────────────────────────────────────────────
function TransactionsPage() {
  const [filter, setFilter] = useState("all");
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const typeParam = filter !== "all" ? `&type=${filter}` : "";
    api.get(`/user/transactions?page=${page}&limit=20${typeParam}`).then(r => {
      setTransactions(r.data || []);
      setPagination(r.pagination || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filter, page]);

  const typeColors = { deposit: "var(--green)", withdrawal: "var(--red)", investment: "var(--blue)", profit: "var(--gold)", refund: "var(--purple)" };
  const typeIcons  = { deposit: "deposit", withdrawal: "withdraw", investment: "invest", profit: "analytics", refund: "refresh" };

  return (
    <div>
      <div className="filter-bar">
        <div className="tabs">
          {["all","deposit","withdrawal","investment","profit"].map(t => (
            <button key={t} className={`tab ${filter === t ? "active" : ""}`} onClick={() => { setFilter(t); setPage(1); }} style={{ textTransform: "capitalize" }}>{t}</button>
          ))}
        </div>
      </div>
      <div className="card">
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : transactions.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><h3>No transactions found</h3></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Type</th><th>Description</th><th>Amount</th><th>Balance After</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 6, background: `${typeColors[tx.type] || "var(--text-muted)"}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name={typeIcons[tx.type] || "transactions"} size={11} color={typeColors[tx.type] || "var(--text-secondary)"} />
                        </div>
                        <span style={{ textTransform: "capitalize", fontSize: 12 }}>{tx.type}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)", maxWidth: 200 }}>{tx.description}</td>
                    <td style={{ fontWeight: 600, color: ["deposit","profit","refund"].includes(tx.type) ? "var(--green)" : "var(--red)", fontFamily: "'IBM Plex Mono',monospace" }}>
                      {["deposit","profit","refund"].includes(tx.type) ? "+" : "-"}{fmt(tx.amount)}
                    </td>
                    <td style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}>{fmt(tx.balance_after)}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{fmtDate(tx.created_at)}</td>
                    <td><Badge status={tx.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "16px 0 0", borderTop: "1px solid var(--border)" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
            <span style={{ padding: "6px 12px", fontSize: 12, color: "var(--text-secondary)" }}>Page {page} of {pagination.totalPages}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SUPPORT PAGE ─────────────────────────────────────────────────────────────
function SupportPage() {
  const { showToast } = useApp();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({ subject: "", message: "", priority: "medium" });
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/user/support?limit=30").then(r => { setTickets(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const openTicket = async (ticket) => {
    setSelected(ticket);
    try {
      const r = await api.get(`/user/support/${ticket.uuid}`);
      setMessages(r.data?.messages || []);
    } catch {}
  };

  const submitTicket = async () => {
    if (!form.subject || !form.message) return showToast("error", "Please fill all fields");
    setSubmitting(true);
    try {
      const r = await api.post("/user/support", form);
      setTickets(t => [r.data, ...t]);
      showToast("success", "Support ticket submitted!");
      setShowForm(false); setForm({ subject: "", message: "", priority: "medium" });
    } catch (err) { showToast("error", err.message); }
    finally { setSubmitting(false); }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      await api.post(`/user/support/${selected.uuid}/reply`, { message: reply });
      setMessages(m => [...m, { message: reply, is_admin: false, created_at: new Date(), sender_id: 0 }]);
      setReply("");
    } catch (err) { showToast("error", err.message); }
  };

  return (
    <div>
      <div style={{ marginBottom: 18, display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Icon name="plus" size={13} /> New Ticket</button>
      </div>

      <div className="card">
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : tickets.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">💬</div><h3>No tickets yet</h3><p>Open a ticket if you need help</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Subject</th><th>Priority</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.uuid}>
                    <td><strong>{t.subject}</strong></td>
                    <td><Badge status={t.priority} /></td>
                    <td><Badge status={t.status} /></td>
                    <td style={{ color: "var(--text-secondary)" }}>{fmtDate(t.created_at)}</td>
                    <td><button className="btn btn-ghost btn-xs" onClick={() => openTicket(t)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <Modal title="New Support Ticket" onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={submitTicket} disabled={submitting}>{submitting ? <div className="spinner" /> : "Submit Ticket"}</button></>}>
          <div className="form-group"><label className="form-label">Subject</label><input className="form-input" placeholder="Brief description of your issue" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Priority</label><select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
          <div className="form-group"><label className="form-label">Message</label><textarea className="form-textarea" rows={5} placeholder="Describe your issue in detail..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
        </Modal>
      )}

      {selected && (
        <Modal title={selected.subject} onClose={() => setSelected(null)} large
          footer={<>
            <input className="form-input" style={{ flex: 1 }} placeholder="Type your reply..." value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()} />
            <button className="btn btn-primary" onClick={sendReply}><Icon name="broadcast" size={13} /> Send</button>
          </>}>
          <div style={{ maxHeight: 340, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.is_admin ? "flex-start" : "flex-end" }}>
                <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: 10, background: m.is_admin ? "var(--bg-elevated)" : "var(--gold-dim)", border: "1px solid var(--border)", fontSize: 12.5, lineHeight: 1.5 }}>
                  {m.is_admin && <div style={{ fontSize: 10, color: "var(--gold)", fontWeight: 600, marginBottom: 4 }}>Support Team</div>}
                  {m.message}
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{fmtTime(m.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
function ProfilePage() {
  const { user, setUser, showToast } = useApp();
  const [form, setForm] = useState({ first_name: user?.first_name || "", last_name: user?.last_name || "", phone: user?.phone || "", country: user?.country || "", address: user?.address || "" });
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const fileRef = useRef(null);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const r = await api.put("/user/profile", form);
      setUser(r.data);
      showToast("success", "Profile updated successfully!");
    } catch (err) { showToast("error", err.message); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwForm.new_password !== pwForm.confirm) return showToast("error", "Passwords do not match");
    setPwSaving(true);
    try {
      await api.put("/auth/change-password", { current_password: pwForm.current_password, new_password: pwForm.new_password });
      showToast("success", "Password changed successfully!");
      setPwForm({ current_password: "", new_password: "", confirm: "" });
    } catch (err) { showToast("error", err.message); }
    finally { setPwSaving(false); }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append("avatar", file);
    try {
      const r = await api.upload("/user/profile/avatar", fd);
      setUser(u => ({ ...u, avatar: r.data.avatar }));
      showToast("success", "Avatar updated!");
    } catch (err) { showToast("error", err.message); }
  };

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const pf = (k) => (e) => setPwForm({ ...pwForm, [k]: e.target.value });

  return (
    <div className="grid-2">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
            <div style={{ position: "relative" }}>
              <div className="avatar" style={{ width: 56, height: 56, fontSize: 18 }}>
                {user?.avatar ? <img src={`http://localhost:5000${user.avatar}`} alt="" /> : initials(user?.first_name, user?.last_name)}
              </div>
              <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: "50%", background: "var(--gold)", border: "2px solid var(--bg-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="edit" size={9} color="var(--bg-base)" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={uploadAvatar} />
            </div>
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 600, fontSize: 16 }}>{user?.first_name} {user?.last_name}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{user?.email}</div>
              <Badge status={user?.status} />
            </div>
          </div>
          <div className="card-title" style={{ marginBottom: 14 }}>Personal Information</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">First Name</label><input className="form-input" value={form.first_name} onChange={f("first_name")} /></div>
            <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" value={form.last_name} onChange={f("last_name")} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={f("phone")} /></div>
            <div className="form-group"><label className="form-label">Country</label><input className="form-input" value={form.country} onChange={f("country")} /></div>
          </div>
          <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={f("address")} /></div>
          <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? <div className="spinner" /> : "Save Changes"}</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>Change Password</div>
        <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" value={pwForm.current_password} onChange={pf("current_password")} /></div>
        <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" value={pwForm.new_password} onChange={pf("new_password")} /></div>
        <div className="form-group"><label className="form-label">Confirm New Password</label><input className="form-input" type="password" value={pwForm.confirm} onChange={pf("confirm")} /></div>
        <div style={{ marginBottom: 14, padding: "9px 12px", background: "var(--bg-elevated)", borderRadius: 7, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Password must be at least 8 characters and include uppercase, lowercase, and a number.
        </div>
        <button className="btn btn-primary" onClick={changePassword} disabled={pwSaving}>{pwSaving ? <div className="spinner" /> : "Update Password"}</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN PAGES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/dashboard").then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const s = data?.stats || {};

  return (
    <div>
      <div className="stats-grid">
        <StatCard icon="users" label="Total Users" value={s.total_users} change={`${s.active_users || 0} active`} changeType="up" color="blue" loading={loading} />
        <StatCard icon="invest" label="Investment Volume" value={fmt(s.investment_volume)} change={`${s.active_investments || 0} active`} changeType="up" color="gold" loading={loading} />
        <StatCard icon="deposit" label="Total Deposits" value={fmt(s.total_deposits)} change={`${s.pending_deposits || 0} pending`} changeType="neutral" color="green" loading={loading} />
        <StatCard icon="withdraw" label="Total Withdrawals" value={fmt(s.total_withdrawals)} change={`${s.pending_withdrawals || 0} pending`} changeType="neutral" color="amber" loading={loading} />
        <StatCard icon="analytics" label="Platform Profit" value={fmt(s.platform_profit)} change="Realized from completed" changeType="up" color="gold" loading={loading} />
        <StatCard icon="support" label="Open Tickets" value={s.open_tickets} change="Awaiting response" changeType="neutral" color="blue" loading={loading} />
      </div>

      <div className="grid-2 section-gap">
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">Revenue Trend</div><div className="card-subtitle">Monthly deposit revenue · last 12 months</div></div>
          </div>
          {loading ? <div className="loading-overlay"><div className="spinner" /></div> : <BarChart data={(data?.charts?.revenue || []).map(r => ({ label: r.month?.slice(-2), value: parseFloat(r.total) }))} color="var(--gold)" />}
        </div>
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">User Growth</div><div className="card-subtitle">New registrations monthly</div></div>
          </div>
          {loading ? <div className="loading-overlay"><div className="spinner" /></div> : <BarChart data={(data?.charts?.user_growth || []).map(r => ({ label: r.month?.slice(-2), value: r.new_users }))} color="var(--blue)" />}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Recent Deposits</div>
          {(data?.recent?.deposits || []).map((d, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{d.first_name} {d.last_name}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{fmtDate(d.created_at)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 600, fontSize: 13, fontFamily: "'IBM Plex Mono',monospace", color: "var(--gold-light)" }}>{fmt(d.amount)}</div>
                <Badge status={d.status} />
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Recent Withdrawals</div>
          {(data?.recent?.withdrawals || []).map((w, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{w.first_name} {w.last_name}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{fmtDate(w.created_at)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 600, fontSize: 13, fontFamily: "'IBM Plex Mono',monospace", color: "var(--red)" }}>{fmt(w.amount)}</div>
                <Badge status={w.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN USERS ──────────────────────────────────────────────────────────────
function AdminUsers() {
  const { showToast } = useApp();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/admin/users?limit=50${search ? `&search=${search}` : ""}`).then(r => { setUsers(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const openEdit = (u) => { setEditUser(u); setEditForm({ balance: u.balance, role: u.role, status: u.status }); };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${editUser.id}`, editForm);
      showToast("success", "User updated!"); setEditUser(null); load();
    } catch (err) { showToast("error", err.message); }
    finally { setSaving(false); }
  };

  const toggleBan = async (u) => {
    try {
      await api.put(`/admin/users/${u.id}`, { status: u.status === "banned" ? "active" : "banned" });
      showToast("info", `User ${u.status === "banned" ? "unbanned" : "banned"}`); load();
    } catch (err) { showToast("error", err.message); }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete ${u.first_name} ${u.last_name}? This action cannot be undone.`)) return;
    try { await api.delete(`/admin/users/${u.id}`); showToast("info", "User deleted"); load(); }
    catch (err) { showToast("error", err.message); }
  };

  return (
    <div>
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Icon name="search" size={13} />
          <input className="form-input search-input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: "auto" }}>{users.length} users</div>
      </div>
      <div className="card">
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Balance</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{initials(u.first_name, u.last_name)}</div>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 500 }}>{u.first_name} {u.last_name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace" }}>{fmt(u.balance)}</td>
                    <td><Badge status={u.role} /></td>
                    <td style={{ color: "var(--text-secondary)" }}>{fmtDate(u.created_at)}</td>
                    <td><Badge status={u.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button className="btn btn-ghost btn-xs" onClick={() => openEdit(u)}><Icon name="edit" size={11} /></button>
                        <button className={`btn btn-xs ${u.status === "banned" ? "btn-success" : "btn-danger"}`} onClick={() => toggleBan(u)}>{u.status === "banned" ? "Unban" : "Ban"}</button>
                        <button className="btn btn-danger btn-xs" onClick={() => deleteUser(u)}><Icon name="trash" size={11} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editUser && (
        <Modal title={`Edit: ${editUser.first_name} ${editUser.last_name}`} onClose={() => setEditUser(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setEditUser(null)}>Cancel</button><button className="btn btn-primary" onClick={saveEdit} disabled={saving}>{saving ? <div className="spinner" /> : "Save Changes"}</button></>}>
          <div className="form-group">
            <label className="form-label">Balance (USD)</label>
            <div className="amount-input-wrap"><span className="amount-prefix">$</span><input className="form-input amount-input" type="number" value={editForm.balance} onChange={e => setEditForm({ ...editForm, balance: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}><option value="user">User</option><option value="admin">Admin</option></select></div>
            <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}><option value="active">Active</option><option value="suspended">Suspended</option><option value="banned">Banned</option></select></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ADMIN DEPOSITS ───────────────────────────────────────────────────────────
function AdminDeposits() {
  const { showToast } = useApp();
  const [deposits, setDeposits] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = () => {
    setLoading(true);
    const q = filter !== "all" ? `?status=${filter}` : "";
    api.get(`/admin/deposits${q}&limit=50`).then(r => { setDeposits(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, [filter]);

  const approve = async (d) => {
    try { await api.put(`/admin/deposits/${d.id}/approve`); showToast("success", "Deposit approved. Balance updated."); load(); }
    catch (err) { showToast("error", err.message); }
  };
  const reject = async () => {
    if (!rejectReason) return showToast("error", "Rejection reason required");
    try { await api.put(`/admin/deposits/${rejectModal}/reject`, { rejection_reason: rejectReason }); showToast("info", "Deposit rejected."); setRejectModal(null); setRejectReason(""); load(); }
    catch (err) { showToast("error", err.message); }
  };

  return (
    <div>
      <div className="filter-bar">
        <div className="tabs">{["all","pending","approved","rejected"].map(t => <button key={t} className={`tab ${filter === t ? "active" : ""}`} onClick={() => setFilter(t)} style={{ textTransform: "capitalize" }}>{t}</button>)}</div>
      </div>
      <div className="card">
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Amount</th><th>Method</th><th>Reference</th><th>Proof</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {deposits.map(d => (
                  <tr key={d.id}>
                    <td><div style={{ fontSize: 12.5, fontWeight: 500 }}>{d.first_name} {d.last_name}</div><div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{d.email}</div></td>
                    <td style={{ fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace", color: "var(--gold-light)" }}>{fmt(d.amount)}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{d.method}</td>
                    <td style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--text-secondary)" }}>{d.reference || "—"}</td>
                    <td>{d.proof_image ? <a href={`http://localhost:5000${d.proof_image}`} target="_blank" rel="noreferrer" style={{ color: "var(--blue)", fontSize: 12 }}><Icon name="eye" size={13} /> View</a> : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{fmtDate(d.created_at)}</td>
                    <td><Badge status={d.status} /></td>
                    <td>
                      {d.status === "pending" && (
                        <div style={{ display: "flex", gap: 5 }}>
                          <button className="btn btn-success btn-xs" onClick={() => approve(d)}><Icon name="check" size={11} /> Approve</button>
                          <button className="btn btn-danger btn-xs" onClick={() => setRejectModal(d.id)}><Icon name="close" size={11} /> Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {rejectModal && (
        <Modal title="Reject Deposit" onClose={() => setRejectModal(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setRejectModal(null)}>Cancel</button><button className="btn btn-danger" onClick={reject}>Reject Deposit</button></>}>
          <div className="form-group"><label className="form-label">Rejection Reason <span style={{ color: "var(--red)" }}>*</span></label><textarea className="form-textarea" rows={3} placeholder="Explain why this deposit is being rejected..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} /></div>
        </Modal>
      )}
    </div>
  );
}

// ─── ADMIN WITHDRAWALS ────────────────────────────────────────────────────────
function AdminWithdrawals() {
  const { showToast } = useApp();
  const [withdrawals, setWithdrawals] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailModal, setDetailModal] = useState(null);

  const load = () => {
    setLoading(true);
    const q = filter !== "all" ? `?status=${filter}` : "";
    api.get(`/admin/withdrawals${q}&limit=50`).then(r => { setWithdrawals(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, [filter]);

  const approve = async (w) => {
    try { await api.put(`/admin/withdrawals/${w.id}/approve`); showToast("success", "Withdrawal approved. Balance deducted."); load(); }
    catch (err) { showToast("error", err.message); }
  };
  const reject = async () => {
    if (!rejectReason) return showToast("error", "Rejection reason required");
    try { await api.put(`/admin/withdrawals/${rejectModal}/reject`, { rejection_reason: rejectReason }); showToast("info", "Withdrawal rejected."); setRejectModal(null); setRejectReason(""); load(); }
    catch (err) { showToast("error", err.message); }
  };

  return (
    <div>
      <div className="filter-bar">
        <div className="tabs">{["all","pending","approved","rejected"].map(t => <button key={t} className={`tab ${filter === t ? "active" : ""}`} onClick={() => setFilter(t)} style={{ textTransform: "capitalize" }}>{t}</button>)}</div>
      </div>
      <div className="card">
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id}>
                    <td><div style={{ fontSize: 12.5, fontWeight: 500 }}>{w.first_name} {w.last_name}</div><div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{w.email}</div></td>
                    <td style={{ fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace", color: "var(--red)" }}>{fmt(w.amount)}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{w.method?.replace(/_/g, " ")}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{fmtDate(w.created_at)}</td>
                    <td><Badge status={w.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button className="btn btn-ghost btn-xs" onClick={() => setDetailModal(w)}><Icon name="eye" size={11} /></button>
                        {w.status === "pending" && <>
                          <button className="btn btn-success btn-xs" onClick={() => approve(w)}><Icon name="check" size={11} /> Approve</button>
                          <button className="btn btn-danger btn-xs" onClick={() => setRejectModal(w.id)}><Icon name="close" size={11} /> Reject</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {rejectModal && (
        <Modal title="Reject Withdrawal" onClose={() => setRejectModal(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setRejectModal(null)}>Cancel</button><button className="btn btn-danger" onClick={reject}>Confirm Rejection</button></>}>
          <div className="form-group"><label className="form-label">Rejection Reason <span style={{ color: "var(--red)" }}>*</span></label><textarea className="form-textarea" rows={3} placeholder="Why is this withdrawal being rejected?" value={rejectReason} onChange={e => setRejectReason(e.target.value)} /></div>
        </Modal>
      )}
      {detailModal && (
        <Modal title="Withdrawal Details" onClose={() => setDetailModal(null)}>
          <div className="payment-details-box">
            {Object.entries(typeof detailModal.account_details === "string" ? JSON.parse(detailModal.account_details) : detailModal.account_details || {}).map(([k, v]) => (
              <div key={k} className="payment-detail-row" style={{ padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                <span className="payment-detail-label">{k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                <span className="payment-detail-value">{v}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ADMIN PLANS ──────────────────────────────────────────────────────────────
function AdminPlans() {
  const { showToast } = useApp();
  const [plans, setPlans] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", min_amount: "", max_amount: "", roi_min: "", roi_max: "", duration_days: "", features: "", is_active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/plans").then(r => setPlans(r.data || [])).catch(() => {});
  }, []);

  const openAdd  = () => { setForm({ name: "", description: "", min_amount: "", max_amount: "", roi_min: "", roi_max: "", duration_days: "", features: "", is_active: true }); setModal("add"); };
  const openEdit = (p) => { setForm({ ...p, features: (typeof p.features === "string" ? JSON.parse(p.features) : p.features || []).join("\n") }); setModal(p); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, min_amount: +form.min_amount, max_amount: +form.max_amount, roi_min: +form.roi_min, roi_max: +form.roi_max, duration_days: +form.duration_days, features: form.features.split("\n").filter(Boolean) };
      if (modal === "add") {
        const r = await api.post("/admin/plans", payload); setPlans(p => [...p, r.data]);
        showToast("success", "Plan created!");
      } else {
        const r = await api.put(`/admin/plans/${modal.id}`, payload); setPlans(p => p.map(x => x.id === modal.id ? r.data : x));
        showToast("success", "Plan updated!");
      }
      setModal(null);
    } catch (err) { showToast("error", err.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this plan?")) return;
    try { await api.delete(`/admin/plans/${id}`); setPlans(p => p.filter(x => x.id !== id)); showToast("info", "Plan deleted."); }
    catch (err) { showToast("error", err.message); }
  };

  return (
    <div>
      <div style={{ marginBottom: 18, display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" onClick={openAdd}><Icon name="plus" size={13} /> New Plan</button>
      </div>
      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan.id} className="plan-card" style={{ cursor: "default" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div className="plan-tier">{plan.name}</div>
              <div style={{ display: "flex", gap: 5 }}>
                <button className="btn btn-ghost btn-xs" onClick={() => openEdit(plan)}><Icon name="edit" size={11} /></button>
                <button className="btn btn-danger btn-xs" onClick={() => del(plan.id)}><Icon name="trash" size={11} /></button>
              </div>
            </div>
            <div className="plan-name">{plan.name}</div>
            <div className="plan-range">{fmt(plan.min_amount)} – {fmt(plan.max_amount)}</div>
            <div className="plan-roi">{plan.roi_min === plan.roi_max ? `${plan.roi_max}%` : `${plan.roi_min}–${plan.roi_max}%`}<span> ROI</span></div>
            <div className="plan-duration">{plan.duration_days} days</div>
            <ul className="plan-features">
              {(typeof plan.features === "string" ? JSON.parse(plan.features) : plan.features || []).map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <Badge status={plan.is_active ? "active" : "closed"} />
          </div>
        ))}
      </div>
      {modal && (
        <Modal title={modal === "add" ? "Create New Plan" : `Edit: ${modal.name}`} onClose={() => setModal(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <div className="spinner" /> : (modal === "add" ? "Create Plan" : "Save Changes")}</button></>}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Plan Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Duration (days)</label><input className="form-input" type="number" value={form.duration_days} onChange={e => setForm({ ...form, duration_days: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Min Amount ($)</label><input className="form-input" type="number" value={form.min_amount} onChange={e => setForm({ ...form, min_amount: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Max Amount ($)</label><input className="form-input" type="number" value={form.max_amount} onChange={e => setForm({ ...form, max_amount: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">ROI Min (%)</label><input className="form-input" type="number" value={form.roi_min} onChange={e => setForm({ ...form, roi_min: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">ROI Max (%)</label><input className="form-input" type="number" value={form.roi_max} onChange={e => setForm({ ...form, roi_max: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Features (one per line)</label><textarea className="form-textarea" rows={5} placeholder={"Tax advantage documentation\nOwnership/membership card\n..."} value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} /></div>
          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              <span className="form-label" style={{ margin: 0 }}>Plan is Active (visible to investors)</span>
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ADMIN PAYMENT METHODS ────────────────────────────────────────────────────
function AdminPaymentMethods() {
  const { showToast } = useApp();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", type: "bank_transfer", icon: "🏦", description: "", details: "{}", instructions: "", is_active: true });
  const [saving, setSaving] = useState(false);

  // Built-in templates for quick setup
  const TEMPLATES = {
    bank_transfer: { name: "Bank Transfer", type: "bank_transfer", icon: "🏦", description: "Direct bank wire transfer", details: JSON.stringify({ "Bank Name": "First National Energy Bank", "Account Name": "Eckard Oil Capital LLC", "Account Number": "1029384756", "Routing Number": "021000021", "Bank Address": "100 Wall St, New York, NY 10005" }, null, 2), instructions: "Include your name and email in the transfer memo." },
    wire: { name: "International Wire (SWIFT)", type: "wire", icon: "🌐", description: "International wire transfer via SWIFT", details: JSON.stringify({ "SWIFT/BIC": "FNEB US 33", "IBAN": "US12345678901234567890", "Bank Name": "First National Energy Bank", "Beneficiary": "Eckard Oil Capital LLC", "Reference": "Your name + email" }, null, 2), instructions: "Wire transfers may take 2–5 business days. Please send confirmation once completed." },
    usdt: { name: "USDT (Tether)", type: "crypto", icon: "₮", description: "Stablecoin – pegged to USD", details: JSON.stringify({ "Network": "ERC-20 (Ethereum)", "Wallet Address": "0x1a2b3c4d5e6f7g8h9i0j...", "Coin": "USDT" }, null, 2), instructions: "Only send USDT on ERC-20 network. Other networks will result in loss of funds." },
    btc: { name: "Bitcoin (BTC)", type: "crypto", icon: "₿", description: "Pay with Bitcoin", details: JSON.stringify({ "Bitcoin Address": "bc1qxy2kgdygjrsqtzq2n0yrf249...", "Network": "Bitcoin Mainnet", "Coin": "BTC" }, null, 2), instructions: "Send exact amount. BTC payments are credited after 3 network confirmations." },
    eth: { name: "Ethereum (ETH)", type: "crypto", icon: "Ξ", description: "Pay with Ethereum", details: JSON.stringify({ "ETH Address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", "Network": "Ethereum Mainnet", "Coin": "ETH" }, null, 2), instructions: "Send ETH to the above address. Confirm the network before sending." },
    usdc: { name: "USDC", type: "crypto", icon: "💲", description: "USD Coin on multiple networks", details: JSON.stringify({ "Network": "TRC-20 (Tron)", "Wallet Address": "TUrMmDby2bkTpWRFZVa...", "Coin": "USDC" }, null, 2), instructions: "Only send on TRC-20 network for lower fees." },
  };

  const load = () => {
    api.get("/admin/payment-methods").then(r => { setMethods(r.data || []); setLoading(false); }).catch(() => {
      // Payment methods table may not exist yet — show empty
      setMethods([]); setLoading(false);
    });
  };
  useEffect(load, []);

  const openAdd = (template = null) => {
    setForm(template ? { ...TEMPLATES[template], is_active: true } : { name: "", type: "bank_transfer", icon: "💳", description: "", details: "{}", instructions: "", is_active: true });
    setModal("add");
  };
  const openEdit = (m) => { setForm({ ...m, details: typeof m.details === "object" ? JSON.stringify(m.details, null, 2) : m.details }); setModal(m); };

  const save = async () => {
    setSaving(true);
    try {
      let parsedDetails;
      try { parsedDetails = JSON.parse(form.details); } catch { return showToast("error", "Details must be valid JSON"); }
      const payload = { ...form, details: JSON.stringify(parsedDetails) };
      if (modal === "add") {
        const r = await api.post("/admin/payment-methods", payload); setMethods(m => [...m, r.data]);
        showToast("success", "Payment method added!");
      } else {
        const r = await api.put(`/admin/payment-methods/${modal.id}`, payload); setMethods(m => m.map(x => x.id === modal.id ? r.data : x));
        showToast("success", "Payment method updated!");
      }
      setModal(null);
    } catch (err) { showToast("error", err.message || "Failed to save payment method"); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this payment method?")) return;
    try { await api.delete(`/admin/payment-methods/${id}`); setMethods(m => m.filter(x => x.id !== id)); showToast("info", "Payment method deleted."); }
    catch (err) { showToast("error", err.message); }
  };

  const toggle = async (m) => {
    try {
      const r = await api.put(`/admin/payment-methods/${m.id}`, { is_active: !m.is_active });
      setMethods(prev => prev.map(x => x.id === m.id ? r.data : x));
      showToast("info", `${m.name} ${m.is_active ? "disabled" : "enabled"}`);
    } catch (err) { showToast("error", err.message); }
  };

  return (
    <div>
      <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>Payment methods are shown to users on the deposit page. Configure details accordingly.</div>
        <button className="btn btn-primary" onClick={() => openAdd()}><Icon name="plus" size={13} /> Add Method</button>
      </div>

      {/* Quick Templates */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>Quick Add Templates</div>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <button key={key} className="btn btn-ghost btn-sm" onClick={() => openAdd(key)} style={{ gap: 6 }}>
              <span>{t.icon}</span> {t.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="loading-overlay"><div className="spinner" /></div> : methods.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">💳</div><h3>No payment methods configured</h3><p>Add a payment method using the templates above or create a custom one.</p></div></div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {methods.map(m => (
            <div key={m.id} className="card" style={{ opacity: m.is_active ? 1 : 0.6 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div className="payment-method-icon" style={{ background: "var(--gold-dim)", fontSize: 22, width: 44, height: 44 }}>{m.icon}</div>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 600, fontSize: 15 }}>{m.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 2 }}>{m.description}</div>
                    <div style={{ marginTop: 5, display: "flex", gap: 7, alignItems: "center" }}>
                      <Badge status={m.type} />
                      <Badge status={m.is_active ? "active" : "closed"} />
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                  <button className={`btn btn-xs ${m.is_active ? "btn-danger" : "btn-success"}`} onClick={() => toggle(m)}>{m.is_active ? "Disable" : "Enable"}</button>
                  <button className="btn btn-ghost btn-xs" onClick={() => openEdit(m)}><Icon name="edit" size={11} /></button>
                  <button className="btn btn-danger btn-xs" onClick={() => del(m.id)}><Icon name="trash" size={11} /></button>
                </div>
              </div>

              {/* Preview details */}
              <div style={{ marginTop: 12 }}>
                <div className="payment-details-box">
                  {Object.entries(typeof m.details === "string" ? JSON.parse(m.details || "{}") : m.details || {}).map(([k, v]) => (
                    <div key={k} className="payment-detail-row" style={{ padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                      <span className="payment-detail-label">{k}</span>
                      <span className="payment-detail-value">{v}</span>
                    </div>
                  ))}
                </div>
                {m.instructions && <div style={{ marginTop: 8, padding: "8px 12px", background: "var(--amber-dim)", borderRadius: 6, fontSize: 11.5, color: "var(--text-secondary)" }}>📌 {m.instructions}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === "add" ? "Add Payment Method" : `Edit: ${modal.name}`} onClose={() => setModal(null)} large
          footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <div className="spinner" /> : (modal === "add" ? "Add Method" : "Save Changes")}</button></>}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Display Name</label><input className="form-input" placeholder="e.g. Bank Transfer, USDT, Bitcoin" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Icon (emoji)</label><input className="form-input" placeholder="🏦 ₿ ₮ 💳" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="wire">International Wire</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Short Description</label><input className="form-input" placeholder="e.g. USD Stablecoin on ERC-20" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Details (JSON)</label>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>Enter key-value pairs that will be displayed to users. Example: {"{"}"Bank Name": "Chase", "Account": "12345678"{"}"}</div>
            <textarea className="form-textarea" rows={7} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }} placeholder={'{\n  "Bank Name": "Your Bank",\n  "Account Number": "1234567890"\n}'} value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} />
          </div>
          <div className="form-group"><label className="form-label">Instructions for User <span style={{ color: "var(--text-muted)" }}>(optional)</span></label><textarea className="form-textarea" rows={2} placeholder="e.g. Include your email in the payment memo" value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} /></div>
          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              <span className="form-label" style={{ margin: 0 }}>Visible to users on Deposit page</span>
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ADMIN INVESTMENTS ────────────────────────────────────────────────────────
function AdminInvestments() {
  const { showToast } = useApp();
  const [investments, setInvestments] = useState([]);
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const q = filter !== "all" ? `?status=${filter}` : "";
    api.get(`/admin/investments${q}&limit=50`).then(r => { setInvestments(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, [filter]);

  const forceComplete = async (inv) => {
    if (!window.confirm(`Force complete investment of ${fmt(inv.amount)}? This will credit ${fmt(inv.total_return)} to the user.`)) return;
    try { await api.put(`/admin/investments/${inv.id}`, { status: "completed" }); showToast("success", "Investment completed. Returns credited."); load(); }
    catch (err) { showToast("error", err.message); }
  };

  return (
    <div>
      <div className="filter-bar">
        <div className="tabs">{["all","active","completed","cancelled"].map(t => <button key={t} className={`tab ${filter === t ? "active" : ""}`} onClick={() => setFilter(t)} style={{ textTransform: "capitalize" }}>{t}</button>)}</div>
      </div>
      <div className="card">
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Investor</th><th>Plan</th><th>Amount</th><th>ROI</th><th>Profit</th><th>End Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {investments.map(inv => (
                  <tr key={inv.uuid}>
                    <td><div style={{ fontSize: 12.5, fontWeight: 500 }}>{inv.first_name} {inv.last_name}</div><div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{inv.email}</div></td>
                    <td style={{ fontSize: 12.5 }}>{inv.plan_name}</td>
                    <td style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600 }}>{fmt(inv.amount)}</td>
                    <td style={{ color: "var(--gold)" }}>{inv.roi_rate}%</td>
                    <td style={{ color: "var(--green)", fontFamily: "'IBM Plex Mono',monospace" }}>+{fmt(inv.profit)}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{fmtDate(inv.end_date)}</td>
                    <td><Badge status={inv.status} /></td>
                    <td>
                      {inv.status === "active" && (
                        <button className="btn btn-success btn-xs" onClick={() => forceComplete(inv)}><Icon name="check" size={11} /> Complete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN SUPPORT ────────────────────────────────────────────────────────────
function AdminSupport() {
  const { showToast } = useApp();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [closeStatus, setCloseStatus] = useState("in_progress");

  useEffect(() => {
    api.get("/admin/support?limit=50").then(r => { setTickets(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const openTicket = async (t) => {
    setSelected(t);
    try { const r = await api.get(`/admin/support/${t.id}`); setMessages(r.data?.messages || []); }
    catch {}
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      await api.post(`/admin/support/${selected.id}/reply`, { message: reply, status: closeStatus });
      setMessages(m => [...m, { message: reply, is_admin: true, created_at: new Date() }]);
      setTickets(p => p.map(t => t.id === selected.id ? { ...t, status: closeStatus } : t));
      setReply(""); showToast("success", "Reply sent!");
    } catch (err) { showToast("error", err.message); }
  };

  return (
    <div>
      <div className="card">
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Subject</th><th>User</th><th>Priority</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.subject}</strong></td>
                    <td style={{ color: "var(--text-secondary)" }}>{t.first_name} {t.last_name}</td>
                    <td><Badge status={t.priority} /></td>
                    <td><Badge status={t.status} /></td>
                    <td style={{ color: "var(--text-secondary)" }}>{fmtDate(t.created_at)}</td>
                    <td><button className="btn btn-ghost btn-xs" onClick={() => openTicket(t)}>Reply</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <Modal title={`#${selected.id} — ${selected.subject}`} onClose={() => setSelected(null)} large
          footer={<>
            <select className="form-select" style={{ width: "auto" }} value={closeStatus} onChange={e => setCloseStatus(e.target.value)}>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <input className="form-input" style={{ flex: 1 }} placeholder="Type reply..." value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()} />
            <button className="btn btn-primary" onClick={sendReply}><Icon name="broadcast" size={13} /> Send</button>
          </>}>
          <div style={{ marginBottom: 14, padding: "9px 12px", background: "var(--bg-elevated)", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)" }}>
            From: <strong style={{ color: "var(--text-primary)" }}>{selected.first_name} {selected.last_name}</strong> · {selected.email} · Opened {fmtDate(selected.created_at)}
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 9 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.is_admin ? "flex-start" : "flex-end" }}>
                <div style={{ maxWidth: "78%", padding: "9px 13px", borderRadius: 10, background: m.is_admin ? "var(--gold-dim)" : "var(--bg-elevated)", border: "1px solid var(--border)", fontSize: 12.5, lineHeight: 1.5 }}>
                  {m.is_admin && <div style={{ fontSize: 9.5, color: "var(--gold)", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Support Team</div>}
                  {m.message}
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{fmtTime(m.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ADMIN ANALYTICS ──────────────────────────────────────────────────────────
function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/analytics?period=${period}`).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [period]);

  const s = data?.summary || {};

  return (
    <div>
      <div style={{ marginBottom: 18, display: "flex", gap: 9 }}>
        {[["7","7 Days"],["30","30 Days"],["90","90 Days"],["365","1 Year"]].map(([v, l]) => (
          <button key={v} className={`btn ${period === v ? "btn-primary" : "btn-ghost"} btn-sm`} onClick={() => setPeriod(v)}>{l}</button>
        ))}
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <StatCard icon="deposit" label="Period Deposits" value={fmt(s.period_deposits)} changeType="up" color="green" loading={loading} />
        <StatCard icon="withdraw" label="Period Withdrawals" value={fmt(s.period_withdrawals)} changeType="neutral" color="red" loading={loading} />
        <StatCard icon="users" label="New Signups" value={s.period_signups} changeType="up" color="blue" loading={loading} />
        <StatCard icon="invest" label="New Investments" value={s.period_investments} changeType="up" color="gold" loading={loading} />
      </div>

      <div className="grid-2 section-gap">
        <div className="card">
          <div className="card-header"><div><div className="card-title">Daily Revenue</div><div className="card-subtitle">Approved deposits</div></div></div>
          {loading ? <div className="loading-overlay"><div className="spinner" /></div> : <BarChart data={(data?.charts?.daily_revenue || []).map(r => ({ label: r.date?.slice(-2), value: parseFloat(r.revenue) }))} color="var(--gold)" />}
        </div>
        <div className="card">
          <div className="card-header"><div><div className="card-title">New Users</div><div className="card-subtitle">Daily registrations</div></div></div>
          {loading ? <div className="loading-overlay"><div className="spinner" /></div> : <BarChart data={(data?.charts?.daily_users || []).map(r => ({ label: r.date?.slice(-2), value: r.new_users }))} color="var(--blue)" />}
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 14 }}>Admin Activity (Period)</div>
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Action</th><th>Count</th><th>Share</th></tr></thead>
              <tbody>
                {(data?.admin_activity || []).map((a, i) => {
                  const max = Math.max(...(data.admin_activity || []).map(x => x.count));
                  return (
                    <tr key={i}>
                      <td>{a.action}</td>
                      <td style={{ fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace" }}>{a.count}</td>
                      <td style={{ width: 180 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="progress-bar" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${(a.count / max) * 100}%` }} /></div>
                          <span style={{ fontSize: 11, width: 30, color: "var(--text-secondary)" }}>{Math.round((a.count / max) * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN BROADCAST ──────────────────────────────────────────────────────────
function AdminBroadcast() {
  const { showToast } = useApp();
  const [form, setForm] = useState({ title: "", message: "", type: "info" });
  const [sent, setSent] = useState([]);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!form.title || !form.message) return showToast("error", "Fill all fields");
    setSending(true);
    try {
      await api.post("/admin/broadcast", form);
      setSent(p => [{ ...form, id: Date.now(), time: "just now" }, ...p]);
      showToast("success", "Broadcast sent to all active users!");
      setForm({ title: "", message: "", type: "info" });
    } catch (err) { showToast("error", err.message); }
    finally { setSending(false); }
  };

  const typeColors = { info: "var(--blue)", success: "var(--green)", warning: "var(--amber)", error: "var(--red)" };

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-title" style={{ marginBottom: 18 }}>Send Broadcast</div>
        <div className="form-group"><label className="form-label">Title</label><input className="form-input" placeholder="Notification title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="error">Alert</option></select></div>
        <div className="form-group"><label className="form-label">Message</label><textarea className="form-textarea" rows={5} placeholder="Your message to all users..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
        <button className="btn btn-primary" onClick={send} disabled={sending}>{sending ? <div className="spinner" /> : <><Icon name="broadcast" size={13} /> Send Broadcast</>}</button>
      </div>
      <div className="card">
        <div className="card-title" style={{ marginBottom: 18 }}>Broadcast History</div>
        {sent.length === 0 ? (
          <div className="empty-state" style={{ padding: "36px 0" }}><div className="empty-icon">📢</div><div style={{ color: "var(--text-muted)", fontSize: 12.5 }}>No broadcasts sent yet</div></div>
        ) : sent.map(b => (
          <div key={b.id} style={{ padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <strong style={{ fontSize: 12.5 }}>{b.title}</strong>
              <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{b.time}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 3 }}>{b.message}</div>
            <span style={{ fontSize: 11, color: typeColors[b.type] || "var(--text-muted)", textTransform: "capitalize" }}>● {b.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADMIN LOGS ───────────────────────────────────────────────────────────────
function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/logs?page=${page}&limit=25`).then(r => { setLogs(r.data || []); setPagination(r.pagination || {}); setLoading(false); }).catch(() => setLoading(false));
  }, [page]);

  const actionColors = { APPROVE: "var(--green)", REJECT: "var(--red)", BAN: "var(--red)", DELETE: "var(--red)", CREATE: "var(--blue)", UPDATE: "var(--gold)", BROADCAST: "var(--purple)" };
  const getColor = (action) => Object.entries(actionColors).find(([k]) => action?.includes(k))?.[1] || "var(--text-primary)";

  return (
    <div className="card">
      {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Admin</th><th>Action</th><th>Target</th><th>IP Address</th><th>Timestamp</th></tr></thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td><strong style={{ fontSize: 12.5 }}>{log.first_name} {log.last_name}</strong></td>
                  <td><span style={{ color: getColor(log.action), fontWeight: 500, fontSize: 12 }}>{log.action}</span></td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 11.5 }}>{log.target_type} #{log.target_id}</td>
                  <td style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--text-muted)" }}>{log.ip_address}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{fmtTime(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "14px 0 0", borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
          <span style={{ padding: "6px 12px", fontSize: 12, color: "var(--text-secondary)" }}>Page {page} of {pagination.totalPages}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ─── PAGE META ────────────────────────────────────────────────────────────────
const PAGE_META = {
  dashboard:           { title: "Dashboard",           subtitle: "Your portfolio overview" },
  investments:         { title: "Investments",          subtitle: "Manage your oil & gas portfolio" },
  deposit:             { title: "Deposit Funds",        subtitle: "Add capital to your account" },
  withdraw:            { title: "Withdraw",             subtitle: "Transfer funds to your bank or wallet" },
  transactions:        { title: "Transactions",         subtitle: "Complete ledger of your activity" },
  support:             { title: "Support",              subtitle: "Get help from our team" },
  profile:             { title: "Profile",              subtitle: "Manage your account settings" },
  "admin-dashboard":   { title: "Admin Dashboard",      subtitle: "Platform overview and key metrics" },
  "admin-users":       { title: "User Management",      subtitle: "View and manage all investor accounts" },
  "admin-investments": { title: "Investments",          subtitle: "Monitor and manage all investments" },
  "admin-deposits":    { title: "Deposit Management",   subtitle: "Review and approve deposit requests" },
  "admin-withdrawals": { title: "Withdrawals",          subtitle: "Process withdrawal requests" },
  "admin-plans":       { title: "Investment Plans",     subtitle: "Configure investment products" },
  "admin-payments":    { title: "Payment Methods",      subtitle: "Configure deposit payment options for users" },
  "admin-support":     { title: "Support",              subtitle: "Handle user support tickets" },
  "admin-analytics":   { title: "Analytics",            subtitle: "In-depth platform performance metrics" },
  "admin-broadcast":   { title: "Broadcast",            subtitle: "Send notifications to all users" },
  "admin-logs":        { title: "Admin Logs",           subtitle: "Audit trail of all admin actions" },
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({ deposits: 0, withdrawals: 0, tickets: 0 });

  const login = useCallback((u) => {
    setUser(u);
    setPage(u.role === "admin" ? "admin-dashboard" : "dashboard");
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch {}
    setUser(null); setPage("dashboard");
  }, []);

  const showToast = useCallback((type, msg) => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);

  // Load pending counts for admin badge
  useEffect(() => {
    if (user?.role !== "admin") return;
    const loadCounts = () => {
      api.get("/admin/dashboard").then(r => {
        const s = r.data?.stats || {};
        setPendingCounts({ deposits: s.pending_deposits || 0, withdrawals: s.pending_withdrawals || 0, tickets: s.open_tickets || 0 });
      }).catch(() => {});
    };
    loadCounts();
    const interval = setInterval(loadCounts, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Try auto-login on mount
  useEffect(() => {
    api.get("/auth/me").then(r => { if (r.data) login(r.data); }).catch(() => {});
  }, []);

  const meta = PAGE_META[page] || { title: page, subtitle: "" };

  const renderPage = () => {
    switch (page) {
      case "dashboard":           return <UserDashboard setPage={setPage} />;
      case "investments":         return <InvestPage />;
      case "deposit":             return <DepositPage />;
      case "withdraw":            return <WithdrawPage />;
      case "transactions":        return <TransactionsPage />;
      case "support":             return <SupportPage />;
      case "profile":             return <ProfilePage />;
      case "admin-dashboard":     return <AdminDashboard />;
      case "admin-users":         return <AdminUsers />;
      case "admin-investments":   return <AdminInvestments />;
      case "admin-deposits":      return <AdminDeposits />;
      case "admin-withdrawals":   return <AdminWithdrawals />;
      case "admin-plans":         return <AdminPlans />;
      case "admin-payments":      return <AdminPaymentMethods />;
      case "admin-support":       return <AdminSupport />;
      case "admin-analytics":     return <AdminAnalytics />;
      case "admin-broadcast":     return <AdminBroadcast />;
      case "admin-logs":          return <AdminLogs />;
      default:                    return <div>Page not found</div>;
    }
  };

  return (
    <AppCtx.Provider value={{ user, setUser, login, logout, showToast }}>
      <style>{STYLES}</style>
      <ToastContainer toasts={toasts} />
      {!user ? (
        <AuthPage />
      ) : (
        <div className="layout">
          <Sidebar page={page} setPage={setPage} user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} pendingCounts={pendingCounts} />
          <div className="main-wrap">
            <Topbar title={meta.title} subtitle={meta.subtitle} setSidebarOpen={setSidebarOpen} userId={user?.id} />
            <div className="page-content">
              {renderPage()}
            </div>
          </div>
        </div>
      )}
    </AppCtx.Provider>
  );
}
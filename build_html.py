import json
import re

# Load cleaned test data
with open('g:/mock text/parsed_data_clean.json', 'r', encoding='utf-8') as f:
    test_data = json.load(f)

# Load notes and flashcards
with open('g:/mock text/parsed_notes.json', 'r', encoding='utf-8') as f:
    notes_data = json.load(f)

html_template = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PassNISM Offline Test & Study Companion</title>
<style>
  :root {
    --bg-color: #f8fafc;
    --card-bg: #ffffff;
    --text-main: #0f172a;
    --text-muted: #64748b;
    --border-color: #e2e8f0;
    
    --primary: #2563eb;
    --primary-hover: #1d4ed8;
    --primary-light: #eff6ff;
    
    --success: #10b981;
    --success-light: #ecfdf5;
    --danger: #ef4444;
    --danger-light: #fef2f2;
    --warning: #f59e0b;
    --warning-light: #fffbeb;
    
    --option-selected-bg: #eff6ff;
    --option-selected-border: #3b82f6;
    
    --nav-active: #3b82f6;
    
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  [data-theme="dark"] {
    --bg-color: #0f172a;
    --card-bg: #1e293b;
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
    --border-color: #334155;
    
    --primary-light: #1e3a8a;
    --success-light: #064e3b;
    --danger-light: #7f1d1d;
    --warning-light: #78350f;
    
    --option-selected-bg: #1e3a8a;
    --option-selected-border: #3b82f6;
    
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
  }
  
  body { 
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
    background-color: var(--bg-color); 
    color: var(--text-main); 
    margin: 0; 
    padding: 0; 
    line-height: 1.6;
    transition: background-color 0.3s, color 0.3s;
    padding-bottom: 70px; /* Space for mobile nav */
  }

  @media (min-width: 768px) {
    body { padding-bottom: 0; }
  }
  
  /* Navbar */
  .navbar { 
    background: var(--card-bg); 
    padding: 15px 24px; 
    box-shadow: var(--shadow-sm); 
    display: flex; 
    align-items: center; 
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid var(--border-color);
  }
  
  .navbar-brand {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--text-main);
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
  }
  .navbar-brand span { color: #10b981; }
  
  .nav-controls {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  /* Navigation Tabs */
  .tabs-container {
    display: none; /* Desktop only */
    gap: 8px;
  }

  @media (min-width: 768px) {
    .tabs-container { display: flex; }
  }

  .tab-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    background: var(--border-color);
    color: var(--text-main);
  }

  .tab-btn.active {
    background: var(--primary-light);
    color: var(--primary);
  }

  /* Mobile Bottom Navigation */
  .mobile-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--card-bg);
    display: flex;
    justify-content: space-around;
    padding: 8px 0;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
    border-top: 1px solid var(--border-color);
    z-index: 100;
  }

  @media (min-width: 768px) {
    .mobile-nav { display: none; }
  }

  .mobile-tab-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 0.75rem;
    font-weight: 600;
    gap: 4px;
    cursor: pointer;
    width: 20%;
  }

  .mobile-tab-btn.active {
    color: var(--primary);
  }

  /* Main Container */
  .container { 
    max-width: 1200px; 
    margin: 24px auto; 
    padding: 0 16px;
  }
  
  .card {
    background: var(--card-bg); 
    padding: 24px; 
    border-radius: 12px; 
    box-shadow: var(--shadow-md); 
    border: 1px solid var(--border-color);
    margin-bottom: 24px;
  }
  
  /* Tab contents */
  .tab-content { display: none; }
  .tab-content.active { display: block; }

  /* Dashboard Screen */
  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }

  @media (min-width: 768px) {
    .dashboard-grid { grid-template-columns: 2fr 1fr; }
  }

  .welcome-card h1 { margin-top: 0; font-size: 1.8rem; }
  
  .stats-strip {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin: 20px 0;
  }

  .stat-item {
    background: var(--bg-color);
    padding: 16px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    text-align: center;
  }

  .stat-val { font-size: 1.8rem; font-weight: 700; color: var(--primary); }
  .stat-lbl { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }

  /* Test Simulator Layout */
  .sim-layout {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  @media (min-width: 992px) {
    .sim-layout { flex-direction: row; }
    .sim-left { flex: 3; }
    .sim-right { flex: 1; min-width: 300px; }
  }

  .sim-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
  }

  .time-pill {
    background: var(--primary-light);
    color: var(--primary);
    padding: 8px 16px;
    border-radius: 30px;
    font-weight: 700;
    font-size: 1.05rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .time-pill.urgent {
    background: var(--danger-light);
    color: var(--danger);
    animation: pulse 1s infinite alternate;
  }

  @keyframes pulse {
    from { transform: scale(1); }
    to { transform: scale(1.05); }
  }

  /* Question Panel */
  .q-meta {
    display: flex;
    justify-content: space-between;
    color: var(--text-muted);
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 12px;
  }

  .q-text {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 24px;
  }

  .option {
    display: flex;
    align-items: center;
    padding: 16px;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    margin-bottom: 12px;
    cursor: pointer;
    background: var(--card-bg);
    transition: all 0.2s;
  }

  .option:hover {
    background: var(--option-hover, #f8fafc);
  }

  .option.selected {
    border-color: var(--option-selected-border);
    background: var(--option-selected-bg);
  }

  .option.correct {
    border-color: var(--success);
    background: var(--success-light);
  }

  .option.wrong {
    border-color: var(--danger);
    background: var(--danger-light);
  }

  .opt-badge {
    width: 32px;
    height: 32px;
    background: var(--border-color);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-weight: 700;
    margin-right: 16px;
    flex-shrink: 0;
  }

  .option.selected .opt-badge {
    background: var(--primary);
    color: #fff;
  }
  .option.correct .opt-badge {
    background: var(--success);
    color: #fff;
  }
  .option.wrong .opt-badge {
    background: var(--danger);
    color: #fff;
  }

  .controls-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 30px;
    gap: 12px;
  }

  button.btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
    transition: background 0.2s;
  }

  .btn-primary { background: var(--primary); color: #fff; }
  .btn-primary:hover { background: var(--primary-hover); }
  .btn-secondary { background: var(--border-color); color: var(--text-main); }
  .btn-secondary:hover { background: var(--text-muted); color: #fff; }
  .btn-success { background: var(--success); color: #fff; }
  .btn-success:hover { background: var(--success-hover); }

  .bookmark-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-radius: 50%;
    transition: background 0.2s, color 0.2s;
  }
  .bookmark-btn:hover { background: var(--border-color); }
  .bookmark-btn.active { color: #f59e0b; }

  /* Navigation Grid */
  .grid-header {
    font-weight: 700;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sim-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    max-height: 380px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .grid-btn {
    padding: 10px 0;
    border: 1px solid var(--border-color);
    background: var(--card-bg);
    color: var(--text-main);
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .grid-btn.answered { background: var(--primary-light); color: var(--primary); border-color: var(--primary); }
  .grid-btn.correct { background: var(--success); color: #fff; border-color: var(--success); }
  .grid-btn.wrong { background: var(--danger); color: #fff; border-color: var(--danger); }
  .grid-btn.unattempted { opacity: 0.6; }
  .grid-btn.active { box-shadow: 0 0 0 3px var(--primary); }

  .mobile-drawer-btn {
    display: block;
    width: 100%;
    margin-top: 16px;
    text-align: center;
    background: var(--border-color);
    padding: 10px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }

  @media (min-width: 992px) {
    .mobile-drawer-btn { display: none; }
  }

  /* Drawer Overlay on Mobile */
  .drawer-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 200;
  }

  .drawer {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: var(--card-bg);
    border-radius: 16px 16px 0 0;
    padding: 24px;
    max-height: 70vh;
    overflow-y: auto;
    z-index: 201;
    transform: translateY(100%);
    transition: transform 0.3s ease-out;
  }

  .drawer.open { transform: translateY(0); }

  /* Explanation panel */
  .exp-panel {
    margin-top: 24px;
    background: var(--warning-light);
    border-left: 4px solid var(--warning);
    padding: 16px;
    border-radius: 0 8px 8px 0;
  }
  .exp-panel h4 { margin: 0 0 8px 0; color: var(--warning); }

  /* Study Notes Tab */
  .notes-layout {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  @media (min-width: 768px) {
    .notes-layout { flex-direction: row; }
    .notes-toc { flex: 1; min-width: 250px; position: sticky; top: 100px; height: fit-content; }
    .notes-reader { flex: 3; }
  }

  .toc-item {
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-muted);
    transition: all 0.2s;
  }
  .toc-item:hover { background: var(--bg-color); color: var(--text-main); }
  .toc-item.active { background: var(--primary-light); color: var(--primary); }

  /* Styled Markdown Elements */
  .notes-body h1 { font-size: 1.8rem; margin-top: 0; border-bottom: 2px solid var(--border-color); padding-bottom: 8px; }
  .notes-body h2 { font-size: 1.4rem; margin-top: 24px; color: var(--primary); }
  .notes-body h3 { font-size: 1.15rem; margin-top: 18px; }
  .notes-body table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.9rem; }
  .notes-body th, .notes-body td { border: 1px solid var(--border-color); padding: 10px 12px; text-align: left; }
  .notes-body th { background: var(--bg-color); font-weight: 700; }
  .notes-body tr:nth-child(even) { background: var(--bg-color); }

  /* Flashcards Tab */
  .fc-container {
    max-width: 500px;
    margin: 40px auto;
    text-align: center;
  }

  .fc-card {
    height: 280px;
    perspective: 1000px;
    cursor: pointer;
    margin-bottom: 24px;
  }

  .fc-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.6s;
    transform-style: preserve-3d;
    box-shadow: var(--shadow-lg);
    border-radius: 16px;
    border: 1px solid var(--border-color);
  }

  .fc-card.flipped .fc-inner {
    transform: rotateY(180deg);
  }

  .fc-front, .fc-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-sizing: border-box;
    border-radius: 16px;
    background: var(--card-bg);
  }

  .fc-front {
    color: var(--text-main);
  }

  .fc-back {
    color: var(--text-main);
    transform: rotateY(180deg);
    background: var(--primary-light);
    border: 2px solid var(--primary);
  }

  .fc-front h3 { color: var(--primary); margin-bottom: 12px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;}
  .fc-front p { font-size: 1.3rem; font-weight: 600; }
  .fc-back p { font-size: 1.15rem; font-weight: 500; line-height: 1.6; }

  .fc-controls {
    display: flex;
    justify-content: center;
    gap: 16px;
    align-items: center;
  }

  /* History & Analytics Tab */
  .history-list {
    margin-top: 20px;
  }

  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border-color);
  }
  .history-item:last-child { border-bottom: none; }

  .history-info h4 { margin: 0 0 4px 0; }
  .history-info span { font-size: 0.8rem; color: var(--text-muted); }

  .history-score {
    font-size: 1.15rem;
    font-weight: 700;
  }

  .empty-state {
    text-align: center;
    color: var(--text-muted);
    padding: 40px;
  }

  /* Dark mode toggle */
  .theme-toggle {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-main);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-radius: 50%;
    transition: background 0.2s;
  }
  .theme-toggle:hover { background: var(--border-color); }

  /* Overlay Results */
  .results-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(4px);
    z-index: 1000;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .results-box {
    background: var(--card-bg);
    color: var(--text-main);
    padding: 32px;
    border-radius: 16px;
    max-width: 500px;
    width: 100%;
    box-shadow: var(--shadow-lg);
    text-align: center;
    border: 1px solid var(--border-color);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin: 24px 0;
  }

  .metric-card {
    background: var(--bg-color);
    padding: 16px 8px;
    border-radius: 10px;
    border: 1px solid var(--border-color);
  }

  .metric-val { font-size: 1.8rem; font-weight: 700; }
  .metric-lbl { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }

  .color-correct { color: var(--success); }
  .color-wrong { color: var(--danger); }
  .color-unanswered { color: var(--text-muted); }
</style>
</head>
<body>

<div class="navbar">
  <a href="#" class="navbar-brand" onclick="switchTab('dashboard')">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
      <polyline points="10 10 13 7 17 11"></polyline>
      <line x1="10" y1="14" x2="17" y2="14"></line>
    </svg>
    PassNISM<span>.in</span>
  </a>
  
  <div class="tabs-container">
    <button class="tab-btn active" id="tab-dashboard" onclick="switchTab('dashboard')">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
      Dashboard
    </button>
    <button class="tab-btn" id="tab-simulator" onclick="switchTab('simulator')">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      Mock Test
    </button>
    <button class="tab-btn" id="tab-notes" onclick="switchTab('notes')">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
      Study Notes
    </button>
    <button class="tab-btn" id="tab-flashcards" onclick="switchTab('flashcards')">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
      Flashcards
    </button>
    <button class="tab-btn" id="tab-analytics" onclick="switchTab('analytics')">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
      Analytics
    </button>
  </div>

  <div class="nav-controls">
    <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle dark mode">
      <svg class="sun-icon" style="display:none;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
      <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
    </button>
  </div>
</div>

<!-- Mobile Bottom Bar -->
<div class="mobile-nav">
  <button class="mobile-tab-btn active" id="m-tab-dashboard" onclick="switchTab('dashboard')">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
    <span>Home</span>
  </button>
  <button class="mobile-tab-btn" id="m-tab-simulator" onclick="switchTab('simulator')">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
    <span>Sim</span>
  </button>
  <button class="mobile-tab-btn" id="m-tab-notes" onclick="switchTab('notes')">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
    <span>Notes</span>
  </button>
  <button class="mobile-tab-btn" id="m-tab-flashcards" onclick="switchTab('flashcards')">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>
    <span>Cards</span>
  </button>
  <button class="mobile-tab-btn" id="m-tab-analytics" onclick="switchTab('analytics')">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
    <span>Stats</span>
  </button>
</div>

<div class="container">

  <!-- ================= DASHBOARD TAB ================= -->
  <div class="tab-content active" id="content-dashboard">
    <div class="dashboard-grid">
      <div class="left-col">
        <div class="card welcome-card">
          <h1>Welcome, Candidate!</h1>
          <p>Prepare for the <strong>NISM Series VIII Equity Derivatives Certification</strong> completely offline. Test yourself with 8 complete mock tests and review 7 modules of study notes.</p>
          
          <div class="stats-strip">
            <div class="stat-item">
              <div class="stat-val" id="statAttempts">0</div>
              <div class="stat-lbl">Tests Attempted</div>
            </div>
            <div class="stat-item">
              <div class="stat-val" id="statAvgScore">0%</div>
              <div class="stat-lbl">Average Score</div>
            </div>
          </div>

          <div id="resumeSection" style="display:none; background: var(--primary-light); border: 1px solid var(--primary); padding: 16px; border-radius: 8px; margin-bottom: 24px;">
             <h4 style="margin: 0 0 8px 0; color: var(--primary);">In-Progress Test Found!</h4>
             <p style="margin: 0 0 16px 0; font-size: 0.9rem;" id="resumeDetails"></p>
             <button class="btn btn-primary" onclick="resumeActiveTest()">Resume Test</button>
          </div>
        </div>

        <div class="card">
          <h2 style="margin-top:0;">Launch Mock Test</h2>
          <div style="margin-bottom: 20px;">
            <label style="font-weight:600; display:block; margin-bottom:8px;">Select Test:</label>
            <select id="simTestSelect" onchange="updateStartTitle(this.value)"></select>
          </div>

          <div style="margin-bottom: 24px;">
            <label style="font-weight:600; display:block; margin-bottom:8px;">Practice Mode:</label>
            <div style="display: flex; gap: 16px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="radio" name="testMode" value="practice" checked>
                <span><strong>Practice Mode</strong> (No timer, view answers instantly)</span>
              </label>
            </div>
            <div style="display: flex; gap: 16px; margin-top: 8px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="radio" name="testMode" value="exam">
                <span><strong>Exam Simulator</strong> (2-hour timer, strict submit)</span>
              </label>
            </div>
          </div>

          <button class="btn btn-primary" onclick="initiateNewTest()" style="width: 100%; justify-content: center; font-size: 1.1rem; padding: 14px 0;">
            Start Test
          </button>
        </div>
      </div>

      <div class="right-col">
        <div class="card">
          <h3 style="margin-top:0;">Quick Navigation</h3>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="btn btn-secondary" onclick="switchTab('notes')" style="justify-content: flex-start;">
              📖 Read Study Notes
            </button>
            <button class="btn btn-secondary" onclick="switchTab('flashcards')" style="justify-content: flex-start;">
              ⚡ Interactive Flashcards
            </button>
            <button class="btn btn-secondary" onclick="switchTab('analytics')" style="justify-content: flex-start;">
              📊 Performance Report
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ================= SIMULATOR TAB ================= -->
  <div class="tab-content" id="content-simulator">
    <div class="sim-layout">
      <!-- Active test simulator -->
      <div class="sim-left card" id="simulatorCard" style="display:none;">
        <div class="sim-header">
          <h2 id="activeTestTitle" style="margin:0;">Practice Test 1</h2>
          <div class="time-pill" id="simTimePill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span id="simTimeDisplay">02:00:00</span>
          </div>
        </div>

        <div class="q-meta">
          <span id="activeQNumber">Question 1/100</span>
          <span>1 Mark</span>
        </div>

        <div class="q-text" id="activeQText"></div>
        <div id="activeOptionsArea"></div>
        <div class="exp-panel" id="activeExpPanel" style="display:none;"></div>

        <div class="controls-bar">
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" onclick="simPrev()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Prev
            </button>
            <button class="btn btn-primary" onclick="simNext()">
              Next
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </div>
          
          <div style="display: flex; align-items: center; gap: 12px;">
            <button class="bookmark-btn" id="activeBookmarkBtn" onclick="toggleBookmarkActiveQuestion()" title="Bookmark Question">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </button>
            <button class="btn btn-success" onclick="simSubmit(false)" id="simSubmitBtn">Submit Test</button>
          </div>
        </div>
      </div>

      <div class="sim-right card" id="simNavCard" style="display:none;">
        <div class="grid-header">
          <span>Question Grid</span>
          <span id="gridProgress">0/100</span>
        </div>
        <div class="sim-grid" id="activeGridContainer"></div>
        <div class="mobile-drawer-btn" onclick="openDrawer()">View Questions Grid</div>
      </div>

      <!-- No active test placeholder -->
      <div id="noActiveTestCard" class="card" style="width: 100%; text-align: center; padding: 60px 20px;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="margin-bottom:20px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        <h3>No Test Currently Running</h3>
        <p>Go to the Dashboard tab to configure and start a new mock test simulation.</p>
        <button class="btn btn-primary" onclick="switchTab('dashboard')" style="margin: 20px auto 0 auto;">Go to Dashboard</button>
      </div>
    </div>
  </div>

  <!-- ================= STUDY NOTES TAB ================= -->
  <div class="tab-content" id="content-notes">
    <div class="notes-layout">
      <div class="notes-toc card">
        <h3 style="margin-top:0; border-bottom:1px solid var(--border-color); padding-bottom:8px;">Table of Contents</h3>
        <div id="notesTocContainer"></div>
      </div>
      <div class="notes-reader card">
        <div class="notes-body" id="notesBodyContainer"></div>
      </div>
    </div>
  </div>

  <!-- ================= FLASHCARDS TAB ================= -->
  <div class="tab-content" id="content-flashcards">
    <div class="card" style="text-align: center; max-width: 600px; margin: 0 auto 24px auto;">
      <h2 style="margin-top: 0;">Revision Flashcards</h2>
      <p>Click the card to flip and reveal the answer. Use flashcards for active recall revision.</p>
    </div>

    <div class="fc-container">
      <div class="fc-card" onclick="flipCard(this)" id="flashcardElement">
        <div class="fc-inner">
          <div class="fc-front">
            <h3 id="fcFrontCategory">Fact #1</h3>
            <p id="fcFrontText">What is Basis?</p>
            <div style="margin-top: 20px; font-size: 0.8rem; color: var(--text-muted); font-weight:600;">TAP TO FLIP</div>
          </div>
          <div class="fc-back">
            <p id="fcBackText">Spot Price minus Futures Price.</p>
            <div style="margin-top: 20px; font-size: 0.8rem; opacity: 0.8; font-weight:600;">TAP TO FLIP</div>
          </div>
        </div>
      </div>

      <div class="fc-controls">
        <button class="btn btn-secondary" onclick="prevCard()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Previous
        </button>
        <button class="btn btn-secondary" onclick="shuffleCards()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
          Shuffle
        </button>
        <button class="btn btn-primary" onclick="nextCard()">
          Next
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
      <div style="margin-top: 16px; font-size: 0.9rem; color: var(--text-muted); font-weight:600;" id="fcProgress">Card 1 / 54</div>
    </div>
  </div>

  <!-- ================= ANALYTICS TAB ================= -->
  <div class="tab-content" id="content-analytics">
    <div class="dashboard-grid">
      <div class="left-col">
        <div class="card">
          <h2 style="margin-top: 0;">Performance Over Time</h2>
          <div class="history-list" id="historyListContainer"></div>
        </div>

        <div class="card">
          <h2 style="margin-top: 0;">Bookmarked Questions</h2>
          <div id="bookmarksListContainer"></div>
        </div>
      </div>
      
      <div class="right-col">
        <div class="card">
          <h3 style="margin-top:0;">NISM Syllabus Weightage</h3>
          <div style="font-size: 0.9rem; display: flex; flex-direction: column; gap: 10px;">
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                <span>Options Strategies & Pricing</span>
                <strong>35%</strong>
              </div>
              <div style="height:6px; background:var(--border-color); border-radius:3px;"><div style="width:35%; height:100%; background:var(--primary); border-radius:3px;"></div></div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                <span>Introduction to Futures & Forwards</span>
                <strong>25%</strong>
              </div>
              <div style="height:6px; background:var(--border-color); border-radius:3px;"><div style="width:25%; height:100%; background:var(--primary); border-radius:3px;"></div></div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                <span>Clearing, Settlement & Risk Management</span>
                <strong>20%</strong>
              </div>
              <div style="height:6px; background:var(--border-color); border-radius:3px;"><div style="width:20%; height:100%; background:var(--primary); border-radius:3px;"></div></div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                <span>Legal & Regulatory Framework</span>
                <strong>10%</strong>
              </div>
              <div style="height:6px; background:var(--border-color); border-radius:3px;"><div style="width:10%; height:100%; background:var(--primary); border-radius:3px;"></div></div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                <span>Basics of Derivatives & Markets</span>
                <strong>10%</strong>
              </div>
              <div style="height:6px; background:var(--border-color); border-radius:3px;"><div style="width:10%; height:100%; background:var(--primary); border-radius:3px;"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</div>

<!-- Drawer for Mobile Nav Grid -->
<div class="drawer-overlay" id="drawerOverlay" onclick="closeDrawer()"></div>
<div class="drawer" id="mobileDrawer">
  <div class="grid-header">
    <span>Questions Grid</span>
    <span onclick="closeDrawer()" style="cursor:pointer; padding: 4px;">✕</span>
  </div>
  <div class="sim-grid" id="mobileGridContainer"></div>
</div>

<!-- Score metrics dialog -->
<div class="results-overlay" id="resultsOverlay">
  <div class="results-box">
    <h2 id="scoreHeader">Test Results</h2>
    
    <div class="results-grid metrics-grid">
        <div class="metric-card">
            <div class="metric-val color-correct" id="valCorrect">0</div>
            <div class="metric-lbl">Correct Answers</div>
        </div>
        <div class="metric-card">
            <div class="metric-val color-wrong" id="valWrong">0</div>
            <div class="metric-lbl">Mistakes (Wrong)</div>
        </div>
        <div class="metric-card">
            <div class="metric-val color-unanswered" id="valUnanswered">0</div>
            <div class="metric-lbl">Not Answered</div>
        </div>
    </div>
    
    <p>Review the correct answers and detailed explanations for all questions in Simulator mode.</p>
    <button class="btn btn-primary" onclick="closeResults()" style="width: 100%; justify-content: center;">Review Answers</button>
  </div>
</div>

<script>
  const testData = ___TEST_DATA___;
  const notesData = ___NOTES_DATA___;
  
  let currentActiveTest = null; 
  let currentQ = 0;
  let answers = {};
  let isSubmitted = false;
  let testMode = 'practice'; // 'practice' or 'exam'
  let timeRemaining = 120 * 60; // seconds
  let timerInterval = null;
  let starredQuestions = [];
  
  // Flashcards state
  let flashcardsList = [...notesData.flashcards];
  let currentFcIndex = 0;

  // Load configuration and data from LocalStorage
  function loadLocalStorage() {
      // Starred questions
      const savedStars = localStorage.getItem('nism_starred_questions');
      if (savedStars) {
          starredQuestions = JSON.parse(savedStars);
      }
      
      // Theme setting
      const savedTheme = localStorage.getItem('nism_theme');
      if (savedTheme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
          document.querySelector('.moon-icon').style.display = 'none';
          document.querySelector('.sun-icon').style.display = 'block';
      }
      
      // Active in-progress test
      const activeTest = localStorage.getItem('nism_active_test');
      if (activeTest) {
          const active = JSON.parse(activeTest);
          document.getElementById('resumeSection').style.display = 'block';
          document.getElementById('resumeDetails').textContent = `${active.testName} (${active.mode === 'exam' ? 'Exam' : 'Practice'}) - Question ${active.currentQ + 1} of ${testData[active.testName].length} answered.`;
      }
      
      updateAnalyticsUI();
  }

  function initiateNewTest() {
      const selected = document.getElementById('simTestSelect').value;
      const selectedMode = document.querySelector('input[name="testMode"]:checked').value;
      
      currentActiveTest = selected;
      testMode = selectedMode;
      answers = {};
      currentQ = 0;
      isSubmitted = false;
      timeRemaining = 120 * 60;
      
      // Save state to local storage
      saveActiveTestState();
      
      // Switch tab and load test view
      switchTab('simulator');
      startSimulator();
  }

  function resumeActiveTest() {
      const activeTest = localStorage.getItem('nism_active_test');
      if (!activeTest) return;
      
      const active = JSON.parse(activeTest);
      currentActiveTest = active.testName;
      testMode = active.mode;
      answers = active.answers;
      currentQ = active.currentQ;
      timeRemaining = active.timeRemaining;
      isSubmitted = active.isSubmitted;
      
      switchTab('simulator');
      startSimulator(true);
  }

  function saveActiveTestState() {
      if (!currentActiveTest || isSubmitted) {
          localStorage.removeItem('nism_active_test');
          return;
      }
      localStorage.setItem('nism_active_test', JSON.stringify({
          testName: currentActiveTest,
          mode: testMode,
          answers: answers,
          currentQ: currentQ,
          timeRemaining: timeRemaining,
          isSubmitted: isSubmitted
      }));
  }

  function startSimulator(isResumed = false) {
      document.getElementById('noActiveTestCard').style.display = 'none';
      document.getElementById('simulatorCard').style.display = 'block';
      document.getElementById('simNavCard').style.display = 'block';
      
      document.getElementById('activeTestTitle').textContent = `${currentActiveTest} (${testMode === 'exam' ? 'Exam Mode' : 'Practice Mode'})`;
      document.getElementById('simSubmitBtn').style.display = isSubmitted ? 'none' : 'inline-block';
      
      clearInterval(timerInterval);
      if (testMode === 'exam') {
          document.getElementById('simTimePill').style.display = 'flex';
          document.getElementById('simTimeDisplay').textContent = formatTime(timeRemaining);
          timerInterval = setInterval(() => {
              if (isSubmitted) {
                  clearInterval(timerInterval);
                  return;
              }
              timeRemaining--;
              document.getElementById('simTimeDisplay').textContent = formatTime(timeRemaining);
              
              if (timeRemaining % 30 === 0) { // Auto-save remaining time
                  saveActiveTestState();
              }

              if (timeRemaining <= 300) {
                  document.getElementById('simTimePill').classList.add('urgent');
              }
              
              if (timeRemaining <= 0) {
                  clearInterval(timerInterval);
                  simSubmit(true);
              }
          }, 1000);
      } else {
          document.getElementById('simTimePill').style.display = 'none';
      }
      
      buildActiveGrid();
      renderActiveQuestion();
  }

  function buildActiveGrid() {
      const buildGrid = (containerId) => {
          const container = document.getElementById(containerId);
          container.innerHTML = '';
          const numQ = testData[currentActiveTest].length;
          for (let i = 0; i < numQ; i++) {
              let btn = document.createElement('button');
              btn.className = 'grid-btn';
              btn.id = containerId + '_' + i;
              btn.textContent = i + 1;
              btn.onclick = () => { currentQ = i; renderActiveQuestion(); closeDrawer(); };
              container.appendChild(btn);
          }
      };
      
      buildGrid('activeGridContainer');
      buildGrid('mobileGridContainer');
      updateGridStyles();
  }

  function updateGridStyles() {
      const updateGrid = (containerId) => {
          const numQ = testData[currentActiveTest].length;
          let answeredCount = 0;
          for (let i = 0; i < numQ; i++) {
              const btn = document.getElementById(containerId + '_' + i);
              if (!btn) continue;
              
              btn.className = 'grid-btn';
              if (currentQ === i) btn.classList.add('active');
              
              const q = testData[currentActiveTest][i];
              if (isSubmitted) {
                  const qAnsClean = q.answer.replace(/^[A-D][\\.\\)]\\s*/, '').trim();
                  if (answers[i]) {
                      const userAnsClean = answers[i].replace(/^[A-D][\\.\\)]\\s*/, '').trim();
                      if (qAnsClean === userAnsClean || qAnsClean.includes(userAnsClean)) {
                          btn.classList.add('correct');
                      } else {
                          btn.classList.add('wrong');
                      }
                  } else {
                      btn.classList.add('unattempted');
                  }
              } else {
                  if (answers[i]) {
                      btn.classList.add('answered');
                      answeredCount++;
                  }
              }
          }
          if (!isSubmitted) {
              document.getElementById('gridProgress').textContent = `${answeredCount}/${numQ}`;
          } else {
              document.getElementById('gridProgress').textContent = 'Result Review';
          }
      };
      
      updateGrid('activeGridContainer');
      updateGrid('mobileGridContainer');
  }

  function renderActiveQuestion() {
      const q = testData[currentActiveTest][currentQ];
      document.getElementById('activeQNumber').textContent = `Question ${currentQ + 1}/${testData[currentActiveTest].length}`;
      document.getElementById('activeQText').textContent = q.question;
      
      // Update Grid active classes
      updateGridStyles();
      
      // Render Options
      const optionsArea = document.getElementById('activeOptionsArea');
      optionsArea.innerHTML = '';
      
      q.options.forEach((opt, idx) => {
          const letterMatch = opt.match(/^([A-D])[\\.\\)]\\s*/);
          const letter = letterMatch ? letterMatch[1] : String.fromCharCode(65 + idx);
          const text = opt.replace(/^[A-D][\\.\\)]\\s*/, '').trim();
          
          const div = document.createElement('div');
          div.className = 'option';
          
          const isUserChoice = (answers[currentQ] === text || answers[currentQ] === opt);
          if (isUserChoice) div.classList.add('selected');
          
          if (isSubmitted) {
              const qAnsClean = q.answer.replace(/^[A-D][\\.\\)]\\s*/, '').trim();
              const isCorrect = (qAnsClean === text || qAnsClean.includes(text) || text.includes(qAnsClean));
              if (isCorrect) {
                  div.classList.add('correct');
              } else if (isUserChoice) {
                  div.classList.add('wrong');
              }
          } else {
              div.onclick = () => selectSimOption(text, opt);
          }
          
          div.innerHTML = `<div class="opt-badge">${letter}</div><div>${text}</div>`;
          optionsArea.appendChild(div);
      });
      
      // Bookmark button
      const bookmarkBtn = document.getElementById('activeBookmarkBtn');
      const isStarred = starredQuestions.some(sq => sq.testName === currentActiveTest && sq.index === currentQ);
      if (isStarred) {
          bookmarkBtn.classList.add('active');
      } else {
          bookmarkBtn.classList.remove('active');
      }
      
      // Show/Hide explanations
      const expPanel = document.getElementById('activeExpPanel');
      if (isSubmitted || (testMode === 'practice' && answers[currentQ])) {
          expPanel.style.display = 'block';
          expPanel.innerHTML = `<h4>Explanation</h4><strong>Correct Answer:</strong> ${q.answer}<br><br>${q.explanation || 'To be reviewed.'}`;
      } else {
          expPanel.style.display = 'none';
      }
  }

  function selectSimOption(text, rawOpt) {
      answers[currentQ] = rawOpt;
      saveActiveTestState();
      renderActiveQuestion();
  }

  function simPrev() {
      if (currentQ > 0) {
          currentQ--;
          renderActiveQuestion();
      }
  }

  function simNext() {
      if (currentQ < testData[currentActiveTest].length - 1) {
          currentQ++;
          renderActiveQuestion();
      }
  }

  function simSubmit(isAuto = false) {
      if (isSubmitted) return;
      
      if (!isAuto) {
          if (!confirm("Are you sure you want to submit your mock test?")) return;
      }
      
      isSubmitted = true;
      clearInterval(timerInterval);
      document.getElementById('simSubmitBtn').style.display = 'none';
      
      let correct = 0;
      let wrong = 0;
      let unanswered = 0;
      
      const questions = testData[currentActiveTest];
      for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const qAnsClean = q.answer.replace(/^[A-D][\\.\\)]\\s*/, '').trim();
          
          if (answers[i]) {
              const userAnsClean = answers[i].replace(/^[A-D][\\.\\)]\\s*/, '').trim();
              if (qAnsClean === userAnsClean || qAnsClean.includes(userAnsClean)) {
                  correct++;
              } else {
                  wrong++;
              }
          } else {
              unanswered++;
          }
      }
      
      // Save to history
      const history = JSON.parse(localStorage.getItem('nism_test_history') || '[]');
      history.unshift({
          testName: currentActiveTest,
          mode: testMode,
          date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          score: `${correct}/${questions.length}`,
          percent: Math.round((correct / questions.length) * 100)
      });
      localStorage.setItem('nism_test_history', JSON.stringify(history));
      
      // Remove active test from localstorage
      localStorage.removeItem('nism_active_test');
      document.getElementById('resumeSection').style.display = 'none';
      
      // Render results modal
      document.getElementById('valCorrect').textContent = correct;
      document.getElementById('valWrong').textContent = wrong;
      document.getElementById('valUnanswered').textContent = unanswered;
      document.getElementById('scoreHeader').textContent = `Test Results: ${Math.round((correct / questions.length) * 100)}%`;
      document.getElementById('resultsOverlay').style.display = 'flex';
      
      updateAnalyticsUI();
  }

  function closeResults() {
      document.getElementById('resultsOverlay').style.display = 'none';
      currentQ = 0;
      renderActiveQuestion();
  }

  function toggleBookmarkActiveQuestion() {
      const isStarredIdx = starredQuestions.findIndex(sq => sq.testName === currentActiveTest && sq.index === currentQ);
      if (isStarredIdx > -1) {
          starredQuestions.splice(isStarredIdx, 1);
      } else {
          const q = testData[currentActiveTest][currentQ];
          starredQuestions.push({
              testName: currentActiveTest,
              index: currentQ,
              question: q.question,
              answer: q.answer
          });
      }
      localStorage.setItem('nism_starred_questions', JSON.stringify(starredQuestions));
      renderActiveQuestion();
      updateAnalyticsUI();
  }

  // Navigation Tabs Switch
  function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.mobile-tab-btn').forEach(el => el.classList.remove('active'));
      
      document.getElementById('content-' + tabId).classList.add('active');
      const dBtn = document.getElementById('tab-' + tabId);
      if(dBtn) dBtn.classList.add('active');
      const mBtn = document.getElementById('m-tab-' + tabId);
      if(mBtn) mBtn.classList.add('active');
      
      if(tabId === 'notes') {
          // Renders notes index first if not loaded
          if(!document.getElementById('notesTocContainer').hasChildNodes()) {
              renderNotes();
          }
      }
  }

  // Study Notes Renderer
  function renderNotes() {
      const tocContainer = document.getElementById('notesTocContainer');
      const bodyContainer = document.getElementById('notesBodyContainer');
      tocContainer.innerHTML = '';
      
      notesData.parts.forEach((part, index) => {
          const div = document.createElement('div');
          div.className = 'toc-item' + (index === 0 ? ' active' : '');
          div.textContent = part.title;
          div.onclick = () => {
              document.querySelectorAll('.toc-item').forEach(el => el.classList.remove('active'));
              div.classList.add('active');
              bodyContainer.innerHTML = mdToHtml(part.content);
              window.scrollTo({ top: 0, behavior: 'smooth' });
          };
          tocContainer.appendChild(div);
      });
      
      // Load initial notes body
      bodyContainer.innerHTML = mdToHtml(notesData.parts[0].content);
  }

  // A very lightweight markdown formatter
  function mdToHtml(md) {
      let lines = md.split('\\n');
      let html = '';
      let inTable = false;
      let inList = false;
      
      for(let i=0; i<lines.length; i++) {
          let line = lines[i].trim();
          
          // Header 3
          if (line.startsWith('###')) {
              if (inList) { html += '</ul>'; inList = false; }
              html += `<h3>${line.replace('###', '').trim()}</h3>`;
              continue;
          }
          // Header 2
          if (line.startsWith('##')) {
              if (inList) { html += '</ul>'; inList = false; }
              html += `<h2>${line.replace('##', '').trim()}</h2>`;
              continue;
          }
          // Header 1
          if (line.startsWith('#')) {
              if (inList) { html += '</ul>'; inList = false; }
              html += `<h1>${line.replace('#', '').trim()}</h1>`;
              continue;
          }
          
          // Handle Table
          if (line.includes('|')) {
              if (!inTable) {
                  html += '<table>';
                  inTable = true;
              }
              let cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
              // Skip divider line like |---|---|
              if (line.includes('---')) continue;
              
              html += '<tr>';
              cells.forEach(cell => {
                  // If it is the first row, make it a table header
                  if (html.endsWith('<table><tr>')) {
                      html += `<th>${cell}</th>`;
                  } else {
                      html += `<td>${cell}</td>`;
                  }
              });
              html += '</tr>';
              continue;
          } else {
              if (inTable) {
                  html += '</table>';
                  inTable = false;
              }
          }

          // Handle Lists
          if (line.startsWith('-') || line.match(/^\\d+\\./)) {
              if (!inList) {
                  html += '<ul>';
                  inList = true;
              }
              let text = line.replace(/^-|^\\d+\\./, '').trim();
              html += `<li>${text}</li>`;
              continue;
          } else {
              if (inList) {
                  html += '</ul>';
                  inList = false;
              }
          }

          if (line === '') {
              html += '<br>';
          } else {
              // Standard paragraph with bold formats
              let formattedLine = line.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
              html += `<p>${formattedLine}</p>`;
          }
      }
      
      if (inTable) html += '</table>';
      if (inList) html += '</ul>';
      return html;
  }

  // Flashcards flipping and loading
  function flipCard(cardEl) {
      cardEl.classList.toggle('flipped');
  }

  // Analytics UI Refresher
  function updateAnalyticsUI() {
      const history = JSON.parse(localStorage.getItem('nism_test_history') || '[]');
      
      // Update statistics
      document.getElementById('statAttempts').textContent = history.length;
      if (history.length > 0) {
          const totalPercent = history.reduce((acc, item) => acc + item.percent, 0);
          document.getElementById('statAvgScore').textContent = Math.round(totalPercent / history.length) + '%';
      } else {
          document.getElementById('statAvgScore').textContent = '0%';
      }

      // Render History List
      const historyContainer = document.getElementById('historyListContainer');
      historyContainer.innerHTML = '';
      
      if (history.length === 0) {
          historyContainer.innerHTML = '<div class="empty-state">No mock tests completed yet.</div>';
      } else {
          history.forEach(item => {
              const div = document.createElement('div');
              div.className = 'history-item';
              div.innerHTML = `
                  <div class="history-info">
                      <h4>${item.testName}</h4>
                      <span>${item.date} • Mode: ${item.mode === 'exam' ? 'Exam' : 'Practice'}</span>
                  </div>
                  <div class="history-score ${item.percent >= 60 ? 'color-correct' : 'color-wrong'}">
                      Score: ${item.score} (${item.percent}%)
                  </div>
              `;
              historyContainer.appendChild(div);
          });
      }

      // Render Starred/Bookmarked questions
      const bookmarksContainer = document.getElementById('bookmarksListContainer');
      bookmarksContainer.innerHTML = '';
      
      if (starredQuestions.length === 0) {
          bookmarksContainer.innerHTML = '<div class="empty-state">No questions bookmarked yet. Use the star icon during mock tests.</div>';
      } else {
          starredQuestions.forEach((sq, idx) => {
              const div = document.createElement('div');
              div.className = 'history-item';
              div.style.flexDirection = 'column';
              div.style.alignItems = 'flex-start';
              div.innerHTML = `
                  <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                      <strong>${sq.testName} - Q${sq.index + 1}</strong>
                      <span onclick="removeBookmark(${idx})" style="color: var(--danger); cursor: pointer; font-size: 0.85rem; font-weight: 600;">Remove</span>
                  </div>
                  <p style="margin: 0 0 8px 0; font-size: 0.95rem; font-weight: 500;">${sq.question}</p>
                  <p style="margin: 0; font-size: 0.9rem; color: var(--success); font-weight: 600;">Correct Answer: ${sq.answer}</p>
              `;
              bookmarksContainer.appendChild(div);
          });
      }
  }

  function removeBookmark(idx) {
      starredQuestions.splice(idx, 1);
      localStorage.setItem('nism_starred_questions', JSON.stringify(starredQuestions));
      updateAnalyticsUI();
  }

  // Theme Controller
  function toggleTheme() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const sun = document.querySelector('.sun-icon');
      const moon = document.querySelector('.moon-icon');
      
      if (currentTheme === 'dark') {
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('nism_theme', 'light');
          sun.style.display = 'none';
          moon.style.display = 'block';
      } else {
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem('nism_theme', 'dark');
          sun.style.display = 'block';
          moon.style.display = 'none';
      }
  }

  // Mobile Drawer Toggle
  function openDrawer() {
      document.getElementById('drawerOverlay').style.display = 'block';
      document.getElementById('mobileDrawer').classList.add('open');
  }

  function closeDrawer() {
      document.getElementById('drawerOverlay').style.display = 'none';
      const drawer = document.getElementById('mobileDrawer');
      if (drawer) drawer.classList.remove('open');
  }

  function updateStartTitle(val) {
      document.getElementById('startTitle').textContent = val;
  }

  function formatTime(seconds) {
      let h = Math.floor(seconds / 3600);
      let m = Math.floor((seconds % 3600) / 60);
      let s = seconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Initialize dropdowns and contents
  function setupTestSelectors() {
      const simTestSelect = document.getElementById('simTestSelect');
      simTestSelect.innerHTML = '';
      for (let testName in testData) {
          let opt = document.createElement('option');
          opt.value = testName;
          opt.textContent = testName;
          simTestSelect.appendChild(opt);
      }
      if (Object.keys(testData).length > 0) {
          updateStartTitle(Object.keys(testData)[0]);
      }
  }

  function renderFlashcard() {
      const card = flashcardsList[currentFcIndex];
      document.getElementById('flashcardElement').classList.remove('flipped');
      setTimeout(() => {
          document.getElementById('fcFrontCategory').textContent = `Fact #${currentFcIndex + 1}`;
          document.getElementById('fcFrontText').textContent = card.front;
          document.getElementById('fcBackText').textContent = card.back;
          document.getElementById('fcProgress').textContent = `Card ${currentFcIndex + 1} / ${flashcardsList.length}`;
      }, 150);
  }

  function nextCard() {
      if (currentFcIndex < flashcardsList.length - 1) {
          currentFcIndex++;
          renderFlashcard();
      }
  }

  function prevCard() {
      if (currentFcIndex > 0) {
          currentFcIndex--;
          renderFlashcard();
      }
  }

  function shuffleCards() {
      for (let i = flashcardsList.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [flashcardsList[i], flashcardsList[j]] = [flashcardsList[j], flashcardsList[i]];
      }
      currentFcIndex = 0;
      renderFlashcard();
  }

  setupTestSelectors();
  loadLocalStorage();
  renderFlashcard();
</script>
</body>
</html>
"""

html_out = html_template.replace("___TEST_DATA___", json.dumps(test_data)).replace("___NOTES_DATA___", json.dumps(notes_data))

with open('g:/mock text/index.html', 'w', encoding='utf-8') as f:
    f.write(html_out)
    
print("Premium web app index.html successfully compiled!")

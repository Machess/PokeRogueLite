const PARENT_PIN_KEY = 'pokerogue_parent_pin_v1';

const SKILL_DISPLAY = {
  time:       { label: 'Telling & Elapsed Time', icon: '🕐', games: 'Chuck, Togepi' },
  money:      { label: 'Money & Making Change',  icon: '💰', games: 'Giovanni' },
  counting:   { label: 'Counting',               icon: '🔢', games: 'Pryce' },
  sorting:    { label: 'Sorting & Categories',   icon: '🗂️', games: 'Oak' },
  comparison: { label: 'Comparing Amounts',      icon: '⚖️', games: 'Snorlax' },
  math:       { label: 'Arithmetic & Sequencing',icon: '➕', games: 'Brock' },
  reading:    { label: 'Reading & Clues',        icon: '📖', games: 'Misty' },
  spelling:   { label: 'Spelling & Letters',     icon: '🔤', games: 'Bugsy, James' },
};
const TIER_WORD = { 1: 'Beginner', 2: 'Growing', 3: 'Confident' };


// ─── PARENT DASHBOARD — SVG mini-charts (dependency-free) ────────────────────
// Chart type matched to data type: line for trends over time, horizontal bars
// for distribution magnitude, pie for share-of-whole.
const PtChart = {
  // Line chart for a metric over plays. opts: {values[], w,h, color, band:[lo,hi],
  // invert (lower=better for speed), label, markers[] (indices where tier changed)}
  line(values, opts = {}) {
    const w = opts.w || 240, h = opts.h || 90, pad = 22;
    const vals = values.filter(v => v != null);
    if (vals.length < 2) return `<div class="pt-chart-empty">Play a few more games to see a trend.</div>`;
    const max = opts.max != null ? opts.max : Math.max(...vals);
    const min = opts.min != null ? opts.min : Math.min(...vals);
    const range = (max - min) || 1;
    const x = i => pad + (i / (values.length - 1)) * (w - pad - 6);
    const y = v => {
      const norm = (v - min) / range;            // 0..1 low..high
      const yy = opts.invert ? norm : 1 - norm;   // invert for "lower is better"
      return 6 + yy * (h - pad);
    };
    // Healthy-zone band (accuracy only) — a gentle reference, not a target
    let band = '';
    if (opts.band) {
      const yTop = y(opts.band[1]), yBot = y(opts.band[0]);
      band = `<rect x="${pad}" y="${Math.min(yTop,yBot)}" width="${w-pad-6}" height="${Math.abs(yBot-yTop)}"
                fill="rgba(120,200,150,.13)" />
              <line x1="${pad}" y1="${yTop}" x2="${w-6}" y2="${yTop}" stroke="rgba(120,200,150,.3)" stroke-dasharray="3 3"/>
              <line x1="${pad}" y1="${yBot}" x2="${w-6}" y2="${yBot}" stroke="rgba(120,200,150,.3)" stroke-dasharray="3 3"/>`;
    }
    // Path
    let d = '';
    values.forEach((v, i) => { if (v == null) return; d += (d ? ' L' : 'M') + x(i) + ' ' + y(v); });
    // Tier-change markers
    let marks = '';
    (opts.markers || []).forEach(m => {
      marks += `<circle cx="${x(m.i)}" cy="${y(values[m.i])}" r="3.5" fill="${m.dir==='up'?'#8ff0b0':'#ffb088'}" stroke="#1a2030" stroke-width="1"/>`;
    });
    // Dots
    let dots = '';
    values.forEach((v, i) => { if (v != null) dots += `<circle cx="${x(i)}" cy="${y(v)}" r="2" fill="${opts.color||'#6fa8ff'}"/>`; });
    // Axis labels
    const loLbl = opts.fmt ? opts.fmt(min) : min;
    const hiLbl = opts.fmt ? opts.fmt(max) : max;
    return `<svg viewBox="0 0 ${w} ${h+14}" class="pt-svg">
      ${band}
      <path d="${d}" fill="none" stroke="${opts.color||'#6fa8ff'}" stroke-width="2" stroke-linejoin="round"/>
      ${dots}${marks}
      <text x="2" y="10" class="pt-axis">${opts.invert?loLbl:hiLbl}</text>
      <text x="2" y="${h}" class="pt-axis">${opts.invert?hiLbl:loLbl}</text>
      <text x="${pad}" y="${h+12}" class="pt-axis">${opts.startLbl||'earlier'}</text>
      <text x="${w-6}" y="${h+12}" class="pt-axis" text-anchor="end">${opts.endLbl||'recent'}</text>
    </svg>`;
  },

  // Horizontal bars — distribution/magnitude. data: [{label, value, color}]
  bars(data, opts = {}) {
    const w = opts.w || 240, rowH = 22, gap = 6;
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const max = Math.max(...data.map(d => d.value), 1);
    const labelW = 70, barW = w - labelW - 38;
    let rows = '';
    data.forEach((d, i) => {
      const yy = i * (rowH + gap);
      const bw = (d.value / max) * barW;
      const pct = Math.round((d.value / total) * 100);
      rows += `
        <text x="0" y="${yy+15}" class="pt-bar-lbl">${d.label}</text>
        <rect x="${labelW}" y="${yy+4}" width="${barW}" height="14" rx="4" fill="rgba(255,255,255,.08)"/>
        <rect x="${labelW}" y="${yy+4}" width="${Math.max(bw,2)}" height="14" rx="4" fill="${d.color||'#6fa8ff'}"/>
        <text x="${labelW+barW+4}" y="${yy+15}" class="pt-bar-val">${pct}%</text>`;
    });
    return `<svg viewBox="0 0 ${w} ${data.length*(rowH+gap)}" class="pt-svg">${rows}</svg>`;
  },

  // Pie chart — share of whole. data: [{label, value, color}]
  pie(data, opts = {}) {
    const size = opts.size || 120, r = size/2 - 2, cx = size/2, cy = size/2;
    const total = data.reduce((s, d) => s + d.value, 0);
    if (!total) return `<div class="pt-chart-empty">No data yet.</div>`;
    let a0 = -Math.PI/2, slices = '', legend = '';
    data.forEach(d => {
      const frac = d.value / total;
      const a1 = a0 + frac * Math.PI * 2;
      const large = frac > 0.5 ? 1 : 0;
      const x0 = cx + r*Math.cos(a0), y0 = cy + r*Math.sin(a0);
      const x1 = cx + r*Math.cos(a1), y1 = cy + r*Math.sin(a1);
      // full-circle guard
      if (frac >= 0.999) {
        slices += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${d.color}"/>`;
      } else {
        slices += `<path d="M${cx} ${cy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${d.color}"/>`;
      }
      const pct = Math.round(frac*100);
      legend += `<div class="pt-pie-leg"><span class="pt-pie-dot" style="background:${d.color}"></span>${d.label} <b>${pct}%</b></div>`;
      a0 = a1;
    });
    return `<div class="pt-pie-wrap">
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="pt-svg">${slices}</svg>
      <div class="pt-pie-legend">${legend}</div>
    </div>`;
  },
};

// Palette for skills/games so colors are stable across charts
const PT_PALETTE = ['#6fa8ff','#8ff0b0','#ffd98a','#ff9ec0','#c8b0e0','#7de0d0','#ffb088','#a0d8ff'];

const ParentDashboardEngine = {
  _authed: false,

  open() {
    showScreen('parent');
    const hasPin = !!localStorage.getItem(PARENT_PIN_KEY);
    if (this._authed) { this._renderDashboard(); }
    else if (hasPin)  { this._renderPinEntry(); }
    else              { this._renderPinSetup(); }
  },

  // ── First-time PIN setup ──────────────────────────────────────────────────
  _renderPinSetup() {
    const wrap = document.getElementById('parent-wrap');
    wrap.innerHTML = `
      <div class="parent-gate">
        <div class="parent-gate-icon">🔒</div>
        <h2 class="parent-gate-title">Grown-ups Area</h2>
        <p class="parent-gate-sub">Create a 4-digit PIN so only grown-ups can see the learning dashboard.</p>
        <input class="parent-pin-input" id="parent-pin-input" type="tel" inputmode="numeric"
               maxlength="4" placeholder="• • • •" autocomplete="off" />
        <div class="parent-gate-msg" id="parent-gate-msg"></div>
        <button class="btn-pixel btn-primary" id="parent-pin-save">Set PIN</button>
        <button class="btn-pixel btn-util" id="parent-back">◂ Back</button>
      </div>`;
    document.getElementById('parent-pin-save').onclick = () => {
      const v = document.getElementById('parent-pin-input').value.trim();
      if (!/^\d{4}$/.test(v)) { document.getElementById('parent-gate-msg').textContent = 'Please enter 4 digits.'; return; }
      localStorage.setItem(PARENT_PIN_KEY, v);
      this._authed = true;
      this._renderDashboard();
    };
    document.getElementById('parent-back').onclick = () => showScreen('start');
  },

  // ── PIN entry ─────────────────────────────────────────────────────────────
  _renderPinEntry() {
    const wrap = document.getElementById('parent-wrap');
    wrap.innerHTML = `
      <div class="parent-gate">
        <div class="parent-gate-icon">🔒</div>
        <h2 class="parent-gate-title">Grown-ups Area</h2>
        <p class="parent-gate-sub">Enter your PIN to view the learning dashboard.</p>
        <input class="parent-pin-input" id="parent-pin-input" type="tel" inputmode="numeric"
               maxlength="4" placeholder="• • • •" autocomplete="off" />
        <div class="parent-gate-msg" id="parent-gate-msg"></div>
        <button class="btn-pixel btn-primary" id="parent-pin-go">Enter</button>
        <button class="btn-pixel btn-util" id="parent-back">◂ Back</button>
      </div>`;
    const submit = () => {
      const v = document.getElementById('parent-pin-input').value.trim();
      if (v === localStorage.getItem(PARENT_PIN_KEY)) { this._authed = true; this._renderDashboard(); }
      else document.getElementById('parent-gate-msg').textContent = 'Incorrect PIN. Try again.';
    };
    document.getElementById('parent-pin-go').onclick = submit;
    document.getElementById('parent-pin-input').onkeydown = (e) => { if (e.key === 'Enter') submit(); };
    document.getElementById('parent-back').onclick = () => showScreen('start');
  },

  // ── Read every profile's saved skill data ─────────────────────────────────
  _gatherProfiles() {
    const profiles = loadProfiles();
    const out = [];
    profiles.forEach(p => {
      let save = null;
      try { const d = localStorage.getItem(saveKey(p.key)); if (d) save = JSON.parse(d); } catch (e) {}
      out.push({
        key: p.key,
        name: p.trainerName || p.name || 'Trainer',
        age: p.trainerAge ?? save?.trainerAge ?? null,
        baseTier: p.difficultyTier ?? save?.difficultyTier ?? 2,
        skills: save?.skillLevels || {},
        stats: save?.stats || {},
        region: save?.region || 'kanto',
        bosses: save?.bossesDefeated || 0,
      });
    });
    return out;
  },

  _trendArrow(recent) {
    if (!recent || recent.length < 2) return { sym: '→', cls: 'pt-steady', word: 'steady' };
    const half = Math.ceil(recent.length / 2);
    const first = recent.slice(0, half), last = recent.slice(half);
    const avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
    const d = avg(last) - avg(first);
    if (d > 0.15) return { sym: '↑', cls: 'pt-up', word: 'improving' };
    if (d < -0.15) return { sym: '↓', cls: 'pt-down', word: 'needs practice' };
    return { sym: '→', cls: 'pt-steady', word: 'steady' };
  },

  _speedWord(ms) {
    if (!ms) return null;
    if (ms < 4000)  return { word: 'thinks quickly', cls: 'pt-fast' };
    if (ms < 9000)  return { word: 'steady pace',     cls: 'pt-mid' };
    return { word: 'takes their time', cls: 'pt-slow' };
  },

  _renderDashboard() {
    const wrap = document.getElementById('parent-wrap');
    const profiles = this._gatherProfiles();

    let html = `
      <div class="parent-header">
        <h2 class="parent-title">📊 Learning Dashboard</h2>
        <button class="btn-pixel btn-util parent-exit" id="parent-exit">◂ Done</button>
      </div>
      <p class="parent-intro">A friendly snapshot of what each child is practicing and how they're growing. Everything stays on this device.</p>`;

    if (!profiles.length) {
      html += `<div class="parent-empty">No profiles yet. Start a game first!</div>`;
    }

    profiles.forEach(prof => {
      const skillKeys = Object.keys(SKILL_DISPLAY);
      const played = skillKeys.filter(k => prof.skills[k]?.played > 0);

      // Compute per-skill rows + collect strengths/struggles
      const rows = [];
      const ranked = [];
      skillKeys.forEach(sk => {
        const s = prof.skills[sk];
        const meta = SKILL_DISPLAY[sk];
        if (!s || !s.played) {
          rows.push(`<div class="pt-skill pt-skill-untouched">
            <span class="pt-skill-icon">${meta.icon}</span>
            <span class="pt-skill-name">${meta.label}</span>
            <span class="pt-skill-note">not tried yet</span>
          </div>`);
          return;
        }
        const acc = s.totalMax ? Math.round((s.totalScore / s.totalMax) * 100) : 0;
        const trend = this._trendArrow(s.recent);
        const speed = this._speedWord(s.avgMs);
        ranked.push({ sk, acc, played: s.played, tier: s.tier });
        // Build the per-skill charts from the play log
        const log = s.log || [];
        const accSeries = log.map(e => e.acc);
        const msSeries  = log.map(e => e.ms);
        const tierSeries = log.map(e => e.tier);
        // Tier-change markers for annotating the accuracy/speed lines
        const markers = [];
        for (let k = 1; k < tierSeries.length; k++) {
          if (tierSeries[k] > tierSeries[k-1]) markers.push({ i: k, dir: 'up' });
          else if (tierSeries[k] < tierSeries[k-1]) markers.push({ i: k, dir: 'down' });
        }
        // Time-in-tier distribution (how many plays at each tier)
        const tierCounts = [1,2,3].map(t => ({
          label: TIER_WORD[t], value: log.filter(e => e.tier === t).length,
          color: t===1?'#aed4ff':t===2?'#ffd98a':'#8ff0b0'
        })).filter(d => d.value > 0);

        const charts = log.length >= 2 ? `
          <div class="pt-charts" id="pt-charts-${prof.key}-${sk}" style="display:none">
            <div class="pt-chart-block">
              <div class="pt-chart-title">📈 Difficulty level over time</div>
              ${PtChart.line(tierSeries, { color:'#ffd98a', min:1, max:3, h:70,
                 fmt:v=>TIER_WORD[Math.round(v)]||v, startLbl:'first plays', endLbl:'now' })}
            </div>
            <div class="pt-chart-block">
              <div class="pt-chart-title">🎯 Accuracy over time <span class="pt-zone-key">▩ healthy zone</span></div>
              ${PtChart.line(accSeries, { color:'#8ff0b0', min:0, max:100, band:[60,85],
                 markers, fmt:v=>v+'%', startLbl:'earlier', endLbl:'recent' })}
              <div class="pt-chart-note">The shaded band (60–85%) is just a comfortable challenge range — not a target to chase. Dips often follow a difficulty increase, then recover.</div>
            </div>
            ${msSeries.some(v=>v!=null) ? `<div class="pt-chart-block">
              <div class="pt-chart-title">⚡ Answer speed over time <span class="pt-zone-key">lower = faster</span></div>
              ${PtChart.line(msSeries, { color:'#6fa8ff', invert:true,
                 fmt:v=>(v/1000).toFixed(1)+'s', markers, startLbl:'earlier', endLbl:'recent' })}
            </div>` : ''}
            ${tierCounts.length ? `<div class="pt-chart-block">
              <div class="pt-chart-title">⏱️ Time spent at each level</div>
              ${PtChart.bars(tierCounts)}
            </div>` : ''}
          </div>` : '';

        rows.push(`
          <div class="pt-skill">
            <div class="pt-skill-head">
              <span class="pt-skill-icon">${meta.icon}</span>
              <span class="pt-skill-name">${meta.label}</span>
              <span class="pt-skill-level pt-tier${s.tier}">${TIER_WORD[s.tier]}</span>
            </div>
            <div class="pt-skill-bar"><div class="pt-skill-fill" style="width:${acc}%"></div></div>
            <div class="pt-skill-stats">
              <span class="pt-stat">${acc}% correct</span>
              <span class="pt-stat ${trend.cls}">${trend.sym} ${trend.word}</span>
              ${speed ? `<span class="pt-stat ${speed.cls}">⚡ ${speed.word}</span>` : ''}
              <span class="pt-stat pt-plays">${s.played} played</span>
            </div>
            <div class="pt-skill-games">Practiced in: ${meta.games}</div>
            ${charts ? `<button class="pt-charts-toggle" data-target="pt-charts-${prof.key}-${sk}">View charts ▾</button>${charts}` : ''}
          </div>`);
      });

      // Strengths (highest accuracy, >=2 plays) and "still practicing" (lowest)
      const eligible = ranked.filter(r => r.played >= 2);
      const strengths = [...eligible].sort((a, b) => b.acc - a.acc).slice(0, 2);
      const struggles = [...eligible].sort((a, b) => a.acc - b.acc).slice(0, 2);
      const nameOf = sk => SKILL_DISPLAY[sk].label;

      let summary = '';
      if (eligible.length >= 2) {
        const str = strengths.map(r => nameOf(r.sk)).join(' and ');
        const stg = struggles.filter(r => !strengths.find(s => s.sk === r.sk)).map(r => nameOf(r.sk)).join(' and ');
        summary = `${prof.name} is doing well with <b>${str.toLowerCase()}</b>` +
                  (stg ? `, and is still building <b>${stg.toLowerCase()}</b> — the game is giving a little more practice there.` : '.');
      } else if (played.length) {
        summary = `${prof.name} is just getting started — more skills will appear here as they play.`;
      } else {
        summary = `${prof.name} hasn't played any learning games yet.`;
      }

      const totalGames = skillKeys.reduce((sum, k) => sum + (prof.skills[k]?.played || 0), 0);

      // "Most-played skills" pie — share of practice across skills
      const playData = skillKeys
        .map((k, i) => ({ label: SKILL_DISPLAY[k].label.split(' ')[0], value: prof.skills[k]?.played || 0, color: PT_PALETTE[i % PT_PALETTE.length] }))
        .filter(d => d.value > 0)
        .sort((a, b) => b.value - a.value);
      const pieBlock = playData.length >= 2 ? `
        <div class="parent-pie-block">
          <div class="pt-chart-title">🥧 What ${prof.name} practices most</div>
          ${PtChart.pie(playData)}
        </div>` : '';

      html += `
        <div class="parent-card">
          <div class="parent-card-head">
            <span class="parent-child-name">${prof.name}</span>
            ${prof.age != null ? `<span class="parent-child-age">age ${prof.age}</span>` : ''}
            <span class="parent-child-region">${prof.region === 'johto' ? 'Johto' : 'Kanto'} · ${prof.bosses} badges</span>
          </div>
          <div class="parent-summary">${summary}</div>
          <div class="parent-engage">
            <span>🎮 ${totalGames} learning games played</span>
            <span>🗺️ ${prof.stats.totalNodesCompleted || 0} stops completed</span>
            <span>⚔️ ${prof.stats.totalBattlesWon || prof.stats.battlesWon || 0} battles won</span>
          </div>
          ${pieBlock}
          ${strengths.length ? `<div class="parent-flags">
            ${strengths.map(r => `<span class="pt-flag pt-flag-strong">💪 ${nameOf(r.sk)}</span>`).join('')}
            ${struggles.filter(r => !strengths.find(s => s.sk === r.sk)).map(r => `<span class="pt-flag pt-flag-grow">🌱 ${nameOf(r.sk)}</span>`).join('')}
          </div>` : ''}
          <div class="pt-skill-list">${rows.join('')}</div>
        </div>`;
    });

    html += `
      <div class="parent-footer">
        <button class="btn-pixel btn-util" id="parent-change-pin">Change PIN</button>
      </div>`;

    wrap.innerHTML = html;
    document.getElementById('parent-exit').onclick = () => { this._authed = false; showScreen('start'); };
    const cp = document.getElementById('parent-change-pin');
    if (cp) cp.onclick = () => { localStorage.removeItem(PARENT_PIN_KEY); this._renderPinSetup(); };
    // Chart drill-down toggles
    wrap.querySelectorAll('.pt-charts-toggle').forEach(btn => {
      btn.onclick = () => {
        const panel = document.getElementById(btn.dataset.target);
        if (!panel) return;
        const open = panel.style.display !== 'none';
        panel.style.display = open ? 'none' : '';
        btn.textContent = open ? 'View charts ▾' : 'Hide charts ▴';
      };
    });
  },
};

const ProfileEngine = {

  // ── Open profile screen ───────────────────────────────────────────────────
  show(fromStart = true) {
    // Flush any pending debounced save before we leave an active run
    if (GameState && GameState.party) saveGame(true);
    this._fromStart = fromStart;
    showScreen('profiles');
    this._render();
  },

  _render() {
    const profiles = loadProfiles();
    const grid = document.getElementById('profiles-grid');
    grid.innerHTML = '';
    const active = getActiveProfile();

    profiles.forEach(meta => {
      const isActive = meta.key === active;
      const card = document.createElement('div');
      card.className = 'profile-card' + (isActive ? ' profile-card-active' : '');

      const badgeBar = meta.hasActiveSave
        ? `<div class="profile-badge-bar">
            ${Array(8).fill(0).map((_,i) =>
              `<div class="profile-badge-pip${i < meta.bossesDefeated ? ' earned' : ''}"></div>`
            ).join('')}
           </div>`
        : `<div class="profile-no-save">No save</div>`;

      const typeClass = meta.starterId
        ? (['','grass','grass','grass','fire','fire','fire',
            'water','water','water','electric'][meta.starterId] || 'normal')
        : 'normal';

      card.innerHTML = `
        ${isActive ? '<div class="profile-active-badge">✓ Active</div>' : ''}
        <div class="profile-sprite-wrap">
          <img src="${meta.starterSprite || ''}" alt=""
               onerror="this.style.display='none'"
               class="profile-starter-sprite type-bg-${typeClass}" />
          ${!meta.starterSprite ? `<div class="profile-sprite-placeholder">?</div>` : ''}
        </div>
        <div class="profile-name">${meta.name}</div>
        <div class="profile-tier-row">${this._tierLabel(meta.difficultyTier, meta.trainerAge)}</div>
        ${badgeBar}
        <div class="profile-wins-row ${this._progressCls(meta)}">${this._progressLabel(meta)}</div>
        <div class="profile-last-saved">${this._timeAgo(meta.lastSaved)}</div>
        <div class="profile-actions">
          <button class="btn-pixel btn-primary profile-play-btn"
                  data-key="${meta.key}">▶ Play</button>
          ${meta.leagueUnlocked ? `<button class="btn-pixel btn-league profile-league-btn"
                  data-key="${meta.key}" title="Enter the Pokémon League">⚔️ League</button>` : ''}
          <button class="btn-pixel btn-secondary profile-age-btn"
                  data-key="${meta.key}" title="Change difficulty">✏️</button>
          <button class="btn-pixel btn-danger profile-delete-btn"
                  data-key="${meta.key}">🗑</button>
        </div>
      `;

      card.querySelector('.profile-play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this._selectProfile(meta.key);
      });
      const leagueBtn = card.querySelector('.profile-league-btn');
      if (leagueBtn) {
        leagueBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._selectProfile(meta.key, true);
        });
      }
      card.querySelector('.profile-age-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this._changeAge(meta);
      });
      card.querySelector('.profile-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this._confirmDelete(meta);
      });

      grid.appendChild(card);
    });

    // Add "New Profile" slot if under limit
    if (profiles.length < MAX_PROFILES) {
      const addCard = document.createElement('div');
      addCard.className = 'profile-card profile-card-add';
      addCard.innerHTML = `
        <div class="profile-add-icon">+</div>
        <div class="profile-add-label">New Profile</div>
      `;
      addCard.addEventListener('click', () => this._newProfile());
      grid.appendChild(addCard);
    }

    // Back button — only show if there's at least one profile (can't go back with nothing)
    const backBtn = document.getElementById('btn-profiles-back');
    if (backBtn) backBtn.style.display = profiles.length > 0 ? '' : 'none';
  },

  _tierLabel(tier, age) {
    const t = tier || 2;
    const map = {
      1: { emoji:'🌱', label:'Starter',  cls:'tier-pill-1' },
      2: { emoji:'⚡', label:'Explorer', cls:'tier-pill-2' },
      3: { emoji:'🔥', label:'Advanced', cls:'tier-pill-3' },
    };
    const { emoji, label, cls } = map[t] || map[2];
    const ageRange = t === 1 ? '6–7' : t === 2 ? '8–9' : '10+';
    return `<span class="tier-pill ${cls}">${emoji} Age ${ageRange} · ${label}</span>`;
  },

  // Progress toward the next region milestone — shared by all three UI surfaces.
  // mode 'full'  → "🏆 Championships 2/3"
  // mode 'short' → "🏆 2/3" (for the compact start-screen banner)
  _progressLabel(meta, mode = 'full') {
    const w = Math.min(meta.totalWins || 0, 3);
    const lw = meta.leagueWins || 0;
    if (meta.johtoUnlocked) {
      return mode === 'short' ? '🌿 Johto ✓' : '🌿 Johto unlocked ✓';
    }
    if (meta.leagueUnlocked) {
      return mode === 'short' ? `⚔️ ${lw}/1` : `⚔️ League: ${lw}/1 won`;
    }
    return mode === 'short' ? `🏆 ${w}/3` : `🏆 Championships ${w}/3`;
  },

  // CSS class describing which milestone tier the label is at (for colouring)
  _progressCls(meta) {
    if (meta.johtoUnlocked)  return 'pw-johto';
    if (meta.leagueUnlocked) return 'pw-league';
    return 'pw-kanto';
  },

  _selectProfile(key, goLeague = false) {
    setActiveProfile(key);
    ProfileEngine._updateStartScreen();
    if (goLeague) {
      showScreen('start');
      setTimeout(() => LeagueEngine.showPartySelect(), 200);
    } else {
      showScreen('start');
    }
  },

  _newProfile() {
    // Go to register — after registration, createProfile() is called with the name
    // Set a flag so Game.startNew knows this is a fresh profile creation
    activeProfile = null;
    try { sessionStorage.removeItem('pokerogue_active_profile'); } catch(e) {}
    Game.startNew(true); // true = profile creation mode
  },

  _confirmDelete(meta) {
    showModal(
      `Delete ${meta.name}?`,
      `This removes all saves, Pokédex entries and unlocks for ${meta.name}. Cannot be undone.`,
      () => {
        deleteProfile(meta.key);
        // If deleted profile was active, clear and re-render
        this._updateStartScreen();
        this._render();
      }
    );
  },

  // ── Update the start screen banner + button states ────────────────────────
  _updateStartScreen() {
    const profiles   = loadProfiles();
    const activeKey  = getActiveProfile();
    const meta       = profiles.find(p => p.key === activeKey);

    const banner     = document.getElementById('active-profile-banner');
    const nudge      = document.getElementById('no-profile-nudge');
    const newBtn     = document.getElementById('btn-new-game');
    const contBtn    = document.getElementById('btn-continue-game');
    const dexBtn     = document.getElementById('btn-open-pokedex');
    const leagueBtn  = document.getElementById('btn-start-league');
    const regionPill = document.getElementById('start-region-pill');
    const logoSub    = document.getElementById('logo-sub');

    if (!meta) {
      // No active profile — disable game buttons, show nudge
      if (banner) banner.style.display = 'none';
      if (nudge)  nudge.style.display  = '';
      if (newBtn)    { newBtn.disabled  = true; newBtn.textContent = '▶ New Game'; }
      if (contBtn)   { contBtn.disabled = true; contBtn.textContent = '◈ Continue'; }
      if (dexBtn)    { dexBtn.disabled  = true; }
      if (leagueBtn) { leagueBtn.style.display = 'none'; }
      if (regionPill){ regionPill.textContent = '🗺️ Kanto Region'; regionPill.className = 'start-region-pill'; }
      if (logoSub)   { logoSub.textContent = 'A Roguelite Card Adventure'; }
      return;
    }

    // Profile active — show banner
    if (nudge)  nudge.style.display  = 'none';
    if (banner) {
      banner.style.display = '';

      const tier = meta.difficultyTier || 2;
      const TIER_COLORS = {
        1: { border:'#66cc66', glow:'rgba(80,200,80,.35)',  tint:'rgba(60,160,60,.25)'  },
        2: { border:'#ffd700', glow:'rgba(255,215,0,.25)',  tint:'rgba(180,140,0,.2)'   },
        3: { border:'#ff8c40', glow:'rgba(255,140,40,.35)', tint:'rgba(200,80,20,.25)'  },
      };
      const tc = TIER_COLORS[tier] || TIER_COLORS[2];

      // Border + glow colour reflects tier
      banner.style.borderColor = tc.border;
      banner.style.boxShadow   = `0 0 16px ${tc.glow}`;

      // Sprite wrap background tint
      const wrapEl = document.getElementById('apb-sprite-wrap');
      if (wrapEl) wrapEl.style.background = tc.tint;

      // Name
      const nameEl = document.getElementById('apb-name');
      if (nameEl) nameEl.textContent = meta.name;

      // Sprite
      const spriteEl = document.getElementById('apb-sprite');
      if (spriteEl) {
        spriteEl.src = meta.starterSprite || '';
        spriteEl.style.display = meta.starterSprite ? '' : 'none';
      }

      // Inline tier pill + win-progress pill
      const tierInline = document.getElementById('apb-tier-inline');
      if (tierInline) {
        tierInline.innerHTML = this._tierLabel(tier, meta.trainerAge) +
          `<span class="apb-wins-pill ${this._progressCls(meta)}">${this._progressLabel(meta, 'short')}</span>`;
      }

      // Detail line — badge progress + timestamp
      const detailEl = document.getElementById('apb-detail');
      if (detailEl) {
        detailEl.textContent = meta.hasActiveSave
          ? `${meta.bossesDefeated}/8 badges · ${this._timeAgo(meta.lastSaved)}`
          : 'No active run';
      }

      // Edit button — wire up (button already in HTML, just re-bind)
      const editBtn = document.getElementById('apb-edit-age-btn');
      if (editBtn) editBtn.onclick = () => ProfileEngine._changeAge(meta);

      // Remove any old dynamically-appended age row (legacy cleanup)
      document.getElementById('apb-age-row')?.remove();
    }

    // Enable/disable buttons
    const johtoUnlocked = !!meta.leagueUnlocked && !!meta.johtoUnlocked;
    // Johto tint on start screen
    document.getElementById('screen-start')
      ?.classList.toggle('johto-active', johtoUnlocked);
    document.body.classList.toggle('johto-accent', johtoUnlocked);
    // Sync BGM when already on the start screen (e.g. profile switch)
    if (document.getElementById('screen-start')?.classList.contains('active')) {
      SoundEngine.onScreenChange('start');
    }
    // Region pill + logo sub
    if (regionPill) {
      regionPill.textContent = johtoUnlocked ? '🌿 Johto Region' : '🗺️ Kanto Region';
      regionPill.className   = 'start-region-pill' + (johtoUnlocked ? ' johto' : '');
    }
    if (logoSub) {
      logoSub.textContent = johtoUnlocked
        ? 'Now exploring Johto!'
        : 'A Roguelite Card Adventure';
    }
    if (newBtn) {
      newBtn.disabled    = false;
      newBtn.textContent = johtoUnlocked ? '🌿 New Johto Run' : '▶ New Kanto Run';
    }
    if (dexBtn)  dexBtn.disabled  = false;
    if (contBtn) {
      const hasSave = meta.hasActiveSave;
      contBtn.disabled    = !hasSave;
      contBtn.textContent = hasSave
        ? `◈ Continue · ${meta.bossesDefeated}/8`
        : '◈ No Save';
    }
    // League button — only shown when unlocked for this profile
    if (leagueBtn) {
      leagueBtn.style.display = meta.leagueUnlocked ? '' : 'none';
    }
  },

  // ── Age change modal ──────────────────────────────────────────────────────
  _changeAge(meta) {
    // Remove any existing modal
    document.getElementById('age-change-modal')?.remove();

    const currentTier = meta.difficultyTier || 2;
    const currentAge  = meta.trainerAge     || (currentTier === 1 ? 7 : currentTier === 2 ? 9 : 11);

    const AGES = [6, 7, 8, 9, 10, 11];
    const overlay = document.createElement('div');
    overlay.id        = 'age-change-modal';
    overlay.className = 'age-modal-overlay';
    overlay.innerHTML = `
      <div class="age-modal">
        <div class="age-modal-title">Change Difficulty</div>
        <div class="age-modal-name">for ${meta.name}</div>
        <div class="age-modal-hint">Select an age group:</div>
        <div class="age-modal-btns" id="age-modal-btns">
          ${AGES.map(a => `
            <button class="age-modal-age-btn${a === currentAge ? ' age-modal-selected' : ''}"
                    data-age="${a}">${a === 11 ? '11+' : a}</button>
          `).join('')}
        </div>
        <div class="age-modal-tier-preview" id="age-modal-preview">
          ${this._tierLabel(currentTier, currentAge)}
        </div>
        <div class="age-modal-warning" id="age-modal-warning"></div>
        <div class="age-modal-actions">
          <button class="btn-pixel btn-secondary" id="age-modal-cancel">Cancel</button>
          <button class="btn-pixel btn-primary"   id="age-modal-confirm">✓ Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    let selectedAge = currentAge;

    // Age button interactions
    overlay.querySelectorAll('.age-modal-age-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.age-modal-age-btn').forEach(b => b.classList.remove('age-modal-selected'));
        btn.classList.add('age-modal-selected');
        selectedAge = parseInt(btn.dataset.age);
        const newTier    = selectedAge <= 7 ? 1 : selectedAge <= 9 ? 2 : 3;
        const preview    = document.getElementById('age-modal-preview');
        const warning    = document.getElementById('age-modal-warning');
        if (preview) preview.innerHTML = this._tierLabel(newTier, selectedAge);
        if (warning) {
          if (newTier > currentTier) {
            warning.textContent = '⚠️ Difficulty increase — puzzles will be harder from the next map.';
            warning.className   = 'age-modal-warning age-modal-warn-up';
          } else if (newTier < currentTier) {
            warning.textContent = '✓ Difficulty lowered — puzzles will be simpler from the next map.';
            warning.className   = 'age-modal-warning age-modal-warn-down';
          } else {
            warning.textContent = '';
            warning.className   = 'age-modal-warning';
          }
        }
      });
    });

    // Cancel
    document.getElementById('age-modal-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // Confirm
    document.getElementById('age-modal-confirm').addEventListener('click', () => {
      const newTier = selectedAge <= 7 ? 1 : selectedAge <= 9 ? 2 : 3;

      // Update profile meta
      const profiles = loadProfiles();
      const idx = profiles.findIndex(p => p.key === meta.key);
      if (idx >= 0) {
        profiles[idx].trainerAge     = selectedAge;
        profiles[idx].difficultyTier = newTier;
        saveProfiles(profiles);
      }

      // If this is the active profile and there's a live GameState, update it too
      if (meta.key === getActiveProfile() && GameState) {
        GameState.trainerAge     = selectedAge;
        GameState.difficultyTier = newTier;
        saveGame();
      }

      overlay.remove();
      // Re-render with fresh meta from storage
      ProfileEngine._render();
      ProfileEngine._updateStartScreen();
    });
  },

  _timeAgo(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 2)   return 'just now';
    if (mins  < 60)  return `${mins}m ago`;
    if (hours < 24)  return `${hours}h ago`;
    return `${days}d ago`;
  },
};


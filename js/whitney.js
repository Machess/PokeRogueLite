const WHITNEY_JUGS = [
  { ml: 100,  label: '100ml',  color: '#e0f4ff', h: 28 },
  { ml: 250,  label: '250ml',  color: '#c8ecff', h: 48 },
  { ml: 500,  label: '500ml',  color: '#a8e0ff', h: 72 },
  { ml: 1000, label: '1L',     color: '#80ccff', h: 100 },
];

const WHITNEY_BERRIES = [
  { id:'oran',   name:'Oran',   color:'#5a80e0', light:'#a0b8ff', emoji:'🫐' },
  { id:'sitrus', name:'Sitrus', color:'#e0c020', light:'#ffe880', emoji:'🍋' },
  { id:'pecha',  name:'Pecha',  color:'#e060a0', light:'#ffb0d8', emoji:'🍓' },
  { id:'rawst',  name:'Rawst',  color:'#40a840', light:'#90d890', emoji:'🍃' },
  { id:'cheri',  name:'Cheri',  color:'#d03020', light:'#ff9080', emoji:'🍒' },
  { id:'aspear', name:'Aspear', color:'#c8c040', light:'#f0e890', emoji:'🍑' },
];

// Orders per tier: { ml, berry|null, customer, hint }
const WHITNEY_ORDERS = {
  1: [
    { ml:250,  berry:null,    customer:"🧒", hint:"250ml of fresh milk please!" },
    { ml:500,  berry:'oran',  customer:"👩", hint:"A 500ml Oran Berry shake!" },
    { ml:1000, berry:null,    customer:"👴", hint:"One full litre of milk." },
    { ml:250,  berry:'pecha', customer:"🧒", hint:"250ml Pecha Berry shake please!" },
    { ml:500,  berry:null,    customer:"👩", hint:"500ml milk for my recipe." },
  ],
  2: [
    { ml:350,  berry:null,    customer:"👩", hint:"Exactly 350ml of milk." },
    { ml:600,  berry:'cheri', customer:"🧒", hint:"600ml Cheri Berry shake!" },
    { ml:750,  berry:null,    customer:"👴", hint:"750ml of Miltank milk." },
    { ml:1100, berry:'sitrus',customer:"👩", hint:"1100ml Sitrus shake please." },
    { ml:1000, berry:'rawst', customer:"🧒", hint:"A 1L Rawst Berry shake!" },
  ],
  3: [
    { ml:850,  berry:'rawst', customer:"👩", hint:"850ml Rawst shake — remember!" },
    { ml:1350, berry:null,    customer:"👴", hint:"1350ml of milk, quickly!" },
    { ml:600,  berry:'pecha', customer:"🧒", hint:"600ml Pecha shake — fast!" },
    { ml:1750, berry:'aspear',customer:"👩", hint:"1750ml Aspear shake!" },
    { ml:1100, berry:'cheri', customer:"🧒", hint:"1100ml Cheri Berry shake!" },
  ],
};

const WhitneyEngine = {
  _isActive: false, _node: null,
  _round: 0, _score: 0, _combos: 0,
  _currentMl: 0, _targetMl: 0,
  _targetBerry: null, _selectedBerry: null,
  _phase: 'fill',   // 'fill' | 'berry' | 'done'
  _orders: [],
  _timeouts: [],
  _miltankSprite: null,

  async start(node) {
    this._node    = node;
    this._isActive = true;
    this._round   = 0;
    this._score   = 0;
    this._combos  = 0;
    this._timeouts = [];
    ActiveEngine.set(this);

    // Pre-fetch Miltank sprite
    const data = await fetchPoke(241).catch(() => null);
    this._miltankSprite = data ? getSpriteUrl(data) :
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/241.png';

    showBossIntro({
      gymIndex: 2, portrait: 'whitney.png',
      name: 'Whitney', btnLabel: '🥛 Open the Shake Bar!',
      introText: "La-la-la! Welcome to Miltank's Shake Bar! Fill the jug to the right amount — and for shakes, pick the right berry too! Ready?",
    });
  },

  startGame() {
    this._isActive = false; ActiveEngine.clear();
    document.getElementById('trainer-intro').style.display = 'none';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');

    const tier   = Math.min(GameState.difficultyTier || 2, 3);
    this._orders = [...WHITNEY_ORDERS[tier]];
    this._showRound();
  },

  _showRound() {
    if (this._round >= this._orders.length) { this._finish(); return; }
    this._timeouts.forEach(t => clearTimeout(t)); this._timeouts = [];

    const order     = this._orders[this._round];
    const tier      = Math.min(GameState.difficultyTier || 2, 3);
    this._targetMl  = order.ml;
    this._targetBerry = order.berry;
    this._currentMl = 0;
    this._selectedBerry = null;
    this._phase     = 'fill';
    this._firstPour = true;  // for combo tracking

    const cv = setupChallengeScreen({
      portrait: 'whitney.png', badge: '🥛 Shake Bar',
      intro: `Order ${this._round + 1}/5 — Score: ${this._score}`,
      wrapClass: 'whitney-wrap', screenClass: 'whitney-active',
    });

    // ── Order speech bubble ───────────────────────────────────────────────────
    const bubble = document.createElement('div');
    bubble.className = 'wh-bubble';
    bubble.innerHTML = `<span class="wh-customer">${order.customer}</span>
      <span class="wh-hint" id="wh-hint">${order.hint}</span>`;
    cv.appendChild(bubble);

    // On Tier 2 hint fades after 3s; Tier 3 fades after 1.5s
    if (tier >= 2) {
      this._timeouts.push(setTimeout(() => {
        const h = document.getElementById('wh-hint');
        if (h) { h.style.transition = 'opacity 1s'; h.style.opacity = '0'; }
      }, tier === 2 ? 3000 : 1500));
    }

    // ── Target label ─────────────────────────────────────────────────────────
    const targetRow = document.createElement('div');
    targetRow.className = 'wh-target-row';
    targetRow.innerHTML = `<span class="wh-target-label">TARGET:</span>
      <span class="wh-target-val" id="wh-target-val">${order.ml}ml</span>
      ${order.berry ? `<span class="wh-target-berry">${this._berryById(order.berry).emoji} ${tier === 1 ? this._berryById(order.berry).name : ''}</span>` : ''}`;
    cv.appendChild(targetRow);

    // ── Main area — jug + jugs panel ─────────────────────────────────────────
    const mainRow = document.createElement('div');
    mainRow.className = 'wh-main-row';
    cv.appendChild(mainRow);

    // Order jug (centre)
    const jugWrap = document.createElement('div');
    jugWrap.className = 'wh-jug-wrap';
    const maxDisplay = 2000;
    jugWrap.innerHTML = `
      <div class="wh-jug-container" id="wh-jug-container">
        <div class="wh-jug-fill" id="wh-jug-fill"></div>
        <div class="wh-jug-target-line" id="wh-jug-target-line"
             style="bottom:${(order.ml / maxDisplay * 100).toFixed(1)}%"></div>
        <div class="wh-jug-markings">${this._jugMarkings(maxDisplay)}</div>
      </div>
      <div class="wh-jug-readout" id="wh-jug-readout">0 / ${order.ml}ml</div>
      <button class="btn-pixel btn-secondary wh-reset-btn" id="wh-reset-btn">↺ Reset</button>`;
    mainRow.appendChild(jugWrap);

    // Miltank sprite
    const miltank = document.createElement('img');
    miltank.src = this._miltankSprite;
    miltank.className = 'wh-miltank';
    jugWrap.appendChild(miltank);

    // Pour jugs panel (right)
    const jugPanel = document.createElement('div');
    jugPanel.className = 'wh-jug-panel';
    WHITNEY_JUGS.forEach(j => {
      const btn = document.createElement('button');
      btn.className = 'wh-pour-btn';
      btn.id = `wh-pour-${j.ml}`;
      btn.innerHTML = `<div class="wh-pour-jug" style="height:${j.h}px;background:${j.color}"></div>
        <span class="wh-pour-label">${tier <= 2 ? j.label : ''}</span>`;
      btn.addEventListener('click', () => this._pour(j.ml));
      jugPanel.appendChild(btn);
    });
    mainRow.appendChild(jugPanel);

    // Reset button
    document.getElementById('wh-reset-btn').addEventListener('click', () => {
      this._currentMl = 0;
      this._selectedBerry = null;
      this._phase = 'fill';
      this._firstPour = false;  // combo broken on reset
      this._updateJug(false, null);
      this._hideBerryTray();
    });

    // ── Berry tray (hidden until jug filled) ─────────────────────────────────
    const berryTray = document.createElement('div');
    berryTray.className = 'wh-berry-tray wh-berry-locked';
    berryTray.id = 'wh-berry-tray';
    berryTray.innerHTML = `<div class="wh-berry-lock-msg" id="wh-berry-lock-msg">
      🔒 Fill to ${order.ml}ml first</div>`;
    if (order.berry) cv.appendChild(berryTray);

    // Timer (Tier 3 only)
    if (tier >= 3) {
      const timerBar = document.createElement('div');
      timerBar.className = 'wh-timer-bar';
      timerBar.innerHTML = `<div class="wh-timer-fill" id="wh-timer-fill"></div>`;
      cv.appendChild(timerBar);
      setTimeout(() => {
        const f = document.getElementById('wh-timer-fill');
        if (f) { f.style.transition = 'width 12s linear'; f.style.width = '0%'; }
      }, 50);
      this._timeouts.push(setTimeout(() => {
        if (this._phase !== 'done') {
          this._roundResult(false, 'timeout');
        }
      }, 12000));
    }
  },

  _pour(ml) {
    if (this._phase !== 'fill') return;
    const order = this._orders[this._round];
    this._currentMl += ml;

    // Over-filled
    if (this._currentMl > order.ml) {
      this._currentMl = 0;
      this._firstPour = false;
      this._updateJug(true, null);  // flash red
      this._showWhitneyComment("overflow");
      return;
    }

    this._updateJug(false, null);

    // Exactly right
    if (this._currentMl === order.ml) {
      if (order.berry) {
        // Need to pick berry
        this._phase = 'berry';
        this._showBerryTray();
      } else {
        // Plain milk — done
        this._roundResult(true, 'plain');
      }
    }
  },

  _showBerryTray() {
    const tray = document.getElementById('wh-berry-tray');
    if (!tray) return;
    tray.classList.remove('wh-berry-locked');
    tray.innerHTML = '';

    const tier    = Math.min(GameState.difficultyTier || 2, 3);
    const order   = this._orders[this._round];
    // Show 2 berries Tier 1, 3 Tier 2, 4 Tier 3
    const count   = tier === 1 ? 2 : tier === 2 ? 3 : 4;
    const correct = this._berryById(order.berry);
    const others  = shuffle(WHITNEY_BERRIES.filter(b => b.id !== order.berry)).slice(0, count - 1);
    const options = shuffle([correct, ...others]);

    options.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'wh-berry-btn';
      btn.style.setProperty('--berry-color', b.color);
      btn.style.setProperty('--berry-light', b.light);
      btn.innerHTML = `<span class="wh-berry-emoji">${b.emoji}</span>
        ${tier <= 2 ? `<span class="wh-berry-name">${b.name}</span>` : ''}`;
      btn.addEventListener('click', () => this._pickBerry(b));
      tray.appendChild(btn);
    });
  },

  _hideBerryTray() {
    const tray = document.getElementById('wh-berry-tray');
    if (!tray) return;
    const order = this._orders[this._round];
    tray.classList.add('wh-berry-locked');
    tray.innerHTML = `<div class="wh-berry-lock-msg">🔒 Fill to ${order.ml}ml first</div>`;
  },

  _pickBerry(berry) {
    if (this._phase !== 'berry') return;
    const order = this._orders[this._round];

    if (berry.id === order.berry) {
      // Correct berry — colour the jug
      this._selectedBerry = berry;
      this._updateJug(false, berry);
      this._roundResult(true, 'shake');
    } else {
      // Wrong berry — don't fail the round, just clear berry and show message
      this._firstPour = false;
      this._phase = 'berry';  // stays in berry phase
      this._showWhitneyComment("wrongberry");
      // Flash the wrong button red
      const tray = document.getElementById('wh-berry-tray');
      tray?.querySelectorAll('.wh-berry-btn').forEach(b => { b.disabled = true; });
      setTimeout(() => { this._showBerryTray(); }, 800);
    }
  },

  _roundResult(won, type) {
    this._phase = 'done';
    this._timeouts.forEach(t => clearTimeout(t)); this._timeouts = [];

    const combo = won && this._firstPour;
    if (combo) this._combos++;
    else       this._combos = 0;

    const pts = won ? (type === 'shake' ? 20 : 15) + (combo ? 5 : 0) : 0;
    this._score += pts;

    document.getElementById('challenge-intro').textContent =
      `Order ${this._round + 1}/5 — Score: ${this._score}`;

    if (won) {
      this._showWhitneyComment(combo ? 'combo' : type === 'shake' ? 'shake' : 'plain');
      if (this._combos >= 3) this._showWhitneyComment('streak');
    }

    this._timeouts.push(setTimeout(() => {
      this._round++;
      this._showRound();
    }, 1400));
  },

  _updateJug(overflow, berry) {
    const order    = this._orders[this._round];
    const fillEl   = document.getElementById('wh-jug-fill');
    const readout  = document.getElementById('wh-jug-readout');
    const container= document.getElementById('wh-jug-container');
    if (!fillEl) return;
    const pct = Math.min(this._currentMl / 2000 * 100, 100);
    const fillColor = berry ? berry.color : '#e8f8ff';
    fillEl.style.height     = `${pct}%`;
    fillEl.style.background = berry
      ? `linear-gradient(180deg, ${berry.light}, ${berry.color})`
      : 'linear-gradient(180deg, #ffffff, #c8ecff)';
    if (readout) readout.textContent = `${this._currentMl} / ${order.ml}ml`;
    if (overflow && container) {
      container.classList.add('wh-overflow');
      setTimeout(() => container.classList.remove('wh-overflow'), 600);
    }
  },

  _jugMarkings(maxMl) {
    return [200,400,600,800,1000,1500,2000]
      .map(v => `<div class="wh-mark" style="bottom:${(v/maxMl*100).toFixed(1)}%">
        <span>${v >= 1000 ? v/1000+'L' : v+'ml'}</span></div>`).join('');
  },

  _berryById(id) {
    return WHITNEY_BERRIES.find(b => b.id === id) || WHITNEY_BERRIES[0];
  },

  _showWhitneyComment(type) {
    const msgs = {
      plain:    ["Exactly right! La-la-la! ✨", "Perfect measure! ⭐"],
      shake:    ["One shake coming up! You're amazing! 🎀", "That's the one! ✨"],
      combo:    ["First try! ⭐ Combo!"],
      streak:   ["You're a natural! Whitney approves! 🎀"],
      overflow: ["Too much! Poor Miltank has to make more! 😅", "Oops! Too full!"],
      wrongberry:["That's not it! Look at the colour! 🎨"],
      timeout:  ["Too slow! The customer is waiting! ⏰"],
    };
    const pool = msgs[type] || msgs.plain;
    const text = pool[Math.floor(Math.random() * pool.length)];
    const comment = document.createElement('div');
    comment.className = 'wh-comment';
    comment.textContent = text;
    const cv = document.getElementById('challenge-coin-visual');
    if (cv) {
      cv.appendChild(comment);
      setTimeout(() => comment.remove(), 1200);
    }
  },

  _finish() {
    const maxScore = this._orders.reduce((s, o) => s + (o.berry ? 25 : 20), 0);
    const pct  = this._score / maxScore;
    const won  = pct >= 0.5;
    const gold = won ? Math.round(10 + this._score / 2) : 6;
    completeChallenge({
      screenClass: 'whitney-active', won,
      goldReward: gold,
      score: this._score, maxScore: maxScore, gameKey: 'whitney',
      tokenLabel: pct >= 0.9 ? 'First-try master — next hit blocked!' : null,
      effects: pct >= 0.9 ? { whitneyDodge: true } : {},
      modalTitle: pct >= 0.9 ? '🥛 Perfect Shake Bar!' : won ? '🥛 Orders Filled!' : '🥛 Needs Practice',
      modalBody: `⭐ ${this._score}/${maxScore} pts · ${this._combos} combos\n+${gold}💰` +
        (pct >= 0.9 ? '\n\n⭐ First-try master — next hit fully blocked!' : ''),
    });
  },
};



// ─── MORTY ENGINE — "Ghost Séance" (Memory pairs with ghost symbols) ─────────
// Reuses NinjaMemoryEngine pattern with ghost-themed cards and Morty's bg.

const CLAIR_DRAGONS = [
  { name:'Dratini',   type:'dragon', weakness:'ice',      icon:'🐉', color:'#4a80e0' },
  { name:'Dragonair', type:'dragon', weakness:'ice',      icon:'🌀', color:'#6a60c0' },
  { name:'Seadra',    type:'water',  weakness:'electric', icon:'🌊', color:'#2a80c0' },
  { name:'Gyarados',  type:'water',  weakness:'electric', icon:'🌊', color:'#1a60b0' },
  { name:'Aerodactyl',type:'flying', weakness:'electric', icon:'🦅', color:'#8080c0' },
  { name:'Charizard', type:'fire',   weakness:'water',    icon:'🔥', color:'#d04020' },
];

const ClairEngine = {
  _isActive:false, _node:null, _round:0, _hits:0, _seq:[],

  start(node) {
    this._node = node; this._isActive = true; this._round = 0; this._hits = 0;
    ActiveEngine.set(this);
    // Build 5-dragon sequence
    this._seq = shuffle([...CLAIR_DRAGONS]).slice(0, 5);
    showBossIntro({
      gymIndex: 7, portrait: 'clair.png',
      name: 'Clair', btnLabel: 'Face the Dragons 🐉',
      introText: "Dragons do not wait for you to think. Read the charge and pick the right counter — fast! One wrong move and you are finished.",
    });
  },

  startGame() {
    this._isActive = false; ActiveEngine.clear();
    document.getElementById('trainer-intro').style.display = 'none';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    this._showRound();
  },

  _showRound() {
    if (this._round >= 5) { this._finish(); return; }
    const tier   = GameState.difficultyTier || 2;
    const dragon = this._seq[this._round];
    const cv     = setupChallengeScreen({ portrait:'clair.png', badge:'🐉 Dragon Tamer',
      intro: `Round ${this._round + 1}/5`,
      wrapClass: 'clair-wrap', screenClass: 'clair-active' });

    // Dragon charge display
    const chargeEl = document.createElement('div');
    chargeEl.className = 'clair-charge';
    chargeEl.style.setProperty('--dragon-color', dragon.color);
    chargeEl.innerHTML = `
      <div class="clair-dragon-icon">${dragon.icon}</div>
      ${tier <= 1 ? `<div class="clair-dragon-name">${dragon.name} — ${dragon.type} type</div>` : `<div class="clair-dragon-type-bar" style="background:${dragon.color}"></div>`}
      <div class="clair-dragon-label">Incoming charge!</div>`;
    cv.appendChild(chargeEl);

    // 3 choices — correct weakness + 2 wrong
    const allWeaknesses = ['ice','electric','water','fire','fighting','rock'];
    const wrong = shuffle(allWeaknesses.filter(w => w !== dragon.weakness)).slice(0, 2);
    const choices = shuffle([dragon.weakness, ...wrong]);

    const btnRow = document.createElement('div');
    btnRow.className = 'clair-choices';
    choices.forEach(c => {
      const btn = document.createElement('button');
      btn.className = `clair-choice type-badge-btn type-${c}`;
      btn.textContent = c;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.clair-choice').forEach(b => {
          b.disabled = true;
          if (b.textContent === dragon.weakness) b.classList.add('clair-correct');
        });
        if (c === dragon.weakness) {
          this._hits++;
          chargeEl.classList.add('clair-stopped');
        } else {
          btn.classList.add('clair-wrong');
          chargeEl.classList.add('clair-hit');
        }
        setTimeout(() => { this._round++; this._showRound(); }, 800);
      });
      btnRow.appendChild(btn);
    });
    cv.appendChild(btnRow);

    // Auto-fail timer for tier 2+
    if (tier >= 2) {
      const ms = Math.max(2500, 5500 - this._round * 300);
      setTimeout(() => {
        if (!document.querySelector('.clair-stopped, .clair-hit')) {
          document.querySelectorAll('.clair-choice').forEach(b => {
            b.disabled = true;
            if (b.textContent === dragon.weakness) b.classList.add('clair-correct');
          });
          chargeEl.classList.add('clair-hit');
          setTimeout(() => { this._round++; this._showRound(); }, 800);
        }
      }, ms);
    }
  },

  _finish() {
    const gold = this._hits >= 5 ? 30 : this._hits >= 3 ? 18 : 8;
    completeChallenge({
      screenClass: 'clair-active', won: this._hits >= 4,
      goldReward: gold,
      score: this._hits, maxScore: 5, gameKey: 'clair',
      tokenLabel: this._hits === 5 ? 'Dragon Bane — Dragon/Water +25%!' : null,
      effects: this._hits === 5 ? { clairDragonBane: true } : {},
      modalTitle: this._hits >= 5 ? '🐉 Dragon Tamed!' : '🐉 Dragon Tamer',
      modalBody: `${this._hits}/5 counters correct\n+${gold}💰` +
        (this._hits === 5 ? '\n\n⭐ Dragon Bane — Dragon and Water moves deal +25% next battle!' : ''),
    });
  },
};

// ─── CHUCK ENGINE — "Chuck's Training Clock" — teaches reading clocks ─────────
// Tier 1: whole hours, pick the right clock face from 3.
// Tier 2: half/quarter hours, set the hands with +hour/+5min buttons.
// Tier 3: elapsed-time problems ("started 3:15, lasted 45min — set the end time").

// Render an analog clock as inline SVG. h = 0-11, m = 0-55 (5-min steps).

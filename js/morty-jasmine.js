const MORTY_CARDS = [
  { id:'gastly',   icon:'👻', label:'Gastly'   },
  { id:'haunter',  icon:'🌑', label:'Haunter'  },
  { id:'gengar',   icon:'💀', label:'Gengar'   },
  { id:'misdreavus',icon:'😱',label:'Misdreavus'},
  { id:'fog',      icon:'🌫️', label:'Fog Bell' },
  { id:'candle',   icon:'🕯️', label:'Candle'   },
  { id:'eye',      icon:'👁',  label:'Watching' },
  { id:'crystal',  icon:'💎', label:'Crystal'  },
];

const MortyEngine = {
  _isActive:false, _node:null, _grid:[], _first:null, _misses:0,
  _matched:0, _budget:0, _pairCount:0, _locked:false, _peekMs:0,

  start(node) {
    this._node = node; this._isActive = true; this._first = null;
    this._misses = 0; this._matched = 0; this._locked = false;
    ActiveEngine.set(this);
    const tier = GameState.difficultyTier || 2;
    if (tier <= 1)       { this._pairCount = 4; this._budget = 7;  this._peekMs = 2500; }
    else if (tier === 2) { this._pairCount = 6; this._budget = 9;  this._peekMs = 1500; }
    else                 { this._pairCount = 8; this._budget = 10; this._peekMs = 800;  }

    const pairs = shuffle([...MORTY_CARDS]).slice(0, this._pairCount);
    this._grid  = shuffle([...pairs, ...pairs].map(c => ({
      id: c.id, icon: c.icon, label: c.label, flipped:false, matched:false, el:null,
    })));

    showBossIntro({
      gymIndex: 3, portrait: 'morty.png',
      name: 'Morty', btnLabel: 'Enter the Séance 👻',
      introText: "The spirits speak to those who remember. Watch the ghosts appear, then repeat their order. I have already seen your future here…",
    });
  },

  startGame() {
    this._isActive = false; ActiveEngine.clear();
    document.getElementById('trainer-intro').style.display = 'none';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    this._render();
  },

  _render() {
    const cv = setupChallengeScreen({ portrait:'morty.png', badge:'👻 Ghost Séance',
      intro: `Match the pairs — ${this._budget} moves left`,
      wrapClass: 'morty-wrap', screenClass: 'morty-active' });

    const grid = document.createElement('div');
    grid.className = `morty-grid morty-grid-${this._pairCount * 2}`;
    this._grid.forEach((card, i) => {
      const el = document.createElement('div');
      el.className = 'morty-card morty-face-down';
      el.innerHTML = '<span class="morty-card-back">👁</span>';
      el.addEventListener('click', () => this._flip(i));
      card.el = el;
      grid.appendChild(el);
    });
    cv.appendChild(grid);

    // Peek phase — briefly show all cards
    MiniGameSession.later(() => {
      this._grid.forEach(c => {
        c.el.className = 'morty-card morty-face-up';
        c.el.innerHTML = `<span class="morty-card-front">${c.icon}</span>`;
      });
      MiniGameSession.later(() => {
        this._grid.forEach(c => {
          if (!c.matched) {
            c.el.className = 'morty-card morty-face-down';
            c.el.innerHTML = '<span class="morty-card-back">👁</span>';
          }
        });
      }, this._peekMs);
    }, 300);
  },

  _flip(i) {
    if (this._locked) return;
    const card = this._grid[i];
    if (card.flipped || card.matched) return;
    card.flipped = true;
    card.el.className = 'morty-card morty-face-up';
    card.el.innerHTML = `<span class="morty-card-front">${card.icon}</span>`;

    if (!this._first) { this._first = i; return; }

    const first = this._grid[this._first];
    this._first = null;
    this._locked = true;
    this._budget--;

    if (card.id === first.id) {
      this._matched++;
      card.el.classList.add('morty-matched');
      first.el.classList.add('morty-matched');
      card.matched = first.matched = true;
      this._locked = false;
      document.getElementById('challenge-intro').textContent =
        `Match the pairs — ${this._budget} moves left`;
      if (this._matched === this._pairCount) this._finish(true);
    } else {
      this._misses++;
      card.el.classList.add('morty-wrong'); first.el.classList.add('morty-wrong');
      MiniGameSession.later(() => {
        card.el.className = 'morty-card morty-face-down';
        card.el.innerHTML = '<span class="morty-card-back">👁</span>';
        first.el.className = 'morty-card morty-face-down';
        first.el.innerHTML = '<span class="morty-card-back">👁</span>';
        card.flipped = first.flipped = false;
        this._locked = false;
        document.getElementById('challenge-intro').textContent =
          `Match the pairs — ${this._budget} moves left`;
        if (this._budget <= 0) this._finish(false);
      }, 900);
    }
  },

  _finish(won) {
    const gold = won ? 22 : Math.max(5, 10 - this._misses);
    completeChallenge({
      screenClass: 'morty-active', won,
      goldReward: gold,
      score: this._matched, maxScore: this._pairCount, gameKey: 'morty',
      tokenLabel: won && this._misses === 0 ? 'Clairvoyance — strongest card next draw!' : null,
      effects: won && this._misses === 0 ? { mortyClairvoyance: true } : {},
      modalTitle: won ? '👻 The Spirits Are Pleased!' : '👻 The Fog Won',
      modalBody: `Matched ${this._matched}/${this._pairCount} pairs\n+${gold}💰` +
        (won && this._misses === 0 ? '\n\n⭐ Clairvoyance — next card drawn is always your strongest!' : ''),
    });
  },
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return isNaN(r) ? null : `${r},${g},${b}`;
}

// ─── JASMINE ENGINE — "Steel Forging" (Simon Says sequence) ──────────────────
// 4 steel-themed buttons light up in sequence. Repeat the pattern.
// Sequence grows by 1 each round. 5 rounds.
const JasmineEngine = {
  _isActive:false, _node:null, _round:0, _seq:[], _playerSeq:[],
  _btns:[], _locked:false, _failed:false,

  start(node) {
    this._node = node; this._isActive = true; this._round = 0; this._failed = false; this._mistakes=0;
    ActiveEngine.set(this);
    showBossIntro({
      gymIndex: 5, portrait: 'jasmine.png',
      name: 'Jasmine', btnLabel: 'Begin Forging ⚙️',
      introText: "Oh… to forge steel you must listen carefully. I will tap the anvils in order — you repeat the pattern exactly. You can repair two cracks; the third ends the attempt.",
    });
  },

  startGame() {
    this._isActive = false; ActiveEngine.clear();
    document.getElementById('trainer-intro').style.display = 'none';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    this._seq = [];
    this._showRound();
  },

  _showRound() {
    if (this._round >= 5) { this._finish(true); return; }
    this._playerSeq = [];
    this._locked    = true;

    const cv = setupChallengeScreen({ portrait:'jasmine.png', badge:'⚙️ Steel Forging',
      intro: `Round ${this._round + 1}/5 — Watch the pattern`,
      wrapClass: 'jasmine-wrap', screenClass: 'jasmine-active' });

    // 4 forge buttons
    const FORGE = [
      { label:'⚙️', color:'#f0c000', glow:'rgba(240,192,0,.5)',   id:0 },  // yellow
      { label:'🔩', color:'#e06010', glow:'rgba(224,96,16,.5)',    id:1 },  // orange
      { label:'⛏️', color:'#c02020', glow:'rgba(192,32,32,.5)',    id:2 },  // red
      { label:'🔨', color:'#f0f0f0', glow:'rgba(240,240,240,.4)',  id:3 },  // white
    ];
    const grid = document.createElement('div');
    grid.className = 'jasmine-grid';
    this._btns = [];
    FORGE.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'jasmine-btn';
      btn.innerHTML = `<span class="forge-anvil"></span><strong>${f.id+1}</strong>`;
      btn.style.background   = `rgba(${hexToRgb(f.color) || '128,144,160'},.25)`;
      btn.style.borderColor  = f.color;
      btn.style.boxShadow    = `0 0 10px ${f.glow}`;
      btn.dataset.forgeColor = f.color;
      btn.addEventListener('click', () => {
        if (this._locked) return;
        this._flash(f.id, true);
        this._playerSeq.push(f.id);
        this._checkPlayer();
      });
      this._btns.push(btn);
      grid.appendChild(btn);
    });
    cv.appendChild(grid);

    const indicator = document.createElement('div');
    indicator.className = 'jasmine-indicator';
    indicator.id = 'jasmine-indicator';
    cv.appendChild(indicator);
    const replay=document.createElement('button');replay.className='btn-pixel btn-secondary';replay.textContent='Replay pattern';replay.onclick=()=>{if(this._locked)return;this._locked=true;this._playerSeq=[];this._playSequence();};cv.appendChild(replay);
    this._indicator = indicator;  // store ref — don't rely on getElementById across re-renders

    // Extend sequence by 1
    this._seq.push(Math.floor(Math.random() * 4));

    // Play sequence after short delay
    MiniGameSession.later(() => this._playSequence(), 600);
  },

  _playSequence() {
    const ind = this._indicator;
    if (!ind) return;
    ind.textContent = 'Watch…';
    const tier    = GameState.difficultyTier || 2;
    const delayMs = Math.max(700, 1200 - this._round * 50 - (tier - 1) * 60);
    let   i       = 0;
    const iv = MiniGameSession.every(() => {
      this._flash(this._seq[i], false);
      i++;
      if (i >= this._seq.length) {
        MiniGameSession.clearEvery(iv);
        MiniGameSession.later(() => {
          this._locked = false;
          if (this._indicator) this._indicator.textContent = 'Your turn!';
        }, delayMs + 100);
      }
    }, delayMs + 150);
  },

  _flash(id, isPlayer) {
    const btn = this._btns[id];
    if(typeof playNoteForInstrument==='function')playNoteForInstrument([262,330,392,523][id],.15);
    if (!btn) return;
    btn.classList.add('jasmine-flash');
    if (!isPlayer) btn.classList.add('jasmine-demo');
    MiniGameSession.later(() => {
      btn.classList.remove('jasmine-flash', 'jasmine-demo');
    }, 250);
  },

  _checkPlayer() {
    const pos = this._playerSeq.length - 1;
    if (this._playerSeq[pos] !== this._seq[pos]) {
      this._locked = true;
      this._btns.forEach(b => b.classList.add('jasmine-error'));
      this._mistakes++;
      if (this._indicator) this._indicator.textContent = `A crack! ${Math.max(0,3-this._mistakes)} repairs remaining.`;
      MiniGameSession.next(()=>{if(this._mistakes>=3){this._finish(false);return;}this._btns.forEach(b=>b.classList.remove('jasmine-error'));this._playerSeq=[];this._playSequence();},this._mistakes>=3?'See results':'Repair and replay');
      return;
    }
    if (this._playerSeq.length === this._seq.length) {
      this._locked = true;
      if (this._indicator) this._indicator.textContent = '✓ Perfect!';
      this._btns.forEach(b => b.classList.add('jasmine-success'));
      MiniGameSession.next(() => {
        this._btns.forEach(b => b.classList.remove('jasmine-success'));
        this._round++;
        this._showRound();
      });
    }
  },

  _finish(won) {
    const gold = won ? 24 : 8;
    completeChallenge({
      screenClass: 'jasmine-active', won,
      goldReward: gold,
      score: won ? 5 : this._round, maxScore: 5, gameKey: 'jasmine',
      tokenLabel: won ? 'Forged Steel — 40 dmg shield next battle!' : null,
      effects: won ? { jasmineForge: true } : {},
      modalTitle: won ? '⚙️ Steel Forged!' : '⚙️ Steel Cracked',
      modalBody: `${won ? '5/5 patterns correct' : `Failed at round ${this._round + 1}`}\n+${gold}💰` +
        (won ? '\n\n⭐ Forged Steel — your Pokémon gains a 1-hit shield next battle!' : ''),
    });
  },
};

// ─── PRYCE ENGINE — "Ice Sculpture Restoration" (count shapes, reveal Pokémon) ─
// Pryce's ice sculptures melted into scattered geometric shards. The player
// clears the field one shape-type at a time by indicating how many there are.
// Tier 1: tap each shape to tally. Tier 2-3: highlight a type, pick the count.
// When the field is clear, the Pokémon "frozen inside" is revealed.
// Reward: gold (8/12/16) + "Frozen First Strike" buff on a clean job.
// Non-overlapping placement using true Euclidean distance. If the field gets
// crowded, it relaxes the spacing and finally falls back to a clean grid so
// every shape always lands in a distinct, visible spot.

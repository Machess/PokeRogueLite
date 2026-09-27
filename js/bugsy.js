const BUGSY_POKEMON = [
  { id:10,  name:'Caterpie'  },
  { id:13,  name:'Weedle'    },
  { id:46,  name:'Paras'     },
  { id:123, name:'Scyther'   },
  { id:167, name:'Spinarak'  },
  { id:165, name:'Ledyba'    },
  { id:127, name:'Pinsir'    },
  { id:204, name:'Pineco'    },
  { id:48,  name:'Venonat'   },
  { id:214, name:'Heracross' },
  { id:11,  name:'Metapod'   },
  { id:168, name:'Ariados'   },
];

// Rejection-sampling placement — returns [{x,y}] with no overlaps
function _bugPlacements(count, fieldW, fieldH, spriteSize, padding = 12) {
  const placed = [];
  const minDist = spriteSize + padding;
  for (let i = 0; i < count; i++) {
    let pos = null;
    for (let attempt = 0; attempt < 80; attempt++) {
      const x = padding + Math.random() * (fieldW - spriteSize - padding * 2);
      const y = padding + Math.random() * (fieldH - spriteSize - padding * 2);
      const ok = placed.every(p =>
        Math.abs(p.x - x) > minDist || Math.abs(p.y - y) > minDist
      );
      if (ok) { pos = { x, y }; break; }
    }
    // Fallback: evenly space if no gap found
    if (!pos) {
      const cols = Math.ceil(Math.sqrt(count));
      const col  = i % cols;
      const row  = Math.floor(i / cols);
      pos = {
        x: padding + col * (fieldW - padding * 2) / cols,
        y: padding + row * (fieldH - padding * 2) / Math.ceil(count / cols),
      };
    }
    placed.push(pos);
  }
  return placed;
}

const BugsyEngine = {
  _isActive:false, _node:null, _round:0, _hits:0, _timeouts:[],
  _sprites: {},

  async start(node) {
    this._node = node; this._isActive = true; this._round = 0; this._hits = 0; this._timeouts = [];
    this._sprites = {};
    ActiveEngine.set(this);

    await Promise.all(BUGSY_POKEMON.map(async b => {
      const data = await fetchPoke(b.id).catch(() => null);
      this._sprites[b.id] = data ? getSpriteUrl(data) :
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${b.id}.png`;
    }));

    showBossIntro({
      gymIndex: 1, portrait: 'bugsy.png',
      name: 'Bugsy', btnLabel: 'Begin Bug Hunt 🐛',
      introText: "My research makes me tops at Bug-type Pokémon! I'll show you one species — find it in the undergrowth before it vanishes!",
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
    this._timeouts.forEach(t => clearTimeout(t)); this._timeouts = [];

    const tier = getSkillTier('bugsy');

    // Tier-based config
    const CFG = {
      1: { count: 5,  size: 64, showName: true,  ms: 7000 },
      2: { count: 7,  size: 52, showName: true,  ms: 5000 },
      3: { count: 9,  size: 44, showName: false, ms: 4000 },
    };
    const { count, size, showName } = CFG[Math.min(tier, 3)];
    const timerMs = Math.max(
      CFG[Math.min(tier, 3)].ms - this._round * 300,
      tier <= 1 ? 4000 : tier === 2 ? 3000 : 2200
    );

    // Pick 1 target + (count-1) unique decoys
    const target = BUGSY_POKEMON[Math.floor(Math.random() * BUGSY_POKEMON.length)];
    const decoys = shuffle(BUGSY_POKEMON.filter(b => b.id !== target.id)).slice(0, count - 1);
    const bugs   = shuffle([target, ...decoys]);

    const cv = setupChallengeScreen({
      portrait: 'bugsy.png', badge: '🐛 Bug Hunt',
      intro: `Round ${this._round + 1}/5`,
      wrapClass: 'bugsy-scatter-wrap', screenClass: 'bugsy-active',
    });

    // Hint bar
    const hint = document.createElement('div');
    hint.className = 'bugsy-hint';
    hint.innerHTML = `Find: <span class="bugsy-target">
      <img src="${this._sprites[target.id]}" class="bugsy-target-sprite pixel-sprite"
           onerror="this.style.display='none'" alt="${target.name}">
      ${showName ? target.name : ''}</span>`;
    cv.appendChild(hint);

    // Timer bar
    const timerBar = document.createElement('div');
    timerBar.className = 'bugsy-timer-bar';
    timerBar.innerHTML = `<div class="bugsy-timer-fill" id="bugsy-timer-fill"></div>`;
    cv.appendChild(timerBar);

    // Field — the scatter canvas
    const FIELD_W = 340, FIELD_H = 300;
    const field = document.createElement('div');
    field.className = 'bugsy-field';
    field.style.width  = `${FIELD_W}px`;
    field.style.height = `${FIELD_H}px`;
    cv.appendChild(field);

    // Place sprites with rejection sampling
    const positions = _bugPlacements(bugs.length, FIELD_W, FIELD_H, size);
    let tapped = false;

    bugs.forEach((bug, i) => {
      const pos = positions[i];
      const img = document.createElement('img');
      img.src       = this._sprites[bug.id] || '';
      img.alt       = bug.name;
      img.className = 'bugsy-scatter-sprite pixel-sprite';
      img.style.cssText = `
        left:${pos.x}px; top:${pos.y}px;
        width:${size}px; height:${size}px;
        --dx1:${(Math.random()*16-8).toFixed(1)}px;
        --dy1:${(Math.random()*16-8).toFixed(1)}px;
        --dx2:${(Math.random()*16-8).toFixed(1)}px;
        --dy2:${(Math.random()*16-8).toFixed(1)}px;
        --dr1:${(Math.random()*10-5).toFixed(1)}deg;
        --dr2:${(Math.random()*10-5).toFixed(1)}deg;
        animation-duration:${(2 + Math.random() * 2).toFixed(2)}s;
        animation-delay:-${(Math.random() * 2).toFixed(2)}s;
      `;
      img.onerror = () => { img.style.display = 'none'; };
      img.addEventListener('click', () => {
        if (tapped) return;
        tapped = true;
        this._timeouts.forEach(t => clearTimeout(t)); this._timeouts = [];
        // Freeze all bugs
        field.querySelectorAll('.bugsy-scatter-sprite').forEach(el => {
          el.style.pointerEvents = 'none';
          el.style.animationPlayState = 'paused';
        });
        if (bug.id === target.id) {
          this._hits++;
          img.classList.add('bugsy-scatter-correct');
        } else {
          img.classList.add('bugsy-scatter-wrong');
          // Reveal correct one
          bugs.forEach((b, j) => {
            if (b.id === target.id) {
              field.querySelectorAll('.bugsy-scatter-sprite')[j]
                ?.classList.add('bugsy-scatter-correct');
            }
          });
        }
        this._timeouts.push(setTimeout(() => { this._round++; this._showRound(); }, 1000));
      });
      field.appendChild(img);
    });

    // Start timer bar animation
    setTimeout(() => {
      const fill = document.getElementById('bugsy-timer-fill');
      if (fill) {
        fill.style.transition = `width ${timerMs}ms linear`;
        fill.style.width = '0%';
      }
    }, 50);

    // Auto-timeout
    this._timeouts.push(setTimeout(() => {
      if (!tapped) {
        tapped = true;
        field.querySelectorAll('.bugsy-scatter-sprite').forEach((el, j) => {
          el.style.pointerEvents = 'none';
          el.style.animationPlayState = 'paused';
          if (bugs[j].id === target.id) el.classList.add('bugsy-scatter-correct');
        });
        this._timeouts.push(setTimeout(() => { this._round++; this._showRound(); }, 1000));
      }
    }, timerMs));
  },

  _finish() {
    const gold = this._hits >= 5 ? 22 : this._hits >= 3 ? 14 : 7;
    completeChallenge({
      screenClass: 'bugsy-active', won: this._hits >= 4,
      goldReward: gold,
      score: this._hits, maxScore: 5, gameKey: 'bugsy',
      tokenLabel: this._hits === 5 ? 'Bug Research — enemy attack -20%!' : null,
      effects: this._hits === 5 ? { bugsyResearch: true } : {},
      modalTitle: this._hits >= 5 ? '🐛 Expert Entomologist!' : '🐛 Bug Hunt',
      modalBody: `${this._hits}/5 found\n+${gold}💰` +
        (this._hits === 5 ? '\n\n⭐ Bug Research — enemy attack -20% next battle!' : ''),
    });
  },
};


const NINJA_CARDS = [
  { id:'snake',   icon:'🐍', label:'Serpent'     },
  { id:'skull',   icon:'☠️', label:'Toxic'        },
  { id:'blossom', icon:'🌸', label:'Blossom'     },
  { id:'ninja',   icon:'🥷', label:'Ninja'        },
  { id:'shroom',  icon:'🍄', label:'Spore'        },
  { id:'orb',     icon:'💜', label:'Poison Orb'  },
  { id:'bubble',  icon:'🫧', label:'Koffing'      },
  { id:'eye',     icon:'👁️', label:'Watchful Eye' },
  { id:'vial',    icon:'⚗️', label:'Antidote'     },
  { id:'smoke',   icon:'🌫️', label:'Smokescreen'  },
];

const KOGA_COMMENTS = {
  peek:    `"Observe. Forget nothing." — Koga`,
  match:   `"A true shinobi." — Koga`,
  miss1:   `"Careless." — Koga`,
  miss2:   `"Slow your mind." — Koga`,
  miss3:   `"Your focus falters." — Koga`,
  done:    `"The dojo remembers all who pass." — Koga`,
  fail:    `"Enough. You have learned nothing today." — Koga`,
};

const NINJA_MEMORY_INTROS = [
  `${'{name}'}. You enter my dojo uninvited. Very well. The mind is a weapon — let us see how sharp yours is. I have prepared a test of memory. A ninja forgets nothing. Can you say the same?`,
  `Silence, ${'{name}'}. In my dojo, we do not speak. We observe. I have laid out the cards of my training. Study them. Remember them. Then prove your mind is worthy of this place.`,
  `Fwa ha ha… ${'{name}'}. My students spend years training their memory. You will attempt the same test in moments. Fail and learn. Succeed… and I may be impressed.`,
];

const NinjaMemoryEngine = {
  _node:       null,
  _isActive:   false,
  _grid:       [],
  _first:      null,
  _misses:     0,
  _matched:    0,
  _budget:     0,
  _pairCount:  0,
  _locked:     false,
  _peekMs:     0,

  start(node) {
    this._node    = node;
    this._isActive = true;
    ActiveEngine.set(this);
    this._first   = null;
    this._misses  = 0;
    this._matched = 0;
    this._locked  = false;

    const tier    = GameState.difficultyTier || 2;
    const beaten  = GameState.bossesDefeated || 0;

    if (tier <= 1)       { this._pairCount = 6; this._budget = 9;  this._peekMs = 2500; }
    else if (tier === 2) { this._pairCount = 8; this._budget = 10; this._peekMs = 1500; }
    else                 { this._pairCount = 8; this._budget = 8;  this._peekMs = 800;  }

    // Build shuffled grid now so it's ready when startGame fires
    const families=[[1,2,'Bulbasaur','Ivysaur'],[4,5,'Charmander','Charmeleon'],[7,8,'Squirtle','Wartortle'],[10,11,'Caterpie','Metapod'],[13,14,'Weedle','Kakuna'],[16,17,'Pidgey','Pidgeotto'],[19,20,'Rattata','Raticate'],[23,24,'Ekans','Arbok']];
    const pairs=shuffle(families).slice(0,this._pairCount);
    this._grid=shuffle(pairs.flatMap((f,k)=>[0,1].map(i=>{const advanced=tier>=3&&i===1,id=f[advanced?1:0],label=f[advanced?3:2];return{id:k,label,icon:`<img src="assets/sprites/${id}.png" alt="${label}"><small>${label}</small>`,flipped:false,matched:false,el:null};})));

    // Boss-screen intro
    showScreen('boss');
    BossEngine._isRocket = false;

    const bgEl  = document.querySelector('#screen-boss .battle-bg');
    const imgEl = document.querySelector('#screen-boss .battle-bg-img');
    if (bgEl && imgEl) {
      bgEl.classList.add('boss-intro-mode');
      bgEl.style.background = GYM_FALLBACKS[4];   // Koga purple
      imgEl.style.opacity   = '0';
      imgEl.onload  = () => { imgEl.style.opacity = '1'; bgEl.style.background = ''; };
      imgEl.onerror = () => { imgEl.style.opacity = '0'; };
      imgEl.src = 'assets/bg_4_boss.png';
    }

    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';
    document.getElementById('boss-party-bar').innerHTML       = '';

    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (trainerImg) trainerImg.src = 'assets/koga.png';
    document.getElementById('dialogue-name').textContent = 'Koga';
    document.getElementById('dialogue-text').textContent = '';

    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.style.display = 'none';
    document.getElementById('btn-dialogue-next').style.display = 'none';

    const name  = GameState.trainerName || 'Trainer';
    const intro = NINJA_MEMORY_INTROS[Math.floor(Math.random() * NINJA_MEMORY_INTROS.length)]
      .replace('{name}', name);
    typeBossIntro(intro, 24, () => {
      if (startBtn) { startBtn.style.display = ''; startBtn.textContent = 'Enter the Dojo 🥷'; }
    });
  },

  startGame() {
    this._isActive = false;
    ActiveEngine.clear();
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = 'Battle! ▶';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    document.getElementById('trainer-intro').style.display = 'none';

    // Challenge screen
    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = 'assets/koga.png'; img.style.display = ''; }
    document.getElementById('challenge-badge').textContent   = '🥷 Koga\'s Ninja Memory';
    document.getElementById('challenge-intro').textContent   = 'Memorise the cards and find every matching pair.';
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';
    document.getElementById('challenge-question').style.display     = 'none';
    const _jwd = document.getElementById('jessie-word-display');
    if (_jwd) { _jwd.style.display = 'none'; _jwd.innerHTML = ''; _jwd.className = 'jessie-word-display'; }
    document.getElementById('challenge-answer-btns').innerHTML      = '';

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.remove(...CHALLENGE_CLASSES);
    document.getElementById('screen-challenge').classList.add('koga-active');
    SoundEngine.playBGM('mini_game.mp3');

    this._buildGrid();
    this._peek();
  },

  _buildGrid() {
    const cv = document.getElementById('challenge-coin-visual');
    cv.style.display = 'block';
    cv.className     = 'ninja-memory-wrap';
    cv.innerHTML     = '';

    // Attempt tracker (kunai icons)
    const tracker = document.createElement('div');
    tracker.className = 'ninja-tracker';
    tracker.id        = 'ninja-tracker';
    this._updateTracker(tracker);
    cv.appendChild(tracker);

    // Koga comment line
    const comment = document.createElement('div');
    comment.className   = 'ninja-comment';
    comment.id          = 'ninja-comment';
    comment.textContent = KOGA_COMMENTS.peek;
    cv.appendChild(comment);

    // Card grid
    const cols   = this._pairCount === 6 ? 3 : 4;
    const grid   = document.createElement('div');
    grid.className = 'ninja-grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.id = 'ninja-grid';

    this._grid.forEach((card, i) => {
      const outer = document.createElement('div');
      outer.className = 'ninja-card';
      outer.dataset.idx = i;
      outer.innerHTML = `
        <div class="ninja-card-inner">
          <div class="ninja-card-back">✦</div>
          <div class="ninja-card-front">${card.icon}</div>
        </div>`;
      outer.setAttribute('role','button');outer.tabIndex=0;outer.setAttribute('aria-label','Memory card '+(i+1));outer.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this._tap(i);}};
      outer.addEventListener('click', () => this._tap(i));
      grid.appendChild(outer);
      card.el = outer;
    });
    cv.appendChild(grid);
  },

  _updateTracker(el) {
    el = el || document.getElementById('ninja-tracker');
    if (!el) return;
    const total = this._budget;
    const used  = this._misses;
    el.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const k = document.createElement('span');
      k.className   = 'ninja-kunai' + (i < used ? ' ninja-kunai-lost' : '');
      k.textContent = i < used ? '✕' : '✦';
      el.appendChild(k);
    }
  },

  _setComment(text) {
    const el = document.getElementById('ninja-comment');
    if (el) el.textContent = text;
  },

  _peek() {
    // Flip all cards face-up for peek duration
    this._locked = true;
    this._grid.forEach(c => { if (c.el) c.el.classList.add('ninja-card-flipped'); });

    MiniGameSession.next(() => {
      this._grid.forEach(c => {
        if (c.el && !c.matched) c.el.classList.remove('ninja-card-flipped');
      });
      this._locked = false;
      this._setComment('🥷 Your turn. Find the pairs.');
    }, 'Begin matching');
  },

  _tap(idx) {
    if (this._locked) return;
    const card = this._grid[idx];
    if (card.matched || card.flipped) return;

    // Flip this card
    card.flipped = true;
    card.el.classList.add('ninja-card-flipped');

    if (this._first === null) {
      // First card of a pair
      this._first = idx;
    } else {
      // Second card — evaluate
      const firstCard = this._grid[this._first];
      this._first = null;
      this._locked = true;

      if (firstCard.id === card.id) {
        // Match!
        MiniGameSession.later(() => {
          firstCard.matched = true;
          card.matched      = true;
          firstCard.el.classList.add('ninja-card-matched');
          card.el.classList.add('ninja-card-matched');
          this._matched++;
          this._setComment(KOGA_COMMENTS.match);
          this._locked = false;
          if (this._matched >= this._pairCount) {
            MiniGameSession.later(() => this._complete(), 400);
          }
        }, 300);
      } else {
        // Mismatch
        this._misses++;
        this._updateTracker();
        const missKey = this._misses === 1 ? 'miss1' : this._misses === 2 ? 'miss2' : 'miss3';
        this._setComment(KOGA_COMMENTS[missKey] || KOGA_COMMENTS.miss3);

        // Shake both cards
        firstCard.el.classList.add('ninja-card-wrong');
        card.el.classList.add('ninja-card-wrong');

        const overBudget = this._misses >= this._budget * 2;

        MiniGameSession.later(() => {
          firstCard.el.classList.remove('ninja-card-wrong', 'ninja-card-flipped');
          card.el.classList.remove('ninja-card-wrong', 'ninja-card-flipped');
          firstCard.flipped = false;
          card.flipped      = false;
          this._locked = false;

          if (overBudget) this._fail();
        }, 900);
      }
    }
  },

  _complete() {
    this._setComment(KOGA_COMMENTS.done);
    this._finish(true);
  },

  _fail() {
    this._setComment(KOGA_COMMENTS.fail);
    this._locked = true;
    // Reveal all remaining cards
    this._grid.forEach(c => { if (c.el && !c.matched) c.el.classList.add('ninja-card-flipped'); });
    MiniGameSession.later(() => this._finish(false), 2200);
  },

  _finish(won) {
    document.getElementById('screen-challenge').classList.remove('koga-active');
    const cv = document.getElementById('challenge-coin-visual');
    cv.innerHTML = ''; cv.className = 'challenge-coin-visual';

    const goldBase = 25 + (GameState.bossesDefeated || 0) * 6;
    if (!GameState.pendingPlayerEffects) GameState.pendingPlayerEffects = {};
    if (!GameState.pendingPlayerStatuses) GameState.pendingPlayerStatuses = [];

    let goldReward = 0, levelReward = 0, title = '', msg = '';

    if (!won) {
      // Loss: whole party poisoned at start of next battle
      GameState.pendingPlayerStatuses.push('party_poison');
      title = '🥷 Focus Lost.';
      msg   = `Too many mismatches.\n\n☠️ Koga's punishment: your active Pokémon starts the next battle POISONED.\n\n${KOGA_COMMENTS.fail}`;
    } else if (this._misses === 0) {
      // Perfect: clarity buff + Psychic/Ghost boost
      goldReward = goldBase; levelReward = 3;
      GameState.pendingPlayerEffects.clarityBuff       = true;
      GameState.pendingPlayerEffects.clarityTypeBoost  = 1.3;  // psychic+ghost 1.3×
      title = '🥷 Perfect Memory!';
      msg   = `Flawless. Not a single miss.\n+${goldReward}💰 · +3 levels\n\n🧠 Clarity: status durations halved + Psychic/Ghost cards deal 1.3× next battle!\n\n${KOGA_COMMENTS.done}`;
    } else if (this._misses <= 2) {
      goldReward = Math.floor(goldBase * 0.8); levelReward = 2;
      GameState.pendingPlayerEffects.clarityBuff = true;
      title = '🥷 Impressive, Ninja.';
      msg   = `${this._misses} mismatch${this._misses > 1 ? 'es' : ''}.\n+${goldReward}💰 · +2 levels\n\n🧠 Clarity: opponent status effects halved next battle!\n\n${KOGA_COMMENTS.done}`;
    } else if (this._misses <= this._budget) {
      goldReward = Math.floor(goldBase * 0.5); levelReward = 1;
      title = '🥷 You Passed.';
      msg   = `${this._misses} mismatches.\n+${goldReward}💰 · +1 level\n\n${KOGA_COMMENTS.done}`;
    } else {
      goldReward = Math.floor(goldBase * 0.2);
      title = '🥷 Over Budget.';
      msg   = `${this._misses} mismatches — reward reduced.\n+${goldReward}💰\n\n${KOGA_COMMENTS.done}`;
    }

    GameState.gold = (GameState.gold || 0) + goldReward;
    if (levelReward > 0) {
      const poke = GameState.party[GameState.activePokemonIndex];
      if (poke) {
        poke.level   += levelReward;
        poke.maxHp   += levelReward * 8;
        poke.hp       = Math.min(poke.maxHp, poke.hp + levelReward * 8);
      }
    }
    saveGame();
    showModal(title, msg, () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); });
  },
};
// ─── BLAINE RIDDLE ENGINE ────────────────────────────────────────────────────

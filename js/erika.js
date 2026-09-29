const ERIKA_INTROS = [
  `${'{name}'}. Welcome. My laboratory is a place of patience and observation. Today I have a puzzle for you — a colour mixing challenge. Study the target. Choose your ingredients carefully. Nature rewards those who look before they pour.`,
  `Ah, ${'{name}'}. I was hoping for a visitor with a curious mind. I have prepared a potion mixing puzzle. The colours must be correct, and the amount must be precise. Take your time. Rushing produces only mistakes.`,
  `${'{name}'}. In my garden, we learn by doing. Today you will mix a potion. The recipe is simple — but precision matters. Too much or too little and the potion fails. Study the target and think before you pour.`,
];

// Colour system — base colours + mixes
const POTION_COLORS = {
  red:    { hex:'#e84040', label:'Fire Extract',   emoji:'🔴' },
  blue:   { hex:'#4080e8', label:'Aqua Essence',   emoji:'🔵' },
  yellow: { hex:'#f0d020', label:'Solar Pollen',   emoji:'🟡' },
  white:  { hex:'#d8eeff', label:'Pure Dew',       emoji:'⚪' },
  purple: { hex:'#9040d0', label:'Shadow Root',    emoji:'🟣' },
  green:  { hex:'#38c060', label:'Leaf Spirit',    emoji:'🟢' },
  orange: { hex:'#f07020', label:'Ember Sap',      emoji:'🟠' },
  pink:   { hex:'#f060a0', label:'Blossom Mist',   emoji:'🩷' },
  cyan:   { hex:'#28c0c8', label:'Frost Bloom',    emoji:'🩵' },
};

// Mix rules: sorted key (colorA-colorB alphabetically) → result
const POTION_MIX_RULES = {
  'red-yellow':   'orange',
  'blue-yellow':  'green',
  'blue-red':     'purple',
  'red-white':    'pink',
  'blue-white':   'cyan',
  'yellow-white': 'yellow',  // barely changes — same colour
};

function mixColors(colorsArr) {
  if (!colorsArr.length) return null;
  if (colorsArr.length === 1) return colorsArr[0];
  const sorted = [...colorsArr].sort().join('-');
  return POTION_MIX_RULES[sorted] || 'brown'; // brown = wrong mix
}

// Puzzle definitions — { target colour, target level (1=full, 0.5=half, 0.25=quarter),
//   bottles: [{ color, units }] where units = amount one pour delivers, one of bottle is decoy }
function _buildErikaPuzzle(tier) {
  const puzzles = [
    // Tier 1 — always full, clear 2-colour mix
    { tier:1, targetColor:'green',  targetLevel:1,    recipe:['blue','yellow'],
      bottles:['blue','yellow','red'],
      hint:'Blue + Yellow = Green. Pour both fully.' },
    { tier:1, targetColor:'orange', targetLevel:1,    recipe:['red','yellow'],
      bottles:['red','yellow','blue'],
      hint:'Red + Yellow = Orange. Pour both fully.' },
    { tier:1, targetColor:'purple', targetLevel:1,    recipe:['red','blue'],
      bottles:['red','blue','yellow'],
      hint:'Red + Blue = Purple. Pour both fully.' },
    { tier:1, targetColor:'pink',   targetLevel:1,    recipe:['red','white'],
      bottles:['red','white','blue'],
      hint:'Red + White = Pink. Pour both fully.' },
    { tier:1, targetColor:'cyan',   targetLevel:1,    recipe:['blue','white'],
      bottles:['blue','white','red'],
      hint:'Blue + White = Cyan. Pour both fully.' },
    // Tier 2 — half or full, 2-colour mix with 1 decoy
    { tier:2, targetColor:'green',  targetLevel:0.5,  recipe:['blue','yellow'],
      bottles:['blue','yellow','purple'],
      hint:'Mix Blue + Yellow = Green. Then use Pour Out 🫗 to reach the halfway line.' },
    { tier:2, targetColor:'orange', targetLevel:0.5,  recipe:['red','yellow'],
      bottles:['red','yellow','white'],
      hint:'Mix Red + Yellow = Orange. Then Pour Out 🫗 twice to reach half.' },
    { tier:2, targetColor:'purple', targetLevel:1,    recipe:['red','blue'],
      bottles:['red','blue','green'],
      hint:'Red + Blue = Purple. Pour both fully — no pour-out needed.' },
    { tier:2, targetColor:'cyan',   targetLevel:0.5,  recipe:['blue','white'],
      bottles:['blue','white','yellow'],
      hint:'Blue + White = Cyan. Mix both, then Pour Out 🫗 to the halfway line.' },
    // Tier 3 — quarter levels, hidden hints, 2 decoys
    { tier:3, targetColor:'green',  targetLevel:0.25, recipe:['blue','yellow'],
      bottles:['blue','yellow','red','purple'],
      hint:'' },
    { tier:3, targetColor:'orange', targetLevel:1,    recipe:['red','yellow'],
      bottles:['red','yellow','blue','white'],
      hint:'' },
    { tier:3, targetColor:'purple', targetLevel:0.5,  recipe:['red','blue'],
      bottles:['red','blue','white','green'],
      hint:'' },
    { tier:3, targetColor:'pink',   targetLevel:0.25, recipe:['red','white'],
      bottles:['red','white','blue','yellow'],
      hint:'' },
  ];

  const pool = puzzles.filter(p => p.tier <= tier);
  return pool[Math.floor(Math.random() * pool.length)];
}

const ERIKA_LINES = {
  correct:      `"Beautiful. You understood the mixture perfectly. This is how all medicine begins." — Erika`,
  wrong_color:  `"The colour is not right. Look at the mix rules again — which two colours make your target?" — Erika`,
  wrong_level:  `"The colour is correct, but the amount is wrong. Watch the dotted line — use Pour Out to reduce the level." — Erika`,
  wrong_both:   `"Both the colour and the amount need work. Reset and try again — patience is part of the craft." — Erika`,
  reset:        `"Starting fresh is not failure. It is how we learn." — Erika`,
  decoy:        `"Careful — not every bottle belongs in this recipe. One is a decoy." — Erika`,
  pour_out:     `"Good. You are learning to control the amount. Precision matters as much as the ingredients." — Erika`,
  over_full:    `"The flask is full. Use Pour Out 🫗 to reduce the level before submitting." — Erika`,
};

const ErikaEngine = {
  _isActive:    false,
  _answered:    false,
  _node:        null,
  _puzzle:      null,
  _poured:      [],    // array of color strings added so far
  _totalPoured: 0,     // sum of units poured (each bottle = 0.5 units)
  _maxPour:     1,     // full = 1.0, half = 0.5, quarter = 0.25
  _pourOutCommented: false,

  start(node) {
    this._node      = node;
    this._isActive  = true;
    ActiveEngine.set(this);
    this._answered  = false;
    this._poured            = [];
    this._totalPoured       = 0;
    this._pourOutCommented  = false;
    this._resetUsed         = false;
    const tier      = GameState.difficultyTier || 2;
    this._puzzle    = _buildErikaPuzzle(tier);

    // Boss-screen intro
    showScreen('boss');
    BossEngine._isRocket = false;
    const bgEl  = document.querySelector('#screen-boss .battle-bg');
    const imgEl = document.querySelector('#screen-boss .battle-bg-img');
    if (bgEl && imgEl) {
      bgEl.classList.add('boss-intro-mode');
      bgEl.style.background = GYM_FALLBACKS[3];
      imgEl.style.opacity = '0';
      imgEl.onload  = () => { imgEl.style.opacity = '1'; bgEl.style.background = ''; };
      imgEl.onerror = () => { imgEl.style.opacity = '0'; };
      imgEl.src = 'assets/bg_3_boss.png';
    }
    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';
    document.getElementById('boss-party-bar').innerHTML       = '';

    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (trainerImg) trainerImg.src = 'assets/erika.png';
    document.getElementById('dialogue-name').textContent = 'Erika';
    document.getElementById('dialogue-text').textContent = '';

    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.style.display = 'none';
    document.getElementById('btn-dialogue-next').style.display = 'none';

    const name  = GameState.trainerName || 'Trainer';
    const intro = ERIKA_INTROS[Math.floor(Math.random() * ERIKA_INTROS.length)]
      .replace('{name}', name);
    typeBossIntro(intro, 26, () => {
      if (startBtn) { startBtn.style.display = ''; startBtn.textContent = 'Enter the Lab 🌸'; }
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
    this._showLab();
  },

  _showLab() {
    const p    = this._puzzle;
    const tier = GameState.difficultyTier || 2;
    this._poured      = [];
    this._totalPoured = 0;

    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = 'assets/erika.png'; img.style.display = ''; }
    document.getElementById('challenge-badge').textContent   = '🌸 Erika\'s Potion Lab';
    document.getElementById('challenge-intro').textContent   = 'Mix the correct potion!';
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';
    document.getElementById('challenge-question').style.display     = 'none';
    const _jwd = document.getElementById('jessie-word-display');
    if (_jwd) { _jwd.style.display = 'none'; _jwd.innerHTML = ''; _jwd.className = 'jessie-word-display'; }
    document.getElementById('challenge-answer-btns').innerHTML      = '';

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.remove(...CHALLENGE_CLASSES);
    document.getElementById('screen-challenge').classList.add('erika-active');
    SoundEngine.playBGM('mini_game.mp3');

    const targetC     = POTION_COLORS[p.targetColor];
    const levelLabel  = p.targetLevel === 1 ? 'Full' : p.targetLevel === 0.5 ? 'Half' : 'Quarter';
    const levelPct    = p.targetLevel * 100;

    // Build lab UI in challenge-coin-visual
    const cv = document.getElementById('challenge-coin-visual');
    cv.style.display = 'block';
    cv.className     = 'erika-lab';
    delete cv.dataset.complete;
    cv.innerHTML     = `
      <!-- Recipe hint card — hidden on tier 3 -->
      <div class="erika-recipe-card" id="erika-recipe-card" style="${''}">
        <div class="erika-recipe-title">Mix Rules</div>
        ${Object.entries(POTION_MIX_RULES).map(([k, v]) => {
          const [a, b] = k.split('-');
          const ca = POTION_COLORS[a], cb = POTION_COLORS[b], cv2 = POTION_COLORS[v];
          const highlight = tier === 1 && p.recipe.sort().join('-') === k ? 'erika-recipe-highlight' : '';
          return `<div class="erika-recipe-row ${highlight}">
            <span class="erika-swatch" style="background:${ca?.hex}"></span><span>${ca?.label}</span> +
            <span class="erika-swatch" style="background:${cb?.hex}"></span><span>${cb?.label}</span> =
            <span class="erika-swatch" style="background:${cv2?.hex}"></span>
            <span class="erika-recipe-label">${cv2?.label || v}</span></div>`;
        }).join('')}
      </div>

      <!-- Target flask -->
      <div class="erika-target-area">
        <div class="erika-target-label">Target: <strong>${targetC.label} · ${p.targetLevel * 100}% full</strong></div>
        <div class="erika-flask" id="erika-target-flask">
          <div class="erika-flask-liquid" id="erika-flask-liquid" style="height:0%;background:#888"></div>
          <div class="erika-flask-line" style="bottom:${levelPct}%"></div>
        </div>
        <div class="erika-fill-bar-wrap">
          <div class="erika-fill-bar" id="erika-fill-bar" style="width:0%"></div>
          <div class="erika-fill-tick" style="left:25%">¼</div>
          <div class="erika-fill-tick" style="left:50%">½</div>
          <div class="erika-fill-tick" style="left:100%;transform:translateX(-100%)">Full</div>
        </div>
      </div>

      <!-- Erika comment -->
      <div class="erika-comment" id="erika-comment">${tier >= 3 ? 'Use the mixing chart and measure the target level.' : `💡 ${p.hint}`}</div>

      <!-- Pour stream (hidden by default) -->
      <div class="erika-pour-stream" id="erika-pour-stream" style="display:none"></div>`;

    // Build bottle buttons
    const btnArea = document.getElementById('challenge-answer-btns');
    btnArea.innerHTML = '';

    // Shuffle bottle order so decoy isn't always last
    const bottleColors = shuffle([...p.bottles]);

    const bottleRow = document.createElement('div');
    bottleRow.className = 'erika-bottle-row';

    bottleColors.forEach(colorKey => {
      const c   = POTION_COLORS[colorKey];
      if (!c) return;
      const btn = document.createElement('button');
      btn.className = 'erika-bottle-btn';
      btn.dataset.color = colorKey;
      btn.innerHTML = `
        <div class="erika-bottle" style="--liquid:${c.hex}">
          <div class="erika-bottle-neck"></div>
          <div class="erika-bottle-body">
            <div class="erika-bottle-liquid" id="bottle-liq-${colorKey}"></div>
          </div>
        </div>
        <span class="erika-bottle-label">${c.label}</span>`;
      btn.addEventListener('click', () => this._pour(colorKey, btn));
      bottleRow.appendChild(btn);
    });

    // Reset + Pour Out + Submit buttons
    const actionRow = document.createElement('div');
    actionRow.className = 'erika-action-row';

    const resetBtn = document.createElement('button');
    resetBtn.className   = 'erika-action-btn erika-reset-btn';
    resetBtn.textContent = '🗑️ Reset';
    resetBtn.addEventListener('click', () => this._reset());

    const pourOutBtn = document.createElement('button');
    pourOutBtn.className   = 'erika-action-btn erika-pourout-btn';
    pourOutBtn.id          = 'erika-pourout-btn';
    pourOutBtn.textContent = 'Pour out ¼ flask';
    pourOutBtn.disabled    = true;
    pourOutBtn.addEventListener('click', () => this._pourOut());

    const submitBtn = document.createElement('button');
    submitBtn.className   = 'erika-action-btn erika-submit-btn';
    submitBtn.id          = 'erika-submit-btn';
    submitBtn.textContent = '✓ Submit';
    submitBtn.disabled    = true;
    submitBtn.addEventListener('click', () => this._evaluate());

    actionRow.appendChild(resetBtn);
    actionRow.appendChild(pourOutBtn);
    actionRow.appendChild(submitBtn);
    btnArea.appendChild(bottleRow);
    btnArea.appendChild(actionRow);
  },

  _pour(colorKey, btn) {
    if (this._answered) return;
    const pourUnit = 0.5; // each bottle = half unit
    if (this._totalPoured >= 1) {
      // Flask full — nudge player toward pour-out
      const commentEl = document.getElementById('erika-comment');
      if (commentEl) commentEl.textContent = ERIKA_LINES.over_full;
      return;
    }

    if(btn.disabled)return;btn.disabled=true;
    this._poured.push(colorKey);
    this._totalPoured = Math.min(1, this._totalPoured + pourUnit);

    // Animate bottle tilt
    btn.classList.add('erika-bottle-tilt');
    MiniGameSession.later(() => btn.classList.remove('erika-bottle-tilt'), 500);

    // Shrink bottle liquid
    const liqEl = document.getElementById(`bottle-liq-${colorKey}`);
    if (liqEl) liqEl.style.height = '0%';

    // Animate pour-in stream
    const stream = document.getElementById('erika-pour-stream');
    if (stream) {
      const c = POTION_COLORS[colorKey];
      stream.style.cssText = `display:block;background:${c.hex};`;
      stream.classList.remove('erika-stream-out');
      stream.classList.add('erika-stream-flow');
      MiniGameSession.later(() => {
        stream.style.display = 'none';
        stream.classList.remove('erika-stream-flow');
      }, 550);
    }

    // Update flask fill after stream
    MiniGameSession.later(() => {
      this._updateFlask();
      document.getElementById('erika-submit-btn').disabled  = false;
      document.getElementById('erika-pourout-btn').disabled = false;
      btn.disabled = true;
    }, 300);
  },

  _pourOut() {
    if (this._answered) return;
    if (this._totalPoured <= 0) return;

    this._totalPoured = Math.max(0, this._totalPoured - 0.25);

    // Animate downward stream from flask
    const stream = document.getElementById('erika-pour-stream');
    if (stream) {
      const resultColor = mixColors(this._poured);
      const c = POTION_COLORS[resultColor] || { hex: '#704020' };
      stream.style.cssText = `display:block;background:${c.hex};`;
      stream.classList.remove('erika-stream-flow');
      stream.classList.add('erika-stream-out');
      MiniGameSession.later(() => {
        stream.style.display = 'none';
        stream.classList.remove('erika-stream-out');
      }, 500);
    }

    MiniGameSession.later(() => {
      this._updateFlask();

      // Erika pour-out comment (once only)
      const commentEl = document.getElementById('erika-comment');
      if (commentEl && !this._pourOutCommented) {
        commentEl.textContent    = ERIKA_LINES.pour_out;
        this._pourOutCommented   = true;
      }

      // Disable pour-out when empty
      const pourOutBtn = document.getElementById('erika-pourout-btn');
      if (pourOutBtn) pourOutBtn.disabled = this._totalPoured <= 0;

      // Disable submit when empty
      const submitBtn = document.getElementById('erika-submit-btn');
      if (submitBtn) submitBtn.disabled = this._totalPoured <= 0;
    }, 200);
  },

  _updateFlask() {
    const resultColor = mixColors(this._poured);
    const c   = POTION_COLORS[resultColor] || { hex: '#704020' };
    const pct = this._totalPoured * 100;
    const flaskLiq = document.getElementById('erika-flask-liquid');
    if (flaskLiq) { flaskLiq.style.height = `${pct}%`; flaskLiq.style.background = c.hex; }
    const fillBar  = document.getElementById('erika-fill-bar');
    if (fillBar)  fillBar.style.width = `${pct}%`;
  },

  _reset() {
    this._poured            = [];
    this._totalPoured       = 0;
    this._pourOutCommented  = false;
    this._resetUsed         = true;  // tracks perfect-attempt status

    // Reset flask
    const flaskLiq = document.getElementById('erika-flask-liquid');
    if (flaskLiq) { flaskLiq.style.height = '0%'; flaskLiq.style.background = '#888'; }
    const fillBar = document.getElementById('erika-fill-bar');
    if (fillBar) fillBar.style.width = '0%';

    // Re-enable bottles
    document.querySelectorAll('.erika-bottle-btn').forEach(b => {
      b.disabled = false;
      const ck = b.dataset.color;
      const liq = document.getElementById(`bottle-liq-${ck}`);
      if (liq) liq.style.height = '';
    });

    // Disable submit + pour-out
    const submitBtn  = document.getElementById('erika-submit-btn');
    if (submitBtn)  submitBtn.disabled  = true;
    const pourOutBtn = document.getElementById('erika-pourout-btn');
    if (pourOutBtn) pourOutBtn.disabled = true;

    // Erika reset comment
    const commentEl = document.getElementById('erika-comment');
    if (commentEl) commentEl.textContent = ERIKA_LINES.reset;
  },

  _evaluate() {
    if (this._answered) return;
    const p = this._puzzle;
    const resultColor = mixColors(this._poured);
    const colorOk = resultColor === p.targetColor;
    const levelOk = Math.abs(this._totalPoured - p.targetLevel) < 0.01;
    const isRight = colorOk && levelOk;
    if(!isRight){this._resetUsed=true;document.getElementById('erika-comment').textContent=(!colorOk?'Colour needs correcting: reset and mix '+p.recipe.join(' + ')+'. ':'Colour is correct. ')+(!levelOk?'Aim for '+(p.targetLevel*100)+'% full.':'Volume is correct.');return;}
    this._answered=true;
    document.getElementById('challenge-coin-visual').dataset.complete='true';
    const guide=document.querySelector('.mg-recipe-guide');
    if(guide)guide.open=false;

    // Flask celebration or shake
    const flask = document.getElementById('erika-target-flask');
    if (flask) flask.classList.add(isRight ? 'erika-flask-correct' : 'erika-flask-wrong');

    const line = isRight        ? ERIKA_LINES.correct
               : !colorOk && !levelOk ? ERIKA_LINES.wrong_both
               : !colorOk       ? ERIKA_LINES.wrong_color
               :                  ERIKA_LINES.wrong_level;

    const targetC    = POTION_COLORS[p.targetColor];
    const resultC    = POTION_COLORS[resultColor] || { label: 'Unknown', hex: '#704020' };
    const levelLabel = p.targetLevel === 1 ? 'Full' : p.targetLevel === 0.5 ? 'Half' : 'Quarter';
    const gotLabel   = this._totalPoured === 1 ? 'Full' : this._totalPoured === 0.5 ? 'Half' : this._totalPoured === 0.25 ? 'Quarter' : `${Math.round(this._totalPoured * 100)}%`;

    const resultEl = document.getElementById('challenge-result');
    resultEl.className = `challenge-result ${isRight ? 'result-correct' : 'result-wrong'}`;
    resultEl.innerHTML = `
      <div class="erika-result-title">${isRight ? '🌸 Perfect Potion!' : '🌿 Not quite…'}</div>
      <div class="erika-result-row">
        <span>Target:</span>
        <span class="erika-result-swatch" style="background:${targetC.hex}"></span>
        <strong>${levelLabel} ${targetC.label}</strong>
      </div>
      <div class="erika-result-row">
        <span>You made:</span>
        <span class="erika-result-swatch" style="background:${resultC.hex}"></span>
        <strong>${gotLabel} ${resultC.label}</strong>
      </div>
      <div class="erika-result-quote">${line}</div>`;
    resultEl.style.display = 'block';
    document.getElementById('challenge-continue-btn').style.display = 'block';
    document.getElementById('challenge-continue-btn').textContent   = 'Continue 🌸';
  },

  finish() {
    this._answered = false;
    document.getElementById('screen-challenge').classList.remove('erika-active');
    const cv = document.getElementById('challenge-coin-visual');
    cv.innerHTML = ''; cv.className = 'challenge-coin-visual';

    const resultEl = document.getElementById('challenge-result');
    const isRight  = resultEl && resultEl.classList.contains('result-correct');

    // Detect if perfect (no reset used, correct on first submit)
    const isPerfect = isRight && !this._resetUsed;

    if (!isRight) {
      // Loss: lead Burned + takes 15 dmg (Erika's failed potion)
      const lead = GameState.party.find(p => p.hp > 0);
      if (lead) lead.hp = Math.max(1, lead.hp - 15);
      if (!GameState.pendingPlayerStatuses) GameState.pendingPlayerStatuses = [];
      GameState.pendingPlayerStatuses.push('burn');
      saveGame();
      showModal('🌿 Potion Exploded!',
        `The failed mixture splashed your lead Pokémon!\n-15 HP + they start the next battle Burned.\n\n"...Ah. That mixture is not stable. Please step back." — Erika`,
        () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); });
      return;
    }

    // Win: create a potion item based on the colour mixed
    const colorToPotion = {
      green:  { id:'green_potion',  name:'Grass Potion',   effect:'heal40pct',  desc:'+40% max HP to lead'   },
      purple: { id:'purple_potion', name:'Poison Potion',  effect:'poison_aura',desc:'Poisons opp on first hit'},
      orange: { id:'orange_potion', name:'Fire Tonic',     effect:'fire_boost', desc:'Fire cards +50% this battle'},
      pink:   { id:'pink_potion',   name:'Blossom Tonic',  effect:'party_heal15',desc:'+15 HP to all party'  },
      cyan:   { id:'cyan_potion',   name:'Ice Potion',     effect:'freeze_first',desc:'Opp first turn Frozen' },
      red:    { id:'red_potion',    name:'Fire Essence',   effect:'fire_boost', desc:'Fire cards +30% this battle'},
      blue:   { id:'blue_potion',   name:'Aqua Essence',   effect:'heal40pct',  desc:'+40% max HP to lead'   },
    };
    const mixedColor  = mixColors(this._poured);
    const potion      = colorToPotion[mixedColor] || colorToPotion.green;
    const doses       = isPerfect ? 2 : 1;
    const goldBase    = 30 + (GameState.bossesDefeated || 0) * 5;

    GameState.gold = (GameState.gold || 0) + goldBase;
    // Store potion in bag — reuse item system
    if (!GameState.erikaPotions) GameState.erikaPotions = [];
    for (let i = 0; i < doses; i++) GameState.erikaPotions.push({ ...potion });

    saveGame();
    showModal('🌸 Potion Brewed!',
      `+${goldBase}💰 · You brewed: ${doses}× ${potion.name}!\n📦 Effect: ${potion.desc}\n${isPerfect ? '✨ Perfect mix — double dose!' : ''}\n\n"Beautiful. This is how all medicine begins." — Erika`,
      () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); });
  },
};
// ─── NINJA MEMORY ENGINE — Koga's Card Grid ──────────────────────────────────


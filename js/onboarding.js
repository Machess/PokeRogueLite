const RegistrationEngine = {
  _step: 1, // 1 = name, 2 = age
  _tempName: '',

  init() {
    this._step = 1;
    this._showStep1();
  },

  _showStep1() {
    this._step = 1;
    document.getElementById('reg-step-name').style.display = 'flex';
    document.getElementById('reg-step-age').style.display  = 'none';
    document.getElementById('trainer-name-input').value = '';
    document.getElementById('trainer-name-input').focus();
  },

  _showStep2(name) {
    this._step = 2;
    this._tempName = name;
    document.getElementById('reg-step-name').style.display = 'none';
    document.getElementById('reg-step-age').style.display  = 'flex';

    // Personalised greeting
    const greetings = [
      `Nice to meet you, ${name}! 🌟`,
      `${name}! What a great Trainer name! ✨`,
      `Wow, ${name} — that's an awesome name! 🎉`,
      `${name}! Professor Oak will be so impressed! 🌿`,
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    document.getElementById('reg-greeting').textContent = greeting;
    document.getElementById('reg-age-question').textContent = `So ${name}, how old are you?`;

    // Build age buttons fresh
    const ageRow = document.getElementById('age-buttons');
    ageRow.innerHTML = '';
    for (let age = 6; age <= 12; age++) {
      const btn = document.createElement('button');
      btn.className = 'age-btn';
      btn.textContent = age;
      btn.dataset.age = age;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.age-btn').forEach(b => b.classList.remove('age-selected'));
        btn.classList.add('age-selected');
        // Show "Let's Go" button once age is chosen
        document.getElementById('btn-age-confirm').style.display = 'inline-block';
      });
      ageRow.appendChild(btn);
    }
    document.getElementById('btn-age-confirm').style.display = 'none';
  },

  confirmName() {
    const nameInput = document.getElementById('trainer-name-input');
    const name = (nameInput?.value || '').trim().slice(0, 12);
    if (!name) {
      nameInput?.classList.add('input-shake');
      setTimeout(() => nameInput?.classList.remove('input-shake'), 500);
      return;
    }
    this._showStep2(name);
  },

  confirmAge() {
    const selectedAge = document.querySelector('.age-btn.age-selected');
    if (!selectedAge) return;
    const age  = parseInt(selectedAge.dataset.age);
    const tier = age <= 7 ? 1 : age <= 9 ? 2 : 3;

    GameState.trainerName    = this._tempName;
    GameState.trainerAge     = age;
    GameState.difficultyTier = tier;

    IntroEngine.start(this._tempName, age);
  },
};

// ─── INTRO ENGINE ─────────────────────────────────────────────────────────────

const IntroEngine = {
  _panels: [],
  _idx: 0,

  start(name, age) {
    const tierLabel = age <= 7 ? 'Rookie Trainer' : age <= 9 ? 'Rising Trainer' : 'Expert Trainer';
    this._panels = [
      { text: `Deep in the Pokémon world...\nsomething is very wrong. 🌑`, speaker: null },
      { text: `Team Rocket has been stealing Pokémon\nand hoarding mountains of gold! 💰`, speaker: 'rocket' },
      { text: `Their boss, Giovanni, hid three legendary\nPokémon behind the Trail of Trials —\na gauntlet only the bravest can finish.`, speaker: 'rocket' },
      { text: `Professor Oak searched the whole world\nfor a trainer with courage, smarts,\nand heart. ❤️`, speaker: 'oak' },
      { text: `He found you.\n\n${name}, ${tierLabel}. 🌟`, speaker: 'oak' },
      { text: `Eight Gym Leaders stand between you\nand Team Rocket's secret.\n\nAre you ready, ${name}?`, speaker: 'oak' },
      { text: `But first — let me explain\nhow your journey works.\n\nThis won't take long! 📖`, speaker: 'oak' },
    ];
    this._idx = 0;
    showScreen('intro');
    this._render();
  },

  _render() {
    const panel = this._panels[this._idx];
    const isLast = this._idx === this._panels.length - 1;

    // Typewriter effect for text
    const textEl = document.getElementById('intro-text');
    textEl.textContent = '';
    let ci = 0;
    clearInterval(this._typeTimer);
    this._typeTimer = setInterval(() => {
      textEl.textContent += panel.text[ci];
      ci++;
      if (ci >= panel.text.length) clearInterval(this._typeTimer);
    }, 22);

    document.getElementById('intro-progress').textContent =
      `${this._idx + 1} / ${this._panels.length}`;

    const portrait = document.getElementById('intro-portrait');
    if (panel.speaker === 'oak') {
      portrait.src = 'assets/prof_oak.png';
      portrait.style.display = '';
      portrait.onerror = () => { portrait.style.display = 'none'; };
    } else if (panel.speaker === 'rocket') {
      portrait.src = 'assets/team_rocket.png';
      portrait.style.display = '';
      portrait.onerror = () => { portrait.style.display = 'none'; };
    } else {
      portrait.style.display = 'none';
    }

    const btn = document.getElementById('btn-intro-next');
    btn.textContent = isLast ? `Show me! ▶` : 'Next ▶';
  },

  next() {
    clearInterval(this._typeTimer);
    // If still typing, finish instantly first press
    const panel = this._panels[this._idx];
    const textEl = document.getElementById('intro-text');
    if (textEl.textContent.length < panel.text.length) {
      textEl.textContent = panel.text;
      return;
    }
    if (this._idx < this._panels.length - 1) {
      this._idx++;
      this._render();
    } else {
      TutorialEngine.start();
    }
  },

  skip() {
    clearInterval(this._typeTimer);
    TutorialEngine.skip();
  },
};

// ─── TUTORIAL ENGINE ──────────────────────────────────────────────────────────

const TutorialEngine = {
  _idx: 0,
  _slides: [],

  start() {
    const name = GameState.trainerName || 'Trainer';
    const age  = GameState.trainerAge  || 10;

    // Age-adaptive language
    const simple = age <= 7;

    this._slides = [
      {
        title:   'Your Journey',
        oak:     `At every crossroads you'll see paths ahead, ${name}. Choose wisely!`,
        body:    simple
          ? 'You see arrows — left, straight, or right. Tap one to go that way!'
          : 'At each step you choose from 2 or 3 paths. Each path leads to a different event.',
        visual:  'tut-vis-path',
      },
      {
        title:   'Path Types',
        oak:     'Different paths lead to very different places!',
        body:    simple
          ? 'Fight Pokémon ⚔️  Heal your team 💚  Catch Pokémon 🔵  Train ⚡  Shop 🛒  Mystery ❓'
          : 'Battle to level up. Heal to restore HP. Catch new Pokémon. Train your cards. Shop for items. Mystery paths hide surprises!',
        visual:  'tut-vis-types',
      },
      {
        title:   'Battle with Cards',
        oak:     `In battle you play cards from your hand to attack, ${name}!`,
        body:    simple
          ? 'Play cards to hit the other Pokémon. You get 3 Energy each turn. Bigger attacks cost more!'
          : 'Each turn you have 3 Energy. Cards cost 0–3 Energy. Play strong attacks or combos — then End Turn.',
        visual:  'tut-vis-cards',
      },
      {
        title:   'Team Rocket!',
        oak:     'Watch out — Team Rocket may ambush you between paths!',
        body:    simple
          ? 'Jessie, James and Meowth will challenge you with a quiz. Get it right for coins!'
          : 'Jessie, James and Meowth appear between nodes with math, spelling and word challenges. Win coins for correct answers.',
        visual:  'tut-vis-rocket',
      },
      {
        title:   'The Goal',
        oak:     `Defeat all 8 Gym Leaders and become Champion, ${name}!`,
        body:    simple
          ? 'Beat the Gym Leader at the end of each route. Win all 8 and you\'re Champion! 🏆'
          : 'Each route ends with a Gym Leader boss battle. Defeat all 8 to stop Team Rocket and claim the Championship!',
        visual:  'tut-vis-goal',
      },
    ];

    this._idx = 0;
    showScreen('tutorial');
    this._render();
  },

  _render() {
    const slide  = this._slides[this._idx];
    const isLast = this._idx === this._slides.length - 1;

    document.getElementById('tut-oak-text').textContent = slide.oak;
    document.getElementById('tut-title').textContent    = slide.title;

    // Typewriter for body text
    const bodyEl = document.getElementById('tut-body');
    bodyEl.textContent = '';
    let ci = 0;
    clearInterval(this._typeTimer);
    this._typeTimer = setInterval(() => {
      bodyEl.textContent += slide.body[ci];
      ci++;
      if (ci >= slide.body.length) clearInterval(this._typeTimer);
    }, 18);

    // Swap visual
    const visEl = document.getElementById('tut-visual');
    visEl.className = `tut-visual ${slide.visual}`;
    visEl.innerHTML = this._buildVisual(slide.visual);

    // Progress dots
    const dotsEl = document.getElementById('tut-dots');
    dotsEl.innerHTML = this._slides.map((_,i) =>
      `<div class="tut-dot${i === this._idx ? ' tut-dot-active' : ''}"></div>`
    ).join('');

    // Next button label
    const nextBtn = document.getElementById('btn-tut-next');
    nextBtn.textContent = isLast
      ? `Choose your partner! ▶`
      : 'Next ▶';
  },

  _buildVisual(type) {
    switch(type) {
      case 'tut-vis-path':
        return `<div class="tut-path-demo">
          <div class="tut-path-arrow tut-arr-left">
            <svg viewBox="0 0 44 36" width="44" height="36"><line x1="39" y1="18" x2="8" y2="18" stroke="rgba(255,255,255,.85)" stroke-width="3.5" stroke-linecap="round"/><polyline points="20,9 8,18 20,27" stroke="rgba(255,255,255,.85)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
            <span>Left</span>
          </div>
          <div class="tut-path-arrow tut-arr-straight">
            <svg viewBox="0 0 44 36" width="44" height="36"><line x1="22" y1="32" x2="22" y2="6" stroke="rgba(255,255,255,.85)" stroke-width="3.5" stroke-linecap="round"/><polyline points="12,18 22,6 32,18" stroke="rgba(255,255,255,.85)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
            <span>Ahead</span>
          </div>
          <div class="tut-path-arrow tut-arr-right">
            <svg viewBox="0 0 44 36" width="44" height="36"><line x1="5" y1="18" x2="36" y2="18" stroke="rgba(255,255,255,.85)" stroke-width="3.5" stroke-linecap="round"/><polyline points="24,9 36,18 24,27" stroke="rgba(255,255,255,.85)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
            <span>Right</span>
          </div>
        </div>`;

      case 'tut-vis-types':
        return `<div class="tut-types-grid">
          <div class="tut-type-chip tut-type-battle"><img src="assets/battle_icon.png" onerror="this.style.display='none'"/>Battle</div>
          <div class="tut-type-chip tut-type-heal"><img src="assets/heal_icon.png" onerror="this.style.display='none'"/>Heal</div>
          <div class="tut-type-chip tut-type-catch"><img src="assets/catch_icon.png" onerror="this.style.display='none'"/>Catch</div>
          <div class="tut-type-chip tut-type-train">⚡ Train</div>
          <div class="tut-type-chip tut-type-shop"><img src="assets/shop_icon.png" onerror="this.style.display='none'"/>Shop</div>
          <div class="tut-type-chip tut-type-mystery">❓ Mystery</div>
        </div>`;

      case 'tut-vis-cards':
        return `<div class="tut-cards-demo">
          <div class="tut-demo-card tut-card-a">
            <div class="tut-card-cost">●</div>
            <div class="tut-card-icon">⚔️</div>
            <div class="tut-card-name">Tackle</div>
            <div class="tut-card-dmg">20 dmg</div>
          </div>
          <div class="tut-demo-card tut-card-b">
            <div class="tut-card-cost">●●</div>
            <div class="tut-card-icon">🔥</div>
            <div class="tut-card-name">Ember</div>
            <div class="tut-card-dmg">45 dmg</div>
          </div>
          <div class="tut-demo-card tut-card-c">
            <div class="tut-card-cost">★</div>
            <div class="tut-card-icon">💚</div>
            <div class="tut-card-name">Growl</div>
            <div class="tut-card-dmg">Draw 2</div>
          </div>
          <div class="tut-energy-row">
            <span class="energy-orb energy-orb-full"></span>
            <span class="energy-orb energy-orb-full"></span>
            <span class="energy-orb energy-orb-full"></span>
            <span class="tut-energy-label">3 Energy / turn</span>
          </div>
        </div>`;

      case 'tut-vis-rocket':
        return `<div class="tut-rocket-row">
          <div class="tut-rocket-char">
            <img src="assets/jessi.png" alt="Jessie" onerror="this.style.display='none'" class="tut-rocket-img"/>
            <span>Jessie</span>
          </div>
          <div class="tut-rocket-char">
            <img src="assets/james.png" alt="James" onerror="this.style.display='none'" class="tut-rocket-img"/>
            <span>James</span>
          </div>
          <div class="tut-rocket-char">
            <img src="assets/meowth.png" alt="Meowth" onerror="this.style.display='none'" class="tut-rocket-img"/>
            <span>Meowth</span>
          </div>
        </div>`;

      case 'tut-vis-goal':
        return `<div class="tut-goal-row">
          ${[0,1,2,3,4,5,6,7].map(i => `
            <div class="tut-badge-slot">
              <div class="tut-badge-icon">${i < 3 ? '🏅' : '⬜'}</div>
              <div class="tut-badge-num">${i+1}</div>
            </div>`).join('')}
          <div class="tut-trophy">🏆</div>
        </div>`;

      default: return '';
    }
  },

  next() {
    clearInterval(this._typeTimer);
    // First press finishes typewriter if still running
    const bodyEl  = document.getElementById('tut-body');
    const slide   = this._slides[this._idx];
    if (bodyEl.textContent.length < slide.body.length) {
      bodyEl.textContent = slide.body;
      return;
    }
    if (this._idx < this._slides.length - 1) {
      this._idx++;
      this._render();
    } else {
      this._finish();
    }
  },

  _finish() {
    clearInterval(this._typeTimer);
    try { localStorage.setItem('poketrials_tutorial_seen', '1'); } catch(e) {}
    Game.showStarterSelect();
  },

  skip() {
    clearInterval(this._typeTimer);
    this._finish();
  },
};

// ─── JESSIE WORD BANK ─────────────────────────────────────────────────────────
// Each entry: { word, partOfSpeech, correct definition, 3 wrong choices, exampleSentence, jessieQuote }

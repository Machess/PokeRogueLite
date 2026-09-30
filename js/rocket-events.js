const MysteryEngine = {
  start(node) {
    const beaten = GameState.bossesDefeated || 0;

    // Officer Jenny's patrol shield: no Team Rocket in Mystery nodes for a few
    // nodes after helping her. Decrement once per Mystery node visited.
    const patrol = (GameState.rocketShieldNodes || 0) > 0;
    const shielded = patrol || RocketProtection.active();
    if (patrol) GameState.rocketShieldNodes--;

    const pool = [
      { weight: 3, fn: () => CatchEngine.start(node, 'rare') },
      { weight: 2, fn: () => OakSortEngine.start(node) },
      { weight: 2, fn: () => SnorlaxEngine.start(node) },
    ];
    // Rocket only appears when the patrol shield is down
    if (!shielded) pool.push({ weight: 2, fn: () => RocketBattleEngine.start(node) });
    if (beaten >= 1) pool.push({ weight: 1, fn: () => JennyEngine.start(node) });
    if (beaten >= 2) pool.push({ weight: 2, fn: () => JigglypuffEngine.start(node) });
    if (beaten >= 3) pool.push({ weight: 2, fn: () => SurgeEngine.start(node) });
    if (beaten >= 4) pool.push({ weight: 2, fn: () => ErikaEngine.start(node) });
    if (beaten >= 5) pool.push({ weight: 2, fn: () => NinjaMemoryEngine.start(node) });
    if (beaten >= 6) pool.push({ weight: 2, fn: () => SabrinaEngine.start(node) });
    if (beaten >= 7) pool.push({ weight: 2, fn: () => BlaineEngine.start(node) });

    const total = pool.reduce((s, e) => s + e.weight, 0);
    let roll    = Math.random() * total;
    for (const entry of pool) {
      roll -= entry.weight;
      if (roll <= 0) { entry.fn(); return; }
    }
    pool[0].fn();
  },
};

// ─── ROCKET BATTLE ENGINE ────────────────────────────────────────────────────
// Rocket-specific backgrounds — intro (full portrait) + 3 battle variants (wide landscape)
const ROCKET_INTRO_BG   = 'assets/rocket_intro_bg.png';
const ROCKET_BATTLE_BGS = [
  'assets/rocket_battle_bg_1.png',
  'assets/rocket_battle_bg_2.png',
  'assets/rocket_battle_bg_3.png',
];

const RocketBattleEngine = {
  _script:    [],
  _lineIdx:   0,
  _oppTeam:   [],
  _oppIdx:    0,
  _battleBg:  null,   // chosen battle bg, set in start() used in startBattle()
  bState:     null,
  bossData:   null,

  async start(node) {
    showLoading();
    // Clear any stale mini-game engine registration so btn-start-boss-battle
    // routes to THIS rocket battle, not a leftover engine from a prior node.
    ActiveEngine.clear();

    // ── Pick team based on starter level ─────────────────────────────────────
    const starter = GameState.party.find(p => p.isStarter);
    const lvl     = starter?.level ?? 1;

    // Low < 20: Koffing + Ekans
    // Mid 20–35: Weezing + Arbok
    // High > 35: Weezing + Arbok + Lickitung + Meowth
    let teamIds;
    if (lvl < 20)       teamIds = [109, 23];
    else if (lvl <= 35) teamIds = [110, 24];
    else                teamIds = [110, 24, 108, 52];

    this._oppTeam = [];
    this._oppIdx  = 0;
    const rocketLvl = Math.max(5, lvl - 3 + Math.floor(Math.random() * 4));

    for (const id of teamIds) {
      try {
        const d = await fetchPoke(id);
        if (!d) continue;
        const pType = d.types?.[0]?.type?.name || 'poison';
        const pName = capitalize(d.name) || `Pokémon #${id}`;
        const sprite = getSpriteUrl(d, true) || '';
        this._oppTeam.push(makePokemon(id, rocketLvl, sprite, pName, pType));
      } catch(e) {
        console.warn(`fetchPoke failed for id ${id}:`, e);
        this._oppTeam.push(makePokemon(id, rocketLvl, '', `Pokémon #${id}`, 'poison'));
      }
    }

    if (this._oppTeam.length === 0) {
      this._oppTeam = teamIds.map(id =>
        makePokemon(id, rocketLvl, '', `Pokémon #${id}`, 'poison')
      );
    }

    // Pick a random battle bg now so it's consistent for the whole encounter
    this._battleBg = ROCKET_BATTLE_BGS[Math.floor(Math.random() * ROCKET_BATTLE_BGS.length)];

    this._script  = ROCKET_SCRIPTS[Math.floor(Math.random() * ROCKET_SCRIPTS.length)];
    this._lineIdx = 0;
    this.bossData = { name: 'Team Rocket' };

    hideLoading();
    showScreen('boss');
    BossEngine._isRocket = true;

    // ── Set full-portrait intro background ───────────────────────────────────
    const bgEl  = document.querySelector('#screen-boss .battle-bg');
    const imgEl = document.querySelector('#screen-boss .battle-bg-img');
    if (bgEl && imgEl) {
      bgEl.classList.add('boss-intro-mode');
      bgEl.style.background = 'linear-gradient(180deg,#1a0808 0%,#2a1010 100%)';
      imgEl.style.opacity = '0';
      imgEl.onload  = () => { imgEl.style.opacity = '1'; bgEl.style.background = ''; };
      imgEl.onerror = () => { imgEl.style.opacity = '0'; };
      imgEl.src = ROCKET_INTRO_BG;
    }

    document.getElementById('boss-party-bar').innerHTML =
      this._oppTeam.map((_,i) => `<div class="boss-poke-pip" id="boss-pip-${i}"></div>`).join('');

    const introEl  = document.getElementById('trainer-intro');
    const battleEl = document.getElementById('boss-battle-area');
    if (introEl)  introEl.style.display  = 'flex';
    if (battleEl) battleEl.style.display = 'none';

    this._showLine(0);
  },

  // ── Render one dialogue line ──────────────────────────────────────────────
  _showLine(idx) {
    const script    = this._script;
    const line      = script[idx];
    const trainerName = GameState.trainerName || 'Trainer';
    const text      = line.text.replace(/\$\{name\}/g, trainerName);
    const isLast    = idx === script.length - 1;

    // Portrait
    const wrap = document.getElementById('trainer-sprite-wrap');
    const img  = document.getElementById('boss-trainer-sprite');
    if (img) {
      img.src = line.img;
      img.onerror = () => {
        img.onerror = null;
        wrap.innerHTML = `<div style="font-size:4rem;line-height:1">👤</div>`;
      };
    }

    // Text — typewriter effect
    const nameEl = document.getElementById('dialogue-name');
    const textEl = document.getElementById('dialogue-text');
    const nextBtn  = document.getElementById('btn-dialogue-next');
    const startBtn = document.getElementById('btn-start-boss-battle');

    nameEl.textContent = line.name;
    textEl.textContent = '';

    // Hide both buttons while typing
    if (nextBtn)  nextBtn.style.display  = 'none';
    if (startBtn) startBtn.style.display = 'none';

    // Typewriter
    let ci = 0;
    const interval = setInterval(() => {
      textEl.textContent += text[ci];
      ci++;
      if (ci >= text.length) {
        clearInterval(interval);
        // Show correct button after typing completes
        if (isLast) {
          if (startBtn) startBtn.style.display = '';
          if (nextBtn)  nextBtn.style.display  = 'none';
        } else {
          if (nextBtn)  nextBtn.style.display  = '';
          if (startBtn) startBtn.style.display = 'none';
        }
      }
    }, 28);

    this._lineIdx = idx;
  },

  // ── Player taps Next ─────────────────────────────────────────────────────
  advanceDialogue() {
    const next = this._lineIdx + 1;
    if (next < this._script.length) {
      this._showLine(next);
    }
  },

  // ── Start the actual battle (called by btn-start-boss-battle) ─────────────
  startBattle() {
    document.getElementById('trainer-intro').style.display    = 'none';
    document.getElementById('boss-battle-area').style.display = 'block';

    // Swap from full-portrait intro bg to the chosen wide battle bg
    const bgEl  = document.querySelector('#screen-boss .battle-bg');
    const imgEl = document.querySelector('#screen-boss .battle-bg-img');
    if (bgEl && imgEl) {
      bgEl.classList.remove('boss-intro-mode');
      imgEl.style.opacity = '1';
      imgEl.onerror = () => { imgEl.style.opacity = '0'; };
      imgEl.src = this._battleBg;
    }

    BossEngine.bossData = this.bossData;
    BossEngine.oppTeam  = this._oppTeam;
    BossEngine.oppIdx   = 0;
    BossEngine._loadNextOpp();
  },

  // Delegate log, render etc. to BossEngine at battle time
  _log(m)   { BossEngine._log(m); },
  _render() { BossEngine._render(); SaveManager.captureBattle(true); },
};


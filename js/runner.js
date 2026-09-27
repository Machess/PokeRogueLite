const FLEE_LINES = {
  water:    ['dived back into the water!',    'splashed away!',           'slipped back into the depths!'],
  fire:     ['blazed off into the distance!', 'vanished in a flash of flame!', 'was too hot to hold!'],
  grass:    ['disappeared into the tall grass!','rustled away into the leaves!', 'melted back into the forest!'],
  electric: ['zapped away in a flash!',       'discharged and vanished!',  'was too fast to catch!'],
  rock:     ['rolled away!',                  'burrowed under the rocks!', 'was too tough for the ball!'],
  ground:   ['dug back underground!',         'burrowed away!',            'vanished into the earth!'],
  poison:   ['slithered away into the shadows!','dissolved into the mist!', 'was too slippery to hold!'],
  psychic:  ['teleported away!',              'vanished with a flash of light!','was too clever to stay!'],
  ghost:    ['phased right through the ball!','vanished into thin air!',   'dissolved into shadow!'],
  ice:      ['slid away across the ice!',     'melted into the frost!',    'was too cold to catch!'],
  flying:   ['took flight and disappeared!',  'soared out of reach!',      'glided away on the wind!'],
  fighting: ['punched the ball away!',        'leaped out of reach!',      'was too strong to hold!'],
  dragon:   ['roared and flew away!',         'vanished into the clouds!', 'was way too powerful!'],
  dark:     ['slipped away into the shadows!','disappeared without a trace!','was too cunning to catch!'],
  steel:    ['clinked away into the rocks!',  'deflected the ball!',       'was too hard to contain!'],
  fairy:    ['sparkled and vanished!',        'skipped away on the breeze!','left only glitter behind!'],
  bug:      ['scurried away into the grass!', 'flew off into the trees!',  'was too quick and nimble!'],
  normal:   ['broke free and ran away!',      'escaped into the wild!',    'bolted off at full speed!'],
};

// Environment backdrop CSS classes per bossIndex — matches MAP_THEMES
const CATCH_BACKDROPS = [
  'catch-bg-rock',     // 0 Brock
  'catch-bg-water',    // 1 Misty
  'catch-bg-electric', // 2 Lt Surge
  'catch-bg-grass',    // 3 Erika
  'catch-bg-poison',   // 4 Koga
  'catch-bg-psychic',  // 5 Sabrina
  'catch-bg-fire',     // 6 Blaine
  'catch-bg-dark',     // 7 Giovanni
];

// ─── WOBBUFFET ENGINE — "Wobbu-Counter!" mini-game ───────────────────────────
// Wobbuffet pops out of Jessie's Poké Ball mid-route.
// Incoming attacks slide in — player must tap the super-effective counter type.
// 5 rounds, faster each round. Part of the TeamRocketChallenge pool.

const WOBBU_ATTACKS = [
  // { incoming type, correct counter type, wrong choices }
  { type:'fire',     counter:'water',    icon:'🔥' },
  { type:'water',    counter:'electric', icon:'💧' },
  { type:'grass',    counter:'fire',     icon:'🌿' },
  { type:'electric', counter:'ground',   icon:'⚡' },
  { type:'ice',      counter:'fire',     icon:'❄️' },
  { type:'psychic',  counter:'bug',      icon:'🔮' },
  { type:'rock',     counter:'water',    icon:'🪨' },
  { type:'ground',   counter:'water',    icon:'🟫' },
  { type:'poison',   counter:'ground',   icon:'☠️' },
  { type:'flying',   counter:'electric', icon:'🌬️' },
  { type:'bug',      counter:'fire',     icon:'🐛' },
  { type:'ghost',    counter:'ghost',    icon:'👻' },
  { type:'dragon',   counter:'ice',      icon:'🐉' },
  { type:'fighting', counter:'psychic',  icon:'🥊' },
  { type:'dark',     counter:'fighting', icon:'🌑' },
  { type:'steel',    counter:'fire',     icon:'⚙️' },
  { type:'normal',   counter:'fighting', icon:'💥' },
];

const WOBBU_WRONG_POOL = ['fire','water','grass','electric','ice','psychic','rock','ground'];

// ─── ROCKET RUNNER ENGINE — "Dig Dash" (endless-runner escape mini-game) ─────
// Team Rocket dug pit-traps across the route. The trainer auto-runs; tap/space
// to jump the holes and grab floating coins. Reach the finish to escape with
// prize money + a Courage buff. Fall in a hole → small penalty, run ends.
const ROCKET_RUNNER_FLUFF = {
  meowth: { name:'Meowth', img:'meowth.png',
    intro:"Meowth! We dug holes allll over this path! Let's see ya get past 'em, twerp!",
    win:"Nyaaa! How'd ya jump all those?! The boss ain't gonna like this...",
    lose:"Hahaha! Right into our hole! That's what ya get!" },
  jessie: { name:'Jessie', img:'jessi.png',
    intro:"Prepare for trouble! These pitfalls will stop you in your tracks!",
    win:"Impossible! You leapt over every single one! Uuurgh!",
    lose:"Hahaha! Down you go! Team Rocket strikes again!" },
  james:  { name:'James', img:'james.png',
    intro:"...and make it double! Mind the holes, they're frightfully deep!",
    win:"Oh dear, they got away again, Jessie...",
    lose:"Ha! Caught in our clever trap! Well, mostly Jessie's trap." },
};

const RocketRunnerEngine = {
  _onComplete: null, _node: null,
  _raf: null, _running: false,
  _trainer: null, _field: null,
  _x: 0, _vy: 0, _y: 0, _grounded: true,
  _obstacles: [], _coins: [],
  _dist: 0, _goal: 0, _speed: 0, _coinsGot: 0,
  _spawnGap: 0, _coinSpawnGap: 0, _fluff: null,
  _lastT: 0,

  async start(node) {
    this._node = node;
    // Pick a random Rocket member to taunt the player
    const keys = Object.keys(ROCKET_RUNNER_FLUFF);
    this._fluff = ROCKET_RUNNER_FLUFF[keys[Math.floor(Math.random() * keys.length)]];

    // Prefetch Arbok (24) + Koffing (109) sprites for the jumpable obstacles
    this._pokeSprites = {};
    await Promise.all([24, 109].map(async id => {
      const d = await fetchPoke(id).catch(() => null);
      if (d) this._pokeSprites[id] = getSpriteUrl(d);
    }));

    const tier = Math.min(GameState.difficultyTier || 2, 3);
    // Tier config: base speed (px/s), gap range (ms), goal distance, gravity, jump
    const CFG = {
      1: { speed:170, goal:5400, gapMin:340, gapMax:520, grav:1500, jump:560 },
      2: { speed:215, goal:7000, gapMin:300, gapMax:460, grav:1650, jump:600 },
      3: { speed:265, goal:8600, gapMin:260, gapMax:400, grav:1800, jump:640 },
    };
    this._cfg = CFG[tier];

    const cv = setupChallengeScreen({
      portrait: this._fluff.img, badge: '🏃 Dig Dash — Escape Team Rocket!',
      intro: this._fluff.intro,
      wrapClass: 'runner-wrap', screenClass: 'runner-active',
    });

    // Intro overlay with a Start button (so the player isn't dropped cold)
    const startWrap = document.createElement('div');
    startWrap.className = 'runner-start-wrap';
    startWrap.innerHTML = `<button class="btn-pixel btn-primary runner-start-btn" id="runner-start-btn">Run! 🏃 (tap / space to jump)</button>`;
    cv.appendChild(startWrap);
    document.getElementById('runner-start-btn').addEventListener('click', () => this._begin(cv));
  },

  _begin(cv) {
    cv.innerHTML = '';
    // Build field
    const field = document.createElement('div');
    field.className = 'runner-field';
    field.id = 'runner-field';
    field.innerHTML = `
      <div class="runner-sky"></div>
      <div class="runner-hud">
        <span id="runner-dist">0m</span>
        <span id="runner-coins">🪙 0</span>
      </div>
      <div class="runner-ground"></div>
      <div class="runner-goal" id="runner-goal"></div>
      <img class="runner-jenny" id="runner-jenny" src="assets/officer_jenny.png"
           onerror="this.onerror=null;this.style.display='none'"/>
      <img class="runner-trainer" id="runner-trainer" src="assets/trainer_run.png"
           onerror="this.onerror=null;this.src='assets/trainer_stand.png'"/>`;
    cv.appendChild(field);
    this._field = field;
    this._trainer = document.getElementById('runner-trainer');

    // State
    this._running = true;
    this._x = 0; this._vy = 0; this._y = 0; this._grounded = true;
    this._obstacles = []; this._coins = [];
    this._dist = 0; this._goal = this._cfg.goal; this._speed = this._cfg.speed;
    this._coinsGot = 0;
    this._jennyShown = false;
    this._spawnGap = 500; this._coinSpawnGap = 600;
    this._lastT = performance.now();

    // Input — jump
    this._jumpHandler = (e) => {
      if (e.type === 'keydown' && e.code !== 'Space' && e.code !== 'ArrowUp') return;
      if (e.type === 'keydown') e.preventDefault();
      this._jump();
    };
    document.addEventListener('keydown', this._jumpHandler);
    field.addEventListener('pointerdown', this._jumpHandler);

    SoundEngine.playBGM('teamrocket_battle.mp3');
    this._raf = requestAnimationFrame((t) => this._loop(t));
  },

  _jump() {
    if (!this._running) return;
    if (this._grounded) {
      this._vy = -this._cfg.jump;
      this._grounded = false;
      this._trainer?.classList.add('runner-jumping');
      SoundEngine.playTap();
    }
  },

  _loop(now) {
    if (!this._running) return;
    const dt = Math.min((now - this._lastT) / 1000, 0.05);
    this._lastT = now;

    const FIELD_W = this._field.clientWidth || 340;
    const GROUND_Y = 0;            // trainer bottom rests on ground (CSS bottom)

    // Physics — vertical
    if (!this._grounded) {
      this._vy += this._cfg.grav * dt;
      this._y  += this._vy * dt;
      if (this._y >= 0) { this._y = 0; this._vy = 0; this._grounded = true; this._trainer?.classList.remove('runner-jumping'); }
    }
    if (this._trainer) this._trainer.style.transform = `translateY(${this._y}px)`;

    // Distance + gentle speed ramp
    this._speed += 4 * dt;        // slow escalation
    this._dist  += this._speed * dt;
    const distM = Math.floor(this._dist / 40);
    const dEl = document.getElementById('runner-dist');
    if (dEl) dEl.textContent = distM + 'm';

    // Spawn obstacles — but stop in the final stretch so the run ends cleanly
    // (no obstacle appears then vanishes the instant the goal is hit).
    const inHomeStretch = this._dist >= this._goal - 750;
    this._spawnGap -= this._speed * dt;
    if (this._spawnGap <= 0 && !inHomeStretch) {
      // Mix holes with jumpable Pokémon (Arbok / Koffing) in every tier
      if (Math.random() < 0.45) this._spawnPoke(FIELD_W);
      else                      this._spawnHole(FIELD_W);
      this._spawnGap = this._cfg.gapMin + Math.random() * (this._cfg.gapMax - this._cfg.gapMin);
    }
    // Spawn coins as TRAILS/ARCS (Mario-style pathing) — far more coins, often
    // arcing up so grabbing them naturally guides a well-timed jump. Stops in
    // the home stretch.
    this._coinSpawnGap -= this._speed * dt;
    if (this._coinSpawnGap <= 0 && !inHomeStretch) {
      this._spawnCoinTrail(FIELD_W);
      this._coinSpawnGap = 420 + Math.random() * 520;   // much more frequent
    }

    // As the goal nears, slide Officer Jenny in from the right edge so it looks
    // like the trainer is running toward her — a clear, satisfying finish line.
    if (inHomeStretch && !this._jennyShown) {
      this._jennyShown = true;
      const jenny = document.getElementById('runner-jenny');
      if (jenny) jenny.classList.add('runner-jenny-in');
      const goalEl = document.getElementById('runner-goal');
      if (goalEl) goalEl.classList.add('runner-goal-show');
    }

    // Move + collide obstacles
    const TRAINER_X = 48, TRAINER_W = 34, TRAINER_H = 40;
    for (let i = this._obstacles.length - 1; i >= 0; i--) {
      const o = this._obstacles[i];
      o.x -= this._speed * dt;
      o.el.style.left = o.x + 'px';
      const horiz = (TRAINER_X + TRAINER_W > o.x + 6) && (TRAINER_X < o.x + o.w - 6);
      // Holes: hit if overlapping while on/near the ground (didn't jump high enough).
      // Pokémon: stand ON the ground with a height — hit if overlapping while the
      // trainer's feet are below the top of the sprite (didn't clear it).
      const clearedBy = o.kind === 'poke' ? (o.h - 6) : 18;
      if (horiz && this._y > -clearedBy) {
        this._fall(o);
        return;
      }
      if (o.x < -o.w) { o.el.remove(); this._obstacles.splice(i, 1); }
    }

    // Move + collect coins
    for (let i = this._coins.length - 1; i >= 0; i--) {
      const c = this._coins[i];
      c.x -= this._speed * dt;
      c.el.style.left = c.x + 'px';
      const cy = c.y;   // coin's vertical offset (negative = up)
      const tTop = this._y - TRAINER_H;
      const hit = (TRAINER_X + TRAINER_W > c.x) && (TRAINER_X < c.x + 24) &&
                  (tTop < cy + 24) && (this._y > cy - 24);
      if (hit && !c.got) {
        c.got = true;
        c.el.classList.add('runner-coin-got');
        this._coinsGot++;
        const cEl = document.getElementById('runner-coins');
        if (cEl) cEl.textContent = '🪙 ' + this._coinsGot;
        SoundEngine.playTap();
        setTimeout(() => { c.el.remove(); }, 250);
        this._coins.splice(i, 1);
        continue;
      }
      if (c.x < -30) { c.el.remove(); this._coins.splice(i, 1); }
    }

    // Goal reached?
    if (this._dist >= this._goal) { this._win(); return; }

    this._raf = requestAnimationFrame((t) => this._loop(t));
  },

  _spawnHole(fieldW) {
    const tier = Math.min(GameState.difficultyTier || 2, 3);
    const w = tier === 1 ? 38 : tier === 2 ? (38 + Math.random() * 18) : (40 + Math.random() * 30);
    const el = document.createElement('div');
    el.className = 'runner-hole';
    el.style.width = w + 'px';
    el.style.left = fieldW + 'px';
    this._field.appendChild(el);
    this._obstacles.push({ el, x: fieldW, w, kind: 'hole' });
  },

  // A Pokémon (Arbok or Koffing) sitting on the ground — jump over it.
  _spawnPoke(fieldW) {
    const pick = Math.random() < 0.5
      ? { id: 24, name: 'Arbok',   h: 36, w: 36 }
      : { id: 109, name: 'Koffing', h: 30, w: 30 };
    const el = document.createElement('img');
    el.className = 'runner-poke pixel-sprite';
    el.alt = pick.name;
    el.src = (this._pokeSprites && this._pokeSprites[pick.id])
      || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pick.id}.png`;
    el.style.width = el.style.height = pick.w + 'px';
    el.style.left = fieldW + 'px';
    this._field.appendChild(el);
    this._obstacles.push({ el, x: fieldW, w: pick.w, h: pick.h, kind: 'poke' });
  },

  // Spawn a single coin at a given x offset and height (negative y = higher up)
  _spawnCoinAt(x, y) {
    const el = document.createElement('div');
    el.className = 'runner-coin';
    el.textContent = '🪙';
    el.style.left = x + 'px';
    el.style.bottom = (62 - y) + 'px';
    this._field.appendChild(el);
    this._coins.push({ el, x, y, got: false });
  },

  // Spawn a TRAIL of coins — Mario-style pathing. Patterns:
  //  • line: a straight row at a low, runnable height
  //  • arc:  coins rising then falling, tracing a jump path (guides a jump)
  //  • stair: ascending steps
  _spawnCoinTrail(fieldW) {
    const patterns = ['line', 'arc', 'arc', 'stair'];   // arcs weighted higher
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const n = 4 + Math.floor(Math.random() * 4);        // 4–7 coins per trail
    const spacing = 30;
    for (let i = 0; i < n; i++) {
      const x = fieldW + i * spacing;
      let y;
      if (pattern === 'line') {
        y = -(40 + Math.random() * 10);
      } else if (pattern === 'arc') {
        // Parabola peaking in the middle — traces a jump
        const t = i / (n - 1);                 // 0..1
        const arc = Math.sin(t * Math.PI);     // 0..1..0
        y = -(38 + arc * 64);
      } else { // stair
        y = -(36 + i * 12);
      }
      this._spawnCoinAt(x, y);
    }
  },

  _fall(hole) {
    this._running = false;
    cancelAnimationFrame(this._raf);
    this._cleanupInput();
    this._trainer?.classList.add('runner-fall');
    SoundEngine.stopBGM();
    setTimeout(() => this._finish(false), 900);
  },

  _win() {
    this._running = false;
    cancelAnimationFrame(this._raf);
    this._cleanupInput();
    // Make sure Jenny is present even on a very short field
    const jenny = document.getElementById('runner-jenny');
    if (jenny) jenny.classList.add('runner-jenny-in');
    document.getElementById('runner-goal')?.classList.add('runner-goal-reached');
    // Trainer dashes up to Jenny, then they celebrate together
    this._trainer?.classList.add('runner-arrive');
    setTimeout(() => {
      this._trainer?.classList.remove('runner-arrive');
      this._trainer?.classList.add('runner-cheer');
      jenny?.classList.add('runner-jenny-cheer');
    }, 700);
    // Longer beat so the arrival reads before the results card
    setTimeout(() => this._finish(true), 1700);
  },

  _cleanupInput() {
    if (this._jumpHandler) {
      document.removeEventListener('keydown', this._jumpHandler);
      this._field?.removeEventListener('pointerdown', this._jumpHandler);
    }
  },

  _finish(escaped) {
    const tier = Math.min(GameState.difficultyTier || 2, 3);
    const distM = Math.floor(this._dist / 40);
    const baseGold = { 1: 8, 2: 12, 3: 16 }[tier];

    let gold, penaltyMsg = '';
    if (escaped) {
      // Prize money scales with distance + coins collected (coin bonus capped
      // so the now-plentiful coins reward skill without ballooning the economy)
      gold = baseGold + Math.min(this._coinsGot, 30) + Math.floor(distM / 25);
      // Courage buff — +10% damage next battle (its own effect flag so the
      // battle log credits Courage, not Surge's briefing)
      GameState.pendingPlayerEffects = GameState.pendingPlayerEffects || {};
      GameState.pendingPlayerEffects.courageBonus = 1.10;
    } else {
      // Small penalty: lose a little gold + HP, run ends
      gold = Math.max(2, this._coinsGot * 2);
      const lead = GameState.party[GameState.activePokemonIndex];
      if (lead) lead.hp = Math.max(1, lead.hp - Math.ceil(lead.maxHp * 0.12));
      const lostGold = Math.min(GameState.gold || 0, 5);
      GameState.gold = (GameState.gold || 0) - lostGold;
      penaltyMsg = `\n\nTeam Rocket caught up! −${lostGold}💰 and your lead Pokémon got a little hurt.`;
    }
    GameState.gold = (GameState.gold || 0) + gold;
    saveGame();

    // Clean up the screen
    const sc = document.getElementById('screen-challenge');
    if (sc) sc.classList.remove('runner-active');
    const cv = document.getElementById('challenge-coin-visual');
    if (cv) { cv.innerHTML = ''; cv.className = 'challenge-coin-visual'; }

    const title = escaped ? '🏃 Escaped!' : '💢 Tripped Up!';
    const body  = escaped
      ? `You dashed ${distM}m and grabbed ${this._coinsGot} coins!\n+${gold}💰\n\n⭐ Courage! +10% damage in your next battle!\n\n"${this._fluff.win}"`
      : `You made it ${distM}m before falling.\n+${gold}💰${penaltyMsg}\n\n"${this._fluff.lose}"`;

    showModal(title, body, () => {
      showScreen('map');
      MapEngine.renderParty();
      if (this._onComplete) { const cb = this._onComplete; this._onComplete = null; cb(); }
    });
  },
};


const FALKNER_BIRDS = [
  { id:16,  name:'Pidgey',     pts:10, speed:0.6, path:'straight', size:52 },
  { id:21,  name:'Spearow',    pts:15, speed:0.8, path:'sine',     size:48 },
  { id:17,  name:'Pidgeotto',  pts:20, speed:0.9, path:'swoop',    size:56 },
  { id:22,  name:'Fearow',     pts:30, speed:1.1, path:'sine',     size:52 },
  { id:84,  name:'Doduo',      pts:25, speed:1.0, path:'straight', size:50 },
  { id:142, name:'Aerodactyl', pts:50, speed:1.4, path:'erratic',  size:58 },
];

// Wave definitions — [birdId, birdId, ...]
const FALKNER_WAVES = [
  [16, 16, 16],                          // Wave 1 — slow Pidgey
  [16, 21, 17, 21, 16],                  // Wave 2 — mixed
  [22, 16, 84, 142, 17, 21, 22],         // Wave 3 — fast + Aerodactyl
];

const FalknerEngine = {
  _isActive: false, _node: null,
  _sprites:  {},          // id → Image object
  _birds:    [],          // active flying Pokémon on screen
  _wave:     0,
  _waveQueue:[],          // remaining birds to spawn in current wave
  _score:    0,
  _balls:    0,           // Pokéballs remaining
  _ballCooldown: false,
  _missCount:0,
  _passScore:0,
  _maxBalls: 0,
  _animFrame:null,
  _gameRunning: false,
  _spawnTimer: 0,
  _field: null,           // the game DOM container
  _tier:  1,

  async start(node) {
    this._node = node;
    this._isActive = true;
    this._sprites = {};
    ActiveEngine.set(this);

    // Pre-fetch all bird sprites
    showLoading();
    await Promise.all(FALKNER_BIRDS.map(async b => {
      const data = await fetchPoke(b.id).catch(() => null);
      const img  = new Image();
      img.src    = data ? getSpriteUrl(data) :
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${b.id}.png`;
      this._sprites[b.id] = img;
    }));
    hideLoading();

    showBossIntro({
      gymIndex:  0,
      portrait:  'falkner.png',
      name:      'Falkner',
      btnLabel:  '🎯 Help Catch Them!',
      introText: "My Pokémon escaped from the tower! They are flying all over Violet City! Throw Pokéballs to catch them — tap where they are! I need your help!",
    });
  },

  startGame() {
    this._isActive   = false;
    ActiveEngine.clear();
    document.getElementById('trainer-intro').style.display = 'none';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');

    this._tier      = GameState.difficultyTier || 2;
    this._score     = 0;
    this._wave      = 0;
    this._birds     = [];
    this._missCount = 0;
    this._ballCooldown = false;
    this._gameRunning  = true;
    this._spawnTimer   = 0;

    // Tier config
    const CFG = { 1:{balls:18,pass:50}, 2:{balls:15,pass:80}, 3:{balls:12,pass:100} };
    const cfg = CFG[Math.min(this._tier, 3)];
    this._balls     = cfg.balls;
    this._maxBalls  = cfg.balls;
    this._passScore = cfg.pass;

    const cv = setupChallengeScreen({
      portrait: 'falkner.png', badge: '🎯 Catch Falkner\'s Flock!',
      intro: `Wave 1/3 — Score: 0 — 🎯 ${this._balls}`,
      wrapClass: 'falkner-dh-wrap', screenClass: 'falkner-active',
    });

    // Build game field
    const field = document.createElement('div');
    field.className = 'falkner-dh-field';
    field.id = 'falkner-field';
    cv.appendChild(field);
    this._field = field;

    // HUD row
    const hud = document.createElement('div');
    hud.className = 'falkner-dh-hud';
    hud.id = 'falkner-hud';
    hud.innerHTML = `
      <span class="fdh-score" id="fdh-score">⭐ 0</span>
      <span class="fdh-wave"  id="fdh-wave">Wave 1/3</span>
      <span class="fdh-balls" id="fdh-balls">🎯 ${this._balls}</span>`;
    cv.appendChild(hud);

    // Pokéball count bar
    const ballBar = document.createElement('div');
    ballBar.className = 'fdh-ball-bar';
    ballBar.id = 'fdh-ball-bar';
    this._renderBallBar(ballBar);
    cv.appendChild(ballBar);

    // Grass / ground strip
    const grass = document.createElement('div');
    grass.className = 'fdh-grass';
    field.appendChild(grass);

    // Tap to throw
    field.addEventListener('click', e => this._throwBall(e));
    field.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = field.getBoundingClientRect();
      this._throwBall({ clientX: t.clientX, clientY: t.clientY, _rect: rect });
    }, { passive: false });

    // Start spawning wave 0
    this._loadWave(0);
    this._loop();
  },

  _renderBallBar(el) {
    el = el || document.getElementById('fdh-ball-bar');
    if (!el) return;
    el.innerHTML = Array.from({ length: this._maxBalls }, (_, i) =>
      `<span class="fdh-ball-pip${i < this._balls ? '' : ' used'}">⚪</span>`
    ).join('');
  },

  _loadWave(waveIdx) {
    this._wave     = waveIdx;
    this._waveQueue = [...FALKNER_WAVES[waveIdx]];
    this._spawnTimer = 0;
    document.getElementById('fdh-wave').textContent = `Wave ${waveIdx + 1}/3`;
  },

  _loop() {
    if (!this._gameRunning) return;
    this._spawnTimer++;

    // Spawn next bird every ~90 frames if queue has entries and < 3 on screen
    if (this._waveQueue.length > 0 && this._birds.length < 3 && this._spawnTimer > 60) {
      this._spawnTimer = 0;
      const id   = this._waveQueue.shift();
      const def  = FALKNER_BIRDS.find(b => b.id === id);
      if (def) this._spawnBird(def);
    }

    // Move all birds
    const FW = this._field?.offsetWidth  || 340;
    const FH = this._field?.offsetHeight || 260;

    this._birds.forEach(b => {
      if (b.caught || b.escaped) return;
      const spd = b.def.speed * (this._tier <= 1 ? 0.6 : this._tier === 2 ? 0.85 : 1.1) * 1.8;

      if (b.dir > 0) { b.x += spd; }
      else           { b.x -= spd; }

      // Path logic
      b.t += 0.04;
      if (b.def.path === 'sine') {
        b.y = b.baseY + Math.sin(b.t * 2) * 30;
      } else if (b.def.path === 'swoop') {
        // Arc: starts low, peaks mid-screen, comes back
        const progress = b.x / FW;
        b.y = b.baseY - Math.sin(progress * Math.PI) * 60;
      } else if (b.def.path === 'erratic') {
        b.erraticTimer = (b.erraticTimer || 0) + 1;
        if (b.erraticTimer > 40 + Math.random() * 30) {
          b.erraticTimer = 0;
          b.erraticDy = (Math.random() - 0.5) * 3;
        }
        b.y = Math.max(20, Math.min(FH - b.def.size - 40, b.y + (b.erraticDy || 0)));
      }

      // Flip sprite based on direction
      if (b.el) {
        b.el.style.left      = `${b.x}px`;
        b.el.style.top       = `${b.y}px`;
        b.el.style.transform = b.dir < 0 ? 'scaleX(-1)' : '';
      }

      // Off screen → escaped
      if (b.x > FW + 60 || b.x < -60) {
        b.escaped = true;
        b.el?.remove();
        this._missCount++;
        this._showMiss(b.def.name);
      }
    });

    // Clean up
    this._birds = this._birds.filter(b => !b.caught && !b.escaped);

    // Wave clear?
    if (this._waveQueue.length === 0 && this._birds.length === 0) {
      if (this._wave < FALKNER_WAVES.length - 1) {
        // Short pause then next wave
        this._gameRunning = false;
        setTimeout(() => {
          this._gameRunning = true;
          this._loadWave(this._wave + 1);
          this._loop();
        }, 1200);
        return;
      } else {
        // All waves done
        this._gameRunning = false;
        setTimeout(() => this._finish(), 800);
        return;
      }
    }

    // Out of balls
    if (this._balls <= 0 && this._birds.length === 0 && this._waveQueue.length === 0) {
      this._gameRunning = false;
      setTimeout(() => this._finish(), 600);
      return;
    }

    this._animFrame = requestAnimationFrame(() => this._loop());
  },

  _spawnBird(def) {
    const FW   = this._field?.offsetWidth  || 340;
    const FH   = this._field?.offsetHeight || 260;
    const dir  = Math.random() > 0.5 ? 1 : -1;
    const x    = dir > 0 ? -def.size - 10 : FW + 10;
    const y    = 20 + Math.random() * (FH - def.size - 80);

    const el = document.createElement('img');
    el.className = 'fdh-bird';
    el.src       = this._sprites[def.id]?.src ||
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${def.id}.png`;
    el.style.cssText = `left:${x}px;top:${y}px;width:${def.size}px;height:${def.size}px;`;
    this._field.appendChild(el);

    // Points badge above bird
    const pts = document.createElement('div');
    pts.className = 'fdh-pts-badge';
    pts.textContent = `${def.pts}`;
    pts.style.cssText = `left:${x + def.size/2}px;top:${y - 16}px;`;
    pts.id = `fdh-pts-${def.id}-${Date.now()}`;
    this._field.appendChild(pts);

    const bird = { def, x, y, baseY: y, dir, t: 0, el, ptsEl: pts, caught: false, escaped: false };
    this._birds.push(bird);
  },

  _throwBall(e) {
    if (!this._gameRunning || this._ballCooldown) return;
    if (this._balls <= 0) return;

    const rect = e._rect || this._field?.getBoundingClientRect();
    if (!rect) return;
    const tapX  = e.clientX - rect.left;
    const tapY  = e.clientY - rect.top;

    this._balls--;
    document.getElementById('fdh-balls').textContent = `🎯 ${this._balls}`;
    this._renderBallBar();

    // Cooldown
    this._ballCooldown = true;
    setTimeout(() => { this._ballCooldown = false; }, 400);

    // Animate Pokéball throw
    this._animateBall(tapX, tapY, () => {
      // Check hit — 48px radius tolerance
      const HIT_R = 48;
      let hit = null;
      for (const b of this._birds) {
        if (b.caught || b.escaped) continue;
        const cx = b.x + b.def.size / 2;
        const cy = b.y + b.def.size / 2;
        const dist = Math.hypot(cx - tapX, cy - tapY);
        if (dist < HIT_R + b.def.size / 2) {
          if (!hit || dist < Math.hypot(hit.x + hit.def.size/2 - tapX, hit.y + hit.def.size/2 - tapY)) {
            hit = b;
          }
        }
      }
      if (hit) {
        this._catchBird(hit, tapX, tapY);
      }
    });
  },

  _animateBall(tx, ty, onLand) {
    const FW   = this._field?.offsetWidth  || 340;
    const FH   = this._field?.offsetHeight || 260;
    const ball = document.createElement('img');
    ball.src   = 'assets/pokeball.png';
    ball.className = 'fdh-pokeball';

    // Start from bottom centre
    const sx = FW / 2, sy = FH - 30;
    ball.style.cssText = `left:${sx}px;top:${sy}px;`;
    this._field.appendChild(ball);

    const dur    = 320;
    const start  = performance.now();
    const animate = (now) => {
      const t = Math.min((now - start) / dur, 1);
      // Parabolic arc
      const x  = sx + (tx - sx) * t;
      const y  = sy + (ty - sy) * t - Math.sin(t * Math.PI) * 50;
      const rot = t * 540;
      ball.style.left      = `${x}px`;
      ball.style.top       = `${y}px`;
      ball.style.transform = `translate(-50%,-50%) rotate(${rot}deg)`;
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        ball.remove();
        onLand();
      }
    };
    requestAnimationFrame(animate);
  },

  _catchBird(bird, tx, ty) {
    bird.caught = true;
    bird.ptsEl?.remove();

    const el = bird.el;
    if (!el) return;

    // Catch animation — shrink toward tap point then disappear
    el.style.transition = 'all 0.5s ease';
    el.style.left    = `${tx - bird.def.size/2}px`;
    el.style.top     = `${ty - bird.def.size/2}px`;
    el.style.opacity = '0';
    el.style.transform = 'scale(0.1)';

    // Points popup
    const pop = document.createElement('div');
    pop.className   = 'fdh-catch-pop';
    pop.textContent = `+${bird.def.pts} ⭐`;
    pop.style.cssText = `left:${tx}px;top:${ty - 20}px;`;
    this._field.appendChild(pop);
    setTimeout(() => pop.remove(), 900);

    // Shake ball effect
    const shakeBall = document.createElement('img');
    shakeBall.src = 'assets/pokeball.png';
    shakeBall.className = 'fdh-catch-ball';
    shakeBall.style.cssText = `left:${tx}px;top:${ty}px;`;
    this._field.appendChild(shakeBall);
    setTimeout(() => shakeBall.remove(), 900);

    setTimeout(() => el.remove(), 500);

    // Update score
    this._score += bird.def.pts;
    document.getElementById('fdh-score').textContent = `⭐ ${this._score}`;
    document.getElementById('challenge-intro').textContent =
      `Wave ${this._wave + 1}/3 — Score: ${this._score} — Need: ${this._passScore}`;
  },

  _showMiss(name) {
    // Falkner headshake — brief panel
    const miss = document.createElement('div');
    miss.className = 'fdh-miss-panel';
    miss.innerHTML = `<img src="assets/falkner.png" class="fdh-miss-portrait">
      <span>${name} escaped!</span>`;
    this._field.appendChild(miss);
    setTimeout(() => miss.remove(), 1200);
  },

  _finish() {
    if (this._animFrame) { cancelAnimationFrame(this._animFrame); this._animFrame = null; }
    const won     = this._score >= this._passScore;
    const perfect = this._missCount === 0;
    const gold    = won ? (perfect ? 30 : 20) : Math.max(5, Math.floor(this._score / 5));
    completeChallenge({
      screenClass: 'falkner-active', won,
      goldReward: gold,
      score: this._score, maxScore: Math.max(this._passScore, this._score), gameKey: 'falkner',
      tokenLabel: perfect ? 'Perfect Catch — enemy accuracy -40%!' : won ? 'Wind Sense — enemy accuracy -30%!' : null,
      effects: perfect ? { falknerPerfect: true } : won ? { falknerWind: true } : {},
      modalTitle: perfect ? '🎯 Perfect Catch!' : won ? '🎯 Good Work!' : '🎯 They Got Away...',
      modalBody: `⭐ ${this._score} pts · ${this._missCount} escaped\n+${gold}💰` +
        (perfect ? '\n\n⭐ Perfect! Enemy accuracy -40% next battle!' :
         won     ? '\n\n⭐ Wind Sense — enemy accuracy -30% next battle!' : ''),
    });
  },
};

// ─── WHITNEY ENGINE — "Whitney's Miltank Shake Bar" ──────────────────────────
// Players fill jugs to exact volumes and pick the right berry for shake orders.
// Plain orders: measure volume only. Shake orders: measure + pick berry.


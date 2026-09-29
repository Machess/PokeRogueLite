const WobbuffetEngine = {
  _isActive: false,
  _node:     null,
  _round:    0,
  _hits:     0,
  _sequence: [],
  _tier:     1,

  start(node) {
    this._isActive = true;
    this._node     = node;
    this._tier     = GameState.difficultyTier || 2;
    ActiveEngine.set(this);

    showScreen('boss');
    BossEngine._isRocket = false;

    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.style.background =
      'linear-gradient(180deg,#1a1040 0%,#2a1a5a 50%,#0e0620 100%)';
    const imgEl = document.querySelector('#screen-boss .battle-bg-img');
    if (imgEl) imgEl.style.opacity = '0';

    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';
    document.getElementById('boss-party-bar').innerHTML       = '';

    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (trainerImg) {
      trainerImg.src     = 'assets/wobbuffet.png';
      trainerImg.onerror = () => { trainerImg.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/202.png`; };
    }

    document.getElementById('dialogue-name').textContent = 'Wobbuffet';
    document.getElementById('dialogue-text').textContent = '';

    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) { startBtn.style.display = 'none'; startBtn.textContent = 'WOBBUFFET! ▶'; }
    document.getElementById('btn-dialogue-next').style.display = 'none';

    // ── Pokéball-burst reveal: ball shakes, pops, Wobbuffet appears + cry ─────
    this._playBallReveal(() => {
      const intro = "WOBBUFFET!! (Jessie's Poké Ball burst open again. Wobbuffet has appeared and is saluting the incoming attacks. Help it counter them all!)";
      typeBossIntro(intro, 18, () => {
        if (startBtn) startBtn.style.display = '';
      });
    });

    SoundEngine.playBGM('mini_game.mp3');
  },

  // Show a Pokéball that wobbles then bursts; Wobbuffet pops out as it does,
  // with the wobbuffet.mp3 cry. Calls onDone when the burst finishes.
  _playBallReveal(onDone) {
    const wrap       = document.getElementById('trainer-sprite-wrap');
    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (!wrap || !trainerImg) { if (onDone) onDone(); return; }

    // Hide Wobbuffet until the ball bursts
    trainerImg.style.visibility = 'hidden';

    // Remove any leftover ball from a previous run
    document.getElementById('wob-reveal-ball')?.remove();

    const ball = document.createElement('img');
    ball.id        = 'wob-reveal-ball';
    ball.src       = 'assets/pokeball.png';
    ball.className = 'wob-reveal-ball';
    ball.onerror   = () => { ball.textContent = '⚪'; };
    wrap.appendChild(ball);

    // Burst flash element
    const flash = document.createElement('div');
    flash.className = 'wob-reveal-flash';
    flash.id = 'wob-reveal-flash';
    wrap.appendChild(flash);

    // Sequence: drop+wobble (900ms) → cry + burst → reveal Wobbuffet
    MiniGameSession.later(() => {
      // Cry plays right as the ball opens
      SoundEngine.playSFX('wobbuffet.mp3', 0.9);
      ball.classList.add('wob-reveal-ball-burst');
      flash.classList.add('wob-reveal-flash-go');
      // Reveal Wobbuffet popping out
      MiniGameSession.later(() => {
        trainerImg.style.visibility = 'visible';
        trainerImg.classList.remove('wob-pop-in');
        void trainerImg.offsetWidth;        // restart animation
        trainerImg.classList.add('wob-pop-in');
      }, 120);
      // Clean up ball + flash, then continue to dialogue
      MiniGameSession.later(() => {
        ball.remove();
        flash.remove();
        if (onDone) onDone();
      }, 520);
    }, 900);
  },

  startGame() {
    this._isActive = false;
    ActiveEngine.clear();

    // Clear any leftover reveal state so it can't bleed into the battle/next boss
    document.getElementById('wob-reveal-ball')?.remove();
    document.getElementById('wob-reveal-flash')?.remove();
    const _ts = document.getElementById('boss-trainer-sprite');
    if (_ts) { _ts.classList.remove('wob-pop-in'); _ts.style.visibility = 'visible'; }

    // Build 5-round sequence — no repeat types in a row
    const pool = shuffle([...WOBBU_ATTACKS]);
    this._sequence = pool.slice(0, 5);
    this._round    = 0;
    this._hits     = 0;

    document.getElementById('trainer-intro').style.display = 'none';
    this._showRound();
  },

  _showRound() {
    const p     = this._round;
    if (p >= this._sequence.length) { this._finish(); return; }

    const attack = this._sequence[p];
    attack._resolved = false;
    const tier   = this._tier;

    // Build 3 or 4 answer choices depending on tier
    const numChoices = tier <= 1 ? 3 : 4;
    const wrong = shuffle(
      WOBBU_WRONG_POOL.filter(t => t !== attack.counter && t !== attack.type && getTypeMultiplier(t,attack.type)<=1)
    ).slice(0, numChoices - 1);
    const choices = shuffle([attack.counter, ...wrong]);

    // Build challenge screen
    const cv = setupChallengeScreen({
      portrait:    'assets/wobbuffet.png',
      badge:       '🛡️ Wobbu-Counter!',
      intro:       `Round ${p + 1}/5 — An attack is incoming!`,
      wrapClass:   'wobbu-wrap',
      screenClass: 'wobbu-active',
      bgm:         false,   // already playing
    });

    // Speed increases each round
    const timeLimit = tier <= 1 ? 0 : Math.max(4000, 6500 - p * 300);

    // Attack card slides in from right
    const attackCard = document.createElement('div');
    attackCard.className = 'wobbu-attack-card wobbu-slide-in';
    attackCard.innerHTML = `
      <div class="wobbu-attack-icon">${attack.icon}</div>
      <div class="wobbu-attack-type type-${attack.type}">${attack.type}</div>
      <div class="wobbu-attack-label">Incoming attack!</div>`;
    cv.appendChild(attackCard);

    // Wobbuffet salute sprite
    const salute = document.createElement('div');
    salute.className = 'wobbu-salute';
    salute.innerHTML = `<img src="assets/wobbuffet.png"
      onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/202.png'"
      class="wobbu-sprite pixel-sprite" alt="Wobbuffet">
      <div class="wobbu-speech">WOBBUFFET!</div>`;
    cv.appendChild(salute);

    // Timer bar (Tier 2+)
    let timerEl = null;
    let timerTimeout = null;
    let meterTick = null;
    let readyToCounter=false;
    const ready=document.createElement('button');ready.className='btn-pixel btn-primary';ready.textContent='Ready — incoming attack';ready.onclick=()=>{ready.remove();readyToCounter=true;
      if(timeLimit>0){timerEl=document.createElement('progress');timerEl.className='mg-charge-meter';timerEl.max=timeLimit;timerEl.value=timeLimit;cv.appendChild(timerEl);let left=timeLimit;meterTick=MiniGameSession.every(()=>{left-=100;timerEl.value=left;},100);timerTimeout=MiniGameSession.later(()=>{MiniGameSession.clearEvery(meterTick);this._answer(false,attack,null);},timeLimit);}
    };cv.appendChild(ready);

    // Choice hint (Tier 1 only: show "super effective against X")
    if (tier <= 1) {
      const hint = document.createElement('div');
      hint.className = 'wobbu-hint';
      hint.textContent = `What's super effective against ${attack.type}?`;
      cv.appendChild(hint);
    }

    // Answer buttons
    const btnRow = document.createElement('div');
    btnRow.className = 'wobbu-choices';
    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = `wobbu-choice-btn type-badge-btn type-${choice}`;
      btn.innerHTML = `<span class="wobbu-choice-type">${choice}</span>`;
      btn.addEventListener('click', () => {
        if(!readyToCounter)return;
        if (timerTimeout) MiniGameSession.clear(timerTimeout);
        if (meterTick) MiniGameSession.clearEvery(meterTick);
        this._answer(choice === attack.counter, attack, btn);
      });
      btnRow.appendChild(btn);
    });
    cv.appendChild(btnRow);

    // Score row
    const scoreRow = document.createElement('div');
    scoreRow.className = 'wobbu-score';
    scoreRow.innerHTML = Array.from({length: this._sequence.length}, (_, i) =>
      `<span class="wobbu-pip${i < p ? (this._sequence[i]._hit ? ' hit' : ' miss') : i === p ? ' current' : ''}">${
        i < p ? (this._sequence[i]._hit ? '✓' : '✗') : '●'
      }</span>`
    ).join('');
    cv.appendChild(scoreRow);
  },

  _answer(correct, attack, clickedBtn) {
    if(attack._resolved)return;attack._resolved=true;
    attack._hit = correct;
    if (correct) this._hits++;

    // Visual feedback
    const attackCard = document.querySelector('.wobbu-attack-card');
    const saluteEl   = document.querySelector('.wobbu-salute');
    if (correct) {
      if (attackCard) {
        attackCard.classList.remove('wobbu-slide-in');
        attackCard.classList.add('wobbu-countered');
      }
      if (saluteEl) saluteEl.classList.add('wobbu-bounce');
      if (clickedBtn) clickedBtn.classList.add('wobbu-correct');
    } else {
      if (attackCard) attackCard.classList.add('wobbu-hit');
      if (saluteEl) saluteEl.classList.add('wobbu-wobble');
      // Highlight the correct answer
      document.querySelectorAll('.wobbu-choice-btn').forEach(b => {
        if (b.querySelector('.wobbu-choice-type')?.textContent === attack.counter) {
          b.classList.add('wobbu-correct');
        }
      });
    }

    // Disable all buttons
    document.querySelectorAll('.wobbu-choice-btn').forEach(b => b.disabled = true);

    const explanation=document.createElement('p');explanation.className='mg-feedback';explanation.textContent=`${attack.counter} is super effective against ${attack.type}.`;document.getElementById('challenge-coin-visual').appendChild(explanation);
    MiniGameSession.next(() => {
      this._round++;
      this._showRound();
    });
  },

  _finish() {
    const hits    = this._hits;
    const total   = this._sequence.length;  // 5
    const perfect = hits === total;
    const bi      = GameState.bossesDefeated || 0;
    const gold    = perfect ? 20 + bi * 3 : hits >= 3 ? 10 + bi * 2 : 5;

    GameState.gold = (GameState.gold || 0) + gold;

    if (!GameState.pendingPlayerEffects) GameState.pendingPlayerEffects = {};
    if (perfect) {
      // Endorsement: enemy takes 20 reflected damage at battle start next fight
      GameState.pendingPlayerEffects.wobbuffetCounter = true;
      SoundEngine.playFanfare();
    } else if (hits === 0) {
      // Wobbuffet accidentally hits your party — minor chip damage
      GameState.pendingPlayerEffects.wobbuffetBackfire = true;
    }

    SoundEngine.stopBGM();
    document.getElementById('screen-challenge').classList.remove('wobbu-active');

    const title  = perfect ? '🛡️ Perfect Counter!' : '🛡️ Wobbu-Counter';
    const detail =
      (perfect ? '⭐ Wobbuffet Counter — enemy takes 20 reflected damage next battle!' : '') +
      (hits === 0 ? '😬 Wobbuffet accidentally hurt your party...' : '');

    showResultsCard({
      title, score: hits, maxScore: total, gold,
      won: hits >= 3, gameKey: 'wobbuffet',
      detail: detail || null,
      tokenLabel: perfect ? 'Wobbuffet Counter' : null,
      onDone: () => {
        if (this._onComplete) { const cb = this._onComplete; this._onComplete = null; cb(); }
        else { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); }
      },
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// JOHTO MINI-GAME ENGINES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── FALKNER ENGINE — "Flappy Pokémon" (Flappy Bird with flying Pokémon) ──────
// Player picks one of 3 random flying Pokémon fetched from PokéAPI.
// Navigate through pipe gaps by tapping. Collect coins. Hit wall = lose a life.
// 3 lives. Need 10 coins to pass. 15 pipes total scroll past.
// ─── FALKNER ENGINE — "Duck Hunt" style — catch escaped bird Pokémon ──────────
// Pokémon fly across the screen in waves. Tap to throw a Pokéball.
// Different species have different speeds, paths and point values.


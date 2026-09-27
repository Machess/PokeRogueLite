const NURSE_JOY_LINES = [
  "Welcome to the Pokémon Center! Let's get your team back to full health. ♥",
  "Your Pokémon look tired — leave them with me! They'll be good as new in no time.",
  "All patched up! Chansey and I will take good care of them. Come back any time!",
  "A trainer who rests their Pokémon is a trainer who wins! Here you go — all healed. ♥",
  "We hope to see you again soon… but stay safe out there, okay?",
  "There you are — rested and ready! Your Pokémon are happy to see you.",
  "Take a deep breath. Everyone's healthy again and raring to go! ♥",
  "Healing complete! Give them lots of love on your journey, won't you?",
];
// Lines for when the party was badly hurt before healing
const NURSE_JOY_LINES_HURT = [
  "Oh my, they were in rough shape! Good thing you stopped by. All better now. ♥",
  "That was a tough battle, wasn't it? Don't worry — they're fully recovered now.",
  "Goodness! Let's never let them get that hurt again. There — all healed up!",
];

const HealEngine = {
  _timers: [],

  start(node) {
    showScreen('heal');
    this._timers.forEach(t => clearTimeout(t));
    this._timers = [];

    const party = GameState.party;

    // Greeting line — context-aware if the party was badly hurt (read HP first)
    const totalHp = party.reduce((s, p) => s + (p.maxHp || 1), 0);
    const curHp   = party.reduce((s, p) => s + Math.max(0, p.hp || 0), 0);
    const hurtFrac = totalHp ? 1 - (curHp / totalHp) : 0;
    const greet = (hurtFrac >= 0.5 ? NURSE_JOY_LINES_HURT : NURSE_JOY_LINES)[
      Math.floor(Math.random() * (hurtFrac >= 0.5 ? NURSE_JOY_LINES_HURT : NURSE_JOY_LINES).length)];
    const speechEl = document.getElementById('heal-speech');
    if (speechEl) speechEl.textContent = greet;

    const joyEl = document.getElementById('heal-joy-portrait');
    if (joyEl) joyEl.style.display = '';
    const chanseyEl = document.getElementById('heal-chansey');
    if (chanseyEl) chanseyEl.style.display = '';

    // Background
    const healBg = document.getElementById('heal-bg');
    if (healBg) {
      healBg.style.background = 'linear-gradient(180deg,#fff0f4 0%,#ffe0e8 50%,#ffd0e0 100%)';
      const img = new Image();
      img.onload = () => { healBg.style.background = `url('assets/backgrounds/bg_heal.png') center center / cover no-repeat`; };
      img.src = 'assets/backgrounds/bg_heal.png';
    }

    // Sparkles
    const field = document.getElementById('heal-sparkles');
    if (field) {
      field.innerHTML = '';
      for (let i = 0; i < 30; i++) {
        const s = document.createElement('div');
        s.className = 'sparkle';
        s.style.left = Math.random() * 100 + '%';
        s.style.top  = Math.random() * 100 + '%';
        s.style.animationDuration = (1 + Math.random() * 2) + 's';
        s.style.animationDelay = (Math.random() * 2) + 's';
        s.style.width = s.style.height = (2 + Math.random() * 4) + 'px';
        field.appendChild(s);
      }
    }

    const finishBtn = document.getElementById('btn-heal-finish');
    if (finishBtn) finishBtn.style.display = 'none';

    // ── Build the healing machine: a dome with one slot per party member ────
    const machine = document.getElementById('heal-machine');
    const n = party.length;
    machine.className = 'heal-machine' + (n >= 5 ? ' heal-machine-compact' : '');
    machine.innerHTML = `
      <div class="heal-machine-dome"></div>
      <div class="heal-machine-body">
        <div class="heal-slots" id="heal-slots"></div>
      </div>`;
    const slots = document.getElementById('heal-slots');
    party.forEach((p, i) => {
      const slot = document.createElement('div');
      slot.className = 'heal-slot';
      slot.innerHTML = `
        <img class="heal-slot-poke" src="${p.spriteUrl}" alt="${p.name}"
             onerror="this.src='assets/sprites/${p.id}.png'"/>
        <img class="heal-slot-ball" src="assets/pokeball.png"
             onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'heal-slot-ball-emoji',textContent:'🔴'}))"/>
        <div class="heal-slot-light"></div>`;
      slots.appendChild(slot);
    });
    // Hide the old static party grid (machine replaces it)
    const partyEl = document.getElementById('heal-party');
    if (partyEl) partyEl.innerHTML = '';

    const slotEls = Array.from(slots.querySelectorAll('.heal-slot'));

    // ── Animation sequence ──────────────────────────────────────────────────
    // 1) Recall: each Pokémon shrinks into its ball, staggered
    slotEls.forEach((el, i) => {
      this._timers.push(setTimeout(() => el.classList.add('heal-recall'), 300 + i * 220));
    });

    const recallDone = 300 + n * 220 + 300;

    // 2) Balls + dome lights blink in a sweep while the healing jingle plays
    this._timers.push(setTimeout(() => {
      machine.classList.add('heal-blinking');
      slotEls.forEach((el, i) => {
        el.style.setProperty('--blink-delay', (i * 0.18) + 's');
        el.classList.add('heal-blink');
      });
      SoundEngine.playRecovery();
      this._timers.push(setTimeout(() => SoundEngine.playRecovery(), 1400));
    }, recallDone));

    const blinkDur = 2600;

    // 3) Heal the party (do the actual restore mid-blink)
    this._timers.push(setTimeout(() => {
      party.forEach(p => { p.hp = p.maxHp; });
      saveGame();
    }, recallDone + 600));

    // 4) Final flash, then release Pokémon at full HP
    this._timers.push(setTimeout(() => {
      machine.classList.remove('heal-blinking');
      machine.classList.add('heal-flash');
      slotEls.forEach(el => { el.classList.remove('heal-blink'); });
    }, recallDone + blinkDur));

    this._timers.push(setTimeout(() => {
      machine.classList.remove('heal-flash');
      slotEls.forEach((el, i) => {
        this._timers.push(setTimeout(() => {
          el.classList.remove('heal-recall');
          el.classList.add('heal-release');
        }, i * 160));
      });
    }, recallDone + blinkDur + 250));

    // 5) Completion line + Continue button
    this._timers.push(setTimeout(() => {
      if (speechEl) speechEl.textContent = "Your Pokémon are all healed! We hope to see you again! ♥";
      if (finishBtn) { finishBtn.style.display = ''; finishBtn.classList.add('heal-btn-in'); }
    }, recallDone + blinkDur + 250 + n * 160 + 400));
  },

  finish() {
    this._timers.forEach(t => clearTimeout(t));
    this._timers = [];
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },
};

// ─── EVOLVE ENGINE ───────────────────────────────────────────────────────────

const EvolveEngine = {

  // Returns a Promise that resolves only when the player taps Continue
  run(beforeId, afterId, narrative, cb) {
    // Store callback — resolved by Game.afterEvolve() when button pressed
    this._cb = cb;

    return new Promise(async (resolve) => {
      showLoading();
      let before, after;
      try {
        [before, after] = await Promise.all([fetchPoke(beforeId), fetchPoke(afterId)]);
      } catch(e) {
        hideLoading();
        // On API failure, still call the callback so the game doesn't freeze
        if (cb) cb();
        resolve();
        return;
      }
      hideLoading();

      const beforeName = capitalize(before.name);
      const afterName  = capitalize(after.name);

      document.getElementById('evolve-before').src = getSpriteUrl(before);
      document.getElementById('evolve-after').src  = getSpriteUrl(after);
      document.getElementById('evolve-narrative').textContent = narrative || '';
      document.getElementById('evolve-text').textContent = `${beforeName} is evolving…`;
      document.getElementById('btn-evolve-continue').style.display = 'none';
      document.getElementById('evolve-after').className = 'evolve-sprite after';

      // Particles
      const partsEl = document.getElementById('evolve-particles');
      partsEl.innerHTML = '';
      for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = 'evo-particle';
        const size = 4 + Math.random() * 10;
        p.style.cssText = `
          width:${size}px; height:${size}px;
          left:${Math.random()*100}%;
          background:hsl(${40+Math.random()*40},100%,${60+Math.random()*30}%);
          animation-duration:${2+Math.random()*3}s;
          animation-delay:${Math.random()*2}s;
        `;
        partsEl.appendChild(p);
      }

      // After 3s reveal the evolved form — player must press Continue to proceed
      setTimeout(() => {
        document.getElementById('evolve-after').className = 'evolve-sprite after show';
        document.getElementById('evolve-text').textContent = `${beforeName} evolved into ${afterName}!`;
        const btn = document.getElementById('btn-evolve-continue');
        btn.style.display = 'inline-block';
        // Wire the resolve to the continue button so the Promise waits here
        this._resolve = resolve;
      }, 3000);
    });
  },
};

// afterEvolve is called by the Continue button on the evolve screen
Game.afterEvolve = function() {
  // Resolve the waiting Promise so runEvolutions' await completes
  if (EvolveEngine._resolve) {
    const resolve = EvolveEngine._resolve;
    EvolveEngine._resolve = null;
    resolve();
  }
  // Also call the direct callback (used by boss path)
  if (EvolveEngine._cb) {
    const cb = EvolveEngine._cb;
    EvolveEngine._cb = null;
    cb();
  }
};

// ─── VICTORY ENGINE ──────────────────────────────────────────────────────────

// Complete Kanto+Johto type map — all 251 Pokémon, no network needed

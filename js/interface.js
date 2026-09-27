const ActiveEngine = {
  _current: null,
  set(engine)  { this._current = engine; },
  clear()      { this._current = null; },
  // Called by btn-start-boss-battle — dispatches to registered engine or falls
  // through to TrainerBattle / RocketBattle / BossEngine as before.
  go() {
    if (this._current && typeof this._current.startGame === 'function') {
      this._current.startGame();
      return true;
    }
    if (this._current) this._current = null; // stale non-minigame engine — clear it
    return false;
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

// Shared boss-screen intro — all mini-game engines use this instead of
// repeating 20 identical lines of DOM setup.
// opts: { gymIndex, portrait, name, introText, btnLabel, onReady }
// Track the active intro typewriter so a new call can always cancel the old one
// ── fitText — shrink an element's font just enough that its text fits on one
// line within its box. Keeps short names at full size; only long names shrink.
// Call after the element is in the DOM. minPx guards against illegibly small text.
function fitText(el, minPx = 7) {
  if (!el) return;
  // Reset to CSS-defined size first
  el.style.fontSize = '';
  const parentW = el.clientWidth || el.offsetWidth;
  if (!parentW) return;
  let size = parseFloat(getComputedStyle(el).fontSize);
  // Shrink until the text no longer overflows its own width
  let guard = 24;
  while (el.scrollWidth > el.clientWidth && size > minPx && guard-- > 0) {
    size -= 0.5;
    el.style.fontSize = size + 'px';
  }
}

function fitAllText(selector, root = document) {
  root.querySelectorAll(selector).forEach(el => fitText(el));
}

let _bossIntroInterval = null;

// Shared cancellable typewriter for any boss-screen intro dialogue.
// Cancels any in-flight intro first so stale text can never bleed across screens.
// Returns nothing; wires tap-to-skip on #trainer-intro automatically.
function typeBossIntro(text, speed, onDone) {
  if (_bossIntroInterval) { clearInterval(_bossIntroInterval); _bossIntroInterval = null; }
  const el = document.getElementById('dialogue-text');
  if (el) el.textContent = '';
  let ci = 0;
  const finish = () => {
    if (_bossIntroInterval) { clearInterval(_bossIntroInterval); _bossIntroInterval = null; }
    if (el) el.textContent = text;
    if (onDone) onDone();
  };
  _bossIntroInterval = setInterval(() => {
    const d = document.getElementById('dialogue-text');
    if (!d) { clearInterval(_bossIntroInterval); _bossIntroInterval = null; return; }
    d.textContent += text[ci++];
    if (ci >= text.length) finish();
  }, speed || 22);
  const wrap = document.getElementById('trainer-intro');
  if (wrap) wrap.onclick = () => finish();
}

function showBossIntro(opts) {
  // Cancel any still-running typewriter from a previous intro
  if (_bossIntroInterval) { clearInterval(_bossIntroInterval); _bossIntroInterval = null; }

  // Fire-and-forget preload of portrait + pokeball — typewriter gives them ~3s to land
  preloadImages([`assets/${opts.portrait}`, 'assets/pokeball.png']);

  showScreen('boss');
  BossEngine._isRocket = false;

  const gymData     = getGymData();                    // region-aware: Kanto or Johto
  const gymFallbacks = gymData.map(g => g.bgFallback);
  const idx         = opts.gymIndex ?? 0;

  const bgEl  = document.querySelector('#screen-boss .battle-bg');
  const imgEl = document.querySelector('#screen-boss .battle-bg-img');
  if (bgEl) {
    bgEl.classList.add('boss-intro-mode');
    bgEl.style.background = gymFallbacks[idx] || gymFallbacks[0] || '';
    if (imgEl) {
      imgEl.style.opacity = '0';
      imgEl.onload  = () => { imgEl.style.opacity = '1'; bgEl.style.background = ''; };
      imgEl.onerror = () => { imgEl.style.opacity = '0'; };
      const bgFile = gymData[idx]?.bgImage;
      imgEl.src = bgFile ? `assets/backgrounds/${bgFile}` : '';
    }
  }

  document.getElementById('trainer-intro').style.display    = 'flex';
  document.getElementById('boss-battle-area').style.display = 'none';
  document.getElementById('boss-party-bar').innerHTML       = '';

  const trainerImg = document.getElementById('boss-trainer-sprite');
  if (trainerImg) trainerImg.src = `assets/${opts.portrait}`;
  document.getElementById('dialogue-name').textContent = opts.name;
  document.getElementById('dialogue-text').textContent = '';

  // Optional character cry/sound played as the intro appears (like Wobbuffet)
  if (opts.cry) SoundEngine.playSFX(opts.cry, opts.cryVol ?? 0.8);

  const startBtn = document.getElementById('btn-start-boss-battle');
  if (startBtn) { startBtn.style.display = 'none'; startBtn.textContent = opts.btnLabel || 'Begin ▶'; }
  document.getElementById('btn-dialogue-next').style.display = 'none';

  // Typewriter — stored globally so next call can cancel it
  let ci = 0;
  const finishIntro = () => {
    if (_bossIntroInterval) { clearInterval(_bossIntroInterval); _bossIntroInterval = null; }
    const dialogueEl = document.getElementById('dialogue-text');
    if (dialogueEl) dialogueEl.textContent = opts.introText;
    if (startBtn) startBtn.style.display = '';
    if (opts.onReady) opts.onReady(startBtn);
  };
  _bossIntroInterval = setInterval(() => {
    const dialogueEl = document.getElementById('dialogue-text');
    if (!dialogueEl) { clearInterval(_bossIntroInterval); _bossIntroInterval = null; return; }
    dialogueEl.textContent += opts.introText[ci++];
    if (ci >= opts.introText.length) finishIntro();
  }, 22);

  // A5 — tap anywhere on the intro to skip the typewriter
  const introWrap = document.getElementById('trainer-intro');
  if (introWrap) introWrap.onclick = () => { if (_bossIntroInterval) finishIntro(); };

  // A1 — best-score chip on the intro (gameKey derived from portrait filename)
  const gameKey = (opts.gameKey || opts.portrait || '').replace(/\.(png|jpg)$/,'').replace('assets/','');
  try {
    const all  = JSON.parse(localStorage.getItem(_bestScoresKey()) || '{}');
    const best = all[gameKey];
    let chip = document.getElementById('intro-best-chip');
    if (best !== undefined) {
      if (!chip) {
        chip = document.createElement('div');
        chip.id = 'intro-best-chip';
        chip.className = 'intro-best-chip';
        introWrap?.appendChild(chip);
      }
      chip.textContent = `🏆 Best: ${best}`;
      chip.style.display = '';
    } else if (chip) {
      chip.style.display = 'none';
    }
  } catch(_) {}
}

// Shared challenge screen setup — all mini-game engines call this at the
// start of their main game view instead of repeating 15 identical DOM lines.
// opts: { portrait, badge, intro, wrapClass, screenClass, bgm, coinVisualEl? }
function setupChallengeScreen(opts) {
  const charImg = document.getElementById('challenge-character-img');
  if (charImg && opts.portrait) {
    // Support both bare filenames ('falkner.png') and full paths ('assets/falkner.png')
    const src = opts.portrait.startsWith('assets/') || opts.portrait.startsWith('http')
      ? opts.portrait
      : `assets/${opts.portrait}`;
    charImg.src = src;
    charImg.style.display = '';
  }

  document.getElementById('challenge-badge').textContent            = opts.badge  || '';
  document.getElementById('challenge-intro').textContent            = opts.intro  || '';
  document.getElementById('challenge-result').style.display         = 'none';
  document.getElementById('challenge-continue-btn').style.display   = 'none';
  document.getElementById('challenge-question').style.display       = 'none';
  document.getElementById('challenge-answer-btns').innerHTML        = '';

  const jwd = document.getElementById('jessie-word-display');
  if (jwd) { jwd.style.display = 'none'; jwd.innerHTML = ''; jwd.className = 'jessie-word-display'; }

  const cv = document.getElementById('challenge-coin-visual');
  cv.style.display = 'block';
  cv.className     = opts.wrapClass || 'challenge-coin-visual';
  cv.innerHTML     = '';

  showScreen('challenge');
  const scr = document.getElementById('screen-challenge');
  scr.classList.remove(...CHALLENGE_CLASSES);
  if (opts.screenClass) scr.classList.add(opts.screenClass);

  if (opts.bgm !== false) SoundEngine.playBGM(opts.bgm || 'mini_game.mp3');

  // ── Universal quit button — forfeits gracefully back to the map ───────────
  let quitBtn = document.getElementById('mg-quit-btn');
  if (!quitBtn) {
    quitBtn = document.createElement('button');
    quitBtn.id = 'mg-quit-btn';
    quitBtn.className = 'mg-quit-btn';
    quitBtn.textContent = '✕';
    quitBtn.title = 'Quit mini-game';
    scr.appendChild(quitBtn);
  }
  quitBtn.style.display = '';
  quitBtn.onclick = () => {
    showModal('Quit mini-game?', 'You can come back to the map,\nbut this challenge counts as skipped.', () => {
      SoundEngine.stopBGM();
      scr.classList.remove(...CHALLENGE_CLASSES);
      quitBtn.style.display = 'none';
      if (GameState?.currentNodeIndex != null) {
        MapEngine.completeNode(GameState.currentNodeIndex);
      }
      MapEngine.show();
    }, true);   // true → show a cancel option if supported
  };

  // ── Rules chip — re-shows the one-line rule for the current game ──────────
  let rulesChip = document.getElementById('mg-rules-chip');
  if (!rulesChip) {
    rulesChip = document.createElement('button');
    rulesChip.id = 'mg-rules-chip';
    rulesChip.className = 'mg-rules-chip';
    rulesChip.textContent = '?';
    rulesChip.title = 'How to play';
    scr.appendChild(rulesChip);
  }
  if (opts.rule || opts.intro) {
    rulesChip.style.display = '';
    const ruleText = opts.rule || opts.badge || '';
    rulesChip.onclick = () => {
      const tip = document.createElement('div');
      tip.className = 'mg-rule-tip';
      tip.textContent = MG_RULES[opts.screenClass] || ruleText;
      scr.appendChild(tip);
      setTimeout(() => tip.remove(), 2600);
    };
  } else {
    rulesChip.style.display = 'none';
  }

  return cv;   // return cv so caller can append children immediately
}

// One-line rules per mini-game screen class — shown by the "?" chip
const MG_RULES = {
  'falkner-active':  'Tap a flying Pokémon to throw a Pokéball at it!',
  'bugsy-active':    'Find and tap the Pokémon shown at the top!',
  'whitney-active':  'Pour jugs to hit the exact target line — then pick the berry!',
  'morty-active':    'Flip cards and match the ghost pairs!',
  'jasmine-active':  'Watch the anvils flash, then repeat the pattern!',
  'pryce-active':    'Count how many of each shape there are to reveal the sculpture!',
  'clair-active':    'Tap the type that beats the incoming dragon!',
  'chuck-active':    'Read the time and set the clock for Chuck!',
  'togepi-active':   'Work out how long Togepi froze time — the elapsed duration!',
  'oak-active':      'Tap the basket each Pokémon belongs in!',
  'snorlax-active':  'Compare weights and balance the scale!',
  'rocketmoney-active': 'Count the coins to pay the exact amount!',
  'jenny-active':    'Read the police report, then tap the matching Pokémon!',
  'runner-active':   'Tap or press Space to jump over the holes. Grab coins. Reach the goal!',
  'wobbu-active':    'Tap the super-effective counter before the attack lands!',
};

// Shared finish flow — applies effects, awards gold, shows modal, returns to map.
// opts: { screenClass, won, goldReward, effects?, statuses?,
//         modalTitle, modalBody, onComplete? }
function completeChallenge(opts) {
  SoundEngine.stopBGM();

  // Hide mini-game chrome
  const qb = document.getElementById('mg-quit-btn');   if (qb) qb.style.display = 'none';
  const rc = document.getElementById('mg-rules-chip'); if (rc) rc.style.display = 'none';

  // Clean up screen class
  if (opts.screenClass) {
    document.getElementById('screen-challenge').classList.remove(opts.screenClass);
  }
  const cv = document.getElementById('challenge-coin-visual');
  cv.innerHTML = ''; cv.className = 'challenge-coin-visual';

  // Apply effects
  if (opts.effects && Object.keys(opts.effects).length > 0) {
    if (!GameState.pendingPlayerEffects) GameState.pendingPlayerEffects = {};
    Object.assign(GameState.pendingPlayerEffects, opts.effects);
  }
  if (opts.statuses && opts.statuses.length > 0) {
    if (!GameState.pendingPlayerStatuses) GameState.pendingPlayerStatuses = [];
    GameState.pendingPlayerStatuses.push(...opts.statuses);
  }

  // Award gold
  if (opts.goldReward) GameState.gold = (GameState.gold || 0) + opts.goldReward;

  if (opts.won) SoundEngine.playFanfare();

  // Adaptive difficulty — record this result and nudge the skill's tier
  if (opts.gameKey && opts.score !== undefined && opts.maxScore) {
    recordSkillResult(opts.gameKey, opts.score, opts.maxScore);
  }

  saveGame();

  const finish = () => {
    if (opts.onComplete) opts.onComplete();
    else { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); }
  };

  // A6 — structured results card when score data is provided; legacy modal otherwise
  if (opts.score !== undefined && opts.maxScore !== undefined) {
    showResultsCard({
      title:      opts.modalTitle,
      score:      opts.score,
      maxScore:   opts.maxScore,
      gold:       opts.goldReward || 0,
      tokenLabel: opts.tokenLabel || null,
      won:        opts.won,
      gameKey:    opts.gameKey || null,
      onDone:     finish,
    });
  } else {
    // Legacy callers (no score data) — still get the card, stars derived from won
    showResultsCard({
      title:  opts.modalTitle,
      detail: opts.modalBody,
      gold:   opts.goldReward || 0,
      won:    opts.won,
      onDone: finish,
    });
  }
}

// ─── GAMESTATE ACCESSORS ─────────────────────────────────────────────────────
// Thin helpers to avoid repeating GameState.party[GameState.activePokemonIndex]
// and defensive defaults throughout the codebase.
function getActivePokemon()  { return GameState.party?.[GameState.activePokemonIndex] ?? null; }
function getParty()          { return GameState.party ?? []; }
function getTier()           { return GameState.difficultyTier ?? 2; }

// ─── ADAPTIVE PER-SKILL DIFFICULTY ───────────────────────────────────────────
// The age-derived difficultyTier is the STARTING anchor. Each theoretical skill
// then drifts up or down (within 1-3) based on a rolling success rate, so a child
// can be advanced at counting but still building elapsed-time, etc. Reflex/timing
// games are intentionally excluded — they stay on the base age tier.
const SKILL_OF_GAME = {
  togepi: 'time',     chuck: 'time',
  giovanni: 'money',
  pryce: 'counting',
  oak: 'sorting',
  snorlax: 'comparison',
  brock: 'math',      cooking: 'math',
  misty: 'reading',   fishing: 'reading',
  bugsy: 'spelling',  james: 'spelling',
  whitney: 'spelling',
  // (reflex/timing games like runner, falkner, wobbuffet are NOT listed — they
  //  use the base age tier and never adapt)
};
const ADAPTIVE_SKILLS = ['time','money','counting','sorting','comparison','math','reading','spelling'];

// Ensure the per-profile skill table exists, seeded from the age tier.
function _ensureSkillLevels() {
  if (!GameState.skillLevels) GameState.skillLevels = {};
  const anchor = GameState.difficultyTier || 2;
  ADAPTIVE_SKILLS.forEach(sk => {
    if (!GameState.skillLevels[sk]) {
      GameState.skillLevels[sk] = { tier: anchor, recent: [], played: 0 };
    }
  });
  return GameState.skillLevels;
}

// The tier an engine should use for its questions. Theoretical games pass their
// gameKey; anything unmapped falls back to the base age tier.
function getSkillTier(gameKey) {
  const skill = SKILL_OF_GAME[gameKey];
  if (!skill) return GameState.difficultyTier ?? 2;
  const levels = _ensureSkillLevels();
  return levels[skill]?.tier ?? (GameState.difficultyTier ?? 2);
}

// Record one mini-game result and adapt that skill's tier. Called from
// completeChallenge with the gameKey + score/maxScore it already receives.
function recordSkillResult(gameKey, score, maxScore) {
  const skill = SKILL_OF_GAME[gameKey];
  if (!skill || !maxScore) return;
  const levels = _ensureSkillLevels();
  const s = levels[skill];
  const ratio = score / maxScore;
  s.recent.push(ratio >= 0.6 ? 1 : 0);
  if (s.recent.length > 6) s.recent.shift();
  s.played = (s.played || 0) + 1;
  s.lastRatio = ratio;

  // Lifetime accuracy (for the parent dashboard) — running totals
  s.totalScore = (s.totalScore || 0) + score;
  s.totalMax   = (s.totalMax || 0) + maxScore;
  s.lastPlayed = Date.now();

  // Response speed: average seconds-per-question, derived from how long the
  // whole mini-game took divided by the number of questions (maxScore). Rolled
  // into a lifetime average so the dashboard can show "thinks quickly / takes
  // their time" without needing per-answer instrumentation in every engine.
  let gameMs = 0;
  if (_skillGameStart && maxScore > 0) {
    const elapsed = Date.now() - _skillGameStart;
    if (elapsed > 500 && elapsed < 600000) {            // ignore idle/away outliers
      gameMs = Math.round(elapsed / maxScore);
      s.avgMs = s.avgMs ? Math.round(s.avgMs * 0.7 + gameMs * 0.3) : gameMs;
    }
  }
  _skillGameStart = 0;

  // Per-play history log (for the parent dashboard graphs). One small record per
  // game: timestamp, the tier it was PLAYED at, accuracy, and ms-per-question.
  // Capped so localStorage never bloats but keeps a long overview window.
  if (!s.log) s.log = [];
  s.log.push({ t: Date.now(), tier: s.tier, acc: Math.round(ratio * 100), ms: gameMs || null });
  if (s.log.length > 60) s.log.shift();   // keep ~60 plays (≥50 requested)

  // Need at least 3 plays before adapting, and a streak (hysteresis) to move —
  // so a single good/bad game never yo-yos the difficulty.
  if (s.recent.length >= 3) {
    const last4 = s.recent.slice(-4);
    const passes = last4.reduce((a, b) => a + b, 0);
    if (last4.length >= 3 && passes === last4.length && ratio >= 0.8 && s.tier < 3) {
      s.tier++;                      // promote: aced the recent streak
      s._justChanged = 'up';
      s.recent = [];                 // new tier earns its own fresh streak
    } else if (last4.length >= 3 && passes <= Math.floor(last4.length / 3) && s.tier > 1) {
      s.tier--;                      // ease: struggling on the recent streak
      s._justChanged = 'down';
      s.recent = [];
    } else {
      s._justChanged = null;
    }
  }
}

// Timing: when an adaptive mini-game's intro/first round begins, stamp the start.
// Used to derive average response speed for the parent dashboard.
let _skillGameStart = 0;
function skillTimerBegin(gameKey) {
  _skillGameStart = SKILL_OF_GAME[gameKey] ? Date.now() : 0;
}

function getBossCount()      { return GameState.bossesDefeated ?? 0; }
function getGold()           { return GameState.gold ?? 0; }
function addGold(amount)     { GameState.gold = getGold() + amount; }
function getTrainerName()    { return GameState.trainerName || 'Trainer'; }

const FADE_EXIT_MS  = 180; // fade-out duration
const FADE_ENTER_MS = 220; // fade-in duration (map return uses 300ms)

function showScreen(id, _direction) {
  const incoming=document.getElementById('screen-'+id);if(!incoming)return;
  clearTimeout(showScreen._exitTimer);clearTimeout(showScreen._enterTimer);
  const outgoing=document.querySelector('.screen.active');
  SoundEngine.onScreenChange(id);SoundEngine.stopSpeech();
  document.querySelectorAll('.screen').forEach(el=>el.classList.remove('screen-fading-in','screen-fading-out'));
  const enter=()=>{document.querySelectorAll('.screen').forEach(el=>el.classList.remove('active'));incoming.classList.add('active','screen-fading-in');
    showScreen._enterTimer=setTimeout(()=>incoming.classList.remove('screen-fading-in'),FADE_ENTER_MS);};
  if(!outgoing||outgoing===incoming){enter();return;}
  outgoing.classList.add('screen-fading-out');showScreen._exitTimer=setTimeout(enter,FADE_EXIT_MS);
}

// ─── SOUND ENGINE ─────────────────────────────────────────────────────────────

const SoundEngine = {
  _bgm: null,         // single BGM Audio node — only one ever exists
  _bgmSrc: '',        // src currently playing
  _sfxNode: null,     // single SFX node — replaced on each play, no stacking
  _sfxDebounce: null, // debounce timer for rapid hover events on mobile
  _muted: false,
  _bgmVolume: 0.45,
  _sfxVolume: 0.7,

  _path(file) { return `assets/sounds/${file}`; },

  _bgmMap: {
    'register':  'pallet_town_theme.mp3',
    'intro':     'pallet_town_theme.mp3',
    // 'challenge' is intentionally absent — each engine sets its own track explicitly
    'start':     'poke_intro.mp3',
    'starter':   'pallet_town_theme.mp3',
    'map':       'pallet_town_theme.mp3',
    'battle':    'opening.mp3',
    'boss':      'gym_battle.mp3',
    'heal':      'pokemon_center.mp3',
    'catch':     'catch.mp3',
    'training':  'training.mp3',
    'shop':      'shop.mp3',
    'evolve':    'pallet_town_theme.mp3',
    'cooking':   'pallet_town_theme.mp3',
    'victory':   'poke_intro.mp3',
    'gameover':  null,
    'pokedex':   'pokedex.mp3',
  },

  // Immediately silence the current BGM — no async fade that causes overlap
  _hardStop() {
    if (!this._bgm) return;
    try { this._bgm.pause(); this._bgm.currentTime = 0; } catch(e) {}
    this._bgm    = null;
    this._bgmSrc = '';
  },

  // Play a looping BGM. Same track already playing → no-op. New track → hard-stop then start.
  playBGM(file) {
    if (!file) { this._hardStop(); return; }
    const src = this._path(file);
    if (this._bgmSrc === src && this._bgm && !this._bgm.paused) return;
    this._hardStop();                           // kill old track before starting new one
    if (this._muted) { this._bgmSrc = src; return; }
    const audio = new Audio(src);
    audio.loop   = true;
    audio.volume = this._bgmVolume;
    audio.play().catch(() => {});
    this._bgm    = audio;
    this._bgmSrc = src;
  },

  stopBGM() { this._hardStop(); },

  stopSFX() {
    if (this._sfxNode) {
      try { this._sfxNode.pause(); this._sfxNode.currentTime = 0; } catch(e) {}
      this._sfxNode = null;
    }
    if (this._sfxDebounce) { clearTimeout(this._sfxDebounce); this._sfxDebounce = null; }
  },

  // Play a one-shot SFX. Kills any in-progress SFX first so sounds never stack.
  playSFX(file, volume) {
    if (this._muted) return;
    try {
      if (this._sfxNode) {
        try { this._sfxNode.pause(); this._sfxNode.currentTime = 0; } catch(e) {}
        this._sfxNode = null;
      }
      const audio = new Audio(this._path(file));
      audio.volume = volume ?? this._sfxVolume;
      // Missing files (404) must never break game flow
      audio.addEventListener('error', () => { if (this._sfxNode === audio) this._sfxNode = null; });
      const p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      this._sfxNode = audio;
      audio.addEventListener('ended', () => { if (this._sfxNode === audio) this._sfxNode = null; });
    } catch (e) {
      // Swallow any synchronous audio errors — sound is never critical
    }
  },

  // Debounced SFX — ignores rapid repeated calls within delay ms (mobile hover spam)
  playSFXDebounced(file, volume, delay = 100) {
    if (this._sfxDebounce) clearTimeout(this._sfxDebounce);
    this._sfxDebounce = setTimeout(() => {
      this.playSFX(file, volume);
      this._sfxDebounce = null;
    }, delay);
  },

  onScreenChange(screenId) {
    if (screenId === 'gameover') {
      this._hardStop();
      setTimeout(() => this.playSFX('teamrocket_show.mp3', 0.6), 150);
      return;
    }
    // Johto BGM — start screen uses profile flag (GameState not available there)
    // map screen uses GameState.region (GameState always exists during a run)
    if (screenId === 'start') {
      const profiles    = loadProfiles?.();
      const activeKey   = getActiveProfile?.();
      const meta        = profiles?.find(p => p.key === activeKey);
      const isJohto     = !!(meta?.leagueUnlocked && meta?.johtoUnlocked);
      this.playBGM(isJohto ? 'johto_bg.mp3' : 'poke_intro.mp3');
      return;
    }
    if (screenId === 'map' && GameState?.region === 'johto') {
      this.playBGM('johto_map_bg.mp3');
      return;
    }
    const track = this._bgmMap[screenId];
    if (track !== undefined) this.playBGM(track);
  },

  playStarterCry(starterId) {
    const cryMap = { 1: 'bulbasaur.mp3', 4: 'charmander.mp3', 7: 'squirtle.mp3', 25: 'pikachu.mp3', 133: 'eevee.mp3', 151: 'mew.mp3', 152: 'chikorita.wav', 155: 'cyndaquil.wav', 158: 'totodile.wav' };
    const file = cryMap[starterId];
    if (file) this.playSFXDebounced(file, 0.8);
  },

  playFanfare()  { this.playSFX('fanfare_item_get.mp3', 0.65); },

  // ── D5: universal tap blip — Web Audio square chirp, no asset needed ──────
  _audioCtx: null,
  playTap() {
    if (this._muted) return;
    try {
      if (!this._audioCtx) this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx  = this._audioCtx;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.connect(gain).connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.08);
    } catch (_) {}
  },
  playRecovery() { this.playSFX('pokemon_recovery.mp3', 0.7); },

  // Synthesized success chime — a rising two-note arpeggio. Used where a
  // 'correct' sound is wanted without depending on an audio file.
  playCorrect() {
    if (this._muted) return;
    try {
      if (!this._audioCtx) this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this._audioCtx;
      const notes = [660, 880, 1175];   // E5 → A5 → D6
      notes.forEach((f, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const t = ctx.currentTime + i * 0.08;
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.2);
      });
    } catch (_) {}
  },
  // ── Pokédex voice — Web Speech API ────────────────────────────────────────
  _dexVoice: null,
  _voicesReady: false,

  _initVoices() {
    if (this._voicesReady) return;
    const pick = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      // Prefer robotic/clear voices by name — order matters
      const preferred = ['Daniel', 'Google UK English Male', 'Fred',
                         'Google US English', 'Alex', 'English United States'];
      for (const name of preferred) {
        const v = voices.find(v => v.name.includes(name));
        if (v) { this._dexVoice = v; break; }
      }
      if (!this._dexVoice && voices.length) this._dexVoice = voices[0];
      this._voicesReady = true;
    };
    if (window.speechSynthesis?.getVoices().length) {
      pick();
    } else {
      window.speechSynthesis?.addEventListener('voiceschanged', pick, { once: true });
    }
  },

  speakPokedex(name, category, flavour) {
    if (!window.speechSynthesis) return;
    if (this._muted) return;
    this._initVoices();
    window.speechSynthesis.cancel();   // stop any previous speech

    // Build the full script: "Name. The X Pokémon. Flavour text."
    const catText    = category ? `The ${category}.` : '';
    const flavText   = flavour  ? flavour.replace(/[\n\f\r]/g,' ').replace(/\s+/g,' ').trim() : '';
    const fullScript = [name, catText, flavText].filter(Boolean).join('  ');

    const utter = new SpeechSynthesisUtterance(fullScript);
    if (this._dexVoice) utter.voice = this._dexVoice;
    utter.rate  = 0.82;
    utter.pitch = 1.1;
    utter.volume = 0.9;
    window.speechSynthesis.speak(utter);
  },

  stopSpeech() {
    window.speechSynthesis?.cancel();
  },

  toggleMute() {
    this._muted = !this._muted;
    if (this._bgm) this._bgm.volume = this._muted ? 0 : this._bgmVolume;
    return this._muted;
  },
};

// ── Asset preloader — resolves when all images are decoded (or errored) ──────
// Usage: await preloadImages(['assets/falkner.png', spriteUrl, ...])
function preloadImages(urls) {
  return Promise.all(
    (urls || []).filter(Boolean).map(url => new Promise(resolve => {
      const img = new Image();
      img.onload  = () => { (img.decode ? img.decode().catch(()=>{}) : Promise.resolve()).then(() => resolve(img)); };
      img.onerror = () => resolve(null);   // never block on a missing asset
      img.src = url;
    }))
  );
}

// ── A1: per-profile best scores ───────────────────────────────────────────────
function _bestScoresKey() { return `pkt_best_scores_${getActiveProfile() || 'default'}`; }
function getBestScore(gameKey) {
  try { return (JSON.parse(localStorage.getItem(_bestScoresKey()) || '{}'))[gameKey] ?? null; }
  catch(e) { return null; }
}
function recordBestScore(gameKey, score) {
  try {
    const all  = JSON.parse(localStorage.getItem(_bestScoresKey()) || '{}');
    const prev = all[gameKey] ?? null;
    const isNew = prev === null || score > prev;
    if (isNew) { all[gameKey] = score; localStorage.setItem(_bestScoresKey(), JSON.stringify(all)); }
    return { isNew: isNew && prev !== null, best: Math.max(score, prev ?? 0), first: prev === null };
  } catch(e) { return { isNew: false, best: score, first: false }; }
}

// ── A6: shared results card — stars, gold count-up, token, NEW BEST ─────────
function showResultsCard(opts) {
  // opts: { title, score, maxScore, gold, tokenLabel, won, gameKey, onDone }
  const stars   = opts.maxScore > 0 ? Math.round((opts.score / opts.maxScore) * 5) : (opts.won ? 5 : 2);
  const bestRes = opts.gameKey ? recordBestScore(opts.gameKey, opts.score) : null;

  let overlay = document.getElementById('results-card-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'results-card-overlay';
    overlay.className = 'results-card-overlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="results-card ${opts.won ? 'rc-won' : 'rc-lost'}">
      <div class="rc-title">${opts.title || (opts.won ? 'You did it!' : 'Nice try!')}</div>
      ${bestRes?.isNew ? '<div class="rc-newbest">🏆 NEW BEST!</div>' : ''}
      <div class="rc-stars">${Array.from({length:5},(_,i)=>
        `<span class="rc-star${i<stars?' filled':''}" style="animation-delay:${i*0.12}s">${i<stars?'★':'☆'}</span>`).join('')}</div>
      ${opts.maxScore ? `<div class="rc-score">${opts.score} / ${opts.maxScore}</div>` : ''}
      ${opts.detail ? `<div class="rc-detail">${String(opts.detail).replace(/\n/g,'<br>')}</div>` : ''}
      ${bestRes && !bestRes.first && !bestRes.isNew ? `<div class="rc-best">Best: ${bestRes.best}</div>` : ''}
      <div class="rc-gold" id="rc-gold">💰 +0</div>
      ${opts.tokenLabel ? `<div class="rc-token">⭐ ${opts.tokenLabel}</div>` : ''}
      <button class="btn-pixel btn-primary rc-done" id="rc-done">Continue ▶</button>
    </div>`;
  overlay.style.display = 'flex';

  // Gold count-up animation
  const goldEl = document.getElementById('rc-gold');
  const target = opts.gold || 0;
  let cur = 0;
  const step = Math.max(1, Math.ceil(target / 24));
  const iv = setInterval(() => {
    cur = Math.min(target, cur + step);
    if (goldEl) goldEl.textContent = `💰 +${cur}`;
    if (cur >= target) clearInterval(iv);
  }, 40);

  document.getElementById('rc-done').onclick = () => {
    clearInterval(iv);
    overlay.style.display = 'none';
    if (opts.onDone) opts.onDone();
  };
}


const LOADING_TIPS = [
  'Type matchups deal double damage!',
  'Catch Pokémon to fill your Pokédex!',
  'Shields block incoming damage!',
  'Win 3 runs to unlock the League!',
  'Perfect mini-games give battle bonuses!',
  'Evolved Pokémon hit much harder!',
  'Heal nodes restore your whole party!',
];
let _loadingTipInterval = null;

function showLoading() {
  document.getElementById('loading-overlay').classList.remove('hidden');
  const tipEl = document.getElementById('loading-tip');
  if (tipEl) {
    const showTip = () => { tipEl.textContent = LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]; };
    showTip();
    clearInterval(_loadingTipInterval);
    _loadingTipInterval = setInterval(showTip, 2400);
  }
}
function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
  clearInterval(_loadingTipInterval);
  _loadingTipInterval = null;
}

function showModal(title, body, cb, withCancel) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = (body || '').replace(/\n/g, '<br>');
  document.getElementById('overlay').classList.remove('hidden');
  document.getElementById('modal-ok').onclick = () => {
    document.getElementById('overlay').classList.add('hidden');
    if (cb) cb();
  };
  // Optional cancel button — created once, toggled per call
  let cancelBtn = document.getElementById('modal-cancel');
  if (withCancel) {
    if (!cancelBtn) {
      cancelBtn = document.createElement('button');
      cancelBtn.id = 'modal-cancel';
      cancelBtn.className = 'btn-pixel btn-secondary modal-cancel-btn';
      cancelBtn.textContent = 'Cancel';
      document.getElementById('modal-ok').insertAdjacentElement('afterend', cancelBtn);
    }
    cancelBtn.style.display = '';
    cancelBtn.onclick = () => document.getElementById('overlay').classList.add('hidden');
  } else if (cancelBtn) {
    cancelBtn.style.display = 'none';
  }
}

function closeModal() {
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('modal-ok').textContent = 'OK';
}

// ─── POKEAPI HELPERS ─────────────────────────────────────────────────────────


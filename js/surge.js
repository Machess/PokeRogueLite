const ROCKET_SCRIPTS = [
  [
    { speaker:'jessie', name:'Jessie', img:'assets/jessi.png',
      text:'Prepare for trouble, ${name}!' },
    { speaker:'james',  name:'James',  img:'assets/james.png',
      text:'And make it double!' },
    { speaker:'jessie', name:'Jessie', img:'assets/jessi.png',
      text:'To protect the world from devastation!' },
    { speaker:'james',  name:'James',  img:'assets/james.png',
      text:'To unite all peoples within our nation!' },
    { speaker:'meowth', name:'Meowth', img:'assets/meowth.png',
      text:'Meowth! That\'s right!' },
    { speaker:'jessie', name:'Jessie', img:'assets/jessi.png',
      text:'Hand over your Pokémon, ${name}. This is your only warning!' },
  ],
  [
    { speaker:'meowth', name:'Meowth', img:'assets/meowth.png',
      text:'Well well well… look who wandered into our territory, ${name}!' },
    { speaker:'jessie', name:'Jessie', img:'assets/jessi.png',
      text:'Team Rocket doesn\'t tolerate trespassers.' },
    { speaker:'james',  name:'James',  img:'assets/james.png',
      text:'We\'ve been watching you for some time, ${name}. Your Pokémon look… valuable.' },
    { speaker:'jessie', name:'Jessie', img:'assets/jessi.png',
      text:'Hand them over nicely and maybe we\'ll let you leave.' },
    { speaker:'meowth', name:'Meowth', img:'assets/meowth.png',
      text:'Or don\'t. Meowth could use a good battle today! NYAH!' },
  ],
  [
    { speaker:'james',  name:'James',  img:'assets/james.png',
      text:'Oh my… a trainer all alone. How… convenient.' },
    { speaker:'jessie', name:'Jessie', img:'assets/jessi.png',
      text:'Team Rocket has eyes everywhere, ${name}. There\'s no escape.' },
    { speaker:'meowth', name:'Meowth', img:'assets/meowth.png',
      text:'The Boss will be very pleased when we bring him your Pokémon!' },
    { speaker:'james',  name:'James',  img:'assets/james.png',
      text:'Don\'t take it personally. It\'s just… business.' },
    { speaker:'jessie', name:'Jessie', img:'assets/jessi.png',
      text:'Now, ${name} — show us what you\'ve got. If you dare!' },
  ],
  [
    { speaker:'meowth', name:'Meowth', img:'assets/meowth.png',
      text:'Psst — hey ${name}! Yeah, you! Come a little closer…' },
    { speaker:'jessie', name:'Jessie', img:'assets/jessi.png',
      text:'SURPRISE! Team Rocket! Prepare for trouble!' },
    { speaker:'james',  name:'James',  img:'assets/james.png',
      text:'We leaped out from the tall grass just for you!' },
    { speaker:'meowth', name:'Meowth', img:'assets/meowth.png',
      text:'Meowth always wanted to do that. Worth it. NYAH!' },
    { speaker:'jessie', name:'Jessie', img:'assets/jessi.png',
      text:'Stop laughing, James. ${name}, you\'re battling us. Now.' },
  ],
];

// ─── MYSTERY ENGINE ───────────────────────────────────────────────────────────
// ─── LT. SURGE ELECTRIC QUIZ ENGINE ──────────────────────────────────────────

const SURGE_INTROS = [
  `${'{name}'}! Drop and give me three rounds of type matchups. In my unit, a soldier who gets this wrong doesn't get back up. MOVE IT.`,
  `Listen up, ${'{name}'}! Surge here. We're running a battlefield assessment. Three scenarios. No guessing. GO.`,
  `At ease, ${'{name}'}. Just kidding — STAND AT ATTENTION. Three type matchup drills. Fast and accurate. That's an order.`,
];

// Generate a scenario: pick random attacker/defender types, ask the player to classify
function _generateSurgeScenario(usedPairs) {
  const allTypes = Object.keys(TYPE_CHART);
  const defenders = [...allTypes, 'normal', 'fire', 'water', 'grass', 'electric'];
  let attacker, defender, mult;
  let attempts = 0;
  do {
    attacker = allTypes[Math.floor(Math.random() * allTypes.length)];
    defender = defenders[Math.floor(Math.random() * defenders.length)];
    mult     = getTypeMultiplier(attacker, defender);
    attempts++;
  } while (usedPairs.has(`${attacker}-${defender}`) && attempts < 30);
  usedPairs.add(`${attacker}-${defender}`);

  let correct, wrongOptions;
  if (mult >= 2) {
    correct      = 'Super effective!';
    wrongOptions = ['Not very effective…', 'No effect!', 'Normal damage'];
  } else if (mult === 0) {
    correct      = 'No effect!';
    wrongOptions = ['Super effective!', 'Not very effective…', 'Normal damage'];
  } else if (mult < 1) {
    correct      = 'Not very effective…';
    wrongOptions = ['Super effective!', 'No effect!', 'Normal damage'];
  } else {
    correct      = 'Normal damage';
    wrongOptions = ['Super effective!', 'Not very effective…', 'No effect!'];
  }

  // Shuffle wrong options and take 3, then shuffle all 4 choices
  const choices = shuffle([correct, ...wrongOptions.slice(0, 3)]);
  const typeIcon = TYPE_ICONS[attacker] || '';
  const defIcon  = TYPE_ICONS[defender] || '';
  return {
    attacker, defender, mult, correct, choices,
    question: `⚡ ${typeIcon} ${attacker.toUpperCase()} move vs ${defIcon} ${defender.toUpperCase()} type — what happens?`,
    explanation: mult >= 2
      ? `${attacker} is super effective against ${defender}! ${mult === 4 ? 'It\'s DOUBLY effective!' : ''}`
      : mult === 0
        ? `${attacker} has NO effect on ${defender} — completely immune!`
        : mult < 1
          ? `${attacker} is not very effective against ${defender} — resisted!`
          : `${attacker} deals normal damage to ${defender} — neutral matchup.`,
  };
}

const SurgeEngine = {
  _isActive:   false,
  _answered:   false,
  _node:       null,
  _round:      0,       // 0-2
  _score:      0,
  _scenarios:  [],
  _usedPairs:  null,

  start(node) {
    this._node     = node;
    this._isActive = true;
    ActiveEngine.set(this);
    this._answered = false;
    this._round    = 0;
    this._score    = 0;
    this._usedPairs = new Set();
    this._scenarios = [
      _generateSurgeScenario(this._usedPairs),
      _generateSurgeScenario(this._usedPairs),
      _generateSurgeScenario(this._usedPairs),
    ];

    // Boss-screen intro with Surge portrait + gym background
    showScreen('boss');
    BossEngine._isRocket = false;

    const bgEl  = document.querySelector('#screen-boss .battle-bg');
    const imgEl = document.querySelector('#screen-boss .battle-bg-img');
    if (bgEl && imgEl) {
      bgEl.classList.add('boss-intro-mode');
      bgEl.style.background = GYM_FALLBACKS[2]; // Surge fallback
      imgEl.style.opacity = '0';
      imgEl.onload  = () => { imgEl.style.opacity = '1'; bgEl.style.background = ''; };
      imgEl.onerror = () => { imgEl.style.opacity = '0'; };
      imgEl.src = 'assets/bg_2_boss.png';
    }

    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';
    document.getElementById('boss-party-bar').innerHTML       = '';

    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (trainerImg) trainerImg.src = 'assets/ltsurge.png';
    document.getElementById('dialogue-name').textContent = 'Lt. Surge';
    document.getElementById('dialogue-text').textContent = '';

    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.style.display = 'none';
    document.getElementById('btn-dialogue-next').style.display = 'none';

    const name = GameState.trainerName || 'Trainer';
    const intro = SURGE_INTROS[Math.floor(Math.random() * SURGE_INTROS.length)]
      .replace('{name}', name);
    typeBossIntro(intro, 22, () => {
      if (startBtn) { startBtn.style.display = ''; startBtn.textContent = 'Begin Drill! ⚡'; }
    });
  },

  startGame() {
    this._isActive = false;
    ActiveEngine.clear();
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = 'Battle! ▶';
    // Clear intro bg
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    document.getElementById('trainer-intro').style.display = 'none';
    this._showRound();
  },

  _showRound() {
    this._sceneAnswered=false;
    const sc = this._scenarios[this._round];
    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = 'assets/ltsurge.png'; img.style.display = ''; }
    document.getElementById('challenge-badge').textContent   = `⚡ Surge's Type Drill — Round ${this._round + 1}/3`;
    document.getElementById('challenge-intro').textContent   = `Score: ${this._score}/${this._round} correct`;
    document.getElementById('challenge-coin-visual').style.display  = 'none';
    const _jwd = document.getElementById('jessie-word-display');
    if (_jwd) { _jwd.style.display = 'none'; _jwd.innerHTML = ''; _jwd.className = 'jessie-word-display'; }
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';
    const qEl = document.getElementById('challenge-question');
    qEl.textContent  = sc.question;
    qEl.style.display = '';

    const btnArea = document.getElementById('challenge-answer-btns');
    btnArea.innerHTML = '';
    sc.choices.forEach(val => {
      const b = document.createElement('button');
      b.className   = 'challenge-answer-btn';
      b.textContent = val;
      b.addEventListener('click', () => this._answer(val));
      btnArea.appendChild(b);
    });

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.remove(...CHALLENGE_CLASSES);
    document.getElementById('screen-challenge').classList.add('surge-active');
    SoundEngine.playBGM('pallet_town_theme.mp3');
  },

  _answer(chosen) {
    if(this._sceneAnswered)return;this._sceneAnswered=true;
    const sc       = this._scenarios[this._round];
    const isRight  = chosen === sc.correct;
    if (isRight) this._score++;

    document.querySelectorAll('.challenge-answer-btn').forEach(b => {
      b.disabled = true;
      if (b.textContent === sc.correct) b.classList.add('answer-correct');
      else if (b.textContent === chosen && !isRight) b.classList.add('answer-wrong');
    });

    const resultEl = document.getElementById('challenge-result');
    const surge    = isRight
      ? ['OUTSTANDING! That\'s textbook.', 'CORRECT! You\'ve been studying.', 'AFFIRMATIVE! Move to the next.']
      : ['WRONG! Hit the books, soldier!', 'NEGATIVE! Unacceptable.', 'INCORRECT! Drop and give me twenty!'];
    const quote = surge[Math.floor(Math.random() * surge.length)];

    resultEl.className   = `challenge-result ${isRight ? 'result-correct' : 'result-wrong'}`;
    resultEl.innerHTML   = `${isRight ? '✅' : '❌'} <strong>${sc.correct}</strong><br>${sc.explanation}<br><em>"${quote}" — Lt. Surge</em>`;
    resultEl.style.display = 'block';

    const isLast = this._round === 2;
    const btn    = document.getElementById('challenge-continue-btn');
    btn.textContent   = isLast ? 'Debrief ▶' : 'Next Round ▶';
    btn.style.display = 'block';

    if (isLast) this._answered = true;
    this._round++;
  },

  // Called by challenge-continue-btn when not last round
  nextRound() {
    if (this._answered) {
      this._finish();
    } else {
      this._showRound();
    }
  },

  _finish() {
    this._answered = false;
    this._round    = 0;
    document.getElementById('screen-challenge').classList.remove('surge-active');
    const score = this._score;

    if (!GameState.pendingPlayerEffects) GameState.pendingPlayerEffects = {};

    let headline, detail, quote;
    if (score === 3) {
      // Perfect: +25% damage for 2 battles
      GameState.pendingPlayerEffects.briefedDmgBonus  = 1.25;
      GameState.pendingPlayerEffects.briefedBattles   = 2;
      const evos = levelUpParty('surge');
      headline = '⚡ PERFECT BRIEFING!';
      detail   = `All Pokémon +1 level!\n\n⚡ BRIEFED: +25% damage for 2 battles!`;
      quote    = 'Perfect. You may just survive out there. DISMISSED.';
      saveGame();
      const cb = () => showModal(headline, `${detail}\n\n"${quote}" — Lt. Surge`,
        () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); });
      evos.length > 0 ? runEvolutions(evos, cb) : cb();
    } else if (score >= 1) {
      // Partial win: +15% damage for 1 battle
      GameState.pendingPlayerEffects.briefedDmgBonus  = 1.15;
      GameState.pendingPlayerEffects.briefedBattles   = 1;
      const evos = levelUpParty('surge');
      headline = `⚡ ${score}/3 — BRIEFED`;
      detail   = `Active Pokémon +1 level!\n\n⚡ BRIEFED: +15% damage next battle!`;
      quote    = score === 2 ? 'Two out of three. Study the weak spot.' : 'One. Barely passing.';
      saveGame();
      const cb = () => showModal(headline, `${detail}\n\n"${quote}" — Lt. Surge`,
        () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); });
      evos.length > 0 ? runEvolutions(evos, cb) : cb();
    } else {
      // Loss: confiscate most recently acquired card
      const deck = GameState.party[GameState.activePokemonIndex]?.deck || GameState.deck;
      let confiscatedName = '';
      if (deck && deck.length > 1) {
        const removed = deck.splice(deck.length - 1, 1)[0];
        confiscatedName = removed?.name || 'a card';
        if (!GameState.confiscatedCards) GameState.confiscatedCards = [];
        GameState.confiscatedCards.push(removed);
      }
      headline = '⚡ 0/3 — FAIL';
      detail   = confiscatedName
        ? `"${confiscatedName}" CONFISCATED from your deck!\n\nScore perfectly in a future Surge quiz to recover it.`
        : 'No reward. Study your type chart, soldier.';
      quote    = 'Zero out of three. DISGRACEFUL. I\'m keeping that card until you prove yourself.';
      saveGame();
      showModal(headline, `${detail}\n\n"${quote}" — Lt. Surge`,
        () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); });
    }
  },

  finish() {
    // Called directly if somehow reached without _answered
    this._answered = false;
    document.getElementById('screen-challenge').classList.remove('surge-active');
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },
};

// ─── ERIKA HERB SORTING ENGINE ───────────────────────────────────────────────

// ─── ERIKA POTION MIXING ENGINE ──────────────────────────────────────────────


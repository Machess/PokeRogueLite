const BLAINE_INTROS = [
  `HA! ${'{name}'}! Welcome to my laboratory! Today — no riddles. Instead, a BATTLE EXPERIMENT! I will show you two Pokémon. You tell me — who wins? Type matchups are science. Let\'s see if you\'ve been paying attention!`,
  `Fwa ha ha! ${'{name}'}! Science and Pokémon — inseparable! I have two specimens ready to clash. Study their types. Predict the winner. It\'s not guesswork — it\'s ANALYSIS!`,
  `${'{name}'}! My research today concerns battle outcomes. I will present two Pokémon. Your task: determine the winner based on type. The type chart never lies — unlike my students' excuses!`,
];

const BLAINE_TEACHING_LINES = {
  super: [
    `EXACTLY! {atkType} is super effective against {defType} — 2× damage! Burn that into your memory!`,
    `Correct! {atkType} attacks deal double damage to {defType} types. Science in action!`,
    `Right! {atkType} versus {defType} — the type chart is clear. You\'re thinking like a researcher!`,
  ],
  immune: [
    `PERFECT! {defType} types are completely IMMUNE to {atkType} attacks — zero damage! The ultimate defence!`,
    `Excellent! {atkType} literally cannot hurt a {defType} type. Zero effect. It\'s in the data!`,
  ],
  resist: [
    `Correct! {defType} resists {atkType} — only half damage gets through. Every fraction matters in battle!`,
    `Right! {atkType} hits {defType} for just 0.5×. Resistance is a powerful tool!`,
  ],
  wrong_super: [
    `Fwa ha ha! Not quite! {atkType} is super effective against {defType} — the {atkName} wins! Remember: {atkType} deals 2× to {defType}!`,
    `Almost! But {atkType} crushes {defType} — double damage! Don\'t forget your type chart!`,
    `Incorrect! {atkType} versus {defType} is a clear advantage for {atkName}. Type knowledge wins battles!`,
  ],
  wrong_immune: [
    `Wrong! {defType} is completely IMMUNE to {atkType} — that\'s 0× damage! {defName} doesn\'t even flinch!`,
    `Nope! {atkType} cannot touch {defType} — zero effect. The immunity rule is critical!`,
  ],
  wrong_resist: [
    `Not this time! {defType} resists {atkType} — only 0.5× damage. {defName} has the edge!`,
    `Incorrect! {defType} types shrug off {atkType} attacks — half damage only. Study those resistances!`,
  ],
  neutral: [
    `Interesting case! Both types deal normal damage to each other — so the stronger Pokémon wins. {winName} has better raw stats!`,
  ],
};

// Type memory hooks — plain-language reasons why each matchup works
const TYPE_HOOKS = {
  'fire-grass':    'Fire burns plants — always.',
  'fire-ice':      'Fire melts ice — straightforward.',
  'fire-bug':      'Fire scorches insects — 2× damage.',
  'water-fire':    'Water extinguishes fire — every time.',
  'water-ground':  'Water soaks through earth — super effective.',
  'water-rock':    'Water erodes rock over time — 2× damage.',
  'electric-water':'Electricity and water are a dangerous combo.',
  'electric-flying':'Lightning strikes birds — Flying types beware.',
  'ground-electric':'Earth grounds electricity — immune!',
  'ground-fire':   'Ground smothers fire — super effective.',
  'ground-poison': 'Burying poison neutralises it — 2× damage.',
  'grass-water':   'Plants drink water — 2× effective.',
  'grass-ground':  'Roots break through earth — super effective.',
  'grass-rock':    'Plants crack rock over time — 2× damage.',
  'ice-grass':     'Ice freezes plants — super effective.',
  'ice-flying':    'Ice grounds flying creatures — 2× damage.',
  'ice-dragon':    'Cold is a dragon\'s weakness — super effective.',
  'fighting-normal':'Fighting type hits normal hard — 2× damage.',
  'fighting-rock': 'Punches break rock — super effective.',
  'fighting-ice':  'Fighting warms up cold — 2× damage.',
  'psychic-fighting':'Mind over muscle — Psychic wins.',
  'psychic-poison':'Mental power neutralises toxins — 2× damage.',
  'ghost-psychic': 'Ghosts haunt the mind — super effective.',
  'ghost-ghost':   'Only ghosts can truly hurt each other.',
  'normal-ghost':  'Normal attacks can\'t touch ghosts — immune!',
  'bug-psychic':   'Bugs unsettle even psychic minds — 2× damage.',
  'bug-grass':     'Insects devour plants — super effective.',
  'rock-fire':     'Rock smothers flames — 2× effective.',
  'rock-flying':   'Rocks knock birds out of the sky.',
  'rock-ice':      'Rock shatters ice — super effective.',
  'poison-grass':  'Poison wilts plants — super effective.',
  'dragon-dragon': 'Only dragons can truly wound other dragons.',
  'flying-grass':  'Wind shreds leaves — Flying beats Grass.',
  'flying-fighting':'Taking the fight to the skies — Flying wins.',
  'flying-bug':    'Birds eat insects — Flying beats Bug.',
};

function _getTypeHook(atkType, defType) {
  return TYPE_HOOKS[`${atkType}-${defType}`] || `${capitalize(atkType)} is strong against ${capitalize(defType)} type.`;
}

// Primary type for all 151 Kanto Pokémon — used by Blaine battle simulator
const POKEMON_TYPES = {
  1:'grass',2:'grass',3:'grass',4:'fire',5:'fire',6:'fire',
  7:'water',8:'water',9:'water',10:'bug',11:'bug',12:'bug',
  13:'bug',14:'bug',15:'bug',16:'normal',17:'normal',18:'normal',
  19:'normal',20:'normal',21:'normal',22:'normal',23:'poison',24:'poison',
  25:'electric',26:'electric',27:'ground',28:'ground',29:'poison',30:'poison',
  31:'poison',32:'poison',33:'poison',34:'poison',35:'normal',36:'normal',
  37:'fire',38:'fire',39:'normal',40:'normal',41:'poison',42:'poison',
  43:'grass',44:'grass',45:'grass',46:'grass',47:'grass',48:'bug',
  49:'bug',50:'ground',51:'ground',52:'normal',53:'normal',54:'water',
  55:'water',56:'fighting',57:'fighting',58:'fire',59:'fire',60:'water',
  61:'water',62:'water',63:'psychic',64:'psychic',65:'psychic',66:'fighting',
  67:'fighting',68:'fighting',69:'grass',70:'grass',71:'grass',72:'water',
  73:'water',74:'rock',75:'rock',76:'rock',77:'fire',78:'fire',
  79:'water',80:'water',81:'electric',82:'electric',83:'normal',84:'normal',
  85:'normal',86:'water',87:'water',88:'poison',89:'poison',90:'water',
  91:'water',92:'ghost',93:'ghost',94:'ghost',95:'rock',96:'psychic',
  97:'psychic',98:'water',99:'water',100:'electric',101:'electric',102:'grass',
  103:'grass',104:'ground',105:'ground',106:'fighting',107:'fighting',108:'normal',
  109:'poison',110:'poison',111:'ground',112:'ground',113:'normal',114:'grass',
  115:'normal',116:'water',117:'water',118:'water',119:'water',120:'water',
  121:'water',122:'psychic',123:'bug',124:'ice',125:'electric',126:'fire',
  127:'bug',128:'normal',129:'water',130:'water',131:'water',132:'normal',
  133:'normal',134:'water',135:'electric',136:'fire',137:'normal',138:'rock',
  139:'rock',140:'rock',141:'rock',142:'rock',143:'normal',144:'ice',
  145:'electric',146:'fire',147:'dragon',148:'dragon',149:'dragon',150:'psychic',151:'psychic',
};

// Build a matchup: returns { leftId, rightId, leftType, rightType, winnerId, loserId, mult, relationship }
function _buildMatchup(tier) {
  const attackTypes = Object.keys(TYPE_CHART);
  const allIds = [...new Set([...getWildPool().common, ...getWildPool().uncommon, ...getWildPool().rare])];

  let attempts = 0;
  while (attempts++ < 60) {
    const atkType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
    const defEntries = Object.entries(TYPE_CHART[atkType]);
    if (!defEntries.length) continue;
    const [defType, mult] = defEntries[Math.floor(Math.random() * defEntries.length)];

    // Tier 1 only 2× matchups; tier 2+ also 0.5× and 0×
    if (tier <= 1 && mult !== 2) continue;

    // Find Pokémon of each type using DUAL_TYPE_OVERRIDES first, then POKEMON_TYPES
    const typeOf = id => DUAL_TYPE_OVERRIDES[id] || POKEMON_TYPES[id];
    const atkPool = allIds.filter(id => typeOf(id) === atkType);
    const defPool = allIds.filter(id => typeOf(id) === defType);
    if (!atkPool.length || !defPool.length) continue;

    const atkId = atkPool[Math.floor(Math.random() * atkPool.length)];
    const defId = defPool[Math.floor(Math.random() * defPool.length)];
    if (atkId === defId) continue;

    const flip = Math.random() < 0.5;
    return {
      leftId:    flip ? defId   : atkId,
      rightId:   flip ? atkId   : defId,
      leftType:  flip ? defType : atkType,
      rightType: flip ? atkType : defType,
      winnerId:  atkId,
      loserId:   defId,
      atkType, defType, mult,
      relationship: mult === 0 ? 'immune' : mult >= 2 ? 'super' : 'resist',
    };
  }
  return null;
}

const BlaineEngine = {
  _isActive:   false,
  _answered:   false,
  _node:       null,
  _matchup:    null,
  _leftData:   null,
  _rightData:  null,

  start(node) {
    this._node     = node;
    this._isActive = true;
    ActiveEngine.set(this);
    this._answered = false;
    this._matchup  = null;

    const tier   = GameState.difficultyTier || 2;
    this._matchup = _buildMatchup(tier);
    if (!this._matchup) {
      // Fallback if no matchup found — skip
      MapEngine.completeNode(GameState.currentNodeIndex);
      MapEngine.show();
      return;
    }

    // Boss-screen intro
    showScreen('boss');
    BossEngine._isRocket = false;

    const bgEl  = document.querySelector('#screen-boss .battle-bg');
    const imgEl = document.querySelector('#screen-boss .battle-bg-img');
    if (bgEl && imgEl) {
      bgEl.classList.add('boss-intro-mode');
      bgEl.style.background = GYM_FALLBACKS[6];
      imgEl.style.opacity = '0';
      imgEl.onload  = () => { imgEl.style.opacity = '1'; bgEl.style.background = ''; };
      imgEl.onerror = () => { imgEl.style.opacity = '0'; };
      imgEl.src = 'assets/bg_6_boss.png';
    }

    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';
    document.getElementById('boss-party-bar').innerHTML       = '';

    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (trainerImg) trainerImg.src = 'assets/blaine.png';
    document.getElementById('dialogue-name').textContent = 'Blaine';
    document.getElementById('dialogue-text').textContent = '';

    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.style.display = 'none';
    document.getElementById('btn-dialogue-next').style.display = 'none';

    const name  = GameState.trainerName || 'Trainer';
    const intro = BLAINE_INTROS[Math.floor(Math.random() * BLAINE_INTROS.length)]
      .replace('{name}', name);
    typeBossIntro(intro, 22, () => {
      if (startBtn) { startBtn.style.display = ''; startBtn.textContent = 'Start Experiment 🔥'; }
    });
  },

  startGame() {
    this._isActive = false;
    ActiveEngine.clear();
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    document.getElementById('trainer-intro').style.display = 'none';
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = 'Battle! ▶';
    this._showArena();
  },

  async _showArena() {
    const m = this._matchup;

    // Setup challenge screen
    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = 'assets/blaine.png'; img.style.display = ''; }
    document.getElementById('challenge-badge').textContent   = '🔥 Blaine\'s Battle Lab!';
    document.getElementById('challenge-intro').textContent   = 'Which Pokémon wins this matchup?';
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';
    document.getElementById('challenge-question').style.display     = 'none';
    const _jwd = document.getElementById('jessie-word-display');
    if (_jwd) { _jwd.style.display = 'none'; _jwd.innerHTML = ''; _jwd.className = 'jessie-word-display'; }
    document.getElementById('challenge-answer-btns').innerHTML      = '';

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.remove(...CHALLENGE_CLASSES);
    document.getElementById('screen-challenge').classList.add('blaine-active');
    SoundEngine.playBGM('mini_game.mp3');

    // Build arena UI
    const cv = document.getElementById('challenge-coin-visual');
    cv.style.display = 'block';
    cv.className     = 'blaine-arena';
    cv.innerHTML     = `
      <div class="blaine-combatant" id="blaine-left">
        <div class="blaine-sprite-wrap">
          <img class="blaine-sprite" id="blaine-left-img" src="" alt="" onerror="this.src=''"/>
        </div>
        <div class="blaine-poke-name" id="blaine-left-name">…</div>
        <div class="blaine-type-row" id="blaine-left-type"></div>
      </div>
      <div class="blaine-vs">VS</div>
      <div class="blaine-combatant" id="blaine-right">
        <div class="blaine-sprite-wrap">
          <img class="blaine-sprite" id="blaine-right-img" src="" alt="" onerror="this.src=''"/>
        </div>
        <div class="blaine-poke-name" id="blaine-right-name">…</div>
        <div class="blaine-type-row" id="blaine-right-type"></div>
      </div>`;

    // Fetch both sprites in parallel
    const [leftData, rightData] = await Promise.all([
      fetchPoke(m.leftId).catch(() => null),
      fetchPoke(m.rightId).catch(() => null),
    ]);
    this._leftData  = leftData;
    this._rightData = rightData;

    if (leftData) {
      const lImg  = document.getElementById('blaine-left-img');
      const lName = document.getElementById('blaine-left-name');
      const lType = document.getElementById('blaine-left-type');
      lImg.src  = getSpriteUrl(leftData);
      lImg.alt  = capitalize(leftData.name);
      lName.textContent = capitalize(leftData.name);
      lType.innerHTML   = `<span class="hud-type-badge type-${m.leftType}">${m.leftType}</span>`;
    }
    if (rightData) {
      const rImg  = document.getElementById('blaine-right-img');
      const rName = document.getElementById('blaine-right-name');
      const rType = document.getElementById('blaine-right-type');
      rImg.src  = getSpriteUrl(rightData);
      rImg.alt  = capitalize(rightData.name);
      rName.textContent = capitalize(rightData.name);
      rType.innerHTML   = `<span class="hud-type-badge type-${m.rightType}">${m.rightType}</span>`;
    }

    // Choice buttons
    const btnArea = document.getElementById('challenge-answer-btns');
    btnArea.innerHTML = '';
    const leftName  = leftData  ? capitalize(leftData.name)  : `#${m.leftId}`;
    const rightName = rightData ? capitalize(rightData.name) : `#${m.rightId}`;

    const lb = document.createElement('button');
    lb.className   = 'blaine-choice-btn';
    lb.innerHTML   = `← ${leftName}`;
    lb.addEventListener('click', () => this._answer('left'));
    btnArea.appendChild(lb);

    const rb = document.createElement('button');
    rb.className   = 'blaine-choice-btn';
    rb.innerHTML   = `${rightName} →`;
    rb.addEventListener('click', () => this._answer('right'));
    btnArea.appendChild(rb);
  },

  _answer(side) {
    if (this._answered) return;
    this._answered = true;
    const m        = this._matchup;
    const isLeft   = side === 'left';
    const pickedId = isLeft ? m.leftId : m.rightId;
    const isRight  = pickedId === m.winnerId;

    // Disable buttons
    document.querySelectorAll('.blaine-choice-btn').forEach(b => b.disabled = true);

    // Visual reveal — winner advances, loser fades
    const winnerSide  = m.winnerId === m.leftId ? 'left' : 'right';
    const winnerEl    = document.getElementById(`blaine-${winnerSide}`);
    const loserSide   = winnerSide === 'left' ? 'right' : 'left';
    const loserEl     = document.getElementById(`blaine-${loserSide}`);

    MiniGameSession.later(() => {
      if (winnerEl) winnerEl.classList.add('blaine-winner');
      if (loserEl)  loserEl.classList.add('blaine-loser');
    }, 200);

    // Effectiveness badge between combatants
    const vsEl = document.querySelector('.blaine-vs');
    if (vsEl) {
      const eff = m.mult === 0 ? 'Immune! 0×'
                : m.mult >= 2  ? '⚡ 2× Super Effective!'
                : '🛡️ 0.5× Resisted';
      const col = m.mult === 0 ? '#888' : m.mult >= 2 ? '#FFD700' : '#aaa';
      MiniGameSession.later(() => {
        vsEl.innerHTML = `<span class="blaine-eff-badge" style="color:${col}">${eff}</span>`;
      }, 500);
    }

    // Build explanation
    const winnerName = m.winnerId === m.leftId
      ? (this._leftData  ? capitalize(this._leftData.name)  : `#${m.leftId}`)
      : (this._rightData ? capitalize(this._rightData.name) : `#${m.rightId}`);
    const loserName  = m.winnerId === m.leftId
      ? (this._rightData ? capitalize(this._rightData.name) : `#${m.rightId}`)
      : (this._leftData  ? capitalize(this._leftData.name)  : `#${m.leftId}`);

    const linePool   = isRight
      ? BLAINE_TEACHING_LINES[m.relationship]
      : BLAINE_TEACHING_LINES[`wrong_${m.relationship}`] || BLAINE_TEACHING_LINES.wrong_super;
    const rawLine    = linePool[Math.floor(Math.random() * linePool.length)] || '';
    const teachLine  = rawLine
      .replace('{atkType}', capitalize(m.atkType))
      .replace('{defType}', capitalize(m.defType))
      .replace('{atkName}', winnerName)
      .replace('{defName}', loserName)
      .replace('{winName}', winnerName);

    const hook       = _getTypeHook(m.atkType, m.defType);
    const multLabel  = m.mult === 0 ? '0× (immune)' : m.mult >= 2 ? '2× (super effective)' : '0.5× (resisted)';

    const resultEl   = document.getElementById('challenge-result');
    resultEl.className = `challenge-result ${isRight ? 'result-correct' : 'result-wrong'}`;
    resultEl.innerHTML = `
      <div class="blaine-result-title">${isRight ? '✅ Correct!' : '❌ ' + winnerName + ' wins!'}</div>
      <div class="blaine-result-matchup">
        <span class="hud-type-badge type-${m.atkType}">${m.atkType}</span>
        → <strong>${multLabel}</strong> →
        <span class="hud-type-badge type-${m.defType}">${m.defType}</span>
      </div>
      <div class="blaine-result-hook">💡 ${hook}</div>
      <div class="blaine-result-quote"><em>"${teachLine}" — Blaine</em></div>`;
    MiniGameSession.later(() => {
      resultEl.style.display = 'block';
      document.getElementById('challenge-continue-btn').style.display = 'block';
      document.getElementById('challenge-continue-btn').textContent   = 'Continue ▶';
    }, 800);
  },

  finish() {
    this._answered = false;
    document.getElementById('screen-challenge').classList.remove('blaine-active');
    const cv = document.getElementById('challenge-coin-visual');
    cv.innerHTML = ''; cv.className = 'challenge-coin-visual';

    const isRight    = !!document.querySelector('.result-correct');
    const tier       = GameState.difficultyTier || 2;
    const goldBase   = 30 + (GameState.bossesDefeated || 0) * 5;
    const goldReward = isRight ? goldBase : Math.floor(goldBase * 0.3);

    if (!GameState.pendingPlayerEffects) GameState.pendingPlayerEffects = {};

    GameState.gold = (GameState.gold || 0) + goldReward;

    if (isRight) {
      // Win: type annotations on cards shown next boss battle
      GameState.pendingPlayerEffects.typeAnnotations = true;
      // Tier 3 perfect: permanently boost one random card
      if (tier >= 3) {
        const deck = GameState.party[GameState.activePokemonIndex]?.deck || GameState.deck;
        if (deck?.length > 0) {
          const card = deck[Math.floor(Math.random() * deck.length)];
          if (card) { card.power = Math.round((card.power || 0) * 1.1 + 3); card.improved = (card.improved || 0) + 1; }
        }
      }
      SoundEngine.playFanfare();
      saveGame();
      showModal('🔥 Correct!',
        `+${goldReward}💰${tier >= 3 ? ' · A card was permanently upgraded!' : ''}\n\n🔬 ANALYSED: Type effectiveness hints shown on your cards next boss battle!\n\n"Knowledge IS power — and you have both!" — Blaine`,
        () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); });
    } else {
      // Loss: type confusion — one opening hand card misfires next battle
      GameState.pendingPlayerEffects.typeConfusion = true;
      saveGame();
      showModal('🔥 Study up!',
        `+${goldReward}💰 consolation.\n\n🔀 Type Confusion: one card in your opening hand next battle will misfire!\n\n"Fwa ha ha! That's what SCIENCE looks like when it goes wrong!" — Blaine`,
        () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); });
    }
  },
};
// ─── LEGENDARY ENCOUNTER ENGINE ──────────────────────────────────────────────
// Dedicated engine for Articuno / Zapdos / Moltres encounters.
// Triggered by a 'legendary' map node injected at step 7 on maps bi >= 6.
// Rules: 2 throw attempts maximum, catch rate 15% (Master Ball = 100%).
// After 2 misses the bird flies away. If caught, the legendary card is added
// to the player's active Pokémon deck permanently.

// ─── SABRINA JIGSAW ENGINE ────────────────────────────────────────────────────


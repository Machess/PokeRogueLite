const CHALLENGE_SELECT_MENU = [
  {
    key:    'jigglypuff',
    type:   'jigglypuff_node',
    emoji:  '🎵',
    name:   "Jigglypuff's Song",
    desc:   'Memory music game',
    reward: '💤 Auto-revive if lead faints',
    engine: () => JigglypuffEngine,
  },
  {
    key:    'fishing',
    type:   'fishing',
    emoji:  '🎣',
    name:   "Misty's Mystery Catch",
    desc:   'Identify the Pokémon',
    reward: '🎣 Type damage buff or status',
    engine: () => FishingEngine,
  },
  {
    key:    'surge',
    type:   'surge_node',
    emoji:  '⚡',
    name:   "Surge's Type Quiz",
    desc:   'Answer type questions',
    reward: '⚡ +15–25% damage next battle',
    engine: () => SurgeEngine,
  },
  {
    key:    'erika',
    type:   'erika_node',
    emoji:  '🧪',
    name:   "Erika's Potion Lab",
    desc:   'Colour mixing puzzle',
    reward: '🌸 Custom potion item',
    engine: () => ErikaEngine,
  },
  {
    key:    'ninja',
    type:   'ninja_node',
    emoji:  '🥷',
    name:   "Koga's Ninja Memory",
    desc:   'Card matching game',
    reward: '🧠 Status durations halved',
    engine: () => NinjaMemoryEngine,
  },
  {
    key:    'sabrina',
    type:   'sabrina_node',
    emoji:  '🔮',
    name:   "Sabrina's Jigsaw",
    desc:   'Psychic puzzle',
    reward: '🔮 Reveals map nodes ahead',
    engine: () => SabrinaEngine,
  },
  {
    key:    'blaine',
    type:   'blaine_node',
    emoji:  '🔥',
    name:   "Blaine's Battle Lab",
    desc:   'Type matchup simulator',
    reward: '🔬 Type hints on cards',
    engine: () => BlaineEngine,
  },
  {
    key:    'giovanni',
    type:   'giovanni_node',
    emoji:  '💰',
    name:   "Rocket's Ledger",
    desc:   'Money & making change',
    reward: '⭐ 10% shop discount',
    engine: () => GiovanniEngine,
  },
  {
    key:    'jenny',
    type:   'jenny_node',
    emoji:  '🚓',
    name:   "Lost & Found Patrol",
    desc:   'Match the lost Pokémon',
    reward: '🚓 No Team Rocket for 5 nodes',
    region: 'both',
    engine: () => JennyEngine,
  },
  {
    key:    'oak',
    type:   'oak_node',
    emoji:  '🔬',
    name:   "Oak's Sorting Lab",
    desc:   'Sort Pokémon by type',
    reward: '💰 Big gold reward',
    region: 'both',
    engine: () => OakSortEngine,
  },
  {
    key:    'snorlax',
    type:   'snorlax_node',
    emoji:  '🍌',
    name:   'Feed Snorlax',
    desc:   'Find the perfect serving: higher or lower',
    reward: '💰 Big gold reward',
    region: 'both',
    engine: () => SnorlaxEngine,
  },
  {
    key:    'togepi',
    type:   'togepi_node',
    emoji:  '⏳',
    name:   "Togepi's Time Freeze",
    desc:   'How long did time stop?',
    reward: "✨ Lucky Charm — enemy's first attack misses",
    region: 'johto',
    engine: () => TogepiEngine,
  },
];

const ChallengeSelectEngine = {
  _node: null,

  start(node) {
    this._node = node;
    const tier      = GameState.difficultyTier || 2;
    const unlocks   = loadUnlocks();
    const isReturn  = (unlocks.completedWith?.length || 0) > 0;
    const bi        = GameState.bossesDefeated || 0;

    // Build available options: unlocked mini-games for this profile
    const region = GameState.region || 'kanto';
    const MG_MIN_BI = { jigglypuff:2, fishing:2, surge:3, erika:4, ninja:5, sabrina:6, blaine:7, giovanni:8,
                        jenny:1, oak:1, snorlax:1, togepi:2 };
    const available = CHALLENGE_SELECT_MENU.filter(m => {
      // Region gating: entries tagged 'johto' only in Johto; 'both' everywhere;
      // untagged (the original gym games) keep their existing behaviour.
      if (m.region === 'johto' && region !== 'johto') return false;
      if (bi < (MG_MIN_BI[m.key] || 0)) return false;
      // Jenny/Oak/Snorlax/Togepi are always offerable once their minBi is met;
      // the rest use the existing unlock rules.
      if (['jenny','oak','snorlax','togepi'].includes(m.key)) return true;
      return isReturn || unlocks.miniGamesUnlocked.includes(m.key) || m.key === 'fishing';
    });

    // How many to offer: up to 6 cards (capped by what's available)
    const maxOffer  = 6;
    const offered   = shuffle([...available]).slice(0, maxOffer);

    // Build challenge screen
    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = ''; img.style.display = 'none'; }
    document.getElementById('challenge-badge').textContent   = '🎮 Choose Your Challenge';
    document.getElementById('challenge-intro').textContent   =
      'Pick a mini-game. Each one has a unique reward!';
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';
    document.getElementById('challenge-question').style.display     = 'none';
    document.getElementById('challenge-answer-btns').innerHTML      = '';
    const _jwd = document.getElementById('jessie-word-display');
    if (_jwd) { _jwd.style.display = 'none'; _jwd.innerHTML = ''; _jwd.className = 'jessie-word-display'; }

    const cv = document.getElementById('challenge-coin-visual');
    cv.style.display = 'block';
    cv.className     = 'cs-wrap';
    cv.innerHTML     = '';

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.remove(...CHALLENGE_CLASSES);
    document.getElementById('screen-challenge').classList.add('challenge-select-active');

    // Build game cards
    const grid = document.createElement('div');
    grid.className = 'cs-grid';
    cv.appendChild(grid);

    offered.forEach(m => {
      const card = document.createElement('div');
      card.className = 'cs-card';
      card.innerHTML = `
        <div class="cs-card-emoji">${m.emoji}</div>
        <div class="cs-card-name">${m.name}</div>
        <div class="cs-card-desc">${m.desc}</div>
        <div class="cs-card-reward">${m.reward}</div>
        <button class="btn-pixel btn-primary cs-play-btn">▶ Play</button>`;
      card.querySelector('.cs-play-btn').addEventListener('click', () => {
        this._launch(m);
      });
      grid.appendChild(card);
    });

    // Skip option
    const skipCard = document.createElement('div');
    skipCard.className = 'cs-card cs-skip-card';
    const skipGold = 8 + bi * 2;
    skipCard.innerHTML = `
      <div class="cs-card-emoji">💰</div>
      <div class="cs-card-name">Skip</div>
      <div class="cs-card-desc">Take gold and move on</div>
      <div class="cs-card-reward">+${skipGold}💰 guaranteed</div>
      <button class="btn-pixel btn-secondary cs-play-btn">Take Gold</button>`;
    skipCard.querySelector('.cs-play-btn').addEventListener('click', () => {
      this._skip(skipGold);
    });
    grid.appendChild(skipCard);
  },

  _launch(menuItem) {
    // Clean up select screen classes, then start the chosen engine
    document.getElementById('screen-challenge').classList.remove('challenge-select-active');
    const cv = document.getElementById('challenge-coin-visual');
    cv.innerHTML = ''; cv.className = 'challenge-coin-visual';

    // Pass through the original node so completeNode fires correctly inside the engine
    menuItem.engine().start(this._node);
  },

  _skip(gold) {
    GameState.gold = (GameState.gold || 0) + gold;
    saveGame();
    document.getElementById('screen-challenge').classList.remove('challenge-select-active');
    const cv = document.getElementById('challenge-coin-visual');
    cv.innerHTML = ''; cv.className = 'challenge-coin-visual';
    showModal('💰 Challenge Skipped',
      `+${gold}💰 gold.\n\n"Maybe next time." `,
      () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); });
  },
};

// ─── GIOVANNI ENGINE — "Rocket's Ledger" — teaches money & change ────────────
// Giovanni audits Team Rocket's loot. Pay exact amounts and make change
// using gold coins. Tier 1: pay exact price. Tier 2: make change.
// Tier 3: bigger amounts, mixed change. Reward: 10% shop discount this run.


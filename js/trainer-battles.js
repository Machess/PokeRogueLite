const WILD_TRAINER_SPRITES = {
  bug:      () => Math.random() < .5 ? 'assets/bug_trainer_1.png' : 'assets/bug_trainer_2.png',
  fighting: () => 'assets/fight_trainer.png',
  flying:   () => 'assets/flying_trainer.png',
  ghost:    () => 'assets/ghost_trainer.png',
  grass:    () => 'assets/grass_trainer.png',
  normal:   () => 'assets/normal_trainer.png',
  psychic:  () => 'assets/psy_trainer.png',
  rock:     () => 'assets/rock_trainer.png',
};
function getWildTrainerSprite(type) {
  const fn = WILD_TRAINER_SPRITES[type] || WILD_TRAINER_SPRITES.normal;
  return fn();
}

// Trainer battle fluff lines — keyed by opponent type
const TRAINER_FLUFF = {
  bug:      ["You're about to get a lesson in the power of insects!",
             "My bugs have been training all season. Hope you're ready!"],
  fighting: ["I've been training every day! Let's see what you've got!",
             "A real battle tests your strength AND your mind!"],
  flying:   ["My Pokémon rule the skies! You won't catch them off guard!",
             "Speed and altitude — that's the winning formula!"],
  ghost:    ["Heh heh heh… you can't defeat what you can't see coming…",
             "My Pokémon lurk in the shadows. Are you sure about this?"],
  grass:    ["Nature will always find a way! My Pokémon are proof of that.",
             "I raised these Pokémon in the wild. They're tougher than they look."],
  normal:   ["Don't underestimate a well-trained Pokémon. Prepare yourself!",
             "I may not have a fancy type — but I make up for it with heart!"],
  psychic:  ["I already know your strategy. Care to try anyway?",
             "Mind over matter, trainer. That's what my Pokémon believe."],
  rock:     ["My Pokémon are as tough as the mountains themselves!",
             "Solid defence, crushing offence. That's the Rock way!"],
};
function getTrainerFluff(type) {
  const pool = TRAINER_FLUFF[type] || TRAINER_FLUFF.normal;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Type-specific Kanto Pokémon pools for trainer battles ────────────────────
// Trainers always use Pokémon that match their type.
// Ghost only has 3 in Gen 1 — supplemented with psychic Drowzee/Hypno.
const TRAINER_TYPE_POOLS = {
  bug:      [10,11,12,13,14,15,46,47,48,123,127],
  fighting: [56,57,62,66,67,68,106,107],
  flying:   [16,17,18,21,22,83,84,85],
  ghost:    [92,93,94,96,97],        // + Drowzee/Hypno as supplement
  grass:    [1,2,3,43,44,45,69,70,71,102,103,114],
  normal:   [19,20,35,36,39,40,52,53,108,113,128,132,133],
  psychic:  [63,64,65,79,80,96,97,121,122,124,137],
  rock:     [74,75,76,95,111,112,138,139,140,141,142],
};
function getTrainerPool(type) {
  return TRAINER_TYPE_POOLS[type] || TRAINER_TYPE_POOLS.normal;
}

// ─── TRAINER BATTLE ENGINE ────────────────────────────────────────────────────
const TrainerBattleEngine = {
  _isActive:  false,
  _team:      [],      // [poke1, poke2]
  _teamIdx:   0,       // which Pokémon is currently fighting
  _goldEarned: 0,      // accumulated across both fights
  _node:      null,
  _trainerType: null,

  async start(node) {
    this._node        = node;
    this._team        = [];
    this._teamIdx     = 0;
    this._goldEarned  = 0;

    showLoading();

    // Determine trainer type from any type pool (weighted toward having a clear identity)
    const allTypes   = Object.keys(TRAINER_TYPE_POOLS);
    const trainerType = allTypes[Math.floor(Math.random() * allTypes.length)];
    this._trainerType = trainerType;

    const pool      = getTrainerPool(trainerType);
    const baseLevel = 5 + GameState.bossesDefeated * 6 + Math.floor(Math.random() * 4) + 3;

    // Pick two distinct Pokémon from the type pool
    const shuffled = shuffle([...pool]);
    const id1 = shuffled[0];
    const id2 = shuffled[1] ?? shuffled[0]; // fallback if pool has only 1 entry

    const [data1, data2, playerData] = await Promise.all([
      fetchPoke(id1),
      fetchPoke(id2),
      fetchPoke(GameState.party[GameState.activePokemonIndex].id),
    ]);

    const active = GameState.party[GameState.activePokemonIndex];
    active.backSpriteUrl = playerData.sprites?.back_default
                        || playerData.sprites?.front_default
                        || active.spriteUrl;

    const makeOpp = (data, level) => {
      const t    = DUAL_TYPE_OVERRIDES[data.id] || data.types?.[0]?.type?.name || 'normal';
      return makePokemon(data.id, level, getSpriteUrl(data, true), capitalize(data.name), t);
    };

    // Ace (Pokémon 2) is 2 levels higher — acts as the trainer's stronger Pokémon
    this._team = [
      makeOpp(data1, baseLevel),
      makeOpp(data2, baseLevel + 2),
    ];

    hideLoading();

    // ── Show boss intro screen for trainer dialogue ─────────────────────────
    showScreen('boss');
    BossEngine._isRocket = false;

    const bgEl  = document.querySelector('#screen-boss .battle-bg');
    const imgEl = document.querySelector('#screen-boss .battle-bg-img');
    if (bgEl)  { bgEl.classList.remove('boss-intro-mode'); bgEl.style.background = 'linear-gradient(160deg,#0a0a1a,#1a1a2e)'; }
    if (imgEl) { imgEl.src = ''; imgEl.style.opacity = '0'; }

    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';

    // ── 2-pip party bar in the intro screen ────────────────────────────────
    const bar = document.getElementById('boss-party-bar');
    bar.innerHTML = `
      <div class="trainer-pip trainer-pip-0 trainer-pip-alive" id="trainer-pip-0"></div>
      <div class="trainer-pip trainer-pip-1 trainer-pip-alive" id="trainer-pip-1"></div>`;

    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (trainerImg) trainerImg.src = getWildTrainerSprite(trainerType);

    document.getElementById('dialogue-name').textContent = 'Trainer';
    document.getElementById('dialogue-text').textContent = '';
    document.getElementById('btn-dialogue-next').style.display = 'none';

    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.style.display = 'none';

    const fluff = getTrainerFluff(trainerType);
    typeBossIntro(fluff, 30, () => {
      if (startBtn) { startBtn.style.display = ''; startBtn.textContent = 'Battle! ▶'; }
    });

    this._isActive = true;
    // TrainerBattleEngine does NOT register with ActiveEngine — it uses
    // startBattle() not startGame(), so the btn handler handles it separately.
  },

  startBattle() {
    this._isActive = false;
    document.getElementById('trainer-intro').style.display = 'none';

    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.style.background = '';

    showScreen('battle');
    this._loadOpp(0);
  },

  _loadOpp(idx) {
    this._teamIdx = idx;
    const opp    = this._team[idx];
    const active = GameState.party[GameState.activePokemonIndex];

    setBattleBg(opp.type, false);
    BattleEngine._isTrainerBattle = true;
    BattleEngine._initBattle(active, opp, false);

    // Inject pip bar into the battle screen
    this._renderBattlePips();
    if (idx > 0) {
      BattleEngine._logSystem(`Trainer's ace: <b>${opp.name}</b>!`);
    }
  },

  _renderBattlePips() {
    // Place a small 2-pip bar at the top-centre of screen-battle
    let bar = document.getElementById('trainer-battle-pips');
    if (!bar) {
      bar = document.createElement('div');
      bar.id        = 'trainer-battle-pips';
      bar.className = 'trainer-battle-pips';
      document.getElementById('screen-battle').appendChild(bar);
    }
    bar.innerHTML = '';
    bar.style.display = 'flex';
    this._team.forEach((_, i) => {
      const pip = document.createElement('div');
      pip.id        = `tbp-${i}`;
      pip.className = `trainer-pip ${i < this._teamIdx ? 'trainer-pip-fainted' : 'trainer-pip-alive'}`;
      bar.appendChild(pip);
    });
  },

  _markPipFainted(idx) {
    // Update both intro pip and battle pip
    const introP  = document.getElementById(`trainer-pip-${idx}`);
    const battleP = document.getElementById(`tbp-${idx}`);
    if (introP)  { introP.className  = 'trainer-pip trainer-pip-fainted'; }
    if (battleP) { battleP.className = 'trainer-pip trainer-pip-fainted'; }
  },

  // Called from BattleEngine._victory() when _isTrainerBattle is set
  onPokemonDefeated() {
    const idx = this._teamIdx;

    // Accumulate partial gold for each Pokémon defeated
    this._goldEarned += goldForWildBattle();
    this._markPipFainted(idx);

    if (idx < this._team.length - 1) {
      // More Pokémon left — brief pause then load next
      BattleEngine._logSystem(`Trainer's ${this._team[idx].name} fainted!`);
      setTimeout(() => this._loadOpp(idx + 1), 1200);
    } else {
      // All defeated — full trainer win
      this._finishWin();
    }
  },

  _finishWin() {
    // Full gold = accumulated per-pokemon + bonus for completing the trainer
    const totalGold = Math.round(this._goldEarned * 1.8);
    GameState.gold = (GameState.gold || 0) + totalGold;

    // Clean up pip bar from battle screen
    const bar = document.getElementById('trainer-battle-pips');
    if (bar) bar.style.display = 'none';

    BattleEngine._isTrainerBattle = false;
    MapEngine.completeNode(GameState.currentNodeIndex);

    const evolutions = levelUpParty('battle');
    if (evolutions.length > 0) {
      saveGame();
      runEvolutions(evolutions, () => CardReward.show(totalGold));
    } else {
      saveGame();
      CardReward.show(totalGold);
    }
  },
};


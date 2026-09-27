let GameState = null;

function freshState(starterId) {
  const starter = STARTERS.find(s => s.id === starterId);
  return {
    starterId,
    starterType: starter.type,
    evolutionStage: 0,          // 0=base, 1=stage2, 2=final
    bossesDefeated: 0,
    party: [],                   // array of PokémonInstance
    activePokemonIndex: 0,
    deck: buildDeck(starter.type, 0),
    map: generateMap(),
    currentNodeIndex: null,
    completedNodes: [],
    unlockedPikachu: false,
    unlockedEevee:   false,
    unlockedMew:     false,
    unlockedMewtwo:  false,
    pendingPlayerStatuses: [],  // statuses applied to player at start of next battle
    pendingPlayerEffects:  {},  // {energyOverride, briefed, clarityBuff, typeAnnotations}
  };
}

// ─── POKÉMON INSTANCE ────────────────────────────────────────────────────────

// Kanto Pokémon whose battle-relevant type is the SECONDARY type from PokéAPI.
// The API returns type[0] first — for Normal/Flying Pokémon that's "normal",
// but flying is the mechanically meaningful type for matchups and moves.
// Zubat/Golbat: primary is poison (correct), secondary is flying — poison is fine.
// Charizard: primary is fire (correct), secondary is flying — fire is fine.
// Scyther: primary is bug (correct), secondary is flying — bug is fine.
const DUAL_TYPE_OVERRIDES = {
  // Kanto
  16:  'flying', 17:  'flying', 18:  'flying',
  21:  'flying', 22:  'flying',
  83:  'flying', 84:  'flying', 85:  'flying',
  144: 'ice', 145: 'electric', 146: 'fire',
  // Johto — dominant battle type
  163: 'flying', 164: 'flying',  // Hoothoot, Noctowl (normal/flying)
  165: 'bug',    166: 'bug',     // Ledyba, Ledian   (bug/flying → bug)
  167: 'bug',    168: 'bug',     // Spinarak, Ariados (bug/poison → bug)
  169: 'flying',                 // Crobat (poison/flying → flying)
  176: 'flying',                 // Togetic (normal/flying → flying)
  177: 'psychic',178: 'psychic', // Natu, Xatu (psychic/flying → psychic)
  185: 'rock',                   // Sudowoodo (rock masquerades as grass)
  187: 'grass',  188: 'grass', 189: 'flying', // Hoppip line — grass/flying; Jumpluff flying
  190: 'normal',                 // Aipom
  193: 'bug',                    // Yanma (bug/flying → bug)
  194: 'water',  195: 'water',   // Wooper, Quagsire (water/ground → water)
  197: 'dark',                   // Umbreon
  198: 'flying',                 // Murkrow (dark/flying → flying)
  207: 'ground',                 // Gligar (ground/flying → ground)
  212: 'bug',                    // Scizor (bug/steel → bug)
  214: 'bug',                    // Heracross (bug/fighting → bug)
  215: 'ice',                    // Sneasel (dark/ice → ice)
  227: 'flying',                 // Skarmory (steel/flying → flying)
  229: 'fire',                   // Houndoom (dark/fire → fire)
  230: 'water',                  // Kingdra (water/dragon → water)
  243: 'electric', 244: 'fire', 245: 'water', // legendary beasts
  249: 'water',  250: 'fire',    // Lugia, Ho-Oh
};

function makePokemon(id, level, spriteUrl, name, type, isStarter = false) {
  const safeName = name || capitalize(String(id));  // fallback to id string if name missing
  // Apply dual-type override — use the battle-relevant type for these Pokémon
  const resolvedType = DUAL_TYPE_OVERRIDES[Number(id)] || type;
  // Legendary birds get their own named move pool
  const legendaryMoveKey = { 144: 'articuno', 145: 'zapdos', 146: 'moltres' }[Number(id)];
  const maxHp = 80 + level * 8 + (isStarter ? 20 : 0) + (Number(id) === 150 ? 40 : 0);
  const deck = SpeciesCards.build({id, name:safeName, type:resolvedType});
  const movePool = OPPONENT_MOVES[legendaryMoveKey] || OPPONENT_MOVES[resolvedType] || OPPONENT_MOVES.normal;
  const matchingMoves = SpeciesCards.pool({id,type:resolvedType}).filter(c=>c.power>0);
  const moves = shuffle(matchingMoves).slice(0,3).map(c=>({name:c.name,power:c.power,type:c.type,effect:c.special,source:c.source||null}));
  return { id, name: safeName, type: resolvedType, level, maxHp, hp: maxHp, spriteUrl, backSpriteUrl: null, isStarter, statusEffects: [], deck, moves, heldItem: null, cardCatalogVersion:2 };
}

// ─── LEGENDARY BIRD SIGNATURE CARDS ─────────────────────────────────────────
// Unique cards exclusive to the three legendary birds — used as opponent moves
// and added to the player's deck if the bird is caught.
const LEGENDARY_BIRD_CARDS = {
  144: { id:'blizzard_wing', name:'Blizzard Wing', icon:'❄️', type:'ice',      power:75, cost:2, effect:'Always first. 30% freeze.', special: 'blizzard_wing' },   // Articuno
  145: { id:'thunder_storm', name:'Thunder Storm', icon:'⛈️', type:'electric', power:95, cost:3, effect:'Paralyse. One use only.',   special: 'para_chance', exhaust: true }, // Zapdos
  146: { id:'sacred_fire',   name:'Sacred Fire',   icon:'🔥', type:'fire',     power:80, cost:2, effect:'Burn guaranteed. Once.',    special: 'burn', exhaust: true },         // Moltres
};

function buildDeck(type, improvementMap = {}) {
  const templates = CARD_TEMPLATES[type] || CARD_TEMPLATES.normal;
  return DEFAULT_DECK_INDICES.map((ti, deckPos) => {
    const tpl = { ...templates[ti] };
    // Apply improvements
    const improved = improvementMap[deckPos] || 0;
    tpl.power = Math.round(tpl.power * (1 + improved * 0.25));
    tpl.improved = improved;
    tpl.deckPos = deckPos;
    return tpl;
  });
}

// ─── MAP GENERATION ──────────────────────────────────────────────────────────
// Pure decision graph — 10 choice steps then boss.
// Every step has 2 or 3 choices (70% chance of 3).
// No coordinates needed for display — only row/links matter.

function generateMap(bossIndex) {
  const bi = bossIndex ?? Math.min(GameState?.bossesDefeated ?? 0, getMapThemes().length - 1);

  const STEPS = 10; // decision steps before boss

  // ── Type pools per step band ───────────────────────────────────────────────
  // Early (0–2): battle-heavy, lots of catching
  // Mid   (3–6): mix of everything including heals and shops
  // Late  (7–9): battle-heavy, training, shop
  const earlyPool = ['battle','battle','battle','catch','catch','training','heal','mystery'];
  const midPool   = ['battle','battle','catch','training','heal','shop','battle','mystery','mystery'];
  const latePool  = ['battle','battle','battle','training','shop','catch','battle','mystery'];

  const poolForStep  = s => s <= 2 ? earlyPool : s <= 6 ? midPool : latePool;
  const pickType     = s => {
    const pool = poolForStep(s);
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // ── Build graph ────────────────────────────────────────────────────────────
  const nodes = [];
  let   idx   = 0;

  const makeNode = (row, type, unlocked = false, revealed = false) => {
    const n = {
      idx: idx++, row, type, unlocked, revealed,
      done: false, bypassed: false, links: [],
      // Dummy coords — not used for display but kept for save/load compat
      x: 0.5, y: 1 - row / (STEPS + 1), col: 0, lane: 'mid',
    };
    nodes.push(n);
    return n;
  };

  // Step 0: always 3 choices, all unlocked and revealed immediately
  const firstRow = [
    makeNode(0, pickType(0), true, true),
    makeNode(0, pickType(0), true, true),
    makeNode(0, pickType(0), true, true),
  ];
  // Assign directions
  firstRow[0].lane = 'left';
  firstRow[1].lane = 'mid';
  firstRow[2].lane = 'right';

  // Steps 1–9: build row by row
  // Each completed node from the previous row links to nodes in the current row.
  // The current row has 2 or 3 nodes (70% chance of 3).
  // Children are NOT unlocked/revealed until the parent is completed.

  let prevRow = firstRow;

  for (let step = 1; step < STEPS; step++) {
    const count    = Math.random() < 0.70 ? 3 : 2;
    const currRow  = [];

    for (let c = 0; c < count; c++) {
      const n  = makeNode(step, pickType(step));
      n.lane   = count === 3 ? (['left','mid','right'][c]) : (['left','right'][c]);
      currRow.push(n);
    }

    // Every node in prevRow links to ALL nodes in currRow.
    // This ensures that no matter which choice was made, the next step
    // always has count choices available after completeNode runs.
    // Branches change which encounters are available one step ahead.
    prevRow.forEach((p, i) => {
      const choices = count === 3 ? [[0,1],[1,2],[0,2]][i % 3] : (i % 3 === 1 ? [0,1] : [i % 2]);
      choices.forEach(c => p.links.push(currRow[c].idx));
    });

    prevRow = currRow;
  }

  // Boss node — step 10, always revealed so it shows boss_icon not mystery
  const bossNode        = makeNode(STEPS, 'boss', false, true);
  bossNode.lane         = 'mid';
  bossNode.bossIndex    = bi;
  prevRow.forEach(p => p.links.push(bossNode.idx));

  // ── Inject special mini-game nodes ───────────────────────────────────────
  // After defeating Brock (bi>=1), guarantee one cooking node in row 0.
  // bi===0 is the very first map (before any boss) — no cooking there.
  if (bi >= 1) {
    const cookIdx = Math.floor(Math.random() * firstRow.length);
    firstRow[cookIdx].type = 'cooking';
  }
  // ── FISHING MINI-GAME — inject fishing node after Misty (bi>=2) ───────────
  if (bi >= 2) {
    const free = firstRow.filter(n => n.type !== 'cooking');
    if (free.length > 0) {
      free[Math.floor(Math.random() * free.length)].type = 'fishing';
    }
  }

  // ── MINI-GAME GUARANTEED NODES ────────────────────────────────────────────
  // Load which mini-games are unlocked for this profile.
  // First run: unlocked progressively by boss defeats.
  // Recurring runs (completedWith.length > 0): all unlocked from bi=0.
  {
    const unlocks   = loadUnlocks();
    const isReturning = (unlocks.completedWith?.length || 0) > 0;

    // Build the full schedule — which mini-game maps to which node type and row.
    // Officer Jenny appears mid-map (row 5 ±1) in BOTH regions so the player has
    // nodes left afterward to benefit from her "no Team Rocket" patrol shield.
    const jennyRow = 5 + (Math.floor(Math.random() * 3) - 1);   // 4, 5, or 6
    const KANTO_MG_SCHEDULE = [
      { key:'jigglypuff', type:'jigglypuff_node', row:3, minBi:2 },
      { key:'surge',      type:'surge_node',      row:2, minBi:3 },
      { key:'erika',      type:'erika_node',      row:2, minBi:4 },
      { key:'ninja',      type:'ninja_node',       row:2, minBi:5 },
      { key:'sabrina',    type:'sabrina_node',    row:2, minBi:6 },
      { key:'blaine',     type:'blaine_node',     row:2, minBi:7 },
      { key:'jenny',      type:'jenny_node',      row:jennyRow, minBi:1 },
    ];
    const JOHTO_MG_SCHEDULE = [
      { key:'bugsy',   type:'bugsy_node',   row:2, minBi:1 },
      { key:'whitney', type:'whitney_node', row:3, minBi:2 },
      { key:'morty',   type:'morty_node',   row:2, minBi:3 },
      { key:'chuck',   type:'chuck_node',   row:2, minBi:4 },
      { key:'jasmine', type:'jasmine_node', row:2, minBi:5 },
      { key:'pryce',   type:'pryce_node',   row:2, minBi:6 },
      { key:'clair',   type:'clair_node',   row:3, minBi:7 },
      { key:'falkner', type:'falkner_node', row:2, minBi:0 },
      { key:'togepi',  type:'togepi_node',  row:3, minBi:2 },
      { key:'jenny',   type:'jenny_node',   row:jennyRow, minBi:1 },
    ];
    const MG_SCHEDULE = GameState?.region === 'johto' ? JOHTO_MG_SCHEDULE : KANTO_MG_SCHEDULE;

    // Determine which are available this map
    const available = MG_SCHEDULE.filter(mg => {
      if (bi < mg.minBi) return false;
      return isReturning || unlocks.miniGamesUnlocked.includes(mg.key);
    });

    if (available.length > 0) {
      // Shuffle and pick 1–3 (weighted: 50% = 1, 35% = 2, 15% = 3)
      const shuffled = shuffle([...available]);
      const r        = Math.random();
      const count    = r < 0.50 ? 1 : r < 0.85 ? 2 : Math.min(3, shuffled.length);
      const chosen   = shuffled.slice(0, count);

      chosen.forEach(mg => {
        // Find a node at the target row that isn't already a special type
        const candidates = nodes.filter(n =>
          n.row === mg.row &&
          !['cooking','fishing','boss','jigglypuff_node','surge_node',
            'erika_node','ninja_node','sabrina_node','blaine_node',
            'falkner_node','bugsy_node','whitney_node','morty_node',
            'jasmine_node','pryce_node','clair_node','chuck_node','togepi_node','jenny_node'].includes(n.type)
        );
        if (candidates.length > 0) {
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          target.type   = mg.type;
          target.isNew  = !unlocks.miniGamesIntroduced?.includes(mg.key);
          // Mark as introduced
          if (!unlocks.miniGamesIntroduced) unlocks.miniGamesIntroduced = [];
          if (!unlocks.miniGamesIntroduced.includes(mg.key)) {
            unlocks.miniGamesIntroduced.push(mg.key);
            saveUnlocks(unlocks);
          }
        }
      });
    }
  }

  // ── CHALLENGE NODE — player-choice mini-game, once per map ──────────────
  // Appears at row 5 from bi>=3 (at least 2 mini-games unlocked).
  // On returning runs also injects a second one at row 8.
  {
    const unlocks     = loadUnlocks();
    const isReturning = (unlocks.completedWith?.length || 0) > 0;
    const SPECIAL     = ['cooking','fishing','boss','challenge',
                         'jigglypuff_node','surge_node','erika_node',
                         'ninja_node','sabrina_node','blaine_node',
                         'falkner_node','bugsy_node','whitney_node','morty_node',
                         'jasmine_node','pryce_node','clair_node','chuck_node','togepi_node','jenny_node'];

    const injectChallenge = (row) => {
      const cands = nodes.filter(n => n.row === row && !SPECIAL.includes(n.type));
      if (cands.length > 0) {
        cands[Math.floor(Math.random() * cands.length)].type = 'challenge';
      }
    };

    if (bi >= 3) {
      injectChallenge(5);
      if (isReturning) injectChallenge(8);
    }

    // ── GIOVANNI NODE — Rocket's Ledger money game, from bi>=8 ───────────────
    if (bi >= 8 || isReturning) {
      const SPEC2 = [...SPECIAL, 'challenge'];
      const gcands = nodes.filter(n => n.row === 6 && !SPEC2.includes(n.type));
      if (gcands.length > 0)
        gcands[Math.floor(Math.random() * gcands.length)].type = 'giovanni_node';
    }
  }
  // Uses a regular catch node with 'legendary' rarity — no separate engine needed.
  if (bi >= 6) {
    const step7nodes = nodes.filter(n => n.row === 7);
    if (step7nodes.length > 0) {
      const legendaryNode = step7nodes[Math.floor(Math.random() * step7nodes.length)];
      legendaryNode.type        = 'catch';
      legendaryNode.catchRarity = 'legendary';
    }
  }

  // ── Assign catch rarity to catch nodes — stored so map shows glow before visit
  const rarityRoll = () => {
    const r = Math.random();
    if (r < 0.60)  return 'common';
    if (r < 0.90)  return 'uncommon';
    return 'rare';
  };
  nodes.forEach(n => {
    if (n.type === 'catch' && !n.catchRarity) n.catchRarity = rarityRoll();
    if (n.type === 'legendary') n.catchRarity = 'legendary';
  });

  nodes._bossIndex = bi;
  return nodes;
}

// ─── ACTIVE ENGINE REGISTRY ───────────────────────────────────────────────────
// Single registry replaces the 9-item _isActive if-chain on btn-start-boss-battle.
// Each mini-game engine calls ActiveEngine.set(this) in start() and
// ActiveEngine.clear() in startGame(). The button handler calls ActiveEngine.go().

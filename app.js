/* ═══════════════════════════════════════════
   POKÉROGUE — app.js
   Full game logic: Map, Battle, Catch, Train, Heal, Boss, Evolve
═══════════════════════════════════════════ */

'use strict';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const POKEAPI = 'https://pokeapi.co/api/v2';

const STARTERS = [
  { id: 1,  name: 'Bulbasaur',  type: 'grass',    evolutions: [1,2,3] },
  { id: 4,  name: 'Charmander', type: 'fire',     evolutions: [4,5,6] },
  { id: 7,  name: 'Squirtle',   type: 'water',    evolutions: [7,8,9] },
  { id: 25, name: 'Pikachu',    type: 'electric', evolutions: [25,26,26], locked: true },
];

const BOSS_TRAINERS = [
  {
    name: 'Brock',
    dialogue: "I've been the best gym leader since before you were hatched! Let's rock!",
    team: [74, 95], // Geodude, Onix
  },
  {
    name: 'Misty',
    dialogue: "Don't go easy on me just 'cause I'm cute! My Pokémon are FIERCE!",
    team: [120, 121, 54], // Staryu, Starmie, Psyduck
  },
  {
    name: 'Giovanni',
    dialogue: "Hmph. A child? No matter — my Pokémon shall crush yours like pebbles!",
    team: [111, 112, 68, 103], // Rhyhorn, Rhydon, Machamp, Exeggutor
  },
];

const NODE_TYPES = ['battle', 'heal', 'catch', 'training'];
const NODE_ICONS = { battle: '⚔️', heal: '💚', catch: '🔵', training: '⚡', boss: '💀' };

// Card templates keyed by starter type
const CARD_TEMPLATES = {
  grass: [
    { id:'tackle',      name:'Tackle',       icon:'💥', type:'normal',  power:40,  effect:'',                          special: null },
    { id:'growl',       name:'Growl',        icon:'🗣️', type:'normal',  power:0,   effect:'Opp ATK -10 next turn',    special: 'debuff_atk' },
    { id:'vine_whip',   name:'Vine Whip',    icon:'🌿', type:'grass',   power:45,  effect:'',                          special: null },
    { id:'absorb',      name:'Absorb',       icon:'🌱', type:'grass',   power:30,  effect:'Heal 10 HP',                special: 'heal_10' },
    { id:'razor_leaf',  name:'Razor Leaf',   icon:'🍃', type:'grass',   power:55,  effect:'High crit rate',            special: 'high_crit' },
    { id:'sleep_powder',name:'Sleep Powder', icon:'💤', type:'grass',   power:0,   effect:'Skip opp next turn',        special: 'skip_opp' },
    { id:'leech_seed',  name:'Leech Seed',   icon:'🌾', type:'grass',   power:20,  effect:'Drain 15/turn for 3 turns', special: 'leech' },
    { id:'synthesis',   name:'Synthesis',    icon:'☀️', type:'grass',   power:0,   effect:'Heal 25 HP + draw 1',       special: 'heal_25_draw' },
    { id:'solar_beam',  name:'Solar Beam',   icon:'🌟', type:'grass',   power:80,  effect:'Powerhouse!',               special: null },
    { id:'poison_powder',name:'Pois. Powder',icon:'☠️', type:'poison',  power:0,   effect:'Poison: 15 dmg/turn',      special: 'poison' },
  ],
  fire: [
    { id:'tackle',      name:'Tackle',       icon:'💥', type:'normal',  power:40,  effect:'',                          special: null },
    { id:'growl',       name:'Growl',        icon:'🗣️', type:'normal',  power:0,   effect:'Opp ATK -10 next turn',    special: 'debuff_atk' },
    { id:'ember',       name:'Ember',        icon:'🔥', type:'fire',    power:40,  effect:'10% burn: 10 dmg/turn',     special: 'burn_chance' },
    { id:'scratch',     name:'Scratch',      icon:'🐾', type:'normal',  power:35,  effect:'Draw 1 card',               special: 'draw_1' },
    { id:'flamethrower',name:'Flamethrower', icon:'🌋', type:'fire',    power:60,  effect:'',                          special: null },
    { id:'smokescreen', name:'Smokescreen',  icon:'💨', type:'normal',  power:0,   effect:'Opp accuracy -25% next',    special: 'debuff_acc' },
    { id:'dragon_rage', name:'Dragon Rage',  icon:'🐉', type:'fire',    power:50,  effect:'',                          special: null },
    { id:'inferno',     name:'Inferno',      icon:'🌠', type:'fire',    power:35,  effect:'Burn guaranteed',           special: 'burn' },
    { id:'fire_blast',  name:'Fire Blast',   icon:'💫', type:'fire',    power:90,  effect:'Rare powerhouse!',          special: null },
    { id:'slash',       name:'Slash',        icon:'⚡', type:'normal',  power:45,  effect:'Always crits',              special: 'always_crit' },
  ],
  water: [
    { id:'tackle',      name:'Tackle',       icon:'💥', type:'normal',  power:40,  effect:'',                          special: null },
    { id:'growl',       name:'Growl',        icon:'🗣️', type:'normal',  power:0,   effect:'Opp ATK -10 next turn',    special: 'debuff_atk' },
    { id:'water_gun',   name:'Water Gun',    icon:'💧', type:'water',   power:40,  effect:'',                          special: null },
    { id:'shell_armor', name:'Shell Armor',  icon:'🐢', type:'water',   power:0,   effect:'Block 20 dmg + draw 1',     special: 'shield_draw' },
    { id:'bubble',      name:'Bubble',       icon:'🫧', type:'water',   power:30,  effect:'Slow opp: extra turn',      special: 'slow_opp' },
    { id:'withdraw',    name:'Withdraw',     icon:'🛡️', type:'water',   power:0,   effect:'Block 35 dmg next hit',     special: 'shield_35' },
    { id:'bite',        name:'Bite',         icon:'🦷', type:'normal',  power:50,  effect:'May flinch',                special: 'flinch' },
    { id:'rain_dance',  name:'Rain Dance',   icon:'🌧️', type:'water',   power:0,   effect:'Water moves +20% for 3t',  special: 'rain' },
    { id:'hydro_pump',  name:'Hydro Pump',   icon:'🌊', type:'water',   power:85,  effect:'Rare powerhouse!',          special: null },
    { id:'aqua_tail',   name:'Aqua Tail',    icon:'🐟', type:'water',   power:55,  effect:'',                          special: null },
  ],
  electric: [
    { id:'tackle',       name:'Tackle',       icon:'💥', type:'normal',   power:40, effect:'',                          special: null },
    { id:'growl',        name:'Growl',        icon:'🗣️', type:'normal',   power:0,  effect:'Opp ATK -10 next turn',    special: 'debuff_atk' },
    { id:'thundershock', name:'ThunderShock', icon:'⚡', type:'electric', power:40, effect:'10% paralyse',              special: 'para_chance' },
    { id:'quick_attack', name:'Quick Attack', icon:'💨', type:'normal',   power:35, effect:'Always goes first',         special: 'draw_1' },
    { id:'thunder_wave', name:'Thunder Wave', icon:'🌩️', type:'electric', power:0,  effect:'Paralyse opp',             special: 'paralyse' },
    { id:'spark',        name:'Spark',        icon:'🔆', type:'electric', power:45, effect:'',                          special: null },
    { id:'agility',      name:'Agility',      icon:'🏃', type:'normal',   power:0,  effect:'+1 action this turn',       special: 'bonus_action' },
    { id:'volt_tackle',  name:'Volt Tackle',  icon:'⚡', type:'electric', power:70, effect:'Recoil 15 HP',              special: 'recoil_15' },
    { id:'thunder',      name:'Thunder',      icon:'🌪️', type:'electric', power:90, effect:'30% paralyse',             special: null },
    { id:'iron_tail',    name:'Iron Tail',    icon:'🔩', type:'normal',   power:55, effect:'May lower opp DEF',         special: 'debuff_def' },
  ],
};

// Standard deck for caught Pokémon (8 generic + 2 type-specific placeholders)
// Index 0-7 are generic, index 8-9 are type-specific (filled by buildPokemonDeck)
const STANDARD_CARDS = [
  { id:'tackle',   name:'Tackle',    icon:'💥', type:'normal', power:40, effect:'',                    special: null },
  { id:'tackle',   name:'Tackle',    icon:'💥', type:'normal', power:40, effect:'',                    special: null },
  { id:'growl',    name:'Growl',     icon:'🗣️', type:'normal', power:0,  effect:'Opp ATK -10',         special: 'debuff_atk' },
  { id:'scratch',  name:'Scratch',   icon:'🐾', type:'normal', power:35, effect:'Draw 1 card',          special: 'draw_1' },
  { id:'headbutt', name:'Headbutt',  icon:'💫', type:'normal', power:50, effect:'',                    special: null },
  { id:'leer',     name:'Leer',      icon:'👁️', type:'normal', power:0,  effect:'Opp DEF -10',         special: 'debuff_def' },
  { id:'bite',     name:'Bite',      icon:'🦷', type:'normal', power:45, effect:'May flinch',           special: 'flinch' },
  { id:'swift',    name:'Swift',     icon:'⭐', type:'normal', power:40, effect:'Never misses',         special: null },
];

// 2 type-specific cards per type for caught Pokémon
const TYPE_SIGNATURE_CARDS = {
  fire:     [
    { id:'ember',        name:'Ember',       icon:'🔥', type:'fire',     power:40, effect:'10% burn',           special: 'burn_chance' },
    { id:'flamethrower', name:'Flamethrower',icon:'🌋', type:'fire',     power:60, effect:'',                   special: null },
  ],
  water:    [
    { id:'water_gun',    name:'Water Gun',   icon:'💧', type:'water',    power:40, effect:'',                   special: null },
    { id:'bubble',       name:'Bubble',      icon:'🫧', type:'water',    power:30, effect:'May slow opp',        special: 'slow_opp' },
  ],
  grass:    [
    { id:'vine_whip',    name:'Vine Whip',   icon:'🌿', type:'grass',    power:45, effect:'',                   special: null },
    { id:'absorb',       name:'Absorb',      icon:'🌱', type:'grass',    power:30, effect:'Heal 10 HP',          special: 'heal_10' },
  ],
  electric: [
    { id:'thundershock', name:'ThunderShock',icon:'⚡', type:'electric', power:40, effect:'10% paralyse',        special: 'para_chance' },
    { id:'spark',        name:'Spark',       icon:'🔆', type:'electric', power:45, effect:'',                   special: null },
  ],
  psychic:  [
    { id:'confusion',    name:'Confusion',   icon:'🌀', type:'psychic',  power:40, effect:'May confuse',         special: 'debuff_atk' },
    { id:'psybeam',      name:'Psybeam',     icon:'💜', type:'psychic',  power:50, effect:'',                   special: null },
  ],
  rock:     [
    { id:'rock_throw',   name:'Rock Throw',  icon:'🪨', type:'rock',     power:45, effect:'',                   special: null },
    { id:'rollout',      name:'Rollout',     icon:'⚙️', type:'rock',     power:40, effect:'Hits hard',           special: null },
  ],
  ground:   [
    { id:'mud_slap',     name:'Mud Slap',    icon:'🟫', type:'ground',   power:30, effect:'Opp accuracy -15',   special: 'debuff_acc' },
    { id:'dig',          name:'Dig',         icon:'⛏️', type:'ground',    power:55, effect:'',                   special: null },
  ],
  poison:   [
    { id:'poison_sting', name:'Poison Sting',icon:'☠️', type:'poison',   power:35, effect:'30% poison',          special: 'poison' },
    { id:'acid',         name:'Acid',        icon:'🧪', type:'poison',   power:40, effect:'May lower DEF',       special: 'debuff_def' },
  ],
  normal:   [
    { id:'double_slap',  name:'Double Slap', icon:'👋', type:'normal',   power:45, effect:'',                   special: null },
    { id:'body_slam',    name:'Body Slam',   icon:'🏋️', type:'normal',   power:55, effect:'May paralyse',        special: 'para_chance' },
  ],
  flying:   [
    { id:'gust',         name:'Gust',        icon:'🌬️', type:'flying',   power:40, effect:'',                   special: null },
    { id:'wing_attack',  name:'Wing Attack', icon:'🦅', type:'flying',   power:50, effect:'',                   special: null },
  ],
  ice:      [
    { id:'ice_shard',    name:'Ice Shard',   icon:'❄️', type:'ice',      power:40, effect:'Always first',        special: null },
    { id:'blizzard',     name:'Blizzard',    icon:'🌨️', type:'ice',      power:60, effect:'',                   special: null },
  ],
  fighting: [
    { id:'karate_chop',  name:'Karate Chop', icon:'🥊', type:'fighting', power:45, effect:'High crit',           special: 'high_crit' },
    { id:'low_kick',     name:'Low Kick',    icon:'🦵', type:'fighting', power:50, effect:'',                   special: null },
  ],
  ghost:    [
    { id:'lick',         name:'Lick',        icon:'👻', type:'ghost',    power:30, effect:'30% paralyse',        special: 'para_chance' },
    { id:'shadow_ball',  name:'Shadow Ball', icon:'🌑', type:'ghost',    power:55, effect:'',                   special: null },
  ],
  dragon:   [
    { id:'dragon_rage',  name:'Dragon Rage', icon:'🐉', type:'dragon',   power:50, effect:'',                   special: null },
    { id:'twister',      name:'Twister',     icon:'🌪️', type:'dragon',   power:40, effect:'May flinch',          special: 'flinch' },
  ],
};

// Build a deck for a caught (non-starter) Pokémon
function buildPokemonDeck(type) {
  const typeSig = TYPE_SIGNATURE_CARDS[type] || TYPE_SIGNATURE_CARDS.normal;
  return [
    ...STANDARD_CARDS.map(c => ({ ...c })),
    ...typeSig.map(c => ({ ...c })),
  ];
}

// Default starter deck: indices into CARD_TEMPLATES[type]
// 3×tackle, 1×growl, 3×type[2], 2×type[3..4], 1×type[8]
const DEFAULT_DECK_INDICES = [0,0,0,1,2,2,2,3,4,8];

// Common wild Pokémon pool (ids)
const WILD_POOL = {
  common: [19,16,10,13,21,41,43,46,48,60,63,66,69,72,74,77,79,81,84,86,88,90,92,95,96,98,100,102,104,108,111,113,114,116,118,120],
  uncommon: [23,27,29,32,37,50,52,54,56,58,88,90,92,95,109,115,117,119,121,122,123,124,125,126,127,128,129,130,131,132,133,136,137,138,140,142],
  rare: [131,130,142,149,143,6,9,3,65,68,71,76,78,80,82,83,85,87,89,91,93,94,97,99,101,103,105,107,110,112],
};

// ─── SAVE / LOAD ──────────────────────────────────────────────────────────────

const SAVE_KEY        = 'pokerogue_save_v1';
const UNLOCK_KEY      = 'pokerogue_unlocks_v1';

function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(GameState)); } catch(e) {}
}
function loadGame() {
  try {
    const d = localStorage.getItem(SAVE_KEY);
    return d ? JSON.parse(d) : null;
  } catch(e) { return null; }
}
function deleteSave() { localStorage.removeItem(SAVE_KEY); }

// Unlocks persist independently of individual runs
function loadUnlocks() {
  try {
    const d = localStorage.getItem(UNLOCK_KEY);
    return d ? JSON.parse(d) : { pikachu: false };
  } catch(e) { return { pikachu: false }; }
}
function saveUnlocks(unlocks) {
  try { localStorage.setItem(UNLOCK_KEY, JSON.stringify(unlocks)); } catch(e) {}
}

// ─── GAME STATE ───────────────────────────────────────────────────────────────

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
  };
}

// ─── POKÉMON INSTANCE ────────────────────────────────────────────────────────

function makePokemon(id, level, spriteUrl, name, type, isStarter = false) {
  const maxHp = 80 + level * 8 + (isStarter ? 20 : 0);
  const deck = isStarter ? null : buildPokemonDeck(type); // starters get deck set separately
  return { id, name, type, level, maxHp, hp: maxHp, spriteUrl, isStarter, statusEffects: [], deck };
}

// ─── DECK BUILDER ────────────────────────────────────────────────────────────

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

function generateMap() {
  /*
    Layout inspired by the reference: two columns of nodes arranged in a
    diamond/zigzag pattern. Each "row" alternates between wide (A+B side by side)
    and narrow (centre merge) to create diagonal crossing paths.

    Structure per segment (10 nodes per path + 1 boss):
      Row 0: A(left)  B(right)          — both unlocked at start
      Row 1:    C(centre)               — cross-over node between A&B
      Row 2: D(left)  E(right)
      Row 3:    F(centre)
      Row 4: G(left)  H(right)
      Row 5:    I(centre)
      Row 6: J(left)  K(right)
      Row 7:    L(centre)
      Row 8: M(left)  N(right)
      Row 9:    O(centre)
      Row 10:   BOSS (centre)

    Links: each side node links to the centre below AND to the opposite side below-centre.
           Each centre node links to BOTH side nodes below it.
    This creates the X-shaped diamond crossing seen in the reference.
  */

  function makeTypes() {
    // 10 nodes per full path-column; balance across the zigzag
    const t = ['battle','battle','battle','battle','battle','heal','heal','catch','catch','training'];
    return t.sort(() => Math.random() - .5);
  }

  const allTypes = makeTypes(); // 10 types for the 10 non-boss non-start positions
  let typeIdx = 0;
  const nextType = () => allTypes[typeIdx++ % allTypes.length];

  const nodes = [];
  let idx = 0;

  // Layout: alternating wide rows (2 nodes) and narrow rows (1 node)
  // 5 wide rows + 5 narrow rows = 10 non-boss nodes, then boss
  const WIDE_ROWS  = 5;  // rows with 2 nodes side by side
  const TOTAL_ROWS = 11; // 5 wide + 5 narrow + 1 boss

  // x positions for left/right in wide rows — add jitter for organic feel
  function jitter(base, amount = 0.06) {
    return base + (Math.random() * 2 - 1) * amount;
  }

  const layoutRows = [];

  for (let r = 0; r < WIDE_ROWS; r++) {
    const yWide   = (r * 2 + 1) / (TOTAL_ROWS);
    const yNarrow = (r * 2 + 2) / (TOTAL_ROWS);

    // Wide row: left + right
    layoutRows.push([
      { x: jitter(0.22, 0.05), y: yWide,   type: nextType() },
      { x: jitter(0.78, 0.05), y: yWide,   type: nextType() },
    ]);
    // Narrow row: centre
    if (r < WIDE_ROWS - 1) {  // last wide row links directly to boss
      layoutRows.push([
        { x: jitter(0.50, 0.04), y: yNarrow, type: nextType() },
      ]);
    }
  }

  // Boss row
  layoutRows.push([
    { x: 0.50, y: (TOTAL_ROWS - 1) / TOTAL_ROWS, type: 'boss' },
  ]);

  // Flatten into nodes array
  const rowStartIdx = [];
  layoutRows.forEach((row, ri) => {
    rowStartIdx.push(nodes.length);
    row.forEach((spec, ni) => {
      nodes.push({
        idx,
        row: ri,
        col: ni,
        type: spec.type,
        x: spec.x,
        y: spec.y,
        unlocked: ri === 0,   // first row unlocked
        done: false,
        links: [],
      });
      idx++;
    });
  });

  // Build links: each node links to ALL nodes in the next layout row
  layoutRows.forEach((row, ri) => {
    if (ri >= layoutRows.length - 1) return; // boss has no children
    const nextRow = layoutRows[ri + 1];
    const curStart  = rowStartIdx[ri];
    const nextStart = rowStartIdx[ri + 1];

    row.forEach((_, ni) => {
      const fromNode = nodes[curStart + ni];
      nextRow.forEach((_, nni) => {
        const toIdx = nextStart + nni;
        if (!fromNode.links.includes(toIdx)) fromNode.links.push(toIdx);
      });
    });
  });

  // Boss node is always index of the last node
  const bossNode = nodes[nodes.length - 1];
  bossNode.bossIndex = Math.min(GameState?.bossesDefeated ?? 0, 2);

  return nodes;
}

// ─── SCREEN MANAGER ──────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

function showLoading() { document.getElementById('loading-overlay').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loading-overlay').classList.add('hidden'); }

function showModal(title, body, cb) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('overlay').classList.remove('hidden');
  document.getElementById('modal-ok').onclick = () => {
    document.getElementById('overlay').classList.add('hidden');
    if (cb) cb();
  };
}

function closeModal() {
  document.getElementById('overlay').classList.add('hidden');
}

// ─── POKEAPI HELPERS ─────────────────────────────────────────────────────────

const _apiCache = {};
async function fetchPoke(id) {
  if (_apiCache[id]) return _apiCache[id];
  const r = await fetch(`${POKEAPI}/pokemon/${id}`);
  const d = await r.json();
  _apiCache[id] = d;
  return d;
}

function getSpriteUrl(data, front = true) {
  // Priority order: official artwork → home sprite → default sprite → gen-1 sprite
  // Asset slot: override with /assets/sprites/{id}.png
  if (!data) return '';
  const s = data.sprites;
  if (front) {
    return s?.other?.['official-artwork']?.front_default
        || s?.other?.home?.front_default
        || s?.front_default
        || s?.versions?.['generation-i']?.['red-blue']?.front_default
        || '';
  } else {
    return s?.back_default
        || s?.other?.['official-artwork']?.front_default   // back rarely exists, use front
        || s?.front_default
        || '';
  }
}

// Load an image with a fallback chain — sets src to the first URL that loads.
// If all fail, calls onAllFail().
function loadImageWithFallback(imgEl, urls, onAllFail) {
  const queue = urls.filter(Boolean); // remove nulls/empty strings
  if (queue.length === 0) { onAllFail(); return; }
  const tryNext = () => {
    if (queue.length === 0) { onAllFail(); return; }
    const url = queue.shift();
    imgEl.onerror = tryNext;
    imgEl.src = url;
  };
  tryNext();
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

// ─── TYPE EFFECTIVENESS ───────────────────────────────────────────────────────
// Returns damage multiplier for attacking type vs defending type
const TYPE_CHART = {
  normal:   { rock:.5, ghost:0, steel:.5 },
  fire:     { fire:.5, water:.5, rock:.5, dragon:.5, grass:2, ice:2, bug:2, steel:2 },
  water:    { water:.5, grass:.5, dragon:.5, fire:2, ground:2, rock:2 },
  grass:    { fire:.5, grass:.5, poison:.5, flying:.5, bug:.5, dragon:.5, steel:.5, water:2, ground:2, rock:2 },
  electric: { grass:.5, electric:.5, dragon:.5, ground:0, water:2, flying:2 },
  ice:      { water:.5, ice:.5, fire:.5, steel:.5, grass:2, ground:2, flying:2, dragon:2 },
  fighting: { poison:.5, bug:.5, psychic:.5, flying:.5, fairy:.5, ghost:0, normal:2, ice:2, rock:2, dark:2, steel:2 },
  poison:   { poison:.5, ground:.5, rock:.5, ghost:.5, steel:0, grass:2, fairy:2 },
  ground:   { grass:.5, bug:.5, flying:0, fire:2, electric:2, poison:2, rock:2, steel:2 },
  flying:   { electric:.5, rock:.5, steel:.5, grass:2, fighting:2, bug:2 },
  psychic:  { psychic:.5, steel:.5, dark:0, fighting:2, poison:2 },
  bug:      { fire:.5, fighting:.5, flying:.5, ghost:.5, steel:.5, fairy:.5, grass:2, psychic:2, dark:2 },
  rock:     { fighting:.5, ground:.5, steel:.5, fire:2, ice:2, flying:2, bug:2 },
  ghost:    { normal:0, dark:.5, ghost:2, psychic:2 },
  dragon:   { steel:.5, fairy:0, dragon:2 },
  dark:     { fighting:.5, dark:.5, fairy:.5, ghost:2, psychic:2 },
  steel:    { fire:.5, water:.5, electric:.5, steel:.5, ice:2, rock:2, fairy:2 },
  fairy:    { fire:.5, poison:.5, steel:.5, fighting:2, dragon:2, dark:2 },
};

function getTypeMultiplier(attackType, defendType) {
  if (!attackType || !defendType) return 1;
  return TYPE_CHART[attackType]?.[defendType] ?? 1;
}

function typeEffectivenessLabel(mult) {
  if (mult === 0)   return { text: 'No effect!',    color: '#888' };
  if (mult >= 2)    return { text: 'Super effective!', color: '#FFD700' };
  if (mult <= 0.5)  return { text: 'Not very effective…', color: '#aaa' };
  return null; // normal — show nothing extra
}

// ─── GAME CONTROLLER ─────────────────────────────────────────────────────────

const Game = {

  async startNew() {
    deleteSave();
    const unlocks = loadUnlocks();
    GameState = {
      starterId: null,
      starterType: null,
      evolutionStage: 0,
      bossesDefeated: 0,
      party: [],
      activePokemonIndex: 0,
      deck: [],
      improvementMap: {},
      map: null,
      currentNodeIndex: null,
      completedNodes: [],
      highWaterRow: -1,
      unlockedPikachu: unlocks.pikachu,   // ← persists across runs
      stats: { battlesWon: 0, pokemonCaught: 0 },
    };
    await this.showStarterSelect();
  },

  continueGame() {
    const saved = loadGame();
    if (!saved) {
      showModal('No Save Found', 'Start a New Game first!');
      return;
    }
    GameState = saved;
    MapEngine.show();
  },

  async showStarterSelect() {
    showScreen('starter');
    const grid = document.getElementById('starter-grid');
    grid.innerHTML = '';

    for (const s of STARTERS) {
      const data = await fetchPoke(s.id).catch(() => null);
      const sprite = data ? getSpriteUrl(data) : '';
      const locked = s.locked && !GameState.unlockedPikachu;

      const card = document.createElement('div');
      card.className = 'starter-card';
      card.dataset.id = s.id;
      card.dataset.type = s.type;
      card.innerHTML = `
        <img class="starter-sprite" src="${sprite}" alt="${s.name}"
             onerror="this.src='assets/sprites/${s.id}.png'" />
        <div class="starter-name">${s.name}</div>
        <div class="starter-type-badge type-${s.type}">${s.type}</div>
        <div class="starter-desc">${StarterDescs[s.name]||''}</div>
        ${locked ? `<div class="starter-locked">
          <div class="starter-locked-icon">🔒</div>
          <div class="starter-locked-text">Complete game<br>to unlock!</div>
        </div>` : ''}
      `;
      if (!locked) {
        card.onclick = () => this.selectStarter(card, s);
      }
      grid.appendChild(card);
    }
  },

  _selectedStarter: null,
  selectStarter(card, s) {
    document.querySelectorAll('.starter-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    this._selectedStarter = s;
    document.getElementById('starter-confirm').style.display = 'flex';
    document.getElementById('btn-confirm-starter').onclick = () => this.confirmStarter(s);
  },

  async confirmStarter(s) {
    showLoading();
    const data = await fetchPoke(s.id);
    const sprite = getSpriteUrl(data);
    const pokemon = makePokemon(s.id, 5, sprite, s.name, s.type, true);
    const starterDeck = buildDeck(s.type, {});
    pokemon.deck = starterDeck;            // starter carries its own deck
    GameState.starterId      = s.id;
    GameState.starterType    = s.type;
    GameState.party          = [pokemon];
    GameState.activePokemonIndex = 0;
    GameState.deck           = starterDeck; // active deck mirrors active pokemon
    GameState.improvementMap = {};
    GameState.map            = null;
    GameState.map            = generateMap();
    GameState.completedNodes = [];
    GameState.bossesDefeated = 0;
    GameState.evolutionStage = 0;
    hideLoading();
    MapEngine.show();
  },

  returnToStart() {
    deleteSave();
    GameState = null;
    showScreen('start');
  },

  async afterBoss(bossIndex) {
    GameState.bossesDefeated++;

    // ── Game won after 3rd boss — no more evolutions, go straight to victory ──
    if (GameState.bossesDefeated >= 3) {
      GameState.unlockedPikachu = true;
      saveUnlocks({ pikachu: true });   // ← persists across new game runs
      saveGame();
      VictoryEngine.show();
      return;
    }

    // ── Bosses 1 & 2: evolve the starter then show the next map ──
    const starter  = STARTERS.find(s => s.id === GameState.starterId);
    const newStage = GameState.evolutionStage + 1;
    GameState.evolutionStage = newStage;

    const beforeId = starter.evolutions[newStage - 1];
    const afterId  = starter.evolutions[newStage];

    showScreen('evolve');
    await EvolveEngine.run(beforeId, afterId, () => {
      // Update starter in party
      const idx = GameState.party.findIndex(p => p.isStarter);
      if (idx >= 0) {
        GameState.party[idx].id = afterId;
        fetchPoke(afterId).then(d => {
          GameState.party[idx].name      = capitalize(d.name);
          GameState.party[idx].spriteUrl = getSpriteUrl(d);
          GameState.party[idx].maxHp    += 20;
          GameState.party[idx].hp        = GameState.party[idx].maxHp;
        });
      }
      // Generate next map segment
      GameState.map = generateMap();
      GameState.map.forEach(n => {
        if (n.type === 'boss') n.bossIndex = Math.min(GameState.bossesDefeated, 2);
      });
      GameState.completedNodes = [];
      GameState.highWaterRow   = -1;
      saveGame();
      MapEngine.show();
    });
  },

  afterEvolve() {
    // handled by EvolveEngine callback
  },
};

const StarterDescs = {
  Bulbasaur:  'A seed Pokémon. Calm and strategic, drains foes with vines.',
  Charmander: 'A flame Pokémon. Fierce attacker with burning passion.',
  Squirtle:   'A tiny turtle. Defensive master with watery comebacks.',
  Pikachu:    'An electric mouse. Lightning fast with shocking combos.',
};

// ─── PARTY OVERVIEW ──────────────────────────────────────────────────────────

const PartyOverview = {
  _dragSrcIdx: null,

  open() {
    this._render();
    document.getElementById('party-drawer').classList.remove('hidden');
  },

  close() {
    document.getElementById('party-drawer').classList.add('hidden');
    // Refresh map party bar after any reordering
    MapEngine.renderParty();
    saveGame();
  },

  _render() {
    const list = document.getElementById('party-drawer-list');
    list.innerHTML = '';

    GameState.party.forEach((p, i) => {
      const row = document.createElement('div');
      row.className = 'party-row' + (i === GameState.activePokemonIndex ? ' party-row-active' : '') + (p.hp <= 0 ? ' party-row-fainted' : '');
      row.draggable = true;
      row.dataset.idx = i;

      const hpPct    = Math.round(p.hp / p.maxHp * 100);
      const hpCol    = hpColor(p.hp, p.maxHp);
      const cardCount = (p.deck || []).length;
      const position  = i === 0 ? '1st — leads battle' : i === GameState.activePokemonIndex ? 'Active' : `#${i + 1}`;

      row.innerHTML = `
        <div class="party-row-drag-handle" title="Drag to reorder">⠿</div>
        <div class="party-row-sprite-wrap">
          <img src="${p.spriteUrl}" alt="${p.name}"
               onerror="this.src='assets/sprites/${p.id}.png'"
               class="party-row-sprite" />
          ${p.hp <= 0 ? '<div class="party-row-fainted-x">✕</div>' : ''}
        </div>
        <div class="party-row-info">
          <div class="party-row-name">${p.name}</div>
          <div class="party-row-meta">
            <span class="party-row-type type-${p.type}">${p.type}</span>
            <span class="party-row-lv">Lv.${p.level}</span>
            <span class="party-row-pos">${position}</span>
          </div>
          <div class="party-row-hp-bar-bg">
            <div class="party-row-hp-bar" style="width:${hpPct}%;background:${hpCol}"></div>
          </div>
          <div class="party-row-hp-text">${Math.max(0, p.hp)} / ${p.maxHp} HP</div>
        </div>
        <button class="party-row-cards-btn" data-idx="${i}" title="View battle cards">
          🃏 ${cardCount}
        </button>
      `;

      // Drag-and-drop events
      row.addEventListener('dragstart', e => this._onDragStart(e, i));
      row.addEventListener('dragover',  e => this._onDragOver(e));
      row.addEventListener('dragleave', e => row.classList.remove('party-row-drag-over'));
      row.addEventListener('drop',      e => this._onDrop(e, i));
      row.addEventListener('dragend',   () => this._onDragEnd());

      // Cards button
      row.querySelector('.party-row-cards-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.openDetail(i);
      });

      list.appendChild(row);
    });
  },

  // ── Drag-and-drop ────────────────────────────────────────────────────────

  _onDragStart(e, idx) {
    this._dragSrcIdx = idx;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('party-row-dragging');
  },

  _onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('party-row-drag-over');
  },

  _onDrop(e, targetIdx) {
    e.preventDefault();
    e.currentTarget.classList.remove('party-row-drag-over');
    const srcIdx = this._dragSrcIdx;
    if (srcIdx === null || srcIdx === targetIdx) return;

    // Reorder party array
    const party = GameState.party;
    const [moved] = party.splice(srcIdx, 1);
    party.splice(targetIdx, 0, moved);

    // Keep activePokemonIndex pointing to the same pokemon after reorder
    const activeId = GameState.party.findIndex((_, i) =>
      i === (srcIdx < targetIdx
        ? (GameState.activePokemonIndex === srcIdx ? targetIdx : GameState.activePokemonIndex - (GameState.activePokemonIndex > srcIdx && GameState.activePokemonIndex <= targetIdx ? 1 : 0))
        : (GameState.activePokemonIndex === srcIdx ? targetIdx : GameState.activePokemonIndex + (GameState.activePokemonIndex >= targetIdx && GameState.activePokemonIndex < srcIdx ? 1 : 0)))
    );
    // Simpler: track by reference
    const activePoke = GameState.party.find((p, i) => {
      // After splice, find the pokemon that was active before
      return false; // we'll recalculate below
    });

    // Recalculate active index by tracking the moved element
    // The active pokemon object itself didn't change, find it by object identity
    // We need to store a reference before the splice - already done via index tracking
    // Simple recalc: if active was srcIdx it's now at targetIdx; otherwise shift
    let ai = GameState.activePokemonIndex;
    if (ai === srcIdx) {
      ai = targetIdx;
    } else if (srcIdx < targetIdx) {
      if (ai > srcIdx && ai <= targetIdx) ai--;
    } else {
      if (ai >= targetIdx && ai < srcIdx) ai++;
    }
    GameState.activePokemonIndex = ai;

    this._dragSrcIdx = null;
    this._render();
  },

  _onDragEnd() {
    this._dragSrcIdx = null;
    document.querySelectorAll('.party-row').forEach(r => {
      r.classList.remove('party-row-dragging', 'party-row-drag-over');
    });
  },

  // ── Card detail panel ────────────────────────────────────────────────────

  openDetail(partyIdx) {
    const p    = GameState.party[partyIdx];
    const deck = p.deck || GameState.deck || [];

    document.getElementById('poke-detail-sprite').src  = p.spriteUrl;
    document.getElementById('poke-detail-name').textContent  = p.name;
    document.getElementById('poke-detail-type').textContent  = p.type;
    document.getElementById('poke-detail-type').className    = `poke-detail-type type-${p.type}`;
    document.getElementById('poke-detail-level').textContent = `Lv. ${p.level}`;

    const hpPct = Math.round(p.hp / p.maxHp * 100);
    document.getElementById('poke-detail-hp-bar').style.width      = hpPct + '%';
    document.getElementById('poke-detail-hp-bar').style.background = hpColor(p.hp, p.maxHp);
    document.getElementById('poke-detail-hp-text').textContent     = `${Math.max(0,p.hp)} / ${p.maxHp} HP`;

    // Render cards — deduplicate by name for clean display, show count
    const cardMap = {};
    deck.forEach(c => {
      const key = c.name;
      if (!cardMap[key]) cardMap[key] = { ...c, count: 0 };
      cardMap[key].count++;
    });

    const cardsEl = document.getElementById('poke-detail-cards');
    cardsEl.innerHTML = '';
    Object.values(cardMap).forEach(card => {
      const el = document.createElement('div');
      el.className = 'poke-detail-card';
      el.dataset.type = card.type;
      el.innerHTML = `
        <div class="poke-detail-card-icon">${card.icon}</div>
        <div class="poke-detail-card-name">${card.name}</div>
        <div class="poke-detail-card-power">${card.power > 0 ? '⚔ ' + card.power : '✦'}</div>
        <div class="poke-detail-card-type type-${card.type}">${card.type}</div>
        <div class="poke-detail-card-effect">${card.effect || '—'}</div>
        <div class="poke-detail-card-count">×${card.count}</div>
        ${card.improved ? `<div class="poke-detail-card-improved">+${card.improved}</div>` : ''}
      `;
      cardsEl.appendChild(el);
    });

    document.getElementById('poke-detail-modal').classList.remove('hidden');
  },

  closeDetail() {
    document.getElementById('poke-detail-modal').classList.add('hidden');
  },
};

// ─── MAP ENGINE ──────────────────────────────────────────────────────────────

const MapEngine = {
  show() {
    showScreen('map');
    this.renderParty();
    this.drawMap();
    saveGame();
  },

  renderParty() {
    const el = document.getElementById('map-party');
    el.innerHTML = '';

    // Active Pokémon shown first (larger), rest smaller
    GameState.party.forEach((p, i) => {
      const d = document.createElement('div');
      const isActive = i === GameState.activePokemonIndex;
      d.className = 'map-poke-thumb' + (isActive ? ' map-poke-thumb-active' : '');
      d.innerHTML = `<img src="${p.spriteUrl}" alt="${p.name}"
                         onerror="this.src='assets/sprites/${p.id}.png'" />
                     <div class="thumb-hp" style="width:${Math.round(p.hp/p.maxHp*100)}%;
                       background:${hpColor(p.hp, p.maxHp)}"></div>
                     ${p.hp <= 0 ? '<div class="thumb-fainted">✕</div>' : ''}`;
      d.title = `${p.name} — Click to manage party`;
      d.style.cursor = 'pointer';
      d.addEventListener('click', () => PartyOverview.open());
      el.appendChild(d);
    });

    // "Manage" hint button if party exists
    if (GameState.party.length > 0) {
      const hint = document.createElement('div');
      hint.className = 'map-party-manage-hint';
      hint.textContent = '⚙';
      hint.title = 'Manage party';
      hint.addEventListener('click', () => PartyOverview.open());
      el.appendChild(hint);
    }

    document.getElementById('map-meta').textContent =
      `Boss: ${GameState.bossesDefeated}/3 | Party: ${GameState.party.length}/6`;
  },

  drawMap() {
    const wrap   = document.querySelector('.map-canvas-wrap');
    const canvas = document.getElementById('map-canvas');
    const layer  = document.getElementById('map-nodes-layer');
    layer.innerHTML = '';

    const W = Math.max(wrap.clientWidth,  320);
    const H = Math.max(wrap.clientHeight, 600);
    canvas.width  = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // ── Earthy sandy background like the reference ──
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0,   '#c8b89a');
    bgGrad.addColorStop(0.4, '#b8a882');
    bgGrad.addColorStop(1,   '#a89870');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle texture noise
    for (let i = 0; i < 400; i++) {
      const tx = Math.random() * W;
      const ty = Math.random() * H;
      const tr = Math.random() * 18 + 4;
      ctx.beginPath();
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.random()>0.5?'80,60,30':'180,160,120'},${Math.random()*0.08})`;
      ctx.fill();
    }

    // Horizontal band dividers (like the reference segments)
    for (let i = 1; i < 5; i++) {
      const bandY = (i / 5) * H;
      ctx.beginPath();
      ctx.moveTo(0, bandY);
      ctx.lineTo(W, bandY);
      ctx.strokeStyle = 'rgba(100,80,50,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const nodes = GameState.map;

    // Compute pixel positions
    nodes.forEach(n => {
      n.px = n.x * W;
      n.py = n.y * H;
    });

    // ── Draw path edges ──
    nodes.forEach(n => {
      n.links.forEach(li => {
        const target = nodes[li];
        if (!target) return;

        const done     = GameState.completedNodes.includes(n.idx);
        const bypassed = !!n.bypassed;
        const locked   = !n.unlocked && !done && !bypassed;

        ctx.beginPath();
        ctx.moveTo(n.px, n.py);
        ctx.lineTo(target.px, target.py);

        if (done) {
          ctx.strokeStyle = 'rgba(255,200,60,0.85)';
          ctx.lineWidth   = 4;
          ctx.shadowColor = 'rgba(255,180,0,0.7)';
          ctx.shadowBlur  = 10;
          ctx.setLineDash([]);
        } else if (bypassed) {
          // Greyed out, dashed — road not taken
          ctx.strokeStyle = 'rgba(80,65,50,0.35)';
          ctx.lineWidth   = 2;
          ctx.shadowBlur  = 0;
          ctx.setLineDash([3, 6]);
        } else if (locked) {
          ctx.strokeStyle = 'rgba(80,70,60,0.3)';
          ctx.lineWidth   = 2;
          ctx.shadowBlur  = 0;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = 'rgba(240,160,60,0.75)';
          ctx.lineWidth   = 3;
          ctx.shadowColor = 'rgba(255,140,0,0.5)';
          ctx.shadowBlur  = 8;
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
      });
    });

    // ── Draw node buttons ──
    nodes.forEach(n => {
      const btn  = document.createElement('button');
      const done      = GameState.completedNodes.includes(n.idx);
      const bypassed  = !!n.bypassed;

      let typeClass;
      if (done)      typeClass = 'node-done';
      else if (bypassed) typeClass = 'node-bypassed';
      else if (!n.unlocked) typeClass = 'node-locked';
      else           typeClass = `node-${n.type}`;

      btn.className   = `map-node-btn ${typeClass}`;
      btn.style.left  = n.px + 'px';
      btn.style.top   = n.py + 'px';
      btn.textContent = done ? '✓' : bypassed ? '✗' : NODE_ICONS[n.type] || '?';

      if (done)     btn.title = 'Completed';
      else if (bypassed) btn.title = 'Path not taken';
      else if (!n.unlocked) btn.title = 'Locked';
      else          btn.title = capitalize(n.type) + ' Node — click to enter';

      if (!n.unlocked || done || bypassed) btn.setAttribute('disabled', true);
      btn.onclick = () => this.visitNode(n);
      layer.appendChild(btn);
    });
  },

  visitNode(node) {
    // Advance the high water mark
    if (node.row > (GameState.highWaterRow ?? -1)) {
      GameState.highWaterRow = node.row;
    }

    // Lock out every node that is at or below the current row and hasn't been
    // done — these are alternatives the player has now permanently passed by.
    GameState.map.forEach(n => {
      if (!n.done && n.row <= GameState.highWaterRow && n.idx !== node.idx) {
        n.bypassed = true;   // permanent — can no longer be visited
        n.unlocked = false;  // also remove the unlocked flag so drawMap disables it
      }
    });

    GameState.currentNodeIndex = node.idx;
    switch (node.type) {
      case 'battle':   BattleEngine.start(node);   break;
      case 'heal':     HealEngine.start(node);      break;
      case 'catch':    CatchEngine.start(node);     break;
      case 'training': TrainingEngine.start(node);  break;
      case 'boss':     BossEngine.start(node);      break;
    }
  },

  completeNode(nodeIdx) {
    if (!GameState.completedNodes.includes(nodeIdx)) {
      GameState.completedNodes.push(nodeIdx);
    }
    // Unlock children
    const node = GameState.map.find(n => n.idx === nodeIdx);
    if (node) {
      node.done = true;
      node.links.forEach(li => {
        const child = GameState.map[li];
        if (child) child.unlocked = true;
      });
    }
    saveGame();
  },
};

function hpColor(hp, max) {
  const ratio = hp / max;
  if (ratio > .5) return '#44C767';
  if (ratio > .25) return '#FFB347';
  return '#E3350D';
}

// ─── BATTLE ENGINE ───────────────────────────────────────────────────────────

const BattleEngine = {
  isBoss: false,
  state: null,

  async start(node) {
    this.isBoss = false;
    showLoading();

    // Pick random wild opponent
    const pool = Math.random() < .7 ? 'common' : Math.random() < .6 ? 'uncommon' : 'rare';
    const poolArr = WILD_POOL[pool];
    const oppId = poolArr[Math.floor(Math.random() * poolArr.length)];
    const level = 5 + GameState.bossesDefeated * 6 + Math.floor(Math.random() * 5);

    const [oppData] = await Promise.all([fetchPoke(oppId)]);
    const oppType = oppData.types[0]?.type?.name || 'normal';
    const oppName = capitalize(oppData.name);
    const oppSprite = getSpriteUrl(oppData, true);
    const opp = makePokemon(oppId, level, oppSprite, oppName, oppType);

    const active = GameState.party[GameState.activePokemonIndex];
    const playerData = await fetchPoke(active.id);
    active.spriteUrl = getSpriteUrl(playerData, false) || active.spriteUrl;

    hideLoading();
    this._initBattle(active, opp, false);
  },

  _initBattle(playerPoke, oppPoke, isBoss) {
    this.isBoss = isBoss;
    // Use the active pokemon's own deck (falls back to GameState.deck for starters without one yet)
    const activeDeck = playerPoke.deck || GameState.deck;
    this.state = {
      player: { ...playerPoke },
      opp:    { ...oppPoke },
      drawPile:    shuffle([...activeDeck]),
      hand:        [],
      discardPile: [],
      actionsLeft: 2,
      statusEffects: { player: [], opp: [] },
      shield: 0,
      oppAtkDebuff: 0,
      rainTurns: 0,
      leechTurns: 0,
      leechStacks: 0,
      oppSkipped: false,
      playerFlinch: false,
      bonusAction: false,
    };
    this._dealHand(3);
    this._render();
    showScreen('battle');
    this._log(`A wild ${oppPoke.name} appeared!`);
  },

  _dealHand(n) {
    for (let i = 0; i < n; i++) {
      if (this.state.drawPile.length === 0) {
        this.state.drawPile = shuffle([...this.state.discardPile]);
        this.state.discardPile = [];
      }
      if (this.state.drawPile.length > 0) {
        this.state.hand.push(this.state.drawPile.pop());
      }
    }
  },

  _render() {
    const st = this.state;

    // HP bars
    setHpBar('opp',    st.opp.hp,    st.opp.maxHp,    st.opp.name,    st.opp.level);
    setHpBar('player', st.player.hp, st.player.maxHp, st.player.name, st.player.level);

    // Opponent type badge
    const typeBadge = document.getElementById('opp-type-badge');
    if (typeBadge && st.opp.type) {
      typeBadge.textContent  = st.opp.type;
      typeBadge.className    = `hud-type-badge type-${st.opp.type}`;
    }

    // Sprites
    const ps = document.getElementById('player-sprite');
    const os = document.getElementById('opp-sprite');
    ps.src = st.player.spriteUrl;
    os.src = st.opp.spriteUrl;
    // Asset slot note: image rendered here from PokeAPI — swap with local path if desired

    // Piles
    document.getElementById('draw-count').textContent    = st.drawPile.length;
    document.getElementById('discard-count').textContent = st.discardPile.length;

    // Actions
    document.getElementById('actions-left').textContent = `Actions: ${st.actionsLeft}`;

    // Hand
    const handEl = document.getElementById('hand-area');
    handEl.innerHTML = '';
    st.hand.forEach((card, i) => {
      handEl.appendChild(this._makeCardEl(card, i));
    });

    // Party swap
    this._renderPartySwap();
  },

  _makeCardEl(card, idx) {
    const st = this.state;
    const oppType = st.opp?.type || 'normal';
    const mult = card.power > 0 ? getTypeMultiplier(card.type, oppType) : 1;
    const effLabel = card.power > 0 ? typeEffectivenessLabel(mult) : null;

    // Effective damage after type modifier (for display only)
    const dispPower = card.power > 0 ? Math.round(card.power * mult) : 0;

    const disabled = st.actionsLeft <= 0;
    const el = document.createElement('div');
    el.className = 'card' + (disabled ? ' disabled' : '') + (mult >= 2 ? ' card-super' : mult === 0 || mult <= 0.5 ? ' card-weak' : '');
    el.dataset.type = card.type;

    // Build effectiveness badge HTML
    const effBadge = effLabel
      ? `<div class="card-eff-badge" style="color:${effLabel.color}">${effLabel.text}</div>`
      : '';

    // Power display: show base → effective if different
    const powerDisplay = card.power > 0
      ? (mult !== 1 ? `<span class="card-power-base">${card.power}</span> → <span style="color:${mult>=2?'#FFD700':mult===0?'#888':'#aaa'}">${dispPower}</span>` : `${card.power}`)
      : '✦';

    el.innerHTML = `
      <div class="card-icon">${card.icon}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-power">⚔ ${powerDisplay}</div>
      <div class="card-effect">${card.effect}</div>
      ${effBadge}
      ${card.improved ? `<div class="card-improved-badge">+${card.improved}</div>` : ''}
    `;
    if (!disabled) {
      el.onclick = () => this.playCard(idx);
    }
    return el;
  },

  _renderPartySwap() {
    const el = document.getElementById('party-swap');
    el.innerHTML = '';
    GameState.party.forEach((p, i) => {
      if (i === GameState.activePokemonIndex || p.hp <= 0) return;
      const btn = document.createElement('button');
      btn.className = 'swap-btn';
      btn.title = `Switch to ${p.name} (costs 2 actions)`;
      btn.innerHTML = `<img src="${p.spriteUrl}" alt="${p.name}" />`;
      btn.onclick = () => this.switchPokemon(i);
      el.appendChild(btn);
    });
  },

  _log(msg) {
    const el = document.getElementById('log-inner');
    el.textContent = msg;
    // subtle flash
    el.style.opacity = '0';
    requestAnimationFrame(() => { el.style.transition = 'opacity .2s'; el.style.opacity = '1'; });
  },

  playCard(handIndex) {
    const st = this.state;
    if (st.actionsLeft <= 0) return;
    const card = st.hand[handIndex];
    st.hand.splice(handIndex, 1);
    st.discardPile.push(card);
    st.actionsLeft--;

    this._applyCardEffect(card);

    if (this.isBoss) BossEngine._syncFromBattleState(st);
    this._checkDefeated();
  },

  _applyCardEffect(card) {
    const st = this.state;
    let dmg = card.power;

    // ── Type effectiveness ──
    const mult = dmg > 0 ? getTypeMultiplier(card.type, st.opp.type || 'normal') : 1;
    dmg = Math.round(dmg * mult);

    // Rain boost (water moves in rain)
    if (st.rainTurns > 0 && card.type === 'water') dmg = Math.round(dmg * 1.2);

    // Crit
    let crit = false;
    if (card.special === 'high_crit' && Math.random() < .3) crit = true;
    if (card.special === 'always_crit') crit = true;
    if (crit) dmg = Math.round(dmg * 1.5);

    if (dmg > 0) {
      st.opp.hp = Math.max(0, st.opp.hp - dmg);
      shakeSprite('opp-sprite');

      // Build log message with type hint
      const effLabel = typeEffectivenessLabel(mult);
      let logMsg = crit
        ? `${card.name}! Critical hit! ${dmg} dmg!`
        : `${card.name}! ${dmg} dmg to ${st.opp.name}!`;
      if (effLabel) logMsg += ` ${effLabel.text}`;
      this._log(logMsg);
    } else if (dmg === 0 && card.power > 0) {
      // Immune
      this._log(`${card.name} had no effect on ${st.opp.name}!`);
    }

    switch (card.special) {
      case 'heal_10':       st.player.hp = Math.min(st.player.maxHp, st.player.hp + 10);
                            this._log(`${card.name}! Healed 10 HP!`); break;
      case 'heal_25_draw':  st.player.hp = Math.min(st.player.maxHp, st.player.hp + 25);
                            this._dealHand(1);
                            this._log(`${card.name}! Healed 25 HP and drew a card!`); break;
      case 'draw_1':        this._dealHand(1); this._log(`${card.name}! Drew a card!`); break;
      case 'shield_draw':   st.shield += 20; this._dealHand(1);
                            this._log(`Shell Armor! Blocked 20 dmg + drew a card!`); break;
      case 'shield_35':     st.shield += 35; this._log(`Withdrew! Blocked 35 dmg next hit!`); break;
      case 'debuff_atk':    st.oppAtkDebuff += 10; this._log(`${st.opp.name}'s ATK fell!`); break;
      case 'debuff_acc':    st.oppAtkDebuff += 8; this._log(`${st.opp.name}'s accuracy fell!`); break;
      case 'skip_opp':      st.oppSkipped = true; this._log(`${st.opp.name} fell asleep!`); break;
      case 'slow_opp':      st.oppSkipped = true; this._log(`${st.opp.name} is slowed! Extra action!`);
                            st.actionsLeft++; break;
      case 'burn_chance':   if (Math.random()<.1){ addStatus(st,'opp','burn'); this._log(`${st.opp.name} is burned!`); } break;
      case 'burn':          addStatus(st,'opp','burn'); this._log(`${st.opp.name} is burning!`); break;
      case 'paralyse':      addStatus(st,'opp','para'); this._log(`${st.opp.name} is paralysed!`); break;
      case 'para_chance':   if(Math.random()<.1){ addStatus(st,'opp','para'); this._log(`${st.opp.name} is paralysed!`); } break;
      case 'poison':        addStatus(st,'opp','poison'); this._log(`${st.opp.name} is poisoned!`); break;
      case 'leech':         st.leechStacks++; st.leechTurns = 3; this._log(`Leech Seed latched!`); break;
      case 'flinch':        if(Math.random()<.3){ st.oppSkipped = true; this._log(`${st.opp.name} flinched!`); } break;
      case 'rain':          st.rainTurns = 3; this._log(`It started to rain!`); break;
      case 'bonus_action':  st.actionsLeft++; this._log(`Agility! Gained an extra action!`); break;
      case 'recoil_15':     st.player.hp = Math.max(1, st.player.hp - 15);
                            this._log(`${card.name}! Recoil 15 HP!`); break;
      case 'debuff_def':    if(Math.random()<.3){ st.oppAtkDebuff += 5; this._log(`${st.opp.name}'s DEF fell!`); } break;
    }

    this._render();
  },

  endTurn() {
    const st = this.state;

    // Discard remaining hand
    st.discardPile.push(...st.hand);
    st.hand = [];

    // Opponent turn
    if (!st.oppSkipped) {
      this._oppAttack();
    } else {
      this._log(`${st.opp.name} couldn't move!`);
      st.oppSkipped = false;
    }

    // Status ticks
    ['burn','poison'].forEach(s => {
      if (hasStatus(st, 'opp', s)) {
        const dmg = s === 'burn' ? 10 : 15;
        st.opp.hp = Math.max(0, st.opp.hp - dmg);
        this._log(`${st.opp.name} is hurt by ${s}! (${dmg})`);
      }
    });
    if (hasStatus(st, 'player', 'burn')) {
      st.player.hp = Math.max(0, st.player.hp - 10);
      this._log(`Your ${st.player.name} is burned! (-10)`);
    }

    // Leech
    if (st.leechTurns > 0) {
      const drain = 15 * st.leechStacks;
      st.opp.hp = Math.max(0, st.opp.hp - drain);
      st.player.hp = Math.min(st.player.maxHp, st.player.hp + Math.floor(drain/2));
      st.leechTurns--;
      this._log(`Leech Seed drained ${drain} HP from ${st.opp.name}!`);
    }

    // Rain countdown
    if (st.rainTurns > 0) st.rainTurns--;

    // Opp debuff decay
    if (st.oppAtkDebuff > 0) st.oppAtkDebuff = Math.max(0, st.oppAtkDebuff - 5);

    // Check defeats
    if (this._checkDefeated()) return;

    // New turn
    st.actionsLeft = 2;
    st.shield = 0;
    this._dealHand(3);
    this._render();
    this._log(`Your turn! You have ${st.actionsLeft} actions.`);
  },

  _oppAttack() {
    const st = this.state;
    if (hasStatus(st, 'opp', 'para') && Math.random() < .4) {
      this._log(`${st.opp.name} is paralysed and can't move!`);
      return;
    }

    // Simple opponent AI: picks a random power between 20-55 based on level
    const base = 20 + Math.floor(st.opp.level * 1.5) + Math.floor(Math.random() * 15);
    const debuffed = Math.max(0, base - st.oppAtkDebuff);
    const blocked  = Math.max(0, debuffed - st.shield);

    if (blocked > 0) {
      st.player.hp = Math.max(0, st.player.hp - blocked);
      const moveNames = ['Tackle','Scratch','Bite','Pound','Headbutt'];
      const move = moveNames[Math.floor(Math.random() * moveNames.length)];
      this._log(`${st.opp.name} used ${move}! ${blocked} dmg${st.shield > 0 ? ' (shield blocked some)' : ''}!`);
      shakeSprite('player-sprite');
    }
  },

  _checkDefeated() {
    const st = this.state;

    if (st.opp.hp <= 0) {
      this._log(`${st.opp.name} fainted! You win!`);
      setTimeout(() => this._victory(), 1200);
      return true;
    }
    if (st.player.hp <= 0) {
      // Update real party member
      GameState.party[GameState.activePokemonIndex].hp = 0;
      this._log(`${st.player.name} fainted!`);
      // Find next alive
      const next = GameState.party.findIndex((p, i) => i !== GameState.activePokemonIndex && p.hp > 0);
      if (next >= 0) {
        setTimeout(() => {
          GameState.activePokemonIndex = next;
          const p = GameState.party[next];
          // Swap to replacement's deck
          const newDeck = p.deck || GameState.deck;
          GameState.deck = newDeck;
          st.drawPile = shuffle([...newDeck]);
          st.hand = [];
          st.discardPile = [];
          st.player = { ...p };
          this._dealHand(3);
          this._log(`Go, ${p.name}!`);
          this._render();
        }, 1000);
      } else {
        setTimeout(() => this._defeat(), 1200);
      }
      return true;
    }
    return false;
  },

  _victory() {
    // Sync HP back
    GameState.party[GameState.activePokemonIndex].hp = this.state.player.hp;

    // Track stats
    if (!GameState.stats) GameState.stats = { battlesWon: 0, pokemonCaught: 0 };
    GameState.stats.battlesWon = (GameState.stats.battlesWon || 0) + 1;
    // Track usage count per pokemon for "favourite" calculation
    const activePoke = GameState.party[GameState.activePokemonIndex];
    activePoke.battlesWon = (activePoke.battlesWon || 0) + 1;

    MapEngine.completeNode(GameState.currentNodeIndex);
    showModal('Victory!', `${this.state.opp.name} fainted! You won!`, () => {
      MapEngine.show();
    });
  },

  _defeat() {
    deleteSave();
    GameOver.show(`the wild ${this.state.opp.name}`);
  },

  switchPokemon(idx) {
    const st = this.state;
    if (st.actionsLeft < 2) {
      this._log(`Not enough actions to switch! (costs 2)`);
      return;
    }
    // Sync current HP back to party
    GameState.party[GameState.activePokemonIndex].hp = st.player.hp;
    GameState.activePokemonIndex = idx;
    const newPoke = GameState.party[idx];

    // Swap active deck to the new pokemon's deck
    const newDeck = newPoke.deck || GameState.deck;
    GameState.deck = newDeck;

    // Reset hand/draw/discard for the new pokemon's deck
    st.discardPile.push(...st.hand);
    st.hand = [];
    st.drawPile = shuffle([...newDeck]);
    st.discardPile = [];

    st.player = { ...newPoke };
    st.actionsLeft -= 2;

    fetchPoke(newPoke.id).then(d => {
      st.player.spriteUrl = getSpriteUrl(d, false);
      this._render();
    });
    this._log(`Go, ${newPoke.name}! (2 actions used)`);
    this._render();
  },
};

// ─── BOSS ENGINE ─────────────────────────────────────────────────────────────

const BossEngine = {
  bossData: null,
  oppTeam:  [],
  oppIdx:   0,
  bState:   null,

  async start(node) {
    showLoading();
    const bossIdx = Math.min(GameState.bossesDefeated, 2);
    const boss = BOSS_TRAINERS[bossIdx];
    this.bossData = boss;
    this.oppIdx   = 0;
    this.oppTeam  = [];

    for (const id of boss.team) {
      const d = await fetchPoke(id);
      const level = 12 + bossIdx * 8;
      this.oppTeam.push(makePokemon(id, level, getSpriteUrl(d, true), capitalize(d.name), d.types[0]?.type?.name || 'normal'));
    }
    hideLoading();

    // Show boss screen first so all elements are active in the DOM
    showScreen('boss');

    // Set up trainer sprite with safe fallback
    const trainerSpriteWrap = document.querySelector('.trainer-sprite-wrap');
    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (trainerImg && trainerSpriteWrap) {
      trainerImg.onerror = null; // clear any previous handler
      trainerImg.onerror = function() {
        trainerSpriteWrap.innerHTML = `<div style="font-size:5rem;line-height:1">🧢</div>`;
      };
      trainerImg.src = `assets/trainer_boss_${bossIdx}.png`;
      // Fallback chain: try generic trainer, then emoji
      trainerImg.onerror = function() {
        this.onerror = function() {
          trainerSpriteWrap.innerHTML = `<div style="font-size:5rem;line-height:1">🧢</div>`;
        };
        this.src = 'assets/trainer_boss.png';
      };
    }

    document.getElementById('dialogue-name').textContent = boss.name;
    document.getElementById('dialogue-text').textContent  = boss.dialogue;

    const introEl = document.getElementById('trainer-intro');
    const battleEl= document.getElementById('boss-battle-area');
    if (introEl)  introEl.style.display  = 'flex';
    if (battleEl) battleEl.style.display = 'none';

    document.getElementById('boss-party-bar').innerHTML = this.oppTeam.map((_,i)=>
      `<div class="boss-poke-pip" id="boss-pip-${i}"></div>`).join('');
  },

  startBattle() {
    document.getElementById('trainer-intro').style.display   = 'none';
    document.getElementById('boss-battle-area').style.display = 'block';
    this._loadNextOpp();
  },

  _loadNextOpp() {
    const opp = this.oppTeam[this.oppIdx];
    const player = GameState.party[GameState.activePokemonIndex];
    const activeDeck = player.deck || GameState.deck;
    this.bState = {
      player: { ...player },
      opp:    { ...opp },
      drawPile: shuffle([...activeDeck]),
      hand: [], discardPile: [],
      actionsLeft: 2,
      statusEffects: { player: [], opp: [] },
      shield: 0, oppAtkDebuff: 0, rainTurns: 0,
      leechTurns: 0, leechStacks: 0, oppSkipped: false,
    };
    BattleEngine._dealHand.call({ state: this.bState }, 3);
    this._render();
    this._log(`${this.bossData.name} sent out ${opp.name}!`);
  },

  _render() {
    const st = this.bState;
    setHpBar('boss-opp',    st.opp.hp,    st.opp.maxHp,    st.opp.name,    st.opp.level);
    setHpBar('boss-player', st.player.hp, st.player.maxHp, st.player.name, st.player.level);

    // Opponent type badge
    const bossTypeBadge = document.getElementById('boss-opp-type-badge');
    if (bossTypeBadge && st.opp.type) {
      bossTypeBadge.textContent = st.opp.type;
      bossTypeBadge.className   = `hud-type-badge type-${st.opp.type}`;
    }

    document.getElementById('boss-opp-sprite').src    = st.opp.spriteUrl;
    document.getElementById('boss-player-sprite').src = st.player.spriteUrl;

    document.getElementById('boss-draw-count').textContent    = st.drawPile.length;
    document.getElementById('boss-discard-count').textContent = st.discardPile.length;
    document.getElementById('boss-actions-left').textContent  = `Actions: ${st.actionsLeft}`;

    const handEl = document.getElementById('boss-hand-area');
    handEl.innerHTML = '';
    st.hand.forEach((card, i) => {
      const el = BattleEngine._makeCardEl.call({ state: st }, card, i);
      el.onclick = () => this.playCard(i);
      handEl.appendChild(el);
    });

    // Party pips
    this.oppTeam.forEach((p, i) => {
      const pip = document.getElementById(`boss-pip-${i}`);
      if (pip) pip.className = 'boss-poke-pip' + (p.hp <= 0 ? ' fainted' : '');
    });

    // Swap buttons
    const swapEl = document.getElementById('boss-party-swap');
    swapEl.innerHTML = '';
    GameState.party.forEach((p, i) => {
      if (i === GameState.activePokemonIndex || p.hp <= 0) return;
      const btn = document.createElement('button');
      btn.className = 'swap-btn';
      btn.innerHTML = `<img src="${p.spriteUrl}" alt="${p.name}" />`;
      btn.onclick = () => this.switchPokemon(i);
      swapEl.appendChild(btn);
    });
  },

  _log(msg) {
    const el = document.getElementById('boss-log-inner');
    el.textContent = msg;
  },

  playCard(idx) {
    const st = this.bState;
    if (st.actionsLeft <= 0) return;
    const card = st.hand[idx];
    st.hand.splice(idx, 1);
    st.discardPile.push(card);
    st.actionsLeft--;
    BattleEngine._applyCardEffect.call({ state: st, _log: (m) => this._log(m), _render: () => this._render(), _checkDefeated: () => false, _dealHand: (n) => BattleEngine._dealHand.call({ state: st }, n) }, card);
    this._checkDefeated();
    this._render();
  },

  endTurn() {
    const st = this.bState;
    st.discardPile.push(...st.hand);
    st.hand = [];
    BattleEngine._oppAttack.call({ state: st, _log: (m) => this._log(m) });
    if (this._checkDefeated()) return;
    st.actionsLeft = 2;
    st.shield = 0;
    BattleEngine._dealHand.call({ state: st }, 3);
    this._render();
  },

  _checkDefeated() {
    const st = this.bState;
    if (st.opp.hp <= 0) {
      this.oppTeam[this.oppIdx].hp = 0;
      this.oppIdx++;
      if (this.oppIdx >= this.oppTeam.length) {
        // Boss defeated
        GameState.party[GameState.activePokemonIndex].hp = st.player.hp;
        MapEngine.completeNode(GameState.currentNodeIndex);
        setTimeout(() => {
          const isFinalBoss = GameState.bossesDefeated >= 2; // about to become 3
          const modalMsg = isFinalBoss
            ? `You defeated ${this.bossData.name}! You are the Champion!`
            : `You defeated ${this.bossData.name}! Your Pokémon is evolving…`;
          showModal('Boss Defeated!', modalMsg, () => {
            Game.afterBoss(GameState.bossesDefeated);
          });
        }, 800);
        return true;
      }
      this._log(`${this.bossData.name} sent out ${this.oppTeam[this.oppIdx].name}!`);
      st.opp = { ...this.oppTeam[this.oppIdx] };
      this._render();
      return false;
    }
    if (st.player.hp <= 0) {
      GameState.party[GameState.activePokemonIndex].hp = 0;
      const next = GameState.party.findIndex((p, i) => i !== GameState.activePokemonIndex && p.hp > 0);
      if (next >= 0) {
        GameState.activePokemonIndex = next;
        const p = GameState.party[next];
        const newDeck = p.deck || GameState.deck;
        GameState.deck = newDeck;
        st.drawPile = shuffle([...newDeck]);
        st.hand = [];
        st.discardPile = [];
        st.player = { ...p };
        BattleEngine._dealHand.call({ state: st }, 3);
        this._log(`Go, ${p.name}!`);
        this._render();
      } else {
        deleteSave();
        GameOver.show(this.bossData.name);
        return true;
      }
    }
    return false;
  },

  switchPokemon(idx) {
    const st = this.bState;
    if (st.actionsLeft < 2) {
      this._log(`Not enough actions to switch! (costs 2)`);
      return;
    }
    GameState.party[GameState.activePokemonIndex].hp = st.player.hp;
    GameState.activePokemonIndex = idx;
    const newPoke = GameState.party[idx];

    // Swap to new pokemon's deck
    const newDeck = newPoke.deck || GameState.deck;
    GameState.deck = newDeck;
    st.discardPile.push(...st.hand);
    st.hand = [];
    st.drawPile = shuffle([...newDeck]);
    st.discardPile = [];

    st.player = { ...newPoke };
    st.actionsLeft -= 2;
    this._log(`Go, ${newPoke.name}! (2 actions used)`);
    this._render();
  },

  _syncFromBattleState(st) { this.bState = st; },
};

// ─── GAME OVER ENGINE ────────────────────────────────────────────────────────

const GameOver = {
  show(defeatedBy) {
    const stats = GameState.stats || {};
    const party = GameState.party || [];

    // Favourite = party member with most battlesWon, fallback to starter
    const fav = party.reduce((best, p) =>
      (p.battlesWon || 0) >= (best.battlesWon || 0) ? p : best,
      party[0] || null
    );

    // Populate stats
    document.getElementById('gameover-defeated-by').textContent =
      `Defeated by ${defeatedBy}`;
    document.getElementById('go-battles-won').textContent =
      stats.battlesWon || 0;
    document.getElementById('go-caught').textContent =
      (party.filter(p => !p.isStarter).length);
    document.getElementById('go-nodes').textContent =
      GameState.completedNodes?.length || 0;
    document.getElementById('go-bosses').textContent =
      GameState.bossesDefeated || 0;

    // Favourite Pokémon card
    const favEl = document.getElementById('gameover-fav');
    if (fav) {
      favEl.innerHTML = `
        <div class="gameover-fav-label">Your Favourite Partner</div>
        <div class="gameover-fav-card">
          <img src="${fav.spriteUrl}" alt="${fav.name}"
               onerror="this.src='assets/sprites/${fav.id}.png'"
               class="gameover-fav-sprite" />
          <div class="gameover-fav-name">${fav.name}</div>
          <div class="gameover-fav-wins">${fav.battlesWon || 0} battle${(fav.battlesWon || 0) !== 1 ? 's' : ''} won</div>
        </div>
      `;
    }

    // Spawn rain drops for atmosphere
    const rain = document.getElementById('gameover-rain');
    rain.innerHTML = '';
    for (let i = 0; i < 60; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      drop.style.left = Math.random() * 100 + '%';
      drop.style.animationDelay = (Math.random() * 2) + 's';
      drop.style.animationDuration = (0.4 + Math.random() * 0.5) + 's';
      drop.style.height = (12 + Math.random() * 20) + 'px';
      rain.appendChild(drop);
    }

    showScreen('gameover');
  },

  restart() {
    deleteSave();
    GameState = null;
    showScreen('start');
  },
};

// ─── CATCH ENGINE ────────────────────────────────────────────────────────────

const CatchEngine = {
  current: null,
  _caught: false,

  async start(node) {
    showLoading();
    const roll = Math.random();
    let rarity, pool;
    if (roll < .6)      { rarity = 'Common';   pool = WILD_POOL.common; }
    else if (roll < .9) { rarity = 'Uncommon'; pool = WILD_POOL.uncommon; }
    else                { rarity = 'Rare ✨';  pool = WILD_POOL.rare; }

    const id   = pool[Math.floor(Math.random() * pool.length)];
    const data = await fetchPoke(id);
    this.current = { data, rarity, id };
    this._caught = false;

    hideLoading();
    showScreen('catch');

    // Reset all state
    document.getElementById('catch-title').textContent    = 'Wild Pokémon Appeared!';
    document.getElementById('catch-name').textContent     = '???';
    document.getElementById('catch-rarity').textContent   = '';
    document.getElementById('catch-controls').style.display  = 'none';
    document.getElementById('catch-result').style.display    = 'none';
    document.getElementById('catch-ball-wrap').style.display = 'none';
    document.getElementById('catch-status').textContent   = '';

    // Show silhouette — try multiple sprite sources in order
    const spriteEl = document.getElementById('catch-sprite');
    spriteEl.style.display   = '';
    spriteEl.style.transform = '';
    spriteEl.style.opacity   = '1';
    spriteEl.className       = 'catch-sprite silhouette';

    const spriteUrls = [
      data.sprites?.other?.['official-artwork']?.front_default,
      data.sprites?.other?.home?.front_default,
      data.sprites?.front_default,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
    ];

    loadImageWithFallback(spriteEl, spriteUrls, () => {
      // All URLs failed — show a generic mystery silhouette placeholder
      const wrap = document.getElementById('catch-sprite-wrap');
      wrap.innerHTML = `
        <div class="catch-placeholder silhouette-placeholder">
          <svg viewBox="0 0 100 100" width="180" height="180" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="50" cy="65" rx="30" ry="22" fill="#fff"/>
            <circle  cx="50" cy="35" r="22"           fill="#fff"/>
            <ellipse cx="28" cy="58" rx="10" ry="7"   fill="#fff" transform="rotate(-20 28 58)"/>
            <ellipse cx="72" cy="58" rx="10" ry="7"   fill="#fff" transform="rotate(20 72 58)"/>
          </svg>
        </div>`;
    });

    // Reset ball
    const ball = document.getElementById('catch-ball');
    ball.className = 'catch-ball';
    ball.style.transform = '';

    // Reveal after 2s
    setTimeout(() => {
      spriteEl.className = 'catch-sprite revealed';
      document.getElementById('catch-name').textContent   = capitalize(data.name);
      document.getElementById('catch-rarity').textContent = `Rarity: ${rarity}`;
      document.getElementById('catch-controls').style.display = 'flex';
    }, 2000);
  },

  throwBall() {
    if (!this.current) return;
    document.getElementById('catch-controls').style.display  = 'none';

    const { rarity, data } = this.current;
    const catchRate = rarity.startsWith('Rare') ? .25 : rarity === 'Uncommon' ? .5 : .75;
    const caught    = Math.random() < catchRate;
    this._caught    = caught;

    const wiggles = caught ? 3 : Math.floor(Math.random() * 3) + 1;

    // spriteEl may be the <img> or a placeholder div — handle both
    const spriteEl  = document.getElementById('catch-sprite');
    const ballWrap  = document.getElementById('catch-ball-wrap');
    const ball      = document.getElementById('catch-ball');
    const statusEl  = document.getElementById('catch-status');

    // 1 — Throw arc
    ballWrap.style.display = 'flex';
    ball.className = 'catch-ball ball-throw';

    // Pokemon absorbed at arc peak
    setTimeout(() => {
      if (spriteEl) spriteEl.className = 'catch-sprite catch-absorbed';
      // Also hide placeholder if present
      const placeholder = document.querySelector('.catch-placeholder');
      if (placeholder) placeholder.style.animation = 'absorb .5s ease-in forwards';
    }, 550);

    // 2 — Ball lands
    setTimeout(() => {
      ball.className = 'catch-ball ball-landed';
      if (spriteEl) spriteEl.style.display = 'none';
      const placeholder = document.querySelector('.catch-placeholder');
      if (placeholder) placeholder.style.display = 'none';
      this._runWiggles(ball, statusEl, wiggles, caught, data);
    }, 900);
  },

  _runWiggles(ball, statusEl, totalWiggles, caught, data) {
    let wigglesDone = 0;
    const pokeName  = capitalize(data.name);

    const doNextWiggle = () => {
      wigglesDone++;
      ball.className = 'catch-ball';
      // Force reflow so animation restarts
      void ball.offsetWidth;
      ball.className = 'catch-ball ball-wiggle';
      statusEl.textContent = wigglesDone === 1 ? '...' : wigglesDone === 2 ? '... ...' : '... ... ...';

      if (wigglesDone < totalWiggles) {
        setTimeout(doNextWiggle, 900);
      } else {
        // Final result after last wiggle
        setTimeout(() => this._showResult(ball, statusEl, caught, data), 700);
      }
    };

    // Small delay before first wiggle
    setTimeout(doNextWiggle, 400);
  },

  _showResult(ball, statusEl, caught, data) {
    const pokeName   = capitalize(data.name);
    const spriteEl   = document.getElementById('catch-sprite');
    const resultEl   = document.getElementById('catch-result');
    const resultText = document.getElementById('catch-result-text');

    if (caught && GameState.party.length < 6) {
      ball.className = 'catch-ball ball-caught';
      statusEl.textContent = '';
      if (!GameState.stats) GameState.stats = { battlesWon: 0, pokemonCaught: 0 };
      GameState.stats.pokemonCaught++;
      const level = 5 + GameState.bossesDefeated * 5 + Math.floor(Math.random() * 5);
      const poke  = makePokemon(data.id, level, getSpriteUrl(data),
                      pokeName, data.types[0]?.type?.name || 'normal');
      GameState.party.push(poke);
      saveGame();
      setTimeout(() => {
        resultText.innerHTML = `<span style="color:#FFD700">★</span> Gotcha! ${pokeName} was caught!`;
        resultEl.style.display = 'block';
      }, 600);

    } else if (caught && GameState.party.length >= 6) {
      ball.className = 'catch-ball ball-caught';
      statusEl.textContent = '';
      setTimeout(() => {
        resultText.innerHTML = `Party full! ${pokeName} was released.`;
        resultEl.style.display = 'block';
      }, 600);

    } else {
      // Escaped — burst ball open and restore sprite
      ball.className = 'catch-ball ball-burst';
      statusEl.textContent = '';

      setTimeout(() => {
        // Restore sprite with fallback chain before showing escape animation
        if (spriteEl) {
          spriteEl.style.display = '';
          const spriteUrls = [
            data.sprites?.other?.['official-artwork']?.front_default,
            data.sprites?.other?.home?.front_default,
            data.sprites?.front_default,
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
          ];
          loadImageWithFallback(spriteEl, spriteUrls, () => {
            // If still no image, show placeholder again
            spriteEl.style.display = 'none';
          });
          spriteEl.className = 'catch-sprite revealed catch-escape';
        }
        statusEl.textContent = `${pokeName} broke free!`;
      }, 300);

      setTimeout(() => {
        resultText.innerHTML   = `Oh no! ${pokeName} broke free and ran away!`;
        resultEl.style.display = 'block';
        if (spriteEl) spriteEl.className = 'catch-sprite catch-runaway';
      }, 1400);
    }
  },

  finish() {
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },

  flee() {
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },
};

// ─── TRAINING ENGINE ─────────────────────────────────────────────────────────

const TrainingEngine = {
  selected: [],

  start(node) {
    this.selected = [];
    showScreen('training');
    this._render();
  },

  _render() {
    const grid = document.getElementById('training-cards-grid');
    grid.innerHTML = '';
    GameState.deck.forEach((card, i) => {
      const div = document.createElement('div');
      div.className = 'training-card' + (this.selected.includes(i) ? ' selected' : '');
      div.dataset.type = card.type;
      div.style.setProperty('--type-color', `var(--col-type-${card.type}, var(--col-type-normal))`);
      div.style.borderTopColor = `var(--col-type-${card.type}, var(--col-type-normal))`;
      div.innerHTML = `
        <div class="card-icon" style="font-size:1.6rem">${card.icon}</div>
        <div class="card-name" style="font-family:'Press Start 2P',monospace;font-size:.38rem;color:var(--col-text);margin:.2rem 0">${card.name}</div>
        <div class="card-power" style="font-size:.65rem;color:var(--col-yellow)">${card.power > 0 ? '⚔ '+card.power : '✦'}</div>
        <div class="card-effect" style="font-size:.45rem;color:var(--col-text-dim);margin-top:.1rem">${card.effect}</div>
        ${card.improved ? `<div class="card-improved">+${card.improved}</div>` : ''}
      `;
      div.onclick = () => this.toggleSelect(i);
      grid.appendChild(div);
    });
    document.getElementById('selected-count').textContent = `${this.selected.length} / 2 selected`;
    document.getElementById('btn-improve').disabled = this.selected.length !== 2;
  },

  toggleSelect(idx) {
    const i = this.selected.indexOf(idx);
    if (i >= 0) {
      this.selected.splice(i,1);
    } else if (this.selected.length < 2) {
      this.selected.push(idx);
    }
    this._render();
  },

  improve() {
    if (this.selected.length !== 2) return;
    this.selected.forEach(idx => {
      const card = GameState.deck[idx];
      card.improved = (card.improved || 0) + 1;
      if (card.power > 0) card.power = Math.round(card.power * 1.25);
    });
    GameState.improvementMap = {};
    GameState.deck.forEach((c, i) => { if (c.improved) GameState.improvementMap[i] = c.improved; });
    saveGame();
    MapEngine.completeNode(GameState.currentNodeIndex);
    showModal('Cards Improved!', 'Your selected cards have been powered up!', () => MapEngine.show());
  },

  skip() {
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },
};

// ─── HEAL ENGINE ─────────────────────────────────────────────────────────────

const HealEngine = {
  start(node) {
    showScreen('heal');
    // Create sparkles
    const field = document.getElementById('heal-sparkles');
    field.innerHTML = '';
    for (let i = 0; i < 30; i++) {
      const s = document.createElement('div');
      s.className = 'sparkle';
      s.style.left   = Math.random() * 100 + '%';
      s.style.top    = Math.random() * 100 + '%';
      s.style.animationDuration = (1 + Math.random() * 2) + 's';
      s.style.animationDelay   = (Math.random() * 2) + 's';
      s.style.width = s.style.height = (2 + Math.random() * 4) + 'px';
      field.appendChild(s);
    }
    // Heal all
    GameState.party.forEach(p => { p.hp = p.maxHp; });
    saveGame();
    // Show party
    const partyEl = document.getElementById('heal-party');
    partyEl.innerHTML = '';
    GameState.party.forEach(p => {
      const d = document.createElement('div');
      d.className = 'heal-poke-card';
      d.innerHTML = `<img src="${p.spriteUrl}" alt="${p.name}"
                         onerror="this.src='assets/sprites/${p.id}.png'" />
                     <div class="heal-poke-name">${p.name}</div>`;
      partyEl.appendChild(d);
    });
  },

  finish() {
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },
};

// ─── EVOLVE ENGINE ───────────────────────────────────────────────────────────

const EvolveEngine = {
  _cb: null,

  async run(beforeId, afterId, cb) {
    this._cb = cb;
    showLoading();
    const [before, after] = await Promise.all([fetchPoke(beforeId), fetchPoke(afterId)]);
    hideLoading();

    document.getElementById('evolve-before').src = getSpriteUrl(before);
    document.getElementById('evolve-after').src  = getSpriteUrl(after);
    document.getElementById('evolve-text').textContent = `${capitalize(before.name)} is evolving…`;
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
        width:${size}px;height:${size}px;
        left:${Math.random()*100}%;
        background:hsl(${40+Math.random()*40},100%,${60+Math.random()*30}%);
        animation-duration:${2+Math.random()*3}s;
        animation-delay:${Math.random()*2}s;
      `;
      partsEl.appendChild(p);
    }

    setTimeout(() => {
      document.getElementById('evolve-after').className = 'evolve-sprite after show';
      document.getElementById('evolve-text').textContent = `${capitalize(before.name)} evolved into ${capitalize(after.name)}!`;
      document.getElementById('btn-evolve-continue').style.display = 'inline-block';
    }, 3000);
  },
};

// Patch Game.afterEvolve to call the stored callback
Game.afterEvolve = function() {
  if (EvolveEngine._cb) {
    const cb = EvolveEngine._cb;
    EvolveEngine._cb = null;
    cb();
  }
};

// ─── VICTORY ENGINE ──────────────────────────────────────────────────────────

const VictoryEngine = {
  show() {
    const stats = GameState.stats || {};
    const party = GameState.party || [];

    // Stats
    document.getElementById('vic-battles-won').textContent = stats.battlesWon || 0;
    document.getElementById('vic-caught').textContent      = party.filter(p => !p.isStarter).length;
    document.getElementById('vic-nodes').textContent       = GameState.completedNodes?.length || 0;
    document.getElementById('vic-bosses').textContent      = '3';

    // Favourite — most battlesWon
    const fav = party.reduce((best, p) =>
      (p.battlesWon || 0) >= (best.battlesWon || 0) ? p : best,
      party[0] || null
    );
    const favEl = document.getElementById('victory-fav');
    if (fav) {
      favEl.innerHTML = `
        <div class="gameover-fav-label">MVP Partner</div>
        <div class="gameover-fav-card">
          <img src="${fav.spriteUrl}" alt="${fav.name}"
               onerror="this.src='assets/sprites/${fav.id}.png'"
               class="gameover-fav-sprite" />
          <div class="gameover-fav-name">${fav.name}</div>
          <div class="gameover-fav-wins">${fav.battlesWon || 0} battle${(fav.battlesWon||0)!==1?'s':''} won</div>
        </div>`;
    }

    // Full party
    const partyEl = document.getElementById('victory-party');
    partyEl.innerHTML = '';
    party.forEach(p => {
      const d = document.createElement('div');
      d.className = 'heal-poke-card';
      d.innerHTML = `
        <img src="${p.spriteUrl}" alt="${p.name}"
             onerror="this.src='assets/sprites/${p.id}.png'"
             style="width:56px;height:56px;image-rendering:pixelated" />
        <div class="heal-poke-name" style="font-size:.35rem">${p.name}</div>`;
      partyEl.appendChild(d);
    });

    // Spawn gold stars
    const starsEl = document.getElementById('victory-stars');
    starsEl.innerHTML = '';
    for (let i = 0; i < 40; i++) {
      const s = document.createElement('div');
      s.className = 'victory-star';
      s.style.left              = Math.random() * 100 + '%';
      s.style.top               = Math.random() * 100 + '%';
      s.style.animationDelay    = (Math.random() * 3) + 's';
      s.style.animationDuration = (1.5 + Math.random() * 2) + 's';
      s.style.fontSize          = (8 + Math.random() * 14) + 'px';
      s.textContent = '★';
      starsEl.appendChild(s);
    }

    document.getElementById('victory-sub').textContent =
      'You are the PokéRogue Champion! Pikachu is now unlocked!';

    showScreen('victory');
  },
};

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function setHpBar(barId, hp, maxHp, name, level) {
  // barId is the full element id prefix, e.g. 'opp', 'player', 'boss-opp', 'boss-player'
  const bar     = document.getElementById(`${barId}-hp-bar`);
  const text    = document.getElementById(`${barId}-hp-text`);
  const nameEl  = document.getElementById(`${barId}-name`);
  const levelEl = document.getElementById(`${barId}-level`);
  if (!bar) return;
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  bar.style.width = pct + '%';
  bar.style.background = hpColor(hp, maxHp);
  if (text)    text.textContent  = `${Math.max(0, hp)} / ${maxHp}`;
  if (nameEl)  nameEl.textContent  = name.toUpperCase();
  if (levelEl) levelEl.textContent = `Lv.${level}`;
}

function shakeSprite(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hit-shake');
  void el.offsetWidth;
  el.classList.add('hit-shake');
  setTimeout(() => el.classList.remove('hit-shake'), 500);
}

function addStatus(st, who, status) {
  if (!hasStatus(st, who, status)) st.statusEffects[who].push(status);
}
function hasStatus(st, who, status) {
  return st.statusEffects[who]?.includes(status);
}

// ─── INIT — wire all buttons here, zero inline onclick in HTML ────────────────

document.addEventListener('DOMContentLoaded', () => {

  // ── Party drawer ──
  document.getElementById('btn-party-drawer-close').addEventListener('click', () => PartyOverview.close());
  document.getElementById('party-drawer-backdrop').addEventListener('click', () => PartyOverview.close());
  document.getElementById('btn-poke-detail-close').addEventListener('click', () => PartyOverview.closeDetail());

  // ── Start screen ──
  document.getElementById('btn-new-game').addEventListener('click', () => Game.startNew());
  document.getElementById('btn-continue-game').addEventListener('click', () => Game.continueGame());

  // ── Battle screen ──
  document.getElementById('btn-end-turn').addEventListener('click', () => BattleEngine.endTurn());

  // ── Boss screen ──
  document.getElementById('btn-start-boss-battle').addEventListener('click', () => BossEngine.startBattle());
  document.getElementById('btn-boss-end-turn').addEventListener('click', () => BossEngine.endTurn());

  // ── Catch screen ──
  document.getElementById('btn-throw-ball').addEventListener('click', () => CatchEngine.throwBall());
  document.getElementById('btn-flee').addEventListener('click', () => CatchEngine.flee());
  document.getElementById('btn-catch-continue').addEventListener('click', () => CatchEngine.finish());

  // ── Game Over screen ──
  document.getElementById('btn-gameover-restart').addEventListener('click', () => GameOver.restart());

  // ── Training screen ──
  document.getElementById('btn-improve').addEventListener('click', () => TrainingEngine.improve());
  document.getElementById('btn-training-skip').addEventListener('click', () => TrainingEngine.skip());

  // ── Heal screen ──
  document.getElementById('btn-heal-finish').addEventListener('click', () => HealEngine.finish());

  // ── Evolve screen ──
  document.getElementById('btn-evolve-continue').addEventListener('click', () => Game.afterEvolve());

  // ── Victory screen ──
  document.getElementById('btn-play-again').addEventListener('click', () => Game.returnToStart());

  // ── Modal ──
  document.getElementById('modal-ok').addEventListener('click', () => closeModal());

  // Show start screen
  showScreen('start');
});

/* ═══════════════════════════════════════════
   POKÉROGUE — app.js
   Full game logic: Map, Battle, Catch, Train, Heal, Boss, Evolve
═══════════════════════════════════════════ */

'use strict';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const POKEAPI = 'https://pokeapi.co/api/v2';

const STARTERS = [
  { id: 1,   name: 'Bulbasaur',  type: 'grass',    evolutions: [1,2,3] },
  { id: 4,   name: 'Charmander', type: 'fire',     evolutions: [4,5,6] },
  { id: 7,   name: 'Squirtle',   type: 'water',    evolutions: [7,8,9] },
  { id: 25,  name: 'Pikachu',    type: 'electric', evolutions: [25,26,26], locked: true },
  { id: 133, name: 'Eevee',      type: 'normal',   evolutions: [133],      locked: true, eeveeStarter: true },
  { id: 151, name: 'Mew',        type: 'psychic',  evolutions: [151],      locked: true, mewStarter: true },
  { id: 150, name: 'Mewtwo',     type: 'psychic',  evolutions: [150],      locked: true, mewtwostarter: true },
];

// Level thresholds that trigger starter evolution
const EVOLUTION_LEVELS = {
  1:   { stage2: 16, stage3: 32 },
  4:   { stage2: 16, stage3: 36 },
  7:   { stage2: 16, stage3: 36 },
  25:  { stage2: 22 },
  133: {},   // Eevee — stone-only evolution, no level thresholds
  151: {},   // Mew — no evolution
  150: {},   // Mewtwo — no evolution
};

// Warm narrative lines shown on the evolve screen — (trainerName, newPokeName, prevPokeName)
const EVOLVE_NARRATIVES = {
  1: {
    2: (n, next, prev) => `${n} has been an amazing trainer. All those battles, all that care — ${prev} has been watching you the whole time. It trusts you completely. Something is happening...`,
    3: (n, next, prev) => `${n}, look! After everything you two have been through together, ${prev} has reached its final form. This is what true friendship looks like.`,
  },
  4: {
    2: (n, next, prev) => `${n}, you never gave up — and neither did ${prev}. Every battle you won together made it stronger. The flame on its tail burns brighter than ever before...`,
    3: (n, next, prev) => `${n}! The bond between you and ${prev} is extraordinary. Only a trainer with a truly warm heart could bring out this kind of power. Watch closely!`,
  },
  7: {
    2: (n, next, prev) => `${n}, your calm and steady style of battling has inspired ${prev}. It has been learning from you all along. Now it wants to show you what it has learned...`,
    3: (n, next, prev) => `${n}, ${prev} has protected you through every challenge. Now it is ready for its greatest form yet. This moment belongs to both of you.`,
  },
  25: {
    2: (n, next, prev) => `${n}, Pikachu absolutely loves travelling with you! It has been getting stronger with every adventure. It is not evolving — it just wants to stay exactly as it is, but even more powerful!`,
  },
  // Eevee — stone evolutions. Stage key = stone type for lookup.
  133: {
    fire:     (n, next, prev) => `${n}, you held out the Fire Stone and ${prev} felt something stir deep inside. The warmth of every battle you've won together — the courage you showed when things were hard — it all blazed up at once. ${prev} has chosen its path. Watch closely...`,
    water:    (n, next, prev) => `${n}, as the Water Stone glowed in your hand, ${prev} closed its eyes. It thought of every time you stayed calm under pressure, every time you kept going when others would have stopped. The stone recognised something in ${prev} — something clear and deep. Here it comes...`,
    electric: (n, next, prev) => `${n}, the Thunder Stone crackled the moment ${prev} touched it. All that quick thinking, all those snap decisions in battle — ${prev} has been watching and learning. The energy that's been building between you both has finally found a way out. Get ready...`,
  },
  // Mew — no evolution, but level-up messages celebrate its growth
  151: {
    2: (n, next, prev) => `${n}, Mew contains the DNA of every Pokémon that has ever lived. As it grows stronger with you, it reaches deeper into that ancient power. Something is shifting inside it...`,
  },
  // Mewtwo — no evolution, raw power growth
  150: {
    2: (n, next, prev) => `${n}, Mewtwo was engineered to be the most powerful Pokémon ever created. With you, it pushes beyond even those limits. The air crackles with psychic energy...`,
  },
};

const BOSS_TRAINERS = [
  // ── Kanto Gym Leaders ──────────────────────────────────────────────────────
  {
    name: 'Brock',
    title: 'Boulder Badge',
    dialogue: "I've been the best gym leader since before you were hatched! Let's rock!",
    team: [74, 95],
    image: 'brock.png',
  },
  {
    name: 'Misty',
    title: 'Cascade Badge',
    dialogue: "Don't go easy on me just 'cause I'm cute! My Pokémon are FIERCE!",
    team: [120, 121, 54],
    image: 'misty.png',
  },
  {
    name: 'Lt. Surge',
    title: 'Thunder Badge',
    dialogue: "I was a war hero before I was a gym leader. You don't stand a chance, kid!",
    team: [100, 26, 125],
    image: 'ltsurge.png',
  },
  {
    name: 'Erika',
    title: 'Rainbow Badge',
    dialogue: "Oh my… I almost fell asleep. Let me show you the power of Grass types.",
    team: [71, 114, 45],
    image: 'erika.png',
  },
  {
    name: 'Koga',
    title: 'Soul Badge',
    dialogue: "Fwa ha ha! My Pokémon use the art of ninja — you will never see it coming!",
    team: [109, 110, 89],
    image: 'koga.png',
  },
  {
    name: 'Sabrina',
    title: 'Marsh Badge',
    dialogue: "I see your every move before you make it. Psychic power is absolute.",
    team: [64, 122, 65],
    image: 'sabrina.png',
  },
  {
    name: 'Blaine',
    title: 'Volcano Badge',
    dialogue: "Hah! You need more than water to put out my burning passion for Pokémon!",
    team: [58, 77, 78],
    image: 'blaine.png',
  },
  {
    name: 'Giovanni',
    title: 'Earth Badge',
    dialogue: "Hmph. A child? No matter — my Pokémon shall crush yours like pebbles!",
    team: [111, 112, 68, 103],
    image: 'giovanni.png',
  },
  // ── Elite Four ────────────────────────────────────────────────────────────
  {
    name: 'Lorelei',
    title: 'Elite Four',
    dialogue: "No one can best me when it comes to icy Pokémon! Freeze in your tracks!",
    team: [87, 91, 124, 131],
    image: 'giovanni.png', // placeholder until asset added
  },
  {
    name: 'Bruno',
    title: 'Elite Four',
    dialogue: "We will grind you down with the superior power of Fighting-type Pokémon!",
    team: [95, 107, 106, 68],
    image: 'brock.png', // placeholder
  },
  {
    name: 'Agatha',
    title: 'Elite Four',
    dialogue: "Hehehe… Old-fashioned, am I? My Ghost Pokémon will give you nightmares!",
    team: [94, 93, 110, 93],
    image: 'sabrina.png', // placeholder
  },
  {
    name: 'Lance',
    title: 'Elite Four',
    dialogue: "Dragonite is an extremely rare Pokémon. And I have three of them! Tremble!",
    team: [130, 148, 148, 149],
    image: 'giovanni.png', // placeholder
  },
  {
    name: 'Blue',
    title: '★ Champion ★',
    dialogue: "Smell ya later? No — you won't be going anywhere after I beat you!",
    team: [18, 59, 65, 112, 149, 6],
    image: 'giovanni.png', // placeholder
  },
];

// ─── MAP THEMES ──────────────────────────────────────────────────────────────
const MAP_THEMES = [
  // 0: Brock
  { name:'Boulder Cave Trail', ocean:'#4a5a6a', land:'#8a7250', landHi:'#b09060', landShadow:'#3a2c1e',
    trailFill:'#c8a060', trailEdge:'#7a5820', trailHi:'#e8c880', trailShadow:'rgba(30,18,8,0.5)',
    pathDone:'rgba(255,210,80,0.9)', glowDone:'rgba(255,190,50,0.8)', accent:'#c8a060', texture:'rock', deco:'rocks' },
  // 1: Misty
  { name:'Cerulean Sea Path', ocean:'#1a6a9a', land:'#3a8a3a', landHi:'#60b840', landShadow:'#1a4a1a',
    trailFill:'#a09060', trailEdge:'#605030', trailHi:'#c8b880', trailShadow:'rgba(10,30,10,0.45)',
    pathDone:'rgba(120,230,255,0.9)', glowDone:'rgba(80,220,255,0.9)', accent:'#40c0e0', texture:'water', deco:'flowers' },
  // 2: Lt. Surge
  { name:'Vermilion Thunder Road', ocean:'#2a3a20', land:'#5a6a30', landHi:'#7a8a40', landShadow:'#1a2010',
    trailFill:'#808060', trailEdge:'#404828', trailHi:'#a0a878', trailShadow:'rgba(20,24,10,0.5)',
    pathDone:'rgba(255,255,100,0.95)', glowDone:'rgba(255,255,80,0.95)', accent:'#f0e020', texture:'electric', deco:'cracks' },
  // 3: Erika
  { name:'Celadon Garden Walk', ocean:'#1a5a2a', land:'#2a8a2a', landHi:'#50c050', landShadow:'#0a2a0a',
    trailFill:'#7a5c30', trailEdge:'#3a2808', trailHi:'#a07840', trailShadow:'rgba(10,16,4,0.5)',
    pathDone:'rgba(140,255,100,0.9)', glowDone:'rgba(100,240,60,0.9)', accent:'#60d040', texture:'grass', deco:'flowers' },
  // 4: Koga
  { name:'Fuschia Shadow Maze', ocean:'#1a0a2a', land:'#3a2a5a', landHi:'#5a3a7a', landShadow:'#0e0618',
    trailFill:'#504840', trailEdge:'#201828', trailHi:'#706860', trailShadow:'rgba(14,8,20,0.6)',
    pathDone:'rgba(210,120,255,0.9)', glowDone:'rgba(200,100,255,0.9)', accent:'#a040d0', texture:'poison', deco:'mushrooms' },
  // 5: Sabrina
  { name:'Saffron Psychic Plane', ocean:'#200828', land:'#5a2a6a', landHi:'#8a4a9a', landShadow:'#120416',
    trailFill:'#9080a8', trailEdge:'#503860', trailHi:'#c0b0d8', trailShadow:'rgba(16,4,24,0.5)',
    pathDone:'rgba(255,160,240,0.9)', glowDone:'rgba(255,140,230,0.9)', accent:'#e060c0', texture:'psychic', deco:'crystals' },
  // 6: Blaine
  { name:'Cinnabar Volcano Climb', ocean:'#1a0a00', land:'#3a1800', landHi:'#6a2800', landShadow:'#0a0400',
    trailFill:'#2a1808', trailEdge:'#0a0400', trailHi:'#6a3010', trailShadow:'rgba(8,2,0,0.7)',
    pathDone:'rgba(255,180,60,0.95)', glowDone:'rgba(255,160,40,0.95)', accent:'#ff6010', texture:'fire', deco:'embers' },
  // 7: Giovanni
  { name:'Viridian Dark City', ocean:'#0a0a0a', land:'#1e1e1e', landHi:'#2e2e2e', landShadow:'#000000',
    trailFill:'#383838', trailEdge:'#101010', trailHi:'#585858', trailShadow:'rgba(0,0,0,0.7)',
    pathDone:'rgba(255,80,80,0.9)', glowDone:'rgba(255,60,60,0.9)', accent:'#cc2020', texture:'dark', deco:'ruins' },
  // 8-12 Elite Four / Champion
  { name:'Ice Path', ocean:'#3060a0', land:'#a0c8e8', landHi:'#d0f0ff', landShadow:'#205080',
    trailFill:'#c0ddf0', trailEdge:'#6090c0', trailHi:'#e8f4ff', trailShadow:'rgba(20,50,80,0.4)',
    pathDone:'rgba(220,250,255,0.95)', glowDone:'rgba(200,240,255,0.95)', accent:'#b0e0ff', texture:'ice', deco:'crystals' },
  { name:'Fighting Dojo', ocean:'#2a1008', land:'#6a3018', landHi:'#8a4a28', landShadow:'#180808',
    trailFill:'#8a5030', trailEdge:'#401808', trailHi:'#b07048', trailShadow:'rgba(20,8,4,0.5)',
    pathDone:'rgba(255,160,80,0.9)', glowDone:'rgba(250,140,60,0.9)', accent:'#d06030', texture:'rock', deco:'rocks' },
  { name:'Ghost Tower', ocean:'#06060e', land:'#1a1430', landHi:'#2a2048', landShadow:'#02020a',
    trailFill:'#282038', trailEdge:'#0c0818', trailHi:'#483858', trailShadow:'rgba(2,0,8,0.7)',
    pathDone:'rgba(180,140,255,0.9)', glowDone:'rgba(160,120,255,0.9)', accent:'#8050d0', texture:'ghost', deco:'mushrooms' },
  { name:"Dragon's Den", ocean:'#060c20', land:'#0a1a40', landHi:'#183060', landShadow:'#020608',
    trailFill:'#1a3050', trailEdge:'#081020', trailHi:'#305080', trailShadow:'rgba(2,4,12,0.6)',
    pathDone:'rgba(140,200,255,0.9)', glowDone:'rgba(120,180,255,0.9)', accent:'#4080e0', texture:'dragon', deco:'crystals' },
  { name:'Champions Hall', ocean:'#0e0202', land:'#2a0808', landHi:'#4a1010', landShadow:'#060000',
    trailFill:'#4a3010', trailEdge:'#201008', trailHi:'#806020', trailShadow:'rgba(6,2,0,0.6)',
    pathDone:'rgba(255,230,100,0.95)', glowDone:'rgba(255,220,80,0.95)', accent:'#ffc820', texture:'champion', deco:'ruins' },
];

// Per-gym path style — controls trail winding character
const PATH_STYLES = [
  { bendRange:0.28, cornerStyle:'round',  segments:9  }, // 0 Brock   — wide sweeping
  { bendRange:0.22, cornerStyle:'round',  segments:10 }, // 1 Misty   — coastal curves
  { bendRange:0.12, cornerStyle:'sharp',  segments:8  }, // 2 Surge   — tight grid
  { bendRange:0.20, cornerStyle:'round',  segments:11 }, // 3 Erika   — winding forest
  { bendRange:0.14, cornerStyle:'round',  segments:10 }, // 4 Koga    — cramped maze
  { bendRange:0.18, cornerStyle:'smooth', segments:10 }, // 5 Sabrina — flowing
  { bendRange:0.22, cornerStyle:'sharp',  segments:9  }, // 6 Blaine  — serpentine
  { bendRange:0.10, cornerStyle:'sharp',  segments:8  }, // 7 Giovanni— urban grid
];

const NODE_TYPES = ['battle', 'heal', 'catch', 'training', 'shop'];
const NODE_ICONS = { battle: '⚔️', heal: '💚', catch: '🔵', training: '⚡', shop: '🛒', boss: '💀', mystery: '❓', cooking: '🍳', maze: '🌊', fishing: '🎣' };
const NODE_MYSTERY_ICON = '❓';


const STATUS_LABELS = {
  burn:   '🔥BRN',
  poison: '☠️PSN',
  para:   '⚡PAR',
};

// ─── OPPONENT MOVE TABLE ──────────────────────────────────────────────────────
// Each type has 4-5 moves. power is base before level scaling.
// effect: 'burn_chance' | 'para_chance' | 'poison_chance' | 'debuff_atk' | null
const OPPONENT_MOVES = {
  normal:   [
    { name: 'Tackle',    power: 35, effect: null },
    { name: 'Scratch',   power: 30, effect: null },
    { name: 'Pound',     power: 28, effect: null },
    { name: 'Bite',      power: 40, effect: null },
    { name: 'Headbutt',  power: 45, effect: null },
  ],
  fire:     [
    { name: 'Ember',        power: 38, effect: 'burn_chance' },
    { name: 'Flame Charge', power: 42, effect: null },
    { name: 'Fire Fang',    power: 48, effect: 'burn_chance' },
    { name: 'Flamethrower', power: 60, effect: null },
  ],
  water:    [
    { name: 'Water Gun',  power: 38, effect: null },
    { name: 'Bubble',     power: 30, effect: null },
    { name: 'Aqua Jet',   power: 40, effect: null },
    { name: 'Surf',       power: 55, effect: null },
  ],
  grass:    [
    { name: 'Vine Whip',   power: 40, effect: null },
    { name: 'Razor Leaf',  power: 48, effect: null },
    { name: 'Absorb',      power: 30, effect: null },
    { name: 'Mega Drain',  power: 42, effect: null },
  ],
  electric: [
    { name: 'ThunderShock', power: 38, effect: 'para_chance' },
    { name: 'Spark',        power: 45, effect: null },
    { name: 'Thunder Wave', power: 0,  effect: 'para_chance' },
    { name: 'Thunderbolt',  power: 55, effect: 'para_chance' },
  ],
  psychic:  [
    { name: 'Confusion',   power: 38, effect: 'debuff_atk' },
    { name: 'Psybeam',     power: 48, effect: null },
    { name: 'Psyshock',    power: 50, effect: null },
    { name: 'Psychic',     power: 60, effect: 'debuff_atk' },
  ],
  rock:     [
    { name: 'Rock Throw',   power: 42, effect: null },
    { name: 'Rock Slide',   power: 52, effect: null },
    { name: 'Stone Edge',   power: 60, effect: null },
    { name: 'Rollout',      power: 35, effect: null },
  ],
  ground:   [
    { name: 'Mud Slap',   power: 28, effect: 'debuff_atk' },
    { name: 'Dig',        power: 55, effect: null },
    { name: 'Earthquake', power: 65, effect: null },
    { name: 'Sand Tomb',  power: 35, effect: null },
  ],
  poison:   [
    { name: 'Poison Sting', power: 30, effect: 'poison_chance' },
    { name: 'Acid',         power: 38, effect: 'debuff_atk' },
    { name: 'Sludge',       power: 48, effect: 'poison_chance' },
    { name: 'Venoshock',    power: 55, effect: null },
  ],
  ice:      [
    { name: 'Ice Shard',  power: 38, effect: null },
    { name: 'Icy Wind',   power: 42, effect: 'debuff_atk' },
    { name: 'Blizzard',   power: 60, effect: null },
    { name: 'Frost Breath', power: 48, effect: null },
  ],
  flying:   [
    { name: 'Gust',        power: 38, effect: null },
    { name: 'Wing Attack', power: 48, effect: null },
    { name: 'Aerial Ace',  power: 45, effect: null },
    { name: 'Air Slash',   power: 55, effect: null },
  ],
  fighting: [
    { name: 'Karate Chop', power: 42, effect: null },
    { name: 'Low Kick',    power: 38, effect: null },
    { name: 'Cross Chop',  power: 55, effect: null },
    { name: 'Force Palm',  power: 48, effect: 'para_chance' },
  ],
  ghost:    [
    { name: 'Lick',          power: 28, effect: 'para_chance' },
    { name: 'Shadow Sneak',  power: 38, effect: null },
    { name: 'Shadow Ball',   power: 52, effect: 'debuff_atk' },
    { name: 'Night Shade',   power: 45, effect: null },
  ],
  dragon:   [
    { name: 'Dragon Rage',   power: 48, effect: null },
    { name: 'Dragon Breath', power: 55, effect: 'para_chance' },
    { name: 'Twister',       power: 38, effect: null },
    { name: 'Dragon Claw',   power: 58, effect: null },
  ],
  fairy:    [
    { name: 'Fairy Wind',  power: 38, effect: null },
    { name: 'Dazzling Gleam', power: 50, effect: null },
    { name: 'Moonblast',   power: 58, effect: 'debuff_atk' },
    { name: 'Sweet Kiss',  power: 0,  effect: 'debuff_atk' },
  ],
  // ── Legendary bird moves — each includes their signature card ────────────
  articuno: [
    { name: 'Blizzard Wing', power: 75, effect: null },
    { name: 'Ice Shard',     power: 38, effect: null },
    { name: 'Blizzard',      power: 60, effect: null },
    { name: 'Tailwind',      power: 0,  effect: 'debuff_acc' },
  ],
  zapdos: [
    { name: 'Thunder Storm', power: 95, effect: 'para_chance' },
    { name: 'Thunderbolt',   power: 55, effect: 'para_chance' },
    { name: 'Drill Peck',    power: 52, effect: null },
    { name: 'Thunder Wave',  power: 0,  effect: 'paralyse' },
  ],
  moltres: [
    { name: 'Sacred Fire',   power: 80, effect: 'burn' },
    { name: 'Flamethrower',  power: 60, effect: null },
    { name: 'Wing Attack',   power: 48, effect: null },
    { name: 'Fire Spin',     power: 42, effect: 'burn_chance' },
  ],
  bug:      [
    { name: 'Bug Bite',    power: 38, effect: null },
    { name: 'Signal Beam', power: 48, effect: null },
    { name: 'X-Scissor',   power: 55, effect: null },
    { name: 'Leech Life',  power: 35, effect: null },
  ],
};

// Card templates keyed by starter type
// ─── CARD TEMPLATES (starter decks) ──────────────────────────────────────────
// cost: 0=free utility, 1=standard, 2=powerful, 3=ultimate(exhaust)
const CARD_TEMPLATES = {
  grass: [
    { id:'vine_whip',    name:'Vine Whip',    icon:'🌿', type:'grass',   power:45, cost:1, effect:'',                          special: null },
    { id:'absorb',       name:'Absorb',       icon:'🌱', type:'grass',   power:25, cost:1, effect:'Heal 12 HP',                special: 'heal_10' },
    { id:'growl',        name:'Growl',        icon:'🗣️', type:'normal',  power:0,  cost:0, effect:'Opp ATK -10, draw 1',      special: 'growl_draw' },
    { id:'razor_leaf',   name:'Razor Leaf',   icon:'🍃', type:'grass',   power:55, cost:2, effect:'High crit rate',            special: 'high_crit' },
    { id:'sleep_powder', name:'Sleep Powder', icon:'💤', type:'grass',   power:0,  cost:1, effect:'Skip opp next turn',        special: 'skip_opp' },
    { id:'leech_seed',   name:'Leech Seed',   icon:'🌾', type:'grass',   power:20, cost:2, effect:'Drain 20/turn × 3',        special: 'leech' },
    { id:'synthesis',    name:'Synthesis',    icon:'☀️', type:'grass',   power:0,  cost:2, effect:'Heal 35 HP + draw 1',      special: 'heal_25_draw' },
    { id:'mega_drain',   name:'Mega Drain',   icon:'💚', type:'grass',   power:40, cost:2, effect:'Heal 20 HP',               special: 'mega_drain' },
    { id:'spore',        name:'Spore',        icon:'🍄', type:'grass',   power:0,  cost:0, effect:'Skip opp + draw 1',        special: 'spore' },
    { id:'solar_beam',   name:'Solar Beam',   icon:'🌟', type:'grass',   power:95, cost:3, effect:'One use only.',            special: null, exhaust: true },
  ],
  fire: [
    { id:'ember',        name:'Ember',        icon:'🔥', type:'fire',    power:40, cost:1, effect:'15% burn',                 special: 'burn_chance' },
    { id:'scratch',      name:'Scratch',      icon:'🐾', type:'normal',  power:32, cost:1, effect:'Draw 1 card',              special: 'draw_1' },
    { id:'leer',         name:'Leer',         icon:'👁️', type:'normal',  power:0,  cost:0, effect:'Opp DEF -15, free',       special: 'leer_free' },
    { id:'flamethrower', name:'Flamethrower', icon:'🌋', type:'fire',    power:65, cost:2, effect:'',                         special: null },
    { id:'smokescreen',  name:'Smokescreen',  icon:'💨', type:'normal',  power:0,  cost:1, effect:'Opp accuracy -25%',        special: 'debuff_acc' },
    { id:'inferno',      name:'Inferno',      icon:'🌠', type:'fire',    power:35, cost:2, effect:'Burn guaranteed',          special: 'burn' },
    { id:'flame_charge', name:'Flame Charge', icon:'🫧', type:'fire',    power:35, cost:1, effect:'+1 energy next turn',      special: 'flame_charge' },
    { id:'overheat',     name:'Overheat',     icon:'♨️', type:'fire',    power:85, cost:2, effect:'25 recoil',               special: 'overheat' },
    { id:'slash',        name:'Slash',        icon:'⚔️', type:'normal',  power:45, cost:1, effect:'Always crits',             special: 'always_crit' },
    { id:'fire_blast',   name:'Fire Blast',   icon:'💫', type:'fire',    power:105,cost:3, effect:'One use only.',            special: null, exhaust: true },
  ],
  water: [
    { id:'water_gun',    name:'Water Gun',    icon:'💧', type:'water',   power:42, cost:1, effect:'',                         special: null },
    { id:'withdraw',     name:'Withdraw',     icon:'🛡️', type:'water',   power:0,  cost:1, effect:'Block 30 dmg next hit',   special: 'shield_35' },
    { id:'growl',        name:'Growl',        icon:'🗣️', type:'normal',  power:0,  cost:0, effect:'Opp ATK -10, draw 1',     special: 'growl_draw' },
    { id:'bubble',       name:'Bubble',       icon:'🫧', type:'water',   power:30, cost:1, effect:'Slow opp',                 special: 'slow_opp' },
    { id:'shell_armor',  name:'Shell Armor',  icon:'🐢', type:'water',   power:0,  cost:2, effect:'Block 45 dmg + draw 1',   special: 'shield_draw' },
    { id:'rain_dance',   name:'Rain Dance',   icon:'🌧️', type:'water',   power:0,  cost:1, effect:'Water +25% × 3 turns',   special: 'rain' },
    { id:'aqua_jet',     name:'Aqua Jet',     icon:'💦', type:'water',   power:50, cost:2, effect:'Always first',             special: null },
    { id:'surf',         name:'Surf',         icon:'🏄', type:'water',   power:62, cost:2, effect:'',                         special: null },
    { id:'whirlpool',    name:'Whirlpool',    icon:'🌀', type:'water',   power:35, cost:2, effect:'Trap opp: skip next turn', special: 'skip_opp' },
    { id:'hydro_pump',   name:'Hydro Pump',   icon:'🌊', type:'water',   power:100,cost:3, effect:'One use only.',            special: null, exhaust: true },
  ],
  electric: [
    { id:'quick_attack', name:'Quick Attack', icon:'💨', type:'normal',  power:25, cost:0, effect:'Free! Draw 1',             special: 'draw_1' },
    { id:'thundershock', name:'ThunderShock', icon:'⚡', type:'electric',power:40, cost:1, effect:'15% paralyse',             special: 'para_chance' },
    { id:'thunder_wave', name:'Thunder Wave', icon:'🌩️', type:'electric',power:0,  cost:1, effect:'Paralyse opp',            special: 'paralyse' },
    { id:'spark',        name:'Spark',        icon:'🔆', type:'electric',power:45, cost:1, effect:'',                         special: null },
    { id:'charge',       name:'Charge',       icon:'🔋', type:'electric',power:0,  cost:1, effect:'Next elec. move +50%',    special: 'charge' },
    { id:'agility',      name:'Agility',      icon:'🏃', type:'normal',  power:0,  cost:1, effect:'+1 energy + draw 1',       special: 'agility' },
    { id:'thunderbolt',  name:'Thunderbolt',  icon:'☇',  type:'electric',power:65, cost:2, effect:'25% paralyse',             special: 'para_chance' },
    { id:'discharge',    name:'Discharge',    icon:'🌐', type:'electric',power:50, cost:2, effect:'15 self damage',           special: 'discharge' },
    { id:'volt_tackle',  name:'Volt Tackle',  icon:'⚡', type:'electric',power:75, cost:2, effect:'20 recoil. One use only.', special: 'recoil_15', exhaust: true },
    { id:'thunder',      name:'Thunder',      icon:'🌪️', type:'electric',power:100,cost:3, effect:'35% paralyse. One use only.', special: 'para_chance', exhaust: true },
  ],
  // ── Eevee starting deck — flexible normal-type ───────────────────────────
  eevee: [
    { id:'tackle',       name:'Tackle',       icon:'💥', type:'normal',  power:38, cost:1, effect:'',                         special: null },
    { id:'quick_attack', name:'Quick Attack', icon:'💨', type:'normal',  power:25, cost:0, effect:'Free! Draw 1',             special: 'draw_1' },
    { id:'growl',        name:'Growl',        icon:'🗣️', type:'normal',  power:0,  cost:0, effect:'Opp ATK -10, draw 1',     special: 'growl_draw' },
    { id:'sand_attack',  name:'Sand Attack',  icon:'🏜️', type:'normal',  power:0,  cost:1, effect:'Opp accuracy -25%',       special: 'debuff_acc' },
    { id:'headbutt',     name:'Headbutt',     icon:'💫', type:'normal',  power:48, cost:1, effect:'',                         special: null },
    { id:'last_resort',  name:'Last Resort',  icon:'🌟', type:'normal',  power:65, cost:2, effect:'High crit rate',           special: 'high_crit' },
    { id:'baton_pass',   name:'Baton Pass',   icon:'🎽', type:'normal',  power:0,  cost:1, effect:'+1 energy + draw 2',       special: 'agility' },
    { id:'swift',        name:'Swift',        icon:'✨', type:'normal',  power:45, cost:1, effect:'Never misses',             special: null },
    { id:'covet',        name:'Covet',        icon:'💝', type:'normal',  power:30, cost:1, effect:'Heal 10 HP',               special: 'heal_10' },
    { id:'hyper_voice',  name:'Hyper Voice',  icon:'📣', type:'normal',  power:90, cost:3, effect:'One use only.',            special: null, exhaust: true },
  ],
};

// Standard cards for caught Pokémon — 5 cards, varied utility
// Growl and Leer are cost-0 so they're never dead cards
const STANDARD_CARDS = [
  { id:'tackle',   name:'Tackle',   icon:'💥', type:'normal', power:38, cost:1, effect:'',              special: null },
  { id:'scratch',  name:'Scratch',  icon:'🐾', type:'normal', power:32, cost:1, effect:'Draw 1',        special: 'draw_1' },
  { id:'headbutt', name:'Headbutt', icon:'💫', type:'normal', power:48, cost:1, effect:'',              special: null },
  { id:'growl',    name:'Growl',    icon:'🗣️', type:'normal', power:0,  cost:0, effect:'ATK -10, draw 1', special: 'growl_draw' },
  { id:'leer',     name:'Leer',     icon:'👁️', type:'normal', power:0,  cost:0, effect:'DEF -15, free', special: 'leer_free' },
];

// 5 type-specific cards per type — full identity for caught Pokémon
const TYPE_SIGNATURE_CARDS = {
  fire:     [
    { id:'ember',        name:'Ember',       icon:'🔥', type:'fire',     power:40, cost:1, effect:'15% burn',         special: 'burn_chance' },
    { id:'flamethrower', name:'Flamethrower',icon:'🌋', type:'fire',     power:65, cost:2, effect:'',                 special: null },
    { id:'inferno',      name:'Inferno',     icon:'🌠', type:'fire',     power:35, cost:2, effect:'Burn guaranteed',  special: 'burn' },
    { id:'flame_charge', name:'Flame Charge',icon:'🫧', type:'fire',     power:35, cost:1, effect:'+1 energy next',  special: 'flame_charge' },
    { id:'smokescreen',  name:'Smokescreen', icon:'💨', type:'normal',   power:0,  cost:1, effect:'Acc -25%',         special: 'debuff_acc' },
  ],
  water:    [
    { id:'water_gun',   name:'Water Gun',   icon:'💧', type:'water',    power:42, cost:1, effect:'',                 special: null },
    { id:'bubble',      name:'Bubble',      icon:'🫧', type:'water',    power:30, cost:1, effect:'Slow opp',         special: 'slow_opp' },
    { id:'withdraw',    name:'Withdraw',    icon:'🛡️', type:'water',    power:0,  cost:1, effect:'Block 30 dmg',    special: 'shield_35' },
    { id:'surf',        name:'Surf',        icon:'🏄', type:'water',    power:62, cost:2, effect:'',                 special: null },
    { id:'aqua_jet',    name:'Aqua Jet',    icon:'💦', type:'water',    power:50, cost:2, effect:'Always first',     special: null },
  ],
  grass:    [
    { id:'vine_whip',   name:'Vine Whip',   icon:'🌿', type:'grass',    power:45, cost:1, effect:'',                 special: null },
    { id:'absorb',      name:'Absorb',      icon:'🌱', type:'grass',    power:25, cost:1, effect:'Heal 12 HP',       special: 'heal_10' },
    { id:'sleep_powder',name:'Sleep Powder',icon:'💤', type:'grass',    power:0,  cost:1, effect:'Skip opp',         special: 'skip_opp' },
    { id:'mega_drain',  name:'Mega Drain',  icon:'💚', type:'grass',    power:40, cost:2, effect:'Heal 20 HP',       special: 'mega_drain' },
    { id:'leech_seed',  name:'Leech Seed',  icon:'🌾', type:'grass',    power:20, cost:2, effect:'Drain 20/turn×3', special: 'leech' },
  ],
  electric: [
    { id:'thundershock',name:'ThunderShock',icon:'⚡', type:'electric', power:40, cost:1, effect:'15% paralyse',    special: 'para_chance' },
    { id:'spark',       name:'Spark',       icon:'🔆', type:'electric', power:45, cost:1, effect:'',                 special: null },
    { id:'thunder_wave',name:'Thunder Wave',icon:'🌩️', type:'electric', power:0,  cost:1, effect:'Paralyse opp',   special: 'paralyse' },
    { id:'thunderbolt', name:'Thunderbolt', icon:'☇',  type:'electric', power:65, cost:2, effect:'25% paralyse',   special: 'para_chance' },
    { id:'discharge',   name:'Discharge',   icon:'🌐', type:'electric', power:50, cost:2, effect:'15 self dmg',     special: 'discharge' },
  ],
  psychic:  [
    { id:'confusion',   name:'Confusion',   icon:'🌀', type:'psychic',  power:38, cost:1, effect:'20% ATK debuff',  special: 'debuff_atk' },
    { id:'psybeam',     name:'Psybeam',     icon:'💜', type:'psychic',  power:48, cost:1, effect:'',                 special: null },
    { id:'psyshock',    name:'Psyshock',    icon:'🔮', type:'psychic',  power:55, cost:2, effect:'Pierces shield',   special: 'psyshock' },
    { id:'calm_mind',   name:'Calm Mind',   icon:'🧘', type:'psychic',  power:0,  cost:1, effect:'Next move +30%',  special: 'calm_mind' },
    { id:'future_sight',name:'Future Sight',icon:'👁', type:'psychic',  power:70, cost:2, effect:'Hits next turn',  special: 'future_sight' },
  ],
  rock:     [
    { id:'rock_throw',  name:'Rock Throw',  icon:'🪨', type:'rock',     power:42, cost:1, effect:'',                 special: null },
    { id:'rollout',     name:'Rollout',     icon:'⚙️', type:'rock',     power:35, cost:1, effect:'',                 special: null },
    { id:'stealth_rock',name:'Stealth Rock',icon:'💎', type:'rock',     power:0,  cost:1, effect:'Chip 15/turn×3',  special: 'stealth_rock' },
    { id:'rock_slide',  name:'Rock Slide',  icon:'🏔️', type:'rock',     power:58, cost:2, effect:'25% flinch',      special: 'flinch' },
    { id:'stone_edge',  name:'Stone Edge',  icon:'🗿', type:'rock',     power:65, cost:2, effect:'High crit',        special: 'high_crit' },
  ],
  ground:   [
    { id:'mud_slap',    name:'Mud Slap',    icon:'🟫', type:'ground',   power:28, cost:1, effect:'Acc -20%',         special: 'debuff_acc' },
    { id:'sand_attack', name:'Sand Attack', icon:'🏜️', type:'ground',   power:0,  cost:0, effect:'Acc -30%, free',  special: 'debuff_acc' },
    { id:'dig',         name:'Dig',         icon:'⛏️', type:'ground',   power:58, cost:2, effect:'',                 special: null },
    { id:'earthquake',  name:'Earthquake',  icon:'🌋', type:'ground',   power:70, cost:2, effect:'15 recoil',        special: 'recoil_15' },
    { id:'bulldoze',    name:'Bulldoze',    icon:'🚜', type:'ground',   power:40, cost:1, effect:'Opp speed -1',     special: 'slow_opp' },
  ],
  poison:   [
    { id:'poison_sting',name:'Poison Sting',icon:'☠️', type:'poison',   power:30, cost:1, effect:'35% poison',      special: 'poison' },
    { id:'acid',        name:'Acid',        icon:'🧪', type:'poison',   power:38, cost:1, effect:'DEF -10',          special: 'debuff_def' },
    { id:'toxic',       name:'Toxic',       icon:'💀', type:'poison',   power:0,  cost:1, effect:'Poison guaranteed', special: 'poison' },
    { id:'sludge',      name:'Sludge',      icon:'🟢', type:'poison',   power:50, cost:2, effect:'50% poison',       special: 'poison' },
    { id:'venoshock',   name:'Venoshock',   icon:'💉', type:'poison',   power:55, cost:2, effect:'×2 if poisoned',   special: 'venoshock' },
  ],
  normal:   [
    { id:'double_slap', name:'Double Slap', icon:'👋', type:'normal',   power:45, cost:1, effect:'',                 special: null },
    { id:'swift',       name:'Swift',       icon:'⭐', type:'normal',   power:40, cost:1, effect:'Never misses',     special: null },
    { id:'body_slam',   name:'Body Slam',   icon:'🏋️', type:'normal',   power:58, cost:2, effect:'25% para',        special: 'para_chance' },
    { id:'hyper_voice', name:'Hyper Voice', icon:'📣', type:'normal',   power:55, cost:2, effect:'ATK -15',          special: 'debuff_atk' },
    { id:'metronome',   name:'Metronome',   icon:'🎵', type:'normal',   power:0,  cost:0, effect:'Draw 2, free',     special: 'metronome' },
  ],
  flying:   [
    { id:'gust',        name:'Gust',        icon:'🌬️', type:'flying',   power:38, cost:1, effect:'',                 special: null },
    { id:'wing_attack', name:'Wing Attack', icon:'🦅', type:'flying',   power:48, cost:1, effect:'',                 special: null },
    { id:'aerial_ace',  name:'Aerial Ace',  icon:'✈️', type:'flying',   power:45, cost:1, effect:'Never misses',     special: null },
    { id:'roost',       name:'Roost',       icon:'🪺', type:'flying',   power:0,  cost:2, effect:'Heal 35 HP',       special: 'roost' },
    { id:'air_slash',   name:'Air Slash',   icon:'🌪️', type:'flying',   power:58, cost:2, effect:'25% flinch',      special: 'flinch' },
  ],
  ice:      [
    { id:'ice_shard',   name:'Ice Shard',   icon:'❄️', type:'ice',      power:38, cost:1, effect:'Always first',     special: null },
    { id:'icy_wind',    name:'Icy Wind',    icon:'🌬️', type:'ice',      power:40, cost:1, effect:'Opp speed -1',     special: 'slow_opp' },
    { id:'hail',        name:'Hail',        icon:'🌨️', type:'ice',      power:0,  cost:1, effect:'Opp -12/turn×3',  special: 'hail' },
    { id:'blizzard',    name:'Blizzard',    icon:'❄️', type:'ice',      power:65, cost:2, effect:'',                 special: null },
    { id:'frost_breath',name:'Frost Breath',icon:'🥶', type:'ice',      power:52, cost:2, effect:'Always crits',     special: 'always_crit' },
  ],
  fighting: [
    { id:'karate_chop', name:'Karate Chop', icon:'🥊', type:'fighting', power:45, cost:1, effect:'High crit',        special: 'high_crit' },
    { id:'low_kick',    name:'Low Kick',    icon:'🦵', type:'fighting', power:40, cost:1, effect:'',                 special: null },
    { id:'cross_chop',  name:'Cross Chop',  icon:'✊', type:'fighting', power:65, cost:2, effect:'High crit',        special: 'high_crit' },
    { id:'close_combat',name:'Close Combat',icon:'💪', type:'fighting', power:80, cost:2, effect:'25 recoil',        special: 'close_combat' },
    { id:'focus_punch', name:'Focus Punch', icon:'🎯', type:'fighting', power:75, cost:2, effect:'Miss if hit first', special: 'focus_punch' },
  ],
  ghost:    [
    { id:'lick',        name:'Lick',        icon:'👻', type:'ghost',    power:28, cost:1, effect:'35% para',         special: 'para_chance' },
    { id:'shadow_sneak',name:'Shadow Sneak',icon:'🌑', type:'ghost',    power:38, cost:1, effect:'Always first',     special: null },
    { id:'night_shade', name:'Night Shade', icon:'🌙', type:'ghost',    power:0,  cost:1, effect:'Dmg = opp level',  special: 'night_shade' },
    { id:'curse',       name:'Curse',       icon:'💢', type:'ghost',    power:0,  cost:1, effect:'Opp -20/turn, you -10', special: 'curse' },
    { id:'shadow_ball', name:'Shadow Ball', icon:'🌑', type:'ghost',    power:58, cost:2, effect:'DEF -15',          special: 'debuff_def' },
  ],
  dragon:   [
    { id:'twister',     name:'Twister',     icon:'🌪️', type:'dragon',  power:38, cost:1, effect:'25% flinch',       special: 'flinch' },
    { id:'dragon_rage', name:'Dragon Rage', icon:'🐉', type:'dragon',  power:55, cost:2, effect:'',                 special: null },
    { id:'dragon_breath',name:'Dragon Breath',icon:'💨',type:'dragon', power:52, cost:2, effect:'25% para',          special: 'para_chance' },
    { id:'dragon_dance',name:'Dragon Dance',icon:'💃', type:'dragon',  power:0,  cost:2, effect:'+20% dmg forever', special: 'dragon_dance' },
    { id:'outrage',     name:'Outrage',     icon:'😤', type:'dragon',  power:95, cost:3, effect:'20 recoil. Once.',  special: 'recoil_15', exhaust: true },
  ],
  fairy:    [
    { id:'fairy_wind',  name:'Fairy Wind',  icon:'🧚', type:'fairy',   power:38, cost:1, effect:'',                 special: null },
    { id:'sweet_kiss',  name:'Sweet Kiss',  icon:'💋', type:'fairy',   power:0,  cost:1, effect:'ATK -25 for 1t',  special: 'debuff_atk' },
    { id:'misty_terrain',name:'Misty Terrain',icon:'✨',type:'fairy',  power:0,  cost:1, effect:'Clears status',    special: 'misty_terrain' },
    { id:'moonblast',   name:'Moonblast',   icon:'🌕', type:'fairy',   power:62, cost:2, effect:'ATK -10',          special: 'debuff_atk' },
    { id:'dazzling_gleam',name:'Dazzling Gleam',icon:'💫',type:'fairy',power:55, cost:2, effect:'',                 special: null },
  ],
  // ── Mew starter deck — random cross-type wildcard ───────────────────────
  mew: [
    { id:'transform',   name:'Transform',   icon:'✨', type:'psychic', power:0,  cost:0, effect:'Copy opp last move+50%', special: 'transform' },
    { id:'metronome',   name:'Metronome',   icon:'🎵', type:'normal',  power:0,  cost:0, effect:'Draw 2, free',          special: 'metronome' },
    { id:'ancient_power',name:'Ancient Power',icon:'💎',type:'psychic',power:50, cost:1, effect:'10% all stats +1',       special: 'ancient_power' },
    { id:'psychic_m',   name:'Psychic',     icon:'🔮', type:'psychic', power:65, cost:2, effect:'ATK -10',               special: 'debuff_atk' },
    { id:'barrier',     name:'Barrier',     icon:'🛡️', type:'psychic', power:0,  cost:1, effect:'Block 40 dmg',          special: 'shield_35' },
    { id:'swift_m',     name:'Swift',       icon:'⭐', type:'normal',  power:40, cost:1, effect:'Never misses',          special: null },
    { id:'soft_boiled', name:'Soft-Boiled', icon:'🥚', type:'normal',  power:0,  cost:2, effect:'Heal 45 HP',            special: 'heal_25_draw' },
    { id:'pound_m',     name:'Pound',       icon:'👊', type:'normal',  power:35, cost:1, effect:'',                      special: null },
    { id:'mega_punch',  name:'Mega Punch',  icon:'💥', type:'normal',  power:58, cost:2, effect:'High crit',             special: 'high_crit' },
    { id:'minimize',    name:'Minimize',    icon:'🌀', type:'normal',  power:0,  cost:1, effect:'+1 energy + draw 1',    special: 'agility' },
  ],
  // ── Mewtwo starter deck — enhanced psychic powerhouse ───────────────────
  mewtwo: [
    { id:'psystrike',   name:'Psystrike',   icon:'🔮', type:'psychic', power:65, cost:1, effect:'Pierces shield',        special: 'psyshock' },
    { id:'recover',     name:'Recover',     icon:'💜', type:'psychic', power:0,  cost:1, effect:'Heal 50 HP',            special: 'recover' },
    { id:'psycho_cut',  name:'Psycho Cut',  icon:'✂️', type:'psychic', power:50, cost:1, effect:'High crit',             special: 'high_crit' },
    { id:'amnesia',     name:'Amnesia',     icon:'💭', type:'psychic', power:0,  cost:1, effect:'+1 energy + draw 2',    special: 'agility' },
    { id:'future_sight_m',name:'Future Sight',icon:'👁',type:'psychic',power:70, cost:2, effect:'Hits next turn',        special: 'future_sight' },
    { id:'aura_sphere', name:'Aura Sphere', icon:'⚡', type:'psychic', power:55, cost:2, effect:'Never misses',          special: null },
    { id:'disable',     name:'Disable',     icon:'🚫', type:'psychic', power:0,  cost:1, effect:'Opp utility blocked×2', special: 'taunt' },
    { id:'barrier_m',   name:'Barrier',     icon:'🛡️', type:'psychic', power:0,  cost:1, effect:'Block 55 dmg',          special: 'shield_50' },
    { id:'confusion_m', name:'Confusion',   icon:'🌀', type:'psychic', power:38, cost:1, effect:'20% ATK debuff',        special: 'debuff_atk' },
    { id:'hyper_beam_m',name:'Hyper Beam',  icon:'💫', type:'psychic', power:110,cost:3, effect:'One use only.',         special: null, exhaust: true },
  ],
  bug:      [
    { id:'bug_bite',    name:'Bug Bite',    icon:'🐛', type:'bug',      power:40, cost:1, effect:'',                 special: null },
    { id:'string_shot', name:'String Shot', icon:'🕸️', type:'bug',      power:0,  cost:0, effect:'Speed -1, draw 1',special: 'string_shot' },
    { id:'signal_beam', name:'Signal Beam', icon:'📡', type:'bug',      power:48, cost:1, effect:'',                 special: null },
    { id:'x_scissor',   name:'X-Scissor',   icon:'✂️', type:'bug',      power:60, cost:2, effect:'',                 special: null },
    { id:'megahorn',    name:'Megahorn',    icon:'🦏', type:'bug',      power:70, cost:2, effect:'20 recoil',        special: 'recoil_15' },
  ],
};

// Build a deck for a caught (non-starter) Pokémon — 5 standard + 5 type-specific
function buildPokemonDeck(type) {
  const typeSig = TYPE_SIGNATURE_CARDS[type] || TYPE_SIGNATURE_CARDS.normal;
  const std     = STANDARD_CARDS.slice(0, 5).map(c => ({ ...c }));
  const sig     = typeSig.slice(0, 5).map(c => ({ ...c }));
  return [...std, ...sig];
}

// Starter deck composition: indices into CARD_TEMPLATES[type]
// Grass:    0=VineWhip 1=Absorb 2=Growl(0cost) 3=RazorLeaf 4=SleepPowder 5=LeechSeed 6=Synthesis 7=MegaDrain 8=Spore(0cost) 9=SolarBeam
// Fire:     0=Ember 1=Scratch 2=Leer(0cost) 3=Flamethrower 4=Smokescreen 5=Inferno 6=FlameCharge 7=Overheat 8=Slash 9=FireBlast
// Water:    0=WaterGun 1=Withdraw 2=Growl(0cost) 3=Bubble 4=ShellArmor 5=RainDance 6=AquaJet 7=Surf 8=Whirlpool 9=HydroPump
// Electric: 0=QuickAttack(0cost) 1=ThunderShock 2=ThunderWave 3=Spark 4=Charge 5=Agility 6=Thunderbolt 7=Discharge 8=VoltTackle 9=Thunder
// Starting 10 cards — variety of costs to give interesting first turns
const DEFAULT_DECK_INDICES = [0, 1, 2, 3, 4, 0, 1, 5, 6, 3];

// Common wild Pokémon pool (ids)
const WILD_POOL = {
  common: [19,16,10,13,21,41,43,46,48,60,63,66,69,72,74,77,79,81,84,86,88,90,92,95,96,98,100,102,104,108,111,113,114,116,118,120],
  uncommon: [23,27,29,32,37,50,52,54,56,58,88,90,92,95,109,115,117,119,121,122,123,124,125,126,127,128,129,130,131,132,133,136,137,138,140,142],
  rare: [131,130,142,149,143,6,9,3,65,68,71,76,78,80,82,83,85,87,89,91,93,94,97,99,101,103,105,107,110,112],
  legendary: [144, 145, 146],  // Articuno, Zapdos, Moltres
};

// ── Battle background selection by opponent type ──────────────────────────
const BATTLE_BACKGROUNDS = {
  normal:   'assets/grass_bg.png',
  fire:     'assets/fire_bg.png',
  water:    'assets/water_bg.png',
  grass:    'assets/grass_bg.png',
  electric: 'assets/electric_bg.png',
  ice:      'assets/water_bg.png',
  fighting: 'assets/ground_rock_bg.png',
  poison:   'assets/poison_bg.png',
  ground:   'assets/ground_rock_bg.png',
  flying:   'assets/grass_bg.png',
  psychic:  'assets/ice_bg.png',
  bug:      'assets/grass_bg.png',
  rock:     'assets/ground_rock_bg.png',
  ghost:    'assets/dark_bg.png',
  dragon:   'assets/ground_rock_bg.png',
  dark:     'assets/dark_bg.png',
  steel:    'assets/electric_bg.png',
  fairy:    'assets/ice_bg.png',
};
function getBattleBg(type) {
  return BATTLE_BACKGROUNDS[type] || 'assets/neutral_bg.png';
}
function setBattleBg(type, isBoss = false) {
  const src = getBattleBg(type);
  const selector = isBoss ? '#screen-boss .battle-bg-img' : '#screen-battle .battle-bg-img';
  const img = document.querySelector(selector);
  if (!img) return;
  img.style.opacity = '1';   // clear any onerror-applied opacity:0
  img.onerror = () => { img.style.opacity = '0'; };  // re-arm for real failures
  img.src = src;
}

// ─── SHOP ITEMS CATALOGUE ─────────────────────────────────────────────────────
const SHOP_ITEMS = [
  // ── Consumables ──────────────────────────────────────────────────────────
  {
    id: 'oran_berry',     name: 'Oran Berry',      icon: '🍊', category: 'consumable',
    description: 'Auto-heals 10 HP when a Pokémon drops below 50% health.',
    price: 12, maxStack: 3, trigger: 'passive',
  },
  {
    id: 'revive_potion',  name: 'Revive Potion',   icon: '🧪', category: 'consumable',
    description: 'Saves a Pokémon from fainting, restoring 30% HP instead.',
    price: 25, maxStack: 2, trigger: 'on_faint',
  },
  {
    id: 'potion',         name: 'Potion',           icon: '💊', category: 'consumable',
    description: 'Heals 30 HP to one Pokémon right now.',
    price: 15, maxStack: 3, trigger: 'use',
  },
  {
    id: 'super_potion',   name: 'Super Potion',     icon: '💉', category: 'consumable',
    description: 'Heals 60 HP to one Pokémon right now.',
    price: 30, maxStack: 2, trigger: 'use',
  },
  {
    id: 'ultra_ball',     name: 'Ultra Ball',       icon: '🟡', category: 'ball',
    description: '+50% catch rate for Uncommon and Rare Pokémon.',
    price: 20, maxStack: 3, trigger: 'catch',
  },
  {
    id: 'master_ball',    name: 'Master Ball',      icon: '🟣', category: 'ball',
    description: '100% catch rate. Only one per run!',
    price: 80, maxStack: 1, trigger: 'catch', unique: true,
  },
  {
    id: 'repel',          name: 'Repel',             icon: '🚫', category: 'consumable',
    description: 'Next Catch node: only Uncommon or Rare Pokémon appear.',
    price: 18, maxStack: 2, trigger: 'catch_modifier',
  },
  {
    id: 'lure',           name: 'Lure',              icon: '🎣', category: 'consumable',
    description: 'Increases Rare encounter chance for the rest of this map.',
    price: 30, maxStack: 1, trigger: 'lure_modifier',
  },
  // ── Held Items (equipped to a Pokémon) ───────────────────────────────────
  {
    id: 'shell_bell',     name: 'Shell Bell',        icon: '🔔', category: 'held',
    description: 'Holder heals 5 HP whenever they deal damage.',
    price: 40, maxStack: 1, trigger: 'held',
  },
  {
    id: 'lucky_egg',      name: 'Lucky Egg',         icon: '🥚', category: 'held',
    description: 'Holder gains +2 levels per battle instead of +1.',
    price: 50, maxStack: 1, trigger: 'held',
  },
  {
    id: 'amulet_coin',    name: 'Amulet Coin',       icon: '🪙', category: 'held',
    description: 'Holder doubles gold earned from battles.',
    price: 55, maxStack: 1, trigger: 'held',
  },
  {
    id: 'focus_sash',     name: 'Focus Sash',        icon: '🎗', category: 'held',
    description: 'Holder survives one KO hit with 1 HP. One use per battle.',
    price: 60, maxStack: 1, trigger: 'held',
  },
  {
    id: 'charcoal',       name: 'Charcoal',          icon: '🪵', category: 'held',
    description: 'Boosts Fire-type moves by 20%.',
    price: 30, maxStack: 1, trigger: 'held',
  },
  {
    id: 'mystic_water',   name: 'Mystic Water',      icon: '💦', category: 'held',
    description: 'Boosts Water-type moves by 20%.',
    price: 30, maxStack: 1, trigger: 'held',
  },
  {
    id: 'miracle_seed',   name: 'Miracle Seed',      icon: '🌱', category: 'held',
    description: 'Boosts Grass-type moves by 20%.',
    price: 30, maxStack: 1, trigger: 'held',
  },
  {
    id: 'magnet',         name: 'Magnet',             icon: '🧲', category: 'held',
    description: 'Boosts Electric-type moves by 20%.',
    price: 30, maxStack: 1, trigger: 'held',
  },
  {
    id: 'leftovers',      name: 'Leftovers',          icon: '🍖', category: 'held',
    description: 'Holder heals 5 HP at the start of every turn.',
    price: 45, maxStack: 1, trigger: 'held',
  },
  // ── Evolution Stones (Eevee only) ────────────────────────────────────────
  {
    id: 'fire_stone',    name: 'Fire Stone',    icon: '🔥', category: 'stone',
    description: 'Evolves Eevee into Flareon. Fire-type. Cannot be undone.',
    price: 50, maxStack: 1, unique: true,
    stoneTarget: { id: 136, type: 'fire', name: 'Flareon' },
  },
  {
    id: 'water_stone',   name: 'Water Stone',   icon: '💧', category: 'stone',
    description: 'Evolves Eevee into Vaporeon. Water-type. Cannot be undone.',
    price: 50, maxStack: 1, unique: true,
    stoneTarget: { id: 134, type: 'water', name: 'Vaporeon' },
  },
  {
    id: 'thunder_stone', name: 'Thunder Stone', icon: '⚡', category: 'stone',
    description: 'Evolves Eevee into Jolteon. Electric-type. Cannot be undone.',
    price: 50, maxStack: 1, unique: true,
    stoneTarget: { id: 135, type: 'electric', name: 'Jolteon' },
  },
];

// ─── GOLD TABLES (per round / boss) ───────────────────────────────────────────
// Gold scales across all 8 gym segments
const GOLD_TABLE = [
  { wildMin: 4,  wildMax: 10, bossBonus: 20 },  // Brock
  { wildMin: 8,  wildMax: 16, bossBonus: 25 },  // Misty
  { wildMin: 12, wildMax: 20, bossBonus: 30 },  // Lt. Surge
  { wildMin: 15, wildMax: 24, bossBonus: 35 },  // Erika
  { wildMin: 18, wildMax: 28, bossBonus: 40 },  // Koga
  { wildMin: 22, wildMax: 32, bossBonus: 45 },  // Sabrina
  { wildMin: 26, wildMax: 38, bossBonus: 50 },  // Blaine
  { wildMin: 30, wildMax: 45, bossBonus: 60 },  // Giovanni
];

// ── Shop price scaling ────────────────────────────────────────────────────────
// Base prices in SHOP_ITEMS stay fixed. At runtime, prices scale up with progress
// so items feel exclusive late-game and are genuinely affordable early.
// Scale factor: 1.0 at boss 0 → 2.0 at boss 7 (linear, rounded to nearest 5)
function getScaledPrice(basePrice) {
  const bosses = Math.min(GameState?.bossesDefeated || 0, 7);
  const factor = 1 + (bosses / 7) * 1.0;   // 1.0× early → 2.0× late
  return Math.ceil((basePrice * factor) / 5) * 5; // round up to nearest 5g
}

function goldForWildBattle() {
  const t      = GOLD_TABLE[Math.min(GameState.bossesDefeated, GOLD_TABLE.length - 1)];
  let earned   = t.wildMin + Math.floor(Math.random() * (t.wildMax - t.wildMin + 1));
  // Amulet Coin — double gold if active Pokémon holds it
  const active = GameState.party?.[GameState.activePokemonIndex];
  if (active?.heldItem?.id === 'amulet_coin') earned *= 2;
  return earned;
}
function goldForBoss() {
  return GOLD_TABLE[Math.min(GameState.bossesDefeated, GOLD_TABLE.length - 1)].bossBonus;
}

// ─── POKEDEX PERSISTENCE ──────────────────────────────────────────────────────
const POKEDEX_KEY  = 'pokerogue_pokedex_v1';   // legacy — suffixed per-profile below
const PROFILES_KEY = 'pokerogue_profiles_v1';   // index of all profiles (metadata only)
const MAX_PROFILES = 3;

// ── Active profile (in-memory, also backed by sessionStorage) ─────────────────
let activeProfile = null;  // profile key string e.g. 'alice' or 'alice_1718000000'

function setActiveProfile(key) {
  activeProfile = key;
  try { sessionStorage.setItem('pokerogue_active_profile', key); } catch(e) {}
}
function getActiveProfile() {
  if (activeProfile) return activeProfile;
  try { return sessionStorage.getItem('pokerogue_active_profile') || null; } catch(e) { return null; }
}

// ── Per-profile key builders ───────────────────────────────────────────────────
function saveKey(p)    { return `pokerogue_save_v1_${p}`; }
function unlockKey(p)  { return `pokerogue_unlock_v1_${p}`; }
function pokedexKey(p) { return `pokerogue_pokedex_v1_${p}`; }

// ── Save / load run ───────────────────────────────────────────────────────────
function saveGame() {
  const p = getActiveProfile();
  if (!p) return;
  try { localStorage.setItem(saveKey(p), JSON.stringify(GameState)); } catch(e) {}
  _updateProfileMeta(p);
}
function loadGame() {
  const p = getActiveProfile();
  if (!p) return null;
  try {
    const d = localStorage.getItem(saveKey(p));
    return d ? JSON.parse(d) : null;
  } catch(e) { return null; }
}
function deleteSave() {
  const p = getActiveProfile();
  if (!p) return;
  try { localStorage.removeItem(saveKey(p)); } catch(e) {}
  _updateProfileMeta(p);
}

// ── Unlocks ───────────────────────────────────────────────────────────────────
function loadUnlocks() {
  const p = getActiveProfile();
  if (!p) return { pikachu: false };
  try {
    const d = localStorage.getItem(unlockKey(p));
    return d ? JSON.parse(d) : { pikachu: false };
  } catch(e) { return { pikachu: false }; }
}
function saveUnlocks(unlocks) {
  const p = getActiveProfile();
  if (!p) return;
  try { localStorage.setItem(unlockKey(p), JSON.stringify(unlocks)); } catch(e) {}
}

// ── Pokédex ───────────────────────────────────────────────────────────────────
function loadPokedex() {
  const p = getActiveProfile();
  if (!p) return {};
  try {
    const d = localStorage.getItem(pokedexKey(p));
    return d ? JSON.parse(d) : {};
  } catch(e) { return {}; }
}
function savePokedex(dex) {
  const p = getActiveProfile();
  if (!p) return;
  try { localStorage.setItem(pokedexKey(p), JSON.stringify(dex)); } catch(e) {}
}

// ── Profiles index ────────────────────────────────────────────────────────────
function loadProfiles() {
  try {
    const d = localStorage.getItem(PROFILES_KEY);
    return d ? JSON.parse(d) : [];
  } catch(e) { return []; }
}
function saveProfiles(profiles) {
  try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); } catch(e) {}
}

// Update the metadata card for a profile (called after save/delete)
function _updateProfileMeta(profileKey) {
  const profiles = loadProfiles();
  const idx = profiles.findIndex(p => p.key === profileKey);
  if (idx < 0) return;
  const meta = profiles[idx];
  meta.lastSaved = Date.now();
  if (GameState) {
    meta.bossesDefeated = GameState.bossesDefeated || 0;
    meta.starterId      = GameState.starterId || null;
    // Store starter sprite URL from party if available
    const starter = GameState.party?.find(p => p.isStarter);
    if (starter?.spriteUrl) meta.starterSprite = starter.spriteUrl;
    meta.hasActiveSave  = true;
  }
  saveProfiles(profiles);
}

// Create a new profile entry
function createProfile(name) {
  const profiles = loadProfiles();
  if (profiles.length >= MAX_PROFILES) return null;
  // Build a unique key: lowercase name + timestamp suffix if collision
  let key = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'trainer';
  if (profiles.find(p => p.key === key)) key += '_' + Date.now().toString().slice(-6);
  const meta = {
    key, name,
    starterId:      null,
    starterSprite:  '',
    bossesDefeated: 0,
    hasActiveSave:  false,
    lastSaved:      Date.now(),
  };
  profiles.push(meta);
  saveProfiles(profiles);
  return meta;
}

function deleteProfile(profileKey) {
  try { localStorage.removeItem(saveKey(profileKey)); }   catch(e) {}
  try { localStorage.removeItem(unlockKey(profileKey)); } catch(e) {}
  try { localStorage.removeItem(pokedexKey(profileKey)); }catch(e) {}
  const profiles = loadProfiles().filter(p => p.key !== profileKey);
  saveProfiles(profiles);
  if (getActiveProfile() === profileKey) {
    activeProfile = null;
    try { sessionStorage.removeItem('pokerogue_active_profile'); } catch(e) {}
  }
}

function registerPokedex(id, name, spriteUrl, caught = false) {
  const dex = loadPokedex();
  if (!dex[id] || (caught && !dex[id].caught)) {
    dex[id] = { id, name, spriteUrl, caught: caught || !!dex[id]?.caught, seen: true };
    savePokedex(dex);
  }
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
    unlockedEevee:   false,
    unlockedMew:     false,
    unlockedMewtwo:  false,
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
  16:  'flying', // Pidgey       (normal/flying → flying)
  17:  'flying', // Pidgeotto    (normal/flying → flying)
  18:  'flying', // Pidgeot      (normal/flying → flying)
  21:  'flying', // Spearow      (normal/flying → flying)
  22:  'flying', // Fearow       (normal/flying → flying)
  83:  'flying', // Farfetch'd   (normal/flying → flying)
  84:  'flying', // Doduo        (normal/flying → flying)
  85:  'flying', // Dodrio       (normal/flying → flying)
  // Legendary birds — primary type is the battle-relevant one (secondary is flying)
  144: 'ice',      // Articuno  (ice/flying → ice)
  145: 'electric', // Zapdos    (electric/flying → electric)
  146: 'fire',     // Moltres   (fire/flying → fire)
};

function makePokemon(id, level, spriteUrl, name, type, isStarter = false) {
  const safeName = name || capitalize(String(id));  // fallback to id string if name missing
  // Apply dual-type override — use the battle-relevant type for these Pokémon
  const resolvedType = DUAL_TYPE_OVERRIDES[Number(id)] || type;
  // Legendary birds get their own named move pool
  const legendaryMoveKey = { 144: 'articuno', 145: 'zapdos', 146: 'moltres' }[Number(id)];
  const maxHp = 80 + level * 8 + (isStarter ? 20 : 0) + (Number(id) === 150 ? 40 : 0);
  const deck  = isStarter ? null : buildPokemonDeck(resolvedType);
  const movePool = OPPONENT_MOVES[legendaryMoveKey] || OPPONENT_MOVES[resolvedType] || OPPONENT_MOVES.normal;
  const moves    = shuffle([...movePool]).slice(0, 3);
  return { id, name: safeName, type: resolvedType, level, maxHp, hp: maxHp, spriteUrl, backSpriteUrl: null, isStarter, statusEffects: [], deck, moves, heldItem: null };
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
  const bi = bossIndex ?? Math.min(GameState?.bossesDefeated ?? 0, MAP_THEMES.length - 1);

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
    prevRow.forEach(p => {
      currRow.forEach(c => p.links.push(c.idx));
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
  // Change 'fishing' back to 'maze' to re-enable the maze instead.
  if (bi >= 2) {
    const free = firstRow.filter(n => n.type !== 'cooking');
    if (free.length > 0) {
      free[Math.floor(Math.random() * free.length)].type = 'fishing';
    }
  }

  // ── Inject legendary encounter at step 7 on maps bi >= 6 ─────────────────
  if (bi >= 6) {
    const step7nodes = nodes.filter(n => n.row === 7);
    if (step7nodes.length > 0) {
      step7nodes[Math.floor(Math.random() * step7nodes.length)].type = 'legendary';
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
    if (n.type === 'catch')    n.catchRarity = rarityRoll();
    if (n.type === 'legendary') n.catchRarity = 'legendary';
  });

  nodes._bossIndex = bi;
  return nodes;
}

// ─── SCREEN MANAGER ──────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
  SoundEngine.onScreenChange(id);
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
    if (this._sfxNode) {
      try { this._sfxNode.pause(); this._sfxNode.currentTime = 0; } catch(e) {}
      this._sfxNode = null;
    }
    const audio = new Audio(this._path(file));
    audio.volume = volume ?? this._sfxVolume;
    audio.play().catch(() => {});
    this._sfxNode = audio;
    audio.addEventListener('ended', () => { if (this._sfxNode === audio) this._sfxNode = null; });
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
    const track = this._bgmMap[screenId];
    if (track !== undefined) this.playBGM(track);
  },

  playStarterCry(starterId) {
    const cryMap = { 1: 'bulbasaur.mp3', 4: 'charmander.mp3', 7: 'squirtle.mp3', 25: 'pikachu.mp3', 133: 'eevee.mp3' };
    const file = cryMap[starterId];
    if (file) this.playSFXDebounced(file, 0.8);
  },

  playFanfare()  { this.playSFX('fanfare_item_get.mp3', 0.65); },
  playRecovery() { this.playSFX('pokemon_recovery.mp3', 0.7); },
  playPikachu2() { this.playSFX('pikachu2.mp3', 0.8); },

  toggleMute() {
    this._muted = !this._muted;
    if (this._bgm) this._bgm.volume = this._muted ? 0 : this._bgmVolume;
    return this._muted;
  },
};

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
  document.getElementById('modal-ok').textContent = 'OK';
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
  // Gen 1 Kanto types only — dark and steel did not exist in Gen 1
  normal:   { rock:.5, ghost:0 },
  fire:     { fire:.5, water:.5, rock:.5, dragon:.5, grass:2, ice:2, bug:2 },
  water:    { water:.5, grass:.5, dragon:.5, fire:2, ground:2, rock:2 },
  grass:    { fire:.5, grass:.5, poison:.5, flying:.5, bug:.5, dragon:.5, water:2, ground:2, rock:2 },
  electric: { grass:.5, electric:.5, dragon:.5, ground:0, water:2, flying:2 },
  ice:      { water:.5, ice:.5, fire:.5, grass:2, ground:2, flying:2, dragon:2 },
  fighting: { poison:.5, bug:.5, psychic:.5, flying:.5, ghost:0, normal:2, ice:2, rock:2 },
  poison:   { poison:.5, ground:.5, rock:.5, ghost:.5, grass:2 },
  ground:   { grass:.5, bug:.5, flying:0, fire:2, electric:2, poison:2, rock:2 },
  flying:   { electric:.5, rock:.5, grass:2, fighting:2, bug:2 },
  psychic:  { psychic:.5, fighting:2, poison:2 },
  bug:      { fire:.5, fighting:.5, flying:.5, ghost:.5, grass:2, psychic:2 },
  rock:     { fighting:.5, ground:.5, fire:2, ice:2, flying:2, bug:2 },
  ghost:    { normal:0, ghost:2, psychic:2 },
  dragon:   { dragon:2 },
  fairy:    { fire:.5, poison:.5, fighting:2, dragon:2 },
};

function getTypeMultiplier(attackType, defendType) {
  if (!attackType || !defendType) return 1;
  return TYPE_CHART[attackType]?.[defendType] ?? 1;
}

// ─── BATTLE LOG FORMATTING HELPERS ───────────────────────────────────────────
// Wrap numbers and labels in coloured spans for the 2-panel battle log.

function logDmgDealt(n)  { return `<span class="log-dmg-dealt">${n}</span>`; }
function logDmgTaken(n)  { return `<span class="log-dmg-taken">${n}</span>`; }
function logHeal(n)      { return `<span class="log-heal">${n}</span>`; }
function logEff(mult) {
  if (mult >= 2)   return ` <span class="log-eff-super">Super effective!</span>`;
  if (mult <= 0.5) return ` <span class="log-eff-weak">Not very effective…</span>`;
  return '';
}

function typeEffectivenessLabel(mult) {
  if (mult === 0)   return { text: 'No effect!',    color: '#888' };
  if (mult >= 2)    return { text: 'Super effective!', color: '#FFD700' };
  if (mult <= 0.5)  return { text: 'Not very effective…', color: '#aaa' };
  return null; // normal — show nothing extra
}

// ─── MATH CHALLENGE DATA ─────────────────────────────────────────────────────

function generateMathChallenge(tier) {
  let question, correct, coins = null;

  if (tier === 1) {
    // Tier 1 (age 6-7): addition/subtraction under 20, visual coins
    const ops = ['+', '-'];
    const op  = ops[Math.floor(Math.random() * ops.length)];
    let a = 2 + Math.floor(Math.random() * 9);   // 2–10
    let b = 1 + Math.floor(Math.random() * 9);   // 1–9
    if (op === '-' && b > a) [a, b] = [b, a];    // no negatives
    correct = op === '+' ? a + b : a - b;
    coins   = { a, b, op };
    question = op === '+'
      ? `Meowth has ${a} 🪙 and finds ${b} more.\nHow many coins does he have?`
      : `Meowth had ${a} 🪙 but dropped ${b}.\nHow many are left?`;
  } else if (tier === 2) {
    // Tier 2 (age 8-9): multiplication up to 50, word problems
    const type = Math.random() < 0.5 ? 'mult' : 'add';
    if (type === 'mult') {
      const a = 2 + Math.floor(Math.random() * 7);  // 2–8
      const b = 2 + Math.floor(Math.random() * 7);
      correct  = a * b;
      question = `Giovanni wants ${a} bags with ${b} coins each.\nHow many coins total?`;
    } else {
      const a = 10 + Math.floor(Math.random() * 30);
      const b = 5  + Math.floor(Math.random() * 20);
      correct  = a + b;
      question = `Meowth stole ${a} coins in the morning\nand ${b} more at night.\nTotal coins?`;
    }
  } else {
    // Tier 3 (age 10-12): division + percentages
    const type = Math.random() < 0.5 ? 'div' : 'pct';
    if (type === 'div') {
      const b   = 2 + Math.floor(Math.random() * 8);  // divisor 2–9
      correct   = 4 + Math.floor(Math.random() * 8);  // quotient 4–11
      const a   = b * correct;
      question  = `Giovanni split ${a} coins equally between ${b} Rockets.\nHow many each?`;
    } else {
      // 25% or 50% of a round number
      const pct  = Math.random() < 0.5 ? 25 : 50;
      const base = (4 + Math.floor(Math.random() * 9)) * (pct === 25 ? 4 : 2); // divisible
      correct    = Math.round(base * pct / 100);
      question   = `Meowth kept ${pct}% of ${base} coins for himself.\nHow many did he keep?`;
    }
  }

  // Generate 3 wrong answers (close but distinct)
  const wrongs = new Set();
  while (wrongs.size < 3) {
    const delta = 1 + Math.floor(Math.random() * 4);
    const w = Math.random() < 0.5 ? correct + delta : Math.max(0, correct - delta);
    if (w !== correct) wrongs.add(w);
  }

  const choices = shuffle([correct, ...wrongs]);
  return { question, correct, choices, coins };
}

// ─── REGISTRATION ENGINE ──────────────────────────────────────────────────────

// ─── REGISTRATION ENGINE ──────────────────────────────────────────────────────

const RegistrationEngine = {
  _step: 1, // 1 = name, 2 = age
  _tempName: '',

  init() {
    this._step = 1;
    this._showStep1();
  },

  _showStep1() {
    this._step = 1;
    document.getElementById('reg-step-name').style.display = 'flex';
    document.getElementById('reg-step-age').style.display  = 'none';
    document.getElementById('trainer-name-input').value = '';
    document.getElementById('trainer-name-input').focus();
  },

  _showStep2(name) {
    this._step = 2;
    this._tempName = name;
    document.getElementById('reg-step-name').style.display = 'none';
    document.getElementById('reg-step-age').style.display  = 'flex';

    // Personalised greeting
    const greetings = [
      `Nice to meet you, ${name}! 🌟`,
      `${name}! What a great Trainer name! ✨`,
      `Wow, ${name} — that's an awesome name! 🎉`,
      `${name}! Professor Oak will be so impressed! 🌿`,
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    document.getElementById('reg-greeting').textContent = greeting;
    document.getElementById('reg-age-question').textContent = `So ${name}, how old are you?`;

    // Build age buttons fresh
    const ageRow = document.getElementById('age-buttons');
    ageRow.innerHTML = '';
    for (let age = 6; age <= 12; age++) {
      const btn = document.createElement('button');
      btn.className = 'age-btn';
      btn.textContent = age;
      btn.dataset.age = age;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.age-btn').forEach(b => b.classList.remove('age-selected'));
        btn.classList.add('age-selected');
        // Show "Let's Go" button once age is chosen
        document.getElementById('btn-age-confirm').style.display = 'inline-block';
      });
      ageRow.appendChild(btn);
    }
    document.getElementById('btn-age-confirm').style.display = 'none';
  },

  confirmName() {
    const nameInput = document.getElementById('trainer-name-input');
    const name = (nameInput?.value || '').trim().slice(0, 12);
    if (!name) {
      nameInput?.classList.add('input-shake');
      setTimeout(() => nameInput?.classList.remove('input-shake'), 500);
      return;
    }
    this._showStep2(name);
  },

  confirmAge() {
    const selectedAge = document.querySelector('.age-btn.age-selected');
    if (!selectedAge) return;
    const age  = parseInt(selectedAge.dataset.age);
    const tier = age <= 7 ? 1 : age <= 9 ? 2 : 3;

    GameState.trainerName    = this._tempName;
    GameState.trainerAge     = age;
    GameState.difficultyTier = tier;

    IntroEngine.start(this._tempName, age);
  },
};

// ─── INTRO ENGINE ─────────────────────────────────────────────────────────────

const IntroEngine = {
  _panels: [],
  _idx: 0,

  start(name, age) {
    const tierLabel = age <= 7 ? 'Rookie Trainer' : age <= 9 ? 'Rising Trainer' : 'Expert Trainer';
    this._panels = [
      { text: `Deep in the Pokémon world...\nsomething is very wrong. 🌑`, speaker: null },
      { text: `Team Rocket has been stealing Pokémon\nand hoarding mountains of gold! 💰`, speaker: 'rocket' },
      { text: `Their boss, Giovanni, hid three legendary\nPokémon behind the Trail of Trials —\na gauntlet only the bravest can finish.`, speaker: 'rocket' },
      { text: `Professor Oak searched the whole world\nfor a trainer with courage, smarts,\nand heart. ❤️`, speaker: 'oak' },
      { text: `He found you.\n\n${name}, ${tierLabel}. 🌟`, speaker: 'oak' },
      { text: `Eight Gym Leaders stand between you\nand Team Rocket's secret.\n\nAre you ready, ${name}?`, speaker: 'oak' },
      { text: `But first — let me explain\nhow your journey works.\n\nThis won't take long! 📖`, speaker: 'oak' },
    ];
    this._idx = 0;
    showScreen('intro');
    this._render();
  },

  _render() {
    const panel = this._panels[this._idx];
    const isLast = this._idx === this._panels.length - 1;

    // Typewriter effect for text
    const textEl = document.getElementById('intro-text');
    textEl.textContent = '';
    let ci = 0;
    clearInterval(this._typeTimer);
    this._typeTimer = setInterval(() => {
      textEl.textContent += panel.text[ci];
      ci++;
      if (ci >= panel.text.length) clearInterval(this._typeTimer);
    }, 22);

    document.getElementById('intro-progress').textContent =
      `${this._idx + 1} / ${this._panels.length}`;

    const portrait = document.getElementById('intro-portrait');
    if (panel.speaker === 'oak') {
      portrait.src = 'assets/prof_oak.png';
      portrait.style.display = '';
      portrait.onerror = () => { portrait.style.display = 'none'; };
    } else if (panel.speaker === 'rocket') {
      portrait.src = 'assets/team_rocket.png';
      portrait.style.display = '';
      portrait.onerror = () => { portrait.style.display = 'none'; };
    } else {
      portrait.style.display = 'none';
    }

    const btn = document.getElementById('btn-intro-next');
    btn.textContent = isLast ? `Show me! ▶` : 'Next ▶';
  },

  next() {
    clearInterval(this._typeTimer);
    // If still typing, finish instantly first press
    const panel = this._panels[this._idx];
    const textEl = document.getElementById('intro-text');
    if (textEl.textContent.length < panel.text.length) {
      textEl.textContent = panel.text;
      return;
    }
    if (this._idx < this._panels.length - 1) {
      this._idx++;
      this._render();
    } else {
      TutorialEngine.start();
    }
  },

  skip() {
    clearInterval(this._typeTimer);
    TutorialEngine.skip();
  },
};

// ─── TUTORIAL ENGINE ──────────────────────────────────────────────────────────

const TutorialEngine = {
  _idx: 0,
  _slides: [],

  start() {
    const name = GameState.trainerName || 'Trainer';
    const age  = GameState.trainerAge  || 10;

    // Age-adaptive language
    const simple = age <= 7;

    this._slides = [
      {
        title:   'Your Journey',
        oak:     `At every crossroads you'll see paths ahead, ${name}. Choose wisely!`,
        body:    simple
          ? 'You see arrows — left, straight, or right. Tap one to go that way!'
          : 'At each step you choose from 2 or 3 paths. Each path leads to a different event.',
        visual:  'tut-vis-path',
      },
      {
        title:   'Path Types',
        oak:     'Different paths lead to very different places!',
        body:    simple
          ? 'Fight Pokémon ⚔️  Heal your team 💚  Catch Pokémon 🔵  Train ⚡  Shop 🛒  Mystery ❓'
          : 'Battle to level up. Heal to restore HP. Catch new Pokémon. Train your cards. Shop for items. Mystery paths hide surprises!',
        visual:  'tut-vis-types',
      },
      {
        title:   'Battle with Cards',
        oak:     `In battle you play cards from your hand to attack, ${name}!`,
        body:    simple
          ? 'Play cards to hit the other Pokémon. You get 3 Energy each turn. Bigger attacks cost more!'
          : 'Each turn you have 3 Energy. Cards cost 0–3 Energy. Play strong attacks or combos — then End Turn.',
        visual:  'tut-vis-cards',
      },
      {
        title:   'Team Rocket!',
        oak:     'Watch out — Team Rocket may ambush you between paths!',
        body:    simple
          ? 'Jessie, James and Meowth will challenge you with a quiz. Get it right for coins!'
          : 'Jessie, James and Meowth appear between nodes with math, spelling and word challenges. Win coins for correct answers.',
        visual:  'tut-vis-rocket',
      },
      {
        title:   'The Goal',
        oak:     `Defeat all 8 Gym Leaders and become Champion, ${name}!`,
        body:    simple
          ? 'Beat the Gym Leader at the end of each route. Win all 8 and you\'re Champion! 🏆'
          : 'Each route ends with a Gym Leader boss battle. Defeat all 8 to stop Team Rocket and claim the Championship!',
        visual:  'tut-vis-goal',
      },
    ];

    this._idx = 0;
    showScreen('tutorial');
    this._render();
  },

  _render() {
    const slide  = this._slides[this._idx];
    const isLast = this._idx === this._slides.length - 1;

    document.getElementById('tut-oak-text').textContent = slide.oak;
    document.getElementById('tut-title').textContent    = slide.title;

    // Typewriter for body text
    const bodyEl = document.getElementById('tut-body');
    bodyEl.textContent = '';
    let ci = 0;
    clearInterval(this._typeTimer);
    this._typeTimer = setInterval(() => {
      bodyEl.textContent += slide.body[ci];
      ci++;
      if (ci >= slide.body.length) clearInterval(this._typeTimer);
    }, 18);

    // Swap visual
    const visEl = document.getElementById('tut-visual');
    visEl.className = `tut-visual ${slide.visual}`;
    visEl.innerHTML = this._buildVisual(slide.visual);

    // Progress dots
    const dotsEl = document.getElementById('tut-dots');
    dotsEl.innerHTML = this._slides.map((_,i) =>
      `<div class="tut-dot${i === this._idx ? ' tut-dot-active' : ''}"></div>`
    ).join('');

    // Next button label
    const nextBtn = document.getElementById('btn-tut-next');
    nextBtn.textContent = isLast
      ? `Choose your partner! ▶`
      : 'Next ▶';
  },

  _buildVisual(type) {
    switch(type) {
      case 'tut-vis-path':
        return `<div class="tut-path-demo">
          <div class="tut-path-arrow tut-arr-left">
            <svg viewBox="0 0 44 36" width="44" height="36"><line x1="39" y1="18" x2="8" y2="18" stroke="rgba(255,255,255,.85)" stroke-width="3.5" stroke-linecap="round"/><polyline points="20,9 8,18 20,27" stroke="rgba(255,255,255,.85)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
            <span>Left</span>
          </div>
          <div class="tut-path-arrow tut-arr-straight">
            <svg viewBox="0 0 44 36" width="44" height="36"><line x1="22" y1="32" x2="22" y2="6" stroke="rgba(255,255,255,.85)" stroke-width="3.5" stroke-linecap="round"/><polyline points="12,18 22,6 32,18" stroke="rgba(255,255,255,.85)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
            <span>Ahead</span>
          </div>
          <div class="tut-path-arrow tut-arr-right">
            <svg viewBox="0 0 44 36" width="44" height="36"><line x1="5" y1="18" x2="36" y2="18" stroke="rgba(255,255,255,.85)" stroke-width="3.5" stroke-linecap="round"/><polyline points="24,9 36,18 24,27" stroke="rgba(255,255,255,.85)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
            <span>Right</span>
          </div>
        </div>`;

      case 'tut-vis-types':
        return `<div class="tut-types-grid">
          <div class="tut-type-chip tut-type-battle"><img src="assets/battle_icon.png" onerror="this.style.display='none'"/>Battle</div>
          <div class="tut-type-chip tut-type-heal"><img src="assets/heal_icon.png" onerror="this.style.display='none'"/>Heal</div>
          <div class="tut-type-chip tut-type-catch"><img src="assets/catch_icon.png" onerror="this.style.display='none'"/>Catch</div>
          <div class="tut-type-chip tut-type-train">⚡ Train</div>
          <div class="tut-type-chip tut-type-shop"><img src="assets/shop_icon.png" onerror="this.style.display='none'"/>Shop</div>
          <div class="tut-type-chip tut-type-mystery">❓ Mystery</div>
        </div>`;

      case 'tut-vis-cards':
        return `<div class="tut-cards-demo">
          <div class="tut-demo-card tut-card-a">
            <div class="tut-card-cost">●</div>
            <div class="tut-card-icon">⚔️</div>
            <div class="tut-card-name">Tackle</div>
            <div class="tut-card-dmg">20 dmg</div>
          </div>
          <div class="tut-demo-card tut-card-b">
            <div class="tut-card-cost">●●</div>
            <div class="tut-card-icon">🔥</div>
            <div class="tut-card-name">Ember</div>
            <div class="tut-card-dmg">45 dmg</div>
          </div>
          <div class="tut-demo-card tut-card-c">
            <div class="tut-card-cost">★</div>
            <div class="tut-card-icon">💚</div>
            <div class="tut-card-name">Growl</div>
            <div class="tut-card-dmg">Draw 2</div>
          </div>
          <div class="tut-energy-row">
            <span class="energy-orb energy-orb-full"></span>
            <span class="energy-orb energy-orb-full"></span>
            <span class="energy-orb energy-orb-full"></span>
            <span class="tut-energy-label">3 Energy / turn</span>
          </div>
        </div>`;

      case 'tut-vis-rocket':
        return `<div class="tut-rocket-row">
          <div class="tut-rocket-char">
            <img src="assets/jessi.png" alt="Jessie" onerror="this.style.display='none'" class="tut-rocket-img"/>
            <span>Jessie</span>
          </div>
          <div class="tut-rocket-char">
            <img src="assets/james.png" alt="James" onerror="this.style.display='none'" class="tut-rocket-img"/>
            <span>James</span>
          </div>
          <div class="tut-rocket-char">
            <img src="assets/meowth.png" alt="Meowth" onerror="this.style.display='none'" class="tut-rocket-img"/>
            <span>Meowth</span>
          </div>
        </div>`;

      case 'tut-vis-goal':
        return `<div class="tut-goal-row">
          ${[0,1,2,3,4,5,6,7].map(i => `
            <div class="tut-badge-slot">
              <div class="tut-badge-icon">${i < 3 ? '🏅' : '⬜'}</div>
              <div class="tut-badge-num">${i+1}</div>
            </div>`).join('')}
          <div class="tut-trophy">🏆</div>
        </div>`;

      default: return '';
    }
  },

  next() {
    clearInterval(this._typeTimer);
    // First press finishes typewriter if still running
    const bodyEl  = document.getElementById('tut-body');
    const slide   = this._slides[this._idx];
    if (bodyEl.textContent.length < slide.body.length) {
      bodyEl.textContent = slide.body;
      return;
    }
    if (this._idx < this._slides.length - 1) {
      this._idx++;
      this._render();
    } else {
      this._finish();
    }
  },

  _finish() {
    clearInterval(this._typeTimer);
    try { localStorage.setItem('poketrials_tutorial_seen', '1'); } catch(e) {}
    Game.showStarterSelect();
  },

  skip() {
    clearInterval(this._typeTimer);
    this._finish();
  },
};

// ─── JESSIE WORD BANK ─────────────────────────────────────────────────────────
// Each entry: { word, partOfSpeech, correct definition, 3 wrong choices, exampleSentence, jessieQuote }
const JESSIE_WORDS = {
  1: [ // Tier 1 — age 6-7: simple virtues and positive traits
    {
      word: 'brave', pos: 'adjective',
      correct: 'Not scared, even when things are hard',
      wrong: ['Very tired', 'Very small', 'Very silly'],
      example: 'The brave trainer walked into the dark cave without hesitating.',
      jessie: 'BRAVE? Why, that is practically my middle name! No one faces Team Rocket\'s setbacks more bravely than I do!',
    },
    {
      word: 'kind', pos: 'adjective',
      correct: 'Caring about others and wanting to help',
      wrong: ['Very fast', 'Very loud', 'Very tall'],
      example: 'The kind trainer shared their lunch with a hungry Growlithe.',
      jessie: 'Kind... I am actually very kind. I let James keep his bottle caps, don\'t I?',
    },
    {
      word: 'gentle', pos: 'adjective',
      correct: 'Soft, calm and careful with others',
      wrong: ['Very rough', 'Very noisy', 'Very clumsy'],
      example: 'The gentle trainer carefully healed the injured Caterpie.',
      jessie: 'Gentle? I can be gentle! Watch how gently I demand everyone\'s Pokémon!',
    },
    {
      word: 'joyful', pos: 'adjective',
      correct: 'Very happy and full of delight',
      wrong: ['Very hungry', 'Very sleepy', 'Very cold'],
      example: 'Pikachu was joyful when it saw its trainer after a long journey.',
      jessie: 'Joyful! Yes — I am JOYFUL every time I picture my glorious future as a Pokémon Master!',
    },
    {
      word: 'grateful', pos: 'adjective',
      correct: 'Feeling thankful for something good',
      wrong: ['Feeling bored', 'Feeling full', 'Feeling cold'],
      example: 'The trainer was grateful that her Pokémon worked so hard for her.',
      jessie: 'Grateful? I am deeply grateful for my magnificent hair. Every single day.',
    },
    {
      word: 'curious', pos: 'adjective',
      correct: 'Wanting to find out and learn about things',
      wrong: ['Feeling sleepy', 'Being very hungry', 'Feeling shy'],
      example: 'The curious Pikachu pressed its nose to every flower it passed.',
      jessie: 'Curious? I am endlessly curious — about treasure, about fame, about why James likes those bottle caps.',
    },
    {
      word: 'helpful', pos: 'adjective',
      correct: 'Ready and happy to help others',
      wrong: ['Making trouble', 'Staying away', 'Being quiet'],
      example: 'The helpful trainer showed the lost traveller the way to the Pokémon Centre.',
      jessie: 'Helpful! I could be very helpful — if helping led to fame, fortune, and Pikachu.',
    },
  ],
  2: [ // Tier 2 — age 8-9: character virtues
    {
      word: 'determined', pos: 'adjective',
      correct: 'Decided to do something and never giving up',
      wrong: ['Feeling confused', 'Easy to give up', 'Wanting to sleep'],
      example: 'Ash was determined to become Pokémon Champion no matter what.',
      jessie: 'I am the most DETERMINED person in the world. I have tried to catch Pikachu over three hundred times!',
    },
    {
      word: 'courageous', pos: 'adjective',
      correct: 'Brave enough to do hard or scary things',
      wrong: ['Hiding away', 'Giving up easily', 'Staying safe always'],
      example: 'The courageous Charizard flew straight into the storm to save its trainer.',
      jessie: 'Courageous! That is exactly what I am. Magnificently, dazzlingly courageous!',
    },
    {
      word: 'generous', pos: 'adjective',
      correct: 'Happy to give and share with others freely',
      wrong: ['Keeping everything', 'Very impatient', 'Very quiet'],
      example: 'The generous trainer gave Poké Balls to every young trainer she met.',
      jessie: 'Generous... I once let James keep an entire sandwich. I am practically a saint.',
    },
    {
      word: 'patient', pos: 'adjective',
      correct: 'Able to wait calmly without getting upset',
      wrong: ['Always rushing', 'Very loud', 'Easily worried'],
      example: 'The patient trainer trained her Magikarp every day for months.',
      jessie: 'Patient? I have been patiently waiting for success my ENTIRE career. Years, people. Years.',
    },
    {
      word: 'faithful', pos: 'adjective',
      correct: 'Loyal and always there for the ones you love',
      wrong: ['Easily distracted', 'Often forgetful', 'Very shy'],
      example: 'Pikachu was faithful to Ash even when things were very difficult.',
      jessie: 'Faithful! Wobuffet has been faithfully by my side for years. I could learn from Wobuffet.',
    },
    {
      word: 'humble', pos: 'adjective',
      correct: 'Not boasting — knowing that others matter too',
      wrong: ['Very loud about yourself', 'Ignoring others', 'Always bragging'],
      example: 'The humble Champion thanked every trainer who helped her along the way.',
      jessie: 'Humble... I will be humble once I am rich, famous and Champion. Then I will be the humblest person alive.',
    },
    {
      word: 'triumphant', pos: 'adjective',
      correct: 'Feeling great joy after earning a victory',
      wrong: ['Very embarrassed', 'Quite bored', 'A little tired'],
      example: 'Ash felt triumphant when he finally defeated the Gym Leader.',
      jessie: 'TRIUMPHANT! One day — one glorious day — that word will describe ME. I can feel it.',
    },
  ],
  3: [ // Tier 3 — age 10-12: wisdom and deeper virtues
    {
      word: 'perseverance', pos: 'noun',
      correct: 'Continuing with courage even when things are very hard',
      wrong: ['Giving up quickly', 'Resting all the time', 'Avoiding hard things'],
      example: 'Ash showed perseverance by training every single day, no matter what.',
      jessie: 'Perseverance is the story of my LIFE. I have never — not once — given up. That is practically heroic.',
    },
    {
      word: 'compassion', pos: 'noun',
      correct: 'Caring deeply about others and wanting to ease their pain',
      wrong: ['Ignoring others\' feelings', 'Thinking only of yourself', 'Being very impatient'],
      example: 'The nurse showed compassion by staying up all night to heal the injured Pokémon.',
      jessie: 'Compassion... I show compassion every single day by not blasting James into the stratosphere. That counts.',
    },
    {
      word: 'resilient', pos: 'adjective',
      correct: 'Able to recover and grow stronger after hard times',
      wrong: ['Easily defeated forever', 'Giving up after one try', 'Very fragile'],
      example: 'A resilient trainer learns something valuable from every single defeat.',
      jessie: 'Team Rocket is the most resilient organisation in history. We return. Every. Single. Time.',
    },
    {
      word: 'wisdom', pos: 'noun',
      correct: 'Deep understanding earned through learning and experience',
      wrong: ['Being very fast', 'Knowing nothing', 'Talking very loudly'],
      example: 'The wise Elder Pokémon trainer had learned something from every battle she ever fought.',
      jessie: 'Wisdom! I have accumulated an enormous amount of wisdom. Mostly about what NOT to do. Still counts.',
    },
    {
      word: 'gracious', pos: 'adjective',
      correct: 'Kind, polite and dignified, especially in victory or defeat',
      wrong: ['Rude and boastful', 'Ignoring everyone', 'Complaining loudly'],
      example: 'The gracious Champion shook hands with every trainer she defeated.',
      jessie: 'Gracious? I am the most gracious loser who has ever existed. I lose with STYLE.',
    },
    {
      word: 'steadfast', pos: 'adjective',
      correct: 'Firm and unwavering — never giving up on what matters',
      wrong: ['Easily swayed', 'Quickly distracted', 'Often changing sides'],
      example: 'The steadfast Lucario stood beside its trainer through every challenge.',
      jessie: 'Steadfast! I have been steadfastly pursuing Pikachu for years. Steadfast is practically my title.',
    },
    {
      word: 'honourable', pos: 'adjective',
      correct: 'Doing what is right, even when it is hard',
      wrong: ['Cheating when nobody looks', 'Only helping yourself', 'Breaking promises'],
      example: 'The honourable trainer returned the Poké Ball she found, even though she needed it.',
      jessie: 'Honourable... you know, deep down, I actually do know the difference between right and wrong. Deep, deep down.',
    },
  ],
};

// ─── JAMES SPELLING BANK ─────────────────────────────────────────────────────
const JAMES_WORDS = {
  1: [ // Tier 1 — pick the correct spelling from a definition clue
    {
      clue: 'A very good friend',
      correct: 'friend', wrong: ['frend', 'freind', 'frind'],
      james: 'I wrote "frend" on Jessie\'s birthday card. She was not impressed. Wobuffet nodded anyway.',
    },
    {
      clue: 'The place where you learn',
      correct: 'school', wrong: ['skool', 'sckool', 'schol'],
      james: 'I spelled it "skool" on the Team Rocket mission plan. The Boss circled it three times.',
    },
    {
      clue: 'Not the same as something else',
      correct: 'different', wrong: ['diffrent', 'diferent', 'difrent'],
      james: '"Diffrent"... that looked perfectly correct to me. Wobuffet nodded. We were both wrong.',
    },
    {
      clue: 'Very beautiful and impressive',
      correct: 'wonderful', wrong: ['wonderfull', 'wunderfull', 'wonderfal'],
      james: 'I wrote "wunderfull day" in my diary. That felt right at the time. It was not right.',
    },
    {
      clue: 'To help someone who is in trouble',
      correct: 'rescue', wrong: ['reskew', 'recue', 'rescew'],
      james: 'Our motto says we "reskew" Pokémon. Jessie says that is embarrassing. She is right.',
    },
    {
      clue: 'A long and exciting trip',
      correct: 'journey', wrong: ['jurney', 'journee', 'jorney'],
      james: 'I wrote "jurney" in my travel log. Wobuffet looked at it very carefully. Then nodded.',
    },
    {
      clue: 'Full of brightness and light',
      correct: 'shining', wrong: ['shinning', 'shiening', 'shyning'],
      james: 'I described my rose as "shinning" in a poem. Jessie said it was the worst poem she had ever read.',
    },
  ],
  2: [
    {
      clue: 'When something happens unexpectedly and delightfully',
      correct: 'surprise', wrong: ['suprise', 'surprize', 'surpise'],
      james: 'I planned a "suprise party" for Jessie. She was not surprised by my spelling.',
    },
    {
      clue: 'Absolutely, for certain, without any doubt',
      correct: 'definitely', wrong: ['definately', 'definitly', 'defenitely'],
      james: '"Definately" looked right to me! Jessie says I am definitely, one hundred percent, wrong.',
    },
    {
      clue: 'Not together — kept apart from each other',
      correct: 'separate', wrong: ['seperate', 'separrate', 'seperrate'],
      james: 'There is "a rat" hiding in "sep-a-rat-e"! That trick saved me. Wobuffet was very pleased.',
    },
    {
      clue: 'A time of great happiness shared with others',
      correct: 'celebration', wrong: ['celebrashun', 'celebrasion', 'celbration'],
      james: 'I organised a Team Rocket "celebrasion". Jessie said that was not a word. She was correct.',
    },
    {
      clue: 'Something that is truly amazing and impressive',
      correct: 'magnificent', wrong: ['magnifisent', 'magnificant', 'magnifesant'],
      james: 'I described my rose as "magnifisent". Jessie corrected me. I wrote it down twelve times.',
    },
    {
      clue: 'Keeping going bravely even when things are hard',
      correct: 'persisting', wrong: ['persistting', 'persisitng', 'persissting'],
      james: 'I wrote "persistting through failure" in my journal. Two Ts was... not correct.',
    },
    {
      clue: 'Able to be trusted completely',
      correct: 'reliable', wrong: ['relible', 'reliabel', 'relyable'],
      james: 'I told the Boss I was "relible". He did not look convinced. The spelling did not help.',
    },
  ],
  3: [
    {
      clue: 'Something that fills you with wonder and amazement',
      correct: 'magnificent', wrong: ['magnifisent', 'magnificant', 'magnifesant'],
      james: 'I described my Victreebel as "magnifisent". It promptly ate my hat. Wobuffet nodded.',
    },
    {
      clue: 'Showing great courage and bravery',
      correct: 'courageous', wrong: ['couragious', 'corageous', 'courrageous'],
      james: '"Couragious" — I was so sure. Two whole Es. Jessie sighed. I wrote it out twenty times.',
    },
    {
      clue: 'A place to stay overnight, like a hotel',
      correct: 'accommodation', wrong: ['accomodation', 'acomodation', 'acommodation'],
      james: 'Our Team Rocket "acomodation" was a tent in the rain. The spelling was the least of our problems.',
    },
    {
      clue: 'Knowing the difference between right and wrong',
      correct: 'conscience', wrong: ['consience', 'consciense', 'conciense'],
      james: 'Even Team Rocket has a "consience". I think about this more than Jessie does. Wobuffet agrees.',
    },
    {
      clue: 'Continuing bravely no matter how hard things get',
      correct: 'perseverance', wrong: ['perseverence', 'perseveranse', 'perserverance'],
      james: '"Perseverence" — I had it almost right! One letter! Wobuffet patted me on the head.',
    },
    {
      clue: 'Something that is absolutely necessary and cannot be left out',
      correct: 'essential', wrong: ['essencial', 'esential', 'essenshall'],
      james: 'My rose is "essencial" to my outfit. Wait — is that right? Jessie says no. Jessie is right.',
    },
    {
      clue: 'Feeling and showing that you are thankful',
      correct: 'grateful', wrong: ['greatful', 'graytefull', 'gratefull'],
      james: 'I wrote Jessie a "greatful" thank-you note. She corrected it in red pen and handed it back.',
    },
  ],
};

// ─── TEAM ROCKET CHALLENGE DISPATCHER ────────────────────────────────────────

const TeamRocketChallenge = {
  _onComplete: null,
  _type: null,     // 'meowth' | 'jessie' | 'james'
  _challenge: null,

  // Trigger check — called after every node completion (not just battles).
  // Rules:
  //   • Hard cooldown of 2 nodes after any Rocket event (never consecutive)
  //   • Guaranteed trigger at nodesSinceRocket >= 4
  //   • 40% random chance between 2 and 4
  //   • Boss nodes never trigger a Rocket event
  shouldTrigger(nodeType) {
    if (nodeType === 'boss') return false; // never interrupt the boss moment

    if (!GameState.nodesSinceRocket) GameState.nodesSinceRocket = 0;
    GameState.nodesSinceRocket++;

    if (GameState.nodesSinceRocket < 3) return false;       // hard cooldown
    if (GameState.nodesSinceRocket >= 5) return true;       // guaranteed
    return Math.random() < 0.40;                            // 40% between 3–4
  },

  // Pick a random character and show their challenge
  show(onComplete) {
    this._onComplete = onComplete;
    const chars = ['meowth', 'jessie', 'james'];
    const pool  = chars.filter(c => c !== this._type);
    this._type  = pool[Math.floor(Math.random() * pool.length)];
    // Reset counter so next event can't fire for at least 3 more nodes
    GameState.nodesSinceRocket = 0;

    if (this._type === 'meowth') this._showMeowth();
    else if (this._type === 'jessie') this._showJessie();
    else this._showJames();
  },

  // ── Shared render helpers ─────────────────────────────────────────────────

  _setHeader(imgSrc, badgeText, introText) {
    const img = document.getElementById('challenge-character-img');
    img.src = imgSrc; img.alt = this._type;
    img.style.display = '';
    document.getElementById('challenge-badge').textContent   = badgeText;
    document.getElementById('challenge-intro').textContent   = introText;
    document.getElementById('challenge-coin-visual').style.display  = 'none';
    document.getElementById('jessie-word-display').style.display    = 'none';
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';
  },

  _renderAnswerBtns(choices, answerFn) {
    const btns = document.getElementById('challenge-answer-btns');
    btns.innerHTML = '';
    choices.forEach(val => {
      const b = document.createElement('button');
      b.className = 'challenge-answer-btn';
      b.textContent = val;
      b.addEventListener('click', () => answerFn(val));
      btns.appendChild(b);
    });
  },

  _showResult(isRight, correctLabel, explanation, characterQuote) {
    const name = GameState.trainerName || 'Trainer';
    const resultEl = document.getElementById('challenge-result');
    resultEl.style.display = 'block';

    // Highlight answer buttons
    document.querySelectorAll('.challenge-answer-btn').forEach(b => {
      b.disabled = true;
      if (b.textContent === correctLabel) b.classList.add('answer-correct');
      else if (!isRight && b.classList.contains('answer-selected')) b.classList.add('answer-wrong');
    });

    if (isRight) {
      const bonus = { 1: 5, 2: 8, 3: 12 }[GameState.difficultyTier || 2];
      GameState.gold = (GameState.gold || 0) + bonus;
      resultEl.className = 'challenge-result result-correct';
      resultEl.innerHTML =
        `✅ <strong>Correct, ${name}!</strong><br>${explanation}<br>` +
        `You earned <strong>+${bonus}🪙</strong>!<br><em>"${characterQuote}"</em>`;
      SoundEngine.playFanfare();
    } else {
      GameState.gold = (GameState.gold || 0) + 2;
      resultEl.className = 'challenge-result result-wrong';
      resultEl.innerHTML =
        `❌ <strong>The answer is: ${correctLabel}</strong><br>${explanation}<br>` +
        `You still get <strong>+2🪙</strong> for trying, ${name}!<br><em>"${characterQuote}"</em>`;
    }
    document.getElementById('challenge-continue-btn').style.display = 'block';
    saveGame();
  },

  // ── MEOWTH ────────────────────────────────────────────────────────────────

  _showMeowth() {
    const name  = GameState.trainerName || 'Trainer';
    const tier  = GameState.difficultyTier || 2;
    this._challenge = generateMathChallenge(tier);

    this._setHeader('assets/meowth.png', '💰 Meowth\'s Coin Challenge!',
      `Hey ${name}! Meowth keeps losing count of Giovanni's coins! Help out! 😾`);

    // Coin visual for tier 1
    const cv = document.getElementById('challenge-coin-visual');
    if (this._challenge.coins && tier === 1) {
      const { a, b, op } = this._challenge.coins;
      cv.innerHTML =
        `<div class="coin-group">${'🪙'.repeat(a)}</div>` +
        `<div class="coin-op">${op === '+' ? '➕' : '➖'}</div>` +
        `<div class="coin-group">${'🪙'.repeat(b)}</div>`;
      cv.style.display = 'flex';
    }

    document.getElementById('challenge-question').textContent = this._challenge.question;

    this._renderAnswerBtns(this._challenge.choices, (val) => {
      const correct  = this._challenge.correct;
      const isRight  = val === correct;
      // Mark selected before showResult so highlight works
      document.querySelectorAll('.challenge-answer-btn').forEach(b => {
        if (parseInt(b.textContent) === val) b.classList.add('answer-selected');
      });
      const explanation = isRight
        ? `${correct} is exactly right! NYAH!`
        : `Let me count again: the answer is ${correct}.`;
      const quote = isRight
        ? `The Boss will be so impressed! Maybe I'll get a raise! — Meowth`
        : `Even Meowth gets confused sometimes! Don't worry! — Meowth`;
      this._showResult(isRight, String(correct), explanation, quote);
    });

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.add('meowth-active');
    SoundEngine.playBGM('teamrocket_battle.mp3');
  },

  // ── JESSIE ────────────────────────────────────────────────────────────────

  _showJessie() {
    const name  = GameState.trainerName || 'Trainer';
    const tier  = GameState.difficultyTier || 2;
    const pool  = JESSIE_WORDS[tier] || JESSIE_WORDS[2];
    const entry = pool[Math.floor(Math.random() * pool.length)];
    this._challenge = entry;

    this._setHeader('assets/jessi.png', '✨ Jessie\'s Word Challenge!',
      `${name}! Jessie found a word she doesn't know. Help her impress the Boss! 💄`);

    // Show the word big and proud
    document.getElementById('jessie-word-display').style.display = 'flex';
    document.getElementById('jessie-word').textContent      = entry.word.toUpperCase();
    document.getElementById('jessie-word-type').textContent = `(${entry.pos})`;

    document.getElementById('challenge-question').textContent =
      `What does "${entry.word}" mean?`;

    const choices = shuffle([entry.correct, ...entry.wrong]);
    this._renderAnswerBtns(choices, (val) => {
      document.querySelectorAll('.challenge-answer-btn').forEach(b => {
        if (b.textContent === val) b.classList.add('answer-selected');
      });
      const isRight = val === entry.correct;
      const explanation = isRight
        ? `"${entry.word}" means: ${entry.correct}. Example: ${entry.example}`
        : `"${entry.word}" means: ${entry.correct}. Example: ${entry.example}`;
      this._showResult(isRight, entry.correct, explanation, entry.jessie);
    });

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.add('jessie-active');
    SoundEngine.playBGM('teamrocket_battle.mp3');
  },

  // ── JAMES ─────────────────────────────────────────────────────────────────

  _showJames() {
    const name  = GameState.trainerName || 'Trainer';
    const tier  = GameState.difficultyTier || 2;
    const pool  = JAMES_WORDS[tier] || JAMES_WORDS[2];
    const entry = pool[Math.floor(Math.random() * pool.length)];
    this._challenge = entry;

    this._setHeader('assets/james.png', '📝 James\'s Spelling Challenge!',
      `${name}! James is writing Team Rocket's motto but he can't spell! Help him! 🌹`);

    document.getElementById('challenge-question').textContent =
      `Which is the correct spelling?\n"${entry.clue}"`;

    const choices = shuffle([entry.correct, ...entry.wrong]);
    this._renderAnswerBtns(choices, (val) => {
      document.querySelectorAll('.challenge-answer-btn').forEach(b => {
        if (b.textContent === val) b.classList.add('answer-selected');
      });
      const isRight = val === entry.correct;
      const explanation = isRight
        ? `"${entry.correct}" is spelled perfectly! Well done!`
        : `The correct spelling is "${entry.correct}". Remember: ${entry.correct}!`;
      this._showResult(isRight, entry.correct, explanation, entry.james);
    });

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.add('james-active');
    SoundEngine.playBGM('teamrocket_battle.mp3');
  },

  finish() {
    const sc = document.getElementById('screen-challenge');
    if (sc) sc.classList.remove('meowth-active', 'jessie-active', 'james-active', 'surge-active', 'erika-active', 'koga-active', 'blaine-active', 'sabrina-active');
    showScreen('map');
    MapEngine.renderParty();
    if (this._onComplete) { this._onComplete(); this._onComplete = null; }
  },
};

// Keep MeowthChallenge as an alias so existing CardReward.close still works
const MeowthChallenge = TeamRocketChallenge;

// ─── LEVEL-UP SYSTEM ─────────────────────────────────────────────────────────

// Awards +1 level to every living party member after a battle or training node.
// Returns an array of evolution descriptors for any starters that crossed a threshold:
// { partyIdx, beforeId, afterId, stage, narrative }
// Awards +1 level to every living party member.
// Checks the starter for evolution thresholds — fires whenever level >= threshold,
// regardless of whether it just crossed or was already past it.
// Returns at most ONE evolution descriptor per call.
function levelUpParty(source) {
  const evolutions = [];
  const levelled   = [];

  GameState.party.forEach((p, i) => {
    if (p.hp <= 0) return;
    // Apply ALL level increments BEFORE the evolution check so Lucky Egg
    // level-ups through a threshold are caught in the same call.
    p.level++;
    if (p.heldItem?.id === 'lucky_egg') p.level++;
    p.maxHp += 8;
    p.hp     = Math.min(p.hp + 8, p.maxHp);
    levelled.push(i);

    if (!p.isStarter) return;
    if (evolutions.length > 0) return; // only one evo per call

    const starterId  = Number(GameState.starterId);
    const starter    = STARTERS.find(s => s.id === starterId);
    if (!starter) return;
    const thresholds = EVOLUTION_LEVELS[starterId];
    if (!thresholds) return;
    // Treat null/undefined evolutionStage as 0 so old saves recover automatically
    const stage = GameState.evolutionStage ?? 0;

    if (stage === 0 && thresholds.stage2 && p.level >= thresholds.stage2) {
      evolutions.push({ partyIdx: i, stage: 2,
        beforeId: starter.evolutions[0], afterId: starter.evolutions[1] });
      GameState.evolutionStage = 1;
    } else if (stage === 1 && thresholds.stage3 && p.level >= thresholds.stage3) {
      evolutions.push({ partyIdx: i, stage: 3,
        beforeId: starter.evolutions[1], afterId: starter.evolutions[2] });
      GameState.evolutionStage = 2;
    }
  });

  if (levelled.length > 0) flashLevelUp(levelled);
  return evolutions;
}

// Apply level-up flash to party portrait buttons in the map header
function flashLevelUp(indices) {
  const portraits = document.querySelectorAll('.map-poke-thumb');
  indices.forEach(i => {
    const el = portraits[i];
    if (!el) return;
    el.classList.remove('levelup-flash');
    void el.offsetWidth;
    el.classList.add('levelup-flash');
    setTimeout(() => el.classList.remove('levelup-flash'), 1200);
  });
}

// Run evolution sequence for all queued evolutions, then call onDone
async function runEvolutions(evolutions, onDone) {
  if (evolutions.length === 0) { onDone(); return; }

  const evo      = evolutions[0];
  const rest     = evolutions.slice(1);
  const poke     = GameState.party[evo.partyIdx];
  const name     = GameState.trainerName || 'Trainer';
  const prevName = poke.name;
  const starter  = STARTERS.find(s => s.id === GameState.starterId);
  const isPikachu = starter?.id === 25;

  if (isPikachu) {
    poke.maxHp += 20;
    poke.hp    += 20;
    const narrative = (EVOLVE_NARRATIVES[25]?.[2])?.(name, prevName, prevName) ?? '';
    showModal('⚡ Pikachu Powered Up!', narrative, () => runEvolutions(rest, onDone));
    return;
  }

  // Build narrative before updating the pokemon's name
  const narrativeFn = EVOLVE_NARRATIVES[starter?.id]?.[evo.stage];
  const afterPoke   = await fetchPoke(evo.afterId).catch(() => null);
  const afterName   = afterPoke ? capitalize(afterPoke.name) : 'its new form';
  const narrative   = narrativeFn ? narrativeFn(name, afterName, prevName) : `${prevName} is evolving!`;

  // Update party member data now so the evolve screen shows the right sprites
  poke.id = evo.afterId;
  if (afterPoke) {
    poke.name          = capitalize(afterPoke.name);
    poke.spriteUrl     = getSpriteUrl(afterPoke);
    poke.backSpriteUrl = null;
    poke.maxHp        += 20;
    poke.hp            = poke.maxHp;
  }

  showScreen('evolve');

  // await the Promise — this genuinely pauses here until Continue is pressed
  await EvolveEngine.run(evo.beforeId, evo.afterId, narrative, null);

  // Continue pressed — chain to next evolution or finish
  await runEvolutions(rest, onDone);
}

// ─── GAME CONTROLLER ─────────────────────────────────────────────────────────

// ─── PROFILE ENGINE ──────────────────────────────────────────────────────────

const ProfileEngine = {

  // ── Open profile screen ───────────────────────────────────────────────────
  show(fromStart = true) {
    this._fromStart = fromStart;
    showScreen('profiles');
    this._render();
  },

  _render() {
    const profiles = loadProfiles();
    const grid = document.getElementById('profiles-grid');
    grid.innerHTML = '';
    const active = getActiveProfile();

    profiles.forEach(meta => {
      const isActive = meta.key === active;
      const card = document.createElement('div');
      card.className = 'profile-card' + (isActive ? ' profile-card-active' : '');

      const badgeBar = meta.hasActiveSave
        ? `<div class="profile-badge-bar">
            ${Array(8).fill(0).map((_,i) =>
              `<div class="profile-badge-pip${i < meta.bossesDefeated ? ' earned' : ''}"></div>`
            ).join('')}
           </div>`
        : `<div class="profile-no-save">No save</div>`;

      const typeClass = meta.starterId
        ? (['','grass','grass','grass','fire','fire','fire',
            'water','water','water','electric'][meta.starterId] || 'normal')
        : 'normal';

      card.innerHTML = `
        ${isActive ? '<div class="profile-active-badge">✓ Active</div>' : ''}
        <div class="profile-sprite-wrap">
          <img src="${meta.starterSprite || ''}" alt=""
               onerror="this.style.display='none'"
               class="profile-starter-sprite type-bg-${typeClass}" />
          ${!meta.starterSprite ? `<div class="profile-sprite-placeholder">?</div>` : ''}
        </div>
        <div class="profile-name">${meta.name}</div>
        ${badgeBar}
        <div class="profile-last-saved">${this._timeAgo(meta.lastSaved)}</div>
        <div class="profile-actions">
          <button class="btn-pixel btn-primary profile-play-btn"
                  data-key="${meta.key}">▶ Play</button>
          <button class="btn-pixel btn-danger profile-delete-btn"
                  data-key="${meta.key}">🗑</button>
        </div>
      `;

      card.querySelector('.profile-play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this._selectProfile(meta.key);
      });
      card.querySelector('.profile-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this._confirmDelete(meta);
      });

      grid.appendChild(card);
    });

    // Add "New Profile" slot if under limit
    if (profiles.length < MAX_PROFILES) {
      const addCard = document.createElement('div');
      addCard.className = 'profile-card profile-card-add';
      addCard.innerHTML = `
        <div class="profile-add-icon">+</div>
        <div class="profile-add-label">New Profile</div>
      `;
      addCard.addEventListener('click', () => this._newProfile());
      grid.appendChild(addCard);
    }

    // Back button — only show if there's at least one profile (can't go back with nothing)
    const backBtn = document.getElementById('btn-profiles-back');
    if (backBtn) backBtn.style.display = profiles.length > 0 ? '' : 'none';
  },

  _selectProfile(key) {
    setActiveProfile(key);
    ProfileEngine._updateStartScreen();
    showScreen('start');
  },

  _newProfile() {
    // Go to register — after registration, createProfile() is called with the name
    // Set a flag so Game.startNew knows this is a fresh profile creation
    activeProfile = null;
    try { sessionStorage.removeItem('pokerogue_active_profile'); } catch(e) {}
    Game.startNew(true); // true = profile creation mode
  },

  _confirmDelete(meta) {
    showModal(
      `Delete ${meta.name}?`,
      `This removes all saves, Pokédex entries and unlocks for ${meta.name}. Cannot be undone.`,
      () => {
        deleteProfile(meta.key);
        // If deleted profile was active, clear and re-render
        this._updateStartScreen();
        this._render();
      }
    );
  },

  // ── Update the start screen banner + button states ────────────────────────
  _updateStartScreen() {
    const profiles   = loadProfiles();
    const activeKey  = getActiveProfile();
    const meta       = profiles.find(p => p.key === activeKey);

    const banner     = document.getElementById('active-profile-banner');
    const nudge      = document.getElementById('no-profile-nudge');
    const newBtn     = document.getElementById('btn-new-game');
    const contBtn    = document.getElementById('btn-continue-game');
    const dexBtn     = document.getElementById('btn-open-pokedex');

    if (!meta) {
      // No active profile — disable game buttons, show nudge
      if (banner) banner.style.display = 'none';
      if (nudge)  nudge.style.display  = '';
      if (newBtn)  { newBtn.disabled  = true; }
      if (contBtn) { contBtn.disabled = true; contBtn.textContent = '◈ Continue'; }
      if (dexBtn)  { dexBtn.disabled  = true; }
      return;
    }

    // Profile active — show banner
    if (nudge)  nudge.style.display  = 'none';
    if (banner) {
      banner.style.display = '';
      const nameEl   = document.getElementById('apb-name');
      const detailEl = document.getElementById('apb-detail');
      const spriteEl = document.getElementById('apb-sprite');
      if (nameEl)   nameEl.textContent   = meta.name;
      if (spriteEl) { spriteEl.src = meta.starterSprite || ''; spriteEl.style.display = meta.starterSprite ? '' : 'none'; }
      if (detailEl) {
        if (meta.hasActiveSave) {
          detailEl.textContent = `${meta.bossesDefeated}/8 badges · ${this._timeAgo(meta.lastSaved)}`;
        } else {
          detailEl.textContent = 'No active run';
        }
      }
    }

    // Enable/disable buttons
    if (newBtn)  newBtn.disabled  = false;
    if (dexBtn)  dexBtn.disabled  = false;
    if (contBtn) {
      const hasSave = meta.hasActiveSave;
      contBtn.disabled    = !hasSave;
      contBtn.textContent = hasSave
        ? `◈ Continue · ${meta.bossesDefeated}/8`
        : '◈ No Save';
    }
  },

  _timeAgo(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 2)   return 'just now';
    if (mins  < 60)  return `${mins}m ago`;
    if (hours < 24)  return `${hours}h ago`;
    return `${days}d ago`;
  },
};

const Game = {

  async startNew(isNewProfile = false) {
    // If no active profile yet (new profile creation), just go to register.
    // The profile is created inside confirmStarter after the name is known.
    if (isNewProfile || !getActiveProfile()) {
      // Clear any stale state
      GameState = {
        starterId: null, starterType: null, evolutionStage: 0,
        bossesDefeated: 0, party: [], activePokemonIndex: 0,
        deck: [], improvementMap: {}, map: null,
        currentNodeIndex: null, completedNodes: [], highWaterRow: -1,
        unlockedPikachu: false,
        stats: { battlesWon: 0, pokemonCaught: 0, totalBattlesWon: 0,
                 totalBossesBeaten: 0, totalNodesCompleted: 0 },
        gold: 0, items: [], masterBallUsed: false,
        trainerName: '', trainerAge: 10, difficultyTier: 2,
        nodesSinceRocket: 0, _lastRocketCheckAt: 0,
        _isNewProfile: true,  // flag so confirmStarter creates the profile
      };
      showScreen('register');
      RegistrationEngine.init();
      return;
    }

    // Active profile exists — confirm overwrite if there's an in-progress run
    const profiles = loadProfiles();
    const meta = profiles.find(p => p.key === getActiveProfile());
    if (meta?.hasActiveSave) {
      showModal(
        '▶ New Run?',
        `Start a fresh run as ${meta.name}?\nYour current run (${meta.bossesDefeated}/8 badges) will be lost.`,
        () => this._doStartNew()
      );
    } else {
      this._doStartNew();
    }
  },

  _doStartNew() {
    // ── Carry forward trainer identity from the existing save or profile ──────
    // Read trainerName/Age/difficultyTier BEFORE deleteSave() wipes them.
    // This means returning players never see the name/age/intro flow again.
    const existingSave = loadGame();
    const profiles     = loadProfiles();
    const meta         = profiles.find(p => p.key === getActiveProfile());

    const carriedName  = existingSave?.trainerName
                      || meta?.name
                      || '';
    const carriedAge   = existingSave?.trainerAge    || 10;
    const carriedTier  = existingSave?.difficultyTier || 2;

    deleteSave();
    const unlocks = loadUnlocks();

    GameState = {
      starterId: null, starterType: null, evolutionStage: 0,
      bossesDefeated: 0, party: [], activePokemonIndex: 0,
      deck: [], improvementMap: {}, map: null,
      currentNodeIndex: null, completedNodes: [], highWaterRow: -1,
      unlockedPikachu: unlocks.pikachu,
      unlockedEevee:   unlocks.eevee   || false,
      unlockedMew:     unlocks.mew     || false,
      unlockedMewtwo:  unlocks.mewtwo  || false,
      stats: { battlesWon: 0, pokemonCaught: 0, totalBattlesWon: 0,
               totalBossesBeaten: 0, totalNodesCompleted: 0 },
      gold: 0, items: [], masterBallUsed: false,
      // Carry forward trainer identity — no re-registration needed
      trainerName:    carriedName,
      trainerAge:     carriedAge,
      difficultyTier: carriedTier,
      nodesSinceRocket: 0, _lastRocketCheckAt: 0,
    };

    // Skip register → intro → tutorial for returning players.
    // Go straight to starter select.
    this.showStarterSelect();
  },

  continueGame() {
    const saved = loadGame();
    if (!saved) {
      showModal('No Save Found', 'Start a New Game first!');
      return;
    }
    GameState = saved;
    // Sanitise fields that can get stuck across save/load cycles
    GameState.starterId         = Number(GameState.starterId);
    (GameState.party || []).forEach(p => {
      if (p.heldItem === undefined) p.heldItem = null;
      if (!p.moves)                 p.moves    = [];
      if (!p.statusEffects)         p.statusEffects = [];
      if (!p.name)                  p.name     = capitalize(String(p.id));
    });
    // Backfill new counter fields for saves that predate them
    if (!GameState.nodesSinceRocket)    GameState.nodesSinceRocket    = 0;
    if (!GameState._lastRocketCheckAt)  GameState._lastRocketCheckAt  = 0;
    if (!GameState.stats) GameState.stats = {};
    if (!GameState.stats.totalBattlesWon)     GameState.stats.totalBattlesWon     = GameState.stats.battlesWon || 0;
    if (!GameState.stats.totalBossesBeaten)   GameState.stats.totalBossesBeaten   = GameState.bossesDefeated  || 0;
    if (!GameState.stats.totalNodesCompleted) GameState.stats.totalNodesCompleted = GameState.completedNodes?.length || 0;
    if (!GameState.stats.pokemonCaught)       GameState.stats.pokemonCaught       = 0;

    // Backfill evolutionStage — infer from the starter's actual current Pokémon ID.
    // This repairs saves where evolutionStage was undefined, null, or out of sync.
    // We look at p.id against the starter's evolutions array — the ID never lies.
    if (GameState.evolutionStage == null) {
      const sid     = Number(GameState.starterId);
      const starter = STARTERS.find(s => s.id === sid);
      const poke    = (GameState.party || []).find(p => p.isStarter);
      if (starter && poke) {
        const evos = starter.evolutions; // e.g. [1,2,3] for Bulbasaur
        if (poke.id === evos[2])      GameState.evolutionStage = 2;
        else if (poke.id === evos[1]) GameState.evolutionStage = 1;
        else                          GameState.evolutionStage = 0;
      } else {
        GameState.evolutionStage = 0;
      }
    }
    MapEngine.show();
  },

  async showStarterSelect() {
    showScreen('starter');
    const name = GameState.trainerName ? `, ${GameState.trainerName}` : '';
    const titleEl = document.querySelector('#screen-starter .screen-title');
    if (titleEl) titleEl.textContent = `Choose Your Partner${name}!`;
    const grid = document.getElementById('starter-grid');
    grid.innerHTML = '';

    // Load unlock progress for Eevee hint
    const unlocks    = loadUnlocks();
    const completedWith = unlocks.completedWith || [];
    const BASE_NAMES = ['bulbasaur','charmander','squirtle'];
    const eeveeProgress = BASE_NAMES.map(n => ({
      name: n, icon: n==='bulbasaur'?'🌿':n==='charmander'?'🔥':'💧',
      done: completedWith.includes(n),
    }));

    for (const s of STARTERS) {
      const data   = await fetchPoke(s.id).catch(() => null);
      const sprite = data ? getSpriteUrl(data) : '';

      // Determine lock state per starter type
      let locked = false;
      if (s.id === 25)  locked = !GameState.unlockedPikachu;
      if (s.id === 133) locked = !GameState.unlockedEevee && !unlocks.eevee;
      if (s.id === 151) locked = !GameState.unlockedMew   && !unlocks.mew;
      if (s.id === 150) locked = !GameState.unlockedMewtwo && !unlocks.mewtwo;

      const card = document.createElement('div');
      card.className = 'starter-card';
      card.dataset.id   = s.id;
      card.dataset.type = s.type;

      // Build lock overlay — Eevee gets a progress indicator
      let lockHtml = '';
      if (locked && s.id === 133) {
        const pips = eeveeProgress.map(p =>
          `<span class="eevee-prog-pip${p.done ? ' done' : ''}">${p.icon}${p.done ? '✓' : '✗'}</span>`
        ).join('');
        lockHtml = `<div class="starter-locked">
          <div class="starter-locked-icon">🔒</div>
          <div class="starter-locked-text">Complete all 3 starters!</div>
          <div class="eevee-progress">${pips}</div>
        </div>`;
      } else if (locked && s.id === 151) {
        const dex        = loadPokedex();
        const caught     = Object.values(dex).filter(e => e.caught).length;
        lockHtml = `<div class="starter-locked">
          <div class="starter-locked-icon">🔒</div>
          <div class="starter-locked-text">Catch 20+ Pokémon!</div>
          <div class="starter-locked-hint">${caught}/20 caught</div>
        </div>`;
      } else if (locked && s.id === 150) {
        const ALL = ['bulbasaur','charmander','squirtle','pikachu','eevee','mew'];
        const done = ALL.filter(n => completedWith.includes(n));
        lockHtml = `<div class="starter-locked">
          <div class="starter-locked-icon">🔒</div>
          <div class="starter-locked-text">Complete all other starters!</div>
          <div class="starter-locked-hint">${done.length}/${ALL.length} complete</div>
        </div>`;
      } else if (locked) {
        lockHtml = `<div class="starter-locked">
          <div class="starter-locked-icon">🔒</div>
          <div class="starter-locked-text">Complete game<br>to unlock!</div>
        </div>`;
      }

      card.innerHTML = `
        <img class="starter-sprite" src="${sprite}" alt="${s.name}"
             onerror="this.src='assets/sprites/${s.id}.png'" />
        <div class="starter-name">${s.name}</div>
        <div class="starter-type-badge type-${s.type}">${s.type}</div>
        <div class="starter-desc">${StarterDescs[s.name]||''}</div>
        ${lockHtml}
      `;
      if (!locked) {
        card.addEventListener('mouseenter', () => SoundEngine.playStarterCry(s.id));
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
    if (s.id === 25)  SoundEngine.playPikachu2();
    if (s.id === 133) SoundEngine.playStarterCry(133);
    const data   = await fetchPoke(s.id);
    const sprite = getSpriteUrl(data);
    // Mewtwo starts at level 10 and gets +40 HP (handled in makePokemon via id check)
    const startLevel = s.id === 150 ? 10 : 5;
    const pokemon = makePokemon(s.id, startLevel, sprite, s.name, s.type, true);
    // Deck selection:
    // Eevee → eevee template; Mew → mew template; Mewtwo → mewtwo template; others → type
    const deckType = s.eeveeStarter ? 'eevee' : s.mewStarter ? 'mew' : s.mewtwostarter ? 'mewtwo' : s.type;
    const starterDeck = buildDeck(deckType, {});
    pokemon.deck = starterDeck;
    // Flag Mewtwo so _applyCardEffect can apply the psychic 2× bonus
    if (s.id === 150) pokemon.isMewtwo = true;

    // If this is a brand-new profile, create it now that we have a name
    if (GameState._isNewProfile) {
      delete GameState._isNewProfile;
      const meta = createProfile(GameState.trainerName || 'Trainer');
      if (meta) {
        setActiveProfile(meta.key);
        // Load unlocks for the new (empty) profile
        const unlocks = loadUnlocks();
        GameState.unlockedPikachu = unlocks.pikachu || false;
        GameState.unlockedEevee   = unlocks.eevee   || false;
        GameState.unlockedMew     = unlocks.mew     || false;
        GameState.unlockedMewtwo  = unlocks.mewtwo  || false;
      }
    }

    GameState.starterId           = s.id;
    GameState.starterType         = s.type;
    GameState.party               = [pokemon];
    GameState.activePokemonIndex  = 0;
    GameState.deck                = starterDeck;
    GameState.improvementMap      = {};
    GameState.map                 = generateMap();
    GameState.completedNodes      = [];
    GameState.bossesDefeated      = 0;
    GameState.evolutionStage      = 0;
    GameState.nodesSinceRocket    = 0;
    GameState._lastRocketCheckAt  = 0;
    hideLoading();
    saveGame();   // first save — also updates profile meta with starterId
    MapEngine.show();
  },

  returnToStart() {
    deleteSave();
    const p = getActiveProfile();
    if (p) {
      const profiles = loadProfiles();
      const meta = profiles.find(pr => pr.key === p);
      if (meta) { meta.hasActiveSave = false; saveProfiles(profiles); }
    }
    GameState = null;
    ProfileEngine._updateStartScreen();
    showScreen('start');
  },

  goToMenu() {
    SoundEngine.stopSFX();
    saveGame();
    GameState = null;
    ProfileEngine._updateStartScreen();
    showScreen('start');
  },

  resetAll() {
    const profiles = loadProfiles();
    profiles.forEach(pr => {
      try { localStorage.removeItem(saveKey(pr.key)); }    catch(e) {}
      try { localStorage.removeItem(unlockKey(pr.key)); }  catch(e) {}
      try { localStorage.removeItem(pokedexKey(pr.key)); } catch(e) {}
    });
    try { localStorage.removeItem(PROFILES_KEY); }              catch(e) {}
    try { sessionStorage.removeItem('pokerogue_active_profile'); } catch(e) {}
    activeProfile = null;
    GameState = null;
    window.location.reload();
  },

  async afterBoss(bossIndex) {
    GameState.bossesDefeated++;
    const defeated = GameState.bossesDefeated;
    const boss     = BOSS_TRAINERS[Math.min(defeated - 1, BOSS_TRAINERS.length - 1)];

    // ── Won all 8 gyms → Victory ──────────────────────────────────────────
    if (defeated >= 8) {
      // Track which starter completed this run
      const unlocks = loadUnlocks();
      unlocks.pikachu = true;
      const starterObj = STARTERS.find(s => s.id === GameState.starterId);
      const starterName = starterObj?.name?.toLowerCase() || '';
      if (starterName && !['pikachu','eevee'].includes(starterName)) {
        if (!unlocks.completedWith) unlocks.completedWith = [];
        if (!unlocks.completedWith.includes(starterName)) {
          unlocks.completedWith.push(starterName);
        }
      }
      // Unlock Eevee when all 3 base starters have completed a run
      const BASE = ['bulbasaur','charmander','squirtle'];
      if (BASE.every(n => unlocks.completedWith?.includes(n))) {
        unlocks.eevee = true;
      }

      // Unlock Mew when at least one Pokémon of every Kanto catchable type has been caught
      const KANTO_TYPES = ['normal','fire','water','grass','electric','ice','fighting',
                           'poison','ground','flying','psychic','bug','rock','ghost','dragon','fairy'];
      const dex = loadPokedex();
      const caughtTypes = new Set(
        Object.values(dex)
          .filter(e => e.caught)
          .map(e => {
            const pid = Number(e.id);
            return DUAL_TYPE_OVERRIDES[pid] || null; // we don't store type in dex, approximate via overrides
          })
          .filter(Boolean)
      );
      // More reliable: scan party and completed catches stored in dex — use a broader check
      // Count caught dex entries by type via DUAL_TYPE_OVERRIDES or the PokeAPI type stored at catch time
      // Since we store .caught but not type in dex, check if at least 12 distinct types are in the dex
      // (player needs to have caught broadly — detailed per-type check handled on starter screen)
      const caughtCount = Object.values(dex).filter(e => e.caught).length;
      if (caughtCount >= 20) {
        // Approximate: catching 20+ different Pokémon across the game covers most types
        // Full type check is done on the starter screen for the hint display
        unlocks.mew = true;
      }

      // Unlock Mewtwo when all other starters have completed a run
      const ALL_STARTERS = ['bulbasaur','charmander','squirtle','pikachu','eevee','mew'];
      if (ALL_STARTERS.every(n => unlocks.completedWith?.includes(n))) {
        unlocks.mewtwo = true;
      }
      saveUnlocks(unlocks);
      GameState.unlockedPikachu = true;
      GameState.unlockedEevee   = unlocks.eevee   || false;
      GameState.unlockedMew     = unlocks.mew     || false;
      GameState.unlockedMewtwo  = unlocks.mewtwo  || false;
      saveGame();
      VictoryEngine.show();
      return;
    }

    // ── Generate next map ─────────────────────────────────────────────────
    const nextBossIdx = Math.min(defeated, BOSS_TRAINERS.length - 1);
    GameState.map               = generateMap(nextBossIdx);
    GameState.completedNodes    = [];
    GameState.highWaterRow      = -1;
    GameState.nodesSinceRocket  = 0;
    GameState._lastRocketCheckAt = 0;
    GameState.lureActive        = false; // lure expires per-map

    // ── Level up party after boss win (+3 bonus levels) ───────────────────
    // Give everyone 4 bonus levels after a boss win.
    // Only the first evolution that fires is used — GameState.evolutionStage
    // is updated on first trigger so subsequent calls won't re-trigger the same stage.
    const evolutions = [];
    for (let bonus = 0; bonus < 4; bonus++) {
      const evo = levelUpParty('boss');
      if (evo.length > 0 && evolutions.length === 0) evolutions.push(...evo);
    }

    const nextBoss  = BOSS_TRAINERS[nextBossIdx];
    const badgeMsg  = `${boss?.title ?? 'Badge'} earned!\n${nextBoss?.name ?? 'Next challenger'} awaits!`;

    saveGame();

    const showBadgeModal = () => {
      if (evolutions.length > 0) {
        runEvolutions(evolutions, () => {
          showModal('Badge Earned! 🏅', badgeMsg, () => MapEngine.show());
        });
      } else {
        showModal('Badge Earned! 🏅', badgeMsg, () => MapEngine.show());
      }
    };

    // After beating Brock (defeated===1) show his joining narrative first
    if (defeated === 1) {
      const name = GameState.trainerName || 'Trainer';
      showModal(
        '🧑‍🍳 Brock wants to join!',
        `That was an incredible battle, ${name}. Your Pokémon have real heart — I haven't seen that kind of bond in a long time.\n\nI can't just let you walk out of here. My team and I would like to travel with you for a while. At least until you reach the next gym.\n\nAnd don't worry — I'll cook for your Pokémon every chance we get. A well-fed team is a strong team!`,
        () => showBadgeModal()
      );
    // After beating Misty (defeated===2) show her joining narrative first
    } else if (defeated === 2) {
      const name = GameState.trainerName || 'Trainer';
      showModal(
        '🎣 Misty wants to join!',
        `Okay, okay — you beat me fair and square, ${name}. I'll admit it. Your Pokémon were something else.\n\nBut don't get smug about it! I'm coming with you. Someone needs to keep an eye on you, and frankly the route ahead has some incredible water Pokémon I want to study.\n\nI'll test your type knowledge whenever I can. A trainer who doesn't know their matchups is a trainer who loses — and I won't have that on my watch.`,
        () => showBadgeModal()
      );
    } else {
      showBadgeModal();
    }
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
  Eevee:      'A Pokémon of infinite potential. Flexible and adaptable.',
  Mew:        'The ancestor of all Pokémon. Its deck is a mystery — even to itself.',
  Mewtwo:     'Engineered for absolute power. Psychic attacks deal double damage.',
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

      const isActive  = i === GameState.activePokemonIndex;
      const canActive = !isActive && p.hp > 0;
      const position  = isActive ? '★ Active' : i === 0 ? '1st' : `#${i + 1}`;
      const hpPct     = Math.round(p.hp / p.maxHp * 100);
      const hpCol     = hpColor(p.hp, p.maxHp);
      const cardCount = (p.deck || []).length;

      const heldItem  = p.heldItem;
      const heldBadge = heldItem
        ? `<div class="party-held-badge" title="${heldItem.name}">${heldItem.icon}</div>`
        : '';

      row.innerHTML = `
        <div class="party-row-drag-handle" title="Drag to reorder">⠿</div>
        <div class="party-row-sprite-wrap">
          <img src="${p.spriteUrl}" alt="${p.name}"
               onerror="this.src='assets/sprites/${p.id}.png'"
               class="party-row-sprite" />
          ${p.hp <= 0 ? '<div class="party-row-fainted-x">✕</div>' : ''}
          ${heldBadge}
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
          <div class="party-held-row">
            ${heldItem
              ? `<span class="party-held-label">${heldItem.icon} ${heldItem.name}</span>
                 <button class="party-held-btn party-held-move-btn" data-idx="${i}">Move</button>
                 <button class="party-held-btn party-held-remove-btn" data-idx="${i}">Remove</button>`
              : `<button class="party-held-btn party-held-equip-btn" data-idx="${i}">+ Give Item</button>`
            }
          </div>
        </div>
        <div class="party-row-actions">
          ${canActive ? `<button class="party-row-set-active-btn" data-idx="${i}" title="Set as active Pokémon">⚡ Set Active</button>` : ''}
          <button class="party-row-cards-btn" data-idx="${i}" title="View battle cards">
            🃏 ${cardCount}
          </button>
        </div>
      `;

      // Drag-and-drop events
      row.addEventListener('dragstart', e => this._onDragStart(e, i));
      row.addEventListener('dragover',  e => this._onDragOver(e));
      row.addEventListener('dragleave', e => row.classList.remove('party-row-drag-over'));
      row.addEventListener('drop',      e => this._onDrop(e, i));
      row.addEventListener('dragend',   () => this._onDragEnd());

      // Set Active button
      const setActiveBtn = row.querySelector('.party-row-set-active-btn');
      if (setActiveBtn) {
        setActiveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.setActive(i);
        });
      }

      // Held item — equip
      const equipBtn = row.querySelector('.party-held-equip-btn');
      if (equipBtn) {
        equipBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._showEquipPicker(i);
        });
      }
      // Held item — move to another pokemon
      const moveBtn = row.querySelector('.party-held-move-btn');
      if (moveBtn) {
        moveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._showMovePicker(i);
        });
      }
      // Held item — remove back to bag
      const removeBtn = row.querySelector('.party-held-remove-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          ItemEngine.unequipItem(GameState.party[i]);
          this._render();
        });
      }

      // Cards button
      row.querySelector('.party-row-cards-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.openDetail(i);
      });

      list.appendChild(row);
    });
  },

  setActive(idx) {
    const p = GameState.party[idx];
    if (!p || p.hp <= 0) return;
    GameState.activePokemonIndex = idx;
    if (p.deck) GameState.deck = p.deck;
    saveGame();
    this._render();
  },

  // Show a modal to pick a held item from the bag and equip it
  _showEquipPicker(partyIdx) {
    const heldInBag = (GameState.items || []).filter(i => {
      const def = SHOP_ITEMS.find(s => s.id === i.id);
      return def?.category === 'held' && i.count > 0;
    });
    if (!heldInBag.length) {
      showModal('No Held Items', 'You have no held items in your bag. Buy some at a Shop!', () => {});
      return;
    }
    const poke = GameState.party[partyIdx];
    const body = heldInBag.map(i => `${i.icon} ${i.name}`).join(' | ');
    // Build a simple selection modal
    const overlay = document.createElement('div');
    overlay.className = 'held-picker-overlay';
    overlay.innerHTML = `
      <div class="held-picker-panel">
        <div class="held-picker-title">Give item to ${poke.name}</div>
        <div class="held-picker-list" id="held-picker-list"></div>
        <button class="btn-pixel btn-secondary" id="held-picker-cancel">Cancel</button>
      </div>`;
    document.body.appendChild(overlay);
    const list = overlay.querySelector('#held-picker-list');
    heldInBag.forEach(item => {
      const def = SHOP_ITEMS.find(s => s.id === item.id);
      const btn = document.createElement('button');
      btn.className = 'held-picker-item-btn';
      btn.innerHTML = `<span class="held-picker-icon">${item.icon}</span>
        <span class="held-picker-name">${item.name}</span>
        <span class="held-picker-desc">${def?.description || ''}</span>`;
      btn.addEventListener('click', () => {
        ItemEngine.equipItem(poke, item.id);
        document.body.removeChild(overlay);
        this._render();
      });
      list.appendChild(btn);
    });
    overlay.querySelector('#held-picker-cancel').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
  },

  // Show a modal to move the held item to another party member
  _showMovePicker(fromIdx) {
    const fromPoke = GameState.party[fromIdx];
    if (!fromPoke.heldItem) return;
    const others = GameState.party.filter((_, i) => i !== fromIdx);
    if (!others.length) {
      showModal('No Other Pokémon', 'You have no other party members to give this to.', () => {});
      return;
    }
    const overlay = document.createElement('div');
    overlay.className = 'held-picker-overlay';
    overlay.innerHTML = `
      <div class="held-picker-panel">
        <div class="held-picker-title">Move ${fromPoke.heldItem.icon} ${fromPoke.heldItem.name} to...</div>
        <div class="held-picker-list" id="held-move-list"></div>
        <button class="btn-pixel btn-secondary" id="held-move-cancel">Cancel</button>
      </div>`;
    document.body.appendChild(overlay);
    const list = overlay.querySelector('#held-move-list');
    GameState.party.forEach((p, i) => {
      if (i === fromIdx) return;
      const btn = document.createElement('button');
      btn.className = 'held-picker-item-btn';
      btn.innerHTML = `<img src="${p.spriteUrl}" class="held-move-sprite" alt="${p.name}" />
        <span class="held-picker-name">${p.name}</span>
        <span class="held-picker-desc">${p.heldItem ? `Currently: ${p.heldItem.icon} ${p.heldItem.name}` : 'No item'}</span>`;
      btn.addEventListener('click', () => {
        ItemEngine.moveHeldItem(fromPoke, p);
        document.body.removeChild(overlay);
        this._render();
      });
      list.appendChild(btn);
    });
    overlay.querySelector('#held-move-cancel').addEventListener('click', () => {
      document.body.removeChild(overlay);
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

// ─── MAP ENGINE (Navigation View) ────────────────────────────────────────────

// Background image filenames per boss index
const GYM_BACKGROUNDS = [
  'bg_0_brock.png',
  'bg_1_misty.png',
  'bg_2_surge.png',
  'bg_3_erika.png',
  'bg_4_koga.png',
  'bg_5_sabrina.png',
  'bg_6_blaine.png',
  'bg_7_giovanni.png',
  'bg_8_lorelei.png',
  'bg_9_bruno.png',
  'bg_10_agatha.png',
  'bg_11_lance.png',
  'bg_12_blue.png',
];

// Fallback CSS gradient per boss index (shown if image hasn't loaded)
const GYM_FALLBACKS = [
  'linear-gradient(180deg,#6a5a40 0%,#8a7250 40%,#5a4838 100%)',  // Brock
  'linear-gradient(180deg,#1a6a9a 0%,#2a7a3a 50%,#1a4a2a 100%)', // Misty
  'linear-gradient(180deg,#2a3a20 0%,#4a5a28 50%,#1a2810 100%)', // Surge
  'linear-gradient(180deg,#1a5a1a 0%,#2a8a2a 50%,#0a3a0a 100%)', // Erika
  'linear-gradient(180deg,#1a0a2a 0%,#2a1a4a 50%,#0e0618 100%)', // Koga
  'linear-gradient(180deg,#200828 0%,#4a2a6a 50%,#120416 100%)', // Sabrina
  'linear-gradient(180deg,#1a0800 0%,#3a1800 50%,#0a0400 100%)', // Blaine
  'linear-gradient(180deg,#0a0a0a 0%,#1a1a1a 50%,#000000 100%)', // Giovanni
  'linear-gradient(180deg,#3060a0 0%,#a0c8e8 50%,#205080 100%)', // Lorelei
  'linear-gradient(180deg,#2a1008 0%,#6a3018 50%,#180808 100%)', // Bruno
  'linear-gradient(180deg,#06060e 0%,#1a1430 50%,#02020a 100%)', // Agatha
  'linear-gradient(180deg,#060c20 0%,#0a1a40 50%,#020608 100%)', // Lance
  'linear-gradient(180deg,#0e0202 0%,#2a0808 50%,#060000 100%)', // Blue
];

// Arrow directions by number of choices
const ARROW_DIRS = {
  1: ['straight'],
  2: ['left', 'right'],
  3: ['left', 'straight', 'right'],
};

// icon: path to asset (null = emoji fallback), label shown under arrow
const ARROW_LABELS = {
  battle:   { icon: 'assets/battle_icon.png',  label: 'Battle'  },
  heal:     { icon: 'assets/heal_icon.png',    label: 'Heal'    },
  catch:    { icon: 'assets/catch_icon.png',   label: 'Catch'   },
  training: { icon: null, emoji: '⚡',          label: 'Train'   },
  shop:     { icon: 'assets/shop_icon.png',    label: 'Shop'    },
  boss:     { icon: 'assets/boss_icon.png',    label: 'GYM!'   },
  mystery:  { icon: null, emoji: '❓',          label: '???'    },
  cooking:  { icon: null, emoji: '🍳',          label: "Brock's Kitchen" },
  maze:     { icon: null, emoji: '🌊',          label: "Misty's Maze"   },
  fishing:  { icon: null, emoji: '🎣',          label: "Misty's Fishing"},
};

// Builds an inline SVG directional chevron for nav arrows.
// left  → arrow pointing left  (←)
// straight → arrow pointing up  (↑)
// right → arrow pointing right (→)
function _navChevronSvg(dir) {
  const W = 44, H = 36;
  const stroke = 'rgba(255,255,255,0.88)';
  const sw = 3.5; // stroke-width
  const cap = 'round';
  let path = '';

  if (dir === 'straight') {
    // Vertical line with upward arrowhead — clearly means "go forward / up"
    const cx = W / 2;
    path = `
      <line x1="${cx}" y1="${H - 4}" x2="${cx}" y2="6"
            stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${cap}"/>
      <polyline points="${cx - 10},18 ${cx},6 ${cx + 10},18"
                stroke="${stroke}" stroke-width="${sw}"
                stroke-linecap="${cap}" stroke-linejoin="round" fill="none"/>
    `;
  } else if (dir === 'left') {
    // Horizontal line with leftward arrowhead — clearly means "go left"
    const cy = H / 2;
    path = `
      <line x1="${W - 5}" y1="${cy}" x2="8" y2="${cy}"
            stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${cap}"/>
      <polyline points="${8 + 12},${cy - 9} ${8},${cy} ${8 + 12},${cy + 9}"
                stroke="${stroke}" stroke-width="${sw}"
                stroke-linecap="${cap}" stroke-linejoin="round" fill="none"/>
    `;
  } else {
    // dir === 'right'
    const cy = H / 2;
    path = `
      <line x1="5" y1="${cy}" x2="${W - 8}" y2="${cy}"
            stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${cap}"/>
      <polyline points="${W - 8 - 12},${cy - 9} ${W - 8},${cy} ${W - 8 - 12},${cy + 9}"
                stroke="${stroke}" stroke-width="${sw}"
                stroke-linecap="${cap}" stroke-linejoin="round" fill="none"/>
    `;
  }

  return `<svg class="nav-chevron-svg" viewBox="0 0 ${W} ${H}"
               width="${W}" height="${H}"
               xmlns="http://www.w3.org/2000/svg">${path}</svg>`;
}

const MapEngine = {
  _lastBi: -1,

  show() {
    // Check if a Rocket event should fire before returning to the nav screen.
    // Only trigger if we just completed a node (completedNodes has grown).
    const justCompleted = GameState._lastRocketCheckAt !== GameState.completedNodes.length;
    if (justCompleted) {
      GameState._lastRocketCheckAt = GameState.completedNodes.length;
      const lastNodeIdx  = GameState.completedNodes[GameState.completedNodes.length - 1];
      const lastNode     = GameState.map?.find(n => n.idx === lastNodeIdx);
      const lastNodeType = lastNode?.type ?? 'battle';
      if (MeowthChallenge.shouldTrigger(lastNodeType)) {
        MeowthChallenge.show(() => this._showNav());
        return;
      }
    }
    this._showNav();
  },

  _showNav() {
    showScreen('map');
    this.renderParty();
    this.renderNav();
    ItemEngine.renderBagBar();
    saveGame();
  },

  // ── Set gym background image ─────────────────────────────────────────────
  // ── Vertical gym tracker ─────────────────────────────────────────────────
  _renderGymTracker(bi, available) {
    const TOTAL_STEPS = 10;
    const done        = Math.max(0, GameState.highWaterRow ?? 0);
    const isBoss      = available?.[0]?.type === 'boss';

    // Label
    const labelEl = document.getElementById('gym-tracker-label');
    if (labelEl) {
      labelEl.textContent = isBoss ? '⚔️' : `${done}/${TOTAL_STEPS}`;
    }

    // Pips — rebuild only when count changes (perf)
    const pipsEl = document.getElementById('gym-tracker-pips');
    if (!pipsEl) return;

    // Always rebuild so classes stay in sync
    pipsEl.innerHTML = '';
    for (let i = 0; i < TOTAL_STEPS; i++) {
      const pip = document.createElement('div');
      if (i < done) {
        pip.className = 'gym-pip gym-pip-done';
      } else if (i === done && !isBoss) {
        pip.className = 'gym-pip gym-pip-current';
      } else {
        pip.className = 'gym-pip gym-pip-empty';
      }
      pipsEl.appendChild(pip);
    }
  },

  // ── Apply map background ─────────────────────────────────────────────────
  _applyBackground(bi) {
    const bgEl = document.getElementById('nav-bg');
    if (!bgEl) return;
    const file     = GYM_BACKGROUNDS[Math.min(bi, GYM_BACKGROUNDS.length - 1)];
    const fallback = GYM_FALLBACKS[Math.min(bi, GYM_FALLBACKS.length - 1)];
    const url      = `assets/backgrounds/${file}`;

    // Always set fallback gradient first so something shows immediately
    bgEl.style.background = fallback;

    // Preload image then swap in
    const img = new Image();
    img.onload  = () => {
      bgEl.style.background = `url('${url}') center center / cover no-repeat`;
    };
    img.onerror = () => { /* keep fallback gradient */ };
    img.src = url;

    // Fade transition when gym changes
    if (bi !== this._lastBi) {
      bgEl.classList.remove('nav-bg-fade');
      void bgEl.offsetWidth;
      bgEl.classList.add('nav-bg-fade');
      this._lastBi = bi;
    }
  },

  // ── Render party bar ─────────────────────────────────────────────────────
  renderParty() {
    const el = document.getElementById('map-party');
    if (!el) return;
    el.innerHTML = '';
    GameState.party.forEach((p, i) => {
      const d = document.createElement('div');
      const isActive = i === GameState.activePokemonIndex;
      d.className = 'map-poke-thumb' + (isActive ? ' map-poke-thumb-active' : '');
      d.innerHTML = `<img src="${p.spriteUrl}" alt="${p.name}"
                         onerror="this.src='assets/sprites/${p.id}.png'" />
                     <div class="thumb-hp" style="width:${Math.round(p.hp/p.maxHp*100)}%;
                       background:${hpColor(p.hp, p.maxHp)}"></div>
                     ${p.hp <= 0 ? '<div class="thumb-fainted">✕</div>' : ''}
                     ${p.heldItem ? `<div class="thumb-held-badge" title="${p.heldItem.name}">${p.heldItem.icon}</div>` : ''}`;
      d.title = `${p.name} — Click to manage party`;
      d.style.cursor = 'pointer';
      d.addEventListener('click', () => PartyOverview.open());
      el.appendChild(d);
    });
    const bi   = GameState.map?._bossIndex ?? GameState.bossesDefeated ?? 0;
    document.getElementById('map-meta').textContent =
      `💰 ${GameState.gold || 0}g  |  Party: ${GameState.party.length}/6`;

    // ── Catch-all evolution repair ───────────────────────────────────────────
    // If the starter's level has passed a threshold but evolutionStage is behind
    // (e.g. from a corrupted/old save or a Lucky Egg edge case), fire the
    // evolution now. Guard flag prevents re-entry if renderParty is called
    // again before the evolve screen resolves.
    if (this._evoCheckPending) return;
    const sid       = Number(GameState.starterId);
    const starter   = STARTERS.find(s => s.id === sid);
    const thresholds = EVOLUTION_LEVELS[sid];
    const poke      = (GameState.party || []).find(p => p.isStarter && p.hp > 0);
    if (!starter || !thresholds || !poke) return;

    const stage = GameState.evolutionStage ?? 0;

    let missedEvo = null;
    if (stage === 0 && thresholds.stage2 && poke.level >= thresholds.stage2) {
      // Starter should have evolved to stage 2 already
      missedEvo = { partyIdx: GameState.party.indexOf(poke), stage: 2,
        beforeId: starter.evolutions[0], afterId: starter.evolutions[1] };
      GameState.evolutionStage = 1;
    } else if (stage === 1 && thresholds.stage3 && poke.level >= thresholds.stage3) {
      // Starter should have evolved to stage 3 already
      missedEvo = { partyIdx: GameState.party.indexOf(poke), stage: 3,
        beforeId: starter.evolutions[1], afterId: starter.evolutions[2] };
      GameState.evolutionStage = 2;
    }

    if (missedEvo) {
      this._evoCheckPending = true;
      saveGame();
      runEvolutions([missedEvo], () => {
        this._evoCheckPending = false;
        this.show(); // re-render map after evolution completes
      });
    }
  },

  // ── Main navigation renderer ─────────────────────────────────────────────
  renderNav() {
    const nodes = GameState.map;
    if (!nodes) return;

    const bi    = nodes._bossIndex ?? GameState.bossesDefeated ?? 0;
    const boss  = BOSS_TRAINERS[Math.min(bi, BOSS_TRAINERS.length - 1)];
    const theme = MAP_THEMES[Math.min(bi, MAP_THEMES.length - 1)];

    // Apply background
    this._applyBackground(bi);

    // ── Location badge ─────────────────────────────────────────────────────
    document.getElementById('nav-location-name').textContent = theme.name;
    document.getElementById('nav-location-sub').textContent =
      `Heading toward ${boss?.name ?? 'the Boss'} · ${GameState.bossesDefeated}/8 badges`;

    // ── Find available choices ──────────────────────────────────────────────
    // With the decision-graph structure, multiple rows may have unlocked nodes
    // (all children of the previously completed node are unlocked at once).
    // We only want to show the CURRENT step — the minimum row among unlocked nodes.
    const allUnlocked = nodes.filter(n =>
      typeof n.idx === 'number' &&
      n.unlocked &&
      !n.done &&
      !n.bypassed
    );
    const minRow  = allUnlocked.length > 0
      ? Math.min(...allUnlocked.map(n => n.row))
      : 0;
    const available = allUnlocked
      .filter(n => n.row === minRow)
      .sort((a, b) => {
        // Sort by lane: left → mid → right for consistent arrow layout
        const order = { left: 0, mid: 1, right: 2 };
        return (order[a.lane] ?? 1) - (order[b.lane] ?? 1);
      });

    // ── Gym tracker (vertical left bar) ───────────────────────────────────
    this._renderGymTracker(bi, available);

    // ── Build choice arrows ────────────────────────────────────────────────
    const choicesEl = document.getElementById('nav-choices');
    choicesEl.innerHTML = '';

    if (available.length === 0) {
      // Shouldn't happen — safety fallback
      choicesEl.innerHTML = '<div class="nav-empty">No paths available…</div>';
      return;
    }

    const count = Math.min(available.length, 3);
    const dirs  = ARROW_DIRS[count] || ARROW_DIRS[3];

    available.slice(0, 3).forEach((node, i) => {
      const dir      = dirs[i];
      const revealed = !!node.revealed || node.type === 'boss';
      const isCatch  = node.type === 'catch' || node.type === 'mystery';
      const isBoss   = node.type === 'boss';

      // Lure: glow all catch nodes gold; Repel: glow next catch node purple
      const lureGlow  = isCatch && GameState.lureActive;
      const repelCount = (GameState.items || []).find(i => i.id === 'repel' && i.count > 0)?.count || 0;
      // Repel glows the first repelCount catch nodes encountered
      const catchNodesSoFar = available.slice(0, i).filter(n => n.type === 'catch' || n.type === 'mystery').length;
      const repelGlow = isCatch && repelCount > 0 && catchNodesSoFar < repelCount;

      // Override label for lure/repel
      let info = revealed
        ? (ARROW_LABELS[node.type] || ARROW_LABELS.mystery)
        : ARROW_LABELS.mystery;
      if (lureGlow)  info = { ...info, label: '🎣 Rare!' };
      if (repelGlow) info = { ...info, label: '🚫 Repel' };

      // Build icon HTML
      const iconHtml = info.icon
        ? `<img src="${info.icon}" alt="${info.label}" class="nav-arrow-img"
               onerror="this.style.display='none';this.nextElementSibling.style.display=''"
           /><span class="nav-arrow-emoji" style="display:none">${info.emoji || '?'}</span>`
        : `<span class="nav-arrow-emoji">${info.emoji || '?'}</span>`;

      const chevronSvg = _navChevronSvg(dir);

      const btn = document.createElement('button');
      const rarityClass = (node.type === 'catch' || node.type === 'legendary') && node.catchRarity
        ? ` nav-arrow-catch-${node.catchRarity}` : '';
      btn.className = `nav-arrow nav-arrow-${dir}`
        + (isBoss   ? ' nav-arrow-boss'  : '')
        + (lureGlow ? ' nav-arrow-lure'  : '')
        + (repelGlow? ' nav-arrow-repel' : '')
        + rarityClass;
      btn.style.setProperty('--arrow-accent', theme.accent);
      btn.innerHTML = `
        <div class="nav-arrow-icon">${iconHtml}</div>
        ${chevronSvg}
        <div class="nav-arrow-label">${info.label}</div>
      `;
      btn.title = `Go ${dir} — ${info.label}`;
      btn.addEventListener('click', () => this.visitNode(node));
      choicesEl.appendChild(btn);
    });
  },

  // ── Visit a node ─────────────────────────────────────────────────────────
  visitNode(node) {
    // Bypass sibling nodes at same row
    GameState.map.forEach(n => {
      if (typeof n.idx !== 'number') return;
      if (n.idx === node.idx) return;
      if (n.row === node.row && !n.done) {
        n.bypassed = true;
        n.unlocked = false;
      }
    });
    if (node.row > (GameState.highWaterRow ?? -1)) {
      GameState.highWaterRow = node.row;
    }
    GameState.currentNodeIndex = node.idx;
    switch (node.type) {
      case 'battle':   BattleEngine.start(node);       break;
      case 'heal':     HealEngine.start(node);          break;
      case 'catch':    CatchEngine.start(node, node.catchRarity);  break;
      case 'training': TrainingEngine.start(node);      break;
      case 'shop':     ShopEngine.start(node);          break;
      case 'boss':     BossEngine.start(node);                 break;
      case 'mystery':  MysteryEngine.start(node);              break;
      case 'cooking':  CookingEngine.start(node);              break;
      case 'maze':     MazeEngine.start(node);                  break;
      case 'fishing':  FishingEngine.start(node);               break;
      case 'legendary':LegendaryEncounterEngine.start(node);    break;
    }
  },

  // ── Complete a node, unlock its children ─────────────────────────────────
  completeNode(nodeIdx) {
    if (!GameState.completedNodes.includes(nodeIdx)) {
      GameState.completedNodes.push(nodeIdx);
      // Cumulative node counter — never resets between maps
      if (!GameState.stats) GameState.stats = {};
      GameState.stats.totalNodesCompleted = (GameState.stats.totalNodesCompleted || 0) + 1;
    }
    const node = GameState.map.find(n => n.idx === nodeIdx);
    if (node) {
      node.done = true;
      node.links.forEach(li => {
        const child = GameState.map[li];
        if (child) { child.unlocked = true; child.revealed = true; }
      });
      if ((node.row ?? 0) > (GameState.highWaterRow ?? -1)) {
        GameState.highWaterRow = node.row;
      }
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

// ── Wild battle trainer portrait — keyed by opponent type ────────────────────
// bug has two variants — chosen randomly for variety.
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
    let ci = 0;
    const iv = setInterval(() => {
      document.getElementById('dialogue-text').textContent += fluff[ci++];
      if (ci >= fluff.length) {
        clearInterval(iv);
        if (startBtn) { startBtn.style.display = ''; startBtn.textContent = 'Battle! ▶'; }
      }
    }, 30);

    this._isActive = true;
  },

  startBattle() {
    this._isActive = false;
    document.getElementById('trainer-intro').style.display = 'none';

    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.style.background = '';

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

const BattleEngine = {
  isBoss: false,
  state: null,

  async start(node) {
    this.isBoss = false;
    this._isTrainerBattle = false;
    // 60% chance of trainer battle — shows intro screen first
    if (Math.random() < 0.60) {
      TrainerBattleEngine.start(node);
      return;
    }

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
    // Keep spriteUrl as front-facing; store back sprite separately for battle only
    const backSprite = playerData.sprites?.back_default
                    || playerData.sprites?.front_default
                    || active.spriteUrl;
    active.backSpriteUrl = backSprite;

    hideLoading();
    setBattleBg(oppType, false);
    this._initBattle(active, opp, false);
  },

  _initBattle(playerPoke, oppPoke, isBoss) {
    this.isBoss             = isBoss;
    this._focusSashUsed     = false;
    this._chargeBonus       = 0;
    this._futureSightDmg    = 0;
    this._dragonDanceBonus  = 0;
    this._itemUsedThisTurn  = false;
    this._battleOver        = false;
    const activeDeck = playerPoke.deck || GameState.deck;
    this.state = {
      player: { ...playerPoke },
      opp:    { ...oppPoke },
      drawPile:    shuffle([...activeDeck]),
      hand:        [],
      discardPile: [],
      exhaustedPile: [],
      energy:      3,
      statusEffects: { player: [], opp: [] },
      shield: GameState.cookingShield || 0,
      oppAtkDebuff: 0,
      rainTurns: 0,
      leechTurns: 0,
      leechStacks: 0,
      oppSkipped: false,
      playerFlinch: false,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      cardsPlayedCount: 0,
      bonusEnergy: 0,
    };
    // Consume the cooking shield — one battle only
    if (GameState.cookingShield) {
      this._logPlayer(`🍽️ Brock's meal! ${GameState.cookingShield} dmg shield active!`);
      GameState.cookingShield = 0;
    }
    this._dealHand(5);
    this._render();
    showScreen('battle');
    this._logSystem(
      this._isTrainerBattle
        ? `Trainer sent out <b>${oppPoke.name}</b>!`
        : `A wild <b>${oppPoke.name}</b> appeared!`
    );
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
      typeBadge.textContent = st.opp.type;
      typeBadge.className   = `hud-type-badge type-${st.opp.type}`;
    }

    // Status effect badges on opponent
    const statusWrap = document.getElementById('opp-status-badges');
    if (statusWrap) {
      statusWrap.innerHTML = '';
      (st.statusEffects?.opp || []).forEach(s => {
        const b = document.createElement('span');
        b.className = `status-badge status-${s}`;
        b.textContent = STATUS_LABELS[s] || s;
        statusWrap.appendChild(b);
      });
      // Leech indicator
      if (st.leechTurns > 0) {
        const b = document.createElement('span');
        b.className = 'status-badge status-leech';
        b.textContent = `🌿${st.leechTurns}`;
        statusWrap.appendChild(b);
      }
      // Rain indicator
      if (st.rainTurns > 0) {
        const b = document.createElement('span');
        b.className = 'status-badge status-rain';
        b.textContent = `🌧${st.rainTurns}`;
        statusWrap.appendChild(b);
      }
    }

    // Player status badges
    const playerStatusWrap = document.getElementById('player-status-badges');
    if (playerStatusWrap) {
      playerStatusWrap.innerHTML = '';
      (st.statusEffects?.player || []).forEach(s => {
        const b = document.createElement('span');
        b.className = `status-badge status-${s}`;
        b.textContent = STATUS_LABELS[s] || s;
        playerStatusWrap.appendChild(b);
      });
    }

    // Sprites — player shows back, opponent shows front
    const ps = document.getElementById('player-sprite');
    const os = document.getElementById('opp-sprite');
    if (os) { os.style.visibility = ''; os.classList.remove('pokemon-faint'); }
    ps.src = st.player.backSpriteUrl || st.player.spriteUrl;
    os.src = st.opp.spriteUrl;

    // Piles
    document.getElementById('draw-count').textContent    = st.drawPile.length;
    document.getElementById('discard-count').textContent = st.discardPile.length;

    // Energy orbs
    const energyEl = document.getElementById('actions-left');
    if (energyEl) {
      const orbs = [0,1,2].map(i =>
        `<span class="energy-orb ${i < st.energy ? 'energy-orb-full' : 'energy-orb-empty'}"></span>`
      ).join('');
      energyEl.innerHTML = `<span class="energy-label">Energy</span>${orbs}`;
    }

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
    const oppType   = st.opp?.type || 'normal';
    const mult      = card.power > 0 ? getTypeMultiplier(card.type, oppType) : 1;
    const effLabel  = card.power > 0 ? typeEffectivenessLabel(mult) : null;
    const dispPower = card.power > 0 ? Math.round(card.power * mult) : 0;
    const cost      = card.cost ?? 1;
    const canAfford = st.energy >= cost;
    const disabled  = !canAfford;

    const el = document.createElement('div');
    el.className = 'card'
      + (disabled ? ' disabled' : '')
      + (mult >= 2 ? ' card-super' : mult === 0 || mult <= 0.5 ? ' card-weak' : '');
    el.dataset.type = card.type;

    const effBadge = effLabel
      ? `<div class="card-eff-badge" style="color:${effLabel.color}">${effLabel.text}</div>`
      : '';

    const powerDisplay = card.power > 0
      ? (mult !== 1
          ? `<span class="card-power-base">${card.power}</span> → <span style="color:${mult>=2?'#FFD700':mult===0?'#888':'#aaa'}">${dispPower}</span>`
          : `${card.power}`)
      : '✦';

    // Cost pip: 0=gold star, 1=white dot, 2=orange dots, 3=red dots
    const costColour = cost === 0 ? '#ffd700' : cost === 1 ? '#ccc' : cost === 2 ? '#ff9040' : '#ff4040';
    const costPips   = cost === 0
      ? `<span class="card-cost-pip" style="color:${costColour}">★</span>`
      : Array(cost).fill(`<span class="card-cost-pip" style="color:${costColour}">●</span>`).join('');

    el.innerHTML = `
      <div class="card-cost-row">${costPips}</div>
      <div class="card-icon">${card.icon}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-power">⚔ ${powerDisplay}</div>
      <div class="card-effect">${card.effect}</div>
      ${effBadge}
      ${card.exhaust ? `<div class="card-exhaust-badge">🔥 Once</div>` : ''}
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

    // Use Item button — grey out if already used this turn or no potions
    const itemBtn = document.getElementById('btn-use-item');
    if (itemBtn) {
      const hasPotions = ItemEngine.hasPotions();
      const used       = this._itemUsedThisTurn;
      itemBtn.disabled = used || !hasPotions;
      itemBtn.style.opacity = (used || !hasPotions) ? '0.4' : '1';
      itemBtn.textContent   = used ? '✓ Item Used' : '🎒 Item';
    }
  },

  // ── Logging helpers ─────────────────────────────────────────────────────────
  // Each helper targets the correct panel and formats numbers with colour spans.
  _logPlayer(html) { this._writeLog('player', html); },
  _logEnemy(html)  { this._writeLog('enemy',  html); },
  _logSystem(html) {
    // System messages flash briefly on the enemy row then fade — no permanent slot
    this._writeLog('enemy', `<span class="log-sys">${html}</span>`);
  },

  _writeLog(panel, html) {
    const isBoss  = this.isBoss;
    const msgId   = isBoss
      ? (panel === 'player' ? 'boss-log-player-msg' : 'boss-log-enemy-msg')
      : (panel === 'player' ? 'log-player-msg'      : 'log-enemy-msg');
    const rowId   = isBoss
      ? (panel === 'player' ? 'boss-log-player'     : 'boss-log-enemy')
      : (panel === 'player' ? 'log-player'          : 'log-enemy');
    const msgEl = document.getElementById(msgId);
    const rowEl = document.getElementById(rowId);
    if (!msgEl) return;
    msgEl.innerHTML = html;
    // Flash animation so the update is noticed even if text is similar
    if (rowEl) {
      rowEl.classList.remove('log-flash');
      void rowEl.offsetWidth;
      rowEl.classList.add('log-flash');
    }
  },

  // Legacy _log kept for any callers that haven't been updated — routes to system
  _log(msg) { this._logSystem(msg); },

  playCard(handIndex) {
    if (this._battleOver) return;
    const st   = this.state;
    const card = st.hand[handIndex];
    const cost = card.cost ?? 1;
    if (st.energy < cost) return;
    st.hand.splice(handIndex, 1);
    if (card.exhaust) {
      if (!st.exhaustedPile) st.exhaustedPile = [];
      st.exhaustedPile.push(card);
    } else {
      st.discardPile.push(card);
    }
    st.energy -= cost;
    st.cardsPlayedCount = (st.cardsPlayedCount || 0) + 1;
    this._applyCardEffect(card);
    if (this.isBoss) BossEngine._syncFromBattleState(st);
    this._checkDefeated();
  },

  _applyCardEffect(card) {
    const st         = this.state;
    const activePoke = GameState.party[GameState.activePokemonIndex];
    let dmg = card.power;

    // ── Type effectiveness ──
    const mult = dmg > 0 ? getTypeMultiplier(card.type, st.opp.type || 'normal') : 1;
    dmg = Math.round(dmg * mult);

    // ── Held item type booster (Charcoal, Mystic Water, etc.) ──
    if (dmg > 0) {
      const boost = ItemEngine.getTypeboost(activePoke, card.type);
      if (boost > 1) dmg = Math.round(dmg * boost);
    }

    // ── Mewtwo psychic mastery — all psychic cards deal 2× damage ──────────
    if (dmg > 0 && card.type === 'psychic' && activePoke?.isMewtwo) {
      dmg = Math.round(dmg * 2);
      this._logPlayer(`⚡ Mewtwo's psychic mastery! ×2!`);
    }

    // ── Misty's fishing lure buff — one battle, consumed on first use ──────
    if (dmg > 0 && GameState.fishingBuff?.type === card.type) {
      dmg = Math.round(dmg * GameState.fishingBuff.mult);
      this._logPlayer(`🎣 Misty's lure! ${card.type} +30%!`);
      GameState.fishingBuff = null;
      saveGame();
    }

    // Rain boost
    if (st.rainTurns > 0 && card.type === 'water') dmg = Math.round(dmg * 1.2);

    // Charge bonus (Charge card, Calm Mind)
    if (dmg > 0 && this._chargeBonus > 0) {
      dmg = Math.round(dmg * (1 + this._chargeBonus));
      this._chargeBonus = 0;
    }

    // Dragon Dance accumulated bonus
    if (dmg > 0 && this._dragonDanceBonus > 0) {
      dmg = Math.round(dmg * (1 + this._dragonDanceBonus));
    }

    // Crit
    let crit = false;
    if (card.special === 'high_crit' && Math.random() < .3) crit = true;
    if (card.special === 'always_crit') crit = true;
    if (crit) dmg = Math.round(dmg * 1.5);

    if (dmg > 0) {
      st.opp.hp = Math.max(0, st.opp.hp - dmg);
      st.totalDamageDealt = (st.totalDamageDealt || 0) + dmg;
      const playerSpriteId = this.isBoss ? 'boss-player-sprite' : 'player-sprite';
      const oppSpriteId    = this.isBoss ? 'boss-opp-sprite'    : 'opp-sprite';
      applyHitAnimation(playerSpriteId, oppSpriteId, card.type);

      // Shell Bell — heal on dealing damage
      const bellMsg = ItemEngine.checkShellBell(st, this);
      if (bellMsg) setTimeout(() => this._logPlayer(bellMsg), 300);

      const effStr = logEff(mult);
      let logHtml = crit
        ? `${card.icon || ''} <b>${card.name}!</b> Critical hit! ${logDmgDealt(dmg)} dmg!${effStr}`
        : `${card.icon || ''} <b>${card.name}!</b> ${logDmgDealt(dmg)} dmg!${effStr}`;
      this._logPlayer(logHtml);
    } else if (dmg === 0 && card.power > 0) {
      this._logPlayer(`${card.icon || ''} <b>${card.name}</b> had no effect!`);
    }

    switch (card.special) {
      case 'heal_10':       st.player.hp = Math.min(st.player.maxHp, st.player.hp + 10);
                            this._logPlayer(`${card.name}! Healed 10 HP!`); break;
      case 'mega_drain':    st.player.hp = Math.min(st.player.maxHp, st.player.hp + 20);
                            this._logPlayer(`${card.name}! Dealt damage + healed 20 HP!`); break;
      case 'roost':         st.player.hp = Math.min(st.player.maxHp, st.player.hp + 35);
                            this._logPlayer(`${card.name}! Healed 35 HP!`); break;
      case 'heal_25_draw':  st.player.hp = Math.min(st.player.maxHp, st.player.hp + 35);
                            this._dealHand(1);
                            this._logPlayer(`${card.name}! Healed 35 HP + drew a card!`); break;
      case 'draw_1':        this._dealHand(1); this._logPlayer(`${card.name}! Drew a card!`); break;
      case 'growl_draw':    st.oppAtkDebuff += 10; this._dealHand(1);
                            this._logPlayer(`${card.name}! Opp ATK fell + drew a card!`); break;
      case 'leer_free':     st.oppAtkDebuff += 5;
                            this._logPlayer(`${card.name}! Opp DEF fell!`); break;
      case 'string_shot':   st.oppSkipped = false; st.oppAtkDebuff += 5; this._dealHand(1);
                            this._logPlayer(`${card.name}! Opp slowed + drew a card!`); break;
      case 'metronome':     this._dealHand(2); this._logPlayer(`${card.name}! Drew 2 cards!`); break;
      case 'shield_draw':   st.shield += 45; this._dealHand(1);
                            this._logPlayer(`Shell Armor! Blocked 45 dmg + drew a card!`); break;
      case 'shield_35':     st.shield += 30; this._logPlayer(`${card.name}! Blocked 30 dmg next hit!`); break;
      case 'iron_defense':  st.shield += 50; this._logPlayer(`${card.name}! Blocked 50 dmg next hit!`); break;
      case 'debuff_atk':    st.oppAtkDebuff += 10; this._logPlayer(`${st.opp.name}'s ATK fell!`); break;
      case 'debuff_acc':    st.oppAtkDebuff += 8;  this._logPlayer(`${st.opp.name}'s accuracy fell!`); break;
      case 'debuff_def':    if(Math.random()<.35){ st.oppAtkDebuff += 5; this._logPlayer(`${st.opp.name}'s DEF fell!`); } break;
      case 'skip_opp':      st.oppSkipped = true; this._logPlayer(`${st.opp.name} fell asleep!`); break;
      case 'slow_opp':      st.oppSkipped = true; this._logPlayer(`${st.opp.name} is slowed!`); break;
      case 'burn_chance':   if (Math.random()<.15){ addStatus(st,'opp','burn'); this._logPlayer(`${st.opp.name} is burned!`); } break;
      case 'burn':          addStatus(st,'opp','burn'); this._logPlayer(`${st.opp.name} is burning!`); break;
      case 'paralyse':      addStatus(st,'opp','para'); this._logPlayer(`${st.opp.name} is paralysed!`); break;
      case 'para_chance':   if(Math.random()<.2){ addStatus(st,'opp','para'); this._logPlayer(`${st.opp.name} is paralysed!`); } break;
      case 'poison':        addStatus(st,'opp','poison'); this._logPlayer(`${st.opp.name} is poisoned!`); break;
      case 'leech':         st.leechStacks++; st.leechTurns = 3; this._logPlayer(`Leech Seed latched!`); break;
      case 'flinch':        if(Math.random()<.25){ st.oppSkipped = true; this._logPlayer(`${st.opp.name} flinched!`); } break;
      case 'rain':          st.rainTurns = 3; this._logPlayer(`It started to rain!`); break;
      case 'recoil_15':     st.player.hp = Math.max(1, st.player.hp - 15);
                            this._logPlayer(`${card.name}! Recoil 15 HP!`); break;
      case 'close_combat':  st.player.hp = Math.max(1, st.player.hp - 25);
                            this._logPlayer(`${card.name}! Recoil 25 HP!`); break;
      case 'overheat':      st.player.hp = Math.max(1, st.player.hp - 25);
                            this._logPlayer(`${card.name}! Recoil 25 HP!`); break;
      case 'discharge':     st.player.hp = Math.max(1, st.player.hp - 15);
                            this._logPlayer(`${card.name}! 15 self damage!`); break;
      case 'always_crit':   break; // handled in crit block above
      case 'high_crit':     break;
      case 'flame_charge':  st.bonusEnergy = (st.bonusEnergy || 0) + 1;
                            this._logPlayer(`${card.name}! +1 energy next turn!`); break;
      case 'agility':       st.energy = Math.min(3, st.energy + 1); this._dealHand(1);
                            this._logPlayer(`Agility! +1 energy + drew a card!`); break;
      case 'charge':        this._chargeBonus = 0.5;
                            this._logPlayer(`Charged up! Next electric move +50%!`); break;
      case 'bonus_action':  st.energy = Math.min(3, st.energy + 1);
                            this._logPlayer(`Gained +1 energy!`); break;
      case 'psyshock':      // pierces shield — already dealt as normal dmg ignoring shield
                            this._logPlayer(`${card.name}! Pierced the shield!`); break;
      case 'calm_mind':     this._chargeBonus = 0.3;
                            this._logPlayer(`${card.name}! Next move +30% dmg!`); break;
      case 'future_sight':  this._futureSightDmg = 70;
                            this._logPlayer(`${card.name}! Attack incoming next turn!`); break;
      case 'stealth_rock':  st.stealthRock = 3;
                            this._logPlayer(`Stealth Rock floats in the air!`); break;
      case 'hail':          st.hailTurns = 3;
                            this._logPlayer(`Hail started! Opp takes 12/turn!`); break;
      case 'venoshock':     if(hasStatus(st,'opp','poison')){ st.opp.hp = Math.max(0, st.opp.hp - dmg); this._logPlayer(`Venoshock doubled on poisoned target!`); } break;
      case 'night_shade':   { const nsDmg = st.opp.level || 10; st.opp.hp = Math.max(0, st.opp.hp - nsDmg); this._logPlayer(`${card.name}! ${nsDmg} dmg!`); } break;
      case 'curse':         st.opp.curseTurns = 2; st.player.hp = Math.max(1, st.player.hp - 10);
                            this._logPlayer(`${card.name}! Opp cursed, you paid 10 HP!`); break;
      case 'dragon_dance':  this._dragonDanceBonus = (this._dragonDanceBonus || 0) + 0.2;
                            this._logPlayer(`${card.name}! Attack +20% this battle!`); break;
      case 'taunt':         st.oppTauntTurns = 2;
                            this._logPlayer(`${card.name}! Opp can only use damaging moves!`); break;
      case 'misty_terrain': st.statusEffects.player = [];
                            this._logPlayer(`${card.name}! All status effects cleared!`); break;
      case 'focus_punch':   // handled in damage section — miss if hit same turn
                            break;
      case 'spore':         st.oppSkipped = true; this._dealHand(1);
                            this._logPlayer(`Spore! Opp fell asleep + drew a card!`); break;
    }

    // Oran Berry mid-battle check after taking/dealing damage
    const berryMsg = ItemEngine.checkBerryMidBattle(st, 'player', this.isBoss);
    if (berryMsg) setTimeout(() => this._logPlayer(berryMsg), 500);

    this._render();
  },

  endTurn() {
    if (this._battleOver) return;
    const st = this.state;

    // ── End Turn warning — no energy spent ───────────────────────────────
    if (st.energy === 3) {
      const btn = document.getElementById('btn-end-turn');
      if (btn && !btn.dataset.warned) {
        btn.dataset.warned = '1';
        btn.textContent    = 'No cards played! Sure? ▶';
        btn.classList.add('btn-end-turn-warn');
        setTimeout(() => {
          btn.dataset.warned = '';
          btn.textContent    = 'End Turn ▶';
          btn.classList.remove('btn-end-turn-warn');
        }, 1800);
        return; // require second press
      }
      btn.dataset.warned = '';
      btn.textContent    = 'End Turn ▶';
      btn.classList.remove('btn-end-turn-warn');
    }

    // Discard remaining hand
    st.discardPile.push(...st.hand);
    st.hand = [];

    // Opponent turn
    if (!st.oppSkipped) {
      this._oppAttack();
    } else {
      this._logEnemy(`${st.opp.name} couldn't move!`);
      st.oppSkipped = false;
    }

    // Future Sight delayed damage
    if (this._futureSightDmg > 0) {
      st.opp.hp = Math.max(0, st.opp.hp - this._futureSightDmg);
      this._logPlayer(`Future Sight strikes for ${logDmgDealt(this._futureSightDmg)} dmg!`);
      this._futureSightDmg = 0;
    }

    // Stealth Rock chip damage
    if (st.stealthRock > 0) {
      st.opp.hp = Math.max(0, st.opp.hp - 15);
      st.stealthRock--;
      this._logPlayer(`Stealth Rock chip! ${logDmgDealt(15)} dmg`);
    }

    // Hail chip damage
    if (st.hailTurns > 0) {
      st.opp.hp = Math.max(0, st.opp.hp - 12);
      st.hailTurns--;
      this._logPlayer(`Hail chips ${st.opp.name} for ${logDmgDealt(12)}!`);
    }

    // Curse damage
    if (st.opp.curseTurns > 0) {
      st.opp.hp = Math.max(0, st.opp.hp - 20);
      st.opp.curseTurns--;
      this._logPlayer(`Curse drains ${st.opp.name} for ${logDmgDealt(20)}!`);
    }

    // Status ticks
    ['burn','poison'].forEach(s => {
      if (hasStatus(st, 'opp', s)) {
        const dmg = s === 'burn' ? 10 : 15;
        st.opp.hp = Math.max(0, st.opp.hp - dmg);
        this._logPlayer(`${st.opp.name} is hurt by ${s}! (${logDmgDealt(dmg)})`);
      }
    });
    if (hasStatus(st, 'player', 'burn'))   { st.player.hp = Math.max(0, st.player.hp - 10);  this._logEnemy(`${st.player.name} is burned! (${logDmgTaken(10)} HP)`); }
    if (hasStatus(st, 'player', 'poison')) { st.player.hp = Math.max(0, st.player.hp - 15);  this._logEnemy(`${st.player.name} is hurt by poison! (${logDmgTaken(15)} HP)`); }

    // Leech
    if (st.leechTurns > 0) {
      const drain = 15 * st.leechStacks;
      st.opp.hp    = Math.max(0, st.opp.hp - drain);
      st.player.hp = Math.min(st.player.maxHp, st.player.hp + Math.floor(drain/2));
      st.leechTurns--;
      this._logPlayer(`Leech Seed drained ${logDmgDealt(drain)} HP from ${st.opp.name}!`);
    }

    // Weather countdowns
    if (st.rainTurns > 0)  st.rainTurns--;
    if (st.oppTauntTurns > 0) st.oppTauntTurns--;

    // Debuff decay
    if (st.oppAtkDebuff > 0) st.oppAtkDebuff = Math.max(0, st.oppAtkDebuff - 5);

    // Check defeats
    if (this._checkDefeated()) return;

    // New turn — restore energy + reset item use
    st.energy = 3 + (st.bonusEnergy || 0);
    st.bonusEnergy = 0;
    if (st.energy > 3) st.energy = Math.min(5, st.energy);
    st.shield = 0;
    this._chargeBonus = 0;
    this._itemUsedThisTurn = false;

    // Leftovers
    const leftoversMsg = ItemEngine.checkLeftovers(st);
    if (leftoversMsg) this._logPlayer(leftoversMsg);

    this._dealHand(5);
    this._render();
    // 'Your turn' message removed — energy orbs show state
  },

  _oppAttack() {
    const st = this.state;
    if (hasStatus(st, 'opp', 'para') && Math.random() < .4) {
      this._logEnemy(`${st.opp.name} is paralysed and can't move!`);
      return;
    }

    // Pick a move from the opponent's moveset (assigned at creation)
    const movePool = st.opp.moves || OPPONENT_MOVES[st.opp.type] || OPPONENT_MOVES.normal;
    const move     = movePool[Math.floor(Math.random() * movePool.length)];

    // Level-scaled base power
    const levelBonus = Math.floor(st.opp.level * 1.2);
    let power = move.power > 0 ? move.power + levelBonus : 0;

    // Type effectiveness of opponent move vs player's type
    const mult    = power > 0 ? getTypeMultiplier(st.opp.type || 'normal', st.player.type || 'normal') : 1;
    power         = Math.round(power * mult);

    // Apply debuff and shield
    const debuffed = Math.max(0, power - st.oppAtkDebuff);
    const blocked  = Math.max(0, debuffed - st.shield);

    // Apply effect (10% chance)
    if (move.effect && Math.random() < 0.15) {
      if (move.effect === 'burn_chance')    addStatus(st, 'player', 'burn');
      if (move.effect === 'para_chance')    addStatus(st, 'player', 'para');
      if (move.effect === 'poison_chance')  addStatus(st, 'player', 'poison');
      if (move.effect === 'debuff_atk')     st.oppAtkDebuff = Math.max(st.oppAtkDebuff - 5, 0); // debuff opp instead
    }

    const playerSpriteId = this.isBoss ? 'boss-player-sprite' : 'player-sprite';
    const oppSpriteId    = this.isBoss ? 'boss-opp-sprite'    : 'opp-sprite';

    if (blocked > 0) {
      st.player.hp = Math.max(0, st.player.hp - blocked);
      st.totalDamageTaken = (st.totalDamageTaken || 0) + blocked;
      applyHitAnimation(oppSpriteId, playerSpriteId, st.opp.type || 'normal');

      const effStr = logEff(mult);
      let logHtml = `<b>${st.opp.name}</b> used ${move.name}! ${logDmgTaken(blocked)} dmg!`;
      if (st.shield > 0) logHtml += ' <span class="log-shield">(shield)</span>';
      logHtml += effStr;
      this._logEnemy(logHtml);

      // Oran Berry — check after taking damage
      const berryMsg = ItemEngine.checkBerryMidBattle(st, 'player', this.isBoss);
      if (berryMsg) setTimeout(() => this._logPlayer(berryMsg), 400);
    } else if (move.power > 0) {
      applyHitAnimation(oppSpriteId, playerSpriteId, st.opp.type || 'normal');
      this._logEnemy(`<b>${st.opp.name}</b> used ${move.name}! <span class="log-shield">Blocked!</span>`);
    } else {
      this._logEnemy(`<b>${st.opp.name}</b> used ${move.name}!`);
    }
  },

  _checkDefeated() {
    const st = this.state;

    if (st.opp.hp <= 0) {
      this._battleOver = true;

      // Type matchup comment in battle log
      const playerType = st.player.type || 'normal';
      const oppType    = st.opp.type    || 'normal';
      const mult       = getTypeMultiplier(playerType, oppType);
      const matchupLog =
        mult >= 2  ? `⚡ Type advantage! ${st.player.name}'s ${playerType} was super effective!` :
        mult === 0 || mult < 1 ? `💪 ${st.player.name} overcame the type disadvantage — impressive!` :
                    `⚔️ A fair fight. Your cards made the difference.`;
      this._logSystem(matchupLog);
      this._logSystem(`⭐ ${st.opp.name} fainted! You win!`);

      // Faint animation on opponent sprite — class stays on to preserve forwards fill,
      // then hide the element so it never snaps back to visible
      const oppSpriteEl = document.getElementById(this.isBoss ? 'boss-opp-sprite' : 'opp-sprite');
      if (oppSpriteEl) {
        oppSpriteEl.classList.add('pokemon-faint');
        setTimeout(() => { oppSpriteEl.style.visibility = 'hidden'; }, 700);
      }

      // Pass matchup tier to victory for fluff text
      this._lastMatchupMult = mult;
      setTimeout(() => this._victory(), 1400);
      return true;
    }
    if (st.player.hp <= 0) {
      const activeIdx = GameState.activePokemonIndex;

      // Focus Sash — survive with 1 HP
      if (ItemEngine.checkFocusSash(st, 'player', this)) {
        this._logPlayer(`🎗 Focus Sash! ${st.player.name} held on with 1 HP!`);
        this._render();
        return false;
      }

      // Revive Potion — prevent faint
      if (ItemEngine.checkRevive(activeIdx)) {
        st.player.hp = GameState.party[activeIdx].hp; // sync restored HP
        this._logPlayer(`🧪 Revive Potion! ${st.player.name} was revived!`);
        this._render();
        return false;
      }

      GameState.party[activeIdx].hp = 0;
      this._logSystem(`💔 ${st.player.name} fainted!`);
      const next = GameState.party.findIndex((p, i) => i !== activeIdx && p.hp > 0);
      if (next >= 0) {
        setTimeout(() => {
          GameState.activePokemonIndex = next;
          const p = GameState.party[next];
          const newDeck = p.deck || GameState.deck;
          GameState.deck = newDeck;
          st.drawPile = shuffle([...newDeck]);
          st.hand = [];
          st.discardPile = [];
          st.player = { ...p };
          this._dealHand(5);
          this._logSystem(`Go, ${p.name}!`);
          this._render();
          fetchPoke(p.id).then(d => {
            const back = d.sprites?.back_default || d.sprites?.front_default || p.spriteUrl;
            st.player.backSpriteUrl = back;
            GameState.party[next].backSpriteUrl = back;
            this._render();
          });
        }, 1000);
      } else {
        this._battleOver = true;
        setTimeout(() => this._defeat(), 1200);
      }
      return true;
    }
    return false;
  },

  _victory() {
    GameState.party[GameState.activePokemonIndex].hp = this.state.player.hp;
    if (!GameState.stats) GameState.stats = {};
    GameState.stats.battlesWon          = (GameState.stats.battlesWon       || 0) + 1;
    GameState.stats.totalBattlesWon     = (GameState.stats.totalBattlesWon  || 0) + 1;
    const activePoke = GameState.party[GameState.activePokemonIndex];
    activePoke.battlesWon = (activePoke.battlesWon || 0) + 1;

    const opp = this.state.opp;
    registerPokedex(opp.id, opp.name, opp.spriteUrl, false);

    // Trainer battle — delegate to TrainerBattleEngine which handles
    // multi-Pokémon flow, gold accumulation, and completion.
    if (this._isTrainerBattle) {
      TrainerBattleEngine.onPokemonDefeated();
      return;
    }

    const earned = goldForWildBattle();
    GameState.gold = (GameState.gold || 0) + earned;
    ItemEngine.checkPassive();
    MapEngine.completeNode(GameState.currentNodeIndex);

    // Level up all living party members; handle any triggered evolutions
    const evolutions = levelUpParty('battle');
    if (evolutions.length > 0) {
      saveGame();
      runEvolutions(evolutions, () => CardReward.show(earned));
    } else {
      CardReward.show(earned);
    }
  },

  _defeat() {
    deleteSave();
    GameOver.show(`the wild ${this.state.opp.name}`);
  },

  switchPokemon(idx) {
    const st = this.state;
    if (st.energy < 2) {
      this._logSystem(`Not enough energy to switch!`);
      return;
    }
    GameState.party[GameState.activePokemonIndex].hp = st.player.hp;
    GameState.activePokemonIndex = idx;
    const newPoke = GameState.party[idx];
    const newDeck = newPoke.deck || GameState.deck;
    GameState.deck = newDeck;
    st.discardPile.push(...st.hand);
    st.hand = [];
    st.drawPile = shuffle([...newDeck]);
    st.discardPile = [];
    st.player = { ...newPoke };
    st.energy -= 2;
    fetchPoke(newPoke.id).then(d => {
      const back = d.sprites?.back_default || d.sprites?.front_default || newPoke.spriteUrl;
      st.player.backSpriteUrl = back;
      GameState.party[idx].backSpriteUrl = back;
      this._render();
    });
    this._dealHand(5);
    this._logSystem(`Go, ${newPoke.name}!`);
    this._render();
  },
};

// ─── BOSS INTRO BACKGROUNDS ──────────────────────────────────────────────────
// Full-portrait backgrounds shown during trainer introduction only.
// Naming: assets/bg_N_boss.png  (N = bossIndex 0-12)
// If the file doesn't exist the GYM_FALLBACKS gradient is used instead.
const BOSS_INTRO_BACKGROUNDS = [
  'assets/bg_0_boss.png',   // Brock
  'assets/bg_1_boss.png',   // Misty
  'assets/bg_2_boss.png',   // Lt. Surge
  'assets/bg_3_boss.png',   // Erika
  'assets/bg_4_boss.png',   // Koga
  'assets/bg_5_boss.png',   // Sabrina
  'assets/bg_6_boss.png',   // Blaine
  'assets/bg_7_boss.png',   // Giovanni
  'assets/bg_8_boss.png',   // Lorelei
  'assets/bg_9_boss.png',   // Bruno
  'assets/bg_10_boss.png',  // Agatha
  'assets/bg_11_boss.png',  // Lance
  'assets/bg_12_boss.png',  // Blue
];

function setBossIntroBg(bossIdx) {
  const src      = BOSS_INTRO_BACKGROUNDS[Math.min(bossIdx, BOSS_INTRO_BACKGROUNDS.length - 1)];
  const fallback = GYM_FALLBACKS[Math.min(bossIdx, GYM_FALLBACKS.length - 1)];
  const bgEl     = document.querySelector('#screen-boss .battle-bg');
  const imgEl    = document.querySelector('#screen-boss .battle-bg-img');
  if (!bgEl || !imgEl) return;

  // Enter intro mode — full-portrait cover image
  bgEl.classList.add('boss-intro-mode');
  bgEl.style.background = fallback;   // fallback gradient on the container

  imgEl.style.opacity = '0';          // hide until loaded
  imgEl.onload  = () => { imgEl.style.opacity = '1'; bgEl.style.background = ''; };
  imgEl.onerror = () => { imgEl.style.opacity = '0'; /* keep fallback gradient */ };
  imgEl.src = src;
}

function clearBossIntroBg(firstOppType) {
  const bgEl = document.querySelector('#screen-boss .battle-bg');
  if (bgEl) bgEl.classList.remove('boss-intro-mode');
  // Restore the type-based battle background for the actual fight
  setBattleBg(firstOppType, true);
}


const BossEngine = {
  bossData: null,
  oppTeam:  [],
  oppIdx:   0,
  bState:   null,

  async start(node) {
    showLoading();
    const bossIdx = Math.min(
      node?.bossIndex ?? GameState.bossesDefeated,
      BOSS_TRAINERS.length - 1
    );
    const boss = BOSS_TRAINERS[bossIdx];
    this.bossData    = boss;
    this.oppIdx      = 0;
    this.oppTeam     = [];
    this._isRocket   = false;  // always clear — Rocket sets it separately

    for (const id of boss.team) {
      try {
        const d = await fetchPoke(id);
        if (!d) continue;
        const level = 14 + bossIdx * 7 + Math.floor(Math.random() * 4);
        const pType = d.types?.[0]?.type?.name || 'normal';
        this.oppTeam.push(makePokemon(id, level, getSpriteUrl(d, true), capitalize(d.name), pType));
      } catch(e) {
        console.warn(`BossEngine: fetchPoke failed for id ${id}:`, e);
        const level = 14 + bossIdx * 7;
        this.oppTeam.push(makePokemon(id, level, '', `Pokémon #${id}`, 'normal'));
      }
    }
    hideLoading();

    // Show gym-specific intro background (full portrait) during trainer dialogue
    const firstOppType = this.oppTeam[0]?.type || 'normal';
    this._firstOppType = firstOppType;   // stored so startBattle can restore it
    setBossIntroBg(bossIdx);
    showScreen('boss');

    const trainerSpriteWrap = document.querySelector('.trainer-sprite-wrap');
    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (trainerImg && trainerSpriteWrap) {
      trainerImg.onerror = function() {
        this.onerror = () => {
          trainerSpriteWrap.innerHTML = `<div style="font-size:5rem;line-height:1">🧢</div>`;
        };
        this.src = 'assets/trainer_boss.png';
      };
      trainerImg.src = `assets/${boss.image}`;
    }

    document.getElementById('dialogue-name').textContent = `${boss.name} — ${boss.title}`;
    document.getElementById('dialogue-text').textContent  = boss.dialogue;

    const introEl  = document.getElementById('trainer-intro');
    const battleEl = document.getElementById('boss-battle-area');
    if (introEl)  introEl.style.display  = 'flex';
    if (battleEl) battleEl.style.display = 'none';

    document.getElementById('boss-party-bar').innerHTML = this.oppTeam.map((_,i)=>
      `<div class="boss-poke-pip" id="boss-pip-${i}"></div>`).join('');
  },

  startBattle() {
    document.getElementById('trainer-intro').style.display   = 'none';
    document.getElementById('boss-battle-area').style.display = 'block';
    // Swap from full-portrait intro bg to type-based battle bg
    clearBossIntroBg(this._firstOppType || 'normal');
    this._loadNextOpp();
  },

  _loadNextOpp() {
    const opp    = this.oppTeam[this.oppIdx];
    const player = GameState.party[GameState.activePokemonIndex];
    if (!opp || !player) {
      console.error('BossEngine._loadNextOpp: missing opp or player', { opp, player, oppIdx: this.oppIdx, team: this.oppTeam });
      return;
    }
    // Clear wild-battle flags that bleed across opponents if not reset here
    BattleEngine._battleOver       = false;
    BattleEngine._itemUsedThisTurn = false;
    this._isOver                   = false;
    const activeDeck = player.deck || GameState.deck;
    this.bState = {
      player: { ...player },
      opp:    { ...opp },
      drawPile: shuffle([...activeDeck]),
      hand: [], discardPile: [], exhaustedPile: [],
      energy: 3,
      statusEffects: { player: [], opp: [] },
      shield: 0, oppAtkDebuff: 0, rainTurns: 0,
      leechTurns: 0, leechStacks: 0, oppSkipped: false,
      bonusEnergy: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      cardsPlayedCount: 0,
    };
    BattleEngine._dealHand.call({ state: this.bState }, 5);
    this._render();
    this._logEnemy(`${this.bossData.name} sends ${opp.name}!`);
    // Fetch back sprite for player (non-blocking)
    if (!player.backSpriteUrl) {
      fetchPoke(player.id).then(d => {
        const back = d.sprites?.back_default || d.sprites?.front_default || player.spriteUrl;
        this.bState.player.backSpriteUrl = back;
        GameState.party[GameState.activePokemonIndex].backSpriteUrl = back;
        this._render();
      });
    }
  },

  _render() {
    const st = this.bState;
    setHpBar('boss-opp',    st.opp.hp,    st.opp.maxHp,    st.opp.name,    st.opp.level);
    setHpBar('boss-player', st.player.hp, st.player.maxHp, st.player.name, st.player.level);

    const bossTypeBadge = document.getElementById('boss-opp-type-badge');
    if (bossTypeBadge && st.opp.type) {
      bossTypeBadge.textContent = st.opp.type;
      bossTypeBadge.className   = `hud-type-badge type-${st.opp.type}`;
    }

    // Status badges — boss screen
    const bossStatus = document.getElementById('boss-opp-status-badges');
    if (bossStatus) {
      bossStatus.innerHTML = '';
      (st.statusEffects?.opp || []).forEach(s => {
        const b = document.createElement('span');
        b.className = `status-badge status-${s}`;
        b.textContent = STATUS_LABELS[s] || s;
        bossStatus.appendChild(b);
      });
    }

    const bossOppSprite = document.getElementById('boss-opp-sprite');
    if (bossOppSprite) {
      bossOppSprite.style.visibility = '';
      bossOppSprite.classList.remove('pokemon-faint');
    }
    document.getElementById('boss-opp-sprite').src    = st.opp.spriteUrl;
    document.getElementById('boss-player-sprite').src = st.player.backSpriteUrl || st.player.spriteUrl;

    document.getElementById('boss-draw-count').textContent    = st.drawPile.length;
    document.getElementById('boss-discard-count').textContent = st.discardPile.length;
    const bossEnergyEl = document.getElementById('boss-actions-left');
    if (bossEnergyEl) {
      const orbs = [0,1,2].map(i =>
        `<span class="energy-orb ${i < st.energy ? 'energy-orb-full' : 'energy-orb-empty'}"></span>`
      ).join('');
      bossEnergyEl.innerHTML = `<span class="energy-label">Energy</span>${orbs}`;
    }

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

    // Boss item button state
    const bossItemBtn = document.getElementById('btn-boss-use-item');
    if (bossItemBtn) {
      const hasPotions = ItemEngine.hasPotions();
      const used       = BattleEngine._itemUsedThisTurn;
      bossItemBtn.disabled = used || !hasPotions;
      bossItemBtn.style.opacity = (used || !hasPotions) ? '0.4' : '1';
      bossItemBtn.textContent   = used ? '✓ Item Used' : '🎒 Item';
    }
  },

  _log(msg)       { BattleEngine._writeLog.call({ isBoss: true }, 'enemy',  `<span class="log-sys">${msg}</span>`); },
  _logPlayer(html){ BattleEngine._writeLog.call({ isBoss: true }, 'player', html); },
  _logEnemy(html) { BattleEngine._writeLog.call({ isBoss: true }, 'enemy',  html); },
  _logSystem(html){ BattleEngine._writeLog.call({ isBoss: true }, 'enemy',  `<span class="log-sys">${html}</span>`); },

  playCard(idx) {
    const st   = this.bState;
    const card = st.hand[idx];
    const cost = card.cost ?? 1;
    if (st.energy < cost) return;
    st.hand.splice(idx, 1);
    if (card.exhaust) {
      if (!st.exhaustedPile) st.exhaustedPile = [];
      st.exhaustedPile.push(card);
    } else {
      st.discardPile.push(card);
    }
    st.energy -= cost;
    BattleEngine._applyCardEffect.call({
      state: st, isBoss: true,
      _writeLog:     (panel, html) => BattleEngine._writeLog.call({ isBoss: true }, panel, html),
      _log:          (m)    => BattleEngine._writeLog.call({ isBoss: true }, 'enemy', `<span class="log-sys">${m}</span>`),
      _logPlayer:    (html) => BattleEngine._writeLog.call({ isBoss: true }, 'player', html),
      _logEnemy:     (html) => BattleEngine._writeLog.call({ isBoss: true }, 'enemy',  html),
      _logSystem:    (html) => BattleEngine._writeLog.call({ isBoss: true }, 'enemy', `<span class="log-sys">${html}</span>`),
      _render:       ()     => this._render(),
      _checkDefeated:()     => false,
      _dealHand:     (n)    => BattleEngine._dealHand.call({ state: st }, n),
      _chargeBonus:  0, _futureSightDmg: 0, _dragonDanceBonus: 0,
    }, card);
    const defeated = this._checkDefeated();
    if (!defeated) this._render();  // skip render when opp fainted — animation needs to complete first
  },

  endTurn() {
    const st = this.bState;

    // End Turn warning — no energy spent
    if (st.energy === 3) {
      const btn = document.getElementById('btn-boss-end-turn');
      if (btn && !btn.dataset.warned) {
        btn.dataset.warned = '1';
        btn.textContent    = 'No cards played! Sure? ▶';
        btn.classList.add('btn-end-turn-warn');
        setTimeout(() => {
          btn.dataset.warned = '';
          btn.textContent    = 'End Turn ▶';
          btn.classList.remove('btn-end-turn-warn');
        }, 1800);
        return;
      }
      if (btn) { btn.dataset.warned = ''; btn.textContent = 'End Turn ▶'; btn.classList.remove('btn-end-turn-warn'); }
    }

    st.discardPile.push(...st.hand);
    st.hand = [];

    BattleEngine._oppAttack.call({
      state: st, isBoss: true,
      _writeLog:  (panel, html) => BattleEngine._writeLog.call({ isBoss: true }, panel, html),
      _log:       (m)    => BattleEngine._writeLog.call({ isBoss: true }, 'enemy', `<span class="log-sys">${m}</span>`),
      _logPlayer: (html) => BattleEngine._writeLog.call({ isBoss: true }, 'player', html),
      _logEnemy:  (html) => BattleEngine._writeLog.call({ isBoss: true }, 'enemy',  html),
      _logSystem: (html) => BattleEngine._writeLog.call({ isBoss: true }, 'enemy', `<span class="log-sys">${html}</span>`),
      _render:    ()     => this._render(),
    });

    // Status ticks
    ['burn','poison'].forEach(s => {
      if (hasStatus(st, 'opp', s)) {
        const dmg = s === 'burn' ? 10 : 15;
        st.opp.hp = Math.max(0, st.opp.hp - dmg);
        this._logPlayer(`${st.opp.name} is hurt by ${s}! (${logDmgDealt(dmg)})`);
      }
    });
    if (hasStatus(st, 'player', 'burn'))   { st.player.hp = Math.max(0, st.player.hp - 10); this._logEnemy(`${st.player.name} is burned! (${logDmgTaken(10)} HP)`); }
    if (hasStatus(st, 'player', 'poison')) { st.player.hp = Math.max(0, st.player.hp - 15); this._logEnemy(`${st.player.name} is poisoned! (${logDmgTaken(15)} HP)`); }

    if (st.leechTurns > 0) {
      const drain = 15 * st.leechStacks;
      st.opp.hp    = Math.max(0, st.opp.hp - drain);
      st.player.hp = Math.min(st.player.maxHp, st.player.hp + Math.floor(drain/2));
      st.leechTurns--;
      this._logPlayer(`Leech Seed drained ${logDmgDealt(drain)} HP!`);
    }
    if (st.rainTurns > 0)  st.rainTurns--;
    if (st.hailTurns > 0)  { st.opp.hp = Math.max(0, st.opp.hp - 12); st.hailTurns--; }
    if (st.stealthRock > 0){ st.opp.hp = Math.max(0, st.opp.hp - 15); st.stealthRock--; }
    if (st.opp.curseTurns > 0){ st.opp.hp = Math.max(0, st.opp.hp - 20); st.opp.curseTurns--; }
    if (st.oppAtkDebuff > 0) st.oppAtkDebuff = Math.max(0, st.oppAtkDebuff - 5);

    if (this._checkDefeated()) return;

    // Reset per-turn flags for the new player turn — mirrors BattleEngine._startPlayerTurn
    BattleEngine._itemUsedThisTurn = false;
    st.energy = 3 + (st.bonusEnergy || 0);
    st.bonusEnergy = 0;
    if (st.energy > 5) st.energy = 5;
    st.shield = 0;

    BattleEngine._dealHand.call({ state: st }, 5);
    this._render();
    // 'Your turn' message removed — energy orbs show state
  },

  switchPokemon(idx) {
    const st = this.bState;
    if (st.energy < 2) { this._logSystem(`Not enough energy to switch!`); return; }
    GameState.party[GameState.activePokemonIndex].hp = st.player.hp;
    GameState.activePokemonIndex = idx;
    const newPoke = GameState.party[idx];
    const newDeck = newPoke.deck || GameState.deck;
    GameState.deck = newDeck;
    st.discardPile.push(...st.hand);
    st.hand = [];
    st.drawPile  = shuffle([...newDeck]);
    st.discardPile = [];
    st.player    = { ...newPoke };
    st.energy   -= 2;
    BattleEngine._dealHand.call({ state: st }, 5);
    fetchPoke(newPoke.id).then(d => {
      const back = d.sprites?.back_default || d.sprites?.front_default || newPoke.spriteUrl;
      st.player.backSpriteUrl = back;
      GameState.party[idx].backSpriteUrl = back;
      this._render();
    });
    this._logSystem(`Go, ${newPoke.name}!`);
    this._render();
  },

  _checkDefeated() {
    const st = this.bState;
    if (st.opp.hp <= 0) {
      this.oppTeam[this.oppIdx].hp = 0;
      this._isOver = true;

      // Faint animation — same as wild battle
      const oppSpriteEl = document.getElementById('boss-opp-sprite');
      if (oppSpriteEl) {
        oppSpriteEl.classList.add('pokemon-faint');
        setTimeout(() => { oppSpriteEl.style.visibility = 'hidden'; }, 700);
      }

      // All logic deferred until animation completes
      setTimeout(() => {
        this.oppIdx++;
        if (this.oppIdx >= this.oppTeam.length) {
          // All opponents defeated
          GameState.party[GameState.activePokemonIndex].hp = st.player.hp;
          MapEngine.completeNode(GameState.currentNodeIndex);

          if (this._isRocket) {
            this._isRocket = false;
            if (!GameState.stats) GameState.stats = {};
            GameState.stats.totalBattlesWon = (GameState.stats.totalBattlesWon || 0) + 1;
            const earned = Math.floor(20 + Math.random() * 30);
            GameState.gold = (GameState.gold || 0) + earned;
            setTimeout(() => {
              showModal('Team Rocket Fled! 🚀',
                `Team Rocket blasted off again!\nYou found ${earned}g they dropped!`,
                () => {
                  const evolutions = levelUpParty('battle');
                  if (evolutions.length > 0) {
                    runEvolutions(evolutions, () => CardReward.show(earned));
                  } else {
                    CardReward.show(earned);
                  }
                }
              );
            }, 200);
          } else {
            // Normal gym boss win
            if (!GameState.stats) GameState.stats = {};
            GameState.stats.totalBattlesWon  = (GameState.stats.totalBattlesWon  || 0) + 1;
            GameState.stats.totalBossesBeaten = (GameState.stats.totalBossesBeaten || 0) + 1;
            setTimeout(() => {
              const isFinalBoss = GameState.bossesDefeated >= 7;
              const bossName    = this.bossData.name;
              const BOSS_WIN_LINES = {
                'Brock':     `"Your Pokémon has real grit. I can see you've been training hard. The Boulder Badge is yours."`,
                'Misty':     `"Fine. You beat me fair and square. Don't let it go to your head — the real trainers are ahead."`,
                'Lt. Surge': `"Outstanding instincts! A soldier who reads battle like that goes far. The Thunder Badge!"`,
                'Erika':     `"Your Pokémon moved with grace and patience. The Rainbow Badge suits a trainer like you."`,
                'Koga':      `"You have the mind of a shinobi — patient, precise, relentless. The Soul Badge is yours."`,
                'Sabrina':   `"...I did not foresee this outcome. You have surprised me. The Marsh Badge is yours."`,
                'Blaine':    `"Ha! You burned bright today! You've got fire in you, kid! Take the Volcano Badge!"`,
                'Giovanni':  `"Impressive control. I expected nothing less. You've earned your place in this world."`,
                'Lorelei':   `"You've broken through my ice. The Elite Four won't forget a trainer like you."`,
                'Bruno':     `"Your fighting spirit rivals mine. A true warrior's heart. Well earned, trainer."`,
                'Agatha':    `"You have more spirit than I expected, child. Come back when you're older — if you dare!"`,
                'Lance':     `"The Dragon Master bows to a worthy challenger. The skies are yours today."`,
                'Blue':      `"...you got lucky." He walks off without another word. You both know it wasn't luck.`,
              };
              const bossLine = BOSS_WIN_LINES[bossName]
                || `You defeated ${bossName}! Your team is getting stronger!`;
              const modalMsg = isFinalBoss
                ? `You are the Champion!\n\n${bossLine}`
                : bossLine;
              showModal('Boss Defeated! 🏅', modalMsg, () => {
                Game.afterBoss(GameState.bossesDefeated);
              });
            }, 200);
          }
        } else {
          // More opponents remain — load next
          BattleEngine._battleOver       = false;
          BattleEngine._itemUsedThisTurn = false;
          this._isOver                   = false;
          this._logEnemy(`${this.bossData.name} sends ${this.oppTeam[this.oppIdx].name}!`);
          st.opp = { ...this.oppTeam[this.oppIdx] };
          this._render();  // sprite reset happens here — animation is already done
        }
      }, 750); // wait for faint animation to finish

      return true;
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
        this._logSystem(`Go, ${p.name}!`);
        this._render();
        // Fetch back sprite non-blocking
        if (!p.backSpriteUrl) {
          fetchPoke(p.id).then(d => {
            const back = d.sprites?.back_default || d.sprites?.front_default || p.spriteUrl;
            st.player.backSpriteUrl = back;
            GameState.party[next].backSpriteUrl = back;
            this._render();
          });
        }
      } else {
        this._isOver = true;
        deleteSave();
        GameOver.show(this.bossData.name);
        return true;
      }
    }
    return false;
  },

  _syncFromBattleState(st) { this.bState = st; },
};

// ─── ROCKET DIALOGUE SCRIPTS ─────────────────────────────────────────────────
// Each script is an array of lines. Each line: { speaker, name, img, text }
// ${name} in text is replaced with the trainer's name at render time.

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
    let ci = 0;
    const iv = setInterval(() => {
      document.getElementById('dialogue-text').textContent += intro[ci++];
      if (ci >= intro.length) {
        clearInterval(iv);
        if (startBtn) { startBtn.style.display = ''; startBtn.textContent = 'Begin Drill! ⚡'; }
      }
    }, 22);
  },

  startGame() {
    this._isActive = false;
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = 'Battle! ▶';
    // Clear intro bg
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    document.getElementById('trainer-intro').style.display = 'none';
    this._showRound();
  },

  _showRound() {
    const sc = this._scenarios[this._round];
    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = 'assets/ltsurge.png'; img.style.display = ''; }
    document.getElementById('challenge-badge').textContent   = `⚡ Surge's Type Drill — Round ${this._round + 1}/3`;
    document.getElementById('challenge-intro').textContent   = `Score: ${this._score}/${this._round} correct`;
    document.getElementById('challenge-coin-visual').style.display  = 'none';
    document.getElementById('jessie-word-display').style.display    = 'none';
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';
    document.getElementById('challenge-question').textContent       = sc.question;

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
    document.getElementById('screen-challenge').classList.remove('jessie-active','james-active','meowth-active','fishing-active');
    document.getElementById('screen-challenge').classList.add('surge-active');
    SoundEngine.playBGM('pallet_town_theme.mp3');
  },

  _answer(chosen) {
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
    // Reset state immediately so stale flags don't intercept future challenge-continue-btn clicks
    this._answered = false;
    this._round    = 0;
    document.getElementById('screen-challenge').classList.remove('surge-active');
    const score = this._score;
    const party = GameState.party.filter(p => p.hp > 0);

    let headline, detail, quote;
    if (score === 3) {
      const evos = levelUpParty('surge');
      headline = '⚡ Perfect Score!';
      detail   = 'All Pokémon gained +1 level!';
      quote    = 'Perfect. You may just survive out there. DISMISSED.';
      saveGame();
      if (evos.length > 0) {
        runEvolutions(evos, () => showModal(headline, `${detail}\n\n"${quote}" — Lt. Surge`,
          () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); }));
      } else {
        showModal(headline, `${detail}\n\n"${quote}" — Lt. Surge`,
          () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); });
      }
    } else if (score >= 1) {
      const evos = levelUpParty('surge');
      headline = `⚡ ${score}/3 Correct`;
      detail   = 'Active Pokémon gained +1 level.';
      quote    = score === 2
        ? 'Two out of three. Not bad. Study the weak spot.' 
        : 'One out of three. Barely passing. Hit the training room.';
      saveGame();
      if (evos.length > 0) {
        runEvolutions(evos, () => showModal(headline, `${detail}\n\n"${quote}" — Lt. Surge`,
          () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); }));
      } else {
        showModal(headline, `${detail}\n\n"${quote}" — Lt. Surge`,
          () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); });
      }
    } else {
      headline = '⚡ 0/3 — FAIL';
      detail   = 'No reward. Study your type chart, soldier.';
      quote    = 'Zero out of three. I\'ve seen Magikarp with better battle sense. DISMISSED.';
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

const ERIKA_INTROS = [
  `Oh my, ${'{name}'}... you startled me. I was tending to the garden. Before you rush off, let me test your knowledge of herbs and berries. A true trainer cares for their Pokémon properly.`,
  `${'{name}'}. Sit with me a moment. These berries won't sort themselves, and neither will your understanding of them. Let's see what you know.`,
  `Hmm... a trainer who can't tell a Sitrus Berry from a Pecha Berry has no business handling Pokémon. I'll be gentle. Identify these herbs for me, please.`,
];

// Each herb/berry has: icon, name, category ('heal'|'cure'|'poison'), description, hint, and explanation
// hint = a bridging sentence that lets the player deduce the category from the description
const ERIKA_HERBS = [
  { icon:'🍊', name:'Oran Berry',    cat:'heal',
    desc:'Small, round, orange. Smells faintly sweet. A Pokémon that is hurt will seek this out on its own.',
    hint:'A hurt Pokémon would reach for this instinctively. It seems to restore something.',
    explain:'Oran Berries restore HP — Pokémon seek them out when hurt.' },
  { icon:'🫐', name:'Sitrus Berry',  cat:'heal',
    desc:'Larger than most berries. Deep blue, slightly tart. Leaves a feeling of renewed strength.',
    hint:'Something about this fills you with energy just holding it. Like it gives back what was lost.',
    explain:'Sitrus Berries restore a larger amount of HP when eaten.' },
  { icon:'🌸', name:'Pecha Berry',   cat:'cure',
    desc:'Soft pink. Extraordinarily sweet. Almost too sweet. The scent is clean and sharp.',
    hint:'The sweetness seems to push something out — like it clears the body of something unwanted.',
    explain:'Pecha Berries cure poison — their intense sweetness neutralises toxins.' },
  { icon:'🟡', name:'Chesto Berry',  cat:'cure',
    desc:'Crisp and waxy. Yellow with a firm texture. Has a sharp, jolting scent.',
    hint:'Even smelling it makes you alert. Like a splash of cold water to the face.',
    explain:'Chesto Berries cure sleep — their sharp scent jolts a Pokémon awake.' },
  { icon:'🍋', name:'Rawst Berry',   cat:'cure',
    desc:'Bitter and tangy. Leaves a distinct cool sensation on the tongue and skin.',
    hint:'The cooling feeling seems to soothe heat and pain. Like ice on a burn.',
    explain:'Rawst Berries cure burn — the cool juice soothes scorched skin and tissue.' },
  { icon:'🍇', name:'Persim Berry',  cat:'cure',
    desc:'Deep purple clusters. Sweet, but the smell is strangely disorienting at first.',
    hint:'After a moment the confusion clears. It sharpens the mind and restores focus.',
    explain:'Persim Berries cure confusion — they sharpen focus and clear the mind.' },
  { icon:'🌿', name:'Poison Barb',   cat:'poison',
    desc:'Sharp and dark green. The tip glistens with a clear liquid. Erika holds it with gloves.',
    hint:'Erika keeps this away from the other plants. Even she won\'t touch it with bare hands.',
    explain:'Poison Barb is toxic — it poisons Pokémon that make contact with it.' },
  { icon:'🍄', name:'Toxic Mushroom',cat:'poison',
    desc:'Pale spotted cap. Smells earthy — but there is something wrong underneath that smell.',
    hint:'The wrong smell is subtle but unmistakable. Something here would hurt a Pokémon, not help it.',
    explain:'Toxic Mushrooms are dangerous — never feed these to Pokémon under any circumstance.' },
  { icon:'🌑', name:'Dark Spore',    cat:'poison',
    desc:'Fine black powder. Drifts in the air when disturbed. Erika warns you not to breathe it in.',
    hint:'Even Erika steps back from this one. Whatever it does, it does not help.',
    explain:'Dark Spores cause poisoning on contact — extremely hazardous, handle with care.' },
  { icon:'🍎', name:'Leppa Berry',   cat:'heal',
    desc:'Firm and red. Gives off a faint energising warmth. Pokémon seem restless around it.',
    hint:'It does not heal wounds — but something about it restores readiness. Like recharging.',
    explain:'Leppa Berries restore a move\'s PP — they replenish a Pokémon\'s energy and drive.' },
  { icon:'🟠', name:'Lum Berry',     cat:'cure',
    desc:'Bright orange. Smells strangely clinical — almost like a medicine cabinet.',
    hint:'The medicinal smell suggests it works on something internal. Something that ails the body.',
    explain:'Lum Berries cure any status condition — the most versatile cure berry in Erika\'s garden.' },
  { icon:'🌺', name:'Stun Spore',    cat:'poison',
    desc:'Orange powder on a pale flower. Smells like rust and metal. Makes your hand tingle.',
    hint:'The tingling is a warning. Erika says this one freezes muscles on contact.',
    explain:'Stun Spore paralyses Pokémon — the metallic smell is a sign of its paralytic compound.' },
];

function _generateErikaRound(usedNames) {
  // Pick one from each category — heal, cure, poison
  const heals   = ERIKA_HERBS.filter(h => h.cat === 'heal'   && !usedNames.has(h.name));
  const cures   = ERIKA_HERBS.filter(h => h.cat === 'cure'   && !usedNames.has(h.name));
  const poisons = ERIKA_HERBS.filter(h => h.cat === 'poison' && !usedNames.has(h.name));

  // If any category runs out, reset that category's used tracking
  if (!heals.length)   ERIKA_HERBS.filter(h => h.cat === 'heal').forEach(h => usedNames.delete(h.name));
  if (!cures.length)   ERIKA_HERBS.filter(h => h.cat === 'cure').forEach(h => usedNames.delete(h.name));
  if (!poisons.length) ERIKA_HERBS.filter(h => h.cat === 'poison').forEach(h => usedNames.delete(h.name));

  const heal   = heals[Math.floor(Math.random()   * heals.length)]   || ERIKA_HERBS.find(h => h.cat === 'heal');
  const cure   = cures[Math.floor(Math.random()   * cures.length)]   || ERIKA_HERBS.find(h => h.cat === 'cure');
  const poison = poisons[Math.floor(Math.random() * poisons.length)] || ERIKA_HERBS.find(h => h.cat === 'poison');

  [heal, cure, poison].forEach(h => usedNames.add(h.name));

  // Question: pick one herb at random, ask the player what it does
  const subject = [heal, cure, poison][Math.floor(Math.random() * 3)];
  const allChoices = ['Heals HP', 'Cures a status condition', 'Is poisonous — dangerous!'];
  const correctChoice = subject.cat === 'heal'   ? 'Heals HP'
                      : subject.cat === 'cure'   ? 'Cures a status condition'
                      :                            'Is poisonous — dangerous!';
  const choices = shuffle([...allChoices]);

  return { subject, correctChoice, choices };
}

const ErikaEngine = {
  _isActive:  false,
  _answered:  false,
  _node:      null,
  _round:     0,
  _score:     0,
  _usedNames: null,
  _rounds:    [],

  start(node) {
    this._node      = node;
    this._isActive  = true;
    this._answered  = false;
    this._round     = 0;
    this._score     = 0;
    this._usedNames = new Set();
    this._rounds    = [
      _generateErikaRound(this._usedNames),
      _generateErikaRound(this._usedNames),
      _generateErikaRound(this._usedNames),
    ];

    // Boss-screen intro with Erika portrait + gym background
    showScreen('boss');
    BossEngine._isRocket = false;

    const bgEl  = document.querySelector('#screen-boss .battle-bg');
    const imgEl = document.querySelector('#screen-boss .battle-bg-img');
    if (bgEl && imgEl) {
      bgEl.classList.add('boss-intro-mode');
      bgEl.style.background = GYM_FALLBACKS[3]; // Erika green fallback
      imgEl.style.opacity = '0';
      imgEl.onload  = () => { imgEl.style.opacity = '1'; bgEl.style.background = ''; };
      imgEl.onerror = () => { imgEl.style.opacity = '0'; };
      imgEl.src = 'assets/bg_3_boss.png';
    }

    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';
    document.getElementById('boss-party-bar').innerHTML       = '';

    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (trainerImg) trainerImg.src = 'assets/erika.png';
    document.getElementById('dialogue-name').textContent = 'Erika';
    document.getElementById('dialogue-text').textContent = '';

    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.style.display = 'none';
    document.getElementById('btn-dialogue-next').style.display = 'none';

    const name  = GameState.trainerName || 'Trainer';
    const intro = ERIKA_INTROS[Math.floor(Math.random() * ERIKA_INTROS.length)]
      .replace('{name}', name);
    let ci = 0;
    const iv = setInterval(() => {
      document.getElementById('dialogue-text').textContent += intro[ci++];
      if (ci >= intro.length) {
        clearInterval(iv);
        if (startBtn) { startBtn.style.display = ''; startBtn.textContent = 'Begin Sorting 🌿'; }
      }
    }, 28);
  },

  startGame() {
    this._isActive = false;
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = 'Battle! ▶';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    document.getElementById('trainer-intro').style.display = 'none';
    this._showRound();
  },

  _showRound() {
    const rd  = this._rounds[this._round];
    const h   = rd.subject;

    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = 'assets/erika.png'; img.style.display = ''; }
    document.getElementById('challenge-badge').textContent   = `🌿 Erika's Herb Garden — Round ${this._round + 1}/3`;
    document.getElementById('challenge-intro').textContent   = `Score: ${this._score}/${this._round}`;
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';

    // Show herb display — name hidden until after answer to encourage deduction
    const cv = document.getElementById('challenge-coin-visual');
    cv.style.display = 'block';
    cv.className     = 'erika-herb-display';
    cv.innerHTML     = `
      <div class="erika-herb-icon">${h.icon}</div>
      <div class="erika-herb-desc">"${h.desc}"</div>
      <div class="erika-herb-hint">💡 ${h.hint}</div>`;

    document.getElementById('jessie-word-display').style.display = 'none';
    document.getElementById('challenge-question').textContent    = 'What does this plant do to a Pokémon?';

    const btnArea = document.getElementById('challenge-answer-btns');
    btnArea.innerHTML = '';
    rd.choices.forEach(val => {
      const b = document.createElement('button');
      b.className   = 'challenge-answer-btn';
      b.textContent = val;
      b.addEventListener('click', () => this._answer(val));
      btnArea.appendChild(b);
    });

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.remove(
      'jessie-active','james-active','meowth-active','surge-active','fishing-active');
    document.getElementById('screen-challenge').classList.add('erika-active');
    SoundEngine.playBGM('pallet_town_theme.mp3');
  },

  _answer(chosen) {
    const rd      = this._rounds[this._round];
    const isRight = chosen === rd.correctChoice;
    if (isRight) this._score++;

    document.querySelectorAll('.challenge-answer-btn').forEach(b => {
      b.disabled = true;
      if (b.textContent === rd.correctChoice) b.classList.add('answer-correct');
      else if (b.textContent === chosen && !isRight) b.classList.add('answer-wrong');
    });

    const quotes = isRight
      ? ['Wonderful. You have a gardener\'s instinct.', 'Correct. Even the gentlest berry has a purpose.', 'Yes — that\'s exactly right. Well done.']
      : ['Oh dear... not quite. Let me explain.', 'I\'m afraid that\'s wrong. Don\'t worry — now you know.', 'Hmm. Close, but mistaken. Remember this for next time.'];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    const resultEl = document.getElementById('challenge-result');
    resultEl.className   = `challenge-result ${isRight ? 'result-correct' : 'result-wrong'}`;
    resultEl.innerHTML   = `${isRight ? '✅' : '❌'} <strong>${rd.correctChoice}</strong> — <em>${rd.subject.name}</em><br>${rd.subject.explain}<br><em>"${quote}" — Erika</em>`;
    resultEl.style.display = 'block';

    const isLast = this._round === 2;
    const btn    = document.getElementById('challenge-continue-btn');
    btn.textContent   = isLast ? 'Return to path 🌸' : 'Next herb ▶';
    btn.style.display = 'block';

    if (isLast) this._answered = true;
    this._round++;
  },

  nextRound() {
    if (this._answered) { this._finish(); } else { this._showRound(); }
  },

  _finish() {
    this._answered = false;
    this._round    = 0;
    document.getElementById('screen-challenge').classList.remove('erika-active');
    document.getElementById('challenge-coin-visual').className = 'challenge-coin-visual';

    const score = this._score;
    let headline, detail, quote;

    if (score >= 2) {
      // Full HP restore for one party member (lead)
      const lead = GameState.party.find(p => p.hp > 0);
      if (lead) lead.hp = lead.maxHp;
      headline = '🌸 Herb Knowledge!';
      detail   = `${lead?.name || 'Your Pokémon'} was fully healed!`;
      quote    = score === 3
        ? 'Excellent. Your Pokémon are in good hands.'
        : 'Two out of three. Good enough. Here — take this for your partner.';
    } else if (score === 1) {
      const lead = GameState.party.find(p => p.hp > 0);
      if (lead) lead.hp = Math.min(lead.maxHp, lead.hp + Math.floor(lead.maxHp * 0.3));
      headline = '🌿 Partial Knowledge';
      detail   = 'Lead Pokémon healed 30% HP.';
      quote    = 'One out of three. A little knowledge is better than none. Study more.';
    } else {
      headline = '🍄 Oh My...';
      detail   = 'No reward. Erika sighs gently.';
      quote    = 'Zero. Please be careful around real herbs, dear. For your Pokémon\'s sake.';
    }

    saveGame();
    showModal(headline, `${detail}\n\n"${quote}" — Erika`, () => {
      MapEngine.completeNode(GameState.currentNodeIndex);
      MapEngine.show();
    });
  },

  finish() {
    this._answered = false;
    document.getElementById('screen-challenge').classList.remove('erika-active');
    document.getElementById('challenge-coin-visual').className = 'challenge-coin-visual';
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },
};

// ─── KOGA POISON ANTIDOTE ENGINE ─────────────────────────────────────────────

const KOGA_INTROS = [
  `${'{name}'}. You walk into my domain without hesitation. Either very brave or very foolish. I shall test which. A ninja knows every poison — and every cure.`,
  `Hmm. ${'{name}'}. You survived this far. Now tell me... do you know the difference between a slow poison and a fast one? We shall find out.`,
  `Stand still, ${'{name}'}. My Pokémon have been poisoned in training. Three cases. You will identify the correct antidote for each. Fail and learn. Succeed and prosper.`,
];

// Each puzzle: clues describe the poisoning symptoms, answer is the correct antidote
// correctAntidote must appear in choices[]. Educational: player learns what cures what.
const KOGA_PUZZLES = [
  {
    clues: [
      'The Pokémon\'s skin has turned a faint purple. It moves sluggishly.',
      'There is a sweet but acrid smell — almost like burnt sugar.',
      'Its HP drains slowly each passing moment. Classic venomous sting.',
    ],
    summary: 'Purple tint, sweet-acrid smell, slow HP drain. A standard venom — the most common form of poisoning.',
    koga_hint: 'Koga observes: "Standard venom. Slow and steady. A basic antidote handles this — nothing exotic."',
    question: '☠️ Which antidote cures this poison?',
    correctAntidote: 'antidote',
    choices: [
      { id:'antidote',   label:'Antidote',     desc:'Cures standard poison only.' },
      { id:'burn_heal',  label:'Burn Heal',     desc:'Soothes burns and scorched skin.' },
      { id:'awakening',  label:'Awakening',     desc:'Wakes a Pokémon from deep sleep.' },
      { id:'ice_pack',   label:'Ice Pack',      desc:'Reduces swelling from physical hits.' },
    ],
    explanation: 'An Antidote neutralises standard poison — the go-to remedy for a classic venomous sting.',
    koga_right: 'Correct. Swift and precise. A true shinobi.',
    koga_wrong: 'An Antidote. Standard venom, standard cure. Remember this.',
  },
  {
    clues: [
      'The Pokémon is shivering despite the warmth. Its eyes are unfocused.',
      'There is no smell — this poison is odourless. The most deceptive kind.',
      'Multiple symptoms at once: poison, confusion, and lethargy.',
    ],
    summary: 'Shivering, unfocused eyes, odourless, multiple simultaneous conditions. A compound poison requiring a versatile cure.',
    koga_hint: 'Koga observes: "Multiple conditions at once. No single remedy handles all of them. You need something total."',
    question: '☠️ Multiple conditions at once. What cures all of them?',
    correctAntidote: 'full_heal',
    choices: [
      { id:'antidote',   label:'Antidote',     desc:'Cures standard poison only.' },
      { id:'full_heal',  label:'Full Heal',     desc:'Erases ALL status conditions at once.' },
      { id:'pecha',      label:'Pecha Berry',   desc:'Sweet berry — cures poison specifically.' },
      { id:'awakening',  label:'Awakening',     desc:'Wakes a Pokémon from deep sleep.' },
    ],
    explanation: 'Full Heal cures all status conditions simultaneously — essential against compound poisons.',
    koga_right: 'Precisely. When facing compound poisons, the Full Heal is the only reliable answer.',
    koga_wrong: 'A Full Heal. It erases all status conditions simultaneously. Never forget its value.',
  },
  {
    clues: [
      'The Pokémon\'s tongue is discoloured — deep pink, almost red.',
      'It keeps licking something sweet from the air. The poison is sugar-based.',
      'The Pokémon is calm but clearly weakened. HP fades slowly.',
    ],
    summary: 'Deep pink tongue, reacts to sweetness in the air, calm disposition but draining HP. A berry-soluble venom.',
    koga_hint: 'Koga observes: "The poison reacts to sweetness. The cure must match its nature."',
    question: '☠️ A sugar-based poison. Which berry antidote works here?',
    correctAntidote: 'pecha',
    choices: [
      { id:'oran',       label:'Oran Berry',    desc:'Restores HP — does not cure status.' },
      { id:'pecha',      label:'Pecha Berry',   desc:'Intensely sweet — dissolves sugar-based toxins.' },
      { id:'rawst',      label:'Rawst Berry',   desc:'Cool and bitter — soothes burns.' },
      { id:'chesto',     label:'Chesto Berry',  desc:'Sharp and jolting — wakes sleeping Pokémon.' },
    ],
    explanation: 'Pecha Berries dissolve sugar-based toxins — their intense sweetness overwhelms the venom.',
    koga_right: 'The Pecha Berry. Its sweetness is its weapon against sweet poisons. Well deduced.',
    koga_wrong: 'Pecha Berry. Sweet poisons are neutralised by sweeter cures. Study this.',
  },
  {
    clues: [
      'The Pokémon smells faintly of the forest floor — damp earth and moss.',
      'Its movements are erratic. The venom affects coordination, not HP.',
      'The eyes dart rapidly. This is a psychoactive compound, not a physical toxin.',
    ],
    summary: 'Earthy smell, erratic movement, no HP drain, darting eyes. A psychoactive compound affecting the mind, not the body.',
    koga_hint: 'Koga observes: "The body is fine. The mind is compromised. Whatever you use must work on any condition."',
    question: '☠️ A mind-affecting poison with no HP drain. What cures it?',
    correctAntidote: 'lum',
    choices: [
      { id:'antidote',  label:'Antidote',      desc:'Cures standard body poison only.' },
      { id:'para_heal', label:'Paralyze Heal', desc:'Restores muscle control from paralysis.' },
      { id:'lum',       label:'Lum Berry',     desc:'Cures ANY single status condition.' },
      { id:'full_restore', label:'Full Restore', desc:'Restores HP and all status — very rare.' },
    ],
    explanation: 'Lum Berries cure any single status condition — including psychoactive compounds that affect the mind.',
    koga_right: 'The Lum Berry. It resets all conditions. A ninja always carries one.',
    koga_wrong: 'Lum Berry. It cures any status condition. When in doubt, reach for the Lum.',
  },
  {
    clues: [
      'The Pokémon collapsed suddenly mid-battle. It was fine moments ago.',
      'There is a sharp chemical smell — almost like lightning in the air.',
      'Its muscles are rigid. It cannot move at all, though it is still conscious.',
    ],
    summary: 'Sudden collapse, sharp electric smell, rigid muscles, fully conscious but immobile. Paralysis from a contact toxin.',
    koga_hint: 'Koga observes: "Rigid muscles. Electric smell. The body wants to move but cannot. This is specific."',
    question: '☠️ Rigid muscles, fully conscious, cannot move. What cures this?',
    correctAntidote: 'para_heal',
    choices: [
      { id:'antidote',  label:'Antidote',      desc:'Cures standard poison only.' },
      { id:'full_heal', label:'Full Heal',      desc:'Erases all status conditions at once.' },
      { id:'para_heal', label:'Paralyze Heal', desc:'Dissolves muscle-locking compounds specifically.' },
      { id:'pecha',     label:'Pecha Berry',   desc:'Cures poison — not effective on paralysis.' },
    ],
    explanation: 'Paralyze Heal targets muscle-locking toxins specifically — the electric smell confirms a paralytic compound.',
    koga_right: 'Paralyze Heal. You read the symptoms correctly. That is the mark of a trained mind.',
    koga_wrong: 'Paralyze Heal. Rigid muscles and electric smell — classic paralytic toxin. Remember the signs.',
  },
  {
    clues: [
      'The Pokémon\'s scales have dulled to grey. It moves, but reluctantly.',
      'It flinches from light — photosensitivity. A common side effect of deep toxins.',
      'The HP drains quickly. Faster than standard poison. This is a bad toxin.',
    ],
    summary: 'Grey scales, photosensitivity, fast HP drain. This is a deeply embedded toxin — standard Antidote is insufficient.',
    koga_hint: 'Koga observes: "This is not standard poison. Something deeper. An ordinary Antidote will not be enough."',
    question: '☠️ Fast HP drain and photosensitivity. This is badly poisoned. Cure it.',
    correctAntidote: 'full_heal',
    choices: [
      { id:'antidote',  label:'Antidote',      desc:'Cures only standard poison — not deep toxins.' },
      { id:'full_heal', label:'Full Heal',      desc:'Erases all status conditions — handles deep toxins.' },
      { id:'lum',       label:'Lum Berry',     desc:'Cures any single condition, including bad poison.' },
      { id:'pecha',     label:'Pecha Berry',   desc:'Sweet berry — cures standard poison specifically.' },
    ],
    explanation: 'Badly poisoned requires Full Heal or Lum Berry — Antidote alone cannot handle deeply embedded toxins.',
    koga_right: 'Correct. Standard Antidote fails against deep toxins. Full Heal succeeds. Excellent.',
    koga_wrong: 'Full Heal — or Lum Berry. Standard Antidote cannot handle deeply embedded toxins.',
  },
];

const KogaEngine = {
  _isActive:  false,
  _answered:  false,
  _node:      null,
  _clueIdx:   0,
  _puzzle:    null,
  _usedIdxs:  null,

  start(node) {
    this._node     = node;
    this._isActive = true;
    this._answered = false;
    this._clueIdx  = 0;
    this._usedIdxs = this._usedIdxs || new Set();

    // Pick a puzzle not recently used
    const available = KOGA_PUZZLES
      .map((p, i) => i)
      .filter(i => !this._usedIdxs.has(i));
    if (available.length === 0) this._usedIdxs.clear();
    const pool = available.length > 0
      ? available
      : KOGA_PUZZLES.map((_, i) => i);
    const idx = pool[Math.floor(Math.random() * pool.length)];
    this._usedIdxs.add(idx);
    this._puzzle = KOGA_PUZZLES[idx];

    // Boss-screen intro
    showScreen('boss');
    BossEngine._isRocket = false;

    const bgEl  = document.querySelector('#screen-boss .battle-bg');
    const imgEl = document.querySelector('#screen-boss .battle-bg-img');
    if (bgEl && imgEl) {
      bgEl.classList.add('boss-intro-mode');
      bgEl.style.background = GYM_FALLBACKS[4];
      imgEl.style.opacity = '0';
      imgEl.onload  = () => { imgEl.style.opacity = '1'; bgEl.style.background = ''; };
      imgEl.onerror = () => { imgEl.style.opacity = '0'; };
      imgEl.src = 'assets/bg_4_boss.png';
    }

    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';
    document.getElementById('boss-party-bar').innerHTML       = '';

    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (trainerImg) trainerImg.src = 'assets/koga.png';
    document.getElementById('dialogue-name').textContent = 'Koga';
    document.getElementById('dialogue-text').textContent = '';

    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.style.display = 'none';
    document.getElementById('btn-dialogue-next').style.display = 'none';

    const name  = GameState.trainerName || 'Trainer';
    const intro = KOGA_INTROS[Math.floor(Math.random() * KOGA_INTROS.length)]
      .replace('{name}', name);
    let ci = 0;
    const iv = setInterval(() => {
      document.getElementById('dialogue-text').textContent += intro[ci++];
      if (ci >= intro.length) {
        clearInterval(iv);
        if (startBtn) { startBtn.style.display = ''; startBtn.textContent = 'Begin Deduction ☠️'; }
      }
    }, 26);
  },

  startGame() {
    this._isActive = false;
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = 'Battle! ▶';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    document.getElementById('trainer-intro').style.display = 'none';
    this._showClues();
  },

  _showClues() {
    const p = this._puzzle;

    // Challenge screen header
    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = 'assets/koga.png'; img.style.display = ''; }
    document.getElementById('challenge-badge').textContent   = '☠️ Koga\'s Antidote Deduction';
    document.getElementById('challenge-intro').textContent   = 'Read every clue carefully before choosing.';
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';
    document.getElementById('challenge-answer-btns').innerHTML      = '';
    document.getElementById('challenge-question').textContent       = '';
    document.getElementById('challenge-question').style.display     = 'none';
    document.getElementById('jessie-word-display').style.display    = 'none';

    // Clue bubble area — reuse fishing-clue-area pattern
    const clueArea = document.getElementById('challenge-coin-visual');
    clueArea.style.display = 'block';
    clueArea.className     = 'fishing-clue-area koga-clue-area';
    clueArea.innerHTML     = '';

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.remove(
      'jessie-active','james-active','meowth-active','surge-active','erika-active','fishing-active');
    document.getElementById('screen-challenge').classList.add('koga-active');
    SoundEngine.playBGM('pallet_town_theme.mp3');

    this._clueIdx = 0;
    this._revealNextClue();
  },

  _revealNextClue() {
    const p        = this._puzzle;
    const clueArea = document.getElementById('challenge-coin-visual');
    const btnArea  = document.getElementById('challenge-answer-btns');
    const qEl      = document.getElementById('challenge-question');

    if (this._clueIdx < p.clues.length) {
      const bubble = document.createElement('div');
      bubble.className = 'fishing-bubble fishing-bubble-typing koga-bubble';
      clueArea.appendChild(bubble);

      const text = p.clues[this._clueIdx];
      let ci = 0;
      const iv = setInterval(() => {
        bubble.textContent += text[ci++];
        if (ci >= text.length) {
          clearInterval(iv);
          bubble.className = 'fishing-bubble fishing-bubble-shown koga-bubble';
          this._clueIdx++;

          if (this._clueIdx < p.clues.length) {
            btnArea.innerHTML = '';
            const nb = document.createElement('button');
            nb.className = 'btn-pixel btn-secondary fishing-next-btn';
            nb.textContent = 'Next clue ▶';
            nb.onclick = () => { btnArea.innerHTML = ''; this._revealNextClue(); };
            btnArea.appendChild(nb);
          } else {
            // All clues shown — show Koga's deduction hint, then summary, then question
            if (p.koga_hint) {
              const hintEl = document.createElement('div');
              hintEl.className   = 'koga-hint-line';
              hintEl.textContent = p.koga_hint;
              clueArea.appendChild(hintEl);
            }
            const summary = document.createElement('div');
            summary.className = 'fishing-summary koga-summary';
            summary.textContent = p.summary;
            clueArea.appendChild(summary);
            this._showQuestion();
          }
        }
      }, 30);

    } else {
      this._showQuestion();
    }
  },

  _showQuestion() {
    const p    = this._puzzle;
    const qEl  = document.getElementById('challenge-question');
    qEl.textContent   = p.question;
    qEl.style.display = '';

    const btnArea = document.getElementById('challenge-answer-btns');
    btnArea.innerHTML = '';
    const choices = shuffle([...p.choices]);
    choices.forEach(ch => {
      const b = document.createElement('button');
      b.className       = 'challenge-answer-btn koga-choice-btn';
      b.dataset.choiceId = ch.id;
      b.innerHTML = `<span class="koga-choice-label">${ch.label}</span><span class="koga-choice-desc">${ch.desc}</span>`;
      b.addEventListener('click', () => this._answer(ch.id, ch.label));
      btnArea.appendChild(b);
    });
  },

  _answer(chosenId, chosenLabel) {
    if (this._answered) return;
    this._answered = true;

    const p       = this._puzzle;
    const isRight = chosenId === p.correctAntidote;

    document.querySelectorAll('.challenge-answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.choiceId === p.correctAntidote) b.classList.add('answer-correct');
      else if (b.dataset.choiceId === chosenId && !isRight) b.classList.add('answer-wrong');
    });

    const correctChoice = p.choices.find(c => c.id === p.correctAntidote);
    const correctLabel  = correctChoice?.label || p.correctAntidote;

    const resultEl = document.getElementById('challenge-result');
    resultEl.className   = `challenge-result ${isRight ? 'result-correct' : 'result-wrong'}`;
    resultEl.innerHTML   = `${isRight ? '✅' : '❌'} <strong>${correctLabel}</strong><br>${p.explanation}<br><em>"${isRight ? p.koga_right : p.koga_wrong}" — Koga</em>`;
    resultEl.style.display = 'block';

    document.getElementById('challenge-continue-btn').textContent   = 'Continue ▶';
    document.getElementById('challenge-continue-btn').style.display = 'block';
  },

  finish() {
    this._answered = false;
    document.getElementById('screen-challenge').classList.remove('koga-active');
    document.getElementById('challenge-coin-visual').className = 'challenge-coin-visual';

    const isRight = this._puzzle && document.querySelector('.answer-correct') !== null;
    const party   = GameState.party.filter(p => p.hp > 0);

    if (isRight) {
      // Cure all status effects + restore 15% HP to all living party members
      party.forEach(p => {
        p.statusEffects = [];
        p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * 0.15));
      });
      saveGame();
      showModal(
        '☠️ Antidote Mastered!',
        `All Pokémon status conditions cured!\nAll Pokémon healed 15% HP.\n\n"${this._puzzle.koga_right}" — Koga`,
        () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); }
      );
    } else {
      saveGame();
      showModal(
        '☠️ Study Harder.',
        `No reward — but the knowledge is yours now.\n\n"${this._puzzle.koga_wrong}" — Koga`,
        () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); }
      );
    }

    this._answered = false;
  },
};

// ─── BLAINE RIDDLE ENGINE ────────────────────────────────────────────────────

const BLAINE_INTROS = [
  `HA! ${'{name}'}! I hope you brought your thinking cap — and some ointment for the burn! Three riddles. Guess the Pokémon. Get it wrong and you'll feel the heat!`,
  `${'{name}'}! A true trainer doesn't just battle — they KNOW their Pokémon! Answer my riddles and prove it. Or don't. My Arcanine finds failure amusing.`,
  `Fwa ha ha! ${'{name}'}! Science, riddles, and Pokémon — the three great loves of my life! Let's see if you share at least one of them!`,
];

const BLAINE_PUNS = [
  'That\'s HOT — you really know your stuff! I\'m not just saying that because I run a volcano gym.',
  'Impressive! You\'re really fired up today! Unlike my last challenger, who was just... lukewarm.',
  'You\'ve got a burning passion for Pokémon knowledge! I can appreciate that — professionally speaking.',
  'You\'ve truly put the FUN in... wait, that doesn\'t work. But great answer anyway!',
  'Blaine is... quite impressed! Don\'t tell anyone, I have a reputation to maintain.',
  'Hot hot hot! Three for three! You might just be smarter than my Rapidash. Maybe.',
];

// Each riddle: 3 clues describing a Pokémon (habitat/diet/appearance — never the type),
// the answer, and 3 wrong options that are plausible but incorrect.
const BLAINE_RIDDLES = [
  {
    clues: [
      'I sleep inside volcanoes. The heat is like a warm blanket to me.',
      'My shell can withstand temperatures that would melt steel.',
      'I spray boiling water from the holes in my rocky hide.',
    ],
    summary: 'Sleeps in volcanoes, shell resists extreme heat, sprays boiling water from rocky hide.',
    answer: 'Magmar',
    wrong:  ['Geodude', 'Rapidash', 'Rhydon'],
    poke_id: 126,
    explanation: 'Magmar lives near volcanic areas and breathes fire that burns at over 2,000°F!',
    blaine_right: 'CORRECT! Magmar — the Spitfire Pokémon. A personal favourite. Burns bright!',
    blaine_wrong: 'Magmar! It lives IN volcanoes. Fire-type through and through. Sear that into your memory!',
  },
  {
    clues: [
      'I can swim faster than any boat — 150 miles per hour in water.',
      'My shell is made of small hexagonal stones cemented together naturally.',
      'I shoot water jets so powerful they can pierce steel.',
    ],
    summary: 'Swims at 150mph, hexagonal stone shell, water jets that pierce steel.',
    answer: 'Blastoise',
    wrong:  ['Slowbro', 'Cloyster', 'Lapras'],
    poke_id: 9,
    explanation: 'Blastoise\'s shell has two water cannons that can punch through reinforced steel!',
    blaine_right: 'The Shellfish Pokémon! Blastoise! My fire would struggle against it — don\'t tell anyone.',
    blaine_wrong: 'Blastoise! Steel-piercing water cannons. The clue was in "hexagonal stones". Classic!',
  },
  {
    clues: [
      'I can run at 150 miles per hour with a rider on my back.',
      'My mane ignites when I reach full speed. I leave a trail of fire behind me.',
      'I have never been observed standing still. Even in sleep, I pace.',
    ],
    summary: 'Runs at 150mph with a rider, mane ignites at full speed, never stands still even sleeping.',
    answer: 'Rapidash',
    wrong:  ['Ponyta', 'Arcanine', 'Tauros'],
    poke_id: 78,
    explanation: 'Rapidash\'s flaming mane ignites when it gallops — and it reaches top speed in just 10 steps!',
    blaine_right: 'RAPIDASH! My prized partner. Fastest Pokémon I\'ve ever trained. Good eye!',
    blaine_wrong: 'Rapidash! "Never stands still" was the key. It\'s been clocked at 150mph flat out!',
  },
  {
    clues: [
      'I nest inside active volcanoes. The flames there are nothing to me.',
      'When I flap my wings, the air itself ignites. I leave scorched trails across the sky.',
      'I am said to bring early spring when I fly north — my flames melt even the deepest snow.',
    ],
    summary: 'Nests in volcanoes, wings ignite the air, scorches the sky, brings spring by melting snow.',
    answer: 'Moltres',
    wrong:  ['Charizard', 'Ninetales', 'Arcanine'],
    poke_id: 146,
    explanation: 'Moltres is one of the three legendary birds — a Fire/Flying type said to signal the arrival of spring!',
    blaine_right: 'Moltres! The Flame Pokémon! One of the three great legendaries. You have an exceptional mind!',
    blaine_wrong: 'Moltres! "Brings spring by melting snow" — that\'s the legendary bird. A truly iconic Pokémon!',
  },
  {
    clues: [
      'I was discovered in the Andes mountains, 10,000 years ago according to fossils.',
      'My eyes can see ultraviolet light invisible to humans.',
      'I can survive at altitudes where there is almost no oxygen.',
    ],
    summary: 'Ancient Andean fossil, sees ultraviolet light, survives in near-zero oxygen altitudes.',
    answer: 'Aerodactyl',
    wrong:  ['Articuno', 'Pidgeot', 'Fearow'],
    poke_id: 142,
    explanation: 'Aerodactyl was revived from Old Amber — a prehistoric Pokémon that ruled the ancient skies!',
    blaine_right: 'AERODACTYL! Revived from a fossil I helped restore! Science triumphs again!',
    blaine_wrong: 'Aerodactyl! The fossil clue was the giveaway — it\'s an ancient restored Pokémon!',
  },
  {
    clues: [
      'I live at the bottom of the sea, sometimes for 10,000 years.',
      'I carry a living coral reef on my back that houses other Pokémon.',
      'My movements are so slow, algae grow over my shell.',
    ],
    summary: 'Lives on the seafloor for millennia, carries a coral reef on its shell, moves so slowly algae grow on it.',
    answer: 'Slowbro',
    wrong:  ['Lapras', 'Cloyster', 'Dewgong'],
    poke_id: 80,
    explanation: 'A Shellder bit Slowpoke\'s tail and the combination created Slowbro — it\'s been drifting the seafloor ever since!',
    blaine_right: 'Slowbro! Surprisingly hard to identify given how slowly it thinks. Much like some trainers I know!',
    blaine_wrong: 'Slowbro! Algae growing on a moving creature — that\'s the signature of something VERY slow.',
  },
  {
    clues: [
      'My cry sounds like a crackling fire and can be heard for miles.',
      'I guard my territory by releasing intensely bright flashes of light.',
      'I am so rare that some scientists consider me a legend.',
    ],
    summary: 'Cry sounds like crackling fire, guards with blinding light flashes, extremely rare — considered legendary by some.',
    answer: 'Arcanine',
    wrong:  ['Ninetales', 'Flareon', 'Growlithe'],
    poke_id: 59,
    explanation: 'Arcanine is called the "Legendary Pokémon" — it was once thought to be a legendary creature!',
    blaine_right: 'Arcanine! The LEGENDARY Pokémon! One of the finest Fire-types in existence. You have taste!',
    blaine_wrong: 'Arcanine! "Some consider it a legend" — that\'s literal. Arcanine\'s species is Legendary Pokémon!',
  },
  {
    clues: [
      'I shed my skin every year. The shed skin smells strongly of herbs.',
      'I move so silently that prey never hears me coming.',
      'My markings change pattern to match my surroundings perfectly.',
    ],
    summary: 'Sheds herbal-smelling skin annually, moves in complete silence, adaptive camouflage markings.',
    answer: 'Arbok',
    wrong:  ['Ekans', 'Seviper', 'Ditto'],
    poke_id: 24,
    explanation: 'Arbok\'s belly pattern is said to be so terrifying it can paralyse prey with fear!',
    blaine_right: 'Arbok! The Cobra Pokémon. Silent, adaptive, and herb-scented. An unusual combination!',
    blaine_wrong: 'Arbok! The herbal shed skin is the key — it\'s a documented fact in my research notes!',
  },
];

const BlaineEngine = {
  _isActive:  false,
  _answered:  false,
  _node:      null,
  _clueIdx:   0,
  _riddle:    null,
  _usedIdxs:  null,

  start(node) {
    this._node     = node;
    this._isActive = true;
    this._answered = false;
    this._clueIdx  = 0;
    this._usedIdxs = this._usedIdxs || new Set();

    // Pick unused riddle
    const available = BLAINE_RIDDLES.map((_,i) => i).filter(i => !this._usedIdxs.has(i));
    if (available.length === 0) this._usedIdxs.clear();
    const pool = available.length > 0 ? available : BLAINE_RIDDLES.map((_,i) => i);
    const idx  = pool[Math.floor(Math.random() * pool.length)];
    this._usedIdxs.add(idx);
    this._riddle = BLAINE_RIDDLES[idx];

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
    let ci = 0;
    const iv = setInterval(() => {
      document.getElementById('dialogue-text').textContent += intro[ci++];
      if (ci >= intro.length) {
        clearInterval(iv);
        if (startBtn) { startBtn.style.display = ''; startBtn.textContent = 'Riddle me this! 🔥'; }
      }
    }, 24);
  },

  startGame() {
    this._isActive = false;
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = 'Battle! ▶';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    document.getElementById('trainer-intro').style.display = 'none';
    this._showClues();
  },

  _showClues() {
    const r = this._riddle;

    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = 'assets/blaine.png'; img.style.display = ''; }
    document.getElementById('challenge-badge').textContent   = '🔥 Blaine\'s Pokémon Riddle';
    document.getElementById('challenge-intro').textContent   = 'Who am I describing?';
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';
    document.getElementById('challenge-answer-btns').innerHTML      = '';
    document.getElementById('challenge-question').textContent       = '';
    document.getElementById('challenge-question').style.display     = 'none';
    document.getElementById('jessie-word-display').style.display    = 'none';

    const clueArea = document.getElementById('challenge-coin-visual');
    clueArea.style.display = 'block';
    clueArea.className     = 'fishing-clue-area blaine-clue-area';
    clueArea.innerHTML     = '';

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.remove(
      'jessie-active','james-active','meowth-active','surge-active','erika-active','koga-active','fishing-active');
    document.getElementById('screen-challenge').classList.add('blaine-active');
    SoundEngine.playBGM('pallet_town_theme.mp3');

    this._clueIdx = 0;
    this._revealNextClue();
  },

  _revealNextClue() {
    const r        = this._riddle;
    const clueArea = document.getElementById('challenge-coin-visual');
    const btnArea  = document.getElementById('challenge-answer-btns');

    if (this._clueIdx < r.clues.length) {
      const bubble = document.createElement('div');
      // First clue gets a 🔥 prefix flavour
      bubble.className = 'fishing-bubble fishing-bubble-typing blaine-bubble';
      clueArea.appendChild(bubble);

      const text = `Clue ${this._clueIdx + 1}: ${r.clues[this._clueIdx]}`;
      let ci = 0;
      const iv = setInterval(() => {
        bubble.textContent += text[ci++];
        if (ci >= text.length) {
          clearInterval(iv);
          bubble.className = 'fishing-bubble fishing-bubble-shown blaine-bubble';
          this._clueIdx++;

          if (this._clueIdx < r.clues.length) {
            btnArea.innerHTML = '';
            const nb = document.createElement('button');
            nb.className   = 'btn-pixel btn-secondary fishing-next-btn';
            nb.textContent = 'Next clue ▶';
            nb.onclick = () => { btnArea.innerHTML = ''; this._revealNextClue(); };
            btnArea.appendChild(nb);
          } else {
            // All clues shown — summary then question
            const summary = document.createElement('div');
            summary.className   = 'fishing-summary blaine-summary';
            summary.textContent = r.summary;
            clueArea.appendChild(summary);
            this._showQuestion();
          }
        }
      }, 28);
    } else {
      this._showQuestion();
    }
  },

  _showQuestion() {
    const r       = this._riddle;
    const qEl     = document.getElementById('challenge-question');
    qEl.textContent   = '🔥 Which Pokémon am I describing?';
    qEl.style.display = '';

    const choices = shuffle([r.answer, ...r.wrong]);
    const btnArea = document.getElementById('challenge-answer-btns');
    btnArea.innerHTML = '';
    choices.forEach(val => {
      const b = document.createElement('button');
      b.className   = 'challenge-answer-btn';
      b.textContent = val;
      b.addEventListener('click', () => this._answer(val));
      btnArea.appendChild(b);
    });
  },

  _answer(chosen) {
    if (this._answered) return;
    this._answered = true;

    const r       = this._riddle;
    const isRight = chosen === r.answer;

    document.querySelectorAll('.challenge-answer-btn').forEach(b => {
      b.disabled = true;
      if (b.textContent === r.answer) b.classList.add('answer-correct');
      else if (b.textContent === chosen && !isRight) b.classList.add('answer-wrong');
    });

    // Reveal Pokémon sprite
    const revEl = document.getElementById('jessie-word-display');
    revEl.style.display = 'flex';
    revEl.className     = 'fishing-reveal';
    const wordEl = document.getElementById('jessie-word');
    const typeEl = document.getElementById('jessie-word-type');
    wordEl.textContent = '...';
    typeEl.textContent = '';
    fetchPoke(r.poke_id).then(data => {
      const name      = capitalize(data.name);
      const sprite    = data.sprites?.front_default || getSpriteUrl(data);
      const types     = (data.types || []).map(t => t.type.name);
      wordEl.innerHTML = `<img src="${sprite}" alt="${name}" class="fishing-reveal-sprite"
        onerror="this.style.display='none'" /> ${name}`;
      typeEl.innerHTML = types.map(t =>
        `<span class="hud-type-badge type-${t}">${t}</span>`).join(' ');
    }).catch(() => { wordEl.textContent = r.answer; });

    const resultEl = document.getElementById('challenge-result');
    const pun = BLAINE_PUNS[Math.floor(Math.random() * BLAINE_PUNS.length)];
    resultEl.className   = `challenge-result ${isRight ? 'result-correct' : 'result-wrong'}`;
    resultEl.innerHTML   = `${isRight ? '✅' : '❌'} <strong>${r.answer}</strong><br>${r.explanation}<br>` +
      `<em>"${isRight ? r.blaine_right : r.blaine_wrong}" — Blaine</em>` +
      (isRight ? `<div class="blaine-pun">"${pun}"</div>` : '');
    resultEl.style.display = 'block';

    document.getElementById('challenge-continue-btn').textContent   = 'Continue ▶';
    document.getElementById('challenge-continue-btn').style.display = 'block';
  },

  finish() {
    this._answered = false;
    document.getElementById('screen-challenge').classList.remove('blaine-active');
    document.getElementById('challenge-coin-visual').className = 'challenge-coin-visual';
    document.getElementById('jessie-word-display').style.display = 'none';
    document.getElementById('jessie-word-display').className = 'jessie-word-display';

    const isRight     = !!document.querySelector('.answer-correct');
    const goldReward  = isRight
      ? 40 + (GameState.bossesDefeated || 0) * 5
      : 10;
    GameState.gold = (GameState.gold || 0) + goldReward;

    const pun = BLAINE_PUNS[Math.floor(Math.random() * BLAINE_PUNS.length)];
    saveGame();

    if (isRight) {
      SoundEngine.playFanfare();
      showModal(
        '🔥 Correct!',
        `+${goldReward}💰 gold reward!\n\n"${pun}" — Blaine`,
        () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); }
      );
    } else {
      showModal(
        '🔥 Not quite!',
        `+${goldReward}💰 for trying — Blaine appreciates the effort.\n\n"${this._riddle?.blaine_wrong || 'Study harder!'}" — Blaine`,
        () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); }
      );
    }

    this._answered = false;
  },
};

// ─── LEGENDARY ENCOUNTER ENGINE ──────────────────────────────────────────────
// Dedicated engine for Articuno / Zapdos / Moltres encounters.
// Triggered by a 'legendary' map node injected at step 7 on maps bi >= 6.
// Rules: 2 throw attempts maximum, catch rate 15% (Master Ball = 100%).
// After 2 misses the bird flies away. If caught, the legendary card is added
// to the player's active Pokémon deck permanently.

const LEGENDARY_INTROS = {
  144: `A cold wind sweeps through the air. Ice crystals form on every surface. Articuno has appeared!`,
  145: `Static electricity crackles. The sky darkens with storm clouds. Zapdos has appeared!`,
  146: `The temperature spikes. Cinders drift on a burning wind. Moltres has appeared!`,
};
const LEGENDARY_FLEE = {
  144: `Articuno spreads its magnificent wings and soars into the frozen sky, leaving only snowflakes behind.`,
  145: `Zapdos discharges a blinding bolt of lightning and vanishes into the storm clouds above.`,
  146: `Moltres blazes upward into the sky, leaving a trail of sacred fire that fades into embers.`,
};

const LegendaryEncounterEngine = {
  _bird:        null,  // { id, data }
  _throwsLeft:  2,
  _node:        null,

  async start(node) {
    this._node = node;
    const birdIds = WILD_POOL.legendary;
    const id      = birdIds[Math.floor(Math.random() * birdIds.length)];

    showLoading();
    const data = await fetchPoke(id);
    this._bird      = { id, data };
    this._throwsLeft = 2;

    registerPokedex(id, capitalize(data.name), getSpriteUrl(data, true), false);
    hideLoading();

    // Reuse catch screen with legendary-active class
    const bi   = GameState.map?._bossIndex ?? GameState.bossesDefeated ?? 0;
    const bgEl = document.getElementById('catch-bg');
    bgEl.className = 'catch-bg catch-bg-psychic'; // dramatic dark sky

    showScreen('catch');
    document.getElementById('screen-catch').classList.add('legendary-active');

    document.getElementById('catch-title').textContent          = '✨ Legendary Pokémon Appeared!';
    document.getElementById('catch-name').textContent           = '???';
    document.getElementById('catch-name-row').style.opacity     = '0';
    document.getElementById('catch-type-badge').style.display   = 'none';
    document.getElementById('catch-rarity-badge').style.display = 'none';
    document.getElementById('catch-dex-badge').style.display    = 'none';
    document.getElementById('catch-controls').style.display     = 'none';
    document.getElementById('catch-result').style.display       = 'none';
    document.getElementById('catch-ball-wrap').style.display    = 'none';
    document.getElementById('catch-status').textContent         = LEGENDARY_INTROS[id] || 'A legendary Pokémon appeared!';

    const spriteEl = document.getElementById('catch-sprite');
    spriteEl.style.display   = '';
    spriteEl.style.transform = '';
    spriteEl.style.opacity   = '1';
    spriteEl.className       = 'catch-sprite silhouette';

    const spriteUrls = [
      data.sprites?.other?.['official-artwork']?.front_default,
      data.sprites?.other?.home?.front_default,
      data.sprites?.front_default,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    ];
    loadImageWithFallback(spriteEl, spriteUrls, () => {});

    const ball = document.getElementById('catch-ball');
    ball.className = 'catch-ball'; ball.style.transform = '';

    spriteEl.classList.add('catch-entrance');
    setTimeout(() => spriteEl.classList.remove('catch-entrance'), 500);

    // Shake + flash + reveal
    setTimeout(() => { spriteEl.classList.remove('hit-shake'); void spriteEl.offsetWidth; spriteEl.classList.add('hit-shake'); }, 600);
    setTimeout(() => { spriteEl.classList.remove('hit-shake'); void spriteEl.offsetWidth; spriteEl.classList.add('hit-shake'); }, 1100);

    setTimeout(() => {
      const flash = document.createElement('div');
      flash.className = 'catch-flash-overlay';
      document.getElementById('screen-catch').appendChild(flash);
      setTimeout(() => flash.remove(), 220);

      spriteEl.className = 'catch-sprite revealed catch-reveal-pop';
      setTimeout(() => spriteEl.classList.remove('catch-reveal-pop'), 500);

      const pokeName = capitalize(data.name);
      const nameEl   = document.getElementById('catch-name');
      const nameRow  = document.getElementById('catch-name-row');
      nameEl.textContent = '';
      nameRow.style.opacity = '1';
      let ci = 0;
      const iv = setInterval(() => {
        nameEl.textContent += pokeName[ci++];
        if (ci >= pokeName.length) {
          clearInterval(iv);
          const typeStr = data.types?.[0]?.type?.name || 'psychic';
          const typeBadge = document.getElementById('catch-type-badge');
          typeBadge.textContent   = typeStr;
          typeBadge.className     = `catch-type-badge type-${typeStr} catch-badge-slide`;
          typeBadge.style.display = '';
          const rarityBadge = document.getElementById('catch-rarity-badge');
          rarityBadge.textContent   = '✨ Legendary';
          rarityBadge.className     = 'catch-rarity-badge catch-rarity-rare catch-badge-slide';
          rarityBadge.style.display = '';
          document.getElementById('catch-status').textContent = `One chance! Ultra Ball: 40% • Master Ball: 100%`;
          setTimeout(() => {
            document.getElementById('catch-controls').style.display = 'flex';
            CatchEngine._renderBallSelector.call(CatchEngine);
            // Override throw label
            const lbl = document.getElementById('catch-throw-label');
            if (lbl) lbl.textContent = `Throw — One Chance!`;
            // Hide flee button — you can't flee from a legendary
            const fleeBtn = document.getElementById('btn-flee');
            if (fleeBtn) fleeBtn.style.display = 'none';
          }, 400);
        }
      }, 55);
    }, 1500);
  },

  throwBall() {
    if (!this._bird) return;

    const { id, data } = this._bird;
    const pokeName = capitalize(data.name);
    const ball     = document.getElementById('catch-ball');
    const ballWrap = document.getElementById('catch-ball-wrap');
    const spriteEl = document.getElementById('catch-sprite');
    const statusEl = document.getElementById('catch-status');

    // Catch rates: Master Ball = 100%, Ultra Ball = 40%, Poké Ball = 15%
    const isMaster = CatchEngine._selectedBall === 'masterball';
    const isUltra  = CatchEngine._selectedBall === 'ultraball';
    if (isMaster) ItemEngine.useItem('master_ball');
    if (isUltra)  ItemEngine.useItem('ultra_ball');
    const catchRate = isMaster ? 1.0 : isUltra ? 0.40 : 0.15;
    const caught    = Math.random() < catchRate;

    // Colour ball for ultra/master
    if (isUltra)  ball.querySelector('.ball-top').style.background = '#f0c000';
    if (isMaster) {
      ball.querySelector('.ball-top').style.background = '#8020d0';
      ball.querySelector('.ball-bot').style.background = '#e0b0ff';
    }

    document.getElementById('catch-controls').style.display = 'none';
    ballWrap.style.display = 'flex';
    ball.className = 'catch-ball ball-throw';

    setTimeout(() => {
      if (spriteEl) spriteEl.className = 'catch-sprite catch-absorbed';
    }, 550);
    setTimeout(() => {
      ball.className = 'catch-ball ball-landed';
      if (spriteEl) spriteEl.style.display = 'none';
      const wiggles = caught ? 3 : 1;

      // Self-contained wiggle loop — does NOT borrow CatchEngine._runWiggles
      // (that method routes to CatchEngine._showResult, wrong for legendaries).
      let done = 0;
      const wiggle = () => {
        done++;
        ball.className = 'catch-ball'; void ball.offsetWidth;
        ball.className = 'catch-ball ball-wiggle';
        statusEl.textContent = done === 1 ? '...' : done === 2 ? '... ...' : '... ... ...';
        if (done < wiggles) {
          setTimeout(wiggle, 900);
        } else {
          setTimeout(() => this._resolveThrow(caught, ball, statusEl, data), 700);
        }
      };
      setTimeout(wiggle, 400);
    }, 900);
  },

  _resolveThrow(caught, ball, statusEl, data) {
    const { id } = this._bird;
    const pokeName = capitalize(data.name);
    CatchEngine._resetBallVisuals.call(CatchEngine);

    if (caught) {
      ball.className = 'catch-ball ball-caught';
      statusEl.textContent = '';
      SoundEngine.playFanfare();

      const level    = 30 + Math.floor(GameState.bossesDefeated * 3);
      const typeStr  = DUAL_TYPE_OVERRIDES[id] || data.types?.[0]?.type?.name || 'normal';
      const newPoke  = makePokemon(id, level, getSpriteUrl(data), pokeName, typeStr);
      const sigCard  = LEGENDARY_BIRD_CARDS[id];
      if (sigCard && newPoke.deck) newPoke.deck.push({ ...sigCard });

      registerPokedex(id, pokeName, getSpriteUrl(data), true);
      if (!GameState.stats) GameState.stats = {};
      GameState.stats.pokemonCaught = (GameState.stats.pokemonCaught || 0) + 1;

      const resultEl   = document.getElementById('catch-result');
      const resultText = document.getElementById('catch-result-text');
      if (GameState.party.length < 6) {
        GameState.party.push(newPoke);
        saveGame();
        resultText.innerHTML = `<span style="color:#FFD700">★</span> ${pokeName} joined your team!<br><span style="font-size:.5rem;color:#aaa">Legendary card added: ${sigCard?.name || ''}!</span>`;
      } else {
        document.getElementById('catch-ball-wrap').style.display = 'none';
        saveGame();
        resultText.innerHTML = `<span style="color:#FFD700">★</span> ${pokeName} was caught but your party is full. It was released into the wild.`;
      }
      document.getElementById('release-picker').style.display = 'none';
      document.getElementById('btn-catch-continue').style.display = '';
      resultEl.style.display = 'block';
      document.getElementById('screen-catch').classList.remove('legendary-active');
      document.getElementById('btn-flee').style.display = '';
      this._bird = null;

    } else {
      // Miss — bird flees immediately (single attempt)
      ball.className = 'catch-ball ball-burst';
      const spriteEl = document.getElementById('catch-sprite');
      if (spriteEl) {
        spriteEl.style.display = '';
        loadImageWithFallback(spriteEl, [data.sprites?.other?.['official-artwork']?.front_default, data.sprites?.front_default], () => {});
        setTimeout(() => { spriteEl.className = 'catch-sprite revealed catch-runaway'; }, 300);
      }
      setTimeout(() => {
        statusEl.textContent = LEGENDARY_FLEE[id] || `${pokeName} flew away!`;
        const resultEl   = document.getElementById('catch-result');
        const resultText = document.getElementById('catch-result-text');
        resultText.innerHTML = `${pokeName} broke free and returned to the wild.<br><span style="font-size:.5rem;color:#aaa">Use an Ultra Ball or Master Ball next time!</span>`;
        document.getElementById('release-picker').style.display = 'none';
        document.getElementById('btn-catch-continue').style.display = '';
        resultEl.style.display = 'block';
        document.getElementById('screen-catch').classList.remove('legendary-active');
        document.getElementById('btn-flee').style.display = '';
        this._bird = null;
        saveGame();
      }, 1400);
    }
  },

  finish() {
    document.getElementById('screen-catch').classList.remove('legendary-active');
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },
};

// ─── SABRINA JIGSAW ENGINE ────────────────────────────────────────────────────

const SABRINA_INTROS = [
  `${'{name}'}... I already knew you were coming. I took the liberty of borrowing one of your Pokémon. Don't worry — all you have to do is put it back together. Simple, for someone of your... limited capabilities.`,
  `You walk in here with such confidence, ${'{name}'}. Let's test that confidence. I've shattered one of your Pokémon into pieces. Reassemble it, and I'll return it. Fail... and it stays this way.`,
  `Hmm. ${'{name}'}. I've scattered the pieces of your Pokémon's image across the void. Reassemble them correctly — prove your mind is as sharp as your ambition.`,
];

const SabrinaEngine = {
  _isActive:     false,
  _node:         null,
  _pokemonIdx:   null,   // index in party of the targeted Pokémon
  _spriteUrl:    null,
  _pokeName:     '',
  _gridSize:     4,      // 4×4 grid
  _missingCount: 4,      // number of pieces to remove (scales with progress)
  _missingSlots: [],     // [{row, col}] positions that are empty
  _trayPieces:   [],     // [{row, col}] pieces in the tray (shuffled)
  _selectedTray: null,   // index into _trayPieces of selected piece, or null
  _placed:       0,      // how many pieces correctly placed so far

  async start(node) {
    this._node    = node;
    this._isActive = true;
    this._placed  = 0;
    this._selectedTray = null;

    // Scale missing pieces with progress: 3 early, 4 mid, 5 late
    const beaten = GameState.bossesDefeated || 0;
    this._missingCount = beaten < 4 ? 3 : beaten < 7 ? 4 : 5;

    // Pick a living party Pokémon (preferably not the starter)
    const living = GameState.party
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.hp > 0);
    const target = living[Math.floor(Math.random() * living.length)];
    this._pokemonIdx = target?.i ?? GameState.activePokemonIndex;
    const poke = GameState.party[this._pokemonIdx];
    this._pokeName = poke.name;

    // Fetch official artwork — higher resolution = better puzzle
    showLoading();
    try {
      const data = await fetchPoke(poke.id);
      this._spriteUrl = data.sprites?.other?.['official-artwork']?.front_default
                     || data.sprites?.other?.home?.front_default
                     || data.sprites?.front_default
                     || poke.spriteUrl;
    } catch {
      this._spriteUrl = poke.spriteUrl;
    }
    hideLoading();

    // Boss screen intro
    showScreen('boss');
    BossEngine._isRocket = false;
    const bgEl  = document.querySelector('#screen-boss .battle-bg');
    const imgEl = document.querySelector('#screen-boss .battle-bg-img');
    if (bgEl && imgEl) {
      bgEl.classList.add('boss-intro-mode');
      bgEl.style.background = GYM_FALLBACKS[5]; // Sabrina purple
      imgEl.style.opacity   = '0';
      imgEl.onload  = () => { imgEl.style.opacity = '1'; bgEl.style.background = ''; };
      imgEl.onerror = () => { imgEl.style.opacity = '0'; };
      imgEl.src = 'assets/bg_5_boss.png';
    }
    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';
    document.getElementById('boss-party-bar').innerHTML       = '';

    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (trainerImg) trainerImg.src = 'assets/sabrina.png';
    document.getElementById('dialogue-name').textContent = 'Sabrina';
    document.getElementById('dialogue-text').textContent = '';

    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.style.display = 'none';
    document.getElementById('btn-dialogue-next').style.display = 'none';

    const name  = GameState.trainerName || 'Trainer';
    const intro = SABRINA_INTROS[Math.floor(Math.random() * SABRINA_INTROS.length)]
      .replace('{name}', name);
    let ci = 0;
    const iv = setInterval(() => {
      document.getElementById('dialogue-text').textContent += intro[ci++];
      if (ci >= intro.length) {
        clearInterval(iv);
        if (startBtn) { startBtn.style.display = ''; startBtn.textContent = `Save ${this._pokeName}! 🔮`; }
      }
    }, 26);
  },

  startGame() {
    this._isActive = false;
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    document.getElementById('trainer-intro').style.display = 'none';
    this._showPuzzle();
  },

  _showPuzzle() {
    const G = this._gridSize;

    // Pick missing slots randomly
    const allSlots = [];
    for (let r = 0; r < G; r++) for (let c = 0; c < G; c++) allSlots.push({ row: r, col: c });
    this._missingSlots = shuffle([...allSlots]).slice(0, this._missingCount);
    // Tray = shuffled copy of missing slots (same pieces, scrambled order)
    this._trayPieces   = shuffle([...this._missingSlots]);
    this._placed       = 0;
    this._selectedTray = null;

    // Build challenge screen
    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = 'assets/sabrina.png'; img.style.display = ''; }
    document.getElementById('challenge-badge').textContent   = `🔮 Sabrina's Jigsaw — Save ${this._pokeName}!`;
    document.getElementById('challenge-intro').textContent   = `Restore the scattered pieces of ${this._pokeName}.`;
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';
    document.getElementById('challenge-answer-btns').innerHTML      = '';
    document.getElementById('challenge-question').style.display     = 'none';
    document.getElementById('jessie-word-display').style.display    = 'none';

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.remove(
      'jessie-active','james-active','meowth-active','surge-active',
      'erika-active','koga-active','blaine-active','fishing-active');
    document.getElementById('screen-challenge').classList.add('sabrina-active');
    SoundEngine.playBGM('pallet_town_theme.mp3');

    // ── Phase 1: show complete Pokémon for 3s before scrambling ───────────
    const cv = document.getElementById('challenge-coin-visual');
    cv.style.display = 'block';
    cv.className     = 'sabrina-puzzle-wrap';
    cv.innerHTML = `
      <div class="sabrina-phase1" id="sabrina-phase1">
        <img src="${this._spriteUrl}" class="sabrina-preview-sprite" alt="${this._pokeName}" />
        <div class="sabrina-phase1-text">Sabrina's psychic power shatters the image!</div>
      </div>`;

    setTimeout(() => this._buildGrid(), 3000);
  },

  _buildGrid() {
    const G        = this._gridSize;
    const PIECE    = 76;  // px per piece — 4×76 = 304px grid fits on 360px screen
    const SPRITE   = G * PIECE;
    const url      = this._spriteUrl;
    const missing  = new Set(this._missingSlots.map(s => `${s.row},${s.col}`));

    const cv = document.getElementById('challenge-coin-visual');
    cv.innerHTML = '';

    // ── Grid ────────────────────────────────────────────────────────────────
    const gridEl = document.createElement('div');
    gridEl.className = 'sabrina-grid';
    gridEl.style.gridTemplateColumns = `repeat(${G}, ${PIECE}px)`;

    for (let r = 0; r < G; r++) {
      for (let c = 0; c < G; c++) {
        const cell = document.createElement('div');
        const key  = `${r},${c}`;
        if (missing.has(key)) {
          cell.className       = 'sabrina-slot sabrina-slot-empty';
          cell.dataset.row     = r;
          cell.dataset.col     = c;
          cell.style.width     = PIECE + 'px';
          cell.style.height    = PIECE + 'px';
          cell.addEventListener('click', () => this._slotClicked(cell, r, c));
        } else {
          cell.className = 'sabrina-piece sabrina-piece-locked';
          cell.style.cssText = `
            width:${PIECE}px; height:${PIECE}px;
            background-image:url('${url}');
            background-size:${SPRITE}px ${SPRITE}px;
            background-position:-${c*PIECE}px -${r*PIECE}px;`;
        }
        gridEl.appendChild(cell);
      }
    }
    cv.appendChild(gridEl);

    // ── Tray ────────────────────────────────────────────────────────────────
    const trayEl = document.createElement('div');
    trayEl.className = 'sabrina-tray';
    trayEl.id        = 'sabrina-tray';
    this._trayPieces.forEach((pos, idx) => {
      const piece = document.createElement('div');
      piece.className = 'sabrina-piece sabrina-tray-piece';
      piece.dataset.trayIdx = idx;
      piece.dataset.row     = pos.row;
      piece.dataset.col     = pos.col;
      piece.style.cssText = `
        width:${PIECE}px; height:${PIECE}px;
        background-image:url('${url}');
        background-size:${SPRITE}px ${SPRITE}px;
        background-position:-${pos.col*PIECE}px -${pos.row*PIECE}px;`;
      piece.addEventListener('click', () => this._trayClicked(piece, idx));
      trayEl.appendChild(piece);
    });
    cv.appendChild(trayEl);

    // Animate grid entrance
    cv.classList.add('sabrina-grid-entrance');
    setTimeout(() => cv.classList.remove('sabrina-grid-entrance'), 600);
  },

  _trayClicked(pieceEl, trayIdx) {
    // Deselect if already selected
    if (this._selectedTray === trayIdx) {
      pieceEl.classList.remove('sabrina-piece-selected');
      this._selectedTray = null;
      return;
    }
    // Deselect any previously selected piece
    document.querySelectorAll('.sabrina-piece-selected')
      .forEach(el => el.classList.remove('sabrina-piece-selected'));
    pieceEl.classList.add('sabrina-piece-selected');
    this._selectedTray = trayIdx;
  },

  _slotClicked(slotEl, row, col) {
    if (this._selectedTray === null) return; // nothing selected

    const trayPiece = this._trayPieces[this._selectedTray];
    const isCorrect = trayPiece.row === row && trayPiece.col === col;

    if (isCorrect) {
      // ── Correct placement ────────────────────────────────────────────────
      const G      = this._gridSize;
      const PIECE  = 76;
      const SPRITE = G * PIECE;
      const url    = this._spriteUrl;

      // Replace slot with filled piece
      slotEl.className   = 'sabrina-piece sabrina-piece-placed';
      slotEl.style.cssText = `
        width:${PIECE}px; height:${PIECE}px;
        background-image:url('${url}');
        background-size:${SPRITE}px ${SPRITE}px;
        background-position:-${col*PIECE}px -${row*PIECE}px;`;
      slotEl.removeEventListener('click', slotEl._clickHandler);

      // Remove piece from tray
      const trayPieceEl = document.querySelector(`.sabrina-tray-piece[data-tray-idx="${this._selectedTray}"]`);
      if (trayPieceEl) trayPieceEl.remove();
      this._selectedTray = null;
      this._placed++;

      // Flash the slot green briefly
      slotEl.classList.add('sabrina-piece-correct-flash');
      setTimeout(() => slotEl.classList.remove('sabrina-piece-correct-flash'), 600);

      if (this._placed >= this._missingCount) {
        this._complete();
      }
    } else {
      // ── Wrong placement — shake and reject ──────────────────────────────
      slotEl.classList.add('sabrina-slot-wrong');
      setTimeout(() => slotEl.classList.remove('sabrina-slot-wrong'), 500);
      // Deselect piece
      document.querySelectorAll('.sabrina-piece-selected')
        .forEach(el => el.classList.remove('sabrina-piece-selected'));
      this._selectedTray = null;
    }
  },

  _complete() {
    const cv = document.getElementById('challenge-coin-visual');

    // Flash whole grid white
    cv.classList.add('sabrina-complete-flash');
    setTimeout(() => {
      cv.classList.remove('sabrina-complete-flash');

      // Replace grid with full Pokémon reveal + sparkles
      cv.innerHTML = `
        <div class="sabrina-reveal" id="sabrina-reveal">
          <img src="${this._spriteUrl}" class="sabrina-reveal-sprite sabrina-sparkle" alt="${this._pokeName}" />
          <div class="sabrina-reveal-name">${this._pokeName} is free! ✨</div>
        </div>`;

      SoundEngine.playFanfare();

      setTimeout(() => this._finish(true), 2200);
    }, 400);
  },

  _finish(won) {
    this._answered = false;
    document.getElementById('screen-challenge').classList.remove('sabrina-active');
    const cv = document.getElementById('challenge-coin-visual');
    cv.innerHTML = '';
    cv.className = 'challenge-coin-visual';

    if (won) {
      const poke     = GameState.party[this._pokemonIdx];
      const goldReward = 30 + (GameState.bossesDefeated || 0) * 8;
      GameState.gold   = (GameState.gold || 0) + goldReward;

      // XP: +2 levels for the rescued Pokémon
      if (poke) {
        poke.level  += 2;
        poke.maxHp  += 16;
        poke.hp      = Math.min(poke.maxHp, poke.hp + 16);
      }
      saveGame();
      showModal(
        '🔮 Puzzle Complete!',
        `${this._pokeName} was rescued!\n${this._pokeName} gained 2 levels!\n+${goldReward}💰 gold.\n\n"Impressive. Perhaps your mind is worth something after all." — Sabrina`,
        () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); }
      );
    } else {
      MapEngine.completeNode(GameState.currentNodeIndex);
      MapEngine.show();
    }
  },
};

const MysteryEngine = {
  start(node) {
    const beaten = GameState.bossesDefeated || 0;

    const pool = [
      { weight: 3, fn: () => CatchEngine.start(node, 'rare') },
      { weight: 2, fn: () => RocketBattleEngine.start(node) },
    ];
    if (beaten >= 3) pool.push({ weight: 2, fn: () => SurgeEngine.start(node) });
    if (beaten >= 4) pool.push({ weight: 2, fn: () => ErikaEngine.start(node) });
    if (beaten >= 5) pool.push({ weight: 2, fn: () => KogaEngine.start(node) });
    if (beaten >= 6) pool.push({ weight: 2, fn: () => SabrinaEngine.start(node) });
    if (beaten >= 7) pool.push({ weight: 2, fn: () => BlaineEngine.start(node) });

    const total = pool.reduce((s, e) => s + e.weight, 0);
    let roll    = Math.random() * total;
    for (const entry of pool) {
      roll -= entry.weight;
      if (roll <= 0) { entry.fn(); return; }
    }
    pool[0].fn();
  },
};

// ─── ROCKET BATTLE ENGINE ────────────────────────────────────────────────────
// Rocket-specific backgrounds — intro (full portrait) + 3 battle variants (wide landscape)
const ROCKET_INTRO_BG   = 'assets/rocket_intro_bg.png';
const ROCKET_BATTLE_BGS = [
  'assets/rocket_battle_bg_1.png',
  'assets/rocket_battle_bg_2.png',
  'assets/rocket_battle_bg_3.png',
];

const RocketBattleEngine = {
  _script:    [],
  _lineIdx:   0,
  _oppTeam:   [],
  _oppIdx:    0,
  _battleBg:  null,   // chosen battle bg, set in start() used in startBattle()
  bState:     null,
  bossData:   null,

  async start(node) {
    showLoading();

    // ── Pick team based on starter level ─────────────────────────────────────
    const starter = GameState.party.find(p => p.isStarter);
    const lvl     = starter?.level ?? 1;

    // Low < 20: Koffing + Ekans
    // Mid 20–35: Weezing + Arbok
    // High > 35: Weezing + Arbok + Lickitung + Meowth
    let teamIds;
    if (lvl < 20)       teamIds = [109, 23];
    else if (lvl <= 35) teamIds = [110, 24];
    else                teamIds = [110, 24, 108, 52];

    this._oppTeam = [];
    this._oppIdx  = 0;
    const rocketLvl = Math.max(5, lvl - 3 + Math.floor(Math.random() * 4));

    for (const id of teamIds) {
      try {
        const d = await fetchPoke(id);
        if (!d) continue;
        const pType = d.types?.[0]?.type?.name || 'poison';
        const pName = capitalize(d.name) || `Pokémon #${id}`;
        const sprite = getSpriteUrl(d, true) || '';
        this._oppTeam.push(makePokemon(id, rocketLvl, sprite, pName, pType));
      } catch(e) {
        console.warn(`fetchPoke failed for id ${id}:`, e);
        this._oppTeam.push(makePokemon(id, rocketLvl, '', `Pokémon #${id}`, 'poison'));
      }
    }

    if (this._oppTeam.length === 0) {
      this._oppTeam = teamIds.map(id =>
        makePokemon(id, rocketLvl, '', `Pokémon #${id}`, 'poison')
      );
    }

    // Pick a random battle bg now so it's consistent for the whole encounter
    this._battleBg = ROCKET_BATTLE_BGS[Math.floor(Math.random() * ROCKET_BATTLE_BGS.length)];

    this._script  = ROCKET_SCRIPTS[Math.floor(Math.random() * ROCKET_SCRIPTS.length)];
    this._lineIdx = 0;
    this.bossData = { name: 'Team Rocket' };

    hideLoading();
    showScreen('boss');
    BossEngine._isRocket = true;

    // ── Set full-portrait intro background ───────────────────────────────────
    const bgEl  = document.querySelector('#screen-boss .battle-bg');
    const imgEl = document.querySelector('#screen-boss .battle-bg-img');
    if (bgEl && imgEl) {
      bgEl.classList.add('boss-intro-mode');
      bgEl.style.background = 'linear-gradient(180deg,#1a0808 0%,#2a1010 100%)';
      imgEl.style.opacity = '0';
      imgEl.onload  = () => { imgEl.style.opacity = '1'; bgEl.style.background = ''; };
      imgEl.onerror = () => { imgEl.style.opacity = '0'; };
      imgEl.src = ROCKET_INTRO_BG;
    }

    document.getElementById('boss-party-bar').innerHTML =
      this._oppTeam.map((_,i) => `<div class="boss-poke-pip" id="boss-pip-${i}"></div>`).join('');

    const introEl  = document.getElementById('trainer-intro');
    const battleEl = document.getElementById('boss-battle-area');
    if (introEl)  introEl.style.display  = 'flex';
    if (battleEl) battleEl.style.display = 'none';

    this._showLine(0);
  },

  // ── Render one dialogue line ──────────────────────────────────────────────
  _showLine(idx) {
    const script    = this._script;
    const line      = script[idx];
    const trainerName = GameState.trainerName || 'Trainer';
    const text      = line.text.replace(/\$\{name\}/g, trainerName);
    const isLast    = idx === script.length - 1;

    // Portrait
    const wrap = document.getElementById('trainer-sprite-wrap');
    const img  = document.getElementById('boss-trainer-sprite');
    if (img) {
      img.src = line.img;
      img.onerror = () => {
        img.onerror = null;
        wrap.innerHTML = `<div style="font-size:4rem;line-height:1">👤</div>`;
      };
    }

    // Text — typewriter effect
    const nameEl = document.getElementById('dialogue-name');
    const textEl = document.getElementById('dialogue-text');
    const nextBtn  = document.getElementById('btn-dialogue-next');
    const startBtn = document.getElementById('btn-start-boss-battle');

    nameEl.textContent = line.name;
    textEl.textContent = '';

    // Hide both buttons while typing
    if (nextBtn)  nextBtn.style.display  = 'none';
    if (startBtn) startBtn.style.display = 'none';

    // Typewriter
    let ci = 0;
    const interval = setInterval(() => {
      textEl.textContent += text[ci];
      ci++;
      if (ci >= text.length) {
        clearInterval(interval);
        // Show correct button after typing completes
        if (isLast) {
          if (startBtn) startBtn.style.display = '';
          if (nextBtn)  nextBtn.style.display  = 'none';
        } else {
          if (nextBtn)  nextBtn.style.display  = '';
          if (startBtn) startBtn.style.display = 'none';
        }
      }
    }, 28);

    this._lineIdx = idx;
  },

  // ── Player taps Next ─────────────────────────────────────────────────────
  advanceDialogue() {
    const next = this._lineIdx + 1;
    if (next < this._script.length) {
      this._showLine(next);
    }
  },

  // ── Start the actual battle (called by btn-start-boss-battle) ─────────────
  startBattle() {
    document.getElementById('trainer-intro').style.display    = 'none';
    document.getElementById('boss-battle-area').style.display = 'block';

    // Swap from full-portrait intro bg to the chosen wide battle bg
    const bgEl  = document.querySelector('#screen-boss .battle-bg');
    const imgEl = document.querySelector('#screen-boss .battle-bg-img');
    if (bgEl && imgEl) {
      bgEl.classList.remove('boss-intro-mode');
      imgEl.style.opacity = '1';
      imgEl.onerror = () => { imgEl.style.opacity = '0'; };
      imgEl.src = this._battleBg;
    }

    BossEngine.bossData = this.bossData;
    BossEngine.oppTeam  = this._oppTeam;
    BossEngine.oppIdx   = 0;
    BossEngine._loadNextOpp();
  },

  // Delegate log, render etc. to BossEngine at battle time
  _log(m)   { BossEngine._log(m); },
  _render() { BossEngine._render(); },
};

const GameOver = {
  show(defeatedBy) {
    const stats = GameState.stats || {};
    const party = GameState.party || [];

    // Favourite = party member with most battlesWon, fallback to starter
    const fav = party.reduce((best, p) =>
      (p.battlesWon || 0) >= (best.battlesWon || 0) ? p : best,
      party[0] || null
    );

    // Populate stats — use cumulative fields that persist across maps
    document.getElementById('gameover-defeated-by').textContent =
      `Defeated by ${defeatedBy}`;
    document.getElementById('go-battles-won').textContent =
      stats.totalBattlesWon    || stats.battlesWon   || 0;
    document.getElementById('go-caught').textContent =
      stats.pokemonCaught      || 0;
    document.getElementById('go-nodes').textContent =
      stats.totalNodesCompleted || GameState.completedNodes?.length || 0;
    document.getElementById('go-bosses').textContent =
      stats.totalBossesBeaten  || GameState.bossesDefeated || 0;

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
    SoundEngine.stopSFX();
    deleteSave();
    GameState = null;
    showScreen('start');
  },
};

// ─── CATCH ENGINE ────────────────────────────────────────────────────────────

// Type-flavoured flee lines
const FLEE_LINES = {
  water:    ['dived back into the water!',    'splashed away!',           'slipped back into the depths!'],
  fire:     ['blazed off into the distance!', 'vanished in a flash of flame!', 'was too hot to hold!'],
  grass:    ['disappeared into the tall grass!','rustled away into the leaves!', 'melted back into the forest!'],
  electric: ['zapped away in a flash!',       'discharged and vanished!',  'was too fast to catch!'],
  rock:     ['rolled away!',                  'burrowed under the rocks!', 'was too tough for the ball!'],
  ground:   ['dug back underground!',         'burrowed away!',            'vanished into the earth!'],
  poison:   ['slithered away into the shadows!','dissolved into the mist!', 'was too slippery to hold!'],
  psychic:  ['teleported away!',              'vanished with a flash of light!','was too clever to stay!'],
  ghost:    ['phased right through the ball!','vanished into thin air!',   'dissolved into shadow!'],
  ice:      ['slid away across the ice!',     'melted into the frost!',    'was too cold to catch!'],
  flying:   ['took flight and disappeared!',  'soared out of reach!',      'glided away on the wind!'],
  fighting: ['punched the ball away!',        'leaped out of reach!',      'was too strong to hold!'],
  dragon:   ['roared and flew away!',         'vanished into the clouds!', 'was way too powerful!'],
  dark:     ['slipped away into the shadows!','disappeared without a trace!','was too cunning to catch!'],
  steel:    ['clinked away into the rocks!',  'deflected the ball!',       'was too hard to contain!'],
  fairy:    ['sparkled and vanished!',        'skipped away on the breeze!','left only glitter behind!'],
  bug:      ['scurried away into the grass!', 'flew off into the trees!',  'was too quick and nimble!'],
  normal:   ['broke free and ran away!',      'escaped into the wild!',    'bolted off at full speed!'],
};

// Environment backdrop CSS classes per bossIndex — matches MAP_THEMES
const CATCH_BACKDROPS = [
  'catch-bg-rock',     // 0 Brock
  'catch-bg-water',    // 1 Misty
  'catch-bg-electric', // 2 Lt Surge
  'catch-bg-grass',    // 3 Erika
  'catch-bg-poison',   // 4 Koga
  'catch-bg-psychic',  // 5 Sabrina
  'catch-bg-fire',     // 6 Blaine
  'catch-bg-dark',     // 7 Giovanni
];

const CatchEngine = {
  current:       null,
  _caught:       false,
  _selectedBall: 'pokeball',
  _pendingCatch: null,
  _speciesData:  null,  // cached from species endpoint

  async start(node, forceRarity) {
    showLoading();
    const hasRepel = ItemEngine.hasItem('repel');
    const hasLure  = ItemEngine.hasItem('lure');
    let rarity, pool;
    const roll = Math.random();
    // forceRarity may be a node.catchRarity string ('common','uncommon','rare') or 'rare' from mystery
    if (forceRarity === 'rare' || forceRarity === 'rare ✨') {
      rarity = 'Rare ✨'; pool = WILD_POOL.rare;
    } else if (forceRarity === 'uncommon') {
      rarity = 'Uncommon'; pool = WILD_POOL.uncommon;
    } else if (forceRarity === 'common') {
      rarity = 'Common'; pool = WILD_POOL.common;
    } else if (hasLure && Math.random() < 0.3) {
      rarity = 'Rare ✨'; pool = WILD_POOL.rare;
    } else if (hasRepel) {
      rarity = Math.random() < 0.7 ? 'Uncommon' : 'Rare ✨';
      pool   = rarity === 'Uncommon' ? WILD_POOL.uncommon : WILD_POOL.rare;
      ItemEngine.useItem('repel');
    } else {
      if (roll < .6)      { rarity = 'Common';     pool = WILD_POOL.common; }
      else if (roll < .9) { rarity = 'Uncommon';   pool = WILD_POOL.uncommon; }
      else                { rarity = 'Rare ✨';    pool = WILD_POOL.rare; }
    }
    const id   = pool[Math.floor(Math.random() * pool.length)];
    const data = await fetchPoke(id);
    // Fetch species data for flavour text (non-blocking — we await it here but catch errors)
    this._speciesData = await fetch(data.species?.url || `https://pokeapi.co/api/v2/pokemon-species/${id}/`)
      .then(r => r.json()).catch(() => null);

    this.current       = { data, rarity, id };
    this._caught       = false;
    this._selectedBall = 'pokeball';
    this._pendingCatch = null;
    registerPokedex(id, capitalize(data.name), getSpriteUrl(data, true), false);
    hideLoading();

    // ── Set environment backdrop ───────────────────────────────────────────
    const bi      = GameState.map?._bossIndex ?? GameState.bossesDefeated ?? 0;
    const bgEl    = document.getElementById('catch-bg');
    bgEl.className = 'catch-bg ' + (CATCH_BACKDROPS[Math.min(bi, CATCH_BACKDROPS.length - 1)] || '');

    // ── Reset all UI ───────────────────────────────────────────────────────
    showScreen('catch');
    document.getElementById('catch-title').textContent          = 'Wild Pokémon Appeared!';
    document.getElementById('catch-name').textContent           = '???';
    document.getElementById('catch-name-row').style.opacity     = '0';
    document.getElementById('catch-type-badge').style.display   = 'none';
    document.getElementById('catch-rarity-badge').style.display = 'none';
    document.getElementById('catch-controls').style.display     = 'none';
    document.getElementById('catch-result').style.display       = 'none';
    document.getElementById('catch-ball-wrap').style.display    = 'none';
    document.getElementById('catch-status').textContent         = '';
    const pdxOverlay = document.getElementById('pdx-modal-overlay');
    if (pdxOverlay) { pdxOverlay.style.display = 'none'; pdxOverlay.classList.remove('pdx-modal-in'); }

    const spriteEl = document.getElementById('catch-sprite');
    spriteEl.style.display   = '';
    spriteEl.style.transform = '';
    spriteEl.style.opacity   = '1';
    spriteEl.className       = 'catch-sprite silhouette';

    // Load sprite into silhouette
    const spriteUrls = [
      data.sprites?.other?.['official-artwork']?.front_default,
      data.sprites?.other?.home?.front_default,
      data.sprites?.front_default,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
    ];
    loadImageWithFallback(spriteEl, spriteUrls, () => {
      document.getElementById('catch-sprite-wrap').innerHTML =
        '<div class="catch-placeholder silhouette-placeholder"><svg viewBox="0 0 100 100" width="180" height="180" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="65" rx="30" ry="22" fill="#fff"/><circle cx="50" cy="35" r="22" fill="#fff"/><ellipse cx="28" cy="58" rx="10" ry="7" fill="#fff" transform="rotate(-20 28 58)"/><ellipse cx="72" cy="58" rx="10" ry="7" fill="#fff" transform="rotate(20 72 58)"/></svg></div>';
    });

    const ball = document.getElementById('catch-ball');
    ball.className = 'catch-ball'; ball.style.transform = '';

    // ── Entrance animation — silhouette shakes then flashes ───────────────
    // Phase 1: silhouette slides in from off-bottom (0.4s)
    spriteEl.classList.add('catch-entrance');
    setTimeout(() => spriteEl.classList.remove('catch-entrance'), 500);

    // Phase 2: two shakes at 600ms and 900ms
    setTimeout(() => {
      spriteEl.classList.remove('hit-shake'); void spriteEl.offsetWidth;
      spriteEl.classList.add('hit-shake');
    }, 600);
    setTimeout(() => {
      spriteEl.classList.remove('hit-shake'); void spriteEl.offsetWidth;
      spriteEl.classList.add('hit-shake');
    }, 1050);

    // Phase 3: flash + reveal at 1500ms
    setTimeout(() => {
      // White flash overlay
      const flash = document.createElement('div');
      flash.className = 'catch-flash-overlay';
      document.getElementById('screen-catch').appendChild(flash);
      setTimeout(() => flash.remove(), 220);

      // Reveal sprite
      spriteEl.className = 'catch-sprite revealed catch-reveal-pop';
      setTimeout(() => spriteEl.classList.remove('catch-reveal-pop'), 500);

      // Typewriter name reveal
      const pokeName = capitalize(data.name);
      const nameEl   = document.getElementById('catch-name');
      const nameRow  = document.getElementById('catch-name-row');
      nameEl.textContent = '';
      nameRow.style.opacity = '1';
      nameRow.style.transition = 'opacity .3s';
      let ci = 0;
      const typeInterval = setInterval(() => {
        nameEl.textContent += pokeName[ci];
        ci++;
        if (ci >= pokeName.length) {
          clearInterval(typeInterval);
          // Slide in type badge
          const typeStr  = data.types?.[0]?.type?.name || 'normal';
          const typeBadge = document.getElementById('catch-type-badge');
          typeBadge.textContent  = typeStr;
          typeBadge.className    = `catch-type-badge type-${typeStr} catch-badge-slide`;
          typeBadge.style.display = '';
          // Slide in rarity badge
          const rarityBadge = document.getElementById('catch-rarity-badge');
          rarityBadge.textContent  = rarity;
          rarityBadge.className    = `catch-rarity-badge catch-rarity-${rarity.includes('Rare') ? 'rare' : rarity === 'Uncommon' ? 'uncommon' : 'common'} catch-badge-slide`;
          rarityBadge.style.display = '';
          // Already-caught badge — show if this species is in the Pokédex already
          const dexBadge = document.getElementById('catch-dex-badge');
          if (dexBadge) {
            const alreadyCaught = !!loadPokedex()[data.id]?.caught;
            dexBadge.style.display = alreadyCaught ? '' : 'none';
          }
          // Show controls after name fully revealed
          setTimeout(() => {
            document.getElementById('catch-controls').style.display = 'flex';
            this._renderBallSelector();
          }, 400);
        }
      }, 55); // ~55ms per character
    }, 1500);
  },

  _renderBallSelector() {
    const sel = document.getElementById('ball-selector');
    if (!sel) return;
    sel.innerHTML = '';
    const balls = [
      { id: 'pokeball',   label: 'Poké Ball',   pbi: true },
      { id: 'ultraball',  label: 'Ultra Ball',  icon: '🟡', itemId: 'ultra_ball' },
      { id: 'masterball', label: 'Master Ball', icon: '🟣', itemId: 'master_ball' },
    ];
    // Always default to pokeball if current selection is no longer available
    if (this._selectedBall !== 'pokeball' && !ItemEngine.hasItem(
      balls.find(b => b.id === this._selectedBall)?.itemId
    )) {
      this._selectedBall = 'pokeball';
    }
    balls.forEach(b => {
      if (!b.pbi && !ItemEngine.hasItem(b.itemId)) return;
      const count = b.itemId
        ? ((GameState.items || []).find(i => i.id === b.itemId)?.count || 0)
        : null;
      const countTag = count !== null ? ` <span class="ball-count-tag">×${count}</span>` : '';
      const btn = document.createElement('button');
      btn.className = 'ball-select-btn' + (this._selectedBall === b.id ? ' ball-selected' : '');
      btn.innerHTML = b.pbi
        ? `<span class="pokeball-icon" style="width:20px;height:20px"><span class="pbi-top"></span><span class="pbi-mid"></span><span class="pbi-bot"></span><span class="pbi-btn"></span></span> ${b.label}`
        : `${b.icon} ${b.label}${countTag}`;
      btn.onclick = () => {
        this._selectedBall = b.id;
        this._renderBallSelector();
        const lbl = document.getElementById('catch-throw-label');
        if (lbl) lbl.textContent = `Throw ${b.label}!`;
      };
      sel.appendChild(btn);
    });
    // Sync throw button label to current selection
    const currentBall = balls.find(b => b.id === this._selectedBall);
    const lbl = document.getElementById('catch-throw-label');
    if (lbl && currentBall) lbl.textContent = `Throw ${currentBall.label}!`;
  },

  _resetBallVisuals() {
    // Reset CSS ball colours back to default red pokeball
    const ball = document.getElementById('catch-ball');
    if (!ball) return;
    const top = ball.querySelector('.ball-top');
    const bot = ball.querySelector('.ball-bot');
    if (top) top.style.background = '';
    if (bot) bot.style.background = '';
  },

  throwBall() {
    if (!this.current) return;
    document.getElementById('catch-controls').style.display = 'none';
    const { rarity, data } = this.current;
    let catchRate;
    if (this._selectedBall === 'masterball') {
      catchRate = 1.0; ItemEngine.useItem('master_ball');
    } else {
      const base       = rarity.startsWith('Rare') ? .25 : rarity === 'Uncommon' ? .5 : .75;
      const ultraBoost = (this._selectedBall === 'ultraball' && !rarity.startsWith('Common')) ? .5 : 0;
      catchRate = Math.min(0.95, base + ultraBoost);
      if (this._selectedBall === 'ultraball') ItemEngine.useItem('ultra_ball');
    }
    const caught   = Math.random() < catchRate;
    this._caught   = caught;
    const wiggles  = caught ? 3 : Math.floor(Math.random() * 3) + 1;
    const ball     = document.getElementById('catch-ball');
    const ballWrap = document.getElementById('catch-ball-wrap');
    const spriteEl = document.getElementById('catch-sprite');
    const statusEl = document.getElementById('catch-status');
    // Colour the ball based on type used
    if (this._selectedBall === 'ultraball') {
      ball.querySelector('.ball-top').style.background = '#f0c000';
    } else if (this._selectedBall === 'masterball') {
      ball.querySelector('.ball-top').style.background = '#8020d0';
      ball.querySelector('.ball-bot').style.background = '#e0b0ff';
    }
    // Reset selection back to pokeball immediately after throwing
    this._selectedBall = 'pokeball';

    ballWrap.style.display = 'flex';
    ball.className = 'catch-ball ball-throw';
    setTimeout(() => {
      if (spriteEl) spriteEl.className = 'catch-sprite catch-absorbed';
      const ph = document.querySelector('.catch-placeholder');
      if (ph) ph.style.animation = 'absorb .5s ease-in forwards';
    }, 550);
    setTimeout(() => {
      ball.className = 'catch-ball ball-landed';
      if (spriteEl) spriteEl.style.display = 'none';
      const ph = document.querySelector('.catch-placeholder');
      if (ph) ph.style.display = 'none';
      this._runWiggles(ball, statusEl, wiggles, caught, data);
    }, 900);
  },

  _runWiggles(ball, statusEl, total, caught, data) {
    let done = 0;
    const next = () => {
      done++; ball.className = 'catch-ball'; void ball.offsetWidth;
      ball.className = 'catch-ball ball-wiggle';
      statusEl.textContent = done === 1 ? '...' : done === 2 ? '... ...' : '... ... ...';
      if (done < total) setTimeout(next, 900);
      else setTimeout(() => this._showResult(ball, statusEl, caught, data), 700);
    };
    setTimeout(next, 400);
  },

  _showResult(ball, statusEl, caught, data) {
    const pokeName    = capitalize(data.name);
    const spriteEl    = document.getElementById('catch-sprite');
    const resultEl    = document.getElementById('catch-result');
    const resultText  = document.getElementById('catch-result-text');
    const releaseEl   = document.getElementById('release-picker');
    const continueBtn = document.getElementById('btn-catch-continue');
    this._resetBallVisuals();

    if (caught) {
      ball.className = 'catch-ball ball-caught';
      statusEl.textContent = '';
      const level     = 5 + GameState.bossesDefeated * 5 + Math.floor(Math.random() * 5);
      const typeStr   = data.types?.[0]?.type?.name || 'normal';
      const newPoke   = makePokemon(data.id, level, getSpriteUrl(data), pokeName, typeStr);
      const isNewDex  = !loadPokedex()[data.id]?.caught;
      registerPokedex(data.id, pokeName, getSpriteUrl(data), true);

      setTimeout(async () => {
        SoundEngine.playFanfare();

        if (GameState.party.length < 6) {
          // ── Normal catch ────────────────────────────────────────────────
          if (!GameState.stats) GameState.stats = { battlesWon: 0, pokemonCaught: 0 };
          GameState.stats.pokemonCaught++;
          GameState.party.push(newPoke);
          saveGame();

          resultText.innerHTML = `<span style="color:#FFD700">★</span> Gotcha! ${pokeName} joined your team!`;
          releaseEl.style.display = 'none';
          continueBtn.style.display = '';
          resultEl.style.display = 'block';

          // Show Pokédex card
          await this._showPokedexCard(data, newPoke, isNewDex);

        } else {
          // ── Party full — hide ball so release picker is unobstructed ────
          document.getElementById('catch-ball-wrap').style.display = 'none';
          this._pendingCatch = newPoke;

          resultText.innerHTML =
            `<span style="color:#FFD700">★</span> Gotcha! <strong>${pokeName}</strong> was caught!<br>` +
            `<span style="font-size:.6rem;color:var(--col-text-dim)">Party is full — release one to make room, or let ${pokeName} go.</span>`;
          resultEl.style.display = 'block';

          // Show Pokédex card; once dismissed, show release picker
          await this._showPokedexCard(data, newPoke, isNewDex);

          // Build release grid after card is dismissed
          const grid = document.getElementById('release-party-grid');
          grid.innerHTML = '';
          GameState.party.forEach((p, i) => {
            const card = document.createElement('button');
            card.className = 'release-party-card';
            card.innerHTML = `
              <img src="${p.spriteUrl}" alt="${p.name}"
                   onerror="this.src='assets/sprites/${p.id}.png'"
                   class="release-party-sprite" />
              <div class="release-party-name">${p.name}</div>
              <div class="release-party-lv">Lv.${p.level}</div>
              <div class="release-party-hp">${Math.max(0,p.hp)}/${p.maxHp} HP</div>
              <div class="release-party-label">Release</div>
            `;
            card.onclick = () => this._releasePokemon(i, newPoke);
            grid.appendChild(card);
          });
          releaseEl.style.display = 'block';
          continueBtn.textContent = `Let ${pokeName} go`;
          continueBtn.style.display = '';
        }
      }, 600);

    } else {
      // ── Escaped ────────────────────────────────────────────────────────
      ball.className = 'catch-ball ball-burst';
      statusEl.textContent = '';
      releaseEl.style.display = 'none';
      continueBtn.style.display = '';

      // Type-flavoured flee text
      const typeStr   = data.types?.[0]?.type?.name || 'normal';
      const fleePool  = FLEE_LINES[typeStr] || FLEE_LINES.normal;
      const fleeLine  = fleePool[Math.floor(Math.random() * fleePool.length)];

      setTimeout(() => {
        if (spriteEl) {
          spriteEl.style.display = '';
          loadImageWithFallback(spriteEl, [
            data.sprites?.other?.['official-artwork']?.front_default,
            data.sprites?.front_default,
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`,
          ], () => { spriteEl.style.display = 'none'; });
          spriteEl.className = 'catch-sprite revealed catch-escape';
        }
        statusEl.textContent = `${pokeName} ${fleeLine}`;
      }, 300);
      setTimeout(() => {
        resultText.innerHTML = `Oh no! ${pokeName} ${fleeLine}`;
        resultEl.style.display = 'block';
        if (spriteEl) spriteEl.className = 'catch-sprite catch-runaway';
      }, 1400);
    }
  },

  // Shows the Pokédex modal and returns a Promise that resolves when "Got it!" is pressed
  async _showPokedexCard(data, poke, isNewDex) {
    await showPokedexCard(data, isNewDex, null);
  },

  _releasePokemon(releaseIdx, newPoke) {
    const released = GameState.party[releaseIdx];
    GameState.party.splice(releaseIdx, 1, newPoke);
    // If the released Pokémon was active, reset active index
    if (GameState.activePokemonIndex === releaseIdx) {
      GameState.activePokemonIndex = 0;
    } else if (GameState.activePokemonIndex > releaseIdx) {
      GameState.activePokemonIndex--;
    }
    if (!GameState.stats) GameState.stats = { battlesWon: 0, pokemonCaught: 0 };
    GameState.stats.pokemonCaught++;
    saveGame();
    // Update UI
    const grid = document.getElementById('release-party-grid');
    if (grid) grid.innerHTML = '';
    const releaseEl = document.getElementById('release-picker');
    if (releaseEl) releaseEl.style.display = 'none';
    const resultText = document.getElementById('catch-result-text');
    if (resultText) {
      resultText.innerHTML =
        `<span style="color:#FFD700">★</span> ${newPoke.name} joined your party!<br>` +
        `<span style="font-size:.65rem;color:var(--col-text-dim)">${released.name} was released. Goodbye!</span>`;
    }
    const continueBtn = document.getElementById('btn-catch-continue');
    if (continueBtn) continueBtn.textContent = 'Continue ▶';
    this._pendingCatch = null;
  },

  finish() {
    this._pendingCatch = null;
    const continueBtn = document.getElementById('btn-catch-continue');
    if (continueBtn) continueBtn.textContent = 'Continue ▶';
    const releaseEl = document.getElementById('release-picker');
    if (releaseEl) releaseEl.style.display = 'none';
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },
  flee() {
    this._pendingCatch = null;
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },
};

// ─── ITEM ENGINE ─────────────────────────────────────────────────────────────

const ItemEngine = {

  // ── Show a toast notification over the battle screen ────────────────────
  showBattleToast(msg, isBoss = false) {
    const id  = isBoss ? 'boss-battle-item-toast' : 'battle-item-toast';
    const el  = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('toast-show');
    void el.offsetWidth;
    el.classList.add('toast-show');
    clearTimeout(el._toastTimer);
    el._toastTimer = setTimeout(() => el.classList.remove('toast-show'), 2200);
  },

  // ── Bag bar (map header) ─────────────────────────────────────────────────
  renderBagBar() {
    const bar = document.getElementById('bag-bar');
    if (!bar) return;
    bar.innerHTML = '';

    // Lure active indicator
    if (GameState.lureActive) {
      const pill = document.createElement('div');
      pill.className = 'bag-pill bag-pill-lure';
      pill.innerHTML = `<span class="bag-pill-icon">🎣</span><span class="bag-pill-label">Lure</span>`;
      pill.title = 'Lure active — Rare encounters boosted this map';
      bar.appendChild(pill);
    }

    const consumables = (GameState.items || []).filter(i => {
      const def = SHOP_ITEMS.find(s => s.id === i.id);
      return def && def.category !== 'held' && def.category !== 'ball' && i.count > 0;
    });
    consumables.forEach(item => {
      if (item.id === 'lure') return;
      const def = SHOP_ITEMS.find(s => s.id === item.id);
      const isStone = def?.category === 'stone';
      // Only show Use button for stones, and only if Eevee hasn't evolved yet
      const showUse = isStone && !GameState.eeveeEvolution;

      const pill = document.createElement('div');
      pill.className = 'bag-pill' + (isStone ? ' bag-pill-stone' : '');
      pill.innerHTML = `
        <span class="bag-pill-icon">${item.icon || def?.icon || '📦'}</span>
        <span class="bag-pill-label">${isStone ? (def?.name || item.id) : ''}</span>
        ${showUse
          ? `<button class="btn-pixel bag-stone-use-btn" data-stone="${item.id}">Use</button>`
          : (item.count > 1 ? `<span class="bag-pill-count">×${item.count}</span>` : '')
        }
      `;
      pill.title = def ? `${def.name} — ${def.description}` : item.id;

      if (showUse) {
        pill.querySelector('.bag-stone-use-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          const target = def.stoneTarget;
          showModal(
            `${def.icon} Use ${def.name}?`,
            `Eevee will evolve into ${target.name} (${target.type}-type) right now.\n\nYour deck will be rebuilt. This cannot be undone.`,
            () => stoneEvolve(item.id)
          );
        });
      }

      bar.appendChild(pill);
    });
  },

  // ── Held item helpers ────────────────────────────────────────────────────
  getHeldItem(pokemon)  { return pokemon?.heldItem || null; },

  equipItem(pokemon, itemId) {
    const def = SHOP_ITEMS.find(s => s.id === itemId);
    if (!def || def.category !== 'held') return false;
    if (pokemon.heldItem) this.addItem(pokemon.heldItem.id);
    pokemon.heldItem = { ...def };
    this.useItem(itemId);
    saveGame();
    return true;
  },

  unequipItem(pokemon) {
    if (!pokemon.heldItem) return;
    this.addItem(pokemon.heldItem.id);
    pokemon.heldItem = null;
    saveGame();
  },

  moveHeldItem(fromPoke, toPoke) {
    if (!fromPoke.heldItem) return;
    const item = fromPoke.heldItem;
    if (toPoke.heldItem) this.addItem(toPoke.heldItem.id);
    toPoke.heldItem   = item;
    fromPoke.heldItem = null;
    saveGame();
  },

  // ── Oran Berry — passive, starter only, 20HP, visible toast ─────────────
  checkBerryMidBattle(st, who, isBoss = false) {
    // Only apply to the starter
    const starter = GameState.party.find(p => p.isStarter);
    if (!starter) return null;
    const activeIsStarter = GameState.party[GameState.activePokemonIndex]?.isStarter;
    if (!activeIsStarter) return null;

    const berries = (GameState.items || []).filter(i => i.id === 'oran_berry' && i.count > 0);
    if (!berries.length) return null;

    if (st[who].hp > 0 && st[who].hp < st[who].maxHp * 0.5) {
      const heal = 20;
      st[who].hp = Math.min(st[who].maxHp, st[who].hp + heal);
      berries[0].count--;
      if (berries[0].count <= 0)
        GameState.items = GameState.items.filter(i => !(i.id === 'oran_berry' && i.count <= 0));
      this.renderBagBar();
      const msg = `🍊 Oran Berry! ${st[who].name} healed ${logHeal(20)} HP!`;
      this.showBattleToast(msg, isBoss);
      return msg;
    }
    return null;
  },

  // ── Active potion use — called from Use Item button ──────────────────────
  // Returns { healed, msg } or null if no potions available
  usePotion(st, isBoss = false) {
    const items = GameState.items || [];
    // Prefer Super Potion if available, else Potion
    let item = items.find(i => i.id === 'super_potion' && i.count > 0)
            || items.find(i => i.id === 'potion'       && i.count > 0);
    if (!item) return null;

    const healAmt = item.id === 'super_potion' ? 60 : 30;
    const before  = st.player.hp;
    st.player.hp  = Math.min(st.player.maxHp, st.player.hp + healAmt);
    const actual  = st.player.hp - before;

    item.count--;
    if (item.count <= 0) GameState.items = GameState.items.filter(i => i !== item);
    this.renderBagBar();
    saveGame();

    const icon = item.id === 'super_potion' ? '💉' : '💊';
    const msg  = `${icon} ${item.id === 'super_potion' ? 'Super Potion' : 'Potion'}! ${st.player.name} healed ${logHeal(actual)} HP!`;
    this.showBattleToast(msg, isBoss);
    return { healed: actual, msg };
  },

  // Returns true if any potion is in the bag
  hasPotions() {
    return (GameState.items || []).some(i =>
      (i.id === 'potion' || i.id === 'super_potion') && i.count > 0
    );
  },

  // ── Show/hide the in-battle item picker ──────────────────────────────────
  renderItemPicker(isBoss, onUse) {
    const pickerId = isBoss ? 'boss-battle-item-picker' : 'battle-item-picker';
    const picker   = document.getElementById(pickerId);
    if (!picker) return;

    // Build list of usable bag items (potions only for now)
    const usable = (GameState.items || []).filter(i =>
      (i.id === 'potion' || i.id === 'super_potion') && i.count > 0
    );

    if (usable.length === 0) {
      picker.innerHTML = '<div class="item-picker-empty">No usable items!</div>';
      picker.style.display = 'block';
      setTimeout(() => { picker.style.display = 'none'; }, 1200);
      return;
    }

    picker.innerHTML = '';
    usable.forEach(item => {
      const def  = SHOP_ITEMS.find(s => s.id === item.id);
      const btn  = document.createElement('button');
      btn.className = 'item-picker-btn';
      btn.innerHTML = `<span class="item-picker-icon">${item.icon}</span>
                       <span class="item-picker-name">${item.name}</span>
                       <span class="item-picker-count">×${item.count}</span>`;
      btn.onclick = () => {
        picker.style.display = 'none';
        onUse(item.id);
      };
      picker.appendChild(btn);
    });

    // Close button
    const close = document.createElement('button');
    close.className = 'item-picker-close';
    close.textContent = '✕';
    close.onclick = () => { picker.style.display = 'none'; };
    picker.appendChild(close);

    picker.style.display = 'block';
  },

  closeItemPicker(isBoss) {
    const id = isBoss ? 'boss-battle-item-picker' : 'battle-item-picker';
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  },

  // ── Revive Potion ────────────────────────────────────────────────────────
  checkRevive(partyIdx) {
    if (!GameState.items) return false;
    const revive = GameState.items.find(i => i.id === 'revive_potion' && i.count > 0);
    if (!revive) return false;
    const p = GameState.party[partyIdx];
    p.hp = Math.floor(p.maxHp * 0.3);
    revive.count--;
    if (revive.count <= 0) GameState.items = GameState.items.filter(i => i !== revive);
    this.renderBagBar();
    return true;
  },

  // ── Focus Sash ───────────────────────────────────────────────────────────
  checkFocusSash(st, who, battleObj) {
    const poke = who === 'player' ? GameState.party[GameState.activePokemonIndex] : null;
    if (!poke || !poke.heldItem || poke.heldItem.id !== 'focus_sash') return false;
    if (battleObj._focusSashUsed) return false;
    if (st[who].hp <= 0) {
      st[who].hp = 1;
      battleObj._focusSashUsed = true;
      return true;
    }
    return false;
  },

  // ── Shell Bell ───────────────────────────────────────────────────────────
  checkShellBell(st, battleObj) {
    const poke = GameState.party[GameState.activePokemonIndex];
    if (!poke?.heldItem || poke.heldItem.id !== 'shell_bell') return null;
    const heal = 5;
    st.player.hp = Math.min(st.player.maxHp, st.player.hp + heal);
    return `🔔 Shell Bell! ${st.player.name} healed ${logHeal(heal)} HP!`;
  },

  // ── Leftovers ────────────────────────────────────────────────────────────
  checkLeftovers(st) {
    const poke = GameState.party[GameState.activePokemonIndex];
    if (!poke?.heldItem || poke.heldItem.id !== 'leftovers') return null;
    const heal = 5;
    st.player.hp = Math.min(st.player.maxHp, st.player.hp + heal);
    return `🍖 Leftovers! ${st.player.name} healed ${logHeal(heal)} HP!`;
  },

  // ── Type booster held items ──────────────────────────────────────────────
  getTypeboost(poke, cardType) {
    if (!poke?.heldItem) return 1;
    const boosts = {
      charcoal:     { type: 'fire',     mult: 1.2 },
      mystic_water: { type: 'water',    mult: 1.2 },
      miracle_seed: { type: 'grass',    mult: 1.2 },
      magnet:       { type: 'electric', mult: 1.2 },
    };
    const b = boosts[poke.heldItem.id];
    return (b && b.type === cardType) ? b.mult : 1;
  },

  // ── Post-battle passive berry check ─────────────────────────────────────
  checkPassive() {
    if (!GameState.items) return;
    const berries = GameState.items.filter(i => i.id === 'oran_berry' && i.count > 0);
    if (!berries.length) return;
    // Only heal starter passively between battles
    const starter = GameState.party.find(p => p.isStarter);
    if (starter && starter.hp > 0 && starter.hp < starter.maxHp * 0.5 && berries[0].count > 0) {
      starter.hp = Math.min(starter.maxHp, starter.hp + 20);
      berries[0].count--;
      if (berries[0].count <= 0)
        GameState.items = GameState.items.filter(i => !(i.id === 'oran_berry' && i.count <= 0));
    }
    this.renderBagBar();
  },

  hasItem(id) {
    return (GameState.items || []).some(i => i.id === id && i.count > 0);
  },

  useItem(id) {
    const item = (GameState.items || []).find(i => i.id === id && i.count > 0);
    if (!item) return false;
    item.count--;
    if (item.count <= 0) GameState.items = GameState.items.filter(i => i !== item);
    this.renderBagBar();
    return true;
  },

  addItem(id) {
    if (!GameState.items) GameState.items = [];
    const item = GameState.items.find(i => i.id === id);
    const def  = SHOP_ITEMS.find(s => s.id === id);
    if (!def) return;
    if (item) { item.count++; }
    else      { GameState.items.push({ ...def, count: 1 }); }
    this.renderBagBar();
  },
};

// ─── CARD REWARD ENGINE ───────────────────────────────────────────────────────

const CardReward = {
  _pool: [], // 3 cards offered

  show(goldEarned) {
    const activePoke = GameState.party[GameState.activePokemonIndex];
    const activeType = activePoke?.type || GameState.starterType || 'normal';
    const st         = BattleEngine.state || BossEngine.bState;
    const mult       = BattleEngine._lastMatchupMult ?? 1;
    const name       = activePoke?.name || 'Your Pokémon';

    // Build reward pool
    const eligible = [
      ...STANDARD_CARDS.map(c => ({ ...c })),
      ...(TYPE_SIGNATURE_CARDS[activeType] || []).map(c => ({ ...c })),
      ...(CARD_TEMPLATES[activeType] || []).map(c => ({ ...c })),
    ];
    const seen = new Set();
    const unique = eligible.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id); return true;
    });
    this._pool = shuffle(unique).slice(0, 3);

    const el      = document.getElementById('card-reward-screen');
    const deckSize = GameState.deck.length;
    const MAX_DECK = 31;
    const atCap    = deckSize >= MAX_DECK;
    document.getElementById('cr-gold-earned').textContent =
      `+${goldEarned}g earned  ·  Deck: ${deckSize}/${MAX_DECK}${atCap ? ' — FULL' : ''}`;

    // ── Battle fluff comment ─────────────────────────────────────────────────
    const commentEl = document.getElementById('cr-battle-comment');
    if (commentEl) {
      const ADVANTAGE_LINES = [
        `Type advantage well used — ${name}'s ${activeType} was the perfect call.`,
        `Super effective! You read that matchup like a pro trainer.`,
        `The type advantage made all the difference. Brock would approve.`,
      ];
      const DISADVANTAGE_LINES = [
        `${name} wasn't the ideal type here — but you won anyway. Respect.`,
        `Fighting uphill and pulling through. That takes real skill.`,
        `Not the best matchup on paper, but your card play compensated perfectly.`,
      ];
      const NEUTRAL_LINES = [
        `A clean neutral battle — pure card skill decided this one.`,
        `No type edge on either side. The better trainer won today.`,
        `Straight down the middle. ${name} outplayed the opponent.`,
      ];
      const pool = mult >= 2 ? ADVANTAGE_LINES : (mult === 0 || mult < 1) ? DISADVANTAGE_LINES : NEUTRAL_LINES;
      commentEl.textContent = pool[Math.floor(Math.random() * pool.length)];
      commentEl.className   = `cr-battle-comment cr-comment-${mult >= 2 ? 'advantage' : mult < 1 ? 'disadvantage' : 'neutral'}`;
    }

    // ── Battle summary ───────────────────────────────────────────────────────
    const summaryEl = document.getElementById('cr-battle-summary');
    if (summaryEl && st) {
      const dealt  = st.totalDamageDealt || 0;
      const taken  = st.totalDamageTaken || 0;
      const cards  = st.cardsPlayedCount || 0;
      summaryEl.textContent = `⚔ ${dealt} dmg dealt  ·  🛡 ${taken} dmg taken  ·  🃏 ${cards} cards played`;
      summaryEl.style.display = dealt + taken + cards > 0 ? '' : 'none';
    } else if (summaryEl) {
      summaryEl.style.display = 'none';
    }

    // Reset matchup for next battle
    BattleEngine._lastMatchupMult = 1;

    const grid = document.getElementById('cr-cards-grid');
    grid.innerHTML = '';

    this._pool.forEach((card, i) => {
      const div = document.createElement('div');
      // Use ONLY cr-card — not 'card' — so battle hover CSS never fires on this overlay
      div.className = 'cr-card' + (atCap ? ' cr-card-disabled' : '');
      div.dataset.type = card.type;

      // Count how many of this card id already exist in the deck
      const existingCount = (GameState.deck || []).filter(c => c.id === card.id).length;
      const atDupeLimit   = existingCount >= 2;
      if (atDupeLimit) div.classList.add('cr-card-disabled');

      div.innerHTML = `
        <div class="cr-card-icon">${card.icon}</div>
        <div class="cr-card-name">${card.name}</div>
        <div class="cr-card-power">${card.power > 0 ? '⚔ ' + card.power : '✦'}</div>
        <div class="cr-card-effect">${card.effect || '—'}</div>
        <div class="cr-card-type-badge type-${card.type}">${card.type}</div>
        ${atDupeLimit ? '<div class="cr-dupe-notice">Max 2 copies</div>' : ''}
      `;
      if (!atCap && !atDupeLimit) div.onclick = () => this.pickCard(i);
      grid.appendChild(div);
    });

    if (atCap) {
      const notice = document.createElement('div');
      notice.className = 'cr-cap-notice';
      notice.textContent = '⚠ Deck is full (31 cards max). Remove a card at Training to make room.';
      grid.after(notice);
    }

    el.classList.remove('hidden');
  },

  pickCard(idx) {
    const card   = this._pool[idx];
    const active = GameState.party[GameState.activePokemonIndex];
    const MAX_DECK = 31;

    // Guard: don't exceed 2 copies of the same card
    const existingCount = (GameState.deck || []).filter(c => c.id === card.id).length;
    if (existingCount >= 2) { this.close(); return; }

    const newCard = { ...card, improved: 0 };

    if (active && active.deck && active.deck !== GameState.deck) {
      // Different array references — push to both independently
      if (GameState.deck.length < MAX_DECK)  GameState.deck.push(newCard);
      if (active.deck.length < MAX_DECK)     active.deck.push({ ...newCard });
    } else {
      // Same reference (starter) — push once only
      if (GameState.deck.length < MAX_DECK)  GameState.deck.push(newCard);
    }

    SoundEngine.playFanfare();
    this.close();
  },

  skip() {
    this.close();
  },

  close() {
    document.getElementById('card-reward-screen').classList.add('hidden');
    MapEngine.show();
  },
};

// ─── STONE EVOLUTION ─────────────────────────────────────────────────────────
// Called from the map bag bar when the player taps [Use] on a stone.
// Only ever reachable from the map screen — not battle, not shop.

async function stoneEvolve(stoneId) {
  const stoneDef = SHOP_ITEMS.find(i => i.id === stoneId);
  if (!stoneDef?.stoneTarget) return;
  const { id: targetId, type: targetType, name: targetName } = stoneDef.stoneTarget;

  showLoading();
  const afterData = await fetchPoke(targetId).catch(() => null);
  hideLoading();
  if (!afterData) {
    showModal('Connection Error', 'Could not load Pokémon data. Check your connection.', () => {});
    return;
  }

  const trainerName = GameState.trainerName || 'Trainer';
  const starter = GameState.party.find(p => p.isStarter);
  const prevName = starter?.name || 'Eevee';

  // Narrative from EVOLVE_NARRATIVES[133][stoneType]
  const narrativeFn = EVOLVE_NARRATIVES[133]?.[targetType];
  const narrative = narrativeFn
    ? narrativeFn(trainerName, targetName, prevName)
    : `${prevName} is evolving into ${targetName}!`;

  // Remove stone from bag before evolving
  ItemEngine.useItem(stoneId);

  // Lock evolution — set immediately so nothing can trigger it twice
  GameState.eeveeEvolution = targetType;

  // Update the starter party member
  if (starter) {
    starter.id            = targetId;
    starter.name          = targetName;
    starter.type          = targetType;
    starter.spriteUrl     = getSpriteUrl(afterData);
    starter.backSpriteUrl = null;
    starter.maxHp        += 20;
    starter.hp            = starter.maxHp;
    // Rebuild deck for the new type — fresh, no improvements carried over
    const newDeck    = buildDeck(targetType, {});
    starter.deck     = newDeck;
    GameState.deck   = newDeck;
    GameState.improvementMap = {};
  }

  // Update GameState type references
  GameState.starterType    = targetType;
  GameState.evolutionStage = 1;  // stone counts as stage 2 (final for Eevee-line)

  saveGame();

  // Show the evolve screen — same cinematic as level evolutions
  showScreen('evolve');
  await EvolveEngine.run(133, targetId, narrative, null);
  // Continue pressed — return to map
  MapEngine.show();
}



const ShopEngine = {
  start(node) {
    this._render();
    showScreen('shop');
  },

  _render() {
    document.getElementById('shop-gold').textContent = `💰 ${GameState.gold || 0}g`;
    const grid = document.getElementById('shop-items-grid');
    grid.innerHTML = '';

    const isEevee   = GameState.starterId === 133;
    const hasEvolved = !!GameState.eeveeEvolution;

    // Split into sections
    const sections = [
      { label: '🎒 Consumables & Balls', items: SHOP_ITEMS.filter(i => i.category !== 'held' && i.category !== 'stone') },
      { label: '🏅 Held Items',          items: SHOP_ITEMS.filter(i => i.category === 'held') },
    ];

    // Stone section — only when Eevee is starter and not yet evolved
    if (isEevee && !hasEvolved) {
      sections.push({
        label: '💎 Evolution Stones',
        items: SHOP_ITEMS.filter(i => i.category === 'stone'),
        isStone: true,
      });
    }

    sections.forEach(section => {
      const header = document.createElement('div');
      header.className = 'shop-section-header';
      header.textContent = section.label;
      grid.appendChild(header);

      section.items.forEach(item => {
        const owned    = (GameState.items || []).find(i => i.id === item.id);
        const count    = owned ? owned.count : 0;
        const equipped = GameState.party.filter(p => p.heldItem?.id === item.id).length;
        const maxed    = count >= item.maxStack;
        const isUnique = item.unique && (count > 0 || (item.id === 'master_ball' && GameState.masterBallUsed));
        const scaledPrice = getScaledPrice(item.price);
        const cantAfford = (GameState.gold || 0) < scaledPrice;
        const disabled = maxed || isUnique || cantAfford;

        const div = document.createElement('div');
        div.className = 'shop-item' + (disabled ? ' shop-item-disabled' : '');

        // Stone items get a preview of the target Pokémon
        let stonePreviewHtml = '';
        if (section.isStone && item.stoneTarget) {
          stonePreviewHtml = `
            <div class="stone-preview">
              <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.stoneTarget.id}.png"
                   class="stone-preview-sprite" alt="${item.stoneTarget.name}"
                   onerror="this.style.display='none'" />
              <span class="stone-preview-name">→ ${item.stoneTarget.name}</span>
              <span class="stone-preview-type type-${item.stoneTarget.type}">${item.stoneTarget.type}</span>
            </div>`;
        }

        div.innerHTML = `
          <div class="shop-item-icon">${item.icon}</div>
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.description}</div>
          ${stonePreviewHtml}
          <div class="shop-item-footer">
            <span class="shop-item-price">💰${scaledPrice}g</span>
            ${count > 0 ? `<span class="shop-item-owned">bag ×${count}</span>` : ''}
            ${equipped > 0 ? `<span class="shop-item-owned">held ×${equipped}</span>` : ''}
            <button class="btn-pixel btn-small btn-primary shop-buy-btn"
                    ${disabled ? 'disabled' : ''}
                    data-id="${item.id}">
              ${isUnique ? 'Sold Out' : maxed ? 'Full' : cantAfford ? 'No gold' : 'Buy'}
            </button>
          </div>
        `;
        if (!disabled) {
          div.querySelector('.shop-buy-btn').onclick = () => this.buy(item.id);
        }
        grid.appendChild(div);
      });
    });
  },

  buy(id) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;
    const scaledPrice = getScaledPrice(item.price);
    if ((GameState.gold || 0) < scaledPrice) return;

    // Stone items need a confirmation modal — permanent choice, map-only use
    if (item.category === 'stone') {
      const target = item.stoneTarget;
      showModal(
        `${item.icon} Use ${item.name}?`,
        `Eevee will become ${target.name} (${target.type}-type). Your deck will change completely.\n\nYou can use the stone from the bag on the map screen. This cannot be undone.`,
        () => {
          GameState.gold -= scaledPrice;
          ItemEngine.addItem(id);
          SoundEngine.playFanfare();
          saveGame();
          this._render();
        }
      );
      return;
    }

    GameState.gold -= scaledPrice;

    if (item.category === 'held') {
      const active = GameState.party[GameState.activePokemonIndex];
      if (active && !active.heldItem) {
        active.heldItem = { ...item };
      } else {
        ItemEngine.addItem(id);
        showModal('Item Stored', `${item.icon} ${item.name} added to your bag. Open Party to equip it.`, () => {});
      }
    } else {
      ItemEngine.addItem(id);
    }

    if (id === 'master_ball') GameState.masterBallUsed = true;
    if (id === 'lure') GameState.lureActive = true;
    SoundEngine.playFanfare();
    saveGame();
    this._render();
  },

  finish() {
    this._answered = false;
    this._isActive = false;
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },
};

// ─── POKÉDEX ENGINE ───────────────────────────────────────────────────────────

// ─── POKÉDEX CARD — standalone, reusable by CatchEngine and PokedexEngine ────
// data       = full PokeAPI Pokémon object
// isNewDex   = true shows "✨ New Entry!" banner (catch flow only)
// cachedSpecies = optional pre-fetched species object (avoids a second API call)

async function showPokedexCard(data, isNewDex = false, cachedSpecies = null) {
  const overlay  = document.getElementById('pdx-modal-overlay');
  const spriteEl = document.getElementById('pdx-sprite');
  const numEl    = document.getElementById('pdx-number');
  const nameEl   = document.getElementById('pdx-name');
  const badgesEl = document.getElementById('pdx-badges');
  const measEl   = document.getElementById('pdx-measures');
  const flavEl   = document.getElementById('pdx-flavour');
  const newBanner= document.getElementById('pdx-new-banner');
  const closeBtn = document.getElementById('pdx-close-btn');

  // ── Sprite ──────────────────────────────────────────────────────────────
  spriteEl.src = data.sprites?.other?.['official-artwork']?.front_default
              || data.sprites?.front_default
              || getSpriteUrl(data);
  spriteEl.onerror = () => { spriteEl.src = getSpriteUrl(data); };

  // ── Number + Name ────────────────────────────────────────────────────────
  numEl.textContent  = `#${String(data.id).padStart(3, '0')}`;
  nameEl.textContent = capitalize(data.name);

  // ── Type badges ──────────────────────────────────────────────────────────
  badgesEl.innerHTML = (data.types || [])
    .map(t => `<span class="hud-type-badge type-${t.type.name}">${t.type.name}</span>`)
    .join('');

  // ── Height + weight ──────────────────────────────────────────────────────
  const hm  = ((data.height || 0) / 10).toFixed(1);
  const wkg = ((data.weight || 0) / 10).toFixed(1);
  measEl.textContent = `📏 ${hm} m  ·  ⚖ ${wkg} kg`;

  // ── Flavour text ─────────────────────────────────────────────────────────
  flavEl.textContent = '…';
  let flavour = '';
  try {
    let species = cachedSpecies;
    if (!species && data.species?.url) {
      species = await fetch(data.species.url).then(r => r.json()).catch(() => null);
    }
    if (species?.flavor_text_entries) {
      const entry = species.flavor_text_entries.find(e => e.language?.name === 'en');
      if (entry) flavour = entry.flavor_text.replace(/[\n\f\r]/g, ' ').replace(/\s+/g, ' ').trim();
    }
  } catch (_) {}

  // Typewriter
  flavEl.textContent = '';
  let fi = 0;
  const flavInterval = setInterval(() => {
    if (fi >= flavour.length) { clearInterval(flavInterval); return; }
    flavEl.textContent += flavour[fi++];
  }, 30);

  // ── New-entry banner ─────────────────────────────────────────────────────
  newBanner.style.display = isNewDex ? '' : 'none';

  // ── Show modal ───────────────────────────────────────────────────────────
  overlay.style.display = 'flex';
  overlay.classList.remove('pdx-modal-in');
  void overlay.offsetWidth;
  overlay.classList.add('pdx-modal-in');

  // ── Promise — resolves when close is pressed ─────────────────────────────
  return new Promise(resolve => {
    const handler = () => {
      clearInterval(flavInterval);
      closeBtn.removeEventListener('click', handler);
      overlay.classList.remove('pdx-modal-in');
      setTimeout(() => { overlay.style.display = 'none'; resolve(); }, 200);
    };
    closeBtn.addEventListener('click', handler);
  });
}

const PokedexEngine = {
  async show() {
    showLoading();
    const dex     = loadPokedex();
    const entries = Object.values(dex).sort((a, b) => a.id - b.id);

    const grid = document.getElementById('pokedex-grid');
    grid.innerHTML = '';

    document.getElementById('pokedex-count').textContent =
      `${entries.filter(e => e.caught).length} caught / ${entries.length} seen`;

    entries.forEach(e => {
      const div = document.createElement('div');
      const caught = !!e.caught;
      div.className = 'dex-entry' + (caught ? ' dex-caught' : ' dex-seen');
      div.title     = caught ? `${e.name} — tap to view` : 'Seen — not yet caught';
      div.innerHTML = `
        <img src="${e.spriteUrl || ''}" alt="${e.name}"
             onerror="this.src='assets/sprites/${e.id}.png'"
             class="dex-sprite${caught ? '' : ' silhouette'}" />
        <div class="dex-text">
          <div class="dex-id">#${String(e.id).padStart(3, '0')}</div>
          <div class="dex-name${caught ? '' : ' dex-unknown'}">${caught ? e.name : '???'}</div>
        </div>
        ${caught ? '<div class="dex-ball">🔵</div>' : ''}
      `;

      if (caught) {
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => this._openEntry(e));
      }

      grid.appendChild(div);
    });

    if (entries.length === 0) {
      grid.innerHTML = '<div class="dex-empty">No Pokémon discovered yet.<br>Battle and catch to fill your Pokédex!</div>';
    }

    hideLoading();
    showScreen('pokedex');
  },

  async _openEntry(entry) {
    showLoading();
    try {
      const data = await fetchPoke(entry.id);
      hideLoading();
      // isNewDex = false — this is a browse, not a new catch
      await showPokedexCard(data, false, null);
    } catch (e) {
      hideLoading();
      showModal('Oops', 'Could not load Pokémon data. Check your connection.', () => {});
    }
  },
};

// ─── TRAINING ENGINE ─────────────────────────────────────────────────────────

const TrainingEngine = {
  selected:  [],
  mode:      'upgrade', // 'upgrade' | 'remove'
  _trainingPokeIdx: null, // which pokémon's deck we're upgrading

  start(node) {
    this.selected          = [];
    this.mode              = 'upgrade';
    this._upgradeJustDone  = false;
    this._trainingPokeIdx  = GameState.activePokemonIndex; // default

    showScreen('training');
    this._showPicker();
  },

  // ── Step 1: Pokémon picker ────────────────────────────────────────────────
  _showPicker() {
    document.getElementById('training-poke-picker').style.display = '';
    document.getElementById('training-card-panel').style.display  = 'none';

    const grid = document.getElementById('training-poke-grid');
    grid.innerHTML = '';

    GameState.party.forEach((p, i) => {
      if (p.hp <= 0) return; // skip fainted

      const deck  = p.deck || (i === GameState.activePokemonIndex ? GameState.deck : null);
      if (!deck)  return; // no deck to upgrade

      const isActive  = i === GameState.activePokemonIndex;
      const card = document.createElement('div');
      card.className  = 'training-poke-card' + (isActive ? ' training-poke-active' : '');

      const hpPct = Math.round((p.hp / p.maxHp) * 100);
      card.innerHTML  = `
        <img src="${p.spriteUrl}" alt="${p.name}"
             onerror="this.src='assets/sprites/${p.id}.png'" />
        <div class="training-poke-name">${p.name}</div>
        <div class="training-poke-level">Lv.${p.level}</div>
        <div class="training-poke-hp-bar-wrap">
          <div class="training-poke-hp-bar" style="width:${hpPct}%;background:${hpColor(p.hp,p.maxHp)}"></div>
        </div>
        <div class="training-poke-deck-count">${deck.length} cards</div>
        ${isActive ? '<div class="training-poke-badge">Active</div>' : ''}
      `;
      card.onclick = () => this._startWithPokemon(i);
      grid.appendChild(card);
    });
  },

  // ── Step 2: Load chosen Pokémon's deck and show cards ─────────────────────
  _startWithPokemon(partyIdx) {
    this._trainingPokeIdx = partyIdx;

    // Swap active deck to selected Pokémon's deck
    const poke = GameState.party[partyIdx];
    GameState.deck = poke.deck || GameState.deck;

    document.getElementById('training-poke-picker').style.display = 'none';
    document.getElementById('training-card-panel').style.display  = '';

    // Show who we're training
    const whoRow = document.getElementById('training-who-row');
    whoRow.innerHTML = `
      <img src="${poke.spriteUrl}" alt="${poke.name}"
           onerror="this.src='assets/sprites/${poke.id}.png'"
           class="training-who-sprite" />
      <div class="training-who-name">Training: <span>${poke.name}</span></div>
    `;

    this.selected = [];
    this.mode     = 'upgrade';
    this._render();
  },

  setMode(m) {
    this.mode     = m;
    this.selected = [];
    this._render();
  },

  _render() {
    const grid = document.getElementById('training-cards-grid');
    grid.innerHTML = '';

    document.getElementById('training-mode-upgrade').classList.toggle('active-tab', this.mode === 'upgrade');
    document.getElementById('training-mode-remove').classList.toggle('active-tab',  this.mode === 'remove');

    const subtitle = document.getElementById('training-subtitle');
    subtitle.textContent = this.mode === 'upgrade'
      ? 'Select 2 cards to power up (+25% damage)'
      : 'Select 1 card to permanently remove from your deck';

    GameState.deck.forEach((card, i) => {
      const div          = document.createElement('div');
      const isSelected   = this.selected.includes(i);
      const justUpgraded = this._upgradeJustDone && isSelected;
      div.className = 'training-card'
        + (isSelected   ? ' selected'      : '')
        + (justUpgraded ? ' just-upgraded' : '');
      div.dataset.type = card.type;
      div.style.borderTopColor = `var(--col-type-${card.type}, var(--col-type-normal))`;
      div.innerHTML = `
        <div class="card-icon" style="font-size:1.6rem">${card.icon}</div>
        <div class="card-name" style="font-family:'Press Start 2P',monospace;font-size:.38rem;color:var(--col-text);margin:.2rem 0">${card.name}</div>
        <div class="card-power" style="font-size:.65rem;color:var(--col-yellow)">${card.power > 0 ? '⚔ '+card.power : '✦'}</div>
        <div class="card-effect" style="font-size:.45rem;color:var(--col-text-dim);margin-top:.1rem">${card.effect}</div>
        ${card.improved ? `<div class="card-improved">+${card.improved}${justUpgraded ? ' ✨ NEW' : ''}</div>` : ''}
        ${card.exhaust  ? `<div class="card-exhaust-tag">🔥 Once</div>` : ''}
      `;
      if (!this._upgradeJustDone) div.onclick = () => this.toggleSelect(i);
      grid.appendChild(div);
    });

    const maxSel = this.mode === 'upgrade' ? 2 : 1;
    document.getElementById('selected-count').textContent = `${this.selected.length} / ${maxSel} selected`;
    document.getElementById('btn-improve').textContent = this.mode === 'upgrade' ? '⚡ Upgrade Selected' : '🗑 Remove Card';
    document.getElementById('btn-improve').disabled    = this.selected.length !== maxSel;
  },

  toggleSelect(idx) {
    const maxSel = this.mode === 'upgrade' ? 2 : 1;
    const i = this.selected.indexOf(idx);
    if (i >= 0) {
      this.selected.splice(i, 1);
    } else if (this.selected.length < maxSel) {
      this.selected.push(idx);
    }
    this._render();
  },

  improve() {
    if (this.mode === 'upgrade') {
      if (this.selected.length !== 2) return;

      this.selected.forEach(idx => {
        const card = GameState.deck[idx];
        card.improved = (card.improved || 0) + 1;
        if (card.power > 0) card.power = Math.round(card.power * 1.25);
      });

      // Persist improvements back onto the Pokémon's own deck
      const poke = GameState.party[this._trainingPokeIdx];
      if (poke && poke.deck) {
        poke.deck = [...GameState.deck];
      }
      GameState.improvementMap = {};
      GameState.deck.forEach((c, i) => { if (c.improved) GameState.improvementMap[i] = c.improved; });
      saveGame();

      const evolutions = levelUpParty('training');

      this._upgradeJustDone = true;
      this._render();
      const btn = document.getElementById('btn-improve');
      btn.textContent = 'Done ✓';
      btn.disabled    = false;
      btn.classList.add('btn-upgrade-done');
      btn.onclick = () => {
        btn.onclick = null;
        btn.classList.remove('btn-upgrade-done');
        this._upgradeJustDone = false;
        MapEngine.completeNode(GameState.currentNodeIndex);
        if (evolutions.length > 0) {
          saveGame();
          runEvolutions(evolutions, () => MapEngine.show());
        } else {
          MapEngine.show();
        }
      };
    } else {
      if (this.selected.length !== 1) return;
      if (GameState.deck.length <= 3) {
        showModal('Cannot Remove', 'Your deck must have at least 3 cards!', () => {});
        return;
      }
      const removed = GameState.deck.splice(this.selected[0], 1)[0];
      // Also remove from Pokémon's own deck
      const poke = GameState.party[this._trainingPokeIdx];
      if (poke && poke.deck) {
        const ri = poke.deck.findIndex(c => c.name === removed.name);
        if (ri >= 0) poke.deck.splice(ri, 1);
      }
      saveGame();
      MapEngine.completeNode(GameState.currentNodeIndex);
      showModal('Card Removed!', `${removed.name} has been removed from ${poke?.name ?? 'your'}'s deck.`, () => MapEngine.show());
    }
  },

  skip() {
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },
};

// ─── HEAL ENGINE ─────────────────────────────────────────────────────────────

// ─── COOKING ENGINE ──────────────────────────────────────────────────────────

const COOKING_INGREDIENTS = [
  { id: 'meat',      icon: '🥩', name: 'Meat'      },
  { id: 'herb',      icon: '🌿', name: 'Herbs'     },
  { id: 'berry',     icon: '🍓', name: 'Berries'   },
  { id: 'mushroom',  icon: '🍄', name: 'Mushroom'  },
  { id: 'salt',      icon: '🧂', name: 'Salt'      },
  { id: 'spice',     icon: '🌶️', name: 'Spice'     },
  { id: 'egg',       icon: '🥚', name: 'Egg'       },
  { id: 'rice',      icon: '🍚', name: 'Rice'      },
];

// Brock quotes — keyed by outcome
const BROCK_COOKING_QUOTES = {
  perfect: [
    "That's exactly my secret recipe! Your Pokémon are going to love this!",
    "Outstanding! You follow instructions better than my little brother Forrest!",
    "A perfect dish! My Onix would approve — and he's a very tough critic!",
  ],
  partial: [
    "Hmm, close but not quite right. Some of your Pokémon seem satisfied, others less so.",
    "You got a few steps right! With more practice you'll be a great chef.",
    "The first part was delicious, the rest... needs work. Onix is raising an eyebrow.",
  ],
  wrong: [
    "Oh my. That was... adventurous. Your Pokémon are being very polite about it.",
    "Hmm, that's not quite what I had in mind. Even rock-type Pokémon have standards!",
    "Let's call that an experiment. Your team looks a little green around the gills.",
  ],
};

function _cookingQuote(outcome) {
  const pool = BROCK_COOKING_QUOTES[outcome];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Generate a fresh recipe — 3 slots, each with a unique ingredient and a
// cooking-themed math question. The arithmetic is identical to the Rocket
// challenge tiers but the story wrapper is entirely kitchen-flavoured.
function _generateRecipe(tier) {
  const shuffled = [...COOKING_INGREDIENTS].sort(() => Math.random() - 0.5);
  const chosen   = shuffled.slice(0, 3);

  return chosen.map(ing => {
    let correct, question, coins = null;

    if (tier === 1) {
      // Tier 1 (age 6-7): simple addition, visual ingredient emoji as counters
      const a = 1 + Math.floor(Math.random() * 4);   // 1–4
      const b = 1 + Math.floor(Math.random() * 4);   // 1–4
      correct  = a + b;
      question = `Brock used ${a} ${ing.name} yesterday and needs ${b} more today. How many total?`;
      coins    = { a, b, op: '+', icon: ing.icon };
    } else if (tier === 2) {
      // Tier 2 (age 8-9): multiplication — portions and servings
      const type = Math.random() < 0.5 ? 'mult' : 'add';
      if (type === 'mult') {
        const poke = 2 + Math.floor(Math.random() * 4);   // 2–5 Pokémon
        const each = 2 + Math.floor(Math.random() * 5);   // 2–6 each
        correct  = poke * each;
        question = `${poke} Pokémon each need ${each} pieces of ${ing.name}. How many total?`;
      } else {
        const batch1 = 5  + Math.floor(Math.random() * 10);
        const batch2 = 3  + Math.floor(Math.random() * 8);
        correct  = batch1 + batch2;
        question = `Brock made ${batch1} portions this morning and ${batch2} more after training. Total ${ing.name}?`;
      }
    } else {
      // Tier 3 (age 10-12): division — recipe scaling and splitting
      const type = Math.random() < 0.5 ? 'div' : 'half';
      if (type === 'div') {
        const portions = 2 + Math.floor(Math.random() * 5);  // 2–6
        correct   = 3 + Math.floor(Math.random() * 6);        // 3–8 per portion
        const total = portions * correct;
        question  = `The recipe makes ${total} pieces of ${ing.name} split equally into ${portions} bowls. How many per bowl?`;
      } else {
        // Halving a recipe
        const full = (4 + Math.floor(Math.random() * 8)) * 2;  // even number 8–24
        correct   = full / 2;
        question  = `The full recipe needs ${full} ${ing.name}. Brock is making half today. How many does he need?`;
      }
    }

    // Generate 3 wrong answers close to correct
    const wrongs = new Set();
    while (wrongs.size < 3) {
      const delta = 1 + Math.floor(Math.random() * 4);
      const w = Math.random() < 0.5 ? correct + delta : Math.max(1, correct - delta);
      if (w !== correct) wrongs.add(w);
    }
    const choices = shuffle([correct, ...wrongs]);

    return { ...ing, qty: correct, challenge: { question, correct, choices, coins } };
  });
}

const BROCK_COOKING_SCRIPTS = [
  [
    { name:'Brock', img:'assets/brock.png',
      text:'${name}! Perfect timing — my Pokémon and I were just about to eat. Come on in.' },
    { name:'Brock', img:'assets/brock.png',
      text:'I\'ve been cooking for my brothers since I was small. Ten of them! So feeding a Pokémon team? Easy.' },
    { name:'Brock', img:'assets/brock.png',
      text:'But the recipe has to be exact — right ingredients, right amounts, right order. My Geodude won\'t touch it otherwise.' },
  ],
  [
    { name:'Brock', img:'assets/brock.png',
      text:'Ah, ${name}! Your team looks tired. Good food fixes that faster than a Potion.' },
    { name:'Brock', img:'assets/brock.png',
      text:'I\'ve got a new recipe today. The key is paying close attention to the amounts — too much salt and even Onix pulls a face.' },
  ],
  [
    { name:'Brock', img:'assets/brock.png',
      text:'${name}! The secret to strong Pokémon isn\'t just battles. It\'s good food, good rest, and good company.' },
    { name:'Brock', img:'assets/brock.png',
      text:'This dish has kept my Geodude going through six gym challenges in a row. Watch carefully now.' },
  ],
  [
    { name:'Brock', img:'assets/brock.png',
      text:'Back already, ${name}? Good. A trainer who feeds their team well is a trainer who wins.' },
    { name:'Brock', img:'assets/brock.png',
      text:'I change the recipe every time — keeps things interesting. Ready to follow along?' },
  ],
];

const CookingEngine = {
  _recipe:   [],
  _slots:    [],
  _selected: null,
  _mathSlot: null,
  _node:     null,
  _isActive: false,   // flag so btn-start-boss-battle routes here
  _script:   [],
  _lineIdx:  0,

  start(node) {
    this._node     = node;
    this._recipe   = _generateRecipe(GameState.difficultyTier || 2);
    this._slots    = [null, null, null];
    this._selected = null;
    this._mathSlot = null;
    this._isActive = true;
    this._script   = BROCK_COOKING_SCRIPTS[
      Math.floor(Math.random() * BROCK_COOKING_SCRIPTS.length)
    ];
    this._lineIdx  = 0;

    // Show the boss screen in intro-only mode (same as Rocket encounter)
    showScreen('boss');
    BossEngine._isRocket = false;

    // Blank the battle background — Brock's kitchen is not a battle arena
    const bgImg = document.querySelector('#screen-boss .battle-bg-img');
    if (bgImg) { bgImg.src = ''; bgImg.style.opacity = '0'; }

    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';
    document.getElementById('boss-party-bar').innerHTML       = '';

    // Relabel the final action button
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = "Let's Cook! ▶";

    this._showLine(0);
  },

  _showLine(idx) {
    const line   = this._script[idx];
    const name   = GameState.trainerName || 'Trainer';
    const text   = line.text.replace(/\$\{name\}/g, name);
    const isLast = idx === this._script.length - 1;

    // Portrait
    const wrap = document.getElementById('trainer-sprite-wrap');
    const img  = document.getElementById('boss-trainer-sprite');
    if (img) {
      img.src = line.img;
      img.onerror = () => { wrap.innerHTML = `<div style="font-size:4rem">🧑‍🍳</div>`; };
    }
    const nameEl  = document.getElementById('dialogue-name');
    const textEl  = document.getElementById('dialogue-text');
    const nextBtn = document.getElementById('btn-dialogue-next');
    const startBtn= document.getElementById('btn-start-boss-battle');

    nameEl.textContent = line.name;
    textEl.textContent = '';
    if (nextBtn)  nextBtn.style.display  = 'none';
    if (startBtn) startBtn.style.display = 'none';

    // Typewriter
    let ci = 0;
    const interval = setInterval(() => {
      textEl.textContent += text[ci++];
      if (ci >= text.length) {
        clearInterval(interval);
        if (isLast) {
          if (startBtn) startBtn.style.display = '';
        } else {
          if (nextBtn) nextBtn.style.display = '';
        }
      }
    }, 28);

    this._lineIdx = idx;
  },

  advanceDialogue() {
    const next = this._lineIdx + 1;
    if (next < this._script.length) this._showLine(next);
  },

  // Called when player taps "Let's Cook! ▶"
  startGame() {
    this._isActive = false;
    // Reset the start button label for future boss/rocket encounters
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = 'Battle! ▶';

    document.getElementById('trainer-intro').style.display    = 'none';
    showScreen('cooking');
    this._renderGame();
  },

  _renderGame() {
    // Recipe display — show ingredient + order only, NOT quantity.
    // The quantity is revealed when the player solves the math question per slot.
    const recipeEl = document.getElementById('cooking-recipe');
    recipeEl.innerHTML = this._recipe.map((r, i) => {
      const slotFilled = this._slots[i] !== null;
      // Once the player has answered the math for this slot, reveal the actual qty
      return `
        <div class="recipe-slot ${slotFilled ? 'recipe-slot-revealed' : ''}">
          <div class="recipe-slot-num">${i + 1}</div>
          <div class="recipe-ingredient-icon">${r.icon}</div>
          <div class="recipe-ingredient-name">${r.name}</div>
          <div class="recipe-qty ${slotFilled ? '' : 'recipe-qty-hidden'}">× ${slotFilled ? this._slots[i].qty : '?'}</div>
        </div>
      `;
    }).join('');

    // Drop zones
    const zonesEl = document.getElementById('cooking-zones');
    zonesEl.innerHTML = this._slots.map((slot, i) => {
      const filled = slot !== null;
      return `
        <div class="cooking-zone ${filled ? 'cooking-zone-filled' : 'cooking-zone-empty'}"
             data-zone="${i}">
          ${filled
            ? `<div class="cz-icon">${slot.icon}</div>
               <div class="cz-name">${slot.name}</div>
               <div class="cz-qty">× ${slot.qty}</div>
               <button class="cooking-remove-btn" data-zone="${i}">✕</button>`
            : `<div class="cz-empty-label">Slot ${i + 1}</div>`
          }
        </div>
      `;
    }).join('');

    document.querySelectorAll('.cooking-zone').forEach(el => {
      el.addEventListener('click', () => {
        const z = parseInt(el.dataset.zone);
        if (this._slots[z] === null && this._selected) this._placeIngredient(z);
      });
    });
    document.querySelectorAll('.cooking-remove-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this._slots[parseInt(el.dataset.zone)] = null;
        this._renderGame();
      });
    });

    // Pantry
    const pantryEl = document.getElementById('cooking-pantry');
    pantryEl.innerHTML = COOKING_INGREDIENTS.map(ing => {
      const alreadyPlaced = this._slots.some(s => s?.id === ing.id);
      const isSelected    = this._selected === ing.id;
      return `
        <div class="pantry-item ${alreadyPlaced ? 'pantry-used' : ''} ${isSelected ? 'pantry-selected' : ''}"
             data-ing="${ing.id}">
          <span class="pantry-icon">${ing.icon}</span>
          <span class="pantry-name">${ing.name}</span>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.pantry-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.ing;
        this._selected = (this._selected === id) ? null : id;
        this._renderGame();
      });
    });

    // Submit button
    const submitBtn = document.getElementById('btn-cooking-submit');
    const allFilled = this._slots.every(s => s !== null);
    submitBtn.disabled    = !allFilled;
    submitBtn.textContent = allFilled ? '🍽️ Serve it up!' : 'Fill all 3 slots first';
  },

  _placeIngredient(zoneIdx) {
    const ing = COOKING_INGREDIENTS.find(i => i.id === this._selected);
    if (!ing) return;
    this._selected = null;
    this._mathSlot = zoneIdx;
    this._showMathModal(ing, zoneIdx);
  },

  _showMathModal(ing, zoneIdx) {
    const ch      = this._recipe[zoneIdx].challenge;
    const tier    = GameState.difficultyTier || 2;
    const overlay = document.getElementById('cooking-math-overlay');

    document.getElementById('cooking-math-question').textContent = `How many ${ing.name} does the recipe need?`;
    document.getElementById('cooking-math-qty-hint').textContent  = ch.question;

    const coinVis = document.getElementById('cooking-math-coins');
    if (tier === 1 && ch.coins) {
      const { a, b, op } = ch.coins;
      coinVis.innerHTML = `<span>${ing.icon.repeat(Math.min(a, 8))}</span>
        <span>${op === '+' ? '➕' : '➖'}</span>
        <span>${ing.icon.repeat(Math.min(b, 8))}</span>`;
      coinVis.style.display = 'flex';
    } else {
      coinVis.style.display = 'none';
    }

    const btnArea = document.getElementById('cooking-math-answers');
    btnArea.innerHTML = '';
    ch.choices.forEach(val => {
      const btn = document.createElement('button');
      btn.className   = 'btn-pixel btn-secondary cooking-math-btn';
      btn.textContent = val;
      btn.onclick = () => {
        this._slots[zoneIdx] = { ...ing, qty: val };
        if (val !== ch.correct) {
          btn.classList.add('math-wrong');
          setTimeout(() => { overlay.style.display = 'none'; this._mathSlot = null; this._renderGame(); }, 700);
        } else {
          overlay.style.display = 'none'; this._mathSlot = null; this._renderGame();
        }
      };
      btnArea.appendChild(btn);
    });

    overlay.style.display = 'flex';
  },

  submit() {
    let correctSlots = 0;
    this._slots.forEach((slot, i) => {
      if (slot && slot.id === this._recipe[i].id && slot.qty === this._recipe[i].qty) correctSlots++;
    });

    const party = GameState.party; // all Pokémon — including fainted ones to revive
    let outcome, headline, detail;

    if (correctSlots === 3) {
      outcome  = 'perfect';
      headline = '🍽️ Perfect Meal!';
      party.forEach(p => {
        const healAmt = Math.floor(p.maxHp * 0.25);
        p.hp = Math.min(p.maxHp, p.hp + Math.max(healAmt, Math.floor(p.maxHp * 0.25)));
      });
      GameState.cookingShield = 30;
      const goldPerfect = 10 + (GameState.bossesDefeated || 0) * 3;
      GameState.gold = (GameState.gold || 0) + goldPerfect;
      detail = `All Pokémon healed 25% HP (fainted ones revived)!\nShield for next battle!\n+${goldPerfect}💰 from Brock!`;
    } else if (correctSlots > 0) {
      outcome  = 'partial';
      headline = '🍱 Partially Right';
      // Heal living Pokémon 15%; revive fainted at 10%
      party.forEach(p => {
        if (p.hp > 0) {
          p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * 0.15));
        } else {
          p.hp = Math.floor(p.maxHp * 0.10); // revive at 10%
        }
      });
      const goldPartial = 5 + (GameState.bossesDefeated || 0) * 1;
      GameState.gold = (GameState.gold || 0) + goldPartial;
      detail = `${correctSlots}/3 slots correct. All Pokémon fed (fainted ones revived at 10% HP).\n+${goldPartial}💰 from Brock.`;
    } else {
      outcome  = 'wrong';
      headline = '😬 That Didn\'t Taste Great...';
      party.filter(p => p.hp > 0).forEach(p => { p.hp = Math.max(1, p.hp - Math.floor(p.hp * 0.10)); });
      detail = 'Living Pokémon lost 10% HP due to hunger. Fainted ones still need a Pokémon Centre.';
    }

    saveGame();
    const quote   = _cookingQuote(outcome);
    const fullMsg = `${detail}\n\n"${quote}" — Brock`;

    showModal(headline, fullMsg, () => {
      MapEngine.completeNode(GameState.currentNodeIndex);
      MapEngine.show();
    });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// ── MAZE MINI-GAME START ──────────────────────────────────────────────────────
// To remove this feature entirely, delete everything between the
// MAZE MINI-GAME START and MAZE MINI-GAME END comments, plus:
//   • case 'maze' in MapEngine dispatch switch
//   • 'maze' entries in NODE_ICONS and ARROW_LABELS
//   • bi >= 2 injection block in generateMap
//   • MazeEngine._isActive branches in btn-start-boss-battle / btn-dialogue-next
//   • #screen-maze HTML block
//   • .maze-* CSS rules
// ──────────────────────────────────────────────────────────────────────────────

const MISTY_MAZE_SCRIPTS = [
  [
    { name:'Misty', img:'assets/misty.png',
      text:'${name}! I need your help. I dropped my gym key somewhere in the water caves and I have to get it back.' },
    { name:'Misty', img:'assets/misty.png',
      text:'The problem is... there are Bug Pokémon in there. Caterpie and Weedle. I can\'t stand them. Don\'t even ask.' },
    { name:'Misty', img:'assets/misty.png',
      text:'Guide me through without touching any of them. If I make it out, your team gets a proper rest. Deal?' },
  ],
  [
    { name:'Misty', img:'assets/misty.png',
      text:'Ugh — ${name}! Those horrible bugs are blocking the path to Cerulean Cave again.' },
    { name:'Misty', img:'assets/misty.png',
      text:'I know, I know. I\'m a Pokémon trainer. I shouldn\'t be scared. But they\'re just so... wriggly.' },
    { name:'Misty', img:'assets/misty.png',
      text:'Help me get through without touching one. Please? I\'ll make it worth your while.' },
  ],
  [
    { name:'Misty', img:'assets/misty.png',
      text:'${name}! Don\'t laugh, but I need an escort through the Bug Pokémon section of the gym path.' },
    { name:'Misty', img:'assets/misty.png',
      text:'Starmie keeps trying to drag me over to them. Absolutely not. I need a human guide.' },
    { name:'Misty', img:'assets/misty.png',
      text:'Get me to the exit and your Pokémon will be well taken care of. Let\'s go!' },
  ],
];

// ─── MAZE GENERATION ─────────────────────────────────────────────────────────
// Procedural maze using Recursive Backtracker (depth-first search).
// Guarantees: always solvable, every floor cell reachable, never the same twice.
//
// The logical grid is (size × size) cells where size is ODD (the walls between
// cells are also cells in the grid). So a 7×7 grid has (7-1)/2 = 3×3 logical rooms.
// start = top-left room [1,1], exit = bottom-right room [size-2, size-2].
//
// Bug speed: 1 = moves 1 step per player move, 2 = moves 2 steps per player move.
// Tier 1: 2 speed-1 bugs (slow, readable)
// Tier 2: 2 speed-1 + 2 speed-2 bugs
// Tier 3: 2 speed-1 + 4 speed-2 bugs

const MAZE_TIER_CFG = {
  // gridSize must be odd. pauseAtEnd = how many player steps the bug freezes at each end.
  1: { gridSize: 7,  bugCount: 2, lives: 3, pauseAtEnd: 3 },
  2: { gridSize: 9,  bugCount: 4, lives: 2, pauseAtEnd: 2 },
  3: { gridSize: 11, bugCount: 6, lives: 1, pauseAtEnd: 1 },
};

function _generateMaze(gridSize) {
  // Fill everything with walls
  const grid = Array.from({ length: gridSize }, () => new Array(gridSize).fill(1));

  // Recursive backtracker — carve passages between rooms
  const roomSize = (gridSize - 1) / 2;  // number of rooms per axis
  const visited  = Array.from({ length: roomSize }, () => new Array(roomSize).fill(false));
  const dirs      = [[-1,0],[1,0],[0,-1],[0,1]];

  function carve(rr, rc) {
    visited[rr][rc] = true;
    grid[rr * 2 + 1][rc * 2 + 1] = 0;  // carve the room itself

    const shuffled = [...dirs].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of shuffled) {
      const nr = rr + dr, nc = rc + dc;
      if (nr < 0 || nr >= roomSize || nc < 0 || nc >= roomSize) continue;
      if (visited[nr][nc]) continue;
      // Carve the wall between rr,rc and nr,nc
      grid[rr * 2 + 1 + dr][rc * 2 + 1 + dc] = 0;
      carve(nr, nc);
    }
  }

  carve(0, 0);
  return grid;
}

function _placeBugs(grid, gridSize, bugCount, pauseAtEnd, start, exit) {
  // Collect all floor cells that are not start or exit
  const floors = [];
  for (let r = 1; r < gridSize - 1; r++) {
    for (let c = 1; c < gridSize - 1; c++) {
      if (grid[r][c] === 0
          && !(r === start[0] && c === start[1])
          && !(r === exit[0]  && c === exit[1])) {
        floors.push([r, c]);
      }
    }
  }
  floors.sort(() => Math.random() - 0.5);

  const bugs = [];
  const chosen = floors.slice(0, bugCount);

  chosen.forEach((cell, i) => {
    const [r, c] = cell;
    const icon   = (i % 2 === 0) ? '🐛' : '🪱';

    // Build a short patrol path from adjacent floor cells
    const adj = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]
      .filter(([nr,nc]) => nr > 0 && nr < gridSize-1 && nc > 0 && nc < gridSize-1
                        && grid[nr][nc] === 0
                        && !(nr === start[0] && nc === start[1])
                        && !(nr === exit[0]  && nc === exit[1]));

    let path;
    if (adj.length === 0) {
      path = [[r,c]];
    } else if (adj.length === 1) {
      path = [[r,c], adj[0]];
    } else {
      const a      = adj[Math.floor(Math.random() * adj.length)];
      const others = adj.filter(n => !(n[0] === a[0] && n[1] === a[1]));
      const b      = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : null;
      path = b ? [a, [r,c], b, [r,c]] : [[r,c], a];
    }

    bugs.push({ path, pauseAtEnd, icon });
  });

  return bugs;
}

const MazeEngine = {
  _node:      null,
  _isActive:  false,
  _script:    [],
  _lineIdx:   0,

  // ── Runtime state ─────────────────────────────────────────────────────────
  _grid:      [],
  _misty:     null,
  _exit:      null,
  _bugs:      [],   // [{ row, col, path, pathIdx, speed, icon }]
  _lives:     0,
  _size:      0,
  _livesLost: 0,
  _finished:  false,
  _maxLives:  0,

  // ─── Entry point ─────────────────────────────────────────────────────────
  start(node) {
    this._node     = node;
    this._isActive = true;
    this._script   = MISTY_MAZE_SCRIPTS[Math.floor(Math.random() * MISTY_MAZE_SCRIPTS.length)];
    this._lineIdx  = 0;

    showScreen('boss');
    BossEngine._isRocket = false;

    const bgImg = document.querySelector('#screen-boss .battle-bg-img');
    if (bgImg) { bgImg.src = ''; bgImg.style.opacity = '0'; }

    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';
    document.getElementById('boss-party-bar').innerHTML       = '';

    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = 'Into the Maze! ▶';

    this._showLine(0);
  },

  _showLine(idx) {
    const line   = this._script[idx];
    const name   = GameState.trainerName || 'Trainer';
    const text   = line.text.replace(/\$\{name\}/g, name);
    const isLast = idx === this._script.length - 1;

    const img = document.getElementById('boss-trainer-sprite');
    if (img) { img.src = line.img; }
    document.getElementById('dialogue-name').textContent = line.name;
    document.getElementById('dialogue-text').textContent = '';

    const nextBtn  = document.getElementById('btn-dialogue-next');
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (nextBtn)  nextBtn.style.display  = 'none';
    if (startBtn) startBtn.style.display = 'none';

    let ci = 0;
    const iv = setInterval(() => {
      document.getElementById('dialogue-text').textContent += text[ci++];
      if (ci >= text.length) {
        clearInterval(iv);
        if (isLast) { if (startBtn) startBtn.style.display = ''; }
        else        { if (nextBtn)  nextBtn.style.display  = ''; }
      }
    }, 28);

    this._lineIdx = idx;
  },

  advanceDialogue() {
    const next = this._lineIdx + 1;
    if (next < this._script.length) this._showLine(next);
  },

  // ─── Start the actual maze ────────────────────────────────────────────────
  startGame() {
    this._isActive = false;
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = 'Battle! ▶';
    document.getElementById('trainer-intro').style.display = 'none';

    const tier  = GameState.difficultyTier || 2;
    const cfg   = MAZE_TIER_CFG[tier] || MAZE_TIER_CFG[2];

    this._size      = cfg.gridSize;
    this._lives     = cfg.lives;
    this._maxLives  = cfg.lives;
    this._livesLost = 0;
    this._finished  = false;

    // Generate a fresh maze every time
    this._grid  = _generateMaze(cfg.gridSize);

    const start = [1, 1];
    const exit  = [cfg.gridSize - 2, cfg.gridSize - 2];
    this._misty = { row: start[0], col: start[1] };
    this._exit  = { row: exit[0],  col: exit[1] };

    const bugDefs = _placeBugs(this._grid, cfg.gridSize, cfg.bugCount, cfg.pauseAtEnd, start, exit);
    this._bugs = bugDefs.map(b => ({
      row:          b.path[0][0],
      col:          b.path[0][1],
      path:         b.path,
      pathIdx:      0,
      pauseAtEnd:   b.pauseAtEnd,
      pauseCounter: 0,   // counts down when frozen at a path end
      icon:         b.icon,
    }));

    showScreen('maze');
    this._renderMaze();
    this._bindControls();
  },

  // ─── Bugs step when Misty moves ──────────────────────────────────────────
  // Each bug moves 1 cell per player step.
  // When a bug reaches either end of its patrol path it pauses for
  // `pauseAtEnd` player steps before reversing — giving the player a window.
  _stepBugs() {
    this._bugs.forEach(bug => {
      if (bug.path.length <= 1) return;  // static bug — never moves

      // Currently paused at an end — count down and stay put
      if (bug.pauseCounter > 0) {
        bug.pauseCounter--;
        return;
      }

      // Advance one step
      bug.pathIdx = (bug.pathIdx + 1) % bug.path.length;
      bug.row = bug.path[bug.pathIdx][0];
      bug.col = bug.path[bug.pathIdx][1];

      // Check if we've reached an end of the path (index 0 or last index)
      const isEnd = bug.pathIdx === 0 || bug.pathIdx === bug.path.length - 1;
      if (isEnd) {
        bug.pauseCounter = bug.pauseAtEnd;
      }
    });
  },

  // ─── Player movement ──────────────────────────────────────────────────────
  _move(dr, dc) {
    if (this._finished) return;
    const nr = this._misty.row + dr;
    const nc = this._misty.col + dc;
    if (nr < 0 || nr >= this._size || nc < 0 || nc >= this._size) return;
    if (this._grid[nr][nc] === 1) return;   // wall — do NOT step bugs on blocked moves
    this._misty.row = nr;
    this._misty.col = nc;
    // Step bugs AFTER Misty moves so the player sees where they're moving to
    this._stepBugs();
    this._checkCollision();
    this._checkExit();
    this._renderMaze();
  },

  _checkCollision() {
    if (this._finished) return;
    const hit = this._bugs.some(b => b.row === this._misty.row && b.col === this._misty.col);
    if (!hit) return;
    this._livesLost++;
    this._lives--;
    if (this._lives <= 0) {
      this._finish('fail');
    } else {
      const grid = document.getElementById('maze-grid');
      if (grid) {
        grid.classList.remove('maze-hit');
        void grid.offsetWidth;
        grid.classList.add('maze-hit');
      }
      this._renderMaze();
    }
  },

  _checkExit() {
    if (this._misty.row === this._exit.row && this._misty.col === this._exit.col) {
      this._finish(this._livesLost === 0 ? 'perfect' : 'partial');
    }
  },

  _finish(outcome) {
    if (this._finished) return;
    this._finished = true;

    const party = GameState.party.filter(p => p.hp > 0);
    let headline, detail, quote;

    if (outcome === 'perfect') {
      party.forEach(p => { p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * 0.20)); });
      headline = '✨ Made It Through!';
      detail   = 'All Pokémon healed 20% HP!';
      quote    = 'I made it! Ugh — those bugs... but your Pokémon look so refreshed after watching me suffer through that.';
    } else if (outcome === 'partial') {
      const lead = party[0];
      if (lead) lead.hp = Math.min(lead.maxHp, lead.hp + Math.floor(lead.maxHp * 0.10));
      headline = '😰 Made It — Barely!';
      detail   = 'Lead Pokémon healed 10% HP.';
      quote    = 'I made it, but one of those things TOUCHED me. I need a moment. Here — take care of your partner.';
    } else {
      party.forEach(p => { p.hp = Math.max(1, p.hp - Math.floor(p.hp * 0.05)); });
      headline = '😱 Too Many Bugs!';
      detail   = 'All Pokémon lost 5% HP.';
      quote    = 'I CAN\'T. There are too many of them. We\'re going around. Sorry.';
    }

    saveGame();
    showModal(headline, `${detail}\n\n"${quote}" — Misty`, () => {
      MapEngine.completeNode(GameState.currentNodeIndex);
      MapEngine.show();
    });
  },

  // ─── Rendering ────────────────────────────────────────────────────────────
  _renderMaze() {
    const gridEl = document.getElementById('maze-grid');
    if (!gridEl) return;
    gridEl.style.gridTemplateColumns = `repeat(${this._size}, 1fr)`;

    const bugMap = {};
    this._bugs.forEach(b => { bugMap[`${b.row},${b.col}`] = b.icon; });

    let html = '';
    for (let r = 0; r < this._size; r++) {
      for (let c = 0; c < this._size; c++) {
        const key     = `${r},${c}`;
        const isWall  = this._grid[r][c] === 1;
        const isMisty = r === this._misty.row && c === this._misty.col;
        const isExit  = r === this._exit.row  && c === this._exit.col;
        const bugIcon = bugMap[key];

        let cls = 'maze-cell';
        let content = '';
        if (isWall)       { cls += ' maze-wall'; }
        else if (isExit)  { cls += ' maze-exit'; content = isMisty ? '🏃‍♀️' : '✨'; }
        else if (isMisty) { cls += ' maze-misty'; content = '🏃‍♀️'; }
        else if (bugIcon) { cls += ' maze-bug'; content = bugIcon; }
        else              { cls += ' maze-floor'; }

        html += `<div class="${cls}">${content}</div>`;
      }
    }
    gridEl.innerHTML = html;

    // Lives display
    const livesEl = document.getElementById('maze-lives');
    if (livesEl) {
      livesEl.textContent = '❤️'.repeat(this._lives)
        + '🖤'.repeat(Math.max(0, this._maxLives - this._lives));
    }
  },

  // ─── D-pad ────────────────────────────────────────────────────────────────
  _bindControls() {
    const dirs = {
      'maze-up':    [-1,  0],
      'maze-down':  [ 1,  0],
      'maze-left':  [ 0, -1],
      'maze-right': [ 0,  1],
    };
    Object.entries(dirs).forEach(([id, [dr, dc]]) => {
      const btn = document.getElementById(id);
      if (btn) btn.onclick = () => this._move(dr, dc);
    });
  },
};

// ── MAZE MINI-GAME END ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// ── FISHING MINI-GAME START ───────────────────────────────────────────────────
// To remove: delete FISHING_PUZZLES + FishingEngine + 'fishing' node injection
//   + 'fishing' in NODE_ICONS/ARROW_LABELS + case 'fishing' dispatch
//   + fishingBuff in _applyCardEffect + challenge-continue-btn routing change
// ─────────────────────────────────────────────────────────────────────────────

// Each puzzle: one Pokémon described through clues, one question, one answer.
// mode: 'super_effective' = what beats it  |  'not_effective' = what it resists
// correctTypes: array — all accepted answers (some types share weaknesses)
// pokeId: shown as reveal at the end
const FISHING_PUZZLES = [
  // ── TIER 1 ─────────────────────────────────────────────────────────────────
  {
    tier:1, pokeId:129, targetType:'water', mode:'super_effective',
    clues:[
      'I can see something jumping! It keeps leaping out of the water.',
      'It\'s orange and has fins. It splashes a lot but doesn\'t seem very tough...',
    ],
    summary: 'An orange, fin-covered Pokémon that loves leaping out of the water. Doesn\'t look very strong yet!',
    question: '🎣 Which lure would be SUPER EFFECTIVE against this Water-type?',
    correctTypes: ['electric','grass'],
    explanation: 'Water Pokémon are weak to Electric and Grass moves — like splashing in a puddle near a power line!',
    mistyFluff_right: 'Exactly right! Now let\'s hope it doesn\'t just splash at us.',
    mistyFluff_wrong: 'It\'s a Water type! Electric or Grass lures work best on Water Pokémon.',
  },
  {
    tier:1, pokeId:10, targetType:'bug', mode:'super_effective',
    clues:[
      'Ewww. Something green is crawling on the riverbank.',
      'It has lots of little legs and huge round eyes. I really don\'t want it near me.',
    ],
    summary: 'A small, green, many-legged creature crawling slowly near the water. Very creepy according to Misty.',
    question: '🎣 Which lure would be SUPER EFFECTIVE against this Bug-type?',
    correctTypes: ['fire','flying','rock'],
    explanation: 'Bug Pokémon are weak to Fire, Flying, and Rock — think of a bug flying too close to a flame!',
    mistyFluff_right: 'Yes! Now use it and get that thing AWAY from me.',
    mistyFluff_wrong: 'It\'s Bug-type! Fire, Flying, or Rock lures are super effective against Bug Pokémon.',
  },
  {
    tier:1, pokeId:54, targetType:'water', mode:'not_effective',
    clues:[
      'There\'s something cute looking up at me with big eyes...',
      'It\'s yellow and looks confused. It keeps tilting its head.',
    ],
    summary: 'A small, yellow, big-eyed Pokémon that looks permanently confused. Actually quite adorable.',
    question: '🎣 Misty WANTS this one! Which lure would NOT scare it away? (Not effective against Water)',
    hint_t1: 'Misty WANTS this Pokémon! Pick a type that Water Pokémon are NOT hurt by.',
    correctTypes: ['water','fire','normal'],
    explanation: 'Water Pokémon resist Water and Fire moves — they just drink them up! Use one of those to avoid scaring it.',
    mistyFluff_right: 'Perfect! A gentle lure so we don\'t frighten the little thing.',
    mistyFluff_wrong: 'Water Pokémon resist Water and Fire moves — those won\'t scare it off.',
  },
  // ── TIER 2 ─────────────────────────────────────────────────────────────────
  {
    tier:2, pokeId:72, targetType:'poison', mode:'super_effective',
    clues:[
      'Something is floating just below the surface. It\'s almost see-through.',
      'It has long tentacles trailing behind it. They look dangerous — possibly venomous.',
      'It drifts on the current without swimming. Almost like a jellyfish.',
    ],
    summary: 'Translucent, tentacled, venomous, drifting on the current. A water-dwelling creature with a toxic sting.',
    question: '🎣 This is a Poison-type! Which lure would be SUPER EFFECTIVE?',
    correctTypes: ['ground','psychic'],
    explanation: 'Poison Pokémon are weak to Ground and Psychic — their toxins don\'t work against a clear mind or solid earth!',
    mistyFluff_right: 'Ugh, Tentacool. But at least now I know how to deal with it.',
    mistyFluff_wrong: 'Poison types are weak to Ground and Psychic moves. Think: what neutralises venom?',
  },
  {
    tier:2, pokeId:79, targetType:'water', mode:'not_effective',
    clues:[
      'Something enormous is half-submerged near the reeds...',
      'It looks like it\'s asleep even though it\'s moving. Very... slow.',
      'Pink body, vacant expression. It doesn\'t seem to notice anything around it.',
    ],
    summary: 'A huge, pink, perpetually drowsy Pokémon wading through the shallows. Moves incredibly slowly.',
    question: '🎣 Misty wants it! Which type would NOT be effective, so she doesn\'t scare it off?',
    correctTypes: ['water','fire','ice'],
    explanation: 'Slowpoke is Water/Psychic. It resists Water, Fire, Ice, and Psychic moves — it barely notices them!',
    mistyFluff_right: 'Use a calm lure so we don\'t startle it. It takes about five minutes to notice anything anyway.',
    mistyFluff_wrong: 'Slowpoke resists Water and Fire types — those moves just wash right off it.',
  },
  {
    tier:2, pokeId:120, targetType:'water', mode:'super_effective',
    clues:[
      'Something is spinning rapidly underneath the surface — it\'s making tiny whirlpools.',
      'It\'s shaped like a star. Bright red. Very fast.',
      'It moves in every direction instantly, like it has no front or back.',
    ],
    summary: 'A spinning, star-shaped, bright red Pokémon that can move in any direction at high speed.',
    question: '🎣 This Water-type is quick and acrobatic! What lure is SUPER EFFECTIVE?',
    correctTypes: ['electric','grass'],
    explanation: 'Staryu is a Water type — Electric and Grass lures are super effective because water conducts electricity!',
    mistyFluff_right: 'Staryu! One of my favourites. But I need it to feel the challenge of a proper lure first.',
    mistyFluff_wrong: 'Water types are weak to Electric and Grass. Even Staryu can\'t dodge a thunderbolt!',
  },
  // ── TIER 3 ─────────────────────────────────────────────────────────────────
  {
    tier:3, pokeId:130, targetType:'water', mode:'super_effective',
    clues:[
      'The whole lake just rippled. Something massive moved down there.',
      'I can see a red mane under the water. It\'s long and serpentine.',
      'Its scales look like armour. I can feel the power from here.',
      'It broke the surface for a second — fangs, a coiling body, enormous.',
    ],
    summary: 'An enormous, serpentine, armoured sea creature with a red mane and fearsome fangs. The lake trembled when it moved.',
    question: '🎣 This is a Water/Flying type! What lure is SUPER EFFECTIVE against both types?',
    correctTypes: ['electric'],
    explanation: 'Gyarados is Water AND Flying — Electric is 4× super effective because it\'s weak to Electric from BOTH types! That\'s double damage!',
    mistyFluff_right: 'Electric! Yes — and against Gyarados that\'s not just super effective, it\'s DOUBLY effective. Brilliant.',
    mistyFluff_wrong: 'Gyarados is Water/Flying — Electric is the only type that\'s super effective against BOTH. It\'s doubly weak!',
  },
  {
    tier:3, pokeId:121, targetType:'psychic', mode:'not_effective',
    clues:[
      'Something is glowing faintly near the surface — a soft light pulsing rhythmically.',
      'It has the same star shape but much larger. It seems to radiate awareness.',
      'I get the feeling it already knows what I\'m going to do before I do it.',
      'When I thought "I want to catch it", it looked directly at me.',
    ],
    summary: 'A large, glowing, star-shaped Pokémon that seems to read minds. It looks ancient and serene.',
    question: '🎣 Starmie is Water/Psychic. Which type would be NOT very effective against it?',
    correctTypes: ['fire','water','ice','psychic'],
    explanation: 'Starmie resists Fire, Water, Ice, and Psychic. Its Water typing resists Fire and Ice — its Psychic typing resists Psychic and Fighting!',
    mistyFluff_right: 'Exactly — Starmie shrugs those off completely. You really know your types.',
    mistyFluff_wrong: 'Starmie is Water/Psychic — it resists Fire, Water, Ice and Psychic. Those moves barely tickle it.',
  },
  {
    tier:3, pokeId:117, targetType:'water', mode:'super_effective',
    clues:[
      'Something with fins is circling just below. It seems to be breathing fire bubbles.',
      'Wait — fire? Underwater? The water around it is actually warm.',
      'It has a horse-like shape. Its mane is made of flame that somehow burns underwater.',
    ],
    summary: 'A horse-shaped Pokémon whose flaming mane somehow keeps burning even underwater. The water around it is warm.',
    question: '🎣 It\'s a Water-type despite the flames! Which lure is SUPER EFFECTIVE?',
    correctTypes: ['electric','grass'],
    explanation: 'Seadra is pure Water type despite looking fiery — Electric and Grass are still super effective because its type is what matters, not its looks!',
    mistyFluff_right: 'Right! Looks can be deceiving — it\'s the TYPE that matters, not the appearance.',
    mistyFluff_wrong: 'Don\'t be fooled by the flames! Seadra is Water type — Electric and Grass are super effective regardless of how it looks.',
  },
];

const TYPE_ICONS = {
  normal:'⬜', fire:'🔥', water:'💧', grass:'🌿', electric:'⚡',
  ice:'❄️', fighting:'🥊', poison:'☠️', ground:'⛰️', flying:'🕊️',
  psychic:'🔮', bug:'🐛', rock:'🪨', ghost:'👻', dragon:'🐉',
  dark:'🌑', steel:'⚙️', fairy:'✨',
};

const FishingEngine = {
  _isActive:  false,
  _node:      null,
  _puzzle:    null,
  _clueIdx:   0,      // which clue we're on (0-based)
  _answered:  false,

  // ── Entry: show boss-screen intro then transition to challenge screen ──────
  start(node) {
    this._node     = node;
    this._isActive = true;
    this._answered = false;

    // Pick a puzzle for this tier
    const tier    = GameState.difficultyTier || 2;
    const pool    = FISHING_PUZZLES.filter(p => p.tier === tier);
    this._puzzle  = pool[Math.floor(Math.random() * pool.length)];
    this._clueIdx = 0;

    // Use boss-screen intro: Misty's portrait + opening line
    showScreen('boss');
    BossEngine._isRocket = false;
    CookingEngine._isActive = false;
    MazeEngine._isActive    = false;

    const bgImg = document.querySelector('#screen-boss .battle-bg-img');
    if (bgImg) { bgImg.src = ''; bgImg.style.opacity = '0'; }

    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';
    document.getElementById('boss-party-bar').innerHTML       = '';

    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = 'Start Fishing! 🎣';

    // Show Misty's portrait with opening line
    const img = document.getElementById('boss-trainer-sprite');
    if (img) img.src = 'assets/misty.png';
    document.getElementById('dialogue-name').textContent = 'Misty';
    document.getElementById('dialogue-text').textContent = '';

    const openLine = `${GameState.trainerName || 'Trainer'}! I spotted something interesting in the water. Let me describe it — you figure out the best lure!`;
    let ci = 0;
    const iv = setInterval(() => {
      document.getElementById('dialogue-text').textContent += openLine[ci++];
      if (ci >= openLine.length) {
        clearInterval(iv);
        if (startBtn) startBtn.style.display = '';
        document.getElementById('btn-dialogue-next').style.display = 'none';
      }
    }, 28);
  },

  // ── Called by btn-start-boss-battle when FishingEngine._isActive ──────────
  startGame() {
    this._isActive = false;
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = 'Battle! ▶';
    document.getElementById('trainer-intro').style.display = 'none';
    this._showClueStage();
  },

  // ── Show challenge screen with clue reveal ────────────────────────────────
  _showClueStage() {
    // Reuse challenge screen
    const tier = GameState.difficultyTier || 2;
    const p    = this._puzzle;

    // Header
    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = 'assets/misty.png'; img.style.display = ''; }
    document.getElementById('challenge-badge').textContent   = '🎣 Misty\'s Fishing Challenge';
    document.getElementById('challenge-intro').textContent   = 'Read the clues carefully, then pick your lure!';
    document.getElementById('challenge-coin-visual').style.display  = 'none';
    document.getElementById('jessie-word-display').style.display    = 'none';
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';
    document.getElementById('challenge-answer-btns').innerHTML      = '';

    // Build clue bubbles area inside challenge-coin-visual (repurposed)
    const clueArea = document.getElementById('challenge-coin-visual');
    clueArea.style.display = 'block';
    clueArea.className     = 'fishing-clue-area';
    this._renderClues(clueArea);

    // Question — hidden until all clues shown
    const qEl = document.getElementById('challenge-question');
    qEl.style.display = this._clueIdx >= p.clues.length ? '' : 'none';
    qEl.textContent   = '';

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.add('fishing-active');
    SoundEngine.playBGM('pallet_town_theme.mp3');
    this._renderCurrentClue();
  },

  // ── Render all revealed clues as speech bubbles ───────────────────────────
  _renderClues(container) {
    const p   = this._puzzle;
    const all = this._clueIdx >= p.clues.length;
    let html  = '';

    // Speech bubbles for clues revealed so far
    for (let i = 0; i < Math.min(this._clueIdx, p.clues.length); i++) {
      html += `<div class="fishing-bubble fishing-bubble-shown">${p.clues[i]}</div>`;
    }

    if (all) {
      // Full summary paragraph
      html += `<div class="fishing-summary">${p.summary}</div>`;
    }

    container.innerHTML = html;
  },

  // ── Render the current clue being typed out, plus Next / question ─────────
  _renderCurrentClue() {
    const p   = this._puzzle;
    const qEl = document.getElementById('challenge-question');
    const btnArea = document.getElementById('challenge-answer-btns');

    if (this._clueIdx < p.clues.length) {
      // Still revealing clues — show the current one with typewriter
      const clueArea = document.getElementById('challenge-coin-visual');
      const bubbleEl = document.createElement('div');
      bubbleEl.className = 'fishing-bubble fishing-bubble-typing';
      clueArea.appendChild(bubbleEl);

      const text = p.clues[this._clueIdx];
      let ci = 0;
      const iv = setInterval(() => {
        bubbleEl.textContent += text[ci++];
        if (ci >= text.length) {
          clearInterval(iv);
          bubbleEl.className = 'fishing-bubble fishing-bubble-shown';
          this._clueIdx++;

          if (this._clueIdx < p.clues.length) {
            // More clues — show Next button
            qEl.style.display   = 'none';
            btnArea.innerHTML   = '';
            const nb = document.createElement('button');
            nb.className        = 'btn-pixel btn-secondary fishing-next-btn';
            nb.textContent      = 'Next clue ▶';
            nb.onclick          = () => { btnArea.innerHTML = ''; this._renderCurrentClue(); };
            btnArea.appendChild(nb);
          } else {
            // All clues done — show summary + question
            this._renderClues(clueArea);
            this._showQuestion();
          }
        }
      }, 32);

    } else {
      // All clues already revealed (re-entering)
      this._showQuestion();
    }
  },

  // ── Show the question + answer buttons ────────────────────────────────────
  _showQuestion() {
    const p    = this._puzzle;
    const tier = GameState.difficultyTier || 2;
    const qEl  = document.getElementById('challenge-question');

    // For Tier 1 Mode not_effective, show extra hint
    let questionText = p.question;
    if (tier === 1 && p.mode === 'not_effective' && p.hint_t1) {
      questionText = p.hint_t1;
    }
    qEl.textContent  = questionText;
    qEl.style.display = '';

    // Build 4 answer choices: all correctTypes + enough decoys to reach 4
    const allTypes = Object.keys(TYPE_ICONS);
    const decoyPool = allTypes.filter(t => !p.correctTypes.includes(t));
    const decoys    = decoyPool.sort(() => Math.random() - 0.5).slice(0, 4 - p.correctTypes.length);
    // Tier 1: always include exactly 1 correct type and 3 decoys
    const choices   = [...p.correctTypes.slice(0, tier === 1 ? 1 : p.correctTypes.length), ...decoys]
      .sort(() => Math.random() - 0.5);

    const btnArea = document.getElementById('challenge-answer-btns');
    btnArea.innerHTML = '';
    choices.forEach(type => {
      const b = document.createElement('button');
      b.className   = `challenge-answer-btn fishing-type-btn type-btn-${type}`;
      b.innerHTML   = `${TYPE_ICONS[type] || ''} <span class="hud-type-badge type-${type}">${type}</span>`;
      b.dataset.type = type;
      b.addEventListener('click', () => this._answer(type));
      btnArea.appendChild(b);
    });
  },

  // ── Handle answer ─────────────────────────────────────────────────────────
  _answer(chosenType) {
    if (this._answered) return;
    this._answered = true;

    const p       = this._puzzle;
    const name    = GameState.trainerName || 'Trainer';
    const isRight = p.correctTypes.includes(chosenType);

    // Disable all buttons, highlight correct/wrong
    document.querySelectorAll('.challenge-answer-btn').forEach(b => {
      b.disabled = true;
      if (p.correctTypes.includes(b.dataset.type)) b.classList.add('answer-correct');
      else if (b.dataset.type === chosenType && !isRight) b.classList.add('answer-wrong');
    });

    const resultEl = document.getElementById('challenge-result');
    resultEl.style.display = 'block';

    if (isRight) {
      // Apply buff
      const buffType = chosenType;
      GameState.fishingBuff = { type: buffType, mult: 1.3 };
      const goldReward = 8 + (GameState.bossesDefeated || 0) * 2;
      GameState.gold = (GameState.gold || 0) + goldReward;
      saveGame();
      resultEl.className = 'challenge-result result-correct';
      resultEl.innerHTML =
        `✅ <strong>Correct, ${name}!</strong><br>` +
        `${p.explanation}<br>` +
        `<em>"${p.mistyFluff_right}"</em><br>` +
        `<span class="fishing-buff-notice">🎣 ${TYPE_ICONS[buffType]} ${buffType.charAt(0).toUpperCase()+buffType.slice(1)}-type moves deal <strong>+30% damage</strong> in your next battle! +${goldReward}💰</span>`;
      SoundEngine.playFanfare();
    } else {
      saveGame();
      resultEl.className = 'challenge-result result-wrong';
      resultEl.innerHTML =
        `❌ <strong>The answer is: ${p.correctTypes[0]}</strong><br>` +
        `${p.explanation}<br>` +
        `<em>"${p.mistyFluff_wrong}"</em>`;
    }

    // Reveal Pokémon after result
    this._revealPokemon();

    document.getElementById('challenge-continue-btn').style.display = 'block';
    document.getElementById('challenge-continue-btn').textContent   = 'Continue ▶';
  },

  // ── Reveal the Pokémon being described ───────────────────────────────────
  async _revealPokemon() {
    const p    = this._puzzle;
    const revEl = document.getElementById('jessie-word-display');
    revEl.style.display = 'flex';
    revEl.className     = 'fishing-reveal';

    const wordEl = document.getElementById('jessie-word');
    const typeEl = document.getElementById('jessie-word-type');
    wordEl.textContent = '...';
    typeEl.textContent = '';

    try {
      const data = await fetchPoke(p.pokeId);
      const name = capitalize(data.name);
      const spriteUrl = data.sprites?.front_default || getSpriteUrl(data);
      const types = (data.types || []).map(t => t.type.name);

      wordEl.innerHTML = `<img src="${spriteUrl}" alt="${name}"
        class="fishing-reveal-sprite" onerror="this.style.display='none'" />${name}`;
      typeEl.innerHTML = types.map(t =>
        `<span class="hud-type-badge type-${t}">${t}</span>`
      ).join(' ');
    } catch(e) {
      wordEl.textContent = `Pokémon #${p.pokeId}`;
    }
  },

  // ── Continue button — complete node and go back to map ───────────────────
  finish() {
    this._isActive = false;
    document.getElementById('screen-challenge').classList.remove('fishing-active');
    document.getElementById('challenge-continue-btn').textContent = 'Continue ▶';
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },
};

// ── FISHING MINI-GAME END ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const HealEngine = {
  start(node) {
    showScreen('heal');
    // Apply heal center background
    const healBg = document.getElementById('heal-bg');
    if (healBg) {
      healBg.style.background = 'linear-gradient(180deg,#fff0f4 0%,#ffe0e8 50%,#ffd0e0 100%)';
      const img = new Image();
      img.onload  = () => { healBg.style.background = `url('assets/backgrounds/bg_heal.png') center center / cover no-repeat`; };
      img.src = 'assets/backgrounds/bg_heal.png';
    }
    setTimeout(() => SoundEngine.playRecovery(), 400);
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

const VictoryEngine = {
  show() {
    const stats = GameState.stats || {};
    const party = GameState.party || [];

    // Use cumulative stats — these never reset between maps
    document.getElementById('vic-battles-won').textContent =
      stats.totalBattlesWon    || stats.battlesWon   || 0;
    document.getElementById('vic-caught').textContent      =
      stats.pokemonCaught      || 0;
    document.getElementById('vic-nodes').textContent       =
      stats.totalNodesCompleted || GameState.completedNodes?.length || 0;
    document.getElementById('vic-bosses').textContent      =
      stats.totalBossesBeaten  || GameState.bossesDefeated || 0;

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
      'You are the PokéTrials Champion! Pikachu is now unlocked!';

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
  if (nameEl)  nameEl.textContent  = (name || '???').toUpperCase();
  if (levelEl) levelEl.textContent = `Lv.${level}`;
}

// ── Battle sprite animations ──────────────────────────────────────────────────

// Type → CSS class for coloured hit flash on the defender
const TYPE_HIT_CLASS = {
  fire:     'hit-flash-fire',
  water:    'hit-flash-water',
  grass:    'hit-flash-grass',
  electric: 'hit-flash-electric',
  psychic:  'hit-flash-psychic',
  ice:      'hit-flash-ice',
  rock:     'hit-flash-rock',
  ground:   'hit-flash-ground',
  poison:   'hit-flash-poison',
  ghost:    'hit-flash-ghost',
  dragon:   'hit-flash-dragon',
  dark:     'hit-flash-dark',
  fighting: 'hit-flash-fighting',
  flying:   'hit-flash-flying',
  steel:    'hit-flash-steel',
  normal:   'hit-flash-normal',
};

function applyHitAnimation(attackerSpriteId, defenderSpriteId, moveType) {
  const atk = document.getElementById(attackerSpriteId);
  const def = document.getElementById(defenderSpriteId);

  // Attacker: lunge forward
  if (atk) {
    atk.classList.remove('sprite-lunge');
    void atk.offsetWidth;
    atk.classList.add('sprite-lunge');
    setTimeout(() => atk.classList.remove('sprite-lunge'), 350);
  }

  // Defender: shake + type-coloured flash, with slight delay after lunge
  if (def) {
    const flashClass = TYPE_HIT_CLASS[moveType] || 'hit-flash-normal';
    setTimeout(() => {
      def.classList.remove('hit-shake', flashClass);
      void def.offsetWidth;
      def.classList.add('hit-shake', flashClass);
      setTimeout(() => def.classList.remove('hit-shake', flashClass), 500);
    }, 150);
  }
}

// Keep shakeSprite for status-tick damage (no attacker, no type colour needed)
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

  // ── Register screen ──
  RegistrationEngine.init();
  document.getElementById('btn-name-confirm').addEventListener('click', () => RegistrationEngine.confirmName());
  document.getElementById('btn-age-confirm').addEventListener('click',  () => RegistrationEngine.confirmAge());
  document.getElementById('btn-register-back').addEventListener('click', () => {
    GameState = null;
    activeProfile = null;
    try { sessionStorage.removeItem('pokerogue_active_profile'); } catch(e) {}
    ProfileEngine.show();
  });
  document.getElementById('trainer-name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') RegistrationEngine.confirmName();
  });

  // ── Intro cinematic ──
  document.getElementById('btn-intro-next').addEventListener('click', () => IntroEngine.next());
  document.getElementById('btn-intro-skip').addEventListener('click', () => IntroEngine.skip());
  document.getElementById('btn-tut-next').addEventListener('click',  () => TutorialEngine.next());
  document.getElementById('btn-tut-skip').addEventListener('click',  () => TutorialEngine.skip());

  // ── Meowth / Fishing / Surge / Erika / Koga / Blaine challenge ──
  document.getElementById('challenge-continue-btn').addEventListener('click', () => {
    if (SurgeEngine._answered) {
      SurgeEngine._finish();
    } else if (SurgeEngine._round > 0 && SurgeEngine._round <= 3) {
      SurgeEngine.nextRound();
    } else if (ErikaEngine._answered) {
      ErikaEngine._finish();
    } else if (ErikaEngine._round > 0 && ErikaEngine._round <= 3) {
      ErikaEngine.nextRound();
    } else if (KogaEngine._answered) {
      KogaEngine.finish();
    } else if (BlaineEngine._answered) {
      BlaineEngine.finish();
    } else if (FishingEngine._answered) {
      FishingEngine.finish();
    } else {
      MeowthChallenge.finish();
    }
  });

  // ── Map screen ──
  document.getElementById('btn-map-menu').addEventListener('click', () => {
    showModal(
      'Return to Menu?',
      'Your progress is saved. You can continue from the main menu.',
      () => Game.goToMenu()
    );
    document.getElementById('modal-ok').textContent = 'Yes, leave';
  });

  // ── Mute buttons ──
  const updateMuteBtns = (muted) => {
    document.querySelectorAll('.mute-btn').forEach(b => { b.textContent = muted ? '🔇' : '🔊'; });
  };
  document.querySelectorAll('.mute-btn').forEach(btn => {
    btn.addEventListener('click', () => updateMuteBtns(SoundEngine.toggleMute()));
  });

  // ── Start screen ──
  document.getElementById('btn-new-game').addEventListener('click', () => Game.startNew());
  document.getElementById('btn-continue-game').addEventListener('click', () => Game.continueGame());
  document.getElementById('btn-open-pokedex').addEventListener('click', () => PokedexEngine.show());
  document.getElementById('btn-select-profile').addEventListener('click', () => ProfileEngine.show());
  document.getElementById('btn-switch-profile').addEventListener('click', () => ProfileEngine.show());
  document.getElementById('btn-profiles-back').addEventListener('click', () => {
    ProfileEngine._updateStartScreen();
    showScreen('start');
  });
  document.getElementById('btn-reset-all').addEventListener('click', () => {
    showModal(
      '⚠ Reset All Data?',
      'This will wipe ALL profiles, Pokédex entries, unlocks and saved progress. Cannot be undone.',
      () => Game.resetAll()
    );
    document.getElementById('modal-ok').textContent = 'Yes, reset everything';
  });

  // ── Battle screen ──
  document.getElementById('btn-end-turn').addEventListener('click', () => BattleEngine.endTurn());
  document.getElementById('btn-use-item').addEventListener('click', () => {
    if (BattleEngine._battleOver || BattleEngine._itemUsedThisTurn) return;
    ItemEngine.renderItemPicker(false, (itemId) => {
      const result = ItemEngine.usePotion(BattleEngine.state, false);
      if (result) {
        BattleEngine._itemUsedThisTurn = true;
        BattleEngine._log(result.msg);
        BattleEngine._render();
      }
    });
  });

  // ── Boss screen ──
  document.getElementById('btn-start-boss-battle').addEventListener('click', () => {
    if (CookingEngine._isActive) {
      CookingEngine.startGame();
    } else if (FishingEngine._isActive) {
      FishingEngine.startGame();
    } else if (SurgeEngine._isActive) {
      SurgeEngine.startGame();
    } else if (ErikaEngine._isActive) {
      ErikaEngine.startGame();
    } else if (KogaEngine._isActive) {
      KogaEngine.startGame();
    } else if (BlaineEngine._isActive) {
      BlaineEngine.startGame();
    } else if (SabrinaEngine._isActive) {
      SabrinaEngine.startGame();
    } else if (TrainerBattleEngine._isActive) {
      TrainerBattleEngine.startBattle();
    } else if (MazeEngine._isActive) {
      MazeEngine.startGame();
    } else if (BossEngine._isRocket) {
      RocketBattleEngine.startBattle();
    } else {
      BossEngine.startBattle();
    }
  });
  document.getElementById('btn-dialogue-next').addEventListener('click', () => {
    if (CookingEngine._isActive) {
      CookingEngine.advanceDialogue();
    } else if (MazeEngine._isActive) {      // ── MAZE MINI-GAME
      MazeEngine.advanceDialogue();         // ── MAZE MINI-GAME
    } else {
      RocketBattleEngine.advanceDialogue();
    }
  });
  document.getElementById('btn-boss-end-turn').addEventListener('click', () => BossEngine.endTurn());
  document.getElementById('btn-boss-use-item').addEventListener('click', () => {
    if (BossEngine._isOver || BattleEngine._itemUsedThisTurn) return;
    ItemEngine.renderItemPicker(true, (itemId) => {
      const result = ItemEngine.usePotion(BossEngine.bState, true);
      if (result) {
        BattleEngine._itemUsedThisTurn = true;
        BossEngine._log(result.msg);
        BossEngine._render();
      }
    });
  });

  // ── Catch screen ──
  document.getElementById('btn-throw-ball').addEventListener('click', () => {
    if (LegendaryEncounterEngine._bird) LegendaryEncounterEngine.throwBall();
    else CatchEngine.throwBall();
  });
  document.getElementById('btn-flee').addEventListener('click', () => CatchEngine.flee());
  document.getElementById('btn-catch-continue').addEventListener('click', () => {
    if (LegendaryEncounterEngine._bird === null && document.getElementById('screen-catch').classList.contains('legendary-active') === false && LegendaryEncounterEngine._node === GameState.currentNodeIndex) {
      LegendaryEncounterEngine.finish();
    } else if (LegendaryEncounterEngine._node === GameState.currentNodeIndex) {
      LegendaryEncounterEngine.finish();
    } else {
      CatchEngine.finish();
    }
  });

  // ── Card reward screen ──
  document.getElementById('btn-cr-skip').addEventListener('click', () => CardReward.skip());

  // ── Shop screen ──
  document.getElementById('btn-shop-leave').addEventListener('click', () => ShopEngine.finish());

  // ── Pokédex screen ──
  document.getElementById('btn-pokedex-back').addEventListener('click', () => showScreen('start'));

  // ── Training screen ──
  document.getElementById('btn-improve').addEventListener('click', () => TrainingEngine.improve());
  document.getElementById('btn-training-skip').addEventListener('click', () => TrainingEngine.skip());
  document.getElementById('btn-training-pick-skip').addEventListener('click', () => TrainingEngine._startWithPokemon(GameState.activePokemonIndex));
  document.getElementById('training-mode-upgrade').addEventListener('click', () => TrainingEngine.setMode('upgrade'));
  document.getElementById('training-mode-remove').addEventListener('click', () => TrainingEngine.setMode('remove'));

  // ── Game Over screen ──
  document.getElementById('btn-gameover-restart').addEventListener('click', () => GameOver.restart());

  // ── Heal screen ──
  document.getElementById('btn-heal-finish').addEventListener('click', () => HealEngine.finish());

  // ── Evolve screen ──
  document.getElementById('btn-evolve-continue').addEventListener('click', () => Game.afterEvolve());

  // ── Cooking screen ──
  document.getElementById('btn-cooking-submit').addEventListener('click', () => CookingEngine.submit());

  // ── Victory screen ──
  document.getElementById('btn-play-again').addEventListener('click', () => Game.returnToStart());

  // ── Modal ──
  document.getElementById('modal-ok').addEventListener('click', () => closeModal());

  // Restore active profile from session, then update start screen
  const _storedProfile = getActiveProfile();
  const _allProfiles   = loadProfiles();
  if (_storedProfile && _allProfiles.find(p => p.key === _storedProfile)) {
    // Valid profile from last session — restore silently
    setActiveProfile(_storedProfile);
    ProfileEngine._updateStartScreen();
    showScreen('start');
  } else if (_allProfiles.length === 0) {
    // No profiles at all — show profile screen immediately so user creates one
    showScreen('profiles');
    ProfileEngine._render();
  } else {
    // Profiles exist but none active — show profile picker
    showScreen('profiles');
    ProfileEngine._render();
  }
});

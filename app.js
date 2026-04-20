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

// Level thresholds that trigger starter evolution
const EVOLUTION_LEVELS = {
  1:  { stage2: 16, stage3: 32 },
  4:  { stage2: 16, stage3: 36 },
  7:  { stage2: 16, stage3: 36 },
  25: { stage2: 22 },
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
const NODE_ICONS = { battle: '⚔️', heal: '💚', catch: '🔵', training: '⚡', shop: '🛒', boss: '💀', mystery: '❓' };
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
  steel:    [
    { name: 'Metal Claw',   power: 40, effect: null },
    { name: 'Iron Head',    power: 55, effect: null },
    { name: 'Flash Cannon', power: 48, effect: 'debuff_atk' },
    { name: 'Steel Wing',   power: 45, effect: null },
  ],
  dark:     [
    { name: 'Bite',       power: 40, effect: null },
    { name: 'Crunch',     power: 52, effect: 'debuff_atk' },
    { name: 'Dark Pulse',  power: 55, effect: null },
    { name: 'Sucker Punch', power: 42, effect: null },
  ],
  fairy:    [
    { name: 'Fairy Wind',  power: 38, effect: null },
    { name: 'Dazzling Gleam', power: 50, effect: null },
    { name: 'Moonblast',   power: 58, effect: 'debuff_atk' },
    { name: 'Sweet Kiss',  power: 0,  effect: 'debuff_atk' },
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
  dark:     [
    { id:'bite',        name:'Bite',        icon:'🦷', type:'dark',     power:42, cost:1, effect:'25% flinch',      special: 'flinch' },
    { id:'sucker_punch',name:'Sucker Punch',icon:'🌑', type:'dark',     power:40, cost:1, effect:'First if opp higher HP', special: null },
    { id:'crunch',      name:'Crunch',      icon:'💀', type:'dark',     power:55, cost:2, effect:'DEF -15',          special: 'debuff_def' },
    { id:'taunt',       name:'Taunt',       icon:'😈', type:'dark',     power:0,  cost:0, effect:'Opp utility blocked×2', special: 'taunt' },
    { id:'dark_pulse',  name:'Dark Pulse',  icon:'🌑', type:'dark',     power:58, cost:2, effect:'',                 special: null },
  ],
  steel:    [
    { id:'metal_claw',  name:'Metal Claw',  icon:'⚙️', type:'steel',   power:40, cost:1, effect:'',                 special: null },
    { id:'iron_defense',name:'Iron Defense',icon:'🛡️', type:'steel',   power:0,  cost:1, effect:'Block 50 dmg',    special: 'iron_defense' },
    { id:'flash_cannon', name:'Flash Cannon',icon:'💡', type:'steel',  power:52, cost:2, effect:'ATK -10',           special: 'debuff_atk' },
    { id:'iron_head',   name:'Iron Head',   icon:'⚙️', type:'steel',   power:58, cost:2, effect:'25% flinch',       special: 'flinch' },
    { id:'steel_beam',  name:'Steel Beam',  icon:'🔩', type:'steel',   power:90, cost:3, effect:'30 recoil. Once.', special: 'close_combat', exhaust: true },
  ],
  fairy:    [
    { id:'fairy_wind',  name:'Fairy Wind',  icon:'🧚', type:'fairy',   power:38, cost:1, effect:'',                 special: null },
    { id:'sweet_kiss',  name:'Sweet Kiss',  icon:'💋', type:'fairy',   power:0,  cost:1, effect:'ATK -25 for 1t',  special: 'debuff_atk' },
    { id:'misty_terrain',name:'Misty Terrain',icon:'✨',type:'fairy',  power:0,  cost:1, effect:'Clears status',    special: 'misty_terrain' },
    { id:'moonblast',   name:'Moonblast',   icon:'🌕', type:'fairy',   power:62, cost:2, effect:'ATK -10',          special: 'debuff_atk' },
    { id:'dazzling_gleam',name:'Dazzling Gleam',icon:'💫',type:'fairy',power:55, cost:2, effect:'',                 special: null },
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
};

// ── Battle background selection by opponent type ──────────────────────────
const BATTLE_BACKGROUNDS = {
  water:    'assets/water_bg.png',
  ice:      'assets/water_bg.png',
  grass:    'assets/grass_bg.png',
  bug:      'assets/grass_bg.png',
  normal:   'assets/grass_bg.png',
  flying:   'assets/grass_bg.png',
  rock:     'assets/ground_rock_bg.png',
  ground:   'assets/ground_rock_bg.png',
  fighting: 'assets/ground_rock_bg.png',
  steel:    'assets/ground_rock_bg.png',
  psychic:  'assets/ice_bg.png',
  fairy:    'assets/ice_bg.png',
  ghost:    'assets/ice_bg.png',
  dragon:   'assets/ice_bg.png',
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
    price: 8, maxStack: 3, trigger: 'passive',
  },
  {
    id: 'revive_potion',  name: 'Revive Potion',   icon: '🧪', category: 'consumable',
    description: 'Saves a Pokémon from fainting, restoring 30% HP instead.',
    price: 15, maxStack: 2, trigger: 'on_faint',
  },
  {
    id: 'potion',         name: 'Potion',           icon: '💊', category: 'consumable',
    description: 'Heals 30 HP to one Pokémon right now.',
    price: 10, maxStack: 3, trigger: 'use',
  },
  {
    id: 'super_potion',   name: 'Super Potion',     icon: '💉', category: 'consumable',
    description: 'Heals 60 HP to one Pokémon right now.',
    price: 20, maxStack: 2, trigger: 'use',
  },
  {
    id: 'ultra_ball',     name: 'Ultra Ball',       icon: '🟡', category: 'ball',
    description: '+50% catch rate for Uncommon and Rare Pokémon.',
    price: 12, maxStack: 3, trigger: 'catch',
  },
  {
    id: 'master_ball',    name: 'Master Ball',      icon: '🟣', category: 'ball',
    description: '100% catch rate. Only one per run!',
    price: 50, maxStack: 1, trigger: 'catch', unique: true,
  },
  {
    id: 'repel',          name: 'Repel',             icon: '🚫', category: 'consumable',
    description: 'Next Catch node: only Uncommon or Rare Pokémon appear.',
    price: 10, maxStack: 2, trigger: 'catch_modifier',
  },
  {
    id: 'lure',           name: 'Lure',              icon: '🎣', category: 'consumable',
    description: 'Increases Rare encounter chance for the rest of this map.',
    price: 20, maxStack: 1, trigger: 'lure_modifier',
  },
  // ── Held Items (equipped to a Pokémon) ───────────────────────────────────
  {
    id: 'shell_bell',     name: 'Shell Bell',        icon: '🔔', category: 'held',
    description: 'Holder heals 5 HP whenever they deal damage.',
    price: 25, maxStack: 1, trigger: 'held',
  },
  {
    id: 'lucky_egg',      name: 'Lucky Egg',         icon: '🥚', category: 'held',
    description: 'Holder gains +2 levels per battle instead of +1.',
    price: 30, maxStack: 1, trigger: 'held',
  },
  {
    id: 'amulet_coin',    name: 'Amulet Coin',       icon: '🪙', category: 'held',
    description: 'Holder doubles gold earned from battles.',
    price: 35, maxStack: 1, trigger: 'held',
  },
  {
    id: 'focus_sash',     name: 'Focus Sash',        icon: '🎗', category: 'held',
    description: 'Holder survives one KO hit with 1 HP. One use per battle.',
    price: 40, maxStack: 1, trigger: 'held',
  },
  {
    id: 'charcoal',       name: 'Charcoal',          icon: '🪵', category: 'held',
    description: 'Boosts Fire-type moves by 20%.',
    price: 20, maxStack: 1, trigger: 'held',
  },
  {
    id: 'mystic_water',   name: 'Mystic Water',      icon: '💦', category: 'held',
    description: 'Boosts Water-type moves by 20%.',
    price: 20, maxStack: 1, trigger: 'held',
  },
  {
    id: 'miracle_seed',   name: 'Miracle Seed',      icon: '🌱', category: 'held',
    description: 'Boosts Grass-type moves by 20%.',
    price: 20, maxStack: 1, trigger: 'held',
  },
  {
    id: 'magnet',         name: 'Magnet',             icon: '🧲', category: 'held',
    description: 'Boosts Electric-type moves by 20%.',
    price: 20, maxStack: 1, trigger: 'held',
  },
  {
    id: 'leftovers',      name: 'Leftovers',          icon: '🍖', category: 'held',
    description: 'Holder heals 5 HP at the start of every turn.',
    price: 30, maxStack: 1, trigger: 'held',
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
  };
}

// ─── POKÉMON INSTANCE ────────────────────────────────────────────────────────

function makePokemon(id, level, spriteUrl, name, type, isStarter = false) {
  const safeName = name || capitalize(String(id));  // fallback to id string if name missing
  const maxHp = 80 + level * 8 + (isStarter ? 20 : 0);
  const deck  = isStarter ? null : buildPokemonDeck(type);
  const movePool = OPPONENT_MOVES[type] || OPPONENT_MOVES.normal;
  const moves    = shuffle([...movePool]).slice(0, 3);
  return { id, name: safeName, type, level, maxHp, hp: maxHp, spriteUrl, backSpriteUrl: null, isStarter, statusEffects: [], deck, moves, heldItem: null };
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

  // ── Store metadata ────────────────────────────────────────────────────────
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
    'challenge': 'teamrocket_battle.mp3',
    'start':     'poke_intro.mp3',
    'starter':   'pallet_town_theme.mp3',
    'map':       'pallet_town_theme.mp3',
    'battle':    'opening.mp3',
    'boss':      'pokemon_gym.mp3',
    'heal':      'pokemon_center.mp3',
    'catch':     'pallet_town_theme.mp3',
    'training':  'pallet_town_theme.mp3',
    'shop':      'pallet_town_theme.mp3',
    'evolve':    'pallet_town_theme.mp3',
    'victory':   'poke_intro.mp3',
    'gameover':  null,
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
    const cryMap = { 1: 'bulbasaur.mp3', 4: 'charmander.mp3', 7: 'squirtle.mp3', 25: 'pikachu.mp3' };
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
  },

  finish() {
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
    const stage      = GameState.evolutionStage;

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
    deleteSave();
    const unlocks = loadUnlocks();
    GameState = {
      starterId: null, starterType: null, evolutionStage: 0,
      bossesDefeated: 0, party: [], activePokemonIndex: 0,
      deck: [], improvementMap: {}, map: null,
      currentNodeIndex: null, completedNodes: [], highWaterRow: -1,
      unlockedPikachu: unlocks.pikachu,
      stats: { battlesWon: 0, pokemonCaught: 0, totalBattlesWon: 0,
               totalBossesBeaten: 0, totalNodesCompleted: 0 },
      gold: 0, items: [], masterBallUsed: false,
      trainerName: '', trainerAge: 10, difficultyTier: 2,
      nodesSinceRocket: 0, _lastRocketCheckAt: 0,
    };
    showScreen('register');
    RegistrationEngine.init();
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
    MapEngine.show();
  },

  async showStarterSelect() {
    showScreen('starter');
    const name = GameState.trainerName ? `, ${GameState.trainerName}` : '';
    const titleEl = document.querySelector('#screen-starter .screen-title');
    if (titleEl) titleEl.textContent = `Choose Your Partner${name}!`;
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
    if (s.id === 25) SoundEngine.playPikachu2();
    const data   = await fetchPoke(s.id);
    const sprite = getSpriteUrl(data);
    const pokemon = makePokemon(s.id, 5, sprite, s.name, s.type, true);
    const starterDeck = buildDeck(s.type, {});
    pokemon.deck = starterDeck;

    // If this is a brand-new profile, create it now that we have a name
    if (GameState._isNewProfile) {
      delete GameState._isNewProfile;
      const meta = createProfile(GameState.trainerName || 'Trainer');
      if (meta) {
        setActiveProfile(meta.key);
        // Load unlocks for the new (empty) profile
        const unlocks = loadUnlocks();
        GameState.unlockedPikachu = unlocks.pikachu || false;
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
      GameState.unlockedPikachu = true;
      saveUnlocks({ pikachu: true });
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

    if (evolutions.length > 0) {
      // Evolution triggered by boss-win leveling
      runEvolutions(evolutions, () => {
        showModal('Badge Earned! 🏅', badgeMsg, () => MapEngine.show());
      });
    } else {
      showModal('Badge Earned! 🏅', badgeMsg, () => MapEngine.show());
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
    if (GameState.party.length > 0) {
      const hint = document.createElement('div');
      hint.className = 'map-party-manage-hint';
      hint.textContent = '⚙';
      hint.addEventListener('click', () => PartyOverview.open());
      el.appendChild(hint);
    }
    const bi   = GameState.map?._bossIndex ?? GameState.bossesDefeated ?? 0;
    const boss = BOSS_TRAINERS[Math.min(bi, BOSS_TRAINERS.length - 1)];
    document.getElementById('map-meta').textContent =
      `💰 ${GameState.gold || 0}g  |  ⚔ ${boss?.name ?? 'Boss'} (${GameState.bossesDefeated}/8)  |  Party: ${GameState.party.length}/6`;
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

    // ── Progress: count completed steps (one per row visited) ─────────────
    const TOTAL_STEPS  = 10;
    const doneSteps    = GameState.highWaterRow ?? 0;
    const pct          = Math.round((doneSteps / TOTAL_STEPS) * 100);
    document.getElementById('nav-progress-bar').style.width = pct + '%';
    document.getElementById('nav-progress-label').textContent =
      doneSteps === 0        ? 'Begin your journey!'    :
      available[0]?.type === 'boss' ? '⚔ Boss approaching!' :
      `Step ${doneSteps} of ${TOTAL_STEPS}`;

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
      btn.className = `nav-arrow nav-arrow-${dir}`
        + (isBoss   ? ' nav-arrow-boss'  : '')
        + (lureGlow ? ' nav-arrow-lure'  : '')
        + (repelGlow? ' nav-arrow-repel' : '');
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
      case 'catch':    CatchEngine.start(node);         break;
      case 'training': TrainingEngine.start(node);      break;
      case 'shop':     ShopEngine.start(node);          break;
      case 'boss':     BossEngine.start(node);          break;
      case 'mystery':  MysteryEngine.start(node);       break;
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
      shield: 0,
      oppAtkDebuff: 0,
      rainTurns: 0,
      leechTurns: 0,
      leechStacks: 0,
      oppSkipped: false,
      playerFlinch: false,
      bonusEnergy: 0,
    };
    this._dealHand(5);
    this._render();
    showScreen('battle');
    this._logSystem(`A wild <b>${oppPoke.name}</b> appeared!`);
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
      this._logSystem(`⭐ ${st.opp.name} fainted! You win!`);
      setTimeout(() => this._victory(), 1200);
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

// ─── BOSS ENGINE ─────────────────────────────────────────────────────────────

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

    // Set background based on first opponent's type
    const firstOppType = this.oppTeam[0]?.type || 'normal';
    setBattleBg(firstOppType, true);
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
    this._loadNextOpp();
  },

  _loadNextOpp() {
    const opp    = this.oppTeam[this.oppIdx];
    const player = GameState.party[GameState.activePokemonIndex];
    if (!opp || !player) {
      console.error('BossEngine._loadNextOpp: missing opp or player', { opp, player, oppIdx: this.oppIdx, team: this.oppTeam });
      return;
    }
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

  _log(msg) {
    // BossEngine delegates logging to BattleEngine's unified system
    // BattleEngine.isBoss is true during boss battles so it targets the right elements
    BattleEngine._logSystem.call({ isBoss: true }, msg);
  },
  _logPlayer(html) { BattleEngine._logPlayer.call({ isBoss: true }, html); },
  _logEnemy(html)  { BattleEngine._logEnemy.call({ isBoss: true }, html); },

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
      _log:          (m) => this._log(m),
      _render:       ()  => this._render(),
      _checkDefeated:()  => false,
      _dealHand:     (n) => BattleEngine._dealHand.call({ state: st }, n),
      _chargeBonus:  0, _futureSightDmg: 0, _dragonDanceBonus: 0,
    }, card);
    this._checkDefeated();
    this._render();
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
      _log:    (m) => this._log(m),
      _render: ()  => this._render(),
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
      this.oppIdx++;
      if (this.oppIdx >= this.oppTeam.length) {
        // All opponents defeated
        GameState.party[GameState.activePokemonIndex].hp = st.player.hp;
        MapEngine.completeNode(GameState.currentNodeIndex);

        if (this._isRocket) {
          // Rocket battle win — card reward + gold, no badge
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
          }, 800);
        } else {
          // Normal gym boss win
          if (!GameState.stats) GameState.stats = {};
          GameState.stats.totalBattlesWon  = (GameState.stats.totalBattlesWon  || 0) + 1;
          GameState.stats.totalBossesBeaten = (GameState.stats.totalBossesBeaten || 0) + 1;
          setTimeout(() => {
            const isFinalBoss = GameState.bossesDefeated >= 7;
            const modalMsg = isFinalBoss
              ? `You defeated ${this.bossData.name}! You are the Champion!`
              : `You defeated ${this.bossData.name}! Your team is getting stronger!`;
            showModal('Boss Defeated! 🏅', modalMsg, () => {
              Game.afterBoss(GameState.bossesDefeated);
            });
          }, 800);
        }
        return true;
      }
      this._logEnemy(`${this.bossData.name} sends ${this.oppTeam[this.oppIdx].name}!`);
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
const MysteryEngine = {
  start(node) {
    // 60% rare catch, 40% Rocket battle
    if (Math.random() < 0.60) {
      // Rare catch — override the node type perception, use rare pool
      CatchEngine.start(node, 'rare');
    } else {
      RocketBattleEngine.start(node);
    }
  },
};

// ─── ROCKET BATTLE ENGINE ────────────────────────────────────────────────────
const RocketBattleEngine = {
  _script:   [],
  _lineIdx:  0,
  _oppTeam:  [],
  _oppIdx:   0,
  bState:    null,
  bossData:  null,  // mirrors BossEngine interface so _checkDefeated etc. work

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
        // API failure — create a fallback Pokémon so the team is never empty
        console.warn(`fetchPoke failed for id ${id}:`, e);
        this._oppTeam.push(makePokemon(id, rocketLvl, '', `Pokémon #${id}`, 'poison'));
      }
    }

    // Safety: if all fetches failed, use bare stubs
    if (this._oppTeam.length === 0) {
      this._oppTeam = teamIds.map(id =>
        makePokemon(id, rocketLvl, '', `Pokémon #${id}`, 'poison')
      );
    }

    // ── Pick a random dialogue script ─────────────────────────────────────────
    this._script  = ROCKET_SCRIPTS[Math.floor(Math.random() * ROCKET_SCRIPTS.length)];
    this._lineIdx = 0;

    // bossData stub so BossEngine._checkDefeated-style logic works
    this.bossData = { name: 'Team Rocket' };

    hideLoading();
    showScreen('boss');
    BossEngine._isRocket = true;  // set NOW so button handler routes correctly

    // Show boss-party-bar for Rocket team
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
    if (forceRarity === 'rare') {
      rarity = 'Rare ✨'; pool = WILD_POOL.rare;
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
      const btn = document.createElement('button');
      btn.className = 'ball-select-btn' + (this._selectedBall === b.id ? ' ball-selected' : '');
      btn.innerHTML = b.pbi
        ? `<span class="pokeball-icon" style="width:20px;height:20px"><span class="pbi-top"></span><span class="pbi-mid"></span><span class="pbi-bot"></span><span class="pbi-btn"></span></span> ${b.label}`
        : `${b.icon} ${b.label}`;
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
          // ── Party full — show Pokédex card first, then release picker ───
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
      const pill = document.createElement('div');
      pill.className = 'bag-pill';
      pill.innerHTML = `<span class="bag-pill-icon">${item.icon}</span><span class="bag-pill-count">${item.count > 1 ? '×' + item.count : ''}</span>`;
      pill.title = `${item.name} — ${item.description || ''}`;
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
    // Build reward pool: generic normal cards + cards matching the active pokemon's type only
    const activePoke = GameState.party[GameState.activePokemonIndex];
    const activeType = activePoke?.type || GameState.starterType || 'normal';

    // Eligible card sources:
    // 1. All STANDARD_CARDS (normal type generics — fine for everyone)
    // 2. TYPE_SIGNATURE_CARDS for the active pokemon's type
    // 3. CARD_TEMPLATES for the active pokemon's type (starter-quality cards)
    const eligible = [
      ...STANDARD_CARDS.map(c => ({ ...c })),
      ...(TYPE_SIGNATURE_CARDS[activeType] || []).map(c => ({ ...c })),
      ...(CARD_TEMPLATES[activeType] || []).map(c => ({ ...c })),
    ];

    // Deduplicate by card id, then shuffle and pick 3
    const seen = new Set();
    const unique = eligible.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id); return true;
    });
    this._pool = shuffle(unique).slice(0, 3);

    const el = document.getElementById('card-reward-screen');
    const deckSize = GameState.deck.length;
    const MAX_DECK = 31;
    const atCap    = deckSize >= MAX_DECK;
    document.getElementById('cr-gold-earned').textContent =
      `+${goldEarned}g earned  ·  Deck: ${deckSize}/${MAX_DECK}${atCap ? ' — FULL' : ''}`;

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

// ─── SHOP ENGINE ─────────────────────────────────────────────────────────────

const ShopEngine = {
  start(node) {
    this._render();
    showScreen('shop');
  },

  _render() {
    document.getElementById('shop-gold').textContent = `💰 ${GameState.gold || 0}g`;
    const grid = document.getElementById('shop-items-grid');
    grid.innerHTML = '';

    // Split into sections
    const sections = [
      { label: '🎒 Consumables & Balls', items: SHOP_ITEMS.filter(i => i.category !== 'held') },
      { label: '🏅 Held Items', items: SHOP_ITEMS.filter(i => i.category === 'held') },
    ];

    sections.forEach(section => {
      const header = document.createElement('div');
      header.className = 'shop-section-header';
      header.textContent = section.label;
      grid.appendChild(header);

      section.items.forEach(item => {
        const owned   = (GameState.items || []).find(i => i.id === item.id);
        const count   = owned ? owned.count : 0;
        // Also count how many party members hold this item
        const equipped = GameState.party.filter(p => p.heldItem?.id === item.id).length;
        const maxed    = count >= item.maxStack;
        const isUnique = item.unique && (count > 0 || (item.id === 'master_ball' && GameState.masterBallUsed));
        const cantAfford = (GameState.gold || 0) < item.price;
        const disabled = maxed || isUnique || cantAfford;

        const div = document.createElement('div');
        div.className = 'shop-item' + (disabled ? ' shop-item-disabled' : '');
        div.innerHTML = `
          <div class="shop-item-icon">${item.icon}</div>
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.description}</div>
          <div class="shop-item-footer">
            <span class="shop-item-price">💰${item.price}g</span>
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
    if ((GameState.gold || 0) < item.price) return;
    GameState.gold -= item.price;

    if (item.category === 'held') {
      // Auto-equip to active Pokémon; if it already holds something, add to bag instead
      const active = GameState.party[GameState.activePokemonIndex];
      if (active && !active.heldItem) {
        active.heldItem = { ...item };
        // Don't add to bag — directly equipped
      } else {
        ItemEngine.addItem(id);
        showModal('Item Stored', `${item.icon} ${item.name} added to your bag. Open Party to equip it.`, () => {});
      }
    } else {
      ItemEngine.addItem(id);
    }

    if (id === 'master_ball') GameState.masterBallUsed = true;
    // Activate lure flag immediately when purchased
    if (id === 'lure') GameState.lureActive = true;
    SoundEngine.playFanfare();
    saveGame();
    this._render();
  },

  finish() {
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

  // ── Meowth challenge ──
  document.getElementById('challenge-continue-btn').addEventListener('click', () => MeowthChallenge.finish());

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
    // Route to RocketBattleEngine if it's a Rocket battle, otherwise BossEngine
    if (BossEngine._isRocket) {
      RocketBattleEngine.startBattle();
    } else {
      BossEngine.startBattle();
    }
  });
  document.getElementById('btn-dialogue-next').addEventListener('click', () => {
    RocketBattleEngine.advanceDialogue();
  });
  document.getElementById('btn-boss-end-turn').addEventListener('click', () => BossEngine.endTurn());
  document.getElementById('btn-boss-use-item').addEventListener('click', () => {
    if (BattleEngine._battleOver || BattleEngine._itemUsedThisTurn) return;
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
  document.getElementById('btn-throw-ball').addEventListener('click', () => CatchEngine.throwBall());
  document.getElementById('btn-flee').addEventListener('click', () => CatchEngine.flee());
  document.getElementById('btn-catch-continue').addEventListener('click', () => CatchEngine.finish());

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

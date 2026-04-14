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
// One theme per boss index — defines purely visual map styling
const MAP_THEMES = [
  // 0: Brock — rocky cave, browns and greys
  {
    name: 'Boulder Cave Trail',
    bgTop: '#8a7060', bgMid: '#6e5a4a', bgBot: '#5a4838',
    pathActive: 'rgba(220,180,100,0.85)', pathDone: 'rgba(255,210,80,0.9)',
    pathBypassed: 'rgba(60,45,35,0.4)',   pathLocked: 'rgba(70,55,45,0.3)',
    glowActive: 'rgba(200,140,60,0.6)',   glowDone: 'rgba(255,190,50,0.8)',
    texture: 'rock',
    accent: '#c8a060',
    bandColor: 'rgba(60,45,35,0.25)',
  },
  // 1: Misty — ocean blues and teals
  {
    name: 'Cerulean Sea Path',
    bgTop: '#2a5a8a', bgMid: '#1e4a7a', bgBot: '#123060',
    pathActive: 'rgba(80,200,240,0.85)', pathDone: 'rgba(120,230,255,0.9)',
    pathBypassed: 'rgba(20,40,80,0.4)',  pathLocked: 'rgba(20,50,90,0.3)',
    glowActive: 'rgba(40,160,220,0.7)',  glowDone: 'rgba(80,220,255,0.9)',
    texture: 'water',
    accent: '#40c0e0',
    bandColor: 'rgba(10,30,70,0.3)',
  },
  // 2: Lt. Surge — electric yellow, military steel
  {
    name: 'Vermilion Thunder Road',
    bgTop: '#4a4a20', bgMid: '#3a3a18', bgBot: '#2a2a10',
    pathActive: 'rgba(255,240,60,0.9)',  pathDone: 'rgba(255,255,100,0.95)',
    pathBypassed: 'rgba(40,40,20,0.45)', pathLocked: 'rgba(50,50,25,0.3)',
    glowActive: 'rgba(220,210,0,0.8)',   glowDone: 'rgba(255,255,80,0.95)',
    texture: 'electric',
    accent: '#f0e020',
    bandColor: 'rgba(30,30,10,0.35)',
  },
  // 3: Erika — lush greens, flower garden
  {
    name: 'Celadon Garden Walk',
    bgTop: '#2a5a2a', bgMid: '#1e4a1e', bgBot: '#143414',
    pathActive: 'rgba(100,220,80,0.85)', pathDone: 'rgba(140,255,100,0.9)',
    pathBypassed: 'rgba(20,50,20,0.4)',  pathLocked: 'rgba(20,55,20,0.3)',
    glowActive: 'rgba(60,180,40,0.7)',   glowDone: 'rgba(100,240,60,0.9)',
    texture: 'grass',
    accent: '#60d040',
    bandColor: 'rgba(10,40,10,0.3)',
  },
  // 4: Koga — purple poison, ninja mist
  {
    name: 'Fuschia Shadow Maze',
    bgTop: '#2e1a4a', bgMid: '#221438', bgBot: '#180e28',
    pathActive: 'rgba(180,80,240,0.85)', pathDone: 'rgba(210,120,255,0.9)',
    pathBypassed: 'rgba(30,15,50,0.45)', pathLocked: 'rgba(35,18,55,0.3)',
    glowActive: 'rgba(150,40,220,0.7)',  glowDone: 'rgba(200,100,255,0.9)',
    texture: 'poison',
    accent: '#a040d0',
    bandColor: 'rgba(20,10,40,0.35)',
  },
  // 5: Sabrina — psychic pink and deep space
  {
    name: 'Saffron Psychic Plane',
    bgTop: '#3a1a3a', bgMid: '#2e1030', bgBot: '#200a22',
    pathActive: 'rgba(255,100,200,0.85)', pathDone: 'rgba(255,160,240,0.9)',
    pathBypassed: 'rgba(40,15,40,0.45)', pathLocked: 'rgba(45,18,45,0.3)',
    glowActive: 'rgba(220,60,180,0.7)',  glowDone: 'rgba(255,140,230,0.9)',
    texture: 'psychic',
    accent: '#e060c0',
    bandColor: 'rgba(30,10,30,0.35)',
  },
  // 6: Blaine — volcanic fire, molten orange
  {
    name: 'Cinnabar Volcano Climb',
    bgTop: '#5a2000', bgMid: '#481800', bgBot: '#361000',
    pathActive: 'rgba(255,120,20,0.9)',  pathDone: 'rgba(255,180,60,0.95)',
    pathBypassed: 'rgba(50,20,5,0.45)',  pathLocked: 'rgba(55,22,8,0.3)',
    glowActive: 'rgba(220,80,0,0.8)',    glowDone: 'rgba(255,160,40,0.95)',
    texture: 'fire',
    accent: '#ff6010',
    bandColor: 'rgba(40,15,5,0.4)',
  },
  // 7: Giovanni — dark urban, Team Rocket red
  {
    name: 'Viridian Dark City',
    bgTop: '#1a1a1a', bgMid: '#141414', bgBot: '#0e0e0e',
    pathActive: 'rgba(220,40,40,0.85)', pathDone: 'rgba(255,80,80,0.9)',
    pathBypassed: 'rgba(40,10,10,0.5)',  pathLocked: 'rgba(40,15,15,0.3)',
    glowActive: 'rgba(200,20,20,0.7)',   glowDone: 'rgba(255,60,60,0.9)',
    texture: 'dark',
    accent: '#cc2020',
    bandColor: 'rgba(30,8,8,0.4)',
  },
  // 8: Lorelei — icy arctic blue-white
  {
    name: 'Ice Path — Elite Four',
    bgTop: '#c0d8f0', bgMid: '#90b8e0', bgBot: '#5090c0',
    pathActive: 'rgba(180,230,255,0.9)', pathDone: 'rgba(220,250,255,0.95)',
    pathBypassed: 'rgba(80,120,160,0.4)', pathLocked: 'rgba(80,130,170,0.3)',
    glowActive: 'rgba(140,200,240,0.8)',  glowDone: 'rgba(200,240,255,0.95)',
    texture: 'ice',
    accent: '#b0e0ff',
    bandColor: 'rgba(60,100,150,0.25)',
  },
  // 9: Bruno — fighting dojo, earthy red clay
  {
    name: 'Fighting Dojo — Elite Four',
    bgTop: '#5a2010', bgMid: '#481808', bgBot: '#361008',
    pathActive: 'rgba(220,120,60,0.85)', pathDone: 'rgba(255,160,80,0.9)',
    pathBypassed: 'rgba(50,20,10,0.45)', pathLocked: 'rgba(55,22,10,0.3)',
    glowActive: 'rgba(190,80,30,0.7)',   glowDone: 'rgba(250,140,60,0.9)',
    texture: 'rock',
    accent: '#d06030',
    bandColor: 'rgba(40,15,5,0.35)',
  },
  // 10: Agatha — ghost, deep dark purple-black
  {
    name: 'Ghost Tower — Elite Four',
    bgTop: '#0e0e18', bgMid: '#0a0a14', bgBot: '#060610',
    pathActive: 'rgba(140,100,220,0.85)', pathDone: 'rgba(180,140,255,0.9)',
    pathBypassed: 'rgba(15,12,30,0.5)',   pathLocked: 'rgba(18,14,35,0.3)',
    glowActive: 'rgba(110,70,200,0.7)',   glowDone: 'rgba(160,120,255,0.9)',
    texture: 'ghost',
    accent: '#8050d0',
    bandColor: 'rgba(12,10,25,0.4)',
  },
  // 11: Lance — dragon, deep indigo and gold
  {
    name: 'Dragon\'s Den — Elite Four',
    bgTop: '#0a1a3a', bgMid: '#081430', bgBot: '#060e22',
    pathActive: 'rgba(100,160,255,0.85)', pathDone: 'rgba(140,200,255,0.9)',
    pathBypassed: 'rgba(10,20,50,0.45)',  pathLocked: 'rgba(12,22,55,0.3)',
    glowActive: 'rgba(60,120,240,0.7)',   glowDone: 'rgba(120,180,255,0.9)',
    texture: 'dragon',
    accent: '#4080e0',
    bandColor: 'rgba(8,15,40,0.4)',
  },
  // 12: Blue (Champion) — rich crimson and gold
  {
    name: '★ Champion\'s Hall',
    bgTop: '#2a0808', bgMid: '#1e0606', bgBot: '#140404',
    pathActive: 'rgba(255,200,40,0.9)',  pathDone: 'rgba(255,230,100,0.95)',
    pathBypassed: 'rgba(40,10,10,0.5)',  pathLocked: 'rgba(45,12,12,0.3)',
    glowActive: 'rgba(220,160,0,0.8)',   glowDone: 'rgba(255,220,80,0.95)',
    texture: 'champion',
    accent: '#ffc820',
    bandColor: 'rgba(30,8,8,0.4)',
  },
];

const NODE_TYPES = ['battle', 'heal', 'catch', 'training', 'shop'];
const NODE_ICONS = { battle: '⚔️', heal: '💚', catch: '🔵', training: '⚡', shop: '🛒', boss: '💀', mystery: '❓' };
// All non-boss, non-start nodes appear as ❓ until visited
const NODE_MYSTERY_ICON = '❓';

const STATUS_LABELS = {
  burn:   '🔥BRN',
  poison: '☠️PSN',
  para:   '⚡PAR',
};

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

// ─── SHOP ITEMS CATALOGUE ─────────────────────────────────────────────────────
const SHOP_ITEMS = [
  {
    id: 'oran_berry',
    name: 'Oran Berry',
    icon: '🍊',
    description: 'Heals 10 HP when a Pokémon drops below 50% health. Auto-triggers in battle.',
    price: 8,
    maxStack: 3,
    trigger: 'passive',
  },
  {
    id: 'revive_potion',
    name: 'Revive Potion',
    icon: '🧪',
    description: 'Saves a Pokémon from fainting once, restoring it to 30% HP instead.',
    price: 15,
    maxStack: 2,
    trigger: 'on_faint',
  },
  {
    id: 'ultra_ball',
    name: 'Ultra Ball',
    icon: '🟡',
    description: '+50% catch rate for Uncommon and Rare Pokémon.',
    price: 12,
    maxStack: 3,
    trigger: 'catch',
  },
  {
    id: 'master_ball',
    name: 'Master Ball',
    icon: '🟣',
    description: '100% catch rate. Only one available per run!',
    price: 50,
    maxStack: 1,
    trigger: 'catch',
    unique: true,
  },
  {
    id: 'repel',
    name: 'Repel',
    icon: '🚫',
    description: 'Prevents Common Pokémon from appearing at the next Catch node.',
    price: 10,
    maxStack: 2,
    trigger: 'catch_modifier',
  },
  {
    id: 'lure',
    name: 'Lure',
    icon: '🎣',
    description: 'Greatly increases Legendary encounter chance for the rest of this map.',
    price: 20,
    maxStack: 1,
    trigger: 'lure_modifier',
  },
];

// ─── GOLD TABLES (per round / boss) ───────────────────────────────────────────
// bossesDefeated = 0 → round 1, 1 → round 2, 2 → round 3
const GOLD_TABLE = [
  { wildMin: 4,  wildMax: 10, bossBonus: 25 },   // round 1
  { wildMin: 10, wildMax: 20, bossBonus: 45 },   // round 2
  { wildMin: 18, wildMax: 30, bossBonus: 0  },   // round 3 — no boss gold (game ends)
];

function goldForWildBattle() {
  const t = GOLD_TABLE[Math.min(GameState.bossesDefeated, 2)];
  return t.wildMin + Math.floor(Math.random() * (t.wildMax - t.wildMin + 1));
}
function goldForBoss() {
  return GOLD_TABLE[Math.min(GameState.bossesDefeated, 2)].bossBonus;
}

// ─── POKEDEX PERSISTENCE ──────────────────────────────────────────────────────
const POKEDEX_KEY = 'pokerogue_pokedex_v1';

function loadPokedex() {
  try {
    const d = localStorage.getItem(POKEDEX_KEY);
    return d ? JSON.parse(d) : {};
  } catch(e) { return {}; }
}
function savePokedex(dex) {
  try { localStorage.setItem(POKEDEX_KEY, JSON.stringify(dex)); } catch(e) {}
}
function registerPokedex(id, name, spriteUrl, caught = false) {
  const dex = loadPokedex();
  if (!dex[id] || (caught && !dex[id].caught)) {
    dex[id] = { id, name, spriteUrl, caught: caught || !!dex[id]?.caught, seen: true };
    savePokedex(dex);
  }
}

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
  const deck = isStarter ? null : buildPokemonDeck(type);
  return { id, name, type, level, maxHp, hp: maxHp, spriteUrl, backSpriteUrl: null, isStarter, statusEffects: [], deck };
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

function generateMap(bossIndex) {
  const bi = bossIndex ?? Math.min(GameState?.bossesDefeated ?? 0, MAP_THEMES.length - 1);

  function makeTypes() {
    const t = [
      'battle','battle','battle','battle','battle','battle','battle','battle',
      'heal','heal','heal',
      'catch','catch','catch',
      'training','training','training',
      'shop','shop','shop',
    ];
    return t.sort(() => Math.random() - .5);
  }

  const allTypes = makeTypes();
  let typeIdx = 0;
  const nextType = () => allTypes[typeIdx++ % allTypes.length];

  function jitter(base, amount = 0.05) {
    return base + (Math.random() * 2 - 1) * amount;
  }

  const WIDE_ROWS = 10;
  const TOTAL_Y   = WIDE_ROWS + 2;

  // ── Build layout rows ───────────────────────────────────────────────────
  // Each row has 2–3 nodes. Each node carries a 'lane': 'left' | 'mid' | 'right'
  // This drives diverging link logic below.
  const layoutRows = [];
  for (let r = 0; r < WIDE_ROWS; r++) {
    const y      = (r + 1) / TOTAL_Y;
    const hasMid = Math.random() < 0.40;
    const row = [
      { x: jitter(0.18, 0.05), y, type: nextType(), lane: 'left'  },
      { x: jitter(0.82, 0.05), y, type: nextType(), lane: 'right' },
    ];
    if (hasMid) {
      row.splice(1, 0, { x: jitter(0.50, 0.04), y, type: nextType(), lane: 'mid' });
    }
    layoutRows.push(row);
  }
  layoutRows.push([{ x: 0.50, y: (WIDE_ROWS + 1) / TOTAL_Y, type: 'boss', lane: 'mid' }]);

  // ── Build nodes array ───────────────────────────────────────────────────
  const nodes = [];
  let idx = 0;
  const rowStartIdx = [];

  layoutRows.forEach((row, ri) => {
    rowStartIdx.push(nodes.length);
    row.forEach((spec, ni) => {
      nodes.push({
        idx,
        row:      ri,
        col:      ni,
        lane:     spec.lane,
        type:     spec.type,
        revealed: ri === 0,
        x:        spec.x,
        y:        spec.y,
        unlocked: ri === 0,
        done:     false,
        links:    [],
      });
      idx++;
    });
  });

  // ── Diverging links ─────────────────────────────────────────────────────
  // Rule: a left-lane node links to left/mid nodes next row.
  //       a right-lane node links to right/mid nodes next row.
  //       a mid-lane node links to all nodes next row.
  // "Merge rows" at rows 3 and 7 — every lane links to all next-row nodes,
  // allowing paths to rejoin after diverging.
  const MERGE_ROWS = new Set([3, 7]);

  layoutRows.forEach((_, ri) => {
    if (ri >= layoutRows.length - 1) return;
    const curStart  = rowStartIdx[ri];
    const nextStart = rowStartIdx[ri + 1];
    const curNodes  = layoutRows[ri];
    const nxtNodes  = layoutRows[ri + 1];
    const isMerge   = MERGE_ROWS.has(ri);

    curNodes.forEach((spec, ci) => {
      const fromNode = nodes[curStart + ci];
      nxtNodes.forEach((nspec, ni) => {
        const toIdx = nextStart + ni;
        let shouldLink = false;
        if (isMerge) {
          // Merge row: everyone connects to everyone — paths rejoin
          shouldLink = true;
        } else if (spec.lane === 'mid') {
          shouldLink = true;
        } else if (spec.lane === 'left') {
          shouldLink = nspec.lane === 'left' || nspec.lane === 'mid';
        } else { // right
          shouldLink = nspec.lane === 'right' || nspec.lane === 'mid';
        }
        if (shouldLink && !fromNode.links.includes(toIdx)) {
          fromNode.links.push(toIdx);
        }
      });
      // Safety: every node must link to at least one next-row node
      if (fromNode.links.length === 0) {
        const fallback = nextStart + Math.floor(Math.random() * nxtNodes.length);
        fromNode.links.push(fallback);
      }
    });
  });

  const bossNode = nodes[nodes.length - 1];
  bossNode.bossIndex = bi;
  bossNode.revealed  = false;

  // Store theme index on the map so drawMap can read it
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
      { text: `Three bosses. Twenty challenges.\nOne chance to be Champion.\n\nAre you ready, ${name}?`, speaker: 'oak' },
      { text: `Your journey begins with\none very important choice... ⬇️`, speaker: null },
    ];
    this._idx = 0;
    showScreen('intro');
    this._render();
  },

  _render() {
    const panel = this._panels[this._idx];
    const isLast = this._idx === this._panels.length - 1;

    document.getElementById('intro-text').textContent = panel.text;
    document.getElementById('intro-progress').textContent =
      `${this._idx + 1} / ${this._panels.length}`;

    // Speaker portrait
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
    btn.textContent = isLast ? `Let's Go, ${GameState.trainerName}! ▶` : 'Next ▶';
  },

  next() {
    if (this._idx < this._panels.length - 1) {
      this._idx++;
      this._render();
    } else {
      Game.showStarterSelect();
    }
  },

  skip() {
    Game.showStarterSelect();
  },
};

// ─── JESSIE WORD BANK ─────────────────────────────────────────────────────────
// Each entry: { word, partOfSpeech, correct definition, 3 wrong choices, exampleSentence, jessieQuote }
const JESSIE_WORDS = {
  1: [ // Tier 1 — age 6-7
    { word:'brave',      pos:'adjective', correct:'Not scared, even when things are hard', wrong:['Very tired','Very small','Very loud'],       example:'The brave trainer walked into the dark cave.', jessie:'Brave? I, Jessie, am the bravest villain alive!' },
    { word:'curious',   pos:'adjective', correct:'Wanting to find out about things',       wrong:['Feeling sleepy','Being very hungry','Very angry'], example:'The curious Pikachu sniffed every flower.',    jessie:'Curious? James is always too curious for his own good.' },
    { word:'enormous',  pos:'adjective', correct:'Very, very big',                          wrong:['Very fast','Very quiet','Very cold'],           example:'An enormous Snorlax blocked the whole road!',   jessie:'My talent is enormous — unlike my partner!' },
    { word:'gloomy',    pos:'adjective', correct:'Dark and a little sad',                   wrong:['Very bright','Very funny','Very tasty'],        example:'It was a gloomy day when Team Rocket lost again.', jessie:'Gloomy describes every day I spend with James.' },
    { word:'sneaky',    pos:'adjective', correct:'Doing things in a secret, sly way',       wrong:['Very kind','Very loud','Very clumsy'],          example:'The sneaky Meowth stole the golden coins.',     jessie:'Sneaky? That is practically my job description!' },
    { word:'grumpy',    pos:'adjective', correct:'In a bad mood, easily annoyed',           wrong:['Very happy','Very brave','Very fast'],          example:'Giovanni was grumpy when his plan failed.',     jessie:'I am NOT grumpy. I am simply... misunderstood.' },
    { word:'gentle',    pos:'adjective', correct:'Soft, kind and careful',                  wrong:['Very loud','Very strong','Very messy'],         example:'The gentle trainer petted the scared Eevee.',   jessie:'Gentle? I prefer the word magnificent.' },
  ],
  2: [ // Tier 2 — age 8-9
    { word:'determined', pos:'adjective', correct:'Decided to do something, no matter what', wrong:['Feeling confused','Easy to scare away','Wanting to sleep'], example:'Ash was determined to become Pokémon Champion.',  jessie:'I am the most determined villain in the world!' },
    { word:'mischievous',pos:'adjective', correct:'Enjoying small pranks and tricks',        wrong:['Always very serious','Extremely kind','Very sleepy'],       example:'The mischievous Gengar hid inside the shadows.', jessie:'Mischievous — yes, that describes Team Rocket perfectly.' },
    { word:'reluctant',  pos:'adjective', correct:'Not wanting to do something',             wrong:['Very excited','Completely ready','Very hungry'],            example:'James was reluctant to face the angry Gyarados.', jessie:'James is reluctant about EVERYTHING. It is exhausting.' },
    { word:'peculiar',   pos:'adjective', correct:'Strange or unusual in an odd way',        wrong:['Very normal','Extremely fast','Very large'],                example:'There was a peculiar sound coming from the cave.',jessie:'Peculiar? James is the most peculiar person I know.' },
    { word:'triumphant', pos:'adjective', correct:'Feeling great joy after winning',         wrong:['Very embarrassed','Quite bored','A little sad'],            example:'Ash felt triumphant after defeating the Gym Leader.', jessie:'One day I will feel triumphant! One day.' },
    { word:'generous',   pos:'adjective', correct:'Happy to give and share with others',     wrong:['Keeping everything','Very clumsy','Easily scared'],         example:'The generous trainer shared Poké Balls with everyone.', jessie:'I would be generous... if I had anything worth sharing.' },
    { word:'anxious',    pos:'adjective', correct:'Worried and nervous about something',     wrong:['Very excited','Completely calm','Very angry'],              example:'Misty was anxious before her first water battle.',jessie:'Anxious? Me? Never! ...Do I look anxious to you?' },
  ],
  3: [ // Tier 3 — age 10-12
    { word:'perseverance', pos:'noun',      correct:'Keeping going even when it is very hard',   wrong:['Giving up quickly','Sleeping too much','Being very loud'],  example:'Ash showed perseverance by training every single day.', jessie:'Perseverance is my greatest quality — I never give up!' },
    { word:'formidable',   pos:'adjective', correct:'Impressive and a little frightening',       wrong:['Very tiny and weak','Quite ordinary','Extremely funny'],    example:'The formidable Dragonite circled the mountaintop.',    jessie:'I, Jessie, am the most formidable villain of all time.' },
    { word:'resilient',    pos:'adjective', correct:'Able to bounce back after hard times',      wrong:['Easily defeated','Very heavy','Quite forgetful'],           example:'A resilient trainer learns from every defeat.',         jessie:'Team Rocket is incredibly resilient! We keep coming back!' },
    { word:'notorious',    pos:'adjective', correct:'Famous for doing something bad',            wrong:['Completely unknown','Very generous','Extremely polite'],    example:'Team Rocket is notorious for trying to steal Pikachu.', jessie:'Notorious! Yes — that is exactly what we are. Infamous! Legendary!' },
    { word:'cunning',      pos:'adjective', correct:'Clever in a sneaky way',                   wrong:['Very honest','Quite clumsy','Extremely slow'],              example:'The cunning Meowth had a plan for every situation.',    jessie:'Cunning is my middle name. Well — not literally.' },
    { word:'agile',        pos:'adjective', correct:'Able to move quickly and easily',           wrong:['Very heavy and slow','Unable to move','Very loud'],         example:'The agile Scyther dodged every attack effortlessly.',   jessie:'I am the most agile member of Team Rocket — obviously.' },
    { word:'bewildered',   pos:'adjective', correct:'Very confused and surprised',              wrong:['Very certain','Completely calm','Extremely happy'],          example:'James looked bewildered when his Pokémon disobeyed.',   jessie:'James is permanently bewildered. It is exhausting.' },
  ],
};

// ─── JAMES SPELLING BANK ─────────────────────────────────────────────────────
// Each entry: { clue (definition), correct spelling, 3 wrong spellings, jamesQuote }
const JAMES_WORDS = {
  1: [ // Tier 1 — option B: pick correct spelling from definition
    { clue:'A very good friend',             correct:'friend',    wrong:['frend','freind','frind'],          james:'I keep writing "frend" — is that wrong? Oh dear.' },
    { clue:'The place where you learn',      correct:'school',    wrong:['skool','sckool','schol'],          james:'I spelled it "skool" on the evil plan. Jessie was not pleased.' },
    { clue:'Not the same',                   correct:'different', wrong:['diffrent','diferent','difrent'],   james:'"Diffrent"... that looked right to me. Wobuffet agreed!' },
    { clue:'More than one person',           correct:'people',    wrong:['pepole','peopel','peepel'],        james:'I wrote "pepole" on the sign. The Boss crossed it out.' },
    { clue:'Very pretty to look at',         correct:'beautiful', wrong:['beautifull','butiful','beutiful'], james:'I tried to write Jessie a compliment. I spelled it "beutiful".' },
    { clue:'When something starts',          correct:'begin',     wrong:['bigin','beggin','beginn'],         james:'"Beggin"? No wait... that is dog treats.' },
    { clue:'Moving through the air',         correct:'flying',    wrong:['flyin','flyng','fliyng'],          james:'Our balloon is "flyin" high! Wait — is there a G?' },
  ],
  2: [
    { clue:'When something happens by surprise', correct:'surprise',    wrong:['suprise','surprize','surpise'],       james:'I wrote "suprise party" for Jessie. She was not surprised at my spelling.' },
    { clue:'The second month of the year',        correct:'February',    wrong:['Febuary','Feburary','Februery'],      james:'I always forget the first R in "Febuary". Wobuffet does too.' },
    { clue:'Absolutely, for sure, without doubt', correct:'definitely',  wrong:['definately','definitly','defenitely'],james:'"Definately" looked right! Jessie says I am definitely wrong.' },
    { clue:'To make something seem bigger',       correct:'exaggerate', wrong:['exagerate','exaggerrate','exaggarate'],james:'I never exagerate! ...Wait, is that how you spell it?' },
    { clue:'Not together, apart from each other', correct:'separate',   wrong:['seperate','separrate','seperrate'],   james:'There is "a rat" hiding in "sep-a-rat-e"! That helps me remember!' },
    { clue:'The place around us, nature',         correct:'environment', wrong:['enviroment','enviornment','enviorment'],james:'I care deeply about the "enviroment". ...Hmm.' },
    { clue:'When something happens over and over', correct:'repetition', wrong:['repitition','repetision','repitision'],james:'All this "repitition" is... wait. Wobuffet, how do you spell that?' },
  ],
  3: [
    { clue:'Feeling ashamed and awkward',            correct:'embarrassed',    wrong:['embarassed','embarrased','embarrassd'],      james:'I am always "embarassed" by Jessie. Wait — two Rs and two Ss!' },
    { clue:'Something that is exaggerated or false', correct:'exaggeration',   wrong:['exageration','exaggerration','exagguration'], james:'Calling me clumsy is an "exageration". ...Right?' },
    { clue:'A place to stay, like a hotel',          correct:'accommodation',  wrong:['accomodation','acomodation','acommodation'],  james:'Our Team Rocket "acomodation" was a tent. One M or two?' },
    { clue:'When something happens at the same time',correct:'occurrence',     wrong:['occurence','occurrance','ocurrence'],        james:'A rare "occurence" — Jessie admitting she was wrong!' },
    { clue:'When you are aware of right and wrong',  correct:'conscience',     wrong:['consience','consciense','conciense'],        james:'Even Team Rocket has a "consience". ...I think.' },
    { clue:'Something that is absolutely required',  correct:'necessary',      wrong:['neccessary','necesary','neccesary'],         james:'Is a villain costume "necesary"? Jessie says yes. Always yes.' },
    { clue:'Able to use both hands equally well',    correct:'ambidextrous',   wrong:['ambidexterous','ambidextrus','ambidextous'],  james:'I am "ambidexterous" with a rose! ...One too many Es, apparently.' },
  ],
};

// ─── TEAM ROCKET CHALLENGE DISPATCHER ────────────────────────────────────────

const TeamRocketChallenge = {
  _onComplete: null,
  _type: null,     // 'meowth' | 'jessie' | 'james'
  _challenge: null,

  // Shared trigger check — called from CardReward.close
  shouldTrigger() {
    if (GameState.battlesSinceChallenge === undefined) GameState.battlesSinceChallenge = 0;
    GameState.battlesSinceChallenge++;
    if (GameState.battlesSinceChallenge < 2) return false;
    if (GameState.battlesSinceChallenge >= 5) return true;
    return Math.random() < 0.35;
  },

  // Pick a random character and show their challenge
  show(onComplete) {
    this._onComplete = onComplete;
    // Rotate through characters — weight them evenly, avoid same char twice in a row
    const chars = ['meowth', 'jessie', 'james'];
    const pool  = chars.filter(c => c !== this._type); // avoid repeat
    this._type  = pool[Math.floor(Math.random() * pool.length)];
    GameState.battlesSinceChallenge = 0;

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
      unlockedPikachu: unlocks.pikachu,
      stats: { battlesWon: 0, pokemonCaught: 0 },
      gold: 0,
      items: [],
      masterBallUsed: false,
      trainerName: '',
      trainerAge: 10,
      difficultyTier: 2,       // 1=Rookie(6-7), 2=Rising(8-9), 3=Expert(10-12)
      battlesSinceChallenge: 0, // trigger challenge every ~3-5 battles
      lastChallengeWasBattle: false,
    };
    showScreen('register');
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
    // Special confirm cry for Pikachu
    if (s.id === 25) SoundEngine.playPikachu2();
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

  goToMenu() {
    SoundEngine.stopSFX();
    saveGame();
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
    const starter = STARTERS.find(s => s.id === GameState.starterId);

    // Pikachu doesn't evolve — skip the cutscene and go straight to next map
    if (starter.id === 25) {
      // Still give the HP bonus a normal evolution would grant
      const idx = GameState.party.findIndex(p => p.isStarter);
      if (idx >= 0) {
        GameState.party[idx].maxHp += 20;
        GameState.party[idx].hp    += 20;
      }
      GameState.map = generateMap();
      GameState.map.forEach(n => {
        if (n.type === 'boss') n.bossIndex = Math.min(GameState.bossesDefeated, 2);
      });
      GameState.completedNodes = [];
      GameState.highWaterRow   = -1;
      saveGame();
      showModal('Boss Defeated!', `⚡ Pikachu powered up! On to the next challenge!`, () => {
        MapEngine.show();
      });
      return;
    }

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

      const isActive  = i === GameState.activePokemonIndex;
      const canActive = !isActive && p.hp > 0;
      const position  = isActive ? '★ Active' : i === 0 ? '1st' : `#${i + 1}`;

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
    // Sync GameState.deck to the newly active pokemon's deck
    if (p.deck) GameState.deck = p.deck;
    saveGame();
    this._render(); // re-render to update active highlight and button states
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

    const bi   = GameState.map?._bossIndex ?? GameState.bossesDefeated ?? 0;
    const boss = BOSS_TRAINERS[Math.min(bi, BOSS_TRAINERS.length - 1)];
    document.getElementById('map-meta').textContent =
      `💰 ${GameState.gold || 0}g  |  ⚔ ${boss?.name ?? 'Boss'}  |  Party: ${GameState.party.length}/6`;
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

    // ── Pick theme ──
    const bi    = GameState.map?._bossIndex ?? GameState.bossesDefeated ?? 0;
    const theme = MAP_THEMES[Math.min(bi, MAP_THEMES.length - 1)];

    // ── Background gradient ──
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0,   theme.bgTop);
    bgGrad.addColorStop(0.5, theme.bgMid);
    bgGrad.addColorStop(1,   theme.bgBot);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Themed texture overlay ──
    this._drawTexture(ctx, W, H, theme);

    // ── Horizontal band dividers ──
    for (let i = 1; i < 5; i++) {
      const bandY = (i / 5) * H;
      ctx.beginPath();
      ctx.moveTo(0, bandY);
      ctx.lineTo(W, bandY);
      ctx.strokeStyle = theme.bandColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 10]);
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

        // Lane tint — left paths slightly warmer, right paths slightly cooler
        const isRight = n.lane === 'right';

        ctx.beginPath();
        ctx.moveTo(n.px, n.py);
        // Slight curve for visual interest
        const mx = (n.px + target.px) / 2 + (isRight ? 12 : -12);
        const my = (n.py + target.py) / 2;
        ctx.quadraticCurveTo(mx, my, target.px, target.py);

        if (done) {
          ctx.strokeStyle = theme.pathDone;
          ctx.lineWidth   = 5;
          ctx.shadowColor = theme.glowDone;
          ctx.shadowBlur  = 12;
          ctx.setLineDash([]);
        } else if (bypassed) {
          ctx.strokeStyle = theme.pathBypassed;
          ctx.lineWidth   = 1.5;
          ctx.shadowBlur  = 0;
          ctx.setLineDash([2, 7]);
        } else if (locked) {
          ctx.strokeStyle = theme.pathLocked;
          ctx.lineWidth   = 1.5;
          ctx.shadowBlur  = 0;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = theme.pathActive;
          ctx.lineWidth   = 3;
          ctx.shadowColor = theme.glowActive;
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
      const btn      = document.createElement('button');
      const done     = GameState.completedNodes.includes(n.idx);
      const bypassed = !!n.bypassed;
      const revealed = !!n.revealed || n.type === 'boss';

      let typeClass;
      if (done)             typeClass = 'node-done';
      else if (bypassed)    typeClass = 'node-bypassed';
      else if (!n.unlocked) typeClass = 'node-locked';
      else if (!revealed)   typeClass = 'node-mystery';
      else                  typeClass = `node-${n.type}`;

      // Apply lane class for themed border tint
      const laneClass = n.lane ? ` node-lane-${n.lane}` : '';

      btn.className  = `map-node-btn ${typeClass}${laneClass}`;
      btn.style.left = n.px + 'px';
      btn.style.top  = n.py + 'px';
      // Pass theme accent to node via CSS custom property
      btn.style.setProperty('--theme-accent', theme.accent);

      if (done)             btn.textContent = '✓';
      else if (bypassed)    btn.textContent = '✗';
      else if (!revealed)   btn.textContent = NODE_MYSTERY_ICON;
      else                  btn.textContent = NODE_ICONS[n.type] || '?';

      if (done)             btn.title = 'Completed';
      else if (bypassed)    btn.title = 'Path not taken';
      else if (!n.unlocked) btn.title = 'Locked';
      else if (!revealed)   btn.title = 'Mystery node — enter to find out!';
      else                  btn.title = capitalize(n.type) + ' Node';

      if (!n.unlocked || done || bypassed) btn.setAttribute('disabled', true);
      btn.onclick = () => this.visitNode(n);
      layer.appendChild(btn);
    });
  },

  // ── Texture painter ─────────────────────────────────────────────────────
  _drawTexture(ctx, W, H, theme) {
    const t = theme.texture;
    if (t === 'rock') {
      // Scattered pebble ovals
      for (let i = 0; i < 120; i++) {
        const x = Math.random() * W, y = Math.random() * H;
        const rx = 4 + Math.random() * 10, ry = 3 + Math.random() * 6;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(40,30,20,${0.06 + Math.random() * 0.08})`;
        ctx.fill();
      }
    } else if (t === 'water') {
      // Horizontal wave lines
      for (let i = 0; i < 30; i++) {
        const y = Math.random() * H;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= W; x += 20) {
          ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 3);
        }
        ctx.strokeStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.04})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else if (t === 'electric') {
      // Jagged lightning streaks
      for (let i = 0; i < 8; i++) {
        const sx = Math.random() * W;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        let cx = sx, cy = 0;
        while (cy < H) {
          cx += (Math.random() - 0.5) * 30;
          cy += 30 + Math.random() * 40;
          ctx.lineTo(cx, cy);
        }
        ctx.strokeStyle = `rgba(255,255,100,${0.04 + Math.random() * 0.06})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else if (t === 'grass') {
      // Tiny leaf dots scattered
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * W, y = Math.random() * H;
        ctx.beginPath();
        ctx.ellipse(x, y, 2, 5, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(60,160,40,${0.06 + Math.random() * 0.08})`;
        ctx.fill();
      }
    } else if (t === 'poison' || t === 'ghost') {
      // Soft floating blobs (mist / spores)
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * W, y = Math.random() * H;
        const r = 8 + Math.random() * 20;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        const alpha = 0.04 + Math.random() * 0.06;
        grad.addColorStop(0, t === 'poison' ? `rgba(160,50,220,${alpha * 2})` : `rgba(100,60,200,${alpha * 2})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    } else if (t === 'psychic') {
      // Concentric ripple circles
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * W, y = Math.random() * H;
        for (let r = 5; r < 40; r += 12) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(220,80,180,${0.04 + Math.random() * 0.04})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    } else if (t === 'fire') {
      // Upward ember dots
      for (let i = 0; i < 150; i++) {
        const x = Math.random() * W, y = Math.random() * H;
        const r = 1 + Math.random() * 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${100 + Math.floor(Math.random()*100)},20,${0.06 + Math.random() * 0.1})`;
        ctx.fill();
      }
    } else if (t === 'dark' || t === 'champion') {
      // Subtle vignette only — keep it clean and dramatic
      const vig = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.85);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    } else if (t === 'ice') {
      // Snowflake-like cross marks
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * W, y = Math.random() * H;
        const s = 4 + Math.random() * 8;
        ctx.strokeStyle = `rgba(200,240,255,${0.08 + Math.random() * 0.1})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x-s,y); ctx.lineTo(x+s,y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x,y-s); ctx.lineTo(x,y+s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x-s*.7,y-s*.7); ctx.lineTo(x+s*.7,y+s*.7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+s*.7,y-s*.7); ctx.lineTo(x-s*.7,y+s*.7); ctx.stroke();
      }
    } else if (t === 'dragon') {
      // Large sweeping arc strokes
      for (let i = 0; i < 12; i++) {
        const x = Math.random() * W, y = Math.random() * H;
        ctx.beginPath();
        ctx.arc(x, y, 30 + Math.random() * 60, 0, Math.PI * (0.5 + Math.random()));
        ctx.strokeStyle = `rgba(80,140,255,${0.04 + Math.random() * 0.05})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else {
      // Generic subtle noise dots
      for (let i = 0; i < 300; i++) {
        const tx = Math.random() * W, ty = Math.random() * H;
        ctx.beginPath();
        ctx.arc(tx, ty, Math.random() * 6 + 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
        ctx.fill();
      }
    }
  },

  visitNode(node) {
    if (node.row > (GameState.highWaterRow ?? -1)) {
      GameState.highWaterRow = node.row;
    }
    GameState.map.forEach(n => {
      if (!n.done && n.row <= GameState.highWaterRow && n.idx !== node.idx) {
        n.bypassed = true;
        n.unlocked = false;
      }
    });
    GameState.currentNodeIndex = node.idx;
    switch (node.type) {
      case 'battle':   BattleEngine.start(node);  break;
      case 'heal':     HealEngine.start(node);     break;
      case 'catch':    CatchEngine.start(node);    break;
      case 'training': TrainingEngine.start(node); break;
      case 'shop':     ShopEngine.start(node);     break;
      case 'boss':     BossEngine.start(node);     break;
    }
  },

  completeNode(nodeIdx) {
    if (!GameState.completedNodes.includes(nodeIdx)) {
      GameState.completedNodes.push(nodeIdx);
    }
    const node = GameState.map.find(n => n.idx === nodeIdx);
    if (node) {
      node.done = true;
      node.links.forEach(li => {
        const child = GameState.map[li];
        if (child) { child.unlocked = true; child.revealed = true; }
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
    // Keep spriteUrl as front-facing; store back sprite separately for battle only
    const backSprite = playerData.sprites?.back_default
                    || playerData.sprites?.front_default
                    || active.spriteUrl;
    active.backSpriteUrl = backSprite;

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
          const newDeck = p.deck || GameState.deck;
          GameState.deck = newDeck;
          st.drawPile = shuffle([...newDeck]);
          st.hand = [];
          st.discardPile = [];
          st.player = { ...p };
          this._dealHand(3);
          this._log(`Go, ${p.name}!`);
          this._render();
          // Fetch back sprite for the new pokemon (non-blocking)
          fetchPoke(p.id).then(d => {
            const back = d.sprites?.back_default || d.sprites?.front_default || p.spriteUrl;
            st.player.backSpriteUrl = back;
            GameState.party[next].backSpriteUrl = back;
            this._render();
          });
        }, 1000);
      } else {
        setTimeout(() => this._defeat(), 1200);
      }
      return true;
    }
    return false;
  },

  _victory() {
    GameState.party[GameState.activePokemonIndex].hp = this.state.player.hp;
    if (!GameState.stats) GameState.stats = { battlesWon: 0, pokemonCaught: 0 };
    GameState.stats.battlesWon = (GameState.stats.battlesWon || 0) + 1;
    const activePoke = GameState.party[GameState.activePokemonIndex];
    activePoke.battlesWon = (activePoke.battlesWon || 0) + 1;

    // Register opponent in Pokédex (seen)
    const opp = this.state.opp;
    registerPokedex(opp.id, opp.name, opp.spriteUrl, false);

    // Award gold
    const earned = goldForWildBattle();
    GameState.gold = (GameState.gold || 0) + earned;

    // Check Oran Berry passive trigger for all party members after battle
    ItemEngine.checkPassive();

    MapEngine.completeNode(GameState.currentNodeIndex);

    // Show card reward screen
    CardReward.show(earned);
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
      const back = d.sprites?.back_default || d.sprites?.front_default || newPoke.spriteUrl;
      st.player.backSpriteUrl = back;
      // Also persist back sprite to the party member
      GameState.party[idx].backSpriteUrl = back;
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
    const bossIdx = Math.min(
      node?.bossIndex ?? GameState.bossesDefeated,
      BOSS_TRAINERS.length - 1
    );
    const boss = BOSS_TRAINERS[bossIdx];
    this.bossData = boss;
    this.oppIdx   = 0;
    this.oppTeam  = [];

    for (const id of boss.team) {
      const d = await fetchPoke(id);
      const level = 12 + bossIdx * 6;
      this.oppTeam.push(makePokemon(id, level, getSpriteUrl(d, true), capitalize(d.name), d.types[0]?.type?.name || 'normal'));
    }
    hideLoading();

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

  switchPokemon(idx) {
    const st = this.bState;
    if (st.actionsLeft < 2) {
      this._log(`Not enough actions to switch! (costs 2)`);
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
    st.actionsLeft -= 2;
    this._log(`Go, ${newPoke.name}! (2 actions used)`);
    this._render();
    // Fetch back sprite non-blocking
    if (!newPoke.backSpriteUrl) {
      fetchPoke(newPoke.id).then(d => {
        const back = d.sprites?.back_default || d.sprites?.front_default || newPoke.spriteUrl;
        st.player.backSpriteUrl = back;
        GameState.party[idx].backSpriteUrl = back;
        this._render();
      });
    }
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
    SoundEngine.stopSFX();
    deleteSave();
    GameState = null;
    showScreen('start');
  },
};

// ─── CATCH ENGINE ────────────────────────────────────────────────────────────

const CatchEngine = {
  current: null,
  _caught: false,
  _selectedBall: 'pokeball',

  async start(node) {
    showLoading();
    const hasRepel = ItemEngine.hasItem('repel');
    const hasLure  = ItemEngine.hasItem('lure');
    let rarity, pool;
    const roll = Math.random();
    if (hasLure && Math.random() < 0.3) {
      rarity = 'Rare ✨'; pool = WILD_POOL.rare;
    } else if (hasRepel) {
      rarity = Math.random() < 0.7 ? 'Uncommon' : 'Rare ✨';
      pool   = rarity === 'Uncommon' ? WILD_POOL.uncommon : WILD_POOL.rare;
      ItemEngine.useItem('repel');
    } else {
      if (roll < .6)      { rarity = 'Common';   pool = WILD_POOL.common; }
      else if (roll < .9) { rarity = 'Uncommon'; pool = WILD_POOL.uncommon; }
      else                { rarity = 'Rare ✨';  pool = WILD_POOL.rare; }
    }
    const id   = pool[Math.floor(Math.random() * pool.length)];
    const data = await fetchPoke(id);
    this.current      = { data, rarity, id };
    this._caught      = false;
    this._selectedBall = 'pokeball';
    registerPokedex(id, capitalize(data.name), getSpriteUrl(data, true), false);
    hideLoading();
    showScreen('catch');
    document.getElementById('catch-title').textContent      = 'Wild Pokémon Appeared!';
    document.getElementById('catch-name').textContent       = '???';
    document.getElementById('catch-rarity').textContent     = '';
    document.getElementById('catch-controls').style.display = 'none';
    document.getElementById('catch-result').style.display   = 'none';
    document.getElementById('catch-ball-wrap').style.display = 'none';
    document.getElementById('catch-status').textContent     = '';
    const spriteEl = document.getElementById('catch-sprite');
    spriteEl.style.display = ''; spriteEl.style.transform = ''; spriteEl.style.opacity = '1';
    spriteEl.className = 'catch-sprite silhouette';
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
    setTimeout(() => {
      spriteEl.className = 'catch-sprite revealed';
      document.getElementById('catch-name').textContent   = capitalize(data.name);
      document.getElementById('catch-rarity').textContent = `Rarity: ${rarity}`;
      document.getElementById('catch-controls').style.display = 'flex';
      this._renderBallSelector();
    }, 2000);
  },

  _renderBallSelector() {
    const sel = document.getElementById('ball-selector');
    if (!sel) return;
    sel.innerHTML = '';
    const balls = [
      { id: 'pokeball',   label: 'Poké Ball', pbi: true },
      { id: 'ultraball',  label: 'Ultra Ball',  icon: '🟡', itemId: 'ultra_ball' },
      { id: 'masterball', label: 'Master Ball', icon: '🟣', itemId: 'master_ball' },
    ];
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
    if (this._selectedBall === 'ultraball') {
      ball.querySelector('.ball-top').style.background = '#f0c000';
    } else if (this._selectedBall === 'masterball') {
      ball.querySelector('.ball-top').style.background = '#8020d0';
      ball.querySelector('.ball-bot').style.background = '#e0b0ff';
    }
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
    const pokeName   = capitalize(data.name);
    const spriteEl   = document.getElementById('catch-sprite');
    const resultEl   = document.getElementById('catch-result');
    const resultText = document.getElementById('catch-result-text');
    if (caught && GameState.party.length < 6) {
      ball.className = 'catch-ball ball-caught'; statusEl.textContent = '';
      if (!GameState.stats) GameState.stats = { battlesWon: 0, pokemonCaught: 0 };
      GameState.stats.pokemonCaught++;
      const level = 5 + GameState.bossesDefeated * 5 + Math.floor(Math.random() * 5);
      const poke  = makePokemon(data.id, level, getSpriteUrl(data), pokeName, data.types[0]?.type?.name || 'normal');
      GameState.party.push(poke);
      registerPokedex(data.id, pokeName, getSpriteUrl(data), true);
      saveGame();
      setTimeout(() => {
        SoundEngine.playFanfare();
        resultText.innerHTML = `<span style="color:#FFD700">★</span> Gotcha! ${pokeName} was caught!`;
        resultEl.style.display = 'block';
      }, 600);
    } else if (caught && GameState.party.length >= 6) {
      ball.className = 'catch-ball ball-caught'; statusEl.textContent = '';
      registerPokedex(data.id, pokeName, getSpriteUrl(data), true); saveGame();
      setTimeout(() => {
        SoundEngine.playFanfare();
        resultText.innerHTML = `Party full! ${pokeName} was released.`;
        resultEl.style.display = 'block';
      }, 600);
    } else {
      ball.className = 'catch-ball ball-burst'; statusEl.textContent = '';
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
        statusEl.textContent = `${pokeName} broke free!`;
      }, 300);
      setTimeout(() => {
        resultText.innerHTML = `Oh no! ${pokeName} broke free!`;
        resultEl.style.display = 'block';
        if (spriteEl) spriteEl.className = 'catch-sprite catch-runaway';
      }, 1400);
    }
  },

  finish() { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); },
  flee()   { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); },
};

// ─── ITEM ENGINE ─────────────────────────────────────────────────────────────

const ItemEngine = {
  // Apply Oran Berry passive at end of each battle
  checkPassive() {
    if (!GameState.items) return;
    const berries = GameState.items.filter(i => i.id === 'oran_berry' && i.count > 0);
    if (!berries.length) return;
    GameState.party.forEach(p => {
      if (p.hp > 0 && p.hp < p.maxHp * 0.5 && berries[0].count > 0) {
        p.hp = Math.min(p.maxHp, p.hp + 10);
        berries[0].count--;
        if (berries[0].count <= 0) {
          GameState.items = GameState.items.filter(i => !(i.id === 'oran_berry' && i.count <= 0));
        }
      }
    });
  },

  // Check on-faint Revive Potion
  checkRevive(partyIdx) {
    if (!GameState.items) return false;
    const revive = GameState.items.find(i => i.id === 'revive_potion' && i.count > 0);
    if (!revive) return false;
    const p = GameState.party[partyIdx];
    p.hp = Math.floor(p.maxHp * 0.3);
    revive.count--;
    if (revive.count <= 0) GameState.items = GameState.items.filter(i => i !== revive);
    return true;
  },

  hasItem(id) {
    return (GameState.items || []).some(i => i.id === id && i.count > 0);
  },

  useItem(id) {
    const item = (GameState.items || []).find(i => i.id === id && i.count > 0);
    if (!item) return false;
    item.count--;
    if (item.count <= 0) GameState.items = GameState.items.filter(i => i !== item);
    return true;
  },

  addItem(id) {
    if (!GameState.items) GameState.items = [];
    const item = GameState.items.find(i => i.id === id);
    const def  = SHOP_ITEMS.find(s => s.id === id);
    if (!def) return;
    if (item) { item.count++; }
    else { GameState.items.push({ ...def, count: 1 }); }
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
    const MAX_DECK = 21;
    const atCap    = deckSize >= MAX_DECK;
    document.getElementById('cr-gold-earned').textContent =
      `+${goldEarned}g earned  ·  Deck: ${deckSize}/${MAX_DECK}${atCap ? ' — FULL' : ''}`;

    const grid = document.getElementById('cr-cards-grid');
    grid.innerHTML = '';

    this._pool.forEach((card, i) => {
      const div = document.createElement('div');
      div.className = 'card cr-card' + (atCap ? ' cr-card-disabled' : '');
      div.dataset.type = card.type;
      div.innerHTML = `
        <div class="card-icon">${card.icon}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-power">${card.power > 0 ? '⚔ ' + card.power : '✦'}</div>
        <div class="card-effect">${card.effect || '—'}</div>
        <div class="cr-card-type type-${card.type}">${card.type}</div>
      `;
      if (!atCap) div.onclick = () => this.pickCard(i);
      grid.appendChild(div);
    });

    if (atCap) {
      const notice = document.createElement('div');
      notice.className = 'cr-cap-notice';
      notice.textContent = '⚠ Deck is full (21 cards max). Remove a card at Training to make room.';
      grid.after(notice);
    }

    el.classList.remove('hidden');
  },

  pickCard(idx) {
    const card   = this._pool[idx];
    const active = GameState.party[GameState.activePokemonIndex];
    const MAX_DECK = 21;

    // Only add if under the cap
    if (GameState.deck.length < MAX_DECK) {
      GameState.deck.push({ ...card, improved: 0 });
    }
    if (active && active.deck && active.deck.length < MAX_DECK) {
      active.deck.push({ ...card, improved: 0 });
    }
    SoundEngine.playFanfare();
    this.close();
  },

  skip() {
    this.close();
  },

  close() {
    document.getElementById('card-reward-screen').classList.add('hidden');
    // Check for Meowth challenge after card reward
    if (MeowthChallenge.shouldTrigger()) {
      MeowthChallenge.show(() => MapEngine.show());
    } else {
      MapEngine.show();
    }
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

    SHOP_ITEMS.forEach(item => {
      const owned   = (GameState.items || []).find(i => i.id === item.id);
      const count   = owned ? owned.count : 0;
      const maxed   = count >= item.maxStack;
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
          ${count > 0 ? `<span class="shop-item-owned">×${count}</span>` : ''}
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
  },

  buy(id) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;
    if ((GameState.gold || 0) < item.price) return;
    GameState.gold -= item.price;
    ItemEngine.addItem(id);
    if (id === 'master_ball') GameState.masterBallUsed = true;
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

const PokedexEngine = {
  async show() {
    showLoading();
    const dex = loadPokedex();
    const entries = Object.values(dex).sort((a, b) => a.id - b.id);

    // Fetch any missing sprites
    const grid = document.getElementById('pokedex-grid');
    grid.innerHTML = '';

    document.getElementById('pokedex-count').textContent =
      `${entries.filter(e => e.caught).length} caught / ${entries.length} seen`;

    entries.forEach(e => {
      const div = document.createElement('div');
      div.className = 'dex-entry' + (e.caught ? ' dex-caught' : ' dex-seen');
      div.title = e.caught ? `${e.name} — Caught!` : 'Seen — not yet caught';
      div.innerHTML = `
        <img src="${e.spriteUrl || ''}" alt="${e.name}"
             onerror="this.src='assets/sprites/${e.id}.png'"
             class="dex-sprite${e.caught ? '' : ' silhouette'}" />
        <div class="dex-text">
          <div class="dex-id">#${String(e.id).padStart(3, '0')}</div>
          <div class="dex-name${e.caught ? '' : ' dex-unknown'}">${e.caught ? e.name : '???'}</div>
        </div>
        ${e.caught ? '<div class="dex-ball">🔵</div>' : ''}
      `;
      grid.appendChild(div);
    });

    if (entries.length === 0) {
      grid.innerHTML = '<div class="dex-empty">No Pokémon discovered yet.<br>Battle and catch to fill your Pokédex!</div>';
    }

    hideLoading();
    showScreen('pokedex');
  },
};

// ─── TRAINING ENGINE ─────────────────────────────────────────────────────────

const TrainingEngine = {
  selected: [],
  mode: 'upgrade', // 'upgrade' | 'remove'

  start(node) {
    this.selected = [];
    this.mode = 'upgrade';
    showScreen('training');
    this._render();
  },

  setMode(m) {
    this.mode = m;
    this.selected = [];
    this._render();
  },

  _render() {
    const grid = document.getElementById('training-cards-grid');
    grid.innerHTML = '';

    // Tab header
    document.getElementById('training-mode-upgrade').classList.toggle('active-tab', this.mode === 'upgrade');
    document.getElementById('training-mode-remove').classList.toggle('active-tab',  this.mode === 'remove');

    const subtitle = document.getElementById('training-subtitle');
    if (this.mode === 'upgrade') {
      subtitle.textContent = 'Select 2 cards to power up (+25% damage)';
    } else {
      subtitle.textContent = 'Select 1 card to permanently remove from your deck';
    }

    GameState.deck.forEach((card, i) => {
      const div = document.createElement('div');
      div.className = 'training-card' + (this.selected.includes(i) ? ' selected' : '');
      div.dataset.type = card.type;
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

    const maxSel = this.mode === 'upgrade' ? 2 : 1;
    document.getElementById('selected-count').textContent = `${this.selected.length} / ${maxSel} selected`;
    document.getElementById('btn-improve').textContent = this.mode === 'upgrade' ? '⚡ Upgrade Selected' : '🗑 Remove Card';
    document.getElementById('btn-improve').disabled = this.selected.length !== maxSel;
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
      GameState.improvementMap = {};
      GameState.deck.forEach((c, i) => { if (c.improved) GameState.improvementMap[i] = c.improved; });
      saveGame();
      MapEngine.completeNode(GameState.currentNodeIndex);
      showModal('Cards Upgraded!', 'Your selected cards have been powered up!', () => MapEngine.show());
    } else {
      if (this.selected.length !== 1) return;
      if (GameState.deck.length <= 3) {
        showModal('Cannot Remove', 'Your deck must have at least 3 cards!', () => {});
        return;
      }
      const removed = GameState.deck.splice(this.selected[0], 1)[0];
      // Also remove from active pokemon's deck
      const active = GameState.party[GameState.activePokemonIndex];
      if (active && active.deck) {
        const ri = active.deck.findIndex(c => c.name === removed.name);
        if (ri >= 0) active.deck.splice(ri, 1);
      }
      saveGame();
      MapEngine.completeNode(GameState.currentNodeIndex);
      showModal('Card Removed!', `${removed.name} has been removed from your deck.`, () => MapEngine.show());
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
    // Play recovery jingle after a brief moment (BGM has just started)
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

  // ── Register screen ──
  RegistrationEngine.init();
  document.getElementById('btn-name-confirm').addEventListener('click', () => RegistrationEngine.confirmName());
  document.getElementById('btn-age-confirm').addEventListener('click',  () => RegistrationEngine.confirmAge());
  document.getElementById('trainer-name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') RegistrationEngine.confirmName();
  });

  // ── Intro cinematic ──
  document.getElementById('btn-intro-next').addEventListener('click', () => IntroEngine.next());
  document.getElementById('btn-intro-skip').addEventListener('click', () => IntroEngine.skip());

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

  // ── Battle screen ──
  document.getElementById('btn-end-turn').addEventListener('click', () => BattleEngine.endTurn());

  // ── Boss screen ──
  document.getElementById('btn-start-boss-battle').addEventListener('click', () => BossEngine.startBattle());
  document.getElementById('btn-boss-end-turn').addEventListener('click', () => BossEngine.endTurn());

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

  showScreen('start');
});

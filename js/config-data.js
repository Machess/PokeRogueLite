/* ═══════════════════════════════════════════
   POKÉROGUE — app.js
   Full game logic: Map, Battle, Catch, Train, Heal, Boss, Evolve
═══════════════════════════════════════════ */

'use strict';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
//  THEME CONFIG — all swappable display vocabulary lives here.
//  Phase 1 of de-coupling from the borrowed IP: every player-facing NOUN that
//  identifies the franchise is defined once here, so re-theming the whole game
//  into an original "creature" world becomes a single-file edit instead of a
//  codebase-wide hunt. Internal IDs, variable names, and API keys are NOT
//  themed (they're invisible to players); only display strings route through this.
//
//  To re-skin: change the values below. Nothing else needs to know the lore.
// ═══════════════════════════════════════════════════════════════════════════
const THEME = {
  // Core franchise nouns
  creature:        'Pokémon',     // a single monster
  creaturePlural:  'Pokémon',     // many monsters
  ball:            'Poké Ball',   // the capture item
  ballPlural:      'Poké Balls',
  dex:             'Pokédex',     // the collection/encyclopedia
  player:          'Trainer',     // the human player role
  badge:           'Badge',       // the mastery reward for beating a region boss
  badgePlural:     'Badges',
  bossRole:        'Gym Leader',  // the skill-area boss
  restStop:        'Pokémon Center', // the healing location
  caretaker:       'Nurse Joy',   // the healer character
  ranger:          'Officer Jenny',  // the patrol character
  antagonists:     'Team Rocket', // the recurring antagonist group
  // Regions / world areas (campaign acts)
  region1:         'Kanto',
  region2:         'Johto',
  // Tagline-ish
  worldName:       'the Pokémon world',
};

// Convenience accessors so call sites read naturally and stay terse.
const T = THEME;

// Phase 1 helper: stamp THEME vocabulary onto any static element carrying a
// [data-theme="<key>"] attribute. Optional [data-theme-tpl="… {v} …"] wraps the
// value in a template; [data-theme-prefix] prepends. Lets static HTML labels be
// re-skinned purely from the THEME config.
function _applyTheme() {
  document.querySelectorAll('[data-theme]').forEach(el => {
    const key = el.getAttribute('data-theme');
    const val = THEME[key];
    if (val == null) return;
    const tpl = el.getAttribute('data-theme-tpl');
    const pre = el.getAttribute('data-theme-prefix') || '';
    el.textContent = tpl ? tpl.replace('{v}', val) : (pre + val);
  });
}

const POKEAPI = 'https://pokeapi.co/api/v2';

const STARTERS = [
  // ── Kanto ──────────────────────────────────────────────────────────────────
  { id: 1,   name: 'Bulbasaur',  type: 'grass',    evolutions: [1,2,3],     region: 'kanto' },
  { id: 4,   name: 'Charmander', type: 'fire',     evolutions: [4,5,6],     region: 'kanto' },
  { id: 7,   name: 'Squirtle',   type: 'water',    evolutions: [7,8,9],     region: 'kanto' },
  { id: 25,  name: 'Pikachu',    type: 'electric', evolutions: [25,26,26],  region: 'kanto', locked: true },
  { id: 133, name: 'Eevee',      type: 'normal',   evolutions: [133],       region: 'kanto', locked: true, eeveeStarter: true },
  { id: 151, name: 'Mew',        type: 'psychic',  evolutions: [151],       region: 'kanto', locked: true, mewStarter: true },
  { id: 150, name: 'Mewtwo',     type: 'psychic',  evolutions: [150],       region: 'kanto', locked: true, mewtwostarter: true },
  // ── Johto ──────────────────────────────────────────────────────────────────
  { id: 152, name: 'Chikorita',  type: 'grass',    evolutions: [152,153,154], region: 'johto', locked: true, johtoStarter: true },
  { id: 155, name: 'Cyndaquil',  type: 'fire',     evolutions: [155,156,157], region: 'johto', locked: true, johtoStarter: true },
  { id: 158, name: 'Totodile',   type: 'water',    evolutions: [158,159,160], region: 'johto', locked: true, johtoStarter: true },
];

// Level thresholds that trigger starter evolution
const EVOLUTION_LEVELS = {
  1:   { stage2: 16, stage3: 32 },
  4:   { stage2: 16, stage3: 36 },
  7:   { stage2: 16, stage3: 36 },
  25:  { stage2: 22 },
  133: {},
  151: {},
  150: {},
  // Johto starters
  152: { stage2: 18, stage3: 32 },  // Chikorita → Bayleef → Meganium
  155: { stage2: 14, stage3: 36 },  // Cyndaquil → Quilava → Typhlosion
  158: { stage2: 18, stage3: 30 },  // Totodile  → Croconaw → Feraligatr
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
  // ── Johto starters ──────────────────────────────────────────────────────────
  152: {
    2: (n, next, prev) => `${n}, ${prev} has been absorbing sunlight through every battle, quietly growing stronger. The leaf on its head is glowing now. Something beautiful is about to happen...`,
    3: (n, next, prev) => `${n}, look at ${prev}! Every challenge you faced together, every battle you won — it was all leading to this. The Johto wind is with you both. Watch!`,
  },
  155: {
    2: (n, next, prev) => `${n}, the small flame inside ${prev} has been burning steady through everything you've been through together. It believes in you completely. That belief is about to become something much bigger...`,
    3: (n, next, prev) => `${n}! The fire inside ${prev} has never once gone out — not through a single defeat, not through a single hard moment. This is your reward. Watch it blaze!`,
  },
  158: {
    2: (n, next, prev) => `${n}, ${prev} splashed into battle so many times, always fearless, always ready. You never held it back. It is growing to match your courage. Here it comes...`,
    3: (n, next, prev) => `${n}, ${prev} has fought beside you since the very beginning in Johto. Every river crossed, every gym cleared — all of it has brought you here. This is the final form!`,
  },
};

// ─── GYM DATA — single source of truth for all gym/boss data ─────────────────
// Replaces: BOSS_TRAINERS, BADGE_DATA, MAP_LOCATIONS, GYM_BACKGROUNDS, GYM_FALLBACKS
const GYM_DATA = [
  {
    // Boss
    name: 'Brock', title: 'Boulder Badge', image: 'brock.png',
    dialogue: "I've been the best gym leader since before you were hatched! Let's rock!",
    team: [74, 95],
    // Badge ceremony
    badge: '🪨', farewell: '"Not bad. You earned that badge — now prove it means something."',
    watching: 'Word is spreading. Misty in Cerulean has heard your name.',
    // Map title card
    city: 'Pewter City', flavour: 'Rocky paths. Strong foundations. Your journey begins.',
    // Visuals
    bgImage:   'bg_0_brock.png',
    bgFallback:'linear-gradient(180deg,#6a5a40 0%,#8a7250 40%,#5a4838 100%)',
  },
  {
    name: 'Misty', title: 'Cascade Badge', image: 'misty.png',
    dialogue: "Don't go easy on me just 'cause I'm cute! My Pokémon are FIERCE!",
    team: [120, 121, 54],
    badge: '💧', farewell: '"You\'re stronger than you look. I\'ll give you that much."',
    watching: 'Lt. Surge in Vermilion is warming up his Pokémon. Don\'t keep him waiting.',
    city: 'Cerulean City', flavour: 'The scent of the sea. A gym by the cape.',
    bgImage:   'bg_1_misty.png',
    bgFallback:'linear-gradient(180deg,#1a6a9a 0%,#2a7a3a 50%,#1a4a2a 100%)',
  },
  {
    name: 'Lt. Surge', title: 'Thunder Badge', image: 'ltsurge.png',
    dialogue: "I was a war hero before I was a gym leader. You don't stand a chance, kid!",
    team: [100, 26, 125],
    badge: '⚡', farewell: '"You\'ve got guts, kid. But guts alone won\'t cut it from here on."',
    watching: 'Erika in Celadon already knows about you. She\'s been expecting a challenger.',
    city: 'Vermilion City', flavour: 'The port town buzzes with electric energy.',
    bgImage:   'bg_2_surge.png',
    bgFallback:'linear-gradient(180deg,#2a3a20 0%,#4a5a28 50%,#1a2810 100%)',
  },
  {
    name: 'Erika', title: 'Rainbow Badge', image: 'erika.png',
    dialogue: "Oh my… I almost fell asleep. Let me show you the power of Grass types.",
    team: [71, 114, 45],
    badge: '🌿', farewell: '"Lovely battle. You have a gentleness with your Pokémon that is… rare."',
    watching: 'Koga of the Fuchsia Gym meditates in silence. He has already studied your strategy.',
    city: 'Celadon City', flavour: 'Flowers in every window. Something stirs beneath the calm.',
    bgImage:   'bg_3_erika.png',
    bgFallback:'linear-gradient(180deg,#1a5a1a 0%,#2a8a2a 50%,#0a3a0a 100%)',
  },
  {
    name: 'Koga', title: 'Soul Badge', image: 'koga.png',
    dialogue: "Fwa ha ha! My Pokémon use the art of ninja — you will never see it coming!",
    team: [109, 110, 89],
    badge: '💨', farewell: '"Fwa ha ha… you escaped my poison. This time."',
    watching: 'Sabrina waits in Saffron. She already knows the outcome. Do you?',
    city: 'Fuchsia City', flavour: 'The night comes early here. Watch your step.',
    bgImage:   'bg_4_koga.png',
    bgFallback:'linear-gradient(180deg,#1a0a2a 0%,#2a1a4a 50%,#0e0618 100%)',
  },
  {
    name: 'Sabrina', title: 'Marsh Badge', image: 'sabrina.png',
    dialogue: "I see your every move before you make it. Psychic power is absolute.",
    team: [64, 122, 65],
    badge: '🔮', farewell: '"I saw this result coming. That doesn\'t make it any less real."',
    watching: 'Blaine\'s volcano burns brighter tonight. He calls it a welcome sign.',
    city: 'Saffron City', flavour: 'The largest city in Kanto. Psychic power saturates the air.',
    bgImage:   'bg_5_sabrina.png',
    bgFallback:'linear-gradient(180deg,#200828 0%,#4a2a6a 50%,#120416 100%)',
  },
  {
    name: 'Blaine', title: 'Volcano Badge', image: 'blaine.png',
    dialogue: "Hah! You need more than water to put out my burning passion for Pokémon!",
    team: [58, 77, 78],
    badge: '🔥', farewell: '"Ha! You doused my flames — but the true test is still ahead!"',
    watching: 'Giovanni of the Viridian Gym has cleared his schedule. Final challenge.',
    city: 'Cinnabar Island', flavour: 'Volcanic rock underfoot. The heat is not just from the gym.',
    bgImage:   'bg_6_blaine.png',
    bgFallback:'linear-gradient(180deg,#1a0800 0%,#3a1800 50%,#0a0400 100%)',
  },
  {
    name: 'Giovanni', title: 'Earth Badge', image: 'giovanni.png',
    dialogue: "Hmph. A child? No matter — my Pokémon shall crush yours like pebbles!",
    team: [111, 112, 68, 103],
    badge: '🌍', farewell: '"Impressive. You have earned your place. Don\'t waste it."',
    watching: 'The Indigo Plateau awaits. The Elite Four are ready.',
    city: 'Viridian City', flavour: 'The final gym. The earth badge. Giovanni waits.',
    bgImage:   'bg_7_giovanni.png',
    bgFallback:'linear-gradient(180deg,#0a0a0a 0%,#1a1a1a 50%,#000000 100%)',
  },
  // ── Elite Four ──────────────────────────────────────────────────────────────
  {
    name: 'Lorelei', title: 'Elite Four — Ice', image: 'lorelei.png',
    dialogue: "No one can best me when it comes to icy Pokémon! Freeze in your tracks!",
    team: [87, 91, 124, 131, 80],
    badge: '❄️', farewell: '"Ice does not melt easily. Neither does defeat."',
    watching: 'Bruno waits in the next chamber. He has not left in days.',
    city: 'Indigo Plateau', flavour: 'Beyond the mountain pass. The Elite Four. The Champion.',
    bgImage:   'bg_8_lorelei.png',
    bgFallback:'linear-gradient(180deg,#3060a0 0%,#a0c8e8 50%,#205080 100%)',
    leagueLevel: 50,
  },
  {
    name: 'Bruno', title: 'Elite Four — Fighting', image: 'bruno.png',
    dialogue: "We will grind you down with the superior power of Fighting-type Pokémon!",
    team: [95, 107, 106, 68, 57],
    badge: '🥊', farewell: '"You have strength. But strength alone is not mastery."',
    watching: 'Agatha stirs in her chamber. She has felt your approach.',
    city: 'Indigo Plateau', flavour: 'Stone and shadow. The battle never truly ends here.',
    bgImage:   'bg_9_bruno.png',
    bgFallback:'linear-gradient(180deg,#2a1008 0%,#6a3018 50%,#180808 100%)',
    leagueLevel: 53,
  },
  {
    name: 'Agatha', title: 'Elite Four — Ghost', image: 'agatha.png',
    dialogue: "Hehehe… Old-fashioned, am I? My Ghost Pokémon will give you nightmares!",
    team: [94, 93, 110, 93, 94],
    badge: '👻', farewell: '"You survived. That is all I will say."',
    watching: 'Lance awaits. His dragons are already restless.',
    city: 'Indigo Plateau', flavour: 'The candles never go out. The spirits watch.',
    bgImage:   'bg_10_agatha.png',
    bgFallback:'linear-gradient(180deg,#06060e 0%,#1a1430 50%,#02020a 100%)',
    leagueLevel: 56,
  },
  {
    name: 'Lance', title: 'Elite Four — Dragon', image: 'lance.png',
    dialogue: "Dragonite is an extremely rare Pokémon. And I have three of them! Tremble!",
    team: [130, 148, 148, 149, 149],
    badge: '🐉', farewell: '"Dragons bow to no one. Today they bowed to you."',
    watching: 'Blue. The Champion. He already knows you are coming.',
    city: 'Indigo Plateau', flavour: 'The final chamber. One more stands between you and the title.',
    bgImage:   'bg_11_lance.png',
    bgFallback:'linear-gradient(180deg,#060c20 0%,#0a1a40 50%,#020608 100%)',
    leagueLevel: 58,
  },
  {
    name: 'Blue', title: '★ Champion ★', image: 'blue.png',
    dialogue: "Smell ya later? No — you won't be going anywhere after I beat you!",
    team: [18, 59, 65, 112, 149, 6],
    badge: '🏆', farewell: '"…Fine. You\'re the Champion. Don\'t let it go to your head."',
    watching: '',
    city: 'Indigo Plateau', flavour: '',
    bgImage:   'bg_12_blue.png',
    bgFallback:'linear-gradient(180deg,#0e0202 0%,#2a0808 50%,#060000 100%)',
    leagueLevel: 62,
  },
];

// ─── JOHTO GYM DATA ──────────────────────────────────────────────────────────
const JOHTO_GYM_DATA = [
  {
    name: 'Falkner', title: 'Zephyr Badge', image: 'falkner.png',
    dialogue: "Bird Pokémon are the finest in the world! My father raised me on that belief!",
    team: [21, 22, 16],
    badge: '🪶', farewell: '"The wind carries your name now. Keep going."',
    watching: 'Bugsy in Azalea Town has heard. He is sharpening his strategy.',
    city: 'Violet City', flavour: 'The wind never stops here. Neither do its trainers.',
    bgImage: 'bg_johto_0.jpg', bgFallback: 'linear-gradient(180deg,#8ab4d8 0%,#c8dde8 50%,#6090a8 100%)',
  },
  {
    name: 'Bugsy', title: 'Hive Badge', image: 'bugsy.png',
    dialogue: "I'm Bugsy! My research makes me tops at bug-type Pokémon!",
    team: [13, 14, 123],
    badge: '🐝', farewell: '"You are stronger than you look. The forest respects you."',
    watching: 'Whitney in Goldenrod has already posted about you. She is excited.',
    city: 'Azalea Town', flavour: 'The wells run deep here. So do old grudges.',
    bgImage: 'bg_johto_1.jpg', bgFallback: 'linear-gradient(180deg,#2a5a1a 0%,#4a8a20 50%,#1a3a10 100%)',
  },
  {
    name: 'Whitney', title: 'Plain Badge', image: 'whitney.png',
    dialogue: "La-la-la! I'm Whitney! Everyone says I'm pretty good!",
    team: [35, 36, 241],
    badge: '🎀', farewell: '"Okay fine, you\'re pretty good. Don\'t make me say it again."',
    watching: 'Morty in Ecruteak is meditating. He already knows the outcome.',
    city: 'Goldenrod City', flavour: 'The largest city in Johto. Everyone is watching.',
    bgImage: 'bg_johto_2.jpg', bgFallback: 'linear-gradient(180deg,#f8c8d8 0%,#f0a0b8 50%,#c87090 100%)',
  },
  {
    name: 'Morty', title: 'Fog Badge', image: 'morty.png',
    dialogue: "With my clairvoyance I have seen you in my visions… but now I see you for real.",
    team: [92, 93, 94, 200],
    badge: '👻', farewell: '"The fog parts for you. Walk carefully — not all paths are visible."',
    watching: 'Chuck trains at Cianwood in silence. The sea has told him nothing.',
    city: 'Ecruteak City', flavour: 'Ancient towers. Older secrets. The fog never fully lifts.',
    bgImage: 'bg_johto_3.jpg', bgFallback: 'linear-gradient(180deg,#1a0a2a 0%,#3a1a5a 50%,#0e0618 100%)',
  },
  {
    name: 'Chuck', title: 'Storm Badge', image: 'chuck.png',
    dialogue: "My punches are like lightning! My kicks are like thunder! Let\'s go!",
    team: [57, 62, 237],
    badge: '🌊', farewell: '"Good fight. My master would approve. Keep punching forward."',
    watching: 'Jasmine watches the sea from the lighthouse. She has heard the waves change.',
    city: 'Cianwood City', flavour: 'The waves have no patience. Neither does Chuck.',
    bgImage: 'bg_johto_4.jpg', bgFallback: 'linear-gradient(180deg,#1a3a5a 0%,#2a5a4a 50%,#0a2030 100%)',
  },
  {
    name: 'Jasmine', title: 'Mineral Badge', image: 'jasmine.png',
    dialogue: "Oh… um, you want a battle? Alright. My Steelix and I will do our best.",
    team: [81, 82, 208],
    badge: '⚙️', farewell: '"You are stronger than iron. That is a rare thing."',
    watching: 'Pryce has been awake since yesterday. He says old trainers do not need sleep.',
    city: 'Olivine City', flavour: 'The lighthouse burns all night. Someone always needs guiding.',
    bgImage: 'bg_johto_5.jpg', bgFallback: 'linear-gradient(180deg,#2a3040 0%,#404858 50%,#1a2030 100%)',
  },
  {
    name: 'Pryce', title: 'Glacier Badge', image: 'pryce.png',
    dialogue: "Ice-type Pokémon have a beauty and ferocity that no other type can match!",
    team: [87, 91, 131, 221],
    badge: '❄️', farewell: '"Cold outlasts heat. Remember that when things get hard."',
    watching: 'Clair sharpens her dragon\'s temper in Blackthorn. She has been waiting.',
    city: 'Mahogany Town', flavour: 'Nothing moves fast here. Even time seems to freeze.',
    bgImage: 'bg_johto_6.jpg', bgFallback: 'linear-gradient(180deg,#c0d8e8 0%,#80b0d0 50%,#3060a0 100%)',
  },
  {
    name: 'Clair', title: 'Rising Badge', image: 'clair.png',
    dialogue: "I am the world\'s best Dragon trainer! You\'re going to need more than luck!",
    team: [147, 148, 149, 230],
    badge: '🐉', farewell: '"You earned it. I hate that. But you earned it."',
    watching: 'The Johto Elite Four have convened. Will said it was inevitable.',
    city: 'Blackthorn City', flavour: 'The Dragon\'s Den is below the city. You can feel it breathing.',
    bgImage: 'bg_johto_7.jpg', bgFallback: 'linear-gradient(180deg,#1a0800 0%,#4a1800 50%,#0a0400 100%)',
  },
  // ── Johto Elite Four ───────────────────────────────────────────────────────
  {
    name: 'Will', title: 'Elite Four — Psychic', image: 'will.png',
    dialogue: "I have trained all around the world, refining my psychic Pokémon. You cannot stop me!",
    team: [178, 124, 196, 201, 178],
    badge: '🔮', farewell: '"Your mind is stronger than I foresaw. That is rare."',
    watching: 'Koga drifts in the shadows behind the next door. He has always been there.',
    city: 'Johto Plateau', flavour: 'The air hums with psychic energy.',
    bgImage: 'bg_johto_3.jpg', bgFallback: 'linear-gradient(180deg,#200828 0%,#4a2a6a 50%,#120416 100%)',
    leagueLevel: 50,
  },
  {
    name: 'Koga', title: 'Elite Four — Poison', image: 'koga.png',
    dialogue: "Fwa ha ha… You have come far, young trainer. But my traps are everywhere.",
    team: [109, 110, 89, 169, 49],
    badge: '☠️', farewell: '"You are worthy of the poison badge and more. Go."',
    watching: 'Bruno shakes the walls with his training. He has been waiting impatiently.',
    city: 'Johto Plateau', flavour: 'The ninja never left. He merely changed rooms.',
    bgImage: 'bg_4_koga.png', bgFallback: 'linear-gradient(180deg,#1a0a2a 0%,#2a1a4a 50%,#0e0618 100%)',
    leagueLevel: 53,
  },
  {
    name: 'Bruno', title: 'Elite Four — Fighting', image: 'bruno.png',
    dialogue: "I have kept training since you defeated me in Kanto. I am stronger now!",
    team: [107, 106, 237, 68, 214],
    badge: '🥊', farewell: '"You hit harder than I remembered. Good."',
    watching: 'Karen waits in the dark. She has been smiling since you entered.',
    city: 'Johto Plateau', flavour: 'Stone and sweat. The battle never ends here.',
    bgImage: 'bg_9_bruno.png', bgFallback: 'linear-gradient(180deg,#2a1008 0%,#6a3018 50%,#180808 100%)',
    leagueLevel: 56,
  },
  {
    name: 'Karen', title: 'Elite Four — Dark', image: 'karen.png',
    dialogue: "Strong Pokémon. Weak Pokémon. That is only the selfish perspective of people. Prove your worth.",
    team: [197, 215, 198, 229, 248],
    badge: '🌑', farewell: '"Truly strong trainers make the best of any Pokémon they have."',
    watching: 'Lance stirs. He has been champion twice now. He will not give it up easily.',
    city: 'Johto Plateau', flavour: 'The darkness is not empty. It is full of teeth.',
    bgImage: 'bg_10_agatha.png', bgFallback: 'linear-gradient(180deg,#06060e 0%,#1a1430 50%,#02020a 100%)',
    leagueLevel: 58,
  },
  {
    name: 'Lance', title: '★ Johto Champion ★', image: 'lance.png',
    dialogue: "I have been waiting for someone worthy enough to challenge me again. Prove it.",
    team: [148, 149, 149, 230, 334, 373],
    badge: '🏆', farewell: '"Twice now. Once in Kanto, once here. You are the real Champion."',
    watching: '',
    city: 'Johto Plateau', flavour: '',
    bgImage: 'bg_11_lance.png', bgFallback: 'linear-gradient(180deg,#060c20 0%,#0a1a40 50%,#020608 100%)',
    leagueLevel: 62,
  },
];

// ─── JOHTO MAP THEMES ─────────────────────────────────────────────────────────
const JOHTO_MAP_THEMES = [
  { name:'Violet City Route',    ocean:'#8ab4d8', land:'#6a9a4a', landHi:'#8aba5a', landShadow:'#2a4a1a',
    trailFill:'#c8b878', trailEdge:'#8a7848', trailHi:'#e8d898', trailShadow:'rgba(20,40,10,0.5)',
    pathDone:'rgba(200,220,100,0.9)', glowDone:'rgba(180,210,80,0.8)', accent:'#a8c850', texture:'grass', deco:'flowers' },
  { name:'Azalea Town Trail',    ocean:'#2a7a3a', land:'#1a5a1a', landHi:'#3a8a2a', landShadow:'#0a2a0a',
    trailFill:'#a0884a', trailEdge:'#706030', trailHi:'#c0a860', trailShadow:'rgba(10,30,10,0.55)',
    pathDone:'rgba(160,220,80,0.9)',  glowDone:'rgba(140,200,60,0.9)',  accent:'#60b830', texture:'forest', deco:'bugs' },
  { name:'Goldenrod City Walk',  ocean:'#f8c8d8', land:'#e8a8b8', landHi:'#f0b8c8', landShadow:'#c07888',
    trailFill:'#f8e8a0', trailEdge:'#d8c880', trailHi:'#fff8c0', trailShadow:'rgba(180,140,80,0.4)',
    pathDone:'rgba(255,220,80,0.9)', glowDone:'rgba(255,200,60,0.8)', accent:'#f8c820', texture:'city', deco:'flowers' },
  { name:'Ecruteak Fog Path',   ocean:'#1a0a2a', land:'#2a1a4a', landHi:'#3a2a5a', landShadow:'#0e0618',
    trailFill:'#6a5a3a', trailEdge:'#4a3a2a', trailHi:'#8a7a5a', trailShadow:'rgba(10,5,20,0.65)',
    pathDone:'rgba(180,120,220,0.9)', glowDone:'rgba(160,80,200,0.8)', accent:'#a060e0', texture:'ghost', deco:'lanterns' },
  { name:'Cianwood Sea Route',  ocean:'#1a4a6a', land:'#2a6a5a', landHi:'#3a8a6a', landShadow:'#0a2a30',
    trailFill:'#8a7a5a', trailEdge:'#5a5038', trailHi:'#aaa070', trailShadow:'rgba(10,30,30,0.5)',
    pathDone:'rgba(80,180,220,0.9)',  glowDone:'rgba(60,160,200,0.9)', accent:'#40b0d0', texture:'water', deco:'rocks' },
  { name:'Olivine City Port',   ocean:'#2a3a5a', land:'#3a4a6a', landHi:'#4a5a7a', landShadow:'#1a2030',
    trailFill:'#808898', trailEdge:'#585a68', trailHi:'#a0a8b8', trailShadow:'rgba(20,28,40,0.55)',
    pathDone:'rgba(160,200,220,0.9)', glowDone:'rgba(140,180,210,0.8)', accent:'#90b8d0', texture:'steel', deco:'gears' },
  { name:'Mahogany Snow Path',  ocean:'#3a6090', land:'#a0c8e0', landHi:'#c0e0f0', landShadow:'#204868',
    trailFill:'#e0e8f0', trailEdge:'#b0c0d0', trailHi:'#f0f4f8', trailShadow:'rgba(30,60,90,0.4)',
    pathDone:'rgba(180,220,255,0.9)', glowDone:'rgba(160,210,255,0.9)', accent:'#80c0e8', texture:'ice', deco:'snow' },
  { name:'Blackthorn Dragon Den',ocean:'#1a0800', land:'#3a1000', landHi:'#5a2000', landShadow:'#0a0400',
    trailFill:'#6a3818', trailEdge:'#4a2810', trailHi:'#8a5830', trailShadow:'rgba(30,10,5,0.7)',
    pathDone:'rgba(255,120,40,0.9)',  glowDone:'rgba(255,80,20,0.9)',  accent:'#d04010', texture:'rock', deco:'lava' },
];

// ─── REGION DATA — single gateway for all region-specific data ────────────────
// Uses getters so MAP_THEMES / WILD_POOL are read lazily (defined further down).
const REGION_DATA = {
  kanto: {
    get gymData()   { return GYM_DATA; },
    get mapThemes() { return MAP_THEMES; },
    get wildPool()  { return WILD_POOL; },
    name:      'Kanto',
    maxBosses: 8,
    bgmMap:    'pallet_town_theme.mp3',
  },
  johto: {
    get gymData()   { return JOHTO_GYM_DATA; },
    get mapThemes() { return JOHTO_MAP_THEMES; },
    get wildPool()  { return JOHTO_WILD_POOL; },
    name:      'Johto',
    maxBosses: 8,
    bgmMap:    'johto_theme.mp3',
  },
};

// Backwards-compatible aliases — existing code keeps working
const BOSS_TRAINERS   = GYM_DATA;
const GYM_FALLBACKS   = GYM_DATA.map(g => g.bgFallback);
const GYM_BACKGROUNDS = GYM_DATA.map(g => g.bgImage);

// Accessor — always use this instead of GYM_DATA/MAP_THEMES directly
function getRegionData() {
  return REGION_DATA[GameState?.region || 'kanto'] || REGION_DATA.kanto;
}
function getGymData()   { return getRegionData().gymData;   }
function getMapThemes() { return getRegionData().mapThemes; }
function getWildPool()  { return getRegionData().wildPool || WILD_POOL; }

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
// All CSS classes that can be active on #screen-challenge.
// Every engine must remove ALL of these before adding its own,
// so no stale class from a previous encounter bleeds through.
const CHALLENGE_CLASSES = [
  'meowth-active','jessie-active','james-active',
  'surge-active','erika-active','koga-active',
  'blaine-active','sabrina-active','fishing-active','jigglypuff-active',
  'challenge-select-active','giovanni-active',
  // Johto + Wobbuffet
  'falkner-active','bugsy-active','whitney-active','morty-active',
  'jasmine-active','pryce-active','clair-active','wobbu-active','chuck-active','togepi-active',
  'oak-active','snorlax-active','rocketmoney-active','jenny-active','runner-active','rocket-rescue-active',
];

const NODE_ICONS = {
  battle: '⚔️', heal: '💚', catch: '🔵', training: '⚡', shop: '🛒',
  boss: '💀', mystery: '❓', cooking: '🍳', fishing: '🎣',
  jigglypuff_node: '🎵', surge_node: '⚡', erika_node: '🧪',
  ninja_node: '🥷', sabrina_node: '🔮', blaine_node: '🔥',
  giovanni_node: '💰', wobbuffet_node: '🛡️', jenny_node: '🚓',
  // Johto gym mini-games
  falkner_node: '🪶', bugsy_node: '🐛', whitney_node: '🎀',
  morty_node: '👻', jasmine_node: '⚙️', pryce_node: '❄️', clair_node: '🐉',
  chuck_node: '🕐', togepi_node: '⏳',
  challenge: '🎮',
};
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
  steel: [
    { name: 'Metal Claw',   power: 40, effect: null },
    { name: 'Iron Tail',    power: 65, effect: null },
    { name: 'Flash Cannon', power: 62, effect: null },
    { name: 'Heavy Slam',   power: 80, effect: null },
  ],
  dark: [
    { name: 'Bite',       power: 42, effect: null },
    { name: 'Crunch',     power: 58, effect: null },
    { name: 'Night Slash',power: 55, effect: null },
    { name: 'Dark Pulse', power: 65, effect: null },
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
  // ── Mew starter deck — random cross-type wildcard ───────────────────────
  mew: [
    { id:'transform',    name:'Transform',    icon:'✨', type:'psychic', power:0,  cost:0, effect:'Add opp move to hand',   special: 'transform' },
    { id:'metronome',    name:'Metronome',    icon:'🎵', type:'normal',  power:0,  cost:0, effect:'Draw 2, free',           special: 'metronome' },
    { id:'ancient_power',name:'Ancient Power',icon:'💎', type:'psychic', power:50, cost:1, effect:'10% all stats +1',       special: 'ancient_power' },
    { id:'psychic_m',    name:'Psychic',      icon:'🔮', type:'psychic', power:65, cost:2, effect:'ATK -10',                special: 'debuff_atk' },
    { id:'barrier',      name:'Barrier',      icon:'🛡️', type:'psychic', power:0,  cost:1, effect:'Block 40 dmg',           special: 'shield_35' },
    { id:'swift_m',      name:'Swift',        icon:'⭐', type:'normal',  power:40, cost:1, effect:'Never misses',           special: null },
    { id:'soft_boiled',  name:'Soft-Boiled',  icon:'🥚', type:'normal',  power:0,  cost:2, effect:'Heal 45 HP',             special: 'heal_25_draw' },
    { id:'pound_m',      name:'Pound',        icon:'👊', type:'normal',  power:35, cost:1, effect:'',                       special: null },
    { id:'mega_punch',   name:'Mega Punch',   icon:'💥', type:'normal',  power:58, cost:2, effect:'High crit',              special: 'high_crit' },
    { id:'minimize',     name:'Minimize',     icon:'🌀', type:'normal',  power:0,  cost:1, effect:'+1 energy + draw 1',     special: 'agility' },
  ],
  // ── Mewtwo starter deck — enhanced psychic powerhouse ───────────────────
  mewtwo: [
    { id:'psystrike',    name:'Psystrike',    icon:'🔮', type:'psychic', power:65, cost:1, effect:'Pierces shield',         special: 'psyshock' },
    { id:'recover',      name:'Recover',      icon:'💜', type:'psychic', power:0,  cost:1, effect:'Heal 50 HP',             special: 'recover' },
    { id:'psycho_cut',   name:'Psycho Cut',   icon:'✂️', type:'psychic', power:50, cost:1, effect:'High crit',              special: 'high_crit' },
    { id:'amnesia',      name:'Amnesia',      icon:'💭', type:'psychic', power:0,  cost:1, effect:'+1 energy + draw 2',     special: 'agility' },
    { id:'future_sight_m',name:'Future Sight',icon:'👁', type:'psychic', power:70, cost:2, effect:'Hits next turn',         special: 'future_sight' },
    { id:'aura_sphere',  name:'Aura Sphere',  icon:'⚡', type:'psychic', power:55, cost:2, effect:'Never misses',           special: null },
    { id:'disable',      name:'Disable',      icon:'🚫', type:'psychic', power:0,  cost:1, effect:'Opp utility blocked×2',  special: 'taunt' },
    { id:'barrier_m',    name:'Barrier',      icon:'🛡️', type:'psychic', power:0,  cost:1, effect:'Block 55 dmg',           special: 'shield_50' },
    { id:'confusion_m',  name:'Confusion',    icon:'🌀', type:'psychic', power:38, cost:1, effect:'20% ATK debuff',         special: 'debuff_atk' },
    { id:'hyper_beam_m', name:'Hyper Beam',   icon:'💫', type:'psychic', power:110,cost:3, effect:'One use only.',          special: null, exhaust: true },
  ],
  steel: [
    { id:'metal_claw',   name:'Metal Claw',   icon:'⚙️', type:'steel',   power:40, cost:1, effect:'High crit',             special: 'high_crit' },
    { id:'iron_defense', name:'Iron Defense', icon:'🛡️', type:'steel',   power:0,  cost:1, effect:'Block 50 dmg',          special: 'iron_defense' },
    { id:'steel_wing',   name:'Steel Wing',   icon:'✈️', type:'steel',   power:50, cost:1, effect:'',                      special: null },
    { id:'iron_tail',    name:'Iron Tail',    icon:'⚡', type:'steel',   power:65, cost:2, effect:'DEF -20',               special: 'debuff_def' },
    { id:'flash_cannon', name:'Flash Cannon', icon:'💡', type:'steel',   power:62, cost:2, effect:'',                      special: null },
    // League-tier
    { id:'gyro_ball',    name:'Gyro Ball',    icon:'⚙️', type:'steel',   power:72, cost:2, effect:'High crit',             special: 'high_crit' },
    { id:'heavy_slam',   name:'Heavy Slam',   icon:'🏋️', type:'steel',   power:80, cost:3, effect:'Max steel. Once.',      special: null, exhaust: true },
    { id:'meteor_mash',  name:'Meteor Mash',  icon:'☄️', type:'steel',   power:90, cost:3, effect:'ATK +10. Once.',        special: 'ancient_power', exhaust: true },
  ],
  dark: [
    { id:'bite',         name:'Bite',         icon:'🦷', type:'dark',    power:42, cost:1, effect:'25% flinch',            special: 'flinch' },
    { id:'thief',        name:'Thief',        icon:'🌑', type:'dark',    power:38, cost:1, effect:'Steal opp item',        special: 'thief' },
    { id:'taunt',        name:'Taunt',        icon:'😤', type:'dark',    power:0,  cost:1, effect:'Block utility×2',       special: 'taunt' },
    { id:'crunch',       name:'Crunch',       icon:'💀', type:'dark',    power:58, cost:2, effect:'DEF -20',               special: 'debuff_def' },
    { id:'night_slash',  name:'Night Slash',  icon:'🌑', type:'dark',    power:55, cost:2, effect:'High crit',             special: 'high_crit' },
    // League-tier
    { id:'dark_pulse2',  name:'Dark Pulse',   icon:'🌑', type:'dark',    power:65, cost:2, effect:'25% flinch',            special: 'flinch' },
    { id:'foul_play',    name:'Foul Play',    icon:'🎭', type:'dark',    power:72, cost:2, effect:'Uses opp ATK',          special: 'venoshock' },
    { id:'dark_void',    name:'Dark Void',    icon:'🕳️', type:'dark',    power:90, cost:3, effect:'Sleep guaranteed. Once.',special: 'skip_opp', exhaust: true },
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
// Cards at index 5+ are League-tier — only used in buildLeagueDeck
const TYPE_SIGNATURE_CARDS = {
  fire:     [
    { id:'ember',        name:'Ember',       icon:'🔥', type:'fire',     power:40, cost:1, effect:'15% burn',         special: 'burn_chance' },
    { id:'flamethrower', name:'Flamethrower',icon:'🌋', type:'fire',     power:65, cost:2, effect:'',                 special: null },
    { id:'inferno',      name:'Inferno',     icon:'🌠', type:'fire',     power:35, cost:2, effect:'Burn guaranteed',  special: 'burn' },
    { id:'flame_charge', name:'Flame Charge',icon:'🫧', type:'fire',     power:35, cost:1, effect:'+1 energy next',  special: 'flame_charge' },
    { id:'smokescreen',  name:'Smokescreen', icon:'💨', type:'normal',   power:0,  cost:1, effect:'Acc -25%',         special: 'debuff_acc' },
    // League-tier
    { id:'fire_blast',   name:'Fire Blast',  icon:'🌟', type:'fire',     power:90, cost:3, effect:'20% burn. Once.',  special: 'burn_chance', exhaust: true },
    { id:'heat_wave',    name:'Heat Wave',   icon:'♨️', type:'fire',     power:70, cost:2, effect:'Burn guaranteed',  special: 'burn' },
    { id:'will_o_wisp',  name:'Will-O-Wisp', icon:'🕯️', type:'fire',     power:0,  cost:1, effect:'Burn guaranteed',  special: 'burn' },
  ],
  water:    [
    { id:'water_gun',    name:'Water Gun',   icon:'💧', type:'water',    power:42, cost:1, effect:'',                 special: null },
    { id:'bubble',       name:'Bubble',      icon:'🫧', type:'water',    power:30, cost:1, effect:'Slow opp',         special: 'slow_opp' },
    { id:'withdraw',     name:'Withdraw',    icon:'🛡️', type:'water',    power:0,  cost:1, effect:'Block 30 dmg',    special: 'shield_35' },
    { id:'surf',         name:'Surf',        icon:'🏄', type:'water',    power:62, cost:2, effect:'',                 special: null },
    { id:'aqua_jet',     name:'Aqua Jet',    icon:'💦', type:'water',    power:50, cost:2, effect:'Always first',     special: null },
    // League-tier
    { id:'hydro_pump',   name:'Hydro Pump',  icon:'🌊', type:'water',    power:90, cost:3, effect:'Massive pressure. Once.', special: null, exhaust: true },
    { id:'rain_dance',   name:'Rain Dance',  icon:'🌧️', type:'water',    power:0,  cost:1, effect:'Water +20% for 3t', special: 'rain' },
    { id:'liquidation',  name:'Liquidation', icon:'💦', type:'water',    power:72, cost:2, effect:'DEF -15',          special: 'debuff_def' },
  ],
  grass:    [
    { id:'vine_whip',    name:'Vine Whip',   icon:'🌿', type:'grass',    power:45, cost:1, effect:'',                 special: null },
    { id:'absorb',       name:'Absorb',      icon:'🌱', type:'grass',    power:25, cost:1, effect:'Heal 12 HP',       special: 'heal_10' },
    { id:'sleep_powder', name:'Sleep Powder',icon:'💤', type:'grass',    power:0,  cost:1, effect:'Skip opp',         special: 'skip_opp' },
    { id:'mega_drain',   name:'Mega Drain',  icon:'💚', type:'grass',    power:40, cost:2, effect:'Heal 20 HP',       special: 'mega_drain' },
    { id:'leech_seed',   name:'Leech Seed',  icon:'🌾', type:'grass',    power:20, cost:2, effect:'Drain 20/turn×3',  special: 'leech' },
    // League-tier
    { id:'solar_beam',   name:'Solar Beam',  icon:'☀️', type:'grass',    power:90, cost:3, effect:'Max power. Once.', special: null, exhaust: true },
    { id:'petal_blizzard',name:'Petal Blizzard',icon:'🌸',type:'grass',  power:70, cost:2, effect:'High crit',        special: 'high_crit' },
    { id:'spore',        name:'Spore',       icon:'🍄', type:'grass',    power:0,  cost:1, effect:'Sleep + draw 1',   special: 'spore' },
  ],
  electric: [
    { id:'thundershock', name:'ThunderShock',icon:'⚡', type:'electric', power:40, cost:1, effect:'15% paralyse',    special: 'para_chance' },
    { id:'spark',        name:'Spark',       icon:'🔆', type:'electric', power:45, cost:1, effect:'',                 special: null },
    { id:'thunder_wave', name:'Thunder Wave',icon:'🌩️', type:'electric', power:0,  cost:1, effect:'Paralyse opp',   special: 'paralyse' },
    { id:'thunderbolt',  name:'Thunderbolt', icon:'☇',  type:'electric', power:65, cost:2, effect:'25% paralyse',   special: 'para_chance' },
    { id:'discharge',    name:'Discharge',   icon:'🌐', type:'electric', power:50, cost:2, effect:'15 self dmg',     special: 'discharge' },
    // League-tier
    { id:'thunder',      name:'Thunder',     icon:'🌩', type:'electric', power:90, cost:3, effect:'35% para. Once.', special: 'para_chance', exhaust: true },
    { id:'wild_charge',  name:'Wild Charge', icon:'⚡', type:'electric', power:72, cost:2, effect:'15 recoil',       special: 'recoil_15' },
    { id:'charge_beam',  name:'Charge Beam', icon:'🔋', type:'electric', power:38, cost:1, effect:'+1 energy+draw',  special: 'agility' },
  ],
  psychic:  [
    { id:'confusion',    name:'Confusion',   icon:'🌀', type:'psychic',  power:38, cost:1, effect:'20% ATK debuff',  special: 'debuff_atk' },
    { id:'psybeam',      name:'Psybeam',     icon:'💜', type:'psychic',  power:48, cost:1, effect:'',                 special: null },
    { id:'psyshock',     name:'Psyshock',    icon:'🔮', type:'psychic',  power:55, cost:2, effect:'Pierces shield',   special: 'psyshock' },
    { id:'calm_mind',    name:'Calm Mind',   icon:'🧘', type:'psychic',  power:0,  cost:1, effect:'Next move +30%',  special: 'calm_mind' },
    { id:'future_sight', name:'Future Sight',icon:'👁', type:'psychic',  power:70, cost:2, effect:'Hits next turn',  special: 'future_sight' },
    // League-tier
    { id:'psychic_lg',   name:'Psychic',     icon:'🔮', type:'psychic',  power:80, cost:2, effect:'ATK -15',         special: 'debuff_atk' },
    { id:'psystrike_lg', name:'Psystrike',   icon:'💫', type:'psychic',  power:85, cost:3, effect:'Pierces shield. Once.', special: 'psyshock', exhaust: true },
    { id:'telekinesis',  name:'Telekinesis', icon:'🌀', type:'psychic',  power:0,  cost:1, effect:'Block 45 dmg',    special: 'iron_defense' },
  ],
  rock:     [
    { id:'rock_throw',   name:'Rock Throw',  icon:'🪨', type:'rock',     power:42, cost:1, effect:'',                 special: null },
    { id:'rollout',      name:'Rollout',     icon:'⚙️', type:'rock',     power:35, cost:1, effect:'',                 special: null },
    { id:'stealth_rock', name:'Stealth Rock',icon:'💎', type:'rock',     power:0,  cost:1, effect:'Chip 15/turn×3',  special: 'stealth_rock' },
    { id:'rock_slide',   name:'Rock Slide',  icon:'🏔️', type:'rock',     power:58, cost:2, effect:'25% flinch',      special: 'flinch' },
    { id:'stone_edge',   name:'Stone Edge',  icon:'🗿', type:'rock',     power:65, cost:2, effect:'High crit',        special: 'high_crit' },
    // League-tier
    { id:'rock_wrecker', name:'Rock Wrecker',icon:'💥', type:'rock',     power:95, cost:3, effect:'Massive hit. Once.', special: null, exhaust: true },
    { id:'power_gem',    name:'Power Gem',   icon:'💎', type:'rock',     power:70, cost:2, effect:'High crit',        special: 'high_crit' },
    { id:'smack_down',   name:'Smack Down',  icon:'⬇️', type:'rock',     power:48, cost:1, effect:'DEF -15',         special: 'debuff_def' },
  ],
  ground:   [
    { id:'mud_slap',     name:'Mud Slap',    icon:'🟫', type:'ground',   power:28, cost:1, effect:'Acc -20%',         special: 'debuff_acc' },
    { id:'sand_attack',  name:'Sand Attack', icon:'🏜️', type:'ground',   power:0,  cost:0, effect:'Acc -30%, free',  special: 'debuff_acc' },
    { id:'dig',          name:'Dig',         icon:'⛏️', type:'ground',   power:58, cost:2, effect:'',                 special: null },
    { id:'earthquake',   name:'Earthquake',  icon:'🌋', type:'ground',   power:70, cost:2, effect:'15 recoil',        special: 'recoil_15' },
    { id:'bulldoze',     name:'Bulldoze',    icon:'🚜', type:'ground',   power:40, cost:1, effect:'Opp speed -1',     special: 'slow_opp' },
    // League-tier
    { id:'precipice_blades',name:'Precipice Blades',icon:'⛰️',type:'ground',power:90,cost:3,effect:'Max force. Once.', special: null, exhaust: true },
    { id:'earth_power',  name:'Earth Power', icon:'🌍', type:'ground',   power:72, cost:2, effect:'DEF -15',          special: 'debuff_def' },
    { id:'shore_up',     name:'Shore Up',    icon:'🏔️', type:'ground',   power:0,  cost:2, effect:'Heal 40 HP',       special: 'roost' },
  ],
  poison:   [
    { id:'poison_sting', name:'Poison Sting',icon:'☠️', type:'poison',   power:30, cost:1, effect:'35% poison',      special: 'poison' },
    { id:'acid',         name:'Acid',        icon:'🧪', type:'poison',   power:38, cost:1, effect:'DEF -10',          special: 'debuff_def' },
    { id:'toxic',        name:'Toxic',       icon:'💀', type:'poison',   power:0,  cost:1, effect:'Poison guaranteed', special: 'poison' },
    { id:'sludge',       name:'Sludge',      icon:'🟢', type:'poison',   power:50, cost:2, effect:'50% poison',       special: 'poison' },
    { id:'venoshock',    name:'Venoshock',   icon:'💉', type:'poison',   power:55, cost:2, effect:'×2 if poisoned',   special: 'venoshock' },
    // League-tier
    { id:'sludge_bomb',  name:'Sludge Bomb', icon:'💣', type:'poison',   power:80, cost:2, effect:'Poison guaranteed', special: 'poison' },
    { id:'gunk_shot',    name:'Gunk Shot',   icon:'🎯', type:'poison',   power:90, cost:3, effect:'Poison. Once.',    special: 'poison', exhaust: true },
    { id:'poison_jab',   name:'Poison Jab',  icon:'💪', type:'poison',   power:60, cost:2, effect:'50% poison',       special: 'poison' },
  ],
  normal:   [
    { id:'double_slap',  name:'Double Slap', icon:'👋', type:'normal',   power:45, cost:1, effect:'',                 special: null },
    { id:'swift_n',      name:'Swift',       icon:'⭐', type:'normal',   power:40, cost:1, effect:'Never misses',     special: null },
    { id:'body_slam',    name:'Body Slam',   icon:'🏋️', type:'normal',   power:58, cost:2, effect:'25% para',        special: 'para_chance' },
    { id:'hyper_voice_n',name:'Hyper Voice', icon:'📣', type:'normal',   power:55, cost:2, effect:'ATK -15',          special: 'debuff_atk' },
    { id:'metronome_n',  name:'Metronome',   icon:'🎵', type:'normal',   power:0,  cost:0, effect:'Draw 2, free',     special: 'metronome' },
    // League-tier
    { id:'hyper_beam_n', name:'Hyper Beam',  icon:'💫', type:'normal',   power:100,cost:3, effect:'Max power. Once.', special: null, exhaust: true },
    { id:'extreme_speed',name:'ExtremeSpeed',icon:'💨', type:'normal',   power:65, cost:1, effect:'Always first',     special: null },
    { id:'return_n',     name:'Return',      icon:'❤️', type:'normal',   power:70, cost:2, effect:'High crit',        special: 'high_crit' },
  ],
  flying:   [
    { id:'gust',         name:'Gust',        icon:'🌬️', type:'flying',   power:38, cost:1, effect:'',                 special: null },
    { id:'wing_attack',  name:'Wing Attack', icon:'🦅', type:'flying',   power:48, cost:1, effect:'',                 special: null },
    { id:'aerial_ace',   name:'Aerial Ace',  icon:'✈️', type:'flying',   power:45, cost:1, effect:'Never misses',     special: null },
    { id:'roost',        name:'Roost',       icon:'🪺', type:'flying',   power:0,  cost:2, effect:'Heal 35 HP',       special: 'roost' },
    { id:'air_slash',    name:'Air Slash',   icon:'🌪️', type:'flying',   power:58, cost:2, effect:'25% flinch',      special: 'flinch' },
    // League-tier
    { id:'hurricane',    name:'Hurricane',   icon:'🌀', type:'flying',   power:80, cost:2, effect:'25% confuse',      special: 'debuff_atk' },
    { id:'brave_bird',   name:'Brave Bird',  icon:'🦆', type:'flying',   power:85, cost:2, effect:'25 recoil',        special: 'close_combat' },
    { id:'sky_attack',   name:'Sky Attack',  icon:'⚡', type:'flying',   power:90, cost:3, effect:'Max hit. Once.',   special: null, exhaust: true },
  ],
  ice:      [
    { id:'ice_shard',    name:'Ice Shard',   icon:'❄️', type:'ice',      power:38, cost:1, effect:'Always first',     special: null },
    { id:'icy_wind',     name:'Icy Wind',    icon:'🌬️', type:'ice',      power:40, cost:1, effect:'Opp speed -1',     special: 'slow_opp' },
    { id:'hail',         name:'Hail',        icon:'🌨️', type:'ice',      power:0,  cost:1, effect:'Opp -12/turn×3',  special: 'hail' },
    { id:'blizzard',     name:'Blizzard',    icon:'❄️', type:'ice',      power:65, cost:2, effect:'',                 special: null },
    { id:'frost_breath', name:'Frost Breath',icon:'🥶', type:'ice',      power:52, cost:2, effect:'Always crits',     special: 'always_crit' },
    // League-tier
    { id:'sheer_cold',   name:'Sheer Cold',  icon:'🧊', type:'ice',      power:90, cost:3, effect:'Freeze chance. Once.', special: 'skip_opp', exhaust: true },
    { id:'ice_beam',     name:'Ice Beam',    icon:'💠', type:'ice',      power:78, cost:2, effect:'20% slow',         special: 'slow_opp' },
    { id:'aurora_veil',  name:'Aurora Veil', icon:'🌈', type:'ice',      power:0,  cost:1, effect:'Block 50 dmg',     special: 'iron_defense' },
  ],
  fighting: [
    { id:'karate_chop',  name:'Karate Chop', icon:'🥊', type:'fighting', power:45, cost:1, effect:'High crit',        special: 'high_crit' },
    { id:'low_kick',     name:'Low Kick',    icon:'🦵', type:'fighting', power:40, cost:1, effect:'',                 special: null },
    { id:'cross_chop',   name:'Cross Chop',  icon:'✊', type:'fighting', power:65, cost:2, effect:'High crit',        special: 'high_crit' },
    { id:'close_combat', name:'Close Combat',icon:'💪', type:'fighting', power:80, cost:2, effect:'25 recoil',        special: 'close_combat' },
    { id:'focus_punch',  name:'Focus Punch', icon:'🎯', type:'fighting', power:75, cost:2, effect:'Miss if hit first', special: 'focus_punch' },
    // League-tier
    { id:'superpower',   name:'Superpower',  icon:'💥', type:'fighting', power:90, cost:3, effect:'Max force. Once.', special: 'close_combat', exhaust: true },
    { id:'drain_punch',  name:'Drain Punch', icon:'🤜', type:'fighting', power:60, cost:2, effect:'Heal 30 HP',       special: 'mega_drain' },
    { id:'bulk_up',      name:'Bulk Up',     icon:'🏋️', type:'fighting', power:0,  cost:1, effect:'Next move +30%',  special: 'calm_mind' },
  ],
  ghost:    [
    { id:'lick',         name:'Lick',        icon:'👻', type:'ghost',    power:28, cost:1, effect:'35% para',         special: 'para_chance' },
    { id:'shadow_sneak', name:'Shadow Sneak',icon:'🌑', type:'ghost',    power:38, cost:1, effect:'Always first',     special: null },
    { id:'night_shade',  name:'Night Shade', icon:'🌙', type:'ghost',    power:0,  cost:1, effect:'Dmg = opp level',  special: 'night_shade' },
    { id:'curse_g',      name:'Curse',       icon:'💢', type:'ghost',    power:0,  cost:1, effect:'Opp -20/turn, you -10', special: 'curse' },
    { id:'shadow_ball',  name:'Shadow Ball', icon:'🌑', type:'ghost',    power:58, cost:2, effect:'DEF -15',          special: 'debuff_def' },
    // League-tier
    { id:'shadow_force', name:'Shadow Force',icon:'💀', type:'ghost',    power:90, cost:3, effect:'Unstoppable. Once.', special: 'psyshock', exhaust: true },
    { id:'hex',          name:'Hex',         icon:'🌀', type:'ghost',    power:65, cost:2, effect:'×2 if status',     special: 'venoshock' },
    { id:'spite',        name:'Spite',       icon:'😈', type:'ghost',    power:0,  cost:1, effect:'ATK -25',          special: 'debuff_atk' },
  ],
  dragon:   [
    { id:'twister',      name:'Twister',     icon:'🌪️', type:'dragon',  power:38, cost:1, effect:'25% flinch',       special: 'flinch' },
    { id:'dragon_rage',  name:'Dragon Rage', icon:'🐉', type:'dragon',  power:55, cost:2, effect:'',                 special: null },
    { id:'dragon_breath',name:'Dragon Breath',icon:'💨',type:'dragon',  power:52, cost:2, effect:'25% para',          special: 'para_chance' },
    { id:'dragon_dance', name:'Dragon Dance',icon:'💃', type:'dragon',  power:0,  cost:2, effect:'+20% dmg forever', special: 'dragon_dance' },
    { id:'outrage',      name:'Outrage',     icon:'😤', type:'dragon',  power:95, cost:3, effect:'20 recoil. Once.',  special: 'recoil_15', exhaust: true },
    // League-tier
    { id:'draco_meteor', name:'Draco Meteor',icon:'☄️', type:'dragon',  power:100,cost:3, effect:'ATK -20. Once.',   special: 'debuff_atk', exhaust: true },
    { id:'dragon_claw',  name:'Dragon Claw', icon:'🐲', type:'dragon',  power:72, cost:2, effect:'High crit',        special: 'high_crit' },
    { id:'scale_shot',   name:'Scale Shot',  icon:'🦎', type:'dragon',  power:50, cost:1, effect:'High crit',        special: 'high_crit' },
  ],
  fairy:    [
    { id:'fairy_wind',   name:'Fairy Wind',  icon:'🧚', type:'fairy',   power:38, cost:1, effect:'',                 special: null },
    { id:'sweet_kiss',   name:'Sweet Kiss',  icon:'💋', type:'fairy',   power:0,  cost:1, effect:'ATK -25 for 1t',  special: 'debuff_atk' },
    { id:'misty_terrain',name:'Misty Terrain',icon:'✨',type:'fairy',   power:0,  cost:1, effect:'Clears status',    special: 'misty_terrain' },
    { id:'moonblast',    name:'Moonblast',   icon:'🌕', type:'fairy',   power:62, cost:2, effect:'ATK -10',          special: 'debuff_atk' },
    { id:'dazzling_gleam',name:'Dazzling Gleam',icon:'💫',type:'fairy', power:55, cost:2, effect:'',                 special: null },
    // League-tier
    { id:'moongeist_beam',name:'Moongeist Beam',icon:'🌙',type:'fairy', power:88, cost:3, effect:'Ignores shield. Once.', special: 'psyshock', exhaust: true },
    { id:'play_rough',   name:'Play Rough',  icon:'🎀', type:'fairy',   power:72, cost:2, effect:'ATK -10',          special: 'debuff_atk' },
    { id:'charm',        name:'Charm',       icon:'💝', type:'fairy',   power:0,  cost:1, effect:'ATK -30',          special: 'debuff_atk' },
  ],
  bug:      [
    { id:'bug_bite',     name:'Bug Bite',    icon:'🐛', type:'bug',      power:40, cost:1, effect:'',                 special: null },
    { id:'string_shot',  name:'String Shot', icon:'🕸️', type:'bug',      power:0,  cost:0, effect:'Speed -1, draw 1',special: 'string_shot' },
    { id:'signal_beam',  name:'Signal Beam', icon:'📡', type:'bug',      power:48, cost:1, effect:'',                 special: null },
    { id:'x_scissor',    name:'X-Scissor',   icon:'✂️', type:'bug',      power:60, cost:2, effect:'',                 special: null },
    { id:'megahorn',     name:'Megahorn',    icon:'🦏', type:'bug',      power:70, cost:2, effect:'20 recoil',        special: 'recoil_15' },
    // League-tier
    { id:'bug_buzz',     name:'Bug Buzz',    icon:'🐝', type:'bug',      power:82, cost:2, effect:'DEF -15',          special: 'debuff_def' },
    { id:'quiver_dance', name:'Quiver Dance',icon:'🦋', type:'bug',      power:0,  cost:1, effect:'+1 energy+draw',  special: 'agility' },
    { id:'lunge',        name:'Lunge',       icon:'🪲', type:'bug',      power:55, cost:1, effect:'ATK -15',          special: 'debuff_atk' },
  ],

};

// Build a deck for a caught (non-starter) Pokémon — 5 standard + 5 type-specific
function buildPokemonDeck(type) {
  const typeSig = TYPE_SIGNATURE_CARDS[type] || TYPE_SIGNATURE_CARDS.normal;
  const std     = STANDARD_CARDS.slice(0, 5).map(c => ({ ...c }));
  const sig     = typeSig.slice(0, 5).map(c => ({ ...c }));
  return [...std, ...sig];
}

// ─── LEAGUE DECKS — pre-made, hand-crafted per type ──────────────────────────
// Each deck has exactly 10 cards.
// Strategy layout per type:
//   3 cheap openers (cost 0–1)  → always playable turn 1
//   4 mid-range cards (cost 1–2) → workhorse moves
//   2 power plays (cost 2–3)     → high impact
//   1 exhaust marquee (cost 3)   → one big moment per fight
const LEAGUE_DECKS = {
  fire: [
    { id:'ember',       name:'Ember',       icon:'🔥', type:'fire',     power:40, cost:1, effect:'15% burn',         special:'burn_chance' },
    { id:'flame_charge',name:'Flame Charge',icon:'🫧', type:'fire',     power:35, cost:1, effect:'+1 energy next',  special:'flame_charge' },
    { id:'will_o_wisp', name:'Will-O-Wisp', icon:'🕯️', type:'fire',     power:0,  cost:1, effect:'Burn guaranteed',  special:'burn' },
    { id:'flamethrower',name:'Flamethrower',icon:'🌋', type:'fire',     power:65, cost:2, effect:'',                 special:null },
    { id:'inferno',     name:'Inferno',     icon:'🌠', type:'fire',     power:35, cost:2, effect:'Burn guaranteed',  special:'burn' },
    { id:'heat_wave',   name:'Heat Wave',   icon:'♨️', type:'fire',     power:70, cost:2, effect:'Burn guaranteed',  special:'burn' },
    { id:'smokescreen', name:'Smokescreen', icon:'💨', type:'normal',   power:0,  cost:1, effect:'Acc -25%',         special:'debuff_acc' },
    { id:'overheat',    name:'Overheat',    icon:'🔥', type:'fire',     power:80, cost:3, effect:'25 recoil',        special:'overheat' },
    { id:'blast_burn',  name:'Blast Burn',  icon:'💥', type:'fire',     power:85, cost:3, effect:'Massive. Once.',   special:null, exhaust:true },
    { id:'fire_blast',  name:'Fire Blast',  icon:'🌟', type:'fire',     power:90, cost:3, effect:'20% burn. Once.',  special:'burn_chance', exhaust:true },
  ],
  water: [
    { id:'water_gun',   name:'Water Gun',   icon:'💧', type:'water',    power:42, cost:1, effect:'',                 special:null },
    { id:'aqua_jet',    name:'Aqua Jet',    icon:'💦', type:'water',    power:50, cost:1, effect:'Always first',     special:null },
    { id:'rain_dance',  name:'Rain Dance',  icon:'🌧️', type:'water',    power:0,  cost:1, effect:'Water +20% 3t',   special:'rain' },
    { id:'withdraw',    name:'Withdraw',    icon:'🛡️', type:'water',    power:0,  cost:1, effect:'Block 30 dmg',    special:'shield_35' },
    { id:'surf',        name:'Surf',        icon:'🏄', type:'water',    power:62, cost:2, effect:'',                 special:null },
    { id:'liquidation', name:'Liquidation', icon:'💦', type:'water',    power:72, cost:2, effect:'DEF -15',          special:'debuff_def' },
    { id:'bubble',      name:'Bubble',      icon:'🫧', type:'water',    power:30, cost:1, effect:'Slow opp',         special:'slow_opp' },
    { id:'whirlpool',   name:'Whirlpool',   icon:'🌀', type:'water',    power:58, cost:2, effect:'',                 special:null },
    { id:'blizzard_w',  name:'Blizzard',    icon:'❄️', type:'ice',      power:65, cost:2, effect:'',                 special:null },
    { id:'hydro_pump',  name:'Hydro Pump',  icon:'🌊', type:'water',    power:90, cost:3, effect:'Max water. Once.', special:null, exhaust:true },
  ],
  grass: [
    { id:'vine_whip',   name:'Vine Whip',   icon:'🌿', type:'grass',    power:45, cost:1, effect:'',                 special:null },
    { id:'absorb',      name:'Absorb',      icon:'🌱', type:'grass',    power:25, cost:1, effect:'Heal 12 HP',       special:'heal_10' },
    { id:'sleep_powder',name:'Sleep Powder',icon:'💤', type:'grass',    power:0,  cost:1, effect:'Skip opp',         special:'skip_opp' },
    { id:'leech_seed',  name:'Leech Seed',  icon:'🌾', type:'grass',    power:20, cost:2, effect:'Drain 20/turn×3',  special:'leech' },
    { id:'mega_drain',  name:'Mega Drain',  icon:'💚', type:'grass',    power:40, cost:2, effect:'Heal 20 HP',       special:'mega_drain' },
    { id:'petal_blizzard',name:'Petal Blizzard',icon:'🌸',type:'grass', power:70, cost:2, effect:'High crit',        special:'high_crit' },
    { id:'spore',       name:'Spore',       icon:'🍄', type:'grass',    power:0,  cost:1, effect:'Sleep + draw 1',   special:'spore' },
    { id:'synthesis',   name:'Synthesis',   icon:'☀️', type:'grass',    power:0,  cost:2, effect:'Heal 35 HP+draw',  special:'heal_25_draw' },
    { id:'giga_drain',  name:'Giga Drain',  icon:'🌀', type:'grass',    power:60, cost:2, effect:'Heal 30 HP',       special:'mega_drain' },
    { id:'solar_beam',  name:'Solar Beam',  icon:'☀️', type:'grass',    power:90, cost:3, effect:'Max power. Once.', special:null, exhaust:true },
  ],
  electric: [
    { id:'thundershock',name:'ThunderShock',icon:'⚡', type:'electric', power:40, cost:1, effect:'15% para',         special:'para_chance' },
    { id:'thunder_wave',name:'Thunder Wave',icon:'🌩️', type:'electric', power:0,  cost:1, effect:'Paralyse opp',    special:'paralyse' },
    { id:'charge_beam', name:'Charge Beam', icon:'🔋', type:'electric', power:38, cost:1, effect:'+1 energy+draw',   special:'agility' },
    { id:'spark',       name:'Spark',       icon:'🔆', type:'electric', power:45, cost:1, effect:'',                 special:null },
    { id:'thunderbolt', name:'Thunderbolt', icon:'☇',  type:'electric', power:65, cost:2, effect:'25% para',         special:'para_chance' },
    { id:'wild_charge', name:'Wild Charge', icon:'⚡', type:'electric', power:72, cost:2, effect:'15 recoil',        special:'recoil_15' },
    { id:'discharge',   name:'Discharge',   icon:'🌐', type:'electric', power:50, cost:2, effect:'15 self dmg',      special:'discharge' },
    { id:'volt_tackle', name:'Volt Tackle',  icon:'💛', type:'electric', power:78, cost:3, effect:'20 recoil',        special:'recoil_15' },
    { id:'zap_cannon',  name:'Zap Cannon',  icon:'🎯', type:'electric', power:80, cost:3, effect:'Paralyse. Once.',  special:'paralyse', exhaust:true },
    { id:'thunder',     name:'Thunder',     icon:'🌩', type:'electric', power:90, cost:3, effect:'35% para. Once.',  special:'para_chance', exhaust:true },
  ],
  psychic: [
    { id:'confusion',   name:'Confusion',   icon:'🌀', type:'psychic',  power:38, cost:1, effect:'ATK debuff 20%',  special:'debuff_atk' },
    { id:'calm_mind',   name:'Calm Mind',   icon:'🧘', type:'psychic',  power:0,  cost:1, effect:'Next move +30%',  special:'calm_mind' },
    { id:'telekinesis', name:'Telekinesis', icon:'🔮', type:'psychic',  power:0,  cost:1, effect:'Block 45 dmg',    special:'iron_defense' },
    { id:'psybeam',     name:'Psybeam',     icon:'💜', type:'psychic',  power:48, cost:1, effect:'',                 special:null },
    { id:'psyshock',    name:'Psyshock',    icon:'🔮', type:'psychic',  power:55, cost:2, effect:'Pierces shield',   special:'psyshock' },
    { id:'psychic_lg',  name:'Psychic',     icon:'🔮', type:'psychic',  power:80, cost:2, effect:'ATK -15',          special:'debuff_atk' },
    { id:'future_sight',name:'Future Sight',icon:'👁', type:'psychic',  power:70, cost:2, effect:'Hits next turn',  special:'future_sight' },
    { id:'recover',     name:'Recover',     icon:'💜', type:'psychic',  power:0,  cost:1, effect:'Heal 50 HP',       special:'recover' },
    { id:'shadow_ball', name:'Shadow Ball', icon:'🌑', type:'ghost',    power:58, cost:2, effect:'DEF -15',          special:'debuff_def' },
    { id:'psystrike_lg',name:'Psystrike',   icon:'💫', type:'psychic',  power:85, cost:3, effect:'Pierces. Once.',   special:'psyshock', exhaust:true },
  ],
  ice: [
    { id:'ice_shard',   name:'Ice Shard',   icon:'❄️', type:'ice',      power:38, cost:1, effect:'Always first',     special:null },
    { id:'icy_wind',    name:'Icy Wind',    icon:'🌬️', type:'ice',      power:40, cost:1, effect:'Slow opp',         special:'slow_opp' },
    { id:'hail',        name:'Hail',        icon:'🌨️', type:'ice',      power:0,  cost:1, effect:'Opp -12/turn×3',  special:'hail' },
    { id:'frost_breath',name:'Frost Breath',icon:'🥶', type:'ice',      power:52, cost:2, effect:'Always crits',     special:'always_crit' },
    { id:'ice_beam',    name:'Ice Beam',    icon:'💠', type:'ice',      power:78, cost:2, effect:'20% slow',         special:'slow_opp' },
    { id:'aurora_veil', name:'Aurora Veil', icon:'🌈', type:'ice',      power:0,  cost:1, effect:'Block 50 dmg',     special:'iron_defense' },
    { id:'blizzard',    name:'Blizzard',    icon:'❄️', type:'ice',      power:65, cost:2, effect:'',                 special:null },
    { id:'ice_punch',   name:'Ice Punch',   icon:'🧊', type:'ice',      power:60, cost:2, effect:'20% slow',         special:'slow_opp' },
    { id:'glaciate',    name:'Glaciate',    icon:'💠', type:'ice',      power:72, cost:3, effect:'Slow opp. Once.',  special:'slow_opp', exhaust:true },
    { id:'sheer_cold',  name:'Sheer Cold',  icon:'🧊', type:'ice',      power:90, cost:3, effect:'Freeze. Once.',    special:'skip_opp', exhaust:true },
  ],
  fighting: [
    { id:'karate_chop', name:'Karate Chop', icon:'🥊', type:'fighting', power:45, cost:1, effect:'High crit',        special:'high_crit' },
    { id:'low_kick',    name:'Low Kick',    icon:'🦵', type:'fighting', power:40, cost:1, effect:'',                 special:null },
    { id:'bulk_up',     name:'Bulk Up',     icon:'🏋️', type:'fighting', power:0,  cost:1, effect:'Next move +30%',  special:'calm_mind' },
    { id:'cross_chop',  name:'Cross Chop',  icon:'✊', type:'fighting', power:65, cost:2, effect:'High crit',        special:'high_crit' },
    { id:'drain_punch', name:'Drain Punch', icon:'🤜', type:'fighting', power:60, cost:2, effect:'Heal 30 HP',       special:'mega_drain' },
    { id:'close_combat',name:'Close Combat',icon:'💪', type:'fighting', power:80, cost:2, effect:'25 recoil',        special:'close_combat' },
    { id:'focus_punch', name:'Focus Punch', icon:'🎯', type:'fighting', power:75, cost:2, effect:'Miss if hit first',special:'focus_punch' },
    { id:'submission',  name:'Submission',  icon:'💥', type:'fighting', power:68, cost:2, effect:'15 recoil',        special:'recoil_15' },
    { id:'high_jump_kick',name:'High Jump Kick',icon:'🦵',type:'fighting',power:82,cost:3,effect:'High crit. Once.', special:'high_crit', exhaust:true },
    { id:'superpower',  name:'Superpower',  icon:'💥', type:'fighting', power:90, cost:3, effect:'Max force. Once.', special:'close_combat', exhaust:true },
  ],
  ghost: [
    { id:'shadow_sneak',name:'Shadow Sneak',icon:'🌑', type:'ghost',    power:38, cost:1, effect:'Always first',     special:null },
    { id:'lick',        name:'Lick',        icon:'👻', type:'ghost',    power:28, cost:1, effect:'35% para',         special:'para_chance' },
    { id:'spite',       name:'Spite',       icon:'😈', type:'ghost',    power:0,  cost:1, effect:'ATK -25',          special:'debuff_atk' },
    { id:'night_shade', name:'Night Shade', icon:'🌙', type:'ghost',    power:0,  cost:1, effect:'Dmg = opp level',  special:'night_shade' },
    { id:'hex',         name:'Hex',         icon:'🌀', type:'ghost',    power:65, cost:2, effect:'×2 if status',     special:'venoshock' },
    { id:'shadow_ball', name:'Shadow Ball', icon:'🌑', type:'ghost',    power:58, cost:2, effect:'DEF -15',          special:'debuff_def' },
    { id:'curse_g',     name:'Curse',       icon:'💢', type:'ghost',    power:0,  cost:1, effect:'Opp -20/turn,-10HP',special:'curse' },
    { id:'phantom_force',name:'Phantom Force',icon:'👁',type:'ghost',   power:72, cost:2, effect:'',                 special:null },
    { id:'dark_pulse',  name:'Dark Pulse',  icon:'🌑', type:'ghost',    power:60, cost:2, effect:'25% flinch',       special:'flinch' },
    { id:'shadow_force',name:'Shadow Force',icon:'💀', type:'ghost',    power:90, cost:3, effect:'Unstoppable. Once.',special:'psyshock', exhaust:true },
  ],
  dragon: [
    { id:'twister',     name:'Twister',     icon:'🌪️', type:'dragon',  power:38, cost:1, effect:'25% flinch',       special:'flinch' },
    { id:'scale_shot',  name:'Scale Shot',  icon:'🦎', type:'dragon',  power:50, cost:1, effect:'High crit',         special:'high_crit' },
    { id:'dragon_dance',name:'Dragon Dance',icon:'💃', type:'dragon',  power:0,  cost:2, effect:'+20% dmg forever',  special:'dragon_dance' },
    { id:'dragon_breath',name:'Dragon Breath',icon:'💨',type:'dragon', power:52, cost:2, effect:'25% para',          special:'para_chance' },
    { id:'dragon_claw', name:'Dragon Claw', icon:'🐲', type:'dragon',  power:72, cost:2, effect:'High crit',         special:'high_crit' },
    { id:'dragon_rage', name:'Dragon Rage', icon:'🐉', type:'dragon',  power:55, cost:2, effect:'',                  special:null },
    { id:'aqua_tail',   name:'Aqua Tail',   icon:'💧', type:'water',   power:60, cost:2, effect:'',                  special:null },
    { id:'outrage',     name:'Outrage',     icon:'😤', type:'dragon',  power:95, cost:3, effect:'20 recoil. Once.',   special:'recoil_15', exhaust:true },
    { id:'dragon_rush', name:'Dragon Rush', icon:'🌀', type:'dragon',  power:78, cost:3, effect:'High crit. Once.',   special:'high_crit', exhaust:true },
    { id:'draco_meteor',name:'Draco Meteor',icon:'☄️', type:'dragon',  power:100,cost:3, effect:'ATK -20. Once.',    special:'debuff_atk', exhaust:true },
  ],
  rock: [
    { id:'rock_throw',  name:'Rock Throw',  icon:'🪨', type:'rock',    power:42, cost:1, effect:'',                  special:null },
    { id:'smack_down',  name:'Smack Down',  icon:'⬇️', type:'rock',    power:48, cost:1, effect:'DEF -15',           special:'debuff_def' },
    { id:'stealth_rock',name:'Stealth Rock',icon:'💎', type:'rock',    power:0,  cost:1, effect:'Chip 15/turn×3',    special:'stealth_rock' },
    { id:'rollout',     name:'Rollout',     icon:'⚙️', type:'rock',    power:35, cost:1, effect:'',                  special:null },
    { id:'rock_slide',  name:'Rock Slide',  icon:'🏔️', type:'rock',    power:58, cost:2, effect:'25% flinch',        special:'flinch' },
    { id:'power_gem',   name:'Power Gem',   icon:'💎', type:'rock',    power:70, cost:2, effect:'High crit',         special:'high_crit' },
    { id:'stone_edge',  name:'Stone Edge',  icon:'🗿', type:'rock',    power:65, cost:2, effect:'High crit',         special:'high_crit' },
    { id:'ancient_power_r',name:'Ancient Power',icon:'✨',type:'rock', power:55, cost:2, effect:'10% all stats +1',  special:'ancient_power' },
    { id:'head_smash',  name:'Head Smash',  icon:'💥', type:'rock',    power:80, cost:3, effect:'25 recoil. Once.',   special:'close_combat', exhaust:true },
    { id:'rock_wrecker',name:'Rock Wrecker',icon:'💥', type:'rock',    power:95, cost:3, effect:'Max hit. Once.',     special:null, exhaust:true },
  ],
  ground: [
    { id:'sand_attack', name:'Sand Attack', icon:'🏜️', type:'ground',  power:0,  cost:0, effect:'Acc -30%, free',   special:'debuff_acc' },
    { id:'mud_slap',    name:'Mud Slap',    icon:'🟫', type:'ground',  power:28, cost:1, effect:'Acc -20%',          special:'debuff_acc' },
    { id:'bulldoze',    name:'Bulldoze',    icon:'🚜', type:'ground',  power:40, cost:1, effect:'Slow opp',          special:'slow_opp' },
    { id:'dig',         name:'Dig',         icon:'⛏️', type:'ground',  power:58, cost:2, effect:'',                  special:null },
    { id:'earth_power', name:'Earth Power', icon:'🌍', type:'ground',  power:72, cost:2, effect:'DEF -15',           special:'debuff_def' },
    { id:'earthquake',  name:'Earthquake',  icon:'🌋', type:'ground',  power:70, cost:2, effect:'15 recoil',         special:'recoil_15' },
    { id:'shore_up',    name:'Shore Up',    icon:'🏔️', type:'ground',  power:0,  cost:2, effect:'Heal 40 HP',        special:'roost' },
    { id:'high_horsepower',name:'High Horsepower',icon:'🐴',type:'ground',power:75,cost:2,effect:'High crit',        special:'high_crit' },
    { id:'stomping_tantrum',name:'Stomping Tantrum',icon:'🦶',type:'ground',power:68,cost:3,effect:'High crit.Once.',special:'high_crit', exhaust:true },
    { id:'precipice_blades',name:'Precipice Blades',icon:'⛰️',type:'ground',power:90,cost:3,effect:'Max. Once.',    special:null, exhaust:true },
  ],
  poison: [
    { id:'poison_sting',name:'Poison Sting',icon:'☠️', type:'poison',  power:30, cost:1, effect:'35% poison',       special:'poison' },
    { id:'acid',        name:'Acid',        icon:'🧪', type:'poison',  power:38, cost:1, effect:'DEF -10',           special:'debuff_def' },
    { id:'toxic',       name:'Toxic',       icon:'💀', type:'poison',  power:0,  cost:1, effect:'Poison guaranteed',  special:'poison' },
    { id:'sludge',      name:'Sludge',      icon:'🟢', type:'poison',  power:50, cost:2, effect:'50% poison',        special:'poison' },
    { id:'venoshock',   name:'Venoshock',   icon:'💉', type:'poison',  power:55, cost:2, effect:'×2 if poisoned',    special:'venoshock' },
    { id:'poison_jab',  name:'Poison Jab',  icon:'💪', type:'poison',  power:60, cost:2, effect:'50% poison',        special:'poison' },
    { id:'cross_poison',name:'Cross Poison',icon:'✂️', type:'poison',  power:58, cost:2, effect:'High crit+poison',  special:'high_crit' },
    { id:'acid_spray',  name:'Acid Spray',  icon:'💦', type:'poison',  power:42, cost:1, effect:'DEF -20',           special:'debuff_def' },
    { id:'sludge_bomb', name:'Sludge Bomb', icon:'💣', type:'poison',  power:80, cost:2, effect:'Poison guaranteed',  special:'poison' },
    { id:'gunk_shot',   name:'Gunk Shot',   icon:'🎯', type:'poison',  power:90, cost:3, effect:'Poison. Once.',     special:'poison', exhaust:true },
  ],
  flying: [
    { id:'gust',        name:'Gust',        icon:'🌬️', type:'flying',  power:38, cost:1, effect:'',                  special:null },
    { id:'aerial_ace',  name:'Aerial Ace',  icon:'✈️', type:'flying',  power:45, cost:1, effect:'Never misses',      special:null },
    { id:'wing_attack', name:'Wing Attack', icon:'🦅', type:'flying',  power:48, cost:1, effect:'',                  special:null },
    { id:'roost',       name:'Roost',       icon:'🪺', type:'flying',  power:0,  cost:2, effect:'Heal 35 HP',        special:'roost' },
    { id:'air_slash',   name:'Air Slash',   icon:'🌪️', type:'flying',  power:58, cost:2, effect:'25% flinch',       special:'flinch' },
    { id:'hurricane',   name:'Hurricane',   icon:'🌀', type:'flying',  power:80, cost:2, effect:'ATK debuff 15%',    special:'debuff_atk' },
    { id:'tailwind',    name:'Tailwind',    icon:'💨', type:'flying',  power:0,  cost:1, effect:'+1 energy + draw',  special:'agility' },
    { id:'acrobatics',  name:'Acrobatics',  icon:'🦜', type:'flying',  power:62, cost:2, effect:'High crit',        special:'high_crit' },
    { id:'brave_bird',  name:'Brave Bird',  icon:'🦆', type:'flying',  power:85, cost:2, effect:'25 recoil',        special:'close_combat' },
    { id:'sky_attack',  name:'Sky Attack',  icon:'⚡', type:'flying',  power:90, cost:3, effect:'Max hit. Once.',    special:null, exhaust:true },
  ],
  normal: [
    { id:'tackle',      name:'Tackle',      icon:'💥', type:'normal',  power:38, cost:1, effect:'',                  special:null },
    { id:'swift_n',     name:'Swift',       icon:'⭐', type:'normal',  power:40, cost:1, effect:'Never misses',      special:null },
    { id:'metronome_n', name:'Metronome',   icon:'🎵', type:'normal',  power:0,  cost:0, effect:'Draw 2, free',      special:'metronome' },
    { id:'body_slam',   name:'Body Slam',   icon:'🏋️', type:'normal',  power:58, cost:2, effect:'25% para',         special:'para_chance' },
    { id:'extreme_speed',name:'ExtremeSpeed',icon:'💨',type:'normal',  power:65, cost:1, effect:'Always first',      special:null },
    { id:'double_edge', name:'Double-Edge', icon:'⚔️', type:'normal',  power:72, cost:2, effect:'20 recoil',        special:'recoil_15' },
    { id:'return_n',    name:'Return',      icon:'❤️', type:'normal',  power:70, cost:2, effect:'High crit',        special:'high_crit' },
    { id:'facade',      name:'Façade',      icon:'🎭', type:'normal',  power:62, cost:2, effect:'×2 if status',     special:'venoshock' },
    { id:'hyper_voice_n',name:'Hyper Voice',icon:'📣', type:'normal',  power:55, cost:2, effect:'ATK -15',          special:'debuff_atk' },
    { id:'hyper_beam_n',name:'Hyper Beam',  icon:'💫', type:'normal',  power:100,cost:3, effect:'Max power. Once.', special:null, exhaust:true },
  ],
  bug: [
    { id:'string_shot', name:'String Shot', icon:'🕸️', type:'bug',    power:0,  cost:0, effect:'Slow+draw 1',       special:'string_shot' },
    { id:'bug_bite',    name:'Bug Bite',    icon:'🐛', type:'bug',    power:40, cost:1, effect:'',                  special:null },
    { id:'lunge',       name:'Lunge',       icon:'🪲', type:'bug',    power:55, cost:1, effect:'ATK -15',           special:'debuff_atk' },
    { id:'signal_beam', name:'Signal Beam', icon:'📡', type:'bug',    power:48, cost:1, effect:'',                  special:null },
    { id:'quiver_dance',name:'Quiver Dance',icon:'🦋', type:'bug',    power:0,  cost:1, effect:'+1 energy+draw',    special:'agility' },
    { id:'x_scissor',   name:'X-Scissor',   icon:'✂️', type:'bug',    power:60, cost:2, effect:'',                  special:null },
    { id:'bug_buzz',    name:'Bug Buzz',    icon:'🐝', type:'bug',    power:82, cost:2, effect:'DEF -15',           special:'debuff_def' },
    { id:'leech_life',  name:'Leech Life',  icon:'🩸', type:'bug',    power:50, cost:2, effect:'Heal 25 HP',        special:'mega_drain' },
    { id:'megahorn',    name:'Megahorn',    icon:'🦏', type:'bug',    power:70, cost:2, effect:'20 recoil',         special:'recoil_15' },
    { id:'attack_order',name:'Attack Order',icon:'🐝', type:'bug',    power:90, cost:3, effect:'High crit. Once.',  special:'high_crit', exhaust:true },
  ],
  steel: [
    { id:'metal_claw',  name:'Metal Claw',  icon:'⚙️', type:'steel',  power:40, cost:1, effect:'High crit',         special:'high_crit' },
    { id:'iron_defense',name:'Iron Defense',icon:'🛡️', type:'steel',  power:0,  cost:1, effect:'Block 50 dmg',      special:'iron_defense' },
    { id:'steel_wing',  name:'Steel Wing',  icon:'✈️', type:'steel',  power:50, cost:1, effect:'',                  special:null },
    { id:'iron_tail',   name:'Iron Tail',   icon:'⚡', type:'steel',  power:65, cost:2, effect:'DEF -20',           special:'debuff_def' },
    { id:'flash_cannon',name:'Flash Cannon',icon:'💡', type:'steel',  power:62, cost:2, effect:'',                  special:null },
    { id:'gyro_ball',   name:'Gyro Ball',   icon:'⚙️', type:'steel',  power:72, cost:2, effect:'High crit',         special:'high_crit' },
    { id:'mirror_shot', name:'Mirror Shot', icon:'🪞', type:'steel',  power:55, cost:2, effect:'ACC -20%',          special:'debuff_acc' },
    { id:'bullet_punch',name:'Bullet Punch',icon:'👊', type:'steel',  power:48, cost:1, effect:'Always first',      special:null },
    { id:'heavy_slam',  name:'Heavy Slam',  icon:'🏋️', type:'steel',  power:80, cost:3, effect:'Max steel. Once.',  special:null, exhaust:true },
    { id:'meteor_mash', name:'Meteor Mash', icon:'☄️', type:'steel',  power:90, cost:3, effect:'ATK +10. Once.',    special:'ancient_power', exhaust:true },
  ],
  dark: [
    { id:'thief',       name:'Thief',       icon:'🌑', type:'dark',   power:38, cost:1, effect:'Steal opp item',    special:'thief' },
    { id:'bite',        name:'Bite',        icon:'🦷', type:'dark',   power:42, cost:1, effect:'25% flinch',        special:'flinch' },
    { id:'taunt2',      name:'Taunt',       icon:'😤', type:'dark',   power:0,  cost:1, effect:'Block utility×2',   special:'taunt' },
    { id:'night_slash', name:'Night Slash', icon:'🌑', type:'dark',   power:55, cost:2, effect:'High crit',         special:'high_crit' },
    { id:'crunch2',     name:'Crunch',      icon:'💀', type:'dark',   power:58, cost:2, effect:'DEF -20',           special:'debuff_def' },
    { id:'dark_pulse2', name:'Dark Pulse',  icon:'🌑', type:'dark',   power:65, cost:2, effect:'25% flinch',        special:'flinch' },
    { id:'foul_play',   name:'Foul Play',   icon:'🎭', type:'dark',   power:72, cost:2, effect:'Uses opp ATK',      special:'venoshock' },
    { id:'sucker_punch',name:'Sucker Punch',icon:'🎯', type:'dark',   power:50, cost:1, effect:'Always first',      special:null },
    { id:'knock_off',   name:'Knock Off',   icon:'👋', type:'dark',   power:60, cost:2, effect:'Removes held item', special:'debuff_def' },
    { id:'dark_void',   name:'Dark Void',   icon:'🕳️', type:'dark',   power:90, cost:3, effect:'Sleep. Once.',      special:'skip_opp', exhaust:true },
  ],
};

// Apply level scaling and improvements to a LEAGUE_DECKS template
function applyLeagueDeck(rawDeck, level = 40, improvements = {}) {
  return rawDeck.map((card, deckPos) => {
    const c = { ...card };
    if (c.power > 0) c.power = Math.round(c.power + level * 0.5);
    const imp = improvements[deckPos] || 0;
    if (imp > 0) {
      c.power    = Math.round(c.power * (1 + imp * 0.25));
      c.improved = imp;
    }
    c.deckPos = deckPos;
    return c;
  });
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
  // Common — unevolved Kanto Pokémon, widely encountered in the wild
  common: [
    10,11,13,14,16,17,19,20,21,
    39,40,41,42,43,44,46,47,48,49,
    50,51,52,53,54,55,56,57,58,
    60,61,63,66,69,70,72,73,74,75,
    77,79,81,84,86,88,90,92,95,96,98,
    100,102,104,108,109,111,113,114,116,118,120,
    129,133,
  ],
  // Uncommon — mid-stage evolutions + less common Kanto Pokémon
  uncommon: [
    12,15,18,22,23,24,27,28,
    29,30,31,32,33,34,35,36,37,38,
    45,59,62,64,67,71,76,78,80,82,
    83,85,87,89,91,93,94,97,99,
    101,103,105,107,110,112,115,117,119,121,
    122,123,124,125,126,127,128,130,131,132,
    134,135,136,137,138,139,140,141,142,143,
  ],
  // Rare — fully evolved powerful Pokémon + starter second evolutions
  rare: [
    2,5,8,           // Ivysaur, Charmeleon, Wartortle (starter 2nd evos — rare only)
    3,6,9,           // Venusaur, Charizard, Blastoise (final forms — very rare)
    65,68,
    149,             // Dragonite
    130,             // Gyarados
    143,             // Snorlax
    106,             // Hitmonlee
    107,             // Hitmonchan
    110,             // Weezing
    112,             // Rhydon
    76,              // Golem
    103,             // Exeggutor
    105,             // Marowak
    148,             // Dragonair
    147,             // Dratini
    59,              // Arcanine
  ],
  legendary: [144, 145, 146],  // Articuno, Zapdos, Moltres
};

// ── Johto wild pool (#152–251) ────────────────────────────────────────────────
const JOHTO_WILD_POOL = {
  common: [
    152,155,158,         // starters (rare in wild but catchable)
    161,163,165,167,
    170,172,173,174,
    175,177,179,
    183,185,187,190,
    191,193,194,198,
    200,203,204,206,207,
    209,211,213,214,216,
    218,220,222,223,226,
    228,231,234,235,236,
  ],
  uncommon: [
    153,156,159,162,164,
    166,168,169,
    171,174,176,180,
    184,186,188,195,196,
    197,199,201,202,205,
    208,210,212,215,217,
    219,221,224,225,227,
    229,230,232,233,237,
    238,239,240,241,242,
  ],
  rare: [
    154,157,160,         // fully evolved Johto starters
    181,182,189,         // Ampharos, Bellossom, Jumpluff
    192,207,             // Sunflora, Gligar
    214,243,244,245,     // Heracross, legendary beasts (very rare)
    246,247,248,         // Larvitar line
    249,250,             // Lugia, Ho-Oh (legendary)
  ],
  legendary: [243, 244, 245, 249, 250],  // Raikou, Entei, Suicune, Lugia, Ho-Oh
};

// Wire Johto wild pool into REGION_DATA — done via getter, no manual assignment needed

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
    description: 'Heals 5 HP per hit dealt. Upgradeable to ★★★.',
    price: 40, maxStack: 1, trigger: 'held',
  },
  {
    id: 'lucky_egg',      name: 'Lucky Egg',         icon: '🥚', category: 'held',
    description: '+1 level per battle win. Upgradeable to ★★★.',
    price: 50, maxStack: 1, trigger: 'held',
  },
  {
    id: 'amulet_coin',    name: 'Amulet Coin',       icon: '🪙', category: 'held',
    description: 'Doubles gold from battles. Upgradeable to ★★★.',
    price: 55, maxStack: 1, trigger: 'held',
  },
  {
    id: 'focus_sash',     name: 'Focus Sash',        icon: '🎗', category: 'held',
    description: 'Survive one KO hit at 1 HP. Upgradeable to ★★★.',
    price: 60, maxStack: 1, trigger: 'held',
  },
  {
    id: 'charcoal',       name: 'Charcoal',          icon: '🪵', category: 'held',
    description: 'Fire moves +20%. Upgradeable to ★★★.',
    price: 30, maxStack: 1, trigger: 'held',
  },
  {
    id: 'mystic_water',   name: 'Mystic Water',      icon: '💦', category: 'held',
    description: 'Water moves +20%. Upgradeable to ★★★.',
    price: 30, maxStack: 1, trigger: 'held',
  },
  {
    id: 'miracle_seed',   name: 'Miracle Seed',      icon: '🌱', category: 'held',
    description: 'Grass moves +20%. Upgradeable to ★★★.',
    price: 30, maxStack: 1, trigger: 'held',
  },
  {
    id: 'magnet',         name: 'Magnet',             icon: '🧲', category: 'held',
    description: 'Electric moves +20%. Upgradeable to ★★★.',
    price: 30, maxStack: 1, trigger: 'held',
  },
  {
    id: 'leftovers',      name: 'Leftovers',          icon: '🍖', category: 'held',
    description: 'Heals 5 HP per turn start. Upgradeable to ★★★.',
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
  let price = Math.ceil((basePrice * factor) / 5) * 5; // round up to nearest 5g
  // Rocket's Ledger reward — 10% off for the rest of the run
  if (GameState?.rocketLedgerDiscount) price = Math.ceil((price * 0.9) / 5) * 5;
  return price;
}

function goldForWildBattle() {
  const t      = GOLD_TABLE[Math.min(GameState.bossesDefeated, GOLD_TABLE.length - 1)];
  let earned   = t.wildMin + Math.floor(Math.random() * (t.wildMax - t.wildMin + 1));
  // Amulet Coin — double gold if active Pokémon holds it
  const active = GameState.party?.[GameState.activePokemonIndex];
  if (active?.heldItem?.id === 'amulet_coin') {
    const tier = active.heldItem.tier || 1;
    earned *= HELD_ITEM_TIERS.amulet_coin.values[tier - 1] || 2;
  }
  return earned;
}
function goldForBoss() {
  return GOLD_TABLE[Math.min(GameState.bossesDefeated, GOLD_TABLE.length - 1)].bossBonus;
}

// ─── POKEDEX PERSISTENCE ──────────────────────────────────────────────────────

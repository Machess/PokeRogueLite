const COOKING_INGREDIENTS = [
  // recipe ingredients
  { id:'egg',     icon:'🥚', name:'Egg'        },
  { id:'milk',    icon:'🥛', name:'Milk'       },
  { id:'cheese',  icon:'🧀', name:'Cheese'     },
  { id:'salt',    icon:'🧂', name:'Salt'       },
  { id:'flour',   icon:'🌾', name:'Flour'      },
  { id:'sugar',   icon:'🍬', name:'Sugar'      },
  { id:'rice',    icon:'🍚', name:'Rice'       },
  { id:'peas',    icon:'🟢', name:'Peas'       },
  { id:'soy',     icon:'🍶', name:'Soy Sauce'  },
  { id:'berries', icon:'🍓', name:'Berries'    },
  { id:'water',   icon:'💧', name:'Water'      },
  { id:'carrot',  icon:'🥕', name:'Carrot'     },
  { id:'potato',  icon:'🥔', name:'Potato'     },
  { id:'onion',   icon:'🧅', name:'Onion'      },
  { id:'tomato',  icon:'🍅', name:'Tomato'     },
  { id:'pasta',   icon:'🍝', name:'Pasta'      },
  { id:'garlic',  icon:'🧄', name:'Garlic'     },
  { id:'honey',   icon:'🍯', name:'Honey'      },
  { id:'herbs',   icon:'🌿', name:'Herbs'      },
  { id:'banana',  icon:'🍌', name:'Banana'     },
  { id:'apple',   icon:'🍎', name:'Apple'      },
  { id:'orange',  icon:'🍊', name:'Orange'     },
  { id:'nuts',    icon:'🥜', name:'Nuts'       },
  { id:'seeds',   icon:'🌰', name:'Seeds'      },
  { id:'meat',    icon:'🥩', name:'Meat'       },
  { id:'butter',  icon:'🧈', name:'Butter'     },
  // distractors (rarely correct — test recipe knowledge)
  { id:'fish',    icon:'🐟', name:'Fish'       },
  { id:'chili',   icon:'🌶️', name:'Chili'      },
  { id:'ice',     icon:'🧊', name:'Ice'        },
  { id:'mushroom',icon:'🍄', name:'Mushroom'   },
  { id:'lemon',   icon:'🍋', name:'Lemon'      },
  { id:'corn',    icon:'🌽', name:'Corn'       },
];

// Buffs awarded by dish. Each maps to pendingPlayerEffects consumed in battle.
// All dishes ALSO fully heal the party on success (handled in submit()).
const COOKING_RECIPES = [
  // 🍳 PAN
  { id:'omelette', name:'Egg Omelette', vessel:'pan', reveal:'dish_omelette.png',
    order:['egg','milk','cheese','salt'],
    buff:{ key:'cookSunnyStart', label:'Sunny Start — +1 energy on turn 1' } },
  { id:'pancakes', name:'Pancakes', vessel:'pan', reveal:'dish_pancakes.png',
    order:['flour','egg','milk','sugar'],
    buff:{ key:'cookSweetEnergy', label:'Sweet Energy — +10% damage early' } },
  { id:'friedrice', name:'Fried Rice', vessel:'pan', reveal:'dish_friedrice.png',
    order:['rice','egg','peas','soy'],
    buff:{ key:'cookQuickReflexes', label:'Quick Reflexes — you move first' } },
  { id:'pokepuffs', name:'Poképuffs', vessel:'pan', reveal:'dish_pokepuffs.png',
    order:['flour','berries','sugar','egg'],
    buff:{ key:'cookMorale', label:'Morale Boost — heal each turn (3 turns)' } },
  // 🍲 POT
  { id:'veggiesoup', name:'Veggie Soup', vessel:'pot', reveal:'dish_veggiesoup.png',
    order:['water','carrot','potato','onion'],
    buff:{ key:'cookShield', label:'Hearty Defense — damage shield next battle' } },
  { id:'pasta', name:'Tomato Pasta', vessel:'pot', reveal:'dish_pasta.png',
    order:['water','pasta','tomato','garlic'],
    buff:{ key:'cookIronStomach', label:'Iron Stomach — resist status 1 battle' } },
  { id:'stew', name:'Hearty Stew', vessel:'pot', reveal:'dish_stew.png',
    order:['water','meat','potato','herbs'],
    buff:{ key:'cookRegen', label:'Regeneration — heal at end of each turn' } },
  // 🥤 BOWL (no-cook)
  { id:'smoothie', name:'Berry Smoothie', vessel:'bowl', reveal:'dish_smoothie.png',
    order:['berries','milk','banana','honey'],
    buff:{ key:'cookRefreshed', label:'Refreshed — cleanse status at start' } },
  { id:'fruitsalad', name:'Fruit Salad', vessel:'bowl', reveal:'dish_fruitsalad.png',
    order:['apple','berries','banana','orange'],
    buff:{ key:'cookVitality', label:'Vitality — +15% max HP next battle' } },
  { id:'trailmix', name:'Trail Mix', vessel:'bowl', reveal:'dish_trailmix.png',
    order:['nuts','berries','seeds','honey'],
    buff:{ key:'cookEndurance', label:'Endurance — survive a fatal hit once' } },
];

// Brock's warm, in-character line said on the dish reveal, keyed by dish id.
const BROCK_DISH_FLUFF = {
  omelette:   "A fluffy omelette! Eggs, milk and cheese — my Pokémon's favourite breakfast!",
  pancakes:   "Golden pancakes! Flour, eggs and milk whisked just right. Don't forget the syrup!",
  friedrice:  "Sizzling fried rice! The secret's adding the egg right after the rice. Delicious!",
  pokepuffs:  "Poképuffs! My specialty — light, sweet and berry-filled. Pokémon adore these!",
  veggiesoup: "A hearty veggie soup! Carrot, potato and onion simmered slow. Good for the soul!",
  pasta:      "Tomato pasta! Garlic and tomato make the sauce sing. A trainer's classic!",
  stew:       "A rich, meaty stew! Slow-simmered with potato and herbs — this'll keep you strong!",
  smoothie:   "A berry smoothie! Blended with banana and a drizzle of honey. So refreshing!",
  fruitsalad: "A bright fruit salad! Apple, berries, banana and orange — vitamins in every bite!",
  trailmix:   "Trail mix! Nuts, berries and seeds — the perfect snack for a long journey!",
};

const VESSEL_META = {
  pan:  { img:'pan.png',  emoji:'🍳', label:'Pan',  verb:'fry'  },
  pot:  { img:'pot.png',  emoji:'🍲', label:'Pot',  verb:'boil' },
  bowl: { img:'bowl.png', emoji:'🥣', label:'Bowl', verb:'mix'  },
};

// Build the serving-size math for one ingredient slot (tier-scaled).
// Kept from the original game — addition (T1), mult/add (T2), div/half (T3).
function _cookMathFor(ing, tier) {
  let correct, question, coins = null;
  if (tier === 1) {
    const a = 1 + Math.floor(Math.random() * 4);
    const b = 1 + Math.floor(Math.random() * 4);
    correct  = a + b;
    question = `Brock used ${a} ${ing.name} yesterday and needs ${b} more today. How many total?`;
    coins    = { a, b, op:'+', icon: ing.icon };
  } else if (tier === 2) {
    if (Math.random() < 0.5) {
      const poke = 2 + Math.floor(Math.random() * 4);
      const each = 2 + Math.floor(Math.random() * 5);
      correct  = poke * each;
      question = `${poke} Pokémon each need ${each} ${ing.name}. How many total?`;
    } else {
      const b1 = 5 + Math.floor(Math.random() * 10);
      const b2 = 3 + Math.floor(Math.random() * 8);
      correct  = b1 + b2;
      question = `Brock made ${b1} portions, then ${b2} more. Total ${ing.name}?`;
    }
  } else {
    if (Math.random() < 0.5) {
      const portions = 2 + Math.floor(Math.random() * 5);
      correct  = 3 + Math.floor(Math.random() * 6);
      const total = portions * correct;
      question = `${total} ${ing.name} split into ${portions} bowls. How many per bowl?`;
    } else {
      const full = (4 + Math.floor(Math.random() * 8)) * 2;
      correct  = full / 2;
      question = `The full recipe needs ${full} ${ing.name}. Making half — how many?`;
    }
  }
  const wrongs = new Set();
  while (wrongs.size < 3) {
    const delta = 1 + Math.floor(Math.random() * 4);
    const w = Math.random() < 0.5 ? correct + delta : Math.max(1, correct - delta);
    if (w !== correct) wrongs.add(w);
  }
  return { question, correct, choices: shuffle([correct, ...wrongs]), coins };
}

// Pick a recipe for the tier and build its ordered slots + pantry (with distractors)
function _pickCookingRecipe(tier) {
  const recipe = COOKING_RECIPES[Math.floor(Math.random() * COOKING_RECIPES.length)];
  // Tier scales how many ingredients are required (3 for T1, 4 for T2/T3)
  const need = tier === 1 ? 3 : recipe.order.length;
  const order = recipe.order.slice(0, need);

  const slots = order.map(id => {
    const ing = COOKING_INGREDIENTS.find(i => i.id === id);
    return { ...ing, math: _cookMathFor(ing, tier) };
  });

  // Build the pantry: the correct ingredients + distractors, shuffled.
  // Tier 1: few distractors; Tier 3: many.
  const distractorCount = tier === 1 ? 2 : tier === 2 ? 4 : 6;
  const correctIds = new Set(order);
  const pool = shuffle(COOKING_INGREDIENTS.filter(i => !correctIds.has(i.id)));
  const distractors = pool.slice(0, distractorCount);
  const pantry = shuffle([...slots.map(s => COOKING_INGREDIENTS.find(i => i.id === s.id)), ...distractors]);

  return { recipe, vessel: recipe.vessel, slots, pantry, order };
}

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
  _recipe: null, _vessel: 'pan', _slots: [], _pantry: [], _order: [],
  _placed: [],          // ingredients placed in the vessel, in order
  _selected: null, _node: null, _isActive: false,
  _script: [], _lineIdx: 0, _vesselChosen: false, _mistakes: 0,

  start(node) {
    this._node = node;
    const data = _pickCookingRecipe(getSkillTier('cooking'));
    this._recipe = data.recipe;
    this._vessel = data.vessel;
    this._slots  = data.slots;       // ordered required ingredients (with math)
    this._pantry = data.pantry;
    this._order  = data.order;       // array of required ingredient ids in order
    this._placed = [];
    this._selected = null;
    this._vesselChosen = false;
    this._mistakes = 0;
    this._isActive = true;
    ActiveEngine.set(this);
    this._script = BROCK_COOKING_SCRIPTS[Math.floor(Math.random() * BROCK_COOKING_SCRIPTS.length)];
    this._lineIdx = 0;

    showScreen('boss');
    BossEngine._isRocket = false;
    const bgImg = document.querySelector('#screen-boss .battle-bg-img');
    if (bgImg) { bgImg.src = ''; bgImg.style.opacity = '0'; }
    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';
    document.getElementById('boss-party-bar').innerHTML       = '';
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = "Let's Cook! ▶";
    this._showLine(0);
  },

  _showLine(idx) {
    const line   = this._script[idx];
    const name   = GameState.trainerName || 'Trainer';
    const text   = line.text.replace(/\$\{name\}/g, name);
    const isLast = idx === this._script.length - 1;
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
    let ci = 0;
    const interval = setInterval(() => {
      textEl.textContent += text[ci++];
      if (ci >= text.length) {
        clearInterval(interval);
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

  startGame() {
    this._isActive = false;
    ActiveEngine.clear();
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = 'Battle! ▶';
    document.getElementById('trainer-intro').style.display = 'none';
    showScreen('cooking');
    // First: choose the cookware (all tiers; tier 1 highlights the correct one)
    this._renderVesselChoice();
  },

  // ── Step 1: pick the right cookware ──────────────────────────────────────
  _renderVesselChoice() {
    const tier = getSkillTier('cooking');
    const stage = document.getElementById('cooking-stage');
    const vm = VESSEL_META[this._vessel];
    stage.innerHTML = `
      <div class="cook-recipe-title">📋 ${this._recipe.name}</div>
      <div class="cook-vessel-prompt">Which do you need to ${this._recipe.vessel === 'bowl' ? 'mix' : (this._recipe.vessel === 'pot' ? 'boil' : 'fry')} this dish?</div>
      <div class="cook-vessel-choices" id="cook-vessel-choices"></div>`;
    document.getElementById('cooking-recipe').innerHTML = '';
    document.getElementById('cooking-pantry').innerHTML = '';
    const submitBtn = document.getElementById('btn-cooking-submit');
    if (submitBtn) submitBtn.style.display = 'none';

    const choices = document.getElementById('cook-vessel-choices');
    ['pan','pot','bowl'].forEach(v => {
      const meta = VESSEL_META[v];
      const correct = v === this._vessel;
      const hint = (tier === 1 && correct) ? ' cook-vessel-hint' : '';
      const btn = document.createElement('button');
      btn.className = 'cook-vessel-btn' + hint;
      btn.innerHTML = `<img src="assets/${meta.img}" class="cook-vessel-img"
                          onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'cook-vessel-emoji',textContent:'${meta.emoji}'}))"/>
                       <span class="cook-vessel-label">${meta.label}</span>`;
      btn.addEventListener('click', () => {
        if (correct) {
          this._vesselChosen = true;
          this._renderCooking();
        } else {
          this._mistakes++;
          btn.classList.add('cook-vessel-wrong');
          SoundEngine.playSFX && SoundEngine.playSFX('teamrocket_show.mp3', 0.2);
          this._brockSay(`Not the ${meta.label.toLowerCase()} — you ${this._recipe.vessel === 'bowl' ? 'mix' : this._recipe.vessel === 'pot' ? 'boil' : 'fry'} this dish! Try the ${VESSEL_META[this._vessel].label.toLowerCase()}.`);
          setTimeout(() => btn.classList.remove('cook-vessel-wrong'), 600);
        }
      });
      choices.appendChild(btn);
    });
  },

  // ── Step 2: add ingredients into the vessel, in order ────────────────────
  _renderCooking() {
    const tier = getSkillTier('cooking');
    const vm = VESSEL_META[this._vessel];
    const stage = document.getElementById('cooking-stage');

    // Recipe card (names; tier 1 also shows the icons)
    const recipeEl = document.getElementById('cooking-recipe');
    recipeEl.innerHTML = `<div class="cook-recipe-head">📋 ${this._recipe.name}</div>` +
      this._slots.map((s, i) => {
        const done = i < this._placed.length;
        const showIcon = tier === 1;
        return `<div class="cook-recipe-line ${done ? 'cook-line-done' : ''}">
          <span class="cook-line-num">${i + 1}</span>
          ${showIcon ? `<span class="cook-line-icon">${s.icon}</span>` : ''}
          <span class="cook-line-name">${s.name}</span>
          <span class="cook-line-qty">${done ? '× ' + this._placed[i].qty : ''}</span>
          ${done ? '<span class="cook-line-check">✓</span>' : ''}
        </div>`;
      }).join('');

    // The vessel with placed ingredients inside it
    stage.innerHTML = `
      <div class="cook-vessel-stage cook-vessel-${this._vessel}">
        <img src="assets/${vm.img}" class="cook-vessel-big"
             onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'cook-vessel-big-emoji',textContent:'${vm.emoji}'}))"/>
        <div class="cook-vessel-contents" id="cook-vessel-contents"></div>
        ${this._placed.length > 0 ? '<div class="cook-steam"></div>' : ''}
      </div>
      <div class="cook-next-hint" id="cook-next-hint"></div>`;

    const contents = document.getElementById('cook-vessel-contents');
    this._placed.forEach(p => {
      const span = document.createElement('span');
      span.className = 'cook-in-vessel';
      span.textContent = p.icon;
      contents.appendChild(span);
    });

    // Next-step hint
    const hintEl = document.getElementById('cook-next-hint');
    if (this._placed.length < this._slots.length) {
      const next = this._slots[this._placed.length];
      hintEl.textContent = tier === 1
        ? `Next: add the ${next.name} ${next.icon}`
        : `Add ingredient #${this._placed.length + 1} (in the right order!)`;
    } else {
      hintEl.textContent = 'All in! Serve it up below 🍽️';
    }

    // Pantry
    const pantryEl = document.getElementById('cooking-pantry');
    const nextId = this._placed.length < this._slots.length ? this._slots[this._placed.length].id : null;
    pantryEl.innerHTML = this._pantry.map(ing => {
      const placed = this._placed.some(p => p.id === ing.id);
      // Tier 1: highlight the correct next ingredient
      const hint = (tier === 1 && ing.id === nextId && !placed) ? ' pantry-hint' : '';
      return `<div class="pantry-item ${placed ? 'pantry-used' : ''}${hint}" data-ing="${ing.id}">
        <span class="pantry-icon">${ing.icon}</span>
        <span class="pantry-name">${ing.name}</span>
      </div>`;
    }).join('');
    pantryEl.querySelectorAll('.pantry-item').forEach(el => {
      el.addEventListener('click', () => this._tryAdd(el.dataset.ing));
    });

    // Submit
    const submitBtn = document.getElementById('btn-cooking-submit');
    const allIn = this._placed.length === this._slots.length;
    submitBtn.style.display = '';
    submitBtn.disabled = !allIn;
    submitBtn.textContent = allIn ? '🍽️ Serve it up!' : `Add ingredients in order (${this._placed.length}/${this._slots.length})`;
  },

  _tryAdd(id) {
    if (this._placed.some(p => p.id === id)) return;     // already in
    const expectedIdx = this._placed.length;
    const expected = this._slots[expectedIdx];
    const ing = COOKING_INGREDIENTS.find(i => i.id === id);
    if (!ing) return;

    if (id !== expected.id) {
      // Wrong ingredient OR wrong order — gentle corrective feedback
      this._mistakes++;
      const inRecipe = this._order.includes(id);
      this._brockSay(inRecipe
        ? `Good ingredient — but not yet! Add the ${expected.name} ${expected.icon} first.`
        : `Hmm, ${ing.name.toLowerCase()} doesn't go in ${this._recipe.name}! Try the ${expected.name} ${expected.icon}.`);
      const el = document.querySelector(`.pantry-item[data-ing="${id}"]`);
      if (el) { el.classList.add('pantry-wrong'); setTimeout(() => el.classList.remove('pantry-wrong'), 500); }
      return;
    }
    // Correct ingredient & order — solve the serving-size math
    this._showMathModal(expected, expectedIdx);
  },

  _brockSay(msg) {
    const hintEl = document.getElementById('cook-next-hint');
    if (hintEl) {
      hintEl.textContent = msg;
      hintEl.classList.add('cook-hint-flash');
      setTimeout(() => hintEl.classList.remove('cook-hint-flash'), 600);
    }
  },

  _showMathModal(slot, idx) {
    const ch   = slot.math;
    const tier = getSkillTier('cooking');
    const overlay = document.getElementById('cooking-math-overlay');
    document.getElementById('cooking-math-question').textContent = `How many ${slot.name} does the recipe need?`;
    document.getElementById('cooking-math-qty-hint').textContent = ch.question;
    const coinVis = document.getElementById('cooking-math-coins');
    if (tier === 1 && ch.coins) {
      const { a, b, op } = ch.coins;
      coinVis.innerHTML = `<span>${slot.icon.repeat(Math.min(a, 8))}</span><span>${op === '+' ? '➕' : '➖'}</span><span>${slot.icon.repeat(Math.min(b, 8))}</span>`;
      coinVis.style.display = 'flex';
    } else { coinVis.style.display = 'none'; }

    const btnArea = document.getElementById('cooking-math-answers');
    btnArea.innerHTML = '';
    ch.choices.forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'btn-pixel btn-secondary cooking-math-btn';
      btn.textContent = val;
      btn.onclick = () => {
        const correct = val === ch.correct;
        if (!correct) { this._mistakes++; btn.classList.add('math-wrong'); }
        this._placed.push({ ...slot, qty: val });
        SoundEngine.playCorrect && correct && SoundEngine.playCorrect();
        setTimeout(() => { overlay.style.display = 'none'; this._renderCooking(); }, correct ? 250 : 650);
      };
      btnArea.appendChild(btn);
    });
    overlay.style.display = 'flex';
  },

  // ── Step 3: serve — reveal dish, heal, apply buff (scaled by accuracy) ────
  submit() {
    // Accuracy: correct ingredient+order+qty per slot, minus mistakes made
    let correctSlots = 0;
    this._placed.forEach((p, i) => {
      if (p.id === this._slots[i].id && p.qty === this._slots[i].math.correct) correctSlots++;
    });
    const total   = this._slots.length;
    const perfect = correctSlots === total && this._mistakes === 0;
    const good    = correctSlots >= Math.ceil(total * 0.7);

    const party = GameState.party;
    // Every successful dish FULLY heals the party (revives fainted)
    if (good) party.forEach(p => { p.hp = p.maxHp; });
    else party.filter(p => p.hp > 0).forEach(p => { p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * 0.2)); });

    // Apply the dish buff (full on perfect, still granted on good)
    let buffMsg = '';
    if (good) {
      GameState.pendingPlayerEffects = GameState.pendingPlayerEffects || {};
      GameState.pendingPlayerEffects[this._recipe.buff.key] = true;
      buffMsg = `\n\n⭐ ${this._recipe.buff.label}`;
    }
    saveGame();

    this._showReveal(perfect, good, correctSlots, total, buffMsg);
  },

  _showReveal(perfect, good, correctSlots, total, buffMsg) {
    const stage = document.getElementById('cooking-stage');
    document.getElementById('cooking-recipe').innerHTML = '';
    document.getElementById('cooking-pantry').innerHTML = '';
    const submitBtn = document.getElementById('btn-cooking-submit');
    if (submitBtn) submitBtn.style.display = 'none';

    const vm = VESSEL_META[this._vessel];
    const fluff = good ? (BROCK_DISH_FLUFF[this._recipe.id] || '') : '';
    stage.innerHTML = `
      <div class="cook-reveal">
        <div class="cook-reveal-plate">
          <img src="assets/${this._recipe.reveal}" class="cook-reveal-img"
               onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'cook-reveal-emoji',textContent:'${vm.emoji}'}))"/>
          <div class="cook-reveal-shine"></div>
        </div>
        <div class="cook-reveal-name">${good ? '' : 'A messy '}${this._recipe.name}!</div>
        ${fluff ? `<div class="cook-reveal-fluff">
          <img src="assets/brock.png" class="cook-reveal-brock"
               onerror="this.onerror=null;this.style.display='none'"/>
          <div class="cook-reveal-speech">${fluff}</div>
        </div>` : ''}
      </div>`;
    SoundEngine.playCorrect && good && SoundEngine.playCorrect();

    const headline = perfect ? '🍽️ Perfect Dish!' : good ? '🍱 Tasty!' : '😬 A Bit Off...';
    const healMsg  = good ? 'Your whole team is fully healed! ♥' : 'Your team ate a little and recovered some HP.';
    const quote    = good ? (BROCK_DISH_FLUFF[this._recipe.id] || _cookingQuote('perfect'))
                          : _cookingQuote('wrong');
    const body = `${this._recipe.name} — ${correctSlots}/${total} steps right.\n${healMsg}${buffMsg}\n\n"${quote}" — Brock`;

    setTimeout(() => {
      showModal(headline, body, () => {
        MapEngine.completeNode(GameState.currentNodeIndex);
        MapEngine.show();
      });
    }, 3600);
  },
};

// ─── FISHING MINI-GAME ────────────────────────────────────────────────────────



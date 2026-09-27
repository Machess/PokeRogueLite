const _apiCache = {};
async function fetchPoke(id) {
  const local=globalThis.OFFLINE_POKEMON?.[Number(id)];
  if(local)return structuredClone(local);
  if(_apiCache[id])return _apiCache[id];
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),5000);
  try{const response=await fetch(`${POKEAPI}/pokemon/${id}`,{signal:controller.signal});
    if(!response.ok)throw new Error('Pokémon data unavailable');
    const data=await response.json();_apiCache[id]=data;return data;
  }finally{clearTimeout(timeout);}
}
async function fetchSpecies(id) {
  const local=globalThis.OFFLINE_SPECIES?.[id];
  if(local)return local;
  return {capture_rate:globalThis.OFFLINE_POKEMON?.[id]?.capture_rate||45,flavor_text_entries:[],genera:[]};
}

// Load persisted cache on startup
try {
  const saved = sessionStorage.getItem('poketrials_api_cache');
  if (saved) Object.assign(_apiCache, JSON.parse(saved));
} catch(e) {}

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
  // Note: in this kids' game we use heavy RESISTANCE (0.5) instead of hard
  // immunity (0) for the Normal/Ghost matchups, so a child with an all-Normal
  // team can never hit an unwinnable dead-end. Other matchups keep their flavor;
  // the battle stalemate-breaker (below) guarantees no fight can last forever.
  normal:   { rock:.5, ghost:.5 },
  fire:     { fire:.5, water:.5, rock:.5, dragon:.5, grass:2, ice:2, bug:2 },
  water:    { water:.5, grass:.5, dragon:.5, fire:2, ground:2, rock:2 },
  grass:    { fire:.5, grass:.5, poison:.5, flying:.5, bug:.5, dragon:.5, water:2, ground:2, rock:2 },
  electric: { grass:.5, electric:.5, dragon:.5, ground:.25, water:2, flying:2 },
  ice:      { water:.5, ice:.5, fire:.5, grass:2, ground:2, flying:2, dragon:2 },
  fighting: { poison:.5, bug:.5, psychic:.5, flying:.5, ghost:.5, normal:2, ice:2, rock:2 },
  poison:   { poison:.5, ground:.5, rock:.5, ghost:.5, grass:2 },
  ground:   { grass:.5, bug:.5, flying:.25, fire:2, electric:2, poison:2, rock:2 },
  flying:   { electric:.5, rock:.5, grass:2, fighting:2, bug:2 },
  psychic:  { psychic:.5, fighting:2, poison:2 },
  bug:      { fire:.5, fighting:.5, flying:.5, ghost:.5, grass:2, psychic:2 },
  rock:     { fighting:.5, ground:.5, fire:2, ice:2, flying:2, bug:2 },
  ghost:    { normal:.5, ghost:2, psychic:2 },
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


const TYPE_ICONS = {
  normal:'⬜', fire:'🔥', water:'💧', grass:'🌿', electric:'⚡',
  ice:'❄️', fighting:'🥊', poison:'☠️', ground:'⛰️', flying:'🕊️',
  psychic:'🔮', bug:'🐛', rock:'🪨', ghost:'👻', dragon:'🐉',
  dark:'🌑', steel:'⚙️', fairy:'✨',
};

// ─── FISHING PUZZLES DATA ─────────────────────────────────────────────────────
// mode: 'identify' — pick the correct Pokémon from 4 sprite cards
// mode: 'weakness' — given type, pick what beats it
// mode: 'habitat'  — given location description, pick who lives there
// buffType determines the reward applied on correct answer

// ─── MISTY'S MYSTERY CATCH — 40 famous Pokémon, generated puzzles ─────────────
// Each entry: id, name, type, 2–3 short clue fragments, optional custom fluff.
// The generator shuffles clues, slices by tier, and builds type-aware decoys so
// repetition is rare and clue order never gives the answer away by position.

const MISTY_POKEMON = [
  // ── Water-leaning (Misty's specialty) ──
  { id:129, name:'Magikarp',  type:'water',    clues:['It splashes uselessly near the surface.','Its bright orange and gold scales flash in the sun.','It is famous for being almost completely helpless.'], fluffR:'Even I almost tossed it back. Never underestimate a Magikarp!', fluffW:'Orange scales and hopeless splashing — that\'s Magikarp all over!' },
  { id:130, name:'Gyarados',  type:'water',    clues:['A massive serpent that erupts from the water in a fury.','Its gaping jaws and blue scales strike fear into trainers.','It evolves from the most helpless of fish.'], fluffR:'Gyarados! From useless fish to raging dragon. Respect it.', fluffW:'That roaring serpent could only be Gyarados!' },
  { id:118, name:'Goldeen',   type:'water',    clues:['It has a flowing white tail like a bridal veil.','A sharp pointed horn sits on its forehead.','It is called the Water Queen for its grace.'], fluffR:'Goldeen! Grace and power combined. My favourite.', fluffW:'That veil tail and horn — the Water Queen, Goldeen!' },
  { id:119, name:'Seaking',   type:'water',    clues:['Its powerful horn can bore through solid rock.','Bright orange with bold black stripes.','It fiercely guards its eggs in the autumn.'], fluffR:'Seaking! A devoted parent and a tough fighter.', fluffW:'That drilling horn belongs to Seaking!' },
  { id:54,  name:'Psyduck',   type:'water',    clues:['It holds its head with both hands — always a headache.','A plain yellow duck with a baffled expression.','When its headache peaks, it unleashes psychic power.'], fluffR:'Ugh — PSYDUCK! Story of my life. Of course you got it.', fluffW:'That confused face and head-holding — Psyduck! My problem Pokémon.' },
  { id:60,  name:'Poliwag',   type:'water',    clues:['Its round body is almost see-through.','A clear spiral swirls on its belly.','Its legs are so new it can barely walk.'], fluffR:'Poliwag! Those tiny legs and that spiral are unmistakable.', fluffW:'Transparent body, spiral belly — that\'s Poliwag!' },
  { id:72,  name:'Tentacool', type:'water',    clues:['Almost transparent — nearly invisible in the water.','Two red crystal-like eyes float above it.','Its trailing tentacles can sting and paralyse.'], fluffR:'Tentacool! Sneaky and dangerous. Watch those tentacles.', fluffW:'Those red crystal eyes give it away — Tentacool!' },
  { id:120, name:'Staryu',    type:'water',    clues:['A golden core glows at the centre of its body.','Shaped like a five-pointed star.','It can regrow any limb that is torn off.'], fluffR:'Staryu! That glowing core never stops shining.', fluffW:'A star shape with a glowing core — Staryu!' },
  { id:121, name:'Starmie',   type:'water',    clues:['Its jewel-like core flashes in seven colours.','Two star shapes spin on top of each other.','Some believe it signals to outer space.'], fluffR:'Starmie! Mysterious and beautiful. A cosmic Pokémon.', fluffW:'That spinning jewelled core is pure Starmie!' },
  { id:98,  name:'Krabby',    type:'water',    clues:['It has two large, snapping pincers.','It burrows into beach sand to hide.','If a pincer breaks off, it simply grows back.'], fluffR:'Krabby! Quick to pinch, quick to flee.', fluffW:'Those snapping claws on the beach — Krabby!' },
  { id:116, name:'Horsea',    type:'water',    clues:['A tiny seahorse that drifts among the coral.','It spits ink to escape from danger.','It anchors itself with its curled tail in storms.'], fluffR:'Horsea! Small but clever in a current.', fluffW:'That little curled tail belongs to Horsea!' },
  { id:79,  name:'Slowpoke',  type:'water',    clues:['It sits by the water dipping its tail to fish.','It is so slow it forgets it feels pain.','Its blank stare hides a surprisingly deep mind.'], fluffR:'Slowpoke! It will get there... eventually.', fluffW:'That dreamy tail-dipping fisher is Slowpoke!' },
  { id:131, name:'Lapras',    type:'water',    clues:['A gentle giant that ferries people across the sea.','It sings a hauntingly beautiful melody.','A large grey shell rises from its back.'], fluffR:'Lapras! Kind-hearted and rare. Treasure it.', fluffW:'That gentle singing ferry is Lapras!' },
  { id:134, name:'Vaporeon',  type:'water',    clues:['Its cells are so like water it can melt away in it.','A sleek blue evolution of Eevee.','Fins and a mermaid-like tail help it swim.'], fluffR:'Vaporeon! It practically becomes the water itself.', fluffW:'That watery blue Eevee form is Vaporeon!' },
  { id:9,   name:'Blastoise', type:'water',    clues:['Two powerful water cannons rise from its shell.','The final evolution of a tiny turtle.','It can blast water with pinpoint accuracy.'], fluffR:'Blastoise! Those cannons hit a can from far away.', fluffW:'Twin water cannons mean Blastoise!' },
  { id:7,   name:'Squirtle',  type:'water',    clues:['A small turtle that hides in its brown shell.','It squirts water at foes with surprising force.','A popular first partner for new trainers.'], fluffR:'Squirtle! A classic starter. Good taste.', fluffW:'That little shelled squirter is Squirtle!' },
  { id:90,  name:'Shellder',  type:'water',    clues:['A clam whose tongue can stretch over a metre.','It clamps shut on anything that comes near.','Its hard shell protects a soft body inside.'], fluffR:'Shellder! Snap — be careful of that bite.', fluffW:'That snapping clam is Shellder!' },
  { id:86,  name:'Seel',      type:'water',    clues:['It loves frozen, icy seas.','A single horn on its head cuts through ice.','It swims gracefully even in freezing water.'], fluffR:'Seel! Right at home in the cold.', fluffW:'That ice-loving swimmer is Seel!' },

  // ── Iconic non-water (Misty: "this washed up near the shore") ──
  { id:25,  name:'Pikachu',   type:'electric', clues:['Electric sparks crackle from its red cheeks.','A yellow mouse with a lightning-bolt tail.','It is the most famous Pokémon of all.'], fluffR:'Pikachu! Everyone knows that one. Shocking choice.', fluffW:'Those sparking cheeks could only be Pikachu!' },
  { id:26,  name:'Raichu',    type:'electric', clues:['Its long tail ends in a lightning-bolt shape.','An orange evolution that stores huge voltage.','It grounds excess electricity through its tail.'], fluffR:'Raichu! Pikachu all grown up and powered up.', fluffW:'That high-voltage orange mouse is Raichu!' },
  { id:6,   name:'Charizard', type:'fire',     clues:['A flame burns at the tip of its tail.','A great dragon-like creature with broad wings.','The final form of a popular fire starter.'], fluffR:'Charizard! Powerful — and it knows it.', fluffW:'That flaming-tailed flyer is Charizard!' },
  { id:4,   name:'Charmander',type:'fire',     clues:['A small lizard with a flame on its tail-tip.','If its tail flame goes out, it is in danger.','A popular first partner for new trainers.'], fluffR:'Charmander! Keep that tail flame burning.', fluffW:'A flame-tailed lizard means Charmander!' },
  { id:1,   name:'Bulbasaur', type:'grass',    clues:['A green seed grows on its back.','Part plant, part toad-like creature.','It basks in sunlight to grow stronger.'], fluffR:'Bulbasaur! A sturdy little starter.', fluffW:'That seed-backed creature is Bulbasaur!' },
  { id:133, name:'Eevee',     type:'normal',   clues:['A fluffy brown fox with a bushy tail.','It can evolve into many different forms.','Its unstable genes adapt to its surroundings.'], fluffR:'Eevee! So many possibilities in one little fox.', fluffW:'That fluffy adaptable fox is Eevee!' },
  { id:143, name:'Snorlax',   type:'normal',   clues:['An enormous Pokémon that mostly sleeps and eats.','It can block an entire road with its body.','It only wakes for a very special flute.'], fluffR:'Snorlax! Good luck getting it to move.', fluffW:'That giant sleeping mountain is Snorlax!' },
  { id:94,  name:'Gengar',    type:'ghost',    clues:['A grinning purple shadow that hides in the dark.','It is said to be a shadow that steals warmth.','Its mischievous laugh echoes at night.'], fluffR:'Gengar! Spooky — it loves a good scare.', fluffW:'That grinning purple shadow is Gengar!' },
  { id:39,  name:'Jigglypuff',type:'normal',   clues:['A round pink balloon with big blue eyes.','Its lullaby puts everyone to sleep.','It pouts and scribbles on sleeping faces.'], fluffR:'Jigglypuff! Don\'t fall asleep during its song.', fluffW:'That round pink singer is Jigglypuff!' },
  { id:52,  name:'Meowth',    type:'normal',   clues:['A cream-coloured cat with a gold coin on its head.','It loves shiny, round objects.','It is famous as a certain trio\'s mascot.'], fluffR:'Meowth! Always after something shiny.', fluffW:'That coin-headed cat is Meowth!' },
  { id:150, name:'Mewtwo',    type:'psychic',  clues:['A powerful Pokémon created in a laboratory.','It bends spoons and minds with its psychic power.','It was cloned from a rare ancient Pokémon.'], fluffR:'Mewtwo?! On my line?! That is extraordinary.', fluffW:'That fierce psychic clone is Mewtwo!' },
  { id:151, name:'Mew',       type:'psychic',  clues:['A tiny pink Pokémon said to be very rare.','It contains the DNA of every Pokémon.','It floats playfully and is hard to catch.'], fluffR:'Mew! The rarest catch of my life!', fluffW:'That playful pink rarity is Mew!' },
  { id:149, name:'Dragonite', type:'dragon',   clues:['A friendly orange dragon with small wings.','Despite its size, it can circle the globe fast.','It is known to rescue sailors lost at sea.'], fluffR:'Dragonite! Powerful, and surprisingly kind.', fluffW:'That gentle orange dragon is Dragonite!' },
  { id:95,  name:'Onix',      type:'rock',     clues:['A giant serpent made of boulders.','It burrows underground at fifty miles an hour.','A rock on its head acts like a compass.'], fluffR:'Onix! A rock snake — Brock\'s favourite.', fluffW:'That boulder serpent is Onix!' },
  { id:74,  name:'Geodude',   type:'rock',     clues:['It looks just like a rock with two arms.','People often trip over it by mistake.','It flexes its arms to show off its strength.'], fluffR:'Geodude! Easy to miss — until it moves.', fluffW:'That rock-with-arms is Geodude!' },
  { id:66,  name:'Machop',    type:'fighting', clues:['A small grey Pokémon with bulging muscles.','It trains constantly to build its strength.','It can lift things many times its own weight.'], fluffR:'Machop! Always working out.', fluffW:'That muscular little fighter is Machop!' },
  { id:16,  name:'Pidgey',    type:'flying',   clues:['A small, common brown bird.','It kicks up sand to blind its foes.','New trainers often catch one first.'], fluffR:'Pidgey! Common, but a loyal first catch.', fluffW:'That little brown bird is Pidgey!' },
  { id:19,  name:'Rattata',   type:'normal',   clues:['A small purple rodent with big front teeth.','Its teeth never stop growing.','It is found almost everywhere.'], fluffR:'Rattata! Quick and everywhere.', fluffW:'Those ever-growing teeth mean Rattata!' },
  { id:37,  name:'Vulpix',    type:'fire',     clues:['A small fox with six curled tails.','Its tails grow and split as it ages.','Warm flames flicker inside its body.'], fluffR:'Vulpix! Six beautiful tails.', fluffW:'That six-tailed fox is Vulpix!' },
  { id:58,  name:'Growlithe', type:'fire',     clues:['A loyal orange-and-black puppy Pokémon.','It bravely defends its trainer and territory.','It has a keen sense of smell.'], fluffR:'Growlithe! Loyal to the very end.', fluffW:'That brave striped pup is Growlithe!' },
  { id:35,  name:'Clefairy',  type:'fairy',    clues:['A pink, star-loving Pokémon.','It is said to gather on moonlit nights.','It bounces in a charming, floaty way.'], fluffR:'Clefairy! Said to come from the moon.', fluffW:'That moonlit pink dancer is Clefairy!' },
  { id:69,  name:'Bellsprout',type:'grass',    clues:['A yellow plant on a thin, bending stem.','Its mouth-like head snaps up bugs.','It sways and bends to dodge attacks.'], fluffR:'Bellsprout! Floppy but quick.', fluffW:'That bending plant is Bellsprout!' },
  { id:132, name:'Ditto',     type:'normal',   clues:['A pink blob that can copy anything.','It transforms into any Pokémon it sees.','When it relaxes, it returns to its blobby form.'], fluffR:'Ditto! Could be anything — but it\'s a blob.', fluffW:'That shape-shifting pink blob is Ditto!' },
];

// Build one identify puzzle for the given tier from MISTY_POKEMON.
// tier 1: 2 clues / 3 choices · tier 2: 2 clues / 4 choices · tier 3: 1 clue / 4 choices.
function _buildMistyPuzzle(tier, excludeIds, clueBonus) {
  excludeIds = excludeIds || [];
  clueBonus  = clueBonus || 0;
  const avail = MISTY_POKEMON.filter(p => !excludeIds.includes(p.id));
  const pool  = avail.length ? avail : MISTY_POKEMON;
  const target = pool[Math.floor(Math.random() * pool.length)];

  // Base clue count by tier, adjusted by angling performance (clueBonus).
  // Floored at 1 so the puzzle is always solvable; capped at all available clues.
  const baseClue    = tier >= 3 ? 1 : 2;
  const clueCount   = Math.max(1, Math.min(target.clues.length, baseClue + clueBonus));
  const choiceCount = tier === 1 ? 3 : 4;

  // Shuffle the target's clues so position never gives the answer away
  const shuffledClues = shuffle([...target.clues]).slice(0, clueCount);

  // Decoys — prefer same-type Pokémon so it tests real knowledge, then fill
  const sameType = shuffle(MISTY_POKEMON.filter(p => p.type === target.type && p.name !== target.name));
  const others   = shuffle(MISTY_POKEMON.filter(p => p.type !== target.type && p.name !== target.name));
  const decoys   = [...sameType, ...others].slice(0, choiceCount - 1).map(p => p.name);
  const choices  = shuffle([target.name, ...decoys]);

  const buffType = ['water','electric','psychic','poison','ice','dragon'].includes(target.type)
    ? target.type : 'water';

  return {
    tier, mode:'identify',
    pokemonName: target.name,
    pokemonId:   target._idFix || target.id,
    buffType,
    clues:       shuffledClues,
    _allClues:   [...target.clues],
    summary:     target.clues[0],
    question:    'Which Pokémon did Misty hook?',
    choices,
    explanation: `${target.name} is a ${target.type}-type Pokémon. ${target.clues.join(' ')}`,
    mistyFluff_right: target.fluffR || `Yes! That's ${target.name}!`,
    mistyFluff_wrong: target.fluffW || `That was ${target.name}!`,
  };
}

const FISHING_BUFF_MAP = {
  water:    { apply: () => { GameState.fishingBuff = { type:'water',    mult:1.3 }; },
              desc:'Water-type moves deal +30% damage next battle!' },
  electric: { apply: () => { GameState.fishingBuff = { type:'electric', mult:1.3 }; },
              desc:'Electric-type moves deal +30% damage next battle!' },
  psychic:  { apply: () => {
                if (!GameState.pendingPlayerEffects) GameState.pendingPlayerEffects = {};
                GameState.pendingPlayerEffects.clarityBuff = true; },
              desc:'Status durations halved next battle! (Psychic clarity)' },
  poison:   { apply: () => {
                if (!GameState.pendingPlayerStatuses) GameState.pendingPlayerStatuses = [];
                GameState.pendingPlayerStatuses.push('opp_poison_start'); },
              desc:'Opponent starts the next battle Poisoned!' },
  ice:      { apply: () => {
                if (!GameState.pendingPlayerEffects) GameState.pendingPlayerEffects = {};
                GameState.pendingPlayerEffects.freezeFirst = true; },
              desc:"Opponent's first move next battle is skipped! (Frozen)" },
  dragon:   { apply: () => {
                if (!GameState.pendingPlayerEffects) GameState.pendingPlayerEffects = {};
                GameState.pendingPlayerEffects.dragonPower = true; },
              desc:'All card costs −1 next battle! (Dragon power)' },
};

const FishingEngine = {
  _isActive:   false,
  _node:       null,
  _puzzle:     null,
  _clueIdx:    0,
  _answered:   false,

  start(node) {
    if (!GameState || !GameState.party) {
      console.warn('FishingEngine.start: no active run — start a game first.');
      return;
    }
    this._node     = node;
    this._isActive = true;
    ActiveEngine.set(this);
    this._answered = false;
    this._clueIdx  = 0;

    const tier = getSkillTier('fishing');
    // Build a generated puzzle, avoiding the last few Pokémon so repeats are rare
    if (!GameState._mistyRecent) GameState._mistyRecent = [];
    this._puzzle = _buildMistyPuzzle(tier, GameState._mistyRecent);
    if (!this._puzzle) { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); return; }
    // Track recent catches — keep the last 12 so they don't recur soon
    GameState._mistyRecent.push(this._puzzle.pokemonId);
    if (GameState._mistyRecent.length > 12) GameState._mistyRecent.shift();

    showScreen('boss');
    BossEngine._isRocket    = false;
    CookingEngine._isActive = false;

    // Use the boss-intro background treatment like other boss-screen mini-games
    const bgEl  = document.querySelector('#screen-boss .battle-bg');
    const bgImg = document.querySelector('#screen-boss .battle-bg-img');
    if (bgEl)  {
      bgEl.classList.add('boss-intro-mode');
      bgEl.style.background = 'linear-gradient(180deg,#aee3f5 0%,#5bb8e0 45%,#2a7aa8 100%)';
    }
    if (bgImg) { bgImg.src = ''; bgImg.style.opacity = '0'; }

    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';
    document.getElementById('boss-party-bar').innerHTML       = '';

    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (trainerImg) trainerImg.src = 'assets/misty.png';
    document.getElementById('dialogue-name').textContent = 'Misty';
    document.getElementById('dialogue-text').textContent = '';

    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) { startBtn.style.display = 'none'; startBtn.textContent = 'Start Fishing! 🎣'; }
    document.getElementById('btn-dialogue-next').style.display = 'none';

    const name = GameState.trainerName || 'Trainer';
    const INTROS = [
      `${name}! Something took the bait — but it's not what I expected! Read my clues carefully and tell me what I hooked!`,
      `${name}! I've been out here all morning and just got a bite. Let me describe what I see — you figure out what it is!`,
      `Oh! ${name}! Perfect timing. Something's on my line right now. Listen carefully — what do you think it is?`,
    ];
    const openLine = INTROS[Math.floor(Math.random() * INTROS.length)];
    typeBossIntro(openLine, 26, () => {
      if (startBtn) startBtn.style.display = '';
    });
  },

  startGame() {
    this._isActive = false;
    ActiveEngine.clear();
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.textContent = 'Battle! ▶';
    document.getElementById('trainer-intro').style.display = 'none';

    // Clear the intro background so it can't bleed into a later boss battle
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) { bgEl.classList.remove('boss-intro-mode'); bgEl.style.background = ''; }

    // Tier 1 (ages 6–7): no angling — straight to a full, generous clue set.
    // Tier 2–3: play the Cast & Reel angling game first; how well you angle
    // decides how many clues you get (great = +1, good = 0, sloppy = −1).
    const tier = getSkillTier('fishing');
    if (tier >= 2) {
      this._playAngling((clueBonus) => {
        this._rebuildPuzzleClues(clueBonus);
        this._showClueStage();
      });
    } else {
      this._rebuildPuzzleClues(1);  // tier 1 gets the most generous clue set
      this._showClueStage();
    }
  },

  // Re-slice the current puzzle's clues based on angling performance, keeping the
  // same target Pokémon and answer choices.
  _rebuildPuzzleClues(clueBonus) {
    const p = this._puzzle;
    if (!p || !p._allClues) return;
    const tier = getSkillTier('fishing');
    const baseClue = tier >= 3 ? 1 : 2;
    const n = Math.max(1, Math.min(p._allClues.length, baseClue + (clueBonus || 0)));
    p.clues = shuffle([...p._allClues]).slice(0, n);
  },

  // ── Cast & Reel angling minigame (tier 2–3 only) ─────────────────────────
  // A marker sweeps a bar with a sweet-spot zone; tap to hook. No fail-out —
  // accuracy maps to a clue bonus. Tier 3 has a smaller/faster zone than tier 2.
  _playAngling(onDone) {
    const tier = getSkillTier('fishing');
    // Switch to the challenge screen — the angling renders into #challenge-coin-visual
    // which lives there, not on #screen-boss.
    showScreen('challenge');
    const sc = document.getElementById('screen-challenge');
    sc.classList.remove(...CHALLENGE_CLASSES);
    sc.classList.add('fishing-active');
    SoundEngine.playBGM('pallet_town_theme.mp3');

    const cv = document.getElementById('challenge-coin-visual');
    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = 'assets/misty.png'; img.style.display = ''; }
    document.getElementById('challenge-badge').textContent = '🎣 Cast & Reel!';
    document.getElementById('challenge-intro').textContent = 'Tap when the marker hits the green zone to hook it!';
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';
    document.getElementById('challenge-question').style.display     = 'none';
    document.getElementById('challenge-answer-btns').innerHTML      = '';

    // Tier-scaled difficulty
    const zoneW   = tier >= 3 ? 22 : 40;     // sweet-spot width (% of bar)
    const bullW   = tier >= 3 ? 8  : 14;     // bullseye width (% of bar)
    const speed   = tier >= 3 ? 1.7 : 1.15;  // sweeps per second
    const zoneL   = 50 - zoneW / 2;          // centered zone
    const bullL   = 50 - bullW / 2;

    cv.style.display = 'block';
    cv.className = 'angling-area';
    cv.innerHTML = `
      <div class="angling-water"></div>
      <div class="angling-bar">
        <div class="angling-zone" style="left:${zoneL}%;width:${zoneW}%"></div>
        <div class="angling-bull" style="left:${bullL}%;width:${bullW}%"></div>
        <div class="angling-marker" id="angling-marker"></div>
      </div>
      <button class="btn-pixel btn-primary angling-hook-btn" id="angling-hook-btn">HOOK! 🎣</button>
      <div class="angling-feedback" id="angling-feedback"></div>`;

    const marker = document.getElementById('angling-marker');
    const btn    = document.getElementById('angling-hook-btn');
    let pos = 0, dir = 1, raf = null, last = performance.now(), done = false;

    const step = (now) => {
      const dt = (now - last) / 1000; last = now;
      pos += dir * speed * 100 * dt;
      if (pos >= 100) { pos = 100; dir = -1; }
      if (pos <= 0)   { pos = 0;   dir =  1; }
      if (marker) marker.style.left = pos + '%';
      if (!done) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const hook = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      btn.disabled = true;
      // Score by where the marker landed
      let bonus, msg, cls;
      if (pos >= bullL && pos <= bullL + bullW) {
        bonus = 1; msg = 'PERFECT CATCH! ⭐'; cls = 'angling-perfect';
        SoundEngine.playCorrect();
      } else if (pos >= zoneL && pos <= zoneL + zoneW) {
        bonus = 0; msg = 'Nice hook!'; cls = 'angling-good';
        SoundEngine.playCorrect();
      } else {
        bonus = -1; msg = 'It thrashed free a bit... murky clues!'; cls = 'angling-sloppy';
      }
      const fb = document.getElementById('angling-feedback');
      if (fb) { fb.textContent = msg; fb.className = `angling-feedback ${cls}`; }
      if (marker) marker.classList.add('angling-marker-stop');
      setTimeout(() => onDone(bonus), 1100);
    };

    btn.addEventListener('click', hook);
  },

  _showClueStage() {
    const p = this._puzzle;

    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = 'assets/misty.png'; img.style.display = ''; }
    document.getElementById('challenge-badge').textContent = '🎣 Misty\'s Mystery Catch';
    document.getElementById('challenge-intro').textContent =
      p.mode === 'weakness' ? 'What type hits it hardest?' :
      p.mode === 'habitat'  ? 'What lives in that location?' :
                              'Which Pokémon did Misty hook?';
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';
    document.getElementById('challenge-question').style.display     = 'none';
    document.getElementById('challenge-answer-btns').innerHTML      = '';
    const _jwd = document.getElementById('jessie-word-display');
    if (_jwd) { _jwd.style.display = 'none'; _jwd.innerHTML = ''; _jwd.className = 'jessie-word-display'; }

    // Fishing rod + water visual
    const cv = document.getElementById('challenge-coin-visual');
    cv.style.display = 'block';
    cv.className     = 'fishing-clue-area';
    cv.innerHTML     = `
      <div class="fishing-rod-area">
        <div class="fishing-water"></div>
        <div class="fishing-bobber" id="fishing-bobber">🎣</div>
      </div>
      <div class="fishing-bubbles-wrap" id="fishing-bubbles-wrap"></div>`;

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.remove(...CHALLENGE_CLASSES);
    document.getElementById('screen-challenge').classList.add('fishing-active');
    SoundEngine.playBGM('pallet_town_theme.mp3');

    this._renderCurrentClue();
  },

  _renderCurrentClue() {
    const p       = this._puzzle;
    const wrap    = document.getElementById('fishing-bubbles-wrap');
    const btnArea = document.getElementById('challenge-answer-btns');
    btnArea.innerHTML = '';

    if (this._clueIdx < p.clues.length) {
      // Bobber dips first
      const bobber = document.getElementById('fishing-bobber');
      if (bobber) {
        bobber.classList.add('bobber-dip');
        setTimeout(() => bobber.classList.remove('bobber-dip'), 600);
      }

      setTimeout(() => {
        const bubble = document.createElement('div');
        bubble.className   = 'fishing-bubble fishing-bubble-float';
        bubble.textContent = '';
        wrap.appendChild(bubble);

        const text = p.clues[this._clueIdx];
        let ci = 0;
        const iv = setInterval(() => {
          bubble.textContent += text[ci++];
          if (ci >= text.length) {
            clearInterval(iv);
            bubble.className = 'fishing-bubble fishing-bubble-shown';
            this._clueIdx++;

            if (this._clueIdx < p.clues.length) {
              const nb = document.createElement('button');
              nb.className   = 'btn-pixel btn-secondary fishing-next-btn';
              nb.textContent = `Next clue ▶ (${this._clueIdx}/${p.clues.length})`;
              nb.onclick     = () => this._renderCurrentClue();
              btnArea.appendChild(nb);
            } else {
              this._showChoices();
            }
          }
        }, 30);
      }, 400);
    } else {
      this._showChoices();
    }
  },

  async _showChoices() {
    const p       = this._puzzle;
    const qEl     = document.getElementById('challenge-question');
    const btnArea = document.getElementById('challenge-answer-btns');
    qEl.textContent   = p.question;
    qEl.style.display = '';
    btnArea.innerHTML = '';

    if (p.mode === 'weakness' || p.mode === 'habitat') {
      const grid = document.createElement('div');
      grid.className = 'fishing-type-grid';
      p.choices.forEach(val => {
        const b = document.createElement('button');
        b.className      = p.mode === 'weakness'
          ? 'challenge-answer-btn fishing-type-btn'
          : 'challenge-answer-btn fishing-habitat-btn';
        b.innerHTML      = p.mode === 'weakness'
          ? `${TYPE_ICONS[val] || ''} <span class="hud-type-badge type-${val}">${val}</span>`
          : `<span class="fishing-habitat-name">${val}</span>`;
        b.dataset.answer = val;
        b.addEventListener('click', () => this._answer(val));
        grid.appendChild(b);
      });
      btnArea.appendChild(grid);
      return;
    }

    // Identify mode — 2×2 sprite card grid
    const cardGrid = document.createElement('div');
    cardGrid.className = 'fishing-card-grid';
    cardGrid.id        = 'fishing-card-grid';

    const cardEls = p.choices.map((name, i) => {
      const card = document.createElement('div');
      card.className   = 'fishing-choice-card';
      card.dataset.name = name;
      card.innerHTML   = `
        <div class="fishing-card-sprite-wrap">
          <div class="fishing-card-silhouette">?</div>
        </div>
        <div class="fishing-card-name">${name}</div>`;
      card.addEventListener('click', () => this._answerPokemon(name));
      cardGrid.appendChild(card);
      return card;
    });
    btnArea.appendChild(cardGrid);

    // Load sprites in parallel — update each card as it arrives
    p.choices.forEach(async (name, i) => {
      try {
        const data = await fetchPoke(name.toLowerCase());
        const url  = data?.sprites?.front_default || getSpriteUrl(data) || '';
        if (url && cardEls[i]) {
          const silEl = cardEls[i].querySelector('.fishing-card-silhouette');
          if (silEl) silEl.innerHTML =
            `<img src="${url}" alt="${name}" class="fishing-card-img"
              onerror="this.onerror=null;this.style.display='none'"/>`;
        }
      } catch(e) { /* stays as ? */ }
    });
  },

  _answerPokemon(chosenName) {
    if (this._answered) return;
    this._answered = true;
    const p       = this._puzzle;
    const isRight = chosenName === p.pokemonName;

    document.querySelectorAll('.fishing-choice-card').forEach(card => {
      card.style.pointerEvents = 'none';
      if (card.dataset.name === p.pokemonName)           card.classList.add('card-correct');
      else if (card.dataset.name === chosenName && !isRight) card.classList.add('card-wrong');
    });

    this._showResult(isRight);
  },

  _answer(chosen) {
    if (this._answered) return;
    this._answered = true;
    const p       = this._puzzle;
    // First entry in choices array is always the correct answer
    const correct = p.choices[0];
    const isRight = chosen === correct;

    document.querySelectorAll('.challenge-answer-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.answer === correct)                  b.classList.add('answer-correct');
      else if (b.dataset.answer === chosen && !isRight)  b.classList.add('answer-wrong');
    });

    this._showResult(isRight);
  },

  _showResult(isRight) {
    const p         = this._puzzle;
    const name      = GameState.trainerName || 'Trainer';
    const goldReward = isRight ? 10 + (GameState.bossesDefeated || 0) * 2 : 3;
    const buffEntry  = FISHING_BUFF_MAP[p.buffType] || FISHING_BUFF_MAP.water;

    if (isRight) { buffEntry.apply(); SoundEngine.playFanfare(); }
    GameState.gold = (GameState.gold || 0) + goldReward;
    saveGame();

    const resultEl = document.getElementById('challenge-result');
    resultEl.className = isRight ? 'challenge-result result-correct' : 'challenge-result result-wrong';
    resultEl.innerHTML = isRight
      ? `✅ <strong>Correct, ${name}!</strong><br>${p.explanation}<br>
         <em>"${p.mistyFluff_right}"</em><br>
         <span class="fishing-buff-notice">🎣 ${buffEntry.desc} +${goldReward}💰</span>`
      : `❌ <strong>It was ${p.pokemonName}!</strong><br>${p.explanation}<br>
         <em>"${p.mistyFluff_wrong}"</em><br>
         <span style="opacity:.7;font-size:.8em">+${goldReward}💰 consolation</span>`;
    resultEl.style.display = 'block';

    this._revealPokemon();
    document.getElementById('challenge-continue-btn').style.display = 'block';
    document.getElementById('challenge-continue-btn').textContent   = 'Continue ▶';
  },

  async _revealPokemon() {
    const p     = this._puzzle;
    const revEl = document.getElementById('jessie-word-display');
    if (!revEl) return;
    revEl.style.display = 'flex';
    revEl.className     = 'fishing-reveal';

    // Set text immediately as fallback — no child divs needed
    revEl.innerHTML = `
      <span class="fishing-reveal-name">${p.pokemonName}</span>
      <span class="fishing-reveal-types" id="fishing-reveal-types"></span>`;

    try {
      const data = await fetchPoke(p.pokemonName.toLowerCase());
      const url  = data?.sprites?.front_default || getSpriteUrl(data) || '';
      const nameEl  = revEl.querySelector('.fishing-reveal-name');
      const typesEl = document.getElementById('fishing-reveal-types');

      if (url && nameEl) {
        nameEl.innerHTML = `<img src="${url}" alt="${p.pokemonName}"
          class="fishing-reveal-sprite" onerror="this.onerror=null;this.style.display='none'"/>
          ${p.pokemonName}`;
      }
      const types = (data?.types || []).map(t => t.type.name);
      if (types.length && typesEl) {
        typesEl.innerHTML = types.map(t =>
          `<span class="hud-type-badge type-${t}">${t}</span>`).join(' ');
      }
    } catch(e) { /* text fallback already shown */ }
  },

  finish() {
    this._isActive = false;
    ActiveEngine.clear();
    document.getElementById('screen-challenge').classList.remove('fishing-active');
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },
};



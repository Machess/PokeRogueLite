const OAK_POKEMON = [
  { id:1,   name:'Bulbasaur',  type:'grass',    color:'green',  wings:false, size:'small' },
  { id:4,   name:'Charmander', type:'fire',     color:'orange', wings:false, size:'small' },
  { id:7,   name:'Squirtle',   type:'water',    color:'blue',   wings:false, size:'small' },
  { id:25,  name:'Pikachu',    type:'electric', color:'yellow', wings:false, size:'small' },
  { id:6,   name:'Charizard',  type:'fire',     color:'orange', wings:true,  size:'big'   },
  { id:9,   name:'Blastoise',  type:'water',    color:'blue',   wings:false, size:'big'   },
  { id:12,  name:'Butterfree', type:'bug',      color:'white',  wings:true,  size:'small' },
  { id:18,  name:'Pidgeot',    type:'flying',   color:'brown',  wings:true,  size:'big'   },
  { id:54,  name:'Psyduck',    type:'water',    color:'yellow', wings:false, size:'small' },
  { id:59,  name:'Arcanine',   type:'fire',     color:'orange', wings:false, size:'big'   },
  { id:143, name:'Snorlax',    type:'normal',   color:'blue',   wings:false, size:'big'   },
  { id:130, name:'Gyarados',   type:'water',    color:'blue',   wings:false, size:'big'   },
  { id:39,  name:'Jigglypuff', type:'normal',   color:'pink',   wings:false, size:'small' },
  { id:152, name:'Chikorita',  type:'grass',    color:'green',  wings:false, size:'small' },
  { id:155, name:'Cyndaquil',  type:'fire',     color:'blue',   wings:false, size:'small' },
  { id:163, name:'Hoothoot',   type:'flying',   color:'brown',  wings:true,  size:'small' },
];

const OAK_RULES = [
  { key:'type',  label:'TYPE',  buckets: [['fire','🔥 Fire'], ['water','💧 Water'], ['grass','🌿 Grass']] },
  { key:'color', label:'COLOUR',buckets: [['blue','🔵 Blue'], ['orange','🟠 Orange'], ['yellow','🟡 Yellow']] },
  { key:'wings', label:'WINGS', buckets: [[true,'🪽 Has wings'], [false,'🚫 No wings']] },
  { key:'size',  label:'SIZE',  buckets: [['big','🐘 Big'], ['small','🐭 Small']] },
];

const OakSortEngine = {
  _isActive:false, _node:null, _round:0, _hits:0, _queue:[], _rule:null,
  _sprites:{}, _timeouts:[],

  async start(node) {
    this._node = node; this._isActive = true; this._round = 0; this._hits = 0; this._timeouts = [];
    ActiveEngine.set(this);
    skillTimerBegin('oak');

    showLoading();
    await Promise.all(OAK_POKEMON.map(async p => {
      const d = await fetchPoke(p.id).catch(() => null);
      this._sprites[p.id] = d ? getSpriteUrl(d) :
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
    }));
    hideLoading();

    showBossIntro({
      gymIndex: 0, portrait: 'prof_oak.png', gameKey: 'oak',
      name: 'Professor Oak', btnLabel: '🔬 Help Sort!',
      introText: "Oh dear, oh dear! My research Pokémon got all mixed up! Help me sort them into the right groups — look carefully at each one as it passes!",
    });
    // Oak portrait fallback if missing — hide rather than show a wrong Pokémon
    const t = document.getElementById('boss-trainer-sprite');
    if (t) t.onerror = () => { t.style.visibility = 'hidden'; };
  },

  startGame() {
    this._isActive = false; ActiveEngine.clear();
    document.getElementById('trainer-intro').style.display = 'none';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');

    // Pick a rule, build a queue of 8 Pokémon that all fit one of its buckets
    this._rule = OAK_RULES[Math.floor(Math.random() * OAK_RULES.length)];
    const bucketVals = this._rule.buckets.map(b => b[0]);
    const eligible   = OAK_POKEMON.filter(p => bucketVals.includes(p[this._rule.key]));
    this._queue      = shuffle(eligible).slice(0, 8);
    this._showRound();
  },

  _showRound() {
    if (this._round >= this._queue.length) { this._finish(); return; }
    this._timeouts.forEach(t => MiniGameSession.clear(t)); this._timeouts = [];

    const tier = Math.min(getSkillTier('oak'), 3);
    const poke = this._queue[this._round];

    const cv = setupChallengeScreen({
      portrait: 'prof_oak.png', badge: `Sort by ${this._rule.label}!`,
      intro: `${this._round + 1}/${this._queue.length} — ${this._hits} sorted right`,
      wrapClass: 'oak-wrap', screenClass: 'oak-active',
    });

    // The conveyor — sprite slides across
    const belt = document.createElement('div');
    belt.className = 'oak-belt';
    const slideMs = Math.max(3500, 7000 - (tier - 1) * 1500 - this._round * 200);
    belt.innerHTML = `
      <img src="${this._sprites[poke.id]}" class="oak-poke pixel-sprite" id="oak-poke"
           style="animation-duration:${slideMs}ms" alt="${poke.name}">
      <div class="oak-poke-name">${poke.name}</div>`;
    const dashboard=document.createElement('div');dashboard.className='oak-lab-dashboard';
    dashboard.innerHTML='<span>FIELD RESEARCH · SORTING STATION</span><span>'+String(this._round+1).padStart(2,'0')+' / '+this._queue.length+'</span>';
    cv.appendChild(dashboard);cv.appendChild(belt);
    const clock=document.createElement('div');clock.className='oak-clock';clock.setAttribute('role','progressbar');clock.setAttribute('aria-label','Time to sort');
    clock.innerHTML='<span style="animation-duration:'+slideMs+'ms"></span>';cv.appendChild(clock);
    const feedback=document.createElement('p');feedback.className='oak-feedback';feedback.setAttribute('aria-live','polite');feedback.textContent='Tap the matching research bay before the Pokémon passes.';cv.appendChild(feedback);

    // Baskets
    const row = document.createElement('div');
    row.className = 'oak-baskets';
    let answered = false;
    this._rule.buckets.forEach(([val, label]) => {
      const b = document.createElement('button');
      b.className = 'oak-basket';
      b.innerHTML = `<span class="oak-basket-symbol">${PixelType.patterns[val]?PixelType.icon(val):''}</span><span class="oak-basket-label">${label.replace(/^[^A-Za-z]+/,'')}</span>`;
      b.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        this._timeouts.forEach(t => MiniGameSession.clear(t)); this._timeouts = [];
        document.getElementById('oak-poke')?.style.setProperty('animation-play-state','paused');
        const correct = poke[this._rule.key] === val;
        b.classList.add(correct ? 'oak-correct' : 'oak-wrong');
        clock.firstChild.style.animationPlayState='paused';
        feedback.textContent=correct?'Correct! Pokémon safely sorted.':'Look for the highlighted bay.';
        if (correct) this._hits++;
        else {
          row.querySelectorAll('.oak-basket').forEach((bb, i) => {
            if (this._rule.buckets[i][0] === poke[this._rule.key]) bb.classList.add('oak-correct');
          });
        }
        this._timeouts.push(MiniGameSession.later(() => { if(document.querySelector('#screen-challenge.oak-active.active')){this._round++; this._showRound();} }, 950));
      });
      row.appendChild(b);
    });
    cv.appendChild(row);

    // Escaped — slid past without sorting
    this._timeouts.push(MiniGameSession.later(() => {
      if (!answered) {
        answered = true;
        feedback.textContent='It passed! The matching bay is highlighted.';
        row.querySelectorAll('.oak-basket').forEach((bb, i) => {
          bb.disabled = true;
          if (this._rule.buckets[i][0] === poke[this._rule.key]) bb.classList.add('oak-correct');
        });
        this._timeouts.push(MiniGameSession.later(() => { if(document.querySelector('#screen-challenge.oak-active.active')){this._round++; this._showRound();} }, 950));
      }
    }, slideMs));
  },

  _finish() {
    const total = this._queue.length;
    const won   = this._hits >= Math.ceil(total * 0.7);
    const gold  = this._hits === total ? 24 : won ? 14 : 6;
    completeChallenge({
      screenClass: 'oak-active', won,
      goldReward: gold,
      score: this._hits, maxScore: total, gameKey: 'oak',
      modalTitle: this._hits === total ? '🔬 Master Researcher!' : won ? '🔬 Well Sorted!' : '🔬 Keep Studying!',
      modalBody: `${this._hits}/${total} sorted correctly\n+${gold}💰`,
    });
  },
};

// Feed Snorlax replaces the old weight/scale activity. Implementation: feed-snorlax.js.

// ─── OFFICER JENNY ENGINE — "Lost & Found Patrol" ───────────────────────────
// A trainer reports a lost Pokémon. Jenny reads you the police report (clues,
// all up-front), and you pick the matching suspect from a sprite line-up.
// Deliberately NOT like Misty: clues are GIVEN, not earned; no timing/angling;
// pure calm deduction. Tier 3 adds a "narrow it down" elimination step.
// Reward: tier-scaled prize money + 5-node Team Rocket patrol shield.

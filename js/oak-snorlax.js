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

// ─── SNORLAX ENGINE — "Snorlax's Weigh Station" — comparison & estimation ────
// Snorlax blocks the road. Balance the scale using real PokéAPI weights.
const SNORLAX_POOL = [143, 25, 1, 4, 7, 39, 52, 54, 95, 130, 131, 6, 9, 59, 78, 115, 128, 149];

const SnorlaxEngine = {
  _isActive:false, _node:null, _round:0, _hits:0,
  _pokes: [],   // { id, name, sprite, kg }

  async start(node) {
    this._node = node; this._isActive = true; this._round = 0; this._hits = 0;
    ActiveEngine.set(this);
    skillTimerBegin('snorlax');

    showLoading();
    const picks = shuffle([...SNORLAX_POOL]).slice(0, 12);
    this._pokes = (await Promise.all(picks.map(async id => {
      const d = await fetchPoke(id).catch(() => null);
      if (!d) return null;
      return { id, name: capitalize(d.name), sprite: getSpriteUrl(d), kg: Math.round(d.weight / 10) };
    }))).filter(Boolean);
    hideLoading();

    showBossIntro({
      gymIndex: 0, portrait: 'sprites/143.png', gameKey: 'snorlax',
      name: 'Snorlax', btnLabel: '⚖️ Wake it up!',
      introText: "Zzz... A wild Snorlax is blocking the road! It will only move for someone who understands WEIGHT. Balance the scale to prove it... zzz...",
    });
    const t = document.getElementById('boss-trainer-sprite');
    if (t) t.onerror = () => { t.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png'; };
  },

  startGame() {
    this._isActive = false; ActiveEngine.clear();
    document.getElementById('trainer-intro').style.display = 'none';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    this._showRound();
  },

  _showRound() {
    if (this._round >= 5 || this._pokes.length < 4) { this._finish(); return; }
    const tier = Math.min(getSkillTier('snorlax'), 3);

    const cv = setupChallengeScreen({
      portrait: 'sprites/143.png', badge: '⚖️ Weigh Station',
      intro: `Round ${this._round + 1}/5 — ${this._hits} balanced`,
      wrapClass: 'snorlax-wrap', screenClass: 'snorlax-active',
    });

    const pool = shuffle([...this._pokes]);

    if (tier === 1) {
      // Which is heavier? Two sprites, tap the heavier one.
      const [a, b] = pool.slice(0, 2);
      const q = document.createElement('div');
      q.className = 'snx-question';
      q.textContent = 'Which Pokémon is HEAVIER?';
      cv.appendChild(q);

      const comparison=document.createElement('div');comparison.className='snx-scale';comparison.id='snx-scale';
      comparison.innerHTML=`<div class="snx-beam" id="snx-beam"><div class="snx-pan snx-pan-left"><img src="${a.sprite}" class="snx-pan-sprite" alt="${a.name}"></div><div class="snx-pan snx-pan-right"><img src="${b.sprite}" class="snx-pan-sprite" alt="${b.name}"></div></div><div class="snx-base"></div><div class="mg-scale-reading">Choose first to reveal the weights</div>`;cv.appendChild(comparison);
      const row = document.createElement('div');
      row.className = 'snx-pick-row';
      [a, b].forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'snx-pick';
        btn.innerHTML = `<img src="${p.sprite}" class="snx-sprite pixel-sprite"><span class="snx-name">${p.name}</span>`;
        btn.addEventListener('click', () => {
          row.querySelectorAll('.snx-pick').forEach(x => x.disabled = true);
          const heavier = a.kg >= b.kg ? a : b;
          const tilt=Math.max(-12,Math.min(12,(b.kg-a.kg)/Math.max(1,a.kg,b.kg)*14));
          comparison.style.setProperty('--scale-tilt',tilt+'deg');comparison.querySelector('.snx-beam').style.transform=`rotate(${tilt}deg)`;
          comparison.querySelector('.mg-scale-reading').textContent=`${a.name}: ${a.kg} kg · ${b.name}: ${b.kg} kg`;
          const correct = p.id === heavier.id;
          btn.classList.add(correct ? 'snx-correct' : 'snx-wrong');
          // Reveal weights — the teaching moment
          row.querySelectorAll('.snx-pick').forEach((x, i) => {
            const pk = [a, b][i];
            x.insertAdjacentHTML('beforeend', `<span class="snx-kg">${pk.kg} kg</span>`);
            if (pk.id === heavier.id) x.classList.add('snx-correct');
          });
        if (correct) this._hits++;
          MiniGameSession.next(() => {this._round++; this._showRound();});
        });
        row.appendChild(btn);
      });
      cv.appendChild(row);
      return;
    }

    // Tier 2/3 — balance the scale: left pan has 1 (T2) or a target weight (T3)
    const left   = pool[0];
    const shelf  = pool.slice(1, 4);
    const tol    = tier === 2 ? 0.5 : 0.25;  // closest wins; tolerance for "balanced" wording
    const q = document.createElement('div');
    q.className = 'snx-question';
    q.textContent = tier === 2
      ? `Pick the Pokémon CLOSEST in weight to ${left.name} (${left.kg} kg)!`
      : `Pick TWO Pokémon that together weigh closest to ${left.kg * 2} kg!`;
    cv.appendChild(q);

    // The scale visual
    const scale = document.createElement('div');
    scale.className = 'snx-scale';
    scale.id = 'snx-scale';
    scale.innerHTML = `
      <div class="snx-beam" id="snx-beam">
        <div class="snx-pan snx-pan-left">
          ${tier === 2 ? `<img src="${left.sprite}" class="snx-pan-sprite pixel-sprite">` : `<span class="snx-pan-kg">${left.kg * 2} kg</span>`}
        </div>
        <div class="snx-pan snx-pan-right" id="snx-pan-right"></div>
      </div>
      <div class="snx-base"></div><div class="mg-scale-reading" id="mg-scale-reading">Target: ${tier === 2 ? left.kg : left.kg * 2} kg · Selected: 0 kg</div>`;
    cv.appendChild(scale);

    const targetKg = tier === 2 ? left.kg : left.kg * 2;
    let pickedIds = [];
    let pickedKg  = 0;
    const need    = tier === 2 ? 1 : 2;

    const row = document.createElement('div');
    row.className = 'snx-shelf';
    shelf.forEach(p => {
      const btn=document.createElement('button');btn.className='snx-pick snx-shelf-item';btn.dataset.id=p.id;
      btn.innerHTML=`<img src="${p.sprite}" class="snx-sprite pixel-sprite"><span class="snx-name">${p.name}</span><span class="snx-kg">${p.kg} kg</span>`;
      btn.onclick=()=>{if(pickedIds.includes(p.id)){pickedIds=pickedIds.filter(id=>id!==p.id);pickedKg-=p.kg;}else{if(pickedIds.length>=need)return;pickedIds.push(p.id);pickedKg+=p.kg;}
        btn.classList.toggle('snx-picked',pickedIds.includes(p.id));btn.setAttribute('aria-pressed',String(pickedIds.includes(p.id)));
        document.getElementById('snx-pan-right').innerHTML=shelf.filter(x=>pickedIds.includes(x.id)).map(x=>`<img src="${x.sprite}" class="snx-pan-sprite pixel-sprite" alt="${x.name}">`).join('');
        document.getElementById('snx-beam').style.transform=`rotate(${Math.max(-12,Math.min(12,(pickedKg-targetKg)/Math.max(1,targetKg)*18))}deg)`;document.getElementById('snx-scale').style.setProperty('--scale-tilt',`${Math.max(-12,Math.min(12,(pickedKg-targetKg)/Math.max(1,targetKg)*18))}deg`);document.getElementById('mg-scale-reading').textContent=`Target: ${targetKg} kg · Selected: ${pickedKg} kg`;submit.disabled=pickedIds.length!==need;};row.appendChild(btn);
    });
    const submit=document.createElement('button');submit.className='btn-pixel btn-primary';submit.textContent='Check the scale';submit.disabled=true;submit.onclick=()=>{
      submit.disabled=true;row.querySelectorAll('button').forEach(b=>b.disabled=true);
      let best=Infinity;for(let i=0;i<shelf.length;i++){if(need===1)best=Math.min(best,Math.abs(shelf[i].kg-targetKg));else for(let j=i+1;j<shelf.length;j++)best=Math.min(best,Math.abs(shelf[i].kg+shelf[j].kg-targetKg));}
      const diff=Math.abs(pickedKg-targetKg),correct=diff<=best+.01;if(correct)this._hits++;
      const verdict=document.createElement('p');verdict.className='snx-verdict';verdict.textContent=`${correct?(diff<.01?'Exactly balanced!':'Closest possible!'):'Try a closer combination next time.'} ${pickedKg} kg / target ${targetKg} kg. Difference: ${diff} kg; best available: ${best} kg.`;cv.appendChild(verdict);MiniGameSession.next(()=>{this._round++;this._showRound();});};cv.appendChild(submit);
    cv.appendChild(row);
  },

  _finish() {
    const won  = this._hits >= 4;
    const gold = this._hits >= 5 ? 26 : won ? 16 : 7;
    completeChallenge({
      screenClass: 'snorlax-active', won,
      goldReward: gold,
      score: this._hits, maxScore: 5, gameKey: 'snorlax',
      modalTitle: this._hits >= 5 ? '⚖️ Perfectly Balanced!' : won ? '⚖️ Snorlax Moves!' : '⚖️ Snorlax Snores On...',
      modalBody: `${this._hits}/5 weighed right\n+${gold}💰` +
        (won ? '\n\nSnorlax lumbers off the road!' : ''),
    });
  },
};

// ─── OFFICER JENNY ENGINE — "Lost & Found Patrol" ───────────────────────────
// A trainer reports a lost Pokémon. Jenny reads you the police report (clues,
// all up-front), and you pick the matching suspect from a sprite line-up.
// Deliberately NOT like Misty: clues are GIVEN, not earned; no timing/angling;
// pure calm deduction. Tier 3 adds a "narrow it down" elimination step.
// Reward: tier-scaled prize money + 5-node Team Rocket patrol shield.

const CLAIR_DRAGONS = [
  { name:'Dratini',   type:'dragon', weakness:'ice',      icon:'🐉', color:'#4a80e0' },
  { name:'Dragonair', type:'dragon', weakness:'ice',      icon:'🌀', color:'#6a60c0' },
  { name:'Seadra',    type:'water',  weakness:'electric', icon:'🌊', color:'#2a80c0' },
  { name:'Gyarados',  type:'water',  weakness:'electric', icon:'🌊', color:'#1a60b0' },
  { name:'Aerodactyl',type:'flying', weakness:'electric', icon:'🦅', color:'#8080c0' },
  { name:'Charizard', type:'fire',   weakness:'water',    icon:'🔥', color:'#d04020' },
];

const ClairEngine = {
  _isActive:false, _node:null, _round:0, _hits:0, _seq:[],

  start(node) {
    this._node = node; this._isActive = true; this._round = 0; this._hits = 0;
    ActiveEngine.set(this);
    // Build 5-dragon sequence
    this._seq = shuffle([...CLAIR_DRAGONS]).slice(0, 5);
    showBossIntro({
      gymIndex: 7, portrait: 'clair.png',
      name: 'Clair', btnLabel: 'Face the Dragons 🐉',
      introText: "Dragons do not wait for you to think. Read the charge and pick the right counter — fast! Study each opponent, then stop its charge with a super-effective counter.",
    });
  },

  startGame() {
    this._isActive = false; ActiveEngine.clear();
    document.getElementById('trainer-intro').style.display = 'none';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    this._showRound();
  },

  _showRound() {
    if(this._round>=5){this._finish();return;}
    const dragon=this._seq[this._round],tier=GameState.difficultyTier||2;
    const ids={Dratini:147,Dragonair:148,Seadra:117,Gyarados:130,Aerodactyl:142,Charizard:6};
    const cv=setupChallengeScreen({portrait:'clair.png',badge:'Dragon Tamer',intro:`Round ${this._round+1}/5 · ${this._hits} counters`,wrapClass:'clair-wrap',screenClass:'clair-active'});
    const charge=document.createElement('div');charge.className='clair-charge';charge.innerHTML=`<img class="mg-hero-pokemon" src="assets/sprites/${ids[dragon.name]}.png" alt="${dragon.name}"><strong>${dragon.name} · ${dragon.type}</strong><p>Choose a type that is super effective against ${dragon.type}.</p>`;cv.appendChild(charge);
    // Uses the same single-type rules as combat; every displayed effective answer is accepted.
    const pool=['ice','electric','water','fire','fighting','rock','dragon','grass'];
    const valid=pool.filter(t=>getTypeMultiplier(t,dragon.type)>1);
    const choices=shuffle([valid[0],...shuffle(pool.filter(t=>t!==valid[0])).slice(0,2)]);
    let answered=false,timer=null;const row=document.createElement('div');row.className='clair-choices';
    const resolve=choice=>{if(answered)return;answered=true;MiniGameSession.clear(timer);const good=valid.includes(choice);if(good)this._hits++;
      row.querySelectorAll('button').forEach(b=>{b.disabled=true;if(valid.includes(b.dataset.type))b.classList.add('clair-correct');});
      charge.classList.add(good?'clair-stopped':'clair-hit');const p=document.createElement('p');p.className='mg-feedback';p.textContent=good?`${choice} deals ×${getTypeMultiplier(choice,dragon.type)} damage. Charge stopped!`:`${choice?choice+' is not super effective.':'Time ran out.'} Try ${valid.join(' or ')} against ${dragon.type}.`;cv.appendChild(p);
      MiniGameSession.next(()=>{this._round++;this._showRound();});};
    choices.forEach(type=>{const b=document.createElement('button');b.className='clair-choice';b.dataset.type=type;b.innerHTML=PixelType.icon(type)+type;b.disabled=true;b.onclick=()=>resolve(type);row.appendChild(b);});cv.appendChild(row);
    const ready=document.createElement('button');ready.className='btn-pixel btn-primary';ready.textContent='Ready — start charge';ready.onclick=()=>{ready.remove();row.querySelectorAll('button').forEach(b=>b.disabled=false);if(tier>1){const bar=document.createElement('progress');bar.className='mg-charge-meter';bar.max=100;bar.value=100;cv.appendChild(bar);const duration=tier===2?6500:5000;let left=duration;const tick=MiniGameSession.every(()=>{left-=100;bar.value=Math.max(0,left/duration*100);},100);timer=MiniGameSession.later(()=>{MiniGameSession.clearEvery(tick);resolve(null);},duration);}};cv.appendChild(ready);
  },

  _finish() {
    const gold = this._hits >= 5 ? 30 : this._hits >= 3 ? 18 : 8;
    completeChallenge({
      screenClass: 'clair-active', won: this._hits >= 4,
      goldReward: gold,
      score: this._hits, maxScore: 5, gameKey: 'clair',
      tokenLabel: this._hits === 5 ? 'Dragon Bane — Dragon/Water +25%!' : null,
      effects: this._hits === 5 ? { clairDragonBane: true } : {},
      modalTitle: this._hits >= 5 ? '🐉 Dragon Tamed!' : '🐉 Dragon Tamer',
      modalBody: `${this._hits}/5 counters correct\n+${gold}💰` +
        (this._hits === 5 ? '\n\n⭐ Dragon Bane — Dragon and Water moves deal +25% next battle!' : ''),
    });
  },
};

// ─── CHUCK ENGINE — "Chuck's Training Clock" — teaches reading clocks ─────────
// Tier 1: whole hours, pick the right clock face from 3.
// Tier 2: half/quarter hours, set the hands with +hour/+5min buttons.
// Tier 3: elapsed-time problems ("started 3:15, lasted 45min — set the end time").

// Render an analog clock as inline SVG. h = 0-11, m = 0-55 (5-min steps).

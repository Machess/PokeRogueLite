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

// ─── WOBBUFFET ENGINE — "Wobbu-Counter!" mini-game ───────────────────────────
// Wobbuffet pops out of Jessie's Poké Ball mid-route.
// Incoming attacks slide in — player must tap the super-effective counter type.
// 5 rounds, faster each round. Part of the TeamRocketChallenge pool.

const WOBBU_ATTACKS = [
  // { incoming type, correct counter type, wrong choices }
  { type:'fire',     counter:'water',    icon:'🔥' },
  { type:'water',    counter:'electric', icon:'💧' },
  { type:'grass',    counter:'fire',     icon:'🌿' },
  { type:'electric', counter:'ground',   icon:'⚡' },
  { type:'ice',      counter:'fire',     icon:'❄️' },
  { type:'psychic',  counter:'bug',      icon:'🔮' },
  { type:'rock',     counter:'water',    icon:'🪨' },
  { type:'ground',   counter:'water',    icon:'🟫' },
  { type:'poison',   counter:'ground',   icon:'☠️' },
  { type:'flying',   counter:'electric', icon:'🌬️' },
  { type:'bug',      counter:'fire',     icon:'🐛' },
  { type:'ghost',    counter:'ghost',    icon:'👻' },
  { type:'dragon',   counter:'ice',      icon:'🐉' },
  { type:'fighting', counter:'psychic',  icon:'🥊' },
  { type:'dark',     counter:'fighting', icon:'🌑' },
  { type:'steel',    counter:'fire',     icon:'⚙️' },
  { type:'normal',   counter:'fighting', icon:'💥' },
];

const WOBBU_WRONG_POOL = ['fire','water','grass','electric','ice','psychic','rock','ground'];

// ─── ROCKET RUNNER ENGINE — "Dig Dash" (endless-runner escape mini-game) ─────
// Team Rocket dug pit-traps across the route. The trainer auto-runs; tap/space
// to jump the holes and grab floating coins. Reach the finish to escape with
// prize money + a Courage buff. Fall in a hole → small penalty, run ends.
const ROCKET_RUNNER_FLUFF = {
  meowth: { name:'Meowth', img:'meowth.png',
    intro:"Meowth! We dug holes allll over this path! Let's see ya get past 'em, twerp!",
    win:"Nyaaa! How'd ya jump all those?! The boss ain't gonna like this...",
    lose:"Hahaha! Right into our hole! That's what ya get!" },
  jessie: { name:'Jessie', img:'jessi.png',
    intro:"Prepare for trouble! These pitfalls will stop you in your tracks!",
    win:"Impossible! You leapt over every single one! Uuurgh!",
    lose:"Hahaha! Down you go! Team Rocket strikes again!" },
  james:  { name:'James', img:'james.png',
    intro:"...and make it double! Mind the holes, they're frightfully deep!",
    win:"Oh dear, they got away again, Jessie...",
    lose:"Ha! Caught in our clever trap! Well, mostly Jessie's trap." },
};

const RUNNER_ART={"forest": {"src": "assets/runner/forest-atlas.png", "rects": [[16, 38, 611, 620], [639, 409, 606, 263], [12, 852, 600, 364], [641, 706, 603, 501]]}, "trainer": {"src": "assets/runner/trainer-atlas.png", "rects": [[75, 75, 296, 328], [543, 76, 267, 329], [955, 76, 290, 327], [1449, 80, 229, 325], [125, 456, 251, 325], [536, 465, 275, 334], [1005, 569, 262, 255], [1451, 471, 233, 353]]}, "jessie": {"src": "assets/jessi.png", "rects": [[252, 2, 396, 747]]}, "james": {"src": "assets/james.png", "rects": [[205, 5, 490, 1496]]}, "meowth": {"src": "assets/meowth.png", "rects": [[207, 32, 245, 306]]}, "arbok": {"src": "assets/sprites/24.png", "rects": [[44, 22, 386, 431]]}, "koffing": {"src": "assets/sprites/109.png", "rects": [[22, 57, 431, 361]]}, "jenny": {"src": "assets/officer_jenny.png", "rects": [[10, 10, 280, 285]]}};
const RocketRunnerEngine = {
  _running:false, _onComplete:null, _raf:null, _images:null,
  async start(node) {
    this._node=node;
    const keys=Object.keys(ROCKET_RUNNER_FLUFF);
    this._fluff=ROCKET_RUNNER_FLUFF[keys[Math.floor(Math.random()*keys.length)]];
    const tier=Math.max(1,Math.min(GameState.difficultyTier||2,3));
    this._cfg={speed:[0,185,215,245][tier],goal:[0,5400,7000,8600][tier],grav:1250,jump:455,tier};
    const cv=setupChallengeScreen({portrait:this._fluff.img,badge:'Dig Dash',intro:this._fluff.intro,wrapClass:'runner-wrap',screenClass:'runner-active',bgm:false});
    const epoch=MiniGameSession.epoch;
    MiniGameSession.guides['runner-active']=['Escape Team Rocket','Tap Jump, the playfield, or Space for a short jump. Hold briefly for a higher jump.','Follow the coins over gaps and Pokémon. Reach Officer Jenny for a Courage bonus.'];
    this._cv=cv;this._finished=false;this._state='ready';this._running=false;
    this._dist=0;this._coinsGot=0;this._goal=this._cfg.goal;this._speed=this._cfg.speed;
    this._y=0;this._vy=0;this._grounded=true;this._elapsed=0;this._obstacles=[];this._coins=[];this._particles=[];
    this._held=false;this._jumpQueued=0;this._landing=0;this._time=0;this._nextObstacle=660;
    this._reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    cv.innerHTML=`<header class="dash-hud"><div class="dash-brand"><b aria-hidden="true">R</b><h2>DIG DASH</h2></div><div class="dash-progress"><span>ESCAPE <small id="runner-dist">0 m</small></span><progress id="dash-progress" max="100" value="0" aria-label="Escape progress"></progress></div><div class="dash-wallet"><i aria-hidden="true"></i><strong id="runner-coins">0</strong></div><button class="dash-pause" aria-label="Pause and help">Ⅱ</button></header><div class="dash-stage" id="runner-field"><canvas id="dash-canvas" aria-label="Jump over pits and Pokémon; follow the coins to Officer Jenny"></canvas><div class="dash-ready"><strong>OUTRUN TEAM ROCKET!</strong><p>Jump the gaps. Follow the coins.<br>Officer Jenny is waiting ahead.</p><button id="runner-start-btn" class="dash-start" disabled>Loading trail…</button><small id="dash-load-note"></small></div><div class="dash-feedback" aria-live="polite"></div></div><footer class="dash-controls"><button id="dash-jump" aria-label="Jump: hold for a higher jump" disabled><span aria-hidden="true">⬆</span> JUMP</button><p>Tap to jump · Hold for a higher jump</p></footer>`;
    this._canvas=cv.querySelector('canvas');this._ctx=this._canvas.getContext('2d',{alpha:false});this._field=cv.querySelector('.dash-stage');
    this._feedback=cv.querySelector('.dash-feedback');
    cv.querySelector('.dash-pause').onclick=()=>{this._release();MiniGameSession.help();};
    this._resizeObserver=new ResizeObserver(()=>this._resize());this._resizeObserver.observe(this._field);
    this._resize();
    const entries=[['valley',{src:'assets/runner/valley.png'}],...Object.entries(RUNNER_ART)];
    const loaded=await Promise.all(entries.map(([key,a])=>new Promise(resolve=>{
      const im=new Image();const timer=setTimeout(()=>resolve([key,null]),6000);
      im.onload=()=>{clearTimeout(timer);resolve([key,im]);};im.onerror=()=>{clearTimeout(timer);resolve([key,null]);};im.src=a.src;
    })));
    if(epoch!==MiniGameSession.epoch||MiniGameSession.key!=='runner-active')return;
    this._images=Object.fromEntries(loaded);this._draw();
    const start=cv.querySelector('#runner-start-btn');start.disabled=false;start.textContent='RUN!';
    if(loaded.some(([,im])=>!im))cv.querySelector('#dash-load-note').textContent='Some artwork is unavailable. The trail is still playable.';
    start.onclick=()=>this._begin();
  },
  _resize(){
    if(!this._field||!this._canvas)return;
    const r=this._field.getBoundingClientRect();if(!r.width||!r.height)return;
    this._w=600;this._h=Math.max(260,r.height/r.width*600);this._ground=this._h*.76;this._trainerHeight=Math.min(116,this._h*.25);
    const dpr=Math.min(devicePixelRatio||1,1.5);
    this._canvas.width=Math.round(r.width*dpr);this._canvas.height=Math.round(r.height*dpr);
    this._ctx.setTransform(this._canvas.width/600,0,0,this._canvas.height/this._h,0,0);
    this._ctx.imageSmoothingEnabled=false;this._draw();
  },
  _begin(){
    if(this._state!=='ready'||MiniGameSession.reasons.size)return;
    this._cv.querySelector('.dash-ready').remove();this._state='run';this._running=true;
    const button=this._cv.querySelector('#dash-jump');button.disabled=false;
    this._held=false;this._keys=new Set();this._pointers=new Set();
    this._down=e=>{
      if(e.type==='keydown'){
        if(!['Space','ArrowUp'].includes(e.code)||e.target?.closest('input,textarea,select'))return;
        e.preventDefault();if(e.repeat)return;this._keys.add(e.code);
      }else{if(e.button!==0)return;e.preventDefault();this._pointers.add(e.pointerId);try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}}
      if(MiniGameSession.reasons.size)return;
      this._held=true;this._jump();button.classList.add('pressed');
    };
    this._up=e=>{if(e.type==='keyup'){this._keys.delete(e.code);}else this._pointers.delete(e.pointerId);if(!this._keys.size&&!this._pointers.size)this._release();};
    this._blur=()=>this._release();
    this._keyActivate=e=>{if(e.detail===0&&this._running){this._jump();this._release();}};
    document.addEventListener('keydown',this._down);document.addEventListener('keyup',this._up);
    [this._field,button].forEach(el=>el.addEventListener('pointerdown',this._down));
    window.addEventListener('pointerup',this._up);window.addEventListener('pointercancel',this._up);window.addEventListener('blur',this._blur);document.addEventListener('visibilitychange',this._blur);
    button.addEventListener('click',this._keyActivate);
    this._lastT=performance.now();SoundEngine.playBGM('teamrocket_battle.mp3');
    this._raf=MiniGameSession.frame(t=>this._loop(t));
  },
  _release(){this._held=false;this._keys?.clear();this._pointers?.clear();this._cv?.querySelector('#dash-jump')?.classList.remove('pressed');},
  _jump(){
    if(!this._running||this._state!=='run'||MiniGameSession.reasons.size)return;
    this._jumpQueued=this._time+.15;
    if(this._grounded){this._jumpQueued=0;this._vy=-this._cfg.jump;this._grounded=false;this._holdTime=0;this._burst(150,this._ground,5,'#e2c58a');SoundEngine.playTap();}
  },
  _loop(now){
    if(!this._running)return;
    // Resuming a paused tab never advances the run by the time spent away.
    const elapsed=(now-this._lastT)/1000;this._lastT=now;
    const dt=elapsed>.15?0:Math.min(Math.max(elapsed,0),.05);
    let left=dt;while(left>0&&this._state==='run'){const step=Math.min(left,1/120);this._step(step);left-=step;}
    if(this._state!=='run')this._elapsed+=dt;
    this._draw();if(this._running)this._raf=MiniGameSession.frame(t=>this._loop(t));
  },
  _step(dt){
    this._time+=dt;this._elapsed+=dt;this._landing=Math.max(0,this._landing-dt);
    if(!this._grounded){
      this._holdTime+=dt;
      const gravity=this._cfg.grav*(this._held&&this._vy<0&&this._holdTime<.20?.42:1);
      this._vy+=gravity*dt;this._y+=this._vy*dt;
      if(this._y>=0){this._y=0;this._vy=0;this._grounded=true;this._landing=.10;this._burst(150,this._ground,6,'#e2c58a');}
    }
    if(this._grounded&&this._jumpQueued>this._time)this._jump();
    this._speed=Math.min(this._cfg.speed+this._elapsed*1.1,this._cfg.speed+35);
    const delta=this._speed*dt;this._dist+=delta;this._nextObstacle-=delta;
    if(this._nextObstacle<=0&&this._dist<this._goal-900){this._spawnObstacle();}
    for(const o of this._obstacles){
      o.x-=delta;
      // Narrow, forgiving body collision box; artwork can be wider than the body.
      const overlap=166>o.x+9&&134<o.x+o.w-9;
      const feet=-this._y;
      if(overlap&&feet<(o.kind==='hole'?12:o.h-12)){
        if(o.kind==='hole'){
          if(o.grace==null)o.grace=this._time+.085;
          if(this._time<o.grace)continue;
        }
        this._fall(o);return;
      }
    }
    this._obstacles=this._obstacles.filter(o=>o.x+o.w>-40);
    this._coins=this._coins.filter(c=>{
      c.x-=delta;
      if(Math.abs(c.x-150)<33&&Math.abs(c.alt-(-this._y+48))<52){this._coinsGot++;this._burst(c.x,this._ground-c.alt,5,'#ffdf72');if(this._time-(this._lastCoinSound||0)>.09){SoundEngine.playTap();this._lastCoinSound=this._time;}return false;}
      return c.x>-30;
    });
    for(const p of this._particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=110*dt;}
    this._particles=this._particles.filter(p=>p.life>0);
    if(this._grounded&&!this._reduced&&this._time-(this._lastDust||0)>.13){this._lastDust=this._time;this._burst(115,this._ground-3,1,'#d6ba87');}
    this._cv.querySelector('#runner-dist').textContent=Math.floor(this._dist/40)+' / '+Math.ceil(this._goal/40)+' m';
    this._cv.querySelector('#runner-coins').textContent=this._coinsGot;
    this._cv.querySelector('#dash-progress').value=Math.min(100,this._dist/this._goal*100);
    if(this._dist>=this._goal)this._win();
  },
  _spawnObstacle(){
    const hole=Math.random()<.58;const tier=this._cfg.tier;
    const o={kind:hole?'hole':'poke',x:640,w:hole?74+tier*8+Math.random()*12:62,h:hole?0:57,art:Math.random()<.5?'koffing':'arbok'};
    this._obstacles.push(o);
    // Separate encounters by a full held jump plus recovery. One hazard per coin arc.
    this._nextObstacle=Math.max(430,this._speed*1.85+o.w)+Math.random()*95;
    const start=o.x-100,span=o.w+190;
    for(let i=0;i<5;i++){const t=i/4;this._coins.push({x:start+t*span,alt:48+Math.sin(t*Math.PI)*95});}
  },
  _burst(x,y,count,color){
    if(this._reduced)return;
    for(let i=0;i<count&&this._particles.length<65;i++)this._particles.push({x,y,vx:-40-Math.random()*55,vy:-20-Math.random()*65,life:.2+Math.random()*.25,color});
  },
  _sprite(key,index,x,feet,height,alpha=1){
    const im=this._images?.[key],r=RUNNER_ART[key]?.rects[index];if(!im||!r)return false;
    const ctx=this._ctx;let scale=height/r[3];
    // Use a common scale across trainer frames, preserving crouch and jump poses.
    if(key==='trainer')scale=height/334;
    ctx.globalAlpha=alpha;ctx.drawImage(im,...r,Math.round(x-r[2]*scale/2),Math.round(feet-r[3]*scale),Math.round(r[2]*scale),Math.round(r[3]*scale));ctx.globalAlpha=1;return true;
  },
  _draw(){
    if(!this._ctx||!this._h)return;
    const c=this._ctx,W=600,H=this._h,g=this._ground,d=this._dist||0;
    c.fillStyle='#79bcd0';c.fillRect(0,0,W,H);
    const bg=this._images?.valley;
    if(bg){const bh=g+50,bw=bh*bg.width/bg.height;const off=this._reduced?0:d*.10%bw;for(let x=-off;x<W;x+=bw)c.drawImage(bg,x,0,bw,bh);}
    else{c.fillStyle='#4d7957';c.fillRect(0,H*.4,W,H*.6);}
    if(this._images?.forest){
      const treeOff=this._reduced?0:d*.24%780;
      for(let x=-treeOff-65;x<W+300;x+=780)this._sprite('forest',0,x,g+8,Math.min(g*.91,440),.92);
      const bushOff=this._reduced?0:d*.46%300;
      for(let x=-bushOff;x<W+300;x+=300)this._sprite('forest',1,x,g+8,85);
    }
    // Soil spans are clipped around actual pits: a hole removes the entire platform.
    const holes=this._obstacles.filter(o=>o.kind==='hole').sort((a,b)=>a.x-b.x);
    c.fillStyle='#152f32';c.fillRect(0,g,W,H-g);
    let cursor=0;const spans=[];
    for(const o of holes){if(o.x>cursor)spans.push([cursor,Math.min(W,o.x)]);cursor=Math.max(cursor,o.x+o.w);}
    if(cursor<W)spans.push([cursor,W]);
    for(const [a,b]of spans){if(b<=0||a>=W||b<=a)continue;c.save();c.beginPath();c.rect(Math.max(0,a),g,Math.min(W,b)-Math.max(0,a),H-g);c.clip();
      c.fillStyle='#60472e';c.fillRect(0,g,W,H-g);c.fillStyle='#769443';c.fillRect(0,g,W,14);
      const im=this._images?.forest,r=RUNNER_ART.forest.rects[2];
      if(im){const tw=300,off=d%tw;for(let x=-off;x<W;x+=tw)c.drawImage(im,r[0]+15,r[1]+10,r[2]-30,r[3]-10,x-2,g,tw+4,Math.max(H-g,145));}
      else{c.fillStyle='#8eb14c';c.fillRect(0,g,W,12);}c.restore();}
    for(const o of holes){
      const shade=c.createLinearGradient(0,g,0,H);shade.addColorStop(0,'#243c39');shade.addColorStop(1,'#081c24');c.fillStyle=shade;c.fillRect(o.x,g,o.w,H-g);
      const im=this._images?.forest,r=RUNNER_ART.forest.rects[2];if(im){c.drawImage(im,r[0]+30,r[1]+35,28,r[3]-35,o.x,g+6,12,H-g);c.drawImage(im,r[0]+r[2]-60,r[1]+35,28,r[3]-35,o.x+o.w-12,g+6,12,H-g);}
      c.fillStyle='#b6c56f';c.fillRect(o.x-5,g,8,6);c.fillRect(o.x+o.w-3,g,8,6);
    }
    const running=this._state==='run',bob=this._reduced?0:Math.sin(this._elapsed*14)*2;
    // Existing Rocket portraits form a stylized pursuit; no extra collision objects.
    const chase=this._state==='fall'?Math.min(60,this._elapsed*60):0;
    this._sprite('jessie',0,22+chase,g-2+bob,81);
    this._sprite('james',0,61+chase,g-2-bob,83);
    this._sprite('meowth',0,98+chase,g+Math.abs(bob),48);
    if(this._dist>this._goal-750){const x=Math.max(475,600-(this._dist-(this._goal-750))*.18);this._sprite('jenny',0,x,g,102);c.fillStyle='#fff4cf';c.fillRect(x+43,g-134,4,134);for(let i=0;i<3;i++)for(let j=0;j<3;j++){c.fillStyle=(i+j)%2?'#14303b':'#fff4cf';c.fillRect(x+47+i*10,g-134+j*10,10,10);}}
    for(const o of this._obstacles)if(o.kind==='poke'){
      this._shadow(o.x+o.w/2,g,o.w*.72,.22);if(!this._sprite(o.art,0,o.x+o.w/2,g,o.h+8)){c.fillStyle='#895caa';c.fillRect(o.x,g-o.h,o.w,o.h);c.fillStyle='#fff2cc';c.fillRect(o.x+13,g-o.h+15,8,8);c.fillRect(o.x+40,g-o.h+15,8,8);}
    }
    for(const coin of this._coins){const x=coin.x,y=g-coin.alt;c.fillStyle='#9e621d';c.fillRect(x-8,y-10,16,20);c.fillRect(x-11,y-6,22,12);c.fillStyle='#f1b736';c.fillRect(x-6,y-12,12,24);c.fillRect(x-9,y-8,18,16);c.fillStyle='#fff19a';c.fillRect(x-5,y-8,3,15);c.fillRect(x-3,y-10,7,3);}
    let frame=this._state==='ready'?7:this._state==='win'?7:!this._grounded?(this._vy<0?4:5):this._landing>0?6:Math.floor(this._elapsed*10)%4;
    const fall=this._state==='fall'?Math.min(180,this._elapsed*this._elapsed*550):0;
    const px=this._state==='win'?150+Math.min(240,this._elapsed*230):150;
    this._shadow(px,g,60*Math.max(.35,1+this._y/250),.28);
    c.save();if(this._state==='fall'){c.translate(px,g+this._y+fall);c.rotate(-Math.min(.5,this._elapsed));if(!this._sprite('trainer',frame,0,0,this._trainerHeight))this._fallbackTrainer(0,0);}else if(!this._sprite('trainer',frame,px,g+this._y,this._trainerHeight))this._fallbackTrainer(px,g+this._y);c.restore();
    for(const p of this._particles){c.globalAlpha=Math.min(1,p.life*4);c.fillStyle=p.color;c.fillRect(p.x,p.y,5,5);}c.globalAlpha=1;
    // Canopy is decorative and confined above the readable jump lane.
    if(this._images?.forest){this._sprite('forest',3,30,Math.min(H*.23,140),190);this._sprite('forest',3,585,Math.min(H*.23,140),170);}
  },
  _shadow(x,y,w,alpha){const c=this._ctx;c.fillStyle=`rgba(13,30,27,${alpha})`;c.beginPath();c.ellipse(x,y+3,w/2,5,0,0,Math.PI*2);c.fill();},
  _fallbackTrainer(x,y){const c=this._ctx;c.fillStyle='#b83235';c.fillRect(x-18,y-91,36,18);c.fillStyle='#f1c18c';c.fillRect(x-14,y-73,28,22);c.fillStyle='#2b5687';c.fillRect(x-20,y-51,40,51);},
  _fall(o){
    if(this._state!=='run')return;
    this._state='fall';this._elapsed=0;this._cleanupInput(false);SoundEngine.stopBGM();
    this._feedback.textContent=o.kind==='hole'?'Mind the gap!':'Watch out!';
    MiniGameSession.later(()=>this._finish(false),850);
  },
  _win(){
    if(this._state!=='run')return;
    this._state='win';this._elapsed=0;this._cleanupInput(false);SoundEngine.stopBGM();this._feedback.textContent='YOU ESCAPED!';
    MiniGameSession.later(()=>this._finish(true),1300);
  },
  _cleanupInput(disconnect=true){
    this._release();
    document.removeEventListener('keydown',this._down);document.removeEventListener('keyup',this._up);
    this._field?.removeEventListener('pointerdown',this._down);
    const b=this._cv?.querySelector('#dash-jump');b?.removeEventListener('pointerdown',this._down);b?.removeEventListener('click',this._keyActivate);if(b)b.disabled=true;
    window.removeEventListener('pointerup',this._up);window.removeEventListener('pointercancel',this._up);window.removeEventListener('blur',this._blur);document.removeEventListener('visibilitychange',this._blur);
    if(disconnect){this._resizeObserver?.disconnect();SoundEngine.stopBGM();}
  },
  _finish(escaped) {
    if(this._finished)return;this._finished=true;this._running=false;MiniGameSession.cancelFrame(this._raf);this._cleanupInput();
    const tier = Math.min(GameState.difficultyTier || 2, 3);
    const distM = Math.floor(this._dist / 40);
    const baseGold = { 1: 8, 2: 12, 3: 16 }[tier];

    let gold, penaltyMsg = '';
    if (escaped) {
      // Prize money scales with distance + coins collected (coin bonus capped
      // so the now-plentiful coins reward skill without ballooning the economy)
      gold = baseGold + Math.min(this._coinsGot, 30) + Math.floor(distM / 25);
      // Courage buff — +10% damage next battle (its own effect flag so the
      // battle log credits Courage, not Surge's briefing)
      GameState.pendingPlayerEffects = GameState.pendingPlayerEffects || {};
      GameState.pendingPlayerEffects.courageBonus = 1.10;
    } else {
      // Small penalty: lose a little gold + HP, run ends
      gold = Math.max(2, this._coinsGot * 2);
      const lead = GameState.party[GameState.activePokemonIndex];
      if (lead) lead.hp = Math.max(1, lead.hp - Math.ceil(lead.maxHp * 0.12));
      const lostGold = Math.min(GameState.gold || 0, 5);
      GameState.gold = (GameState.gold || 0) - lostGold;
      penaltyMsg = `\n\nTeam Rocket caught up! −${lostGold}💰 and your lead Pokémon got a little hurt.`;
    }
    GameState.gold = (GameState.gold || 0) + gold;
    saveGame();

    // Clean up the screen
    const sc = document.getElementById('screen-challenge');
    if (sc) sc.classList.remove('runner-active');
    const cv = document.getElementById('challenge-coin-visual');
    if (cv) { cv.innerHTML = ''; cv.className = 'challenge-coin-visual'; }

    const title = escaped ? '🏃 Escaped!' : '💢 Tripped Up!';
    const body  = escaped
      ? `You dashed ${distM}m and grabbed ${this._coinsGot} coins!\n+${gold}💰\n\n⭐ Courage! +10% damage in your next battle!\n\n"${this._fluff.win}"`
      : `You made it ${distM}m before falling.\n+${gold}💰${penaltyMsg}\n\n"${this._fluff.lose}"`;

    showModal(title, body, () => {
      showScreen('map');
      MapEngine.renderParty();
      if (this._onComplete) { const cb = this._onComplete; this._onComplete = null; cb(); }
    });
  },
};


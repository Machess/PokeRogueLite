/* Speed base stats: PokeAPI data/v2/csv/pokemon_stats.csv, stat_id 6.
   https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/pokemon_stats.csv
   Height and weight come from the game's bundled OFFLINE_POKEMON data. */
const ROCKET_RESCUE_SPEED={1:45,4:65,7:43,10:45,12:70,16:56,18:101,25:90,26:110,39:20,50:95,51:120};
const RocketProtection={
 total(){return GameState.stats?.totalNodesCompleted||0;},
 remaining(){return Math.max(0,(GameState.rocketSafeUntil||0)-this.total());},
 active(completed=false){const until=GameState.rocketSafeUntil||0;return until>0&&(completed?this.total()<=until:this.total()<until);},
 grant(){GameState.rocketSafeUntil=Math.max(GameState.rocketSafeUntil||0,this.total()+3);GameState.nodesSinceRocket=0;}
};
const RocketRescue={
 metrics:{height:{title:'size',unit:'cm',top:'tallest',order:'tallest → shortest'},weight:{title:'weight',unit:'kg',top:'heaviest',order:'heaviest → lightest'},speed:{title:'speed',unit:'Speed',top:'fastest',order:'fastest → slowest'}},
 begin(won,{distM,coins,tier,nodeIdx,fluff}){
  if(GameState.rocketAftermath){this.show();return;}
  SaveManager.complete();
  const index=Math.max(0,Math.min(GameState.activePokemonIndex||0,GameState.party.length-1));
  const gold=won?[0,8,12,16][tier]+Math.min(coins,30)+Math.floor(distM/25):Math.min(coins,30);
  GameState.gold=(GameState.gold||0)+gold;
  if(won){GameState.pendingPlayerEffects=GameState.pendingPlayerEffects||{};GameState.pendingPlayerEffects.courageBonus=1.10;RocketProtection.grant();}
  else GameState.party[index].rocketCaptured=true;
  GameState.rocketAftermath={phase:won?'escaped':'caught',step:0,gold,coins,distM,tier,nodeIdx,needsComplete:!GameState.completedNodes.includes(nodeIdx),partyIndex:index,pokemonId:GameState.party[index].id,fluffName:fluff?.name||'Meowth',quote:won?fluff?.win:fluff?.lose};
  saveGame(true);this.show();
 },
 captive(){const a=GameState.rocketAftermath;return GameState.party[a.partyIndex]||GameState.party.find(p=>p.id===a.pokemonId)||GameState.party[0];},
 makePuzzle(metric){
  const a=GameState.rocketAftermath,tier=a.tier;
  a.metric=metric||['height','weight','speed'][Math.floor(Math.random()*3)];
  let candidates=Object.keys(ROCKET_RESCUE_SPEED).map(Number).map(id=>{
   const p=OFFLINE_POKEMON[id],value=a.metric==='height'?p.height*10:a.metric==='weight'?p.weight/10:ROCKET_RESCUE_SPEED[id];
   return {id,name:capitalize(p.name),value};
  });
  if(tier===1&&a.metric==='weight')candidates=candidates.filter(p=>Number.isInteger(p.value));
  candidates.sort((a,b)=>a.value-b.value);candidates=candidates.filter((p,i)=>!i||p.value!==candidates[i-1].value);
  const count=tier+2;let picked;
  if(tier===1)picked=[candidates[0],candidates[Math.floor(candidates.length/2)],candidates.at(-1)];
  else if(tier===3){const start=Math.floor(Math.random()*(candidates.length-count+1));picked=candidates.slice(start,start+count);}
  else picked=shuffle(candidates).slice(0,count);
  a.choices=shuffle(picked);a.order=[];a.phase='rescue';a.feedback='';saveGame(true);
 },
 show(){
  const a=GameState.rocketAftermath;if(!a)return;
  const cv=setupChallengeScreen({portrait:a.phase==='escaped'?'officer_jenny.png':'meowth.png',badge:'Rocket Balloon Rescue',intro:'',wrapClass:'rocket-rescue-wrap',screenClass:'rocket-rescue-active',bgm:false});
  document.getElementById('mg-quit-btn').style.display='none';
  MiniGameSession.guides['rocket-rescue-active']=['Bring your Pokémon home','Read the measurements. Tap Pokémon in the requested order. Tap again to undo a choice.','There is no timer. You can retry until your Pokémon is safe.'];
  const p=this.captive();
  cv.innerHTML='<header class="rescue-heading"><span>TEAM ROCKET</span><h2></h2></header><div class="balloon-scene"></div><section class="rescue-body" aria-live="polite"></section><footer class="rescue-actions"></footer>';
  const title=cv.querySelector('h2'),scene=cv.querySelector('.balloon-scene'),body=cv.querySelector('.rescue-body'),actions=cv.querySelector('.rescue-actions');
  if(a.phase==='escaped'){
   title.textContent='You escaped!';scene.classList.add('rescue-safe');scene.innerHTML=MiniGameScenes.sprite('assets/officer_jenny.png','rescue-jenny','Officer Jenny');
   body.innerHTML=a.step===0?'<h3>Officer Jenny</h3><p>“You made it! I’ll patrol the next three stops. Team Rocket won’t bother you there.”</p>':`<h3>Escape rewards</h3><p>${a.distM} m travelled · ${a.coins} coins collected</p><strong class="rescue-prize">+${a.gold} coins</strong><p>Courage: +10% damage in your next battle.</p><p class="rescue-shield">No Team Rocket for the next 3 nodes.</p>`;
   this.button(actions,a.step===0?'See rewards':'Continue adventure',()=>{if(a.step===0){a.step=1;saveGame(true);this.show();}else this.finish();});
   return;
  }
  scene.innerHTML=MiniGameScenes.sprite('assets/jessi.png','balloon-jessie','Jessie')+MiniGameScenes.sprite('assets/james.png','balloon-james','James')+`<div class="balloon-cage ${a.phase==='rescued'?'cage-open':''}">${MiniGameScenes.sprite('assets/sprites/'+p.id+'.png','captive-pokemon',p.name)}<span>${a.phase==='rescued'?'SAFE!':p.name}</span></div>`;
  if(a.phase==='caught'){
   title.textContent='Team Rocket caught up!';body.innerHTML='<h3>Meowth</h3><p></p><p>“Beat our balloon challenge and we’ll let your partner go!”</p>';body.querySelector('p').textContent=`${p.name} was caught in Team Rocket’s net when you hit the obstacle. Let’s bring them home!`;
   this.button(actions,'Rescue '+p.name,()=>{this.makePuzzle();this.show();});return;
  }
  if(a.phase==='rescued'){
   title.textContent=p.name+' is safe!';body.innerHTML='<h3>Jessie</h3><p>“You got it right! Fine, take your Pokémon. Team Rocket is blasting off again!”</p><p class="rescue-prize"></p>';body.querySelector('.rescue-prize').textContent=p.name+' rejoined you. '+(a.gold?`You kept ${a.gold} collected coins.`:'');
   this.button(actions,'Continue adventure',()=>this.finish());return;
  }
  const m=this.metrics[a.metric];title.textContent='The '+m.title+' challenge';
  body.innerHTML=`<p class="rescue-task">${a.tier===1?'Tap the '+m.top+' Pokémon.':'Tap in order: '+m.order+'.'}</p><div class="rescue-choices" data-count="${a.choices.length}"></div><p class="rescue-feedback"></p>`;
  const grid=body.querySelector('.rescue-choices'),max=Math.max(...a.choices.map(p=>p.value));
  a.choices.forEach(p=>{const b=document.createElement('button');b.className='rescue-choice';b.dataset.id=p.id;b.setAttribute('aria-label',`${p.name}, ${p.value} ${m.unit}`);const rank=a.order.indexOf(p.id);
   b.innerHTML=MiniGameScenes.sprite('assets/sprites/'+p.id+'.png','rescue-choice-pokemon',p.name)+`<strong>${p.name}</strong><span>${p.value} ${m.unit}</span><i class="rescue-rank">${rank>=0?rank+1:'+'}</i>`+(a.tier===1?`<meter min="0" max="${max}" value="${p.value}" aria-label="${m.title}"></meter>`:'');
   b.classList.toggle('picked',rank>=0);b.setAttribute('aria-pressed',rank>=0?'true':'false');b.onclick=()=>{if(a.phase!=='rescue')return;const i=a.order.indexOf(p.id);if(i>=0)a.order.splice(i,1);else if(a.tier===1)a.order=[p.id];else a.order.push(p.id);a.feedback='';saveGame(true);this.show();};grid.appendChild(b);
  });
  body.querySelector('.rescue-feedback').textContent=a.feedback||(a.tier===1?'Compare the bars and numbers.':`${a.order.length}/${a.choices.length} placed · Tap a selected card to undo.`);
  this.button(actions,'Reset order',()=>{a.order=[];a.feedback='';saveGame(true);this.show();});
  this.button(actions,'Check and rescue',()=>this.check(),a.order.length!==(a.tier===1?1:a.choices.length));
 },
 button(host,label,fn,disabled=false){const b=document.createElement('button');b.className='btn-pixel btn-primary';b.textContent=label;b.disabled=disabled;b.onclick=fn;host.appendChild(b);},
 check(){
  const a=GameState.rocketAftermath;if(!a||a.phase!=='rescue')return;
  const correct=[...a.choices].sort((a,b)=>b.value-a.value).map(p=>p.id),need=a.tier===1?1:correct.length;
  if(a.order.length!==need)return;
  if(a.order.every((id,i)=>id===correct[i])){a.phase='rescued';this.captive().rocketCaptured=false;SoundEngine.playCorrect();}
  else a.feedback=`Not quite. Start with the biggest ${this.metrics[a.metric].title==='size'?'height':this.metrics[a.metric].title} number. Tap a card to change your order and try again.`;
  saveGame(true);this.show();
 },
 finish(){
  const a=GameState.rocketAftermath;if(!a||!['escaped','rescued'].includes(a.phase))return;
  this.captive().rocketCaptured=false;delete GameState.rocketAftermath;
  const callback=RocketRunnerEngine._onComplete;RocketRunnerEngine._onComplete=null;TeamRocketChallenge._onComplete=null;
  if(a.needsComplete&&GameState.map.some(n=>n.idx===a.nodeIdx))MapEngine.completeNode(a.nodeIdx);
  saveGame(true);if(callback)callback();else MapEngine.show();
 }
};

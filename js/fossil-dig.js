/* Saved extra discovery; does not complete or replace a normal route node. */
const FossilDig={
 labels:['Top left','Top middle','Top right','Middle left','Centre','Middle right','Bottom left','Bottom middle','Bottom right'],
 treasures:{mineral:{name:'Shimmering mineral',price:12,color:'#7ed6cc'},crystal:{name:'Rare crystal',price:25,color:'#b8a2ef'},nugget:{name:'Gold nugget',price:40,color:'#f3ce68'}},
 schedule(state){
  if(state.fossilScheduled)return;state.fossilScheduled=true;
  if((GameState.bossesDefeated||0)%2)return;
  const eligible=state.events.find(e=>e.status==='pending'&&!['owner','backpack','scarf','charm'].includes(e.kind));
  if(eligible)eligible.kind='fossil';
  else if(state.events.length<2&&Exploration.progress()<8)state.events.push({id:state.events.length,kind:'fossil',at:Math.max(2,Exploration.progress()+1),status:'pending'});
 },
 event(){return GameState.exploration?.events.find(e=>e.id===GameState.fossilDig?.eventId&&e.kind==='fossil');},
 save(){SaveManager.nodeCheckpoint=null;GameState.resume={kind:'fossil-dig'};saveGame(true);},
 begin(e){
  if(!GameState.fossilDig){
   const tier=Math.max(1,Math.min(3,GameState.difficultyTier||2)),length=tier===1?3:tier===2?4:5+Math.floor(Math.random()*2),r=Math.random(),reward=r<.5?'mineral':r<.8?'crystal':r<.9?'nugget':'pokemon';
   const f=Math.random(),pokemonId=f<.45?138:f<.9?140:142;
   GameState.fossilDig={eventId:e.id,tier,sequences:Array.from({length:2},()=>Array.from({length},()=>Math.floor(Math.random()*9))),layer:0,step:0,phase:'offer',reward,pokemonId,awarded:false,hits:[],mistakes:0};
  }
  this.save();this.show();
 },
 icon(id){const t=this.treasures[id];return `<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="${t.color}" stroke="#263e4c" stroke-width="4" d="M20 5H43L59 30L44 58H17L5 34Z"/><path fill="none" stroke="#fff1c6" stroke-width="3" d="M20 5L25 31L17 58M43 5L38 32L44 58M5 34L25 31L38 32L59 30"/></svg>`;},
 gridIcon(pos){return '<span class="dig-mini-grid" aria-hidden="true">'+Array.from({length:9},(_,i)=>`<i class="${i===pos?'marked':''}"></i>`).join('')+'</span>';},
 show(){
  const s=GameState.fossilDig;if(!s)return;
  if(s.phase==='catch'){CatchEngine.start(null,'rare',s.pokemonId);return;}
  const cv=setupChallengeScreen({portrait:'assets/fossil/archeologist.png',badge:'Fossil Dig',wrapClass:'dig-wrap',screenClass:'fossil-active'});
  document.getElementById('mg-rules-chip').style.display='none';document.getElementById('mg-quit-btn').onclick=()=>showModal('Leave the dig?', 'Your excavation is saved. Return whenever you continue this adventure.',()=>{this.save();Game.goToMenu();},true);
  cv.innerHTML='<header class="dig-header"><h2>FOSSIL DIG</h2><div class="dig-guide"><div class="dig-arch"><img src="assets/fossil/archeologist.png" alt="Archaeologist"></div><p id="dig-dialogue" role="status"></p></div></header><div class="dig-status"></div><div class="dig-stage"><img class="dig-rock" src="assets/fossil/rock.png" alt="A fossil boulder"><div class="dig-cracks" aria-hidden="true"></div><div class="dig-targets" role="group" aria-label="Rock strike positions"></div><span class="dig-pickaxe" aria-hidden="true"><svg viewBox="0 0 64 64"><path stroke="#a37849" stroke-width="9" d="M12 56L49 10"/><path fill="#cde2db" stroke="#283f49" stroke-width="3" d="M15 8L43 4L61 24L42 16L14 20Z"/></svg></span></div><section class="dig-dock"><h3></h3><div class="dig-sequence"></div><div class="dig-actions"></div><p class="dig-footnote"></p></section>';
  this.host=cv;const msg=cv.querySelector('#dig-dialogue'),actions=cv.querySelector('.dig-actions');
  if(s.phase==='offer'){
   msg.textContent='I found a fossil rock! Tap the marked spots in order to uncover what is inside.';cv.querySelector('h3').textContent='A detour to the dig site';cv.querySelector('.dig-footnote').textContent='Two layers · No timer · Treasure or a fossil encounter';
   this.button(actions,'Start digging',()=>{s.phase='playing';this.save();this.show();this.replay();},'assets/fossil/dig.svg');this.button(actions,'Follow the path',()=>this.close());return;
  }
  if(s.phase==='reward'||s.phase==='restoring'||s.phase==='catch-result'){
   this.result(cv,s);return;
  }
  msg.textContent=s.tier===1?'Tap the glowing spot. Follow the sequence!':s.tier===2?'Follow the positions shown below. Tap each in order.':'Watch the sequence, then repeat it. Replay whenever you like.';
  cv.querySelector('h3').textContent='Follow the sequence';cv.querySelector('.dig-footnote').textContent='No timer. A mistake keeps your completed hits.';
  this.button(actions,'Replay sequence',()=>this.replay());this._watching=false;this._locked=false;
  for(let i=0;i<9;i++){const b=document.createElement('button');b.className='dig-target';b.dataset.pos=i;b.setAttribute('aria-label',this.labels[i]);b.innerHTML='<span aria-hidden="true">'+(i+1)+'</span>';b.onclick=()=>this.hit(i);cv.querySelector('.dig-targets').appendChild(b);}
  this.paint();
  if(s.phase==='layer-done')this.layerButton();
 },
 button(host,label,fn,icon){const b=document.createElement('button');b.className='btn-pixel btn-primary';if(icon){const im=document.createElement('img');im.src=icon;im.alt='';b.appendChild(im);}b.appendChild(document.createTextNode(label));b.onclick=fn;host.appendChild(b);return b;},
 paint(){const s=GameState.fossilDig,cv=this.host,seq=s.sequences[s.layer];cv.querySelector('.dig-status').textContent=`Layer ${s.layer+1} / 2 · ${this._watching?'Watch…':s.phase==='layer-done'?'Layer cleared!':'Your turn · '+(s.step+1)+' / '+seq.length}`;
  cv.querySelector('.dig-sequence').innerHTML=seq.map((pos,i)=>`<div class="dig-step ${i<s.step?'done':i===s.step?'current':''}"><b>${i+1}${i<s.step?' ✓':''}</b>${s.tier<3||this._watching?this.gridIcon(pos):'<span class="dig-hidden">?</span>'}<small>${s.tier<3||this._watching?this.labels[pos]:'Remember'}</small></div>`).join('');
  cv.querySelectorAll('.dig-target').forEach((b,i)=>{b.disabled=this._watching||s.phase!=='playing';b.classList.toggle('lit',!this._watching&&s.phase==='playing'&&s.tier===1&&i===seq[s.step]);});
  cv.querySelector('.dig-rock').style.setProperty('--dig-progress',(s.layer*seq.length+s.step)/(seq.length*2));
  cv.querySelector('.dig-cracks').innerHTML=s.hits.map(pos=>`<i style="left:${19+(pos%3)*29}%;top:${15+Math.floor(pos/3)*29}%"></i>`).join('');
 },
 replay(){
  const s=GameState.fossilDig;if(!s||s.phase!=='playing'||this._watching||this._locked||MiniGameSession.reasons.size)return;
  this._watching=true;this.paint();const seq=s.sequences[s.layer],cv=this.host;let t=0;
  seq.forEach((pos,i)=>{MiniGameSession.later(()=>{cv.querySelectorAll('.dig-target').forEach(b=>b.classList.remove('lit'));cv.querySelector(`[data-pos="${pos}"]`).classList.add('lit');cv.querySelector('#dig-dialogue').textContent=`${i+1}. ${this.labels[pos]}`;},t);t+=900;MiniGameSession.later(()=>cv.querySelectorAll('.dig-target').forEach(b=>b.classList.remove('lit')),t-160);});
  MiniGameSession.later(()=>{this._watching=false;this.paint();cv.querySelector('#dig-dialogue').textContent='Your turn! Continue from step '+(s.step+1)+'.';},t);
 },
 hit(pos){
  const s=GameState.fossilDig;if(!s||s.phase!=='playing'||this._watching||this._locked||MiniGameSession.reasons.size)return;
  const target=s.sequences[s.layer][s.step],cv=this.host;
  if(pos!==target){s.mistakes++;cv.querySelector('#dig-dialogue').textContent='A dull knock… try that spot again. Your completed hits are safe.';this.save();return;}
  this._locked=true;s.hits.push(pos);s.step++;SoundEngine.playCorrect();const pick=cv.querySelector('.dig-pickaxe');pick.style.left=(18+(pos%3)*29)+'%';pick.style.top=(12+Math.floor(pos/3)*29)+'%';pick.classList.remove('strike');void pick.offsetWidth;pick.classList.add('strike');
  if(s.step===s.sequences[s.layer].length)s.phase='layer-done';this.save();this.paint();cv.querySelector('#dig-dialogue').textContent='Nice strike! The rock is opening.';
  MiniGameSession.later(()=>{this._locked=false;if(s.phase==='layer-done')this.layerButton();},400);
 },
 layerButton(){const actions=this.host.querySelector('.dig-actions');actions.replaceChildren();this.button(actions,GameState.fossilDig.layer===0?'Brush away the first layer':'Reveal your discovery',()=>{const s=GameState.fossilDig;if(s.phase!=='layer-done')return;if(s.layer===0){s.layer=1;s.step=0;s.phase='playing';this.save();this.show();this.replay();}else this.reveal();});},
 reveal(){const s=GameState.fossilDig;if(s.phase!=='layer-done'||s.layer!==1)return;
  if(!s.awarded){const id=s.reward==='pokemon'?'mineral':s.reward;GameState.treasures=GameState.treasures||{};GameState.treasures[id]=(GameState.treasures[id]||0)+1;s.awarded=true;}
  s.phase='reward';this.save();this.show();SoundEngine.playFanfare();
 },
 result(cv,s){
  const stage=cv.querySelector('.dig-stage');stage.classList.add('dig-result-stage');stage.replaceChildren();const msg=cv.querySelector('#dig-dialogue'),actions=cv.querySelector('.dig-actions');
  if(s.phase==='reward'||s.phase==='restoring'){
   const fossil=s.reward==='pokemon',t=this.treasures[fossil?'mineral':s.reward];stage.innerHTML=fossil?`<img class="dig-reward-pokemon" src="assets/sprites/${s.pokemonId}.png" alt="${capitalize(OFFLINE_POKEMON[s.pokemonId].name)}">`:this.icon(s.reward);
   msg.textContent=fossil?'An ancient fossil! My restoration kit can bring this Pokémon back. Get a Poké Ball ready!':'Beautiful work! Keep this treasure and sell it at the next shop.';
   cv.querySelector('h3').textContent=fossil?'A fossil Pokémon is awakening!':t.name;cv.querySelector('.dig-footnote').textContent=`${t.name} saved in your treasure bag · Shop value: ${t.price} coins`;
   if(s.phase==='restoring'){stage.classList.add('dig-restoring');msg.textContent='Restoring the ancient fossil…';this.button(actions,'Restoring…',()=>{}).disabled=true;MiniGameSession.later(()=>{s.phase='catch';this.save();this.show();},900);}else this.button(actions,fossil?'Restore & catch':'Continue adventure',()=>{if(fossil){s.phase='restoring';this.save();this.show();}else this.close();});
  }else{
   const c=s.capture;stage.innerHTML=`<img class="dig-reward-pokemon" src="assets/sprites/${s.pokemonId}.png" alt="Fossil Pokémon">`;
   msg.textContent=c.caught?c.added?'Your fossil Pokémon joined your team!':'Caught! Choose a partner to release, or let your new friend go.':'It slipped away! You still keep your shimmering mineral.';
   cv.querySelector('h3').textContent=c.caught?'Fossil discovery complete!':'Your treasure is safe';cv.querySelector('.dig-footnote').textContent='Shimmering mineral · Sell for 12 coins at the shop.';
   if(c.caught&&!c.added){const row=document.createElement('div');row.className='dig-release';cv.querySelector('.dig-sequence').appendChild(row);GameState.party.forEach((p,i)=>{this.button(row,'Release '+p.name,()=>showModal('Release '+p.name+'?', 'Replace this party member with '+c.poke.name+'?',()=>{if(c.added)return;GameState.party.splice(i,1,c.poke);GameState.activePokemonIndex=0;GameState.deck=GameState.party[0].deck;c.added=true;GameState.stats.pokemonCaught=(GameState.stats.pokemonCaught||0)+1;this.save();this.show();},true));});}
   this.button(actions,c.caught&&!c.added?'Let it go & continue':'Continue adventure',()=>this.close());
  }
 },
 captureOutcome(caught,data){const s=GameState.fossilDig;if(!s||s.capture)return;s.capture={caught,added:false};
  if(caught){const type=DUAL_TYPE_OVERRIDES[data.id]||data.types[0].type.name,p=makePokemon(data.id,5+(GameState.bossesDefeated||0)*5,getSpriteUrl(data),capitalize(data.name),type);s.capture.poke=p;registerPokedex(data.id,p.name,p.spriteUrl,true,type);if(GameState.party.length<6){GameState.party.push(p);s.capture.added=true;GameState.stats.pokemonCaught=(GameState.stats.pokemonCaught||0)+1;}}
  s.phase='catch-result';this.save();
 },
 close(){const s=GameState.fossilDig;if(!s)return;const e=this.event();if(e)e.status='done';delete GameState.fossilDig;CatchEngine._fossil=false;SaveManager.complete();MiniGameSession.stop();SoundEngine.stopBGM();saveGame(true);MapEngine._showNav();},
 renderSales(grid){const counts=GameState.treasures||{};for(const [id,t]of Object.entries(this.treasures)){const n=counts[id]||0;const el=document.createElement('article');el.className='shop-item dig-sale';el.innerHTML=`<div class="shop-item-icon">${this.icon(id)}</div><div class="shop-item-name">${t.name}</div><p class="shop-item-desc">Owned: ${n} · ${t.price} coins each</p>`;let used=false;this.button(el,`Sell all · ${n*t.price} coins`,()=>{if(used)return;used=true;const amount=GameState.treasures?.[id]||0;if(amount<=0)return;GameState.treasures[id]=0;GameState.gold=(GameState.gold||0)+amount*t.price;if(SaveManager.nodeCheckpoint&&GameState.resume?.kind==='node')SaveManager.nodeCheckpoint=JSON.parse(JSON.stringify(GameState));saveGame(true);ShopEngine._render();}).disabled=n===0;grid.appendChild(el);}}
};

/* A serving is an independent number guess, never a cumulative food total. */
const SnorlaxEngine={
 _isActive:false,_node:null,_busy:false,_drag:null,
 async start(node){
  this._node=node;this._isActive=true;ActiveEngine.set(this);skillTimerBegin('snorlax');
  showBossIntro({gymIndex:0,portrait:'sprites/143.png',gameKey:'snorlax',name:'Feed Snorlax',btnLabel:'Feed Snorlax',introText:'Snorlax is hungry! Find its perfect serving. If it wants more, try a bigger number. If it wants less, try a smaller number.'});
 },
 startGame(){
  this._isActive=false;ActiveEngine.clear();this._busy=false;this._drag=null;
  document.getElementById('trainer-intro').style.display='none';
  if(!GameState.snorlaxFeed){
   const tier=Math.max(1,Math.min(3,getSkillTier('snorlax'))),max=[0,5,15,30][tier];
   SaveManager.complete();GameState.snorlaxFeed={nodeIdx:this._node?.idx??GameState.currentNodeIndex,tier,max,target:1+Math.floor(Math.random()*max),low:1,high:max,selected:null,attempts:0,last:null,pending:null,phase:'playing',clue:false};
  }
  GameState.resume={kind:'feed-snorlax'};SaveManager.nodeCheckpoint=null;saveGame(true);this.show();
  if(GameState.snorlaxFeed.pending!=null)this.settle();
 },
 options(){const s=GameState.snorlaxFeed,len=s.high-s.low+1;return [...new Set(Array.from({length:Math.min(5,len)},(_,i)=>s.low+Math.round(i*(len-1)/Math.max(1,Math.min(5,len)-1))))];},
 fruit(kind='banana'){
  const shapes={banana:'<path fill="#ffe278" stroke="#765431" stroke-width="3" d="M10 5L17 4Q14 29 35 20L42 13Q47 38 24 42Q3 39 10 5Z"/>',apple:'<path fill="#e7745d" stroke="#663e36" stroke-width="3" d="M24 14Q6 5 5 26Q7 46 23 42Q38 47 43 28Q45 9 24 14Z"/><path stroke="#715735" stroke-width="4" d="M24 16L26 5"/><path fill="#97c779" d="M26 8Q32 0 40 6Q35 14 26 8Z"/>',berry:'<path fill="#a38bd5" stroke="#403866" stroke-width="3" d="M25 12Q44 11 41 27Q40 43 25 45Q8 41 7 27Q4 11 25 12Z"/><path fill="#97c779" d="M25 3L31 13L40 10L33 22L25 17L16 22L10 11L20 13Z"/>'};return '<svg viewBox="0 0 48 48" aria-hidden="true">'+shapes[kind]+'</svg>';
 },
 basket(n,kind){return '<span class="feed-basket-art" aria-hidden="true"><span class="feed-fruit-pile" style="--cols:'+Math.min(n,5)+';--rows:'+Math.ceil(n/5)+'">'+Array.from({length:n},()=>this.fruit(kind)).join('')+'</span><span class="feed-wicker"></span></span>';},
 persist(){GameState.resume={kind:'feed-snorlax'};saveGame(true);},
 show(){
  const s=GameState.snorlaxFeed;
  const cv=setupChallengeScreen({portrait:'sprites/143.png',badge:'Feed Snorlax',wrapClass:'feed-wrap',screenClass:'snorlax-active'});
  cv.innerHTML='<header class="feed-header"><h2>FEED SNORLAX</h2><p id="feed-clue" aria-live="polite"></p></header><div class="feed-scene"><button class="feed-snorlax" aria-label="Ask Snorlax how hungry it is"><img src="assets/sprites/143.png" alt="Snorlax"><i class="feed-mouth" aria-hidden="true"></i></button><div class="feed-feedback" role="status"></div><div class="feed-flight" aria-hidden="true"></div></div><section class="feed-dock"><h3></h3><p class="feed-instruction"></p><div class="feed-options"></div><button class="feed-submit btn-pixel btn-primary"></button><p class="feed-footnote">Each basket is a new guess. Take your time.</p></section>';
  document.getElementById('mg-rules-chip').style.display='none';
  cv.querySelector('.feed-snorlax').onclick=()=>{s.clue=true;this.persist();this.updateClue();};this.updateClue();
  const feedback=cv.querySelector('.feed-feedback');
  if(s.phase==='won'){
   feedback.innerHTML='<b class="feed-arrow">✓</b><strong>JUST RIGHT!</strong><span>'+s.target+(s.target===1?' piece':' pieces')+'</span>';feedback.dataset.direction='right';
   cv.querySelector('h3').textContent='A happy, full Snorlax!';cv.querySelector('.feed-instruction').textContent=`${s.target} ${s.target===1?'piece was':'pieces were'} the sweet spot. +${s.gold} coins!`;
   const b=cv.querySelector('.feed-submit');b.textContent='Continue adventure';b.onclick=()=>this.finish();cv.querySelector('.feed-footnote').textContent='Snorlax moves aside to let you pass.';document.getElementById('mg-quit-btn').style.display='none';return;
  }
  if(s.last!=null){const more=s.last<s.target;feedback.dataset.direction=more?'up':'down';feedback.innerHTML=`<b class="feed-arrow">${more?'↑':'↓'}</b><strong>${more?'TRY MORE':'TRY LESS'}</strong><span>${s.last} was too ${more?'little':'much'}</span>`;}
  else feedback.innerHTML='<strong>How hungry?</strong><span>Tap Snorlax!</span>';
  cv.querySelector('h3').textContent='Find the perfect serving!';cv.querySelector('.feed-instruction').textContent=s.last==null?'Choose a basket. Swipe up or press Feed.':`Try ${s.low===s.high?s.low:s.low+'–'+s.high} pieces. Each serving starts fresh.`;
  this.options().forEach((n,i)=>{
   const kind=['banana','apple','berry'][i%3],b=document.createElement('button');b.className='feed-option';b.dataset.amount=n;b.dataset.kind=kind;b.innerHTML=this.basket(n,kind)+`<strong>${n} ${n===1?'piece':'pieces'}</strong>`;b.setAttribute('aria-label',n+(n===1?' piece':' pieces')+' of fruit');b.setAttribute('aria-pressed',String(s.selected===n));b.classList.toggle('selected',s.selected===n);
   b.onclick=()=>{if(this._busy||this._swiped){this._swiped=false;return;}s.selected=n;this.persist();this.selectUI();};
   b.onpointerdown=e=>{if(e.button!==0||this._busy||MiniGameSession.reasons.size)return;this._swiped=false;s.selected=n;this.selectUI();this._drag={id:e.pointerId,x:e.clientX,y:e.clientY,n,kind};b.setPointerCapture(e.pointerId);};
   b.onpointermove=e=>{if(this._drag?.id===e.pointerId)b.style.setProperty('--lift',Math.max(-65,Math.min(0,e.clientY-this._drag.y))+'px');};
   b.onpointerup=e=>{const d=this._drag;this._drag=null;b.style.removeProperty('--lift');if(d&&e.pointerId===d.id&&e.clientY-d.y<-50&&Math.abs(e.clientX-d.x)<80){this._swiped=true;this.feed(d.n,kind);}};
   b.onpointercancel=b.onlostpointercapture=()=>{this._drag=null;b.style.removeProperty('--lift');};cv.querySelector('.feed-options').appendChild(b);
  });
  cv.querySelector('.feed-submit').onclick=()=>this.feed(s.selected);this.selectUI();
  document.getElementById('mg-quit-btn').onclick=()=>showModal('Leave Snorlax?', 'Skip feeding and return to the path?',()=>{const idx=s.nodeIdx;delete GameState.snorlaxFeed;SaveManager.complete();MiniGameSession.stop();MapEngine.completeNode(idx);MapEngine.show();},true);
 },
 updateClue(){const s=GameState.snorlaxFeed;document.getElementById('feed-clue').textContent=s.phase==='won'?'“Mmm… just right!”':s.clue?'Snorlax seems '+(s.target<=s.max/3?'barely hungry.':s.target<=s.max*2/3?'hungry.':'really hungry!'):'Tap Snorlax for a hunger clue.';},
 selectUI(){const s=GameState.snorlaxFeed;document.querySelectorAll('.feed-option').forEach(b=>{const on=Number(b.dataset.amount)===s.selected;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});const b=document.querySelector('.feed-submit');b.disabled=s.selected==null||this._busy;b.textContent=s.selected==null?'Choose a basket':'Feed '+s.selected+(s.selected===1?' piece ↑':' pieces ↑');},
 feed(n,kind){
  const s=GameState.snorlaxFeed;if(!s||s.phase!=='playing'||this._busy||MiniGameSession.reasons.size||!this.options().includes(n))return;
  this._busy=true;s.pending=n;s.selected=n;this.persist();this.selectUI();document.querySelectorAll('.feed-option').forEach(b=>b.disabled=true);
  const cv=document.querySelector('.feed-wrap'),source=cv.querySelector(`[data-amount="${n}"]`),mouth=cv.querySelector('.feed-mouth'),r=source.getBoundingClientRect(),m=mouth.getBoundingClientRect(),host=cv.querySelector('.feed-flight');kind=kind||source.dataset.kind;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;cv.querySelector('.feed-snorlax').classList.add('eating');
  if(!reduced)for(let i=0;i<n;i++){const f=document.createElement('span');f.className='feed-flying-fruit';f.innerHTML=this.fruit(kind);f.style.cssText=`left:${r.x+r.width/2}px;top:${r.y}px;--dx:${m.x+m.width/2-r.x-r.width/2}px;--dy:${m.y+m.height/2-r.y}px;animation-delay:${i*22}ms`;host.appendChild(f);}
  MiniGameSession.later(()=>this.settle(),reduced?180:900+n*22);
 },
 settle(){
  const s=GameState.snorlaxFeed;if(!s||s.pending==null||s.phase!=='playing')return;
  const n=s.pending;s.pending=null;s.last=n;s.attempts++;this._busy=false;
  if(n===s.target){s.phase='won';s.gold=[0,12,18,24][s.tier];GameState.gold=(GameState.gold||0)+s.gold;recordSkillResult('snorlax',1,1);SoundEngine.playCorrect();}
  else if(n<s.target)s.low=n+1;else s.high=n-1;
  s.selected=null;this.persist();this.show();
 },
 finish(){const s=GameState.snorlaxFeed;if(!s||s.phase!=='won')return;const idx=s.nodeIdx;delete GameState.snorlaxFeed;SaveManager.complete();MiniGameSession.stop();MapEngine.completeNode(idx);MapEngine.show();}
};

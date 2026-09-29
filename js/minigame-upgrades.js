/* Activity-specific teaching controls. No network assets required. */
const MiniGameUpgrades={
 wrap(object,name,after){const original=object[name];object[name]=function(...args){const result=original.apply(this,args);if(result?.then)return result.then(value=>{after.apply(this,args);return value;});after.apply(this,args);return result;};},
 button(text,fn,host){const b=document.createElement('button');b.className='btn-pixel btn-secondary mg-tool';b.textContent=text;b.onclick=fn;host.appendChild(b);return b;},
 timeline(start,duration,host){const details=document.createElement('details');details.className='mg-timeline';const summary=document.createElement('summary');summary.textContent='Show time steps';details.appendChild(summary);let remaining=duration,total=start.h*60+start.m;const steps=[];while(remaining>0){const step=Math.min(remaining,60-total%60);const label=n=>`${Math.floor(n/60)%12||12}:${String(n%60).padStart(2,'0')}`;steps.push(`${label(total)} → ${label(total+step)}: ${step} min`);total+=step;remaining-=step;}const p=document.createElement('p');p.textContent=steps.join(' · ')+` · Total ${duration} minutes`;details.appendChild(p);host.appendChild(details);},
 init(){
  // Legacy activities do not call setupChallengeScreen.
  for(const [object,method,key]of [[ErikaEngine,'_showLab','erika-active'],[NinjaMemoryEngine,'startGame','koga-active'],[SabrinaEngine,'_showPuzzle','sabrina-active'],[SurgeEngine,'_showRound','surge-active'],[BlaineEngine,'_showArena','blaine-active']]){
    const original=object[method];object[method]=function(...args){MiniGameSession.begin(key);return original.apply(this,args);};
  }
  NinjaMemoryEngine._updateTracker=function(el){el=el||document.getElementById('ninja-tracker');if(el)el.textContent=`${this._matched}/${this._pairCount} pairs · ${Math.max(0,this._budget*2-this._misses)} mismatches remaining`;};
  this.wrap(ChuckEngine,'_roundSet',function(cv){
    const clock=document.getElementById('chuck-set-clock');let hand='minute';const tools=document.createElement('div');tools.className='mg-tools';
    MiniGameUpgrades.button('Move hour hand',()=>hand='hour',tools);MiniGameUpgrades.button('Move minute hand',()=>hand='minute',tools);clock.before(tools);
    const move=e=>{if(document.querySelector('.chuck-submit')?.disabled)return;const r=clock.getBoundingClientRect(),a=(Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)*180/Math.PI+450)%360;if(hand==='hour')this._setH=Math.round(a/30)%12||12;else this._setM=(Math.round(a/30)%12)*5;this._redrawSetClock();};clock.style.touchAction='none';clock.onpointerdown=e=>{clock.setPointerCapture(e.pointerId);move(e);};clock.onpointermove=e=>{if(clock.hasPointerCapture(e.pointerId))move(e);};
  });
  this.wrap(SabrinaEngine,'_buildGrid',function(){document.querySelectorAll('.sabrina-tray-piece').forEach((el,i)=>{const p=this._trayPieces[i];el.innerHTML=`<small class="mg-piece-coordinate">${p.row+1}:${p.col+1}</small>`;el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label',`Piece row ${p.row+1}, column ${p.col+1}`);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}};});});
  this.wrap(JennyEngine,'_showRound',function(){
    const grid=document.querySelector('.jenny-lineup');if(!grid)return;let crossing=false;const b=MiniGameUpgrades.button('Cross out suspects',()=>{crossing=!crossing;b.textContent=crossing?'Return to identify mode':'Cross out suspects';},grid.parentElement);
    grid.addEventListener('click',e=>{const card=e.target.closest('.jenny-suspect');if(crossing&&card){e.stopImmediatePropagation();e.preventDefault();card.classList.toggle('mg-crossed');card.setAttribute('aria-label',card.textContent+(card.classList.contains('mg-crossed')?' — crossed out':''));}},true);
  });
 }
};
MiniGameUpgrades.init();

/* Morty now trains sequence recall, distinct from Koga's matching pairs. */
Object.assign(MortyEngine,{
 startGame(){this._isActive=false;ActiveEngine.clear();document.getElementById('trainer-intro').style.display='none';this._round=0;this._hits=0;this._sequenceRound();},
 _sequenceRound(){
  if(this._round>=5){completeChallenge({screenClass:'morty-active',won:this._hits>=3,goldReward:6+this._hits*4,score:this._hits,maxScore:5,gameKey:'morty',modalTitle:'Ghost procession',modalBody:`${this._hits}/5 sequences remembered.`});return;}
  const cv=setupChallengeScreen({portrait:'morty.png',badge:'Ghost Procession',intro:`Sequence ${this._round+1}/5 · ${this._hits} remembered`,wrapClass:'morty-wrap',screenClass:'morty-active'});
  const ghosts=[[92,'Gastly'],[93,'Haunter'],[94,'Gengar'],[200,'Misdreavus']];this._sequence=Array.from({length:Math.min(5,2+Math.floor(this._round/2)+(GameState.difficultyTier>=3?1:0))},()=>Math.floor(Math.random()*4));this._position=0;this._locked=true;
  const feedback=document.createElement('p');feedback.className='mg-feedback';feedback.textContent='Watch the ghosts appear in order.';cv.appendChild(feedback);const row=document.createElement('div');row.className='morty-procession';cv.appendChild(row);
  ghosts.forEach(([id,name],i)=>{const b=document.createElement('button');b.innerHTML=`<img src="assets/sprites/${id}.png" alt=""><strong>${name}</strong>`;b.onclick=()=>{if(this._locked)return;if(i!==this._sequence[this._position]){this._locked=true;feedback.textContent='The order was: '+this._sequence.map(i=>ghosts[i][1]).join(' → ');MiniGameSession.next(()=>{this._round++;this._sequenceRound();});return;}b.classList.add('ghost-lit');MiniGameSession.later(()=>b.classList.remove('ghost-lit'),250);this._position++;feedback.textContent=`${this._position}/${this._sequence.length} remembered`;if(this._position===this._sequence.length){this._locked=true;this._hits++;feedback.textContent='The spirits remember you!';MiniGameSession.next(()=>{this._round++;this._sequenceRound();});}};row.appendChild(b);});
  const play=()=>{this._locked=true;this._position=0;feedback.textContent='Watch…';let i=0;const step=()=>{if(i===this._sequence.length){this._locked=false;feedback.textContent='Your turn — repeat their order.';return;}const b=row.children[this._sequence[i++]];b.classList.add('ghost-lit');MiniGameSession.later(()=>{b.classList.remove('ghost-lit');MiniGameSession.later(step,250);},650);};step();};
  MiniGameUpgrades.button('Watch sequence',()=>{if(!this._locked)play();},cv);MiniGameSession.later(play,400);
 }
});

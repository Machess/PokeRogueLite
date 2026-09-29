/* Align visible sprite bounds with platform coordinates without changing original art. */
const BattlePresentation={
 fit(img){const b=SPRITE_BOUNDS[img.getAttribute('src')?.split('/').pop()];if(!b)return;const w=img.parentElement.clientWidth,h=img.parentElement.clientHeight;if(!w||!h)return;const[iw,ih,x0,y0,x1,y1]=b,scale=Math.min(w/(x1-x0),h/(y1-y0));Object.assign(img.style,{width:iw*scale+'px',height:ih*scale+'px',left:(w-(x1-x0)*scale)/2-x0*scale+'px',top:h-y1*scale+'px'});},
 init(){document.querySelectorAll('.battle-sprite').forEach(img=>{img.addEventListener('load',()=>this.fit(img));new MutationObserver(()=>this.fit(img)).observe(img,{attributes:true,attributeFilter:['src']});new ResizeObserver(()=>this.fit(img)).observe(img.parentElement);});}
};
/* Separate flip control: viewing art never plays an attack or spends energy. */
const CardFlip={active:null,
 button(card,origin){const b=document.createElement('button');b.type='button';b.className='card-flip-trigger';b.textContent='↻ Flip';b.setAttribute('aria-label',`Flip ${card.name} to see its Pokémon card`);b.onclick=e=>{e.stopPropagation();this.open(card,origin,b);};return b;},
 open(card,origin,trigger){
  if(!card.source||this.active)return;
  const modal=document.createElement('dialog');modal.className='card-flip-dialog';modal.setAttribute('aria-label',`${card.source.pokemon} card. Tap to flip back.`);
  const stage=document.createElement('button');stage.type='button';stage.className='card-flip-stage';stage.setAttribute('aria-label','Flip back to attack card');
  const rotor=document.createElement('div');rotor.className='card-flip-rotor';const front=document.createElement('div');front.className='flip-front';
  const clone=origin.cloneNode(true);clone.querySelectorAll('button').forEach(b=>b.remove());clone.classList.remove('disabled');front.appendChild(clone);
  const back=document.createElement('div');back.className='flip-back';const img=document.createElement('img');img.alt=`${card.source.pokemon} Pokémon card`;img.hidden=true;
  const fallback=document.createElement('span');fallback.className='flip-unavailable';fallback.textContent='Opening saved card…';back.append(img,fallback);
  rotor.append(front,back);stage.appendChild(rotor);modal.appendChild(stage);document.body.appendChild(modal);this.active=modal;
  let closing=false,asset=null;
  const close=()=>{if(closing)return;closing=true;modal.classList.remove('is-flipped');setTimeout(()=>{modal.close();modal.remove();asset?.release();this.active=null;if(trigger.isConnected)trigger.focus();},matchMedia('(prefers-reduced-motion: reduce)').matches?0:340);};
  stage.onclick=close;modal.onclick=e=>{if(e.target===modal)close();};modal.addEventListener('cancel',e=>{e.preventDefault();close();});modal.showModal();stage.focus();requestAnimationFrame(()=>requestAnimationFrame(()=>modal.classList.add('is-flipped')));
  AssetPreloader.art(card.source).then(a=>{
   if(closing){a?.release();return;}asset=a;
   if(!a){fallback.textContent='Card art was unavailable during loading. Tap to flip back.';return;}
   img.onload=()=>{img.hidden=false;fallback.hidden=true;};img.onerror=()=>{img.hidden=true;fallback.textContent='Card image unavailable. Tap to flip back.';};img.src=a.url;
  }).catch(()=>{fallback.textContent='Card image unavailable. Tap to flip back.';});
 }
};

/* Frame-rate-independent three-cast timing, paused in background tabs. */
const FishingTiming={session:null,
 score(angle,target,zone){const distance=Math.abs(((angle-target+540)%360)-180);return distance<=zone*.28?2:distance<=zone?1:0;},
 stop(){const s=this.session;if(!s)return;cancelAnimationFrame(s.raf);s.observer?.disconnect();document.removeEventListener('visibilitychange',s.visibility);this.session=null;},
 start(tier,onDone){this.stop();showScreen('challenge');MiniGameSession.begin('fishing-active');const sc=document.getElementById('screen-challenge');sc.classList.remove(...CHALLENGE_CLASSES,'fishing-clues');sc.classList.add('fishing-active');SoundEngine.playBGM('pallet_town_theme.mp3');const portrait=document.getElementById('challenge-character-img');portrait.src='assets/misty.png';portrait.style.display='';document.getElementById('challenge-badge').textContent='MISTY’S CAST & REEL';document.getElementById('challenge-intro').textContent='Tap REEL when the white float enters the striped zone. Aim for the gold centre!';for(const id of ['challenge-result','challenge-continue-btn','challenge-question','jessie-word-display'])document.getElementById(id).style.display='none';document.getElementById('challenge-answer-btns').replaceChildren();const cv=document.getElementById('challenge-coin-visual');cv.style.display='block';cv.className='reel-game';
 cv.innerHTML=`<div class="reel-rounds" aria-label="Three casts"><span>1</span><span>2</span><span>3</span></div><div class="reel-scene"><div class="cast-water"><span>Cast your line into the lake</span><i class="cast-ripple"></i></div><div class="pixel-rod" aria-hidden="true"><i></i></div><div class="reel-dial" role="img" aria-label="Moving float and striped catch zone"><svg viewBox="0 0 240 240" aria-hidden="true"><defs><pattern id="reel-stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#78dfb0"/><rect width="3" height="8" fill="#214d4a"/></pattern></defs><circle cx="120" cy="120" r="96" fill="none" stroke="#0b2336" stroke-width="24"/><path class="reel-zone" stroke="url(#reel-stripes)" stroke-width="24" fill="none"/><path class="reel-perfect" stroke="#ffe38a" stroke-width="24" fill="none"/></svg><div class="reel-centre"><span class="pixel-float" aria-hidden="true"></span><strong id="reel-count">CAST 1 / 3</strong><span id="reel-status">Ready to cast?</span></div><div class="reel-pointer"><i></i></div></div></div><button class="btn-pixel reel-button" id="angling-hook-btn">CAST LINE</button><div class="reel-feedback" id="angling-feedback" aria-live="polite">Three casts. Take your time.</div>`;
 const s=this.session={angle:0,target:100,zone:tier>=3?30:44,speed:tier>=3?115:88,round:0,total:0,phase:'ready',raf:0,last:0,cv,sc,onDone};if(matchMedia('(prefers-reduced-motion: reduce)').matches)s.speed*=.7;s.visibility=()=>{s.last=0;};document.addEventListener('visibilitychange',s.visibility);s.observer=new MutationObserver(()=>{if(!sc.classList.contains('active'))this.stop();});s.observer.observe(sc,{attributes:true,attributeFilter:['class']});s.btn=cv.querySelector('button');s.btn.onclick=()=>this.tap();this.drawZone();const tick=now=>{if(this.session!==s)return;if(!document.hidden&&!MiniGameSession.reasons.size&&s.phase==='running'){const dt=s.last?Math.min((now-s.last)/1000,.05):0;s.angle=(s.angle+s.speed*dt)%360;cv.querySelector('.reel-pointer').style.transform=`rotate(${s.angle}deg)`;}s.last=now;s.raf=requestAnimationFrame(tick);};s.raf=requestAnimationFrame(tick);},
 drawZone(){const s=this.session;const arc=(start,end)=>{const point=a=>[120+96*Math.sin(a*Math.PI/180),120-96*Math.cos(a*Math.PI/180)];const a=point(start),b=point(end);return `M ${a[0]} ${a[1]} A 96 96 0 0 1 ${b[0]} ${b[1]}`;};s.cv.querySelector('.reel-zone').setAttribute('d',arc(s.target-s.zone,s.target+s.zone));s.cv.querySelector('.reel-perfect').setAttribute('d',arc(s.target-s.zone*.28,s.target+s.zone*.28));},
 tap(){const s=this.session;if(!s||MiniGameSession.reasons.size)return;const feedback=s.cv.querySelector('.reel-feedback'),status=s.cv.querySelector('#reel-status');if(s.phase==='complete'){const bonus=s.total>=5?1:s.total>=2?0:-1,done=s.onDone;this.stop();done(bonus);return;}if(s.phase==='ready'||s.phase==='between'){s.phase='running';s.angle=0;s.target=85+s.round*85;s.last=0;this.drawZone();s.cv.classList.remove('cast-result');s.cv.classList.add('is-reeling');s.cv.querySelector('#reel-count').textContent=`CAST ${s.round+1} / 3`;s.btn.textContent='REEL!';feedback.textContent='White float → striped zone → REEL!';status.textContent='Watch the float';return;}if(s.phase!=='running')return;const score=this.score(s.angle,s.target,s.zone);s.total+=score;s.cv.classList.remove('is-reeling');s.cv.classList.add('cast-result');s.cv.querySelectorAll('.reel-rounds span')[s.round].textContent=score===2?'★':score===1?'✓':'·';s.round++;feedback.textContent=score===2?'Perfect! Right in the gold.':score===1?'Nice catch! The line is steady.':'A splash! Try the next cast.';status.textContent=score===2?'PERFECT':score===1?'HOOKED':'SPLASH';if(score)SoundEngine.playCorrect();s.phase=s.round===3?'complete':'between';s.btn.textContent=s.phase==='complete'?'REVEAL CATCH':'CAST AGAIN';if(s.phase==='complete')feedback.textContent+=(s.total>=5?' Extra clue earned!':s.total>=2?' Your clues are ready.':' A tricky catch — look closely at the clue.');}
};
if(typeof window!=='undefined'&&typeof ResizeObserver!=='undefined')BattlePresentation.init();
const PixelType={patterns:{
 fire:['00010000','00110000','00111010','01111110','11111111','11111111','01111110','00111100'],
 water:['00011000','00011000','00111100','01111110','01111110','11111111','01111110','00111100'],
 grass:['00000011','00011111','00111111','01111011','01110110','11101100','11011000','00100000'],
 electric:['00011100','00111000','01110000','11111110','00011100','00111000','00110000','01100000'],
 normal:['00000000','00111100','01111110','11111111','11111111','01111110','00111100','00000000'],
 flying:['00000011','00001111','00111110','01111100','11111000','01110000','00110000','00100000'],
 ice:['10011001','01011010','00111100','11111111','11111111','00111100','01011010','10011001'],
 psychic:['00111100','01100110','11000011','10011001','10100101','10111001','01000010','00111100'],
 fighting:['00111100','01111110','01111110','00111100','00111100','01111110','01111110','00000000'],
 poison:['00111100','01111110','11011011','11111111','01111110','00111100','00011000','00111100'],
 rock:['00111100','01111110','01101110','11111111','11011111','11111111','01111110','00000000'],
 ground:['00011000','00111100','01111110','11011011','11111111','00000000','11111111','11111111'],
 bug:['01000010','00111100','01111110','11011011','01111110','11011011','01111110','00100100'],
 ghost:['00111100','01111110','11111111','11011011','11111111','11111111','11011011','10010001'],
 dragon:['00001110','00111111','01110110','01111100','00111000','11111100','01111110','00000110'],
 dark:['00111000','01110000','11100000','11100001','11100011','11110111','01111110','00111100'],
 steel:['00111100','01111110','11100111','11000011','11000011','11100111','01111110','00111100'],
 fairy:['00011000','01011010','00111100','11111111','11111111','00111100','01011010','00011000'],
 Guard:['11111111','11111111','11111111','11111111','01111110','01111110','00111100','00011000'],
 Focus:['00011000','00011000','00111100','11111111','11111111','00111100','00011000','00011000']},
 icon(type,command){const grid=this.patterns[command]||this.patterns[type]||this.patterns.normal;return `<svg class="pixel-type-icon" viewBox="0 0 8 8" aria-hidden="true" fill="${command?'#ffe29b':`var(--col-type-${type}, #ddd)`}">${grid.flatMap((row,y)=>[...row].map((v,x)=>v==='1'?`<rect x="${x}" y="${y}" width="1" height="1"/>`:'')).join('')}</svg>`;}
};

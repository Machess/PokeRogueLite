/* Scoped, pausable clocks: minigame callbacks cannot escape into later screens. */
const MiniGameSession={
 timers:new Map(),frames:new Map(),serial:100000,key:null,screen:null,reasons:new Set(),seen:new Set(),epoch:0,
 begin(key,screen='challenge'){
  this.stop();this.key=key;this.screen=screen;this.reasons=new Set(document.hidden?['hidden']:[]);
  queueMicrotask(()=>{if(this.key===key)this.install();});
 },
 stop(){if(this.key==='runner-active'&&typeof RocketRunnerEngine!=='undefined'){RocketRunnerEngine._running=false;RocketRunnerEngine._cleanupInput();}this.epoch++;for(const t of this.timers.values())clearTimeout(t.native);this.timers.clear();for(const f of this.frames.values())cancelAnimationFrame(f.native);this.frames.clear();this.dialog?.remove();this.dialog=null;document.querySelectorAll(".minigame-next").forEach(b=>b.remove());this.pausedAnimations?.forEach(a=>{try{a.play();}catch{}});this.pausedAnimations=[];this.reasons.clear();document.body.classList.remove('minigame-paused');this.key=null;},
 later(fn,ms=0){const id=++this.serial,t={fn,remaining:Math.max(0,ms),epoch:this.epoch};this.timers.set(id,t);this.arm(id,t);return id;},
 arm(id,t){if(this.reasons.size)return;t.started=performance.now();t.native=setTimeout(()=>{if(!t.periodic)this.timers.delete(id);if(t.epoch===this.epoch)t.fn();},t.remaining);},
 clear(id){const t=MiniGameSession.timers.get(id);if(t){clearTimeout(t.native);MiniGameSession.timers.delete(id);}else clearTimeout(id);},
 every(fn,ms){const id=++this.serial,t={remaining:ms,epoch:this.epoch,periodic:true};t.fn=()=>{if(t.epoch!==this.epoch)return;fn();if(t.epoch===this.epoch&&!t.cancelled){t.remaining=ms;this.timers.set(id,t);this.arm(id,t);}};this.timers.set(id,t);this.arm(id,t);return id;},
 clearEvery(id){const t=this.timers.get(id);if(t)t.cancelled=true;this.clear(id);},
 frame(fn){const id=++this.serial,f={fn,epoch:this.epoch};this.frames.set(id,f);this.armFrame(id,f);return id;},
 armFrame(id,f){if(this.reasons.size)return;f.native=requestAnimationFrame(now=>{this.frames.delete(id);if(f.epoch===this.epoch)f.fn(now);});},
 cancelFrame(id){const f=this.frames.get(id);if(f)cancelAnimationFrame(f.native);this.frames.delete(id);},
 pause(reason){if(this.reasons.has(reason))return;const was=this.reasons.size;this.reasons.add(reason);if(was)return;for(const t of this.timers.values()){clearTimeout(t.native);t.remaining=Math.max(0,t.remaining-(performance.now()-(t.started||performance.now())));}for(const f of this.frames.values())cancelAnimationFrame(f.native);this.pausedAnimations=document.querySelector('#screen-'+this.screen)?.getAnimations({subtree:true}).filter(a=>a.playState==='running')||[];this.pausedAnimations.forEach(a=>a.pause());document.body.classList.add('minigame-paused');},
 resume(reason){if(!this.reasons.has(reason))return;this.reasons.delete(reason);if(this.reasons.size)return;for(const [id,t]of this.timers)this.arm(id,t);for(const [id,f]of this.frames)this.armFrame(id,f);this.pausedAnimations?.forEach(a=>{try{a.play();}catch{}});this.pausedAnimations=[];document.body.classList.remove('minigame-paused');},
 next(fn,label='Next round'){
  const host=document.querySelector('#screen-'+this.screen+' .challenge-panel')||document.querySelector('#screen-'+this.screen);if(!host)return;
  host.querySelector('.minigame-next')?.remove();const b=document.createElement('button');b.className='minigame-next btn-pixel btn-primary';b.textContent=label;let used=false;const epoch=this.epoch;b.onclick=()=>{if(used||epoch!==this.epoch)return;used=true;b.remove();fn();};host.appendChild(b);b.scrollIntoView({block:'nearest'});
 },
 guides:{
  'fishing-active':['Cast, then reel','Press Cast line to send the float into the lake.','The timing dial appears after casting. Press Reel in the striped zone.'],
  'snorlax-active':['Compare the weights','Try a Pokémon on the scale. Tap it again to remove it.','Choose the closest total, then confirm. Exact balance is a bonus!'],
  'clair-active':['Read the named Pokémon type','Choose any super-effective counter. Ice beats Dragon; Electric beats Water.','Press Ready to start the charge. Read the explanation before Next.'],
  'whitney-active':['Read the order ticket','For 750 ml, pour 500 ml + 250 ml. Undo removes your last pour.','Choose the named berry after reaching the target.'],
  'erika-active':['Mix colours and measure','Blue + Yellow makes Green. Each bottle adds half a flask.','Pour out a quarter at a time. Check the colour and level before submitting.'],
  cooking:['Choose cookware','Follow the recipe checklist and measure each ingredient.','A wrong quantity can be corrected before it enters the pot.'],
  'chuck-active':['Read the two hands','The short hand shows hours. The long hand shows minutes.','Choose a hand, then move it around the clock. Buttons work too.'],
  'togepi-active':['Follow time forward','9:45 → 10:00 takes 15 minutes; 10:00 → 10:15 takes 15 more.','Add the steps: 30 minutes. Use the timeline to check your answer.'],
  'rocketmoney-active':['Read the receipt','Tap coins to pay. Tap a coin in the tray to take it back.','Check the total, then hand over the payment.'],
  'bugsy-active':['Study the target portrait','Find the same Pokémon among the moving decoys.','Tap its body. The timer pauses while this help is open.'],
  'falkner-active':['Watch the flight path','Tap a bird to throw. Aim near its centre.','Catches use one ball; watch your remaining supply.'],
  'runner-active':['Tap to jump','Practise the first clear stretch. Jump again just before landing to queue the next jump.','Follow the coin trail and reach Officer Jenny.'],
  'jasmine-active':['Watch the numbered anvils','For 1 → 3 → 2, tap those same three anvils in order.','Replay the pattern if needed. Three mistakes end the forging attempt.'],
  'morty-active':['Remember the visiting ghosts','Watch the order in which ghosts appear, then repeat it.','Use their portraits and names; no colour guessing required.'],
  'pryce-active':['Count one shape at a time','Tap shards to mark them as counted. Tap again to undo a mark.','Submit the count to clear that layer of the sculpture.'],
  'jenny-active':['Read the case file','Compare the type and descriptive clues with every suspect.','Use cross-out mode to eliminate candidates, then identify the missing Pokémon.'],
  'sabrina-active':['Study the picture','Tap a tray piece, then its matching empty space.','Use Reference at any time. Coordinates help distinguish blank pieces.'],
  'koga-active':['Study the cards','Match identical Pokémon; advanced play matches evolution partners.','Press Begin matching when you are ready to hide the preview.'],
  'jigglypuff-active':['Listen to a short phrase','Use Listen slowly to practise. Then play the highlighted instrument keys.','Finish one phrase at a time; replaying is free.'],
  'wobbu-active':['Read the incoming attack','Pick the super-effective counter after pressing Ready.','The charge bar shows the time remaining.']
 },
 help(){if(this.dialog)return;this.pause('help');const d=document.createElement('dialog');d.className='minigame-guide';const lines=this.guides[this.key]||['How to play',typeof MG_RULES!=='undefined'&&MG_RULES[this.key]||'Read the objective and choose your answer.','Take your time. Use Next to continue after feedback.'];const title=document.createElement('h2');title.textContent=lines[0];d.appendChild(title);for(let i=1;i<lines.length;i++){const p=document.createElement('p');p.textContent=i+'. '+lines[i];d.appendChild(p);}const b=document.createElement('button');b.textContent='Ready to play';b.className='btn-pixel btn-primary';const close=()=>{d.close();d.remove();this.dialog=null;this.resume('help');};b.onclick=close;d.oncancel=e=>{e.preventDefault();close();};d.appendChild(b);document.body.appendChild(d);this.dialog=d;d.showModal();},
 install(){if(!this.key)return;const root=document.getElementById('screen-'+this.screen);let b=root.querySelector('.minigame-help');if(!b){b=document.createElement('button');b.className='minigame-help';b.textContent='Pause / Help';root.appendChild(b);}b.onclick=()=>this.help();if(!this.seen.has(this.key)){this.seen.add(this.key);this.help();}}
};
document.addEventListener('visibilitychange',()=>{if(!MiniGameSession.key)return;if(document.hidden)MiniGameSession.pause('hidden');else MiniGameSession.resume('hidden');});

// Confirmation dialogs pause the activity too; cancel resumes the same clock.
const minigameOverlay=document.getElementById('overlay');
if(minigameOverlay)new MutationObserver(()=>{if(!MiniGameSession.key)return;if(minigameOverlay.classList.contains('hidden'))MiniGameSession.resume('modal');else MiniGameSession.pause('modal');}).observe(minigameOverlay,{attributes:true,attributeFilter:['class']});

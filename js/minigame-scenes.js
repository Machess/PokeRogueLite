/* Illustrated activity stages. Reuses bundled backgrounds and sprites. */
const MiniGameScenes={
 themes:{
  'surge-active':['surge','assets/bg_2_boss.png'], 
  'oak-active':['oak','assets/minigames/oak-lab.svg'], 'erika-active':['erika','assets/bg_3_boss.png'],
  'whitney-active':['whitney','assets/backgrounds/bg_johto_2.jpg'], 'chuck-active':['chuck','assets/bg_training.png'],
  'togepi-active':['togepi','assets/runner/valley.png'], 'bugsy-active':['bugsy','assets/bg_catch_forest.png'],
  'pryce-active':['pryce','assets/backgrounds/bg_johto_6.jpg'], 'falkner-active':['falkner','assets/runner/valley.png'],
  'morty-active':['morty','assets/backgrounds/bg_johto_3.jpg'], 'jasmine-active':['jasmine','assets/bg_johto_boss_5.jpg'],
  'koga-active':['koga','assets/bg_4_boss.png'], 'sabrina-active':['sabrina','assets/bg_5_boss.png'],
  'jigglypuff-active':['jigglypuff','assets/bg_catch_forest.png'], 'jenny-active':['jenny','assets/bg_shop.png'],
  'rocketmoney-active':['rocketmoney','assets/challenge_meowth_bg.png'], 'wobbu-active':['wobbu','assets/rocket_battle_bg_1.png'],
  'clair-active':['clair','assets/bg_johto_boss_7.jpg'], 'blaine-active':['blaine','assets/bg_6_boss.png'],
  'fishing-active':['fishing','assets/bg_fishing.png']
 },
 sprite(src,cls,label){
  const filename=src.split('/').pop();const b=src.includes('/sprites/')?SPRITE_BOUNDS[filename]:TRAINER_BOUNDS[filename];
  if(!b)return `<img class="${cls}" src="${src}" alt="${label}">`;
  const [w,h,x,y,r,bt]=b;
  return `<svg class="${cls}" viewBox="${x} ${y} ${r-x} ${bt-y}" role="img" aria-label="${label}"><image href="${src}" width="${w}" height="${h}"/></svg>`;
 },
 sync(){const root=document.getElementById('screen-challenge');const pair=Object.entries(this.themes).find(([k])=>root.classList.contains(k));
  if(!pair){delete root.dataset.scene;root.style.removeProperty('--activity-bg');root.querySelectorAll('.mg-scene').forEach(e=>e.remove());return;}
  root.dataset.scene=pair[1][0];root.style.setProperty('--activity-bg',`url("${pair[1][1]}")`);
 },
 stage(kind){const el=document.createElement('div');el.className='mg-scene mg-scene-'+kind;return el;},
 decorate(){
  this.sync();const root=document.getElementById('screen-challenge'),cv=document.getElementById('challenge-coin-visual');
  const kind=root.dataset.scene;if(!kind)return;
  if(kind==='surge'){this.surge();return;}
  if(kind==='oak'&&cv.querySelector('.oak-belt')&&!cv.querySelector('.mg-scene')){
   const s=this.stage('oak');s.innerHTML=this.sprite('assets/prof_oak.png','mg-scene-teacher','Professor Oak')+'<span class="mg-scene-plaque">POKÉMON RESEARCH LAB</span><div class="mg-scanner" aria-hidden="true"></div>';
   const belt=cv.querySelector('.oak-belt');belt.before(s);s.appendChild(belt);
  }
  if(kind==='erika'&&!cv.querySelector('.mg-scene')){
   const target=cv.querySelector('.erika-target-area');if(!target)return;
   const s=this.stage('erika');s.innerHTML=this.sprite('assets/erika.png','mg-scene-teacher','Erika')+this.sprite('assets/sprites/44.png','mg-garden-pokemon','Gloom')+'<span class="mg-scene-plaque">GREENHOUSE WORKBENCH</span><div class="mg-potting-bench" aria-hidden="true"></div>';
   target.before(s);s.appendChild(target);
   const recipe=cv.querySelector('.erika-recipe-card');const details=document.createElement('details');details.className='mg-recipe-guide';details.open=false;
   details.innerHTML='<summary>Mixing chart — show recipes</summary>';recipe.before(details);details.appendChild(recipe);
   details.addEventListener('toggle',()=>{details.querySelector('summary').textContent=details.open?'Mixing chart — tap to close':'Mixing chart — show recipes';});
  }

 },
 surge(){
  const cv=document.getElementById('challenge-coin-visual');cv.style.display='block';cv.className='mg-surge-wrap';
  let s=cv.querySelector('.mg-scene-surge');if(!s){cv.innerHTML='';s=this.stage('surge');s.innerHTML=this.sprite('assets/ltsurge.png','mg-scene-teacher','Lt. Surge')+this.sprite('assets/sprites/26.png','mg-raichu','Raichu')+`<span class="mg-scene-plaque">RAICHU’S POWER STATION</span><svg class="mg-circuit" viewBox="0 0 600 260" aria-hidden="true"><path class="mg-wire" d="M290 214H410V190H486"/><path class="mg-spark" d="m285 142 28-18-8 26 25-11-22 35"/></svg><div class="mg-lamp"><div class="mg-lamp-glow"></div><svg viewBox="0 0 120 170" aria-hidden="true"><path class="mg-bulb-glass" d="M36 15H84V25H100V45H108V82H98V96H84V120H36V96H22V82H12V45H20V25H36Z"/><path class="mg-filament" d="M48 117V70L36 56H52L60 74L68 56H84L72 70V117"/><path fill="#7d9aa1" stroke="#183744" stroke-width="5" d="M35 120H85V151H74V161H46V151H35Z"/><path stroke="#d4e5cf" stroke-width="5" d="M39 128H81M39 138H81"/></svg><strong class="mg-power-label" aria-live="polite"></strong></div><div class="mg-power-meter" role="meter" aria-label="Bulb power" aria-valuemin="0" aria-valuemax="3"><i></i><i></i><i></i></div>`;cv.appendChild(s);}
  const score=Math.min(3,SurgeEngine._score||0);s.dataset.power=score;const meter=s.querySelector('.mg-power-meter');meter.setAttribute('aria-valuenow',score);
  meter.querySelectorAll('i').forEach((el,i)=>el.classList.toggle('charged',i<score));s.querySelector('.mg-power-label').textContent=['0/3 · Unpowered','1/3 · A little glow','2/3 · Shining brighter','3/3 · FULL POWER!'][score];
 },
 after(object,method,fn){const original=object[method];object[method]=function(...args){const result=original.apply(this,args);fn.apply(this,args);return result;};},
 init(){
  const root=document.getElementById('screen-challenge');new MutationObserver(()=>this.sync()).observe(root,{attributes:true,attributeFilter:['class']});
  const setup=setupChallengeScreen;setupChallengeScreen=function(opts){const cv=setup(opts);const epoch=MiniGameSession.epoch;queueMicrotask(()=>{if(epoch===MiniGameSession.epoch)MiniGameScenes.decorate();});return cv;};
  for(const [e,m]of [[ErikaEngine,'_showLab'],[SurgeEngine,'_showRound'],[NinjaMemoryEngine,'startGame'],[SabrinaEngine,'_showPuzzle'],[BlaineEngine,'_showArena']])this.after(e,m,()=>this.decorate());
  this.after(SurgeEngine,'_answer',()=>this.surge());
 }
};

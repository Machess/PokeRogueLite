/* Short saved stops between normal route choices. Never rewires the branch graph. */
const Exploration={
 abilities:{cut:{type:'grass',label:'Cut',ids:[1,2,3,4,5,6,15,27,28,43,44,45,46,47,69,70,71,83,98,99,123,127,152,153,154,158,159,160,182,207,212,214,215]},strength:{type:'fighting',label:'Move rocks',ids:[31,34,55,62,66,67,68,74,75,76,95,112,115,127,128,143,149,160,185,208,214,217,232,248]},water:{type:'water',label:'Retrieve',types:['water']},flying:{type:'flying',label:'Fly up',types:['flying'],ids:[12,49,123,193]},electric:{type:'electric',label:'Power up',types:['electric']},fire:{type:'fire',label:'Warm up',types:['fire']}},
 specs:{
 bush:{prop:0,ability:'cut',title:'A tangled trail',text:'A thick bush hides a small supply cache. Clear it, or follow the path around.',alt:'Go around',success:'cuts the tangled branches. You find supplies worth 12 gold.',gold:12},
 rock:{prop:1,ability:'strength',title:'Rocks on the trail',text:'A fallen boulder blocks a supply box. Move it, or take the clear path beside it.',alt:'Go around',success:'moves the boulder and uncovers 12 gold in supplies.',gold:12},
 water:{prop:3,ability:'water',title:'A floating parcel',text:'A sealed supply parcel drifts near the shore. A Water Pokémon could bring it back.',alt:'Leave it',success:'brings the parcel safely ashore. You receive 12 gold in supplies.',gold:12},
 flying:{prop:3,ability:'flying',title:'Just out of reach',text:'A supply parcel is caught high above the path. A flying partner could retrieve it.',alt:'Leave it',success:'retrieves the parcel from above. You receive 12 gold in supplies.',gold:12},
 machine:{prop:4,ability:'electric',title:'A powerless machine',text:'A portable generator has stopped. Help recharge it for the maintenance crew, or use its hand crank.',alt:'Turn the crank',success:'recharges the generator. The grateful crew gives you 12 gold.',gold:12},
 light:{prop:4,ability:'electric',title:'A light in the dark',text:'The path lamp is losing power. Recharge it, or use the backup hand crank.',alt:'Turn the crank',success:'restores the path light. A grateful traveller gives you 12 gold.',gold:12},
 fire:{prop:5,ability:'fire',title:'Warm up by the fire',text:'A traveller has prepared a stone firepit. Help rekindle the fading fire and rest together.',alt:'Use their tinder',success:'rekindles the fire. Your party rests and recovers 15 HP each.',heal:15},
 ice:{prop:1,ability:'fire',title:'Ice across the path',text:'Fallen ice blocks the tunnel. Melt a passage, or follow the marked side passage.',alt:'Go around',success:'melts a safe passage and reveals supplies worth 12 gold.',gold:12},
 scarf:{prop:6,title:'A lost scarf',text:'A red scarf lies beside the path. Its stitched label reads Ari. Could its owner be nearby?',alt:'Leave it'},
 charm:{prop:7,title:'A dropped charm',text:'A small charm lies beside a lantern. The tag reads Ari. Its owner may be farther along the route.',alt:'Leave it'},
 backpack:{prop:2,title:'A forgotten backpack',text:'A name tag reads “Ari”. Carry the backpack and watch for its owner farther along the route.',alt:'Leave it'},
 owner:{prop:2,title:'A searching trainer',text:'“Have you seen my red backpack? I must have left it beside the path!”',alt:'Continue'}
 },
 pools:{kanto:[['rock','flying','fire'],['water','flying'],['machine','light'],['bush','flying','fire'],['bush','light'],['flying','light'],['rock','fire'],['machine','light']],johto:[['flying','bush'],['bush','rock'],['machine','flying'],['light','machine'],['water','rock'],['machine','light'],['ice','light'],['rock','light']]},
 progress(){return GameState.map.filter(n=>n.done&&n.type!=='boss').length;},
 state(){
  if(GameState.isLeagueRun||GameState.bossesDefeated>=8)return null;
  const key=(GameState.region||'kanto')+':'+(GameState.bossesDefeated||0);
  if(GameState.exploration?.key===key)return GameState.exploration;
  const now=this.progress(),events=[];
  if(now<10){
   const first=Math.min(9,Math.max(now+1,2+Math.floor(Math.random()*2)));
   const story=Math.random()<.35&&first<=6;
   if(story){const item=GameState.region==='kanto'&&GameState.bossesDefeated===5?'charm':GameState.region==='johto'&&GameState.bossesDefeated===0?'scarf':'backpack';events.push({id:0,kind:item,at:first,status:'pending'},{id:1,kind:'owner',item,at:first+2+Math.floor(Math.random()*2),status:'pending'});}
   else{const pool=this.pools[GameState.region||'kanto'][GameState.bossesDefeated||0];const choices=shuffle([...pool]);events.push({id:0,kind:choices[0],at:first,status:'pending'});if(first<7&&Math.random()<.7)events.push({id:1,kind:choices[1]||choices[0],at:Math.min(9,first+3),status:'pending'});}
  }
  GameState.exploration={key,events,carrying:false};return GameState.exploration;
 },
 eligible(ability){const rule=this.abilities[ability];return GameState.party.filter(p=>{if(p.hp<=0)return false;const types=[p.type,...(typeof OFFLINE_POKEMON!=='undefined'?OFFLINE_POKEMON[p.id]?.types||[]:[]).map(t=>t.type?.name)];return rule.ids?.includes(Number(p.id))||rule.types?.some(t=>types.includes(t));});},
 maybe(){const s=this.state();if(!s)return;const e=s.events.find(e=>e.status!=='done'&&e.at<=this.progress());if(e)this.show(e);},
 icon(type){return PixelType.icon(type);},
 foot(){return '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" d="M19 6h12v25H15V14zm-4 29h16v10H15zm28-14h12v25H39V29zm-4 29h16v10H39z"/></svg>';},
 prop(index){if(index===6)return '<svg class="field-prop" viewBox="0 0 100 100" aria-hidden="true"><path fill="#b94739" stroke="#512f32" stroke-width="4" d="M20 20h60v25H50v43H25V40h-5z"/><path stroke="#f5c781" stroke-width="7" d="M24 30h50M28 72h19"/></svg>';if(index===7)return '<svg class="field-prop" viewBox="0 0 100 100" aria-hidden="true"><path fill="none" stroke="#b45b6c" stroke-width="6" d="M50 49C5-5 95-5 50 49"/><path fill="#e4bf69" stroke="#76532f" stroke-width="4" d="M30 45h40v43H30z"/><path fill="#bd4c60" d="m50 51 13 15-13 15-13-15z"/></svg>';return `<span class="field-prop prop-${index}" aria-hidden="true"></span>`;},
 button(icon,label,fn,disabled=false){const b=document.createElement('button');b.className='field-action';b.innerHTML=icon+'<strong></strong>';b.querySelector('strong').textContent=label;b.disabled=disabled;b.onclick=fn;return b;},
 show(e){
  this.current=e;const d=this.specs[e.kind];let root=document.getElementById('screen-field');
  if(!root){root=document.createElement('section');root.id='screen-field';root.className='screen';root.innerHTML='<div class="field-background"></div><header class="field-header"><span>TRAIL DISCOVERY</span><button class="field-menu" aria-label="Save and return to menu">⌂</button></header><div class="field-scene" aria-hidden="true"></div><div class="field-panel"><h2></h2><p class="field-description"></p><p class="field-requirement"></p><div class="field-actions"></div></div>';document.body.appendChild(root);root.querySelector('.field-menu').onclick=()=>{saveGame();Game.goToMenu();};}
  root.dataset.kind=e.kind;root.classList.toggle('field-resolved',e.status==='resolved');root.classList.toggle('field-cleared',e.choice==='ability');root.classList.toggle('field-carried',e.choice==='carry');
  const file=getGymData()[Math.min(GameState.bossesDefeated||0,7)].bgImage;
  root.querySelector('.field-background').style.backgroundImage=`url('assets/backgrounds/${file}')`;
  root.querySelector('h2').textContent=d.title;
  const scene=root.querySelector('.field-scene');scene.innerHTML=this.prop(d.prop);
  if(e.kind==='owner'){scene.innerHTML='<img class="field-owner" src="assets/trainer_stand.png" alt="" onerror="this.src=\'assets/oak.png\';this.onerror=null">';}
  if(e.actor){const p=GameState.party.find(p=>p.id===e.actor);if(p){const img=document.createElement('img');img.className='field-partner';img.src=p.spriteUrl;img.alt='';scene.appendChild(img);}}
  const actions=root.querySelector('.field-actions'),requirement=root.querySelector('.field-requirement');actions.replaceChildren();requirement.textContent='';
  root.querySelector('.field-description').textContent=e.result||(e.kind==='owner'?`“Have you seen my ${e.item||'backpack'}? I must have left it beside the path!”`:d.text);
  if(e.status==='resolved')actions.appendChild(this.button(this.foot(),'Continue',()=>{e.status='done';saveGame();MapEngine._showNav();}));
  else if(['backpack','scarf','charm'].includes(e.kind)){
   actions.append(this.button(this.prop(d.prop),'Carry it',()=>this.resolve(e,'carry')),this.button(this.foot(),'Leave it',()=>this.resolve(e,'skip')));
  }else if(e.kind==='owner'){
   actions.appendChild(this.button(this.prop(this.specs[e.item||'backpack'].prop),GameState.exploration.carrying?'Return '+(e.item||'backpack'):'Talk to Ari',()=>this.resolve(e,GameState.exploration.carrying?'return':'skip')));
  }else{
   const candidates=this.eligible(d.ability),rule=this.abilities[d.ability];
   requirement.textContent=candidates.length?'Ready: '+candidates.map(p=>p.name).join(', '):`Requires ${rule.label==='Cut'?'a partner with cutting claws, blades or vines':d.ability==='strength'?'a strong partner':rule.type+' ability'} — choose the alternative to continue.`;
   actions.append(this.button(this.icon(rule.type),rule.label,()=>this.choose(e,candidates),!candidates.length),this.button(this.foot(),d.alt,()=>this.resolve(e,'alternative')));
  }
  showScreen('field');if(!this.panelObserver){this.panelObserver=new ResizeObserver(entries=>{for(const entry of entries)root.style.setProperty('--field-panel-h',entry.target.offsetHeight+'px');});this.panelObserver.observe(root.querySelector('.field-panel'));}saveGame();
 },
 choose(e,candidates){if(e.status!=='pending')return;if(candidates.length===1){this.resolve(e,'ability',candidates[0]);return;}const root=document.getElementById('screen-field'),actions=root.querySelector('.field-actions');actions.replaceChildren();root.querySelector('.field-requirement').textContent='Choose your helper';for(const p of candidates)actions.appendChild(this.button(this.icon(this.abilities[this.specs[e.kind].ability].type),p.name,()=>this.resolve(e,'ability',p)));actions.appendChild(this.button(this.foot(),'Back',()=>this.show(e)));},
 resolve(e,choice,p){
  if(e!==this.current||e.status!=='pending')return;
  const d=this.specs[e.kind],s=GameState.exploration;
  if(choice==='ability'&&!this.eligible(d.ability).includes(p))return;
  e.status='resolved';e.choice=choice;let gold=0,heal=0;
  if(choice==='carry'){s.carrying=true;s.item=e.kind;e.result=`You pick up Ari’s ${e.kind}. Watch for a searching trainer in two or three encounters.`;}
  else if(choice==='return'){s.carrying=false;gold=20;e.result='“You found it! Thank you for looking after my things.” Ari gives you 20 gold and directions onward.';}
  else if(e.kind==='owner'){e.result='Ari thanks you for the directions and heads back to look for the lost item.';}
  else if(['backpack','scarf','charm'].includes(e.kind)){e.result='You leave the item in place and remember where you saw it.';}
  else if(choice==='ability'){e.actor=p.id;gold=d.gold||0;heal=d.heal||0;e.result=p.name+' '+d.success;}
  else if(['machine','light'].includes(e.kind)){gold=6;e.result='You turn the hand crank and restore power. The crew thanks you with 6 gold.';}
  else if(e.kind==='fire'){heal=8;e.result='You use the traveller’s dry tinder to strengthen the fire. Everyone warms up: +8 HP per Pokémon.';}
  else e.result='You continue along the clear route. Your journey carries on.';
  GameState.gold=(GameState.gold||0)+gold;if(heal)GameState.party.forEach(p=>{if(p.hp>0)p.hp=Math.min(p.maxHp,p.hp+heal);});
  // State and reward are committed together before presentation; repeats cannot pay twice.
  e.reward={gold,heal};saveGame();SoundEngine.playCorrect();this.show(e);
 },
 install(){
  const nav=MapEngine._showNav;MapEngine._showNav=function(){nav.call(this);Exploration.maybe();};
  const portraits={cooking:'brock',fishing:'misty',jigglypuff_node:'jigglypuff',surge_node:'ltsurge',erika_node:'erika',ninja_node:'koga',sabrina_node:'sabrina',blaine_node:'blaine',giovanni_node:'giovanni',jenny_node:'officer_jenny',falkner_node:'falkner',bugsy_node:'bugsy',whitney_node:'whitney',morty_node:'morty',jasmine_node:'jasmine',pryce_node:'pryce',clair_node:'clair',chuck_node:'chuck',togepi_node:'togepi',wobbuffet_node:'wobbuffet'};for(const [key,file]of Object.entries(portraits)){ARROW_LABELS[key]={...(ARROW_LABELS[key]||{label:file.replaceAll('_',' ')}),icon:'assets/'+file+'.png'};}ARROW_LABELS.training.icon='assets/battle_icon.png';ARROW_LABELS.mystery.icon='assets/catch_icon.png';ARROW_LABELS.challenge.icon='assets/boss_icon.png';
  const host=document.getElementById('nav-choices');const label=document.createElement('p');label.className='route-prompt';label.textContent='Choose your next path';host.before(label);
 }
};


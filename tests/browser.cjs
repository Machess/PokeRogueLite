const OUTPUT_DIR=require('node:fs').mkdtempSync(require('node:path').join(require('node:os').tmpdir(),'poketrials-check-'));
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict'),fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE} : {}),args:['--no-sandbox','--disable-gpu']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR:',e.stack)});
 await page.route(/^https?:/,r=>r.abort());
 await page.goto(require('node:url').pathToFileURL(require('node:path').join(__dirname,'../index.html')).href);
 await page.evaluate(async()=>{await Game.startNew(true);GameState.trainerName='Test';GameState.trainerAge=10;GameState.difficultyTier=2;await Game.confirmStarter(STARTERS[1]);});
 await page.waitForTimeout(700);
 assert.equal(await page.locator('.screen.active').count(),1);
 assert.equal(await page.locator('.screen.active').getAttribute('id'),'screen-map');
 await page.screenshot({path:OUTPUT_DIR+'/map.png'});
 const decks=await page.evaluate(()=>[4,37,58,155].map(id=>{const d=OFFLINE_POKEMON[id];const p=makePokemon(id,5,d.sprites.front_default,capitalize(d.name),'fire');return{id,attacks:p.deck.map(c=>c.name),matched:p.deck.filter(c=>c.source).length};}));console.log('Species decks:',JSON.stringify(decks));
 const tests=await page.evaluate(()=>{
  const out=[];for(const [special,wanted,key] of [['recover',70,'hp'],['shield_50',55,'shield'],['leer_free',15,'oppDefDebuff']]){
   const st={player:{hp:20,maxHp:100},opp:{hp:500,type:'normal'},shield:0,hand:[],statusEffects:{player:[],opp:[]}};
   CombatRules.apply({name:special,power:0,special},st,{typeMultiplier:()=>1});out.push({special,value:key==='hp'?st.player.hp:st[key],wanted});
  }
  return out;
 });for(const t of tests)assert.equal(t.value,t.wanted,t.special);
 await page.evaluate(()=>{
  const opp=makePokemon(19,5,OFFLINE_POKEMON[19].sprites.front_default,'Rattata','normal');opp.hp=1000;opp.maxHp=1000;
  GameState.currentNodeIndex=GameState.map[0].idx;BattleEngine._isTrainerBattle=false;showScreen('battle');BattleEngine._initBattle(GameState.party[0],opp,false);
 });await page.waitForTimeout(700);await page.screenshot({path:OUTPUT_DIR+'/battle.png'});
 assert.match(await page.locator('#screen-battle .enemy-intent').textContent(),/NEXT/);
 const preview=await page.evaluate(()=>{const st=BattleEngine.state;st.hand=[CombatRules.normalize({id:'test',name:'Water Gun',power:42,cost:1,type:'water'})];st.rainTurns=3;st.oppDefDebuff=15;const before=st.opp.hp,pred=previewDamage(st.hand[0],st);BattleEngine.playCard(0);return{pred,actual:before-st.opp.hp};});assert.equal(preview.pred,preview.actual);
 const saved=await page.evaluate(()=>{SaveManager.captureBattle(false);return{state:JSON.stringify(BattleEngine.state),intent:JSON.stringify(BattleEngine.state.intent),energy:BattleEngine.state.energy};});
 await page.reload();await page.evaluate(()=>Game.continueGame());await page.waitForTimeout(650);
 const restored=await page.evaluate(()=>({intent:JSON.stringify(BattleEngine.state.intent),energy:BattleEngine.state.energy}));assert.equal(restored.intent,saved.intent);assert.equal(restored.energy,saved.energy);
 await page.evaluate(()=>{BattleEngine.state.actionsThisTurn=1;BattleEngine.endTurn();});
 assert.equal(await page.evaluate(()=>BattleEngine.state.hand.length),5);
 // Save and reopen a boss with an announced pattern.
 await page.evaluate(async()=>{SaveManager.complete();const node=GameState.map.find(n=>n.type==='boss');GameState.currentNodeIndex=node.idx;await BossEngine.start(node);BossEngine.startBattle();});await page.waitForTimeout(700);
 assert.match(await page.locator('#boss-battle-area .enemy-intent').textContent(),/Brace/);
 await page.screenshot({path:OUTPUT_DIR+'/boss.png'});
 await page.evaluate(()=>{BossEngine.bState.actionsThisTurn=1;BossEngine.endTurn();SaveManager.captureBattle(true);});
 assert.equal(await page.evaluate(()=>BossEngine.bState.oppShield),30);
 await page.reload();await page.evaluate(()=>Game.continueGame());await page.waitForTimeout(650);
 assert.equal(await page.locator('.screen.active').getAttribute('id'),'screen-boss');
 assert.equal(await page.evaluate(()=>BossEngine.bState.oppShield),30);
 // Rewards do not offer unusable duplicates; their checkpoint survives reload.
 await page.evaluate(()=>{BattleEngine._battleOver=true;SaveManager.complete();showScreen('map');CardReward.show(25);});await page.waitForTimeout(600);
 assert.equal(await page.evaluate(()=>CardReward._pool.every(c=>CardReward.deck().filter(x=>x.id===c.id).length<2)),true);
 await page.screenshot({path:OUTPUT_DIR+'/rewards.png'});
 await page.reload();await page.evaluate(()=>Game.continueGame());await page.waitForTimeout(650);
 assert.equal(await page.locator('#card-reward-screen').evaluate(e=>e.classList.contains('hidden')),false);
 const before=await page.evaluate(()=>CardReward.deck().length);await page.evaluate(()=>CardReward.pickCard(0));assert.equal(await page.evaluate(()=>getActivePokemon().deck.length),before+1);
 await page.setViewportSize({width:960,height:600});await page.waitForTimeout(500);await page.screenshot({path:OUTPUT_DIR+'/tablet.png'});
 // Directional navigation is visibly animated, then enters one node exactly once.
 await page.evaluate(()=>{GameState.map[0].type='heal';GameState.map[0].unlocked=true;GameState.map[0].done=false;GameState.map[0].bypassed=false;MapEngine.visitNode(GameState.map[0]);});
 await page.waitForTimeout(300);assert.equal(await page.locator('#screen-map').evaluate(e=>e.classList.contains('is-travelling')),true);await page.screenshot({path:OUTPUT_DIR+'/travel.png'});
 await page.waitForTimeout(1200);assert.equal(await page.locator('.screen.active').getAttribute('id'),'screen-heal');
 console.log('Browser checks passed. Errors:',JSON.stringify(errors));assert.deepEqual(errors,[]);
 await browser.close();
})().catch(e=>{console.error(e.stack);process.exit(1)});

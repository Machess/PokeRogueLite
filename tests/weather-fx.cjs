const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-gpu']});
 const page=await browser.newPage({viewport:{width:600,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
 await page.goto(require('node:url').pathToFileURL(path.join(__dirname,'../index.html')).href);
 await page.evaluate(async()=>{AssetPreloader.ready=true;await Game.startNew(true);await Game.confirmStarter(STARTERS[0]);});await page.waitForTimeout(700);
 await page.evaluate(()=>{const p=GameState.party[0],o=makePokemon(18,20,'assets/sprites/18.png','Pidgeot','flying');setBattleBg('grass',false);showScreen('battle');BattleEngine._initBattle(p,o,false);BattleEngine._render();});await page.waitForTimeout(400);
 const out=process.env.UI_SCREENSHOTS||'/tmp/weather-fx';fs.mkdirSync(out,{recursive:true});
 const draw=async(name,type,cost,reverse=false)=>page.evaluate(({name,type,cost,reverse})=>{
  window.fxRAF=requestAnimationFrame;window.fxCancel=cancelAnimationFrame;
  window.requestAnimationFrame=fn=>{window.fxFrame=fn;return 1234567;};window.cancelAnimationFrame=()=>{};
  applyHitAnimation(reverse?'opp-sprite':'player-sprite',reverse?'player-sprite':'opp-sprite',type,cost,name);
  fxFrame(performance.now()+510);
  const c=AttackFX.canvas,ctx=c.getContext('2d'),d=ctx.getImageData(0,0,c.width,c.height).data;
  let count=0;for(let i=3;i<d.length;i+=4)if(d[i]>20)count++;
  return {effect:c.dataset.effect,count,energy:c.dataset.energy,animations:AttackFX.animations.length};
 },{name,type,cost,reverse});
 const clear=async()=>page.evaluate(()=>{AttackFX.cancel();window.requestAnimationFrame=fxRAF;window.cancelAnimationFrame=fxCancel;});
 for(const [name,type,kind] of [['ThunderShock','electric','lightning'],['Gust','flying','wind'],['Twister','dragon','twister']]){
  const sizes=[];
  for(const cost of [1,2,3]){const r=await draw(name,type,cost);assert.equal(r.effect,kind);sizes.push(r.count);await page.screenshot({path:path.join(out,kind+'-'+cost+'.png')});await clear();}
  assert(sizes[1]>sizes[0]*1.1&&sizes[2]>sizes[1]*1.1,name+JSON.stringify(sizes));console.log(name+' painted pixels by cost: '+sizes.join(', '));
 }
 for(const [name,type,kind] of [['Hurricane','flying','twister'],['Icy Wind','ice','wind'],['Volt Tackle','electric','tackle'],['Thunder Punch','electric','punch'],['Zap Cannon','electric','beam'],['Bubble Beam','water','bubbles'],['Vine Whip','grass','whip'],['Flamethrower','fire','flame']]){assert.equal((await draw(name,type,3,true)).effect,kind);await clear();}
 // Replacement creates one canvas, then screen exit removes it.
 await page.evaluate(()=>{AttackFX.play('player-sprite','opp-sprite','electric',1,'Spark');AttackFX.play('opp-sprite','player-sprite','dragon',3,'Twister');});assert.equal(await page.locator('.move-fx').count(),1);await page.evaluate(()=>showScreen('map'));await page.waitForTimeout(700);assert.equal(await page.locator('.move-fx').count(),0);
 await page.evaluate(()=>showScreen('battle'));await page.waitForTimeout(650);await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>AttackFX.play('player-sprite','opp-sprite','electric',3,'Thunder'));await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>AttackFX.animations.length),0);await page.waitForTimeout(200);assert.equal(await page.locator('.move-fx').count(),0);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>AttackFX.play('player-sprite','opp-sprite','flying',2,'Gust'));await page.waitForTimeout(1000);assert.equal(await page.locator('.move-fx').count(),0);
 assert.deepEqual(errors,[]);await browser.close();console.log('Lightning/wind scaling, reverse direction, existing styles, replacement, exit, completion and reduced-motion checks passed.');
})().catch(e=>{console.error(e);process.exit(1)});

const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const out=process.env.UI_SCREENSHOTS||'/tmp/poketrials-polish';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-gpu']});
 const page=await browser.newPage({viewport:{width:960,height:600},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(require('node:url').pathToFileURL(path.join(__dirname,'../index.html')).href);
 await page.evaluate(async()=>{AssetPreloader.ready=true;await Game.startNew(true);GameState.trainerName='Visual';GameState.difficultyTier=2;await Game.confirmStarter(STARTERS[0]);GameState.gold=1000;});
 for(const [w,h] of [[960,600],[600,960]]){
  await page.setViewportSize({width:w,height:h});await page.evaluate(()=>ShopEngine.start({}));await page.waitForTimeout(700);await page.screenshot({path:out+`/shop-${w}.png`});
  const before=await page.evaluate(()=>GameState.gold);const buy=page.locator('.shop-buy-btn:not(:disabled)').first();const id=await buy.getAttribute('data-id');const price=await page.evaluate(id=>getScaledPrice(SHOP_ITEMS.find(i=>i.id===id).price),id);await buy.click();assert.equal(await page.evaluate(()=>GameState.gold),before-price);
  await page.getByRole('button',{name:'Held items',exact:true}).click();assert.equal(await page.locator('.shop-section-header').first().textContent(),'Held Items');
  await page.evaluate(()=>{OakSortEngine._rule=OAK_RULES[0];OakSortEngine._round=0;OakSortEngine._hits=0;OakSortEngine._queue=OAK_POKEMON.filter(p=>['fire','water','grass'].includes(p.type)).slice(0,8);OakSortEngine._sprites=Object.fromEntries(OAK_POKEMON.map(p=>[p.id,'assets/sprites/'+p.id+'.png']));OakSortEngine._showRound();});await page.waitForTimeout(300);await page.screenshot({path:out+`/oak-${w}.png`});
  await page.evaluate(()=>{const poke=OakSortEngine._queue[0],i=OakSortEngine._rule.buckets.findIndex(b=>b[0]===poke.type);document.querySelectorAll('.oak-basket')[i].click();});assert.equal(await page.evaluate(()=>OakSortEngine._hits),1);await page.evaluate(()=>OakSortEngine._timeouts.forEach(clearTimeout));
  for(const type of ['jessie','james','meowth']){await page.evaluate(t=>{TeamRocketChallenge._type=t;TeamRocketChallenge['_show'+t[0].toUpperCase()+t.slice(1)]();},type);await page.waitForTimeout(650);await page.screenshot({path:out+`/${type}-${w}.png`});assert.equal(await page.evaluate(()=>document.querySelector('.challenge-panel').scrollWidth>innerWidth),false);}
 }
 await page.setViewportSize({width:960,height:600});await page.evaluate(()=>{const p=GameState.party[0],o=makePokemon(18,20,'assets/sprites/18.png','Pidgeot','flying');setBattleBg('grass',false);showScreen('battle');BattleEngine._initBattle(p,o,false);BattleEngine._render();});await page.waitForTimeout(400);
 for(const [name,type,effect] of [['Bubble Beam','water','bubbles'],['Hyper Beam','normal','beam'],['Flamethrower','fire','flame'],['Vine Whip','grass','whip'],['Mega Punch','fighting','punch'],['Mega Kick','fighting','kick'],['Shadow Ball','ghost','ghost'],['Psychic','psychic','psychic'],['Scratch','normal','claws'],['Tackle','normal','tackle']]){
  await page.evaluate(({name,type})=>applyHitAnimation('player-sprite','opp-sprite',type,1,name),{name,type});await page.waitForTimeout(450);assert.equal(await page.locator('.move-fx').getAttribute('data-effect'),effect);await page.screenshot({path:out+'/'+effect+'.png'});await page.waitForTimeout(450);assert.equal(await page.locator('.move-fx').count(),0);
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>applyHitAnimation('player-sprite','opp-sprite','water',1,'Bubble'));await page.waitForTimeout(300);assert.equal(await page.locator('.move-fx').count(),0);
 assert.deepEqual(errors,[]);console.log('Polish checks passed: shop categories, Oak scoring, Rocket layouts, ten move effects and reduced-motion cleanup.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const root=path.join(__dirname,'..'),url=require('node:url').pathToFileURL(path.join(root,'index.html')).href;
const out=process.env.UI_SCREENSHOTS||fs.mkdtempSync('/tmp/poketrials-journey-');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--disable-gpu']});
 const context=await browser.newContext({viewport:{width:960,height:600},hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(url);
 await page.evaluate(async()=>{await Game.startNew(true);GameState.trainerName='Journey';GameState.trainerAge=10;GameState.difficultyTier=2;await Game.confirmStarter(STARTERS[0]);});await page.waitForTimeout(650);
 assert.equal(await page.locator('.travel-player').count(),0);assert.equal(await page.locator('#region-map-toggle').count(),1);assert.equal(await page.evaluate(()=>AssetPreloader.ready),true);
 assert.ok(await page.evaluate(()=>AssetPreloader.report.failed>0),'Offline preflight reports unavailable art');
 await page.screenshot({path:out+'/overworld.png'});
 await page.locator('#region-map-toggle').click();await page.screenshot({path:out+'/kanto.png'});assert.equal(await page.locator('.region-pin.large').count(),1);
 await page.locator('[data-region="johto"]').click();assert.match(await page.locator('.region-location').textContent(),/No active run/);assert.equal(await page.locator('.region-pin.large').count(),0);
 await page.evaluate(()=>{GameState.region='johto';GameState.bossesDefeated=2;RegionMap.render('johto');});await page.screenshot({path:out+'/johto.png'});assert.equal(await page.locator('.region-pin.large').count(),1);assert.match(await page.locator('.region-location').textContent(),/Goldenrod/);
 const points=await page.evaluate(()=>{GameState.region='kanto';GameState.bossesDefeated=0;const first=RegionMap.location().point;GameState.map.filter(n=>n.row<4).forEach(n=>n.done=true);return[first,RegionMap.location().point];});assert.notDeepEqual(points[0],points[1],'Marker advances with completed encounters');
 await page.setViewportSize({width:600,height:960});await page.evaluate(()=>RegionMap.render('kanto'));await page.screenshot({path:out+'/region-portrait.png'});await page.locator('.region-map-close').click();
 await page.evaluate(()=>CardReward.show(29));await page.waitForTimeout(100);
 for(const mode of ['add','upgrade','deck']){
  await page.evaluate(m=>{CardReward._mode=m;CardReward.render();},mode);assert.equal(await page.locator('#cr-cards-grid .inspect-card').count(),0);const flips=page.locator('#cr-cards-grid .card-flip-trigger');if(await flips.count()){
   const before=await page.evaluate(()=>JSON.stringify(CardReward.deck()));await flips.first().click();await page.waitForTimeout(380);assert.equal(await page.locator('.card-flip-dialog').count(),1);assert.equal(await page.locator('#card-inspector').count(),0);await page.locator('.card-flip-stage').click();await page.waitForTimeout(380);assert.equal(await page.evaluate(()=>JSON.stringify(CardReward.deck())),before);
  }
 }
 await page.screenshot({path:out+'/reward-flips.png'});await page.evaluate(()=>CardReward.close());
 // Capture must run once even if the throw is triggered twice. Master Ball use and party update remain real.
 await page.setViewportSize({width:960,height:600});await page.evaluate(async()=>{GameState.items=[{id:'master_ball',count:2}];await CatchEngine.start(GameState.map[0],'common');});await page.waitForTimeout(3300);
 const before=await page.evaluate(()=>GameState.party.length);
 await page.evaluate(()=>{CatchEngine._selectedBall='masterball';window.captureCalls=[];const original=CatchEngine._showResult;CatchEngine._showResult=function(...args){window.captureCalls.push(args[2]);return original.apply(this,args);};CatchEngine.throwBall();CatchEngine.throwBall();});
 await page.waitForFunction(()=>document.querySelector('.capture-cinematic')?.dataset.phase==='landing');await page.screenshot({path:out+'/capture-impact.png'});
 await page.waitForFunction(()=>document.querySelector('.capture-cinematic')?.dataset.phase==='locked');await page.waitForTimeout(220);await page.screenshot({path:out+'/capture-lock.png'});
 await page.waitForFunction(()=>window.captureCalls.length===1);await page.waitForTimeout(750);assert.deepEqual(await page.evaluate(()=>window.captureCalls),[true]);assert.equal(await page.evaluate(()=>GameState.party.length),before+1);assert.equal(await page.evaluate(()=>GameState.items.find(x=>x.id==='master_ball')?.count),1);
 await page.locator('#pdx-close-btn').click();
 // Reduced-motion breakout preserves failure and cleans up presentation.
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(async()=>{await CatchEngine.start(GameState.map[0],'common');});await page.waitForTimeout(3300);await page.evaluate(()=>{const random=Math.random;Math.random=()=>.99;CatchEngine.throwBall();Math.random=random;});await page.waitForFunction(()=>window.captureCalls.length===2);assert.deepEqual(await page.evaluate(()=>window.captureCalls),[true,false]);assert.equal(await page.locator('.capture-cinematic').count(),0);
 // Card blob caching: a first preflight fetches once; a reload uses IndexedDB with the network blocked.
 const cachePage=await context.newPage();cachePage.on('pageerror',e=>errors.push(e.message));let downloads=0;
 const image=fs.readFileSync(path.join(root,'assets/sprites/1.png'));
 await cachePage.route('https://art.test/**',async r=>{downloads++;await new Promise(resolve=>setTimeout(resolve,1000));return r.fulfill({status:200,contentType:'image/png',headers:{'access-control-allow-origin':'*'},body:image});});await cachePage.goto(url);
 const configure=()=>{ASSET_MANIFEST.images=[];ASSET_MANIFEST.audio=[];AssetPreloader.sources=()=>[{id:'fixture-a',image:'https://art.test/a.png',pokemon:'Bulbasaur'}];};
 await cachePage.evaluate(configure);await cachePage.evaluate(()=>{window.preloadCheck=AssetPreloader.ensure();});await cachePage.waitForTimeout(100);await cachePage.screenshot({path:out+'/pokeball-loader.png'});await cachePage.evaluate(()=>window.preloadCheck);assert.equal(downloads,1);assert.equal(await cachePage.evaluate(()=>AssetPreloader.report.cached),1);
 await cachePage.reload();await cachePage.evaluate(configure);await cachePage.evaluate(()=>AssetPreloader.ensure());assert.equal(downloads,1,'Cached restart makes no image request');
 assert.equal(await cachePage.evaluate(async()=>{const a=await AssetPreloader.art({image:'https://art.test/a.png'});const isBlob=a.url.startsWith('blob:');a.release();return isBlob;}),true);
 await cachePage.evaluate(()=>{const card={name:'Vine Whip',type:'grass',power:45,cost:1,source:{image:'https://art.test/a.png',pokemon:'Bulbasaur'}};const tile=CardReward.tile(card);document.body.appendChild(tile);tile.querySelector('.card-flip-trigger').click();});await cachePage.waitForFunction(()=>document.querySelector('.flip-back img')?.complete&&!document.querySelector('.flip-back img').hidden);assert.equal(downloads,1,'Flipping a cached reward makes no request');await cachePage.keyboard.press('Escape');
 // Cancellation never delivers an old catch result onto a new screen.
 await page.evaluate(async()=>{await CatchEngine.start(GameState.map[0],'common');});await page.waitForTimeout(3300);await page.evaluate(()=>{CatchEngine.throwBall();showScreen('map');});await page.waitForTimeout(700);assert.equal(await page.locator('.capture-cinematic').count(),0);assert.equal(await page.evaluate(()=>window.captureCalls.length),2);
 await page.evaluate(()=>Game.goToMenu());await page.waitForTimeout(650);await page.screenshot({path:out+'/menu.png'});
 assert.deepEqual(errors,[]);console.log('Journey checks passed: reward flips, preload cache, maps, capture outcomes and cancellation. Screenshots: '+out);await browser.close();
})().catch(e=>{console.error(e.stack);process.exit(1)});

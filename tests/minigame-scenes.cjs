/* Answer-driven scenery and tablet layout checks. Uses only local assets. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-gpu']});
 const page=await browser.newPage({viewport:{width:600,height:960},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:/,r=>r.abort());await page.goto(require('node:url').pathToFileURL(path.join(__dirname,'../index.html')).href);
 await page.evaluate(async()=>{AssetPreloader.ready=true;await Game.startNew(true);GameState.difficultyTier=2;await Game.confirmStarter(STARTERS[0]);getSkillTier=()=>GameState.difficultyTier;});await page.waitForTimeout(700);
 const start=async(name,tier=2)=>{await page.evaluate(async({name,tier})=>{GameState.difficultyTier=tier;const e=eval(name);await e.start({idx:0,type:'test'});if(e.startGame)e.startGame();},{name,tier});await page.waitForTimeout(450);if(await page.locator('.minigame-guide').count())await page.locator('.minigame-guide button').click();};
 const out=process.env.UI_SCREENSHOTS||'/tmp/minigame-scenes';fs.mkdirSync(out,{recursive:true});
 const shot=async name=>{await page.evaluate(()=>{document.querySelector('.screen.active').scrollTop=0;});await page.screenshot({path:path.join(out,name+'.png')});};
 await start('SurgeEngine');assert.equal(await page.locator('.mg-scene-surge').getAttribute('data-power'),'0');await shot('surge-off');
 for(let score=1;score<=3;score++){
  await page.evaluate(()=>{const a=SurgeEngine._scenarios[SurgeEngine._round].correct;SurgeEngine._answer(a);SurgeEngine._answer(a);});
  assert.equal(await page.evaluate(()=>SurgeEngine._score),score);assert.equal(await page.locator('.mg-power-meter').getAttribute('aria-valuenow'),String(score));
  await page.waitForTimeout(750);await shot('surge-power-'+score);if(score<3)await page.evaluate(()=>SurgeEngine.nextRound());
 }
 await start('SurgeEngine');await page.evaluate(()=>SurgeEngine._answer('wrong'));assert.equal(await page.locator('.mg-scene-surge').getAttribute('data-power'),'0');
 await start('OakSortEngine');assert.equal(await page.locator('.mg-scene-oak .oak-belt').count(),1);await shot('oak');
 await page.evaluate(()=>{const e=OakSortEngine,p=e._queue[e._round],i=e._rule.buckets.findIndex(b=>b[0]===p[e._rule.key]);document.querySelectorAll('.oak-basket')[i].click();});assert.equal(await page.evaluate(()=>OakSortEngine._hits),1);await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>OakSortEngine._round),1);assert.equal(await page.locator('.mg-scene-oak .oak-belt').count(),1);
 await start('SnorlaxEngine',1);assert.equal(await page.locator('.mg-scale-stage').count(),1);await page.locator('.snx-pick').first().click();assert.match(await page.locator('.mg-scale-reading').textContent(),/kg/);await shot('snorlax-choice');
 await start('SnorlaxEngine',2);await page.locator('.snx-shelf-item').first().click();assert.match(await page.locator('.mg-scale-reading').textContent(),/Selected: [1-9]/);await shot('snorlax-scale');
 for(const size of [[600,960],[800,1280],[360,640],[960,600]]){
  await page.setViewportSize({width:size[0],height:size[1]});
  for(const engine of ['SurgeEngine','SnorlaxEngine','OakSortEngine','ErikaEngine']){
   await start(engine);await page.waitForTimeout(500);
   const layout=await page.evaluate(()=>{const root=document.getElementById('screen-challenge'),stage=root.querySelector('.mg-scene,.mg-scale-stage'),r=stage.getBoundingClientRect();return {left:r.left,right:r.right,width:innerWidth,scroll:document.documentElement.scrollWidth};});
   assert(layout.left>=0&&layout.right<=size[0]+1,engine+JSON.stringify(layout));assert(layout.scroll<=size[0]+1,JSON.stringify(layout));
   await shot(engine+'-'+size[0]);
   if(engine==='ErikaEngine'){assert(await page.locator('.erika-target-label').evaluate(e=>e.getBoundingClientRect().top>=e.closest('.mg-scene').getBoundingClientRect().top),'potion target stays inside stage');assert.equal(await page.locator('.mg-scene-erika .erika-target-area').count(),1);await page.locator('.mg-recipe-guide summary').click();assert(await page.locator('.erika-recipe-card').isVisible());}
  }
 }
 // Boundary counts used to make Pryce's random option loop hang forever.
 await page.evaluate(()=>{
  for(const tier of [2,3])for(let target=1;target<=(tier===2?6:8);target++){
   GameState.difficultyTier=tier;PryceEngine._counts={circle:target};
   const cv=document.createElement('div'),field=document.createElement('div');
   PryceEngine._choiceMode(cv,field,'circle',{emoji:'○'});
   const values=[...cv.querySelectorAll('button')].map(b=>Number(b.textContent));
   if(values.length!==5||new Set(values).size!==5||!values.includes(target))throw Error('Invalid ice count options');
  }
 });
 await page.emulateMedia({reducedMotion:'reduce'});await start('SnorlaxEngine');assert.equal(await page.locator('.snx-beam').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
 await page.evaluate(()=>showScreen('map'));assert.deepEqual(errors,[]);await browser.close();console.log('Illustrated scenes passed: bulb progression/wrong answer/double tap, Oak sorting, scale feedback, four viewport sizes, reduced motion. '+out);
})().catch(e=>{console.error(e);process.exit(1)});

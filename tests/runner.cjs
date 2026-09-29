const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-gpu']});
 const page=await browser.newPage({viewport:{width:600,height:960},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
 await page.goto(require('node:url').pathToFileURL(path.join(__dirname,'../index.html')).href);
 await page.evaluate(async()=>{AssetPreloader.ready=true;await Game.startNew(true);await Game.confirmStarter(STARTERS[0]);MiniGameSession.seen.add('runner-active');});await page.waitForTimeout(600);
 const start=async(tier=2)=>{await page.evaluate(async tier=>{GameState.difficultyTier=tier;await RocketRunnerEngine.start({idx:0});},tier);await page.waitForTimeout(350);};
 const begin=async()=>{await page.locator('#runner-start-btn').click();};
 const shots=process.env.UI_SCREENSHOTS||'/tmp/runner-shots';fs.mkdirSync(shots,{recursive:true});
 await start();await page.screenshot({path:shots+'/ready.png'});await begin();await page.waitForTimeout(450);
 assert(await page.evaluate(()=>Object.values(RocketRunnerEngine._images).every(Boolean)),'all artwork loaded locally');
 // Portrait stage occupies most of viewport; dock stays fully visible.
 for(const [w,h] of [[600,960],[800,1280],[360,640],[960,600]]){
  await page.setViewportSize({width:w,height:h});await page.waitForTimeout(200);
  const r=await page.evaluate(()=>{const a=document.querySelector('.dash-stage').getBoundingClientRect(),b=document.querySelector('.dash-controls').getBoundingClientRect();return {height:a.height,bottom:b.bottom,width:document.documentElement.scrollWidth,view:innerWidth};});
  assert(r.bottom<=h+1,JSON.stringify(r));assert(r.width<=w);if(h>w)assert(r.height>=h*.65,JSON.stringify(r));
  await page.screenshot({path:shots+`/layout-${w}.png`});
 }
 await page.setViewportSize({width:600,height:960});
 // Deterministic simulation verifies hold height and input release.
 const jumps=await page.evaluate(()=>{
  const e=RocketRunnerEngine;MiniGameSession.cancelFrame(e._raf);
  const jump=held=>{e._state='run';e._running=true;e._grounded=true;e._y=0;e._vy=0;e._time=0;e._obstacles=[];e._coins=[];e._nextObstacle=1e8;e._dist=0;e._held=held;e._jump();let peak=0;for(let i=0;i<160;i++){e._step(1/120);peak=Math.max(peak,-e._y);}return peak;};
  return [jump(false),jump(true)];
 });assert(jumps[1]>jumps[0]+30,JSON.stringify(jumps));
 await start();await begin();await page.locator('#dash-jump').dispatchEvent('pointerdown',{pointerId:4,button:0});assert(await page.evaluate(()=>RocketRunnerEngine._held));await page.locator('#dash-jump').dispatchEvent('pointerup',{pointerId:4,button:0});assert.equal(await page.evaluate(()=>RocketRunnerEngine._held),false);
 // Pause stops distance, resume avoids advancing by paused duration.
 await page.locator('.dash-pause').click();const paused=await page.evaluate(()=>RocketRunnerEngine._dist);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>RocketRunnerEngine._dist),paused);await page.getByRole('button',{name:'Ready to play'}).click();await page.waitForTimeout(100);assert((await page.evaluate(()=>RocketRunnerEngine._dist))-paused<40);
 // Every tier: many generated encounters are clearable by a well-timed held jump.
 const play=await page.evaluate(()=>{
  const e=RocketRunnerEngine;MiniGameSession.cancelFrame(e._raf);const outcomes=[];
  for(const tier of [1,2,3]){
   e._cfg={speed:[0,185,215,245][tier],goal:12000,grav:1250,jump:455,tier};e._goal=12000;e._speed=e._cfg.speed;e._dist=0;e._nextObstacle=400;e._obstacles=[];e._coins=[];e._particles=[];e._grounded=true;e._y=0;e._vy=0;e._time=0;e._elapsed=0;e._state='run';e._running=true;e._held=true;e._jumpQueued=0;
   for(let i=0;i<10000&&e._state==='run';i++){
    const o=e._obstacles.find(o=>o.x+o.w>134);if(o&&e._grounded&&o.x-150<e._speed*.32)e._jump();
    e._step(1/120);
   }
   outcomes.push({tier,state:e._state,dist:e._dist});MiniGameSession.timers.forEach((_,id)=>MiniGameSession.clear(id));
  }return outcomes;
 });assert(play.every(o=>o.state==='win'),JSON.stringify(play));
 // Showcase real renderer mid-jump, with a single pit and safe landing.
 await start();await begin();await page.evaluate(()=>{const e=RocketRunnerEngine;MiniGameSession.cancelFrame(e._raf);e._obstacles=[{kind:'hole',x:220,w:100},{kind:'poke',x:490,w:62,h:57,art:'koffing'}];e._coins=[0,1,2,3,4].map(i=>({x:185+i*42,alt:65+Math.sin(i/4*Math.PI)*90}));e._grounded=false;e._y=-90;e._vy=-60;e._draw();});await page.screenshot({path:shots+'/jump.png'});
 // Collision ends exactly once and awards/penalties cannot duplicate.
 const loss=await page.evaluate(()=>{const e=RocketRunnerEngine;e._grounded=true;e._y=0;e._obstacles=[{kind:'poke',x:140,w:62,h:57}];e._step(.01);return e._state;});assert.equal(loss,'fall');await page.waitForTimeout(950);
 const gold=await page.evaluate(()=>GameState.gold);await page.evaluate(()=>RocketRunnerEngine._finish(false));assert.equal(await page.evaluate(()=>GameState.gold),gold);
 await page.evaluate(()=>{document.getElementById('overlay').classList.add('hidden');document.getElementById('results-card-overlay')?.remove();});
 await start();await begin();await page.evaluate(()=>showScreen('map'));const dist=await page.evaluate(()=>RocketRunnerEngine._dist);await page.keyboard.press('Space');await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>RocketRunnerEngine._dist),dist);assert.equal(await page.evaluate(()=>RocketRunnerEngine._running),false);
 await page.emulateMedia({reducedMotion:'reduce'});await start();await begin();
 assert(await page.evaluate(()=>RocketRunnerEngine._reduced));
 await page.evaluate(()=>{RocketRunnerEngine._burst(10,10,10,'#fff');});assert.equal(await page.evaluate(()=>RocketRunnerEngine._particles.length),0);
 await page.evaluate(()=>showScreen('map'));
 assert.deepEqual(errors,[]);await browser.close();console.log('Runner passed: artwork, responsive layout, held jumps, input, pause, all-tier obstacle course, collision/reward guard, cleanup. '+shots);
})().catch(e=>{console.error(e);process.exit(1)});

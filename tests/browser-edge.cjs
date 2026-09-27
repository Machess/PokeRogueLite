const OUTPUT_DIR=require('node:fs').mkdtempSync(require('node:path').join(require('node:os').tmpdir(),'poketrials-check-'));
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright'),assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE} : {}),args:['--no-sandbox','--disable-gpu']});
const page=await browser.newPage({viewport:{width:960,height:600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
await page.goto(require('node:url').pathToFileURL(require('node:path').join(__dirname,'../index.html')).href);
await page.evaluate(async()=>{await Game.startNew(true);GameState.trainerName='Edge';await Game.confirmStarter(STARTERS[0]);GameState.party.push(makePokemon(7,5,OFFLINE_POKEMON[7].sprites.front_default,'Squirtle','water'));});await page.waitForTimeout(500);
await page.evaluate(()=>{const enemy=makePokemon(19,5,OFFLINE_POKEMON[19].sprites.front_default,'Rattata','normal');enemy.hp=1000;enemy.maxHp=1000;GameState.currentNodeIndex=0;setBattleBg('normal');showScreen('battle');BattleEngine._initBattle(getActivePokemon(),enemy,false);});await page.waitForTimeout(500);
const switching=await page.evaluate(()=>{const st=BattleEngine.state;const card=CombatRules.normalize({id:'exhaust-test',name:'Solar Beam',type:'grass',power:90,cost:1,exhaust:true});st.hand=[card];BattleEngine.playCard(0);st.energy=5;BattleEngine.switchPokemon(1);BattleEngine.switchPokemon(0);return {exhausted:st.exhaustedPile.some(c=>c.id==='exhaust-test'),playable:[...st.hand,...st.drawPile,...st.discardPile].some(c=>c.id==='exhaust-test')};});assert.equal(switching.exhausted,true);assert.equal(switching.playable,false);
// Each status stays with its own Pokémon when switching.
const status=await page.evaluate(()=>{const st=BattleEngine.state;st.energy=5;addStatus(st,'player','para',4);BattleEngine.switchPokemon(1);const clean=!hasStatus(st,'player','para');BattleEngine.switchPokemon(0);return{clean,turns:statusTurnsLeft(st,'player','para')};});assert.equal(status.clean,true);assert.equal(status.turns,4);
// Defeat forces a valid replacement without refilling exhausted cards.
await page.evaluate(()=>{BattleEngine.state.player.hp=0;BattleEngine._checkDefeated();});await page.waitForTimeout(650);assert.equal(await page.evaluate(()=>GameState.activePokemonIndex),1);
await page.screenshot({path:OUTPUT_DIR+'/battle-tablet.png'});
// Corruption recovery uses the previous verified save.
const recovered=await page.evaluate(()=>{SaveManager.captureBattle(false);saveGame(true);const key=saveKey(getActiveProfile());localStorage.setItem(key,'{bad json');const restored=loadGame();return restored?.party.length;});assert.equal(recovered,2);
// Export is a real JSON file; import round-trips through validation and confirmation.
const downloadPromise=page.waitForEvent('download');await page.evaluate(()=>SaveManager.export());const download=await downloadPromise;await download.saveAs(OUTPUT_DIR+'/test-backup.json');
const file=require('fs').readFileSync(OUTPUT_DIR+'/test-backup.json','utf8');assert.equal(JSON.parse(file).format,'poketrials-backup');
await page.evaluate(async text=>{await SaveManager.import(new File([text],'backup.json',{type:'application/json'}));},file);
assert.equal(await page.locator('#modal-title').textContent(),'Restore backup?');await page.locator('#modal-ok').click();await page.waitForTimeout(800);
assert.equal(await page.evaluate(()=>loadGame()?.party.length),2);
// Restoring old saves fixes deck aliasing and fallback provenance without resetting upgrades.
assert.equal(await page.evaluate(()=>{const s=loadGame();delete s.resume;delete s.party[0].cardCatalogVersion;s.party[0].deck=[{id:'old',name:'Imaginary Fire Attack',type:'fire',power:99,cost:1,improved:2}];const m=SaveManager.migrate(s);return m.party[0].deck[0].fallback&&m.party[0].deck[0].improved===2&&m.deck===m.party[m.activePokemonIndex].deck;}),true);
// Clearing a run on defeat cannot be reversed by the pagehide autosave.
await page.evaluate(()=>{Game.continueGame();GameOver.show('test enemy');SaveManager.write();});assert.equal(await page.evaluate(()=>localStorage.getItem(saveKey(getActiveProfile()))),null);
// New run then complete an actual one-Pokémon boss. Refresh during its victory modal.
await page.evaluate(async()=>{Game._doStartNew();await Game.confirmStarter(STARTERS[1]);const node=GameState.map.find(n=>n.type==='boss');GameState.currentNodeIndex=node.idx;await BossEngine.start(node);BossEngine.oppTeam=BossEngine.oppTeam.slice(0,1);BossEngine.startBattle();BossEngine.bState.opp.hp=0;BossEngine._checkDefeated();});await page.waitForTimeout(1100);
assert.equal(await page.evaluate(()=>GameState.resume?.kind),'boss-victory');await page.reload();await page.evaluate(()=>Game.continueGame());await page.waitForTimeout(800);
assert.equal(await page.evaluate(()=>GameState.bossesDefeated),1);assert.ok(await page.evaluate(()=>GameState.map.some(n=>n.unlocked&&!n.done)));
assert.deepEqual(errors,[]);console.log('Edge checks passed: switching, exhaustion, statuses, fainting, corrupt saves, export/import, migration, defeat, boss-victory reload.');await browser.close();
})().catch(e=>{console.error(e.stack);process.exit(1)});

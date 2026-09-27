/* Run with Node: node tests/regression.cjs. No packages needed. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),store=new Map();let seed=84713;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const ctx={console,structuredClone,setTimeout,clearTimeout,setInterval,clearInterval,URL,Blob,
  Math:Object.assign(Object.create(Math),{random}),
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
  sessionStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
  document:{addEventListener:()=>{},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]},window:{addEventListener:()=>{}},navigator:{},matchMedia:()=>({matches:false})};
vm.createContext(ctx);
for(const file of JSON.parse(fs.readFileSync(path.join(root,'data/script-order.json'))))vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
function run(code){return vm.runInContext(code,ctx);}
let count=0;function test(name,fn){fn();count++;console.log('✓',name);}
test('All referenced special effects have executable rules',()=>assert.equal(run(`SpeciesCards.templates().filter(c=>c.special&&!CombatRules.specs[c.special]).length`),0));
test('Recover, Barrier and Leer apply their advertised effects',()=>{
 for(const [special,value,key] of [['recover',70,'player.hp'],['shield_50',55,'shield'],['leer_free',15,'oppDefDebuff']])assert.equal(run(`(()=>{const s={player:{hp:20,maxHp:100},opp:{hp:100,type:'normal'},hand:[],shield:0,statusEffects:{player:[],opp:[]}};CombatRules.apply({name:'test',special:'${special}',power:0},s,{typeMultiplier:()=>1});return s.${key};})()`),value);
});
test('Damage preview matches resolution with weather, charge, shields and guaranteed critical',()=>assert.equal(run(`(()=>{for(const special of [null,'always_crit','venoshock','psyshock']){const s={player:{hp:100,maxHp:100},opp:{hp:5000,type:'normal'},hand:[],rainTurns:3,chargeBonus:.5,chargeType:'water',attackBoost:.2,oppDefDebuff:15,oppShield:30,statusEffects:{player:[],opp:['poison']},effects:{briefed:1.25,endorsement:true}};const card={name:'test',type:'water',power:42,special};const env={typeMultiplier:()=>2,itemBoost:1.1,random:()=>.99};const expected=CombatRules.damage(card,s,env),before=s.opp.hp;CombatRules.apply(card,s,env);if(before-s.opp.hp!==expected)return false;}return true;})()`),true));
test('Future Sight damages only after the enemy action',()=>assert.equal(run(`(()=>{const s={player:{hp:100,maxHp:100},opp:{hp:200,type:'normal'},hand:[]};CombatRules.apply({name:'Future Sight',power:70,type:'psychic',special:'future_sight'},s,{typeMultiplier:()=>1});return s.opp.hp===200&&s.futureSight.damage===70;})()`),true));
test('Non-electric attacks do not consume an electric Charge',()=>assert.equal(run(`(()=>{const s={player:{hp:100,maxHp:100},opp:{hp:300,type:'normal'},chargeBonus:.5,chargeType:'electric',hand:[]};CombatRules.apply({name:'Scratch',power:32,type:'normal'},s,{typeMultiplier:()=>1});return s.chargeBonus===.5;})()`),true));
test('Every matched move is supported by the exact species catalog',()=>assert.equal(run(`(()=>{for(let id=1;id<=251;id++){const p={id,type:OFFLINE_POKEMON[id].types[0].type.name};for(const c of SpeciesCards.pool(p)){if(c.source&&TCG_CATALOG.species[id][SpeciesCards.key(c.name)]?.id!==c.source.id)return false;}}return true;})()`),true));
test('All species have ten-card playable starting decks',()=>assert.equal(run(`(()=>{for(let id=1;id<=251;id++){const p={id,type:OFFLINE_POKEMON[id].types[0].type.name};const d=SpeciesCards.build(p);if(d.length!==10||!d.some(c=>c.power>0&&c.cost<=1)||d.some(c=>!c.source&&!c.fallback&&!c.trainerCommand))return false;}return true;})()`),true));
test('Same-type Pokémon have different attack collections',()=>assert.notEqual(run(`JSON.stringify(SpeciesCards.build({id:4,type:'fire'}).map(c=>c.name))`),run(`JSON.stringify(SpeciesCards.build({id:37,type:'fire'}).map(c=>c.name))`)));
test('Missing matches yield explicit elemental fallbacks',()=>assert.equal(run(`SpeciesCards.build({id:999,type:'fire'}).filter(c=>!c.trainerCommand).every(c=>c.fallback&&!c.source)`),true));
test('One thousand late-game maps retain a legendary and reach their boss',()=>assert.equal(run(`(()=>{GameState={bossesDefeated:6,region:'kanto'};for(let t=0;t<1000;t++){const map=generateMap(6);if(map.filter(n=>n.catchRarity==='legendary').length!==1)return false;for(const n of map){if(n.type!=='boss'&&!n.links.length)return false;for(const i of n.links)if(map[i].row!==n.row+1)return false;}const row=map.filter(n=>n.row===0);if(row.every(n=>JSON.stringify(n.links)===JSON.stringify(row[0].links)))return false;}return true;})()`),true));
test('Enemy intention is stable across repeated previews',()=>assert.equal(run(`(()=>{const s={opp:{id:74,type:'rock',level:10,moves:[{name:'Tackle',power:30}]},player:{type:'fire'},turn:1};return JSON.stringify(EnemyAI.plan(s,'Brock'))===JSON.stringify(EnemyAI.plan(s,'Brock'));})()`),true));
test('Defence debuffs increase outgoing damage, not incoming reduction',()=>assert.equal(run(`(()=>{const s={opp:{id:74,type:'rock',level:10},player:{type:'normal'},oppDefDebuff:20,intent:{kind:'attack',move:{name:'Tackle',power:30}}};const a=EnemyAI.incoming(s);s.oppDefDebuff=0;return a===EnemyAI.incoming(s);})()`),true));
test('Save validation rejects malformed party/map data',()=>{assert.equal(run(`SaveManager.valid({party:[]})`),false);assert.equal(run(`SaveManager.valid({party:[{id:4,hp:20,maxHp:100,deck:[]}],map:[],completedNodes:[],activePokemonIndex:0})`),true);});
test('Local script and core sprite files are present',()=>{
 for(const f of JSON.parse(fs.readFileSync(path.join(root,'data/script-order.json'))))assert.ok(fs.existsSync(path.join(root,f)),f);
 for(let i=1;i<=251;i++)for(const suffix of ['', '-back'])assert.ok(fs.statSync(path.join(root,`assets/sprites/${i}${suffix}.png`)).size>0);
});
console.log(`${count} regression checks passed.`);

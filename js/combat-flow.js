/* Shared turn lifecycle for wild, trainer, Rocket and gym battles. */
const EnemyAI = {
  patterns:{Brock:['defend','heavy','attack'],Misty:['rain','attack','heavy'],Sabrina:['confuse','attack','heavy'],
    'Lt. Surge':['charge','heavy','attack'],Erika:['poison','defend','attack'],Koga:['poison','attack','defend'],
    Blaine:['charge','heavy','attack'],Giovanni:['defend','heavy','attack']},
  plan(st,bossName){
    if(st.intent&&st.intent.opponentId===st.opp.id)return st.intent;
    const turn=st.turn||0,moves=(st.opp.moves?.length?st.opp.moves:OPPONENT_MOVES[st.opp.type]||OPPONENT_MOVES.normal);
    const attacks=moves.filter(m=>m.power>0),strong=[...attacks].sort((a,b)=>b.power-a.power)[0]||{name:'Strike',power:30};
    const pattern=this.patterns[bossName]||(['rock','steel'].includes(st.opp.type)?['attack','defend','heavy']:['attack','attack','heavy']);
    let kind=pattern[turn%pattern.length];
    if(st.oppTauntTurns>0&&!['attack','heavy'].includes(kind))kind='attack';
    const move=kind==='heavy'?strong:attacks[turn%Math.max(1,attacks.length)]||strong;
    const labels={defend:'Brace · gain 30 block',rain:'Rain Dance · Water +25% for 3 turns',charge:'Gather power · next attack +25%',confuse:'Confuse your active Pokémon',poison:'Poison your active Pokémon'};
    st.intent={kind,move:{...move},label:labels[kind]||move.name,opponentId:st.opp.id};return st.intent;
  },
  incoming(st){
    const i=st.intent;if(!i||!['attack','heavy'].includes(i.kind))return 0;
    let n=Math.round((i.move.power+Math.floor(st.opp.level*1.2))*getTypeMultiplier(i.move.type||st.opp.type,st.player.type));
    if(st.enemyRain>0&&st.opp.type==='water')n=Math.round(n*1.25);
    if(st.enemyCharge)n=Math.round(n*1.25);
    return Math.max(0,n-(st.oppAtkDebuff||0)-(st.shield||0));
  },
  act(st,engine){
    const log=m=>engine._logEnemy(m),i=st.intent||this.plan(st);st.oppShield=0;
    tickStatuses(st,'opp');
    if(st.oppSkipped){st.oppSkipped=false;log(`${st.opp.name} cannot act!`);return;}
    if(hasStatus(st,'opp','para')&&Math.random()<.25){log(`${st.opp.name} is paralysed!`);return;}
    if(st.oppTauntTurns>0&&!['attack','heavy'].includes(i.kind)){log('Taunt stopped the enemy utility move!');return;}
    if(i.kind==='defend'){st.oppShield=30;log(`${st.opp.name} braces: 30 block.`);return;}
    if(i.kind==='rain'){st.enemyRain=4;log('Enemy rain strengthens Water attacks.');return;}
    if(i.kind==='charge'){st.enemyCharge=true;log('The enemy charges its next attack!');return;}
    if(['confuse','poison'].includes(i.kind)){
      if(!st.effects?.statusResist)addStatus(st,'player',i.kind);
      log(st.effects?.statusResist?'Your protection resisted the status!':`${st.player.name}: ${i.kind}!`);return;
    }
    if(Math.random()*100<(st.oppAccDebuff||0)){log(`${i.move.name} missed!`);return;}
    const n=this.incoming(st);st.enemyCharge=false;
    st.player.hp=Math.max(0,st.player.hp-n);st.totalDamageTaken=(st.totalDamageTaken||0)+n;
    log(`${st.opp.name}: ${i.move.name} — ${n} damage${st.shield?' after block':''}.`);
    applyHitAnimation(engine.isBoss?'boss-opp-sprite':'opp-sprite',engine.isBoss?'boss-player-sprite':'player-sprite',st.opp.type);
    if(i.move.effect&&Math.random()<.15&&!st.effects?.statusResist){const status={burn_chance:'burn',para_chance:'para',poison_chance:'poison'}[i.move.effect];if(status)addStatus(st,'player',status,status==='para'?4:undefined);}
    const berry=ItemEngine.checkBerryMidBattle(st,'player',engine.isBoss);if(berry)engine._logPlayer(berry);
  }
};

const CombatFlow = {
  env(st){const p=GameState.party[GameState.activePokemonIndex];return {
    typeMultiplier:getTypeMultiplier,itemBoost:1,mewtwo:p?.isMewtwo,fishing:GameState.fishingBuff,
    addStatus,draw:n=>BattleEngine._dealHand.call({state:st},n),
    consumeFishing:type=>{if(GameState.fishingBuff?.type===type)GameState.fishingBuff=null;},
    steal:item=>{p.heldItem=item;}
  };},
  damage(card,st){const env=this.env(st);env.itemBoost=ItemEngine.getTypeboost(GameState.party[GameState.activePokemonIndex],card.type);return CombatRules.damage(card,st,env);},
  apply(engine,card){
    const st=engine.state,env=this.env(st);env.itemBoost=ItemEngine.getTypeboost(GameState.party[GameState.activePokemonIndex],card.type);
    const result=CombatRules.apply(card,st,env);result.logs.forEach(m=>engine._logPlayer(m));
    applyHitAnimation(engine.isBoss?'boss-player-sprite':'player-sprite',engine.isBoss?'boss-opp-sprite':'opp-sprite',card.type,card.cost,card.name,card.icon);
    if(result.damage){const msg=ItemEngine.checkShellBell(st,engine);if(msg)engine._logPlayer(msg);}
    const berry=ItemEngine.checkBerryMidBattle(st,'player',engine.isBoss);if(berry)engine._logPlayer(berry);
  },
  adapter(boss){return boss?{state:BossEngine.bState,isBoss:true,_render:()=>BossEngine._render(),_checkDefeated:()=>BossEngine._checkDefeated(),_logPlayer:m=>BossEngine._logPlayer(m),_logEnemy:m=>BossEngine._logEnemy(m),_logSystem:m=>BossEngine._logSystem(m)}:BattleEngine;},
  play(index,boss=false){
    const engine=this.adapter(boss),st=engine.state;
    if(!st||BattleEngine._battleOver||(boss&&(BossEngine._isOver||BossEngine._switching))||st.busy)return;
    const card=st.hand[index];if(!card||st.energy<(card.cost||0)||st.player.hp<=0)return;
    st.hand.splice(index,1);st.energy-=card.cost||0;st.cardsPlayedCount=(st.cardsPlayedCount||0)+1;
    st.actionsThisTurn=(st.actionsThisTurn||0)+1;
    const selfHit=card._typeConfused||(hasStatus(st,'player','confuse')&&Math.random()<.3);
    if(selfHit){delete card._typeConfused;st.player.hp=Math.max(0,st.player.hp-15);removeStatus(st,'player','confuse');engine._logEnemy(`${card.name} misfired: 15 self-damage!`);}
    else this.apply(engine,card);
    // Played cards enter discard AFTER draws; a free draw cannot redraw itself immediately.
    (card.exhaust?st.exhaustedPile:st.discardPile).push(card);
    if(!engine._checkDefeated())engine._render();
    SaveManager.captureBattle(boss);
  },
  end(boss=false){
    const e=this.adapter(boss),st=e.state;
    if(!st||st.busy||BattleEngine._battleOver||(boss&&(BossEngine._isOver||BossEngine._switching)))return;
    const button=document.getElementById(boss?'btn-boss-end-turn':'btn-end-turn');
    if(!st.actionsThisTurn&&!st.confirmEnd){st.confirmEnd=true;if(button)button.textContent='No cards played — End Turn?';return;}
    st.confirmEnd=false;if(button)button.textContent='End Turn ▶';
    st.busy=true;st.discardPile.push(...st.hand);st.hand=[];
    EnemyAI.act(st,e);
    const hurt=(who,n)=>{st[who].hp=Math.max(0,st[who].hp-n);e[who==='opp'?'_logPlayer':'_logEnemy'](`${st[who].name} takes ${n} ongoing damage.`);};
    for(const who of ['player','opp']){if(hasStatus(st,who,'burn'))hurt(who,10);if(hasStatus(st,who,'poison'))hurt(who,15);}
    if(st.futureSight){hurt('opp',st.futureSight.damage);st.futureSight=null;}
    if(st.leechTurns>0){const n=20*(st.leechStacks||1);hurt('opp',n);st.player.hp=Math.min(st.player.maxHp,st.player.hp+Math.floor(n/2));st.leechTurns--;}
    if(st.hailTurns>0){hurt('opp',12);st.hailTurns--;}
    if(st.stealthRock>0){hurt('opp',15);st.stealthRock--;}
    if(st.opp.curseTurns>0){hurt('opp',20);st.opp.curseTurns--;}
    if(st.effects?.regenTurns>0&&st.player.hp>0){st.player.hp=Math.min(st.player.maxHp,st.player.hp+Math.floor(st.player.maxHp*st.effects.regenAmount));st.effects.regenTurns--;}
    for(const k of ['rainTurns','oppTauntTurns','enemyRain'])st[k]=Math.max(0,(st[k]||0)-1);
    for(const [k,n] of [['oppAtkDebuff',5],['oppDefDebuff',3],['oppAccDebuff',4]])st[k]=Math.max(0,(st[k]||0)-n);
    const snap=st.player.hp+':'+st.opp.hp;st._stallTurns=st._lastHpSnapshot===snap?(st._stallTurns||0)+1:0;st._lastHpSnapshot=snap;
    if(st._stallTurns>=3){const n=5+(st._stallTurns-3)*5;hurt('player',n);hurt('opp',n);}
    st.busy=false;
    if(st.player.hp<=0&&st.effects?.endurance){st.player.hp=1;st.effects.endurance=false;BattleEngine._enduranceOnce=false;}
    if(st.player.hp<=0&&st.effects?.revive){st.player.hp=Math.min(st.player.maxHp,st.effects.revive);st.effects.revive=0;BattleEngine._jigglypuffRevive=0;}
    if(st.player.hp<=0&&ItemEngine.checkFocusSash(st,'player',BattleEngine))e._logPlayer('Focus Sash: survived!');
    if(st.player.hp<=0&&ItemEngine.checkRevive(GameState.activePokemonIndex))st.player.hp=GameState.party[GameState.activePokemonIndex].hp;
    // Prepare the next turn before asynchronous enemy/team transitions.
    st.turn=(st.turn||0)+1;st.intent=null;st.energy=Math.min(5,3+(st.bonusEnergy||0));st.bonusEnergy=0;st.shield=0;st.actionsThisTurn=0;
    BattleEngine._itemUsedThisTurn=false;tickStatuses(st,'player');
    if(hasStatus(st,'player','sleep')){st.energy=0;removeStatus(st,'player','sleep');e._logEnemy('Asleep this turn — use End Turn.');}
    if(hasStatus(st,'player','para')&&Math.random()<.25){st.energy=0;e._logEnemy('Paralysed this turn — use End Turn.');}
    const leftovers=ItemEngine.checkLeftovers(st);if(leftovers)e._logPlayer(leftovers);
    BattleEngine._dealHand.call({state:st},5);
    EnemyAI.plan(st,boss?BossEngine.bossData?.name:null);
    if(!e._checkDefeated())e._render();
    SaveManager.captureBattle(boss);
  },
  switch(index,boss=false,forced=false){
    const e=this.adapter(boss),st=e.state,p=GameState.party[index];
    if(!st||!p||p.hp<=0||index===GameState.activePokemonIndex||(!forced&&st.energy<2)||st.busy)return;
    const old=GameState.activePokemonIndex;GameState.party[old].hp=st.player.hp;
    st.teamPiles||={};st.teamPiles[old]={hand:st.hand,drawPile:st.drawPile,discardPile:st.discardPile,exhaustedPile:st.exhaustedPile,status:[...st.statusEffects.player],statusTurns:Object.fromEntries(Object.entries(st.statusTurns||{}).filter(([k])=>k.startsWith('player:')))};
    GameState.activePokemonIndex=index;GameState.deck=p.deck;
    const saved=st.teamPiles[index];
    for(const k of ['hand','drawPile','discardPile','exhaustedPile'])st[k]=saved?.[k]||[];
    if(!saved)st.drawPile=shuffle(p.deck.map(c=>({...c})));
    st.player={...p};st.statusEffects.player=saved?.status||[];
    for(const k of Object.keys(st.statusTurns||{}))if(k.startsWith('player:'))delete st.statusTurns[k];
    Object.assign(st.statusTurns||={},saved?.statusTurns||{});
    if(!st.hand.length)BattleEngine._dealHand.call({state:st},5);
    st.energy=Math.max(0,st.energy-(forced?0:2));st.actionsThisTurn=(st.actionsThisTurn||0)+1;
    e._logSystem(`Go, ${p.name}!`);e._render();SaveManager.captureBattle(boss);
  },
  resetFlags(engine){
    for(const k of ['_briefedBonus','_clarityBuff','_typeAnnotations','_typeConfusion','_typeConfusionPending','_giovanniDisinfoPending','_jigglypuffRevive','_giovanniEndorsement','_mortyClairvoyance','_clairBoost','_enduranceOnce','_statusResist'])engine[k]=0;
  },
  initialize(engine){
    const st=engine.state;
    st.effects={briefed:engine._briefedBonus||1,clarity:!!engine._clarityBuff,clair:!!engine._clairBoost,endorsement:!!engine._giovanniEndorsement,
      regenTurns:engine._cookRegen||0,regenAmount:engine._cookRegenAmt||0,endurance:!!engine._enduranceOnce,statusResist:!!engine._statusResist,revive:engine._jigglypuffRevive||0};
    st.turn=0;st.actionsThisTurn=0;st.intent=null;
    EnemyAI.plan(st,engine.isBoss?BossEngine.bossData?.name:null);
  }
};

const CombatUI={
  intent(st,boss){
    EnemyAI.plan(st,boss?BossEngine.bossData?.name:null);
    const host=document.getElementById(boss?'boss-battle-area':'screen-battle');if(!host)return;
    let el=host.querySelector('.enemy-intent');if(!el){el=document.createElement('div');el.className='enemy-intent';el.setAttribute('aria-live','polite');host.appendChild(el);}
    const i=st.intent,n=EnemyAI.incoming(st),chance=st.oppAccDebuff||0;
    el.textContent=st.oppSkipped?'💤 Next: enemy action skipped':`NEXT · ${i.label}${['attack','heavy'].includes(i.kind)?' · '+n+' damage'+(chance?' · '+chance+'% miss chance':''):''}${st.oppShield?' · Shield '+st.oppShield:''}`;
    el.dataset.kind=i.kind;
    let quit=host.querySelector('.battle-save-exit');if(!quit){quit=document.createElement('button');quit.className='battle-save-exit';quit.textContent='Save & exit';host.appendChild(quit);}
    quit.onclick=()=>{if(st.busy||st.player.hp<=0||st.opp.hp<=0||(boss&&BossEngine._switching)){SaveManager.notice('Finishing the battle action…');return;}SaveManager.captureBattle(boss);Game.goToMenu();};
  }
};

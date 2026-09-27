/* Versioned, validated saves with previous-write recovery and portable backups. */
const SaveManager={
  version:2,restoring:false,writing:false,nodeCheckpoint:null,
  valid(s){return !!(s&&typeof s==='object'&&Array.isArray(s.party)&&s.party.length>0&&s.party.length<=6&&s.party.every(p=>Number.isInteger(Number(p.id))&&Number(p.id)>0&&Number(p.id)<=251&&Number.isFinite(p.hp)&&Number.isFinite(p.maxHp)&&p.maxHp>0&&Array.isArray(p.deck))&&Array.isArray(s.map)&&Array.isArray(s.completedNodes)&&Number.isInteger(s.activePokemonIndex)&&s.activePokemonIndex>=0&&s.activePokemonIndex<s.party.length);},
  migrate(s){
    if(!this.valid(s))throw Error('This save is incomplete or invalid.');
    s.schemaVersion=this.version;
    for(const p of s.party){
      const local=globalThis.OFFLINE_POKEMON?.[p.id];if(local){p.spriteUrl=local.sprites.front_default;p.backSpriteUrl=local.sprites.back_default;}
      if(p.cardCatalogVersion!==2&&!s.resume?.state)SpeciesCards.migrate(p);
      p.deck=p.deck.map(CombatRules.normalize);
    }
    s.deck=s.party[s.activePokemonIndex].deck;return s;
  },
  notice(message,bad=false){
    let el=document.getElementById('save-status');if(!el){el=document.createElement('div');el.id='save-status';el.setAttribute('role','status');document.body.appendChild(el);}
    el.textContent=message;el.classList.toggle('save-error',bad);
  },
  write(){
    if(this.writing||!getActiveProfile()||!GameState?.party?.length||GameState._runEnded)return false;
    this.writing=true;let ok=false;
    try{
      const state=this.nodeCheckpoint&&GameState.resume?.kind==='node'?this.nodeCheckpoint:GameState;
      state.schemaVersion=this.version;state.savedAt=Date.now();
      if(!this.valid(state))throw Error('Invalid run state');
      const key=saveKey(getActiveProfile()),raw=JSON.stringify(state),old=localStorage.getItem(key);
      if(old){try{if(this.valid(JSON.parse(old)))localStorage.setItem(key+'_backup',old);}catch(_){}}
      localStorage.setItem(key,raw);if(localStorage.getItem(key)!==raw)throw Error('Save verification failed');
      this.notice('Saved');ok=true;
    }catch(e){console.error('Save failed',e);this.notice('Could not save — export a backup before closing.',true);}
    this.writing=false;_updateProfileMeta(getActiveProfile(),ok);return ok;
  },
  load(){
    const key=saveKey(getActiveProfile());
    for(const candidate of [key,key+'_backup']){
      try{const raw=localStorage.getItem(candidate);if(!raw)continue;const state=JSON.parse(raw);if(state.schemaVersion>this.version)throw Error('This save needs a newer game version.');const migrated=this.migrate(state);if(candidate!==key)this.notice('Recovered the previous save.');return migrated;}catch(e){console.warn('Save recovery:',e.message);}
    }return null;
  },
  beginNode(node){
    GameState.resume={kind:'node',nodeIdx:node.idx};this.nodeCheckpoint=JSON.parse(JSON.stringify(GameState));this.write();
  },
  complete(){this.nodeCheckpoint=null;if(GameState)delete GameState.resume;},
  captureBattle(boss){
    if(this.restoring||!GameState?.party?.length)return;
    const st=boss?BossEngine.bState:BattleEngine.state;
    if(!st||st.busy||st.player.hp<=0||st.opp.hp<=0||BattleEngine._battleOver||(boss&&(BossEngine._isOver||BossEngine._switching)))return;
    const active=document.getElementById(boss?'screen-boss':'screen-battle');
    if(!active?.classList.contains('active')&&!this.forceCapture)return;
    this.nodeCheckpoint=null;
    const flags={};for(const k of ['_focusSashUsed','_itemUsedThisTurn','_enduranceOnce','_jigglypuffRevive'])flags[k]=BattleEngine[k];
    GameState.resume={kind:boss?'boss':'battle',state:JSON.parse(JSON.stringify(st)),flags,
      boss:boss?{bossData:BossEngine.bossData,oppTeam:BossEngine.oppTeam,oppIdx:BossEngine.oppIdx,isRocket:BossEngine._isRocket}:null,
      trainer:BattleEngine._isTrainerBattle&&!boss?{team:TrainerBattleEngine._team,index:TrainerBattleEngine._teamIdx,gold:TrainerBattleEngine._goldEarned,node:TrainerBattleEngine._node}:null};
    this.write();
  },
  resume(){
    const r=GameState.resume;if(!r)return false;this.restoring=true;
    try{
      if(r.kind==='reward'){showScreen('map');CardReward.restore(r);return true;}
      if(r.kind==='boss-victory'){SaveManager.complete();if(GameState.isLeagueRun){if(r.final)LeagueEngine.showLeagueVictory();else LeagueEngine.afterLeagueBoss(r.boss);}else Game.afterBoss(GameState.bossesDefeated);return true;}
      if(r.kind==='node'){const node=GameState.map.find(n=>n.idx===r.nodeIdx);this.nodeCheckpoint=JSON.parse(JSON.stringify(GameState));if(node){MapEngine._enterNode(node);return true;}return false;}
      if(!['battle','boss'].includes(r.kind)||!r.state?.player||!r.state?.opp)return false;
      const boss=r.kind==='boss';BattleEngine.state=r.state;BattleEngine.isBoss=boss;BattleEngine._battleOver=false;
      Object.assign(BattleEngine,r.flags||{});BattleEngine._isTrainerBattle=!!r.trainer;
      if(r.trainer){Object.assign(TrainerBattleEngine,{_team:r.trainer.team,_teamIdx:r.trainer.index,_goldEarned:r.trainer.gold,_node:r.trainer.node});}
      if(boss){Object.assign(BossEngine,{bState:r.state,bossData:r.boss.bossData,oppTeam:r.boss.oppTeam,oppIdx:r.boss.oppIdx,_isRocket:r.boss.isRocket,_isOver:false,_battleOver:false,_switching:false});
        document.getElementById('trainer-intro').style.display='none';document.getElementById('boss-battle-area').style.display='block';clearBossIntroBg(r.state.opp.type);showScreen('boss');BossEngine._render();
      }else{setBattleBg(r.state.opp.type,false);showScreen('battle');BattleEngine._render();if(r.trainer)TrainerBattleEngine._renderBattlePips();}
      return true;
    }finally{this.restoring=false;}
  },
  export(){
    this.write();const entries={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^(pokerogue_|pkt_best_scores_)/.test(k)&&k!==PARENT_PIN_KEY)entries[k]=localStorage.getItem(k);}
    const blob=new Blob([JSON.stringify({format:'poketrials-backup',version:2,exportedAt:new Date().toISOString(),entries},null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Poketrials-save-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  },
  async import(file){
    try{
      if(!file||file.size>8*1024*1024)throw Error('Choose a backup smaller than 8 MB.');
      const data=JSON.parse(await file.text());if(data.format!=='poketrials-backup'||data.version>2||!data.entries||Array.isArray(data.entries))throw Error('Not a compatible PokéTrials backup.');
      const entries=Object.entries(data.entries);if(!entries.length||entries.length>50)throw Error('Invalid backup entries.');
      const parsedProfiles=JSON.parse(data.entries[PROFILES_KEY]||'[]');if(!Array.isArray(parsedProfiles)||parsedProfiles.length>MAX_PROFILES)throw Error('Invalid profiles.');
      for(const [k,v] of entries){if(!/^(pokerogue_(profiles_v1|save_v1_[\w-]+(?:_backup)?|unlock_v1_[\w-]+|pokedex_v1_[\w-]+)|pkt_best_scores_[\w-]+)$/.test(k)||typeof v!=='string')throw Error('Unexpected backup content.');
        const obj=JSON.parse(v);if(k.startsWith('pokerogue_save_')&&!this.valid(obj))throw Error('Invalid saved adventure.');
        if(/[<>]/.test(v)||/"(?:__proto__|constructor|prototype)"\s*:/.test(v))throw Error('Unsafe backup content.');
      }
      showModal('Restore backup?', 'This replaces matching profiles and saves with the selected backup. Export your current progress first if you want to keep it.',()=>{
        const previous=entries.map(([k])=>[k,localStorage.getItem(k)]);
        try{for(const [k,v] of entries)localStorage.setItem(k,v);for(const [k,v] of entries)if(localStorage.getItem(k)!==v)throw Error('Write failed');location.reload();}
        catch(e){for(const [k,v] of previous){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v);}catch(_){}}this.notice('Restore failed. Original saves were retained where possible.',true);}
      },true);
    }catch(e){showModal('Cannot restore',e.message);}
  },
  setup(){
    const wrap=document.createElement('div');wrap.className='backup-controls';
    const out=document.createElement('button');out.textContent='Export saves';out.onclick=()=>this.export();
    const imp=document.createElement('button');imp.textContent='Import saves';
    const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.hidden=true;input.onchange=()=>this.import(input.files[0]);imp.onclick=()=>input.click();wrap.append(out,imp,input);document.getElementById('screen-start').appendChild(wrap);
    window.addEventListener('pagehide',()=>this.write());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.write();});
  }
};

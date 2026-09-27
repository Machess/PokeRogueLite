const CardInspector={
  open(card){
    let modal=document.getElementById('card-inspector');if(!modal){modal=document.createElement('dialog');modal.id='card-inspector';document.body.appendChild(modal);}
    modal.replaceChildren();
    const title=document.createElement('h2');title.textContent=card.name;modal.appendChild(title);
    const stats=document.createElement('p');stats.textContent=`${card.cost||0} energy · ${card.power||0} power · ${CombatRules.describe(card)}`;modal.appendChild(stats);
    if(card.source){
      const img=document.createElement('img');img.src=card.source.localImage||card.source.image;img.alt=`${card.source.pokemon} — ${card.source.id}`;img.onerror=()=>{const note=document.createElement('p');note.textContent='Card image unavailable. The verified attack match is shown below.';img.replaceWith(note);};modal.appendChild(img);
      const text=document.createElement('p');text.textContent=`Matched attack: ${card.source.attack} · ${card.source.pokemon} · ${card.source.id}. PokéTrials uses the energy, damage and effects shown above.`;modal.appendChild(text);
    }else{const text=document.createElement('p');text.textContent=card.trainerCommand?'Trainer command.': 'Elemental fallback: no verified species/attack card match in the bundled catalog.';modal.appendChild(text);}
    if(card.speciesId){const refresh=document.createElement('button');refresh.textContent='Check online card matches';refresh.onclick=async()=>{refresh.disabled=true;refresh.textContent='Checking…';const d=OFFLINE_POKEMON[card.speciesId];const ok=await SpeciesCards.refresh({id:card.speciesId,name:capitalize(d.name)});refresh.textContent=ok?'Card matches updated':'Offline — bundled matches are ready';};modal.appendChild(refresh);}
    const close=document.createElement('button');close.textContent='Close';close.onclick=()=>modal.close();modal.appendChild(close);modal.showModal();
  },
  button(card){const b=document.createElement('button');b.className='inspect-card';b.textContent=card.source?'▣ Card':'ⓘ';b.title='Inspect attack and source card';b.onclick=e=>{e.stopPropagation();this.open(card);};return b;}
};

const CardReward={
  _pool:[],_chosen:false,_mode:'add',
  deck(){return GameState.party[GameState.activePokemonIndex].deck;},
  eligible(){const deck=this.deck();return SpeciesCards.pool(getActivePokemon()).filter(c=>deck.filter(x=>x.id===c.id).length<2);},
  show(goldEarned){
    this._chosen=false;this._mode='add';const available=shuffle(this.eligible()),selected=[];
    for(const test of [c=>c.cost<=1&&c.power>0,c=>c.cost>=2&&c.power>0,c=>c.power===0]){const c=available.find(c=>test(c)&&!selected.includes(c));if(c)selected.push(c);}
    for(const c of available)if(selected.length<3&&!selected.includes(c))selected.push(c);
    this._pool=selected;this._gold=goldEarned;
    SaveManager.nodeCheckpoint=null;GameState.resume={kind:'reward',pool:this._pool,gold:goldEarned};saveGame(true);this.render();
  },
  restore(r){this._pool=r.pool||[];this._gold=r.gold||0;this._chosen=false;this._mode='add';this.render();},
  render(){
    const deck=this.deck(),cap=deck.length>=31;
    document.getElementById('cr-gold-earned').textContent=`+${this._gold}g · ${getActivePokemon().name}'s deck: ${deck.length}/31`;
    document.getElementById('cr-battle-comment').textContent=cap?'Deck full — improve a card or skip.':'Choose an attack, improve your deck, or keep it lean.';
    const summary=document.getElementById('cr-battle-summary');summary.textContent='Matched attacks belong to your active Pokémon. Card numbers use PokéTrials rules.';summary.style.display='';
    const grid=document.getElementById('cr-cards-grid');grid.replaceChildren();
    if(this._mode==='add'&&!cap){
      for(const [i,card] of this._pool.entries()){
        const el=this.tile(card);const take=document.createElement('button');take.textContent='Add to deck';take.onclick=()=>this.pickCard(i);el.appendChild(take);grid.appendChild(el);
      }
      if(!this._pool.length)grid.textContent='No new cards available. You can still upgrade or skip.';
    }else if(this._mode==='upgrade'||cap){
      this._mode='upgrade';for(const [i,card] of deck.entries()){
        if(card.upgrade)continue;
        const el=this.tile(card);
        const power=document.createElement('button');power.textContent=card.power?`Power → ${Math.round(card.power*1.25)}`:'Stronger healing / block';power.disabled=!card.power&&!CombatRules.spec(card).heal&&!CombatRules.spec(card).block;
        power.onclick=()=>this.upgrade(i,'power');
        const flow=document.createElement('button');flow.textContent='Flow · draw 1 extra';flow.onclick=()=>this.upgrade(i,'flow');el.append(power,flow);grid.appendChild(el);
      }
      if(!grid.children.length)grid.textContent='Every card already has a reward upgrade. Skip to continue.';
    }else for(const card of deck)grid.appendChild(this.tile(card));
    let toolbar=document.getElementById('reward-toolbar');if(!toolbar){toolbar=document.createElement('div');toolbar.id='reward-toolbar';grid.before(toolbar);}toolbar.replaceChildren();
    for(const [mode,label] of [['add','New cards'],['upgrade','Upgrade instead'],['deck','Inspect deck']]){const btn=document.createElement('button');btn.textContent=label;btn.classList.toggle('selected',this._mode===mode);btn.onclick=()=>{this._mode=mode;this.render();};toolbar.appendChild(btn);}
    document.getElementById('card-reward-screen').classList.remove('hidden');
  },
  tile(card){
    const el=document.createElement('div');el.className='cr-card';el.dataset.type=card.type;
    const name=document.createElement('h3');name.textContent=`${card.icon||'✦'} ${card.name}`;
    const cost=document.createElement('div');cost.className='reward-cost';cost.textContent=`${card.cost||0} ENERGY · ${card.power||0} POWER`;
    const description=document.createElement('p');description.textContent=CombatRules.describe(card);
    const source=document.createElement('small');source.textContent=card.source?`✓ ${card.source.pokemon} · ${card.source.id}`:card.trainerCommand?'Trainer command':'Elemental fallback';
    el.append(name,cost,description,source,CardInspector.button(card));return el;
  },
  pickCard(i){if(this._chosen)return;const card=this._pool[i],deck=this.deck();if(!card||deck.length>=31||deck.filter(c=>c.id===card.id).length>=2)return;
    deck.push({...card});this._chosen=true;GameState.deck=deck;SoundEngine.playFanfare();this.close();},
  upgrade(i,kind){if(this._chosen)return;const card=this.deck()[i];if(!card||card.upgrade)return;card.upgrade=kind;
    if(kind==='power'){card.power=Math.round(card.power*1.25);card.improved=(card.improved||0)+1;}card.effect=CombatRules.describe(card);
    this._chosen=true;GameState.deck=this.deck();SoundEngine.playFanfare();this.close();},
  skip(){this.close();},
  close(){document.getElementById('card-reward-screen').classList.add('hidden');SaveManager.complete();saveGame(true);MapEngine.show();}
};

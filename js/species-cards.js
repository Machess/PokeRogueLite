/* Exact species + normalized attack-name matching, from the bundled public catalog. */
const SpeciesCards = {
  key:s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,''),
  templates(){
    const all=[...STANDARD_CARDS,...Object.values(CARD_TEMPLATES).flat(),...Object.values(TYPE_SIGNATURE_CARDS).flat(),...Object.values(LEAGUE_DECKS).flat(),...Object.values(LEGENDARY_BIRD_CARDS)];
    const seen=new Set();return all.filter(c=>{const key=this.key(c.name);if(seen.has(key))return false;seen.add(key);return true;});
  },
  pool(poke){
    const matches=globalThis.TCG_CATALOG?.species?.[poke.id]||{};
    const found=this.templates().filter(c=>matches[this.key(c.name)]).map(c=>{
      const source=matches[this.key(c.name)];
      return CombatRules.normalize({...c,id:'species_'+poke.id+'_'+this.key(c.name),source:{...source},speciesId:Number(poke.id),type:c.type==='normal'?'normal':poke.type});
    });
    return [...found,this.fallback(poke),...this.commands()];
  },
  fallback(p){return CombatRules.normalize({id:'element_'+p.type,name:capitalize(p.type)+' Strike',icon:TYPE_ICONS?.[p.type]||'✦',type:p.type,power:38,cost:1,special:null,fallback:true,speciesId:Number(p.id)});},
  commands(){return [CombatRules.normalize({id:'trainer_guard',name:'Guard',icon:'🛡️',type:'normal',power:0,cost:1,special:'guard',trainerCommand:true}),CombatRules.normalize({id:'trainer_focus',name:'Focus',icon:'🎯',type:'normal',power:0,cost:1,special:'focus',trainerCommand:true})];},
  build(p){
    const pool=this.pool(p),attacks=pool.filter(c=>!c.trainerCommand&&!c.fallback);
    const cheap=attacks.filter(c=>c.power>0&&c.cost<=1),mid=attacks.filter(c=>c.cost===2),utility=attacks.filter(c=>c.power===0),heavy=attacks.filter(c=>c.cost>=3);
    const unique=[],take=c=>{if(c&&!unique.some(x=>x.id===c.id)&&unique.length<4)unique.push(c);};
    // One efficient elemental move, one utility, one larger attack and one coverage move.
    take(cheap.find(c=>c.type===p.type)||cheap[0]);
    take(utility[0]);take(mid.find(c=>c.type===p.type)||mid[0]||heavy[0]);
    for(const c of [...cheap,...mid,...heavy,...utility])take(c);
    if(!unique.some(c=>c.power>0&&c.cost<=1))unique.unshift(this.fallback(p));
    while(unique.length<4)unique.push(this.fallback(p));
    const chosen=unique.slice(0,4);return [...chosen,...chosen,...this.commands()].map(c=>({...c}));
  },
  migrate(p){
    if(!p.deck?.length){p.deck=this.build(p);return;}
    const pool=this.pool(p);p.deck=p.deck.map(old=>{
      if(old.trainerCommand)return CombatRules.normalize(old);
      const match=pool.find(c=>!c.fallback&&this.key(c.name)===this.key(old.name));
      const c=match||this.fallback(p);
      return CombatRules.normalize({...c,power:Math.round(c.power*Math.pow(1.25,old.improved||0)),improved:old.improved||0,upgrade:old.upgrade});
    });
    p.cardCatalogVersion=2;
  },
  async refresh(p){
    // Optional live discovery. Failed lookups never block play or fabricate a match.
    const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),5000);
    try{
      const response=await fetch('https://api.tcgdex.net/v2/en/cards?name=eq:'+encodeURIComponent(p.name),{signal:abort.signal});
      if(!response.ok)throw Error('Card lookup unavailable');
      const list=await response.json();const records=await Promise.all(list.slice(0,6).map(async c=>{
        const r=await fetch('https://api.tcgdex.net/v2/en/cards/'+encodeURIComponent(c.id),{signal:abort.signal});return r.ok?r.json():null;
      }));
      const index=globalThis.TCG_CATALOG.species[p.id]||={};
      for(const c of records.filter(Boolean))if(c.dexId?.includes(Number(p.id)))for(const attack of c.attacks||[]){const key=this.key(attack.name);if(!index[key])index[key]={id:c.id,pokemon:c.name,attack:attack.name,image:c.image+'/low.webp',source:'TCGdex'};}
      return true;
    }catch(_){return false;}finally{clearTimeout(timer);}
  }
};

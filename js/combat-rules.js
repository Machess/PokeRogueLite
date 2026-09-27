/* Pure combat rules. Card text, previews and resolution share this specification. */
const CombatRules = (() => {
  const specs = {
    heal_10:{heal:10}, mega_drain:{heal:20}, roost:{heal:35}, heal_25_draw:{heal:35,draw:1}, recover:{heal:50},
    draw_1:{draw:1}, growl_draw:{attackDown:10,draw:1}, leer_free:{defenseDown:15},
    string_shot:{accuracyDown:15,draw:1}, metronome:{draw:2}, shield_draw:{block:45,draw:1},
    shield_35:{block:30}, shield_50:{block:55}, iron_defense:{block:50},
    debuff_atk:{attackDown:10}, debuff_acc:{accuracyDown:25}, debuff_def:{defenseDown:20},
    skip_opp:{skip:1}, slow_opp:{skip:1}, spore:{skip:1,draw:1}, flinch:{skip:1,chance:.25},
    burn_chance:{status:'burn',chance:.15}, burn:{status:'burn'}, para_chance:{status:'para',chance:.2},
    paralyse:{status:'para'}, poison:{status:'poison'}, blizzard_wing:{skip:1,chance:.3},
    leech:{leech:20,turns:3}, rain:{rain:1.25,turns:3}, hail:{hail:12,turns:3},
    recoil_15:{recoil:20}, close_combat:{recoil:25}, overheat:{recoil:25}, discharge:{recoil:15},
    flame_charge:{nextEnergy:1}, agility:{energy:1,draw:1}, bonus_action:{energy:1},
    charge:{charge:.5,chargeType:'electric'}, calm_mind:{charge:.3}, dragon_dance:{boost:.2},
    high_crit:{crit:.3}, always_crit:{crit:1}, psyshock:{pierce:true}, future_sight:{delayed:true},
    stealth_rock:{rocks:15,turns:3}, venoshock:{poisonDouble:true}, night_shade:{levelDamage:true},
    curse:{curse:20,turns:2,recoil:10}, taunt:{taunt:2}, misty_terrain:{cleanse:true},
    focus_punch:{focus:true}, transform:{copy:true}, ancient_power:{boost:.1,chance:.1},
    thief:{steal:true}, guard:{block:25}, focus:{draw:2}
  };
  function spec(card) {
    const r={...(specs[card.special]||{})};
    // Variants are data, never inferred from the description shown to the player.
    if(card.name==='Soft-Boiled') {r.heal=45;r.draw=0;}
    if(card.name==='Baton Pass'||card.name==='Amnesia')r.draw=2;
    if(card.name==='ThunderShock')r.chance=.15;
    if(card.name==='Thunderbolt')r.chance=.25;
    if(card.name==='Thunder')r.chance=.35;
    if(card.name==='Meteor Mash'){r.boost=.1;r.chance=1;}
    if(card.name==='Foul Play'){delete r.poisonDouble;r.foul=true;}
    if(card.improved&&card.power===0){for(const k of ['heal','block'])if(r[k])r[k]=Math.round(r[k]*Math.pow(1.25,card.improved));}
    return r;
  }
  function describe(card){
    const r=spec(card), a=[],pct=n=>Math.round(n*100)+'%';
    if(r.heal)a.push(`Heal ${r.heal} HP`);if(r.block)a.push(`Block ${r.block}`);
    if(r.draw)a.push(`Draw ${r.draw}`);if(r.attackDown)a.push(`Enemy ATK −${r.attackDown}`);
    if(r.defenseDown)a.push(`Enemy takes +${r.defenseDown} damage`);
    if(r.accuracyDown)a.push(`Enemy miss chance +${r.accuracyDown}% (max 75%)`);
    if(r.skip)a.push(`${r.chance?pct(r.chance)+' chance: ':''}skip next enemy action`);
    if(r.status)a.push(`${r.chance?pct(r.chance)+' chance: ':''}${({para:'paralyse for 4 turns',burn:'burn (10/turn)',poison:'poison (15/turn)'})[r.status]}`);
    if(r.leech)a.push(`Drain ${r.leech}/turn ×3; heal half`);
    if(r.rain)a.push('Water +25% for 3 turns');if(r.hail)a.push('Hail: 12/turn ×3');
    if(r.recoil)a.push(`${r.recoil} recoil (min 1 HP)`);if(r.nextEnergy)a.push('+1 energy next turn');
    if(r.energy)a.push('+1 energy (max 5)');if(r.charge)a.push(`Next ${r.chargeType||'damaging'} attack +${pct(r.charge)}`);
    if(r.boost)a.push(`${r.chance<1?pct(r.chance)+' chance: ':''}+${pct(r.boost)} attack this battle`);
    if(r.crit)a.push(r.crit===1?'Critical ×1.5':`${pct(r.crit)} critical ×1.5`);
    if(r.pierce)a.push('Ignore enemy shield');if(r.delayed)a.push('Damage after next enemy action');
    if(r.rocks)a.push('Rocks: 15/turn ×3');if(r.poisonDouble)a.push('Double damage if poisoned');
    if(r.levelDamage)a.push('Damage equals enemy level');if(r.curse)a.push('Curse: 20/turn ×2');
    if(r.taunt)a.push('Block enemy utility for 2 turns');if(r.cleanse)a.push('Clear your status effects');
    if(r.focus)a.push('Full force before enemy action');if(r.copy)a.push('Copy enemy attack (once)');
    if(r.steal)a.push('Steal enemy item if your slot is empty');if(r.foul)a.push('Add half enemy level as damage');
    if(card.upgrade==='flow')a.push('Draw 1 extra');
    if(card.exhaust)a.push('Once per battle');return a.join(' · ')||'Direct damage';
  }
  function normalize(card){return {...card,effect:describe(card)};}
  function damage(card,st,env={},critical=false){
    const r=spec(card);let n=card.power||0;
    if(r.levelDamage)return Math.max(0,st.opp.level||1);
    if(n<=0)return 0;
    const mult=env.typeMultiplier?.(card.type,st.opp.type)||0;
    n=Math.round(n*mult);if(!n)return 0;
    n=Math.round(n*(env.itemBoost||1));if(env.mewtwo&&card.type==='psychic')n*=2;
    if(env.fishing?.type===card.type)n=Math.round(n*env.fishing.mult);
    if(st.rainTurns>0&&card.type==='water')n=Math.round(n*1.25);
    const fx=st.effects||{};
    if(fx.clarity&&(card.type==='psychic'||card.type==='ghost'))n=Math.round(n*1.3);
    n=Math.round(n*(fx.briefed||1));
    if(fx.clair&&['dragon','water'].includes(card.type))n=Math.round(n*1.25);
    if(st.chargeBonus&&(!st.chargeType||st.chargeType===card.type))n=Math.round(n*(1+st.chargeBonus));
    if(st.attackBoost)n=Math.round(n*(1+st.attackBoost));
    if(r.poisonDouble&&st.statusEffects?.opp?.includes('poison'))n*=2;
    if(r.foul)n+=Math.floor((st.opp.level||0)/2);
    if(critical||r.crit===1)n=Math.round(n*1.5);
    n+=(st.oppDefDebuff||0)+(fx.endorsement?5:0);
    return Math.max(0,n-(r.pierce?0:(st.oppShield||0)));
  }
  function apply(card,st,env={}){
    const r=spec(card),rng=env.random||Math.random,logs=[];
    const critical=!!r.crit&&rng()<r.crit;
    const dmg=damage(card,st,env,critical);
    const beforeBlock=damage(card,{...st,oppShield:0},env,critical);
    if(!r.pierce&&!r.delayed&&card.power>0)st.oppShield=Math.max(0,(st.oppShield||0)-beforeBlock);
    if(r.delayed){st.futureSight={damage:dmg,turns:1};logs.push(`${card.name} is approaching!`);}
    else if(dmg){const dealt=Math.min(st.opp.hp,dmg);st.opp.hp=Math.max(0,st.opp.hp-dmg);st.totalDamageDealt=(st.totalDamageDealt||0)+dealt;logs.push(`${card.name}: ${dmg} damage!`);}
    if((card.power||0)>0){
      if(!st.chargeType||st.chargeType===card.type){st.chargeBonus=0;st.chargeType=null;}
      if(st.effects?.endorsement)st.effects.endorsement=false;
      env.consumeFishing?.(card.type);
    }
    const success=r.chance==null||rng()<r.chance;
    if(success){
      if(r.heal){const amount=Math.min(r.heal,st.player.maxHp-st.player.hp);st.player.hp+=amount;logs.push(`Healed ${amount} HP.`);}
      if(r.block)st.shield=(st.shield||0)+r.block;
      if(r.attackDown)st.oppAtkDebuff=(st.oppAtkDebuff||0)+r.attackDown;
      if(r.defenseDown)st.oppDefDebuff=(st.oppDefDebuff||0)+r.defenseDown;
      if(r.accuracyDown)st.oppAccDebuff=Math.min(75,(st.oppAccDebuff||0)+r.accuracyDown);
      if(r.skip)st.oppSkipped=true;
      if(r.status)env.addStatus?.(st,'opp',r.status,r.status==='para'?4:undefined);
      if(r.boost)st.attackBoost=(st.attackBoost||0)+r.boost;
    }
    if(r.leech){st.leechTurns=3;st.leechStacks=(st.leechStacks||0)+1;}
    if(r.rain)st.rainTurns=3;if(r.hail)st.hailTurns=3;if(r.rocks)st.stealthRock=3;
    if(r.curse)st.opp.curseTurns=2;if(r.taunt)st.oppTauntTurns=2;
    if(r.recoil)st.player.hp=Math.max(1,st.player.hp-r.recoil);
    if(r.nextEnergy)st.bonusEnergy=(st.bonusEnergy||0)+r.nextEnergy;
    if(r.energy)st.energy=Math.min(5,st.energy+r.energy);
    if(r.charge){st.chargeBonus=r.charge;st.chargeType=r.chargeType||null;}
    if(r.cleanse){st.statusEffects.player=[];Object.keys(st.statusTurns||{}).filter(k=>k.startsWith('player:')).forEach(k=>delete st.statusTurns[k]);}
    if(r.copy){const m=st.intent?.move||st.opp.moves?.find(m=>m.power>0);if(m)st.hand.push(normalize({id:'copy_'+m.name,name:m.name,type:st.opp.type,power:m.power,cost:Math.min(3,Math.max(1,Math.ceil(m.power/40))),icon:'✨',exhaust:true}));}
    if(r.steal&&st.opp.heldItem&&!st.player.heldItem){st.player.heldItem=st.opp.heldItem;st.opp.heldItem=null;env.steal?.(st.player.heldItem);logs.push('Held item stolen!');}
    env.draw?.((r.draw||0)+(card.upgrade==='flow'?1:0));
    if(!logs.length)logs.push(`${card.name}: ${describe(card)}`);
    return {damage:r.delayed?0:dmg,logs};
  }
  return {specs,spec,describe,normalize,damage,apply};
})();
if(typeof module!=='undefined')module.exports=CombatRules;

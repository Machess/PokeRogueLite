function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function setHpBar(barId, hp, maxHp, name, level) {
  // barId is the full element id prefix, e.g. 'opp', 'player', 'boss-opp', 'boss-player'
  const bar     = document.getElementById(`${barId}-hp-bar`);
  const text    = document.getElementById(`${barId}-hp-text`);
  const nameEl  = document.getElementById(`${barId}-name`);
  const levelEl = document.getElementById(`${barId}-level`);
  if (!bar) return;
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  bar.style.width = pct + '%';
  bar.style.background = hpColor(hp, maxHp);
  if (text)    text.textContent  = `${Math.max(0, hp)} / ${maxHp}`;
  if (nameEl)  nameEl.textContent  = (name || '???').toUpperCase();
  if (levelEl) levelEl.textContent = `Lv.${level}`;
}

// ── Battle sprite animations ──────────────────────────────────────────────────

// Type → CSS class for coloured hit flash on the defender
const TYPE_HIT_CLASS = {
  fire:     'hit-flash-fire',
  water:    'hit-flash-water',
  grass:    'hit-flash-grass',
  electric: 'hit-flash-electric',
  psychic:  'hit-flash-psychic',
  ice:      'hit-flash-ice',
  rock:     'hit-flash-rock',
  ground:   'hit-flash-ground',
  poison:   'hit-flash-poison',
  ghost:    'hit-flash-ghost',
  dragon:   'hit-flash-dragon',
  dark:     'hit-flash-dark',
  fighting: 'hit-flash-fighting',
  flying:   'hit-flash-flying',
  steel:    'hit-flash-steel',
  normal:   'hit-flash-normal',
};

// ─── PARTICLE EFFECTS ────────────────────────────────────────────────────────
// Spawns CSS particle burst over the target sprite.
// cost 1 → no particles; cost 2 → 4 small; cost 3 → 10 large.

const PARTICLE_CFG = {
  fire:     { shape:'flame',   colors:['#ff4400','#ff8800','#ffcc00','#ff2200'], count:10 },
  water:    { shape:'drop',    colors:['#00aaff','#44ccff','#88eeff','#0066cc'], count:9  },
  grass:    { shape:'leaf',    colors:['#44cc44','#88ee44','#00aa22','#ccff44'], count:9  },
  electric: { shape:'bolt',    colors:['#ffee00','#ffffff','#ffcc00','#ffe066'], count:8  },
  ice:      { shape:'shard',   colors:['#aaeeff','#ddfaff','#88ccee','#ffffff'], count:8  },
  psychic:  { shape:'ring',    colors:['#ff44ff','#dd88ff','#ff00cc','#ffaaff'], count:8  },
  poison:   { shape:'bubble',  colors:['#aa44cc','#cc66ee','#8800aa','#ee88ff'], count:7  },
  ghost:    { shape:'wisp',    colors:['#6633cc','#aa66ff','#220066','#cc99ff'], count:7  },
  rock:     { shape:'chunk',   colors:['#aa8844','#ccaa66','#886622','#ddbb88'], count:7  },
  ground:   { shape:'chunk',   colors:['#cc8833','#aa6622','#ee9944','#884411'], count:7  },
  flying:   { shape:'feather', colors:['#aaddff','#ffffff','#88ccee','#cceeFF'], count:7  },
  fighting: { shape:'burst',   colors:['#ee4422','#ff8844','#cc2200','#ffaa88'], count:8  },
  dragon:   { shape:'flame',   colors:['#4400ff','#8844ff','#0000cc','#aa88ff'], count:9  },
  fairy:    { shape:'ring',    colors:['#ffaaee','#ff88cc','#ffddee','#ff44aa'], count:8  },
  bug:      { shape:'leaf',    colors:['#88cc00','#aabb00','#ccee22','#66aa00'], count:6  },
  normal:   { shape:'burst',   colors:['#ffffff','#cccccc','#aaaaaa','#eeeeee'], count:5  },
};

function spawnParticles(type, cost, targetSpriteId) {
  if (cost < 2) return; // 1-energy → flash only
  const cfg  = PARTICLE_CFG[type] || PARTICLE_CFG.normal;
  const count = cost >= 3 ? cfg.count : Math.ceil(cfg.count * 0.4); // 2-energy = 40% count
  const scale = cost >= 3 ? 1 : 0.6;

  const el = document.getElementById(targetSpriteId);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const cx   = rect.left + rect.width  / 2;
  const cy   = rect.top  + rect.height / 2;

  const overlay = document.createElement('div');
  overlay.className = 'particle-overlay';
  overlay.style.cssText = `left:${cx}px;top:${cy}px;`;
  document.body.appendChild(overlay);

  for (let i = 0; i < count; i++) {
    const p     = document.createElement('span');
    const angle = (360 / count) * i + (Math.random() * 30 - 15);
    const dist  = (30 + Math.random() * 55) * scale;
    const rad   = angle * Math.PI / 180;
    const tx    = Math.cos(rad) * dist;
    const ty    = Math.sin(rad) * dist;
    const rot   = Math.random() * 360;
    const delay = Math.random() * 80;
    const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
    const size  = (cost >= 3 ? 8 + Math.random() * 7 : 5 + Math.random() * 4) * scale;

    p.className = `particle particle-${cfg.shape}`;
    p.style.cssText = `
      --tx:${tx.toFixed(1)}px;
      --ty:${ty.toFixed(1)}px;
      --rot:${rot.toFixed(0)}deg;
      --color:${color};
      --size:${size.toFixed(1)}px;
      animation-delay:${delay.toFixed(0)}ms;`;
    overlay.appendChild(p);
  }

  // For electric cost-3: add extra screen flash
  if (type === 'electric' && cost >= 3) {
    overlay.classList.add('electric-screen-flash');
  }

  setTimeout(() => overlay.remove(), 900);
}

// ─── CARD DAMAGE PREVIEW ─────────────────────────────────────────────────────
// Returns the actual damage this card will deal given current battle state.
// Mirrors _applyCardEffect without side effects.
function previewDamage(card, st) {
  if(!card||(!card.power&&!CombatRules.spec(card).levelDamage))return null;
  return CombatFlow.damage(card,st);
}
// Draws a typed energy beam connecting attacker → defender centre points.
// cost 1 → no beam; cost 2 → thin short beam; cost 3 → thick full beam.

const BEAM_CFG = {
  fire:     { core:'#ff7722', glow:'#ff2200', width:3, blur:6  },
  water:    { core:'#44ccff', glow:'#0077cc', width:3, blur:5  },
  grass:    { core:'#66ee44', glow:'#009900', width:3, blur:5  },
  electric: { core:'#ffee00', glow:'#ffffff', width:2, blur:8  },
  ice:      { core:'#cceeff', glow:'#88ccff', width:2, blur:5  },
  psychic:  { core:'#ff55ff', glow:'#aa00cc', width:4, blur:7  },
  poison:   { core:'#cc44ee', glow:'#660099', width:3, blur:5  },
  ghost:    { core:'#9955ee', glow:'#330066', width:4, blur:9  },
  dragon:   { core:'#6644ff', glow:'#0000cc', width:4, blur:7  },
  fighting: { core:'#ff6633', glow:'#cc2200', width:3, blur:4  },
  rock:     { core:'#ccaa55', glow:'#886622', width:3, blur:3  },
  ground:   { core:'#ee8833', glow:'#aa5511', width:3, blur:4  },
  flying:   { core:'#88ddff', glow:'#44aacc', width:2, blur:5  },
  fairy:    { core:'#ffaaee', glow:'#ff44aa', width:3, blur:6  },
  bug:      { core:'#99dd22', glow:'#447700', width:2, blur:4  },
  normal:   { core:'#dddddd', glow:'#999999', width:2, blur:3  },
};

// ─── MOVE ANIMATION ROUTING ──────────────────────────────────────────────────
// Classifies card name into animation style.

function isBeamMove(name) {
  const n = name.toLowerCase();
  return n.includes('beam') || n.includes('ray') || n.includes('cannon')
      || n.includes('laser') || n === 'hyper beam' || n === 'solar beam'
      || n === 'psybeam' || n === 'signal beam' || n === 'flash cannon';
}
function isStreamMove(name) {
  const n = name.toLowerCase();
  return ['flamethrower','inferno','overheat','hydro pump','thunder','thunder storm',
          'draco meteor','fire blast','sacred fire','blizzard','hurricane',
          'aerial ace','air slash'].includes(n);
}
function isArcMove(name) {
  const n = name.toLowerCase();
  return ['ember','fire spin','water gun','aqua jet','surf','whirlpool','bubble',
          'bubble beam','razor leaf','razor wind','vine whip','leaf tornado',
          'petal blizzard','ice shard','icy wind','powder snow','shadow sneak',
          'shadow punch','shadow force','shadow ball'].includes(n);
}
function isImpact(type, name) {
  // Physical contact moves — no projectile, just impact at defender
  if (type === 'fighting') return true;
  const n = name.toLowerCase();
  return ['tackle','scratch','pound','slash','cut','bite','crunch','headbutt',
          'body slam','take down','double edge','close combat','superpower',
          'strength','mega punch','mega kick','seismic toss'].includes(n);
}

// ─── TRAVELLING PARTICLES — spawn at attacker, fly to defender ───────────────
function spawnTravellingParticles(atkSpriteId, defSpriteId, type, count, arcHeight = 0) {
  const atkEl = document.getElementById(atkSpriteId);
  const defEl = document.getElementById(defSpriteId);
  if (!atkEl || !defEl) return;

  const ar  = atkEl.getBoundingClientRect();
  const dr  = defEl.getBoundingClientRect();
  const ax  = ar.left + ar.width  / 2;
  const ay  = ar.top  + ar.height / 2;
  const bx  = dr.left + dr.width  / 2;
  const by  = dr.top  + dr.height / 2;

  const cfg  = PARTICLE_CFG[type] || PARTICLE_CFG.normal;
  const travelMs = 220;

  for (let i = 0; i < count; i++) {
    const spread = (Math.random() - 0.5) * 28;
    const p    = document.createElement('div');
    p.className = `travel-particle travel-particle-${cfg.shape}`;
    const color = cfg.colors[i % cfg.colors.length];
    const size  = 6 + Math.random() * 5;
    const delay = i * (travelMs / count * 0.6);

    p.style.cssText = `
      left: ${ax}px; top: ${ay}px;
      width: ${size}px; height: ${size}px;
      background: ${color};
      --tx: ${bx - ax + spread}px;
      --ty: ${by - ay + spread}px;
      --arc: ${arcHeight}px;
      animation: travel-fly ${travelMs}ms cubic-bezier(.4,0,.2,1) ${delay}ms forwards;
      position: fixed; z-index: 9999; border-radius: 50%;
      pointer-events: none;
      box-shadow: 0 0 5px 2px ${color};
      transform: translate(-50%,-50%);`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), travelMs + delay + 100);
  }

  // Impact burst at defender after travel
  setTimeout(() => spawnImpactBurst(type, defSpriteId), travelMs);
}

function spawnImpactBurst(type, defSpriteId) {
  const el = document.getElementById(defSpriteId);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;
  const cfg = PARTICLE_CFG[type] || PARTICLE_CFG.normal;
  const overlay = document.createElement('div');
  overlay.className = 'particle-overlay';
  overlay.style.cssText = `left:${cx}px;top:${cy}px;`;
  document.body.appendChild(overlay);
  for (let i = 0; i < 5; i++) {
    const p     = document.createElement('span');
    const angle = (360/5)*i + Math.random()*20;
    const dist  = 20 + Math.random() * 25;
    const rad   = angle * Math.PI / 180;
    const color = cfg.colors[i % cfg.colors.length];
    p.className = `particle particle-${cfg.shape}`;
    p.style.cssText = `
      --tx:${(Math.cos(rad)*dist).toFixed(1)}px;
      --ty:${(Math.sin(rad)*dist).toFixed(1)}px;
      --rot:${Math.random()*360}deg;
      --color:${color};
      --size:${5+Math.random()*4}px;`;
    overlay.appendChild(p);
  }
  setTimeout(() => overlay.remove(), 800);
}

// ─── CHARGE GLOBE → BEAM — for Hyper Beam, Solar Beam, Psybeam etc. ─────────
function spawnChargeBeam(atkSpriteId, defSpriteId, type, cost) {
  const atkEl = document.getElementById(atkSpriteId);
  const defEl = document.getElementById(defSpriteId);
  if (!atkEl || !defEl) return;

  const ar = atkEl.getBoundingClientRect();
  const dr = defEl.getBoundingClientRect();
  const ax = ar.left + ar.width  / 2;
  const ay = ar.top  + ar.height / 2;
  const bx = dr.left + dr.width  / 2;
  const by = dr.top  + dr.height / 2;

  const cfg      = BEAM_CFG[type] || BEAM_CFG.normal;
  const globeSize = cost >= 3 ? 48 : 32;
  const chargeMs  = cost >= 3 ? 500 : 320;
  const travelMs  = cost >= 3 ? 180 : 140;

  // Phase 1 — charge globe at attacker
  const globe = document.createElement('div');
  globe.className = 'charge-globe';
  globe.style.cssText = `
    left: ${ax}px; top: ${ay}px;
    width: ${globeSize}px; height: ${globeSize}px;
    background: radial-gradient(circle, #ffffff 0%, ${cfg.core} 40%, ${cfg.glow} 80%, transparent 100%);
    box-shadow: 0 0 ${globeSize}px ${globeSize/2}px ${cfg.glow};
    --charge: ${chargeMs}ms;`;
  document.body.appendChild(globe);

  requestAnimationFrame(() => globe.classList.add('charge-grow'));

  // Phase 2 — fire beam after charge
  setTimeout(() => {
    globe.classList.add('charge-fire');
    setTimeout(() => globe.remove(), 200);

    // Fire the beam
    const dx    = bx - ax;
    const dy    = by - ay;
    const dist  = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const thickness  = cost >= 3 ? cfg.width * 2.5 : cfg.width * 1.8;
    const blurAmount = cost >= 3 ? cfg.blur : cfg.blur * 0.7;

    const beam = document.createElement('div');
    beam.className = 'beam-element';
    beam.style.cssText = `
      left: ${ax}px; top: ${ay}px;
      width: ${dist}px; height: ${thickness}px;
      transform: rotate(${angle}deg);
      background: linear-gradient(90deg,
        ${cfg.core} 0%, ${cfg.core} 10%,
        #ffffff 30%, ${cfg.core} 50%,
        ${cfg.glow} 80%, transparent 100%);
      box-shadow: 0 0 ${blurAmount}px ${Math.ceil(blurAmount/2)}px ${cfg.glow};
      --travel: ${travelMs}ms;`;
    document.body.appendChild(beam);

    requestAnimationFrame(() => {
      beam.classList.add('beam-shoot');
      setTimeout(() => {
        beam.classList.add('beam-fade');
        setTimeout(() => beam.remove(), 350);
      }, travelMs + 200);
    });
  }, chargeMs);

  return chargeMs; // caller delays impact by this much extra
}

function spawnBeam(attackerSpriteId, defenderSpriteId, moveType, cost) {
  if (cost < 2) return;
  const atkEl = document.getElementById(attackerSpriteId);
  const defEl = document.getElementById(defenderSpriteId);
  if (!atkEl || !defEl) return;
  const ar = atkEl.getBoundingClientRect();
  const dr = defEl.getBoundingClientRect();
  const ax = ar.left + ar.width  / 2;
  const ay = ar.top  + ar.height / 2;
  const bx = dr.left + dr.width  / 2;
  const by = dr.top  + dr.height / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const dist  = Math.sqrt(dx*dx + dy*dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const cfg        = BEAM_CFG[moveType] || BEAM_CFG.normal;
  const thickness  = cost >= 3 ? cfg.width * 2.5 : cfg.width;
  const blurAmount = cost >= 3 ? cfg.blur       : cfg.blur * 0.6;
  const travelMs   = cost >= 3 ? 180 : 140;
  const beam = document.createElement('div');
  beam.className = 'beam-element';
  beam.style.cssText = `
    left: ${ax}px; top: ${ay}px;
    width: ${dist}px; height: ${thickness}px;
    transform: rotate(${angle}deg);
    background: linear-gradient(90deg,
      ${cfg.core} 0%, ${cfg.glow} 10%,
      ${cfg.core} 40%, #ffffff 50%,
      ${cfg.core} 60%, ${cfg.glow} 85%,
      transparent 100%);
    box-shadow: 0 0 ${blurAmount}px ${Math.ceil(blurAmount/2)}px ${cfg.glow};
    --travel: ${travelMs}ms;`;
  document.body.appendChild(beam);
  requestAnimationFrame(() => {
    beam.classList.add('beam-shoot');
    setTimeout(() => {
      beam.classList.add('beam-fade');
      setTimeout(() => beam.remove(), 350);
    }, travelMs + 200);
  });
}

function applyHitAnimation(attackerSpriteId, defenderSpriteId, moveType, cost = 1, cardName = '', cardIcon = '') {
  if (typeof AttackFX !== 'undefined' && AttackFX.play(attackerSpriteId, defenderSpriteId, moveType, cost, cardName)) return;
  const atk = document.getElementById(attackerSpriteId);
  const def = document.getElementById(defenderSpriteId);

  const isBeam    = cost >= 2 && isBeamMove(cardName);
  const isStream  = cost >= 2 && isStreamMove(cardName);
  const isArc     = isArcMove(cardName);
  const isContact = isImpact(moveType, cardName);

  // Attacker lunge — skip for charge-beam moves (globe handles timing)
  if (atk && !isBeam) {
    atk.classList.remove('sprite-lunge');
    void atk.offsetWidth;
    atk.classList.add('sprite-lunge');
    setTimeout(() => atk.classList.remove('sprite-lunge'), 350);
  }

  // ── BEAM MOVES — charge globe → beam ──────────────────────────────────────
  if (isBeam) {
    const chargeMs = spawnChargeBeam(attackerSpriteId, defenderSpriteId, moveType, cost);
    // Lunge during charge phase
    if (atk) {
      setTimeout(() => {
        atk.classList.remove('sprite-lunge');
        void atk.offsetWidth;
        atk.classList.add('sprite-lunge');
        setTimeout(() => atk.classList.remove('sprite-lunge'), 350);
      }, chargeMs - 100);
    }
    const impactDelay = chargeMs + (cost >= 3 ? 180 : 140);
    if (def) {
      const flashClass = TYPE_HIT_CLASS[moveType] || 'hit-flash-normal';
      setTimeout(() => {
        def.classList.remove('hit-shake', flashClass);
        void def.offsetWidth;
        def.classList.add('hit-shake', flashClass);
        setTimeout(() => def.classList.remove('hit-shake', flashClass), 500);
        spawnParticles(moveType, cost, defenderSpriteId);
      }, impactDelay);
    }
    return;
  }

  // ── STREAM MOVES — travelling particles + no beam ─────────────────────────
  if (isStream) {
    const cfg   = PARTICLE_CFG[moveType] || PARTICLE_CFG.normal;
    const count = cost >= 3 ? 10 : 6;
    setTimeout(() => spawnTravellingParticles(attackerSpriteId, defenderSpriteId, moveType, count, 0), 80);
    if (def) {
      const flashClass = TYPE_HIT_CLASS[moveType] || 'hit-flash-normal';
      setTimeout(() => {
        def.classList.remove('hit-shake', flashClass);
        void def.offsetWidth;
        def.classList.add('hit-shake', flashClass);
        setTimeout(() => def.classList.remove('hit-shake', flashClass), 500);
      }, 310);
    }
    return;
  }

  // ── ARC MOVES — particles arc from attacker to defender ───────────────────
  if (isArc) {
    const count    = cost >= 2 ? 7 : 4;
    const arcH     = ['water gun','aqua jet','surf','hydro pump','bubble','bubble beam',
                      'razor leaf','razor wind','ember','fire spin'].includes(cardName.toLowerCase()) ? -35 : -20;
    setTimeout(() => spawnTravellingParticles(attackerSpriteId, defenderSpriteId, moveType, count, arcH), 80);
    if (def) {
      const flashClass = TYPE_HIT_CLASS[moveType] || 'hit-flash-normal';
      setTimeout(() => {
        def.classList.remove('hit-shake', flashClass);
        void def.offsetWidth;
        def.classList.add('hit-shake', flashClass);
        setTimeout(() => def.classList.remove('hit-shake', flashClass), 500);
      }, 300);
    }
    return;
  }

  // ── SPECIAL CONTACT MOVES — sound/emoji/scratch/leer/whip/web/cloud/heal ──
  if (applySpecialAnimation(cardName, attackerSpriteId, defenderSpriteId, moveType, cost, cardIcon || '💥')) {
    return;
  }

  // ── CONTACT/IMPACT MOVES — impact burst at defender only, no projectile ───
  if (isContact) {
    if (def) {
      const flashClass = TYPE_HIT_CLASS[moveType] || 'hit-flash-normal';
      setTimeout(() => {
        def.classList.remove('hit-shake', flashClass);
        void def.offsetWidth;
        def.classList.add('hit-shake', flashClass);
        setTimeout(() => def.classList.remove('hit-shake', flashClass), 500);
        if (cost >= 2) spawnParticles(moveType, cost, defenderSpriteId);
      }, 150);
    }
    return;
  }

  // ── DEFAULT — non-classified: beam for cost≥2, flash only for cost 1 ──────
  if (cost >= 2) {
    setTimeout(() => spawnBeam(attackerSpriteId, defenderSpriteId, moveType, cost), 80);
  }
  const impactDelay = cost >= 2 ? 260 : 150;
  if (def) {
    const flashClass = TYPE_HIT_CLASS[moveType] || 'hit-flash-normal';
    setTimeout(() => {
      def.classList.remove('hit-shake', flashClass);
      void def.offsetWidth;
      def.classList.add('hit-shake', flashClass);
      setTimeout(() => def.classList.remove('hit-shake', flashClass), 500);
      spawnParticles(moveType, cost, defenderSpriteId);
    }, impactDelay);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTACT & SPECIAL MOVE ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

// ── Classifiers for new move categories ──────────────────────────────────
function isSoundMove(name) {
  const n = name.toLowerCase();
  return ['growl','roar','screech','hyper voice','disarming voice','bug buzz',
          'perish song','sing','supersonic'].includes(n);
}
function isEmojiSlamMove(name) {
  const n = name.toLowerCase();
  return ['tackle','headbutt','body slam','double edge','take down',
          'pound','mega punch','quick attack','extreme speed'].includes(n);
}
function isScratchMove(name) {
  const n = name.toLowerCase();
  return ['scratch','slash','cut','fury swipes','fury attack',
          'slash','night slash','psycho cut','cross chop',
          'x-scissor','wing attack','aerial ace'].includes(n);
}
function isLeerMove(name) {
  const n = name.toLowerCase();
  return ['leer','glare','scary face','mean look','mind reader'].includes(n);
}
function isWhipMove(name) {
  const n = name.toLowerCase();
  return ['vine whip','power whip','dragon tail','crabhammer'].includes(n);
}
function isWebMove(name) {
  const n = name.toLowerCase();
  return ['string shot','spider web','electroweb','leech life'].includes(n);
}
function isStatusCloud(name) {
  const n = name.toLowerCase();
  return ['poison powder','sleep powder','stun spore','spore',
          'smokescreen','sand attack','sweet scent','cotton spore',
          'poison gas','haze'].includes(n);
}
function isHealMove(name) {
  const n = name.toLowerCase();
  return ['recover','soft-boiled','roost','synthesis','morning sun',
          'moonlight','wish','slack off','heal order','milk drink',
          'swallow','heal pulse'].includes(n);
}
function isSpeedMove(name) {
  const n = name.toLowerCase();
  return ['agility','amnesia','swords dance','nasty plot','calm mind',
          'dragon dance','quiver dance','growth','meditate','harden',
          'minimize','barrier','cosmic power','iron defense'].includes(n);
}

// ── Sound wave arcs — Growl / Roar / Screech ─────────────────────────────
function spawnSoundWaves(atkSpriteId, moveName) {
  const atkEl = document.getElementById(atkSpriteId);
  if (!atkEl) return;
  const r  = atkEl.getBoundingClientRect();
  const cx = r.left + r.width  / 2;
  const cy = r.top  + r.height / 2;

  const isRoar    = moveName.toLowerCase() === 'roar';
  const isScreech = moveName.toLowerCase() === 'screech';
  const count     = isRoar ? 5 : 3;
  const color     = isScreech ? '#ff6644' : isRoar ? '#cc2200' : '#ffffff';

  for (let i = 0; i < count; i++) {
    const arc = document.createElement('div');
    arc.className = 'sound-arc';
    const size = 30 + i * 24;
    arc.style.cssText = `
      left: ${cx}px; top: ${cy}px;
      width: ${size}px; height: ${size}px;
      border: 3px solid ${color};
      animation: sound-arc-expand 500ms ease-out ${i * 90}ms forwards;`;
    document.body.appendChild(arc);
    setTimeout(() => arc.remove(), 500 + i * 90 + 100);
  }
}

// ── Emoji slam — Tackle / Headbutt / Pound etc. ───────────────────────────
function spawnEmojiSlam(icon, atkSpriteId, defSpriteId, heavy = false) {
  const atkEl = document.getElementById(atkSpriteId);
  const defEl = document.getElementById(defSpriteId);
  if (!atkEl || !defEl) return;

  const ar = atkEl.getBoundingClientRect();
  const dr = defEl.getBoundingClientRect();
  const ax = ar.left + ar.width  / 2;
  const ay = ar.top  + ar.height / 2;
  const bx = dr.left + dr.width  / 2;
  const by = dr.top  + dr.height / 2;

  const slam = document.createElement('div');
  slam.className = 'emoji-slam';
  slam.textContent = icon || '💥';
  slam.style.cssText = `
    left: ${ax}px; top: ${ay}px;
    --tx: ${bx - ax}px; --ty: ${by - ay}px;
    font-size: ${heavy ? 2.4 : 1.8}rem;
    animation: emoji-travel 200ms cubic-bezier(.2,0,.8,1.4) forwards;`;
  document.body.appendChild(slam);

  // Impact: bounce off target, screen shake for heavy
  setTimeout(() => {
    slam.style.animation = 'emoji-bounce 180ms ease-out forwards';
    if (heavy) spawnScreenShake();
    // Squash target briefly
    if (defEl) {
      defEl.style.transition = 'transform 80ms';
      defEl.style.transform  = 'scaleX(0.88) scaleY(1.1)';
      setTimeout(() => { defEl.style.transform = ''; defEl.style.transition = ''; }, 160);
    }
  }, 200);

  setTimeout(() => slam.remove(), 420);
}

// ── Screen shake — Headbutt / Body Slam ──────────────────────────────────
function spawnScreenShake() {
  const sc = document.querySelector('.screen.active');
  if (!sc) return;
  sc.classList.remove('screen-shake');
  void sc.offsetWidth;
  sc.classList.add('screen-shake');
  setTimeout(() => sc.classList.remove('screen-shake'), 400);
}

// ── Scratch marks — Scratch / Slash / Cut / Fury Swipes ──────────────────
function spawnScratchMarks(defSpriteId, count = 3) {
  const defEl = document.getElementById(defSpriteId);
  if (!defEl) return;
  const r  = defEl.getBoundingClientRect();
  const cx = r.left + r.width  / 2;
  const cy = r.top  + r.height / 2;
  const w  = r.width  * 0.7;
  const h  = r.height * 0.7;

  for (let i = 0; i < count; i++) {
    const mark = document.createElement('div');
    const dir  = (i % 2 === 0) ? 1 : -1; // alternating direction for fury
    const offsetX = (i - (count-1)/2) * 14;
    mark.className = 'scratch-mark';
    mark.style.cssText = `
      left: ${cx + offsetX}px;
      top:  ${cy}px;
      width: ${w * 0.6}px;
      height: 3px;
      transform: rotate(${-45 * dir}deg);
      animation: scratch-draw 80ms linear ${i * 55}ms forwards;`;
    document.body.appendChild(mark);
    setTimeout(() => {
      mark.style.opacity = '0';
      mark.style.transition = 'opacity 250ms';
    }, 80 + i * 55 + 100);
    setTimeout(() => mark.remove(), 550);
  }

  // White flash at first contact
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: fixed; left: ${cx}px; top: ${cy}px;
    width: 40px; height: 40px;
    background: rgba(255,255,255,.85);
    border-radius: 50%;
    transform: translate(-50%,-50%);
    pointer-events: none; z-index: 9999;
    animation: quick-flash 120ms ease-out forwards;`;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 150);
}

// ── Leer eyes — Leer / Glare / Scary Face ────────────────────────────────
function spawnLeerEyes(defSpriteId) {
  const defEl = document.getElementById(defSpriteId);
  if (!defEl) return;
  const r  = defEl.getBoundingClientRect();
  const cx = r.left + r.width  / 2;
  const cy = r.top  + r.height * 0.38; // upper third — eye level

  const eyes = document.createElement('div');
  eyes.className = 'leer-eyes';
  eyes.style.cssText = `left: ${cx}px; top: ${cy}px;`;
  eyes.innerHTML = `
    <div class="leer-eye leer-left"></div>
    <div class="leer-eye leer-right"></div>`;
  document.body.appendChild(eyes);

  // Dim target while leering
  defEl.style.filter     = 'brightness(0.65)';
  defEl.style.transition = 'filter 80ms';
  setTimeout(() => { defEl.style.filter = ''; defEl.style.transition = ''; }, 700);

  setTimeout(() => eyes.remove(), 800);
}

// ── Vine Whip ─────────────────────────────────────────────────────────────
function spawnVineWhip(atkSpriteId, defSpriteId) {
  const atkEl = document.getElementById(atkSpriteId);
  const defEl = document.getElementById(defSpriteId);
  if (!atkEl || !defEl) return;
  const ar = atkEl.getBoundingClientRect();
  const dr = defEl.getBoundingClientRect();
  const ax = ar.left + ar.width  / 2;
  const ay = ar.top  + ar.height / 2;
  const bx = dr.left + dr.width  / 2;
  const by = dr.top  + dr.height / 2;
  const dx = bx - ax, dy = by - ay;
  const dist  = Math.sqrt(dx*dx + dy*dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  for (let i = 0; i < 2; i++) {
    const vine = document.createElement('div');
    vine.className = 'vine-whip';
    const offset = (i === 0 ? -4 : 4);
    vine.style.cssText = `
      left: ${ax}px; top: ${ay + offset}px;
      width: ${dist}px;
      transform: rotate(${angle + offset}deg);
      animation: vine-extend 160ms ease-out forwards,
                 vine-retract 140ms ease-in ${250}ms forwards;`;
    document.body.appendChild(vine);
    setTimeout(() => vine.remove(), 420);
  }

  // Whip-crack flash at target
  setTimeout(() => {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed; left: ${bx}px; top: ${by}px;
      width: 20px; height: 20px;
      background: #ffffff;
      border-radius: 50%;
      transform: translate(-50%,-50%);
      pointer-events: none; z-index: 9999;
      animation: quick-flash 100ms ease-out forwards;`;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 130);
  }, 200);
}

// ── String Shot / Web ────────────────────────────────────────────────────
function spawnWeb(atkSpriteId, defSpriteId) {
  const atkEl = document.getElementById(atkSpriteId);
  const defEl = document.getElementById(defSpriteId);
  if (!atkEl || !defEl) return;
  const ar = atkEl.getBoundingClientRect();
  const dr = defEl.getBoundingClientRect();
  const ax = ar.left + ar.width / 2, ay = ar.top + ar.height / 2;
  const bx = dr.left + dr.width / 2, by = dr.top + dr.height / 2;
  const dx = bx - ax, dy = by - ay;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  for (let i = 0; i < 5; i++) {
    const thread = document.createElement('div');
    thread.className = 'web-thread';
    const spread = (i - 2) * 6;
    thread.style.cssText = `
      left: ${ax}px; top: ${ay}px;
      width: ${dist}px;
      transform: rotate(${angle + spread}deg);
      animation: web-shoot 180ms ease-out ${i * 30}ms forwards;`;
    document.body.appendChild(thread);
    setTimeout(() => {
      thread.style.opacity = '0';
      thread.style.transition = 'opacity 300ms';
    }, 180 + i * 30 + 200);
    setTimeout(() => thread.remove(), 750);
  }
}

// ── Status cloud — powders / spores / smokescreen ────────────────────────
function spawnStatusCloud(atkSpriteId, defSpriteId, color) {
  const atkEl = document.getElementById(atkSpriteId);
  const defEl = document.getElementById(defSpriteId);
  if (!atkEl || !defEl) return;
  const ar = atkEl.getBoundingClientRect();
  const dr = defEl.getBoundingClientRect();
  const ax = ar.left + ar.width / 2, ay = ar.top + ar.height / 2;
  const bx = dr.left + dr.width / 2, by = dr.top + dr.height / 2;

  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'status-cloud-puff';
    const spread = (Math.random() - 0.5) * 30;
    p.style.cssText = `
      left: ${ax}px; top: ${ay}px;
      background: ${color};
      --tx: ${bx - ax + spread}px;
      --ty: ${by - ay + spread}px;
      width: ${10 + Math.random() * 10}px;
      height: ${10 + Math.random() * 10}px;
      animation: cloud-drift 500ms ease-out ${i * 40}ms forwards;
      position: fixed; z-index: 9999; border-radius: 50%;
      pointer-events: none; transform: translate(-50%,-50%);
      opacity: 0.75;`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 600 + i * 40);
  }
}

// ── Heal sparkles — Recover / Soft-Boiled etc. ───────────────────────────
function spawnHealSparkles(atkSpriteId) {
  const el = document.getElementById(atkSpriteId);
  if (!el) return;
  const r  = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top  + r.height / 2;

  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'heal-sparkle';
    const angle = (360 / 8) * i;
    const dist  = 20 + Math.random() * 20;
    const rad   = angle * Math.PI / 180;
    p.style.cssText = `
      left: ${cx}px; top: ${cy}px;
      --tx: ${Math.cos(rad) * dist}px;
      --ty: ${Math.sin(rad) * dist - 40}px;
      animation: heal-rise 600ms ease-out ${i * 50}ms forwards;
      position: fixed; z-index: 9999;
      pointer-events: none; transform: translate(-50%,-50%);
      font-size: ${0.6 + Math.random() * 0.4}rem;`;
    p.textContent = '✦';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 700 + i * 50);
  }
}

// ── Speed lines — Agility / Swords Dance etc. ────────────────────────────
function spawnSpeedLines(atkSpriteId) {
  const el = document.getElementById(atkSpriteId);
  if (!el) return;
  const r  = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top  + r.height / 2;
  const w  = r.width;

  for (let i = 0; i < 4; i++) {
    const line = document.createElement('div');
    line.className = 'speed-line';
    const yOff = (i - 1.5) * (r.height * 0.22);
    line.style.cssText = `
      left: ${cx - w * 0.7}px;
      top:  ${cy + yOff}px;
      width: ${w * 1.4}px;
      animation: speed-flash 220ms ease-out ${i * 40}ms forwards;`;
    document.body.appendChild(line);
    setTimeout(() => line.remove(), 350);
  }
}

// ─── ROUTING inside applyHitAnimation — new contact categories ───────────
// Called before isContact default path, with early return.
function applySpecialAnimation(cardName, atkId, defId, moveType, cost, icon) {
  const n = cardName.toLowerCase();

  if (isSoundMove(cardName)) {
    spawnSoundWaves(atkId, cardName);
    // Sound waves don't deal a visible hit — debuff only, no shake
    return true;
  }
  if (isLeerMove(cardName)) {
    spawnLeerEyes(defId);
    return true;
  }
  if (isScratchMove(cardName)) {
    const scratchCount = ['fury swipes','fury attack'].includes(n) ? 5 : n === 'x-scissor' ? 2 : 3;
    setTimeout(() => spawnScratchMarks(defId, scratchCount), 100);
    // Also shake
    const defEl = document.getElementById(defId);
    if (defEl) setTimeout(() => {
      defEl.classList.remove('hit-shake'); void defEl.offsetWidth;
      defEl.classList.add('hit-shake');
      setTimeout(() => defEl.classList.remove('hit-shake'), 400);
    }, 80);
    return true;
  }
  if (isEmojiSlamMove(cardName)) {
    const heavy = ['headbutt','body slam','double edge'].includes(n);
    setTimeout(() => spawnEmojiSlam(icon, atkId, defId, heavy), 80);
    const defEl = document.getElementById(defId);
    if (defEl) setTimeout(() => {
      defEl.classList.remove('hit-shake'); void defEl.offsetWidth;
      defEl.classList.add('hit-shake');
      setTimeout(() => defEl.classList.remove('hit-shake'), 400);
    }, 280);
    return true;
  }
  if (isWhipMove(cardName)) {
    spawnVineWhip(atkId, defId);
    const defEl = document.getElementById(defId);
    if (defEl) setTimeout(() => {
      defEl.classList.remove('hit-shake'); void defEl.offsetWidth;
      defEl.classList.add('hit-shake');
      setTimeout(() => defEl.classList.remove('hit-shake'), 300);
    }, 210);
    return true;
  }
  if (isWebMove(cardName)) {
    spawnWeb(atkId, defId);
    return true; // web is a debuff — no shake
  }
  if (isStatusCloud(cardName)) {
    const colors = {
      'poison powder':'rgba(160,60,200,.6)', 'poison gas':'rgba(140,40,180,.5)',
      'sleep powder':'rgba(80,160,220,.5)', 'spore':'rgba(80,220,80,.5)',
      'stun spore':'rgba(220,200,40,.55)', 'smokescreen':'rgba(100,100,100,.5)',
      'sand attack':'rgba(180,130,60,.55)', 'sweet scent':'rgba(220,120,200,.5)',
      'cotton spore':'rgba(200,220,255,.6)', 'haze':'rgba(80,80,100,.5)',
    };
    const color = colors[n] || 'rgba(150,100,200,.5)';
    spawnStatusCloud(atkId, defId, color);
    return true;
  }
  if (isHealMove(cardName)) {
    spawnHealSparkles(atkId);
    return true;
  }
  if (isSpeedMove(cardName)) {
    spawnSpeedLines(atkId);
    return true;
  }
  return false; // not handled — fall through
}

// Keep shakeSprite for status-tick damage (no attacker, no type colour needed)
function shakeSprite(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hit-shake');
  void el.offsetWidth;
  el.classList.add('hit-shake');
  setTimeout(() => el.classList.remove('hit-shake'), 500);
}

function addStatus(st, who, status, turns) {
  if (!hasStatus(st, who, status)) st.statusEffects[who].push(status);
  // Track a remaining-turns counter for timed statuses (e.g. paralysis) so they
  // can never last forever. Stored in a parallel map keyed by who+status.
  if (turns) {
    if (!st.statusTurns) st.statusTurns = {};
    st.statusTurns[who + ':' + status] = turns;
  }
}
function hasStatus(st, who, status) {
  return st.statusEffects[who]?.includes(status);
}
function removeStatus(st, who, status) {
  if (st.statusEffects[who]) st.statusEffects[who] = st.statusEffects[who].filter(s => s !== status);
  if (st.statusTurns) delete st.statusTurns[who + ':' + status];
}
function statusTurnsLeft(st, who, status) {
  return st.statusTurns?.[who + ':' + status] ?? 0;
}
// Decrement timed statuses for one side at the start/!end of their turn; clears
// any that reach zero. Returns a list of statuses that just wore off (for logging).
function tickStatuses(st, who) {
  if (!st.statusTurns) return [];
  const worn = [];
  (st.statusEffects[who] || []).slice().forEach(status => {
    const key = who + ':' + status;
    if (st.statusTurns[key] != null) {
      st.statusTurns[key]--;
      if (st.statusTurns[key] <= 0) { removeStatus(st, who, status); worn.push(status); }
    }
  });
  return worn;
}

// ─── INIT — wire all buttons here, zero inline onclick in HTML ────────────────


const BattleEngine = {
  isBoss: false,
  state: null,

  async start(node) {
    this.isBoss = false;
    this._isTrainerBattle = false;
    // 60% chance of trainer battle — shows intro screen first
    if (Math.random() < 0.60) {
      await TrainerBattleEngine.start(node);
      return;
    }

    showLoading();

    // Pick random wild opponent
    const pool = Math.random() < .7 ? 'common' : Math.random() < .6 ? 'uncommon' : 'rare';
    const poolArr = getWildPool()[pool];
    const oppId = poolArr[Math.floor(Math.random() * poolArr.length)];
    const level = 5 + GameState.bossesDefeated * 6 + Math.floor(Math.random() * 5);

    const [oppData] = await Promise.all([fetchPoke(oppId)]);
    const oppType = oppData.types[0]?.type?.name || 'normal';
    const oppName = capitalize(oppData.name);
    const oppSprite = getSpriteUrl(oppData, true);
    const opp = makePokemon(oppId, level, oppSprite, oppName, oppType);

    const active = GameState.party[GameState.activePokemonIndex];
    const playerData = await fetchPoke(active.id).catch(() => null);
    // Keep spriteUrl as front-facing; store back sprite separately for battle only
    const backSprite = playerData?.sprites?.back_default
                    || playerData?.sprites?.front_default
                    || active.spriteUrl;
    active.backSpriteUrl = backSprite;

    // Preload both sprites before the battle screen appears — no pop-in
    await preloadImages([oppSprite, backSprite]);

    hideLoading();
    setBattleBg(oppType, false);
    showScreen('battle');
    this._initBattle(active, opp, false);
  },

  _initBattle(playerPoke, oppPoke, isBoss) {
    CombatFlow.resetFlags(this);
    this.isBoss             = isBoss;
    this._focusSashUsed     = false;
    this._chargeBonus       = 0;
    this._futureSightDmg    = 0;
    this._dragonDanceBonus  = 0;
    this._itemUsedThisTurn  = false;
    this._battleOver        = false;
    const activeDeck = playerPoke.deck || GameState.deck;
    this.state = {
      player: { ...playerPoke },
      opp:    { ...oppPoke },
      drawPile:    shuffle(activeDeck.map(c=>({...CombatRules.normalize(c)}))),
      hand:        [],
      discardPile: [],
      exhaustedPile: [],
      energy:      3,
      statusEffects: { player: [], opp: [] },
      statusTurns: {},
      _stallTurns: 0,
      _lastHpSnapshot: null,
      shield: GameState.cookingShield || 0,
      oppAtkDebuff: 0,
      oppDefDebuff: 0,
      oppAccDebuff: 0,
      rainTurns: 0,
      leechTurns: 0,
      leechStacks: 0,
      oppSkipped: false,
      playerFlinch: false,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      cardsPlayedCount: 0,
      bonusEnergy: 0,
    };
    // Consume the cooking shield — one battle only
    if (GameState.cookingShield) {
      this._logPlayer(`🍽️ Brock's meal! ${GameState.cookingShield} dmg shield active!`);
      GameState.cookingShield = 0;
    }

    // Apply pending player statuses from mini-game losses (Jigglypuff, Surge etc.)
    const pendingStatuses = GameState.pendingPlayerStatuses || [];
    if (pendingStatuses.length > 0) {
      pendingStatuses.forEach(s => {
        if (s === 'sleep_0energy') {
          // Jigglypuff loss: sleep + 0 energy first turn
          addStatus(this.state, 'player', 'sleep');
          this.state.energy = 0;
          this._logEnemy(`💤 ${playerPoke.name} starts the battle asleep! (Jigglypuff's revenge)`);
        } else if (s === 'confuse') {
          addStatus(this.state, 'player', 'confuse');
          this._logEnemy(`😵 ${playerPoke.name} is confused! (Jigglypuff's doing)`);
        } else if (s === 'burn') {
          addStatus(this.state, 'player', 'burn');
          this._logEnemy(`🔥 ${playerPoke.name} starts Burned! (Erika's failed potion)`);
        } else if (s === 'opp_poison_start') {
          addStatus(this.state, 'opp', 'poison');
          this._logPlayer(`☠️ Opponent starts Poisoned! (Misty's catch)`);
        } else if (s === 'party_poison') {
          // Koga loss: whole party poisoned (applied to active only since only one in battle)
          addStatus(this.state, 'player', 'poison');
          this._logEnemy(`☠️ ${playerPoke.name} starts Poisoned! (Koga's punishment)`);
        } else {
          addStatus(this.state, 'player', s);
        }
      });
      GameState.pendingPlayerStatuses = [];
    }

    // Apply pending battle effects (Surge briefing, Clarity buff, etc.)
    const fx = GameState.pendingPlayerEffects || {};
    // Reset per-battle buff flags first so none persist from a previous battle
    this._cookRegen = 0; this._cookRegenAmt = 0; this._enduranceOnce = false; this._statusResist = false;
    if (fx.briefedDmgBonus) {
      this._briefedBonus = fx.briefedDmgBonus;
      this._logPlayer(`⚡ BRIEFED! +${Math.round((fx.briefedDmgBonus - 1) * 100)}% damage this battle! (Surge's intel)`);
    }
    if (fx.courageBonus) {
      // Courage buff (from escaping Team Rocket in Dig Dash) — reuses the same
      // damage-multiplier mechanism but with its own message.
      this._briefedBonus = fx.courageBonus;
      this._logPlayer(`🔥 COURAGE! +${Math.round((fx.courageBonus - 1) * 100)}% damage this battle! (You outran Team Rocket!)`);
    }
    if (fx.clarityBuff) {
      this._clarityBuff = true;
      this._logPlayer(`🥷 Clarity! Status durations halved this battle. (Ninja focus)`);
    }
    if (fx.typeAnnotations) {
      this._typeAnnotations = true;
      this._logPlayer(`🔬 Blaine's analysis: type hints active on your cards this battle!`);
    }
    if (fx.typeConfusion) {
      this._typeConfusion = true;
      // Flag a random card in the opening hand after deal
      this._typeConfusionPending = true;
    }
    if (fx.battleHp) {
      this._jigglypuffRevive = fx.battleHp;
      this._logPlayer(`💤 Jigglypuff's lullaby — auto-revive ready if you faint!`);
    }
    if (fx.giovanniEndorsement) {
      this._giovanniEndorsement = true;
      this._logPlayer(`⭐ Giovanni's Endorsement — first card played deals +5 bonus damage!`);
    }
    if (fx.giovanniDisinfo) {
      this._giovanniDisinfoPending = true;
    }
    if (fx.wobbuffetCounter) {
      const reflected = 20;
      this.state.opp.hp = Math.max(0, this.state.opp.hp - reflected);
      this._logPlayer(`🛡️ Wobbuffet COUNTER! Reflected ${reflected} damage to the opponent!`);
    }
    if (fx.wobbuffetBackfire) {
      this.state.player.hp = Math.max(1, this.state.player.hp - 10);
      this._logPlayer(`😬 Wobbuffet wobbled and hit your party for 10 damage...`);
    }
    if (fx.falknerWind)     { this.state.oppAccDebuff = (this.state.oppAccDebuff||0)+30;
                              this._logPlayer(`🪶 Wind Sense — enemy accuracy -30% this battle!`); }
    if (fx.whitneyDodge)    { this.state.shield = (this.state.shield||0)+999;
                              this._logPlayer(`🎀 Rollout Resist — first hit fully blocked!`); }
    if (fx.mortyClairvoyance){ this._mortyClairvoyance = true;
                              this._logPlayer(`👻 Clairvoyance — next draw is your strongest card!`); }
    if (fx.jasmineForge)    { this.state.shield = (this.state.shield||0)+40;
                              this._logPlayer(`⚙️ Forged Steel — steel shield 40 dmg active!`); }
    if (fx.pryce_catch_bonus){ GameState.pryceCatchBonus = true;
                              this._logPlayer(`❄️ Cold Precision — next catch rate doubled!`); }
    if (fx.clairDragonBane) { this._clairBoost = true;
                              this._logPlayer(`🐉 Dragon Bane — Dragon/Water +25% this battle!`); }
    if (fx.bugsyResearch)   { this.state.oppAtkDebuff = (this.state.oppAtkDebuff||0)+15;
                              this._logPlayer(`🐛 Bug Research — enemy attack -15% this battle!`); }
    if (fx.chuckDiscipline) { this.state.energy = (this.state.energy || 0) + 1;
                              this._logPlayer(`🕐 Chuck's Discipline — +1 energy this turn!`); }
    if (fx.luckyCharm)      { this.state.oppSkipped = true;
                              this._logPlayer(`✨ Lucky Charm! ${this.state.opp.name}'s first attack misses! (Togepi's blessing)`); }
    // ── Brock's Kitchen dish buffs ──────────────────────────────────────────
    if (fx.cookSunnyStart)   { this.state.energy = (this.state.energy || 0) + 1;
                               this._logPlayer(`🍳 Sunny Start — +1 energy this turn! (Brock's omelette)`); }
    if (fx.cookSweetEnergy)  { this._briefedBonus = Math.max(this._briefedBonus || 1, 1.10);
                               this._logPlayer(`🥞 Sweet Energy — +10% damage! (Brock's pancakes)`); }
    if (fx.cookQuickReflexes){ this.state.oppSkipped = true;
                               this._logPlayer(`🍚 Quick Reflexes — opponent is slow to start, you go first! (Brock's fried rice)`); }
    if (fx.cookMorale)       { this._cookRegen = 3; this._cookRegenAmt = 0.08;
                               this._logPlayer(`🧁 Morale Boost — heal a little each turn! (Poképuffs)`); }
    if (fx.cookShield)       { this.state.shield = (this.state.shield || 0) + 30;
                               this._logPlayer(`🍲 Hearty Defense — 30 dmg shield! (Brock's soup)`); }
    if (fx.cookIronStomach)  { this._statusResist = true;
                               this._logPlayer(`🍝 Iron Stomach — resist status effects! (Brock's pasta)`); }
    if (fx.cookRegen)        { this._cookRegen = 99; this._cookRegenAmt = 0.06;
                               this._logPlayer(`🍖 Regeneration — heal at the end of each turn! (Brock's stew)`); }
    if (fx.cookRefreshed)    { this.state.statusEffects = this.state.statusEffects || { player: [], opp: [] };
                               this.state.statusEffects.player = [];
                               this._logPlayer(`🥤 Refreshed — all status cleansed! (Brock's smoothie)`); }
    if (fx.cookVitality)     { const lead = GameState.party[GameState.activePokemonIndex];
                               if (lead) { const b = Math.floor(lead.maxHp * 0.15); this.state.player.maxHp += b; this.state.player.hp += b; }
                               this._logPlayer(`🥗 Vitality — +15% max HP this battle! (Brock's fruit salad)`); }
    if (fx.cookEndurance)    { this._enduranceOnce = true;
                               this._logPlayer(`🥜 Endurance — survive a fatal hit once! (Brock's trail mix)`); }
    GameState.pendingPlayerEffects = {};

    CombatFlow.initialize(this);
    if(isBoss)BossEngine.bState=this.state;
    this._dealHand(5);
    this._render();
    SaveManager.forceCapture=true;SaveManager.captureBattle(isBoss);SaveManager.forceCapture=false;

    // Type confusion (Blaine loss) — mark one random opening card as misfiring
    if (this._typeConfusionPending && this.state.hand.length > 0) {
      this._typeConfusionPending = false;
      const confIdx = Math.floor(Math.random() * this.state.hand.length);
      this.state.hand[confIdx]._typeConfused = true;
      this._logEnemy(`🔀 Type Confusion! One card in your hand will misfire! (Blaine's experiment)`);
    }
    // Giovanni Disinformation — one card shows false power value
    if (this._giovanniDisinfoPending && this.state.hand.length > 0) {
      this._giovanniDisinfoPending = false;
      const dIdx = Math.floor(Math.random() * this.state.hand.length);
      this.state.hand[dIdx]._disinfoCard = true;
      this._logEnemy(`🃏 Disinformation planted! One card shows false power. (Giovanni's revenge)`);
    }
    this._logSystem(
      this._isTrainerBattle
        ? `Trainer sent out <b>${oppPoke.name}</b>!`
        : `A wild <b>${oppPoke.name}</b> appeared!`
    );
  },

  _dealHand(n) {
    for (let i = 0; i < n; i++) {
      if (this.state.drawPile.length === 0) {
        this.state.drawPile = shuffle([...this.state.discardPile]);
        this.state.discardPile = [];
      }
      if (this.state.drawPile.length > 0) {
        this.state.hand.push(this.state.drawPile.pop());
      }
    }
  },

  _render() {
    if(this.isBoss){BossEngine.bState=this.state;BossEngine._render();return;}
    const st = this.state;
    CombatUI.intent(st,false);

    // HP bars
    setHpBar('opp',    st.opp.hp,    st.opp.maxHp,    st.opp.name,    st.opp.level);
    setHpBar('player', st.player.hp, st.player.maxHp, st.player.name, st.player.level);

    // Opponent type badge
    const typeBadge = document.getElementById('opp-type-badge');
    if (typeBadge && st.opp.type) {
      typeBadge.textContent = st.opp.type;
      typeBadge.className   = `hud-type-badge type-${st.opp.type}`;
    }

    // Status effect badges on opponent
    const statusWrap = document.getElementById('opp-status-badges');
    if (statusWrap) {
      statusWrap.innerHTML = '';
      (st.statusEffects?.opp || []).forEach(s => {
        const b = document.createElement('span');
        b.className = `status-badge status-${s}`;
        const turns = statusTurnsLeft(st, 'opp', s);
        b.textContent = (STATUS_LABELS[s] || s) + (turns > 0 ? ` (${turns})` : '');
        statusWrap.appendChild(b);
      });
      // ATK debuff badge
      if (st.oppAtkDebuff > 0) {
        const b = document.createElement('span');
        b.className   = 'status-badge status-debuff-atk';
        b.textContent = `ATK-${st.oppAtkDebuff}`;
        statusWrap.appendChild(b);
      }
      // DEF debuff badge
      if ((st.oppDefDebuff||0) > 0) {
        const b = document.createElement('span');
        b.className   = 'status-badge status-debuff-def';
        b.textContent = `DEF-${st.oppDefDebuff}`;
        statusWrap.appendChild(b);
      }
      // ACC debuff badge
      if ((st.oppAccDebuff||0) > 0) {
        const b = document.createElement('span');
        b.className   = 'status-badge status-debuff-acc';
        b.textContent = `ACC-${st.oppAccDebuff}%`;
        statusWrap.appendChild(b);
      }
      // Leech indicator
      if (st.leechTurns > 0) {
        const b = document.createElement('span');
        b.className = 'status-badge status-leech';
        b.textContent = `🌿${st.leechTurns}`;
        statusWrap.appendChild(b);
      }
      // Rain indicator
      if (st.rainTurns > 0) {
        const b = document.createElement('span');
        b.className = 'status-badge status-rain';
        b.textContent = `🌧${st.rainTurns}`;
        statusWrap.appendChild(b);
      }
    }

    // Update opp debuff detail panel if visible
    const panel = document.getElementById('opp-debuff-panel');
    if (panel && panel.style.display !== 'none') {
      this._renderDebuffPanel(st);
    }

    // Player status badges
    const playerStatusWrap = document.getElementById('player-status-badges');
    if (playerStatusWrap) {
      playerStatusWrap.innerHTML = '';
      (st.statusEffects?.player || []).forEach(s => {
        const b = document.createElement('span');
        b.className = `status-badge status-${s}`;
        const turns = statusTurnsLeft(st, 'player', s);
        b.textContent = (STATUS_LABELS[s] || s) + (turns > 0 ? ` (${turns})` : '');
        playerStatusWrap.appendChild(b);
      });
    }

    // Sprites — player shows back, opponent shows front
    const ps = document.getElementById('player-sprite');
    const os = document.getElementById('opp-sprite');
    if (os) { os.style.visibility = ''; os.classList.remove('pokemon-faint'); }
    ps.src = st.player.backSpriteUrl || st.player.spriteUrl;
    os.src = st.opp.spriteUrl;

    // Piles
    document.getElementById('draw-count').textContent    = st.drawPile.length;
    document.getElementById('discard-count').textContent = st.discardPile.length;

    // Energy orbs
    const energyEl = document.getElementById('actions-left');
    if (energyEl) {
      const orbs = Array.from({length:Math.max(3,st.energy)},(_,i)=>i).map(i =>
        `<span class="energy-orb ${i < st.energy ? 'energy-orb-full' : 'energy-orb-empty'}"></span>`
      ).join('');
      energyEl.innerHTML = `<span class="energy-label">Energy</span>${orbs}`;
    }

    // Hand
    const handEl = document.getElementById('hand-area');
    handEl.innerHTML = '';
    st.hand.forEach((card, i) => {
      handEl.appendChild(this._makeCardEl(card, i));
    });

    // Party swap
    this._renderPartySwap();
  },

  _makeCardEl(card, idx) {
    card=CombatRules.normalize(card);
    const st = this.state;
    const oppType   = st.opp?.type || 'normal';
    const mult      = card.power > 0 ? getTypeMultiplier(card.type, oppType) : 1;
    const effLabel  = card.power > 0 ? typeEffectivenessLabel(mult) : null;
    const cost      = card.cost ?? 1;
    const canAfford = st.energy >= cost;
    const disabled  = !canAfford;

    const el = document.createElement('div');
    el.className = 'card'
      + (disabled ? ' disabled' : '')
      + (mult >= 2 ? ' card-super' : mult === 0 || mult <= 0.5 ? ' card-weak' : '');
    el.dataset.type = card.type;
    if (card._copied) el.dataset.copied = 'true';

    const effBadge = effLabel
      ? `<div class="card-eff-badge" style="color:${effLabel.color}">${effLabel.text}</div>`
      : '';

    // Full damage preview — accounts for type, held item boost, mewtwo, fishing buff, rain, charge
    const actualDmg = previewDamage(card, st);
    let powerDisplay;
    if (card.power <= 0) {
      powerDisplay = '✦';
    } else if (card._disinfoCard) {
      // Giovanni disinformation — show inflated fake value
      const fakePower = card.power + Math.floor(Math.random() * 8) + 5;
      powerDisplay = `<span style="color:#ff9944">${fakePower}</span>`;
    } else if (actualDmg !== null && actualDmg !== card.power) {
      const previewColor = actualDmg > card.power ? '#80ee80' : '#ee8880';
      powerDisplay = `<span class="card-power-base">${card.power}</span> → <span style="color:${previewColor};font-weight:bold">${actualDmg}</span>`;
    } else {
      powerDisplay = `${card.power}`;
    }

    const effectHint = '';
    // Cost pip: 0=gold star, 1=white dot, 2=orange dots, 3=red dots
    const costColour = cost === 0 ? '#ffd700' : cost === 1 ? '#ccc' : cost === 2 ? '#ff9040' : '#ff4040';
    const costPips   = cost === 0
      ? `<span class="card-cost-pip" style="color:${costColour}">★</span>`
      : Array(cost).fill(`<span class="card-cost-pip" style="color:${costColour}">●</span>`).join('');

    el.innerHTML = `
      <div class="card-cost-row">${costPips}</div>
      <div class="card-icon">${card.icon}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-power">⚔ ${powerDisplay}</div>
      <div class="card-effect">${card.effect}</div>
      ${effectHint}
      ${effBadge}
      ${card.exhaust ? `<div class="card-exhaust-badge">🔥 Once</div>` : ''}
      ${card.improved ? `<div class="card-improved-badge">+${card.improved}</div>` : ''}
    `;
    el.appendChild(CardInspector.button(card));
    if (!disabled) el.onclick = () => this.playCard(idx);
    return el;
  },

  _renderDebuffPanel(st) {
    // Use boss panel if boss battle area is active, else wild panel
    const panelId = document.getElementById('boss-battle-area')?.style.display !== 'none'
      ? 'boss-debuff-panel' : 'opp-debuff-panel';
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const lines = [];
    const statuses = st.statusEffects?.opp || [];
    if (statuses.includes('burn'))    lines.push(`🔥 Burn — ${st.opp.name} loses 10 HP each turn`);
    if (statuses.includes('poison'))  lines.push(`☠ Poison — ${st.opp.name} loses 15 HP each turn`);
    if (statuses.includes('para'))    lines.push(`⚡ Paralysis — 40% chance to skip a turn`);
    if (statuses.includes('sleep'))   lines.push(`💤 Sleep — skips turns until it wakes`);
    if (statuses.includes('confuse')) lines.push(`🌀 Confused — 30% chance of self-damage`);
    if (st.oppAtkDebuff > 0)      lines.push(`⚔ ATK debuff: -${st.oppAtkDebuff} · each hit deals ~${st.oppAtkDebuff} less dmg`);
    if ((st.oppDefDebuff||0) > 0) lines.push(`🛡 DEF debuff: -${st.oppDefDebuff} · each hit deals ~${st.oppDefDebuff} less dmg`);
    if ((st.oppAccDebuff||0) > 0) lines.push(`🎯 Accuracy: -${st.oppAccDebuff}% · ${st.oppAccDebuff}% chance to miss`);
    if (st.leechTurns > 0)   lines.push(`🌿 Leech Seed: drains ${st.leechTurns} more turns`);
    if (st.rainTurns > 0)    lines.push(`🌧 Rain: Water moves +20%, Fire moves -20%`);
    if (!lines.length) lines.push('No active debuffs or status effects.');
    panel.innerHTML = `
      <div class="debuff-panel-title">📋 ${st.opp.name} — Status</div>
      <div class="debuff-panel-hp">❤ ${st.opp.hp} / ${st.opp.maxHp} HP</div>
      ${lines.map(l => `<div class="debuff-panel-line">${l}</div>`).join('')}`;
  },

  _toggleDebuffPanel() {
    const panel = document.getElementById('opp-debuff-panel');
    if (!panel) return;
    const visible = panel.style.display !== 'none';
    panel.style.display = visible ? 'none' : 'block';
    if (!visible) this._renderDebuffPanel(this.state);
  },

  _renderPartySwap() {
    const el = document.getElementById('party-swap');
    el.innerHTML = '';
    GameState.party.forEach((p, i) => {
      if (i === GameState.activePokemonIndex || p.hp <= 0) return;
      const btn = document.createElement('button');
      btn.className = 'swap-btn';
      btn.title = `Switch to ${p.name} (costs 2 actions)`;
      btn.innerHTML = `<img src="${p.spriteUrl}" alt="${p.name}" />`;
      btn.onclick = () => this.switchPokemon(i);
      el.appendChild(btn);
    });

    // Use Item button — grey out if already used this turn or no potions
    const itemBtn = document.getElementById('btn-use-item');
    if (itemBtn) {
      const hasPotions = ItemEngine.hasPotions();
      const used       = this._itemUsedThisTurn;
      itemBtn.disabled = used || !hasPotions;
      itemBtn.style.opacity = (used || !hasPotions) ? '0.4' : '1';
      itemBtn.textContent   = used ? '✓ Item Used' : '🎒 Item';
    }
  },

  // ── Logging helpers ─────────────────────────────────────────────────────────
  // Each helper targets the correct panel and formats numbers with colour spans.
  _logPlayer(html) { this._writeLog('player', html); },
  _logEnemy(html)  { this._writeLog('enemy',  html); },
  _logSystem(html) {
    // System messages flash briefly on the enemy row then fade — no permanent slot
    this._writeLog('enemy', `<span class="log-sys">${html}</span>`);
  },

  _writeLog(panel, html) {
    const isBoss  = this.isBoss;
    const msgId   = isBoss
      ? (panel === 'player' ? 'boss-log-player-msg' : 'boss-log-enemy-msg')
      : (panel === 'player' ? 'log-player-msg'      : 'log-enemy-msg');
    const rowId   = isBoss
      ? (panel === 'player' ? 'boss-log-player'     : 'boss-log-enemy')
      : (panel === 'player' ? 'log-player'          : 'log-enemy');
    const msgEl = document.getElementById(msgId);
    const rowEl = document.getElementById(rowId);
    if (!msgEl) return;
    msgEl.innerHTML = html;
    // Flash animation so the update is noticed even if text is similar
    if (rowEl) {
      rowEl.classList.remove('log-flash');
      void rowEl.offsetWidth;
      rowEl.classList.add('log-flash');
    }
  },

  // Legacy _log kept for any callers that haven't been updated — routes to system
  _log(msg) { this._logSystem(msg); },

  playCard(handIndex) { CombatFlow.play(handIndex, false); },

  _applyCardEffect(card) { CombatFlow.apply(this, card); },

  endTurn() { CombatFlow.end(false); },

  _oppAttack() { EnemyAI.act(this.state, this); },

  _checkDefeated() {
    const st = this.state;

    if (st.opp.hp <= 0) {
      this._battleOver = true;

      // Type matchup comment in battle log
      const playerType = st.player.type || 'normal';
      const oppType    = st.opp.type    || 'normal';
      const mult       = getTypeMultiplier(playerType, oppType);
      const matchupLog =
        mult >= 2  ? `⚡ Type advantage! ${st.player.name}'s ${playerType} was super effective!` :
        mult === 0 || mult < 1 ? `💪 ${st.player.name} overcame the type disadvantage — impressive!` :
                    `⚔️ A fair fight. Your cards made the difference.`;
      this._logSystem(matchupLog);
      this._logSystem(`⭐ ${st.opp.name} fainted! You win!`);

      // Faint animation on opponent sprite — class stays on to preserve forwards fill,
      // then hide the element so it never snaps back to visible
      const oppSpriteEl = document.getElementById(this.isBoss ? 'boss-opp-sprite' : 'opp-sprite');
      if (oppSpriteEl) {
        oppSpriteEl.classList.add('pokemon-faint');
        setTimeout(() => { oppSpriteEl.style.visibility = 'hidden'; }, 700);
      }

      // Pass matchup tier to victory for fluff text
      this._lastMatchupMult = mult;
      setTimeout(() => this._victory(), 1400);
      return true;
    }
    if (st.player.hp <= 0) {
      // Brock's Trail Mix — Endurance: survive one fatal hit at 1 HP
      if (this._enduranceOnce) {
        this._enduranceOnce = false;
        st.player.hp = 1;
        this._logPlayer(`🥜 Endurance! ${st.player.name} hangs on at 1 HP! (Brock's trail mix)`);
        this._render && this._render();
        return false;
      }
      // Jigglypuff lullaby revive — triggers once if active
      if (this._jigglypuffRevive > 0) {
        const reviveHp = this._jigglypuffRevive;
        this._jigglypuffRevive = 0;
        st.player.hp = reviveHp;
        this._logPlayer(`💤 Jigglypuff's lullaby! ${st.player.name} woke up with ${reviveHp} HP!`);
        this._render();
        return false;
      }
      const activeIdx = GameState.activePokemonIndex;

      // Focus Sash — survive with 1 HP
      if (ItemEngine.checkFocusSash(st, 'player', this)) {
        this._logPlayer(`🎗 Focus Sash! ${st.player.name} held on with 1 HP!`);
        this._render();
        return false;
      }

      // Revive Potion — prevent faint
      if (ItemEngine.checkRevive(activeIdx)) {
        st.player.hp = GameState.party[activeIdx].hp; // sync restored HP
        this._logPlayer(`🧪 Revive Potion! ${st.player.name} was revived!`);
        this._render();
        return false;
      }

      GameState.party[activeIdx].hp = 0;
      this._logSystem(`💔 ${st.player.name} fainted!`);
      const next = GameState.party.findIndex((p, i) => i !== activeIdx && p.hp > 0);
      if (next >= 0) {
        st.busy=true;
        setTimeout(()=>{if(!GameState||this.state!==st)return;st.busy=false;CombatFlow.switch(next,false,true);},500);
      } else {
        this._battleOver = true;
        setTimeout(() => this._defeat(), 1200);
      }
      return true;
    }
    return false;
  },

  _victory() {
    GameState.party[GameState.activePokemonIndex].hp = this.state.player.hp;
    if (!GameState.stats) GameState.stats = {};
    GameState.stats.battlesWon          = (GameState.stats.battlesWon       || 0) + 1;
    GameState.stats.totalBattlesWon     = (GameState.stats.totalBattlesWon  || 0) + 1;
    const activePoke = GameState.party[GameState.activePokemonIndex];
    activePoke.battlesWon = (activePoke.battlesWon || 0) + 1;

    const opp = this.state.opp;
    registerPokedex(opp.id, opp.name, opp.spriteUrl, false, opp.type || null);

    // Trainer battle — delegate to TrainerBattleEngine which handles
    // multi-Pokémon flow, gold accumulation, and completion.
    if (this._isTrainerBattle) {
      TrainerBattleEngine.onPokemonDefeated();
      return;
    }

    const earned = goldForWildBattle();
    GameState.gold = (GameState.gold || 0) + earned;
    ItemEngine.checkPassive();
    MapEngine.completeNode(GameState.currentNodeIndex);

    // Level up all living party members; handle any triggered evolutions
    const evolutions = levelUpParty('battle');
    if (evolutions.length > 0) {
      saveGame();
      runEvolutions(evolutions, () => CardReward.show(earned));
    } else {
      CardReward.show(earned);
    }
  },

  _defeat() {
    deleteSave();
    GameOver.show(`the wild ${this.state.opp.name}`);
  },

  switchPokemon(idx) { CombatFlow.switch(idx,false); },
};

// ─── BOSS INTRO BACKGROUNDS ──────────────────────────────────────────────────
// Full-portrait backgrounds shown during trainer introduction only.
// Naming: assets/bg_N_boss.png  (N = bossIndex 0-12)
// If the file doesn't exist the GYM_FALLBACKS gradient is used instead.

const HELD_ITEM_TIERS = {
  shell_bell:   {
    effects: ['Heal 5 HP per hit', 'Heal 10 HP per hit', 'Heal 18 HP per hit'],
    values:  [5, 10, 18],
  },
  leftovers:    {
    effects: ['Heal 5 HP per turn', 'Heal 10 HP per turn', 'Heal 18 HP per turn'],
    values:  [5, 10, 18],
  },
  lucky_egg:    {
    effects: ['+1 level per win', '+2 levels per win', '+3 levels per win'],
    values:  [1, 2, 3],
  },
  amulet_coin:  {
    effects: ['Gold ×2', 'Gold ×2.5', 'Gold ×3'],
    values:  [2, 2.5, 3],
  },
  focus_sash:   {
    effects: ['Survive KO at 1 HP', 'Survive KO + heal 15 HP', 'Survive KO + heal 30 HP'],
    values:  [0, 15, 30],
  },
  charcoal:     {
    effects: ['Fire +20%', 'Fire +35%', 'Fire +50%'],
    values:  [1.20, 1.35, 1.50],
  },
  mystic_water: {
    effects: ['Water +20%', 'Water +35%', 'Water +50%'],
    values:  [1.20, 1.35, 1.50],
  },
  miracle_seed: {
    effects: ['Grass +20%', 'Grass +35%', 'Grass +50%'],
    values:  [1.20, 1.35, 1.50],
  },
  magnet:       {
    effects: ['Electric +20%', 'Electric +35%', 'Electric +50%'],
    values:  [1.20, 1.35, 1.50],
  },
};

// Upgrade cost formula: base = item.price, scales by tier and boss progress
function heldItemUpgradeCost(itemId, currentTier) {
  const def = SHOP_ITEMS.find(i => i.id === itemId);
  const base = def?.price || 30;
  const bi   = GameState.bossesDefeated || 0;
  return currentTier === 1
    ? Math.round(base * 1.5) + bi * 5
    : Math.round(base * 2.5) + bi * 8;
}

const ItemEngine = {

  // ── Show a toast notification over the battle screen ────────────────────
  showBattleToast(msg, isBoss = false) {
    const id  = isBoss ? 'boss-battle-item-toast' : 'battle-item-toast';
    const el  = document.getElementById(id);
    if (!el) return;
    el.innerHTML = msg;  // allow emoji + span formatting
    el.classList.remove('toast-show');
    void el.offsetWidth;
    el.classList.add('toast-show');
    clearTimeout(el._toastTimer);
    el._toastTimer = setTimeout(() => el.classList.remove('toast-show'), 2200);
  },

  // ── Bag bar (map header) ─────────────────────────────────────────────────
  renderBagBar() {
    // ── Lure pill — always-visible passive status ─────────────────────────────
    const lurePill = document.getElementById('lure-pill');
    if (lurePill) lurePill.style.display = GameState.lureActive ? '' : 'none';

    // ── Bag button — count badge ──────────────────────────────────────────────
    const bagBtn   = document.getElementById('bag-btn');
    const bagBadge = document.getElementById('bag-count-badge');
    if (!bagBtn) return;

    const itemCount    = (GameState.items || []).reduce((s, i) => s + (i.count || 0), 0);
    const erikaCount   = (GameState.erikaPotions || []).length;
    const totalCount   = itemCount + erikaCount;

    if (bagBadge) {
      bagBadge.textContent = totalCount;
      bagBadge.style.display = totalCount > 0 ? '' : 'none';
    }
    bagBtn.classList.toggle('bag-btn-empty', totalCount === 0);

    // Wire click — only once (remove old listener via clone)
    const newBtn = bagBtn.cloneNode(true);
    bagBtn.parentNode.replaceChild(newBtn, bagBtn);
    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleBagPanel(newBtn);
    });
  },

  _toggleBagPanel(anchor) {
    // Close if already open
    const existing = document.getElementById('bag-panel');
    if (existing) { existing.remove(); return; }

    const panel = document.createElement('div');
    panel.id        = 'bag-panel';
    panel.className = 'bag-panel';

    const itemCount  = (GameState.items || []).reduce((s, i) => s + (i.count || 0), 0);
    const erikaCount = (GameState.erikaPotions || []).length;

    if (itemCount === 0 && erikaCount === 0) {
      panel.innerHTML = `<div class="bag-panel-empty">🎒<br>Bag is empty.<br><span>Buy items at the Shop.</span></div>`;
    } else {
      panel.innerHTML = this._buildBagPanelHTML();
      // Wire Erika potion use buttons
      panel.querySelectorAll('.bag-slot-use-btn').forEach(btn => {
        const idx = parseInt(btn.dataset.idx);
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          panel.remove();
          const potion = (GameState.erikaPotions || [])[idx];
          if (!potion) return;
          showModal(`🌸 Use ${potion.name}?`,
            `Effect: ${potion.desc}\n\nUse now?`,
            () => ItemEngine.applyErikaPotion(idx));
        });
      });
      // Wire stone use buttons
      panel.querySelectorAll('.bag-stone-btn').forEach(btn => {
        const id = btn.dataset.stone;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          panel.remove();
          const def = SHOP_ITEMS.find(s => s.id === id);
          const target = def?.stoneTarget;
          if (!target) return;
          showModal(`${def.icon} Use ${def.name}?`,
            `Eevee will evolve into ${target.name} (${target.type}-type).\n\nThis cannot be undone.`,
            () => stoneEvolve(id));
        });
      });
    }

    document.body.appendChild(panel);

    // Position below the bag button
    const rect = anchor.getBoundingClientRect();
    const panelW = 220;
    let left = rect.right - panelW;
    if (left < 6) left = 6;
    panel.style.top  = (rect.bottom + 6) + 'px';
    panel.style.left = left + 'px';

    // Close on outside click
    const close = (e) => { if (!panel.contains(e.target)) { panel.remove(); document.removeEventListener('click', close); } };
    setTimeout(() => document.addEventListener('click', close), 50);
  },

  _buildBagPanelHTML() {
    const items    = GameState.items || [];
    const erika    = GameState.erikaPotions || [];
    const bi       = GameState.bossesDefeated || 0;

    // Category colours
    const TINT = {
      potion:       'rgba(60,100,200,.25)',
      super_potion: 'rgba(60,100,200,.35)',
      revive_potion:'rgba(140,60,200,.25)',
      oran_berry:   'rgba(200,100,20,.2)',
      ultra_ball:   'rgba(200,170,0,.2)',
      master_ball:  'rgba(140,0,200,.25)',
    };

    let html = '';

    // ── Consumable potions + revives ─────────────────────────────────────────
    const potions = items.filter(i => {
      const def = SHOP_ITEMS.find(s => s.id === i.id);
      return def && (def.category === 'consumable') && i.id !== 'lure' && i.count > 0;
    });
    if (potions.length > 0) {
      html += `<div class="bag-section-label">💊 Items</div><div class="bag-slot-grid">`;
      potions.forEach(item => {
        const def  = SHOP_ITEMS.find(s => s.id === item.id);
        const tint = TINT[item.id] || 'rgba(255,255,255,.08)';
        html += `
          <div class="bag-slot" style="background:${tint}" title="${def?.description || ''}">
            <span class="bag-slot-count">×${item.count}</span>
            <span class="bag-slot-icon">${item.icon || def?.icon || '📦'}</span>
            <span class="bag-slot-name">${def?.name || item.id}</span>
            <span class="bag-slot-hint">Use in battle</span>
          </div>`;
      });
      html += `</div>`;
    }

    // ── Erika potions — usable on map ────────────────────────────────────────
    if (erika.length > 0) {
      html += `<div class="bag-section-label">🌸 Brewed Potions</div><div class="bag-slot-grid">`;
      erika.forEach((potion, idx) => {
        html += `
          <div class="bag-slot bag-slot-erika" title="${potion.desc}">
            <span class="bag-slot-count">×1</span>
            <span class="bag-slot-icon">🌸</span>
            <span class="bag-slot-name">${potion.name}</span>
            <button class="bag-slot-use-btn" data-idx="${idx}">Use</button>
          </div>`;
      });
      html += `</div>`;
    }

    // ── Balls ────────────────────────────────────────────────────────────────
    const balls = items.filter(i => {
      const def = SHOP_ITEMS.find(s => s.id === i.id);
      return def?.category === 'ball' && i.count > 0;
    });
    if (balls.length > 0) {
      html += `<div class="bag-section-label">🔵 ${T.ballPlural}</div><div class="bag-slot-grid">`;
      balls.forEach(item => {
        const def  = SHOP_ITEMS.find(s => s.id === item.id);
        const tint = TINT[item.id] || 'rgba(255,255,255,.08)';
        html += `
          <div class="bag-slot" style="background:${tint}" title="${def?.description || ''}">
            <span class="bag-slot-count">×${item.count}</span>
            <span class="bag-slot-icon">${item.icon || def?.icon || '🔵'}</span>
            <span class="bag-slot-name">${def?.name || item.id}</span>
            <span class="bag-slot-hint">Used in catch</span>
          </div>`;
      });
      html += `</div>`;
    }

    // ── Evolution stones ─────────────────────────────────────────────────────
    const stones = items.filter(i => {
      const def = SHOP_ITEMS.find(s => s.id === i.id);
      return def?.category === 'stone' && i.count > 0 && !GameState.eeveeEvolution;
    });
    if (stones.length > 0) {
      html += `<div class="bag-section-label">💎 Stones</div><div class="bag-slot-grid">`;
      stones.forEach(item => {
        const def = SHOP_ITEMS.find(s => s.id === item.id);
        html += `
          <div class="bag-slot bag-slot-stone" title="${def?.description || ''}">
            <span class="bag-slot-count">×${item.count}</span>
            <span class="bag-slot-icon">${item.icon || def?.icon || '💎'}</span>
            <span class="bag-slot-name">${def?.name || item.id}</span>
            <button class="bag-stone-btn" data-stone="${item.id}">Use</button>
          </div>`;
      });
      html += `</div>`;
    }

    return html || '<div class="bag-panel-empty">Nothing to show.</div>';
  },

  // Apply an Erika potion by index — works both in and out of battle
  applyErikaPotion(idx, st = null, isBoss = false) {
    const potions = GameState.erikaPotions || [];
    const potion  = potions[idx];
    if (!potion) return null;

    GameState.erikaPotions = potions.filter((_, i) => i !== idx);

    const lead = st ? null : GameState.party.find(p => p.hp > 0);
    let msg = `🌸 ${potion.name} used!`;

    switch (potion.effect) {
      case 'heal40pct': {
        const target = st?.player || lead;
        if (target) {
          const heal = Math.floor((target.maxHp || 60) * 0.4);
          target.hp = Math.min(target.maxHp, (target.hp || 0) + heal);
          msg = `🌸 ${potion.name}! ${target.name} recovered ${heal} HP!`;
        }
        break;
      }
      case 'party_heal15':
        GameState.party.forEach(p => { p.hp = Math.min(p.maxHp, (p.hp || 0) + 15); });
        msg = `🌸 ${potion.name}! All Pokémon healed 15 HP!`;
        break;
      case 'poison_aura':
        if (!GameState.pendingPlayerStatuses) GameState.pendingPlayerStatuses = [];
        GameState.pendingPlayerStatuses.push('opp_poison_start');
        msg = `🌸 ${potion.name}! Opponent will start next battle Poisoned!`;
        break;
      case 'fire_boost':
        GameState.fishingBuff = { type: 'fire', mult: 1.5 };
        msg = `🌸 ${potion.name}! Fire cards deal +50% next battle!`;
        break;
      case 'freeze_first':
        if (!GameState.pendingPlayerEffects) GameState.pendingPlayerEffects = {};
        GameState.pendingPlayerEffects.freezeFirst = true;
        msg = `🌸 ${potion.name}! Opponent's first move next battle skipped!`;
        break;
    }

    saveGame();
    this.renderBagBar();
    if (st) this.showBattleToast(msg, isBoss);
    return { msg };
  },

  getHeldItem(pokemon)  { return pokemon?.heldItem || null; },

  equipItem(pokemon, itemId) {
    const def = SHOP_ITEMS.find(s => s.id === itemId);
    if (!def || def.category !== 'held') return false;
    if (pokemon.heldItem) this.addItem(pokemon.heldItem.id);
    pokemon.heldItem = { ...def };
    this.useItem(itemId);
    saveGame();
    return true;
  },

  unequipItem(pokemon) {
    if (!pokemon.heldItem) return;
    this.addItem(pokemon.heldItem.id);
    pokemon.heldItem = null;
    saveGame();
  },

  moveHeldItem(fromPoke, toPoke) {
    if (!fromPoke.heldItem) return;
    const item = fromPoke.heldItem;
    if (toPoke.heldItem) this.addItem(toPoke.heldItem.id);
    toPoke.heldItem   = item;
    fromPoke.heldItem = null;
    saveGame();
  },

  // ── Oran Berry — passive, starter only, 20HP, visible toast ─────────────
  checkBerryMidBattle(st, who, isBoss = false) {
    // Only apply to the starter
    const starter = GameState.party.find(p => p.isStarter);
    if (!starter) return null;
    const activeIsStarter = GameState.party[GameState.activePokemonIndex]?.isStarter;
    if (!activeIsStarter) return null;

    const berries = (GameState.items || []).filter(i => i.id === 'oran_berry' && i.count > 0);
    if (!berries.length) return null;

    if (st[who].hp > 0 && st[who].hp < st[who].maxHp * 0.5) {
      const heal = 20;
      st[who].hp = Math.min(st[who].maxHp, st[who].hp + heal);
      berries[0].count--;
      if (berries[0].count <= 0)
        GameState.items = GameState.items.filter(i => !(i.id === 'oran_berry' && i.count <= 0));
      this.renderBagBar();
      const msg = `🍊 Oran Berry! ${st[who].name} healed ${logHeal(heal)} HP!`;
      this.showBattleToast(msg, isBoss);
      return msg;
    }
    return null;
  },

  // ── Active potion use — called from Use Item button ──────────────────────
  // Returns { healed, msg } or null if no potions available
  usePotion(st, isBoss = false) {
    const items = GameState.items || [];
    // Prefer Super Potion if available, else Potion
    let item = items.find(i => i.id === 'super_potion' && i.count > 0)
            || items.find(i => i.id === 'potion'       && i.count > 0);
    if (!item) return null;

    const healAmt = item.id === 'super_potion' ? 60 : 30;
    const before  = st.player.hp;
    st.player.hp  = Math.min(st.player.maxHp, st.player.hp + healAmt);
    const actual  = st.player.hp - before;

    item.count--;
    if (item.count <= 0) GameState.items = GameState.items.filter(i => i !== item);
    this.renderBagBar();
    saveGame();

    const icon    = item.id === 'super_potion' ? '💉' : '💊';
    const label   = item.id === 'super_potion' ? 'Super Potion' : 'Potion';
    const msg     = `${icon} ${label}! ${st.player.name} healed ${logHeal(actual)} HP!`;
    this.showBattleToast(msg, isBoss);
    return { healed: actual, msg };
  },

  // Returns true if any potion is in the bag
  hasPotions() {
    return (GameState.items || []).some(i =>
      (i.id === 'potion' || i.id === 'super_potion') && i.count > 0
    );
  },

  // ── Show/hide the in-battle item picker ──────────────────────────────────
  renderItemPicker(isBoss, onUse) {
    const pickerId = isBoss ? 'boss-battle-item-picker' : 'battle-item-picker';
    const picker   = document.getElementById(pickerId);
    if (!picker) return;

    // Build list of usable bag items (potions only for now)
    const usable = (GameState.items || []).filter(i =>
      (i.id === 'potion' || i.id === 'super_potion') && i.count > 0
    );

    if (usable.length === 0 && !(GameState.erikaPotions?.length > 0)) {
      picker.innerHTML = '<div class="item-picker-empty">No usable items!</div>';
      picker.style.display = 'block';
      setTimeout(() => { picker.style.display = 'none'; }, 1200);
      return;
    }

    picker.innerHTML = '';
    usable.forEach(item => {
      const def  = SHOP_ITEMS.find(s => s.id === item.id);
      const btn  = document.createElement('button');
      btn.className = 'item-picker-btn';
      btn.innerHTML = `<span class="item-picker-icon">${item.icon}</span>
                       <span class="item-picker-name">${item.name}</span>
                       <span class="item-picker-count">×${item.count}</span>`;
      btn.onclick = () => {
        picker.style.display = 'none';
        onUse(item.id);
      };
      picker.appendChild(btn);
    });

    // Erika's custom potions
    (GameState.erikaPotions || []).forEach((potion, idx) => {
      const btn = document.createElement('button');
      btn.className = 'item-picker-btn item-picker-erika';
      btn.innerHTML = `<span class="item-picker-icon">🌸</span>
                       <span class="item-picker-name">${potion.name}</span>
                       <span class="item-picker-count erika-potion-desc">${potion.desc}</span>`;
      btn.onclick = () => {
        picker.style.display = 'none';
        onUse('erika_' + idx);
      };
      picker.appendChild(btn);
    });

    // Close button
    const close = document.createElement('button');
    close.className = 'item-picker-close';
    close.textContent = '✕';
    close.onclick = () => { picker.style.display = 'none'; };
    picker.appendChild(close);

    picker.style.display = 'block';
  },

  closeItemPicker(isBoss) {
    const id = isBoss ? 'boss-battle-item-picker' : 'battle-item-picker';
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  },

  // ── Revive Potion ────────────────────────────────────────────────────────
  checkRevive(partyIdx) {
    if (!GameState.items) return false;
    const revive = GameState.items.find(i => i.id === 'revive_potion' && i.count > 0);
    if (!revive) return false;
    const p = GameState.party[partyIdx];
    p.hp = Math.floor(p.maxHp * 0.3);
    revive.count--;
    if (revive.count <= 0) GameState.items = GameState.items.filter(i => i !== revive);
    this.renderBagBar();
    return true;
  },

  // ── Focus Sash ───────────────────────────────────────────────────────────
  checkFocusSash(st, who, battleObj) {
    const poke = who === 'player' ? GameState.party[GameState.activePokemonIndex] : null;
    if (!poke || !poke.heldItem || poke.heldItem.id !== 'focus_sash') return false;
    if (battleObj._focusSashUsed) return false;
    if (st[who].hp <= 0) {
      const tier   = poke.heldItem.tier || 1;
      const healAmt = HELD_ITEM_TIERS.focus_sash.values[tier - 1] || 0;
      st[who].hp = 1 + healAmt;
      battleObj._focusSashUsed = true;
      return true;
    }
    return false;
  },

  // ── Shell Bell ───────────────────────────────────────────────────────────
  checkShellBell(st, battleObj) {
    const poke = GameState.party[GameState.activePokemonIndex];
    if (!poke?.heldItem || poke.heldItem.id !== 'shell_bell') return null;
    const tier = poke.heldItem.tier || 1;
    const heal = HELD_ITEM_TIERS.shell_bell.values[tier - 1] || 5;
    st.player.hp = Math.min(st.player.maxHp, st.player.hp + heal);
    return `🔔 Shell Bell! ${st.player.name} healed ${logHeal(heal)} HP!`;
  },

  // ── Leftovers ────────────────────────────────────────────────────────────
  checkLeftovers(st) {
    const poke = GameState.party[GameState.activePokemonIndex];
    if (!poke?.heldItem || poke.heldItem.id !== 'leftovers') return null;
    const tier = poke.heldItem.tier || 1;
    const heal = HELD_ITEM_TIERS.leftovers.values[tier - 1] || 5;
    st.player.hp = Math.min(st.player.maxHp, st.player.hp + heal);
    return `🍖 Leftovers! ${st.player.name} healed ${logHeal(heal)} HP!`;
  },

  // ── Type booster held items ──────────────────────────────────────────────
  getTypeboost(poke, cardType) {
    if (!poke?.heldItem) return 1;
    const BOOST_TYPES = {
      charcoal: 'fire', mystic_water: 'water',
      miracle_seed: 'grass', magnet: 'electric',
    };
    const boostType = BOOST_TYPES[poke.heldItem.id];
    if (!boostType || boostType !== cardType) return 1;
    const tier = poke.heldItem.tier || 1;
    const tierData = HELD_ITEM_TIERS[poke.heldItem.id];
    return tierData ? tierData.values[tier - 1] : 1.20;
  },

  // Upgrade a held item to the next tier (costs gold, max tier 3, all 9 items)
  upgradeHeldItem(pokeIdx) {
    const poke = GameState.party[pokeIdx];
    if (!poke?.heldItem) return null;
    if (!HELD_ITEM_TIERS[poke.heldItem.id]) return null;
    const tier = poke.heldItem.tier || 1;
    if (tier >= 3) return null;
    const cost = heldItemUpgradeCost(poke.heldItem.id, tier);
    if ((GameState.gold || 0) < cost) return { error: 'Not enough gold', cost };
    GameState.gold -= cost;
    poke.heldItem.tier = tier + 1;
    saveGame();
    return { success: true, newTier: poke.heldItem.tier, cost };
  },

  // Tier label helper used in UI
  tierLabel(tier) {
    return ['','★','★★','★★★'][tier || 1] || '★';
  },

  // ── Post-battle passive berry check ─────────────────────────────────────
  checkPassive() {
    if (!GameState.items) return;
    const berries = GameState.items.filter(i => i.id === 'oran_berry' && i.count > 0);
    if (!berries.length) return;
    // Only heal starter passively between battles
    const starter = GameState.party.find(p => p.isStarter);
    if (starter && starter.hp > 0 && starter.hp < starter.maxHp * 0.5 && berries[0].count > 0) {
      starter.hp = Math.min(starter.maxHp, starter.hp + 20);
      berries[0].count--;
      if (berries[0].count <= 0)
        GameState.items = GameState.items.filter(i => !(i.id === 'oran_berry' && i.count <= 0));
    }
    this.renderBagBar();
  },

  hasItem(id) {
    return (GameState.items || []).some(i => i.id === id && i.count > 0);
  },

  useItem(id) {
    const item = (GameState.items || []).find(i => i.id === id && i.count > 0);
    if (!item) return false;
    item.count--;
    if (item.count <= 0) GameState.items = GameState.items.filter(i => i !== item);
    this.renderBagBar();
    return true;
  },

  addItem(id) {
    if (!GameState.items) GameState.items = [];
    const item = GameState.items.find(i => i.id === id);
    const def  = SHOP_ITEMS.find(s => s.id === id);
    if (!def) return;
    if (item) { item.count++; }
    else      { GameState.items.push({ ...def, count: 1 }); }
    this.renderBagBar();
  },
};

// ─── CARD REWARD ENGINE ───────────────────────────────────────────────────────

// Card rewards live in js/card-rewards.js.

// ─── STONE EVOLUTION ─────────────────────────────────────────────────────────
// Called from the map bag bar when the player taps [Use] on a stone.
// Only ever reachable from the map screen — not battle, not shop.


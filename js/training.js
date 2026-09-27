const TrainingEngine = {
  selected:  [],
  mode:      'upgrade', // 'upgrade' | 'remove'
  _trainingPokeIdx: null, // which pokémon's deck we're upgrading

  start(node) {
    this.selected          = [];
    this.mode              = 'upgrade';
    this._upgradeJustDone  = false;
    this._trainingPokeIdx  = GameState.activePokemonIndex; // default

    showScreen('training');
    this._showPicker();
  },

  // ── Step 1: Pokémon picker ────────────────────────────────────────────────
  _showPicker() {
    document.getElementById('training-poke-picker').style.display = '';
    document.getElementById('training-card-panel').style.display  = 'none';

    const grid = document.getElementById('training-poke-grid');
    grid.innerHTML = '';

    GameState.party.forEach((p, i) => {
      if (p.hp <= 0) return; // skip fainted

      const deck  = p.deck || (i === GameState.activePokemonIndex ? GameState.deck : null);
      if (!deck)  return; // no deck to upgrade

      const isActive  = i === GameState.activePokemonIndex;
      const card = document.createElement('div');
      card.className  = 'training-poke-card' + (isActive ? ' training-poke-active' : '');

      const hpPct = Math.round((p.hp / p.maxHp) * 100);
      card.innerHTML  = `
        <img src="${p.spriteUrl}" alt="${p.name}"
             onerror="this.src='assets/sprites/${p.id}.png'" />
        <div class="training-poke-name">${p.name}</div>
        <div class="training-poke-level">Lv.${p.level}</div>
        <div class="training-poke-hp-bar-wrap">
          <div class="training-poke-hp-bar" style="width:${hpPct}%;background:${hpColor(p.hp,p.maxHp)}"></div>
        </div>
        <div class="training-poke-deck-count">${deck.length} cards</div>
        ${isActive ? '<div class="training-poke-badge">Active</div>' : ''}
      `;
      card.onclick = () => this._startWithPokemon(i);
      grid.appendChild(card);
    });
    requestAnimationFrame(() => fitAllText('.training-poke-name', grid));
  },

  // ── Step 2: Load chosen Pokémon's deck and show cards ─────────────────────
  _startWithPokemon(partyIdx) {
    this._trainingPokeIdx = partyIdx;

    // Swap active deck to selected Pokémon's deck
    const poke = GameState.party[partyIdx];
    GameState.deck = poke.deck || GameState.deck;

    document.getElementById('training-poke-picker').style.display = 'none';
    document.getElementById('training-card-panel').style.display  = '';

    // Show who we're training
    const whoRow = document.getElementById('training-who-row');
    whoRow.innerHTML = `
      <img src="${poke.spriteUrl}" alt="${poke.name}"
           onerror="this.src='assets/sprites/${poke.id}.png'"
           class="training-who-sprite" />
      <div class="training-who-name">Training: <span>${poke.name}</span></div>
    `;

    this.selected = [];
    this.mode     = 'upgrade';
    this._render();
  },

  setMode(m) {
    this.mode     = m;
    this.selected = [];
    this._render();
  },

  _render() {
    const grid      = document.getElementById('training-cards-grid');
    const itemPanel = document.getElementById('training-item-panel');
    const footer    = document.querySelector('.training-footer');
    grid.innerHTML  = '';

    document.getElementById('training-mode-upgrade').classList.toggle('active-tab', this.mode === 'upgrade');
    document.getElementById('training-mode-remove').classList.toggle('active-tab',  this.mode === 'remove');
    document.getElementById('training-mode-item').classList.toggle('active-tab',    this.mode === 'item-upgrade');

    if (this.mode === 'item-upgrade') {
      grid.style.display      = 'none';
      if (itemPanel) itemPanel.style.display = '';
      if (footer)    footer.style.display    = 'none';
      document.getElementById('training-subtitle').textContent = 'Upgrade a held item to increase its power boost';
      this._renderItemUpgrade();
      return;
    }

    grid.style.display = '';
    if (itemPanel) itemPanel.style.display = 'none';
    if (footer)    footer.style.display    = '';

    const subtitle = document.getElementById('training-subtitle');
    subtitle.textContent = this.mode === 'upgrade'
      ? 'Select 2 cards to improve damage, healing or block (+25%)'
      : 'Select 1 card to permanently remove from your deck';

    GameState.deck.forEach((card, i) => {
      const div          = document.createElement('div');
      const isSelected   = this.selected.includes(i);
      const justUpgraded = this._upgradeJustDone && isSelected;
      div.className = 'training-card'
        + (isSelected   ? ' selected'      : '')
        + (justUpgraded ? ' just-upgraded' : '');
      div.dataset.type = card.type;
      div.style.borderTopColor = `var(--col-type-${card.type}, var(--col-type-normal))`;
      div.innerHTML = `
        <div class="card-icon" style="font-size:1.6rem">${card.icon}</div>
        <div class="card-name" style="font-family:'Press Start 2P',monospace;font-size:.38rem;color:var(--col-text);margin:.2rem 0">${card.name}</div>
        <div class="card-power" style="font-size:.65rem;color:var(--col-yellow)">${card.power > 0 ? '⚔ '+card.power : '✦'}</div>
        <div class="card-effect" style="font-size:.45rem;color:var(--col-text-dim);margin-top:.1rem">${card.effect}</div>
        ${card.improved ? `<div class="card-improved">+${card.improved}${justUpgraded ? ' ✨ NEW' : ''}</div>` : ''}
        ${card.exhaust  ? `<div class="card-exhaust-tag">🔥 Once</div>` : ''}
      `;
      if (!this._upgradeJustDone) div.onclick = () => this.toggleSelect(i);
      grid.appendChild(div);
    });

    const maxSel = this.mode === 'upgrade' ? 2 : 1;
    document.getElementById('selected-count').textContent = `${this.selected.length} / ${maxSel} selected`;
    document.getElementById('btn-improve').textContent = this.mode === 'upgrade' ? '⚡ Upgrade Selected' : '🗑 Remove Card';
    document.getElementById('btn-improve').disabled    = this.selected.length !== maxSel;
  },

  _renderItemUpgrade() {
    const poke  = GameState.party[this._trainingPokeIdx];
    const panel = document.getElementById('training-item-panel');
    const heldItem = poke?.heldItem;
    const tierData = heldItem ? HELD_ITEM_TIERS[heldItem.id] : null;
    if (!heldItem || !tierData) {
      panel.innerHTML = `<div class="item-upgrade-empty">
        <div style="font-size:2rem">🏅</div>
        <div style="font-size:.44rem;color:var(--col-text-dim);margin-top:.5rem;text-align:center;line-height:1.6">
          ${poke?.name || 'This Pokémon'} has no held item.<br>
          Equip one from the party screen.
        </div></div>`;
      return;
    }
    const tier  = heldItem.tier || 1;
    const maxed = tier >= 3;
    panel.innerHTML = `
      <div class="item-upgrade-card">
        <div class="item-upgrade-icon">${heldItem.icon}</div>
        <div class="item-upgrade-name">${heldItem.name}</div>
        <div class="item-upgrade-tiers">
          ${[1,2,3].map(t=>`<span class="item-tier-pip${t<=tier?' filled':''}">${['★','★★','★★★'][t-1]}</span>`).join('')}
        </div>
        <div class="item-upgrade-stats">
          <div class="item-stat-row">Current: <span class="item-stat-val">${tierData.effects[tier-1]}</span></div>
          ${!maxed?`<div class="item-stat-row">Next: <span class="item-stat-val upgrade-preview">${tierData.effects[tier]}</span></div>`:''}
        </div>
        ${maxed
          ? `<div class="item-upgrade-maxed">✨ MAX TIER</div>`
          : `<div class="item-upgrade-shop-hint">⬆ Upgrade available in the <strong>Shop</strong></div>`}
      </div>`;
  },


  toggleSelect(idx) {
    const maxSel = this.mode === 'upgrade' ? 2 : 1;
    const i = this.selected.indexOf(idx);
    if (i >= 0) {
      this.selected.splice(i, 1);
    } else if (this.selected.length < maxSel) {
      this.selected.push(idx);
    }
    this._render();
  },

  improve() {
    // Guard: once an upgrade is applied the button becomes "Done ✓", but the
    // permanent click listener is still attached. Without this guard, pressing
    // "Done" would re-enter improve() and apply the upgrade a second time.
    if (this._upgradeJustDone) return;
    if (this.mode === 'upgrade') {
      if (this.selected.length !== 2) return;

      this.selected.forEach(idx => {
        const card = GameState.deck[idx];
        card.improved = (card.improved || 0) + 1;
        if (card.power > 0) card.power = Math.round(card.power * 1.25);
        card.effect=CombatRules.describe(card);
      });

      // Persist improvements back onto the Pokémon's own deck
      const poke = GameState.party[this._trainingPokeIdx];
      if (poke && poke.deck) {
        poke.deck = [...GameState.deck];
      }
      GameState.improvementMap = {};
      GameState.deck.forEach((c, i) => { if (c.improved) GameState.improvementMap[i] = c.improved; });
      saveGame();

      const evolutions = levelUpParty('training');

      this._upgradeJustDone = true;
      this._render();
      const btn = document.getElementById('btn-improve');
      btn.textContent = 'Done ✓';
      btn.disabled    = false;
      btn.classList.add('btn-upgrade-done');
      btn.onclick = () => {
        btn.onclick = null;
        btn.classList.remove('btn-upgrade-done');
        this._upgradeJustDone = false;
        MapEngine.completeNode(GameState.currentNodeIndex);
        if (evolutions.length > 0) {
          saveGame();
          runEvolutions(evolutions, () => MapEngine.show());
        } else {
          MapEngine.show();
        }
      };
    } else {
      if (this.selected.length !== 1) return;
      if (GameState.deck.length <= 3) {
        showModal('Cannot Remove', 'Your deck must have at least 3 cards!', () => {});
        return;
      }
      const removed = GameState.deck.splice(this.selected[0], 1)[0];
      const poke = GameState.party[this._trainingPokeIdx];
      if(poke)poke.deck=GameState.deck;
      GameState.deck=getActivePokemon().deck;
      saveGame();
      MapEngine.completeNode(GameState.currentNodeIndex);
      showModal('Card Removed!', `${removed.name} has been removed from ${poke?.name ?? 'your'}'s deck.`, () => MapEngine.show());
    }
  },

  skip() {
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },
};

// ─── HEAL ENGINE ─────────────────────────────────────────────────────────────

// ─── COOKING ENGINE ──────────────────────────────────────────────────────────

// ─── BROCK'S KITCHEN — real recipes, cookware, ordered cooking ───────────────
// Full pantry (emoji-based). Recipe ingredients + distractors to test knowledge.

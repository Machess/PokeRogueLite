async function stoneEvolve(stoneId) {
  const stoneDef = SHOP_ITEMS.find(i => i.id === stoneId);
  if (!stoneDef?.stoneTarget) return;
  const { id: targetId, type: targetType, name: targetName } = stoneDef.stoneTarget;

  showLoading();
  const afterData = await fetchPoke(targetId).catch(() => null);
  hideLoading();
  if (!afterData) {
    showModal('Connection Error', 'Could not load Pokémon data. Check your connection.', () => {});
    return;
  }

  const trainerName = GameState.trainerName || 'Trainer';
  const starter = GameState.party.find(p => p.isStarter);
  const prevName = starter?.name || 'Eevee';

  // Narrative from EVOLVE_NARRATIVES[133][stoneType]
  const narrativeFn = EVOLVE_NARRATIVES[133]?.[targetType];
  const narrative = narrativeFn
    ? narrativeFn(trainerName, targetName, prevName)
    : `${prevName} is evolving into ${targetName}!`;

  // Remove stone from bag before evolving
  ItemEngine.useItem(stoneId);

  // Lock evolution — set immediately so nothing can trigger it twice
  GameState.eeveeEvolution = targetType;

  // Update the starter party member
  if (starter) {
    starter.id            = targetId;
    starter.name          = targetName;
    starter.type          = targetType;
    starter.spriteUrl     = getSpriteUrl(afterData);
    starter.backSpriteUrl = null;
    starter.maxHp        += 20;
    starter.hp            = starter.maxHp;
    // Rebuild deck for the new type — fresh, no improvements carried over
    const newDeck = SpeciesCards.build({...starter,id:targetId,type:targetType});
    starter.deck     = newDeck;
    GameState.deck   = newDeck;
    GameState.improvementMap = {};
  }

  // Update GameState type references
  GameState.starterType    = targetType;
  GameState.evolutionStage = 1;  // stone counts as stage 2 (final for Eevee-line)

  saveGame();

  // Show the evolve screen — same cinematic as level evolutions
  showScreen('evolve');
  await EvolveEngine.run(133, targetId, narrative, null);
  // Continue pressed — return to map
  MapEngine.show();
}



const ShopEngine = {
  start(node) {
    this._render();
    showScreen('shop');
  },

  _render() {
    document.getElementById('shop-gold').textContent = `💰 ${GameState.gold || 0}g`;
    const grid = document.getElementById('shop-items-grid');
    grid.innerHTML = '';

    const isEevee   = GameState.starterId === 133;
    const hasEvolved = !!GameState.eeveeEvolution;

    // Split into sections
    const sections = [
      { label: '🎒 Consumables & Balls', items: SHOP_ITEMS.filter(i => i.category !== 'held' && i.category !== 'stone') },
      { label: '🏅 Held Items',          items: SHOP_ITEMS.filter(i => i.category === 'held') },
    ];

    // Stone section — only when Eevee is starter and not yet evolved
    if (isEevee && !hasEvolved) {
      sections.push({
        label: '💎 Evolution Stones',
        items: SHOP_ITEMS.filter(i => i.category === 'stone'),
        isStone: true,
      });
    }

    sections.forEach(section => {
      const header = document.createElement('div');
      header.className = 'shop-section-header';
      header.textContent = section.label;
      grid.appendChild(header);

      section.items.forEach(item => {
        const owned    = (GameState.items || []).find(i => i.id === item.id);
        const count    = owned ? owned.count : 0;
        const equipped = GameState.party.filter(p => p.heldItem?.id === item.id).length;
        const maxed    = count >= item.maxStack;
        const isUnique = item.unique && (count > 0 || (item.id === 'master_ball' && GameState.masterBallUsed));
        const scaledPrice = getScaledPrice(item.price);
        const cantAfford = (GameState.gold || 0) < scaledPrice;
        const disabled = maxed || isUnique || cantAfford;

        const div = document.createElement('div');
        div.className = 'shop-item' + (disabled ? ' shop-item-disabled' : '');

        // Stone items get a preview of the target Pokémon
        let stonePreviewHtml = '';
        if (section.isStone && item.stoneTarget) {
          stonePreviewHtml = `
            <div class="stone-preview">
              <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.stoneTarget.id}.png"
                   class="stone-preview-sprite" alt="${item.stoneTarget.name}"
                   onerror="this.style.display='none'" />
              <span class="stone-preview-name">→ ${item.stoneTarget.name}</span>
              <span class="stone-preview-type type-${item.stoneTarget.type}">${item.stoneTarget.type}</span>
            </div>`;
        }

        div.innerHTML = `
          <div class="shop-item-icon">${item.icon}</div>
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.description}</div>
          ${stonePreviewHtml}
          <div class="shop-item-footer">
            <span class="shop-item-price">💰${scaledPrice}g</span>
            ${count > 0 ? `<span class="shop-item-owned">bag ×${count}</span>` : ''}
            ${equipped > 0 ? `<span class="shop-item-owned">held ×${equipped}</span>` : ''}
            <button class="btn-pixel btn-small btn-primary shop-buy-btn"
                    ${disabled ? 'disabled' : ''}
                    data-id="${item.id}">
              ${isUnique ? 'Sold Out' : maxed ? 'Full' : cantAfford ? 'No gold' : 'Buy'}
            </button>
          </div>
        `;
        if (!disabled) {
          div.querySelector('.shop-buy-btn').onclick = () => this.buy(item.id);
        }
        grid.appendChild(div);
      });
    });
    // ── Upgrades section — all owned held items that can still be upgraded ────
    const upgradeable = GameState.party
      .filter(p => p.heldItem && HELD_ITEM_TIERS[p.heldItem.id] && (p.heldItem.tier || 1) < 3)
      .map(p => ({ poke: p, pokeIdx: GameState.party.indexOf(p), item: p.heldItem }));

    if (upgradeable.length > 0) {
      const upHeader = document.createElement('div');
      upHeader.className = 'shop-section-header';
      upHeader.textContent = '⬆ Upgrades';
      grid.appendChild(upHeader);

      upgradeable.forEach(({ poke, pokeIdx, item }) => {
        const tier      = item.tier || 1;
        const tierData  = HELD_ITEM_TIERS[item.id];
        const cost      = heldItemUpgradeCost(item.id, tier);
        const canAfford = (GameState.gold || 0) >= cost;
        const stars     = (t) => '★'.repeat(t) + '☆'.repeat(3 - t);

        const div = document.createElement('div');
        div.className = 'shop-item shop-upgrade-item' + (canAfford ? ' shop-upgrade-can-afford' : '');
        div.innerHTML = `
          <div class="shop-item-icon">${item.icon}</div>
          <div class="shop-upgrade-header">
            <span class="shop-item-name">${item.name}</span>
            <span class="shop-upgrade-holder">on ${poke.name}</span>
          </div>
          <div class="shop-upgrade-effect-row">
            <span class="shop-upgrade-now">${tierData.effects[tier - 1]}</span>
            <span class="shop-upgrade-arrow">→</span>
            <span class="shop-upgrade-next">${tierData.effects[tier]}</span>
          </div>
          <div class="shop-upgrade-stars">${stars(tier)} → ${stars(tier + 1)}</div>
          <div class="shop-item-footer">
            <span class="shop-item-price ${canAfford ? '' : 'shop-price-unafford'}">💰 ${cost}g</span>
            <button class="btn-pixel btn-primary shop-buy-btn" ${canAfford ? '' : 'disabled'}
                    data-pokeidx="${pokeIdx}">
              ${canAfford ? '⬆ Upgrade' : 'Need gold'}
            </button>
          </div>`;
        if (canAfford) {
          div.querySelector('.shop-buy-btn').onclick = () => {
            const result = ItemEngine.upgradeHeldItem(pokeIdx);
            if (result?.success) {
              showModal(`✨ ${item.icon} Upgraded!`,
                `${item.name} on ${poke.name} is now ${stars(result.newTier)}!\n\n${tierData.effects[result.newTier - 1]}`,
                () => this._render());
            }
          };
        }
        grid.appendChild(div);
      });
    }

    // ── Inline equip prompt helper ────────────────────────────────────────────
    // Called after buying a held item: offers to equip immediately
    this._lastBoughtHeld = null;
  },

  _showEquipPrompt(itemId) {
    const def  = SHOP_ITEMS.find(i => i.id === itemId);
    const open = GameState.party.filter(p => !p.heldItem && p.hp > 0);
    if (!open.length) return; // everyone already has something
    const names = open.map((p, i) => `${p.name}`).join(' / ');
    showModal(
      `${def?.icon || '🏅'} Equip ${def?.name || itemId}?`,
      `Who should hold this?\n\n${open.map(p => p.name).join('  ·  ')}\n\nOr equip later from the party screen.`,
      () => {
        // Build quick-pick buttons via re-render with equip mode
        this._equipPromptId = itemId;
        this._render();
      }
    );
  },

  buy(id) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;
    const scaledPrice = getScaledPrice(item.price);
    if ((GameState.gold || 0) < scaledPrice) return;

    // Stone items need a confirmation modal
    if (item.category === 'stone') {
      const target = item.stoneTarget;
      showModal(
        `${item.icon} Use ${item.name}?`,
        `Eevee will become ${target.name} (${target.type}-type). Your deck will change completely.\n\nYou can use the stone from the bag on the map screen. This cannot be undone.`,
        () => {
          GameState.gold -= scaledPrice;
          ItemEngine.addItem(id);
          SoundEngine.playFanfare();
          saveGame();
          this._render();
        }
      );
      return;
    }

    GameState.gold -= scaledPrice;

    if (item.category === 'held') {
      // Find first party member without a held item
      const freeSlot = GameState.party.find(p => !p.heldItem);
      if (freeSlot) {
        // Store in bag, then show equip prompt
        ItemEngine.addItem(id);
        saveGame();
        SoundEngine.playFanfare();
        this._render();
        // Inline equip prompt — show after render
        const open = GameState.party.filter(p => !p.heldItem && p.hp > 0);
        if (open.length > 0) {
          const pickHtml = open.map((p, i) =>
            `<button class="btn-pixel btn-primary" onclick="
              ItemEngine.equipItem(GameState.party[${GameState.party.indexOf(p)}],'${id}');
              document.getElementById('overlay').classList.add('hidden');
              ShopEngine._render();
            ">${p.name}</button>`).join(' ');
          document.getElementById('modal-title').textContent = `${item.icon} Who holds ${item.name}?`;
          document.getElementById('modal-body').innerHTML = `Pick a Pokémon to equip it now:<br><br>${pickHtml}<br><br><small>Or equip later from the party screen.</small>`;
          document.getElementById('modal-ok').textContent = 'Skip for now';
          document.getElementById('modal-ok').onclick = () => {
            document.getElementById('overlay').classList.add('hidden');
          };
          document.getElementById('overlay').classList.remove('hidden');
        }
      } else {
        ItemEngine.addItem(id);
        showModal('Stored in Bag', `${item.icon} ${item.name} added to bag.\nEquip from the party screen.`, () => {});
        SoundEngine.playFanfare();
        saveGame();
        this._render();
      }
    } else {
      ItemEngine.addItem(id);
      SoundEngine.playFanfare();
      saveGame();
      this._render();
    }

    if (id === 'master_ball') GameState.masterBallUsed = true;
    if (id === 'lure') GameState.lureActive = true;
  },

  finish() {
    this._answered = false;
    this._isActive = false;
    ActiveEngine.clear();
    MapEngine.completeNode(GameState.currentNodeIndex);
    MapEngine.show();
  },
};

// ─── POKÉDEX ENGINE ───────────────────────────────────────────────────────────

// ─── POKÉDEX CARD — standalone, reusable by CatchEngine and PokedexEngine ────
// data       = full PokeAPI Pokémon object
// isNewDex   = true shows "✨ New Entry!" banner (catch flow only)
// cachedSpecies = optional pre-fetched species object (avoids a second API call)


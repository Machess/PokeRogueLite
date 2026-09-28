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



const ShopArt = {
 icon(item) {
  const id=item.id, color=id==='master_ball'?'#a169d6':id==='super_potion'?'#f09656':id==='revive_potion'?'#80dba3':'#74b9e6';
  let art='';
  if(id.includes('ball'))art=`<path d="M8 4h16v4h4v16h-4v4H8v-4H4V8h4z" fill="#f0ead4"/><path d="M8 4h16v4h4v8H4V8h4z" fill="${id==='master_ball'?color:'#e9bb43'}"/><path d="M4 16h24" stroke="#172e3e" stroke-width="4"/><path d="M12 12h8v8h-8z" fill="#fff6d8"/>`;
  else if(id.includes('potion')||id==='repel')art=`<path d="M11 3h10v8l5 5v13H6V16l5-5z" fill="${color}"/><path d="M10 3h12v5H10z" fill="#e2e6d3"/><path d="M10 18h12v7H10z" fill="#f8ebcf"/><path d="M16 18v7m-4-3h8" stroke="#b04469" stroke-width="2"/>`;
  else if(id.includes('stone'))art=`<path d="M10 3h12l7 13-7 13H9L3 17z" fill="${id==='fire_stone'?'#e87a48':id==='water_stone'?'#56bfdf':'#eed25b'}"/><path d="M10 5l3 9-6 9m7-9h12" fill="none" stroke="#fff2b4" stroke-width="3"/>`;
  else {const shapes={
   oran_berry:'<path d="M6 11h18v5h4v10h-5v3H8v-3H4V16h2z" fill="#739de1"/><path d="M15 12V5h10l-6 7z" fill="#9ed78e"/>',
   lucky_egg:'<path d="M12 3h8l6 9 3 12-6 6H8l-5-6 3-12z" fill="#fff2cd"/><path d="M8 16h5v5H8zm12 7h5v4h-5z" fill="#e6bf91"/>',
   amulet_coin:'<path d="M8 4h16l5 6v14l-5 5H8l-5-5V10z" fill="#eac35a"/><path d="M13 9h8v7h-8v8m0-8h9" stroke="#946126" stroke-width="3" fill="none"/>',
   magnet:'<path d="M5 4h8v16h6V4h8v19l-6 6H11l-6-6z" fill="#cf6470"/><path d="M5 4h8v8H5zm14 0h8v8h-8z" fill="#b7dde3"/>',
   focus_sash:'<path d="M4 5h24v9H16l10 14h-9L6 14z" fill="#e77a94"/>',
   charcoal:'<path d="M4 22L20 4l9 8-16 18z" fill="#6a5661"/><path d="M8 21L22 7m-8 20l11-14" stroke="#a18b8b" stroke-width="2"/>',
   shell_bell:'<path d="M12 3h8v5l5 5v10l4 3H3l4-3V13l5-5z" fill="#dfc991"/><path d="M13 27h6v4h-6z" fill="#e5a949"/>',
   mystic_water:'<path d="M16 2L4 19v7l6 4h12l6-4v-7z" fill="#62c8e1"/><path d="M12 15l-4 7v4" stroke="#dbfcff" stroke-width="3" fill="none"/>',
   miracle_seed:'<path d="M15 29V15M15 19L5 8h8l4 8 4-11h7l-7 14" stroke="#91cb72" stroke-width="5" fill="none"/>',
   leftovers:'<path d="M5 10h22v17H5z" fill="#c48d65"/><path d="M4 6h24v8H4z" fill="#efcaa0"/><path d="M7 17h18" stroke="#9bd585" stroke-width="4"/>',
   lure:'<path d="M16 2v20q0 8 9 4v-5" fill="none" stroke="#c9e6e3" stroke-width="3"/><path d="M10 7h12v12H10z" fill="#ed8977"/>'
  };art=shapes[id]||shapes.amulet_coin;}
  return `<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges">${art}</svg>`;
 }
};

const ShopEngine = {
  start(node) {
    this._filter = 'all';
    this._render();
    showScreen('shop');
  },

  _render() {
    document.getElementById('shop-gold').textContent = `${GameState.gold || 0} gold`;
    const grid = document.getElementById('shop-items-grid');
    grid.innerHTML = '';
    let tabs=document.getElementById('shop-tabs');
    if(!tabs){tabs=document.createElement('nav');tabs.id='shop-tabs';tabs.setAttribute('aria-label','Shop categories');grid.before(tabs);}
    tabs.replaceChildren();
    for(const [id,label] of [['all','All items'],['supplies','Supplies'],['held','Held items'],['stone','Evolution']]){
      if(id==='stone'&&(GameState.starterId!==133||GameState.eeveeEvolution))continue;
      const button=document.createElement('button');button.textContent=label;button.type='button';button.setAttribute('aria-pressed',String((this._filter||'all')===id));
      button.onclick=()=>{this._filter=id;this._render();grid.scrollTop=0;};tabs.appendChild(button);
    }

    const isEevee   = GameState.starterId === 133;
    const hasEvolved = !!GameState.eeveeEvolution;

    // Split into sections
    const sections = [
      { category:'supplies', label: 'Consumables & Balls', items: SHOP_ITEMS.filter(i => i.category !== 'held' && i.category !== 'stone') },
      { category:'held', label: 'Held Items',          items: SHOP_ITEMS.filter(i => i.category === 'held') },
    ];

    // Stone section — only when Eevee is starter and not yet evolved
    if (isEevee && !hasEvolved) {
      sections.push({
        category:'stone', label: 'Evolution Stones',
        items: SHOP_ITEMS.filter(i => i.category === 'stone'),
        isStone: true,
      });
    }

    sections.filter(s=>!this._filter||this._filter==='all'||s.category===this._filter).forEach(section => {
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
              <img src="assets/sprites/${item.stoneTarget.id}.png"
                   class="stone-preview-sprite" alt="${item.stoneTarget.name}"
                   onerror="this.style.display='none'" />
              <span class="stone-preview-name">→ ${item.stoneTarget.name}</span>
              <span class="stone-preview-type type-${item.stoneTarget.type}">${item.stoneTarget.type}</span>
            </div>`;
        }

        div.innerHTML = `
          <div class="shop-item-icon">${ShopArt.icon(item)}</div>
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.description}</div>
          ${stonePreviewHtml}
          <div class="shop-item-footer">
            <span class="shop-item-price">${scaledPrice}g</span>
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

    if (upgradeable.length > 0 && (!this._filter || ['all','held'].includes(this._filter))) {
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
          <div class="shop-item-icon">${ShopArt.icon(item)}</div>
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
            <span class="shop-item-price ${canAfford ? '' : 'shop-price-unafford'}">${cost}g</span>
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


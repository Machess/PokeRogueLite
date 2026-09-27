const ARROW_DIRS = {
  1: ['straight'],
  2: ['left', 'right'],
  3: ['left', 'straight', 'right'],
};

// icon: path to asset (null = emoji fallback), label shown under arrow
const ARROW_LABELS = {
  battle:   { icon: 'assets/battle_icon.png',  label: 'Battle'  },
  heal:     { icon: 'assets/heal_icon.png',    label: 'Heal'    },
  catch:    { icon: 'assets/catch_icon.png',   label: 'Catch'   },
  training: { icon: null, emoji: '⚡',          label: 'Train'   },
  shop:     { icon: 'assets/shop_icon.png',    label: 'Shop'    },
  boss:     { icon: 'assets/boss_icon.png',    label: 'GYM!'   },
  mystery:  { icon: null, emoji: '❓',          label: '???'    },
  cooking:        { icon: null, emoji: '🍳', label: "Brock's Kitchen"   },
  fishing:        { icon: null, emoji: '🎣', label: "Misty's Fishing"   },
  jigglypuff_node:{ icon: null, emoji: '🎵', label: 'Jigglypuff Song'   },
  surge_node:     { icon: null, emoji: '⚡', label: 'Surge Quiz'         },
  erika_node:     { icon: null, emoji: '🧪', label: 'Potion Lab'         },
  ninja_node:     { icon: null, emoji: '🥷', label: 'Ninja Memory'       },
  sabrina_node:   { icon: null, emoji: '🔮', label: 'Sabrina Jigsaw'     },
  blaine_node:    { icon: null, emoji: '🔥', label: 'Battle Lab'         },
  challenge:      { icon: null, emoji: '🎮', label: 'Your Choice'        },
  giovanni_node:  { icon: null, emoji: '💰', label: "Rocket's Ledger"    },
};

// Builds an inline SVG directional chevron for nav arrows.
// left  → arrow pointing left  (←)
// straight → arrow pointing up  (↑)
// right → arrow pointing right (→)
function _navChevronSvg(dir) {
  const W = 44, H = 36;
  const stroke = 'rgba(255,255,255,0.88)';
  const sw = 3.5; // stroke-width
  const cap = 'round';
  let path = '';

  if (dir === 'straight') {
    // Vertical line with upward arrowhead — clearly means "go forward / up"
    const cx = W / 2;
    path = `
      <line x1="${cx}" y1="${H - 4}" x2="${cx}" y2="6"
            stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${cap}"/>
      <polyline points="${cx - 10},18 ${cx},6 ${cx + 10},18"
                stroke="${stroke}" stroke-width="${sw}"
                stroke-linecap="${cap}" stroke-linejoin="round" fill="none"/>
    `;
  } else if (dir === 'left') {
    // Horizontal line with leftward arrowhead — clearly means "go left"
    const cy = H / 2;
    path = `
      <line x1="${W - 5}" y1="${cy}" x2="8" y2="${cy}"
            stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${cap}"/>
      <polyline points="${8 + 12},${cy - 9} ${8},${cy} ${8 + 12},${cy + 9}"
                stroke="${stroke}" stroke-width="${sw}"
                stroke-linecap="${cap}" stroke-linejoin="round" fill="none"/>
    `;
  } else {
    // dir === 'right'
    const cy = H / 2;
    path = `
      <line x1="5" y1="${cy}" x2="${W - 8}" y2="${cy}"
            stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${cap}"/>
      <polyline points="${W - 8 - 12},${cy - 9} ${W - 8},${cy} ${W - 8 - 12},${cy + 9}"
                stroke="${stroke}" stroke-width="${sw}"
                stroke-linecap="${cap}" stroke-linejoin="round" fill="none"/>
    `;
  }

  return `<svg class="nav-chevron-svg" viewBox="0 0 ${W} ${H}"
               width="${W}" height="${H}"
               xmlns="http://www.w3.org/2000/svg">${path}</svg>`;
}

const MapEngine = {
  _lastBi: -1,

  show() {
    // Check if a Rocket event should fire before returning to the nav screen.
    // Only trigger if we just completed a node (completedNodes has grown).
    const justCompleted = GameState._lastRocketCheckAt !== GameState.completedNodes.length;
    if (justCompleted) {
      GameState._lastRocketCheckAt = GameState.completedNodes.length;
      const lastNodeIdx  = GameState.completedNodes[GameState.completedNodes.length - 1];
      const lastNode     = GameState.map?.find(n => n.idx === lastNodeIdx);
      const lastNodeType = lastNode?.type ?? 'battle';
      if (MeowthChallenge.shouldTrigger(lastNodeType)) {
        MeowthChallenge.show(() => this._showNav());
        return;
      }
    }
    this._showNav();
  },

  _showNav() {
    if(getActivePokemon()?.deck)GameState.deck=getActivePokemon().deck;
    showScreen('map');
    this.renderParty();
    this.renderNav();
    ItemEngine.renderBagBar();
    saveGame();
  },

  // ── Set gym background image ─────────────────────────────────────────────
  // ── Vertical gym tracker ─────────────────────────────────────────────────
  _renderGymTracker(bi, available) {
    const labelEl = document.getElementById('gym-tracker-label');
    const pipsEl  = document.getElementById('gym-tracker-pips');
    if (!pipsEl) return;

    // ── League tracker ────────────────────────────────────────────────────────
    if (GameState.isLeagueRun) {
      const LEAGUE_STEPS = [
        { icon:'❄️', name:'Lorelei' },
        { icon:'🥊', name:'Bruno'   },
        { icon:'👻', name:'Agatha'  },
        { icon:'🐉', name:'Lance'   },
        { icon:'🏆', name:'Blue'    },
      ];
      // Count completed boss nodes on the League map
      const completedBosses = (GameState.map || []).filter(n =>
        n.type === 'boss' && n.done
      ).length;

      if (labelEl) labelEl.textContent = '⚔️';
      pipsEl.innerHTML = '';
      LEAGUE_STEPS.forEach((step, i) => {
        const pip = document.createElement('div');
        pip.className = 'gym-pip league-pip'
          + (i < completedBosses  ? ' league-pip-done'    : '')
          + (i === completedBosses ? ' league-pip-current' : '');
        pip.textContent = step.icon;
        pip.title       = step.name;
        pipsEl.appendChild(pip);
      });
      return;
    }

    // ── Normal gym tracker ────────────────────────────────────────────────────
    const TOTAL_STEPS = 10;
    const done        = Math.max(0, GameState.highWaterRow ?? 0);
    const isBoss      = available?.[0]?.type === 'boss';

    if (labelEl) {
      labelEl.textContent = isBoss ? '⚔️' : `${done}/${TOTAL_STEPS}`;
    }

    pipsEl.innerHTML = '';
    for (let i = 0; i < TOTAL_STEPS; i++) {
      const pip = document.createElement('div');
      if (i < done) {
        pip.className = 'gym-pip gym-pip-done';
      } else if (i === done && !isBoss) {
        pip.className = 'gym-pip gym-pip-current';
      } else {
        pip.className = 'gym-pip gym-pip-empty';
      }
      pipsEl.appendChild(pip);
    }
  },

  // ── Apply map background ─────────────────────────────────────────────────
  _applyBackground(bi) {
    const bgEl = document.getElementById('nav-bg');
    if (!bgEl) return;

    // League run always uses the Indigo Plateau interior background
    if (GameState.isLeagueRun) {
      bgEl.style.background = 'linear-gradient(180deg,#0a0a1a 0%,#1a1a3a 50%,#050510 100%)';
      const img = new Image();
      img.onload  = () => { bgEl.style.background = `url('assets/backgrounds/bg_league.jpg') center center / cover no-repeat`; };
      img.onerror = () => {};
      img.src = 'assets/backgrounds/bg_league.jpg';
      return;
    }

    const file     = getGymData()[Math.min(bi, getGymData().length - 1)]?.bgImage;
    const fallback = getGymData()[Math.min(bi, getGymData().length - 1)]?.bgFallback || '#111';
    const url      = `assets/backgrounds/${file}`;

    // Always set fallback gradient first so something shows immediately
    bgEl.style.background = fallback;

    // Preload image then swap in
    const img = new Image();
    img.onload  = () => {
      bgEl.style.background = `url('${url}') center center / cover no-repeat`;
    };
    img.onerror = () => { /* keep fallback gradient */ };
    img.src = url;

    // Fade transition when gym changes
    if (bi !== this._lastBi) {
      bgEl.classList.remove('nav-bg-fade');
      void bgEl.offsetWidth;
      bgEl.classList.add('nav-bg-fade');
      this._lastBi = bi;
    }
  },

  // ── Render party bar ─────────────────────────────────────────────────────
  renderParty() {
    const el = document.getElementById('map-party');
    if (!el) return;
    el.innerHTML = '';
    GameState.party.forEach((p, i) => {
      const d = document.createElement('div');
      const isActive = i === GameState.activePokemonIndex;
      d.className = 'map-poke-thumb' + (isActive ? ' map-poke-thumb-active' : '');
      d.innerHTML = `<img src="${p.spriteUrl}" alt="${p.name}"
                         onerror="this.src='assets/sprites/${p.id}.png'" />
                     <div class="thumb-hp" style="width:${Math.round(p.hp/p.maxHp*100)}%;
                       background:${hpColor(p.hp, p.maxHp)}"></div>
                     ${p.hp <= 0 ? '<div class="thumb-fainted">✕</div>' : ''}
                     ${p.heldItem ? `<div class="thumb-held-badge" title="${p.heldItem.name}">${p.heldItem.icon}</div>` : ''}`;
      d.title = `${p.name} — Click to manage party`;
      d.style.cursor = 'pointer';
      d.addEventListener('click', () => PartyOverview.open());
      el.appendChild(d);
    });
    const bi   = GameState.map?._bossIndex ?? GameState.bossesDefeated ?? 0;
    const tier      = GameState.difficultyTier || 2;
    const tierEmoji = tier === 1 ? '🌱' : tier === 3 ? '🔥' : '⚡';
    const tierLabel = tier === 1 ? 'Starter' : tier === 3 ? 'Advanced' : 'Explorer';
    document.getElementById('map-meta').textContent =
      `💰 ${GameState.gold || 0}g  |  ${tierEmoji} ${tierLabel}  |  Party: ${GameState.party.length}/6`;

    // ── Catch-all evolution repair ───────────────────────────────────────────
    // If the starter's level has passed a threshold but evolutionStage is behind
    // (e.g. from a corrupted/old save or a Lucky Egg edge case), fire the
    // evolution now. Guard flag prevents re-entry if renderParty is called
    // again before the evolve screen resolves.
    if (this._evoCheckPending) return;
    const sid       = Number(GameState.starterId);
    const starter   = STARTERS.find(s => s.id === sid);
    const thresholds = EVOLUTION_LEVELS[sid];
    const poke      = (GameState.party || []).find(p => p.isStarter && p.hp > 0);
    if (!starter || !thresholds || !poke) return;

    const stage = GameState.evolutionStage ?? 0;

    let missedEvo = null;
    if (stage === 0 && thresholds.stage2 && poke.level >= thresholds.stage2) {
      // Starter should have evolved to stage 2 already
      missedEvo = { partyIdx: GameState.party.indexOf(poke), stage: 2,
        beforeId: starter.evolutions[0], afterId: starter.evolutions[1] };
      GameState.evolutionStage = 1;
    } else if (stage === 1 && thresholds.stage3 && poke.level >= thresholds.stage3) {
      // Starter should have evolved to stage 3 already
      missedEvo = { partyIdx: GameState.party.indexOf(poke), stage: 3,
        beforeId: starter.evolutions[1], afterId: starter.evolutions[2] };
      GameState.evolutionStage = 2;
    }

    if (missedEvo) {
      this._evoCheckPending = true;
      saveGame();
      runEvolutions([missedEvo], () => {
        this._evoCheckPending = false;
        this.show(); // re-render map after evolution completes
      });
    }
  },

  // ── Main navigation renderer ─────────────────────────────────────────────
  renderNav() {
    const nodes = GameState.map;
    if (!nodes) return;

    const bi    = nodes._bossIndex ?? GameState.bossesDefeated ?? 0;
    const boss  = getGymData()[Math.min(bi, getGymData().length - 1)];
    const theme = getMapThemes()[Math.min(bi, getMapThemes().length - 1)];

    // Apply background
    this._applyBackground(bi);

    // ── Location badge ─────────────────────────────────────────────────────
    if (GameState.isLeagueRun) {
      document.getElementById('nav-location-name').textContent = 'Indigo Plateau';
      // Find next boss node that isn't done yet
      const nextBossNode = (GameState.map || []).find(n => n.type === 'boss' && !n.done);
      const nextGym      = nextBossNode ? GYM_DATA[nextBossNode.gymIdx] : null;
      document.getElementById('nav-location-sub').textContent =
        nextGym ? `${nextGym.name} is waiting · ${nextGym.title}` : 'The Championship awaits';
      const lp = document.getElementById('nav-badge-pips');
      if (lp) lp.style.display = 'none';
    } else {
      document.getElementById('nav-location-name').textContent = theme.name;
      document.getElementById('nav-location-sub').textContent =
        `Heading toward ${boss?.name ?? 'the Boss'}`;
      // D4 — badge pip row: filled circle per badge earned
      let pipRow = document.getElementById('nav-badge-pips');
      if (!pipRow) {
        pipRow = document.createElement('div');
        pipRow.id = 'nav-badge-pips';
        pipRow.className = 'nav-badge-pips';
        document.getElementById('nav-location').appendChild(pipRow);
      }
      pipRow.style.display = '';
      const earned = GameState.bossesDefeated || 0;
      pipRow.innerHTML = Array.from({ length: 8 }, (_, i) =>
        `<span class="badge-pip${i < earned ? ' earned' : ''}">${i < earned ? '●' : '○'}</span>`
      ).join('');
    }

    // ── Officer Jenny's patrol shield indicator ────────────────────────────
    // Shows when the "no Team Rocket in Mystery nodes" buff is active, with the
    // number of shielded nodes remaining.
    {
      const shield = GameState.rocketShieldNodes || 0;
      let shieldEl = document.getElementById('nav-rocket-shield');
      if (shield > 0) {
        if (!shieldEl) {
          shieldEl = document.createElement('div');
          shieldEl.id = 'nav-rocket-shield';
          shieldEl.className = 'nav-rocket-shield';
          document.getElementById('nav-location').appendChild(shieldEl);
        }
        shieldEl.style.display = '';
        shieldEl.title = `Officer Jenny's patrol: no Team Rocket for ${shield} more node${shield === 1 ? '' : 's'}`;
        shieldEl.innerHTML = `<span class="nav-shield-icon">🛡️</span><span class="nav-shield-count">No Rocket ×${shield}</span>`;
      } else if (shieldEl) {
        shieldEl.style.display = 'none';
      }
    }

    // ── Find available choices ──────────────────────────────────────────────
    // With the decision-graph structure, multiple rows may have unlocked nodes
    // (all children of the previously completed node are unlocked at once).
    // We only want to show the CURRENT step — the minimum row among unlocked nodes.
    const allUnlocked = nodes.filter(n =>
      typeof n.idx === 'number' &&
      n.unlocked &&
      !n.done &&
      !n.bypassed
    );
    const minRow  = allUnlocked.length > 0
      ? Math.min(...allUnlocked.map(n => n.row))
      : 0;
    const available = allUnlocked
      .filter(n => n.row === minRow)
      .sort((a, b) => {
        // Sort by lane: left → mid → right for consistent arrow layout
        const order = { left: 0, mid: 1, right: 2 };
        return (order[a.lane] ?? 1) - (order[b.lane] ?? 1);
      });

    // ── Gym tracker (vertical left bar) ───────────────────────────────────
    this._renderGymTracker(bi, available);

    // ── Build choice arrows ────────────────────────────────────────────────
    const choicesEl = document.getElementById('nav-choices');
    choicesEl.innerHTML = '';

    if (available.length === 0) {
      // Shouldn't happen — safety fallback
      choicesEl.innerHTML = '<div class="nav-empty">No paths available…</div>';
      return;
    }

    const count = Math.min(available.length, 3);
    const dirs  = ARROW_DIRS[count] || ARROW_DIRS[3];

    available.slice(0, 3).forEach((node, i) => {
      const dir      = dirs[i];
      const revealed = !!node.revealed || node.type === 'boss';
      const isCatch  = node.type === 'catch' || node.type === 'mystery';
      const isBoss   = node.type === 'boss';

      // Lure: glow all catch nodes gold; Repel: glow next catch node purple
      const lureGlow  = isCatch && GameState.lureActive;
      const repelCount = (GameState.items || []).find(i => i.id === 'repel' && i.count > 0)?.count || 0;
      // Repel glows the first repelCount catch nodes encountered
      const catchNodesSoFar = available.slice(0, i).filter(n => n.type === 'catch' || n.type === 'mystery').length;
      const repelGlow = isCatch && repelCount > 0 && catchNodesSoFar < repelCount;

      // Override label for lure/repel
      let info = revealed
        ? (ARROW_LABELS[node.type] || ARROW_LABELS.mystery)
        : ARROW_LABELS.mystery;
      if (lureGlow)  info = { ...info, label: '🎣 Rare!' };
      if (repelGlow) info = { ...info, label: '🚫 Repel' };

      // Build icon HTML
      const iconHtml = info.icon
        ? `<img src="${info.icon}" alt="${info.label}" class="nav-arrow-img"
               onerror="this.style.display='none';this.nextElementSibling.style.display=''"
           /><span class="nav-arrow-emoji" style="display:none">${info.emoji || '?'}</span>`
        : `<span class="nav-arrow-emoji">${info.emoji || '?'}</span>`;

      const chevronSvg = _navChevronSvg(dir);

      const btn = document.createElement('button');
      const rarityClass = (node.type === 'catch' || node.type === 'legendary') && node.catchRarity
        ? ` nav-arrow-catch-${node.catchRarity}` : '';
      btn.className = `nav-arrow nav-arrow-${dir}`
        + (isBoss   ? ' nav-arrow-boss'  : '')
        + (lureGlow ? ' nav-arrow-lure'  : '')
        + (repelGlow? ' nav-arrow-repel' : '')
        + rarityClass;
      btn.style.setProperty('--arrow-accent', theme.accent);
      btn.innerHTML = `
        <div class="nav-arrow-icon">${iconHtml}</div>
        ${chevronSvg}
        <div class="nav-arrow-label">${info.label}</div>
      `;
      const ahead=document.createElement('div'); ahead.className='nav-arrow-preview';
      ahead.textContent='Then: '+Travel.preview(node); btn.appendChild(ahead);
      btn.title = `Go ${dir} — ${info.label}`;
      btn.addEventListener('click', () => this.visitNode(node));
      choicesEl.appendChild(btn);
    });
  },

  // ── Visit a node ─────────────────────────────────────────────────────────
  visitNode(node) { return Travel.go(node); },

  async _enterNode(node) {
    // Bypass sibling nodes at same row
    GameState.map.forEach(n => {
      if (typeof n.idx !== 'number') return;
      if (n.idx === node.idx) return;
      if (n.row === node.row && !n.done) {
        n.bypassed = true;
        n.unlocked = false;
      }
    });
    if (node.row > (GameState.highWaterRow ?? -1)) {
      GameState.highWaterRow = node.row;
    }
    GameState.currentNodeIndex = node.idx;
    switch (node.type) {
      case 'battle':   await BattleEngine.start(node); break;
      case 'heal':     await HealEngine.start(node); break;
      case 'catch':    await CatchEngine.start(node, node.catchRarity); break;
      case 'training': await TrainingEngine.start(node); break;
      case 'shop':     await ShopEngine.start(node); break;
      case 'boss':
        if (GameState.isLeagueRun && node.gymIdx !== undefined) {
          await BossEngine.startLeagueBoss(node);
        } else {
          await BossEngine.start(node);
        }
        break;
      case 'mystery':  await MysteryEngine.start(node); break;
      case 'jenny_node':      await JennyEngine.start(node); break;
      case 'cooking':         await CookingEngine.start(node); break;
      case 'fishing':         await FishingEngine.start(node); break;
      case 'jigglypuff_node': await JigglypuffEngine.start(node); break;
      case 'surge_node':      await SurgeEngine.start(node); break;
      case 'erika_node':      await ErikaEngine.start(node); break;
      case 'ninja_node':      await NinjaMemoryEngine.start(node); break;
      case 'sabrina_node':    await SabrinaEngine.start(node); break;
      case 'blaine_node':     await BlaineEngine.start(node); break;
      case 'giovanni_node':   await GiovanniEngine.start(node); break;
      case 'challenge':       await ChallengeSelectEngine.start(node); break;
      case 'wobbuffet_node':  await WobbuffetEngine.start(node); break;
      // Johto gym mini-games
      case 'falkner_node':    await FalknerEngine.start(node); break;
      case 'bugsy_node':      await BugsyEngine.start(node); break;
      case 'whitney_node':    await WhitneyEngine.start(node); break;
      case 'morty_node':      await MortyEngine.start(node); break;
      case 'jasmine_node':    await JasmineEngine.start(node); break;
      case 'pryce_node':      await PryceEngine.start(node); break;
      case 'clair_node':      await ClairEngine.start(node); break;
      case 'chuck_node':      await ChuckEngine.start(node); break;
      case 'togepi_node':     await TogepiEngine.start(node); break;
    }
  },

  // ── Complete a node, unlock its children ─────────────────────────────────
  completeNode(nodeIdx) {
    SaveManager.complete();
    if (!GameState.completedNodes.includes(nodeIdx)) {
      GameState.completedNodes.push(nodeIdx);
      // Cumulative node counter — never resets between maps
      if (!GameState.stats) GameState.stats = {};
      GameState.stats.totalNodesCompleted = (GameState.stats.totalNodesCompleted || 0) + 1;
    }
    const node = GameState.map.find(n => n.idx === nodeIdx);
    if (node) {
      node.done = true;
      node.links.forEach(li => {
        const child = GameState.map[li];
        if (child) { child.unlocked = true; child.revealed = true; }
      });
      if ((node.row ?? 0) > (GameState.highWaterRow ?? -1)) {
        GameState.highWaterRow = node.row;
      }
    }
    saveGame();
  },
};

function hpColor(hp, max) {
  const ratio = hp / max;
  if (ratio > .5) return '#44C767';
  if (ratio > .25) return '#FFB347';
  return '#E3350D';
}

// ─── BATTLE ENGINE ───────────────────────────────────────────────────────────

// ── Wild battle trainer portrait — keyed by opponent type ────────────────────
// bug has two variants — chosen randomly for variety.

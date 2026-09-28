const Game = {

  async startNew(isNewProfile = false) {
    await AssetPreloader.ensure();
    // If no active profile yet (new profile creation), just go to register.
    // The profile is created inside confirmStarter after the name is known.
    if (isNewProfile || !getActiveProfile()) {
      // Clear any stale state
      GameState = {
        starterId: null, starterType: null, evolutionStage: 0,
        bossesDefeated: 0, party: [], activePokemonIndex: 0,
        deck: [], improvementMap: {}, map: null,
        currentNodeIndex: null, completedNodes: [], highWaterRow: -1,
        unlockedPikachu: false,
        stats: { battlesWon: 0, pokemonCaught: 0, totalBattlesWon: 0,
                 totalBossesBeaten: 0, totalNodesCompleted: 0 },
        gold: 0, items: [], masterBallUsed: false,
        trainerName: '', trainerAge: 10, difficultyTier: 2,
        nodesSinceRocket: 0, _lastRocketCheckAt: 0, rocketShieldNodes: 0,
        _isNewProfile: true,  // flag so confirmStarter creates the profile
      };
      showScreen('register');
      RegistrationEngine.init();
      return;
    }

    // Active profile exists — confirm overwrite if there's an in-progress run
    const profiles = loadProfiles();
    const meta = profiles.find(p => p.key === getActiveProfile());
    if (meta?.hasActiveSave) {
      showModal(
        '▶ New Run?',
        `Start a fresh run as ${meta.name}?\nYour current run (${meta.bossesDefeated}/8 badges) will be lost.`,
        () => this._doStartNew()
      );
    } else {
      this._doStartNew();
    }
  },

  _doStartNew() {
    // ── Carry forward trainer identity ───────────────────────────────────────
    // Priority: existing save → profile meta → GameState (pre-deletion) → defaults
    // This preserves age/tier across GameOver.restart() which nulls GameState.
    const existingSave = loadGame();
    const profiles     = loadProfiles();
    const meta         = profiles.find(p => p.key === getActiveProfile());

    const carriedName = meta?.trainerName
                     || meta?.name
                     || existingSave?.trainerName
                     || '';
    // Meta takes priority for age/tier — user may have changed it in the profile picker
    // after the last save, so the save's value could be stale.
    const carriedAge  = meta?.trainerAge
                     ?? existingSave?.trainerAge
                     ?? 10;
    const carriedTier = meta?.difficultyTier
                     ?? existingSave?.difficultyTier
                     ?? 2;

    deleteSave();
    const unlocks = loadUnlocks();

    GameState = {
      starterId: null, starterType: null, evolutionStage: 0,
      bossesDefeated: 0, party: [], activePokemonIndex: 0,
      deck: [], improvementMap: {}, map: null,
      currentNodeIndex: null, completedNodes: [], highWaterRow: -1,
      unlockedPikachu: unlocks.pikachu,
      unlockedEevee:   unlocks.eevee   || false,
      unlockedMew:     unlocks.mew     || false,
      unlockedMewtwo:  unlocks.mewtwo  || false,
      stats: { battlesWon: 0, pokemonCaught: 0, totalBattlesWon: 0,
               totalBossesBeaten: 0, totalNodesCompleted: 0 },
      gold: 0, items: [], masterBallUsed: false,
      // Carry forward trainer identity — no re-registration needed
      trainerName:    carriedName,
      trainerAge:     carriedAge,
      difficultyTier: carriedTier,
      nodesSinceRocket: 0, _lastRocketCheckAt: 0, rocketShieldNodes: 0,
    };

    // Skip register → intro → tutorial for returning players.
    // Go straight to starter select.
    this.showStarterSelect();
  },

  async continueGame() {
    const saved = loadGame();
    if (!saved || !saved.party) {
      // Self-heal: the meta flag was stale (save lost or never written). Clear it
      // so the button correctly shows "No Save" instead of lying.
      const p = getActiveProfile();
      if (p) {
        const profiles = loadProfiles();
        const meta = profiles.find(pr => pr.key === p);
        if (meta) { meta.hasActiveSave = false; saveProfiles(profiles); }
      }
      ProfileEngine._updateStartScreen();
      showModal('No Save Found', 'That run could not be loaded.\nStart a New Game to play!');
      return;
    }
    await AssetPreloader.ensure((saved.party || []).flatMap(p => (p.deck || []).map(c => c.source).filter(Boolean)));
    GameState = saved;
    if(SaveManager.resume()) return;

    // Always override age/tier from profile meta — user may have changed
    // them in the profile picker since this save was last written.
    const _contProfiles = loadProfiles();
    const _contMeta     = _contProfiles.find(p => p.key === getActiveProfile());
    if (_contMeta) {
      if (_contMeta.trainerAge     != null) GameState.trainerAge     = _contMeta.trainerAge;
      if (_contMeta.difficultyTier != null) GameState.difficultyTier = _contMeta.difficultyTier;
    }
    // Sanitise fields that can get stuck across save/load cycles
    GameState.starterId         = Number(GameState.starterId);
    (GameState.party || []).forEach(p => {
      if (p.heldItem === undefined) p.heldItem = null;
      if (!p.moves)                 p.moves    = [];
      if (!p.statusEffects)         p.statusEffects = [];
      if (!p.name)                  p.name     = capitalize(String(p.id));
    });
    // Backfill new counter fields for saves that predate them
    if (!GameState.nodesSinceRocket)    GameState.nodesSinceRocket    = 0;
    if (!GameState._lastRocketCheckAt)  GameState._lastRocketCheckAt  = 0;
    if (GameState.rocketShieldNodes == null) GameState.rocketShieldNodes = 0;
    if (!GameState.stats) GameState.stats = {};
    if (!GameState.stats.totalBattlesWon)     GameState.stats.totalBattlesWon     = GameState.stats.battlesWon || 0;
    if (!GameState.stats.totalBossesBeaten)   GameState.stats.totalBossesBeaten   = GameState.bossesDefeated  || 0;
    if (!GameState.stats.totalNodesCompleted) GameState.stats.totalNodesCompleted = GameState.completedNodes?.length || 0;
    if (!GameState.stats.pokemonCaught)       GameState.stats.pokemonCaught       = 0;

    // Backfill evolutionStage — infer from the starter's actual current Pokémon ID.
    // This repairs saves where evolutionStage was undefined, null, or out of sync.
    // We look at p.id against the starter's evolutions array — the ID never lies.
    if (GameState.evolutionStage == null) {
      const sid     = Number(GameState.starterId);
      const starter = STARTERS.find(s => s.id === sid);
      const poke    = (GameState.party || []).find(p => p.isStarter);
      if (starter && poke) {
        const evos = starter.evolutions; // e.g. [1,2,3] for Bulbasaur
        if (poke.id === evos[2])      GameState.evolutionStage = 2;
        else if (poke.id === evos[1]) GameState.evolutionStage = 1;
        else                          GameState.evolutionStage = 0;
      } else {
        GameState.evolutionStage = 0;
      }
    }
    MapEngine.show();
  },

  async showStarterSelect() {
    showScreen('starter');
    const name = GameState.trainerName ? `, ${GameState.trainerName}` : '';
    const titleEl = document.querySelector('#screen-starter .screen-title');
    if (titleEl) titleEl.textContent = `Choose Your Partner${name}!`;
    const grid = document.getElementById('starter-grid');
    grid.innerHTML = '';

    // Load unlock progress for Eevee hint
    const unlocks    = loadUnlocks();
    const completedWith = unlocks.completedWith || [];
    const BASE_NAMES = ['bulbasaur','charmander','squirtle'];
    const eeveeProgress = BASE_NAMES.map(n => ({
      name: n, icon: n==='bulbasaur'?'🌿':n==='charmander'?'🔥':'💧',
      done: completedWith.includes(n),
    }));

    for (const s of STARTERS) {
      // Insert region divider before first Johto starter
      if (s.johtoStarter && !grid.querySelector('.starter-region-divider')) {
        const div = document.createElement('div');
        div.className = 'starter-region-divider';
        div.textContent = '🌿 Johto Region';
        grid.appendChild(div);
      }
      const data   = await fetchPoke(s.id).catch(() => null);
      const sprite = data ? getSpriteUrl(data) : '';

      // Determine lock state per starter type
      let locked = false;
      if (s.id === 25)  locked = !GameState.unlockedPikachu;
      if (s.id === 133) locked = !GameState.unlockedEevee && !unlocks.eevee;
      if (s.id === 151) locked = !GameState.unlockedMew   && !unlocks.mew;
      if (s.id === 150) locked = !GameState.unlockedMewtwo && !unlocks.mewtwo;
      if (s.johtoStarter) locked = !loadProfiles().find(p => p.key === getActiveProfile())?.johtoUnlocked;

      const card = document.createElement('div');
      card.className = 'starter-card';
      card.dataset.id   = s.id;
      card.dataset.type = s.type;

      // Build lock overlay — Eevee gets a progress indicator
      let lockHtml = '';
      if (locked && s.id === 133) {
        const pips = eeveeProgress.map(p =>
          `<span class="eevee-prog-pip${p.done ? ' done' : ''}">${p.icon}${p.done ? '✓' : '✗'}</span>`
        ).join('');
        lockHtml = `<div class="starter-locked">
          <div class="starter-locked-icon">🔒</div>
          <div class="starter-locked-text">Complete all 3 starters!</div>
          <div class="eevee-progress">${pips}</div>
        </div>`;
      } else if (locked && s.id === 151) {
        const dex        = loadPokedex();
        const caught     = Object.values(dex).filter(e => e.caught).length;
        lockHtml = `<div class="starter-locked">
          <div class="starter-locked-icon">🔒</div>
          <div class="starter-locked-text">Catch 20+ Pokémon!</div>
          <div class="starter-locked-hint">${caught}/20 caught</div>
        </div>`;
      } else if (locked && s.id === 150) {
        const ALL = ['bulbasaur','charmander','squirtle','pikachu','eevee','mew'];
        const done = ALL.filter(n => completedWith.includes(n));
        lockHtml = `<div class="starter-locked">
          <div class="starter-locked-icon">🔒</div>
          <div class="starter-locked-text">Complete all other starters!</div>
          <div class="starter-locked-hint">${done.length}/${ALL.length} complete</div>
        </div>`;
      } else if (locked && s.johtoStarter) {
        lockHtml = `<div class="starter-locked">
          <div class="starter-locked-icon">🌿</div>
          <div class="starter-locked-text">Win the Kanto League<br>to unlock Johto!</div>
        </div>`;
      } else if (locked) {
        lockHtml = `<div class="starter-locked">
          <div class="starter-locked-icon">🔒</div>
          <div class="starter-locked-text">Complete game<br>to unlock!</div>
        </div>`;
      }

      card.innerHTML = `
        <img class="starter-sprite" src="${sprite}" alt="${s.name}"
             onerror="this.src='assets/sprites/${s.id}.png'" />
        <div class="starter-name">${s.name}</div>
        <div class="starter-type-badge type-${s.type}">${s.type}</div>
        <div class="starter-desc">${StarterDescs[s.name]||''}</div>
        ${lockHtml}
      `;
      if (!locked) {
        card.addEventListener('mouseenter', () => SoundEngine.playStarterCry(s.id));
        card.onclick = () => this.selectStarter(card, s);
      }
      grid.appendChild(card);
    }
  },

  _selectedStarter: null,
  selectStarter(card, s) {
    document.querySelectorAll('.starter-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    this._selectedStarter = s;
    document.getElementById('starter-confirm').style.display = 'flex';
    document.getElementById('btn-confirm-starter').onclick = () => this.confirmStarter(s);
  },

  async confirmStarter(s) {
    showLoading();
    try {
    if (s.id === 25)  SoundEngine.playPikachu2();
    if (s.id === 133) SoundEngine.playStarterCry(133);
    if (s.id === 151) SoundEngine.playStarterCry(151);
    if (s.id === 152) SoundEngine.playStarterCry(152);
    if (s.id === 155) SoundEngine.playStarterCry(155);
    if (s.id === 158) SoundEngine.playStarterCry(158);
    const data   = await fetchPoke(s.id).catch(() => null);
    const sprite = data ? getSpriteUrl(data) : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${s.id}.png`;
    // Mewtwo starts at level 10 and gets +40 HP (handled in makePokemon via id check)
    const startLevel = s.id === 150 ? 10 : 5;
    const pokemon = makePokemon(s.id, startLevel, sprite, s.name, s.type, true);
    // Deck selection:
    // Eevee → eevee template; Mew → mew template; Mewtwo → mewtwo template; others → type
    const deckType = s.eeveeStarter ? 'eevee' : s.mewStarter ? 'mew' : s.mewtwostarter ? 'mewtwo' : s.type;
    const starterDeck = SpeciesCards.build(pokemon);
    pokemon.deck = starterDeck;
    // Flag Mewtwo so _applyCardEffect can apply the psychic 2× bonus
    if (s.id === 150) pokemon.isMewtwo = true;

    // If this is a brand-new profile, create it now that we have a name
    if (GameState._isNewProfile) {
      delete GameState._isNewProfile;
      const meta = createProfile(GameState.trainerName || 'Trainer');
      if (meta) {
        setActiveProfile(meta.key);
        // Load unlocks for the new (empty) profile
        const unlocks = loadUnlocks();
        GameState.unlockedPikachu = unlocks.pikachu || false;
        GameState.unlockedEevee   = unlocks.eevee   || false;
        GameState.unlockedMew     = unlocks.mew     || false;
        GameState.unlockedMewtwo  = unlocks.mewtwo  || false;
      }
    }

    GameState.starterId           = s.id;
    GameState.starterType         = s.type;
    // Region is determined by RUN INTENT, not by which creature was picked.
    // A Johto-unlocked profile starts a Johto run even if they bring a Kanto
    // partner (e.g. Pikachu); otherwise the run state and the profile's
    // progression flags disagree and the map setup can wedge. A Johto starter
    // forces Johto; otherwise we honour the profile's Johto status.
    const _meta = loadProfiles().find(p => p.key === getActiveProfile());
    const _johtoRun = !!(_meta?.leagueUnlocked && _meta?.johtoUnlocked);
    GameState.region              = (s.region === 'johto' || _johtoRun) ? 'johto' : 'kanto';
    GameState.party               = [pokemon];
    GameState.activePokemonIndex  = 0;
    GameState.deck                = starterDeck;
    GameState.improvementMap      = {};
    GameState.map                 = generateMap();
    GameState.completedNodes      = [];
    GameState.bossesDefeated      = 0;
    GameState.evolutionStage      = 0;
    GameState.nodesSinceRocket    = 0;
    GameState._lastRocketCheckAt  = 0;
    hideLoading();
    saveGame(true);   // first save — immediate so the run is instantly persisted
    MapEngine.show();
    } catch (err) {
      // Never leave the loading overlay stuck — surface the error and recover to
      // the start screen instead of presenting as a frozen game.
      console.error('confirmStarter failed:', err);
      hideLoading();
      showModal('Something went wrong', 'Could not start the adventure. Please try again.', () => {
        showScreen('start');
      });
    }
  },

  returnToStart() {
    deleteSave();
    const p = getActiveProfile();
    if (p) {
      const profiles = loadProfiles();
      const meta = profiles.find(pr => pr.key === p);
      if (meta) { meta.hasActiveSave = false; saveProfiles(profiles); }
    }
    GameState = null;
    ProfileEngine._updateStartScreen();
    showScreen('start');
  },

  goToMenu() {
    SoundEngine.stopSFX();
    if(!saveGame(true))return;
    GameState = null;
    SaveManager.nodeCheckpoint=null;
    ProfileEngine._updateStartScreen();
    showScreen('start');
  },

  resetAll() {
    const profiles = loadProfiles();
    profiles.forEach(pr => {
      try { localStorage.removeItem(saveKey(pr.key)); localStorage.removeItem(saveKey(pr.key)+'_backup'); }    catch(e) {}
      try { localStorage.removeItem(unlockKey(pr.key)); }  catch(e) {}
      try { localStorage.removeItem(pokedexKey(pr.key)); } catch(e) {}
    });
    try { localStorage.removeItem(PROFILES_KEY); }              catch(e) {}
    try { sessionStorage.removeItem('pokerogue_active_profile'); } catch(e) {}
    activeProfile = null;
    GameState = null;
    window.location.reload();
  },

  async afterBoss(bossIndex) {
    GameState.bossesDefeated++;
    const defeated = GameState.bossesDefeated;
    const boss     = getGymData()[Math.min(defeated - 1, getGymData().length - 1)];

    // ── Unlock mini-games progressively on boss defeat ────────────────────────
    // Each boss unlocks the next mini-game for subsequent maps.
    // Persisted in unlocks so recurring runs have all from the start.
    const MINIGAME_UNLOCK_SCHEDULE = {
      1: 'jigglypuff',   // After Brock
      2: 'surge',        // After Misty
      3: 'erika',        // After Surge
      4: 'ninja',        // After Erika
      5: 'sabrina',      // After Koga
      6: 'blaine',       // After Sabrina
      7: 'giovanni',     // After Blaine
    };
    if (MINIGAME_UNLOCK_SCHEDULE[defeated]) {
      const unlocks = loadUnlocks();
      const mg = MINIGAME_UNLOCK_SCHEDULE[defeated];
      if (!unlocks.miniGamesUnlocked.includes(mg)) {
        unlocks.miniGamesUnlocked.push(mg);
        saveUnlocks(unlocks);
      }
    }

    // ── Won all 8 gyms → Victory ──────────────────────────────────────────
    const regionData = getRegionData();
    if (defeated >= regionData.maxBosses) {
      if (GameState.region === 'johto') {
        // Johto victory — straight to victory screen, no unlock logic needed
        saveGame();
        VictoryEngine.show();
        return;
      }
      // Kanto victory — existing unlock logic
      // Track which starter completed this run
      const unlocks = loadUnlocks();
      unlocks.pikachu = true;
      const starterObj = STARTERS.find(s => s.id === GameState.starterId);
      const starterName = starterObj?.name?.toLowerCase() || '';
      if (starterName && !['pikachu','eevee'].includes(starterName)) {
        if (!unlocks.completedWith) unlocks.completedWith = [];
        if (!unlocks.completedWith.includes(starterName)) {
          unlocks.completedWith.push(starterName);
        }
      }
      // Unlock Eevee when all 3 base starters have completed a run
      const BASE = ['bulbasaur','charmander','squirtle'];
      if (BASE.every(n => unlocks.completedWith?.includes(n))) {
        unlocks.eevee = true;
      }

      // Unlock Mew when at least one Pokémon of every Kanto catchable type has been caught
      const KANTO_TYPES = ['normal','fire','water','grass','electric','ice','fighting',
                           'poison','ground','flying','psychic','bug','rock','ghost','dragon','fairy'];
      const dex = loadPokedex();
      const caughtTypes = new Set(
        Object.values(dex)
          .filter(e => e.caught)
          .map(e => {
            const pid = Number(e.id);
            return DUAL_TYPE_OVERRIDES[pid] || null; // we don't store type in dex, approximate via overrides
          })
          .filter(Boolean)
      );
      // More reliable: scan party and completed catches stored in dex — use a broader check
      // Count caught dex entries by type via DUAL_TYPE_OVERRIDES or the PokeAPI type stored at catch time
      // Since we store .caught but not type in dex, check if at least 12 distinct types are in the dex
      // (player needs to have caught broadly — detailed per-type check handled on starter screen)
      const caughtCount = Object.values(dex).filter(e => e.caught).length;
      if (caughtCount >= 20) {
        // Approximate: catching 20+ different Pokémon across the game covers most types
        // Full type check is done on the starter screen for the hint display
        unlocks.mew = true;
      }

      // Unlock Mewtwo when all other starters have completed a run
      const ALL_STARTERS = ['bulbasaur','charmander','squirtle','pikachu','eevee','mew'];
      if (ALL_STARTERS.every(n => unlocks.completedWith?.includes(n))) {
        unlocks.mewtwo = true;
      }
      saveUnlocks(unlocks);
      GameState.unlockedPikachu = true;
      GameState.unlockedEevee   = unlocks.eevee   || false;
      GameState.unlockedMew     = unlocks.mew     || false;
      GameState.unlockedMewtwo  = unlocks.mewtwo  || false;
      saveGame();
      VictoryEngine.show();
      return;
    }

    // ── Generate next map ─────────────────────────────────────────────────
    const nextBossIdx = Math.min(defeated, getGymData().length - 1);
    GameState.map               = generateMap(nextBossIdx);
    GameState.completedNodes    = [];
    GameState.highWaterRow      = -1;
    GameState.nodesSinceRocket  = 0;
    GameState._lastRocketCheckAt = 0;
    GameState.lureActive        = false; // lure expires per-map

    // ── Level up party after boss win (+3 bonus levels) ───────────────────
    // Give everyone 4 bonus levels after a boss win.
    // Only the first evolution that fires is used — GameState.evolutionStage
    // is updated on first trigger so subsequent calls won't re-trigger the same stage.
    const evolutions = [];
    for (let bonus = 0; bonus < 4; bonus++) {
      const evo = levelUpParty('boss');
      if (evo.length > 0 && evolutions.length === 0) evolutions.push(...evo);
    }

    const nextBoss  = getGymData()[nextBossIdx];

    saveGame();

    const showBadgeCeremony = () => {
      if (evolutions.length > 0) {
        runEvolutions(evolutions, () => BadgeCeremony.show(boss, nextBoss, defeated));
      } else {
        BadgeCeremony.show(boss, nextBoss, defeated);
      }
    };

    // Joining narratives only in Kanto run for Brock (1) and Misty (2)
    if (GameState.region !== 'johto' && defeated === 1) {
      const name = GameState.trainerName || 'Trainer';
      showModal(
        '🧑‍🍳 Brock wants to join!',
        `That was an incredible battle, ${name}. Your Pokémon have real heart — I haven't seen that kind of bond in a long time.\n\nI can't just let you walk out of here. My team and I would like to travel with you for a while. At least until you reach the next gym.\n\nAnd don't worry — I'll cook for your Pokémon every chance we get. A well-fed team is a strong team!`,
        () => showBadgeCeremony()
      );
    } else if (GameState.region !== 'johto' && defeated === 2) {
      const name = GameState.trainerName || 'Trainer';
      showModal(
        '🎣 Misty wants to join!',
        `Okay, okay — you beat me fair and square, ${name}. I'll admit it. Your Pokémon were something else.\n\nBut don't get smug about it! I'm coming with you. Someone needs to keep an eye on you, and frankly the route ahead has some incredible water Pokémon I want to study.\n\nI'll test your type knowledge whenever I can. A trainer who doesn't know their matchups is a trainer who loses — and I won't have that on my watch.`,
        () => showBadgeCeremony()
      );
    } else {
      showBadgeCeremony();
    }
  },

  afterEvolve() {
    // handled by EvolveEngine callback
  },
};

// ─── BADGE CEREMONY ──────────────────────────────────────────────────────────


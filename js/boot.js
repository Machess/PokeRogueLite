document.addEventListener('DOMContentLoaded', () => {
  SaveManager.setup();Travel.setup();
  AssetPreloader.installRetry();
  RegionMap.install();
  Exploration.install();
  TrainerSizing.init();
  MiniGameScenes.init();
  CatchTouch.install();
  MenuScene.init();
  for(const family of [CARD_TEMPLATES,TYPE_SIGNATURE_CARDS,LEAGUE_DECKS])for(const cards of Object.values(family))for(const c of cards)c.effect=CombatRules.describe(c);
  for(const c of STANDARD_CARDS)c.effect=CombatRules.describe(c);
  _applyTheme();   // Phase 1: stamp THEME vocabulary onto static [data-theme] labels
  // ── Save integrity migration — repair damage from the old null-save bug ──
  // Any save that parses to null/non-object, or lacks a party, is corrupt.
  // Purge it and sync each profile's hasActiveSave flag to the real save state.
  try {
    const profiles = loadProfiles();
    let changed = false;
    profiles.forEach(meta => {
      const raw = localStorage.getItem(saveKey(meta.key));
      let valid = false;
      if (raw && raw !== 'null' && raw.length > 2) {
        try {
          const parsed = JSON.parse(raw);
          valid = !!(parsed && typeof parsed === 'object' && Array.isArray(parsed.party) && parsed.party.length);
        } catch (_) { valid = false; }
      }
      if(!valid){try{const backup=localStorage.getItem(saveKey(meta.key)+'_backup');if(backup&&SaveManager.valid(JSON.parse(backup))){localStorage.setItem(saveKey(meta.key),backup);valid=true;}}catch(_){}}
      if (meta.hasActiveSave !== valid) { meta.hasActiveSave = valid; changed = true; }
    });
    if (changed) saveProfiles(profiles);
  } catch (e) { console.error('save migration failed', e); }

  // D5 — universal tap blip on any enabled button (delegated, capture phase)
  document.addEventListener('pointerdown', e => {
    const btn = e.target.closest('button');
    if (btn && !btn.disabled) SoundEngine.playTap();
  }, { capture: true, passive: true });


  // ── Party drawer ──
  document.getElementById('btn-party-drawer-close').addEventListener('click', () => PartyOverview.close());
  document.getElementById('party-drawer-backdrop').addEventListener('click', () => PartyOverview.close());
  document.getElementById('btn-poke-detail-close').addEventListener('click', () => PartyOverview.closeDetail());

  // ── Register screen ──
  RegistrationEngine.init();
  document.getElementById('btn-name-confirm').addEventListener('click', () => RegistrationEngine.confirmName());
  document.getElementById('btn-age-confirm').addEventListener('click',  () => RegistrationEngine.confirmAge());
  document.getElementById('btn-register-back').addEventListener('click', () => {
    GameState = null;
    activeProfile = null;
    try { sessionStorage.removeItem('pokerogue_active_profile'); } catch(e) {}
    ProfileEngine.show();
  });
  document.getElementById('trainer-name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') RegistrationEngine.confirmName();
  });

  // ── Intro cinematic ──
  document.getElementById('btn-intro-next').addEventListener('click', () => IntroEngine.next());
  document.getElementById('btn-intro-skip').addEventListener('click', () => IntroEngine.skip());
  document.getElementById('btn-tut-next').addEventListener('click',  () => TutorialEngine.next());
  document.getElementById('btn-tut-skip').addEventListener('click',  () => TutorialEngine.skip());

  // ── Meowth / Fishing / Surge / Erika / Koga / Blaine challenge ──
  document.getElementById('challenge-continue-btn').addEventListener('click', () => {
    if (SurgeEngine._answered) {
      SurgeEngine._finish();
    } else if (SurgeEngine._round > 0 && SurgeEngine._round <= 3) {
      SurgeEngine.nextRound();
    } else if (ErikaEngine._answered) {
      ErikaEngine.finish();
    } else if (BlaineEngine._answered) {
      BlaineEngine.finish();
    } else if (FishingEngine._answered) {
      FishingEngine.finish();
    } else {
      MeowthChallenge.finish();
    }
  });

  // ── Map screen ──
  document.getElementById('btn-map-menu').addEventListener('click', () => {
    showModal(
      'Return to Menu?',
      'Your progress is saved. You can continue from the main menu.',
      () => Game.goToMenu()
    );
    document.getElementById('modal-ok').textContent = 'Yes, leave';
  });

  // ── Mute buttons ──
  const updateMuteBtns = (muted) => {
    document.querySelectorAll('.mute-btn').forEach(b => { b.textContent = muted ? '🔇' : '🔊'; });
  };
  document.querySelectorAll('.mute-btn').forEach(btn => {
    btn.addEventListener('click', () => updateMuteBtns(SoundEngine.toggleMute()));
  });

  // ── Start screen ──
  document.getElementById('btn-new-game').addEventListener('click', () => {
    // D3 — guard: starting a new run discards an active save
    const contBtn = document.getElementById('btn-continue-game');
    const hasSave = contBtn && !contBtn.disabled;
    if (hasSave) {
      showModal('Start a new run?', 'Your current run will be lost!\nBadges and Pokédex are kept.', () => Game.startNew(), true);
    } else {
      Game.startNew();
    }
  });
  document.getElementById('btn-continue-game').addEventListener('click', () => Game.continueGame());
  document.getElementById('btn-start-league').addEventListener('click', () => LeagueEngine.showPartySelect());
  document.getElementById('btn-open-pokedex').addEventListener('click', () => PokedexEngine.show());
  document.getElementById('btn-select-profile').addEventListener('click', () => ProfileEngine.show());
  document.getElementById('btn-open-parent').addEventListener('click', () => ParentDashboardEngine.open());
  document.getElementById('btn-switch-profile').addEventListener('click', () => ProfileEngine.show());
  document.getElementById('btn-profiles-back').addEventListener('click', () => {
    ProfileEngine._updateStartScreen();
    showScreen('start');
  });
  document.getElementById('btn-reset-all').addEventListener('click', () => {
    showModal(
      '⚠ Reset All Data?',
      'This will wipe ALL profiles, Pokédex entries, unlocks and saved progress. Cannot be undone.',
      () => Game.resetAll()
    );
    document.getElementById('modal-ok').textContent = 'Yes, reset everything';
  });

  // ── Battle screen ──
  document.getElementById('btn-end-turn').addEventListener('click', () => BattleEngine.endTurn());
  document.getElementById('btn-use-item').addEventListener('click', () => {
    if (BattleEngine._battleOver || BattleEngine._itemUsedThisTurn) return;
    ItemEngine.renderItemPicker(false, (itemId) => {
      if (itemId.startsWith('erika_')) {
        const idx    = parseInt(itemId.replace('erika_', ''));
        const result = ItemEngine.applyErikaPotion(idx, BattleEngine.state, false);
        if (result) { BattleEngine._itemUsedThisTurn = true; BattleEngine._log(result.msg); BattleEngine._render(); SaveManager.captureBattle(false); }
      } else {
        const result = ItemEngine.usePotion(BattleEngine.state, false);
        if (result) { BattleEngine._itemUsedThisTurn = true; BattleEngine._log(result.msg); BattleEngine._render(); SaveManager.captureBattle(false); }
      }
    });
  });

  // ── Boss screen ──
  document.getElementById('btn-start-boss-battle').addEventListener('click', () => {
    // ActiveEngine handles all mini-game engines (Surge, Erika, Ninja, etc.)
    if (ActiveEngine.go()) return;
    // Fall through to battle engines
    if (TrainerBattleEngine._isActive) { TrainerBattleEngine.startBattle(); }
    else if (BossEngine._isRocket)     { RocketBattleEngine.startBattle(); }
    else                               { BossEngine.startBattle(); }
  });
  document.getElementById('btn-dialogue-next').addEventListener('click', () => {
    if (CookingEngine._isActive) {
      CookingEngine.advanceDialogue();
    } else {
      RocketBattleEngine.advanceDialogue();
    }
  });
  document.getElementById('btn-boss-end-turn').addEventListener('click', () => BossEngine.endTurn());
  document.getElementById('btn-boss-use-item').addEventListener('click', () => {
    if (BossEngine._isOver || BattleEngine._itemUsedThisTurn) return;
    ItemEngine.renderItemPicker(true, (itemId) => {
      if (itemId.startsWith('erika_')) {
        const idx    = parseInt(itemId.replace('erika_', ''));
        const result = ItemEngine.applyErikaPotion(idx, BossEngine.bState, true);
        if (result) { BattleEngine._itemUsedThisTurn = true; BossEngine._log(result.msg); BossEngine._render(); SaveManager.captureBattle(true); }
      } else {
        const result = ItemEngine.usePotion(BossEngine.bState, true);
        if (result) { BattleEngine._itemUsedThisTurn = true; BossEngine._log(result.msg); BossEngine._render(); SaveManager.captureBattle(true); }
      }
    });
  });

  // ── Catch screen ──
  document.getElementById('btn-throw-ball').addEventListener('click', e => {if(e.detail===0)CatchEngine.throwBall();});
  document.getElementById('btn-flee').addEventListener('click', () => CatchEngine.flee());
  document.getElementById('btn-catch-continue').addEventListener('click', () => CatchEngine.finish());

  // ── Card reward screen ──
  document.getElementById('btn-cr-skip').addEventListener('click', () => CardReward.skip());

  // ── Shop screen ──
  document.getElementById('btn-shop-leave').addEventListener('click', () => ShopEngine.finish());

  // ── Pokédex screen ──
  document.getElementById('btn-pokedex-back').addEventListener('click', () => showScreen('start'));

  // ── Training screen ──
  document.getElementById('btn-improve').addEventListener('click', () => TrainingEngine.improve());
  document.getElementById('btn-training-skip').addEventListener('click', () => TrainingEngine.skip());
  document.getElementById('btn-training-pick-skip').addEventListener('click', () => TrainingEngine._startWithPokemon(GameState.activePokemonIndex));
  document.getElementById('training-mode-upgrade').addEventListener('click', () => TrainingEngine.setMode('upgrade'));
  document.getElementById('training-mode-remove').addEventListener('click',  () => TrainingEngine.setMode('remove'));
  document.getElementById('training-mode-item').addEventListener('click',    () => TrainingEngine.setMode('item-upgrade'));

  // ── Game Over screen ──
  document.getElementById('btn-gameover-restart').addEventListener('click', () => GameOver.restart());

  // ── Heal screen ──
  document.getElementById('btn-heal-finish').addEventListener('click', () => HealEngine.finish());

  // ── Evolve screen ──
  document.getElementById('btn-evolve-continue').addEventListener('click', () => Game.afterEvolve());

  // ── Cooking screen ──
  document.getElementById('btn-cooking-submit').addEventListener('click', () => CookingEngine.submit());

  // ── Victory screen ──
  document.getElementById('btn-play-again').addEventListener('click', () => Game.returnToStart());
  document.getElementById('btn-league-victory-done').addEventListener('click', () => Game.returnToStart());
  document.getElementById('btn-league-party-back').addEventListener('click', () => Game.returnToStart());

  // ── Modal ──
  document.getElementById('modal-ok').addEventListener('click', () => closeModal());

  // Restore active profile from session, then update start screen
  const _storedProfile = getActiveProfile();
  const _allProfiles   = loadProfiles();
  if (_storedProfile && _allProfiles.find(p => p.key === _storedProfile)) {
    // Valid profile from last session — restore silently
    setActiveProfile(_storedProfile);
    ProfileEngine._updateStartScreen();
    showScreen('start');
  } else if (_allProfiles.length === 0) {
    // No profiles at all — show profile screen immediately so user creates one
    showScreen('profiles');
    ProfileEngine._render();
  } else {
    // Profiles exist but none active — show profile picker
    showScreen('profiles');
    ProfileEngine._render();
  }
});

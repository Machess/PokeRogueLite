const GameOver = {
  show(defeatedBy) {
    SaveManager.complete();GameState._runEnded=true;deleteSave();
    const stats   = GameState.stats || {};
    const party   = GameState.party || [];
    const beaten  = GameState.bossesDefeated || 0;
    const name    = GameState.trainerName || 'Trainer';

    // ── Personal best tracking ─────────────────────────────────────────────
    const profiles  = loadProfiles();
    const profIdx   = profiles.findIndex(p => p.key === getActiveProfile());
    let   isNewBest = false;
    if (profIdx >= 0) {
      const prev = profiles[profIdx].bestBossesDefeated || 0;
      if (beaten > prev) {
        isNewBest = true;
        profiles[profIdx].bestBossesDefeated = beaten;
        saveProfiles(profiles);
      }
    }
    const pbBanner = document.getElementById('gameover-pb-banner');
    if (pbBanner) pbBanner.style.display = isNewBest ? '' : 'none';

    // ── Defeated-by line ──────────────────────────────────────────────────
    document.getElementById('gameover-defeated-by').textContent =
      `Defeated by ${defeatedBy}`;

    // ── Stats ─────────────────────────────────────────────────────────────
    document.getElementById('go-battles-won').textContent =
      stats.totalBattlesWon    || stats.battlesWon   || 0;
    document.getElementById('go-caught').textContent =
      stats.pokemonCaught      || 0;
    document.getElementById('go-nodes').textContent =
      stats.totalNodesCompleted || GameState.completedNodes?.length || 0;
    document.getElementById('go-bosses').textContent = beaten;

    // ── Run summary card ──────────────────────────────────────────────────
    const summaryEl = document.getElementById('gameover-run-summary');
    if (summaryEl) {
      // Badge progress row
      const badgeEmojis = ['🪨','💧','⚡','🌿','💨','🔮','🔥','🌍'];
      const badgeRow = badgeEmojis.map((b, i) =>
        `<span class="go-badge-pip${i < beaten ? ' go-badge-earned' : ''}">${i < beaten ? b : '○'}</span>`
      ).join('');

      // Party farewell from MVP
      const mvp = party.reduce((best, p) =>
        (p.battlesWon || 0) >= (best.battlesWon || 0) ? p : best, party[0] || null);
      const mvpLine = mvp
        ? `${mvp.name} fought ${mvp.battlesWon || 0} battle${(mvp.battlesWon||0)!==1?'s':''} before going down. They gave everything.`
        : '';

      // Boss farewell line — from whichever boss stopped the run
      const lastBoss = getGymData()[Math.min(beaten, getGymData().length - 1)];
      const BOSS_TAUNTS = [
        `"Brock says: The Boulder Badge was just the beginning. Come back stronger."`,
        `"Misty says: You almost had me. Almost."`,
        `"Surge says: You couldn't cut it. Hit the gym — literally."`,
        `"Erika says: Your Pokémon fought beautifully. Rest now."`,
        `"Koga says: The shadows claimed you. As I knew they would."`,
        `"Sabrina says: I foresaw this. Did you?"`,
        `"Blaine says: Ha! You got this far — that's no small thing!"`,
        `"Giovanni says: Disappointing. I expected more from someone who made it this far."`,
      ];
      const tauntLine = BOSS_TAUNTS[Math.min(beaten, BOSS_TAUNTS.length - 1)];

      // Party sprites
      const partySprites = party.map(p =>
        `<img src="${p.spriteUrl}" alt="${p.name}" class="go-party-sprite pixel-sprite"
              onerror="this.src='assets/sprites/${p.id}.png'">`
      ).join('');

      summaryEl.innerHTML = `
        <div class="go-badge-row">${badgeRow}</div>
        <div class="go-party-row">${partySprites}</div>
        ${mvp ? `<div class="go-mvp-line">⭐ ${mvpLine}</div>` : ''}
        <div class="go-taunt-line">${tauntLine}</div>`;
    }

    // ── Favourite Pokémon card ─────────────────────────────────────────────
    const fav = party.reduce((best, p) =>
      (p.battlesWon || 0) >= (best.battlesWon || 0) ? p : best, party[0] || null);
    const favEl = document.getElementById('gameover-fav');
    if (fav && favEl) {
      favEl.innerHTML = `
        <div class="gameover-fav-label">Your Favourite Partner</div>
        <div class="gameover-fav-card">
          <img src="${fav.spriteUrl}" alt="${fav.name}"
               onerror="this.src='assets/sprites/${fav.id}.png'"
               class="gameover-fav-sprite" />
          <div class="gameover-fav-name">${fav.name}</div>
          <div class="gameover-fav-wins">${fav.battlesWon || 0} battle${(fav.battlesWon||0)!==1?'s':''} won</div>
        </div>`;
    }

    // ── Rain atmosphere ───────────────────────────────────────────────────
    const rain = document.getElementById('gameover-rain');
    rain.innerHTML = '';
    for (let i = 0; i < 60; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      drop.style.left             = Math.random() * 100 + '%';
      drop.style.animationDelay   = (Math.random() * 2) + 's';
      drop.style.animationDuration= (0.4 + Math.random() * 0.5) + 's';
      drop.style.height            = (12 + Math.random() * 20) + 'px';
      rain.appendChild(drop);
    }

    showScreen('gameover');
  },

  restart() {
    SoundEngine.stopSFX();
    // Persist age/tier/name into profile meta BEFORE deleteSave wipes the save
    // and before GameState is nulled — so _doStartNew can recover them.
    if (GameState) {
      const profiles = loadProfiles();
      const idx      = profiles.findIndex(p => p.key === getActiveProfile());
      if (idx >= 0) {
        profiles[idx].trainerAge     = GameState.trainerAge     || 10;
        profiles[idx].difficultyTier = GameState.difficultyTier || 2;
        profiles[idx].trainerName    = GameState.trainerName    || profiles[idx].name || '';
        profiles[idx].hasActiveSave  = false;
        saveProfiles(profiles);
      }
    }
    deleteSave();
    GameState = null;
    showScreen('start');
  },
};

// ─── CATCH ENGINE ────────────────────────────────────────────────────────────

// Type-flavoured flee lines

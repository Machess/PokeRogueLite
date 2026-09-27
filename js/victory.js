const VictoryEngine = {
  show() {
    const stats = GameState.stats || {};
    const party = GameState.party || [];

    // ── Track total wins per profile ──────────────────────────────────────────
    const profiles = loadProfiles();
    const profIdx  = profiles.findIndex(p => p.key === getActiveProfile());
    let totalWins  = 0;
    if (profIdx >= 0) {
      profiles[profIdx].totalWins = (profiles[profIdx].totalWins || 0) + 1;
      totalWins = profiles[profIdx].totalWins;
      // Record caught Pokémon maxLevel in Pokédex for League party selection
      (GameState.party || []).forEach(p => {
        const dex = loadPokedex();
        if (!dex[p.id]) dex[p.id] = {};
        dex[p.id].maxLevel    = Math.max(dex[p.id].maxLevel || 0, p.level || 1);
        dex[p.id].spriteUrl   = p.spriteUrl;
        dex[p.id].name        = p.name;
        dex[p.id].type        = p.type;
        // Persist deck improvements so League can apply them
        if (p.improvementMap && Object.keys(p.improvementMap).length > 0) {
          // Merge — keep the higher improvement level for each slot
          const prev = dex[p.id].improvements || {};
          Object.entries(p.improvementMap).forEach(([slot, val]) => {
            prev[slot] = Math.max(prev[slot] || 0, val);
          });
          dex[p.id].improvements = prev;
        }
        savePokedex(dex);
      });
      // Unlock League only on the exact win that hits the threshold (not retroactively)
      // leagueEnvelopeSeen prevents it showing again on future wins
      const justHitThreshold = totalWins >= 3 && !profiles[profIdx].leagueUnlocked;
      if (justHitThreshold) {
        profiles[profIdx].leagueUnlocked    = true;
        profiles[profIdx].leagueEnvelopeSeen = false; // will show once
      }
      saveProfiles(profiles);
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    document.getElementById('vic-battles-won').textContent =
      stats.totalBattlesWon    || stats.battlesWon   || 0;
    document.getElementById('vic-caught').textContent      =
      stats.pokemonCaught      || 0;
    document.getElementById('vic-nodes').textContent       =
      stats.totalNodesCompleted || GameState.completedNodes?.length || 0;
    document.getElementById('vic-bosses').textContent      =
      stats.totalBossesBeaten  || GameState.bossesDefeated || 0;

    // ── Teaser sub-text — builds anticipation across runs ─────────────────────
    let subText = 'You are the PokéTrials Champion! Pikachu is now unlocked!';
    if (totalWins === 1) subText = 'You are the PokéTrials Champion! Word of your victory is spreading…';
    if (totalWins === 2) subText = 'Two victories. A letter was intercepted at the Pokémon Centre. It had your name on it.';
    if (totalWins >= 3)  subText = 'Three victories. Something important awaits you.';
    document.getElementById('victory-sub').textContent = subText;

    // ── Win tracker — explicit championship progress toward the League ────────
    const vpEl = document.getElementById('victory-progress');
    if (vpEl) {
      if (GameState.region === 'johto') {
        vpEl.textContent = '';
        vpEl.style.display = 'none';
      } else {
        vpEl.style.display = '';
        const w = Math.min(totalWins, 3);
        if (profiles[profIdx]?.leagueUnlocked && totalWins >= 3) {
          vpEl.textContent = '⚔️ The League is unlocked! Check the main menu.';
          vpEl.className   = 'victory-progress pw-league';
        } else {
          const left = 3 - w;
          vpEl.textContent = `🏆 Kanto Championships: ${w}/3` +
            (left > 0 ? ` — ${left} more to unlock the League!` : '');
          vpEl.className   = 'victory-progress pw-kanto';
        }
      }
    }

    // ── Favourite ─────────────────────────────────────────────────────────────
    const fav = party.reduce((best, p) =>
      (p.battlesWon || 0) >= (best.battlesWon || 0) ? p : best,
      party[0] || null
    );
    const favEl = document.getElementById('victory-fav');
    if (fav) {
      favEl.innerHTML = `
        <div class="gameover-fav-label">MVP Partner</div>
        <div class="gameover-fav-card">
          <img src="${fav.spriteUrl}" alt="${fav.name}"
               onerror="this.src='assets/sprites/${fav.id}.png'"
               class="gameover-fav-sprite" />
          <div class="gameover-fav-name">${fav.name}</div>
          <div class="gameover-fav-wins">${fav.battlesWon || 0} battle${(fav.battlesWon||0)!==1?'s':''} won</div>
        </div>`;
    }

    // ── Full party ────────────────────────────────────────────────────────────
    const partyEl = document.getElementById('victory-party');
    partyEl.innerHTML = '';
    party.forEach(p => {
      const d = document.createElement('div');
      d.className = 'heal-poke-card';
      d.innerHTML = `
        <img src="${p.spriteUrl}" alt="${p.name}"
             onerror="this.src='assets/sprites/${p.id}.png'"
             style="width:56px;height:56px;image-rendering:pixelated" />
        <div class="heal-poke-name">${p.name}</div>`;
      partyEl.appendChild(d);
    });
    requestAnimationFrame(() => fitAllText('.heal-poke-name', partyEl));

    // ── Stars ─────────────────────────────────────────────────────────────────
    const starsEl = document.getElementById('victory-stars');
    starsEl.innerHTML = '';
    for (let i = 0; i < 40; i++) {
      const s = document.createElement('div');
      s.className = 'victory-star';
      s.style.left              = Math.random() * 100 + '%';
      s.style.top               = Math.random() * 100 + '%';
      s.style.animationDelay    = (Math.random() * 3) + 's';
      s.style.animationDuration = (1.5 + Math.random() * 2) + 's';
      s.style.fontSize          = (8 + Math.random() * 14) + 'px';
      s.textContent = '★';
      starsEl.appendChild(s);
    }

    showScreen('victory');

    // ── Envelope — show only once, on the exact qualifying win ───────────────
    if (profiles[profIdx]?.leagueUnlocked && profiles[profIdx]?.leagueEnvelopeSeen === false) {
      profiles[profIdx].leagueEnvelopeSeen = true;
      saveProfiles(profiles);
      setTimeout(() => LeagueEngine.showEnvelope(totalWins), 3500);
    }
  },
};

// ─── UTILITIES ────────────────────────────────────────────────────────────────


const JENNY_LINES = [
  "Officer on duty! A trainer's Pokémon has gone missing. Read the report and help me find it!",
  "Another lost Pokémon case! Let's match the description to the right suspect. ♥",
  "Citizens are counting on us, Officer. Study the report carefully!",
  "Police work is detective work! Find the Pokémon that fits every clue.",
];

const JennyEngine = {
  _isActive: false, _node: null, _round: 0, _hits: 0, _suspects: [],

  async start(node) {
    this._node = node; this._isActive = true; this._round = 0; this._hits = 0;
    ActiveEngine.set(this);

    showLoading();
    // Pre-fetch sprites for a pool drawn from the famous-Pokémon table
    const picks = shuffle([...MISTY_POKEMON]).slice(0, 14);
    this._suspects = (await Promise.all(picks.map(async p => {
      const d = await fetchPoke(p.id).catch(() => null);
      return {
        id: p.id, name: p.name, type: p.type, clues: p.clues,
        sprite: d ? getSpriteUrl(d) :
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`,
      };
    }))).filter(Boolean);
    hideLoading();

    showBossIntro({
      gymIndex: 0, portrait: 'officer_jenny.png', gameKey: 'jenny',
      name: 'Officer Jenny', btnLabel: '🚓 Start Patrol!',
      cry: 'officer_jenny.mp3',
      introText: JENNY_LINES[Math.floor(Math.random() * JENNY_LINES.length)],
    });
    const t = document.getElementById('boss-trainer-sprite');
    if (t) t.onerror = () => { t.style.visibility = 'hidden'; };
  },

  startGame() {
    this._isActive = false; ActiveEngine.clear();
    document.getElementById('trainer-intro').style.display = 'none';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    this._showRound();
  },

  _showRound() {
    if (this._round >= 5 || this._suspects.length < 4) { this._finish(); return; }
    const tier = Math.min(GameState.difficultyTier || 2, 3);

    // Pick the lost Pokémon + line-up of suspects (type-aware decoys)
    const target   = this._suspects[Math.floor(Math.random() * this._suspects.length)];
    const lineupN  = tier === 1 ? 3 : tier === 2 ? 4 : 6;
    const sameType = shuffle(this._suspects.filter(s => s.type === target.type && s.id !== target.id));
    const others   = shuffle(this._suspects.filter(s => s.type !== target.type && s.id !== target.id));
    const decoys   = [...sameType, ...others].slice(0, lineupN - 1);
    let lineup     = shuffle([target, ...decoys]);

    // The report — number of clue lines scales with tier (more help for little ones)
    const clueCount = tier === 1 ? 3 : tier === 2 ? 2 : 2;
    const report = shuffle([...target.clues]).slice(0, clueCount);

    const cv = setupChallengeScreen({
      portrait: 'officer_jenny.png', badge: '🚓 Lost & Found Patrol',
      intro: `Case ${this._round + 1}/5 — ${this._hits} solved`,
      wrapClass: 'jenny-wrap', screenClass: 'jenny-active',
    });

    // Police report card
    const reportEl = document.createElement('div');
    reportEl.className = 'jenny-report';
    reportEl.innerHTML =
      `<div class="jenny-report-head">📋 POLICE REPORT</div>` +
      report.map(c => `<div class="jenny-report-line">• ${c}</div>`).join('');
    cv.appendChild(reportEl);

    // Tier 3 — "narrow it down" elimination step before the final pick
    const proceed = (finalLineup) => {
      const q = document.createElement('div');
      q.className = 'jenny-question';
      q.textContent = 'Who is the missing Pokémon?';
      cv.appendChild(q);

      const grid = document.createElement('div');
      grid.className = 'jenny-lineup';
      finalLineup.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'jenny-suspect';
        btn.innerHTML = `<img src="${s.sprite}" class="jenny-suspect-sprite pixel-sprite"><span class="jenny-suspect-name">${s.name}</span>`;
        btn.addEventListener('click', () => {
          grid.querySelectorAll('.jenny-suspect').forEach(x => x.disabled = true);
          const correct = s.id === target.id;
          btn.classList.add(correct ? 'jenny-correct' : 'jenny-wrong');
          if (!correct) {
            // Highlight the right one
            grid.querySelectorAll('.jenny-suspect').forEach((x, i) => {
              if (finalLineup[i].id === target.id) x.classList.add('jenny-correct');
            });
          }
          if (correct) this._hits++;
          setTimeout(() => { this._round++; this._showRound(); }, 1500);
        });
        grid.appendChild(btn);
      });
      cv.appendChild(grid);
    };

    if (tier === 3) {
      // Elimination: name an attribute the target has; tap away those that lack it.
      const elimMsg = document.createElement('div');
      elimMsg.className = 'jenny-elim-msg';
      elimMsg.textContent = `The report says the suspect is a ${target.type}-type. Tap away the ones that DON'T match!`;
      cv.appendChild(elimMsg);

      const grid = document.createElement('div');
      grid.className = 'jenny-lineup';
      lineup.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'jenny-suspect jenny-elim';
        btn.innerHTML = `<img src="${s.sprite}" class="jenny-suspect-sprite pixel-sprite"><span class="jenny-suspect-name">${s.name}</span>`;
        btn.addEventListener('click', () => {
          if (s.type === target.type) {
            btn.classList.add('jenny-shake');
            setTimeout(() => btn.classList.remove('jenny-shake'), 300);
            return; // can't eliminate a matching-type one
          }
          btn.classList.add('jenny-eliminated');
          btn.disabled = true;
        });
        grid.appendChild(btn);
      });
      cv.appendChild(grid);

      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn-pixel btn-primary jenny-narrow-btn';
      nextBtn.textContent = 'Narrow it down ▶';
      nextBtn.addEventListener('click', () => {
        // Survivors = matching type (plus the target guaranteed)
        const survivors = lineup.filter(s => s.type === target.type);
        const finalSet = survivors.length >= 2 ? survivors : lineup;
        elimMsg.remove(); grid.remove(); nextBtn.remove();
        proceed(finalSet);
      });
      cv.appendChild(nextBtn);
    } else {
      proceed(lineup);
    }
  },

  _finish() {
    const won  = this._hits >= 4;
    const tier = Math.min(GameState.difficultyTier || 2, 3);
    const baseGold = { 1: 8, 2: 12, 3: 16 }[tier];
    const gold = won ? baseGold : Math.floor(baseGold / 2);

    // Reward: patrol shield — no Team Rocket in Mystery nodes for 5 nodes
    if (won) GameState.rocketShieldNodes = 5;

    completeChallenge({
      screenClass: 'jenny-active', won,
      goldReward: gold,
      score: this._hits, maxScore: 5, gameKey: 'jenny',
      modalTitle: this._hits >= 5 ? '🚓 Case Closed — Perfect!' : won ? '🚓 Great Police Work!' : '🚓 Cases Still Open...',
      modalBody: `${this._hits}/5 cases solved\n+${gold}💰` +
        (won ? '\n\nPatrols stepped up! Team Rocket will lay low for a while. ♥' : ''),
    });
  },
};

// ─── BUGSY ENGINE — "Bug Hunt" (Tap the right bug — real sprites) ────────────

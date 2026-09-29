const SABRINA_INTROS = [
  `${'{name}'}... I already knew you were coming. I took the liberty of borrowing one of your Pokémon. Don't worry — all you have to do is put it back together. Simple, for someone of your... limited capabilities.`,
  `You walk in here with such confidence, ${'{name}'}. Let's test that confidence. I've shattered one of your Pokémon into pieces. Reassemble it, and I'll return it. Fail... and it stays this way.`,
  `Hmm. ${'{name}'}. I've scattered the pieces of your Pokémon's image across the void. Reassemble them correctly — prove your mind is as sharp as your ambition.`,
];

const SabrinaEngine = {
  _isActive:     false,
  _node:         null,
  _pokemonIdx:   null,   // index in party of the targeted Pokémon
  _spriteUrl:    null,
  _pokeName:     '',
  _gridSize:     4,      // 4×4 grid
  _missingCount: 4,      // number of pieces to remove (scales with progress)
  _missingSlots: [],     // [{row, col}] positions that are empty
  _trayPieces:   [],     // [{row, col}] pieces in the tray (shuffled)
  _selectedTray: null,   // index into _trayPieces of selected piece, or null
  _placed:       0,      // how many pieces correctly placed so far

  async start(node) {
    this._node    = node;
    this._isActive = true;
    ActiveEngine.set(this);
    this._placed  = 0;
    this._selectedTray = null;

    // Scale missing pieces with progress: 3 early, 4 mid, 5 late
    const beaten = GameState.bossesDefeated || 0;
    this._missingCount = beaten < 4 ? 3 : beaten < 7 ? 4 : 5;

    // Pick a living party Pokémon (preferably not the starter)
    const living = GameState.party
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.hp > 0);
    const target = living[Math.floor(Math.random() * living.length)];
    this._pokemonIdx = target?.i ?? GameState.activePokemonIndex;
    const poke = GameState.party[this._pokemonIdx];
    this._pokeName = poke.name;

    // Fetch official artwork — higher resolution = better puzzle
    showLoading();
    try {
      const data = await fetchPoke(poke.id);
      this._spriteUrl = data.sprites?.other?.['official-artwork']?.front_default
                     || data.sprites?.other?.home?.front_default
                     || data.sprites?.front_default
                     || poke.spriteUrl;
    } catch {
      this._spriteUrl = poke.spriteUrl;
    }
    hideLoading();

    // Boss screen intro
    showScreen('boss');
    BossEngine._isRocket = false;
    const bgEl  = document.querySelector('#screen-boss .battle-bg');
    const imgEl = document.querySelector('#screen-boss .battle-bg-img');
    if (bgEl && imgEl) {
      bgEl.classList.add('boss-intro-mode');
      bgEl.style.background = GYM_FALLBACKS[5]; // Sabrina purple
      imgEl.style.opacity   = '0';
      imgEl.onload  = () => { imgEl.style.opacity = '1'; bgEl.style.background = ''; };
      imgEl.onerror = () => { imgEl.style.opacity = '0'; };
      imgEl.src = 'assets/bg_5_boss.png';
    }
    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';
    document.getElementById('boss-party-bar').innerHTML       = '';

    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (trainerImg) trainerImg.src = 'assets/sabrina.png';
    document.getElementById('dialogue-name').textContent = 'Sabrina';
    document.getElementById('dialogue-text').textContent = '';

    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) startBtn.style.display = 'none';
    document.getElementById('btn-dialogue-next').style.display = 'none';

    const name  = GameState.trainerName || 'Trainer';
    const intro = SABRINA_INTROS[Math.floor(Math.random() * SABRINA_INTROS.length)]
      .replace('{name}', name);
    typeBossIntro(intro, 26, () => {
      if (startBtn) { startBtn.style.display = ''; startBtn.textContent = `Save ${this._pokeName}! 🔮`; }
    });
  },

  startGame() {
    this._isActive = false;
    ActiveEngine.clear();
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    document.getElementById('trainer-intro').style.display = 'none';
    this._showPuzzle();
  },

  _showPuzzle() {
    const G = this._gridSize;

    // Pick missing slots randomly
    const allSlots = [];
    for (let r = 0; r < G; r++) for (let c = 0; c < G; c++) allSlots.push({ row: r, col: c });
    this._missingSlots = shuffle([...allSlots]).slice(0, this._missingCount);
    // Tray = shuffled copy of missing slots (same pieces, scrambled order)
    this._trayPieces   = shuffle([...this._missingSlots]);
    this._placed       = 0;
    this._selectedTray = null;

    // Build challenge screen
    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = 'assets/sabrina.png'; img.style.display = ''; }
    document.getElementById('challenge-badge').textContent   = `🔮 Sabrina's Jigsaw — Save ${this._pokeName}!`;
    document.getElementById('challenge-intro').textContent   = `Restore the scattered pieces of ${this._pokeName}.`;
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';
    document.getElementById('challenge-answer-btns').innerHTML      = '';
    document.getElementById('challenge-question').style.display     = 'none';
    const _jwd = document.getElementById('jessie-word-display');
    if (_jwd) { _jwd.style.display = 'none'; _jwd.innerHTML = ''; _jwd.className = 'jessie-word-display'; }

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.remove(...CHALLENGE_CLASSES);
    document.getElementById('screen-challenge').classList.add('sabrina-active');
    SoundEngine.playBGM('pallet_town_theme.mp3');

    // ── Phase 1: show complete Pokémon for 3s before scrambling ───────────
    const cv = document.getElementById('challenge-coin-visual');
    cv.style.display = 'block';
    cv.className     = 'sabrina-puzzle-wrap';
    cv.innerHTML = `
      <div class="sabrina-phase1" id="sabrina-phase1">
        <img src="${this._spriteUrl}" class="sabrina-preview-sprite" alt="${this._pokeName}" />
        <div class="sabrina-phase1-text">Sabrina's psychic power shatters the image!</div>
      </div>`;

    MiniGameSession.later(() => this._buildGrid(), 3000);
  },

  _buildGrid() {
    const G        = this._gridSize;
    const PIECE    = this._pieceSize=Math.floor(Math.min(innerWidth>=850&&innerHeight<=850?360:440,innerWidth-80)/G);  // px per piece — 4×76 = 304px grid fits on 360px screen
    const SPRITE   = G * PIECE;
    const url      = this._spriteUrl;
    const missing  = new Set(this._missingSlots.map(s => `${s.row},${s.col}`));

    const cv = document.getElementById('challenge-coin-visual');
    cv.innerHTML = '';cv.classList.add('sabrina-workspace');

    // ── Grid ────────────────────────────────────────────────────────────────
    const gridEl = document.createElement('div');
    gridEl.className = 'sabrina-grid';
    gridEl.style.gridTemplateColumns = `repeat(${G}, ${PIECE}px)`;

    for (let r = 0; r < G; r++) {
      for (let c = 0; c < G; c++) {
        const cell = document.createElement('div');
        const key  = `${r},${c}`;
        if (missing.has(key)) {
          cell.className       = 'sabrina-slot sabrina-slot-empty';
          cell.dataset.row     = r;
          cell.dataset.col     = c;cell.textContent=`${r+1}:${c+1}`;
          cell.style.width     = PIECE + 'px';
          cell.style.height    = PIECE + 'px';
          cell.addEventListener('click', () => this._slotClicked(cell, r, c));
        } else {
          cell.className = 'sabrina-piece sabrina-piece-locked';
          cell.style.cssText = `
            width:${PIECE}px; height:${PIECE}px;
            background-image:url('${url}');
            background-size:${SPRITE}px ${SPRITE}px;
            background-position:-${c*PIECE}px -${r*PIECE}px;`;
        }
        gridEl.appendChild(cell);
      }
    }
    cv.appendChild(gridEl);
    const reference=document.createElement('button');reference.className='btn-pixel btn-secondary';reference.textContent='Show reference';const preview=document.createElement('img');preview.src=url;preview.alt=this._pokeName;preview.className='sabrina-reference';preview.hidden=true;reference.onclick=()=>{preview.hidden=!preview.hidden;reference.textContent=preview.hidden?'Show reference':'Hide reference';};cv.append(reference,preview);

    // ── Tray ────────────────────────────────────────────────────────────────
    const trayEl = document.createElement('div');
    trayEl.className = 'sabrina-tray';
    trayEl.id        = 'sabrina-tray';
    this._trayPieces.forEach((pos, idx) => {
      const piece = document.createElement('div');
      piece.className = 'sabrina-piece sabrina-tray-piece';
      piece.dataset.trayIdx = idx;
      piece.dataset.row     = pos.row;
      piece.dataset.col     = pos.col;
      piece.style.cssText = `
        width:${PIECE}px; height:${PIECE}px;
        background-image:url('${url}');
        background-size:${SPRITE}px ${SPRITE}px;
        background-position:-${pos.col*PIECE}px -${pos.row*PIECE}px;`;
      piece.addEventListener('click', () => this._trayClicked(piece, idx));
      trayEl.appendChild(piece);
    });
    cv.appendChild(trayEl);

    // Animate grid entrance
    cv.classList.add('sabrina-grid-entrance');
    MiniGameSession.later(() => cv.classList.remove('sabrina-grid-entrance'), 600);
  },

  _trayClicked(pieceEl, trayIdx) {
    // Deselect if already selected
    if (this._selectedTray === trayIdx) {
      pieceEl.classList.remove('sabrina-piece-selected');
      this._selectedTray = null;
      return;
    }
    // Deselect any previously selected piece
    document.querySelectorAll('.sabrina-piece-selected')
      .forEach(el => el.classList.remove('sabrina-piece-selected'));
    pieceEl.classList.add('sabrina-piece-selected');
    this._selectedTray = trayIdx;
  },

  _slotClicked(slotEl, row, col) {
    if (this._selectedTray === null) return; // nothing selected

    const trayPiece = this._trayPieces[this._selectedTray];
    const isCorrect = trayPiece.row === row && trayPiece.col === col;

    if (isCorrect) {
      // ── Correct placement ────────────────────────────────────────────────
      const G      = this._gridSize;
      const PIECE  = this._pieceSize;
      const SPRITE = G * PIECE;
      const url    = this._spriteUrl;

      // Replace slot with filled piece
      slotEl.textContent = '';
      slotEl.className   = 'sabrina-piece sabrina-piece-placed';
      slotEl.style.cssText = `
        width:${PIECE}px; height:${PIECE}px;
        background-image:url('${url}');
        background-size:${SPRITE}px ${SPRITE}px;
        background-position:-${col*PIECE}px -${row*PIECE}px;`;
      slotEl.removeEventListener('click', slotEl._clickHandler);

      // Remove piece from tray
      const trayPieceEl = document.querySelector(`.sabrina-tray-piece[data-tray-idx="${this._selectedTray}"]`);
      if (trayPieceEl) trayPieceEl.remove();
      this._selectedTray = null;
      this._placed++;

      // Flash the slot green briefly
      slotEl.classList.add('sabrina-piece-correct-flash');
      MiniGameSession.later(() => slotEl.classList.remove('sabrina-piece-correct-flash'), 600);

      if (this._placed >= this._missingCount) {
        this._complete();
      }
    } else {
      // ── Wrong placement — shake and reject ──────────────────────────────
      slotEl.classList.add('sabrina-slot-wrong');
      MiniGameSession.later(() => slotEl.classList.remove('sabrina-slot-wrong'), 500);
      // Deselect piece
      document.querySelectorAll('.sabrina-piece-selected')
        .forEach(el => el.classList.remove('sabrina-piece-selected'));
      this._selectedTray = null;
    }
  },

  _complete() {
    const cv = document.getElementById('challenge-coin-visual');

    // Flash whole grid white
    cv.classList.add('sabrina-complete-flash');
    MiniGameSession.later(() => {
      cv.classList.remove('sabrina-complete-flash');

      // Replace grid with full Pokémon reveal + sparkles
      cv.innerHTML = `
        <div class="sabrina-reveal" id="sabrina-reveal">
          <img src="${this._spriteUrl}" class="sabrina-reveal-sprite sabrina-sparkle" alt="${this._pokeName}" />
          <div class="sabrina-reveal-name">${this._pokeName} is free! ✨</div>
        </div>`;

      SoundEngine.playFanfare();

      MiniGameSession.later(() => this._finish(true), 2200);
    }, 400);
  },

  _finish(won) {
    this._answered = false;
    document.getElementById('screen-challenge').classList.remove('sabrina-active');
    const cv = document.getElementById('challenge-coin-visual');
    cv.innerHTML = '';
    cv.className = 'challenge-coin-visual';

    if (won) {
      const poke     = GameState.party[this._pokemonIdx];
      const goldReward = 30 + (GameState.bossesDefeated || 0) * 8;
      GameState.gold   = (GameState.gold || 0) + goldReward;

      // XP: +2 levels for the rescued Pokémon
      if (poke) {
        poke.level  += 2;
        poke.maxHp  += 16;
        poke.hp      = Math.min(poke.maxHp, poke.hp + 16);
      }
      saveGame();
      showModal(
        '🔮 Puzzle Complete!',
        `${this._pokeName} was rescued!\n${this._pokeName} gained 2 levels!\n+${goldReward}💰 gold.\n\n"Impressive. Perhaps your mind is worth something after all." — Sabrina`,
        () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); }
      );
    } else {
      MapEngine.completeNode(GameState.currentNodeIndex);
      MapEngine.show();
    }
  },
};

// ─── JIGGLYPUFF SONG ENGINE ──────────────────────────────────────────────────
// Web Audio API tone synthesis — no audio files needed.
// Notes from C major pentatonic. Triangle oscillator ≈ soft singing tone.


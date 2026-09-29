function _prycePlacements(count, fieldW, fieldH, size, pad = 8) {
  const placed = [];
  const minGap0 = size * 0.9;
  for (let i = 0; i < count; i++) {
    let pos = null;
    // Try progressively smaller spacing so dense fields still fit
    for (let relax = 0; relax < 4 && !pos; relax++) {
      const minGap = minGap0 * (1 - relax * 0.18);
      for (let attempt = 0; attempt < 60; attempt++) {
        const x = pad + Math.random() * (fieldW - size - pad * 2);
        const y = pad + Math.random() * (fieldH - size - pad * 2);
        const ok = placed.every(p => {
          const dx = p.x - x, dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) >= minGap;
        });
        if (ok) { pos = { x, y }; break; }
      }
    }
    // Guaranteed fallback — clean grid cell
    if (!pos) {
      const cols = Math.max(1, Math.floor((fieldW - pad * 2) / (size + 6)));
      const col  = i % cols;
      const row  = Math.floor(i / cols);
      pos = {
        x: pad + col * (size + 6),
        y: pad + row * (size + 6),
      };
      // Keep within the field vertically
      pos.y = Math.min(pos.y, fieldH - size - pad);
    }
    placed.push(pos);
  }
  return placed;
}

const PRYCE_SHAPES = [
  { key:'circle',   label:'Circles',    emoji:'⚪', color:'#7ecbff' },
  { key:'square',   label:'Squares',    emoji:'🟦', color:'#6ea8ff' },
  { key:'triangle', label:'Triangles',  emoji:'🔺', color:'#9d8cff' },
  { key:'rectangle',label:'Rectangles', emoji:'▬',  color:'#5ce0d0' },
  { key:'hexagon',  label:'Hexagons',   emoji:'⬡',  color:'#8ad9a0' },
  { key:'diamond',  label:'Diamonds',   emoji:'🔷', color:'#b0e0ff' },
  { key:'star',     label:'Stars',      emoji:'⭐', color:'#ffe08a' },
];

// Return the SVG inner markup for a shape of given type, sized to `s` px.
function _pryceShapeSVG(type, s, color) {
  const c = s / 2;
  const stroke = 'rgba(255,255,255,.85)';
  const common = `fill="${color}" stroke="${stroke}" stroke-width="2" opacity="0.9"`;
  switch (type) {
    case 'circle':
      return `<circle cx="${c}" cy="${c}" r="${c - 3}" ${common}/>`;
    case 'square':
      return `<rect x="3" y="3" width="${s - 6}" height="${s - 6}" rx="3" ${common}/>`;
    case 'rectangle':
      return `<rect x="2" y="${s * 0.25}" width="${s - 4}" height="${s * 0.5}" rx="3" ${common}/>`;
    case 'triangle':
      return `<polygon points="${c},4 ${s - 4},${s - 4} 4,${s - 4}" ${common}/>`;
    case 'diamond':
      return `<polygon points="${c},3 ${s - 3},${c} ${c},${s - 3} 3,${c}" ${common}/>`;
    case 'hexagon': {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 180 * (60 * i - 30);
        pts.push(`${(c + (c - 4) * Math.cos(a)).toFixed(1)},${(c + (c - 4) * Math.sin(a)).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(' ')}" ${common}/>`;
    }
    case 'star': {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? c - 3 : (c - 3) * 0.45;
        const a = Math.PI / 180 * (36 * i - 90);
        pts.push(`${(c + r * Math.cos(a)).toFixed(1)},${(c + r * Math.sin(a)).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(' ')}" ${common}/>`;
    }
    default:
      return `<circle cx="${c}" cy="${c}" r="${c - 3}" ${common}/>`;
  }
}

const PryceEngine = {
  _isActive:false, _node:null, _hits:0, _totalTypes:0,
  _shapes:[], _counts:{}, _order:[], _typeIdx:0, _revealPoke:null,

  async start(node) {
    this._node = node; this._isActive = true; this._hits = 0; this._typeIdx = 0;
    ActiveEngine.set(this);
    skillTimerBegin('pryce');

    showLoading();
    // Pick the hidden Pokémon "frozen inside" from the famous list
    const pk = MISTY_POKEMON[Math.floor(Math.random() * MISTY_POKEMON.length)];
    const d  = await fetchPoke(pk.id).catch(() => null);
    this._revealPoke = {
      name: pk.name,
      sprite: d ? getSpriteUrl(d) :
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pk.id}.png`,
    };
    hideLoading();

    showBossIntro({
      gymIndex: 6, portrait: 'pryce.png',
      name: 'Pryce', btnLabel: 'Restore the Sculpture ❄️',
      introText: "Disaster! My ice sculptures melted overnight and collapsed into a jumble of frozen shapes. Help me sort the shards — count how many of each shape there are, and we shall see what was hidden within.",
    });
  },

  startGame() {
    this._isActive = false; ActiveEngine.clear();
    document.getElementById('trainer-intro').style.display = 'none';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');

    // Build the shape set for this tier
    const tier = Math.min(getSkillTier('pryce'), 3);
    const typeCount = tier === 1 ? (2 + Math.floor(Math.random() * 2))     // 2-3 types
                    : tier === 2 ? (3 + Math.floor(Math.random() * 2))     // 3-4
                    :              (4 + Math.floor(Math.random() * 2));     // 4-5
    const maxPer    = tier === 1 ? 4 : tier === 2 ? 6 : 8;

    // Tier 1 uses only the easy/distinct shapes
    const palette = tier === 1
      ? PRYCE_SHAPES.filter(s => ['circle','square','triangle'].includes(s.key))
      : PRYCE_SHAPES;
    const chosen = shuffle([...palette]).slice(0, Math.min(typeCount, palette.length));

    this._shapes = [];
    this._counts = {};
    this._order  = chosen.map(s => s.key);
    chosen.forEach(sh => {
      const n = 1 + Math.floor(Math.random() * maxPer);
      this._counts[sh.key] = n;
      for (let i = 0; i < n; i++) this._shapes.push({ type: sh.key, color: sh.color, id: `${sh.key}_${i}`, tallied: false });
    });
    this._totalTypes = chosen.length;
    this._typeIdx    = 0;

    this._renderField();
  },

  _renderField() {
    if (this._typeIdx >= this._order.length) { this._reveal(); return; }
    const tier = Math.min(getSkillTier('pryce'), 3);

    const cv = setupChallengeScreen({
      portrait:'pryce.png', badge:'❄️ Ice Sculpture Restoration',
      intro:`Shape ${this._typeIdx + 1}/${this._totalTypes} — clear them all!`,
      wrapClass:'pryce-wrap', screenClass:'pryce-active',
    });

    const curType = this._order[this._typeIdx];
    const curMeta = PRYCE_SHAPES.find(s => s.key === curType);

    // Prompt
    const prompt = document.createElement('div');
    prompt.className = 'pryce-prompt';
    prompt.innerHTML = tier === 1
      ? `Tap every <b>${curMeta.label.slice(0, -1).toLowerCase()}</b> ${curMeta.emoji} you can find!`
      : `How many <b>${curMeta.label.toLowerCase()}</b> ${curMeta.emoji} are there?`;
    cv.appendChild(prompt);

    // The ice field
    const FIELD_W = Math.min(620,innerWidth-100), FIELD_H = 330, SIZE = 48;
    const field = document.createElement('div');
    field.className = 'pryce-field';
    field.id = 'pryce-field';
    field.style.width = FIELD_W + 'px';
    field.style.height = FIELD_H + 'px';
    cv.appendChild(field);

    // Place ALL remaining shapes (current type + not-yet-cleared types).
    // Use proper circle-packing placement so shapes never stack and hide each
    // other (the generic _bugPlacements only checks one axis and can overlap).
    const remaining = this._shapes.filter(s => !this._order.slice(0, this._typeIdx).includes(s.type));
    const positions = _prycePlacements(remaining.length, FIELD_W, FIELD_H, SIZE);
    // Draw active (current-type) shapes LAST so they sit on top and are clearly
    // countable, never buried under dimmed shapes of other types.
    const ordered = remaining
      .map((sh, i) => ({ sh, pos: positions[i] }))
      .sort((a, b) => (a.sh.type === curType ? 1 : 0) - (b.sh.type === curType ? 1 : 0));
    ordered.forEach(({ sh, pos }) => {
      const el = document.createElement('div');
      el.className = 'pryce-shape' + (sh.type === curType ? ' pryce-shape-active' : ' pryce-shape-dim');
      el.style.left = pos.x + 'px';
      el.style.top  = pos.y + 'px';
      el.style.width = el.style.height = SIZE + 'px';
      el.dataset.type = sh.type;
      el.dataset.id   = sh.id;
      el.innerHTML = `<svg viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">${_pryceShapeSVG(sh.type, SIZE, sh.color)}</svg>`;
      if(tier>1){el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label',sh.type+' shard, tap to mark counted');el.onclick=()=>el.classList.toggle('mg-counted');el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}};}
      field.appendChild(el);
    });

    if (tier === 1) this._tallyMode(cv, field, curType, curMeta);
    else            this._choiceMode(cv, field, curType, curMeta);
  },

  // Tier 1 — tap each shape of the current type; they light up and count.
  _tallyMode(cv, field, curType, curMeta) {
    let tapped = 0;
    const target = this._counts[curType];

    const counter = document.createElement('div');
    counter.className = 'pryce-counter';
    counter.id = 'pryce-counter';
    counter.textContent = `${curMeta.emoji} 0`;
    cv.appendChild(counter);

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-pixel btn-primary pryce-confirm';
    confirmBtn.textContent = 'All found! ▶';
    confirmBtn.disabled = true;

    field.querySelectorAll('.pryce-shape-active').forEach(el => {
      el.addEventListener('click', () => {
        if (el.classList.contains('pryce-tapped')) return;
        el.classList.add('pryce-tapped');
        tapped++;
        counter.textContent = `${curMeta.emoji} ${tapped}`;
        if (tapped >= target) confirmBtn.disabled = false;
      });
    });

    confirmBtn.addEventListener('click', () => {
      const correct = tapped === target;
      this._resolveType(correct, target, tapped, field, curType);
    });
    cv.appendChild(confirmBtn);
  },

  // Tier 2-3 — highlight the type, choose the count from buttons.
  _choiceMode(cv, field, curType, curMeta) {
    const target = this._counts[curType];

    // Glow-pulse the active shapes so they're countable
    field.querySelectorAll('.pryce-shape-active').forEach(el => el.classList.add('pryce-glow'));

    const tier = Math.min(getSkillTier('pryce'), 3);
    const maxOpt = tier === 2 ? 8 : 10;
    // Build number options around the true count
    // A bounded window also works at counts 1 and 2; random ±2 could
    // never produce five distinct valid answers there and locked the game.
    const count = Math.min(5, maxOpt);
    const first = Math.max(1, Math.min(target - 2, maxOpt - count + 1));
    const optArr = shuffle(Array.from({length: count}, (_, i) => first + i));

    const row = document.createElement('div');
    row.className = 'pryce-num-row';
    optArr.forEach(n => {
      const btn = document.createElement('button');
      btn.className = 'pryce-num-btn';
      btn.textContent = n;
      btn.addEventListener('click', () => {
        row.querySelectorAll('.pryce-num-btn').forEach(b => b.disabled = true);
        const correct = n === target;
        btn.classList.add(correct ? 'pryce-num-correct' : 'pryce-num-wrong');
        if (!correct) {
          row.querySelectorAll('.pryce-num-btn').forEach(b => {
            if (+b.textContent === target) b.classList.add('pryce-num-correct');
          });
        }
        MiniGameSession.later(() => this._resolveType(correct, target, n, field, curType), correct ? 500 : 1300);
      });
      row.appendChild(btn);
    });
    cv.appendChild(row);
  },

  // Shatter the cleared type, advance. Correct first-try counts toward score.
  _resolveType(correct, target, picked, field, curType) {
    if (correct) this._hits++;
    // Shatter animation on the active shapes
    field.querySelectorAll('.pryce-shape-active').forEach((el, i) => {
      MiniGameSession.later(() => el.classList.add('pryce-shatter'), i * 40);
    });
    if (correct) SoundEngine.playCorrect();
    const feedback=document.createElement('p');feedback.className='mg-feedback';
    feedback.textContent=correct ? `Correct — ${target} ${curType} shards.` : `You counted ${picked}; there were ${target} ${curType} shards (${Math.abs(target-picked)} ${picked<target?'more':'fewer'}).`;
    field.after(feedback);
    MiniGameSession.next(() => {this._typeIdx++;this._renderField();},'Next ice layer');
  },

  // All shapes cleared — reveal the Pokémon frozen inside.
  _reveal() {
    const cv = setupChallengeScreen({
      portrait:'pryce.png', badge:'❄️ The Sculpture Revealed!',
      intro:'The ice clears...', wrapClass:'pryce-wrap', screenClass:'pryce-active',
    });

    const block = document.createElement('div');
    block.className = 'pryce-reveal';
    block.innerHTML = `
      <div class="pryce-ice-block">
        <img src="${this._revealPoke.sprite}" alt="${this._revealPoke.name}"
             class="pryce-reveal-sprite pixel-sprite"
             onerror="this.onerror=null;this.style.display='none'"/>
        <div class="pryce-ice-shine"></div>
      </div>
      <div class="pryce-reveal-name">It was a ${this._revealPoke.name}!</div>`;
    cv.appendChild(block);
    SoundEngine.playCorrect();

    const btn = document.createElement('button');
    btn.className = 'btn-pixel btn-primary pryce-confirm';
    btn.textContent = 'Wonderful! ▶';
    btn.addEventListener('click', () => this._finish());
    cv.appendChild(btn);
  },

  _finish() {
    const total = this._totalTypes || 1;
    const won   = this._hits >= Math.ceil(total * 0.7);   // 70%+ correct = success
    const perfect = this._hits >= total;
    const tier  = Math.min(getSkillTier('pryce'), 3);
    const baseGold = { 1: 8, 2: 12, 3: 16 }[tier];
    // Reward scales with accuracy; mistakes reduce gold
    const gold = Math.round(baseGold * (this._hits / total));

    completeChallenge({
      screenClass: 'pryce-active', won,
      goldReward: Math.max(gold, won ? Math.floor(baseGold / 2) : 2),
      score: this._hits, maxScore: total, gameKey: 'pryce',
      tokenLabel: perfect ? 'Frozen First Strike — opponent skips its first move!' : null,
      effects: perfect ? { freezeFirst: true } : {},
      modalTitle: perfect ? '❄️ Flawless Restoration!' : won ? '❄️ Sculpture Restored!' : '❄️ A Bit Melted...',
      modalBody: `${this._hits}/${total} shapes counted right\n+${Math.max(gold, won ? Math.floor(baseGold/2) : 2)}💰` +
        (perfect ? '\n\n⭐ Frozen First Strike — the next opponent skips its first move!' : ''),
    });
  },
};

// ─── CLAIR ENGINE — "Dragon Tamer" (Type-read incoming dragon charge) ────────
// A dragon charges from one of 3 sides. Player must pick the type-effective move.
// 5 rounds, 3 choices (tier 1 shows type name, tier 2+ shows only colour flash).

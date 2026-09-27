async function showPokedexCard(data, isNewDex = false, cachedSpecies = null) {
  const overlay  = document.getElementById('pdx-modal-overlay');
  const spriteEl = document.getElementById('pdx-sprite');
  const numEl    = document.getElementById('pdx-number');
  const nameEl   = document.getElementById('pdx-name');
  const badgesEl = document.getElementById('pdx-badges');
  const measEl   = document.getElementById('pdx-measures');
  const flavEl   = document.getElementById('pdx-flavour');
  const newBanner= document.getElementById('pdx-new-banner');
  const closeBtn = document.getElementById('pdx-close-btn');

  // ── Sprite ──────────────────────────────────────────────────────────────
  spriteEl.src = data.sprites?.other?.['official-artwork']?.front_default
              || data.sprites?.front_default
              || getSpriteUrl(data);
  spriteEl.onerror = () => { spriteEl.src = getSpriteUrl(data); };

  // ── Number + Name ────────────────────────────────────────────────────────
  numEl.textContent  = `#${String(data.id).padStart(3, '0')}`;
  nameEl.textContent = capitalize(data.name);

  // ── Type badges ──────────────────────────────────────────────────────────
  badgesEl.innerHTML = (data.types || [])
    .map(t => `<span class="hud-type-badge type-${t.type.name}">${t.type.name}</span>`)
    .join('');

  // ── Height + weight ──────────────────────────────────────────────────────
  const hm  = ((data.height || 0) / 10).toFixed(1);
  const wkg = ((data.weight || 0) / 10).toFixed(1);
  measEl.textContent = `📏 ${hm} m  ·  ⚖ ${wkg} kg`;

  // ── Flavour text ─────────────────────────────────────────────────────────
  flavEl.textContent = '…';
  let flavour  = '';
  let category = '';
  try {
    let species = cachedSpecies;
    if (!species && data.species?.url) {
      species = await fetchSpecies(data.id);
    }
    if (species?.flavor_text_entries) {
      const entry = species.flavor_text_entries.find(e => e.language?.name === 'en');
      if (entry) flavour = entry.flavor_text.replace(/[\n\f\r]/g, ' ').replace(/\s+/g, ' ').trim();
    }
    // Extract category (genus) for voice
    if (species?.genera) {
      const gen = species.genera.find(g => g.language?.name === 'en');
      if (gen) category = gen.genus;
    }
  } catch (_) {}

  const pokeName = capitalize(data.name);

  // ── Typewriter + voice start simultaneously ───────────────────────────────
  flavEl.textContent = '';
  let fi = 0;
  const flavInterval = setInterval(() => {
    if (fi >= flavour.length) { clearInterval(flavInterval); return; }
    flavEl.textContent += flavour[fi++];
  }, 28);

  // Pokédex voice — name, category, flavour text
  SoundEngine.speakPokedex(pokeName, category, flavour);

  // ── Speaker replay button ─────────────────────────────────────────────────
  const speakerBtn = document.getElementById('pdx-speak-btn');
  if (speakerBtn) {
    speakerBtn.style.display = '';
    speakerBtn.onclick = () => SoundEngine.speakPokedex(pokeName, category, flavour);
  }

  // ── New-entry banner ─────────────────────────────────────────────────────
  newBanner.style.display = isNewDex ? '' : 'none';

  // ── Show modal ───────────────────────────────────────────────────────────
  overlay.style.display = 'flex';
  overlay.classList.remove('pdx-modal-in');
  void overlay.offsetWidth;
  overlay.classList.add('pdx-modal-in');

  // ── Promise — resolves when close is pressed ─────────────────────────────
  return new Promise(resolve => {
    const handler = () => {
      clearInterval(flavInterval);
      SoundEngine.stopSpeech();          // cancel voice when card closes
      closeBtn.removeEventListener('click', handler);
      overlay.classList.remove('pdx-modal-in');
      setTimeout(() => { overlay.style.display = 'none'; resolve(); }, 200);
    };
    closeBtn.addEventListener('click', handler);
  });
}

const PokedexEngine = {
  async show() {
    showLoading();
    const dex     = loadPokedex();
    const entries = Object.values(dex).sort((a, b) => a.id - b.id);

    const grid = document.getElementById('pokedex-grid');
    grid.innerHTML = '';

    document.getElementById('pokedex-count').textContent =
      `${entries.filter(e => e.caught).length} caught / ${entries.length} seen`;

    entries.forEach(e => {
      const div = document.createElement('div');
      const caught = !!e.caught;
      div.className = 'dex-entry' + (caught ? ' dex-caught' : ' dex-seen');
      div.title     = caught ? `${e.name} — tap to view` : 'Seen — not yet caught';
      div.innerHTML = `
        <img src="${e.spriteUrl || ''}" alt="${e.name}"
             onerror="this.src='assets/sprites/${e.id}.png'"
             class="dex-sprite${caught ? '' : ' silhouette'}" />
        <div class="dex-text">
          <div class="dex-id">#${String(e.id).padStart(3, '0')}</div>
          <div class="dex-name${caught ? '' : ' dex-unknown'}">${caught ? e.name : '???'}</div>
        </div>
        ${caught ? '<div class="dex-ball">🔵</div>' : ''}
      `;

      if (caught) {
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => this._openEntry(e));
      }

      grid.appendChild(div);
    });

    if (entries.length === 0) {
      grid.innerHTML = '<div class="dex-empty">No Pokémon discovered yet.<br>Battle and catch to fill your Pokédex!</div>';
    }

    hideLoading();
    showScreen('pokedex');
  },

  async _openEntry(entry) {
    showLoading();
    try {
      const data = await fetchPoke(entry.id);
      hideLoading();
      // isNewDex = false — this is a browse, not a new catch
      await showPokedexCard(data, false, null);
    } catch (e) {
      hideLoading();
      showModal('Oops', 'Could not load Pokémon data. Check your connection.', () => {});
    }
  },
};

// ─── TRAINING ENGINE ─────────────────────────────────────────────────────────


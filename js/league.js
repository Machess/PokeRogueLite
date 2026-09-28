const KANTO_TYPE_MAP = {
  1:'grass',   2:'grass',   3:'grass',
  4:'fire',    5:'fire',    6:'fire',
  7:'water',   8:'water',   9:'water',
  10:'bug',    11:'bug',    12:'bug',
  13:'bug',    14:'bug',    15:'bug',
  16:'flying', 17:'flying', 18:'flying',
  19:'normal', 20:'normal',
  21:'flying', 22:'flying',
  23:'poison', 24:'poison',
  25:'electric',26:'electric',
  27:'ground', 28:'ground',
  29:'poison', 30:'poison', 31:'poison',
  32:'poison', 33:'poison', 34:'poison',
  35:'normal', 36:'normal',
  37:'fire',   38:'fire',
  39:'normal', 40:'normal',
  41:'poison', 42:'poison',
  43:'grass',  44:'grass',  45:'grass',
  46:'bug',    47:'bug',
  48:'bug',    49:'bug',
  50:'ground', 51:'ground',
  52:'normal', 53:'normal',
  54:'water',  55:'water',
  56:'fighting',57:'fighting',
  58:'fire',   59:'fire',
  60:'water',  61:'water',  62:'water',
  63:'psychic',64:'psychic',65:'psychic',
  66:'fighting',67:'fighting',68:'fighting',
  69:'grass',  70:'grass',  71:'grass',
  72:'water',  73:'water',
  74:'rock',   75:'rock',   76:'rock',
  77:'fire',   78:'fire',
  79:'water',  80:'water',
  81:'electric',82:'electric',
  83:'normal',
  84:'flying', 85:'flying',
  86:'water',  87:'ice',
  88:'poison', 89:'poison',
  90:'water',  91:'ice',
  92:'ghost',  93:'ghost',  94:'ghost',
  95:'rock',
  96:'psychic',97:'psychic',
  98:'water',  99:'water',
  100:'electric',101:'electric',
  102:'grass', 103:'grass',
  104:'ground',105:'ground',
  106:'fighting',107:'fighting',
  108:'normal',
  109:'poison',110:'poison',
  111:'ground',112:'ground',
  113:'normal',
  114:'grass',
  115:'normal',
  116:'water', 117:'water',
  118:'water', 119:'water',
  120:'water', 121:'water',
  122:'psychic',
  123:'bug',
  124:'ice',
  125:'electric',
  126:'fire',
  127:'bug',
  128:'normal',
  129:'water', 130:'water',
  131:'ice',
  132:'normal',
  133:'normal',134:'water',135:'electric',136:'fire',
  137:'normal',
  138:'rock',  139:'rock',
  140:'rock',  141:'rock',
  142:'flying',
  143:'normal',
  144:'ice',   145:'electric',146:'fire',
  147:'dragon',148:'dragon',149:'dragon',
  150:'psychic',151:'psychic',
  // Johto (#152–251)
  152:'grass',  153:'grass',  154:'grass',
  155:'fire',   156:'fire',   157:'fire',
  158:'water',  159:'water',  160:'water',
  161:'normal', 162:'normal',
  163:'flying', 164:'flying',
  165:'bug',    166:'bug',
  167:'bug',    168:'bug',
  169:'flying',
  170:'water',  171:'water',
  172:'electric',
  173:'normal', 174:'normal',
  175:'normal', 176:'flying',
  177:'psychic',178:'psychic',
  179:'electric',180:'electric',181:'electric',
  182:'grass',
  183:'water',  184:'water',
  185:'rock',
  186:'water',
  187:'grass',  188:'grass',  189:'flying',
  190:'normal',
  191:'grass',  192:'grass',
  193:'bug',
  194:'water',  195:'water',
  196:'psychic',197:'dark',
  198:'flying',
  199:'water',
  200:'ghost',
  201:'psychic',
  202:'psychic',
  203:'normal',
  204:'bug',    205:'bug',
  206:'normal',
  207:'ground',
  208:'steel',
  209:'normal', 210:'normal',
  211:'water',
  212:'bug',
  213:'bug',
  214:'bug',
  215:'ice',
  216:'normal', 217:'normal',
  218:'fire',   219:'fire',
  220:'ice',    221:'ice',
  222:'water',
  223:'water',  224:'water',
  225:'ice',
  226:'water',
  227:'flying',
  228:'fire',   229:'fire',
  230:'water',
  231:'ground', 232:'ground',
  233:'normal',
  234:'normal',
  235:'normal',
  236:'fighting',237:'fighting',
  238:'ice',
  239:'electric',
  240:'fire',
  241:'normal',
  242:'normal',
  243:'electric',244:'fire',245:'water',
  246:'rock',   247:'rock',   248:'rock',
  249:'water',  250:'fire',
  251:'psychic',
};

// ─── LEAGUE ENGINE ────────────────────────────────────────────────────────────

// One-line challenge hints for each Elite Four member / Champion
const LEAGUE_HINTS = {
  'Lorelei': 'Her ice controls the field. Every move is a trap.',
  'Bruno':   'He trains without rest. His Pokémon hit like stone.',
  'Agatha':  'She fights with ghosts older than the League itself.',
  'Lance':   'Dragons obey him. They will not obey you.',
  'Blue':    'He has trained for this moment his entire life. So have you.',
};

function generateLeagueMap() {
  // Fixed linear map: heal → E4×4 (with heal/train choices between) → heal → Champion
  let idx = 0;
  const makeNode = (row, type, unlocked = false) => ({
    idx: idx++, row, type, unlocked, revealed: unlocked,
    done: false, bypassed: false, links: [],
    x: 0.5, y: 1 - row / 11, col: 0, lane: 'mid',
    leagueNode: true,
  });

  const heal0  = makeNode(0,  'heal',    true);  // mandatory rest
  const lor    = makeNode(1,  'boss',    false); lor.gymIdx = 8;  // Lorelei
  const mid1a  = makeNode(2,  'heal',    false);
  const mid1b  = makeNode(2,  'training',false);
  const bru    = makeNode(3,  'boss',    false); bru.gymIdx = 9;  // Bruno
  const mid2a  = makeNode(4,  'heal',    false);
  const mid2b  = makeNode(4,  'training',false);
  const aga    = makeNode(5,  'boss',    false); aga.gymIdx = 10; // Agatha
  const mid3a  = makeNode(6,  'heal',    false);
  const mid3b  = makeNode(6,  'training',false);
  const lan    = makeNode(7,  'boss',    false); lan.gymIdx = 11; // Lance
  const heal1  = makeNode(8,  'heal',    false);
  const blue   = makeNode(9,  'boss',    false); blue.gymIdx = 12; // Blue / Champion

  // Wire links
  heal0.links  = [lor.idx];
  lor.links    = [mid1a.idx, mid1b.idx];
  mid1a.links  = [bru.idx]; mid1b.links = [bru.idx];
  bru.links    = [mid2a.idx, mid2b.idx];
  mid2a.links  = [aga.idx];  mid2b.links = [aga.idx];
  aga.links    = [mid3a.idx, mid3b.idx];
  mid3a.links  = [lan.idx];  mid3b.links = [lan.idx];
  lan.links    = [heal1.idx];
  heal1.links  = [blue.idx];
  blue.links   = [];

  // Unlock first node
  lor.unlocked = false; // unlocked only after heal0 done
  const nodes = [heal0,lor,mid1a,mid1b,bru,mid2a,mid2b,aga,mid3a,mid3b,lan,heal1,blue];
  nodes._bossIndex = 8; // Lorelei = GYM_DATA[8]
  return nodes;
}

const LeagueEngine = {

  // ── After a non-final League boss win — corridor screen ───────────────────
  afterLeagueBoss(defeatedBoss) {
    // The map node is already completed by BossEngine before reaching here.
    // We just need to show the corridor, then MapEngine.show() resumes the League map.
    saveGame();

    // Find which GYM_DATA entry comes next on the League map
    const leagueOrder = ['Lorelei','Bruno','Agatha','Lance','Blue'];
    const defIdx      = leagueOrder.indexOf(defeatedBoss?.name ?? '');
    const nextName    = leagueOrder[defIdx + 1] ?? null;
    const nextGym     = nextName ? GYM_DATA.find(g => g.name === nextName) : null;
    const chamberNum  = defIdx + 1; // 1-based (Lorelei=1, Bruno=2, etc.)

    // Farewell from the defeated boss (from GYM_DATA)
    const defeatedGym = GYM_DATA.find(g => g.name === defeatedBoss?.name);
    // Strip surrounding quotes from farewell string
    const farewellRaw = defeatedGym?.farewell || '';
    const farewell    = farewellRaw.replace(/^["'"']|["'"']$/g, '');

    // Build corridor HTML
    const nextHint = nextName ? LEAGUE_HINTS[nextName] || '' : '';
    const nextHtml = nextGym ? `
      <div class="corridor-divider">━━━━━━━━━━━━━━</div>
      <div class="corridor-next-label">Next opponent</div>
      <div class="corridor-next-name">${nextGym.name}</div>
      <div class="corridor-next-title">${nextGym.title}</div>
      <div class="corridor-next-hint">${nextHint}</div>` : '';

    const panel = document.getElementById('league-corridor-panel');
    if (!panel) {
      // Fallback — no corridor screen in HTML, go straight to map
      MapEngine.show();
      return;
    }

    document.getElementById('corridor-chamber').textContent =
      `Indigo Plateau — Chamber ${chamberNum}`;
    document.getElementById('corridor-defeated').textContent =
      `${defeatedBoss?.name ?? 'Your opponent'} has fallen.`;
    document.getElementById('corridor-farewell').textContent = farewell;
    document.getElementById('corridor-next-wrap').innerHTML  = nextHtml;

    showScreen('league-corridor');

    document.getElementById('btn-corridor-continue').onclick = () => {
      MapEngine.show();
    };
  },

  // ── Envelope screen ────────────────────────────────────────────────────────
  showEnvelope(totalWins) {
    const name = GameState?.trainerName
      || loadProfiles().find(p => p.key === getActiveProfile())?.name
      || 'Trainer';
    const el = document.getElementById('league-envelope');
    if (!el) return;

    document.getElementById('env-letter-body').innerHTML =
      `<em>To: ${name}</em><br><br>` +
      `The Pokémon League Committee has observed your victories with great interest.<br><br>` +
      `You have defeated all eight Kanto Gym Leaders — not once, but ` +
      `<strong>${totalWins} times</strong>.<br><br>` +
      `You are hereby invited to compete in the ` +
      `<strong>Kanto Pokémon League Championship</strong>.<br><br>` +
      `Choose your finest Pokémon. The Elite Four await.<br><br>` +
      `<em>— The League Committee</em>`;

    // Show — override display directly so hidden class cannot interfere
    el.style.display = 'flex';
    el.classList.remove('hidden');
    el.classList.add('active');
    setTimeout(() => el.classList.add('envelope-open'), 300);

    const hide = () => {
      el.style.display = 'none';
      el.classList.add('hidden');
      el.classList.remove('active', 'envelope-open');
    };

    document.getElementById('btn-envelope-accept').onclick = () => {
      hide();
      showScreen('start');
      ProfileEngine._updateStartScreen();
    };
    document.getElementById('btn-envelope-later').onclick = () => {
      hide();
    };
  },

  // ── Party selection screen ─────────────────────────────────────────────────
  showPartySelect() {
    const dex      = loadPokedex();
    const entries  = Object.values(dex).filter(e => e.id || e.name);
    const MAX_PICK = 6;
    let   selected = new Set();

    // Pre-select current run party
    (GameState?.party || []).forEach(p => selected.add(String(p.id)));

    const screen = document.getElementById('screen-league-party');
    const grid   = document.getElementById('league-party-grid');
    const counter= document.getElementById('league-party-counter');
    const confirmBtn = document.getElementById('btn-league-confirm-party');

    const dexEntries = Object.entries(dex);

    const render = () => {
      grid.innerHTML = '';
      dexEntries.forEach(([id, entry]) => {
        if (!entry.name) return;
        const sel = selected.has(String(id));
        const card = document.createElement('div');
        card.className = 'league-poke-card' + (sel ? ' league-poke-selected' : '');
        card.innerHTML = `
          <img src="${entry.spriteUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}"
               alt="${entry.name}" class="league-poke-sprite pixel-sprite"
               onerror="this.src='assets/sprites/${id}.png'">
          <div class="league-poke-name">${entry.name}</div>
          <div class="league-poke-type type-${entry.type || 'normal'}">${entry.type || '?'}</div>
          ${sel ? '<div class="league-poke-check">✓</div>' : ''}`;
        card.addEventListener('click', () => {
          if (selected.has(String(id))) {
            selected.delete(String(id));
          } else {
            if (selected.size >= MAX_PICK) return;
            selected.add(String(id));
          }
          render();
        });
        grid.appendChild(card);
      });
      counter.textContent = `${selected.size} / ${MAX_PICK} chosen`;
      confirmBtn.disabled = selected.size < 1;
    };

    render();
    showScreen('league-party');

    confirmBtn.onclick = () => this.startLeague([...selected]);
  },

  // ── Start the League run ───────────────────────────────────────────────────
  async startLeague(selectedIds) {
    await AssetPreloader.ensure();
    showLoading();
    const dex   = loadPokedex();
    const wins  = (loadProfiles().find(p => p.key === getActiveProfile())?.totalWins || 3);
    const level = Math.min(35 + wins * 3, 50);
    let   dexDirty = false;

    const party = selectedIds.map(id => {
      const numId    = parseInt(id);
      const e        = dex[id] || {};
      const pokeLevel= e.maxLevel || level;

      // Type resolution — DUAL_TYPE_OVERRIDES → KANTO_TYPE_MAP → Pokédex → fallback
      // Fully offline, no network call needed
      const type = DUAL_TYPE_OVERRIDES[numId]
                || KANTO_TYPE_MAP[numId]
                || e.type
                || 'normal';

      // Backfill Pokédex so future runs don't need to resolve again
      if (!e.type && type !== 'normal') {
        if (!dex[id]) dex[id] = {};
        dex[id].type = type;
        dexDirty = true;
      }

      const poke = makePokemon(
        numId, pokeLevel,
        e.spriteUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${numId}.png`,
        e.name || `#${numId}`, type
      );
      const rawDeck = LEAGUE_DECKS[type] || LEAGUE_DECKS.normal;
      poke.deck = applyLeagueDeck(SpeciesCards.build(poke), pokeLevel, e.improvements || {}).map(CombatRules.normalize);
      return poke;
    });

    // Persist any type backfills
    if (dexDirty) savePokedex(dex);

    GameState = {
      ...GameState,
      party,
      activePokemonIndex: 0,
      isLeagueRun:  true,
      leagueStats:  {},
      map:          generateLeagueMap(),
      completedNodes: [],
      currentNodeIndex: null,
      bossesDefeated: 0,
      gold: 0,
      _lastRocketCheckAt: 0,
    };

    hideLoading();
    MapEngine.show();
  },

  // ── League victory screen ──────────────────────────────────────────────────
  showLeagueVictory() {
    const party   = GameState.party || [];
    const lStats  = GameState.leagueStats || {};
    const name    = GameState.trainerName || 'Trainer';

    // Update profile
    const profiles = loadProfiles();
    const profIdx  = profiles.findIndex(p => p.key === getActiveProfile());
    if (profIdx >= 0) {
      profiles[profIdx].leagueWins = (profiles[profIdx].leagueWins || 0) + 1;
      // Unlock Johto on first League win
      if (!profiles[profIdx].johtoUnlocked) {
        profiles[profIdx].johtoUnlocked = true;
      }
      if (!profiles[profIdx].hallOfFame) profiles[profIdx].hallOfFame = [];
      profiles[profIdx].hallOfFame.push({
        date:  Date.now(),
        name,
        party: party.map(p => ({ id: p.id, name: p.name, spriteUrl: p.spriteUrl })),
      });
      saveProfiles(profiles);
    }

    // Build stats cards
    const mvp = party.reduce((best, p) => {
      const s = lStats[p.id] || {};
      const bS = lStats[best?.id] || {};
      return (s.dmgDealt || 0) >= (bS.dmgDealt || 0) ? p : best;
    }, party[0] || null);

    const statsHtml = party.map(p => {
      const s = lStats[p.id] || {};
      return `<div class="lv-stat-card${p === mvp ? ' lv-mvp' : ''}">
        <img src="${p.spriteUrl}" alt="${p.name}" class="lv-stat-sprite pixel-sprite"
             onerror="this.src='assets/sprites/${p.id}.png'">
        ${p === mvp ? '<div class="lv-mvp-crown">👑</div>' : ''}
        <div class="lv-stat-name">${p.name}</div>
        <div class="lv-stat-row">⚔️ ${s.dmgDealt || 0} dealt</div>
        <div class="lv-stat-row">🛡️ ${s.dmgTaken || 0} taken</div>
        <div class="lv-stat-row">🏅 ${s.wins || 0} wins</div>
      </div>`;
    }).join('');

    // Hall of Fame
    const hof = profiles[profIdx]?.hallOfFame || [];
    const hofHtml = hof.slice().reverse().slice(0, 5).map((entry, i) => {
      const d = new Date(entry.date);
      const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
      const sprites = entry.party.map(p =>
        `<img src="${p.spriteUrl}" alt="${p.name}" class="hof-sprite pixel-sprite"
              onerror="this.src='assets/sprites/${p.id}.png'">`
      ).join('');
      return `<div class="hof-entry">
        <div class="hof-date">${dateStr} — ${entry.name}</div>
        <div class="hof-sprites">${sprites}</div>
      </div>`;
    }).join('');

    document.getElementById('lv-trainer-name').textContent = `${name} — League Champion!`;
    document.getElementById('lv-stats-grid').innerHTML  = statsHtml;
    document.getElementById('lv-hof-list').innerHTML    = hofHtml || '<div style="opacity:.5">First entry!</div>';

    // Johto unlock teaser on first League win
    const isFirstLeagueWin = (profiles[profIdx]?.leagueWins || 0) === 1;
    const johtoTeaser = document.getElementById('lv-johto-teaser');
    if (johtoTeaser) {
      johtoTeaser.style.display = isFirstLeagueWin ? '' : 'none';
    }

    showScreen('league-victory');

    // Spawn stars
    const lvStars = document.getElementById('lv-stars');
    if (lvStars) {
      lvStars.innerHTML = '';
      for (let i = 0; i < 50; i++) {
        const s = document.createElement('div');
        s.className = 'victory-star';
        s.style.left = Math.random() * 100 + '%';
        s.style.top  = Math.random() * 100 + '%';
        s.style.animationDelay    = (Math.random() * 3) + 's';
        s.style.animationDuration = (1.5 + Math.random() * 2) + 's';
        s.style.fontSize = (8 + Math.random() * 14) + 'px';
        s.textContent = '★';
        lvStars.appendChild(s);
      }
    }
  },
};


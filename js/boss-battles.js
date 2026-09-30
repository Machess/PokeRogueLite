const BOSS_INTRO_BACKGROUNDS = [
  'assets/bg_0_boss.png',   // Brock
  'assets/bg_1_boss.png',   // Misty
  'assets/bg_2_boss.png',   // Lt. Surge
  'assets/bg_3_boss.png',   // Erika
  'assets/bg_4_boss.png',   // Koga
  'assets/bg_5_boss.png',   // Sabrina
  'assets/bg_6_boss.png',   // Blaine
  'assets/bg_7_boss.png',   // Giovanni
  'assets/bg_8_boss.png',   // Lorelei
  'assets/bg_9_boss.png',   // Bruno
  'assets/bg_10_boss.png',  // Agatha
  'assets/bg_11_boss.png',  // Lance
  'assets/bg_12_boss.png',  // Blue
];

const JOHTO_BOSS_INTRO_BACKGROUNDS = [
  'assets/bg_johto_boss_0.jpg',  // Falkner
  'assets/bg_johto_boss_1.jpg',  // Bugsy
  'assets/bg_johto_boss_2.jpg',  // Whitney
  'assets/bg_johto_boss_3.jpg',  // Morty
  'assets/bg_johto_boss_4.jpg',  // Chuck
  'assets/bg_johto_boss_5.jpg',  // Jasmine
  'assets/bg_johto_boss_6.jpg',  // Pryce
  'assets/bg_johto_boss_7.jpg',  // Clair
  'assets/bg_johto_boss_8.jpg',  // Will   (Elite Four)
  'assets/bg_johto_boss_9.jpg',  // Koga   (Elite Four)
  'assets/bg_johto_boss_10.jpg', // Bruno  (Elite Four)
  'assets/bg_johto_boss_11.jpg', // Karen  (Elite Four)
  'assets/bg_johto_boss_12.jpg', // Lance  (Champion)
];

function setBossIntroBg(bossIdx) {
  if (typeof GymScene !== 'undefined') document.getElementById('screen-boss')?.style.setProperty('--gym-accent', GymScene.accent(bossIdx));
  const bgArray   = (GameState?.region === 'johto')
    ? JOHTO_BOSS_INTRO_BACKGROUNDS
    : BOSS_INTRO_BACKGROUNDS;
  const fallbacks = getGymData().map(g => g.bgFallback);

  const src      = bgArray[Math.min(bossIdx, bgArray.length - 1)];
  const fallback = fallbacks[Math.min(bossIdx, fallbacks.length - 1)];
  const bgEl     = document.querySelector('#screen-boss .battle-bg');
  const imgEl    = document.querySelector('#screen-boss .battle-bg-img');
  if (!bgEl || !imgEl) return;

  bgEl.classList.add('boss-intro-mode');
  bgEl.style.background = fallback;

  imgEl.style.opacity = '0';
  imgEl.onload  = () => { imgEl.style.opacity = '1'; bgEl.style.background = ''; };
  imgEl.onerror = () => { imgEl.style.opacity = '0'; };
  imgEl.src = src;
}

function clearBossIntroBg(firstOppType) {
  const bgEl = document.querySelector('#screen-boss .battle-bg');
  if (bgEl) bgEl.classList.remove('boss-intro-mode');
  // Restore the type-based battle background for the actual fight
  setBattleBg(firstOppType, true);
}


const BossEngine = {
  bossData: null,
  oppTeam:  [],
  oppIdx:   0,
  bState:   null,

  async startLeagueBoss(node) {
    showLoading();
    const gymIdx = node.gymIdx ?? 8;
    const boss   = GYM_DATA[gymIdx];
    this.bossData  = boss;
    this.oppIdx    = 0;
    this.oppTeam   = [];
    this._isRocket = false;

    const baseLevel = boss.leagueLevel || 50;
    for (const id of boss.team) {
      const d     = await fetchPoke(id).catch(() => null);
      const pType = d?.types?.[0]?.type?.name || 'normal';
      const level = baseLevel + Math.floor(Math.random() * 5);
      this.oppTeam.push(makePokemon(id, level,
        d ? getSpriteUrl(d, true) : '',
        d ? capitalize(d.name) : `Pokémon #${id}`, pType));
    }
    hideLoading();

    setBossIntroBg(gymIdx);
    showScreen('boss');
    document.getElementById('trainer-intro').style.display    = 'flex';
    document.getElementById('boss-battle-area').style.display = 'none';
    document.getElementById('boss-party-bar').innerHTML       = '';
    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (trainerImg) trainerImg.src = `assets/${boss.image}`;
    document.getElementById('dialogue-name').textContent = boss.name;
    document.getElementById('dialogue-text').textContent = '';
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) { startBtn.style.display = 'none'; startBtn.textContent = 'Battle! ▶'; }
    document.getElementById('btn-dialogue-next').style.display = 'none';
    typeBossIntro(boss.dialogue, 22, () => {
      if (startBtn) startBtn.style.display = '';
    });
  },

  async start(node) {
    showLoading();
    // Hide battle button immediately — must not be tappable until team is loaded
    const startBtn = document.getElementById('btn-start-boss-battle');
    if (startBtn) { startBtn.style.display = 'none'; startBtn.textContent = 'Battle! ▶'; }

    const gymData = getGymData();
    const bossIdx = Math.min(
      node?.bossIndex ?? GameState.bossesDefeated,
      gymData.length - 1
    );
    const boss = gymData[bossIdx];
    this.bossData    = boss;
    this.oppIdx      = 0;
    this.oppTeam     = [];
    this._isRocket   = false;

    for (const id of boss.team) {
      try {
        const d = await fetchPoke(id);
        if (!d) continue;
        const level = 14 + bossIdx * 7 + Math.floor(Math.random() * 4);
        const pType = d.types?.[0]?.type?.name || 'normal';
        this.oppTeam.push(makePokemon(id, level, getSpriteUrl(d, true), capitalize(d.name), pType));
      } catch(e) {
        console.warn(`BossEngine: fetchPoke failed for id ${id}:`, e);
        const level = 14 + bossIdx * 7;
        this.oppTeam.push(makePokemon(id, level, '', `Pokémon #${id}`, 'normal'));
      }
    }
    hideLoading();

    // Preload all battle assets before the screen appears — no pop-in
    await preloadImages([
      `assets/${boss.image}`,
      ...this.oppTeam.map(p => p.spriteUrl),
    ]);

    const firstOppType = this.oppTeam[0]?.type || 'normal';
    this._firstOppType = firstOppType;
    setBossIntroBg(bossIdx);
    showScreen('boss');

    const trainerSpriteWrap = document.querySelector('.trainer-sprite-wrap');
    const trainerImg = document.getElementById('boss-trainer-sprite');
    if (trainerImg && trainerSpriteWrap) {
      trainerImg.onerror = function() {
        this.onerror = () => {
          trainerSpriteWrap.innerHTML = `<div style="font-size:5rem;line-height:1">🧢</div>`;
        };
        this.src = 'assets/trainer_boss.png';
      };
      trainerImg.src = `assets/${boss.image}`;
    }

    document.getElementById('dialogue-name').textContent = `${boss.name} — ${boss.title}`;
    document.getElementById('dialogue-text').textContent  = '';
    document.getElementById('btn-dialogue-next').style.display = 'none';

    const introEl  = document.getElementById('trainer-intro');
    const battleEl = document.getElementById('boss-battle-area');
    if (introEl)  introEl.style.display  = 'flex';
    if (battleEl) battleEl.style.display = 'none';

    document.getElementById('boss-party-bar').innerHTML = this.oppTeam.map((_,i)=>
      `<div class="boss-poke-pip" id="boss-pip-${i}"></div>`).join('');

    // Typewriter — button only appears after dialogue completes AND team is loaded
    const dialogue = boss.dialogue || '';
    typeBossIntro(dialogue, 22, () => {
      if (startBtn) startBtn.style.display = '';
    });
  },

  startBattle() {
    document.getElementById('trainer-intro').style.display   = 'none';
    document.getElementById('boss-battle-area').style.display = 'block';
    // Swap from full-portrait intro bg to type-based battle bg
    clearBossIntroBg(this._firstOppType || 'normal');
    this._loadNextOpp();
  },

  _loadNextOpp() {
    const opp    = this.oppTeam[this.oppIdx];
    const player = GameState.party[GameState.activePokemonIndex];
    if (!opp || !player) {
      console.error('BossEngine._loadNextOpp: missing opp or player', { opp, player, oppIdx: this.oppIdx, team: this.oppTeam });
      return;
    }
    // Clear wild-battle flags that bleed across opponents if not reset here
    BattleEngine._battleOver       = false;
    BattleEngine._itemUsedThisTurn = false;
    this._isOver                   = false;
    this._switching                = false;   // input lock — clear at battle start
    BattleEngine._initBattle(player,opp,true);
    this.bState=BattleEngine.state;
    this._render();
    this._logEnemy(`${this.bossData.name} sends ${opp.name}!`);
    // Fetch back sprite for player (non-blocking)
    if (!player.backSpriteUrl) {
      fetchPoke(player.id).then(d => {
        const back = d.sprites?.back_default || d.sprites?.front_default || player.spriteUrl;
        this.bState.player.backSpriteUrl = back;
        GameState.party[GameState.activePokemonIndex].backSpriteUrl = back;
        this._render();
      });
    }
  },

  _render() {
    const st = this.bState;
    CombatUI.intent(st,true);
    setHpBar('boss-opp',    st.opp.hp,    st.opp.maxHp,    st.opp.name,    st.opp.level);
    setHpBar('boss-player', st.player.hp, st.player.maxHp, st.player.name, st.player.level);

    const bossTypeBadge = document.getElementById('boss-opp-type-badge');
    if (bossTypeBadge && st.opp.type) {
      bossTypeBadge.textContent = st.opp.type;
      bossTypeBadge.className   = `hud-type-badge type-${st.opp.type}`;
    }

    // Status badges — boss screen
    const bossStatus = document.getElementById('boss-opp-status-badges');
    if (bossStatus) {
      bossStatus.innerHTML = '';
      (st.statusEffects?.opp || []).forEach(s => {
        const b = document.createElement('span');
        b.className = `status-badge status-${s}`;
        b.textContent = STATUS_LABELS[s] || s;
        bossStatus.appendChild(b);
      });
      // ATK debuff badge
      if (st.oppAtkDebuff > 0) {
        const b = document.createElement('span');
        b.className   = 'status-badge status-debuff-atk';
        b.textContent = `ATK-${st.oppAtkDebuff}`;
        bossStatus.appendChild(b);
      }
      // DEF debuff badge
      if ((st.oppDefDebuff||0) > 0) {
        const b = document.createElement('span');
        b.className   = 'status-badge status-debuff-def';
        b.textContent = `DEF-${st.oppDefDebuff}`;
        bossStatus.appendChild(b);
      }
      // ACC debuff badge
      if ((st.oppAccDebuff||0) > 0) {
        const b = document.createElement('span');
        b.className   = 'status-badge status-debuff-acc';
        b.textContent = `ACC-${st.oppAccDebuff}%`;
        bossStatus.appendChild(b);
      }
    }

    // Update debuff detail panel if visible (boss uses boss-debuff-panel)
    const panel = document.getElementById('boss-debuff-panel');
    if (panel && panel.style.display !== 'none') {
      BattleEngine._renderDebuffPanel.call(BattleEngine, this.bState);
    }

    const bossOppSprite = document.getElementById('boss-opp-sprite');
    if (bossOppSprite) {
      bossOppSprite.style.visibility = '';
      bossOppSprite.classList.remove('pokemon-faint');
    }
    document.getElementById('boss-opp-sprite').src    = st.opp.spriteUrl;
    document.getElementById('boss-player-sprite').src = st.player.backSpriteUrl || st.player.spriteUrl;

    document.getElementById('boss-draw-count').textContent    = st.drawPile.length;
    document.getElementById('boss-discard-count').textContent = st.discardPile.length;
    const bossEnergyEl = document.getElementById('boss-actions-left');
    if (bossEnergyEl) {
      const orbs = Array.from({length:Math.max(3,st.energy)},(_,i)=>i).map(i =>
        `<span class="energy-orb ${i < st.energy ? 'energy-orb-full' : 'energy-orb-empty'}"></span>`
      ).join('');
      bossEnergyEl.innerHTML = `<span class="energy-label">Energy</span>${orbs}`;
    }

    const handEl = document.getElementById('boss-hand-area');
    handEl.innerHTML = '';
    // During a faint/switch the hand is locked — dim it and ignore clicks
    handEl.classList.toggle('hand-locked', !!(this._isOver || this._switching));
    st.hand.forEach((card, i) => {
      const el = BattleEngine._makeCardEl.call({ state: st }, card, i);
      el.onclick = () => this.playCard(i);
      handEl.appendChild(el);
    });

    // Party pips
    this.oppTeam.forEach((p, i) => {
      const pip = document.getElementById(`boss-pip-${i}`);
      if (pip) pip.className = 'boss-poke-pip' + (p.hp <= 0 ? ' fainted' : '');
    });

    // Swap buttons
    const swapEl = document.getElementById('boss-party-swap');
    swapEl.innerHTML = '';
    GameState.party.forEach((p, i) => {
      if (i === GameState.activePokemonIndex || p.hp <= 0) return;
      const btn = document.createElement('button');
      btn.className = 'swap-btn';
      btn.innerHTML = `<img src="${p.spriteUrl}" alt="${p.name}" />`;
      btn.onclick = () => this.switchPokemon(i);
      swapEl.appendChild(btn);
    });

    // Boss item button state
    const bossItemBtn = document.getElementById('btn-boss-use-item');
    if (bossItemBtn) {
      const hasPotions = ItemEngine.hasPotions();
      const used       = BattleEngine._itemUsedThisTurn;
      bossItemBtn.disabled = used || !hasPotions;
      bossItemBtn.style.opacity = (used || !hasPotions) ? '0.4' : '1';
      bossItemBtn.textContent   = used ? '✓ Item Used' : '🎒 Item';
    }
  },

  _toggleDebuffPanel() {
    const panel = document.getElementById('boss-debuff-panel');
    if (!panel) return;
    const visible = panel.style.display !== 'none';
    panel.style.display = visible ? 'none' : 'block';
    if (!visible) BattleEngine._renderDebuffPanel.call(BattleEngine, this.bState);
  },
  _logPlayer(html){ BattleEngine._writeLog.call({ isBoss: true }, 'player', html); },
  _logEnemy(html) { BattleEngine._writeLog.call({ isBoss: true }, 'enemy',  html); },
  _logSystem(html){ BattleEngine._writeLog.call({ isBoss: true }, 'enemy',  `<span class="log-sys">${html}</span>`); },
  _log(html)      { BattleEngine._writeLog.call({ isBoss: true }, 'enemy',  `<span class="log-sys">${html}</span>`); },

  playCard(idx) { CombatFlow.play(idx,true); },
  endTurn() { CombatFlow.end(true); },
  switchPokemon(idx) { CombatFlow.switch(idx,true); },

  _checkDefeated() {
    const st = this.bState;
    // Re-entry guard: if we're already processing a faint/switch, don't start
    // another one (stacked setTimeouts could otherwise advance oppIdx multiple
    // times and skip the whole enemy team).
    if (this._switching) return true;
    if (st.opp.hp <= 0) {
      this.oppTeam[this.oppIdx].hp = 0;
      this._isOver    = true;
      this._switching = true;   // lock input until the next opp is loaded

      // Faint animation — same as wild battle
      const oppSpriteEl = document.getElementById('boss-opp-sprite');
      if (oppSpriteEl) {
        oppSpriteEl.classList.add('pokemon-faint');
        setTimeout(() => { oppSpriteEl.style.visibility = 'hidden'; }, 700);
      }

      // All logic deferred until animation completes
      setTimeout(() => {
        this.oppIdx++;
        if (this.oppIdx >= this.oppTeam.length) {
          // All opponents defeated
          GameState.party[GameState.activePokemonIndex].hp = st.player.hp;
          MapEngine.completeNode(GameState.currentNodeIndex);

          // The gym-victory path (award badge + advance map) must ONLY run on a
          // real gym boss node. Rocket battles come from mystery/rocket nodes, so
          // anything that is not a 'boss' node is treated as a Rocket win. This
          // makes the branch authoritative regardless of the _isRocket flag state.
          const curNode   = GameState.map?.[GameState.currentNodeIndex];
          const isGymBoss = curNode?.type === 'boss' && !this._isRocket;

          if (!isGymBoss) {
            this._isRocket = false;
            if (!GameState.stats) GameState.stats = {};
            GameState.stats.totalBattlesWon = (GameState.stats.totalBattlesWon || 0) + 1;
            const earned = Math.floor(20 + Math.random() * 30);
            GameState.gold = (GameState.gold || 0) + earned;
            setTimeout(() => {
              showModal('Team Rocket Fled! 🚀',
                `Team Rocket blasted off again!\nYou found ${earned}g they dropped!`,
                () => {
                  const evolutions = levelUpParty('battle');
                  if (evolutions.length > 0) {
                    runEvolutions(evolutions, () => CardReward.show(earned));
                  } else {
                    CardReward.show(earned);
                  }
                }
              );
            }, 200);
          } else {
            // Normal gym boss win
            if (!GameState.stats) GameState.stats = {};
            GameState.stats.totalBattlesWon  = (GameState.stats.totalBattlesWon  || 0) + 1;
            GameState.stats.totalBossesBeaten = (GameState.stats.totalBossesBeaten || 0) + 1;
            // Track league stats per active Pokémon
            if (GameState.isLeagueRun) {
              const active = GameState.party[GameState.activePokemonIndex];
              if (active) {
                if (!GameState.leagueStats) GameState.leagueStats = {};
                if (!GameState.leagueStats[active.id]) GameState.leagueStats[active.id] = { dmgDealt:0, dmgTaken:0, wins:0 };
                GameState.leagueStats[active.id].dmgDealt += BossEngine.bState?.totalDamageDealt || 0;
                GameState.leagueStats[active.id].dmgTaken += BossEngine.bState?.totalDamageTaken || 0;
                GameState.leagueStats[active.id].wins++;
              }
            }
            GameState.resume={kind:'boss-victory',boss:this.bossData,final:GameState.isLeagueRun?this.bossData?.name==='Blue':GameState.bossesDefeated>=7};
            saveGame(true);
            setTimeout(() => {
              const isFinalBoss = GameState.isLeagueRun
                ? this.bossData?.name === 'Blue'
                : GameState.bossesDefeated >= 7;
              const bossName    = this.bossData.name;
              const BOSS_WIN_LINES = {
                'Brock':     `"Your Pokémon has real grit. I can see you've been training hard. The Boulder Badge is yours."`,
                'Misty':     `"Fine. You beat me fair and square. Don't let it go to your head — the real trainers are ahead."`,
                'Lt. Surge': `"Outstanding instincts! A soldier who reads battle like that goes far. The Thunder Badge!"`,
                'Erika':     `"Your Pokémon moved with grace and patience. The Rainbow Badge suits a trainer like you."`,
                'Koga':      `"You have the mind of a shinobi — patient, precise, relentless. The Soul Badge is yours."`,
                'Sabrina':   `"...I did not foresee this outcome. You have surprised me. The Marsh Badge is yours."`,
                'Blaine':    `"Ha! You burned bright today! You've got fire in you, kid! Take the Volcano Badge!"`,
                'Giovanni':  `"Impressive control. I expected nothing less. You've earned your place in this world."`,
                'Lorelei':   `"You've broken through my ice. The Elite Four won't forget a trainer like you."`,
                'Bruno':     `"Your fighting spirit rivals mine. A true warrior's heart. Well earned, trainer."`,
                'Agatha':    `"You have more spirit than I expected, child. Come back when you're older — if you dare!"`,
                'Lance':     `"The Dragon Master bows to a worthy challenger. The skies are yours today."`,
                'Blue':      `"...you got lucky." He walks off without another word. You both know it wasn't luck.`,
              };
              const bossLine = BOSS_WIN_LINES[bossName]
                || `You defeated ${bossName}! Your team is getting stronger!`;
              const modalMsg = isFinalBoss
                ? `You are the Champion!\n\n${bossLine}`
                : bossLine;
              showModal('Boss Defeated! 🏅', modalMsg, () => {
                SaveManager.complete();
                if (GameState.isLeagueRun && isFinalBoss) {
                  LeagueEngine.showLeagueVictory();
                } else if (GameState.isLeagueRun) {
                  LeagueEngine.afterLeagueBoss(this.bossData);
                } else {
                  Game.afterBoss(GameState.bossesDefeated);
                }
              });
            }, 200);
          }
        } else {
          // More opponents remain — load next, reset ALL opp-side status
          BattleEngine._battleOver       = false;
          BattleEngine._itemUsedThisTurn = false;
          this._isOver                   = false;
          this._logEnemy(`${this.bossData.name} sends ${this.oppTeam[this.oppIdx].name}!`);
          st.opp                         = { ...this.oppTeam[this.oppIdx] };
          // Clear opp-side status so previous Pokémon's debuffs don't carry over
          st.statusEffects.opp = [];
          st.oppAtkDebuff      = 0;
          st.oppDefDebuff      = 0;
          st.oppAccDebuff      = 0;
          st.leechTurns        = 0;
          st.leechStacks       = 0;
          st.intent=null;st.oppShield=0;st.oppTauntTurns=0;st.enemyCharge=false;st.enemyRain=0;
          // Reset the faint animation/visibility for the incoming sprite
          const oppSpriteEl = document.getElementById('boss-opp-sprite');
          if (oppSpriteEl) {
            oppSpriteEl.classList.remove('pokemon-faint');
            oppSpriteEl.style.visibility = 'visible';
          }
          this._switching = false;   // unlock input — next opp fully loaded
          this._render();
          SaveManager.captureBattle(true);
        }
      }, 750); // wait for faint animation to finish

      return true;
    }
    if (st.player.hp <= 0) {
      GameState.party[GameState.activePokemonIndex].hp = 0;
      const next = GameState.party.findIndex((p, i) => i !== GameState.activePokemonIndex && p.hp > 0);
      if (next >= 0) {
        CombatFlow.switch(next,true,true);
      } else {
        this._isOver = true;
        deleteSave();
        GameOver.show(this.bossData.name);
        return true;
      }
    }
    return false;
  },

  _syncFromBattleState(st) { this.bState = st; },
};

// ─── ROCKET DIALOGUE SCRIPTS ─────────────────────────────────────────────────
// Each script is an array of lines. Each line: { speaker, name, img, text }
// ${name} in text is replaced with the trainer's name at render time.


const ROCKET_COINS = [
  { val: 1,  label: '1g',  cls: 'rk-coin-1'  },
  { val: 5,  label: '5g',  cls: 'rk-coin-5'  },
  { val: 10, label: '10g', cls: 'rk-coin-10' },
  { val: 50, label: '50g', cls: 'rk-coin-50' },
];

const ROCKET_ITEMS = ['Stolen Pokéball','"Borrowed" Potion','Mystery Crate','Rare Candy (fake)','Bent Spoon','Moon Stone Replica','Suspicious TM','Golden Magikarp Statue'];

const GiovanniEngine = {
  _node:null, _isActive:false, _round:0, _hits:0,
  _target:0, _paid:0, _mode:'pay',

  start(node) {
    this._node = node; this._isActive = true; this._round = 0; this._hits = 0;
    ActiveEngine.set(this);
    skillTimerBegin('giovanni');
    showBossIntro({
      gymIndex: 7, portrait: 'giovanni.png', gameKey: 'giovanni',
      name: 'Giovanni', btnLabel: '💰 Open the Ledger',
      introText: "So. Team Rocket's finances are a disaster — my grunts cannot count. You will settle the ledger. Pay EXACTLY what is owed. One coin too many or too few, and... I will be displeased.",
    });
  },

  startGame() {
    this._isActive = false; ActiveEngine.clear();
    document.getElementById('trainer-intro').style.display = 'none';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    this._showRound();
  },

  _genRound(tier) {
    const item = ROCKET_ITEMS[Math.floor(Math.random() * ROCKET_ITEMS.length)];
    if (tier === 1) {
      // Pay an exact price using the tray
      const price = [12, 17, 25, 35, 46, 58][Math.floor(Math.random() * 6)];
      return { mode:'pay', item, price, target: price,
        prompt: `A grunt "found" a ${item}. Pay the fence EXACTLY ${price}g!` };
    }
    if (tier === 2) {
      // Make change from a round payment
      const price = 15 + Math.floor(Math.random() * 8) * 5;       // 15..50 step 5
      const paidWith = price <= 45 ? 50 : 100;
      return { mode:'change', item, price, paidWith, target: paidWith - price,
        prompt: `The ${item} costs ${price}g. The grunt pays ${paidWith}g. Give the RIGHT change!` };
    }
    // Tier 3 — bigger, mixed
    const price = 23 + Math.floor(Math.random() * 60);            // 23..82
    const paidWith = 100;
    return { mode:'change', item, price, paidWith, target: paidWith - price,
      prompt: `${item}: ${price}g. Paid with ${paidWith}g. Count the change — Giovanni is watching.` };
  },

  _showRound() {
    if (this._round >= 5) { this._finish(); return; }
    const tier = Math.min(getSkillTier('giovanni'), 3);
    const r    = this._genRound(tier);
    this._target = r.target;
    this._paid   = 0;

    const cv = setupChallengeScreen({
      portrait: 'giovanni.png', badge: "💰 Rocket's Ledger",
      intro: `Deal ${this._round + 1}/5 — ${this._hits} settled`,
      wrapClass: 'rk-wrap', screenClass: 'rocketmoney-active',
    });

    const prompt = document.createElement('div');
    prompt.className = 'rk-prompt';
    prompt.textContent = r.prompt;
    cv.appendChild(prompt);

    // The ledger line — what we owe
    const ledger = document.createElement('div');
    ledger.className = 'rk-ledger';
    ledger.innerHTML = r.mode === 'pay'
      ? `<span class="rk-owe">OWED: ${r.target}g</span>`
      : `<span class="rk-math">${r.paidWith}g − ${r.price}g = <b>?</b></span>`;
    cv.appendChild(ledger);

    // Counting tray — coins placed so far
    const tray = document.createElement('div');
    tray.className = 'rk-tray';
    tray.innerHTML = `<div class="rk-tray-coins" id="rk-tray-coins"></div>
      <div class="rk-tray-total" id="rk-tray-total">0g</div>`;
    cv.appendChild(tray);

    // Coin buttons
    const row = document.createElement('div');
    row.className = 'rk-coin-row';
    ROCKET_COINS.forEach(c => {
      const b = document.createElement('button');
      b.className = `rk-coin ${c.cls}`;
      b.textContent = c.label;
      b.addEventListener('click', () => {
        this._paid += c.val;
        const tc = document.getElementById('rk-tray-coins');
        if(tc){const coin=document.createElement('button');coin.className='rk-coin-mini '+c.cls;coin.textContent=c.label;coin.title='Remove this coin';coin.onclick=()=>{if(submit.disabled)return;this._paid-=c.val;coin.remove();document.getElementById('rk-tray-total').textContent=this._paid+'g';};tc.appendChild(coin);}
        const tt = document.getElementById('rk-tray-total');
        if (tt) {
          tt.textContent = `${this._paid}g`;
          tt.classList.toggle('rk-over', this._paid > this._target);
        }
      });
      row.appendChild(b);
    });
    cv.appendChild(row);

    // Actions: clear + hand over
    const actions = document.createElement('div');
    actions.className = 'rk-actions';
    const clear = document.createElement('button');
    clear.className = 'btn-pixel btn-secondary rk-clear';
    clear.textContent = '↺ Start over';
    clear.addEventListener('click', () => {
      this._paid = 0;
      const tc = document.getElementById('rk-tray-coins');  if (tc) tc.innerHTML = '';
      const tt = document.getElementById('rk-tray-total');  if (tt) { tt.textContent = '0g'; tt.classList.remove('rk-over'); }
    });
    const submit = document.createElement('button');
    submit.className = 'btn-pixel btn-primary rk-submit';
    submit.textContent = '🤝 Hand it over';
    submit.addEventListener('click', () => {
      row.querySelectorAll('button').forEach(b => b.disabled = true);
      clear.disabled = submit.disabled = true;
      const correct = this._paid === this._target;
      tray.classList.add(correct ? 'rk-correct' : 'rk-wrong');
      const verdict = document.createElement('div');
      verdict.className = 'rk-verdict';
      verdict.textContent = correct
        ? `"Exactly ${this._target}g. Acceptable." ✓`
        : this._paid > this._target
          ? `"${this._paid - this._target}g too MUCH. Sloppy." (needed ${this._target}g)`
          : `"${this._target - this._paid}g SHORT. Pathetic." (needed ${this._target}g)`;
      cv.appendChild(verdict);
      if (correct) this._hits++;
      MiniGameSession.next(() => { this._round++; this._showRound(); });
    });
    actions.appendChild(clear);
    actions.appendChild(submit);
    cv.appendChild(actions);
  },

  _finish() {
    const won  = this._hits >= 4;
    const gold = this._hits >= 5 ? 28 : won ? 16 : 6;
    if (won) GameState.rocketLedgerDiscount = true;   // 10% off shop for the rest of the run
    completeChallenge({
      screenClass: 'rocketmoney-active', won,
      goldReward: gold,
      score: this._hits, maxScore: 5, gameKey: 'giovanni',
      tokenLabel: won ? '10% Rocket discount at all shops!' : null,
      modalTitle: this._hits >= 5 ? '💰 The Ledger Balances!' : won ? '💰 Giovanni Approves' : '💰 "Get out of my sight."',
      modalBody: `${this._hits}/5 deals settled\n+${gold}💰`,
    });
  },
};

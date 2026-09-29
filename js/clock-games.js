function _clockSVG(h, m, size = 110) {
  const hourAngle = ((h % 12) + m / 60) * 30;
  const minAngle  = m * 6;
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" class="chuck-clock-svg">
    <circle cx="50" cy="50" r="46" fill="#fdf6e3" stroke="#7a4a20" stroke-width="4"/>
    ${Array.from({length:12},(_,i)=>{
      const a=(i*30-90)*Math.PI/180, x1=50+38*Math.cos(a), y1=50+38*Math.sin(a),
            x2=50+42*Math.cos(a), y2=50+42*Math.sin(a);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#7a4a20" stroke-width="2"/>`;
    }).join('')}
    ${[12,3,6,9].map(n=>{
      const a=((n%12)*30-90)*Math.PI/180, x=50+32*Math.cos(a), y=50+32*Math.sin(a)+3;
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="10" font-weight="bold" fill="#7a4a20" text-anchor="middle">${n}</text>`;
    }).join('')}
    <line x1="50" y1="50" x2="${(50+22*Math.cos((hourAngle-90)*Math.PI/180)).toFixed(1)}" y2="${(50+22*Math.sin((hourAngle-90)*Math.PI/180)).toFixed(1)}" stroke="#2a2a2a" stroke-width="5" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="${(50+34*Math.cos((minAngle-90)*Math.PI/180)).toFixed(1)}" y2="${(50+34*Math.sin((minAngle-90)*Math.PI/180)).toFixed(1)}" stroke="#c03028" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="3.5" fill="#2a2a2a"/>
  </svg>`;
}

function _timeWords(h, m) {
  const hh = ((h - 1) % 12) + 1;
  const next = (hh % 12) + 1;
  if (m === 0)  return `${hh} o'clock`;
  if (m === 15) return `quarter past ${hh}`;
  if (m === 30) return `half past ${hh}`;
  if (m === 45) return `quarter to ${next}`;
  return `${hh}:${String(m).padStart(2,'0')}`;
}

const ChuckEngine = {
  _isActive:false, _node:null, _round:0, _hits:0,
  _setH:0, _setM:0, _target:null,

  start(node) {
    this._node = node; this._isActive = true; this._round = 0; this._hits = 0;
    ActiveEngine.set(this);
    skillTimerBegin('chuck');
    showBossIntro({
      gymIndex: 4, portrait: 'chuck.png',
      name: 'Chuck', btnLabel: '🕐 Start Training!',
      introText: "WAHAHA! Training waits for NO ONE! My whole dojo runs on the clock — and YOU are going to set it! Show me you can read the time, kid!",
    });
  },

  startGame() {
    this._isActive = false; ActiveEngine.clear();
    document.getElementById('trainer-intro').style.display = 'none';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    this._showRound();
  },

  _randTime(tier) {
    const h = 1 + Math.floor(Math.random() * 12);
    const m = tier === 1 ? 0 : [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    return { h, m };
  },

  _showRound() {
    if (this._round >= 5) { this._finish(); return; }
    const tier = Math.min(getSkillTier('chuck'), 3);

    const cv = setupChallengeScreen({
      portrait: 'chuck.png', badge: '🕐 Training Clock',
      intro: `Round ${this._round + 1}/5 — ${this._hits} correct`,
      wrapClass: 'chuck-wrap', screenClass: 'chuck-active',
    });

    if (tier === 1) this._roundPick(cv);
    else            this._roundSet(cv, tier);
  },

  // ── Tier 1: Chuck says a time, tap the matching clock of 3 ────────────────
  _roundPick(cv) {
    const target = this._randTime(1);
    // Two unique decoy hours
    const hours = shuffle([1,2,3,4,5,6,7,8,9,10,11,12].filter(h => h !== target.h)).slice(0,2);
    const options = shuffle([target, ...hours.map(h => ({ h, m: 0 }))]);

    const say = document.createElement('div');
    say.className = 'chuck-say';
    say.textContent = `"Training starts at ${_timeWords(target.h, target.m)}! Which clock is right?"`;
    cv.appendChild(say);

    const row = document.createElement('div');
    row.className = 'chuck-clock-row';
    options.forEach(o => {
      const btn = document.createElement('button');
      btn.className = 'chuck-clock-btn';
      btn.innerHTML = _clockSVG(o.h, o.m, 96);
      btn.addEventListener('click', () => {
        row.querySelectorAll('.chuck-clock-btn').forEach(b => b.disabled = true);
        const correct = o.h === target.h && o.m === target.m;
        btn.classList.add(correct ? 'chuck-correct' : 'chuck-wrong');
        if (!correct) {
          // reveal the right one
          options.forEach((oo, i) => {
            if (oo.h === target.h && oo.m === target.m)
              row.children[i].classList.add('chuck-correct');
          });
        } else this._hits++;
        MiniGameSession.next(() => { this._round++; this._showRound(); });
      });
      row.appendChild(btn);
    });
    cv.appendChild(row);
  },

  // ── Tier 2/3: set the hands with buttons ──────────────────────────────────
  _roundSet(cv, tier) {
    let target, sayText;
    if (tier === 2) {
      target  = this._randTime(2);
      sayText = `"Set the clock to ${_timeWords(target.h, target.m)}!"`;
    } else {
      // Elapsed-time problem
      const startT = this._randTime(2);
      const addMin = [30, 45, 60, 90][Math.floor(Math.random() * 4)];
      const totalM = startT.h * 60 + startT.m + addMin;
      target  = { h: (Math.floor(totalM / 60) - 1) % 12 + 1, m: totalM % 60 };
      sayText = `"Training started at ${startT.h}:${String(startT.m).padStart(2,'0')} and lasted ${addMin} minutes. Set the clock to when it ENDED!"`;
    }
    this._target = target;
    this._setH = 12; this._setM = 0;

    const say = document.createElement('div');
    say.className = 'chuck-say';
    say.textContent = sayText;
    cv.appendChild(say);

    const clockWrap = document.createElement('div');
    clockWrap.id = 'chuck-set-clock';
    clockWrap.innerHTML = _clockSVG(this._setH, this._setM, 130);
    cv.appendChild(clockWrap);

    const readout = document.createElement('div');
    readout.className = 'chuck-readout';
    readout.id = 'chuck-readout';
    readout.textContent = `12:00`;
    cv.appendChild(readout);

    const ctrl = document.createElement('div');
    ctrl.className = 'chuck-ctrl-row';
    const mk = (label, fn) => {
      const b = document.createElement('button');
      b.className = 'btn-pixel btn-secondary chuck-ctrl-btn';
      b.textContent = label;
      b.addEventListener('click', () => { fn(); this._redrawSetClock(); });
      return b;
    };
    ctrl.appendChild(mk('+1 hour', () => { this._setH = (this._setH % 12) + 1; }));
    ctrl.appendChild(mk('+5 min',  () => {
      this._setM += 5;
      if (this._setM >= 60) { this._setM = 0; this._setH = (this._setH % 12) + 1; }
    }));
    cv.appendChild(ctrl);

    const submit = document.createElement('button');
    submit.className = 'btn-pixel btn-primary chuck-submit';
    submit.textContent = '✓ That\'s the time!';
    submit.addEventListener('click', () => {
      submit.disabled = true;
      ctrl.querySelectorAll('button').forEach(b => b.disabled = true);
      const correct = this._setH === target.h && this._setM === target.m;
      clockWrap.classList.add(correct ? 'chuck-correct' : 'chuck-wrong');
      if (correct) this._hits++;
      else {
        const ans = document.createElement('div');
        ans.className = 'chuck-answer';
        ans.innerHTML = `Correct: ${target.h}:${String(target.m).padStart(2,'0')} ${_clockSVG(target.h, target.m, 70)}`;
        cv.appendChild(ans);
      }
      MiniGameSession.next(() => { this._round++; this._showRound(); });
    });
    cv.appendChild(submit);
  },

  _redrawSetClock() {
    const wrap = document.getElementById('chuck-set-clock');
    if (wrap) wrap.innerHTML = _clockSVG(this._setH, this._setM, 130);
    const ro = document.getElementById('chuck-readout');
    if (ro) ro.textContent = `${this._setH}:${String(this._setM).padStart(2,'0')}`;
  },

  _finish() {
    const won  = this._hits >= 4;
    const gold = this._hits >= 5 ? 26 : this._hits >= 3 ? 15 : 7;
    completeChallenge({
      screenClass: 'chuck-active', won,
      goldReward: gold,
      effects: this._hits === 5 ? { chuckDiscipline: true } : {},
      score: this._hits, maxScore: 5, gameKey: 'chuck',
      tokenLabel: this._hits === 5 ? 'Discipline — +1 energy first turn!' : null,
      modalTitle: this._hits === 5 ? '🕐 Perfect Timing!' : won ? '🕐 Well Trained!' : '🕐 Back to Training!',
      modalBody: `${this._hits}/5 clocks correct\n+${gold}💰`,
    });
  },
};

// ─── TOGEPI ENGINE — "Time Freeze" (elapsed-time / duration) ─────────────────
// Togepi accidentally freezes time! Two clocks are shown: when time STOPPED and
// when it STARTED again. The player works out how LONG time was frozen (elapsed
// duration). Tier 2-3 add a reverse mode (given a duration + start, find the end
// time). Distinct from Chuck (who teaches reading/setting a single clock).
// Reward: Lucky Charm — the opponent's first attack misses next battle.
const TogepiEngine = {
  _isActive:false, _node:null, _round:0, _hits:0,
  _setH:0, _setM:0, _target:null,

  start(node) {
    this._node = node; this._isActive = true; this._round = 0; this._hits = 0;
    ActiveEngine.set(this);
    showBossIntro({
      gymIndex: 0, portrait: 'togepi.png', gameKey: 'togepi',
      name: 'Togepi', btnLabel: '⏳ Start!',
      cry: 'togepi.mp3',
      introText: "Togepiii! ✨ Togepi waved its little arms and... everything FROZE! Can you tell how long time stood still? Look at the two clocks and help time start again!",
    });
    const t = document.getElementById('boss-trainer-sprite');
    if (t) t.onerror = () => { t.style.visibility = 'hidden'; };
  },

  startGame() {
    this._isActive = false; ActiveEngine.clear();
    document.getElementById('trainer-intro').style.display = 'none';
    const bgEl = document.querySelector('#screen-boss .battle-bg');
    if (bgEl) bgEl.classList.remove('boss-intro-mode');
    skillTimerBegin('togepi');
    this._showRound();
  },

  // Random start time, tier-scaled granularity
  _randStart(tier) {
    const h = 1 + Math.floor(Math.random() * 12);
    let m;
    if (tier === 1) m = 0;                                   // on the hour
    else if (tier === 2) m = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    else m = [0,5,10,15,20,25,30,35,40,45,50,55][Math.floor(Math.random() * 12)];
    return { h, m };
  },

  // Tier-scaled duration in minutes
  _randDuration(tier) {
    if (tier === 1) return [15, 30, 45, 60][Math.floor(Math.random() * 4)];
    if (tier === 2) return [30, 45, 60, 75, 90][Math.floor(Math.random() * 5)];
    return [25, 40, 45, 50, 65, 70, 80, 95][Math.floor(Math.random() * 8)];
  },

  _addMinutes(t, mins) {
    const total = (t.h % 12) * 60 + t.m + mins;
    const h = (Math.floor(total / 60) % 12);
    return { h: h === 0 ? 12 : h, m: total % 60 };
  },

  // Friendly duration words
  _durWords(mins) {
    const h = Math.floor(mins / 60), m = mins % 60;
    if (mins === 15) return '15 minutes';
    if (mins === 30) return 'half an hour';
    if (mins === 45) return '45 minutes';
    if (mins === 60) return '1 hour';
    if (h > 0 && m === 0) return `${h} hour${h>1?'s':''}`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m} minutes`;
  },

  _showRound() {
    if (this._round >= 5) { this._finish(); return; }
    const tier = Math.min(getSkillTier('togepi'), 3);
    const cv = setupChallengeScreen({
      portrait: 'togepi.png', badge: '⏳ Time Freeze',
      intro: `Round ${this._round + 1}/5 — ${this._hits} correct`,
      wrapClass: 'togepi-wrap', screenClass: 'togepi-active',
    });
    // Tier 1 always duration mode; tier 2-3 sometimes reverse mode
    const reverse = tier >= 2 && Math.random() < 0.4;
    if (reverse) this._roundReverse(cv, tier);
    else         this._roundDuration(cv, tier);
  },

  // ── Duration mode: two clocks, how long was time frozen? ─────────────────
  _roundDuration(cv, tier) {
    const start = this._randStart(tier);
    const dur   = this._randDuration(tier);
    const end   = this._addMinutes(start, dur);

    const say = document.createElement('div');
    say.className = 'togepi-say';
    say.innerHTML = `Togepi froze time! ✨<br>How long did time stand still?`;
    cv.appendChild(say);

    // Two clocks: stopped → started
    const clocks = document.createElement('div');
    clocks.className = 'togepi-clocks';
    clocks.innerHTML = `
      <div class="togepi-clock-box">
        <div class="togepi-clock-label">Time STOPPED</div>
        <div id="togepi-clock-a" class="togepi-clock-frozen">${_clockSVG(start.h, start.m, 120)}</div>
        <div class="togepi-clock-time">${start.h}:${String(start.m).padStart(2,'0')}</div>
      </div>
      <div class="togepi-arrow">➡️</div>
      <div class="togepi-clock-box">
        <div class="togepi-clock-label">Time STARTED</div>
        <div id="togepi-clock-b" class="togepi-clock-frozen">${_clockSVG(start.h, start.m, 120)}</div>
        <div class="togepi-clock-time">${end.h}:${String(end.m).padStart(2,'0')}</div>
      </div>`;
    cv.appendChild(clocks);

    // Animate the SECOND clock's hands sweeping from start → end (tier 1-2)
    if (tier <= 2) this._animateHands('togepi-clock-b', start, end);
    else document.getElementById('togepi-clock-b').innerHTML = _clockSVG(end.h, end.m, 120);

    MiniGameUpgrades.timeline(start,dur,cv);
    // Build duration options
    const opts = new Set([dur]);
    const pool = tier === 1 ? [15,30,45,60] : tier === 2 ? [15,30,45,60,75,90] : [25,40,45,50,65,70,80,95,100];
    while (opts.size < (tier === 1 ? 3 : 4)) {
      opts.add(pool[Math.floor(Math.random() * pool.length)]);
    }
    const optArr = shuffle([...opts]);

    const row = document.createElement('div');
    row.className = 'togepi-opts';
    optArr.forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'togepi-opt-btn';
      btn.textContent = this._durWords(m);
      btn.addEventListener('click', () => {
        row.querySelectorAll('.togepi-opt-btn').forEach(b => b.disabled = true);
        const correct = m === dur;
        btn.classList.add(correct ? 'togepi-correct' : 'togepi-wrong');
        if (!correct) {
          row.querySelectorAll('.togepi-opt-btn').forEach(b => {
            if (b.textContent === this._durWords(dur)) b.classList.add('togepi-correct');
          });
        } else { this._hits++; this._unfreeze(); }
        MiniGameSession.next(() => { this._round++; this._showRound(); });
      });
      row.appendChild(btn);
    });
    cv.appendChild(row);
  },

  // ── Reverse mode (tier 2-3): given start + duration, what time restarted? ─
  _roundReverse(cv, tier) {
    const start = this._randStart(tier);
    const dur   = this._randDuration(tier);
    const end   = this._addMinutes(start, dur);

    const say = document.createElement('div');
    say.className = 'togepi-say';
    say.innerHTML = `Togepi froze time at <b>${start.h}:${String(start.m).padStart(2,'0')}</b> for <b>${this._durWords(dur)}</b>.<br>What time did it start again?`;
    cv.appendChild(say);

    const clocks = document.createElement('div');
    clocks.className = 'togepi-clocks';
    clocks.innerHTML = `
      <div class="togepi-clock-box">
        <div class="togepi-clock-label">Time STOPPED</div>
        <div class="togepi-clock-frozen">${_clockSVG(start.h, start.m, 120)}</div>
        <div class="togepi-clock-time">${start.h}:${String(start.m).padStart(2,'0')}</div>
      </div>
      <div class="togepi-arrow">➡️</div>
      <div class="togepi-clock-box">
        <div class="togepi-clock-label">Time STARTED</div>
        <div class="togepi-clock-frozen togepi-clock-mystery">${_clockSVG(12, 0, 120)}<div class="togepi-q">?</div></div>
        <div class="togepi-clock-time">?:??</div>
      </div>`;
    cv.appendChild(clocks);

    MiniGameUpgrades.timeline(start,dur,cv);
    // Options are end-times
    const opts = new Set([`${end.h}:${String(end.m).padStart(2,'0')}`]);
    while (opts.size < 4) {
      const dd = this._randDuration(tier);
      const e2 = this._addMinutes(start, dd);
      opts.add(`${e2.h}:${String(e2.m).padStart(2,'0')}`);
    }
    const optArr = shuffle([...opts]);
    const answer = `${end.h}:${String(end.m).padStart(2,'0')}`;

    const row = document.createElement('div');
    row.className = 'togepi-opts';
    optArr.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'togepi-opt-btn';
      btn.textContent = s;
      btn.addEventListener('click', () => {
        row.querySelectorAll('.togepi-opt-btn').forEach(b => b.disabled = true);
        const correct = s === answer;
        btn.classList.add(correct ? 'togepi-correct' : 'togepi-wrong');
        if (!correct) {
          row.querySelectorAll('.togepi-opt-btn').forEach(b => {
            if (b.textContent === answer) b.classList.add('togepi-correct');
          });
        } else { this._hits++; this._unfreeze(); }
        MiniGameSession.next(() => { this._round++; this._showRound(); });
      });
      row.appendChild(btn);
    });
    cv.appendChild(row);
  },

  // Sweep a clock's hands from one time to another over ~1.4s
  _animateHands(elId, from, to) {
    const el = document.getElementById(elId);
    if (!el) return;
    const fromTotal = (from.h % 12) * 60 + from.m;
    let toTotal = (to.h % 12) * 60 + to.m;
    if (toTotal <= fromTotal) toTotal += 720;   // wrap forward
    const steps = 28, dur = 1400;
    let i = 0;
    const tick = () => {
      const frac = i / steps;
      const cur = fromTotal + (toTotal - fromTotal) * frac;
      const h = Math.floor(cur / 60) % 12, m = Math.round(cur % 60);
      el.innerHTML = _clockSVG(h === 0 ? 12 : h, m, 120);
      if (i++ < steps) MiniGameSession.later(tick, dur / steps);
      else el.innerHTML = _clockSVG(to.h, to.m, 120);
    };
    tick();
  },

  // Visual: lift the frozen tint when answered correctly
  _unfreeze() {
    const sc = document.getElementById('screen-challenge');
    if (sc) {
      sc.classList.add('togepi-unfreeze');
      MiniGameSession.later(() => sc.classList.remove('togepi-unfreeze'), 1000);
    }
    SoundEngine.playCorrect && SoundEngine.playCorrect();
  },

  _finish() {
    const won  = this._hits >= 4;
    const perfect = this._hits >= 5;
    const tier = Math.min(getSkillTier('togepi'), 3);
    const baseGold = { 1: 8, 2: 12, 3: 16 }[tier];
    const gold = won ? baseGold : Math.floor(baseGold / 2);

    completeChallenge({
      screenClass: 'togepi-active', won,
      goldReward: gold,
      effects: won ? { luckyCharm: true } : {},
      score: this._hits, maxScore: 5, gameKey: 'togepi',
      tokenLabel: won ? "Lucky Charm — opponent's first attack misses!" : null,
      modalTitle: perfect ? '⏳ Perfect Timing!' : won ? '✨ Time Restored!' : '⏳ Time Got Away...',
      modalBody: `${this._hits}/5 correct\n+${gold}💰` +
        (won ? "\n\n✨ Lucky Charm! The next opponent's first attack will miss!" : ''),
    });
  },
};

// ─── OAK SORT ENGINE — "Oak's Sorting Lab" — teaches classification ──────────
// Pokémon slide across one at a time; tap the correct basket before they exit.
// Sorting rules rotate: by type, by colour, by wings, by size.


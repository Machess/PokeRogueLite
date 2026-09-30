/* Shared mini-game shell and gym-scene helpers.
 * One look for every activity on #screen-challenge: a top bar (leave, who,
 * progress, pause), the trainer standing large in the scene, a cream question
 * bubble with read-aloud, and large answer tiles. It reads what each game
 * already writes into the shared header, so individual engines stay unchanged.
 */
const GameShell = {
  SKIP: new Set(['runner-active', 'cooking']),
  // Per-activity accent: [colour, text colour on that colour]
  ACCENTS: {
    'surge-active': ['#F2C230', '#1A1200'], 'erika-active': ['#3FA36B', '#FFFFFF'],
    'koga-active': ['#8A4FB8', '#FFFFFF'], 'sabrina-active': ['#C04F9E', '#FFFFFF'],
    'blaine-active': ['#E4572E', '#FFFFFF'], 'rocketmoney-active': ['#F2B42C', '#1A1200'],
    'falkner-active': ['#5AA9E6', '#0B1422'], 'bugsy-active': ['#7BAE2F', '#0B1422'],
    'whitney-active': ['#E86AA6', '#1A0A12'], 'morty-active': ['#7E5BC4', '#FFFFFF'],
    'jasmine-active': ['#9AA7B8', '#0B1422'], 'pryce-active': ['#6FC3E6', '#0B1422'],
    'clair-active': ['#3A6FD8', '#FFFFFF'], 'chuck-active': ['#E08A1E', '#1A1200'],
    'togepi-active': ['#5AA9E6', '#0B1422'], 'oak-active': ['#2E9E6B', '#FFFFFF'],
    'snorlax-active': ['#2A9D8F', '#FFFFFF'], 'jenny-active': ['#3A6FD8', '#FFFFFF'],
    'fishing-active': ['#2F8FCB', '#FFFFFF'], 'jigglypuff-active': ['#E86AA6', '#1A0A12'],
    'wobbu-active': ['#4F7FE0', '#FFFFFF'], 'fossil-active': ['#B7824A', '#1A1200'],
    'jessie-active': ['#C2185B', '#FFFFFF'], 'james-active': ['#5B5FC7', '#FFFFFF'],
    'meowth-active': ['#D9A21B', '#1A1200'], 'rescue-active': ['#E4572E', '#FFFFFF'],
    'challenge-select-active': ['#6C4AB6', '#FFFFFF'],
    'giovanni-active': ['#F2B42C', '#1A1200'], 'ninja-active': ['#8A4FB8', '#FFFFFF'],
    'cooking-active': ['#E08A1E', '#1A1200'],
  },
  NO_PAUSE: new Set(['challenge-select-active']),
  // Full-screen scenes size themselves to the screen and hide the shared header;
  // they get the compact top bar only.
  SCENES: new Set(['snorlax-active', 'rocket-rescue-active', 'fossil-active']),
  NAMES: {
    officer_jenny: 'Officer Jenny', prof_oak: 'Prof. Oak', jessi: 'Jessie', ltsurge: 'Lt. Surge',
    snorlax_block: 'Snorlax', koga: 'Koga', meowth: 'Meowth', james: 'James', wobbuffet: 'Wobbuffet',
  },
  ICON: {
    leave: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    pause: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M9 5v14M15 5v14"/></svg>',
    speak: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
  },
  key: null,

  init() {
    if (typeof MiniGameSession === 'undefined') return;
    const install = MiniGameSession.install.bind(MiniGameSession);
    MiniGameSession.install = () => { install(); this.attach(MiniGameSession.key, MiniGameSession.screen); };
    const stop = MiniGameSession.stop.bind(MiniGameSession);
    MiniGameSession.stop = () => { stop(); this.detach(); };
    // Team Rocket's word, spelling and coin quizzes never opened a session, so
    // they had no pause/help. Give them one (and therefore the shell).
    if (typeof TeamRocketChallenge !== 'undefined') {
      for (const [method, key] of [['_showJessie', 'jessie-active'], ['_showJames', 'james-active'], ['_showMeowth', 'meowth-active']]) {
        const original = TeamRocketChallenge[method];
        if (typeof original !== 'function') continue;
        TeamRocketChallenge[method] = function (...args) { const r = original.apply(this, args); MiniGameSession.begin(key); return r; };
      }
      Object.assign(MiniGameSession.guides, {
        'jessie-active': ['Learn a new word', 'Read the word, or tap the speaker to hear it.', 'Pick the meaning that fits best. You can take your time.'],
        'james-active': ['Fix the spelling', 'Say the word slowly and listen for the missing sound.', 'Tap the letters that complete the word.'],
        'meowth-active': ['Count the coins', 'Read the question, then count or add the amounts.', 'Pick the total. The speaker reads the question aloud.'],
      });
    }
    // The challenge picker shares the challenge screen; give it the same frame.
    if (typeof ChallengeSelectEngine !== 'undefined') {
      const start = ChallengeSelectEngine.start;
      ChallengeSelectEngine.start = function (...args) {
        const r = start.apply(this, args);
        const after = () => { GameShell.attach('challenge-select-active', 'challenge'); GameShell.tagChoices(); };
        if (r?.then) return r.then(v => { after(); return v; });
        after(); return r;
      };
    }
    this.watch();
    this.speakers();
  },

  // Colour-code picker cards by the skill they train, using the menu data.
  tagChoices() {
    const cards = document.querySelectorAll('#screen-challenge .cs-card:not(.cs-skip-card)');
    const menu = typeof CHALLENGE_SELECT_MENU !== 'undefined' ? CHALLENGE_SELECT_MENU : [];
    const SKILL = typeof SKILL_OF_GAME !== 'undefined' ? SKILL_OF_GAME : {};
    const LABEL = { time: 'Time', money: 'Money', counting: 'Counting', sorting: 'Sorting', comparison: 'Comparing', math: 'Maths', reading: 'Reading', spelling: 'Spelling' };
    cards.forEach(card => {
      const name = card.querySelector('.cs-card-name')?.textContent.trim();
      const item = menu.find(m => m.name === name);
      if (!item) return;
      const [accent, on] = this.ACCENTS[`${item.key}-active`] || this.ACCENTS[item.type?.replace('_node', '') + '-active'] || ['#6C4AB6', '#FFFFFF'];
      card.style.setProperty('--card-accent', accent);
      card.style.setProperty('--card-on-accent', on);
      const skill = LABEL[SKILL[item.key]];
      if (skill && !card.querySelector('.cs-skill')) {
        const tag = document.createElement('span');
        tag.className = 'cs-skill'; tag.textContent = skill;
        card.prepend(tag);
      }
    });
  },

  screenEl() { return document.getElementById('screen-challenge'); },

  attach(key, screen) {
    this.key = key;
    const scr = this.screenEl();
    if (!scr || screen !== 'challenge' || !key || this.SKIP.has(key)) { this.detach(); return; }
    // Some activities stop themselves on any class change while their screen is
    // not yet active (mid-transition), so only add the shell class once it is.
    if (!scr.classList.contains('active')) {
      this._pending?.disconnect();
      this._pending = new MutationObserver(() => {
        if (!scr.classList.contains('active')) return;
        this._pending.disconnect(); this._pending = null;
        if (this.key === key) this.attach(key, screen);
      });
      this._pending.observe(scr, { attributes: true, attributeFilter: ['class'] });
      return;
    }
    const [accent, onAccent] = this.ACCENTS[key] || ['#2A9D8F', '#FFFFFF'];
    scr.style.setProperty('--mg-accent', accent);
    scr.style.setProperty('--mg-on-accent', onAccent);
    scr.dataset.shellMode = this.SCENES.has(key) ? 'scene' : 'panel';
    scr.classList.add('mg-shell');
    this.bar();
    document.getElementById('mg-topbar').querySelector('.mgtb-pause').hidden = this.NO_PAUSE.has(key);
    this.refresh();
  },

  detach() {
    this.key = null;
    this._pending?.disconnect(); this._pending = null;
    const scr = this.screenEl();
    if (!scr) return;
    scr.classList.remove('mg-shell');
    const bar = document.getElementById('mg-topbar');
    if (bar) bar.hidden = true;
    window.speechSynthesis?.cancel();
  },

  bar() {
    const scr = this.screenEl();
    let bar = document.getElementById('mg-topbar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'mg-topbar';
      bar.innerHTML = `<button type="button" class="mgtb-btn mgtb-leave" aria-label="Leave this game">${this.ICON.leave}</button>`
        + `<div class="mgtb-who"><span class="mgtb-face"><img alt="" /></span><span class="mgtb-titles"><b class="mgtb-name"></b><span class="mgtb-game"></span></span></div>`
        + `<div class="mgtb-pips" role="img"></div>`
        + `<button type="button" class="mgtb-btn mgtb-pause" aria-label="Pause and how to play">${this.ICON.pause}</button>`;
      scr.appendChild(bar);
      bar.querySelector('.mgtb-leave').onclick = () => document.getElementById('mg-quit-btn')?.click();
      bar.querySelector('.mgtb-pause').onclick = () => MiniGameSession.help();
      bar.querySelector('.mgtb-face img').onerror = e => { e.target.style.visibility = 'hidden'; };
    }
    bar.hidden = false;
    const text = document.querySelector('#screen-challenge .challenge-header-text');
    if (text && !text.querySelector('.mg-speak')) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mg-speak'; b.setAttribute('aria-label', 'Read aloud');
      b.innerHTML = this.ICON.speak;
      b.onclick = () => this.readChallenge();
      text.prepend(b);
    }
  },

  nameFromSrc(src) {
    const file = (src || '').split('/').pop().replace(/\.(png|jpe?g|webp|gif)$/i, '');
    if (!file) return '';
    if (this.NAMES[file]) return this.NAMES[file];
    if (/^\d+$/.test(file) && typeof OFFLINE_POKEMON !== 'undefined') {
      const n = OFFLINE_POKEMON[+file]?.name;
      if (n) return n.charAt(0).toUpperCase() + n.slice(1);
    }
    return file.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  },

  clean(text) {
    return (text || '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/\s+/g, ' ').trim();
  },

  progress(text) {
    const m = /(?:round|case|deal|wave|order|sequence|shape|question|word|layer|puzzle)\s*(\d+)\s*(?:\/|of)\s*(\d+)/i.exec(text)
      || /\b(\d+)\s*\/\s*(\d+)\b(?!\s*(?:ml|g\b))/i.exec(text);
    if (!m) return null;
    const cur = +m[1], total = +m[2];
    if (!total || total > 10 || cur > total) return null;
    return { cur, total };
  },

  refresh() {
    const bar = document.getElementById('mg-topbar');
    const scr = this.screenEl();
    if (!bar || !scr?.classList.contains('mg-shell')) return;
    const img = document.getElementById('challenge-character-img');
    const src = img?.getAttribute('src') || '';
    const badge = this.clean(document.getElementById('challenge-badge')?.textContent);
    const intro = this.clean(document.getElementById('challenge-intro')?.textContent);
    const face = bar.querySelector('.mgtb-face img');
    bar.querySelector('.mgtb-face').hidden = !src;
    if (src && face.getAttribute('src') !== src) { face.style.visibility = ''; face.src = src; }
    bar.querySelector('.mgtb-name').textContent = this.nameFromSrc(src) || 'Challenge';
    bar.querySelector('.mgtb-game').textContent = badge.replace(/[!—-]+\s*round.*$/i, '').replace(/[!.]+$/, '');
    const quit = document.getElementById('mg-quit-btn');
    bar.querySelector('.mgtb-leave').hidden = !quit || quit.style.display === 'none';
    const pips = bar.querySelector('.mgtb-pips');
    const p = this.progress(`${badge} ${intro}`);
    pips.innerHTML = '';
    if (p) {
      pips.setAttribute('aria-label', `Round ${p.cur} of ${p.total}`);
      for (let i = 1; i <= p.total; i++) {
        const s = document.createElement('span');
        s.className = 'mgtb-pip' + (i < p.cur ? ' done' : i === p.cur ? ' now' : '');
        pips.appendChild(s);
      }
    } else pips.removeAttribute('aria-label');
  },

  watch() {
    const targets = ['challenge-badge', 'challenge-intro', 'challenge-character-img'].map(id => document.getElementById(id)).filter(Boolean);
    let queued = false;
    const obs = new MutationObserver(() => {
      if (queued) return; queued = true;
      requestAnimationFrame(() => { queued = false; this.refresh(); });
    });
    targets.forEach(t => obs.observe(t, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['src', 'style'] }));
    const quit = () => document.getElementById('mg-quit-btn');
    new MutationObserver(() => { const q = quit(); if (q && !q._shellWatched) { q._shellWatched = true; obs.observe(q, { attributes: true, attributeFilter: ['style'] }); this.refresh(); } })
      .observe(this.screenEl() || document.body, { childList: true });
  },

  visibleText(el) {
    if (!el || el.offsetParent === null) return '';
    return this.clean(el.innerText || el.textContent);
  },

  readChallenge() {
    const root = document.querySelector('#screen-challenge .challenge-panel');
    if (!root) return;
    const parts = [this.visibleText(document.getElementById('challenge-intro'))];
    const prompt = root.querySelector('#challenge-question:not(:empty), [class*="-say"], [class*="question"]:not(#challenge-question), [class*="prompt"], .jenny-report');
    parts.push(this.visibleText(prompt));
    const word = document.getElementById('jessie-word-display');
    parts.push(this.visibleText(word));
    const answers = [...root.querySelectorAll('.challenge-answer-btn, .togepi-opt-btn, .clair-choice, .blaine-choice-btn')]
      .map(b => this.visibleText(b)).filter(Boolean);
    if (answers.length) parts.push('Choices: ' + answers.join('. '));
    this.speak(parts.filter(Boolean).join('. '));
  },

  speak(text) {
    const synth = window.speechSynthesis;
    if (!synth || !text) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\s*\/\s*/g, ' out of '));
    u.lang = 'en-GB'; u.rate = 0.92; u.pitch = 1.05;
    synth.speak(u);
  },

  // Read-aloud on the shared intro dialogue (gym leaders, activity hosts) and
  // the badge ceremony, so every character line can be heard.
  speakers() {
    const add = (host, getText, label) => {
      if (!host || host.querySelector('.mg-speak')) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mg-speak'; b.setAttribute('aria-label', label);
      b.innerHTML = this.ICON.speak;
      b.onclick = e => { e.stopPropagation(); this.speak(this.clean(getText())); };
      host.prepend(b);
    };
    add(document.getElementById('trainer-dialogue'), () => document.getElementById('dialogue-text')?.textContent, 'Read what they say');
    add(document.querySelector('#screen-badge .badge-centre'), () => {
      const f = document.getElementById('badge-farewell')?.textContent || '';
      return f;
    }, 'Read the leader’s words');
  },
};

// Gym scene helpers — the city card, leader intro and badge ceremony share one
// layout: the gym's own background art, the leader standing large, a cream
// speech bubble and the eight-badge progress row.
const GymScene = {
  ACCENTS: ['#B98A4E', '#2F8FCB', '#E0B21E', '#3FA36B', '#8A4FB8', '#C04F9E', '#E4572E', '#6B7F3A'],
  accent(idx) { return this.ACCENTS[Math.max(0, idx) % this.ACCENTS.length]; },
  background(el, idx) {
    if (!el) return;
    const data = getGymData()[idx] || {};
    el.style.background = data.bgFallback || '';
    if (data.bgImage) {
      const url = `assets/backgrounds/${data.bgImage}`;
      const probe = new Image();
      probe.onload = () => { el.style.background = `linear-gradient(180deg, rgba(8,14,24,.18) 0%, rgba(8,14,24,0) 30%, rgba(8,14,24,.55) 78%, rgba(8,14,24,.85) 100%), url('${url}') center / cover no-repeat`; };
      probe.src = url;
    }
  },
  gyms() {
    const max = (typeof getRegionData === 'function' && getRegionData()?.maxBosses) || 8;
    return getGymData().slice(0, max);
  },
  pips(host, earned, justEarned) {
    if (!host) return;
    const gyms = this.gyms();
    host.innerHTML = '';
    host.setAttribute('aria-label', `${earned} of ${gyms.length} badges`);
    gyms.forEach((g, i) => {
      const s = document.createElement('span');
      s.className = 'gym-pip' + (i < earned ? ' earned' : '') + (i === justEarned ? ' new' : '');
      s.textContent = i < earned ? (g.badge || '●') : '';
      host.appendChild(s);
    });
  },
};

document.addEventListener('DOMContentLoaded', () => GameShell.init());

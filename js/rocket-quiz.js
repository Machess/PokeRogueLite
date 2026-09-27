const JESSIE_WORDS = {
  1: [ // Tier 1 — age 6-7: simple virtues and positive traits
    {
      word: 'brave', pos: 'adjective',
      correct: 'Not scared, even when things are hard',
      wrong: [
        'Staying safe and avoiding all dangerous places',
        'Feeling proud of yourself and showing it off',
        'Trying very hard but feeling very tired after',
      ],
      example: 'The brave trainer walked into the dark cave without hesitating.',
      jessie: 'BRAVE? Why, that is practically my middle name! No one faces Team Rocket\'s setbacks more bravely than I do!',
    },
    {
      word: 'kind', pos: 'adjective',
      correct: 'Caring about others and wanting to help them',
      wrong: [
        'Working very hard to get what you want most',
        'Being very cheerful and happy all of the time',
        'Staying quiet and not bothering anyone at all',
      ],
      example: 'The kind trainer shared their lunch with a hungry Growlithe.',
      jessie: 'Kind... I am actually very kind. I let James keep his bottle caps, don\'t I?',
    },
    {
      word: 'gentle', pos: 'adjective',
      correct: 'Soft, calm and careful with others around you',
      wrong: [
        'Moving quickly and getting things done right away',
        'Feeling very excited and full of energy today',
        'Being very sure of yourself and your abilities',
      ],
      example: 'The gentle trainer carefully healed the injured Caterpie.',
      jessie: 'Gentle? I can be gentle! Watch how gently I demand everyone\'s Pokémon!',
    },
    {
      word: 'joyful', pos: 'adjective',
      correct: 'Very happy and full of delight inside yourself',
      wrong: [
        'Feeling tired but still trying to carry on well',
        'Being very focused on finishing an important task',
        'Staying calm and quiet even in a difficult moment',
      ],
      example: 'Pikachu was joyful when it saw its trainer after a long journey.',
      jessie: 'Joyful! Yes — I am JOYFUL every time I picture my glorious future as a Pokémon Master!',
    },
    {
      word: 'grateful', pos: 'adjective',
      correct: 'Feeling thankful for something good that happened',
      wrong: [
        'Feeling pleased with yourself after doing something well',
        'Being happy because something exciting is about to happen',
        'Feeling relieved that a difficult situation is now over',
      ],
      example: 'The trainer was grateful that her Pokémon worked so hard for her.',
      jessie: 'Grateful? I am deeply grateful for my magnificent hair. Every single day.',
    },
    {
      word: 'curious', pos: 'adjective',
      correct: 'Wanting to find out and learn about new things',
      wrong: [
        'Feeling worried that something might go badly wrong',
        'Being very careful not to make any silly mistakes',
        'Wanting to stay close to the things you already know',
      ],
      example: 'The curious Pikachu pressed its nose to every flower it passed.',
      jessie: 'Curious? I am endlessly curious — about treasure, about fame, about why James likes those bottle caps.',
    },
    {
      word: 'helpful', pos: 'adjective',
      correct: 'Ready and happy to do things for other people',
      wrong: [
        'Working very hard to be the best at everything done',
        'Being very organised and always following your own plan',
        'Staying cheerful and positive no matter what happens next',
      ],
      example: 'The helpful trainer showed the lost traveller the way to the Pokémon Centre.',
      jessie: 'Helpful! I could be very helpful — if helping led to fame, fortune, and Pikachu.',
    },
  ],
  2: [ // Tier 2 — age 8-9: character virtues
    {
      word: 'determined', pos: 'adjective',
      correct: 'Decided to do something and refusing to give up',
      wrong: [
        'Feeling very unsure about which choice to make next',
        'Wanting to do something but needing a lot of encouragement',
        'Being happy to try new things but quick to walk away',
      ],
      example: 'Ash was determined to become Pokémon Champion no matter what.',
      jessie: 'I am the most DETERMINED person in the world. I have tried to catch Pikachu over three hundred times!',
    },
    {
      word: 'courageous', pos: 'adjective',
      correct: 'Brave enough to face difficult or frightening challenges',
      wrong: [
        'Being very careful to avoid any situation that feels risky',
        'Working very hard to prepare before doing anything difficult',
        'Staying calm and quiet until the right moment finally comes',
      ],
      example: 'The courageous Charizard flew straight into the storm to save its trainer.',
      jessie: 'Courageous! That is exactly what I am. Magnificently, dazzlingly courageous!',
    },
    {
      word: 'generous', pos: 'adjective',
      correct: 'Happy to give and share with others without being asked',
      wrong: [
        'Working very carefully to make sure everything is shared fairly',
        'Being thoughtful about others but always keeping enough for yourself',
        'Feeling very proud when other people notice how much you give',
      ],
      example: 'The generous trainer gave Poké Balls to every young trainer she met.',
      jessie: 'Generous... I once let James keep an entire sandwich. I am practically a saint.',
    },
    {
      word: 'patient', pos: 'adjective',
      correct: 'Able to wait calmly for things without getting upset',
      wrong: [
        'Working very quickly so that nothing has to wait for long',
        'Being very organised so that everything happens on a schedule',
        'Staying very quiet about your feelings even when things are hard',
      ],
      example: 'The patient trainer trained her Magikarp every day for months.',
      jessie: 'Patient? I have been patiently waiting for success my ENTIRE career. Years, people. Years.',
    },
    {
      word: 'faithful', pos: 'adjective',
      correct: 'Loyal and always there for the people you care about',
      wrong: [
        'Being very honest about everything even when it is uncomfortable',
        'Working hard to make sure everyone around you feels respected',
        'Caring deeply about fairness and always standing up for what is right',
      ],
      example: 'Pikachu was faithful to Ash even when things were very difficult.',
      jessie: 'Faithful! Wobuffet has been faithfully by my side for years. I could learn from Wobuffet.',
    },
    {
      word: 'humble', pos: 'adjective',
      correct: 'Quietly confident without needing to boast or show off',
      wrong: [
        'Being very kind and thoughtful about what other people are feeling',
        'Working hard behind the scenes so that no one else has to struggle',
        'Staying calm and sensible even when everyone around you is panicking',
      ],
      example: 'The humble Champion thanked every trainer who helped her along the way.',
      jessie: 'Humble... I will be humble once I am rich, famous and Champion. Then I will be the humblest person alive.',
    },
    {
      word: 'triumphant', pos: 'adjective',
      correct: 'Feeling great joy and pride after winning or succeeding',
      wrong: [
        'Feeling very relieved that something difficult is finally finished',
        'Being pleased with yourself even though things did not go perfectly',
        'Staying grateful and calm even after achieving something really important',
      ],
      example: 'Ash felt triumphant when he finally defeated the Gym Leader.',
      jessie: 'TRIUMPHANT! One day — one glorious day — that word will describe ME. I can feel it.',
    },
  ],
  3: [ // Tier 3 — age 10-12: wisdom and deeper virtues
    {
      word: 'perseverance', pos: 'noun',
      correct: 'Continuing with courage and effort even when things are very hard',
      wrong: [
        'Caring deeply about others and working hard to ease their pain',
        'Being completely honest with yourself and others about your weaknesses',
        'Staying calm and thinking clearly even when everything feels chaotic',
      ],
      example: 'Ash showed perseverance by training every single day, no matter what.',
      jessie: 'Perseverance is the story of my LIFE. I have never — not once — given up. That is practically heroic.',
    },
    {
      word: 'compassion', pos: 'noun',
      correct: 'Caring deeply about others and wanting to ease their suffering',
      wrong: [
        'Continuing bravely with your goals even when things get very difficult',
        'Standing up clearly for what is right even when it costs you something',
        'Thinking carefully before acting so that you never accidentally cause harm',
      ],
      example: 'The nurse showed compassion by staying up all night to heal the injured Pokémon.',
      jessie: 'Compassion... I show compassion every single day by not blasting James into the stratosphere. That counts.',
    },
    {
      word: 'resilient', pos: 'adjective',
      correct: 'Able to recover and grow even stronger after facing hard times',
      wrong: [
        'Being very careful to prepare well so that hard times never occur',
        'Staying completely calm and unmoved even when everything falls apart',
        'Working very hard every day so that you never feel tired or defeated',
      ],
      example: 'A resilient trainer learns something valuable from every single defeat.',
      jessie: 'Team Rocket is the most resilient organisation in history. We return. Every. Single. Time.',
    },
    {
      word: 'wisdom', pos: 'noun',
      correct: 'Deep understanding of life earned through experience and reflection',
      wrong: [
        'The ability to remember very large amounts of information very quickly',
        'Being very intelligent in a way that helps solve complicated problems',
        'Knowing exactly how to act quickly and decisively in a difficult moment',
      ],
      example: 'The wise Elder Pokémon trainer had learned something from every battle she ever fought.',
      jessie: 'Wisdom! I have accumulated an enormous amount of wisdom. Mostly about what NOT to do. Still counts.',
    },
    {
      word: 'gracious', pos: 'adjective',
      correct: 'Polite, kind and dignified especially in moments of victory or loss',
      wrong: [
        'Being completely honest and straightforward even when the truth is painful',
        'Staying confident and calm no matter what other people say about you',
        'Working quietly and carefully so that other people get most of the credit',
      ],
      example: 'The gracious Champion shook hands with every trainer she defeated.',
      jessie: 'Gracious? I am the most gracious loser who has ever existed. I lose with STYLE.',
    },
    {
      word: 'steadfast', pos: 'adjective',
      correct: 'Firm and unwavering in your loyalty to what truly matters most',
      wrong: [
        'Being very flexible and ready to change direction whenever things shift',
        'Staying calm and balanced even when you are being pulled in many ways',
        'Working very hard to understand every side of a complicated situation',
      ],
      example: 'The steadfast Lucario stood beside its trainer through every challenge.',
      jessie: 'Steadfast! I have been steadfastly pursuing Pikachu for years. Steadfast is practically my title.',
    },
    {
      word: 'honourable', pos: 'adjective',
      correct: 'Doing what is right and fair even when it is difficult or costly',
      wrong: [
        'Being very careful to follow all of the rules so that no one complains',
        'Working very hard to be successful in a way that everyone will admire',
        'Staying completely loyal to the people you care about no matter the cost',
      ],
      example: 'The honourable trainer returned the Poké Ball she found, even though she needed it.',
      jessie: 'Honourable... you know, deep down, I actually do know the difference between right and wrong. Deep, deep down.',
    },
  ],
};

// ─── JAMES SPELLING BANK ─────────────────────────────────────────────────────
const JAMES_WORDS = {
  1: [
    {
      clue: 'A very good friend',
      correct: 'friend', blanks: [2], options: ['i','e','a','o'],
      james: 'I wrote "frend" on Jessie\'s birthday card. She was not impressed. Wobuffet nodded anyway.',
    },
    {
      clue: 'The place where you learn',
      correct: 'school', blanks: [1], options: ['c','k','q','ch'],
      james: 'I spelled it "skool" on the Team Rocket mission plan. The Boss circled it three times.',
    },
    {
      clue: 'Not the same as something else',
      correct: 'different', blanks: [4], options: ['e','a','i','o'],
      james: '"Diffrent"... that looked perfectly correct to me. Wobuffet nodded. We were both wrong.',
    },
    {
      clue: 'Very beautiful and impressive',
      correct: 'wonderful', blanks: [1], options: ['o','u','a','e'],
      james: 'I wrote "wunderfull day" in my diary. That felt right at the time. It was not right.',
    },
    {
      clue: 'To help someone who is in trouble',
      correct: 'rescue', blanks: [3], options: ['c','s','k','qu'],
      james: 'Our motto says we "reskew" Pokémon. Jessie says that is embarrassing. She is right.',
    },
    {
      clue: 'A long and exciting trip',
      correct: 'journey', blanks: [0], options: ['j','g','d','y'],
      james: 'I wrote "jurney" in my travel log. Wobuffet looked at it very carefully. Then nodded.',
    },
    {
      clue: 'Full of brightness and light',
      correct: 'shining', blanks: [4], options: ['i','n','ni','nn'],
      james: 'I described my rose as "shinning" in a poem. Jessie said it was the worst poem she had ever read.',
    },
  ],
  2: [
    {
      clue: 'When something happens unexpectedly and delightfully',
      correct: 'surprise', blanks: [1], options: ['u','ou','a','e'],
      james: 'I planned a "suprise party" for Jessie. She was not surprised by my spelling.',
    },
    {
      clue: 'Absolutely, for certain, without any doubt',
      correct: 'definitely', blanks: [4, 7], options: ['n','a','e','i'],
      james: '"Definately" looked right to me! Jessie says I am definitely, one hundred percent, wrong.',
    },
    {
      clue: 'Not together — kept apart from each other',
      correct: 'separate', blanks: [2], options: ['p','pp','b','v'],
      james: 'There is "a rat" hiding in "sep-a-rat-e"! That trick saved me. Wobuffet was very pleased.',
    },
    {
      clue: 'A time of great happiness shared with others',
      correct: 'celebration', blanks: [7], options: ['t','s','sh','ti'],
      james: 'I organised a Team Rocket "celebrasion". Jessie said that was not a word. She was correct.',
    },
    {
      clue: 'Something that is truly amazing and impressive',
      correct: 'magnificent', blanks: [8], options: ['e','a','i','o'],
      james: 'I described my rose as "magnifisent". Jessie corrected me. I wrote it down twelve times.',
    },
    {
      clue: 'Keeping going bravely even when things are hard',
      correct: 'persisting', blanks: [6], options: ['i','t','tt','st'],
      james: 'I wrote "persistting through failure" in my journal. Two Ts was... not correct.',
    },
    {
      clue: 'Able to be trusted completely',
      correct: 'reliable', blanks: [3], options: ['i','y','ia','ie'],
      james: 'I told the Boss I was "relible". He did not look convinced. The spelling did not help.',
    },
  ],
  3: [
    {
      clue: 'Something that fills you with wonder and amazement',
      correct: 'magnificent', blanks: [8, 10], options: ['e','t','a','i'],
      james: 'I described my Victreebel as "magnifisent". It promptly ate my hat. Wobuffet nodded.',
    },
    {
      clue: 'Showing great courage and bravery',
      correct: 'courageous', blanks: [7], options: ['o','e','i','a'],
      james: '"Couragious" — I was so sure. Two whole Es. Jessie sighed. I wrote it out twenty times.',
    },
    {
      clue: 'A place to stay overnight, like a hotel',
      correct: 'accommodation', blanks: [4], options: ['m','mm','n','c'],
      james: 'Our Team Rocket "acomodation" was a tent in the rain. The spelling was the least of our problems.',
    },
    {
      clue: 'Knowing the difference between right and wrong',
      correct: 'conscience', blanks: [3], options: ['s','sc','c','ss'],
      james: 'Even Team Rocket has a "consience". I think about this more than Jessie does. Wobuffet agrees.',
    },
    {
      clue: 'Continuing bravely no matter how hard things get',
      correct: 'perseverance', blanks: [8], options: ['a','e','i','o'],
      james: '"Perseverence" — I had it almost right! One letter! Wobuffet patted me on the head.',
    },
    {
      clue: 'Something that is absolutely necessary',
      correct: 'essential', blanks: [5], options: ['t','c','sh','s'],
      james: 'My rose is "essencial" to my outfit. Wait — is that right? Jessie says no. Jessie is right.',
    },
    {
      clue: 'Feeling and showing that you are thankful',
      correct: 'grateful', blanks: [0], options: ['gr','gre','gra','g'],
      james: 'I wrote Jessie a "greatful" thank-you note. She corrected it in red pen and handed it back.',
    },
  ],
};

// ─── TEAM ROCKET CHALLENGE DISPATCHER ────────────────────────────────────────

const TeamRocketChallenge = {
  _onComplete: null,
  _type: null,     // 'meowth' | 'jessie' | 'james'
  _challenge: null,

  // Trigger check — called after every node completion (not just battles).
  // Rules:
  //   • Hard cooldown of 2 nodes after any Rocket event (never consecutive)
  //   • Guaranteed trigger at nodesSinceRocket >= 4
  //   • 40% random chance between 2 and 4
  //   • Boss nodes never trigger a Rocket event
  shouldTrigger(nodeType) {
    if (nodeType === 'boss') return false; // never interrupt the boss moment

    if (!GameState.nodesSinceRocket) GameState.nodesSinceRocket = 0;
    GameState.nodesSinceRocket++;

    if (GameState.nodesSinceRocket < 3) return false;       // hard cooldown
    if (GameState.nodesSinceRocket >= 5) return true;       // guaranteed
    return Math.random() < 0.40;                            // 40% between 3–4
  },

  // Pick a random character and show their challenge
  show(onComplete) {
    this._onComplete = onComplete;
    // Wobbuffet is a Johto-only encounter; Kanto uses the original trio.
    // 'runner' is the Dig Dash escape mini-game — available in both regions.
    const chars = (GameState.region === 'johto')
      ? ['meowth', 'jessie', 'james', 'wobbuffet', 'runner']
      : ['meowth', 'jessie', 'james', 'runner'];
    const pool  = chars.filter(c => c !== this._type);
    this._type  = pool[Math.floor(Math.random() * pool.length)];
    GameState.nodesSinceRocket = 0;

    if (this._type === 'meowth')     this._showMeowth();
    else if (this._type === 'jessie') this._showJessie();
    else if (this._type === 'runner') {
      RocketRunnerEngine._onComplete = this._onComplete;
      RocketRunnerEngine.start({ type:'runner', idx: GameState.currentNodeIndex, row: 0 });
    }
    else if (this._type === 'wobbuffet') {
      // WobbuffetEngine uses the boss-screen intro flow
      const fakeNode = { type:'wobbuffet_node', idx: GameState.currentNodeIndex, row: 0 };
      WobbuffetEngine._onComplete = this._onComplete;
      WobbuffetEngine.start(fakeNode);
    }
    else this._showJames();
  },

  // ── Shared render helpers ─────────────────────────────────────────────────

  _setHeader(imgSrc, badgeText, introText) {
    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = imgSrc; img.alt = this._type; img.style.display = ''; }
    const badge = document.getElementById('challenge-badge');
    if (badge) badge.textContent = badgeText;
    const intro = document.getElementById('challenge-intro');
    if (intro) intro.textContent = introText;
    const coin = document.getElementById('challenge-coin-visual');
    if (coin) { coin.style.display = 'none'; coin.innerHTML = ''; coin.className = 'challenge-coin-visual'; }
    const word = document.getElementById('jessie-word-display');
    if (word) {
      word.style.display = 'none';
      word.innerHTML     = '';           // clear James/Fishing/Jigglypuff content
      word.className     = 'jessie-word-display'; // reset any overridden class
    }
    const result = document.getElementById('challenge-result');
    if (result) { result.style.display = 'none'; result.innerHTML = ''; result.className = 'challenge-result'; }
    const cont = document.getElementById('challenge-continue-btn');
    if (cont) cont.style.display = 'none';
    const q = document.getElementById('challenge-question');
    if (q) { q.textContent = ''; q.style.display = ''; }
    const btns = document.getElementById('challenge-answer-btns');
    if (btns) btns.innerHTML = '';
  },

  _renderAnswerBtns(choices, answerFn) {
    const btns = document.getElementById('challenge-answer-btns');
    btns.innerHTML = '';
    choices.forEach(val => {
      const b = document.createElement('button');
      b.className = 'challenge-answer-btn';
      b.textContent = val;
      b.addEventListener('click', () => answerFn(val));
      btns.appendChild(b);
    });
  },

  _showResult(isRight, correctLabel, explanation, characterQuote) {
    const name = GameState.trainerName || 'Trainer';
    const resultEl = document.getElementById('challenge-result');
    resultEl.style.display = 'block';

    // Highlight answer buttons
    document.querySelectorAll('.challenge-answer-btn').forEach(b => {
      b.disabled = true;
      if (b.textContent === correctLabel) b.classList.add('answer-correct');
      else if (!isRight && b.classList.contains('answer-selected')) b.classList.add('answer-wrong');
    });

    if (isRight) {
      const bonus = { 1: 5, 2: 8, 3: 12 }[GameState.difficultyTier || 2];
      GameState.gold = (GameState.gold || 0) + bonus;
      resultEl.className = 'challenge-result result-correct';
      resultEl.innerHTML =
        `✅ <strong>Correct, ${name}!</strong><br>${explanation}<br>` +
        `You earned <strong>+${bonus}🪙</strong>!<br><em>"${characterQuote}"</em>`;
      SoundEngine.playFanfare();
    } else {
      GameState.gold = (GameState.gold || 0) + 2;
      resultEl.className = 'challenge-result result-wrong';
      resultEl.innerHTML =
        `❌ <strong>The answer is: ${correctLabel}</strong><br>${explanation}<br>` +
        `You still get <strong>+2🪙</strong> for trying, ${name}!<br><em>"${characterQuote}"</em>`;
    }
    document.getElementById('challenge-continue-btn').style.display = 'block';
    saveGame();
  },

  // ── MEOWTH ────────────────────────────────────────────────────────────────

  _showMeowth() {
    const name  = GameState.trainerName || 'Trainer';
    const tier  = GameState.difficultyTier || 2;
    this._challenge = generateMathChallenge(tier);

    this._setHeader('assets/meowth.png', '💰 Meowth\'s Coin Challenge!',
      `Hey ${name}! Meowth keeps losing count of Giovanni's coins! Help out! 😾`);

    // Coin visual for tier 1
    const cv = document.getElementById('challenge-coin-visual');
    if (this._challenge.coins && tier === 1) {
      const { a, b, op } = this._challenge.coins;
      cv.innerHTML =
        `<div class="coin-group">${'🪙'.repeat(a)}</div>` +
        `<div class="coin-op">${op === '+' ? '➕' : '➖'}</div>` +
        `<div class="coin-group">${'🪙'.repeat(b)}</div>`;
      cv.style.display = 'flex';
    }

    const _mqEl = document.getElementById('challenge-question');
    _mqEl.textContent  = this._challenge.question;
    _mqEl.style.display = '';

    this._renderAnswerBtns(this._challenge.choices, (val) => {
      const correct  = this._challenge.correct;
      const isRight  = val === correct;
      // Mark selected before showResult so highlight works
      document.querySelectorAll('.challenge-answer-btn').forEach(b => {
        if (parseInt(b.textContent) === val) b.classList.add('answer-selected');
      });
      const explanation = isRight
        ? `${correct} is exactly right! NYAH!`
        : `Let me count again: the answer is ${correct}.`;
      const quote = isRight
        ? `The Boss will be so impressed! Maybe I'll get a raise! — Meowth`
        : `Even Meowth gets confused sometimes! Don't worry! — Meowth`;
      this._showResult(isRight, String(correct), explanation, quote);
    });

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.remove(...CHALLENGE_CLASSES);
    document.getElementById('screen-challenge').classList.add('meowth-active');
    SoundEngine.playBGM('teamrocket_battle.mp3');
  },

  // ── JESSIE ────────────────────────────────────────────────────────────────

  _showJessie() {
    const name  = GameState.trainerName || 'Trainer';
    const tier  = GameState.difficultyTier || 2;
    const pool  = JESSIE_WORDS[tier] || JESSIE_WORDS[2];
    const entry = pool[Math.floor(Math.random() * pool.length)];
    this._challenge = entry;

    this._setHeader('assets/jessi.png', '✨ Jessie\'s Word Challenge!',
      `${name}! Jessie found a word she doesn't know. Help her impress the Boss! 💄`);

    // Rebuild jessie-word and jessie-word-type inside the display
    // (_setHeader clears jessie-word-display.innerHTML so child IDs are gone)
    const wordDisplayEl = document.getElementById('jessie-word-display');
    if (wordDisplayEl) {
      wordDisplayEl.style.display = 'flex';
      wordDisplayEl.innerHTML = `
        <div class="jessie-word" id="jessie-word">${entry.word.toUpperCase()}</div>
        <div class="jessie-word-type" id="jessie-word-type">(${entry.pos})</div>`;
    }

    const qEl = document.getElementById('challenge-question');
    if (qEl) qEl.textContent = `What does "${entry.word}" mean?`;

    const choices = shuffle([entry.correct, ...entry.wrong]);
    this._renderAnswerBtns(choices, (val) => {
      document.querySelectorAll('.challenge-answer-btn').forEach(b => {
        if (b.textContent === val) b.classList.add('answer-selected');
      });
      const isRight = val === entry.correct;
      const explanation = isRight
        ? `"${entry.word}" means: ${entry.correct}. Example: ${entry.example}`
        : `"${entry.word}" means: ${entry.correct}. Example: ${entry.example}`;
      this._showResult(isRight, entry.correct, explanation, entry.jessie);
    });

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.remove(...CHALLENGE_CLASSES);
    document.getElementById('screen-challenge').classList.add('jessie-active');
    SoundEngine.playBGM('teamrocket_battle.mp3');
  },

  // ── JAMES ─────────────────────────────────────────────────────────────────

  _showJames() {
    const name  = GameState.trainerName || 'Trainer';
    const tier  = GameState.difficultyTier || 2;
    const pool  = JAMES_WORDS[tier] || JAMES_WORDS[2];
    const entry = pool[Math.floor(Math.random() * pool.length)];
    this._challenge  = entry;
    this._jamesFills = {};  // blankIdx → chosen letter

    this._setHeader('assets/james.png', '📝 James\'s Spelling Challenge!',
      `${name}! James is writing the motto but he can't spell! Tap the missing letters! 🌹`);

    // Build the word display with blank slots
    const wordEl = document.getElementById('jessie-word-display');
    wordEl.style.display = 'flex';
    wordEl.innerHTML = '';

    // Split correct word into letter spans, blank the target indices
    const letters = entry.correct.split('');
    const blankSet = new Set(entry.blanks);

    // word-build container
    const buildWrap = document.createElement('div');
    buildWrap.className = 'james-word-build';
    buildWrap.id        = 'james-word-build';

    letters.forEach((letter, i) => {
      if (blankSet.has(i)) {
        const slot = document.createElement('span');
        slot.className    = 'james-letter-slot empty';
        slot.dataset.idx  = i;
        slot.dataset.correct = letter;
        slot.textContent  = '_';
        buildWrap.appendChild(slot);
      } else {
        const fixed = document.createElement('span');
        fixed.className   = 'james-letter-fixed';
        fixed.textContent = letter;
        buildWrap.appendChild(fixed);
      }
    });
    wordEl.appendChild(buildWrap);

    // Clue below the word
    const clueEl = document.createElement('div');
    clueEl.className   = 'james-clue';
    clueEl.textContent = `"${entry.clue}"`;
    wordEl.appendChild(clueEl);

    // Letter tap buttons
    const btnArea = document.getElementById('challenge-answer-btns');
    btnArea.innerHTML = '';
    const shuffledOpts = shuffle([...entry.options]);
    shuffledOpts.forEach(opt => {
      const b = document.createElement('button');
      b.className   = 'james-letter-btn';
      b.textContent = opt;
      b.addEventListener('click', () => this._jamesTapLetter(opt, entry));
      btnArea.appendChild(b);
    });

    document.getElementById('challenge-question').style.display = 'none';
    document.getElementById('challenge-result').style.display   = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.remove(...CHALLENGE_CLASSES);
    document.getElementById('screen-challenge').classList.add('james-active');
    SoundEngine.playBGM('teamrocket_battle.mp3');
  },

  _jamesTapLetter(chosen, entry) {
    // Find the next unfilled blank slot
    const slots = document.querySelectorAll('.james-letter-slot.empty');
    if (!slots.length) return;
    const slot = slots[0];
    const correctLetter = slot.dataset.correct;
    const blankIdx      = parseInt(slot.dataset.idx);
    const isRight       = chosen.toLowerCase() === correctLetter.toLowerCase();

    slot.textContent = chosen;
    slot.classList.remove('empty');

    if (isRight) {
      slot.classList.add('correct');
      this._jamesFills[blankIdx] = true;
    } else {
      slot.classList.add('wrong');
      // Show correct letter after brief shake
      setTimeout(() => {
        slot.textContent = correctLetter;
        slot.classList.remove('wrong');
        slot.classList.add('corrected');
        this._jamesFills[blankIdx] = false;
      }, 600);
    }

    // Check if all blanks filled
    const remaining = document.querySelectorAll('.james-letter-slot.empty');
    if (remaining.length === 0) {
      setTimeout(() => this._jamesComplete(entry), 700);
    }
  },

  _jamesComplete(entry) {
    // Did they get all blanks right on first try?
    const allRight = Object.values(this._jamesFills).every(v => v === true);
    const explanation = `The correct spelling is "${entry.correct}". ${entry.james}`;
    this._showResult(allRight, entry.correct, explanation, entry.james);
    // Show letter buttons as disabled
    document.querySelectorAll('.james-letter-btn').forEach(b => b.disabled = true);
  },

  finish() {
    const sc = document.getElementById('screen-challenge');
    if (sc) sc.classList.remove(...CHALLENGE_CLASSES);
    showScreen('map');
    MapEngine.renderParty();
    if (this._onComplete) { this._onComplete(); this._onComplete = null; }
  },
};

// Keep MeowthChallenge as an alias so existing CardReward.close still works
const MeowthChallenge = TeamRocketChallenge;

// ─── LEVEL-UP SYSTEM ─────────────────────────────────────────────────────────

// Awards +1 level to every living party member after a battle or training node.
// Returns an array of evolution descriptors for any starters that crossed a threshold:
// { partyIdx, beforeId, afterId, stage, narrative }
// Awards +1 level to every living party member.
// Checks the starter for evolution thresholds — fires whenever level >= threshold,
// regardless of whether it just crossed or was already past it.
// Returns at most ONE evolution descriptor per call.

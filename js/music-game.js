const JIGGLYPUFF_NOTES = [
  { id:'C',  freq:261.63, color:'#ff4444', label:'C',  labelFull:'C4'  },
  { id:'D',  freq:293.66, color:'#ff8c00', label:'D',  labelFull:'D4'  },
  { id:'E',  freq:329.63, color:'#ffd700', label:'E',  labelFull:'E4'  },
  { id:'G',  freq:392.00, color:'#44cc44', label:'G',  labelFull:'G4'  },
  { id:'A',  freq:440.00, color:'#4488ff', label:'A',  labelFull:'A4'  },
  { id:'C2', freq:523.25, color:'#8844ff', label:'C\'', labelFull:'C5'  },
  { id:'D2', freq:587.33, color:'#ff44cc', label:'D\'', labelFull:'D5'  },
];

// Synthesise a note using Web Audio API
// ─── SHARED WEB AUDIO CONTEXT ────────────────────────────────────────────────
// One AudioContext reused for all notes — browsers limit simultaneous contexts.
let _audioCtx = null;
function _getAudioCtx() {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

// ─── INSTRUMENT SOUND SYNTHESIS ──────────────────────────────────────────────

function playNoteFreq(freq, duration = 0.45, volume = 0.35) {
  // Piano sound — triangle oscillator + attack + vibrato (soft singing tone)
  _playPiano(freq, duration, volume);
}

function _playPiano(freq, duration, volume = 0.35) {
  try {
    const ctx = _getAudioCtx();
    const now = ctx.currentTime;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    const vibrato     = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.value = 5.5;
    vibratoGain.gain.value  = 6;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02); // fast attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain); gain.connect(ctx.destination);
    vibrato.start(now); osc.start(now);
    vibrato.stop(now + duration); osc.stop(now + duration);
  } catch(e) {}
}

function _playGuitar(freq, duration) {
  // Karplus-Strong plucked string synthesis
  try {
    const ctx        = _getAudioCtx();
    const now        = ctx.currentTime;
    const bufferSize = Math.round(ctx.sampleRate / freq);
    const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data       = buffer.getChannelData(0);
    // Fill buffer with white noise
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Averaging lowpass filter — smooths noise into a tone
    const delay  = ctx.createDelay();
    delay.delayTime.value = 1 / freq;

    const lpf    = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = freq * 3;

    const gain   = ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + Math.max(duration, 1.2));

    source.connect(delay); delay.connect(lpf); lpf.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
    source.stop(now + Math.max(duration, 1.2));
  } catch(e) {}
}

function _playCello(freq, duration) {
  // Bowed string — sawtooth + lowpass + slow attack + tremolo
  try {
    const ctx  = _getAudioCtx();
    const now  = ctx.currentTime;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const lpf  = ctx.createBiquadFilter();

    // Tremolo (bow wavering ~6 Hz)
    const trem      = ctx.createOscillator();
    const tremGain  = ctx.createGain();
    trem.frequency.value = 6;
    tremGain.gain.value  = 0.08;
    trem.connect(tremGain); tremGain.connect(gain.gain);

    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    lpf.type = 'lowpass';
    lpf.frequency.value = freq * 4;
    lpf.Q.value = 1.2;

    // Slow bow attack
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.12);
    gain.gain.setValueAtTime(0.35, now + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);

    osc.connect(lpf); lpf.connect(gain); gain.connect(ctx.destination);
    trem.start(now); osc.start(now);
    trem.stop(now + duration); osc.stop(now + duration);
  } catch(e) {}
}

// Route note playback through the selected instrument
function playNoteForInstrument(freq, duration = 0.45) {
  const inst = JigglypuffEngine._instrument || 'piano';
  if (inst === 'guitar') _playGuitar(freq, duration);
  else if (inst === 'cello') _playCello(freq, duration);
  else _playPiano(freq, duration);
}

function playWrongBuzz() {
  try {
    const ctx  = _getAudioCtx();
    const now  = ctx.currentTime;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 140;
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.18);
  } catch(e) {}
}

// ─── KNOWN SONGS FOR JIGGLYPUFF ──────────────────────────────────────────────
// Notes mapped to JIGGLYPUFF_NOTES indices: C=0 D=1 E=2 G=3 A=4 C'=5 D'=6
// All transposed to fit the pentatonic scale C D E G A C' D'.
// durations[] optional — note hold time in seconds (defaults to 0.45).
const JIGGLYPUFF_SONGS = [
  // ── Tier 1 — Piano songs (clean, educational) ─────────────────────────────
  {
    name: 'Twinkle Twinkle', tier: 1, instrument: 'piano',
    phrases: [
      { notes:[0,0,3,3,4,4,3],        durations:[0.4,0.4,0.4,0.4,0.4,0.4,0.7] },
      { notes:[1,1,2,2,1,1,0],        durations:[0.4,0.4,0.4,0.4,0.4,0.4,0.7] },
      { notes:[3,3,1,1,2,2,1],        durations:[0.4,0.4,0.4,0.4,0.4,0.4,0.7] },
    ],
    notes:[0,0,3,3,4,4,3],
    durations:[0.4,0.4,0.4,0.4,0.4,0.4,0.7],
    intro: 'La la la~ ♪ You know this one!',
  },
  {
    name: 'Mary Had a Little Lamb', tier: 1, instrument: 'piano',
    phrases: [
      { notes:[2,1,0,1,2,2,2,2],      durations:[0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.7] },
      { notes:[1,1,1,1,2,4,4,4],      durations:[0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.7] },
      { notes:[2,1,0,1,2,2,2,2],      durations:[0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.7] },
    ],
    notes:[2,1,0,1,2,2,2],
    durations:[0.4,0.4,0.4,0.4,0.4,0.4,0.7],
    intro: 'La la la~ ♪ Sing it with me!',
  },
  {
    name: 'Hot Cross Buns', tier: 1, instrument: 'piano',
    phrases: [
      { notes:[2,1,0,0,0,0,0,0],      durations:[0.45,0.45,0.7,0.25,0.25,0.25,0.25,0.7] },
      { notes:[2,1,0],                durations:[0.45,0.45,0.8] },
    ],
    notes:[2,1,0,2,1,0],
    durations:[0.45,0.45,0.7,0.45,0.45,0.7],
    intro: 'La la la~ ♪ Short and sweet!',
  },
  {
    name: 'Row Your Boat', tier: 1, instrument: 'guitar',
    phrases: [
      { notes:[0,0,0,1,2],            durations:[0.4,0.4,0.6,0.3,0.7] },
      { notes:[2,1,2,3,4],            durations:[0.3,0.3,0.3,0.3,0.7] },
      { notes:[4,4,4,3,3,3,2,2,2,0], durations:[0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.2,0.7] },
    ],
    notes:[0,0,0,1,2,2,1,2,3,4],
    durations:[0.4,0.4,0.5,0.3,0.4,0.25,0.3,0.3,0.3,0.7],
    intro: 'La la la~ ♪ Row along!',
  },
  // ── Tier 2 ────────────────────────────────────────────────────────────────
  {
    name: 'Ode to Joy', tier: 2, instrument: 'piano',
    phrases: [
      { notes:[2,2,3,5,5,3,2,1,0,0,1,2], durations:[0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.7] },
      { notes:[2,1,1,1,2,3,4,5,5,3,2,1], durations:[0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.7] },
    ],
    notes:[2,2,3,5,5,3,2,1,0,0,1,2],
    durations:[0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.7],
    intro: 'La la la~ ♪ Beethoven!',
  },
  {
    name: 'London Bridge', tier: 2, instrument: 'guitar',
    phrases: [
      { notes:[3,4,3,2,3,4,3],        durations:[0.4,0.4,0.4,0.7,0.4,0.4,0.7] },
      { notes:[2,3,2,1,2,0],          durations:[0.4,0.4,0.4,0.4,0.4,0.8] },
      { notes:[3,4,3,2,3,4,3],        durations:[0.4,0.4,0.4,0.7,0.4,0.4,0.7] },
    ],
    notes:[3,4,3,2,3,4,3,2,3,2,1,2,0],
    durations:[0.4,0.4,0.4,0.7,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.8],
    intro: 'La la la~ ♪ Is it falling down?',
  },
  {
    name: 'Happy Birthday', tier: 2, instrument: 'piano',
    phrases: [
      { notes:[3,3,4,3,5,4],          durations:[0.3,0.3,0.45,0.45,0.45,0.7] },
      { notes:[3,3,4,3,5,5],          durations:[0.3,0.3,0.45,0.45,0.45,0.7] },
    ],
    notes:[3,3,4,3,5,4,3,3,4,3,5,5],
    durations:[0.3,0.3,0.45,0.45,0.45,0.55,0.3,0.3,0.45,0.45,0.45,0.7],
    intro: 'La la la~ ♪ Happy happy!',
  },
  {
    name: 'Jingle Bells', tier: 2, instrument: 'guitar',
    phrases: [
      { notes:[2,2,2,2,2,2,2,3,0,1,2],   durations:[0.35,0.35,0.55,0.35,0.35,0.55,0.35,0.35,0.35,0.35,0.7] },
      { notes:[1,1,1,1,1,2,3,4,0,0,1,2,1], durations:[0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.35,0.7] },
    ],
    notes:[2,2,2,2,2,2,2,3,0,1,2],
    durations:[0.35,0.35,0.55,0.35,0.35,0.55,0.35,0.35,0.35,0.35,0.7],
    intro: 'La la la~ ♪ Jingle all the way!',
  },
  {
    name: 'Greensleeves', tier: 2, instrument: 'cello',
    phrases: [
      { notes:[4,0,1,2,4,3,2,0],      durations:[0.4,0.5,0.3,0.5,0.5,0.3,0.5,0.8] },
      { notes:[4,3,4,5,4,3,2,0],      durations:[0.4,0.5,0.3,0.5,0.5,0.3,0.5,0.8] },
    ],
    notes:[4,0,1,2,4,3,2,0,4,3,4,5,4,3,2,0],
    durations:[0.4,0.5,0.3,0.5,0.5,0.3,0.5,0.5,0.4,0.5,0.3,0.5,0.5,0.3,0.5,0.8],
    intro: 'La la la~ ♪ An old melody…',
  },
  // ── Tier 3 — Classical ─────────────────────────────────────────────────────
  {
    name: 'New World Symphony', tier: 3, instrument: 'cello',
    phrases: [
      { notes:[2,3,5,4,3,2,0,3,2],     durations:[0.5,0.3,0.6,0.5,0.3,0.5,0.3,0.5,0.8] },
      { notes:[2,3,5,4,3,2,0,0,3,2,0], durations:[0.5,0.3,0.6,0.5,0.3,0.5,0.3,0.3,0.5,0.3,0.9] },
    ],
    notes:[2,3,5,4,3,2,0,3,2],
    durations:[0.5,0.3,0.6,0.5,0.3,0.5,0.3,0.5,0.8],
    intro: 'La la la~ ♪ Dvořák…',
  },
  {
    name: 'Bach — Air', tier: 3, instrument: 'cello',
    phrases: [
      { notes:[3,5,4,3,2,1,0,1,2],    durations:[0.6,0.3,0.3,0.5,0.3,0.3,0.5,0.3,0.7] },
      { notes:[3,4,5,3,4,5,4,3,2],    durations:[0.4,0.3,0.5,0.4,0.3,0.5,0.3,0.3,0.8] },
    ],
    notes:[3,5,4,3,2,1,0,1,2],
    durations:[0.6,0.3,0.3,0.5,0.3,0.3,0.5,0.3,0.7],
    intro: 'La la la~ ♪ Bach…',
  },
  {
    name: 'Eine Kleine Nachtmusik', tier: 3, instrument: 'piano',
    phrases: [
      { notes:[3,3,3,1,3,5,3,1],       durations:[0.3,0.2,0.2,0.3,0.3,0.3,0.2,0.7] },
      { notes:[4,4,4,3,4,5,4,3],       durations:[0.3,0.2,0.2,0.3,0.3,0.3,0.2,0.7] },
      { notes:[5,3,4,0,5,3,1,0],       durations:[0.3,0.3,0.3,0.5,0.3,0.3,0.3,0.8] },
    ],
    notes:[3,3,3,1,3,5,3,1],
    durations:[0.3,0.2,0.2,0.3,0.3,0.3,0.2,0.7],
    intro: 'La la la~ ♪ Mozart!',
  },
];
const JigglypuffEngine = {
  _node:          null,
  _sequence:      [],
  _playerPos:     0,
  _noteCount:     0,
  _replayPenalty: false,
  _songName:      null,
  _songDurations: null,
  _songIntro:     null,
  _instrument:    'piano',   // 'piano' | 'guitar' | 'cello'
  _phraseMode:    false,     // full song in phrases
  _phrases:       [],        // array of {notes, durations}
  _phraseIdx:     0,         // current phrase being played/reproduced

  start(node) {
    MiniGameSession.begin("jigglypuff-active");
    this._slowPlayback = false;
    this._node        = node;
    this._playerPos   = 0;
    this._phraseMode  = false;
    this._phrases     = [];
    this._phraseIdx   = 0;
    this._songName    = null;
    this._songDurations = null;
    const tier        = GameState.difficultyTier || 2;
    const beaten      = GameState.bossesDefeated || 0;
    const notePool    = tier <= 1 ? 5 : tier === 2 ? 6 : 7;

    // ── Doubled sequence lengths ──────────────────────────────────────────────
    const seqLen = tier <= 1
      ? 4       // 6-8
      : tier === 2
      ? 6      // 8-10
      : 8;    // 10-14
    this._replayPenalty = false;

    // ── Song vs random ────────────────────────────────────────────────────────
    const songPool = JIGGLYPUFF_SONGS.filter(s => s.tier <= tier);
    const useSong  = tier <= 1 || (tier === 2 && Math.random() < 0.5);

    if (useSong && songPool.length > 0) {
      const song = songPool[Math.floor(Math.random() * songPool.length)];
      this._songName   = song.name;
      this._songIntro  = song.intro;
      this._instrument = song.instrument || 'piano';  // assigned per song

      if (song.phrases && song.phrases.length > 1) {
        this._phraseMode    = true;
        this._phrases       = song.phrases;
        this._phraseIdx     = 0;
        this._sequence      = [...song.phrases[0].notes];
        this._songDurations = [...song.phrases[0].durations];
        // Store full song for final celebration
        this._allPhrases    = song.phrases;
      } else {
        this._sequence      = [...song.notes];
        this._songDurations = song.durations || null;
        this._allPhrases    = null;
      }
    } else {
      this._instrument = 'piano';  // random sequences always piano
      this._allPhrases = null;
      this._sequence = [];
      for (let i = 0; i < seqLen; i++) {
        this._sequence.push(Math.floor(Math.random() * notePool));
      }
      this._songIntro = 'La la la~ ♪ Listen carefully — this one\'s all mine!';
    }

    // ── Setup challenge screen ────────────────────────────────────────────────
    const img = document.getElementById('challenge-character-img');
    if (img) { img.src = 'assets/jigglypuff.png'; img.style.display = ''; }
    document.getElementById('challenge-badge').textContent   = this._songName
      ? `🎵 ${this._songName}` : '🎵 Jigglypuff\'s Song!';
    document.getElementById('challenge-intro').textContent   = 'Listen carefully and play along!';
    document.getElementById('challenge-result').style.display       = 'none';
    document.getElementById('challenge-continue-btn').style.display = 'none';
    document.getElementById('challenge-question').style.display     = 'none';
    const _jwd = document.getElementById('jessie-word-display');
    if (_jwd) { _jwd.style.display = 'none'; _jwd.innerHTML = ''; _jwd.className = 'jessie-word-display'; }
    document.getElementById('challenge-answer-btns').innerHTML = '';

    const cv = document.getElementById('challenge-coin-visual');
    cv.style.display = 'block';
    cv.className     = 'jigglypuff-wrap';
    cv.innerHTML = `
      <div class="jigglypuff-sprite-area" id="jiggly-sprite-area">
        <img src="assets/jiglypuff.png" class="jiggly-img" id="jiggly-img"
             onerror="this.onerror=null;this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/39.png'" alt="Jigglypuff"/>
        <div class="jiggly-listen-msg" id="jiggly-msg">${this._songIntro || '🎵 Listen…'}</div>
      </div>
      ${this._songName ? `<div class="jiggly-song-label" id="jiggly-song-label">♪ ${this._songName}</div>` : ''}
      ${this._phraseMode ? `<div class="jiggly-phrase-bar" id="jiggly-phrase-bar"></div>` : ''}
      <div class="jiggly-seq-bar" id="jiggly-seq-bar"></div>`;

    this._buildSeqBar();
    if (this._phraseMode) this._buildPhraseBar();

    showScreen('challenge');
    document.getElementById('screen-challenge').classList.remove(...CHALLENGE_CLASSES);
    document.getElementById('screen-challenge').classList.add('jigglypuff-active');
    SoundEngine.stopBGM();

    // Play sequence after brief intro delay — no picker
    MiniGameSession.later(() => this._playSequence(() => this._showInstrument()), 900);
  },

  // ── Phrase bar (shows song structure) ────────────────────────────────────
  _buildPhraseBar() {
    const bar = document.getElementById('jiggly-phrase-bar');
    if (!bar) return;
    bar.innerHTML = '';
    this._phrases.forEach((_, i) => {
      const pip = document.createElement('div');
      pip.className = 'jiggly-phrase-pip' + (i === this._phraseIdx ? ' jiggly-phrase-active' : i < this._phraseIdx ? ' jiggly-phrase-done' : '');
      pip.textContent = i < this._phraseIdx ? '✓' : (i + 1);
      bar.appendChild(pip);
    });
  },

  _buildSeqBar() {
    const bar = document.getElementById('jiggly-seq-bar');
    if (!bar) return;
    bar.innerHTML = '';
    this._sequence.forEach((noteIdx, i) => {
      const dot = document.createElement('div');
      dot.className    = 'jiggly-dot jiggly-dot-pending';
      dot.id           = `jiggly-dot-${i}`;
      dot.style.setProperty('--note-color', JIGGLYPUFF_NOTES[noteIdx].color);
      const tier = GameState.difficultyTier || 2;
      dot.textContent  = tier <= 2 ? JIGGLYPUFF_NOTES[noteIdx].label : '';
      bar.appendChild(dot);
    });
  },

  _playSequence(onDone) {
    this._listening=true;
    const msgEl = document.getElementById('jiggly-msg');
    if (msgEl) msgEl.textContent = this._slowPlayback?'Listen slowly…':'Listen…';
    const jiggly = document.getElementById('jiggly-img');

    let i = 0;
    const playNext = () => {
      if (i >= this._sequence.length) {
        this._listening=false;
        if (onDone) MiniGameSession.later(onDone, 400);
        return;
      }
      const noteIdx = this._sequence[i];
      const note    = JIGGLYPUFF_NOTES[noteIdx];
      const dot     = document.getElementById(`jiggly-dot-${i}`);
      if (dot) dot.classList.add('jiggly-dot-playing');
      if (jiggly) jiggly.classList.add('jiggly-puff');

      const dur = (this._songDurations && this._songDurations[i]) ? this._songDurations[i] : 0.45;
      playNoteForInstrument(note.freq, dur);
      const holdMs = Math.round(dur * 1000 * (this._slowPlayback?1.6:1)) + 35;

      MiniGameSession.later(() => {
        if (dot) dot.classList.remove('jiggly-dot-playing');
        if (jiggly) jiggly.classList.remove('jiggly-puff');
        i++;
        MiniGameSession.later(playNext, 150);
      }, holdMs);
    };
    playNext();
  },

  // Routes to the correct instrument UI
  _showInstrument() {
    const inst = this._instrument || 'piano';
    if (inst === 'guitar') this._showGuitar();
    else if (inst === 'cello') this._showCello();
    else this._showPiano();
  },

  _showPiano() {
    this._playerPos = 0;
    const msgEl = document.getElementById('jiggly-msg');
    if (msgEl) msgEl.textContent = '🎵 Your turn!';
    const jiggly = document.getElementById('jiggly-img');
    if (jiggly) jiggly.classList.add('jiggly-bounce');

    const btnArea = document.getElementById('challenge-answer-btns');
    btnArea.innerHTML = '';
    this._appendReplayBtn(btnArea);

    const tier     = GameState.difficultyTier || 2;
    const notePool = tier <= 1 ? 5 : tier === 2 ? 6 : 7;

    // Full piano octave — always 9 white keys for visual consistency.
    // noteIdx -1 = non-playable white key (F or B)
    // noteIdx >= notePool = locked (visible but dimmed, not yet unlocked)
    const WHITE_KEYS = [
      { pos:0, noteIdx:0  },  // C  ← playable
      { pos:1, noteIdx:1  },  // D  ← playable
      { pos:2, noteIdx:2  },  // E  ← playable
      { pos:3, noteIdx:-1 },  // F  ← not in pentatonic, inactive
      { pos:4, noteIdx:3  },  // G  ← playable
      { pos:5, noteIdx:4  },  // A  ← playable
      { pos:6, noteIdx:-1 },  // B  ← not in pentatonic, inactive
      { pos:7, noteIdx:5  },  // C' ← playable (tier 2+)
      { pos:8, noteIdx:6  },  // D' ← playable (tier 3)
    ];

    // Black key positions: always 6 black keys for a full octave
    // placed after white key positions 0,1, skip 2 (E-F gap), 3,4,5, skip 6 (B-C gap)
    const BLACK_AFTER_POS = [0, 1, 3, 4, 5]; // C# D# F# G# A# — 5 black keys per octave

    const KEY_W  = 44; // white key width
    const KEY_GAP = 4; // gap between white keys

    const pianoWrap = document.createElement('div');
    pianoWrap.className = 'jiggly-piano-wrap';

    const pianoEl = document.createElement('div');
    pianoEl.className = 'jiggly-piano';

    // Always render all 9 white keys
    WHITE_KEYS.forEach(wk => {
      const note      = wk.noteIdx >= 0 ? JIGGLYPUFF_NOTES[wk.noteIdx] : null;
      const inPool    = note !== null && wk.noteIdx < notePool;
      const inactive  = note === null;   // F or B — not in pentatonic
      const locked    = note !== null && wk.noteIdx >= notePool; // beyond current tier

      const btn = document.createElement('button');
      if (inactive) {
        btn.className = 'jiggly-key jiggly-white-key jiggly-key-inactive';
      } else if (locked) {
        btn.className = 'jiggly-key jiggly-white-key jiggly-key-locked';
      } else {
        btn.className = 'jiggly-key jiggly-white-key jiggly-key-playable';
        btn.style.setProperty('--key-color', note.color);
        btn.dataset.noteIdx = wk.noteIdx;
        btn.innerHTML = `<span class="jiggly-key-label">${tier <= 2 ? note.label : note.labelFull}</span>`;
        btn.addEventListener('click', () => { _getAudioCtx(); this._playerTap(wk.noteIdx); });
      }
      pianoEl.appendChild(btn);
    });

    // Overlay black keys — always 5 per octave, anchored to white key positions
    const blackEl = document.createElement('div');
    blackEl.className = 'jiggly-black-keys';
    BLACK_AFTER_POS.forEach(afterPos => {
      const bk = document.createElement('div');
      bk.className = 'jiggly-black-key';
      // Each white key occupies (KEY_W + KEY_GAP) px. Black key centres between two whites.
      bk.style.left = ((afterPos + 1) * (KEY_W + KEY_GAP) - 14) + 'px';
      blackEl.appendChild(bk);
    });

    pianoWrap.appendChild(pianoEl);
    pianoWrap.appendChild(blackEl);
    btnArea.appendChild(pianoWrap);
    if (jiggly) MiniGameSession.later(() => jiggly.classList.remove('jiggly-bounce'), 600);
  },

  _showGuitar() {
    this._playerPos = 0;
    const msgEl = document.getElementById('jiggly-msg');
    if (msgEl) msgEl.textContent = '🎸 Pluck the strings!';

    const btnArea = document.getElementById('challenge-answer-btns');
    btnArea.innerHTML = '';
    this._appendReplayBtn(btnArea);

    const tier     = GameState.difficultyTier || 2;
    const notePool = tier <= 1 ? 5 : tier === 2 ? 6 : 7;
    const guitarEl = document.createElement('div');
    guitarEl.className = 'jiggly-guitar';

    JIGGLYPUFF_NOTES.slice(0, notePool).forEach((note, idx) => {
      const string = document.createElement('button');
      string.className = 'jiggly-string';
      string.style.setProperty('--str-color', note.color);
      string.dataset.noteIdx = idx;
      string.innerHTML = `
        <div class="jiggly-string-line"></div>
        <span class="jiggly-string-label">${tier <= 2 ? note.label : note.labelFull}</span>`;
      string.addEventListener('click', () => {
        _getAudioCtx();
        string.classList.add('jiggly-string-pluck');
        MiniGameSession.later(() => string.classList.remove('jiggly-string-pluck'), 500);
        this._playerTap(idx);
      });
      guitarEl.appendChild(string);
    });
    btnArea.appendChild(guitarEl);
  },

  _showCello() {
    this._playerPos = 0;
    const msgEl = document.getElementById('jiggly-msg');
    if (msgEl) msgEl.textContent = '🎻 Bow the strings!';

    const btnArea = document.getElementById('challenge-answer-btns');
    btnArea.innerHTML = '';
    this._appendReplayBtn(btnArea);

    const tier     = GameState.difficultyTier || 2;
    const notePool = tier <= 1 ? 5 : tier === 2 ? 6 : 7;
    const celloEl  = document.createElement('div');
    celloEl.className = 'jiggly-cello';

    JIGGLYPUFF_NOTES.slice(0, notePool).forEach((note, idx) => {
      const string = document.createElement('button');
      string.className = 'jiggly-cello-string';
      string.style.setProperty('--str-color', note.color);
      string.dataset.noteIdx = idx;
      string.innerHTML = `
        <div class="jiggly-cello-line"></div>
        <div class="jiggly-cello-bow-glow"></div>
        <span class="jiggly-string-label">${tier <= 2 ? note.label : note.labelFull}</span>`;
      string.addEventListener('click', () => {
        _getAudioCtx();
        string.classList.add('jiggly-cello-bowing');
        MiniGameSession.later(() => string.classList.remove('jiggly-cello-bowing'), 700);
        this._playerTap(idx);
      });
      celloEl.appendChild(string);
    });
    btnArea.appendChild(celloEl);
  },

  _appendReplayBtn(btnArea) {
    const penaltyMsg = this._replayPenalty ? ' (-5💰)' : '';
    const replayBtn  = document.createElement('button');
    replayBtn.className   = 'jiggly-replay-btn';
    replayBtn.textContent = `🎵 Hear again${penaltyMsg}`;
    replayBtn.addEventListener('click', () => {
      if(this._listening)return;this._slowPlayback=false;
      _getAudioCtx();
      if (this._replayPenalty && (GameState.gold || 0) >= 5) GameState.gold -= 5;
      this._playerPos = 0;
      this._buildSeqBar();
      this._playSequence(() => this._showInstrument());
    });
    const slow=document.createElement('button');slow.className='jiggly-replay-btn';slow.textContent='Listen slowly';slow.onclick=()=>{if(this._listening)return;this._slowPlayback=true;this._playerPos=0;this._buildSeqBar();this._playSequence(()=>this._showInstrument());};btnArea.appendChild(slow);
    btnArea.appendChild(replayBtn);
  },

  _playerTap(noteIdx) {
    if(this._listening||MiniGameSession.reasons.size)return;
    const expected = this._sequence[this._playerPos];
    const note     = JIGGLYPUFF_NOTES[noteIdx];
    playNoteForInstrument(note.freq, 0.35);

    const dot    = document.getElementById(`jiggly-dot-${this._playerPos}`);
    const jiggly = document.getElementById('jiggly-img');

    if (noteIdx === expected) {
      if (dot) { dot.classList.remove('jiggly-dot-pending'); dot.classList.add('jiggly-dot-correct'); }
      if (jiggly) { jiggly.classList.add('jiggly-nod'); MiniGameSession.later(() => jiggly.classList.remove('jiggly-nod'), 400); }
      this._playerPos++;
      if (this._playerPos >= this._sequence.length) {
        MiniGameSession.later(() => this._complete(), 400);
      }
    } else {
      playWrongBuzz();
      if (dot) { dot.classList.add('jiggly-dot-wrong'); MiniGameSession.later(() => dot.classList.remove('jiggly-dot-wrong'), 500); }
      if (jiggly) { jiggly.classList.add('jiggly-ears'); MiniGameSession.later(() => jiggly.classList.remove('jiggly-ears'), 600); }
      const msgEl = document.getElementById('jiggly-msg');
      if (msgEl) { msgEl.textContent = '😣 Try again!'; MiniGameSession.later(() => { if (msgEl) msgEl.textContent = '🎵 Your turn!'; }, 700); }
    }
  },

  _complete() {
    const jiggly = document.getElementById('jiggly-img');
    if (jiggly) jiggly.classList.add('jiggly-spin');
    const msgEl = document.getElementById('jiggly-msg');

    // ── Phrase mode — advance to next phrase ─────────────────────────────────
    if (this._phraseMode && this._phraseIdx < this._phrases.length - 1) {
      this._phraseIdx++;
      const nextPhrase = this._phrases[this._phraseIdx];
      this._sequence      = [...nextPhrase.notes];
      this._songDurations = nextPhrase.durations || null;
      this._playerPos     = 0;

      if (jiggly) MiniGameSession.later(() => jiggly.classList.remove('jiggly-spin'), 600);
      if (msgEl) msgEl.textContent = `✓ Phrase ${this._phraseIdx}! Next one…`;

      this._buildSeqBar();
      this._buildPhraseBar();

      // Quick celebration of completed phrase, then play next
      let ci = 0;
      const celebPhrase = () => {
        if (ci >= this._sequence.length) {
          MiniGameSession.later(() => this._playSequence(() => this._showInstrument()), 500);
          return;
        }
        playNoteForInstrument(JIGGLYPUFF_NOTES[this._sequence[ci]].freq, 0.28);
        ci++; MiniGameSession.later(celebPhrase, 260);
      };
      MiniGameSession.later(celebPhrase, 300);
      return;
    }

    // ── All done — play FULL SONG then show victory ───────────────────────────
    if (msgEl) msgEl.textContent = '🎵 ★ Complete! ★';
    if (jiggly) { jiggly.classList.add('jiggly-spin'); MiniGameSession.later(() => jiggly.classList.remove('jiggly-spin'), 800); }

    // Mark all current dots as complete
    this._sequence.forEach((_, i) => {
      const dot = document.getElementById(`jiggly-dot-${i}`);
      if (dot) dot.classList.add('jiggly-dot-complete');
    });

    // Build the full celebration sequence — all phrases concatenated
    let fullNotes = [];
    let fullDurs  = [];
    if (this._allPhrases && this._allPhrases.length > 1) {
      this._allPhrases.forEach(p => {
        fullNotes = fullNotes.concat(p.notes);
        fullDurs  = fullDurs.concat(p.durations || p.notes.map(() => 0.38));
      });
      if (msgEl) MiniGameSession.later(() => { if (msgEl) msgEl.textContent = '🎵 Full song…'; }, 400);
    } else {
      fullNotes = [...this._sequence];
      fullDurs  = this._songDurations || fullNotes.map(() => 0.38);
    }

    // Play the full song, then show modal
    let fi = 0;
    const playFull = () => {
      if (fi >= fullNotes.length) {
        MiniGameSession.later(() => this._finish(), 500);
        return;
      }
      const note = JIGGLYPUFF_NOTES[fullNotes[fi]];
      if (note) playNoteForInstrument(note.freq, fullDurs[fi] || 0.38);
      const holdMs = Math.round((fullDurs[fi] || 0.38) * 1000) + 60;
      fi++;
      MiniGameSession.later(playFull, holdMs);
    };
    MiniGameSession.later(playFull, 600);
  },

  _finish() {
    const goldBase   = 20 + (GameState.bossesDefeated || 0) * 5;
    const allCorrect = this._sequence.every((_, i) => {
      const dot = document.getElementById(`jiggly-dot-${i}`);
      return dot && dot.classList.contains('jiggly-dot-correct');
    });
    const isRight  = this._playerPos >= this._sequence.length;

    let goldReward = 0, title = '', msg = '';

    if (!isRight) {
      // Loss: sleep + 0 energy next battle
      if (!GameState.pendingPlayerStatuses) GameState.pendingPlayerStatuses = [];
      GameState.pendingPlayerStatuses.push('sleep_0energy');
      goldReward = Math.floor(goldBase * 0.2);
      title = '🎵 Jigglypuff is upset!';
      msg   = `+${goldReward}💰\n\n💤 Your lead Pokémon will start the next battle ASLEEP with 0 energy — Jigglypuff's revenge!\n\n"La… la… la…" — Jigglypuff (disappointed)`;
    } else if (allCorrect) {
      // Perfect: all party get auto-revive effect
      goldReward = goldBase;
      if (!GameState.pendingPlayerEffects) GameState.pendingPlayerEffects = {};
      GameState.pendingPlayerEffects.battleHp = Math.floor(
        GameState.party[GameState.activePokemonIndex]?.maxHp * 0.5 || 40
      );
      title = '🎵 ★ Perfect Song! ★';
      msg   = `+${goldReward}💰 · +1 level!\n\n💤 Jigglypuff's lullaby grants your lead an auto-revive for the next battle!${this._songName ? `\n\nYou sang "${this._songName}" perfectly!` : ''}\n\n"La la LA la la~" — Jigglypuff (overjoyed)`;
    } else {
      // Normal win: just the auto-revive
      goldReward = Math.floor(goldBase * 0.7);
      if (!GameState.pendingPlayerEffects) GameState.pendingPlayerEffects = {};
      GameState.pendingPlayerEffects.battleHp = Math.floor(
        GameState.party[GameState.activePokemonIndex]?.maxHp * 0.35 || 25
      );
      title = '🎵 Song Complete!';
      msg   = `+${goldReward}💰 · +1 level!\n\n💤 Jigglypuff sang your lead to sleep — they'll auto-revive once if they faint next battle!${this._songName ? `\n\nThat was "${this._songName}" — well done!` : ''}\n\n"La la la la la~" — Jigglypuff`;
    }

    GameState.gold = (GameState.gold || 0) + goldReward;
    if (isRight) {
      const poke = GameState.party[GameState.activePokemonIndex];
      if (poke) { poke.level++; poke.maxHp += 8; poke.hp = Math.min(poke.maxHp, poke.hp + 8); }
    }

    document.getElementById('screen-challenge').classList.remove('jigglypuff-active');
    const cv = document.getElementById('challenge-coin-visual');
    cv.innerHTML = ''; cv.className = 'challenge-coin-visual';
    saveGame();
    showModal(title, msg, () => { MapEngine.completeNode(GameState.currentNodeIndex); MapEngine.show(); });
  },
};

// ─── CHALLENGE SELECT ENGINE — player picks which mini-game to play ──────────


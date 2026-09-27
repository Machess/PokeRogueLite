const POKEDEX_KEY  = 'pokerogue_pokedex_v1';   // legacy — suffixed per-profile below
const PROFILES_KEY = 'pokerogue_profiles_v1';   // index of all profiles (metadata only)
const MAX_PROFILES = 3;

// ── Active profile (in-memory, also backed by sessionStorage) ─────────────────
let activeProfile = null;  // profile key string e.g. 'alice' or 'alice_1718000000'

function setActiveProfile(key) {
  activeProfile = key;
  try { sessionStorage.setItem('pokerogue_active_profile', key); } catch(e) {}
}
function getActiveProfile() {
  if (activeProfile) return activeProfile;
  try { return sessionStorage.getItem('pokerogue_active_profile') || null; } catch(e) { return null; }
}

// ── Per-profile key builders ───────────────────────────────────────────────────
function saveKey(p)    { return `pokerogue_save_v1_${p}`; }
function unlockKey(p)  { return `pokerogue_unlock_v1_${p}`; }
function pokedexKey(p) { return `pokerogue_pokedex_v1_${p}`; }

// ── Save / load run ───────────────────────────────────────────────────────────
let _saveDebounceTimer = null;
function saveGame(immediate = false) { return SaveManager.write(); }
function loadGame() { return SaveManager.load(); }
function deleteSave() {
  const p = getActiveProfile();
  if (!p) return;
  try { localStorage.removeItem(saveKey(p)); localStorage.removeItem(saveKey(p)+'_backup'); SaveManager.nodeCheckpoint=null; } catch(e) {}
  // Explicitly clear the flag — save no longer exists
  const profiles = loadProfiles();
  const meta = profiles.find(pr => pr.key === p);
  if (meta) { meta.hasActiveSave = false; saveProfiles(profiles); }
}

// ── Unlocks ───────────────────────────────────────────────────────────────────
function loadUnlocks() {
  const p = getActiveProfile();
  if (!p) return { pikachu: false, miniGamesUnlocked: [] };
  try {
    const d = JSON.parse(localStorage.getItem(unlockKey(p)) || '{}');
    if (!d.miniGamesUnlocked) d.miniGamesUnlocked = [];
    return d;
  } catch(e) { return { pikachu: false, miniGamesUnlocked: [] }; }
}
function saveUnlocks(unlocks) {
  const p = getActiveProfile();
  if (!p) return;
  try { localStorage.setItem(unlockKey(p), JSON.stringify(unlocks)); } catch(e) {}
}

// ── Pokédex ───────────────────────────────────────────────────────────────────
function loadPokedex() {
  const p = getActiveProfile();
  if (!p) return {};
  try {
    const d = localStorage.getItem(pokedexKey(p));
    return d ? JSON.parse(d) : {};
  } catch(e) { return {}; }
}
function savePokedex(dex) {
  const p = getActiveProfile();
  if (!p) return;
  try { localStorage.setItem(pokedexKey(p), JSON.stringify(dex)); } catch(e) {}
}

// ── Profiles index ────────────────────────────────────────────────────────────
function loadProfiles() {
  try {
    const d = localStorage.getItem(PROFILES_KEY);
    return d ? JSON.parse(d) : [];
  } catch(e) { return []; }
}
function saveProfiles(profiles) {
  try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); } catch(e) {}
}

// Update the metadata card for a profile (called after save/delete)
function _updateProfileMeta(profileKey, saveConfirmed = true) {
  const profiles = loadProfiles();
  const idx = profiles.findIndex(p => p.key === profileKey);
  if (idx < 0) return;
  const meta = profiles[idx];
  meta.lastSaved = Date.now();
  if (GameState) {
    meta.bossesDefeated  = GameState.bossesDefeated || 0;
    meta.starterId       = GameState.starterId || null;
    meta.trainerAge      = GameState.trainerAge      || 10;
    meta.difficultyTier  = GameState.difficultyTier  || 2;
    meta.trainerName     = GameState.trainerName     || meta.name || '';
    const starter = GameState.party?.find(p => p.isStarter);
    if (starter?.spriteUrl) meta.starterSprite = starter.spriteUrl;
    // Only claim an active save when the write was actually verified
    if (saveConfirmed) meta.hasActiveSave = true;
  }
  saveProfiles(profiles);
}

// Create a new profile entry
function createProfile(name) {
  const profiles = loadProfiles();
  if (profiles.length >= MAX_PROFILES) return null;
  // Build a unique key: lowercase name + timestamp suffix if collision
  let key = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'trainer';
  if (profiles.find(p => p.key === key)) key += '_' + Date.now().toString().slice(-6);
  const meta = {
    key, name,
    starterId:      null,
    starterSprite:  '',
    bossesDefeated: 0,
    hasActiveSave:  false,
    lastSaved:      Date.now(),
  };
  profiles.push(meta);
  saveProfiles(profiles);
  return meta;
}

function deleteProfile(profileKey) {
  try { localStorage.removeItem(saveKey(profileKey)); localStorage.removeItem(saveKey(profileKey)+'_backup'); }   catch(e) {}
  try { localStorage.removeItem(unlockKey(profileKey)); } catch(e) {}
  try { localStorage.removeItem(pokedexKey(profileKey)); }catch(e) {}
  const profiles = loadProfiles().filter(p => p.key !== profileKey);
  saveProfiles(profiles);
  if (getActiveProfile() === profileKey) {
    activeProfile = null;
    try { sessionStorage.removeItem('pokerogue_active_profile'); } catch(e) {}
  }
}

function registerPokedex(id, name, spriteUrl, caught = false, type = null) {
  const dex = loadPokedex();
  if (!dex[id] || (caught && !dex[id].caught)) {
    dex[id] = {
      id, name, spriteUrl,
      caught: caught || !!dex[id]?.caught,
      seen:   true,
      type:   type || dex[id]?.type || null,
    };
    savePokedex(dex);
  } else if (type && !dex[id].type) {
    // Backfill type if we now know it but didn't before
    dex[id].type = type;
    savePokedex(dex);
  }
}



// ─── GAME STATE ───────────────────────────────────────────────────────────────


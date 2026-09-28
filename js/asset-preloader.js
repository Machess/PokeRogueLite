/* Preload before a run. Card blobs live in IndexedDB, not localStorage or a huge decoded-image array. */
const AssetPreloader = {
  ready: false, pending: null, db: null, states: new Map(), memory: new Map(), report: null,
  async database() {
    if (this.db) return this.db;
    if (!globalThis.indexedDB) return null;
    return new Promise(resolve => {
      const request = indexedDB.open('poketrials-card-art-v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('images');
      request.onsuccess = () => { this.db = request.result; resolve(this.db); };
      request.onerror = request.onblocked = () => resolve(null);
    });
  },
  async read(key) {
    if (this.memory.has(key)) return this.memory.get(key);
    const db = await this.database(); if (!db) return null;
    return new Promise(resolve => {
      try { const r = db.transaction('images').objectStore('images').get(key); r.onsuccess = () => resolve(r.result || null); r.onerror = () => resolve(null); }
      catch (_) { resolve(null); }
    });
  },
  async write(key, blob) {
    const db = await this.database();
    const stored = db && await new Promise(resolve => {
      try { const tx = db.transaction('images', 'readwrite'); tx.objectStore('images').put(blob, key); tx.oncomplete = () => resolve(true); tx.onerror = tx.onabort = () => resolve(false); }
      catch (_) { resolve(false); }
    });
    // If storage is restricted, retain only a small bounded cache; HTTP cache remains the fallback.
    if (!stored) { this.memory.set(key, blob); while (this.memory.size > 24) this.memory.delete(this.memory.keys().next().value); }
    return !!stored;
  },
  sources(extra = []) {
    const records = Object.values(TCG_CATALOG.species).flatMap(s => Object.values(s));
    const decks = (typeof GameState !== 'undefined' ? GameState?.party || [] : []).flatMap(p => p.deck || []);
    const all = records.concat(extra, decks.map(c => c.source).filter(Boolean));
    return [...new Map(all.filter(s => s?.image || s?.localImage).map(s => [s.image || s.localImage, s])).values()];
  },
  image(url, signal, timeout = 12000) {
    return new Promise(resolve => {
      const img = new Image(); let finished = false;
      const end = ok => { if (finished) return; finished = true; clearTimeout(timer); signal?.removeEventListener('abort', abort); img.onload = img.onerror = null; if (!ok) img.src = ''; resolve(ok); };
      const abort = () => end(false), timer = setTimeout(abort, timeout);
      img.onload = () => end(true); img.onerror = abort;
      if (signal?.aborted) return abort();
      signal?.addEventListener('abort', abort, { once: true }); img.src = url;
    });
  },
  audio(url, signal) {
    return new Promise(resolve => {
      const audio = new Audio(); audio.preload = 'auto'; let finished = false;
      const end = ok => { if(finished)return; finished=true; clearTimeout(timer); signal?.removeEventListener('abort', abort); audio.oncanplaythrough=audio.onerror=null; audio.removeAttribute('src'); audio.load(); resolve(ok); };
      const abort = () => end(false), timer = setTimeout(abort, 12000);
      audio.oncanplaythrough = () => end(true); audio.onerror = abort;
      if(signal?.aborted)return abort(); signal?.addEventListener('abort', abort, {once:true}); audio.src=url; audio.load();
    });
  },
  async fetchArt(source, signal) {
    const key = source.image || source.localImage;
    if (source.localImage) { const ok = await this.image(source.localImage, signal); this.states.set(key, ok ? 'local' : 'failed'); return ok; }
    const controller = new AbortController(), abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, 25000);
    try {
      if (signal?.aborted) throw new Error('Cancelled');
      const response = await fetch(key, { signal: controller.signal, cache: 'force-cache', mode: 'cors' });
      if (!response.ok) throw new Error('Image unavailable');
      const blob = await response.blob(); if (!blob.size || !blob.type.startsWith('image/')) throw new Error('Not an image');
      const url = URL.createObjectURL(blob), valid = await this.image(url, signal); URL.revokeObjectURL(url);
      if (!valid) throw new Error('Invalid image');
      const stored = await this.write(key, blob); this.states.set(key, stored ? 'stored' : 'http'); return true;
    } catch (_) {
      if (signal?.aborted) { this.states.set(key, 'failed'); return false; }
      // Some image servers allow <img> but not fetch/CORS. Warm their browser HTTP cache instead.
      const ok = await this.image(key, signal, 25000); this.states.set(key, ok ? 'http' : 'failed'); return ok;
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  },
  async art(source) {
    if (!source) return null;
    const key = source.image || source.localImage;
    if (source.localImage) return { url: source.localImage, release() {} };
    const blob = await this.read(key);
    if (blob) { const url = URL.createObjectURL(blob); return { url, release() { URL.revokeObjectURL(url); } }; }
    if (this.states.get(key) === 'http') return { url: key, release() {} };
    return null; // Flipping never starts a fresh network request after a failed preload.
  },
  overlay() {
    let el = document.getElementById('asset-loader'); if (el) return el;
    el = document.createElement('div'); el.id = 'asset-loader'; el.hidden = true;
    el.innerHTML = `<section class="asset-loader-panel" role="status" aria-live="polite"><div class="loader-ball" aria-hidden="true"><i></i></div><h2>Getting your adventure ready</h2><p id="asset-load-phase">Packing your Pokédex…</p><progress id="asset-load-progress" max="100" value="0"></progress><p id="asset-load-count"></p><small>Loading ahead so you can keep playing.</small><button type="button" id="asset-load-skip">Play with loaded assets</button></section>`;
    document.body.appendChild(el); return el;
  },
  ensure(extra = [], retry = false) {
    if (this.pending) return this.pending;
    if (this.ready && !retry) return Promise.resolve(this.report);
    this.pending = this.run(extra, retry).finally(() => { this.pending = null; }); return this.pending;
  },
  async run(extra, retry) {
    const overlay = this.overlay(); overlay.hidden = false;
    const cancel = new AbortController(), signal = cancel.signal;
    overlay.querySelector('button').onclick = () => cancel.abort();
    const sources = this.sources(extra), locals = this.ready ? [] : ASSET_MANIFEST.images, sounds = this.ready ? [] : ASSET_MANIFEST.audio || [];
    let completed = 0, failed = 0, cached = 0, coreFailed = 0;
    const total = sources.length + locals.length + sounds.length;
    const update = phase => {
      document.getElementById('asset-load-phase').textContent = phase;
      document.getElementById('asset-load-progress').value = total ? completed / total * 100 : 100;
      document.getElementById('asset-load-count').textContent = `${completed} / ${total} checked · ${cached} cards ready${failed ? ` · ${failed} unavailable` : ''}`;
    };
    const pool = async (items, action, concurrency = 6) => {
      let i = 0; await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => { while (i < items.length) { const item = items[i++]; await action(item); } }));
    };
    try {
      update('Loading Pokémon, scenery and region maps…');
      await pool(locals, async url => { if (signal.aborted || !await this.image(url, signal)) coreFailed++; completed++; update('Loading Pokémon, scenery and region maps…'); });
      await pool(sounds, async url => { if(signal.aborted || !await this.audio(url,signal)) coreFailed++; completed++; update('Loading music and capture sounds…'); },3);
      if(document.fonts && !signal.aborted) await document.fonts.ready;
      await this.database();
      const missing = [];
      await pool(sources, async source => {
        const key = source.image || source.localImage;
        if (source.localImage || await this.read(key)) { this.states.set(key, source.localImage ? 'local' : 'stored'); cached++; completed++; }
        else if (!retry && this.states.get(key) === 'http') { cached++; completed++; }
        else missing.push(source);
        update('Checking saved Pokémon cards…');
      });
      // Probe once per host. A blocked server must not impose hundreds of repeated timeouts.
      const groups = new Map();
      for (const source of missing) { let host; try { host = new URL(source.image).host; } catch (_) { host = 'local'; } if (!groups.has(host)) groups.set(host, []); groups.get(host).push(source); }
      for (const group of groups.values()) {
        const first = group[0]; update('Downloading Pokémon cards — saved for next time…');
        const online = !signal.aborted && await this.fetchArt(first, signal);
        completed++; if (online) cached++; else failed++;
        if (!online) { for (const source of group.slice(1)) this.states.set(source.image, 'failed'); completed += group.length - 1; failed += group.length - 1; update('Card server unavailable — keeping saved artwork…'); continue; }
        await pool(group.slice(1), async source => { const ok = !signal.aborted && await this.fetchArt(source, signal); completed++; if (ok) cached++; else { failed++; this.states.set(source.image, 'failed'); } update('Downloading Pokémon cards — saved for next time…'); });
      }
      this.report = { total, cards: sources.length, cached, failed, coreFailed, skipped: signal.aborted };
      this.ready = true;
      update(failed ? `${cached} cards ready. ${failed} unavailable from the card server.` : 'Ready to explore!');
      if (failed || coreFailed) this.showNotice(`${failed ? `${failed} card images unavailable. ` : ''}${coreFailed ? `${coreFailed} local assets not loaded. ` : ''}Retry artwork from the main menu.`);
      return this.report;
    } finally { overlay.hidden = true; }
  },
  showNotice(text) {
    let note = document.getElementById('asset-notice'); if (!note) { note = document.createElement('div'); note.id = 'asset-notice'; document.body.appendChild(note); }
    note.textContent = text; note.hidden = false; clearTimeout(this.noticeTimer); this.noticeTimer = setTimeout(() => note.hidden = true, 10000);
  },
  installRetry() {
    const host = document.querySelector('#screen-start .start-menu'); if (!host) return;
    const button = document.createElement('button'); button.className = 'btn-pixel btn-util'; button.id = 'btn-reload-art'; button.textContent = 'Reload card artwork'; button.onclick = () => this.ensure([], true); host.appendChild(button);
  }
};

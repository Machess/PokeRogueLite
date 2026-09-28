# Visual polish validation — 28 September 2026

Passed `tests/regression.cjs` (14 checks), `tests/browser.cjs`, `tests/tablet-ui.cjs` and the new `tests/polish-ui.cjs` with no recorded page errors. The new suite verifies category filtering, gold deduction on purchases, Oak answer scoring, three Rocket challenge layouts at 960×600 and 600×960, ten move-specific effect routes at one-energy cost, automatic canvas cleanup and reduced-motion cleanup. Screenshots were reviewed for the shop, Oak, Rocket and attack effects; item glyph failures were replaced with built-in SVG artwork.

This remains Chromium touch emulation, not physical Lenovo TB-X606F performance testing. The changes add no downloaded artwork or runtime libraries. Existing battle rules and minigame scoring are retained.

---

# Journey validation — 28 September 2026

The existing rules (14 checks), browser, browser-edge and tablet UI suites passed during this update. The browser-edge save/import check now awaits the asynchronous continue-game preload.

`tests/journey-ui.cjs` covers matched reward flips in add, upgrade and deck modes without deck mutations; removal of the map trainer; region switching and position advancement; success and breakout capture outcomes; single-ball consumption on repeated taps; cancellation when leaving the catch screen; and reduced-motion completion. A CORS-enabled local image fixture verifies one preflight download, IndexedDB reuse after reload and no network request on a cached reward flip. Screenshots cover the loader, both maps, portrait map, rewards, capture and menu.

Live card-image hosts timed out in the execution environment. Actual full-catalog downloads could not be verified here, and printed-card images are not bundled in this ZIP. The cache and failure paths were tested with fixtures and blocked external requests. Initial artwork loading requires a reachable image host; browser storage restrictions or eviction can require a new download.

Tablet checks use desktop Chromium touch emulation, not a physical Lenovo TB-X606F. Regional geography is stylized; the marker indicates encounter-route progress rather than an exact free-roaming world coordinate.

---

# Pixel UI validation — 28 September 2026

`node tests/regression.cjs`: all 14 checks passed. Both existing browser suites also passed after the UI changes, with no page errors.

`tests/tablet-ui.cjs` adds touch-browser coverage for six layouts: 960×540, 960×600, 1280×800, 600×960, 800×1280 and 1024×1180. Checks cover platform anchoring, foreground/distance scale, HUD/log separation, intent/exit separation, card bounds, matched-only flip controls, unchanged energy after inspection, click/Escape return, offline image failure, successful image-load rendering using a local fixture, three-cast completion, circular scoring across zero degrees, animation cleanup, local fishing choice images, reduced motion, and compact boss geometry. Screenshots were reviewed for combat and fishing.

Testing used desktop Chromium with touch emulation, not a physical Lenovo device. Actual tablet frame rate, Android-specific behaviour and live card-image host availability are not guaranteed by these checks. This is not an exhaustive playthrough of all minigames. Original printed card images remain optional online content.

---

# Validation — 27 September 2026

## Automated rules and data checks

`node tests/regression.cjs`: 14 checks passed.

Coverage includes effect-handler completeness; Recover, Barrier and Leer; preview/resolution agreement; delayed damage; type-specific Charge; verified species provenance; playable ten-card decks for all 251 Pokémon; distinct same-type decks; explicit fallbacks; 1,000 generated late-game maps; stable enemy intentions; defence debuffs; save validation; and bundled scripts/sprites.

## Chromium browser checks

Both `tests/browser.cjs` and `tests/browser-edge.cjs` passed with external HTTP requests blocked. No page errors were recorded.

Coverage includes new-game startup, one active screen after transitions, regular combat, enemy intentions, damage preview, exact battle reload, boss intentions and shield restoration, reward filtering and recovery, reward selection, directional travel, switching, exhausted-card retention, per-Pokémon status durations, forced replacement after fainting, corrupt-save recovery, actual JSON export/import, old-save migration, defeat persistence and reload during the boss-victory transition.

Desktop (1280×800) and tablet (960×600) screenshots were inspected. Tablet HP-panel clipping, enemy-intent overlap, reward-header overlap and the trainer's map position were corrected.

## Scope

These are focused regression and interaction checks, not a complete playthrough of every minigame or a full campaign-balance study. Original printed card images are optional network content; source-record matching and core gameplay were checked offline. The live TCGdex query was separately verified to return Charmander cards.

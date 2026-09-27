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

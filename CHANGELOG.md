# Visual polish — v2.3 (28 September 2026)

- Added distinct move-name effects for beams, bubbles, flame jets, whips, punch/kick impacts, scratches, tackles, ghost and psychic attacks. Enemy attacks now use their move names too.
- Added category navigation and larger readable shop cards, plus local pixel item icons independent of emoji fonts.
- Enlarged Oak's conveyor, Pokémon and sorting bays; added a countdown bar and answer feedback. Pending round transitions stop after leaving.
- Enlarged Rocket character panels, spelling tiles, vocabulary choices and maths displays. Added drawn counting coins and landscape side-by-side layouts.
- Added focused portrait/landscape browser checks for categories, purchases, Oak scoring, Rocket layouts, ten effects and reduced-motion cleanup.

# Journey update — v2.2 (28 September 2026)

- Replaced the old victory-card inspector across add, upgrade and deck tabs with matched-only card flips shared with battle.
- Added an animated Poké Ball preload screen for bundled assets and the complete matched-card image catalog, persistent IndexedDB storage, failure reporting and a title-screen retry.
- Removed the overworld trainer sprite while preserving directional camera movement.
- Added illustrated Kanto and Johto maps, live route progress, cleared gyms and the next gym.
- Reworked capture presentation with a curved throw, impact rings, absorption, bounce, shakes and a success burst; preserved catch rules and prevented double throws.
- Fixed adjacent Johto labels and made the title screen scroll on short viewports.
- Added focused browser checks for reward flips, cached reloads, map progress, capture outcomes and cancellation.

# Pixel tablet UI — v2.1 (28 September 2026)

- Pixel borders, type icons, higher-contrast text, larger touch controls and less map clutter.
- Shared responsive battle geometry places larger player sprites on foreground platforms; transparent sprite padding no longer offsets their feet.
- Matched attacks flip to a large original Pokémon card and back. Removed battle match-details dialog and online refresh controls; fallback attacks have no flip button.
- Misty has a three-cast circular reel, striped target and gold bullseye, explicit cast/reel stages, scored feedback and reduced-motion support.
- Fixed offline name-based Pokémon lookup for fishing choice/reveal art. Improved clue cards, sprite contrast and scrolling.
- Added touch-browser regression coverage for portrait, landscape, short browser viewports, boss layout, card flips, offline image failure and fishing completion/cleanup.

# v2 — combat, cards, travel and saves

Implements requested improvements 1, 2, 3, 4, 5, 9 and 10.

- Shared, testable combat rules and accurate generated descriptions/previews.
- Previously missing card effects implemented; defence reductions corrected.
- Boss and regular fights share turns, status handling and switching.
- Exhausted cards stay exhausted after switching; status durations stay with their Pokémon.
- Played draw cards enter the discard pile after resolving, preventing immediate self-redraw.
- Visible enemy intentions and recurring gym tactics.
- Verified species-specific card attacks and explicit elemental fallbacks.
- Original-card inspection and optional live TCGdex refresh.
- Reward cost display, duplicate filtering, deck inspection and Power/Flow upgrades.
- Meaningful branches, next-step previews and directional travel over existing artwork.
- Legendary rarity overwrite fixed.
- Training no longer removes two copies when deck arrays share a reference.
- Screen transitions cancel stale timers.
- Offline Pokémon data, descriptions, artwork, sprites and fonts.
- Validated, versioned saves; battle/reward/post-boss recovery; export/import.
- Named code components and automated regression checks.

## Practical limits

Original printed card images are optional online references. Verified move mappings and gameplay work offline. Combat values are adapted to PokéTrials, rather than simulating the printed card game's rules. Interrupted minigames resume from entry, not from the exact animation frame. This package is the browser project, not an APK.

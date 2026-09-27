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

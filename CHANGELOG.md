# Illustrated minigames — v2.7 (29 September 2026)

- Added a Raichu power station to Surge: three correct answers progressively illuminate the bulb and fill its charge meter. Wrong answers do not add power; duplicate taps cannot score twice.
- Added a forest weigh station for Snorlax at every difficulty, with visible pans, a moving beam, selected Pokémon and weight readouts. Tier 1 reveals weights after choosing; existing five-round progression remains intact.
- Set Oak's sorting conveyor inside a locally bundled pixel lab, keeping its original sorting rules and timing.
- Placed Erika and Gloom in the existing greenhouse, with a large mixing flask, readable bottle cards, separate action row and expandable recipe chart.
- Reused existing backgrounds and sprites across the other activities, with larger trainer headers, themed playfields, stronger contrast and touch-sized controls. The full-screen Dig Dash runner is preserved.
- Fixed an existing infinite loop in Pryce's number choices when fewer than five distinct answers were reachable near the range boundary.
- Added scene, input and responsive layout regression coverage. All new artwork is local; no new remote asset requests.

# Dig Dash update — v2.6 (29 September 2026)

- Replaced the small runner panel with a portrait-first full-height canvas, compact escape HUD and large bottom Jump button.
- Added generated valley scenery, forest/terrain artwork and eight trainer poses. Scenery scrolls in layers; Jessie, James and Meowth use existing artwork with pursuit motion. Existing Arbok, Koffing and Jenny artwork is retained.
- Added short and held jumps, buffered input, forgiving pit-edge timing, fixed-step collision checks and speed-aware recovery spaces. Coin arcs now correspond to actual obstacles.
- Added dust, coin sparkles, visible pit walls, landing poses and a Jenny finish. Capped render resolution and particle counts for tablet use; reduced-motion mode removes decorative scrolling and particles.
- Preserved difficulty tiers, rewards and Courage. Added duplicate-result protection, input cleanup, paused-time protection and asset-failure fallbacks.
- Added runner regression coverage for portrait/landscape layouts, all-tier obstacle courses, short/held jumps, pause, exit cleanup and reward idempotency.

# Exploration update — v2.5 (29 September 2026)

- Moved route choices into a portrait bottom dock with large local artwork, labels and branch previews; retained existing scenery and directional transitions.
- Added one or two extra saved discovery stops per gym without replacing the ten normal encounters.
- Added bush cutting, rock moving, Water and Flying retrievals, Electric machines and lamps, and Fire warming and ice interactions. Ability buttons use card-style element symbols and eligible living party members, with alternative actions available.
- Added lost-backpack, scarf and charm stories whose owner appears two or three normal encounters later, independent of branch choice.
- Persisted pending, resolved and completed discoveries with reward-once guards and resumable result screens.
- Added a bundled transparent prop sheet and included it in upfront loading.
- Enlarged trainer portraits using visible artwork bounds, including Lt. Surge; adjusted portrait spacing and question readability.
- Added exploration progression, reload, reward, party eligibility and responsive layout regression coverage.

# Minigame update — v2.4 (28 September 2026)

- Fixed catch music duplication: the cinematic impact no longer replays the background track as a sound effect. Result, exit and screen-change paths stop catch audio.
- Misty shows the rod and Cast line button first, then swaps to the timing dial and Reel control. The two stages no longer overlap.
- Fixed Snorlax's stalled progression and stale Oak-only references. All five rounds work at every difficulty. Scale selections can be removed before confirmation; feedback distinguishes exact balance from the closest available total.
- Added shared first-use instructions, Pause / Help, pausable clocks and animation playback, background-tab pausing, confirmation-dialog pausing and callback cleanup on activity exit. Many answer screens now wait for Next rather than disappearing automatically.
- Clair starts on Ready, accepts displayed super-effective alternatives, uses named Pokémon/types and cancels stale round timers. Wobbuffet gains Ready, a readable charge meter and longer response windows.
- Whitney keeps the order visible, adds undo and preserves the current amount on overflow. Erika supports quarter-flask reductions, readable mix rules and editable incorrect submissions. Cooking lets players correct a wrong quantity before adding it. Giovanni payments support removing individual coins.
- Chuck supports dragging either clock hand, with buttons retained. Togepi offers hour-boundary time steps. Jenny gains a suspect cross-out mode.
- Bugsy and Pryce use larger responsive fields; Pryce supports counted markers at higher tiers and explicit layer feedback. Falkner movement is time-scaled. Runner adds buffered jumps, a brief hole-edge grace period and jump-length-aware obstacle spacing.
- Koga uses local Pokémon cards and advanced evolution pairs, with a player-controlled preview. Morty now uses ghost sequence recall. Jasmine has numbered anvils, replay and a three-mistake limit with repair opportunities.
- Sabrina has larger pieces, coordinates, reference art and a landscape workspace. Jigglypuff has shorter random sequences, free replay and slow listening.
- Added tablet-oriented activity layouts, larger controls and improved contrast. Added minigame interaction and flow suites; updated catch-audio regression coverage.

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

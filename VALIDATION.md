# Feed Snorlax and adventure menus — 30 September 2026

`tests/feed-menus.cjs` passes all-tier higher/lower solving, clue activation, real pointer swipes, duplicate input guards, reload after an incorrect serving, reload during food flight, saved success and reward-once behavior. It also checks menu and profile controls at 600×960, 800×1280, 360×640 and 960×600, including the difficulty dialog and delete confirmation. Small phone profile lists may scroll; controls stay reachable. Screenshots were inspected for the main menu, profile cards, food choices, chewing and results.

`tests/minigame-scenes.cjs` passes with the scale assertions replaced by feeding controls; Oak, Surge and Erika retain their scene checks. `tests/regression.cjs` passes all 14 core checks. Existing minigame flow coverage has been updated for the replacement activity.

These checks use desktop Chromium touch emulation, not physical Lenovo TB-X606F testing. The trainer wave/toss reuses the running-game atlas rather than generating a new character. All new UI/food/animation assets are SVG or CSS, with no new network dependency. Every serving is a fresh guess, not a cumulative hunger simulation.

---

# Rocket rescue and catching validation — 30 September 2026

Passed `tests/regression.cjs` (14 checks), `tests/runner.cjs`, `tests/journey-ui.cjs`, `tests/rocket-catch-update.cjs` and `tests/weather-fx.cjs`.

The new interaction suite starts a run with unlocked Pikachu, verifies distinct navigation icons, forces an actual runner collision, checks persistent capture dialogue, reloads a partly answered rescue, exercises all three difficulty tiers and all three metrics, retries incorrect orders, rescues the same party member, and verifies duplicate-safe win rewards and three-node protection. Catch checks cover ball selection/counts, rejected sideways gestures, upward pointer swipes and single-item consumption on repeated throw requests. Existing journey checks cover catch success/breakout, audio lifecycle, screen-exit cancellation and reduced motion.

Portrait layouts at 600×960 and 800×1280, a 360×640 phone layout and 960×600 landscape were checked for visible controls and overflow. Rescue and catching screenshots were visually inspected. Lightning, Gust and Twister screenshots were reviewed; deterministic rendering verifies increasing effect size at energy costs 1, 2 and 3, reverse attack direction, existing attack styles, replacement/exit cleanup and reduced motion.

Testing used desktop Chromium with touch emulation and blocked external requests, not a physical Lenovo TB-X606F. Device-specific performance, Android audio and live card-image hosts remain outside this validation. Speed uses bundled base-stat values, not real-world travel speed; height/weight use the existing offline Pokémon records. No capture odds or battle damage formulas changed.

---

# Illustrated minigames validation — 29 September 2026

Passed `tests/regression.cjs` (14 rule checks), `tests/minigame-scenes.cjs`, `tests/minigames.cjs`, `tests/minigame-flows.cjs` and `tests/runner.cjs`.

New coverage verifies bulb progression, wrong answers and duplicate taps; Oak's conveyor and sorting progression; Snorlax's scale and weight feedback; scene bounds at 600×960, 800×1280, 360×640 and 960×600; reduced-motion transitions; and valid Pryce choices across boundary counts at tiers 2 and 3. Existing checks complete every Snorlax tier, exercise the remaining minigames, and protect the runner's jumps, collisions, rewards and cleanup.

Screenshots were inspected for the new scenes. Erika's narrow bottle labels and clipped phone-sized target were corrected. Tests run in headless Chromium with external requests blocked. Physical Lenovo TB-X606F performance and touch/audio behavior remain unverified; this is not an exhaustive playthrough of every random encounter.

---

# Dig Dash validation — 29 September 2026

`tests/runner.cjs` covers locally loaded artwork, 600×960 / 800×1280 / 360×640 portrait layouts and 960×600 landscape, short versus held jump height, pointer release, pause/resume, simulated obstacle courses at all three tiers, collision results, duplicate-reward protection, exit cleanup and reduced-motion effects. Screenshots were inspected and the foreground density and terrain joins adjusted for hazard readability.

The 14 existing rule regression checks passed. Exploration regression checks were rerun to protect v2.5 features. Testing uses headless Chromium with blocked external requests; this is not a physical Lenovo TB-X606F performance test. The original Rocket portraits are animated through positioning rather than new running-frame artwork: the image generator rejected those sprite-sheet requests.

---

# Exploration validation — 29 September 2026

Passed `tests/regression.cjs` (14 checks), `tests/exploration.cjs`, `tests/minigames.cjs`, `tests/tablet-ui.cjs` and `tests/browser-edge.cjs` after this update.

Exploration coverage checks all 16 gym schedules, party ability eligibility, alternatives, reward-once behavior, reload at a resolved result, lost-item owner timing and return rewards. It also checks larger Surge portraits and route layouts at 600×960, 800×1280, 360×640 and 960×600. No page errors were recorded. Screenshots were inspected for the bottom navigation, bush, backpack, owner, water parcel, electric machine, campfire and Surge screens.

Tests use desktop Chromium and offline fixtures, not a physical Lenovo TB-X606F. On-device performance and audio remain unverified. Existing minigame, battle/card layout and save/import regressions passed; this is not an exhaustive playthrough of every random encounter.

---

# Minigame validation — 28 September 2026

Rules: all 14 regression checks passed. The existing browser, browser-edge, tablet-ui, polish-ui and journey-ui suites passed with no page errors. Catch coverage verifies one result on duplicate throws, no catch.mp3 sound-effect replay and stopped background music at the result, alongside exit cancellation and both outcomes.

`tests/minigames.cjs` completes all five Snorlax rounds at all three difficulties, including selection removal and explicit submission; checks Clair answer validity and manual progression; checks timer pause/resume/cancellation; verifies milk undo, quarter-volume reductions, coin removal, cooking correction and exclusive Misty cast/reel stages. It captures landscape and portrait layouts across the activities.

`tests/minigame-flows.cjs` checks correct ghost recall, Jasmine's mistake/repair/replay/next flow, Wobbuffet readiness and scoring, Sabrina placement/reference, and cleanup of old Next buttons. Screenshots were inspected for clocks, cooking, scales, liquid mixing, fishing and the puzzle workspace.

Touch testing uses desktop Chromium at tablet viewport sizes, including 960×600 and 600×960. No physical Lenovo TB-X606F test was possible; Android rendering, sustained frame rate and device audio behavior still need an on-device check. Network requests were blocked for offline core tests. These are focused tests, not an exhaustive playthrough of every recipe or random challenge.

---

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

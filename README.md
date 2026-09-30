# PokéTrials — Feed Snorlax and adventure menus v2.9

## Updating from v2.8

This small patch contains only changed/new files. Close the game, back up your current folder, and copy the contents of this patch's `PokeRogueLite` folder into your existing `PokeRogueLite` folder, accepting replacements. Keep all existing files and assets. Reopen `index.html`; if hosted, refresh without cache. No save format changes.

## Play

1. Extract the entire ZIP into a folder; do not run it inside the ZIP viewer.
2. Open `PokeRogueLite/index.html` in Chrome or Edge.
3. Create a profile or continue your adventure.

No installation, account, API key, server or build step is required. Keep the files and folders together. Pokémon data, artwork, sprites, descriptions, fonts, backgrounds, music and the verified card-match catalog are included. The core game works offline. The first click enables browser audio.

## What's new

- Card descriptions, previews and resolution share the same rules. Recover, Barrier, defence reductions, charge, delayed attacks and status effects work in regular and boss fights.
- Enemies announce their next action. Gym leaders have recurring tactics: Brock braces before heavy attacks, Misty sets rain, and Sabrina confuses your active Pokémon. The planned move survives reloads; miss and paralysis chances remain random.
- Decks use exact **species + attack-name** matches from Pokémon card records: **935 matches across 234 of the first 251 Pokémon**, scanned from 20,635 records. Unmatched moves use labelled elemental Strikes. Guard and Focus are shared trainer commands.
- In battles and all victory reward tabs, **Flip** appears only on matched attacks. Tap it to turn the attack into its large original Pokémon card; tap the card again (or press Escape) to turn it back. This never plays an attack or spends energy. Original card images download before gameplay and are cached for later visits. The old reward inspection dialog and refresh controls have been removed.
- Rewards display energy cost, exclude capped duplicates, and offer deck inspection or an upgrade instead. Power improves damage, healing or block; Flow draws one extra card. Each card receives at most one reward upgrade.
- Routes branch into different future encounters. Arrows preview their next options. Choosing a direction pans/zooms the existing background; the map has no trainer sprite. Reduced-motion settings shorten travel.
- Late-route legendary encounters retain their guaranteed rarity.
- Stable battle checkpoints retain hands, piles, enemy intentions, statuses, temporary effects and trainer/boss teams. Rewards and post-boss transitions also resume. Switching retains each Pokémon's exhausted cards and status durations.
- Versioned saves include validation, previous-write recovery, export/import and visible status. Rocket rescue dialogues, partial sorting answers and Feed Snorlax progress also resume. Other non-battle activities restart from entry if interrupted before completion.

## Feed Snorlax and adventure menus

Feed Snorlax replaces the old scale activity everywhere. Tap the large Snorlax for its hunger clue, choose a fruit basket and swipe up or press Feed. The whole serving flies to its mouth. An up arrow means try more; a down arrow means try less. Each serving is an independent guess, not a cumulative total. The available amounts narrow after feedback until you find the exact number.

The existing comparison difficulty chooses a range of 1–5, 1–15 or 1–30. There is no countdown or attempt limit. Progress, pending throws and the success screen survive reloads; a completed encounter awards coins only once. Continue stays visible until pressed. The old scale rounds are removed.

The main menu now uses the runner valley and trainer atlas, with a wave and Poké Ball toss. Larger navigation controls include local vector icons. Save import/export, music, artwork reload and reset live in Settings & save tools. Profile cards have separate labelled Play, League (when unlocked), Difficulty and Delete controls, plus a keyboard-accessible New Profile button. Existing confirmation and unlock rules are retained.

## Rocket rescue and catching

Runner endings now wait for your input. Escape to receive coins, Courage and three nodes of protection from automatic Rocket encounters and Mystery Rocket battles. Hitting an obstacle sends your active Pokémon to Rocket’s balloon: solve a comparison challenge to rescue them. Your Pokémon is retained in the save, and the rescue continues after reopening the game.

Rescue difficulty follows the existing profile tier: tier 1 selects the tallest, heaviest or fastest of three; tier 2 sorts four; tier 3 sorts five with closer measurements. The metric changes between encounters. Read the numbers, tap cards in descending order, tap again to undo, then Check and rescue. There is no timer or permanent loss; incorrect answers can be retried.

Catching shows Poké, Ultra and Master Balls with availability. Select a ball, then swipe it upward by at least 55 pixels to throw. Short or sideways gestures cancel. Keyboard users can focus the throw control and press Enter. Catch odds and ball inventory rules are unchanged.

Electric attacks now strike the target with lightning; Gust uses swirling airflow and Twister uses a funnel. Higher-cost attacks have larger effects. Train and Your Choice have distinct map icons, and the unlocked Pikachu startup error is fixed.

## Dig Dash update

Team Rocket's jumping game now fills the portrait screen, with layered forest scenery, animated trainer frames, larger obstacles, an escape progress bar and a large bottom Jump button. Tap the button or playfield for a short jump; hold briefly for a higher jump. Space and Up also work. Follow the coin arcs, leave room to land, and reach Officer Jenny. Pause / Help stops the run; leaving cancels pending input and results.

New scenery and trainer artwork are bundled and preloaded. Rocket pursuers and Pokémon obstacles reuse existing artwork. Reduced motion suppresses decorative scrolling and particles. Merge the update into your existing project as described above; retain all other assets. Export saves before updating.

## Exploration update

Portrait navigation now uses a bottom dock with large illustrated choices, short labels and next-encounter previews. Existing backgrounds and directional travel are retained.

Each gym route adds one or two saved discoveries alongside its ten normal encounter choices. Cut bushes, move rocks, retrieve parcels with Water or Flying Pokémon, power machines and lamps with Electric Pokémon, or use Fire Pokémon to warm up and melt ice. Actions use the existing element symbols. Eligible conscious party members perform the action; Cut and Strength use species eligibility, while elemental actions use Pokémon types. Attack cards are not required. Every obstacle offers an alternative or a way past.

Lost backpacks, scarves and charms can lead to an owner two or three normal encounters later, regardless of the chosen branch. Discovery outcomes and rewards survive reloads without duplicate payouts. Existing runs receive discoveries where route space remains; League runs are unchanged.

Trainer portraits now scale to their visible artwork, including a larger Lt. Surge introduction and challenge portrait. The overworld remains free of a player sprite.

## Minigame update

Activities now share first-use instructions and Pause / Help. Timers pause when the tab is hidden or a confirmation is open, and pending callbacks are cancelled when leaving. Feedback in many round-based games stays until you press Next.

The former Snorlax scale activity has been replaced by Feed Snorlax as described above. Misty displays the rod before casting and the reel dial afterward. Catch music plays once and stops at the result.

Cooking, Whitney, Erika and Giovanni allow corrections to quantities or payments. Clocks have larger controls, hand dragging and optional time-step explanations. Jenny has cross-out mode; Koga uses Pokémon and evolution pairs; Morty has ghost sequences; Jasmine offers pattern replay and repairs; Sabrina adds a reference image and piece coordinates. Action activities have larger playfields, and music practice includes free slow replay. See CHANGELOG.md for the complete update.

## Attack, shop and challenge polish

Move names now select dedicated canvas effects, including continuous beams even on one-energy cards, bubble streams, a broad Flamethrower jet, vine whips, punch/kick silhouettes, claw slashes, heavy tackle impacts, dark-purple ghost wisps and pink psychic rings. Bubble Beam uses bubbles. Ember retains its previous effect. Enemy attacks also pass their move names to the animation system. Effects clean up after playback or when leaving battle, and reduced-motion settings shorten them and suppress sprite recoil. Damage and energy rules are unchanged.

The shop has category filters, a persistent wallet and exit, larger stock cards, readable disabled states and built-in SVG pixel item icons. Oak has a larger sorting conveyor, research bays, a timing bar and explicit answer feedback. Rocket vocabulary, spelling and maths challenges have larger character panels, word displays and touch choices; Meowth's counting coins use built-in graphics. Short landscape layouts place the character beside the activity, with scrolling available for long content.

## Loading, regional maps and catches

Before a new, continued or League run, the animated Poké Ball loader warms bundled images, sounds and fonts, and downloads the full matched-card artwork catalog. Downloaded card blobs are saved in IndexedDB when available; subsequent launches reuse them. If storage or CORS restrictions prevent persistent blob caching, the browser cache is used where possible. Browsers may evict cached data.

The first printed-card download requires internet access to the image hosts. Missing art is reported before play, and flipping unavailable art shows a prompt immediately instead of starting another long download. **Play with loaded assets** skips the remaining preload; **Reload card artwork** on the title screen retries it. Core gameplay remains available offline. The full catalog contains 868 distinct image URLs and the first download can take time and storage.

Tap the regional map thumbnail to open generated pixel-art Kanto and Johto overviews. The active region shows your position along the current gym route, cleared gyms and the next gym. Position advances with completed encounter rows. These are stylized geographical overviews, not exact canonical walking maps; branching encounter choices still use the existing navigation view.

Catches now use a curved throw, impact rings, Pokémon absorption, landing bounce, timed shakes and a golden success burst. Ball inventory, catch odds and rewards retain their existing rules. Repeated taps cannot spend extra balls while a throw is running; leaving the screen cancels its presentation. Reduced-motion preferences shorten the sequence.

## Pixel UI and tablet play

The interface uses pixel frames, SVG type symbols, solid high-contrast HUDs and larger touch controls. Battle sprites use their visible image bounds so their feet land on the platforms; the foreground Pokémon is larger than the distant opponent. Cards scroll sideways when the hand exceeds the available space. Long effects can scroll inside a card.

Designed around the Lenovo TB-X606F family's 1920×1200, 16:10 screen, with responsive portrait and landscape layouts. Browser CSS viewport size varies with display scaling and the address bar. Touch-browser checks cover 960×540, 960×600, 1280×800, 600×960, 800×1280 and the taller screenshot layout. Tested in Chromium emulation, not on a physical Lenovo tablet.

Misty's tier 2–3 fishing uses three circular timing casts. Tap **Cast line**, then **Reel** when the white marker enters the striped arc; the gold centre scores best. Tap **Cast again** between attempts and **Reveal catch** after three. Five or six points earn an extra clue; two to four retain normal clues; zero or one produces fewer clues (always at least one). Tier 1 keeps its generous clue-only mode. The animation pauses in background tabs and stops when leaving. Reduced-motion mode slows the timing and disables decorative bobbing.

## Saves and moving the game

Saves belong to the browser and its site/file location. Clearing browser data, switching browsers or moving the folder can change which saves are available.

Use **Export saves** on the title screen before moving or updating. Use **Import saves** at the destination and confirm the restore. The JSON contains profiles, adventures, Pokédex entries, unlocks and scores; it excludes the grown-up PIN. Imports are validated before writing. Old saves opened in place migrate automatically: unmatched moves become elemental fallbacks and upgrades are retained.

During a fight use **Save & exit**. If saving fails, the error stays visible and that button does not leave the fight. Export a backup before closing.

## Development

Ordered classic JavaScript components preserve direct `file://` launching. `data/script-order.json` records their order. Existing engine components still share application state; the combat rules are isolated and independently testable. There is no monolithic `app.js` to edit.

| Component | Responsibility |
| --- | --- |
| `js/combat-rules.js` | Effect definitions, descriptions, damage and resolution |
| `js/combat-flow.js` | Shared turns, enemy intentions and switching |
| `js/species-cards.js` | Species/attack matching, decks, fallbacks and live lookup |
| `js/card-rewards.js` | Rewards, upgrades and shared card flips |
| `js/save-manager.js` | Validation, recovery, checkpoints, export/import |
| `js/travel.js` | Directional movement and route previews |
| `js/state-map.js`, `js/map.js` | Map generation and navigation |
| `js/battle.js`, `js/boss-battles.js` | Encounter presentation and progression hooks |
| `js/boot.js` | Startup and interface event bindings |
| `enhancements.css` | Base interface and travel styles |
| `pixel-ui.css`, `js/pixel-ui.js` | Tablet layout, sprite alignment, card flips, type glyphs and fishing timing |
| `js/attack-fx.js`, `polish.css` | Move-specific canvas effects, shop and challenge presentation |
| `js/asset-preloader.js`, `data/asset-manifest.js` | Preflight assets and persistent card-image cache |
| `js/region-map.js`, `assets/regions/` | Regional overview and current-route marker |
| `js/capture-cinematic.js`, `journey.css` | Catch presentation and journey UI |
| `data/sprite-bounds.js` | Original sprite alpha bounds for platform placement |

Other named components retain the profiles, minigames, progression, inventory, audio and visual effects.

### Tests

Dependency-free checks:

```sh
node tests/regression.cjs
```

Optional browser checks:

```sh
npm install --no-save playwright
npx playwright install chromium
node tests/browser.cjs
node tests/browser-edge.cjs
node tests/tablet-ui.cjs
```

### Refresh the bundled catalog

```sh
python tools/build_catalog.py
```

This scans the open dataset using attack names from `data/card-templates.json`. Update that template file when adding attacks. The tool refreshes basic Pokémon data and downloads missing artwork/sprites; existing images are reused. `data/species.js` is a separate bundled description snapshot.

## Data sources

- Card dataset: https://github.com/PokemonTCG/pokemon-tcg-data
- Optional live lookup: https://tcgdex.dev/ and https://api.tcgdex.net/v2/en/cards
- Pokémon data: https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv
- Artwork and sprites: https://github.com/PokeAPI/sprites
- Google Fonts Press Start 2P and Nunito; OFL licences accompany the fonts.

Pokémon names and artwork belong to their respective rights holders. This remains a fan-made educational project. Existing project artwork and audio have been retained.

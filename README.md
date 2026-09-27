# PokéTrials — updated build v2

## Play

1. Extract the entire ZIP into a folder; do not run it inside the ZIP viewer.
2. Open `PokeRogueLite/index.html` in Chrome or Edge.
3. Create a profile or continue your adventure.

No installation, account, API key, server or build step is required. Keep the files and folders together. Pokémon data, artwork, sprites, descriptions, fonts, backgrounds, music and the verified card-match catalog are included. The core game works offline. The first click enables browser audio.

## What's new

- Card descriptions, previews and resolution share the same rules. Recover, Barrier, defence reductions, charge, delayed attacks and status effects work in regular and boss fights.
- Enemies announce their next action. Gym leaders have recurring tactics: Brock braces before heavy attacks, Misty sets rain, and Sabrina confuses your active Pokémon. The planned move survives reloads; miss and paralysis chances remain random.
- Decks use exact **species + attack-name** matches from Pokémon card records: **935 matches across 234 of the first 251 Pokémon**, scanned from 20,635 records. Unmatched moves use labelled elemental Strikes. Guard and Focus are shared trainer commands.
- The Card/Info button shows a move's matching original card record and its image when online. Printed card damage and energy do not replace the game's balance values. The optional online refresh uses TCGdex without an API key. Failed lookups never stop play.
- Rewards display energy cost, exclude capped duplicates, and offer deck inspection or an upgrade instead. Power improves damage, healing or block; Flow draws one extra card. Each card receives at most one reward upgrade.
- Routes branch into different future encounters. Arrows preview their next options. Choosing a direction moves the trainer and pans/zooms the existing background. Reduced-motion settings shorten travel.
- Late-route legendary encounters retain their guaranteed rarity.
- Stable battle checkpoints retain hands, piles, enemy intentions, statuses, temporary effects and trainer/boss teams. Rewards and post-boss transitions also resume. Switching retains each Pokémon's exhausted cards and status durations.
- Versioned saves include validation, previous-write recovery, export/import and visible status. Non-battle activities restart from entry if interrupted before completion.

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
| `js/card-rewards.js` | Rewards, upgrades and source-card inspection |
| `js/save-manager.js` | Validation, recovery, checkpoints, export/import |
| `js/travel.js` | Directional movement and route previews |
| `js/state-map.js`, `js/map.js` | Map generation and navigation |
| `js/battle.js`, `js/boss-battles.js` | Encounter presentation and progression hooks |
| `js/boot.js` | Startup and interface event bindings |
| `enhancements.css` | New interface and motion styles |

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

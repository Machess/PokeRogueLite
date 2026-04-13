# PokéRogue 🎴⚡

### *A Roguelite Card Adventure — catch 'em, deck-build 'em, regret your life choices*

---

## What Is This?

PokéRogue is a browser-based roguelite card game built on HTML, CSS, and vanilla JavaScript. You pick a starter Pokémon, trudge through a procedurally generated map full of mystery nodes, battle wild Pokémon with a growing card deck, catch companions, spend gold at shady roadside shops, and eventually face three increasingly annoyed boss trainers. Win three times and your starter will have fully evolved. Lose once and you get a Game Over screen that gently reminds you how many battles you won (probably not many).

No install. No build step. Open `index.html` in a browser and go.

---

## How To Play

**Start Screen** → New Game → pick your starter → survive.

### The Map
- Nodes start as **❓** — you don't know what you're walking into until you've already walked into it.
- After completing a node, your next choices are revealed.
- **Pick a path and commit.** Once you advance past a row, every unchosen node at that level is permanently locked. No backtracking to top up at a heal node you skipped three rows ago.
- The map is ~20 nodes deep per run plus a boss at the end. Three runs (three bosses) to win the game.

### Node Types (once revealed)
| Icon | Type | What Happens |
|------|------|--------------|
| ⚔️ | Battle | Fight a wild Pokémon, earn gold, pick a new card |
| 💚 | Heal | Full party heal. Breathe. |
| 🔵 | Catch | Throw a ball at a mystery silhouette |
| ⚡ | Training | Upgrade 2 cards OR remove 1 dead-weight card |
| 🛒 | Shop | Spend your hard-earned gold on items |
| 💀 | Boss | A trainer with a full team and something to prove |

### Battle System
- **2 actions per turn**, **3 cards drawn** — you can only play 2, so every hand is a decision.
- **Actions:** play a card, draw a card, or discard a card.
- **Type effectiveness** is fully implemented. Fire beats Grass. Water beats Fire. Ground is immune to Electric. Plan accordingly — cards show their effective damage against the current opponent before you play them.
- Status effects (Burn 🔥, Poison ☠️, Paralysis ⚡) are visible as persistent badges on the HUD.
- **Switching Pokémon costs 2 actions** and resets your hand to that Pokémon's deck. Each Pokémon has their own cards.

### Gold & Items
Gold scales with run progress — early fights pay peanuts, late fights pay rent. Boss fights pay double (except the final boss, which pays zero because you're already the champion).

| Item | Effect |
|------|--------|
| 🍊 Oran Berry | Auto-heals 10 HP when a Pokémon drops below 50% |
| 🧪 Revive Potion | Saves a Pokémon from fainting once (restores 30% HP) |
| 🟡 Ultra Ball | +50% catch rate on Uncommon and Rare Pokémon |
| 🟣 Master Ball | 100% catch rate. One per run. Use it wisely. |
| 🚫 Repel | Forces next Catch node to be Uncommon or Rare only |
| 🎣 Lure | 30% chance of a Rare encounter at any Catch node, for the entire map |

### Starters & Evolution
- **Bulbasaur** → Ivysaur → Venusaur (Grass/Poison — draining, strategic)
- **Charmander** → Charmeleon → Charizard (Fire — aggressive, crits)
- **Squirtle** → Wartortle → Blastoise (Water — defensive, shield combos)
- **Pikachu** → Raichu (Electric — fast, draw combos) *Unlocked after winning once*

Beat a boss → your starter evolves. Beat all three → victory screen, stats, and Pikachu unlocks permanently across future runs.

### Pokédex
Every Pokémon you battle (seen as silhouette) or catch (full entry) is registered in your permanent Pokédex, which persists across all runs and game-overs. Accessible from the main menu. Fill it out. It's the closest thing to a postgame this has.

---

## Deck Building

Your starter begins with a 10-card deck themed around their type. Caught Pokémon get 8 generic cards + 2 type-specific cards.

**After every battle victory**, you're offered 3 random cards to add to your deck — pick one or skip. This is how your deck grows from "three Tackles and a prayer" into something you're actually proud of.

**At Training nodes** you can either:
- **Upgrade** — select 2 cards, both get +25% power permanently
- **Remove** — delete 1 card from your deck entirely. Yes, you can finally get rid of that Growl you've been carrying since turn one.

---

## Swapping Assets

Every sprite-heavy element has a clear asset slot comment in the code. The short version:

```
assets/
  battleRefrence.jpg        ← battle screen background
  trainer_stand.png         ← start screen trainer
  trainer_boss.png          ← generic boss trainer fallback
  trainer_boss_0/1/2.png    ← per-boss trainer sprites
  sprites/{id}.png          ← local Pokémon sprite overrides (e.g. 1.png = Bulbasaur)
  ui/pokeball.png           ← swap the CSS pokeball with a real image
```

Pokémon sprites are fetched live from [PokéAPI](https://pokeapi.co). To go offline or use custom art, drop sprites into `assets/sprites/{id}.png` — the `onerror` fallback chains will pick them up automatically.

---

## Tech Stack

| | |
|---|---|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES2020) |
| **Data** | [PokéAPI](https://pokeapi.co) (sprites, names, types) |
| **Persistence** | `localStorage` — three separate keys: run save, unlocks, Pokédex |
| **Rendering** | Canvas (map), DOM (everything else) |
| **Fonts** | Press Start 2P (headers), Nunito (body) via Google Fonts |
| **Build** | None. Open the file. That's it. |

---

## Known Limitations / Future Work

- The back sprite for some very old Pokémon doesn't exist in PokéAPI — it falls back gracefully to the front sprite.
- The AI opponent is not exactly Deep Blue. It hits you and you hit it back. Depth: shallow.
- Run history, achievements, difficulty modes, and synergy card highlighting are all on the list.
- Sound design is entirely imaginary (yours to implement via Web Audio API).
- The Master Ball UI turns the CSS pokeball purple. It is deeply satisfying.

---

## Credits

Built with caffeine and the PokéAPI. Pokémon and all related names are property of Nintendo / Game Freak. This is a fan project for educational purposes only. Please don't sue us — we're using your API respectfully and our catch rates are arguably fairer than the original games.

---

*"It's not about the Pokémon you caught. It's about the Tackles you played along the way."*

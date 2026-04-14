# PokéTrials 🎴⚡

### *A Roguelite Card Adventure for Young Trainers*

---

## What Is This?

PokéTrials is a browser-based card game where you become a Pokémon Trainer on an exciting adventure! Pick your starter Pokémon, explore a mystery map full of surprises, battle wild Pokémon with a growing card deck, catch new friends, and take on three powerful boss trainers to become Champion.

The game is designed for players aged 6 to 12. Younger trainers get easier challenges, while older trainers get trickier ones — so everyone plays at just the right level.

No downloads needed. No install. Just open `index.html` in a browser and your adventure begins!

---

## How To Play

**Start Screen** → New Game → enter your name and age → watch the intro → pick your starter → explore the map!

### The Map

- Nodes start as **❓** — you won't know what each stop holds until you arrive. That's part of the adventure!
- After completing a node, the next choices are revealed ahead of you.
- **Choose carefully!** Once you move forward, earlier nodes are locked. Every path is different.
- The map is about 20 nodes deep, ending with a boss battle. Defeat three bosses to become Champion!

### Node Types

| Icon | Type | What Happens |
|------|------|--------------|
| ⚔️ | Battle | Fight a wild Pokémon, earn gold, and choose a new card |
| 💚 | Heal | Your whole team gets fully healed |
| 🔵 | Catch | Try to catch a wild Pokémon to join your team |
| ⚡ | Training | Upgrade cards to make them stronger, or remove ones you don't need |
| 🛒 | Shop | Spend your gold on helpful items |
| 💀 | Boss | Face a Trainer with a full team of Pokémon |

### Battle System

- Each turn you get **3 cards** but only **2 actions** — so you always have to think about which cards to play!
- **Type matchups matter.** Fire beats Grass, Water beats Fire, and so on. Cards show their power against the opponent so you can plan ahead.
- Status effects like Burn 🔥, Poison ☠️, and Paralysis ⚡ are shown as badges on the screen so you always know what's happening.
- Switching Pokémon costs 2 actions and swaps your whole deck to that Pokémon's moves.

### Gold and Items

You earn gold from battles. The further into the game you get, the more gold battles reward!

| Item | What It Does |
|------|--------------|
| 🍊 Oran Berry | Heals 10 HP automatically when a Pokémon drops below half health |
| 🧪 Revive Potion | Saves a Pokémon from fainting once, restoring some HP |
| 🟡 Ultra Ball | Better chance to catch Uncommon and Rare Pokémon |
| 🟣 Master Ball | 100% catch chance — one per adventure! |
| 🚫 Repel | Your next Catch node will only show Uncommon or Rare Pokémon |
| 🎣 Lure | Makes Rare encounters much more likely for the whole map |

### Starters and Evolution

- **Bulbasaur** → Ivysaur → Venusaur (Grass — draining and strategic)
- **Charmander** → Charmeleon → Charizard (Fire — powerful attacks)
- **Squirtle** → Wartortle → Blastoise (Water — defensive and steady)
- **Pikachu** (Electric — speedy and fun) — unlocked after completing the game once!

Defeat a boss and your starter evolves. Defeat all three bosses and you win!

### Pokédex

Every Pokémon you battle or catch gets added to your Pokédex, which saves across all your adventures. Battled Pokémon show as silhouettes. Caught Pokémon show their full colour. Try to fill it up!

---

## Team Rocket Challenges

After battles, Team Rocket might pop up with a learning challenge!

- 😾 **Meowth** asks **maths questions** — counting coins, addition, multiplication, and more depending on your age.
- 💄 **Jessie** asks **vocabulary questions** — can you match a word to its meaning?
- 🌹 **James** asks **spelling questions** — pick the correctly spelled word!

Answer correctly to earn bonus gold. Every challenge is age-appropriate based on the age you entered at the start. If you get one wrong, the correct answer is always explained so you can learn from it.

---

## Deck Building

Your starter begins with a 10-card deck themed around their type. After every battle victory, choose one of three new cards to add to your deck.

At **Training nodes** you can:
- **Upgrade** two cards to make them +25% more powerful
- **Remove** one card you no longer want

---

## Adding Your Own Art

The game has clearly marked asset slots throughout the code. Drop your images into the `assets/` folder and they load automatically.

```
assets/
  battleRefrence.jpg       ← battle screen background
  trainer_stand.png        ← start screen trainer
  brock.png                ← Boss 1 trainer
  misty.png                ← Boss 2 trainer
  giovanni.png             ← Boss 3 trainer
  meowth.png               ← Meowth challenge screen
  jessi.png                ← Jessie challenge screen
  james.png                ← James challenge screen
  prof_oak.png             ← Professor Oak (registration + intro)
  sounds/                  ← all audio files go here
```

---

## Tech Details

| | |
|---|---|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript |
| **Pokémon Data** | PokéAPI (sprites, names, types) |
| **Save Data** | Browser localStorage — three separate saves: run progress, unlocks, Pokédex |
| **Map** | HTML5 Canvas |
| **Fonts** | Press Start 2P + Nunito via Google Fonts |
| **Build Tools** | None — open the file and play |

---

## A Note for Parents and Teachers

PokéTrials is designed to be educational as well as fun. The difficulty of maths problems, vocabulary words, and spelling challenges automatically adjusts based on the age entered at the start of each adventure. All educational content is child-friendly and age-appropriate. No accounts, no ads, no in-app purchases — just a game kids can enjoy.

---

*Pokémon and all related names are the property of Nintendo and Game Freak. PokéTrials is a fan-made educational project and is not affiliated with or endorsed by Nintendo.*

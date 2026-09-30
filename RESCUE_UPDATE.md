# Rocket rescue art and music — v2.11.1

Based on the uploaded v2.11 app.zip. This update changes only rescue presentation and its music selection. It preserves the v2.11 shared top bar, gym layouts and rescue puzzle/save rules.

## Install
Close the game. Merge this archive's PokeRogueLite folder into your existing v2.11 project and replace matching files. Keep all other files/assets. Reopen the game; use Ctrl+Shift+R if hosted. No save migration is needed.

## Changes
- New local pixel-art balloon with Jessie, James and Meowth, using the runner valley backdrop.
- Large captive Pokémon, gentle floating animation, cream answer tiles, readable feedback and bottom controls. Reduced-motion preference removes floating.
- Rescue explicitly requests teamrocket_battle.mp3; successful runner escape uses pallet_town_theme.mp3. Existing sound engine prevents duplicate/restarted tracks on answer re-renders and handles the return to the map.
- New image is included in the existing asset preloader.

## Validation
Passed tests/rocket-catch-update.cjs: actual runner collision, persistent rescue, all three tiers and metrics, wrong answers, reload, reward/protection and capture checks; no-scroll layouts at 600×960, 800×1280, 360×640 and 960×600.
Passed tests/rescue-art-audio.cjs: image loading/preload entry, real looping audio playback in Chromium, same audio instance through selection/help/result, playback after reloading a saved rescue, and stopped rescue audio after exiting to the map.
Visually inspected captured and five-choice tablet rescue views. Browser emulation only; no physical Lenovo test. This patch does not address the separately reported exploration test failure or claim a full audit of v2.11.

## Artwork
Asset: assets/rocket/balloon-pixel.png. Generated with the built-in image generator on 30 September 2026; transparent PNG used unchanged. The existing assets/runner/valley.png is reused.

Prompt: Use case: stylized-concept. Production game sprite for a Pokemon GBA-inspired pixel art rescue minigame, matching detailed 16-bit forest runner artwork. Single complete Team Rocket Meowth-shaped hot air balloon with wicker basket, isolated on genuinely transparent background. Balloon cream golden cat head with pointed ears, large coin on forehead, stitched cloth panels, whiskers and expressive mischievous face; strong readable pixel outlines, warm highlights, subtle fabric pixel shading. Rope rigging and orange burner flame connect balloon to broad basket. Jessie (long swept magenta hair, white Team Rocket uniform) stands left in basket, James (blue-purple bob hair, white uniform) right, small Meowth between them; all three clearly recognizable and fairly large with heads and upper bodies above basket rim, playful confident expressions. Basket and trio occupy bottom 35 percent of sprite, balloon occupies upper 60 percent. Front three-quarter view, complete silhouette inside canvas with small transparent margin. No scenery, no text, no UI, no captive pokemon, no cage, no shadows beyond sprite, no smooth vector art. Crisp richly shaded pixel art, square composition.

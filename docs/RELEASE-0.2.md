# Chrono Dominion prototype v0.2

## Delivered
- Original one-direction SVG pilot tank sprites for Lynx, Bull, and Viper, automatically loaded in-browser.
- A* grid-based terrain/structure path planning with per-unit route caching.
- Harvester refinery docking fix after pathfinding migration, confirmed in simulation.
- Nine configurable control groups (Ctrl+1–9), quick recall (1–9), H to center command HQ, Space to center selected units.
- Shift+right-click attack-move command.
- Updated menu hints and art-prototype indicator.

## Quality notes
- Normal gameplay displays static-facing vector pilots; direction-based animations are not yet present.
- Actual image-generated source concepts are available as a separate asset-production package, not committed as production game sprites.
- Simulation logic remains an early approximation. AI, balancing, collision and pathfinding still require multiple passes.
- The game remains single-player skirmish only, with no multiplayer, campaign or audio.
- Full commercial-game parity is not claimed.

## Next commits
1. Real sprite atlases and metadata loader.
2. Power brownout rules, ore economy balancing, unit/building construction UX.
3. AI economy parity, scouting/retreat behavior and strategic defenses.
4. Settings and save/load.
5. The complete faction units and abilities.

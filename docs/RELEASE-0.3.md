# Chrono Dominion v0.3 — directional sprite engine

## Added
- A new **32-facing vehicle sprite renderer** at `art/vehicle-renderer.js`.
- Generates 32 sprite frames for *each tank hull* and 32 for *each tank turret*, across Coalition, Federation and Psionic factions. That is **192 runtime frames**, generated from consistent geometric source rather than independently guessed angles.
- Independent tank turret facing, automatically aimed at the current combat target.
- Three original single-angle isometric power-generator SVGs: Fusion Array, Thermal Reactor and Bio Reactor.
- These generator sprites render on the battlefield when the building is constructed.
- Faction-specific tank and reactor thumbnails in the production sidebar.
- Source art metadata registry at `art/manifest.json`.
- Render integration regression test `tests/vehicle-art.test.mjs`; CI now runs both gameplay and graphic smoke tests.

## Important limitations
- The 192 frames are currently **procedurally generated low-poly vector art**. They are not detailed Blender renders or exported professional sprites. Production atlas replacement remains next.
- Tank rotation changes instantly to the direction of travel, without easing or track animation.
- Reactors have only idle poses. Damage and construction are opacity/progress overlays, not finished bespoke frames.
- No original commercial-game models, sprites or music are used.
- Pathfinding, AI, unit collisions, abilities, naval/air combat, multiplayer and campaign are still work in progress.

## Suggested v0.4 priorities
1. Smooth hull and turret turning rates; add muzzle flashes, debris and projectile travel.
2. Derive deterministic original Blender source models for three tanks, export actual PNG/WebP atlases.
3. Building occupancy collision/pathing and structured construction, repair and sell interface.
4. AI economy and scouting parity, balance, difficulty scaling and build-order diversity.
5. Formalize fog of war, map rules and game-state save/replay support.

## Test
```sh
npm run check
node tests/vehicle-art.test.mjs
```

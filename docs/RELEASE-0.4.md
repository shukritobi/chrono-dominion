# Chrono Dominion v0.4.0 — Combat & Economy

**Release:** 25 October 2026  
**Status:** GitHub Pages deployment verified, regression suite passing.

## Delivered in this milestone

### Projectile combat
- Shots travel from their firing unit/building toward the current target in logical map space.
- Damage resolves **on impact**, not immediately when firing.
- Dedicated muzzle flashes, moving projectiles, impact markers, and explosion particles.
- Discards shots against destroyed or friendly targets, with an 8-second safety expiration.
- The Psionic specialist's low-health capture effect now resolves on a hit.

### Unit direction
- Tank hulls turn toward the movement bearing at up to 2.65 radians per second.
- Turrets turn independently toward their current target at up to 4.3 radians per second.
- Other unit facings also interpolate; no instantaneous 180-degree tank facing changes.
- Uses the existing 32-direction original procedural hull/turret atlas from v0.3.

### Base management
- A single selected, friendly building exposes REPAIR and SELL actions.
- Repair heals over time and draws down the owning faction's credits.
- Repair price scales with building cost and maximum HP, capped by available credits.
- Buildings auto-stop repairing at full health or if funds are insufficient.
- Selling eligible non-command buildings returns 50% of cost if completed; 40% if unfinished.
- Command Citadel cannot be sold to avoid accidental self-defeat.

### AI and balancing
- Removed the AI's scheduled free-credit grant. The AI has to earn money from harvesters/refineries.
- AI makes power-aware construction decisions, can repair damaged structures, and replaces lost harvesters.
- Defense towers become a priority during base incursions.
- AI unit composition grows toward tanks and heavy tanks when production and tech are available.
- Difficulty now affects reaction intervals, composition thresholds and first assault timing rather than resource cheating.
- Removed the default unconditional AI march on the human HQ that caused an unavoidable first-minute rush.

## Tests and verification

GitHub Actions workflow runs:
- `node --check game.js`
- `node tests/smoke.test.mjs`
- `node --check art/vehicle-renderer.js`
- `node tests/vehicle-art.test.mjs`
- `node tests/combat-economy.test.mjs`

The new regression checks include projectile travel, delayed damage, capped turning, repair credit spending, sale refund, HQ sale protection, no free AI credits, and AI harvester replacement. Pages was verified serving the `PROTOTYPE 0.4 · COMBAT & ECONOMY` title.

## Limitations

- This is a playable prototype, **not** full Yuri's Revenge feature parity.
- Combat does not yet model ballistic arcs, splash damage, true projectile collision against terrain, ammunition systems, or line of sight.
- Repair and sell are basic selection-panel actions, not full original-style mode cursors.
- AI has limited scouting, tactics, balancing and harvest routing.
- The sprite atlases are lightweight 32-angle procedurally generated illustrations, not high-detail 3D renders.
- Infantry art is single-facing; animations, audio, naval/air content, maps, campaigns and multiplayer remain future work.

## Next milestone (v0.5)
1. Save/load a single-player skirmish in browser IndexedDB or local storage.
2. Construction controls: placement preview footprints, buildings under repair, structure sell animation.
3. Introduce unit stances, attack-move and more reliable formation/collision movement.
4. Build a reproducible Blender project and export production sprite atlases.
5. Add faction tech tree variety and support for air/naval classes.

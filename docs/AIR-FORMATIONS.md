# Flight-Layer Formation Commands

**Source audit:** 26 October 2026. Implemented in the current v2.23 development line.

## Problem

The v2.21 strike aircraft fly directly over water and structures, but group
movement commands still assigned every selected unit a ground-connected
formation slot. Clicking a lake could therefore send an aircraft to a shore
tile instead of the selected water location. Mixed air/ground selections were
especially misleading.

## Change

- Ground and aircraft selections now receive independent formation slots.
- Ground units retain the existing flood-filled walkable destinations and
  nearest-unit slot assignment.
- Aircraft receive distinct in-bounds flight destinations, even over lakes,
  blocked ground and disconnected terrain.
- Attack-move, ordinary move, command cancellation, and existing path-cache
  resets are preserved for both groups.
- No save schema, faction balance, terrain, sprites, or aircraft movement
  physics changed.

## Verification

- Added `tests/air-formations-v223.test.mjs` to `npm test`,
  `npm run check` and the GitHub Actions verification gate.
- Coverage includes single-aircraft movement over water, mixed air/ground
  attack-move, unique aircraft slots, unchanged ground-only behavior,
  Frontier Expanse XL and local save/load.
- A focused JavaScript runtime preflight exercised the corrected commands
  successfully. Full CI and live Pages publication require separate
  confirmation.

## Remaining aviation work

AI aircraft recruitment and strategic use, rearming/landing, air defenses,
dogfighting, altitude-aware visibility and full animation atlases remain
incomplete. Physical mobile and browser testing is also pending.

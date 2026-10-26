# Chrono Dominion v2.34.0: Fog-Honest Automatic Targeting

**27 October 2026**

## Problem and fix

Previously the automatic targeting filter checked AI sensor coverage but bypassed visibility for player-controlled units. An aggressive player unit could therefore track the live position of an enemy it had never spotted, especially when its detection radius exceeded its own sight radius.

Automatic target acquisition now requires `sideCanSee(e.owner, target)` for **both factions**. Friendly units and buildings share sight; a scout can legitimately spot for a long-range unit. Losing all observers immediately prevents automatic reacquisition. Player-issued direct `attack` orders intentionally retain their established behavior, and movement-only orders remain movement-only.

## Compatibility and verification

- No changes to localStorage key, save format, economy, assets or direct manual attack controls.
- New `tests/target-acquisition-v234.test.mjs` covers hidden player targets, shared scouting, loss of spotting, attack-move, AI parity, manual commands and save/load.
- Registered in npm check/test scripts and the GitHub Actions verification workflow.
- CI, deployment and physical-device results must be verified separately.

## Still pending

- Comparative nine-scenario balance measurements after fog-honest targeting.
- Aircraft survival/rearm benchmarks, dedicated Blender Skyguard sprites, landing animation, physical mobile testing, naval combat, campaigns and multiplayer.

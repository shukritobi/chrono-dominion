# Chrono Dominion v0.6 — Tactical Movement & Faction Identity

Release date: 25 October 2026. Original free-to-play browser RTS.

## Implemented gameplay

- **Unit-aware movement:** unit occupancy checks now reject overlapping destination motion. Units attempt short left/right detours when blocked, instead of blindly moving through adjacent units. A post-movement separation pass resolves most remaining pileups. This is a prototype local-steering layer, not full crowd pathfinding.
- **Tactical unit commands:** select infantry or combat vehicles and use X Stop, G Guard, B Hold, V Aggressive, or T Attack-Move. The same actions appear in the selection panel (single unit or group).
  - Stop clears current path and issues a fresh guard anchor.
  - Guard scans a defensive radius and returns to the newest guard location after completing a move.
  - Hold can fire on nearby enemies but will not automatically chase targets.
  - Aggressive expands enemy detection and pursues threats.
  - Attack-Move arms one destination order, temporarily permitting pursuit and then continuing to the chosen position.
  - A normal move order deliberately bypasses opportunistic combat and continues to its destination.
- **Faction differences:** Coalition tanks receive improved speed. Iron Federation tanks gain extra HP and damage but move slower. Psionic tanks trade some health and damage for speed. Psionic specialists retain their existing conditional capture effect.
- **Production queue:** queued units have visible progress and a cancel button, which returns the entire reserved unit price. Only completed units join the battlefield.
- **Visual asset update:** original single-frame vector sprites for the Coalition Auto Cannon, Federation Gun Nest, and Psionic Neural Sentinel, on the map and in production cards. These are new illustrated pilots, not final 3D-rendered animations.

## Controls

| Command | Shortcut | Purpose |
|---|---|---|
| Stop | X | Clear path, stand and guard |
| Guard | G | Defend nearby area |
| Hold | B | Shoot within range without auto-chase |
| Aggressive | V | Scan and chase farther |
| Attack-Move | T then right-click | Move and fight en route |
| Group movement | Right-click | Allocate separate reachable formation slots |
| Save / load | F6 / F9 | Continue browser-local skirmish |
| Camera pan | WASD or arrow keys | Move across the map |

## Engineering / verification
- `tests/tactics.test.mjs` covers faction stat differentiation, tactical commands, guard-arrival anchoring, unit separation, production cancellation and refund, and survival of a short simulated skirmish.
- CI runs this test after the earlier economy, pathfinding, combat, art and save/load suites.
- Asset manifest: `art/manifest.json` mapped to the master 308-family register.
- Existing Blender procedural source and atlas packer remain available. No production Blender renders were executed in this milestone.

## Current limitations
- Still single-player only. No campaigns, multiplayer, full tech trees, aircraft/naval systems, or original music.
- Unit separation is local, not robust flow-field/ORCA crowd avoidance. Narrow corridors can still cause units to wait or sidestep inefficiently.
- Infantry artwork and turrets are static single-facing pilots. The 32-direction tanks remain procedural low-poly art.
- The production system still has simplified parallel queues rather than a full classic RTS construction interface.
- The AI still uses simplified strategic build orders and is not fully balanced.

## Proposed v0.7
1. Improved unit navigation in tight spaces and group-arrival spacing, with real crowd tests.
2. Introduce non-combat specialist abilities for each faction, plus distinct unit roles.
3. Add richer buildings, construction effects, damage states and side-specific defense animations.
4. Expand skirmish settings and map catalog.
5. Validate a full real Blender sprite-export on a Blender-equipped machine and commit generated PNG atlases.

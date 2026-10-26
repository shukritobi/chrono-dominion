# Chrono Dominion v1.7.0 — Reliable Unit Deployment

**Date:** 26 October 2026  
**Status:** Original free single-player browser RTS prototype. This release concerns production reliability, not new unit art or a new faction.

## Verified implementation

### Production units leave through clear exits

The previous production completion logic spawned every unit at a fixed offset from its production building. It did not check water, buildings, parked vehicles or whether that exit was occupied. It could spawn a unit into a collision and immediately discard a paid production order if its factory was missing.

Version 1.7 replaces this with a bounded, deterministic **production exit search**:

- Look for the nearest usable perimeter around the correct completed barracks, war factory or refinery.
- Prefer exits toward the center of the battlefield while checking actual unit occupancy, existing structures, terrain and unit-footprint edges.
- Reject tiny isolated pockets with no adjacent walkable movement space.
- Both sides follow the same spawn and queue rules, without special enemy privileges.
- A successful deployment removes its queue entry exactly once; ore harvesters resume their usual automatic harvest order.

### Orders wait instead of disappearing

- A fully produced unit whose exits are all blocked remains **100% ready** and waits for an opening. Its next retry is delayed slightly to avoid expensive full searches every frame.
- When the only producer is destroyed, the paid order **pauses** until an eligible replacement is built. Production does not continue in a nonexistent factory.
- The sidebar shows **EXIT BLOCKED** or **PRODUCER OFFLINE** so players know why production stopped.
- A waiting order can still be cancelled for its full credit refund.
- No new save format was introduced. Existing v1 skirmish saves remain accepted; paused queues and their retry timestamps are stored using the existing queue array.
- Low-power penalties still apply to production speed.

## Automated verification

`tests/production-v17.test.mjs` covers occupied exits, one-time deployment, blocked water, footprint safety, factory destruction and rebuilding, UI status, cancellation refunds, v1 save/load recovery and identical enemy deployment rules.

The regression suite is wired into `npm run check`, `npm test` and the GitHub Pages verification workflow, alongside all earlier tests.

## Known limitations

- A fully blocked production building cannot deploy units until an exit opens. This is intentional: the game does not teleport troops through walls or into water.
- The search is local and bounded; it is not a global rally-point or path reservation system.
- New units are not yet assigned player-defined factory rally destinations.
- A paused order still requires a replacement producer of the same type to resume.
- Production buildings and units still use simple collision footprints rather than fully animated multi-tile occupancy.
- The original art manifest contains procedural and SVG pilots; final rendered sprite atlases, campaigns and multiplayer remain unfinished.

## Next recommended work

1. Player-selectable factory/barracks rally points with safe connected routing and a visual rally marker.
2. Better AI scouting, attack coordination and retreat behavior.
3. Broader chokepoint reservations and unit movement queues.
4. More original directional animation assets and mobile control improvements.

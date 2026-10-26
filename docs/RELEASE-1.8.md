# Chrono Dominion v1.8.0 — Fair Chokepoint Traffic

**Date:** 26 October 2026
**Status:** playable original browser RTS prototype, desktop and mobile browsers.

## Completed

### Direction-based narrow-lane reservations

- The movement engine detects straight, single-tile-width land corridors with water, boundaries or structures on both shoulders, requiring at least two cells.
- Units entering a detected corridor reserve it in their travel direction. Other units travelling in the opposite direction queue at the entrance instead of entering against established traffic.
- Friendly convoys can share a current direction. Once an opposite-direction unit is queued, each phase admits a **bounded batch of up to three** more units before newly arriving same-direction traffic must wait.
- When the active lane becomes empty, the oldest waiting direction receives the next phase. Invalid and cancelled waiting tickets are removed.
- Reservations are deliberately **transient**: a newly loaded match starts with a clear reservation table rather than carrying stale leases across a session. The underlying unit orders and battlefield positions continue loading.
- The lane check is integrated into the existing collision-tested movement, not a teleport or automatic route shortcut. Existing spatial buckets, yielding, A* and traffic-aware replanning remain active.
- Manually commanding a unit to move, Stop, Guard, Hold or Aggressive cancels obsolete waiting tickets.

### Feedback and performance

- Friendly soldiers or vehicles waiting for a corridor show a subtle blue ring, distinct from the existing gold ring for courtesy yielding.
- The performance HUD also shows a queued-unit count while friendly units are waiting.
- No additional graphics assets, paid services or runtime dependencies required.

### Verification

Added `tests/lanes-v18.test.mjs`, covering corridor detection, entrance denial, opposite-direction queues, same-direction convoys, bounded batches, handoffs when the lane clears, cancelling old queue requests, integration with unit movement, invalid one-cell gap handling and save/load recovery.

The new suite runs in GitHub Actions alongside earlier battle, map, movement, AI, art, sound, production-deployment and Map Forge tests.

## Known limitations

- Works for **straight one-tile corridors**; arbitrary winding bottlenecks, intersections, bridges, dynamic occupancy-based corridors and formation-wide time reservations are not yet supported.
- A fully blocked lane cannot always be cleared, because units do not phase through one another or terrain.
- The queue uses local deterministic simulation and does not implement network synchronization or multiplayer.
- The art pipeline still mixes original single-frame SVG pilots and procedural rotating tank atlases. Blender render exports and a full campaign remain unfinished.

## Next improvements

1. Queue direction handoffs and convoy throughput metrics in longer playtests.
2. Better coordinated AI platoons and defensive perimeter orders.
3. More faction-specific military units and clear build-tree descriptions.
4. Improved mobile performance, rendering quality and animated sprite pipeline.

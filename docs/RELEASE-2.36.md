# Chrono Dominion v2.36.0: Faster XL Navigation Queries

**27 October 2026**

## Improvement

The v2.35 XL pathfinding fix allowed complete long routes, but A* still
repeated terrain and building checks when neighboring nodes examined the
same tile. Connected-area flood-fill used by group formations did likewise.

Both algorithms now cache tile walkability **only within one synchronous
navigation request**. No cache survives to the next request, so newly
built or destroyed structures and changing terrain immediately affect
future paths. This avoids repeated entity scans without changing the
heuristic, eight-way diagonal corner rules, traffic and scout threat
weights, unreachable-target fallback, formation semantics or aircraft.

## Tests and compatibility

`tests/path-query-cache-v236.test.mjs` checks unique underlying probes
per request on the 48×48 map, changes between successive obstacle
layouts, disconnected formations, reconnection and historical save/load.
It runs in npm checks and the GitHub Actions verification workflow.

No saved fields, storage keys, art assets or paid services were changed.

## Remaining

CI and Pages must be verified after merge. Real-device large-army
profiling is needed to quantify frame-time gains. Aircraft survival
benchmarking, Skyguard Blender atlases and landing animations remain
unfinished.

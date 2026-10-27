# Chrono Dominion v2.37.0: Indexed Building Footprints

**27 October 2026**

## Improvement

The v2.36 navigation cache prevented repeated probes of the same tile, but
every *new* tile still called `walkable()`, which scanned the entire entity
array for buildings. On 48×48 maps, large-army path and formation queries
could therefore repeat many hundreds of building scans.

A*, connected-area flood-fill and formation slot selection now build a
compact index of living building footprints once per synchronous request.
Tile probes consult that index and the current water map, with the same
strict 1.5-tile building boundaries and eight-direction corner rules.
Custom `walkable` overrides retain their original behavior and are still
cached once per tile. No index persists across requests, so new, moved,
destroyed or repaired buildings affect the next path immediately.

## Verification and compatibility

`tests/navigation-footprint-v237.test.mjs` covers 100 crowded-map
buildings, complete detours, zero per-tile entity-array scans, connected
formations, fractional footprint edges, terrain changes, custom hooks
and historical save/load. The test is registered in npm and CI.

No storage key, save schema, original art or paid service changed.
CI and deployment must be verified after the commit. This is an
algorithmic work reduction, not yet a measured browser FPS improvement.

## Remaining

Measure frame-time gains with 100+ moving units on desktop and mobile.
Benchmark aircraft survival and complete Skyguard atlases, aircraft
landing animations and the remaining original sprite library.

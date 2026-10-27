# Chrono Dominion v2.38.0: Indexed Ground Collision

**27 October 2026**

## Gameplay and performance

The v2.37 A* optimization indexed building footprints for path queries, but
per-frame ground movement still scanned **every building** for each collision
probe. Narrow-lane detection likewise repeatedly called full-roster
`walkable()`. With large armies, this work scales with the number of units,
movement probes and structures.

During each simulation movement phase, the existing spatial-bucket structure
now indexes **living buildings** alongside units. Ground collision and lane
walkability query only nearby building buckets (2-tile cells, 3×3 search),
covering both the 1.5-tile walkability footprint and the smaller
radius-adjusted physical collision footprint. Collision tests still check
live HP, so destroyed structures cease blocking immediately. The index is
cleared before projectiles, production and strategic AI updates, and
out-of-frame queries fall back to the current entity list.

No movement speeds, water boundaries, combat stats, faction costs, original
assets, save key or save schema changed. Aircraft still ignore ground
collision. This is an algorithmic reduction in repeated entity scans, not a
claim of measured FPS improvement.

## Regression coverage

`tests/frame-collision-v238.test.mjs` verifies the index is active during
movement, far-away structures are excluded from repeated collision and lane
checks, nearby structures still block, the index is discarded at the end of
a tick, moved/destroyed structures affect later queries, and historical
save/load continues to work. Registered in npm scripts and GitHub Actions.

## Remaining

Measure actual 100+ unit browser frame times on desktop and mobile; benchmark
aircraft survivability; complete Skyguard Blender atlases and aircraft landing
animations. CI and Pages deployment require post-commit verification.

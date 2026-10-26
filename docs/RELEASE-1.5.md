# Chrono Dominion v1.5.0: Traffic-Aware Navigation

**Release:** 26 October 2026  
**Scope:** Original free-to-play browser RTS, single-player skirmish prototype.

## Improvements shipped

### Faster A* navigation

- Replaced the pathfinder's repeatedly scanned open list with a **binary min-heap**. The heap removes the least-cost frontier in logarithmic time instead of searching every queued tile on each expansion.
- Preserves world boundaries, shortest paths on unobstructed terrain, diagonal corner restrictions, and the nearest-reachable-land fallback for inaccessible orders.
- Kept the established movement and projectile simulations intact.

### Traffic-aware replanning

- A moving unit now monitors its actual **distance toward the active path waypoint** instead of assuming that sideways sidesteps constitute progress.
- After roughly 0.65 seconds of accumulated lack of waypoint progress, it requests a fresh A* route that prices nearby living units as *temporary traffic*, not permanent terrain.
- The traffic planner builds a coarse local occupancy-cost map on demand, adding a high penalty near the centre of a blocker and lower penalties around neighbouring cells.
- The default pathfinder retains ordinary terrain-only planning. Traffic penalties are calculated only when a unit has been genuinely delayed, helping control CPU cost.
- Fresh movement orders clear accumulated traffic waiting state, and successful arrivals reset it.
- Last release's spatial-bucket movement/collision optimisations remain active.

**Example:** A soldier ordered forward behind a parked friendly heavy vehicle can seek an open nearby lane rather than continually trying the same straight route.

### Regression coverage

`tests/navigation-v15.test.mjs` verifies:
- The heap-backed A* generates shortest straight routes across empty terrain.
- Its routes respect diagonal corners around obstacles.
- Weighted replanning avoids a parked heavy vehicle without abandoning the selected destination.
- Sustained blocked movement invokes a congestion-aware replan.
- Unreachable terrain is never crossed, units do not teleport, and save/load remains compatible.

The GitHub Actions verification workflow runs this suite after the prior v0.1-v1.4 tests and gates deployment on test success.

## Current limitations

- This is **local congestion avoidance**, not fully coordinated flow-field routing, deadlock-free reservation, or synchronized arrival of dozens of vehicles.
- Opposing large units in very narrow one-tile corridors can still temporarily or permanently block one another when no legal bypass exists.
- Traffic costs are coarse and recalculated on demand, rather than a globally optimized navigation mesh.
- Existing 32-frame tank atlases are procedural pilots. Original Blender high-detail multi-angle sprites, walking animations, voiceover, campaigns and multiplayer are future content milestones.

## Suggested v1.6

1. Add right-of-way and yield orders for opposing squads inside narrow chokepoints, with reproducible deadlock tests.
2. Make multi-unit formations reuse path cost fields to avoid repeated A* runs during very large group orders.
3. Expand faction roles and production variety.
4. Improve mobile performance testing and 3D sprite export validation on an equipped machine.

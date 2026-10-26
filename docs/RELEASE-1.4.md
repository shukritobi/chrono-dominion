# Chrono Dominion v1.4.0: Large-Battle Collision Optimisation

**Development date:** 26 October 2026  
**Status:** playable single-player RTS prototype, original assets.

## Implemented

### Spatial-bucket collision and crowd separation

Earlier movement checked every living unit against every other entity on each attempted move, and the overlap-correction pass iterated every possible unit pair. That quadratic cost rises quickly as armies get bigger.

This release introduces an in-memory **2-tile spatial bucket grid** for living units:

- Unit collision queries inspect only units in the nine neighbouring buckets, rather than every unit on the map.
- Buckets update when a unit moves, including collision sidesteps and overlap correction.
- The same local index is reused throughout a simulation tick and discarded after the separation pass.
- Unit overlap correction only checks nearby potential pairs, ordered by stable entity IDs for deterministic handling.
- Outside a simulation tick, exact occupancy checks fall back safely to the full entity list. This allows tests, edited scenarios, saved games, and scripted specialist abilities to work without requiring a manually maintained spatial index.
- Structures continue to block movement and diagonal corner/pathfinding rules remain unchanged.
- The index is **transient**, never written into browser skirmish saves. Saving/loading and older saved-game formats remain supported.

**What it improves:** Lower collision-query overhead in densely populated, late-game battles, with existing collision behaviour preserved.

**What it does not yet provide:** Fully coordinated flow fields, unit speed synchronization, priority-based right-of-way in narrow corridors, robust large-unit path reservations, or collision-free formation arrivals in every congested situation.

### In-game performance readout

The battlefield HUD displays a lightweight diagnostic: **approximate rendered FPS and number of living units across both factions**. It refreshes about once per second rather than on every animation frame.

This is an observational counter, **not a guarantee of a particular FPS**. Actual performance depends on graphics, browser, device, current battlefield, and system load.

### Automated regression tests

New `tests/traffic-v14.test.mjs` constructs a battlefield with **130 additional infantry** and verifies:

- Spatial occupancy checks use local buckets during movement.
- Units remain within battlefield bounds, outside impassable water and out of structure centres.
- The squad can begin moving in an occupied map without invalid coordinates.
- Index state is discarded after a simulation tick or manual overlap correction.
- Direct collision checks still work outside simulation ticks.
- Saved battles do not contain transient index internals and still load.
- FPS and unit count appear in the HUD.

All previous tests for combat, faction balance, fog intelligence, map library, save/load, AI, audio and formations remain in GitHub Actions.

## Known limitations / next work

1. **Navigation priority:** Improve right-of-way and deadlock detection when several squads share a one-tile choke point; do not mistake local collision optimisation for full traffic routing.
2. **AI:** Scouting, flanking and production exist, but do not yet provide a full base-defense and army-composition strategy.
3. **Art:** Existing vehicle atlases are procedural pilots. Blender-based high-fidelity sprites are not exported and committed; specialist, recon and infantry SVGs remain single-facing pilots.
4. **UX and audio:** Mobile usability, audio mixing and dedicated accessibility controls require more playtesting.
5. **Content:** Campaigns, multiplayer, aircraft/naval systems and a full technology tree are not yet built.

Next release candidate: coordinated movement through choke points, more robust formation arrivals, profiling on desktop/iPad, and expanded faction content.

# Chrono Dominion v2.7.0 — Dynamic Frontier Reconnaissance

**Release date:** 26 October 2026

## Implemented

- Scouts can pick **new, dynamically derived frontier destinations** using terrain their own AI team has explored. There is no dependency on enemy coordinates or the player's fog when generating frontier scores.
- Survey candidates are sampled at two-tile intervals across the 34 × 34 world. A candidate must be previously explored, traversable and capable of revealing at least five currently uncharted traversable cells.
- Candidate ranking weighs additional visibility against travel distance. Only the best 14 candidates are checked with the existing A* pathfinder, to limit expensive searches.
- Existing map sectors and ore waypoints remain available as fallback, including when an entire map has been explored.
- Multiple scouts avoid reserving patrol destinations within 4.1 tiles of one another. Enemy combat sightings still require actual sensor contact and are not inferred from frontier locations.
- No save schema migration is required: active destination orders use the existing persisted entity order format.

## Verification

- Added `tests/frontiers-v27.test.mjs`, covering non-landmark objectives, potential coverage, actual exploration gain, independent AI fog, multi-scout coordination, rejected unreachable routes, fallback routes and new-match reset.
- Included the test in both npm scripts and the GitHub verification/deployment workflow. The existing nine-scenario 240-second battle simulation remains required for deployment.

## Known limits

- Candidate sampling is deliberately coarse and is not a globally optimal search algorithm.
- Pathing uses the existing world map obstruction tests. Exact scouting survival, long-game outcome rates and touch-device performance are not yet verified.
- Original fully animated sprite atlases, campaigns, aircraft, naval warfare and multiplayer remain unfinished.

## Next

1. Establish a longitudinal benchmark for first-enemy-base discovery and scout survival per map.
2. Improve mobile two-finger camera controls, tactical UI layout and touch accessibility.
3. Add further original assets and battle animations.

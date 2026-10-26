# Chrono Dominion v2.35.0: Full XL Pathfinding

**27 October 2026**

## Gameplay improvement

The original A* pathfinder stopped after 1,450 heap removals regardless of map size. On Frontier Expanse XL (48×48), reachable destinations behind long winding obstacles could produce only a partial path. Duplicate/stale heap entries also consumed the search budget.

A* now counts only distinct expanded cells and allows up to the square of the active world size. This is a finite per-search cap (1,156 on legacy 34×34; 2,304 on XL 48×48) and is enough to visit every traversable cell if necessary. Existing binary-heap ordering, danger/traffic costs, no-diagonal-corner-cutting and partial-route fallback are preserved.

## Regression and compatibility

- Added `tests/xl-pathfinding-v235.test.mjs`: a deterministic XL serpentine maze that previously exhausted the fixed budget; complete destination reachability; adjacent legal waypoints; diagonal corner checks; blocked-goal fallback; 34×34 shortest-path and historical save/load.
- Registered in both npm scripts and GitHub Actions.
- No asset changes, saved fields, storage keys, unit balance changes or paid services.

## Remaining

CI and Pages deployment must be checked after merge. Physical mobile performance and pathfinding load profiling under large armies remain unverified. Aircraft survivability benchmarks, original Skyguard atlases and landing animations remain planned.

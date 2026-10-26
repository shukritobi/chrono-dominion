# Chrono Dominion v2.12.0: Sensor-Based Scout Evasion

**Development date:** 26 October 2026

## Added

- AI recon units intercepted inside a danger zone known from their own timestamped reports attempt a retreat to a safer reachable tile.
- Evasion scans up to 48 deterministic radial locations and path-checks up to 12 candidates with sensor-only weighted A*.
- Escapes clear stale path/traffic caches. A short cooldown prevents immediately resuming a dangerous patrol.
- Hidden enemy locations and player fog never influence risk calculations.
- Added the scout evasion integration regression and synchronized game, simulator, package and UI build versions.

## Limits and next steps

Escapes depend on known reports and traversable ground. Unknown ambushes can still destroy scouts. Scout survival and first enemy-building discoveries must be measured on all maps; this is not a proven balance improvement yet. Continue profiling route planning and improving platoon coordination. Final PNG atlases, aircraft, naval warfare, campaigns and multiplayer remain incomplete.

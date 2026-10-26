# Chrono Dominion v2.19.0: Coordinated Siege and Combat Effects

**Date:** 26 October 2026

## Bundled milestones

1. **Siege focus fire:** Primary and support platoons currently in assault mode can assign direct fire at genuinely visible enemy structures. Static towers receive suppression priority, followed by platoon objectives and valuable production or economic infrastructure.
2. **Volleys without avoidable overkill:** The focus planner accounts for its own expected committed damage and surviving in-flight projectiles. It diverts fire from targets expected to be destroyed, where another visible option exists. This is not omniscient enemy information.
3. **Distributed siege formations:** Members reserve reachable perimeter assault positions. A unit's flank calculation penalizes destinations too close to those assigned to its teammates; stalled unit recovery prefers changing the old destination.
4. **Original visual effects:** World-space projectile travel segments render light tracers rather than a fixed slash; heavy and tank strikes on buildings emit animated shockwave rings. Effects are rendered only where the human player has vision.
5. **Regression and battle metrics:** Added `tests/siege-focus-v219.test.mjs` to npm and GitHub Actions. The nine-scenario simulator now reports actual AI building-hit events, and changed focus orders, separately from overall damage and assault launches.

## Correctness and compatibility

- No hidden enemy buildings are given direct attack orders. Squad navigation remains based on AI-owned sensor reports. Defending against invaders and unit retreat are still higher-priority actions.
- Focus and damage metrics are transient, reset on game start/load and never modify the existing v1 local-storage save schema. Old projectiles with no previous-position fields draw safely.
- These headless tests are not real-browser GPU profiling or human game win-rate measurements.

## Verification

Full pull-request CI, nine 240-second scripted battles and Pages deployment are required before claiming a live verified release. Compare findings to verified v2.18 (6/9 enemy objectives found, 3/9 platoon creation, 5/9 assault launches, 10 scouts lost, 74.8% mean AI survey). New siege counters have no v2.18 baseline.

## Next priorities

More varied combat matchups, accessible siege routes under dynamic construction, visible hit feedback on mobile, and production-quality original art atlases, campaign, air/naval and multiplayer.

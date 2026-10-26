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

## Verified scripted test results

The [v2.19 pull-request workflow](https://github.com/shukritobi/chrono-dominion/actions/runs/40304543534) passed the complete gameplay regression suite and nine 240-second scripted skirmishes. This includes the new siege focus, tracer, formation, fog-honesty and save-compatibility test. The merged code is commit `53420c4`; verify its [production deployment workflow](https://github.com/shukritobi/chrono-dominion/actions/runs/40304789108) independently.

| Metric | v2.18 | v2.19 |
|---|---:|---:|
| Total scripted-match combat damage | 40,751 | 44,588 |
| Enemy objectives discovered | 6/9 | 6/9 |
| Platoon staging | 3/9 | 3/9 |
| Assault launches | 5/9 | 5/9 |
| Recon vehicles lost | 10 | 12 |
| Mean surveyed terrain | 74.8% | 74.8% |
| Cases with observed siege focus | Not measured | 1/9 |
| Changed siege-focus orders | Not measured | 32 |
| Confirmed AI building projectile hits | Not measured | 294 |
| Recovered assault reroutes | 1 | 2 |

All nine matches generated mining income and combat. Improvements in aggregate damage do **not** demonstrate better win rates, and recon losses increased. A separate baseline for focus orders and AI hits was not recorded before v2.19.

## Next priorities

More varied combat matchups, accessible siege routes under dynamic construction, visible hit feedback on mobile, and production-quality original art atlases, campaign, air/naval and multiplayer.

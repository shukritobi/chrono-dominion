# Chrono Dominion v2.15.0: Resilient AI Platoons

**Development date:** 26 October 2026

## Implemented

- Existing AI primary and support platoons now retain surviving members and their original formation slots when a squadmate is killed or withdraws.
- A surviving pair can finish its rally and launch without rebuilding a new squad from scratch. New primary platoons still require the difficulty-dependent minimum, and new support platoons retain their existing minimum.
- Primary offensive recruitment excludes severely wounded or retreating units and respects the reserve cooldown. It also avoids taking units assigned to an existing support platoon.
- Plans with fewer than two eligible members are disbanded safely. Existing staging expiry, visible-base-threat defense, target-report expiry and fog-honest objectives remain intact.
- Existing local save schema and key are unchanged; pruned platoon membership and slots use the established save fields.

## Tests

Added `tests/platoon-attrition-v215.test.mjs` covering casualty continuity, slot alignment, two-survivor assault, wounded support reserve and save/load. Registered the test in `npm test`, `npm run check` and GitHub Actions.

A focused V8 runtime smoke test passed before committing. The full GitHub Actions verification job, including the nine-scenario 240-second balance matrix and the new v2.15 regression, passed; the Pages deployment job succeeded. The public site displayed PROTOTYPE 2.15 · RESILIENT PLATOONS. [Verified workflow](https://github.com/shukritobi/chrono-dominion/actions/runs/40297911617). These checks do not prove a human win-rate improvement.

## Remaining

This fixes avoidable rally resets; it does not prove higher attack win rates. Benchmark the nine-scenario 240-second matrix against v2.14 and inspect objective discovery, scout losses and platoon assaults. Final PNG atlases, mobile device verification, aircraft, naval warfare, campaigns and multiplayer remain incomplete.

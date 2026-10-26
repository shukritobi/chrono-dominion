# Chrono Dominion v2.14.0: Forward Frontier Reconnaissance

**Development date:** 26 October 2026

## Added

- A bounded (maximum 65 points) advance bonus in scout landmark and dynamic-frontier scoring, based on distance from the AI's own living HQ and previously surveyed terrain.
- The incentive is active only before a genuine enemy-building report has been collected; reported buildings disable it until intelligence expires.
- Survey opportunity remains mandatory: locations with less than five unexplored cells receive no bonus, and scoring saturates as nearby unseen terrain increases.
- Sensor-only threat penalties, verified safe movement detours and multi-scout goal reservations are unchanged.
- Added `tests/scout-progress-v214.test.mjs`, included in npm tests and GitHub Actions verification; synchronized the runtime, UI, package and simulator versions.

## Verification

The [v2.14 GitHub Actions check](https://github.com/shukritobi/chrono-dominion/actions/runs/40295190424) passed all regression and integrity checks, including nine 240-second scripted skirmishes.

| Metric | v2.12 baseline | v2.14 |
|---|---:|---:|
| Enemy-building discovery cases | 2/9 | 6/9 |
| AI platoon staging cases | 1/9 | 4/9 |
| Recon units lost | 14 | 11 |
| Average terrain surveyed | 68.9% | 73.7% |

These are deterministic simulated outcomes, not human win rates. v2.13 and v2.14 changes both contribute to the comparison; there is no completed standalone v2.13 balance baseline.

## Limitations

No hidden opponent positions or player fog are used for exploration scoring. Longer forward routes may introduce new casualties. Final sprite atlases, aircraft, naval combat, campaign and multiplayer remain incomplete.

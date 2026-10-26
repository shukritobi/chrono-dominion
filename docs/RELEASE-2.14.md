# Chrono Dominion v2.14.0: Forward Frontier Reconnaissance

**Development date:** 26 October 2026

## Added

- A bounded (maximum 65 points) advance bonus in scout landmark and dynamic-frontier scoring, based on distance from the AI's own living HQ and previously surveyed terrain.
- The incentive is active only before a genuine enemy-building report has been collected; reported buildings disable it until intelligence expires.
- Survey opportunity remains mandatory: locations with less than five unexplored cells receive no bonus, and scoring saturates as nearby unseen terrain increases.
- Sensor-only threat penalties, verified safe movement detours and multi-scout goal reservations are unchanged.
- Added `tests/scout-progress-v214.test.mjs`, included in npm tests and GitHub Actions verification; synchronized the runtime, UI, package and simulator versions.

## Verification

Benchmark against the exact nine-scenario v2.13 release on matched settings. v2.12 reference was 14 scout losses, 2/9 enemy-building discoveries, 1/9 assault platoon and 68.9% mean surveyed terrain. A code change is not evidence of improved outcomes.

## Limitations

No hidden opponent positions or player fog are used for exploration scoring. Longer forward routes may introduce new casualties. Final sprite atlases, aircraft, naval combat, campaign and multiplayer remain incomplete.

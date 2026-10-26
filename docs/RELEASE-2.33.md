# Chrono Dominion v2.33.0: Safer Multi-Airfield Aircraft Recovery

**27 October 2026**

## Implemented

- Aircraft returning for ammunition or emergency hull repairs choose among surviving, built, friendly Air Commands by combining distance and exposure to observed anti-air defenses.
- Threat scoring uses only the aircraft owner's timestamped intelligence. Without observations, the nearest friendly airfield wins.
- The chosen pad remains pinned for the entire return flight. If destroyed, another valid pad is selected and stale detours are discarded.
- If all pads are lost, the previous mission resumes without free ammunition or repairs.
- Optional `rearmPadId` persists through save/load; historical saves lacking it select a new pad automatically. Save schema and storage key remain unchanged.

## Automated coverage

- `tests/airfield-choice-v233.test.mjs`: nearest fallback, owner-only reports, safer pad choice, enemy/unfinished pad rejection, stable return, save/load, destroyed-pad failover and no-pad recovery.
- Registered in package scripts and the deployment CI workflow.

## Remaining

- Benchmark aircraft losses and servicing success against v2.32 using controlled air-combat scenarios.
- Final Blender Skyguard sprites, landing animations, physical mobile QA, naval combat, campaigns and multiplayer are unfinished.

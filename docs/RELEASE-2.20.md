# Chrono Dominion v2.20.0: Resumable AI Rally Orders

**Development date:** 26 October 2026

## Gameplay improvement

Tactical defenders can temporarily override a primary or support platoon's rally move with a direct attack. Previously, after that attack expired or the enemy disappeared, the squad member could remain idle indefinitely because its controller only issued rally orders when the plan was first created. Staging then waited for the 105–125 second plan timeout even though the original formation slot was still available.

Both platoon controllers now resume interrupted rally moves to each member's **existing saved slot** when the member is idle or its direct target is no longer visible. A member actively engaging an enemy is not interrupted. Units already at their slot are left alone, and a correct move order is not rewritten each AI tick, preserving path caches and traffic reservations.

## Tests and measurement

- Added `tests/rally-recovery-v220.test.mjs` for primary and support squads, observed enemy priority, lost contact, arrived members, stable orders, auto-engagement protection, and legacy save/load.
- Wired the test into `npm test`, `npm run check` and GitHub Actions.
- Added `rallyResumes` per scenario and `totalRallyResumes` in the nine-scenario balance report. This is a **recovery counter**, not a win-rate metric.
- Recovery telemetry resets on new matches and save loads and is not stored in the existing browser save schema.

## Remaining

Headless coverage cannot establish real-player difficulty, responsiveness, or device compatibility. Benchmark offensive launches and building hits against v2.19, then improve blocked rally-slot handling if tests or real games show prolonged staging stalls. Original PNG animation atlases, aircraft, naval warfare, campaigns, multiplayer and physical mobile testing remain outstanding.

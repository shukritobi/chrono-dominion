# Chrono Dominion v2.28.0: Safer Air Return Routes

**26 October 2026**

## Implemented

- Empty aircraft evaluate return corridors using only their faction's timestamped, observed Sentry Turrets and Energy Towers. Up to eight lateral waypoints are considered only when the direct route is exposed. A detour is accepted only when modeled risk drops substantially and travel distance stays bounded.
- At most one waypoint is used per sortie to prevent route oscillation. The previous mission resumes after rearming. Airfield loss clears the detour and releases the aircraft.
- Recon danger costs now include Energy Towers, correcting the previous sentry-only threat filter. AI scout paths and air patrol destination scoring benefit.
- Hidden and stale defenses cannot influence navigation. Save keys, original artwork, ammunition capacity, and ground navigation are unchanged.

## Verification

- Added `tests/air-return-safety-v228.test.mjs` for beam and sentry risk, detours, faction intelligence separation, expired contacts, mission resumption, destroyed pads and legacy saves.
- Registered in npm test/check and GitHub Actions. Full CI and deployment must be checked after commit.

## Remaining

- Routes are heuristic, not guaranteed safe from undiscovered defenses or moving targets.
- Dedicated anti-air structures, aircraft repairs, fuel, landing animations, naval combat and physical mobile testing remain pending.

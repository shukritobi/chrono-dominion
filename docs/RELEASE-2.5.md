# Chrono Dominion v2.5.0 — Tactical Intelligence

**Release date:** 26 October 2026

- Added a compact sensor-limited reconnaissance panel below the radar, showing explored and currently visible map cells and enemy contact counts.
- Added a last-reported enemy contact button. It centers the camera on the report's historical position, not the hidden unit's current location.
- Added headquarters proximity alerts using player-side live sightings, with a per-enemy eighteen-second cooldown.
- Enemy reports retain the existing 28-second unit and 180-second building expiry, and are removed if a previous sighting location is now verified empty.
- Existing saves restore reports, old saves remain valid, and a new battle clears reports and alert cooldowns.
- Includes dedicated regression tests in both npm scripts and CI. This does not claim comprehensive human browser/device testing.

## Next
1. Event log for building damage and defense alerts.
2. Touch-first radar and HUD accessibility audit.
3. AI waypoint-free fog frontiers.
4. Production-quality original sprites and animations.

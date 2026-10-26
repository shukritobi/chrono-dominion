# Chrono Dominion v2.26.0: Aircraft Rearming

**26 October 2026**

## Implemented

- Strike Aircraft carry four ordnance charges. Each fired projectile consumes one charge; depleted aircraft cannot fire.
- When depleted and a friendly completed Air Command survives, aircraft automatically return to the nearest airfield, pause combat and reload one charge every 2.5 game seconds.
- Air Command needs sufficient power to reload aircraft. A destroyed airfield releases aircraft from servicing so movement commands remain usable, but they cannot fire until rearmed.
- The aircraft retains its prior mission and resumes it after reloading all four charges.
- AI air-wing planning excludes depleted or servicing aircraft so it cannot overwrite the return/rearm behavior.
- Selected aircraft show their ordnance count and servicing state.
- Existing v1 save schema remains unchanged. Aircraft loaded from historical saves without an ammo field start with a full load; in-progress servicing persists through current saves.

## Verification

- Added `tests/aircraft-rearm-v226.test.mjs` covering finite ammunition, empty-fire prevention, automatic return, delayed reload, power outage, destroyed pad, AI rearm exclusion and historical saves.
- Added the test to both npm scripts and the GitHub Actions verification gate.
- Focused JavaScript runtime checks passed in an isolated mock-DOM harness. Full Node.js CI and Pages deployment must be checked against the final commit.

## Known limitations

- Airfield servicing is proximity-based; aircraft hover at the pad rather than landing or docking into individual slots.
- No aircraft fuel system, dedicated anti-air targeting, or fighter-vs-fighter mechanics.
- A plane without any surviving airfield cannot reload.
- The AI may lose aircraft while returning to base; no escort or protected return-route behavior yet.
- Rebalance aircraft cost, damage, sortie duration and airfield throughput using repeatable simulation scenarios.

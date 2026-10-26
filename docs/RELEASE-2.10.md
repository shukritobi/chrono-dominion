# Chrono Dominion v2.10.0: Scout Safety and Objective-Discovery Metrics

**Release date:** 26 October 2026

## Implemented

- Reconnaissance patrol selection now accounts for the AI's own timestamped sensor reports. Previously observed enemy defensive turrets and recent combat-unit contacts discourage scouting into their firing zones.
- Patrol endpoints inside known high-danger zones are excluded; nearby threats reduce route desirability. Dynamic frontiers and landmark fallbacks both use this intelligence.
- Scouts already travelling toward a sector reconsider that destination if a newly observed threat makes it unsafe.
- Wounded scouts no longer receive patrol or harvester-defense reassignment while retreat or recovery cooldowns are active.
- All threat estimates use `intel[1]`, not hidden enemy entity positions, player fog, or the actual location of lost contacts.
- The existing nine-scenario balance lab now records `firstObjectiveDiscovery`, `firstPlatoonAt`, `aiSurveyPercent`, `reconBuilt`, `reconAlive`, and `reconLost`. Its report summary includes cases with objective discovery, cases with recon, total scout losses and mean AI survey coverage.
- Added `tests/scout-safety-v210.test.mjs` and wired it into npm scripts and GitHub Actions.

## Compatibility and limitations

- Existing local-save key and data structure are unchanged. Recon retreat timestamps are optional fields already supported by entity serialization.
- Threat avoidance considers *destination locations*, not the entire route through a defended chokepoint. A unit can still be intercepted en route, and intelligence may be incomplete.
- Objective discovery is defined as the first actual sensor report of a player building, not a guaranteed successful attack.
- Simulations use a scripted opponent and are not representative human win rates.
- Mobile controls, animated sprite production, campaigns, naval and air combat, multiplayer and replay remain incomplete.

## Next priorities

1. Compare objective-discovery time, scout losses and platoon formation across all maps and difficulties.
2. Extend danger awareness to path segments and improve scout retreat routes without hidden-state cheating.
3. Improve offensive squad staging and surviving scout coordination.
4. Test mobile UI on physical Android/iOS devices and continue original animated art production.

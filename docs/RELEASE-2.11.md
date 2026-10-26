# Chrono Dominion v2.11.0: Threat-Aware Scout Routes

**Development date:** 26 October 2026

## Implemented

- Extended the existing A* navigator with an optional non-negative per-tile cost function. All ordinary player movement, harvesting and formation paths retain their previous costs.
- AI reconnaissance patrol selection now computes complete routes using threat penalties from its own time-stamped intelligence reports, rather than inspecting only the destination.
- Scouts reject otherwise reachable patrol objectives if their route would cross a known high-risk defended tile while starting from safety. Scouts already exposed to danger may select routes that move toward safer ground.
- Route exposure contributes to patrol scoring, and the actual scout movement navigator uses the same threat-weighted A* to prevent choosing a safe route and then driving straight through the danger.
- Existing scout orders are reconsidered after new sensor reports, and invalidated routes clear stale cached waypoints immediately.
- No live enemy position or player-side fog information is used for AI hazard costs. No new saved fields or storage keys were introduced.

## Verification performed

- Ran v2.11 route regression logic and the v2.10 scout-safety regression logic in an isolated JavaScript V8 harness using the repository's game source.
- Ran the nine-scenario 75-second quick balance lab in V8: all nine generated income and combat; 3/9 discovered an enemy building; 9 scouts were lost.
- Ran the nine-scenario 240-second balance lab in V8: all nine generated income and combat; 3/9 discovered an enemy building, 2/9 formed platoons, 16 scouts were lost and average AI survey coverage was 71.4%.
- Added `tests/scout-routes-v211.test.mjs` to npm test/check and GitHub Actions verification. The committed Node-based workflow must still be checked separately for a successful CI/deploy result.

These V8 harness checks exercise actual game logic but are not a replacement for GitHub Actions, real-browser gameplay, or physical mobile testing. Scout losses in the full simulation were not lower than the prior reported v2.10 baseline (15); discovery increased from the previously reported 2/9 to 3/9, but no causal improvement is claimed.

## Remaining

- Recon survival and objective discovery are still poor on Verdant Front and Frostline, especially on standard/veteran.
- Scout path risk is based on last-seen enemy reports; unknown threats can still ambush units, and route costs may increase AI CPU work.
- Offensive platoons still form in only 2/9 scripted 240-second scenarios.
- Original packed PNG animation atlases, aircraft/naval units, campaigns, multiplayer and real-device touch testing remain incomplete.

## Next

1. Profile the new threat-weighted route planner in browser and CI, and compare v2.10/v2.11 headless results on identical simulation settings.
2. Improve scout fallback destinations and early enemy-building discovery on Verdant Front and Frostline without omniscient targeting.
3. Tune platoon assembly once scouting reports arrive; add performance regression thresholds.

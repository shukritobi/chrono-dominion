# Chrono Dominion v2.13.0: Safe Reconnaissance Detours

**Development date:** 26 October 2026

## Implemented

- Fixed an inconsistency between scout patrol selection and actual movement. The patrol planner could reject a short route crossing a known defensive zone even when a longer safe detour existed; movement could independently reselect that dangerous route.
- If a scout's initial weighted A* path crosses a known high-risk tile while starting from safety, the planner retries once with a prohibitive risk penalty. It accepts the detour only if it reaches the destination without crossing any known defended tile.
- AI recon movement now uses that same validated route, including while an emergency retreat cooldown is active. Other units retain their existing navigation logic.
- Only the AI's own sensor reports influence risk. Unknown hostiles remain unknown, and the existing local-save key/schema is unchanged.
- Added deterministic route, movement, retreat, chokepoint and save/load regression tests to npm and the GitHub Pages CI gate.

## Verification and limits

The modified game source passed a targeted V8 execution harness covering a long safe detour, a defended one-tile corridor and save/load. The Node-based regression suite, nine-scenario balance matrix, GitHub Actions and deployed site require independent verification. A longer safe detour is not guaranteed to be survivable against unseen enemies; no objective-discovery or scout-survival improvement is claimed.

## Next steps

1. Check the full GitHub Actions verify/deploy workflow for this commit and repair any failures.
2. Compare reconnaissance discovery, losses and CPU costs across identical nine-scenario runs.
3. Improve AI assault staging on maps where reconnaissance reports arrive too late.
4. Continue original sprite animation and mobile device playtesting.

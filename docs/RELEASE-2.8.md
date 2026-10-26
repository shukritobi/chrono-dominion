# Chrono Dominion v2.8.0 — Touch Camera Navigation

**Release date:** 26 October 2026

## Implemented

- Added a two-finger gesture recognizer to the existing pointer-based battlefield controls.
- Pinch-to-zoom now respects the existing 0.65×–1.8× camera range and anchors the terrain under the previous gesture midpoint to the new midpoint.
- Two-finger drag pans the camera, including while zoom changes.
- One-finger tap/select/command and one-finger drag-to-pan remain available.
- Moving from two fingers back to one finger continues panning but never interprets the remaining release as a click.
- Pointer cancellation, pause, return to menu, new match and saved-game reload discard transient touch state.
- Existing mouse controls and the persistent v1 saved-game schema are unchanged.
- Updated the battlefield help hint and v2.8 homepage banner.

## Verification

- Added `tests/touch-v28.test.mjs`: anchored pinch zoom, two-finger pan, zoom limits, accidental construction/command prevention, single-touch selection, mouse selection, pointer cancellation and state transitions.
- Required this test in both npm test scripts and the GitHub Actions Pages deployment gate.
- CI passing verifies simulated PointerEvent logic, not real-device ergonomics or browser touch latency.

## Known limits and next steps

1. Validate gestures on real Android/iOS browsers and tablets, including high-DPI screens and sidebar interaction.
2. Improve small-screen HUD/sidebar layout, tap-target sizes and touch-first tactical actions.
3. Benchmark AI objective discovery and scout survival in extended simulations.
4. Produce original animated sprite atlases and deepen faction unit rosters.
5. Campaign, aircraft, naval combat, multiplayer and replay remain future scope.

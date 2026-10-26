# Chrono Dominion v2.22.0: Frontier Expanse & Camera Panning

**Date:** 26 October 2026

## Bundled milestones

1. **48×48 Frontier Expanse XL.** New large map in a validated JSON catalog, almost double the terrain area of 34×34 original maps; Map Forge custom editing remains 34×34.
2. **Mouse camera dragging.** Middle-mouse drag or hold Space and left-drag, without replacing ordinary selection and orders. C centers selected troops, H centers HQ, and arrows/WASD still move the camera.
3. **Touch support.** One finger pans, two fingers pan/pinch, tapping selects/commands and touching the minimap jumps the camera to remote sectors.
4. **Size-correct engine.** Map spawns, movement, scouting, fog, minimap, previews and save/load validation honor map dimensions, preserving existing 34×34 saves.
5. **Regression and CI:** New XL-camera interaction test is included in npm scripts and GitHub Actions.

## Limits

Map Forge remains a 34×34 editor. The existing nine-scenario deterministic balance lab covers legacy arenas; XL smoke and save checks supplement it. Human playtesting and low-end mobile GPU checks remain necessary.

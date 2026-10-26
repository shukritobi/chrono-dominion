# Chrono Dominion v2.9.0 - Compact Touch Controls

26 October 2026

## Implemented

- Coarse-pointer devices receive at least 44 CSS pixel-high primary command buttons, production actions, event jumps, queue controls and zoom/pause buttons.
- Narrow touch screens use a proportional sidebar width, larger build cards and wrapped base actions while retaining battlefield space.
- Short landscape screens reduce radar height and constrain selection and queue panels.
- Sidebar scrolling is contained to avoid unintended page gestures. Mouse and keyboard styles remain unchanged.
- Added CSS regression checks to npm scripts and GitHub Actions.
- Added a touch-accessible CANCEL button while placing structures, choosing attack-move destinations or targeting Coalition Chrono Jump. Escape uses the same cancellation path and leaves credits, selections and cooldowns untouched.
- Added behavioral regression coverage in `tests/mobile-cancel-v29.test.mjs`.
- Corrected the runtime version metadata and home-screen banner to 2.9 after CI exposed a version mismatch.

## Limits

CSS assertions verify rule presence, not actual browser layout. Real iOS/Android testing, landscape screenshots and overflow checks are still required. No save data or gameplay logic was changed.

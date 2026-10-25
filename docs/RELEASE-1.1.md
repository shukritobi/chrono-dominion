# Chrono Dominion v1.1.0 — Battlefield Library

**Released:** 25 October 2026  
**Project:** Original free-to-play browser RTS.

## Shipped: up to 12 saved custom maps

Map Forge now supports **a persistent twelve-slot map library** instead of overwriting one map.

- Create a map from the Verdant, Desert or Frostline template and save it as a new library entry.
- **Open Selected Map** to edit a saved battlefield. The Save Changes command edits that specific map and cannot silently overwrite another selected entry.
- **Save As New Map** makes a separate copy of the current work.
- **Duplicate Map** creates an independent named copy of the selected map, with its own stable slot identifier.
- **Delete Map** requires a second click on Confirm Delete to prevent accidental loss. Other saved maps remain intact.
- Select and play the active custom map directly from Map Forge. The game rechecks map storage when opening Skirmish, so switching or deleting an active map is reflected in the map picker.
- **Maps are local to the browser profile.** JSON export/import remains the supported way to transfer or archive map designs between devices.

### Data compatibility

The old `chrono-dominion-custom-map-v1` single-map save is automatically recognized and migrated into the new `chrono-dominion-map-library-v2` storage on the first library write.

The currently active map is also mirrored at the legacy storage key for older consumers. Old browser skirmish saves are unaffected, and a skirmish saved with custom terrain continues to contain the full map geometry even if the map was subsequently removed from the editor library.

Library records are checked against the same terrain validator used for custom map import, including map size, uniqueness of resource cells, spawn safety and maximum water coverage. Malformed library entries are discarded instead of breaking game startup.

### Faster touch map painting

- Map Forge caches a set of blocked water cells while drawing the editor, avoiding repeated scans of the full water list for every pixel grid tile.
- Consecutive paint events are interpolated so a fast mouse, pen or touch swipe fills intermediate cells rather than leaving gaps.
- Water painting enforces the 520-tile limit during editing.
- Map validation now occurs before changing the active saved-map slot.

## Usage

1. Open [Map Forge](../map-editor.html).
2. Draw terrain or load a starter template.
3. Click **Save As New Map**. The library supports up to 12 separate maps.
4. Select one from **My Battlefield Library** and choose **Open Selected Map** to edit it. **Save Changes** updates that map.
5. Select a map and choose **Save & Play Custom Skirmish**.
6. **Export JSON** to back up designs, especially before clearing browser data.

## Tests

`tests/map-library-v11.test.mjs` checks automatic migration, independent saves, active selection, duplication, deletion, the 12-map cap, malformed storage, and old-slot compatibility.

`tests/map-editor-ui.test.mjs` now also simulates Map Forge switching, save-as, duplicate and two-click deletion, plus brush stroke interpolation on fast pointer movements.

GitHub Actions continues to gate Pages deployment on all prior RTS, art, skirmish and Map Forge tests.

## Known limitations

- Maps are stored only in local browser storage, not automatically synchronized to GitHub or devices.
- There is one **active playable custom map** per browser profile at a time, though up to 12 designs may be stored.
- The editor is 34×34 tiles, with water/land and ore brushes, a fixed starting-zone design and three themes. The next iteration can add bridge and height rules and an editable spawn system.
- Full 3D sprite animations, audio, campaign missions and multiplayer are still outstanding.
- There is no autosave of *unsaved brush strokes*. Save changes or export before closing.

## Next practical milestones

1. Multiple custom scenarios with per-map rules, victory objectives, environment obstacles and bridge structures.
2. More intelligent pathfinding and fog-aware AI scouting on community-created maps.
3. Upgraded building construction/damage animations and sound.
4. Original 8-direction infantry sprite atlases and 32-direction high-detail vehicle art.
5. Better mobile game HUD and accessibility.

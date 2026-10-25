# Chrono Dominion v1.0.0 — Map Forge

**Release date:** 25 October 2026

## Delivered: browser-based map editing

The first player-authoring milestone adds a working **Map Forge** at `map-editor.html`, linked from the main menu.

The editor supports:
- A **34×34 interactive battlefield canvas** with pointer, mouse, pen and touch painting.
- Water and land brushes, ore placement and ore removal.
- Three reusable starting templates (Verdant Front, Ashen Basin, Frostline), plus a blank map.
- Protected HQ and starting unit positions so user-edited terrain cannot submerge starting structures.
- Map name, terrain theme and visible deposit/water counts.
- Validation feedback on every edit, including a required 4–36 ore deposits, unique ore locations, map bounds and protected spawn zones.
- Saving a custom map locally in the user's browser, then launching a custom skirmish with **Save & Play**.
- Import and export as readable JSON to enable backups and sharing.

## Runtime integration

- One custom map slot is available alongside the three built-in skirmish maps.
- The custom-map option is enabled automatically when a valid Map Forge design exists in browser storage.
- Map Forge's "Save & Play" action opens the game with the custom map preselected.
- Custom maps are rendered with the chosen grassland, desert or snow palette.
- Terrain collision is based on **authored water tiles**, using a cached tile lookup to avoid scanning hundreds of water cells for each rendered terrain tile.
- Ore placement, harvesting, tactical movement, scouting and the existing AI use the selected custom map.
- Custom map data is **embedded inside each locally saved skirmish**. A match may still be resumed when the separately saved Map Forge design is edited or deleted, and malformed embedded maps are rejected.
- Existing saves and built-in maps retain their prior version-1 browser-save compatibility.

## Map schema

Map Forge exports a JSON object containing:

```json
{
  "id": "custom",
  "name": "My Battlefield",
  "description": "Player-designed Chrono Dominion battlefield",
  "theme": "verdant",
  "waterColor": "#2d6179",
  "waterTiles": [[10, 10], [10, 11]],
  "waterRects": [],
  "ore": [[10, 12], [13, 15], [18, 17], [23, 21]]
}
```

This is an abbreviated schema example, not a guaranteed valid playable battlefield because every map must respect blocked spawn zones and other placement rules. Use Map Forge to create and validate actual map files.

Built-in JSON maps continue to be edited using `maps/*.json` and generated via `npm run maps:build`. The custom editor uses one browser-local custom map slot and does not modify the GitHub repository.

## Verification

New `tests/map-forge-v100.test.mjs` covers:
- Conversion of original map templates into editable water tiles.
- Water and ore validity, spawn protection, invalid saves and duplicate ore.
- Browser-local map storage.
- Integration of custom terrain into the actual skirmish simulation.
- Custom-map preview, ore generation and land/water collisions.
- Embedded custom map portability through the existing save/load system.
- Validation of imported saved map data to prevent malformed maps from loading.

GitHub CI validates syntax of `maps/map-core.js` and `maps/map-editor.js`, verifies the editor HTML and supporting files, and runs the existing v0.1–v0.9 gameplay suites.

## Limitations

- One active custom map per browser profile; export JSON for archives or multiple custom scenarios.
- Maps are stored in local browser storage, not automatically synced across devices or to GitHub.
- The map editor changes water/land and ore only; freehand cliffs, heightmap sculpting, bridge objects, destructible props, editable factions/spawn points and scripting are future work.
- No multiplayer or scenario scripting. The battle remains a single-player skirmish against AI.
- The browser editor and game still use original SVG/procedural placeholder artwork while production 3D sprites remain on the roadmap.

## Recommended next engineering milestone

1. Extend Map Forge to multiple named local slots and scenario import/export.
2. Add in-map terrain heights, bridge rules and expansion-base placement.
3. Improve AI knowledge restrictions, patrols and CPU load.
4. Add animated damaged/under-construction states, sounds and layered vehicle effects.
5. Add user-playtesting feedback, mobile gesture improvements and responsive game UI adjustments.

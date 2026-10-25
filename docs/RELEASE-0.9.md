# Chrono Dominion v0.9.0 — Battle Reports & Map Data

**Released:** 25 October 2026  
**Scope:** Original free-to-play browser RTS skirmish prototype.

## Implemented

### Battle results and scoring

- On victory or defeat the end-of-match menu now shows a **two-army battle report** with a scorecard, map name, faction names and match duration.
- Recorded metrics per side: ore delivered, credits spent, units deployed, buildings constructed, units lost, buildings lost, hostile units destroyed, hostile structures destroyed, inflicted damage and buildings sold.
- Final score uses a **provisional local skirmish scoring model**, not a competitive ranked-rating system.
- Click **COPY BATTLE REPORT** to copy a formatted text summary when browser clipboard permissions allow.
- New counters are saved with the version-1 browser-local match snapshot. v0.8 and earlier snapshots without score data still load, with their historical counters initialized to zero.
- Existing skirmish victory condition is unchanged: a faction loses when it has no structures remaining.

### Editable data-driven battlefields

All three map definitions now have editable source files:

- `maps/verdant.json`: Verdant Front
- `maps/desert.json`: Ashen Basin
- `maps/snow.json`: Frostline

Each map file declares the ID, name, description, resource site coordinates, water color and blocked water rectangles. Runtime uses `maps/catalog.js`, loaded **before** `game.js`, to populate the terrain engine and skirmish preview.

To change a map:

```bash
# Edit maps/<name>.json
npm run maps:build
npm run maps:check
npm run check
```

The generator `tools/maps/build.mjs` validates ore locations, water bounds, team spawn zones and catalog freshness. GitHub Actions rejects invalid source maps or a stale generated catalog.

This is an **editable file-based map pipeline**, not an in-browser graphical map editor. The game still uses a fixed 34×34 skirmish battlefield.

### Enemy recon patrols

- Recon vehicles now rotate through up to six map-defined ore sites instead of returning forever to the first waypoint.
- Recon AI keeps defending harvesters when a nearby attacker is present.
- A recon scout maintains a lightweight `lastContact` record when it sees a nearby hostile unit; this record stays on the unit and therefore survives browser saves.
- This is still *prototype scouting*, not a full information-limited strategic intelligence system.

## Tests and delivery

New `tests/battle-report-v09.test.mjs` verifies JSON map catalog parity, terrain collision from files, stat tracking, idempotent kill accounting, score generation, report presentation, save/load round trips and recon patrol progression.

Continuous integration now also runs `node tools/maps/build.mjs --check`, alongside all previous tests from v0.1 to v0.8.

## Current limitations

- Most graphics remain static original SVG pilots, with low-poly procedural tank atlases as fallbacks. Blender high-detail atlas generation is not yet executed and committed.
- Battle score values are not yet balanced against game duration, faction and difficulty.
- Copying requires user permission and clipboard API availability.
- No graphical map editor, campaign, multiplayer, naval/air forces, audio or complete faction tech trees yet.
- AI patrolling is waypoint-based and does not yet perform full enemy-visibility-limited planning.

## Proposed v1.0 prototype milestone

1. Add a graphical **map editor** supporting tile painting, ore and spawn zones, plus JSON import/export.
2. Replace static single-facing recon infantry sprites with 8-/32-facing directional animations.
3. Improve AI fog-aware scouting and build-order diversity.
4. Add construction damage visuals, repair animation, and unit selection groups.
5. Harden performance, desktop and mobile UI testing, browser storage migration and error handling.

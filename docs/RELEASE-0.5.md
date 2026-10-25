# Chrono Dominion v0.5.0: Save & Strategy

Release date: 25 October 2026.

## Shipped gameplay
- **Browser-local save and load**: pause to save the entire skirmish or use F6 / Ctrl+S.
  - Main menu and pause menu load the most recent local skirmish; F9 loads it in-game.
  - Saves persist across reloads *on the same browser profile and device* using `localStorage`.
  - Versioned schema saves both factions, buildings, units, HP, orders, economy, ore deposits, queues, projectiles, camera, game timer, explored fog, and control groups.
  - Corrupt or incompatible snapshots are rejected without replacing the running match.
  - Not cloud sync: browser-data clearing or private browsing may remove saves.
- **Squad formation orders**: moving groups receive unique, walkable destinations around a chosen tile, assigned to minimize squad crossovers.
  - Attack orders still target a specific enemy; Shift + right-click still issues attack-move.
  - This is a destination formation, not coordinated speed matching or true collision avoidance.
- **3×3 construction placement**: a color-coded grid overlay shows the building's logical footprint and prevents placement touching water tiles.
  - Green represents currently valid placement, red invalid.
  - Further overlap/collision refinement is still needed for construction on top of units.

## Art source pipeline
- `tools/blender/generate_tanks.py`: scripted, editable original Blender models for all three factions, producing 32 consistent hull directions and 32 corresponding turret directions for each faction (192 transparent PNGs in total when run).
- `tools/blender/pack_atlas.py`: Pillow-based atlas packer converting the 192 rendered frames into six directional 1024×512 transparent atlas PNGs.
- `art/rendered/manifest.json`: runtime manifest for complete exported atlas pairs.
- `game.js` reads the rendered manifest and switches to production atlases as soon as both faction layers load successfully, keeping existing procedural tank art as a fallback.

**Important:** Blender is not installed in the current execution environment. The generator and packer have been committed and their Python syntax validated, but the 3D rendering step has not run yet. The live site therefore continues using the previous original procedural 32-angle vehicle artwork. Do not count the six final PNG atlases as delivered yet.

## Model and export workflow

Install Blender 4.2+ and Pillow on a workstation:

```bash
blender -b -t 4 --python tools/blender/generate_tanks.py -- --output generated/vehicle-frames --directions 32 --size 128 --samples 24
python3 -m pip install Pillow
python3 tools/blender/pack_atlas.py --input generated/vehicle-frames --output art/rendered
```

The packer writes `art/rendered/manifest.json` referencing fully generated faction hull/turret pairs. Commit the six PNGs and manifest; the browser loader will use them automatically without modifying simulation logic. Confirm all 32 facings align, share the same pivot and render without unwanted backgrounds or cropped gun barrels before publishing.

## Tests

```bash
npm run check
python3 -m py_compile tools/blender/generate_tanks.py tools/blender/pack_atlas.py
```

GitHub CI includes syntax, earlier economy/combat/graphics tests and `tests/save-formation.test.mjs` (round-trip saved state, old/corrupt saves, unique formation slots, 3×3 footprint collision).

## Limitations and next steps
- Only one save slot, local to each browser profile. No cross-device save sync.
- No save selection UI, auto-save, or mission/campaign persistence.
- Formation arrival slots are unique but units still pass through each other during movement.
- The prototype still lacks a complete Faction-by-Faction tech tree, advanced aircraft/naval AI, saves of replays, campaigns, multiplayer and final high-detail artwork.
- Next priority: test actual Blender render exports, add damaged-building frames and production art for remaining structures, then build better synchronized pathfinding and several distinct AI strategies.

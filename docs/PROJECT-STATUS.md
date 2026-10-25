# Project status — 25 October 2026

## Delivered
- Browser skirmish prototype: `index.html`, `style.css`, `game.js`.
- Three factions with original procedural placeholder graphics and distinct colour palettes.
- Basic buildings, prerequisites, power, resource economy, unit production, infantry, tanks, defenses.
- PvE AI, right-click commands, fog of war, radar, camera, menu and match flow.
- Full initial game design blueprint and original asset-production plan.
- Asset register of **308 planned asset families** (not 308 finished images).
- GitHub Actions syntax/asset-register checks and Pages deployment configuration.

## Not implemented / known limitations
- Browser gameplay has been checked by syntax compilation and a 20-second simulation smoke test, not by a full real-user playtest.
- No final sprite-sheet artwork, Blender models, sound or soundtrack yet.
- No accurate Yuri's Revenge balance or original game code/assets.
- AI is basic, pathing is greedy avoidance rather than production-grade A*.
- Basic psychic conversion only; no full mind-control chains, overload or immunities.
- No aircraft, naval units, advanced special powers, garrisoning, veteran ranks, superweapons, country variants or campaign missions.
- No multiplayer, saved games, replays, map editor, sound, settings or advanced accessibility.
- Current combat and building rules are provisional and may change drastically.
- GitHub Pages workflow is committed but requires the repo owner to enable Pages deployment using GitHub Actions.

## Next milestone: Asset pilot
1. Approve the original 3-faction visual style and three main-tank silhouettes.
2. Create editable source models, lock a camera and lighting rig, batch render turnarounds.
3. Export transparency, masks, atlases and JSON per asset.
4. Swap procedural drawing with an actual atlas renderer, with procedural fallbacks.
5. Validate at normal gameplay zoom before mass production.

## Definition of done for the first art pilot
Every pilot asset must have provenance, a source file, a transparent production sprite, dimensions/pivot, direction/frame metadata, a team-colour mask where applicable, a preview and in-browser scale validation.

## Release policy
Describe delivered features accurately. An entry marked 'Planned' in the asset register does not count as an implemented game asset.

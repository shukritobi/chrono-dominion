# Chrono Dominion v0.8 — Skirmish Expansion and Reconnaissance

**Release date:** 25 October 2026  
**Project:** Original free-to-play browser-based RTS prototype.

## Playable changes

### Three geographically different maps

Skirmish selection now determines the actual map geometry, rather than simply recoloring one terrain layout.

| Map | Terrain rules | Strategy |
|---|---|---|
| **Verdant Front** | Two lake basins on opposite approaches, scattered ore seams | Flexible routes and contestable interior |
| **Ashen Basin** | Desert canyon lakes and open flanking regions; relocated ore nodes | Faster resource scouting and exposed vehicle engagements |
| **Frostline** | Long ice-water channels dividing the middle of the battlefield; relocated ore nodes | Narrow approaches that reward map control and recon |

The skirmish setup screen now includes a working top-down map preview, ore markers, starting positions, and map description.

### Starting resource settings

Choose **3,000**, **5,000** (default), or **8,000** credits for both factions. Opposing sides begin with the same configured amount. The chosen value is stored in the version-1 browser-local save snapshot and older saves without this option remain playable.

### Recon class (one unique faction identity per army)

Requires War Factory; one new buildable unit category with three distinct names, stats and original art.

| Faction | Unit | Tactical advantage |
|---|---|---|
| Coalition | **Lynx Scout** | Faster scouting and flanking at the cost of durability |
| Iron Federation | **Iron Patrol** | More armor and damage, lower movement speed |
| Psionic Order | **Shade Runner** | High speed with an extended weapon range |

- All recon vehicles have **8.1-tile sight radius**, greater than ordinary infantry or main battle tanks.
- Recon vehicles can receive normal selection, attack, hold, guard, attack-move and control-group commands.
- Recon production, refunds and save/load use the same existing battle rules.
- Dedicated faction SVG illustrations are loaded in both battlefield and Vehicles build menu; these are original single-angle pilot sprites and not full rotation atlases.

### Computer opponent

- Begins producing recon units once a War Factory is functioning and credits permit.
- Sends recon to investigate mineral deposits, with a protective response to attackers approaching friendly ore harvesters.
- Uses the existing ore-funded economy instead of spawning unlimited credits.

## Technical changes

- Map configuration centralised in `MAPS` with terrain identity, descriptions, water colours and ore site positions.
- `water(x,y,map)` checks a specified map without needing to mutate the running game state, allowing previews and rendering to share the same geometry rules.
- `drawMapPreview()` paints terrain, shorelines, resources and two spawn markers in a small offscreen canvas.
- Added `recon` to the unit roster, production sidebar, combat, AI, health/collision geometry, vision and original-art loader.
- Three original SVG source sprites:
  - `art/pilot/coalition-recon.svg`
  - `art/pilot/federation-recon.svg`
  - `art/pilot/psionic-recon.svg`
- IDs `CD-COA-RECON-001`, `CD-FED-RECON-001`, `CD-PSI-RECON-001` are **new assets beyond** the original 308-family planning inventory; the older register isn't incorrectly relabelled or claimed complete.
- Compact-screen skirmish setup is now scrollable, including the new map preview.
- Added `tests/skirmish-v08.test.mjs` to the continuous integration workflow.

## Test coverage

The additional regression suite verifies:
- Every map has distinct water geometry and usable ore deposits.
- Player and AI get the same selected starting credits.
- Bases start on traversable terrain.
- Map preview and description render for each map.
- Recon faction HP/damage/speed differences.
- Recon production charges credits and cancelled orders refund credits.
- Recon artwork appears in the Vehicles tab.
- AI scouts ore and intercepts nearby harvester threats.
- Recon vision reveals otherwise unexplored terrain.
- All previously supported v0.1–v0.7 gameplay, art and save-state tests remain gated in GitHub Actions.

Run `npm run check` from the repository root. Pages deployment is gated on successful verification.

## Current limitations and next milestone

This remains a **single-player RTS prototype**, not a complete recreation of any copyrighted commercial game.

- No 8-/32-direction recon artwork, Blender-rendered sprites, audio or final build effects yet.
- The AI can scout and defend miners but does not have a full information-limited exploration planner, visibility memory, or map-specific strategic build orders.
- Map outlines are hand-authored geometric shapes rather than an editable scenario file or map editor.
- No campaign missions, human multiplayer, aircraft/naval combat, full tech trees or advanced superweapons.

**v0.9 candidates:** map-file schema and editor, visual damage animations, AI patrol and discovery memory, score panel, and a complete directional render pipeline for the new recon vehicles.

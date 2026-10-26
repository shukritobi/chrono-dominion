# Chrono Dominion | Blender visual QA and next production queue
**Inspection date:** 2026-10-26
**Mode:** Blender CPU Cycles, headless GitHub Actions, original editable procedural geometry.
**Publication:** PREVIEW ONLY, no replacement of previously published artwork.

## Verified renders

Twelve editable .blend models and twelve transparent 160 x 800 RGBA atlases were actually rendered and inspected, across 3 factions and 4 building categories:

| Building | Coalition | Iron Federation | Psionic Order |
|---|---|---|---|
| Headquarters | Aerospace command citadel | Heavy armored command fortress | Neural citadel |
| Refinery | Enclosed automated ore sorter | Crusher/smelter and smokestack | Crystal extractor |
| Barracks | Twin-wing recruiting campus | Fortified troops garrison | Neural training sanctuary |
| War Factory | Precision industrial hangar | Armored steel foundry | Matter synthesizer |

- [Successful Headquarters + Refinery render and all-six review artifact](https://github.com/shukritobi/chrono-dominion/actions/runs/40347128572)
- [Successful Barracks + War Factory render and all-six review artifact](https://github.com/shukritobi/chrono-dominion/actions/runs/40346506485)
- [Blender Asset Studio model source](../../tools/blender/building_architecture.py)
- The asset review archives include per-faction .blend sources, per-faction RGBA atlases and enlarged previews.

## Visual and technical acceptance results

- **12/12** models and **12/12** production-format preview atlases exist and validated.
- **12/12** alpha-rendered idle sprites have visible imagery; no all-transparent frames.
- **0/12** idle sprites touch the canvas edge. Bounding boxes fit their 160px cells.
- **12/12** pairs of idle frames differ at least by RGBA pixel values.
- **8/12** building pairs have *identical alpha silhouettes*, changing mainly through subtle emitted-light color. This is weak animation visibility at browser game scale, not identical frames.
- Idle nontransparent pixel occupancy ranged from approximately 17.9% to 31.7% of the 160x160 sprite cell.
- Construction is presently a two-step scaling of the completed mesh rather than staged assembly.
- Damage currently uses mostly a lean/different glow, not fractured or missing hardware.

## Visual art direction findings

**Coalition (Aegis):** blue-white precision styling reads consistently. Headquarters and enclosed mineral sorter are differentiated. War Factory needs a larger, clearly open production bay.

**Iron Federation (Red Bastion):** chunky dark-red steel and amber heat lighting are coherent. Smelter is recognizable. War Factory and Barracks look too much like generic rectangular armored bunkers; emphasize large blast doors and moving forging equipment.

**Psionic Order (Aether Synod):** purple/teal crystal identity is clear, but headquarters, barracks and factories rely on similar dark pedestal + floating circular halo silhouettes. Widen the factory base and give it a horizontal production mouth or fabrication aperture. Make the barracks a lower, rounded initiation sanctuary with a distinctive secondary petal structure. Preserve the tall obelisk role for headquarters.

## Completed pipeline repairs

1. Avoid hanging unbounded apt-get update on hosted Linux runners. Use cached package listings and bounded install/update fallbacks.
2. Correct bad positional arguments in the Psionic refinery crystal helper.
3. Add Blender-free geometry helper signature validation before installing Blender: tools/blender/check_geometry_calls.py.
4. Add a physical, blinking building telemetry lamp in the generator to make very subtle two-frame idle animations more visible.
5. Extend tools/blender/asset_studio.py to reject genuinely pixel-identical idle frames, comparing full RGBA bytes (not just alpha), with a regression test.

## Ordered next tasks for hourly agent

1. Render the first new asset with the revised animated beacon, and verify the two idle frames show clearly visible pixel and alpha differences. If not, fix placement/visibility.
2. Correct Psionic Barracks vs. Factory silhouette reuse, then render and review independently.
3. Make Coalition and Federation factory garage doors and moving machinery clearly visible at 160px.
4. Add real damaged-state meshes (broken plating, bent equipment, sparks, collapsed portions) and revised staged construction animation.
5. Continue original Blender Radar and Tech Lab modeling for all factions, then beam/turret/airfield improvements, then unfinished 3D vehicles.
6. Save editable Blender models, true PNG animation atlases and preview contact sheets; preserve production textures until specifically approved.

**Do not use the discarded AI-generated picture sprite pack.** Reviews must come from actual Blender output and inspected PNGs, not code-only predictions.

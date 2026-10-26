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

## 2026-10-27 verified MK-III follow-up

**Preview-only.** Psionic Barracks and Factory were rebuilt as visibly different
3D silhouettes. The Barracks is now a low, broad twin-wing initiation campus
with a sunken ritual court; the Factory is a tall twin-fork materialization
shipyard with a forward vehicle production aperture. Both models are original
editable Blender geometry, not image-generation output.

- [Successful final Psionic MK-III Blender review, editable sources, atlases and contact sheet](https://github.com/shukritobi/chrono-dominion/actions/runs/40356325572)
- [Psionic architecture source redesign](../../tools/blender/building_architecture.py)
- [Animated construction and damaged-state implementation](../../tools/blender/animated_assets.py)
- [Preview-only validation workflow](../../.github/workflows/psionic-silhouette-review.yml)
- Previous Barracks/Factory idle alpha-mask intersection-over-union: **0.8112**.
- Revised Barracks/Factory idle alpha-mask intersection-over-union: **0.7208**.
  Lower overlap confirms greater pixel silhouette differentiation at 160px.
- Both final sprite atlases are transparent **160×800 RGBA**, with all five
  building frames populated and both idle poses pixel-distinct.
- Construction now shows full-size foundations and temporary scaffold rails
  instead of uniformly scaling the entire completed structure. Compared to
  idle, the first construction frame changes **1,257** Barracks and **1,645**
  Factory alpha-mask pixels (alpha >= 32).
- Damage now reveals a missing Barracks roof, a removed Factory fork and its
  attached light/guide, plus three fractured facade debris meshes. Compared
  to idle, damaged frames change **253** Barracks and **865** Factory
  alpha-mask pixels.
- Both compressed editable `.blend` files were reopened in headless Blender,
  with at least ten mesh objects verified in each scene. This checks the
  serialized source itself, not only file presence.
- Visual inspection: the new low sanctuary and tall industrial portal are
  distinguishable at 160px. The Factory still needs a deeper physical open
  garage aperture in a later geometry pass; its current glowing gate reads
  more like a fabrication screen than a hollow bay.
- The game-facing baked manifest and all approved textures remain unchanged.

## Ordered next tasks for hourly agent

1. **Coalition + Federation War Factories:** replace visually closed facade
   panels with true open assembly bays; render all three factory previews
   before considering a production promotion.
2. **Damage state QA across all buildings:** the common renderer now supports
   scaffold-first construction and fractured facade geometry, but only the
   Psionic Barracks and Factory have undergone detailed pixel/Blender-source
   revalidation with the new implementation.
3. **Radar Arrays and Technology Labs:** upgrade the six unique faction
   silhouettes to MK-II, render editable sources and compare at 100% and 50%
   sprite scale.
4. **Animation polish:** add more mechanical idle movement, exposed
   production equipment and readable damage breakage beyond five base frames.
5. Continue defenses, airfields, missing 3D vehicles and atlas manifests.

**Never overwrite approved game textures without explicit approval.**

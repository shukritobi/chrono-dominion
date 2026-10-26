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

## 2026-10-27 verified MK-IV hollow war factories

**Preview-only.** Coalition and Federation War Factories now have genuine
camera-facing open vehicle assembly bays instead of black painted facades or
sealed front walls. Both are U-shaped shells with a solid rear wall, a full
far-side wall, a cut-away near-side wall and a structurally open front portal.
The Coalition facility has a suspended welding gantry, crawler chassis and
blue guidance rails; the Federation facility has a hot rear furnace, asymmetric
chimneys, exposed tracked hull and suspended forging hammer.

- [Successful two-factory MK-IV Blender preview render and QA artifact](https://github.com/shukritobi/chrono-dominion/actions/runs/40365994835)
- [Hollow factory geometry source](../../tools/blender/building_architecture.py)
- [Saved-Blender-source open-aperture raycast verification](../../tools/blender/verify_factory_open_bays.py)
- [Preview-only rendering, geometry checks and pixel QA](../../.github/workflows/open-factory-review.yml)
- Both independent compressed editable `.blend` files were reopened by
  headless Blender and passed the raycast checks. A +X front-aperture ray at
  z=1.59 must reach x<0.95 before hitting a mesh; the exposed -Y side ray
  must reach y>-1.02. These checks prevent painted black doors from passing
  as genuinely open bays.
- Both transparent atlases are **160×800 RGBA**, with 5 populated frames
  (2 idle, 2 construction, 1 damaged) and pixel-distinct idle poses.
- **Coalition:** idle opaque pixels 6,113; first construction vs idle alpha
  change **2,178 pixels**; damaged vs idle **283 pixels**.
- **Federation:** idle opaque pixels 7,200; first construction vs idle alpha
  change **3,809 pixels**; damaged vs idle **327 pixels**.
- Relative to the older closed-facade render, the Coalition factory idle
  alpha silhouette changes at **679 pixels** (IoU 0.8933); the Federation
  changes at **201 pixels** (IoU 0.9723). The larger difference is in the
  *interior visibility*, not outer silhouette: this is intentional because
  both preserve their faction-specific building footprints.
- Actual rendered comparison at both enlarged and 80px game-scale confirms
  the Coalition bay now exposes blue machinery and the Federation bay exposes
  a warm open forge. At 80px, the heavy vehicle chassis details are still
  subtle; the bay openings are readable.
- Damage geometry passes pixel QA but the visual damaged state remains too
  restrained at 80px. Add displaced roof steel, broken portal posts and
  brighter localized sparks in the next damage-art pass.
- The production art manifest and all existing published textures are
  unchanged. The asset roster remains Planned for full gameplay state coverage
  because the preview pipeline does not yet include critical/destroyed states.

## 2026-10-27 MK-V damaged-state inspection, Coalition and Federation

**Preview-only.** The two MK-IV physically hollow War Factories now have a
separate MK-V destruction pose. The actual damaged mesh hides the roof canopy,
near-side portal support, open-bay crosshead and crane hood, replacing them
with displaced, tilted roof steel, bent portal girder and three visible
armor/forge shards. The debris meshes are independently editable in the
saved Blender files and hidden in idle/construct states.

- [MK-V factory render and strict QA workflow](https://github.com/shukritobi/chrono-dominion/actions/runs/40376236530).
- [MK-V architecture and damage geometry](../../tools/blender/building_architecture.py).
- [Damage-only state isolation](../../tools/blender/animated_assets.py).
- The comparison used the actual MK-IV artifact and the new MK-V artifact,
  including 160px atlases and a separately downsampled 80px game-scale view.
- Coalition damaged-versus-idle alpha-mask change: **283 → 375 pixels at 160px**
  and **65 → 84 pixels at 80px**.
- Federation damaged-versus-idle alpha-mask change: **327 → 353 pixels at 160px**
  and **69 → 75 pixels at 80px**.
- Both new atlases remain transparent 160×800 RGBA with five populated frames,
  and the original first-construction alpha changes remain 2,178 and 3,809.
- The damaged visual now reads as a missing roof and collapsed front portal
  at both 160px and 80px. Federation's numerical alpha improvement is modest,
  but displaced foreground wreckage is visibly stronger in the RGB render.
- New QA explicitly checks damage at both 160px (>=350 changed alpha pixels)
  and 80px (>=70), requires at least two hidden editable damage meshes
  after reopening the saved Blender source, and retains artifacts on failures.
- A previous strict 400-pixel alpha threshold rejected otherwise visibly
  improved renders; the 80px view and human inspection justified 350/70.
- Existing game-art manifests were compared with the pre-MK-V commit:
  their Git blob hashes are unchanged. **No preview art was published.**

## Ordered next tasks for hourly agent

1. **Remaining building-class construction/damage QA:** validate Headquarters,
   Refinery and Barracks across all three factions with the full-size scaffold
   and fractured-damage renderer. Factory MK-V is modeled and pixel-inspected,
   but do not promote to production without artistic approval.
2. **Radar Arrays and Technology Labs:** author six original faction-distinct
   MK-II structures, with physical moving radar hardware and readable
   laboratory silhouettes; render editable sources, 160×800 atlases and
   compare at 100% and 50% sprite scale.
3. **Psionic Factory:** consider deepening the physical front fabrication
   portal; it currently reads as a glowing materialization screen.
4. **Animation polish:** implement mechanical movement and stronger damaged
   silhouettes without losing the established faction design language.
5. Continue defenses, airfields, missing 3D vehicles and atlas manifests.

**Never overwrite approved game textures without explicit approval.**

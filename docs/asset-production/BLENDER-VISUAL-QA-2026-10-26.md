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

## 2026-10-27 MK-II Radar Arrays and Technology Laboratories

**Preview-only; no published atlas replacement.** Six distinct original
procedural Blender models now exist: Coalition parabolic SkyScan reflector and
split-wing quantum annex; Federation double-ended IronWatch array and
near-side chimney siege laboratory; Psionic counter-rotating psychic scanner
and broad three-oracle research chamber. Physical scanner geometry rotates
between idle frames. A second independently counter-rotating rotor is used
where the model includes one. The 3D components are meshes, not a flat
animated picture.

- [Successful final six-building Blender render, source reopen and contact-sheet QA](https://github.com/shukritobi/chrono-dominion/actions/runs/40385354333).
- [Preview-only radar/tech renderer workflow](../../.github/workflows/radar-tech-mk2-review.yml).
- [80px and 160px image inspection and acceptance logic](../../tools/blender/qa_radar_tech.py).
- All six original editable compressed `.blend` files were reopened in
  headless Blender, with **34-39 mesh objects** each. The Blender job rendered
  **six RGBA 160×800 atlases**, with five populated frames per building.
- The final archive contains the source files, all PNG frames, packed
  atlases, per-asset previews, two contact sheets and quantitative JSON QA.
- Visual review of the **actual** final 160px and 80px sheets confirmed
  recognizable rotating radar hardware, faction materials and early
  construction scaffolds. The initial preview showed floating unbuilt
  research rings in construction frame 0; this was fixed and re-rendered.
- A second inspection found the Federation research building's original
  furnace largely hidden behind the roof. Its thermal chimney was moved
  to the visible near side and raised, giving the science lab a taller
  asymmetrical silhouette distinct from the horizontal radar array.
- Idle alpha-mask changed pixels, in Coalition/Federation/Psionic order:
  **Radar 650 / 641 / 447**; **Technology Lab 282 / 0 / 502**.
  Federation Lab's two idle frames are nevertheless RGB-distinct from the
  active emissive pulse, but physical motion remains visually restrained.
- First construction frame vs idle at 80px: **Radar 581 / 900 / 360**;
  **Technology Lab 688 / 1016 / 581** changed alpha pixels.
- Damaged frame vs idle at 80px: **Radar 122 / 181 / 146**;
  **Technology Lab 120 / 104 / 139** changed alpha pixels.
- Technical acceptance passed, but the Federation Tech Lab needs a stronger
  moving experimental test fixture, and all six would benefit from more
  dramatically broken hardware in the damaged frame before approval.
- The asset roster remains **Planned** for complete critical/destroyed
  gameplay states. These are **five-frame previews only**.
- The older MK-V factory workflow run 40376236530 failed because the
  Ubuntu apt package installation timed out (exit code 124), not because
  the revised factory alpha thresholds failed. The new radar/tech workflow
  bypasses apt mirrors with a checksum-verified official Blender 4.2.23
  Linux archive and a shared GitHub cache; this approach passed.

## 2026-10-27 nine-building staged construction and fractured roof review

**Preview-only.** Headquarters, Refineries and Barracks were re-rendered for
Coalition, Federation and Psionic, using actual full-size scaffold states
and independently editable broken roof geometry. Both successive targeted
workflows completed successfully:

- [Initial nine-building source-reopen and 80px/160px visual QA](https://github.com/shukritobi/chrono-dominion/actions/runs/40385597132).
- [Final fractured-roof nine-building render, source-reopen and contact sheets](https://github.com/shukritobi/chrono-dominion/actions/runs/40386121140).
- [Nine-building 80px/160px pixel QA script](../../tools/blender/qa_remaining_buildings.py).
- [Preview-only render workflow](../../.github/workflows/remaining-building-state-review.yml).

The saved editable `.blend` files for all nine were reopened and verified to
contain scaffolding, fractured facade meshes and the new broken roof plates.
All nine 160×800 RGBA atlases contain two idle, two construction and one
damaged frame, without clipping. Every construction frame was validated.
Actual 160px and 80px contact sheets were downloaded and inspected.

| Building | Coalition damaged alpha at 80px | Federation | Psionic |
|---|---:|---:|---:|
| HQ | 99 → **116** | 109 → **151** | 133 → **134** |
| Refinery | 86 → **102** | 97 → **112** | 69 → **69** |
| Barracks | 101 → **108** | 77 → **145** | 54 → **54** |

The 160px damaged alpha changes similarly improved for six of nine buildings:
Coalition HQ 388→470, Refinery 346→403, Barracks 436→466;
Federation HQ 416→594, Refinery 426→494, Barracks 308→587.
The construction pixel counts were identical before and after the damage
geometry pass, confirming no scaffold-state regression.

**Artistic finding:** Coalition/Federation damage reads better at 80px but
is still restrained. All three Psionic classes show effectively unchanged
damaged silhouettes: the added generic debris is obscured by their existing
floating/crystal architecture. The next geometry pass must specifically
remove signature upper Psionic hardware and add displaced, visible broken
crystals. Do not misrepresent source-geometry validation as proof of
stronger visible damage in those three cases.

**No production artwork was replaced.** A commit comparison against the
pre-development main revision showed changes only to Blender modeling,
animation, preview QA scripts, review workflows and QA documentation,
not the live texture atlas or its manifest.

## 2026-10-27 Psionic MK-IV collapsed crystal damage repair

**Preview-only; not published to game art.** The Psionic Headquarters,
Refinery and Barracks now have deliberately missing upper crystal hardware,
collapsed signature structures, three individually editable fallen faceted
crystals and a fractured roof cavity in their damaged frame. These are
original 3D meshes, not picture sprites. The untouched original meshes
remain editable in each saved .blend, and visibility is state-specific.

- [Successful three-building Blender render and pixel QA workflow](https://github.com/shukritobi/chrono-dominion/actions/runs/40393298356).
- [MK-IV damage geometry and state-specific visibility](../../tools/blender/animated_assets.py).
- [Targeted 80px and 160px comparison QA](../../tools/blender/qa_psionic_crystal_damage.py).
- [Targeted preview-only workflow](../../.github/workflows/psionic-crystal-damage-review.yml).
- Each of the **three** editable Blender sources was reopened successfully.
  The saved HQ / Refinery / Barracks sources contain **58 / 57 / 57**
  editable mesh objects, including three hidden damage-only crystal
  wreckage meshes and a fractured cavity each.
- All three atlases remain transparent **160×800 RGBA**, with five
  nonempty unclipped states and distinct idle RGBA frames.
- **Damaged alpha-mask change at 80px:** HQ **134 → 392** (+258);
  Refinery **69 → 151** (+82); Barracks **54 → 152** (+98).
- **Damaged alpha-mask change at 160px:** HQ **1,554**; Refinery
  **593**; Barracks **587** pixels.
- Early-construction versus idle changes at 160px remain **2,057 / 1,843 /
  1,260** pixels. Direct PNG comparison with the preceding nine-building
  archive confirmed the early construction frame is byte-identical for
  all three buildings; only damaged states were intentionally redesigned.
- Actual downloaded rendered PNGs were inspected side-by-side with the
  earlier damaged frames and current intact poses. At 80px, the HQ is
  conspicuously shorter and has lost its sovereign beacon and command ring;
  the Refinery has lost its upper resonator and floating crystal tips; the
  Barracks has lost both intact dormitory roof caps and exposed its court.
  Fallen shards are visible, though dark against the damaged purple shell.
- Visual polish still desirable: expose brighter fracture edges and
  asymmetrical broken roof gaps. The MK-IV damage is clearly distinguishable
  but not yet a complete destroyed-state animation.
- The current asset roster remains **Planned** for full critical/destroyed
  and power-out states. **No live sprite atlas or production manifest was
  changed by this modeling/review pass.**

## 2026-10-27 Federation Technology Lab MK-III mechanical clamp animation

**Preview-only; production atlas and manifest remain untouched.** The
Iron Federation's Siege Science Institute now has an independent editable
twin-jaw ballistic test clamp on an exposed hydraulic carriage. Its second
idle pose lifts the actual 32-vertex clamp mesh beyond the roofline rather
than changing only emissive RGB pixels.

- [Successful targeted Blender source reopen, render and pixel QA](https://github.com/shukritobi/chrono-dominion/actions/runs/40401409351).
- [New MK-III external test clamp mesh](../../tools/blender/building_architecture.py).
- [State-specific clamp elevation and damaged collapse](../../tools/blender/animated_assets.py).
- [Targeted headless Blender workflow](../../.github/workflows/federation-tech-clamp-review.yml).
- [160px/80px pixel acceptance and contact sheet generator](../../tools/blender/qa_federation_tech_clamp.py).
- The first attempt [failed an actual pixel QA gate](https://github.com/shukritobi/chrono-dominion/actions/runs/40401110038):
  the clamp visibly moved *within* the roof silhouette, but both idle
  alpha-mask differences were **0 pixels**. This was a real art/readability
  failure, not a missing Blender model.
- The corrected pose raises the clamp from **z=3.05** to **z=4.65** while
  extending it toward the exposed near-side gantry. Idle alpha-mask change
  increased from **0 to 282 pixels at 160px** and from **0 to 74 pixels at 80px**.
  Both idle frames remain RGBA-distinct.
- The five-frame atlas is **160×800 RGBA**. The editable compressed
  **128,763-byte .blend** source was reopened by Blender and verified to
  contain the **32-vertex clamp mesh** and **43 total mesh objects**.
- The first construction frame is **byte-identical** to the MK-II source
  render. First-construction-vs-idle alpha change remains **1,016 pixels
  at 80px**. Damaged-vs-idle alpha change remains **104 pixels at 80px**.
- I downloaded and inspected the actual **160px and 80px contact sheets**.
  At 80px the raised double-jaw fixture is now visibly above the roof,
  although its thin details remain subtle. At 160px the physical lift is
  unmistakable. Further polish could add a more substantial telescoping
  support mast, but the mechanical-idle milestone now passes.
- Preview archive includes the editable Blender source, original frame PNGs,
  packed atlas, alpha-difference image, both contact sheets and JSON metrics.
  No approved game artwork was published.

## 2026-10-27 MK-IV six Radar / Technology Lab physical destruction preview

**Preview-only. All six Blender sources and five-frame 160×800 RGBA atlases
were rendered; no live textures or production manifest were replaced.**
This pass adds a separate original, fully editable damage-wreckage module
[`radar_tech_wreckage.py`](../../tools/blender/radar_tech_wreckage.py)
and state-specific visibility in
[`animated_assets.py`](../../tools/blender/animated_assets.py).

- [Initial six-building headless Blender render, source-reopen and 80px/160px pixel QA](https://github.com/shukritobi/chrono-dominion/actions/runs/40410246463):
  **5 of 6 passed**, but the Federation Technology Lab failed the honest
  visual gate: its intact furnace remained upright and damage alpha changed
  only **111** pixels at 80px, up from **104** in MK-II. The failure was
  retained as an artifact rather than lowering the gate.
- [Successful focused Federation Lab repair](https://github.com/shukritobi/chrono-dominion/actions/runs/40410509055):
  hid the intact upper furnace shaft **only** in the damaged state, leaving
  a separately editable toppled furnace cylinder and torn test cradle.
  Its damage alpha rose from **111 to 209 pixels at 80px**, and from
  **461 to 870 pixels at 160px**. The repaired Blender source reopened
  with **53 editable mesh objects**, including the original and collapsed
  furnace. The moving MK-III test clamp still changes **74 idle alpha
  pixels at 80px**, and early construction still changes **1,016**.
- [Six-building Blender preview workflow](../../.github/workflows/radar-tech-damage-review.yml)
  and [strict image QA](../../tools/blender/qa_radar_tech_damage.py);
  [single-failure targeted repair workflow](../../.github/workflows/federation-tech-damage-fix.yml)
  and [repair QA](../../tools/blender/qa_federation_tech_damage.py).
- Each of the five first-pass sources was reopened in headless Blender with
  **43 / 43 / 44 radar meshes** and **46 / 48 tech meshes** for
  Coalition / Federation / Psionic respectively (Federation Tech separately
  reopened with 53 meshes). Damage-only meshes were hidden in the saved
  intact source. Construction frame 0 was pixel-identical to MK-II across
  all six, confirming no scaffold regression.
- Actual downloaded 160px and 80px contact sheets and the focused repaired
  Federation Lab were inspected. All six damaged poses have visibly removed
  signature upper equipment and separately editable broken hardware, not
  only a lighting or tilt change. Coalition's reflector is detached;
  Federation's phased array collapses; Psionic scanner gyres shatter;
  Coalition's science gantry falls; Federation's chimney collapses;
  Psionic's oracle rings and crystal spires break.

| Class | Coalition MK-II → MK-IV damage alpha at 80px | Federation | Psionic |
|---|---:|---:|---:|
| Radar | 122 → **324** (+202) | 181 → **322** (+141) | 146 → **293** (+147) |
| Technology Lab | 120 → **202** (+82) | 104 → **209** (+105) | 139 → **304** (+165) |

The consolidated local QA recomputed the prior MK-II pixel baselines from
the original archived PNGs, replaced **only** the failed Federation Tech
with the targeted repaired source and atlas, and verified that every
improvement exceeds 20 changed alpha pixels at 80px. All six retain
five populated, unclipped RGBA frames and editable Blender source.
A commit comparison from `9c671afb` through the focused repair found
**no modifications to published atlas files or their manifests**. Other
gameplay commits occurred concurrently; this review does not claim they
were part of the asset change.

**Visual limitation:** Fallen details are still small at 80px, especially
the Coalition lab's shattered glazing, but the lost roofline and scanner
silhouettes now read clearly. Critical/destroyed/power-out gameplay states
remain unimplemented, and none of these previews is approved for publication.

## 2026-10-27 Psionic MK-V physically hollow twin-horn factory

**Preview-only; five-frame production contract unchanged.** The MK-III
Psionic War Factory still used two solid planar facade meshes and five
glowing grille bars as a fake fabrication opening. The MK-V authored model
removes these panels, retains the tall twin-horn identity, and provides a
real +X front portal, a near-side -Y open manufacturing cell, a recessed
rear reactor wall, and an unfinished hovercraft with exposed nacelles.

- [Successful focused Blender render, source-reopen raycast and pixel QA](https://github.com/shukritobi/chrono-dominion/actions/runs/40417540169).
- [Original MK-V hollow factory meshes](../../tools/blender/building_architecture.py),
  [reopened-source geometry raycasts](../../tools/blender/verify_psionic_factory_bay.py),
  [actual 160px/80px PNG QA](../../tools/blender/qa_psionic_factory_bay.py),
  and [preview-only workflow](../../.github/workflows/psionic-hollow-factory-review.yml).
- The [first targeted render](https://github.com/shukritobi/chrono-dominion/actions/runs/40417403781)
  **failed an honest side-aperture geometry gate**: although front rays
  reached the rear reactor at **x=-0.672**, a near-side ray struck the old
  tall hexagonal podium at **y=-1.160**. Lowering the podium to a true
  low-profile foundation exposed the side workcell; the corrected ray hit
  a visible nacelle alignment fixture at **y=-0.462**. Both front probes
  at **z=1.56 and 1.68** still reached the reactor at **x=-0.672**.
- The corrected editable **135,547-byte .blend** reopened successfully;
  the five-frame transparent atlas remains **160×800 RGBA**, with five
  populated, unclipped frames and non-identical idle RGBA poses.
- Early construction versus idle: **2,031 changed alpha pixels at 160px**
  and **509 at 80px**. Damaged versus intact: **829 at 160px** and
  **204 at 80px**. Idle RGBA changes **4,800 pixels** at 160px.
- Independently compared the downloaded MK-V atlas against the archived
  MK-III factory atlas. The new intact frame changes **332 alpha pixels
  and 5,281 RGBA pixels at 160px**, or **72 alpha pixels and 1,487 RGBA
  pixels at 80px**. Silhouette intersection-over-union is **0.9370**
  at 160px and **0.9465** at 80px.
- The actual 160px and 80px PNG sheets were inspected: the former opaque
  green grille has been replaced by an open, lit internal assembly cell
  and visible unfinished hovercraft. The two tall purple fabrication
  horns remain identifiable. At 80px, tiny chassis details are subtle
  but the transparent portal reads more clearly.
- All outputs are GitHub Actions preview artifacts and downloadable
  editable models, **not approved live textures**. No published atlas
  or manifest was changed by this asset pass.

The following **additional states are separate experiments**, not changes
to the existing five-frame atlas:
[extended-state Blender renderer](../../tools/blender/preview_extended_factory_states.py),
[quantitative extra-state QA](../../tools/blender/qa_extended_factory_states.py),
and [independent review workflow](../../.github/workflows/psionic-factory-extra-states-review.yml).
They load the already validated MK-V source without rerendering the
five-frame atlas and stage critical, destroyed and power-out PNGs plus a
second editable .blend.

- [Successful targeted three-extra-state Blender review](https://github.com/shukritobi/chrono-dominion/actions/runs/40417852307).
  The job downloaded the previously verified MK-V .blend and five-frame
  atlas, rather than generating either again. A second **editable
  129 KB .blend** source was saved with three hidden, separate wreckage
  meshes; it was reopened in Blender and all three were verified editable
  and hidden in the intact state.
- At **160px**, critical changes **539 alpha pixels**, destroyed
  **1,334**, and power-out **0** (intact geometry). At **80px**, the
  corresponding alpha differences are **138 / 342 / 0**.
- At **80px**, changed RGBA pixels are **1,322 critical**, **1,420
  destroyed** and **1,349 power-out**. The power-out frame removes
  emissive lighting without moving or destroying the structure.
- Downloaded the actual 160px and 80px contact sheets and inspected all
  four poses. Critical removes one tall horn and introduces damaged
  fragments; destroyed collapses both tall horns and the upper portal
  while leaving a lower wreck; power-out preserves the architecture but
  visibly extinguishes the cyan/mint illumination.
- The existing five-frame **160×800 RGBA atlas SHA-256 remained exactly
  `9a52394ab1bc421971b30593819d5687d0d15bd4777006fa3abcbfb441aae7af`**
  before and after rendering. The three new images are **separate
  160×160 PNGs**, not a modification of the game atlas. This is a
  successful preview-only pilot, **not approved for publication**.

## Ordered next tasks for hourly agent

1. **Extend extra states to other buildings:** reuse the validated
   Psionic Factory critical/destroyed/power-out preview approach for the
   other faction buildings, starting with defenses and airfields. Keep
   three separate state PNGs and editable Blender geometry, not live atlases.
2. **Damage polish:** add bright fracture edges and more visible displaced
   mechanical wreckage where 80px inspection shows subtle fragments.
3. **Remaining assets:** finish defenses, airfields, unmodeled vehicle types,
   32-facing movement and destruction, then assess art integration only
   after explicit approval.

**Never overwrite approved game textures without explicit approval.**


## 2026-10-27 Three-faction defense turret extended-state pilot (in verification)

This pilot extends the separate critical/destroyed/power-out contract from the
validated Psionic Factory to **Coalition, Federation and Psionic defense turrets**.
The existing five-frame `160×800` atlas remains the baseline; each turret gets
three **separate** `160×160` transparent PNGs and a second editable
`.blend` with hidden broken-weapon meshes. These are **preview-only** and
are not connected to live art or production manifests.

- [Original faction-aware broken turret modeling](../../tools/blender/preview_defense_extended_states.py)
  uses a fallen gun carriage, torn armor and buckled mast. Signature upper
  weapons are physically hidden in critical/destroyed states.
- [Quantitative PNG QA and 80px/160px contact sheets](../../tools/blender/qa_defense_extended_states.py)
  require >=25 changed 80px alpha pixels for critical, >=65 for destroyed,
  <30 for power-out and >=100 changed 80px RGBA pixels for power-out.
- [Targeted headless Blender review workflow](../../.github/workflows/defense-turret-extended-states-review.yml)
  renders **only** three previously unrendered turret classes, reopens
  each extended source, checks its hidden editable wreckage, and uploads
  the separate source, atlases, PNGs and measurements.
- Modeling commit `9e4bf469ca9b21e354fbd36cfe2008889bd9ef4c`;
  QA commit `c7d168777b710c89afc126e338d00063c0a7e2ef`.

**Status:** [initial workflow run #40424726108](https://github.com/shukritobi/chrono-dominion/actions/runs/40424726108) was running at the last check; [corrected checksum-path run #40424741912](https://github.com/shukritobi/chrono-dominion/actions/runs/40424741912) was queued behind it under workflow concurrency. The second run is the authoritative one. Measured pixels and reopened sources must be checked before calling the pilot validated. No approved textures were overwritten. If an 80px gate
fails, fix geometry instead of lowering thresholds. Next: extend the proven
pipeline to beam defenses and airfields, then remaining vehicles.


**Pilot QA correction:** [first attempted run #40424726108](https://github.com/shukritobi/chrono-dominion/actions/runs/40424726108)
rendered and reopened all three editable wreckage sources, but failed the
80px critical silhouette gate for Psionic turret: **5 changed alpha pixels**
(34 at 160px), while its destroyed state reached **74 at 80px** and
power-out changed **989 RGBA pixels** without alpha change. The failed
artifact was preserved for comparison. The [second run #40424741912](https://github.com/shukritobi/chrono-dominion/actions/runs/40424741912)
reproduced the honest visual failure after fixing the checksum command.
The [corrective geometry commit](https://github.com/shukritobi/chrono-dominion/commit/f6a7b6300a557659660286c311988f1d97752aca)
removes the intact Psionic guard/lens during critical damage and elevates
a physically broken fin beyond the old roofline; [targeted rerun #40424902726](https://github.com/shukritobi/chrono-dominion/actions/runs/40424902726)
was launched. **Do not mark this pilot passed until the new actual PNG QA passes.**


### Final validated three-faction turret review (27 October 2026)

[Successful targeted Blender workflow #40424902726](https://github.com/shukritobi/chrono-dominion/actions/runs/40424902726)
produced three original editable turret .blend sources, three independent
extended-state .blend sources, three untouched five-frame 160x800 RGBA atlases,
nine extra 160x160 RGBA PNGs, 80px/160px contact sheets, and JSON pixel QA.
The extra sources were **reopened in headless Blender** and each had five
separate hidden, editable wreckage meshes. All three original atlas SHA-256
hashes passed post-render verification.

| Faction | Critical alpha changed 160/80 | Destroyed alpha 160/80 | Power-out alpha 80 | Power-out RGBA changed 80 |
|---|---:|---:|---:|---:|
| Coalition | 399 / **102** | 503 / **127** | 0 | **1,060** |
| Federation | 376 / **90** | 542 / **132** | 0 | **1,179** |
| Psionic | 422 / **105** | 305 / **74** | 0 | **989** |

The failed first Psionic critical pose changed just **5 alpha pixels at 80px**;
after exposing broken crown geometry, the final pass changed **105**.
Actual downloaded 160px and 80px contact sheets were inspected. The three
factions remain visibly distinct. **Visual limitation:** the Federation
destroyed pose is a clean low armored bunker with removed cannon, but
scattered debris is still subtle at 80px. The next polish should make the
front wall visibly fractured without making the pose clip its frame.

[Download successful preview artifact](https://github.com/shukritobi/chrono-dominion/actions/runs/40424902726/artifacts/12698528405).
**Preview-only; no live textures or production manifests modified.**
Next priority: airfields and beam defenses, then unfinished vehicles.


## 2026-10-27 Coalition Modular Support Carrier, original 32-facing Blender pilot

**Preview-only, pending actual Actions pixel QA.** This is a new unmodeled
Coalition modular support carrier (AssetRegister COA-VEH-003), not a rerender
of previously validated buildings or existing unit atlases.

- [Editable original Blender model generator](../../tools/blender/preview_coalition_carrier_32.py)
  creates a six-wheel armoured chassis, sloped glacis, independently animated
  suspension and wheel spokes, rotatable twin-mode pulse turret, personnel
  ramp, mast and four hidden editable wreckage meshes.
- [Strict 32-facing 160px/80px image QA](../../tools/blender/qa_coalition_carrier_32.py)
  requires 128 nonempty, unclipped RGBA images: 32 directions each for
  idle, move, attack and destroyed. It checks adjacent facing uniqueness,
  80px animation differences and physically changed destroyed silhouettes.
- [Targeted preview workflow](../../.github/workflows/coalition-carrier-32-facing-review.yml)
  uses checksum-verified Blender 4.2.23, reopens the saved .blend, verifies
  four hidden editable wreckage meshes, builds a separate **5120x640**
  four-row, 32-column preview atlas, emits 160px/80px contact sheets and
  per-facing JSON measurements. **This is not the existing five-frame
  game atlas contract and must not be installed without renderer changes.**
- Modeling commit [96c5d02c](https://github.com/shukritobi/chrono-dominion/commit/96c5d02c2c41b5bd19f314c606a0cc1029d62227),
  QA commit [16c00ef7](https://github.com/shukritobi/chrono-dominion/commit/16c00ef7f298ac939ae9e3fe612fb51f115c685b),
  workflow commit [13dd6d34](https://github.com/shukritobi/chrono-dominion/commit/13dd6d3439aed9fc469b58539cd6da56fc17565c).
- [Targeted workflow run #40441986334](https://github.com/shukritobi/chrono-dominion/actions/runs/40441986334)
  was **in progress** at the first check. Do not claim validated
  render, reopened source, measured pixels or visual inspection until
  actual artifacts have been checked. Do not trigger duplicate jobs.

The source branch contains only modeling scripts, QA, workflow and documentation;
**no live textures or production manifests were modified**. Next: inspect
actual run, repair any failed geometry gates, then extend to Federation and
Psionic carrier variants and the remaining vehicle roster.


### Final verified carrier review (27 October 2026)

[Successful targeted GitHub Actions run #40441986334](https://github.com/shukritobi/chrono-dominion/actions/runs/40441986334)
completed **every step successfully**, including Blender 4.2.23 installation,
128 original renders, saved source reopening, four hidden editable wreckage
meshes and 80px/160px PNG QA. [Download original workflow artifact](https://github.com/shukritobi/chrono-dominion/actions/runs/40441986334/artifacts/12706442520).

The artifact was downloaded and its **actual** 160px and 80px contact sheets
visually inspected. It contains a **126,157-byte editable .blend**, 128
160x160 RGBA frame PNGs, one separate 5120x640 preview-only atlas,
both gameplay-scale contact sheets and pixel-qa.json. The six-wheel
silhouette, sloped glacis, raised communication spine and twin pulse turret
remain readable across eight sampled orientations. Destroyed poses visibly
expose orange fractures and displace the turret and mast. The movement
suspension is visually subtle at 80px, but measurably changes pixels.
The attack flare is bright at 80px; future art polish may reduce its width.

Independent inspection of the downloaded JSON across **all 32 directions**:

| 80px metric | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Move vs idle changed RGBA pixels | **831** | 1,181 | 1,058.4 |
| Attack vs idle changed RGBA pixels | **491** | 848 | 665.7 |
| Destroyed vs idle changed RGBA pixels | **885** | 1,317 | 1,145.4 |
| Destroyed vs idle changed alpha pixels | **511** | 782 | 647.1 |
| Adjacent-facing idle RGBA differences | **904** | 1,210 | 1,096.8 |

All 128 frames are nonempty, 160x160 RGBA and unclipped. Every adjacent
facing differs in actual 80px pixels; no direction is a copied sprite.
**Source and artifact passed.** This is a new 32-direction *preview* format,
not a production asset manifest update. [Draft PR #26](https://github.com/shukritobi/chrono-dominion/pull/26)
changes **exactly four files**: the original modeling script, QA script,
targeted workflow and this QA document. There are **zero live textures,
game manifests or runtime modifications**.

Next: extend this authored carrier geometry to Federation and Psionic
faction-specific vehicle designs, then validate 32-facing movement/destruction
for other missing vehicle classes. Do not rerender this unchanged validated
Coalition carrier in the next run.


## 2026-10-27 Federation AR-9 recovery carrier, original 32-facing preview (verification pending)

**Preview-only.** Follows the independently validated Coalition Modular Support
Carrier without rerendering it. The new Iron Federation AR-9 is an original
tracked battlefield-recovery vehicle, **not** a recolored Coalition chassis.
Its model has a raked armored recovery plow, seven separate road wheels per
side, individual visible steel track cleats, a sloped protected cabin, side
ladders, hydraulic extraction crane, winch drum and warning lights.

- [Original editable Blender source generator](../../tools/blender/preview_federation_recovery_carrier_32.py)
  imports only the previously validated modeling utilities, while building
  distinct Federation geometry from scratch.
- [Strict 128-frame image QA](../../tools/blender/qa_federation_recovery_carrier_32.py)
  checks all 32 facings across idle/move/attack/destroyed, frame bounds,
  adjacent-facing uniqueness, and 80px movement/attack/destroyed differences.
- [Targeted preview-only render workflow](../../.github/workflows/federation-recovery-carrier-32-review.yml)
  reopens the editable Blender source and checks five hidden, independent
  wreckage meshes. It produces a 5120x640 **review-only** atlas and
  160px/80px contact sheets, not an existing game sprite manifest.
- All rendered art stays in GitHub Actions artifacts. No live art,
  game runtime, or production manifest is touched.

**Pending verification:** Record actual workflow run, Blender reopen results,
per-facing 80px/160px pixel metrics, and visual inspection after the first
targeted render. Repair genuine geometry failures rather than weakening
thresholds. Do not claim success before artifact review.


### Final verified Federation AR-9 review (27 October 2026)

[First run #40448398281](https://github.com/shukritobi/chrono-dominion/actions/runs/40448398281)
rendered **all 128** frames, but the source-reopen check incorrectly searched
for a Coalition `turret` object rather than the Federation `crane` object.
This was a **workflow assertion bug**, not a failed render or broken mesh.
[Correction commit b619e924](https://github.com/shukritobi/chrono-dominion/commit/b619e9247784ebd6c869f05152f305b09d3c2ba8)
repaired the assertion without changing model geometry or reducing image QA
thresholds. [Successful targeted rerun #40448534553](https://github.com/shukritobi/chrono-dominion/actions/runs/40448534553)
passed every job step, including Blender 4.2.23 source reopening with
**five hidden editable wreckage meshes** and the named crane.

The successful [artifact #12709506607](https://github.com/shukritobi/chrono-dominion/actions/runs/40448534553/artifacts/12709506607)
was downloaded and inspected. It contains a **131,155-byte editable .blend**,
128 unclipped 160x160 RGBA frames, a separate 5120x640 preview atlas,
160px/80px contact sheets, and per-facing `pixel-qa.json`.
The image QA passed every direction; independent local recomputation of the
first-run frames matched the final JSON values exactly.

| Changed pixels at 80px | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Move vs idle RGBA | **1,148** | 1,680 | 1,481.3 |
| Attack vs idle RGBA | **608** | 1,028 | 825.0 |
| Destroyed vs idle RGBA | **1,223** | 1,780 | 1,565.4 |
| Destroyed vs idle alpha | **622** | 1,042 | 865.1 |
| Adjacent-facing idle RGBA | **1,243** | 1,692 | 1,513.8 |

The actual 160px and 80px PNG contact sheets were visually inspected.
The distinctive low tracked body, raked plow, sand-colored operator cab,
upright recovery crane and amber extraction hook remain readable at 80px.
Attack rotates the recovery arm; destroyed removes the upper jib and
roof, leaving a lower broken chassis and displaced fracture pieces.
**Visual limitation:** the tracked suspension's small bob is subtle at
80px, and one separated dark crane fragment reads as floating debris in
the destroyed pose. A later art polish can ground that fragment.

The [Asset Register](../../planning/AssetRegister.csv) now assigns this
new original vehicle **FED-VEH-010**. It does not replace the registered
FED-VEH-003 Shrapnel Carrier. [Draft PR #29](https://github.com/shukritobi/chrono-dominion/pull/29)
targets the Coalition preview branch to reuse its original Blender
utility helpers without copying or rerendering its validated asset.
**Preview-only: no live game textures, manifest or runtime changes.**
Next: original Psionic vehicle with independent 32-facing animation.


## 2026-10-27 Psionic Phase-Loom hover carrier: 32-facing original preview

**New preview implementation; render/pixel QA pending.** The next original
Psionic vehicle is **PSI-VEH-008**, a floating Phase-Loom logistics and
phase-projector craft. It does not recolour the Coalition six-wheel carrier
or Federation AR-9 tracks. Its physically forked front horns leave a
visible central phase channel, with independently articulated lateral
wings, suspended crystal reactor, levitation coils and a projected attack
lance. The destroyed pose hides intact horns and upper reactor parts and
shows **seven separately editable broken meshes** with exposed fracture
materials. Movement changes hover height, fin pose and core rotation;
attack opens the fins and extends a separate phase lance.

- [Original Blender generator](../../tools/blender/preview_psionic_phase_loom_carrier_32.py)
  saves a compressed editable .blend in the idle pose and renders **128
  original 160x160 RGBA frames** (32 facings × idle/move/attack/destroyed).
- [Strict image QA](../../tools/blender/qa_psionic_phase_loom_carrier_32.py)
  checks every image for alpha bounds, compares all four states at 80px,
  requires >=20 move RGBA, >=40 attack RGBA and >=65 destroyed alpha changed
  pixels, and checks every adjacent facing differs by >=20 RGBA pixels.
  It generates 160px and 80px contact sheets and a separate **5120x640
  review atlas**. These are not game-compatible production atlases.
- [Targeted branch-scoped Blender workflow](../../.github/workflows/psionic-phase-loom-carrier-32-review.yml)
  uses checksum-verified Blender 4.2.23, reopens the saved .blend and
  asserts seven hidden editable wreckage meshes, two forward horn groups
  and a suspended spindle before checking all actual PNGs.
- Model commit [e6a19f30](https://github.com/shukritobi/chrono-dominion/commit/e6a19f3080bd65a14bc49f3aa1ba9f8ea6a161ae);
  pixel QA commit [82bdf8d8](https://github.com/shukritobi/chrono-dominion/commit/82bdf8d84921b5aa5fa099d25bdcd734f0f124dc);
  QA correction [546531b1](https://github.com/shukritobi/chrono-dominion/commit/546531b12685241f4b165474f8e4e4d017682efd);
  workflow commit [715345da](https://github.com/shukritobi/chrono-dominion/commit/715345da4cf169cb143cf1cc6d3df842a3bf0526).

**Verification boundary:** Blender is not installed in the local execution
container, so do **not** claim this model has rendered, reopened, passed
pixel gates or been visually inspected until the targeted GitHub Actions
artifact is available and checked. If any 80px gate fails, repair geometry
rather than lowering thresholds. Do not duplicate an already running job.
**No production art, live textures, runtime code or manifests were changed.**

### Final verified Psionic Phase-Loom render (27 October 2026)

The first targeted [workflow #40453851489](https://github.com/shukritobi/chrono-dominion/actions/runs/40453851489)
failed **before rendering** because Blender's script execution did not put
the shared modeling helper directory on `sys.path`. No geometry gate
failed; [import-path fix commit 7272efb5](https://github.com/shukritobi/chrono-dominion/commit/7272efb5eb3ed5dd6aa1c4a4942e6efbda1a074c)
restored the established helper-import pattern without changing the model.
The automatic [targeted workflow #40453937907](https://github.com/shukritobi/chrono-dominion/actions/runs/40453937907)
then **passed every step**: Blender 4.2.23 rendered all 128 RGBA frames,
saved and reopened the **122,289-byte editable .blend**, confirmed
**seven hidden editable wreckage meshes**, both independent horn groups
and the suspended spindle, and passed strict 80px pixel gates.

The [successful preview artifact #12711387091](https://github.com/shukritobi/chrono-dominion/actions/runs/40453937907/artifacts/12711387091)
was downloaded and extracted. It contains all 128 unclipped 160×160 RGBA
frames, a separate 5120×640 preview atlas, actual 160px/80px contact
sheets and per-facing JSON QA. The actual contact sheets were visually
inspected: the purple twin-prong hover silhouette and mint phase channel
read at 80px, attack projects a bright central lance, and destruction
physically removes the intact horns and exposes orange fracture pieces.
The central reactor is subtle at 80px; hovering movement reads more as
a small displacement than as obvious mechanical articulation. No
rerender of previously validated Coalition/Federation vehicles occurred.

| Changed pixels at 80px | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Move vs idle RGBA | **884** | 1,140 | 1,055.7 |
| Attack vs idle RGBA | **879** | 1,050 | 959.6 |
| Destroyed vs idle RGBA | **947** | 1,141 | 1,059.1 |
| Destroyed vs idle alpha | **686** | 865 | 786.5 |
| Adjacent-facing idle RGBA | **947** | 1,110 | 1,037.1 |

**Preview QA passed; not playable yet.** The 32-direction four-state
5120×640 atlas is *not* compatible with the existing 1/8-direction game
loader. The separate preview branch and draft PR retain only modeling,
QA, workflow and documentation changes. No live art, textures,
production manifests or runtime files were modified.

Next: review and polish Psionic phase-core readability at 80px, then
continue missing faction vehicle classes and 32-direction destruction.


## 2026-10-27 Federation Hailstorm rocket artillery: original 32-facing preview

**Preview-only; verified in the targeted Blender workflow, not installed in the game.**
New original **FED-VEH-005** geometry is an eight-wheel Federation siege
artillery chassis, not a recolored Coalition carrier or AR-9 recovery vehicle.
It has eight independently editable wheel hubs, two independently modeled
triple-rocket cassettes with six missile barrels, an elevating launcher rack,
hydraulic rear stabilizers, an armored ammunition magazine, orange targeting
optics, an attack-only rocket/exhaust, and **six independent hidden wreckage
meshes**. Destroyed mode physically removes intact launch equipment and
exposes broken missile pods, torn launcher and hot fracture surfaces.

- [Original Blender modeling and four-state renderer](../../tools/blender/preview_federation_hailstorm_32.py):
  32 directions × idle/move/attack/destroyed = **128 160×160 transparent RGBA
  PNGs**, plus a compressed editable `.blend`.
- [Strict PNG and 80px QA](../../tools/blender/qa_federation_hailstorm_32.py)
  checks 128 frame bounds, all 32 adjacent facings, movement/attack changes,
  and destroyed silhouette changes. It also generates a separate 5120×640
  review atlas and 160px/80px contact sheets. It does **not** publish an
  atlas compatible with the current game's 1/8-facing loader.
- [Targeted preview-only workflow](../../.github/workflows/federation-hailstorm-32-review.yml)
  uses checksum-verified Blender 4.2.23, reopens the editable source and
  asserts six hidden wreckage meshes, eight independent wheel hubs, two
  triple-rocket cassettes and six live missile barrels.
- Modeling commit [5b3008a6](https://github.com/shukritobi/chrono-dominion/commit/5b3008a66f02e82526d10571982dcbbf331b4695);
  QA commits [8f039d08](https://github.com/shukritobi/chrono-dominion/commit/8f039d08d2d9b4ce58104c67ba91c8590907df96)
  and [5de0584e](https://github.com/shukritobi/chrono-dominion/commit/5de0584ed6e0cbab482ca4501c93f1120e07a6b3);
  workflow commit [61ff4c96](https://github.com/shukritobi/chrono-dominion/commit/61ff4c967df965b623d2153a751aaa293706ef7e).
- [Successful targeted Actions run #40459582654](https://github.com/shukritobi/chrono-dominion/actions/runs/40459582654)
  passed script compilation, all 128 Blender renders, saved-source reopening,
  all 80px image gates and artifact upload. The
  [preview artifact #12713757701](https://github.com/shukritobi/chrono-dominion/actions/runs/40459582654/artifacts/12713757701)
  was downloaded and extracted: **137,077-byte editable Blender source**,
  128 PNG frames, 5120×640 review atlas, two contact sheets and JSON QA.
  The actual 160px and 80px contact sheets were visually inspected.

| Changed pixels at 80px | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Move vs idle RGBA | **1,073** | 1,562 | 1,396.2 |
| Attack vs idle RGBA | **802** | 1,231 | 1,054.5 |
| Destroyed vs idle RGBA | **1,279** | 1,586 | 1,471.3 |
| Destroyed vs idle alpha | **718** | 950 | 860.8 |
| Adjacent-facing idle RGBA | **1,149** | 1,561 | 1,434.3 |

Independent local recomputation of destroyed alpha differences at directions
00/07/15/23/31 matched the JSON exactly: **867 / 918 / 871 / 867 / 819**
pixels respectively. All 128 frames are present. At 80px the twin upper
missile pods and long firing rocket remain identifiable, while destroyed
mode visibly breaks the launcher and scatters orange-exposed fragments.

**Visual limitations:** The idle-to-move suspension bob is small and the
attack rocket appears like a narrow extended glowing rod at 80px rather
than a fully staged launch animation. A later animation pass can add
exhaust particles and multi-frame firing without replacing this validated
model. This preview branch depends on unmerged [Psionic preview PR #31](https://github.com/shukritobi/chrono-dominion/pull/31)
for shared original Blender helper primitives; [draft PR #33](https://github.com/shukritobi/chrono-dominion/pull/33)
targets that preview branch. No older validated asset was rerendered.

**Never overwrite unapproved game textures or manifests.** No live art,
production atlas, runtime or gameplay files were modified. Next: continue
remaining vehicle classes and plan the 32-facing loader separately.


## 2026-10-27 Coalition Autonomous Warden Tank — validated 32-facing preview

**Preview-only; not approved for publication.** The new **COA-VEH-004**
is an unmanned split-track sentinel, distinct from the Coalition Modular
Support Carrier: two separately armoured track pods, animated individual
cleats, chevron glacis, gyrostabilised faceted sensor crown, two ion accelerator
barrels, panoramic sensor visor, illuminated optics, and eight independently
editable wreckage meshes. The destroyed pose hides intact upper weapons and
roof components, then exposes fallen cannons, ruptured capacitor, detached
track guard and raised roof armour. No previously validated model is rerendered.

- [New original Blender model and renderer](../../tools/blender/preview_coalition_warden_32.py)
  saves an intact editable `.blend` and produces 32 directions ×
  idle/move/attack/destroyed = **128 transparent 160px RGBA frames**.
  Modeling commit [ae7d842a](https://github.com/shukritobi/chrono-dominion/commit/ae7d842ab2a05cdcb9da2d333f3384277ec80bfa).
- [Strict pixel QA](../../tools/blender/qa_coalition_warden_32.py)
  checks 128 frames, 160px alpha bounds, 80px movement and ion-attack
  visibility, 80px destroyed alpha, and all 32 adjacent facing differences.
  It generates a **5120×640 preview atlas**, 160px/80px contact sheets
  and per-facing JSON. QA commit [4635adab](https://github.com/shukritobi/chrono-dominion/commit/4635adabe294ec5a19f38e08f008812d9f92033f).
- The [targeted preview workflow](../../.github/workflows/coalition-warden-32-review.yml)
  will compile the scripts, render only the new Warden in headless Blender
  4.2.23, reopen the saved source to verify hidden editable wreckage, inspect
  actual 160px/80px PNGs, and upload review-only artifacts.
- **Verified:** [successful targeted Actions run #40471597359](https://github.com/shukritobi/chrono-dominion/actions/runs/40471597359)
  passed script compilation, checksum-verified Blender 4.2.23 rendering of all
  128 RGBA frames, reopening the **131,367-byte editable .blend**, and every
  strict 80px pixel gate. The reopened source contains **8 hidden editable
  wreckage meshes**, **18 individual track cleats**, and **2 ion barrels**.
  [Artifact #12718354515](https://github.com/shukritobi/chrono-dominion/actions/runs/40471597359/artifacts/12718354515)
  was downloaded and its actual 160px/80px contact sheets visually inspected.
  The archive contains 128 PNGs, 5120×640 preview atlas, editable source,
  two contact sheets and JSON pixel QA. No previously validated asset was
  rerendered.

| Changed pixels | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Move vs idle RGBA at 80px | **925** | 1,233 | 1,111.8 |
| Attack vs idle RGBA at 80px | **713** | 944 | 855.1 |
| Destroyed vs idle RGBA at 80px | **985** | 1,261 | 1,164.8 |
| Destroyed vs idle alpha at 80px | **557** | 722 | 639.8 |
| Destroyed vs idle alpha at 160px | **933** | 1,376 | 1,120.7 |
| Adjacent-facing idle RGBA at 80px | **1,008** | 1,226 | 1,136.3 |

Independently recomputed 80px destroyed-alpha changes for facings
00/07/15/23/31: **620 / 699 / 674 / 661 / 611** pixels, exactly matching
the JSON report. At 80px, the twin-ion turret and bright orange battery
rupture are identifiable, and the destroyed pose clearly loses the intact
sensor crown. **Visual limitation:** the track-cleat movement is subtle
at 80px, and the attack state is a single posed energy discharge rather
than a temporal firing sequence. This is a preview, not a game-ready
32-facing animation runtime.

**Dependency:** based on the unmerged Federation Hailstorm preview branch
([draft PR #33](https://github.com/shukritobi/chrono-dominion/pull/33)),
which contains the shared original Blender modeling helpers. The current
game loader supports 1/8 directions, not this separate 32-facing preview.
No live texture, atlas manifest or gameplay file was modified.


## 2026-10-27 Psionic Gravitic Manipulator — 32-facing review candidate

**PREVIEW ONLY, verification pending.** PSI-VEH-005 is a newly authored,
editable Blender magnetic-lifting vehicle, not a recolour or re-render of
the already validated Phase-Loom hover carrier. Its silhouette uses four
separate levitating traction pads, a low armored spine, a tall independent
rotating lifting spindle, and two raised articulated horseshoe magnet jaws
with a physically open center. The attack pose spreads the jaws and projects
a vertical field and suspended crystal. The destroyed pose hides intact
upper magnetic machinery and reveals eight separate editable wreckage meshes
with fractured orange induction coils.

- [Original procedural model and 128-frame renderer](../../tools/blender/preview_psionic_gravitic_manipulator_32.py)
  produces idle/move/attack/destroyed, 32 facings per state, 160×160 RGBA.
- [80px and 160px pixel acceptance checks](../../tools/blender/qa_psionic_gravitic_manipulator_32.py)
  reject edge clipping, duplicate adjacent facings, invisible movement or
  attacks, and damage without changed alpha silhouette.
- [Targeted preview-only workflow](../../.github/workflows/psionic-gravitic-manipulator-32-review.yml)
  installs checksum-verified Blender 4.2.23, renders only this new vehicle,
  reopens the saved .blend and checks eight hidden wreckage meshes, four
  independent gravitic skids and two magnetic jaws.
- Modeling commit [aa5e7fff](https://github.com/shukritobi/chrono-dominion/commit/aa5e7fff5d08e7262847fb07df496256b97da33a);
  initial QA commit [9450f172](https://github.com/shukritobi/chrono-dominion/commit/9450f172fa894823b01e33d9d135790403ea8a84);
  corrected workflow commit [aa9ece54](https://github.com/shukritobi/chrono-dominion/commit/aa9ece54490a100aa624ab182016e849f6de3f0a).
- **Verification status:** pending actual GitHub Actions render, saved-source
  reopen and real 160px/80px PNG inspection. Do not claim the asset passed
  until the workflow finishes successfully and actual image metrics are read.
  No existing approved five-frame atlas is rerendered or modified.

**Blockers / next check:** inspect any clipping at the extreme side facings,
verify magnetic jaws read distinctly at 80px, and confirm the orange wreckage
fractures remain visible. The current game runtime only supports 1/8-facing
baked sprites, so this 32-facing preview remains unintegrated. No live
sprites, manifest, runtime or gameplay files are changed.


### Final verified Gravitic Manipulator review — 27 October 2026

**Passed, supersedes the pending status above.**
[Successful targeted workflow #40478892855](https://github.com/shukritobi/chrono-dominion/actions/runs/40478892855)
rendered exactly 128 original 160×160 RGBA frames and a separate
5120×640 preview atlas. The saved **125,369-byte editable .blend** reopened
successfully in Blender 4.2.23 with **8 hidden wreckage meshes, 4 articulated
field skids and 2 independently articulated magnetic jaws**.
[Preview artifact #12720899703](https://github.com/shukritobi/chrono-dominion/actions/runs/40478892855/artifacts/12720899703)
contains 128 frame PNGs, the source, contact sheets and JSON metrics.

| Actual changed pixels | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Move vs idle RGBA, 80px | **1,095** | 1,210 | 1,168.2 |
| Attack vs idle RGBA, 80px | **835** | 983 | 926.6 |
| Destroyed vs idle RGBA, 80px | **1,067** | 1,268 | 1,177.0 |
| Destroyed vs idle alpha, 80px | **692** | 837 | 757.4 |
| Destroyed vs idle alpha, 160px | **1,239** | 1,818 | 1,509.0 |
| Adjacent idle facings RGBA, 80px | **1,104** | 1,184 | 1,148.5 |

The actual 160px and 80px contact sheets were downloaded and inspected.
Independent Pillow alpha-difference checks at 80px for facings
00/07/15/23/31 returned **714 / 808 / 740 / 755 / 706**,
matching the artifact's JSON exactly. The four pads, paired raised
magnetic jaws, bright central spindle and wreckage remain distinguishable
at gameplay scale. The destroyed pose clearly loses the intact field
tower and exposes orange broken induction equipment.

**Visual limitation:** at 80px the narrow lifting field resembles a bright
vertical column more than a dramatic magnetic vortex, and the field-drive
suspension has only one movement pose. A future temporal attack animation
should add a widening magnetic ring or curved energy arc. Do not replace
the already verified preview merely to tweak it without a targeted art
review. **No live textures, manifests, runtime or gameplay were changed.**


## 2026-10-27 Psionic Gravitic Manipulator — four-phase 32-facing attack sequence (awaiting render QA)

**Preview-only; not approved for publication.** This pass addresses the
validated PSI-VEH-005's single-frame vertical magnetic attack by adding
an original **charge → grip → discharge → release** sequence. The original
validated model and 128-frame source atlas are **not rerendered**. The
targeted workflow downloads the successful Blender artifact from
[run #40478892855](https://github.com/shukritobi/chrono-dominion/actions/runs/40478892855),
loads its saved editable `.blend`, and renders only **128 new 160×160
RGBA temporal frames** (four phases × 32 facings) to an isolated preview
directory. This branch is based on the unmerged [PR #39](https://github.com/shukritobi/chrono-dominion/pull/39).

- [Original editable temporal Blender geometry](../../tools/blender/preview_psionic_gravitic_attack_sequence.py):
  three separate luminous toroidal field hoops and four curved magnetic
  filaments, with phase-specific jaw opening, tower rotation, crystal lift,
  coil expansion and beam visibility. A **new** `.blend` is saved with
  seven hidden `temporal_only` objects; the eight pre-existing wreckage
  meshes remain intact and hidden.
- [Strict pixel QA](../../tools/blender/qa_psionic_gravitic_attack_sequence.py):
  128 frame dimensions, RGBA alpha bounds, all 32 facings, consecutive
  phase difference >=35 changed RGBA pixels at **80px**, peak vs archived
  attack >=50, peak vs idle >=80 RGBA and >=20 alpha pixels. Writes
  per-facing JSON, 160px/80px contact sheets, and a **separate** 5120×640
  temporal preview atlas.
- [Targeted preview workflow](../../.github/workflows/psionic-gravitic-temporal-attack-review.yml):
  downloads the archived source artifact rather than rebuilding it,
  installs checksum-verified Blender 4.2.23, reopens the new editable
  `.blend`, checks 3 torus meshes + 4 curve objects + 8 existing wreckage
  meshes, and compares the original atlas SHA-256 before/after.
- Modeling commit [aca140c1](https://github.com/shukritobi/chrono-dominion/commit/aca140c14f086800343aeb21605598be33e9738a);
  QA commit [9cfd8a43](https://github.com/shukritobi/chrono-dominion/commit/9cfd8a43ecbdd8a19a9f41d621ee2d5edb41f7cb);
  workflow commit [065dd766](https://github.com/shukritobi/chrono-dominion/commit/065dd766cad0f42672475f2bd2688cc63d307a23).

**Targeted workflow launched:** [Actions run #40486481510](https://github.com/shukritobi/chrono-dominion/actions/runs/40486481510), initially confirmed to have downloaded the archived source, compiled the new scripts, and entered the 128-frame Blender render step. Archived source preview atlas SHA-256 independently verified from the original artifact: `4f5e4c9b8a90262407fd5145e6363e695d3012642509da40c1861e497441c6f2` (the workflow checks its SHA again after rendering).

**Current verification status: pending Actions render and real PNG inspection.**
Do not report pixel metrics or source reopen as passed until the targeted
workflow finishes and actual artifact is inspected. Potential blockers:
the new vortex may clip at extreme facings, small helices may not read at
80px, or GitHub Actions may reject archived cross-run artifact access.
Fix geometry or workflow instead of lowering visual thresholds.
No live sprites, game manifests or runtime files were modified.


### Final validated temporal Gravitic attack review — 27 October 2026

**PASS; supersedes the pending state above.** [Targeted successful Actions
run #40486481510](https://github.com/shukritobi/chrono-dominion/actions/runs/40486481510)
downloaded the existing verified PSI-VEH-005 artifact from run #40478892855,
**did not rerender any of its 128 original frames**, rendered **128 new
160×160 RGBA attack-phase frames**, and uploaded
[artifact #12724493741](https://github.com/shukritobi/chrono-dominion/actions/runs/40486481510/artifacts/12724493741).
The separate temporal atlas is **5120×640 RGBA**. The new **142,773-byte
editable Blender source** reopened successfully, verifying **3 independent
torus meshes, 4 editable curved field filaments and 8 retained hidden
wreckage meshes**. The original source atlas SHA-256 remained exactly
`4f5e4c9b8a90262407fd5145e6363e695d3012642509da40c1861e497441c6f2`
before and after rendering.

| Changed RGBA pixels at 80px across 32 facings | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Charge → Grip | **1,007** | 1,214 | 1,143.0 |
| Grip → Discharge | **1,018** | 1,292 | 1,215.0 |
| Discharge → Release | **1,070** | 1,332 | 1,246.6 |
| Peak Discharge vs original single attack | **1,030** | 1,314 | 1,228.1 |
| Peak Discharge vs archived idle | **1,075** | 1,335 | 1,252.0 |
| Peak Discharge vs idle alpha pixels | **680** | 913 | 814.6 |

The actual 160px and 80px contact sheets from the successful artifact
were downloaded and visually inspected. The charge phase exposes a single
ring, grip tightens multiple concentric loops, discharge wraps the lifting
field in bright helical arcs, and release leaves a smaller expanding swirl.
At 80px all four phases read distinctly in every sampled facing. Five
independent Pillow recomputations of **peak vs original attack** at
facings 00/07/15/23/31 returned **1,273 / 1,288 / 1,270 / 1,223 /
1,235** changed 80px RGBA pixels, exactly matching the JSON QA report.
All 128 frames were unclipped and passed the per-facing thresholds.

**Visual limitation:** discharge can be very bright and obscure the
underlying lifting spindle at 80px; a later artistic review may soften
the mint emission or taper the helix thickness. The preview remains
distinctive and passes all acceptance gates. No live textures, published
manifests or game runtime were modified. This sequence is **not integrated
into gameplay**; the game loader currently supports 1/8 facings rather
than these 32-facing temporal previews. Next: additional missing vehicle
classes, with separate gameplay integration planning only after approval.


## 2026-10-27 Coalition Lynx Battle Tank — original P0 art-pilot preview (render in progress)

**PREVIEW ONLY.** COA-VEH-002 is a new original tracked Coalition main
battle tank rather than a modification of the previously verified Warden
or Modular Support Carrier. It uses a layered chevron glacis, broad ceramic
side skirts with individually modeled reactive tiles, a single long-bore
electromagnetic cannon with independent recoil/elevation, asymmetrical
commander optics and an exposed rear engine deck. Running gear has **12
independently articulated roadwheel pivots** and **22 independently
positioned track cleats**. Destroyed mode hides intact turret/gun hardware
and exposes **8 separately editable wreckage meshes**, including detached
mantlet, sheared gun, raised armour and glowing engine fracture.

- [Original P0 Lynx Blender source](../../tools/blender/preview_coalition_lynx_32.py)
  renders only this new vehicle: 32 facings × idle/move/attack/destroyed,
  **128 RGBA 160×160 PNG frames**, plus a compressed editable .blend.
- [Lynx 80px/160px pixel QA](../../tools/blender/qa_coalition_lynx_32.py)
  rejects empty or clipped sprites, adjacent-facing duplicates, invisible
  movement/attack, and destruction with insufficient alpha change; emits
  two real-resolution contact sheets, 5120×640 review atlas and JSON.
- [Targeted branch-scoped workflow](../../.github/workflows/coalition-lynx-32-review.yml)
  uses checksum-verified Blender 4.2.23, reopens the saved source and
  verifies eight hidden wreckage meshes, 12 roadwheel pivots, 22 track
  cleats and one long-bore cannon. It uploads isolated review artifacts.
- Source commit [96291591](https://github.com/shukritobi/chrono-dominion/commit/962915913aff1f70d11ef59bf21740cbbb9cd0a9),
  QA commit [68eddcce](https://github.com/shukritobi/chrono-dominion/commit/68eddccefa3ddae8b976f9efef04fe43152656db),
  workflow commit [06960722](https://github.com/shukritobi/chrono-dominion/commit/069607225488a779c652d6bf378e84212cd9c02a).
- [Targeted Actions run #40494276431](https://github.com/shukritobi/chrono-dominion/actions/runs/40494276431)
  was queued after the new workflow file was committed. **No success,
  source-reopen, or pixel metric is claimed until this run passes and its
  actual artifact has been inspected.**

**Artistic acceptance to inspect:** single-barrel silhouette must read at
80px, track animation must be visible, destroyed turret must no longer
resemble intact equipment, and emission must not obscure the vehicle.
The 32-facing game loader is not integrated. This PR is stacked on the
unmerged preview-only Psionic temporal attack branch to preserve shared
Blender helpers. No existing validated asset was rerendered. No published
sprites, live texture manifest, or gameplay code were changed.


### Final Coalition Lynx P0 Blender visual QA — 27 October 2026

**PASS; supersedes the pending status above.** The [targeted Actions run
#40494276431](https://github.com/shukritobi/chrono-dominion/actions/runs/40494276431)
completed successfully with every step green: Python compilation, official
Blender 4.2.23 installation, all 128 new RGBA 160×160 frames, reopened
editable source verification, strict 80px/160px pixel QA and artifact upload.
[Artifact #12729237522](https://github.com/shukritobi/chrono-dominion/actions/runs/40494276431/artifacts/12729237522)
was downloaded and its **actual** 160px and 80px contact sheets visually
inspected. The compressed source is **152,136 bytes**, reopened with **8
hidden editable wreckage meshes**, **12 independently articulated roadwheel
pivots**, **22 individual tread cleats** and **1 long-bore electromagnetic
cannon**. The separate review atlas is 5120×640 RGBA; no production-format
atlas was overwritten.

| Measured changed pixels across 32 facings | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Move vs idle RGBA, 80px | **978** | 1,383 | 1,237.8 |
| Attack vs idle RGBA, 80px | **755** | 1,124 | 940.2 |
| Destroyed vs idle RGBA, 80px | **1,082** | 1,403 | 1,288.2 |
| Destroyed vs idle alpha, 80px | **584** | 858 | 737.5 |
| Destroyed vs idle alpha, 160px | **1,153** | 1,651 | 1,434.3 |
| Adjacent idle facing RGBA, 80px | **1,057** | 1,404 | 1,253.1 |

Independent Pillow recomputation of destroyed alpha at 80px for facings
00/07/15/23/31 returned **696 / 765 / 781 / 707 / 658**, matching
the archived JSON exactly. All 128 PNGs have nonempty unclipped alpha
bounds, all adjacent facings are visibly different, and all animation
states passed their thresholds.

**Actual visual inspection:** the tank is clearly distinct from the Warden
because of its single long cannon, high commander cupola, broad continuous
skirts and blue-white armored turret. Attack emission reads at 80px; the
destroyed mode loses the intact turret and exposes multiple orange hot
fractures and detached weapon/armour. **Remaining artistic limitations:**
individual tread movement remains subtle at 80px, and the ion attack is
one pose rather than a temporal muzzle-flash sequence. A separate
four-phase firing sequence is appropriate later; do not rerender this
already validated 128-frame preview without an explicit targeted change.

**Safety:** compared against parent preview branch, exactly five
source/QA/workflow/documentation/register files changed. No production
textures, sprite manifests, runtime, or gameplay files changed.
The 32-facing renderer is **not integrated** with the current game loader.
[Draft review PR #43](https://github.com/shukritobi/chrono-dominion/pull/43)
is stacked on unmerged [Psionic temporal preview PR #41](https://github.com/shukritobi/chrono-dominion/pull/41).


## 2026-10-27 Federation Bull Heavy Tank — original P0 art-pilot (verification pending)

**PREVIEW ONLY; do not integrate or overwrite production artwork.**
FED-VEH-002 is a new original Federation siege-oriented heavy tank, distinct
from the Coalition Lynx and Federation Hailstorm. Original authored Blender
geometry includes a low slab-armoured chassis, separate heavy battering-ram
prow, 14 individually articulated roadwheel pivots, 24 track cleats, two
exposed vertical exhaust stacks, an independent block turret, one short
oversized electrothermal gun and a movable recoil mount. The destroyed pose
hides intact turret/gun/stack hardware and reveals eight independently
editable displaced wreckage meshes, including exposed orange fractures.

- [Bull Blender modeling source](../../tools/blender/preview_federation_bull_32.py)
  renders **only this new asset**: 32 directions × idle/move/attack/destroyed,
  producing 128 independent 160×160 transparent RGBA frames and a compressed
  editable .blend source.
- [Strict 160px/80px PNG QA](../../tools/blender/qa_federation_bull_32.py)
  checks alpha clipping, movement/attack RGB differences, destruction
  silhouette and adjacent-direction uniqueness, generating a 5120×640
  preview atlas, both contact sheets and a per-direction JSON report.
- [Isolated Actions workflow](../../.github/workflows/federation-bull-32-review.yml)
  uses checksum-verified Blender 4.2.23 and reopens the .blend to verify
  **8 hidden wreckage meshes, 14 wheel pivots, 24 cleats and 1 cannon**.

**Status:** Blender modeling and QA code committed; targeted rendering,
source reopening and real 80px inspection are **not yet verified**.
Do not claim success or invent pixel metrics until Actions finishes and
actual PNGs are inspected. Correct physical geometry rather than weakening
visual acceptance thresholds if any pose fails. This branch is stacked on
unmerged Coalition Lynx PR #43 to retain the shared preview-only Blender
helpers. No production atlas, manifest or game runtime is changed.


### Final Federation Bull P0 visual QA — 27 October 2026

**PASS; supersedes the pending state above.** The [targeted successful
Blender workflow #40501761698](https://github.com/shukritobi/chrono-dominion/actions/runs/40501761698)
completed all steps: Python compilation, checksum-verified Blender 4.2.23,
128 original 160×160 RGBA renders, reopened compressed .blend verification,
80px/160px PNG acceptance and artifact upload. The independent
[preview artifact #12732743005](https://github.com/shukritobi/chrono-dominion/actions/runs/40501761698/artifacts/12732743005)
contains the **156,949-byte editable Blender source**, 128 frames, a
5120×640 RGBA review atlas, JSON metrics and two actual contact sheets.
Reopening the saved source in headless Blender verified **8 hidden editable
wreckage meshes**, **14 roadwheel pivots**, **24 animated track cleats** and
**1 oversized electrothermal cannon**.

| Changed pixels across all 32 facings | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Move vs idle RGBA at 80px | **1,203** | 1,694 | 1,506.0 |
| Attack vs idle RGBA at 80px | **901** | 1,410 | 1,167.8 |
| Destroyed vs idle RGBA at 80px | **1,261** | 1,703 | 1,542.4 |
| Destroyed vs idle alpha at 80px | **689** | 948 | 834.9 |
| Destroyed vs idle alpha at 160px | **1,324** | 2,046 | 1,721.9 |
| Adjacent idle facings RGBA at 80px | **1,283** | 1,698 | 1,534.6 |

I downloaded the **actual 160px and 80px contact sheets** and inspected
all four rows. The Bull's broad red siege chassis, slab-sided turret,
short heavy gun and two rear exhausts are readable at 80px and visually
distinct from the blue-white Coalition Lynx. Destroyed poses visibly lose
the complete intact turret and show separated armor, a collapsed barrel,
and hot orange engine fractures. The 80px attack flash is readable.
Independent Pillow recalculation of destroyed-alpha differences at facings
00/07/15/23/31 gave **872 / 901 / 859 / 827 / 807** changed pixels,
exactly matching the archived JSON for each facing. All 128 PNGs have
nonempty unclipped alpha bounds and all adjacent facings pass uniqueness.

**Artistic limitations:** movement is mostly wheel/cleat and chassis bob,
subtle in the 80px sheet; the electrothermal attack has one bright static
muzzle pose rather than a temporal sequence. A later targeted four-phase
flash may improve it without rerendering unchanged validated poses.
**Production safety:** PR #45 contains only five Blender source, QA,
workflow, register and documentation files relative to its parent preview
branch. No live textures, game manifests or runtime code were changed.
The Bull remains **preview-only**, not integrated into gameplay.


## 2026-10-27 Psionic Viper Light Tank (PSI-VEH-002) P0 pilot — validated preview

**Preview-only, not integrated.** Following the validated Coalition Lynx and Federation Bull P0 tank pilots, this branch authors an independently modeled Psionic hovering skirmisher. Geometry includes two separately articulated gravity skids, two independent forward crescent fangs, a suspended neural core, paired phase emitters and eight individually editable wreckage-only meshes. Unlike the two tracked P0 pilots, the Viper is levitating, narrow and bifurcated.

- [New original Blender model](../../tools/blender/preview_psionic_viper_32.py), [real PNG QA](../../tools/blender/qa_psionic_viper_32.py) and [targeted preview workflow](../../.github/workflows/psionic-viper-32-review.yml).
- The workflow renders **only** PSI-VEH-002: 32 facings × idle/move/attack/destroyed = **128** independent 160×160 transparent RGBA PNGs; also produces 160px and 80px contact sheets, a sprite atlas, JSON pixel measurements and an editable .blend. Source-reopen checks assert two skids, two mandibles, two ion apertures and eight initially hidden wreckage meshes.
- Acceptance requires all 128 PNGs to be populated, unclipped and nonduplicate; at 80px each facing must have >=20 changed RGBA pixels for movement, >=40 for attack, >=65 changed alpha pixels for destruction, and >=20 changed RGBA pixels between neighboring idle facings. These are minimum automated gates, **not** a substitute for inspecting the actual downloaded sheets.
- **Validated on 27 October 2026:** [successful targeted Blender Actions run #40508990419](https://github.com/shukritobi/chrono-dominion/actions/runs/40508990419) and [preview artifact #12735414337](https://github.com/shukritobi/chrono-dominion/actions/runs/40508990419/artifacts/12735414337). Blender 4.2.23 LTS reopened the **126,151-byte editable .blend** and verified **8 hidden wreckage meshes, 2 independently articulated gravitic skids, 2 crescent mandibles and 2 paired ion apertures**. All **128** 160×160 RGBA frames passed alpha-boundary, populated-frame and 80px facing/state gates.

| 80px measured visual change | Minimum | Maximum |
|---|---:|---:|
| Idle to move, changed RGBA pixels | **834** | **1,184** |
| Idle to attack, changed RGBA pixels | **543** | **884** |
| Idle to destroyed, changed alpha pixels | **743** | **1,007** |
| Adjacent idle facings, changed RGBA pixels | **832** | **1,167** |

At 160px, idle-to-destroyed alpha differences span **1,585–2,500 pixels**. Downloaded the actual **4.57 MB** artifact, inspected both **160px and 80px contact sheets** and independently recalculated 80px destroyed-alpha deltas for facings **00/04/08/16/24**: **936/892/846/969/896**, all exactly matching the JSON QA report. The compact forked hover silhouette is identifiable at 80px, with bright cyan skids and a suspended neural core. **Visual limitation:** the luminous upper crystal reads more strongly than the low-profile jaw details; the single attack pose is not a temporal firing sequence. Future polish should add phased muzzle/mandible animation rather than enlarging the whole vehicle. Existing Coalition Lynx and Federation Bull renders were not rerendered. **No production sprites, published manifests or game code modified.**


## 2026-10-27 Psionic Viper four-beat twin-lance attack — validated preview

**PREVIEW ONLY, NOT GAME INTEGRATED.** PSI-VEH-002 now has a separate
original Blender four-phase attack sequence: **Charge → Focus → Burst →
Cooldown**. It extends the [validated Viper tank source from workflow
#40508990419](https://github.com/shukritobi/chrono-dominion/actions/runs/40508990419)
without regenerating or replacing its existing 128 idle/move/attack/destroyed
frames. The new geometry comprises **four independently editable toroidal
emitter/pressure rings, three physical ion-lance meshes, four editable
curved plasma filaments and two detached ion shards**. The mandibles,
hover carriage, neural crown and central crystal articulate by phase.

- [Successful targeted Blender workflow #40518390609](https://github.com/shukritobi/chrono-dominion/actions/runs/40518390609);
  [new preview artifact #12741045705](https://github.com/shukritobi/chrono-dominion/actions/runs/40518390609/artifacts/12741045705);
  [draft PR #50](https://github.com/shukritobi/chrono-dominion/pull/50).
- [Original phase-geometry Blender script](../../tools/blender/preview_psionic_viper_temporal_attack.py),
  [80px/160px image QA](../../tools/blender/qa_psionic_viper_temporal_attack.py)
  and [isolated preview-only workflow](../../.github/workflows/psionic-viper-temporal-attack-review.yml).
- **128 new** transparent 160×160 RGBA frames were rendered (32 facings ×
  four attack phases), plus a separate 5120×640 atlas, per-facing JSON QA
  and actual 160px/80px contact sheets. The **137,810-byte editable
  .blend** was reopened by headless Blender; verified **13 initially hidden
  editable temporal objects** (9 meshes + 4 curves) and **8 original
  hidden wreckage meshes**.
- The original Viper 128-frame atlas SHA-256 was checked before and after:
  `0c1229bd01f0e874822546a6ef53780b2f5ef1ddc41466a74cdd994176acee78`.
  **No original atlas, source or game-facing artwork was overwritten.**

| Changed RGBA pixels at 80px, all 32 facings | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Charge → Focus | **829** | 1,227 | 1,075.8 |
| Focus → Burst | **867** | 1,332 | 1,161.1 |
| Burst → Cooldown | **870** | 1,380 | 1,190.0 |
| Burst vs original single-frame attack | **875** | 1,376 | 1,193.2 |
| Burst vs idle | **891** | 1,369 | 1,189.9 |
| Cooldown vs original attack | **814** | 1,209 | 1,047.4 |

The burst-versus-idle **80px alpha** difference is **602–1,042 pixels**
(mean **881.2**). All 128 frames are nonempty, RGBA, within canvas
bounds, and pass phase-specific 80px change gates. Independent Pillow
recalculation of burst-versus-old-attack RGBA changes at facings
00/07/15/23/31 yielded **1,296 / 1,302 / 1,287 / 1,164 / 1,223**
pixels, matching the archived JSON exactly.

**Actual visual inspection:** downloaded the successful 4.6 MB artifact
and inspected both real 160px and 80px contact sheets. Charge shows two
small muzzle halos; Focus adds twin forward energy prongs; Burst has a
larger turquoise-white combined ion impact; Cooldown retains a thinner
residual field. Each phase reads at 80px without losing the Viper's
forked hover silhouette. **Artistic blocker:** the brightest Burst
concentrates over the emitter assembly and can obscure its fine
mandible/weapon detail; tune emission for final approval, rather than
inflating the overall sprite. This is a temporal attack pilot, not yet a
full gameplay-timed attack implementation.

**Production safety:** the PR is stacked on the unmerged original Viper
preview branch. Changes are restricted to original Blender modeling,
pixel QA, isolated workflow, asset register and this documentation;
**no live textures, manifests, gameplay files or published art changed**.
Do not merge to live art or deploy without explicit approval.


## 2026-10-28 Psionic Viper four-stage physical destruction — targeted verification

**PREVIEW ONLY, NOT GAME INTEGRATED.** This branch extends the already
validated PSI-VEH-002 Viper source from
[Actions #40508990419](https://github.com/shukritobi/chrono-dominion/actions/runs/40508990419).
The archived original 128-frame atlas is downloaded and SHA-checked, never
rerendered or replaced. The separate four-stage sequence is
**Impact → Shear → Rupture → Settle**, 32 facings per phase.

- [Original editable 20-fragment Blender model](../../tools/blender/preview_psionic_viper_four_stage_destruction.py)
  uses asymmetric closed eight-vertex solids: torn prow, snapped twin
  mandibles, damaged gravity skids, separated weapon rails, fractured
  neural crown and restrained violet fracture seams. Each fracture has
  a damage-role and first-visible-phase property. The eight archived
  wreckage meshes remain independently editable.
- [Strict 160px and 80px PNG QA](../../tools/blender/qa_psionic_viper_four_stage_destruction.py)
  rejects clipping, duplicate adjacent facings, invisible phase
  transitions and insufficient alpha-silhouette change. It compares
  against both archived idle and archived destroyed PNGs and checks
  the exact original atlas SHA-256
  `0c1229bd01f0e874822546a6ef53780b2f5ef1ddc41466a74cdd994176acee78`.
- [Single targeted preview-only Blender workflow](https://github.com/shukritobi/chrono-dominion/actions/runs/40630779708)
  loads the archived saved .blend, renders only the new 128 poses, reopens
  the new editable .blend, validates 20 hidden closed fracture meshes,
  two skids, two jaws and eight preserved original wreckage meshes,
  then uploads PNG frames, 5120×640 atlas, 160px/80px contact sheets,
  GIF and per-facing JSON. Workflow runs with read-only permissions.
- Initial commit [`bb17296c`](https://github.com/shukritobi/chrono-dominion/commit/bb17296c7153018c0080dd3ab85bbdbd8cfd622e),
  image QA commit [`1e74fea7`](https://github.com/shukritobi/chrono-dominion/commit/1e74fea7202a8eee305627dd12479bd7952e66e5)
  and workflow commit [`356b5120`](https://github.com/shukritobi/chrono-dominion/commit/356b51203fd0f8aff3cf15b0ad55cc4a80fa396f).

**Verified final result (28 October 2026):**
[Successful targeted Actions run #40630779708](https://github.com/shukritobi/chrono-dominion/actions/runs/40630779708),
[preview artifact #12791850140](https://github.com/shukritobi/chrono-dominion/actions/runs/40630779708/artifacts/12791850140),
[draft PR #85](https://github.com/shukritobi/chrono-dominion/pull/85).
All **128 newly rendered 160×160 RGBA frames passed** strict real-PNG
validation, including non-clipping and all per-facing 80px phase gates.
The new editable **128,952-byte .blend** was reopened in Blender 4.2.23
and verified to contain **20 hidden closed eight-vertex/six-face
fracture meshes, 8 original wreckage meshes, 2 original gravitic skids
and 2 original crescent mandibles**.

| Changed pixels at 80px across 32 facings | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Impact → Shear, RGBA | **845** | 1,194 | 1,062.3 |
| Shear → Rupture, RGBA | **988** | 1,256 | 1,159.3 |
| Rupture → Settle, RGBA | **936** | 1,276 | 1,157.4 |
| Impact → Shear, alpha | **632** | 910 | 766.8 |
| Shear → Rupture, alpha | **765** | 989 | 889.5 |
| Rupture → Settle, alpha | **675** | 898 | 805.6 |
| Settle vs original destroyed, RGBA | **908** | 1,205 | 1,100.7 |
| Settle vs original destroyed, alpha | **619** | 818 | 742.9 |
| Rupture vs original idle, alpha | **819** | 1,041 | 937.3 |
| Adjacent impact facings, RGBA | **846** | 1,168 | 1,053.5 |

The original atlas SHA-256 remained exactly
`0c1229bd01f0e874822546a6ef53780b2f5ef1ddc41466a74cdd994176acee78`
before and after the run. The **separate new** 5120×640 four-stage
atlas SHA-256 is
`63dea25db3f787065de7ba3168cb83f170af49f6d96a4ecb9c7bb979795abdb7`.
Downloaded the actual 4.8 MB artifact and inspected both the 160px and
80px contact sheets. Independently recalculated Impact→Shear 80px
RGBA differences for facings **00/04/08/16/24**:
**1,102 / 1,177 / 1,066 / 1,132 / 1,044** changed pixels;
all five matched the archived JSON report exactly.

**Visual observation:** the Viper's split hover silhouette remains
recognizable at 80px, and the final two wreckage stages are visibly
collapsed. The first two stages are more subtle at 80px, and residual
cyan hover slits remain conspicuous on the wreck. This is a polish
candidate, not a claim that final art is approved.

**Production safety:** branch comparison against the Viper temporal
preview parent shows exactly five changed development files (model,
QA, workflow, asset register and this document). No production textures,
gameplay files or published manifests changed. The new art remains
**preview-only and not integrated into the game**.

## 2026-10-28 Psionic Spindle Cannon Tank — validated original 32-facing pilot

**PREVIEW ONLY; not approved, merged, published or game-integrated.** The
registered PSI-VEH-003 Spindle Cannon Tank was still unmodeled in the
AssetRegister when this work started. Its new original Blender script
[preview_psionic_spindle_32.py](../../tools/blender/preview_psionic_spindle_32.py)
builds a physically articulated six-tube rotating cannon on a traversing
pedestal, a compact suspended hull, two independently movable gravity
outriggers, exposed barrel retainers and **12 independent asymmetric
wreckage solids**. Each state is real 3D geometry, not image substitution.

- Source modeling commit [0aca302d](https://github.com/shukritobi/chrono-dominion/commit/0aca302d21d53b467e81e6cc94972cc5758bca38).
- Independent strict-PNG QA commit [cf9b18b1](https://github.com/shukritobi/chrono-dominion/commit/cf9b18b1703a59b5b66346d2ca5ec1e01dbda153).
- [PNG acceptance](../../tools/blender/qa_psionic_spindle_32.py)
  requires 128 populated unclipped 160×160 RGBA frames, all 32 unique
  adjacent 80px facings, and movement / firing / destroyed 80px
  differences. It packs a **separate** 5120×640 preview atlas, both
  160px and 80px contact sheets, and per-facing JSON.
- Source-reopen checks require six independent barrel tubes, two
  separately articulated gravity outriggers and 12 hidden editable
  fracture objects. Targeted render workflow is read-only and stores
  artifacts for review.
- **Verified success:** [single targeted Actions #40636135162](https://github.com/shukritobi/chrono-dominion/actions/runs/40636135162),
  [downloadable preview artifact #12793443046](https://github.com/shukritobi/chrono-dominion/actions/runs/40636135162/artifacts/12793443046),
  [draft PR #86](https://github.com/shukritobi/chrono-dominion/pull/86).
  Blender 4.2.23 reopened the **137,852-byte editable .blend** and verified
  12 hidden editable eight-vertex wreckage solids, six independent
  barrel meshes, two articulated gravity outriggers and two physical
  barrel-retaining torus collars. All 128 original 160px RGBA frames
  passed nonempty, clipping and 32-direction checks. The **separate**
  5120×640 preview atlas SHA-256 is
  `f195cd1500db86816e59accdce8d7cd11aae7010fc19e4049455bedc7777c36f`.
  Artifact ZIP is 4,420,660 bytes and contains 133 files.

| Real PNG differences across all 32 facings | 80px min | 80px max |
|---|---:|---:|
| Idle → Move, RGBA | **762** | 1,056 |
| Idle → Attack, RGBA | **612** | 896 |
| Idle → Destroyed, RGBA | **864** | 1,082 |
| Idle → Destroyed, alpha | **595** | 778 |
| Adjacent idle facings, RGBA | **781** | 1,031 |

At 160px, destroyed alpha changes span **1,291–1,886 pixels**.
Downloaded and visually inspected the actual 160px and 80px contact
sheets. Independently recalculated Idle→Attack 80px RGBA changes for
facings **00/04/08/16/24** as **755 / 883 / 752 / 793 / 776**;
all five match the archived JSON exactly. Independent Idle→Destroyed
alpha checks also matched at the same five facings:
**689 / 778 / 724 / 714 / 653**. The movement, attack and wreckage
silhouettes remain distinct at gameplay scale.

**Observed visual limitation:** the tank occupies a relatively small
part of each 80px sprite; the bright cyan-white attack pressure ring
is more legible than the six individual barrel bores. Some wreckage
fragments overlap the near-side hover structure, but the broken gun
silhouette remains visible. Increase physical barrel separation or
adjust ortho scale only after another strict clipping/80px review;
do not enlarge emissive effects to hide weak geometry.

**Safety:** comparison against the Viper preview parent found exactly
five development-only changed files: Blender model, strict pixel QA,
isolated read-only workflow, asset register and this QA document.
Existing validated Viper, Warden and other preview atlases were not
rerendered. No production textures, manifests or gameplay code were
changed; the model is **preview-only, not game-integrated or approved**.

## 2026-10-28 Coalition Camouflage Hunter original 32-facing pilot — VERIFIED

**Preview-only; NOT approved or game-integrated.** This pass targets previously
unmodeled **COA-VEH-005**. Earlier validated [three-faction beam defenses](https://github.com/shukritobi/chrono-dominion/pull/25),
[airfields](https://github.com/shukritobi/chrono-dominion/pull/89), and
[Psionic Spindle Cannon](https://github.com/shukritobi/chrono-dominion/pull/86)
were not rerendered.

- [Successful targeted original Blender 4.2.23 Actions workflow #40648427473](https://github.com/shukritobi/chrono-dominion/actions/runs/40648427473):
  all steps passed, including headless source reopen, 128-frame render,
  strict 80px/160px PNG QA and artifact upload.
- [Complete 5,047,083-byte preview artifact #12798770786](https://github.com/shukritobi/chrono-dominion/actions/runs/40648427473/artifacts/12798770786),
  ZIP SHA-256 `25d12fd85eede33131499f29355ea23a14193fde44c40524fc1be71d7e389f07`.
  Includes **144,725-byte editable Blender source**, all 128 independent
  160×160 RGBA frames, separate **5120×640** four-row atlas, actual 160px/80px
  contact sheets, and full JSON metrics.
- [Original modeling](../../tools/blender/preview_coalition_camouflage_hunter_32.py)
  contains a nonrectangular faceted low hull, **four independent hinged
  adaptive-optic vanes**, **eight roadwheel pivots**, **24 modeled track cleats**,
  a physical forward projector and three separate attack-only meshes.
  **Fourteen editable asymmetric CLOSED extruded five-sided fracture meshes**
  replace the intact signature parts in the destroyed state.
- [Pixel QA](../../tools/blender/qa_coalition_camouflage_hunter_32.py)
  tests every facing and state at actual 80px gameplay scale, rejects
  clipped/empty images, and checks adjacent facings. [Isolated read-only
  workflow](../../.github/workflows/coalition-camouflage-hunter-32-review.yml)
  verifies the saved .blend source reopens with all 14 hidden 10-vertex,
  7-face closed wreckage meshes, 4 vanes, 8 wheels, 24 cleats and 3 hidden
  attack effects.
- The standalone preview atlas SHA-256 is
  `9059f6d2c5dcaaae596a136ec9b2098973ee2c5ce830dd60857e165a4f38f08d`.
  **All 128 RGBA frames have unique pixel hashes** and alpha bounds at
  least 3 pixels inside every edge. This does NOT alter any pre-existing atlas.

| 80px measurement, all 32 facings | Minimum | Maximum | Gate |
|---|---:|---:|---:|
| Idle → move, RGBA changed | **990** | 1,300 | >=45 |
| Idle → attack, RGBA changed | **823** | 1,128 | >=55 |
| Idle → destroyed, alpha changed | **694** | 829 | >=100 |
| Adjacent idle facings, RGBA changed | **1,052** | 1,281 | >=30 |
| Idle → destroyed, alpha changed at 160px | **1,326** | 1,782 | Report only |

**Independent verification:** Downloaded the real 133-file artifact,
inspected the actual 160px and 80px contact sheets, independently checked
every PNG for transparency/clipping, and recalculated movement, attack and
destroyed alpha at facings **00/04/08/16/24**. All **15 independent values**
matched the workflow JSON exactly. The original source reopened inside
the workflow, not locally (local Blender executable unavailable).

**Art critique:** At 80px the complete vehicle remains relatively small.
The four physical vanes are legible as blocky raised roof facets but their
individual hinges are subtle. The attack pulse is readable, but it does not
yet communicate a distinctive optical-camouflage mechanic. These are
polish priorities, not reasons to claim game integration. Current move and
attack are single-pose state differences rather than multi-frame cycles.

**Publication safety and blockers:** The branch comparison against its
Spindle preview parent found exactly five development-only files: new
Blender modeling, new pixel QA, new isolated workflow, asset-register
status and this QA document. **No production texture, atlas, manifest,
or gameplay code was changed.** Draft [PR #91](https://github.com/shukritobi/chrono-dominion/pull/91)
remains stacked on the unmerged Spindle branch and must not be merged
without owner art approval. The game loader does not yet consume this
separate 32-facing preview atlas. Next: improve optical camouflage
readability and build a genuine multi-phase movement/destruction sequence
before considering art integration.

## 2026-10-28 Coalition Camouflage Hunter four-stage destruction — VERIFIED preview only

**COA-VEH-005.** Original, editable physical destruction built on the already
validated [Hunter 32-facing pilot](https://github.com/shukritobi/chrono-dominion/actions/runs/40648427473),
not by rerendering that original pilot. Four separate destruction stages
(**impact → shear → rupture → settle**) × 32 facings produced **128 new
160×160 transparent RGBA PNGs** and a separate **5120×640 preview atlas**.
This artwork is **not approved, published, or integrated into gameplay**.

- [Successful targeted Blender 4.2.23 workflow #40654743132](https://github.com/shukritobi/chrono-dominion/actions/runs/40654743132)
  completed all steps on **28 October 2026**, including original artifact
  download, SHA verification, new geometry, rendering, editable source
  reopen, strict 80px/160px pixel QA and artifact upload.
- [134-file preview artifact #12801355896](https://github.com/shukritobi/chrono-dominion/actions/runs/40654743132/artifacts/12801355896)
  is **5,163,666 bytes**, ZIP SHA-256
  `61adb96b2849c017d8050f136a71ef28533f70982b2db96423b312d3d73ffed3`.
  It contains the **144,092-byte editable .blend**, 128 independent
  state/facing PNGs, new atlas, actual 160px and 80px contact sheets,
  an 80px four-beat GIF and per-facing JSON.
- [Original physical fracture geometry](../../tools/blender/preview_coalition_hunter_four_stage_destruction.py)
  adds **18 individually editable, CLOSED, irregular pentagonal extrusions**,
  each with 10 vertices and seven faces. Fifteen are broken vanes,
  projector, canopy, turret, track, prow, engine and armor pieces; three
  are narrow, deliberately restrained physical spectral fracture seams.
  The 14 original Hunter wreckage meshes remain intact and editable.
  Physical original canopy, emitter, vanes, track skirts and engine hardware
  are selectively hidden by phase, while fragments detach and settle.
- The saved source **reopened successfully in headless Blender** with all
  18 new hidden fracture solids, **14 preserved hidden wreckage meshes,
  four independent vane hinges, eight roadwheel pivots, 24 track cleats
  and three hidden attack effects**. The saved pose is intact and non-firing.
- [Strict per-facing image QA](../../tools/blender/qa_coalition_hunter_four_stage_destruction.py)
  enforces separate RGBA and *alpha-silhouette* differences at actual 80px
  scale, 160px transparency/clipping, distinct frame hashes, adjacent-facing
  differences, and immutability of the archived original atlas. No thresholds
  were relaxed after observing the renders.

| Actual 80px PNG comparison, all 32 facings | Minimum | Maximum |
|---|---:|---:|
| Impact → Shear, RGBA changed pixels | **1,119** | 1,366 |
| Shear → Rupture, RGBA changed pixels | **1,106** | 1,359 |
| Rupture → Settle, RGBA changed pixels | **1,017** | 1,411 |
| Impact → Shear, alpha changed pixels | **614** | 805 |
| Shear → Rupture, alpha changed pixels | **716** | 839 |
| Rupture → Settle, alpha changed pixels | **609** | 795 |
| Settled vs original destroyed, RGBA changed | **947** | 1,343 |
| Settled vs original destroyed, alpha changed | **580** | 732 |
| Impact vs original idle, RGBA changed | **961** | 1,254 |
| Rupture vs original idle, alpha changed | **719** | 906 |
| Adjacent impact facings, RGBA changed | **1,047** | 1,297 |

**Independent verification after artifact download:** recomputed the ZIP
SHA-256 and inspected the **actual 160px and 80px contact sheets**, not
mockups. All 128 PNGs were present; JSON reports **zero failures**. At
facings **00 / 04 / 08 / 16 / 24 / 31**, independently recomputed both
Impact→Shear RGBA and Shear→Rupture alpha changes at 80px:
**1,338/799; 1,355/837; 1,274/804; 1,249/723; 1,218/739;
1,326/796** respectively. All **12 values exactly matched** the workflow
JSON. Independently checked the original 133-file Hunter ZIP: its 128
original 160px RGBA frames have 128 unique hashes and its original
atlas SHA-256 is exactly
`9059f6d2c5dcaaae596a136ec9b2098973ee2c5ce830dd60857e165a4f38f08d`.
The targeted job verified this same SHA **before and after** rendering.
New separate destruction atlas SHA-256:
`e0296164d10cf82dc50ff3869791f885be456c5e416dba9ad3fc64e0ae00ce02`.

**Artistic critique / remaining blockers:** The first Impact stage is
deliberately close to the intact tank at a glance; its actual alpha
difference is nonzero, but the narrow cyan fracture seams are subtle at
80px. The Shear stage exposes the missing canopy, Rupture shows the
separated turret and exposed warm reactor, and Settle is a lower, more
scattered physical wreck. Some bright original optical elements and
detached fragments overlap the near-side track in Rupture/Settle; this
should be polished without replacing the validated baseline. The Hunter
still lacks a true four-beat camouflage movement/deployment cycle, and
the game loader does not consume this separate destruction atlas.

**Publication and regression boundary:** The preview branch is stacked on
the validated Hunter pilot; only original Blender modeling, isolated
render/QA workflow, per-frame image QA, asset register and this QA document
were modified. No approved atlas, game texture, manifest, loader, runtime
or gameplay source was edited. Do **not** merge or publish without art
approval. Next: genuine four-phase optical camouflage deployment/movement,
then remaining faction vehicles and outstanding building polish.

## 2026-10-28 Coalition Camouflage Hunter four-beat optical deployment — QA PENDING

**PREVIEW ONLY; not approved or integrated.** This pass follows the
[validated four-stage Hunter destruction](https://github.com/shukritobi/chrono-dominion/actions/runs/40654743132)
but deliberately loads the **original saved Hunter pilot .blend** from
[workflow 40648427473](https://github.com/shukritobi/chrono-dominion/actions/runs/40648427473)
instead of rerendering any of its 128 validated original sprites.

- [Original procedural modeling](../../tools/blender/preview_coalition_hunter_four_phase_optics.py)
  adds **16 independently editable closed optical solids**: four tapered
  diffraction sails, eight narrow ceramic diffraction ribs and four small
  physical projector shutters, all parented to existing articulated hardware.
  Original four vane hinges, eight wheel pivots and 24 cleats also move across
  the four distinct beats: **fold → spread → refract → glide**.
- [Strict 160px/80px image QA](../../tools/blender/qa_coalition_hunter_four_phase_optics.py)
  checks 128 real RGBA PNGs, per-facing alpha-silhouette changes separately
  from RGB changes, adjacent facings, clipping, unique pixel hashes and
  SHA-256 immutability of the original atlas.
- [Read-only isolated preview workflow](../../.github/workflows/coalition-hunter-four-phase-optics-review.yml)
  uses checksum-verified Blender 4.2.23, reopens the saved editable .blend,
  and uploads all preview artifacts even if QA fails.
- [Initial targeted Actions run #40662180954](https://github.com/shukritobi/chrono-dominion/actions/runs/40662180954);
  [draft PR #94](https://github.com/shukritobi/chrono-dominion/pull/94).
  **No render success, source-reopen success or pixel metrics are claimed yet.**
  Record actual results and any failed gate here after inspecting the artifact.
- Original Hunter preview atlas SHA-256 must remain
  `9059f6d2c5dcaaae596a136ec9b2098973ee2c5ce830dd60857e165a4f38f08d`.
  This is physical silhouette deployment, **not** a claim that true optical
  invisibility or gameplay camouflage is implemented.
- Publication boundary: **do not merge, publish, replace textures/manifests
  or integrate into gameplay without owner approval**. This preview branch
  is stacked on an unmerged Hunter destruction branch.

### 2026-10-28 final optical-deployment render inspection — VERIFIED

The **single targeted workflow #40662180954 passed**. The job reopened the
**142,313-byte editable .blend** and verified all **16 closed physical optical
solids** (4 sails, 8 ribs, 4 shutters), four preserved vane hinges,
14 original hidden wreck meshes and three hidden attack effects. The workflow
produced **128 independent transparent RGBA 160×160 PNGs** across 32 facings
and four beats. Every frame has a distinct pixel hash, nonempty alpha and a
silhouette at least three pixels clear of the canvas edge. The separate new
atlas is **5120×640**.

- [Successful targeted workflow #40662180954](https://github.com/shukritobi/chrono-dominion/actions/runs/40662180954).
- [Preview artifact #12804272364](https://github.com/shukritobi/chrono-dominion/actions/runs/40662180954/artifacts/12804272364):
  134 files, **5,241,867 bytes**, ZIP SHA-256
  `d395697c6efba68ea2de8db343fa7f6295732f9d2817d3ab467f179f0879bfcc`.
- Separate new optical atlas SHA-256
  `7a3acf883b62473ee50d22aafd60052bc1f52b70b3fd6e5806824277e77f8c39`.
  Original baseline atlas SHA-256 remains
  `9059f6d2c5dcaaae596a136ec9b2098973ee2c5ce830dd60857e165a4f38f08d`
  before and after rendering.

| Actual 80px RGBA changed pixels, all 32 facings | Minimum | Maximum |
|---|---:|---:|
| Fold → Spread | **1,068** | 1,342 |
| Spread → Refract | **1,087** | 1,406 |
| Refract → Glide | **1,130** | 1,411 |
| Adjacent Glide facings | **1,162** | 1,404 |
| Glide vs archived Idle | **1,068** | 1,401 |

| Actual 80px alpha-channel changed pixels | Minimum | Maximum |
|---|---:|---:|
| Fold → Spread | **535** | 784 |
| Spread → Refract | **585** | 745 |
| Refract → Glide | **636** | 776 |
| Glide vs archived Idle | **590** | 809 |

**Independent artifact inspection:** downloaded the actual ZIP and visually
inspected both actual 160px and 80px contact sheets. Recomputed 18 independent
80px pixel measurements (Fold→Spread RGBA, Spread→Refract alpha,
Refract→Glide alpha at facings 00/04/08/16/24/31); **all 18 matched JSON**.
Independently checked 128 RGBA frame sizes, alpha margins, unique pixel
hashes and both artifact/atlas SHA-256 checksums.

**Additional anti-overclaim check:** raw alpha-channel pixel differences count
antialiasing and displacement as well as physical geometry. To test the
stronger claim that the shape changes, independently thresholded 80px alpha
at >=32 and minimized silhouette XOR over all integer translations within
±8px. The resulting *translation-normalized binary silhouette* differences
across all 32 facings were **95–167** pixels (Fold→Spread), **47–117**
(Spread→Refract) and **75–152** (Refract→Glide). These smaller, conservative
numbers still confirm shape differences rather than a mere uniform shift.
This is an independent post-render audit, not an extra CI gate.

**Visual critique:** the Hunter's hull remains relatively small in an 80px
sprite. The new raised optical sails and differentiated deployment beats
are discernible when animated but subtle when static. The brighter existing
projector/track details can dominate the new fins. The model does **not**
implement actual cloaking/transparency or any gameplay stealth logic.
Do not claim approval or integration. Future art passes should enlarge the
physical fin footprint without clipping and compare fixed-hull poses to
isolate deployment from vehicle bobbing. No published texture, manifest,
loader or gameplay file was changed.


## 2026-10-28 Coalition Hunter MK-II enlarged physical sails — VERIFIED preview only

**COA-VEH-005; unapproved, unintegrated.** Follow-up to the validated
[MK-I four-beat optical deployment](https://github.com/shukritobi/chrono-dominion/actions/runs/40662180954).
The physical sails were too small at 80px and the prior animation combined
sail motion with chassis bob, making causal visual attribution difficult.
This pass enlarges the *original editable Blender geometry* rather than
replacing it with a painted billboard or merely raising emission.

- [Successful focused Blender Actions run #40670200185](https://github.com/shukritobi/chrono-dominion/actions/runs/40670200185),
  [draft stacked PR #96](https://github.com/shukritobi/chrono-dominion/pull/96),
  [artifact #12807533477](https://github.com/shukritobi/chrono-dominion/actions/runs/40670200185/artifacts/12807533477).
- [Original MK-II modeling](../../tools/blender/preview_coalition_hunter_optics_mk2.py):
  sail width **0.66 → 0.98**, depth **0.56 → 0.82**, height
  **0.34 → 0.57** Blender units; diffraction ribs were enlarged and
  repositioned. Fold now contains actual reduced-scale folded sails
  rather than invisible fins. All **16 independently editable closed
  optical solids** remain: four sails, eight ribs, four shutters.
  Original four vane hinges, 14 hidden wrecks and three hidden attack
  effects remain preserved. **142,942-byte compressed editable .blend**
  reopened in Blender; verified four sails have expected .98 width and
  .57 height properties and all 16 solids are hidden in the saved
  intact source.
- [Strict independent pixel QA](../../tools/blender/qa_coalition_hunter_optics_mk2.py)
  and [isolated read-only workflow](../../.github/workflows/coalition-hunter-optics-mk2-review.yml)
  rendered **128 NEW 160×160 RGBA PNGs** (four beats × 32 facings),
  a separate **5120×640 atlas**, plus **four NEW fixed-hull
  diagnostic frames**. No original Hunter or MK-I optics frame was
  rerendered. The fixed-hull frames keep chassis, turret, roadwheels,
  track cleats and camera stationary; only physical optical assemblies
  change.
- **First workflow #40670084500 FAILED before rendering** because its
  second artifact-download step accidentally requested the new MK-II
  artifact instead of the immutable MK-I artifact. The
  [corrected workflow commit 8ecc8bf](https://github.com/shukritobi/chrono-dominion/commit/8ecc8bf9cf851a085f16798ff9668f8c86fa58ce)
  fixed the name, and only the subsequent run #40670200185 rendered.
  The failure was an artifact lookup configuration error, not an art
  acceptance failure; no duplicated render job was launched.
- All **128 new pixel hashes are unique**; all transparent sprites are
  nonempty and at least three pixels clear of canvas boundaries. The
  new 5,779,336-byte artifact ZIP SHA-256 is
  `6eae779e2e00c9f787ffc554b8c13027c5aa0b75de595791b4e38b7e62f037ae`;
  new MK-II atlas SHA-256 is
  `7c2ccea7c1c0e0349c10b757755eb4fa0b4cbeb375c6a5d337d66d1125f3b9e6`.

| Actual 80px image QA across all 32 facings | Minimum | Maximum |
|---|---:|---:|
| Fold → Spread RGBA changed pixels | **1,243** | 1,504 |
| Spread → Refract RGBA changed pixels | **1,294** | 1,597 |
| Refract → Glide RGBA changed pixels | **1,320** | 1,608 |
| Fold → Spread alpha changed pixels | **672** | 850 |
| Spread → Refract alpha changed pixels | **700** | 826 |
| Refract → Glide alpha changed pixels | **718** | 879 |
| MK-I → MK-II Fold alpha | **195** | 269 |
| MK-I → MK-II Spread alpha | **312** | 377 |
| MK-I → MK-II Refract alpha | **352** | 418 |
| MK-I → MK-II Glide alpha | **317** | 366 |

**More rigorous fixed-hull silhouette proof:** After downsampling the
four stationary-hull frames to 80px, thresholding alpha at >=32, and
counting changed *binary silhouette* pixels, the transitions changed
**109** (Fold→Spread), **71** (Spread→Refract) and **58**
(Refract→Glide) pixels. All exceed the predeclared **25-pixel** gate.
Every beat also differs from MK-I by >=15 raw alpha pixels in **all
32 facings** (not merely the mean). Mean MK-I→MK-II alpha differences
are **236.31 / 335.81 / 382.28 / 338.19** pixels.

**Independent artifact verification:** downloaded the completed ZIP and
recomputed the 128 frame hashes, 128 alpha margins, all 128 MK-I→MK-II
80px alpha differences, and three fixed-hull binary-silhouette changes
using a separate local audit. Every recalculated metric matched the
workflow JSON exactly. Visually inspected the actual 160px and 80px
contact sheets, the stationary-hull 160px/80px strips, and the
side-by-side MK-I/MK-II 80px comparison. The physical fins are
substantially more visible and retain the Coalition teal/graphite
palette. **Remaining artistic limitation:** the larger sails sometimes
read as blocky panels rather than fine diffraction vanes; the
underlying vehicle remains small at gameplay scale. Further bevel,
notch and silhouette refinement would help. This is not real optical
invisibility or gameplay camouflage.

**Immutability and publication boundary:** original Hunter atlas SHA-256
`9059f6d2c5dcaaae596a136ec9b2098973ee2c5ce830dd60857e165a4f38f08d`
and MK-I optics atlas SHA-256
`7a3acf883b62473ee50d22aafd60052bc1f52b70b3fd6e5806824277e77f8c39`
both matched before and after the successful job. The review branch
changes only new Blender modeling, new pixel QA, a new isolated
workflow, this QA document and the asset register relative to its
stacked preview parent. **No published textures, manifests, loaders,
runtime or gameplay files were touched.** Do not merge or publish
without explicit owner art approval. Next: refine sail outline,
then return to missing vehicle models and remaining building-state polish.


## 2026-10-28 Coalition Hunter MK-III dual-notch beveled sails — VERIFIED preview only

**COA-VEH-005; unapproved and unintegrated.** [Successful targeted workflow #40678108105](https://github.com/shukritobi/chrono-dominion/actions/runs/40678108105), [draft stacked PR #98](https://github.com/shukritobi/chrono-dominion/pull/98), [artifact #12811352362](https://github.com/shukritobi/chrono-dominion/actions/runs/40678108105/artifacts/12811352362). The 5,921,387-byte artifact ZIP SHA-256 is `e3e93838783e87d5316830714163d21b45bb4ee8c44e2cd7959a44c3b739ba8e`.

**Original editable geometry:** four previously wedge-like MK-II optical sails are now **concave dual-notch physical panels**, each with 42 vertices, 30 polygon faces, 70 watertight manifold edges, and 14 actual bevel faces assigned a restrained ceramic edge material. The signed winding is corrected for mirrored -Y sails. All 16 independent optical objects (four sails, eight ribs, four shutters), four original hinges, 14 hidden wreck meshes and three hidden attack effects remain intact. The **144,217-byte saved .blend reopened in Blender**, and the separate source-reopen script verified all four sail meshes' geometry, concavity, closed topology, material indices and hidden preview-only state.

**Scope:** downloaded the previously validated original Hunter source and MK-II preview; **did not rerender** their old frames. Generated only **128 new transparent 160×160 RGBA MK-III frames** (32 facings × four Fold/Spread/Refract/Glide beats), a new separate 5120×640 atlas, and four additional stationary-hull diagnostic poses. Every new frame has a unique pixel hash and an unclipped, nonempty silhouette with >=3px canvas clearance. Original baseline and MK-II preview atlas SHA-256 checks passed before and after rendering.

| Independently recalculated MK-II → MK-III 80px alpha changes, 32 facings | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Fold | **161** | 210 | 185.59 |
| Spread | **238** | 328 | 269.34 |
| Refract | **238** | 323 | 279.69 |
| Glide | **233** | 302 | 260.75 |

All **32/32 facings** in each beat exceed the predeclared 12-alpha-pixel minimum. The stricter fixed-hull MK-II → MK-III binary silhouette comparison at 80px, with camera/chassis/track motion held stationary, changes **20 / 35 / 41 / 33 pixels** in Fold/Spread/Refract/Glide respectively (predeclared >=10). This independently isolates *real outline change* from emissive or chassis-motion effects. Within the new MK-III animation, fixed-hull silhouette changes are **114 / 77 / 68** pixels across Fold→Spread / Spread→Refract / Refract→Glide (>=25 required).

| 80px per-facing MK-III phase RGBA differences | Minimum | Maximum |
|---|---:|---:|
| Fold → Spread | **1,247** | 1,510 |
| Spread → Refract | **1,285** | 1,596 |
| Refract → Glide | **1,311** | 1,610 |
| Adjacent Glide directions | **1,330** | 1,586 |

**Independent artifact audit:** downloaded the real ZIP, inspected the actual 160px and 80px contact sheets and the MK-II/MK-III side-by-side comparison, and recomputed **all 128 MK-II/MK-III 80px alpha differences**, all four stationary-hull baseline differences and all three new fixed-hull phase transitions using a separate Pillow script. Every independent measurement matched `pixel-qa.json`; all 128 unique hashes and alpha margins passed. The automated QA report contains **zero failures**. New MK-III atlas SHA-256: `33d31c45d97c9e7a23675830c7aa18c2959800f00f3bc850f54ac62d5727b903`.

**Failure / corrective note:** the initial atomic commit used the inherited MK-II branch filter and an outdated checksum-path/reopen command. This configuration created **no workflow run and no render**. [Correction commit 649c738](https://github.com/shukritobi/chrono-dominion/commit/649c7381e678d3a0ea332a4464f4c1f5923daae0) fixed all three before the **single successful targeted render**. A separate [asset-register correction 7588d45](https://github.com/shukritobi/chrono-dominion/commit/7588d45bf1885c4875d44e9becdc3168306e2dc7) restored the Hunter row to a valid 13-column CSV (it had contained unquoted commas). No duplicate rendering jobs were launched.

**Visual critique and remaining work:** the 160px chamfered shells are more faceted and less box-like; the 80px silhouette is measurably different but the actual notches are still subtle at gameplay scale. The unit remains a small first-pass vehicle; the optical deployment is **not** true invisibility or gameplay stealth. Prioritize remaining faction vehicles and building damage-state polish rather than indefinite Hunter iteration.

**Publication boundary:** original Hunter atlas SHA-256 `9059f6d2c5dcaaae596a136ec9b2098973ee2c5ce830dd60857e165a4f38f08d`, MK-II atlas SHA-256 `7c2ccea7c1c0e0349c10b757755eb4fa0b4cbeb375c6a5d337d66d1125f3b9e6`, both unchanged. No production texture, manifest, loader, runtime or gameplay file was modified. **Draft PR #98 must not be merged or published without owner approval.**

## 2026-10-28 Federation Shrapnel Carrier FED-VEH-003 — original 32-facing preview (QA pending)

**PREVIEW ONLY; never published.** This new P2 vehicle was confirmed missing
from the stacked preview branch before modeling. Unlike the previously
validated Coalition Hunter, this is a distinct Iron Federation anti-air
halftrack: original raked driver cab, six independent wheels, separate rear
flak turntable, two physically modeled cannon barrels, ammunition feed,
ventilated cooling collars, and eight closed asymmetric wreck fragments.
The targeted branch-scoped workflow
[`federation-shrapnel-carrier-32-review.yml`](../../.github/workflows/federation-shrapnel-carrier-32-review.yml)
renders only this new model (32 facings × idle/move/attack/destroyed);
the [source](../../tools/blender/preview_federation_shrapnel_carrier_32.py)
and [pixel QA](../../tools/blender/qa_federation_shrapnel_carrier_32.py)
do not write live game assets. Predeclared 80px gates per facing:
move RGBA >=30; attack RGBA >=80 and alpha >=10;
destroyed alpha >=70; adjacent idle facing RGBA >=35.
The saved .blend must reopen with eight manifold closed fracture meshes,
six articulated wheel pivots and two flak barrels. Every one of the
128 PNGs must be nonempty, unclipped, RGBA and pixel-hash unique.
**No pass or measured metrics claimed until the workflow finishes and the
actual 160px/80px PNGs are independently inspected.**

### Final targeted verification — 28 October 2026 (PASSED)

- [Successful Blender 4.2.23 workflow #40684908621](https://github.com/shukritobi/chrono-dominion/actions/runs/40684908621), [preview artifact #12814133780](https://github.com/shukritobi/chrono-dominion/actions/runs/40684908621/artifacts/12814133780). The first branch push [#40684877797](https://github.com/shukritobi/chrono-dominion/actions/runs/40684877797) was **cancelled before rendering** by workflow concurrency when a missing Python wheel-list initialization was corrected in [commit 91c10bc](https://github.com/shukritobi/chrono-dominion/commit/91c10bcff1fbb1d6acfcacb5192604368f4cb87b). Only the corrected workflow rendered the vehicle.
- The **137,341-byte compressed editable Blender source reopened successfully** under Blender 4.2.23. The source-reopen job verified **8 closed 12-vertex / 8-face manifold asymmetric fracture meshes**, all hidden in intact pose, plus **6 independent wheel pivots and 2 flak barrels**.
- All **128 transparent 160×160 RGBA PNGs** passed the per-facing gates; all 128 pixel hashes are unique. Each frame has at least **30px** of empty canvas margin at 160px; no clipping.
- Downloaded and visually inspected the **actual 160px and 80px contact sheets**, including front, side and oblique facings. The twin flak barrels and their bright physical attack flares are distinguishable; destroyed poses remove the intact gun cradle and reveal asymmetric debris. At 80px the overall unit remains relatively small and the bright orange/yellow attack effect can dominate the narrow barrels.
- Independent Pillow remeasurement of **all 32 facings and all per-facing state metrics**, plus all **32 adjacent-direction differences**, matched the Actions `pixel-qa.json` exactly. The separate audit also rechecked all 128 RGBA frames, alpha margins and unique hashes. It correctly identifies the compressed .blend as Zstandard data rather than assuming an uncompressed `BLENDER` header; actual source reopening was performed by the Actions Blender step.

| Independently verified 80px changes across 32 facings | Minimum | Maximum |
|---|---:|---:|
| Idle → move RGBA | **1,000** | 1,454 |
| Idle → attack RGBA | **758** | 1,139 |
| Idle → attack alpha | **150** | 351 |
| Idle → destroyed RGBA | **1,035** | 1,480 |
| Idle → destroyed alpha | **630** | 946 |
| Adjacent idle directions RGBA | **1,082** | 1,479 |

At 160px the destroyed-state alpha difference is **1,247–1,998** pixels.
The new separate preview atlas SHA-256 is
`a4f5a843d6c6f41a7b7ad89f38aebb2abfb83996fee20b563f29e61fb64d1063`.
Downloaded artifact ZIP SHA-256 is
`931da5b4a75f58825ef2487ddec925f0de0bb6d969de614f9d8467c76f75dc42`.

**Production safety:** the preview branch differs from its stacked art parent
in only new Blender modeling, new pixel QA, isolated workflow, this document,
and the single asset-register row. No published texture, game manifest,
loader, runtime or gameplay source was modified. This artwork is **NOT
integrated, approved or playable**. Next artistic pass: improve barrel
readability and more restrained physical muzzle flare at 80px, then proceed
to other missing vehicles/building damage states rather than rerendering
unchanged validated frames.

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

## 2026-10-28 Coalition Warden dual-ion temporal attack (verification underway)

**Preview-only; no live sprite publication.** This focused pass reuses the
validated [COA-VEH-004 original 32-facing Blender artifact](https://github.com/shukritobi/chrono-dominion/actions/runs/40471597359)
rather than regenerating its 128 original sprites. A second editable source
adds **16 independent Blender meshes**: six induction coils, four expanding
muzzle waves, two ion penetrators and four faceted plasma ribbons. The two
ion emitters operate in a four-phase **charge / synchronize / volley /
cooldown** sequence across 32 facings, creating 128 new 160px RGBA previews.

- [New dual-ion Blender modeling script](../../tools/blender/preview_coalition_warden_temporal_attack.py).
  Modeling [commit 4895bd2e](https://github.com/shukritobi/chrono-dominion/commit/4895bd2eb3990ec30dd6dd80392c0cbcc0ddbfd3).
  Image QA [commit 490e61a0](https://github.com/shukritobi/chrono-dominion/commit/490e61a0052fe9891161a3806b58750850ad06c8).
  Workflow [commit d5636f92](https://github.com/shukritobi/chrono-dominion/commit/d5636f92dde1001a5a2bc1d50d35cb80ab7293c7).
  Measured QA documentation [commit c327e12c](https://github.com/shukritobi/chrono-dominion/commit/c327e12ce99a7ccf56a41216d6bb246909df95d4).
  [Draft review PR #60](https://github.com/shukritobi/chrono-dominion/pull/60).
- [Strict new-vs-archived 160px/80px image QA](../../tools/blender/qa_coalition_warden_temporal_attack.py).
- [Isolated targeted workflow](../../.github/workflows/coalition-warden-temporal-attack-review.yml):
  [render run #40547061043](https://github.com/shukritobi/chrono-dominion/actions/runs/40547061043).
- The workflow checks 16 hidden editable new meshes, four genuine faceted
  streamer meshes, eight original wreckage meshes, 18 track cleats and two
  original barrels after reopening the saved source. Pixel QA requires
  30 changed RGBA pixels per phase transition at 80px, 50 for volley vs
  the archived attack, 20 changed alpha pixels for volley vs idle, and
  20 RGBA pixels between adjacent charge facings. It checks every frame
  for transparency, clipping and a preserved archived atlas SHA-256.
- **Validated:** [successful Actions run #40547061043](https://github.com/shukritobi/chrono-dominion/actions/runs/40547061043)
  passed the original Blender source download, Python compilation, checksum-
  verified Blender 4.2.23 install, **128 new RGBA renders**, reopening the
  **142,547-byte editable .blend**, all 16 new hidden editable meshes
  (including four genuine 10-vertex/4-face plasma ribbons), eight original
  wreckage meshes, 18 track cleats, two ion barrels and strict pixel QA.
  [Preview artifact #12752728314](https://github.com/shukritobi/chrono-dominion/actions/runs/40547061043/artifacts/12752728314)
  contains the Blender source, 128 individual frames, a 5120×640 new
  four-phase atlas, both contact sheets and quantitative JSON.
- The original atlas SHA-256 was unchanged before and after:
  `97da4b781b50dc6bad7f154c04adc44cfe7f001e77c1f2e4a02c75bb454d2d7a`.
  The new preview-only atlas SHA-256 is
  `d81a8249ebffadbb7cd8e83090b130614fa208adba6f8c21f317be3867f28d1f`.
- The actual 160px and 80px PNG contact sheets were downloaded and visually
  inspected. At 80px both muzzle effects are legible; synchronization has
  separated white ring highlights, volley adds dual visible energy bursts,
  and cooldown retracts the glare to expose the underlying turret.
  Bright volley coils partially obscure the barrel ends at 80px: this
  is a remaining artistic polish item, not a validation failure.

| Actual 80px changed pixels | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Charge → Synchronize RGBA | **803** | 1,181 | 1,042.1 |
| Synchronize → Volley RGBA | **922** | 1,301 | 1,162.9 |
| Volley → Cooldown RGBA | **933** | 1,306 | 1,165.8 |
| Volley vs original attack RGBA | **946** | 1,346 | 1,189.5 |
| Volley vs original idle RGBA | **931** | 1,283 | 1,160.3 |
| Volley vs original idle alpha | **444** | 693 | 593.9 |
| Charge vs original idle RGBA | **545** | 799 | 656.8 |
| Adjacent charge facing RGBA | **1,009** | 1,230 | 1,137.2 |

Independent pixel recalculation from downloaded PNGs for facing
00/07/15/23/31 gave **1,239 / 1,315 / 1,248 / 1,181 / 1,185** changed
80px RGBA pixels for volley vs original attack, and
**593 / 693 / 647 / 592 / 555** changed 80px alpha pixels for volley vs
idle. All ten values exactly matched the workflow JSON.

**Blockers:** the playable game's current sprite loader does not yet
consume these separate 32-facing four-phase atlases, and production
integration still requires explicit art approval. No published textures,
game manifests or gameplay code were edited. No previously validated
128-frame Warden atlas was rerendered.

## 2026-10-28 Federation Hunter Spider Drone original 32-facing preview

**Preview-only; not integrated or approved for publication.** This is a new
original eight-legged robotic vehicle, not a re-render of an existing asset.
The Federation Hunter Spider Drone (`FED-VEH-004`) has a low red ceramic
carapace, eight independently animated hip rigs, sixteen individually editable
upper/lower leg struts, a dorsal injection lance and separate damaged geometry.

- [Model and isolated renderer](../../tools/blender/preview_federation_hunter_spider_32.py):
  32 directions × idle/move/attack/destroyed = **128** transparent 160px RGBA
  preview frames; an editable compressed `.blend` is saved before animation.
- [Real 160px and 80px pixel QA](../../tools/blender/qa_federation_hunter_spider_32.py):
  validates every alpha bounding box, movement, attack, destroyed alpha and
  adjacent-facing differences; outputs contact sheets, atlas and JSON metrics.
- [Targeted Blender 4.2.23 workflow](../../.github/workflows/federation-hunter-spider-32-review.yml):
  verifies Blender archive checksum, compiles scripts, reopens the saved
  `.blend`, checks **10 hidden wreckage meshes, 8 hip rigs and 16 limb
  struts**, then runs pixel QA. Failed jobs retain generated artifacts.
- [Initial Actions render #40556753530](https://github.com/shukritobi/chrono-dominion/actions/runs/40556753530)
  and [draft preview PR #62](https://github.com/shukritobi/chrono-dominion/pull/62).
  **Passed** checksum-verified Blender 4.2.23 rendering, reopened-source
  verification and all 128-frame pixel QA gates. The editable saved
  `.blend` is **134,244 bytes** and reopens with **10 hidden editable
  wreckage meshes, 8 hip rigs and 16 two-section leg struts**.
  [Preview artifact #12757981363](https://github.com/shukritobi/chrono-dominion/actions/runs/40556753530/artifacts/12757981363)
  contains all 128 PNGs, source, atlas, 160px/80px contact sheets and JSON.
- Downloaded and inspected **actual** 160px and 80px contact sheets. The
  small-scale silhouette reads as a distinct long-legged hunter drone with
  red dorsal armour and amber sensor; the attack visibly extends the lance
  and the destroyed state loses its legs and scatters fractured equipment.
  Limitation: individual ankle and knee details are subtle at 80px; movement
  is a single alternating gait pose, not a multi-beat walk cycle.
- Actual per-facing pixel QA at 80px, expressed as min / max / mean:
  **movement RGBA 898 / 1,087 / 999.8**;
  **attack RGBA 888 / 1,097 / 1,031.4**;
  **destroyed RGBA 850 / 939 / 908.4**;
  **destroyed alpha 769 / 847 / 807.5**;
  **adjacent-facing idle RGBA 891 / 1,038 / 983.7**.
  At 160px, destroyed alpha is **1,892 / 2,373 / 2,049.8**.
- Independently recomputed 80px destroyed-alpha pixels for directions
  **00 / 07 / 15 / 23 / 31**: **804 / 803 / 830 / 816 / 830**;
  all five match the artifact's per-facing JSON. The 5120×640 preview
  atlas is RGBA and has SHA-256
  `0be6b3eb5149dd022e3d904e951fc63e9c8314aff1e084dde451877b3ebe7836`.
- Source branch is based on the previous unmerged Warden temporal-attack
  preview PR #60 because its dependency chain contains the common Blender
  geometry helpers. No live game texture, manifest or gameplay file was
  modified. Runtime integration and art approval remain blockers.

## 2026-10-28 Federation Hunter Spider four-beat walking animation — validated

**Preview-only; never published to the game.** The validated original
`FED-VEH-004` Hunter Spider source from
[Actions #40556753530](https://github.com/shukritobi/chrono-dominion/actions/runs/40556753530)
was downloaded and reopened rather than regenerating its 128 baseline sprites.
Eight new independently editable six-vertex/eight-face ankle rocker meshes were
authored and parented to the eight original hip rigs. The original 16 upper/lower
leg struts now move through four true 3D walking beats: **plant, lift, swing,
settle**. This creates **128 new 160×160 RGBA movement sprites**, one for each
of 32 directions and four gait phases. No original attack, idle or wreckage
sprite was rerendered.

- [Draft stacked review PR #66](https://github.com/shukritobi/chrono-dominion/pull/66), based on the unmerged original Hunter Spider PR #62.
- [Successful targeted Blender render, source reopen and strict pixel QA
  #40566554369](https://github.com/shukritobi/chrono-dominion/actions/runs/40566554369).
  [Preview artifact #12763152657](https://github.com/shukritobi/chrono-dominion/actions/runs/40566554369/artifacts/12763152657)
  contains the editable `.blend`, 128 independent PNGs, 5120×640 atlas,
  real 160px/80px contact sheets and per-facing JSON.
- [Original four-beat Blender geometry and renderer](../../tools/blender/preview_federation_hunter_spider_gait.py),
  [strict image QA](../../tools/blender/qa_federation_hunter_spider_gait.py),
  [isolated render workflow](../../.github/workflows/federation-hunter-spider-gait-review.yml).
  Modeling commit [289ab365](https://github.com/shukritobi/chrono-dominion/commit/289ab36562b2ebc007f6c832baf243dc92be6a5e);
  QA fix [7c590724](https://github.com/shukritobi/chrono-dominion/commit/7c590724d3e7c0cc9561de211eca1efd2d5bf0bd);
  workflow commit [2a242ea0](https://github.com/shukritobi/chrono-dominion/commit/2a242ea0b4d700eecd3a3fd99cb83cc43153ee63).
- All workflow steps **passed**, including checksum-verified official Blender
  4.2.23, Python compilation, downloading the existing validated source,
  rendering exactly 128 new frames, reopening the saved **128,528-byte
  editable Blender source**, verifying **8 hidden editable faceted rockers,
  8 original hip rigs, 16 original limb struts and 10 hidden wreckage meshes**,
  and inspecting every new 160px/80px PNG for transparency and clipping.
- Original 5120×640 atlas SHA-256 **before and after** is exactly
  `0be6b3eb5149dd022e3d904e951fc63e9c8314aff1e084dde451877b3ebe7836`.
  The **new, separate gait preview atlas** SHA-256 is
  `3f23945fb68a1e7be8b43892e768c2f673a647cf8bd2863b66351d2f7bd34ccd`.
- The actual downloaded **160px and 80px contact sheets were visually
  inspected**. At 160px the diagonal support legs distinctly compress,
  lift and extend between beats. At 80px the leg stance remains perceptible,
  but individual ankle rocker facets are very subtle. This is a four-beat
  preview sequence, not yet a polished seamless in-game locomotion cycle.

| Real 80px changed pixels, all 32 directions | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Plant → lift RGBA | **971** | 1,069 | 1,023.0 |
| Lift → swing RGBA | **938** | 1,056 | 999.4 |
| Swing → settle RGBA | **892** | 986 | 951.1 |
| Swing vs archived single-frame move RGBA | **886** | 1,073 | 991.7 |
| Swing vs archived idle RGBA | **867** | 978 | 938.7 |
| Swing vs archived idle alpha | **679** | 773 | 722.9 |
| Adjacent-facing plant RGBA | **895** | 1,065 | 1,004.3 |

Independently recalculated actual downloaded PNG differences for **plant →
lift at 80px** for facings **00 / 07 / 15 / 23 / 31**: **1,040 / 1,039 /
1,050 / 1,060 / 1,069** pixels. All five exactly match the automated
per-facing QA report. The acceptance thresholds were not reduced or bypassed.

**Limitations / blockers:** the new 8-foot rocker facets are difficult to
distinguish individually at 80px; more knee piston travel and a seamless
eight-beat gait may be worthwhile. The current game sprite loader does not
consume these separate 32-facing four-phase movement atlases. Art approval
and a separately reviewed loader are required before integration. No live
textures, production manifests, runtime or gameplay files were modified.

## 2026-10-28 Federation Hunter Spider four-stage physical destruction — validated

**Preview-only, not published or integrated.** The original Hunter Spider
editable source from [Actions #40556753530](https://github.com/shukritobi/chrono-dominion/actions/runs/40556753530)
was downloaded rather than regenerated. Four genuinely different physical
destruction phases (**impact → shear → rupture → settle**) were rendered
for 32 facings: **128 new transparent 160×160 RGBA sprites**. The existing
128-frame atlas was neither rerendered nor modified.

- [Successful targeted Blender 4.2.23 workflow #40575580364](https://github.com/shukritobi/chrono-dominion/actions/runs/40575580364)
  and [preview-only artifact #12766852312](https://github.com/shukritobi/chrono-dominion/actions/runs/40575580364/artifacts/12766852312).
  [Draft stacked PR #68](https://github.com/shukritobi/chrono-dominion/pull/68)
  depends on the earlier gait PR #66 and original model PR #62.
- [Original volumetric Blender destruction modeling](../../tools/blender/preview_federation_hunter_spider_destruction.py),
  [per-facing actual PNG QA](../../tools/blender/qa_federation_hunter_spider_destruction.py)
  and [isolated preview workflow](../../.github/workflows/federation-hunter-spider-destruction-review.yml).
- All workflow steps **passed**: 128 frames rendered, source reopened,
  **14 new hidden eight-vertex/six-face editable fragments** verified,
  10 original hidden wreckage meshes and eight original hip rigs preserved,
  and all 160px/80px alpha clipping and pixel acceptance gates passed.
  The saved compressed editable .blend is **131,487 bytes**.
- The baseline atlas SHA-256 remained exactly
  `0be6b3eb5149dd022e3d904e951fc63e9c8314aff1e084dde451877b3ebe7836`
  before and after. The separate new four-stage preview atlas SHA-256 is
  `a2146a40bae4fdbc0f40744a89591d2433ace820a0c54684c0aa4cb45191ae70`.
- Downloaded the real artifact and inspected **both 160px and 80px contact
  sheets**. At 160px the drone's front legs shear away, armor separates,
  glowing core fractures emerge and the remaining chassis collapses. At 80px
  all four silhouettes remain distinguishable, with visible reductions in
  height and leg count. **Five independently recalculated 80px impact→shear
  RGBA pixel counts** for facings 00/07/15/23/31 were
  **1068 / 1046 / 933 / 968 / 1074**, all exactly matching JSON.

| Actual 80px changed pixels across 32 directions | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Impact → shear RGBA | **877** | 1,074 | 984.9 |
| Shear → rupture RGBA | **814** | 1,087 | 953.2 |
| Rupture → settle RGBA | **726** | 929 | 817.6 |
| Impact → shear alpha | **740** | 888 | 808.9 |
| Shear → rupture alpha | **673** | 904 | 790.0 |
| Rupture → settle alpha | **540** | 712 | 630.1 |
| Settle vs archived destroyed RGBA | **536** | 623 | 589.4 |
| Settle vs archived destroyed alpha | **327** | 437 | 392.4 |
| Impact vs archived idle RGBA | **881** | 983 | 931.9 |
| Adjacent impact facings RGBA | **927** | 1,058 | 979.1 |

**Artistic limitations:** the orange reactor exposure is comparatively bright
in the rupture phase at 80px, and the settled wreck retains a broad upper
rectangular silhouette. Future polish should soften the brightest fracture
patches and make one edge of the final chassis more jagged. These are
art-direction improvements, not failed pixel acceptance gates. The game
loader cannot yet consume the separate four-phase 32-facing destruction
atlas; integration needs separate art approval and loader changes.

**Production safety:** the stacked PR contains only Blender preview modeling,
strict PNG QA, targeted workflow, asset register and this document. No
published textures, manifests, runtime or gameplay files were changed.


## 2026-10-28 PSI-VEH-004 original Hallucination Drone — validated preview

**Preview-only, not integrated.** This new Psionic drone uses original Blender
geometry rather than copying another faction's tank or spider silhouette:
a low hovering phase-projector housing, six independently articulated
amethyst folding petals, a separately moving neural iris, paired forward
psychic needles and five physical attack-only spectral emitters. Its destroyed
pose hides the intact chassis and exposes ten separate editable broken
petals, sheared needles, reactor fractures and neural lens fragments.

- [Original Blender model](../../tools/blender/preview_psionic_hallucination_drone_32.py)
  builds a saved editable source and **128 new RGBA sprites** (32 directions ×
  idle/move/attack/destroyed) without touching any existing preview or live art.
- [Actual PNG acceptance checks](../../tools/blender/qa_psionic_hallucination_drone_32.py)
  verify all 128 transparent 160px frames, clipping, 80px motion/attack
  RGBA differences, 80px destroyed alpha differences, and distinct adjacent
  facings. The 80px gates are 50/50/90/40 changed pixels respectively.
- [Isolated targeted Blender workflow](../../.github/workflows/psionic-hallucination-drone-32-review.yml)
  installs checksum-verified Blender 4.2.23, reopens the saved .blend, verifies
  six independent petal rigs, five hidden attack meshes and ten hidden wrecks,
  then uploads actual 160px/80px contact sheets, atlas, frames and JSON QA.
- Modeling commit `f6f2a680604ae97a1f2527ce1ec09aba0aedd095`;
  QA commit `b29bf0a5125adfea2036589e696fc25798f3e265`;
  workflow commit `d5f3e36db23679a23ee411d4bc2864564c0873ef`.

**Status at authoring:** implementation committed; targeted render has not yet
been confirmed passing. Do not claim pixel QA, saved-source reopen, or 80px
visual inspection until the actual Actions artifact is reviewed. A failing
threshold requires physical geometry changes, never a lowered gate. No
production texture, manifest or runtime path was modified.


### Final validated Hallucination Drone review (28 October 2026)

- [First targeted run #40583775258](https://github.com/shukritobi/chrono-dominion/actions/runs/40583775258)
  successfully rendered **all 128** frames and reopened the saved Blender
  source, but the QA script itself failed on a **metric dictionary key
  mismatch** (`move_vs_idle_rgba_80_min` versus the actual
  `move_vs_idle_rgba_80` field). This was a test-code error, **not** a
  failing art threshold. [Correction commit `39c3b87a`](https://github.com/shukritobi/chrono-dominion/commit/39c3b87a8fcc056547f50cdd3307dd78e1c4b1b0)
  strips only the `_min` suffix when looking up a metric; it leaves all
  four acceptance thresholds unchanged.
- [Successful targeted Blender 4.2.23 run #40583938655](https://github.com/shukritobi/chrono-dominion/actions/runs/40583938655)
  **passed every step**, including actual 160px frame clipping, 80px
  quantitative QA, and Blender source reopen.
  [Download preview artifact #12769934851](https://github.com/shukritobi/chrono-dominion/actions/runs/40583938655/artifacts/12769934851).
- The reopened **124,869-byte editable .blend** contains six independent
  petal rigs, a separate neural iris, five hidden physical attack meshes,
  and ten hidden, editable eight-vertex wreckage meshes.
- All **128 RGBA sprites** passed, with a **5120×640** preview atlas,
  **1280×640** 160px contact sheet and **640×320** 80px contact sheet.
  Atlas SHA-256:
  `59e25ecc1d6f844370ff2233636b3e61ffd2e82ce09fb92e70fbde1ecf49940d`.
- Real 80px pixel counts across **all 32 facings**:
  movement versus idle **591–643 RGBA** (440–502 alpha), attack versus
  idle **611–696 RGBA** (476–538 alpha), destroyed versus idle
  **661–725 RGBA** (**594–666 alpha**), and adjacent idle facings
  **575–618 RGBA**. These exceed the unchanged 50/50/90/40 QA gates.
- Downloaded and inspected the actual 160px and 80px contact sheets.
  Independently recalculated destroyed alpha differences at facings
  **00/07/15/23/31 = 635/624/644/607/633**; all five match the
  workflow's JSON report exactly.
- [Draft preview PR #70](https://github.com/shukritobi/chrono-dominion/pull/70)
  contains only the new Blender renderer, PNG QA, isolated workflow,
  AssetRegister entry and this QA documentation. No live art, manifests,
  runtime, or gameplay files were modified.

**Art limitations:** individual petal hinges and the smaller fracture
veins are subtle at 80px. The spectral attack flare is visible but partly
covers the front psychic needles. The original drone has one movement pose
and one firing pose, not yet a temporal cycle. It remains **preview-only**;
no art publication or game integration is approved.


## 2026-10-28 PSI-VEH-004 four-phase psychic discharge — render verification pending

**Preview-only, not approved for integration.** This follow-up opens the
already validated Hallucination Drone editable source from
[successful Actions #40583938655](https://github.com/shukritobi/chrono-dominion/actions/runs/40583938655)
rather than regenerating any of its original 128 sprites. It adds 15
separately editable physical Blender effect meshes: three toroidal
focusing rings, two tapered neural lances, four eight-vertex faceted
psychic filaments and six detached mirage splinters. The six original
petal rigs and independent neural iris move between **charge → focus →
burst → cooldown**, with the original five attack meshes retained but
hidden to reduce overexposed weapon glare.

- [Original new Blender modeling](../../tools/blender/preview_psionic_hallucination_temporal_attack.py).
- [Actual 160px/80px PNG QA and contact-sheet generator](../../tools/blender/qa_psionic_hallucination_temporal_attack.py).
- [Isolated targeted render workflow](../../.github/workflows/psionic-hallucination-temporal-attack-review.yml).
- Expected archived preview atlas SHA-256:
  59e25ecc1d6f844370ff2233636b3e61ffd2e82ce09fb92e70fbde1ecf49940d.
  The pipeline must verify this before and after rendering.
- Planned deliverables: a second compressed editable .blend, 128 new
  160×160 transparent RGBA sprites, separate 5120×640 four-phase preview
  atlas, real 160px and 80px contact sheets, 80px animated GIF, and
  per-facing JSON. Acceptance gates: >=30 changed RGBA pixels at 80px
  between each adjacent phase, >=50 versus the old attack, >=25 changed
  alpha pixels for burst versus idle, and >=20 changed RGBA pixels for
  adjacent viewing directions. Clipping and source reopen are mandatory.

**Status at implementation:** the workflow has not yet passed; no numerical
pixel results or source-reopen verification are claimed here. Review the
actual 160px/80px artifact and record exact metrics, run/commit links,
and any failures before promoting this from pending to validated. If
a threshold fails, change the physical geometry rather than lowering
the acceptance gates. No approved texture, live manifest, or runtime
path is written. The 32-facing temporal atlas remains unsupported by
the current game sprite loader.


### Final validated four-phase Hallucination Drone review (28 October 2026)

- [Successful targeted Blender 4.2.23 Actions run #40592046457](https://github.com/shukritobi/chrono-dominion/actions/runs/40592046457),
  [preview artifact #12773569603](https://github.com/shukritobi/chrono-dominion/actions/runs/40592046457/artifacts/12773569603)
  and [draft stacked PR #72](https://github.com/shukritobi/chrono-dominion/pull/72).
- Original modeling commit [de58fee7](https://github.com/shukritobi/chrono-dominion/commit/de58fee7b153d2c0e951521f033844a9bbe07d78);
  actual-pixel QA commit [c4439eba](https://github.com/shukritobi/chrono-dominion/commit/c4439eba7ee97c43be0698f4815dc4702dca7d8b);
  isolated workflow commit [4e6d053b](https://github.com/shukritobi/chrono-dominion/commit/4e6d053b042d1a84287523ad643e28e727feebde).
- All **128 new 160×160 RGBA frames** passed. The saved **137,295-byte
  compressed editable Blender source reopened successfully** and verified
  all 15 new meshes, four genuine eight-vertex/three-face filaments, six
  original petal rigs, ten original wreckage meshes and five preserved
  original attack meshes (all hidden in the saved idle-compatible source).
- Original atlas SHA-256 was unchanged before/after:
  59e25ecc1d6f844370ff2233636b3e61ffd2e82ce09fb92e70fbde1ecf49940d.
  New separate 5120×640 temporal atlas SHA-256:
  4a749486d0f75bb76cdae81049516938311f5e33e53dd2851d9590af4b6c7c5b.
- Downloaded and inspected the **actual 1280×640 160px** and
  **640×320 80px** contact sheets, plus the separate animated 80px GIF.
  Five independent charge→focus 80px RGBA measurements at facings
  **00/07/15/23/31 = 648/664/675/666/647**, matching JSON exactly.

| Actual 80px changed pixels across 32 facings | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Charge → focus RGBA | **619** | 699 | 661.5 |
| Focus → burst RGBA | **590** | 742 | 684.9 |
| Burst → cooldown RGBA | **618** | 750 | 703.3 |
| Burst vs archived single-pose attack RGBA | **571** | 728 | 678.1 |
| Burst vs archived idle RGBA | **605** | 735 | 695.2 |
| Burst vs archived idle alpha | **457** | 576 | 542.9 |
| Charge vs archived idle RGBA | **569** | 620 | 596.2 |
| Adjacent-facing charge RGBA | **603** | 652 | 633.0 |

**Visual finding:** the new forward physical torus and forked discharge
remain recognizable at 80px and the intense old single-frame flare no
longer obscures the twin psychic needles. However, the delicate torus
and petal articulation remain subtle at gameplay scale; the 160px view
is more legible. Future polish could enlarge the main burst silhouette
slightly without increasing bloom. The original movement remains a
single-pose preview, and the game loader cannot consume the separate
32-facing temporal atlas yet.

**Safety verified:** the comparison against parent PR #70 contains only
five development files (new Blender model, strict PNG QA, isolated workflow,
AssetRegister and this document). No live textures, game manifest,
runtime or gameplay files were modified. No original 128-frame sprites
were rerendered. **Preview only; not integrated or approved for publishing.**


## 2026-10-28 PSI-VEH-004 four-beat physical gliding movement — verification pending

**PREVIEW ONLY, not integrated.** This isolated follow-up reuses the previously
validated original Hallucination Drone editable source from
[Actions #40583938655](https://github.com/shukritobi/chrono-dominion/actions/runs/40583938655)
and does **not** regenerate its 128 baseline sprites or touch the previously
validated four-phase attack atlas. Four new movement phases are
**hover → bank → surge → settle**, with six independently articulated original
petal rigs, moving neural iris, banked hover chassis, six new closed
eight-vertex/six-face stabilizer blades, and six additional volumetric
rearward ion-wake wedges. The new 12 meshes are independently editable and
hidden in the neutral saved source. Wake geometry is visible only during bank
and surge; there are no 2D image overlays or generated-image substitutes.

- [Original physical Blender modeling](../../tools/blender/preview_psionic_hallucination_four_beat_glide.py),
  committed as [458c6247](https://github.com/shukritobi/chrono-dominion/commit/458c6247f7d2cea45aa280399d5f8491742a0a01).
- [Strict actual-PNG 160px/80px QA](../../tools/blender/qa_psionic_hallucination_four_beat_glide.py),
  committed as [5a4ed1a7](https://github.com/shukritobi/chrono-dominion/commit/5a4ed1a7617fa28c0f9daf8e4703f3adf3f3ae7d).
- Baseline atlas must retain SHA-256
  `59e25ecc1d6f844370ff2233636b3e61ffd2e82ce09fb92e70fbde1ecf49940d`.
- Targeted workflow should render **128 new RGBA 160×160 frames** across
  32 facings, reopen the new compressed editable `.blend`, verify all 12
  added closed volumetric meshes and the preserved six original petals,
  ten wreckage meshes and five attack meshes, and publish a **separate**
  5120×640 preview atlas, 160px/80px contact sheets, 80px animated GIF,
  and per-facing JSON report. Strict acceptance gates at 80px: at least
  30 changed RGBA pixels per adjacent movement phase, 50 surge-vs-old-move
  RGBA pixels, 25 surge-vs-idle alpha pixels, and 20 adjacent-facing
  hover RGBA pixels. Every frame must be nonempty, RGBA and unclipped.
- **Not yet validated at authoring:** no actual Blender source reopen,
  PNG measurements, run number, or human 80px inspection is claimed.
  Record the final run and exact min/max/mean values only after downloading
  the real artifact. If a gate fails, change geometry; never relax a gate.
- **Publication barrier:** no `public/` textures, live art manifests,
  production atlases, game loader, runtime or gameplay files may be changed.
  Do not publish this new atlas without explicit approval.


### Final validated four-beat Hallucination Drone glide (28 October 2026)

- [Successful single targeted Blender 4.2.23 run #40599506483](https://github.com/shukritobi/chrono-dominion/actions/runs/40599506483),
  [preview artifact #12777920758](https://github.com/shukritobi/chrono-dominion/actions/runs/40599506483/artifacts/12777920758)
  and [draft stacked PR #74](https://github.com/shukritobi/chrono-dominion/pull/74).
  Final workflow launch/fix commit:
  [406dfe01](https://github.com/shukritobi/chrono-dominion/commit/406dfe016d04fecc41bfd3ef1fb5e7fb7eb7365b).
- Every workflow step **passed**: checksum-verified Blender 4.2.23,
  **128 new transparent 160×160 RGBA sprites** (32 facings × 4 movement
  phases), strict per-frame clipping and 80px pixel QA, and actual saved
  **124,773-byte editable .blend** reopening. The saved source contains
  six new closed eight-vertex/six-face stabilizer meshes and six independent
  closed eight-vertex/six-face ion-wake meshes, with six original petal rigs,
  ten hidden wreckage meshes, five hidden attack meshes and the original
  neural iris all preserved.
- New separate **5120×640 preview atlas** SHA-256:
  `3e61b0673a863abfda71dd4526884c2b9bdf9874737b6be16f77c380b56bc902`.
  The original baseline atlas SHA-256 was independently rechecked from
  the earlier downloaded artifact and remained **unchanged**:
  `59e25ecc1d6f844370ff2233636b3e61ffd2e82ce09fb92e70fbde1ecf49940d`.
- Downloaded and visually inspected the **actual 1280×640 160px**
  and **640×320 80px** contact sheets and 80px animated GIF. At 80px
  the surge-phase mint wake and changed petal stance remain recognizable;
  individual thin stabilizer details and iris articulation are subtle.
  The drone occupies a small portion of its 160px cell; later art polish
  should enlarge its visible gameplay-scale footprint rather than raising
  glow. This is a **visual limitation**, not a failed QA gate.
- Independently recalculated five actual hover→bank 80px RGBA comparisons
  at facings **00/07/15/23/31 = 657/634/634/672/664**. Every result
  exactly matches the uploaded JSON. Independently inspected all 128
  actual PNGs: 160×160 RGBA, nonempty and unclipped; alpha bounds
  x minimum **37**, x maximum **123**.

| Actual 80px changed pixels across all 32 facings | Minimum | Maximum | Mean |
|---|---:|---:|---:|
| Hover → bank RGBA | **606** | 702 | 652.9 |
| Bank → surge RGBA | **688** | 751 | 715.5 |
| Surge → settle RGBA | **638** | 713 | 685.2 |
| Surge vs archived move RGBA | **600** | 716 | 662.9 |
| Surge vs archived idle RGBA | **624** | 703 | 677.3 |
| Surge vs archived idle alpha | **511** | 574 | 538.9 |
| Hover vs archived idle RGBA | **577** | 618 | 595.7 |
| Adjacent hover facings RGBA | **569** | 644 | 609.5 |

**Production safety:** the parent-branch comparison contains exactly five
development files: the original Blender modeling script, PNG QA, isolated
workflow, AssetRegister and this QA document. The validated baseline was
downloaded, not rerendered. No live game art, production manifest, loader,
runtime or gameplay file changed. This movement atlas remains **preview-only,
not approved for publication and not playable**. Current game loader does not
consume this separate four-phase 32-facing atlas.

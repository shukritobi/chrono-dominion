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

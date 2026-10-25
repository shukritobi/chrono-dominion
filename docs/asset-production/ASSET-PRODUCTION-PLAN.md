# CHRONO DOMINION — ASSET PRODUCTION MASTER PLAN

**Version:** 1.0, 25 October 2026  
**Status:** Planning approved for review; no game art generated yet  
**Target:** Standalone, free browser RTS, visually reminiscent of classic isometric RTS art, containing original assets and original faction branding  
**Base research:** Yuri's Revenge arsenal lists, ModEnc infantry-sequence conventions, Vanguard engine `docs/ASSETS.md` and `docs/ROADMAP.md`, and the prior Chrono Dominion blueprint.

## 1. Decisions to lock before final production

| Decision | Baseline |
|---|---|
| Presentation | Retro 2.5D isometric RTS, 2:1 logical diamond grid |
| Logical tile | 64 × 32 px draft, subject to selected engine calibration |
| Rendering | Orthographic 3D source scene -> fixed-perspective prerendered sprites |
| Source files | Blender `.blend` (render master); SketchUp `.skp` / GLB / FBX optional modelling input |
| Game-ready output | Trimmed PNG atlases, optional lossless WebP where supported, plus JSON metadata |
| Vehicle movement | 32 headings, 11.25° increments |
| Infantry | 8 headings; directional walk and attack; deploy/crawl for relevant units |
| Building | Build-up, idle, damaged, critical, destroyed; lights and power variations as needed |
| Colour | Team colour handled by mask or material channel, not baked player palettes |
| Shadow | Separate ground-contact/altitude shadow, consistent direction and opacity |
| UI | Original high-contrast beveled panels and readable production cameo cards |
| License | Original generated artwork with tracked provenance; no bundled EA retail sprite/audio/data |
| Github | Commit code, metadata, textures, and LFS pointers for large editable scenes; check license obligations of reused code |
| Testing | Test 100% and 50% sprite scale against live battlefield before batch production |

**Camera calibration comes first.** A 2:1 tile metric does not on its own define elevation/azimuth; use the engine's world-to-screen transform, then match its camera within Blender using a calibration grid. Do not assume a generic 35.264° "perfect isometric" camera matches the renderer.

## 2. Art bible

### Faction 1 — Coalition Forces
- **Colours:** slate navy `#20354F`, steel blue `#668AAB`, glacier `#D2DCE3`, cyan `#46C6CD`
- **Shapes:** long narrow chassis, angular armour, radomes, flat roofs, precision-mounted turrets
- **Readability:** long-range and technological, relatively lightweight silhouettes; cyan denotes technology not team ownership
- **Logo concept:** split-chevron orbit mark, not an Allied eagle or game insignia

### Faction 2 — Iron Federation
- **Colours:** charcoal `#3A3D41`, oxide red `#8C4840`, forge orange `#C67646`, pale brass `#B5A28A`
- **Shapes:** heavy slabs, bulky tracks, cylindrical power plants, steel chimneys, high-contrast gun barrels
- **Readability:** unmistakably industrial and heavy
- **Logo concept:** segmented iron crown/gear lattice, not a hammer-and-sickle design

### Faction 3 — Psionic Order
- **Colours:** deep graphite violet `#242039`, amethyst `#704C95`, lavender `#BA85DC`, mint luminescence `#8CD4B5`
- **Shapes:** split-rib plating, levitating control modules, asymmetric body lines, biomorphic antennae
- **Readability:** immediate mind-control identity with distinctive original proportions
- **Logo concept:** triple neural-loop knot, not the Yuri portrait or Psi-Corps insignia

### Common rendering rules
1. Neutral material colours work before team tint. Never rely on ownership colour alone.
2. Keep unit shape visible at normal gameplay zoom and at 50% scale.
3. Use one global key light (upper-left in screen space), one ambient fill, same floor contact AO.
4. Buildings must align their occupied footprint with the playfield collision cells.
5. Keep all directions rendered from the same model, with a fixed camera and stable scale.
6. Render elements in layers where appropriate: hull, turret, rotor, shadow, muzzle, emissive, damage.
7. Preserve shape and pivot consistency across animations, including deploy/undeploy transformations.
8. No exact reproductions of retail sprites, unique character appearances, original music, logos, or cinematics.

## 3. Scope accounting

This planning registry contains **308 asset families**, which is not the number of output files, individual 3D models, or frames.
Every row can generate multiple sprites, directional animation frames, atlases, damaged variants, source scenes, cameos, and audio clips.

| Library | Asset families |
|---|---:|
| Coalition | 50 |
| Federation | 47 |
| Psionic | 34 |
| Neutral | 75 |
| Shared | 36 |
| UI | 32 |
| Audio | 27 |
| Campaign | 7 |
| **Total** | **308** |

| Milestone | Families |
|---|---:|
| S0 Art pilot | 15 |
| S2 Full skirmish | 240 |
| S1 Skirmish slice | 45 |
| S4 Campaign | 8 |

The register separates source-game reference roles from our playable names. It is **not a certified complete historical count** of all campaign entities, palette permutations, VFX subassets, or special mission exceptions. We audit those before claiming 100% scope parity.

## 4. Asset pipeline: concept to game

```text
Reference mechanics and footprint
   -> Original silhouette concepts (3 alternatives)
   -> Select design and lock sheet (front/side/isometric)
   -> SketchUp/Blender 3D blockout
   -> Material assignment and controlled faction accents
   -> Canonical camera + lighting rig
   -> 32-direction / 8-direction render batch
   -> Action animations and damage variants
   -> Separate player mask / shadow / emissive passes
   -> Crop, pad, atlas pack, export
   -> Runtime JSON + provenance record
   -> Test in 2:1 ground grid at 100% and 50%
   -> QA approval and repository commit
```

**Why not create each final sprite with a separate image-generation prompt?**
Direction-to-direction shape consistency fails when hundreds of images are generated independently. Generative imagery is useful for **visual concepts, terrain textures, menu backgrounds, UI portraits and initial material references**. For characters, vehicles and buildings that need rotated frames, consistent damage, and reproducible assets, use one editable 3D source.

### Source and output directory layout

```text
art/
  concepts/coalition/...
  concepts/federation/...
  concepts/psionic/...
  source/
    coalition/vehicles/lynx_battle_tank/
      model.blend
      render-config.json
    ...
  rigs/
    iso-camera.blend
    shadow-lighting.blend
  build/
    export-sprites.py
    pack-atlases.py
    verify-assets.py
  register/
    AssetRegister.csv
public/
  assets/
    atlases/
      units/
      structures/
      terrain/
      props/
      vfx/
    ui/
    audio/
    manifests/
      assets.json
```

### Runtime contract
- Every asset has a stable ID and art source. No in-game code should depend on the display name.
- The manifest includes `{id, kind, atlas, facings, states, anchor, tileFootprint, scale, tags, provenance}`.
- Action clips declare FPS, frames per facing, and frame coordinates/keys in the atlas.
- Anchors should be **feet/track-contact centres**, not sprite rectangle centres.
- Building anchors and footprints support north/south z-order overlays.
- All frame rectangles include sufficient gutter/padding to avoid edge bleed.
- Atlas packing must be deterministic and reproducible in GitHub CI.
- Keep textures lossless until final browser profiling; optimize WebP only when alpha, masks and sharp lines survive.
- Audio clips are separate assets (not part of the sprite atlas).

## 5. Required animation coverage

| Class | Mandatory | Conditional |
|---|---|---|
| Infantry | idle, walk, fire, death, 8 headings | prone, crawl, deploy, garrison, fly |
| Tank/ground vehicle | idle/move heading (32), shoot, destruction | independent turret, deploy, amphibious, transform |
| Aircraft | 32 headings, altitude shadow, attack, death | hover, land, lift off, rotor |
| Ships | 32 headings, idle/move, sinking, attack | submerge/surface, missile hatch, aircraft takeoff |
| Structures | build-up, idle, damaged, destroyed | radar motion, power-off, weapon turret, critical damage |
| Effects | spawn/loop/fade timeline | lightning branching, persistent hazard, terrain decal |

**Never define a fixed number of frames for every asset type.** The content registry maps each unit to its actual applicable actions and specialized ability animations. For example, the fortress needs a passenger occupancy mode; the psychic controller needs a live target link, transfer and release states; and a deployable artillery vehicle needs a multi-step transformation sequence.

## 6. First milestone: the 15-asset style pilot

The pilot must answer four questions: Do the factions look related to one universe, can a player identify a tank instantly, do sprites align to the ground grid, and can the style be mass-produced?

- **Coalition:** Coalition Ranger, Lynx Battle Tank, Grid Reactor.
- **Federation:** Federation Rifleman, Bull Heavy Tank, Arc Power Works.
- **Psionic:** Neural Disciple, Viper Light Tank, Biomorphic Energy Chamber.
- **Neutral:** Temperate Grass Set, Metal Ore Deposit Set.
- **Shared:** Vehicle Explosion, Neural Control Link.
- **UI:** Chrono Dominion Logo, Sidebar Shell.

Deliverables for each pilot combat unit:
- A silhouette sheet comparing 3 clearly different ideas.
- One selected editable 3D source.
- One canonical isometric still at 2×.
- Full facing atlas (32 for tanks, 8 for infantry) and base-state animation.
- Transparent alpha sprite, shadow and team-mask layers.
- A production cameo thumbnail using the same source scene.
- Metadata and provenance.
- One screenshot of the asset placed in the calibration test battlefield.

**Approval gate:** The pilot is approved when units and buildings look consistent at 100% and 50%, no frame appears to change physical design, anchors remain stable, and the art is visually distinct from retail game sprites.

## 7. Second milestone: playable 3-faction skirmish asset slice

After the 15-asset pilot, expand the art library to a vertical slice where every faction can:
1. Deploy an MCV into a Construction Yard.
2. Place a power plant and refinery.
3. Generate ore income.
4. Build a barracks and war factory.
5. Produce basic infantry, tank, and a defensive emplacement.
6. Attack an enemy base, take damage, and destroy structures.
7. Use functional production cameos and the sidebar.

The tracker marks **S1 Skirmish slice** assets and provides the complete inventory. This is a production target, not a claim that game systems already run.

## 8. Full library: content passes

- **S2A Infantry:** all three faction rosters, campaign-only and stolen-tech variants flagged.
- **S2B Ground armour:** harvesters, MCVs, tanks, transports, special vehicles.
- **S2C Air and sea:** rotors, contrails, landing, surface/submerge and ship sinking.
- **S2D Buildings:** economy, production, tech, defenses, superweapons.
- **S2E World:** temperate, desert, snow, urban, coast, lunar and their transition tiles.
- **S2F Effects:** faction-specific lasers, electrical arcs, psychic control, mutation, nukes, storm, teleportation.
- **S2G Interface:** main menu, lobby, HUD, map previews, per-unit cameos, selection and cursor packs.
- **S2H Audio:** response voices, effects, ambient layers, original score, menu cues.
- **S4 Campaign:** mission briefings, original story artwork and mission-specific props.

## 9. QA and release gates

1. Source scene exists for every 3D unit/building; re-export is deterministic.
2. Units are identifiable by silhouette at zoomed-out scale; ownership remains legible.
3. All directional frames share a single pivot with no 'wobble' on rotation.
4. Alpha edges have no halo/fringe and render properly against grass, snow, sand, concrete and water.
5. Shadow and height offset match contact points; aircraft shadows separate from aircraft.
6. Recolouring does not affect hazard lights, windows, neutral materials or unique energy colours.
7. Building placement overlays match collision footprints and no player-visible tile mismatches remain.
8. Every buildable unit has a matching correct cameo with cost/category overlays handled by UI.
9. Each sound class has non-clipping levels and a no-audio fallback.
10. Texture and file sizes are measured on the slowest supported hardware; performance targets are validated in actual browser tests.
11. Each third-party texture/audio/source has a traceable license, and code reuse respects the upstream engine license.
12. Art, data, and engine packages can be rebuilt from GitHub without proprietary retail asset files.

## 10. Priority and acceptance

- **P0** = style pilot; inspect these before creating the larger library.
- **P1** = skirmish vertical slice.
- **P2** = full normal skirmish content and optional world variations.
- **P3** = mission-only or campaign production.

Asset statuses: `Planned → Concept → Blockout → Model Approved → Rendered → Packed → Integrated → QA Passed` (with `Needs Rework` on failure).

## 11. Research and technical references

- YR Allied arsenal: https://cnc.fandom.com/wiki/Category:Yuri%27s_Revenge_Allied_arsenal
- YR Soviet arsenal: https://cnc.fandom.com/wiki/Category:Yuri%27s_Revenge_Soviet_arsenal
- YR Yuri arsenal: https://cnc.fandom.com/wiki/Category:Yuri%27s_Revenge_Yuri_arsenal
- Vanguard asset techniques and provenance: https://github.com/harshilmathur/openra2/blob/master/docs/ASSETS.md
- Vanguard development roadmap: https://github.com/harshilmathur/openra2/blob/master/docs/ROADMAP.md
- SHP infantry sequences: https://modenc.renegadeprojects.com/Infantry_Sequences

**Engineering caveat:** The Vanguard repository contains a partial original-asset implementation, not a guarantee that full Yuri's Revenge assets or features already exist. Its parametric model renderer and static asset generator scripts are useful precedents, and any code integration must be checked against its GPL-3.0-or-later terms. Original EA retail art should not be bundled with the standalone GitHub release.

## 12. Next step

Build the **style pilot**, starting with the same tank archetype across all three factions, then test the tank sprites on one shared original terrain tile under one light rig before beginning infantry animations or the full building roster.
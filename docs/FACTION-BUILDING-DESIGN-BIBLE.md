# Chrono Dominion: Faction Architecture Bible
## Building art direction, v2.24

**Production rule:** All assets are original; no C&C/Red Alert/Yuri's Revenge meshes, textures, silhouettes or voice assets may be extracted or redistributed. Use fixed RTS orthographic projection, transparent 160×160 RGBA frames (upgradeable to 256), readable silhouettes at 75–150 displayed pixels and faction IDs visible without relying on color alone.

## Faction identities (must be visible in silhouette)

### Coalition — Aegis Accord (defensive precision)
- **Construction language:** faceted but symmetrical stacked modular aerospace architecture, long chamfered white steel, broad glass control windows, elevated twin antennae. Low, readable bevels; polished naval blue-gray armored shells and clean silver engineering surfaces.
- **Palette:** armor #2E5987; light #6DB8D4; nearly black engineering #0E1F33; cyan navigation light #22D9FF.
- **Mechanical signatures:** paired identical containment devices, precision aligned floodlights, blue monitoring strips, scanning equipment with a recognizable mechanical antenna sweep.
- **At-a-glance silhouette:** squares, chamfered roofs, centered towers and crossbars. Never black volcanic crystals or smog stacks.

### Iron Federation — Red Bastion (industrial mass)
- **Construction language:** squat brutalist fortress forms, dark steel machine halls, slab-shaped blast walls, pronounced riveted red armored skirts, vents, chimneys, heavy hydraulic and artillery housings.
- **Palette:** armor #872B22; light hot-rolled steel #B6815E; almost black steel #291B1C; amber heat #FF5E1A.
- **Mechanical signatures:** asymmetric exhaust towers, heavy grilles, sawtooth armored roofs, slotted bunker windows and amber furnace glow.
- **At-a-glance silhouette:** low, wide, blocky; thick chimneys and crenellated angular battlements. Avoid symmetric satellite dishes or floating neon rings.

### Psionic Order — Aether Synod (unfamiliar neural geometry)
- **Construction language:** tall faceted monoliths with exposed glowing cores, nested suspended toroidal rings, asymmetric floating-like crystalline fins, levitating projections, ringed observatories and inward-leaning pylons.
- **Palette:** obsidian-purple armor #592C8C, crystalline highlights #9E73CB, void black #1D1233 and bio-energy mint #3CFFC2.
- **Mechanical signatures:** charged central spheres, tetrahedral prism structures, non-rectilinear faceted petals and moving orbital scanner rings.
- **At-a-glance silhouette:** tall tapered spires, triangular prisms and separated toroids. Avoid conventional industrial sheds.

## Ten architectural families × three visibly different structures

| Code | Structure | Coalition blueprint | Federation blueprint | Psionic blueprint |
| --- | --- | --- | --- | --- |
| B01 | Command Citadel / HQ | Square stepped command block, symmetrical observation glass, tall centered beacon and four corner antennas | Sprawling armored pyramid bunker, tiered battlements, two offset heavy signal stacks | Hexagonal base, central needle obelisk, orbital torus and four tapered neural petals |
| B02 | Power Generator | Twin tall coaxial fusion stacks linked by glowing bridge and spinning mechanical stabilizer | Paired combustion chimneys, ribbed furnace core, hazard exhaust slots | Three pointed pylons around levitating energy orb, rotating containment ring |
| B03 | Ore Refinery | Contained sorter gantry with glass control booth and three blue-lit processing tubes | Open crusher drums, huge rust-red hopper, offset double ore silos | Enclosed extraction crystal, triple suspended nodes and vertical energy spikes |
| B04 | Barracks | Clean long training hall, modular dorm wings, twin radio masts and visible entry | Reinforced low garrison, corner watch bastions, slit viewing windows | Angular neural initiation dome, purple support petals and mint pulse core |
| B05 | War Factory | Open blue assembly hangar, overhead robotic bridge crane and bright bay door | Broad blast-door foundry, heat stacks, hydraulic forging tower and reinforced roof | Faceted assembly crucible, twin angled pylons and luminous fabrication hoop |
| B06 | Radar Array | Rotating parabolic dish on tall square telemetry mast | Boxy armored tower with rotating bar-array antenna and twin radio poles | Giant rotating vertical scanner hoop between two crystalline guide spires |
| B07 | Technology Lab | Multilevel glazed research tower with connected laboratory wings | Fortified bunker with vertical experiment chimney and heavy capacitor grid | Tapering crystal spire, stacked rotating energy collars and elevated prism crown |
| B08 | Sentry Turret | Twin high-accuracy barrels, angular optical package, compact square defensive plinth | Oversized siege rotary cannon in broad recoil enclosure and front blast shield | Floating energy emitter cradled by three triangular fins, mint orb barrel |
| B09 | Energy Tower | Four blue energy rails joined by a pulsing emission crown | Thick copper-colored induction coil, industrial vent banks and forked arc rods | Narrow neural focusing monolith with two vertical levitation rings and isolated tip |
| B10 | Air Command | Clean aircraft hangar, lit runway edge and control deck | Armored aviation bunker, split doors and heavy anti-air flak roof | Elevated crescent launch pad, arched energy runway and inward landing beacons |

## Animation language

Every building provides **idle (2 frames)**, **construct (2 frames)** and **damaged (1 frame)** atlas rows. At rest, energy cores and rotating elements change between frames; during construction the whole silhouette scales up from an incomplete foundation; damage introduces tilted secondary structure and warning flashes. Render at 160px 8-bit alpha RGBA. Background stays transparent; lighting stays in the material surface; no baked solid shadow rectangles or terrain tiles.

## Integration and acceptance

1. Before baking, generate the planned silhouettes from parameterized Blender geometry. Use source .blend files, no proprietary image references.
2. Bake all 30 unique buildings as faction–kind PNG atlas pairs with the original source model.
3. Validate each atlas's 160×800 dimensions (five animation rows); reject missing, empty or malformed frames.
4. Merge the new building entries into art/baked-v1/manifest.json, preserving existing infantry/vehicle/aircraft sheets. Never regress an already published game.
5. Browser game uses the baked manifest automatically; asset gallery offers the exact same sprites and animation preview.
6. Run game regression tests and verify both CI and GitHub Pages deployment before claiming the full set is live.

## Later-quality pass

Further sculpting, art-director-approved decal/texture details, non-repeating smoke, animated construction machinery and 8–12-frame high-quality state animations can refine these assets after the base silhouette pass. Current bake provides source-editable first-pass meshes, not fully rigged AAA models.

# Chrono Dominion v2.21: High-Definition Animated Roster

**Date:** 26 October 2026  
**Stage:** Playable, original procedural 2.5D art upgrade. Source geometry, not final Blender renders.

## In-game visual upgrade

The new \`art/animated-entities.js\` module paints shaded vector geometry directly under the game's device-pixel-ratio-aware canvas transform. Unlike stretched low-resolution static sprites, the render paths remain sharp at zoom and on high-density displays. All three factions have distinct chassis, armour, visor, emission and trim palettes.

| Class | What moves and what is distinct |
|---|---|
| Rifle infantry | Direction-sensitive weapons, independently alternating stride and feet, subtle idle bob, helmets and illuminated faceplate, rifle flash |
| Specialists | Articulated bodies, glowing discipline-specific equipment and animated energy hardware |
| Recon | Wheeled/treaded 3D-looking chassis, cabin glass, sensor mast and visible moving wheel highlights |
| Heavy armour | Reactive side armour, articulated turret and twin barrels, moving wheels, chassis motion and fire glow |
| Harvester | Ore drum, conveyor and payload crystals that fill based on actual cargo load, chassis movement |
| Battle tanks | Existing original 32-angle hull/turret atlases retained with extra movement and firing effects |
| Strike aircraft | Three-faction flying units with swept wings, illuminated exhausts, cockpit, hover bob and weapon glints |
| Buildings | Every existing structure has a unique original 3D-style silhouette and animated functional details (radar sweep, electrical coils, beacon, forge crane, mineral conveyor, etc.) |

Selected objects retain selection rings, health bars and veterancy indicators. Structures also retain construction opacity, sparks, damage, smoke and fire effects. No borrowed Red Alert or Yuri's Revenge artwork has been added.

## New playable aircraft class

- New structure: **Air Command** (Coalition **Sky Command**, Federation **Aviation Foundry**, Psionic **Aether Platform**). Available after Factory and Radar.
- New production unit: **Strike Aircraft** (Coalition **Falcon Interceptor**, Federation **Iron Talon**, Psionic **Spectre Wing**).
- Aircraft are produced in the vehicles tab from the airfield. They fly directly across ground blockers, water and stationary ground units, and can issue normal attack and move orders.
- Flight movement uses the existing unit, combat and resource system. This is a **first-pass flight model**, not a complete aviation layer: landing/rearming, flak interception, altitude-adjusted line of sight, aviation AI, dogfighting, payload/munitions and runway behaviour remain future work.

## Technical and quality notes

- Original vector paths are programmatic, cache-free and rendered at active canvas resolution. Drawing cost rises with living entities; performance needs testing on mobile/large battles.
- Added \`tests/animated-art-v221.test.mjs\` to exercise every faction and art class, infantry movement changes, rendered buildings, aircraft movement and the original directional tank renderer.
- The old static pilot SVG fallback remains available if the art module does not load. Directional PNG atlas manifest remains empty; this upgrade is an integrated runtime art pass, not a claim that final pre-rendered animation sheets exist.
- **Known follow-ups:** lighting/material calibration against actual screenshots, animations for deaths and full construction transitions, high-resolution 3D-source-to-atlas exports, and physically tested frame rate at 100–200 units.

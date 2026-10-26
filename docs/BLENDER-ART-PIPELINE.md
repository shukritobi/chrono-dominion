# Chrono Dominion: Original Blender 3D Sprite Pipeline

This is the editable, repeatable pipeline for original high-resolution RTS art. No Red Alert or Yuri's Revenge assets are copied or redistributed.

## Production assets

- Blender procedural-PBR models, separate for Coalition, Federation and Psionic Order.
- 160×160 RGBA sprites rendered from a fixed orthographic isometric camera.
- The asset bake targets the 17-type roster: rifle infantry, specialist, tank, heavy, recon, harvester, aircraft, HQ, generator, refinery, barracks, factory, radar, tech, turret, beam and airfield. Three faction palettes give 51 editable Blender models and 51 atlases.
- Directional unit sheets use eight facing columns and four animation rows: idle (1), move (2), attack (1).
- Structure sheets use one column and five animation rows: idle (2), construct (2), damaged (1).
- The original tank hull and turret 32-angle atlases remain as fallback.
- The game loads Blender sprites with art/baked-atlas-loader.js. If an atlas fails to load, the procedural art continues to render.

## Inspection and downloadable originals

- In-game menu: **3D ASSET LAB**
- Direct gallery: https://shukritobi.github.io/chrono-dominion/art/gallery.html
- PNG sprite sheets: art/baked-v1/{faction}-{kind}.png
- Editable Blender models: art/sources/blender/{faction}-{kind}.blend
- Manifest: art/baked-v1/manifest.json

## How to regenerate

With Blender 4.0+ and Pillow installed, run:

    blender --background --threads 4 --python tools/blender/animated_assets.py -- --output generated/chrono-hd --kinds all --size 160
    python3 tools/blender/pack_animated.py --input generated/chrono-hd --output art/baked-v1 --size 160

The "Bake original Blender art" GitHub Action performs these steps, validates sprite completeness, uploads inspection artifacts, and commits the editable models and PNG sheets. The Pages deployment updates the playable site. Rendering uses headless-safe CPU Cycles.

## Modeling and material system

Faction paint, metallic surfaces, roughness, glass, glowing trims and non-image procedural bump textures are all authored in Blender. Original hard-surface meshes include separately animated infantry limbs, optics and rifles; wheeled and tracked armored chassis; twin-barrel artillery; swept-wing aircraft with jet engines; and distinguishable factories, generators and radar antennas.

Every source file is editable in Blender and can be sculpted or re-rigged before re-export.

## Known limits

- This is an original procedural first pass, not sculpted AAA artwork. Frames are intentionally sparse for efficient browser loading. Later refinement should add 8–12-frame walk cycles, recoil, explicit death/demolition atlases and more elaborate explosions.
- The project is a 2.5D sprite game, not a true real-time mesh engine. The editable model sources are Blender .blend files, not game runtime meshes.
- Faction contrast, pivot placement, mobile performance, and art scale should be inspected on real devices. Avoid increasing to 256px frames before checking memory on large battles.

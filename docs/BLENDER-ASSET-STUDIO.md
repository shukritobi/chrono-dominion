# Blender Asset Studio

**One editable Blender model at a time. Preview first, publish only after review.**
This workflow lives in the existing Chrono Dominion repository, with no second repo or local Blender installation needed.

## Run it

1. Open [Actions: Blender Asset Studio](https://github.com/shukritobi/chrono-dominion/actions/workflows/blender-asset-studio.yml).
2. Choose **Run workflow**. Keep branch **main**.
3. Select the **faction** (Coalition, Federation or Psionic Order).
4. Select a single **kind**, such as generator, hq, radar, soldier, tank or aircraft.
5. Choose **preview** (default). Leave confirmation blank.
6. Open the completed run's **Artifacts** section. Download the studio-FACTION-KIND-RUNNUMBER artifact. It contains **preview.png** (checkered review sheet), the packed RGBA PNG, manifest metadata, and an editable **.blend** source.

You can repeat these steps after revising the Blender scripts without changing the playable game.

### Publish an approved preview

Once the model looks right, run **Blender Asset Studio** again, select the same faction/kind and choose **publish**. Type **PUBLISH** in the confirmation field. This rerenders with the committed modeling scripts, validates every frame, and publishes only the selected model to:

- art/baked-v1/FACTION-KIND.png
- art/sources/blender/FACTION-KIND.blend
- art/baked-v1/manifest.json (merges selected entry while preserving all others).

This production commit triggers normal game tests and Pages deployment. Publishing requires the GitHub Actions repository token to have Contents read/write permissions.

A preview cannot modify production art. Incorrect confirmation fails before modeling starts. A failed render, empty frame, missing Blender source or wrong atlas size fails validation before publication.

## Rendering parameters

- **Modeling:** Blender 4.x CPU Cycles, tools/blender/animated_assets.py and tools/blender/building_architecture.py.
- **Sprite format:** 160px RGBA, fixed orthographic camera. The game currently requires one frame size across its manifest.
- **Buildings:** five frames (idle ×2, construct ×2, damaged ×1) producing 160×800 atlas.
- **Units:** eight facings, four frames per facing (idle ×1, move ×2, attack ×1), producing 1280×640 atlas.
- **Review sheet:** an enlarged checkerboard contact sheet with animation state labels.
- **Model source:** compressed .blend model included in review artifacts and committed only after approval.
- **Efficiency:** each run renders just one class and one faction.
- **Artifact retention:** 30 days.

The old full-roster [Bake original Blender art](https://github.com/shukritobi/chrono-dominion/actions/workflows/bake-hd-art.yml) is now a deliberately manual exceptional release, requiring **PUBLISH_ALL**. Do not use it for normal previewing.

## Local commands (optional)

With Blender and Pillow installed:

    blender -b -t 4 --python-exit-code 1 --python tools/blender/animated_assets.py -- --output generated/chrono-studio --kinds generator --factions coalition --size 160
    python3 tools/blender/pack_animated.py --input generated/chrono-studio --output generated/chrono-studio/packed --size 160
    python3 tools/blender/asset_studio.py validate --stage generated/chrono-studio --faction coalition --kind generator
    python3 tools/blender/asset_studio.py preview --stage generated/chrono-studio --faction coalition --kind generator

The deliberate release command is separate:

    python3 tools/blender/asset_studio.py publish --stage generated/chrono-studio --repo . --faction coalition --kind generator --approve PUBLISH

Commit the generated three production files afterward.

## Limits and quality control

Headless procedural Blender models are real editable geometry, but the results still need iterative artistic review. The initial animations are short state sequences, not detailed character rigs or sculpted destruction simulations. The studio is not an interactive Blender viewport; inspect preview.png or open the .blend source in the desktop app.

**The discarded AI-generated picture pack is excluded.** This workflow uses original Blender-authored geometry only.

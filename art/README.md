# Original art sources and published Blender atlases

Chrono Dominion uses original Canvas/vector fallback art and **42 published Blender-rendered PNG atlases** in `art/baked-v1/`, referenced by `art/baked-v1/manifest.json`. The runtime loader (`art/baked-atlas-loader.js`) asynchronously loads valid atlases and falls back to vector art if a sprite is missing or fails to decode.

## Published coverage (28 October 2026)

Each of the three factions—Coalition, Federation and Psionic—has 14 published sprite categories: soldier, specialist, heavy, aircraft, generator, factory, radar, headquarters, refinery, barracks, technology laboratory, turret, beam defense and airfield. All are original Blender-rendered sprites, but this is **not complete art coverage**. Tanks, reconnaissance vehicles and harvesters still use procedural/vector fallback, and the current building atlases lack the planned critical and destroyed animation states.

The current manifest uses 160×160 frames, eight directional columns for the four published unit categories, and one column for buildings. The browser validates decoded dimensions before using an atlas. `tests/baked-art-v223.test.mjs` now also checks every published PNG's header, dimensions, transparent RGBA format, faction filename, animation layout, and runtime renderability. This test is already included in the regular npm/GitHub Actions checks. It does **not** replace visual inspection or guarantee PNG decoding in every browser.

## Source and preview pipeline

Editable Blender sources are under `art/sources/blender/`. Further model iterations and quality-assurance previews are documented in `docs/asset-production/BLENDER-VISUAL-QA-2026-10-26.md`; many newer preview renders have **not** replaced the published atlases. Preserve approved production art until replacement frames have passed visual review, format checks and in-game readability testing.

Track planned units, animation states, faction differentiation and milestones using `planning/AssetRegister.csv` and `docs/asset-production/ASSET-PRODUCTION-PLAN.md`. Those planning records predate several shipped prototype assets and are not themselves proof that a sprite is absent. Do not copy proprietary game artwork, sounds or logos.

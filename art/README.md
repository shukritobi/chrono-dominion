# Original art sources and published Blender atlases

Chrono Dominion uses original Canvas/vector fallback art and **42 published Blender-rendered PNG atlases** in `art/baked-v1/`, referenced by `art/baked-v1/manifest.json`. The runtime loader (`art/baked-atlas-loader.js`) asynchronously loads valid atlases and falls back to vector art if a sprite is missing or fails to decode.

## Published coverage (28 October 2026)

Each of the three factions—Coalition, Federation and Psionic—has 14 published sprite categories: soldier, specialist, heavy, aircraft, generator, factory, radar, headquarters, refinery, barracks, technology laboratory, turret, beam defense and airfield. All are original Blender-rendered sprites, but this is **not complete art coverage**. Tanks, reconnaissance vehicles and harvesters still use procedural/vector fallback, and the current building atlases lack the planned critical and destroyed animation states.

The current manifest uses 160×160 frames, eight directional columns for the four published unit categories, and one column for buildings. The browser validates decoded dimensions before using an atlas. `tests/baked-art-v223.test.mjs` now also checks every published PNG's header, dimensions, transparent RGBA format, faction filename, animation layout, and runtime renderability. This test is already included in the regular npm/GitHub Actions checks. It does **not** replace visual inspection or guarantee PNG decoding in every browser.

## Source and preview pipeline

Editable Blender sources are under `art/sources/blender/`. Further model iterations and quality-assurance previews are documented in `docs/asset-production/BLENDER-VISUAL-QA-2026-10-26.md`; many newer preview renders have **not** replaced the published atlases. Preserve approved production art until replacement frames have passed visual review, format checks and in-game readability testing.

Track planned units, animation states, faction differentiation and milestones using `planning/AssetRegister.csv` and `docs/asset-production/ASSET-PRODUCTION-PLAN.md`. Those planning records predate several shipped prototype assets and are not themselves proof that a sprite is absent. Do not copy proprietary game artwork, sounds or logos.

## Owner-approved 32-facing tank and missing-vehicle release (28 October 2026)

The GitHub Actions workflow `.github/workflows/publish-blender-vehicles.yml` stages an atomic nine-atlas production update when it first lands on `main`. It does **not** merge experimental preview branches. The release retrieves the previously QA-verified original 32-facing Lynx, Bull and Viper tank sprites from their exact GitHub Actions runs. It keeps all 32 facings and original idle/move/attack/destroyed frames (rather than collapsing them to generic eight-direction tank visuals).

Six additional missing gameplay atlas categories are rendered from current, editable Blender models: recon and ore harvester for each faction. An all-or-nothing validator checks every RGBA sprite sheet and editable source before publication. The runtime supports 1-, 8- and 32-direction atlases with a vector fallback until images load. The acceptance test recognizes exactly the baseline 42 or the complete 51-atlas release, never a partial update.

This release does not yet create gameplay definitions for experimental Hunter, Warden, Spider, Shrapnel Carrier, drones, carrier variants, temporal attacks or other preview-only model families. Those need separate unit registrations and state mapping; simply merging their preview-only modeling PRs would not make them playable.

# CHRONO DOMINION

**An original, free-to-play browser RTS inspired by the pace and structure of classic base-building strategy games.**

[**Play the prototype on GitHub Pages**](https://shukritobi.github.io/chrono-dominion/) · [Full game blueprint](docs/game-design/FULL-BLUEPRINT.md) · [Asset production plan](docs/asset-production/ASSET-PRODUCTION-PLAN.md) · [308-family asset register](planning/AssetRegister.csv)

> **Project status (2026-10-25):** Early playable browser skirmish prototype `v0.5.0`. The simulated skirmish engine is functional but is not a finished clone of any commercial game. New 32-direction isometric tank atlases, independently rotating turret sprites, and three original reactor sprites are integrated. Detailed production sprites and other artwork remain in progress.

## Get playing

The prototype is static HTML/CSS/JS. No installation, account, server or dependencies are required to play single-player.

- Online, once GitHub Pages has been enabled: **https://shukritobi.github.io/chrono-dominion/**
- Locally: download this repository and open `index.html` in your browser, or use `python -m http.server 8080` and open `http://localhost:8080`.

## v0.5 saving, squad orders and art pipeline

- **Save/load skirmishes** to the same browser profile with F6 (save), F9 (load), Ctrl+S, or the pause/main-menu buttons. Saves are local to the browser, not cloud backups.
- **Formation movement** assigns each selected friendly unit a unique walkable destination near the order location.
- **Building placement grid** highlights a 3×3 logical structure footprint; shorelines reject partial water overlap.
- **Reproducible original 3D artwork generator:** [Blender source script](tools/blender/generate_tanks.py), [PNG atlas packer](tools/blender/pack_atlas.py), and [render manifest](art/rendered/manifest.json). Rendering needs Blender installed separately; finalized Blender atlases are not yet included in this repo.
- [v0.5 release notes](docs/RELEASE-0.5.md) | [Save and formation tests](tests/save-formation.test.mjs).

## v0.4 combat and economy

- **Projectiles travel** visibly and only deal damage when they hit a target; muzzle flashes and impacts enhance battlefield feedback.
- **Vehicle rotation is speed-limited**, with independently aimed tank turrets using the existing 32-direction atlas system.
- **Building controls:** select a damaged friendly building to start/stop repairs (consumes credits), or sell a non-command building for a partial refund.
- **AI uses earned credits** from ore harvesters instead of a periodic money cheat, can replace lost harvesters and repair buildings, and stages attacks after a base-building interval.
- Added [v0.4 release notes](docs/RELEASE-0.4.md) and `tests/combat-economy.test.mjs`, both included in the GitHub Pages verification pipeline.

## v0.3 asset system

- Three faction battle tanks with **32 animated facing positions for hulls** and **32 independently aimed turret positions**. The initial atlases are generated procedurally at startup with an original mesh-based vector renderer (`art/vehicle-renderer.js`), so gameplay works without downloading external content.
- Three faction-specific generator sprites and three original infantry SVG sprites are used in the game world, with corresponding build-menu artwork.
- Source vector tank concepts and reactor sprites live in `art/pilot/` and an editable `art/manifest.json` keeps IDs consistent with the asset register.
- Tests cover vehicle atlas generation, turret aiming, gameplay integration, fog, economy and navigation. See [release notes](docs/RELEASE-0.3.md).

## Current features

| System | Prototype |
|---|---|
| Armies | Coalition Forces, Iron Federation and Psionic Order |
| Battlefield | 34 × 34 isometric grid, three map palettes, ore deposits and two water areas |
| Menu | Skirmish setup, faction/map selection, difficulty, pause, restart and result screen |
| Economy | Refineries, automatic harvesters, credit spending and construction |
| Base construction | Command Citadel, power, refinery, barracks, factory, radar and tech lab |
| Unit production | Infantry, specialists, tanks, heavy tanks and harvesters |
| Combat | Selection, orders, target acquisition, hit points, defensive towers and explosions |
| AI | Computer faction expands, produces units and attacks the player |
| Psionic ability | Conditional capture of weakened enemy units |
| Interface | Classic-inspired right sidebar, radar, HUD, selection info, zoom and pan |
| Fog of war | Player vision and previously explored terrain |
| Art | Three original tank SVG pilots plus runtime-drawn placeholder art |

## Controls

| Input | Action |
|---|---|
| Left-click | Select one unit or building |
| Left-drag | Select multiple friendly units |
| Shift + left-click | Add friendly unit to selection |
| Right-click | Move selected units, attack an enemy, or cancel construction placement |
| Sidebar | Queue units or choose a building to place |
| WASD or arrow keys | Pan camera |\n| Ctrl+1–9 | Assign selected units to control group |\n| 1–9 | Recall a control group |\n| Shift + right-click | Attack-move to selected point |\n| H | Center camera on headquarters |\n| Space | Center camera on selection |
| Mouse wheel | Zoom |
| F6 / Ctrl+S | Save current skirmish to this browser |\n| F9 | Load saved skirmish from this browser |\n| Escape | Cancel placement / pause match |
| Radar click | Jump camera |

**Win condition:** eliminate the opposing side's buildings. This is a simple prototype rule, not the full release game-mode system.

## Repository

```text
chrono-dominion/
├── index.html                        # Browser application and menus
├── style.css                         # Classic-style responsive RTS UI
├── game.js                           # Prototype simulation, UI binding and renderer
├── .github/workflows/deploy.yml      # CI + GitHub Pages publication
├── docs/
│   ├── game-design/FULL-BLUEPRINT.md
│   ├── asset-production/ASSET-PRODUCTION-PLAN.md
│   ├── PROJECT-STATUS.md
│   └── ART-PIPELINE.md
├── planning/AssetRegister.csv        # Planned asset families
└── art/README.md                     # Original-source-art standards
```

## Asset production

See [Art pipeline](docs/ART-PIPELINE.md) and [Asset production plan](docs/asset-production/ASSET-PRODUCTION-PLAN.md). Target workflow: **original concept > editable 3D source > locked orthographic camera > systematic directional renders > transparent sprites and shadow masks > atlas + metadata > browser test**.

The initial planned art pilot is three tanks, three infantry, three buildings, two terrain samples, two effects and a logo/sidebar. Three original vector tank sprites have now been integrated. No external proprietary game sprite or sound is distributed here.

## Enable GitHub Pages

1. Open **Settings > Pages** in this repository.
2. Under **Build and deployment**, choose **GitHub Actions**.
3. Open **Actions > Check and deploy browser prototype** and verify the run. Use **Run workflow** if needed.
4. Visit **https://shukritobi.github.io/chrono-dominion/**.

The deploy workflow validates `game.js` and the planning asset register before publishing.

## Roadmap

- **0.1: Playable skirmish proof of concept** — delivered\n- **0.2: Original pilot art, cached A* pathfinding and RTS unit-control shortcuts** — delivered
- **0.2: Model-and-batch-render pilot art** — next
- **0.3: Improved collision, pathfinding, player tech and AI behaviours**
- **0.4: Full army rosters, country variants, air/naval forces and special powers**
- **0.5: Save games, replays, maps, skirmish options and balancing**
- **0.6+: Campaign, multiplayer, map editor, performance/accessibility**

See [v0.2 release notes](docs/RELEASE-0.2.md), [pilot tank assets](art/pilot/README.md) and [Project status](docs/PROJECT-STATUS.md) for explicit limitations.

## Rights

Chrono Dominion is an original project. It is not affiliated with or endorsed by Electronic Arts or the Command & Conquer rights holders. Names, visual art, audio and assets from copyrighted commercial games are not included in the codebase. No source-code or asset license has been selected yet.

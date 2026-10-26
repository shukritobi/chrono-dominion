# CHRONO DOMINION

**An original, free-to-play browser RTS inspired by the pace and structure of classic base-building strategy games.**

[**Play the prototype on GitHub Pages**](https://shukritobi.github.io/chrono-dominion/) · [Full game blueprint](docs/game-design/FULL-BLUEPRINT.md) · [Asset production plan](docs/asset-production/ASSET-PRODUCTION-PLAN.md) · [308-family asset register](planning/AssetRegister.csv)

> **Project status (2026-10-25):** Early playable browser skirmish prototype `v1.5.0`. The simulated skirmish engine is functional but is not a finished clone of any commercial game. New 32-direction isometric tank atlases, independently rotating turret sprites, and three original reactor sprites are integrated. Detailed production sprites and other artwork remain in progress.

## Get playing

The prototype is static HTML/CSS/JS. No installation, account, server or dependencies are required to play single-player.

- Online, once GitHub Pages has been enabled: **https://shukritobi.github.io/chrono-dominion/**
- Locally: download this repository and open `index.html` in your browser, or use `python -m http.server 8080` and open `http://localhost:8080`.

## v1.5 Traffic-Aware Navigation

- **Faster pathfinding:** A* now uses a binary min-heap for route expansion, reducing the pathfinder's queue-search overhead when many units receive orders.
- **Dynamic traffic replanning:** units monitor actual forward progress, and after being delayed by other troops, request a path that assigns extra cost to crowded cells. This encourages safe short detours around parked vehicles.
- **Order stability:** newly issued commands clear stale congestion timers, and arrival clears the detour state.
- **Regression tests:** shortest path, diagonal corner collision, blocked-heavy detours, actual congestion replan triggering, and saved game compatibility.
- Still not a full synchronized flow-field planner or a guarantee of deadlock-free single-tile passage.
- [v1.5 release notes](docs/RELEASE-1.5.md) | [Navigation tests](tests/navigation-v15.test.mjs).

## v1.4 Large-Battle Collision Optimisation

- **Spatial bucket collision:** units now query nearby neighbours instead of scanning all other units for each attempted movement, and the overlap-correction pass considers only local pairs.
- **Transitory per-frame index:** updated as units move and discarded after each tick. Existing save/load, specialist movement and collision rules are preserved.
- **Live battlefield performance display:** approximate frames per second plus current living unit count, refreshed about once per second.
- **New 130-unit stress test** covers movement, terrain boundaries, occupancy, transient-state cleanup and saved-game compatibility.
- This improves simulation efficiency but **does not implement full multi-squad traffic reservation or synchronized flow-field pathfinding**.
- [v1.4 release notes](docs/RELEASE-1.4.md) | [Late-game traffic tests](tests/traffic-v14.test.mjs).

## v1.3 Connected Squads, AI Flanking & Optional Sound

- **Squad movement:** right-click group orders now allocate distinct destination cells connected to the selected squad's side of a lake or blocked passage, reducing unreachable formation orders.
- **Tactical AI flanks:** enemy squads approach remembered enemy positions from reachable side routes, never consulting hidden enemy locations. They keep their assigned flank rather than changing it every strategy update.
- **Opt-in original sound effects:** use **♪ OFF / ♪ ON** in the HUD to enable locally synthesized weapon fire, impacts, construction, specialist abilities and victory/defeat tones. Sound is disabled by default and can be muted instantly.
- No audio files or copyrighted sound assets are required. Browsers without Web Audio continue silently.
- [v1.3 release notes](docs/RELEASE-1.3.md) | [Tactical/audio tests](tests/tactics-v13.test.mjs).

## v1.2 Combat, Navigation & Intelligence

- **Safer unit navigation:** A* now routes toward the nearest reachable land when a clicked destination is separated by blocked terrain, and does not claim an unreachable position has been reached.
- **Fog-aware enemy commander:** the AI can only attack enemy positions spotted by its own army, including scouts. Last-seen positions expire after a limited time and are preserved in local saves.
- **Visible construction and damage:** scaffolding, repair sparks, cracks, smoke, fire and rubble/destruction effects make structures communicate their condition during battle.
- **Less information leakage:** effects behind unexplored fog are concealed, and hidden enemy deaths are not prematurely revealed to the AI.
- [v1.2 release notes](docs/RELEASE-1.2.md) and [gameplay regression tests](tests/gameplay-v12.test.mjs).

## v1.1 Battlefield Library

- **Up to 12 named custom battlefields**, accessible through the **[Map Forge editor](map-editor.html)**. Save changes to a selected map or use Save As New to keep multiple independent designs.
- Open any existing map, duplicate it, or remove it using an intentional two-click delete confirmation.
- The old single-map browser storage is **automatically migrated** into the new multi-map library, keeping the existing editable battlefield.
- A faster editor redraw and continuous pen, mouse, and touch brush strokes make drawing water and placing ore much easier.
- Select **Save & Play Custom Skirmish** to launch the active map. JSON export/import remains the recommended backup method, as maps are only stored on the current browser profile.
- [v1.1 release notes](docs/RELEASE-1.1.md), [map-library tests](tests/map-library-v11.test.mjs).

## v1.0 Map Forge editor and custom skirmishes

- **[Open Map Forge](map-editor.html)**: an interactive 34×34 map editor designed for desktop and touch devices. Paint water/land, place/remove ore, choose a terrain theme and start from one of three templates or a blank grid.
- **Save & Play**: locally save a validated custom battlefield, then play it in the existing three-faction skirmish engine. The Custom Battlefield option appears automatically after saving a valid design.
- **JSON import and export**: download or import a custom map backup; browser local storage holds one active custom design, not a cloud-synced map library.
- **Spawn protection and map validation** prevent water from blocking starting bases, and enforce usable ore deposits.
- **Saved-match compatibility**: saved battles now embed their authored map so that they remain playable even if the separate editor design is changed or deleted.
- [v1.0 release notes](docs/RELEASE-1.0.md) | [Map Forge tests](tests/map-forge-v100.test.mjs).

## v0.9 battle reports and editable map data

- **Post-battle scorecards:** victory/defeat now displays side-by-side economy, production, losses, enemy destruction and a provisional match score, with **Copy Battle Report**.
- **Map source files:** each of the three skirmish maps is now defined by editable [JSON](maps/) with water rectangles, ore positions, spawns and scenery metadata. The generated [map catalog](maps/catalog.js) is what the game loads.
- Edit maps, then run `npm run maps:build` and `npm run maps:check`; the GitHub Actions pipeline enforces map validation and source parity.
- **Recon patrol AI** now cycles across resource waypoints and remembers recent sightings while protecting nearby harvesters.
- Battle counters persist in local saved games. Old saves without counters still load; historical results cannot be reconstructed retroactively.
- [v0.9 release notes](docs/RELEASE-0.9.md) and [v0.9 regression tests](tests/battle-report-v09.test.mjs).

## v0.8 skirmish maps and reconnaissance

- **Three distinct map layouts:** Verdant Front, Ashen Basin and Frostline each have their own lake/ice channels and ore locations, not only different terrain colours. The skirmish setup now includes a map preview.
- **Starting credit choice:** 3,000, 5,000 or 8,000 credits, applied equally to both players and preserved in local saves.
- **Faction recon vehicles:** Coalition Lynx Scout (fast), Federation Iron Patrol (armoured), Psionic Shade Runner (mobile and longer-ranged). All recon units reveal more map territory under fog of war.
- **Computer reconnaissance:** the AI builds scouts, explores forward ore fields and responds to threats near its harvesters.
- **Three new original recon SVG sprites** integrated into the battlefield and build panel. These are single-angle pilot assets.
- [v0.8 release notes](docs/RELEASE-0.8.md) | [Skirmish regression suite](tests/skirmish-v08.test.mjs).

## v0.7 specialist warfare

- **Three faction-specific active abilities** for the specialist unit unlocked through Barracks + Radar: Coalition **Chrono Jump** (short-range teleport), Federation **Arc Discharge** (electrical area attack), and Psionic **Neural Jam** (temporary battlefield disable).
- Select a specialist and press **F** or use the action panel. For Chrono Jump, right-click a clear destination after pressing F. Cooldowns and attack effects are simulated and displayed.
- AI now builds specialist units, casts abilities around threats and continues tactical commands even when a unit is already producing.
- Three new original static specialist SVG sprite pilots are integrated into the battlefield and production sidebar.
- [v0.7 release notes](docs/RELEASE-0.7.md) and [specialist ability tests](tests/abilities.test.mjs). High-resolution 3D character animations remain future work.

## v0.6 tactical movement and faction identity

- **Tactical combat commands:** X Stop, G Guard, B Hold, V Aggressive, T Attack-Move (followed by right-click); accessible from selected units in the sidebar.
- **Unit-aware collision and sidestepping** reduce overlap and formation jams. This remains a prototype, not final crowd pathfinding.
- **Factions now fight differently:** Coalition tanks are faster, Federation tanks hit harder and survive longer, and Psionic tanks emphasize speed.
- **Production queue** displays active progress and a cancel/refund control.
- Three new original faction-specific static **defense turret sprites** appear in the map and sidebar.
- Includes [v0.6 release notes](docs/RELEASE-0.6.md) and [tactical regression suite](tests/tactics.test.mjs).

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
| F | Use selected specialist's ability (Coalition: then right-click target) |\n| X / G / B / V | Stop / Guard / Hold / Aggressive for selected combat units |\n| T, then right-click | Attack-move to destination |\n| F6 / Ctrl+S | Save current skirmish to this browser |\n| F9 | Load saved skirmish from this browser |\n| Escape | Cancel placement / pause match |
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

# CHRONO DOMINION

**An original, free-to-play browser RTS inspired by the pace and structure of classic base-building strategy games.**

[**Play the prototype on GitHub Pages**](https://shukritobi.github.io/chrono-dominion/) · [Full game blueprint](docs/game-design/FULL-BLUEPRINT.md) · [Asset production plan](docs/asset-production/ASSET-PRODUCTION-PLAN.md) · [308-family asset register](planning/AssetRegister.csv)

> **Project status (2026-10-26):** Playable browser skirmish prototype `v2.28.0`, now with original high-definition vector animation across infantry, vehicles, structures and a first-pass playable aircraft class. This is not a finished commercial RTS. Original Blender-baked sprite sheets now exist for multiple units and structures; full atlas integration, final art coverage and detailed aviation mechanics remain future production work.


### v2.28 Safer air return routes and reconnaissance

- Empty aircraft now check their own faction's observed turrets and Energy Towers before flying home. When significantly safer, they take a bounded lateral detour, then reload and resume their original mission.
- Player and AI aircraft use separate sensor reports. Hidden or expired tower contacts do not affect navigation, and losing an airfield still releases its aircraft.
- Scouts now correctly avoid observed Energy Towers. Browser saves and original assets are unchanged.
- [v2.28 release notes](docs/RELEASE-2.28.md) · [regression tests](tests/air-return-safety-v228.test.mjs).

### v2.27 Air defense targeting

Sentry Turrets and Energy Towers now prioritise aircraft detected by their own side's sensors, without tracking hidden enemies. Energy Towers gain a 50% anti-air damage bonus while keeping normal ground damage. Existing saves remain compatible. See [v2.27 release notes](docs/RELEASE-2.27.md). Automated CI and deployment must be verified separately.

### Blender Asset Studio (preview first, publish only after approval)

The [Blender Asset Studio workflow](https://github.com/shukritobi/chrono-dominion/actions/workflows/blender-asset-studio.yml) builds one original faction model at a time in headless Blender. Run a safe **Preview** to download a contact sheet, RGBA sprite atlas and editable .blend model; use **Publish** and the explicit PUBLISH confirmation only after approving the model. Preview runs never modify production sprites. [Studio instructions](docs/BLENDER-ASSET-STUDIO.md).

### Aircraft Ordnance and Rearming (v2.26)

- Strike Aircraft now carry four shots, automatically return to a surviving friendly Air Command when empty, and reload one shot every 2.5 seconds if the base has sufficient power.
- Air wings retain their prior orders during servicing; AI planners leave returning aircraft alone. Depleted aircraft cannot fire, and selected aircraft display their remaining ordnance.
- Old local saves remain compatible. [Release notes](docs/RELEASE-2.26.md) · [Regression tests](tests/aircraft-rearm-v226.test.mjs).

### AI Air Wing (v2.25)

- AI commanders now construct Air Command after reaching the required factory/radar tech and earning enough credits, and purchase up to two Strike Aircraft using the existing paid production queue.
- Aircraft independently defend visible base threats, pursue only sensor-reported building positions, and patrol unexplored terrain when no target has been observed. Hidden enemy coordinates are never used to issue attacks. The balance lab now tracks AI airfields, aircraft deployed and aircraft lost.
- Ground platoon staging excludes aircraft, while the player retains existing mixed-unit flight formations. [Release notes](docs/RELEASE-2.25.md) · [AI aviation regression tests](tests/ai-air-wing-v225.test.mjs).

### Flight-layer formation commands (v2.23)

- Mixed ground/aircraft selections now receive separate movement and attack-move formations. Aircraft can fly to water and otherwise ground-blocked destinations while ground troops keep connected, walkable slots.
- Includes regression tests for mixed orders, Frontier Expanse XL, and save/load. See [flight formation notes](docs/AIR-FORMATIONS.md).

### Frontier XL and camera navigation (v2.22)

- New selectable **48×48 Frontier Expanse XL** map nearly doubles the tile area of the legacy 34×34 skirmish fields.
- Middle-mouse drag or hold Space + left drag to pan; C centers selection and H centers HQ. One-finger touch pan, two-finger pinch and pan, WASD, mouse wheel zoom and radar click-to-jump remain supported.
- AI scouting, two-base spawning, map preview, fog, navigation, camera bounds and both XL/legacy save formats adapt to battlefield size. Original 34×34 Map Forge editor remains unchanged.
- [v2.22 release notes](docs/RELEASE-2.22.md) · [XL camera regression test](tests/expanse-camera-v222.test.mjs).

### Animated faction roster and first aircraft (v2.21)

- Three factions now have independently animated infantry/specialists, HD-style armored scout/siege/harvester visuals, distinctive active/damaged structures and glow/lighting effects. The original 32-direction battle tank/turret atlases remain in place.
- **Air Command** is buildable after the Factory and Radar, adding selectable, flying Strike Aircraft for Coalition, Federation and Psionic Order. Air units cross lakes and ground obstacles while retaining standard move, attack and production controls.
- See [v2.21 visual release notes](docs/RELEASE-2.21-ART.md) for features, implementation, tests, and remaining animation limitations.

### Coordinated AI siege and improved battle effects (v2.19)

- **Observed-target suppression:** Primary and support assault squads concentrate attacks on visible defensive emplacements or higher-value structures. Predicted committed volleys and projectiles reduce waste against nearly destroyed structures.
- **Command priorities:** Guarding against sighted base raiders, casualty withdrawal, and post-retreat cooldown still override siege directives. Unseen enemy buildings can only be pursued as last-reported map positions, never directly shot.
- **Less crowded attacks:** AI platoon members reserve nearby perimeter slots to spread out when attacking known objectives; stalled units avoid repeating their previous blocked destination.
- **Clearer combat visuals:** Projectiles use movement-based tracer strokes and vehicle strikes create original fading shockwave rings. All effects respect the player's fog and existing save schema.
- **Measured combat:** Nine-scenario lab now reports siege focus orders and confirmed AI hits on structures. See [v2.19 release notes](docs/RELEASE-2.19.md).
- [Full v2.19 PR verification](https://github.com/shukritobi/chrono-dominion/actions/runs/40304543534) passed. Recorded 44,588 combined combat damage, 32 changed siege orders and 294 confirmed AI hits on buildings in scripted simulations; scout losses rose to 12.

### Resumable AI staging (v2.20)

- Primary and support squads now resume their saved rally destinations after temporary combat interrupts their movement orders. Visible enemy engagements and already-arrived members are left alone; active valid paths are not repeatedly reset.
- A new transient `rallyResumes` counter appears in the nine-scenario balance report. See [v2.20 release notes](docs/RELEASE-2.20.md) and [rally regression tests](tests/rally-recovery-v220.test.mjs). Existing saves remain compatible.

### Reachable AI assaults and recovery (v2.18)

- **Accessible targets:** Infantry and tanks reject strategic objectives that have no connected approach from the AI's available combat force.
- **Approach selection:** Offensive units survey up to 36 walkable perimeter positions around a *reported* building, replacing the previous three-flank fallback that could order attacks into blocked building tiles.
- **Stall recovery:** Active platoon members stuck more than 18 seconds can try another reachable flank. Navigation caches are cleared only when the route changes.
- The nine-scenario simulation now reports assault launches and actual reroute events, not just platoon creation. See [v2.18 notes](docs/RELEASE-2.18.md) and [pathing tests](tests/assault-pathing-v218.test.mjs).
- **Verified:** [v2.18 GitHub Actions](https://github.com/shukritobi/chrono-dominion/actions/runs/40302281701) passed checks and deployed the website. In nine simulated matches, 5 launched at least one platoon assault, 1 stalled attacker rerouted and 10 reconnaissance units were lost.

### Strategic AI attack objectives (v2.17)

- Primary platoons rank **discovered** enemy buildings by strategic importance, distance, age of sensor reports and observed defensive danger rather than attacking whatever was seen most recently.
- Support platoons may choose a distinct valuable objective; recovering fighters cannot join before their cooldown finishes.
- Tested for fog-honest decisions and save compatibility. See [v2.17 release notes](docs/RELEASE-2.17.md) and [regression test](tests/objective-ranking-v217.test.mjs).

### Resilient AI platoons (v2.15)

- Primary and support squads preserve surviving members and assigned rally positions after a casualty or wounded retreat, instead of restarting every time.
- Two surviving fighters can finish an existing rally. Fresh squads retain their original recruitment minimums; wounded troops remain in reserve until their cooldown ends.
- Added [v2.15 regression tests](tests/platoon-attrition-v215.test.mjs) and [release notes](docs/RELEASE-2.15.md). The [v2.15 verification and deployment](https://github.com/shukritobi/chrono-dominion/actions/runs/40297911617) passed, including the nine-scenario integrity suite. Comparative balance gains are not yet established.

### Safe scout detours (v2.13)

- Recon route planning retries a longer safe detour when the initial low-cost A* path crosses a **known** defended tile. Actual movement uses the same validated route, including during scout retreat.
- Defended one-tile chokepoints remain rejected; other unit navigation and the original local save schema are unchanged.
- [v2.13 release notes](docs/RELEASE-2.13.md) · [route/movement regression](tests/scout-detours-v213.test.mjs). Browser deployment and balance improvements require separate verification.

### Forward frontier reconnaissance (v2.14)

- Until the AI actually identifies an enemy building, scouts prioritize unexplored sectors farther from the AI's own command base.
- Both landmark and dynamic-frontier selection use a bounded, survey-dependent progression bonus. Existing threat-aware A*, protected detours and patrol reservations remain enforced.
- The bonus never uses hidden enemy coordinates or the human player's fog, and expires when the AI has a recent building sighting.
- See [v2.14 notes](docs/RELEASE-2.14.md).
- The [verified v2.14 balance check](https://github.com/shukritobi/chrono-dominion/actions/runs/40295190424) found enemy buildings in 6/9 simulated cases, formed platoons in 4/9 and lost 11 scouts; actual player testing remains necessary.

### Unit veterancy (v2.16)

- Combat units gain **Veteran** after two confirmed kills and **Elite** after five. Promotions give incremental damage, movement speed and fire-rate bonuses, with no automatic healing.
- The selection panel displays rank and confirmed kills, and a star or double-star badge appears over ranked units on the battlefield.
- Ordinary projectiles and damage-dealing specialist abilities credit confirmed kills; the old local save schema already holds the kill count, and older saves start at Recruit.
- See [v2.16 notes](docs/RELEASE-2.16.md) and [rank tests](tests/veterancy-v216.test.mjs).

### Recon evasive routing (v2.12)

- Recon units now attempt safe escape routes when standing within danger zones they have identified in sensor reports, instead of waiting under fire.
- Exit selection samples up to 48 locations and path-checks at most 12 through the existing threat-weighted navigator. Short recovery time prevents immediately turning back.
- No hidden enemy positions are used. Escapes are not guaranteed against unknown threats or inaccessible terrain. See [v2.12 notes](docs/RELEASE-2.12.md).

### Threat-aware scout routes (v2.11)

- Recon patrols now price every tile on a route using the AI's own remembered enemy turret and combat contacts. They detour around known danger and reject exposed defended chokepoints when no safe route exists.
- Actual scout movement uses the same weighted A* planner as patrol selection. Previously issued routes are reconsidered when intelligence changes; ordinary unit paths and existing browser saves are unchanged.
- Nine 240-second V8 headless scenarios passed integrity checks: 3/9 discovered a building, 2/9 formed platoons and 16 scouts were lost. These remain unsatisfactory AI outcomes, not verified balance improvements.
- See [v2.11 release notes](docs/RELEASE-2.11.md) and [route regression tests](tests/scout-routes-v211.test.mjs). Physical browser and GitHub Actions verification are separate.

### Scout safety and reconnaissance benchmarks (v2.10)

- AI scouts avoid destinations near **previously observed** hostile turrets and recent combat contacts. Their route choice never consults hidden enemy coordinates.
- Newly discovered dangers can cancel a scout's existing patrol destination, and wounded scouts retain their recovery cooldown rather than immediately receiving new scouting orders.
- The nine-scenario balance lab now records first enemy-building discovery, scout losses/survivors, surveyed terrain and first platoon staging, allowing measurable comparison across maps and difficulties.
- See [v2.10 release notes](docs/RELEASE-2.10.md) and [scout safety tests](tests/scout-safety-v210.test.mjs). v2.11 subsequently extends this to whole-route threat costs.

### Compact touch controls (v2.9)

Coarse-pointer devices now use larger command targets, responsive narrow-screen sidebars and short-landscape HUD constraints. A visible CANCEL button dismisses pending building placement, attack-move and targeted Chrono Jump orders without requiring a keyboard or right-click. See [v2.9 notes](docs/RELEASE-2.9.md). Physical device validation remains pending.

### Touch camera controls (v2.8)

- One-finger tap selects a friendly unit, or commands selected units when tapping terrain; drag pans the camera.
- Two fingers drag to pan and pinch to zoom (0.65× to 1.8×), keeping the terrain beneath the gesture midpoint in place.
- Pinching does not place a queued structure or issue accidental orders. Cancelled gestures are discarded. Mouse and keyboard controls remain supported.
- Gesture transitions are covered by `tests/touch-v28.test.mjs`; physical phones and tablets still require manual testing.

## Get playing

The prototype is static HTML/CSS/JS. No installation, account, server or dependencies are required to play single-player.

- Online, once GitHub Pages has been enabled: **https://shukritobi.github.io/chrono-dominion/**
- Locally: download this repository and open `index.html` in your browser, or use `python -m http.server 8080` and open `http://localhost:8080`.

## v2.6 Tactical Event History and v2.5 Intelligence

- **Event log:** expand TACTICAL EVENTS below the radar to review building attacks, critical damage, destroyed friendly structures and observed headquarters threats. Tap a recorded event to jump to its historical location.
- **No hidden-map leaks:** structure alerts mark only your own known buildings. Threat reports use the player's own sensor contacts rather than invisible enemy coordinates.
- **Controlled alerts:** repeat structure hits are throttled, while a newly critical building generates a separate warning. Twelve events are kept in local saves; legacy saves remain compatible.
- **v2.5 reconnaissance HUD:** shows explored and visible map percentages, live and remembered enemy contacts, and a jump to the last observed contact location.
- **Tests:** [event history regressions](tests/events-v26.test.mjs), [v2.6 release notes](docs/RELEASE-2.6.md) and [v2.5 release notes](docs/RELEASE-2.5.md). These checks do not replace mobile or browser playtesting.

## v2.4 Adaptive Reconnaissance

- **AI map survey memory:** the opposing commander tracks which terrain its own units and structures have explored. This memory is separate from your fog of war and never reveals hidden enemy positions.
- **Better reconnaissance priorities:** AI scouts favour reachable map sectors that would expose the most currently unexplored ground, rather than revisiting a fixed loop in order.
- **Multiple scouts cooperate:** active scout movement destinations are reserved so another recon vehicle chooses a different sector, reducing duplicated scouting.
- **Save-compatible exploration:** surveyed cells persist in the existing local skirmish save, older saves reconstruct current sight, invalid survey coordinates are discarded, and a new match clears previous survey history.
- **Automated tests:** new [survey regression suite](tests/survey-v24.test.mjs) joins the gameplay and nine-scenario balance tests. [v2.4 release notes](docs/RELEASE-2.4.md).
- This is not full strategic territory allocation, omniscient target tracking or a campaign AI. Animations and additional original assets remain in progress.

## v2.3 Sector Reconnaissance and Balance Lab

- **Scouting that finds objectives:** AI reconnaissance units now follow reachable map-wide sector routes rather than cycling only through ore deposits. They skip water and disconnected landmarks and reveal hostile buildings only after actual sight.
- **Smarter AI assaults:** newly observed building contacts feed the existing intelligence-driven platoon system; ordinary target allocation leaves scouts free to explore.
- **Reliable harvesters:** v2.2 corrected resource collection when deposits were blocked by structures or water, including recovery from stalled destinations. Fog history is cleared when a new skirmish starts.
- **Nine-scenario balance laboratory:** `npm run balance` simulates all three maps at recruit, standard and veteran difficulties for four minutes each. CI archives its JSON results and checks for invalid economy, entities, projectiles, queues and unexplored enemy starts. These are scripted scenarios, not real-world win rates.
- **Save compatibility:** existing v1 browser save key/schema remain unchanged. Patrol progress is stored on entities and older saves load with safe defaults.

See [v2.3 release notes](docs/RELEASE-2.3.md) and [v2.1 tactical release notes](docs/RELEASE-2.1.md). Rendered tank sprites and other original art remain in progress; most full game features are still unfinished.

## v2.1 Tactical Focus Fire

- **Coordinated defense:** the AI now distributes available fighters across separately observed base threats without giving one unit conflicting instructions in the same strategy tick.
- **Priority-based local targeting:** nearby visible threats are ranked using faction-balanced weapon damage, threat distance, target health and estimated overkill.
- **Fog-honest engagements:** computer-controlled units break direct target locks when a hostile disappears from sight, instead of tracking invisible live locations.
- **Wounded reserve:** badly injured AI fighters stay out of offensive groups through their recovery cooldown unless their health improves; no free healing is added.
- New [v2.1 regression tests](tests/targeting-v21.test.mjs) and [release notes](docs/RELEASE-2.1.md).

## v2.0 AI Reinforcements & Wounded Retreats

- **Two independent offensive platoons:** a primary force and a secondary support group can assemble at separate staging areas and launch coordinated attack-moves toward previously scouted enemy buildings.
- **No stolen members or omniscient attacks:** support troops exclude units already committed to the first platoon, and neither squad receives targets that the AI has never observed.
- **Wounded withdrawal:** critically damaged enemy combat units can retreat toward a reachable friendly shelter when threatened by visible hostiles; no free health regeneration is applied.
- **Compatible saves:** optional support-platoon state and wounded cooldowns survive local save/load; older snapshots and invalid optional data are safely handled.
- [v2.0 release notes](docs/RELEASE-2.0.md) | [Multiple-platoon and retreat tests](tests/multi-platoon-v20.test.mjs).

## v1.9 Coordinated AI Platoons

- **Rally before assaulting:** the opposing army now assembles up to five combat units into a persistent squad with unique walkable rally positions, launching together once enough units arrive.
- **Fog-limited objectives:** offensive groups only target previously scouted hostile structures, using last-observed locations rather than invisible live enemy positions.
- **Defensive response:** visible raiders approaching AI structures interrupt staging and draw nearby defenders.
- **Compatible saves:** squad phase, target reports and rally slots are stored in local skirmish saves, with malformed and historical optional data handled safely.
- [v1.9 release notes](docs/RELEASE-1.9.md) | [AI platoon regression tests](tests/platoons-v19.test.mjs).

## v1.8 Fair Chokepoint Traffic

- **Narrow-lane reservations:** opposite-direction units queue outside detected straight one-tile corridors instead of entering while the other direction holds the lane.
- **Bounded convoy turns:** a current lane direction can admit up to three units once traffic from the other direction is waiting, then the oldest waiting direction gets the next turn after the corridor clears.
- **Manual command overrides:** direct movement and stance orders clear stale queue requests. Queued friendlies show a blue ring and a waiting count appears in the performance HUD.
- **Existing save compatibility:** lane reservations are rebuilt at runtime and not carried as stale locks across loaded matches.
- [v1.8 release notes](docs/RELEASE-1.8.md) and [lane arbitration tests](tests/lanes-v18.test.mjs). Winding passages and full traffic reservation are still future work.

## v1.7 Reliable Production Deployment

- **Safe exits:** completed units now search for a clear nearby deployment point instead of spawning at a fixed offset inside water, buildings or parked units.
- **Blocked queues are retained:** a finished order waits at 100% for a free exit; destroyed production buildings pause paid orders until rebuilt.
- **Clear feedback:** the production queue shows **EXIT BLOCKED** or **PRODUCER OFFLINE**, and the full refund option remains available.
- **Existing saves:** no schema migration; queued orders survive browser save/load and both sides use the same exit rules.
- [v1.7 release notes](docs/RELEASE-1.7.md) | [Safe deployment regression tests](tests/production-v17.test.mjs).

## v1.6 Squad Right-of-Way

- **Friendly passing priorities:** ore harvesters, heavy vehicles, tanks, scouts and infantry can temporarily make room for higher-priority traffic.
- **Real side-pocket movement:** a yielding unit attempts a nearby lateral retreat that is both clear and reachable; it does not count forward movement within a one-tile corridor as yielding.
- **Original commands preserved:** when the pull-over ends, the unit returns to its existing movement order. Manually issued commands cancel yielding immediately.
- **No forced teleporting:** explicit Hold Position units and enemy combatants do not cooperate, and completely blocked corridors remain blocked when no passing pocket exists.
- **Yield indication:** a gold ring around friendly yielding units, plus an optional count in the performance readout.
- [v1.6 release notes](docs/RELEASE-1.6.md) | [Right-of-way tests](tests/right-of-way-v16.test.mjs).

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

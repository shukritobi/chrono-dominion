# Chrono Dominion — verified project status

**Last source audit:** 27 October 2026  
**Current prototype:** v2.42.0 (animated visual roster and preliminary strike aircraft; see [v2.21 art release notes](RELEASE-2.21-ART.md)).

Post-v2.42 testing: the real-engine match lab now records first AI factory/radar/tech/airfield construction and completion, as well as first aircraft queue and deployment. An extended 720-second three-faction progression matrix runs in CI without granting AI prerequisites or free resources. Missing milestones remain explicit null values rather than implied aviation success. See [AI natural progression methodology](AI-NATURAL-PROGRESSION.md).

Post-v2.42 AI construction fix: after the HQ placement ring is full, the enemy now tries legal sites around its existing operational structures, allowing tech and Air Command expansion. A three-faction regression checks real legal placement, paid construction and save/load. See [construction frontier notes](AI-CONSTRUCTION-FRONTIER.md). Real-match aviation frequency is still unverified.\n\nv2.42 scales AI Skyguard procurement from one to two batteries only when its own sensor reports contain two distinct recent aircraft contacts. Duplicate or stale reports cannot trigger escalation. Radar, power, affordability and saves are unchanged. [Regression](../tests/ai-skyguard-scaling-v242.test.mjs) · [notes](RELEASE-2.42.md).

v2.16 introduces two original unit combat-experience ranks, kill-based promotions, visible rank indicators and modest stat bonuses. CI and balance verification remain separate from the implementation. v2.15 retains surviving primary/support platoon members and rally slots after losses, and excludes wounded reserve fighters from primary recruitment. Focused runtime checks and the full [v2.15 CI verification and Pages deployment](https://github.com/shukritobi/chrono-dominion/actions/runs/40297911617) passed, including nine scripted balance scenarios. A matched before/after balance comparison remains pending.

v2.17 ranks enemy objectives using AI sensor reports and closes a support-platoon post-retreat cooldown gap. Full GitHub Actions and balance results must be checked independently.

v2.18 adds connected-ground objective filtering, bounded perimeter assault positions and timed rerouting after stalls, with tests and new launch/reroute telemetry. The [verified main-branch CI and Pages deployment](https://github.com/shukritobi/chrono-dominion/actions/runs/40302281701) passed. The nine scripted matches recorded 5/9 actual assault-launch scenarios, 1 stalled-attacker reroute, 6/9 discovered objectives, 10 scouts lost and 74.8% mean survey coverage. These do not establish human win rates.

v2.19 adds observed-only AI building focus fire, damage-aware target spread, reserved siege flanks and original tracer/shockwave drawing. The [v2.19 PR suite](https://github.com/shukritobi/chrono-dominion/actions/runs/40304543534) passed, including nine scripted matches, with 32 changed siege orders, 294 confirmed building hits, 5/9 assault launches, 12 recon losses and 74.8% mean survey coverage. Gameplay balance and real-device performance remain unverified.

Post-v2.41 testing adds a six-encounter aircraft-versus-Skyguard exercise covering all three playable factions. Unlike the nine ground-focused skirmishes, these deterministic production-engine scenarios require actual aircraft projectile hits, powered anti-air return fire, and successful unopposed airfield reloads. Results are CI artifacts, not human balance or browser FPS measurements. See [air engagement balance](AIR-ENGAGEMENT-BALANCE.md).\n\nv2.41 closes two fog-of-war leaks: unfinished friendly buildings no longer contribute exploration, and enemies on the fringe of a visible tile are not drawn, shown on radar or selectable unless the actual faction sensor radius reaches their position. The battlefield and minimap share the same per-frame detected-enemy set. See [v2.41 notes](RELEASE-2.41.md). Browser/mobile visual verification remains pending.

v2.40 adds render-only landing and takeoff transitions for aircraft returning to living friendly Air Commands. Both baked Blender and vector aircraft descend during docked servicing, with a pulsing service halo, dimmer engine glow and vector landing gear. Visual interpolation is weakly keyed to each entity and never serialized; existing ordnance, repairs, power behavior and saves are unchanged. See [v2.40 notes](RELEASE-2.40.md). Real-device rendering remains unverified.

v2.39 indexes faction-owned sight observers into transient 9-tile buckets during the movement/combat phase, reducing repeated full-roster scans during automatic target acquisition. Sensor positions update as units move, new observers are added immediately, and destroyed/unbuilt observers remain excluded. Outside combat the original live visibility check is retained. See [v2.39 notes](RELEASE-2.39.md). Real-device frame-rate measurements remain pending.

v2.38 indexes living buildings once per simulation movement phase, removing repeated full-roster scans from ground collision and narrow-lane checks. The index is discarded before subsequent production/AI updates; live health checks and out-of-tick queries preserve obstacle changes. See [v2.38 notes](RELEASE-2.38.md). Real-device FPS gains remain unmeasured.

v2.37 builds an exact, per-request index of living building footprints for A*, connected-area flood-fill and formation slot selection. This removes per-tile scans of every entity while preserving fractional footprint boundaries, water, custom walkability hooks and immediate obstacle updates on later orders. See [v2.37 notes](RELEASE-2.37.md). CI and real-device frame-time measurements remain separate.

v2.36 caches passability only within each A* and connected-area formation search, eliminating redundant walkability probes without stale navigation after obstacle changes. The XL regression checks per-query probe counts, dynamic barriers, connected formations and historical saves. See [v2.36 notes](RELEASE-2.36.md). CI and real-device performance remain separately verifiable.

v2.35 fixes an XL-map pathfinding ceiling: A* now budgets unique visited cells proportional to battlefield area instead of a fixed 1,450 heap removals. The deterministic 48×48 serpentine-maze regression requires a complete reachable route and verifies no corner clipping, unreachable fallback, legacy paths and save compatibility. See [v2.35 notes](RELEASE-2.35.md). CI and physical-device performance remain separately verifiable.

v2.34 requires both factions' automatic unit target acquisition to respect live shared sensor visibility, including aggressive and attack-move orders. Manual player attack orders remain supported. Regression coverage checks hidden targets, shared scouts, loss of spotting and save/load. See [v2.34 notes](RELEASE-2.34.md).

v2.33 routes aircraft returning for ammunition or repairs to safer friendly airfields using owner-only observed defenses, pins the selected pad to prevent oscillation, and switches to another operational pad if it is destroyed. Old saves without an assigned pad remain loadable. See [v2.33 notes](RELEASE-2.33.md).

v2.32 adds an air-only Skyguard battery for all three factions with original animated vector art, honest targeting and capped AI production from observed aircraft reports. Aircraft routing recognizes observed Skyguard threats; ground scouts ignore air-only guns. CI and balance verification must be checked independently. See [v2.32 notes](RELEASE-2.32.md).

v2.31 releases aircraft after prolonged unpowered airfield service, retaining its previous mission. See [v2.31 notes](RELEASE-2.31.md).

v2.30 adds AI-only emergency aircraft withdrawal at 30% hull, with paid airfield servicing to 75% hull, mission restoration, no-credit and destroyed-airfield release, and a 40-second retry cooldown. It uses the existing owner-specific air return routing. New regression coverage is in [v2.30 notes](RELEASE-2.30.md). CI and physical-device verification must be checked independently.

v2.29 adds paid, power-gated hull repairs during existing aircraft rearming: 12 HP/second at ¤0.75/HP, capped by owner credits and max HP. Aircraft with full ammunition do not automatically return just for repair. No new serialized fields; focused regression and CI results require verification. See [v2.29 notes](RELEASE-2.29.md).

v2.28 adds bounded return-flight detours around previously reported defenses and includes Energy Towers in scout threat costs. Owner-specific sensor reports prevent hidden enemy tracking; no save migration is required. Focused runtime checks passed, with CI and Pages confirmation pending. See [v2.28 notes](RELEASE-2.28.md).

v2.27 gives existing turrets and energy towers detected-aircraft priority and prevents towers from shooting unseen enemies. Energy Towers gain a 50% bonus against aircraft; tests cover visibility, power, damage and saves. Full CI and Pages deployment need independent verification. See [v2.27 notes](RELEASE-2.27.md).

v2.26 adds finite four-shot aircraft ammunition and automatic powered-airfield rearming, with resumed missions, AI rearm exclusion, historical-save fallback and dedicated tests. Focused mock-DOM runtime checks passed; GitHub Actions and deployment need independent confirmation. See [v2.26 notes](RELEASE-2.26.md).

v2.25 adds bounded AI Air Command construction, paid aircraft recruitment and a separate fog-honest air wing. A focused JavaScript runtime check exercised production, hidden-target protection, air defense, ground-platoon exclusion and legacy save/load. Full GitHub Actions verification and live deployment require independent confirmation.

v2.23 flight-layer formation commands now split aircraft and ground selections, preserving connected terrain slots for ground units while aircraft can receive over-water orders. Regression coverage is in `tests/air-formations-v223.test.mjs`; CI and real-device verification must be checked independently.

v2.22 adds the selectable 48×48 Frontier XL battlefield, size-aware fog/navigation and mouse-drag/touch camera controls. CI and Pages results require independent verification.

This status describes committed code and automated coverage. It does **not** imply comprehensive manual browser playtesting.

v2.14's forward-frontier scoring has passed the full GitHub Actions gate, recording 6/9 actual enemy-building discoveries, 4/9 platoon staging cases, 11 scout losses and 73.7% mean AI survey coverage in nine deterministic 240-second scenarios. These results improve on the v2.12 scripted baseline but are not representative human win rates.

v2.13 aligns scout movement with safe A* detours, adding a fallback search for longer routes around known defended tiles. Automated route and save tests were added, but CI and full-balance improvements must be independently verified.

v2.12 adds bounded sensor-only emergency scout evasion when remembered defenses intercept a scout; escape is not guaranteed. v2.11 adds sensor-only whole-route danger weights for AI scouts, rejects known defended chokepoints, and adds movement/path regression tests. The V8 headless 240-second matrix completed, but CI and real-device verification must be checked independently.

v2.10 adds sensor-report-based scout threat avoidance, mid-patrol replanning, retreat-cooldown protection, and reconnaissance telemetry in the nine-scenario balance lab. Its regression test is included in CI; v2.11 extends route safety using remembered threats.

v2.9 adds coarse-pointer command targets, compact sidebar CSS and a visible cancel button for pending build/attack-move/Chrono Jump orders, with automated stylesheet and behavior tests; real-device verification remains outstanding.

v2.20 restores primary/support rally movement after tactical interruptions, without overriding visible engagements or rewriting active paths. The recovery count is transient and included in the nine-scenario report. See [v2.20 release notes](RELEASE-2.20.md).

## Implemented in the repository

- Static HTML/CSS/JavaScript browser skirmish with three playable faction palettes and three maps (Verdant Front, Ashen Basin, Frostline).
- Building construction, prerequisites, power, harvesting, unit queues, repair, sales, combat, specialist abilities, fog of war, radar, match results and copyable battle report.
- Unit selection, control groups, formations, stances, attack-move, navigation around terrain, traffic avoidance and narrow-lane yielding. A player reconnaissance HUD shows surveyed map coverage and contact history. An expandable tactical event history records friendly building damage and observed base threats.
- Two-stage AI squad coordination, tactical target allocation, scouting, saved intelligence, wounded-unit retreats and map-wide reconnaissance patrols. Dynamic scout frontier points supplement fixed map landmarks.
- Save/load through browser local storage with the original `chrono-dominion-skirmish-v1` key.
- Original SVG art pilots, procedural 32-direction tank and turret atlases, animated high-definition vector infantry/vehicles/buildings, basic flying strike aircraft, directional metadata and synthesized sound effects.
- A Map Forge editor, built-in custom map support and source map catalog.
- GitHub Actions verification and Pages deployment, with automated regression tests and a nine-scenario, three-map/three-difficulty headless balance lab.

## Verified by automated checks

- Syntax checks and regression tests cover basic play, economy, abilities, saving, navigation, traffic, queues, AI platoons, tactical visibility, map editing and scouting.
- v2.2 includes fresh fog on new matches, harvester recovery when ore is blocked or unreachable, and a balance-lab JSON report.
- v2.3 tests scout waypoints, blocked paths, honest sensor-based intelligence, resulting platoon plans and save compatibility. v2.4 tests adaptive AI terrain-memory survey. v2.5 tests player-side scouting HUD, last-known contact camera jumps and proximity alert cooldown. v2.6 adds projectile and specialist damage alerts, critical/destroyed structure events, event-map jumps, save migration and HTML-escaping regressions. v2.7 adds sampled explored-terrain frontiers, bounded path checks, map discovery benchmarks and coordinated scout separation. v2.8 tests two-finger pinch anchor, panning, touch cancellation, selection compatibility and save/load gesture reset.
- A successful GitHub Actions run is the authoritative confirmation that the current commit passed CI. A Pages deploy job confirms publication; it is not proof of all-browser or mobile behavior.

## Planned, incomplete or placeholder

- The **308-family asset register** is a plan, not 308 completed sprites. `art/rendered/manifest.json` still has no packed PNG atlases, but `art/baked-v1/manifest.json` now describes original Blender-baked unit and building sheets. Asset integration and final coverage must be validated separately.
- Many Blender source models and baked sheets now exist, but final packed frame atlases, detailed infantry death animations, destroyed-building models, environment variations and a complete soundtrack remain unfinished. Runtime vector infantry walking and building activity animations are available.
- Aircraft have first-pass ammunition, proximity rearming and render-only landing/takeoff transitions, but fuel, dogfighting and final Blender-baked dedicated anti-air atlases are not implemented. First-pass dedicated Skyguard defenses now operate with original animated vector art. Naval warfare, garrisons, advanced mind-control chains, country-specific units, superweapons, campaigns, multiplayer and replays remain unimplemented.
- AI reconnaissance samples explored tiles near uncharted territory while retaining landmark patrol fallback. v2.11 prices whole scout routes using last-known threats, but cannot predict unknown enemy ambushes, optimize long-term territory ownership or guarantee scout safety. Battle balance remains provisional; the headless player is scripted and not a human substitute.
- Two-finger pinch and camera pan are implemented, but mobile UI layout, low-end device performance, accessibility and long-session browser testing require hands-on verification.
- No third-party proprietary game artwork, audio or code is included. The project's redistribution license is still undecided.

## Next development priorities

1. Compare v2.19 and v2.20 assault launches and rally recovery under identical scripted scenarios; validate real-player battle pacing.
2. Add a measurable objective-discovery benchmark and tune AI squad staging on difficult maps.
3. Convert the new animated vector classes to production-quality original Blender/atlas sources; profile performance and refine aircraft combat.
4. Improve touch-first selection feedback, responsive sidebar controls and browser accessibility.
5. Expand the original factions and their gameplay systems before campaign or multiplayer scope.

## Developer commands

`npm test` runs regression checks. `npm run balance` runs nine scripted 240-second scenarios. `npm run balance:full` runs a longer diagnostic matrix. The source of truth for active CI commands is `.github/workflows/deploy.yml`.

See [latest release notes](RELEASE-2.19.md), [full blueprint](game-design/FULL-BLUEPRINT.md), and [asset production plan](asset-production/ASSET-PRODUCTION-PLAN.md).

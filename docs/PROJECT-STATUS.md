# Chrono Dominion — verified project status

**Last source audit:** 26 October 2026  
**Current prototype:** v2.19.0 (see `package.json`, `game.js` and [v2.19 release notes](RELEASE-2.19.md)).

v2.16 introduces two original unit combat-experience ranks, kill-based promotions, visible rank indicators and modest stat bonuses. CI and balance verification remain separate from the implementation. v2.15 retains surviving primary/support platoon members and rally slots after losses, and excludes wounded reserve fighters from primary recruitment. Focused runtime checks and the full [v2.15 CI verification and Pages deployment](https://github.com/shukritobi/chrono-dominion/actions/runs/40297911617) passed, including nine scripted balance scenarios. A matched before/after balance comparison remains pending.

v2.17 ranks enemy objectives using AI sensor reports and closes a support-platoon post-retreat cooldown gap. Full GitHub Actions and balance results must be checked independently.

v2.18 adds connected-ground objective filtering, bounded perimeter assault positions and timed rerouting after stalls, with tests and new launch/reroute telemetry. The [verified main-branch CI and Pages deployment](https://github.com/shukritobi/chrono-dominion/actions/runs/40302281701) passed. The nine scripted matches recorded 5/9 actual assault-launch scenarios, 1 stalled-attacker reroute, 6/9 discovered objectives, 10 scouts lost and 74.8% mean survey coverage. These do not establish human win rates.

v2.19 adds observed-only AI building focus fire, damage-aware target spread, reserved siege flanks and original tracer/shockwave drawing. CI and match results must be verified before claiming deployment or balance gains.

This status describes committed code and automated coverage. It does **not** imply comprehensive manual browser playtesting.

v2.14's forward-frontier scoring has passed the full GitHub Actions gate, recording 6/9 actual enemy-building discoveries, 4/9 platoon staging cases, 11 scout losses and 73.7% mean AI survey coverage in nine deterministic 240-second scenarios. These results improve on the v2.12 scripted baseline but are not representative human win rates.

v2.13 aligns scout movement with safe A* detours, adding a fallback search for longer routes around known defended tiles. Automated route and save tests were added, but CI and full-balance improvements must be independently verified.

v2.12 adds bounded sensor-only emergency scout evasion when remembered defenses intercept a scout; escape is not guaranteed. v2.11 adds sensor-only whole-route danger weights for AI scouts, rejects known defended chokepoints, and adds movement/path regression tests. The V8 headless 240-second matrix completed, but CI and real-device verification must be checked independently.

v2.10 adds sensor-report-based scout threat avoidance, mid-patrol replanning, retreat-cooldown protection, and reconnaissance telemetry in the nine-scenario balance lab. Its regression test is included in CI; v2.11 extends route safety using remembered threats.

v2.9 adds coarse-pointer command targets, compact sidebar CSS and a visible cancel button for pending build/attack-move/Chrono Jump orders, with automated stylesheet and behavior tests; real-device verification remains outstanding.

## Implemented in the repository

- Static HTML/CSS/JavaScript browser skirmish with three playable faction palettes and three maps (Verdant Front, Ashen Basin, Frostline).
- Building construction, prerequisites, power, harvesting, unit queues, repair, sales, combat, specialist abilities, fog of war, radar, match results and copyable battle report.
- Unit selection, control groups, formations, stances, attack-move, navigation around terrain, traffic avoidance and narrow-lane yielding. A player reconnaissance HUD shows surveyed map coverage and contact history. An expandable tactical event history records friendly building damage and observed base threats.
- Two-stage AI squad coordination, tactical target allocation, scouting, saved intelligence, wounded-unit retreats and map-wide reconnaissance patrols. Dynamic scout frontier points supplement fixed map landmarks.
- Save/load through browser local storage with the original `chrono-dominion-skirmish-v1` key.
- Original SVG art pilots, procedural isometric tank and turret renderers, directional rendering metadata and synthesized sound effects.
- A Map Forge editor, built-in custom map support and source map catalog.
- GitHub Actions verification and Pages deployment, with automated regression tests and a nine-scenario, three-map/three-difficulty headless balance lab.

## Verified by automated checks

- Syntax checks and regression tests cover basic play, economy, abilities, saving, navigation, traffic, queues, AI platoons, tactical visibility, map editing and scouting.
- v2.2 includes fresh fog on new matches, harvester recovery when ore is blocked or unreachable, and a balance-lab JSON report.
- v2.3 tests scout waypoints, blocked paths, honest sensor-based intelligence, resulting platoon plans and save compatibility. v2.4 tests adaptive AI terrain-memory survey. v2.5 tests player-side scouting HUD, last-known contact camera jumps and proximity alert cooldown. v2.6 adds projectile and specialist damage alerts, critical/destroyed structure events, event-map jumps, save migration and HTML-escaping regressions. v2.7 adds sampled explored-terrain frontiers, bounded path checks, map discovery benchmarks and coordinated scout separation. v2.8 tests two-finger pinch anchor, panning, touch cancellation, selection compatibility and save/load gesture reset.
- A successful GitHub Actions run is the authoritative confirmation that the current commit passed CI. A Pages deploy job confirms publication; it is not proof of all-browser or mobile behavior.

## Planned, incomplete or placeholder

- The **308-family asset register** is a plan, not 308 completed sprites. `art/rendered/manifest.json` currently has no packed PNG atlases and explicitly enables fallback artwork.
- Most final 3D source models, animation frames, infantry animation sets, building destruction effects, environment variations and soundtrack remain unfinished.
- Aircraft, naval warfare, garrisons, advanced mind-control chains, veterancy, country-specific units, superweapons, campaign missions, multiplayer and replay support remain unimplemented.
- AI reconnaissance samples explored tiles near uncharted territory while retaining landmark patrol fallback. v2.11 prices whole scout routes using last-known threats, but cannot predict unknown enemy ambushes, optimize long-term territory ownership or guarantee scout safety. Battle balance remains provisional; the headless player is scripted and not a human substitute.
- Two-finger pinch and camera pan are implemented, but mobile UI layout, low-end device performance, accessibility and long-session browser testing require hands-on verification.
- No third-party proprietary game artwork, audio or code is included. The project's redistribution license is still undecided.

## Next development priorities

1. Confirm v2.13 CI/deployment and compare scout survival, objective discovery and route-planning cost under identical nine-scenario settings.
2. Add a measurable objective-discovery benchmark and tune AI squad staging on difficult maps.
3. Produce and integrate original rendered unit/structure atlases with animation and proper art provenance.
4. Improve touch-first selection feedback, responsive sidebar controls and browser accessibility.
5. Expand the original factions and their gameplay systems before campaign or multiplayer scope.

## Developer commands

`npm test` runs regression checks. `npm run balance` runs nine scripted 240-second scenarios. `npm run balance:full` runs a longer diagnostic matrix. The source of truth for active CI commands is `.github/workflows/deploy.yml`.

See [latest release notes](RELEASE-2.19.md), [full blueprint](game-design/FULL-BLUEPRINT.md), and [asset production plan](asset-production/ASSET-PRODUCTION-PLAN.md).

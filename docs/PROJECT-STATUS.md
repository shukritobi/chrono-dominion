# Chrono Dominion — verified project status

**Last source audit:** 26 October 2026  
**Current prototype:** v2.11.0 (see `package.json`, `game.js` and [v2.10 release notes](RELEASE-2.11.md)).

This status describes committed code and automated coverage. It does **not** imply comprehensive manual browser playtesting.

v2.11 adds sensor-only whole-route danger weights for AI scouts, rejects known defended chokepoints, and adds movement/path regression tests. The V8 headless 240-second matrix completed, but CI and real-device verification must be checked independently.\n\nv2.10 adds sensor-report-based scout threat avoidance, mid-patrol replanning, retreat-cooldown protection, and reconnaissance telemetry in the nine-scenario balance lab. Its regression test is included in CI; full-route safety remains incomplete.

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

1. Compare v2.10/v2.11 scout survival and objective discovery on identical settings; profile threat-aware path costs and improve scouting on Verdant Front and Frostline.
2. Add a measurable objective-discovery benchmark and tune AI squad staging on difficult maps.
3. Produce and integrate original rendered unit/structure atlases with animation and proper art provenance.
4. Improve touch-first selection feedback, responsive sidebar controls and browser accessibility.
5. Expand the original factions and their gameplay systems before campaign or multiplayer scope.

## Developer commands

`npm test` runs regression checks. `npm run balance` runs nine scripted 240-second scenarios. `npm run balance:full` runs a longer diagnostic matrix. The source of truth for active CI commands is `.github/workflows/deploy.yml`.

See [release history](RELEASE-2.8.md), [full blueprint](game-design/FULL-BLUEPRINT.md), and [asset production plan](asset-production/ASSET-PRODUCTION-PLAN.md).

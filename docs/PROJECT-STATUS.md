# Chrono Dominion — verified project status

**Last source audit:** 26 October 2026  
**Current prototype:** v2.6.0 (see `package.json`, `game.js` and [v2.6 release notes](RELEASE-2.6.md)).

This status describes committed code and automated coverage. It does **not** imply comprehensive manual browser playtesting.

## Implemented in the repository

- Static HTML/CSS/JavaScript browser skirmish with three playable faction palettes and three maps (Verdant Front, Ashen Basin, Frostline).
- Building construction, prerequisites, power, harvesting, unit queues, repair, sales, combat, specialist abilities, fog of war, radar, match results and copyable battle report.
- Unit selection, control groups, formations, stances, attack-move, navigation around terrain, traffic avoidance and narrow-lane yielding. A player reconnaissance HUD shows surveyed map coverage and contact history. An expandable tactical event history records friendly building damage and observed base threats.
- Two-stage AI squad coordination, tactical target allocation, scouting, saved intelligence, wounded-unit retreats and map-wide reconnaissance patrols.
- Save/load through browser local storage with the original `chrono-dominion-skirmish-v1` key.
- Original SVG art pilots, procedural isometric tank and turret renderers, directional rendering metadata and synthesized sound effects.
- A Map Forge editor, built-in custom map support and source map catalog.
- GitHub Actions verification and Pages deployment, with automated regression tests and a nine-scenario, three-map/three-difficulty headless balance lab.

## Verified by automated checks

- Syntax checks and regression tests cover basic play, economy, abilities, saving, navigation, traffic, queues, AI platoons, tactical visibility, map editing and scouting.
- v2.2 includes fresh fog on new matches, harvester recovery when ore is blocked or unreachable, and a balance-lab JSON report.
- v2.3 tests scout waypoints, blocked paths, honest sensor-based intelligence, resulting platoon plans and save compatibility. v2.4 tests adaptive AI terrain-memory survey. v2.5 tests player-side scouting HUD, last-known contact camera jumps and proximity alert cooldown. v2.6 adds projectile and specialist damage alerts, critical/destroyed structure events, event-map jumps, save migration and HTML-escaping regressions.
- A successful GitHub Actions run is the authoritative confirmation that the current commit passed CI. A Pages deploy job confirms publication; it is not proof of all-browser or mobile behavior.

## Planned, incomplete or placeholder

- The **308-family asset register** is a plan, not 308 completed sprites. `art/rendered/manifest.json` currently has no packed PNG atlases and explicitly enables fallback artwork.
- Most final 3D source models, animation frames, infantry animation sets, building destruction effects, environment variations and soundtrack remain unfinished.
- Aircraft, naval warfare, garrisons, advanced mind-control chains, veterancy, country-specific units, superweapons, campaign missions, multiplayer and replay support remain unimplemented.
- AI exploration ranks coverage over preset sector waypoints but does not plan arbitrary map frontiers. Battle balance remains provisional; the headless player is scripted and not a human substitute.
- Mobile touch usability, low-end device performance, accessibility and long-session browser testing require hands-on verification.
- No third-party proprietary game artwork, audio or code is included. The project's redistribution license is still undecided.

## Next development priorities

1. Review full-simulation reports and improve AI scouting survival, combat initiative and realistic victory rates without hidden-state cheating.
2. Add a measurable objective-discovery benchmark and tune AI squad staging on difficult maps.
3. Produce and integrate original rendered unit/structure atlases with animation and proper art provenance.
4. Improve touch-first selection, camera movement, responsive controls and browser accessibility.
5. Expand the original factions and their gameplay systems before campaign or multiplayer scope.

## Developer commands

`npm test` runs regression checks. `npm run balance` runs nine scripted 240-second scenarios. `npm run balance:full` runs a longer diagnostic matrix. The source of truth for active CI commands is `.github/workflows/deploy.yml`.

See [release history](RELEASE-2.6.md), [full blueprint](game-design/FULL-BLUEPRINT.md), and [asset production plan](asset-production/ASSET-PRODUCTION-PLAN.md).

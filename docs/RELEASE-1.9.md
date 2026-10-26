# Chrono Dominion v1.9.0 - Coordinated AI Platoons

**Date:** 26 October 2026
**Status:** Original single-player RTS browser prototype.

## Playable changes

### Assemble, then attack

- The enemy commander now forms **platoons of up to five combat units**, excluding harvesters and independently scouting recon vehicles.
- The AI needs a **previously scouted enemy building report** before organizing an offensive platoon. Enemy positions behind fog of war are not magically revealed.
- The game sets different launch thresholds by difficulty: Recruit (5 fighters, from 85 seconds), Standard (3 fighters, from 57 seconds), Veteran (2 fighters, from 38 seconds).
- Once a valid target has been observed, a platoon gets **unique, walkable rally positions** ahead of its current force.
- Members keep those movement orders across AI ticks. When at least 70% assemble, the group advances together using **attack-move** orders, with existing reachable-flank logic. If staging exceeds 22 seconds, a majority can begin the assault.
- Platoon phase, membership, rally positions and last-observed target coordinates are saved locally with the existing match snapshot, using validation and graceful fallback for older saves or invalid squad records.

### Base defense

- Sighted hostile units threatening the AI's own structures override the offensive rally and receive nearby defenders.
- Defense chooses close responding combat units, without requiring the entire army to abandon resource protection.
- Recon patrols, specialist active abilities, production, harvesting, power, lane queues, traffic-aware A* and the existing three factions remain supported.

## Automated checks

`tests/platoons-v19.test.mjs` verifies:
- No offensive platoon is formed from information not actually scouted.
- A known structure report produces a multi-unit rally with distinct destinations.
- Rally orders stay stable across consecutive AI cycles.
- Members only receive coordinated attack-move orders after assembling.
- A last-known objective does not follow a hidden building after it moves.
- Current platoons survive save/load; old or malformed optional platoon data is tolerated.
- A visible enemy raider near base suspends staging and triggers active defense.

The existing v1.2 fog-of-war regression now verifies the assembly-first strategy instead of assuming instantaneous solo attack-moves.

## Limitations

- The command system is a **single persistent platoon**, not a full multi-front hierarchical military AI.
- Flanks use static reachable waypoints from known reports, with no continuous battlefront analysis, focus-fire doctrine or sophisticated retreat.
- Timers and composition are an early gameplay balance, subject to playtesting.
- The game still has incomplete production-grade directional infantry and recon animations, campaigns, multiplayer and air/naval combat.

## Suggested v2.0 development

- Multiple objective-specific platoons, coordinated base defense and retreat rules.
- Additional original faction units and unit abilities.
- Automated interactive browser playtesting and stronger mobile performance measurements.
- Blender-exported directional sprite pipeline with verified rendered artwork.

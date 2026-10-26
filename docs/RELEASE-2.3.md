# Chrono Dominion v2.3 — Sector Reconnaissance

**Release date:** 26 October 2026  
**Status:** Playable single-player browser skirmish prototype, not a finished commercial RTS.

## Implemented and tested

- AI reconnaissance no longer circles ore sites indefinitely. Scouts visit public, fixed map-sector landmarks, followed by known ore landmarks, using the existing A* pathfinder.
- Scouts skip water, blocked cells, disconnected destinations and waypoints already reached. They do not target hidden enemy entities or use enemy position data to select patrol destinations.
- Recon uses a movement order instead of automatically attack-moving into every enemy it meets. Ordinary coordinated fire allocation reserves scouts for exploration; existing emergency harvester-defense and retreat behaviors remain.
- When a scout actually sees a hostile structure, the existing intelligence-memory system can record its last-seen coordinates. Normal primary and support platoon logic can then use that verified report to stage attacks.
- New `tests/recon-v23.test.mjs` covers blocked routes, unseen-base privacy, actual contact, subsequent platoon planning, reconnaissance combat assignment, and save/load of patrol progress.
- Existing v2.2 work remains: fresh fog on restart, AI defense targeting limited to visible threats, reachable ore selection, harvester stall recovery and nine-scenario headless balance checks.
- CI runs the full v2.3 regression and a 240-second scripted skirmish on each combination of three maps and three difficulties, archiving a JSON report when Actions permits.

## Limitations and work still needed

- A scripted balance-lab player is **not** a human-playtest proxy. Its behavior is deliberately simple, so results are regression indicators rather than fairness or competitive win-rate statistics.
- AI exploration uses a static sector route. It does not yet score unexplored fog cells or coordinate multiple scouts intelligently.
- AI formations can still be interrupted by combat, traffic and blocked rally points. Campaign AI and multiplayer remain unimplemented.
- Actual browser testing across touch devices and low-end GPUs is still required.
- The 308-family asset register is a production plan, not a set of 308 completed sprites. Rendered PNG atlases remain fallback-only, with most final animations, air/naval units, music and advanced abilities unfinished.

## Developer verification

Run `npm test` for the complete test suite, `npm run balance` for nine four-minute simulated skirmishes, and `npm run balance:full` for a longer diagnostic sweep. GitHub Actions must pass before the verified Pages deployment.

**Compatibility:** Browser save key and schema remain `chrono-dominion-skirmish-v1`. New scout state is optional on older saves, and no existing saved data is intentionally invalidated.

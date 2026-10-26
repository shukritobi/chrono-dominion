# Chrono Dominion v1.6.0 — Squad Right-of-Way

**Date:** 26 October 2026  
**Status:** Original free-to-play, single-player browser RTS prototype.

## Gameplay implementation

### Predictable right-of-way for friendly units

The existing v1.5 pathfinder can route around static water, buildings and nearby traffic. This release adds a **local right-of-way protocol** when friendly units block one another.

- **Harvester priority:** loaded ore harvesters receive the highest passing priority to help avoid blocking resource delivery.
- Other vehicle and infantry roles follow a deterministic priority order: heavy vehicles, tanks, scouts, specialists and infantry. Equal-priority ties use stable unit IDs.
- If a moving unit is blocked by a friendly unit for a short time, it can request a temporary pull-over manoeuvre.
- **Side pockets only:** the yielding unit checks alternate lateral positions, chooses a clear and terrain-reachable destination and walks there. Moving forward or backward within the same single-width lane is not treated as a passing pocket.
- A yielding unit temporarily suspends, **but does not erase**, its current order. On reaching the pocket or hitting the four-second yielding timeout, normal orders resume.
- A brief cooldown prevents the same pair from repeatedly triggering identical pull-over orders.
- Units with an explicit **Hold Position** stance do not voluntarily yield.
- Hostile units never cooperate with each other to clear the player's route. Courtesy yielding applies to **friendlies only**.
- Direct player movement orders and Stop/Guard/Hold/Aggressive controls override temporary yielding immediately.

### On-screen feedback

- Friendly yielding units receive a small gold outline for the duration of their pull-over.
- The existing FPS/unit-counter HUD also reports total in-match yielding events after the first event occurs.

## Automated verification

The new `tests/right-of-way-v16.test.mjs` checks:
1. Loaded harvesters outrank friendly infantry.
2. Lower-priority blockers receive a side-pocket destination and physically move aside before their original orders resume.
3. Repeated requests are suppressed while an active yield is pending.
4. Units ordered to Hold Position do not yield.
5. Hostile combatants cannot request co-operative friendly right-of-way.
6. An impossibly narrow water corridor correctly refuses to invent a passing pocket or teleport units.
7. Local browser saves preserve temporary yielding and the original underlying order; loading restores it safely.
8. A newly issued movement order or Stop action cancels any previous temporary yield immediately.

GitHub Actions runs this suite after all earlier core engine, art, economy, specialist, skirmish, save, AI, map editor, traffic and navigation tests.

## Known limitations

- This is **opportunistic local yielding**, not a full multi-agent right-of-way reservation scheduler.
- A completely enclosed one-cell bottleneck may remain blocked if neither unit can reach a legal passing pocket. The system refuses to teleport or push units through walls.
- Detection depends on current local positions and proximity. Large armies may still encounter congestion or occasional oscillation in crowded base layouts.
- No campaign, multiplayer, comprehensive tech tree, air/naval simulation or production-quality sprite animation atlases yet.
- Vehicle models and source art remain a mixture of original procedural directional frames and single-facing SVG pilot art.

## Next milestones

- Add a bounded lane reservation/queue model for tight passages, with congestion telemetry and deterministic head-on tests.
- Improve AI platoon coordination and retreat under threat.
- Expand combat audio and attack effects while preserving mobile performance.
- Produce original multidirectional movement animations from the Blender asset source pipeline, with source verification and rendered assets.

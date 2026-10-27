# Sensor-aware AI ore deposit selection

**28 October 2026 · gameplay version 2.42.0 · no save-schema change.**

## Problem and scope

The AI harvester previously chose the nearest physically reachable ore pile, even when a visible enemy combat unit or armed defense was guarding that deposit. In contested skirmishes this could send a fragile, income-critical harvester directly toward an observed threat. Earlier automatic retreat experiments reduced economic performance, so this change does **not** add retreats, cancel cargo, or override the existing delivery cycle.

## Behavior

Every normal six-second ore re-scan, the AI harvester ranks reachable deposits by distance plus an eight-tile penalty for a deposit within five tiles of an **actually visible** hostile combat unit or six tiles of an **actually visible** armed structure. Only live, built threats count. Hidden enemies, stale sightings, enemy harvesters, unarmed buildings and friendly entities do not affect risk. The score is a preference, not a prohibition: a nearer contested deposit still wins if the alternative is too distant, and an unreachable safer deposit is skipped by existing pathfinding. Existing ore exhaustion, temporary blocked-deposit avoidance, refinery return, cargo delivery and player harvester logic are unchanged.

The danger scan uses the engine's existing `sideCanSee` sensor test rather than direct enemy positions or omniscient map knowledge. It runs only when selecting an ore target, not on every movement frame. The change does not create persistent state or alter assets, unit costs, production or saves.

## Verification and limits

`node tests/ai-harvester-ore-safety.test.mjs` exercises all three factions against visible infantry, hidden infantry, detected turrets, multiple threats, unreachable safe alternatives, player harvester parity and save/load. The existing `ore-reachability-v22` suite still checks actual terrain and stalled-deposit behavior. CI also runs the nine-scenario and 720-second natural-match laboratories, which should be compared to the unchanged baseline before attributing improvements to this heuristic.

**Not claimed:** improved aircraft production, fewer harvester deaths in every map, or mobile performance. This is a bounded ore-destination choice, not full route threat avoidance or active harvester retreat. Follow up by comparing delivery gaps, ore income, losses and aviation milestones across the same seeded scenarios.

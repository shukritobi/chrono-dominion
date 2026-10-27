# AI harvester safety during observed attacks

**27 October 2026 · gameplay version 2.42.0; save schema remains v1.**

## Source finding

The ore economy previously sent AI harvesters to the closest reachable deposit even when a hostile combat unit was currently visible there. Trucks also continued harvesting while a detected attacker was within 4.5 tiles, risking the only income stream needed to rebuild radar, factories and aircraft infrastructure. Recon escorts already respond to endangered harvesters; this change adds a complementary worker-level survival response.

## Behavior

AI harvesters now reject ore deposits within 3.8 tiles of **currently sensor-visible** hostile combat units. They still use the existing reachable-path test and temporary blocked-deposit exclusions. They do not inspect hidden enemies or stale intelligence when choosing ore.

When a combat unit is visibly within 4.5 tiles of an AI harvester that has lost at least 15% of its hull, the truck heads toward its nearest operational refinery. It continues toward safety for up to 16 game seconds after contact breaks, avoiding rapid back-and-forth movement. Once near the refinery it can deposit its actual partial load, crediting exactly that amount and recording the delivered ore. It can resume normal harvesting after the danger clears. No free ore, automatic repair, unit buffs or extra production are introduced.

The retreat timer is held in a transient WeakMap, not in the entity or saved game. Existing v1 saves, player harvester controls and original art are unchanged.

## Verification and limitations

`node tests/ai-harvester-safety.test.mjs` exercises all three factions, visible attack retreat, preserving and delivering partial cargo, preventing duplicate credits, danger-aware ore choice, hidden-enemy fog honesty and legacy save/load. CI also runs the nine-scenario ground matrix and three extended progression matches to expose unintended economy regressions.

This does not prove improved natural aviation frequency, nor does it guarantee survival if an enemy reaches the refinery. Compare delivered ore, operational radar and aircraft milestones in future longer matches before changing other economic priorities.

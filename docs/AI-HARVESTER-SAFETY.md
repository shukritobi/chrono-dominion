# AI harvester survival — observed-threat evasion

**Date:** 27 October 2026. **Game version:** 2.42.0 (post-release incremental fix).

## Problem and scope

The production-engine 720-second progression lab still reports zero naturally deployed AI aircraft. Earlier diagnostics show harvesters and radar can be lost, collapsing late-game income. Prior investment-threshold changes alone did not solve the issue.

An AI ore harvester previously followed its ore/refinery route even when **critically damaged below 35% health with a currently visible armed enemy within 4.5 tiles**. This change makes the wounded truck temporarily seek a reachable point away from the observed threat, preferring the safe side of a friendly operational refinery or HQ. It uses the same navigation, building collision, terrain and sensor rules as other units. It does **not** consult unseen enemy positions, grant resources or alter player harvesting.

A cached escape destination is rechecked at most every five game seconds, avoiding expensive pathfinding on every frame. After the truck exits the immediate 4.5-tile danger radius, it holds its safe destination for up to four game seconds while the same armed attacker remains visible within eight tiles; this prevents an immediate U-turn into the ambush. Once the attacker dies, disappears from friendly sensor coverage or leaves the hold radius, the transient plan is discarded and normal harvesting resumes. The existing ore-skip cooldown avoids immediately re-entering the ambushed deposit. If no safe reachable escape point exists, the existing harvesting behavior is retained rather than teleporting the unit.

## Verification and limitations

Run `node tests/ai-harvester-evasion.test.mjs` for all three factions: sensor-visible attacker, actual retreat movement, ore avoidance, threat disappearance, unchanged player controls and v1 save/load. CI also runs the nine-scenario ground matrix, three 720-second natural progression matches and the controlled air lab.

An initial unconditional retreat experiment reduced total ore deliveries in the three long-match simulations (66,240 to 51,840), so the production change is restricted to critically wounded trucks. This is **not** proof of improved long-match economy or aviation. Compare progression reports and `aiAviation` diagnostics before claiming any balance improvement. Further work: protection of harvesters under sustained pursuit, escort positioning, and mixed ground/air threat evaluation on actual devices.

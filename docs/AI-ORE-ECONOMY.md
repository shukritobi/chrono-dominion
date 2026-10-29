# Early AI ore economy expansion

**27 October 2026 · gameplay version 2.42.0 (save schema unchanged).**

## Source finding

The default enemy begins with one refinery and one harvester. Before this change, the AI only bought a replacement after losing its **last** harvester; it never bought a second worker. A single ore truck limits long-term income while the AI tries to fund radar, factories, Air Command and paid aircraft. This is a source-level bottleneck, not proof that ore income alone explains the previous 0/3 natural aircraft deployments.

## Implementation

During the first 120 seconds, the enemy may queue a second harvester if it has exactly one living harvester, an operational refinery, no nearby *detected* invaders, no power shortage, no Air Command and no active Air Command saving rule. The 900-credit purchase must leave at least 650 credits for emergency power. All spending, production timing, spawn collision and harvesting use existing engine logic. The AI never buys a third living harvester through this rule, and it still replaces a destroyed final harvester even after the expansion window. The radar construction gate is also corrected from a fixed >2,600-credit requirement to its actual 900-credit price plus a 650-credit generator reserve; this prevents early harvester investment from indefinitely delaying radar technology. No new save fields, hidden information, free credits or art changes.

## Verification

`node tests/ai-ore-economy.test.mjs` covers all three factions: real credit deductions, queued and completed deployment, duplicate prevention, two-harvester cap, insufficient reserves, late-game exclusion, observed threats, brownout, Air Command saving, radar affordability and reserve, final harvester replacement and legacy save/load.

The production-engine balance and 720-second natural progression simulations additionally record `peakAIHarvesters` per scenario and `casesWithAIMultiHarvesters` in the summary. Compare those metrics with harvested ore and aviation milestones before attributing causality. Neither automated test substitutes for real-device performance or a human-played match.

## Radar recovery reserve (27 October 2026)

Natural aviation diagnostics found prolonged periods with no operational radar. After 240 seconds, the AI now preserves credits for a 900-credit radar plus the existing 650-credit generator reserve when its factory and refinery are operational, at least one harvester and tank/heavy survive, and no observed attack or brownout requires an immediate response. Optional unit production pauses below the 1,550-credit purchase threshold and while the newly purchased radar is under construction. Lost income, destroyed ground cover, local attacks and power shortages release this reserve; construction uses the normal paid placement and build timer. No free resources, new save fields or changes to original assets.

The three-faction `tests/ai-ore-economy.test.mjs` exercises banking, actual paid radar construction, construction-time protection, emergency defense, loss of the ground screen, harvester replacement and legacy save/load. Natural-match progression and survival metrics must still be compared before claiming better aircraft production.

## Pending generator duplicate protection (28 October 2026)

The AI previously selected a new generator on every planning pass during a brownout, even if a paid generator was already under construction. The planner now waits for that unfinished generator before purchasing another. It does not change ordinary unit-production priorities, save fields, power statistics or assets.

An initial broader experiment also paused optional recruitment while banking the 650-credit generator price. Although that passed targeted checks, the three 720-second natural matches lost substantial ore income (Desert: 10,440 versus 15,120 baseline; Frostline: 6,120 versus 9,000), so **the broad reserve was removed**. The merged candidate is limited to avoiding duplicate unfinished-generator purchases. The existing `tests/ai-ore-economy.test.mjs` covers all three factions, paid construction, repeated AI decisions, save/load and power recovery. CI progression and the economy regression guard must pass before merging.

## Earlier radar banking for aviation prerequisites (30 October 2026)

The prior reserve started only after 240 seconds even though Air Command becomes eligible after 130 seconds. A powered AI base with a factory, refinery, harvester and armoured defender could therefore spend its 900-credit radar budget on optional units for up to 110 seconds. The reserve now starts after 130 seconds, with the existing 1,550-credit purchase threshold and the same immediate-defense, lost-harvester, missing-armour and brownout overrides. Radar is still constructed and paid for normally, and neither saved fields nor unit costs change.

The three-faction regression now checks this 130–240-second gap, actual paid construction, preserved emergency credits and save/load. This is a targeted funding-priority hypothesis; natural-match survival and aircraft production must be compared with the pre-change CI report before claiming an improvement.

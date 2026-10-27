# Early AI ore economy expansion

**27 October 2026 · gameplay version 2.42.0 (save schema unchanged).**

## Source finding

The default enemy begins with one refinery and one harvester. Before this change, the AI only bought a replacement after losing its **last** harvester; it never bought a second worker. A single ore truck limits long-term income while the AI tries to fund radar, factories, Air Command and paid aircraft. This is a source-level bottleneck, not proof that ore income alone explains the previous 0/3 natural aircraft deployments.

## Implementation

During the first 120 seconds, the enemy may queue a second harvester if it has exactly one living harvester, an operational refinery, no nearby *detected* invaders, no power shortage, no Air Command and no active Air Command saving rule. The 900-credit purchase must leave at least 650 credits for emergency power. All spending, production timing, spawn collision and harvesting use existing engine logic. The AI never buys a third living harvester through this rule, and it still replaces a destroyed final harvester even after the expansion window. The radar construction gate is also corrected from a fixed >2,600-credit requirement to its actual 900-credit price plus a 650-credit generator reserve; this prevents early harvester investment from indefinitely delaying radar technology. No new save fields, hidden information, free credits or art changes.

## Verification

`node tests/ai-ore-economy.test.mjs` covers all three factions: real credit deductions, queued and completed deployment, duplicate prevention, two-harvester cap, insufficient reserves, late-game exclusion, observed threats, brownout, Air Command saving, radar affordability and reserve, final harvester replacement and legacy save/load.

The production-engine balance and 720-second natural progression simulations additionally record `peakAIHarvesters` per scenario and `casesWithAIMultiHarvesters` in the summary. Compare those metrics with harvested ore and aviation milestones before attributing causality. Neither automated test substitutes for real-device performance or a human-played match.

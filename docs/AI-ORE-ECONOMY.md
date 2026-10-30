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

## Paid contingency worker for a critically damaged sole harvester (30 October 2026)

A late-game AI base with exactly one living ore truck can lose its last source of income before the next scheduled replacement purchase. The ordinary second-worker expansion closes after 120 seconds, and aviation or radar saving can prevent a late backup even when the remaining worker is nearly destroyed. This is a source-level risk, not proof that it caused a specific natural-match loss.

When a **single** living worker has less than 45% hull, a completed refinery is available, the base is powered, no **currently visible** invader threatens the base and the AI has at least 1,550 credits, it can purchase one normal 900-credit backup harvester while retaining 650 for emergency power. This temporary priority takes precedence over optional radar, factory and aviation investment, but not visible base defense, generator recovery or an already occupied production queue. A healthy worker, two living workers, insufficient funds or a brownout cannot trigger the contingency. No unit costs, free income, hidden enemy information, persistent state, save schema or assets change.

`tests/ai-ore-economy.test.mjs` exercises the actual three-faction AI planner, exact spending, single queue, production deployment, existing save/load, power, observed threats, health threshold, insufficient funds and two-worker cap. Compare the full 720-second progression and economy guard before claiming any reduction in natural harvester deaths or improvement in aircraft production.


## Paid AI queue recovery after last harvester loss (30 October 2026)

A destroyed final harvester can leave the AI with less than the 900 credits needed for a replacement while another unit is already fully prepaid and waiting in production. During a safe, powered strategic decision with an operational refinery, the AI may cancel **one of its own optional paid unit queues** only when the exact refund is enough to buy a replacement harvester. The normal 900-credit replacement is then queued through the existing refinery production process. The AI never cancels a queued harvester, player production, or a queue during an observed base attack or brownout; it also does not cancel a queue if the refund would still be insufficient. The refund subtracts the original unit cost from net `creditsSpent`, so there is no free income. The existing v1 save format and unit costs are unchanged. Three-faction regression tests verify refunds, net accounting, deployment, player isolation, repeated decisions, threat and power overrides, and save/load. Natural-match improvements must be established by the progression economy gate, not inferred from these controlled cases.

## Optional infrastructure liquidation after complete ore loss (30 October 2026)

**Source hypothesis:** If an AI loses its final harvester with fewer than 900 credits and has no refundable paid unit queue, the existing queue-refund contingency cannot restore income. An optional completed factory may still hold 850 credits of resale value, enough to buy a new 900-credit harvester when the AI retains at least 50 credits. An Air Command (875 resale) or Technology Lab (1,100 resale) can also finance a replacement. This is a distinct fallback after the paid queue recovery, not a free grant.

On a safe, powered AI planning pass with a completed refinery, no surviving ore truck, no queued units, and insufficient credits for a replacement, the AI may sell **one** completed optional structure if that single 50% resale refund makes the normal harvester purchase affordable. The preference order is Technology Lab, Air Command, then War Factory. It never sells the HQ, generators, refinery, barracks or defenses; it does not sell under an observed base attack or brownout, sell incomplete structures, or interrupt paid production. The sale uses the same resale calculation and sold-building statistics as player selling, and the replacement enters the existing paid refinery queue. The lost optional building must later be rebuilt with earned credits. Save schema, unit prices, fog-of-war rules and original assets remain unchanged.

**Regression:** `tests/ai-ore-economy.test.mjs` covers all three factions, exact 50% sale proceeds and 900-credit worker charge, one-sale limit, tech-before-factory preference, no-credit-creation case, power and threat guards, queue preservation, player credit isolation, normal worker deployment and legacy save/load. **Natural-match outcome was verified in PR #156 CI (2026-10-30)**. In particular, selling a factory trades away ground production and may not help a base that has less than 50 credits or no optional structures.

### PR #156 first natural-match evidence (30 October 2026)

The complete PR CI passed the 9-scenario matrix, three 720-second natural matches, the existing AI economy regression guard, targeted three-faction tests and save/load. Compared with the immediately preceding main-branch artifact (PR #155), AI ore income changed: Verdant **4,320 → 5,040**, Desert **21,960 → 21,960**, Frostline **9,000 → 9,360**. Delivery ticks improved **98 → 101**, while harvester losses rose **4 → 5**. Only Desert produced aircraft in both runs.

The added Verdant worker died at 124.4 seconds under concentrated visible tank fire, and Verdant still finished without an operational refinery or radar. This is **partial economic recovery, not durable survival or restored aviation**. The extra worker loss and factory liquidation are material costs. Follow-up work should prioritize defending the refinery and new worker rather than claiming that one asset sale solves the underlying military collapse. These figures are deterministic headless simulation observations, not human-played browser results.


## Stranded production and combined ore recovery (30 October 2026)

**Failure mode:** An AI with no surviving harvester can have less than 900 credits tied up in a paid unit whose only production building has been destroyed. Previously, if refunding that queue *alone* would not afford a harvester, the AI kept the impossible order. That queue also blocked the existing optional-building liquidation safeguard, even when a refund **plus** one legal 50%-value sale would fund a replacement ore truck.

**Narrow correction:** While an operational refinery exists, no living harvester remains, and the AI is neither under a visible local attack nor short of power, cancel at most one AI-owned, non-harvester paid order whose producer has **no living building**. Refund exactly its unit cost and reverse the matching recorded unit expenditure. Then let the existing normal queue-refund, single-asset-sale and paid harvester production logic run unchanged. An unfinished producer counts as living and keeps its queue. Already queued harvesters and human orders are untouched. This uses no new saved state, free units, cost changes or original art.

**Regression coverage:** `tests/ai-ore-economy.test.mjs` exercises all three factions through the actual AI planner: a destroyed Barracks with a prepaid 200-credit soldier order and 100 credits can release the queue, sell one 1,100-credit Technology Lab, purchase a 900-credit harvester and retain 500 credits. It also checks net spent credits, exactly one sale, player-queue isolation, production deployment, v1 save/load, insufficient funds without a sale, unfinished producers, visible attacks and brownouts.

**Evidence limitation:** This is a reproducible deadlock repair in targeted fixtures, not proof of improved 720-second natural-match income. Compare PR and main progression artifacts, the strict economy regression gate and refinery survival before attributing a natural-match benefit. Interactive mobile and desktop verification remains pending.

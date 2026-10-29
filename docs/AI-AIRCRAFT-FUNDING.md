# AI aircraft funding after Air Command

**27 October 2026.** Post-v2.42 targeted AI economy improvement; gameplay version and save key remain unchanged.

## Verified source bottleneck

After the AI paid for an Air Command, its recruitment planner still bought reconnaissance vehicles and specialists before considering aircraft. At the same time, the optional turret branch reactivated once an airfield existed and could consume the 2,400-credit aircraft threshold. No dedicated saving rule existed after airfield purchase, so the AI repeatedly drained its economy into cheaper ground units. This explains a plausible source-level obstacle to natural aircraft deployment; it is not proof that all matches were blocked for this reason.

## Implementation

When an AI has purchased an Air Command, has a working radar, at least one surviving harvester and two ground tanks/heavies, and sees no nearby base threat, it reserves credits for up to two aircraft. It pauses optional tech, turret and routine unit spending until the airfield is operational and credits cover the 1,600-credit aircraft plus 650 for emergency power. It then purchases through the existing paid queue. Unfinished airfields are not treated as operational. Threats immediately release the reserve for defensive recruitment; lost harvesters and power shortages are not ignored. Aircraft costs, build times, prerequisites, saves, artwork and combat statistics are unchanged.

## Verification and limits

Run `node tests/ai-aircraft-funding.test.mjs` for a real-engine three-faction regression covering the reserve boundary, unfinished airfields, paid queue and deployment, emergency threats, harvester replacement and save/load. This is a deterministic prerequisite-complete test. The existing `npm run balance:progression` remains the honest measure of whether contested matches naturally reach aircraft; results should be compared before claiming that the real-match gap is closed. Real browser and mobile performance are not measured.

## Post-airfield attrition recovery (27 October 2026)

The two-tank requirement still applies when saving for an **unbuilt** Air Command. After paying for the airfield, however, losing one of those tanks no longer cancels aviation savings: one surviving tank or heavy and no observed local invasion are sufficient to continue banking for the first or second aircraft. Without any surviving ground armour, ordinary defensive recruitment resumes. Power shortages, harvester loss and observed attacks still override the reserve. This targets the observed gap between controlled aircraft-production tests and contested matches without creating free aircraft or changing saves.

The expanded `tests/ai-aircraft-funding.test.mjs` verifies all three factions at 1,800 and 2,250 credits after losing one tank, paid deployment, saving for the second plane, and zero-tank recruitment. The 720-second progression laboratory remains the arbiter of **actual natural-match deployment**; do not infer a guaranteed improvement from the isolated regression alone.

## Base-defense priority at the Air Command purchase threshold (29 October 2026)

The AI already suspended **saving** for an Air Command while a sensor-visible
enemy unit was within eight tiles of an operational friendly building. However,
once credits reached the 1,750-credit Air Command price plus the 650-credit
generator reserve, the **purchase** branch no longer checked that threat.
An AI could therefore build optional aviation infrastructure while its base
was under an observed attack, despite its own defensive recruitment policy.

The paid Air Command purchase now requires no such observed base invasion.
Existing emergency turret construction and ordinary ground recruitment remain
eligible during an attack. When the attacker dies or retreats, the normal
aviation purchase threshold and prerequisite checks apply again. This changes
neither fog-of-war detection nor unit/building costs, saved fields, or assets.
The three-faction regression checks both the contested 2,400-credit boundary
and resumption after a threat disappears. This is a narrowly scoped tactical
priority fix, not evidence of improved survival in natural matches.

## Recover ore income before optional infrastructure (29 October 2026)

**Verified source failure mode:** when the AI has a completed refinery but
no surviving harvester, it can still satisfy the Air Command prerequisites.
At the ordinary 2,400-credit threshold, buying its 1,750-credit Air Command
first leaves 650 credits, below the 900 required for a replacement truck.
Because the AI has no free periodic income, this can strand recovery.

The construction planner now defers nonessential factory, radar, technology,
airfield and routine turret purchases while a completed refinery has no
living harvester. Its existing production planner then queues a **paid**
900-credit replacement if affordable. Generator/brownout recovery, missing
refinery construction and observed emergency base defense retain priority.
Once a replacement deploys, normal construction and aviation investment
resume. No credit grants, saved fields, unit costs or artwork are changed.

`tests/ai-aviation-investment.test.mjs` checks the real three-faction AI
planner at 2,400, 5,000 and 899 credits, paid refinery production, Air Command
resumption and legacy save/load. The deterministic unit test establishes the
economic deadlock prevention, **not** that natural 720-second matches gain
additional aircraft or fewer harvester losses. Full progression and economy
regression checks must pass before merging.

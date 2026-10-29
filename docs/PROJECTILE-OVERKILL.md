# Projectile overkill and veterancy correctness

**29 October 2026 · gameplay version 2.42.0 · save format unchanged.**

## Verified source defect

`updateProjectiles()` resolves every projectile before `step()` removes
destroyed entities. Its original target guard checked for a missing target,
friendly fire and projectile timeout, but **not a target whose HP was already
zero or negative**. When multiple attacks hit a low-health target during one
simulation tick, subsequent shots could apply more damage and invoke
`awardKill()` for additional attackers. `recordLoss()` already guards
against double-counting destruction statistics, but veterancy and hit effects
were not protected by that guard.

An earlier projectile could also remain in flight after another shot killed
its target, until the corpse was removed at the end of `step()`.

## Fix

After resolving the live entity ID, expire a projectile immediately if
`target.hp <= 0`. This happens before psychic capture, damage accounting,
impact particles, sounds, loss recording and kill awards. It does not alter
the damage or speed of a valid hit, retarget projectiles, add state to saves,
or modify the original art/audio assets.

## Regression and limits

`node tests/combat-economy.test.mjs` now exercises all three player factions:
two shots arriving in the same update, one valid kill and veterancy award,
exact damage and loss accounting, and an earlier-launched distant shot that
must expire on the next update after the target dies.

The complete CI verification additionally runs the existing nine-scenario
balance suite, 720-second natural AI progression, economy guard, aviation
tests and 120-unit benchmark. Those checks must pass before merging.
This is a combat-correctness fix, **not** evidence that the six persistent
natural-match harvester losses or absent natural aircraft have improved.
Interactive browser and mobile behavior still require real-device checks.

# AI refinery emergency defense (post-v2.42)

## Problem and evidence

The 30 October 2026 three-map, 720-second natural-match telemetry after PR #156 recorded a Verdant refinery loss and 68 subsequent AI decisions blocked by refinery recovery. The same run recorded 5 harvester losses and 5,040 Verdant ore income. These are observations from a deterministic headless match, not evidence that a tactical interception alone will prevent that loss.

Source inspection at main commit `850d61b1f7e8cb72aedb039694a2edf2067a0af3` confirmed that projectile launch and impact already triggered immediate tactical responses for attacked harvesters and radars, but not refineries. Ordinary AI base defense ran only on its strategic decision schedule. This creates a possible window for an observed tank or infantry attack to damage the refinery while a nearby defender waits for the next decision.

## Narrowly scoped change

`respondToAIRefineryAttack(shot,target)` is invoked on actual hostile projectile launch and on impact. It uses only currently visible enemy ground shooters, operational AI-owned refineries and living local ground defenders within 9 tiles of both shooter and refinery. It reuses the existing base-first `assignAIEngagements` planner and does **not** run the economic AI scheduler, create units, change production or read hidden enemy positions from projectiles.

Successful interceptions are rate-limited to one every four game seconds using a transient `nextRefineryResponseAt` value. Failed/hidden/out-of-range responses do not consume the cooldown. The field is reset on new matches and loading saves; no save-schema change or original asset modification.

## Regression coverage

`tests/ai-harvester-defense.test.mjs` now covers all three factions: visible tank launch, real impact, unchanged AI credits and next strategic tick, cooldown isolation from radar/harvester responses, hidden siege shots with legitimate visibility gained before impact, visible infantry/specialists, repeated fire, out-of-range defenders, unfinished refineries and v1 save/load.

The repository's full CI workflow additionally runs the 9-scenario ground balance matrix, three 720-second natural matches, the economy regression guard, aircraft tests and large-army benchmark. **Do not claim improved natural refinery survival unless the before/after progression artifacts show it.** A passing economy guard only establishes that its bounded regressions were not violated. Interactive desktop/mobile gameplay and frame-rate validation remain separate.

## Follow-up

Compare the new progression artifact against the preceding successful main run. If refinery destruction persists, inspect attacker position, defensive force proximity and whether the refinery is exposed beyond the 9-tile local response. Do not blindly widen the interception radius or introduce paid repairs: earlier economic experiments degraded natural income.

## Exact refinery-loss diagnostics (30 October 2026)

The headless match laboratory now installs `tools/refinery-loss-telemetry.mjs`
on each real game instance. It observes the **actual** `recordLoss` call and
the matching projectile's impact callback, rather than inferring refinery
destruction from radar blockers or nearby attackers. Every AI refinery loss
records the time, position, pre-impact HP, projectile damage, exact source ID
and kind, whether the shooter was visible to the AI, and up to eight nearby
ground defenders with their distance, eligibility and current attack target.

The record distinguishes successful launch/impact interceptions, absent or
hidden shooters, no eligible local defender, and eligible defenders that
were not targeting the shooter. These are diagnostic classifications, **not**
proof of the root cause of death. A defender targeting the shooter may still
lose the damage race. The tracer separately counts sold refineries and
unattributed losses; it never treats a sale as a hostile kill or guesses a
projectile source for a non-projectile loss. Reports cap captured deaths at
12 per scenario and count omitted records.

The new `aiRefineryLossTelemetry` scenario field and
`summary.aiRefineryLosses` / `summary.aiRefinerySales` counters are
additive. This change does not modify game.js, AI decisions, combat, sensors,
production costs, saves, or original assets. Three-faction integration tests
exercise a real lethal tank projectile, exact source attribution, tactical
response, sale isolation and unattributed losses. The existing CI natural
progression run will supply the first exact Verdant death evidence. Review
those artifacts **before** selecting a tactical change; passing regression
tests alone does not demonstrate improved refinery survival.

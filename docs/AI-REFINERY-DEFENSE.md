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

## Existing ground-armour refinery reserve (30 October 2026)

The exact Verdant death trace from main commit `e8b72c0164778b59ab93787d2829d04d98401888` records a visible
enemy tank killing the operational refinery at 167.8 seconds, with **zero**
surviving local ground defenders. Tactical interception cannot summon a unit
that no longer exists. Source inspection found that the initial AI tank is
eligible for the same offensive platoon as both opening riflemen; all three
can leave the economy undefended after an objective is discovered.

The Psionic AI now withholds **one already-owned, healthy tank or heavy tank within
seven tiles of a completed refinery** from offensive platoon and support
formation. It prefers the nearest eligible armour, leaves other soldiers
available for normal assaults, and does not change unit recruitment,
construction, costs or fog-of-war. The reserved unit remains eligible for
ordinary local target assignments and confirmed-shot emergency interception.
If it previously had a distant offensive order, it returns to guarding its
current nearby position; a visible attacker within nine tiles of the
refinery keeps its direct attack order. Retreating or distant armour is not
magically recalled, and a destroyed/unfinished refinery gets no reserve.

`tests/platoons-v19.test.mjs` exercises the actual strategic AI: initial
three-fighter force, larger infantry assault, visible local attack, missing
refinery, no free credits, and legacy save/load. The full CI economy guard,
natural 720-second progression and nine-scenario balance matrix must be
compared against the preceding main run before claiming better refinery
survival. This is a defensive allocation hypothesis, **not** a proven
survival improvement until those comparisons succeed. The cost may be
slower early assaults. Real browser/mobile playtesting remains outstanding.

### Regression-limited scope

The initial all-faction version passed focused tactical tests but failed the
three-map 720-second economy gate: Frostline/Federation ore fell from 9,360
to 5,400 (below the 9,000 historical baseline's 80% floor). It also
delayed Verdant/Psionic's refinery loss from 167.8 to 213 seconds and
increased Verdant ore from 5,040 to 7,200, without preventing eventual
refinery destruction. These are CI observations from the **rejected broader
candidate**, not merged production results.

Psionic's Viper tank has a 0.91 HP and 0.94 damage modifier, unlike
Federation's 1.18 HP and 1.13 damage modifier. The candidate therefore
limits the defensive reserve to Psionic commanders, leaving Coalition and
Federation's existing assault allocation unchanged. CI must independently
verify the narrowed candidate; do not infer the result from the broad run.

### Narrowed candidate verification (PR #159)

The full PR verification workflow at
https://github.com/shukritobi/chrono-dominion/actions/runs/41007116015
**passed**, including targeted platoon/recon regressions, all existing
gameplay tests, nine 240-second ground scenarios, three 720-second natural
matches, the AI economy regression gate and the XL 120-unit benchmark.

Compared with the preceding successful main-branch progression run:

| 720-second measure | Before | Psionic-only reserve |
| --- | ---: | ---: |
| Verdant/Psionic AI ore income | 5,040 | 7,200 |
| Verdant refinery destruction time | 167.8s | 213.0s |
| Desert/Coalition AI ore income | 21,960 | 21,960 |
| Frostline/Federation AI ore income | 9,360 | 9,360 |
| Total ore delivery ticks | 101 | 107 |
| AI harvester losses | 5 | 5 |
| Natural scenarios with aircraft | 1 | 1 |

Verdant income increased 42.9% and the refinery survived 45.2 seconds
longer. **It was still destroyed**, and at the final impact no eligible
local defender remained. This supports a meaningful but incomplete defensive
improvement, not a permanent survival fix. The early assault allocation
changes for Psionic, and human-played match quality remains unverified.


## Ground defender attrition and refinery coverage audit (30 October 2026)

The Psionic-only armour reserve in PR #159 delayed Verdant's refinery loss to
213.0 seconds and increased its ore income from 5,040 to 7,200, but the
refinery still died without an eligible nearby defender. Before changing AI
recruitment or tank stats, the natural-match laboratory now captures the
**actual sequence of AI ground-defender removals and deployments** alongside
local refinery coverage.

`tools/ai-ground-defense-telemetry.mjs` reads production-engine states before
and after each simulation step. It records the ID, kind, last HP, last order,
retreat state and distance to the refinery for each disappeared AI ground
combat unit; it records new ground units, nearby visible hostiles and the
current paid queue. A local defender means a living, completed ground combat
unit within nine tiles of an operational refinery. Exposure time is accumulated
only when both adjacent simulation snapshots show an operational refinery
without any local ground defender. Coverage gaps include their start and end
and whether a defender returned or the refinery was lost. All detailed lists
are capped; aggregate counts remain exact. A nearby enemy is **not** a proven
killer: these records explicitly label unit removals as unattributed.

The simulator adds `aiGroundDefenseTelemetry` per scenario and summary counts
for ground losses, local losses, reinforcements and unguarded refinery seconds.
The `AI GROUND DEFENSE SCENARIO` line is printed for each 720-second natural
match. `tests/ai-ground-defense-telemetry.test.mjs` covers hidden-opponent
exclusion, defender loss, paid-queue context, replacement, repeated empty
coverage, refinery destruction, bounded reports and read-only behavior.

This is **diagnostics only**. No change to `game.js`, player commands,
credits, pathfinding, save formats, faction balance or art. CI results must be
inspected to determine whether Verdant's reserved tank died, moved away,
retreated or was never replaced before selecting the next gameplay patch.

### First observed Verdant attrition chronology (PR #160 verification)

The first successful candidate workflow at
https://github.com/shukritobi/chrono-dominion/actions/runs/41012529357
recorded **16** Verdant/Psionic ground-combat unit losses, **11** within nine
tiles of the refinery, and **13** later deployments. The initial tank (ID 15)
disappeared at 55.0 seconds and a replacement tank (ID 36) at 74.4 seconds.
The final local soldier (ID 53) disappeared at 121.4 seconds, leaving an
uninterrupted unguarded-refinery interval until its destruction at 213.0
seconds: **91.6 seconds**. No new ground defender deployed after 120.8
seconds; the last gap began with 280 credits and no production queue.
The three-map 720-second income and survival baseline was unchanged:
Verdant 7,200, Desert 21,960, Frostline 9,360, five harvester losses and one
scenario with aircraft. These are observations from the deterministic
scripted-player benchmark, not human match balance or proof of the cause of
each defender death. Visible nearby enemies were numerous, but no exact
lethal ground-unit projectile attribution is implemented yet.

A follow-up change retains the final pre-destruction coverage samples rather
than overwriting them with post-refinery-loss frames, and rounds accumulated
exposure durations. Confirm the final PR workflow again before merging.


## Paid Psionic ground-screen recovery candidate (30 October 2026)

The main-branch 720-second Verdant trace after PR #160 showed no ground
defenders from 121.4s until refinery destruction at 213.0s. Its final
pre-loss coverage samples recorded zero defenders, no production queue,
and credits increasing from 808 at 161.6s to 1,528 at 178.0s.
The AI's construction priority previously never rebuilt a destroyed
**Barracks**: it could attempt factories, radar, technology and turrets
without restoring the cheapest infantry producer. This is a source-backed
recovery gap, but the trace does not establish whether the Barracks was
destroyed at the exact sampled time. The AI may also have lacked enough
credits at earlier decision ticks.

The proposed change applies **only to Psionic AI commanders** with a
completed refinery, at least one living harvester, no brownout, no critical
sole harvester, and zero surviving soldier/specialist/tank/heavy units.
It suspends optional construction and prioritizes a normally priced
500-credit Barracks if missing, preserving 650 credits for a generator.
Once a Barracks is complete, it buys one normally priced 200-credit soldier
through the existing queue. Optional radar/aviation banking cannot prevent
that first replacement; the power reserve is preserved unless a visible
base attack is underway. Queued units are never duplicated, and the
normal emergency ore-harvester purchase still takes precedence.

This does not spawn free defenders, modify faction stats, infer hidden
opponent locations, alter save schemas, or change Coalition/Federation's
established production priorities. It is a narrow **candidate gameplay
fix**, not proven refinery survival. Validate the focused platoon
regression, nine-scenario ground balance, three 720-second natural matches,
ore economy guard, save/load, and XL performance benchmark before merging.
Compare Verdant defender deployments after 121.4s, refinery loss time,
credits, and ore income to main commit 022a9e2a4ac4c7e4d51168f0ac62e21df14bd381.
If a complete Barracks already existed at 178s, investigate the production
queue/credit decision timeline rather than claiming a Barracks loss.


### Candidate PR #161: first complete CI comparison

The full verification workflow
https://github.com/shukritobi/chrono-dominion/actions/runs/41018679708
passed the focused platoon tests, nine-scenario balance, three natural
720-second matches, economy regression gate, aviation, save/load and
120-unit performance benchmark.

| Natural 720-second measurement | Main #160 | PR #161 candidate |
| --- | ---: | ---: |
| Verdant/Psionic ore credits | 7,200 | 7,560 |
| Verdant refinery destruction | 213.0s | 232.0s |
| Verdant ground reinforcements | 13 | 18 |
| Verdant ground losses | 16 | 20 |
| Verdant initial continuous uncovered interval | 91.6s until loss | 56.6s until new defender |
| Desert/Coalition ore credits | 21,960 | 21,960 |
| Frostline/Federation ore credits | 9,360 | 9,360 |
| Total ore delivery ticks | 107 | 108 |
| Harvester losses | 5 | 5 |
| Scenarios with AI Air Command | 1 | 1 |

The recovered defender appeared at 178s, followed by additional paid
soldiers at 186.2s, 194.4s and 202.6s. This establishes that the
candidate restored **actual paid ground production** after the previous
121.4s collapse. The refinery survived 19 seconds longer, and Verdant
earned 5% more ore credits. However, the refinery was still destroyed
at 232s with no eligible nearby defenders. Increased attrition (20 vs
16 ground losses) and the persistent lack of Verdant aviation remain
unresolved. A single deterministic scripted scenario does not establish
human-play balance or a general survival guarantee.


## Psionic single-armour-raider focus trial (30 October 2026)

**Scope:** An operational Psionic refinery within 6.5 tiles of exactly one
currently visible hostile tank or heavy tank may receive up to **three**
existing ground defenders from the ordinary nine-tile base-interception pool,
rather than two. The extra defender is already owned and must be able to
participate in normal ground engagements. No defender is spawned or paid for,
and the standard two-guard cap remains for Coalition/Federation, infantry
raids, multiple visible attackers and hidden contacts.

**Hypothesis, not yet a natural-match result:** A third local defender could
help stop a lone armour attacker before the Psionic refinery's remaining
screen is lost. The earlier telemetry shows 20 Psionic defender losses and a
refinery destruction at 232 seconds; a targeted focus-fire test alone cannot
prove better survival or reduced casualties. The rule intentionally avoids
retaining additional infantry at home or modifying recruitment, since the
broader infantry reserve experiment failed the natural economy guard.

**Acceptance:** Three-faction focused tests must confirm the exact
allocation boundaries, fog-of-war isolation, zero credit changes and v1
save compatibility. The full GitHub Actions nine-scenario balance lab, three
720-second natural matches and economy regression gate must pass before
merging. Compare refinery destruction time, Verdant income, defender losses,
harvester losses and Desert/Frostline income against the previous main
baseline. Do not describe the rule as a proven survival improvement unless
those matched simulations demonstrate it.

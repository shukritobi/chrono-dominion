# Natural-match AI harvester survival and income diagnostics

**27 October 2026 · gameplay version 2.42.0 · observation-only.**

## Why

Controlled aircraft funding tests pass, but 720-second natural skirmishes still rarely produce Air Command aircraft. Harvester losses, time without ore deliveries, and pressure on the mining routes may explain why the AI cannot rebuild radar or bank for aviation. Changing harvester retreat behavior without first measuring the trade-off reduced natural-match income and airfield construction in a separate, unmerged experiment (PR #54).

## Metrics

The production-engine `tools/simulate-matches.mjs` lab now adds `aiHarvesterTelemetry` to each scenario:

- `lost`: previously living AI harvester IDs absent after a simulation step.
- `damageObservations`: steps in which a surviving AI harvester's HP decreased. Not a projectile count.
- `cargoAtLoss`: the cargo held at the **start of the last observed step** before each harvester disappeared; an estimate, not exact ore loss.
- `deliveryTicks` and `deliveredOre`: simulation steps with an increase in actual AI delivered-ore statistics and the exact credited amount.
- `longestDeliveryGapSeconds`: longest interval since the last actual AI ore delivery, including the start of the match and the final interval.
- `threatenedSamples` / `harvesterSamples`: counts at 12-second sample intervals of AI trucks within five tiles of a hostile combat unit that the AI can currently see.

The summary aggregates losses, damage observations, last-seen cargo, delivery ticks and threat samples across scenarios. Existing JSON fields, report schema, gameplay logic, saves, AI spending, and assets are unchanged.

## How to verify

Run `node tests/ai-harvester-telemetry.test.mjs` for pure accounting regression coverage, then `npm run balance:progression` for the three 720-second natural AI matches or `npm run balance` for nine standard scenarios. CI runs both, plus the existing aviation laboratory.

Interpretation: these metrics identify *where* income may be interrupted, not whether a particular tactical change would improve competitive balance. The next step is to correlate low-income matches with harvester deaths, cargo losses, and delivery gaps, then trial one narrow fix against this unchanged baseline.

## Route and stalled-return diagnostics (28 October 2026)

The same real-engine lab now records **actual movement**, not a hypothetical
straight line to an ore deposit:

- `travelTiles` and `loadedTravelTiles`: sum of successive harvester position
  changes per simulation tick, including loaded return trips. These are
  observed traveled distances, **not** pathfinder requests or route lengths.
- `fullCargoStallSeconds`: time observed with a full 360-credit load and no
  measurable movement. `fullCargoStallEvents` counts each uninterrupted
  six-second episode once, avoiding normal short refinery unload pauses.
- `threatenedLoadedSamples` and `threatenedEmptySamples`: loaded vs empty
  harvesters with an **AI-visible** enemy combat unit within five tiles.
- `threatenedFarFromRefinerySamples`: those threatened samples at least five
  tiles from **every operational friendly refinery**, distinguishing exposed
  ore routes from fighting immediately outside the base.

Per-truck stall streaks remain internal to the diagnostic module and do not
appear in JSON or saves. All metrics are additive; the established ore-income
regression gate and gameplay rules remain unchanged. Route exposure is a
12-second sensor sample, not a guarantee that the truck took enemy fire.
A stationary loaded truck may be blocked by terrain, congestion or an
unavailable refinery: correlate stall events with ore delivery gaps before
changing the movement engine.

Verify with `node tests/ai-harvester-telemetry.test.mjs` and
`npm run balance:progression`. Use the per-scenario metrics to decide whether
the next narrow experiment should target loaded return paths, refinery exits,
or escort behavior. Do not infer a successful economy fix from these
observation-only changes.

## Per-stall return context (28 October 2026)

To distinguish a blocked refinery approach from unit traffic or a destroyed
refinery, the 720-second report now includes up to **12**
`fullCargoStallCases` per scenario. Each record is captured when a truck first
reaches six consecutive seconds of full-cargo immobility. It includes the
harvester ID, observed position and time, closest **operational** refinery and
distance, whether it is inside the 3.6-tile unload radius, the current
path target/terminal waypoint/next waypoint, traffic wait, narrow-lane wait
and yielding state. `fullCargoStallCasesOmitted` counts any additional
unrecorded episodes; the original stall-event and duration counters are
unchanged. Missing refineries and missing path state are explicit `null`.

These fields are **diagnostic snapshots, not root-cause labels**: a path target
may be stale and a six-second stall does not by itself prove an A* defect.
Only the AI's own truck positions and friendly operational refineries are
inspected; no unseen enemy information enters the report. The game, save
schema, AI economy and assets remain unchanged. Inspect the archived
`progression-report.json` from CI before changing refinery return routing.

## Refinery return-access audit (28 October 2026)

At the first six-second full-cargo stall, the natural-match report now
inspects the **actual next movement step** using the production engine's
collision rules. `returnAccess.nextStepClear` separates static terrain or
building obstruction from dynamic unit traffic for the direct step, axis
fallbacks and both lateral sidesteps. This does not call the lane-reservation
mutator, so `laneWaiting` remains a separate observation.

For the nearest operational friendly refinery, the audit searches legal
integer tile centers within the existing 3.6-tile unloading radius. It
accepts a destination only if the actual A* path reaches that exact tile,
rather than mistaking a partial path for success. The result includes
`reachableUnloadTile`, `unloadCandidatesChecked` and
`pathGoalInsideUnloadRange`. A null reachable tile means **no tile-center
route was demonstrated by this check**, not that no sub-tile route exists.

The inspection runs only when a stall first reaches six seconds and only
for the first twelve recorded cases. It is telemetry-only: no unit movement,
credits, AI planning, save format or original artwork changes. Run
`node tests/ai-harvester-telemetry.test.mjs` and
`npm run balance:progression` to inspect the archived stall cases before
attempting another refinery routing change.

## Movement versus collision separation audit (28 October 2026)

The natural-match laboratory now samples each **AI harvester carrying a full
360-credit load** at three exact points: the beginning of a simulation tick,
immediately before `separateUnits()`, and immediately after it. The difference
between the first two positions is movement attempted by the real engine; the
difference between the last two is displacement introduced by unit separation.

The new `aiHarvesterSeparation` report measures loaded frames, distance moved
before separation, distance displaced by separation, final net distance,
frames where separation opposed the attempted movement, near-cancelled
movement, and frames where no movement was attempted at all. Each
`fullCargoStallCases[].returnAccess.separationMotion` includes a bounded
six-second summary for that specific truck. This separates a harvester that
never advances from one whose advance is repeatedly undone by traffic
separation. It does **not** prove the underlying reason for either behavior.

The sampling wrapper exists **only in the headless simulation**; the
production engine, saves, AI spending and art are untouched. History is
non-serializable and limited to 64 samples per truck and six seconds.
Run `node tests/harvester-separation-telemetry.test.mjs` for pure diagnostics
and `npm run balance:progression` for natural-match observations. Compare
the new measurements with the three previously observed Frostline stalls
before attempting a movement correction; any change must still pass
`npm run balance:regression`.

### First verified natural-match result (28 October 2026)

PR verification ran the complete nine-scenario matrix and three 720-second
natural matches successfully. The extended matches recorded **3,092 loaded
harvester frames, zero opposing-separation frames and zero near-cancelled
frames**. Each of the three Frostline six-second stall cases showed **31/31
frames without a meaningful pre-separation movement attempt**, with zero
separation displacement. The existing ore economy regression guard passed
with the unchanged 3,960 / 15,120 / 9,000 AI ore-income baseline.

This **rejects the previous collision-separation rollback hypothesis** for
the reproduced stalls. The next investigation should instrument why the
normal movement routine fails to advance (e.g. lane admission, dynamic
occupancy, stun or stale waypoints), rather than adjusting `separateUnits()`
blindly. A clear step in the snapshot collision probe does not prove that
the live `move()` call passed its lane checks.


## Live movement rejection tracing (28 October 2026)

The headless match laboratory now wraps the real `move()` call **only for AI
harvesters with full cargo**. The wrapper delegates every normal occupancy and
lane-admission decision exactly once; it never changes a route, order, collision
result, credit, or save. When an occupancy probe rejects a position, a second
**read-only** static-only probe distinguishes terrain/buildings from dynamic
unit traffic. Lane admission is never repeated because it mutates reservations.

The `aiHarvesterMove` metrics count loaded movement calls, calls without
meaningful progress, empty-path outcomes, static and traffic probe rejections,
lane denials, and full-cargo frames where `move()` was never called. A
`stunnedNoCallFrames` subset is identified from the tick-start stun timer.
These are **probe counts**, not distinct blocked harvesters or confirmed root
causes. In particular, pathfinding and traffic-yield logic may also query
occupancy while a movement call is active.

Each `fullCargoStallCases[].returnAccess.moveDecision` summarizes the last
six seconds for that truck: move/no-call frames, static/traffic/lane rejections,
net movement, and the last attempted destination, path length, waypoint,
recheck timer, traffic wait and stuck timer. The rolling per-truck history is
private, limited to 64 samples and six seconds, and excluded from JSON and
save data. A missing call can also reflect normal unloading or a missing
refinery; correlate it with the existing unload-distance and separation
snapshots before deciding on a gameplay correction.

Verify with `node tests/harvester-move-telemetry.test.mjs`,
`npm run balance:progression`, and the unchanged
`npm run balance:regression` economy guard. Do not infer improved harvesting
from instrumentation alone.

## Full-cargo harvester detour around an immovable friendly unit (28 October 2026)

The production movement engine now has a narrow fallback when a **full (360-credit) harvester** is blocked by a friendly **Hold-position** unit. Previously, the loaded truck had priority, asked the stationary blocker to move, and stopped when the sentry refused. The truck can now attempt its **own** temporary lateral pocket using the same collision, A* reachability and terrain checks already used for ordinary right-of-way maneuvers. The fallback applies only to Hold-position blockers after a real movement stall triggers `tryTrafficYield`; ordinary moving or stunned blockers keep the original priority behavior because broad fallback detours failed the natural-match economy gate (PR #71, initial revision). it never forces Hold units to move, teleports through buildings, or changes the refinery target, harvesting income, production costs or save format.

Regression: `node tests/right-of-way-v16.test.mjs` checks a parked friendly Hold sentry, actual truck movement into a passing pocket and an impossible water-bounded corridor. `npm run balance:regression` must pass before merge. This addresses **one** potential congestion mechanism, not every Frostline stall; measure `fullCargoStallEvents` and ore income in the 720-second simulation separately.

## Per-stall physical traffic blocker identities (28 October 2026)

The headless loaded-harvester movement tracer now attributes each dynamic
occupancy rejection to units whose **actual collision circles** intersect the
rejected step. The six-second `moveDecision.trafficBlockers` summary contains
at most five blocker IDs, owners, kinds, stances, yielding flags and probe
counts, sorted by rejection frequency. This distinguishes a stationary Hold
sentry from a nearby nonblocking bystander and shows whether the same unit
repeatedly blocks a loaded return route. These are **probe counts**, not unique
collisions or proof of a root cause; enemy identities may appear in diagnostic
reports but are never passed to the in-game AI planner.

The wrapper delegates all original movement, lane and occupancy decisions.
There are no gameplay, save, asset or economy changes. The per-truck history
still expires after six seconds. Verify with
`node tests/harvester-move-telemetry.test.mjs` and the natural-match economy
guard. An experimental lane-aware yield-selection change (PR #73) failed the
AI income regression gate even when restricted to player-owned trucks, so it
remains unmerged; use these blocker IDs before another gameplay experiment.


## Airborne units excluded from ground traffic cost (28 October 2026)

The ground traffic-cost heat map previously included aircraft, even though
aircraft operate on a separate altitude layer and do not block ground units.
Congestion-aware A* now excludes aircraft, avoiding unnecessary detours when
planes fly over a harvester or infantry route. Ground vehicles and infantry
continue to incur the original traffic penalties. No save format, flight
behavior, production cost or art assets change.

A separate trial allowing full harvesters to detour around idle Guard sentries
failed the three-map natural-match economy gate (Verdant 3,240; Desert 9,360;
Frostline 5,040 enemy ore, compared with 3,960 / 15,120 / 9,000 baseline;
49 vs 78 ore delivery ticks). The Guard change was **reverted** and not merged.
The three Frostline Guard blockers remain a separate unresolved issue.

Regression: `tests/navigation-v15.test.mjs` verifies aircraft do not add
congestion cost or bend a clear ground route, while a real ground soldier
still triggers a traffic-aware detour.

## Zero-displacement axis fallback correction (28 October 2026)

The archived 720-second Frostline report from the verified main-branch run
[40636530796](https://github.com/shukritobi/chrono-dominion/actions/runs/40636530796)
records three full-cargo stalls. Two are especially diagnostic: at times
430.2 and 495.2 seconds, trucks sit at approximately **(23, 20.81)** with
next waypoint **(23, 20)**, while friendly Guard infantry block the northward
step. In both six-second histories, the engine accepts 31 lane checks but
makes no meaningful forward progress. A third stall at 146.6 seconds involves
two Guard soldiers and a diagonal waypoint; this separate case is not covered
by the same direct-axis mechanism.

The production `move()` fallback previously tried the X-only position after
a blocked diagonal step even when `vx === 0`. That probe is simply the
unit's current position, so it usually passes occupancy and lane checks,
resets the stuck timer, and prevents the symmetric lateral sidesteps from
running. A due-east/west movement similarly risks accepting a zero-length
Y-only fallback. The correction skips an axis fallback when its displacement
is effectively zero (`<= 1e-6`) **only for fully loaded harvesters**, allowing
the existing collision-checked alternative axis or lateral sidestep to run.
An initial all-unit experiment passed the targeted tests but **failed** the
natural economy gate: Desert AI ore fell to 5,400 (baseline 15,120), deliveries
to 53 (baseline 78), and operational AI airfields to zero (baseline one).
That broad change was rejected; ordinary ground units retain their existing
movement fallback. The scoped version still requires independent CI verification.
It does **not** force another unit to yield, change pathfinding goals, ignore
water, alter save fields, or add a new navigation rule.

`tests/navigation-v15.test.mjs` reproduces the northbound and westbound
cases with real harvesters, Guard soldiers and engine collision checks. The
nine-map balance test, three 720-second natural matches and unchanged AI
economy regression guard must also pass before merging. This is a targeted
movement bug fix, **not** a claim that all three Frostline stalls or natural
AI aircraft production are resolved; compare fresh telemetry before making
that conclusion.

## Local AI ore-truck defense (29 October 2026)

A visible enemy can threaten a harvester outside the AI headquarters' eight-tile
invasion radius. Previously, the engagement planner only explicitly assigned
defenders to base invaders; other fighters acquired enemies opportunistically
inside their own approximately 6.5-tile tactical detection radius. A worker
could therefore spot an attacker without a slightly more distant friendly tank
receiving an intercept order.

The engagement planner now considers **currently visible ground threats within
4.5 tiles of a living friendly harvester**, after assigning urgent base defenders
and before its normal opportunistic targeting. It can divert at most **two**
uncommitted ground fighters per decision, each within 8.5 tiles of the attacker
and nine tiles of the threatened worker. A distant fighter already committed to
an attack-move formation is not pulled away. Recon patrols and wounded retreat
rules remain unchanged. Aircraft and enemy ore trucks are not escort targets.
The planner does not use stale intelligence or unseen live enemy positions:
its candidate list is already filtered through the AI's real shared sensors.

This is a defensive **engagement-order change**, not a harvester teleport,
automatic healing, resource grant or new save field. Existing construction,
worker pathfinding and production costs remain unchanged. Three-faction
regressions in `tests/ai-harvester-defense.test.mjs` cover shared visibility,
hidden contacts, destroyed workers, base-first priorities, committed assault
orders, the two-escort cap and legacy save/load. The complete nine-scenario
balance and three 720-second natural matches must pass the existing economy
guard before merging. A local escort assignment alone does **not** establish
fewer harvester losses or natural aircraft production; compare those measured
outcomes with the prior six-loss, 3,960 / 15,120 / 9,000-income baseline.


## Pre-step harvester-loss exposure snapshots (29 October 2026)

The real-engine natural-match report now includes up to **12** `aiHarvesterTelemetry.lossCases` per scenario and `lossCasesOmitted` for further disappearances. Each snapshot records last observed truck position, HP and cargo, distance to the nearest operational refinery, up to four **AI-sensor-visible** nearby enemy combat units (seven-tile radius), and up to four nearby living friendly ground fighters (nine-tile radius), including their pre-step orders. Separate omitted counters bound contact lists; summary counts report captured and omitted loss cases.

Enemy visibility and friendly orders are sampled **before** the simulation step that removes the worker; post-step inspection alone could miss an attacker destroyed in the same tick. These are exposure snapshots, **not actual killer attribution**, proof that a defender could intercept, or evidence that the worker was destroyed rather than removed for another reason. Zero visible threats means none were observed by the AI at that instant, not that the worker was safe. This observation-only code does not change gameplay AI, saves, combat, credits, movement or artwork.

Verify with `node tests/ai-harvester-telemetry.test.mjs`, `npm run balance:progression` and `npm run balance:regression`. Inspect archived cases before trialing another defense or routing change; compare the prior six worker losses and 3,960 / 15,120 / 9,000 ore-income baseline before claiming improvement.

## Ranged ore-route threat interception (29 October 2026)

The production AI's local harvester escort planner previously reacted to
sensor-visible enemy ground units only when they were within 4.5 tiles of a
living ore truck. A Siege Tank has a five-tile weapon range, so that fixed
trigger could leave an exposed worker inside firing range before the first
escort assignment. The planner now uses the **actual enemy unit's weapon
range plus 1.4 tiles**, retaining the old 4.5-tile minimum and a strict
seven-tile maximum. This applies only to **currently visible ground
attackers**; unseen units and aircraft do not become ground escort targets.

Existing limits remain: up to two escorts per AI decision, a defender within
8.5 tiles of the attacker and nine tiles of the worker, base defense first,
and protection of distant attack-move formations. This does not automatically
reposition defenders before a threat is observed or guarantee that a
defender exists. No new save fields, resource grants, production costs,
unit statistics, player controls or artwork were introduced.

The three-faction [escort regression](../tests/ai-harvester-defense.test.mjs)
tests a scout-spotted siege tank outside the ordinary defender acquisition
radius, rejects more distant threats, keeps short-range infantry at the
old trigger, and rejects targets after the only observer disappears.
The 720-second natural-match progression and economy regression gate must
be checked separately: passing these focused tests **does not prove** that
harvester losses decrease, income increases, or aircraft are produced.


## Proactive spare-armour ore-route screen (29 October 2026)

After reactive escorts were shown to work in targeted tests but natural matches still lost six harvesters, the AI now stages **at most one uncommitted tank or heavy** in a reachable lateral pocket roughly 5–6 tiles behind and laterally offset from an exposed, currently safe harvester. It runs after normal platoon, base-defense and visible-engagement planning, and only when another healthy armoured defender remains within eight tiles of HQ. The unit must already be within 11 tiles of HQ and 13 of the worker; no assault, Hold, retreating or actively engaged unit is diverted. Workers within seven tiles of HQ, workers with AI-visible enemies within seven tiles, and workers already covered by armour do not trigger staging. All four neighboring grid tiles must be walkable to avoid narrow ore chokepoints, and the staging point must be at least 5.4 tiles from the worker. A* must actually reach the destination; no teleports, credits or new saved state are introduced. A new move order uses the existing save format.

This is deliberately a narrow **pre-contact reserve placement**, not a permanent escort contract. Coordinated platoons may still recruit a staged unit on later decisions. The three-faction regression in `tests/ai-harvester-defense.test.mjs` checks safe staging, HQ coverage, combat/assault protection, visible threats, nearby workers and save/load. The full 720-second natural-match economy guard remains the acceptance gate: do not claim reduced harvester losses until those results demonstrate it.

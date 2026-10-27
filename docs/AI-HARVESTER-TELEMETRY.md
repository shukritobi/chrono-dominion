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

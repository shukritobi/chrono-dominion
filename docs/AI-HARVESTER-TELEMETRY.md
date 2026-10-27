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

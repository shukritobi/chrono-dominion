# Aircraft and Skyguard engagement laboratory

**Added:** 27 October 2026, after v2.41.0. **Engine:** production `game.js`.

## Why this exists

The nine-case `tools/simulate-matches.mjs` matrix measures ground economy,
reconnaissance and assault activity, but its latest reported runs had **no
aircraft or Air Commands**. Passing those checks did not verify aircraft
survivability or anti-air combat. This is a separate, deterministic air-specific
exercise; it does not alter the existing ground balance baseline.

## Scenarios

`npm run balance:air` runs six 35-second simulations at 0.2-second steps:
Coalition, Federation and Psionic aircraft each attack a generator with
and without a powered enemy Skyguard battery. Each has a friendly powered
Air Command. The AI strategic scheduler is disabled to keep the same
controlled positions and target across comparisons; movement, automatic
defense targeting, real projectiles, impact damage, ammunition exhaustion,
airfield travel and rearming still run through `game.step()`.

For every encounter the tool records aircraft/Skyguard shots, actual dealt
damage, minimum aircraft hull, aircraft losses, rounds reloaded, servicing
time and target hull. It requires the aircraft to fire and land hits in every
scenario; Skyguard must acquire, fire and damage aircraft in all three defended
cases; unopposed aircraft must return, reload and survive. A JSON report is
available via `node tools/simulate-air-engagements.mjs --out=air-report.json`.

The full GitHub Actions verification runs this exercise and archives its
JSON alongside the nine-scenario ground balance report. Failure in any
assertion fails CI.

## Interpretation and remaining work

This provides a repeatable combat baseline, **not** a statistically valid
competitive win-rate estimate. Starting positions, one aircraft per encounter,
a stationary generator objective and disabled strategic AI do not represent
normal mixed-army battles. The results also do not measure browser FPS or
physical mobile performance. Next add mixed anti-air formations, multi-aircraft
sorties and AI-produced aircraft in longer scenarios, then compare survival,
rearm cycles and player experience on real devices.

## Extended aviation regression (27 October 2026)

The same `npm run balance:air` command now also exercises **six three-aircraft
sorties**: each faction attacks a reinforced objective with no dedicated
anti-air battery or with two powered Skyguards. These scripted encounters
verify simultaneous projectile fire, hull damage, ammunition bounds, survival
in unopposed controls, rearming, power supply and nonnegative repair balances.
The lab reports wing losses and service cycles without requiring any
particular defended-case loss rate.

Three additional **AI production checks** prepare a powered, prerequisite-
complete base for each enemy faction, then call the real strategic AI planner.
They verify that the AI pays for an aircraft, queues it, deploys it through
the normal production pipeline and records the deployment. The setup supplies
existing technology and scouts, so this is not a claim that ordinary AI will
reach aviation within a short 240-second ground simulation.

The JSON schema is now `chrono-dominion-air-exercise-v2`, with the original
`results` preserved and additional `wingResults` and `aiProduction` arrays.
The original six control results remain comparable with earlier reports.
There are now **15 scenarios** in the aviation lab. This is deterministic
headless coverage, not human competitive balancing or physical-device FPS.
